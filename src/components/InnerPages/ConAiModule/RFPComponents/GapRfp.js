import React, { useState, useEffect, useRef } from 'react';
import { FileText, Lightbulb, AlertCircle, AlertTriangle, ChevronLeft, ChevronRight, Tag, Clock, DollarSign, ChevronDown, Check } from 'lucide-react';
import { X } from "lucide-react";
import FullPageLoader from '../../../../genriccomponents/loaders/FullPageLoader';
import { useRfpData } from './useRfpData';
import PdfHighlightViewer, { preloadPdf } from './PdfHighlightViewer';
import { GeneratePdf } from '../../../../services/techus-services';
import { getPdfAssets } from '../../../../utils/pdfAssets';


import CONFIG from '../../../../config/config';
import usePermissions from '../../../Common/usePermissions';
import { useSelector } from 'react-redux';
import UpgradeCard from '../../../../genriccomponents/UpgradeCard';
import { useNavigate } from 'react-router-dom';
import NoDataFound from '../../../../genriccomponents/NoDataFound';

// ─── Static S3 key ─────────────────────────────────────────────────────────────
const getGapS3Key = (gap) => {
  const project_uuid = localStorage.getItem("project_uuid");
  return `projects/project_${project_uuid}/rfp/${gap.pdf_name}`;
};

// ─── Color config ──────────────────────────────────────────────────────────────
const SEVERITY_COLORS = {
  critical: {
    hex: '#ff0000',
    lightBg: '#fff5f5',
    badgeBg: '#ff0000',
    badgeText: '#ffffff',
    textColor: '#ff0000',
  },
  high: {
    hex: '#ff9500',
    lightBg: '#fff9f0',
    badgeBg: '#ff9500',
    badgeText: '#ffffff',
    textColor: '#ff9500',
  },
  medium: {
    hex: '#4488ff',
    lightBg: '#f0f5ff',
    badgeBg: '#4488ff',
    badgeText: '#ffffff',
    textColor: '#4488ff',
  },
  low: {
    hex: '#a7a7a7',
    lightBg: '#f8f8f8',
    badgeBg: '#a7a7a7',
    badgeText: '#ffffff',
    textColor: '#a7a7a7',
  },
};

const getSevKey = (s = '') => s.toLowerCase();

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
        onClick={() => setOpen(o => !o)}
        className="tw-w-full tw-flex tw-items-center tw-justify-between tw-px-3 tw-py-2 tw-bg-white tw-border tw-border-[#e0e0e0] tw-rounded-md tw-text-sm tw-text-gray-600 hover:tw-border-gray-400 tw-transition-all tw-duration-200"
      >
        <span
          className={`tw-truncate tw-tracking-[0.31px] ${value && value !== "all" ? "tw-text-[#1e293b]" : "tw-text-gray-400"}`}
        >
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
            className={`tw-w-full tw-flex tw-items-center tw-justify-between tw-px-3 tw-py-2 tw-text-left tw-text-sm tw-transition-colors
              ${value === "all" ? "tw-bg-blue-50 tw-text-blue-600 tw-font-medium" : "tw-text-gray-700 hover:tw-bg-gray-50"}`}
          >
            <span className="tw-truncate">{labelAll}</span>
            {value === "all" && <Check size={13} className="tw-flex-shrink-0 tw-ml-2 tw-text-blue-500" />}
          </button>

          {options.length === 0 ? (
            <p className="tw-text-xs tw-text-gray-400 tw-px-3 tw-py-2">No options</p>
          ) : (
            options.map(opt => (
              <button
                key={opt}
                onClick={() => handleSelect(opt)}
                className={`tw-w-full tw-flex tw-items-center tw-justify-between tw-px-3 tw-py-2 tw-text-left tw-text-sm tw-transition-colors
                  ${value === opt ? "tw-bg-blue-50 tw-text-blue-600 tw-font-medium" : "tw-text-gray-700 hover:tw-bg-gray-50"}`}
              >
                <span className="tw-truncate">{opt}</span>
                {value === opt && <Check size={13} className="tw-flex-shrink-0 tw-ml-2 tw-text-blue-500" />}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}


function LockedGapItems({ totalCount, visibleCount, onUpgrade }) {
  const description = `You've reached your limit of ${visibleCount} viewable items. ${totalCount} more gaps are locked. Upgrade your package to reveal all gaps and recommendations.`;

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
              title="Unlock Full Scope Gap Insights with an Upgrade!"
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
export default function GapIdentifier() {
  const { data, loading, isInitialLoad, error } = useRfpData("gaps");
const navigate = useNavigate();
const packageList = useSelector((s) => s?.auth?.user?.[0]?.package_info);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isPdfOpen, setIsPdfOpen] = useState(false);
  const [selectedGap, setSelectedGap] = useState(null);
  const [selectedPage, setSelectedPage] = useState(1);
  const [selectedPagesRange, setSelectedPagesRange] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [exporting, setExporting] = useState(false);
  const itemsPerPage = 5;

  // ── Ref to scroll the content area back to top on page change ──
  const scrollContainerRef = useRef(null);

  const organizationImage = useSelector((s) => s?.auth?.user?.[0]?.organization_image);
  const remoteImageUrl = organizationImage
    ? `${CONFIG.VITE_AWS_ENDPOINT}/organization_images/${organizationImage}`
     : `${CONFIG.VITE_AWS_ENDPOINT}/organization_images/logo.png`;

  const { permissions, packagePermissions } = usePermissions('scope_gap_finder', 'bid_intelligence');

  const normalizeLabel = (text = '') =>
    text.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase());

  const capitalize = (v = '') => v.charAt(0).toUpperCase() + v.slice(1).toLowerCase();

  // Reset to page 1 when filters change
  useEffect(() => { setCurrentPage(1); }, [severityFilter, categoryFilter, searchQuery]);

  // Scroll to top whenever the current page changes
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [currentPage]);

  const rawGaps = Array.isArray(data) ? data : (data?.gaps ?? []);
  const legalGaps = rawGaps.map(gap => ({
    ...gap,
    category: normalizeLabel(gap.category),
    severity: capitalize(gap.severity),
  }));

  // Add after legalGaps definition
const scopeGapNode = packageList?.bid_intelligence?.children?.scope_gap;
const scopeGapItemCount = scopeGapNode?.item_count ?? null;
const hasFullAccess = !scopeGapItemCount || scopeGapItemCount === 0;
const VISIBLE_ITEM_COUNT = (scopeGapItemCount && scopeGapItemCount > 0)
  ? scopeGapItemCount
  : legalGaps.length;

const handleUpgradeClick = () => {
  const isAdminPortal = window.location.pathname.startsWith("/admin");
  navigate(isAdminPortal ? "/admin/packages" : "/packages");
};

  const parsePdfPages = (pagesValue) => {
    const raw = pagesValue?.toString().trim() || "";
    const pageNumbers = [];
    raw.split(",").forEach((part) => {
      const trimmed = part.trim();
      if (!trimmed) return;
      if (trimmed.includes("-")) {
        const [start, end] = trimmed.split("-").map((p) => parseInt(p.trim(), 10));
        if (!isNaN(start) && !isNaN(end)) {
          for (let i = start; i <= end; i++) {
            if (!pageNumbers.includes(i)) pageNumbers.push(i);
          }
        }
      } else {
        const n = parseInt(trimmed, 10);
        if (!isNaN(n) && !pageNumbers.includes(n)) pageNumbers.push(n);
      }
    });
    return pageNumbers.length ? pageNumbers : [1];
  };

  const resolveHighlightPage = (gap) => {
    const pages = parsePdfPages(gap?.pdf_pages);
    if (pages.length === 1) return pages[0];
    return pages[pages.length - 1];
  };

  const handleViewPdf = (gap) => {
    const pages = gap.pdf_pages?.toString().trim() || null;
    const resolvedPage = resolveHighlightPage(gap);
    setSelectedGap(gap);
    setSelectedPage(resolvedPage);
    setSelectedPagesRange(pages);
    setIsPdfOpen(true);
  };

  const buildHighlightsFromGap = (gap) => {
    if (!gap?.original_content_snippet) return [];
    const text = gap.original_content_snippet.trim();
    const key = getSevKey(gap.severity);
    const colorMap = {
      critical: 'rgba(255,0,0,0.35)',
      high: 'rgba(255,149,0,0.4)',
      medium: 'rgba(68,136,255,0.35)',
      low: 'rgba(167,167,167,0.35)',
    };
    const color = colorMap[key] || 'rgba(255,255,0,0.6)';
    const pageIndex = resolveHighlightPage(gap);
    return [{ pageIndex, text, color }];
  };

  // ── Derived ────────────────────────────────────────────────────────────────
  const categories = [...new Set(legalGaps.map(g => g.category))].filter(Boolean);
  const severities = [...new Set(legalGaps.map(r => r.severity))].filter(Boolean);

  const filteredGaps = legalGaps.filter(gap => {
  if (categoryFilter !== "all" && gap.category !== categoryFilter) return false;
  if (severityFilter !== "all" && gap.severity !== severityFilter) return false;
  if (searchQuery && !gap.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
  return true;
});

const viewableGaps = hasFullAccess ? filteredGaps : filteredGaps.slice(0, VISIBLE_ITEM_COUNT);
const hasLockedItems = !hasFullAccess && legalGaps.length > VISIBLE_ITEM_COUNT;

const totalPages = Math.ceil(viewableGaps.length / itemsPerPage);
const startIndex = (currentPage - 1) * itemsPerPage;
const paginatedGaps = viewableGaps.slice(startIndex, startIndex + itemsPerPage);

const isLastAllowedPage = !hasFullAccess && hasLockedItems && currentPage === totalPages;

  const criticalCount = legalGaps.filter(g => g.severity?.toLowerCase() === "critical").length;
  const highCount     = legalGaps.filter(g => g.severity?.toLowerCase() === "high").length;
  const mediumCount   = legalGaps.filter(g => g.severity?.toLowerCase() === "medium").length;
  const lowCount      = legalGaps.filter(g => g.severity?.toLowerCase() === "low").length;

  const getSeverityBorderStyle = (severity) => {
    const color = SEVERITY_COLORS[getSevKey(severity)]?.hex;
    return color ? { borderLeft: `4px solid ${color}` } : {};
  };

  // ── Shared page-change handler ─────────────────────────────────────────────
  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    // scrollContainerRef useEffect handles the scroll
  };
  void setIsExpanded
  if (isInitialLoad) return <FullPageLoader />;
  
if (error || legalGaps.length === 0) {
    return (
      <div className="tw-flex tw-h-full">
        <div className="tw-flex-1 tw-overflow-y-auto">
          <div className="tw-p-1 tw-space-y-6 tw-mx-auto">

            {/* Breadcrumb */}
            <div>
              <div className="tw-flex tw-items-center tw-gap-2">
                <span className="tw-text-[20px] tw-text-gray-600 tw-font-medium">Bid Intelligence</span>
                <i className="icon-Save-and-Continue" />
                <span className="tw-text-[20px] tw-font-bold tw-text-gray-900">Scope Gap Finder</span>
              </div>
              <p className="tw-text-[#1e293b] tw-text-[14px]">Detects missing, vague, or incomplete scope items in the RFP that could impact your cost or timeline.</p>
            </div>

            {/* No Data */}
            <div className="tw-bg-white tw-border tw-border-gray-200 tw-rounded-[15px] tw-p-4">
              <NoDataFound
                title="No Gap Data Available"
                description={error || "No gap analysis data found."}
                buttonLabel={null}
              />
            </div>

          </div>
        </div>
      </div>
    );
  }

  const triggerDownload = (arrayBuffer, filename) => {
    const blob = new Blob([arrayBuffer], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.style.display = 'none'; a.rel = 'noopener noreferrer';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const { coverBg, aiIconBase64 } = await getPdfAssets();
      const payload = {
        type: 'scopegap',
        companyName: 'ACME INC.',
        coverBg,
        remoteImageUrl,
        aiIconBase64,
        gaps: legalGaps,
        counts: { critical: criticalCount, high: highCount, medium: mediumCount, low: lowCount },
        totalCategories: categories.length,
        footerNote: 'This report is powered by PrexoAI.',
      };
      const arrayBuffer = await GeneratePdf(payload);
      triggerDownload(arrayBuffer, 'Scope-Gap-Finder-Report.pdf');
    } catch (err) {
      console.error('Scope Gap PDF export failed:', err);
    } finally {
      setExporting(false);
    }
  };
  void packagePermissions
  return (
    <div className="tw-flex tw-h-full">
      {loading && <FullPageLoader />}

      {/* ── Scrollable content area ── */}
      <div ref={scrollContainerRef} className="tw-flex-1 tw-overflow-y-auto">
        <div className="tw-p-1 tw-space-y-5 tw-mx-auto">

          {/* Breadcrumb */}
          <div>
            <div className="tw-flex tw-items-center tw-gap-2">
              <span className="tw-text-[20px] tw-text-gray-600 tw-font-medium">Bid Intelligence</span>
              <i className="icon-Save-and-Continue" />
              <span className="tw-text-[20px] tw-font-bold tw-text-gray-900">Scope Gap Finder</span>
            </div>
            <p className="tw-text-[#1e293b] tw-text-[14px]">Detects missing, vague, or incomplete scope items in the RFP that could impact your cost or timeline.</p>
          </div>

          {/* Summary Banner */}
          <div className="tw-bg-[#fff9f9] tw-border tw-border-[#ff4444] tw-rounded-xl tw-p-5 tw-shadow-sm">
            <div className="tw-flex tw-items-center tw-justify-between tw-flex-wrap tw-gap-4">
              <div className="tw-flex tw-items-center tw-gap-3">
                <div className="tw-w-10 tw-h-10 tw-rounded-full tw-bg-red-100 tw-flex tw-items-center tw-justify-center">
                  <AlertTriangle className="tw-w-5 tw-h-5 tw-text-red-600" />
                </div>
                <div>
                  <div className="tw-flex tw-items-center tw-gap-2">
                    <h3 className="tw-text-[20px] tw-font-bold tw-text-[#002149]">Gap Analysis Summary</h3>
                    <span className="tw-flex tw-items-center tw-gap-2 tw-text-[14px] tw-px-3 tw-py-0.5 tw-rounded-full tw-border tw-bg-blue-50 tw-text-blue-500 tw-font-semibold tw-border-[#4488ff]">
                      <i className="icon-AI-fill tw-w-3 tw-h-3" /> AI Generated
                    </span>
                  </div>
                  <p className="tw-text-sm tw-text-[#1e293b]">
                    AI identified {legalGaps.length} gaps across {categories.length} categories requiring attention
                  </p>
                </div>
              </div>
              <div className="tw-flex tw-items-center tw-gap-6">
                {[
                  { count: criticalCount, label: "Critical Priority", color: "#ff0000" },
                  { count: highCount,     label: "High Priority",     color: "#ff9500" },
                  { count: mediumCount,   label: "Medium Priority",   color: "#4488ff" },
                  { count: lowCount,      label: "Low Priority",      color: "#a7a7a7" },
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
          <div className="tw-bg-white tw-border tw-border-gray-200 tw-rounded-xl tw-px-4 tw-py-5">
            <div className="tw-flex tw-items-center tw-justify-between tw-gap-4 tw-flex-wrap">
              <div className="tw-relative tw-flex-1 tw-max-w-md">
                <svg className="tw-absolute tw-left-3 tw-top-1/2 tw--translate-y-1/2 tw-w-4 tw-h-4 tw-text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search gaps..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
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
                {permissions?.export && (
                  <button
                    onClick={handleExport}
                    disabled={exporting}
                    className={`tw-flex tw-items-center tw-gap-2 tw-w-[160px] tw-h-10 tw-px-4 tw-rounded-md tw-text-[15px] tw-transition-all
                      ${exporting
                        ? 'tw-bg-blue-300 tw-text-white tw-cursor-not-allowed tw-opacity-60'
                        : 'tw-bg-[#0140c1] tw-text-white hover:tw-bg-blue-800 tw-cursor-pointer'
                      }`}
                  >
                    <FileText className="tw-w-4 tw-h-4" />
                    {exporting ? 'Exporting...' : 'Export to PDF'}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Gap Cards */}
          <div className="tw-space-y-5">
            {paginatedGaps.map((gap, index) => {
              const sevKey = getSevKey(gap.severity);
              const sevCfg = SEVERITY_COLORS[sevKey] || {};
              return (
                <div
                  key={gap.id || index}
                  className="tw-bg-white tw-border tw-border-gray-200 tw-rounded-xl tw-transition-all hover:tw-shadow-lg hover:tw-border-gray-300"
                  style={getSeverityBorderStyle(gap.severity)}
                >
                  <div className="tw-p-6">
                    {/* Top row */}
                    <div className="tw-flex tw-items-center tw-justify-between tw-mb-3">
                      <div className="tw-flex tw-items-center tw-gap-2 tw-flex-wrap">
                        <span
                          className="tw-inline-flex tw-items-center tw-px-2.5 tw-py-0.5 tw-rounded-lg tw-text-xs tw-font-semibold tw-shadow-sm"
                          style={{ backgroundColor: sevCfg.badgeBg, color: sevCfg.badgeText }}
                        >
                          {gap.severity?.toUpperCase()}
                        </span>
                        <span className="tw-inline-flex tw-items-center tw-gap-1 tw-px-2 tw-py-0.5 tw-rounded-lg tw-text-xs tw-font-medium tw-bg-white tw-border tw-border-gray-300">
                          <Tag className="tw-w-3 tw-h-3" /> {gap.category}
                        </span>
                        <span className="tw-text-xs tw-font-medium tw-text-gray-500">Pages {gap.pdf_pages}</span>
                      </div>
                      {permissions?.view_in_pdf && (
                        <button
                          onClick={() => handleViewPdf(gap)}
                          onMouseEnter={() => preloadPdf(getGapS3Key(gap))}
                          className="tw-flex tw-items-center tw-gap-2 tw-px-4 tw-py-2 tw-bg-[#0140c1] tw-text-white tw-rounded-md tw-text-[15px] hover:tw-bg-blue-800 disabled:tw-opacity-60 disabled:tw-cursor-not-allowed"
                        >
                          <FileText className="tw-w-4 tw-h-4" /> View in PDF
                        </button>
                      )}
                    </div>

                    {/* Title */}
                    <h3 className="tw-text-lg tw-font-semibold tw-text-gray-900 tw-flex tw-items-center tw-gap-2 tw-mb-4">
                      <AlertTriangle className="tw-w-5 tw-h-5 tw-flex-shrink-0" style={{ color: sevCfg.textColor }} />
                      {gap.name}
                    </h3>

                    {/* RFP Requirement */}
                    <div className="tw-mb-5">
                      <p className="tw-text-xs tw-font-semibold tw-text-gray-600 tw-uppercase tw-tracking-wider tw-mb-1.5">What The RFP Requires</p>
                      <p className="tw-text-sm tw-text-gray-900 tw-leading-relaxed">{gap.what_the_rfp_requires}</p>
                    </div>

                    {/* Original Content */}
                    <div className="tw-mb-5">
                      <p className="tw-text-xs tw-font-semibold tw-text-gray-600 tw-uppercase tw-tracking-wider tw-mb-3">Original Contract Language</p>
                      <div className="tw-rounded-lg tw-p-4 tw-border-l-4" style={{ backgroundColor: '#f9fbff', borderLeftColor: '#4488ff' }}>
                        <p className="tw-text-sm tw-text-gray-900 tw-leading-relaxed tw-italic">"{gap.original_content_snippet}"</p>
                      </div>
                    </div>

                    {/* Material Gap + Recommended Fix */}
                    <div className="tw-grid tw-grid-cols-1 lg:tw-grid-cols-2 tw-gap-3 tw-mb-3">
                      <div
                        className="tw-rounded-lg tw-p-4 tw-border tw-shadow-sm"
                        style={{ backgroundColor: sevCfg.lightBg || '#fff5f5', borderColor: sevCfg.hex || '#ff0000' }}
                      >
                        <div className="tw-flex tw-items-center tw-gap-2 tw-mb-2">
                          <div className="tw-w-7 tw-h-7 tw-rounded-full tw-flex tw-items-center tw-justify-center" style={{ backgroundColor: `${sevCfg.hex}22` }}>
                            <AlertCircle className="tw-w-3.5 tw-h-3.5" style={{ color: sevCfg.hex }} />
                          </div>
                          <p className="tw-text-xs tw-font-bold tw-uppercase tw-tracking-wider" style={{ color: sevCfg.textColor }}>Material Gap</p>
                        </div>
                        <p className="tw-text-sm tw-text-gray-900 tw-leading-relaxed">{gap.material_gap}</p>
                      </div>
                      <div className="tw-bg-gradient-to-br tw-from-blue-50 tw-to-indigo-50 tw-rounded-lg tw-p-4 tw-border tw-border-blue-200 tw-shadow-sm">
                        <div className="tw-flex tw-items-center tw-gap-2 tw-mb-2">
                          <div className="tw-w-7 tw-h-7 tw-rounded-full tw-bg-blue-100 tw-flex tw-items-center tw-justify-center">
                            <Lightbulb className="tw-w-3.5 tw-h-3.5 tw-text-blue-500" />
                          </div>
                          <p className="tw-text-xs tw-font-bold tw-text-blue-500 tw-uppercase tw-tracking-wider">Recommended Fix</p>
                        </div>
                        <p className="tw-text-sm tw-text-gray-900 tw-leading-relaxed">{gap.recommended_fix}</p>
                      </div>
                    </div>

                    {/* Impact + Disclosure */}
                    <div className="tw-grid tw-grid-cols-1 lg:tw-grid-cols-2 tw-gap-3">
                      <div className="tw-rounded-lg tw-p-4 tw-border tw-border-gray-200 tw-shadow-sm">
                        <div className="tw-flex tw-items-center tw-gap-2 tw-mb-2">
                          <Clock className="tw-w-3.5 tw-h-3.5" /><DollarSign className="tw-w-3.5 tw-h-3.5" />
                          <p className="tw-text-xs tw-font-semibold tw-uppercase tw-tracking-wider">Impact On Timeline Or Cost</p>
                        </div>
                        <p className="tw-text-sm tw-text-gray-900 tw-leading-relaxed">{gap.impact_on_timeline_or_cost}</p>
                      </div>
                      <div className="tw-rounded-lg tw-p-4 tw-border tw-border-gray-200 tw-shadow-sm">
                        <div className="tw-flex tw-items-center tw-gap-2 tw-mb-2">
                          <FileText className="tw-w-3.5 tw-h-3.5 tw-text-gray-600" />
                          <p className="tw-text-xs tw-font-semibold tw-text-gray-600 tw-uppercase tw-tracking-wider">Disclosure Guidance</p>
                        </div>
                        <p className="tw-text-sm tw-text-gray-900 tw-leading-relaxed">{gap.disclosure_guidance}</p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {isLastAllowedPage && hasLockedItems && (
  <LockedGapItems
    totalCount={legalGaps.length - VISIBLE_ITEM_COUNT}
    visibleCount={VISIBLE_ITEM_COUNT}
    onUpgrade={handleUpgradeClick}
  />
)}

          {filteredGaps.length === 0 && (
            <div className="tw-text-center tw-py-12">
              <p className="tw-text-gray-500">No gaps match your filters. Try adjusting your search criteria.</p>
            </div>
          )}

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
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(pg => (
                <button
                  key={pg}
                  onClick={() => handlePageChange(pg)}
                  className={`tw-h-10 tw-w-10 tw-rounded-md tw-text-sm tw-font-medium tw-transition-all ${currentPage === pg ? 'tw-bg-[#4488FF] tw-text-white' : 'tw-bg-white tw-border tw-border-gray-300 tw-text-gray-900 hover:tw-bg-gray-50'}`}
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

      {/* PDF Viewer — kept mounted to avoid remount cost, hidden via CSS when closed */}
      <div
        className={`tw-fixed tw-inset-y-0 tw-right-0 tw-bg-white tw-shadow-2xl tw-z-50 tw-flex tw-flex-col tw-transition-all tw-duration-300 ${isExpanded ? "tw-w-full" : "tw-w-1/2"}`}
        style={{ display: isPdfOpen && selectedGap ? 'flex' : 'none' }}
      >
        <div className="tw-flex tw-items-center tw-justify-between tw-px-4 tw-py-2 tw-border-b tw-bg-white">
          <div className="tw-flex tw-items-center tw-gap-2 tw-min-w-0" />
          <span className="tw-text-sm tw-font-medium tw-text-gray-700">Page {selectedPagesRange || selectedPage}</span>
          <div className="tw-flex tw-items-center tw-gap-2">
            <button onClick={() => setIsPdfOpen(false)} className="tw-p-1.5 tw-rounded hover:tw-bg-gray-200">
              <X className="tw-w-4 tw-h-4" />
            </button>
          </div>
        </div>
        <div className="tw-flex tw-flex-1 tw-overflow-hidden">
          <div className="tw-flex-1 tw-bg-gray-100 tw-overflow-hidden">
            {selectedGap && (
              <PdfHighlightViewer
                rfpS3Key={getGapS3Key(selectedGap)}
                page={selectedPage}
                pagesRange={selectedPagesRange}
                highlights={buildHighlightsFromGap(selectedGap)}
              />
            )}
          </div>
        </div>
      </div>

      {/* Backdrop */}
      {isPdfOpen && selectedGap && (
        <div className="tw-fixed tw-inset-0 tw-bg-black/20 tw-z-40" onClick={() => setIsPdfOpen(false)} />
      )}
    </div>
  );
}