


import React, { useState, useEffect } from "react";
import { Check } from "lucide-react";

const TEMPLATES = [
  { 
    id: 1, 
    name: "Modern Blue", 
    template_name: "modern_blue", 
    style: "Modern Style", 
    color: "#3b82f6", 
    lines: ["#dbeafe", "#e2e8f0", "#e2e8f0"] 
  },
  { 
    id: 2, 
    name: "Corporate Navy", 
    template_name: "corporate_navy", 
    style: "Corporate Style", 
    color: "#081e36", 
    lines: ["#cbd5e1", "#e2e8f0", "#e2e8f0"] 
  },
  { 
    id: 3, 
    name: "Classic Teal", 
    template_name: "classic_teal", 
    style: "Classic Style", 
    color: "#2dd4bf", 
    lines: ["#ccfbf1", "#e2e8f0", "#e2e8f0"] 
  },
  { 
    id: 4, 
    name: "Minimal Slate", 
    template_name: "minimal_slate", 
    style: "Minimal Style", 
    color: "#475569", 
    lines: ["#e2e8f0", "#f1f5f9", "#f1f5f9"] 
  },
];

export default function SelectTemplates({ onTemplateChange,initialTemplate }) {
const [selectedTemplate, setSelectedTemplate] = useState(() => {
  return TEMPLATES.find(t => t.template_name === initialTemplate) || TEMPLATES[0];
});

  useEffect(() => {
    if (onTemplateChange) {
    onTemplateChange(selectedTemplate.template_name);
    }
  }, [onTemplateChange]);

  const handleSelect = (tpl) => {
    setSelectedTemplate(tpl);
    if (onTemplateChange) {
      onTemplateChange(tpl.template_name);
    }
  };

  return (
  <div className="tw-min-h-screen tw-flex tw-items-center tw-justify-center tw-px-12 tw-pt-2">
      <div className="tw-w-full tw-bg-white tw-rounded-[10px] tw-shadow-sm tw-border tw-border-gray-100  md:tw-p-20">
        
        {/* TOP ICON AND HEADER SECTION */}
        <div className="tw-text-center tw-mb-12">
          <div className="tw-inline-flex tw-items-center tw-justify-center tw-w-14 tw-h-14 tw-rounded-xl tw-border-2 tw-border-[#0047cc] tw-bg-white tw-mb-6 tw-shadow-sm">
            {/* The missing "Select Template" icon */}
            <i className="icon-template tw-text-[#0047cc] tw-text-[28px]" />
          </div>
          <h2 className="tw-text-3xl tw-font-bold tw-text-gray-900 tw-mb-2">
            Select Proposal Template
          </h2>
          <p className="tw-text-gray-400 tw-text-lg">
            Choose a template style for your proposal document.
          </p>
        </div>

        {/* TEMPLATES GRID */}
        <div className="tw-grid tw-grid-cols-1 sm:tw-grid-cols-2 lg:tw-grid-cols-4 tw-gap-6">
          {TEMPLATES.map((tpl) => {
            const isSelected = selectedTemplate.id === tpl.id;
            return (
              <button
                key={tpl.id}
                type="button"
                onClick={() => handleSelect(tpl)}
                className={`tw-relative tw-flex tw-flex-col tw-p-3 tw-rounded-[24px] tw-transition-all tw-duration-200 tw-text-left tw-group tw-border-2 ${
                  isSelected 
                    ? "tw-bg-white tw-shadow-xl" 
                    : "tw-border-transparent hover:tw-bg-gray-50"
                }`}
                style={{ 
                  borderColor: isSelected ? tpl.color : "transparent" 
                }}
              >
                {/* Visual Document Component */}
                <div className="tw-w-full tw-aspect-[1/1.3] tw-rounded-[14px] tw-overflow-hidden tw-border tw-border-gray-100 tw-flex tw-flex-col tw-bg-white tw-mb-5">
                  {/* Internal Header */}
                  <div className="tw-p-3 tw-flex tw-gap-2" style={{ backgroundColor: tpl.color }}>
                    <div className="tw-w-7 tw-h-7 tw-bg-white tw-rounded-md tw-flex tw-items-center tw-justify-center">
                       <i className="icon-Concrete tw-text-[14px]" style={{ color: tpl.color }} />
                    </div>
                    <div className="tw-flex-1 tw-space-y-1.5 tw-pt-1">
                      <div className="tw-h-2 tw-w-full tw-bg-white/40 tw-rounded-full" />
                      <div className="tw-h-2 tw-w-2/3 tw-bg-white/20 tw-rounded-full" />
                    </div>
                  </div>

                  {/* Internal Body */}
                  <div className="tw-flex-1 tw-p-4 tw-space-y-4">
                    {tpl.lines.map((lc, i) => (
                      <div key={i} className="tw-space-y-2">
                        <div style={{ backgroundColor: lc }} className="tw-h-2 tw-w-full tw-rounded-full" />
                        <div className="tw-h-1.5 tw-w-10/12 tw-bg-gray-50 tw-rounded-full" />
                      </div>
                    ))}
                  </div>

                  {/* Internal Footer */}
                  <div className="tw-h-6 tw-w-full tw-mt-auto" style={{ backgroundColor: tpl.color }} />
                </div>

                {/* Template Labels (Inside the border) */}
                <div className="tw-px-2 tw-pb-2 tw-text-center">
                  <p className="tw-text-[16px] tw-font-bold tw-text-[#000000]">
                    {tpl.name}
                  </p>
                  <p className="tw-text-sm tw-text-[#999999] tw-mt-0.5">
                    {tpl.style}
                  </p>
                </div>

                {/* Status Checkmark */}
                {isSelected && (
                  <div 
                    className="tw-absolute tw-bottom-4 tw-right-4 tw-w-7 tw-h-7 tw-rounded-full tw-flex tw-items-center tw-justify-center tw-shadow-md tw-z-10 tw-border-2 tw-border-white"
                    style={{ backgroundColor: tpl.color }}
                  >
                    <Check size={16} className="tw-text-white" strokeWidth={4} />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}