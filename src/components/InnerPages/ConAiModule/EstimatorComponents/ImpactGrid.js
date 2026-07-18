import React from 'react';

export const ICON_MAP = {
  Labor: { icon: "icon-labor-budget", iconBg: "tw-bg-blue-50", iconColor: "tw-text-blue-500" },
  Materials: { icon: "icon-material-budget", iconBg: "tw-bg-orange-50", iconColor: "tw-text-orange-500" },
  Project: { icon: "icon-Concrete", iconBg: "tw-bg-green-50", iconColor: "tw-text-green-500" },
  Process: { icon: "icon-process", iconBg: "tw-bg-red-50", iconColor: "tw-text-red-500" },
  Overhead: { icon: "icon-Fee", iconBg: "tw-bg-purple-50", iconColor: "tw-text-purple-500" },
  Risk: { icon: "icon-Timeline", iconBg: "tw-bg-blue-50", iconColor: "tw-text-blue-900" },
};

const fmt$ = (v) => {
  const abs = "$" + Math.abs(v).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  // const abs = "$" + Math.abs(Math.round(v)).toLocaleString("en-US");

  return (v >= 0 ? "+" : "-") + abs;
};
const ImpactCard = ({ label, rawValue }) => {
  const config = ICON_MAP[label] || ICON_MAP.Process;
  const isPositive = rawValue >= 0;

  return (
    <div className="tw-flex tw-flex-col tw-justify-between tw-bg-white tw-rounded-[10px] tw-border tw-border-[#e0e0e0] tw-p-[15px] tw-pb-[28px]">
      <div className="tw-flex tw-justify-between tw-items-start tw-w-full">
        <span className="tw-text-[14px] tw-font-[500] tw-text-black">{label}</span>
        <div className={`tw-flex tw-items-center tw-justify-center tw-w-[40px] tw-h-[40px] tw-rounded-[6px] ${config.iconBg} ${config.iconColor}`}>
          <i className={`${config.icon} tw-text-2xl`} />
        </div>
      </div>
      <div className={`tw-text-[21px] tw-font-bold tw-mt-4 ${isPositive ? "tw-text-[#f00]" : "tw-text-[#000]"}`}>
        {fmt$(rawValue)}
      </div>
    </div>
  );
};

// impacts = { Labor: number, Materials: number, ... }
const ImpactGrid = ({ impacts = {} }) => {
  const ORDER = ["Labor", "Materials", "Project", "Process", "Overhead", "Risk"];

  return (
    <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-3 lg:tw-grid-cols-6 tw-gap-4 tw-mb-4">
      {ORDER.map((label) => (
        <ImpactCard key={label} label={label} rawValue={impacts[label] ?? 0} />
      ))}
    </div>
  );
};

export default ImpactGrid;
