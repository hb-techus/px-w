import React from 'react';
import { useROI } from './ROIContext';

const ROISummary = () => {
  const { results } = useROI();

  const renderValue = (item) => {
    switch (item.style) {
      case "badge":
        return <div className="tw-bg-blue-500 tw-text-[30px] tw-text-white tw-px-3 tw-py-1 tw-rounded-full tw-inline-block tw-font-semibold tw-mt-1">{item.value}</div>;
      case "red":
        return <p className="tw-text-[30px] tw-font-semibold tw-text-red-500">{item.value}</p>;
      default:
        return <p className="tw-text-[30px] tw-font-semibold tw-text-gray-900">{item.value}</p>;
    }
  };

  return (
    <div className="tw-bg-white tw-rounded-lg tw-border tw-shadow-sm tw-overflow-hidden">
      <div className="tw-relative tw-px-6 tw-pt-6 tw-pb-4">
        <div className="tw-absolute tw-left-0 tw-top-0 tw-bottom-0 tw-w-1 tw-bg-blue-500"></div>
        <div className="tw-flex tw-items-center tw-gap-3">
          <div className="tw-bg-blue-50 tw-w-10 tw-h-10 tw-rounded-md tw-flex tw-items-center tw-justify-center tw-shrink-0">
            <i className="icon-roi-summary tw-text-blue-500 tw-text-xl"></i>
          </div>
          <div>
            <h3 className="tw-font-bold tw-text-gray-800 tw-leading-tight">ROI Summary</h3>
            <p className="tw-text-xs tw-text-[#1e293b] tw-pt-2">Complete return on investment analysis</p>
          </div>
        </div>
      </div>
      <div className="tw-px-6 tw-pb-6 tw-pt-6 tw-border-t">
        <div className="tw-flex tw-flex-col tw-gap-y-10">
          {Array.from({ length: Math.ceil(results.roiSummaryMetrics.length / 2) }).map((_, rowIndex) => {
            const leftItem = results.roiSummaryMetrics[rowIndex * 2];
            const rightItem = results.roiSummaryMetrics[rowIndex * 2 + 1];

            return (
              <div key={rowIndex} className="tw-relative tw-grid tw-grid-cols-2">
                <div className="tw-absolute tw-left-1/2 tw-top-0 tw-bottom-0 tw-w-px tw-bg-gray-200 -tw-translate-x-1/2"></div>

                <div className="tw-px-8">
                  <p className="tw-text-[14px] tw-font-500 tw-text-[#000] tw-pb-3">
                    {leftItem?.label}
                  </p>
                  {leftItem && renderValue(leftItem)}
                </div>

                <div className="tw-px-8">
                  <p className="tw-text-[14px] tw-font-500 tw-text-[#000] tw-pb-3">
                    {rightItem?.label}
                  </p>
                  {rightItem && renderValue(rightItem)}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
export default ROISummary;
