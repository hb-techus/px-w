import React, { useState } from "react";
import {
  AlertTriangle
} from "lucide-react";
import { Card } from "../../../../genriccomponents/Card.js";
import CollapsibleSection from "../../../../genriccomponents/CollapsibleSection.js";
import LegalTimelineChart from "./LegalTimelineChart.js";
import FullPageLoader from "../../../../genriccomponents/loaders/FullPageLoader";
import { useRfpData } from "./useRfpData";
import usePermissions from "../../../Common/usePermissions";
const getInsightIcon = (title = "") => {
  const t = title.toLowerCase();

  if (t.includes("schedule") || t.includes("timeline") || t.includes("deadline") || t.includes("aggressive"))
    return "icon-Aggressive-Schedule";
  if (t.includes("environment") || t.includes("liability") || t.includes("hazmat") || t.includes("mandatory"))
    return "icon-Environmental";
  if (t.includes("design") || t.includes("delivery") || t.includes("build") || t.includes("critical"))
    return "icon-Design-build";
  if (t.includes("technical") || t.includes("weighting") || t.includes("insurance") || t.includes("strong"))
    return "icon-Strong-Technical";
  if (t.includes("risk") || t.includes("risky") || t.includes("clause"))
    return "icon-Risks";
  if (t.includes("requirement") || t.includes("compliance") || t.includes("regulation"))
    return "icon-Requirement---fill";
  if (t.includes("proposal") || t.includes("submission") || t.includes("bid"))
    return "icon-Rules-for-Contact";
  if (t.includes("budget") || t.includes("cost") || t.includes("fee") || t.includes("price"))
    return "icon-Fee";
  if (t.includes("document") || t.includes("file") || t.includes("pdf"))
    return "icon-On-hold";
  if (t.includes("project") || t.includes("overview"))
    return "icon-Project-Details";
  if (t.includes("scope") || t.includes("work"))
    return "icon-scope-of-work---fill";
  if (t.includes("gap") || t.includes("missing"))
    return "icon-Gaps";
  if (t.includes("bond") || t.includes("legal") || t.includes("law") || t.includes("contract"))
    return "icon-Law---fill";
  if (t.includes("contact") || t.includes("communication") || t.includes("email"))
    return "icon-Communication---fill";
  if (t.includes("safety") || t.includes("alert") || t.includes("warning"))
    return "icon-Alert---fill";
  if (t.includes("site") || t.includes("location") || t.includes("visit"))
    return "icon-Location---fill";
  if (t.includes("staff") || t.includes("personnel") || t.includes("team"))
    return "icon-Proposal-Stage---fill";
  if (t.includes("award") || t.includes("post"))
    return "icon-Post-Award--fill";
  if (t.includes("go") || t.includes("decision"))
    return "icon-Go-no-go";
  if (t.includes("page") || t.includes("analysis") || t.includes("analyzed"))
    return "icon-Pages";
  if (t.includes("insurance"))
    return "icon-Bonds-fill";

  return "icon-AI-fill"; // ← default fallback
};

// ─── Scope Category Card ──────────────────────────────────────────────────────
const ScopeCategory = ({ title, items = [] }) => {
  const [isSelected, setIsSelected] = useState(false);
  const isEmpty = items.length === 0;
  return (
    <div
      onClick={() => setIsSelected(!isSelected)}
      className={`tw-group tw-p-5 tw-rounded-xl tw-border tw-bg-white tw-transition-all tw-duration-200 
        ${isSelected ? "tw-border-[#4488ff] tw-ring-1 tw-ring-[#4488ff] tw-shadow-md" : "tw-border-gray-200 hover:tw-border-[#4488ff]"}`}
    >
      <div className="tw-flex tw-items-center tw-justify-between tw-mb-4">
        <h3 className={`tw-text-sm tw-font-bold tw-transition-colors ${isSelected ? "tw-text-[#4488ff]" : "tw-text-gray-900 group-hover:tw-text-[#4488ff]"}`}>
          {title}
        </h3>
        <span className="tw-text-[10px] tw-text-gray-400 tw-font-medium">({items.length} items)</span>
      </div>
      <ul className="tw-space-y-3">
        {isEmpty ? (
          <li className="tw-flex tw-items-start tw-gap-3 tw-text-xs tw-text-gray-400">
            <span className="tw-w-1.5 tw-h-1.5 tw-rounded-full tw-bg-gray-300 tw-mt-1.5 tw-flex-shrink-0" />
            <span>No {title.toLowerCase()} items provided.</span>
          </li>
        ) : items.map((item, i) => (
          <li key={i} className="tw-flex tw-items-start tw-gap-3 tw-text-[13px] tw-text-gray-700 tw-leading-relaxed">
            <span className="tw-w-1.5 tw-h-1.5 tw-rounded-full tw-bg-black tw-mt-1.5 tw-flex-shrink-0" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};


// ─── Metric card config (inline styles for guaranteed colors) ─────────────────
const METRIC_CARDS = [
  {
    label: "Go/No Go",
    key: "riskyClauses",
    icon: "icon-Go-no-go",
    bg: "#ffdede",        // red-200
    border: "#ff4444",    // red-400
    textColor: "#ef4444", // red-500
  },
  {
    label: "Risks",
    key: "risks",
    icon: "icon-Risks",
    bg: "#ffedd4",        // orange-200
    border: "#ff9500",    // orange-400
    textColor: "#f97316", // orange-500
  },
  {
    label: "Gaps",
    key: "gaps",
    icon: "icon-Gaps",
    bg: "#f0f6ff",        // blue-200
    border: "#4488ff",    // blue-400
    textColor: "#3b82f6", // blue-500
  },
  {
    label: "Pages Analyzed",
    key: "pagesAnalyzed",
    icon: "icon-On-hold",
    bg: "#f8fffa",        // green-200
    border: "#1e861c",    // green-500
    textColor: "#16a34a", // green-600
  },
  {
    label: "AI Confidence",
    key: "analysisConfidence",
    icon: "icon-AI-fill",
    bg: "#f3f3ff",        // indigo-200
    border: "#5856d6",    // indigo-400
    textColor: "#4f46e5", // indigo-600
    suffix: "%",
  },
];

// ─── Main Component ───────────────────────────────────────────────────────────
export default function Overview() {
  const { data, loading, isInitialLoad, error } = useRfpData("overview");
  // One permission call — bid_dashboard covers all sections
  const { permissions } = usePermissions('bid_dashboard', 'bid_dashboard');

  // Then per section use packagePermissions from PACKAGE_PATH_MAP
  const { packagePermissions: overviewPkg } = usePermissions('bd_overview', 'bd_overview');
  const { packagePermissions: scopePkg } = usePermissions('bd_scope', 'bd_scope');
  const { packagePermissions: timelinePkg } = usePermissions('bd_timeline', 'bd_timeline');
  const { packagePermissions: insightsPkg } = usePermissions('bd_insights', 'bd_insights');
  const { packagePermissions: procurementPkg } = usePermissions('bd_procurement', 'bd_procurement');
  const { packagePermissions: clarificationPkg } = usePermissions('bd_procurement', 'po_clarification');
  const { packagePermissions: siteVisitsPkg } = usePermissions('bd_procurement', 'po_site');
  const { packagePermissions: contactPkg } = usePermissions('bd_procurement', 'po_contact');
  if (isInitialLoad) return <FullPageLoader />;

  if (!data) {
    return (
      <div className="tw-flex tw-items-center tw-justify-center tw-min-h-[60vh]">
        <Card>
          <div className="tw-p-8 tw-text-center tw-space-y-4">
            <AlertTriangle className="tw-w-12 tw-h-12 tw-text-orange-500 tw-mx-auto" />
            <h2 className="tw-text-xl tw-font-semibold tw-text-gray-900">No Data Available</h2>
            <p className="tw-text-gray-600">{error || "Please analyze an RFP first."}</p>
            <button onClick={() => window.location.href = '/'} className="tw-px-6 tw-py-2 tw-bg-blue-500 tw-text-white tw-rounded-lg hover:tw-bg-blue-700 tw-transition-colors">
              Go to Upload
            </button>
          </div>
        </Card>
      </div>
    );
  }

  const {
    dashboard_items = {},
    quick_insights = [],
    project_overview = {},
    procurement_overview = {},
    scope_of_work = {},
    timeline = [],
  } = data;

  const m = {
    gaps: dashboard_items.gaps || 0,
    risks: dashboard_items.risks || 0,
    riskyClauses: dashboard_items.go_no_go || 0,
    pagesAnalyzed: dashboard_items.pages_analyzed || 0,
    analysisConfidence: dashboard_items.ai_confidence || 0,
  };

  return (
    <div className="tw-h-fulle">
      {loading && <FullPageLoader />}

      <div className="tw-p-1 tw-space-y-6 tw-mx-auto">

        {/* Header */}
        <div className="tw-space-y-4">
          <div className="tw-flex tw-items-center tw-justify-between">
            <div>
              <div className="tw-flex tw-items-center tw-gap-2">
                <span className="tw-text-[20px] tw-text-gray-600 tw-font-medium">Bid Intelligence</span>
                <i className="icon-Save-and-Continue" />
                <span className="tw-text-[20px] tw-font-bold tw-text-gray-900">Bid Dashboard</span>
              </div>
              <p className="tw-text-[#1e293b] tw-text-[14px]">A complete project overview with scope of work, timelines, and procurement details at a glance.</p>
            </div>
            <span className="tw-inline-flex tw-items-center tw-gap-1.5 tw-bg-[#E6F9F1] tw-border tw-border-[#00C070] tw-rounded-full tw-px-3 tw-py-1 tw-text-sm tw-text-[#00C070] tw-font-medium">
              <span className="tw-flex tw-items-center tw-justify-center tw-w-4 tw-h-4 tw-rounded-full tw-bg-[#00C070]">
                <i className="icon-Tick tw-text-white" style={{ fontSize: "10px" }} />
              </span>
              Analysis Complete
            </span>
          </div>

          {/* Metric Cards — inline styles guarantee bg colors regardless of Tailwind purge */}
          <div className="tw-grid tw-grid-cols-2 md:tw-grid-cols-3 lg:tw-grid-cols-5 tw-gap-4">
            {METRIC_CARDS.map(({ label, key, icon, bg, border, textColor, suffix = "" }) => (
              <div
                key={label}
                className="tw-relative tw-rounded-xl tw-shadow-sm tw-overflow-hidden"
                style={{ backgroundColor: bg, border: `1px solid ${border}` }}
              >
                <div className="tw-px-6 tw-py-4 tw-text-center">
                  <i
                    className={`${icon} tw-absolute tw-top-3 tw-right-4 tw-text-[20px]`}
                    style={{ color: textColor }}
                  />
                  <p className="tw-text-[25px] tw-font-[600]" style={{ color: textColor }}>
                    {m[key]}{suffix}
                  </p>
                  <p className="tw-text-[15px] tw-font-medium tw-text-[#1e293b] tw-mt-2">{label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Project Overview */}
        {permissions?.view && overviewPkg && (
          <CollapsibleSection title="Project Overview" defaultExpanded={true}>
            <div className="tw-border-t -tw-mx-6 tw-mb-6" style={{ borderColor: "#e8e8e8" }} />
            <div className="tw-grid tw-grid-cols-1 lg:tw-grid-cols-3 tw-gap-6">
              {[
                { label: "Project Title", value: project_overview.project_title, bold: true },
                { label: "Owner/Sponsor", value: project_overview.owner },
                { label: "Address", value: project_overview.address },
                { label: "Delivery Model", value: project_overview.delivery_model },
                { label: "Contact Person", value: project_overview.contact_person },
                { label: "Contact Email", value: project_overview.contact_email, link: true },
              ].map(({ label, value, bold, link }) => (
                <div key={label} className="tw-space-y-1">
                  <span className="tw-text-[14px] tw-font-normal tw-text-[#3b3b3b]">{label}</span>
<p className={`tw-text-[15px] ${bold ? "tw-font-bold" : "tw-font-normal"} ${link && value && value !== "NA" && value !== "Not Provided" ? "tw-text-[#48f]" : "tw-text-[#3e3e3e]"}`}>                    {value || "Not Provided"}
                  </p>
                </div>
              ))}
            </div>
          </CollapsibleSection>
        )}


        {/* Scope of Work */}


        {permissions?.view && scopePkg && Object.values(scope_of_work).some(v => Array.isArray(v?.content) && v.content.length > 0) && (
          <CollapsibleSection title="Scope of Work" defaultExpanded={true}>
            <div className="tw-border-t -tw-mx-6 tw-mb-6" style={{ borderColor: "#e8e8e8" }} />
            <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 lg:tw-grid-cols-3 tw-gap-6">
              {[
                { key: "new_buildings", label: "New Buildings" },
                { key: "demolition", label: "Demolition" },
                { key: "site_improvements", label: "Site Improvements" },
                { key: "restore_repair", label: "Restoration & Repair" },
                { key: "expansion", label: "Expansion" },
                { key: "specialty_construction", label: "Specialty Construction" },
              ].map(({ key, label }) =>
                scope_of_work[key]?.content?.length > 0
                  ? <ScopeCategory key={key} title={label} items={scope_of_work[key].content} />
                  : null
              )}
            </div>
          </CollapsibleSection>

        )}
        {/* Timeline */}
        {permissions?.view && timelinePkg && timeline.length > 0 && (
          <CollapsibleSection title="Timeline Overview" defaultExpanded={true}>
            <LegalTimelineChart timeline={timeline} />
          </CollapsibleSection>
        )}


        {/* Quick Insights */}
        {permissions?.view && insightsPkg && quick_insights.length > 0 && (
          <CollapsibleSection title="Quick Insights" defaultExpanded={true}>
            <div className="tw-border-t -tw-mx-6 tw-mb-6" style={{ borderColor: "#e8e8e8" }} />
            <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 tw-gap-x-12 tw-gap-y-8">
              {quick_insights.map((insight, i) => {
                const iconClass = getInsightIcon(insight.title);
                return (
                  <div key={i} className="tw-bg-[#f4f8ff] tw-border tw-border-[#48f] tw-rounded-[10px] tw-p-5">
                    <div className="tw-flex tw-items-center tw-gap-3 tw-mb-2">
                      <i className={`${iconClass} tw-text-[#4488ff] tw-flex-shrink-0`} style={{ fontSize: "22px" }} />
                      <p className="tw-font-bold tw-text-[15px] tw-text-[#020202] tw-leading-tight">{insight.title}</p>
                    </div>
                    <p className="tw-text-[14px] tw-text-[#555] tw-leading-relaxed tw-pl-[35px]">
                      {insight.content || insight.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </CollapsibleSection>
        )}


        {/* Procurement Overview */}
        {/* {permissions?.view && procurementPkg && procurement_overview && Object.keys(procurement_overview).length > 0 && (
          <CollapsibleSection title="Procurement Overview" defaultExpanded={true}>
            <div className="tw-border-t -tw-mx-6 tw-mb-6" style={{ borderColor: "#e8e8e8" }} />
            <div className="tw-grid tw-grid-cols-1 lg:tw-grid-cols-2 tw-gap-6">

              {clarificationPkg && procurement_overview.rules_for_request && (
                <div className="tw-rounded-xl tw-border tw-border-gray-200 tw-bg-white tw-p-4">
                  <div className="tw-flex tw-items-center tw-gap-2 tw-mb-3">
                    <i className="icon-Rules-of-Request tw-text-[22px] tw-text-[#48f] tw-flex-shrink-0" />
                    <span className="tw-text-sm tw-font-semibold tw-text-blue-500">
                      Rules of Request for Clarification
                    </span>
                  </div>
                  <div className="tw-bg-blue-50 tw-rounded-lg tw-p-4">
                    <ol className="tw-space-y-3">
                      {procurement_overview.rules_for_request.map((item, i) => (
                        <li key={i} className="tw-flex tw-items-start tw-gap-3">
                          <span className="tw-flex tw-items-center tw-justify-center tw-w-5 tw-h-5 tw-rounded-full tw-bg-blue-100 tw-text-blue-500 tw-text-xs tw-font-bold tw-flex-shrink-0 tw-mt-0.5">
                            {i + 1}
                          </span>
                          <span className="tw-text-[13px] tw-text-gray-700 tw-leading-relaxed">{item}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                </div>
              )}

              {siteVisitsPkg && procurement_overview.site_visits && (
                <div className="tw-rounded-xl tw-border tw-border-gray-200 tw-bg-white tw-p-4">
                  <div className="tw-flex tw-items-center tw-gap-2 tw-mb-3">
                    <i className="icon-Aggressive-Schedule tw-text-[22px] tw-text-[#a6a6a6] tw-flex-shrink-0" />
                    <span className="tw-text-sm tw-font-semibold tw-text-gray-700">
                      Site Visits
                    </span>
                  </div>
                  <div className="tw-bg-gray-50 tw-rounded-lg tw-p-4">
                    <ul className="tw-space-y-3">
                      {procurement_overview.site_visits.map((item, i) => (
                        <li key={i} className="tw-flex tw-items-start tw-gap-3">
                          <span className="tw-w-1.5 tw-h-1.5 tw-rounded-full tw-bg-gray-400 tw-mt-2 tw-flex-shrink-0" />
                          <span className="tw-text-[13px] tw-text-gray-700 tw-leading-relaxed">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {siteVisitsPkg && procurement_overview.supporting_documents && (
                <div className="tw-rounded-xl tw-border tw-border-gray-200 tw-bg-white tw-p-4">
                  <div className="tw-flex tw-items-center tw-gap-2 tw-mb-3">
                    <i className="icon-On-hold tw-text-[22px] tw-text-[#a6a6a6] tw-flex-shrink-0" />
                    <span className="tw-text-sm tw-font-semibold tw-text-gray-700">
                      Supporting Documents
                    </span>
                  </div>
                  <div className="tw-bg-gray-50 tw-rounded-lg tw-p-4">
                    <ul className="tw-space-y-3">
                      {procurement_overview.supporting_documents.map((item, i) => (
                        <li key={i} className="tw-flex tw-items-start tw-gap-3">
                          <span className="tw-w-1.5 tw-h-1.5 tw-rounded-full tw-bg-gray-400 tw-mt-2 tw-flex-shrink-0" />
                          <span className="tw-text-[13px] tw-text-gray-700 tw-leading-relaxed">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {contactPkg && procurement_overview.rules_for_contact && (
                <div className="tw-rounded-xl tw-border tw-border-gray-200 tw-bg-white tw-p-4">
                  <div className="tw-flex tw-items-center tw-gap-2 tw-mb-3">
                    <i className="icon-Rules-for-Contact tw-text-[22px] tw-text-[#ff5757] tw-flex-shrink-0" />
                    <span className="tw-text-sm tw-font-semibold tw-text-red-500">
                      Rules for Contact & Communication
                    </span>
                  </div>
                  <div className="tw-bg-red-50 tw-rounded-lg tw-p-4">
                    <ul className="tw-space-y-3">
                      {procurement_overview.rules_for_contact.map((item, i) => (
                        <li key={i} className="tw-flex tw-items-start tw-gap-3">
                          <span className="tw-w-1.5 tw-h-1.5 tw-rounded-full tw-bg-red-400 tw-mt-2 tw-flex-shrink-0" />
                          <span className="tw-text-[13px] tw-text-gray-700 tw-leading-relaxed">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

            </div>
          </CollapsibleSection>
        )} */}

         {/* Procurement Overview */}
{(() => {
  const hasRulesForRequest     = clarificationPkg && procurement_overview?.rules_for_request?.length > 0
  const hasSiteVisits          = siteVisitsPkg    && procurement_overview?.site_visits?.length > 0
  const hasSupportingDocuments = siteVisitsPkg    && procurement_overview?.supporting_documents?.length > 0
  const hasRulesForContact     = contactPkg       && procurement_overview?.rules_for_contact?.some(item => item?.trim())
  const hasAnyData = hasRulesForRequest || hasSiteVisits || hasSupportingDocuments || hasRulesForContact

  if (!permissions?.view || !procurementPkg || !hasAnyData) return null

  return (
    <CollapsibleSection title="Procurement Overview" defaultExpanded={true}>
      <div className="tw-border-t -tw-mx-6 tw-mb-6" style={{ borderColor: "#e8e8e8" }} />
      <div className="tw-grid tw-grid-cols-1 lg:tw-grid-cols-2 tw-gap-6">

        {hasRulesForRequest && (
          <div className="tw-rounded-xl tw-border tw-border-gray-200 tw-bg-white tw-p-4">
            <div className="tw-flex tw-items-center tw-gap-2 tw-mb-3">
              <i className="icon-Rules-of-Request tw-text-[22px] tw-text-[#48f] tw-flex-shrink-0" />
              <span className="tw-text-sm tw-font-semibold tw-text-blue-500">
                Rules of Request for Clarification
              </span>
            </div>
            <div className="tw-bg-blue-50 tw-rounded-lg tw-p-4">
              <ol className="tw-space-y-3">
                {procurement_overview.rules_for_request.map((item, i) => (
                  <li key={i} className="tw-flex tw-items-start tw-gap-3">
                    <span className="tw-flex tw-items-center tw-justify-center tw-w-5 tw-h-5 tw-rounded-full tw-bg-blue-100 tw-text-blue-500 tw-text-xs tw-font-bold tw-flex-shrink-0 tw-mt-0.5">
                      {i + 1}
                    </span>
                    <span className="tw-text-[13px] tw-text-gray-700 tw-leading-relaxed">{item}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        )}

        {hasSiteVisits && (
          <div className="tw-rounded-xl tw-border tw-border-gray-200 tw-bg-white tw-p-4">
            <div className="tw-flex tw-items-center tw-gap-2 tw-mb-3">
              <i className="icon-Aggressive-Schedule tw-text-[22px] tw-text-[#a6a6a6] tw-flex-shrink-0" />
              <span className="tw-text-sm tw-font-semibold tw-text-gray-700">Site Visits</span>
            </div>
            <div className="tw-bg-gray-50 tw-rounded-lg tw-p-4">
              <ul className="tw-space-y-3">
                {procurement_overview.site_visits.map((item, i) => (
                  <li key={i} className="tw-flex tw-items-start tw-gap-3">
                    <span className="tw-w-1.5 tw-h-1.5 tw-rounded-full tw-bg-gray-400 tw-mt-2 tw-flex-shrink-0" />
                    <span className="tw-text-[13px] tw-text-gray-700 tw-leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {hasSupportingDocuments && (
          <div className="tw-rounded-xl tw-border tw-border-gray-200 tw-bg-white tw-p-4">
            <div className="tw-flex tw-items-center tw-gap-2 tw-mb-3">
              <i className="icon-On-hold tw-text-[22px] tw-text-[#a6a6a6] tw-flex-shrink-0" />
              <span className="tw-text-sm tw-font-semibold tw-text-gray-700">Supporting Documents</span>
            </div>
            <div className="tw-bg-gray-50 tw-rounded-lg tw-p-4">
              <ul className="tw-space-y-3">
                {procurement_overview.supporting_documents.map((item, i) => (
                  <li key={i} className="tw-flex tw-items-start tw-gap-3">
                    <span className="tw-w-1.5 tw-h-1.5 tw-rounded-full tw-bg-gray-400 tw-mt-2 tw-flex-shrink-0" />
                    <span className="tw-text-[13px] tw-text-gray-700 tw-leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {hasRulesForContact && (
          <div className="tw-rounded-xl tw-border tw-border-gray-200 tw-bg-white tw-p-4">
            <div className="tw-flex tw-items-center tw-gap-2 tw-mb-3">
              <i className="icon-Rules-for-Contact tw-text-[22px] tw-text-[#ff5757] tw-flex-shrink-0" />
              <span className="tw-text-sm tw-font-semibold tw-text-red-500">
                Rules for Contact & Communication
              </span>
            </div>
            <div className="tw-bg-red-50 tw-rounded-lg tw-p-4">
              <ul className="tw-space-y-3">
                {procurement_overview.rules_for_contact.filter(item => item?.trim()).map((item, i) => (
                  <li key={i} className="tw-flex tw-items-start tw-gap-3">
                    <span className="tw-w-1.5 tw-h-1.5 tw-rounded-full tw-bg-red-400 tw-mt-2 tw-flex-shrink-0" />
                    <span className="tw-text-[13px] tw-text-gray-700 tw-leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

      </div>
    </CollapsibleSection>
  )
})()}

      </div>
    </div>
  );
}