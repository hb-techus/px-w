import React from "react";
import { Trash2, Plus, ChevronDown, X, Check } from "lucide-react";
import Tippy from "@tippyjs/react";
import "tippy.js/dist/tippy.css";
import FilterDropdown from "../../../../genriccomponents/FilterDropdown";

const ASM_MODES = [
  {
    key: "all",
    label: "Apply to all",
    tooltip: (label) =>
      `Accessories apply to every item sharing ${label}'s properties, with quantities scaled to each item's measurement.`,
  },
  {
    key: "selected",
    label: "Apply to selected",
    tooltip: (label) =>
      `Accessories apply to the items selected among those sharing ${label}'s properties, with quantities scaled to each item's measurement.`,
  },
  { key: "this", label: "Apply to this item only", tooltip: null },
];

const AssemblyTab = ({
  assemblyRows, setAssemblyRows, asmLidRef, asmScrollRef,
  asmProductOptions, getAsmProductUnit, nameDraft, itemName,
  advancedOpen, setAdvancedOpen, applyMode, setApplyMode,
  selectedItems, setSelectedItems, itemsDropOpen, setItemsDropOpen,
  itemSearch, setItemSearch, itemsBtnRef, itemsListRef,
  isLoadingTargets, assemblyTargets,
}) => {
  const itemLabel = nameDraft || itemName || "this item";

  const handleModeClick = (key) => {
    setApplyMode(key);
    if (key !== "selected") setItemsDropOpen(false);
  };

  return (
    <div>
      {assemblyRows.length === 0 ? (
        <>
          <p className="tw-text-sm tw-text-gray-500 tw-mb-4 tw-leading-relaxed">
            Add products from the assembly menu to build your {itemLabel} takeoff.
            Review quantities and selected items before adding them to the estimate.
          </p>
          <button
            onClick={() => setAssemblyRows([{ _lid: ++asmLidRef.current, productId: "", quantity: 1 }])}
            className="tw-inline-flex tw-items-center tw-gap-1 tw-text-sm tw-font-medium tw-text-[#0140c1] tw-bg-transparent tw-border-none tw-cursor-pointer hover:tw-text-blue-700 tw-transition-colors tw-p-0"
          >
            <Plus size={14} /> Add Product
          </button>
        </>
      ) : (
        <>
          {/* Column headers */}
          <div className="tw-grid tw-gap-2 tw-mb-1.5 tw-items-center" style={{ gridTemplateColumns: "1fr 110px 28px" }}>
            <span className="tw-text-[12px] tw-font-semibold tw-text-gray-500">Product</span>
            <span className="tw-text-[12px] tw-font-semibold tw-text-gray-500">Quantity</span>
            <span />
          </div>

          {/* Scrollable product rows */}
          <div ref={asmScrollRef} className="tw-flex tw-flex-col tw-gap-2 tw-max-h-[220px] tw-overflow-y-auto tw-pr-1 custom-visible-scroll">
            {assemblyRows.map((row) => {
              const unit = getAsmProductUnit(row.productId);
              const takenByOthers = assemblyRows.filter((r) => r._lid !== row._lid && r.productId).map((r) => r.productId);
              return (
                <div key={row._lid} className="tw-grid tw-gap-2 tw-items-center" style={{ gridTemplateColumns: "1fr 110px 28px" }}>
                  <div className="tw-min-w-0">
                    <FilterDropdown
                      options={asmProductOptions}
                      value={row.productId || undefined}
                      placeholder="Select Product"
                      onChange={(opt) => setAssemblyRows((prev) => prev.map((r) => r._lid === row._lid ? { ...r, productId: opt } : r))}
                      width="tw-w-full"
                      disabledOptions={takenByOthers}
                      searchable
                    />
                  </div>
                  <div className="tw-relative">
                    <input
                      type="number"
                      min="1"
                      value={row.quantity}
                      onChange={(e) => setAssemblyRows((prev) => prev.map((r) => r._lid === row._lid ? { ...r, quantity: e.target.value } : r))}
                      className="tw-border tw-border-gray-300 tw-rounded-md tw-px-2 tw-py-[7px] tw-text-sm tw-outline-none focus:tw-border-blue-400 tw-text-left tw-w-full"
                      style={{ paddingRight: 28 }}
                    />
                    <span className="tw-absolute tw-right-2 tw-top-1/2 -tw-translate-y-1/2 tw-text-[12px] tw-text-gray-500 tw-pointer-events-none tw-select-none">
                      {unit}
                    </span>
                  </div>
                  <button
                    onClick={() => setAssemblyRows((prev) => prev.filter((r) => r._lid !== row._lid))}
                    className="tw-bg-transparent tw-border-none tw-cursor-pointer tw-text-red-400 hover:tw-text-red-600 tw-transition-colors tw-p-1 tw-flex tw-items-center tw-justify-center"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              );
            })}
          </div>

          {/* Add more */}
          <button
            onClick={() => setAssemblyRows((prev) => [...prev, { _lid: ++asmLidRef.current, productId: "", quantity: 1 }])}
            className="tw-inline-flex tw-items-center tw-gap-1 tw-text-sm tw-font-medium tw-text-[#0140c1] tw-bg-transparent tw-border-none tw-cursor-pointer hover:tw-text-blue-700 tw-transition-colors tw-p-0 tw-mt-3"
          >
            <Plus size={14} /> Add Product
          </button>

          {/* ── Advanced Options ── */}
          <div className="tw-border-t tw-border-gray-200 tw-my-4" />

          <button
            onClick={() => setAdvancedOpen((p) => !p)}
            className="tw-inline-flex tw-items-center tw-gap-1.5 tw-text-[13px] tw-font-medium tw-text-gray-500 tw-bg-transparent tw-border-none tw-cursor-pointer tw-p-0 tw-mb-2 tw-select-none tw-transition-colors hover:tw-text-gray-800"
          >
            <ChevronDown
              size={14}
              style={{
                transform: advancedOpen ? "rotate(0deg)" : "rotate(-90deg)",
                transition: "transform 0.2s ease",
              }}
            />
            Advanced Options
          </button>

          {advancedOpen && (
            <div className="tw-flex tw-flex-col tw-gap-3 tw-pb-1">

              {/* Radio group */}
              <div className="tw-flex tw-flex-wrap tw-gap-x-5 tw-gap-y-2.5">
                {ASM_MODES.map(({ key, label, tooltip }) => {
                  const active = applyMode === key;
                  return (
                    <label
                      key={key}
                      onClick={() => handleModeClick(key)}
                      className="tw-flex tw-items-center tw-gap-2 tw-cursor-pointer"
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
                          transition: "border 0.15s",
                          border: active ? "5px solid #0140c1" : "1.5px solid #9CA3AF",
                          background: "#fff",
                        }}
                      />
                      <span className={`tw-text-[13px] tw-font-medium ${active ? "tw-text-gray-800" : "tw-text-gray-600"}`}>
                        {label}
                      </span>
                      {tooltip && (
                        <Tippy
                          content={tooltip(itemLabel)}
                          placement="top"
                          theme="custom"
                          appendTo={document.body}
                          zIndex={10002}
                          maxWidth={260}
                        >
                          <span className="tw-w-4 tw-h-4 tw-rounded-full tw-border tw-border-gray-300 tw-inline-flex tw-items-center tw-justify-center tw-text-[10px] tw-text-gray-400 tw-cursor-default tw-flex-shrink-0">
                            ?
                          </span>
                        </Tippy>
                      )}
                    </label>
                  );
                })}
              </div>

              {/* Item picker — only for "selected" */}
              {applyMode === "selected" && (
                <div>
                  <p className="tw-text-[12px] tw-font-semibold tw-text-gray-600 tw-mb-1.5">Select Items</p>
                  <div style={{ position: "relative" }}>
                    <button
                      ref={itemsBtnRef}
                      type="button"
                      onClick={() => setItemsDropOpen((p) => !p)}
                      className="tw-w-full tw-flex tw-items-center tw-justify-between tw-px-3 tw-py-2 tw-bg-white tw-border tw-border-gray-300 tw-rounded-md tw-text-sm tw-cursor-pointer hover:tw-border-gray-400 tw-transition-all tw-duration-200 tw-outline-none"
                    >
                      <span className={selectedItems.size === 0 ? "tw-text-gray-400" : "tw-text-gray-900"}>
                        {selectedItems.size === 0 ? "Select Items" : `${selectedItems.size} item(s) selected`}
                      </span>
                      <ChevronDown
                        size={16}
                        className="tw-text-gray-400 tw-flex-shrink-0"
                        style={{ transform: itemsDropOpen ? "rotate(180deg)" : "none", transition: "transform 0.15s" }}
                      />
                    </button>

                    {itemsDropOpen && (
                      <div
                        ref={itemsListRef}
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
                        {assemblyTargets.length > 5 && (
                          <div className="tw-px-2 tw-pt-2 tw-pb-1 tw-sticky tw-top-0 tw-bg-white tw-border-b tw-border-gray-100">
                            <div className="tw-flex tw-items-center tw-border tw-border-gray-200 tw-rounded-md tw-px-2 tw-bg-white">
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" className="tw-flex-shrink-0 tw-mr-1.5">
                                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                              </svg>
                              <input
                                autoFocus
                                value={itemSearch}
                                onChange={(e) => setItemSearch(e.target.value)}
                                placeholder="Search..."
                                className="tw-flex-1 tw-py-1.5 tw-text-sm tw-outline-none tw-bg-transparent tw-text-gray-800 placeholder:tw-text-gray-400"
                              />
                            </div>
                          </div>
                        )}

                        {isLoadingTargets ? (
                          <p className="tw-px-3 tw-py-3 tw-text-sm tw-text-gray-400 tw-text-center">Loading…</p>
                        ) : (() => {
                          const filtered = assemblyTargets
                            .filter((t) => t.name?.toLowerCase().includes(itemSearch.toLowerCase()))
                            .sort((a, b) => (a.name || "").localeCompare(b.name || "", undefined, { numeric: true, sensitivity: "base" }));
                          return filtered.length === 0 ? (
                            <p className="tw-px-3 tw-py-3 tw-text-sm tw-text-gray-400 tw-text-center">No other matching line items found</p>
                          ) : filtered.map((t) => {
                            const checked = selectedItems.has(t.item_id);
                            return (
                              <div
                                key={t.item_id}
                                onClick={() => setSelectedItems((prev) => { const next = new Set(prev); if (next.has(t.item_id)) next.delete(t.item_id); else next.add(t.item_id); return next; })}
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
                  {selectedItems.size > 0 && (
                    <div className="tw-flex tw-flex-wrap tw-gap-1.5 tw-mt-2">
                      {[...selectedItems].map((itemId) => {
                        const target = assemblyTargets.find((t) => t.item_id === itemId);
                        return (
                          <span key={itemId} style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "#fff", border: "1px solid #E5E7EB", borderRadius: 6, padding: "4px 10px", fontSize: 13, color: "#374151", fontFamily: "inherit", flexShrink: 0 }}>
                            {target?.name || itemId}
                            <button
                              onClick={() => setSelectedItems((prev) => { const next = new Set(prev); next.delete(itemId); return next; })}
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

            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AssemblyTab;
