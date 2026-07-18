import React from 'react'

const ShimmerBox = ({ height = 100, width, rounded = false }) => (
  <div
    className="tw-animate-pulse tw-bg-gray-200"
    style={{
      height,
      width: width || '100%',
      borderRadius: rounded ? 8 : 0,
    }}
  />
)

export const ShimmerTable = ({ col = 5, row = 5 }) => (
  <div className="tw-animate-pulse tw-w-full">
    <div className="tw-flex tw-gap-2 tw-px-4 tw-py-3 tw-border-b tw-border-gray-200">
      {Array.from({ length: col }).map((_, i) => (
        <div key={i} className="tw-flex-1 tw-h-4 tw-bg-gray-300 tw-rounded" />
      ))}
    </div>
    {Array.from({ length: row }).map((_, r) => (
      <div key={r} className="tw-flex tw-gap-2 tw-px-4 tw-py-3 tw-border-b tw-border-gray-100">
        {Array.from({ length: col }).map((_, c) => (
          <div key={c} className="tw-flex-1 tw-h-4 tw-bg-gray-200 tw-rounded" />
        ))}
      </div>
    ))}
  </div>
)

export default ShimmerBox
