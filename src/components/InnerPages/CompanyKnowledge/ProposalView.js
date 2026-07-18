import React, { useEffect } from 'react'
import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import FullPageLoader from '../../../genriccomponents/loaders/FullPageLoader'
import FileViewer from './FileViewer'
import {
  GetCompanyDocView,
  MultiExtenSionPresign
} from '../../../services/techus-services'
import {
  bytesToMB,
  formatDateTime,
  getFileExtension
} from '../../../utils/commonUtils'
import PageHeader from '../../Common/PageHeader'
import Timeline from './Timeline'
import usePermissions from '../../Common/usePermissions'

const DocumentDashboard = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const [isPageLoading, setIsPageLoading] = useState(false)
  const [, setPresignedMultiExtUrl] = useState(false)
  const { category, data } = location.state || {}
  const [viewResponse, setViewResponse] = useState()
  const {permissions}=usePermissions('company_knowledge_management','org_kb');
  useEffect(() => {
    GetViewCompanyDoc()
  }, [])

  const GetViewCompanyDoc = async () => {
    try {
      const viewComp = JSON.parse(await GetCompanyDocView(data?.file_uuid))
      const presignedResp = await MultiExtenSionPresign({
        key: viewComp?.data.s3_key
      })
      const presignedUrl = JSON.parse(presignedResp).url

      // Both set together → single re-render (React 18 auto-batches these)
      setViewResponse(viewComp)
      setPresignedMultiExtUrl(presignedUrl)
    } catch (err) {
      console.error('Failed to load document:', err)
    }
  }

  const downloadFile = async () => {
    try {
      setIsPageLoading(true)
      const s3Url = viewResponse?.data?.view_url
      if (!s3Url) return

      const response = await fetch(s3Url)
      if (!response.ok) throw new Error(`Download failed: ${response.status}`)

      const blob = await response.blob()
      // Force octet-stream so browser always downloads instead of previewing
      const downloadBlob = new Blob([blob], { type: 'application/octet-stream' })

      const url = window.URL.createObjectURL(downloadBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = data?.filename || 'download'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      setTimeout(() => window.URL.revokeObjectURL(url), 1000)
    } catch (err) {
      console.error('Download error:', err)
    } finally {
      setIsPageLoading(false)
    }
  }


  const statusMap = {
    0: 'Error',
    1: 'Uploaded',
    2: 'Processing',
    3: 'Completed'
  }
// ── skeleton ─────────────────────────────────────────────────────────────────
const SkeletonCircle = () => (
  <div
    className="tl-shimmer"
    style={{ width: 20, height: 20, borderRadius: '50%', flexShrink: 0 , background:'#e0e0e0'}}
  />
)

const SkeletonLine = ({ width = '100%', height = 10, style = {} }) => (
  <div
    className="tl-shimmer"
    style={{ width, background:'#e0e0e0',height, borderRadius: 4, ...style }}
  />
)

const SkeletonConnector = () => (
  <div
    className="tl-shimmer"
    style={{ width: 2, flex: 1, minHeight: 36, margin: '4px auto', borderRadius: 2,background:'#e0e0e0' }}
  />
)

const TimelineSkeleton = () => (
  <div style={{ display: 'flex', flexDirection: 'column' }}>
    {[0, 1, 2].map(idx => (
      <div key={idx} style={{ display: 'flex', gap: 14, alignItems: 'stretch' }}>
        {/* icon + connector */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 20}}>
          <SkeletonCircle />
          {idx < 2 && <SkeletonConnector />}
        </div>
        {/* text lines */}
        <div style={{ paddingBottom: idx < 2 ? 20 : 0, paddingTop: 2, flex: 1 }}>
          <SkeletonLine width={idx === 0 ? 70 : idx === 1 ? 90 : 80} height={12} />
          <SkeletonLine width={110} height={10} style={{ marginTop: 6 }} />
        </div>
      </div>
    ))}
  </div>
)

  return (
    <div className='tw-text-slate-700'>
      {isPageLoading && <FullPageLoader />}
      <div className='tw-mb-6 tw-flex tw-items-center tw-justify-between'>
        <PageHeader
          parentTitle={`Knowledge Base / ${category}`}
          title={data?.filename}
         onBack={() => {
  navigate('/knowledge-base', { state: { activeTab: category } })
}}
        />
        {permissions?.download &&(
        <button
          onClick={() => {
            downloadFile()
          }}
          className='tw-flex tw-items-center tw-gap-2 tw-rounded-md tw-bg-blue-700 tw-px-6 tw-py-2 tw-font-semibold tw-text-white hover:tw-bg-blue-800'
        >
          <i className='icon-Specialty-Construction-3' />
          Download
        </button>
)}
      </div>
      <div className='tw-grid tw-grid-cols-1 tw-gap-6 lg:tw-grid-cols-4'>
        <div className='tw-space-y-6 lg:tw-col-span-1'>
          <div className='tw-rounded-xl tw-bg-white tw-p-6 tw-shadow-sm'>
            <h2 className='tw-mb-4 tw-text-[14px] tw-font-medium tw-text-[#101828]'>
              Document Details
            </h2>

            <div className='tw-flex tw-flex-col tw-gap-[15px]'>
              {' '}
              <DetailItem
                icon={<i className='icon-File-Type' />}
                label='File Type'
                value={getFileExtension(data?.filename)?.toUpperCase()}
              />
              <DetailItem
                icon={<i className='icon-File-Size' />}
                label='File Size'
                value={`${bytesToMB(data?.size)} MB`}
              />
              <DetailItem
                icon={<i className='icon-Uploaded-By' />}
                label='Uploaded By'
                value={data?.uploaded_by}
              />
              <DetailItem
                icon={<i className='icon-Schedule' />}
                label='Uploaded At'
                value={formatDateTime(data?.uploaded_date)}
              />
            </div>
            <div className='tw-mt-6'>
              <p className='tw-mb-2 tw-text-[12px] tw-text-[#6a7282] uppercase'>
                Status
              </p>
              <span
                className={`tw-w-[100px] tw-h-[22px] tw-inline-flex tw-items-center tw-gap-1 tw-rounded-full tw-px-3 tw-py-1 tw-text-xs tw-font-medium tw-border ${
                  data?.status === 1
                    ? ' tw-text-[#1740c1] tw-border-[#1740c1]'
                    : data?.status === 2
                    ? ' tw-text-[#c16217] tw-border-[#c16217]'
                    : data?.status === 3
                    ? ' tw-text-[#17803d] tw-border-[#17803d]'
                    : 'tw-text-[#c11717] tw-border-[#c11717]'
                }`}
              >
                <i
                  className={`${
                    data?.status === 1 || data?.status === 3
                      ? 'icon-Got-it'
                      : data?.status === 2
                      ? 'icon-Timeline'
                      : 'icon-Failed'
                  } tw-font-bold ${
                    data?.status === 1
                      ? 'tw-text-[#1740c1]'
                      : data?.status === 2
                      ? 'tw-text-[#c16217]'
                      : data?.status === 3
                      ? 'tw-text-[#17803d]'
                      : 'tw-text-[#c11717]'
                  }`}
                />
                {statusMap[data?.status]}
              </span>
              <hr className='tw-my-6 tw-border-slate-100' />
              <h2 className='tw-mb-4 tw-text-[14px] tw-font-medium tw-text-[#101828]'>
                Processing Timeline
              </h2>
              {
              viewResponse ? <Timeline data={data} viewResponse={viewResponse.data} /> : 
              <TimelineSkeleton/>}
            </div>
          </div>
        </div>
        <div className='tw-rounded-xl tw-bg-white tw-p-6 tw-shadow-sm lg:tw-col-span-3'>
          <div style={{ width: '100%', height: '550px' }}>
            <FileViewer url={viewResponse?.data?.view_url} onRetry={GetViewCompanyDoc} />
          </div>
        </div>
      </div>
    </div>
  )
}

const DetailItem = ({ icon, label, value }) => (
  <div className='tw-flex tw-items-start tw-gap-[15px]'>
    <div className='tw-text-[#6a7282] tw-text-[18px] mt-1'>{icon}</div>
    <div className=''>
      <p className='tw-text-[12px] tw-text-[#6a7282] '>{label}</p>
      <p className='tw-text-[14px] tw-text-[#101828]'>{value}</p>
    </div>
  </div>
)

export default DocumentDashboard
