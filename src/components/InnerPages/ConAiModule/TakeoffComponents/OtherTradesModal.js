// ─── OtherTradesModal.js ──────────────────────────────────────────────────────
// Shown after AI Extraction when the API response contains non_eligible_trades.
import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom";
import { X } from "lucide-react";
import { saveNonEligibleTakeoffs } from "../../../../services/techus-services";
import { getDeviceInfo } from "../../../../utils/getDeviceInfo";
import { showToast } from "../../../../genriccomponents/techus-ToastNotification";
import FullPageLoader from "../../../../genriccomponents/loaders/FullPageLoader";
import { normalizeLabel } from "../../../../utils/textUtils";

// ─── Component ────────────────────────────────────────────────────────────────
// Props:
//   open          — boolean
//   onClose       — () => void  (no save; get_ai_extraction called in background)
//   onSubmitDone  — () => void  called after saveNonEligibleTakeoffs succeeds
//   onCancel      — () => void  called on Cancel / X click (triggers background replaceExtraction)
//   trades        — non_eligible_trades array: [{ trade_key, display_name, item_count }]
//   stagingId     — string from API response
const OtherTradesModal = ({
  open,
  onClose,
  onSubmitDone,
  onCancel,
  trades = [],
  stagingId,
}) => {
  const [selected, setSelected] = useState(new Set());
  const [submitting, setSubmitting] = useState(false);

  // ── Reset selections every time the modal opens ───────────────────────────
  useEffect(() => {
    if (open) {
      setSelected(new Set());
    }
  }, [open]);

  // ── Show full-page loader while the API call is in flight ─────────────────
  if (submitting) return <FullPageLoader />;
  if (!open) return null;

  const toggleItem = (key) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  // ── Cancel / X — close modal, fire background extraction fetch ───────────
  const handleCancel = () => {
    onClose();
    onCancel?.();
  };

  // ── Submit — close modal immediately, run API, then replaceExtraction ─────
  const handleSubmit = async () => {
    if (selected.size === 0 || submitting) return;

    // Close the modal immediately so the user sees the loader behind it
    onClose();
    setSubmitting(true);
    try {
      const payload = {
        organization_uuid: localStorage.getItem("organization_uuid") ?? "",
        project_uuid: localStorage.getItem("project_uuid") ?? "",
        staging_id: stagingId,
        selected_trade_keys: [...selected],
        device_info: getDeviceInfo(),
      };
      const raw = await saveNonEligibleTakeoffs(payload);
      let parsed = raw;
      if (typeof parsed === "string") {
        try { parsed = JSON.parse(parsed); } catch { parsed = {}; }
      }
      if (parsed?.valid === false) {
        showToast("error", parsed?.message || "Failed to save trades.");
        return;
      }
      onSubmitDone?.();
    } catch (e) {
      showToast("error", e.message || "Failed to save trades.");
    } finally {
      setSubmitting(false);
    }
  };

  return ReactDOM.createPortal(
    <div className="tw-fixed tw-inset-0 tw-z-[99999] tw-flex tw-items-center tw-justify-center tw-bg-gray-900/45">
      <div className="tw-bg-white tw-rounded-xl tw-w-[520px] tw-max-w-[96vw] tw-max-h-[calc(100vh-48px)] tw-flex tw-flex-col tw-relative tw-shadow-2xl tw-overflow-hidden">

        {/* ── Close button ─────────────────────────────────────────────── */}
        <button
          onClick={handleCancel}
          className="tw-absolute tw-top-3.5 tw-right-3.5 tw-z-10 tw-bg-transparent tw-border tw-border-gray-500 tw-rounded-full tw-w-6 tw-h-6 tw-cursor-pointer tw-flex tw-items-center tw-justify-center tw-text-gray-500 tw-p-0 hover:tw-bg-gray-100"
        >
          <X className="tw-w-3.5 tw-h-3.5" />
        </button>

        {/* ── Header ───────────────────────────────────────────────────── */}
        <div className="tw-px-6 tw-pt-6 tw-flex-shrink-0">
          <div className="tw-flex tw-items-center tw-gap-2.5 tw-mb-3">
            <i className="icon-AI-Extraction tw-text-[32px] tw-text-blue-700 tw-flex-shrink-0" />
            <span className="tw-text-lg tw-font-bold tw-text-gray-900">
              AI Extraction
            </span>
          </div>
          <p className="tw-text-sm tw-text-gray-500 tw-leading-relaxed tw-mb-4 tw-m-0">
            AI has identified items that belong to other trades apart from the selected trades.
            Please select the trades from the list below, so that our AI will extract and add it
            in the appropriate categories.
          </p>
        </div>

        {/* ── Body — trade list ─────────────────────────────────────────── */}
        <div className="tw-flex-1 tw-overflow-y-auto tw-px-6 tw-pt-4 [scrollbar-width:thin] [scrollbar-color:#DEE9FF_transparent]">
          <div className="tw-border tw-border-gray-200 tw-rounded-lg tw-overflow-hidden">
            {trades.map((trade) => {
              const checked = selected.has(trade.trade_key);
              return (
                <div
                  key={trade.trade_key}
                  onClick={() => toggleItem(trade.trade_key)}
                  className="tw-flex tw-items-center tw-gap-3.5 tw-px-5 tw-py-[18px] tw-cursor-pointer tw-bg-white tw-select-none tw-transition-colors hover:tw-bg-gray-50"
                >
                  {/* Custom checkbox */}
                  <span
                    className={`tw-w-5 tw-h-5 tw-rounded tw-flex-shrink-0 tw-flex tw-items-center tw-justify-center tw-transition-colors ${
                      checked
                        ? "tw-bg-blue-600 tw-border-0"
                        : "tw-bg-white tw-border-[1.5px] tw-border-blue-600"
                    }`}
                  >
                    {checked && (
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </span>

                  {/* Label */}
                  <span className="tw-text-[15px] tw-font-semibold tw-text-gray-900">
                    {normalizeLabel(trade.display_name)}
                  </span>

                  {/* Item count */}
                  <span className="tw-text-sm tw-font-normal tw-text-gray-400">
                    ({trade.item_count} {trade.item_count === 1 ? "item" : "items"})
                  </span>
                </div>
              );
            })}
          </div>
          <div className="tw-h-4" />
        </div>

        {/* ── Footer ───────────────────────────────────────────────────── */}
        <div className="tw-flex-shrink-0 tw-flex tw-justify-end tw-gap-2.5 tw-px-6 tw-pt-4 tw-pb-6 tw-bg-white">
          <button
            onClick={handleCancel}
            className="tw-px-7 tw-py-2.5 tw-border tw-border-gray-200 tw-rounded-lg tw-bg-white tw-text-gray-700 tw-cursor-pointer tw-text-sm tw-font-medium tw-font-[inherit] hover:tw-bg-gray-100"
          >
            Cancel
          </button>
          <button
            onClick={selected.size === 0 ? undefined : handleSubmit}
            className={`tw-px-7 tw-py-2.5 tw-border-0 tw-rounded-lg tw-text-white tw-text-sm tw-font-semibold tw-font-[inherit] tw-transition-colors ${
              selected.size === 0
                ? "tw-bg-blue-300 tw-cursor-not-allowed"
                : "tw-bg-blue-700 tw-cursor-pointer hover:tw-bg-blue-800"
            }`}
          >
            Submit
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default OtherTradesModal;