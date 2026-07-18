import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { showToast } from "../../../genriccomponents/techus-ToastNotification";
import FullPageLoader from "../../../genriccomponents/loaders/FullPageLoader";
import CustomDataTable from "../../../genriccomponents/ReactTable";
import { ShimmerTable } from "react-shimmer-effects";
import {
  GetProjectList,
  DeleteProject,
  GetTakeoffCategories,
  MarkAsComplete,
} from "../../../services/techus-services";
import NoProjectsFound from "../../../genriccomponents/NoprojectsFound";
import { clearRfpCache } from "../ConAiModule/RFPComponents/useRfpData";
import ActionMenu from "../../../genriccomponents/ActionMenu";
import NoDataFound from "../../../genriccomponents/NoDataFound";
import CONFIG from "../../../config/config";
import { useDispatch } from "react-redux";
import { countAccess } from "../../../services/techus-services";
import upgradImg from "/src/assets/Images/no_data_images/upgrade_1.webp";
import { setProjectData } from "../../../reduxtoolbox/actions/projectSlice";
import Dropdown from "../../Common/DropDown";
import FilterDropdown from "../../../genriccomponents/FilterDropdown";
import DeleteModal from "../../../genriccomponents/DeleteModal";
import { normalizeLabel } from "../../../utils/textUtils";
import TextWithTooltip from "../../Common/ToolTip";
import { useSelector } from "react-redux";
import { resolvePackageEnabled } from "../../Common/usePermissions"; // adjust path

// ─── Constants ────────────────────────────────────────────────────────────────
const ROWS_PER_PAGE = 10;
const STATUS_OPTIONS = ["In Progress", "Active", "Completed", "In Draft", "Error"];
const PROJECT_DESCRIPTION = "Create, organize, and track all your projects in one place.";

const STATUS_PROGRESS = { 0: 0, 1: 65, 2: 65, 3: 65, 4: 100, 5: 15 };

const STATUS_RING_COLOR = {
  Error: "#ef4444",
  "In Progress": "#f97316",
  Active: "#22c55e",
  "In Draft": "#3c82f5",
};

const STATUS_CONFIG = {
  0: "Error",
  1: "In Progress",
  2: "In Progress",
  3: "In Progress",
  4: "Active",
  5: "In Draft",
  error: "Error",
  "in progress": "In Progress",
  completed: "Active",
  "analysis completed": "Active",
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
  totalProjects: { icon: "icon-Total-Projects", bg: "tw-bg-[#3c82f5]", color: "tw-text-white" },
  inProgress: { icon: "icon-In-Progress", bg: "tw-bg-[#f87316]", color: "tw-text-white" },
  completed: { icon: "icon-Completed", bg: "tw-bg-[#21c55d]", color: "tw-text-white" },
  inDraft: { icon: "icon-On-hold", bg: "tw-bg-[#6f727b]", color: "tw-text-white" },
};

// Static object — defined once outside the component to avoid recreation on every render
const TABLE_CUSTOM_STYLES = {
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
  roows: {
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

// ─── Utilities ────────────────────────────────────────────────────────────────
const mapStatus = (status) =>
  STATUS_CONFIG[String(status).toLowerCase()] || "In Draft";

const enrichProjects = (projects) => {
  const teamMap = [1, 3, 3, 2, 1, 4, 2, 3, 5, 2];
  return projects.map((p, i) => {
    const rawStatus = Number(p.status);

    // ── Determine displayStatus based on mark_as_complete field ──
    let displayStatus;
    if (Number(p.mark_as_complete) === 1) {
      displayStatus = "Completed";
    } else if (rawStatus === 4) {
      displayStatus = "Active";       // status=4 but not marked complete
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

// ─── Shared Cell Components ───────────────────────────────────────────────────
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
      <span className="tw-absolute tw-font-semibold" style={{ color, fontSize: "10px" }}>
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
        <div key={i} className="tw-w-8 tw-h-8 tw-rounded-full tw-bg-blue-100 tw-border-2 tw-border-white tw-flex tw-items-center tw-justify-center">
          <span className="tw-text-xs tw-font-medium tw-text-blue-600">{String.fromCharCode(65 + i)}</span>
        </div>
      ))}
      {extra > 0 && <span className="tw-text-xs tw-text-gray-500 tw-font-medium">+{extra}</span>}
    </div>
  );
}

export function ProjectTimeline({ startDate, endDate }) {
  const fmt = (d) =>
    d ? new Date(d).toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" }) : "-";
  return (
    <div className="tw-text-[14px] tw-flex tw-flex-col tw-gap-1">
      <div><span className="tw-text-[#999999]">Start:</span> <span className="tw-text-[#1e293b]">{fmt(startDate)}</span></div>
      <div className="tw-flex"><span className="tw-text-[#999999]">End:</span><p className="tw-text-[#1e293b] tw-flex-1 tw-text-center">{fmt(endDate)}</p></div>
    </div>
  );
}

export function StatusBadge({ status, displayStatus }) {
  const label = displayStatus || mapStatus(status);
  return (
    <span className={`tw-py-1 tw-px-2 tw-rounded-[100px] tw-text-[10px] ${STATUS_BADGE_CONFIG[label] || STATUS_BADGE_CONFIG["In Draft"]}`}>
      {label}
    </span>
  );
}

export function ProjectNameCell({ row }) {
  return (
    <div className="tw-flex tw-items-center tw-gap-4 tw-my-3" style={{ width: "340px" }}>
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
          className={`tw-font-bold tw-text-[14px] tw-text-[#3e3e3e] tw-tracking-[0.23px] ${row.displayStatus === "Completed" || row.displayStatus === "Active"
              ? "group-hover:tw-text-[#0140c1] group-hover:tw-font-[700]"
              : ""
            }`}
        />
        <TextWithTooltip
          text={row.description || "—"}
          width="180px"
          className="tw-text-[13px] tw-text-[#6e7178] tw-tracking-[0.23px] tw-mt-2"
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

function EmptyStateView({ searchQuery, categoryFilter, statusFilter, onReset }) {
  const description =
    searchQuery || categoryFilter !== "all" || statusFilter !== "all"
      ? "No projects match your filters."
      : "No projects available.";
  return <NoDataFound description={description} buttonLabel="Back to List" btnColor="#0140c1" onReset={onReset} />;
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function ProjectsV2() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const location = useLocation();
  const isAdminPortal = location.pathname.startsWith("/admin");
  const userType = isAdminPortal ? "ADMIN" : "ORGANIZATION";
  const uuid = localStorage.getItem("organization_uuid");


  const permissionsList = useSelector((s) => s?.auth?.user?.[0]?.permission_info);
  const packageInfo = useSelector((s) => s?.auth?.user?.[0]?.package_info);

  const getFirstAccessiblePath = useCallback(() => {
    console.log("=== packageInfo ===", JSON.stringify(packageInfo, null, 2));
    console.log("=== permissionsList ===", JSON.stringify(permissionsList, null, 2));
    const modules = [
      {
        parentPkgKey: "bid_intelligence",
        children: [
          { path: "bid-intelligence/dashboard", pkgKey: "bid_dashboard", permKey: "bid_dashboard" },
          { path: "bid-intelligence/bid-score", pkgKey: "bid_score", permKey: "bid_score" },
          { path: "bid-intelligence/requirement-extractor", pkgKey: "req_extractor", permKey: "requirement_extractor" },
          { path: "bid-intelligence/risk-radar", pkgKey: "risk_radar", permKey: "risk_radar" },
          { path: "bid-intelligence/scope-gap-finder", pkgKey: "scope_gap", permKey: "scope_gap_finder" },
          { path: "bid-intelligence/win-strategist", pkgKey: "win_strategist", permKey: "win_strategist" },
          { path: "bid-intelligence/bid-advisor", pkgKey: "bid_advisor", permKey: "bid_advisor" },
          { path: "bid-intelligence/rfp-files", pkgKey: "rfp_file_mgr", permKey: "rfp_file_manager" },
        ],
      },
      {
        parentPkgKey: "takeoff_engine",
        children: [
          { path: "takeoff-engine/dashboard", pkgKey: "takeoff_dash", permKey: "takeoff_dashboard" },
          { path: "takeoff-engine/plan-files", pkgKey: "plan_file_mgr", permKey: "plan_file_manager" },
        ],
      },
      {
        parentPkgKey: "estimate_builder",
        children: [
          { path: "estimate-builder/dashboard", pkgKey: "est_dash", permKey: "estimation_dashboard" },
          { path: "estimate-builder/material-estimation", pkgKey: "mat_est", permKey: "material_estimation" },
          { path: "estimate-builder/labor-estimation", pkgKey: "lab_est", permKey: "labor_estimation" },
          { path: "estimate-builder/what-if-modeler", pkgKey: "whatif", permKey: "what_if_modeler" },
        ],
      },
      {
        parentPkgKey: "contract_command",
        children: [
          { path: "contract-command/proposal-drafter", pkgKey: "proposal_drafter", permKey: "proposal_drafter" },
          { path: "contract-command/rfi-drafter", pkgKey: "rfi_drafter", permKey: "rfi_drafter" },
          { path: "contract-command/bid-invites", pkgKey: "bid_invites", permKey: "bid_invites" },
          { path: "contract-command/clause-assist", pkgKey: "clause_assist", permKey: "clause_assist" },
          { path: "contract-command/contract-audit", pkgKey: "contract_audit", permKey: "contract_audit" },
        ],
      },
    ];

    for (const mod of modules) {
      if (!resolvePackageEnabled(packageInfo, mod.parentPkgKey)) continue;
      for (const child of mod.children) {
        if (!resolvePackageEnabled(packageInfo, child.pkgKey)) continue;
        const perms = permissionsList?.[child.permKey] || {};
        if (Object.values(perms).some(Boolean)) return child.path;
      }
    }

    // ── Fallback: check ROI Calculator ──────────────────────────────────────
    const roiEnabled = resolvePackageEnabled(packageInfo, "roi_calc");
    const roiPerms = permissionsList?.["roi_calculator"] || {};
    if (roiEnabled && Object.values(roiPerms).some(Boolean)) {
      return "roi-calculator";
    }

    return null; // truly no access anywhere
  }, [packageInfo, permissionsList]);

  const handleView = useCallback((project) => {
    clearRfpCache();
    dispatch(setProjectData({
      project_id: project.project_id,
      project_uuid: project.project_uuid,
      project_name: project.project_name,
    }));
    localStorage.setItem("project_uuid", project.project_uuid);
    localStorage.setItem("project_id", project.project_id);
    localStorage.setItem(`project_name_${project.project_uuid}`, project.project_name);

    const firstPath = getFirstAccessiblePath();
    if (!firstPath) {
      showToast("error", "You don't have access to any module in this project.");
      return;
    }

    navigate(`/project/view/${project.project_uuid}/${firstPath}`, { state: { project } });
  }, [navigate, dispatch, getFirstAccessiblePath]);


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

  const [currentPage, setCurrentPage] = useState(1);

  const updateUIState = useCallback((u) => setUiState((p) => ({ ...p, ...u })), []);
  const updateDataState = useCallback((u) => setDataState((p) => ({ ...p, ...u })), []);
  const updateLoadingState = useCallback((u) => setLoadingState((p) => ({ ...p, ...u })), []);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeMessage, setUpgradeMessage] = useState("");
  const loadCategories = useCallback(async () => {
    try {
      const res = await GetTakeoffCategories();
      let d = res?.data || res;
      if (typeof d === "string") d = JSON.parse(d);
      if (d?.valid) {
        const list = Array.isArray(d.categories) ? d.categories : Array.isArray(d.data) ? d.data : [];
        const unique = [
          ...new Set(
            list.map((c) => normalizeLabel(c.takeoff_name || c.category_name || c.name || "")).filter(Boolean)
          ),
        ];
        const gcIdx = unique.indexOf("General Contractor");
        if (gcIdx > -1) unique.unshift(unique.splice(gcIdx, 1)[0]);
        updateDataState({ categoryOptions: unique });
      }
    } catch (err) {
      console.error("Error loading categories:", err);
    }
  }, [updateDataState]);

  // Fetches all projects once (no search param — filtering is done client-side)
  const fetchProjects = useCallback(async () => {
    try {
      updateLoadingState({ isLoading: true });
      const params = { limit: 1000, offset: 0, sort_column: "created_at", sort_order: "desc" };
      if (userType === "ORGANIZATION" && uuid) params.organization_uuid = uuid;

      const res = await GetProjectList(params);
      console.log(res);
      let d = res?.data || res;
      if (typeof d === "string") d = JSON.parse(d);

      if (d?.force_logout === 1 || d?.session_expired === 1) return;
      if (d?.valid) {
        updateDataState({ projects: enrichProjects(Array.isArray(d.data) ? d.data : []) });
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
  }, [userType, uuid, updateDataState, updateLoadingState]);

  useEffect(() => {
    loadCategories();
    fetchProjects();
  }, [loadCategories, fetchProjects]);

  // Reset to page 1 whenever filters / sort change
  useEffect(() => {
    setCurrentPage(1);
  }, [uiState.searchQuery, uiState.categoryFilter, uiState.statusFilter, uiState.sortOrder]);

  // ── Client-side filtered + sorted data ───────────────────────────────────
  const filteredData = useMemo(() => {
    const query = uiState.searchQuery.toLowerCase();
    const result = dataState.projects.filter((p) => {
      const matchesSearch = !query || p.project_name.toLowerCase().includes(query);
      const matchesCategory = uiState.categoryFilter === "all" || p.category_name === uiState.categoryFilter;
      const matchesStatus = uiState.statusFilter === "all" || p.displayStatus === uiState.statusFilter;
      return matchesSearch && matchesCategory && matchesStatus;
    });
    result.sort((a, b) => {
      const da = new Date(a.created_date).getTime();
      const db = new Date(b.created_date).getTime();
      return (uiState.sortOrder === "newest" || uiState.sortOrder === "newest_selected") ? db - da : da - db;
    });
    return result;
  }, [uiState, dataState.projects]);

  // ── Pagination ────────────────────────────────────────────────────────────
  const totalPages = Math.ceil(filteredData.length / ROWS_PER_PAGE);

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * ROWS_PER_PAGE;
    return filteredData.slice(start, start + ROWS_PER_PAGE);
  }, [filteredData, currentPage]);

  useEffect(() => {
    if (totalPages === 0) { setCurrentPage(1); return; }
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  // ── Stats — computed in a single pass ────────────────────────────────────
  const stats = useMemo(() => {
    const counts = dataState.projects.reduce(
      (acc, p) => {
        if (p.displayStatus === "In Progress") acc.inProgress++;
        else if (p.displayStatus === "Active") acc.completed++;
        else if (p.displayStatus === "In Draft") acc.inDraft++;
        return acc;
      },
      { inProgress: 0, completed: 0, inDraft: 0 }
    );
    return [
      {
        label: "Total Projects",
        value: dataState.projects.length,
        change: "+12%", positive: true,
        icon: STAT_ICONS.totalProjects.icon, iconBg: STAT_ICONS.totalProjects.bg, iconColor: STAT_ICONS.totalProjects.color,
      },
      {
        label: "In Progress",
        value: counts.inProgress,
        change: "+5%", positive: true,
        icon: STAT_ICONS.inProgress.icon, iconBg: STAT_ICONS.inProgress.bg, iconColor: STAT_ICONS.inProgress.color,
      },
      {
        label: "Active",
        value: counts.completed,
        change: "+18%", positive: true,
        icon: STAT_ICONS.completed.icon, iconBg: STAT_ICONS.completed.bg, iconColor: STAT_ICONS.completed.color,
      },
      {
        label: "On Hold",
        value: counts.inDraft,
        change: "-2%", positive: false,
        icon: STAT_ICONS.inDraft.icon, iconBg: STAT_ICONS.inDraft.bg, iconColor: STAT_ICONS.inDraft.color,
      },
    ];
  }, [dataState.projects]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleEdit = useCallback(
    (r) => navigate(`/projects/update/${r.project_uuid}`, { state: { project: r, projectStatus: Number(r.status) } }),
    [navigate]
  );

const handleMarkAsComplete = useCallback(async (project) => {
  try {
    updateLoadingState({ isPageLoading: true });
    const raw = await MarkAsComplete({
      project_id: project.project_id,
      organization_uuid: localStorage.getItem("organization_uuid"),
      action: "complete",   // ← added
    });
    const response = typeof raw === "string" ? JSON.parse(raw) : raw;
    if (response?.valid) {
      showToast("success", response?.message);
      await fetchProjects();
    } else {
      showToast("error", response?.message);
    }
  } catch (err) {
    console.error("MarkAsComplete error:", err);
    showToast("error", "Something went wrong. Please try again.");
  } finally {
    updateLoadingState({ isPageLoading: false });
  }
}, [fetchProjects, updateLoadingState]);

const handleMarkAsActive = useCallback(async (project) => {
  try {
    updateLoadingState({ isPageLoading: true });
    const raw = await MarkAsComplete({
      project_id: project.project_id,
      organization_uuid: localStorage.getItem("organization_uuid"),
      action: "active",     // ← active action
    });
    const response = typeof raw === "string" ? JSON.parse(raw) : raw;
    if (response?.valid) {
      showToast("success", response?.message);
      await fetchProjects();
    } else {
      showToast("error", response?.message);
    }
  } catch (err) {
    console.error("MarkAsActive error:", err);
    showToast("error", "Something went wrong. Please try again.");
  } finally {
    updateLoadingState({ isPageLoading: false });
  }
}, [fetchProjects, updateLoadingState]);

  const handleDelete = useCallback(
    (r) => { updateDataState({ deleteProjectData: r }); updateLoadingState({ showDeleteModal: true }); },
    [updateDataState, updateLoadingState]
  );

  const confirmDeleteProject = useCallback(async () => {
    if (!dataState.deleteProjectData) return;
    try {
      updateLoadingState({ isPageLoading: true });
      const organization_uuid = localStorage.getItem("organization_uuid");
      const res = await DeleteProject({ organization_uuid, project_uuid: dataState.deleteProjectData.project_uuid });
      let d = res?.data || res;
      if (typeof d === "string") d = JSON.parse(d);
      if (d?.valid) {
        updateLoadingState({ isPageLoading: false, showDeleteModal: false });
        showToast("success", `Project "${dataState.deleteProjectData.project_name}" deleted successfully.`);
        await fetchProjects();
      } else {
        showToast("error", d?.message || "Failed to delete project");
      }
    } catch (err) {
      console.error("Delete Project Error:", err);
      showToast("error", "Failed to delete project");
    } finally {
      updateDataState({ deleteProjectData: null });
    }
  }, [dataState.deleteProjectData, fetchProjects, updateLoadingState, updateDataState]);

  const handleResetFilters = useCallback(
    () => updateUIState({ searchQuery: "", categoryFilter: "all", statusFilter: "all", sortOrder: "newest" }),
    [updateUIState]
  );

const columns = useMemo(() => [
  {
    name: "NAME",
    cell: (row) => (
      <div
        onClick={
          row.displayStatus === "Completed" || row.displayStatus === "Active"
            ? () => handleView(row)
            : undefined
        }
        className={`tw-group ${
          row.displayStatus === "Completed" || row.displayStatus === "Active"
            ? "tw-cursor-pointer"
            : ""
        } tw-mr-3`}
      >
        <ProjectNameCell row={row} />
      </div>
    ),
    width: "450px",
  },
  {
    name: "TYPE",
    selector: (row) => row.category_name || "—",
    cell: (row) => <div className="tw-text-[13px] tw-text-[#1e293b]">{row?.category_name}</div>,
  },
  {
    name: "CREATED DATE",
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
    center: true,
  },
  {
    name: "ACTIONS",
    button: true,
    center: true,
    ignoreRowClick: true,
    width: "100px",
  cell: (row) => {
  const isCompleted = row.displayStatus === "Completed";
  const isActiveOrCompleted = row.displayStatus === "Active" || row.displayStatus === "Completed";

  return (
    <ActionMenu
      onView={() => handleView(row)}
      viewDisabled={!isActiveOrCompleted}

      onEdit={!isCompleted ? () => handleEdit(row) : undefined}
      editDisabled={isCompleted}

      onDelete={!isCompleted ? () => handleDelete(row) : undefined}
      deleteDisabled={isCompleted}

      onMarkAsComplete={
        row.displayStatus === "Active"
          ? () => handleMarkAsComplete(row)
          : undefined
      }
      onMarkAsActive={
        row.displayStatus === "Completed"
          ? () => handleMarkAsActive(row)
          : undefined
      }
    />
  );
},
  },
], [handleView, handleEdit, handleDelete, handleMarkAsComplete, handleMarkAsActive]);

  const hasActiveFilters =
    uiState.searchQuery ||
    uiState.categoryFilter !== "all" ||
    uiState.statusFilter !== "all";

  // ── Early returns ─────────────────────────────────────────────────────────
  if (loadingState.isInitialLoad) {
    return (
      <div className="tw-flex-1 tw-overflow-auto tw-space-y-6">
        <FullPageLoader />
        <div>
          <h1 className="tw-text-[20px] tw-font-[600] tw-tracking-[0.31px] tw-text-[#000]">Projects</h1>
          <p className="tw-text-[14px] tw-text-[#1e293b] tw-tracking-[0.31px]">{PROJECT_DESCRIPTION}</p>
        </div>
      </div>
    );
  }

  if (!loadingState.isLoading && dataState.projects.length === 0 && !hasActiveFilters) {
    return (
      <div className="tw-flex-1 tw-overflow-auto">
        {loadingState.isPageLoading && <FullPageLoader />}
        <div className="tw-flex tw-items-center tw-justify-between tw-mb-2">
          <div>
            <h1 className="tw-text-[20px] tw-font-semibold tw-tracking-[0.31px] tw-text-[#000]">Projects</h1>
            <p className="tw-text-[14px] tw-text-[#1e293b] tw-tracking-[0.31px]">{PROJECT_DESCRIPTION}</p>
          </div>
        </div>
        <NoProjectsFound onCreateClick={() => navigate("/projects/create")} />
      </div>
    );
  }

  // ─── Main render ──────────────────────────────────────────────────────────
  return (
    <div className="tw-flex-1 tw-overflow-auto">
      {loadingState.isPageLoading && <FullPageLoader />}

      <div className="tw-space-y-6">
        {/* Header */}
        <div className="tw-flex tw-items-center tw-justify-between">
          <div>
            <h1 className="tw-text-[20px] tw-font-[600] tw-tracking-[0.31px] tw-text-[#000]">Projects</h1>
            <p className="tw-text-[14px] tw-text-[#1e293b] tw-tracking-[0.31px]">{PROJECT_DESCRIPTION}</p>
          </div>
          <button
            onClick={async () => {
              try {
                updateLoadingState({ isPageLoading: true });
                const raw = await countAccess({
                  organization_id: localStorage.getItem("organization_id"),
                  module_name: "projects",
                });
                const response = typeof raw === "string" ? JSON.parse(raw) : raw;
                if (response?.allowed) {
                  navigate("/projects/create");
                } else {
                  setUpgradeMessage(response?.message || "You have reached your project limit. Upgrade your package.");
                  setShowUpgradeModal(true);
                }
              } catch (err) {
                console.error("countAccess error:", err);
                showToast("error", "Something went wrong");
              } finally {
                updateLoadingState({ isPageLoading: false });
              }
            }}
            className="tw-w-[170px] tw-flex tw-items-center tw-justify-center tw-gap-[5.9px] tw-bg-[#0140c1] tw-text-white tw-px-4 tw-py-2.5 tw-rounded-[5px] tw-font-[500] hover:tw-bg-blue-700 tw-transition-colors tw-shadow-sm tw-text-sm"
          >
            <i className="icon-New tw-text-[13.8px]" /> New Project
          </button>
        </div>

        {/* Stats */}
        <div className="tw-grid tw-grid-cols-1 sm:tw-grid-cols-2 lg:tw-grid-cols-4 tw-gap-4">
          {stats.map((s) => <StatCard key={s.label} stat={s} />)}
        </div>

        {/* Table Card */}
        <div className="tw-bg-white tw-border tw-border-[#e0e0e0] tw-rounded-[15px] tw-overflow-hidden">

          {/* Filters */}
          <div className="tw-py-5 tw-px-6 tw-border-b tw-border-[#e0e0e0] tw-bg-[#fff]">
            <div className="tw-flex tw-items-center tw-gap-3 tw-justify-between">
              <div className="tw-relative tw-flex-1 tw-max-w-md">
                <i className="icon-Search tw-text-xl tw-absolute tw-left-3 tw-top-1/2 tw--translate-y-1/2 tw-text-gray-400" />
                <input
                  type="text"
                  placeholder="Search Project"
                  value={uiState.searchQuery}
                  onChange={(e) => updateUIState({ searchQuery: e.target.value })}
                  className="tw-min-w-[87%] tw-pl-9 tw-pr-4 tw-py-2 tw-border tw-border-[#e0e0e0] tw-bg-[#f4f4f4] tw-rounded-[5px] tw-text-sm focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-blue-500"
                />
              </div>
              <div className="tw-flex tw-gap-[15px] tw-items-center">
                <Dropdown
                  options={["All Trades", ...dataState.categoryOptions]}
                  value={uiState.categoryFilter === "all" ? "All Trades" : uiState.categoryFilter}
                  onChange={(v) => updateUIState({ categoryFilter: v === "All Trades" ? "all" : v })}
                  placeholder="All Trades"
                  width="tw-w-[180px]"
                />
                <Dropdown
                  options={["All Status", ...STATUS_OPTIONS]}
                  value={uiState.statusFilter === "all" ? "All Status" : uiState.statusFilter}
                  onChange={(v) => updateUIState({ statusFilter: v === "All Status" ? "all" : v })}
                  placeholder="All Status"
                  width="tw-w-[180px]"
                />
               <FilterDropdown
  options={["Default", "Newest", "Oldest"]}
  value={
    uiState.sortOrder === "oldest" ? "Oldest" :
    uiState.sortOrder === "newest_selected" ? "Newest" :
    ""
  }
  placeholder="Sort By"
  onChange={(v) => {
    if (v === "Default" || !v) updateUIState({ sortOrder: "newest" });
    else if (v === "Oldest") updateUIState({ sortOrder: "oldest" });
    else updateUIState({ sortOrder: "newest_selected" });
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
                  customStyles={TABLE_CUSTOM_STYLES}
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

              {/* External Pagination */}
              {totalPages > 1 && (
                <div className="tw-flex tw-items-center tw-justify-end tw-gap-2 tw-px-6 tw-py-4 tw-border-t tw-border-[#e0e0e0]">
                  {/* Previous */}
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                    disabled={currentPage === 1}
                    className="tw-flex tw-items-center tw-w-[110px] tw-gap-3 tw-px-3 tw-py-2 tw-rounded-md tw-border tw-border-[#e0e0e0] tw-text-gray-600 hover:tw-bg-gray-50 disabled:tw-opacity-40 disabled:tw-cursor-not-allowed tw-transition-colors"
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
                    className="tw-flex tw-items-center tw-justify-center tw-gap-5 tw-w-[105px] tw-px-3 tw-py-2 tw-rounded-md tw-border tw-border-[#e0e0e0] tw-text-gray-600 hover:tw-bg-gray-50 disabled:tw-opacity-40 disabled:tw-cursor-not-allowed tw-transition-colors"
                  >
                    <span className="tw-text-[13px] tw-text-[#000] tw-pl-6">Next</span>
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

      {loadingState.showDeleteModal && (
        <DeleteModal
          action="delete"
          entity="project"
          icon="icon-Total-Projects"
          onClose={() => {
            updateLoadingState({ showDeleteModal: false });
            updateDataState({ deleteProjectData: null });
          }}
          onConfirm={confirmDeleteProject}
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
            <h2 className="tw-text-[30px] tw-font-bold tw-text-[#000000] tw-mb-8 tw-leading-snug">
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
            <p className="tw-text-[18px] tw-text-black tw-mb-8 tw-leading-normal tw-px-2">
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