import React from "react";
import { createPortal } from "react-dom";
import LoaderImage from "../../assets/Images/loading_images/Logo-loading.svg";

const FullPageLoader = () => {
  return createPortal(
    <div className="tw-fixed tw-inset-0 tw-flex tw-items-center tw-justify-center tw-bg-black/30 tw-z-[9998] tw-transition-all tw-duration-300">
      <div className="tw-flex tw-flex-col tw-items-center tw-w-[120px] tw-h-[120px]">
        <img 
          src={LoaderImage}
          alt="Loading..."
          className="tw-w-full tw-h-full tw-object-contain tw-animate-fade-in"
        />
      </div>
    </div>,
    document.body
  );
};

export default FullPageLoader;