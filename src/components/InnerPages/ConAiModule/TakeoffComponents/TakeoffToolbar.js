// ─── TakeoffToolbar.js ────────────────────────────────────────────────────────
import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  MousePointer2, Hand, Pentagon, ZoomIn, ZoomOut,
  RotateCcw, Maximize2, PenTool, Cable, Component,
  Spline, Circle, Info, Scan, Scissors,
} from "lucide-react";
import { useTakeoffPermissions } from "./Usetakeoffpermissions";
import TakeoffInfoModal from "./TakeoffInfoModal";

// ─── MAX zoom = 800% of fit-to-screen ────────────────────────────────────────
const MAX_ZOOM = 8;

// ─── Tooltip ─────────────────────────────────────────────────────────────────
const Tooltip = ({ label }) => (
  <div style={{
    position: "absolute", right: "calc(100% + 8px)", top: "50%", transform: "translateY(-50%)",
    zIndex: 9999, pointerEvents: "none", whiteSpace: "nowrap",
    background: "#fff", color: "#1e1d1d", fontSize: 13, fontWeight: 400,
    padding: "5px 12px", borderRadius: 5, border: "1px solid #E5E7EB",
    boxShadow: "0 10px 18px rgba(17,24,39,0.12), 0 2px 6px rgba(17,24,39,0.08)",
  }}>
    {label}
  </div>
);

// ─── Generic tool button ──────────────────────────────────────────────────────
const ToolBtn = ({ title, active = false, onClick, disabled = false, children }) => {
  const [hov, setHov] = useState(false);
  return (
    <div style={{ position: "relative" }} onMouseEnter={() => !disabled && setHov(true)} onMouseLeave={() => setHov(false)}>
      <button
        onClick={disabled ? undefined : onClick}
        style={{
          height: 36, width: 36,
          display: "flex", alignItems: "center", justifyContent: "center",
          borderRadius: 8, border: "none", outline: "none",
          cursor: disabled ? "not-allowed" : "pointer",
          transition: "background 0.15s, color 0.15s",
          background: active ? "#1476FF" : hov ? "#EFF6FF" : "transparent",
          color: active ? "#fff" : hov ? "#1476FF" : disabled ? "#d1d5db" : "#6b7280",
        }}
      >
        {children}
      </button>
      {hov && title && <Tooltip label={title} />}
    </div>
  );
};

const Sep = () => (
  <div style={{ width: 28, height: 1, background: "#e5e7eb", margin: "4px 0", flexShrink: 0 }} />
);

// ─── Drawing tools list ───────────────────────────────────────────────────────
const DRAW_TOOLS = [
  { id: "select", Icon: MousePointer2, label: "Select (V)" },
  { id: "pan",    Icon: Hand,          label: "Pan (H)"    },
];

// ─── Detection sub-tools ─────────────────────────────────────────────────────
export const DETECTION_SUB_TOOLS = [
  { subId: "symbol",   toolId: "rectangle", label: "Symbol",             Icon: Scan,     color: "#3b82f6" },
  { subId: "area",     toolId: "polygon",   label: "Area",               Icon: Pentagon, color: "#3b82f6" },
  { subId: "wall",     toolId: "polygon",   label: "Wall",               Icon: PenTool,  color: "#f97316" },
  { subId: "pipeline", toolId: "polygon",   label: "Pipeline & Wiring",  Icon: Cable,    color: "#a855f7" },
  { subId: "arc",      toolId: "arc",       label: "Arc",                Icon: Spline,   color: "#10b981" },
  { subId: "circle",   toolId: "circle",    label: "Circle",             Icon: Circle,   color: "#ec4899" },
];

// ─── [NEW] Cut sub-tools — only polygon, arc, circle (not symbol/wall/pipeline)
export const CUT_SUB_TOOLS = [
  { subId: "cut_polygon", toolId: "polygon", label: "Polygon", Icon: Pentagon, color: "#3b82f6" },
  { subId: "cut_arc",     toolId: "arc",     label: "Arc",     Icon: Spline,   color: "#10b981" },
  { subId: "cut_circle",  toolId: "circle",  label: "Circle",  Icon: Circle,   color: "#ec4899" },
];

// ─── Detection group button ───────────────────────────────────────────────────
const DetectionGroupBtn = ({ active, onClick, disabled = false  }) => {
  const [hov, setHov] = useState(false);
  return (
    <div style={{ position: "relative" }} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}>
      <button
        onClick={onClick}
        style={{
          height: 36, width: 36,
          display: "flex", alignItems: "center", justifyContent: "center",
          borderRadius: 8, border: "none", outline: "none",
          transition: "background 0.15s, color 0.15s",
          background: active || hov ? "#EFF6FF" : "transparent",
          color:      active || hov ? "#1476FF" : "#6b7280",
          position: "relative",  opacity: disabled ? 0.4 : 1,
      cursor: disabled ? "not-allowed" : "pointer",
        }}
      >
        <Component style={{ width: 17, height: 17 }} />
        {active && (
          <span style={{ position: "absolute", top: 5, right: 5, width: 6, height: 6, borderRadius: "50%", background: "#1476FF" }} />
        )}
      </button>
      {hov && <Tooltip label="Detection Tools" />}
    </div>
  );
};

// ─── [NEW] Cut group button — scissors icon, same style as DetectionGroupBtn ─
const CutGroupBtn = ({ active, onClick }) => {
  const [hov, setHov] = useState(false);
  return (
    <div style={{ position: "relative" }} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}>
      <button
        onClick={onClick}
        style={{
          height: 36, width: 36,
          display: "flex", alignItems: "center", justifyContent: "center",
          borderRadius: 8, border: "none", outline: "none", cursor: "pointer",
          transition: "background 0.15s, color 0.15s",
          background: active || hov ? "#EFF6FF" : "transparent",
          color:      active || hov ? "#1476FF" : "#6b7280",
          position: "relative",
        }}
      >
        <Scissors style={{ width: 17, height: 17 }} />
        {active && (
          <span style={{ position: "absolute", top: 5, right: 5, width: 6, height: 6, borderRadius: "50%", background: "#1476FF" }} />
        )}
      </button>
      {hov && <Tooltip label="Cut Tools" />}
    </div>
  );
};

// ─── Sub-tool row ─────────────────────────────────────────────────────────────
const SubToolRow = React.memo(({ sub, isActive, onClick }) => {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: "flex", alignItems: "center", gap: 10,
        width: "100%", padding: "7px 14px",
        borderRadius: 6, cursor: "pointer", border: "none", outline: "none",
        background: isActive ? "#f0f7ff" : hov ? "#f5f5f5" : "transparent",
        transition: "background 0.12s", textAlign: "left",
      }}
    >
      <span style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 20, height: 20, flexShrink: 0, color: sub.color }}>
        <sub.Icon style={{ width: 16, height: 16 }} />
      </span>
      <span style={{ fontSize: 14, fontWeight: 400, color: isActive ? "#111827" : "#374151", flex: 1 }}>
        {sub.label}
      </span>
    </button>
  );
});
SubToolRow.displayName = "SubToolRow";

// ─── Inline editable zoom input ───────────────────────────────────────────────
function ZoomInput({ displayZoom, fitScale, onZoomTo }) {
  const [editing, setEditing] = React.useState(false);
  const [draft,   setDraft]   = React.useState("");

  const commit = () => {
    setEditing(false);
    const parsed = parseInt(draft, 10);
    if (!isNaN(parsed) && onZoomTo && fitScale) {
      const clamped = Math.max(50, Math.min(Math.round(MAX_ZOOM * 100), parsed));
      onZoomTo(clamped / 100 * fitScale);
    }
  };

  if (editing) {
    return (
      <input
        value={draft}
        onChange={(e) => setDraft(e.target.value.replace(/[^0-9]/g, ""))}
        onBlur={commit}
        onKeyDown={(e) => { if (e.key === "Enter") commit(); if (e.key === "Escape") setEditing(false); }}
        style={{ width: 36, fontSize: 11, fontWeight: 700, color: "#374151", border: "1px solid #d1d5db", borderRadius: 4, textAlign: "center", padding: "2px 0", outline: "none", background: "#f9fafb" }}
        autoFocus
      />
    );
  }
  return (
    <span
      title="Click to set zoom level"
      onClick={() => { setDraft(String(displayZoom)); setEditing(true); }}
      style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", userSelect: "none", lineHeight: 1, padding: "3px 0", cursor: "pointer" }}
    >
      {displayZoom}%
    </span>
  );
}

// ─── Main Toolbar ─────────────────────────────────────────────────────────────
const TakeoffToolbar = React.memo(({
  tool, scale, fitScale, activeObjectType,
  onToolChange, onObjectTypeChange, isMarkAsCompleted = false,
  onZoomIn, onZoomOut, onResetZoom, onFitToScreen, onZoomTo,
  guardAction, currentPage, documentId,
  takeoffCategoriesRes, eligibleTakeoffsRes, onTakeoffInfoSaved,
}) => {
  const [showDetectionPopup, setShowDetectionPopup] = useState(false);
  // ── [NEW] separate state for Cut Tools popup
  const [showCutPopup,       setShowCutPopup]       = useState(false);
  const [showTakeoffInfo,    setShowTakeoffInfo]    = useState(false);
  const containerRef    = useRef(null);
  // ── [NEW] separate ref for Cut Tools container
  const cutContainerRef = useRef(null);
  const guardActionRef  = useRef(guardAction);
  useEffect(() => { guardActionRef.current = guardAction; }, [guardAction]);

  const { planStudio: psPerm } = useTakeoffPermissions();
  const showDrawingTools = psPerm.drawingToolsAccess !== false;

  // ── Close Detection popup on outside click ────────────────────────────────
  useEffect(() => {
    if (!showDetectionPopup) return;
    const h = (e) => { if (containerRef.current && !containerRef.current.contains(e.target)) setShowDetectionPopup(false); };
    document.addEventListener("mousedown", h, true);
    return () => document.removeEventListener("mousedown", h, true);
  }, [showDetectionPopup]);

  // ── [NEW] Close Cut popup on outside click ────────────────────────────────
  useEffect(() => {
    if (!showCutPopup) return;
    const h = (e) => { if (cutContainerRef.current && !cutContainerRef.current.contains(e.target)) setShowCutPopup(false); };
    document.addEventListener("mousedown", h, true);
    return () => document.removeEventListener("mousedown", h, true);
  }, [showCutPopup]);

  const handleStandardTool = useCallback((toolId) => {
    onToolChange(toolId); onObjectTypeChange(null);
    setShowDetectionPopup(false);
    setShowCutPopup(false); // ── [NEW] close cut popup too
  }, [onToolChange, onObjectTypeChange]);

const handleSubTool = useCallback((sub) => {
  if (isMarkAsCompleted) return;
  if (guardActionRef.current?.("drawing_tools_access", "Drawing Tools")) return;
  // Only call onObjectTypeChange — workspace's handleToolbarObjectTypeChange sets the tool
  onObjectTypeChange(sub.subId);
  setShowDetectionPopup(false);
}, [onObjectTypeChange, isMarkAsCompleted]);

  // ── [NEW] handler for selecting a Cut sub-tool ────────────────────────────
  const handleCutSubTool = useCallback((sub) => {
  if (isMarkAsCompleted) return;
  if (guardActionRef.current?.("drawing_tools_access", "Drawing Tools")) return;
  // Don't call onToolChange here — let onObjectTypeChange trigger
  // the tool mapping in TakeoffWorkspace's handleToolbarObjectTypeChange
  onObjectTypeChange(sub.subId); // "cut_polygon", "cut_arc", "cut_circle"
  setShowCutPopup(false);
  setShowDetectionPopup(false);
}, [onObjectTypeChange, isMarkAsCompleted]);

  const handleDetectionGroupClick = useCallback(() => {
     if (isMarkAsCompleted) return;
    if (guardActionRef.current?.("drawing_tools_access", "Drawing Tools")) return;
    setShowDetectionPopup((p) => !p);
    setShowCutPopup(false); // ── [NEW] close cut popup when detection opens
  }, [isMarkAsCompleted]);

  // ── [NEW] handler for Cut Tools group button ──────────────────────────────
  const handleCutGroupClick = useCallback(() => {
    if (isMarkAsCompleted) return; 
    if (guardActionRef.current?.("drawing_tools_access", "Drawing Tools")) return;
    setShowCutPopup((p) => !p);
    setShowDetectionPopup(false); // close detection popup when cut opens
  }, [isMarkAsCompleted]);

  const effectiveFitScale = (fitScale && fitScale > 0) ? fitScale : (scale ?? 1);
  const displayZoom       = Math.round(((scale ?? 1) / effectiveFitScale) * 100);
  const atMaxZoom         = (scale ?? 1) >= effectiveFitScale * 8;
  const detectionActive   = showDetectionPopup || (!!activeObjectType && !activeObjectType.startsWith("cut_"));
  // ── [NEW] cut group is "active" when cut popup open OR a cut sub-tool is selected
  const cutActive         = showCutPopup || (!!activeObjectType && activeObjectType.startsWith("cut_"));
  const pageNumber        = (currentPage ?? 0) + 1;

  return (
    <>
      <div style={{ width: 48, minWidth: 48, height: "100%", background: "#fff", borderLeft: "1px solid #e5e7eb", display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 10, paddingBottom: 12, gap: 2, boxSizing: "border-box", overflow: "visible", position: "relative" }}>

        {DRAW_TOOLS.map(({ id, Icon, label }) => (
          <ToolBtn key={id} title={label} active={tool === id && !activeObjectType} onClick={() => handleStandardTool(id)}>
            <Icon style={{ width: 17, height: 17 }} />
          </ToolBtn>
        ))}

        <Sep />

        {showDrawingTools && (
          <>
            {/* ── Detection Tools group ── */}
            <div ref={containerRef} style={{ position: "relative" }}>
              <DetectionGroupBtn active={detectionActive} onClick={handleDetectionGroupClick} disabled={isMarkAsCompleted}/>
              {showDetectionPopup && (
                <div style={{ position: "absolute", right: "calc(100% + 8px)", top: 0, zIndex: 9999, background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, boxShadow: "0 10px 32px rgba(17,24,39,0.14), 0 2px 8px rgba(17,24,39,0.07)", minWidth: 200, overflow: "hidden" }}>
                  <div style={{ padding: "12px 16px 8px" }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "#9ca3af", letterSpacing: "0.12em", textTransform: "uppercase" }}>Detection Tools</span>
                  </div>
                  <div style={{ padding: "2px 6px 10px", display: "flex", flexDirection: "column", gap: 1 }}>
                    {DETECTION_SUB_TOOLS.map((sub) => (
                      <SubToolRow key={sub.subId} sub={sub} isActive={activeObjectType === sub.subId} onClick={() => handleSubTool(sub)} />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* ── [NEW] Cut Tools group ── */}
            <div ref={cutContainerRef} style={{ position: "relative" }}>
              <CutGroupBtn active={cutActive} onClick={handleCutGroupClick} disabled={isMarkAsCompleted}  />
              {showCutPopup && (
                <div style={{ position: "absolute", right: "calc(100% + 8px)", top: 0, zIndex: 9999, background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, boxShadow: "0 10px 32px rgba(17,24,39,0.14), 0 2px 8px rgba(17,24,39,0.07)", minWidth: 200, overflow: "hidden" }}>
                  <div style={{ padding: "12px 16px 8px" }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "#9ca3af", letterSpacing: "0.12em", textTransform: "uppercase" }}>Cut Tools</span>
                  </div>
                  <div style={{ padding: "2px 6px 10px", display: "flex", flexDirection: "column", gap: 1 }}>
                    {CUT_SUB_TOOLS.map((sub) => (
                      <SubToolRow key={sub.subId} sub={sub} isActive={activeObjectType === sub.subId} onClick={() => handleCutSubTool(sub)} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        <ToolBtn title="Takeoff Info" onClick={() => setShowTakeoffInfo(true)}>
          <Info style={{ width: 17, height: 17 }} />
        </ToolBtn>

        <Sep />

        <ToolBtn title={atMaxZoom ? `Maximum zoom (${displayZoom}%)` : "Zoom In"} disabled={atMaxZoom} onClick={onZoomIn}>
          <ZoomIn style={{ width: 17, height: 17 }} />
        </ToolBtn>
        <ZoomInput displayZoom={displayZoom} fitScale={effectiveFitScale} onZoomTo={onZoomTo} />
        <ToolBtn title="Zoom Out" onClick={onZoomOut}>
          <ZoomOut style={{ width: 17, height: 17 }} />
        </ToolBtn>

        <Sep />

        <ToolBtn title="Reset Zoom" onClick={onResetZoom}>
          <RotateCcw style={{ width: 17, height: 17 }} />
        </ToolBtn>
        <ToolBtn title="Fit to Screen" onClick={onFitToScreen}>
          <Maximize2 style={{ width: 17, height: 17 }} />
        </ToolBtn>

        <Sep />
      </div>

      <TakeoffInfoModal
        open={showTakeoffInfo}
        onClose={() => setShowTakeoffInfo(false)}
        documentId={documentId}
        pageNumber={pageNumber}
        onSaved={onTakeoffInfoSaved}
        takeoffCategoriesRes={takeoffCategoriesRes}
        eligibleTakeoffsRes={eligibleTakeoffsRes} isMarkAsCompleted={isMarkAsCompleted}
      />
    </>
  );
});

TakeoffToolbar.displayName = "TakeoffToolbar";
export default TakeoffToolbar;