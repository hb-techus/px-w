import React from 'react';

const statsData = [
  { label: 'Company', fields: 5, icon: 'icon-Concrete', color: 'tw-text-blue-600', bg: 'tw-bg-blue-50' },
  { label: 'Cost', fields: 4, icon: 'icon-Timeline', color: 'tw-text-amber-500', bg: 'tw-bg-amber-50' },
  { label: 'Project', fields: 4, icon: 'icon-project-metrics', color: 'tw-text-emerald-500', bg: 'tw-bg-emerald-50' },
  { label: 'Material', fields: 3, icon: 'icon-material-budget', color: 'tw-text-rose-500', bg: 'tw-bg-rose-50' },
  { label: 'Rework', fields: 3, icon: 'icon-rework-quality', color: 'tw-text-purple-500', bg: 'tw-bg-purple-50' },
  { label: 'Team', fields: 2, icon: 'icon-Proposal-stage', color: 'tw-text-indigo-600', bg: 'tw-bg-indigo-50' },
  { label: 'Software', fields: 4, icon: 'icon-Software-cost-inputs',color: 'tw-text-sky-600',
bg: 'tw-bg-sky-50' },
];

const StatsCards = () => {
  return (
    // <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-3 lg:tw-grid-cols-6 tw-gap-4 tw-mb-8">
    <div className="tw-grid tw-grid-cols-1 sm:tw-grid-cols-2 md:tw-grid-cols-3 lg:tw-grid-cols-4 tw-gap-4 tw-mb-8">
      {statsData.map((stat, idx) => (
        <div
          key={idx}
          className="tw-bg-white tw-p-5 tw-rounded-xl tw-border tw-border-[#e0e0e0] tw-shadow-sm tw-flex tw-justify-between tw-items-start"
        >
          <div>
            {/* Added tw-mb-2 for the vertical gap */}
            <p className=" tw-text-[13px] tw-font-[500] tw-mb-4">
              {stat.label}
            </p>

            <h3 className="tw-text-[20px] tw-font-semibold">
              {stat.fields} fields
            </h3>
          </div>

          <div className={`${stat.bg} tw-p-2 tw-rounded-[6px] tw-flex tw-items-center tw-justify-center`}>

            <i className={`${stat.icon} ${stat.color} tw-text-[20px] tw-font-medium`}></i>
          </div>
        </div>
      ))}
    </div>
  );
};

export default StatsCards;