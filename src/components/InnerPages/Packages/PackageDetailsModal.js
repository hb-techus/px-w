import React from "react";

import { formatDollarCompact } from "../../../utils/commonUtils";
import { ShimmerThumbnail } from "react-shimmer-effects";

const flattenSelectedChildren = (children = [], parentName = null) => {
  const result = [];
  children.forEach((child) => {
    if (child.children && child.children.length > 0) {
      result.push(...flattenSelectedChildren(child.children, child.name));
    } else {
      const isGenericName = child.name.toLowerCase().startsWith("number of");
      const displayName = isGenericName && parentName ? parentName : child.name;
      result.push({
        name: displayName,
        selected: child.selected,
        item_count: child.item_count,
        display_text_2: child.display_text_2,
        is_included_text: child.is_included_text,
      });
    }
  });
  return result;
};

const getAccessLabel = (item) => {
  if (!item.selected) return null;
  if (item.item_count != null && item.item_count > 0) {
    const unit = item.display_text_2
      ? item.display_text_2.replace("Enter ", "").replace(" Count", "")
      : "Items";
    return { label: `${item.item_count} ${unit}`, type: "count" };
  }
  if (item.display_text_2) return { label: "Full Access", type: "full" };
  return { label: "Included", type: "included" };
};

const FeatureCard = ({ title, items = [], isChecked = false }) => {
  const effectiveChecked =
    isChecked || (items.length > 0 && items.every((i) => i.selected));

  const selectedItems = items.filter((i) => i.selected);
  if (!effectiveChecked && selectedItems.length === 0) return null;

  return (
    <div
      className={`tw-border ${
        effectiveChecked ? "tw-border-blue-100" : "tw-border-gray-200"
      } tw-rounded-lg tw-overflow-hidden tw-bg-white`}
    >
      {/* Header */}
      <div
        className={`tw-px-4 tw-py-2.5 tw-flex tw-items-center tw-gap-2 tw-border-b ${
          effectiveChecked
            ? "tw-bg-blue-50 tw-border-blue-100"
            : "tw-bg-gray-50 tw-border-gray-200"
        }`}
      >
        <div
          className={`tw-w-4 tw-h-4 tw-rounded tw-flex tw-items-center tw-justify-center tw-flex-shrink-0 ${
            effectiveChecked
              ? "tw-bg-blue-600"
              : "tw-bg-white tw-border tw-border-gray-300"
          }`}
        >
          {effectiveChecked && (
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="4"
              className="tw-w-3 tw-h-3"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          )}
        </div>
        <span
          className={`tw-text-[13px] tw-font-bold ${
            effectiveChecked ? "tw-text-[#0a0a0a]" : "tw-text-slate-400"
          }`}
        >
          {title}
        </span>
      </div>

      {/* Items — only selected */}
      {selectedItems.length > 0 && (
        <ul className="tw-px-4 tw-py-3 tw-space-y-2">
          {selectedItems.map((item, idx) => {
            const access = getAccessLabel(item);
            return (
              <li
                key={idx}
                className="tw-flex tw-items-center tw-justify-between tw-gap-2"
              >
                <div className="tw-flex tw-items-center tw-gap-2 tw-min-w-0">
                  <div className="tw-w-1.5 tw-h-1.5 tw-rounded-full tw-flex-shrink-0 tw-bg-slate-600" />
                  <span className="tw-text-[12px] tw-text-[#1a1a1a] tw-truncate">
                    {item.name}
                  </span>
                </div>
                {access && (
                  <span
                    className={`tw-text-[10px] tw-font-semibold tw-px-2 tw-py-0.5 tw-rounded-full tw-flex-shrink-0 tw-whitespace-nowrap ${
                      access.type === "count"
                        ? "tw-bg-blue-50 tw-text-[#0140c1] tw-border tw-border-blue-100"
                        : access.type === "full"
                          ? "tw-bg-green-50 tw-text-[#17803d] tw-border tw-border-green-100"
                          : "tw-bg-gray-50 tw-text-gray-500 tw-border tw-border-gray-200"
                    }`}
                  >
                    {access.label}
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

const PackageDetailsModal = ({ packageData, isLoading = false, onClose }) => {
  const enabledFeatures =
    !isLoading && packageData
      ? (packageData.features || []).filter((feature) => {
          const flatItems = flattenSelectedChildren(feature.children || []);
          return feature.selected && flatItems.some((i) => i.selected);
        })
      : [];

  return (
    <div className="tw-fixed tw-inset-0 tw-z-[99] tw-flex tw-items-center tw-justify-center tw-bg-black/40 tw-backdrop-blur-sm tw-px-4">
      <div className="tw-bg-white tw-rounded-2xl tw-shadow-2xl tw-w-full tw-max-w-3xl tw-h-[80vh] tw-flex tw-flex-col">
        {/* ── Modal Header ── */}
        <div className="tw-flex tw-items-center tw-justify-between tw-px-6 tw-py-4 tw-border-b tw-border-gray-100">
          {isLoading ? (
            <div className="tw-w-48 tw-h-5 tw-rounded tw-bg-gray-200 tw-animate-pulse" />
          ) : (
            <div>
              <h2 className="tw-text-[17px] tw-font-bold tw-text-[#0a0a0a]">
                {packageData?.name}
              </h2>
            </div>
          )}
        </div>

        {/* ── Scrollable Body ── */}
        <div className="custom-select-dropdown tw-overflow-y-auto tw-flex-1 tw-px-6 tw-py-5 tw-space-y-5">
          {/* ── Pricing Row ── */}
          {isLoading ? (
            <div className="tw-grid tw-grid-cols-2 tw-gap-4">
              <ShimmerThumbnail height={90} rounded />
              <ShimmerThumbnail height={90} rounded />
            </div>
          ) : (
            <div className="tw-grid tw-grid-cols-2 tw-gap-4">
              <div className="tw-bg-blue-50 tw-rounded-xl tw-p-4 tw-border tw-border-blue-100">
                <p className="tw-text-[11px] tw-uppercase tw-font-semibold tw-text-[#6e7178] tw-tracking-wider tw-mb-1">
                  Monthly Price
                </p>
                <p className="tw-text-[22px] tw-font-bold tw-text-[#0140c1]">
                  {packageData?.pricing_monthly
                    ? formatDollarCompact(packageData.pricing_monthly)
                    : "-"}
                </p>
                <p className="tw-text-[11px] tw-text-gray-400">per month</p>
              </div>
              <div className="tw-bg-blue-50 tw-rounded-xl tw-p-4 tw-border tw-border-blue-100">
                <p className="tw-text-[11px] tw-uppercase tw-font-semibold tw-text-[#6e7178] tw-tracking-wider tw-mb-1">
                  Annual Price
                </p>
                <p className="tw-text-[22px] tw-font-bold tw-text-[#0140c1]">
                  {packageData?.pricing_annual
                    ? formatDollarCompact(packageData.pricing_annual)
                    : "-"}
                </p>
                <p className="tw-text-[11px] tw-text-gray-400">per year</p>
              </div>
            </div>
          )}

          {/* ── Enabled Modules & Features ── */}
          <div>
            <p className="tw-text-[12px] tw-uppercase tw-font-bold tw-text-[#6e7178] tw-tracking-wider tw-mb-3">
              Enabled Modules & Features
            </p>

            {isLoading ? (
              <div className="tw-grid tw-grid-cols-2 tw-gap-3">
                {[1, 2, 3, 4].map((i) => (
                  <ShimmerThumbnail key={i} height={140} rounded />
                ))}
              </div>
            ) : enabledFeatures.length === 0 ? (
              <p className="tw-text-[13px] tw-text-gray-400">
                No features enabled.
              </p>
            ) : (
              <div className="tw-grid tw-grid-cols-2 tw-gap-3">
                {enabledFeatures.map((feature) => (
                  <FeatureCard
                    key={feature.id}
                    title={feature.name}
                    items={flattenSelectedChildren(feature.children || [])}
                    isChecked={feature.selected}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="tw-px-6 tw-py-4 tw-border-t tw-border-gray-100 tw-flex tw-justify-end">
          <button
            onClick={onClose}
            className="tw-px-8 tw-py-2 tw-bg-[#0140c1] tw-text-white tw-rounded-lg tw-text-[13px] tw-font-semibold hover:tw-bg-blue-800 tw-transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default PackageDetailsModal;
