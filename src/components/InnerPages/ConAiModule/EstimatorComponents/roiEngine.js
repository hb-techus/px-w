/**
 * Takes the raw formData object (all values as strings from inputs)
 * and returns a fully computed results object.
 */
export function computeROI(formData) {
  // ── Parse all inputs to numbers ──────────────────────────────────────────
  const n = (key) => parseFloat(formData[key]) || 0;

  const hourlyCost = n("hourlyCost");
  const currentHours = n("currentHours");
  const expectedHours = n("expectedHours");
  const bidsPerMonth = n("bidsPerMonth");
  const bidWinRate = n("bidWinRate");
  const avgProjectValue = n("avgProjectValue");
  const profitMargin = n("profitMargin");
  const totalProjectsPerYear = n("totalProjectsPerYear");
  const annualMaterialSpend = n("annualMaterialSpend");
  const materialWasteReduction = n("materialWasteReduction");
  const currentReworkRate = n("currentReworkRate");
  const reworkReduction = n("reworkReduction");
  const avgReworkCostPerProject = n("avgReworkCostPerProject");
  const collabDelayPerTakeoff = n("collabDelayPerTakeoff");
  const collabImprovement = n("collabImprovement");
  const annualSoftwareCost = n("annualSoftwareCost");
  const implementationCost = n("implementationCost");
  const trainingCost = n("trainingCost");
  const annualSupportCost = n("annualSupportCost");

  const annualBids = bidsPerMonth * 12;

  // ── Section 2: Operational Metrics ──────────────────────────────────────
  // 2.1 Time Saved/Takeoff
  const timeSavedPerTakeoff =
    (currentHours - expectedHours) +
    (collabDelayPerTakeoff * collabImprovement / 100);

  // 2.2 Annual Hours Saved
  const annualHoursSaved = timeSavedPerTakeoff * annualBids;

  // 2.4 Additional Bids/Year
  const effectiveHoursPerBid =
    expectedHours + collabDelayPerTakeoff * (1 - collabImprovement / 100);
  const additionalBidsPerYear =
    effectiveHoursPerBid > 0 ? annualHoursSaved / effectiveHoursPerBid : 0;

  // 2.3 Additional Jobs Won
  const additionalJobsWon = additionalBidsPerYear * (bidWinRate / 100);

  // 2.5 Additional Revenue
  const additionalRevenue = additionalJobsWon * avgProjectValue;

  // ── Section 3: Cost Savings Breakdown ───────────────────────────────────
  // 3.1 Labour Cost Savings
  const labourCostSavings =
    (currentHours - expectedHours) * annualBids * hourlyCost;

  // 3.3 Collaboration Savings
  const collaborationSavings =
    (collabDelayPerTakeoff * collabImprovement / 100) * annualBids * hourlyCost;

  // 3.5 Rework Reduction
  const reworkReductionSavings =
    totalProjectsPerYear *
    (currentReworkRate / 100) *
    (reworkReduction / 100) *
    avgReworkCostPerProject;

  // 3.7 Material Waste Savings
  const materialWasteSavings = annualMaterialSpend * (materialWasteReduction / 100);

  // 3.9 Additional Annual Profit
  const additionalProfit = additionalRevenue * (profitMargin / 100);

  // 3.11 Total Annual Savings
  const totalAnnualSavings =
    labourCostSavings +
    collaborationSavings +
    reworkReductionSavings +
    materialWasteSavings +
    additionalProfit;

  // Percentages (guard divide-by-zero)
  const pct = (val) =>
    totalAnnualSavings > 0
      ? Math.round((val / totalAnnualSavings) * 1000) / 10
      : 0;

  const labourPct = pct(labourCostSavings);
  const collabPct = pct(collaborationSavings);
  const reworkPct = pct(reworkReductionSavings);
  const materialPct = pct(materialWasteSavings);
  const additionalPct = pct(additionalProfit);

  // ── Section 4: ROI Summary ───────────────────────────────────────────────
  // 4.2 Total Cost of Ownership
  const totalCostOfOwnership =
    annualSoftwareCost + implementationCost + trainingCost + annualSupportCost;

  // 4.3 Net Annual Benefit
  const netAnnualBenefit = totalAnnualSavings - totalCostOfOwnership;

  // 4.4 Net ROI %
  const netROIPct =
    totalCostOfOwnership > 0
      ? (netAnnualBenefit / totalCostOfOwnership) * 100
      : 0;

  // 4.5 ROI Multiplier
  const roiMultiplier =
    totalCostOfOwnership > 0
      ? totalAnnualSavings / totalCostOfOwnership
      : 0;

  // 4.6 Payback Period (weeks)
  const paybackPeriodWeeks =
    netAnnualBenefit > 0
      ? (totalCostOfOwnership / netAnnualBenefit) * 52
      : 0;

  // ── Section 5: 5-Year Projection ─────────────────────────────────────────
  const recurringCost = annualSoftwareCost + annualSupportCost;
  const annualNetRecurring = totalAnnualSavings - recurringCost;

  const year1 = netAnnualBenefit;
  const year2 = year1 + annualNetRecurring;
  const year3 = year2 + annualNetRecurring;
  const year4 = year3 + annualNetRecurring;
  const year5 = year4 + annualNetRecurring;

  // ── Formatters ────────────────────────────────────────────────────────────
  const fmt$ = (v) =>
    "$" +
    Math.round(v).toLocaleString("en-US");

  const fmtX = (v) => v.toFixed(1) + "x";
  const fmtHrs = (v) => v.toFixed(1) + " hrs";
  const fmtWks = (v) => v.toFixed(1);

  return {
    // ── Top Bar 1 (MultiplierCards) ──────────────────────────────────────
    roiMultiplier: fmtX(roiMultiplier),
    totalAnnualSavings: fmt$(totalAnnualSavings),
    paybackPeriod: fmtWks(paybackPeriodWeeks),
    netAnnualBenefit: fmt$(netAnnualBenefit),

    // ── Top Bar 2 (OperationalMetrics) ───────────────────────────────────
    timeSavedPerTakeoff: fmtHrs(timeSavedPerTakeoff),
    annualHoursSaved: Math.round(annualHoursSaved).toLocaleString("en-US") + " hrs",
    additionalBidsPerYear: Math.round(additionalBidsPerYear) + "/yr",
    additionalJobsWon: Math.round(additionalJobsWon) + "/yr",
    additionalRevenue: fmt$(additionalRevenue),

    // ── Cost Savings Breakdown ────────────────────────────────────────────
    costSavingsRows: [
      { label: "Labor Cost Savings", value: fmt$(labourCostSavings), pct: labourPct },
      { label: "Collaboration Savings", value: fmt$(collaborationSavings), pct: collabPct },
      { label: "Rework Reduction", value: fmt$(reworkReductionSavings), pct: reworkPct },
      { label: "Material Waste Savings", value: fmt$(materialWasteSavings), pct: materialPct },
      { label: "Additional Profit", value: fmt$(additionalProfit), pct: additionalPct },
    ],
    totalAnnualSavingsFormatted: fmt$(totalAnnualSavings),

    // ── ROI Summary ───────────────────────────────────────────────────────
    roiSummaryMetrics: [
      { id: 1, label: "Total Annual Savings", value: fmt$(totalAnnualSavings), style: "default" },
      { id: 2, label: "Net Annual Benefit", value: fmt$(netAnnualBenefit), style: "default" },
      { id: 3, label: "ROI Multiplier", value: fmtX(roiMultiplier), style: "badge" },
      { id: 4, label: "Total Cost of Ownership", value: fmt$(totalCostOfOwnership), style: "red" },
      { id: 5, label: "Net ROI", value: netROIPct.toFixed(1) + "%", style: "default" },
      { id: 6, label: "Total Payback Period", value: fmtWks(paybackPeriodWeeks) + " weeks", style: "default" },
    ],

    // ── 5-Year Projection ─────────────────────────────────────────────────
    projectionYears: [
      { id: 1, label: "Year 1", value: fmt$(year1) },
      { id: 2, label: "Year 2", value: fmt$(year2) },
      { id: 3, label: "Year 3", value: fmt$(year3) },
      { id: 4, label: "Year 4", value: fmt$(year4) },
      { id: 5, label: "Year 5", value: fmt$(year5) },
    ],
    fiveYearCumulative: fmt$(year5),
  };
}