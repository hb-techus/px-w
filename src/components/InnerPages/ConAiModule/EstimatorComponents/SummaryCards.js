import React from 'react';
import { Download, Loader2 } from 'lucide-react';
import usePermissions from '../../../Common/usePermissions';
const SummaryCards = ({ results, onResetAll, onExport, exporting }) => {
  const summaryCards = [
    {
      title: "Base Cost (From Overview)",
      amount: results.baseCost,
      subtitle: "Material + Labor + Markup",
      align: "left",
      extra: null,
    },
    {
      title: "Simulator Adjustment",
      amount: results.simulatorAdjustment,
      subtitle: `${results.adjustmentPct} ${results.adjustmentPctLabel}`,
      align: "center",
      extra: null,
    },
    {
      title: "Estimated Total Cost",
      amount: results.estimatedTotalCost,
      subtitle: null,
      align: "center",
      extra: {
        label: results.budgetStatus,
        bg: results.budgetStatusColor,
      },
    },
  ];
  const { permissions, packagePermissions } = usePermissions('what_if_modeler', 'estimate_builder');
  void packagePermissions
  return (
    <div className="tw-w-full tw-mb-4">
      {/* Header */}
      <div className="tw-flex tw-justify-between tw-items-center tw-mb-4">
        <div>
          <div className="tw-flex tw-items-center tw-gap-2">
            <span className="tw-text-[19px] tw-text-gray-600 tw-font-medium">Estimate Builder</span>
            <i className="icon-Save-and-Continue" />
            <span className="tw-text-[19px] tw-font-bold tw-text-gray-900">What-if Modeler</span>
          </div>
          <p className="tw-text-[#1e293b] tw-text-[13px]">Simulate changes in labor rates, material costs, project scope, and risk factors to see real-time impact on your estimate.</p>
        </div>
        <div className="tw-flex tw-gap-3">
          <button
            onClick={onResetAll}
            className="tw-flex tw-items-center tw-gap-2 tw-px-4 tw-py-2 tw-bg-white tw-border tw-border-[#cacaca] tw-rounded-[5px] tw-text-[#999999] tw-text-[12px] hover:tw-bg-slate-50"
          >
            <i className="icon-reset" /> Reset All
          </button>

          {/* ── Export button ── only onClick, disabled, and icon changed ── */}
          {permissions?.export && (
            <button
              onClick={onExport}
              disabled={exporting}
              className="tw-flex tw-items-center tw-gap-2 tw-px-6 tw-py-2 tw-bg-[#0140c1] tw-w-[175px] tw-text-white tw-rounded-md tw-text-[15px] hover:tw-bg-blue-800 disabled:tw-opacity-60 disabled:tw-cursor-not-allowed"
            >
              {exporting ? <Loader2 size={16} className="tw-animate-spin" /> : <Download size={16} />}
              {exporting ? 'Generating…' : 'Export to PDF'}
            </button>
          )}
        </div>
      </div>

      {/* Cards — unchanged */}
      <div className="tw-grid tw-grid-cols-3 tw-bg-[#eff6ff] tw-p-8 tw-rounded-[10px] tw-border tw-border-[#48f] tw-shadow-[0_2px_3px_0_rgba(0,0,0,0.05)]">
        {summaryCards.map((card, index) => {
          const alignClass =
            card.align === "left" ? "tw-text-left tw-pl-4" :
              card.align === "center" ? "tw-text-center" :
                "tw-text-right tw-pr-4";
          return (
            <div key={index} className={alignClass}>
              <p className="tw-text-[13px] tw-font-[500] tw-text-[#000] tw-uppercase tw-tracking-tight">
                {card.title}
              </p>
              <p className={`tw-font-[600] tw-mt-1 tw-text-[25px] ${card.align === "right" ? "tw-text-[#0140c1]" : "tw-text-[#000]"}`}>
                {card.amount}
              </p>
              {card.subtitle && (
                <p className="tw-text-[12px] tw-text-[#999] tw-font-[500] tw-mt-1">{card.subtitle}</p>
              )}
              {card.extra && (
                // <div className="tw-mt-2 tw-flex tw-justify-end tw-pr-[20px]">
                <div className="tw-mt-2 tw-flex tw-justify-center">
                  <span className={`${card.extra.bg} tw-text-white tw-text-[12px] tw-px-4 tw-py-1 tw-rounded-[100px] tw-font-[500]`}>
                    {card.extra.label}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SummaryCards;