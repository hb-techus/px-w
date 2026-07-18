// ─── TakeoffWorkspace.utils.js ────────────────────────────────────────────────

import { createTakeoffColorMap, stableColorForId } from "./UtilsColor";
import {
  API_TO_DATA_KEY,
  DATA_KEY_TO_GROUP,
  ALL_DATA_KEYS,
  ELIGIBLE_ALLOWED_KEYS,
  ELIGIBLE_API_TO_SYSTEM_KEY_MAP,
  ELIGIBLE_LABEL_MAP,
} from "./TakeoffWorkspace.constants";

// ─── Label normaliser ─────────────────────────────────────────────────────────
export const normalizeLabel = (text = "") =>
  text.replace(/[_.]/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());

// ─── URL helpers ──────────────────────────────────────────────────────────────
export function cleanPresignedUrl(url) { return url; }

export async function fetchPresignedUrl(s3_key, getViewUrl) {
  const res = await getViewUrl(s3_key);
  let parsed;
  if (typeof res?.normalData === "string") parsed = JSON.parse(res.normalData);
  else if (typeof res?.data?.normalData === "string") parsed = JSON.parse(res.data.normalData);
  else if (res?.data?.valid !== undefined) parsed = res.data;
  else if (res?.valid !== undefined) parsed = res;
  else throw new Error("Unrecognized API response structure");
  if (!parsed?.valid) throw new Error(parsed?.message || "View URL invalid");
  const url = parsed?.data?.view_url;
  if (!url) throw new Error("view_url missing from response");
  return cleanPresignedUrl(url);
}

export function applyCutRelationships(shapes) {
  const hasCuts = shapes.some((s) => s.cutOf);
  if (!hasCuts) return shapes;
  const keyToId = new Map(shapes.map((s) => [s.takeoffId, s.id]));
  return shapes.map((s) => {
    if (!s.cutOf) return s;
    const parentCanvasId = keyToId.get(s.cutOf) ?? s.cutOf;
    const { cutOf, ...rest } = s;
    return { ...rest, isCutShape: true, cutParentAreaId: parentCanvasId, cutParentTakeoffId: cutOf };
  });
}

export function applyDetectionEntries(targetMap, entries) {
  for (const [k, v] of entries) {
    if (!targetMap.has(k)) targetMap.set(k, v);
  }
}

// ─── Response unwrap ─────────────────────────────────────────────────────────
export function unwrapRes(res) {
  if (res?.valid !== undefined) return res;
  if (res?.data?.valid !== undefined) return res.data;
  return { valid: false, message: "Unknown response format" };
}

// ─── spec group normaliser ────────────────────────────────────────────────────
export function normaliseSpecGroup(g) {
  return {
    group_key:  g.group_key ?? g.spec_key,
    group_name: g.group_name ?? g.spec_name,
    values: (g.values || []).map((v) => ({
      value_key:         v.value_key,
      option_key:        v.value_key,
      option_name:       v.value_display ?? v.option_name,
      value_display:     v.value_display ?? v.option_name,
      parent_option_key: v.parent_option_key ?? null,
    })),
  };
}

// ─── findGroupForTakeoffId ────────────────────────────────────────────────────
export function findGroupForTakeoffId(takeoffId, takeoffData, pageNumber = null) {
  if (!takeoffId || !takeoffData) return null;
  for (const key of ALL_DATA_KEYS) {
    const raw   = takeoffData[key];
    const items = Array.isArray(raw) ? raw : (raw?.items ?? []);
    const found = items.some((i) => {
      const idMatch = i.id === takeoffId ||
        (Array.isArray(i.object_keys) && i.object_keys.includes(takeoffId));
      if (!idMatch) return false;
      if (pageNumber != null && i.page_number != null) {
        return Number(i.page_number) === Number(pageNumber);
      }
      return true;
    });
    if (found) return DATA_KEY_TO_GROUP[key];
  }
  return null;
}

// ─── Color map builder (wraps createTakeoffColorMap) ─────────────────────────
export function buildColorMapFromData(td) {
  if (!td) return new Map();
  return createTakeoffColorMap(td, []);
}

// ─── buildShapesFromDetectionResponse ────────────────────────────────────────
export function buildShapesFromDetectionResponse(detectionData, colorMap, pageNumber = null) {
  const shapes = [];
  if (!detectionData) return shapes;
  const { area = {}, wall = {}, symbols = {}, pipeline = {} } = detectionData;

  const shapeColor = (id) => {
    if (pageNumber != null) {
      const scoped = colorMap.get(`${id}_p${pageNumber}`);
      if (scoped) return scoped;
    }
    const bare = colorMap.get(id);
    if (bare) return bare;
    const seed = pageNumber != null ? `${id}_p${pageNumber}` : id;
    return stableColorForId(seed);
  };

  // ── Area shapes ──────────────────────────────────────────────────────────
  // NOTE: rawArea may contain a "cut" field (e.g. "cut": "area-1") when the
  // object is a cut child. We pass it through as `cutOf` so the workspace
  // can post-process and mark isCutShape / cutParentAreaId.
  Object.entries(area).forEach(([areaId, rawArea]) => {
    const color  = shapeColor(areaId);
    // Carry the cut relationship through — consumed by workspace post-processor
    const cutMeta = rawArea?.cut ? { cutOf: String(rawArea.cut) } : {};

    if (Array.isArray(rawArea)) {
      if (rawArea.length < 3) return;
      const points = rawArea.map(([x, y]) => ({ x, y }));
      shapes.push({ id: `${areaId}-shape`, takeoffId: areaId, type: "area", areaType: "room", points, color, pageNumber });
      return;
    }

    const areaType = rawArea?.type;

    if (areaType === "polygon") {
      const pts = rawArea.value ?? [];
      if (!Array.isArray(pts) || pts.length < 3) return;
      const points = pts.map(([x, y]) => ({ x, y }));
      shapes.push({ id: `${areaId}-shape`, takeoffId: areaId, type: "area", areaType: "room", points, color, pageNumber, ...cutMeta });
      return;
    }

    if (areaType === "arc") {
      const segments = rawArea.value ?? [];
      if (!Array.isArray(segments) || segments.length < 2) return;
      const points        = segments.map((seg) => ({ x: seg.from[0], y: seg.from[1] }));
      const controlPoints = segments.map((seg) =>
        seg.control != null
          ? { x: seg.control[0], y: seg.control[1] }
          : { x: (seg.from[0] + seg.to[0]) / 2, y: (seg.from[1] + seg.to[1]) / 2 }
      );
      shapes.push({ id: `${areaId}-shape`, takeoffId: areaId, type: "arc", areaType: "room", points, controlPoints, color, pageNumber, ...cutMeta });
      return;
    }

    if (areaType === "circle") {
      const center = rawArea.center;
      const radius = rawArea.radius;
      if (!Array.isArray(center) || center.length < 2 || radius == null) return;
      shapes.push({ id: `${areaId}-shape`, takeoffId: areaId, type: "circle", areaType: "room", points: [{ x: center[0], y: center[1] }], radius, color, pageNumber, ...cutMeta });
      return;
    }
  });

  // ── Wall shapes ──────────────────────────────────────────────────────────
  Object.entries(wall).forEach(([wallId, pointsArray]) => {
    if (!Array.isArray(pointsArray) || pointsArray.length < 2) return;
    const points = pointsArray.map(([x, y]) => ({ x, y }));
    shapes.push({ id: `${wallId}-shape`, takeoffId: wallId, type: "line", areaType: "wall", points, color: shapeColor(wallId), pageNumber });
  });

  // ── Pipeline shapes ──────────────────────────────────────────────────────
  Object.entries(pipeline).forEach(([pipelineId, pointsArray]) => {
    if (!Array.isArray(pointsArray) || pointsArray.length < 2) return;
    const points = pointsArray.map(([x, y]) => ({ x, y }));
    shapes.push({ id: `${pipelineId}-shape`, takeoffId: pipelineId, type: "line", areaType: "pipeline", points, color: shapeColor(pipelineId), pageNumber });
  });

  // ── Symbol shapes ────────────────────────────────────────────────────────
  Object.entries(symbols).forEach(([symbolType, instances]) => {
    if (!Array.isArray(instances) || instances.length === 0) return;
    const typeColor   = shapeColor(symbolType);
    const isOldFormat = Array.isArray(instances[0]) && Array.isArray(instances[0][0]);
    if (isOldFormat) {
      instances.forEach((polygonPoints, instanceIdx) => {
        if (!Array.isArray(polygonPoints) || polygonPoints.length < 3) return;
        const points = polygonPoints.map(([x, y]) => ({ x, y }));
        shapes.push({ id: `${symbolType}-instance-${instanceIdx}`, takeoffId: symbolType, type: "polygon", areaType: "symbol", symbolType, points, color: typeColor, pageNumber });
      });
    } else {
      if (instances.length < 3) return;
      const points = instances.map(([x, y]) => ({ x, y }));
      shapes.push({ id: `${symbolType}-instance-0`, takeoffId: symbolType, type: "polygon", areaType: "symbol", symbolType, points, color: typeColor, pageNumber });
    }
  });

  return shapes;
}

// ─── buildDetectionColorMap ───────────────────────────────────────────────────
export function buildDetectionColorMap(detectionData, pageNumber = null) {
  const map = new Map();
  if (!detectionData) return map;
  const { area = {}, wall = {}, pipeline = {}, symbols = {} } = detectionData;
  const paletteForId = (id) => {
    const seed = pageNumber != null ? `${id}_p${pageNumber}` : id;
    return stableColorForId(seed);
  };
  Object.keys(area).forEach((id) => {
    const palette = paletteForId(id);
    map.set(id, palette);
    if (pageNumber != null) map.set(`${id}_p${pageNumber}`, palette);
  });
  Object.keys(wall).forEach((id) => {
    const palette = paletteForId(id);
    map.set(id, palette);
    if (pageNumber != null) map.set(`${id}_p${pageNumber}`, palette);
  });
  Object.keys(pipeline).forEach((id) => {
    const palette = paletteForId(id);
    map.set(id, palette);
    if (pageNumber != null) map.set(`${id}_p${pageNumber}`, palette);
  });
  Object.entries(symbols).forEach(([type]) => {
    const palette = paletteForId(type);
    if (pageNumber != null) map.set(`${type}_p${pageNumber}`, palette);
    if (!map.has(type)) map.set(type, palette);
  });
  return map;
}

// ─── parseExtractionResponse ──────────────────────────────────────────────────
export function parseExtractionResponse(rawRes) {
  if (rawRes == null) return null;
  let obj = rawRes;
  if (typeof obj === "string") { try { obj = JSON.parse(obj); } catch { return null; } }
  if (typeof obj?.normalData === "string")       { try { obj = JSON.parse(obj.normalData); }      catch { return null; } }
  if (typeof obj?.data?.normalData === "string") { try { obj = JSON.parse(obj.data.normalData); } catch { return null; } }

  let payload = null;
  if (obj?.valid === true && obj?.data && typeof obj.data === "object") {
    const dataKeys = Object.keys(obj.data);
    const isExtractionPayload = dataKeys.some((k) => k in API_TO_DATA_KEY || k in DATA_KEY_TO_GROUP);
    if (isExtractionPayload) {
      payload = obj.data;
    } else if (obj.data?.valid === true && obj.data?.data && typeof obj.data.data === "object") {
      const innerKeys = Object.keys(obj.data.data);
      if (innerKeys.some((k) => k in API_TO_DATA_KEY || k in DATA_KEY_TO_GROUP)) payload = obj.data.data;
    }
  }
  if (!payload && obj && typeof obj === "object") {
    const directKeys = Object.keys(obj);
    if (directKeys.some((k) => k in API_TO_DATA_KEY || k in DATA_KEY_TO_GROUP)) payload = obj;
  }
  if (!payload || typeof payload !== "object") return null;

  const normalized = {};
  Object.entries(API_TO_DATA_KEY).forEach(([apiKey, dataKey]) => {
    const category = payload[apiKey] ?? payload[dataKey];
    if (!category) return;
    if (category && typeof category === "object" && Array.isArray(category.items)) {
      if (!category.items.length) return;
      normalized[dataKey] = {
        takeoff_id:    category.takeoff_id    ?? null,
        takeoff_order: category.takeoff_order ?? null,
        items: category.items.map((item) => {
          const attrs = (item.attributes && typeof item.attributes === "object") ? item.attributes : {};
          return { ...attrs, ...item, attributes: attrs, name: item.name || item.id || "", takeoff_id: category.takeoff_id ?? null };
        }),
      };
      return;
    }
    if (Array.isArray(category)) {
      if (!category.length) return;
      normalized[dataKey] = {
        takeoff_id: null, takeoff_order: null,
        items: category.map((item) => {
          const attrs = (item.attributes && typeof item.attributes === "object") ? item.attributes : {};
          return { ...attrs, ...item, attributes: attrs, name: item.name || item.id || "" };
        }),
      };
    }
  });
  return normalized;
}

// ─── parseCategoriesForModal ──────────────────────────────────────────────────
export function parseCategoriesForModal(res) {
  let d = res?.data || res;
  if (typeof d === "string") { try { d = JSON.parse(d); } catch { return []; } }
  const list = d?.valid
    ? (Array.isArray(d.data) ? d.data : Array.isArray(d.categories) ? d.categories : [])
    : [];
  if (!list.length) return [];
  const seen = new Set();
  return list.map((cat) => {
    const raw = (cat.takeoff_name || cat.category_name || cat.name || "")
      .toLowerCase().trim().replace(/\s+/g, "_");
    const mappedKey = ELIGIBLE_API_TO_SYSTEM_KEY_MAP[raw];
    if (!mappedKey || !ELIGIBLE_ALLOWED_KEYS.includes(mappedKey)) return null;
    if (seen.has(mappedKey)) return null;
    seen.add(mappedKey);
    return { key: mappedKey, label: ELIGIBLE_LABEL_MAP[mappedKey] || normalizeLabel(mappedKey) };
  }).filter(Boolean);
}