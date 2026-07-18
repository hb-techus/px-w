import React, { useMemo, useState, useEffect } from "react";
import CustomDataTable from "../../../../genriccomponents/ReactTable";
import ActionMenu from "../../../../genriccomponents/ActionMenu";
import FilterDropdown from "../../../../genriccomponents/FilterDropdown";
import NoDataFound from "../../../../genriccomponents/NoDataFound";
import {
  get_RFI_list,
  delete_RFI_data,
} from "../../../../services/techus-services";
import { useNavigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { showToast } from "../../../../genriccomponents/techus-ToastNotification";

import FullPageLoader from "../../../../genriccomponents/loaders/FullPageLoader";

import { ShimmerTable } from "react-shimmer-effects";
import { capitalizeFirstLetter } from "../../../../utils/commonUtils";
import TextWithTooltip from "../../../Common/ToolTip";
import DeleteModal from "../../../../genriccomponents/DeleteModal";
import usePermissions from "../../../Common/usePermissions";
import { countAccess } from "../../../../services/techus-services";
import upgradImg from "/src/assets/Images/no_data_images/upgrade_1.webp";
import { useEstimation } from "../../../context/EstimationContext";
const RFIDrafterTableLayout = () => {
  const [rfiData, setRfiData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
   const [showUpgradeModal, setShowUpgradeModal] = useState(false);
    const [upgradeMessage, setUpgradeMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
   const { isMarkAsCompleted} = useEstimation();
  const { permissions, packagePermissions } = usePermissions('rfi_drafter', 'contract_command');
  console.log(permissions)
  console.log(packagePermissions)

  const [filters, setFilters] = useState({
    category: "",
    status: "",
    sortBy: "All",
  });

  const projectId = localStorage.getItem("project_id");
  const organizationId = localStorage.getItem("organization_id");
  const projectUId = localStorage.getItem("project_uuid");

  // Holds the row pending deletion — null means modal is closed
  const [deleteTarget, setDeleteTarget] = useState(null);

  const navigate = useNavigate();

  // ─── Fetch list ───────────────────────────────────────────────────────────
  const fetchRFIList = async () => {
    if (!projectId) return;
    setIsLoading(true);
    try {
      const res = await get_RFI_list({ project_id: projectId });
      console.log(res);
      if (res?.valid) {
        setRfiData(Array.isArray(res.data) ? res.data : []);
      } else {
        setRfiData([]);
      }
    } catch (error) {
      console.error("Failed to fetch RFI list:", error);
      setRfiData([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRFIList();
  }, [projectId]);

  // ─── Delete: step 1 — open confirmation modal ─────────────────────────────
  const handleDeleteClick = (row) => {
    setDeleteTarget(row);
  };

  // ─── Delete: step 2 — confirmed, call API ─────────────────────────────────
  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      setIsSubmitting(true);
      const res = await delete_RFI_data({
        rfi_drafter_id: deleteTarget.rfi_drafter_id,
      });
      console.log(res);
      if (res?.valid) {
        setRfiData((prev) =>
          prev.filter(
            (item) => item.rfi_drafter_id !== deleteTarget.rfi_drafter_id,
          ),
        );
        showToast("success", res?.message);
      } else {
        showToast("error", res?.message);
      }
    } catch (error) {
      console.error("Failed to delete RFI:", error);
      showToast("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
      setDeleteTarget(null);
    }
  };
  const getProgress = (row) => {
    let percent = 0;
    if (row.response_text) percent = 50;
    if (row.content_text) percent = 100;

    let color = "#e5e7eb";
    if (percent === 100) color = "#22c55e";
    else if (percent === 50) color = "#ff9500";

    return { percent, color };
  };

  const getRowContent = (row) => {
    if (typeof row?.content_text === "string" && row.content_text.trim()) {
      return row.content_text;
    }

    if (Array.isArray(row?.content_text) && row.content_text.length > 0) {
      return row.content_text;
    }

    try {
      const parsedResponse =
        typeof row?.response_text === "string"
          ? JSON.parse(row.response_text || "{}")
          : row?.response_text;

      return parsedResponse?.content || [];
    } catch (error) {
      console.error("Failed to parse RFI response_text:", error);
      return [];
    }
  };

  const hasRfiContent = (content) => {
    if (typeof content === "string") {
      return Boolean(content.trim());
    }

    return Array.isArray(content) && content.length > 0;
  };

  const openRfiDocument = (row, isViewMode = false) => {
    const newUuid = row?.rfi_drafter_uuid;
    const content = getRowContent(row);
    const shouldLoadFromDetail = isViewMode || !hasRfiContent(content);

    navigate(
      `/project/view/${projectUId}/contract-command/rfi-drafter/update/${newUuid}/generate-rfi`,
      {
        state: {
          isViewMode,
          loadFromDetail: shouldLoadFromDetail,
          rfiData: {
            ...row,
            rfi_drafter_id: row.rfi_drafter_id,
            ...(!isViewMode && hasRfiContent(content)
              ? {
                data: {
                  ...(row?.data || {}),
                  content,
                },
              }
              : {}),
          },
          gaps: row.gap_data || [],
        },
      },
    );
  };

  const handleEdit = (row) => {
    const newUuid = row?.rfi_drafter_uuid;
    navigate(
      `/project/view/${projectUId}/contract-command/rfi-drafter/update/${newUuid}`,
        {
          state: {
            isEdit: true,
            gapData: row?.gap_data || [],
          },
        },
      );
  };

  const handleView = (row) => {
    openRfiDocument(row, true);
  };

  // ─── Columns ──────────────────────────────────────────────────────────────
  const columns = [
    {
      name: "NAME",
      selector: (row) => capitalizeFirstLetter(row.rfi_drafter_name),
      sortable: true,
      minWidth: "22%",
      cell: (row) => {
        const { percent } = getProgress(row);

        return (
          <div
            onClick={() => {
              if (percent !== 100) return;
              handleView(row);
            }}
            className={`tw-block tw-w-full tw-max-w-full tw-overflow-hidden hover:tw-text-blue-600 ${percent === 100 ? "tw-cursor-pointer" : "tw-cursor-default"
              }`}
          >
            <TextWithTooltip
              text={capitalizeFirstLetter(row.rfi_drafter_name)}
              width="100%"
            />
          </div>
        );
      },
    },
    {
      name: "Gaps Addressed",
      center: "true",
      selector: (row) => row.gaps_count,
      sortable: true,
      width: "30%",
    },

    {
      name: "Last Updated",
      center: "true",
      cell: (row) => {
        if (!row.start_date) return "-";
        const d = new Date(row.start_date);
        const day = String(d.getDate()).padStart(2, "0");
        const month = d.toLocaleString("en-US", { month: "short" });
        return `${day} ${month}, ${d.getFullYear()}`;
      },
      sortable: true,
    },
    {
      name: "ACTIONS",
      center: true,
      cell: (row) => {
        const { percent } = getProgress(row);
        const isProcessCompleted = percent === 100;

        return (
          <ActionMenu
            onView={() => handleView(row)}
            onEdit={() => handleEdit(row)}
            showDelete={permissions?.delete}
            onDelete={() => handleDeleteClick(row)}
             editDisabled={isMarkAsCompleted}  
              deleteDisabled={isMarkAsCompleted}
            showView={permissions?.view && isProcessCompleted}
            showEdit={permissions?.edit}
          />
        );
      },
    },
  ];


  const categorieOptions = [
    "Ceiling",
    "Concrete",
    "Door Window",
    "Dry Wall",
    "Electrical",
    "Flooring",
    "Hvac",
    "Labour",
    "Masonry",
    "Mechanical",
    "Painting",
    "Plumbing",
    "Roofing",
    "Siding",
  ];
  const statusOptions = ["Completed", "In Progress", "In Draft", "In Hold"];

  const handleFilterChange = (option) => {
    if (categorieOptions.includes(option)) {
      setFilters((prev) => ({ ...prev, category: option }));
    } else if (statusOptions.includes(option)) {
      setFilters((prev) => ({ ...prev, status: option }));
    } else {
      setFilters((prev) => ({ ...prev, sortBy: option }));
    }
  };


  const filteredDetails = useMemo(() => {
    let result = (rfiData || []).filter((d) =>
      d?.rfi_drafter_name
        ?.toLocaleLowerCase()
        .includes(searchQuery.trim().toLocaleLowerCase()),
    );

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
  }, [searchQuery, rfiData, filters.sortBy]);
  const isInitialEmpty = rfiData.length === 0;
  const isFilteredEmpty = filteredDetails.length === 0 && rfiData.length > 0;

  // ─── Render ───────────────────────────────────────────────────────────────
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
      {!!deleteTarget && (
        <DeleteModal
          action="delete"
          entity="RFI"
          icon="icon-Delete-fill"
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleDeleteConfirm}
        />
      )}

      <div className="header tw-mt-2 tw-flex tw-justify-between tw-items-center">
        <div className="tw-flex tw-items-center tw-gap-2 tw-min-w-0">
          <div>
            <div className="tw-flex tw-items-center tw-gap-2">
              <span className="tw-text-[20px] tw-text-gray-600 tw-font-medium">
                Contract Command
              </span>
              <i className="icon-Save-and-Continue" />
              <span className="tw-text-[20px] tw-font-bold tw-text-gray-900">
                RFI Drafter
              </span>
            </div>
            <p className="tw-text-[#1e293b] tw-text-[14px]">
              Turns AI-identified scope gaps into ready-to-send Request for
              Information documents with full context.
            </p>
          </div>
        </div>
        {permissions?.create_draft && <button
          onClick={async () => {
            try {
              if (isMarkAsCompleted) return;
              setIsSubmitting(true);
              const raw = await countAccess({
                organization_id: organizationId ,
                 project_id: projectId,
                module_name: "rfi_drafter",
              });
              const response = typeof raw === "string" ? JSON.parse(raw) : raw;
              console.log(response)
              if (response?.allowed) {
                console.log(response?.allowed);
                navigate(
                  `/project/view/${projectUId}/contract-command/rfi-drafter/add`,
                )
              } else {
                console.log(response?.message);
                setUpgradeMessage(response?.message);
                setShowUpgradeModal(true);
              }
            } catch (err) {
              console.error("countAccess error:", err);
              showToast("error", "Something went wrong");
            }
            finally {
              setIsSubmitting(false);
            }
          }}
          disabled={isMarkAsCompleted}
    className={`group tw-flex tw-items-center tw-gap-2 tw-text-white tw-font-normal tw-px-4 tw-py-2 tw-rounded-md tw-shadow-sm tw-flex-shrink-0 tw-whitespace-nowrap
      tw-transition-all tw-duration-300 tw-ease-in-out
      ${isMarkAsCompleted
        ? "tw-bg-[#94a3b8] tw-cursor-not-allowed tw-opacity-60"
        : "tw-bg-[#1f4ed8] hover:tw-bg-[#1b44c4] hover:tw-shadow-lg hover:tw-shadow-blue-200/50 hover:tw-scale-[1.03] hover:-tw-translate-y-[1px] active:tw-scale-[0.98]"
      }`}
        >
          <i className="icon-New" />
          Create RFI Drafter
        </button>}
      </div>

      <div className="tw-mt-[30px]">
        <div className="tw-mt-[30px]">
          {isLoading ? (
            <div className="tw-bg-white tw-border tw-border-gray-200 tw-rounded-[15px] tw-p-4">
              <ShimmerTable row={5} col={6} />
            </div>
          ) : (
            <CustomDataTable
              columns={columns}
              data={filteredDetails}
              enablePagination={true}
              defaultPerPage={10}
              noWrapper={false}
              progressPending={false}


              noDataComponent={
                <NoDataFound
                  title="No RFI Drafter Found"
                  description={
                    isFilteredEmpty
                      ? "No RFI match your search or filter criteria."
                      : "No RFI available."
                  }
                  buttonLabel={null}
                />
              }


              searchTerm={searchQuery}
              onSearchChange={isInitialEmpty ? null : setSearchQuery}


              filterComponent={
                isInitialEmpty ? null : (
                  <FilterDropdown
                    options={["All", "Newest", "Oldest"]}
                    value={filters.sortBy}
                    placeholder="Sort By"
                    onChange={(option) => handleFilterChange(option)}
                    width="tw-w-[11.25rem]"
                  />
                )
              }

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
                    fontSize: "13px",
                    fontWeight: "500",
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
            />
          )}
        </div>
      </div>
         {showUpgradeModal && (
                <div className="tw-fixed tw-inset-0 tw-bg-black/50 tw-z-[9999] tw-flex tw-items-center tw-justify-center">
                  <div className="tw-bg-white tw-rounded-2xl tw-shadow-2xl tw-w-[750px] tw-h-[569px] tw-px-[74px] tw-pt-[69px] tw-pb-10 tw-relative tw-text-center">
                    <button
                      onClick={() => setShowUpgradeModal(false)}
                      className="tw-absolute tw-top-4 tw-right-4 tw-w-8 tw-h-8 tw-flex tw-items-center tw-justify-center tw-rounded-full tw-border tw-border-gray-200 tw-text-gray-400 hover:tw-text-gray-600 hover:tw-bg-gray-50 tw-transition-colors"
                    >
                      <i className="icon-Close tw-text-[14px]"></i>
                    </button>
                    <h2 className="tw-text-[30px]  tw-font-bold tw-text-[#000000] tw-mb-8 tw-leading-snug">
                      Unlock More with an Upgrade!
                    </h2>
                    <div className="tw-flex tw-justify-center tw-mb-4">
                      <div className="tw-relative tw-w-[200px] tw-h-[175px] tw-flex tw-items-center tw-justify-center">
                        <div className="tw-flex tw-justify-center tw-mb-6">
                          <img
                            src={upgradImg}
                            alt="Upgrade"
                            className="tw-w-36 tw-h-36 tw-object-contain"
                          />
                        </div>
                      </div>
                    </div>
                    <p className="tw-text-[18px] tw-text-[rgba(85, 85, 85, 0.33)] tw-mb-8 tw-leading-normal tw-px-2">
                      {upgradeMessage}
                    </p>
                    <button
                      onClick={() => setShowUpgradeModal(false)}
                      className="tw-w-[318px] tw-h-[48px] tw-py-3 tw-text-white tw-text-[16px] tw-font-medium tw-rounded-[6px] tw-transition-all tw-duration-200 hover:tw-opacity-90 hover:tw-shadow-lg"
                      style={{ background: "#0140c1" }}
                    >
                      Upgrade Your Package
                    </button>
                  </div>
                </div>
              )}
    </div>
  );
};

export default RFIDrafterTableLayout;
