
import React, { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  health_checker_detail,
  PerformHealthChecker,
  ExportHealthCheckerPdf,
} from "../../../../services/techus-services";
import { showToast } from "../../../../genriccomponents/techus-ToastNotification";
import FullPageLoader from "../../../../genriccomponents/loaders/FullPageLoader";
import UpgradeCard from "../../../../genriccomponents/UpgradeCard";
import ReactDOM from "react-dom";
import { getPdfAssets } from '../../../../utils/pdfAssets';
import { useSelector } from "react-redux";
import usePermissions from "../../../Common/usePermissions";
import { useEstimation } from "../../../context/EstimationContext";

// ─── Stat Card ──────────────────────────────────────────────────────────────
function StatCard({ label, value, icon, bg }) {
  return (
    <div className="tw-bg-white tw-border tw-border-gray-300 tw-rounded-xl tw-px-5 tw-py-4 tw-flex tw-items-center tw-justify-between tw-shadow-sm tw-flex-1">
      <div>
        <p className="tw-text-[13px] tw-text-gray-500 tw-mb-1">{label}</p>
        <p className="tw-text-[28px] tw-font-bold tw-text-gray-800">{value ?? "—"}</p>
      </div>
      <div className={`tw-w-11 tw-h-11 tw-rounded-xl tw-flex tw-items-center tw-justify-center ${bg}`}>
        {icon}
      </div>
    </div>
  );
}

// ─── Collapsible Section ────────────────────────────────────────────────────
function CollapsibleSection({ title, icon, badges, open = false, onToggle, children, headerBg = "tw-bg-white" }) {
  return (
    <div className="tw-border tw-border-[#e0e0e0] tw-rounded-xl tw-overflow-hidden tw-mb-3">
      <div
        className={`${headerBg} tw-flex tw-items-center tw-justify-between tw-px-5 tw-py-3.5 tw-cursor-pointer  tw-transition-all`}
        onClick={() => onToggle?.(!open)}
      >
        <div className="tw-flex tw-items-center tw-gap-3">
          {icon}
          <span className="tw-text-[14px] tw-font-semibold tw-text-gray-800">{title}</span>
        </div>
        <div className="tw-flex tw-items-center tw-gap-3">
          {badges}
          <div className="tw-flex tw-items-center tw-justify-center tw-w-[28px] tw-h-[28px] tw-border tw-border-gray-300 tw-rounded-[6px] tw-bg-white tw-flex-shrink-0">
            <svg
              width="14" height="14" viewBox="0 0 24 24" fill="none"
              style={{ transform: open ? "rotate(0deg)" : "rotate(180deg)", transition: "transform 0.25s ease" }}
            >
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

// ─── Section Body ───────────────────────────────────────────────────────────
function SectionBody({ findings = [], recommendations = [] }) {
  const hasFindings = findings.length > 0;
  const hasRecommendations = recommendations.length > 0;

  if (!hasFindings && !hasRecommendations) {
    return (
      <div className="tw-flex tw-items-center tw-justify-center tw-min-h-[120px] tw-rounded-[10px] tw-border tw-border-dashed tw-border-[#d9dee8] tw-bg-[#f8fafc] tw-p-4">
        <p className="tw-text-[13px] tw-text-gray-500 tw-text-center">
          No findings and recommendations found.
        </p>
      </div>
    );
  }

  return (
    <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 tw-gap-3 tw-items-stretch tw-bg-white">

      {/* Findings */}
      <div className="tw-flex tw-flex-col">
        <div className="tw-flex tw-items-center tw-gap-2 tw-mb-3">
          <div className="tw-w-7 tw-h-7 tw-rounded-md tw-bg-[#ffe2e3]  tw-flex tw-items-center tw-justify-center tw-flex-shrink-0">
            <i className="icon-AI-Risk-Identifier tw-text-[#b91c1b] tw-text-[16px]" />
          </div>
          <span className="tw-text-[13px] tw-font-semibold tw-text-[#333333]">Findings</span>
        </div>
        {!hasFindings ? (
          <p className="tw-text-[12px] tw-text-gray-400 tw-italic">No findings.</p>
        ) : (
          <ul className="tw-space-y-2 tw-bg-[#ffe2e3] tw-border tw-border-[#ff8f8f] tw-rounded-[10px] tw-p-3 tw-flex-1">
            {findings.map((f, i) => (
              <li key={i} className="tw-flex tw-items-start tw-gap-2.5">
                <span className="tw-flex-shrink-0 tw-mt-0.5 tw-w-4 tw-h-4 tw-rounded-[3px] tw-bg-[#ffb3b6] tw-text-[#b91c1b] tw-text-[10px] tw-font-bold tw-flex tw-items-center tw-justify-center">{i + 1}</span>
                <span className="tw-text-[13px] tw-text-[#b91c1b] tw-leading-relaxed">
                  {typeof f === "string" ? f : f.text ?? f.description ?? JSON.stringify(f)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Recommendations */}
      <div className="tw-flex tw-flex-col">
        <div className="tw-flex tw-items-center tw-gap-2 tw-mb-3">
          <div className="tw-w-7 tw-h-7 tw-rounded-md tw-bg-[#ecfef6]  tw-flex tw-items-center tw-justify-center tw-flex-shrink-0 tw-border tw-border-[#a8f3d0]">
            <i className="icon-AI-fill tw-text-[#22c55f] tw-text-[16px]" />
          </div>
          <span className="tw-text-[13px] tw-font-semibold tw-text-[#333333]">AI-based Recommendations</span>
        </div>
        {!hasRecommendations ? (
          <p className="tw-text-[12px] tw-text-gray-400 tw-italic">No recommendations.</p>
        ) : (
          <ul className="tw-space-y-2 tw-bg-[#ecfef6] tw-border tw-border-[#a8f3d0] tw-rounded-[10px] tw-p-3 tw-flex-1">
            {recommendations.map((r, i) => (
              <li key={i} className="tw-flex tw-items-start tw-gap-2.5">
                <span className="tw-flex-shrink-0 tw-mt-0.5 tw-w-4 tw-h-4 tw-rounded-[3px] tw-bg-[#83cdac] tw-text-white tw-text-[9px] tw-font-bold tw-flex tw-items-center tw-justify-center"><i className="icon-Tick" /></span>
                <span className="tw-text-[13px] tw-text-[#10672f] tw-leading-relaxed">
                  {typeof r === "string" ? r : r.text ?? r.description ?? JSON.stringify(r)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
function LockedIdentifiedClauses({ sectionCount, onUpgrade }) {
  const description = `You're viewing a summary of ${sectionCount} analyzed area${sectionCount !== 1 ? "s" : ""}. Upgrade your package to access the detailed identified clauses, findings, and recommendations.`;

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
              title="Unlock Detailed Clause Analysis with an Upgrade!"
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

function LockedPriorityFixes({ fixCount, onUpgrade }) {
  const description = `You have ${fixCount} priority fix${fixCount !== 1 ? "es" : ""} identified. Upgrade your package to reveal all risks, mitigations, and recommendations for this project.`;

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
              title="Unlock Full Risk Insights with an Upgrade!"
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

// ─── Helpers ────────────────────────────────────────────────────────────────
const formatLabel = (str) =>
  str ? str.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) : "Section";

const getSectionKey = (section, index) =>
  `${section.category ?? section.title ?? "section"}-${index}`;



// ─── Main Page ──────────────────────────────────────────────────────────────
export default function ContractHealthReport() {
  const navigate = useNavigate();
  const { checkerUuid } = useParams();
  const projectUuidFromRedux = useSelector((s) => s?.project?.project_uuid);
  const projectUId =
    projectUuidFromRedux || localStorage.getItem("project_uuid");
  const { permissions } = usePermissions('contract_audit', 'contract_command');

  // Follow RFPOverview pattern: check parent (audit_report) AND child separately
  const { packagePermissions: auditReportPkg } = usePermissions('contract_audit', 'contract_health_report_access');
  const { packagePermissions: priorityFixesPkg } = usePermissions('contract_audit', 'priority_fixes_access');
  const { packagePermissions: identifiedClausesPkg } = usePermissions('contract_audit', 'health_identified_clauses_access');
  const { isMarkAsCompleted } = useEstimation();
  const packageList = useSelector((s) => s?.auth?.user?.[0]?.package_info);
  console.log("contract_audit FULL →", JSON.stringify(
    packageList?.contract_command?.children?.contract_audit
    , null, 2));

  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [openSections, setOpenSections] = useState({});

  // ── Reanalyze popup ──────────────────────────────────────────────────────
  const [showPopup, setShowPopup] = useState(false);
  const [popupPos, setPopupPos] = useState({ top: 0, left: 0 });
  const [instruction, setInstruction] = useState("");
  const [isRedrafting, setIsRedrafting] = useState(false);
  const btnRef = useRef(null);
  const popupRef = useRef(null);

  // ── Close popup on outside click / scroll ────────────────────────────────
  useEffect(() => {
    const onClickOutside = (e) => {
      if (
        popupRef.current && !popupRef.current.contains(e.target) &&
        btnRef.current && !btnRef.current.contains(e.target)
      ) {
        setShowPopup(false);
        if (!isRedrafting) setInstruction("");   // ← now only runs when clicking outside
      }
    };
    const onScroll = (e) => {
      if (popupRef.current && popupRef.current.contains(e.target)) return;
      setShowPopup(false);
      if (!isRedrafting) setInstruction("");
    };
    if (showPopup) {
      document.addEventListener("mousedown", onClickOutside);
      window.addEventListener("scroll", onScroll, true);
    }
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      window.removeEventListener("scroll", onScroll, true);
    };
  }, [showPopup, isRedrafting]);

  const handleReanalyzeClick = () => {
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setPopupPos({ top: rect.bottom + 8, left: Math.max(8, rect.right - 320) });
    }
    setShowPopup((p) => !p);
    if (!isRedrafting) setInstruction("");
  };

  // ── Reanalyze ────────────────────────────────────────────────────────────
  const handleRedraft = async () => {
    if (!instruction.trim() || isRedrafting) return;

    const checkerId = data?.checker_id;
    console.log("checker_id →", checkerId);

    if (!checkerId) {
      showToast("error", "Checker ID not found. Please reload the page.");
      return;
    }

    try {
      setIsRedrafting(true);

      const payload = {
        checker_id: checkerId,
        context: instruction.trim(),
      };

      console.log("PerformHealthChecker payload →", payload);

      const raw = await PerformHealthChecker(payload);
      const resData = typeof raw === "string" ? JSON.parse(raw) : raw;
      console.log("PerformHealthChecker resData →", resData);

      const isSuccess =
        resData?.valid === true ||
        resData?.data?.status === true;

      if (isSuccess) {
        showToast("success", resData?.message || "Reanalysis completed.");
        setShowPopup(false);
        setInstruction("");

        setIsLoading(true);
        const detail = await health_checker_detail({
          checker_uuid: data?.checker_uuid ?? checkerUuid,
        });
        if (detail?.valid) {
          setData(detail.data);
        } else {
          showToast("error", detail?.message || "Failed to reload report.");
        }
        setIsLoading(false);
      } else {
        showToast("error", resData?.message || "Reanalysis failed.");
      }
    } catch (err) {
      console.error("PerformHealthChecker error:", err);
      showToast("error", err?.response?.data?.message || err?.message || "Something went wrong.");
    } finally {
      setIsRedrafting(false);
    }
  };

  // ── Fetch detail on mount ────────────────────────────────────────────────
  useEffect(() => {
    if (!checkerUuid || checkerUuid === "undefined") return;
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const res = await health_checker_detail({ checker_uuid: checkerUuid });
        if (res?.valid) setData(res.data);
        else showToast("error", res?.message || "Failed to load report.");
      } catch {
        showToast("error", "Something went wrong.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [checkerUuid]);

  // ── Parse response_text ──────────────────────────────────────────────────
  const parsed = React.useMemo(() => {
    if (!data?.response_text) return null;
    try {
      return typeof data.response_text === "string"
        ? JSON.parse(data.response_text)
        : data.response_text;
    } catch { return null; }
  }, [data]);

  // ── Build sections ───────────────────────────────────────────────────────
  const { sections, priorityFixes } = React.useMemo(() => {
    const content = parsed?.content;

    if (Array.isArray(content)) {
      return {
        sections: content,
        priorityFixes: Array.isArray(parsed?.priority_fixes) ? parsed.priority_fixes
          : Array.isArray(parsed?.fixes) ? parsed.fixes : [],
      };
    }

    if (content && typeof content === "object") {
      const fixes = Array.isArray(content.fixes) ? content.fixes : [];
      const sectionEntries = Object.entries(content)
        .filter(([key]) => key !== "fixes")
        .map(([key, value]) => ({
          category: key,
          findings: Array.isArray(value?.findings) ? value.findings : [],
          recommendations: Array.isArray(value?.recommendations) ? value.recommendations : [],
        }));
      return { sections: sectionEntries, priorityFixes: fixes };
    }

    return { sections: [], priorityFixes: [] };
  }, [parsed]);

  useEffect(() => {
    if (sections.length === 0) {
      setOpenSections({});
      return;
    }

    setOpenSections((prev) => {
      const next = {};

      sections.forEach((section, index) => {
        const sectionKey = getSectionKey(section, index);
        next[sectionKey] = prev[sectionKey] ?? index === 0;
      });

      return next;
    });
  }, [sections]);

  const allExpanded = sections.length > 0 &&
    sections.every((section, index) => openSections[getSectionKey(section, index)]);

  const handleToggleAll = () => {
    const nextExpanded = !allExpanded;

    setOpenSections(
      sections.reduce((acc, section, index) => {
        acc[getSectionKey(section, index)] = nextExpanded;
        return acc;
      }, {})
    );
  };

  const handleSectionToggle = (sectionKey, nextOpen) => {
    setOpenSections((prev) => ({
      ...prev,
      [sectionKey]: nextOpen,
    }));
  };

  // ── Stats ────────────────────────────────────────────────────────────────
  const areasAnalyzed = sections.length;
  const totalFindings = sections.reduce((sum, s) => sum + s.findings.length, 0);
  const improvements = sections.reduce((sum, s) => sum + s.recommendations.length, 0);
  const priorityCount = priorityFixes.length;
  const handleUpgradeClick = () => {
    const isAdminPortal = window.location.pathname.startsWith("/admin");
    navigate(isAdminPortal ? "/admin/packages" : "/packages");
  };

  // ── Export PDF ───────────────────────────────────────────────────────────

  const handleExportPdf = async () => {
    if (isExporting) return;
    setIsExporting(true);
    try {
      // ✅ Get base64 cover image + logo so Puppeteer can render them
      const { coverBg } = await getPdfAssets();

      const payload = {
        checkerName: data?.checker_name || "Contract Audit Report",
        organization_id: localStorage.getItem("organization_id") || "",
        coverBg,
        sections: sections.map((s) => ({
          category: s.category ?? s.title ?? "Section",
          findings: Array.isArray(s.findings) ? s.findings : [],
          recommendations: Array.isArray(s.recommendations) ? s.recommendations : [],
        })),
        priorityFixes: (auditReportPkg && priorityFixesPkg)
          ? priorityFixes.map((fix) =>
            typeof fix === "string"
              ? fix
              : fix.text ?? fix.description ?? JSON.stringify(fix)
          )
          : [],
      };


      const response = await ExportHealthCheckerPdf(payload);

      const blob = new Blob([response.data ?? response], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const fileName = `${(data?.checker_name || "Contract-Health-Report").replace(/\s+/g, "-")}-Report.pdf`;

      link.href = url;
      link.download = fileName;
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
  if (isLoading) return <FullPageLoader />;

  return (
    <div className="tw-min-h-screen">
      {isSubmitting && <FullPageLoader />}

      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className="tw-flex tw-justify-between tw-items-center tw-mb-8">
        <div className="tw-flex tw-items-center tw-gap-4">
          <button
            onClick={() => navigate(`/project/view/${projectUId}/contract-command/contract-audit`)}
            className="tw-flex tw-items-center tw-justify-center tw-w-10 tw-h-10 tw-bg-[#b3bcce] tw-rounded-lg hover:tw-bg-[#0140c1] tw-transition-colors"
          >
            <i className="icon-Previous tw-text-white tw-text-lg" />
          </button>
          <div>
            <p className="tw-text-[#535353] tw-text-sm">Contract Audit /</p>
            <h1
              className="tw-text-[#000] tw-text-[20px] tw-font-bold tw-break-words tw-max-w-[700px]"
              title={data?.checker_name ?? "Contract Health Report"}
            >
              {data?.checker_name ?? "Contract Health Report"}
            </h1>
          </div>
        </div>

        {/* Export Button */}
        {permissions?.export && <button
          onClick={handleExportPdf}
          disabled={isExporting || sections.length === 0}

          className={`group tw-text-white tw-px-5 tw-py-2.5 tw-rounded-lg tw-flex tw-items-center tw-gap-2 tw-font-semibold tw-text-sm tw-whitespace-nowrap
  tw-transition-all tw-duration-300 tw-ease-in-out
  ${isExporting || sections.length === 0
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
              <i className="icon-Export-PDF" /> Export Report
            </>
          )}
        </button>}
      </div>

      {/* ── Summary Stats ───────────────────────────────────────────── */}
      <div className="tw-grid tw-grid-cols-2 md:tw-grid-cols-4 tw-gap-4 tw-mb-8">
        <StatCard label="Areas Analyzed" value={areasAnalyzed} bg="tw-bg-gray-100"
          icon={<i className="icon-Areas-Analysed tw-text-gray-400 tw-text-[25px]" />} />
        <StatCard label="Total Findings" value={totalFindings} bg="tw-bg-red-50"
          icon={<i className="icon-AI-Risk-Identifier tw-text-red-500 tw-text-[25px]" />} />
        <StatCard label="Improvements" value={improvements} bg="tw-bg-green-50"
          icon={<i className="icon-AI-RPF-Advisor tw-text-[#6da683] tw-text-[25px]" />} />
        <StatCard label="Priority Fixes" value={priorityCount} bg="tw-bg-blue-50"
          icon={<i className="icon-Respond tw-text-blue-500 tw-text-[25px]" />} />
      </div>

      {/* ── Section Header ───────────────────────────────────────────── */}
      {auditReportPkg && <div className="tw-flex tw-justify-between tw-items-center tw-mb-5">
        <div className="tw-flex tw-items-center tw-gap-2 tw-text-gray-700">
          <div className="tw-bg-blue-100 tw-w-9 tw-h-9 tw-flex tw-items-center tw-justify-center tw-rounded-lg tw-flex-shrink-0">
            <i className="tw-text-blue-600 icon-Specialty-Construction tw-text-[25px]" />
          </div>
          <h2 className="tw-font-bold tw-text-[15px]">Detailed Health Analysis</h2>
        </div>

        <div className="tw-flex tw-gap-3">
          {/* Expand / Collapse All */}
          <button
            onClick={handleToggleAll}
            className="tw-flex tw-items-center tw-gap-2 tw-bg-white tw-border tw-border-blue-600 tw-text-blue-600 tw-px-4 tw-py-1.5 tw-rounded-lg tw-text-sm tw-font-medium hover:tw-bg-blue-50 tw-transition-colors"
          >
            <i className="icon-Expansion tw-text-[13px]" />
            {allExpanded ? "Collapse All" : "Expand All"}
          </button>

          {/* Reanalyze button */}
          {permissions?.edit && (
            <button
              ref={btnRef}
              onClick={isMarkAsCompleted ? undefined : handleReanalyzeClick}
              disabled={isMarkAsCompleted}
              className={`tw-flex tw-items-center tw-gap-2 tw-border tw-px-4 tw-py-1.5 tw-rounded-lg tw-text-sm tw-font-medium tw-transition-colors
      ${isMarkAsCompleted
                  ? "tw-bg-gray-100 tw-text-gray-400 tw-border-gray-300 tw-cursor-not-allowed tw-opacity-60"
                  : "tw-bg-white tw-border-blue-600 tw-text-blue-600 hover:tw-bg-blue-50"
                }`}
            >
              <i className="icon-AI-fill tw-text-[20px]" /> Reanalyze
            </button>
          )}

          {/* Reanalyze popup portal */}
          {showPopup && !isMarkAsCompleted && ReactDOM.createPortal(
            <div
              ref={popupRef}
              onClick={(e) => e.stopPropagation()}
              style={{ position: "fixed", top: popupPos.top, left: popupPos.left, zIndex: 999999, width: "320px" }}
              className="tw-bg-white tw-rounded-xl tw-shadow-2xl tw-border tw-border-gray-100 tw-p-5"
            >
              <div className="tw-flex tw-items-center tw-gap-2 tw-mb-2">
                <i className="icon-AI-fill tw-text-[#4488ff] tw-text-[16px]" />
                <h3 className="tw-text-[14px] tw-font-bold tw-text-[#0f172a]">Re-draft Report</h3>
              </div>
              <p className="tw-text-[12px] tw-text-[#64748b] tw-mb-3 tw-leading-relaxed">
                Add instructions for the AI to regenerate this report.
              </p>
              <textarea
                value={instruction}
                onChange={(e) => setInstruction(e.target.value)}
                placeholder="e.g., Focus more on financial risk clauses..."
                rows={5}
                className="tw-w-full tw-border-2 tw-border-[#4488ff] tw-rounded-lg tw-px-3 tw-py-2.5 tw-text-[13px] tw-text-[#1e293b] tw-resize-none focus:tw-outline-none tw-placeholder-gray-300"
              />
              <div className="tw-flex tw-justify-between tw-items-center tw-mt-4 tw-gap-3">
                <button
                  onClick={() => { setShowPopup(false); setInstruction(""); }}
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
                    <><i className="icon-AI-fill tw-text-[12px]" /> Re-draft</>
                  )}
                </button>
              </div>
            </div>,
            document.body
          )}
        </div>
      </div>}

      {/* ── Empty state ──────────────────────────────────────────────── */}
      {sections.length === 0 && (
        <p className="tw-text-sm tw-text-gray-400 tw-text-center tw-py-12">No analysis data available.</p>
      )}

      {/* ── Sections ─────────────────────────────────────────────────── */}
      <div className="tw-space-y-3">
        {/* Identified Clauses — only render when parent access is enabled */}
        {auditReportPkg && sections.length > 0 && (
          !identifiedClausesPkg ? (
            <LockedIdentifiedClauses
              sectionCount={sections.length}
              onUpgrade={handleUpgradeClick}
            />
          ) : (
            sections.map((section, i) => {
              const sectionKey = getSectionKey(section, i);

              return (
                <CollapsibleSection
                  key={sectionKey}
                  open={openSections[sectionKey] ?? i === 0}
                  onToggle={(nextOpen) => handleSectionToggle(sectionKey, nextOpen)}
                  title={formatLabel(section.category ?? section.title)}
                  icon={
                    <div className="tw-w-[38px] tw-h-[38px] tw-rounded-[6px] tw-bg-[#dee9ff] tw-text-[#0140c1] tw-text-[18px] tw-font-semibold tw-flex tw-items-center tw-justify-center tw-flex-shrink-0">
                      {i + 1}
                    </div>
                  }
                  badges={
                    <div className="tw-flex tw-items-center tw-gap-2">
                      {section.findings.length > 0 && (
                        <span className="tw-bg-[#ffe2e3] tw-text-[#ff4444] tw-border tw-border-[#ff8f8f] tw-text-[12px] tw-font-semibold tw-px-2.5 tw-py-0.5 tw-rounded-[5px]">
                          {section.findings.length} Issue{section.findings.length !== 1 ? "s" : ""}
                        </span>
                      )}
                      {section.recommendations.length > 0 && (
                        <span className="tw-bg-[#ecfef6] tw-text-[#10672f] tw-border tw-border-[#a8f3d0] tw-text-[12px] tw-font-semibold tw-px-2.5 tw-py-0.5 tw-rounded-[5px]">
                          {section.recommendations.length} Fix{section.recommendations.length !== 1 ? "es" : ""}
                        </span>
                      )}
                    </div>
                  }
                >
                  <SectionBody
                    findings={section.findings}
                    recommendations={section.recommendations}
                  />
                </CollapsibleSection>
              );
            })
          )
        )}

        {/* Priority Fixes — show content if enabled, upgrade popup if not */}
        {auditReportPkg && priorityFixes.length > 0 && (
          priorityFixesPkg ? (
            <div className="tw-border tw-border-[#d9dee8] tw-rounded-[20px] tw-bg-white tw-p-5">
              <div className="tw-flex tw-items-center tw-justify-between tw-mb-4">
                <div className="tw-flex tw-items-center tw-gap-3">
                  <div className="tw-w-[38px] tw-h-[38px] tw-rounded-md tw-bg-[#fef6eb] tw-flex tw-items-center tw-justify-center">
                    <i className="icon-priority-fixes tw-text-[#ff9500] tw-text-[20px]" />
                  </div>
                  <span className="tw-text-[14px] tw-font-semibold tw-text-gray-800">Priority Fixes</span>
                </div>
                <span className="tw-text-[#ff9500] tw-border tw-border-[#ff9500] tw-text-[12px] tw-font-medium tw-px-2.5 tw-py-0.5 tw-rounded-[3px]">
                  {priorityCount} Action{priorityCount !== 1 ? "s" : ""} Items
                </span>
              </div>
              <div className="tw-space-y-3 tw-bg-[#fef6eb] tw-border-2 tw-border-dashed tw-border-[#ff9500] tw-rounded-[10px] tw-p-4">
                {priorityFixes.map((fix, i) => (
                  <div key={i} className="tw-flex tw-items-start tw-gap-2.5">
                    <span className="tw-flex-shrink-0 tw-mt-0.5 tw-w-[18px] tw-h-[22px] tw-rounded-[4px] tw-bg-[#ffe2ba] tw-text-[#e06100] tw-text-[10px] tw-font-bold tw-flex tw-items-center tw-justify-center">
                      {i + 1}
                    </span>
                    <span className="tw-text-[14px] tw-leading-[1.75] tw-text-[#e06100]">
                      {typeof fix === "string" ? fix : fix.text ?? fix.description ?? JSON.stringify(fix)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <LockedPriorityFixes
              fixCount={priorityCount}
              onUpgrade={handleUpgradeClick}
            />
          )
        )}
      </div>
    </div>
  );
}
