import React from 'react'

const INFO_CARDS = [
  {
    icon: 'icon-compliance',
    cardBg: 'tw-bg-[#eaf2ff]',
    borderColor: 'tw-border-[#4488ff]',
    iconColor: 'tw-text-[#3b82f6]',
    title: 'Compliance Check',
    description: 'Identifies gaps in RFP compliance and structural issues',
  },
  {
    icon: 'icon-AI-Risk-Identifier',
    cardBg: 'tw-bg-[#fffbeb]',
    borderColor: 'tw-border-[#fcd34d]',
    iconColor: 'tw-text-[#f59e0b]',
    title: 'Risk Detection',
    description: 'Highlights potential risks and missing elements',
  },
  {
    icon: 'icon-total-markup',
    cardBg: 'tw-bg-[#f0fdf4]',
    borderColor: 'tw-border-[#86efac]',
    iconColor: 'tw-text-[#22c55e]',
    title: 'Improvements',
    description: 'Provides actionable recommendations for enhancement',
  },
]

const HealthCheckerInfoCards = ({ canUsePdfInput, canUseCustomInput }) => (
  <div className={`tw-grid tw-gap-4 tw-mb-6 ${canUsePdfInput && canUseCustomInput ? 'tw-grid-cols-2' : 'tw-grid-cols-1'}`}>
    {INFO_CARDS.map((card, idx) => (
      <div
        key={idx}
        className={`${card.cardBg} tw-rounded-[12px] tw-border ${card.borderColor} tw-p-5 tw-shadow-sm tw-flex tw-items-start tw-gap-4`}
      >
        <div className="tw-flex-shrink-0 tw-pt-0.5">
          <i className={`${card.icon} ${card.iconColor} tw-text-2xl`} />
        </div>
        <div>
          <h3 className="tw-text-[15px] tw-font-semibold tw-text-[#1a202c] tw-mb-1">{card.title}</h3>
          <p className="tw-text-[12px] tw-text-[#718096] tw-leading-relaxed">{card.description}</p>
        </div>
      </div>
    ))}
  </div>
)

export default HealthCheckerInfoCards
