import React from "react";

export default function PageHeader({
  parentTitle,
  title,
  onBack,
}) {
  return (
    <div className="tw-flex tw-gap-[20px] tw-mb-[20px]">
      <div
        className="tw-w-[40px] tw-h-[40px] tw-flex tw-justify-center tw-items-center tw-rounded-[5px] tw-bg-[#b3bcce] tw-cursor-pointer hover:tw-bg-[#0140c1] tw-transition-colors tw-duration-200"
        onClick={onBack}
      >
        <i className="icon icon-Previous tw-text-[26px] tw-text-[#f5f7fa]" />
      </div>

      <div>
        <p className="tw-text-[14px] tw-text-[#535353]">
          {parentTitle} /
        </p>

        <p className="tw-text-[20px] tw-font-semibold tw-text-[#002149]">
          {title}
        </p>
      </div>
    </div>
  );
}