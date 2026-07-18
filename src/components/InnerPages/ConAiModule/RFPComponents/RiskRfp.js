import React, { useState, useEffect, useRef } from 'react';
import { FileText, ChevronLeft, ChevronRight, ShieldAlert, Users, ChevronDown, Check } from 'lucide-react';
import { X } from "lucide-react";
import PdfHighlightViewer from './PdfHighlightViewer';
import FullPageLoader from '../../../../genriccomponents/loaders/FullPageLoader';
import { useRfpData } from './useRfpData';
import { GeneratePdf } from '../../../../services/techus-services';
import { getPdfAssets } from '../../../../utils/pdfAssets';
import CONFIG from '../../../../config/config';
import { useSelector } from 'react-redux';
import UpgradeCard from '../../../../genriccomponents/UpgradeCard';
import { useNavigate } from 'react-router-dom';
import NoDataFound from '../../../../genriccomponents/NoDataFound';

import { resolvePackageEnabled } from '../../../Common/usePermissions';
// ─── Static S3 key ─────────────────────────────────────────────────────────────
const getRiskS3Key = (risk) => {
    const project_uuid = localStorage.getItem("project_uuid");
    return `projects/project_${project_uuid}/rfp/${risk.pdf_name}`;
};
// ─── Color config ──────────────────────────────────────────────────────────────
const SEVERITY_COLORS = {
    critical: {
        hex: '#ff0000',
        border: 'tw-border-l-[#ff0000]',
        badge: 'tw-bg-[#ff0000] tw-text-white tw-border-[#ff0000]',
        cardBg: 'tw-bg-[#fff5f5]',
        text: 'tw-text-[#ff0000]',
        lightBg: '#fff5f5',
    },
    high: {
        hex: '#ff9500',
        border: 'tw-border-l-[#ff9500]',
        badge: 'tw-bg-[#ff9500] tw-text-white tw-border-[#ff9500]',
        cardBg: 'tw-bg-[#fff9f0]',
        text: 'tw-text-[#ff9500]',
        lightBg: '#fff9f0',
    },
    medium: {
        hex: '#4488ff',
        border: 'tw-border-l-[#4488ff]',
        badge: 'tw-bg-[#4488ff] tw-text-white tw-border-[#4488ff]',
        cardBg: 'tw-bg-[#f0f5ff]',
        text: 'tw-text-[#4488ff]',
        lightBg: '#f0f5ff',
    },
    low: {
        hex: '#a7a7a7',
        border: 'tw-border-l-[#a7a7a7]',
        badge: 'tw-bg-[#a7a7a7] tw-text-white tw-border-[#a7a7a7]',
        cardBg: 'tw-bg-[#f8f8f8]',
        text: 'tw-text-[#a7a7a7]',
        lightBg: '#f8f8f8',
    },
};

// ─── Helpers ───────────────────────────────────────────────────────────────────
const capitalize = (value = "") =>
    value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();

const formatLabel = (value = "") =>
    value.toString().split("_")
        .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(" ");

const formatLabelArray = (arr = []) => arr.map(formatLabel);

const getSeverityKey = (severity = '') => severity.toLowerCase();

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
                        className={`tw-w-full tw-flex tw-items-center tw-justify-between tw-px-3 tw-py-2 tw-text-left tw-text-sm tw-transition-colors
                            ${value === "all" ? "tw-bg-blue-50 tw-text-blue-600 tw-font-medium" : "tw-text-gray-700 hover:tw-bg-gray-50"}`}
                    >
                        <span className="tw-truncate">{labelAll}</span>
                        {value === "all" && <Check size={13} className="tw-flex-shrink-0 tw-ml-2 tw-text-blue-500" />}
                    </button>
                    {options.map(opt => (
                        <button
                            key={opt}
                            onClick={() => handleSelect(opt)}
                            className={`tw-w-full tw-flex tw-items-center tw-justify-between tw-px-3 tw-py-2 tw-text-left tw-text-sm tw-transition-colors
                                ${value === opt ? "tw-bg-blue-50 tw-text-blue-600 tw-font-medium" : "tw-text-gray-700 hover:tw-bg-gray-50"}`}
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


function LockedRiskItems({ totalCount, visibleCount, onUpgrade }) {
  const description = `You've reached your limit of ${visibleCount} viewable items. ${totalCount} more risks are locked. Upgrade your package to reveal all risks and recommendations.`;

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
              title="Unlock Full Risk Radar Insights with an Upgrade!"
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
export default function RiskIdentifier() {
    const { data, loading, isInitialLoad, error } = useRfpData("risks");

    const [isPdfOpen, setIsPdfOpen] = useState(false);
    const [selectedRisk, setSelectedRisk] = useState(null);
    const [selectedPage, setSelectedPage] = useState(1);
    const [selectedPagesRange, setSelectedPagesRange] = useState(null);
    const [severityFilter, setSeverityFilter] = useState("all");
    const [positionFilter, setPositionFilter] = useState("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [isExpanded, setIsExpanded] = useState(false);
    const itemsPerPage = 5;
    const [exporting, setExporting] = useState(false);

    // ── Ref to scroll the content area back to top on page change ──
    const scrollContainerRef = useRef(null);
const navigate = useNavigate();
const packageList = useSelector((s) => s?.auth?.user?.[0]?.package_info);
const isRiskRadarEnabled = resolvePackageEnabled(packageList, 'risk_radar', { strict: true });
    const organizationImage = useSelector((s) => s?.auth?.user?.[0]?.organization_image);
    const remoteImageUrl = organizationImage
        ? `${CONFIG.VITE_AWS_ENDPOINT}/organization_images/${organizationImage}`
         : `${CONFIG.VITE_AWS_ENDPOINT}/organization_images/logo.png`;

  const permissionsList = useSelector((s) => s?.auth?.user?.[0]?.permission_info);
const riskRadarPermissions = permissionsList?.risk_radar || 
    permissionsList?.bid_intelligence?.children?.risk_radar || {};
const canExport = riskRadarPermissions?.export === true || riskRadarPermissions?.export === 1;
const canViewInPdf = riskRadarPermissions?.view_in_pdf === true || riskRadarPermissions?.view_in_pdf === 1;

    // Reset to page 1 when filters change
    useEffect(() => { setCurrentPage(1); }, [severityFilter, positionFilter, searchQuery]);

    // Scroll to top whenever the current page changes
    useEffect(() => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollTo({ top: 0, behavior: "smooth" });
        }
    }, [currentPage]);

    const rawRisks = Array.isArray(data) ? data : (data?.risks ?? data?.legal_risks ?? []);

    const legalRisks = rawRisks.map(risk => ({
        ...risk,
        severity: capitalize(risk.severity),
        recommended_position: capitalize(risk.recommended_position),
        who_must_approve: formatLabelArray(risk.who_must_approve ?? []),
    }));
// Add after legalRisks definition
const riskRadarNode = packageList?.bid_intelligence?.children?.risk_radar;
const riskItemCount = riskRadarNode?.item_count ?? null;
const hasFullAccess = !riskItemCount || riskItemCount === 0;
const VISIBLE_ITEM_COUNT = (riskItemCount && riskItemCount > 0) ? riskItemCount : legalRisks.length;

const handleUpgradeClick = () => {
  const isAdminPortal = window.location.pathname.startsWith("/admin");
  navigate(isAdminPortal ? "/admin/packages" : "/packages");
};
    if (isInitialLoad) return <FullPageLoader />;
// ADD THIS: block access if package is disabled
if (!isRiskRadarEnabled) {
    return (
        <div className="tw-flex tw-items-center tw-justify-center tw-p-6">
            <div className="tw-bg-white tw-border tw-border-gray-200 tw-rounded-lg tw-p-8 tw-text-center tw-max-w-md">
                <ShieldAlert className="tw-w-12 tw-h-12 tw-text-orange-500 tw-mx-auto tw-mb-4" />
                <h2 className="tw-text-xl tw-font-semibold tw-mb-2">Access Restricted</h2>
                <p className="tw-text-gray-600">You don't have access to Risk Radar. Please upgrade your package.</p>
                <button
                    onClick={handleUpgradeClick}
                    className="tw-mt-4 tw-px-6 tw-py-2 tw-bg-[#0140c1] tw-text-white tw-rounded-md hover:tw-bg-blue-800"
                >
                    Upgrade Package
                </button>
            </div>
        </div>
    );
}
  if (error || legalRisks.length === 0) {
    return (
        <div className="tw-flex tw-h-full">
            <div className="tw-flex-1 tw-overflow-y-auto">
                <div className="tw-p-1 tw-space-y-6 tw-mx-auto">

                    {/* Breadcrumb */}
                    <div>
                        <div className="tw-flex tw-items-center tw-gap-2">
                            <span className="tw-text-[20px] tw-text-gray-600 tw-font-medium">Bid Intelligence</span>
                            <i className="icon-Save-and-Continue" />
                            <span className="tw-text-[20px] tw-font-bold tw-text-gray-900">Risk Radar</span>
                        </div>
                        <p className="tw-text-[#1e293b] tw-text-[14px]">Surfaces hidden contractual risks buried deep in the RFP and provides recommended mitigations for each.</p>
                    </div>

                    {/* No Data */}
                    <div className="tw-bg-white tw-border tw-border-gray-200 tw-rounded-[15px] tw-p-4">
                        <NoDataFound
                            title="No Risk Data Available"
                            description={error || "No risk analysis data found."}
                            buttonLabel={null}
                        />
                    </div>

                </div>
            </div>
        </div>
    );
}

    const severities = [...new Set(legalRisks.map(r => r.severity))].filter(Boolean);
    const positions = [...new Set(legalRisks.map(r => r.recommended_position))].filter(Boolean);
const filteredRisks = legalRisks.filter(risk => {
  if (severityFilter !== "all" && risk.severity !== severityFilter) return false;
  if (positionFilter !== "all" && risk.recommended_position !== positionFilter) return false;
  if (searchQuery && !risk.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
  return true;
});

const viewableRisks = hasFullAccess ? filteredRisks : filteredRisks.slice(0, VISIBLE_ITEM_COUNT);
const hasLockedItems = !hasFullAccess && legalRisks.length > VISIBLE_ITEM_COUNT;

const totalPages = Math.ceil(viewableRisks.length / itemsPerPage);
const startIndex = (currentPage - 1) * itemsPerPage;
const paginatedRisks = viewableRisks.slice(startIndex, startIndex + itemsPerPage);

const isLastAllowedPage = !hasFullAccess && hasLockedItems && currentPage === totalPages;

    const criticalCount = legalRisks.filter(r => r.severity?.toLowerCase() === "critical").length;
    const highCount     = legalRisks.filter(r => r.severity?.toLowerCase() === "high").length;
    const mediumCount   = legalRisks.filter(r => r.severity?.toLowerCase() === "medium").length;
    const lowCount      = legalRisks.filter(r => r.severity?.toLowerCase() === "low").length;

    const getSeverityBorderStyle = (severity) => {
        const color = SEVERITY_COLORS[getSeverityKey(severity)]?.hex;
        return color ? { borderLeft: `4px solid ${color}` } : {};
    };

    const getPositionBadgeClass = (position) => ({
        Accept: "tw-bg-green-50 tw-text-green-700 tw-border-green-200",
        Negotiate: "tw-bg-orange-50 tw-text-orange-700 tw-border-orange-200",
    }[position] || "tw-bg-gray-100 tw-text-gray-600 tw-border-gray-200");

    const handleViewPdf = (risk) => {
        const pages = risk.pdf_pages?.toString().trim();
        let firstPage = 1;
        if (pages) {
            const m = pages.match(/\d+/);
            if (m) firstPage = parseInt(m[0]);
        }
        setSelectedRisk(risk);
        setSelectedPage(firstPage);
        setSelectedPagesRange(pages || null);
        setIsPdfOpen(true);
    };

    const buildHighlightsFromRisk = (risk) => {
        if (!risk?.original_content_snippet) return [];
        const text = risk.original_content_snippet.trim();
        const key = getSeverityKey(risk.severity);
        const colorMap = {
            critical: 'rgba(255,0,0,0.35)',
            high:     'rgba(255,149,0,0.4)',
            medium:   'rgba(68,136,255,0.35)',
            low:      'rgba(167,167,167,0.35)',
        };
        const color = colorMap[key] || 'rgba(255,255,0,0.6)';
        const pagesRange = risk.pdf_pages?.toString().trim() || '';
        const pageNumbers = [];
        pagesRange.split(',').forEach(part => {
            const trimmed = part.trim();
            if (trimmed.includes('-')) {
                const [s, e] = trimmed.split('-').map(p => parseInt(p.trim()));
                if (!isNaN(s) && !isNaN(e)) {
                    for (let i = s; i <= e; i++) { if (!pageNumbers.includes(i)) pageNumbers.push(i); }
                }
            } else {
                const n = parseInt(trimmed);
                if (!isNaN(n) && !pageNumbers.includes(n)) pageNumbers.push(n);
            }
        });
        const pages = pageNumbers.length ? pageNumbers : [1];
        return pages.map(pageIndex => ({ pageIndex, text, color }));
    };

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
                type: 'riskradar',
                companyName: 'ACME INC.',
                coverBg,
                remoteImageUrl,
                aiIconBase64,
                risks: legalRisks,
                counts: { critical: criticalCount, high: highCount, medium: mediumCount, low: lowCount },
                footerNote: 'This report is powered by PrexoAI.',
            };
            const arrayBuffer = await GeneratePdf(payload);
            triggerDownload(arrayBuffer, 'Risk-Radar-Report.pdf');
        } catch (err) {
            console.error('Risk Radar PDF export failed:', err);
        } finally {
            setExporting(false);
        }
    };

    // ── Shared page-change handler: updates page AND scrolls to top ──
    const handlePageChange = (newPage) => {
        setCurrentPage(newPage);
        // scrollContainerRef effect handles the scroll
    };

    void setIsExpanded
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
                            <span className="tw-text-[20px] tw-font-bold tw-text-gray-900">Risk Radar</span>
                        </div>
                        <p className="tw-text-[#1e293b] tw-text-[14px]">Surfaces hidden contractual risks buried deep in the RFP and provides recommended mitigations for each.</p>
                    </div>

                    {/* Summary Banner */}
                    <div className="tw-bg-[#fff7ed] tw-border tw-border-[#ff9500] tw-rounded-xl tw-p-5 tw-shadow-sm">
                        <div className="tw-flex tw-items-center tw-justify-between tw-flex-wrap tw-gap-4">
                            <div className="tw-flex tw-items-center tw-gap-3">
                                <div className="tw-w-10 tw-h-10 tw-rounded-full tw-bg-orange-100 tw-flex tw-items-center tw-justify-center">
                                    <ShieldAlert className="tw-w-5 tw-h-5 tw-text-orange-600" />
                                </div>
                                <div>
                                    <div className="tw-flex tw-items-center tw-gap-2">
                                        <h3 className="tw-text-[20px] tw-font-bold tw-text-[#002149]">Construction Risk Analysis Summary</h3>
                                        <span className="tw-flex tw-items-center tw-gap-2 tw-text-[14px] tw-font-semibold tw-px-3 tw-rounded-full tw-border tw-bg-[#e9f2ff] tw-text-[#4488ff] tw-border-[#4488ff]">
                                            <i className="icon-AI-fill tw-w-3 tw-h-3" /> AI Generated
                                        </span>
                                    </div>
                                    <p className="tw-text-sm tw-text-[#1e293b]">
                                        AI identified {legalRisks.length} contractual risks requiring review across the RFP documents
                                    </p>
                                </div>
                            </div>
                            <div className="tw-flex tw-items-center tw-gap-6">
                                {[
                                    { count: criticalCount, label: "Critical Risk", color: "#ff0000" },
                                    { count: highCount,     label: "High Risk",     color: "#ff9500" },
                                    { count: mediumCount,   label: "Medium Risk",   color: "#4488ff" },
                                    { count: lowCount,      label: "Low Risk",      color: "#a7a7a7" },
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
                                placeholder="Search risks, clauses, or keywords..."
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
                                labelAll="All Types"
                                value={positionFilter}
                                onChange={setPositionFilter}
                                options={positions}
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

                    {/* Risk Cards */}
                    <div className="tw-space-y-4">
                        {paginatedRisks.map((risk, index) => {
                            const sevKey = getSeverityKey(risk.severity);
                            const sevCfg = SEVERITY_COLORS[sevKey] || {};
                            return (
                                <div
                                    key={risk.id || index}
                                    className="tw-bg-white tw-border tw-border-gray-200 tw-rounded-xl tw-transition-all hover:tw-shadow-lg hover:tw-border-gray-300"
                                    style={getSeverityBorderStyle(risk.severity)}
                                >
                                    <div className="tw-p-6">
                                        {/* Top row */}
                                        <div className="tw-flex tw-items-center tw-justify-between tw-mb-3">
                                            <div className="tw-flex tw-items-center tw-gap-4 tw-flex-wrap">
                                                <span
                                                    className="tw-inline-flex tw-items-center tw-px-3 tw-py-0.5 tw-rounded-full tw-text-[11px] tw-font-semibold tw-border tw-text-white"
                                                    style={{ backgroundColor: sevCfg.hex, borderColor: sevCfg.hex }}
                                                >
                                                    {risk.severity?.toUpperCase()}
                                                </span>
                                                <span className="tw-text-xs tw-font-medium tw-text-gray-500">
                                                    Pages {risk.pdf_pages}
                                                </span>
                                            </div>
  {canViewInPdf && (
    <button
        onClick={() => handleViewPdf(risk)}
        className="tw-flex tw-items-center tw-gap-2 tw-px-4 tw-py-2 tw-bg-[#0140c1] tw-text-white tw-rounded-md tw-text-[15px] hover:tw-bg-blue-800 tw-cursor-pointer"
    >
        <FileText className="tw-w-4 tw-h-4" /> View in PDF
    </button>
)}
                                        </div>

                                        {/* Title */}
                                        <h3 className="tw-text-[20px] tw-font-bold tw-mb-4">{risk.name}</h3>

                                        {/* AI Analysis */}
                                        <div className="tw-mb-5">
                                            <div className="tw-flex tw-items-start tw-justify-between tw-gap-4">
                                                <div className="tw-flex-1">
                                                    <div className="tw-flex tw-items-center tw-gap-2 tw-mb-3">
                                                        <i className="icon-AI-fill tw-w-5 tw-h-5 tw-text-[#4488ff]" />
                                                        <p className="tw-text-[15px] tw-font-semibold tw-text-[#4488ff] tw-uppercase">AI Analysis</p>
                                                    </div>
                                                    <p className="tw-text-sm tw-text-gray-900 tw-leading-relaxed">{risk.what_it_is}</p>
                                                </div>
                                                <div className="tw-flex tw-items-center tw-gap-2 tw-flex-shrink-0">
                                                    <span className="tw-text-xs tw-font-medium tw-text-gray-600">Position:</span>
                                                    <span className={`tw-inline-flex tw-items-center tw-px-3 tw-py-1.5 tw-rounded-lg tw-text-sm tw-font-semibold tw-border tw-shadow-sm ${getPositionBadgeClass(risk.recommended_position)}`}>
                                                        {risk.recommended_position}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Original Contract Language */}
                                        <div className="tw-mb-5">
                                            <p className="tw-text-xs tw-font-semibold tw-text-gray-600 tw-uppercase tw-tracking-wider tw-mb-2">Original Contract Language</p>
                                            <div className="tw-rounded-lg tw-p-4 tw-border-l-4" style={{ backgroundColor: '#f9fbff', borderLeftColor: '#4488ff' }}>
                                                <p className="tw-text-sm tw-text-gray-900 tw-leading-relaxed tw-italic">"{risk.original_content_snippet}"</p>
                                            </div>
                                        </div>

                                        {/* Business Impact + Mitigation */}
                                        <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 tw-gap-4 tw-mb-5">
                                            <div
                                                className="tw-rounded-lg tw-p-4 tw-shadow-sm tw-border"
                                                style={{ backgroundColor: sevCfg.lightBg || '#fff5f5', borderColor: sevCfg.hex || '#ff0000' }}
                                            >
                                                <p className="tw-text-xs tw-font-bold tw-uppercase tw-tracking-wider tw-mb-2" style={{ color: sevCfg.hex }}>Business Impact</p>
                                                <p className="tw-text-sm tw-text-gray-900 tw-leading-relaxed">{risk.business_impact}</p>
                                            </div>
                                            <div className="tw-bg-gradient-to-br tw-from-blue-50 tw-to-indigo-50 tw-border tw-border-blue-300 tw-rounded-lg tw-p-4 tw-shadow-sm">
                                                <div className="tw-flex tw-items-center tw-gap-2 tw-mb-2">
                                                    <i className="icon-AI-fill tw-w-3.5 tw-h-3.5 tw-text-blue-400" />
                                                    <p className="tw-text-xs tw-font-bold tw-text-blue-400 tw-uppercase tw-tracking-wider">Recommended Mitigation</p>
                                                </div>
                                                <p className="tw-text-sm tw-text-gray-900 tw-leading-relaxed">{risk.mitigation_signal}</p>
                                            </div>
                                        </div>

                                        {/* Footer — Who Must Approve */}
                                        <div className="tw-flex tw-items-center tw-gap-3 tw-pt-4 tw-border-t tw-border-gray-200 tw-flex-wrap">
                                            <Users className="tw-w-3.5 tw-h-3.5 tw-text-gray-500" />
                                            <span className="tw-text-xs tw-font-medium tw-text-gray-600">Who Must Approve:</span>
                                            <div className="tw-flex tw-items-center tw-gap-1.5 tw-flex-wrap">
                                                {risk.who_must_approve?.map((approver, idx) => (
                                                    <span key={idx} className="tw-inline-flex tw-items-center tw-px-2 tw-py-1 tw-rounded-md tw-text-xs tw-bg-gray-100 tw-text-gray-700 tw-font-medium tw-border tw-border-gray-200">
                                                        {approver}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    {/* After the risk cards div, before filteredRisks.length === 0 check */}
{isLastAllowedPage && hasLockedItems && (
  <LockedRiskItems
    totalCount={legalRisks.length - VISIBLE_ITEM_COUNT}
    visibleCount={VISIBLE_ITEM_COUNT}
    onUpgrade={handleUpgradeClick}
  />
)}

                    {filteredRisks.length === 0 && (
                        <div className="tw-text-center tw-py-12">
                            <p className="tw-text-gray-500">No risks match your filters. Try adjusting your search criteria.</p>
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

            {/* PDF Viewer Overlay */}
            {isPdfOpen && selectedRisk && (
                <>
                    <div className={`tw-fixed tw-inset-y-0 tw-right-0 tw-bg-white tw-shadow-2xl tw-z-50 tw-flex tw-flex-col tw-transition-all tw-duration-300 ${isExpanded ? "tw-w-full" : "tw-w-1/2"}`}>
                        <div className="tw-flex tw-items-center tw-justify-between tw-px-4 tw-py-2 tw-border-b tw-bg-white">
                            <div className="tw-flex tw-items-center tw-gap-2 tw-min-w-0" />
                            <span className="tw-text-sm tw-font-medium tw-text-gray-700">Page {selectedPage}</span>
                            <div className="tw-flex tw-items-center tw-gap-2">
                                <button onClick={() => setIsPdfOpen(false)} className="tw-p-1.5 tw-rounded hover:tw-bg-gray-200">
                                    <X className="tw-w-4 tw-h-4" />
                                </button>
                            </div>
                        </div>
                        <div className="tw-flex tw-flex-1 tw-overflow-hidden">
                            <div className="tw-flex-1 tw-bg-gray-100 tw-overflow-hidden">
                                <PdfHighlightViewer
                                    rfpS3Key={getRiskS3Key(selectedRisk)}
                                    page={selectedPage}
                                    pagesRange={selectedPagesRange}
                                    highlights={buildHighlightsFromRisk(selectedRisk)}
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
