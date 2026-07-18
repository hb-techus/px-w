import React, { useState } from "react";
import { CheckCircle2, Clock, AlertCircle } from "lucide-react";

function LegalTimelineChart({ timeline = [] }) {
    const [view, setView] = useState("chart");

    const getStatusIcon = (status) => {
        switch (status) {
            case "past_deadline":
                return <CheckCircle2 className="tw-w-4 tw-h-4 tw-text-red-400" />;
            case "in-progress":
                return <Clock className="tw-w-4 tw-h-4 tw-text-orange-500" />;
            default:
                return <AlertCircle className="tw-w-4 tw-h-4 tw-text-gray-400" />;
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case "past_deadline":
                return "tw-bg-red-400";
            case "in-progress":
                return "tw-bg-orange-500";
            default:
                return "tw-bg-gray-300";
        }
    };

    const formatLabel = (value) => {
        if (!value || typeof value !== "string") return "N/A";

        return value
            .replace(/_/g, " ")
            .toLowerCase()
            .replace(/\b\w/g, (char) => char.toUpperCase());
    };
    return (
        <div className="tw-space-y-4">
            {/* View Toggle */}
            <div className="tw-flex tw-items-center tw-justify-between tw-mt-5">
                <div className="tw-flex tw-items-center tw-gap-1 tw-p-1 tw-bg-gray-100 tw-rounded-lg">
                    <button
                        onClick={() => setView("chart")}
                        className={`tw-h-8 tw-px-4 tw-rounded-md tw-text-sm tw-font-medium tw-transition-colors ${view === "chart"
                            ? "tw-bg-[#1476FF] tw-text-white"
                            : "tw-bg-transparent tw-text-gray-700 hover:tw-bg-gray-200"
                            }`}
                    >
                        Timeline Chart
                    </button>
                    <button
                        onClick={() => setView("table")}
                        className={`tw-h-8 tw-px-4 tw-rounded-md tw-text-sm tw-font-medium tw-transition-colors ${view === "table"
                            ? "tw-bg-[#1476FF] tw-text-white"
                            : "tw-bg-transparent tw-text-gray-700 hover:tw-bg-gray-200"
                            }`}
                    >
                        Time Table
                    </button>
                </div>
            </div>

            {view === "chart" ? (
                <div className="tw-relative tw-pt-4">
                    {/* Timeline line */}
                    <div className="tw-absolute tw-left-[142px] tw-top-0 tw-bottom-0 tw-w-0.5 tw-bg-gray-200" />

                    <div className="tw-space-y-6">
                        {timeline.map((event, index) => (
                            <div key={index} className="tw-flex tw-items-center tw-gap-4">
                                {/* Label */}
                                <div className="tw-w-[120px] tw-text-[15px]  tw-text-[#000] tw-font-normal tw-text-right tw-flex-shrink-0">
                                    {event.milestone}
                                </div>

                                {/* Dot on timeline */}
                                <div className={`tw-w-4 tw-h-4 tw-rounded-full tw-border-2 tw-border-white tw-flex-shrink-0 tw-z-10 tw--ml-px ${getStatusColor(event.status)}`} />

                                {/* Date and Status */}
                                <div className="tw-flex-1 tw-flex tw-items-center tw-gap-3">
                                    <span className=" tw-text-[15px]  tw-text-[#000] tw-font-normal">
                                        {event.date}
                                    </span>
                                    <span className={`tw-inline-flex tw-items-center tw-gap-1 tw-px-2 tw-py-0.5 tw-rounded tw-text-[15px] tw-font-normal tw-text-[#f44] ${event.status === "past_deadline" && "tw-bg-red-50 tw-text-red-400"
                                        } ${event.status === "in-progress" && "tw-bg-orange-100 tw-text-orange-700"
                                        } ${event.status === "upcoming" && "tw-bg-gray-100 tw-text-gray-600"
                                        }`}>
                                        {getStatusIcon(event.status)}
                                        {/* {event.status.charAt(0).toUpperCase() + event.status.slice(1)} */}
                                        {formatLabel(event.status)}

                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="tw-overflow-hidden tw-rounded-lg tw-border tw-border-gray-200">
                    <table className="tw-w-full">
                        <thead className="tw-bg-gray-50">
                            <tr>
                                <th className="tw-px-6 tw-py-3 tw-text-left tw-text-sm tw-font-medium tw-text-gray-600 tw-tracking-wider">
                                    Milestone
                                </th>
                                <th className="tw-px-6 tw-py-3 tw-text-left tw-text-sm tw-font-medium tw-text-gray-600 tw-tracking-wider">
                                    Date
                                </th>
                                <th className="tw-px-6 tw-py-3 tw-text-left tw-text-sm tw-font-medium tw-text-gray-600 tw-tracking-wider">
                                    Status
                                </th>
                            </tr>
                        </thead>
                        <tbody className="tw-bg-white tw-divide-y tw-divide-gray-200">
                            {timeline.map((event, index) => (
                                <tr key={index} className="hover:tw-bg-gray-50">
                                    <td className="tw-px-6 tw-py-4 tw-text-sm tw-font-medium tw-text-gray-900">
                                        {event.milestone}
                                    </td>
                                    <td className="tw-px-6 tw-py-4 tw-text-sm tw-text-gray-900">
                                        {event.date}
                                    </td>
                                    <td className="tw-px-6 tw-py-4 tw-text-sm">
                                        <span className={`tw-inline-flex tw-items-center tw-gap-1 tw-px-2 tw-py-0.5 tw-rounded tw-text-xs tw-font-medium ${event.status === "past_deadline" && "tw-bg-red-50 tw-text-red-400"
                                            } ${event.status === "in-progress" && "tw-bg-orange-100 tw-text-orange-700"
                                            } ${event.status === "upcoming" && "tw-bg-gray-100 tw-text-gray-600"
                                            }`}>
                                            {getStatusIcon(event.status)}
                                            {/* {event.status.charAt(0).toUpperCase() + event.status.slice(1)} */}
                                            {formatLabel(event.status)}

                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
export default LegalTimelineChart;
