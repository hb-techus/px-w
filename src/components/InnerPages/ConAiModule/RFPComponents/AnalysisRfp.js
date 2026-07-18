import React from "react";
import {
  Shield,
  BadgeCheck,
  Scale,
  Mail,
  Users,
  Building2,
  MapPin,
  Send,
  FileSearch,
  Lightbulb,
  CircleDot,
  Briefcase,
  FileText,
  Calendar,
  Check
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../../../genriccomponents/Card";
import CollapsibleSection from "../../../../genriccomponents/CollapsibleSection";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import FullPageLoader from "../../../../genriccomponents/loaders/FullPageLoader";
import { useRfpData } from "./useRfpData";
import usePermissions from "../../../Common/usePermissions";
import NoDataFound from "../../../../genriccomponents/NoDataFound";

const CHART_COLORS = [
  '#3b82f6', // blue
  '#10b981', // green
  '#f59e0b', // amber
  '#6366f1', // indigo
  '#6b7280', // gray
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#14b8a6', // teal
  '#f97316', // orange
];

export default function RequirementsSection() {
  const { data, loading, isInitialLoad, error } = useRfpData("requirement_analysis");
  const { packagePermissions: adminPkg }       = usePermissions('re_admin', 're_admin');
const { packagePermissions: evalPkg }        = usePermissions('re_eval', 're_eval');
const { packagePermissions: compliancePkg }  = usePermissions('re_compliance', 're_compliance');
const { packagePermissions: licensingPkg }   = usePermissions('re_licensing', 're_licensing');
const { packagePermissions: staffingPkg }    = usePermissions('re_staffing', 're_staffing');
const { packagePermissions: contractualPkg } = usePermissions('re_contractual', 're_contractual');
const { packagePermissions: clausesPkg }     = usePermissions('re_clauses', 're_clauses');
const { packagePermissions: contactPkg }     = usePermissions('re_contact', 're_contact');

  if (isInitialLoad) {
    return <FullPageLoader />;
  }
  const getContactIcon = (designation = "") => {
    const value = designation.toLowerCase();

    if (value.includes("architect") || value.includes("firm")) {
      return Building2;
    }

    return Users;
  };

  const getSeverityColor = (severity) => {
    switch (severity?.toLowerCase()) {
      case "critical":
      case "high":
        return "tw-bg-red-100 tw-text-red-500 tw-border tw-border-red-200 tw-rounded-full";

      case "major":
      case "medium":
        return "tw-bg-orange-100 tw-text-orange-700 tw-border tw-border-orange-200 tw-rounded-full";

      case "minor":
      case "low":
        return "tw-bg-blue-100 tw-text-blue-700 tw-border tw-border-blue-200 tw-rounded-full";

      default:
        return "tw-bg-gray-100 tw-text-gray-600 tw-border tw-border-gray-200 tw-rounded-full";
    }
  };

  const getValidItems = (items = []) =>
  items.filter((item) => typeof item === "string" && item.trim() !== "");

if (!data) {
  return (
    <div className="tw-h-full tw-overflow-auto">
      {loading && <FullPageLoader />}
      <div className="tw-p-1 tw-space-y-6 tw-mx-auto">
        <div className="tw-space-y-2">
          <div>
            <div className="tw-flex tw-items-center tw-gap-2">
              <span className="tw-text-[20px] tw-text-gray-600 tw-font-medium">Bid Intelligence</span>
              <i className="icon-Save-and-Continue" />
              <span className="tw-text-[20px] tw-font-bold tw-text-gray-900">Requirements Extractor</span>
            </div>
            <p className="tw-text-[#1e293b] tw-text-[14px]">Comprehensive analysis of the RFP document with key insights across all critical sections.</p>
          </div>
        </div>
        <div className="tw-bg-white tw-border tw-border-gray-200 tw-rounded-[15px] tw-p-4">
          <NoDataFound title="No Data Available" description={error || "Please analyze an RFP first."} buttonLabel={null} />
        </div>
      </div>
    </div>
  );
}

  const {
    administrative_requirements = [],
    evaluation_criteria = [],
    compliance_requirements = [],
    licensing_requirements = [],
    staffing_requirements = {},
    contractual_terms = {},
    clause_information = [],
    contact_information = {}
  } = data;

  const hasAnyContent =
  (adminPkg       && administrative_requirements?.length > 0) ||
  (evalPkg        && evaluation_criteria?.length > 0) ||
  (compliancePkg  && compliance_requirements?.length > 0) ||
  (licensingPkg   && licensing_requirements?.length > 0) ||
  (staffingPkg    && (staffing_requirements?.proposal_stage?.length > 0 || staffing_requirements?.post_award?.length > 0)) ||
  (contractualPkg && Object.values(contractual_terms).some(v => getValidItems(v).length > 0)) ||
  (clausesPkg     && clause_information?.length > 0) ||
  (contactPkg     && Object.values(contact_information).some(v => Array.isArray(v) ? v.length > 0 : !!v));

if (!hasAnyContent) {
  return (
    <div className="tw-h-full tw-overflow-auto">
      {loading && <FullPageLoader />}
      <div className="tw-p-1 tw-space-y-6 tw-mx-auto">
        <div className="tw-space-y-2">
          <div>
            <div className="tw-flex tw-items-center tw-gap-2">
              <span className="tw-text-[20px] tw-text-gray-600 tw-font-medium">Bid Intelligence</span>
              <i className="icon-Save-and-Continue" />
              <span className="tw-text-[20px] tw-font-bold tw-text-gray-900">Requirements Extractor</span>
            </div>
            <p className="tw-text-[#1e293b] tw-text-[14px]">Comprehensive analysis of the RFP document with key insights across all critical sections.</p>
          </div>
        </div>
        <div className="tw-bg-white tw-border tw-border-gray-200 tw-rounded-[15px] tw-p-4">
          <NoDataFound title="No Data Available" description="No requirements data found." buttonLabel={null} />
        </div>
      </div>
    </div>
  );
}


  const totalEvaluationPoints = evaluation_criteria.reduce((sum, c) => sum + (c.points || 0), 0);

  const capitalizeFirst = (value) => {
    if (!value || typeof value !== "string") return "";
    return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
  };



  return (
    <div className="tw-h-full">
      <div className="tw-p-1 tw-space-y-6 tw-mx-auto">
        {/* Header */}
        <div className="tw-space-y-2">
          <div>
            <div className="tw-flex tw-items-center tw-gap-2">
              <span className="tw-text-[20px] tw-text-gray-600 tw-font-medium">Bid Intelligence</span>
              <i className="icon-Save-and-Continue" />
              <span className="tw-text-[20px] tw-font-bold tw-text-gray-900">Requirements Extractor</span>
            </div>
            <p className="tw-text-[#1e293b] tw-text-[14px]">Comprehensive analysis of the RFP document with key insights across all critical sections.</p>
          </div>
        </div>
        {/* Administrative Requirements */}
       {adminPkg && administrative_requirements?.length > 0 && (
          <CollapsibleSection title="Administrative Requirements for Submission">
            <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 tw-gap-4 tw-mt-5">
              {administrative_requirements.map((item, index) => (
                <div
                  key={index}
                  className="tw-flex tw-items-start tw-gap-3 tw-p-4 tw-bg-gray-50 tw-rounded-lg tw-border tw-border-gray-200 hover:tw-border-blue-300 tw-transition-colors"
                >
                  <div
                    className="tw-flex tw-items-center tw-justify-center tw-mt-1 tw-w-7 tw-h-7 tw-rounded-lg tw-text-white tw-text-xs tw-font-bold tw-flex-shrink-0"
                    style={{ backgroundColor: '#4488ff' }}
                  >
                    {index + 1}
                  </div>
                  <span className="tw-text-sm tw-text-gray-900 tw-leading-relaxed tw-pt-0.5">
                    {typeof item === 'string'
                      ? item.split(/(https?:\/\/[^\s]+)/g).map((part, i) =>
                        /https?:\/\//.test(part)
                          ? <a key={i} href={part} target="_blank" rel="noopener noreferrer" style={{ color: '#4488ff' }} className="tw-block tw-underline tw-break-all ">{part}</a>
                          : <span key={i}>{part}</span>
                      )
                      : item}
                  </span>
                </div>
              ))}
            </div>
          </CollapsibleSection>
        )}

        {/* Evaluation Criteria */}
       {evalPkg && evaluation_criteria?.length > 0 && (
          <CollapsibleSection
            title="Evaluation Criteria"
          >
            <Card className="tw-border-0 tw-px-0">
              <CardHeader className="tw-pb-2 tw-px-0">
                <CardTitle className="tw-text-sm tw-font-semibold tw-flex tw-items-center tw-justify-between tw-px-0">
                  <span className="tw-flex tw-items-center tw-gap-2">
                    Point Distribution
                  </span>
                  <div className="tw-flex tw-items-center tw-gap-2 tw-px-3 tw-py-1.5 tw-bg-blue-100 tw-rounded-full">
                    <span className="tw-text-lg tw-font-bold tw-text-[#4488ff]">{totalEvaluationPoints}</span>
                    <span className="tw-text-xs tw-text-gray-500">Total Points</span>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="tw-px-0">
                <div className="tw-flex tw-flex-col lg:tw-flex-row tw-items-start tw-gap-6">
                  {/* Pie Chart */}
                  <div className="tw-w-full lg:tw-w-[400px] tw-h-[360px] tw-flex-shrink-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={evaluation_criteria.map((c, i) => ({
                            name: c.criterion,
                            value: c.points,
                            color: CHART_COLORS[i % CHART_COLORS.length]
                          }))}
                          cx="50%"
                          cy="50%"
                          innerRadius={80}
                          outerRadius={140}
                          paddingAngle={3}
                          dataKey="value"
                          label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                          labelLine={false}
                        >
                          {evaluation_criteria.map((_, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={CHART_COLORS[index % CHART_COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value) => [`${value} points`, 'Score']}
                          contentStyle={{
                            backgroundColor: '#fff',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px'
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Scoring Breakdown */}
                  <div className="tw-flex-1 tw-grid tw-grid-cols-1 sm:tw-grid-cols-2 tw-gap-2 tw-w-full">
                    {evaluation_criteria.map((criterion, index) => {
                      const chartColor = CHART_COLORS[index % CHART_COLORS.length];

                      return (
                        <div
                          key={index}
                          className="tw-flex tw-items-center tw-gap-2 tw-p-2 tw-rounded-lg tw-border tw-border-gray-200"
                          style={{ backgroundColor: `${chartColor}15` }}
                        >
                          <div
                            className="tw-w-3 tw-h-3 tw-rounded-full tw-flex-shrink-0"
                            style={{ backgroundColor: chartColor }}
                          />
                          <span className="tw-text-xs tw-font-medium tw-text-gray-900 tw-flex-1 tw-truncate" title={criterion.criterion}>
                            {criterion.criterion}
                          </span>
                          <span
                            className="tw-text-sm tw-font-bold tw-flex-shrink-0"
                            style={{ color: chartColor }}
                          >
                            {criterion.points}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          </CollapsibleSection>
        )}

        {/* Compliance & Labor Requirements */}
        {compliancePkg && compliance_requirements?.length > 0 && (
          <CollapsibleSection
            title="Compliance & Labor Requirements"
          >
            <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 tw-gap-3 tw-mt-5">
              {compliance_requirements.map((item, index) => (
                <Card key={index} className="tw-bg-gradient-to-br tw-from-green-50 tw-to-transparent tw-border-green-200">
                  <div className="tw-p-3">
                    <div className="tw-flex tw-items-center tw-gap-2">
                      <div className="tw-w-6 tw-h-6 tw-rounded-full tw-bg-green-100 tw-flex tw-items-center tw-justify-center tw-flex-shrink-0">
                        <Check className="tw-w-3.5 tw-h-3.5 tw-text-green-600" />
                      </div>
                      <p className="tw-text-sm tw-text-gray-900 tw-leading-relaxed">{item}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </CollapsibleSection>
        )}

        {/* Licensing Requirements */}
        {licensingPkg && licensing_requirements?.length > 0 && (
          <CollapsibleSection
            title="Licensing Requirements"
          >
            <div className="tw-border tw-rounded-lg tw-overflow-hidden tw-mt-5">
              <table className="tw-w-full">
                <thead>
                  <tr className="tw-bg-orange-50">
                    <th className="tw-font-semibold tw-text-gray-900 tw-text-left tw-px-4 tw-py-3 tw-w-[40%]">
                      Requirement
                    </th>
                    <th className="tw-font-semibold tw-text-gray-900 tw-text-left tw-px-4 tw-py-3">
                      Notes
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {licensing_requirements.map((item, index) => (
                    <tr key={index} className="tw-border-t hover:tw-bg-gray-50 tw-transition-colors">
                      <td className="tw-text-sm tw-font-medium tw-text-gray-900 tw-align-top tw-px-4 tw-py-3">
                        <div className="tw-flex tw-items-start tw-gap-2">
                          <BadgeCheck className="tw-w-4 tw-h-4 tw-text-orange-500 tw-flex-shrink-0 tw-mt-0.5" />
                          {item.requirement}
                        </div>
                      </td>
                      <td className="tw-text-sm tw-text-gray-500 tw-px-4 tw-py-3">
                        {item.notes}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CollapsibleSection>
        )}

        {/* Staffing Requirements */}
        {/* {staffing_requirements && (staffing_requirements.proposal_stage || staffing_requirements.post_award) && ( */}
{staffingPkg && staffing_requirements &&
  (
    (Array.isArray(staffing_requirements.proposal_stage) && staffing_requirements.proposal_stage.length > 0) ||
    (Array.isArray(staffing_requirements.post_award) && staffing_requirements.post_award.length > 0)
  ) && (
            <CollapsibleSection title="Staffing Requirements">
              <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 tw-gap-4 tw-mt-5">
                {Array.isArray(staffing_requirements.proposal_stage) &&
                  staffing_requirements.proposal_stage.length > 0 && (
                    <Card className="tw-border-blue-200">
                      <CardHeader className="tw-py-3 tw-px-4 tw-bg-blue-50 tw-rounded-t-lg">
                        <CardTitle className="tw-text-sm tw-font-medium tw-flex tw-items-center tw-gap-2">
                          <Users className="tw-w-4 tw-h-4 tw-text-[#48f]" />
                          Proposal-Stage Staffing Expectations
                        </CardTitle>
                      </CardHeader>
                      <div className="tw-p-4">
                        <ul className="tw-space-y-2">
                          {staffing_requirements.proposal_stage.map((item, index) => (
                            <li key={index} className="tw-flex tw-items-start tw-gap-2">
                              <CircleDot className="tw-w-3.5 tw-h-3.5 tw-text-[#48f] tw-flex-shrink-0 tw-mt-1" />
                              <span className="tw-text-sm tw-text-gray-900">{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </Card>
                  )}

                {Array.isArray(staffing_requirements.post_award) &&
                  staffing_requirements.post_award.length > 0 && (
                    <Card className="tw-border-green-200">
                      <CardHeader className="tw-py-3 tw-px-4 tw-bg-green-50 tw-rounded-t-lg">
                        <CardTitle className="tw-text-sm tw-font-medium tw-flex tw-items-center tw-gap-2">
                          <Briefcase className="tw-w-4 tw-h-4 tw-text-green-600" />
                          Post-Award Staffing Administration
                        </CardTitle>
                      </CardHeader>
                      <div className="tw-p-4">
                        <ul className="tw-space-y-2">
                          {staffing_requirements.post_award.map((item, index) => (
                            <li key={index} className="tw-flex tw-items-start tw-gap-2">
                              <CircleDot className="tw-w-3.5 tw-h-3.5 tw-text-green-600 tw-flex-shrink-0 tw-mt-1" />
                              <span className="tw-text-sm tw-text-gray-900">{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </Card>
                  )}
              </div>
            </CollapsibleSection>
          )}

        {/* Contractual Terms */}
       {contractualPkg && contractual_terms && Object.values(contractual_terms).some(
  v => Array.isArray(getValidItems(v)) && getValidItems(v).length > 0
) && (
            <CollapsibleSection title="Contractual Terms">
              <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 tw-gap-4 tw-mt-5">

                {/* Bonds */}
                {getValidItems(contractual_terms.bonds).length > 0 && (
                  <Card className="tw-border-blue-200">
                    <CardHeader className="tw-py-3 tw-px-4 tw-bg-blue-50 tw-rounded-t-lg">
                      <CardTitle className="tw-text-sm tw-font-medium tw-flex tw-items-center tw-gap-2">
                        <Shield className="tw-w-4 tw-h-4 tw-text-[#48f]" />
                        Bonds
                      </CardTitle>
                    </CardHeader>
                    <div className="tw-p-4">
                      <ul className="tw-space-y-2">
                        {getValidItems(contractual_terms.bonds).map((item, index) => {
                          const [label, ...rest] = item.split(":");
                          const description = rest.join(":").trim();

                          return (
                            <li key={index} className="tw-flex tw-items-start tw-gap-2">
                              <CircleDot className="tw-w-3.5 tw-h-3.5 tw-text-[#48f] tw-flex-shrink-0 tw-mt-1" />
                              <span className="tw-text-sm tw-text-gray-900">
                                <span className="tw-font-medium">{label}</span>
                                {description && <span className="tw-text-gray-700">: {description}</span>}
                              </span>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  </Card>
                )}

                {/* Insurance */}
                {getValidItems(contractual_terms.insurance).length > 0 && (
                  <Card className="tw-border-orange-200">
                    <CardHeader className="tw-py-3 tw-px-4 tw-bg-orange-50 tw-rounded-t-lg">
                      <CardTitle className="tw-text-sm tw-font-medium tw-flex tw-items-center tw-gap-2">
                        <Shield className="tw-w-4 tw-h-4 tw-text-[#ff9500]" />
                        Insurance
                      </CardTitle>
                    </CardHeader>
                    <div className="tw-p-4">
                      <ul className="tw-space-y-2">
                        {getValidItems(contractual_terms.insurance).map((item, index) => {
                          const [label, ...rest] = item.split(":");
                          const description = rest.join(":").trim();

                          return (
                            <li key={index} className="tw-flex tw-items-start tw-gap-2">
                              <CircleDot className="tw-w-3.5 tw-h-3.5 tw-text-[#ff9500] tw-flex-shrink-0 tw-mt-1" />
                              <span className="tw-text-sm">
                                <span className="tw-font-medium">{label}</span>
                                {description && <span className="tw-text-gray-700">: {description}</span>}
                              </span>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  </Card>
                )}

                {/* Schedule Requirements */}
                {getValidItems(contractual_terms.schedule_requirements).length > 0 && (
                  <Card className="tw-border-green-200">
                    <CardHeader className="tw-py-3 tw-px-4 tw-bg-green-50 tw-rounded-t-lg">
                      <CardTitle className="tw-text-sm tw-font-medium tw-flex tw-items-center tw-gap-2">
                        <Calendar className="tw-w-4 tw-h-4 tw-text-green-600" />
                        Schedule/Reporting Requirements
                      </CardTitle>
                    </CardHeader>
                    <div className="tw-p-4">
                      <ul className="tw-space-y-2">
                        {getValidItems(contractual_terms.schedule_requirements).map((item, index) => (
                          <li key={index} className="tw-flex tw-items-start tw-gap-2">
                            <CircleDot className="tw-w-3.5 tw-h-3.5 tw-text-green-600 tw-flex-shrink-0 tw-mt-1" />
                            <span className="tw-text-sm tw-text-gray-900">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </Card>
                )}

                {/* Governing Law */}
                {getValidItems(contractual_terms.governing_law).length > 0 && (
                  <Card className="tw-border-gray-300">
                    <CardHeader className="tw-py-3 tw-px-4 tw-bg-gray-100 tw-rounded-t-lg">
                      <CardTitle className="tw-text-sm tw-font-medium tw-flex tw-items-center tw-gap-2">
                        <Scale className="tw-w-4 tw-h-4 tw-text-gray-600" />
                        Governing Law
                      </CardTitle>
                    </CardHeader>
                    <div className="tw-p-4">
                      <div className="tw-flex tw-items-center tw-gap-3 tw-p-3 tw-bg-gray-50 tw-rounded-lg">
                        
                        <div className="tw-w-10 tw-h-10 tw-min-w-[40px] tw-min-h-[40px] tw-rounded-full tw-bg-blue-100 tw-flex tw-items-center tw-justify-center tw-flex-shrink-0">
                          <FileText className="tw-w-5 tw-h-5 tw-text-[#48f]" />
                        </div>

                        <p className="tw-text-sm tw-font-medium tw-text-gray-900">
                          {getValidItems(contractual_terms.governing_law)[0]}
                        </p>

                      </div>
                    </div>
                  </Card>
                )}

              </div>
            </CollapsibleSection>
        )}

        {/* Clauses Information */}
       {clausesPkg && clause_information?.length > 0 && (
          <CollapsibleSection
            title="Clauses Information"
            defaultOpen={true}
          >
            <div className="tw-space-y-4 tw-mt-5">
              {/* Summary stats */}
              <div className="tw-grid tw-grid-cols-2 md:tw-grid-cols-4 tw-gap-4 tw-mb-4">
                <Card className="tw-bg-gradient-to-br tw-from-red-50 tw-to-red-100 tw-border-red-200">
                  <div className="tw-p-3 tw-text-center">
                    <p className="tw-text-xl tw-font-bold tw-text-red-600">
                      {clause_information.filter(c => c.risk_level === 'high').length}
                    </p>
                    <p className="tw-text-xs tw-text-gray-500">High Severity</p>
                  </div>
                </Card>
                <Card className="tw-bg-gradient-to-br tw-from-orange-50 tw-to-orange-100 tw-border-orange-200">
                  <div className="tw-p-3 tw-text-center">
                    <p className="tw-text-xl tw-font-bold tw-text-orange-600">
                      {clause_information.filter(c => c.risk_level === 'medium').length}
                    </p>
                    <p className="tw-text-xs tw-text-gray-500">Medium Severity</p>
                  </div>
                </Card>
                <Card className="tw-bg-gradient-to-br tw-from-green-50 tw-to-green-100 tw-border-green-200">
                  <div className="tw-p-3 tw-text-center">
                    <p className="tw-text-xl tw-font-bold tw-text-green-600">
                      {clause_information.filter(c => c.risk_level === 'low').length}
                    </p>
                    <p className="tw-text-xs tw-text-gray-500">Low Severity</p>
                  </div>
                </Card>
                <Card>
                  <div className="tw-p-3 tw-text-center">
                    <p className="tw-text-xl tw-font-bold tw-text-gray-900">
                      {clause_information.length}
                    </p>
                    <p className="tw-text-xs tw-text-gray-500">Detected Clauses</p>
                  </div>
                </Card>
              </div>

              {/* Table */}
              <div className="tw-border-2 tw-border-gray-200 tw-rounded-lg tw-overflow-hidden tw-shadow-sm">
                <table className="tw-w-full">
                  <thead>
                    <tr className="tw-bg-blue-50">
                      <th className="tw-font-semibold tw-text-[15px] tw-text-[#002149]  tw-text-left tw-px-4 tw-py-3">
                        Clause
                      </th>
                      <th className="tw-font-semibold tw-text-[15px] tw-text-[#002149]  tw-text-left tw-px-4 tw-py-3">
                        Risk Level
                      </th>
                      <th className="tw-font-semibold tw-text-[15px] tw-text-[#002149]  tw-text-left tw-px-4 tw-py-3">
                        AI Recommendation
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {clause_information.map((clause, index) => (
                      <tr key={index} className="tw-border-t hover:tw-bg-gray-50 tw-transition-colors">
                        <td className="tw-text-[14px] tw-text-gray-900 tw-px-4 tw-py-3">
                          <div className="tw-flex tw-items-center tw-gap-2">
                            <Scale className="tw-w-4 tw-h-4 tw-text-[#4488ff]" />
                            {clause.clause}
                          </div>
                        </td>
                        <td className="tw-px-4 tw-py-3">
                          <span className={`tw-px-2 tw-py-1 tw-rounded tw-text-xs tw-font-medium ${getSeverityColor(clause.risk_level)}`}>
                            {capitalizeFirst(clause.risk_level)}
                          </span>
                        </td>
                        <td className="tw-text-[14px] tw-text-gray-500 tw-max-w-sm tw-px-4 tw-py-3">
                          <div className="tw-flex tw-items-start tw-gap-2">
                            <Lightbulb className="tw-w-4 tw-h-4 tw-text-[#4488ff] tw-flex-shrink-0 tw-mt-1" />
                            <span>{clause.ai_recommendation}</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </CollapsibleSection>
        )}

        {/* Contact Information */}
        {contactPkg && contact_information && Object.values(contact_information).some(v => {
            if (Array.isArray(v)) return v.length > 0;
            if (typeof v === "object" && v !== null) return Object.keys(v).length > 0;
            return !!v;
          }) && (
            <CollapsibleSection
              title="Contact Information"
            >
              <div className="tw-space-y-4 tw-mt-5">
                {/* Email Contacts */}
                {contact_information.questions_communication && contact_information.questions_communication.length > 0 && (
                  <Card className="tw-border-2 tw-border-blue-300 tw-bg-gradient-to-r tw-from-blue-50 tw-to-transparent">
                    <div className="tw-p-4">
                      <div className="tw-flex tw-items-center tw-gap-2 tw-mb-4">
                        <div className="tw-w-8 tw-h-8 tw-rounded-full tw-bg-[#4488ff] tw-flex tw-items-center tw-justify-center">
                          <Mail className="tw-w-4 tw-h-4 tw-text-white" />
                        </div>
                        <h4 className="tw-font-semibold tw-text-gray-900">Questions & Communications</h4>
                        <span className="tw-ml-auto tw-font-semibold tw-inline-flex tw-items-center tw-gap-1.5 tw-border tw-border-gray-200 tw-rounded-full tw-px-2 tw-py-0.5 tw-text-xs">
                          Email Required
                        </span>
                      </div>
                      <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 tw-gap-4">
                        {contact_information.questions_communication.map((contact, index) => (
                          <div
                            key={index}
                            className="tw-flex tw-items-center tw-gap-4 tw-p-4 tw-bg-white tw-rounded-lg tw-border tw-border-gray-200 tw-shadow-sm"
                          >
                            {/* Icon */}
                            <div className="tw-w-12 tw-h-12 tw-rounded-full tw-bg-blue-100 tw-flex tw-items-center tw-justify-center tw-flex-shrink-0">
                              {(() => {
                                const Icon = getContactIcon(contact.designation);
                                return <Icon className="tw-w-6 tw-h-6 tw-text-[#48f]" />;
                              })()}
                            </div>

                            {/* Content */}
                            <div className="tw-flex-1 tw-min-w-0">
                              <p className="tw-text-base tw-font-semibold tw-text-gray-900">
                                {contact.name}
                              </p>
                              <p className="tw-text-xs tw-text-gray-500 tw-mb-1">
                                {contact.designation}
                              </p>
                              <a
                                href={`mailto:${contact.contact_email}`}
                                className="tw-inline-flex tw-items-center tw-gap-1.5 tw-text-sm tw-text-[#48f] tw-font-medium hover:tw-underline"
                              >
                                <Mail className="tw-w-3.5 tw-h-3.5 tw-text-[#48f]" />
                                {contact.contact_email}
                              </a>
                            </div>
                          </div>

                        ))}
                      </div>
                    </div>
                  </Card>
                )}

                {/* Locations - Grid Layout */}
                <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-3 tw-gap-4">
                  {/* Proposal Delivery */}
                  {contact_information.proposal_delivery && contact_information.proposal_delivery.length > 0 && (
                    <Card className="tw-border-green-300 hover:tw-border-green-500 tw-transition-colors">
                      <div className="tw-p-4">
                        <div className="tw-flex tw-items-start tw-gap-3">
                          <div className="tw-w-10 tw-h-10 tw-rounded-lg tw-bg-green-100 tw-flex tw-items-center tw-justify-center tw-flex-shrink-0">
                            <Send className="tw-w-5 tw-h-5 tw-text-green-600" />
                          </div>
                          <div className="tw-flex-1">
                            <p className="tw-text-xs tw-font-semibold tw-text-green-600 tw-uppercase tw-tracking-wider tw-mb-1">
                              Proposal Delivery
                            </p>
                            <p className="tw-text-sm tw-font-semibold tw-text-gray-900">
                              {contact_information.proposal_delivery[0]}
                            </p>
                            {contact_information.proposal_delivery[1] && (
                              <p className="tw-text-sm tw-text-gray-500 tw-mt-1">
                                {contact_information.proposal_delivery[1]}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </Card>
                  )}

                  {/* Project Site */}
                  {contact_information.project_site && contact_information.project_site.length > 0 && (
                    <Card className="tw-border-blue-300 hover:tw-border-blue-500 tw-transition-colors">
                      <div className="tw-p-4">
                        <div className="tw-flex tw-items-start tw-gap-3">
                          <div className="tw-w-10 tw-h-10 tw-rounded-lg tw-bg-blue-100 tw-flex tw-items-center tw-justify-center tw-flex-shrink-0">
                            <MapPin className="tw-w-5 tw-h-5 tw-text-[#48f]" />
                          </div>
                          <div className="tw-flex-1">
                            <p className="tw-text-xs tw-font-semibold tw-text-[#48f] tw-uppercase tw-tracking-wider tw-mb-1">
                              Project Site
                            </p>
                            <p className="tw-text-sm tw-font-semibold tw-text-gray-900">
                              {contact_information.project_site[0]}
                            </p>
                            {contact_information.project_site[1] && (
                              <p className="tw-text-sm tw-text-gray-500 tw-mt-1">
                                {contact_information.project_site[1]}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </Card>
                  )}

                  {/* Document Inspection */}
                  {contact_information.document_inspection && contact_information.document_inspection.length > 0 && (
                    <Card className="tw-border-orange-300 hover:tw-border-orange-500 tw-transition-colors">
                      <div className="tw-p-4">
                        <div className="tw-flex tw-items-start tw-gap-3">
                          <div className="tw-w-10 tw-h-10 tw-rounded-lg tw-bg-orange-100 tw-flex tw-items-center tw-justify-center tw-flex-shrink-0">
                            <FileSearch className="tw-w-5 tw-h-5 tw-text-orange-600" />
                          </div>
                          <div className="tw-flex-1">
                            <p className="tw-text-xs tw-font-semibold tw-text-orange-600 tw-uppercase tw-tracking-wider tw-mb-1">
                              Document Inspection
                            </p>
                            <p className="tw-text-sm tw-font-semibold tw-text-gray-900">
                              {contact_information.document_inspection[0]}
                            </p>
                            {contact_information.document_inspection[1] && (
                              <p className="tw-text-sm tw-text-gray-500 tw-mt-1">
                                {contact_information.document_inspection[1]}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </Card>
                  )}
                </div>
              </div>
            </CollapsibleSection>
          )}
      </div>
    </div>
  );
}