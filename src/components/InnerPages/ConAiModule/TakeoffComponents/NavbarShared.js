// ─── NavbarShared.js ──────────────────────────────────────────────────────────
// Shared micro-components used by TakeoffNavbar (and optionally others).
// No business logic — pure UI primitives.

import React, { useState, useEffect, useRef } from "react";

// ─── Floating tooltip ─────────────────────────────────────────────────────────
export const Tooltip = ({ label, btnRef, show }) => {
  const [pos, setPos] = useState({ top: 0, left: 0 });
  useEffect(() => {
    if (!show || !btnRef?.current) return;
    const r = btnRef.current.getBoundingClientRect();
    setPos({ top: r.bottom + 8, left: r.left + r.width / 2 });
  }, [show, btnRef]);
  if (!show) return null;
  return (
    <div style={{
      position: "fixed", top: pos.top, left: pos.left, transform: "translateX(-50%)",
      zIndex: 99999, pointerEvents: "none", whiteSpace: "nowrap",
      background: "#fff", color: "#1e1d1d", fontSize: 13, fontWeight: 400,
      padding: "5px 12px", borderRadius: 5, border: "1px solid #E5E7EB",
      boxShadow: "0 10px 18px rgba(17,24,39,0.12), 0 2px 6px rgba(17,24,39,0.08)",
    }}>{label}</div>
  );
};

// ─── Icon button with hover highlight + tooltip ───────────────────────────────
export const NavIconBtn = ({ onClick, disabled = false, active = false, tooltip, children }) => {
  const [hov, setHov] = useState(false);
  const ref = useRef(null);
  const hi = active || hov;
  return (
    <>
      <button
        ref={ref} onClick={onClick} disabled={disabled}
        onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
        style={{
          height: 32, width: 32, flexShrink: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
          borderRadius: 6, border: "none", outline: "none",
          cursor: disabled ? "not-allowed" : "pointer",
          opacity: disabled ? 0.4 : 1,
          transition: "background 0.15s, color 0.15s",
          background: hi ? "#EFF6FF" : "transparent",
          color: hi ? "#1476FF" : "#6b7280",
        }}
      >{children}</button>
      {tooltip && <Tooltip label={tooltip} btnRef={ref} show={hov} />}
    </>
  );
};

// ─── Reset Takeoff icon button ────────────────────────────────────────────────
export const ResetTakeoffBtn = ({ disabled, onClick }) => {
  const [hov, setHov] = useState(false);
  const btnRef = useRef(null);
  return (
    <>
      <button
        ref={btnRef}
        onClick={disabled ? undefined : onClick}
        disabled={disabled}
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        style={{
          height: 32, width: 32, flexShrink: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
          borderRadius: 6, outline: "none",
          cursor: disabled ? "not-allowed" : "pointer",
          transition: "background 0.15s",
          border: disabled ? "1.5px solid #e5e7eb" : "1.5px solid #ef4444",
          background: !disabled && hov ? "#FEF2F2" : "#fff",
        }}
      >
        <i className="icon-reset" style={{ fontSize: 16, color: disabled ? "#d1d5db" : "#ef4444" }} />
      </button>
      <Tooltip label="Reset Takeoff" btnRef={btnRef} show={hov} />
    </>
  );
};