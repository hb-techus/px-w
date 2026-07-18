import React, { useState, useRef, useCallback, useEffect } from 'react'
import { useNavigate, useLocation, useParams } from 'react-router-dom'
import FullPageLoader from '../../../genriccomponents/loaders/FullPageLoader'
// import Dropdown from '../../Common/DropDown'
import PageHeader from '../../Common/PageHeader'

// function Dropdown ({
//   options = [],
//   placeholder,
//   onChange,
//   width = 'tw-w-44',
//   value
// }) {
//   const [open, setOpen] = useState(false)
//   const ref = useRef(null)

//   useEffect(() => {
//     const handler = e => {
//       if (ref.current && !ref.current.contains(e.target)) setOpen(false)
//     }
//     document.addEventListener('mousedown', handler)
//     return () => document.removeEventListener('mousedown', handler)
//   }, [])

//   const handleSelect = option => {
//     onChange(option.value) // Now passing the selected value
//     setOpen(false)
//   }

//   return (
//     <div ref={ref} className={`tw-relative ${width}`}>
//       <button
//         type='button'
//         onClick={() => setOpen(!open)}
//         className='tw-w-full tw-flex tw-items-center tw-justify-between 
//                    tw-px-3 tw-py-2 tw-bg-white tw-border tw-border-gray-300 
//                    tw-rounded-md tw-text-sm tw-text-gray-600 hover:tw-border-gray-400 
//                    tw-transition-all tw-duration-200'
//       >
//         <span className='tw-truncate'>
//           {value
//             ? options.find(opt => opt.value === value)?.label || placeholder
//             : placeholder}
//         </span>

//         {/* CUSTOM ICON REPLACEMENT */}
//         <i
//           className={`icon-Dropdown tw-text-black tw-transition-transform tw-duration-200 tw-inline-block ${
//             open ? 'tw-rotate-180' : ''
//           }`}
//           style={{ fontSize: '12px' }} // Adjust size as needed to match design
//         ></i>
//       </button>

//       {open && (
//         <div
//           className='tw-absolute tw-z-50 tw-mt-1 tw-w-full tw-bg-white 
//                         tw-border tw-border-gray-200 tw-rounded-md tw-shadow-lg 
//                         tw-py-1 tw-animate-in tw-fade-in tw-slide-in-from-top-1'
//         >
//           {options.map(opt => (
//             <button
//               key={opt.value}
//               onClick={() => handleSelect(opt)}
//               className={`tw-w-full tw-flex tw-items-center tw-justify-between 
//                           tw-px-3 tw-py-2 tw-text-left tw-text-sm 
//                           ${
//                             value === opt.value
//                               ? 'tw-bg-blue-50 tw-text-blue-600 tw-font-medium'
//                               : 'tw-text-gray-700 hover:tw-bg-gray-50'
//                           }`}
//             >
//               {opt.label}
//               {value === opt.value && <Check size={14} className='tw-ml-2' />}
//             </button>
//           ))}
//         </div>
//       )}
//     </div>
//   )
// }
// const SECTION_OPTIONS = [
//   'General',
//   'Proposal Drafting',
//   'RFP Analyzer & Recommendations',
//   'Takeoff & Estimation',
//   'Others'
// ]
const SECTION_OPTIONS = [
  // { label: 'General', value: 'general' },
  { label: 'Proposal Drafting', value: 'proposal_drafting' },
  { label: 'RFP Analyzer & Recommendations', value: 'rfp_analyzer' },
  { label: 'Takeoff & Estimation', value: 'takeoff' },
  { label: 'Others', value: 'others' }
]
const MAX_FILES = 20
const MAX_SIZE_MB = 200
// const ACCEPTED_TYPES = [
//   '.pdf',
//   '.docx',
//   '.xlsx',
//   '.xls',
//   '.txt',
//   '.ppt',
//   '.csv'
// ]
// const ACCEPTED_MIME = [
//   'application/pdf',
//   'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
//   'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
//   'application/vnd.ms-excel',
//   'text/plain',
//   'application/vnd.openxmlformats-officedocument.presentationml.presentation',
//   'text/csv'
// ]

const ACCEPTED_TYPES = [
  '.pdf',
  '.docx',
  '.txt',
  '.xls',
  '.xlsx',
  '.csv',
  '.pptx'
]

const ACCEPTED_MIME = [
  'application/pdf', // .pdf
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
  'text/plain', // .txt
  'application/vnd.ms-excel', // .xls
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
  'text/csv', // .csv
  'application/vnd.openxmlformats-officedocument.presentationml.presentation' // .pptx
]

const formatSize = bytes => {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${(bytes / 1024).toFixed(1)} KB`
}

const isSupportedFile = file => {
  const extension = `.${file.name.split('.').pop()?.toLowerCase() || ''}`

  return (
    ACCEPTED_MIME.includes(file.type) || ACCEPTED_TYPES.includes(extension)
  )
}

const DEFAULT_SECTION = SECTION_OPTIONS[0]

const CATEGORY_ALIASES = {
  proposal_drafting: 'proposal_drafting',
  proposal_drafter: 'proposal_drafting',
  rfp_analyzer: 'rfp_analyzer',
  rfp_analyzer_and_recommendations: 'rfp_analyzer',
  rfp_analyzer_recommendations: 'rfp_analyzer',
  bid_intelligence: 'rfp_analyzer',
  takeoff: 'takeoff',
  takeoff_and_estimation: 'takeoff',
  takeoff_estimation: 'takeoff',
  others: 'others',
  general: DEFAULT_SECTION.value
}

const SECTION_TO_PARENT_TAB = {
  proposal_drafting: 'Proposal Drafter',
  rfp_analyzer: 'Bid Intelligence',
  takeoff: 'Takeoff & Estimation',
  others: 'Proposal Drafter'
}

const normalizeCategory = value =>
  value
    ?.toString()
    .trim()
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')

const resolveSectionOption = category => {
  const normalizedCategory = normalizeCategory(category)
  const sectionValue = CATEGORY_ALIASES[normalizedCategory]

  if (!sectionValue) {
    return DEFAULT_SECTION
  }

  return (
    SECTION_OPTIONS.find(option => option.value === sectionValue) ||
    DEFAULT_SECTION
  )
}

const UploadDocumentPage = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const isAdmin = location.pathname.startsWith('/admin')
  const { organization_uuid: paramOrg } = useParams()
  const organization_uuid = location.state?.organization_uuid || paramOrg
  const backPath = isAdmin
    ? '/admin/knowledge-base'
    : `/knowledge-base`

  const editData = location.state?.editData
  const incomingCategory =
    editData?.category || location.state?.category || location.state?.activeTab
  const resolvedSection = resolveSectionOption(incomingCategory)
  const backActiveTab = SECTION_TO_PARENT_TAB[resolvedSection.value]
  const [isPageLoading, setIsPageLoading] = useState(false)
  const isEdit = location.state?.isEdit

  const [section, setSection] = useState(resolvedSection.value)

  useEffect(() => {
    setSection(resolvedSection.value)
  }, [resolvedSection.value])

  const breadcrumbCategory =
    editData?.category || location.state?.category || resolvedSection.label

  const [files, setFiles] = useState([])
  const [dragging, setDragging] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef(null)

  const addFiles = useCallback(
    incoming => {
      setError('')
      const valid = []
      for (const f of incoming) {
        if (files.length + valid.length >= MAX_FILES) {
          setError(`Maximum ${MAX_FILES} files allowed.`)
          break
        }
        if (f.size > MAX_SIZE_MB * 1024 * 1024) {
          setError(`"${f.name}" exceeds ${MAX_SIZE_MB} MB limit.`)
          continue
        }
        if (!isSupportedFile(f)) {
          setError(`"${f.name}" is not a supported format.`)
          continue
        }
        valid.push({ file: f, id: crypto.randomUUID() })
      }
      setFiles(prev => [...prev, ...valid])
    },
    [files.length]
  )

  const removeFile = id => setFiles(prev => prev.filter(f => f.id !== id))

  const onDrop = e => {
    e.preventDefault()
    setDragging(false)
    addFiles([...e.dataTransfer.files])
  }

  const onInputChange = e => {
    addFiles([...e.target.files])
    e.target.value = ''
  }
  //  const handleUpload = async () => {
  //     if (!files.length) {
  //       setError('Please select at least one file.');
  //       return;
  //     }

  //     setIsPageLoading(true);

  //     try {
  //       // Prepare the files data
  //       const filesToUpload = files.map(f => ({
  //         name: f.file.name,
  //         size: f.file.size,
  //         id: f.id,
  //         category: section
  //       }));

  //       navigate('/admin/knowledge-base/progress', {
  //         state: {
  //           files: filesToUpload,
  //           category: section
  //         }
  //       });
  //     } catch (error) {
  //       setError('An error occurred while uploading the files.');
  //       console.error('Error during upload', error);
  //     } finally {
  //       setIsPageLoading(false);
  //     }
  //   };

  const handleUpload = async () => {
    if (!files.length) {
      setError('Please select at least one file.')
      return
    }

    setIsPageLoading(true)

    try {
      const filesToUpload = files.map(f => ({
        id: f.id,
        name: f.file.name,
        size: f.file.size,
        category: section,
        file: f.file
      }))

      navigate(
        isAdmin
          ? '/admin/knowledge-base/progress'
          : `/knowledge-base/progress`,
        {
          state: {
            files: filesToUpload,
            category: section,
            parentTab: backActiveTab,
            redirectPath: backPath,
            organization_uuid: organization_uuid
          }
        }
      )
    } catch (error) {
      setError('An error occurred while uploading the files.')
      console.error('Error during upload', error)
    } finally {
      setIsPageLoading(false)
    }
  }
  return (
    <div className='tw-min-h-screen '>
      {isPageLoading && <FullPageLoader />}

      {/* <div className='tw-flex tw-items-center tw-gap-4 tw-mb-6'>
        <button
          onClick={() => {
            setIsPageLoading(true)
            navigate(backPath)
          }}
          className='tw-flex tw-items-center tw-justify-center tw-w-10 tw-h-10 tw-bg-[#B9C4D5] tw-rounded-lg hover:tw-opacity-90 tw-transition-all'
        >
          <i className='icon-Previous tw-text-white' />
        </button>

        <div className='tw-flex tw-flex-col'>
          <span className='tw-text-[#535353] tw-text-[14px] tw-font-normal tw-leading-tight'>
            Knowledge Base / {breadcrumbCategory}
          </span>

          
          <h1 className='tw-text-[#002149] tw-text-[20px] tw-font-bold tw-leading-tight tw-mt-1'>
            {isEdit ? 'Edit Document' : 'Upload Document'}
          </h1>
        </div>
      </div> */}

       <PageHeader
                parentTitle={`Knowledge Base / ${breadcrumbCategory}`}
                title={`Upload Document`}
                onBack={() => {
                  navigate(backPath, { state: { activeTab: backActiveTab } })
                }}
              />

      {/* Page Title */}

      {/* Main Card */}
      <div className='tw-bg-white tw-rounded-xl tw-border tw-border-[#EAECF0] tw-shadow-sm tw-p-10 tw-max-w-[1200px] tw-mx-auto lg:tw-ml-11'>
        {/* Section Dropdown */}
        {/* <div className='tw-mb-8'> */}
          {/* <label className='tw-block tw-text-[13px] tw-font-medium tw-text-[#344054] tw-mb-2'>
            Section
          </label> */}

          {/* <Dropdown
            options={SECTION_OPTIONS}
            value={section}
            placeholder='Select a section'
            onChange={val => setSection(val)}
            width='tw-w-[280px]'
          /> */}
          {/* <Dropdown
            options={SECTION_OPTIONS}
            value={section}
            placeholder='Select a section'
            onChange={val => {
              setSection(val)
            }}
            width='tw-w-[280px]'
          /> */}
        {/* </div> */}

        <div
          onDragOver={e => {
            e.preventDefault()
            setDragging(true)
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          className={`tw-flex tw-flex-col tw-items-center tw-justify-center tw-gap-2
            tw-border-2 tw-border-dashed tw-rounded-xl tw-py-12 tw-cursor-pointer tw-transition-all
            ${
              dragging
                ? 'tw-border-[#004EEB] tw-bg-[#F5F8FF]'
                : ' tw-border-[#b6d3f] '
            }`}
        >
          <div className='tw-relative tw-mb-2'>
            <div className='tw-w-14 tw-h-14  tw-flex tw-items-center tw-justify-center'>
              <i className='icon-Upload tw-text-[#667085] tw-text-[36px]' />
            </div>
          </div>
          <p className='tw-text-[18px] tw-font-semibold tw-text-[#003577]'>
            Click to upload or drag and drop
          </p>
          <p className='tw-text-[15px] tw-text-[#919191]'>
            PDF, DOCX, XLSX, TXT, PPTX, CSV (max {MAX_SIZE_MB}.0 MB)
          </p>
          <input
            ref={inputRef}
            type='file'
            multiple
            accept={ACCEPTED_TYPES.join(',')}
            className='tw-hidden'
            onChange={onInputChange}
          />
        </div>

        {isEdit && editData && files.length === 0 && (
          <div
            className='tw-mt-4 tw-flex tw-items-center tw-justify-between tw-px-4 tw-py-4
    tw-border tw-border-[#EAECF0] tw-rounded-xl tw-bg-[#F9FAFB]'
          >
            <div className='tw-flex tw-items-center tw-gap-4'>
              <div
                className='tw-w-10 tw-h-10 tw-bg-white tw-border tw-border-[#EAECF0] tw-rounded-lg
        tw-flex tw-items-center tw-justify-center'
              >
                <i className='icon-Document tw-text-[#004EEB]' />
              </div>
              <div>
                <p className='tw-text-[14px] tw-font-medium tw-text-[#101828]'>
                  {editData.fileName}
                </p>
                <p className='tw-text-[12px] tw-text-[#667085]'>
                  {editData.size} • Current file
                </p>
              </div>
            </div>
            <span className='tw-text-[12px] tw-text-[#667085] tw-italic'>
              Upload a new file to replace
            </span>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <p className='tw-text-[13px] tw-text-red-600 tw-mt-3 tw-font-medium'>
            ! {error}
          </p>
        )}

        {/* File Preview List */}
        {files.length > 0 && (
          <div className='tw-mt-8'>
            <p className='tw-text-[13px] tw-font-semibold tw-text-[#344054] tw-mb-3'>
              Files ({files.length}/{MAX_FILES})
            </p>
            <div className='tw-space-y-3'>
              {files.map(({ id, file }) => (
                <div
                  key={id}
                  className='tw-flex tw-items-center tw-justify-between tw-px-4 tw-py-4
                    tw-border tw-border-[#EAECF0] tw-rounded-xl tw-bg-white'
                >
                  <div className='tw-flex tw-items-center tw-gap-4'>
                    <div
                      className='tw-w-10 tw-h-10 
                      tw-flex tw-items-center tw-justify-center'
                    >
                      <i className='icon-Document tw-text-[#004EEB] tw-text-[24px]' />
                    </div>
                    <div>
                      <p className='tw-text-[14px] tw-font-medium tw-text-[#101828]'>
                        {file.name}
                      </p>
                      {/* Changed below: Removed the dot and added a div/p for the status to force a new line */}
                      <p className='tw-text-[12px] tw-text-[#667085]'>
                        {formatSize(file.size)}
                      </p>
                      <p className='tw-text-[12px] tw-text-[#667085]'>
                        Ready to upload
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={e => {
                      e.stopPropagation()
                      removeFile(id)
                    }}
                    className='tw-text-[#98A2B3] tw-p-1'
                  >
                    <i className='icon-Close tw-text-[24px]' />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Supported Formats Info Box */}
        <div className='tw-mt-8 tw-rounded-[10px] tw-border tw-border-[#bedbff] tw-bg-[#eff6ff] tw-p-6'>
          <p className='tw-text-[14px] tw-font-medium  tw-text-[#1c398e] tw-mb-2'>
            Supported Formats
          </p>
          <ul className='tw-space-y-1 tw-text-[14px] tw-text-[#1447e6] tw-font-normal'>
            <li>• Documents: PDF, DOCX, TXT</li>
            <li>• Spreadsheets: XLS, XLSX, CSV</li>
            <li>• Presentations: PPTX</li>
          </ul>
          <p className='tw-text-[12px] tw-text-[#155dfc] tw-mt-4'>
            Files will appear as "Uploaded" status and can be processed after
            upload
          </p>
        </div>

        {/* Footer Buttons */}
        <div className='tw-flex tw-justify-end tw-gap-3 tw-mt-10'>
          <button
            onClick={() =>
              navigate(backPath, { state: { activeTab: backActiveTab } })
            }
            className='tw-px-6 tw-py-2.5 tw-rounded-lg tw-border tw-border-[#D0D5DD]
              tw-text-[14px] tw-font-semibold tw-text-[#1e293b] tw-bg-[#dedede] tw-transition-colors'
          >
            Cancel
          </button>
          <button
            onClick={handleUpload}
            disabled={!files.length}
            className={`tw-px-6 tw-py-2.5 tw-rounded-[5px] tw-text-[14px] tw-font-semibold tw-text-white tw-transition-all
              ${
                files.length
                  ? 'tw-bg-[#0140c1] hover:tw-bg-[#003bb3]'
                  : 'tw-bg-[#B2CCFF] tw-cursor-not-allowed'
              }`}
          >
            Upload{' '}
            {files.length > 0
              ? `${files.length} File${files.length > 1 ? 's' : ''}`
              : ''}
          </button>
        </div>
      </div>
    </div>
  )
}

export default UploadDocumentPage
