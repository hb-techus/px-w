import React from 'react';
import { useROI } from './ROIContext';
import { CalendarDays } from 'lucide-react';

const OperationalMetrics = () => {
  const { results } = useROI();

  const items = [
    {
      label: 'Time Saved/Takeoff',
      value: results.timeSavedPerTakeoff,
      iconClass: 'icon-Timeline',
      colorClass: 'tw-text-red-400',
      bg: 'tw-bg-red-50'
    },
    {
      label: 'Annual Hours Saved',
      value: results.annualHoursSaved,
      iconClass: 'icon-annual-hours',
      colorClass: 'tw-text-blue-400',
      bg: 'tw-bg-blue-50'
    },
    {
      label: 'Additional Jobs Won',
      value: results.additionalJobsWon,
      iconClass: 'icon-project-metrics',
      colorClass: 'tw-text-orange-400',
      bg: 'tw-bg-orange-50'
    },
    {
      label: 'Additional Bids',
      value: results.additionalBidsPerYear,
      icon: CalendarDays, 
      colorClass: 'tw-text-purple-400',
      bg: 'tw-bg-purple-50'
    },
    {
      label: 'Additional Revenue',
      value: results.additionalRevenue,
      iconClass: 'icon-total-markup',
      colorClass: 'tw-text-cyan-400',
      bg: 'tw-bg-cyan-50'
    },
  ];

 return (
  <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-5 tw-gap-4 tw-mb-6">
    {items.map((item, i) => (
      <div
        key={i}
        className="tw-bg-white tw-p-4 tw-rounded-lg tw-border tw-border-[#e0e0e0] tw-flex tw-justify-between tw-items-start"
      >
        <div>
          <p className="tw-text-[#000] tw-font-[500] tw-mb-2 tw-min-h-[2.75rem]">
            {item.label}
          </p>
          <p className="tw-text-[30px] tw-font-semibold tw-text-[#000]">
            {item.value}
          </p>
        </div>

        <div className={`tw-w-8 tw-h-8 tw-rounded-[6px] tw-flex tw-items-center tw-justify-center tw-shrink-0 ${item.bg}`}>
          {item.icon ? (
            <item.icon className={`tw-w-5 tw-h-5 ${item.colorClass}`} />
          ) : (
            <i className={`${item.iconClass} ${item.colorClass} tw-text-xl tw-leading-none`} />
          )}
        </div>
      </div>
    ))}
  </div>
);
};

export default OperationalMetrics;