import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Info, CheckCircle2, XCircle } from 'lucide-react'
import FullPageLoader from '../../../genriccomponents/loaders/FullPageLoader'
import {
  GetCompanyUploadedUrl,
  AddCompanyDocument
} from '../../../services/techus-services'
import ProcessingModal from './ProcessingModel'

 
const formatSize = bytes => {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${(bytes / 1024).toFixed(1)} KB`
}

// Status: "pending" | "uploading" | "success" | "error"
const initialFileState = files =>
  Object.fromEntries(
    files.map(f => [f.id, { progress: 0, status: 'pending', error: null }])
  )

/* ─────────────────────────────────────────────
   Upload a single file to S3 via XHR so we get
   real onprogress events, then call AddCompanyDocument
───────────────────────────────────────────── */
// const uploadFile = ({ file, presignedUrl, onProgress }) =>
//   new Promise((resolve, reject) => {
//     const xhr = new XMLHttpRequest()

//     xhr.upload.addEventListener('progress', e => {
//       if (e.lengthComputable) {
//         const pct = Math.round((e.loaded / e.total) * 100)
//         onProgress(pct)
//       }
//     })

//     xhr.addEventListener('load', () => {
//       if (xhr.status >= 200 && xhr.status < 300) {
//         resolve()
//       } else {
//         reject(new Error(`S3 upload failed (status ${xhr.status})`))
//       }
//     })

//     xhr.addEventListener('error', () =>
//       reject(new Error('Network error during S3 upload'))
//     )

//     const formData = new FormData()
//     formData.append('file', file.file)

//     xhr.open('PUT', presignedUrl)
//     xhr.send(formData)
//   })

const uploadFile = ({ file, presignedUrl, onProgress }) =>
  new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()

    xhr.upload.addEventListener('progress', e => {
      if (e.lengthComputable) {
        const pct = Math.round((e.loaded / e.total) * 100)
        onProgress?.(pct)
      }
    })

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve()
      } else {
        reject(new Error(`S3 upload failed (status ${xhr.status})`))
      }
    })

    xhr.addEventListener('error', () =>
      reject(new Error('Network error during S3 upload'))
    )

    // file may be a raw File, or { file: File } — unwrap cleanly
    const rawFile =
      file instanceof File || file instanceof Blob ? file : file?.file

    if (!rawFile || !(rawFile instanceof File || rawFile instanceof Blob)) {
      return reject(new Error('Invalid file object passed to uploadFile'))
    }

    xhr.open('PUT', presignedUrl)

    // This is what the working uploadSingleFile does correctly
    xhr.setRequestHeader(
      'Content-Type',
      rawFile.type || 'application/octet-stream'
    )

    // Send raw binary — same as working: xhr.send(file)
    xhr.send(rawFile)
  })

/* ─────────────────────────────────────────────
   Main Component
───────────────────────────────────────────── */
const UploadProgressPage = () => {
 

  const navigate = useNavigate()
  const location = useLocation()
  const ORGANIZATION_UUID = localStorage.getItem('organization_uuid')
  const fallbackRedirectPath = location.pathname.startsWith('/admin')
    ? '/admin/knowledge-base'
    : '/knowledge-base'
  // Parent passes: files (array), category (string), redirectPath (string)
  const {
    files = [],
    category = 'General',
    parentTab,
    redirectPath = fallbackRedirectPath
  } = location.state || {}

  const [fileStates, setFileStates] = useState(() => initialFileState(files))
  const [isPageLoading, setIsPageLoading] = useState(false)
  const [showProcessingModel, setShowProcessingModal] = useState(false)
  const [globalError, setGlobalError] = useState(null)
  const hasStarted = useRef(false)

  /* ── derived counts ── */
  const completedCount = Object.values(fileStates).filter(
    s => s.status === 'success'
  ).length
  const errorCount = Object.values(fileStates).filter(
    s => s.status === 'error'
  ).length
  const allDone =
    completedCount + errorCount === files.length && files.length > 0

  /* ── helpers to update per-file state ── */
  const setFileProgress = (id, progress) =>
    setFileStates(prev => ({
      ...prev,
      [id]: { ...prev[id], progress, status: 'uploading' }
    }))

  const setFileStatus = (id, status, error = null) =>
    setFileStates(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        status,
        error,
        progress: status === 'success' ? 100 : prev[id].progress
      }
    }))

  /* ─────────────────────────────────────────
     Core upload orchestration
  ───────────────────────────────────────── */
  useEffect(() => {
    if (files.length === 0 || hasStarted.current) return
    hasStarted.current = true

    const runUploads = async () => {
      /* Step 1 — fetch all presigned URLs in parallel */
      const presignedResults = await Promise.all(
        files.map(async file => {
          const payload = {
            organization_uuid: ORGANIZATION_UUID,
            file_name: file.name,
            document_category: category
          }

          try {
            const res = await GetCompanyUploadedUrl(payload)
            const parsed = JSON.parse(res)
            return {
              file,
              presignedUrl: parsed.data.upload_url,
              fileUuid: parsed.data.file_uuid,
              error: null
            }
          } catch (err) {
            return { file, presignedUrl: null, fileUuid: null, error: err }
          }
        })
      )

      /* Step 2 — upload each file to S3 + call AddCompanyDocument in parallel */
      await Promise.all(
        presignedResults.map(
          async ({ file, presignedUrl, fileUuid, error }) => {
            if (error || !presignedUrl) {
              setFileStatus(file.id, 'error', 'Failed to get upload URL')
              return
            }

            try {
              await uploadFile({
                file: file.file,
                presignedUrl,
                fileUuid,
                section: category,
                onProgress: pct => setFileProgress(file.id, pct)
              })

              /* AddCompanyDocument */
              await AddCompanyDocument({
                organization_uuid: ORGANIZATION_UUID,
                original_file_name: file.name,
                file_size: file.size,
                document_category: category,
                file_uuid: fileUuid
              })

              setFileStatus(file.id, 'success')
            } catch (err) {
              setFileStatus(file.id, 'error', err.message || 'Upload failed')
            }
          }
        )
      )
    }

    runUploads().catch(err => {
      setGlobalError(err.message || 'Unexpected error occurred.')
    })
  }, [])   

  /* ── navigate after all done (only if no errors) ── */
  useEffect(() => {
    if (!allDone) return
    if (errorCount === 0) {
      const t = setTimeout(() => {
        setShowProcessingModal(true)
      }, 1200)
      return () => clearTimeout(t)
    }
  }, [allDone, errorCount, redirectPath])

  /* ─────────────────────────────────────────
     Status helpers for the progress bar UI
  ───────────────────────────────────────── */
  const getBarColor = status => {
    if (status === 'error') return 'tw-bg-red-500'
    if (status === 'success') return 'tw-bg-green-500'
    return 'tw-bg-blue-600'
  }

  const getStatusLabel = id => {
    const { progress, status, error } = fileStates[id] || {}
    if (status === 'success')
      return <span className='tw-text-green-600'>Completed ✓</span>
    if (status === 'error')
      return <span className='tw-text-red-500'>Failed — {error}</span>
    if (status === 'uploading')
      return <span className='tw-text-[#667085]'>Uploading… {progress}%</span>
    return <span className='tw-text-[#667085]'>Waiting…</span>
  }

  /* ─────────────────────────────────────────
     Info box content depending on state
  ───────────────────────────────────────── */
  const infoBox = () => {
    if (errorCount > 0 && allDone) {
      return (
        <div className='tw-flex tw-gap-3 tw-bg-red-50 tw-border tw-border-red-200 tw-rounded-[10px] tw-p-4'>
          <XCircle size={20} className='tw-text-red-500 tw-shrink-0' />
          <div>
            <p className='tw-font-medium tw-text-red-700'>
              Some uploads failed
            </p>
            <p className='tw-text-[12px] tw-text-red-600'>
              {errorCount} file(s) could not be uploaded. Please go back and try
              again.
            </p>
          </div>
        </div>
      )
    }
    if (allDone) {
      return (
        <div className='tw-flex tw-gap-3 tw-bg-green-50 tw-border tw-border-green-200 tw-rounded-[10px] tw-p-4'>
          <CheckCircle2 size={20} className='tw-text-green-600 tw-shrink-0' />
          <div>
            <p className='tw-font-medium tw-text-green-700'>
              All files uploaded!
            </p>
            <p className='tw-text-[12px] tw-text-green-600'>
              Redirecting you now…
            </p>
          </div>
        </div>
      )
    }
    return (
      <div className='tw-flex tw-gap-3 tw-bg-[#eff6ff] tw-border tw-border-[#bedbff] tw-rounded-[10px] tw-p-4'>
        <Info size={20} className='tw-text-[#1570EF] tw-shrink-0' />
        <div>
          <p className='tw-font-medium tw-text-[#1c398e]'>Upload in Progress</p>
          <p className='tw-text-[12px] tw-text-[#155dfc]'>
            Please wait while your files are being uploaded. Do not close this
            page.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className='tw-min-h-screen tw-p-8'>
      {isPageLoading && <FullPageLoader />}

      {/* Header */}
      <div className='tw-flex tw-items-center tw-gap-4 tw-mb-6'>
        <button
          disabled={!allDone} // prevent leaving mid-upload
          onClick={() => {
            setIsPageLoading(true)
            navigate(-1)
          }}
          className='tw-flex tw-items-center tw-justify-center tw-w-10 tw-h-10 tw-bg-[#B9C4D5] tw-rounded-lg disabled:tw-opacity-40 disabled:tw-cursor-not-allowed'
        >
          <i className='icon-Previous tw-text-white' />
        </button>

        <div>
          <span className='tw-text-[#535353] tw-text-[14px]'>
           Knowledge Base / {category}
          </span>
          <h1 className='tw-text-[#002149] tw-text-[22px] tw-font-bold'>
            Upload Document
          </h1>
        </div>
      </div>

      {/* Upload Container */}
      <div className='tw-bg-white tw-rounded-xl tw-border tw-border-[#EAECF0] tw-shadow-sm tw-p-10 tw-max-w-[1000px] tw-mx-auto lg:tw-ml-11'>
        <h2 className='tw-text-[18px] tw-font-medium tw-text-[#101828] tw-mb-6'>
          Uploading Files ({completedCount}/{files.length})
        </h2>

        {/* Global error */}
        {globalError && (
          <p className='tw-text-red-500 tw-text-sm tw-mb-4'>{globalError}</p>
        )}

        {/* File list */}
        <div className='tw-space-y-4 tw-mb-8'>
          {files.map(file => {
            const state = fileStates[file.id] || {
              progress: 0,
              status: 'pending'
            }
            return (
              <div key={file.id} className='tw-border tw-rounded-xl tw-p-4'>
                <div className='tw-flex tw-gap-4'>
                  <i className='icon-Budget-Estimate tw-text-[#2b7fff] tw-text-[24px]' />

                  <div className='tw-flex-1'>
                    <div className='tw-flex tw-justify-between tw-items-center'>
                      <span className='tw-font-medium'>{file.name}</span>
                      {state.status === 'success' && (
                        <CheckCircle2 size={18} className='tw-text-green-500' />
                      )}
                      {state.status === 'error' && (
                        <XCircle size={18} className='tw-text-red-500' />
                      )}
                    </div>

                    <span className='tw-text-[12px] tw-text-[#667085]'>
                      {formatSize(file.size)}
                    </span>

                    <div className='tw-mt-4'>
                      <div className='tw-w-full tw-h-2 tw-bg-gray-200 tw-rounded-full tw-overflow-hidden'>
                        <div
                          className={`tw-h-full tw-rounded-full tw-transition-all tw-duration-300 ${getBarColor(
                            state.status
                          )}`}
                          style={{ width: `${state.progress}%` }}
                        />
                      </div>
                      <span className='tw-text-[11px] tw-mt-2 tw-block'>
                        {getStatusLabel(file.id)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Info / status box */}
        {infoBox()}

        {/* Retry button if some failed */}
        {allDone && errorCount > 0 && (
          <button
            onClick={() => navigate(-1)}
            className='tw-mt-6 tw-px-5 tw-py-2 tw-bg-blue-600 tw-text-white tw-rounded-lg tw-text-sm tw-font-medium hover:tw-bg-blue-700'
          >
            Go Back &amp; Retry
          </button>
        )}
      </div>
     {showProcessingModel && (
 <ProcessingModal
    isOpen={showProcessingModel}
    onClose={() => setShowProcessingModal(false)}
    activeTab={parentTab || category}
    redirectPath={redirectPath}
  />
)}
    </div>
  )
}

export default UploadProgressPage
