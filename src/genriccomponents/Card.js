import React from "react";

export const Card = ({ className = "", ...props }) => {
  return (
    <div
      className={`tw-rounded-lg tw-border tw-border-[#e5e7eb] tw-bg-white tw-text-[#111827] tw-shadow-sm ${className}`}
      {...props}
    />
  );
};

export const CardHeader = ({ className = "", ...props }) => {
  return (
    <div
      className={`tw-flex tw-flex-col tw-space-y-1.5 tw-p-4 ${className}`}
      {...props}
    />
  );
};

export const CardTitle = ({ className = "", ...props }) => {
  return (
    <h4
      className={`tw-text-[18px] tw-font-bold tw-text-[#002149] tw-leading-none  ${className}`}
      {...props}
    />
  );
};

export const CardContent = ({ className = "", ...props }) => {
  return (
    <div
      className={`tw-p-5 tw-pt-0 ${className}`}
      {...props}
    />
  );
};
