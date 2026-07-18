import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Tippy from "@tippyjs/react";
import "tippy.js/dist/tippy.css";
import {
  FileText,
  Scale,
  ChevronDown,
  FolderOpen,
  MessageSquareText,
  Send,
  ShieldCheck,
  Lightbulb,
  LayoutGrid,
  Eye,
  ClipboardList,
  Search,
  TriangleAlert,
  CircleHelp,
} from "lucide-react";
import SidebarTooltip from "./SidebarTooltip";
import { useEstimation } from "../context/EstimationContext";
import { useSelector } from "react-redux";
import { GetTakeoffDocuments } from "../../services/techus-services";

const PROJECT_MODULE_PATHS = ["/project/view/"];

const isInsideProject = (pathname) =>
  PROJECT_MODULE_PATHS.some((p) => pathname.startsWith(p));

const cleanPath = (pathname) => pathname.replace(/^#/, "");
const uuidFromPath = (pathname) =>
  cleanPath(pathname).match(/\/project\/view\/([^/]+)/)?.[1] ?? null;

const aiModuleMenuItems = [
  {
    name: "Bid Intelligence",
    icon: "icon-AI-RPF-Analyzer",
    parentPath: "bid-intelligence",
    subMenus: [
      { name: "Bid Dashboard", icon: Eye, path: "bid-intelligence/dashboard" },
      { name: "Bid Score", icon: "icon-Go-no-go", path: "bid-intelligence/bid-score" },
      { name: "Requirements Extractor", icon: ClipboardList, path: "bid-intelligence/requirement-extractor" },
      { name: "Risk Radar", icon: TriangleAlert, path: "bid-intelligence/risk-radar" },
      { name: "Scope Gap Finder", icon: Search, path: "bid-intelligence/scope-gap-finder" },
      { name: "Win Strategist", icon: Lightbulb, path: "bid-intelligence/win-strategist" },
      { name: "Bid Advisor", icon: CircleHelp, path: "bid-intelligence/bid-advisor" },
      { name: "RFP File Manager", icon: FolderOpen, path: "bid-intelligence/rfp-files" },
    ],
  },
  {
    name: "Takeoff Engine",
    icon: "icon-AI-Takeoff",
    parentPath: "takeoff-engine",
    subMenus: [
      { name: "Takeoff Dashboard", icon: Eye, path: "takeoff-engine/dashboard" },
      { name: "Plan Studio", icon: LayoutGrid, path: "takeoff-engine/plan-studio", requiresTakeoff: true },
      { name: "Plan File Manager", icon: FolderOpen, path: "takeoff-engine/plan-files" },
    ],
  },
  {
    name: "Estimate Builder",
    icon: "icon-AI-Estimator",
    parentPath: "estimate-builder",
    requiresEstimation: true,
    subMenus: [
      { name: "Dashboard", icon: Eye, path: "estimate-builder/dashboard" },
      { name: "Estimate", icon: "icon-Fee", path: "estimate-builder/material-estimation", activePaths: ["estimate-builder/labor-estimation"] },
      { name: "What-if Modeler", icon: Search, path: "estimate-builder/what-if-modeler" },
    ],
  },
  {
    name: "Contract Command",
    icon: "icon-AI-Drafter",
    parentPath: "contract-command",
    subMenus: [
      { name: "Proposal Drafter", icon: FileText, path: "contract-command/proposal-drafter" },
      { name: "RFI Drafter", icon: MessageSquareText, path: "contract-command/rfi-drafter" },
      { name: "Bid Invites", icon: Send, path: "contract-command/bid-invites" },
      { name: "Clause Assist", icon: Scale, path: "contract-command/clause-assist" },
      { name: "Contract Audit", icon: ShieldCheck, path: "contract-command/contract-audit" },
    ],
  },

];
const standaloneProjectItems = [
  {
    name: "ROI Calculator",
    icon: "icon-Calculator-fill",
    path: "roi-calculator",
  },
];

const mainMenuItems = [
  { name: "Projects", icon: "icon-On-hold", path: "projects" },
  { name: "Organizations", icon: "icon-Organization", path: "organizations" },
  { name: "Packages", icon: "icon-Packages", path: "packages" },
  { name: "Products", icon: "icon-Products", path: "products" },
  // { name: "Labor Cost", icon: "icon-Labor-cost", path: "labor-cost" },
  { name: "Labor", icon: "icon-Labor-cost", path: "labor" },
  { name: "Knowledge Base", icon: "icon-Company-knowledges", path: "knowledge-base" },
  { name: "Users", icon: "icon-Admin-users", path: "users" },
  { name: "Admin Users", icon: "icon-Admin-users", path: "users" },

  { name: "Roles", icon: "icon-Roles--Permissions", path: "roles" },
  { name: "Settings", icon: "icon-Settings", path: "settings" },
  { name: "Audit Logs", icon: "icon-audit-logs", path: "audit-logs" },

];

/* ─── Collapse button ─────────────────────────────────────────────────────── */
const CollapseBtn = ({ isExpanded, onMenuToggle }) => (
  <div className="tw-flex-shrink-0 tw-border-t tw-border-white/20 tw-px-[10px] tw-py-3">
    <button
      type="button"
      onClick={onMenuToggle}
      className={`tw-relative ${isExpanded ? "tw-w-[204px]" : "tw-w-[40px]"}
        tw-flex tw-items-center tw-h-10 tw-px-[10px] tw-rounded-md
        tw-bg-[#3367cd] tw-text-[#cbd8f2] tw-cursor-pointer
        tw-overflow-hidden tw-transition-all tw-duration-300 tw-ease-in-out`}
    >
      <div className="tw-absolute tw-left-[29%] tw-flex tw-gap-3">
        <i
          className={`tw-text-[20px] icon-Previous tw-flex-shrink-0 tw-flex tw-items-center tw-justify-center
            tw-transition-transform tw-duration-300 tw-ease-in-out
            ${isExpanded ? "tw-rotate-0" : "tw-rotate-180"}`}
          style={{ display: "flex", alignItems: "center", justifyContent: "center", lineHeight: 1 }}
        />
        <span className="tw-text-sm tw-font-medium tw-whitespace-nowrap tw-overflow-hidden tw-transition-[max-width,opacity] tw-duration-300 tw-ease-in-out">
          Collapse
        </span>
      </div>
    </button>
  </div>
);

/* ─── Logo ────────────────────────────────────────────────────────────────── */
const SidebarLogo = ({ isExpanded }) => (
  <div className="tw-h-[60px] tw-flex-shrink-0 tw-flex tw-items-center tw-justify-center tw-border-white/20">
    {isExpanded ? (
      <span className="tw-text-white tw-text-[1.5rem] tw-font-bold tw-tracking-wide">PrexoAI</span>
    ) : (
      <span className="tw-text-white tw-text-[1.5rem] tw-font-bold">P</span>
    )}
  </div>
);

/* ─── Sub-icon ────────────────────────────────────────────────────────────── */
const SubIcon = ({ icon, isActive, size = 14, isDisabled }) => {
  if (!icon) return null;
  const opacity = isDisabled ? 0.4 : isActive ? 1 : 0.75;
  if (typeof icon === "string") {
    return <i className={`tw-flex-shrink-0 ${icon}`} style={{ fontSize: size, opacity }} />;
  }
  return React.createElement(icon, { size, className: "tw-flex-shrink-0", style: { opacity } });
};

/* ─── Shimmer ─────────────────────────────────────────────────────────────── */
const SidebarShimmer = ({ isExpanded }) => (
  <div className="tw-flex-1 tw-overflow-hidden tw-py-3 tw-px-[10px] tw-space-y-3">
    {Array.from({ length: 6 }).map((_, i) => (
      <div key={i} className="tw-flex tw-items-center tw-h-10 tw-px-[10px] tw-rounded-md tw-gap-3">
        <div className="tw-flex-shrink-0 tw-rounded-md tw-bg-white/20 tw-animate-pulse" style={{ width: 22, height: 22 }} />
        {isExpanded && (
          <div className="tw-rounded tw-bg-white/20 tw-animate-pulse" style={{ height: 12, width: `${55 + (i % 3) * 20}px` }} />
        )}
      </div>
    ))}
  </div>
);

// ── Bid Intelligence ────────────────────────────────────────────────────────
const bidIntelligenceChildMap = {
  "bid-intelligence/dashboard": { packageKey: "bid_dashboard", permKey: "bid_dashboard" },
  "bid-intelligence/bid-score": { packageKey: "bid_score", permKey: "bid_score" },
  "bid-intelligence/requirement-extractor": { packageKey: "req_extractor", permKey: "requirement_extractor" },
  "bid-intelligence/risk-radar": { packageKey: "risk_radar", permKey: "risk_radar" },
  "bid-intelligence/scope-gap-finder": { packageKey: "scope_gap", permKey: "scope_gap_finder" },
  "bid-intelligence/win-strategist": { packageKey: "win_strategist", permKey: "win_strategist" },
  "bid-intelligence/bid-advisor": { packageKey: "bid_advisor", permKey: "bid_advisor" },
  "bid-intelligence/rfp-files": { packageKey: "rfp_file_mgr", permKey: "rfp_file_manager" },
};

// ── Takeoff Engine ──────────────────────────────────────────────────────────
const takeoffEngineChildMap = {
  "takeoff-engine/dashboard": { packageKey: "takeoff_dash", permKey: "takeoff_dashboard" },
  "takeoff-engine/plan-studio": { packageKey: "takeoff_dash", permKey: "takeoff_dashboard" },
  "takeoff-engine/plan-files": { packageKey: "plan_file_mgr", permKey: "plan_file_manager" },
};

// ── Estimate Builder ────────────────────────────────────────────────────────
const estimateBuilderChildMap = {
  "estimate-builder/dashboard": { packageKey: "est_dash", permKey: "estimation_dashboard" },
  "estimate-builder/material-estimation": { packageKey: "mat_est", permKey: "material_estimation" },
  "estimate-builder/labor-estimation": { packageKey: "lab_est", permKey: "labor_estimation" },
  "estimate-builder/what-if-modeler": { packageKey: "whatif", permKey: "what_if_modeler" },
};

//  ── ROI Calculator ────────────────────────────────────────────────────────
const standaloneProjectChildMap = {
  "roi-calculator": { packageKey: "roi_calc", permKey: "roi_calculator" },
};

function isStandaloneVisible(subPath, packageInfo, permissionsList) {
  if (!packageInfo || !permissionsList) return true;
  const mapping = standaloneProjectChildMap[subPath];
  if (!mapping) return true;
  if (packageInfo?.[mapping.packageKey]?.enabled !== true) return false;
  const modulePerms = permissionsList?.[mapping.permKey] || {};
  return Object.values(modulePerms).some(Boolean);
}
// ── Contract Command (unchanged) ────────────────────────────────────────────
const contractCommandChildMap = {
  "contract-command/proposal-drafter": { packageKey: "proposal_drafter", permKey: "proposal_drafter" },
  "contract-command/rfi-drafter": { packageKey: "rfi_drafter", permKey: "rfi_drafter" },
  "contract-command/bid-invites": { packageKey: "bid_invites", permKey: "bid_invites" },
  "contract-command/clause-assist": { packageKey: "clause_assist", permKey: "clause_assist" },
  "contract-command/contract-audit": { packageKey: "contract_audit", permKey: "contract_audit" },
};

/* ─── Generic child-visibility checker ───────────────────────────────────── */
/**
 * @param {string}  subPath        - e.g. "bid-intelligence/bid-score"
 * @param {string}  parentPkgKey   - e.g. "bid_intelligence"
 * @param {object}  childMap       - the map for this module
 * @param {object}  packageInfo    - from Redux
 * @param {object}  permissionsList - from Redux
 */
function isChildVisible(subPath, parentPkgKey, childMap, packageInfo, permissionsList) {
  // If no package / permission data yet → show everything (loading state)
  if (!packageInfo || !permissionsList) return true;

  const mapping = childMap[subPath];
  // No entry in map → always visible (no gate configured)
  if (!mapping) return true;

  // 1. Parent module must be enabled
  if (packageInfo?.[parentPkgKey]?.enabled !== true) return false;

  // 2. Child package must be enabled
  const childEnabled =
    packageInfo?.[parentPkgKey]?.children?.[mapping.packageKey]?.enabled === true;
  if (!childEnabled) return false;

  // 3. Must have at least one truthy permission
  const modulePerms = permissionsList?.[mapping.permKey] || {};
  if (!Object.values(modulePerms).some(Boolean)) return false;

  return true;
}

/* ─── SideBar ─────────────────────────────────────────────────────────────── */
const SideBar = ({ isExpanded, onMenuToggle }) => {
  const authStatus = useSelector((s) => s?.auth?.status);
  const navigate = useNavigate();
  const location = useLocation();

  const [isInitialRender, setIsInitialRender] = useState(true);

  const isAdminPortal = location.pathname.startsWith("/admin");
  const portal = isAdminPortal ? "admin" : "organization";
  const userType = portal === "admin" ? "ADMIN" : "ORGANIZATION";

  const permissionsList = useSelector((s) => s?.auth?.user?.[0]?.permission_info);
  const packageInfo = useSelector((s) => s?.auth?.user?.[0]?.package_info);

  const uuid = uuidFromPath(location.pathname);
  const { estimationUnlocked } = useEstimation();
  const inProjectContext = isInsideProject(location.pathname);

  const [openMenu, setOpenMenu] = useState(null);


  // 
  const alreadyInPlanStudio = inProjectContext &&
    location.pathname.includes("/takeoff-engine/plan-studio");

  const [planStudioEnabled, setPlanStudioEnabled] = useState(alreadyInPlanStudio);
  // lastOpenedDocId: populated from API — used by navProject to open the correct doc
  const [lastOpenedDocId, setLastOpenedDocId] = useState(null);

  // Also extract docId from current URL if we're already in plan-studio
  const docIdFromUrl = alreadyInPlanStudio
    ? location.pathname.match(/\/plan-studio\/([^/]+)/)?.[1] ?? null
    : null;

  useEffect(() => {
    // Already inside Plan Studio — enabled immediately, no API call needed
    if (alreadyInPlanStudio) {
      setPlanStudioEnabled(true);
      // Capture docId from URL so navProject can reuse it if clicked again
      if (docIdFromUrl) setLastOpenedDocId(docIdFromUrl);
      return;
    }

    if (!inProjectContext || !uuid) return;

    let cancelled = false;
    const fetchPlanStudioStatus = async () => {
      try {
        const res = await GetTakeoffDocuments({
          organization_uuid: localStorage.getItem("organization_uuid"),
          project_uuid: uuid,
        });
        const parsed = typeof res === "string" ? JSON.parse(res) : res;
        if (cancelled) return;
        const apiData = parsed?.data ?? {};
        setPlanStudioEnabled(apiData.plan_studio_enabled === true);
        // Store the last opened doc id so navProject can navigate directly to it
        setLastOpenedDocId(apiData.last_opened_document_id ?? null);
      } catch {
        // Silently fail — Plan Studio stays disabled
      }
    };

    fetchPlanStudioStatus();
    return () => { cancelled = true; };
  }, [uuid, inProjectContext, alreadyInPlanStudio]);


  // ── main-nav permission maps ──────────────────────────────────────────────
  const menuPackageMap = {
    projects: "projects",
    users: "users",
    roles: "roles",
    "knowledge-base": "org_kb",
  };
  const menuPermissionMap = {
    organizations: "organization_management",
    users: "user_management",
    packages: "package_management",
    "labor-cost": "labor_cost",
    "labor": "labor_cost",
    products: "products",
    roles: "role_management",
    company_knowledge: "company_knowledge_management",
    "audit-logs": "audit_log",
  };
  const orgMenuPermissionMap = {
    users: "user_management",
    roles: "role_management",
    "knowledge-base": "company_knowledge_management",
    products: "products",
    "labor-cost": "labor_cost",
    "labor": "labor_cost",
    "audit-logs": "audit_log",
  };

  const hasAnyPermission = (path) => {
    if (!permissionsList) return true;
    const moduleKey = menuPermissionMap[path];
    if (!moduleKey) return true;
    const modulePerms = permissionsList?.[moduleKey] || {};
    return Object.values(modulePerms).some(Boolean);
  };

  const isOrgMenuVisible = (path) => {
    if (!packageInfo || !permissionsList) return true;
    const pkgKey = menuPackageMap[path];
    const permKey = orgMenuPermissionMap[path];

    // Package check
    if (pkgKey && packageInfo?.[pkgKey]?.enabled !== true) return false;

    // Permission check — skip if no permKey defined (e.g. projects has no role permission)
    if (permKey) {
      const modulePerms = permissionsList?.[permKey] || {};
      if (!Object.values(modulePerms).some(Boolean)) return false;
    }

    return true;
  };

  // ── helpers for each AI module ────────────────────────────────────────────
  const isBidChildVisible = (subPath) => {
    const visible = isChildVisible(subPath, "bid_intelligence", bidIntelligenceChildMap, packageInfo, permissionsList);
    if (!visible) return false;
    if (subPath === "bid-intelligence/win-strategist") {
      const wsChildren = packageInfo?.bid_intelligence?.children?.win_strategist?.children;
      return !!wsChildren?.ws_rewards?.enabled || !!wsChildren?.ws_scenario?.enabled;
    }
    if (subPath === "bid-intelligence/requirement-extractor") {
      const reqChildren = packageInfo?.bid_intelligence?.children?.req_extractor?.children;
      return !!(
        reqChildren?.re_admin?.enabled ||
        reqChildren?.re_eval?.enabled ||
        reqChildren?.re_compliance?.enabled ||
        reqChildren?.re_licensing?.enabled ||
        reqChildren?.re_staffing?.enabled ||
        reqChildren?.re_contractual?.enabled ||
        reqChildren?.re_clauses?.enabled ||
        reqChildren?.re_contact?.enabled
      );
    }
    return true;
  };
  const isTakeoffChildVisible = (subPath) => isChildVisible(subPath, "takeoff_engine", takeoffEngineChildMap, packageInfo, permissionsList);
  const isEstimateChildVisible = (subPath) => isChildVisible(subPath, "estimate_builder", estimateBuilderChildMap, packageInfo, permissionsList);
  const isContractChildVisible = (subPath) => isChildVisible(subPath, "contract_command", contractCommandChildMap, packageInfo, permissionsList);

  /** Route each parentPath to its child-visibility checker */
  const getChildVisibilityChecker = (parentPath) => {
    switch (parentPath) {
      case "bid-intelligence": return isBidChildVisible;
      case "takeoff-engine": return isTakeoffChildVisible;
      case "estimate-builder": return isEstimateChildVisible;
      case "contract-command": return isContractChildVisible;
      default: return () => true;
    }
  };

  // ── sync open menu with route ─────────────────────────────────────────────
  useEffect(() => {
    if (location.pathname.includes("/bid-intelligence")) setOpenMenu(0);
    else if (location.pathname.includes("/takeoff-engine")) setOpenMenu(1);
    else if (location.pathname.includes("/estimate-builder")) setOpenMenu(2);
    else if (location.pathname.includes("/contract-command")) setOpenMenu(3);
    else setOpenMenu(null);
  }, [location.pathname]);

  useEffect(() => {
    const timer = setTimeout(() => setIsInitialRender(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  const navMain = (path) => navigate(isAdminPortal ? `/admin/${path}` : `/${path}`);
  // const navProject = (path) => {
  //   if (path === "takeoff-engine/plan-studio") {
  //     let docId = null;
  //     try {
  //       const saved = sessionStorage.getItem(`takeoff_doc_${uuid}`);
  //       if (saved) {
  //         const parsed = JSON.parse(saved);
  //         if (parsed?.project_uuid === uuid) docId = parsed.document_id ?? null;
  //       }
  //     } catch { /* ignore */ }
  //    navigate(
  //       docId
  //         ? isAdminPortal
  //           ? `/admin/project/view/${uuid}/takeoff-engine/plan-studio/${docId}`
  //           : `/project/view/${uuid}/takeoff-engine/plan-studio/${docId}`
  //         : isAdminPortal
  //           ? `/admin/project/view/${uuid}/takeoff-engine/plan-studio`  // ← fixed
  //           : `/project/view/${uuid}/takeoff-engine/plan-studio`,       // ← fixed
  //     );

  //     return;
  //   }
  //   navigate(isAdminPortal ? `/admin/project/view/${uuid}/${path}` : `/project/view/${uuid}/${path}`);
  // };

  const navProject = (path) => {
    if (path === "takeoff-engine/plan-studio") {
      const docId = lastOpenedDocId ?? docIdFromUrl ?? null;

      navigate(
        docId
          ? isAdminPortal
            ? `/admin/project/view/${uuid}/takeoff-engine/plan-studio/${docId}`
            : `/project/view/${uuid}/takeoff-engine/plan-studio/${docId}`
          : isAdminPortal
            ? `/admin/project/view/${uuid}/takeoff-engine/dashboard`
            : `/project/view/${uuid}/takeoff-engine/dashboard`
      );
      return;
    }

    navigate(
      isAdminPortal
        ? `/admin/project/view/${uuid}/${path}`
        : `/project/view/${uuid}/${path}`
    );
  };
  const filteredMain = useMemo(() => {
    return mainMenuItems.filter((item) => {
      if (userType === "ORGANIZATION" && (item.name === "Admin Users" || item.name === "Packages")) return false;
      if (!isAdminPortal && item.path === "organizations") return false;
      if (userType === "ADMIN" && item.path === "projects") return false;
      if (userType === "ADMIN" && item.name === "Knowledge Base") return false;
      if (userType === "ADMIN" && item.name === "Users") return false;
      if (userType === "ADMIN" && item.name === "Settings") return false;
      if (isAdminPortal && !hasAnyPermission(item.path)) return false;
      if (!isAdminPortal && !isOrgMenuVisible(item.path)) return false;
      return true;
    });
  }, [packageInfo, permissionsList, isAdminPortal, userType]);

  const asideClass = `tw-fixed tw-top-0 tw-left-0 tw-h-screen tw-bg-[#0140c1] tw-text-white
    tw-flex tw-flex-col tw-shadow-lg tw-z-10 tw-transition-all tw-duration-300
    ${isExpanded ? "tw-w-[225px]" : "tw-w-[60px]"}`;



  /* ── Inside Project context ──────────────────────────────────────────── */
  if (inProjectContext) {
    return (
      <aside className={asideClass}>
        <SidebarLogo isExpanded={isExpanded} />

        <div className="tw-flex-1 tw-overflow-y-auto tw-overflow-x-hidden tw-py-3 tw-px-2 tw-space-y-1">
          {aiModuleMenuItems.map((item, idx) => {
            const isModuleDisabled = item.requiresEstimation === true && !estimationUnlocked;
            const childVisibleFn = getChildVisibilityChecker(item.parentPath);

            // ── hide the whole module if no child is visible ──────────────
            const hasAnyVisibleChild = item?.subMenus?.some((sub) => childVisibleFn(sub.path));
            if (!hasAnyVisibleChild) return null;

            const isOpen = openMenu === idx && !isModuleDisabled;

            const isParentActive =
              !isModuleDisabled &&
              item.subMenus.some((sub) => {
                const fullPath = isAdminPortal
                  ? `/admin/project/view/${uuid}/${sub.path}`
                  : `/project/view/${uuid}/${sub.path}`;
                return location.pathname === fullPath || location.pathname.startsWith(fullPath);
              });

            const parentRow = (
              <div
                onClick={() => {
                  if (isModuleDisabled) return;
                  setOpenMenu(isOpen ? null : idx);
                  if (!isOpen) {
                    const firstVisibleChild = item.subMenus.find(
                      (sub) => childVisibleFn(sub.path)
                    );
                    if (firstVisibleChild) navProject(firstVisibleChild.path);
                  }
                }}
                className={`tw-flex tw-items-center tw-justify-between tw-h-10 tw-px-[10px]
                  tw-rounded-md tw-transition-colors tw-w-full
                  ${isModuleDisabled
                    ? "tw-opacity-100 tw-cursor-not-allowed"
                    : (!isExpanded && isParentActive) || (isExpanded && isOpen)
                      ? "tw-bg-white/20 tw-cursor-pointer"
                      : "hover:tw-bg-white/10 tw-cursor-pointer"}`}
              >
                <div className="tw-flex tw-items-center tw-gap-3">
                  <i
                    className={`tw-text-xl tw-flex-shrink-0 ${item.icon}`}
                    style={{
                      opacity: isModuleDisabled ? 0.4 : (!isExpanded && isParentActive) || isOpen ? 1 : 0.85,
                    }}
                  />
                  {isExpanded && (
                    <span
                      className="tw-text-[13px] tw-truncate"
                      style={{ color: isModuleDisabled ? "rgba(255,255,255,0.4)" : "#fff" }}
                    >
                      {item.name}
                    </span>
                  )}
                </div>
                {isExpanded && (
                  <ChevronDown
                    size={20}
                    className={`tw-transition-transform tw-duration-200 tw-flex-shrink-0
                      ${isOpen ? "tw-rotate-180" : ""}
                      ${isModuleDisabled ? "!tw-text-[#eaeaea]/40" : "!tw-text-[#eaeaea]"}`}
                  />
                )}
              </div>
            );

            return (
              <div key={idx}>
                {isModuleDisabled ? (
                  <Tippy
                    content="Complete a takeoff and proceed to estimate first"
                    placement="right"
                    theme="custom"
                    appendTo={document.body}
                  >
                    <span className="tw-block">{parentRow}</span>
                  </Tippy>
                ) : (
                  <SidebarTooltip label={item.name} show={!isExpanded}>
                    {parentRow}
                  </SidebarTooltip>
                )}

                {/* ── Expanded submenu ─────────────────────────────────── */}
                {isOpen && isExpanded && (
                  <div
                    className="tw-mt-3 tw-space-y-1 tw-mb-5"
                    style={{ marginLeft: "14px", paddingLeft: "12px", position: "relative" }}
                  >
                    <div
                      style={{
                        position: "absolute",
                        left: 0, top: "3px", bottom: "11px",
                        width: "2px",
                        backgroundColor: "rgba(255,255,255,0.3)",
                      }}
                    />
                    {item.subMenus.map((sub, si) => {
                      // ── permission / package gate ──────────────────────
                      if (!childVisibleFn(sub.path)) return null;

                      // const isSubDisabled = sub.requiresTakeoff === true && !takeoffUnlocked;
                      const isSubDisabled =
                        sub.requiresTakeoff === true && !planStudioEnabled;
                      const fullPath = isAdminPortal
                        ? `/admin/project/view/${uuid}/${sub.path}`
                        : `/project/view/${uuid}/${sub.path}`;
                      const isActive =
                        !isSubDisabled &&
                        (location.pathname === fullPath || location.pathname.startsWith(fullPath) ||
                          (sub.activePaths || []).some((ap) => {
                            const extra = isAdminPortal
                              ? `/admin/project/view/${uuid}/${ap}`
                              : `/project/view/${uuid}/${ap}`;
                            return location.pathname.startsWith(extra);
                          }));

                      const subRow = (
                        <div
                          onClick={() => !isSubDisabled && navProject(sub.path)}
                          className={`tw-flex tw-items-center tw-gap-2 tw-px-3 tw-py-2
                            tw-rounded-md tw-text-[12px] tw-transition-colors
                            ${isSubDisabled
                              ? "tw-opacity-100 tw-cursor-not-allowed"
                              : isActive
                                ? "tw-bg-white/20 tw-font-semibold tw-cursor-pointer"
                                : "hover:tw-bg-white/10 tw-font-normal tw-text-[#c7e5ff] tw-cursor-pointer"}`}
                        >
                          <SubIcon icon={sub.icon} isActive={isActive} isDisabled={isSubDisabled} />
                          <span
                            className="tw-truncate"
                            style={{
                              color: isSubDisabled
                                ? "rgba(255,255,255,0.4)"
                                : isActive ? "#fff" : "rgba(255,255,255,0.8)",
                            }}
                          >
                            {sub.name}
                          </span>
                        </div>
                      );

                      return (
                        <div key={si}>
                          {isSubDisabled ? (
                            <Tippy
                              content="Select a plan document from Takeoff Dashboard first"
                              placement="right"
                              theme="custom"
                              appendTo={document.body}
                            >
                              <span className="tw-block">{subRow}</span>
                            </Tippy>
                          ) : (
                            subRow
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* ── Collapsed icon strip ──────────────────────────────── */}
                {!isExpanded &&
                  isParentActive &&
                  item.subMenus.map((sub, si) => {
                    // ── permission / package gate ────────────────────────
                    if (!childVisibleFn(sub.path)) return null;

                    // const isSubDisabled = sub.requiresTakeoff === true && !takeoffUnlocked;
                    const isSubDisabled =
                      sub.requiresTakeoff === true && !planStudioEnabled;
                    const fullPath = isAdminPortal
                      ? `/admin/project/view/${uuid}/${sub.path}`
                      : `/project/view/${uuid}/${sub.path}`;
                    const isActive =
                      !isSubDisabled &&
                      (location.pathname === fullPath || location.pathname.startsWith(fullPath));

                    return (
                      <SidebarTooltip
                        key={si}
                        label={isSubDisabled ? "Select a plan from Takeoff Dashboard first" : sub.name}
                        show={true}
                      >
                        <div
                          onClick={() => !isSubDisabled && navProject(sub.path)}
                          className={`tw-flex tw-items-center tw-justify-center tw-h-9 tw-w-full
                            tw-rounded-md tw-transition-colors tw-mt-1
                            ${isSubDisabled
                              ? "tw-opacity-40 tw-cursor-not-allowed"
                              : isActive
                                ? "tw-bg-white/20 tw-cursor-pointer"
                                : "hover:tw-bg-white/10 tw-cursor-pointer"}`}
                        >
                          <SubIcon icon={sub.icon} isActive={isActive} isDisabled={isSubDisabled} />
                        </div>
                      </SidebarTooltip>
                    );
                  })}
              </div>
            );
          })}
          {/* ── Standalone items (no dropdown) ── */}
          {standaloneProjectItems.map((item, idx) => {
            if (!isStandaloneVisible(item.path, packageInfo, permissionsList)) return null;
            const fullPath = isAdminPortal
              ? `/admin/project/view/${uuid}/${item.path}`
              : `/project/view/${uuid}/${item.path}`;

            const isActive =
              location.pathname === fullPath ||
              location.pathname.startsWith(fullPath);

            return (
              <SidebarTooltip key={idx} label={item.name} show={!isExpanded}>
                <div
                  onClick={() => navProject(item.path)}
                  className={`tw-flex tw-items-center tw-gap-3 tw-h-10 tw-px-[10px] tw-rounded-md
          tw-transition-colors tw-cursor-pointer
          ${isActive ? "tw-bg-white/20" : "hover:tw-bg-white/10"}`}
                >
                  <SubIcon icon={item.icon} isActive={isActive} size={20} />
                  {isExpanded && (
                    <span className="tw-text-[13px]">
                      {item.name}
                    </span>
                  )}
                </div>
              </SidebarTooltip>
            );
          })}
        </div>

        <CollapseBtn isExpanded={isExpanded} onMenuToggle={onMenuToggle} />
      </aside>
    );
  }

  /* ── Main navigation ─────────────────────────────────────────────────── */
  return (
    <aside className={asideClass}>
      <SidebarLogo isExpanded={isExpanded} />

      {authStatus === "idle" || authStatus === "loading" || isInitialRender ? (
        <SidebarShimmer isExpanded={isExpanded} />
      ) : (
        <div className="tw-flex-1 tw-overflow-y-auto tw-overflow-x-hidden tw-py-3 tw-px-[10px] tw-space-y-3">
          {filteredMain.map((item, idx) => {
            const fullPath = isAdminPortal ? `/admin/${item.path}` : `/${item.path}`;
            const isActive =
              location.pathname === fullPath || location.pathname.startsWith(fullPath);
            const displayName = item.name === "Admin Users" ? "Users" : item.name;

            return (
              <div
                key={idx}
                onClick={() => {
                  if (item.name === "Company Knowledge") navigate(`/knowledge-base`);
                  else navMain(item.path);
                }}
                className={`tw-flex tw-items-center tw-h-10 tw-px-[10px] tw-rounded-md
                tw-cursor-pointer tw-gap-3 tw-transition-colors
                ${isActive ? "tw-bg-white/20" : "hover:tw-bg-white/10"}`}
              >
                <SidebarTooltip label={displayName} show={!isExpanded}>
                  {typeof item.icon === "string"
                    ? <i className={`tw-text-[20px] tw-flex-shrink-0 ${item.icon}`} />
                    : React.createElement(item.icon, { size: 20, className: "tw-flex-shrink-0" })}
                </SidebarTooltip>
                {isExpanded && (
                  <span
                    className="tw-text-sm tw-truncate"
                    style={{ color: isActive ? "#fff" : "rgba(255,255,255,0.85)" }}
                  >
                    {displayName}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}

      <CollapseBtn isExpanded={isExpanded} onMenuToggle={onMenuToggle} />
    </aside>
  );
};

export default SideBar;