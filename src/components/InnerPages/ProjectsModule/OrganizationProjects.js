import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { showToast } from "../../../genriccomponents/techus-ToastNotification";
import FullPageLoader from "../../../genriccomponents/loaders/FullPageLoader";
import CustomDataTable from "../../../genriccomponents/ReactTable";
import { ShimmerTable } from "react-shimmer-effects";
import {
    GetProjectList,
    DeleteProject,
    GetTakeoffCategories,
} from "../../../services/techus-services";
import NoProjectsFound from "../../../genriccomponents/NoprojectsFound";
import { clearRfpCache } from "../ConAiModule/RFPComponents/useRfpData";
import NoDataFound from "../../../genriccomponents/NoDataFound";
import { useRef } from "react";
import CONFIG from "../../../config/config";
import TextWithTooltip from "../../Common/ToolTip";
import FilterDropdown from "../../../genriccomponents/FilterDropdown";

// ─── normalizeLabel — handles _ and . separators ──────────────────────────────
const normalizeLabel = (text = "") =>
    text
        .replace(/[_.]/g, " ") // replace _ and . with space
        .toLowerCase()
        .replace(/\b\w/g, (c) => c.toUpperCase());

// ─── FilterDropdown — scroll support + click-to-deselect ─────────────────────


// ─── Utilities ────────────────────────────────────────────────────────────────
const STATUS_PROGRESS = {
    0: 0,   // Error
    1: 65,  // In Progress
    2: 65,
    3: 65,
    4: 100, // Completed
    5: 15,  // In Draft
};

// Color per displayStatus (used by ProgressRing)
const STATUS_RING_COLOR = {
    Error: "#ef4444", // red
    "In Progress": "#f97316", // orange
    Completed: "#22c55e", // green
    "In Draft": "#3c82f5", // blue
};

const STATUS_CONFIG = {
    0: "Error",
    1: "In Progress",
    2: "In Progress",
    3: "In Progress",
    4: "Completed",
    5: "In Draft",
    // String fallbacks (legacy / other sources)
    error: "Error",
    "in progress": "In Progress",
    completed: "Completed",
    "analysis completed": "Completed",
    "in draft": "In Draft",
};

const STATUS_BADGE_CONFIG = {
  Active:
    "tw-min-w-[90px] tw-font-[400] tw-text-[12px] tw-text-center tw-py-1 tw-bg-[#dcfce7] tw-text-[#16a34a] tw-border tw-border-[#86efac]",
  Completed:
    "tw-min-w-[90px] tw-font-[400] tw-text-[12px] tw-text-center tw-py-1 tw-bg-[#EDE9FE] tw-text-[#7C3AED] tw-border tw-border-[#7C3AED]",
  "In Progress":
    "tw-min-w-[90px] tw-font-[400] tw-text-[12px] tw-text-center tw-py-1 tw-bg-[#ffece1] tw-text-[#fd6f17] tw-border tw-border-[#ffd2b6]",
  "In Draft":
    "tw-min-w-[90px] tw-font-[400] tw-text-[12px] tw-text-center tw-py-1 tw-bg-[#edf4ff] tw-text-[#48f] tw-border tw-border-[#48f]",
  Error:
    "tw-min-w-[90px] tw-font-[400] tw-text-[12px] tw-text-center tw-py-1 tw-bg-[#fff0f0] tw-text-[#ff4444] tw-border tw-border-[#ffb3b3]",
};

const STAT_ICONS = {
    totalProjects: {
        icon: "icon-Total-Projects",
        bg: "tw-bg-[#3c82f5]",
        color: "tw-text-white",
    },
    inProgress: {
        icon: "icon-In-Progress",
        bg: "tw-bg-[#f87316]",
        color: "tw-text-white",
    },
    completed: {
        icon: "icon-Completed",
        bg: "tw-bg-[#21c55d]",
        color: "tw-text-white",
    },
    inDraft: {                              // ← was onHold
        icon: "icon-On-hold",               // swap icon if you have one
        bg: "tw-bg-[#6f727b]",
        color: "tw-text-white",
    },
    // error: {
    //   icon: "icon-On-hold",                // reuse or swap to an error icon
    //   bg: "tw-bg-[#ff4444]",
    //   color: "tw-text-white",
    // },
};
const mapStatus = (status) =>
    STATUS_CONFIG[String(status).toLowerCase()] || "In Draft";
const enrichProjects = (projects) => {
  const teamMap = [1, 3, 3, 2, 1, 4, 2, 3, 5, 2];
  return projects.map((p, i) => {
    const rawStatus = Number(p.status);
    let displayStatus;
    if (Number(p.mark_as_complete) === 1) {
      displayStatus = "Completed";
    } else if (rawStatus === 4) {
      displayStatus = "Active";
    } else {
      displayStatus = mapStatus(p.status);
    }
    return {
      ...p,
      category_name: p.category_name ? normalizeLabel(p.category_name) : "",
      progress: STATUS_PROGRESS[rawStatus] ?? 15,
      teamMembers: teamMap[i % 10] || 2,
      displayStatus,
    };
  });
};
export function ProgressRing({ progress = 0, displayStatus = "" }) {
    const size = 58;
    const sw = 4;
    const r = (size - sw) / 2;
    const circ = 2 * Math.PI * r;
    const color = STATUS_RING_COLOR[displayStatus] || "#d1d5db";
    return (
        <div className="tw-relative tw-flex tw-items-center tw-justify-center" style={{ width: size, height: size }}>
            <svg width={size} height={size} className="tw--rotate-90">
                <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e5e7eb" strokeWidth={sw} />
                <circle
                    cx={size / 2} cy={size / 2} r={r} fill="none"
                    stroke={color} strokeWidth={sw}
                    strokeDasharray={circ}
                    strokeDashoffset={circ - (progress / 100) * circ}
                    strokeLinecap="round"
                    style={{ transition: "stroke-dashoffset 0.35s ease" }}
                />
            </svg>
            <span className="tw-absolute tw-font-semibold" style={{ color, fontSize: '10px' }}>
                {progress}%
            </span>
        </div>
    );
}
export function TeamAvatars({ count = 1 }) {
    const shown = Math.min(count, 1);
    const extra = count - shown;
    return (
        <div className="tw-flex tw-items-center tw-gap-1.5">
            {Array.from({ length: shown }).map((_, i) => (
                <div
                    key={i}
                    className="tw-w-8 tw-h-8 tw-rounded-full tw-bg-blue-100 tw-border-2 tw-border-white tw-flex tw-items-center tw-justify-center"
                >
                    <span className="tw-text-xs tw-font-medium tw-text-blue-600">
                        {String.fromCharCode(65 + i)}
                    </span>
                </div>
            ))}
            {extra > 0 && (
                <span className="tw-text-xs tw-text-gray-500 tw-font-medium">
                    +{extra}
                </span>
            )}
        </div>
    );
}

export function ProjectTimeline({ startDate, endDate }) {
    const fmt = (d) =>
        d
            ? new Date(d).toLocaleDateString("en-US", {
                day: "2-digit",
                month: "short",
                year: "numeric",
            })
            : "-";
    return (
        <div className="tw-text-[15px] tw-flex tw-flex-col tw-gap-1">
            <div>
                <span className="tw-text-[#999999]">Start:</span>{" "}
                <span className="tw-text-[#1e293b]">{fmt(startDate)}</span>
            </div>
            <div className="tw-flex">
                <span className="tw-text-[#999999]">End:</span>
                <p className="tw-text-[#1e293b] tw-flex-1 tw-text-center">
                    {fmt(endDate)}
                </p>
            </div>
        </div>
    );
}

export function StatusBadge({ status, displayStatus }) {
  const label = displayStatus || mapStatus(status);
  return (
    <span
      className={`tw-inline-block tw-px-2 tw-py-1 tw-rounded-[100px] tw-text-[12px] tw-font-[400] ${STATUS_BADGE_CONFIG[label] || STATUS_BADGE_CONFIG["In Draft"]}`}
    >
      {label}
    </span>
  );
}


export function ProjectNameCell({ row }) {
    return (
        <div className="tw-flex tw-items-center tw-gap-3">
            {/* <div className="tw-min-w-[80px] tw-min-h-[80px] tw-h-10 tw-rounded-lg tw-overflow-hidden tw-bg-gray-100 tw-flex-shrink-0 tw-flex tw-items-center tw-justify-center">
                {row.project_image ? (
                    <img
                        src={`${CONFIG.VITE_AWS_ENDPOINT}/project_images/${row.project_image}?v=${Date.now()}`}
                        alt="project"
                        className="tw-w-full tw-h-full tw-object-cover"
                    />
                ) : (
                    <i className="icon-Building tw-text-gray-400 tw-text-[25px]" />
                )}
            </div> */}
            <div
                className="tw-flex-shrink-0 tw-rounded-lg tw-overflow-hidden tw-bg-gray-100 tw-flex tw-items-center tw-justify-center tw-border tw-border-gray-200"
                style={{ width: 75, height: 72 }}
            >
                {row.project_image ? (
                    <img
                        src={`${CONFIG.VITE_AWS_ENDPOINT}/project_images/${row.project_image}`}
                        alt="project"
                        style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center" }}
                    />
                ) : (
                    <i className="icon-Building tw-text-gray-400 tw-text-[25px]" />
                )}
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
                <TextWithTooltip
                    text={row.project_name}
                    width="180px"
                    className={`tw-font-bold tw-max-w-[160px] tw-truncate tw-text-[14px] tw-text-[#3e3e3e] tw-tracking-[0.23px] ${row.displayStatus === "Completed" ? "group-hover:tw-text-[#0140c1] group-hover:tw-font-[700]" : ""
                        }`}
                />
                <TextWithTooltip
                    text={row.description || "—"}
                    width="180px"
                    className="tw-text-[13px] tw-max-w-[160px] tw-truncate tw-text-[#6e7178] tw-tracking-[0.23px] tw-mt-2"
                />
            </div>
        </div>
    );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ stat }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{
        y: -6,
        backgroundColor: "#f8faff",
        transition: { duration: 0.2 },
      }}
      className="tw-bg-white tw-border tw-border-gray-200 tw-p-4 tw-rounded-lg tw-cursor-pointer"
    >
      <div className="tw-flex tw-items-start tw-justify-between">
        <div className="tw-flex tw-flex-col tw-gap-0">
          <p className="tw-text-[15px] tw-font-[500] tw-text-[#000] tw-p-0 tw-m-0">{stat.label}</p>
          <p className="tw-text-[35px] tw-font-[600] tw-text-[#000] tw-leading-none tw-my-1">{stat.value || "-"}</p>
        </div>
        <div className={`tw-px-2 tw-py-1 tw-rounded-md ${stat.iconBg}`}>
          <i className={`${stat.icon} tw-text-2xl ${stat.iconColor}`} />
        </div>
      </div>
    </motion.div>
  );
}

function DeleteModal({ isOpen, projectName, onConfirm, onCancel }) {
    if (!isOpen) return null;
    return (
        <div className="tw-fixed tw-inset-0 tw-flex tw-items-center tw-justify-center tw-bg-black/30 tw-z-[99999]">
            <div className="tw-bg-white tw-rounded-lg tw-shadow-xl tw-p-6 tw-w-[350px] tw-text-center">
                <h2 className="tw-text-lg tw-font-semibold tw-mb-2 tw-text-gray-800">
                    Confirm Delete
                </h2>
                <p className="tw-text-sm tw-text-gray-500 tw-mb-4">
                    Are you sure you want to delete "{projectName}"?
                </p>
                <div className="tw-flex tw-justify-center tw-gap-3">
                    <button
                        onClick={onConfirm}
                        className="tw-bg-red-600 tw-text-white tw-px-4 tw-py-2 tw-rounded-md tw-text-sm hover:tw-bg-red-700"
                    >
                        Yes
                    </button>
                    <button
                        onClick={onCancel}
                        className="tw-bg-[#156082] tw-border tw-border-[#156082] tw-text-white tw-px-4 tw-py-2 tw-rounded-md tw-text-sm hover:tw-bg-white hover:tw-text-[#156082]"
                    >
                        No
                    </button>
                </div>
            </div>
        </div>
    );
}

function EmptyStateView({
    searchQuery,
    categoryFilter,
    statusFilter,
    onReset,
}) {
    const description =
        searchQuery || categoryFilter !== "all" || statusFilter !== "all"
            ? "No projects match your filters."
            : "No projects available.";
    return (
        <NoDataFound
            description={description}
            buttonLabel="Back to List"
            btnColor="#0140c1"
            onReset={onReset}
        />
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function ProjectsV2() {
    const navigate = useNavigate();
    const location = useLocation()
    const isAdminPortal = location.pathname.startsWith('/admin')
    const userType = isAdminPortal ? 'ADMIN' : 'ORGANIZATION'
    // const userType = (localStorage.getItem("user_type") || "").toUpperCase();
    const uuid = localStorage.getItem("organization_uuid");
    const [currentPage, setCurrentPage] = useState(1);
    const rowsPerPage = 10;
    const [uiState, setUiState] = useState({
        searchQuery: "",
        categoryFilter: "all",
        statusFilter: "all",
        sortOrder: "newest",
    });
    const [dataState, setDataState] = useState({
        projects: [],
        categoryOptions: [],
        deleteProjectData: null,
    });
    const [loadingState, setLoadingState] = useState({
        isLoading: true,
        isInitialLoad: true,
        isPageLoading: false,
        showDeleteModal: false,
    });

    const updateUIState = useCallback(
        (u) => setUiState((p) => ({ ...p, ...u })),
        [],
    );
    const updateDataState = useCallback(
        (u) => setDataState((p) => ({ ...p, ...u })),
        [],
    );
    const updateLoadingState = useCallback(
        (u) => setLoadingState((p) => ({ ...p, ...u })),
        [],
    );

    // ✅ Categories — normalize labels so "door_window" → "Door Window"
    const loadCategories = useCallback(async () => {
        try {
            const res = await GetTakeoffCategories();
            let d = res?.data || res;
            if (typeof d === "string") d = JSON.parse(d);
            if (d?.valid) {
                const list = Array.isArray(d.categories)
                    ? d.categories
                    : Array.isArray(d.data)
                        ? d.data
                        : [];
                const unique = [
                    "All",
                    ...new Set(
                        list
                            .map((c) =>
                                normalizeLabel(
                                    c.takeoff_name || c.category_name || c.name || "",
                                ),
                            )
                            .filter(Boolean),
                    ),
                ];
                updateDataState({ categoryOptions: unique });
            }
        } catch (err) {
            console.error("Error loading categories:", err);
        }
    }, [updateDataState]);

    const { organization_uuid } = useParams();
    useEffect(() => {
        setCurrentPage(1);
    }, [uiState.searchQuery, uiState.categoryFilter, uiState.statusFilter, uiState.sortOrder]);
    const fetchProjects = useCallback(
        async (searchTerm = "") => {
            try {
                updateLoadingState({ isLoading: true });
                const params = {
                    limit: 1000,
                    offset: 0,
                    search: searchTerm,
                    sort_column: "created_at",
                    sort_order: "desc",
                };
                if (userType === "ORGANIZATION" && uuid)
                    params.organization_uuid = uuid;

                const res = await GetProjectList({ organization_uuid: organization_uuid });
                let d = res?.data || res;
                if (typeof d === "string") d = JSON.parse(d);

                if (d?.valid) {
                    updateDataState({
                        projects: enrichProjects(Array.isArray(d.data) ? d.data : []),
                    });
                } else {
                    showToast("error", d?.message || "Failed to fetch projects");
                    updateDataState({ projects: [] });
                }
            } catch (err) {
                console.error("Fetch Projects Error:", err);
                showToast("error", "Failed to fetch projects");
                updateDataState({ projects: [] });
            } finally {
                updateLoadingState({ isLoading: false, isInitialLoad: false });
            }
        },
        [userType, uuid, updateDataState, updateLoadingState],
    );

    useEffect(() => {
        loadCategories();
        fetchProjects();
    }, [loadCategories, fetchProjects]);

    // ✅ Debounced search — NO debounce when clearing (prevents NoProjectsFound flash)
    const isFirstRender = useRef(true);
    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }
        if (!uiState.searchQuery) {
            // Clearing search → fetch immediately so isLoading=true before render
            fetchProjects("");
            return;
        }
        const t = setTimeout(() => fetchProjects(uiState.searchQuery), 500);
        return () => clearTimeout(t);
    }, [uiState.searchQuery, fetchProjects]);

    // const statusOptions = ["Completed", "In Progress", "In Draft", "On Hold"];
    const statusOptions = ["All","In Progress", "Active", "Completed", "In Draft", "Error"];

    const filteredData = useMemo(() => {
        let result = dataState.projects.filter((p) => {
            const matchesSearch = p.project_name
                .toLowerCase()
                .includes(uiState.searchQuery.toLowerCase());
            const matchesCategory =
                uiState.categoryFilter === "all" ||
                p.category_name?.toLowerCase() === uiState.categoryFilter;
            const matchesStatus =
                uiState.statusFilter === "all" ||
                p.displayStatus === uiState.statusFilter;
            return matchesSearch && matchesCategory && matchesStatus;
        });
        result.sort((a, b) => {
            const da = new Date(a.created_date).getTime();
            const db = new Date(b.created_date).getTime();
           return (uiState.sortOrder === "newest" || uiState.sortOrder === "newest_selected") ? db - da : da - db;
        });
        return result;
    }, [uiState, dataState.projects]);


    const totalPages = Math.ceil(filteredData.length / rowsPerPage);
    const paginatedData = useMemo(() => {
        const start = (currentPage - 1) * rowsPerPage;
        return filteredData.slice(start, start + rowsPerPage);
    }, [filteredData, currentPage]);

    const stats = useMemo(
        () => [
            {
                label: "Total Projects",
                value: dataState.projects.length,
                change: "+12%",
                positive: true,
                icon: STAT_ICONS.totalProjects.icon,
                iconBg: STAT_ICONS.totalProjects.bg,
                iconColor: STAT_ICONS.totalProjects.color,
            },
            {
                label: "In Progress",
                value: dataState.projects.filter(
                    (p) => p.displayStatus === "In Progress",
                ).length,
                change: "+5%",
                positive: true,
                icon: STAT_ICONS.inProgress.icon,
                iconBg: STAT_ICONS.inProgress.bg,
                iconColor: STAT_ICONS.inProgress.color,
            },
            {
                label: "Active",
                value: dataState.projects.filter((p) => p.displayStatus === "Completed")
                    .length,
                change: "+18%",
                positive: true,
                icon: STAT_ICONS.completed.icon,
                iconBg: STAT_ICONS.completed.bg,
                iconColor: STAT_ICONS.completed.color,
            },
            {
                label: "On Hold",                                      // ← was On Hold
                value: dataState.projects.filter((p) => p.displayStatus === "In Draft")
                    .length,
                change: "-2%",
                positive: false,
                    icon: STAT_ICONS.inDraft.icon, iconBg: STAT_ICONS.inDraft.bg, iconColor: STAT_ICONS.inDraft.color,
            },
        ],
        [dataState.projects],
    )
    const handleView = useCallback(
        (project) => {
            clearRfpCache();
            localStorage.setItem("project_uuid", project.project_uuid);
            localStorage.setItem(`project_name_${project.project_uuid}`, project.project_name);
            navigate(`/project/view/${project.project_uuid}/bid-intelligence/dashboard`, {
                state: { project },
            });
        },
        [navigate],
    );

    const handleEdit = useCallback(
        (r) => navigate(`/projects/update/${r.project_uuid}`, {
            state: { project: r, projectStatus: Number(r.status) },
        }),
        [navigate],
    );
    const handleDelete = useCallback(
        (r) => {
            updateDataState({ deleteProjectData: r });
            updateLoadingState({ showDeleteModal: true });
        },
        [updateDataState, updateLoadingState],
    );

    const confirmDeleteProject = useCallback(async () => {
        if (!dataState.deleteProjectData) return;
        try {
            updateLoadingState({ isPageLoading: true });

            const organization_uuid = localStorage.getItem("organization_uuid");

            const res = await DeleteProject({
                organization_uuid,
                project_uuid: dataState.deleteProjectData.project_uuid,
            });
            let d = res?.data || res;
            if (typeof d === "string") d = JSON.parse(d);
            if (d?.valid) {
                updateLoadingState({ isPageLoading: false, showDeleteModal: false });
                showToast(
                    "success",
                    `Project "${dataState.deleteProjectData.project_name}" deleted successfully.`,
                );
                await fetchProjects(uiState.searchQuery);
            } else {
                showToast("error", d?.message || "Failed to delete project");
            }
        } catch (err) {
            console.error("Delete Project Error:", err);
            showToast("error", "Failed to delete project");
        } finally {

            updateDataState({ deleteProjectData: null });
        }
    }, [
        dataState.deleteProjectData,
        fetchProjects,
        uiState.searchQuery,
        updateLoadingState,
        updateDataState,
    ]);

    const handleResetFilters = useCallback(
        () =>
            updateUIState({
                searchQuery: "",
                categoryFilter: "all",
                statusFilter: "all",
                sortOrder: "newest",
            }),
        [updateUIState],
    );

    const tableCustomStyles = {
        headRow: {
            style: {
                backgroundColor: "#fafafa",
                borderTop: "1px solid #e5e7eb",
                borderBottom: "1px solid #e5e7eb",
                minHeight: "48px",
            },
        },
        headCells: {
            style: {
                fontSize: "15px",
                fontWeight: "500",
                color: "#6e7178",
                textTransform: "uppercase",
                letterSpacing: "normal",
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
            style: { fontSize: "14px", color: "#1e293b" },
        },
    };

    const columns = useMemo(
        () => [
            {
                name: "NAME",
                cell: (row) => <ProjectNameCell row={row} />,
            
                width: "30%",
            },
            {
                name: "TYPE",
                selector: (row) => row.category_name || "—",
              
                cell: (row) => (
                    <div className="tw-text-[13px] tw-text-[#1e293b]">
                        {row?.category_name}
                    </div>
                ),
            },
            {
                name: "CREATED DATE",   // ← add this block
                cell: (row) => (
                    <div className="tw-text-[13px] tw-text-[#1e293b]">
                        {row.created_date
                            ? new Date(row.created_date).toLocaleDateString("en-GB", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                            })
                            : "—"}
                    </div>
                ),
            },
           {
  name: "STATUS",
  cell: (row) => <StatusBadge status={row.status} displayStatus={row.displayStatus} />,
},
            // {
            //   name: "TIMELINE",
            //   cell: (row) => (
            //     <ProjectTimeline
            //       startDate={row.created_date}
            //       endDate={row.end_date}
            //     />
            //   ),
            // },
            // {
            //     name: "PROGRESS",
            //     cell: (row) => (
            //         <ProgressRing progress={row.progress || 0} displayStatus={row.displayStatus} />
            //     ),
            //     // cell: (row) => <ProgressRing progress={row.progress || 0} />,
            //     center: true,
            // },
            // {
            //   name: "TEAM",
            //   width: "10%",
            //   cell: (row) => <TeamAvatars count={row.teamMembers || 1} />,
            // },
            //       {

            //   name: "ACTIONS",
            //   button: true,
            //   center: true,
            //   ignoreRowClick: true,
            //   cell: (row) => (
            //  <ActionMenu
            //       onView={() => handleView(row)}
            //       viewDisabled={row.displayStatus !== "Completed"}  // ← View only for status 4
            //       onEdit={() => handleEdit(row)}
            //       onDelete={() => handleDelete(row)}
            //     />
            //   ),
            // },

        ],
        [handleView, handleEdit, handleDelete],
    );

    const hasActiveFilters =
        uiState.searchQuery ||
        uiState.categoryFilter !== "all" ||
        uiState.statusFilter !== "all";

    // ✅ Initial load shimmer
    if (loadingState.isInitialLoad) {
        return (
            <div className="tw-flex-1 tw-overflow-auto tw-space-y-6">
                <div className="tw-flex tw-items-center tw-justify-between ">
                    <FullPageLoader />
                    <div className="tw-mb-2 tw-mt-1">
                        <h1 className="tw-text-xl tw-font-semibold tw-text-gray-900 ">
                            Projects
                        </h1>
                        <p className="tw-text-[15px] tw-text-[#1e293b] tw-mt-1">
                            Manage and analyze your construction projects
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    // ✅ Zero projects + no active filters + not loading → NoProjectsFound (no flash)
    if (
        !loadingState.isLoading &&
        dataState.projects.length === 0 &&
        !hasActiveFilters
    ) {
        return (
            <div className="tw-flex-1 tw-overflow-auto">
                {loadingState.isPageLoading && <FullPageLoader />}
                <div className="tw-flex tw-items-center tw-justify-between tw-mb-2">
                    <div>
                        <h1 className="tw-text-xl tw-font-semibold tw-text-gray-900">
                            Projects
                        </h1>
                        <p className="tw-text-[15px] tw-text-[#1e293b] tw-mt-1">
                            Manage and analyze your construction projects
                        </p>
                    </div>
                </div>
                <NoProjectsFound
                    onCreateClick={() => navigate("/projects/create")}
                />
            </div>
        );
    }

    // ─── Main render ──────────────────────────────────────────────────────────────
    return (
        <div className="tw-flex-1 tw-overflow-auto">
            {loadingState.isPageLoading && <FullPageLoader />}

            <div className="tw-space-y-6">

                {/* <div className="tw-flex tw-items-center tw-justify-between">
  <div className="tw-flex tw-items-center">
   
    <button
      onClick={() => { navigate('/admin/organizations') }}
      className="tw-flex tw-items-center tw-justify-center tw-w-10 tw-h-10 tw-bg-[#cbd5e1] tw-rounded-lg hover:tw-bg-[#0140c1] tw-transition-colors tw-duration-200"
    >
      <i className="icon-Previous tw-text-white tw-text-lg"></i>
    </button>
  </div>

  <div className="tw-flex tw-flex-col">
 
    <h1 className="tw-text-[20px] tw-font-[600] tw-tracking-[0.31px] tw-text-[#000]">
      Projects
    </h1>
    <p className="tw-text-[14px] tw-text-[#1e293b] tw-tracking-[0.31px]">
      Manage and analyze your construction projects
    </p>
  </div>
</div> */}
                <div className="tw-flex tw-items-center tw-gap-4 tw-mb-2">
                    <button
                        onClick={() => { navigate('/admin/organizations') }}
                        className="tw-flex tw-items-center tw-justify-center tw-w-10 tw-h-10 tw-bg-[#cbd5e1] tw-rounded-lg hover:tw-bg-[#0140c1] tw-transition-colors tw-duration-200'"
                    >
                        <i class="icon-Previous tw-text-white tw-text-lg"></i>
                    </button>
                    <div>
                        <div className="tw-text-gray-500 tw-text-sm">
                            Projects
                        </div>

                        <h1 className="tw-text-gray-900 tw-text-xl tw-font-bold">
                            Manage and analyze your construction projects
                        </h1>
                    </div>
                </div>
                {/* Stats */}
                <div className="tw-grid tw-grid-cols-1 sm:tw-grid-cols-2  lg:tw-grid-cols-4 tw-gap-4">
                    {stats.map((s) => (
                        <StatCard key={s.label} stat={s} />
                    ))}
                </div>

                {/* Table Card */}
                {/* Table Card */}
                <div className="tw-bg-white tw-border tw-border-[#e0e0e0] tw-rounded-[15px] tw-overflow-hidden">
                    {/* Filters */}
                    <div className="tw-py-5 tw-px-6 tw-border-b tw-border-[#e0e0e0] tw-bg-[#fff]">
                        <div className="tw-flex tw-items-center tw-gap-3 tw-justify-between">
                            <div className="tw-relative tw-flex-1 tw-max-w-md">
                                <i className="icon-Search tw-text-xl tw-absolute tw-left-3 tw-top-1/2 tw--translate-y-1/2 tw-text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search"
                                    value={uiState.searchQuery}
                                    onChange={(e) => updateUIState({ searchQuery: e.target.value })}
                                    className="tw-min-w-[87%] tw-pl-9 tw-pr-4 tw-py-2 tw-border tw-border-[#e0e0e0] tw-bg-[#f4f4f4] tw-rounded-[5px] tw-text-sm focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-blue-500"
                                />
                            </div>
                            <div className="tw-flex tw-gap-[15px] tw-items-center">
                                <FilterDropdown
                                    options={dataState.categoryOptions}
                                    value={uiState.categoryFilter === "all" ? "" : uiState.categoryFilter}  // ← show placeholder when "all"
                                    placeholder="All Category"
                                    onChange={(v) => updateUIState({ categoryFilter: v === "All" || !v ? "all" : v.toLowerCase() })}
                                    width="tw-w-[180px]"
                                />
                                <FilterDropdown
                                    options={statusOptions}
                                    value={uiState.statusFilter === "all" ? "" : uiState.statusFilter}
                                    placeholder="All Status"
                                    onChange={(v) => updateUIState({ statusFilter: v === "All" || !v ? "all" : v })}
                                    width="tw-w-[180px]"
                                />
                                <FilterDropdown
                                    options={["Default", "Newest", "Oldest"]}
                                    value={
                                        uiState.sortOrder === "oldest" ? "Oldest" :
                                            uiState.sortOrder === "newest_selected" ? "Newest" :
                                                ""  // ← empty = shows "Sort By" placeholder
                                    }
                                    placeholder="Sort By"
                                    onChange={(v) => {
                                        if (v === "Default" || !v) updateUIState({ sortOrder: "newest" }); // Default = newest but shows placeholder
                                        else if (v === "Oldest") updateUIState({ sortOrder: "oldest" });
                                        else updateUIState({ sortOrder: "newest_selected" }); // Newest explicitly selected
                                    }}
                                    width="tw-w-[180px]"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Table Content */}
                    {loadingState.isLoading ? (
                        <ShimmerTable row={8} col={8} />
                    ) : filteredData.length > 0 ? (
                        <>
                            <div className="project-table">
                                <CustomDataTable
                                    columns={columns}
                                    data={paginatedData}
                                    customStyles={tableCustomStyles}
                                    enablePagination={false}
                                    noDataComponent={
                                        <EmptyStateView
                                            searchQuery={uiState.searchQuery}
                                            categoryFilter={uiState.categoryFilter}
                                            statusFilter={uiState.statusFilter}
                                            onReset={handleResetFilters}
                                        />
                                    }
                                />
                            </div>

                            {/* ── External Pagination ───────────────────────────────────── */}
                            {totalPages > 1 && (
                                <div className="tw-flex tw-items-center tw-justify-end tw-gap-2 tw-px-6 tw-py-4 tw-border-t tw-border-[#e0e0e0]">
                                    {/* Previous */}
                                    <button
                                        onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                                        disabled={currentPage === 1}
                                        className="tw-flex tw-items-center tw-w-[110px] tw-gap-3 tw-px-3 tw-py-2 tw-rounded-md tw-border tw-border-[#e0e0e0]  tw-text-gray-600 hover:tw-bg-gray-50 disabled:tw-opacity-40 disabled:tw-cursor-not-allowed tw-transition-colors"
                                    >
                                        <i className="icon-Previous tw-text-[16px] tw-text-[#000]" />
                                        <span className="tw-text-[13px] tw-text-[#000]">Previous</span>
                                    </button>

                                    {/* Page numbers with ellipsis */}
                                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                                        .filter((page) =>
                                            page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1
                                        )
                                        .reduce((acc, page, idx, arr) => {
                                            if (idx > 0 && page - arr[idx - 1] > 1) acc.push("...");
                                            acc.push(page);
                                            return acc;
                                        }, [])
                                        .map((item, idx) =>
                                            item === "..." ? (
                                                <span key={`ellipsis-${idx}`} className="tw-px-2 tw-text-gray-400 tw-text-sm">...</span>
                                            ) : (
                                                <button
                                                    key={item}
                                                    onClick={() => setCurrentPage(item)}
                                                    className={`tw-w-9 tw-h-9 tw-rounded-md tw-text-sm tw-font-medium tw-transition-colors tw-border
                            ${currentPage === item
                                                            ? "tw-bg-[#48f] tw-text-white tw-border-[#48f]"
                                                            : "tw-border-[#e0e0e0] tw-text-gray-600 hover:tw-bg-gray-50"
                                                        }`}
                                                >
                                                    {item}
                                                </button>
                                            )
                                        )}

                                    {/* Next */}
                                    <button
                                        onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                                        disabled={currentPage === totalPages}
                                        className="tw-flex tw-items-center tw-justify-center tw-gap-5 tw-w-[105px] tw-px-3 tw-py-2 tw-rounded-md tw-border tw-border-[#e0e0e0]  tw-text-gray-600 hover:tw-bg-gray-50 disabled:tw-opacity-40 disabled:tw-cursor-not-allowed tw-transition-colors"
                                    >
                                        <span className="tw-text-[13px] tw-text-[#000] tw-pl-6"> Next</span>
                                        <i className="icon-Next tw-text-[16px] tw-text-[#000]" />
                                    </button>
                                </div>
                            )}
                        </>
                    ) : (
                        <EmptyStateView
                            searchQuery={uiState.searchQuery}
                            categoryFilter={uiState.categoryFilter}
                            statusFilter={uiState.statusFilter}
                            onReset={handleResetFilters}
                        />
                    )}
                </div>
            </div>

            <DeleteModal
                isOpen={loadingState.showDeleteModal}
                projectName={dataState.deleteProjectData?.project_name || ""}
                onConfirm={confirmDeleteProject}
                onCancel={() => {
                    updateLoadingState({ showDeleteModal: false });
                    updateDataState({ deleteProjectData: null });
                }}
            />
        </div>
    );
}
