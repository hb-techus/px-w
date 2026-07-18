// ─── useTakeoffShapeHandlers.js ───────────────────────────────────────────────
// Extracts shape geometry / canvas callbacks from TakeoffWorkspace.
// All logic is identical to the original useCallback bodies — only moved here.

import { useCallback } from "react";
import {
  addDetectionObject, updateDetectionObject, deleteDetectionObject,
} from "../../../../services/techus-services";
import { showToast } from "../../../../genriccomponents/techus-ToastNotification";
import { getDeviceInfo } from "../../../../utils/getDeviceInfo";
import { stableColorForId } from "./UtilsColor";
import { unwrapRes } from "./TakeoffWorkspace.utils";
import { LINE_OBJECT_TYPES, ALL_DATA_KEYS } from "./TakeoffWorkspace.constants";

export function useTakeoffShapeHandlers({
  // stable refs
  pageStore, currentShapesRef, pendingObjectKeyRef, visibleAiShapesRef,
  perPageDetectionColorCache, colorMapRef, extractedPagesRef, drawnPagesRef,
  pendingDrawnShapeIdRef, mtAnnotationEnabledRef, committedCutShapesRef,
  userExtractedPagesRef, backendExtractedPagesRef, confirmDeleteShapeRef,
  // state values
  selectedDoc, currentPage, aiDetectedShapes, activeObjectType,
  takeoffData, manualDrawingPages, detectedPages,
  // setters (stable)
  setCurrentShapes, setAiDetectedShapes, setSelectedShapeId, setSelectedShapeIds,
  setColorMap, setManualDrawingPages, setDetectedPages, setAiRunPages,
  setAiDetectionComplete, setDrawnSinceExtractionPages, setIsDeletingDetectionPkIds,
  setHiddenIds,
  // callbacks from useTakeoffAIHandlers
  fetchDetectionForPage, replaceExtractionForPage,
  // callback from component
  handleUpgradeRequired,
}) {
  const buildArcGeometryJson = useCallback((shape) => {
    const points = shape?.points || [];
    const controlPoints = shape?.controlPoints || [];
    if (points.length < 2 || controlPoints.length === 0) return { type: "arc", value: [] };
    const roundPoint = (p) => [Math.round(p.x), Math.round(p.y)];
    const isMidpoint = (from, to, cp) => {
      const midX = (from.x + to.x) / 2;
      const midY = (from.y + to.y) / 2;
      return Math.abs(cp.x - midX) < 0.5 && Math.abs(cp.y - midY) < 0.5;
    };
    const segments = controlPoints.map((cp, idx) => {
      const from = points[idx];
      const to = points[(idx + 1) % points.length];
      if (!from || !to || !cp) return null;
      return {
        from: roundPoint(from),
        to: roundPoint(to),
        control: isMidpoint(from, to, cp) ? null : roundPoint(cp),
      };
    }).filter(Boolean);
    return { type: "arc", value: segments };
  }, []);

  const buildGeometryJson = useCallback((_objectType, points, shape = null) => {
    if (LINE_OBJECT_TYPES.has(_objectType))
      return points.map((p) => [Math.round(p.x), Math.round(p.y)]);
    if (_objectType === "symbol")
      return [points.map((p) => [Math.round(p.x), Math.round(p.y)])];
    if (_objectType === "area")
      return { type: "polygon", value: points.map((p) => [Math.round(p.x), Math.round(p.y)]) };
    if (_objectType === "circle" && shape) {
      const center = shape.points[0];
      return { type: "circle", center: [Math.round(center.x), Math.round(center.y)], radius: Math.round(shape.radius * 10) / 10 };
    }
    if (_objectType === "arc" && shape) return buildArcGeometryJson(shape);
    return points.map((p) => [Math.round(p.x), Math.round(p.y)]);
  }, [buildArcGeometryJson]);

  const buildUpdateGeometryJson = useCallback((shape, newPoints) => {
    if (shape?.areaType === "symbol" || shape?.symbolType)
      return [newPoints.map((p) => [Math.round(p.x), Math.round(p.y)])];
    if (shape?.type === "circle" && shape.radius != null) {
      const center = newPoints[0];
      return { type: "circle", center: [Math.round(center.x), Math.round(center.y)], radius: Math.round(shape.radius * 10) / 10 };
    }
    if (shape?.type === "arc") return buildArcGeometryJson({ ...shape, points: newPoints });
    if (shape?.areaType === "room" || shape?.type === "area")
      return { type: "polygon", value: newPoints.map((p) => [Math.round(p.x), Math.round(p.y)]) };
    return newPoints.map((p) => [Math.round(p.x), Math.round(p.y)]);
  }, [buildArcGeometryJson]);

  const handleShapeComplete = useCallback(async (completedPoints, shape = null) => {
    if (!activeObjectType || !selectedDoc || !completedPoints?.length) return;

    if (activeObjectType === "cut_polygon" || activeObjectType === "cut_arc" || activeObjectType === "cut_circle") {
      setCurrentShapes((prev) => prev.filter((s) => !s.__pending));

      const parentCanvasId = shape?.cutParentAreaId;
      if (!parentCanvasId || !selectedDoc) return;

      const parentShape =
        visibleAiShapesRef.current?.find((s) => s.id === parentCanvasId) ||
        currentShapesRef.current?.find((s) => s.id === parentCanvasId);
      if (!parentShape) return;

      const rawParentId = parentShape.takeoffId ?? parentShape.id;
      const parentObjectKey = rawParentId?.startsWith("manual-")
        ? (pendingObjectKeyRef.current.get(rawParentId) ?? null)
        : rawParentId;

      if (!parentObjectKey) {
        console.warn("[CutTool] Parent object_key not ready yet — draw the parent first:", rawParentId);
        return;
      }

      const cutGeoType =
        activeObjectType === "cut_circle" ? "circle"
          : activeObjectType === "cut_arc" ? "arc"
            : "area";

      const rawGeo = buildGeometryJson(cutGeoType, completedPoints, shape);
      const cutGeometryJson =
        typeof rawGeo === "object" && !Array.isArray(rawGeo)
          ? { ...rawGeo, cut: parentObjectKey }
          : {
            type: "polygon",
            value: completedPoints.map((p) => [Math.round(p.x), Math.round(p.y)]),
            cut: parentObjectKey,
          };

      const cutShapeCanvasId = shape?.id;
      if (!cutShapeCanvasId) return;

      drawnPagesRef.current.add(currentPage);
      if (extractedPagesRef.current.has(currentPage)) {
        setDrawnSinceExtractionPages((prev) => new Set([...prev, currentPage]));
      }
      setManualDrawingPages((prev) => new Set([...prev, currentPage]));
      if (pageStore.current) delete pageStore.current[currentPage];

      (async () => {
        try {
          const raw = await addDetectionObject({
            organization_uuid: localStorage.getItem("organization_uuid"),
            project_uuid: localStorage.getItem("project_uuid"),
            document_id: selectedDoc.document_id,
            page_number: currentPage + 1,
            object_type: "area",
            geometry_json: cutGeometryJson,
            device_info: getDeviceInfo(),
          });
          let objectKey = null;
          try {
            const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
            objectKey = parsed?.data?.object_key ?? parsed?.object_key ?? null;
          } catch { objectKey = null; }
          const resObj = typeof raw === "string"
            ? (() => { try { return JSON.parse(raw); } catch { return {}; } })()
            : (raw ?? {});
          if (resObj?.message && resObj.valid === false) showToast("error", resObj.message);
          if (objectKey) {
            pendingObjectKeyRef.current.set(cutShapeCanvasId, objectKey);
          }
        } catch (e) {
          console.error("[CutTool] addDetectionObject error:", e);
          showToast("error", e.message);
          setCurrentShapes((prev) => prev.filter((s) => s.id !== cutShapeCanvasId));
        }
      })();
      return;
    }

    if (mtAnnotationEnabledRef.current === false) {
      handleUpgradeRequired("Upgrade your package to use drawing tools.");
      return;
    }

    const apiObjectType = (activeObjectType === "arc" || activeObjectType === "circle")
      ? "area" : activeObjectType;

    const payload = {
      organization_uuid: localStorage.getItem("organization_uuid"),
      project_uuid: localStorage.getItem("project_uuid"),
      document_id: selectedDoc.document_id,
      page_number: currentPage + 1,
      object_type: apiObjectType,
      geometry_json: buildGeometryJson(activeObjectType, completedPoints, shape),
      device_info: getDeviceInfo(),
    };

    const newShapeId = `manual-${activeObjectType}-${currentPage + 1}-${Date.now()}`;
    const manualColor = stableColorForId(`${newShapeId}_p${currentPage + 1}`);
    const shapeTypeMap = {
      symbol: { type: "polygon", areaType: "symbol" },
      area: { type: "area", areaType: "room" },
      arc: { type: "arc", areaType: "room" },
      circle: { type: "circle", areaType: "room" },
      wall: { type: "line", areaType: "wall" },
      pipeline: { type: "line", areaType: "pipeline" },
    };
    const { type: shapeType, areaType: shapeAreaType } =
      shapeTypeMap[activeObjectType] ?? { type: "line", areaType: activeObjectType };

    const manualShape = {
      id: newShapeId, takeoffId: newShapeId,
      type: shapeType, areaType: shapeAreaType,
      points: completedPoints,
      ...(shape?.controlPoints ? { controlPoints: shape.controlPoints } : {}),
      ...(shape?.radius != null ? { radius: shape.radius } : {}),
      color: manualColor,
      pageNumber: currentPage + 1,
    };

    setAiDetectedShapes((prev) => [...prev, manualShape]);
    setCurrentShapes((prev) => prev.filter((s) => !s.__pending));
    drawnPagesRef.current.add(currentPage);
    if (extractedPagesRef.current.has(currentPage)) {
      setDrawnSinceExtractionPages((prev) => new Set([...prev, currentPage]));
    }
    setManualDrawingPages((prev) => new Set([...prev, currentPage]));
    if (pageStore.current) delete pageStore.current[currentPage];

    (async () => {
      try {
        const raw = await addDetectionObject(payload);
        let objectKey = null;
        try {
          const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
          objectKey = parsed?.data?.object_key ?? parsed?.object_key ?? null;
        } catch { objectKey = null; }
        const resObj = typeof raw === "string" ? (() => { try { return JSON.parse(raw); } catch { return {}; } })() : (raw ?? {});
        if (resObj?.message && resObj.valid === false) showToast("error", resObj.message);
        if (resObj?.valid !== false && objectKey) {
          pendingObjectKeyRef.current.set(newShapeId, objectKey);
        }
        if (raw?.valid !== false && objectKey) {
          pendingObjectKeyRef.current.set(newShapeId, objectKey);
        }
        if (objectKey) {
          const pageNum = currentPage + 1;
          const scopedKey = `${objectKey}_p${pageNum}`;
          const correctColor = stableColorForId(scopedKey);
          setAiDetectedShapes((prev) =>
            prev.map((s) =>
              s.id === newShapeId
                ? { ...s, takeoffId: objectKey, color: correctColor }
                : s
            )
          );
          setHiddenIds((prev) => {
            if (!prev.has(scopedKey) && !prev.has(objectKey)) return prev;
            const next = new Set(prev);
            next.delete(scopedKey);
            next.delete(objectKey);
            return next;
          });
          setColorMap((prevMap) => {
            const next = new Map(prevMap);
            next.set(objectKey, correctColor);
            next.set(scopedKey, correctColor);
            colorMapRef.current = next;
            return next;
          });
        }
      } catch (e) {
        console.error("addDetectionObject error:", e);
        showToast("error", e.message);
        pendingObjectKeyRef.current.delete(newShapeId);
        setAiDetectedShapes((prev) => prev.filter((s) => s.id !== newShapeId));
      } finally {
        pendingDrawnShapeIdRef.current = null;
      }
    })();
  }, [activeObjectType, selectedDoc, currentPage, buildGeometryJson, handleUpgradeRequired]);

  const handleShapeDragEnd = useCallback(async (shape, newPoints) => {
    if (!selectedDoc) return;
    if (shape.isCutShape) return;
    if (extractedPagesRef.current.has(currentPage)) {
      setDrawnSinceExtractionPages((prev) => new Set([...prev, currentPage]));
    }
    const pageIdx = currentPage;
    const pageNum = pageIdx + 1;

    let objectKey;
    if (shape.isCutShape) {
      const tid = shape.takeoffId;
      if (tid && !tid.startsWith("manual-")) {
        objectKey = tid;
      } else {
        objectKey = pendingObjectKeyRef.current.get(shape.id) ?? null;
      }
    } else {
      const rawId = shape.takeoffId;
      objectKey = rawId?.startsWith("manual-")
        ? (pendingObjectKeyRef.current.get(rawId) ?? null)
        : rawId;
    }

    if (!objectKey || objectKey.startsWith("manual-")) {
      console.warn("Backend object_key not ready yet:", shape.id);
      return;
    }

    const isSymbol = shape.areaType === "symbol" || !!shape.symbolType;
    let geometryJson;
    if (isSymbol) {
      const allInstances = aiDetectedShapes
        .filter((s) => s.takeoffId === objectKey && s.areaType === "symbol")
        .map((s) =>
          s.id === shape.id
            ? newPoints.map((p) => [Math.round(p.x), Math.round(p.y)])
            : s.points.map((p) => [Math.round(p.x), Math.round(p.y)])
        );
      geometryJson = allInstances.length === 0
        ? [newPoints.map((p) => [Math.round(p.x), Math.round(p.y)])]
        : allInstances;
    } else {
      const shapeForUpdate = shape.type === "arc" ? { ...shape, points: newPoints } : shape;
      geometryJson = buildUpdateGeometryJson(shapeForUpdate, newPoints);
    }

    let cutParentKey = null;
    if (shape.isCutShape && shape.cutParentAreaId) {
      const parentShape =
        visibleAiShapesRef.current?.find((s) => s.id === shape.cutParentAreaId) ||
        currentShapesRef.current?.find((s) => s.id === shape.cutParentAreaId);
      if (parentShape) {
        const rawPId = parentShape.takeoffId ?? parentShape.id;
        cutParentKey = rawPId?.startsWith("manual-")
          ? (pendingObjectKeyRef.current.get(rawPId) ?? null)
          : rawPId;
      }
    }

    const finalGeometryJson = cutParentKey
      ? (typeof geometryJson === "object" && !Array.isArray(geometryJson)
        ? { ...geometryJson, cut: cutParentKey }
        : {
          type: "polygon",
          value: newPoints.map((p) => [Math.round(p.x), Math.round(p.y)]),
          cut: cutParentKey,
        })
      : geometryJson;

    if (shape.isCutShape) {
      setAiDetectedShapes((prev) =>
        prev.map((s) => {
          if (s.id !== shape.id) return s;
          const updated = { ...s, points: newPoints };
          if (shape.type === "arc") updated.controlPoints = shape.controlPoints || s.controlPoints || [];
          if (shape.type === "circle" && shape.radius != null) updated.radius = shape.radius;
          return updated;
        })
      );
    } else {
      setAiDetectedShapes((prev) =>
        prev.map((s) => {
          if (s.id !== shape.id) return s;
          const updated = { ...s, points: newPoints };
          if (shape.type === "arc") updated.controlPoints = shape.controlPoints || s.controlPoints || [];
          if (shape.type === "circle" && shape.radius != null) updated.radius = shape.radius;
          return updated;
        })
      );
      setCurrentShapes((prev) => prev.filter((s) => !s.__pending));
    }

    drawnPagesRef.current.add(pageIdx);
    if (pageStore.current) delete pageStore.current[pageIdx];
    if (perPageDetectionColorCache.current) delete perPageDetectionColorCache.current[pageIdx];

    const isAreaLike = shape.type === "arc" || shape.type === "circle"
      || shape.areaType === "room" || shape.isCutShape;
    const dragApiObjectType = isAreaLike ? "area" : undefined;

    updateDetectionObject({
      organization_uuid: localStorage.getItem("organization_uuid") ?? "",
      project_uuid: localStorage.getItem("project_uuid") ?? "",
      document_id: selectedDoc.document_id,
      page_number: pageNum,
      object_key: objectKey,
      geometry_json: finalGeometryJson,
      ...(dragApiObjectType ? { object_type: dragApiObjectType } : {}),
      device_info: getDeviceInfo(),
    })
      .then((raw) => {
        const res = raw?.valid !== undefined ? raw : raw?.data?.valid !== undefined ? raw.data : null;
        if (res?.message) showToast(res.valid ? "success" : "error", res.message);
      })
      .catch((e) => {
        showToast("error", e.message);
        setAiDetectedShapes((prev) => prev.map((s) => s.id !== shape.id ? s : { ...s, points: shape.points }));
      });
  }, [selectedDoc, currentPage, aiDetectedShapes, buildUpdateGeometryJson]);

  const handleDeleteShape = useCallback((shapeId) => {
    const shape = [...(aiDetectedShapes || [])].find((s) => s.id === shapeId);
    if (shape) {
      confirmDeleteShapeRef.current?.(shapeId);
      return;
    }
    const cutShape = currentShapesRef.current?.find((s) => s.id === shapeId && s.isCutShape);
    if (cutShape) {
      confirmDeleteShapeRef.current?.(shapeId);
    }
  }, [aiDetectedShapes]);

  const confirmDeleteShape = useCallback(async (shapeId) => {
    if (!selectedDoc) return;

    const cutShapeFromCurrent = currentShapesRef.current?.find((s) => s.id === shapeId && s.isCutShape);
    const cutShapeFromAi = (aiDetectedShapes || []).find((s) => s.id === shapeId && s.isCutShape);
    const cutShape = cutShapeFromCurrent ?? cutShapeFromAi;

    if (cutShape) {
      const tid = cutShape.takeoffId;
      const cutObjectKey = (tid && !tid.startsWith("manual-"))
        ? tid
        : (pendingObjectKeyRef.current.get(cutShape.id) ?? null);

      if (cutShapeFromCurrent) {
        setCurrentShapes((prev) => {
          const next = prev.filter((s) => s.id !== shapeId);
          currentShapesRef.current = next;
          committedCutShapesRef.current.delete(shapeId);
          return next;
        });
      }
      if (cutShapeFromAi) {
        setAiDetectedShapes((prev) => prev.filter((s) => s.id !== shapeId));
        const cached = pageStore.current[currentPage];
        if (cached?.area && cutObjectKey) delete cached.area[cutObjectKey];
      }
      setSelectedShapeId(null);
      setSelectedShapeIds(new Set());

      if (!cutObjectKey) return;

      try {
        const raw = await deleteDetectionObject({
          organization_uuid: localStorage.getItem("organization_uuid") ?? "",
          project_uuid: localStorage.getItem("project_uuid") ?? "",
          document_id: selectedDoc.document_id,
          page_number: currentPage + 1,
          object_key: cutObjectKey,
          object_type: "area",
          device_info: getDeviceInfo(),
        });
        const res = unwrapRes(raw);
        if (res?.valid === false) {
          showToast("error", res?.message || "Failed to delete cut shape");
          if (cutShapeFromCurrent) {
            setCurrentShapes((prev) => {
              const next = [...prev, cutShape];
              currentShapesRef.current = next;
              return next;
            });
          }
          if (cutShapeFromAi) {
            setAiDetectedShapes((prev) => [...prev, cutShape]);
          }
        } else {
          pendingObjectKeyRef.current.delete(cutShape.id);
          drawnPagesRef.current.add(currentPage);
          if (extractedPagesRef.current.has(currentPage)) {
            setDrawnSinceExtractionPages((prev) => new Set([...prev, currentPage]));
          }
        }
      } catch (e) {
        showToast("error", e.message);
        if (cutShapeFromCurrent) {
          setCurrentShapes((prev) => {
            const next = [...prev, cutShape];
            currentShapesRef.current = next;
            return next;
          });
        }
        if (cutShapeFromAi) {
          setAiDetectedShapes((prev) => [...prev, cutShape]);
        }
      }
      return;
    }

    // ── [DETECTION SHAPES] existing flow ─────────────────────────────────────
    const shape = [...(aiDetectedShapes || [])].find((s) => s.id === shapeId);
    if (!shape) return;

    const rawId = shape.takeoffId;
    const objectKey = rawId?.startsWith("manual-")
      ? (pendingObjectKeyRef.current.get(rawId) ?? null)
      : rawId;

    if (!objectKey || objectKey.startsWith("manual-")) return;

    if (rawId?.startsWith("manual-")) {
      pendingObjectKeyRef.current.delete(rawId);
    }
    const isSymbol = shape.areaType === "symbol" || !!shape.symbolType;
    setSelectedShapeId(null); setSelectedShapeIds(new Set());
    setAiDetectedShapes((prev) => prev.filter((s) => s.id !== shapeId));

    const parentCanvasId = shape.id;
    setAiDetectedShapes((prev) =>
      prev.filter((s) => !(s.isCutShape && (
        s.cutParentAreaId === objectKey ||
        s.cutParentAreaId === parentCanvasId
      )))
    );
    setCurrentShapes((prev) => {
      const next = prev.filter(
        (s) => !(s.isCutShape && (
          s.cutParentAreaId === objectKey ||
          s.cutParentAreaId === parentCanvasId
        ))
      );
      currentShapesRef.current = next;
      return next;
    });
    const cachedPage = pageStore.current[currentPage];
    if (cachedPage?.area && objectKey) {
      for (const areaKey of Object.keys(cachedPage.area)) {
        if (cachedPage.area[areaKey]?.cut === objectKey) {
          delete cachedPage.area[areaKey];
        }
      }
    }

    const deletingPkIds = new Set();
    for (const dataKey of ALL_DATA_KEYS) {
      const val = takeoffData[dataKey];
      const items = Array.isArray(val) ? val : (val?.items ?? []);
      items.filter((item) => {
        const pageOk = item.page_number == null || Number(item.page_number) === currentPage + 1;
        if (!pageOk) return false;
        return item.id === objectKey ||
          (Array.isArray(item.object_keys) && item.object_keys.includes(objectKey));
      }).forEach((item) => {
        const pid = item.pk_id ?? item.item_id ?? null;
        if (pid != null) deletingPkIds.add(pid);
      });
    }
    if (deletingPkIds.size > 0) setIsDeletingDetectionPkIds(deletingPkIds);

    try {
      let deletePayload;
      if (isSymbol) {
        const thisInstancePoints = shape.points.map((p) => [Math.round(p.x), Math.round(p.y)]);
        const instanceParts = shapeId.split("-instance-");
        const instanceIdx = instanceParts.length > 1 ? parseInt(instanceParts[1], 10) : 0;
        let matchedItemId = null;
        for (const dataKey of ALL_DATA_KEYS) {
          const val = takeoffData[dataKey];
          const items = Array.isArray(val) ? val : (val?.items ?? []);
          const matchingItems = items.filter((item) => {
            const pageOk = item.page_number == null || Number(item.page_number) === currentPage + 1;
            if (!pageOk) return false;
            return item.id === objectKey ||
              (Array.isArray(item.object_keys) && item.object_keys.includes(objectKey));
          });
          if (matchingItems.length > 0) {
            const target = matchingItems[instanceIdx] ?? matchingItems[matchingItems.length - 1];
            matchedItemId = target.pk_id ?? target.item_id ?? null;
            break;
          }
        }
        deletePayload = {
          organization_uuid: localStorage.getItem("organization_uuid") ?? "",
          project_uuid: localStorage.getItem("project_uuid") ?? "",
          document_id: selectedDoc.document_id,
          page_number: currentPage + 1,
          object_key: objectKey,
          geometry_json: thisInstancePoints,
          device_info: getDeviceInfo(),
        };
        if (matchedItemId != null) deletePayload.item_id = matchedItemId;
      } else {
        const isAreaLike = shape.type === "arc" || shape.type === "circle" || shape.areaType === "room";
        const deleteApiObjectType = isAreaLike ? "area" : undefined;
        deletePayload = {
          organization_uuid: localStorage.getItem("organization_uuid") ?? "",
          project_uuid: localStorage.getItem("project_uuid") ?? "",
          document_id: selectedDoc.document_id,
          page_number: currentPage + 1,
          object_key: objectKey,
          ...(deleteApiObjectType ? { object_type: deleteApiObjectType } : {}),
          device_info: getDeviceInfo(),
        };
      }
      const raw = await deleteDetectionObject(deletePayload);
      const res = unwrapRes(raw);
      if (res?.valid === false) {
        showToast("error", res?.message || "Failed to delete detection object");
        await fetchDetectionForPage(currentPage, selectedDoc, true);
        return;
      }

      const isManualOnlyPage = manualDrawingPages.has(currentPage) && !detectedPages.has(currentPage);
      if (!isManualOnlyPage) {
        await replaceExtractionForPage(currentPage, selectedDoc);
      }

      userExtractedPagesRef.current.delete(currentPage);
      backendExtractedPagesRef.current.delete(currentPage);
      drawnPagesRef.current.add(currentPage);
      if (pageStore.current[currentPage]) {
        const cached = pageStore.current[currentPage];
        if (isSymbol) {
          const instanceParts = shapeId.split("-instance-");
          const instanceIdx = instanceParts.length > 1 ? parseInt(instanceParts[1], 10) : 0;
          if (cached.symbols?.[objectKey]) {
            const arr = cached.symbols[objectKey];
            if (Array.isArray(arr) && instanceIdx >= 0 && instanceIdx < arr.length) {
              arr.splice(instanceIdx, 1);
              if (arr.length === 0) delete cached.symbols[objectKey];
            }
          }
        } else {
          if (shape.areaType === "room" && cached.area) delete cached.area[objectKey];
          else if (shape.areaType === "wall" && cached.wall) delete cached.wall[objectKey];
          else if (shape.areaType === "pipeline" && cached.pipeline) delete cached.pipeline[objectKey];
        }
      }
    } catch (e) {
      showToast("error", e.message);
      fetchDetectionForPage(currentPage, selectedDoc, true);
    } finally {
      setIsDeletingDetectionPkIds(new Set());
      setAiDetectedShapes((prev) => {
        const pageShapes = prev.filter((s) => s.pageNumber == null || s.pageNumber === currentPage + 1);
        if (pageShapes.length === 0) {
          setDetectedPages((dp) => { const next = new Set(dp); next.delete(currentPage); return next; });
          setAiRunPages((rp) => { const next = new Set(rp); next.delete(currentPage); return next; });
          setAiDetectionComplete(false);
          setManualDrawingPages((mp) => {
            const next = new Set(mp);
            next.delete(currentPage);
            return next;
          });
        }
        return prev;
      });
    }
  }, [selectedDoc, aiDetectedShapes, takeoffData, currentPage, fetchDetectionForPage, replaceExtractionForPage]);

  return {
    buildArcGeometryJson,
    buildGeometryJson,
    buildUpdateGeometryJson,
    handleShapeComplete,
    handleShapeDragEnd,
    handleDeleteShape,
    confirmDeleteShape,
  };
}
