
import React, { useState } from "react";

import { Card, CardHeader, CardTitle, CardContent } from "./Card";

const CollapsibleSection = ({
  title,
  icon,
  defaultExpanded = true,
  children,
  badge,
  iconBg = "",
  subtitle,
  headerRight,
  borderColor = "tw-border-blue-600",
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  return (
    <Card className={`tw-overflow-hidden tw-h-full tw-mb-0 tw-border tw-border-gray-200`}>
      <CardHeader
        className={`tw-cursor-pointer hover:tw-bg-gray-50 tw-transition-colors tw-border-b tw-border-gray-100 ${borderColor} tw-pl-4`}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="tw-flex tw-items-center tw-justify-between tw-w-full">
          <div className="tw-flex tw-items-center tw-gap-3">
           {icon && (
    <div className={`tw-flex tw-items-center tw-justify-center tw-w-9 tw-h-9 tw-rounded-md ${iconBg}`}>
      {icon}
    </div>
  )}

            <div className="tw-flex tw-flex-col">
              <div className="tw-flex tw-items-center tw-gap-2">
                <CardTitle className="tw-text-base tw-font-bold tw-text-[#002149]">
                  {title}
                </CardTitle>
                {badge && (
                  <span className=" tw-text-[#000] tw-text-[11px] tw-font-bold tw-px-2 tw-py-0.5 tw-rounded-md">
                    {badge}
                  </span>
                )}
              </div>
              {subtitle && (
                <p className="tw-text-[12px] tw-text-gray-500 tw-font-normal tw-mt-0.5">
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          {/* RIGHT SIDE: legend OR collapse button */}
          <div className="tw-flex tw-items-center tw-gap-4">
            {/* stop propagation so clicking legend dots doesn't toggle */}
            {headerRight && (
              <div onClick={(e) => e.stopPropagation()}>
                {headerRight}
              </div>
            )}
            <div className="tw-flex tw-items-center tw-justify-center tw-w-[25px] tw-h-[25px] tw-border tw-border-[#75787c] tw-rounded-[5px]">
              <i
                className={`icon-Dropdown tw-inline-block tw-transition-transform tw-duration-300 ${isExpanded ? "tw-rotate-180" : "tw-rotate-0"}`}
                style={{ fontSize: "16px", color: "#000" }}
              />
            </div>
          </div>
        </div>
      </CardHeader>

      <div className={`tw-transition-[max-height,opacity] tw-duration-300 tw-ease-in-out tw-overflow-hidden ${isExpanded ? "tw-max-h-[9999px] tw-opacity-100" : "tw-max-h-0 tw-opacity-0"}`}>
        <CardContent className="tw-p-6">
          {children}
        </CardContent>
      </div>
    </Card>
  );
};
export default CollapsibleSection;
