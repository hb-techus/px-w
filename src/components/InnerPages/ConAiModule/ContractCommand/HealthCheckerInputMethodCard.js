import React from 'react'
import HealthCheckerPdfUpload from './HealthCheckerPdfUpload'
import HealthCheckerCustomInput from './HealthCheckerCustomInput'

const HealthCheckerInputMethodCard = ({
  // method toggle
  inputMethod,
  onInputMethodChange,
  canUsePdfInput,
  canUseCustomInput,
  // pdf props
  fileInputRef,
  selectedFiles,
  uploadedFiles,
  isDragging,
  pdfUploadFileLimit,
  onDragOver,
  onDragLeave,
  onDrop,
  onFileInput,
  onFileRemove,
  // custom input props
  customText,
  charCount,
  wordCount,
  customInputWordLimit,
  showUpgradeModal,
  onCustomInputChange,
  onLimitExceeded,
  // submit
  isDisabled,
}) => (
  <div className="tw-bg-white tw-rounded-[12px] tw-border tw-border-[#e2e8f0] tw-shadow-sm tw-p-6">

    {/* Header */}
    <div className="tw-flex tw-items-center tw-gap-3 tw-mb-5">
      <div className="tw-w-8 tw-h-8 tw-bg-[#eff6ff] tw-rounded-lg tw-flex tw-items-center tw-justify-center tw-flex-shrink-0">
        <i className="icon-AI-fill tw-text-[#3b82f6] tw-text-base" />
      </div>
      <div>
        <p className="tw-text-[15px] tw-font-semibold tw-text-[#1a202c]">Select Input Method</p>
        <p className="tw-text-[12px] tw-text-[#a0aec0]">Choose how you'd like to provide the contract for health analysis</p>
      </div>
    </div>

    {/* Toggle buttons */}
    <div className="tw-grid tw-grid-cols-2 tw-gap-4 tw-mb-6">

      {canUsePdfInput && (
        <button
          type="button"
          onClick={() => { if (inputMethod !== 'pdf') onInputMethodChange('pdf') }}
          className={`tw-flex tw-items-center tw-gap-3 tw-p-4 tw-rounded-[10px] tw-border-2 tw-transition-all tw-text-left ${
            inputMethod === 'pdf'
              ? 'tw-border-[#3b82f6] tw-bg-[#eff6ff]'
              : 'tw-border-[#e2e8f0] tw-bg-white hover:tw-border-[#cbd5e0]'
          }`}
        >
          <div className={`tw-w-10 tw-h-10 tw-rounded-[8px] tw-flex tw-items-center tw-justify-center tw-flex-shrink-0 ${inputMethod === 'pdf' ? 'tw-bg-[#dbeafe]' : 'tw-bg-[#f7fafc]'}`}>
            <i className={`icon-upload-files tw-text-3xl ${inputMethod === 'pdf' ? 'tw-text-[#3b82f6]' : 'tw-text-[#a0aec0]'}`} />
          </div>
          <div className="tw-flex-1">
            <p className={`tw-text-[14px] tw-font-semibold ${inputMethod === 'pdf' ? 'tw-text-[#3b82f6]' : 'tw-text-[#4a5568]'}`}>Upload PDF</p>
            <p className="tw-text-[12px] tw-text-[#a0aec0] tw-leading-snug">Upload a contract document in PDF format for comprehensive analysis</p>
          </div>
          {inputMethod === 'pdf' && (
            <div className="tw-w-5 tw-h-5 tw-rounded-full tw-bg-[#3b82f6] tw-flex tw-items-center tw-justify-center tw-flex-shrink-0">
              <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          )}
        </button>
      )}

      {canUseCustomInput && (
        <button
          type="button"
          onClick={() => { if (inputMethod !== 'txt') onInputMethodChange('txt') }}
          className={`tw-flex tw-items-center tw-gap-3 tw-p-4 tw-rounded-[10px] tw-border-2 tw-transition-all tw-text-left ${
            inputMethod === 'txt'
              ? 'tw-border-[#3b82f6] tw-bg-[#eff6ff]'
              : 'tw-border-[#e2e8f0] tw-bg-white hover:tw-border-[#cbd5e0]'
          }`}
        >
          <div className={`tw-w-10 tw-h-10 tw-rounded-[8px] tw-flex tw-items-center tw-justify-center tw-flex-shrink-0 ${inputMethod === 'txt' ? 'tw-bg-[#dbeafe]' : 'tw-bg-[#f7fafc]'}`}>
            <i className={`icon-custom-input tw-text-3xl ${inputMethod === 'txt' ? 'tw-text-[#3b82f6]' : 'tw-text-[#a0aec0]'}`} />
          </div>
          <div className="tw-flex-1">
            <p className={`tw-text-[14px] tw-font-semibold ${inputMethod === 'txt' ? 'tw-text-[#3b82f6]' : 'tw-text-[#4a5568]'}`}>Custom Input</p>
            <p className="tw-text-[12px] tw-text-[#a0aec0] tw-leading-snug">Copy and paste contract content directly for quick analysis</p>
          </div>
          {inputMethod === 'txt' && (
            <div className="tw-w-5 tw-h-5 tw-rounded-full tw-bg-[#3b82f6] tw-flex tw-items-center tw-justify-center tw-flex-shrink-0">
              <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          )}
        </button>
      )}
    </div>

    {/* PDF upload zone */}
    {inputMethod === 'pdf' && (
      <HealthCheckerPdfUpload
        fileInputRef={fileInputRef}
        selectedFiles={selectedFiles}
        uploadedFiles={uploadedFiles}
        isDragging={isDragging}
        pdfUploadFileLimit={pdfUploadFileLimit}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onFileInput={onFileInput}
        onFileRemove={onFileRemove}
      />
    )}

    {/* Custom text input */}
    {inputMethod === 'txt' && (
      <HealthCheckerCustomInput
        value={customText}
        charCount={charCount}
        wordCount={wordCount}
        wordLimit={customInputWordLimit}
        showUpgradeModal={showUpgradeModal}
        onChange={onCustomInputChange}
        onLimitExceeded={onLimitExceeded}
      />
    )}

    {/* Analyze button */}
    <div className="tw-flex tw-justify-center tw-mt-6">
      <button
        type="submit"
        disabled={isDisabled}
        className="group tw-px-8 tw-py-2.5 tw-rounded-[8px] tw-bg-[#0140c1] tw-text-white tw-text-[14px] tw-font-semibold tw-flex tw-items-center tw-gap-2 tw-whitespace-nowrap tw-transition-all tw-duration-300 tw-ease-in-out hover:tw-bg-[#1b44c4] hover:tw-shadow-lg hover:tw-shadow-blue-200/50 hover:tw-scale-[1.03] hover:-tw-translate-y-[1px] active:tw-scale-[0.98] disabled:tw-opacity-50 disabled:tw-cursor-not-allowed disabled:tw-scale-100 disabled:tw-translate-y-0 disabled:tw-shadow-none"
      >
        <i className="icon-AI-fill tw-text-[15px]" />
        Analyze Contract Health
      </button>
    </div>

    {/* Quill style overrides */}
    <style jsx global>{`
      .ql-toolbar.ql-snow { border:none!important; border-bottom:1px solid #e2e8f0!important; background:#fcfcfc; padding:8px 16px!important; display:flex; align-items:center; gap:4px; }
      .ql-container.ql-snow { border:none!important; font-size:14px; }
      .quill-container .ql-container.ql-snow { min-height:280px; max-height:280px; overflow-y:scroll; scrollbar-width:thin; scrollbar-color:#94a3b8 #f1f5f9; }
      .quill-container .ql-editor { min-height:280px; }
      .ql-editor.ql-blank::before { color:#cbd5e1; font-style:normal; }
      .ql-undo::before { content: "↩"; font-size:16px; }
      .ql-redo::before { content: "↪"; font-size:16px; }
      .ql-toolbar.ql-snow .ql-formats { margin-right:0!important; padding-right:10px; border-right:1.5px solid #d1d5db!important; }
      .ql-editor p { margin:0; padding:0; }
      .ql-toolbar.ql-snow .ql-formats:last-child { border-right:none!important; padding-right:0; }
      .quill-container .ql-container.ql-snow::-webkit-scrollbar { width:6px; }
      .quill-container .ql-container.ql-snow::-webkit-scrollbar-track { background:#f1f5f9; border-radius:3px; }
      .quill-container .ql-container.ql-snow::-webkit-scrollbar-thumb { background:#94a3b8; border-radius:3px; }
      .quill-container .ql-container.ql-snow::-webkit-scrollbar-thumb:hover { background:#64748b; }
      .quill-container .ql-snow .ql-tooltip { display:none!important; }
      .quill-container .ql-editor a { color:#4488ff!important; text-decoration:underline!important; cursor:pointer!important; }
      .quill-container .ql-editor a:hover { color:#2266dd!important; }
    `}</style>
  </div>
)

export default HealthCheckerInputMethodCard
