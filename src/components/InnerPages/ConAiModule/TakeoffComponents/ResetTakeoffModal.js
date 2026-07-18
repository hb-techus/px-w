// ─── ResetTakeoffModal.js ─────────────────────────────────────────────────────
// Confirmation modal shown before resetting the takeoff for a page.
// Extracted from TakeoffNavbar.js — zero logic changes.

import React from "react";
import { X } from "lucide-react";
import ResetTakeoffImg from "../../../../assets/Images/default_images/reset_takeoff.png";

// Preload the image at module level so it's in the browser cache before the
// modal ever opens (same pattern as the original file).
const _preloadResetImg = new Image();
_preloadResetImg.src = ResetTakeoffImg;

const ResetTakeoffModal = ({ onConfirm, onCancel }) => (
  <div
    style={{
      position: "fixed", inset: 0, zIndex: 99999,
      display: "flex", alignItems: "center", justifyContent: "center",
      background: "rgba(17,24,39,0.45)",
    }}
  >
    <div
      onClick={(e) => e.stopPropagation()}
      style={{
        background: "#fff", borderRadius: 10, padding: "40px 36px 32px",
        width: 440, height: 342, textAlign: "center", position: "relative",
        boxShadow: "0 24px 64px rgba(0,0,0,0.18)",
      }}
    >
      <button
        onClick={onCancel}
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

      <div style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
        <img src={ResetTakeoffImg} alt="reset" style={{ width: 60, height: 60 }} />
      </div>

      <h3 style={{ margin: "16px 0 12px", fontSize: 20, fontWeight: 700, color: "#111827" }}>
        Reset Takeoff
      </h3>
      <p style={{ margin: "0 0 28px", fontSize: 14, lineHeight: 1.65 }}>
        This will clear all AI Predictions/manually drawn shapes and their associated line items.
        This action cannot be undone. Are you sure you want to continue
      </p>

      <button
        onClick={onConfirm}
        style={{
          width: "100%", height: 48, borderRadius: 5, border: "none",
          background: "#ef4444", color: "#fff", fontSize: 15, fontWeight: 600,
          cursor: "pointer", transition: "background 0.15s", letterSpacing: "0.01em",
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = "#dc2626"; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = "#ef4444"; }}
      >
        Yes, Continue
      </button>
    </div>
  </div>
);

export default ResetTakeoffModal;