// ─── useTakeoffItemHandlers.js ────────────────────────────────────────────────
// Extracts takeoff item CRUD and UI callbacks from TakeoffWorkspace.
// All logic is identical to the original useCallback bodies — only moved here.

import { useCallback } from "react";
import {
  getLineItems, DeleteLineItem, DeleteLineCategory, getConfigV2, getTypesV2,
} from "../../../../services/techus-services";
import { showToast } from "../../../../genriccomponents/techus-ToastNotification";
import { getDeviceInfo } from "../../../../utils/getDeviceInfo";
import { buildColorMapFromData, applyDetectionEntries } from "./TakeoffWorkspace.utils";
import { ALL_DATA_KEYS, GROUP_KEY_TO_DATA_KEY } from "./TakeoffWorkspace.constants";

export function useTakeoffItemHandlers({
  // stable refs
  perPageDetectionColorCache, colorMapRef, extractedPagesRef, drawnPagesRef,
  currentPageRef, hiddenIdsRef, selectedTakeoffIdRef, takeoffDataRef,
  userExtractedPagesRef, backendExtractedPagesRef, pageStore,
  pendingSelectTakeoffIdRef,
  // state values
  selectedDoc, currentPage, takeoffData, aiDetectedShapes, totalPages, allShapes, mtTradeEnabled,
  // setters (stable)
  setTakeoffData, setColorMap, setAiDetectedShapes, setHiddenIds,
  setSelectedShapeId, setSelectedShapeIds, setSelectedTakeoffId,
  setExpandedGroups, setEditingItem, setEditingGroupId, setIsEditDialogLoading,
  setIsDeletingPkId, setIsDeletingGroup, setIsDeleting, setExtractedPages,
  setAiExtractionComplete, setAiDetectionComplete, setManualDrawingPages,
  setDetectedPages, setAiRunPages, setShapes, setDeletingGroupId, setDeletingItemId,
  setTool, setActiveObjectType, setDraftPoints,
  // callbacks from other hooks / component
  handleUpgradeRequired, handlePageChange,
  fetchEligibleTakeoffsForPage, fetchExtractionForPageSilent,
}) {
  const handleTakeoffUpdate = useCallback((updatedItem) => {
    setTakeoffData((prev) => {
      if (!prev) return null;
      const n = { ...prev };
      const groupKey = updatedItem.__groupKey;
      const targetDataKey = groupKey ? (GROUP_KEY_TO_DATA_KEY[groupKey] ?? `${groupKey}_data`) : null;
      const { __groupKey, ...itemToMerge } = updatedItem;
      const itemToMergePk = itemToMerge.pk_id ?? itemToMerge.item_id;
      const matchFn = (i) => {
        const iPk = i.pk_id ?? i.item_id;
        if (itemToMergePk != null || iPk != null) return iPk != null && iPk === itemToMergePk;
        return i.id === itemToMerge.id;
      };
      const mergeFn = (i) => {
        if (!matchFn(i)) return i;
        const prevAttrs = i.attributes && typeof i.attributes === "object" ? i.attributes : {};
        const updatedAttrs = { ...prevAttrs, ...itemToMerge };
        delete updatedAttrs.id; delete updatedAttrs.pk_id; delete updatedAttrs.item_id;
        delete updatedAttrs.name; delete updatedAttrs.page_number; delete updatedAttrs.line_order;
        delete updatedAttrs.takeoff_id; delete updatedAttrs.takeoff_name;
        delete updatedAttrs.color; delete updatedAttrs.takeoff_order; delete updatedAttrs.type_key;
        delete updatedAttrs.object_keys; delete updatedAttrs.door_window_type;
        return { ...i, ...itemToMerge, attributes: updatedAttrs, line_order: i.line_order ?? itemToMerge.line_order };
      };
      const keysToUpdate = targetDataKey ? [targetDataKey] : ALL_DATA_KEYS;
      keysToUpdate.forEach((k) => {
        const val = n[k];
        if (!val) return;
        if (Array.isArray(val)) n[k] = val.map(mergeFn);
        else if (val.items && Array.isArray(val.items)) n[k] = { ...val, items: val.items.map(mergeFn) };
      });
      const extractionColorMap = buildColorMapFromData(n);
      const mergedColorMap = new Map(extractionColorMap);
      for (const [, pageMap] of Object.entries(perPageDetectionColorCache.current)) {
        applyDetectionEntries(mergedColorMap, pageMap);
      }
      colorMapRef.current = mergedColorMap;
      setColorMap(mergedColorMap);
      setAiDetectedShapes((prevShapes) =>
        prevShapes.map((shape) => {
          const newColor =
            mergedColorMap.get(
              shape.pageNumber != null ? `${shape.takeoffId}_p${shape.pageNumber}` : shape.takeoffId
            ) || mergedColorMap.get(shape.takeoffId);
          return newColor ? { ...shape, color: newColor } : shape;
        })
      );
      return n;
    });
  }, []);

  const toggleItemVisibility = useCallback((gk, hiddenKey) => {
    const bareId = hiddenKey.replace(/_p\d+$/, "");
    const pageMatch = hiddenKey.match(/_p(\d+)$/);
    const itemPageNum = pageMatch ? parseInt(pageMatch[1], 10) : null;
    const dataKey = GROUP_KEY_TO_DATA_KEY[gk] ?? `${gk}_data`;
    const groupVal = takeoffData?.[dataKey];
    const items = Array.isArray(groupVal) ? groupVal : (groupVal?.items ?? []);
    const target = items.find((i) => i.id === bareId && (itemPageNum == null || i.page_number === itemPageNum));
    const resolvedPageNum = itemPageNum ?? (target?.page_number != null ? Number(target.page_number) : null);
    const itemPage = resolvedPageNum != null ? resolvedPageNum - 1 : currentPageRef.current;
    const activePage = currentPageRef.current;
    const objectKeys = Array.isArray(target?.object_keys) ? target.object_keys : [];
    const allKeysToToggle = new Set([hiddenKey]);
    objectKeys.forEach((ok) => {
      const scopedOk = resolvedPageNum != null ? `${ok}_p${resolvedPageNum}` : ok;
      allKeysToToggle.add(scopedOk);
      if (resolvedPageNum == null) allKeysToToggle.add(ok);
    });
    const applyToggle = (prev) => {
      const next = new Set(prev);
      const shouldHide = !prev.has(hiddenKey);
      allKeysToToggle.forEach((k) => { if (shouldHide) next.add(k); else next.delete(k); });
      return next;
    };

    const isHiding = !hiddenIdsRef.current.has(hiddenKey);
    if (isHiding) {
      const selTid = selectedTakeoffIdRef.current;
      const matchesSelected = selTid && (
        selTid === hiddenKey ||
        selTid === bareId ||
        selTid.replace(/_p\d+$/, '') === bareId
      );
      if (matchesSelected) {
        setSelectedShapeId(null);
        setSelectedShapeIds(new Set());
      }
    }

    if (itemPage !== activePage && itemPage >= 0 && itemPage < totalPages) {
      handlePageChange(itemPage);
      setTimeout(() => { setHiddenIds(applyToggle); }, 100);
    } else {
      setHiddenIds(applyToggle);
    }
  }, [takeoffData, totalPages, handlePageChange]);

  const toggleGroupExpand = useCallback((gid) => {
    setExpandedGroups((p) => { const s = new Set(p); s.has(gid) ? s.delete(gid) : s.add(gid); return s; });
  }, []);

  const handleLineItemClick = useCallback((item, groupKey) => {
    const pageNum = item.page_number != null ? Number(item.page_number) : null;
    const itemPage = pageNum != null ? pageNum - 1 : currentPageRef.current;
    const scopedId = pageNum != null ? `${item.id}_p${pageNum}` : item.id;
    setExpandedGroups((prev) => new Set([...prev, groupKey]));
    const itemObjectKeys = Array.isArray(item.object_keys) ? item.object_keys : [];
    const matchingShapes = allShapes.filter(
      (s) => (s.takeoffId === item.id || itemObjectKeys.includes(s.takeoffId)) &&
        (pageNum == null || s.pageNumber == null || s.pageNumber === pageNum)
    );
    if (matchingShapes.length > 0) {
      const matchIds = new Set(matchingShapes.map((s) => s.id));
      setSelectedShapeIds(matchIds);
      setSelectedShapeId(matchingShapes[0].id);
    }
    if (itemPage !== currentPageRef.current && itemPage >= 0 && itemPage < totalPages) {
      pendingSelectTakeoffIdRef.current = { takeoffId: item.id, pageNum, objectKeys: item.object_keys };
      handlePageChange(itemPage);
    }
    setSelectedTakeoffId(scopedId);
  }, [allShapes, totalPages, handlePageChange]);

  const openEditDialog = useCallback(async (gId, item) => {
    setEditingItem(null);
    setEditingGroupId(null);
    if (gId === "unknown") {
      setEditingGroupId("unknown");
      setEditingItem({ ...item });
      return;
    }
    setIsEditDialogLoading(true);
    let enrichedItem = { ...item };
    const org = localStorage.getItem("organization_uuid") ?? "";
    const prj = localStorage.getItem("project_uuid") ?? "";
    const dev = getDeviceInfo();
    const isConcreteOrSteel = gId === "concrete" || gId === "steel";

    try {
      if (item.item_id) {
        try {
          const lineItemRes = await getLineItems({ organization_uuid: org, project_uuid: prj, document_id: selectedDoc?.document_id ?? "", item_id: item.item_id, device_info: dev });
          const detail = lineItemRes?.data ?? lineItemRes;
          if (detail && typeof detail === "object" && !Array.isArray(detail)) {
            const SKIP = new Set(["item_id", "pk_id", "id", "takeoff_id", "takeoff_name", "page_number", "line_order", "takeoff_order", "name", "valid", "message"]);
            Object.entries(detail).forEach(([k, v]) => { if (!SKIP.has(k)) enrichedItem[k] = v; });
            if (detail.product && typeof detail.product === "object") {
              enrichedItem.product_id = detail.product.id ?? enrichedItem.product_id;
              enrichedItem.__extractedProduct = { id: detail.product.id, code: detail.product.code, name: detail.product.name };
            }
          }
        } catch { /* non-critical */ }
      }

      if (item.takeoff_id) {
        try {
          if (isConcreteOrSteel) {
            const typesRes = await getTypesV2({ organization_uuid: org, takeoff_id: item.takeoff_id, device_info: dev });
            const typesArr = Array.isArray(typesRes?.data) ? typesRes.data : (Array.isArray(typesRes?.data?.types) ? typesRes.data.types : []);
            enrichedItem.__preloadedTypes = typesArr;

            const ELEM_TO_TYPE = { column: "column_pillar", stair: "stairs_landings" };
            if (enrichedItem.element_type) {
              enrichedItem.type_key = ELEM_TO_TYPE[enrichedItem.element_type] || enrichedItem.element_type;
            }

            const currentType = typesArr.find((t) => t.type_key === enrichedItem.element_type)
              || typesArr.find((t) => t.type_key === enrichedItem.type_key)
              || typesArr.find((t) => t.is_default)
              || typesArr[0];

            if (currentType) {
              enrichedItem.__resolvedTypeKey = currentType.type_key;
              const cfg = await getConfigV2({ organization_uuid: org, project_uuid: prj, takeoff_id: item.takeoff_id, type_id: currentType.id, device_info: dev });
              if (cfg?.data) enrichedItem.__preloadedConfig = cfg.data;
            }
          }
        } catch { /* non-critical */ }
      }
    } finally {
      setIsEditDialogLoading(false);
    }
    setEditingGroupId(gId);
    setEditingItem(enrichedItem);
  }, [selectedDoc]);

  const closeEditDialog = useCallback(() => { setEditingItem(null); setEditingGroupId(null); }, []);

  const handleItemAdded = useCallback(async () => {
    drawnPagesRef.current.add(currentPage);
    await fetchExtractionForPageSilent(currentPage, selectedDoc);
  }, [currentPage, selectedDoc, fetchExtractionForPageSilent]);

  const handleAddTradeItem = useCallback(() => {
    if (mtTradeEnabled === false) {
      handleUpgradeRequired("Upgrade your package to add trade categories.");
      return true;
    }
    return false;
  }, [mtTradeEnabled, handleUpgradeRequired]);

  const handleTakeoffInfoSaved = useCallback(() => {
    drawnPagesRef.current.add(currentPage);
    fetchEligibleTakeoffsForPage(currentPage, selectedDoc);
  }, [currentPage, selectedDoc, fetchEligibleTakeoffsForPage]);

  const handleToolChange = useCallback((t) => { setTool(t); setDraftPoints([]); }, []);
  const handleObjectTypeChange = useCallback((objType) => { setActiveObjectType(objType); setDraftPoints([]); }, []);

  const handleToolbarObjectTypeChange = useCallback((objType) => {
    setActiveObjectType(objType);
    setDraftPoints([]);
    if (objType === "cut_polygon") {
      setTool("polygon");
    } else if (objType === "cut_arc") {
      setTool("arc");
    } else if (objType === "cut_circle") {
      setTool("circle");
    } else if (objType === "arc") {
      setTool("arc");
    } else if (objType === "circle") {
      setTool("circle");
    } else if (objType === "symbol") {
      setTool("rectangle");
    } else if (objType) {
      setTool("polygon");
    }
  }, []);

  const deleteItem = useCallback(async (gk, pkId) => {
    const dataKey = GROUP_KEY_TO_DATA_KEY[gk] ?? `${gk}_data`;
    const groupVal = takeoffData?.[dataKey];
    const itemsArr = Array.isArray(groupVal) ? groupVal : (groupVal?.items ?? []);
    const targetItem = itemsArr.find((i) => (i.pk_id ?? i.item_id) === pkId);
    const detectionObjectKey = targetItem?.id ?? null;
    const itemObjectKeys = Array.isArray(targetItem?.object_keys) ? targetItem.object_keys : [];
    const allDetectionKeys = new Set([detectionObjectKey, ...itemObjectKeys].filter(Boolean));
    // Keys still referenced by OTHER remaining items — shapes with these keys must stay on canvas
    const sharedKeys = new Set();
    ALL_DATA_KEYS.forEach((dk) => {
      const gv = takeoffData?.[dk];
      const arr = Array.isArray(gv) ? gv : (gv?.items ?? []);
      arr.forEach((item) => {
        if ((item.pk_id ?? item.item_id) === pkId) return;
        if (item.id) sharedKeys.add(item.id);
        if (Array.isArray(item.object_keys)) item.object_keys.forEach((k) => sharedKeys.add(k));
      });
    });
    const safeToRemoveKeys = new Set([...allDetectionKeys].filter((k) => !sharedKeys.has(k)));
    setIsDeletingPkId(pkId);
    setIsDeleting(true);
    try {
      if (pkId) {
        const raw = await DeleteLineItem({
          organization_uuid: localStorage.getItem("organization_uuid") || "",
          project_uuid: localStorage.getItem("project_uuid") || "",
          item_id: pkId,
          device_info: getDeviceInfo(),
        });
        const res = raw?.valid !== undefined ? raw : (raw?.data?.valid !== undefined ? raw.data : { valid: false, message: "Unknown response" });
        if (!res.valid) { showToast("error", res.message); return; }
      }
      setTakeoffData((prev) => {
        if (!prev) return prev;
        const gv = prev[dataKey];
        const isNew = !Array.isArray(gv);
        const remaining = isNew
          ? (gv?.items ?? []).filter((i) => (i.pk_id ?? i.item_id) !== pkId)
          : gv.filter((i) => (i.pk_id ?? i.item_id) !== pkId);
        const updated = { ...prev, [dataKey]: isNew ? { ...gv, items: remaining } : remaining };
        const extractionBase = buildColorMapFromData(updated);
        const newColorMap = new Map(extractionBase);
        for (const [, pageMap] of Object.entries(perPageDetectionColorCache.current)) {
          applyDetectionEntries(newColorMap, pageMap);
        }
        colorMapRef.current = newColorMap;
        setColorMap(newColorMap);
        setAiDetectedShapes((s) => s.map((shape) => {
          const scopedKey = shape.pageNumber != null ? `${shape.takeoffId}_p${shape.pageNumber}` : null;
          const c = (scopedKey && newColorMap.get(scopedKey)) || newColorMap.get(shape.takeoffId);
          return c ? { ...shape, color: c } : shape;
        }));
        return updated;
      });
      if (safeToRemoveKeys.size > 0) {
        const itemPageNum = targetItem?.page_number != null ? Number(targetItem.page_number) : null;
        const itemPageIdx = itemPageNum != null ? itemPageNum - 1 : null;
        const preDeletedCanvasIds = new Set(
          aiDetectedShapes
            .filter((s) => {
              if (!safeToRemoveKeys.has(s.takeoffId) && !safeToRemoveKeys.has(s.id)) return false;
              if (itemPageIdx !== null) {
                return s.pageNumber != null ? s.pageNumber === itemPageNum : currentPage === itemPageIdx;
              }
              return s.pageNumber != null ? s.pageNumber === currentPage + 1 : true;
            })
            .map((s) => s.id)
        );
        setAiDetectedShapes((prev) => {
          const deletedCanvasIds = new Set(
            prev
              .filter((s) => {
                if (!safeToRemoveKeys.has(s.takeoffId) && !safeToRemoveKeys.has(s.id)) return false;
                if (itemPageIdx !== null) {
                  return s.pageNumber != null ? s.pageNumber === itemPageNum : currentPage === itemPageIdx;
                }
                return s.pageNumber != null ? s.pageNumber === currentPage + 1 : true;
              })
              .map((s) => s.id)
          );
          return prev.filter((s) => {
            const sameId = safeToRemoveKeys.has(s.takeoffId) || safeToRemoveKeys.has(s.id);
            const isCutChildOfDeleted = s.isCutShape && (
              safeToRemoveKeys.has(s.cutParentAreaId) ||
              deletedCanvasIds.has(s.cutParentAreaId) ||
              (s.cutParentTakeoffId && safeToRemoveKeys.has(s.cutParentTakeoffId))
            );
            if (!sameId && !isCutChildOfDeleted) return true;
            if (itemPageIdx !== null) {
              if (s.pageNumber != null) return s.pageNumber !== itemPageNum;
              return currentPage !== itemPageIdx;
            }
            if (s.pageNumber != null) return s.pageNumber !== currentPage + 1;
            return false;
          });
        });
        setShapes((prev) => {
          const next = prev; // setCurrentShapes equivalent — iterate pages
          const updatedShapes = {};
          Object.entries(next).forEach(([pageKey, pageShapes]) => {
            updatedShapes[pageKey] = pageShapes.filter((s) => !(s.isCutShape && (
              safeToRemoveKeys.has(s.cutParentAreaId) ||
              preDeletedCanvasIds.has(s.cutParentAreaId) ||
              (s.cutParentTakeoffId && safeToRemoveKeys.has(s.cutParentTakeoffId))
            )));
          });
          return updatedShapes;
        });
        setSelectedShapeId(null); setSelectedShapeIds(new Set()); setSelectedTakeoffId(null);
        const pagesToClean = itemPageIdx !== null ? [itemPageIdx] : [currentPage];
        pagesToClean.forEach((pageIdx) => {
          const cached = pageStore.current[pageIdx];
          if (!cached) return;
          safeToRemoveKeys.forEach((key) => {
            if (cached.area?.[key]) delete cached.area[key];
            if (cached.wall?.[key]) delete cached.wall[key];
            if (cached.pipeline?.[key]) delete cached.pipeline[key];
            if (cached.symbols) {
              const instanceMatch = key.match(/^(.+)-instance-(\d+)$/);
              if (instanceMatch) {
                const baseId = instanceMatch[1];
                const instanceIdx = parseInt(instanceMatch[2], 10);
                if (Array.isArray(cached.symbols[baseId])) {
                  cached.symbols[baseId].splice(instanceIdx, 1);
                  if (cached.symbols[baseId].length === 0) delete cached.symbols[baseId];
                }
              } else {
                if (cached.symbols[key]) delete cached.symbols[key];
              }
            }
          });
          delete pageStore.current[pageIdx];
          userExtractedPagesRef.current.delete(pageIdx);
          backendExtractedPagesRef.current.delete(pageIdx);
        });
      }
      setDeletingItemId(null);
    } catch (e) {
      showToast("error", e.message);
    } finally {
      setIsDeletingPkId(null);
      setIsDeleting(false);
      setExtractedPages((prev) => { const next = new Set(prev); next.delete(currentPage); return next; });
      extractedPagesRef.current.delete(currentPage);
      setTakeoffData((prev) => {
        const hasAnyData = prev && ALL_DATA_KEYS.some((k) => {
          const v = prev[k];
          const items = Array.isArray(v) ? v : (v?.items ?? []);
          return items.length > 0;
        });
        setAiExtractionComplete(!!hasAnyData);
        return prev;
      });
      setAiDetectedShapes((prev) => {
        const pageShapes = prev.filter((s) => s.pageNumber == null || s.pageNumber === currentPage + 1);
        if (pageShapes.length === 0) {
          setDetectedPages((dp) => { const next = new Set(dp); next.delete(currentPage); return next; });
          setAiRunPages((rp) => { const next = new Set(rp); next.delete(currentPage); return next; });
          setAiDetectionComplete(false);
          setManualDrawingPages((mp) => { const next = new Set(mp); next.delete(currentPage); return next; });
        }
        return prev;
      });
      const anyItemsRemainAfterDelete = ALL_DATA_KEYS.some((k) => {
        const v = takeoffDataRef.current?.[k];
        const items = Array.isArray(v) ? v : (v?.items ?? []);
        return items.some(
          (i) => i.page_number == null || Number(i.page_number) === currentPage + 1
        );
      });
      if (!anyItemsRemainAfterDelete) {
        setAiDetectedShapes((prev) =>
          prev.filter(
            (s) => s.pageNumber != null && s.pageNumber !== currentPage + 1
          )
        );
        setShapes((prev) => ({ ...prev, [currentPage]: [] }));
      }
    }
  }, [takeoffData, currentPage, aiDetectedShapes, selectedDoc]);

  const deleteGroup = useCallback(async (gk) => {
    const dataKey = GROUP_KEY_TO_DATA_KEY[gk] ?? `${gk}_data`;
    const groupVal = takeoffData?.[dataKey];
    const takeoffId = gk === "unknown"
      ? "unknown_data"
      : (Array.isArray(groupVal) ? groupVal[0]?.takeoff_id : groupVal?.takeoff_id ?? groupVal?.items?.[0]?.takeoff_id);
    const groupItems = Array.isArray(groupVal) ? groupVal : (groupVal?.items ?? []);
    const groupPageIndices = new Set(
      groupItems.map((i) => (i.page_number != null ? Number(i.page_number) - 1 : null)).filter((idx) => idx !== null)
    );
    if (groupPageIndices.size === 0) groupPageIndices.add(currentPage);
    const isUnknownCategory = gk === "unknown";

    const groupItemIds = new Set();
    groupItems.forEach((item) => {
      if (item.id) groupItemIds.add(item.id);
      if (Array.isArray(item.object_keys)) item.object_keys.forEach((k) => groupItemIds.add(k));
    });
    const sharedGroupIds = new Set();
    ALL_DATA_KEYS.forEach((dk) => {
      if (dk === dataKey) return;
      const gv = takeoffData?.[dk];
      const arr = Array.isArray(gv) ? gv : (gv?.items ?? []);
      arr.forEach((item) => {
        if (item.id) sharedGroupIds.add(item.id);
        if (Array.isArray(item.object_keys)) item.object_keys.forEach((k) => sharedGroupIds.add(k));
      });
    });
    const safeToRemoveGroupIds = new Set([...groupItemIds].filter((id) => !sharedGroupIds.has(id)));

    setIsDeletingGroup(gk);
    setIsDeleting(true);

    try {
      if (takeoffId || isUnknownCategory) {
        const deletePayload = {
          organization_uuid: localStorage.getItem("organization_uuid") || "",
          project_uuid: localStorage.getItem("project_uuid") || "",
          document_id: selectedDoc?.document_id ?? "",
          device_info: getDeviceInfo(),
        };
        if (takeoffId) deletePayload.takeoff_id = takeoffId;
        const raw = await DeleteLineCategory(deletePayload);
        const res = raw?.valid !== undefined ? raw : (raw?.data?.valid !== undefined ? raw.data : { valid: false, message: "Unknown response" });
        if (!res.valid) { showToast("error", res.message); return; }
        showToast("success", res.message);
      }
      setTakeoffData((prev) => {
        if (!prev) return prev;
        const next = { ...prev };
        next[dataKey] = Array.isArray(groupVal)
          ? []
          : { ...(typeof groupVal === "object" ? groupVal : {}), items: [] };
        const extractionBase = buildColorMapFromData(next);
        const newColorMap = new Map(extractionBase);
        for (const [, pageMap] of Object.entries(perPageDetectionColorCache.current)) {
          applyDetectionEntries(newColorMap, pageMap);
        }
        colorMapRef.current = newColorMap;
        setColorMap(newColorMap);
        return next;
      });
      setAiDetectedShapes((prev) =>
        prev.filter((s) => {
          if (!safeToRemoveGroupIds.has(s.takeoffId)) return true;
          if (s.pageNumber != null) return !groupPageIndices.has(s.pageNumber - 1);
          return !groupPageIndices.has(currentPage);
        })
      );
      setSelectedShapeId(null); setSelectedShapeIds(new Set()); setSelectedTakeoffId(null);
      groupPageIndices.forEach((pageIdx) => {
        const cached = pageStore.current[pageIdx];
        if (cached) {
          safeToRemoveGroupIds.forEach((id) => {
            if (cached.area) delete cached.area[id];
            if (cached.wall) delete cached.wall[id];
            if (cached.pipeline) delete cached.pipeline[id];
            if (cached.symbols) delete cached.symbols[id];
          });
          if (takeoffId && !sharedGroupIds.has(takeoffId)) {
            if (cached.area) delete cached.area[takeoffId];
            if (cached.wall) delete cached.wall[takeoffId];
            if (cached.pipeline) delete cached.pipeline[takeoffId];
            if (cached.symbols) delete cached.symbols[takeoffId];
          }
          if (sharedGroupIds.size === 0) delete pageStore.current[pageIdx];
        }
        userExtractedPagesRef.current.delete(pageIdx);
        backendExtractedPagesRef.current.delete(pageIdx);
      });
      setDeletingGroupId(null);
    } catch (e) {
      showToast("error", e.message);
    } finally {
      setIsDeletingGroup(null);
      setIsDeleting(false);
      groupPageIndices.forEach((pageIdx) => {
        setExtractedPages((prev) => { const next = new Set(prev); next.delete(pageIdx); return next; });
        extractedPagesRef.current.delete(pageIdx);
      });
      setTakeoffData((prev) => {
        const hasAnyData = prev && ALL_DATA_KEYS.some((k) => {
          const v = prev[k];
          const items = Array.isArray(v) ? v : (v?.items ?? []);
          return items.length > 0;
        });
        setAiExtractionComplete(!!hasAnyData);
        return prev;
      });
      setAiDetectedShapes((prev) => {
        groupPageIndices.forEach((pageIdx) => {
          const pageShapes = prev.filter((s) => s.pageNumber == null || s.pageNumber === pageIdx + 1);
          if (pageShapes.length === 0) {
            setDetectedPages((dp) => { const next = new Set(dp); next.delete(pageIdx); return next; });
            setAiRunPages((rp) => { const next = new Set(rp); next.delete(pageIdx); return next; });
            if (pageIdx === currentPage) setAiDetectionComplete(false);
            setManualDrawingPages((mp) => { const next = new Set(mp); next.delete(pageIdx); return next; });
          }
        });
        return prev;
      });
      const otherDataKeys = ALL_DATA_KEYS.filter((k) => k !== dataKey);
      groupPageIndices.forEach((pageIdx) => {
        const anyItemsRemain = otherDataKeys.some((k) => {
          const v = takeoffDataRef.current?.[k];
          const items = Array.isArray(v) ? v : (v?.items ?? []);
          return items.some(
            (i) => i.page_number == null || Number(i.page_number) === pageIdx + 1
          );
        });
        if (!anyItemsRemain) {
          setAiDetectedShapes((prev) =>
            prev.filter(
              (s) => s.pageNumber != null && s.pageNumber !== pageIdx + 1
            )
          );
          setShapes((prev) => ({ ...prev, [pageIdx]: [] }));
          setDetectedPages((dp) => { const next = new Set(dp); next.delete(pageIdx); return next; });
          setAiRunPages((rp) => { const next = new Set(rp); next.delete(pageIdx); return next; });
          if (pageIdx === currentPage) setAiDetectionComplete(false);
          setManualDrawingPages((mp) => { const next = new Set(mp); next.delete(pageIdx); return next; });
        }
      });
    }
  }, [takeoffData, selectedDoc, currentPage]);

  return {
    handleTakeoffUpdate,
    toggleItemVisibility,
    toggleGroupExpand,
    handleLineItemClick,
    openEditDialog,
    closeEditDialog,
    handleItemAdded,
    handleAddTradeItem,
    handleTakeoffInfoSaved,
    handleToolChange,
    handleObjectTypeChange,
    handleToolbarObjectTypeChange,
    deleteItem,
    deleteGroup,
  };
}
