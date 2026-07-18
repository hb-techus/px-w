

import React, { useState, useEffect, useRef, useMemo } from 'react';
import ReactDOM from 'react-dom';
import { AlertTriangle } from 'lucide-react';

import { useNavigate, useParams } from 'react-router-dom';
import { GetClauseSuggesterDetail, GenerateClauseAuditPdf, SuggestClause, GetOneOrganization, GetOnePackage } from '../../../../services/techus-services';
import FullPageLoader from '../../../../genriccomponents/loaders/FullPageLoader';
import { showToast } from "../../../../genriccomponents/techus-ToastNotification";
import { getPdfAssets } from '../../../../utils/pdfAssets';
import usePermissions from '../../../Common/usePermissions';
import UpgradeCard from "../../../../genriccomponents/UpgradeCard";
// Add to existing imports
import { useSelector } from "react-redux";
import { useEstimation } from "../../../context/EstimationContext";

function CollapsibleSection({
  title,
  icon,
  badge,
  badges,
  headerRight,
  open = false,
  onToggle,
  children,
  headerBg = "tw-bg-white",
}) {
  return (
    <div className="tw-border tw-border-gray-200 tw-rounded-xl tw-overflow-hidden tw-mb-3">
      <div
        className={`${headerBg} tw-flex tw-items-center tw-justify-between tw-px-5 tw-py-3.5 tw-cursor-pointer tw-transition-all`}
        onClick={() => onToggle?.(!open)}
      >
        <div className="tw-flex tw-items-center tw-gap-3">
          {icon}
          <span className="tw-text-[14px] tw-font-semibold tw-text-gray-800">{title}</span>
          {badge ?? badges}
        </div>
        <div className="tw-flex tw-items-center tw-gap-3">
          {headerRight}
          <div className="tw-flex tw-items-center tw-justify-center tw-w-[28px] tw-h-[28px] tw-border tw-border-gray-300 tw-rounded-[5px] tw-bg-white tw-flex-shrink-0">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
              style={{ transform: open ? "rotate(0deg)" : "rotate(180deg)", transition: "transform 0.25s ease" }}>
              <path d="M18 15l-6-6-6 6" stroke="#374151" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>
      </div>
      <div style={{ maxHeight: open ? "9999px" : "0", opacity: open ? 1 : 0, overflow: "hidden", transition: "max-height 0.3s ease, opacity 0.2s ease" }}>
        <div className="tw-border-t tw-border-gray-100 tw-p-4 tw-bg-white">{children}</div>
      </div>
    </div>
  );
}
// ── Strip UUID filenames ──────────────────────────────────────────────────────
const formatDocName = (name) => {
  if (!name) return "RFP Document";
  if (/^[a-f0-9-]{36}(-.+)?\.pdf$/i.test(name)) return "RFP Document";
  return name.replace(/^[a-f0-9-]{36}-/, "").replace(/\.pdf$/i, "") || "RFP Document";
};
void formatDocName;
// ── Build maps: by encrypted_id AND by raw filename → display name ───────────
const buildDocNameMap = (documents = []) => {
  const map = {};
  documents.forEach((doc) => {
    const encId = doc.document_encrypted_id ?? doc.document_id ?? doc.file_id;
    const rawName = doc.document_name ?? doc.original_file_name ?? doc.filename ?? "";
    const dispName = rawName.replace(/\.pdf$/i, "") || "RFP Document";
    if (encId) map[encId] = dispName;
    if (rawName) map[rawName] = dispName;
    const stripped = rawName.replace(/^[a-f0-9-]{36}-?/, "");
    if (stripped && stripped !== rawName) map[stripped] = dispName;
  });
  return map;
};

const getPositiveCount = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

const getNodeCount = (node) => {
  if (!node || typeof node !== "object") return null;
  for (const field of [node.item_count, node.count, node.section_count, node.limit, node.max_count, node.value]) {
    const count = getPositiveCount(field);
    if (count) return count;
  }
  return null;
};

const isActiveNode = (node) => {
  if (!node || typeof node !== "object") return false;
  if (node.selected === true || node.selected === 1) return true;
  if (node.enabled === true || node.enabled === 1) return true;
  if (node.selected === false || node.selected === 0) return false;
  if (node.enabled === false || node.enabled === 0) return false;
  return false;
};

const IDENTIFIED_CLAUSE_KEYS = [
  "identified_clauses_access",
  "identified_clauses",
];

const looksLikeIdentifiedClausesNode = (key, node) => {
  const normalizedKey = String(key || "").trim().toLowerCase();
  if (IDENTIFIED_CLAUSE_KEYS.includes(normalizedKey)) return true;

  const searchableText = [
    node?.name,
    node?.label,
    node?.title,
    node?.display_text_2,
    node?.sub_module_name,
    normalizedKey,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return (
    searchableText.includes("identified clauses") ||
    searchableText.includes("section(s)") ||
    searchableText.includes("section count")
  );
};

const findIdentifiedClausesNode = (node) => {
  if (!node || typeof node !== "object") return null;

  for (const key of IDENTIFIED_CLAUSE_KEYS) {
    const directNode = node?.children?.[key] || node?.[key];
    if (directNode && typeof directNode === "object") return directNode;
  }

  const entries = node?.children && typeof node.children === "object"
    ? Object.entries(node.children)
    : Object.entries(node);

  for (const [key, value] of entries) {
    if (!value || typeof value !== "object") continue;

    if (looksLikeIdentifiedClausesNode(key, value)) {
      return value;
    }

    const nestedMatch = findIdentifiedClausesNode(value);
    if (nestedMatch) return nestedMatch;
  }

  return null;
};

const findNodeCount = (node) => {
  if (!node || typeof node !== "object") return null;

  const directCount = getNodeCount(node);
  if (directCount) return directCount;

  const entries = node?.children && typeof node.children === "object"
    ? Object.entries(node.children)
    : Object.entries(node);

  for (const [, value] of entries) {
    if (!value || typeof value !== "object") continue;
    const nestedCount = findNodeCount(value);
    if (nestedCount) return nestedCount;
  }

  return null;
};

const normalizeText = (value = "") => String(value).trim().toLowerCase();

const hasChildren = (node) => {
  if (!node || typeof node !== "object") return false;
  if (Array.isArray(node.children)) return node.children.length > 0;
  if (node.children && typeof node.children === "object") {
    return Object.keys(node.children).length > 0;
  }
  return false;
};

const findFeatureNode = (node, predicate) => {
  if (!node) return null;

  if (Array.isArray(node)) {
    for (const item of node) {
      const match = findFeatureNode(item, predicate);
      if (match) return match;
    }
    return null;
  }

  if (typeof node !== "object") return null;
  if (predicate(node)) return node;

  if (Array.isArray(node.children)) {
    for (const child of node.children) {
      const match = findFeatureNode(child, predicate);
      if (match) return match;
    }
  } else if (node.children && typeof node.children === "object") {
    for (const child of Object.values(node.children)) {
      const match = findFeatureNode(child, predicate);
      if (match) return match;
    }
  }

  return null;
};

const getIdentifiedClausesAccessFromPackageDetail = (packageDetail) => {
  const clauseAssistRoot = findFeatureNode(
    packageDetail?.features,
    (node) => normalizeText(node?.name) === "clause assist" && hasChildren(node)
  );

  if (!clauseAssistRoot) return { hasFeature: false, limit: 0 };

  const identifiedNode = findFeatureNode(
    clauseAssistRoot,
    (node) =>
      normalizeText(node?.name).includes("identified clauses") ||
      normalizeText(node?.display_text_2).includes("section")
  );

  if (!identifiedNode) return { hasFeature: false, limit: 0 };

  const limit = getNodeCount(identifiedNode) ?? 0;

  return {
    hasFeature: isActiveNode(identifiedNode),
    limit,
  };
};

const PRIORITY_CONFIG = {
  high: {
    label: 'High',
    icon: <i className="icon-Risks tw-text-[16px]" />,
    badge: 'tw-bg-red-50 tw-text-red-500 tw-border-red-300',
    card: 'tw-border-[#fed8aa] tw-bg-[#fffaf4]',
  },
  medium: {
    label: 'Medium',
    icon: <i className="icon-Alert tw-text-[16px]" />,
    badge: 'tw-bg-[#ffebce] tw-text-[#ff9500] tw-border-[#ff9500]',
    card: 'tw-border-[#fed8aa] tw-bg-[#fffaf4]',
  },
  low: {
    label: 'Low',
    icon: <i className="icon-Alert tw-text-[16px]" />,
    badge: 'tw-bg-blue-50 tw-text-blue-500 tw-border-blue-300',
    card: 'tw-border-[#fed8aa] tw-bg-[#fffaf4]',
  },
};

function ClauseCard({ clause, docNameMap = {} }) {
  void docNameMap;
  const cfg = PRIORITY_CONFIG[clause.priority?.toLowerCase()] ?? PRIORITY_CONFIG.low;

  return (
    <div className={`tw-border ${cfg.card} tw-rounded-xl tw-p-5`}>

      {/* Top row */}
      <div className="tw-flex tw-items-center tw-justify-between tw-mb-5 tw-flex-wrap tw-gap-3">
        <span className={`tw-inline-flex tw-items-center tw-gap-1.5 tw-border tw-px-3 tw-py-1 tw-rounded-[5px] tw-text-xs tw-font-bold ${cfg.badge}`}>
          {cfg.icon} {cfg.label}
        </span>
        {/* <div className="tw-flex tw-items-center tw-gap-3">
          <span className="tw-text-xs tw-text-gray-400 tw-bg-white tw-px-3 tw-py-1.5 tw-rounded-lg tw-border tw-border-gray-200 tw-flex tw-items-center tw-gap-1.5 tw-max-w-[280px]">
            <i className="icon-Document tw-text-gray-400 tw-text-[12px] tw-flex-shrink-0" />
            <span className="tw-truncate tw-font-medium tw-text-gray-600">{resolvedName}</span>
            {pageInfo && (
              <>
                <span className="tw-text-gray-300">•</span>
                <span className="tw-flex-shrink-0">{pageInfo}</span>
              </>
            )}
          </span>
          <button className="tw-bg-[#0140c1] tw-text-white tw-text-xs tw-px-3 tw-py-1.5 tw-rounded-lg tw-flex tw-items-center tw-gap-1.5 hover:tw-bg-blue-800 tw-transition-colors">
            <i className="icon-Document tw-text-[13px]" /> View in PDF
          </button>
        </div> */}
      </div>

      {/* Original + Suggested */}
      <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 tw-gap-5 tw-mb-5">
        <div>
          <div className="tw-flex tw-items-center tw-gap-2 tw-mb-2">
            <div className="tw-w-7 tw-h-7 tw-flex tw-items-center tw-justify-center tw-bg-white tw-rounded-[5px] tw-border tw-border-gray-200 tw-flex-shrink-0">
              <i className="icon-quotes tw-text-gray-400 tw-text-[16px]" />
            </div>
            <span className="tw-text-sm tw-font-bold tw-text-gray-700">Original Text</span>
          </div>
          <div className="tw-bg-white tw-border tw-border-gray-200 tw-rounded-xl tw-p-4 tw-text-sm tw-text-gray-600 tw-leading-relaxed">
            "{clause.original_text}"
          </div>
        </div>
        <div>
          <div className="tw-flex tw-items-center tw-gap-2 tw-mb-2">
            <div className="tw-w-7 tw-h-7 tw-flex tw-items-center tw-justify-center tw-bg-white tw-rounded-[5px] tw-border tw-border-[#a8f3d0] tw-flex-shrink-0">
              <i className="icon-AI-RPF-Advisor tw-text-green-500 tw-text-[16px]" />
            </div>
            <span className="tw-text-sm tw-font-bold tw-text-gray-700">Suggested Change</span>
          </div>
          <div className="tw-bg-[#f0fdf4] tw-border tw-border-[#a8f3d0] tw-rounded-xl tw-p-4 tw-text-sm tw-text-green-700 tw-leading-relaxed">
            "{clause.suggested_change}"
          </div>
        </div>
      </div>

      {/* AI Reasoning */}
      <div>
        <div className="tw-flex tw-items-center tw-gap-2 tw-mb-2">
          <div className="tw-w-7 tw-h-7 tw-flex tw-items-center tw-justify-center tw-bg-blue-50 tw-rounded-[5px] tw-border tw-border-[#6f87e8] tw-flex-shrink-0">
            <i className="icon-AI-fill tw-text-blue-500 tw-text-[16px]" />
          </div>
          <span className="tw-text-sm tw-font-bold tw-text-gray-700">AI Reasoning</span>
        </div>
        <div className="tw-border tw-border-[#6f87e8] tw-bg-[#f1f6ff] tw-rounded-xl tw-px-4 tw-py-3">
          <p className="tw-text-sm tw-text-gray-600 tw-leading-relaxed">{clause.reasoning}</p>
        </div>
      </div>
    </div>
  );
}

const CATEGORY_ICONS = {
  'warranties': <i className="icon-warranties tw-text-[21px]" />,
  'scope of work': <i className="icon-scope-of-work tw-text-[21px]" />,
  'compliance': <i className="icon-compliance tw-text-[21px]" />,
  'dispute resolution': <i className="icon-dispute-resolution tw-text-[21px]" />,
  'identification': <i className="icon-identification tw-text-[21px]" />,
};

const getCategoryIcon = (name) =>
  CATEGORY_ICONS[name?.toLowerCase()] ?? <i className="icon-Document tw-text-[18px]" />;
function LockedIdentifiedClauses({ clauseCount, allowedCount = 0, onUpgrade }) {
  const visibleCount = Math.min(clauseCount || 0, allowedCount || 0);
  const description = `You're viewing ${visibleCount} of the identified clauses. Upgrade your package to reveal all clauses, suggestions, and AI reasoning for this project.`;

  return (
    <div className="tw-relative tw-overflow-hidden tw-rounded-[20px] tw-border tw-border-[#d9dee8] tw-bg-[#f7f9fc]">
      <div className="tw-relative tw-h-[420px] md:tw-h-[460px]">
        <div className="tw-absolute tw-inset-0 tw-bg-[linear-gradient(135deg,#e6edf6_0%,#f3f6fb_42%,#e1e8f2_100%)]" />
        <div className="tw-absolute tw-inset-0 tw-bg-[radial-gradient(circle_at_18%_22%,rgba(208,218,231,0.95),transparent_28%),radial-gradient(circle_at_82%_20%,rgba(224,232,241,0.92),transparent_26%),radial-gradient(circle_at_50%_84%,rgba(202,213,227,0.9),transparent_32%)]" />
        <div className="tw-absolute tw-left-[-72px] tw-top-4 tw-h-56 tw-w-56 tw-rounded-full tw-bg-[#d6e0ec] tw-opacity-90 tw-blur-[72px]" />
        <div className="tw-absolute tw-right-[-52px] tw-top-14 tw-h-52 tw-w-52 tw-rounded-full tw-bg-[#e2e9f2] tw-opacity-95 tw-blur-[72px]" />
        <div className="tw-absolute tw-bottom-[-28px] tw-left-1/2 tw-h-40 tw-w-[88%] -tw-translate-x-1/2 tw-rounded-full tw-bg-[#d2dce9] tw-opacity-85 tw-blur-[80px]" />
        <div className="tw-absolute tw-inset-0 tw-bg-white/16 tw-backdrop-blur-[26px]" />
        <div className="tw-absolute tw-inset-0 tw-bg-[linear-gradient(180deg,rgba(255,255,255,0.12)_0%,rgba(255,255,255,0.06)_100%)]" />

        <div className="tw-pointer-events-none tw-absolute tw-inset-0 tw-z-20 tw-flex tw-items-center tw-justify-center tw-px-4 tw-py-8 md:tw-py-10">
          <div className="tw-pointer-events-auto tw-w-full tw-max-w-[470px]">
            <UpgradeCard
              title="Unlock Full Clause Insights with an Upgrade!"
              description={description}
              buttonLabel="Upgrade Your Package"
              onUpgrade={onUpgrade}
              imageInside
              maxWidthClass="tw-max-w-[620px]"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
export default function ClauseAnalysisDashboard() {
  const navigate = useNavigate();
  const { uuid: routeProjectUuid, id } = useParams();
  const projectUuid = routeProjectUuid || null;
  const organizationUuid = localStorage.getItem("organization_uuid");

  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [openSections, setOpenSections] = useState({});

  const [isExporting, setIsExporting] = useState(false);
  const [livePackageAccess, setLivePackageAccess] = useState(null);
  const [isPackageAccessLoading, setIsPackageAccessLoading] = useState(Boolean(organizationUuid));

  // ── Reanalyze popup state ─────────────────────────────────────────────────
  const [showPopup, setShowPopup] = useState(false);
  const [popupPos, setPopupPos] = useState({ top: 0, left: 0 });
  const [instruction, setInstruction] = useState("");
  const [isRedrafting, setIsRedrafting] = useState(false);
  const btnRef = useRef(null);
  const popupRef = useRef(null);
  const { permissions } = usePermissions('clause_assist', 'clause_assist');
  const { isMarkAsCompleted } = useEstimation();

  const packageList = useSelector((s) => s?.auth?.user?.[0]?.package_info);

  const contractCommandNode =
    packageList?.contract_command ?? null;

  const clauseAssistNode =
    contractCommandNode?.children?.clause_assist ??
    findIdentifiedClausesNode(contractCommandNode) ??
    null;

  const identifiedClausesNode =
    clauseAssistNode?.children?.identified_clauses_access ??
    findIdentifiedClausesNode(clauseAssistNode) ??
    findIdentifiedClausesNode(contractCommandNode) ??
    null;

  const allowedClauseCount =
    getNodeCount(identifiedClausesNode) ??
    findNodeCount(identifiedClausesNode) ??
    0;

  const hasIdentifiedClausesFeature =
    !!identifiedClausesNode && isActiveNode(identifiedClausesNode);

  const storePackageAccess = useMemo(() => ({
    hasFeature: hasIdentifiedClausesFeature,
    limit: allowedClauseCount,
  }), [hasIdentifiedClausesFeature, allowedClauseCount]);

  console.log("contractCommandNode FULL →", JSON.stringify(contractCommandNode, null, 2));
  console.log("clauseAssistNode FULL →", JSON.stringify(clauseAssistNode, null, 2));
  console.log("identifiedClausesNode FULL →", JSON.stringify(identifiedClausesNode, null, 2));
  console.log("identified_clauses_access count →", allowedClauseCount);

  useEffect(() => {
    if (!organizationUuid) {
      setLivePackageAccess(storePackageAccess);
      setIsPackageAccessLoading(false);
      return;
    }

    let isCancelled = false;

    const fetchLivePackageAccess = async () => {
      setIsPackageAccessLoading(true);
      try {
        const orgRaw = await GetOneOrganization({ organization_uuid: organizationUuid });
        const orgResponse = typeof orgRaw === "string" ? JSON.parse(orgRaw) : orgRaw;
        const packageUuid = orgResponse?.data?.package_uuid;

        if (!packageUuid) {
          if (!isCancelled) {
            setLivePackageAccess(storePackageAccess);
          }
          return;
        }

        const pkgRaw = await GetOnePackage({ package_uuid: packageUuid });
        const pkgResponse = typeof pkgRaw === "string" ? JSON.parse(pkgRaw) : pkgRaw;

        if (!pkgResponse?.valid || isCancelled) {
          if (!isCancelled) {
            setLivePackageAccess(storePackageAccess);
          }
          return;
        }

        const access = getIdentifiedClausesAccessFromPackageDetail(pkgResponse?.data);
        if (!isCancelled) {
          setLivePackageAccess(access);
        }
      } catch (err) {
        console.error("Failed to fetch live clause assist package access:", err);
        if (!isCancelled) {
          setLivePackageAccess(storePackageAccess);
        }
      } finally {
        if (!isCancelled) {
          setIsPackageAccessLoading(false);
        }
      }
    };

    fetchLivePackageAccess();

    return () => {
      isCancelled = true;
    };
  }, [organizationUuid, storePackageAccess]);

  // ── Close popup on outside click or scroll ────────────────────────────────
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        popupRef.current && !popupRef.current.contains(e.target) &&
        btnRef.current && !btnRef.current.contains(e.target)
      ) {
        setShowPopup(false);
        if (!isRedrafting) setInstruction("");
      }
    };
    const handleScroll = (e) => {
      if (popupRef.current && popupRef.current.contains(e.target)) return;
      setShowPopup(false);
      if (!isRedrafting) setInstruction("");
    };
    if (showPopup) {
      document.addEventListener("mousedown", handleClickOutside);
      window.addEventListener("scroll", handleScroll, true);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [showPopup, isRedrafting]);

  // ── Open popup — position below the button ────────────────────────────────
  const handleEditClick = () => {
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setPopupPos({
        top: rect.bottom + 8,
        left: Math.max(8, rect.right - 320),
      });
    }
    setShowPopup((prev) => !prev);
    if (!isRedrafting) setInstruction("");
  };

  const handleRedraft = async () => {
    if (!instruction.trim() || isRedrafting) return;
    setIsRedrafting(true);
    try {
      const payload = {
        suggester_id: data?.suggester_id,
        context: instruction.trim(),
      };

      const raw = await SuggestClause(payload);
      const response = typeof raw === "string" ? JSON.parse(raw) : raw;

      if (response?.valid) {
        const newContent =
          response?.data?.content ??
          response?.data?.data?.content ??
          [];

        // ✅ Keep existing data (suggester_name, suggester_id, etc.)
        // Only overwrite response_text with new content
        setData((prev) => ({
          ...prev,
          response_text: JSON.stringify({ content: newContent }),
        }));

        showToast("success", "Reanalysis completed successfully.");
        setShowPopup(false);
        setInstruction("");
      } else {
        showToast("error", response?.message || "Reanalysis failed. Please try again.");
      }
    } catch (err) {
      console.error("Reanalyze error:", err);
      showToast("error", "Failed to reanalyze. Please try again.");
    } finally {
      setIsRedrafting(false);
    }
  };

  // ── Fetch detail ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!id) return;
    const fetchDetail = async () => {
      setIsLoading(true);
      try {
        const raw = await GetClauseSuggesterDetail({ suggester_uuid: id });
        const response = typeof raw === "string" ? JSON.parse(raw) : raw;
        console.log("GetClauseSuggesterDetail response:", response);
        if (response?.valid) {
          setData(response.data);
        } else {
          showToast("error", response?.message || "Failed to fetch clause details.");
        }
      } catch (err) {
        console.error("GetClauseSuggesterDetail error:", err);
        showToast("error", "Something went wrong. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchDetail();
  }, [id]);

  // ── Build docNameMap ──────────────────────────────────────────────────────
  const docNameMap = useMemo(() => {
    if (!data) return {};
    const docs =
      data.documents ??
      data.rfp_documents ??
      data.document_list ??
      data.rfp_list ??
      [];
    console.log("docNameMap source docs:", docs);
    return buildDocNameMap(docs);
  }, [data]);

  const clauses = useMemo(() => {
    if (!data?.response_text) return [];
    try {
      const parsed = typeof data.response_text === "string"
        ? JSON.parse(data.response_text)
        : data.response_text;
      return parsed?.content ?? [];
    } catch { return []; }
  }, [data]);

  const resolvedAllowedClauseCount =
    livePackageAccess?.limit ?? allowedClauseCount;

  const resolvedHasIdentifiedClausesFeature =
    livePackageAccess?.hasFeature ?? hasIdentifiedClausesFeature;

  const hasLimitedIdentifiedClausesAccess =
    resolvedHasIdentifiedClausesFeature &&
    resolvedAllowedClauseCount > 0 &&
    resolvedAllowedClauseCount < clauses.length;

  // Limit visible clauses only when a package count is actually restricting the result.
  const visibleClauses = useMemo(() => {
    if (!resolvedHasIdentifiedClausesFeature) return [];
    if (!resolvedAllowedClauseCount || resolvedAllowedClauseCount >= clauses.length) return clauses;
    return clauses.slice(0, resolvedAllowedClauseCount);
  }, [clauses, resolvedHasIdentifiedClausesFeature, resolvedAllowedClauseCount]);

  const hiddenClauses = useMemo(() => {
    if (!resolvedHasIdentifiedClausesFeature) return clauses;
    return clauses.slice(visibleClauses.length);
  }, [clauses, resolvedHasIdentifiedClausesFeature, visibleClauses.length]);

  const grouped = useMemo(() => {
    return visibleClauses.reduce((acc, clause) => {
      const cat = clause.category ?? "General";
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(clause);
      return acc;
    }, {});
  }, [visibleClauses]);

  // Init openSections — first category open by default
  useEffect(() => {
    const categories = Object.keys(grouped);

    if (categories.length === 0) {
      setOpenSections({});
      return;
    }

    setOpenSections((prev) => {
      const next = {};
      categories.forEach((cat, i) => {
        next[cat] = prev[cat] ?? i === 0;
      });
      return next;
    });
  }, [grouped]);

  const totalClauses = clauses.length;
  const highCount = clauses.filter(c => c.priority?.toLowerCase() === "high").length;
  const mediumCount = clauses.filter(c => c.priority?.toLowerCase() === "medium").length;
  const lowCount = clauses.filter(c => c.priority?.toLowerCase() === "low").length;

  const summaryData = [
    { label: 'Total Clauses', value: totalClauses, icon: <i className="icon-Law tw-text-gray-500 tw-text-[23px]" />, color: 'tw-bg-gray-100', textColor: 'tw-text-gray-800' },
    { label: 'High Priority', value: highCount, icon: <i className="icon-AI-Risk-Identifier tw-text-red-500 tw-text-[23px]" />, color: 'tw-bg-red-50', textColor: 'tw-text-red-600' },
    { label: 'Medium Priority', value: mediumCount, icon: <i className="icon-Alert tw-text-orange-500 tw-text-[23px]" />, color: 'tw-bg-orange-50', textColor: 'tw-text-orange-500' },
    { label: 'Low Priority', value: lowCount, icon: <i className="icon-Info-line tw-text-blue-600 tw-text-[23px] " />, color: 'tw-bg-blue-50', textColor: 'tw-text-blue-600' },
  ];

  const allExpanded = Object.keys(grouped).length > 0 &&
    Object.keys(grouped).every(cat => openSections[cat]);

  const handleExpandAll = () => {
    const next = {};
    Object.keys(grouped).forEach(cat => { next[cat] = true; });
    setOpenSections(next);
  };

  const handleCollapseAll = () => {
    const next = {};
    Object.keys(grouped).forEach(cat => { next[cat] = false; });
    setOpenSections(next);
  };

  const handleSectionToggle = (categoryName, nextOpen) => {
    setOpenSections((prev) => ({
      ...prev,
      [categoryName]: nextOpen,
    }));
  };

  const renderClauseSections = () => (
    <div className="tw-space-y-3">
      {Object.entries(grouped).map(([categoryName, categoryItems]) => {
        const hasHigh = categoryItems.some(c => c.priority?.toLowerCase() === "high");
        return (
          <CollapsibleSection
            key={categoryName}
            open={openSections[categoryName] ?? false}
            onToggle={(nextOpen) => handleSectionToggle(categoryName, nextOpen)}
            title={categoryName}
            icon={
              <div className="tw-w-9 tw-h-9 tw-flex tw-items-center tw-justify-center tw-bg-[#eef2ff] tw-rounded-[5px] tw-text-[#4466ff] tw-flex-shrink-0">
                {getCategoryIcon(categoryName)}
              </div>
            }
            badge={
              <span className="tw-bg-[#e8e8e8] tw-text-[#000000] tw-text-[10px] tw-px-2 tw-py-0.5 tw-rounded-[5px] tw-uppercase tw-font-semibold">
                {categoryItems.length} clause{categoryItems.length !== 1 ? "s" : ""}
              </span>
            }
            headerRight={
              hasHigh ? (
                <div className="tw-flex tw-items-center tw-gap-1.5 tw-bg-red-50 tw-text-red-600 tw-border tw-border-red-200 tw-px-3 tw-py-1 tw-rounded-[5px] tw-text-xs tw-font-bold">
                  <AlertTriangle size={15} /> High Priority
                </div>
              ) : null
            }
          >
            <div className="tw-pt-4 tw-space-y-4">
              {categoryItems.map((clause, i) => (
                <ClauseCard key={i} clause={clause} docNameMap={docNameMap} />
              ))}
            </div>
          </CollapsibleSection>
        );
      })}
    </div>
  );


  const handleExportPdf = async () => {
    console.log("EXPORT CLICKED");
    if (isExporting) return;

    setIsExporting(true);

    try {
      // ✅ STEP 1: Get base64 images
      const { coverBg } = await getPdfAssets();

      const payload = {
        companyName: localStorage.getItem("organization_name") || "ACME INC.",
        organization_id: localStorage.getItem("organization_id") || "",
        coverBg,
        templateName: "modern_blue",
        suggesterName: data?.suggester_name || "Clause Assist Report",
        clauses: visibleClauses.map((c) => ({
          category: c.category ?? "General",
          priority: c.priority ?? "low",
          original_text: c.original_text ?? "",
          suggested_change: c.suggested_change ?? "",
          reasoning: c.reasoning ?? "",
          rfp_name: c.rfp_name ?? c.document_name ?? "",
          document_name: c.document_name ?? "",
          pages: c.pages ?? "",
        })),
      };

      console.log('payload', payload)
      const response = await GenerateClauseAuditPdf(payload);

      const blob = new Blob([response.data ?? response], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download = `${(data?.suggester_name || "Clause-Audit").replace(/\s+/g, "-")}-Report.pdf`;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      showToast("success", "PDF exported successfully.");
    } catch (err) {
      console.error("Export PDF error:", err);
      showToast("error", "Failed to export PDF. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  if (isLoading || isPackageAccessLoading) return <FullPageLoader />;
  console.log("clauses length:", clauses.length);

  console.log("isExporting", isExporting);

  const handleUpgradeClick = () => {
    const isAdminPortal = window.location.pathname.startsWith("/admin");
    navigate(isAdminPortal ? "/admin/packages" : "/packages");
  };
  return (
    <div className="tw-min-h-screen">

      {/* Header */}
      <div className="tw-flex tw-justify-between tw-items-center tw-mb-8">
        <div className="tw-flex tw-items-center tw-gap-4">
          <button
            onClick={() => navigate(`/project/view/${projectUuid}/contract-command/clause-assist`)}
            className="tw-flex tw-items-center tw-justify-center tw-w-10 tw-h-10 tw-bg-[#b3bcce] tw-rounded-lg hover:tw-bg-[#0140c1] tw-transition-colors"
          >
            <i className="icon-Previous tw-text-white tw-text-lg" />
          </button>
          <div>
            <p className="tw-text-[#535353] tw-text-sm">Clause Assist/</p>
            <h1 className="tw-text-[#000] tw-text-[20px] tw-font-bold tw-break-words tw-max-w-[700px]">
              {data?.suggester_name ?? "Clause Analysis Results"}
            </h1>
          </div>
        </div>

        {permissions?.export && <button
          onClick={handleExportPdf}
          disabled={isExporting || visibleClauses.length === 0}

          className={`group tw-text-white tw-px-5 tw-py-2.5 tw-rounded-lg tw-flex tw-items-center tw-gap-2 tw-font-semibold tw-text-sm tw-whitespace-nowrap
  tw-transition-all tw-duration-300 tw-ease-in-out
  ${isExporting || visibleClauses.length === 0
              ? "tw-bg-blue-400 tw-cursor-not-allowed tw-opacity-70"
              : "tw-bg-[#0140c1] hover:tw-bg-[#1b44c4] hover:tw-shadow-lg hover:tw-shadow-blue-200/50 hover:tw-scale-[1.03] hover:-tw-translate-y-[1px] active:tw-scale-[0.98]"
            }`}
        >
          {isExporting ? (
            <>
              <svg className="tw-animate-spin tw-w-4 tw-h-4 tw-text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="tw-opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="tw-opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
              Exporting...
            </>
          ) : (
            <>
              <i className="icon-Export-PDF" /> Export Analysis
            </>
          )}
        </button>}
      </div>

      {/* Summary Stats */}
      <div className="tw-grid tw-grid-cols-2 md:tw-grid-cols-4 tw-gap-4 tw-mb-8">
        {summaryData.map((stat, idx) => (
          <div key={idx} className="tw-bg-white tw-p-5 tw-rounded-2xl tw-border tw-border-gray-100 tw-shadow-sm tw-flex tw-justify-between tw-items-start">
            <div>
              <p className="tw-text-sm tw-text-gray-500 tw-mb-2">{stat.label}</p>
              <p className={`tw-text-3xl tw-font-bold ${stat.textColor}`}>{stat.value}</p>
            </div>
            <div className={`tw-w-12 tw-h-12 tw-flex tw-items-center tw-justify-center tw-rounded-[5px] tw-flex-shrink-0 ${stat.color}`}>
              {stat.icon}
            </div>
          </div>
        ))}
      </div>

      {/* Section header + Clauses — only when Identified Clauses Access is enabled */}
      {resolvedHasIdentifiedClausesFeature && (
        <>
          <div className="tw-flex tw-justify-between tw-items-center tw-mb-4">
            <div className="tw-flex tw-items-center tw-gap-2 tw-text-gray-700">
              <div className="tw-bg-blue-100 tw-w-9 tw-h-9 tw-flex tw-items-center tw-justify-center tw-rounded-[5px] tw-flex-shrink-0">
                <i className="tw-text-blue-600 icon-book tw-text-[23px]" />
              </div>
              <h2 className="tw-font-bold tw-text-[15px]">Identified Clauses by Category</h2>
            </div>
            <div className="tw-flex tw-gap-3">

              {/* ── Reanalyze button + portal popup ── */}
              {<div className="tw-relative">
                {permissions?.edit &&
                  <button
                    ref={btnRef}
                    onClick={isMarkAsCompleted ? undefined : handleEditClick}
                    disabled={isMarkAsCompleted}
                    className={`tw-flex tw-items-center tw-gap-2 tw-border tw-px-4 tw-py-1.5 tw-rounded-lg tw-text-sm tw-font-medium tw-transition-colors
      ${isMarkAsCompleted
                        ? "tw-bg-gray-100 tw-text-gray-400 tw-border-gray-300 tw-cursor-not-allowed tw-opacity-60"
                        : "tw-bg-white tw-border-blue-600 tw-text-blue-600 hover:tw-bg-blue-50"
                      }`}
                  >
                    <i className="icon-AI-fill tw-text-[23px]" /> Reanalyze
                  </button>
                }

                {showPopup && !isMarkAsCompleted && ReactDOM.createPortal(
                  <div
                    ref={popupRef}
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      position: "fixed",
                      top: popupPos.top,
                      left: popupPos.left,
                      zIndex: 999999,
                      width: "320px",
                    }}
                    className="tw-bg-white tw-rounded-xl tw-shadow-2xl tw-border tw-border-gray-100 tw-p-5"
                  >
                    <div className="tw-flex tw-items-center tw-gap-2 tw-mb-2">
                      <i className="icon-AI-fill tw-text-[#4488ff] tw-text-[16px]"></i>
                      <h3 className="tw-text-[14px] tw-font-bold tw-text-[#0f172a]">Re-draft Section</h3>
                    </div>
                    <p className="tw-text-[12px] tw-text-[#64748b] tw-mb-3 tw-leading-relaxed">
                      Edit the content below or add instructions for the AI to regenerate this section.
                    </p>
                    <textarea
                      value={instruction}
                      onChange={(e) => setInstruction(e.target.value)}
                      placeholder="e.g., Make it more detailed, add specific project examples..."
                      rows={5}
                      className="tw-w-full tw-border-2 tw-border-[#4488ff] tw-rounded-lg tw-px-3 tw-py-2.5 tw-text-[13px] tw-text-[#1e293b] tw-resize-none focus:tw-outline-none tw-placeholder-gray-300"
                    />
                    <div className="tw-flex tw-justify-between tw-items-center tw-mt-4 tw-gap-3">
                      <button
                        onClick={() => { setShowPopup(false); if (!isRedrafting) setInstruction(''); }}
                        disabled={isRedrafting}
                        className="tw-flex-1 tw-py-2 tw-rounded-lg tw-border tw-border-gray-200 tw-text-[13px] tw-font-medium tw-text-[#475569] hover:tw-bg-gray-50 tw-transition-colors disabled:tw-opacity-50"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleRedraft}
                        disabled={!instruction.trim() || isRedrafting}
                        className="tw-flex-1 tw-py-2 tw-rounded-lg tw-bg-[#0140c1] tw-text-white tw-text-[13px] tw-font-semibold tw-inline-flex tw-items-center tw-justify-center tw-gap-1.5 hover:tw-bg-blue-800 tw-transition-colors disabled:tw-opacity-50 disabled:tw-cursor-not-allowed"
                      >
                        {isRedrafting ? (
                          <>
                            <svg className="tw-animate-spin tw-w-3 tw-h-3" viewBox="0 0 24 24" fill="none">
                              <circle className="tw-opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="tw-opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                            </svg>
                            Generating...
                          </>
                        ) : (
                          <>
                            <i className="icon-AI-fill tw-text-[12px]"></i>
                            Re-draft Section
                          </>
                        )}
                      </button>
                    </div>
                  </div>,
                  document.body
                )}
              </div>}

              {/* ── Expand / Collapse All ── */}
              {clauses.length > 0 && (
                allExpanded ? (
                  <button
                    onClick={handleCollapseAll}
                    className="tw-flex tw-items-center tw-gap-2 tw-bg-white tw-border tw-border-blue-600 tw-text-blue-600 tw-px-4 tw-py-1.5 tw-rounded-lg tw-text-sm tw-font-medium hover:tw-bg-blue-50 tw-transition-colors"
                  >
                    <i className="icon-Expansion tw-text-blue-600 tw-text-[13px]" />
                    Collapse All
                  </button>
                ) : (
                  <button
                    onClick={handleExpandAll}
                    className="tw-flex tw-items-center tw-gap-2 tw-bg-white tw-border tw-border-blue-600 tw-text-blue-600 tw-px-4 tw-py-1.5 tw-rounded-lg tw-text-sm tw-font-medium hover:tw-bg-blue-50 tw-transition-colors"
                  >
                    <i className="icon-Expansion tw-text-blue-600 tw-text-[13px]" />
                    Expand All
                  </button>
                )
              )}
            </div>
          </div>

          {clauses.length === 0 && (
            <p className="tw-text-sm tw-text-gray-400 tw-text-center tw-py-12">
              No clauses identified yet.
            </p>
          )}

          {/* Categories */}
          {clauses.length > 0 && (
            <>
              {Object.keys(grouped).length > 0 && renderClauseSections()}
              {hasLimitedIdentifiedClausesAccess && hiddenClauses.length > 0 && (
                <LockedIdentifiedClauses
                  clauseCount={totalClauses}
                  allowedCount={resolvedAllowedClauseCount}
                  onUpgrade={handleUpgradeClick}
                />
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
