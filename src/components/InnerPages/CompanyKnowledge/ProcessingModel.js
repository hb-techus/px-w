import React from 'react';
import { Info, X } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

const TAB_ALIASES = {
  proposal_drafting: 'Proposal Drafter',
  proposal_drafter: 'Proposal Drafter',
  proposal_drafting_tab: 'Proposal Drafter',
  rfp_analyzer: 'Bid Intelligence',
  rfp_analyzer_recommendations: 'Bid Intelligence',
  bid_intelligence: 'Bid Intelligence',
  takeoff: 'Takeoff & Estimation',
  takeoff_estimation: 'Takeoff & Estimation',
  others: 'Proposal Drafter',
  proposal_drafting_label: 'Proposal Drafter',
  rfp_analyzer_and_recommendations: 'Bid Intelligence',
  takeoff_and_estimation: 'Takeoff & Estimation'
};

const normalizeTabKey = value =>
  value
    ?.toString()
    .trim()
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');

const resolveParentTab = activeTab => {
  const normalizedKey = normalizeTabKey(activeTab);

  return TAB_ALIASES[normalizedKey] || activeTab || 'Proposal Drafter';
};

const ProcessingModal = ({ isOpen, onClose, activeTab, redirectPath }) => {
  // ✅ All hooks must come before any early returns
  const navigate = useNavigate();
  const location = useLocation();

  if (!isOpen) return null;

 const handleCloseAndNavigate = () => {
  onClose();
  const tabKey = resolveParentTab(activeTab);
  const destinationPath =
    redirectPath ||
    (location.pathname.startsWith('/admin')
      ? '/admin/knowledge-base'
      : '/knowledge-base');

  navigate(destinationPath, { state: { activeTab: tabKey } });
};

  return (
    <div className="tw-fixed tw-inset-0 tw-z-50 tw-flex tw-items-center tw-justify-center tw-bg-black tw-bg-opacity-50 tw-backdrop-blur-sm">
      {/* Modal Container */}
      <div className="tw-relative tw-w-full tw-max-w-md tw-rounded-2xl tw-bg-white tw-p-8 tw-shadow-2xl tw-mx-4">

        {/* Close Button (Top Right) */}
        <button
          onClick={handleCloseAndNavigate}
          className="tw-absolute tw-right-4 tw-top-4 tw-text-gray-400 hover:tw-text-gray-600 tw-transition-colors"
        >
          <X size={20} />
        </button>

        {/* Success Icon */}
        <div className="tw-mb-6 tw-flex tw-justify-center">
          <div className="tw-flex tw-h-16 tw-w-16 tw-items-center tw-justify-center tw-rounded-full tw-bg-emerald-500">
            <i className="tw-text-white icon-Tick tw-text-[36px]" strokeWidth={3} />
          </div>
        </div>

        {/* Text Content */}
        <div className="tw-text-center">
          <h2 className="tw-mb-3 tw-text-[24px] tw-font-bold tw-text-[#101828]">
            Processing Started!
          </h2>
          <p className="tw-mb-6 tw-text-[16px] tw-leading-relaxed tw-text-[#6a7282]">
            Your documents are now being processed. You will be notified via email and in-app notification when the processing is complete.
          </p>
        </div>

        {/* Info Box */}
        <div className="tw-mb-8 tw-flex tw-items-start tw-gap-3 tw-rounded-lg tw-border tw-border-blue-100 tw-bg-[#f0f9ff] tw-p-4">
          <Info className="tw-mt-0.5 tw-shrink-0 tw-text-blue-500" size={18} />
          <div className="tw-text-left">
            <p className="tw-text-xs tw-font-semibold tw-text-[#0c4a6e]">
              Estimated Processing Time
            </p>
            <p className="tw-text-[13px] tw-text-[#0369a1] tw-mt-1">
              Processing usually takes 5-10 minutes depending on file size and complexity.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="tw-flex tw-gap-3">
          <button
            onClick={handleCloseAndNavigate}
            className="tw-flex-1 tw-rounded-lg tw-border tw-border-gray-200 tw-py-2.5 tw-text-sm tw-font-semibold tw-text-gray-700 hover:tw-bg-gray-50 tw-transition-all"
          >
            Close
          </button>
          <button
            onClick={handleCloseAndNavigate}
            className="tw-flex-1 tw-rounded-lg tw-bg-[#0038FF] tw-py-2.5 tw-text-sm tw-font-semibold tw-text-white hover:tw-bg-blue-700 tw-transition-all"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProcessingModal;
