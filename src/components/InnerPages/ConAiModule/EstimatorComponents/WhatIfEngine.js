/**
 * computeWhatIf
 *
 * @param {Array}  categories  - Full categories state from SimulatorDashboard
 * @param {Object} baseValues  - Dynamic values from fetchEstimationOverview API:
 *   {
 *     totalMaterialCost: overviewData.material_cost,
 *     totalLabourCost:   overviewData.labour_cost,
 *     totalDirectCost:   overviewData.direct_cost,
 *     totalBaseCost:     overviewData.base_cost,
 *   }
 */
export function computeWhatIf(categories, baseValues = {}) {
  console.log('baseValues', baseValues);
  // ── Dynamic base values from overview API ─────────────────────────────────
  const M = baseValues.totalMaterialCost ?? 0;
  const L = baseValues.totalLabourCost ?? 0;
  const TOTAL_BASE_COST = baseValues.totalBaseCost ?? 0;

  // ── Derived cost inputs ───────────────────────────────────────────────────
  //   Total Direct Costs = Total Material Cost + Total Labour Cost
  //   Contingency        = 10% of Direct Costs
  //   Overhead           = 8% of Direct Costs
  //   Total Markup Cost  = Contingency + Overhead
  const directCosts    = M + L;
  const contingency    = 0.10 * directCosts;
  const overhead       = 0.08 * directCosts;
  const totalMarkupCost = contingency + overhead;

  // ── Helper: get slider decimal from category + variable id ────────────────
  const pct = (catId, varId) => {
    const cat = categories.find((c) => c.id === catId);
    if (!cat) return 0;
    const v = cat.variables.find((vr) => vr.id === varId);
    // Slider value is already a signed integer (-50…+50), convert to decimal
    return v ? v.value / 100 : 0;
  };

  // ── Section 1: Labour & Productivity ─────────────────────────────────────
  //   Productivity Variance : Total Labour Cost × 0.122 × slider% × (−1)
  //   Labour Overtime Rate  : Total Labour Cost × 0.073 × slider% × (+1)
  //   Training Time Variance: Total Labour Cost × 0.049 × slider% × (+1)
  const productivityVariance    = L * 0.122 * pct("labor", "prod") * -1;
  const labourOvertimeRate      = L * 0.073 * pct("labor", "ot")   * +1;
  const trainingTimeVariance    = L * 0.049 * pct("labor", "train") * +1;
  const labourImpact = productivityVariance + labourOvertimeRate + trainingTimeVariance;

  // ── Section 2: Materials & Supplies ──────────────────────────────────────
  //   Material Cost Change       : Total Material Cost × 0.194 × slider% × (+1)
  //   Waste Reduction Variance   : Total Material Cost × 0.048 × slider% × (−1)
  //   Supplier Pricing Volatility: Total Material Cost × 0.081 × slider% × (+1)
  const materialCostChange        = M * 0.194 * pct("materials", "cost")  * +1;
  const wasteReductionVariance    = M * 0.048 * pct("materials", "waste") * -1;
  const supplierPricingVolatility = M * 0.081 * pct("materials", "vol")   * +1;
  const materialsImpact = materialCostChange + wasteReductionVariance + supplierPricingVolatility;

  // ── Section 3: Project Scope & Complexity ────────────────────────────────
  //   Project Volume Change    : (L × 0.122 + M × 0.161) × slider% × (+1)
  //   Takeoff Complexity Factor: (L × 0.037 + M × 0.048) × slider% × (+1)
  //   Project Size Variance    : (L × 0.085 + M × 0.113) × slider% × (+1)
  const projectVolumeChange     = (L * 0.122 + M * 0.161) * pct("project", "scope")      * +1;
  const takeoffComplexityFactor = (L * 0.037 + M * 0.048) * pct("project", "complexity") * +1;
  const projectSizeVariance     = (L * 0.085 + M * 0.113) * pct("project", "size")       * +1;
  const projectImpact = projectVolumeChange + takeoffComplexityFactor + projectSizeVariance;

  // ── Section 4: Process Efficiency ────────────────────────────────────────
  //   Takeoff Automation Gain  : Total Labour Cost × 0.110 × slider% × (−1)
  //   Collaboration Efficiency : Total Labour Cost × 0.073 × slider% × (−1)
  //   Review Cycle Time        : Total Labour Cost × 0.061 × slider% × (+1)
  const takeoffAutomationGain  = L * 0.110 * pct("process", "auto")   * -1;
  const collaborationEfficiency = L * 0.073 * pct("process", "collab") * -1;
  const reviewCycleTime         = L * 0.061 * pct("process", "review") * +1;
  const processImpact = takeoffAutomationGain + collaborationEfficiency + reviewCycleTime;

  // ── Section 5: Overhead & Market ─────────────────────────────────────────
  //   Overhead Rate Change : (L × 0.110 + M × 0.145) × slider% × (+1)
  //   Market Demand Shift  : (L × 0.085 + M × 0.113) × slider% × (+1)
  //   Estimator Cost Change: (L × 0.049 + M × 0.065) × slider% × (+1)
  const overheadRateChange  = (L * 0.110 + M * 0.145) * pct("overhead", "overhead")  * +1;
  const marketDemandShift   = (L * 0.085 + M * 0.113) * pct("overhead", "market")    * +1;
  const estimatorCostChange = (L * 0.049 + M * 0.065) * pct("overhead", "estimator") * +1;
  const overheadImpact = overheadRateChange + marketDemandShift + estimatorCostChange;

  // ── Section 6: Risk & Quality ─────────────────────────────────────────────
  //   Rework Rate Shift: (L × 0.024 + M × 0.032) × slider% × (+1)
  const reworkRateShift = (L * 0.024 + M * 0.032) * pct("risk", "risk") * +1;
  const riskImpact = reworkRateShift;

  // ── Overall ───────────────────────────────────────────────────────────────
  const simulatorAdjustment =
    labourImpact + materialsImpact + projectImpact +
    processImpact + overheadImpact + riskImpact;

  // Estimated Total Cost = MAX(
  //   (L × 0.40) + (M × 0.50) + Total Markup Cost,
  //   Base Cost + Simulator Adjustment
  // )
  const floorEstimate      = (L * 0.40) + (M * 0.50) + totalMarkupCost;
  const adjustedEstimate   = TOTAL_BASE_COST + simulatorAdjustment;
  const estimatedTotalCost = Math.max(floorEstimate, adjustedEstimate);
  const adjustmentPct = TOTAL_BASE_COST
    ? (simulatorAdjustment / TOTAL_BASE_COST) * 100
    : 0;

  // Budget status — note spec: Under Budget when estimatedTotal < baseCost
  let budgetStatus;
  if (estimatedTotalCost > TOTAL_BASE_COST)      budgetStatus = "Over Budget";
  else if (estimatedTotalCost < TOTAL_BASE_COST) budgetStatus = "Under Budget";
  else                                            budgetStatus = "On Budget";

  const budgetStatusColor =
    budgetStatus === "Over Budget"   ? "tw-bg-red-500"   :
    budgetStatus === "Under Budget"  ? "tw-bg-green-500" :
                                       "tw-bg-blue-500";

  // ── Formatters ────────────────────────────────────────────────────────────
  const fmt$ = (v) => {
    const abs = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Math.abs(v));
    return v >= 0 ? "+" + abs : "-" + abs;
  };

  const fmtBase$ = (v) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v);
  const fmtPct = (v) => (v >= 0 ? "+" : "-") + Math.abs(v).toFixed(2) + "%";

  return {
    // ── Summary cards ──────────────────────────────────────────────────────
    baseCost:             fmtBase$(TOTAL_BASE_COST),
    simulatorAdjustment:  fmt$(simulatorAdjustment),
    adjustmentPct:        fmtPct(adjustmentPct),
    adjustmentPctLabel:   adjustmentPct >= 0 ? "increase" : "decrease",
    estimatedTotalCost:   fmtBase$(estimatedTotalCost),
    budgetStatus,
    budgetStatusColor,

    // ── Impact grid (raw numbers for sign detection + formatting) ──────────
    impacts: {
      Labor:     labourImpact,
      Materials: materialsImpact,
      Project:   projectImpact,
      Process:   processImpact,
      Overhead:  overheadImpact,
      Risk:      riskImpact,
    },

    // ── Per-category dollar impact for CategorySection header badge ─────────
    categoryImpacts: {
      labor:     labourImpact,
      materials: materialsImpact,
      project:   projectImpact,
      process:   processImpact,
      overhead:  overheadImpact,
      risk:      riskImpact,
    },

    // ── Per-variable dollar impacts for SliderComponent display ────────────
    // Keyed as  variableImpacts[categoryId][varId] = dollarAmount
    variableImpacts: {
      labor: {
        prod:  productivityVariance,
        ot:    labourOvertimeRate,
        train: trainingTimeVariance,
      },
      materials: {
        cost:  materialCostChange,
        waste: wasteReductionVariance,
        vol:   supplierPricingVolatility,
      },
      project: {
        scope:      projectVolumeChange,
        complexity: takeoffComplexityFactor,
        size:       projectSizeVariance,
      },
      process: {
        auto:   takeoffAutomationGain,
        collab: collaborationEfficiency,
        review: reviewCycleTime,
      },
      overhead: {
        overhead:  overheadRateChange,
        market:    marketDemandShift,
        estimator: estimatorCostChange,
      },
      risk: {
        risk: reworkRateShift,
      },
    },
  };
}
