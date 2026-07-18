import React from 'react';

export default function EstimationCard({ label, value, subText, icon: Icon, iconBg = '#EEF3FF', iconColor = '#4F6BED', loading = false }) {
  return (
    <div className="tw-bg-white tw-border tw-border-slate-200 tw-rounded-xl tw-pt-5 tw-px-5 tw-pb-4 tw-shadow-sm hover:tw-shadow-md hover:tw-border-blue-300 tw-transition-all">
      <div className="tw-flex tw-items-start tw-justify-between">
        <div>
          <p className="tw-text-[14px] tw-font-medium tw-m-0">{label}</p>
          {loading
            ? <div className="tw-h-7 tw-w-32 tw-bg-slate-200 tw-rounded-lg tw-animate-pulse tw-mt-2" />
            : <p className="tw-text-[26px] tw-font-semibold tw-mt-1 tw-m-0">{value}</p>
          }
          {subText && <p className="tw-text-[13px] tw-text-[#999999] tw-mt-1 tw-m-0">{subText}</p>}
        </div>
        {Icon && (
          <div className="tw-p-2 tw-rounded-lg tw-flex-shrink-0" style={{ background: iconBg }}>
            <Icon size={20} style={{ color: iconColor }} />
          </div>
        )}
      </div>
    </div>
  );
}
