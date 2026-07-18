import React from 'react';
import { useROI } from './ROIContext';

const MultiplierCards = () => {
  const { results } = useROI();

  const stats = [
    { label: 'TOTAL ANNUAL SAVINGS', value: results.totalAnnualSavings, sub: 'per year',            hasDivider: false },
    { label: 'PAYBACK PERIOD',       value: results.paybackPeriod,      sub: 'weeks to break even', hasDivider: true  },
    { label: 'NET ANNUAL BENEFIT',   value: results.netAnnualBenefit,   sub: 'after TCO deduction', hasDivider: true  },
  ];

  return (
    <div className="tw-flex tw-flex-col md:tw-flex-row tw-w-full tw-bg-white tw-rounded-xl tw-h-auto md:tw-h-[152px] tw-border tw-border-[#4488ff] tw-overflow-hidden tw-shadow-sm tw-mb-6">
      {/* <div className="tw-bg-gradient-to-b tw-from-blue-600 tw-to-blue-800 tw-px-6 tw-py-4 tw-flex tw-flex-col tw-items-center tw-justify-center tw-text-center tw-min-w-[200px]"> */}
       <div className="tw-bg-[linear-gradient(109deg,#0140c1_7%,#4439ba_94%)] tw-px-6 tw-py-4 tw-flex tw-flex-col tw-items-center tw-justify-center tw-text-center tw-min-w-[225px]">
        <i className="icon-AI-fill tw-text-white tw-text-xl tw-mb-1"></i>
        <p className="tw-text-[14px] tw-font-[500] tw-text-[#fff] tw-uppercase">ROI MULTIPLIER</p>
        <p className="tw-text-[35px] tw-font-semibold tw-text-white tw-leading-none tw-my-2">{results.roiMultiplier}</p>
        <div className="tw-bg-[#3f76e7] tw-px-3 tw-py-1 tw-rounded-[100px] tw-border tw-border-blue-300/20">
          <p className="tw-text-[10px] tw-font-medium tw-font-Poppins tw-text-[#fff0f0] tw-whitespace-nowrap">Return on Investment</p>
        </div>
      </div>
      <div className="tw-flex-1 tw-grid tw-grid-cols-1 md:tw-grid-cols-3 tw-bg-[#eff6ff]">
        {stats.map((item, index) => (
          <div key={index} className="tw-relative tw-px-16 tw-flex tw-flex-col tw-justify-center tw-items-start tw-text-left">
            {item.hasDivider && (
              <div className="tw-hidden md:tw-block tw-absolute tw-left-0 tw-top-1/4 tw-bottom-1/4 tw-w-[1px] tw-bg-[#9cb7d9]"></div>
            )}
            <p className="tw-text-[14px] tw-font-medium tw-text-[#000] tw-uppercase tw-mb-1 tw-w-full">{item.label}</p>
            <p className="tw-text-[30px] tw-font-semibold tw-text-[#000]">{item.value}</p>
            <p className="tw-text-[13px] tw-text-[#999] tw-mt-1">{item.sub}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
export default MultiplierCards;
