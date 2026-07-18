// ─── ToolbarShared.js ─────────────────────────────────────────────────────────
// Shared UI primitives used by TakeoffToolbar modals (TakeoffInfoModal,
// WorkspaceAIDetectionModal).  No business logic — pure presentational.

import React from "react";
import { X, ChevronDown, Check } from "lucide-react";

// ─── Label / key maps (used by both modals) ───────────────────────────────────
export const LABEL_MAP = {
  drywall:           "Drywall",
  paint:             "Painting",
  doors_and_windows: "Doors & Windows",
  flooring:          "Flooring",
  ceiling:           "Ceiling",
  hvac:              "HVAC",
  roofing:           "Roofing",
  electrical:        "Electrical",
  concrete:          "Concrete",
  masonry:           "Masonry",
  mechanical:        "Mechanical",
  plumbing:          "Plumbing",
  siding:            "Siding",
  steel:             "Steel",
};

export const API_TO_SYSTEM_KEY_MAP = {
  flooring:          "flooring",
  ceiling:           "ceiling",
  painting:          "paint",
  paint:             "paint",
  drywall:           "drywall",
  roofing:           "roofing",
  concrete:          "concrete",
  siding:            "siding",
  masonry:           "masonry",
  door_window:       "doors_and_windows",
  doors_and_windows: "doors_and_windows",
  mechanical:        "mechanical",
  electrical:        "electrical",
  plumbing:          "plumbing",
  hvac:              "hvac",
  steel:             "steel",
};

export const ALLOWED_KEYS = [
  "flooring", "ceiling", "paint", "drywall", "roofing", "concrete",
  "siding", "masonry", "doors_and_windows", "mechanical", "electrical",
  "plumbing", "hvac", "steel",
];

export const normalizeLabel = (text = "") =>
  text.replace(/[_.]/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());

export const parseCategories = (res) => {
  let d = res?.data || res;
  if (typeof d === "string") { try { d = JSON.parse(d); } catch { return []; } }
  const list = d?.valid ? (Array.isArray(d.data) ? d.data : []) : [];
  if (!list.length) return [];
  return list.map((cat) => {
    const raw = (cat.takeoff_name || "").toLowerCase().trim();
    const mappedKey = API_TO_SYSTEM_KEY_MAP[raw];
    if (!mappedKey || !ALLOWED_KEYS.includes(mappedKey)) return null;
    return { key: mappedKey, label: LABEL_MAP[mappedKey] || normalizeLabel(mappedKey) };
  }).filter(Boolean);
};

// ─── ModalShell ───────────────────────────────────────────────────────────────
export const ModalShell = ({ onClose, children, footer }) => (
  <div style={{
    position: "fixed", inset: 0,
    background: "rgba(17,24,39,0.45)",
    display: "flex", alignItems: "center", justifyContent: "center",
    zIndex: 99999, padding: "24px 0",
  }}>
    <div style={{
      background: "#fff", borderRadius: 12,
      width: 520, maxWidth: "96vw",
      maxHeight: "calc(100vh - 48px)",
      display: "flex", flexDirection: "column",
      position: "relative",
      boxShadow: "0 20px 60px rgba(17,24,39,0.18)",
      overflow: "hidden",
    }}>
      <div style={{
        flex: 1, overflowY: "auto",
        padding: "32px 32px 0",
        scrollbarWidth: "thin", scrollbarColor: "#DEE9FF transparent",
      }}>
        <button
          onClick={onClose}
          style={{
            position: "absolute", top: 14, right: 14,
            background: "transparent", border: "1px solid #6b7280", borderRadius: "50%",
            width: 24, height: 24, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#6b7280", padding: 0,
          }}
        >
          <X style={{ width: 14, height: 14 }} />
        </button>
        {children}
        <div style={{ height: 24 }} />
      </div>
      {footer}
    </div>
  </div>
);

// ─── TakeoffDropdown — shared multiselect dropdown + chips ────────────────────
export const TakeoffDropdown = ({ dropRef, dropOpen, onDropOpen, dropOptions, selected, toggleItem, triggerLabel }) => (
  <div ref={dropRef} style={{ position: "relative" }}>
    <button
      onClick={onDropOpen}
      style={{
        width: "100%",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "10px 14px", background: "#fff",
        border: "1px solid #E5E7EB", borderRadius: 8,
        cursor: "pointer", fontSize: 14,
        color: selected.size > 0 ? "#111827" : "#9CA3AF",
        outline: "none", fontFamily: "inherit",
      }}
    >
      <span>{triggerLabel}</span>
      <ChevronDown style={{
        width: 16, height: 16, color: "#9CA3AF", flexShrink: 0,
        transform: dropOpen ? "rotate(180deg)" : "none",
        transition: "transform 0.15s",
      }} />
    </button>

    {dropOpen && (
      <div style={{
        position: "absolute",
        bottom: "calc(100% + 4px)",
        left: 0, right: 0,
        background: "#fff", border: "1px solid #E5E7EB", borderRadius: 8,
        zIndex: 9999, maxHeight: 240, overflowY: "auto",
        boxShadow: "0 -6px 24px rgba(17,24,39,0.10)",
        scrollbarWidth: "thin", scrollbarColor: "#DEE9FF transparent",
      }}>
        {dropOptions.length === 0 ? (
          <div style={{ padding: "14px 16px", fontSize: 14, color: "#9CA3AF", textAlign: "center" }}>
            No options available
          </div>
        ) : dropOptions.map(({ key, label }) => {
          const checked = selected.has(key);
          return (
            <div
              key={key}
              onClick={() => toggleItem(key)}
              style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 16px", cursor: "pointer", userSelect: "none" }}
            >
              <span style={{
                width: 18, height: 18, borderRadius: 4, flexShrink: 0,
                border: checked ? "none" : "1.5px solid #D1D5DB",
                background: checked ? "#2563EB" : "#fff",
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "background 0.1s",
              }}>
                {checked && <Check style={{ width: 11, height: 11, color: "#fff" }} strokeWidth={3} />}
              </span>
              <span style={{ fontSize: 14, fontWeight: 400, color: "#111827", fontFamily: "inherit" }}>{label}</span>
            </div>
          );
        })}
      </div>
    )}

    {selected.size > 0 && (
      <div style={{
        display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10,
        maxHeight: 90, overflowY: "auto", paddingBottom: 2,
        scrollbarWidth: "thin", scrollbarColor: "#DEE9FF transparent",
      }}>
        {[...selected].map((k) => {
          const opt   = dropOptions.find((o) => o.key === k);
          const label = opt?.label ?? LABEL_MAP[String(k).toLowerCase().replace(/\s+/g, "_")] ?? normalizeLabel(String(k));
          return (
            <span key={k} style={{
              display: "inline-flex", alignItems: "center", gap: 4,
              background: "#fff", border: "1px solid #E5E7EB",
              borderRadius: 6, padding: "4px 10px",
              fontSize: 13, color: "#374151", fontFamily: "inherit", flexShrink: 0,
            }}>
              {label}
              <button
                onClick={(e) => { e.stopPropagation(); toggleItem(k); }}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#9CA3AF", padding: 0, lineHeight: 1, display: "flex", alignItems: "center" }}
              >
                <X style={{ width: 12, height: 12 }} />
              </button>
            </span>
          );
        })}
      </div>
    )}
  </div>
);