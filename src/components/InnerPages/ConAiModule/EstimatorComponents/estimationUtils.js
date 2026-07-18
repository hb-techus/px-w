/* ─── Shared utilities for Estimation components ─────────────────────── */

export const normalizeCategory = (cat = "") => {
  const c = cat.toLowerCase().replace(/_/g, " ").trim();

  if (c.includes("floor"))                          return "Flooring";
  if (c.includes("ceil"))                           return "Ceiling";
  if (c.includes("paint"))                          return "Painting";
  if (c.includes("drywall"))                        return "Drywall";
  if (c.includes("roof"))                           return "Roofing";
  if (c.includes("concrete"))                       return "Concrete";
  if (c.includes("siding"))                         return "Siding";
  if (c.includes("mason"))                          return "Masonry";
  if (c.includes("door") || c.includes("window"))  return "Doors & Windows";
  if (c.includes("mechanic"))                       return "Mechanical";
  if (c.includes("electric"))                       return "Electrical";
  if (c.includes("plumb"))                          return "Plumbing";
  if (c.includes("hvac"))                           return "HVAC";
  if (c.includes("steel"))                          return "Steel";

  return cat.charAt(0).toUpperCase() + cat.slice(1);
};

export const buildChartData = (materialItems = [], labourItems = []) => {
  const mMap = {}, lMap = {};

  materialItems.forEach((item) => {
    const k = normalizeCategory(item.takeoff_name);
    mMap[k] = (mMap[k] || 0) + Number(item.total_cost_with_wastage || item.total_cost || 0);
  });

  labourItems.forEach((item) => {
    const k = normalizeCategory(item.takeoff_name);
    lMap[k] = (lMap[k] || 0) + Number(item.total_cost || item.subtotal || 0);
  });

  const ALL_TAKEOFFS = [
    "Flooring", "Ceiling", "Painting", "Drywall", "Roofing",
    "Concrete", "Siding", "Masonry", "Doors & Windows",
    "Mechanical", "Electrical", "Plumbing", "HVAC", "Steel",
  ];

  return ALL_TAKEOFFS
    .map((name) => ({
      name,
      material: mMap[name] || 0,
      labor:    lMap[name] || 0,
    }))
    .filter((d) => d.material > 0 || d.labor > 0);
};

export const fmt$ = (v) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(v) || 0);


export const fmtNum = (v) =>
  new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 2,
  }).format(Number(v) || 0);

export const yFmt = (v) => {
  if (v === 0) return "$0";
  const a = Math.abs(v);
  if (a >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (a >= 1_000)     return `$${(v / 1_000).toFixed(0)}k`;
  return `$${Number(v).toFixed(0)}`;
};

export const BORDER_COLORS = [
  "#1476ff", "#6366f1", "#f59e0b", "#f97316", "#06b6d4", "#ef4444",
];