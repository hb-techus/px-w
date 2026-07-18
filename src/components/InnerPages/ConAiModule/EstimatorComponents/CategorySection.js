import React, { useState } from 'react';
import { RotateCcw } from 'lucide-react';

const CategorySection = ({
  title,
  subtitle = "Variables related to cost and efficiency",
  variableCount = 3,
  icon,
  iconBg,
  iconColor,
  borderColor, 
  impact,
  defaultExpanded = true,
  onReset,
  children,
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const isPositiveImpact = impact >= 0;

  return (
    <div className="tw-border tw-border-slate-200 tw-rounded-xl tw-bg-white tw-shadow-sm tw-overflow-hidden tw-h-fit tw-self-start">
      
      {/* ── Header: Border is applied ONLY here ── */}
      <div
        className={`tw-p-4 tw-flex tw-items-center tw-justify-between tw-cursor-pointer hover:tw-bg-slate-50 tw-transition-colors tw-select-none tw-border-l-4 ${borderColor}
          ${isExpanded ? "tw-border-b tw-border-slate-100" : "tw-border-b-0"}`}
        onClick={() => setIsExpanded(prev => !prev)}
      >
        <div className="tw-flex tw-items-center tw-gap-3">
          <div className={`tw-p-2 ${iconBg} tw-flex tw-items-center tw-justify-center tw-w-[40px] tw-h-[40px] tw-rounded-[6px]
                         tw-bg-blue-50 tw-text-blue-500`}>
            <i className={`${icon} ${iconColor} tw-text-2xl`} />
          </div>
          
          <div>
            <h3 className="tw-font-bold tw-text-[#333] tw-text-[16px] tw-flex tw-items-center tw-gap-1.5">
              {title}
              <span className="tw-text-[11px] tw-font-semibold tw-text-[#000] tw-bg-[#e8e8e8] tw-px-1.5 tw-py-0.5 tw-rounded-[5px]">
                {variableCount} variables
              </span>
            </h3>
            <p className="tw-text-[10px] tw-text-[#1e293b] tw-mt-0.5">{subtitle}</p>
          </div>
        </div>

        <div className="tw-flex tw-items-center tw-gap-3 tw-flex-shrink-0">
          <div className={`tw-px-2.5 tw-py-1 tw-rounded tw-border
            ${isPositiveImpact ? "tw-bg-red-50 tw-border-red-100" : "tw-bg-blue-50 tw-border-blue-100"}`}>
            <span className={`tw-text-[9px] tw-font-bold tw-uppercase tw-tracking-wide tw-block tw-leading-none tw-mb-0.5
              ${isPositiveImpact ? "tw-text-red-400" : "tw-text-blue-400"}`}>
              Impact
            </span>
            <span className={`tw-text-xs tw-font-bold ${isPositiveImpact ? "tw-text-red-500" : "tw-text-blue-600"}`}>
            {isPositiveImpact
              ? `+$${impact.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
              : `-$${Math.abs(impact).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          </span>
          </div>

          <div className="tw-flex tw-items-center tw-justify-center tw-w-[25px] tw-h-[25px] tw-border tw-border-[#75787c] tw-rounded-[5px]">
              <i
                className={`icon-Dropdown tw-inline-block tw-transition-transform tw-duration-300 ${isExpanded ? "tw-rotate-180" : "tw-rotate-0"}`}
                style={{ fontSize: "16px", color: "#000" }}
              />
            </div>
        </div>
      </div>

     
      <div className={`tw-transition-all tw-duration-300 tw-ease-in-out tw-overflow-hidden ${isExpanded ? "tw-max-h-[1000px] tw-opacity-100" : "tw-max-h-0 tw-opacity-0"}`}>
        <div className="tw-px-5 tw-pb-5">
          <div className="tw-flex tw-justify-end tw-py-2">
            <button
              onClick={e => { e.stopPropagation(); onReset?.(); }}
              className="tw-flex tw-items-center tw-gap-1 tw-text-[12px] tw-text-[#999]  tw-transition-colors"
            >
              <RotateCcw size={10} />
              Reset Category
            </button>
          </div>
          <div className="tw-space-y-4">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CategorySection;