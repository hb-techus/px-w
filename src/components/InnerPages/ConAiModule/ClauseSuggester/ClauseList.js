import React, { useEffect, useState, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import ActionMenu from "../../../../genriccomponents/ActionMenu";
import CustomDataTable from "../../../../genriccomponents/ReactTable";
import {
  GetClauseSuggesterList,
  DeleteClauseSuggester,
} from "../../../../services/techus-services";
import { ShimmerTable } from "react-shimmer-effects";
import { showToast } from "../../../../genriccomponents/techus-ToastNotification";
import FullPageLoader from "../../../../genriccomponents/loaders/FullPageLoader";
import DeleteModal from "../../../../genriccomponents/DeleteModal";
import FilterDropdown from "../../../../genriccomponents/FilterDropdown";
import TextWithTooltip from "../../../Common/ToolTip";
import NoDataFound from "../../../../genriccomponents/NoDataFound";
import usePermissions from "../../../Common/usePermissions";
import { useEstimation } from "../../../context/EstimationContext";
import { countAccess } from "../../../../services/techus-services";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import UnlockUpgradeModal from "../../../../genriccomponents/UnlockUpgradeModal";

// ─── Progress Ring ────────────────────────────────────────────────────────────
export function ProgressRing({ progress = 0, size = 75 }) {
  const radius = 14;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;

  const getColor = (p) => {
    if (p >= 100) return "tw-stroke-green-500";
    if (p >= 50) return "tw-stroke-orange-400";
    return "tw-stroke-blue-500";
  };

  return (
    <div
      className="tw-relative tw-flex tw-items-center tw-justify-center"
      style={{ width: size, height: size }}
    >
      <svg className="tw-w-full tw-h-full tw--rotate-90" viewBox="0 0 36 36">
        <circle
          className="tw-stroke-gray-100"
          strokeWidth="2.5"
          fill="transparent"
          r={radius}
          cx="18"
          cy="18"
        />
        <circle
          className={`${getColor(progress)} tw-transition-all tw-duration-500`}
          strokeWidth="2.5"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          fill="transparent"
          r={radius}
          cx="18"
          cy="18"
        />
      </svg>
      <div className="tw-absolute tw-inset-0 tw-flex tw-items-center tw-justify-center tw-text-[11px] tw-font-bold tw-text-gray-700">
        {progress}%
      </div>
    </div>
  );
}

// ─── Project Timeline ─────────────────────────────────────────────────────────
export function ProjectTimeline({ start, end }) {
  const fmt = (d) => d || "—";
  return (
    <div className="tw-text-[14px] tw-leading-relaxed">
      <div>
        Start:{" "}
        <span className="tw-text-[#1e293b] tw-font-normal">{fmt(start)}</span>
      </div>
      <div>
        End:{" "}
        <span className="tw-text-[#1e293b] tw-font-normal">{fmt(end)}</span>
      </div>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const STATUS_OPTIONS = ["All", "Completed", "In Progress", "Not Started"];
const SORT_OPTIONS = ["All", "Newest", "Oldest"];
// 50% = name exists, 100% = name + input provided or clauses found
const getProgress = (row) => {
  if ((row.clauses_identified ?? 0) > 0) return 100;
  if (row.input_method) return 100; // rfp/pdf/custom input was submitted
  if (row.suggester_name) return 50; // name filled only
  return 0;
};

const getStatus = (row) => {
  if ((row.clauses_identified ?? 0) > 0) return "Completed";
  if (row.input_method) return "In Progress";
  if (row.suggester_name) return "In Progress";
  return "Not Started";
};

const formatDate = (str) => {
  if (!str) return "—";
  const d = new Date(str);
  if (isNaN(d)) return str;
  const day = d.getDate();
  const month = d.toLocaleString("en-US", { month: "short" }); // "Mar"
  const year = d.getFullYear();
  return `${day} ${month}, ${year}`;
};


const parseDate = (str) => {
  if (!str) return 0;
  const d = new Date(str);
  return isNaN(d.getTime()) ? 0 : d.getTime();
};

// ─── Main Component ───────────────────────────────────────────────────────────
export default function ClauseList() {
  const navigate = useNavigate();
  const { uuid: routeProjectUuid } = useParams();

  const projectIdFromRedux = useSelector((s) => s.project.project_id);
  const projectId = projectIdFromRedux || localStorage.getItem("project_id");
  const projectUuid = routeProjectUuid || null;
  const organizationId = localStorage.getItem("organization_id");
  const [allData, setAllData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [status, setStatus] = useState("All");
  const [sortOrder, setSortOrder] = useState("All");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { permissions } = usePermissions('clause_assist', 'contract_command');
  const { isMarkAsCompleted } = useEstimation();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeMessage, setUpgradeMessage] = useState("");

  // ── Fetch ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!projectId) {
      if (!projectUuid) {
        setIsLoading(false);
      }
      return;
    }
    const fetchList = async () => {
      setIsLoading(true);
      try {
        const raw = await GetClauseSuggesterList(projectId);
        const response = typeof raw === "string" ? JSON.parse(raw) : raw;
        setAllData(response?.valid ? response.data : []);
      } catch (err) {
        console.error("Failed to fetch clause suggester list:", err);
        setAllData([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchList();
  }, [projectId, projectUuid]);

  // ── Delete ────────────────────────────────────────────────────────────────
  const handleDeleteClick = (row) => setDeleteTarget(row);
  const handleCreateClauseAssist = async () => {
    try {
      setIsSubmitting(true);
      const raw = await countAccess({
        organization_id: organizationId,
        project_id: projectId,
        module_name: "clause_assist",
      });
      const response = typeof raw === "string" ? JSON.parse(raw) : raw;

      if (response?.allowed) {
        navigate(
          `/project/view/${projectUuid}/contract-command/clause-assist/add`,
        );
        return;
      }

      setUpgradeMessage(
        response?.message ||
        "You have reached your clause assist limit. Upgrade your package to create more.",
      );
      setShowUpgradeModal(true);
    } catch (error) {
      console.error("countAccess error:", error);
      showToast("error", "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };
  const handleDeleteConfirm = async () => {
    if (isDeleting) return;
    setIsDeleting(true);
    try {
      const raw = await DeleteClauseSuggester({
        suggester_id: deleteTarget.suggester_id,
      });
      const response = typeof raw === "string" ? JSON.parse(raw) : raw;
      if (response?.valid) {
        setAllData((prev) =>
          prev.filter((p) => p.suggester_id !== deleteTarget.suggester_id),
        );
        showToast("success", "Clause Assist analysis deleted successfully.");
        setDeleteTarget(null);
      } else {
        showToast("error", response?.message || "Failed to delete.");
      }
    } catch (err) {
      console.error("DeleteClauseSuggester error:", err);
      showToast("error", "Something went wrong. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  // ── Filter + Sort ─────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let list = [...allData];

    console.log("current status:", status);
    console.log(
      "row statuses:",
      list.map((p) => ({ name: p.suggester_name, status: getStatus(p) })),
    );

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (p) =>
          p.suggester_name?.toLowerCase().includes(q) ||
          p.input_method?.toLowerCase().includes(q),
      );
    }

    if (status !== "All") {
      list = list.filter((p) => {
        const progress = getProgress(p);
        if (status === "Completed") return progress === 100;
        if (status === "In Progress") return progress > 0 && progress < 100;
        if (status === "Not Started") return progress === 0;
        return true;
      });
    }
    list.sort((a, b) =>
      sortOrder === "Newest"
        ? parseDate(b.created_date) - parseDate(a.created_date)
        : parseDate(a.created_date) - parseDate(b.created_date),
    );
    return list;
  }, [searchQuery, status, sortOrder, allData]);
  const isInitialEmpty = allData.length === 0;
  const isFilteredEmpty = filtered.length === 0 && allData.length > 0;
  const isProjectContextLoading = !projectId && !!projectUuid;

  // ── Columns ───────────────────────────────────────────────────────────────
  const columns = [
    {
      name: "Name",
      width: "25%",
      selector: (row) => row.suggester_name,
      sortable: true,
      cell: (row) => {
        const progress = getProgress(row);

        return (
          <span
            onClick={() => {
              if (progress !== 100) return;
              navigate(
                `/project/view/${projectUuid}/contract-command/clause-assist/view/${row.suggester_uuid}`,
                {
                  state: {
                    isView: true,
                    rowData: row,
                  },
                },
              );
            }}
            className={`tw-block tw-w-full tw-max-w-full tw-overflow-hidden tw-text-[14px] tw-capitalize hover:tw-text-blue-600 ${progress === 100 ? "tw-cursor-pointer" : "tw-cursor-default"
              }`}
          >
            <TextWithTooltip text={row.suggester_name} width="100%" />
          </span>
        );
      },
    },
    {
      name: "Clauses Identified",
      width: "35%",
      selector: (row) => row.clauses_identified,
      sortable: true,
      center: true,
      cell: (row) => (
        <span className="tw-text-[14px] tw-font-normal tw-text-[#6e7178]">
          {row.clauses_identified ?? "—"}
        </span>
      ),
    },
    {
      name: "Last Updated",
      selector: (row) => row.created_date,
      sortable: true,
      cell: (row) => (
        <span className="tw-text-[14px] tw-text-[#6e7178]">
          {formatDate(row.created_date)}
        </span>
      ),
    },
    {
      name: "Actions",
      center: true,
      cell: (row) => (
        <ActionMenu
          showEdit={false}
          showView={permissions?.view}
          showDelete={permissions?.delete}
          deleteDisabled={isMarkAsCompleted} 
          onView={() =>
            navigate(
              `/project/view/${projectUuid}/contract-command/clause-assist/view/${row.suggester_uuid}`,
            )
          }
          onDelete={() => handleDeleteClick(row)}
        />
      ),
    },
  ];

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="tw-min-h-screen">
      {(isDeleting || isSubmitting) && <FullPageLoader />}
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        closeOnClick
        pauseOnHover
      />

      {/* Header */}
      <div className="header tw-mt-2 tw-flex tw-justify-between tw-items-center">
        <div className="tw-flex tw-items-center tw-gap-2 tw-text-[20px]">
          <div>
            <div className="tw-flex tw-items-center tw-gap-2">
              <span className="tw-text-[20px] tw-text-gray-600 tw-font-medium">
                Contract Command
              </span>
              <i className="icon-Save-and-Continue" />
              <span className="tw-text-[20px] tw-font-bold tw-text-gray-900">
                Clause Assist
              </span>
            </div>
            <p className="tw-text-[#1e293b] tw-text-[14px]">
              Reviews contract language to flag high-risk, non-standard, or
              missing clauses with suggested alternatives.
            </p>
          </div>
        </div>
        {permissions?.create_draft && (
          <button
            onClick={isMarkAsCompleted ? undefined : handleCreateClauseAssist}
            disabled={isMarkAsCompleted}
            className={`group tw-flex tw-items-center tw-gap-2 tw-text-white tw-font-normal tw-px-4 tw-py-2 tw-rounded-md tw-shadow-sm tw-whitespace-nowrap
      tw-transition-all tw-duration-300 tw-ease-in-out
      ${isMarkAsCompleted
                ? "tw-bg-[#94a3b8] tw-cursor-not-allowed tw-opacity-60"
                : "tw-bg-[#1f4ed8] hover:tw-bg-[#1b44c4] hover:tw-shadow-lg hover:tw-shadow-blue-200/50 hover:tw-scale-[1.03] hover:-tw-translate-y-[1px] active:tw-scale-[0.98]"
              }`}
          >
            <i className="icon-New" />
            Create Clause Assist
          </button>
        )}
      </div>

      <div className="tw-mt-[30px]">
        {isLoading || isProjectContextLoading ? (
          <div className="tw-bg-white tw-border tw-border-gray-200 tw-rounded-[15px] tw-p-4">
            <ShimmerTable row={5} col={6} />
          </div>
        ) : (
          <CustomDataTable
            columns={columns}
            data={filtered}
            enablePagination={true}
            defaultPerPage={10}
            noWrapper={false}

            noDataComponent={
              <NoDataFound
                title="No Clause Assist Found"
                description={
                  isFilteredEmpty
                    ? "No clause assist match your search or filter criteria."
                    : "No clause assist available."
                }
                buttonLabel={null}
              />
            }

            searchTerm={searchQuery}
            onSearchChange={isInitialEmpty ? null : setSearchQuery}
            searchPlaceholder="Search"

            filterComponent={
              isInitialEmpty ? null : (
                <div className="tw-flex tw-gap-3 tw-flex-wrap">
                  <FilterDropdown
                    options={STATUS_OPTIONS}
                    placeholder="All Status"
                    value={status}
                    onChange={setStatus}
                    width="tw-w-40"
                  />
                  <FilterDropdown
                    options={SORT_OPTIONS}
                    placeholder="Sort By"
                    value={sortOrder}
                    onChange={setSortOrder}
                    width="tw-w-32"
                  />
                </div>
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
          />
        )}
      </div>
      {!!deleteTarget && (
        <DeleteModal
          action="delete"
          entity="clause"
          icon="icon-Delete"
          onClose={() => {
            if (isDeleting) return;
            setDeleteTarget(null);
          }}
          onConfirm={handleDeleteConfirm}
        />
      )}
      <UnlockUpgradeModal
        open={showUpgradeModal}
        message={upgradeMessage}
        onClose={() => setShowUpgradeModal(false)}
      />
    </div>
  );
}
