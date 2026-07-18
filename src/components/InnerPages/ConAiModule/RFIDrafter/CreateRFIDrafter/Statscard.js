import React from "react";

const Statscard = ({ title, value, icon, iconBg, iconColor, valueColor }) => {
  return (
    <div className="tw-rounded-[10px] tw-border tw-border-[#e0e0e0] tw-bg-white tw-p-4 tw-flex tw-justify-between tw-flex-1 tw-items-center">
      <div className="tw-flex tw-flex-col ">
        <span className="tw-text-[14px] tw-text-[#1e293b] tw-tracking-[0.31px]">
          {title}
        </span>

        <span
          className="tw-text-[25px] tw-font-[700]"
          style={{ color: valueColor }}
        >
          {value}
        </span>
      </div>

      <div
        className="tw-rounded-[4px] tw-w-[48px] tw-h-[48px] tw-flex tw-items-center tw-justify-center"
        style={{ backgroundColor: iconBg }}
      >
        <i
          className={`${icon} tw-text-[26px]`}
          style={{ color: iconColor }}
        ></i>
      </div>
    </div>
  );
};

export default Statscard;