import React from 'react';
import { X } from 'lucide-react';
import TextWithTooltip from '../../../../components/Common/ToolTip';

const fmt$ = (v) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v);

const fmtHrs = (v) =>
  new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v ?? 0);


export default function CrewBreakdownModal({ crew, onClose }) {
  if (!crew) return null;
  const { title, members, totalHours, crewTotal } = crew;

  return (
    <div className="tw-fixed tw-inset-0 tw-bg-black/40 tw-flex tw-items-center tw-justify-center tw-z-50 tw-px-4">
      <div className="tw-bg-white tw-rounded-[10px] tw-shadow-2xl tw-w-full tw-max-w-[660px] tw-flex tw-flex-col" style={{ maxHeight: '90vh' }}>

        {/* Header */}
        <div className="tw-flex tw-items-start tw-justify-between tw-px-6 tw-py-5 tw-border-b tw-border-slate-100 tw-flex-shrink-0">
          <div>
            <p className="tw-text-[13px] tw-mb-0.5">Crew Breakdown</p>
            <h3 className="tw-text-[16px] tw-font-bold tw-text-[#0F172A]">{title}</h3>
          </div>
          <button
            onClick={onClose}
            className="tw-w-7 tw-h-7 tw-flex tw-items-center tw-justify-center tw-rounded-full tw-border tw-border-slate-200 hover:tw-bg-slate-50 tw-transition-colors tw-mt-0.5"
          >
            <X size={13} className="tw-text-slate-500" />
          </button>
        </div>

        {/* Single table with sticky header — fixes column sync and horizontal scroll */}
        <div className="tw-flex-1 custom-visible-scroll tw-overflow-y-auto tw-px-4" style={{ maxHeight: '380px', minHeight: 0 }}>
          <table className="tw-w-full tw-border-collapse" style={{ tableLayout: 'fixed' }}>
            <thead className="tw-sticky tw-top-0 tw-z-10 tw-bg-[#fafafa]">
              <tr>
                <th className="tw-px-3 tw-py-3.5 tw-text-[13px] tw-font-medium tw-text-[#6e7178] tw-text-left tw-bg-[#fafafa] tw-border-b tw-border-slate-100" style={{ width: '48%' }}>MEMBERS</th>
                <th className="tw-px-3 tw-py-3.5 tw-text-[13px] tw-font-medium tw-text-[#6e7178] tw-text-center tw-bg-[#fafafa] tw-border-b tw-border-slate-100" style={{ width: '18%' }}>WAGE/ HOUR</th>
                <th className="tw-px-3 tw-py-3.5 tw-text-[13px] tw-font-medium tw-text-[#6e7178] tw-text-center tw-bg-[#fafafa] tw-border-b tw-border-slate-100" style={{ width: '18%' }}>TOTAL HOURS</th>
                <th className="tw-px-3 tw-py-3.5 tw-text-[13px] tw-font-medium tw-text-[#6e7178] tw-text-right tw-bg-[#fafafa] tw-border-b tw-border-slate-100" style={{ width: '16%' }}>TOTAL COST</th>
              </tr>
            </thead>
            <tbody>
              {members.map((m, i) => (
                <tr key={i} style={{ borderTop: '1px solid #e0e0e0', borderBottom: '1px solid #e0e0e0' }}>
                  <td className="tw-px-3 tw-py-4" style={{ overflow: 'hidden' }}>
                    <TextWithTooltip
                      text={m.role}
                      className="tw-font-semibold tw-text-[14px] tw-text-[#0F172A]"
                      width="100%"
                    />
                  </td>
                  <td className="tw-px-3 tw-py-4 tw-text-[13px] tw-text-[#334155] tw-text-center">{fmt$(m.wage)}</td>
                  <td className="tw-px-3 tw-py-4 tw-text-[13px] tw-text-[#334155] tw-text-center">{fmtHrs(m.hours)}</td>
                  <td className="tw-px-3 tw-py-4 tw-text-[13px] tw-font-bold tw-text-[#0F172A] tw-text-right">{fmt$(m.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer summary */}
        <div className="tw-mx-4 tw-mb-4 tw-mt-3 tw-bg-[#EFF6FF] tw-rounded-xl tw-px-6 tw-py-4 tw-flex tw-items-center tw-justify-between tw-flex-shrink-0">
          <span className="tw-text-[13px] tw-text-[#6e7178]">
            Total Hours:{' '}
            <span className="tw-text-[#0140c1] tw-font-bold tw-text-[15px]">{fmtHrs(totalHours)}</span>
          </span>
          <span className="tw-text-[13px] tw-text-[#6e7178]">
            Crew Total:{' '}
            <span className="tw-text-[#0140c1] tw-font-bold tw-text-[15px]">{fmt$(crewTotal)}</span>
          </span>
        </div>
      </div>
    </div>
  );
}
