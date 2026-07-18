import React, { useRef, useState, useCallback } from "react";

// ─── Input Method Toggle Cards ─────────────────────────────────────────────
const InputMethodCard = ({ method, selected, onSelect }) => {
  const isPdf = method === "pdf";
  return (
    <div
      onClick={() => onSelect(method)}
      className={`tw-relative tw-flex-1 tw-flex tw-items-start tw-gap-3 tw-p-7 tw-rounded-[8px] tw-border tw-cursor-pointer tw-transition-all tw-duration-200
        ${selected
          ? "tw-border-[#4488ff] tw-bg-[#f0f4ff]"
          : "tw-border-[#e2e8f0] tw-bg-white hover:tw-border-[#0140c1] hover:tw-bg-[#f8faff]"
        }`}
    >
      <div className={`tw-w-10 tw-h-10 tw-rounded-[8px] tw-flex tw-items-center tw-justify-center tw-flex-shrink-0 tw-mt-0.5 ${selected ? "tw-bg-[#dce6ff]" : "tw-bg-[#f4f4f4]"}`}>
        {isPdf ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke={selected ? "#4488ff" : "#6b7280"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <polyline points="14 2 14 8 20 8" stroke={selected ? "#0140c1" : "#6b7280"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <line x1="16" y1="13" x2="8" y2="13" stroke={selected ? "#0140c1" : "#6b7280"} strokeWidth="2" strokeLinecap="round"/>
            <line x1="16" y1="17" x2="8" y2="17" stroke={selected ? "#0140c1" : "#6b7280"} strokeWidth="2" strokeLinecap="round"/>
          </svg>
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M12 20h9" stroke={selected ? "#0140c1" : "#6b7280"} strokeWidth="2" strokeLinecap="round"/>
            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" stroke={selected ? "#0140c1" : "#6b7280"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </div>

      <div>
        <p className={`tw-text-[14px] tw-font-semibold tw-leading-tight ${selected ? "tw-text-[#4488ff]" : "tw-text-[#1a202c]"}`}>
          {isPdf ? "Upload PDF" : "Custom Input"}
        </p>
        <p className="tw-text-[12px] tw-text-[#6b7280] tw-mt-1 tw-leading-snug">
          {isPdf
            ? "Upload a contract document in PDF format for comprehensive analysis"
            : "Copy and paste contract content directly for quick analysis"}
        </p>
      </div>

      {selected && (
        <div className="tw-absolute tw-top-3 tw-right-3 tw-w-5 tw-h-5 tw-rounded-full tw-bg-[#0140c1] tw-flex tw-items-center tw-justify-center">
          <svg width="11" height="8" viewBox="0 0 11 8" fill="none">
            <path d="M1 4L4 7L10 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      )}
    </div>
  );
};

// ─── PDF Drop Zone ──────────────────────────────────────────────────────────
const PDFDropZone = ({ selectedFile, onFileSelect, onFileRemove }) => {
  const fileInputRef = useRef(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type === "application/pdf") onFileSelect(file);
  }, [onFileSelect]);

  const handleDragOver  = (e) => { e.preventDefault(); setIsDragOver(true); };
  const handleDragLeave = () => setIsDragOver(false);
  const handleFileChange = (e) => { const file = e.target.files?.[0]; if (file) onFileSelect(file); };

  const openFilePicker = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".pdf";
    input.onchange = (e) => { const file = e.target.files?.[0]; if (file) onFileSelect(file); };
    input.click();
  };

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onClick={() => !selectedFile && openFilePicker()}
      className={`tw-w-full tw-min-h-[200px] tw-rounded-[8px] tw-border-2 tw-border-dashed tw-flex tw-flex-col tw-items-center tw-justify-center tw-gap-3 tw-transition-all tw-duration-200 tw-cursor-pointer
        ${isDragOver
          ? "tw-border-[#0140c1] tw-bg-[#f0f4ff]"
          : selectedFile
          ? "tw-border-[#22c55e] tw-bg-[#f0fdf4] tw-cursor-default"
          : "tw-border-[#cbd5e0] tw-bg-[#fafafa] hover:tw-border-[#0140c1] hover:tw-bg-[#f8faff]"
        }`}
    >
      <input type="file" accept=".pdf" className="tw-hidden" ref={fileInputRef} onChange={handleFileChange} />

      {selectedFile ? (
        <div className="tw-flex tw-flex-col tw-items-center tw-gap-2 tw-px-6 tw-text-center">
          <div className="tw-w-12 tw-h-12 tw-rounded-full tw-bg-[#dcfce7] tw-flex tw-items-center tw-justify-center">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <polyline points="14 2 14 8 20 8" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <p className="tw-text-[14px] tw-font-semibold tw-text-[#166534]">{selectedFile.name}</p>
          <p className="tw-text-[12px] tw-text-[#6b7280]">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onFileRemove(); }}
            className="tw-mt-1 tw-text-[12px] tw-text-[#ef4444] tw-underline hover:tw-no-underline"
          >
            Remove file
          </button>
        </div>
      ) : (
        <div className="tw-flex tw-flex-col tw-items-center tw-gap-2 tw-px-6 tw-text-center">
          <div className="tw-relative">
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
              <rect width="48" height="48" rx="12" fill="#EEF2FF"/>
              <path d="M28 14H18a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V18z" stroke="#0140c1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <polyline points="28 14 28 18 32 18" stroke="#0140c1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <div className="tw-absolute tw-bottom-0 tw-right-0 tw-w-5 tw-h-5 tw-rounded-full tw-bg-[#0140c1] tw-flex tw-items-center tw-justify-center">
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path d="M5 2v6M2 5h6" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
              </svg>
            </div>
          </div>
          <p className="tw-text-[14px] tw-font-semibold tw-text-[#1a202c]">Drag and drop your PDF here</p>
          <p className="tw-text-[12px] tw-text-[#6b7280]">or click to browse files</p>
        </div>
      )}
    </div>
  );
};

// ─── Custom Text Input ──────────────────────────────────────────────────────
// ── Now accepts an optional externalRef so parent can read text directly ───
const CustomTextInput = ({ value, onChange, externalRef }) => {
  const internalRef = useRef(null);
  const textareaRef = externalRef || internalRef;

  const execCmd = (command) => {
    textareaRef.current?.focus();
    document.execCommand(command, false, null);
  };

  const ToolbarBtn = ({ title, onClick, children }) => (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className="tw-w-7 tw-h-7 tw-flex tw-items-center tw-justify-center tw-rounded tw-text-[#4a5568] hover:tw-bg-[#f0f4ff] hover:tw-text-[#0140c1] tw-transition-colors tw-text-[13px] tw-font-medium"
    >
      {children}
    </button>
  );

  return (
    <div>
      {/* Toolbar */}
      <div className="tw-flex tw-items-center tw-gap-1 tw-px-3 tw-py-2 tw-bg-[#f8fafc] tw-border tw-border-[#e2e8f0] tw-border-b-0 tw-rounded-t-[8px]">
        <ToolbarBtn title="Bold"      onClick={() => execCmd("bold")}><b>B</b></ToolbarBtn>
        <ToolbarBtn title="Italic"    onClick={() => execCmd("italic")}><i>I</i></ToolbarBtn>
        <ToolbarBtn title="Underline" onClick={() => execCmd("underline")}><u>U</u></ToolbarBtn>
        <div className="tw-w-px tw-h-5 tw-bg-[#e2e8f0] tw-mx-1" />
        <ToolbarBtn title="Bullet List"   onClick={() => execCmd("insertUnorderedList")}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
            <circle cx="1.5" cy="3" r="1.5"/><rect x="4" y="2" width="9" height="2" rx="1"/>
            <circle cx="1.5" cy="7" r="1.5"/><rect x="4" y="6" width="9" height="2" rx="1"/>
            <circle cx="1.5" cy="11" r="1.5"/><rect x="4" y="10" width="9" height="2" rx="1"/>
          </svg>
        </ToolbarBtn>
        <ToolbarBtn title="Numbered List" onClick={() => execCmd("insertOrderedList")}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
            <text x="0" y="4" fontSize="5" fontFamily="monospace">1.</text><rect x="4" y="2" width="9" height="2" rx="1"/>
            <text x="0" y="8.5" fontSize="5" fontFamily="monospace">2.</text><rect x="4" y="6" width="9" height="2" rx="1"/>
            <text x="0" y="13" fontSize="5" fontFamily="monospace">3.</text><rect x="4" y="10" width="9" height="2" rx="1"/>
          </svg>
        </ToolbarBtn>
        <div className="tw-w-px tw-h-5 tw-bg-[#e2e8f0] tw-mx-1" />
        <ToolbarBtn title="Align Left"   onClick={() => execCmd("justifyLeft")}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
            <rect x="0" y="1" width="14" height="2" rx="1"/><rect x="0" y="5" width="9" height="2" rx="1"/>
            <rect x="0" y="9" width="14" height="2" rx="1"/>
          </svg>
        </ToolbarBtn>
        <ToolbarBtn title="Align Center" onClick={() => execCmd("justifyCenter")}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
            <rect x="0" y="1" width="14" height="2" rx="1"/><rect x="2.5" y="5" width="9" height="2" rx="1"/>
            <rect x="0" y="9" width="14" height="2" rx="1"/>
          </svg>
        </ToolbarBtn>
        <ToolbarBtn title="Align Right"  onClick={() => execCmd("justifyRight")}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
            <rect x="0" y="1" width="14" height="2" rx="1"/><rect x="5" y="5" width="9" height="2" rx="1"/>
            <rect x="0" y="9" width="14" height="2" rx="1"/>
          </svg>
        </ToolbarBtn>
        <div className="tw-w-px tw-h-5 tw-bg-[#e2e8f0] tw-mx-1" />
        <ToolbarBtn title="Undo" onClick={() => execCmd("undo")}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M3 7v6h6"/><path d="M3 13C5 7 11 4 17 6s9 8 7 14"/>
          </svg>
        </ToolbarBtn>
        <ToolbarBtn title="Redo" onClick={() => execCmd("redo")}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M21 7v6h-6"/><path d="M21 13C19 7 13 4 7 6S-2 14 0 20"/>
          </svg>
        </ToolbarBtn>
      </div>

      {/* Editable area — ref is forwarded so parent can read .innerText */}
      <div
        ref={textareaRef}
        contentEditable
        suppressContentEditableWarning
        onInput={(e) => onChange(e.currentTarget.innerText || "")}
        className="tw-w-full tw-min-h-[160px] tw-p-4 tw-bg-white tw-border tw-border-[#e2e8f0] tw-rounded-b-[8px] tw-text-[14px] tw-text-[#4a5568] focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-[#0140c1] focus:tw-border-transparent tw-leading-relaxed"
        style={{ resize: "vertical", overflow: "auto" }}
        data-placeholder="Paste or type your contract content here for health analysis..."
      />

      <style>{`
        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: #9ca3af;
          pointer-events: none;
        }
      `}</style>
    </div>
  );
};

// ─── Main Export ───────────────────────────────────────────────────────────
const Healthcheckerinputsection = ({
  inputMethod,
  onInputMethodChange,
  selectedFile,
  onFileSelect,
  onFileRemove,
  customText,
  onCustomTextChange,
  customTextRef,          // ← forwarded from AddHealthChecker
}) => {
  return (
    <div className="tw-bg-white tw-rounded-[12px] tw-border tw-border-[#e2e8f0] tw-p-6 tw-shadow-sm">
      {/* Section Header */}
      <div className="tw-flex tw-items-center tw-gap-3 tw-mb-3">
        <div className="tw-w-8 tw-h-8 tw-rounded-[8px] tw-bg-[#dee9ff] tw-flex tw-items-center tw-justify-center tw-flex-shrink-0">
          <i className="icon-AI-fill tw-text-[#4488ff]" />
        </div>
        <div>
          <p className="tw-text-[15px] tw-font-semibold tw-text-[#1a202c]">Select Input Method</p>
          <p className="tw-text-[12px] tw-text-[#6b7280]">
            Choose how you'd like to provide the contract for health analysis
          </p>
        </div>
      </div>

      {/* Toggle Cards */}
      <div className="tw-flex tw-gap-4 tw-mb-6">
        <InputMethodCard method="pdf" selected={inputMethod === "pdf"} onSelect={onInputMethodChange} />
        <InputMethodCard method="txt" selected={inputMethod === "txt"} onSelect={onInputMethodChange} />
      </div>

      {/* Dynamic Content */}
      {inputMethod === "pdf" ? (
        <PDFDropZone
          selectedFile={selectedFile}
          onFileSelect={onFileSelect}
          onFileRemove={onFileRemove}
        />
      ) : (
        <CustomTextInput
          value={customText}
          onChange={onCustomTextChange}
          externalRef={customTextRef}
        />
      )}
    </div>
  );
};

export default Healthcheckerinputsection;