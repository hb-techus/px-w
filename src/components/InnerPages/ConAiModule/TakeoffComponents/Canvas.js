import React, {
    useEffect,
    useRef,
    useCallback,
    useMemo,
    useState,
    forwardRef,
    useImperativeHandle,
} from "react";
import { TOOL_COLORS } from "./UtilsColor.js";
import FullPageLoader from "../../../../genriccomponents/loaders/FullPageLoader";
const SCALE_FACTOR = 48;
const DPI = 72;
const MIN_SCALE = 0.01;
const MAX_SCALE = 8.0;

const EFFECTIVE_DPR = Math.min(window.devicePixelRatio || 1, 1.5);
const IS_MAC_PLATFORM = /Mac|iPhone|iPad|iPod/i.test(
    (window.navigator?.platform || "") + " " + (window.navigator?.userAgent || "")
);
const MAC_HIGH_ZOOM_CUT_SCALE = 6.5;

function isMacHighZoomCutDrawing(scale, tool, objType, isActivelyDrawing) {
    return (
        IS_MAC_PLATFORM &&
        scale >= MAC_HIGH_ZOOM_CUT_SCALE &&
        isActivelyDrawing &&
        isCutSubType(objType) &&
        (tool === "arc" || tool === "circle")
    );
}

function dist(a, b) {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    return Math.sqrt(dx * dx + dy * dy);
}

function isPointInPolygon(point, polygon) {
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const xi = polygon[i].x, yi = polygon[i].y;
        const xj = polygon[j].x, yj = polygon[j].y;
        if (
            yi > point.y !== yj > point.y &&
            point.x < ((xj - xi) * (point.y - yi)) / (yj - yi) + xi
        ) {
            inside = !inside;
        }
    }
    return inside;
}

function isCutSubType(objType) {
    return objType === "cut_polygon" || objType === "cut_arc" || objType === "cut_circle";
}

function getShapeBoundaryPoints(shape, segmentSamples = 12) {
    if (!shape?.points?.length) return [];

    if (shape.type === "rectangle" && shape.points.length >= 2) {
        const [tl, br] = shape.points;
        return [tl, { x: br.x, y: tl.y }, br, { x: tl.x, y: br.y }];
    }

    if (shape.type === "circle" && shape.radius != null && shape.points[0]) {
        const c = shape.points[0];
        const out = [];
        const count = Math.max(24, segmentSamples * 4);
        for (let i = 0; i < count; i++) {
            const angle = (i * Math.PI * 2) / count;
            out.push({
                x: c.x + shape.radius * Math.cos(angle),
                y: c.y + shape.radius * Math.sin(angle),
            });
        }
        return out;
    }

    if (shape.type !== "arc" || !shape.controlPoints?.length || shape.points.length < 2) {
        return shape.points;
    }

    const out = [];
    const pts = shape.points;
    const segCount = shape.controlPoints.length;
    for (let si = 0; si < segCount; si++) {
        const p0 = pts[si];
        const p1 = pts[(si + 1) % pts.length];
        const cp = shape.controlPoints[si];
        if (!p0 || !p1 || !cp) continue;
        out.push(p0);
        for (let k = 1; k < segmentSamples; k++) {
            const t = k / segmentSamples;
            out.push({
                x: (1 - t) * (1 - t) * p0.x + 2 * (1 - t) * t * cp.x + t * t * p1.x,
                y: (1 - t) * (1 - t) * p0.y + 2 * (1 - t) * t * cp.y + t * t * p1.y,
            });
        }
    }

    if (segCount < pts.length) {
        for (let si = segCount; si < pts.length; si++) {
            const p0 = pts[si];
            const p1 = pts[(si + 1) % pts.length];
            if (!p0 || !p1) continue;
            out.push(p0);
            for (let k = 1; k < segmentSamples; k++) {
                const t = k / segmentSamples;
                out.push({ x: p0.x + t * (p1.x - p0.x), y: p0.y + t * (p1.y - p0.y) });
            }
        }
    }

    return out;
}

function isPointInArea(point, areaShape) {
    if (!areaShape || !areaShape.points?.length) return false;
    if (areaShape.type === "circle") {
        if (areaShape.radius == null) return false;
        const c = areaShape.points[0];
        const dx = point.x - c.x, dy = point.y - c.y;
        return (dx * dx + dy * dy) < areaShape.radius * areaShape.radius;
    }
    // ── FIX: rectangles store only [tl, br] — isPointInPolygon with 2 points always fails
    if (areaShape.type === "rectangle" && areaShape.points.length === 2) {
        const [tl, br] = areaShape.points;
        return (
            point.x >= Math.min(tl.x, br.x) &&
            point.x <= Math.max(tl.x, br.x) &&
            point.y >= Math.min(tl.y, br.y) &&
            point.y <= Math.max(tl.y, br.y)
        );
    }
    if (areaShape.type === "arc" && areaShape.controlPoints?.length) {
        const sampled = getShapeBoundaryPoints(areaShape, 14);
        return sampled.length >= 3 && isPointInPolygon(point, sampled);
    }
    return isPointInPolygon(point, areaShape.points);
}

// Extended hit test for arc cut shapes: falls back to interleaved vertex+control point polygon
// when the straight-line vertex polygon misses the bezier region.
function isPointInCutArcHit(point, shape) {
    if (isPointInArea(point, shape)) return true;
    if (shape.type !== "arc" || !shape.controlPoints?.length) return false;
    // Build polygon by interleaving vertices and control points
    const interleavedPts = [];
    for (let i = 0; i < shape.points.length; i++) {
        interleavedPts.push(shape.points[i]);
        if (i < shape.controlPoints.length) interleavedPts.push(shape.controlPoints[i]);
    }
    return interleavedPts.length >= 3 && isPointInPolygon(point, interleavedPts);
}

function clampPointToArea(point, areaShape) {
    if (!areaShape) return point;
    if (isPointInArea(point, areaShape)) return point;
    if (areaShape.type === "circle") {
        const c = areaShape.points[0];
        const dx = point.x - c.x, dy = point.y - c.y;
        const d = Math.sqrt(dx * dx + dy * dy) || 1;
        const inset = areaShape.radius * 0.999;
        return { x: c.x + (dx / d) * inset, y: c.y + (dy / d) * inset };
    }
    if (areaShape.type === "rectangle" && areaShape.points.length === 2) {
        const [p0, p1] = areaShape.points;
        const minX = Math.min(p0.x, p1.x), maxX = Math.max(p0.x, p1.x);
        const minY = Math.min(p0.y, p1.y), maxY = Math.max(p0.y, p1.y);
        return {
            x: Math.min(maxX - 1, Math.max(minX + 1, point.x)),
            y: Math.min(maxY - 1, Math.max(minY + 1, point.y)),
        };
    }
    const pts = areaShape.type === "arc" && areaShape.controlPoints?.length
        ? getShapeBoundaryPoints(areaShape, 14)
        : areaShape.points;
    let bestX = pts[0].x, bestY = pts[0].y, bestD = Infinity;
    for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
        const ax = pts[j].x, ay = pts[j].y;
        const bx = pts[i].x, by = pts[i].y;
        const dx = bx - ax, dy = by - ay;
        const len2 = dx * dx + dy * dy;
        if (!len2) continue;
        const t = Math.max(0, Math.min(1, ((point.x - ax) * dx + (point.y - ay) * dy) / len2));
        const cx = ax + t * dx, cy = ay + t * dy;
        const ddx = point.x - cx, ddy = point.y - cy;
        const d2 = ddx * ddx + ddy * ddy;
        if (d2 < bestD) { bestD = d2; bestX = cx; bestY = cy; }
    }
    const cx2 = pts.reduce((s, p) => s + p.x, 0) / pts.length;
    const cy2 = pts.reduce((s, p) => s + p.y, 0) / pts.length;
    const ex = bestX, ey = bestY;
    const dd = Math.sqrt((ex - cx2) ** 2 + (ey - cy2) ** 2) || 1;
    return { x: ex + ((cx2 - ex) / dd) * 1, y: ey + ((cy2 - ey) / dd) * 1 };
}

function clampCircleRadiusToArea(center, edgePos, areaShape) {
    if (!areaShape) return edgePos;
    const rawRadius = dist(center, edgePos);
    if (rawRadius <= 0) return edgePos;

    let maxRadius;
    if (areaShape.type === "circle" && areaShape.radius != null) {
        const pc = areaShape.points[0];
        const distCenters = Math.sqrt(
            Math.pow(center.x - pc.x, 2) + Math.pow(center.y - pc.y, 2)
        );
        maxRadius = Math.max(0, areaShape.radius - distCenters - 1);
    } else if (areaShape.type === "rectangle" && areaShape.points.length === 2) {
        const [p0, p1] = areaShape.points;
        const minX = Math.min(p0.x, p1.x), maxX = Math.max(p0.x, p1.x);
        const minY = Math.min(p0.y, p1.y), maxY = Math.max(p0.y, p1.y);
        const dists = [center.x - minX, maxX - center.x, center.y - minY, maxY - center.y];
        maxRadius = Math.max(0, Math.min(...dists) - 1);
    } else {
        const pts = areaShape.type === "arc" && areaShape.controlPoints?.length
            ? getShapeBoundaryPoints(areaShape, 14)
            : areaShape.points;
        maxRadius = Infinity;
        for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
            const ax = pts[j].x, ay = pts[j].y;
            const bx = pts[i].x, by = pts[i].y;
            const edx = bx - ax, edy = by - ay;
            const len2 = edx * edx + edy * edy;
            if (!len2) continue;
            const t = Math.max(0, Math.min(1,
                ((center.x - ax) * edx + (center.y - ay) * edy) / len2
            ));
            const closestX = ax + t * edx, closestY = ay + t * edy;
            const d = Math.sqrt(
                Math.pow(center.x - closestX, 2) + Math.pow(center.y - closestY, 2)
            );
            if (d < maxRadius) maxRadius = d;
        }
        maxRadius = Math.max(0, maxRadius - 1);
    }

    if (rawRadius <= maxRadius) return edgePos;

    const angle = Math.atan2(edgePos.y - center.y, edgePos.x - center.x);
    return {
        x: center.x + Math.cos(angle) * maxRadius,
        y: center.y + Math.sin(angle) * maxRadius,
    };
}


function getDistanceToArea(point, areaShape) {
    if (!areaShape) return 0;
    if (isPointInArea(point, areaShape)) return 0;

    if (areaShape.type === "circle") {
        if (areaShape.radius == null) return 0;
        const c = areaShape.points[0];
        if (!c) return 0;
        const d = dist(point, c);
        return Math.max(0, d - areaShape.radius);
    }

    if (areaShape.type === "rectangle" && areaShape.points.length === 2) {
        const [tl, br] = areaShape.points;
        const minX = Math.min(tl.x, br.x), maxX = Math.max(tl.x, br.x);
        const minY = Math.min(tl.y, br.y), maxY = Math.max(tl.y, br.y);
        let dx = 0;
        if (point.x < minX) dx = minX - point.x;
        else if (point.x > maxX) dx = point.x - maxX;
        let dy = 0;
        if (point.y < minY) dy = minY - point.y;
        else if (point.y > maxY) dy = point.y - maxY;
        return Math.sqrt(dx * dx + dy * dy);
    }

    const pts = areaShape.type === "arc" && areaShape.controlPoints?.length
        ? getShapeBoundaryPoints(areaShape, 14)
        : areaShape.points;
    if (!pts || !pts.length) return 0;
    let bestD2 = Infinity;
    for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
        const ax = pts[j].x, ay = pts[j].y;
        const bx = pts[i].x, by = pts[i].y;
        const dx = bx - ax, dy = by - ay;
        const len2 = dx * dx + dy * dy;
        if (!len2) continue;
        const t = Math.max(0, Math.min(1, ((point.x - ax) * dx + (point.y - ay) * dy) / len2));
        const cx = ax + t * dx, cy = ay + t * dy;
        const d2 = (point.x - cx) ** 2 + (point.y - cy) ** 2;
        if (d2 < bestD2) bestD2 = d2;
    }
    return Math.sqrt(bestD2);
}

// Returns boundary pts for a shape using the same convention as clampCircleRadiusToArea:
// arc → sampled bezier, rectangle → 4 corners, otherwise → raw polygon vertices.
function getCircleBoundaryPts(areaShape) {
    if (areaShape.type === "arc" && areaShape.controlPoints?.length)
        return getShapeBoundaryPoints(areaShape, 14);
    if (areaShape.type === "rectangle" && areaShape.points.length === 2) {
        const [tl, br] = areaShape.points;
        return [tl, { x: br.x, y: tl.y }, br, { x: tl.x, y: br.y }];
    }
    return areaShape.points;
}

// True iff every point on the circle circumference is strictly inside areaShape.
// Uses edge-SEGMENT distances (not infinite-line), so it's exact for any polygon shape.
// Uses getDistanceToArea (not isPointInArea) for the interior check so ray-casting
// direction-sensitivity near polygon vertices/edge-endpoints cannot falsely block movement.
function isCircleInsideArea(center, radius, areaShape) {
    if (areaShape.type === "circle" && areaShape.radius != null) {
        const pc = areaShape.points[0];
        const d = Math.sqrt((center.x - pc.x) ** 2 + (center.y - pc.y) ** 2);
        return d + radius <= areaShape.radius;
    }
    // Allow up to 1px outside the polygon boundary to absorb floating-point drift
    // that accumulates when the clamped center is very close to an edge or vertex.
    if (getDistanceToArea(center, areaShape) > 1) return false;
    const pts = getCircleBoundaryPts(areaShape);
    for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
        const ax = pts[j].x, ay = pts[j].y;
        const bx = pts[i].x, by = pts[i].y;
        const edx = bx - ax, edy = by - ay;
        const len2 = edx * edx + edy * edy;
        if (!len2) continue;
        const t = Math.max(0, Math.min(1, ((center.x - ax) * edx + (center.y - ay) * edy) / len2));
        const closestX = ax + t * edx, closestY = ay + t * edy;
        const d = Math.sqrt((center.x - closestX) ** 2 + (center.y - closestY) ** 2);
        if (d < radius) return false;
    }
    return true;
}

// Binary-search the displacement from origCenter toward proposedCenter for the
// maximum fraction t such that the circle stays fully inside areaShape.
// When the direct path is fully blocked (e.g. movement is perpendicular into a boundary
// edge), falls back to sliding along the closest boundary edge so all 4 tangential
// directions remain free.
function clampCircleToArea(origCenter, proposedCenter, radius, areaShape) {
    if (isCircleInsideArea(proposedCenter, radius, areaShape)) return proposedCenter;

    const velX = proposedCenter.x - origCenter.x;
    const velY = proposedCenter.y - origCenter.y;

    // Primary binary search along origCenter → proposedCenter
    let lo = 0, hi = 1, best = origCenter;
    for (let i = 0; i < 12; i++) {
        const mid = (lo + hi) / 2;
        const test = { x: origCenter.x + velX * mid, y: origCenter.y + velY * mid };
        if (isCircleInsideArea(test, radius, areaShape)) { best = test; lo = mid; }
        else hi = mid;
    }

    // If no progress along the direct path, try sliding along the closest boundary edge.
    // This handles movement parallel to a boundary (e.g. moving up/down when touching
    // the left/right edge) that the direct binary search cannot resolve.
    if (lo < 0.01) {
        const pts = getCircleBoundaryPts(areaShape);
        let minDiff = Infinity, slideEdge = null;
        for (let ei = 0, ej = pts.length - 1; ei < pts.length; ej = ei++) {
            const ax = pts[ej].x, ay = pts[ej].y;
            const bx = pts[ei].x, by = pts[ei].y;
            const edx = bx - ax, edy = by - ay;
            const len2 = edx * edx + edy * edy;
            if (!len2) continue;
            const t = Math.max(0, Math.min(1, ((origCenter.x - ax) * edx + (origCenter.y - ay) * edy) / len2));
            const cx = ax + t * edx, cy = ay + t * edy;
            const d = Math.sqrt((origCenter.x - cx) ** 2 + (origCenter.y - cy) ** 2);
            const diff = Math.abs(d - radius);
            if (diff < minDiff) { minDiff = diff; slideEdge = { edx, edy, len2 }; }
        }

        if (slideEdge && minDiff < 2) {
            const len = Math.sqrt(slideEdge.len2);
            const ux = slideEdge.edx / len, uy = slideEdge.edy / len;
            const proj = velX * ux + velY * uy;
            const svX = proj * ux, svY = proj * uy;
            const slideProposed = { x: origCenter.x + svX, y: origCenter.y + svY };

            if (isCircleInsideArea(slideProposed, radius, areaShape)) return slideProposed;

            let lo2 = 0, hi2 = 1, best2 = origCenter;
            for (let i = 0; i < 12; i++) {
                const mid = (lo2 + hi2) / 2;
                const test = { x: origCenter.x + svX * mid, y: origCenter.y + svY * mid };
                if (isCircleInsideArea(test, radius, areaShape)) { best2 = test; lo2 = mid; }
                else hi2 = mid;
            }
            if (lo2 > 0.001) return best2;
        }
    }

    return best;
}

function getClosestPointOnArea(point, areaShape) {
    if (!areaShape) return point;
    if (areaShape.type === "circle") {
        if (areaShape.radius == null) return point;
        const c = areaShape.points[0];
        if (!c) return point;
        const d = dist(point, c);
        if (d === 0) return point;
        return {
            x: c.x + (point.x - c.x) * (areaShape.radius / d),
            y: c.y + (point.y - c.y) * (areaShape.radius / d)
        };
    }

    if (areaShape.type === "rectangle" && areaShape.points.length === 2) {
        const [tl, br] = areaShape.points;
        const minX = Math.min(tl.x, br.x), maxX = Math.max(tl.x, br.x);
        const minY = Math.min(tl.y, br.y), maxY = Math.max(tl.y, br.y);
        return {
            x: Math.max(minX, Math.min(maxX, point.x)),
            y: Math.max(minY, Math.min(maxY, point.y))
        };
    }

    const pts = areaShape.type === "arc" && areaShape.controlPoints?.length
        ? getShapeBoundaryPoints(areaShape, 14)
        : areaShape.points;
    if (!pts || !pts.length) return point;
    let bestD2 = Infinity;
    let closestPt = { x: point.x, y: point.y };
    for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
        const ax = pts[j].x, ay = pts[j].y;
        const bx = pts[i].x, by = pts[i].y;
        const dx = bx - ax, dy = by - ay;
        const len2 = dx * dx + dy * dy;
        if (!len2) continue;
        const t = Math.max(0, Math.min(1, ((point.x - ax) * dx + (point.y - ay) * dy) / len2));
        const cx = ax + t * dx, cy = ay + t * dy;
        const d2 = (point.x - cx) ** 2 + (point.y - cy) ** 2;
        if (d2 < bestD2) {
            bestD2 = d2;
            closestPt = { x: cx, y: cy };
        }
    }
    return closestPt;
}

function clampArcControlPointToArea(p0, cp, p1, areaShape) {
    if (!areaShape) return cp;

    const mid = { x: (p0.x + p1.x) / 2, y: (p0.y + p1.y) / 2 };
    let bestAlpha = 0;
    let low = 0, high = 1;

    for (let step = 0; step < 8; step++) {
        const alpha = (low + high) / 2;
        const testCp = {
            x: (1 - alpha) * mid.x + alpha * cp.x,
            y: (1 - alpha) * mid.y + alpha * cp.y,
        };

        let ok = true;
        const SAMPLES = 10;
        for (let i = 1; i < SAMPLES; i++) {
            const t = i / SAMPLES;

            const lx = (1 - t) * p0.x + t * p1.x;
            const ly = (1 - t) * p0.y + t * p1.y;
            const lPt = { x: lx, y: ly };

            const cx = (1 - t) ** 2 * p0.x + 2 * (1 - t) * t * testCp.x + t ** 2 * p1.x;
            const cy = (1 - t) ** 2 * p0.y + 2 * (1 - t) * t * testCp.y + t ** 2 * p1.y;
            const cPt = { x: cx, y: cy };

            if (isPointInArea(cPt, areaShape)) {
                continue;
            }

            const distCurve = getDistanceToArea(cPt, areaShape);
            const distLine = getDistanceToArea(lPt, areaShape);

            if (distCurve > distLine + 0.5) {
                ok = false;
                break;
            }
        }

        if (ok) {
            bestAlpha = alpha;
            low = alpha;
        } else {
            high = alpha;
        }
    }

    return {
        x: (1 - bestAlpha) * mid.x + bestAlpha * cp.x,
        y: (1 - bestAlpha) * mid.y + bestAlpha * cp.y,
    };
}

function traceCutShapePath(cutCtx, cutShape, cutPts, sc, i2c) {
    cutCtx.beginPath();
    if (cutShape.type === "circle" && cutShape.radius != null) {
        cutCtx.arc(cutPts[0].x, cutPts[0].y, cutShape.radius * sc, 0, Math.PI * 2);
    } else if (cutShape.type === "arc" && cutShape.controlPoints?.length) {
        cutCtx.moveTo(cutPts[0].x, cutPts[0].y);
        for (let ci = 0; ci < cutShape.controlPoints.length; ci++) {
            const cpRaw = cutShape.controlPoints[ci];
            const cp = i2c(cpRaw.x, cpRaw.y);
            const nextPt = cutPts[(ci + 1) % cutPts.length];
            cutCtx.quadraticCurveTo(cp.x, cp.y, nextPt.x, nextPt.y);
        }
        cutCtx.closePath();
    } else {
        cutCtx.moveTo(cutPts[0].x, cutPts[0].y);
        for (let ci = 1; ci < cutPts.length; ci++) cutCtx.lineTo(cutPts[ci].x, cutPts[ci].y);
        cutCtx.closePath();
    }
}

function traceParentShapePath(ctx, parentShape, sc, i2c) {
    if (!parentShape?.points?.length) return;
    const pts = parentShape.points.map((p) => i2c(p.x, p.y));
    ctx.beginPath();
    if (parentShape.type === "circle" && parentShape.radius != null) {
        ctx.arc(pts[0].x, pts[0].y, parentShape.radius * sc, 0, Math.PI * 2);
    } else if (parentShape.type === "rectangle" && pts.length >= 2) {
        ctx.rect(pts[0].x, pts[0].y, pts[1].x - pts[0].x, pts[1].y - pts[0].y);
    } else if (parentShape.type === "arc" && parentShape.controlPoints?.length) {
        ctx.moveTo(pts[0].x, pts[0].y);
        for (let ci = 0; ci < parentShape.controlPoints.length; ci++) {
            const cpRaw = parentShape.controlPoints[ci];
            const cp = i2c(cpRaw.x, cpRaw.y);
            const nextPt = pts[(ci + 1) % pts.length];
            ctx.quadraticCurveTo(cp.x, cp.y, nextPt.x, nextPt.y);
        }
        ctx.closePath();
    } else {
        ctx.moveTo(pts[0].x, pts[0].y);
        for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
        ctx.closePath();
    }
}



const DETECTION_COLORS = {
    symbol: { stroke: "#3b82f6", fill: "rgba(59,130,246,0.18)" },
    area: { stroke: "#6366f1", fill: "rgba(99,102,241,0.18)" },
    wall: { stroke: "#8b4513", fill: "rgba(139,69,19,0.18)" },
    pipeline: { stroke: "#0891b2", fill: "rgba(8,145,178,0.18)" },
};

const CanvasPanel = forwardRef(function CanvasPanel(
    {
        imgRef, imgDims, imgReady,
        scale, setScale, onFitScaleChange,
        currentShapes, visibleAiShapes, allShapes,
        setAiDetectedShapes, setCurrentShapes,
        tool, draftPoints, setDraftPoints,
        mouseCanvasPos, setMouseCanvasPos,
        selectedShapeId, setSelectedShapeId,
        selectedShapeIds, setSelectedShapeIds,
        hoveredShapeId, setHoveredShapeId,
        takeoffData, setSelectedTakeoffId,
        setSidebarCollapsed, setExpandedGroups,
        findGroupForTakeoffId,
        isLoadingCurrentImage,
        onToolChange, onObjectTypeChange,
        activeObjectType, onShapeComplete, onShapeDragEnd,
        isCanvasProcessing,
        onDeleteShape,
        onPermissionDenied,
        annotationPermissions,
    },
    ref
) {
    const canvasRef = useRef(null);
    const stageRef = useRef(null);
    const offscreenRef = useRef(null);
    const mouseImgRef = useRef(null);
    const isDrawingRef = useRef(false);
    const snapClosedRef = useRef(false);
    const movePosRafRef = useRef(null);

    const isDraggingRef = useRef(false);
    const isPanningRef = useRef(false);
    const panStartRef = useRef({ scrollL: 0, scrollT: 0, mouseX: 0, mouseY: 0 });
    const dragShapeIdRef = useRef(null);
    const dragStartImgRef = useRef({ x: 0, y: 0 });
    const dragOrigPointsRef = useRef([]);
    const rafIdRef = useRef(null);
    const dragMovedRef = useRef(false);
    const dragIsAiRef = useRef(false);

    const vertexDragRef = useRef(null);
    const vertexMovedRef = useRef(false);

    const arcPointsRef = useRef([]);
    const arcCtrlsRef = useRef([]);
    const arcDraggingCpRef = useRef(null);
    const arcSnapRef = useRef(false);

    const dragOrigCtrlsRef = useRef([]);
    const circleDraftRef = useRef(null);

    const twoPointFirstClickRef = useRef(null);

    const cutParentAreaRef = useRef(null);

    const drawingModeSelectedIdRef = useRef(null);
    const [drawingModeSelectedId, setDrawingModeSelectedId] = useState(null);

    const suppressToolClearRef = useRef(false);

    const dragRafRef = useRef(null);
    const hoverFrameRef = useRef(false);
    const dragLiveRef = useRef(null);
    const dragCutLiveRef = useRef(null);
    const fitScaleRef = useRef(null);

    const deleteBtnPosRef = useRef(null);
    const [deleteBtnPos, setDeleteBtnPos] = useState(null);
    const deleteBtnRafRef = useRef(null);
    const [pendingDelete, setPendingDelete] = useState(false);

    const allShapesRef = useRef(allShapes);
    useEffect(() => { allShapesRef.current = allShapes; }, [allShapes]);

    const annotationPermissionsRef = useRef(annotationPermissions);
    useEffect(() => { annotationPermissionsRef.current = annotationPermissions; }, [annotationPermissions]);

    const canDelete = annotationPermissions?.delete !== false;

    const visibleAiShapesRef = useRef(visibleAiShapes);
    useEffect(() => { visibleAiShapesRef.current = visibleAiShapes; }, [visibleAiShapes]);

    const selectedShapeIdRef = useRef(selectedShapeId);
    useEffect(() => { selectedShapeIdRef.current = selectedShapeId; }, [selectedShapeId]);

    useEffect(() => {
        if (selectedShapeId === null) {
            drawingModeSelectedIdRef.current = null;
            setDrawingModeSelectedId(null);
            deleteBtnPosRef.current = null;
            setDeleteBtnPos(null);
            setPendingDelete(false);
        }
    }, [selectedShapeId]);

    // ── FIX Issue 1: Mac minimize/restore — reset all drawing state on visibility change ──
    useEffect(() => {
        const onVisibilityChange = () => {
            if (document.hidden) {
                isPanningRef.current = false;
                isDraggingRef.current = false;
                isDrawingRef.current = false;
                vertexDragRef.current = null;
                vertexMovedRef.current = false;
                arcDraggingCpRef.current = null;
                dragLiveRef.current = null;
                dragCutLiveRef.current = null;
                mouseCanvasPosRef.current = null;
                arcPointsRef.current = [];
                arcCtrlsRef.current = [];
                circleDraftRef.current = null;
                twoPointFirstClickRef.current = null;
                snapClosedRef.current = false;
                arcSnapRef.current = false;
                setMouseCanvasPos(null);
                setHoveredShapeId(null);
                const t = toolRef.current;
                if (t !== "polygon" && t !== "arc") setDraftPoints([]);
                dirtyRef.current = true;
            }
        };
        document.addEventListener("visibilitychange", onVisibilityChange);
        return () => document.removeEventListener("visibilitychange", onVisibilityChange);
    }, [setMouseCanvasPos, setHoveredShapeId, setDraftPoints]);

    const selectedShapeIdsRef = useRef(selectedShapeIds || new Set());
    useEffect(() => { selectedShapeIdsRef.current = selectedShapeIds || new Set(); }, [selectedShapeIds]);

    const currentShapesRef = useRef(currentShapes);
    useEffect(() => { currentShapesRef.current = currentShapes; }, [currentShapes]);

    useEffect(() => {
        if (!isCutSubType(activeObjectType)) {
            cutParentAreaRef.current = null;
        }
    }, [activeObjectType]);

    const detectionColor = activeObjectType ? DETECTION_COLORS[activeObjectType] : null;

    const hoveredHandleRef = useRef(null);
    const [hoveredHandle, setHoveredHandle] = useState(null);

    const cursorStyle = useMemo(() => {
        if (tool === "pan") return "grab";
        if (tool === "select") {
            if (vertexDragRef.current) return "nwse-resize";
            if (hoveredHandle === "vertex") return "nwse-resize";
            if (hoveredHandle === "edge") return "ew-resize";
            return hoveredShapeId ? "move" : "default";
        }
        if (hoveredHandle === "vertex") return "nwse-resize";
        if (hoveredHandle === "edge") return "crosshair";
        if (hoveredShapeId) return "move";
        return "none";
    }, [tool, hoveredShapeId, hoveredHandle]);

    const pixelsToFeet = useCallback((px) => ((px / DPI) * SCALE_FACTOR) / 12, []);
    const canvasToImage = useCallback((cx, cy) => ({ x: cx / scaleRef.current, y: cy / scaleRef.current }), []);

    const getCanvasPos = useCallback((e) => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };
        const rect = canvas.getBoundingClientRect();
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
        };
    }, []);

    // ── FIX Issue 2: resolveParentArea with takeoffId fallback for AI detected shapes ──
    const resolveParentArea = useCallback((imgPos) => {
        const allVisible = [
            ...(visibleAiShapesRef.current || []),
            ...(currentShapesRef.current || []),
        ];
        // const areaCandidates = allVisible.filter(
        //     (s) =>
        //         (s.type === "polygon" || s.type === "area" || s.type === "arc" || s.type === "circle" || s.type === "rectangle") &&
        //         !s.isCutShape &&
        //         s.areaType !== "symbol" &&
        //         !s.symbolType
        // );

        const areaCandidates = allVisible.filter(
            (s) =>
                !s.isCutShape &&
                s.areaType !== "symbol" && !s.symbolType &&
                s.areaType !== "wall" && s.areaType !== "pipeline" &&
                s.type !== "line" && s.type !== "point" && s.type !== "measure" &&
                (s.type === "polygon" || s.type === "area" || s.type === "arc" ||
                    s.type === "circle" || s.type === "rectangle")
        );
        if (cutParentAreaRef.current) {
            // ── FIX: match by id OR takeoffId — AI shapes get new canvas ids on detection reload
            const repointed = areaCandidates.find(
                (s) => s.id === cutParentAreaRef.current.id ||
                    (s.takeoffId && cutParentAreaRef.current.takeoffId &&
                        s.takeoffId === cutParentAreaRef.current.takeoffId)
            );
            if (repointed) {
                cutParentAreaRef.current = repointed;
                if (!imgPos || isPointInArea(imgPos, repointed)) {
                    return repointed;
                }
            }
        }

        if (imgPos) {
            const containing = areaCandidates.filter((s) => isPointInArea(imgPos, s));
            const found = containing.length > 0
                ? containing.reduce((best, s) => {
                    const area = (shape) => {
                        if (shape.type === "circle" && shape.radius != null)
                            return Math.PI * shape.radius * shape.radius;
                        const xs = shape.points.map((p) => p.x);
                        const ys = shape.points.map((p) => p.y);
                        return (Math.max(...xs) - Math.min(...xs)) * (Math.max(...ys) - Math.min(...ys));
                    };
                    return area(s) < area(best) ? s : best;
                })
                : null;
            if (found) cutParentAreaRef.current = found;
            return found || null;
        }
        return null;
    }, []);

    const getDrawingSelectedShape = useCallback(() => {
        const id = drawingModeSelectedIdRef.current || selectedShapeIdRef.current;
        if (!id) return null;
        return (
            currentShapesRef.current?.find((s) => s.id === id) ||
            visibleAiShapesRef.current?.find((s) => s.id === id) ||
            allShapesRef.current?.find((s) => s.id === id) ||
            null
        );
    }, []);

    const computeDeleteBtnPos = useCallback(() => {
        const shapeId = selectedShapeIdRef.current || drawingModeSelectedIdRef.current;
        if (!shapeId) return null;

        const isVisible =
            currentShapesRef.current?.some((s) => s.id === shapeId) ||
            visibleAiShapesRef.current?.some((s) => s.id === shapeId);
        if (!isVisible) return null;

        const selShape =
            currentShapesRef.current?.find((s) => s.id === shapeId) ||
            visibleAiShapesRef.current?.find((s) => s.id === shapeId) ||
            allShapesRef.current?.find((s) => s.id === shapeId);
        if (!selShape?.points?.length) return null;

        const stageEl = stageRef.current;
        const canvasEl = canvasRef.current;
        if (!stageEl || !canvasEl) return null;

        const pts = selShape.points;
        let maxX = Math.max(...pts.map((p) => p.x));
        let minY = Math.min(...pts.map((p) => p.y));
        if (selShape.type === "circle" && selShape.radius != null) {
            maxX = pts[0].x + selShape.radius;
            minY = pts[0].y - selShape.radius;
        }

        const sc = scaleRef.current;
        const stageRect = stageEl.getBoundingClientRect();
        const canvasRect = canvasEl.getBoundingClientRect();
        const canvasOffsetLeft = canvasRect.left - stageRect.left + stageEl.scrollLeft;
        const canvasOffsetTop = canvasRect.top - stageRect.top + stageEl.scrollTop;

        const absX = maxX * sc + canvasOffsetLeft;
        const absY = minY * sc + canvasOffsetTop;

        const BTN_W = 40, BTN_H = 36, M = 8;
        const clampedX = Math.min(absX + 6, stageEl.scrollLeft + stageEl.clientWidth - BTN_W - M);
        const clampedY = Math.min(
            Math.max(absY - BTN_H - 4, stageEl.scrollTop + M),
            stageEl.scrollTop + stageEl.clientHeight - BTN_H - M
        );

        return { x: clampedX, y: clampedY };
    }, []);

    const scheduleDeleteBtnUpdate = useCallback(() => {
        if (deleteBtnRafRef.current) cancelAnimationFrame(deleteBtnRafRef.current);
        deleteBtnRafRef.current = requestAnimationFrame(() => {
            deleteBtnRafRef.current = null;
            if (isDraggingRef.current || isPanningRef.current || vertexDragRef.current) return;
            const pos = computeDeleteBtnPos();
            deleteBtnPosRef.current = pos;
            setDeleteBtnPos(pos);
        });
    }, [computeDeleteBtnPos]);

    useEffect(() => {
        const stageEl = stageRef.current;
        if (!stageEl) return;
        const onScroll = () => {
            if (selectedShapeIdRef.current || drawingModeSelectedIdRef.current) scheduleDeleteBtnUpdate();
        };
        stageEl.addEventListener("scroll", onScroll, { passive: true });
        return () => stageEl.removeEventListener("scroll", onScroll);
    }, [scheduleDeleteBtnUpdate]);

    useEffect(() => {
        if (selectedShapeId) {
            scheduleDeleteBtnUpdate();
        } else {
            if (deleteBtnRafRef.current) cancelAnimationFrame(deleteBtnRafRef.current);
            deleteBtnPosRef.current = null;
            setDeleteBtnPos(null);
        }
    }, [selectedShapeId, scale, scheduleDeleteBtnUpdate]);

    const zoomCentred = useCallback((factor) => {
        setScale((prev) => {
            const dynMax = fitScaleRef.current ? Math.min(fitScaleRef.current * 8, MAX_SCALE) : MAX_SCALE;
            const next = Math.min(Math.max(prev * factor, MIN_SCALE), dynMax);
            requestAnimationFrame(() => {
                const s = stageRef.current;
                if (!s) return;
                const cx = s.scrollLeft + s.clientWidth / 2;
                const cy = s.scrollTop + s.clientHeight / 2;
                s.scrollLeft = (cx / prev) * next - s.clientWidth / 2;
                s.scrollTop = (cy / prev) * next - s.clientHeight / 2;
            });
            return next;
        });
    }, [setScale]);

    const resetZoom = useCallback(() => {
        const s = stageRef?.current;
        if (!s || !imgDims.w) return;
        const fit = Math.min(s.clientWidth / imgDims.w, s.clientHeight / imgDims.h);
        setScale(Math.min(fit, MAX_SCALE));
        requestAnimationFrame(() => {
            if (s) { s.scrollLeft = 0; s.scrollTop = 0; }
            requestAnimationFrame(() => scheduleDeleteBtnUpdate());
        });
    }, [imgDims, setScale, scheduleDeleteBtnUpdate]);

    const fitToScreen = useCallback(() => {
        const s = stageRef?.current;
        if (!s || !imgDims.w) return;
        const fitW = (s.clientWidth - 48) / imgDims.w;
        const fitH = (s.clientHeight - 48) / imgDims.h;
        const fit = Math.min(Math.max(MIN_SCALE, Math.min(MAX_SCALE, Math.min(fitW, fitH))), MAX_SCALE);
        setScale(fit);
        requestAnimationFrame(() => {
            if (s) { s.scrollLeft = 0; s.scrollTop = 0; }
            requestAnimationFrame(() => scheduleDeleteBtnUpdate());
        });
    }, [imgDims, setScale, scheduleDeleteBtnUpdate]);

    // ── FIX Issue 3: expose clearDraftState via imperative handle ──────────────
    useImperativeHandle(ref, () => ({
        zoomIn: () => zoomCentred(1.25),
        zoomOut: () => zoomCentred(0.8),
        resetZoom,
        fitToScreen,
        getFitScale: () => fitScaleRef.current,
        clearDraftState: () => {
            arcPointsRef.current = [];
            arcCtrlsRef.current = [];
            circleDraftRef.current = null;
            isDrawingRef.current = false;
            snapClosedRef.current = false;
            arcSnapRef.current = false;
            twoPointFirstClickRef.current = null;
            dragLiveRef.current = null;
            dragCutLiveRef.current = null;
            dirtyRef.current = true;
        },
    }), [zoomCentred, resetZoom, fitToScreen]);

    useEffect(() => {
        const selId = selectedShapeIdRef.current || drawingModeSelectedIdRef.current;
        if (!selId) return;
        if (selectedShapeId === null && drawingModeSelectedIdRef.current === null) return;

        const stillExists = allShapesRef.current?.some((s) => s.id === selId);
        if (stillExists) return;

        const allCurrent = [
            ...(visibleAiShapesRef.current || []),
            ...(currentShapesRef.current || []),
        ];

        let replacement = allCurrent.find((s) => s.takeoffId === selId);

        if (!replacement && selId.startsWith("manual-")) {
            const realShapes = allCurrent.filter(
                (s) => !s.id.startsWith("manual-") && !s.takeoffId?.startsWith("manual-")
            );
            if (realShapes.length > 0) {
                replacement = realShapes[realShapes.length - 1];
            }
        }

        if (replacement) {
            selectedShapeIdRef.current = replacement.id;
            drawingModeSelectedIdRef.current = replacement.id;
            setSelectedShapeId(replacement.id);
            setDrawingModeSelectedId(replacement.id);
            if (setSelectedShapeIds) setSelectedShapeIds(new Set([replacement.id]));
            dirtyRef.current = true;
            requestAnimationFrame(() => scheduleDeleteBtnUpdate());
        }
    }, [visibleAiShapes, setSelectedShapeId, setSelectedShapeIds, scheduleDeleteBtnUpdate, selectedShapeId]);

    const findShapeAt = useCallback((imgPos) => {
        const shapes = allShapesRef.current;
        if (!shapes.length) return null;
        const sc = scaleRef.current;
        const thr = (10 / sc) ** 2;
        for (let i = shapes.length - 1; i >= 0; i--) {
            const s = shapes[i];
            if (s.isCutShape) continue;
            if (s.type === "point") {
                const dx = imgPos.x - s.points[0].x;
                const dy = imgPos.y - s.points[0].y;
                if (dx * dx + dy * dy < thr) return s.id;
            } else if (s.type === "line" || s.type === "measure") {
                const hitThr = (8 / sc) ** 2;
                let hit = false;
                for (let k = 0; k < s.points.length - 1; k++) {
                    const a = s.points[k], b = s.points[k + 1];
                    const dx = b.x - a.x, dy = b.y - a.y;
                    const len = dx * dx + dy * dy;
                    if (!len) {
                        const px = imgPos.x - a.x, py = imgPos.y - a.y;
                        if (px * px + py * py < hitThr) { hit = true; break; }
                        continue;
                    }
                    const t = Math.max(0, Math.min(1, ((imgPos.x - a.x) * dx + (imgPos.y - a.y) * dy) / len));
                    const px = imgPos.x - (a.x + t * dx);
                    const py = imgPos.y - (a.y + t * dy);
                    if (px * px + py * py < hitThr) { hit = true; break; }
                }
                if (hit) return s.id;
            } else if (s.type === "rectangle") {
                const [tl, br] = s.points;
                if (
                    imgPos.x >= Math.min(tl.x, br.x) && imgPos.x <= Math.max(tl.x, br.x) &&
                    imgPos.y >= Math.min(tl.y, br.y) && imgPos.y <= Math.max(tl.y, br.y)
                ) return s.id;
            } else if (s.type === "polygon" || s.type === "area") {
                if (isPointInPolygon(imgPos, s.points)) return s.id;
            } else if (s.type === "arc") {
                if (s.points?.length >= 3 && isPointInPolygon(imgPos, s.points)) return s.id;
            } else if (s.type === "circle") {
                if (s.points?.length >= 1 && s.radius != null) {
                    const dx = imgPos.x - s.points[0].x;
                    const dy = imgPos.y - s.points[0].y;
                    if (dx * dx + dy * dy <= s.radius * s.radius) return s.id;
                }
            }
        }
        return null;
    }, []);

    const findVertexAt = useCallback((imgPos, shape) => {
        if (!shape?.points?.length) return null;
        const THR = (9 / scaleRef.current) ** 2;

        if (shape.type === "arc" && shape.controlPoints?.length) {
            for (let i = 0; i < shape.controlPoints.length; i++) {
                const cp = shape.controlPoints[i];
                const dx = imgPos.x - cp.x, dy = imgPos.y - cp.y;
                if (dx * dx + dy * dy < THR) return -(i + 1);
            }
            for (let i = 0; i < shape.points.length; i++) {
                const p = shape.points[i];
                const dx = imgPos.x - p.x, dy = imgPos.y - p.y;
                if (dx * dx + dy * dy < THR) return i;
            }
            return null;
        }

        if (shape.type === "circle" && shape.radius != null) {
            const center = shape.points[0];
            const edgeX = center.x + shape.radius;
            const edgeDx = imgPos.x - edgeX, edgeDy = imgPos.y - center.y;
            if (edgeDx * edgeDx + edgeDy * edgeDy < THR) return 1;
            const cDx = imgPos.x - center.x, cDy = imgPos.y - center.y;
            if (cDx * cDx + cDy * cDy < THR) return 0;
            return null;
        }

        let verts = shape.points;
        if (shape.type === "rectangle" && shape.points.length >= 2) {
            const [tl, br] = shape.points;
            verts = [tl, { x: br.x, y: tl.y }, br, { x: tl.x, y: br.y }];
        } else if ((shape.areaType === "symbol" || shape.symbolType) && shape.points.length >= 3) {
            const xs = shape.points.map((p) => p.x);
            const ys = shape.points.map((p) => p.y);
            const minX = Math.min(...xs), maxX = Math.max(...xs);
            const minY = Math.min(...ys), maxY = Math.max(...ys);
            verts = [
                { x: minX, y: minY }, { x: maxX, y: minY },
                { x: maxX, y: maxY }, { x: minX, y: maxY },
            ];
        }

        for (let i = 0; i < verts.length; i++) {
            const dx = imgPos.x - verts[i].x, dy = imgPos.y - verts[i].y;
            if (dx * dx + dy * dy < THR) return i;
        }
        return null;
    }, []);

    const findEdgeMidpointAt = useCallback((imgPos, shape) => {
        if (!shape?.points?.length) return null;
        const THR = (9 / scaleRef.current) ** 2;

        const pts = shape.points;
        const isClosed = shape.type === "polygon" || shape.type === "area";
        const edgeCount = isClosed ? pts.length : pts.length - 1;
        for (let i = 0; i < edgeCount; i++) {
            const a = pts[i];
            const b = pts[(i + 1) % pts.length];
            const mx = (a.x + b.x) / 2;
            const my = (a.y + b.y) / 2;
            const dx = imgPos.x - mx;
            const dy = imgPos.y - my;
            if (dx * dx + dy * dy < THR) return i;
        }
        return null;
    }, []);

    const hasAutoFittedRef = useRef(false);
    useEffect(() => {
        if (!imgReady || !imgDims.w || hasAutoFittedRef.current) return;
        const s = stageRef.current;
        if (!s) return;
        const fitW = (s.clientWidth - 48) / imgDims.w;
        const fitH = (s.clientHeight - 48) / imgDims.h;
        const fit = Math.min(Math.max(MIN_SCALE, Math.min(MAX_SCALE, Math.min(fitW, fitH))), MAX_SCALE);
        fitScaleRef.current = fit;
        if (onFitScaleChange) onFitScaleChange(fit);
        hasAutoFittedRef.current = true;
        setScale(fit);
        requestAnimationFrame(() => { if (stageRef.current) { stageRef.current.scrollLeft = 0; stageRef.current.scrollTop = 0; } });
    }, [imgReady, imgDims]);

    useEffect(() => {
        if (!imgDims.w) return;
        const s = stageRef.current;
        if (!s) return;
        const fitW = (s.clientWidth - 48) / imgDims.w;
        const fitH = (s.clientHeight - 48) / imgDims.h;
        const newFit = Math.min(Math.max(MIN_SCALE, Math.min(MAX_SCALE, Math.min(fitW, fitH))), MAX_SCALE);
        fitScaleRef.current = newFit;
        if (onFitScaleChange) onFitScaleChange(newFit);
    }, [imgDims]);

    useEffect(() => {
        if (!imgRef || !imgRef.current || !imgDims.w) return;
        const { w, h } = imgDims;
        let off = offscreenRef.current;
        if (!off || off.width !== w || off.height !== h) {
            off = document.createElement("canvas");
            off.width = w;
            off.height = h;
            offscreenRef.current = off;
        }
        const ctx = off.getContext("2d", { alpha: false });
        if (!ctx) return;
        ctx.clearRect(0, 0, w, h);
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        if (imgRef.current) ctx.drawImage(imgRef.current, 0, 0, w, h);
    }, [imgDims, imgRef]);

    useEffect(() => {
        const stage = stageRef.current;
        if (!stage) return;
        const onWheel = (e) => {
            if (e.ctrlKey || e.metaKey) {
                e.preventDefault();
                const factor = e.deltaY < 0 ? 1.1 : 0.9;
                setScale((prev) => {
                    const dynMax = fitScaleRef.current ? Math.min(fitScaleRef.current * 8, MAX_SCALE) : MAX_SCALE;
                    const next = Math.min(Math.max(prev * factor, MIN_SCALE), dynMax);
                    requestAnimationFrame(() => {
                        const s = stageRef.current;
                        if (!s) return;
                        const rect = s.getBoundingClientRect();
                        const mx = e.clientX - rect.left;
                        const my = e.clientY - rect.top;
                        const imgX = (s.scrollLeft + mx) / prev;
                        const imgY = (s.scrollTop + my) / prev;
                        s.scrollLeft = imgX * next - mx;
                        s.scrollTop = imgY * next - my;
                    });
                    return next;
                });
            }
        };
        stage.addEventListener("wheel", onWheel, { passive: false });
        return () => stage.removeEventListener("wheel", onWheel);
    }, [setScale]);

    const draftPointsRef = useRef(draftPoints);
    useEffect(() => { draftPointsRef.current = draftPoints; }, [draftPoints]);

    const mouseCanvasPosRef = useRef(mouseCanvasPos);
    useEffect(() => { mouseCanvasPosRef.current = mouseCanvasPos; }, [mouseCanvasPos]);

    const toolRef = useRef(tool);
    useEffect(() => { toolRef.current = tool; }, [tool]);

    const prevToolRef = useRef(tool);
    const prevActiveObjectTypeRef2 = useRef(activeObjectType);
    useEffect(() => {
        const toolChanged = tool !== prevToolRef.current;
        const objTypeChanged = activeObjectType !== prevActiveObjectTypeRef2.current;
        prevToolRef.current = tool;
        prevActiveObjectTypeRef2.current = activeObjectType;

        if (!toolChanged && !objTypeChanged) return;

        if (tool === "select" && !activeObjectType) {
            drawingModeSelectedIdRef.current = null;
            setDrawingModeSelectedId(null);
        } else {
            if (deleteBtnRafRef.current) cancelAnimationFrame(deleteBtnRafRef.current);
            deleteBtnPosRef.current = null;
            setDeleteBtnPos(null);
            setSelectedShapeId(null);
            if (setSelectedShapeIds) setSelectedShapeIds(new Set());
            drawingModeSelectedIdRef.current = null;
            setDrawingModeSelectedId(null);
        }
    }, [tool, activeObjectType]);

    const activeObjectTypeRef = useRef(activeObjectType);
    useEffect(() => { activeObjectTypeRef.current = activeObjectType; }, [activeObjectType]);

    const detectionColorRef = useRef(detectionColor);
    useEffect(() => { detectionColorRef.current = detectionColor; }, [detectionColor]);

    const hoveredShapeIdRef = useRef(hoveredShapeId);
    useEffect(() => { hoveredShapeIdRef.current = hoveredShapeId; }, [hoveredShapeId]);

    const scaleRef = useRef(scale);
    useEffect(() => { scaleRef.current = scale; }, [scale]);

    const imgDimsRef = useRef(imgDims);
    useEffect(() => { imgDimsRef.current = imgDims; }, [imgDims]);

    const imgReadyRef = useRef(imgReady);
    useEffect(() => { imgReadyRef.current = imgReady; }, [imgReady]);

    const currentShapesRenderRef = useRef(currentShapes);
    useEffect(() => {
        currentShapesRenderRef.current = currentShapes;
        dirtyRef.current = true;
    }, [currentShapes]);

    const visibleAiShapesRenderRef = useRef(visibleAiShapes);
    const aiShapeIdsRef = useRef(new Set(visibleAiShapes.map((s) => s.id)));
    const prevVisibleAiCountRef = useRef(visibleAiShapes.length);
    useEffect(() => {
        const prevAiShapeIds = aiShapeIdsRef.current;
        const newCount = visibleAiShapes.length;
        prevVisibleAiCountRef.current = newCount;

        visibleAiShapesRenderRef.current = visibleAiShapes;
        aiShapeIdsRef.current = new Set(visibleAiShapes.map((s) => s.id));
        dirtyRef.current = true;

        const selId = drawingModeSelectedIdRef.current || selectedShapeIdRef.current;
        if (selId) {
            if (selectedShapeIdRef.current === null && drawingModeSelectedIdRef.current === null) return;

            const alreadyReal = visibleAiShapes.some((s) => s.id === selId);
            if (!alreadyReal) {
                // If the actually-selected shape (not stale drawingMode) was in the previous
                // visibleAiShapes but is now absent, it was just hidden — don't auto-navigate.
                const actualSelId = selectedShapeIdRef.current;
                if (actualSelId && prevAiShapeIds.has(actualSelId)) {
                    dirtyRef.current = true;
                    return;
                }

                currentShapesRenderRef.current = (currentShapesRenderRef.current || []).filter(
                    (s) => s.id !== selId
                );
                currentShapesRef.current = (currentShapesRef.current || []).filter(
                    (s) => s.id !== selId
                );
                allShapesRef.current = (allShapesRef.current || []).filter(
                    (s) => s.id !== selId
                );

                let realShape = visibleAiShapes[visibleAiShapes.length - 1];

                if (realShape) {
                    drawingModeSelectedIdRef.current = realShape.id;
                    selectedShapeIdRef.current = realShape.id;
                    setSelectedShapeId(realShape.id);
                    setDrawingModeSelectedId(realShape.id);
                    if (setSelectedShapeIds) setSelectedShapeIds(new Set([realShape.id]));
                    dirtyRef.current = true;
                    requestAnimationFrame(() => requestAnimationFrame(() => scheduleDeleteBtnUpdate()));
                }
            }
        }
    }, [visibleAiShapes]);

    const dirtyRef = useRef(true);
    const bgDirtyRef = useRef(true);
    const bgCacheRef = useRef(null);


    // Cache for the extraParentIds overlap detection so it doesn't run O(cut×all) every RAF frame.
    const extraParentIdsCacheRef = useRef({ ai: null, cur: null, key: null, ids: new Set() });
    // Full cut composite offscreen: Sub-passes A/A2/B/B2 rendered once; blitted as a single
    // drawImage each frame during active drawing (liveDrag=null). Eliminates all per-frame
    // ctx.clip() calls that scale with the number of cut shapes — the primary Mac lag cause.
    const cutCompositeCacheRef = useRef({ canvas: null, ai: null, cur: null, w: 0, h: 0 });
    // Static base for single-cut-shape drag: composite of all cuts EXCEPT the moving one.
    // Built once per drag gesture; per-frame cost drops to 2 clip ops (1 for parent, 1 for cut).
    const dragBaseCompositeRef = useRef({ canvas: null, excludeId: null, ai: null, cur: null, w: 0, h: 0 });

    const lastClientPosRef = useRef(null);
    const lastPointerEventRef = useRef(null);
    const onPointerMoveRef = useRef(null);

    const handleAutoScroll = useCallback(() => {
        const stage = stageRef.current;
        if (!stage || !lastClientPosRef.current) return;

        const isOperating = isDrawingRef.current || isDraggingRef.current || vertexDragRef.current || isPanningRef.current;
        if (!isOperating) return;

        const rect = stage.getBoundingClientRect();
        const { x: clientX, y: clientY } = lastClientPosRef.current;

        const EDGE_THRESHOLD = 50; // px
        const MAX_SCROLL_SPEED = 12; // px per frame

        let dx = 0;
        let dy = 0;

        // Left/Right edge auto scroll
        if (clientX < rect.left + EDGE_THRESHOLD) {
            const ratio = Math.max(0, (rect.left + EDGE_THRESHOLD - clientX) / EDGE_THRESHOLD);
            dx = -ratio * MAX_SCROLL_SPEED;
        } else if (clientX > rect.right - EDGE_THRESHOLD) {
            const ratio = Math.max(0, (clientX - (rect.right - EDGE_THRESHOLD)) / EDGE_THRESHOLD);
            dx = ratio * MAX_SCROLL_SPEED;
        }

        // Top/Bottom edge auto scroll
        if (clientY < rect.top + EDGE_THRESHOLD) {
            const ratio = Math.max(0, (rect.top + EDGE_THRESHOLD - clientY) / EDGE_THRESHOLD);
            dy = -ratio * MAX_SCROLL_SPEED;
        } else if (clientY > rect.bottom - EDGE_THRESHOLD) {
            const ratio = Math.max(0, (clientY - (rect.bottom - EDGE_THRESHOLD)) / EDGE_THRESHOLD);
            dy = ratio * MAX_SCROLL_SPEED;
        }

        if (dx !== 0 || dy !== 0) {
            stage.scrollLeft += dx;
            stage.scrollTop += dy;
            dirtyRef.current = true;

            if (onPointerMoveRef.current && lastPointerEventRef.current) {
                onPointerMoveRef.current(lastPointerEventRef.current);
            }
        }
    }, []);

    const handleAutoScrollRef = useRef(handleAutoScroll);
    useEffect(() => {
        handleAutoScrollRef.current = handleAutoScroll;
    }, [handleAutoScroll]);

    useEffect(() => { bgDirtyRef.current = true; dirtyRef.current = true; }, [imgReady, scale, imgDims]);
    useEffect(() => { dirtyRef.current = true; }, [
        currentShapes, visibleAiShapes,
        draftPoints, mouseCanvasPos,
        tool, selectedShapeId, selectedShapeIds, hoveredShapeId,
        detectionColor, activeObjectType,
    ]);

    // ── Render loop ───────────────────────────────────────────────────────────
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        let running = true;

        const loop = () => {
            if (!running) return;
            rafIdRef.current = requestAnimationFrame(loop);

            if (handleAutoScrollRef.current) {
                handleAutoScrollRef.current();
            }

            if (!dirtyRef.current) return;
            dirtyRef.current = false;

            const offscreen = offscreenRef.current;
            if (!imgReadyRef.current || !offscreen) return;

            const sc = scaleRef.current;
            const dims = imgDimsRef.current;

            const highZoomCutDraft = isMacHighZoomCutDrawing(
                sc,
                toolRef.current,
                activeObjectTypeRef.current,
                isDrawingRef.current || arcPointsRef.current.length > 0 || !!circleDraftRef.current
            );
            const dpr = highZoomCutDraft ? 1 : EFFECTIVE_DPR;
            const cssW = dims.w * sc;
            const cssH = dims.h * sc;

            const MAX_DIM = 16384;
            const rawW = Math.round(cssW * dpr);
            const rawH = Math.round(cssH * dpr);
            const needsCap = rawW > MAX_DIM || rawH > MAX_DIM;
            const capRatio = needsCap ? Math.min(MAX_DIM / rawW, MAX_DIM / rawH) : 1;
            const canvasW = needsCap ? Math.round(rawW * capRatio) : rawW;
            const canvasH = needsCap ? Math.round(rawH * capRatio) : rawH;
            const effectiveDpr = dpr * capRatio;

            const finalW = canvasW;
            const finalH = canvasH;
            const finalDpr = effectiveDpr;

            if (canvas.width !== finalW || canvas.height !== finalH) {
                canvas.width = finalW;
                canvas.height = finalH;
                canvas.style.width = cssW + "px";
                canvas.style.height = cssH + "px";
            }

            if (bgDirtyRef.current || !bgCacheRef.current ||
                bgCacheRef.current.w !== canvasW || bgCacheRef.current.h !== canvasH) {
                bgDirtyRef.current = false;
                let bg = bgCacheRef.current?.canvas;
                if (!bg || bg.width !== canvasW || bg.height !== canvasH) {
                    bg = document.createElement("canvas");
                    bg.width = canvasW;
                    bg.height = canvasH;
                }
                const bgCtx = bg.getContext("2d", { alpha: false });
                if (bgCtx) {
                    bgCtx.setTransform(1, 0, 0, 1, 0, 0);
                    bgCtx.scale(effectiveDpr, effectiveDpr);
                    bgCtx.imageSmoothingEnabled = true;
                    bgCtx.imageSmoothingQuality = "high";
                    bgCtx.drawImage(offscreen, 0, 0, cssW, cssH);
                }
                bgCacheRef.current = { canvas: bg, w: canvasW, h: canvasH };
            }

            const ctx = canvas.getContext("2d", { alpha: false });
            if (!ctx) return;

            ctx.setTransform(1, 0, 0, 1, 0, 0);
            ctx.clearRect(0, 0, finalW, finalH);
            if (bgCacheRef.current?.canvas) ctx.drawImage(bgCacheRef.current.canvas, 0, 0, finalW, finalH);
            ctx.scale(finalDpr, finalDpr);

            const i2c = (x, y) => ({ x: x * sc, y: y * sc });
            const sw = (b) => b;
            const rad = (b) => b;

            const selId = selectedShapeIdRef.current;
            const selIds = selectedShapeIdsRef.current;
            const hovId = hoveredShapeIdRef.current;
            const aiShapeIds = aiShapeIdsRef.current;
            const liveDrag = dragLiveRef.current;
            const liveCutDrag = dragCutLiveRef.current;

            const currentTool = toolRef.current;
            const isSelectMode = currentTool === "select";
            const drawingModeSelId = drawingModeSelectedIdRef.current;

            const allVisibleForCut = [
                ...visibleAiShapesRenderRef.current,
                ...currentShapesRenderRef.current,
            ];

            const cutShapesByParent = new Map();
            for (const s of allVisibleForCut) {
                if (!s.isCutShape || !s.cutParentAreaId) continue;
                const resolvedParent = allVisibleForCut.find(
                    (p) => p.id === s.cutParentAreaId || p.takeoffId === s.cutParentAreaId ||
                        (s.cutParentTakeoffId && p.takeoffId === s.cutParentTakeoffId)
                );
                if (!resolvedParent) continue;
                const resolvedParentId = resolvedParent.id;
                if (!cutShapesByParent.has(resolvedParentId)) {
                    cutShapesByParent.set(resolvedParentId, []);
                }
                cutShapesByParent.get(resolvedParentId).push(s);
            }
            const cutParentIds = new Set(cutShapesByParent.keys());
            const cutParentTakeoffIds = new Set(
                [...cutShapesByParent.keys()].flatMap((pid) => {
                    const shape = allVisibleForCut.find((s) => s.id === pid);
                    return shape?.takeoffId ? [shape.takeoffId] : [];
                })
            );

            // ── extraParentIds: which non-cut-parent shapes overlap a cut shape.
            // Detection is O(cut_shapes × all_shapes) so we cache it and only
            // recompute when shape arrays change or a cut shape is being dragged.
            const _liveDragIsCut = liveDrag &&
                allVisibleForCut.some((s) => s.id === liveDrag.id && s.isCutShape);
            const _epKey = allVisibleForCut.length + '|' + (liveDrag?.id ?? '');
            const _epCache = extraParentIdsCacheRef.current;
            const extraParentIds = (
                !_liveDragIsCut &&
                _epCache.ai === visibleAiShapesRenderRef.current &&
                _epCache.cur === currentShapesRenderRef.current &&
                _epCache.key === _epKey
            ) ? _epCache.ids : (() => {
                const cutParentIdsTmp = new Set(cutShapesByParent.keys());
                const newIds = new Set();
                for (const s of allVisibleForCut) {
                    if (!s.isCutShape) continue;
                    const rc = (liveDrag && liveDrag.id === s.id)
                        ? { ...s, points: liveDrag.points,
                            ...(liveDrag.radius !== undefined ? { radius: liveDrag.radius } : {}) }
                        : s;
                    const rcPts = rc.points || [];
                    if (!rcPts.length) continue;
                    for (const candidate of allVisibleForCut) {
                        if (candidate.isCutShape) continue;
                        if (cutParentIdsTmp.has(candidate.id)) continue;
                        if (newIds.has(candidate.id)) continue;
                        if (candidate.areaType === "symbol" || candidate.symbolType) continue;
                        let overlaps = rcPts.some((p) => isPointInArea(p, candidate));
                        if (!overlaps && rc.type === "circle" && rc.radius != null && rcPts[0]) {
                            const ctr = rcPts[0];
                            for (let k = 0; k < 12 && !overlaps; k++) {
                                const ang = (k * Math.PI * 2) / 12;
                                overlaps = isPointInArea(
                                    { x: ctr.x + rc.radius * Math.cos(ang), y: ctr.y + rc.radius * Math.sin(ang) },
                                    candidate
                                );
                            }
                        }
                        if (overlaps) newIds.add(candidate.id);
                    }
                }
                extraParentIdsCacheRef.current = {
                    ai: visibleAiShapesRenderRef.current,
                    cur: currentShapesRenderRef.current,
                    key: _epKey,
                    ids: newIds,
                };
                return newIds;
            })();

            if (cutShapesByParent.size > 0) {
                const bgCanvas = bgCacheRef.current?.canvas;

                const _isDragging = liveDrag !== null || liveCutDrag !== null;

                // Fast drag path: dragging a single cut shape (not a parent or liveCutDrag).
                // Builds a "static base" composite (all holes except the moving one) once,
                // then per-frame does only 2 clip ops for the moving hole — regardless of N.
                const _draggedCutId = (_isDragging && liveDrag && !liveCutDrag)
                    ? (allVisibleForCut.find((s) => s.id === liveDrag.id && s.isCutShape)?.id ?? null)
                    : null;

                if (_draggedCutId) {
                    // ── Static base (built once per drag gesture) ───────────────
                    const _db = dragBaseCompositeRef.current;
                    const _dbValid = _db.canvas !== null &&
                        _db.w === finalW && _db.h === finalH &&
                        _db.excludeId === _draggedCutId &&
                        _db.ai === visibleAiShapesRenderRef.current &&
                        _db.cur === currentShapesRenderRef.current;

                    if (!_dbValid) {
                        let _dbOff = _db.canvas;
                        if (!_dbOff || _dbOff.width !== finalW || _dbOff.height !== finalH) {
                            _dbOff = document.createElement("canvas");
                            _dbOff.width = finalW; _dbOff.height = finalH;
                        }
                        const dbCtx = _dbOff.getContext("2d", { alpha: false });
                        if (dbCtx) {
                            dbCtx.setTransform(1, 0, 0, 1, 0, 0);
                            if (bgCanvas) dbCtx.drawImage(bgCanvas, 0, 0, finalW, finalH);
                            else { dbCtx.fillStyle = "#fff"; dbCtx.fillRect(0, 0, finalW, finalH); }
                            dbCtx.scale(finalDpr, finalDpr);
                            // Sub-pass A
                            for (const [pId] of cutShapesByParent) {
                                const ps = allVisibleForCut.find((s) => s.id === pId); if (!ps) continue;
                                const isAiP = aiShapeIds.has(ps.id);
                                const pFill = ps.color?.fill || (!isAiP ? TOOL_COLORS[ps.type]?.fill : "rgba(59,130,246,0.18)");
                                let mnX = Infinity, mnY = Infinity, mxX = -Infinity, mxY = -Infinity;
                                const bpts = (ps.type === "arc" && ps.controlPoints?.length) ? [...ps.points, ...ps.controlPoints] : (ps.points || []);
                                if (ps.type === "circle" && ps.radius != null && ps.points?.[0]) { const r = ps.radius * sc; mnX = ps.points[0].x * sc - r; mxX = ps.points[0].x * sc + r; mnY = ps.points[0].y * sc - r; mxY = ps.points[0].y * sc + r; }
                                else for (const p of bpts) { const cx = p.x * sc, cy = p.y * sc; if (cx < mnX) mnX = cx; if (cx > mxX) mxX = cx; if (cy < mnY) mnY = cy; if (cy > mxY) mxY = cy; }
                                const FP = 2; dbCtx.save(); traceParentShapePath(dbCtx, ps, sc, i2c); dbCtx.clip(); dbCtx.fillStyle = pFill;
                                if (mnX !== Infinity) dbCtx.fillRect(mnX - FP, mnY - FP, mxX - mnX + FP * 2, mxY - mnY + FP * 2); else dbCtx.fillRect(0, 0, cssW, cssH);
                                dbCtx.restore();
                            }
                            // Sub-pass A2
                            for (const epId of extraParentIds) {
                                const cand = allVisibleForCut.find((s) => s.id === epId); if (!cand) continue;
                                const isAiE = aiShapeIds.has(cand.id);
                                const eFill = cand.color?.fill || (!isAiE ? TOOL_COLORS[cand.type]?.fill : "rgba(59,130,246,0.18)");
                                let mnX = Infinity, mnY = Infinity, mxX = -Infinity, mxY = -Infinity;
                                const bpts = (cand.type === "arc" && cand.controlPoints?.length) ? [...cand.points, ...cand.controlPoints] : (cand.points || []);
                                if (cand.type === "circle" && cand.radius != null && cand.points?.[0]) { const r = cand.radius * sc; mnX = cand.points[0].x * sc - r; mxX = cand.points[0].x * sc + r; mnY = cand.points[0].y * sc - r; mxY = cand.points[0].y * sc + r; }
                                else for (const p of bpts) { const cx = p.x * sc, cy = p.y * sc; if (cx < mnX) mnX = cx; if (cx > mxX) mxX = cx; if (cy < mnY) mnY = cy; if (cy > mxY) mxY = cy; }
                                const FP2 = 2; dbCtx.save(); traceParentShapePath(dbCtx, cand, sc, i2c); dbCtx.clip(); dbCtx.fillStyle = eFill;
                                if (mnX !== Infinity) dbCtx.fillRect(mnX - FP2, mnY - FP2, mxX - mnX + FP2 * 2, mxY - mnY + FP2 * 2); else dbCtx.fillRect(0, 0, cssW, cssH);
                                dbCtx.restore();
                            }
                            // Sub-pass B: holes for all cut shapes EXCEPT the dragged one
                            for (const [pId, cutShapes] of cutShapesByParent) {
                                const phShape = allVisibleForCut.find((s) => s.id === pId); if (!phShape) continue;
                                for (const rawCS of cutShapes) {
                                    if (rawCS.id === _draggedCutId) continue;
                                    const csPts = (rawCS.points || []).map((p) => i2c(p.x, p.y)); if (!csPts.length) continue;
                                    let mnX = Infinity, mnY = Infinity, mxX = -Infinity, mxY = -Infinity;
                                    if (rawCS.type === "circle" && rawCS.radius != null && csPts[0]) { const r = rawCS.radius * sc; mnX = csPts[0].x - r; mnY = csPts[0].y - r; mxX = csPts[0].x + r; mxY = csPts[0].y + r; }
                                    else { for (const p of csPts) { if (p.x < mnX) mnX = p.x; if (p.y < mnY) mnY = p.y; if (p.x > mxX) mxX = p.x; if (p.y > mxY) mxY = p.y; } if (rawCS.type === "arc" && rawCS.controlPoints?.length) for (const cp of rawCS.controlPoints) { const ccx = cp.x * sc, ccy = cp.y * sc; if (ccx < mnX) mnX = ccx; if (ccy < mnY) mnY = ccy; if (ccx > mxX) mxX = ccx; if (ccy > mxY) mxY = ccy; } }
                                    const PP = 2; const pbX = Math.max(0, Math.floor((mnX - PP) * finalDpr)); const pbY = Math.max(0, Math.floor((mnY - PP) * finalDpr));
                                    const pbW = Math.min(finalW, Math.ceil((mxX + PP) * finalDpr)) - pbX; const pbH = Math.min(finalH, Math.ceil((mxY + PP) * finalDpr)) - pbY;
                                    if (pbW <= 0 || pbH <= 0) continue;
                                    const _punchHole = (tCtx, parentS) => {
                                        tCtx.save(); traceParentShapePath(tCtx, parentS, sc, i2c); tCtx.clip();
                                        tCtx.beginPath(); traceCutShapePath(tCtx, rawCS, csPts, sc, i2c); tCtx.clip();
                                        tCtx.setTransform(1, 0, 0, 1, 0, 0);
                                        if (bgCanvas) tCtx.drawImage(bgCanvas, pbX, pbY, pbW, pbH, pbX, pbY, pbW, pbH);
                                        else { tCtx.fillStyle = "#fff"; tCtx.fillRect(pbX, pbY, pbW, pbH); }
                                        tCtx.restore();
                                    };
                                    _punchHole(dbCtx, phShape);
                                    for (const epId of extraParentIds) { const ep = allVisibleForCut.find((s) => s.id === epId); if (ep) _punchHole(dbCtx, ep); }
                                }
                            }
                            // Sub-pass B2
                            for (const epId of extraParentIds) {
                                const ep = allVisibleForCut.find((s) => s.id === epId); if (!ep) continue;
                                const isAi3 = aiShapeIds.has(ep.id);
                                dbCtx.save(); dbCtx.strokeStyle = ep.color?.stroke || (!isAi3 ? TOOL_COLORS[ep.type]?.stroke : "#3b82f6");
                                dbCtx.lineWidth = sw(2); dbCtx.setLineDash([]); traceParentShapePath(dbCtx, ep, sc, i2c); dbCtx.stroke(); dbCtx.restore();
                            }
                        }
                        dragBaseCompositeRef.current = { canvas: _dbOff, excludeId: _draggedCutId, ai: visibleAiShapesRenderRef.current, cur: currentShapesRenderRef.current, w: finalW, h: finalH };
                    }

                    // 1. Blit static base (1 drawImage)
                    ctx.setTransform(1, 0, 0, 1, 0, 0);
                    ctx.drawImage(dragBaseCompositeRef.current.canvas, 0, 0, finalW, finalH);
                    ctx.scale(finalDpr, finalDpr);

                    // 2. Dynamic hole at current drag position (2 clip ops total)
                    const _rawDCS = allVisibleForCut.find((s) => s.id === _draggedCutId);
                    if (_rawDCS && bgCanvas) {
                        const _dynCS = { ..._rawDCS, points: liveDrag.points,
                            ...(liveDrag.controlPoints !== undefined ? { controlPoints: liveDrag.controlPoints } : {}),
                            ...(liveDrag.radius !== undefined ? { radius: liveDrag.radius } : {}) };
                        const _dynPts = _dynCS.points.map((p) => i2c(p.x, p.y));
                        const _dynParent = allVisibleForCut.find((s) =>
                            s.id === _rawDCS.cutParentAreaId || s.takeoffId === _rawDCS.cutParentAreaId ||
                            (_rawDCS.cutParentTakeoffId && s.takeoffId === _rawDCS.cutParentTakeoffId));
                        if (_dynParent && _dynPts.length) {
                            let dmnX = Infinity, dmnY = Infinity, dmxX = -Infinity, dmxY = -Infinity;
                            if (_dynCS.type === "circle" && _dynCS.radius != null && _dynPts[0]) { const r = _dynCS.radius * sc; dmnX = _dynPts[0].x - r; dmnY = _dynPts[0].y - r; dmxX = _dynPts[0].x + r; dmxY = _dynPts[0].y + r; }
                            else { for (const p of _dynPts) { if (p.x < dmnX) dmnX = p.x; if (p.y < dmnY) dmnY = p.y; if (p.x > dmxX) dmxX = p.x; if (p.y > dmxY) dmxY = p.y; } if (_dynCS.type === "arc" && _dynCS.controlPoints?.length) for (const cp of _dynCS.controlPoints) { const ccx = cp.x * sc, ccy = cp.y * sc; if (ccx < dmnX) dmnX = ccx; if (ccy < dmnY) dmnY = ccy; if (ccx > dmxX) dmxX = ccx; if (ccy > dmxY) dmxY = ccy; } }
                            const DPP = 2; const dpX = Math.max(0, Math.floor((dmnX - DPP) * finalDpr)); const dpY = Math.max(0, Math.floor((dmnY - DPP) * finalDpr));
                            const dpW = Math.min(finalW, Math.ceil((dmxX + DPP) * finalDpr)) - dpX; const dpH = Math.min(finalH, Math.ceil((dmxY + DPP) * finalDpr)) - dpY;
                            if (dpW > 0 && dpH > 0) {
                                const _dynPunch = (parentS) => {
                                    ctx.save(); traceParentShapePath(ctx, parentS, sc, i2c); ctx.clip();
                                    ctx.beginPath(); traceCutShapePath(ctx, _dynCS, _dynPts, sc, i2c); ctx.clip();
                                    ctx.setTransform(1, 0, 0, 1, 0, 0);
                                    ctx.drawImage(bgCanvas, dpX, dpY, dpW, dpH, dpX, dpY, dpW, dpH);
                                    ctx.restore();
                                };
                                _dynPunch(_dynParent);
                                for (const epId of extraParentIds) { const ep = allVisibleForCut.find((s) => s.id === epId); if (ep) _dynPunch(ep); }
                            }
                        }
                    }
                } else {
                // ── Full composite cache (static drawing or complex drag) ──────
                const _cc = cutCompositeCacheRef.current;
                const _ccValid = !_isDragging &&
                    _cc.canvas !== null &&
                    _cc.w === finalW && _cc.h === finalH &&
                    _cc.ai === visibleAiShapesRenderRef.current &&
                    _cc.cur === currentShapesRenderRef.current;

                if (!_ccValid) {
                    // (Re)build composite onto cCtx (offscreen canvas)
                    let _cutOff = _cc.canvas;
                    if (!_cutOff || _cutOff.width !== finalW || _cutOff.height !== finalH) {
                        _cutOff = document.createElement("canvas");
                        _cutOff.width = finalW;
                        _cutOff.height = finalH;
                    }
                    const cCtx = _cutOff.getContext("2d", { alpha: false });
                    if (cCtx) {
                        // Seed composite with background image so hole-punches show bg
                        cCtx.setTransform(1, 0, 0, 1, 0, 0);
                        if (bgCanvas) { cCtx.drawImage(bgCanvas, 0, 0, finalW, finalH); }
                        else { cCtx.fillStyle = "#fff"; cCtx.fillRect(0, 0, finalW, finalH); }
                        cCtx.scale(finalDpr, finalDpr);

                        // Sub-pass A: registered parent fills
                        for (const [parentId] of cutShapesByParent) {
                            let pShape = allVisibleForCut.find((s) => s.id === parentId);
                            if (!pShape) continue;
                            if (liveDrag && liveDrag.id === parentId) {
                                pShape = { ...pShape, points: liveDrag.points,
                                    ...(liveDrag.controlPoints !== undefined ? { controlPoints: liveDrag.controlPoints } : {}),
                                    ...(liveDrag.radius !== undefined ? { radius: liveDrag.radius } : {}) };
                            }
                            const isParentAi = aiShapeIds.has(pShape.id);
                            const pFill = pShape.color?.fill ||
                                (!isParentAi ? TOOL_COLORS[pShape.type]?.fill : "rgba(59,130,246,0.18)");
                            let pMnX = Infinity, pMnY = Infinity, pMxX = -Infinity, pMxY = -Infinity;
                            if (pShape.type === "circle" && pShape.radius != null && pShape.points?.[0]) {
                                const r = pShape.radius * sc;
                                pMnX = pShape.points[0].x * sc - r; pMxX = pShape.points[0].x * sc + r;
                                pMnY = pShape.points[0].y * sc - r; pMxY = pShape.points[0].y * sc + r;
                            } else if (pShape.points?.length) {
                                const bPts = (pShape.type === "arc" && pShape.controlPoints?.length)
                                    ? [...pShape.points, ...pShape.controlPoints] : pShape.points;
                                for (const p of bPts) {
                                    const cx = p.x * sc, cy = p.y * sc;
                                    if (cx < pMnX) pMnX = cx; if (cx > pMxX) pMxX = cx;
                                    if (cy < pMnY) pMnY = cy; if (cy > pMxY) pMxY = cy;
                                }
                            }
                            const FP = 2;
                            cCtx.save();
                            traceParentShapePath(cCtx, pShape, sc, i2c);
                            cCtx.clip();
                            cCtx.fillStyle = pFill;
                            if (pMnX !== Infinity) cCtx.fillRect(pMnX - FP, pMnY - FP, pMxX - pMnX + FP * 2, pMxY - pMnY + FP * 2);
                            else cCtx.fillRect(0, 0, cssW, cssH);
                            cCtx.restore();
                        }

                        // Sub-pass A2: extra parent fills (cached ids, render-only)
                        for (const epId of extraParentIds) {
                            const cand = allVisibleForCut.find((s) => s.id === epId);
                            if (!cand) continue;
                            const isAi2 = aiShapeIds.has(cand.id);
                            const eFill = cand.color?.fill ||
                                (!isAi2 ? TOOL_COLORS[cand.type]?.fill : "rgba(59,130,246,0.18)");
                            let eMnX = Infinity, eMnY = Infinity, eMxX = -Infinity, eMxY = -Infinity;
                            if (cand.type === "circle" && cand.radius != null && cand.points?.[0]) {
                                const r = cand.radius * sc;
                                eMnX = cand.points[0].x * sc - r; eMxX = cand.points[0].x * sc + r;
                                eMnY = cand.points[0].y * sc - r; eMxY = cand.points[0].y * sc + r;
                            } else if (cand.points?.length) {
                                const bPts = (cand.type === "arc" && cand.controlPoints?.length)
                                    ? [...cand.points, ...cand.controlPoints] : cand.points;
                                for (const p of bPts) {
                                    const cx = p.x * sc, cy = p.y * sc;
                                    if (cx < eMnX) eMnX = cx; if (cx > eMxX) eMxX = cx;
                                    if (cy < eMnY) eMnY = cy; if (cy > eMxY) eMxY = cy;
                                }
                            }
                            const FP2 = 2;
                            cCtx.save();
                            traceParentShapePath(cCtx, cand, sc, i2c);
                            cCtx.clip();
                            cCtx.fillStyle = eFill;
                            if (eMnX !== Infinity) cCtx.fillRect(eMnX - FP2, eMnY - FP2, eMxX - eMnX + FP2 * 2, eMxY - eMnY + FP2 * 2);
                            else cCtx.fillRect(0, 0, cssW, cssH);
                            cCtx.restore();
                        }

                        // Sub-pass B: punch holes (draw bgCanvas tile inside parent∩cut clip)
                        for (const [parentId, cutShapes] of cutShapesByParent) {
                            let phShape = allVisibleForCut.find((s) => s.id === parentId);
                            if (!phShape) continue;
                            if (liveDrag && liveDrag.id === parentId) {
                                phShape = { ...phShape, points: liveDrag.points,
                                    ...(liveDrag.controlPoints !== undefined ? { controlPoints: liveDrag.controlPoints } : {}),
                                    ...(liveDrag.radius !== undefined ? { radius: liveDrag.radius } : {}) };
                            }
                            let cutDx = 0, cutDy = 0;
                            if (liveCutDrag && liveCutDrag.parentId === parentId) { cutDx = liveCutDrag.dx; cutDy = liveCutDrag.dy; }

                            for (const rawCS of cutShapes) {
                                const cs = cutDx !== 0 || cutDy !== 0
                                    ? { ...rawCS,
                                        points: rawCS.points.map((p) => ({ x: p.x + cutDx, y: p.y + cutDy })),
                                        ...(rawCS.controlPoints ? { controlPoints: rawCS.controlPoints.map((p) => ({ x: p.x + cutDx, y: p.y + cutDy })) } : {}) }
                                    : (liveDrag && liveDrag.id === rawCS.id
                                        ? { ...rawCS, points: liveDrag.points,
                                            ...(liveDrag.controlPoints !== undefined ? { controlPoints: liveDrag.controlPoints } : {}),
                                            ...(liveDrag.radius !== undefined ? { radius: liveDrag.radius } : {}) }
                                        : rawCS);
                                const csPts = (cs.points || []).map((p) => i2c(p.x, p.y));
                                if (!csPts.length) continue;

                                let cbMnX = Infinity, cbMnY = Infinity, cbMxX = -Infinity, cbMxY = -Infinity;
                                if (cs.type === "circle" && cs.radius != null && csPts[0]) {
                                    const r = cs.radius * sc;
                                    cbMnX = csPts[0].x - r; cbMnY = csPts[0].y - r;
                                    cbMxX = csPts[0].x + r; cbMxY = csPts[0].y + r;
                                } else {
                                    for (const p of csPts) {
                                        if (p.x < cbMnX) cbMnX = p.x; if (p.y < cbMnY) cbMnY = p.y;
                                        if (p.x > cbMxX) cbMxX = p.x; if (p.y > cbMxY) cbMxY = p.y;
                                    }
                                    if (cs.type === "arc" && cs.controlPoints?.length) {
                                        for (const cp of cs.controlPoints) {
                                            const ccx = cp.x * sc, ccy = cp.y * sc;
                                            if (ccx < cbMnX) cbMnX = ccx; if (ccy < cbMnY) cbMnY = ccy;
                                            if (ccx > cbMxX) cbMxX = ccx; if (ccy > cbMxY) cbMxY = ccy;
                                        }
                                    }
                                }
                                const PP = 2;
                                const pbX = Math.max(0, Math.floor((cbMnX - PP) * finalDpr));
                                const pbY = Math.max(0, Math.floor((cbMnY - PP) * finalDpr));
                                const pbW = Math.min(finalW, Math.ceil((cbMxX + PP) * finalDpr)) - pbX;
                                const pbH = Math.min(finalH, Math.ceil((cbMxY + PP) * finalDpr)) - pbY;
                                if (pbW <= 0 || pbH <= 0) continue;

                                // Punch hole in registered parent
                                cCtx.save();
                                traceParentShapePath(cCtx, phShape, sc, i2c);
                                cCtx.clip();
                                cCtx.beginPath();
                                traceCutShapePath(cCtx, cs, csPts, sc, i2c);
                                cCtx.clip();
                                cCtx.setTransform(1, 0, 0, 1, 0, 0);
                                if (bgCanvas) cCtx.drawImage(bgCanvas, pbX, pbY, pbW, pbH, pbX, pbY, pbW, pbH);
                                else { cCtx.fillStyle = "#fff"; cCtx.fillRect(pbX, pbY, pbW, pbH); }
                                cCtx.restore();

                                // Punch hole in extra parents
                                for (const epId of extraParentIds) {
                                    let ep = allVisibleForCut.find((s) => s.id === epId);
                                    if (!ep) continue;
                                    if (liveDrag && liveDrag.id === epId) {
                                        ep = { ...ep, points: liveDrag.points,
                                            ...(liveDrag.controlPoints !== undefined ? { controlPoints: liveDrag.controlPoints } : {}),
                                            ...(liveDrag.radius !== undefined ? { radius: liveDrag.radius } : {}) };
                                    }
                                    cCtx.save();
                                    traceParentShapePath(cCtx, ep, sc, i2c);
                                    cCtx.clip();
                                    cCtx.beginPath();
                                    traceCutShapePath(cCtx, cs, csPts, sc, i2c);
                                    cCtx.clip();
                                    cCtx.setTransform(1, 0, 0, 1, 0, 0);
                                    if (bgCanvas) cCtx.drawImage(bgCanvas, pbX, pbY, pbW, pbH, pbX, pbY, pbW, pbH);
                                    else { cCtx.fillStyle = "#fff"; cCtx.fillRect(pbX, pbY, pbW, pbH); }
                                    cCtx.restore();
                                }
                            }
                        }

                        // Sub-pass B2: strokes for extra parents
                        for (const epId of extraParentIds) {
                            const ep = allVisibleForCut.find((s) => s.id === epId);
                            if (!ep) continue;
                            const isAi3 = aiShapeIds.has(ep.id);
                            const epStroke = ep.color?.stroke || (!isAi3 ? TOOL_COLORS[ep.type]?.stroke : "#3b82f6");
                            cCtx.save();
                            cCtx.strokeStyle = epStroke;
                            cCtx.lineWidth = sw(2);
                            cCtx.setLineDash([]);
                            traceParentShapePath(cCtx, ep, sc, i2c);
                            cCtx.stroke();
                            cCtx.restore();
                        }
                    }
                    cutCompositeCacheRef.current = {
                        canvas: _cutOff,
                        ai: visibleAiShapesRenderRef.current,
                        cur: currentShapesRenderRef.current,
                        w: finalW, h: finalH,
                    };
                }

                // Blit composite onto main canvas — single drawImage, zero clip ops per frame
                const _composite = cutCompositeCacheRef.current.canvas;
                if (_composite) {
                    ctx.setTransform(1, 0, 0, 1, 0, 0);
                    ctx.drawImage(_composite, 0, 0, finalW, finalH);
                    ctx.scale(finalDpr, finalDpr);
                }
                } // end else (full composite path)
            }

            // PASS 1: Draw all non-cut shapes fills + strokes
            const allDrawShapes = [visibleAiShapesRenderRef.current, currentShapesRenderRef.current];
            for (let li = 0; li < allDrawShapes.length; li++) {
                const drawList = allDrawShapes[li];
                for (let si = 0; si < drawList.length; si++) {
                    const rawShape = drawList[si];
                    if (rawShape.isCutShape) continue;
                    if (cutParentIds.has(rawShape.id) || cutParentTakeoffIds.has(rawShape.id) ||
                        cutParentIds.has(rawShape.takeoffId) || extraParentIds.has(rawShape.id)) continue;

                    const shape = (liveDrag && rawShape.id === liveDrag.id)
                        ? {
                            ...rawShape,
                            points: liveDrag.points,
                            ...(liveDrag.controlPoints !== undefined ? { controlPoints: liveDrag.controlPoints } : {}),
                            ...(liveDrag.radius !== undefined ? { radius: liveDrag.radius } : {}),
                        }
                        : rawShape;
                    const isSel = shape.id === selId || selIds.has(shape.id);
                    const isAi = aiShapeIds.has(shape.id);

                    const stroke = shape.color?.stroke || (!isAi ? TOOL_COLORS[shape.type]?.stroke : "#3b82f6");
                    const fill = shape.color?.fill || (!isAi ? TOOL_COLORS[shape.type]?.fill : "rgba(59,130,246,0.18)");
                    const pts = shape.points?.map((p) => i2c(p.x, p.y)) || [];

                    ctx.save();
                    ctx.strokeStyle = stroke;
                    ctx.fillStyle = fill;
                    ctx.lineWidth = sw(isSel ? 3 : 2);

                    switch (shape.type) {
                        case "rectangle":
                            if (pts.length >= 2) {
                                ctx.beginPath();
                                ctx.rect(pts[0].x, pts[0].y, pts[1].x - pts[0].x, pts[1].y - pts[0].y);
                                ctx.fill(); ctx.stroke();
                            }
                            break;
                        case "polygon":
                        case "area":
                            if (pts.length >= 2) {
                                ctx.beginPath();
                                ctx.moveTo(pts[0].x, pts[0].y);
                                pts.forEach((p) => ctx.lineTo(p.x, p.y));
                                ctx.closePath();
                                ctx.fill(); ctx.stroke();
                            }
                            break;
                        case "line":
                            if (pts.length >= 2) {
                                ctx.beginPath();
                                ctx.moveTo(pts[0].x, pts[0].y);
                                for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
                                ctx.stroke();
                            }
                            break;
                        case "point":
                            if (pts.length >= 1) {
                                ctx.beginPath();
                                ctx.arc(pts[0].x, pts[0].y, rad(6), 0, Math.PI * 2);
                                ctx.fillStyle = stroke; ctx.fill();
                                ctx.strokeStyle = "#fff"; ctx.lineWidth = sw(2); ctx.stroke();
                            }
                            break;
                        case "measure":
                            if (pts.length >= 2) {
                                ctx.setLineDash([6, 4]);
                                ctx.beginPath();
                                ctx.moveTo(pts[0].x, pts[0].y);
                                ctx.lineTo(pts[1].x, pts[1].y);
                                ctx.stroke();
                                ctx.setLineDash([]);
                                if (shape.measureValue) {
                                    const mx = (pts[0].x + pts[1].x) / 2;
                                    const my = (pts[0].y + pts[1].y) / 2;
                                    ctx.font = "bold 12px 'Courier New'";
                                    const tw = ctx.measureText(shape.measureValue).width;
                                    ctx.fillStyle = "#1e293b";
                                    ctx.beginPath();
                                    ctx.roundRect(mx - tw / 2 - 6, my - 10, tw + 12, 20, 4);
                                    ctx.fill();
                                    ctx.fillStyle = "#fff";
                                    ctx.textAlign = "center";
                                    ctx.textBaseline = "middle";
                                    ctx.fillText(shape.measureValue, mx, my);
                                }
                            }
                            break;
                        case "arc":
                            if (pts.length >= 2 && shape.controlPoints?.length) {
                                ctx.beginPath();
                                ctx.moveTo(pts[0].x, pts[0].y);
                                for (let ci = 0; ci < shape.controlPoints.length; ci++) {
                                    const cpRaw = shape.controlPoints[ci];
                                    const cp = i2c(cpRaw.x, cpRaw.y);
                                    const nextPt = pts[(ci + 1) % pts.length];
                                    ctx.quadraticCurveTo(cp.x, cp.y, nextPt.x, nextPt.y);
                                }
                                ctx.closePath();
                                ctx.fill();
                                ctx.stroke();
                            }
                            break;
                        case "circle":
                            if (pts.length >= 1 && shape.radius != null) {
                                ctx.beginPath();
                                ctx.arc(pts[0].x, pts[0].y, shape.radius * sc, 0, Math.PI * 2);
                                ctx.fill();
                                ctx.stroke();
                            }
                            break;
                        default: break;
                    }

                    ctx.restore();
                }
            }

            // PASS 2: Draw cut-parent strokes + cut shape dashes
            if (cutShapesByParent.size > 0) {
                for (const [parentId, cutShapes] of cutShapesByParent) {
                    let parentShape = allVisibleForCut.find((s) => s.id === parentId);
                    if (!parentShape) continue;

                    if (liveDrag && liveDrag.id === parentId) {
                        parentShape = {
                            ...parentShape,
                            points: liveDrag.points,
                            ...(liveDrag.controlPoints !== undefined ? { controlPoints: liveDrag.controlPoints } : {}),
                            ...(liveDrag.radius !== undefined ? { radius: liveDrag.radius } : {}),
                        };
                    }

                    let cutDx = 0, cutDy = 0;
                    if (liveCutDrag && liveCutDrag.parentId === parentId) {
                        cutDx = liveCutDrag.dx;
                        cutDy = liveCutDrag.dy;
                    }

                    const isParentAi = aiShapeIds.has(parentShape.id);
                    const parentStroke = parentShape.color?.stroke ||
                        (!isParentAi ? TOOL_COLORS[parentShape.type]?.stroke : "#3b82f6");
                    const isParentSel = parentShape.id === selId || selIds.has(parentShape.id);

                    ctx.save();
                    ctx.strokeStyle = parentStroke;
                    ctx.lineWidth = sw(isParentSel ? 3 : 2);
                    ctx.setLineDash([]);
                    traceParentShapePath(ctx, parentShape, sc, i2c);
                    ctx.stroke();
                    ctx.restore();

                    for (const rawCutShape of cutShapes) {
                        const cutShape = cutDx !== 0 || cutDy !== 0
                            ? {
                                ...rawCutShape,
                                points: rawCutShape.points.map((p) => ({ x: p.x + cutDx, y: p.y + cutDy })),
                                ...(rawCutShape.controlPoints ? {
                                    controlPoints: rawCutShape.controlPoints.map((p) => ({ x: p.x + cutDx, y: p.y + cutDy }))
                                } : {}),
                            }
                            : (liveDrag && liveDrag.id === rawCutShape.id
                                ? {
                                    ...rawCutShape, points: liveDrag.points,
                                    ...(liveDrag.controlPoints !== undefined ? { controlPoints: liveDrag.controlPoints } : {}),
                                    ...(liveDrag.radius !== undefined ? { radius: liveDrag.radius } : {}),
                                }
                                : rawCutShape);

                        const cutPts = (cutShape.points || []).map((p) => i2c(p.x, p.y));
                        if (!cutPts.length) continue;
                        ctx.save();
                        ctx.strokeStyle = "#ef4444";
                        ctx.lineWidth = sw(2);
                        ctx.setLineDash([6, 4]);
                        ctx.beginPath();
                        if (cutShape.type === "circle" && cutShape.radius != null) {
                            ctx.arc(cutPts[0].x, cutPts[0].y, cutShape.radius * sc, 0, Math.PI * 2);
                        } else if (cutShape.type === "arc" && cutShape.controlPoints?.length) {
                            ctx.moveTo(cutPts[0].x, cutPts[0].y);
                            for (let ci = 0; ci < cutShape.controlPoints.length; ci++) {
                                const cpRaw = cutShape.controlPoints[ci];
                                const cp = i2c(cpRaw.x, cpRaw.y);
                                const nextPt = cutPts[(ci + 1) % cutPts.length];
                                ctx.quadraticCurveTo(cp.x, cp.y, nextPt.x, nextPt.y);
                            }
                            ctx.closePath();
                        } else {
                            ctx.moveTo(cutPts[0].x, cutPts[0].y);
                            for (let ci = 1; ci < cutPts.length; ci++) ctx.lineTo(cutPts[ci].x, cutPts[ci].y);
                            ctx.closePath();
                        }
                        ctx.stroke();
                        ctx.setLineDash([]);
                        ctx.restore();
                    }
                }
            }

            // PASS 3: Selection highlights + vertex dots
            for (let li = 0; li < allDrawShapes.length; li++) {
                const drawList = allDrawShapes[li];
                for (let si = 0; si < drawList.length; si++) {
                    const rawShape = drawList[si];
                    if (rawShape.isCutShape) continue;
                    const shape = (liveDrag && rawShape.id === liveDrag.id)
                        ? {
                            ...rawShape,
                            points: liveDrag.points,
                            ...(liveDrag.controlPoints !== undefined ? { controlPoints: liveDrag.controlPoints } : {}),
                            ...(liveDrag.radius !== undefined ? { radius: liveDrag.radius } : {}),
                        }
                        : rawShape;
                    const isSel = shape.id === selId || selIds.has(shape.id);
                    const isHov = shape.id === hovId;
                    const pts = shape.points?.map((p) => i2c(p.x, p.y)) || [];

                    ctx.save();

                    if (isSel && shape.type !== "point" && shape.type !== "measure") {
                        ctx.strokeStyle = "#1476FF";
                        ctx.lineWidth = 2;
                        ctx.setLineDash([]);

                        if (shape.type === "polygon" || shape.type === "area") {
                            ctx.beginPath(); ctx.moveTo(pts[0].x, pts[0].y);
                            pts.forEach((p) => ctx.lineTo(p.x, p.y)); ctx.closePath();
                        } else if (shape.type === "rectangle") {
                            ctx.beginPath();
                            ctx.rect(pts[0].x, pts[0].y, pts[1].x - pts[0].x, pts[1].y - pts[0].y);
                        } else if (shape.type === "line") {
                            ctx.beginPath(); ctx.moveTo(pts[0].x, pts[0].y);
                            for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
                        } else if (shape.type === "arc" && shape.controlPoints?.length) {
                            ctx.beginPath();
                            ctx.moveTo(pts[0].x, pts[0].y);
                            for (let ci = 0; ci < shape.controlPoints.length; ci++) {
                                const cpRaw = shape.controlPoints[ci];
                                const cp = i2c(cpRaw.x, cpRaw.y);
                                const nextPt = pts[(ci + 1) % pts.length];
                                ctx.quadraticCurveTo(cp.x, cp.y, nextPt.x, nextPt.y);
                            }
                            ctx.closePath();
                        } else if (shape.type === "circle" && shape.radius != null) {
                            ctx.beginPath();
                            ctx.arc(pts[0].x, pts[0].y, shape.radius * sc, 0, Math.PI * 2);
                        }
                        ctx.stroke();
                        ctx.setLineDash([]);

                        const showDots = isSelectMode || shape.id === drawingModeSelId;
                        const DOT_R = 5;
                        const EDGE_R = 3.5;
                        const vertexDotColor = "#1476FF";

                        if (showDots) {
                            if (shape.type === "arc" && shape.controlPoints?.length) {
                                shape.controlPoints.forEach((cpRaw) => {
                                    const cp = i2c(cpRaw.x, cpRaw.y);
                                    ctx.beginPath();
                                    ctx.moveTo(cp.x, cp.y - DOT_R);
                                    ctx.lineTo(cp.x + DOT_R, cp.y);
                                    ctx.lineTo(cp.x, cp.y + DOT_R);
                                    ctx.lineTo(cp.x - DOT_R, cp.y);
                                    ctx.closePath();
                                    ctx.fillStyle = "#10b98133"; ctx.fill();
                                    ctx.strokeStyle = "#10b981";
                                    ctx.lineWidth = sw(1.5); ctx.stroke();
                                });
                                pts.forEach((p) => {
                                    ctx.beginPath();
                                    ctx.arc(p.x, p.y, DOT_R, 0, Math.PI * 2);
                                    ctx.fillStyle = "#ffffff"; ctx.fill();
                                    ctx.strokeStyle = vertexDotColor; ctx.lineWidth = sw(2); ctx.stroke();
                                });
                            } else if (shape.type === "circle" && shape.radius != null) {
                                ctx.beginPath(); ctx.arc(pts[0].x, pts[0].y, DOT_R, 0, Math.PI * 2);
                                ctx.fillStyle = "#ffffff"; ctx.fill();
                                ctx.strokeStyle = vertexDotColor; ctx.lineWidth = sw(2); ctx.stroke();
                                const edgeX = pts[0].x + shape.radius * sc;
                                ctx.beginPath(); ctx.arc(edgeX, pts[0].y, DOT_R, 0, Math.PI * 2);
                                ctx.fillStyle = "#ffffff"; ctx.fill();
                                ctx.strokeStyle = vertexDotColor; ctx.lineWidth = sw(2); ctx.stroke();
                            } else {
                                const vertexPts = (shape.type === "rectangle" && pts.length >= 2)
                                    ? [pts[0], { x: pts[1].x, y: pts[0].y }, pts[1], { x: pts[0].x, y: pts[1].y }]
                                    : pts;

                                const isSymbolShape = shape.areaType === "symbol" || !!shape.symbolType;
                                if (!isSymbolShape && (shape.type === "polygon" || shape.type === "area" || shape.type === "line") && vertexPts.length >= 2) {
                                    const isClosed = shape.type === "polygon" || shape.type === "area";
                                    const edgeCount = isClosed ? vertexPts.length : vertexPts.length - 1;
                                    for (let vi = 0; vi < edgeCount; vi++) {
                                        const a = vertexPts[vi];
                                        const b = vertexPts[(vi + 1) % vertexPts.length];
                                        const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
                                        ctx.beginPath();
                                        ctx.arc(mx, my, EDGE_R, 0, Math.PI * 2);
                                        ctx.fillStyle = "#1476FF55"; ctx.fill();
                                        ctx.strokeStyle = "#ffffff99"; ctx.lineWidth = sw(1); ctx.stroke();
                                    }
                                }

                                const displayPts = isSymbolShape && vertexPts.length >= 3
                                    ? (() => {
                                        const xs = vertexPts.map((p) => p.x);
                                        const ys = vertexPts.map((p) => p.y);
                                        const minX = Math.min(...xs), maxX = Math.max(...xs);
                                        const minY = Math.min(...ys), maxY = Math.max(...ys);
                                        return [
                                            { x: minX, y: minY }, { x: maxX, y: minY },
                                            { x: maxX, y: maxY }, { x: minX, y: maxY },
                                        ];
                                    })()
                                    : vertexPts;

                                displayPts.forEach((p) => {
                                    ctx.beginPath();
                                    ctx.arc(p.x, p.y, DOT_R, 0, Math.PI * 2);
                                    ctx.fillStyle = vertexDotColor; ctx.fill();
                                    ctx.strokeStyle = "#fff"; ctx.lineWidth = sw(2); ctx.stroke();
                                });
                            }
                        }
                    }

                    if (isHov && !isSel && isSelectMode && shape.type !== "point" && shape.type !== "measure") {
                        ctx.strokeStyle = "#818cf8";
                        ctx.lineWidth = sw(2.5);
                        ctx.setLineDash([]);
                        if (shape.type === "polygon" || shape.type === "area") {
                            ctx.beginPath(); ctx.moveTo(pts[0].x, pts[0].y);
                            pts.forEach((p) => ctx.lineTo(p.x, p.y)); ctx.closePath();
                        } else if (shape.type === "rectangle") {
                            ctx.beginPath();
                            ctx.rect(pts[0].x, pts[0].y, pts[1].x - pts[0].x, pts[1].y - pts[0].y);
                        } else if (shape.type === "line") {
                            ctx.beginPath(); ctx.moveTo(pts[0].x, pts[0].y);
                            for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
                        } else if (shape.type === "arc" && shape.controlPoints?.length) {
                            ctx.beginPath();
                            ctx.moveTo(pts[0].x, pts[0].y);
                            for (let ci = 0; ci < shape.controlPoints.length; ci++) {
                                const cpRaw = shape.controlPoints[ci];
                                const cp = i2c(cpRaw.x, cpRaw.y);
                                const nextPt = pts[(ci + 1) % pts.length];
                                ctx.quadraticCurveTo(cp.x, cp.y, nextPt.x, nextPt.y);
                            }
                            ctx.closePath();
                        } else if (shape.type === "circle" && shape.radius != null) {
                            ctx.beginPath();
                            ctx.arc(pts[0].x, pts[0].y, shape.radius * sc, 0, Math.PI * 2);
                        }
                        ctx.stroke();
                    }

                    ctx.restore();
                }
            }

            // PASS 4: Cut shape selection handles
            const cutShapesToDraw = [
                ...currentShapesRenderRef.current.filter((s) => s.isCutShape),
                ...visibleAiShapesRenderRef.current.filter((s) => s.isCutShape),
            ];
            if (cutShapesToDraw.length > 0) {
                ctx.save();
                for (const rawCutShape of cutShapesToDraw) {
                    const parentId = rawCutShape.cutParentAreaId;
                    // Resolve parent for liveCutDrag offset — check by ID, takeoffId, and cutParentTakeoffId
                    let resolvedParentId = parentId;
                    const parentForPass4 = allVisibleForCut.find(
                        (p) => p.id === parentId || p.takeoffId === parentId ||
                            (rawCutShape.cutParentTakeoffId && p.takeoffId === rawCutShape.cutParentTakeoffId)
                    );
                    if (parentForPass4) resolvedParentId = parentForPass4.id;

                    let cutDx = 0, cutDy = 0;
                    if (liveCutDrag && (
                        liveCutDrag.parentId === resolvedParentId ||
                        liveCutDrag.parentId === parentId ||
                        (rawCutShape.cutParentTakeoffId && liveCutDrag.parentTakeoffId === rawCutShape.cutParentTakeoffId)
                    )) {
                        cutDx = liveCutDrag.dx;
                        cutDy = liveCutDrag.dy;
                    }
                    let cutShape = (liveDrag && rawCutShape.id === liveDrag.id)
                        ? {
                            ...rawCutShape, points: liveDrag.points,
                            ...(liveDrag.controlPoints !== undefined ? { controlPoints: liveDrag.controlPoints } : {}),
                            ...(liveDrag.radius !== undefined ? { radius: liveDrag.radius } : {}),
                        }
                        : rawCutShape;
                    if (cutDx !== 0 || cutDy !== 0) {
                        cutShape = {
                            ...cutShape,
                            points: cutShape.points.map((p) => ({ x: p.x + cutDx, y: p.y + cutDy })),
                            ...(cutShape.controlPoints ? {
                                controlPoints: cutShape.controlPoints.map((p) => ({ x: p.x + cutDx, y: p.y + cutDy }))
                            } : {}),
                        };
                    }
                    const cutPtsC = (cutShape.points || []).map((p) => i2c(p.x, p.y));
                    if (!cutPtsC.length) continue;
                    const isCutSel = cutShape.id === selId || selIds.has(cutShape.id);

                    ctx.save();
                    ctx.strokeStyle = "#ef4444";
                    ctx.lineWidth = isCutSel ? 3 : 2;
                    ctx.setLineDash([6, 4]);
                    ctx.beginPath();
                    if (cutShape.type === "circle" && cutShape.radius != null) {
                        ctx.arc(cutPtsC[0].x, cutPtsC[0].y, cutShape.radius * sc, 0, Math.PI * 2);
                    } else if (cutShape.type === "arc" && cutShape.controlPoints?.length) {
                        ctx.moveTo(cutPtsC[0].x, cutPtsC[0].y);
                        for (let ci = 0; ci < cutShape.controlPoints.length; ci++) {
                            const cpRaw = cutShape.controlPoints[ci];
                            const cp = i2c(cpRaw.x, cpRaw.y);
                            const nextPt = cutPtsC[(ci + 1) % cutPtsC.length];
                            ctx.quadraticCurveTo(cp.x, cp.y, nextPt.x, nextPt.y);
                        }
                        ctx.closePath();
                    } else {
                        ctx.moveTo(cutPtsC[0].x, cutPtsC[0].y);
                        cutPtsC.forEach((p) => ctx.lineTo(p.x, p.y));
                        ctx.closePath();
                    }
                    ctx.stroke();
                    ctx.setLineDash([]);
                    ctx.restore();

                    if (isCutSel) {
                        const DOT_R = 5;
                        const EDGE_R = 3.5;
                        if (cutShape.type === "arc" && cutShape.controlPoints?.length) {
                            cutShape.controlPoints.forEach((cpRaw) => {
                                const cp = i2c(cpRaw.x, cpRaw.y);
                                ctx.beginPath();
                                ctx.moveTo(cp.x, cp.y - DOT_R);
                                ctx.lineTo(cp.x + DOT_R, cp.y);
                                ctx.lineTo(cp.x, cp.y + DOT_R);
                                ctx.lineTo(cp.x - DOT_R, cp.y);
                                ctx.closePath();
                                ctx.fillStyle = "#ef444433"; ctx.fill();
                                ctx.strokeStyle = "#ef4444"; ctx.lineWidth = sw(1.5); ctx.stroke();
                            });
                            cutPtsC.forEach((p) => {
                                ctx.beginPath();
                                ctx.arc(p.x, p.y, DOT_R, 0, Math.PI * 2);
                                ctx.fillStyle = "#ef4444"; ctx.fill();
                                ctx.strokeStyle = "#fff"; ctx.lineWidth = sw(2); ctx.stroke();
                            });
                        } else if (cutShape.type === "circle" && cutShape.radius != null) {
                            ctx.beginPath(); ctx.arc(cutPtsC[0].x, cutPtsC[0].y, DOT_R, 0, Math.PI * 2);
                            ctx.fillStyle = "#ef4444"; ctx.fill();
                            ctx.strokeStyle = "#fff"; ctx.lineWidth = sw(2); ctx.stroke();
                            const edgeX = cutPtsC[0].x + cutShape.radius * sc;
                            ctx.beginPath(); ctx.arc(edgeX, cutPtsC[0].y, DOT_R, 0, Math.PI * 2);
                            ctx.fillStyle = "#ef4444"; ctx.fill();
                            ctx.strokeStyle = "#fff"; ctx.lineWidth = sw(2); ctx.stroke();
                        } else {
                            if (cutShape.type === "polygon" && cutPtsC.length >= 2) {
                                const edgeCount = cutPtsC.length;
                                for (let vi = 0; vi < edgeCount; vi++) {
                                    const a = cutPtsC[vi];
                                    const b = cutPtsC[(vi + 1) % cutPtsC.length];
                                    const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
                                    ctx.beginPath();
                                    ctx.arc(mx, my, EDGE_R, 0, Math.PI * 2);
                                    ctx.fillStyle = "#ef444455"; ctx.fill();
                                    ctx.strokeStyle = "#ffffff99"; ctx.lineWidth = sw(1); ctx.stroke();
                                }
                            }
                            cutPtsC.forEach((p) => {
                                ctx.beginPath();
                                ctx.arc(p.x, p.y, DOT_R, 0, Math.PI * 2);
                                ctx.fillStyle = "#ef4444"; ctx.fill();
                                ctx.strokeStyle = "#fff"; ctx.lineWidth = sw(2); ctx.stroke();
                            });
                        }
                    }
                }
                ctx.restore();
            }

            // PASS 5: Draft drawing preview + crosshair cursor
            const mouseImg = mouseImgRef?.current;
            const dPtsRaw = draftPointsRef.current;
            const currentActiveObjType = activeObjectTypeRef.current;
            const isCutDraft = isCutSubType(currentActiveObjType);
            const col = isCutDraft
                ? { stroke: "#ef4444", fill: "transparent" }
                : (detectionColorRef.current || TOOL_COLORS[currentTool] || TOOL_COLORS.polygon);

            if (mouseImg) {
                const mouse = i2c(mouseImg.x, mouseImg.y);

                if (currentTool === "arc") {
                    const arcPts = arcPointsRef.current;
                    const arcCtrls = arcCtrlsRef.current;
                    const arcCol = isCutDraft
                        ? { stroke: "#ef4444", fill: "transparent" }
                        : TOOL_COLORS.arc;

                    if (arcPts.length >= 1) {
                        ctx.save();
                        ctx.strokeStyle = arcCol.stroke;
                        ctx.fillStyle = arcCol.fill;
                        ctx.lineWidth = sw(2);
                        if (isCutDraft) ctx.setLineDash([6, 4]);

                        if (arcPts.length >= 2) {
                            const ap = arcPts.map((p) => i2c(p.x, p.y));
                            ctx.beginPath();
                            ctx.moveTo(ap[0].x, ap[0].y);
                            for (let ci = 0; ci < arcCtrls.length; ci++) {
                                const cp = i2c(arcCtrls[ci].x, arcCtrls[ci].y);
                                ctx.quadraticCurveTo(cp.x, cp.y, ap[ci + 1].x, ap[ci + 1].y);
                            }
                            ctx.stroke();
                        }

                        const lastAp = i2c(arcPts[arcPts.length - 1].x, arcPts[arcPts.length - 1].y);
                        const previewCpX = (lastAp.x + mouse.x) / 2;
                        const previewCpY = (lastAp.y + mouse.y) / 2;
                        ctx.save();
                        ctx.setLineDash([5, 4]);
                        ctx.beginPath();
                        ctx.moveTo(lastAp.x, lastAp.y);
                        ctx.quadraticCurveTo(previewCpX, previewCpY, mouse.x, mouse.y);
                        ctx.stroke();
                        ctx.restore();

                        if (arcPts.length >= 3) {
                            const firstAp = i2c(arcPts[0].x, arcPts[0].y);
                            if (dist(mouseImg, arcPts[0]) < 14 / sc) {
                                ctx.beginPath();
                                ctx.arc(firstAp.x, firstAp.y, 9, 0, Math.PI * 2);
                                ctx.strokeStyle = arcCol.stroke; ctx.lineWidth = 2; ctx.stroke();
                            }
                        }

                        arcPts.map((p) => i2c(p.x, p.y)).forEach((p) => {
                            ctx.beginPath();
                            ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
                            ctx.fillStyle = arcCol.stroke; ctx.fill();
                            ctx.strokeStyle = "#fff"; ctx.lineWidth = 1.5; ctx.stroke();
                        });

                        arcCtrls.map((p) => i2c(p.x, p.y)).forEach((cp) => {
                            const r = 5;
                            ctx.beginPath();
                            ctx.moveTo(cp.x, cp.y - r);
                            ctx.lineTo(cp.x + r, cp.y);
                            ctx.lineTo(cp.x, cp.y + r);
                            ctx.lineTo(cp.x - r, cp.y);
                            ctx.closePath();
                            ctx.fillStyle = isCutDraft ? "#ef444433" : "hsl(160 70% 90%)";
                            ctx.strokeStyle = arcCol.stroke; ctx.lineWidth = 1.5;
                            ctx.fill(); ctx.stroke();
                        });

                        ctx.restore();
                    }
                }

                if (currentTool === "circle" && circleDraftRef.current) {
                    const circleCol = isCutDraft
                        ? { stroke: "#ef4444", fill: "transparent" }
                        : TOOL_COLORS.circle;
                    const cd = circleDraftRef.current;
                    const center = i2c(cd.center.x, cd.center.y);
                    const edge = i2c(cd.edge.x, cd.edge.y);
                    const radius = dist(edge, center);
                    ctx.save();
                    if (isCutDraft) ctx.setLineDash([6, 4]);
                    ctx.strokeStyle = circleCol.stroke;
                    ctx.fillStyle = circleCol.fill;
                    ctx.lineWidth = sw(2);
                    ctx.beginPath();
                    ctx.arc(center.x, center.y, radius, 0, Math.PI * 2);
                    if (!isCutDraft) ctx.fill();
                    ctx.stroke();
                    ctx.setLineDash([]);
                    ctx.beginPath();
                    ctx.arc(center.x, center.y, 4, 0, Math.PI * 2);
                    ctx.fillStyle = circleCol.stroke; ctx.fill();
                    ctx.restore();
                }
            }

            if (dPtsRaw.length > 0 && mouseImg) {
                const dPts = dPtsRaw.map((p) => i2c(p.x, p.y));
                const mouse = i2c(mouseImg.x, mouseImg.y);

                ctx.save();
                ctx.strokeStyle = col.stroke;
                ctx.fillStyle = col.fill;
                ctx.lineWidth = sw(2);
                if (isCutDraft) ctx.setLineDash([6, 4]);

                if (currentTool === "polygon") {
                    const isOpenLine = currentActiveObjType === "wall" || currentActiveObjType === "pipeline";
                    ctx.beginPath();
                    ctx.moveTo(dPts[0].x, dPts[0].y);
                    dPts.forEach((p) => ctx.lineTo(p.x, p.y));
                    ctx.lineTo(mouse.x, mouse.y);
                    if (!isOpenLine) { ctx.closePath(); ctx.fill(); }
                    ctx.stroke();

                    dPts.forEach((p) => {
                        ctx.beginPath();
                        ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
                        ctx.fillStyle = col.stroke; ctx.fill();
                        ctx.strokeStyle = "#fff"; ctx.lineWidth = 1.5; ctx.stroke();
                    });

                    if (!isOpenLine && dPtsRaw.length >= 3 && dist(mouseImg, dPtsRaw[0]) < Math.min(14 / sc, 40)) {
                        ctx.beginPath();
                        ctx.arc(dPts[0].x, dPts[0].y, 9, 0, Math.PI * 2);
                        ctx.strokeStyle = col.stroke; ctx.lineWidth = 2; ctx.stroke();
                    }
                } else if (currentTool === "rectangle" && dPts.length === 1) {
                    ctx.beginPath();
                    ctx.rect(dPts[0].x, dPts[0].y, mouse.x - dPts[0].x, mouse.y - dPts[0].y);
                    ctx.fill(); ctx.stroke();
                } else if (currentTool === "line" && dPts.length === 1) {
                    ctx.beginPath();
                    ctx.moveTo(dPts[0].x, dPts[0].y);
                    ctx.lineTo(mouse.x, mouse.y);
                    ctx.stroke();
                } else if (currentTool === "measure" && dPts.length === 1) {
                    ctx.setLineDash([6, 4]);
                    ctx.beginPath();
                    ctx.moveTo(dPts[0].x, dPts[0].y);
                    ctx.lineTo(mouse.x, mouse.y);
                    ctx.stroke();
                    ctx.setLineDash([]);
                    const lbl = `${pixelsToFeet(dist(dPtsRaw[0], mouseImg)).toFixed(1)} ft`;
                    ctx.font = "bold 12px 'Courier New'";
                    const tw = ctx.measureText(lbl).width;
                    const mx = (dPts[0].x + mouse.x) / 2;
                    const my = (dPts[0].y + mouse.y) / 2;
                    ctx.fillStyle = "#1e293b";
                    ctx.beginPath();
                    ctx.roundRect(mx - tw / 2 - 6, my - 10, tw + 12, 20, 4);
                    ctx.fill();
                    ctx.fillStyle = "#fff";
                    ctx.textAlign = "center"; ctx.textBaseline = "middle";
                    ctx.fillText(lbl, mx, my);
                }

                ctx.restore();
            }

            // Crosshair cursor
            const mcp = mouseCanvasPosRef.current;
            if (mcp && currentTool !== "select" && currentTool !== "pan" && !hoveredShapeIdRef.current && hoveredHandleRef.current !== "vertex") {
                const { x, y } = mcp;
                const guide = col.stroke || "#6366f1";
                ctx.save();
                ctx.strokeStyle = guide + "40";
                ctx.lineWidth = 1;
                ctx.setLineDash([4, 8]);
                ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(cssW, y); ctx.stroke();
                ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, cssH); ctx.stroke();
                ctx.setLineDash([]);
                const ARM = 10, DOT = 3;
                ctx.strokeStyle = guide; ctx.lineWidth = 1.5;
                ctx.beginPath(); ctx.moveTo(x - ARM, y); ctx.lineTo(x + ARM, y); ctx.stroke();
                ctx.beginPath(); ctx.moveTo(x, y - ARM); ctx.lineTo(x, y + ARM); ctx.stroke();
                ctx.beginPath();
                ctx.arc(x, y, DOT, 0, Math.PI * 2);
                ctx.fillStyle = guide; ctx.fill();
                ctx.restore();
            }
        };

        loop();
        return () => {
            running = false;
            if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
        };
    }, []);

    const selectNewShape = useCallback((shapeId) => {
        suppressToolClearRef.current = true;

        drawingModeSelectedIdRef.current = shapeId;
        setDrawingModeSelectedId(shapeId);
        selectedShapeIdRef.current = shapeId;
        setSelectedShapeId(shapeId);
        if (setSelectedShapeIds) setSelectedShapeIds(new Set([shapeId]));
        dirtyRef.current = true;

        let rafCount = 0;
        const keepDirty = () => {
            dirtyRef.current = true;
            rafCount++;
            if (rafCount < 6) requestAnimationFrame(keepDirty);
            else scheduleDeleteBtnUpdate();
        };
        requestAnimationFrame(keepDirty);
    }, [setSelectedShapeId, setSelectedShapeIds, scheduleDeleteBtnUpdate]);

    // ── Pointer: move ─────────────────────────────────────────────────────────
    const onPointerMove = useCallback((e) => {
        lastClientPosRef.current = { x: e.clientX, y: e.clientY };
        lastPointerEventRef.current = {
            clientX: e.clientX,
            clientY: e.clientY,
            pointerId: e.pointerId,
            target: e.target,
        };

        const { x, y } = getCanvasPos(e);
        let imgPos = canvasToImage(x, y);

        if (imgDimsRef.current && imgDimsRef.current.w) {
            imgPos = {
                x: Math.max(0, Math.min(imgDimsRef.current.w, imgPos.x)),
                y: Math.max(0, Math.min(imgDimsRef.current.h, imgPos.y)),
            };
        }

        const movingObjType = activeObjectTypeRef.current;

        // if (isCutSubType(movingObjType)) {
        //     const isActivelyPlacingNow =
        //         (toolRef.current === "polygon" && draftPointsRef.current.length > 0) ||
        //         (toolRef.current === "arc" && arcPointsRef.current.length > 0) ||
        //         (toolRef.current === "circle" && isDrawingRef.current);

        //     if (isActivelyPlacingNow) {
        //         const parent = resolveParentArea(imgPos);
        //         if (parent) {
        //             imgPos = clampPointToArea(imgPos, parent);
        //         }
        //     }
        // }
        if (isCutSubType(movingObjType)) {
            const isActivelyPlacingNow =
                (toolRef.current === "polygon" && draftPointsRef.current.length > 0) ||
                (toolRef.current === "arc" && arcPointsRef.current.length > 0) ||
                (toolRef.current === "circle" && isDrawingRef.current);

            if (isActivelyPlacingNow) {
                // ── FIX: During active drawing, always clamp to the stored parent.
                // Do NOT call resolveParentArea here — it returns null when mouse
                // moves outside the parent boundary, which kills clamping entirely.
                // The parent was locked in at first click; use it unconditionally.
                const parent = cutParentAreaRef.current;
                if (parent) {
                    imgPos = clampPointToArea(imgPos, parent);
                }
            }
        }
        mouseImgRef.current = imgPos;

        if (isPanningRef.current) {
            const s = stageRef.current;
            if (!s) return;
            s.scrollLeft = panStartRef.current.scrollL - (e.clientX - panStartRef.current.mouseX);
            s.scrollTop = panStartRef.current.scrollT - (e.clientY - panStartRef.current.mouseY);
            return;
        }

        if (vertexDragRef.current) {
            vertexMovedRef.current = true;
            const { shapeId, vertexIndex: vi, isRect: rect } = vertexDragRef.current;

            const computeVertexUpdate = (s, ip, parentArea) => {
                if (s.type === "arc") {
                    if (vi < 0) {
                        const cpIdx = -(vi + 1);
                        let targetCp = { x: ip.x, y: ip.y };
                        if (s.isCutShape && parentArea) {
                            const p0 = s.points[cpIdx];
                            const p1 = (cpIdx === s.points.length - 1) ? s.points[0] : s.points[cpIdx + 1];
                            if (p0 && p1) {
                                targetCp = clampArcControlPointToArea(p0, targetCp, p1, parentArea);
                            }
                        }
                        return {
                            points: s.points,
                            controlPoints: (s.controlPoints || []).map((cp, i) => i === cpIdx ? targetCp : cp),
                        };
                    }
                    return { points: s.points.map((p, i) => i === vi ? { x: ip.x, y: ip.y } : p), controlPoints: s.controlPoints };
                }
                if (s.type === "circle" && s.radius != null) {
                    if (vi === 0) {
                        // ip is already clamped by the outer handler via clampCircleToArea.
                        return { points: [{ x: ip.x, y: ip.y }], radius: s.radius };
                    }
                    if (vi === 1) {
                        const center = s.points[0];
                        let edgePos = ip;
                        if (s.isCutShape && s.cutParentAreaId) {
                            const parentShape =
                                visibleAiShapesRef.current?.find((ps) => ps.id === s.cutParentAreaId) ||
                                currentShapesRef.current?.find((ps) => ps.id === s.cutParentAreaId) ||
                                visibleAiShapesRef.current?.find((ps) => ps.takeoffId === s.cutParentAreaId);
                            if (parentShape) {
                                edgePos = clampCircleRadiusToArea(center, ip, parentShape);
                            }
                        }
                        const newRadius = Math.max(
                            Math.sqrt(Math.pow(edgePos.x - center.x, 2) + Math.pow(edgePos.y - center.y, 2)),
                            2 / scaleRef.current
                        );
                        return { points: s.points, radius: newRadius };
                    }
                    return { points: s.points, radius: s.radius };
                }
                if (s.areaType === "symbol" || s.symbolType) {
                    const pts = s.points;
                    const xs = pts.map((p) => p.x), ys = pts.map((p) => p.y);
                    const origMinX = Math.min(...xs), origMaxX = Math.max(...xs);
                    const origMinY = Math.min(...ys), origMaxY = Math.max(...ys);
                    let minX = origMinX, maxX = origMaxX, minY = origMinY, maxY = origMaxY;
                    if (vi === 0) { minX = ip.x; minY = ip.y; }
                    else if (vi === 1) { maxX = ip.x; minY = ip.y; }
                    else if (vi === 2) { maxX = ip.x; maxY = ip.y; }
                    else if (vi === 3) { minX = ip.x; maxY = ip.y; }
                    const scaleX = (origMaxX - origMinX) > 0 ? (maxX - minX) / (origMaxX - origMinX) : 1;
                    const scaleY = (origMaxY - origMinY) > 0 ? (maxY - minY) / (origMaxY - origMinY) : 1;
                    return { points: pts.map((p) => ({ x: minX + (p.x - origMinX) * scaleX, y: minY + (p.y - origMinY) * scaleY })) };
                }
                if (rect && s.points.length >= 2) {
                    const [tl, br] = s.points;
                    let newTL = { ...tl }, newBR = { ...br };
                    if (vi === 0) { newTL = { x: ip.x, y: ip.y }; }
                    else if (vi === 1) { newTL = { ...tl, y: ip.y }; newBR = { ...br, x: ip.x }; }
                    else if (vi === 2) { newBR = { x: ip.x, y: ip.y }; }
                    else if (vi === 3) { newTL = { ...tl, x: ip.x }; newBR = { ...br, y: ip.y }; }
                    return { points: [newTL, newBR] };
                }
                return { points: s.points.map((p, i) => i === vi ? { x: ip.x, y: ip.y } : p) };
            };

            const targetShape =
                currentShapesRef.current?.find((s) => s.id === shapeId) ||
                visibleAiShapesRef.current?.find((s) => s.id === shapeId) ||
                allShapesRef.current?.find((s) => s.id === shapeId);

            if (targetShape) {
                let clampedImgPos = imgPos;
                let cutVertexParentShape = null;
                if (targetShape.isCutShape && targetShape.cutParentAreaId) {
                    const parentShape =
                        visibleAiShapesRef.current?.find((s) => s.id === targetShape.cutParentAreaId) ||
                        currentShapesRef.current?.find((s) => s.id === targetShape.cutParentAreaId) ||
                        visibleAiShapesRef.current?.find((s) => s.takeoffId === targetShape.cutParentAreaId) ||
                        (targetShape.cutParentTakeoffId && (
                            visibleAiShapesRef.current?.find((s) => s.takeoffId === targetShape.cutParentTakeoffId) ||
                            currentShapesRef.current?.find((s) => s.takeoffId === targetShape.cutParentTakeoffId)
                        )) || null;
                    if (parentShape) {
                        cutVertexParentShape = parentShape;
                        if (targetShape.type === "circle" && vertexDragRef.current?.vertexIndex === 0) {
                            if (parentShape) clampedImgPos = clampCircleToArea(targetShape.points[0], imgPos, targetShape.radius, parentShape);
                        } else if (targetShape.type === "circle" && vertexDragRef.current?.vertexIndex === 1) {
                            const center = targetShape.points[0];
                            const clampedEdge = clampCircleRadiusToArea(center, imgPos, parentShape);
                            clampedImgPos = clampedEdge;
                        } else if (targetShape.type === "arc" && vertexDragRef.current?.vertexIndex < 0) {
                            // Arc control point dragging - do NOT clamp to boundary.
                            // The curve itself will be clamped inside computeVertexUpdate.
                            clampedImgPos = imgPos;
                        } else {
                            clampedImgPos = clampPointToArea(imgPos, parentShape);
                        }
                    }
                }
                const { points: newPts, controlPoints: newCps, radius: newRadius } = computeVertexUpdate(targetShape, clampedImgPos, cutVertexParentShape);
                const live = { id: shapeId, points: newPts };
                if (newCps !== undefined) live.controlPoints = newCps;
                if (newRadius !== undefined) live.radius = newRadius;
                else if (targetShape.radius != null) live.radius = targetShape.radius;
                // After a vertex drag on a cut arc, re-clamp all control points to the parent
                // so the bezier curves don't extend outside the boundary with the new vertex position.
                const vi = vertexDragRef.current?.vertexIndex;
                if (
                    cutVertexParentShape &&
                    targetShape.type === "arc" &&
                    vi !== undefined && vi >= 0 &&
                    live.controlPoints?.length
                ) {
                    live.controlPoints = live.controlPoints.map((cp, idx) => {
                        const p0 = live.points[idx];
                        const p1 = live.points[(idx + 1) % live.points.length];
                        if (p0 && p1) {
                            return clampArcControlPointToArea(p0, cp, p1, cutVertexParentShape);
                        }
                        return cp;
                    });
                }

                // Parent-resize constraint: stop the parent vertex from entering or crossing
                // any cut child shape. Strategy differs by parent type:
                //   • circle / rectangle  → containment check (isPointInArea is exact for these)
                //   • polygon / arc / area → direct check: does the moved vertex OR its adjacent
                //     edges (sampled as bezier where applicable) enter a cut child shape?
                //     This avoids the polygon-winding inaccuracy that plagues concave arc shapes.
                const isParentArcControlDrag =
                    targetShape.type === "arc" && targetShape.controlPoints?.length && vi !== undefined && vi < 0;
                if (!targetShape.isCutShape && vi !== undefined && (vi >= 0 || isParentArcControlDrag)) {
                    // Match cut children the same way a cut tool finds its parent — by canvas
                    // id OR takeoffId on either link field. A narrower filter misses AI /
                    // repointed shapes whose cutParentAreaId holds the takeoffId, leaving
                    // cutChildren empty and silently disabling the whole resize validation.
                    const cutChildren = [
                        ...(currentShapesRef.current || []),
                        ...(visibleAiShapesRef.current || []),
                    ].filter((cs) => cs.isCutShape && (
                        cs.cutParentAreaId === shapeId ||
                        (targetShape.takeoffId && cs.cutParentAreaId === targetShape.takeoffId) ||
                        (targetShape.takeoffId && cs.cutParentTakeoffId === targetShape.takeoffId)
                    ));

                    if (cutChildren.length > 0) {
                        // densifyBoundary: convert any shape's outline into a dense array of
                        // boundary points so that point-in-polygon tests follow the ACTUAL
                        // rendered shape — bezier curves for arcs, sampled circumference for
                        // circles, sampled edges for rect/polygon. This is what makes the
                        // arc-parent ↔ arc-cut validation accurate (raw vertices are not enough).
                        const densifyBoundary = (shape, segSamples) => {
                            if (shape.type === "circle" && shape.radius != null && shape.points?.[0]) {
                                const c = shape.points[0];
                                const out = [];
                                const N = 48;
                                for (let k = 0; k < N; k++) {
                                    const a = (k * Math.PI * 2) / N;
                                    out.push({ x: c.x + shape.radius * Math.cos(a), y: c.y + shape.radius * Math.sin(a) });
                                }
                                return out;
                            }
                            let basePts = shape.points || [];
                            if (shape.type === "rectangle" && basePts.length >= 2) {
                                const [tl, br] = basePts;
                                basePts = [tl, { x: br.x, y: tl.y }, br, { x: tl.x, y: br.y }];
                            }
                            if (basePts.length < 2) return basePts;
                            const isArc = shape.type === "arc" && shape.controlPoints?.length;
                            const n = basePts.length;
                            const out = [];
                            for (let si = 0; si < n; si++) {
                                const p0 = basePts[si];
                                const p1 = basePts[(si + 1) % n];
                                const cp = isArc ? shape.controlPoints[si] : null;
                                out.push(p0);
                                for (let k = 1; k < segSamples; k++) {
                                    const t = k / segSamples;
                                    if (cp) {
                                        out.push({
                                            x: (1 - t) * (1 - t) * p0.x + 2 * (1 - t) * t * cp.x + t * t * p1.x,
                                            y: (1 - t) * (1 - t) * p0.y + 2 * (1 - t) * t * cp.y + t * t * p1.y,
                                        });
                                    } else {
                                        out.push({ x: p0.x + t * (p1.x - p0.x), y: p0.y + t * (p1.y - p0.y) });
                                    }
                                }
                            }
                            return out;
                        };

                        // Precompute the dense boundary polygon of every cut child once
                        // (independent of the parent's proposed position).
                        const cutPolys = cutChildren.map((cs) => densifyBoundary(cs, 6));

                        // Record which cut-boundary points were inside the ORIGINAL parent.
                        // Only those must stay inside — a pre-existing out-of-bounds point
                        // (e.g. from an earlier edit) won't lock an unrelated vertex drag.
                        const origParentPoly = densifyBoundary(targetShape, 10);
                        const cutInsideOrig = cutPolys.map((poly) =>
                            poly.map((p) => isPointInPolygon(p, origParentPoly))
                        );

                        // isSafe is intentionally LOCAL — it only judges what the dragged
                        // vertex actually changes, mirroring how the cut tool clamps each of
                        // its own points to its parent. Two conditions:
                        //   1. Relative containment — every cut point that started inside the
                        //      parent must remain inside (stops the cut escaping when the parent
                        //      edge near the vertex recedes).
                        //   2. Local intrusion — the two boundary segments touching the dragged
                        //      vertex (sampled as beziers for arcs) must not enter any cut tool.
                        //      Only these segments change, so unrelated dips elsewhere on the
                        //      shape never lock this vertex.
                        const isSafe = (parentShape) => {
                            const parentPoly = densifyBoundary(parentShape, 10);
                            if (parentPoly.length < 3) return true;

                            // 1. relative containment
                            for (let ci = 0; ci < cutPolys.length; ci++) {
                                const poly = cutPolys[ci];
                                const insideFlags = cutInsideOrig[ci];
                                for (let pi = 0; pi < poly.length; pi++) {
                                    if (insideFlags[pi] && !isPointInPolygon(poly[pi], parentPoly)) return false;
                                }
                            }

                            // 2. local intrusion — segments adjacent to the dragged vertex
                            let ppts = parentShape.points || [];
                            if (parentShape.type === "rectangle" && ppts.length >= 2) {
                                const [tl, br] = ppts;
                                ppts = [tl, { x: br.x, y: tl.y }, br, { x: tl.x, y: br.y }];
                            }
                            const pn = ppts.length;
                            if (pn >= 2 && (vi < pn || isParentArcControlDrag)) {
                                const cpIdx = isParentArcControlDrag ? -(vi + 1) : null;
                                const segIdxs = isParentArcControlDrag
                                    ? [cpIdx]
                                    : [(vi - 1 + pn) % pn, vi % pn];
                                const SAMP = 28;
                                for (const segIdx of segIdxs) {
                                    if (segIdx == null || segIdx < 0 || segIdx >= pn) continue;
                                    const a = ppts[segIdx];
                                    const b = ppts[(segIdx + 1) % pn];
                                    if (!a || !b) continue;
                                    const cp = (parentShape.type === "arc" && parentShape.controlPoints?.length > segIdx)
                                        ? parentShape.controlPoints[segIdx] : null;
                                    for (let k = 0; k <= SAMP; k++) {
                                        const t = k / SAMP;
                                        const sp = cp ? {
                                            x: (1 - t) * (1 - t) * a.x + 2 * (1 - t) * t * cp.x + t * t * b.x,
                                            y: (1 - t) * (1 - t) * a.y + 2 * (1 - t) * t * cp.y + t * t * b.y,
                                        } : { x: a.x + t * (b.x - a.x), y: a.y + t * (b.y - a.y) };
                                        for (let ci = 0; ci < cutPolys.length; ci++) {
                                            if (cutPolys[ci].length >= 3 && isPointInPolygon(sp, cutPolys[ci])) return false;
                                        }
                                    }
                                }
                            }
                            return true;
                        };

                        const proposedParent = {
                            ...targetShape, points: live.points,
                            ...(live.controlPoints !== undefined ? { controlPoints: live.controlPoints } : {}),
                            ...(live.radius !== undefined ? { radius: live.radius } : {}),
                        };

                        // No initial-safe guard: if the proposed move is unsafe we always clamp.
                        // When the start is already unsafe the binary search yields bestT≈0
                        // (vertex can't move further in) yet still lets the user drag back OUT,
                        // because an outward move makes proposedParent safe and skips this block.
                        if (!isSafe(proposedParent)) {
                            let origHandlePos;
                            if (targetShape.type === "circle") {
                                origHandlePos = vi === 0
                                    ? { ...targetShape.points[0] }
                                    : { x: targetShape.points[0].x + (targetShape.radius || 0), y: targetShape.points[0].y };
                            } else if (isParentArcControlDrag) {
                                const cpIdx = -(vi + 1);
                                origHandlePos = { ...(targetShape.controlPoints?.[cpIdx] || targetShape.points[0]) };
                            } else if (targetShape.type === "rectangle" && targetShape.points.length >= 2) {
                                const [rvTL, rvBR] = targetShape.points;
                                const rvCorners = [rvTL, { x: rvBR.x, y: rvTL.y }, rvBR, { x: rvTL.x, y: rvBR.y }];
                                origHandlePos = { ...(rvCorners[vi] || rvCorners[0]) };
                            } else {
                                origHandlePos = { ...(targetShape.points[vi] || targetShape.points[0]) };
                            }

                            let lo = 0, hi = 1, bestT = 0;
                            for (let bIter = 0; bIter < 12; bIter++) {
                                const mid = (lo + hi) / 2;
                                const testPos = {
                                    x: origHandlePos.x + (clampedImgPos.x - origHandlePos.x) * mid,
                                    y: origHandlePos.y + (clampedImgPos.y - origHandlePos.y) * mid,
                                };
                                const { points: tp, controlPoints: tcp, radius: tr } = computeVertexUpdate(targetShape, testPos, null);
                                const testParent = {
                                    ...targetShape, points: tp,
                                    ...(tcp !== undefined ? { controlPoints: tcp } : {}),
                                    ...(tr !== undefined ? { radius: tr } : {}),
                                };
                                if (isSafe(testParent)) { bestT = mid; lo = mid; }
                                else hi = mid;
                            }

                            const bestPos = {
                                x: origHandlePos.x + (clampedImgPos.x - origHandlePos.x) * bestT,
                                y: origHandlePos.y + (clampedImgPos.y - origHandlePos.y) * bestT,
                            };
                            const { points: bp, controlPoints: bcp, radius: brd } = computeVertexUpdate(targetShape, bestPos, null);
                            live.points = bp;
                            if (bcp !== undefined) live.controlPoints = bcp;
                            if (brd !== undefined) live.radius = brd;
                        }
                    }
                }

                dragLiveRef.current = live;
            }

            dirtyRef.current = true;
            return;
        }

        if (isDraggingRef.current) {
            // ── FIX Issue 4: require minimum movement before flagging as a real drag.
            // Prevents Mac trackpad single-tap jitter from committing a position change.
            const dx = imgPos.x - dragStartImgRef.current.x;
            const dy = imgPos.y - dragStartImgRef.current.y;
            const MIN_DRAG_IMG = 3 / scaleRef.current;
            if ((dx * dx + dy * dy) > (MIN_DRAG_IMG * MIN_DRAG_IMG)) {
                dragMovedRef.current = true;
            }

            let newPoints = dragOrigPointsRef.current.map((pt) => ({ x: pt.x + dx, y: pt.y + dy }));
            let newCtrls = dragOrigCtrlsRef.current.map((cp) => ({ x: cp.x + dx, y: cp.y + dy }));

            const draggedShapeId = dragShapeIdRef.current;
            const draggedShape =
                currentShapesRef.current?.find((s) => s.id === draggedShapeId) ||
                visibleAiShapesRef.current?.find((s) => s.id === draggedShapeId);

            if (draggedShape?.isCutShape && draggedShape.cutParentAreaId) {
                let parentShape =
                    visibleAiShapesRef.current?.find((s) => s.id === draggedShape.cutParentAreaId) ||
                    currentShapesRef.current?.find((s) => s.id === draggedShape.cutParentAreaId) ||
                    visibleAiShapesRef.current?.find((s) => s.takeoffId === draggedShape.cutParentAreaId) ||
                    (draggedShape.cutParentTakeoffId && (
                        visibleAiShapesRef.current?.find((s) => s.takeoffId === draggedShape.cutParentTakeoffId) ||
                        currentShapesRef.current?.find((s) => s.takeoffId === draggedShape.cutParentTakeoffId)
                    )) || null;

                if (!parentShape && cutParentAreaRef.current?.id === draggedShape.cutParentAreaId) {
                    parentShape = cutParentAreaRef.current;
                }

                if (parentShape) {
                    const DRAG_TOL = 5.0;
                    if (draggedShape.type === "circle" && draggedShape.radius != null) {
                        const radius = draggedShape.radius;

                        const proposedCenter = newPoints[0];
                        if (!isCircleInsideArea(proposedCenter, radius, parentShape)) {
                            newPoints = [clampCircleToArea(
                                dragOrigPointsRef.current[0], proposedCenter, radius, parentShape
                            )];
                        }
                        // Incremental tracking: update the drag baseline to this frame's
                        // actual position so moving back from the boundary produces an
                        // immediate negative delta — no dead zone where the mouse has to
                        // travel back past the original drag-start point.
                        dragStartImgRef.current = { x: imgPos.x, y: imgPos.y };
                        dragOrigPointsRef.current = [{ ...newPoints[0] }];
                    } else {
                        const isArcWithCtrls = draggedShape.type === "arc" && newCtrls.length;

                        const allInsideCheck = (pts, ctrls) => {
                            for (const p of pts) {
                                if (getDistanceToArea(p, parentShape) > DRAG_TOL) return false;
                            }
                            if (isArcWithCtrls && ctrls.length) {
                                for (let ci = 0; ci < ctrls.length; ci++) {
                                    const a = pts[ci];
                                    const b = pts[(ci + 1) % pts.length];
                                    const cp = ctrls[ci];
                                    if (!a || !b || !cp) continue;
                                    for (let si = 1; si < 5; si++) {
                                        const t = si / 5;
                                        const sx = (1 - t) ** 2 * a.x + 2 * (1 - t) * t * cp.x + t ** 2 * b.x;
                                        const sy = (1 - t) ** 2 * a.y + 2 * (1 - t) * t * cp.y + t ** 2 * b.y;
                                        if (getDistanceToArea({ x: sx, y: sy }, parentShape) > DRAG_TOL) return false;
                                    }
                                }
                            }
                            return true;
                        };

                        if (!allInsideCheck(newPoints, newCtrls)) {
                            let tx = dx, ty = dy;
                            let resolved = false;

                            for (let iter = 0; iter < 16; iter++) {
                                let moved = false;
                                const currentPts = dragOrigPointsRef.current.map((pt) => ({ x: pt.x + tx, y: pt.y + ty }));
                                const currentCtrls = dragOrigCtrlsRef.current.map((cp) => ({ x: cp.x + tx, y: cp.y + ty }));

                                const ptsToCheck = [...currentPts];
                                if (isArcWithCtrls && currentCtrls.length) {
                                    for (let ci = 0; ci < currentCtrls.length; ci++) {
                                        const a = currentPts[ci];
                                        const b = currentPts[(ci + 1) % currentPts.length];
                                        const cp = currentCtrls[ci];
                                        if (a && b && cp) {
                                            for (let si = 1; si < 5; si++) {
                                                const t = si / 5;
                                                ptsToCheck.push({
                                                    x: (1 - t) ** 2 * a.x + 2 * (1 - t) * t * cp.x + t ** 2 * b.x,
                                                    y: (1 - t) ** 2 * a.y + 2 * (1 - t) * t * cp.y + t ** 2 * b.y,
                                                });
                                            }
                                        }
                                    }
                                }

                                for (const p of ptsToCheck) {
                                    const distToArea = getDistanceToArea(p, parentShape);
                                    if (distToArea > DRAG_TOL) {
                                        const closest = getClosestPointOnArea(p, parentShape);
                                        const cx = closest.x - p.x;
                                        const cy = closest.y - p.y;
                                        tx += cx;
                                        ty += cy;
                                        moved = true;
                                        break;
                                    }
                                }
                                if (!moved) {
                                    resolved = true;
                                    break;
                                }
                            }

                            if (!resolved) {
                                let lo = 0, hi = 1;
                                let bestTx = 0, bestTy = 0;
                                for (let iter = 0; iter < 10; iter++) {
                                    const mid = (lo + hi) / 2;
                                    const tPts = dragOrigPointsRef.current.map((pt) => ({ x: pt.x + tx * mid, y: pt.y + ty * mid }));
                                    const tCtrls = dragOrigCtrlsRef.current.map((cp) => ({ x: cp.x + tx * mid, y: cp.y + ty * mid }));
                                    if (allInsideCheck(tPts, tCtrls)) {
                                        lo = mid;
                                        bestTx = tx * mid;
                                        bestTy = ty * mid;
                                    } else {
                                        hi = mid;
                                    }
                                }
                                tx = bestTx;
                                ty = bestTy;
                            }

                            newPoints = dragOrigPointsRef.current.map((pt) => ({
                                x: pt.x + tx, y: pt.y + ty,
                            }));
                            newCtrls = dragOrigCtrlsRef.current.map((cp) => ({
                                x: cp.x + tx, y: cp.y + ty,
                            }));
                        }
                    }
                }

                dragLiveRef.current = {
                    id: dragShapeIdRef.current,
                    points: newPoints,
                    ...(newCtrls.length ? { controlPoints: newCtrls } : {}),
                };
                dragCutLiveRef.current = null;
            } else {
                dragLiveRef.current = {
                    id: dragShapeIdRef.current,
                    points: newPoints,
                    ...(newCtrls.length ? { controlPoints: newCtrls } : {}),
                };

                dragCutLiveRef.current = {
                    parentId: draggedShapeId,
                    parentTakeoffId: draggedShape?.takeoffId || null,
                    dx,
                    dy,
                };
            }

            dirtyRef.current = true;
            return;
        }

        if (toolRef.current === "select") {
            hoverFrameRef.current = !hoverFrameRef.current;
            if (hoverFrameRef.current) {
                const newHover = findShapeAt(imgPos);
                if (newHover !== hoveredShapeIdRef.current) {
                    hoveredShapeIdRef.current = newHover;
                    setHoveredShapeId(newHover);
                    dirtyRef.current = true;
                }

                const selId = selectedShapeIdRef.current;
                if (selId) {
                    const selShape = [...visibleAiShapesRef.current, ...currentShapesRef.current]
                        .find((s) => s.id === selId);
                    if (selShape) {
                        const vi = findVertexAt(imgPos, selShape);
                        if (vi !== null) {
                            if (hoveredHandleRef.current !== "vertex") {
                                hoveredHandleRef.current = "vertex";
                                setHoveredHandle("vertex");
                            }
                        } else {
                            const ei = findEdgeMidpointAt(imgPos, selShape);
                            const next = ei !== null ? "edge" : null;
                            if (hoveredHandleRef.current !== next) {
                                hoveredHandleRef.current = next;
                                setHoveredHandle(next);
                            }
                        }
                    } else {
                        if (hoveredHandleRef.current !== null) {
                            hoveredHandleRef.current = null;
                            setHoveredHandle(null);
                        }
                    }
                } else {
                    if (hoveredHandleRef.current !== null) {
                        hoveredHandleRef.current = null;
                        setHoveredHandle(null);
                    }
                }
            }
            return;
        }

        const skipMacHighZoomCutHover = isMacHighZoomCutDrawing(
            scaleRef.current,
            toolRef.current,
            activeObjectTypeRef.current,
            isDrawingRef.current || arcPointsRef.current.length > 0 || !!circleDraftRef.current
        );

        if (toolRef.current !== "pan" && !skipMacHighZoomCutHover) {
            hoverFrameRef.current = !hoverFrameRef.current;
            if (hoverFrameRef.current) {
                const cutActive = isCutSubType(activeObjectTypeRef.current);
                if (cutActive) {
                    const allCutShapes = [
                        ...(currentShapesRef.current?.filter((s) => s.isCutShape) || []),
                        ...(visibleAiShapesRef.current?.filter((s) => s.isCutShape) || []),
                    ];
                    let hoveredCutId = null;
                    for (const cs of allCutShapes) {
                        if (isPointInCutArcHit(imgPos, cs)) { hoveredCutId = cs.id; break; }
                    }
                    if (hoveredCutId !== hoveredShapeIdRef.current) {
                        hoveredShapeIdRef.current = hoveredCutId;
                        setHoveredShapeId(hoveredCutId);
                        dirtyRef.current = true;
                    }
                    const selCutId = selectedShapeIdRef.current;
                    if (selCutId) {
                        const selCutShape =
                            currentShapesRef.current?.find((s) => s.id === selCutId && s.isCutShape) ||
                            visibleAiShapesRef.current?.find((s) => s.id === selCutId && s.isCutShape);
                        if (selCutShape) {
                            const vi = findVertexAt(imgPos, selCutShape);
                            const next = vi !== null ? "vertex" : null;
                            if (hoveredHandleRef.current !== next) {
                                hoveredHandleRef.current = next;
                                setHoveredHandle(next);
                            }
                        } else {
                            if (hoveredHandleRef.current !== null) {
                                hoveredHandleRef.current = null;
                                setHoveredHandle(null);
                            }
                        }
                    } else {
                        if (hoveredHandleRef.current !== null) {
                            hoveredHandleRef.current = null;
                            setHoveredHandle(null);
                        }
                    }
                } else {
                    const isActiveDraft =
                        isDrawingRef.current ||
                        draftPointsRef.current.length > 0 ||
                        arcPointsRef.current.length > 0;
                    // Only allow hover (cursor change) for the last drawn shape, not existing detection objects.
                    // Suppress all hover and handle detection while actively placing new drawing points so
                    // the drawing cursor stays clean and no resize/move cursor bleeds through.
                    const drawingSelId = drawingModeSelectedIdRef.current;
                    const foundHover = (!isActiveDraft && drawingSelId) ? findShapeAt(imgPos) : null;
                    const newHover = (drawingSelId && foundHover === drawingSelId) ? foundHover : null;
                    if (newHover !== hoveredShapeIdRef.current) {
                        hoveredShapeIdRef.current = newHover;
                        setHoveredShapeId(newHover);
                        dirtyRef.current = true;
                    }

                    const drawSelShape = !isActiveDraft ? getDrawingSelectedShape() : null;
                    if (drawSelShape) {
                        const vi = findVertexAt(imgPos, drawSelShape);
                        if (vi !== null) {
                            if (hoveredHandleRef.current !== "vertex") {
                                hoveredHandleRef.current = "vertex";
                                setHoveredHandle("vertex");
                            }
                        } else {
                            const ei = findEdgeMidpointAt(imgPos, drawSelShape);
                            const next = ei !== null ? "edge" : null;
                            if (hoveredHandleRef.current !== next) {
                                hoveredHandleRef.current = next;
                                setHoveredHandle(next);
                            }
                        }
                    } else {
                        if (hoveredHandleRef.current !== null) {
                            hoveredHandleRef.current = null;
                            setHoveredHandle(null);
                        }
                    }
                }
            }
        }

        if (toolRef.current === "arc" && arcDraggingCpRef.current !== null) {
            const idx = arcDraggingCpRef.current;
            const ctrls = arcCtrlsRef.current;
            const arcPts = arcPointsRef.current;
            if (idx >= 0 && idx < ctrls.length) {
                let targetCp = { x: imgPos.x, y: imgPos.y };
                if (isCutSubType(activeObjectTypeRef.current) && cutParentAreaRef.current) {
                    const p0 = arcPts[idx];
                    const p1 = arcPts[idx + 1];
                    if (p0 && p1) {
                        targetCp = clampArcControlPointToArea(p0, targetCp, p1, cutParentAreaRef.current);
                    }
                }
                arcCtrlsRef.current = ctrls.map((cp, i) => i === idx ? targetCp : cp);
            }
            dirtyRef.current = true;
            return;
        }

        if (toolRef.current === "circle" && isDrawingRef.current) {
            if (circleDraftRef.current) {
                let circleEdgePos = { x: imgPos.x, y: imgPos.y };
                if (isCutSubType(activeObjectTypeRef.current) && cutParentAreaRef.current) {
                    circleEdgePos = clampCircleRadiusToArea(circleDraftRef.current.center, circleEdgePos, cutParentAreaRef.current);
                }
                circleDraftRef.current.edge = circleEdgePos;
            }
            dirtyRef.current = true;
        }

        dirtyRef.current = true;

        const activeTool = toolRef.current;
        const isActivelyDrawing =
            activeTool === "polygon" || activeTool === "arc" || activeTool === "circle" ||
            activeTool === "rectangle" || activeTool === "line" || activeTool === "measure" ||
            activeTool === "point";

        if (isActivelyDrawing) {
            mouseCanvasPosRef.current = { x, y };
            return;
        }

        if (movePosRafRef.current) cancelAnimationFrame(movePosRafRef.current);
        movePosRafRef.current = requestAnimationFrame(() => {
            movePosRafRef.current = null;
            setMouseCanvasPos({ x, y });
        });
    }, [getCanvasPos, canvasToImage, findShapeAt, findVertexAt, findEdgeMidpointAt,
        getDrawingSelectedShape, resolveParentArea, setCurrentShapes, setMouseCanvasPos,
        setHoveredShapeId, setAiDetectedShapes]);

    useEffect(() => {
        onPointerMoveRef.current = onPointerMove;
    }, [onPointerMove]);

    // ── Pointer: down ─────────────────────────────────────────────────────────
    const onPointerDown = useCallback((e) => {
        lastClientPosRef.current = { x: e.clientX, y: e.clientY };
        lastPointerEventRef.current = {
            clientX: e.clientX,
            clientY: e.clientY,
            pointerId: e.pointerId,
            target: e.target,
        };
        const { x, y } = getCanvasPos(e);
        let imgPos = canvasToImage(x, y);
        if (imgDimsRef.current && imgDimsRef.current.w) {
            imgPos = {
                x: Math.max(0, Math.min(imgDimsRef.current.w, imgPos.x)),
                y: Math.max(0, Math.min(imgDimsRef.current.h, imgPos.y)),
            };
        }
        mouseImgRef.current = imgPos;
        const currentTool = toolRef.current;

        if (currentTool === "pan" || e.button === 1) {
            e.preventDefault();
            isPanningRef.current = true;
            const s = stageRef.current;
            panStartRef.current = {
                scrollL: s?.scrollLeft || 0, scrollT: s?.scrollTop || 0,
                mouseX: e.clientX, mouseY: e.clientY,
            };
            try { e.target.setPointerCapture(e.pointerId); } catch (err) { void err; }
            return;
        }

        if (currentTool === "select") {
            const selId = selectedShapeIdRef.current;
            if (selId && annotationPermissionsRef.current?.edit !== false) {
                const selShape = allShapesRef.current.find((s) => s.id === selId);
                if (selShape) {
                    const vi = findVertexAt(imgPos, selShape);
                    if (vi !== null) {
                        vertexDragRef.current = {
                            shapeId: selId, vertexIndex: vi,
                            isAi: !selShape.isCutShape && visibleAiShapesRef.current.some((s) => s.id === selId),
                            isRect: selShape.type === "rectangle",
                        };
                        dragOrigCtrlsRef.current = selShape.controlPoints
                            ? selShape.controlPoints.map((cp) => ({ ...cp }))
                            : [];
                        vertexMovedRef.current = false;
                        try { e.target.setPointerCapture(e.pointerId); } catch (err) { void err; }
                        return;
                    }
                    const ei = findEdgeMidpointAt(imgPos, selShape);
                    if (ei !== null) {
                        const pts = selShape.points;
                        const newPt = { x: (pts[ei].x + pts[(ei + 1) % pts.length].x) / 2, y: (pts[ei].y + pts[(ei + 1) % pts.length].y) / 2 };
                        const newPts = [...pts.slice(0, ei + 1), newPt, ...pts.slice(ei + 1)];
                        const isAi = visibleAiShapesRef.current.some((s) => s.id === selId);
                        if (isAi) {
                            setAiDetectedShapes((prev) => prev.map((s) => s.id !== selId ? s : { ...s, points: newPts }));
                            // Eagerly update ref so the resize constraint sees the new vertex immediately
                            visibleAiShapesRef.current = visibleAiShapesRef.current.map((s) => s.id !== selId ? s : { ...s, points: newPts });
                        } else {
                            setCurrentShapes((p) => p.map((s) => s.id !== selId ? s : { ...s, points: newPts }));
                            // Eagerly update ref so the resize constraint sees the new vertex immediately
                            currentShapesRef.current = currentShapesRef.current.map((s) => s.id !== selId ? s : { ...s, points: newPts });
                        }
                        vertexDragRef.current = { shapeId: selId, vertexIndex: ei + 1, isAi, isRect: false };
                        vertexMovedRef.current = false;
                        dirtyRef.current = true;
                        return;
                    }
                }
            }

            if (annotationPermissionsRef.current?.edit !== false) {
                const allCutShapes = [
                    ...(currentShapesRef.current?.filter((s) => s.isCutShape) || []),
                    ...(visibleAiShapesRef.current?.filter((s) => s.isCutShape) || []),
                ];
                for (const cutShape of allCutShapes) {
                    const isAiCut = visibleAiShapesRef.current?.some((s) => s.id === cutShape.id) ?? false;
                    const vi = findVertexAt(imgPos, cutShape);
                    if (vi !== null) {
                        selectedShapeIdRef.current = cutShape.id;
                        setSelectedShapeId(cutShape.id);
                        if (setSelectedShapeIds) setSelectedShapeIds(new Set([cutShape.id]));
                        vertexDragRef.current = {
                            shapeId: cutShape.id, vertexIndex: vi, isAi: isAiCut, isRect: false,
                        };
                        dragOrigCtrlsRef.current = cutShape.controlPoints
                            ? cutShape.controlPoints.map((cp) => ({ ...cp }))
                            : [];
                        vertexMovedRef.current = false;
                        try { e.target.setPointerCapture(e.pointerId); } catch (err) { void err; }
                        dirtyRef.current = true;
                        return;
                    }
                    if (isPointInCutArcHit(imgPos, cutShape)) {
                        selectedShapeIdRef.current = cutShape.id;
                        setSelectedShapeId(cutShape.id);
                        if (setSelectedShapeIds) setSelectedShapeIds(new Set([cutShape.id]));
                        if (!cutParentAreaRef.current || cutParentAreaRef.current.id !== cutShape.cutParentAreaId) {
                            const allVisible = [...(visibleAiShapesRef.current || []), ...(currentShapesRef.current || [])];
                            cutParentAreaRef.current = allVisible.find(
                                (s) => s.id === cutShape.cutParentAreaId ||
                                    s.takeoffId === cutShape.cutParentAreaId ||
                                    (cutShape.cutParentTakeoffId && s.takeoffId === cutShape.cutParentTakeoffId)
                            ) || null;
                        }
                        isDraggingRef.current = true;
                        dragMovedRef.current = false;
                        dragIsAiRef.current = isAiCut;
                        dragShapeIdRef.current = cutShape.id;
                        dragStartImgRef.current = { ...imgPos };
                        dragOrigPointsRef.current = cutShape.points.map((p) => ({ ...p }));
                        dragOrigCtrlsRef.current = cutShape.controlPoints
                            ? cutShape.controlPoints.map((cp) => ({ ...cp }))
                            : [];
                        try { e.target.setPointerCapture(e.pointerId); } catch (err) { void err; }
                        dirtyRef.current = true;
                        setSelectedTakeoffId(null);
                        return;
                    }
                }
            }

            const hitId = findShapeAt(imgPos);
            setSelectedShapeId(hitId);
            if (setSelectedShapeIds) setSelectedShapeIds(hitId ? new Set([hitId]) : new Set());
            dirtyRef.current = true;
            if (hitId) {
                try { e.target.setPointerCapture(e.pointerId); } catch (err) { void err; }
                const shape = allShapesRef.current.find((s) => s.id === hitId);
                if (annotationPermissionsRef.current?.edit !== false) {
                    isDraggingRef.current = true;
                    dragMovedRef.current = false;
                    dragIsAiRef.current = visibleAiShapesRef.current.some((s) => s.id === hitId);
                    dragShapeIdRef.current = hitId;
                    dragStartImgRef.current = { ...imgPos };
                    dragOrigPointsRef.current = shape ? shape.points.map((p) => ({ ...p })) : [];
                    dragOrigCtrlsRef.current = (shape?.controlPoints)
                        ? shape.controlPoints.map((cp) => ({ ...cp }))
                        : [];
                }
                const takeoffId = shape?.takeoffId || shape?.id;
                const pageNum = shape?.pageNumber ?? null;
                const foundGroup = takeoffId && takeoffData
                    ? findGroupForTakeoffId(takeoffId, takeoffData, pageNum)
                    : null;
                if (foundGroup) {
                    const canonicalId = (() => {
                        if (!takeoffData) return takeoffId;
                        for (const key of Object.keys(takeoffData)) {
                            const raw = takeoffData[key];
                            const items = Array.isArray(raw) ? raw : (raw?.items ?? []);
                            const match = items.find((i) => {
                                const pageOk = pageNum == null || i.page_number == null ||
                                    Number(i.page_number) === Number(pageNum);
                                if (!pageOk) return false;
                                return i.id === takeoffId ||
                                    (Array.isArray(i.object_keys) && i.object_keys.includes(takeoffId));
                            });
                            if (match) return match.id;
                        }
                        return takeoffId;
                    })();
                    const scopedTakeoffId = pageNum != null ? `${canonicalId}_p${pageNum}` : canonicalId;
                    setSelectedTakeoffId(scopedTakeoffId || null);
                    setSidebarCollapsed(false);
                    setExpandedGroups((prev) => new Set([...prev, foundGroup]));
                } else {
                    setSelectedTakeoffId(null);
                }
            } else {
                setSelectedTakeoffId(null);
                deleteBtnPosRef.current = null;
                setDeleteBtnPos(null);
            }
            return;
        }

        const isCutToolNow = isCutSubType(activeObjectTypeRef.current);
        const drawSelShape = getDrawingSelectedShape();

        if (isCutToolNow && annotationPermissionsRef.current?.edit !== false) {
            const allCutShapes = [
                ...(currentShapesRef.current?.filter((s) => s.isCutShape) || []),
                ...(visibleAiShapesRef.current?.filter((s) => s.isCutShape) || []),
            ];
            for (const cutShape of allCutShapes) {
                const isAiCut = visibleAiShapesRef.current?.some((s) => s.id === cutShape.id) ?? false;
                const vi = findVertexAt(imgPos, cutShape);
                if (vi !== null) {
                    if (selectedShapeIdRef.current !== cutShape.id) {
                        selectedShapeIdRef.current = cutShape.id;
                        setSelectedShapeId(cutShape.id);
                        if (setSelectedShapeIds) setSelectedShapeIds(new Set([cutShape.id]));
                    }
                    vertexDragRef.current = {
                        shapeId: cutShape.id, vertexIndex: vi, isAi: isAiCut, isRect: false,
                    };
                    dragOrigCtrlsRef.current = cutShape.controlPoints
                        ? cutShape.controlPoints.map((cp) => ({ ...cp }))
                        : [];
                    vertexMovedRef.current = false;
                    try { e.target.setPointerCapture(e.pointerId); } catch (err) { void err; }
                    dirtyRef.current = true;
                    return;
                }
                if (isPointInCutArcHit(imgPos, cutShape)) {
                    if (!cutParentAreaRef.current || cutParentAreaRef.current.id !== cutShape.cutParentAreaId) {
                        const allVisible = [...(visibleAiShapesRef.current || []), ...(currentShapesRef.current || [])];
                        cutParentAreaRef.current = allVisible.find(
                            (s) => s.id === cutShape.cutParentAreaId ||
                                s.takeoffId === cutShape.cutParentAreaId ||
                                (cutShape.cutParentTakeoffId && s.takeoffId === cutShape.cutParentTakeoffId)
                        ) || null;
                    }
                    if (annotationPermissionsRef.current?.edit !== false) {
                        selectedShapeIdRef.current = cutShape.id;
                        setSelectedShapeId(cutShape.id);
                        if (setSelectedShapeIds) setSelectedShapeIds(new Set([cutShape.id]));
                        isDraggingRef.current = true;
                        dragMovedRef.current = false;
                        dragIsAiRef.current = isAiCut;
                        dragShapeIdRef.current = cutShape.id;
                        dragStartImgRef.current = { ...imgPos };
                        dragOrigPointsRef.current = cutShape.points.map((p) => ({ ...p }));
                        dragOrigCtrlsRef.current = cutShape.controlPoints
                            ? cutShape.controlPoints.map((cp) => ({ ...cp }))
                            : [];
                        try { e.target.setPointerCapture(e.pointerId); } catch (err) { void err; }
                        dirtyRef.current = true;
                        return;
                    }
                }
            }
        }

        if (drawSelShape) {
            // Vertex drag works even when cursor is outside the polygon boundary (near a vertex handle).
            // Guard against firing during active drafting so new polygon/arc points still place normally.
            const isNowActivePlacing =
                (currentTool === "polygon" && draftPointsRef.current.length > 0) ||
                (currentTool === "arc" && arcPointsRef.current.length > 0);
            if (!isNowActivePlacing) {
                const vi = findVertexAt(imgPos, drawSelShape);
                if (vi !== null) {
                    vertexDragRef.current = {
                        shapeId: drawSelShape.id,
                        vertexIndex: vi,
                        isAi: visibleAiShapesRef.current.some((s) => s.id === drawSelShape.id),
                        isRect: drawSelShape.type === "rectangle",
                    };
                    dragOrigCtrlsRef.current = drawSelShape.controlPoints
                        ? drawSelShape.controlPoints.map((cp) => ({ ...cp }))
                        : [];
                    vertexMovedRef.current = false;
                    try { e.target.setPointerCapture(e.pointerId); } catch (err) { void err; }
                    dirtyRef.current = true;
                    return;
                }
                // Edge-midpoint split still requires cursor to be on the shape body
                if (hoveredShapeIdRef.current === drawSelShape.id) {
                    const ei = findEdgeMidpointAt(imgPos, drawSelShape);
                    if (ei !== null) {
                        const pts = drawSelShape.points;
                        const newPt = {
                            x: (pts[ei].x + pts[(ei + 1) % pts.length].x) / 2,
                            y: (pts[ei].y + pts[(ei + 1) % pts.length].y) / 2,
                        };
                        const newPts = [...pts.slice(0, ei + 1), newPt, ...pts.slice(ei + 1)];
                        const isAi = visibleAiShapesRef.current.some((s) => s.id === drawSelShape.id);
                        if (isAi) {
                            setAiDetectedShapes((prev) => prev.map((s) => s.id !== drawSelShape.id ? s : { ...s, points: newPts }));
                        } else {
                            setCurrentShapes((p) => p.map((s) => s.id !== drawSelShape.id ? s : { ...s, points: newPts }));
                            currentShapesRef.current = (currentShapesRef.current || []).map((s) =>
                                s.id !== drawSelShape.id ? s : { ...s, points: newPts }
                            );
                        }
                        vertexDragRef.current = { shapeId: drawSelShape.id, vertexIndex: ei + 1, isAi, isRect: false };
                        vertexMovedRef.current = false;
                        dirtyRef.current = true;
                        try { e.target.setPointerCapture(e.pointerId); } catch (err) { void err; }
                        return;
                    }
                }
            }
        }

        const isActivelyPlacingPoints =
            (currentTool === "polygon" && draftPointsRef.current.length > 0) ||
            (currentTool === "arc" && arcPointsRef.current.length > 0);

        const isCutToolActive = isCutSubType(activeObjectTypeRef.current);

        const drawingSelIdForDrag = drawingModeSelectedIdRef.current;
        if (hoveredShapeIdRef.current && !isActivelyPlacingPoints && !isCutToolActive &&
            drawingSelIdForDrag && hoveredShapeIdRef.current === drawingSelIdForDrag) {
            const hitId = hoveredShapeIdRef.current;
            const hitShape =
                currentShapesRef.current?.find((s) => s.id === hitId) ||
                visibleAiShapesRef.current?.find((s) => s.id === hitId) ||
                allShapesRef.current?.find((s) => s.id === hitId);

            try { e.target.setPointerCapture(e.pointerId); } catch (err) { void err; }
            isDraggingRef.current = true;
            dragMovedRef.current = false;
            dragIsAiRef.current = visibleAiShapesRef.current.some((s) => s.id === hitId);
            dragShapeIdRef.current = hitId;
            dragStartImgRef.current = { ...imgPos };
            dragOrigPointsRef.current = hitShape ? hitShape.points.map((p) => ({ ...p })) : [];
            dragOrigCtrlsRef.current = (hitShape?.controlPoints)
                ? hitShape.controlPoints.map((cp) => ({ ...cp }))
                : [];
            drawingModeSelectedIdRef.current = hitId;
            setDrawingModeSelectedId(hitId);
            selectedShapeIdRef.current = hitId;
            setSelectedShapeId(hitId);
            if (setSelectedShapeIds) setSelectedShapeIds(new Set([hitId]));
            dirtyRef.current = true;
            requestAnimationFrame(() => requestAnimationFrame(() => scheduleDeleteBtnUpdate()));
            return;
        }

        if (currentTool === "point") {
            const pointShapeId = Date.now().toString();
            const pointShape = { id: pointShapeId, type: "point", points: [{ ...imgPos }], color: TOOL_COLORS.point };
            setCurrentShapes((p) => [...p, pointShape]);
            dirtyRef.current = true;
            selectNewShape(pointShapeId, pointShape);
            return;
        }

        const activeObjType = activeObjectTypeRef.current;
        const detCol = detectionColorRef.current;

        if (isCutSubType(activeObjType) && currentTool !== "circle") {
            const allVisible = [
                ...(visibleAiShapesRef.current || []),
                ...(currentShapesRef.current || []),
            ];
            // const areaCandidates = allVisible.filter(
            //     (s) => (s.type === "polygon" || s.type === "area" || s.type === "arc" ||
            //         s.type === "circle" || s.type === "rectangle") &&
            //         !s.isCutShape &&
            //         s.areaType !== "symbol" && !s.symbolType
            // );

            const areaCandidates = allVisible.filter(
                (s) =>
                    !s.isCutShape &&
                    s.areaType !== "symbol" && !s.symbolType &&
                    s.areaType !== "wall" && s.areaType !== "pipeline" &&
                    s.type !== "line" && s.type !== "point" && s.type !== "measure" &&
                    (s.type === "polygon" || s.type === "area" || s.type === "arc" ||
                        s.type === "circle" || s.type === "rectangle")
            );
            const isAlreadyDrawing =
                (currentTool === "polygon" && draftPointsRef.current.length > 0) ||
                (currentTool === "arc" && arcPointsRef.current.length > 0);

            if (!isAlreadyDrawing) {
                const containingAreas = areaCandidates.filter((s) => isPointInArea(imgPos, s));
                const parentArea = containingAreas.length > 0
                    ? containingAreas.reduce((best, s) => {
                        const area = (shape) => {
                            if (shape.type === "circle" && shape.radius != null)
                                return Math.PI * shape.radius * shape.radius;
                            const xs = shape.points.map((p) => p.x);
                            const ys = shape.points.map((p) => p.y);
                            return (Math.max(...xs) - Math.min(...xs)) * (Math.max(...ys) - Math.min(...ys));
                        };
                        return area(s) < area(best) ? s : best;
                    })
                    : null;
                if (!parentArea) {
                    dirtyRef.current = true;
                    return;
                }
                cutParentAreaRef.current = parentArea;
                // } else {
                //     // ── FIX Issue 2: mid-stroke validation with takeoffId fallback ──
                //     const storedParent = cutParentAreaRef.current;
                //     const storedParentStillValid =
                //         storedParent &&
                //         areaCandidates.some(
                //             (s) => s.id === storedParent.id ||
                //                    (s.takeoffId && storedParent.takeoffId &&
                //                     s.takeoffId === storedParent.takeoffId)
                //         ) &&
                //         isPointInArea(imgPos, storedParent);

                //     if (!storedParentStillValid) {
                //         const containing = areaCandidates.filter((s) => isPointInArea(imgPos, s));
                //         const recovered = containing.length > 0
                //             ? containing.reduce((best, s) => {
                //                 const area = (shape) => {
                //                     if (shape.type === "circle" && shape.radius != null)
                //                         return Math.PI * shape.radius * shape.radius;
                //                     const xs = shape.points.map((p) => p.x);
                //                     const ys = shape.points.map((p) => p.y);
                //                     return (Math.max(...xs) - Math.min(...xs)) * (Math.max(...ys) - Math.min(...ys));
                //                 };
                //                 return area(s) < area(best) ? s : best;
                //             })
                //             : null;
                //         if (recovered) {
                //             cutParentAreaRef.current = recovered;
                //         } else {
                //             dirtyRef.current = true;
                //             return;
                //         }
                //     }
                // }


            } else {
                // ── FIX: Mid-stroke — keep the stored parent locked in.
                // Only verify the shape still exists in the canvas; do NOT check
                // isPointInArea because the click may land outside the boundary
                // (that's fine — clampPointToArea already clamped it in onPointerMove).
                const storedParent = cutParentAreaRef.current;
                const storedParentExists = storedParent && areaCandidates.some(
                    (s) => s.id === storedParent.id ||
                        (s.takeoffId && storedParent.takeoffId &&
                            s.takeoffId === storedParent.takeoffId)
                );
                if (!storedParentExists) {
                    // Parent shape was deleted — try to recover
                    const containing = areaCandidates.filter((s) => isPointInArea(imgPos, s));
                    const recovered = containing.length > 0
                        ? containing.reduce((best, s) => {
                            const area = (shape) => {
                                if (shape.type === "circle" && shape.radius != null)
                                    return Math.PI * shape.radius * shape.radius;
                                const xs = shape.points.map((p) => p.x);
                                const ys = shape.points.map((p) => p.y);
                                return (Math.max(...xs) - Math.min(...xs)) * (Math.max(...ys) - Math.min(...ys));
                            };
                            return area(s) < area(best) ? s : best;
                        })
                        : null;
                    if (recovered) {
                        cutParentAreaRef.current = recovered;
                    } else {
                        dirtyRef.current = true;
                        return;
                    }
                }
                // Re-point to the live shape object (handles id change after AI reload)
                const liveParent = areaCandidates.find(
                    (s) => s.id === cutParentAreaRef.current?.id ||
                        (s.takeoffId && cutParentAreaRef.current?.takeoffId &&
                            s.takeoffId === cutParentAreaRef.current.takeoffId)
                );
                if (liveParent) cutParentAreaRef.current = liveParent;
            }
        }

        if (currentTool === "polygon") {
            const isOpenLine = activeObjType === "wall" || activeObjType === "pipeline";
            const dPts = draftPointsRef.current;
            if (!isOpenLine && dPts.length >= 3 && dist(imgPos, dPts[0]) < Math.min(14 / scaleRef.current, 40)) {
                snapClosedRef.current = true;
                const snapShapeId = Date.now().toString();
                const isCut = isCutSubType(activeObjType);
                // const completedPoints = [...dPts];
                const completedPoints = (isCut && cutParentAreaRef.current)
                    ? dPts.map((p) => clampPointToArea(p, cutParentAreaRef.current))
                    : [...dPts];

                const cutColor = { stroke: "#ef4444", fill: "rgba(239,68,68,0.12)" };
                const snapShape = {
                    id: snapShapeId, type: "polygon", points: completedPoints,
                    color: isCut ? cutColor : (detCol || TOOL_COLORS.polygon),
                    isCutShape: isCut || undefined,
                    cutParentAreaId: isCut ? cutParentAreaRef.current?.id : undefined,
                    cutParentTakeoffId: isCut ? (cutParentAreaRef.current?.takeoffId || null) : undefined,
                    ...(isCut ? {} : { __pending: true }),
                };
                setCurrentShapes((p) => [...p, snapShape]);
                setDraftPoints([]);
                if (activeObjType && onShapeComplete) onShapeComplete(completedPoints, snapShape);
                selectNewShape(snapShapeId, snapShape);
                if (isCut) cutParentAreaRef.current = null;
            } else {
                // setDraftPoints((p) => [...p, { ...imgPos }]);
                if (isCutSubType(activeObjType) && cutParentAreaRef.current) {
                    imgPos = clampPointToArea(imgPos, cutParentAreaRef.current);
                }
                setDraftPoints((p) => [...p, { ...imgPos }]);
            }
            dirtyRef.current = true;
            return;
        }

        if (currentTool === "arc") {
            const arcPts = arcPointsRef.current;
            const arcCtrls = arcCtrlsRef.current;

            if (arcPts.length === 0) {
                arcPointsRef.current = [{ ...imgPos }];
                arcCtrlsRef.current = [];
                setDraftPoints([{ ...imgPos }]);
            } else {
                const cpIdx = arcCtrls.findIndex((cp) => dist(imgPos, cp) < 10 / scaleRef.current);
                if (cpIdx >= 0) {
                    arcDraggingCpRef.current = cpIdx;
                    try { e.target.setPointerCapture(e.pointerId); } catch (err) { void err; }
                    dirtyRef.current = true;
                    return;
                }

                if (arcPts.length >= 3 && dist(imgPos, arcPts[0]) < 14 / scaleRef.current) {
                    arcSnapRef.current = true;
                    const lastPt = arcPts[arcPts.length - 1];
                    const firstPt = arcPts[0];
                    const closingCp = { x: (lastPt.x + firstPt.x) / 2, y: (lastPt.y + firstPt.y) / 2 };
                    const allCps = [...arcCtrls, closingCp];
                    // const isCutArc = isCutSubType(activeObjectTypeRef.current);
                    
                    // const cutColor = { stroke: "#ef4444", fill: "rgba(239,68,68,0.12)" };
                    // const completedArcShape = {
                    //     id: Date.now().toString(), type: "arc", points: [...arcPts],
                    //     controlPoints: allCps,
                    //     color: isCutArc ? cutColor : TOOL_COLORS.arc,
                    //     isCutShape: isCutArc || undefined,
                    //     cutParentAreaId: isCutArc ? cutParentAreaRef.current?.id : undefined,
                    //     ...(isCutArc ? {} : { __pending: true }),
                    // };
                    // setCurrentShapes((p) => [...p, completedArcShape]);
                    // arcPointsRef.current = [];
                    // arcCtrlsRef.current = [];
                    // arcDraggingCpRef.current = null;
                    // setDraftPoints([]);
                    // if (onShapeComplete) onShapeComplete([...arcPts], completedArcShape);
                    // selectNewShape(completedArcShape.id, completedArcShape);
                    const isCutArc = isCutSubType(activeObjectTypeRef.current);
// ── FIX: clamp all arc points to parent boundary on completion ──
const finalArcPts = (isCutArc && cutParentAreaRef.current)
    ? arcPts.map((p) => clampPointToArea(p, cutParentAreaRef.current))
    : [...arcPts];
const cutColor = { stroke: "#ef4444", fill: "rgba(239,68,68,0.12)" };
const completedArcShape = {
    id: Date.now().toString(), type: "arc", points: finalArcPts,
    controlPoints: allCps,
    color: isCutArc ? cutColor : TOOL_COLORS.arc,
    isCutShape: isCutArc || undefined,
    cutParentAreaId: isCutArc ? cutParentAreaRef.current?.id : undefined,
    cutParentTakeoffId: isCutArc ? (cutParentAreaRef.current?.takeoffId || null) : undefined,
    ...(isCutArc ? {} : { __pending: true }),
};
setCurrentShapes((p) => [...p, completedArcShape]);
arcPointsRef.current = [];
arcCtrlsRef.current = [];
arcDraggingCpRef.current = null;
setDraftPoints([]);
if (onShapeComplete) onShapeComplete(finalArcPts, completedArcShape);
                    if (isCutArc) cutParentAreaRef.current = null;
                } else {
                    // const lastPt = arcPts[arcPts.length - 1];
                    // const newCp = { x: (lastPt.x + imgPos.x) / 2, y: (lastPt.y + imgPos.y) / 2 };
                    // arcPointsRef.current = [...arcPts, { ...imgPos }];
                    // arcCtrlsRef.current = [...arcCtrls, newCp];
                    // setDraftPoints((p) => [...p, { ...imgPos }]);
                        // ── FIX: clamp arc points to parent boundary mid-stroke ──
    const clampedArcPt = (isCutSubType(activeObjectTypeRef.current) && cutParentAreaRef.current)
        ? clampPointToArea(imgPos, cutParentAreaRef.current)
        : { ...imgPos };
    const lastPt = arcPts[arcPts.length - 1];
    const newCp = { x: (lastPt.x + clampedArcPt.x) / 2, y: (lastPt.y + clampedArcPt.y) / 2 };
    arcPointsRef.current = [...arcPts, clampedArcPt];
    arcCtrlsRef.current = [...arcCtrls, newCp];
    setDraftPoints((p) => [...p, clampedArcPt]);
                }
            }
            dirtyRef.current = true;
            return;
        }

        if (currentTool === "circle") {
            const isCutC = isCutSubType(activeObjectTypeRef.current);
            if (isCutC) {
                const allVisible = [
                    ...(visibleAiShapesRef.current || []),
                    ...(currentShapesRef.current || []),
                ];
                // const areaCandidates = allVisible.filter(
                //     (s) => (s.type === "polygon" || s.type === "area" || s.type === "arc" ||
                //         s.type === "circle" || s.type === "rectangle") &&
                //         !s.isCutShape &&
                //         s.areaType !== "symbol" && !s.symbolType
                // );

                const areaCandidates = allVisible.filter(
                    (s) =>
                        !s.isCutShape &&
                        s.areaType !== "symbol" && !s.symbolType &&
                        s.areaType !== "wall" && s.areaType !== "pipeline" &&
                        s.type !== "line" && s.type !== "point" && s.type !== "measure" &&
                        (s.type === "polygon" || s.type === "area" || s.type === "arc" ||
                            s.type === "circle" || s.type === "rectangle")
                );
                const containingAreas = areaCandidates.filter((s) => isPointInArea(imgPos, s));
                const parentArea = containingAreas.length > 0
                    ? containingAreas.reduce((best, s) => {
                        const area = (shape) => {
                            if (shape.type === "circle" && shape.radius != null)
                                return Math.PI * shape.radius * shape.radius;
                            const xs = shape.points.map((p) => p.x);
                            const ys = shape.points.map((p) => p.y);
                            return (Math.max(...xs) - Math.min(...xs)) * (Math.max(...ys) - Math.min(...ys));
                        };
                        return area(s) < area(best) ? s : best;
                    })
                    : null;
                if (!parentArea) {
                    dirtyRef.current = true;
                    return;
                }
                cutParentAreaRef.current = parentArea;
            }
            isDrawingRef.current = true;
            circleDraftRef.current = { center: { ...imgPos }, edge: { ...imgPos } };
            setDraftPoints([{ ...imgPos }]);
            try { e.target.setPointerCapture(e.pointerId); } catch (err) { void err; }
            dirtyRef.current = true;
            return;
        }

        const activeObjTypeNow = activeObjectTypeRef.current;
        if (currentTool === "rectangle" && activeObjTypeNow === "symbol") {
            if (twoPointFirstClickRef.current === null) {
                twoPointFirstClickRef.current = { ...imgPos };
                isDrawingRef.current = true;
                setDraftPoints([{ ...imgPos }]);
                try { e.target.setPointerCapture(e.pointerId); } catch (err) { void err; }
                dirtyRef.current = true;
                return;
            } else {
                const start = twoPointFirstClickRef.current;
                const end = { ...imgPos };
                twoPointFirstClickRef.current = null;
                isDrawingRef.current = false;
                const detColNow = detectionColorRef.current;
                const rectPoints = [start, { x: end.x, y: start.y }, end, { x: start.x, y: end.y }];
                const symRectId = Date.now().toString();
                const symShape = { id: symRectId, type: "rectangle", points: [start, end], color: detColNow || TOOL_COLORS.rectangle, __pending: true };
                setCurrentShapes((p) => [...p, symShape]);
                setDraftPoints([]);
                dirtyRef.current = true;
                if (onShapeComplete) onShapeComplete(rectPoints);
                selectNewShape(symRectId, symShape);
                return;
            }
        }

        isDrawingRef.current = true;
        setDraftPoints([{ ...imgPos }]);
        try { e.target.setPointerCapture(e.pointerId); } catch (err) { void err; }
        dirtyRef.current = true;
    }, [
        getCanvasPos, canvasToImage, findShapeAt, findVertexAt, findEdgeMidpointAt,
        getDrawingSelectedShape, resolveParentArea, takeoffData, setCurrentShapes,
        setSelectedShapeId, setSelectedTakeoffId, setSidebarCollapsed, setExpandedGroups,
        findGroupForTakeoffId, setDraftPoints, onShapeComplete, onToolChange,
        onObjectTypeChange, setAiDetectedShapes, selectNewShape,
    ]);

    // ── Pointer: up ───────────────────────────────────────────────────────────
    const onPointerUp = useCallback(() => {
        lastClientPosRef.current = null;
        lastPointerEventRef.current = null;
        if (isPanningRef.current) {
            isPanningRef.current = false;
            scheduleDeleteBtnUpdate();
            return;
        }

        if (arcDraggingCpRef.current !== null) {
            arcDraggingCpRef.current = null;
            dirtyRef.current = true;
            return;
        }

        if (vertexDragRef.current) {
            const { shapeId } = vertexDragRef.current;
            vertexDragRef.current = null;

            if (vertexMovedRef.current) {
                const finalLive = dragLiveRef.current;
                dragLiveRef.current = null;

                const commitFn = (shapes) => shapes.map((s) => {
                    if (s.id !== shapeId) return s;
                    if (!finalLive) return s;
                    const updated = { ...s, points: finalLive.points };
                    if (finalLive.controlPoints !== undefined) updated.controlPoints = finalLive.controlPoints;
                    if (finalLive.radius !== undefined) updated.radius = finalLive.radius;
                    return updated;
                });

                const vertexTargetShape =
                    currentShapesRef.current?.find((s) => s.id === shapeId) ||
                    visibleAiShapesRef.current?.find((s) => s.id === shapeId);

                const isVertexCutShape = vertexTargetShape?.isCutShape;
                const liveIsAi = visibleAiShapesRef.current?.some((s) => s.id === shapeId) ?? false;
                const isAiCutShape = liveIsAi && isVertexCutShape;

                if (liveIsAi && !isVertexCutShape) {
                    setAiDetectedShapes((prev) => {
                        const next = commitFn(prev);
                        const movedShape = next.find((s) => s.id === shapeId);
                        if (movedShape && onShapeDragEnd) onShapeDragEnd(movedShape, movedShape.points);
                        // Cut children keep their existing positions — the live constraint
                        // (isSafe binary search) already prevented the parent from shrinking
                        // past any cut child, so no clamping is needed here.
                        return next;
                    });
                } else if (isAiCutShape) {
                    setAiDetectedShapes((prev) => {
                        const next = commitFn(prev);
                        const movedShape = next.find((s) => s.id === shapeId);
                        if (movedShape && onShapeDragEnd) onShapeDragEnd(movedShape, movedShape.points);
                        return next;
                    });
                } else {
                    setCurrentShapes((p) => {
                        const next = commitFn(p);
                        // Cut children keep their positions — the live constraint prevents
                        // the parent from shrinking past any cut child.
                        currentShapesRef.current = next;
                        return next;
                    });
                }
            } else {
                dragLiveRef.current = null;
            }

            vertexMovedRef.current = false;
            scheduleDeleteBtnUpdate();
            return;
        }

        if (isDraggingRef.current) {
            isDraggingRef.current = false;
            const movedId = dragShapeIdRef.current;
            const wasAi = dragIsAiRef.current;
            const didMove = dragMovedRef.current;
            dragShapeIdRef.current = null;
            dragMovedRef.current = false;
            dragIsAiRef.current = false;

            if (didMove) {
                const finalLive = dragLiveRef.current;
                dragLiveRef.current = null;
                const finalCutDrag = dragCutLiveRef.current;
                dragCutLiveRef.current = null;

                const commitFn = (shapes) => shapes.map((s) => {
                    if (s.id !== movedId || !finalLive) return s;
                    const updated = { ...s, points: finalLive.points };
                    if (finalLive.controlPoints !== undefined) updated.controlPoints = finalLive.controlPoints;
                    return updated;
                });

                const draggedCutShape =
                    currentShapesRef.current?.find((s) => s.id === movedId)?.isCutShape;

                const applyCutChildOffset = (shapes, parentId, parentTakeoffId, dx, dy) =>
                    shapes.map((s) => {
                        if (!s.isCutShape) return s;
                        const matches = s.cutParentAreaId === parentId ||
                            (parentTakeoffId && s.cutParentTakeoffId && s.cutParentTakeoffId === parentTakeoffId);
                        if (!matches) return s;
                        return {
                            ...s,
                            points: s.points.map((pt) => ({ x: pt.x + dx, y: pt.y + dy })),
                            ...(s.controlPoints ? {
                                controlPoints: s.controlPoints.map((cp) => ({ x: cp.x + dx, y: cp.y + dy }))
                            } : {}),
                        };
                    });

                if (wasAi && movedId && !draggedCutShape) {
                    setAiDetectedShapes((prev) => {
                        let next = commitFn(prev);
                        const movedShape = next.find((s) => s.id === movedId);
                        if (movedShape && onShapeDragEnd) onShapeDragEnd(movedShape, movedShape.points);
                        if (finalCutDrag && finalCutDrag.parentId === movedId) {
                            const { dx, dy } = finalCutDrag;
                            next = applyCutChildOffset(next, movedId, finalCutDrag.parentTakeoffId, dx, dy);
                        }
                        return next;
                    });
                    if (finalCutDrag && finalCutDrag.parentId === movedId) {
                        const { dx, dy } = finalCutDrag;
                        setCurrentShapes((p) => {
                            const next = applyCutChildOffset(p, movedId, finalCutDrag.parentTakeoffId, dx, dy);
                            currentShapesRef.current = next;
                            return next;
                        });
                    }
                } else if (movedId) {
                    setCurrentShapes((p) => {
                        let next = commitFn(p);
                        if (finalCutDrag && finalCutDrag.parentId === movedId) {
                            const { dx, dy } = finalCutDrag;
                            next = applyCutChildOffset(next, movedId, finalCutDrag.parentTakeoffId, dx, dy);
                        }
                        currentShapesRef.current = next;
                        return next;
                    });
                    if (finalCutDrag && finalCutDrag.parentId === movedId) {
                        const { dx, dy } = finalCutDrag;
                        setAiDetectedShapes((prev) => {
                            const hasCutChildren = prev.some(
                                (s) => s.isCutShape && (
                                    s.cutParentAreaId === movedId ||
                                    (finalCutDrag.parentTakeoffId && s.cutParentTakeoffId === finalCutDrag.parentTakeoffId)
                                )
                            );
                            if (!hasCutChildren) return prev;
                            return applyCutChildOffset(prev, movedId, finalCutDrag.parentTakeoffId, dx, dy);
                        });
                    }
                }
            } else {
                dragLiveRef.current = null;
                dragCutLiveRef.current = null;
            }

            if (movedId && !drawingModeSelectedIdRef.current) {
                drawingModeSelectedIdRef.current = movedId;
            }
            scheduleDeleteBtnUpdate();
            return;
        }

        if (!isDrawingRef.current) return;
        isDrawingRef.current = false;

        const activeObjType = activeObjectTypeRef.current;
        const isOpenLine = activeObjType === "wall" || activeObjType === "pipeline";
        if (isOpenLine) return;

        const currentTool = toolRef.current;
        if (currentTool === "arc") return;

        if (currentTool === "rectangle" && activeObjType === "symbol") {
            const firstPt = twoPointFirstClickRef.current;
            if (firstPt !== null) {
                let imgPos = mouseImgRef.current;
                if (!imgPos) { setDraftPoints([]); return; }
                const dragDist = dist(firstPt, imgPos);
                const DRAG_THRESHOLD = 5 / scaleRef.current;
                if (dragDist < DRAG_THRESHOLD) return;
                twoPointFirstClickRef.current = null;
                const detCol = detectionColorRef.current;
                const start = firstPt;
                const end = imgPos;
                const rectPoints = [start, { x: end.x, y: start.y }, end, { x: start.x, y: end.y }];
                const symDragId = Date.now().toString();
                const symDragShape = { id: symDragId, type: "rectangle", points: [start, end], color: detCol || TOOL_COLORS.rectangle, __pending: true };
                setCurrentShapes((p) => [...p, symDragShape]);
                setDraftPoints([]);
                dirtyRef.current = true;
                if (onShapeComplete) onShapeComplete(rectPoints);
                selectNewShape(symDragId, symDragShape);
                return;
            }
        }

        if (currentTool === "circle") {
            const cd = circleDraftRef.current;
            if (!cd) { setDraftPoints([]); circleDraftRef.current = null; return; }
            const center = cd.center;
            let edge = cd.edge;
            const isCutCircle = isCutSubType(activeObjType);
            if (isCutCircle && cutParentAreaRef.current) {
                edge = clampCircleRadiusToArea(center, edge, cutParentAreaRef.current);
            }
            const radius = dist(center, edge);
            circleDraftRef.current = null;
            if (radius > 2 / scaleRef.current) {
                const cutColor = { stroke: "#ef4444", fill: "rgba(239,68,68,0.12)" };
                const completedCircleShape = {
                    id: Date.now().toString(), type: "circle",
                    points: [{ ...center }], radius,
                    color: isCutCircle ? cutColor : TOOL_COLORS.circle,
                    isCutShape: isCutCircle || undefined,
                    cutParentAreaId: isCutCircle ? cutParentAreaRef.current?.id : undefined,
                    cutParentTakeoffId: isCutCircle ? (cutParentAreaRef.current?.takeoffId || null) : undefined,
                    ...(isCutCircle ? {} : { __pending: true }),
                };
                setCurrentShapes((p) => [...p, completedCircleShape]);
                if (onShapeComplete) onShapeComplete([{ ...center }], completedCircleShape);
                selectNewShape(completedCircleShape.id, completedCircleShape);
                if (isCutCircle) cutParentAreaRef.current = null;
            }
            setDraftPoints([]);
            dirtyRef.current = true;
            return;
        }

        let imgPos = mouseImgRef.current;
        const dPts = draftPointsRef.current;
        if (!imgPos || !dPts.length) { setDraftPoints([]); return; }

        const start = dPts[0];
        const end = { ...imgPos };
        let measureValue;
        if (currentTool === "measure") measureValue = `${pixelsToFeet(dist(start, end)).toFixed(1)} ft`;

        const detCol = detectionColorRef.current;
        const isSymbolRect = currentTool === "rectangle" && activeObjType === "symbol";
        const shapeColor = isSymbolRect ? (detCol || TOOL_COLORS.rectangle) : TOOL_COLORS[currentTool];

        const completedShapeId = Date.now().toString();
        const completedShape = {
            id: completedShapeId, type: currentTool,
            points: [start, end], color: shapeColor, measureValue,
            ...(isSymbolRect ? { __pending: true } : {}),
        };
        setCurrentShapes((p) => [...p, completedShape]);
        setDraftPoints([]);
        dirtyRef.current = true;

        if (currentTool !== "measure") {
            selectNewShape(completedShapeId, completedShape);
        }

        if (isSymbolRect && onShapeComplete) {
            const rectPoints = [start, { x: end.x, y: start.y }, end, { x: start.x, y: end.y }];
            onShapeComplete(rectPoints);
        }
    }, [
        pixelsToFeet, setCurrentShapes, setDraftPoints,
        setAiDetectedShapes, onShapeDragEnd, scheduleDeleteBtnUpdate,
        onShapeComplete, selectNewShape,
    ]);

    // ── Pointer: leave ────────────────────────────────────────────────────────
    const onPointerLeave = useCallback(() => {
        if (isDrawingRef.current || isDraggingRef.current || isPanningRef.current || vertexDragRef.current) {
            return;
        }
        lastClientPosRef.current = null;
        lastPointerEventRef.current = null;
        if (movePosRafRef.current) {
            cancelAnimationFrame(movePosRafRef.current);
            movePosRafRef.current = null;
        }
        isPanningRef.current = false;
        isDraggingRef.current = false;
        isDrawingRef.current = false;
        vertexDragRef.current = null;
        vertexMovedRef.current = false;
        arcDraggingCpRef.current = null;
        if (dragRafRef.current) { cancelAnimationFrame(dragRafRef.current); dragRafRef.current = null; }
        dragLiveRef.current = null;
        dragCutLiveRef.current = null;
        mouseCanvasPosRef.current = null;
        setMouseCanvasPos(null);
        setHoveredShapeId(null);
        const t = toolRef.current;
        if (t !== "polygon" && t !== "arc") setDraftPoints([]);
        if (t === "circle") {
            circleDraftRef.current = null;
        }
        if (hoveredHandleRef.current !== null) {
            hoveredHandleRef.current = null;
            setHoveredHandle(null);
        }
        dirtyRef.current = true;
    }, [setMouseCanvasPos, setHoveredShapeId, setDraftPoints]);

    // ── Double-click: close polygon/arc + pan↔select toggle ──────────────────
    const onDoubleClick = useCallback(() => {
        if (snapClosedRef.current) { snapClosedRef.current = false; return; }
        if (arcSnapRef.current) { arcSnapRef.current = false; return; }
        const currentTool = toolRef.current;

        if (currentTool === "pan") { if (onToolChange) onToolChange("select"); return; }
        if (currentTool === "select") { if (onToolChange) onToolChange("pan"); return; }

        if (currentTool === "arc") {
            const arcPts = arcPointsRef.current;
            const arcCtrls = arcCtrlsRef.current;
            const committed = arcPts.slice(0, -1);
            if (committed.length < 3) return;

            const lastPt = committed[committed.length - 1];
            const firstPt = committed[0];
            const closingCp = { x: (lastPt.x + firstPt.x) / 2, y: (lastPt.y + firstPt.y) / 2 };
            const committedCtrls = arcCtrls.slice(0, committed.length - 1);
            const allCps = [...committedCtrls, closingCp];

            const isCutArc = isCutSubType(activeObjectTypeRef.current);
            const cutColor = { stroke: "#ef4444", fill: "rgba(239,68,68,0.12)" };
            
            let finalCps = allCps;
            if (isCutArc && cutParentAreaRef.current) {
                finalCps = allCps.map((cp, idx) => {
                    const p0 = committed[idx];
                    const p1 = (idx === committed.length - 1) ? committed[0] : committed[idx + 1];
                    if (p0 && p1) {
                        return clampArcControlPointToArea(p0, cp, p1, cutParentAreaRef.current);
                    }
                    return cp;
                });
            }

            const completedArcShape = {
                id: Date.now().toString(), type: "arc", points: committed,
                controlPoints: finalCps,
                color: isCutArc ? cutColor : TOOL_COLORS.arc,
                isCutShape: isCutArc || undefined,
                cutParentAreaId: isCutArc ? cutParentAreaRef.current?.id : undefined,
                cutParentTakeoffId: isCutArc ? (cutParentAreaRef.current?.takeoffId || null) : undefined,
                ...(isCutArc ? {} : { __pending: true }),
            };
            setCurrentShapes((p) => [...p, completedArcShape]);
            arcPointsRef.current = [];
            arcCtrlsRef.current = [];
            arcDraggingCpRef.current = null;
            setDraftPoints([]);
            dirtyRef.current = true;
            if (onShapeComplete) onShapeComplete(committed, completedArcShape);
            selectNewShape(completedArcShape.id, completedArcShape);
            if (isCutArc) cutParentAreaRef.current = null;
            return;
        }

        if (currentTool !== "polygon") return;

        const activeObjType = activeObjectTypeRef.current;
        const detCol = detectionColorRef.current;
        const isOpenLine = activeObjType === "wall" || activeObjType === "pipeline";
        const minPoints = isOpenLine ? 2 : 3;
        const dPts = draftPointsRef.current;
        const completedPoints = dPts.slice(0, -1);
        if (completedPoints.length < minPoints) return;

        const isCutPoly = isCutSubType(activeObjType);
        const cutColor = { stroke: "#ef4444", fill: "rgba(239,68,68,0.12)" };
        const dblShapeId = Date.now().toString();
        const dblShape = {
            id: dblShapeId,
            type: isOpenLine ? "line" : "polygon",
            points: completedPoints,
            color: isCutPoly ? cutColor : (detCol || TOOL_COLORS.polygon),
            isCutShape: isCutPoly || undefined,
            cutParentAreaId: isCutPoly ? cutParentAreaRef.current?.id : undefined,
            cutParentTakeoffId: isCutPoly ? (cutParentAreaRef.current?.takeoffId || null) : undefined,
            ...(isCutPoly ? {} : { __pending: true }),
        };
        setCurrentShapes((p) => [...p, dblShape]);
        setDraftPoints([]);
        dirtyRef.current = true;

        if (activeObjType && onShapeComplete) onShapeComplete(completedPoints, dblShape);
        selectNewShape(dblShapeId, dblShape);
        if (isCutPoly) cutParentAreaRef.current = null;
    }, [setCurrentShapes, setDraftPoints, onShapeComplete, onToolChange, selectNewShape]);

    const deleteShapeWithCutChildren = useCallback((shapeId) => {
        setCurrentShapes((prev) => {
            const next = prev.filter(
                (s) => s.id !== shapeId && s.cutParentAreaId !== shapeId
            );
            currentShapesRef.current = next;
            return next;
        });

        drawingModeSelectedIdRef.current = null;
        setDrawingModeSelectedId(null);
        selectedShapeIdRef.current = null;
        setSelectedShapeId(null);
        deleteBtnPosRef.current = null;
        setDeleteBtnPos(null);
        setPendingDelete(false);
        dirtyRef.current = true;
    }, [setCurrentShapes, setSelectedShapeId]);

    return (
        <div
            ref={stageRef}
            style={{
                flex: 1, overflow: "auto", position: "relative",
                background: "rgba(243,244,246,0.3)",
                width: "100%", height: "100%", boxSizing: "border-box",
            }}
        >
            {(!imgReady || isLoadingCurrentImage) && (
                <div style={{
                    position: "absolute", inset: 0, zIndex: 25, background: "#c8d0da",
                    display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none",
                }}>
                    <div style={{ transform: "translateX(24px)" }}>
                        <FullPageLoader />
                    </div>
                </div>
            )}

            <div
                onPointerMove={onPointerMove}
                onPointerDown={onPointerDown}
                onPointerUp={onPointerUp}
                onPointerLeave={onPointerLeave}
                onDoubleClick={onDoubleClick}
                style={{
                    display: "flex", alignItems: "center", justifyContent: "center",
                    minWidth: imgDims.w * scale, minHeight: imgDims.h * scale,
                    width: "100%", height: "100%",
                    visibility: imgReady ? "visible" : "hidden",
                    cursor: isCanvasProcessing ? "wait" : cursorStyle,
                    touchAction: "none",
                }}
            >
                <canvas ref={canvasRef} style={{ display: "block", willChange: "transform", pointerEvents: "none" }} />
            </div>

            {(selectedShapeId || drawingModeSelectedId) && deleteBtnPos && !isCanvasProcessing && !isLoadingCurrentImage && canDelete && (
                <div style={{ position: "absolute", left: deleteBtnPos.x, top: deleteBtnPos.y, zIndex: 30 }}>
                    {pendingDelete ? (
                        <div style={{ display: "flex", alignItems: "center", gap: 4, background: "#EFF6FF", border: "1px solid #1D4ED8", borderRadius: 8, boxShadow: "0 2px 8px rgba(0,0,0,0.12)", padding: "2px 4px" }}>
                            <div style={{ position: "relative", display: "inline-flex" }}
                                onMouseEnter={(e) => { const t = e.currentTarget.querySelector("[data-tip]"); if (t) t.style.display = "block"; }}
                                onMouseLeave={(e) => { const t = e.currentTarget.querySelector("[data-tip]"); if (t) t.style.display = "none"; }}>
                                <button
                                    onPointerDown={(e) => e.stopPropagation()}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setPendingDelete(false);
                                        const shapeId = selectedShapeIdRef.current || drawingModeSelectedIdRef.current;
                                        if (!shapeId) return;

                                        const localShape = currentShapesRef.current?.find((s) => s.id === shapeId && !s.__pending && !s.isCutShape);
                                        if (localShape) {
                                            deleteShapeWithCutChildren(shapeId);
                                        } else {
                                            const aiShape =
                                                visibleAiShapesRef.current?.find((s) => s.id === shapeId) ||
                                                visibleAiShapesRef.current?.find((s) => s.takeoffId === shapeId);

                                            setCurrentShapes((prev) => {
                                                const next = prev.filter((s) => s.cutParentAreaId !== shapeId);
                                                currentShapesRef.current = next;
                                                return next;
                                            });

                                            onDeleteShape?.(aiShape ? aiShape.id : shapeId);

                                            drawingModeSelectedIdRef.current = null;
                                            setDrawingModeSelectedId(null);
                                            selectedShapeIdRef.current = null;
                                            setSelectedShapeId(null);
                                            deleteBtnPosRef.current = null;
                                            setDeleteBtnPos(null);
                                        }
                                    }}
                                    style={{
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                        width: 28, height: 28, background: "transparent",
                                        border: "none", borderRadius: 6, cursor: "pointer", color: "#ef4444",
                                        padding: 2,
                                    }}
                                    onMouseEnter={(e) => { e.currentTarget.style.color = "#dc2626"; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.color = "#ef4444"; }}
                                >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                                </button>
                                <div data-tip style={{
                                    display: "none", position: "absolute", bottom: "calc(100% + 6px)",
                                    left: "50%", transform: "translateX(-50%)", background: "#1f2937",
                                    color: "#fff", fontSize: 11, fontWeight: 500, padding: "3px 8px",
                                    borderRadius: 4, whiteSpace: "nowrap", pointerEvents: "none",
                                    zIndex: 9999, boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
                                }}>Confirm Delete</div>
                            </div>
                            <div style={{ position: "relative", display: "inline-flex" }}
                                onMouseEnter={(e) => { const t = e.currentTarget.querySelector("[data-tip]"); if (t) t.style.display = "block"; }}
                                onMouseLeave={(e) => { const t = e.currentTarget.querySelector("[data-tip]"); if (t) t.style.display = "none"; }}>
                                <button
                                    onPointerDown={(e) => e.stopPropagation()}
                                    onClick={(e) => { e.stopPropagation(); setPendingDelete(false); }}
                                    style={{
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                        width: 28, height: 28, background: "transparent",
                                        border: "none", borderRadius: 6, cursor: "pointer", color: "#9ca3af",
                                        padding: 2,
                                    }}
                                    onMouseEnter={(e) => { e.currentTarget.style.color = "#374151"; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.color = "#9ca3af"; }}
                                >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                                </button>
                                <div data-tip style={{
                                    display: "none", position: "absolute", bottom: "calc(100% + 6px)",
                                    left: "50%", transform: "translateX(-50%)", background: "#1f2937",
                                    color: "#fff", fontSize: 11, fontWeight: 500, padding: "3px 8px",
                                    borderRadius: 4, whiteSpace: "nowrap", pointerEvents: "none",
                                    zIndex: 9999, boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
                                }}>Cancel</div>
                            </div>
                        </div>
                    ) : (
                        <div
                            style={{ position: "relative", display: "inline-flex" }}
                            onMouseEnter={(e) => { const t = e.currentTarget.querySelector("[data-del-tip]"); if (t) t.style.display = "block"; }}
                            onMouseLeave={(e) => { const t = e.currentTarget.querySelector("[data-del-tip]"); if (t) t.style.display = "none"; }}
                        >
                            <button
                                onPointerDown={(e) => e.stopPropagation()}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (annotationPermissions?.delete === false) {
                                        onPermissionDenied?.("Delete Annotation");
                                        return;
                                    }
                                    setPendingDelete(true);
                                }}
                                style={{
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    width: 32, height: 32, background: "#EFF6FF",
                                    border: "1px solid #1D4ED8", borderRadius: 6, cursor: "pointer",
                                    boxShadow: "0 2px 8px rgba(0,0,0,0.10)", color: "#2563EB",
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.background = "#DBEAFE"; }}
                                onMouseLeave={(e) => { e.currentTarget.style.background = "#EFF6FF"; }}
                            >
                                <i className="icon-Delete-fill" style={{ fontSize: 14, lineHeight: 1 }} />
                            </button>
                            <div data-del-tip style={{
                                display: "none", position: "absolute", bottom: "calc(100% + 6px)",
                                left: "50%", transform: "translateX(-50%)", background: "#1f2937",
                                color: "#fff", fontSize: 11, fontWeight: 500, padding: "3px 8px",
                                borderRadius: 4, whiteSpace: "nowrap", pointerEvents: "none",
                                zIndex: 9999, boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
                            }}>Delete</div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
});

export default CanvasPanel;
