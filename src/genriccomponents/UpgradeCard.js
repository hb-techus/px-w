import React from "react";
import upgradImg from "/src/assets/Images/no_data_images/upgrade_1.webp";

const UpgradeCard = ({
  title = "Unlock Full Risk Insights with an Upgrade!",
  description = "",
  buttonLabel = "Upgrade Your Package",
  onUpgrade,
  imageSrc = upgradImg,
  imageInside = false,
  maxWidthClass = "tw-max-w-[520px]",
}) => {
  const image = (
    <img
      src={imageSrc}
      alt="Upgrade"
      className="tw-h-[112px] tw-w-[156px] tw-object-contain md:tw-h-[124px] md:tw-w-[172px]"
    />
  );

  const content = (
    <>
      <h3 className="tw-text-[18px] md:tw-text-[20px] tw-font-bold tw-leading-[1.25] tw-text-black">
        {title}
      </h3>

      <p className="tw-mx-auto tw-mt-4 tw-max-w-[390px] tw-text-[13px] md:tw-text-[15px] tw-leading-[1.55] tw-text-[#2f2f2f]">
        {description}
      </p>

      <button
        type="button"
        onClick={onUpgrade}
        className="tw-mt-6 tw-inline-flex tw-h-[40px] tw-w-[208px] tw-items-center tw-justify-center tw-rounded-[4px] tw-bg-[#0b4bd4] tw-px-6 tw-text-[13px] tw-font-medium tw-text-white tw-shadow-[0_4px_10px_rgba(11,75,212,0.32)] tw-transition-all hover:tw-bg-[#0a44bf] hover:tw-shadow-[0_6px_14px_rgba(11,75,212,0.36)]"
      >
        {buttonLabel}
      </button>
    </>
  );

  if (imageInside) {
    return (
      <div className={`tw-w-full ${maxWidthClass}`}>
        <div className="tw-rounded-[18px] tw-border tw-border-[#d5d5d5] tw-bg-white tw-px-6 tw-pb-8 tw-pt-5 tw-text-center tw-shadow-[0_3px_0_rgba(0,0,0,0.06),0_8px_18px_rgba(0,0,0,0.16)] md:tw-px-10 md:tw-pb-9 md:tw-pt-6">
          <div className="tw-mx-auto tw-mb-3 tw-flex tw-justify-center md:tw-mb-4">
            {image}
          </div>
          {content}
        </div>
      </div>
    );
  }

  return (
    <div className={`tw-relative tw-w-full tw-pt-[18px] ${maxWidthClass}`}>
      <div className="tw-absolute tw-inset-x-0 tw-top-0 tw-z-10 tw-flex tw-justify-center">
        <div className="-tw-translate-y-[36%]">
          {image}
        </div>
      </div>

      <div className="tw-relative tw-rounded-[18px] tw-border tw-border-[#d5d5d5] tw-bg-white tw-px-6 tw-pb-8 tw-pt-[58px] tw-text-center tw-shadow-[0_3px_0_rgba(0,0,0,0.06),0_8px_18px_rgba(0,0,0,0.16)] md:tw-px-10 md:tw-pb-9 md:tw-pt-[62px]">
        {content}
      </div>
    </div>
  );
};

export default UpgradeCard;
