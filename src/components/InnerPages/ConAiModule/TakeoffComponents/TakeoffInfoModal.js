// ─── TakeoffInfoModal.js ──────────────────────────────────────────────────────
import React, { useState, useEffect, useRef } from "react";
import { Check } from "lucide-react";
import { showToast } from "../../../../genriccomponents/techus-ToastNotification";
import FullPageLoader from "../../../../genriccomponents/loaders/FullPageLoader";
import { getEligibleTakeoffs, updateEligibleTakeoffs } from "../../../../services/techus-services";
import { getDeviceInfo } from "../../../../utils/getDeviceInfo";
import { ModalShell, TakeoffDropdown, LABEL_MAP, normalizeLabel, parseCategories } from "./ToolbarShared";

const TakeoffInfoModal = ({
  open, onClose, documentId, pageNumber, onSaved,
  takeoffCategoriesRes, isMarkAsCompleted = false,
  eligibleTakeoffsRes,
}) => {
  const [selected, setSelected] = useState(new Set());
  const [dropOpen, setDropOpen] = useState(false);
  const [dropOptions, setDropOptions] = useState([]);
  const [eligibleTakeoffs, setEligibleTakeoffs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const dropRef = useRef(null);
  const fetchStartedRef = useRef(false);

  // ── Helper: resolve selected keys from list + options ────────────────────
  const resolveSelectedKeys = (list, parsedOpts) => {
    if (!list.length || !parsedOpts.length) return new Set();
    return new Set(
      parsedOpts
        .filter((opt) => list.some((e) => {
          const eNorm = String(e).toLowerCase().replace(/\s+/g, "_");
          const optKeyNorm = String(opt.key).toLowerCase().replace(/\s+/g, "_");
          const optLabelNorm = opt.label.toLowerCase();
          const eLabelNorm = (LABEL_MAP[eNorm] || normalizeLabel(e)).toLowerCase();
          return eNorm === optKeyNorm || eLabelNorm === optLabelNorm;
        }))
        .map((opt) => opt.key)
    );
  };

  useEffect(() => {
    if (!open) {
      fetchStartedRef.current = false;
      setLoading(false); setDropOpen(false);
      setDropOptions([]); setEligibleTakeoffs([]); setSelected(new Set());
      return;
    }
    fetchStartedRef.current = true;
    setLoading(true); setDropOpen(false);
    setDropOptions([]); setEligibleTakeoffs([]); setSelected(new Set());

    if (!documentId || !pageNumber) { setLoading(false); return; }

    // PATH A: use cached data from parent
    if (eligibleTakeoffsRes) {
      const list = eligibleTakeoffsRes?.eligible_takeoffs ?? [];
      const parsedOpts = parseCategories(takeoffCategoriesRes);
      setEligibleTakeoffs(list);
      setDropOptions(parsedOpts);
      setSelected(resolveSelectedKeys(list, parsedOpts));
      setLoading(false);
      return;
    }

    // PATH B: fetch directly
    getEligibleTakeoffs({
      organization_uuid: localStorage.getItem("organization_uuid") ?? "",
      project_uuid: localStorage.getItem("project_uuid") ?? "",
      document_id: documentId,
      page_number: pageNumber,
      device_info: getDeviceInfo(),
    })
      .then((res) => {
        let eligibleParsed = res;
        if (typeof eligibleParsed === "string") { try { eligibleParsed = JSON.parse(eligibleParsed); } catch { eligibleParsed = {}; } }
        if (eligibleParsed?.message) {
          showToast(eligibleParsed?.valid === false ? "error" : "success", eligibleParsed.message);
        }
        const list = eligibleParsed?.eligible_takeoffs ?? [];
        const parsedOpts = parseCategories(takeoffCategoriesRes);
        setEligibleTakeoffs(list);
        setDropOptions(parsedOpts);
        setSelected(resolveSelectedKeys(list, parsedOpts));
      })
      .catch((err) => {
        console.error("[TakeoffInfoModal] getEligibleTakeoffs failed:", err);
        if (err?.message) showToast("error", err.message);
      })
      .finally(() => setLoading(false));
  }, [open, documentId, pageNumber, eligibleTakeoffsRes]); 

  useEffect(() => {
    if (!dropOpen) return;
    const h = (e) => { if (dropRef.current && !dropRef.current.contains(e.target)) setDropOpen(false); };
    document.addEventListener("mousedown", h, true);
    return () => document.removeEventListener("mousedown", h, true);
  }, [dropOpen]);

  const toggleItem = (key) => {
    const next = new Set(selected);
    if (next.has(key)) {
      next.delete(key);
      const opt = dropOptions.find((o) => o.key === key);
      if (opt) {
        setEligibleTakeoffs((prev) => prev.filter((e) => {
          const eNorm = String(e).toLowerCase().replace(/\s+/g, "_");
          const optKeyNorm = String(opt.key).toLowerCase().replace(/\s+/g, "_");
          const optLabelNorm = opt.label.toLowerCase();
          const eLabelNorm = (LABEL_MAP[eNorm] || normalizeLabel(e)).toLowerCase();
          return !(eNorm === optKeyNorm || eLabelNorm === optLabelNorm);
        }));
      }
    } else {
      next.add(key);
      const opt = dropOptions.find((o) => o.key === key);
      if (opt) {
        const rawKey = Object.entries(LABEL_MAP).find(([, v]) => v === opt.label)?.[0] ?? key;
        setEligibleTakeoffs((prev) => {
          const alreadyIn = prev.some((e) => String(e).toLowerCase().replace(/\s+/g, "_") === String(rawKey).toLowerCase().replace(/\s+/g, "_"));
          return alreadyIn ? prev : [...prev, rawKey];
        });
      }
    }
    setSelected(next);
  };

  const handleSubmit = async () => {
    const eligibleForApi = dropOptions
      .filter((opt) => selected.has(opt.key))
      .map((opt) => Object.entries(LABEL_MAP).find(([, v]) => v === opt.label)?.[0] ?? String(opt.key).toLowerCase().replace(/\s+/g, "_"));
    setSubmitting(true);
    try {
      await updateEligibleTakeoffs({
        organization_uuid: localStorage.getItem("organization_uuid") ?? "",
        project_uuid: localStorage.getItem("project_uuid") ?? "",
        document_id: documentId,
        page_number: pageNumber,
        eligible_takeoffs: eligibleForApi,
        device_info: getDeviceInfo(),
      });
      onSaved?.();
      onClose();
    } catch (err) {
      console.error("[TakeoffInfoModal] updateEligibleTakeoffs failed:", err);
      showToast("error", err?.message ?? "An unexpected error occurred.");
    } finally { setSubmitting(false); }
  };

  const eligibleDisplayList = eligibleTakeoffs.map((key) => ({
    key,
    label: LABEL_MAP[String(key).toLowerCase().replace(/\s+/g, "_")] || normalizeLabel(String(key)),
  }));
  const triggerLabel = selected.size > 0 ? `${selected.size} selected` : "Select trades...";

  if (submitting) return <FullPageLoader />;
  if (!open) return null;
  if (!fetchStartedRef.current || loading) return <FullPageLoader />;

  return (
    <ModalShell
      onClose={onClose}
      footer={
        <div style={{
          flexShrink: 0, display: "flex", justifyContent: "flex-end", gap: 10,
          padding: "16px 32px 24px", borderTop: "1px solid #F3F4F6", background: "#fff",
        }}>
          <button onClick={onClose} style={{ padding: "10px 28px", border: "1px solid #E5E7EB", borderRadius: 5, background: "#F3F4F6", color: "#374151", cursor: "pointer", fontSize: 14, fontWeight: 500, fontFamily: "inherit" }}>
            Cancel
          </button>
          <button
            // onClick={selected.size > 0 ? handleSubmit : undefined}
            onClick={selected.size > 0 && !isMarkAsCompleted ? handleSubmit : undefined}
            style={{
              padding: "10px 28px", border: "none", borderRadius: 5,
              //  background: selected.size > 0 ? "#1D4ED8" : "#93C5FD", color: "#fff",
              //  cursor: selected.size > 0 ? "pointer" : "not-allowed",
              background: (selected.size > 0 && !isMarkAsCompleted) ? "#1D4ED8" : "#93C5FD", color: "#fff",
              cursor: (selected.size > 0 && !isMarkAsCompleted) ? "pointer" : "not-allowed",
              fontSize: 14, fontWeight: 600, fontFamily: "inherit"
            }}
          >
            Submit
          </button>
        </div>
      }
    >
      <div className="tw-w-[56px] tw-h-[56px] tw-rounded-full tw-bg-[#DBEAFE] tw-flex tw-items-center tw-justify-center tw-mx-auto tw-mb-[18px]">
        <i className="icon-Info tw-text-[36px] tw-text-[#1D4ED8]" />
      </div>

      <p style={{ textAlign: "center", fontSize: 18, fontWeight: 700, color: "#111827", margin: "0 0 10px", lineHeight: 1.3 }}>
        Takeoff Information
      </p>
      <p style={{ textAlign: "center", fontSize: 14, color: "#6B7280", lineHeight: 1.6, margin: "0 0 22px" }}>
        AI agents have identified the following takeoffs as eligible for this page. If you wish to
        include any additional takeoffs beyond this list, please select and add them so that the AI
        can proceed accordingly. Only items corresponding to the selected takeoffs will be extracted.
      </p>

      <p style={{ fontSize: 14, fontWeight: 600, color: "#111827", margin: "0 0 8px" }}>Eligible Takeoffs</p>
      <div style={{ background: "#F9FAFB", border: "1px solid #F3F4F6", borderRadius: 8, padding: "4px 6px", marginBottom: 20, maxHeight: 220, overflowY: "auto", scrollbarWidth: "thin", scrollbarColor: "#DEE9FF transparent" }}>
        {eligibleDisplayList.length === 0 ? (
          <div style={{ padding: "14px 16px", fontSize: 14, color: "#9CA3AF", textAlign: "center" }}>No eligible takeoffs detected for this page.</div>
        ) : eligibleDisplayList.map(({ key, label }) => (
          <div key={key} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px" }}>
            <Check style={{ width: 16, height: 16, color: "#1D4ED8", flexShrink: 0 }} strokeWidth={2.5} />
            <span style={{ fontSize: 15, fontWeight: 400, color: "#111827" }}>{label}</span>
          </div>
        ))}
      </div>

      <p style={{ fontSize: 14, fontWeight: 600, color: "#111827", margin: "0 0 8px" }}>Select Additional Takeoffs</p>
      <div style={{
        pointerEvents: isMarkAsCompleted ? "none" : "auto",
        opacity: isMarkAsCompleted ? 0.5 : 1,
        cursor: isMarkAsCompleted ? "not-allowed" : "auto",
      }}>
        <TakeoffDropdown
          dropRef={dropRef}
          dropOpen={dropOpen}
          onDropOpen={() => setDropOpen((p) => !p)}
          dropOptions={dropOptions}
          selected={selected}
          toggleItem={toggleItem}
          triggerLabel={triggerLabel}
        />
      </div>
    </ModalShell>
  );
};

export default TakeoffInfoModal;