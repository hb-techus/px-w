import React, { useState, useEffect, useRef } from "react";
import {
    FileText, ChevronLeft, ChevronRight,
    ChevronDown, Check, Maximize2, Minimize2, X,
} from "lucide-react";
import FullPageLoader from "../../../../genriccomponents/loaders/FullPageLoader";
import { useRfpData } from "./useRfpData";
import PdfHighlightViewer from "./PdfHighlightViewer";
import { GeneratePdf } from "../../../../services/techus-services";
import { getPdfAssets } from "../../../../utils/pdfAssets";

import UpgradeCard from "../../../../genriccomponents/UpgradeCard";
import CONFIG from "../../../../config/config";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import NoDataFound from "../../../../genriccomponents/NoDataFound";

// ─── S3 key ────────────────────────────────────────────────────────────────────
const getGoNoGoS3Key = (pdfName) => {
    const project_uuid = localStorage.getItem("project_uuid");
    return `projects/project_${project_uuid}/rfp/${pdfName}`;
};

// ─── Severity color config ─────────────────────────────────────────────────────
const SEVERITY_COLORS = {
    critical: { hex: "#ff0000", border: "tw-border-l-[#ff0000]", badge: "tw-bg-[#ff0000]", lightBg: "#fff5f5" },
    high:     { hex: "#ff9500", border: "tw-border-l-[#ff9500]", badge: "tw-bg-[#ff9500]", lightBg: "#fff9f0" },
    medium:   { hex: "#4488ff", border: "tw-border-l-[#4488ff]", badge: "tw-bg-[#4488ff]", lightBg: "#f0f5ff" },
    low:      { hex: "#a7a7a7", border: "tw-border-l-[#a7a7a7]", badge: "tw-bg-[#a7a7a7]", lightBg: "#f8f8f8" },
};

const getSevKey = (s = "") => s.toLowerCase();

const truncateReference = (ref = "") => {
    const words = ref.trim().split(/\s+/);
    if (words.length <= 8) return ref;
    return `${words.slice(0, 2).join(" ")} ..... ${words.slice(-3).join(" ")}`;
};

const getSevBorderStyle = (severity) => {
    const cfg = SEVERITY_COLORS[getSevKey(severity)];
    return cfg ? { borderLeft: `4px solid ${cfg.hex}` } : {};
};

// ─── FilterDropdown ────────────────────────────────────────────────────────────
function FilterDropdown({ labelAll, value, onChange, options, width = "tw-w-44" }) {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        const handler = (e) => {
            if (ref.current && !ref.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const handleSelect = (opt) => {
        onChange(value === opt ? "all" : opt);
        setOpen(false);
    };

    return (
        <div ref={ref} className={`tw-relative ${width}`}>
            <button
                type="button"
                onClick={() => setOpen((o) => !o)}
                className="tw-w-full tw-flex tw-items-center tw-justify-between tw-px-3 tw-py-2 tw-bg-white tw-border tw-border-[#e0e0e0] tw-rounded-md tw-text-sm tw-text-gray-600 hover:tw-border-gray-400 tw-transition-all tw-duration-200"
            >
                <span className={`tw-truncate tw-tracking-[0.31px] ${value && value !== "all" ? "tw-text-[#1e293b]" : "tw-text-gray-400"}`}>
                    {value && value !== "all" ? value : labelAll}
                </span>
                <ChevronDown
                    size={16}
                    className={`tw-flex-shrink-0 tw-ml-1 tw-text-gray-400 tw-transition-transform tw-duration-200 ${open ? "tw-rotate-180" : ""}`}
                />
            </button>

            {open && (
                <div
                    className="tw-absolute tw-z-50 tw-mt-1 tw-w-full tw-bg-white tw-border tw-border-gray-200 tw-rounded-md tw-shadow-lg tw-py-1"
                    style={{ maxHeight: 220, overflowY: "auto" }}
                >
                    <button
                        onClick={() => { onChange("all"); setOpen(false); }}
                        className={`tw-w-full tw-flex tw-items-center tw-justify-between tw-px-3 tw-py-2 tw-text-left tw-text-sm tw-transition-colors ${value === "all" ? "tw-bg-blue-50 tw-text-blue-600 tw-font-medium" : "tw-text-gray-700 hover:tw-bg-gray-50"}`}
                    >
                        <span className="tw-truncate">{labelAll}</span>
                        {value === "all" && <Check size={13} className="tw-flex-shrink-0 tw-ml-2 tw-text-blue-500" />}
                    </button>

                    {options.map((opt) => (
                        <button
                            key={opt}
                            onClick={() => handleSelect(opt)}
                            className={`tw-w-full tw-flex tw-items-center tw-justify-between tw-px-3 tw-py-2 tw-text-left tw-text-sm tw-transition-colors ${value === opt ? "tw-bg-blue-50 tw-text-blue-600 tw-font-medium" : "tw-text-gray-700 hover:tw-bg-gray-50"}`}
                        >
                            <span className="tw-truncate">{opt}</span>
                            {value === opt && <Check size={13} className="tw-flex-shrink-0 tw-ml-2 tw-text-blue-500" />}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

function LockedGoNoGoItems({ totalCount, onUpgrade, visibleCount }) {
  const description = `You've reached your limit of ${visibleCount} viewable items. ${totalCount} more bid factors are locked. Upgrade your package to reveal all bid factors and recommendations.`;

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
              title="Unlock Full Bid Score Insights with an Upgrade!"
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

// ─── Main Component ────────────────────────────────────────────────────────────
export default function GoNoGoAnalysis() {
    const { data, loading, isInitialLoad, error } = useRfpData("overview");
    const navigate = useNavigate();
    // ── PDF viewer state ──
    const [isPdfOpen, setIsPdfOpen]     = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [selectedPage, setSelectedPage] = useState(1);
    const [pagesRange, setPagesRange]   = useState(null);
    const [isExpanded, setIsExpanded]   = useState(false);

    // ── Filter / search / pagination state ──
    const [searchQuery, setSearchQuery]       = useState("");
    const [severityFilter, setSeverityFilter] = useState("all");
    const [categoryFilter, setCategoryFilter] = useState("all");
    const [currentPage, setCurrentPage]       = useState(1);
    const itemsPerPage = 5;
    const [exporting, setExporting] = useState(false);

    // ── Ref to scroll the content area back to top on page change ──
    const scrollContainerRef = useRef(null);

    // const { permissions, packagePermissions } = usePermissions('bid_score', 'bid_intelligence');
    const packageList = useSelector((s) => s?.auth?.user?.[0]?.package_info);
    const organizationImage = useSelector((s) => s?.auth?.user?.[0]?.organization_image);
    const remoteImageUrl = organizationImage
        ? `${CONFIG.VITE_AWS_ENDPOINT}/organization_images/${organizationImage}`
        : `${CONFIG.VITE_AWS_ENDPOINT}/organization_images/logo.png`;

     console.log(remoteImageUrl,"pdf image")   
     const permissionsList = useSelector((s) => s?.auth?.user?.[0]?.permission_info);
     const bidScorePermissions = permissionsList?.bid_score || 
     permissionsList?.bid_intelligence?.children?.bid_score || {};
     const canExport = bidScorePermissions?.export === true || bidScorePermissions?.export === 1;

    // Reset to page 1 whenever filters change
    useEffect(() => { setCurrentPage(1); }, [searchQuery, severityFilter, categoryFilter]);

    // Scroll to top whenever the current page changes
    useEffect(() => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollTo({ top: 0, behavior: "smooth" });
        }
    }, [currentPage]);

    if (isInitialLoad) return <FullPageLoader />;

    const rawItems = data?.go_no_go_analysis ?? [];
    const bidScoreNode = packageList?.bid_intelligence?.children?.bid_score;
    const bidScoreItemCount = bidScoreNode?.item_count ?? null;
   // 0 means unlimited, positive number means limited
const hasFullAccess = !bidScoreItemCount || bidScoreItemCount === 0;
const VISIBLE_ITEM_COUNT = (bidScoreItemCount && bidScoreItemCount > 0) ? bidScoreItemCount : rawItems.length;


    void setSelectedItem
    void setSelectedPage
    void setPagesRange
if (error || rawItems.length === 0) {
    return (
        <div className="tw-flex tw-h-full">
            <div className="tw-flex-1 tw-overflow-y-auto">
                <div className="tw-p-1 tw-space-y-6 tw-mx-auto">

                    {/* Breadcrumb */}
                    <div>
                        <div className="tw-flex tw-items-center tw-gap-2">
                            <span className="tw-text-[20px] tw-text-gray-600 tw-font-medium">Bid Intelligence</span>
                            <i className="icon-Save-and-Continue" />
                            <span className="tw-text-[20px] tw-font-bold tw-text-gray-900">Bid Score</span>
                        </div>
                        <p className="tw-text-[#1e293b] tw-text-[14px]">Automatically identifies go/no-go deal killers and rates them by severity to help you decide whether to pursue a bid.</p>
                    </div>

                    {/* No Data — same style as BitInviteTable */}
                
                   <div className="tw-bg-white tw-border tw-border-gray-200 tw-rounded-[15px] tw-p-4">
                    <NoDataFound
                        title="Due to insufficient data, no insights are currently available"
                        description={error || "Due to insufficient data, no insights are currently availabler"}
                        buttonLabel={null}
                    />
                    </div>

                </div>
            </div>
        </div>
    );
}

    // ── Unique filter options ──
    const severities = [...new Set(rawItems.map((r) => r.severity).filter(Boolean))].map(
        (s) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase()
    );
    const categories = [...new Set(rawItems.map((r) => r.category).filter(Boolean))];

    // ── Summary counts ──
    const counts = ["critical", "high", "medium", "low"].reduce((acc, s) => {
        acc[s] = rawItems.filter((r) => getSevKey(r.severity) === s).length;
        return acc;
    }, {});

    // ── Filtered list ──
    const filtered = rawItems.filter((item) => {
        const sevNorm = item.severity
            ? item.severity.charAt(0).toUpperCase() + item.severity.slice(1).toLowerCase()
            : "";
        if (severityFilter !== "all" && sevNorm !== severityFilter) return false;
        if (categoryFilter !== "all" && item.category !== categoryFilter) return false;
        if (
            searchQuery &&
            !item.category?.toLowerCase().includes(searchQuery.toLowerCase()) &&
            !item.description?.toLowerCase().includes(searchQuery.toLowerCase())
        ) return false;
        return true;
    });

    // For limited users, cap the viewable items at VISIBLE_ITEM_COUNT
const viewableItems = hasFullAccess ? filtered : filtered.slice(0, VISIBLE_ITEM_COUNT);

// Check if locked items exist beyond the limit
const hasLockedItems = !hasFullAccess && rawItems.length > VISIBLE_ITEM_COUNT;

// Pagination based on viewable items
const totalPages = Math.ceil(viewableItems.length / itemsPerPage);
const paginated  = viewableItems.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

// Is the current page the last allowed page (where blur shows)?
const isLastAllowedPage = !hasFullAccess && hasLockedItems && currentPage === totalPages;


    // ── Shared page-change handler ─────────────────────────────────────────────
    const handlePageChange = (newPage) => {
        setCurrentPage(newPage);
        // scrollContainerRef useEffect handles the scroll
    };

    const handleUpgradeClick = () => {
  const isAdminPortal = window.location.pathname.startsWith("/admin");
  navigate(isAdminPortal ? "/admin/packages" : "/packages");
};

    const buildHighlights = (item) => {
        if (!item?.description) return [];
        return [{ pageIndex: selectedPage, text: item.description, color: "rgba(255,255,0,0.5)" }];
    };

    const triggerDownload = (arrayBuffer, filename) => {
        const blob = new Blob([arrayBuffer], { type: "application/pdf" });
        const url  = URL.createObjectURL(blob);
        const a    = document.createElement("a");
        a.href = url; a.download = filename; a.style.display = "none"; a.rel = "noopener noreferrer";
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 5000);
    };

    const handleExport = async () => {
        setExporting(true);
        try {
            const { coverBg, aiIconBase64 } = await getPdfAssets();
            const payload = {
                type: "gonogo",
                companyName: "ACME INC.",
                coverBg,
                remoteImageUrl,
                aiIconBase64,
                items: rawItems,
                counts,
                totalCategories: categories.length,
                footerNote: "This report is powered by PrexoAI",
            };
            const arrayBuffer = await GeneratePdf(payload);
            triggerDownload(arrayBuffer, "BidScore-Analysis-Report.pdf");
        } catch (err) {
            console.error("Go/No-Go PDF export failed:", err);
        } finally {
            setExporting(false);
        }
    };

    return (
        <div className="tw-flex tw-h-full">
            {loading && <FullPageLoader />}

            {/* ── Scrollable content area ── */}
            <div ref={scrollContainerRef} className="tw-flex-1 tw-overflow-y-auto">
                <div className="tw-p-1 tw-space-y-6 tw-mx-auto">

                    {/* Breadcrumb */}
                    <div>
                        <div className="tw-flex tw-items-center tw-gap-2">
                            <span className="tw-text-[20px] tw-text-gray-600 tw-font-medium">Bid Intelligence</span>
                            <i className="icon-Save-and-Continue" />
                            <span className="tw-text-[20px] tw-font-bold tw-text-gray-900">Bid Score</span>
                        </div>
                        <p className="tw-text-[#1e293b] tw-text-[14px]">Automatically identifies go/no-go deal killers and rates them by severity to help you decide whether to pursue a bid.</p>
                    </div>

                    {/* Summary Banner */}
                    <div className="tw-bg-[#fff9f9] tw-border tw-border-[#ff4444] tw-rounded-xl tw-p-5 tw-shadow-sm">
                        <div className="tw-flex tw-items-center tw-justify-between tw-flex-wrap tw-gap-4">
                            <div className="tw-flex tw-items-center tw-gap-3">
                                <div className="tw-w-10 tw-h-10 tw-rounded-full tw-bg-[#fff9f9] tw-border tw-border-[#ff4444] tw-flex tw-items-center tw-justify-center">
                                    <i className="tw-w-4 tw-h-4 icon-Go-no-go tw-text-[#ff4444]" />
                                </div>
                                <div>
                                    <div className="tw-flex tw-items-center tw-gap-2">
                                        <h3 className="tw-text-[20px] tw-font-bold tw-text-[#002149]">Go/No Go Analysis</h3>
                                        <span className="tw-flex tw-items-center tw-gap-2 tw-text-[14px] tw-font-semibold tw-px-3 tw-rounded-full tw-border tw-bg-[#e9f2ff] tw-text-[#4488ff] tw-border-[#4488ff]">
                                            <i className="icon-AI-fill tw-w-3 tw-h-3" /> AI Generated
                                        </span>
                                    </div>
                                    <p className="tw-text-sm tw-text-[#1e293b]">
                                        AI detected {rawItems.length} bid decision factors across {categories.length} categories
                                    </p>
                                </div>
                            </div>
                            <div className="tw-flex tw-items-center tw-gap-6">
                                {[
                                    { count: counts.critical, label: "Critical", color: "#ff0000" },
                                    { count: counts.high,     label: "High",     color: "#ff9500" },
                                    { count: counts.medium,   label: "Medium",   color: "#4488ff" },
                                    { count: counts.low,      label: "Low",      color: "#a7a7a7" },
                                ].map(({ count, label, color }) => (
                                    <div key={label} className="tw-text-center">
                                        <div className="tw-text-2xl tw-font-bold" style={{ color }}>{count || "-"}</div>
                                        <div className="tw-text-xs tw-text-gray-600">{label}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="tw-flex tw-items-center tw-justify-between tw-gap-4 tw-flex-wrap tw-bg-white tw-border tw-border-gray-200 tw-rounded-xl tw-px-4 tw-py-5">
                        <div className="tw-relative tw-flex-1 tw-max-w-md">
                            <svg className="tw-absolute tw-left-3 tw-top-1/2 tw--translate-y-1/2 tw-w-4 tw-h-4 tw-text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <input
                                type="text"
                                placeholder="Search bid factors..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="tw-w-full tw-pl-10 tw-pr-4 tw-h-10 tw-bg-gray-50 tw-border tw-border-gray-200 tw-rounded-lg tw-text-sm focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-blue-400 focus:tw-border-blue-400"
                            />
                        </div>

                        <div className="tw-flex tw-items-center tw-gap-3">
                            <FilterDropdown
                                labelAll="All Severities"
                                value={severityFilter}
                                onChange={setSeverityFilter}
                                options={severities}
                            />
                            <FilterDropdown
                                labelAll="All Categories"
                                value={categoryFilter}
                                onChange={setCategoryFilter}
                                options={categories}
                                width="tw-w-52"
                            />
                           {canExport && (
    <button
        onClick={handleExport}
        disabled={exporting}
        className={`tw-flex tw-w-[160px] tw-items-center tw-gap-2 tw-h-10 tw-px-4 tw-rounded-md tw-text-[15px] tw-transition-all
            ${exporting
                ? "tw-bg-blue-300 tw-text-white tw-cursor-not-allowed tw-opacity-60"
                : "tw-bg-[#0140c1] tw-text-white hover:tw-bg-blue-800 tw-cursor-pointer"
            }`}
    >
        <FileText className="tw-w-4 tw-h-4" />
        {exporting ? "Exporting..." : "Export to PDF"}
    </button>
)}
                        </div>
                    </div>

                    {/* Cards */}
{/* Cards - unified single branch */}
<div className="tw-space-y-4">
  {paginated.map((item, index) => {
    const sevKey = getSevKey(item.severity);
    const cfg    = SEVERITY_COLORS[sevKey] || {};
    return (
      <div
        key={index}
        className="tw-bg-white tw-border tw-border-gray-200 tw-rounded-xl tw-transition-all hover:tw-shadow-lg hover:tw-border-gray-300"
        style={getSevBorderStyle(item.severity)}
      >
        <div className="tw-p-6">
          <div className="tw-flex tw-justify-between tw-items-start tw-mb-3">
            <div className="tw-flex tw-items-center tw-gap-3">
              <span
                className="tw-text-white tw-text-xs tw-font-semibold tw-px-2.5 tw-py-0.5 tw-rounded-[20px] tw-uppercase tw-shadow-sm"
                style={{ backgroundColor: cfg.hex }}
              >
                {item.severity}
              </span>
              <h4 className="tw-font-bold tw-text-gray-900 tw-text-[15px]">{item.category}</h4>
            </div>
            <div className="tw-flex tw-items-center tw-gap-4">
              {item.reference && (
                <div className="tw-flex tw-items-center tw-gap-1.5 tw-text-[12px] tw-text-blue-500 tw-font-medium">
                  <i className="icon-Document-analysis" style={{ fontSize: "14px" }} />
                  <span title={item.reference}>{truncateReference(item.reference)}</span>
                </div>
              )}
            </div>
          </div>
          <p className="tw-text-sm tw-text-gray-600 tw-leading-relaxed tw-mb-4">{item.description}</p>
          <div className="tw-bg-[#F8FAFF] tw-border tw-border-blue-100 tw-rounded-lg tw-p-4">
            <div className="tw-flex tw-items-center tw-gap-2 tw-mb-1.5">
              <i className="icon-AI-fill tw-text-indigo-500 tw-flex-shrink-0" style={{ fontSize: "14px" }} />
              <span className="tw-text-[11px] tw-font-bold tw-text-indigo-600 tw-uppercase tw-tracking-wide">
                AI Suggested Remedy
              </span>
            </div>
            <p className="tw-text-sm tw-text-gray-700">{item.ai_suggested_remedy}</p>
          </div>
        </div>
      </div>
    );
  })}
</div>

{/* Blur popup only on last allowed page */}
{isLastAllowedPage && hasLockedItems && (
  <LockedGoNoGoItems
    totalCount={rawItems.length - VISIBLE_ITEM_COUNT}
    visibleCount={VISIBLE_ITEM_COUNT}
    onUpgrade={handleUpgradeClick}
  />
)}

                    {filtered.length === 0 && (
                        <div className="tw-text-center tw-py-12">
                            <p className="tw-text-gray-500">No items match your filters. Try adjusting your search criteria.</p>
                        </div>
                    )}

                    {/* Pagination */}
                {/* Pagination */}
{totalPages > 1 && (
  <div className="tw-flex tw-items-center tw-justify-end tw-gap-2 tw-pt-4">
    <button
      onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
      disabled={currentPage === 1}
      className="tw-h-10 tw-px-4 tw-bg-white tw-border tw-border-gray-300 tw-rounded-md tw-text-sm tw-font-medium tw-flex tw-items-center tw-gap-2 hover:tw-bg-gray-50 disabled:tw-opacity-50 disabled:tw-cursor-not-allowed tw-transition-all"
    >
      <ChevronLeft className="tw-w-4 tw-h-4" /> Previous
    </button>

    {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => (
      <button
        key={pg}
        onClick={() => handlePageChange(pg)}
        className={`tw-h-10 tw-w-10 tw-rounded-md tw-text-sm tw-font-medium tw-transition-all ${
          currentPage === pg
            ? "tw-bg-[#4488FF] tw-text-white"
            : "tw-bg-white tw-border tw-border-gray-300 tw-text-gray-900 hover:tw-bg-gray-50"
        }`}
      >
        {pg}
      </button>
    ))}

    <button
      onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
      disabled={currentPage === totalPages}
      className="tw-h-10 tw-px-4 tw-bg-white tw-border tw-border-gray-300 tw-rounded-md tw-text-sm tw-font-medium tw-flex tw-items-center tw-gap-2 hover:tw-bg-gray-50 disabled:tw-opacity-50 disabled:tw-cursor-not-allowed tw-transition-all"
    >
      Next <ChevronRight className="tw-w-4 tw-h-4" />
    </button>
  </div>
)}
                </div>
            </div>

            {/* PDF Viewer Overlay */}
            {isPdfOpen && selectedItem && (
                <>
                    <div className={`tw-fixed tw-inset-y-0 tw-right-0 tw-bg-white tw-shadow-2xl tw-z-50 tw-flex tw-flex-col tw-transition-all tw-duration-300 ${isExpanded ? "tw-w-full" : "tw-w-1/2"}`}>
                        <div className="tw-flex tw-items-center tw-justify-between tw-px-4 tw-py-2 tw-border-b tw-bg-white">
                            <div />
                            <span className="tw-text-sm tw-font-medium tw-text-gray-700">Page {selectedPage}</span>
                            <div className="tw-flex tw-items-center tw-gap-2">
                                <button onClick={() => setIsExpanded((e) => !e)} className="tw-p-1.5 tw-rounded hover:tw-bg-gray-200">
                                    {isExpanded ? <Minimize2 className="tw-w-4 tw-h-4" /> : <Maximize2 className="tw-w-4 tw-h-4" />}
                                </button>
                                <button onClick={() => setIsPdfOpen(false)} className="tw-p-1.5 tw-rounded hover:tw-bg-gray-200">
                                    <X className="tw-w-4 tw-h-4" />
                                </button>
                            </div>
                        </div>
                        <div className="tw-flex tw-flex-1 tw-overflow-hidden">
                            <div className="tw-flex-1 tw-bg-gray-100 tw-overflow-hidden">
                                <PdfHighlightViewer
                                    rfpS3Key={getGoNoGoS3Key(selectedItem.pdf_name)}
                                    page={selectedPage}
                                    pagesRange={pagesRange}
                                    highlights={buildHighlights(selectedItem)}
                                />
                            </div>
                        </div>
                    </div>
                    <div className="tw-fixed tw-inset-0 tw-bg-black/20 tw-z-40" onClick={() => setIsPdfOpen(false)} />
                </>
            )}
        </div>
    );
}