import React, { useEffect, useState } from "react";
import {
  Trophy,
  Target,
  ChevronDown,
  ChevronRight,
  DollarSign,
  Building2,
  Users,
  FileText,
  ClipboardCheck,
  History,
  Shield,
  Scale,
  AlertTriangle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../../../genriccomponents/Card";
import { useRfpData } from "./useRfpData";
import FullPageLoader from "../../../../genriccomponents/loaders/FullPageLoader";
import usePermissions, { resolvePackageEnabled } from "../../../Common/usePermissions";
import { useSelector } from "react-redux";
import { GetRfpAnalyzerData } from "../../../../services/techus-services";

const SCENARIO_PACKAGE_KEYS = [
  "sc_compliant",
  "sc_price",
  "sc_experience",
  "sc_team",
  "sc_schedule",
  "sc_bafo",
];
// Icon mapping for evaluation areas
const iconMapping = {
  "Proposed Lump Sum Fee": DollarSign,
  "Company Experience": Building2,
  "Proposed Project Personnel": Users,
  "Project Specific Approach": FileText,
  "Completeness & Accuracy": ClipboardCheck,
  "Background/Firm History": History,
  "Financial Status & Bonding": Shield,
  "Legal Proceedings": Scale,
  "Safety Plan": AlertTriangle,
};

const ScenarioCard = ({ scenario, index }) => {
  const [isExpanded, setIsExpanded] = useState(index === 0);
  const totalRecommendations = (scenario.respond?.length || 0) + (scenario.win?.length || 0);

  return (
    <Card className={`tw-border tw-transition-all tw-duration-200 tw-overflow-hidden ${isExpanded ? "tw-border-blue-600/30 tw-shadow-md" : "tw-border-gray-200 hover:tw-border-blue-600/20"
      }`}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="tw-w-full tw-text-left"
      >
        <CardHeader className="tw-py-3">
          <div className="tw-flex tw-items-center tw-justify-between tw-gap-4">
            <div className="tw-flex tw-items-center tw-gap-3">
              <div className="tw-flex tw-items-center tw-justify-center tw-w-8 tw-h-8 tw-rounded-lg tw-bg-blue-600/10 tw-text-[#48f] tw-text-[18px] tw-font-semibold tw-shrink-0">
                {index + 1}
              </div>
              <CardTitle className="tw-text-base tw-font-semibold tw-leading-tight">
                {scenario.title}
              </CardTitle>
            </div>
            <div className="tw-flex tw-items-center tw-gap-2 tw-shrink-0">
              <span className="tw-inline-flex tw-items-center tw-rounded-full tw-bg-gray-100 tw-px-2.5 tw-py-0.5 tw-text-xs tw-font-medium tw-text-gray-700 tw-border tw-border-gray-200">
                {totalRecommendations} recommendations
              </span>
              {isExpanded ? (
                <ChevronDown className="tw-w-4 tw-h-4 tw-text-gray-500" />
              ) : (
                <ChevronRight className="tw-w-4 tw-h-4 tw-text-gray-500" />
              )}
            </div>
          </div>
        </CardHeader>
      </button>

      {isExpanded && (
        <CardContent className="tw-pt-0 tw-pb-5">
          <div className="tw-grid md:tw-grid-cols-2 tw-gap-5">
            {/* How to Respond Section - Left */}
            {scenario.respond && scenario.respond.length > 0 && (
              <div className="tw-rounded-xl tw-border-2 tw-border-amber-500/30 tw-bg-amber-50/50 tw-overflow-hidden">
                <div className="tw-flex tw-items-center tw-gap-3 tw-px-4 tw-py-3 tw-bg-amber-100/50 tw-border-b tw-border-amber-500/20">
                  <div className="tw-flex tw-items-center tw-justify-center tw-w-8 tw-h-8 tw-rounded-lg tw-bg-amber-500/20">
                    <Target className="tw-w-4 tw-h-4 tw-text-amber-600" />
                  </div>
                  <div className="tw-flex-1">
                    <h4 className="tw-font-bold tw-text-sm tw-text-amber-700">How to Respond</h4>
                    <p className="tw-text-xs tw-text-amber-600/70">Compliance & submission guidance</p>
                  </div>
                  <span className="tw-inline-flex tw-items-center tw-font-semibold tw-rounded-xl tw-text-xs tw-bg-[#ff9500] tw-text-white tw-px-2 tw-py-0.5">
                    {scenario.respond.length}
                  </span>
                </div>
                <div className="tw-p-4 tw-space-y-3">
                  {scenario.respond.map((item, i) => (
                    <div key={i} className="tw-flex tw-gap-3">
                      <div className="tw-flex tw-items-center tw-justify-center tw-w-5 tw-h-5 tw-rounded-full tw-bg-amber-500/20 tw-shrink-0 tw-mt-0.5">
                        <span className="tw-text-xs tw-font-semibold tw-text-amber-600">{i + 1}</span>
                      </div>
                      <div>
                        <p className="tw-font-bold tw-text-[15px] tw-text-[#2f2f2f] tw-leading-tight">{item.title}</p>
                        <p className="tw-text-[15px] tw-font-[500] tw-text-[#2f2f2f] tw-leading-relaxed tw-mt-1">{item.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* How to Win Section - Right */}
            {scenario.win && scenario.win.length > 0 && (
              <div className="tw-rounded-xl tw-border-2 tw-border-blue-600/30 tw-bg-blue-50/50 tw-overflow-hidden">
                <div className="tw-flex tw-items-center tw-gap-3 tw-px-4 tw-py-3 tw-bg-blue-100/50 tw-border-b tw-border-blue-600/20">
                  <div className="tw-flex tw-items-center tw-justify-center tw-w-8 tw-h-8 tw-rounded-lg tw-bg-blue-600/20">
                    <Trophy className="tw-w-4 tw-h-4 tw-text-[#48f]" />
                  </div>
                  <div className="tw-flex-1">
                    <h4 className="tw-font-bold tw-text-sm tw-text-[#48f]">How to Win</h4>
                    <p className="tw-text-xs tw-text-[#48f]">Strategic advantage tactics</p>
                  </div>
                  <span className="tw-inline-flex tw-items-center tw-font-semibold tw-rounded-xl tw-text-xs tw-bg-[#48f] tw-text-white tw-px-2 tw-py-0.5">
                    {scenario.win.length}
                  </span>
                </div>
                <div className="tw-p-4 tw-space-y-3">
                  {scenario.win.map((item, i) => (
                    <div key={i} className="tw-flex tw-gap-3">
                      <div className="tw-flex tw-items-center tw-justify-center tw-w-5 tw-h-5 tw-rounded-full tw-bg-blue-600/20 tw-shrink-0 tw-mt-0.5">
                        <span className="tw-text-xs tw-font-semibold tw-text-[#48f]">{i + 1}</span>
                      </div>
                      <div>
                        <p className="tw-font-bold tw-text-[15px] tw-text-[#2f2f2f] tw-leading-tight">{item.title}</p>
                        <p className="tw-text-[15px] tw-font-[500] tw-text-[#2f2f2f] tw-leading-relaxed tw-mt-1">{item.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
};

export default function RfpAdvisor() {
  const { data, loading, isInitialLoad, error } = useRfpData("rfp_advisor");
  const [selectedScenarioIndexes, setSelectedScenarioIndexes] = useState(null);
  const [isSelectionLoading, setIsSelectionLoading] = useState(true);
const packageList = useSelector((s) => s?.auth?.user?.[0]?.package_info);
const wsRewardsEnabled  = resolvePackageEnabled(packageList, 'ws_rewards',  { strict: true });
const wsScenarioEnabled = resolvePackageEnabled(packageList, 'ws_scenario', { strict: true });
const isWinStrategistEnabled =
  resolvePackageEnabled(packageList, 'win_strategist', { strict: true }) &&
  (wsRewardsEnabled || wsScenarioEnabled);
const { permissions } = usePermissions('win_strategist', 'win_strategist');
const { packagePermissions: rewardsPkg }   = usePermissions('ws_rewards', 'ws_rewards');
const { packagePermissions: scenarioPkg }    = usePermissions('ws_scenario', 'ws_scenario');
const { packagePermissions: scCompliantPkg } = usePermissions('sc_compliant', 'sc_compliant');
const { packagePermissions: scPricePkg }     = usePermissions('sc_price', 'sc_price');
const { packagePermissions: scExpPkg }       = usePermissions('sc_experience', 'sc_experience');
const { packagePermissions: scTeamPkg }      = usePermissions('sc_team', 'sc_team');
const { packagePermissions: scSchedulePkg }  = usePermissions('sc_schedule', 'sc_schedule');
const { packagePermissions: scBafoPkg }      = usePermissions('sc_bafo', 'sc_bafo');


const scenarioPkgMap = {
  sc_compliant: scCompliantPkg,
  sc_price:     scPricePkg,
  sc_experience: scExpPkg,
  sc_team:      scTeamPkg,
  sc_schedule:  scSchedulePkg,
  sc_bafo:      scBafoPkg,
};

  useEffect(() => {
    let isMounted = true;

    const loadSelectedScenarios = async () => {
      try {
        const organization_id = window.localStorage.getItem("organization_id") || "";

        if (!organization_id) {
          if (isMounted) {
            setSelectedScenarioIndexes(null);
          }
          return;
        }

        const response = await GetRfpAnalyzerData(organization_id);
        const winStrategist = response?.data?.rfp_analyzer_data?.win_strategist;

        if (isMounted) {
          if (winStrategist && typeof winStrategist === "object") {
            const selectedIndexes = SCENARIO_PACKAGE_KEYS.reduce((indexes, _, index) => {
              if (winStrategist[String(index)] === true) {
                indexes.push(index);
              }
              return indexes;
            }, []);

            setSelectedScenarioIndexes(selectedIndexes);
          } else {
            setSelectedScenarioIndexes(null);
          }
        }
      } catch (fetchError) {
        console.error("Failed to fetch Win Strategist selections:", fetchError);
        if (isMounted) {
          setSelectedScenarioIndexes(null);
        }
      } finally {
        if (isMounted) {
          setIsSelectionLoading(false);
        }
      }
    };

    loadSelectedScenarios();

    return () => {
      isMounted = false;
    };
  }, []);

  if (isInitialLoad) {
    return <FullPageLoader />;
  }

  if (!isWinStrategistEnabled) {
    return (
      <div className="tw-flex tw-items-center tw-justify-center tw-p-6">
        <div className="tw-bg-white tw-border tw-border-gray-200 tw-rounded-lg tw-p-8 tw-text-center tw-max-w-md">
          <AlertTriangle className="tw-w-12 tw-h-12 tw-text-orange-500 tw-mx-auto tw-mb-4" />
          <h2 className="tw-text-xl tw-font-semibold tw-mb-2">Access Restricted</h2>
          <p className="tw-text-gray-600">You don't have access to Win Strategist. Please upgrade your package.</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="tw-flex tw-items-center tw-justify-center tw-h-full tw-p-6">
        <div className="tw-text-center tw-space-y-3">
          <AlertTriangle className="tw-w-12 tw-h-12 tw-text-amber-500 tw-mx-auto" />
          <p className="tw-text-gray-900 tw-font-semibold">No advisor data available</p>
          <p className="tw-text-gray-500 tw-text-sm">{error || 'Please analyze an RFP first'}</p>
        </div>
      </div>
    );
  }

  const rewards = data.rfp_rewards || [];
  const scenarios = data.scenario_based_guidance || [];
  const totalPoints = rewards.reduce((sum, item) => sum + (item.points || 0), 0);
  const selectedScenarioSet = Array.isArray(selectedScenarioIndexes)
    ? new Set(selectedScenarioIndexes)
    : null;
  const allowedScenarios = scenarios.filter((_, index) => {
    const packageKey = SCENARIO_PACKAGE_KEYS[index];
    const isPackageAllowed = scenarioPkgMap[packageKey] !== false;
    const isSelectedInWinStrategist = !selectedScenarioSet || selectedScenarioSet.has(index);

    return isPackageAllowed && isSelectedInWinStrategist;
  });
  return (
    <div className="tw-h-full">
      {(loading || isSelectionLoading) && <FullPageLoader />}

      <div className="tw-p-1 tw-space-y-6 tw-mx-auto">
        {/* Page Header */}
        <div className="tw-space-y-2">
          <div className="tw-flex tw-items-center tw-gap-3">
            <div>
              <div className="tw-flex tw-items-center tw-gap-2">
                <span className="tw-text-[20px] tw-text-gray-600 tw-font-medium">Bid Intelligence</span>
                <i className="icon-Save-and-Continue" />
                <span className="tw-text-[20px] tw-font-bold tw-text-gray-900">Win Strategist</span>
              </div>
              <p className="tw-text-[#1e293b] tw-text-[14px]">Scenario-based guidance on how to position your proposal for maximum scoring against the evaluation criteria.</p>
            </div>
          </div>
        </div>

        {/* Win Conditions Section */}
       {permissions?.view && rewardsPkg && rewards.length > 0 && (
          <Card className="tw-border-2 tw-border-blue-600/20 tw-shadow-lg tw-overflow-hidden">
            <div className="tw-bg-gradient-to-r tw-from-blue-50 tw-via-blue-100/50 tw-to-blue-50 tw-border-b tw-border-blue-600/10">
              <CardHeader className="tw-pb-4">
                <div className="tw-flex tw-items-center tw-gap-3">
                  <div className="tw-flex tw-items-center tw-justify-center tw-w-10 tw-h-10">
                    <i className="icon-Reward tw-text-[32px] tw-text-[#48f]" />
                  </div>
                  <div>
                    <CardTitle className="tw-text-lg tw-font-bold">What the RFP Rewards</CardTitle>
                    <p className="tw-text-sm tw-text-gray-500 tw-mt-1">Your "win conditions" — the scoring model tells you exactly what to optimize for</p>
                  </div>
                </div>
              </CardHeader>
            </div>
            <CardContent className="!tw-p-0">
              <div className="tw-divide-y tw-divide-gray-200">
                {/* Header Row */}
                <div className="tw-grid tw-grid-cols-[1fr,100px,2fr] tw-gap-4 tw-px-6 tw-py-3 tw-bg-gray-50">
                  <span className="tw-text-xs tw-font-semibold tw-text-gray-500 tw-uppercase tw-tracking-wide">Evaluation Area</span>
                  <span className="tw-text-xs tw-font-semibold tw-text-gray-500 tw-uppercase tw-tracking-wide tw-text-center">Points</span>
                  <span className="tw-text-xs tw-font-semibold tw-text-gray-500 tw-uppercase tw-tracking-wide">What the City is Looking For</span>
                </div>
                {/* Data Rows */}
                {rewards.map((item, index) => {
                  const Icon = iconMapping[item.evaluation_area] || FileText;
                  const percentage = totalPoints > 0 ? (item.points / totalPoints) * 100 : 0;
                  return (
                    <div
                      key={index}
                      className={`tw-grid tw-grid-cols-[1fr,100px,2fr] tw-gap-4 tw-px-6 tw-py-4 tw-items-center tw-transition-colors ${index % 2 === 0 ? "tw-bg-white" : "tw-bg-gray-50/50"
                        }`}
                    >
                      <div className="tw-flex tw-items-center tw-gap-3">
                        <div className="tw-flex tw-items-center tw-justify-center tw-w-8 tw-h-8 tw-rounded-lg tw-shrink-0 tw-bg-gray-100 tw-text-gray-500">
                          <Icon className="tw-w-4 tw-h-4" />
                        </div>
                        <span className="tw-font-medium tw-text-sm">
                          {item.evaluation_area}
                        </span>
                      </div>
                      <div className="tw-flex tw-flex-col tw-items-center tw-gap-1">
                        <span className="tw-text-lg tw-font-bold tw-text-gray-900">
                          {item.points}
                        </span>
                        <div className="tw-w-full tw-bg-gray-100 tw-rounded-full tw-h-1.5">
                          <div
                            className="tw-h-1.5 tw-rounded-full tw-transition-all tw-bg-gray-400"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                      <span className="tw-text-sm tw-text-gray-500">{item.requirement}</span>
                    </div>
                  );
                })}
                {/* Total Row */}
                {/* Total Row */}
                <div className="tw-grid tw-grid-cols-[1fr,100px,2fr] tw-gap-4 tw-px-6 tw-py-4 tw-bg-blue-50 tw-items-center">
                  <span className="tw-font-bold tw-text-gray-900">Total Points Available</span>
                  <div className="tw-flex tw-justify-center">
                    <span className="tw-inline-flex tw-items-center tw-rounded-2xl tw-bg-[#4488ff] tw-text-white tw-text-lg tw-px-4 tw-py-1 tw-font-bold">
                      {totalPoints}
                    </span>
                  </div>
                  <span className="tw-text-[12px] tw-font-medium tw-text-gray-600">
                    Focus on high-value categories:{" "}
                    {[...rewards]
                      .sort((a, b) => (b.points || 0) - (a.points || 0))
                      .slice(0, 3)
                      .map((item, i) => (
                        <span key={i}>
                          <span className="tw-font-bold tw-text-[#002149]">{item.evaluation_area}</span>
                          <span className="tw-text-gray-500"> ({item.points})</span>
                          {i < 2 ? <span className="tw-text-gray-400">, </span> : null}
                        </span>
                      ))
                    }
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Scenario-Based Guidance Section */}
{permissions?.view && scenarioPkg && allowedScenarios.length > 0 && (
          <Card className="tw-border-2 tw-border-blue-600/20 tw-shadow-lg tw-overflow-hidden">
            <div className="tw-bg-gradient-to-r tw-from-blue-50 tw-via-blue-100/50 tw-to-blue-50 tw-border-b tw-border-blue-600/10">
              <CardHeader className="tw-pb-4">
                <div className="tw-flex tw-items-center tw-gap-3">
                  <div className="tw-flex tw-items-center tw-justify-center tw-w-10 tw-h-10">
                    <i className="icon-AI-fill tw-text-[30px] tw-text-[#48f]" />
                  </div>
                  <div className="tw-flex-1">
                    <div className="tw-flex tw-items-center tw-gap-3">
                      <CardTitle className="tw-text-lg tw-font-bold">Scenario-Based Guidance</CardTitle>
                      <span className="tw-inline-flex tw-items-center tw-rounded-full tw-bg-[#4488ff] tw-text-white tw-px-2.5 tw-py-[3px] tw-text-xs tw-font-semibold">
                        <i className="icon-AI-fill tw-text-[16px] tw-mr-1" tw-leading-none />
                        <span className="tw-ml-0.5 tw-mr-1">AI Generated</span>
                      </span>
                    </div>
                    <p className="tw-text-[14px] tw-text-[#002149] tw-mt-1">Tailored strategies for different competitive positions</p>
                  </div>
                </div>
              </CardHeader>
            </div>
            <CardContent className="tw-p-4 tw-mt-4">
              <div className="tw-grid tw-gap-4">
                {allowedScenarios.map((scenario, index) => (
                  <ScenarioCard key={index} scenario={scenario} index={index} />
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
