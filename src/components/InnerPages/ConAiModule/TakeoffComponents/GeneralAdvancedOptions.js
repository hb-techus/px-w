import React from "react";
import { X, ChevronDown, Check, Info } from "lucide-react";
import Tippy from "@tippyjs/react";
import "tippy.js/dist/tippy.css";

const MODES = [
  { key: "all",      label: "Apply to all",           hasTooltip: true  },
  { key: "selected", label: "Apply to selected",       hasTooltip: true  },
  { key: "this",     label: "Apply to this item only", hasTooltip: false },
];

const GeneralAdvancedOptions = ({
  resolvedType,
  nameDraft, itemName,
  generalAdvancedOpen, setGeneralAdvancedOpen,
  generalApplyMode, setGeneralApplyMode,
  generalItemsDropOpen, setGeneralItemsDropOpen,
  generalItemSearch, setGeneralItemSearch,
  generalItemsBtnRef, generalItemsListRef,
  generalSelectedItems, setGeneralSelectedItems,
  generalTargets, isLoadingGeneralTargets,
}) => {
  const isSymbolTrade = ["electrical", "hvac", "mechanical", "plumbing", "doors"].includes(resolvedType);
  const itemLabel = nameDraft || itemName || "this item";

  const tooltipFor = (key) =>
    key === "all"
      ? `Apply ${itemLabel}'s values to all items in this trade.`
      : `Apply ${itemLabel}'s values to the selected items in this trade.`;

  const handleModeClick = (key) => {
    if (isSymbolTrade) return;
    setGeneralApplyMode(key);
    if (key !== "selected") setGeneralItemsDropOpen(false);
  };

  return (
    <>
      <div className="tw-border-t tw-border-gray-200 tw-mt-4" />

      {/* Toggle */}
      <button
        onClick={() => setGeneralAdvancedOpen((p) => !p)}
        className="tw-inline-flex tw-items-center tw-gap-1.5 tw-text-[13px] tw-font-medium tw-text-gray-500 tw-bg-transparent tw-border-none tw-cursor-pointer tw-p-0 tw-mt-3 tw-mb-2 tw-select-none tw-transition-colors hover:tw-text-gray-800"
      >
        <ChevronDown
          size={14}
          style={{
            transform: generalAdvancedOpen ? "rotate(0deg)" : "rotate(-90deg)",
            transition: "transform 0.2s ease",
          }}
        />
        Advanced Options
      </button>

      {generalAdvancedOpen && (
        <div className="tw-flex tw-flex-col tw-gap-3 tw-pb-1">

          {/* Symbol-trade note */}
          {isSymbolTrade && (
            <div className="tw-flex tw-items-start tw-gap-2.5 tw-bg-amber-50 tw-border tw-border-amber-200 tw-rounded-lg tw-px-3 tw-py-2.5">
              <Info size={14} className="tw-text-amber-500 tw-flex-shrink-0 tw-mt-0.5" />
              <p className="tw-m-0 tw-text-[12.5px] tw-leading-[1.55] tw-text-amber-800">
                <span className="tw-font-semibold">Note:&nbsp;</span>
                AI identified this item's product from its symbol on the plan drawing, so it can't be applied to other line items.
              </p>
            </div>
          )}

          {/* Radio group */}
          <div className="tw-flex tw-flex-wrap tw-gap-x-5 tw-gap-y-2.5">
            {MODES.map(({ key, label, hasTooltip }) => {
              const active    = generalApplyMode === key;
              const disabled  = isSymbolTrade;
              const textColor = disabled
                ? "tw-text-gray-400"
                : active ? "tw-text-gray-800" : "tw-text-gray-600";

              return (
                <label
                  key={key}
                  onClick={() => handleModeClick(key)}
                  className={`tw-flex tw-items-center tw-gap-2 ${disabled ? "tw-cursor-not-allowed" : "tw-cursor-pointer"}`}
                >
                  {/* Custom radio circle */}
                  <span
                    style={{
                      width: 16,
                      height: 16,
                      borderRadius: "50%",
                      flexShrink: 0,
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      boxSizing: "border-box",
                      transition: "border 0.15s, background 0.15s",
                      border: active && !disabled
                        ? "5px solid #0140c1"
                        : disabled
                          ? "1.5px solid #E5E7EB"
                          : "1.5px solid #9CA3AF",
                      background: disabled ? "#F9FAFB" : "#fff",
                    }}
                  />

                  <span className={`tw-text-[13px] tw-font-medium ${textColor}`}>{label}</span>

                  {hasTooltip && (
                    <Tippy
                      content={tooltipFor(key)}
                      placement="top"
                      theme="custom"
                      appendTo={document.body}
                      zIndex={10002}
                      maxWidth={260}
                      disabled={disabled}
                    >
                      <span
                        className={`tw-w-4 tw-h-4 tw-rounded-full tw-border tw-inline-flex tw-items-center tw-justify-center tw-text-[10px] tw-cursor-default tw-flex-shrink-0 ${
                          disabled
                            ? "tw-border-gray-200 tw-text-gray-300"
                            : "tw-border-gray-300 tw-text-gray-400"
                        }`}
                      >
                        ?
                      </span>
                    </Tippy>
                  )}
                </label>
              );
            })}
          </div>

          {/* "Apply to selected" item-picker */}
          {generalApplyMode === "selected" && !isSymbolTrade && (
            <div>
              <p className="tw-text-[12px] tw-font-semibold tw-text-gray-600 tw-mb-1.5">Select Items</p>
              <div style={{ position: "relative" }}>
                <button
                  ref={generalItemsBtnRef}
                  type="button"
                  onClick={() => setGeneralItemsDropOpen((p) => !p)}
                  className="tw-w-full tw-flex tw-items-center tw-justify-between tw-px-3 tw-py-2 tw-bg-white tw-border tw-border-gray-300 tw-rounded-md tw-text-sm tw-cursor-pointer hover:tw-border-gray-400 tw-transition-all tw-duration-200 tw-outline-none"
                >
                  <span className={generalSelectedItems.size === 0 ? "tw-text-gray-400" : "tw-text-gray-900"}>
                    {generalSelectedItems.size === 0 ? "Select Items" : `${generalSelectedItems.size} item(s) selected`}
                  </span>
                  <ChevronDown
                    size={16}
                    className="tw-text-gray-400 tw-flex-shrink-0"
                    style={{ transform: generalItemsDropOpen ? "rotate(180deg)" : "none", transition: "transform 0.15s" }}
                  />
                </button>

                {generalItemsDropOpen && (
                  <div
                    ref={generalItemsListRef}
                    className="custom-visible-scroll"
                    style={{
                      position: "absolute",
                      bottom: "calc(100% + 4px)",
                      left: 0, right: 0,
                      background: "#fff",
                      border: "1px solid #E5E7EB",
                      borderRadius: 8,
                      zIndex: 10002,
                      maxHeight: 220,
                      overflowY: "auto",
                      boxShadow: "0 -6px 24px rgba(17,24,39,0.10)",
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {generalTargets.length > 5 && (
                      <div className="tw-px-2 tw-pt-2 tw-pb-1 tw-sticky tw-top-0 tw-bg-white tw-border-b tw-border-gray-100">
                        <div className="tw-flex tw-items-center tw-border tw-border-gray-200 tw-rounded-md tw-px-2 tw-bg-white">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" className="tw-flex-shrink-0 tw-mr-1.5">
                            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                          </svg>
                          <input
                            autoFocus
                            value={generalItemSearch}
                            onChange={(e) => setGeneralItemSearch(e.target.value)}
                            placeholder="Search..."
                            className="tw-flex-1 tw-py-1.5 tw-text-sm tw-outline-none tw-bg-transparent tw-text-gray-800 placeholder:tw-text-gray-400"
                          />
                        </div>
                      </div>
                    )}

                    {isLoadingGeneralTargets ? (
                      <p className="tw-px-3 tw-py-3 tw-text-sm tw-text-gray-400 tw-text-center">Loading…</p>
                    ) : (() => {
                      const filtered = generalTargets
                        .filter((t) => t.name?.toLowerCase().includes(generalItemSearch.toLowerCase()))
                        .sort((a, b) => (a.name || "").localeCompare(b.name || "", undefined, { numeric: true, sensitivity: "base" }));

                      return filtered.length === 0 ? (
                        <p className="tw-px-3 tw-py-3 tw-text-sm tw-text-gray-400 tw-text-center">No other line items in this trade</p>
                      ) : filtered.map((t) => {
                        const checked = generalSelectedItems.has(t.item_id);
                        return (
                          <div
                            key={t.item_id}
                            onClick={() =>
                              setGeneralSelectedItems((prev) => {
                                const next = new Set(prev);
                                if (next.has(t.item_id)) next.delete(t.item_id);
                                else next.add(t.item_id);
                                return next;
                              })
                            }
                            className="tw-flex tw-items-center tw-gap-3 tw-px-3 tw-py-2.5 tw-cursor-pointer hover:tw-bg-gray-50 tw-select-none"
                          >
                            <span style={{ width: 18, height: 18, borderRadius: 4, flexShrink: 0, border: checked ? "none" : "1.5px solid #D1D5DB", background: checked ? "#2563EB" : "#fff", display: "flex", alignItems: "center", justifyContent: "center", transition: "background 0.1s" }}>
                              {checked && <Check style={{ width: 11, height: 11, color: "#fff" }} strokeWidth={3} />}
                            </span>
                            <span className="tw-text-sm tw-text-gray-800">{t.name}</span>
                          </div>
                        );
                      });
                    })()}
                  </div>
                )}
              </div>

              {/* Selected chips */}
              {generalSelectedItems.size > 0 && (
                <div className="tw-flex tw-flex-wrap tw-gap-1.5 tw-mt-2">
                  {[...generalSelectedItems].map((itemId) => {
                    const target = generalTargets.find((t) => t.item_id === itemId);
                    return (
                      <span key={itemId} style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "#fff", border: "1px solid #E5E7EB", borderRadius: 6, padding: "4px 10px", fontSize: 13, color: "#374151", fontFamily: "inherit", flexShrink: 0 }}>
                        {target?.name || itemId}
                        <button
                          onClick={() => setGeneralSelectedItems((prev) => { const next = new Set(prev); next.delete(itemId); return next; })}
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
          )}

          {/* Assembly-overwrite warning */}
          {(generalApplyMode === "all" || generalApplyMode === "selected") && !isSymbolTrade && (
            <div className="tw-flex tw-items-start tw-gap-2.5 tw-bg-amber-50 tw-border tw-border-amber-200 tw-rounded-lg tw-px-3 tw-py-2.5">
              <Info size={14} className="tw-text-amber-500 tw-flex-shrink-0 tw-mt-0.5" />
              <p className="tw-m-0 tw-text-[12.5px] tw-leading-[1.55] tw-text-amber-800">
                <span className="tw-font-semibold">Note:&nbsp;</span>
                This will remove existing Assembly selections on affected line items. Please update the Assembly tab after applying.
              </p>
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default GeneralAdvancedOptions;
