import React, { useEffect, useState, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { io } from "socket.io-client";
import CONFIG from "../../../../config/config";
import ActionMenu from "../../../../genriccomponents/ActionMenu";
import CustomDataTable from "../../../../genriccomponents/ReactTable";
import {
  GetProposalDrafterList,
  DeleteProposalDrafter,
  GetProposalDrafterDetail,
  get_trade_data,
} from "../../../../services/techus-services";
import { ShimmerTable } from "react-shimmer-effects";

import { showToast } from "../../../../genriccomponents/techus-ToastNotification";
import FullPageLoader from "../../../../genriccomponents/loaders/FullPageLoader";
import FilterDropdown from "../../../../genriccomponents/FilterDropdown";

import TextWithTooltip from "../../../Common/ToolTip";
import DeleteModal from "../../../../genriccomponents/DeleteModal";
import NoDataFound from "../../../../genriccomponents/NoDataFound";
import usePermissions from "../../../Common/usePermissions";
import { countAccess } from "../../../../services/techus-services";
import upgradImg from "/src/assets/Images/no_data_images/upgrade_1.webp";
import { useEstimation } from "../../../context/EstimationContext";


// ─── Shared Components ────────────────────────────────────────────────────────
export function ProgressRing({ progress = 0, size = 75 }) {
  const radius = 14;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;

  const getColor = (p) => {
    if (p === 100) return "tw-stroke-green-500";
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

export function TeamAvatars({ count = 1 }) {
  const avatars = [
    "https://i.pravatar.cc/150?u=1",
    "https://i.pravatar.cc/150?u=2",
  ];
  return (
    <div className="tw-flex tw-items-center">
      <div className="tw-flex tw--space-x-2">
        {avatars.map((url, i) => (
          <img
            key={i}
            className="tw-w-7 tw-h-7 tw-rounded-full tw-border-2 tw-border-white tw-object-cover"
            src={url}
            alt="team"
          />
        ))}
      </div>
      {count > 2 && (
        <span className="tw-ml-2 tw-text-xs tw-text-gray-400">
          +{count - 2}
        </span>
      )}
    </div>
  );
}

export function ProjectTimeline({ start, end }) {
  return (
    <div className="tw-text-[13px] tw-leading-relaxed tw-text-center">
      <div className="tw-flex tw-items-center tw-justify-center tw-gap-1">
        <span className="tw-text-gray-400">Start:</span>
        <span className="tw-font-medium tw-text-[#1e293b]">
          {start || "N/A"}
        </span>
      </div>
      <div className="tw-flex tw-items-center tw-justify-center tw-gap-1 tw-mt-0.5">
        <span className="tw-text-gray-400">End:</span>
        <span className="tw-font-medium tw-text-[#1e293b]">{end || "N/A"}</span>
      </div>
    </div>
  );
}

// ─── Constants ────────────────────────────────────────────────────────────────
const STATUS_OPTIONS = ["All", "Completed", "In Progress", "Draft", "Error"];
const SORT_OPTIONS = ["All", "Newest", "Oldest"];

const getStatus = (row) => {
  const s = row.status ?? 0;

  if (s === 0) return "Error";
  if (s === 1) return "Draft";
  if (s === 2) return "In Progress";
  if (s === 3) return "Completed";

  return "Draft"; // fallback
};

const parseDate = (str) => {
  if (!str) return 0;
  const d = new Date(str);
  return isNaN(d.getTime()) ? 0 : d.getTime();
};

const getPageCount = (...sources) => {
  for (const source of sources) {
    if (!source || typeof source !== "object") continue;

    const value =
      source.n_pages ??
      source.page_count ??
      source.total_pages ??
      source.nPages ??
      source.pageCount ??
      source.totalPages;

    const parsed = Number(value);
    if (Number.isFinite(parsed) && parsed > 0) {
      return parsed;
    }
  }

  return 0;
};

const socket = io(CONFIG.VITE_SOCKET_URL, {
  autoConnect: false,
  transports: ["websocket"],
});

// ─── Main Component ───────────────────────────────────────────────────────────
export default function DraftingList() {
  const navigate = useNavigate();
  const location = useLocation();
  const { permissions, packagePermissions } = usePermissions('proposal_drafter', 'contract_command')
  console.log(permissions)
  console.log(packagePermissions)

  const projectUuidFromRedux = useSelector(
    (state) => state.project.project_uuid,
  );
  const projectIdFromRedux = useSelector((state) => state.project.project_id);
  const { isMarkAsCompleted} = useEstimation();
  const projectUuid =
    projectUuidFromRedux || localStorage.getItem("project_uuid");
  const projectId = projectIdFromRedux || localStorage.getItem("project_id");

  const [allProposals, setAllProposals] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeMessage, setUpgradeMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [category] = useState("All");
  const [status, setStatus] = useState("All");
  const [sortOrder, setSortOrder] = useState("All");
  const [, setCategoryOptions] = useState(["All"]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  useEffect(() => {
    const toastMessage = location.state?.toastMessage;
    const toastType = location.state?.toastType || "success";

    if (!toastMessage) return;

    showToast(toastType, toastMessage);
    navigate(location.pathname, { replace: true, state: {} });
  }, [location.pathname, location.state, navigate]);

  // ── Fetch proposals ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!projectId) {
      setIsLoading(false);
      return;
    }
    const fetchProposals = async () => {
      setIsLoading(true);
      try {
        const response = await GetProposalDrafterList(projectId);
        const parsed = JSON.parse(response);
        console.log("proposals data →", parsed.data);
        setAllProposals(parsed.valid ? parsed.data : []);

      } catch (error) {
        console.error("Failed to fetch proposals:", error);
        setAllProposals([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProposals();

    socket.connect();

    socket.on("connect", () => {
      console.log("Socket connected:", socket.id);
    });

    socket.on("connect_error", (err) => {
      console.warn("Socket connection failed:", err.message);
    });

    socket.on("proposal_drafter", (data) => {
      if (data?.projectId === projectId) {
        fetchProposals();
      }
    });
    return () => {
      socket.off("connect");
      socket.off("connect_error");
      socket.off("user");
      socket.disconnect();
    };
  }, [projectId]);

  // ── Fetch trade categories from get_trade_data ─────────────────────────────
  // Same pattern as HealthCheckerTable — uses display_name field
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await get_trade_data();
        console.log("get_trade_data response:", res);
        if (res?.valid) {
          const data = Array.isArray(res.data) ? res.data : [];
          const names = data
            .map((item) => item?.display_name ?? "")
            .filter(Boolean);
          setCategoryOptions(["All", ...names]);
        }
      } catch (err) {
        console.error("get_trade_data error:", err);
      }
    };
    fetchCategories();
  }, []);

  // ── Delete ─────────────────────────────────────────────────────────────────
  const handleDeleteClick = (row) => {
    setDeleteTarget({
      drafter_id: row.drafter_id,
      drafter_uuid: row.drafter_uuid,
      proposal_name: row.proposal_name,
      trade_category_id: row.trade_category_id,
      project_id: row.project_id,
      organization_id: row.organization_id,
    });
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (isDeleting) return;
    setIsDeleting(true);
    try {
      const raw = await DeleteProposalDrafter({
        drafter_id: deleteTarget.drafter_id,
        drafter_uuid: deleteTarget.drafter_uuid,
        proposal_name: deleteTarget.proposal_name,
        trade_category_id: deleteTarget.trade_category_id,
        project_id: deleteTarget.project_id,
        organization_id: deleteTarget.organization_id,
      });
      const response = typeof raw === "string" ? JSON.parse(raw) : raw;
      if (response?.valid) {
        setAllProposals((prev) =>
          prev.filter((p) => p.drafter_uuid !== deleteTarget.drafter_uuid),
        );
        showToast("success", "Proposal deleted successfully.");
        setShowDeleteModal(false);
        setDeleteTarget(null);
      } else {
        showToast("error", response?.message || "Failed to delete proposal");
      }
    } catch (err) {
      console.error("Delete error:", err);
      showToast("error", "Failed to delete proposal");
    } finally {
      setIsDeleting(false);
    }
  };

  // ── Filter + Sort ──────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let list = [...allProposals];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (p) =>
          p.proposal_name?.toLowerCase().includes(q) ||
          p.trade_category_name?.toLowerCase().includes(q),
      );
    }

    // ✅ category filter matches display_name from get_trade_data
    if (category !== "All") {
      list = list.filter(
        (p) =>
          (p.trade_category_name ?? "").toLowerCase() ===
          category.toLowerCase(),
      );
    }

    if (status !== "All") {
      list = list.filter((p) => getStatus(p) === status);
    }

    list = [...list].sort((a, b) =>
      sortOrder === "Newest"
        ? parseDate(b.created_date) - parseDate(a.created_date)
        : parseDate(a.created_date) - parseDate(b.created_date),
    );

    return list;
  }, [searchQuery, category, status, sortOrder, allProposals]);

  // ── Date formatters ────────────────────────────────────────────────────────
  const formatDate = (str) => {
    if (!str) return "—";
    const d = new Date(str);
    if (isNaN(d)) return str;
    const day = String(d.getDate()).padStart(2, "0");
    const month = d.toLocaleString("en-US", { month: "short" });
    return `${day} ${month}, ${d.getFullYear()}`;
  };



  // ── Edit ───────────────────────────────────────────────────────────────────
  const handleEdit = async (row) => {
    try {
      const raw = await GetProposalDrafterDetail({
        drafter_uuid: row.drafter_uuid,
        organization_uuid: localStorage.getItem("organization_uuid"),
        organization_id: localStorage.getItem("organization_id"),
      });
      const response = typeof raw === "string" ? JSON.parse(raw) : raw;
      const fullData = response?.valid ? { ...row, ...response.data } : row;
      navigate(
        `/project/view/${projectUuid}/contract-command/proposal-drafter/update/${row.drafter_uuid}`,
        { state: { drafterData: fullData } },
      );
    } catch (err) {
      console.error("Failed to fetch drafter detail:", err);
      navigate(
        `/project/view/${projectUuid}/contract-command/proposal-drafter/update/${row.drafter_uuid}`,
        { state: { drafterData: row } },
      );
    }
  };

  // ── Columns ────────────────────────────────────────────────────────────────
  const columns = [
    {
      name: "Proposal Name",
      width: "35%",
      selector: (row) => row.proposal_name,
      sortable: true,
      cell: (row) => {
        const rowStatus = getStatus(row);
        const isCompleted = rowStatus === "Completed";

        return (
          <div
            onClick={() => {
              if (!isCompleted || !permissions?.view) return;
              navigate(
                `/project/view/${projectUuid}/contract-command/proposal-drafter/view/${row.drafter_uuid}`,
                {
                  state: {
                    prefetched: true,
                    rowData: row,
                    section_count: row.section_count,
                    nPages: getPageCount(row),
                  },
                }
              );
            }}
            className={`tw-block tw-w-full tw-max-w-full tw-overflow-hidden hover:tw-text-blue-600 ${isCompleted && permissions?.view
                ? "tw-cursor-pointer"
                : "tw-cursor-default"
              }`}
          >
            <TextWithTooltip
              text={row.proposal_name || "—"}
              width="100%"
            />
          </div>
        );
      },
    },
    {
      name: "Date",
      width: "20%",
      selector: (row) => row.created_date,
      sortable: true,
      cell: (row) => (
        <span className="tw-text-[14px] tw-text-[#6e7178]">
          {formatDate(row.created_date)}
        </span>
      ),
    },
    {
      name: "Status",
      center: true,
      width: "25%",
      cell: (row) => {
        const status = getStatus(row);

        const getColor = () => {
          switch (status) {
            case "Completed":
              return "tw-bg-green-100 tw-text-green-600";
            case "In Progress":
              return "tw-bg-blue-100 tw-text-blue-600";
            case "Draft":
              return "tw-bg-gray-100 tw-text-gray-600";
            case "Error":
              return "tw-bg-red-100 tw-text-red-600";
            default:
              return "tw-bg-gray-100";
          }
        };

        return (
          <span
            className={`tw-px-3 tw-py-1 tw-rounded-full tw-text-xs tw-font-semibold ${getColor()}`}
          >
            {status}
          </span>
        );
      },
    },
    {
      name: "Actions",
      center: true,
      width: "12%",
      cell: (row) => {
        const rowStatus = getStatus(row);

        // ✅ Hide all actions for "In Progress" rows
        if (rowStatus === "In Progress") return null;

        return (
          <ActionMenu
            onView={() =>
              navigate(
                `/project/view/${projectUuid}/contract-command/proposal-drafter/view/${row.drafter_uuid}`,
                {
                  state: {
                    prefetched: true,
                    rowData: row,
                    section_count: row.section_count,
                    nPages: getPageCount(row),
                  },
                }
              )
            }
            showView={permissions?.view && getStatus(row) === "Completed"}
             showEdit={permissions?.edit}  
             editDisabled={isMarkAsCompleted} 
            showDelete={permissions?.delete}
            deleteDisabled={isMarkAsCompleted}
            onEdit={() => handleEdit(row)}
            onDelete={() => handleDeleteClick(row)}
            viewDisabled={false}
          />
        );
      },
    },
  ];
  const isInitialEmpty = allProposals.length === 0;
  const isFilteredEmpty = filtered.length === 0 && allProposals.length > 0;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (

    <div>
      {isLoading && <FullPageLoader />}
      {/* Header */}
      <div className="header tw-mt-2 tw-flex tw-justify-between tw-items-center">
        <div className="tw-flex tw-items-center tw-gap-2 tw-min-w-0">
          <div>
            <div className="tw-flex tw-items-center tw-gap-2">
              <span className="tw-text-[20px] tw-text-gray-600 tw-font-medium">
                Contract Command
              </span>
              <i className="icon-Save-and-Continue" />
              <span className="tw-text-[20px] tw-font-bold tw-text-gray-900">
                Proposal Drafter
              </span>
            </div>
            <p className="tw-text-[#1e293b] tw-text-[14px]">
              Generates a complete, section-by-section proposal using your RFP
              analysis and company knowledge base.
            </p>
          </div>
        </div>
        {permissions?.create_draft &&(
          <button
          onClick={async () => {
             if (isMarkAsCompleted) return;
            try {
              setIsLoading(true);
              const raw = await countAccess({
                organization_id: localStorage.getItem("organization_id"),
                project_id: projectId,
                module_name: "proposal_drafter",
              });

              // Parse if response comes as a string, use as-is if already an object
              const response = typeof raw === "string" ? JSON.parse(raw) : raw;
              console.log(response)
              if (response?.allowed) {
                console.log(response?.allowed);
                navigate(
                  `/project/view/${projectUuid}/contract-command/proposal-drafter/add`,
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
              setIsLoading(false);
            }
          }}
          
        className={`group tw-flex tw-items-center tw-gap-2 
  tw-text-white tw-font-normal 
  tw-px-4 tw-py-2 tw-rounded-md tw-shadow-sm 
  tw-transition-all tw-duration-300 tw-ease-in-out 
  tw-flex-shrink-0 tw-whitespace-nowrap
  ${isMarkAsCompleted
    ? "tw-bg-[#94a3b8] tw-cursor-not-allowed tw-opacity-60"
    : "tw-bg-[#1f4ed8] hover:tw-bg-[#1b44c4] hover:tw-shadow-lg hover:tw-shadow-blue-200/50 hover:tw-scale-[1.03] hover:-tw-translate-y-[1px] active:tw-scale-[0.98]"
  }`}

        >
          <i className="icon-New tw-transition-transform tw-duration-300 group-hover:tw-translate-x-1" />
          Create Proposal Drafter
        </button>)}
      </div>

      {/* Table */}
      {/* Table */}
      {/* Table */}
      {isLoading ? (
        <div className="tw-bg-white tw-mt-[30px] tw-rounded-xl tw-border tw-border-gray-200 tw-shadow-sm tw-p-4">
          <ShimmerTable row={5} col={6} />
        </div>
      ) : (
        <div className="tw-mt-[30px]">
          <CustomDataTable
            columns={columns}
            data={filtered}
            enablePagination={true}
            defaultPerPage={10}
            searchTerm={searchQuery}
            // onSearchChange={(val) => setSearchQuery(val)}
            onSearchChange={isInitialEmpty ? null : setSearchQuery}
            // noDataTitle="No Proposal Drafter Found"
            noDataComponent={
              <NoDataFound
                title="No Proposal Drafter Found"
                description={
                  isFilteredEmpty
                    ? "No proposals match your search or filter criteria."
                    : "No proposals available."
                }
                buttonLabel={null}
              />
            }
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

              isInitialEmpty ? null : <div className="tw-flex tw-gap-3 tw-flex-wrap">
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
            }
          />
        </div>
      )}

      {isDeleting && <FullPageLoader />}
      {showDeleteModal && (
        <DeleteModal
          action="delete"
          entity="proposal"
          icon="icon-Delete"
          onClose={() => {
            if (isDeleting) return;
            setShowDeleteModal(false);
            setDeleteTarget(null);
          }}
          onConfirm={handleDeleteConfirm}
        />
      )}

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
}
