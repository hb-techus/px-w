import React from 'react';
import { useROI } from './ROIContext';

const FiveYearProjection = () => {
  const { results } = useROI();

  return (
    <div className="tw-bg-white tw-rounded-lg tw-border tw-shadow-sm tw-overflow-hidden">
      <div className="tw-relative tw-px-6 tw-pt-6 tw-pb-4">
        <div className="tw-absolute tw-left-0 tw-top-0 tw-bottom-0 tw-w-1 tw-bg-green-500"></div>
        <div className="tw-flex tw-items-center tw-gap-3">
          <div className="tw-bg-green-50 tw-w-10 tw-h-10 tw-rounded-md tw-flex tw-items-center tw-justify-center tw-shrink-0">
            <i className="icon-Schedule tw-text-green-500 tw-text-lg"></i>
          </div>
          <div>
            <h3 className="tw-font-bold tw-text-gray-800 tw-leading-tight">5-Year Financial Projection</h3>
            <p className="tw-text-xs tw-text-gray-400 tw-pt-2">Cumulative savings over time</p>
          </div>
        </div>
      </div>
      <div className="tw-px-6 tw-pb-4 tw-flex tw-flex-col tw-gap-1 tw-pt-6 tw-border-t">
        {results.projectionYears.map((item) => (
          <div key={item.id} className="tw-flex tw-items-center tw-justify-between tw-py-3 ">
            <span className="tw-text-sm tw-text-gray-600 tw-font-medium tw-w-14 tw-shrink-0">{item.label}</span>
            <span
              className="tw-flex-1 tw-mx-3 tw-mb-1"
              style={{
                borderBottom: "1px dashed #d1d5db"
              }}
            ></span>
            <span className="tw-text-sm tw-font-bold tw-text-gray-900">{item.value}</span>
          </div>
        ))}
      </div>
      <div className="tw-mx-6 tw-mb-6 tw-border tw-border-[#34c759] tw-bg-[#e2ffec] tw-rounded-xl tw-py-8 tw-px-6 tw-flex tw-items-center tw-justify-center">
        <div className="tw-flex tw-items-center tw-gap-6">
          <i className="icon-roi-summary tw-text-[#34c759] tw-text-[37px]"></i>

          <div className="tw-flex tw-flex-col tw-items-start">
            <p className="tw-text-[15px] tw-font-[600] tw-text-[#111827]">
              5-Year Cumulative Savings
            </p>
            <p className="tw-text-[30px] tw-leading-none tw-font-[700] tw-text-[#34c759] tw-mt-2">
              {results.fiveYearCumulative}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
export default FiveYearProjection;
