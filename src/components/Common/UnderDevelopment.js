import React from "react";
import under_development from "../../assets/Images/no_data_images/under-development.webp";

const UnderDevelopment = () => {
  return (
    <div className="tw-w-full tw-h-[calc(95vh-100px)] tw-flex tw-justify-center tw-items-center tw-bg-white tw-rounded-lg tw-px-4">
      <div className="tw-flex tw-flex-col tw-items-center tw-gap-6 tw-py-12 tw-px-8 tw-max-w-xl">

        {/* Image Section */}
        <div className="tw-flex tw-justify-center tw-items-center tw-w-full">
          <img
            src={under_development}
            alt="Under Development Illustration"
            className="tw-max-w-[380px] tw-w-full tw-h-auto"
          />
        </div>

        {/* Text Section */}
        <div className="tw-flex tw-flex-col tw-items-center tw-text-center tw-w-full">
          <h2 className="tw-text-2xl tw-font-semibold tw-text-[#0b2436]">
            Under Development
          </h2>

          <p className="tw-text-[#4b5563] tw-text-[15px] tw-mt-3">
            This module will be available soon.
            <br />
            We appreciate your patience.
          </p>
        </div>

      </div>
    </div>
  );
};

export default UnderDevelopment;
