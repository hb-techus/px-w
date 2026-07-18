// ─── TakeoffWorkspace.js ─────────────────────────────────────────────────────
import React, {
  useEffect, useRef, useState, useCallback, useMemo,
} from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AlertCircle } from "lucide-react";

import { showToast } from "../../../../genriccomponents/techus-ToastNotification";
import { useEstimation } from "../../../context/EstimationContext";

import {
  updateDetectionObject,
  UpdatePageScale,
  GetDocumentDetail,
  GetProductList,
  getImageStream,
  saveNonEligibleTakeoffs
} from "../../../../services/techus-services";

import UnlockUpgradeModal from "../../../../genriccomponents/UnlockUpgradeModal";
import CanvasPanel from "./Canvas";

import TakeoffSidebar from "./TakeoffSidebar";
import TakeoffToolbar from "./TakeoffToolbar";
import TakeoffNavbar from "./TakeoffNavbar";
import FullPageLoader from "../../../../genriccomponents/loaders/FullPageLoader";
import { EditItemModal, AIDetectionPortal, ConfirmRerunModal, ProceedConfirmModal } from "./WorkspaceModals";
import OtherTradesModal from "./OtherTradesModal";
import { useTakeoff } from "./TakeoffContext";
import usePermissions from "../../../Common/usePermissions";
import { getDeviceInfo } from "../../../../utils/getDeviceInfo";

import {
  getPageImageKey,
  getThumbImageKey,
  ALL_DATA_KEYS,
  EMPTY_TAKEOFF_DATA,
} from "./TakeoffWorkspace.constants";

import {
  findGroupForTakeoffId,
  buildColorMapFromData,
  fetchPresignedUrl,
} from "./TakeoffWorkspace.utils";
import { useTakeoffAIHandlers } from "./useTakeoffAIHandlers";
import { useTakeoffShapeHandlers } from "./useTakeoffShapeHandlers";
import { useTakeoffItemHandlers } from "./useTakeoffItemHandlers";

// ─── Component ────────────────────────────────────────────────────────────────
export default function TakeoffWorkspace() {
  const imgRef = useRef(null);
  const canvasPanelRef = useRef(null);
  const pageStore = useRef({});
  const imageUrlCache = useRef({});
  const thumbUrlCache = useRef({});
  const pendingDrawnShapeIdRef = useRef(null);
  const pendingObjectKeyRef = useRef(new Map());
  const takeoffCategoriesRef = useRef(null);

  // ─── Permissions ────────────────────────────────────────────────────────────
  const { permissions: planStudioPerms, packagePermissions: planStudioEnabled } =
    usePermissions("takeoff_dashboard", "plan_studio");
  const { packagePermissions: psDetectionEnabled } = usePermissions("", "ps_detection");
  const { packagePermissions: psExtractionEnabled } = usePermissions("", "ps_extraction");
  const { packagePermissions: psProceedEnabled } = usePermissions("", "ps_proceed");
  const { packagePermissions: mtAnnotationEnabled } = usePermissions("", "mt_annotation");
  const { packagePermissions: mtTradeEnabled } = usePermissions("", "mt_trade");

  const [showModal, setShowModal] = useState(false);
  const [upgradeMessage, setUpgradeMessage] = useState("You need to upgrade your package to access this feature.");
  const [showProceedConfirm, setShowProceedConfirm] = useState(false);
  const [proceedConfirmMessage, setProceedConfirmMessage] = useState('');
  const [pendingProceedPayload, setPendingProceedPayload] = useState(null);

  const handleUpgradeRequired = useCallback((message) => {
    setUpgradeMessage(message || "You need to upgrade your package to access this feature.");
    setShowModal(true);
  }, []);

  const guardAction = useCallback((permKey, featureName) => {
    if (planStudioEnabledRef.current === false) {
      handleUpgradeRequired("Upgrade your package to access Plan Studio.");
      return true;
    }
    if (permKey === "drawing_tools_access") {
      if (mtAnnotationEnabledRef.current === false) {
        handleUpgradeRequired(`Upgrade your package to use ${featureName}.`);
        return true;
      }
      return false;
    }
    const granularPackageMap = {
      ai_detection: psDetectionEnabledRef.current,
      ai_extraction: psExtractionEnabledRef.current,
      proceed_to_estimation: psProceedEnabledRef.current,
    };
    const granularEnabled = granularPackageMap[permKey];
    if (granularEnabled === false) {
      handleUpgradeRequired(`Upgrade your package to use ${featureName}.`);
      return true;
    }
    if (planStudioPermsRef.current?.[permKey] === false) {
      handleUpgradeRequired(`You don't have permission to use ${featureName}.`);
      return true;
    }
    return false;
  }, [handleUpgradeRequired]);

  const { permissions: annotationPerms } = usePermissions("annotation", "mt_annotation");

  const planStudioEnabledRef = useRef(planStudioEnabled);
  const planStudioPermsRef = useRef(planStudioPerms);
  const psDetectionEnabledRef = useRef(psDetectionEnabled);
  const psExtractionEnabledRef = useRef(psExtractionEnabled);
  const psProceedEnabledRef = useRef(psProceedEnabled);
  const mtAnnotationEnabledRef = useRef(mtAnnotationEnabled);

  useEffect(() => { planStudioEnabledRef.current = planStudioEnabled; }, [planStudioEnabled]);
  useEffect(() => { planStudioPermsRef.current = planStudioPerms; }, [planStudioPerms]);
  useEffect(() => { psDetectionEnabledRef.current = psDetectionEnabled; }, [psDetectionEnabled]);
  useEffect(() => { psExtractionEnabledRef.current = psExtractionEnabled; }, [psExtractionEnabled]);
  useEffect(() => { psProceedEnabledRef.current = psProceedEnabled; }, [psProceedEnabled]);
  useEffect(() => { mtAnnotationEnabledRef.current = mtAnnotationEnabled; }, [mtAnnotationEnabled]);

  // ─── Context / route ────────────────────────────────────────────────────────
  const { documentId } = useParams();
  const { selectedDoc, setSelectedDoc, getLastPage, setLastPage, clearLastPage } = useTakeoff();
  const drawnPagesRef = useRef(new Set());
  const userExtractedPagesRef = useRef(new Set());
  const backendExtractedPagesRef = useRef(new Set());
  const hasHydratedRef = useRef(false);
  const { unlockEstimation, isMarkAsCompleted } = useEstimation();
  const effectiveAnnotationPerms = useMemo(() => {
    if (isMarkAsCompleted) return { ...annotationPerms, delete: false, edit: false };
    return annotationPerms;
  }, [annotationPerms, isMarkAsCompleted]);

  // ─── State ──────────────────────────────────────────────────────────────────
  const [docError, setDocError] = useState(false);
  const [isDocLoading, setIsDocLoading] = useState(!!documentId && !selectedDoc);
  const [initTrigger, setInitTrigger] = useState(0);
  const [isLoadingCurrentImage, setIsLoadingCurrentImage] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentImageUrl, setCurrentImageUrl] = useState(null);
  const [productList, setProductList] = useState([]);

  const DEFAULT_SCALE = 0.16;
  const MAX_CANVAS_SCALE = 8.0;
  const [fitScale, setFitScale] = useState(null);
  const [scale, setScale] = useState(DEFAULT_SCALE);
  const [imgDims, setImgDims] = useState({ w: 0, h: 0 });
  const [imgReady, setImgReady] = useState(false);

  const [tool, setTool] = useState("select");
  const [activeObjectType, setActiveObjectType] = useState(null);
  const [draftPoints, setDraftPoints] = useState([]);
  const [mouseCanvasPos, setMouseCanvasPos] = useState(null);
  const [selectedShapeIds, setSelectedShapeIds] = useState(new Set());
  const [selectedShapeId, setSelectedShapeId] = useState(null);
  const [hoveredShapeId, setHoveredShapeId] = useState(null);
  const [manualDrawingPages, setManualDrawingPages] = useState(() => {
    try {
      const key = `manual_drawing_pages_${documentId}`;
      const saved = sessionStorage.getItem(key);
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch { return new Set(); }
  });

  const [shapes, setShapes] = useState({});
  const [aiDetectedShapes, setAiDetectedShapes] = useState([]);
  const [hiddenIds, setHiddenIds] = useState(new Set());

  const [selectedTakeoffId, setSelectedTakeoffId] = useState(null);
  const [takeoffData, setTakeoffData] = useState(EMPTY_TAKEOFF_DATA);
  const [colorMap, setColorMap] = useState(() => buildColorMapFromData(EMPTY_TAKEOFF_DATA));

  const [expandedGroups, setExpandedGroups] = useState(() => {
    try {
      const saved = localStorage.getItem("takeoff_expanded_groups");
      if (saved) return new Set(JSON.parse(saved));
    } catch { /* ignore */ }
    return new Set();
  });

  const [isCanvasProcessing, setIsCanvasProcessing] = useState(false);
  const [confirmModal, setConfirmModal] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [editingGroupId, setEditingGroupId] = useState(null);
  const [isEditDialogLoading, setIsEditDialogLoading] = useState(false);
  const [deletingGroupId, setDeletingGroupId] = useState(null);
  const [deletingItemId, setDeletingItemId] = useState(null);
  const [isDeletingPkId, setIsDeletingPkId] = useState(null);
  const [isDeletingGroup, setIsDeletingGroup] = useState(null);
  const [isDeletingDetectionPkIds, setIsDeletingDetectionPkIds] = useState(new Set());
  const [isDeleting, setIsDeleting] = useState(false);

  const [currentPage, setCurrentPage] = useState(0);
  const [pageInputValue, setPageInputValue] = useState("1");
  const totalPages = selectedDoc?.n_pages ?? 0;

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showThumbnails, setShowThumbnails] = useState(false);

  const [pageScales, setPageScales] = useState(() => selectedDoc?.scales ?? {});
  const [scaleUpdating, setScaleUpdating] = useState(false);

  const selectedScale = pageScales[`page-${currentPage + 1}`] ?? null;
  const canvasBusy = isCanvasProcessing;

  const [aiDetectionComplete, setAiDetectionComplete] = useState(false);
  const [aiExtractionComplete, setAiExtractionComplete] = useState(false);
  const [detectedPages, setDetectedPages] = useState(new Set());
  const [aiRunPages, setAiRunPages] = useState(() => {
    try {
      const key = `ai_run_pages_${documentId}`;
      const saved = sessionStorage.getItem(key);
      if (saved) return new Set(JSON.parse(saved));
    } catch { /* ignore */ }
    return new Set();
  });
  const [extractedPages, setExtractedPages] = useState(new Set());
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [takeoffTypes] = useState([]);
  const confirmDeleteShapeRef = useRef(null);
  const activePageRequestRef = useRef(0);
  const activeImageRequestRef = useRef(0);
  const manualPageExtractionClearedRef = useRef(new Set());

  const [isInitialPageHydrating, setIsInitialPageHydrating] = useState(true);

  const [showAIDetectionModal, setShowAIDetectionModal] = useState(false);
  const [showOtherTradesModal, setShowOtherTradesModal] = useState(false);
  const [nonEligibleTrades, setNonEligibleTrades] = useState([]);
  const [nonEligibleStagingId, setNonEligibleStagingId] = useState(null);
  const [pageEligibleTakeoffs, setPageEligibleTakeoffs] = useState([]);
  const eligibleTakeoffsPageRef = useRef(null);
  const [eligibleTakeoffsRes, setEligibleTakeoffsRes] = useState(null);
  const [aiDetectionRan, setAiDetectionRan] = useState(false);
  const [extractionResetByRerun, setExtractionResetByRerun] = useState(false);
  const hasManualDrawingsOnPage = manualDrawingPages.has(currentPage);
  const [drawnSinceExtractionPages, setDrawnSinceExtractionPages] = useState(new Set());

  const colorMapRef = useRef(colorMap);
  const selectedDocRef = useRef(selectedDoc);
  useEffect(() => { colorMapRef.current = colorMap; }, [colorMap]);
  useEffect(() => { selectedDocRef.current = selectedDoc; }, [selectedDoc]);
  const extractedPagesRef = useRef(new Set());

  // Derive "any extraction done" from three sources so the Proceed button stays enabled
  // after navigation even when extractedPages resets on component remount:
  //  1. extractedPages — populated during the current session
  //  2. takeoffData    — populated from the API after hydration (if backend returns all-page data)
  //  3. sessionStorage — set when extraction is confirmed; survives navigation within the session
  const anyExtractionDone = useMemo(() => {
    if (extractedPages.size > 0) return true;
    if (ALL_DATA_KEYS.some((k) => {
      const v = takeoffData[k];
      return (Array.isArray(v) ? v : (v?.items ?? [])).length > 0;
    })) return true;
    try { return documentId ? sessionStorage.getItem(`prexo_extracted_${documentId}`) === '1' : false; } catch { return false; }
  }, [extractedPages, takeoffData, documentId]);

  useEffect(() => {
    const onEnter = () => setIsFullscreen(true);
    const onExit = () => setIsFullscreen(false);
    window.addEventListener("takeoff-fullscreen-enter", onEnter);
    window.addEventListener("takeoff-fullscreen-exit", onExit);
    return () => {
      window.removeEventListener("takeoff-fullscreen-enter", onEnter);
      window.removeEventListener("takeoff-fullscreen-exit", onExit);
    };
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("takeoff_expanded_groups", JSON.stringify([...expandedGroups]));
    } catch { /* ignore */ }
  }, [expandedGroups]);

  useEffect(() => {
    try {
      const key = `manual_drawing_pages_${selectedDoc?.document_id}`;
      if (key) sessionStorage.setItem(key, JSON.stringify([...manualDrawingPages]));
    } catch { /* ignore */ }
  }, [manualDrawingPages, selectedDoc?.document_id]);

  useEffect(() => {
    try {
      const key = `ai_run_pages_${selectedDoc?.document_id}`;
      if (key) sessionStorage.setItem(key, JSON.stringify([...aiRunPages]));
    } catch { /* ignore */ }
  }, [aiRunPages, selectedDoc?.document_id]);

  const perPageDetectionColorCache = useRef({});
  const takeoffDataRef = useRef(EMPTY_TAKEOFF_DATA);
  const lastLoadedDocIdRef = useRef(null);
  useEffect(() => { takeoffDataRef.current = takeoffData; }, [takeoffData]);

  const safeSetScale = useCallback((updater) => {
    setScale((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      const minScale = (fitScale && fitScale > 0) ? fitScale * 0.5 : 0.01;
      return Math.min(Math.max(next, minScale), MAX_CANVAS_SCALE);
    });
  }, [fitScale]);

  const availableImages = useMemo(
    () => selectedDoc
      ? Array.from({ length: selectedDoc.n_pages }, (_, i) => ({ page: i + 1 }))
      : [],
    [selectedDoc],
  );

  const navigate = useNavigate();
  const currentPageRef = useRef(currentPage);
  useEffect(() => { currentPageRef.current = currentPage; }, [currentPage]);

  const selectedTakeoffIdRef = useRef(selectedTakeoffId);
  useEffect(() => { selectedTakeoffIdRef.current = selectedTakeoffId; }, [selectedTakeoffId]);

  const hiddenIdsRef = useRef(hiddenIds);
  useEffect(() => { hiddenIdsRef.current = hiddenIds; }, [hiddenIds]);

  // ─── Document loading ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!documentId) return;
    // Early-return only when we have already fully reset/loaded for this exact documentId.
    // Without the lastLoadedDocIdRef guard, switching from PDF A → PDF B would hit the
    // early return if the shared context (selectedDoc) was already updated to PDF B before
    // this effect fired, skipping all the canvas/detection resets and leaving PDF A's
    // shapes visible in PDF B.
    if (lastLoadedDocIdRef.current === documentId && selectedDoc && selectedDoc.document_id === documentId) { setIsDocLoading(false); setInitTrigger((t) => t + 1); return; }

    lastLoadedDocIdRef.current = documentId;
    hasHydratedRef.current = false;
    pageStore.current = {};
    imageUrlCache.current = {};
    thumbUrlCache.current = {};
    perPageDetectionColorCache.current = {};
    takeoffDataRef.current = EMPTY_TAKEOFF_DATA;

    setTakeoffData(EMPTY_TAKEOFF_DATA);
    setColorMap(buildColorMapFromData(EMPTY_TAKEOFF_DATA));
    setAiDetectedShapes([]);
    setShapes({});
    setDetectedPages(new Set());
    setAiRunPages(new Set());
    setExtractedPages(new Set());
    extractedPagesRef.current = new Set();
    setAiDetectionComplete(false);
    setAiExtractionComplete(false);
    setCurrentPage(0);
    setPageInputValue("1");
    setImgReady(false);
    setCurrentImageUrl(null);
    setIsLoadingCurrentImage(true);
    setSelectedShapeId(null); setSelectedShapeIds(new Set());
    setSelectedTakeoffId(null);
    setHiddenIds(new Set());
    setPageScales({});
    setPageEligibleTakeoffs([]);
    eligibleTakeoffsPageRef.current = null;
    setEligibleTakeoffsRes(null);
    drawnPagesRef.current = new Set();

    setIsDocLoading(true);
    const loadDoc = async () => {
      try {
        const res = await GetDocumentDetail({
          organization_uuid: localStorage.getItem("organization_uuid") ?? "",
          project_uuid: localStorage.getItem("project_uuid") ?? "",
          document_id: documentId,
          device_info: (() => {
            const ua = navigator.userAgent;
            const isMac = /Mac OS/.test(ua), isWin = /Windows/.test(ua);
            const osName = isMac ? "macOS" : isWin ? "Windows" : "Linux";
            return { osName, osVersion: "Unknown", browserName: "Unknown", browserVersion: "Unknown" };
          })(),
        });
        const parsed = res?.valid !== undefined ? res : res?.data?.valid !== undefined ? res.data : null;
        if (!parsed?.valid || !parsed?.data) { setDocError(true); setIsDocLoading(false); return; }
        const d = parsed.data;
        setSelectedDoc({
          document_id: d.document_id,
          label: d.document_name ?? d.label ?? documentId,
          n_pages: d.pages ?? d.n_pages ?? 1,
          images_folder_path: d.images_folder_path,
          thumbnails_folder_path: d.thumbnails_folder_path,
          scales: d.scales ?? {},
        });
        setIsDocLoading(false);
        // Fetch full product list for the product dropdowns in edit/add dialogs
        try {
          const prodRaw = await GetProductList({
            organization_uuid: localStorage.getItem("organization_uuid") ?? "",
            project_uuid: localStorage.getItem("project_uuid") ?? "",
            sort_order: "asc",
          });
          const prodParsed = typeof prodRaw === "string" ? JSON.parse(prodRaw) : prodRaw;
          if (prodParsed?.valid && Array.isArray(prodParsed.data)) {
            setProductList(prodParsed.data);
          }
        } catch { /* product list fetch is non-critical */ }
      } catch {
        setDocError(true);
        setIsDocLoading(false);
      }
    };
    loadDoc();
  }, [documentId]);

  useEffect(() => {
    if (isDocLoading) return;
    if (!selectedDoc) { setDocError(true); return; }
    if (!selectedDoc.document_id || !selectedDoc.n_pages) { setDocError(true); return; }
    if (selectedDoc.document_id !== documentId) return;
    if (hasHydratedRef.current) return;
    hasHydratedRef.current = true;

    pageStore.current = {};
    imageUrlCache.current = {};
    thumbUrlCache.current = {};
    perPageDetectionColorCache.current = {};

    setCurrentPage(0);
    setPageInputValue("1");
    setAiDetectedShapes([]);
    setShapes({});
    setTakeoffData(EMPTY_TAKEOFF_DATA);
    setColorMap(buildColorMapFromData(EMPTY_TAKEOFF_DATA));
    setDetectedPages(new Set());
    setAiRunPages(new Set());
    setExtractedPages(new Set());
    extractedPagesRef.current = new Set();
    setAiDetectionComplete(false);
    setAiDetectionRan(false);
    setAiExtractionComplete(false);
    setSelectedShapeId(null); setSelectedShapeIds(new Set());
    setSelectedTakeoffId(null);
    setHiddenIds(new Set());
    setPageEligibleTakeoffs([]);
    eligibleTakeoffsPageRef.current = null;
    setEligibleTakeoffsRes(null);
    drawnPagesRef.current = new Set();
    setPageScales(selectedDoc.scales ?? {});

    let startPage = 0;
    const remembered = getLastPage(selectedDoc.document_id);
    if (remembered !== null && remembered >= 0 && remembered < selectedDoc.n_pages) {
      startPage = remembered;
    }
    if (startPage !== 0) {
      setCurrentPage(startPage);
      setPageInputValue((startPage + 1).toString());
    }

    setIsInitialPageHydrating(true);
    Promise.all([
      fetchDetectionForPage(startPage, selectedDoc),
      fetchExtractionForPageSilent(startPage, selectedDoc),
      fetchEligibleTakeoffsForPage(startPage, selectedDoc),
      fetchTakeoffCategories(),
    ]).finally(() => { setIsInitialPageHydrating(false); });
  }, [selectedDoc, initTrigger, documentId]);

  useEffect(() => {
    setAiDetectionComplete(detectedPages.has(currentPage));
  }, [currentPage, detectedPages]);

  useEffect(() => {
    if (extractedPagesRef.current.has(currentPage)) { setAiExtractionComplete(true); return; }
    const hasDataForCurrentPage = ALL_DATA_KEYS.some((k) => {
      const v = takeoffData[k];
      const items = Array.isArray(v) ? v : (v?.items ?? []);
      return items.some((i) => i.page_number == null || Number(i.page_number) === currentPage + 1);
    });
    setAiExtractionComplete(hasDataForCurrentPage);
  }, [extractedPages, takeoffData, currentPage]);

  useEffect(() => {
    if (!selectedDoc) return;
    if (selectedDoc.document_id !== documentId) return;
    let cancelled = false;
    const requestId = ++activeImageRequestRef.current;
    const finishIfActive = (fn) => {
      if (cancelled) return;
      if (activeImageRequestRef.current !== requestId) return;
      fn();
    };
    const load = async () => {
      const cachedUrl = imageUrlCache.current[currentPage];
      if (cachedUrl) {
        const img = new Image();
        img.onload = () => finishIfActive(() => {
          imgRef.current = img;
          setImgDims({ w: img.naturalWidth, h: img.naturalHeight });
          setCurrentImageUrl(cachedUrl);
          setImgReady(true);
          setIsLoadingCurrentImage(false);
        });
        img.onerror = () => finishIfActive(() => {
          showToast("error", "Failed to load page image");
          setIsLoadingCurrentImage(false);
        });
        img.src = cachedUrl;
        return;
      }
      try {
        const s3Key = getPageImageKey(selectedDoc, currentPage + 1);
        const blobUrl = await getImageStream(s3Key);
        if (cancelled || activeImageRequestRef.current !== requestId) { URL.revokeObjectURL(blobUrl); return; }
        const img = new Image();
        img.onload = () => finishIfActive(() => {
          imgRef.current = img;
          imageUrlCache.current[currentPage] = blobUrl;
          setImgDims({ w: img.naturalWidth, h: img.naturalHeight });
          setCurrentImageUrl(blobUrl);
          setImgReady(true);
          setIsLoadingCurrentImage(false);
        });
        img.onerror = () => finishIfActive(() => {
          showToast("error", "Failed to load page image");
          setIsLoadingCurrentImage(false);
        });
        img.src = blobUrl;
      } catch (e) {
        finishIfActive(() => { showToast("error", e.message); setIsLoadingCurrentImage(false); });
      }
    };
    load();
    return () => { cancelled = true; };
  }, [currentPage, selectedDoc, documentId]);

  useEffect(() => {
    if (!selectedDoc) return;
    let cancelled = false;
    const preload = async (pageIdx) => {
      if (pageIdx < 0 || pageIdx >= totalPages || imageUrlCache.current[pageIdx]) return;
      try {
        const s3Key = getPageImageKey(selectedDoc, pageIdx + 1);
        const blobUrl = await getImageStream(s3Key);
        if (cancelled) { URL.revokeObjectURL(blobUrl); return; }
        imageUrlCache.current[pageIdx] = blobUrl;
        const img = new Image();
        img.src = blobUrl;
      } catch { /* silent */ }
    };
    const t = setTimeout(() => { preload(currentPage + 1); preload(currentPage - 1); }, 600);
    return () => { cancelled = true; clearTimeout(t); };
  }, [currentPage, selectedDoc, totalPages]);

  const getThumbnailUrl = useCallback(async (pageIndex) => {
    if (!selectedDoc) return null;
    if (thumbUrlCache.current[pageIndex]) return thumbUrlCache.current[pageIndex];
    try {
      const url = await fetchPresignedUrl(getThumbImageKey(selectedDoc, pageIndex + 1));
      if (!url) return null;
      thumbUrlCache.current[pageIndex] = url;
      return url;
    } catch (err) {
      console.error("[getThumbnailUrl] page", pageIndex, err);
      return null;
    }
  }, [selectedDoc]);

  // ─── Derived shapes ──────────────────────────────────────────────────────────
  const currentShapes = useMemo(() => shapes[currentPage] || [], [shapes, currentPage]);
  // const visibleAiShapes = useMemo(
  //   () => aiDetectedShapes.filter((s) => {
  //     const scopedKey = s.pageNumber != null ? `${s.takeoffId}_p${s.pageNumber}` : s.takeoffId;
  //     return !hiddenIds.has(scopedKey) && !hiddenIds.has(s.takeoffId);
  //   }),
  //   [aiDetectedShapes, hiddenIds],
  // );


  const visibleAiShapes = useMemo(() => {
    // Determine if a shape is hidden. Shapes with a pageNumber use ONLY the scoped
    // key (takeoffId_pN) so that hiding page 1 items never hides same-named page 2
    // shapes. Shapes without pageNumber fall back to the bare-key check for compat.
    const isShapeHidden = (s) => {
      const scopedKey = s.pageNumber != null ? `${s.takeoffId}_p${s.pageNumber}` : s.takeoffId;
      if (hiddenIds.has(scopedKey)) return true;
      if (s.pageNumber == null && hiddenIds.has(s.takeoffId)) return true;
      return false;
    };

    // Build a set of canvas IDs for all hidden parent shapes so cut children
    // can be hidden when their parent is hidden via the sidebar toggle.
    const hiddenCanvasIds = new Set(
      aiDetectedShapes.filter(isShapeHidden).map((s) => s.id)
    );

    return aiDetectedShapes.filter((s) => {
      if (isShapeHidden(s)) return false;
      // Also hide cut children when their parent is hidden.
      if (s.isCutShape && s.cutParentAreaId && hiddenCanvasIds.has(s.cutParentAreaId)) return false;
      return true;
    });
  }, [aiDetectedShapes, hiddenIds]);
  const allShapes = useMemo(() => [...currentShapes, ...visibleAiShapes], [currentShapes, visibleAiShapes]);

  const visibleAiShapesRef = useRef(visibleAiShapes);
  // useEffect(() => { visibleAiShapesRef.current = visibleAiShapes; }, [visibleAiShapes]);
  useEffect(() => {
    visibleAiShapesRef.current = visibleAiShapes;

    // Seed committedCutShapesRef for any AI-detected cut shapes that just loaded.
    // Without this, after a page refresh the ref is empty → no prior snapshot →
    // the diff useEffect below never fires updateDetectionObject for these shapes.
    visibleAiShapes.forEach((s) => {
      if (!s.isCutShape) return;
      const key = s.id;
      if (committedCutShapesRef.current.has(key)) return; // already seeded
      committedCutShapesRef.current.set(key, JSON.stringify({
        pts: s.points,
        r: s.radius ?? null,
        cp: s.controlPoints ?? null,
      }));
    });
  }, [visibleAiShapes]);
  // Keep a ref to currentShapes for use inside callbacks
  const currentShapesRef = useRef(currentShapes);
  useEffect(() => { currentShapesRef.current = currentShapes; }, [currentShapes]);

  // ── Watch currentShapes for cut shape moves/resizes and fire update API ───
  // Canvas never calls onShapeDragEnd for cut shapes (they use the non-AI drag path).
  // Instead we detect changes here by comparing against a committed snapshot.
  const committedCutShapesRef = useRef(new Map()); // canvasId → { points, radius, controlPoints }

  useEffect(() => {
    if (!selectedDoc) return;

    // Build combined list of ALL cut shapes from both stores
    const sessionCutShapes = currentShapes.filter((s) => s.isCutShape);
    const aiCutShapes = aiDetectedShapes.filter((s) => s.isCutShape);

    if (!sessionCutShapes.length && !aiCutShapes.length) return;

    // Set of IDs that live in aiDetectedShapes (use takeoffId as object_key directly)
    const aiCutIdSet = new Set(aiCutShapes.map((s) => s.id));

    const changedShapes = [];

    // Helper: diff one shape against its committed snapshot
    const checkShape = (s, resolveObjectKey) => {
      const snap = JSON.stringify({
        pts: s.points,
        r: s.radius ?? null,
        cp: s.controlPoints ?? null,
      });
      const prev = committedCutShapesRef.current.get(s.id);
      if (prev === snap) return; // unchanged
      committedCutShapesRef.current.set(s.id, snap);
      if (!prev) return; // first time seen — seed only, no update

      const objectKey = resolveObjectKey(s);
      if (!objectKey) return;

      changedShapes.push({ shape: s, objectKey });
    };

    // Session-drawn cut shapes — object_key from pendingObjectKeyRef keyed by canvas id
    sessionCutShapes.forEach((s) => {
      if (aiCutIdSet.has(s.id)) return; // would be double-counted below
      checkShape(s, (shape) => pendingObjectKeyRef.current.get(shape.id) ?? null);
    });

    // AI-detected cut shapes — takeoffId IS the backend object_key (e.g. "area-2")
    // but only if it's a real key (not a manual- prefixed one)
    aiCutShapes.forEach((s) => {
      checkShape(s, (shape) => {
        const t = shape.takeoffId;
        if (t && !t.startsWith("manual-")) return t;
        return pendingObjectKeyRef.current.get(shape.id) ?? null;
      });
    });

    if (!changedShapes.length) return;

    // Reset extraction button when cut shapes are moved/resized — same as detection tools
    drawnPagesRef.current.add(currentPage);
    if (extractedPagesRef.current.has(currentPage)) {
      setDrawnSinceExtractionPages((prev) => new Set([...prev, currentPage]));
    }

    // Resolve parent key once per unique parent to avoid redundant lookups
    const parentKeyCache = new Map();
    const getParentKey = (parentCanvasId) => {
      if (parentKeyCache.has(parentCanvasId)) return parentKeyCache.get(parentCanvasId);
      let key = null;
      const parentShape =
        visibleAiShapesRef.current?.find((p) => p.id === parentCanvasId) ||
        currentShapesRef.current?.find((p) => p.id === parentCanvasId);
      if (parentShape) {
        const rawPId = parentShape.takeoffId ?? parentShape.id;
        key = rawPId?.startsWith("manual-")
          ? (pendingObjectKeyRef.current.get(rawPId) ?? null)
          : rawPId;
      }
      parentKeyCache.set(parentCanvasId, key);
      return key;
    };

    // Build geometry + fire all API calls in parallel
    const updates = changedShapes.map(({ shape: s, objectKey }) => {
      let geoJson;
      if (s.type === "circle" && s.radius != null) {
        geoJson = {
          type: "circle",
          center: [Math.round(s.points[0].x), Math.round(s.points[0].y)],
          radius: Math.round(s.radius * 10) / 10,
        };
      } else if (s.type === "arc" && s.controlPoints?.length) {
        const segments = (s.controlPoints || []).map((cp, idx) => {
          const from = s.points[idx];
          const to = s.points[(idx + 1) % s.points.length];
          if (!from || !to) return null;
          const midX = (from.x + to.x) / 2, midY = (from.y + to.y) / 2;
          const isMid = Math.abs(cp.x - midX) < 0.5 && Math.abs(cp.y - midY) < 0.5;
          return {
            from: [Math.round(from.x), Math.round(from.y)],
            to: [Math.round(to.x), Math.round(to.y)],
            control: isMid ? null : [Math.round(cp.x), Math.round(cp.y)],
          };
        }).filter(Boolean);
        geoJson = { type: "arc", value: segments };
      } else {
        geoJson = {
          type: "polygon",
          value: s.points.map((p) => [Math.round(p.x), Math.round(p.y)]),
        };
      }

      if (s.cutParentAreaId) {
        const cutParentKey = getParentKey(s.cutParentAreaId);
        if (cutParentKey) geoJson.cut = cutParentKey;
      }

      return updateDetectionObject({
        organization_uuid: localStorage.getItem("organization_uuid") ?? "",
        project_uuid: localStorage.getItem("project_uuid") ?? "",
        document_id: selectedDoc.document_id,
        page_number: currentPage + 1,
        object_key: objectKey,
        object_type: "area",
        geometry_json: geoJson,
        device_info: getDeviceInfo(),
      });
    });

    Promise.all(updates.map((p) => p.catch((e) => {
      console.error("[CutTool] updateDetectionObject error:", e);
    })));

  }, [currentShapes, aiDetectedShapes, selectedDoc, currentPage]);
  const pendingSelectTakeoffIdRef = useRef(null);
  useEffect(() => {
    if (!pendingSelectTakeoffIdRef.current || !allShapes.length) return;
    const { takeoffId, pageNum, objectKeys } = pendingSelectTakeoffIdRef.current;
    const pendingObjKeys = Array.isArray(objectKeys) ? objectKeys : [];
    const matches = allShapes.filter(
      (s) => (s.takeoffId === takeoffId || pendingObjKeys.includes(s.takeoffId)) &&
        (pageNum == null || s.pageNumber == null || s.pageNumber === pageNum)
    );
    if (matches.length > 0) {
      setSelectedShapeIds(new Set(matches.map((s) => s.id)));
      setSelectedShapeId(matches[0].id);
      pendingSelectTakeoffIdRef.current = null;
    }
  }, [allShapes]);

  const setCurrentShapes = useCallback((updater) => {
    setShapes((prev) => {
      const cur = prev[currentPage] || [];
      const next = typeof updater === "function" ? updater(cur) : updater;
      currentShapesRef.current = next;
      return { ...prev, [currentPage]: next };
    });
  }, [currentPage]);

  const getTotalTakeoffs = useCallback(() => {
    if (!takeoffData) return 0;
    return ALL_DATA_KEYS.reduce((t, k) => {
      const v = takeoffData[k];
      const len = Array.isArray(v) ? v.length : (v?.items?.length ?? 0);
      return t + len;
    }, 0);
  }, [takeoffData]);

  // ─── Keyboard shortcuts ──────────────────────────────────────────────────────
  useEffect(() => {
    const toolMap = { v: "select", h: "pan", r: "rectangle", p: "polygon", l: "line", o: "point", m: "measure" };
    const onKey = (e) => {
      if (e.target.tagName === "INPUT") return;
      const k = e.key.toLowerCase();
      if (toolMap[k]) { setTool(toolMap[k]); setDraftPoints([]); }
      if ((e.key === "Delete" || e.key === "Backspace") && selectedShapeId) {
        e.preventDefault();
        setCurrentShapes((p) => p.filter((s) => s.id !== selectedShapeId));
        setSelectedShapeId(null); setSelectedShapeIds(new Set());
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedShapeId, setCurrentShapes]);

  // ─── Custom hooks ─────────────────────────────────────────────────────────────
  const {
    fetchTakeoffCategories, fetchEligibleTakeoffsForPage, fetchDetectionForPage,
    fetchExtractionForPageSilent, replaceExtractionForPage,
    handleResetTakeoff, handleAIDetection, handleDetectAfterModalSave,
    handleAIExtraction, handleCalculateEstimation, handleConfirmProceed,
  } = useTakeoffAIHandlers({
    pageStore, activePageRequestRef, perPageDetectionColorCache, colorMapRef, takeoffDataRef,
    extractedPagesRef, drawnPagesRef, userExtractedPagesRef, backendExtractedPagesRef,
    manualPageExtractionClearedRef, selectedDocRef, canvasPanelRef,
    eligibleTakeoffsPageRef, takeoffCategoriesRef, currentShapesRef,
    selectedDoc, currentPage, detectedPages, manualDrawingPages, shapes, aiDetectedShapes,
    pageEligibleTakeoffs, extractionResetByRerun, selectedScale,
    takeoffData, extractedPages, pendingProceedPayload, aiRunPages,
    setIsProcessing, setAiDetectedShapes, setShapes, setDetectedPages, setAiRunPages,
    setManualDrawingPages, setExtractedPages, setAiDetectionComplete, setAiExtractionComplete,
    setAiDetectionRan, setTakeoffData, setColorMap, setConfirmModal, setShowAIDetectionModal,
    setPageEligibleTakeoffs, setEligibleTakeoffsRes, setShowOtherTradesModal, setNonEligibleTrades,
    setNonEligibleStagingId, setShowProceedConfirm, setProceedConfirmMessage, setPendingProceedPayload,
    setHiddenIds, setSelectedShapeId, setSelectedShapeIds, setSelectedTakeoffId, setSidebarCollapsed,
    setDrawnSinceExtractionPages, setExpandedGroups, setExtractionResetByRerun, setCurrentShapes,
    setTool, setActiveObjectType, setDraftPoints,
    handleUpgradeRequired, guardAction, navigate, unlockEstimation,
  });

  const {
    handleShapeComplete, handleShapeDragEnd, handleDeleteShape, confirmDeleteShape,
  } = useTakeoffShapeHandlers({
    pageStore, currentShapesRef, pendingObjectKeyRef, visibleAiShapesRef,
    perPageDetectionColorCache, colorMapRef, extractedPagesRef, drawnPagesRef,
    pendingDrawnShapeIdRef, mtAnnotationEnabledRef, committedCutShapesRef,
    userExtractedPagesRef, backendExtractedPagesRef, confirmDeleteShapeRef,
    selectedDoc, currentPage, aiDetectedShapes, activeObjectType,
    takeoffData, manualDrawingPages, detectedPages,
    setCurrentShapes, setAiDetectedShapes, setSelectedShapeId, setSelectedShapeIds,
    setColorMap, setManualDrawingPages, setDetectedPages, setAiRunPages,
    setAiDetectionComplete, setDrawnSinceExtractionPages, setIsDeletingDetectionPkIds,
    setHiddenIds,
    fetchDetectionForPage, replaceExtractionForPage,
    handleUpgradeRequired,
  });

  // ─── Page navigation ─────────────────────────────────────────────────────────
  const handlePageChange = useCallback((pg) => {
    const v = Math.max(0, Math.min(totalPages - 1, pg));
    if (v === currentPageRef.current) return;
    activePageRequestRef.current += 1;
    const requestId = activePageRequestRef.current;
    setCurrentPage(v);
    setPageInputValue((v + 1).toString());
    setSelectedTakeoffId(null);
    setSelectedShapeId(null);
    setSelectedShapeIds(new Set());
    setAiDetectedShapes([]);
    setHoveredShapeId(null);
    setDraftPoints([]);
    setIsLoadingCurrentImage(true);
    setImgReady(false);
    committedCutShapesRef.current.clear();
    setShapes((prev) => {
      const pageCurrent = prev[v] || [];
      const withoutCuts = pageCurrent.filter((s) => !s.isCutShape);
      if (withoutCuts.length === pageCurrent.length) return prev;
      return { ...prev, [v]: withoutCuts };
    });
    fetchDetectionForPage(v, selectedDoc, false, requestId);
    fetchEligibleTakeoffsForPage(v, selectedDoc);
    if (selectedDoc?.document_id) setLastPage(selectedDoc.document_id, v);
  }, [totalPages, selectedDoc, fetchDetectionForPage, fetchEligibleTakeoffsForPage, setLastPage]);

  const {
    handleTakeoffUpdate, toggleItemVisibility, toggleGroupExpand, handleLineItemClick,
    openEditDialog, closeEditDialog, handleItemAdded, handleAddTradeItem,
    handleTakeoffInfoSaved, handleToolChange, handleObjectTypeChange,
    handleToolbarObjectTypeChange, deleteItem, deleteGroup,
  } = useTakeoffItemHandlers({
    perPageDetectionColorCache, colorMapRef, extractedPagesRef, drawnPagesRef,
    currentPageRef, hiddenIdsRef, selectedTakeoffIdRef, takeoffDataRef,
    userExtractedPagesRef, backendExtractedPagesRef, pageStore,
    pendingSelectTakeoffIdRef,
    selectedDoc, currentPage, takeoffData, aiDetectedShapes, totalPages, allShapes, mtTradeEnabled,
    setTakeoffData, setColorMap, setAiDetectedShapes, setHiddenIds,
    setSelectedShapeId, setSelectedShapeIds, setSelectedTakeoffId,
    setExpandedGroups, setEditingItem, setEditingGroupId, setIsEditDialogLoading,
    setIsDeletingPkId, setIsDeletingGroup, setIsDeleting, setExtractedPages,
    setAiExtractionComplete, setAiDetectionComplete, setManualDrawingPages,
    setDetectedPages, setAiRunPages, setShapes, setDeletingGroupId, setDeletingItemId,
    setTool, setActiveObjectType, setDraftPoints,
    handleUpgradeRequired, handlePageChange,
    fetchEligibleTakeoffsForPage, fetchExtractionForPageSilent,
  });

  useEffect(() => {
    return () => { if (selectedDoc?.document_id) clearLastPage(selectedDoc.document_id); };
  }, [selectedDoc?.document_id]);

  const handlePageInputBlur = useCallback(() => {
    const n = parseInt(pageInputValue, 10);
    if (!isNaN(n) && n >= 1 && n <= totalPages) {
      const targetPage = n - 1;
      if (targetPage !== currentPage) handlePageChange(targetPage);
      setPageInputValue(n.toString());
    } else {
      setPageInputValue((currentPage + 1).toString());
    }
  }, [pageInputValue, totalPages, currentPage, handlePageChange]);

  const currentImagePath = selectedDoc ? getPageImageKey(selectedDoc, currentPage + 1) : null;

  // ─── Scale change ─────────────────────────────────────────────────────────────
  const handleScaleChange = useCallback(async (newScale) => {
    if (!selectedDoc || scaleUpdating) return;
    const pageKey = `page-${currentPage + 1}`;
    const prevScale = pageScales[pageKey] ?? null;
    setPageScales((prev) => ({ ...prev, [pageKey]: newScale }));
    setScaleUpdating(true);
    try {
      await UpdatePageScale({
        organization_uuid: localStorage.getItem("organization_uuid") ?? "",
        project_uuid: localStorage.getItem("project_uuid") ?? "",
        document_id: selectedDoc.document_id,
        page_number: currentPage + 1,
        scale: newScale,
        device_info: getDeviceInfo(),
      });
      const res = await GetDocumentDetail({
        organization_uuid: localStorage.getItem("organization_uuid") ?? "",
        project_uuid: localStorage.getItem("project_uuid") ?? "",
        document_id: selectedDoc.document_id,
        device_info: getDeviceInfo(),
      });
      const parsed = res?.valid !== undefined ? res : res?.data?.valid !== undefined ? res.data : null;
      if (parsed?.valid && parsed?.data?.scales) setPageScales(parsed.data.scales);
    } catch (e) {
      setPageScales((prev) => ({ ...prev, [pageKey]: prevScale }));
      showToast("error", e.message);
    } finally { setScaleUpdating(false); }
  }, [currentPage, pageScales, scaleUpdating, selectedDoc]);

  useEffect(() => { confirmDeleteShapeRef.current = confirmDeleteShape; }, [confirmDeleteShape]);

  void currentImageUrl;
  void takeoffTypes;
  void pageEligibleTakeoffs;
  void setIsCanvasProcessing;
  void isDeleting;
  void saveNonEligibleTakeoffs
  // ─── Guards ───────────────────────────────────────────────────────────────────
  if (isDocLoading) return <FullPageLoader />;
  if (docError) {
    return (
      <div className="tw-flex tw-h-screen tw-items-center tw-justify-center" style={{ background: "#f1f5f9" }}>
        <div className="tw-bg-white tw-rounded-xl tw-shadow-lg tw-p-8 tw-max-w-sm tw-text-center">
          <AlertCircle size={48} color="#ef4444" className="tw-mx-auto tw-mb-4" />
          <h2 className="tw-text-lg tw-font-semibold tw-mb-2">No Document Selected</h2>
          <p className="tw-text-sm tw-text-gray-500 tw-mb-6">Please go back and choose a document.</p>
          <button
            onClick={() => navigate("/projects")}
            className="tw-px-5 tw-py-2.5 tw-bg-[#2563eb] hover:tw-bg-blue-700 tw-text-white tw-rounded-[5px] tw-text-[14px] tw-font-[500]"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }
  if (isInitialPageHydrating) return <FullPageLoader />;

  // ─── Render ───────────────────────────────────────────────────────────────────
  return (
    <div style={{ display: "flex", flexDirection: "column", padding: "1px", height: "calc(100vh - 30px)", overflow: "hidden" }}>
      {!isFullscreen && (
        <div>
          <div className="tw-flex tw-items-center tw-gap-2">
            <span className="tw-text-[20px] tw-text-gray-600 tw-font-medium">Takeoff Engine</span>
            <i className="icon-Save-and-Continue" />
            <span className="tw-text-[20px] tw-text-gray-600 tw-font-medium">Plan Studio</span>
            <i className="icon-Save-and-Continue" />
            <span className="tw-text-[20px] tw-font-bold tw-text-gray-900">{selectedDoc?.label ?? "Plan Studio"}</span>
          </div>
          <p className="tw-text-[#1e293b] tw-text-[14px] tw-mb-3">
            Detect floor areas and symbols on your plans using AI, then extract quantities into structured takeoff data ready for estimation.
          </p>
        </div>
      )}

      <div style={{ flex: 1, display: "flex", overflow: "hidden", position: "relative" }}>
        {isProcessing && <FullPageLoader />}

        <TakeoffSidebar
          takeoffData={takeoffData} colorMap={colorMap} expandedGroups={expandedGroups}
          showThumbnails={showThumbnails} availableImages={availableImages}
          getThumbnailUrl={getThumbnailUrl} currentPage={currentPage}
          deletingGroupId={deletingGroupId} deletingItemId={deletingItemId}
          onToggleGroup={toggleGroupExpand} onToggleVisibility={toggleItemVisibility}
          onOpenEditDialog={openEditDialog} onDeleteGroup={deleteGroup} onDeleteItem={deleteItem}
          onSetDeletingGroupId={setDeletingGroupId} onSetDeletingItemId={setDeletingItemId}
          onPageChange={handlePageChange} getTotalTakeoffs={getTotalTakeoffs}
          sidebarCollapsed={sidebarCollapsed}
          onToggleSidebar={() => setSidebarCollapsed((c) => !c)}
          onToggleThumbnails={() => setShowThumbnails((v) => !v)}
          isLoadingThumbnails={false} detectedPages={detectedPages}
          selectedTakeoffId={selectedTakeoffId} hiddenIds={hiddenIds}
          isDeletingPkId={isDeletingPkId} isDeletingDetectionPkIds={isDeletingDetectionPkIds}
          isDeletingGroup={isDeletingGroup}
          organizationUuid={localStorage.getItem("organization_uuid") ?? ""}
          projectUuid={localStorage.getItem("project_uuid") ?? ""}
          documentId={selectedDoc?.document_id ?? ""}
          deviceInfo={getDeviceInfo()}
          onItemAdded={handleItemAdded} onAddTradeGuard={handleAddTradeItem}
          onLineItemClick={handleLineItemClick}
          takeoffCategoriesRes={takeoffCategoriesRef.current} isMarkAsCompleted={isMarkAsCompleted}
          productList={productList}
        />

        <div style={{ flex: 1, display: "flex", overflow: "hidden", minWidth: 0 }}>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>
            <div style={{ flexShrink: 0 }}>
              <TakeoffNavbar
                sidebarCollapsed={sidebarCollapsed} showThumbnails={showThumbnails}
                currentPage={currentPage} totalPages={totalPages}
                pageInputValue={pageInputValue} currentImagePath={currentImagePath}
                aiDetectionComplete={aiDetectionComplete} aiExtractionComplete={aiExtractionComplete}
                detectedPages={detectedPages} extractedPages={extractedPages} anyExtractionDone={anyExtractionDone}
                onToggleSidebar={() => setSidebarCollapsed((c) => !c)}
                onToggleThumbnails={() => setShowThumbnails((v) => !v)}
                onPageChange={handlePageChange} onPageInputChange={setPageInputValue}
                onPageInputBlur={handlePageInputBlur} onAIDetection={handleAIDetection}
                onAIExtraction={handleAIExtraction} onCalculateEstimation={handleCalculateEstimation}
                selectedScale={selectedScale} onScaleChange={handleScaleChange} aiDetectionRan={aiDetectionRan}
                guardAction={guardAction} onResetTakeoff={handleResetTakeoff} isMarkAsCompleted={isMarkAsCompleted}
                hasManualDrawingsOnPage={hasManualDrawingsOnPage} extractionResetByRerun={extractionResetByRerun}
                aiDetectionActuallyRan={aiRunPages.has(currentPage)} drawnSinceExtraction={drawnSinceExtractionPages.has(currentPage)}

              />
            </div>

            <div style={{ flex: 1, overflow: "hidden", background: "#c8d0da", position: "relative" }}>
              <CanvasPanel
                ref={canvasPanelRef}
                imgRef={imgRef} imgDims={imgDims} imgReady={imgReady}
                scale={scale} setScale={safeSetScale}
                fitScale={fitScale}
                onFitScaleChange={(fs) => {
                  setFitScale(fs);
                  setScale((prev) => {
                    if (Math.abs(prev - DEFAULT_SCALE) < 0.001 || prev === DEFAULT_SCALE) return fs;
                    return prev;
                  });
                }}
                currentShapes={currentShapes} visibleAiShapes={visibleAiShapes} allShapes={allShapes}
                setCurrentShapes={setCurrentShapes} setAiDetectedShapes={setAiDetectedShapes}
                tool={tool} draftPoints={draftPoints} setDraftPoints={setDraftPoints}
                mouseCanvasPos={mouseCanvasPos} setMouseCanvasPos={setMouseCanvasPos}
                selectedShapeId={selectedShapeId} setSelectedShapeId={setSelectedShapeId}
                selectedShapeIds={selectedShapeIds} setSelectedShapeIds={setSelectedShapeIds}
                hoveredShapeId={hoveredShapeId} setHoveredShapeId={setHoveredShapeId}
                takeoffData={takeoffData} setSelectedTakeoffId={setSelectedTakeoffId}
                setSidebarCollapsed={setSidebarCollapsed} setExpandedGroups={setExpandedGroups}
                findGroupForTakeoffId={findGroupForTakeoffId}
                isLoadingCurrentImage={isLoadingCurrentImage}
                activeObjectType={activeObjectType}
                onShapeComplete={handleShapeComplete} onShapeDragEnd={handleShapeDragEnd}
                isCanvasProcessing={canvasBusy} onDeleteShape={handleDeleteShape}
                onToolChange={handleToolChange} onObjectTypeChange={handleObjectTypeChange}
                annotationPermissions={effectiveAnnotationPerms}
                onPermissionDenied={(featureName) => {
                  handleUpgradeRequired(`You don't have permission to use ${featureName}.`);
                }}
              />
            </div>
          </div>

          <div style={{ flexShrink: 0, width: 48, minWidth: 48, display: "flex" }}>
            <TakeoffToolbar
              tool={tool} activeObjectType={activeObjectType}
              onToolChange={handleToolChange} onObjectTypeChange={handleToolbarObjectTypeChange}
              scale={scale} fitScale={fitScale}
              onZoomIn={() => {
                if (canvasPanelRef.current?.zoomIn) {
                  canvasPanelRef.current.zoomIn();
                } else {
                  safeSetScale((prev) => Math.min(prev * 1.25, (fitScale || prev) * 8));
                }
              }}
              onZoomOut={() => {
                if (canvasPanelRef.current?.zoomOut) {
                  canvasPanelRef.current.zoomOut();
                } else {
                  safeSetScale((prev) => Math.max(prev * 0.8, 0.01));
                }
              }}
              onResetZoom={() => {
                if (canvasPanelRef.current?.resetZoom) {
                  canvasPanelRef.current.resetZoom();
                } else {
                  safeSetScale(fitScale || 0.16);
                }
              }}
              onFitToScreen={() => {
                if (canvasPanelRef.current?.fitToScreen) {
                  canvasPanelRef.current.fitToScreen();
                } else {
                  safeSetScale(fitScale || 0.16);
                }
              }}
              onZoomTo={(targetScale) => safeSetScale(targetScale)}
              guardAction={guardAction} currentPage={currentPage}
              documentId={selectedDoc?.document_id ?? ""}
              onAIDetection={handleAIDetection} onTakeoffInfoSaved={handleTakeoffInfoSaved}
              takeoffCategoriesRes={takeoffCategoriesRef.current}
              eligibleTakeoffsRes={eligibleTakeoffsRes} isMarkAsCompleted={isMarkAsCompleted}
            />
          </div>
        </div>

        {isEditDialogLoading && <FullPageLoader />}

        <EditItemModal
          editingItem={editingItem} editingGroupId={editingGroupId}
          onClose={closeEditDialog} onUpdate={handleTakeoffUpdate}
          documentId={selectedDoc?.document_id}
          takeoffData={takeoffData} currentPage={currentPage}
          fetchExtractionForPageSilent={(pg) => fetchExtractionForPageSilent(pg, selectedDoc)}
          setTakeoffData={setTakeoffData} isMarkAsCompleted={isMarkAsCompleted}
          productList={productList}
        />

        <AIDetectionPortal
          showAIDetectionModal={showAIDetectionModal}
          onClose={() => setShowAIDetectionModal(false)}
          documentId={selectedDoc?.document_id}
          currentPage={currentPage}
          onDetect={handleDetectAfterModalSave}
          takeoffCategoriesRes={takeoffCategoriesRef.current}
          eligibleTakeoffsRes={eligibleTakeoffsRes}
        />

        <ConfirmRerunModal
          confirmModal={confirmModal} setConfirmModal={setConfirmModal} currentPage={currentPage}
        />

        {showProceedConfirm && (
          <ProceedConfirmModal
            message={proceedConfirmMessage}
            onConfirm={handleConfirmProceed}
            onClose={() => setShowProceedConfirm(false)}
          />
        )}

        <UnlockUpgradeModal open={showModal} message={upgradeMessage} onClose={() => setShowModal(false)} />

        <OtherTradesModal
          open={showOtherTradesModal}
          onClose={() => {
            setShowOtherTradesModal(false);
            setNonEligibleTrades([]);
            setNonEligibleStagingId(null);
          }}
          onCancel={() => {
            replaceExtractionForPage(currentPage, selectedDoc).catch((e) => {
              showToast("error", e.message);
            });
          }}
          onSubmitDone={async () => {
            setIsProcessing(true);
            try {
              await replaceExtractionForPage(currentPage, selectedDoc);
            } catch (e) {
              showToast("error", e.message);
            } finally {
              setIsProcessing(false);
            }
          }}
          trades={nonEligibleTrades}
          stagingId={nonEligibleStagingId}
        />
      </div>
    </div>
  );
}