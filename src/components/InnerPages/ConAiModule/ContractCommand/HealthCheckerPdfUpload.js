import React from 'react'
import ContractLoader from '/src/assets/Images/pdf_images/contract_upload.webp'

const HealthCheckerPdfUpload = ({
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
}) => (
  <div>
    <input
      ref={fileInputRef}
      type="file"
      accept=".pdf"
      multiple
      className="tw-hidden"
      onChange={onFileInput}
    />

    <div
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onClick={() => fileInputRef.current?.click()}
      className={`tw-flex tw-flex-col tw-items-center tw-justify-center tw-gap-3 tw-border-2 tw-border-dashed tw-rounded-[12px] tw-py-10 tw-cursor-pointer tw-transition-all ${
        isDragging
          ? 'tw-border-[#3b82f6] tw-bg-[#eff6ff]'
          : 'tw-border-[#cbd5e0] tw-bg-[#f8fafc] hover:tw-border-[#3b82f6] hover:tw-bg-[#eff6ff]'
      }`}
    >
      <div className="tw-flex tw-items-center tw-justify-center">
        <img src={ContractLoader} alt="Upload" className="tw-w-[70px] tw-h-[70px] tw-object-contain" />
      </div>
      <div className="tw-text-center">
        <p className="tw-text-[15px] tw-font-semibold tw-text-[#1a202c]">Drag and drop your PDF here</p>
        <p className="tw-text-[12px] tw-text-[#a0aec0] tw-mt-0.5">
          {pdfUploadFileLimit
            ? `Upload up to ${pdfUploadFileLimit} PDF file${pdfUploadFileLimit > 1 ? 's' : ''}`
            : 'or click to browse files'}
        </p>
      </div>
    </div>

    {selectedFiles.length > 0 && (
      <div className="tw-mt-4">
        <p className="tw-text-[13px] tw-font-semibold tw-text-[#4a5568] tw-mb-2">
          {pdfUploadFileLimit
            ? `${selectedFiles.length}/${pdfUploadFileLimit} file${pdfUploadFileLimit > 1 ? 's' : ''} ready for upload`
            : `${selectedFiles.length} file${selectedFiles.length > 1 ? 's' : ''} ready for upload`}
        </p>
        <div className="tw-flex tw-flex-col tw-divide-y tw-divide-[#f0f4f8]">
          {selectedFiles.map((file, idx) => {
            const uploaded = uploadedFiles.find(
              (u) => `${u.file.name}-${u.file.size}` === `${file.name}-${file.size}`
            )
            const isUploading = uploaded?.uploading
            const hasError = uploaded?.error

            return (
              <div key={idx} className="tw-flex tw-items-center tw-justify-between tw-py-3">
                <div className="tw-flex tw-items-center tw-gap-3">
                  <div className={`tw-w-9 tw-h-9 tw-rounded-[8px] tw-flex tw-items-center tw-justify-center tw-flex-shrink-0 ${hasError ? 'tw-bg-red-100' : 'tw-bg-[#dcfce7]'}`}>
                    {isUploading ? (
                      <svg className="tw-animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="10" stroke="#a0aec0" strokeWidth="3" />
                        <path d="M12 2a10 10 0 0 1 10 10" stroke="#3b82f6" strokeWidth="3" strokeLinecap="round" />
                      </svg>
                    ) : (
                      <i className={`icon-Document tw-text-base ${hasError ? 'tw-text-red-400' : 'tw-text-[#22c55e]'}`} />
                    )}
                  </div>
                  <div>
                    <p className="tw-text-[13px] tw-font-medium tw-text-[#1a202c] tw-truncate tw-max-w-[380px]">
                      {file.name}
                    </p>
                    <p className={`tw-text-[11px] ${hasError ? 'tw-text-red-400' : 'tw-text-[#a0aec0]'}`}>
                      {isUploading
                        ? 'Uploading...'
                        : hasError
                        ? uploaded.error
                        : `${(file.size / 1024).toFixed(0)} KB • Uploaded`}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onFileRemove(idx) }}
                  className="tw-w-7 tw-h-7 tw-flex tw-items-center tw-justify-center tw-rounded-full hover:tw-bg-red-50 tw-transition-colors"
                >
                  <i className="icon-Close tw-text-[#a0aec0] hover:tw-text-red-400 tw-text-sm" />
                </button>
              </div>
            )
          })}
        </div>
      </div>
    )}
  </div>
)

export default HealthCheckerPdfUpload
