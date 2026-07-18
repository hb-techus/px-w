import React, { useState, useMemo, useEffect, useCallback } from 'react';
import SummaryCards from './SummaryCards';
import ImpactGrid from './ImpactGrid';
import CategorySection from './CategorySection';
import SliderComponent from './SliderComponent';
import { computeWhatIf } from './WhatIfEngine';
import { GeneratePdf, fetchEstimationOverview } from '../../../../services/techus-services';
import { getPdfAssets } from '../../../../utils/pdfAssets';
import { getDeviceInfo } from '../../../../utils/getDeviceInfo';
import FullPageLoader from '../../../../genriccomponents/loaders/FullPageLoader';
import usePermissions from '../../../Common/usePermissions';
import CONFIG from '../../../../config/config';
import { useSelector } from 'react-redux';

const StyleMap = {
  Labor:    { icon: "icon-labor-budget",    iconBg: "tw-bg-blue-50",   iconColor: "tw-text-blue-500",  borderColor: "tw-border-l-blue-500"  },
  Materials:{ icon: "icon-material-budget", iconBg: "tw-bg-orange-50", iconColor: "tw-text-orange-500",borderColor: "tw-border-l-orange-500"},
  Project:  { icon: "icon-Concrete",        iconBg: "tw-bg-green-50",  iconColor: "tw-text-green-500", borderColor: "tw-border-l-green-600" },
  Process:  { icon: "icon-process",         iconBg: "tw-bg-red-50",    iconColor: "tw-text-red-500",   borderColor: "tw-border-l-red-500"   },
  Overhead: { icon: "icon-Fee",             iconBg: "tw-bg-purple-50", iconColor: "tw-text-purple-500",borderColor: "tw-border-l-purple-500"},
  Risk:     { icon: "icon-Timeline",        iconBg: "tw-bg-blue-50",   iconColor: "tw-text-blue-900",  borderColor: "tw-border-l-blue-900"  },
};

const INITIAL_CATEGORIES = [
  {
    id: "labor", title: "Labor & Productivity", iconKey: "Labor",
    variables: [
      { id: "prod",  label: "Productivity Variance",    value: 0 },
      { id: "ot",    label: "Labor Overtime Rate",       value: 0 },
      { id: "train", label: "Training Time Variance",    value: 0 },
    ],
  },
  {
    id: "materials", title: "Materials & Supplies", iconKey: "Materials",
    variables: [
      { id: "cost",  label: "Material Cost Change",         value: 0 },
      { id: "waste", label: "Waste Reduction Variance",      value: 0 },
      { id: "vol",   label: "Supplier Pricing Volatility",   value: 0 },
    ],
  },
  {
    id: "project", title: "Project Scope & Complexity", iconKey: "Project",
    variables: [
      { id: "scope",      label: "Project Volume Change",    value: 0 },
      { id: "complexity", label: "Takeoff Complexity Factor",value: 0 },
      { id: "size",       label: "Project Size Variance",    value: 0 },
    ],
  },
  {
    id: "process", title: "Process Efficiency", iconKey: "Process",
    variables: [
      { id: "auto",   label: "Takeoff Automation Gain",  value: 0 },
      { id: "collab", label: "Collaboration Efficiency", value: 0 },
      { id: "review", label: "Review Cycle Time",        value: 0 },
    ],
  },
  {
    id: "overhead", title: "Overhead & Market", iconKey: "Overhead",
    variables: [
      { id: "overhead",  label: "Overhead Rate Change",  value: 0 },
      { id: "market",    label: "Market Demand Shift",   value: 0 },
      { id: "estimator", label: "Estimator Cost Change", value: 0 },
    ],
  },
  {
    id: "risk", title: "Risk & Quality", iconKey: "Risk",
    variables: [
      { id: "risk", label: "Rework Rate Shift", value: 0 },
    ],
  },
];

const triggerDownload = (arrayBuffer, filename) => {
  const blob = new Blob([arrayBuffer], { type: 'application/pdf' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = filename; a.style.display = 'none'; a.rel = 'noopener noreferrer';
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 5000);
};

export default function SimulatorDashboard() {
  const [categories, setCategories] = useState(INITIAL_CATEGORIES);
  const [exporting, setExporting]   = useState(false);
  const [baseValues, setBaseValues] = useState(null);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);

  const organizationImage = useSelector((s) => s?.auth?.user?.[0]?.organization_image);

  const remoteImageUrl = organizationImage
    ? `${CONFIG.VITE_AWS_ENDPOINT}/organization_images/${organizationImage}`
    : `${CONFIG.VITE_AWS_ENDPOINT}/organization_images/logo.png`;

  // ── Permission: execute controls whether sliders can be moved ─────────────
  const { permissions: whatIfPerms } = usePermissions('what_if_modeler', 'estimate_builder');
  const canExecute = whatIfPerms?.execute !== false;

  // ── Load base values ──────────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      const organization_uuid = localStorage.getItem("organization_uuid");
      const project_uuid      = localStorage.getItem("project_uuid");
      try {
        setLoading(true);
        const res = await fetchEstimationOverview({
          organization_uuid, project_uuid, device_info: getDeviceInfo(),
        });
        if (!res?.valid) throw new Error(res?.message || "Invalid response");
        const d = res.data ?? {};
        console.log('d',d);
        setBaseValues({
          totalMaterialCost: d.material_cost  ?? 0,
          totalLabourCost:   d.labour_cost    ?? 0,
          totalDirectCost:   d.direct_cost    ?? 0,
          totalBaseCost:     d.base_cost_with_wastage     ?? 0,
        });
      } catch (err) {
        console.error("SimulatorDashboard overview fetch error:", err);
        setError("Failed to load estimation data.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const results = useMemo(
    () => computeWhatIf(categories, baseValues ?? {}),
    [categories, baseValues]
  );

  // ── Slider handlers ───────────────────────────────────────────────────────
  const handleSliderChange = useCallback((categoryId, varId, newValue) => {
    setCategories((prev) =>
      prev.map((cat) =>
        cat.id !== categoryId ? cat : {
          ...cat,
          variables: cat.variables.map((v) =>
            v.id === varId ? { ...v, value: newValue } : v
          ),
        }
      )
    );
  }, []);

  const handleReset = useCallback((categoryId) =>
    setCategories((prev) =>
      prev.map((cat) =>
        cat.id !== categoryId ? cat : {
          ...cat,
          variables: cat.variables.map((v) => ({ ...v, value: 0 })),
        }
      )
    ), []);

  const handleResetAll = useCallback(() => setCategories(INITIAL_CATEGORIES), []);

  const handleExport = async () => {
    setExporting(true);
    try {
      const { coverBg } = await getPdfAssets();
      const payload = {
        type: 'whatif',
        companyName: 'ACME INC.',
        coverBg,
        remoteImageUrl,
        baseCost:             results.baseCost,
        simulatorAdjustment:  results.simulatorAdjustment,
        adjustmentPct:        results.adjustmentPct,
        adjustmentPctLabel:   results.adjustmentPctLabel,
        estimatedTotalCost:   results.estimatedTotalCost,
        budgetStatus:         results.budgetStatus,
        impacts:              results.impacts,
        categoryImpacts:      results.categoryImpacts,
        variableImpacts:      results.variableImpacts,
        categories,
        footerNote: 'This report is powered by PrexoAI.',
      };
      const arrayBuffer = await GeneratePdf(payload);
      triggerDownload(arrayBuffer, 'Whatif-Modeler-Report.pdf');
    } catch (err) {
      console.error('What-if PDF export failed:', err);
    } finally {
      setExporting(false);
    }
  };

  if (loading) return <FullPageLoader />;
  if (error)   return <div className="tw-p-6 tw-text-red-500">{error}</div>;

  return (
    <div className="tw-h-screen tw-flex tw-flex-col tw-overflow-hidden">

      {/* Fixed top area */}
      <div className="tw-flex-shrink-0 tw-z-20 tw-border-b tw-border-slate-200">
        <div className="tw-pb-2">
          <SummaryCards
            results={results}
            onResetAll={handleResetAll}
            onExport={handleExport}
            exporting={exporting}
          />
          <ImpactGrid impacts={results.impacts} />
        </div>
      </div>

      {/* Scrollable bottom area */}
      <div className="tw-flex-1 tw-overflow-y-auto tw-p-4">
        <div className="tw-columns-1 lg:tw-columns-2 tw-gap-6 tw-space-y-6">
          {categories.map((cat) => {
            const styles     = StyleMap[cat.iconKey] || StyleMap.Labor;
            const impact     = results.categoryImpacts[cat.id] ?? 0;
            const varImpacts = results.variableImpacts?.[cat.id] ?? {};

            return (
              <div key={cat.id} className="tw-break-inside-avoid tw-mb-6">
                <CategorySection
                  title={cat.title}
                  icon={styles.icon}
                  iconColor={styles.iconColor}
                  iconBg={styles.iconBg}
                  borderColor={styles.borderColor}
                  impact={impact}
                  onReset={() => handleReset(cat.id)}
                  variableCount={cat.variables.length}
                >
                  {cat.variables.map((v) => (
                    <SliderComponent
                      key={v.id}
                      label={v.label}
                      value={v.value}
                      impact={varImpacts[v.id]}
                      onChange={(val) => handleSliderChange(cat.id, v.id, val)}
                      canExecute={canExecute}
                    />
                  ))}
                </CategorySection>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}