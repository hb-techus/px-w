import React from "react";
import CollapsibleSection from "../../../../genriccomponents/CollapsibleSection";

// ─── Input Field ──────────────────────────────────────────────────────────────
const InputField = ({ label, value, setValue, suffix, type = "number", max, disabled }) => {
  const handleChange = (e) => {
    if (disabled) return;
    let val = e.target.value;
    if (type === "number" && max !== undefined && val !== "" && Number(val) > max) {
      val = String(max);
    }
    setValue(val);
  };

  return (
    <div className="tw-flex tw-flex-col tw-gap-1.5">
      <label className="tw-text-[13px] tw-font-normal tw-text-[#3b3b3b]">
        {label}*
      </label>
      <div className={`tw-relative tw-flex tw-items-center tw-border tw-border-gray-200 tw-rounded-lg tw-bg-white focus-within:tw-ring-2 focus-within:tw-ring-blue-500 tw-overflow-hidden${disabled ? " tw-opacity-60 tw-cursor-not-allowed" : ""}`}>
        <input
          type="number"
          value={value}
          onChange={handleChange}
          min={0}
          max={max}
          disabled={disabled}
          className="tw-w-full tw-p-3 tw-bg-transparent tw-outline-none tw-text-[15px] tw-text-[#3b3b3b]
               [appearance:textfield] [&::-webkit-outer-spin-button]:tw-appearance-none [&::-webkit-inner-spin-button]:tw-appearance-none
               disabled:tw-cursor-not-allowed"
        />
        <div className="tw-flex tw-items-center tw-shrink-0 tw-pr-2 tw-gap-1.5">
          {suffix && (
            <span className="tw-text-gray-400 tw-text-sm tw-whitespace-nowrap">{suffix}</span>
          )}
          <div className="tw-flex tw-flex-col">
            <button
              type="button"
              disabled={disabled}
              onClick={() => !disabled && handleChange({ target: { value: String(Number(value) + 1) } })}
              className="tw-text-gray-500 hover:tw-text-gray-700 tw-transition-colors disabled:tw-cursor-not-allowed"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="tw-w-2.5 tw-h-2.5" viewBox="0 0 24 24">
                <polygon points="12,5 22,19 2,19" fill="currentColor" />
              </svg>
            </button>
            <button
              type="button"
              disabled={disabled}
              onClick={() => !disabled && handleChange({ target: { value: String(Number(value) - 1) } })}
              className="tw-text-gray-500 hover:tw-text-gray-700 tw-transition-colors disabled:tw-cursor-not-allowed"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="tw-w-2.5 tw-h-2.5" viewBox="0 0 24 24">
                <polygon points="12,19 22,5 2,5" fill="currentColor" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Select Field — exact same wrapper classes as original InputField ─────────
const SelectField = ({ label, value, onChange, options, disabled }) => (
  <div className="tw-flex tw-flex-col tw-gap-1.5">
    <label className="tw-text-[13px] tw-font-normal tw-text-[#3b3b3b]">
      {label}
    </label>
    <div className={`tw-relative tw-flex tw-items-center tw-border tw-border-gray-200 tw-rounded-lg tw-bg-white focus-within:tw-ring-2 focus-within:tw-ring-blue-500 tw-overflow-hidden${disabled ? " tw-opacity-60 tw-cursor-not-allowed" : ""}`}>
      <select
        value={value}
        onChange={(e) => !disabled && onChange(e.target.value)}
        disabled={disabled}
        className="tw-w-full tw-p-3 tw-pr-8 tw-bg-transparent tw-outline-none tw-text-[15px] tw-text-[#3b3b3b] tw-appearance-none disabled:tw-cursor-not-allowed"
      >
        {options.map((opt) => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
      <div className="tw-absolute tw-right-3 tw-pointer-events-none tw-flex tw-items-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="tw-w-3 tw-h-3 tw-text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <polyline points="6,9 12,15 18,9" />
        </svg>
      </div>
    </div>
  </div>
);

// ─── Section Icon ─────────────────────────────────────────────────────────────
const SectionIcon = ({ iconClass, colorClass }) => (
  <div className="tw-p-2 tw-rounded-[6px] tw-bg-opacity-10 tw-flex tw-items-center tw-justify-center">
    <i className={`${iconClass} ${colorClass} tw-text-[20px]`}></i>
  </div>
);

// ─── Exports ──────────────────────────────────────────────────────────────────
export const COMPANY_TYPES = [
  "General Contractor",
  "Subcontractor / Specialty Contractor",
  "Design-Build Firm",
  "Engineering Firm",
  "Construction Manager",
  "Estimating Consultant",
];

export const INITIAL_FORM_DATA = {
  companyType: "General Contractor",
  revenue: "12000000",
  employees: "30",
  estimators: "2",
  managers: "4",

  hourlyCost: "65",
  currentHours: "10",
  expectedHours: "7",
  bidsPerMonth: "12",

  bidWinRate: "18",
  avgProjectValue: "250000",
  profitMargin: "8",
  totalProjectsPerYear: "48",

  annualMaterialSpend: "4800000",
  materialWasteReduction: "3",
  wasteCostPerProject: "8000",

  currentReworkRate: "8",
  reworkReduction: "25",
  avgReworkCostPerProject: "6000",

  collabDelayPerTakeoff: "1.5",
  collabImprovement: "35",

  annualSoftwareCost: "18000",
  implementationCost: "6000",
  trainingCost: "8000",
  annualSupportCost: "4000",
};

// ─── Main Component ───────────────────────────────────────────────────────────
const FormSections = ({ formData, setFormData, canExecute = true }) => {
  const set = (key) => (val) =>
    setFormData((prev) => ({ ...prev, [key]: val }));

  const disabled = !canExecute;

  return (
    <div className="tw-relative">
      <div className="tw-columns-1 lg:tw-columns-2 tw-gap-6 tw-space-y-6">

        {/* LEFT */}
        <div className="tw-break-inside-avoid">
          <CollapsibleSection
            title="Company Information"
            badge="5 fields"
            subtitle="Basic company details and team structure"
            icon={<SectionIcon iconClass="icon-Concrete" colorClass="tw-text-blue-600" />}
            iconBg="tw-bg-blue-50"
            defaultExpanded={true}
            borderColor="tw-border-l-4 tw-border-l-[#4488ff]"
          >
            <div className="tw-grid tw-grid-cols-2 tw-gap-4 tw-mt-3">
              <SelectField
                label="Company Type"
                value={formData.companyType}
                onChange={set("companyType")}
                options={COMPANY_TYPES}
                disabled={disabled}
              />
              <InputField label="Annual Company Revenue" value={formData.revenue} setValue={set("revenue")} suffix="$" disabled={disabled} />
              <InputField label="Total Number of Employees" value={formData.employees} setValue={set("employees")} disabled={disabled} />
              <InputField label="Number of Estimators" value={formData.estimators} setValue={set("estimators")} disabled={disabled} />
              <InputField label="Number of Project Managers" value={formData.managers} setValue={set("managers")} disabled={disabled} />
            </div>
          </CollapsibleSection>
        </div>

        {/* RIGHT TOP */}
        <CollapsibleSection
          title="Cost & Time Parameters"
          badge="4 fields"
          subtitle="Current estimation process metrics"
          icon={<SectionIcon iconClass="icon-Timeline" colorClass="tw-text-amber-500" />}
          iconBg="tw-bg-amber-50"
          defaultExpanded={true}
          borderColor="tw-border-l-4 tw-border-l-amber-500"
        >
          <div className="tw-grid tw-grid-cols-2 tw-gap-4 tw-mt-3">
            <InputField label="Avg Estimator Hourly Cost" value={formData.hourlyCost} setValue={set("hourlyCost")} suffix="$/hr" disabled={disabled} />
            <InputField label="Current Hours per Takeoff" value={formData.currentHours} setValue={set("currentHours")} suffix="hrs" disabled={disabled} />
            <InputField label="Expected Hours (With Software)" value={formData.expectedHours} setValue={set("expectedHours")} suffix="hrs" disabled={disabled} />
            <InputField label="Takeoffs / Bids per Month" value={formData.bidsPerMonth} setValue={set("bidsPerMonth")} disabled={disabled} />
          </div>
        </CollapsibleSection>

        {/* RIGHT BOTTOM */}
        <CollapsibleSection
          title="Project Metrics"
          badge="4 fields"
          subtitle="Project performance and financial metrics"
          icon={<SectionIcon iconClass="icon-project-metrics" colorClass="tw-text-emerald-500" />}
          iconBg="tw-bg-emerald-50"
          defaultExpanded={true}
          borderColor="tw-border-l-4 tw-border-l-[#0d9b54]"
        >
          <div className="tw-grid tw-grid-cols-2 tw-gap-4 tw-mt-3">
            <InputField label="Bid Win Rate" value={formData.bidWinRate} setValue={set("bidWinRate")} suffix="%" max={100} disabled={disabled} />
            <InputField label="Average Project Value" value={formData.avgProjectValue} setValue={set("avgProjectValue")} suffix="$" disabled={disabled} />
            <InputField label="Profit Margin" value={formData.profitMargin} setValue={set("profitMargin")} suffix="%" max={100} disabled={disabled} />
            <InputField label="Total Projects per Year" value={formData.totalProjectsPerYear} setValue={set("totalProjectsPerYear")} disabled={disabled} />
          </div>
        </CollapsibleSection>

        {/* NEXT ROW LEFT */}
        <CollapsibleSection
          title="Material & Waste"
          badge="3 fields"
          subtitle="Material costs and waste reduction potential"
          icon={<SectionIcon iconClass="icon-material-budget" colorClass="tw-text-rose-500" />}
          iconBg="tw-bg-rose-50"
          defaultExpanded={true}
          borderColor="tw-border-l-4 tw-border-l-[#ff4444]"
        >
          <div className="tw-grid tw-grid-cols-2 tw-gap-4 tw-mt-3">
            <InputField label="Annual Material Spend" value={formData.annualMaterialSpend} setValue={set("annualMaterialSpend")} suffix="$" disabled={disabled} />
            <InputField label="Material Waste Reduction" value={formData.materialWasteReduction} setValue={set("materialWasteReduction")} suffix="%" max={100} disabled={disabled} />
            <InputField label="Waste Cost per Project" value={formData.wasteCostPerProject} setValue={set("wasteCostPerProject")} suffix="$" disabled={disabled} />
          </div>
        </CollapsibleSection>

        {/* NEXT ROW RIGHT */}
        <CollapsibleSection
          title="Rework & Quality"
          badge="3 fields"
          subtitle="Current rework rates and improvement potential"
          icon={<SectionIcon iconClass="icon-rework-quality" colorClass="tw-text-purple-500" />}
          defaultExpanded={true}
          iconBg="tw-bg-purple-50"
          borderColor="tw-border-l-4 tw-border-l-[#674fde]"
        >
          <div className="tw-grid tw-grid-cols-2 tw-gap-4 tw-mt-3">
            <InputField label="Current Rework Rate" value={formData.currentReworkRate} setValue={set("currentReworkRate")} suffix="%" max={100} disabled={disabled} />
            <InputField label="Rework Reduction" value={formData.reworkReduction} setValue={set("reworkReduction")} suffix="%" max={100} disabled={disabled} />
            <InputField label="Avg Rework Cost per Project" value={formData.avgReworkCostPerProject} setValue={set("avgReworkCostPerProject")} suffix="$" disabled={disabled} />
          </div>
        </CollapsibleSection>

        {/* NEXT ROW LEFT */}
        <CollapsibleSection
          title="Team Collaboration"
          badge="2 fields"
          subtitle="Collaboration efficiency and improvements"
          icon={<SectionIcon iconClass="icon-Proposal-stage" colorClass="tw-text-indigo-600" />}
          defaultExpanded={true}
          iconBg="tw-bg-indigo-50"
          borderColor="tw-border-l-4 tw-border-l-indigo-600"
        >
          <div className="tw-grid tw-grid-cols-2 tw-gap-4 tw-mt-3">
            <InputField label="Collaboration Delay per Takeoff" value={formData.collabDelayPerTakeoff} setValue={set("collabDelayPerTakeoff")} suffix="hrs" disabled={disabled} />
            <InputField label="Collaboration Improvement" value={formData.collabImprovement} setValue={set("collabImprovement")} suffix="%" max={100} disabled={disabled} />
          </div>
        </CollapsibleSection>
      </div>

      {/* FULL WIDTH */}
      <div className="lg:tw-col-span-2 tw-mt-6">
        <CollapsibleSection
          title="Software Cost Inputs"
          badge="4 fields"
          subtitle="Licensing, implementation, and ongoing software costs"
          icon={<SectionIcon iconClass="icon-Software-cost-inputs" colorClass="tw-text-sky-600" />}
          iconBg="tw-bg-sky-50"
          defaultExpanded={true}
          borderColor="tw-border-l-4 tw-border-l-sky-600"
        >
          <div className="tw-grid tw-grid-cols-2 lg:tw-grid-cols-4 tw-gap-4 tw-mt-3">
            <InputField label="Annual Software License Cost" value={formData.annualSoftwareCost} setValue={set("annualSoftwareCost")} suffix="$" disabled={disabled} />
            <InputField label="One-time Implementation Cost" value={formData.implementationCost} setValue={set("implementationCost")} suffix="$" disabled={disabled} />
            <InputField label="Training Cost" value={formData.trainingCost} setValue={set("trainingCost")} suffix="$" disabled={disabled} />
            <InputField label="Annual Support / Integration Cost" value={formData.annualSupportCost} setValue={set("annualSupportCost")} suffix="$" disabled={disabled} />
          </div>
        </CollapsibleSection>
      </div>
    </div>
  );
};

export default FormSections;