import React, { useMemo, useState, useEffect } from "react";
import {
  Package, Users, DollarSign, TrendingUp
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";
import { normalizeCategory, fmt$, yFmt, buildChartData } from "./estimationUtils";
import {
  fetchEstimationOverview,
  fetchEstimationMaterial,
  fetchEstimationLabour,
} from "../../../../services/techus-services";
import { getDeviceInfo } from "../../../../utils/getDeviceInfo";
import FullPageLoader from "../../../../genriccomponents/loaders/FullPageLoader";
import TextWithTooltip from "../../../Common/ToolTip";

/* ─── Icons for all 14 takeoffs ─────────────────────────────────────── */
const ICON_MAP = {
  Flooring: 'icon-flooring0',
  Ceiling: 'icon-ceiling-new0',
  Painting: 'icon-Painting0',
  Drywall: 'icon-Drywall0',
  Roofing: 'icon-roofing0',
  Concrete: 'icon-Concrete0',
  Siding: 'icon-siding-new0',
  Masonry: 'icon-masonry0',
  "Doors & Windows": 'icon-doors0',
  Mechanical: 'icon-Mechanic0',
  Electrical: 'icon-Electrical0',
  Plumbing: 'icon-Plumbing0',
  HVAC: 'icon-HVAC0',
  Steel: 'icon-Steel0',
};
const getCatIcon = (name, size = 16) => {
  const cls = ICON_MAP[name];
  if (cls) return <i className={cls} style={{ fontSize: size, lineHeight: 1, display: 'inline-block', verticalAlign: 'middle' }} />;
  return <Package size={size} />;
};

/* ─── Empty state component ─────────────────────────────────────────── */
const EmptyState = ({ message = "No data available" }) => (
  <div className="tw-flex tw-flex-col tw-items-center tw-justify-center tw-h-full tw-gap-2 tw-py-8">
    <div className="tw-w-10 tw-h-10 tw-rounded-full tw-bg-slate-100 tw-flex tw-items-center tw-justify-center">
      <Package size={20} className="tw-text-slate-400" />
    </div>
    <p className="tw-text-[13px] tw-text-slate-400 tw-font-medium">{message}</p>
  </div>
);

/* ═══════════════════════════════════════════════════════════════════════ */
export default function EstimatorOverview() {
  const [loading, setLoading] = useState(true);
  const [overviewData, setOverviewData] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [error, setError] = useState(null);
console.log('chartData',chartData)
  useEffect(() => {
    const load = async () => {
      const organization_uuid = localStorage.getItem("organization_uuid");
      const project_uuid = localStorage.getItem("project_uuid");
      const payload = { organization_uuid, project_uuid, device_info: getDeviceInfo() };

      try {
        setLoading(true);
        const [overviewRes, materialRes, labourRes] = await Promise.all([
          fetchEstimationOverview(payload),
          fetchEstimationMaterial(payload),
          fetchEstimationLabour(payload),
        ]);

        if (overviewRes?.valid) setOverviewData(overviewRes.data);

        const materialFlat = (materialRes?.data?.groups ?? []).flatMap((g) =>
          (g.items || []).map((item) => ({ ...item, takeoff_name: g.label }))
        );
        const labourFlat = (labourRes?.data?.groups ?? []).flatMap((g) =>
          (g.rows || []).map((row) => ({ ...row, takeoff_name: g.label }))
        );
        setChartData(buildChartData(materialFlat, labourFlat));

      } catch (err) {
        console.error("EstimatorOverview fetch error:", err);
        setError("Failed to load estimation data.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  /* ── Derived values from overview API ── */
  const matTotal = overviewData?.material_cost_with_wastage ?? 0;
  const labTotal = overviewData?.labour_cost ?? 0;
  const total = overviewData?.direct_cost_with_wastage ?? 0;
  const contingency = overviewData?.contingency_cost_with_wastage ?? 0;
  const overhead = overviewData?.overhead_cost_with_wastage ?? 0;
  const grand = overviewData?.base_cost_with_wastage ?? 0;
  const matPct = overviewData?.material_percentage_with_wastage ?? 0;
  const labPct = overviewData?.labour_percentage_with_wastage ?? 0;
  const contingencyPct = overviewData?.contingency_percentage ?? 0;
  const overheadPct = overviewData?.overhead_percentage ?? 0;

  const topTakeoffs = useMemo(() =>
    (overviewData?.top_takeoffs ?? []).map((t) => {
      const name = normalizeCategory(t.takeoff_name);
      return {
        name: name.toLowerCase() === 'unknown' ? 'Others' : name,
        totalCost: t.total_cost_with_wastage,
        pct: t.percentage_with_wastage,
      };
    }),
    [overviewData]);

  /* ── Pie data — only include slices with value > 0 ── */
  const pieData = useMemo(() => {
    const all = [
      { name: "Material", value: matTotal, color: "#1476FF" },
      { name: "Labor", value: labTotal, color: "#f97415" },
    ];
    return all.filter((d) => d.value > 0);
  }, [matTotal, labTotal]);

  const hasPieData = pieData.length > 0;
  const hasChartData = chartData.length > 0;

  /* ── Dynamic Y-axis domain for bar chart ── */
  const yAxisDomain = useMemo(() => {
    if (!hasChartData) return [0, 100];

    const allValues = chartData.flatMap((d) => [d.material, d.labor]);
    const maxVal = Math.max(...allValues, 1);

    let step = 10;

    if (maxVal <= 100) step = 10;
    else if (maxVal <= 1000) step = 100;
    else if (maxVal <= 10000) step = 1000;
    else if (maxVal <= 50000) step = 5000;
    else if (maxVal <= 100000) step = 5000;
    else step = 10000;

    const ceiling = Math.ceil(maxVal / step) * step;

    return [0, ceiling];
  }, [chartData, hasChartData]);

  /* ── Equal Y-axis ticks ── */
  const yAxisTicks = useMemo(() => {
    const max = yAxisDomain[1];
    const sections = 5; // creates 6 labels including 0
    const interval = max / sections;

    return Array.from({ length: sections + 1 }, (_, i) =>
      Math.round(interval * i)
    );
  }, [yAxisDomain]);

  const summaryCards = [
    { label: "Material Budget", value: matTotal, sub: matPct === 0 ? null : `${matPct}% of total`, icon: <Package size={20} className="tw-text-[#3c82f5]" />, ring: "tw-bg-[#d6e6ff]" },
    { label: "Labor Budget", value: labTotal, sub: labPct === 0 ? null : `${labPct}% of total`, icon: <Users size={20} className="tw-text-[#5856d6]" />, ring: "tw-bg-[#e6e6ff]" },
    { label: "Total Project Cost", value: total, sub: "Direct costs only", icon: <DollarSign size={20} className="tw-text-[#34c759]" />, ring: "tw-bg-[#defde6]" },
    { label: "Total w/ Markup", value: grand, sub: (contingencyPct === 0 && overheadPct === 0) ? null : `${contingencyPct > 0 ? "+" : ""}${contingencyPct}% Cont. ${overheadPct > 0 ? "+" : ""}${overheadPct}% OH`, icon: <TrendingUp size={20} className="tw-text-[#ff9500]" />, ring: "tw-bg-[#ffebce]" },
  ];

  if (loading) return <FullPageLoader />;
  if (error) return <div className="tw-p-6 tw-text-red-500">{error}</div>;

  return (
    <div className="tw-p-1 tw-flex tw-flex-col tw-gap-6">
      <div>
        <div className="tw-flex tw-items-center tw-gap-2">
          <span className="tw-text-[19px] tw-text-gray-600 tw-font-medium">Estimate Builder</span>
          <i className="icon-Save-and-Continue" />
          <span className="tw-text-[19px] tw-font-bold tw-text-gray-900">Dashboard</span>
        </div>
        <p className="tw-text-[#1e293b] tw-text-[13px]">A consolidated view of material costs, labor budgets, markups, and budget breakdowns across all takeoffs.</p>
      </div>
      {/* ── Summary Cards ── */}
      <div className="tw-grid tw-grid-cols-2 tw-gap-4 lg:tw-grid-cols-4 tw-mb-1">
        {summaryCards.map(({ label, value, sub, icon, ring }) => (
          <div key={label} className="tw-bg-white tw-border tw-border-slate-200 tw-rounded-xl tw-pt-5 tw-px-5 tw-pb-4 tw-shadow-sm hover:tw-shadow-md hover:tw-border-blue-300 tw-transition-all">
            <div className="tw-flex tw-items-start tw-justify-between">
              <div>
                <p className="tw-text-[14px] tw-font-medium">{label}</p>
                <p className="tw-text-[26px] tw-font-semibold tw-mt-1">{value === 0 ? "-" : fmt$(value)}</p>
                {sub && <p className="tw-text-[13px] tw-text-[#999999] tw-mt-1">{sub}</p>}
              </div>
              <div className={`tw-p-2 tw-rounded-lg ${ring}`}>{icon}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Three-column row ── */}
      <div className="tw-grid tw-grid-cols-1 tw-gap-6 lg:tw-grid-cols-3">

        {/* Top 5 Takeoffs */}
      <div className="tw-bg-white tw-border tw-border-slate-200 tw-rounded-xl tw-shadow-sm hover:tw-shadow-md hover:tw-border-blue-300 tw-transition-all">
  <div className="tw-flex tw-items-center tw-gap-2 tw-px-5 tw-pt-5 tw-pb-3">
    <i  className="icon-Products tw-text-blue-600 tw-text-[19px]" />
    <span className="tw-text-[16px] tw-font-bold tw-text-[#002149]">Top 5 Takeoffs by Cost</span>
  </div>
  {topTakeoffs.length === 0 ? (
    <div className="tw-h-72 tw-px-4 tw-pb-5">
      <EmptyState message="No takeoff data found" />
    </div>
  ) : (
    <div className="tw-px-4 tw-pb-5">
      <table className="tw-w-full tw-border-collapse tw-table-fixed">
        <tbody>
          {topTakeoffs.map((t, i) => (
            <tr key={i} className="hover:tw-bg-slate-50 tw-transition-colors">
              <td className={`tw-px-3 tw-py-4 tw-align-middle tw-w-[50%] ${i < topTakeoffs.length - 1 ? "tw-border-b tw-border-slate-200" : ""}`}>
                <div className="tw-flex tw-items-center tw-gap-2">
                  <span className="tw-text-blue-500 tw-shrink-0 tw-flex tw-items-center">{getCatIcon(t.name, 16)}</span>
                  <span className="tw-text-[13px] tw-font-semibold tw-text-slate-800 tw-leading-5 tw-break-words">{t.name}</span>
                </div>
              </td>
              <td className={`tw-px-3 tw-py-4 tw-text-center tw-align-middle tw-w-[28%] tw-overflow-hidden ${i < topTakeoffs.length - 1 ? "tw-border-b tw-border-slate-200" : ""}`}>
                <TextWithTooltip
                  text={fmt$(t.totalCost)}
                  width="100%"
                  className="tw-text-[12px] tw-font-medium tw-text-slate-800"
                />
              </td>
              <td className={`tw-px-3 tw-py-4 tw-text-center tw-align-middle tw-w-[22%] ${i < topTakeoffs.length - 1 ? "tw-border-b tw-border-slate-200" : ""}`}>
                <span className="tw-inline-flex tw-items-center tw-justify-center tw-px-2 tw-py-1 tw-rounded-full tw-bg-[#f2f2f4] tw-text-[12px] tw-font-semibold tw-text-slate-700 tw-whitespace-nowrap tw-max-w-full">
                  {Number(t.pct).toFixed(1)}%
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )}
</div>

        {/* Pie Chart — Budget Breakdown */}
        <div className="tw-bg-white tw-border tw-border-slate-200 tw-rounded-xl tw-shadow-sm hover:tw-shadow-md hover:tw-border-blue-300 tw-transition-all">
          <div className="tw-flex tw-items-center tw-justify-between tw-px-4 tw-pt-5 tw-pb-2">
            <span className="tw-text-[16px] tw-font-bold tw-text-[#002149]">Budget Breakdown</span>
          </div>

          {!hasPieData ? (
            <div className="tw-h-72 tw-px-4 tw-pb-5">
              <EmptyState message="No budget data available" />
            </div>
          ) : (
            <>
              <div className="tw-px-4 tw-pb-2">
                <div className="tw-h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart
                      // ── FIX: remove focus outline ──
                      style={{ outline: "none" }}
                    >
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={70}
                        outerRadius={110}
                        paddingAngle={5}
                        dataKey="value"
                        // ── FIX: remove focus outline on slices ──
                        style={{ outline: "none" }}
                      >
                        {pieData.map((e, i) => (
                          <Cell key={i} fill={e.color} style={{ outline: "none" }} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(v) => fmt$(v)}
                        contentStyle={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13 }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
              {/* Dynamic legend — only shows slices that exist */}
              <div className="tw-flex tw-items-center tw-justify-center tw-gap-6 tw-pb-5 tw-pt-1">
                {pieData.map((d) => (
                  <div key={d.name} className="tw-flex tw-items-center tw-gap-1.5">
                    <div className="tw-w-2.5 tw-h-2.5 tw-rounded-full" style={{ background: d.color }} />
                    <span className="tw-text-[15px] tw-text-[#999999]">{d.name}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Cost Summary */}
        <div className="tw-bg-white tw-border tw-border-slate-200 tw-rounded-xl tw-shadow-sm hover:tw-shadow-md hover:tw-border-blue-300 tw-transition-all">
          <div className="tw-px-4 tw-pt-5 tw-pb-2 tw-text-[16px] tw-font-bold tw-text-[#002149]">Cost Summary</div>
          {total === 0 && contingency === 0 && overhead === 0 && grand === 0 ? (
    <div className="tw-h-72 tw-px-4 tw-pb-5">
      <EmptyState message="No cost summary available" />
    </div>
  ) : (
          <div className="tw-px-4 tw-pb-4 tw-flex tw-flex-col">
            {[
              { label: "Direct Costs", value: total },
              { label: `Contingency (${contingencyPct}%)`, value: contingency },
              { label: `Overhead (${overheadPct}%)`, value: overhead },
            ].map(({ label, value }) => (
              <div key={label} className="tw-flex tw-items-center tw-justify-between tw-py-4 tw-border-b tw-border-[#e0e0e0]">
                <span className="tw-text-[13px]">{label}</span>
                <span className="tw-text-[12px] tw-font-semibold">{fmt$(value)}</span>
              </div>
            ))}
            <div className="tw-flex tw-items-center tw-justify-between tw-mt-3 tw-px-3 tw-py-5 tw-bg-[#eaf2ff] tw-rounded-lg">
              <span className="tw-text-[15px] tw-font-md tw-text-[#005dff]">Grand Total</span>
              <span className="tw-text-[15px] tw-font-semibold tw-text-[#005dff]">{fmt$(grand)}</span>
            </div>
          </div>
           )}
        </div>
      </div>

      {/* ── Bar Chart ── */}
      <div className="tw-bg-white tw-border tw-border-slate-200 tw-rounded-xl tw-shadow-sm hover:tw-shadow-md hover:tw-border-blue-300 tw-transition-all">
        <div className="tw-flex tw-items-center tw-justify-between tw-px-5 tw-pt-5 tw-pb-2">
          <span className="tw-text-[16px] tw-font-bold tw-text-[#002149]">All Takeoffs Budget Comparison</span>
          {hasChartData && (
            <div className="tw-flex tw-items-center tw-gap-6">
              {[{ name: "Material", color: "#1476FF" }, { name: "Labor", color: "#f97415" }].map((d) => (
                <div key={d.name} className="tw-flex tw-items-center tw-gap-1.5">
                  <div className="tw-w-2.5 tw-h-2.5 tw-rounded-full" style={{ background: d.color }} />
                  <span className="tw-text-[15px] tw-text-[#999999]">{d.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {!hasChartData ? (
          <div className="tw-h-[340px] tw-px-2 tw-pb-4">
            <EmptyState message="No takeoff comparison data available" />
          </div>
        ) : (
          <div className="tw-px-2 tw-pb-4" style={{ outline: "none" }}>
            <div className="tw-h-[340px]" style={{ outline: "none" }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{ top: 16, right: 16, left: 8, bottom: 8 }}
                  barCategoryGap="30%"
                  barGap={3}
                  // ── FIX: remove focus outline on chart click ──
                  style={{ outline: "none" }}
                >
                  <CartesianGrid stroke="#e2e8f0" vertical={false} />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11, fill: "#94a3b8" }}
                    axisLine={{ stroke: "#e2e8f0" }}
                    tickLine={false}
                    interval={0}
                  />
                  <YAxis
                    tickFormatter={yFmt}
                    tick={{ fontSize: 11, fill: "#94a3b8" }}
                    axisLine={false}
                    tickLine={false}
                    width={52}
                    domain={yAxisDomain}
                    ticks={yAxisTicks}
                  />
                  <Tooltip
                    formatter={(v) => fmt$(v)}
                    contentStyle={{
                      background: "#fff",
                      border: "1px solid #e2e8f0",
                      borderRadius: 8,
                      fontSize: 13,
                    }}
                    cursor={{ fill: "rgba(0,0,0,0.04)" }}
                  />
                  <Bar dataKey="material" name="Material" fill="#1476FF" radius={[4, 4, 0, 0]} maxBarSize={44} />
                  <Bar dataKey="labor" name="Labor" fill="#f97415" radius={[4, 4, 0, 0]} maxBarSize={44} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}