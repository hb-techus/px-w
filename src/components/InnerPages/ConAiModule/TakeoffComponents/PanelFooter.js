import React from "react";
import { Loader2 } from "lucide-react";

const PanelFooter = ({
  isSaving, isLoadingTypes, isLoadingConfig,
  isFormValid, isMarkAsCompleted,
  accentColor, mode,
  safeClose, handleSave,
}) => (
  <>
    <div className="tw-flex-shrink-0 tw-flex tw-justify-end tw-gap-5 tw-px-6 tw-py-4 tw-border-t tw-border-gray-100">
      <button
        onClick={safeClose}
        disabled={isSaving}
        className="tw-inline-flex tw-items-center tw-justify-center tw-rounded-[5px] tw-text-sm tw-font-medium tw-border tw-border-[#dedede] tw-bg-[#dedede] tw-h-9 tw-px-4 tw-transition-all tw-duration-150 disabled:tw-opacity-40 disabled:tw-cursor-not-allowed"
        style={{ color: "#374151" }}
        onMouseEnter={(e) => { if (!isSaving) { e.currentTarget.style.backgroundColor = `${accentColor}0d`; e.currentTarget.style.borderColor = accentColor; e.currentTarget.style.color = accentColor; } }}
        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "#dedede"; e.currentTarget.style.borderColor = "#e5e7eb"; e.currentTarget.style.color = "#374151"; }}
      >
        Cancel
      </button>
      <button
        onClick={handleSave}
        disabled={isSaving || isLoadingTypes || isLoadingConfig || !isFormValid || isMarkAsCompleted}
        className="tw-inline-flex tw-items-center tw-justify-center tw-gap-2 tw-rounded-[5px] tw-text-sm tw-font-semibold tw-h-9 tw-px-5 tw-text-white tw-transition-all tw-duration-150 disabled:tw-opacity-50 disabled:tw-cursor-not-allowed hover:tw-opacity-90"
        style={{ backgroundColor: "#0140c1", boxShadow: "0 1px 4px #0140c150" }}
      >
        {isSaving && <Loader2 className="tw-h-3.5 tw-w-3.5 tw-animate-spin" />}
        {isSaving ? (mode === "add" ? "Adding…" : "Saving…") : (mode === "add" ? "Add Item" : "Save Details")}
      </button>
    </div>
  </>
);

export default PanelFooter;
