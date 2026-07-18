

import React, { useState } from 'react';
import { CheckCircle, FileText, List } from 'lucide-react';

const AnalysisComplete = ({ sections = [], nPages = 0, onBack, onProceed }) => {
  console.log("Proposal Sections Data:", sections);
const [proceeding, setProceeding] = useState(false);
  return (
    <div className="tw-px-12 tw-pt-2">
      <div className="tw-bg-white tw-rounded-xl tw-shadow-sm tw-border tw-border-gray-100 tw-overflow-hidden">

        {/* Header */}
        <div className="tw-pt-12 tw-pb-8 tw-text-center">
          <div className="tw-inline-flex tw-items-center tw-justify-center tw-w-12 tw-h-12 tw-bg-green-500 tw-rounded-lg tw-mb-4">
            <CheckCircle className="tw-text-white tw-w-8 tw-h-8" />
          </div>
          <h1 className="tw-text-2xl tw-font-bold tw-text-gray-800">Analysis Complete!</h1>
          <p className="tw-text-gray-400 tw-text-sm tw-mt-2">
            Your RFP has been thoroughly analyzed and sections have been identified.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="tw-grid tw-grid-cols-2 tw-gap-6 tw-px-12 tw-mb-8">
          <div className="tw-flex tw-items-center tw-p-6 tw-bg-white tw-border tw-border-gray-100 tw-rounded-xl tw-shadow-sm">
            <div className="tw-p-3 tw-bg-blue-50 tw-rounded-lg tw-mr-4">
              <FileText className="tw-text-blue-500 tw-w-8 tw-h-8" />
            </div>
            <div>
              <div className="tw-text-3xl tw-font-bold tw-text-blue-600">{nPages || "—"}</div>
              <div className="tw-text-xs tw-font-medium tw-text-gray-500 tw-uppercase">Pages Analyzed</div>
            </div>
          </div>

          <div className="tw-flex tw-items-center tw-p-6 tw-bg-white tw-border tw-border-gray-100 tw-rounded-xl tw-shadow-sm">
            <div className="tw-p-3 tw-bg-green-50 tw-rounded-lg tw-mr-4">
              <List className="tw-text-green-500 tw-w-8 tw-h-8" />
            </div>
            <div>
              <div className="tw-text-3xl tw-font-bold tw-text-green-600">{sections.length}</div>
              <div className="tw-text-xs tw-font-medium tw-text-gray-500 tw-uppercase">Sections Found</div>
            </div>
          </div>
        </div>

        {/* Identified Sections */}
        <div className="tw-mx-12 tw-mb-12 tw-p-6 tw-bg-white tw-border tw-border-gray-100 tw-rounded-xl">
          <h2 className="tw-text-lg tw-font-bold tw-text-gray-800 tw-mb-6">Identified Proposal Sections</h2>
          {sections.length > 0 ? (
            <div className="tw-grid tw-grid-cols-2 tw-gap-x-8 tw-gap-y-3">
              {sections.map((section, index) => (
                

<div
  key={index}
  className="tw-flex tw-items-center tw-gap-3 tw-px-4 tw-py-3 tw-bg-[#f9fafb] tw-rounded-xl tw-border "
>
  <i className="icon-Processed tw-text-green-500 tw-text-[20px] tw-flex-shrink-0" />
  <span className="tw-text-sm tw-font-semibold tw-text-gray-800">{section.title}</span>
</div>
              ))}
            </div>
          ) : (
            <p className="tw-text-sm tw-text-gray-400">No sections found.</p>
          )}
        </div>
      </div>

      {/* Footer Buttons */}
      <div className="tw-mx-auto tw-mt-6 tw-flex tw-justify-between tw-items-center">
        <button
          onClick={onBack}
          className="tw-flex tw-items-center tw-gap-2 tw-px-6 tw-py-2.5 tw-bg-[#e0e0e0] tw-text-[#1e293b] tw-rounded-[8px] tw-font-medium hover:tw-bg-gray-300 tw-transition-colors"
        >
          <i className="icon-Back tw-text-[14px]" />
          Back
        </button>

       
<button
  onClick={async () => {
    setProceeding(true);
    await onProceed({
      sections,
      nPages: nPages || 0
    });
  }}
  disabled={proceeding}
  className="group tw-flex tw-items-center tw-gap-2 tw-px-6 tw-py-2.5 tw-bg-[#0140c1] tw-text-white tw-rounded-[8px] tw-font-medium tw-shadow-md
    tw-transition-all tw-duration-300 tw-ease-in-out
    hover:tw-bg-[#1b44c4] hover:tw-shadow-lg hover:tw-shadow-blue-200/50
    hover:tw-scale-[1.03] hover:-tw-translate-y-[1px]
    active:tw-scale-[0.98] tw-whitespace-nowrap
    disabled:tw-opacity-70 disabled:tw-cursor-not-allowed disabled:tw-scale-100 disabled:tw-translate-y-0"
>
  {proceeding ? (
    <>
      <svg className="tw-animate-spin tw-w-4 tw-h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="tw-opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="tw-opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
      Processing...
    </>
  ) : (
    <>
      <i className="icon-AI-fill tw-text-[14px] tw-transition-transform tw-duration-300 group-hover:tw-translate-x-1" />
      Proceed with AI Proposal Writing
    </>
  )}
</button>
      </div>
    </div>
  );
};

export default AnalysisComplete;