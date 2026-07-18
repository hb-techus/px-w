// ─── WorkspaceModals.js ───────────────────────────────────────────────────────
// All ReactDOM.createPortal modals from TakeoffWorkspace.js collected here.
// Props are passed straight through — zero logic changes.

import React from "react";
import ReactDOM from "react-dom";
import TakeoffDetailsPanel from "./TakeoffDetailsPanel";
import UnknownSymbolPanel from "./UnknownSymbolModal";
import WorkspaceAIDetectionModal from "./WorkspaceAIDetectionModal";

// ─── EditItemModal — TakeoffDetailsPanel or UnknownSymbolPanel ────────────────
export const EditItemModal = ({
  editingItem, editingGroupId,
  onClose, onUpdate,
  documentId, isMarkAsCompleted = false,
  productList = [],
  // unknown-symbol extras
  currentPage, fetchExtractionForPageSilent, setTakeoffData,
}) => {
  if (!editingItem || !editingGroupId) return null;

  const overlay = {
    position: "fixed", inset: 0, zIndex: 9999,
    display: "flex", alignItems: "center", justifyContent: "center",
    background: "rgba(0,0,0,0.55)",
  };
  const card = {
    background: "#fff", borderRadius: 16,
    boxShadow: "0 24px 64px rgba(0,0,0,0.22)",
    width: "100%", maxWidth: 570,
    height: "auto", maxHeight: "calc(100vh - 48px)",
    overflow: "hidden", display: "flex", flexDirection: "column",
  };

  if (editingGroupId !== "unknown") {
    return ReactDOM.createPortal(
      <div style={overlay}>
        <div style={card}>
          <TakeoffDetailsPanel
            item={editingItem} type={editingGroupId}
            onUpdate={onUpdate} onClose={onClose}
            inSidebar={false} documentId={documentId} isMarkAsCompleted={isMarkAsCompleted}
            productList={productList}
          />
        </div>
      </div>,
      document.body,
    );
  }

  return ReactDOM.createPortal(
    <div style={overlay}>
      <div style={card}>
        <UnknownSymbolPanel
          item={editingItem} documentId={documentId}
          onClose={onClose} isMarkAsCompleted={isMarkAsCompleted}
          productList={productList}
          onSaved={async (savedPkId) => {
            onClose();
            if (savedPkId != null) {
              setTakeoffData((prev) => {
                const gv    = prev["unknown_data"];
                if (!gv) return prev;
                const isArr = Array.isArray(gv);
                const items = isArr ? gv : (gv.items ?? []);
                const filtered = items.filter((i) => (i.pk_id ?? i.item_id) !== savedPkId);
                return { ...prev, unknown_data: isArr ? filtered : { ...gv, items: filtered } };
              });
            }
            await fetchExtractionForPageSilent(currentPage);
          }}
        />
      </div>
    </div>,
    document.body,
  );
};

// ─── AIDetectionPortal — wraps WorkspaceAIDetectionModal in a portal ──────────
export const AIDetectionPortal = ({
  showAIDetectionModal, onClose,
  documentId, currentPage,
  onDetect, takeoffCategoriesRes, eligibleTakeoffsRes,
}) => {
  if (!showAIDetectionModal) return null;
  return ReactDOM.createPortal(
    <WorkspaceAIDetectionModal
      open={showAIDetectionModal}
      onClose={onClose}
      documentId={documentId}
      pageNumber={currentPage + 1}
      onDetect={onDetect}
      takeoffCategoriesRes={takeoffCategoriesRes}
      eligibleTakeoffsRes={eligibleTakeoffsRes}
    />,
    document.body,
  );
};

// ─── ProceedConfirmModal ──────────────────────────────────────────────────────
export function ProceedConfirmModal({ message, onConfirm, onClose }) {
  return (
    <div className="tw-fixed tw-inset-0 tw-bg-black/50 tw-flex tw-items-center tw-justify-center tw-z-50">
      <div className="tw-relative tw-bg-white tw-w-[420px] tw-rounded-xl tw-shadow-xl tw-p-8 tw-text-center">
        <button onClick={onClose} className="tw-absolute tw-right-4 tw-top-4 tw-text-gray-400 hover:tw-text-gray-600">
          <i className="icon-Failed tw-text-[27px]"></i>
        </button>
        <div className="tw-flex tw-justify-center tw-mb-6">
          <div className="tw-relative">
            <div className="tw-w-[80px] tw-h-[80px] tw-bg-[linear-gradient(135deg,#fff3cd,#ffe0a3)] tw-rounded-full tw-flex tw-items-center tw-justify-center">
              <div className="tw-w-[60px] tw-h-[60px] tw-bg-[linear-gradient(135deg,#ffd97d,#ffbe50)] tw-rounded-full tw-flex tw-items-center tw-justify-center">
                <i className="icon-Alert---fill tw-text-[40px] tw-text-[#d97706]" />
              </div>
            </div>
            <span className="tw-absolute tw-left-[-12px] tw-bottom-[-7px] tw-w-4 tw-h-4 tw-bg-[linear-gradient(135deg,#ffd97d,#ffbe50)] tw-rounded-full"></span>
          </div>
        </div>
        <h2 className="tw-text-lg tw-font-semibold tw-mb-2">Confirm Recalculation</h2>
        <p className="tw-text-[14px] tw-text-[#000] tw-mb-6">{message}</p>
        <div className="tw-flex tw-gap-3">
          <button onClick={onClose} className="tw-flex-1 tw-rounded-md tw-py-3 tw-font-semibold tw-text-[#334155] tw-bg-[#F1F5F9] tw-border tw-border-slate-200 hover:tw-bg-slate-100">
            Cancel
          </button>
          <button onClick={onConfirm} className="tw-flex-1 tw-rounded-md tw-py-3 tw-font-semibold tw-text-white tw-bg-[#0140c1] hover:tw-bg-blue-800 tw-transition-colors">
            Yes, Proceed
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── ConfirmRerunModal — "Run AI Detection/Extraction again?" ─────────────────
export const ConfirmRerunModal = ({ confirmModal, setConfirmModal, currentPage }) => {
  if (!confirmModal) return null;
  return ReactDOM.createPortal(
    <div
      style={{ position: "fixed", inset: 0, zIndex: 10000, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.50)" }}
    >
      <div style={{ background: "#fff", borderRadius: 12, boxShadow: "0 24px 64px rgba(0,0,0,0.22)", width: "100%", maxWidth: 403, padding: "32px 28px 24px", display: "flex", flexDirection: "column", alignItems: "center", gap: 0 }}>
        <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </div>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: "#111827", margin: "0 0 8px", textAlign: "center" }}>
          {confirmModal.type === "detection"
            ? "Run AI Detection again?"
            : confirmModal.type === "detection_manual_only"
              ? "Run AI Detection?"
              : "Re-run AI Extraction?"}
        </h2>
        <p style={{ fontSize: 14, color: "#6b7280", textAlign: "center", margin: "0 0 24px", lineHeight: 1.6 }}>
          {confirmModal.type === "detection"
            ? "AI Detection has already been run on this page. Running it again will replace the existing data, including any manual adjustments or boxes you have drawn. Are you sure you want to continue?"
            : confirmModal.type === "detection_manual_only"
              ? "Some items have already been extracted from this page. Running AI Detection will replace the boxes you have drawn. Are you sure you want to continue?"
              : <>AI Extraction has already been completed for <strong>Page {currentPage + 1}</strong>. Running it again will <strong>re-process</strong> all takeoff data on this page and may overwrite any manual edits. Are you sure you want to continue?</>}
        </p>
        <div style={{ display: "flex", gap: 12, width: "100%" }}>
          <button onClick={() => setConfirmModal(null)} style={{ flex: 1, padding: "10px 0", borderRadius: 8, border: "1px solid #d1d5db", background: "#fff", color: "#374151", fontSize: 14, fontWeight: 500, cursor: "pointer" }}>
            Cancel
          </button>
          <button onClick={confirmModal.onConfirm} style={{ flex: 1, padding: "10px 0", borderRadius: 8, border: "none", background: "#2563eb", color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
            Yes, Run Again
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
};