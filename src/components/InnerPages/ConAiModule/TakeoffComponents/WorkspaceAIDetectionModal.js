// ─── WorkspaceAIDetectionModal.js ────────────────────────────────────────────
// Self-contained modal that lets the user choose which trade categories to run
// AI Detection on.  Extracted from TakeoffWorkspace.js with zero logic changes.

import React, { useState, useEffect, useRef } from "react";
import { ChevronDown, X, Check } from "lucide-react";

import { showToast } from "../../../../genriccomponents/techus-ToastNotification";
import FullPageLoader from "../../../../genriccomponents/loaders/FullPageLoader";
import { getEligibleTakeoffs, updateEligibleTakeoffs } from "../../../../services/techus-services";
import { getDeviceInfo } from "../../../../utils/getDeviceInfo";

import { ELIGIBLE_LABEL_MAP } from "./TakeoffWorkspace.constants";
import { parseCategoriesForModal, normalizeLabel } from "./TakeoffWorkspace.utils";

// ─── Component ────────────────────────────────────────────────────────────────
const WorkspaceAIDetectionModal = ({
  open,
  onClose,
  documentId,
  pageNumber,
  onDetect,
  takeoffCategoriesRes,
  eligibleTakeoffsRes,
}) => {
  const [selected,    setSelected]    = useState(new Set());
  const [dropOpen,    setDropOpen]    = useState(false);
  const [dropOptions, setDropOptions] = useState([]);
  const [loading,     setLoading]     = useState(false);
  const [submitting,  setSubmitting]  = useState(false);
  const dropRef           = useRef(null);
  const fetchStartedRef   = useRef(false);

  // ─── Load eligible takeoffs ───────────────────────────────────────────────
  useEffect(() => {
    if (!open) {
      fetchStartedRef.current = false;
      setLoading(false); setSubmitting(false); setDropOpen(false);
      setDropOptions([]); setSelected(new Set());
      return;
    }
    fetchStartedRef.current = true;
    setDropOpen(false); setDropOptions([]); setSelected(new Set());
    if (!documentId || !pageNumber) { setLoading(false); return; }

    // Use cached data from parent — skip the API call when available
    if (eligibleTakeoffsRes) {
      const list       = eligibleTakeoffsRes?.eligible_takeoffs ?? [];
      const parsedOpts = parseCategoriesForModal(takeoffCategoriesRes);
      setDropOptions(parsedOpts);
      if (list.length && parsedOpts.length) {
        const resolvedKeys = new Set(
          parsedOpts
            .filter((opt) => list.some((e) => {
              const eNorm       = String(e).toLowerCase().replace(/\s+/g, "_");
              const optKeyNorm  = String(opt.key).toLowerCase().replace(/\s+/g, "_");
              const optLabelNorm = opt.label.toLowerCase();
              const eLabelNorm  = (ELIGIBLE_LABEL_MAP[eNorm] || normalizeLabel(e)).toLowerCase();
              return eNorm === optKeyNorm || eLabelNorm === optLabelNorm;
            }))
            .map((opt) => opt.key)
        );
        setSelected(resolvedKeys);
      }
      setLoading(false);
      return; // ← never reaches getEligibleTakeoffs
    }

    // Fallback: only if parent didn't provide cached data
    setLoading(true);
    Promise.all([
      getEligibleTakeoffs({
        organization_uuid: localStorage.getItem("organization_uuid") ?? "",
        project_uuid:      localStorage.getItem("project_uuid")      ?? "",
        document_id:       documentId,
        page_number:       pageNumber,
        device_info:       getDeviceInfo(),
      }),
    ])
      .then(([eligibleRes]) => {
        const categoriesRes = takeoffCategoriesRes;
        let eligibleParsed  = eligibleRes;
        if (typeof eligibleParsed === "string") {
          try { eligibleParsed = JSON.parse(eligibleParsed); } catch { eligibleParsed = {}; }
        }
        const list       = eligibleParsed?.eligible_takeoffs ?? [];
        const parsedOpts = parseCategoriesForModal(categoriesRes);
        setDropOptions(parsedOpts);
        if (list.length && parsedOpts.length) {
          const resolvedKeys = new Set(
            parsedOpts
              .filter((opt) => list.some((e) => {
                const eNorm       = String(e).toLowerCase().replace(/\s+/g, "_");
                const optKeyNorm  = String(opt.key).toLowerCase().replace(/\s+/g, "_");
                const optLabelNorm = opt.label.toLowerCase();
                const eLabelNorm  = (ELIGIBLE_LABEL_MAP[eNorm] || normalizeLabel(e)).toLowerCase();
                return eNorm === optKeyNorm || eLabelNorm === optLabelNorm;
              }))
              .map((opt) => opt.key)
          );
          setSelected(resolvedKeys);
        }
      })
      .catch((err) => {
        console.error("[WorkspaceAIDetectionModal] fetch failed:", err);
        if (err?.message) showToast("error", err.message);
      })
      .finally(() => setLoading(false));
  }, [open, documentId, pageNumber, eligibleTakeoffsRes]); 

  // ─── Close dropdown on outside click ─────────────────────────────────────
  useEffect(() => {
    if (!dropOpen) return;
    const h = (e) => { if (dropRef.current && !dropRef.current.contains(e.target)) setDropOpen(false); };
    document.addEventListener("mousedown", h, true);
    return () => document.removeEventListener("mousedown", h, true);
  }, [dropOpen]);

  // ─── Handlers ─────────────────────────────────────────────────────────────
  const toggleItem = (key) => {
    const next = new Set(selected);
    next.has(key) ? next.delete(key) : next.add(key);
    setSelected(next);
  };

  const handleDetect = async () => {
    if (selected.size === 0) return;
    const eligibleForApi = dropOptions
      .filter((opt) => selected.has(opt.key))
      .map((opt) => {
        const apiKey =
          Object.entries(ELIGIBLE_LABEL_MAP).find(([, v]) => v === opt.label)?.[0] ??
          String(opt.key).toLowerCase().replace(/\s+/g, "_");
        return apiKey;
      });
    setSubmitting(true);
    try {
      const res = await updateEligibleTakeoffs({
        organization_uuid: localStorage.getItem("organization_uuid") ?? "",
        project_uuid:      localStorage.getItem("project_uuid")      ?? "",
        document_id:       documentId,
        page_number:       pageNumber,
        eligible_takeoffs: eligibleForApi,
        device_info:       getDeviceInfo(),
      });
      let parsed = res;
      if (typeof parsed === "string") { try { parsed = JSON.parse(parsed); } catch { parsed = {}; } }
      if (parsed?.valid === false) {
        showToast("error", parsed?.message ?? "Something went wrong.");
        return;
      }
      onClose();
      onDetect?.(eligibleForApi);
    } catch (err) {
      console.error("[WorkspaceAIDetectionModal] updateEligibleTakeoffs failed:", err);
      if (err?.message) showToast("error", err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Render guards ─────────────────────────────────────────────────────────
  const triggerLabel    = selected.size > 0 ? `${selected.size} selected` : "Select trades...";
  const isSubmitDisabled = selected.size === 0;

  if (!open) return null;
  if (!fetchStartedRef.current || loading || submitting) return <FullPageLoader />;

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div
      style={{
        position: "fixed", inset: 0, background: "rgba(17,24,39,0.45)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 99999, padding: "24px 0",
      }}
      // onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        background: "#fff", borderRadius: 12, width: 520, maxWidth: "96vw",
        maxHeight: "calc(100vh - 48px)", display: "flex", flexDirection: "column",
        position: "relative", boxShadow: "0 20px 60px rgba(17,24,39,0.18)", overflow: "hidden",
      }}>
        {/* ── Scrollable body ─────────────────────────────────────────────── */}
        <div style={{ flex: 1, overflowY: "auto", padding: "32px 32px 0", scrollbarWidth: "thin", scrollbarColor: "#DEE9FF transparent" }}>
          {/* Close button */}
          <button
            onClick={onClose}
            style={{
              position: "absolute", top: 14, right: 14, background: "transparent",
              border: "1px solid #6b7280", borderRadius: "50%", width: 24, height: 24,
              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
              color: "#6b7280", padding: 0,
            }}
          >
            <X style={{ width: 14, height: 14 }} />
          </button>

          {/* Icon */}
          <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#DBEAFE", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 18px" }}>
            <i className="icon-AI-Detection-fill" style={{ fontSize: 32, color: "#1D4ED8" }} />
          </div>

          {/* Title / description */}
          <p style={{ textAlign: "center", fontSize: 18, fontWeight: 700, color: "#111827", margin: "0 0 10px", lineHeight: 1.3 }}>AI Detection</p>
          <p style={{ textAlign: "center", fontSize: 14, color: "#6B7280", lineHeight: 1.6, margin: "0 0 6px" }}>
            There are no eligible takeoffs identified on this page by the AI Agents. If you wish to do any takeoffs, please select and add them so the AI can proceed accordingly.
          </p>

          <p style={{ fontSize: 14, fontWeight: 600, color: "#111827", margin: "0 0 8px" }}>Select Additional Takeoffs</p>

          {/* Dropdown */}
          <div ref={dropRef} style={{ position: "relative" }}>
            <button
              onClick={() => setDropOpen((p) => !p)}
              style={{
                width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "10px 14px", background: "#fff", border: "1px solid #E5E7EB", borderRadius: 8,
                cursor: "pointer", fontSize: 14, color: selected.size > 0 ? "#111827" : "#9CA3AF",
                outline: "none", fontFamily: "inherit",
              }}
            >
              <span>{triggerLabel}</span>
              <ChevronDown style={{
                width: 16, height: 16, color: "#9CA3AF", flexShrink: 0,
                transform: dropOpen ? "rotate(180deg)" : "none", transition: "transform 0.15s",
              }} />
            </button>

            {dropOpen && (
              <div style={{
                position: "absolute", bottom: "calc(100% + 4px)", left: 0, right: 0,
                background: "#fff", border: "1px solid #E5E7EB", borderRadius: 8, zIndex: 9999,
                maxHeight: 240, overflowY: "auto", boxShadow: "0 -6px 24px rgba(17,24,39,0.10)",
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

            {/* Selected chips */}
            {selected.size > 0 && (
              <div style={{
                display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10,
                maxHeight: 90, overflowY: "auto", paddingBottom: 2,
                scrollbarWidth: "thin", scrollbarColor: "#DEE9FF transparent",
              }}>
                {[...selected].map((k) => {
                  const opt   = dropOptions.find((o) => o.key === k);
                  const label = opt?.label ??
                    ELIGIBLE_LABEL_MAP[String(k).toLowerCase().replace(/\s+/g, "_")] ??
                    normalizeLabel(String(k));
                  return (
                    <span
                      key={k}
                      style={{
                        display: "inline-flex", alignItems: "center", gap: 4,
                        background: "#fff", border: "1px solid #E5E7EB", borderRadius: 6,
                        padding: "4px 10px", fontSize: 13, color: "#374151",
                        fontFamily: "inherit", flexShrink: 0,
                      }}
                    >
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

          <div style={{ height: 24 }} />
        </div>

        {/* ── Footer buttons ───────────────────────────────────────────────── */}
        <div style={{
          flexShrink: 0, display: "flex", justifyContent: "flex-end", gap: 10,
          padding: "16px 32px 24px", borderTop: "1px solid #F3F4F6", background: "#fff",
        }}>
          <button
            onClick={onClose}
            style={{ padding: "10px 28px", border: "1px solid #E5E7EB", borderRadius: 5, background: "#F3F4F6", color: "#374151", cursor: "pointer", fontSize: 14, fontWeight: 500, fontFamily: "inherit" }}
          >
            Cancel
          </button>
          <button
            onClick={isSubmitDisabled ? undefined : handleDetect}
            style={{
              padding: "10px 28px", border: "none", borderRadius: 5,
              background: isSubmitDisabled ? "#93C5FD" : "#1D4ED8",
              color: "#fff", cursor: isSubmitDisabled ? "not-allowed" : "pointer",
              fontSize: 14, fontWeight: 600, fontFamily: "inherit",
            }}
          >
            Yes, Detect
          </button>
        </div>
      </div>
    </div>
  );
};

export default WorkspaceAIDetectionModal;