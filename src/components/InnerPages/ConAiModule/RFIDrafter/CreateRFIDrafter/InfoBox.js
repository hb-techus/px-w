import React from "react";

const InfoBox = () => {
  return (
    <div className="section tw-bg-[#eaf2ff] tw-border tw-border-[#48f] tw-rounded-[10px] tw-p-4 tw-flex tw-gap-[18px] tw-items-center">
      <div className="tw-bg-[#d9e7ff] tw-rounded-[15px] tw-px-2 tw-py-2">
        <i className="icon-AI-fill tw-text-[#48f] tw-text-[30px] "></i>
      </div>
      <div>
        <p className="tw-text-[#1e293b] tw-tracking-[0.38px] tw-line-clamp-[1px]  tw-text-[15px] tw-mt-1">
          Below you'll find the gaps identified by our AI analysis of your RFP
          documents. Select the items you'd like to address, add any additional
          context or clarifications, and generate a professional RFI document to
          send to the client or main contractor for resolution.
        </p>
      </div>
    </div>
  );
};

export default InfoBox;
