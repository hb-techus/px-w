


import React from 'react';

const RevenueImpact = () => {
  const impactData = {
    header: {
      title: "Revenue Impact Analysis",
      subtitle: "Additional business opportunities",
      iconClass: "icon-total-markup"
    },
    metrics: [
      { id: 1, label: "Additional Bids/Year", value: "120.0", subtext: "capacity increase", layout: "grid-blue" },
      { id: 2, label: "Jobs Won", value: "36.0", subtext: "new projects", layout: "grid-blue" },
      { id: 3, label: "Additional Annual Revenue", value: "$18,000,000", subtext: null, layout: "full-border" },
      { id: 4, label: "Additional Annual Profit", value: "$2,700,000", subtext: null, layout: "full-border" }
    ]
  };

  return (
    <div className="tw-bg-white tw-rounded-lg tw-border tw-shadow-sm tw-overflow-hidden">

      {/* Header Section — orange left border only here */}
      <div className="tw-relative tw-p-6 tw-pb-4">
        <div className="tw-absolute tw-left-0 tw-top-0 tw-bottom-0 tw-w-1 tw-bg-orange-500"></div>
        <div className="tw-flex tw-items-center tw-gap-3">
          <div className="tw-bg-orange-50 tw-p-2 tw-rounded-md">
            <i className={`${impactData.header.iconClass} tw-text-orange-500 tw-text-lg`}></i>
          </div>
          <div>
            <h3 className="tw-font-bold tw-text-[ #333] tw-text-[18px] tw-leading-tight">
              {impactData.header.title}
            </h3>
            <p className="tw-text-xs tw-text-gray-400 tw-pt-4">
              {impactData.header.subtitle}
            </p>
          </div>
        </div>
      </div>

      {/* Content Section — no left border */}
      <div className="tw-px-6 tw-pb-6 tw-flex tw-flex-col tw-gap-4 tw-border-t tw-pt-6 " >
        {/* Blue Grid Items */}
        <div className="tw-grid tw-grid-cols-2 tw-gap-4">
          {impactData.metrics
            .filter((m) => m.layout === "grid-blue")
            .map((item) => (
              <div key={item.id} className="tw-bg-[#eff5ff] tw-p-4 tw-rounded-xl">
                <p className="tw-text-[14px] tw-font-medium tw-text-[#000] tw-mb-1">{item.label}</p>
                <p className="tw-text-[30px] tw-font-bold tw-text-gray-900">{item.value}</p>
                <p className="tw-text-[11px] tw-text-gray-400 tw-mt-1">{item.subtext}</p>
              </div>
            ))}
        </div>

        {/* Bordered Full Width Items */}
        {impactData.metrics
          .filter((m) => m.layout === "full-border")
          .map((item) => (
            <div key={item.id} className="tw-border tw-border-gray-100 tw-p-5 tw-rounded-xl ">
              <p className="tw-text-[14px] tw-font-medium tw-text-[#000] tw-mb-1">{item.label}</p>
              <p className="tw-text-[30px] tw-font-bold tw-text-[#000]">{item.value}</p>
            </div>
          ))}
      </div>
    </div>
  );
};

export default RevenueImpact;