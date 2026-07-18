// ─── useTakeoffAIHandlers.js ──────────────────────────────────────────────────
// Extracts AI detection / extraction / estimation callbacks from TakeoffWorkspace.
// All logic is identical to the original useCallback bodies — only moved here.

import { useCallback } from "react";
import {
  saveDetectionObjects, resetPage, getPageDetection,
  addAiExtraction, getAiExtraction, getEligibleTakeoffs,
  GetTakeoffCategories, ProceedToEstimation,
} from "../../../../services/techus-services";
import { showToast } from "../../../../genriccomponents/techus-ToastNotification";
import { getDeviceInfo } from "../../../../utils/getDeviceInfo";
import {
  buildColorMapFromData, buildShapesFromDetectionResponse, buildDetectionColorMap,
  parseExtractionResponse, unwrapRes, applyCutRelationships, applyDetectionEntries,
} from "./TakeoffWorkspace.utils";
import { ALL_DATA_KEYS } from "./TakeoffWorkspace.constants";

export function useTakeoffAIHandlers({
  // stable refs (no need in useCallback deps)
  pageStore, activePageRequestRef, perPageDetectionColorCache, colorMapRef, takeoffDataRef,
  extractedPagesRef, drawnPagesRef, userExtractedPagesRef, backendExtractedPagesRef,
  manualPageExtractionClearedRef, selectedDocRef, canvasPanelRef,
  eligibleTakeoffsPageRef, takeoffCategoriesRef, currentShapesRef,
  // state values (change per render — list in useCallback deps when needed)
  selectedDoc, currentPage, detectedPages, manualDrawingPages, shapes, aiDetectedShapes,
  pageEligibleTakeoffs, extractionResetByRerun, selectedScale,
  takeoffData, extractedPages, pendingProceedPayload, aiRunPages,
  // setters (stable — no need in deps)
  setIsProcessing, setAiDetectedShapes, setShapes, setDetectedPages, setAiRunPages,
  setManualDrawingPages, setExtractedPages, setAiDetectionComplete, setAiExtractionComplete,
  setAiDetectionRan, setTakeoffData, setColorMap, setConfirmModal, setShowAIDetectionModal,
  setPageEligibleTakeoffs, setEligibleTakeoffsRes, setShowOtherTradesModal, setNonEligibleTrades,
  setNonEligibleStagingId, setShowProceedConfirm, setProceedConfirmMessage, setPendingProceedPayload,
  setHiddenIds, setSelectedShapeId, setSelectedShapeIds, setSelectedTakeoffId, setSidebarCollapsed,
  setDrawnSinceExtractionPages, setExpandedGroups, setExtractionResetByRerun, setCurrentShapes,
  setTool, setActiveObjectType, setDraftPoints,
  // stable callbacks
  guardAction, navigate, unlockEstimation,
}) {
  const fetchTakeoffCategories = useCallback(async () => {
    if (takeoffCategoriesRef.current) return;
    try {
      const res = await GetTakeoffCategories();
      takeoffCategoriesRef.current = res;
    } catch (e) {
      console.error("[fetchTakeoffCategories]", e);
    }
  }, []);

  const fetchEligibleTakeoffsForPage = useCallback(async (pageIdx, doc) => {
    if (!doc) return;
    try {
      const res = await getEligibleTakeoffs({
        organization_uuid: localStorage.getItem("organization_uuid") ?? "",
        project_uuid: localStorage.getItem("project_uuid") ?? "",
        document_id: doc.document_id,
        page_number: pageIdx + 1,
        device_info: getDeviceInfo(),
      });
      let parsed = res;
      if (typeof parsed === "string") { try { parsed = JSON.parse(parsed); } catch { parsed = {}; } }
      const list = parsed?.eligible_takeoffs ?? [];
      setPageEligibleTakeoffs(list);
      setEligibleTakeoffsRes(parsed);
      eligibleTakeoffsPageRef.current = pageIdx;
    } catch (e) {
      console.error("[fetchEligibleTakeoffsForPage]", e);
      setPageEligibleTakeoffs([]);
    }
  }, []);

  const fetchDetectionForPage = useCallback(async (pageIdx, doc, silent = false, requestId = null, markAsRan = false) => {
    if (!doc || !pageStore.current) return;
    // Capture the store reference at call time. If the document switches mid-flight,
    // the reset replaces pageStore.current with a new object, making this check fail
    // and preventing stale PDF data from being written into the new document's cache.
    const myStore = pageStore.current;
    const isStoreStillValid = () => pageStore.current === myStore;

    const pageNum = pageIdx + 1;

    const isStillActivePageRequest = () => {
      if (requestId == null) return true;
      return activePageRequestRef.current === requestId;
    };

    function buildMergedColorMap(detectionMapForThisPage) {
      const merged = buildColorMapFromData(takeoffDataRef.current);
      for (const [, pageMap] of Object.entries(perPageDetectionColorCache.current)) {
        applyDetectionEntries(merged, pageMap);
      }
      if (detectionMapForThisPage) applyDetectionEntries(merged, detectionMapForThisPage);
      return merged;
    }

    const cached = myStore[pageIdx];
    if (cached) {
      const rawDetectionMap = buildDetectionColorMap(cached, pageNum);
      perPageDetectionColorCache.current[pageIdx] = rawDetectionMap;
      const finalMap = buildMergedColorMap(rawDetectionMap);
      if (!isStillActivePageRequest() || !isStoreStillValid()) return;
      setColorMap(finalMap);
      colorMapRef.current = finalMap;
      const freshAiShapes = applyCutRelationships(buildShapesFromDetectionResponse(cached, finalMap, pageNum));
      setAiDetectedShapes(freshAiShapes);
      const incomingCutIds = new Set(freshAiShapes.filter((s) => s.isCutShape).map((s) => s.takeoffId));
      if (incomingCutIds.size > 0) {
        setShapes((prev) => {
          const pageCurrent = prev[pageIdx] || [];
          const withoutSuperseded = pageCurrent.filter(
            (s) => !(s.isCutShape && incomingCutIds.has(s.takeoffId))
          );
          if (withoutSuperseded.length === pageCurrent.length) return prev;
          return { ...prev, [pageIdx]: withoutSuperseded };
        });
      }
      setAiDetectionComplete(true);
      setDetectedPages((prev) => new Set([...prev, pageIdx]));
      return;
    }

    if (!silent && isStillActivePageRequest()) {
      setAiDetectedShapes([]);
      setAiDetectionComplete(false);
    }

    try {
      const payload = {
        organization_uuid: localStorage.getItem("organization_uuid") ?? "",
        project_uuid: localStorage.getItem("project_uuid") ?? "",
        document_id: doc.document_id,
        page_number: pageNum,
      };
      const rawRes = await getPageDetection(payload);
      if (!isStillActivePageRequest() || !isStoreStillValid()) return;

      let parsed;
      if (rawRes == null) return;
      if (typeof rawRes === "string") { try { parsed = JSON.parse(rawRes); } catch { return; } }
      else if (typeof rawRes === "object" && "valid" in rawRes) parsed = rawRes;
      else if (typeof rawRes === "object" && rawRes.data) {
        parsed = typeof rawRes.data === "string" ? JSON.parse(rawRes.data) : rawRes.data;
      } else return;

      if (!parsed?.valid || !parsed?.data) return;
      const detectionData = parsed.data;
      if (!detectionData || typeof detectionData !== "object") return;

      const hasData =
        Object.keys(detectionData.area || {}).length > 0 ||
        Object.keys(detectionData.wall || {}).length > 0 ||
        Object.keys(detectionData.symbols || {}).length > 0 ||
        Object.keys(detectionData.pipeline || {}).length > 0;

      if (!hasData) {
        if (isStillActivePageRequest() && isStoreStillValid()) { setAiDetectedShapes([]); setAiDetectionComplete(false); }
        return;
      }

      if (!isStoreStillValid()) return;
      myStore[pageIdx] = detectionData;
      const rawDetectionMap = buildDetectionColorMap(detectionData, pageNum);
      perPageDetectionColorCache.current[pageIdx] = rawDetectionMap;
      const finalMap = buildMergedColorMap(rawDetectionMap);
      if (!isStillActivePageRequest() || !isStoreStillValid()) return;

      setColorMap(finalMap);
      colorMapRef.current = finalMap;
      const freshAiShapes = applyCutRelationships(buildShapesFromDetectionResponse(detectionData, finalMap, pageNum));
      setAiDetectedShapes(freshAiShapes);
      const incomingCutIds = new Set(freshAiShapes.filter((s) => s.isCutShape).map((s) => s.takeoffId));
      if (incomingCutIds.size > 0) {
        setShapes((prev) => {
          const pageCurrent = prev[pageIdx] || [];
          const withoutSuperseded = pageCurrent.filter(
            (s) => !(s.isCutShape && incomingCutIds.has(s.takeoffId))
          );
          if (withoutSuperseded.length === pageCurrent.length) return prev;
          return { ...prev, [pageIdx]: withoutSuperseded };
        });
      }
      setAiDetectionComplete(true);
      if (markAsRan) setAiDetectionRan(true);
      setDetectedPages((prev) => new Set([...prev, pageIdx]));
    } catch (err) {
      console.error("fetchDetectionForPage error:", err);
    }
  }, []);

  const fetchExtractionForPageSilent = useCallback(async (pageIdx, doc, requestId = null) => {
    if (!doc) return;
    const fetchingForDocId = doc.document_id;
    const isStillActivePageRequest = () => {
      if (requestId == null) return true;
      return activePageRequestRef.current === requestId;
    };
    try {
      const raw = await getAiExtraction({
        organization_uuid: localStorage.getItem("organization_uuid"),
        project_uuid: localStorage.getItem("project_uuid"),
        document_id: doc.document_id,
        page_number: pageIdx + 1,
      });
      if (!isStillActivePageRequest()) return;
      const parsed = parseExtractionResponse(raw);
      if (!parsed) return;

      const hasItemsForThisPage = ALL_DATA_KEYS.some((k) => {
        const val = parsed[k];
        const items = Array.isArray(val) ? val : (val?.items ?? []);
        return items.some((i) =>
          i.page_number == null || Number(i.page_number) === pageIdx + 1
        );
      });

      if (hasItemsForThisPage) {
        backendExtractedPagesRef.current.add(pageIdx);
        extractedPagesRef.current.add(pageIdx);
        setExtractedPages((prev) => new Set([...prev, pageIdx]));
      }
      // Persist flag if the API returned ANY extraction data (may include other pages),
      // so the Proceed button stays enabled after navigation away and back.
      const hasAnyItems = ALL_DATA_KEYS.some((k) => {
        const val = parsed[k];
        return (Array.isArray(val) ? val : (val?.items ?? [])).length > 0;
      });
      if (hasAnyItems) {
        try { sessionStorage.setItem(`prexo_extracted_${doc.document_id}`, '1'); } catch { /* ignore */ }
      }

      setTakeoffData((prev) => {
        if (!isStillActivePageRequest()) return prev;
        if (selectedDocRef.current?.document_id !== fetchingForDocId) return prev;

        const next = { ...prev };
        ALL_DATA_KEYS.forEach((key) => {
          const freshVal = parsed[key];
          const prevVal = prev[key];
          const prevItems = Array.isArray(prevVal) ? prevVal : (prevVal?.items ?? []);
          const otherPageItems = prevItems.filter((i) => {
            if (i.page_number == null) return true;
            return Number(i.page_number) !== pageIdx + 1;
          });
          if (!freshVal) {
            next[key] = Array.isArray(prevVal)
              ? otherPageItems
              : { ...(prevVal ?? {}), items: otherPageItems };
          } else {
            const freshItems = Array.isArray(freshVal) ? freshVal : (freshVal.items ?? []);
            const freshPkIds = new Set(freshItems.map((i) => i.pk_id ?? i.item_id).filter((id) => id != null));
            const safeOtherItems = otherPageItems.filter((i) => {
              const pk = i.pk_id ?? i.item_id;
              return pk == null || !freshPkIds.has(pk);
            });
            const merged = [...safeOtherItems, ...freshItems];
            if (!Array.isArray(freshVal)) {
              const prevMeta = Array.isArray(prevVal) ? {} : (prevVal ?? {});
              next[key] = { ...prevMeta, takeoff_id: freshVal.takeoff_id ?? prevMeta.takeoff_id ?? null, takeoff_order: freshVal.takeoff_order ?? prevMeta.takeoff_order ?? null, items: merged };
            } else {
              next[key] = Array.isArray(prevVal) ? merged : { ...(prevVal ?? {}), items: merged };
            }
          }
        });

        const extractionColorMap = buildColorMapFromData(next);
        const finalColorMap = new Map(extractionColorMap);
        for (const [, pageMap] of Object.entries(perPageDetectionColorCache.current)) {
          applyDetectionEntries(finalColorMap, pageMap);
        }
        colorMapRef.current = finalColorMap;
        setColorMap(finalColorMap);
        setAiDetectedShapes((prevShapes) =>
          prevShapes.map((shape) => {
            if (shape.pageNumber != null && shape.pageNumber !== pageIdx + 1) return shape;
            // Always prefer the detection cache so extraction can never re-color canvas shapes.
            // The extraction color map is authoritative for sidebar (colorMap) but not for canvas.
            const detMap = perPageDetectionColorCache.current[pageIdx];
            const newColor = detMap
              ? (detMap.get(`${shape.takeoffId}_p${pageIdx + 1}`) || detMap.get(shape.takeoffId))
              : (finalColorMap.get(`${shape.takeoffId}_p${pageIdx + 1}`) || finalColorMap.get(shape.takeoffId));
            return newColor ? { ...shape, color: newColor } : shape;
          })
        );
        return next;
      });
    } catch (e) {
      console.error(`fetchExtractionForPageSilent page ${pageIdx + 1}:`, e);
    }
  }, []);

  const replaceExtractionForPage = useCallback(async (pageIdx, doc) => {
    if (!doc) return;
    try {
      const raw = await getAiExtraction({
        organization_uuid: localStorage.getItem("organization_uuid"),
        project_uuid: localStorage.getItem("project_uuid"),
        document_id: doc.document_id,
        page_number: pageIdx + 1,
      });
      const parsed = parseExtractionResponse(raw);
      const freshPageData = parsed ?? {};
      const hasItems = ALL_DATA_KEYS.some((k) => {
        const val = freshPageData[k];
        const items = Array.isArray(val) ? val : (val?.items ?? []);
        return items.length > 0;
      });
      setTakeoffData((prev) => {
        const next = { ...prev };
        ALL_DATA_KEYS.forEach((key) => {
          const freshVal = freshPageData[key];
          const prevVal = prev[key];
          const prevItems = Array.isArray(prevVal) ? prevVal : (prevVal?.items ?? []);
          const otherPageItems = prevItems.filter((i) => {
            if (i.page_number == null) return true;
            return Number(i.page_number) !== pageIdx + 1;
          });
          if (!freshVal) {
            next[key] = Array.isArray(prevVal) ? otherPageItems : { ...(prevVal ?? {}), items: otherPageItems };
          } else {
            const freshItems = Array.isArray(freshVal) ? freshVal : (freshVal.items ?? []);
            const freshPkIds = new Set(freshItems.map((i) => i.pk_id ?? i.item_id).filter((id) => id != null));
            const deduplicatedOtherItems = otherPageItems.filter((i) => {
              const pkId = i.pk_id ?? i.item_id;
              if (pkId != null && freshPkIds.has(pkId)) return false;
              return true;
            });
            const merged = [...deduplicatedOtherItems, ...freshItems];
            if (!Array.isArray(freshVal)) {
              const prevMeta = Array.isArray(prevVal) ? {} : (prevVal ?? {});
              next[key] = { ...prevMeta, takeoff_id: freshVal.takeoff_id ?? prevMeta.takeoff_id ?? null, takeoff_order: freshVal.takeoff_order ?? prevMeta.takeoff_order ?? null, items: merged };
            } else {
              next[key] = Array.isArray(prevVal) ? merged : { ...(prevVal ?? {}), items: merged };
            }
          }
        });
        const newColorMap = buildColorMapFromData(next);
        const finalColorMap = new Map(newColorMap);
        for (const [, pageMap] of Object.entries(perPageDetectionColorCache.current)) {
          applyDetectionEntries(finalColorMap, pageMap);
        }
        colorMapRef.current = finalColorMap;
        setColorMap(finalColorMap);
        setAiDetectedShapes((prevShapes) =>
          prevShapes.map((shape) => {
            if (shape.pageNumber != null && shape.pageNumber !== pageIdx + 1) return shape;
            // Always prefer the detection cache so extraction can never re-color canvas shapes.
            // The extraction color map is authoritative for sidebar (colorMap) but not for canvas.
            const detMap = perPageDetectionColorCache.current[pageIdx];
            const newColor = detMap
              ? (detMap.get(`${shape.takeoffId}_p${pageIdx + 1}`) || detMap.get(shape.takeoffId))
              : (finalColorMap.get(`${shape.takeoffId}_p${pageIdx + 1}`) || finalColorMap.get(shape.takeoffId));
            return newColor ? { ...shape, color: newColor } : shape;
          })
        );
        return next;
      });
      if (hasItems) {
        extractedPagesRef.current.add(pageIdx);
        setExtractedPages((prev) => new Set([...prev, pageIdx]));
        try { sessionStorage.setItem(`prexo_extracted_${doc.document_id}`, '1'); } catch { /* ignore */ }
      }
    } catch (e) {
      console.error(`replaceExtractionForPage page ${pageIdx + 1}:`, e);
    }
  }, []);

  const runAIDetection = useCallback(async () => {
    if (!selectedDoc) return;

    const runDetection = async ({ isRerun = false } = {}) => {
      setHiddenIds(new Set());
      setSelectedShapeId(null); setSelectedShapeIds(new Set()); setSelectedTakeoffId(null);
      setIsProcessing(true);
      try {
        const payload = {
          organization_uuid: localStorage.getItem("organization_uuid"),
          project_uuid: localStorage.getItem("project_uuid"),
          document_id: selectedDoc.document_id,
          page_number: currentPage + 1,
        };
        const raw = await saveDetectionObjects(payload);
        const res = unwrapRes(raw);

        if (isRerun) {
          setCurrentShapes((prev) => prev.filter((s) => !s.isCutShape));
          setAiDetectedShapes((prev) => prev.filter((s) => !s.isCutShape));

          if (pageStore.current) delete pageStore.current[currentPage];
          setAiDetectedShapes([]);
          setAiExtractionComplete(false);
          setExtractedPages((prev) => { const next = new Set(prev); next.delete(currentPage); return next; });
          extractedPagesRef.current.delete(currentPage);
          userExtractedPagesRef.current.delete(currentPage);
          backendExtractedPagesRef.current.delete(currentPage);
          setTakeoffData((prev) => {
            const next = { ...prev };
            ALL_DATA_KEYS.forEach((key) => {
              const val = next[key];
              if (!val) return;
              const isNew = !Array.isArray(val);
              const items = isNew ? (val?.items ?? []) : val;
              const kept = items.filter((i) => i.page_number != null && Number(i.page_number) !== currentPage + 1);
              next[key] = isNew ? { ...val, items: kept } : kept;
            });
            const freshMap = buildColorMapFromData(next);
            for (const [, pageMap] of Object.entries(perPageDetectionColorCache.current)) {
              applyDetectionEntries(freshMap, pageMap);
            }
            colorMapRef.current = freshMap;
            setColorMap(freshMap);
            return next;
          });

          setManualDrawingPages((prev) => {
            const next = new Set(prev);
            next.delete(currentPage);
            return next;
          });

          let attempts = 0;
          const MAX_ATTEMPTS = 10;
          const POLL_INTERVAL = 1500;
          const pollForFreshDetection = async () => {
            while (attempts < MAX_ATTEMPTS) {
              attempts++;
              const pollPayload = {
                organization_uuid: localStorage.getItem("organization_uuid") ?? "",
                project_uuid: localStorage.getItem("project_uuid") ?? "",
                document_id: selectedDoc.document_id,
                page_number: currentPage + 1,
              };
              const pollRaw = await getPageDetection(pollPayload);
              let pollParsed;
              if (pollRaw == null) { /* no data yet */ }
              else if (typeof pollRaw === "string") { try { pollParsed = JSON.parse(pollRaw); } catch { /* ignore */ } }
              else if (typeof pollRaw === "object" && "valid" in pollRaw) pollParsed = pollRaw;
              else if (typeof pollRaw === "object" && pollRaw.data) {
                try { pollParsed = typeof pollRaw.data === "string" ? JSON.parse(pollRaw.data) : pollRaw.data; }
                catch { pollParsed = pollRaw.data; }
              }
              if (pollParsed?.valid && pollParsed?.data) {
                const d = pollParsed.data;
                const hasData =
                  Object.keys(d.area || {}).length > 0 ||
                  Object.keys(d.wall || {}).length > 0 ||
                  Object.keys(d.symbols || {}).length > 0 ||
                  Object.keys(d.pipeline || {}).length > 0;
                if (hasData) {
                  pageStore.current[currentPage] = d;
                  const rawDetectionMap = buildDetectionColorMap(d, currentPage + 1);
                  perPageDetectionColorCache.current[currentPage] = rawDetectionMap;
                  const mergedMap = buildColorMapFromData(takeoffDataRef.current);
                  for (const [, pm] of Object.entries(perPageDetectionColorCache.current)) {
                    applyDetectionEntries(mergedMap, pm);
                  }
                  setColorMap(mergedMap);
                  colorMapRef.current = mergedMap;
                  setAiDetectedShapes(applyCutRelationships(buildShapesFromDetectionResponse(d, mergedMap, currentPage + 1)));
                  setAiDetectionComplete(true);
                  setAiDetectionRan(true);
                  setAiRunPages((prev) => new Set([...prev, currentPage]));
                  setExtractionResetByRerun(true);
                  setDetectedPages((prev) => new Set([...prev, currentPage]));
                  return true;
                }
              }
              if (attempts < MAX_ATTEMPTS) await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL));
            }
            await fetchDetectionForPage(currentPage, selectedDoc, false, null, true);
            return false;
          };
          await pollForFreshDetection();
          await fetchExtractionForPageSilent(currentPage, selectedDoc);
          drawnPagesRef.current.add(currentPage);
        } else {
          if (pageStore.current) delete pageStore.current[currentPage];
          await fetchDetectionForPage(currentPage, selectedDoc, false, null, true);
          setAiRunPages((prev) => new Set([...prev, currentPage]));
          setManualDrawingPages((prev) => {
            const next = new Set(prev);
            next.delete(currentPage);
            return next;
          });
          drawnPagesRef.current.delete(currentPage);
        }
        showToast(res?.valid ? "success" : "error", res?.message || (res?.valid ? "Detection complete" : "Detection failed"));
      } catch (e) {
        console.error("[AI Detection] Error:", e);
        showToast("error", e.message);
      } finally { setIsProcessing(false); }
    };

    if (detectedPages.has(currentPage) || manualDrawingPages.has(currentPage)) {
      setConfirmModal({
        type: (detectedPages.has(currentPage) && !manualDrawingPages.has(currentPage)) || aiRunPages.has(currentPage)
          ? "detection"
          : "detection_manual_only",
        onConfirm: async () => { setConfirmModal(null); await runDetection({ isRerun: true }); },
      });
      return;
    }
    await runDetection({ isRerun: false });
  }, [selectedDoc, currentPage, detectedPages, manualDrawingPages, aiRunPages, fetchDetectionForPage, fetchExtractionForPageSilent]);

  const handleResetTakeoff = useCallback(async () => {
    if (!selectedDoc) return;
    const prevTakeoffData = takeoffData;
    const prevDetectedPages = new Set(detectedPages);
    const prevExtractedPages = new Set(extractedPages);
    const prevDetectionShapes = aiDetectedShapes;
    const prevPageStore = pageStore.current ? { ...pageStore.current } : null;

    setAiDetectedShapes([]);
    setAiDetectionRan(false);
    if (pageStore.current) delete pageStore.current[currentPage];
    setSelectedShapeId(null);
    setSelectedShapeIds(new Set());
    setSelectedTakeoffId(null);

    setTakeoffData((prev) => {
      const next = { ...prev };
      ALL_DATA_KEYS.forEach((key) => {
        const val = next[key];
        if (!val) return;
        const isNew = !Array.isArray(val);
        const items = isNew ? (val?.items ?? []) : val;
        const kept = items.filter((i) => i.page_number != null && Number(i.page_number) !== currentPage + 1);
        next[key] = isNew ? { ...val, items: kept } : kept;
      });
      return next;
    });

    setDetectedPages((prev) => { const next = new Set(prev); next.delete(currentPage); return next; });
    setAiRunPages((prev) => { const next = new Set(prev); next.delete(currentPage); return next; });
    setExtractedPages((prev) => { const next = new Set(prev); next.delete(currentPage); return next; });
    extractedPagesRef.current.delete(currentPage);
    userExtractedPagesRef.current?.delete(currentPage);
    backendExtractedPagesRef.current?.delete(currentPage);
    setAiDetectionComplete(false);
    setAiDetectionRan(false);
    setAiExtractionComplete(false);
    setDrawnSinceExtractionPages((prev) => { const next = new Set(prev); next.delete(currentPage); return next; });
    setExtractionResetByRerun(false);

    setManualDrawingPages((prev) => {
      const next = new Set(prev);
      next.delete(currentPage);
      return next;
    });
    manualPageExtractionClearedRef.current.delete(currentPage);

    setShapes((prev) => {
      const pageCurrent = prev[currentPage] || [];
      const withoutCuts = pageCurrent.filter((s) => !s.isCutShape);
      currentShapesRef.current = withoutCuts;
      return { ...prev, [currentPage]: withoutCuts };
    });

    try {
      await resetPage({
        organization_uuid: localStorage.getItem("organization_uuid") ?? "",
        project_uuid: localStorage.getItem("project_uuid") ?? "",
        document_id: selectedDoc.document_id,
        page_number: currentPage + 1,
        device_info: getDeviceInfo(),
      });
    } catch (err) {
      console.error("Reset takeoff failed:", err);
      setAiDetectedShapes(prevDetectionShapes);
      if (pageStore.current && prevPageStore) pageStore.current = prevPageStore;
      setTakeoffData(prevTakeoffData);
      setDetectedPages(prevDetectedPages);
      setExtractedPages(prevExtractedPages);
      setAiDetectionComplete(prevDetectedPages.has(currentPage));
      setAiExtractionComplete(prevExtractedPages.has(currentPage));
      setManualDrawingPages((prev) => new Set([...prev, currentPage]));
    }
  }, [selectedDoc, currentPage, takeoffData, detectedPages, extractedPages, aiDetectedShapes]);

  const handleAIDetection = useCallback(async () => {
    if (!selectedDoc) return;
    if (guardAction("ai_detection", "AI Detection")) return;
    setTool("select"); setActiveObjectType(null); setDraftPoints([]);
    setSelectedShapeId(null); setSelectedShapeIds(new Set());
    canvasPanelRef.current?.clearDraftState?.();

    const hasShapesOnCurrentPage =
      (shapes[currentPage] || []).some((s) => !s.__pending) ||
      aiDetectedShapes.some(
        (s) => s.pageNumber == null || s.pageNumber === currentPage + 1
      );

    if (
      detectedPages.has(currentPage) ||
      (manualDrawingPages.has(currentPage) && hasShapesOnCurrentPage)
    ) {
      await runAIDetection();
      return;
    }
    if (eligibleTakeoffsPageRef.current !== currentPage) {
      await fetchEligibleTakeoffsForPage(currentPage, selectedDoc);
    }
    if (pageEligibleTakeoffs.length === 0) { setShowAIDetectionModal(true); return; }
    await runAIDetection();
  }, [selectedDoc, guardAction, detectedPages, currentPage, pageEligibleTakeoffs, manualDrawingPages, shapes, aiDetectedShapes, runAIDetection, fetchEligibleTakeoffsForPage]);

  const handleDetectAfterModalSave = useCallback(async (savedEligibleList) => {
    const list = savedEligibleList ?? [];
    setPageEligibleTakeoffs(list);
    setEligibleTakeoffsRes((prev) => ({ ...(prev ?? {}), eligible_takeoffs: list }));
    eligibleTakeoffsPageRef.current = currentPage;
    await runAIDetection();
  }, [runAIDetection, currentPage]);

  const handleAIExtraction = useCallback(async () => {
    if (!selectedDoc) return;
    if (guardAction("ai_extraction", "AI Extraction")) return;
    setTool("select"); setActiveObjectType(null); setDraftPoints([]);
    setHiddenIds(new Set());
    setSelectedShapeId(null); setSelectedShapeIds(new Set()); setSelectedTakeoffId(null);
    const alreadyExtracted = extractedPagesRef.current.has(currentPage);
    if (alreadyExtracted && !drawnPagesRef.current.has(currentPage) && !extractionResetByRerun) {
      showToast("warning", `AI Extraction already run on page ${currentPage + 1}.`);
      return;
    }
    setIsProcessing(true);
    try {
      const base = {
        organization_uuid: localStorage.getItem("organization_uuid"),
        project_uuid: localStorage.getItem("project_uuid"),
        document_id: selectedDoc.document_id,
        page_number: currentPage + 1,
        scale: selectedScale,
        device_info: getDeviceInfo(),
      };
      const raw = await addAiExtraction(base);
      const res = unwrapRes(raw);
      setSidebarCollapsed(false);
      showToast(res?.valid ? "success" : "error", res?.message || (res?.valid ? "Extraction started" : "Extraction failed"));

      if (res?.valid !== false) {
        const nonEligible = res?.non_eligible_trades;
        if (Array.isArray(nonEligible) && nonEligible.length > 0) {
          setNonEligibleTrades(nonEligible);
          setNonEligibleStagingId(res?.staging_id ?? null);
          setShowOtherTradesModal(true);
          userExtractedPagesRef.current.add(currentPage);
          backendExtractedPagesRef.current.add(currentPage);
          extractedPagesRef.current.add(currentPage);
          setExtractedPages((prev) => new Set([...prev, currentPage]));
          setAiExtractionComplete(true);
          setDrawnSinceExtractionPages((prev) => { const next = new Set(prev); next.delete(currentPage); return next; });
          setExpandedGroups(new Set());
          setExtractionResetByRerun(false);
          drawnPagesRef.current.delete(currentPage);
          return;
        }

        await replaceExtractionForPage(currentPage, selectedDoc);
        userExtractedPagesRef.current.add(currentPage);
        backendExtractedPagesRef.current.add(currentPage);
        extractedPagesRef.current.add(currentPage);
        setExtractedPages((prev) => new Set([...prev, currentPage]));
        setAiExtractionComplete(true);
        setDrawnSinceExtractionPages((prev) => { const next = new Set(prev); next.delete(currentPage); return next; });
        setExpandedGroups(new Set());
        setExtractionResetByRerun(false);
        drawnPagesRef.current.delete(currentPage);
      }
    } catch (e) {
      showToast("error", e.message);
    } finally { setIsProcessing(false); }
  }, [currentPage, detectedPages, extractionResetByRerun, selectedDoc, selectedScale, fetchExtractionForPageSilent, replaceExtractionForPage, guardAction]);

  const handleCalculateEstimation = useCallback(async () => {
    if (!selectedDoc) return;
    if (guardAction("proceed_to_estimation", "Proceed to Estimate")) return;
    setTool("select"); setActiveObjectType(null); setDraftPoints([]);
    setSelectedShapeId(null); setSelectedShapeIds(new Set());
    const payload = {
      organization_uuid: localStorage.getItem("organization_uuid") ?? "",
      project_uuid: localStorage.getItem("project_uuid") ?? "",
      document_id: selectedDoc.document_id,
      device_info: getDeviceInfo(),
    };
    try {
      setIsProcessing(true);
      const raw = await ProceedToEstimation(payload);
      const response = unwrapRes(raw);
      const noLineItems = response?.message === "No valid line items available for estimation.";
      if (response?.valid || noLineItems) {
        unlockEstimation();
        if (!noLineItems) showToast("success", response.message || "Proceeding to estimation...");
        const uuid = localStorage.getItem("project_uuid") ?? "";
        navigate(`/project/view/${uuid}/estimate-builder/dashboard`, { state: { fromEstimation: true } });
      } else if (response?.requires_confirmation) {
        setProceedConfirmMessage(response.message || "Are you sure you want to continue?");
        setPendingProceedPayload(payload);
        setShowProceedConfirm(true);
      } else {
        showToast("error", response?.message || "Failed to proceed to estimation");
      }
    } catch (e) {
      showToast("error", e.message || "Failed to proceed to estimation");
    } finally { setIsProcessing(false); }
  }, [selectedDoc, navigate, unlockEstimation, guardAction]);

  const handleConfirmProceed = useCallback(async () => {
    if (!pendingProceedPayload) return;
    setShowProceedConfirm(false);
    try {
      setIsProcessing(true);
      const raw = await ProceedToEstimation({ ...pendingProceedPayload, confirm_replace: true });
      const response = unwrapRes(raw);
      const noLineItems = response?.message === "No valid line items available for estimation.";
      if (response?.valid || noLineItems) {
        unlockEstimation();
        if (!noLineItems) showToast("success", response.message || "Proceeding to estimation...");
        const uuid = localStorage.getItem("project_uuid") ?? "";
        navigate(`/project/view/${uuid}/estimate-builder/dashboard`, { state: { fromEstimation: true } });
      } else {
        showToast("error", response?.message || "Failed to proceed to estimation");
      }
    } catch (e) {
      showToast("error", e.message || "Failed to proceed to estimation");
    } finally { setIsProcessing(false); }
  }, [pendingProceedPayload, navigate, unlockEstimation]);

  return {
    fetchTakeoffCategories,
    fetchEligibleTakeoffsForPage,
    fetchDetectionForPage,
    fetchExtractionForPageSilent,
    replaceExtractionForPage,
    runAIDetection,
    handleResetTakeoff,
    handleAIDetection,
    handleDetectAfterModalSave,
    handleAIExtraction,
    handleCalculateEstimation,
    handleConfirmProceed,
  };
}
