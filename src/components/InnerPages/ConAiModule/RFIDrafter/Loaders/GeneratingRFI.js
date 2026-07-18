import React from "react";

const GeneratingRFI =({ gapsCount = 0 }) => {
  return (
    <div className="tw-w-full tw-h-full tw-flex tw-items-center tw-justify-center tw-bg-[#f5f7fa] !tw-overflow-hidden">
      
      <div className="tw-w-[620px] tw-p-[50px_40px] tw-bg-white tw-border tw-border-[#e0e0e0] tw-rounded-md tw-flex tw-flex-col tw-gap-4 tw-items-center tw-text-center">

        {/* Icon */}
        <div className="tw-w-[70px] tw-h-[70px] tw-bg-[#eaf2ff] tw-rounded-full tw-flex tw-items-center tw-justify-center">
          <i className="icon-AI-fill tw-text-[42px] tw-text-[#2f5bea]" />
        </div>

        {/* Title */}
        <div className="tw-w-[309px] tw-h-[24px]  tw-text-[20px] tw-font-bold tw-tracking-[0.31px] tw-text-black tw-font-inter">
          Generating Your RFI Document
        </div>

        {/* Sub Text */}
        <div className="tw-w-[472px] tw-h-[40px]  tw-text-[15px] tw-leading-[1.33] tw-tracking-[0.24px] tw-text-[#555] tw-font-inter">
          Our AI is analyzing {gapsCount} selected gap(s) and drafting professional RFI
          content tailored to your requirements.
        </div>

        {/* Processing */}
        <div className="tw-flex tw-items-center">
          <div className="tw-w-4 tw-h-4 tw-border-2 tw-border-gray-400 tw-border-t-transparent tw-rounded-full tw-animate-spin"></div>

          <span className="tw-w-[95px] tw-h-[20px] tw-ml-[10px] tw-text-[15px] tw-leading-[1.33] tw-tracking-[0.24px] tw-text-[#555] tw-font-inter">
            Processing...
          </span>
        </div>

      </div>

    </div>
  );
};

export default GeneratingRFI;