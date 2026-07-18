/* ─── HSV → RGB ─────────────────────────────────────────────────────────────── */
function hsvToRgb(h, s, v) {
  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;
  let r, g, b;
  switch (Math.floor(h / 60)) {
    case 0: [r, g, b] = [c, x, 0]; break;
    case 1: [r, g, b] = [x, c, 0]; break;
    case 2: [r, g, b] = [0, c, x]; break;
    case 3: [r, g, b] = [0, x, c]; break;
    case 4: [r, g, b] = [x, 0, c]; break;
    default:[r, g, b] = [c, 0, x]; break;
  }
  return [
    Math.round((r + m) * 255),
    Math.round((g + m) * 255),
    Math.round((b + m) * 255),
  ];
}
 
function rgbToHex(r, g, b) {
  return `#${r.toString(16).padStart(2,"0")}${g.toString(16).padStart(2,"0")}${b.toString(16).padStart(2,"0")}`;
}
 
/**
 * Deterministic vibrant color at a global index.
 * Same index → same color, every time.
 */
export function colorAtIndex(globalIndex) {
  const GOLDEN = 0.618033988749895;
  const hue        = ((globalIndex * GOLDEN) % 1) * 360;
  const saturation = 0.75 + (globalIndex % 3) * 0.08;
  const value      = 0.88 + (globalIndex % 2) * 0.07;
  const [r, g, b]  = hsvToRgb(hue, saturation, value);
  return rgbToHex(r, g, b);
}
 
/**
 * Create { stroke, fill } palette from a hex color.
 */
export function createColorPalette(hexColor, opacity = 0.2) {
  const alpha = Math.round(opacity * 255).toString(16).padStart(2, "0");
  return { stroke: hexColor, fill: `${hexColor}${alpha}` };
}
 
/* ─── Predefined type colors ─────────────────────────────────────────────────── */
export const AREA_TYPE_COLORS = {
  wall: { stroke: "#8b4513", fill: "rgba(139, 69, 19, 0.15)" },
  room: { stroke: "#6366f1", fill: "rgba(99, 102, 241, 0.15)" },
};
 
export const SYMBOL_TYPE_COLORS = {
  "0": { stroke: "#ef4444", fill: "rgba(239,  68,  68, 0.2)" },
  "1": { stroke: "#f59e0b", fill: "rgba(245, 158,  11, 0.2)" },
  "2": { stroke: "#10b981", fill: "rgba( 16, 185, 129, 0.2)" },
  "3": { stroke: "#3b82f6", fill: "rgba( 59, 130, 246, 0.2)" },
  "4": { stroke: "#8b5cf6", fill: "rgba(139,  92, 246, 0.2)" },
};
 
export const TOOL_COLORS = {
  rectangle: { stroke: "#6366f1", fill: "rgba(99, 102, 241, 0.25)" },
  polygon:   { stroke: "#6366f1", fill: "rgba(99, 102, 241, 0.25)" },
  line:      { stroke: "#6366f1", fill: "transparent"              },
  point:     { stroke: "#ef4444", fill: "#ef4444"                  },
  measure:   { stroke: "#38bdf8", fill: "transparent"              },
  // ── New shape types ───────────────────────────────────────────────────────
  arc:       { stroke: "#10b981", fill: "rgba(16, 185, 129, 0.2)" },
  circle:    { stroke: "#ec4899", fill: "rgba(236, 72, 153, 0.2)" },
};
 
/* ─── All 14 category data keys + color offsets ─────────────────────────────── */
export const ALL_CATEGORY_DATA_KEYS = [
  "drywall_data",
  "paint_data",
  "doors_data",
  "floor_data",
  "ceiling_data",
  "hvac_data",
  "roofing_data",
  "electrical_data",
  "concrete_data",
  "masonry_data",
  "mechanical_data",
  "plumbing_data",
  "siding_data",
  "steel_data",
   "unknown_data",
];
  
 
export function hashStr(s) {
  let h = 5381;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) + h) ^ s.charCodeAt(i);
    h |= 0; // keep 32-bit int
  }
  return Math.abs(h);
}
 
/**
 * Pure id-based stable color — used for CANVAS DETECTION shapes.
 * category and pageNumber intentionally IGNORED so canvas & sidebar agree.
 */
export function stableColorForId(id) {
  const index = hashStr(id) % 800;
  return createColorPalette(colorAtIndex(index));
}
 
/**
 * Build color map from extraction takeoff data.
 *
 * PROBLEM: Symbol-type items (doors, HVAC components, etc.) can have multiple
 * line items (Door-1, Door-2) that all share the SAME item.id (e.g. "symbol-1")
 * because they are instances of the same detection class. The old code gave them
 * all the same color → identical sidebar dots.
 *
 * FIX (minimal — only affects duplicates, nothing else changes):
 * Within each category, we track how many times each item.id has appeared.
 * - First occurrence  → color seed = item.id          (unchanged, canvas matches)
 * - Second occurrence → color seed = item.id + '_dup_1' (different stable color)
 * - Third occurrence  → color seed = item.id + '_dup_2' (different stable color)
 * etc.
 *
 * Items with unique ids (Area-45, Diffuser-1, HVAC Item-1 …) are never
 * duplicates so their color is 100% unchanged from before.
 *
 * The color map registers every palette under all keys the rest of the code
 * uses for lookup: bare id (first-wins), page-scoped id, pk_id, item_id.
 * Duplicate items get their unique palette stored under pk_id / item_id so
 * TakeoffSidebar's normaliseItemForPanel and dotColor lookups find the right
 * color when they fall through to those keys.
 */
export function createTakeoffColorMap(takeoffData, areaData) {
    areaData = Array.isArray(areaData) ? areaData : [];

  const colorMap = new Map();
  if (!takeoffData) return colorMap;
 
  ALL_CATEGORY_DATA_KEYS.forEach((key) => {
    const raw   = takeoffData[key];
    const items = Array.isArray(raw) ? raw : (raw?.items ?? []);
    if (!items.length) return;
 
    // Track how many times each item.id has been seen within this category.
    // Reset per-category so duplicates in different categories don't interfere.
    const seenIds = new Map();
 
    items.forEach((item) => {
      if (!item.id) return;
 
      // ── Unified seed formula (matches buildDetectionColorMap) ─────────────
      // Use "${id}_p${page}" as seed when page_number is present.
      // This is the SAME formula used by buildDetectionColorMap's paletteForId(),
      // so detection canvas shapes and extraction sidebar dots always get the
      // same color for the same item on the same page.
      //
      // For duplicate symbol ids on the SAME page (Door-1, Door-2 both = "symbol-1"
      // on page 2), append _dup_N to distinguish them in the sidebar while keeping
      // the canvas shape (which uses the scoped key without _dup) at the base color.
      const baseId = item.page_number != null
        ? `${item.id}_p${item.page_number}`
        : item.id;
      const dupCount = seenIds.get(item.id) ?? 0;
      seenIds.set(item.id, dupCount + 1);
      const colorSeed = dupCount === 0 ? baseId : `${baseId}_dup_${dupCount}`;
 
      const palette = createColorPalette(colorAtIndex(hashStr(colorSeed) % 800));
 
      // ── Page-scoped key — always written (authoritative) ──────────────────
      // Canvas shape lookup uses "${takeoffId}_p${pageNumber}" first, so this
      // key MUST always be present and MUST match what buildDetectionColorMap
      // stored under the same key (both use the same seed formula).
      if (item.page_number != null) {
        colorMap.set(`${item.id}_p${item.page_number}`, palette);
      }
 
      // ── Bare id key — first item wins (fallback for page-agnostic lookups) ─
      if (!colorMap.has(item.id)) colorMap.set(item.id, palette);
 
      // ── Unique-per-item keys (sidebar dot lookup) ─────────────────────────
      // pk_id and item_id are unique per DB row so duplicate items always
      // get their own distinct palette stored here.
      if (item.pk_id   != null) colorMap.set(String(item.pk_id),   palette);
      if (item.item_id != null) colorMap.set(String(item.item_id), palette);

      // Register every object_keys entry using each key's OWN detection-consistent
      // seed (same formula as buildDetectionColorMap: "${key}_p${page}") so that
      // canvas detection shapes keep their detection colors after extraction runs.
      // Using the item's `palette` here caused colors to change on extraction because
      // the extraction map would overwrite the detection-key slot with the wrong color,
      // and applyDetectionEntries (which only fills missing keys) could not correct it.
      if (Array.isArray(item.object_keys) && item.object_keys.length > 0) {
        item.object_keys.forEach((objKey) => {
          if (!objKey) return;
          const objSeed = item.page_number != null ? `${objKey}_p${item.page_number}` : objKey;
          const objPalette = createColorPalette(colorAtIndex(hashStr(objSeed) % 800));
          if (item.page_number != null) {
            colorMap.set(`${objKey}_p${item.page_number}`, objPalette);
          }
          if (!colorMap.has(objKey)) colorMap.set(objKey, objPalette);
        });
      }
    });
  });
 
  areaData.forEach((area) => {
    if (!colorMap.has(area.id)) {
      colorMap.set(area.id, stableColorForId(area.id));
    }
  });
 
  return colorMap;
}
 
/**
 * Count total takeoff items across all categories.
 */
export function countTakeoffItems(takeoffData) {
  if (!takeoffData) return 0;
  return ALL_CATEGORY_DATA_KEYS.reduce((sum, key) => {
    const raw = takeoffData[key];
    const len = Array.isArray(raw) ? raw.length : (raw?.items?.length ?? 0);
    return sum + len;
  }, 0);
}