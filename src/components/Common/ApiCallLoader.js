import React from "react";

const Loader = () => {
  return (
    <div className="tw-flex tw-items-center tw-justify-center tw-w-full tw-h-screen">
      <div className="tw-flex tw-flex-col tw-items-center tw-gap-4">
        {/* Three bouncing dots */}
        <div className="tw-flex tw-gap-2">
          <span
            className="tw-w-3 tw-h-3 tw-rounded-full tw-bg-blue-600"
            style={{ animation: "bounce 0.6s infinite alternate" }}
          />
          <span
            className="tw-w-3 tw-h-3 tw-rounded-full tw-bg-blue-600"
            style={{ animation: "bounce 0.6s infinite alternate 0.2s" }}
          />
          <span
            className="tw-w-3 tw-h-3 tw-rounded-full tw-bg-blue-600"
            style={{ animation: "bounce 0.6s infinite alternate 0.4s" }}
          />
        </div>
        <p className="tw-text-blue-600 tw-text-sm tw-font-medium">Loading...</p>
      </div>

      <style>{`
        @keyframes bounce {
          from { transform: translateY(0px); opacity: 0.5; }
          to   { transform: translateY(-12px); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default Loader;