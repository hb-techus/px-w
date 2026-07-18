import * as XLSX from "xlsx-js-style";

// ── Constants ─────────────────────────────────────────────────────────────────
const HDR_BG  = "0B5394"; // dark navy blue — no # prefix for xlsx-js-style
const SEC_BG  = "D9D9D9"; // light gray
const USD_FMT  = '__USD__'; // sentinel — sc() pre-formats to string via Intl for cross-platform display
const _usdFmt = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
const PCT_FMT = '0%';

const thin = { style: "thin", color: { rgb: "D1D5DB" } };
const B    = { top: thin, bottom: thin, left: thin, right: thin };

// ── Styles ────────────────────────────────────────────────────────────────────
const S = {
  title: {
    font:      { name: "Calibri", sz: 11, bold: true },
    alignment: { vertical: "center" },
  },
  hdr: (align = "center") => ({
    font:      { name: "Calibri", sz: 10, bold: true, color: { rgb: "FFFFFF" } },
    fill:      { patternType: "solid", fgColor: { rgb: HDR_BG } },
    alignment: { horizontal: align, vertical: "center", wrapText: true },
    border:    B,
  }),
  sec: () => ({
    font:      { name: "Calibri", sz: 10, bold: true },
    fill:      { patternType: "solid", fgColor: { rgb: SEC_BG } },
    alignment: { horizontal: "left", vertical: "center" },
    border:    B,
  }),
  secCenter: () => ({
    font:      { name: "Calibri", sz: 10, bold: true },
    fill:      { patternType: "solid", fgColor: { rgb: SEC_BG } },
    alignment: { horizontal: "center", vertical: "center" },
    border:    B,
  }),
  dat: (align = "left", bold = false) => ({
    font:      { name: "Calibri", sz: 10, bold },
    fill:      { patternType: "solid", fgColor: { rgb: "FFFFFF" } },
    alignment: { horizontal: align, vertical: "center" },
    border:    B,
  }),
  tot: (align = "left", bold = false) => ({
    font:      { name: "Calibri", sz: 10, bold },
    fill:      { patternType: "solid", fgColor: { rgb: SEC_BG } },
    alignment: { horizontal: align, vertical: "center" },
    border:    B,
  }),
  grandHdr: (align = "left") => ({
    font:      { name: "Calibri", sz: 10, bold: true, color: { rgb: "FFFFFF" } },
    fill:      { patternType: "solid", fgColor: { rgb: HDR_BG } },
    alignment: { horizontal: align, vertical: "center" },
    border:    B,
  }),
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function sc(ws, r, c, v, s, z) {
  const addr = XLSX.utils.encode_cell({ r, c });
  if (z === USD_FMT && typeof v === "number") {
    // Pre-format as string so Apple Numbers and all platforms show $1,234.56
    ws[addr] = { v: _usdFmt.format(v), t: "s", s };
  } else {
    ws[addr] = { v, t: typeof v === "number" ? "n" : "s", s };
    if (z) ws[addr].z = z;
  }
}

function emptyRange(ws, r, c0, c1, style) {
  for (let c = c0; c <= c1; c++) sc(ws, r, c, "", style);
}

function finalize(ws, merges, maxR, maxC, colWidths) {
  ws["!ref"]    = XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: maxR, c: maxC } });
  ws["!merges"] = merges;
  ws["!cols"]   = colWidths.map(wch => ({ wch }));
  ws["!rows"]   = [{ hpt: 14 }, { hpt: 20 }];
  return ws;
}


// Use integer format when value is whole number (avoids "18." display)
function qtyFmt(val) {
  return Number.isInteger(Number(val)) ? '#,##0' : '#,##0.##';
}

// ── Data builders (from raw tagged items) ─────────────────────────────────────

function buildMatGroups(rawMat) {
  const map = {}, order = [];
  rawMat.forEach(item => {
    const k = item.takeoff_name || item.section_name || "Other";
    if (!map[k]) {
      map[k] = {
        trade_name:   k,
        section_code: item.section_code ?? "",
        section_name: item.section_name ?? "",
        materials:    [],
        subtotal:     0,
      };
      order.push(k);
    }
    map[k].materials.push({
      product_code:          item.product_code ?? "",
      product_name:          item.product_name ?? "",
      quantity:              item.quantity ?? 0,
      wastage_percentage:    item.wastage_percentage ?? 0,
      quantity_with_wastage: item.quantity_with_wastage ?? item.quantity ?? 0,
      unit:                  item.unit ?? "",
      unit_cost:             item.unit_cost ?? 0,
      total_cost:            item.total_cost_with_wastage ?? item.total_cost ?? 0,
    });
    map[k].subtotal += item.total_cost_with_wastage ?? item.total_cost ?? 0;
  });
  return order.map(k => map[k]);
}

function buildLabGroups(rawLab) {
  const map = {}, order = [];
  rawLab.forEach(item => {
    const k = item.takeoff_name || item.section_name || "Other";
    if (!map[k]) {
      map[k] = {
        trade_name:   k,
        section_code: item.section_code ?? "",
        section_name: item.section_name ?? "",
        laborItems:   [],
        subtotal:     0,
        totalHours:   0,
      };
      order.push(k);
    }
    map[k].laborItems.push({
      csi_code:      item.csi_code ?? "",
      area_name:     item.area_name ?? "",
      measure_label: (item.measure_label ?? "").toLowerCase(),
      crew_name:     item.crew_name ?? "",
      hours:         item.hours ?? 0,
      total_cost:    item.total_cost ?? 0,
      members:       item.members ?? [],
    });
    map[k].subtotal   += item.total_cost ?? 0;
    map[k].totalHours += item.hours ?? 0;
  });
  return order.map(k => {
    const grp = map[k];
    grp.laborItems.sort((a, b) =>
      (a.area_name || '').localeCompare(b.area_name || '', undefined, { numeric: true, sensitivity: 'base' })
    );
    return grp;
  });
}

// Groups raw items by section_code — one row per unique section in Section Overview tabs
const groupBySection = (rawItems, isLabor) => {
  const map = {}, order = [];
  rawItems.forEach(item => {
    const k = item.section_code || "__no_section__";
    if (!map[k]) {
      map[k] = { section_code: item.section_code ?? "", section_name: item.section_name ?? "", subtotal: 0 };
      order.push(k);
    }
    map[k].subtotal += isLabor
      ? Number(item.total_cost ?? 0)
      : Number(item.total_cost_with_wastage ?? item.total_cost ?? 0);
  });
  return order.map(k => map[k]);
};

// ─────────────────────────────────────────────────────────────────────────────
// Tab 1: Overview
// ─────────────────────────────────────────────────────────────────────────────
function buildOverview(overviewData) {
  const ws = {}, merges = [], LAST = 1;
  let r = 0;

  sc(ws, r, 0, "Overview", S.title);
  sc(ws, r, 1, "", S.title); r++;

  sc(ws, r, 0, "Section Name", S.hdr("center"));
  sc(ws, r, 1, "Amount",       S.hdr("center")); r++;

  const matCost = overviewData?.material_cost_with_wastage ?? 0;
  const labCost = overviewData?.labour_cost ?? 0;
  const dirCost = overviewData?.direct_cost_with_wastage ?? (matCost + labCost);
  const conCost = overviewData?.contingency_cost_with_wastage ?? 0;
  const ovhCost = overviewData?.overhead_cost_with_wastage ?? 0;
  const conPct  = overviewData?.contingency_percentage;
  const ovhPct  = overviewData?.overhead_percentage;
  const grand   = overviewData?.base_cost_with_wastage ?? 0;

  [
    ["Material Cost",                                             matCost],
    ["Labor Cost",                                               labCost],
    ["Direct Cost",                                              dirCost],
    [conPct != null ? `Contingency (${conPct}%)` : "Contingency", conCost],
    [ovhPct != null ? `Overhead (${ovhPct}%)`    : "Overhead",    ovhCost],
  ].forEach(([label, val]) => {
    sc(ws, r, 0, label,       S.dat("left"));
    sc(ws, r, 1, Number(val), S.dat("right"), USD_FMT);
    r++;
  });

  sc(ws, r, 0, "Grand Total", S.grandHdr("left"));
  sc(ws, r, 1, Number(grand), S.grandHdr("right"), USD_FMT);

  finalize(ws, merges, r, LAST, [35, 18]);
  ws["!rows"][r] = { hpt: 20 };
  return ws;
}

// ─────────────────────────────────────────────────────────────────────────────
// Tab 2: Material - Section Overview
// ─────────────────────────────────────────────────────────────────────────────
function buildMatSectionOverview(matGroups) {
  const ws = {}, merges = [], LAST = 2;
  let r = 0, grand = 0;

  sc(ws, r, 0, "Material Estimate - Section Overview", S.title);
  emptyRange(ws, r, 1, LAST, S.title); r++;

  sc(ws, r, 0, "Section ID",   S.hdr("center"));
  sc(ws, r, 1, "Section Name", S.hdr("center"));
  sc(ws, r, 2, "Amount",       S.hdr("center")); r++;

  matGroups.forEach(grp => {
    grand += grp.subtotal;
    sc(ws, r, 0, grp.section_code,     S.dat("center"));
    sc(ws, r, 1, grp.section_name,     S.dat("left"));
    sc(ws, r, 2, Number(grp.subtotal), S.dat("right"), USD_FMT);
    r++;
  });

  sc(ws, r, 0, "",            S.tot("left"));
  sc(ws, r, 1, "Total",       S.tot("right", true));
  sc(ws, r, 2, Number(grand), S.tot("right", true), USD_FMT);

  return finalize(ws, merges, r, LAST, [16, 40, 18]);
}

// ─────────────────────────────────────────────────────────────────────────────
// Tab 3: Material - Section Detailed
// ─────────────────────────────────────────────────────────────────────────────
function buildMatSectionDetailed(matGroups) {
  const ws = {}, merges = [], LAST = 9;
  let r = 0, grand = 0;

  sc(ws, r, 0, "Material Estimate - Section Detailed", S.title);
  for (let c = 1; c <= LAST; c++) sc(ws, r, c, "", S.title);
  merges.push({ s: { r, c: 0 }, e: { r, c: 1 } }); r++;

  [
    ["Section ID",              "center"],
    ["Section Name",            "center"],
    ["Product ID",              "center"],
    ["Product Name",            "center"],
    ["Quantity",                "center"],
    ["Wastage",                 "center"],
    ["Quantity incl.\nWastage", "center"],
    ["Unit",                    "center"],
    ["Unit Cost",               "center"],
    ["Total Cost",              "center"],
  ].forEach(([h, a], c) => sc(ws, r, c, h, S.hdr(a)));
  r++;

  matGroups.forEach(grp => {
    // Gray section header: section_code centered | section_name left | rest gray
    sc(ws, r, 0, grp.section_code, S.secCenter());
    sc(ws, r, 1, grp.section_name, S.sec());
    emptyRange(ws, r, 2, LAST, S.sec()); r++;

    grp.materials.forEach(m => {
      grand += m.total_cost;
      sc(ws, r, 0, "",                                   S.dat("center"));
      sc(ws, r, 1, "",                                   S.dat("left"));
      sc(ws, r, 2, m.product_code,                       S.dat("center"));
      sc(ws, r, 3, m.product_name,                       S.dat("left"));
      sc(ws, r, 4, Number(m.quantity),                   S.dat("right"), qtyFmt(m.quantity));
      sc(ws, r, 5, Number(m.wastage_percentage / 100),   S.dat("right"), PCT_FMT);
      sc(ws, r, 6, Number(m.quantity_with_wastage),      S.dat("right"), qtyFmt(m.quantity_with_wastage));
      sc(ws, r, 7, m.unit,                               S.dat("right"));
      sc(ws, r, 8, Number(m.unit_cost),                  S.dat("right"), USD_FMT);
      sc(ws, r, 9, Number(m.total_cost),                 S.dat("right"), USD_FMT);
      r++;
    });
  });

  emptyRange(ws, r, 0, LAST - 2, S.tot("left"));
  sc(ws, r, LAST - 1, "Total",       S.tot("right", true));
  sc(ws, r, LAST,     Number(grand), S.tot("right", true), USD_FMT);

  finalize(ws, merges, r, LAST, [14, 32, 14, 46, 12, 10, 16, 8, 14, 16]);
  ws["!rows"][1] = { hpt: 28 };
  return ws;
}

// ─────────────────────────────────────────────────────────────────────────────
// Tab 4: Material - Trade Detailed
// ─────────────────────────────────────────────────────────────────────────────
function buildMatTradeDetailed(matGroups) {
  const ws = {}, merges = [], LAST = 7;
  let r = 0, grand = 0;

  sc(ws, r, 0, "Material Estimate - Trade Detailed", S.title);
  for (let c = 1; c <= LAST; c++) sc(ws, r, c, "", S.title); r++;

  [
    ["Product ID",              "center"],
    ["Product Name",            "center"],
    ["Quantity",                "center"],
    ["Wastage",                 "center"],
    ["Quantity incl.\nWastage", "center"],
    ["Unit",                    "center"],
    ["Unit Cost",               "center"],
    ["Total Cost",              "center"],
  ].forEach(([h, a], c) => sc(ws, r, c, h, S.hdr(a)));
  r++;

  matGroups.forEach(grp => {
    sc(ws, r, 0, grp.trade_name, S.sec());
    emptyRange(ws, r, 1, LAST, S.sec());
    merges.push({ s: { r, c: 0 }, e: { r, c: LAST } }); r++;

    grp.materials.forEach(m => {
      grand += m.total_cost;
      sc(ws, r, 0, m.product_code,                       S.dat("center"));
      sc(ws, r, 1, m.product_name,                       S.dat("left"));
      sc(ws, r, 2, Number(m.quantity),                   S.dat("right"), qtyFmt(m.quantity));
      sc(ws, r, 3, Number(m.wastage_percentage / 100),   S.dat("right"), PCT_FMT);
      sc(ws, r, 4, Number(m.quantity_with_wastage),      S.dat("right"), qtyFmt(m.quantity_with_wastage));
      sc(ws, r, 5, m.unit,                               S.dat("right"));
      sc(ws, r, 6, Number(m.unit_cost),                  S.dat("right"), USD_FMT);
      sc(ws, r, 7, Number(m.total_cost),                 S.dat("right"), USD_FMT);
      r++;
    });

    // Blank spacer row between trade groups
    emptyRange(ws, r, 0, LAST, S.dat("left")); r++;
  });

  emptyRange(ws, r, 0, LAST - 2, S.tot("left"));
  sc(ws, r, LAST - 1, "Total",       S.tot("right", true));
  sc(ws, r, LAST,     Number(grand), S.tot("right", true), USD_FMT);

  finalize(ws, merges, r, LAST, [14, 54, 12, 10, 16, 8, 14, 16]);
  ws["!rows"][1] = { hpt: 28 };
  return ws;
}

// ─────────────────────────────────────────────────────────────────────────────
// Tab 5: Labor - Section Overview
// ─────────────────────────────────────────────────────────────────────────────
function buildLabSectionOverview(labGroups) {
  const ws = {}, merges = [], LAST = 2;
  let r = 0, grand = 0;

  sc(ws, r, 0, "Labor Estimate - Section Overview", S.title);
  emptyRange(ws, r, 1, LAST, S.title); r++;

  sc(ws, r, 0, "Section ID",   S.hdr("center"));
  sc(ws, r, 1, "Section Name", S.hdr("center"));
  sc(ws, r, 2, "Amount",       S.hdr("center")); r++;

  labGroups.forEach(grp => {
    grand += grp.subtotal;
    sc(ws, r, 0, grp.section_code,     S.dat("center"));
    sc(ws, r, 1, grp.section_name,     S.dat("left"));
    sc(ws, r, 2, Number(grp.subtotal), S.dat("right"), USD_FMT);
    r++;
  });

  sc(ws, r, 0, "",            S.tot("left"));
  sc(ws, r, 1, "Total",       S.tot("right", true));
  sc(ws, r, 2, Number(grand), S.tot("right", true), USD_FMT);

  return finalize(ws, merges, r, LAST, [16, 40, 18]);
}

// ─────────────────────────────────────────────────────────────────────────────
// Tab 6: Labor - Section Detailed
// Cols: Section ID | Section Name | CSI ID | Name | Quantity | Labor Crew Name
//       | Crew Members | Wage/hr | Total Hours | Total Cost
// ─────────────────────────────────────────────────────────────────────────────
function buildLabSectionDetailed(labGroups) {
  const ws = {}, merges = [], LAST = 9;
  let r = 0, grand = 0;

  sc(ws, r, 0, "Labor Estimate - Section Detailed", S.title);
  for (let c = 1; c <= LAST; c++) sc(ws, r, c, "", S.title);
  merges.push({ s: { r, c: 0 }, e: { r, c: 1 } }); r++;

  [
    ["Section ID",      "center"],
    ["Section Name",    "center"],
    ["CSI ID",          "center"],
    ["Name",            "center"],
    ["Quantity",        "center"],
    ["Labor Crew Name", "center"],
    ["Crew Members",    "center"],
    ["Wage/hr",         "center"],
    ["Total Hours",     "center"],
    ["Total Cost",      "center"],
  ].forEach(([h, a], c) => sc(ws, r, c, h, S.hdr(a)));
  r++;

  labGroups.forEach(grp => {
    if (!grp.laborItems.length) return;

    // Gray section header
    sc(ws, r, 0, grp.section_code, S.secCenter());
    sc(ws, r, 1, grp.section_name, S.sec());
    emptyRange(ws, r, 2, LAST, S.sec()); r++;

    grp.laborItems.forEach(item => {
      grand += item.total_cost;

      // Crew row: empty A-B | CSI ID | area_name | measure_label | crew_name | empty G-J
      sc(ws, r, 0, "",                 S.dat("center"));
      sc(ws, r, 1, "",                 S.dat("left"));
      sc(ws, r, 2, item.csi_code,      S.dat("center"));
      sc(ws, r, 3, item.area_name,     S.dat("left"));
      sc(ws, r, 4, item.measure_label, S.dat("left"));
      sc(ws, r, 5, item.crew_name,     S.dat("left"));
      emptyRange(ws, r, 6, LAST, S.dat("left")); r++;

      // Member rows: empty A-F | worker_name | wage ($) | hours | cost ($)
      (item.members || []).forEach(mem => {
        emptyRange(ws, r, 0, 5, S.dat("left"));
        sc(ws, r, 6, mem.worker_name ?? "",       S.dat("left"));
        sc(ws, r, 7, Number(mem.wage ?? 0),       S.dat("right"), USD_FMT);
        sc(ws, r, 8, Number(mem.hours ?? 0),      S.dat("right"), '#,##0.##');
        sc(ws, r, 9, Number(mem.total_cost ?? 0), S.dat("right"), USD_FMT);
        r++;
      });
    });
  });

  emptyRange(ws, r, 0, LAST - 2, S.tot("left"));
  sc(ws, r, LAST - 1, "Total",       S.tot("right", true));
  sc(ws, r, LAST,     Number(grand), S.tot("right", true), USD_FMT);

  return finalize(ws, merges, r, LAST, [14, 28, 12, 22, 18, 32, 36, 12, 14, 16]);
}

// ─────────────────────────────────────────────────────────────────────────────
// Tab 7: Labor - Trade Detailed
// Cols: CSI ID | Name | Quantity | Labor Crew Name | Crew Members
//       | Wage/hr | Total Hours | Total Cost
// ─────────────────────────────────────────────────────────────────────────────
function buildLabTradeDetailed(labGroups) {
  const ws = {}, merges = [], LAST = 7;
  let r = 0, grand = 0;

  sc(ws, r, 0, "Labor Estimate - Trade Detailed", S.title);
  for (let c = 1; c <= LAST; c++) sc(ws, r, c, "", S.title); r++;

  [
    ["CSI ID",          "center"],
    ["Name",            "center"],
    ["Quantity",        "center"],
    ["Labor Crew Name", "center"],
    ["Crew Members",    "center"],
    ["Wage/hr",         "center"],
    ["Total Hours",     "center"],
    ["Total Cost",      "center"],
  ].forEach(([h, a], c) => sc(ws, r, c, h, S.hdr(a)));
  r++;

  labGroups.forEach(grp => {
    if (!grp.laborItems.length) return;

    sc(ws, r, 0, grp.trade_name, S.sec());
    emptyRange(ws, r, 1, LAST, S.sec());
    merges.push({ s: { r, c: 0 }, e: { r, c: LAST } }); r++;

    grp.laborItems.forEach(item => {
      grand += item.total_cost;

      // Crew row
      sc(ws, r, 0, item.csi_code,      S.dat("center"));
      sc(ws, r, 1, item.area_name,     S.dat("left"));
      sc(ws, r, 2, item.measure_label, S.dat("left"));
      sc(ws, r, 3, item.crew_name,     S.dat("left"));
      emptyRange(ws, r, 4, LAST, S.dat("left")); r++;

      // Member rows
      (item.members || []).forEach(mem => {
        emptyRange(ws, r, 0, 3, S.dat("left"));
        sc(ws, r, 4, mem.worker_name ?? "",       S.dat("left"));
        sc(ws, r, 5, Number(mem.wage ?? 0),       S.dat("right"), USD_FMT);
        sc(ws, r, 6, Number(mem.hours ?? 0),      S.dat("right"), '#,##0.##');
        sc(ws, r, 7, Number(mem.total_cost ?? 0), S.dat("right"), USD_FMT);
        r++;
      });
    });
  });

  // Blank row before total
  emptyRange(ws, r, 0, LAST, S.dat("left")); r++;

  emptyRange(ws, r, 0, LAST - 2, S.tot("left"));
  sc(ws, r, LAST - 1, "Total",       S.tot("right", true));
  sc(ws, r, LAST,     Number(grand), S.tot("right", true), USD_FMT);

  return finalize(ws, merges, r, LAST, [12, 22, 18, 32, 36, 12, 14, 16]);
}

// Section grouping with full item details — for Section Detailed and Trade Detailed tabs
function groupMatBySectionItems(rawMat) {
  const map = {}, order = [];
  rawMat.forEach(item => {
    const k = item.section_code || "__no_section__";
    if (!map[k]) {
      map[k] = { section_code: item.section_code ?? "", section_name: item.section_name ?? "", materials: [] };
      order.push(k);
    }
    map[k].materials.push({
      product_code:          item.product_code ?? "",
      product_name:          item.product_name ?? "",
      quantity:              item.quantity ?? 0,
      wastage_percentage:    item.wastage_percentage ?? 0,
      quantity_with_wastage: item.quantity_with_wastage ?? item.quantity ?? 0,
      unit:                  item.unit ?? "",
      unit_cost:             item.unit_cost ?? 0,
      total_cost:            item.total_cost_with_wastage ?? item.total_cost ?? 0,
    });
  });
  return order.map(k => map[k]);
}

function groupLabBySectionItems(rawLab) {
  const map = {}, order = [];
  rawLab.forEach(item => {
    const k = item.section_code || "__no_section__";
    if (!map[k]) {
      map[k] = { section_code: item.section_code ?? "", section_name: item.section_name ?? "", laborItems: [] };
      order.push(k);
    }
    map[k].laborItems.push({
      csi_code:      item.csi_code ?? "",
      area_name:     item.area_name ?? "",
      measure_label: (item.measure_label ?? "").toLowerCase(),
      crew_name:     item.crew_name ?? "",
      hours:         item.hours ?? 0,
      total_cost:    item.total_cost ?? 0,
      members:       item.members ?? [],
    });
  });
  return order.map(k => map[k]);
}

// ── Main export ───────────────────────────────────────────────────────────────
export function exportEstimateToExcel({
  materialRawData = [],
  laborRawData    = [],
  overviewData    = {},
  filename        = "Estimate Export.xlsx",
}) {
  if (!materialRawData.length && !laborRawData.length) return;

  const matGroups   = buildMatGroups(materialRawData);
  const labGroups   = buildLabGroups(laborRawData);
  const matSections = groupBySection(materialRawData, false);
  const labSections = groupBySection(laborRawData,    true);
  const matSecItems = groupMatBySectionItems(materialRawData);
  const labSecItems = groupLabBySectionItems(laborRawData);

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, buildOverview(overviewData),           "Overview");
  XLSX.utils.book_append_sheet(wb, buildMatSectionOverview(matSections),  "Material - Section Overview");
  XLSX.utils.book_append_sheet(wb, buildMatSectionDetailed(matSecItems),  "Material - Section Detailed");
  XLSX.utils.book_append_sheet(wb, buildMatTradeDetailed(matGroups),      "Material - Trade Detailed");
  XLSX.utils.book_append_sheet(wb, buildLabSectionOverview(labSections),  "Labor - Section Overview");
  XLSX.utils.book_append_sheet(wb, buildLabSectionDetailed(labSecItems),  "Labor - Section Detailed");
  XLSX.utils.book_append_sheet(wb, buildLabTradeDetailed(labGroups),      "Labor - Trade Detailed");

  XLSX.writeFile(wb, filename, { bookType: "xlsx", compression: true });
}
