import React from "react";
import { useNavigate } from "react-router-dom";
import featureImg from "../assets/Images/no_data_images/featured-no-included.webp";

const PackageRestricted = () => {
  const navigate = useNavigate();

  return (
    <div className="tw-flex tw-items-center tw-justify-center tw-px-8 tw-mt-4"
      style={{ height: "calc(100vh - 130px)" }}
    >
      <div className="tw-bg-white tw-border tw-border-[#e5e7eb] tw-rounded-2xl tw-w-full tw-max-w-[1200px] tw-flex tw-flex-col tw-items-center tw-shadow-sm tw-py-16">

        {/* Image - increased size */}
        <div className="tw-mb-7">
          <img
            src={featureImg}
            alt="Feature Not Included"
            className="tw-w-[260px] tw-object-contain"
          />
        </div>

        {/* Title */}
        <h1 className="tw-text-[20px] tw-font-bold tw-text-[#000] tw-mb-3 tw-text-center">
          Feature Not Included
        </h1>

        {/* Description — exact line break control */}
        <p className="tw-text-[15px] tw-text-[#555] tw-mb-8 tw-text-center tw-leading-relaxed">
          This feature is not part of your current plan. Please upgrade your package or<br />
          contact your administrator to get access.
        </p>

        {/* Button */}
        <button
          onClick={() => navigate(-1)}
          className="tw-flex tw-items-center tw-gap-2 tw-bg-[#0140c1] tw-px-10 tw-h-[44px] tw-text-white tw-rounded-md tw-text-[15px] tw-font-medium tw-transition-all tw-duration-200 hover:tw--translate-y-0.5 hover:tw-shadow-[0_4px_10px_rgba(1,64,193,0.35)]"
        >
          <i className="icon-Previous tw-text-[14px]" />
          Go Back
        </button>
      </div>
    </div>
  );
};

export default PackageRestricted;