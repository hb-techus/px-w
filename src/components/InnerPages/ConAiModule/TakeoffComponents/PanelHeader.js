import React from "react";
import { X } from "lucide-react";

const PanelHeader = ({
  nameDraft, itemName, categoryLabel,
  isSaving, safeClose,
  activeTab, setActiveTab,
  resolvedType, steelCats,
  isAddMode,
  itemColor,
}) => {
  const steelAssemblyDisabled = resolvedType === 'steel' && Object.values(steelCats).every((v) => !v);
  const dotColor = itemColor || "#f59e0b";

  return (
    <div className="tw-px-6 tw-pt-4 tw-pb-0 tw-flex-shrink-0 tw-bg-white" style={{ borderTopLeftRadius: 16, borderTopRightRadius: 16 }}>
      <div className="tw-flex tw-items-center tw-justify-between tw-mb-3">
        {isAddMode ? (
          <p className="tw-text-[16px] tw-font-semibold tw-text-gray-900">
            {(nameDraft || itemName || categoryLabel || 'Item')} Details
          </p>
        ) : (
          <div className="tw-flex tw-items-center tw-gap-2">
            <div className="tw-h-3 tw-w-3 tw-rounded-full tw-flex-shrink-0" style={{ backgroundColor: dotColor }} />
            <span className="tw-text-[11px] tw-font-bold tw-uppercase tw-tracking-widest tw-text-gray-400">
              {categoryLabel || 'Item'} — Edit Item
            </span>
          </div>
        )}
        <button
          onClick={safeClose}
          disabled={isSaving}
          className="tw-rounded-md tw-p-1 tw-transition-all tw-duration-150 hover:tw-bg-gray-100 disabled:tw-opacity-40 disabled:tw-cursor-not-allowed"
          style={{ color: "#4b5563" }}
          onMouseEnter={(e) => { if (!isSaving) e.currentTarget.style.color = "#374151"; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = "#4b5563"; }}
        >
          <X className="tw-h-4 tw-w-4" />
        </button>
      </div>
      {!isAddMode && (
        <input
          value={nameDraft}
          onChange={e => { setNameDraft(e.target.value); setItemName(e.target.value); }}
          onKeyDown={e => { if (e.key === "Enter") e.target.blur(); }}
          disabled={isSaving}
          placeholder="Item name"
          className="tw-text-base tw-font-semibold tw-text-gray-900 tw-bg-transparent tw-border-b tw-outline-none tw-w-full placeholder:tw-text-gray-300 disabled:tw-opacity-50 tw-mb-3"
          style={{ borderColor: "#4488ff" }}
        />
      )}
      <div style={{ display: 'flex', gap: 8, background: '#efefef', padding: 4, borderRadius: 8 }}>
        <button
          onClick={() => setActiveTab('general')}
          className={`tw-flex-1 tw-py-2 tw-text-sm tw-font-medium tw-rounded-md tw-transition-all tw-duration-150 tw-border-none tw-cursor-pointer ${
            activeTab === 'general' ? 'tw-bg-[#4488FF] tw-text-white' : 'tw-bg-transparent tw-text-gray-700'
          }`}
        >
          General
        </button>
        <button
          onClick={() => { if (!steelAssemblyDisabled) setActiveTab('assembly'); }}
          title={steelAssemblyDisabled ? 'Select at least one steel category to enable Assembly' : undefined}
          className={`tw-flex-1 tw-py-2 tw-text-sm tw-font-medium tw-rounded-md tw-transition-all tw-duration-150 tw-border-none ${
            steelAssemblyDisabled ? 'tw-cursor-not-allowed tw-opacity-40' : 'tw-cursor-pointer'
          } ${
            activeTab === 'assembly' && !steelAssemblyDisabled
              ? 'tw-bg-[#4488FF] tw-text-white'
              : 'tw-bg-transparent tw-text-gray-700'
          }`}
        >
          Assembly
        </button>
      </div>
    </div>
  );
};

export default PanelHeader;
