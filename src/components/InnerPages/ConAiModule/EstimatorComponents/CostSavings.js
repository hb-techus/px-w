import React from 'react';
import { useROI } from './ROIContext';

const CostSavingsBreakdown = () => {
  const { results } = useROI();

  return (
    <div className="tw-bg-white tw-rounded-xl tw-shadow-sm tw-border tw-border-gray-100 tw-overflow-hidden">
      <div className="tw-border-l-4 tw-border-blue-500 tw-p-5 tw-bg-white">
        <div className="tw-flex tw-items-center tw-gap-3">
          <div className="tw-bg-blue-50 tw-w-10 tw-h-10 tw-rounded-lg tw-flex tw-items-center tw-justify-center">
            <span className="tw-text-blue-500 tw-font-bold tw-text-xl">$</span>
          </div>
          <div>
            <h3 className="tw-font-bold tw-text-[#333] tw-text-[18px] tw-leading-tight">Cost Savings Breakdown</h3>
            <p className="tw-text-[12px] tw-text-[#1e293b] tw-pt-2">Annual savings by category</p>
          </div>
        </div>
      </div>
      <div className="tw-p-5 tw-space-y-6 tw-border-t tw-pt-6">
        {results.costSavingsRows.map((row, i) => (
          <div key={i}>
            <div className="tw-flex tw-justify-between tw-text-sm tw-mb-2">
              <span className="tw-text-[#333] tw-text-[14px] tw-font-semibold">{row.label}</span>
              <div className="tw-flex tw-gap-4">
                <span className="tw-text-[#333] tw-text-[14px] tw-font-bold">{row.value}</span>
                <span className="tw-text-gray-400 tw-text-[14px] tw-w-10 tw-text-right">{row.pct}%</span>
              </div>
            </div>
            <div className="tw-w-full tw-bg-gray-100 tw-h-2 tw-rounded-full">
              <div className="tw-bg-blue-500 tw-h-full tw-rounded-full" style={{ width: `${row.pct}%` }}></div>
            </div>
          </div>
        ))}
        <div className="tw-pt-6 tw-mt-4 tw-border-t tw-border-gray-100 tw-flex tw-justify-between tw-items-center">
          <span className="tw-font-[500]">Total Annual Savings</span>
          <span className="tw-text-gray-800 tw-text-xl tw-font-semibold">{results.totalAnnualSavingsFormatted}</span>
        </div>
      </div>
    </div>
  );
};
export default CostSavingsBreakdown;

