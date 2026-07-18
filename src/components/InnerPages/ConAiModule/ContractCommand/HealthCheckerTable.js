import React, { useMemo, useState, useEffect } from "react";
import CustomDataTable from "../../../../genriccomponents/ReactTable";
import ActionMenu from "../../../../genriccomponents/ActionMenu";
import NoDataFound from "../../../../genriccomponents/NoDataFound";
import {
  get_checker_list,
  delete_HealthChecker_data,
  health_checker_detail,
  countAccess,
} from "../../../../services/techus-services";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { showToast } from "../../../../genriccomponents/techus-ToastNotification";
import FullPageLoader from "../../../../genriccomponents/loaders/FullPageLoader";
import { ShimmerTable } from "react-shimmer-effects";
import { capitalizeFirstLetter } from "../../../../utils/commonUtils";
import DeleteModal from "../../../../genriccomponents/DeleteModal";
import FilterDropdown from "../../../../genriccomponents/FilterDropdown";
import TextWithTooltip from "../../../Common/ToolTip";
import usePermissions from "../../../Common/usePermissions";
import UnlockUpgradeModal from "../../../../genriccomponents/UnlockUpgradeModal";
import { useEstimation } from "../../../context/EstimationContext";


const HealthCheckerTable = () => {
  const [healthCheckerData, setHealthCheckerData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeMessage, setUpgradeMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const { permissions } = usePermissions("contract_audit", "contract_command");
  const { isMarkAsCompleted } = useEstimation();
  const [deleteTarget, setDeleteTarget] = useState(null);
  const projectIdFromRedux = useSelector((state) => state.project?.project_id);
  const projectUuidFromRedux = useSelector(
    (state) => state.project?.project_uuid,
  );

  const [filters, setFilters] = useState({
    status: "",
    sortBy: "",
  });
  const projectId = projectIdFromRedux || localStorage.getItem("project_id");
  const projectUId =
    projectUuidFromRedux || localStorage.getItem("project_uuid");
  const organizationId = localStorage.getItem("organization_id");

  const navigate = useNavigate();

  // ── Fetch trade categories ─────────────────────────────────────────────────

  // ── Fetch checker list ─────────────────────────────────────────────────────
  const fetchHealthCheckerList = async () => {
    if (!projectId) return;
    setIsLoading(true);
    try {
      const res = await get_checker_list({ project_id: projectId });
      if (res?.valid) {
        setHealthCheckerData(Array.isArray(res.data) ? res.data : []);
      } else {
        setHealthCheckerData([]);
      }
    } catch (error) {
      console.error("Failed to fetch Health Checker list:", error);
      setHealthCheckerData([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHealthCheckerList();
  }, [projectId]);

  // ── Delete ─────────────────────────────────────────────────────────────────
  const handleDeleteClick = (row) => setDeleteTarget(row);

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      setIsSubmitting(true);
      const res = await delete_HealthChecker_data({
        checker_id: deleteTarget.checker_id,
      });
      if (res?.valid) {
        setHealthCheckerData((prev) =>
          prev.filter((item) => item.checker_id !== deleteTarget.checker_id),
        );
        showToast("success", res?.message);
      } else {
        showToast("error", res?.message);
      }
    } catch (error) {
      console.error("Failed to delete Health Checker:", error);
      showToast("error", "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
      setDeleteTarget(null);
    }
  };

  // ── Progress ───────────────────────────────────────────────────────────────
  const getProgress = (row) => {
    let percent = 0;
    if (row?.response_text) percent = 100;
    else if (row?.checker_name) percent = 50;

    let color = "#e5e7eb";
    if (percent === 100) color = "#22c55e";
    else if (percent === 50) color = "#ff9500";

    return { percent, color };
  };

  // ── Edit ───────────────────────────────────────────────────────────────────
  const handleEdit = async (row) => {
    const checkerUuid = row?.checker_uuid;
    try {
      setIsSubmitting(true);
      const res = await health_checker_detail({ checker_uuid: checkerUuid });
      if (res?.valid) {
        const detailData = res?.data;
        const content =
          JSON.parse(detailData?.response_text || "{}")?.content || [];
        navigate(
          `/project/view/${projectUId}/contract-command/contract-audit/update/${checkerUuid}/generate`,
          {
            state: {
              prefillData: detailData,
              healthCheckerData: {
                checker_id: detailData?.checker_id,
                data: { content },
              },
            },
          },
        );
      } else {
        showToast("error", res?.message || "Failed to fetch checker details.");
      }
    } catch (error) {
      console.error("Failed to fetch checker detail:", error);
      showToast("error", "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleView = (row) => {
    navigate(
      `/project/view/${projectUId}/contract-command/contract-audit/view/${row.checker_uuid}`,
    );
  };

  const handleCreateContractAudit = async () => {
    try {
      setIsSubmitting(true);
      const raw = await countAccess({
        organization_id: organizationId,
        project_id: projectId,
        module_name: "contract_audit",
      });
      const response = typeof raw === "string" ? JSON.parse(raw) : raw;

      if (response?.allowed) {
        navigate(
          `/project/view/${projectUId}/contract-command/contract-audit/add`,
        );
        return;
      }

      setUpgradeMessage(
        response?.message ||
        "You have reached your contract audit limit. Upgrade your package to create more.",
      );
      setShowUpgradeModal(true);
    } catch (error) {
      console.error("countAccess error:", error);
      showToast("error", "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Columns ────────────────────────────────────────────────────────────────
  const columns = [
    {
      name: "NAME",
      selector: (row) => capitalizeFirstLetter(row.checker_name),
      sortable: true,
      width: "25%",
      cell: (row) => {
        const { percent } = getProgress(row);

        return (
          <div
            onClick={() => {
              if (percent !== 100) return;
              navigate(
                `/project/view/${projectUId}/contract-command/contract-audit/view/${row.checker_uuid}`,
                {
                  state: {
                    isView: true,
                    rowData: row,
                  },
                },
              );
            }}
            className={`tw-block tw-w-full tw-max-w-full tw-overflow-hidden hover:tw-text-blue-600 ${percent === 100 ? "tw-cursor-pointer" : "tw-cursor-default"
              }`}
          >
            <TextWithTooltip
              text={capitalizeFirstLetter(row.checker_name)}
              width="100%"
            />
          </div>
        );
      },
    },

    {
      name: "ISSUES IDENTIFIED",
      selector: (row) => {
        const value = row.issue_identified ?? 0;
        return value > 0 ? value - 1 : 0;
      },
      sortable: true,
      width: "35%",
      center: true,
    },
    {
      name: "Last Updated",
      cell: (row) => {
        if (!row.start_date) return "-";
        const d = new Date(row.start_date);
        const day = d.getDate();
        const month = d.toLocaleString("en-US", { month: "short" });
        return `${day} ${month}, ${d.getFullYear()}`; // "24 Mar, 2026"
      },
      sortable: true,
      width: "20%",
    },
    // {
    //   name: "TIMELINE",
    //   cell: (row) => <ProjectTimeline startDate={row.start_date} endDate={row.end_date} />,
    //   center: true,
    //   width: "18%",
    // },
    // {
    //   name: "PROGRESS",
    //   center: true,
    //   width: "16%",
    //   cell: (row) => <ProgressRingCell row={row} />,
    // },
    {
      name: "ACTIONS",
      center: true,
      width: "10%",
      cell: (row) => (
        <ActionMenu
          onView={() => handleView(row)}
          onEdit={() => handleEdit(row)}
          deleteDisabled={isMarkAsCompleted}
          onDelete={() => handleDeleteClick(row)}
          showView={permissions?.view}
          showEdit={false}
          // showEdit={permissions?.edit}
          showDelete={permissions?.delete}
        />
      ),
    },
  ];

  // ── Static filter options ──────────────────────────────────────────────────
  const statusOptions = [
    "All Status",
    "Completed",
    "In Progress",
    "Not Started",
  ];
  const sortOptions = ["All ", "Newest", "Oldest"];

  const handleFilterChange = (key, option) => {
    if (option === "All Status" || option === "All ") {
      setFilters((prev) => ({ ...prev, [key]: "" }));
    } else {
      setFilters((prev) => ({ ...prev, [key]: option }));
    }
  };

  // ── Filtered & sorted data ─────────────────────────────────────────────────
  const filteredDetails = useMemo(() => {
    let result = (healthCheckerData || []).filter((d) =>
      d?.checker_name
        ?.toLocaleLowerCase()
        .includes(searchQuery.trim().toLocaleLowerCase()),
    );
    if (filters.status) {
      result = result.filter((d) => {
        const { percent } = getProgress(d);
        if (filters.status === "Completed") return percent === 100;
        if (filters.status === "Not Started") return percent === 0;
        if (filters.status === "In Progress") return percent === 50;
        return true;
      });
    }

    if (filters.sortBy === "Newest") {
      result = [...result].sort(
        (a, b) => new Date(b.start_date) - new Date(a.start_date),
      );
    } else if (filters.sortBy === "Oldest") {
      result = [...result].sort(
        (a, b) => new Date(a.start_date) - new Date(b.start_date),
      );
    }
    return result;
  }, [searchQuery, healthCheckerData, filters]);
  const isInitialEmpty = healthCheckerData.length === 0;
  const isFilteredEmpty =
    filteredDetails.length === 0 && healthCheckerData.length > 0;
  const isProjectContextLoading = !projectId && !!projectUId;

  // ── Render ─────────────────────────────────────────────────────────────────
  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="section">
      {isSubmitting && <FullPageLoader />}
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        closeOnClick
        pauseOnHover
      />

      {/* <DeleteConfirmModal
        show={!!deleteTarget}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Health Checker"
        message={`Are you sure you want to delete "${deleteTarget?.checker_name}"? This action cannot be undone.`}
      /> */}
      {!!deleteTarget && (
        <DeleteModal
          action="delete"
          entity="Health Checker"
          icon="icon-Delete"
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleDeleteConfirm}
        />
      )}

      {/* Header */}
      <div className="header tw-mt-2 tw-flex tw-justify-between tw-items-center tw-mb-8">
        <div className="tw-flex tw-items-center tw-gap-2 tw-text-[20px]">
          <div>
            <div className="tw-flex tw-items-center tw-gap-2">
              <span className="tw-text-[20px] tw-text-gray-600 tw-font-medium">
                Contract Command
              </span>
              <i className="icon-Save-and-Continue" />
              <span className="tw-text-[20px] tw-font-bold tw-text-gray-900">
                Contract Audit
              </span>
            </div>
            <p className="tw-text-[#1e293b] tw-text-[14px]">
              Checks overall contract health before execution by identifying
              inconsistencies, gaps, and priority fixes.
            </p>
          </div>
        </div>
        {permissions?.create_draft && (
          <button
            onClick={isMarkAsCompleted ? undefined : handleCreateContractAudit}
            disabled={isMarkAsCompleted}
            className={`group tw-flex tw-items-center tw-gap-2 tw-text-white tw-font-normal tw-px-4 tw-py-2 tw-rounded-md tw-shadow-sm tw-flex-shrink-0 tw-whitespace-nowrap
      tw-transition-all tw-duration-300 tw-ease-in-out
      ${isMarkAsCompleted
                ? "tw-bg-[#94a3b8] tw-cursor-not-allowed tw-opacity-60"
                : "tw-bg-[#1f4ed8] hover:tw-bg-[#1b44c4] hover:tw-shadow-lg hover:tw-shadow-blue-200/50 hover:tw-scale-[1.03] hover:-tw-translate-y-[1px] active:tw-scale-[0.98]"
              }`}
          >
            <i className="icon-New" /> <span>Create Contract Audit</span>
          </button>
        )}
      </div>

      {/* Table */}
      {isLoading || isProjectContextLoading ? (
        <div className="tw-bg-white tw-rounded-xl tw-border tw-border-gray-200 tw-shadow-sm tw-p-4">
          <ShimmerTable row={5} col={7} />
        </div>
      ) : (
        <CustomDataTable
          columns={columns}
          data={filteredDetails}
          enablePagination={true}
          defaultPerPage={10}
          searchTerm={searchQuery}
          noDataComponent={
            <NoDataFound
              title="No Contract Audit Found"
              description={
                isFilteredEmpty
                  ? "No contract audit match your search or filter criteria."
                  : "No contract audit available."
              }
              buttonLabel={null}
            />
          }
          // onSearchChange={(val) => setSearchQuery(val)}
          onSearchChange={isInitialEmpty ? null : setSearchQuery}
          noDataTitle="No Contract Audit Found"
          searchPlaceholder="Search"
          customStyles={{
            headRow: {
              style: {
                backgroundColor: "#ffffff",
                borderBottom: "1px solid #edf2f7",
                minHeight: "56px",
              },
            },
            headCells: {
              style: {
                fontSize: "14px",
                color: "#6e7178",
                textTransform: "uppercase",
                paddingLeft: "20px",
                paddingRight: "20px",
              },
            },
            rows: {
              style: {
                minHeight: '58px',
                borderBottom: '1px solid #EAECF0',
                transition: 'background-color 0.15s ease',
                '&:last-of-type': { borderBottom: 'none' },
                '&:hover': {
                  backgroundColor: '#f8faff',
                  cursor: 'pointer',
                },
              },
            },
            cells: {
              style: {
                fontSize: "14px",
                color: "#4a5568",
                paddingLeft: "20px",
                paddingRight: "20px",
                paddingTop: "10px",
                paddingBottom: "10px",
              },
            },
          }}
          filterComponent={
            isInitialEmpty ? null : (
              <div className="tw-flex tw-gap-3 tw-flex-wrap">
                <FilterDropdown
                  options={statusOptions}
                  value={filters.status}
                  onChange={(o) => handleFilterChange("status", o)}
                  placeholder="All Status"
                  width="tw-w-[11.25rem]"
                />

                <FilterDropdown
                  options={sortOptions}
                  value={filters.sortBy}
                  onChange={(o) => handleFilterChange("sortBy", o)}
                  placeholder="Sort By"
                  width="tw-w-[9rem]"
                />
              </div>
            )
          }
        />
      )}
      <UnlockUpgradeModal
        open={showUpgradeModal}
        message={upgradeMessage}
        onClose={() => setShowUpgradeModal(false)}
      />
    </div>
  );
};

export default HealthCheckerTable;
