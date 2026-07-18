import React from 'react'

const HealthCheckerNameField = ({ checkerName, nameError, nameChecking, onChange, onBlur }) => (
  <div className="tw-bg-white tw-rounded-[12px] tw-border tw-border-[#e2e8f0] tw-p-5 tw-shadow-sm">
    <label className="tw-text-[13px] tw-font-medium tw-text-[#4a5568] tw-mb-1.5 tw-block">
      Name <span className="tw-text-red-500">*</span>
    </label>
    <div className="tw-relative tw-w-full md:tw-w-1/2">
      <input
        type="text"
        value={checkerName}
        onChange={onChange}
        onBlur={onBlur}
        placeholder="e.g., Payment Terms Clarification"
        className={`tw-w-full tw-rounded-[8px] tw-px-3 tw-py-2.5 tw-pr-10 tw-text-[14px] tw-text-[#1a202c] tw-bg-white focus:tw-outline-none focus:tw-ring-2 ${
          nameError
            ? 'tw-border tw-border-red-400 focus:tw-ring-red-400 focus:tw-border-red-400'
            : 'tw-border tw-border-[#e2e8f0] focus:tw-ring-[#0140c1] focus:tw-border-transparent'
        }`}
      />
      {nameChecking && (
        <div className="tw-absolute tw-right-3 tw-top-1/2 -tw-translate-y-1/2">
          <svg className="tw-animate-spin tw-w-4 tw-h-4 tw-text-[#94a3b8]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="tw-opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="tw-opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
          </svg>
        </div>
      )}
    </div>
    {nameError && <p className="tw-text-[12px] tw-text-red-500 tw-mt-1">{nameError}</p>}
  </div>
)

export default HealthCheckerNameField
