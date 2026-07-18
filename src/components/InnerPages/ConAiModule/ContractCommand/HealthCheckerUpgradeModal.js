import React from 'react'
import upgradImg from '/src/assets/Images/no_data_images/upgrade_1.webp'

const HealthCheckerUpgradeModal = ({ message, onClose }) => (
  <div className="tw-fixed tw-inset-0 tw-bg-black/50 tw-z-[9999] tw-flex tw-items-center tw-justify-center">
    <div className="tw-bg-white tw-rounded-2xl tw-shadow-2xl tw-w-[750px] tw-h-[569px] tw-px-[74px] tw-pt-[69px] tw-pb-10 tw-relative tw-text-center">
      <button
        onClick={onClose}
        className="tw-absolute tw-top-4 tw-right-4 tw-w-8 tw-h-8 tw-flex tw-items-center tw-justify-center tw-rounded-full tw-border tw-border-gray-200 tw-text-gray-400 hover:tw-text-gray-600 hover:tw-bg-gray-50 tw-transition-colors"
      >
        <i className="icon-Close tw-text-[14px]" />
      </button>
      <h2 className="tw-text-[30px] tw-font-bold tw-text-[#000000] tw-mb-8 tw-leading-snug">
        Unlock More with an Upgrade!
      </h2>
      <div className="tw-flex tw-justify-center tw-mb-4">
        <div className="tw-relative tw-w-[200px] tw-h-[175px] tw-flex tw-items-center tw-justify-center">
          <div className="tw-flex tw-justify-center tw-mb-6">
            <img src={upgradImg} alt="Upgrade" className="tw-w-36 tw-h-36 tw-object-contain" />
          </div>
        </div>
      </div>
      <p className="tw-text-[18px] tw-text-[rgba(85,85,85,0.33)] tw-mb-8 tw-leading-normal tw-px-2">
        {message}
      </p>
      <button
        onClick={onClose}
        className="tw-w-[318px] tw-h-[48px] tw-py-3 tw-text-white tw-text-[16px] tw-font-medium tw-rounded-[6px] tw-transition-all tw-duration-200 hover:tw-opacity-90 hover:tw-shadow-lg"
        style={{ background: '#0140c1' }}
      >
        Upgrade Your Package
      </button>
    </div>
  </div>
)

export default HealthCheckerUpgradeModal
