// ─── TakeoffNavbar.js ─────────────────────────────────────────────────────────
import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  ChevronLeft, ChevronRight, PanelLeft, LayoutGrid,
  Wand2, Scan, Calculator, Minimize2, Fullscreen,
} from "lucide-react";
import FullPageLoader from "../../../../genriccomponents/loaders/FullPageLoader";
import { useTakeoffPermissions } from "./Usetakeoffpermissions";
import { NavIconBtn, ResetTakeoffBtn } from "./NavbarShared";
import ResetTakeoffModal from "./ResetTakeoffModal";
import ScaleDropdown from "./ScaleDropdown";
import greenTick from "../../../../assets/Images/default_images/green_tick.png";

const Navbar = React.memo(({
  sidebarCollapsed, showThumbnails,
  currentPage, totalPages, pageInputValue, selectedScale,
  aiDetectionComplete = false,
  aiExtractionComplete = false,
  extractedPages = new Set(),
  anyExtractionDone = false,
  onToggleSidebar, onToggleThumbnails,
  onPageChange, onPageInputChange, onPageInputBlur,
  onAIDetection, onAIExtraction, onCalculateEstimation, onScaleChange,
  onResetTakeoff, isMarkAsCompleted = false,
  guardAction, hasManualDrawingsOnPage = false,
  extractionResetByRerun = false, aiDetectionActuallyRan = false, drawnSinceExtraction = false,
}) => {
  const [showResetModal, setShowResetModal] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const justCommitted = useRef(false);

  // ── Permission flags ────────────────────────────────────────────────────────
  const { planStudio: psPerm } = useTakeoffPermissions();
  const showDetection = psPerm.detectionAccess !== false;
  const showExtraction = psPerm.extractionAccess !== false;
  const showProceed = psPerm.proceedAccess !== false;

  const anyPageExtracted = anyExtractionDone || extractedPages.size > 0;
  const extractionEnabled = aiDetectionComplete || hasManualDrawingsOnPage;
  // const detectionIsDone = aiDetectionComplete || aiDetectionActuallyRan;
  const detectionIsDone = aiDetectionActuallyRan || (aiDetectionComplete && !hasManualDrawingsOnPage);
  // const extractionIsDone = aiExtractionComplete && !extractionResetByRerun;
const extractionIsDone = aiExtractionComplete && !extractionResetByRerun && !drawnSinceExtraction;

  // ── Fullscreen ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (!isFullscreen) {
      window.dispatchEvent(new Event("takeoff-fullscreen-enter"));
      setIsFullscreen(true);
    } else {
      window.dispatchEvent(new Event("takeoff-fullscreen-exit"));
      setIsFullscreen(false);
    }
  }, [isFullscreen]);

  // ── Page input ──────────────────────────────────────────────────────────────
  const handlePageInputChange = useCallback((e) => {
    onPageInputChange(e.target.value.replace(/[^\d]/g, ""));
  }, [onPageInputChange]);

  const handlePageKeyDown = useCallback((e) => {
    if (e.key === "Enter") { justCommitted.current = true; onPageInputBlur(); e.target.blur(); }
  }, [onPageInputBlur]);

  const handlePageBlur = useCallback(() => {
    if (justCommitted.current) { justCommitted.current = false; return; }
    onPageInputBlur();
  }, [onPageInputBlur]);

  // ── Button click handlers ───────────────────────────────────────────────────
  const handleAIDetectionClick = useCallback(() => {
    if (isMarkAsCompleted) return;
    if (guardAction("ai_detection", "AI Detection")) return;
    onAIDetection();
  }, [guardAction, onAIDetection, isMarkAsCompleted]);

  const handleAIExtractionClick = useCallback(() => {
    if (isMarkAsCompleted) return;
    if (guardAction("ai_extraction", "AI Extraction")) return;
    if (extractionEnabled) onAIExtraction();
  }, [guardAction, onAIExtraction, extractionEnabled, isMarkAsCompleted]);

  const handleCalculateEstimationClick = useCallback(() => {
    if (guardAction("proceed_to_estimation", "Proceed to Estimate")) return;
    if (anyPageExtracted) onCalculateEstimation();
  }, [guardAction, onCalculateEstimation, anyPageExtracted]);

  const handleResetConfirm = async () => {
    setShowResetModal(false);
    setResetLoading(true);
    try { await onResetTakeoff?.(); }
    catch (err) { console.error("Reset failed:", err); }
    finally { setResetLoading(false); }
  };

  // ── Button style helpers ─────────────────────────────────────────────────────
  const detectionBtnStyle = {
    height: 32,
    display: showDetection ? "flex" : "none",
    alignItems: "center",
    gap: 6,
    padding: "0 16px",
    flexShrink: 0,
    fontSize: 13,
    fontWeight: 500,
    borderRadius: 6,
    whiteSpace: "nowrap",
    cursor: isMarkAsCompleted ? "not-allowed" : "pointer",
    opacity: isMarkAsCompleted ? 0.8 : 1,
    background: detectionIsDone ? "#fff" : "#1476FF",
    color: detectionIsDone ? "#1476FF" : "#fff",
    border: detectionIsDone ? "1.5px solid #1476FF" : "1.5px solid transparent",
  };

  const extractionDisabled = !extractionEnabled || isMarkAsCompleted;
  const extractionBtnStyle = {
    height: 32,
    display: showExtraction ? "flex" : "none",
    alignItems: "center",
    gap: 6,
    padding: "0 16px",
    flexShrink: 0,
    fontSize: 13,
    fontWeight: 500,
    borderRadius: 6,
    whiteSpace: "nowrap",
    transition: "all 0.15s",
    cursor: extractionDisabled ? "not-allowed" : "pointer",
    opacity: extractionDisabled ? 0.8 : 1,
    background: extractionDisabled
      ? "#fff"
      : extractionIsDone
        ? "#fff"
        : "#1476FF",
    color: extractionDisabled
      ? "#b0b0b0"
      : extractionIsDone
        ? "#1476FF"
        : "#fff",
    border: extractionDisabled
      ? "1.5px solid #e5e7eb"
      : "1.5px solid #1476FF",
  };

  return (
    <>
      {resetLoading && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 99998,
          background: "rgb(0 0 0 / 0.3)",
          display: "flex", alignItems: "center", justifyContent: "center",
          pointerEvents: "all",
        }}>
          <FullPageLoader />
        </div>
      )}

      <div style={{ borderBottom: "1px solid #e5e7eb", background: "#fff", zIndex: 100, flexShrink: 0 }}>
        <div
          className="takeoff-nav-scroll"
          style={{ display: "flex", alignItems: "center", padding: "0 12px", height: 52, gap: 8, overflowX: "auto" }}
        >
          {/* ── Sidebar / thumbnail toggles + page controls ── */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
            {!sidebarCollapsed && (
              <NavIconBtn onClick={onToggleSidebar} tooltip="Hide Takeoffs">
                <PanelLeft style={{ width: 16, height: 16 }} />
              </NavIconBtn>
            )}
            <NavIconBtn onClick={onToggleThumbnails} tooltip="Page Thumbnails" active={showThumbnails}>
              <LayoutGrid style={{ width: 16, height: 16 }} />
            </NavIconBtn>
            <div style={{ width: 1, height: 24, background: "#e5e7eb", margin: "0 4px", flexShrink: 0 }} />
            <NavIconBtn onClick={() => onPageChange(currentPage - 1)} disabled={currentPage <= 0} tooltip="Previous Page">
              <ChevronLeft style={{ width: 16, height: 16 }} />
            </NavIconBtn>
            <input
              type="text" inputMode="numeric" value={pageInputValue}
              onChange={handlePageInputChange} onBlur={handlePageBlur} onKeyDown={handlePageKeyDown}
              style={{
                width: 40, height: 28, textAlign: "center", fontSize: 13,
                border: "1px solid #e5e7eb", borderRadius: 6, outline: "none",
                background: "#fff", color: "#111", flexShrink: 0,
              }}
            />
            <span style={{ fontSize: 13, color: "#9ca3af", whiteSpace: "nowrap", flexShrink: 0 }}>
              / {totalPages}
            </span>
            <NavIconBtn onClick={() => onPageChange(currentPage + 1)} disabled={currentPage >= totalPages - 1} tooltip="Next Page">
              <ChevronRight style={{ width: 16, height: 16 }} />
            </NavIconBtn>
          </div>

          <div style={{ flex: 1, minWidth: 16, flexShrink: 0 }} />

          {/* ── Scale selector ── */}
          <div style={{ cursor: isMarkAsCompleted ? "not-allowed" : "auto" }}>
            <div style={{ pointerEvents: isMarkAsCompleted ? "none" : "auto", opacity: isMarkAsCompleted ? 0.8 : 1 }}>
              <ScaleDropdown selectedScale={selectedScale} onScaleChange={onScaleChange} />
            </div>
          </div>

          {/* ── AI Detection ── */}
          <button onClick={handleAIDetectionClick} style={detectionBtnStyle}>
            {detectionIsDone && (
              <img src={greenTick} alt="done" style={{ width: 16, height: 16, flexShrink: 0 }} />
            )}
            <Wand2 style={{ width: 14, height: 14, flexShrink: 0 }} />
            AI Detection
          </button>

          {/* ── AI Extraction ── */}
          <button
            onClick={handleAIExtractionClick}
            disabled={extractionDisabled}
            style={extractionBtnStyle}
          >
            {extractionIsDone && !extractionDisabled && (
              <img src={greenTick} alt="done" style={{ width: 16, height: 16, flexShrink: 0 }} />
            )}
            <Scan style={{ width: 14, height: 14, flexShrink: 0 }} />
            AI Extraction
          </button>

          {/* ── Reset button ── */}
          {showDetection && (
            <ResetTakeoffBtn
              disabled={(!aiDetectionComplete && !hasManualDrawingsOnPage) || isMarkAsCompleted}
              onClick={() => setShowResetModal(true)}
            />
          )}

          {/* ── Proceed to Estimate ── */}
          <button
            onClick={handleCalculateEstimationClick}
            disabled={!anyPageExtracted}
            style={{
              height: 32,
              display: showProceed ? "flex" : "none",
              alignItems: "center",
              gap: 6,
              padding: "0 16px",
              flexShrink: 0,
              fontSize: 13,
              fontWeight: 500,
              borderRadius: 6,
              whiteSpace: "nowrap",
              transition: "all 0.15s",
              cursor: !anyPageExtracted ? "not-allowed" : "pointer",
              border: anyPageExtracted ? "1.5px solid #1476FF" : "1.5px solid #e5e7eb",
              color: anyPageExtracted ? "#1476FF" : "#b0b0b0",
              opacity: !anyPageExtracted ? 0.8 : 1,
            }}
          >
            <Calculator style={{ width: 14, height: 14, flexShrink: 0 }} />
            Proceed to Estimate
          </button>

          <div style={{ flex: 1, minWidth: 16, flexShrink: 0 }} />

          {/* ── Fullscreen ── */}
          <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
            <NavIconBtn
              onClick={toggleFullscreen}
              tooltip={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
              active={isFullscreen}
            >
              {isFullscreen
                ? <Minimize2 style={{ width: 16, height: 16 }} />
                : <Fullscreen style={{ width: 16, height: 16 }} />}
            </NavIconBtn>
          </div>
        </div>
      </div>

      {/* ── Reset Takeoff Modal ── */}
      {showResetModal && (
        <ResetTakeoffModal onConfirm={handleResetConfirm} onCancel={() => setShowResetModal(false)} />
      )}
    </>
  );
});

Navbar.displayName = "TakeoffNavbar";
export default Navbar;