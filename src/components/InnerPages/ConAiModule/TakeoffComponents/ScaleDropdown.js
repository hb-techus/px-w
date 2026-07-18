// ─── ScaleDropdown.js ─────────────────────────────────────────────────────────
// Scale selector button + dropdown portal used by TakeoffNavbar.
// Extracted verbatim — no logic changes.

import React, { useState, useRef, useCallback, useEffect } from "react";
import { Ruler, ChevronDown } from "lucide-react";

export const SCALE_OPTIONS = [
  { value: "1_32",   label: "1/32\" = 1'-0\"", group: "Architectural" },
  { value: "1_16",   label: "1/16\" = 1'-0\"", group: "Architectural" },
  { value: "3_32",   label: "3/32\" = 1'-0\"", group: "Architectural" },
  { value: "1_8",    label: "1/8\" = 1'-0\"",  group: "Architectural" },
  { value: "3_16",   label: "3/16\" = 1'-0\"", group: "Architectural" },
  { value: "1_4",    label: "1/4\" = 1'-0\"",  group: "Architectural" },
  { value: "3_8",    label: "3/8\" = 1'-0\"",  group: "Architectural" },
  { value: "1_2",    label: "1/2\" = 1'-0\"",  group: "Architectural" },
  { value: "3_4",    label: "3/4\" = 1'-0\"",  group: "Architectural" },
  { value: "1",      label: "1\" = 1'-0\"",    group: "Architectural" },
  { value: "1_1_2",  label: "1-1/2\" = 1'-0\"", group: "Architectural" },
  { value: "3",      label: "3\" = 1'-0\"",    group: "Architectural" },
  { value: "2",      label: "1\" = 2'",        group: "Engineering" },
  { value: "4",      label: "1\" = 4'",        group: "Engineering" },
  { value: "5",      label: "1\" = 5'",        group: "Engineering" },
  { value: "8",      label: "1\" = 8'",        group: "Engineering" },
  { value: "10",     label: "1\" = 10'",       group: "Engineering" },
  { value: "20",     label: "1\" = 20'",       group: "Engineering" },
  { value: "30",     label: "1\" = 30'",       group: "Engineering" },
  { value: "40",     label: "1\" = 40'",       group: "Engineering" },
  { value: "50",     label: "1\" = 50'",       group: "Engineering" },
  { value: "60",     label: "1\" = 60'",       group: "Engineering" },
  { value: "100",    label: "1\" = 100'",      group: "Engineering" },
];

// ─── ScaleDropdown ────────────────────────────────────────────────────────────
const ScaleDropdown = ({ selectedScale, onScaleChange }) => {
  const [scaleOpen,    setScaleOpen]    = useState(false);
  const [dropdownRect, setDropdownRect] = useState(null);
  const scaleBtnRef  = useRef(null);
  const dropdownRef  = useRef(null);

  const scaleLabel = (() => {
    if (!selectedScale) return "";
    const found = SCALE_OPTIONS.find((s) => s.value === selectedScale);
    if (found) return found.label;
    return SCALE_OPTIONS.find((s) => s.value === "1_8")?.label || "";
  })();

  const openScale = useCallback(() => {
    if (scaleBtnRef.current) {
      const r = scaleBtnRef.current.getBoundingClientRect();
      setDropdownRect({ top: r.bottom + 4, left: r.left, width: Math.max(r.width, 220) });
    }
    setScaleOpen((o) => !o);
  }, []);

  useEffect(() => {
    if (!scaleOpen) return;
    const h = (e) => {
      if (
        dropdownRef.current && !dropdownRef.current.contains(e.target) &&
        scaleBtnRef.current && !scaleBtnRef.current.contains(e.target)
      ) setScaleOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [scaleOpen]);

  return (
    <>
      {/* Trigger button */}
      <button
        ref={scaleBtnRef}
        onClick={openScale}
        style={{
          height: 32, display: "flex", alignItems: "center", gap: 6,
          padding: "0 12px", flexShrink: 0, minWidth: 160,
          fontSize: 13, fontWeight: 500, border: "1px solid #e5e7eb",
          borderRadius: 6, background: "#fff", cursor: "pointer",
          color: "#374151", whiteSpace: "nowrap",
        }}
      >
        <Ruler style={{ width: 14, height: 14, color: "#9ca3af", flexShrink: 0 }} />
        <span style={{ flex: 1, textAlign: "left", fontFamily: "monospace" }}>{scaleLabel}</span>
        <ChevronDown style={{
          width: 12, height: 12, color: "#9ca3af", flexShrink: 0,
          transform: scaleOpen ? "rotate(180deg)" : "none", transition: "transform 0.15s",
        }} />
      </button>

      {/* Dropdown */}
      {scaleOpen && dropdownRect && (
        <>
          <div style={{ position: "fixed", inset: 0, zIndex: 9998 }} onClick={() => setScaleOpen(false)} />
          <div
            ref={dropdownRef}
            style={{
              position: "fixed", zIndex: 9999,
              top: dropdownRect.top, left: dropdownRect.left, width: dropdownRect.width,
              maxHeight: 360, overflowY: "auto",
              background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10,
              boxShadow: "0 12px 40px rgba(0,0,0,0.18)",
            }}
          >
            {["Architectural", "Engineering"].map((grp) => (
              <React.Fragment key={grp}>
                <div style={{
                  padding: "8px 12px 6px", background: "#f9fafb",
                  borderBottom: "1px solid #f0f0f0", position: "sticky", top: 0,
                }}>
                  <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#9ca3af" }}>
                    {grp}
                  </span>
                </div>
                {SCALE_OPTIONS.filter((s) => s.group === grp).map((s) => (
                  <button
                    key={s.value}
                    onClick={() => { onScaleChange?.(s.value); setScaleOpen(false); }}
                    style={{
                      width: "100%", padding: "9px 16px", textAlign: "left", fontSize: 13,
                      fontFamily: "monospace", border: "none", outline: "none", cursor: "pointer",
                      fontWeight: selectedScale === s.value ? 700 : 400,
                      background: selectedScale === s.value ? "#EFF6FF" : "#fff",
                      color: selectedScale === s.value ? "#1476FF" : "#374151",
                    }}
                    onMouseEnter={(e) => { if (selectedScale !== s.value) e.currentTarget.style.background = "#f9fafb"; }}
                    onMouseLeave={(e) => { if (selectedScale !== s.value) e.currentTarget.style.background = "#fff"; }}
                  >
                    {s.label}
                  </button>
                ))}
              </React.Fragment>
            ))}
          </div>
        </>
      )}
    </>
  );
};

export default ScaleDropdown;