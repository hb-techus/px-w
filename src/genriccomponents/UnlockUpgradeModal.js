import React from "react";
import upgradImg from "/src/assets/Images/no_data_images/upgrade_1.webp";

/**
 * UnlockUpgradeModal
 *
 * Pixel-for-pixel match of the upgrade modal used in UserManagement.
 *
 * Props:
 *  open        {boolean}   — controls visibility
 *  message     {string}    — body text (e.g. from API response.message)
 *  onClose     {function}  — called when backdrop / × / button is clicked
 *  buttonLabel {string}    — CTA label (default: "Upgrade Your Package")
 *  onUpgrade   {function}  — optional separate handler for the CTA;
 *                            falls back to onClose when not provided
 */
const UnlockUpgradeModal = ({
  open,
  message = "Upgrade your plan to unlock this feature.",
  onClose,
  buttonLabel = "Upgrade Your Package",
  onUpgrade,
}) => {
  if (!open) return null;

  const handleCta = () => {
    if (onUpgrade) onUpgrade();
    else onClose?.();
  };

  return (
    <div
      className="tw-fixed tw-inset-0 tw-bg-black/50 tw-z-[9999] tw-flex tw-items-center tw-justify-center"
      onClick={(e) => { if (e.target === e.currentTarget) onClose?.(); }}
    >
      <div className="tw-bg-white tw-rounded-2xl tw-shadow-2xl tw-w-[750px] tw-h-[569px] tw-px-[74px] tw-pt-[69px] tw-pb-10 tw-relative tw-text-center">

        {/* ── Close ── */}
        <button
          onClick={onClose}
          className="tw-absolute tw-top-4 tw-right-4 tw-w-8 tw-h-8 tw-flex tw-items-center tw-justify-center tw-rounded-full tw-border tw-border-gray-400 tw-text-gray-600 hover:tw-text-gray-600 hover:tw-bg-gray-50 tw-transition-colors"
          aria-label="Close"
        >
          <i className="icon-Close tw-text-[14px]" />
        </button>

        {/* ── Title ── */}
        <h2 className="tw-text-[30px] tw-font-bold tw-text-[#000000] tw-mb-8 tw-leading-snug">
          Unlock More with an Upgrade!
        </h2>

        {/* ── Illustration ── */}
        <div className="tw-flex tw-justify-center tw-mb-4">
          <div className="tw-relative tw-w-[200px] tw-h-[175px] tw-flex tw-items-center tw-justify-center">
            <div className="tw-flex tw-justify-center tw-mb-6">
              <img
                src={upgradImg}
                alt="Upgrade"
                className="tw-w-36 tw-h-36 tw-object-contain"
              />
            </div>
          </div>
        </div>

        {/* ── Message ── */}
        <p className="tw-text-[18px] tw-mb-8 tw-leading-normal tw-px-2">
          {message}
        </p>

        {/* ── CTA button ── */}
        <button
          onClick={handleCta}
          className="tw-w-[318px] tw-h-[48px] tw-py-3 tw-text-white tw-text-[16px] tw-font-medium tw-rounded-[6px] tw-transition-all tw-duration-200 hover:tw-opacity-90 hover:tw-shadow-lg"
          style={{ background: "#0140c1" }}
        >
          {buttonLabel}
        </button>
      </div>
    </div>
  );
};

export default UnlockUpgradeModal;