import React, { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Search } from "lucide-react";

export function normalizeLabel(key) {
  if (!key) return "";
  return key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function capitalizeFirst(str) {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function normalizeUnitLabel(unit) {
  if (!unit) return null;
  const u = String(unit).trim().toLowerCase();
  if (u === "count") return "Count";
  if (u === "sq_ft" || u === "sqft" || u === "sq ft" || u === "sf") return "sf";
  return u;
}

export function markSingleDefault(opts) {
  let found = false;
  return opts.map((opt) => {
    if (!found && opt.is_default) { found = true; return opt; }
    return { ...opt, is_default: false };
  });
}

export const CustomSelect = ({
  id, options = [], placeholder = "Select", value, onChange,
  openSelect, setOpenSelect, accentColor = "#3b82f6", disabled = false,
  isAddMode = false, searchThreshold = 6,
}) => {
  const btnRef = useRef(null);
  const menuRef = useRef(null);   // outer portal container — used for click-outside
  const listRef = useRef(null);   // inner scrollable list — used for scroll-to-selected
  const searchRef = useRef(null);
  const isOpen = !disabled && openSelect === id;
  const [menuStyle, setMenuStyle] = useState({});
  const [search, setSearch] = useState("");
  const showSearch = options.length > searchThreshold;
  const close = useCallback(() => { setOpenSelect(null); setSearch(""); }, [setOpenSelect]);
  const handleSelect = useCallback((key) => { onChange?.(key); close(); }, [onChange, close]);

  const computeStyle = useCallback(() => {
    if (!btnRef.current) return;
    const rect = btnRef.current.getBoundingClientRect();
    const MENU_MAX_H = 220, GAP = 4;
    const spaceBelow = window.innerHeight - rect.bottom - GAP;
    const spaceAbove = rect.top - GAP;
    const openUp = spaceBelow < MENU_MAX_H && spaceAbove > spaceBelow;
    setMenuStyle({
      position: "fixed", left: rect.left, width: Math.max(rect.width, 380),
      maxHeight: `${Math.min(MENU_MAX_H, openUp ? spaceAbove : spaceBelow)}px`,
      overflowY: "auto", zIndex: 2147483647,
      ...(openUp ? { bottom: window.innerHeight - rect.top + GAP } : { top: rect.bottom + GAP }),
    });
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const h = (e) => {
      if (btnRef.current && !btnRef.current.contains(e.target) &&
        menuRef.current && !menuRef.current.contains(e.target)) close();
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [isOpen, close]);

  useEffect(() => {
    if (!isOpen) return;
    computeStyle();
    if (showSearch) setTimeout(() => searchRef.current?.focus(), 0);
    window.addEventListener("scroll", computeStyle, true);
    window.addEventListener("resize", computeStyle);
    return () => { window.removeEventListener("scroll", computeStyle, true); window.removeEventListener("resize", computeStyle); };
  }, [isOpen, computeStyle, showSearch]);

  useEffect(() => {
    if (!isOpen || !listRef.current) return;
    const idx = options.findIndex((o) => o.key === value);
    if (idx >= 0) listRef.current.scrollTop = Math.max(0, idx * 36 - listRef.current.clientHeight / 2 + 18);
  }, [isOpen, options, value]);

  const displayLabel = options.find((o) => o.key === value)?.label || "";
  const handleOpen = () => { if (disabled) return; computeStyle(); setOpenSelect(isOpen ? null : id); };

  return (
    <div className="tw-relative tw-w-full">
      <button ref={btnRef} type="button" disabled={disabled} onClick={handleOpen}
        className="tw-flex tw-h-10 tw-w-full tw-items-center tw-justify-between tw-rounded-lg tw-border tw-bg-white tw-px-3 tw-text-sm tw-text-gray-800 focus:tw-outline-none disabled:tw-opacity-50 disabled:tw-cursor-not-allowed"
        style={{ borderColor: isOpen ? accentColor : "#e5e7eb", boxShadow: isOpen ? `0 0 0 3px ${accentColor}22` : "0 1px 2px rgba(0,0,0,0.05)", transition: "border-color 0.15s, box-shadow 0.15s" }}>
        <span className={displayLabel ? "tw-text-gray-800" : "tw-text-gray-400"}
          style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", minWidth: 0, flex: 1, textAlign: "left" }}>
          {displayLabel || placeholder}
        </span>
        <ChevronDown className={`tw-h-4 tw-w-4 tw-flex-shrink-0 tw-ml-2 tw-transition-transform tw-duration-200 ${isOpen ? "tw-rotate-180" : ""}`}
          style={{ color: isOpen ? accentColor : "#9ca3af" }} />
      </button>
      {isOpen && createPortal(
        <div ref={menuRef} style={{ ...menuStyle, borderRadius: "10px", border: "1px solid #e5e7eb", background: "#fff", boxShadow: "0 8px 24px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.08)", display: "flex", flexDirection: "column", overflow: "hidden", padding: 0 }}>
          {showSearch && (
            <div style={{ padding: "8px 8px 6px", borderBottom: "1px solid #f3f4f6", flexShrink: 0 }}>
              <div style={{ display: "flex", alignItems: "center", border: "1px solid #e5e7eb", borderRadius: 7, padding: "0 8px", background: "#fff" }}>
                <Search size={13} style={{ color: "#9ca3af", flexShrink: 0, marginRight: 6 }} />
                <input
                  ref={searchRef}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search…"
                  style={{ flex: 1, border: "none", outline: "none", background: "transparent", fontSize: 13, color: "#1f2937", padding: "7px 0" }}
                />
              </div>
            </div>
          )}
          <div ref={listRef} className="custom-visible-scroll" style={{ overflowY: "auto", maxHeight: menuStyle.maxHeight || 220, padding: "4px" }}>
            {(() => {
              const q = search.toLowerCase();
              const filtered = options
                .filter((o) => !search || String(o.label).toLowerCase().includes(q))
                .sort((a, b) => String(a.label).localeCompare(String(b.label), undefined, { numeric: true, sensitivity: "base" }));
              if (filtered.length === 0) return <div className="tw-p-3 tw-text-sm tw-text-gray-400 tw-text-center">No results found</div>;
              return filtered.map((opt, i) => {
                const isSel = value === opt.key;
                const isDefaultHighlight = isAddMode && (opt.key === value);
                return (
                  <div key={i} onMouseDown={(e) => { e.preventDefault(); handleSelect(opt.key); }}
                    style={{
                      display: "flex", alignItems: "center", gap: "8px",
                      padding: "7px 10px", borderRadius: "7px", cursor: "pointer",
                      fontSize: "13.5px",
                      fontWeight: isSel ? 500 : (isDefaultHighlight ? 500 : 400),
                      color: isSel ? accentColor : "#374151",
                      backgroundColor: isSel || isDefaultHighlight ? `${accentColor}12` : "transparent",
                      transition: "background 0.1s, color 0.1s", userSelect: "none",
                    }}
                    onMouseEnter={(e) => { if (!isSel) { e.currentTarget.style.backgroundColor = isDefaultHighlight ? "#e0eeff" : "#f3f4f6"; e.currentTarget.style.color = "#111827"; } }}
                    onMouseLeave={(e) => { if (!isSel) { e.currentTarget.style.backgroundColor = isDefaultHighlight ? "#f0f7ff" : "transparent"; e.currentTarget.style.color = "#374151"; } }}>
                    <span style={{ width: "16px", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", color: accentColor, fontSize: "12px" }}>{isSel ? "✓" : ""}</span>
                    <span style={{ whiteSpace: "normal", wordBreak: "break-word", flex: 1 }}>{opt.label}</span>
                  </div>
                );
              });
            })()}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export const FieldLabel = ({ children }) => (
  <label className="tw-text-sm tw-font-medium tw-text-[#262626] tw-leading-none tw-block">{children}</label>
);

export const InputField = ({ label, field, inputType, unit, editedItem, onChange, disabled, placeholder }) => {
  const isCoats = field === "number_of_coats";
  const isSteps = field === "number_of_steps";
  const isWythes = field === "number_of_wythes";
  const isBars = field === "bars_per_column" || (typeof field === "string" && field.includes("bars_per_column"));
  const isSpecialField = isCoats || isSteps || isWythes || isBars;

  const displayUnit = isSpecialField ? null : normalizeUnitLabel(unit);
  const isCount = displayUnit === "Count";
  const isArea = displayUnit === "sf";

  let effectiveMin = 1;
  let effectiveMax = isCount ? 9 : (isArea ? Infinity : 99);

  if (isCoats) {
    effectiveMin = 1;
    effectiveMax = 10;
  } else if (isSteps || isWythes || isBars) {
    effectiveMin = 1;
    effectiveMax = 99;
  }

  const handleChange = (e) => {
    let val = e.target.value;
    if (inputType === "integer" || isSpecialField) {
      val = val.replace(/[^\d]/g, "");
    }
    const n = parseFloat(val);
    if (!isNaN(n) && n > effectiveMax) return;
    onChange(field, val);
  };
  return (
    <div className="tw-space-y-1.5">
      <FieldLabel>{label}</FieldLabel>
      <div className="tw-relative">
        <input type="number" disabled={disabled}
          value={editedItem[field] !== undefined && editedItem[field] !== null ? editedItem[field] : ""}
          onChange={handleChange}
          onKeyDown={(e) => { if (e.key === "-" || e.key === "e") e.preventDefault(); }}
          step={(inputType === "integer" || isSpecialField) ? "1" : "any"} min={effectiveMin} max={isArea ? undefined : effectiveMax}
          placeholder={placeholder !== undefined ? placeholder : ""}
          className="tw-flex tw-h-10 tw-w-full tw-rounded-md tw-border tw-bg-white tw-px-3 tw-py-2 tw-text-sm tw-text-gray-800 tw-transition-all tw-duration-150 placeholder:tw-text-gray-400 focus:tw-outline-none disabled:tw-opacity-50 disabled:tw-cursor-not-allowed"
          style={{ borderColor: "#d1d5db", paddingRight: displayUnit ? 44 : 12 }}
          onFocus={(e) => { e.target.style.borderColor = "#4488ff"; e.target.style.boxShadow = "0 0 0 3px #4488ff1a"; }}
          onBlur={(e) => {
            e.target.style.borderColor = "#d1d5db"; e.target.style.boxShadow = "none";
            let n = parseFloat(e.target.value);
            if (isNaN(n) || n < effectiveMin) { onChange(field, ""); return; }
            if (!isArea && n > effectiveMax) { n = effectiveMax; onChange(field, n); }
          }} />
        {displayUnit && (
          <span className="tw-absolute tw-right-3 tw-top-1/2 -tw-translate-y-1/2 tw-text-[13px] tw-text-[#667085] tw-pointer-events-none tw-select-none tw-bg-white tw-pl-1">
            {displayUnit}
          </span>
        )}
      </div>
    </div>
  );
};

export const SkeletonField = () => (
  <div className="tw-space-y-2">
    <div className="tw-h-4 tw-w-24 tw-rounded tw-bg-gray-100 tw-animate-pulse" />
    <div className="tw-h-10 tw-w-full tw-rounded-md tw-bg-gray-100 tw-animate-pulse" />
  </div>
);
