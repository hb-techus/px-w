import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import FullPageLoader from '../../../genriccomponents/loaders/FullPageLoader'
import { ViewPackage } from '../../../services/techus-services'
import { DeletePackage } from '../../../services/techus-services'
import { showToast } from '../../../genriccomponents/techus-ToastNotification'
import Loader from '../../Common/ApiCallLoader'
import { formatDollarCompact } from '../../../utils/commonUtils'
import DeleteModal from '../../../genriccomponents/DeleteModal'
import { useSelector } from 'react-redux'

const PackageManagement = () => {
  const { id } = useParams()
  const [packageData, setPackageData] = useState(null)
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(true)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const permissionsList = useSelector((s) => s?.auth?.user?.[0]?.permission_info) || {};
const permissions = permissionsList?.package_management || {};


  useEffect(() => {
    const fetchPackageDetails = async () => {
      try {
        const payload = {
          package_uuid: id
        }

        const raw = await ViewPackage(payload)

        const response = typeof raw === 'string' ? JSON.parse(raw) : raw
        console.log('view package', response)

        setPackageData(response?.data)
      } catch (error) {
        console.error('Error fetching package details:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchPackageDetails()
  }, [id])

  const handleDeleteConfirm = async () => {
    try {
       if (!permissions?.delete) return;
      if (!packageData?.package_uuid) return

      setShowDeleteModal(false)
      setIsDeleting(true)

      const raw = await DeletePackage({
        package_uuid: packageData.package_uuid
      })
      const response = typeof raw === 'string' ? JSON.parse(raw) : raw

      if (response?.valid) {
        showToast('success', 'Package deleted successfully.')
        navigate('/admin/packages')
      } else {
        showToast(response?.message || 'Failed to delete package', 'error')
      }
    } catch (error) {
      console.error('Delete package error:', error)
      showToast('Something went wrong while deleting package', 'error')
    } finally {
      setIsDeleting(false)
    }
  }
  const handleUpdateConfirm = () => {
    if (!permissions?.edit) return;
    // setShowUpdateModal(false)
    navigate(`/admin/packages/update/${packageData?.package_uuid}`, {
      state: { editData: packageData }
    })
  }

  const handleUpdateCancel = () => {
    setShowUpdateModal(false)
  }

  const handleDeleteCancel = () => {
    setShowDeleteModal(false)
  }

  if (isDeleting) {
    return <Loader />
  }
  
  return (
    <div className='tw-min-h-screen  tw-text-slate-700'>
      {/* Top Header */}
      <div className='tw-flex tw-justify-between tw-items-center tw-mb-6'>
        <div className='tw-flex tw-items-center tw-gap-4 tw-mb-6'>
          {/* Back Button */}
          <button
            onClick={() => navigate('/admin/packages')}
            className="tw-flex tw-items-center tw-justify-center tw-w-10 tw-h-10 tw-bg-[#b2bccd] tw-rounded-md  hover:tw-bg-[#0140c1] tw-transition-colors tw-duration-200'"
          >
            <i className='icon-Previous tw-text-white tw-text-xl'></i>
          </button>

          <div>
            <p className='tw-text-[#535353] tw-text-[14px] tw-mb-0.5'>
              Packages /
            </p>
            <div className='tw-flex tw-items-center tw-gap-3'>
              <h1 className='tw-text-[#000] tw-text-[24px] tw-font-bold tw-max-w-[500px] tw-break-words'>
                {packageData?.name}
              </h1>

              {/* Active Status Badge */}
              {/* <span className="tw-text-[#17803d] tw-text-[12px] tw-font-bold">
  {packageData?.status === 1 ? "Active" : "Inactive"}
</span> */}
            </div>
          </div>
        </div>

        <div className='tw-flex tw-gap-3'>
    
          {permissions?.edit?<button
            onClick={handleUpdateConfirm}
            className='tw-px-5 tw-py-2 tw-bg-[#0047cc] tw-text-white tw-rounded-md tw-text-[14px] tw-font-semibold hover:tw-bg-blue-800 tw-transition-colors'
          >
            Edit Package
          </button>:null}

        
          {permissions?.delete?<button
            onClick={() => setShowDeleteModal(true)}
            className='tw-px-7 tw-py-2 tw-bg-white tw-text-[#b2bccd] tw-border tw-border-[#e2e8f0] tw-rounded-md tw-text-[14px] tw-font-medium hover:tw-bg-gray-50 tw-transition-colors'
          >
            Delete
          </button>:null}
        </div>
      </div>

      <div className='tw-grid  tw-gap-6'>
        {/* Left Column */}
        {isLoading && <FullPageLoader />}
        <div className='tw-col-span-8 tw-space-y-6'>
          {/* Basic Details */}
          <section className='tw-bg-white tw-p-6 tw-rounded-xl tw-border tw-border-slate-200 tw-shadow-sm'>
            <h2 className='tw-text-[18px] tw-font-semibold tw-mb-4 tw-text-[#000]'>
              Basic Details
            </h2>
            <div className='tw-grid tw-grid-cols-3 tw-gap-y-4'>
              {/* <div>
                <p className='tw-text-[13px] tw-mb-1 tw-uppercase tw-font-[500] tw-text-[#6e7178]'>
                  Package ID
                </p>
                <p className='tw-text-[15px] tw-text-[#585858]'>
                  {packageData?.display_package_id}
                </p>
              </div> */}
              <div>
                <p className='tw-text-[13px] tw-mb-1 tw-uppercase tw-font-[500] tw-text-[#6e7178] '>
                  Package Name
                </p>
                <p className='tw-text-[15px] tw-text-[#585858] tw-max-w-[500px] tw-break-words'>
                  {packageData?.name}
                </p>
              </div>
                   <div className='tw-col-span-1'>
                <p className='tw-text-[13px] tw-mb-1 tw-uppercase tw-font-normal tw-text-[#6e7178] '>
                  Description
                </p>
                <p
                  className={`tw-text-[15px] tw-text-[#585858] tw-max-w-[600px] tw-break-words`}
                >
                  {packageData?.description || '-'}
                </p>
              </div>
              <div>
                <p className='tw-text-[13px] tw-mb-1 tw-uppercase tw-font-[500] tw-text-[#6e7178] '>
                  Status
                </p>
                {/* <p className='tw-text-[15px] tw-text-[#585858] tw-max-w-[500px] tw-break-words'> */}
                  <span
                  className={`tw-w-[86px] tw-h-[28px] tw-inline-flex tw-items-center tw-gap-2 tw-rounded-full tw-px-2 tw-py-1 tw-text-[12px] tw-font-[600] tw-border ${
                    packageData?.status === 1
                      ? ' tw-text-[#17803d] tw-border-[#c1f9d5] tw-bg-[#f1fdf4]'
                      : 'tw-text-[#b91c1b] tw-border-[#fecaca] tw-bg-[#fef3f2]'
                  }`}
                >
                  <i
                    className={`${
                      packageData?.status === 1
                        ? 'icon-Project-Details'
                        : 'icon-Failed'
                    } tw-font-bold  tw-text-[14px] ${
                      packageData?.status === 1
                        ? 'tw-text-[#17803d]'
                        : 'tw-text-[#c11717]'
                    }`}
                  />
                  { packageData?.status === 1?'Active':'Inactive'}
                </span>
                {/* </p> */}
              </div>
         
            </div>
          </section>

          {/* Pricing & Discounts */}
          <section className='tw-bg-white tw-p-6 tw-rounded-xl tw-border tw-border-slate-200 tw-shadow-sm'>
            <h2 className='tw-text-base tw-font-bold tw-mb-4 tw-text-slate-800'>
              Pricing & Discounts
            </h2>
            <div className='tw-grid tw-grid-cols-[300px_300px] tw-mb-6'>
              <div className=''>
                <p className='tw-text-[13px] tw-uppercase tw-font-normal tw-text-[#6e7178] tw-tracking-wider'>
                  Monthly Price
                </p>
                <p className='tw-text-[20px] tw-font-bold tw-text-[#0140c1]'>
                  {packageData?.pricing_monthly
                    ? formatDollarCompact(packageData?.pricing_monthly, { decimals: 2 })
                    : '-'}
                </p>
                <p className='tw-text-[13px] tw-text-[#999]'>per month</p>
              </div>
              <div>
                <p className='tw-text-[13px] tw-uppercase tw-font-normal tw-text-[#6e7178] tw-tracking-wider'>
                  Annually Price
                </p>
                <p className='tw-text-[20px] tw-font-bold tw-text-[#0140c1]'>
                  {packageData?.pricing_annual
                    ? formatDollarCompact(packageData?.pricing_annual, { decimals: 2 })
                    : '-'}
                </p>
                <p className='tw-text-[13px] tw-text-[#999]'>per year</p>
              </div>
            </div>

            <p className='tw-text-[13px] tw-uppercase tw-font-bold tw-text-[#6e7178] tw-tracking-wider tw-mb-3'>
              Available Discounts
            </p>
            <div className='tw-space-y-3 tw-max-w-[600px]'>
              {packageData?.discounts?.length === 0 && (
                <p className='tw-text-sm tw-text-gray-400'>
                  No discounts available
                </p>
              )}

              {packageData?.discounts?.map(discount => (
                <div
                  key={discount.id}
                  className='tw-flex tw-items-center tw-gap-4 tw-p-3 tw-bg-[#f1fdf4] tw-border tw-border-green-100 tw-rounded-lg'
                >
                  <div className='tw-bg-[#17803d] tw-text-white tw-text-xs tw-font-bold tw-w-10 tw-h-10 tw-flex tw-items-center tw-justify-center tw-rounded-full'>
                    {discount?.discount_type === 'FIXED' ? '$' : ''}{' '}
                    {discount.discount_value}
                    {discount.discount_type === 'PERCENT' ? '%' : ''}
                  </div>

                  <div>
                    <p className='tw-text-sm tw-font-bold tw-text-[#17803d]'>
                      Both Monthly and Annually Discount
                    </p>

                    <p className='tw-text-[13px] tw-text-[#585858]'>
                      {discount.notes}
                    </p>

                    {(discount.start_date || discount.end_date) && (
                      <p className='tw-text-[12px] tw-text-gray-400'>
                        {discount.start_date
                          ? new Date(discount.start_date).toLocaleString(
                              'en-US',
                              {
                                month: 'numeric',
                                day: 'numeric',
                                year: 'numeric',

                                hour12: true
                              }
                            )
                          : '-'}{' '}
                        →{' '}
                        {discount.end_date
                          ? new Date(discount.end_date).toLocaleString(
                              'en-US',
                              {
                                month: 'numeric',
                                day: 'numeric',
                                year: 'numeric',
                                hour12: true
                              }
                            )
                          : '-'}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Enabled Modules & Features */}

          {/* ── Enabled Modules & Features ── */}
          <section className='tw-bg-white tw-p-6 tw-rounded-xl tw-border tw-border-slate-200 tw-shadow-sm'>
            <h2 className='tw-text-base tw-font-bold tw-mb-6 tw-text-slate-800'>
              Enabled Modules & Features
            </h2>

            <div className="tw-columns-2 tw-gap-4">
  {packageData?.features?.map(feature => (
    <div key={feature.id} className="tw-break-inside-avoid tw-mb-4">
      <FeatureCard
        title={feature.name}
        rawChildren={feature.children || []}
        isChecked={feature.selected}
      />
    </div>
  ))}
</div>
          </section>
        </div>

        {/* Right Column */}
      </div>
      {showDeleteModal && (
        <DeleteModal
          action='delete'
          entity='package'
          icon='icon-Packages'
          subscriptionCount={packageData?.total_subscription_count ?? 0}
          activeCount={packageData?.active_subscription_count ?? 0}
          inactiveCount={packageData?.inactive_subscription_count ?? 0}
          onClose={handleDeleteCancel}
          onConfirm={handleDeleteConfirm}
        />
      )}
      {showUpdateModal && (
        <DeleteModal
          action='update'
          entity='package'
          icon='icon-Packages'
          subscriptionCount={packageData?.total_subscription_count ?? 0}
          activeCount={packageData?.active_subscription_count ?? 0}
          inactiveCount={packageData?.inactive_subscription_count ?? 0}
          onClose={handleUpdateCancel}
          onConfirm={handleUpdateConfirm}
        />
      )}
    </div>
  )
}

const FEATURE_ICONS = {
  'Projects': 'icon-On-hold',
  'Users': 'icon-Admin-users',
  'Roles': 'icon-Roles--Permissions',
  'Organization Knowledge Base': 'icon-Company-knowledges',
  'Bid Intelligence': 'icon-AI-RPF-Analyzer',
  'Takeoff Engine': 'icon-AI-Takeoff',
  'Estimate Builder': 'icon-AI-Estimator',
  'Contract Command': 'icon-AI-Drafter',
}

// Recursive tree node — renders a node and its children with connecting lines
const TreeNode = ({ node, getAccessLabel }) => {
  const hasChildren = node.children && node.children.length > 0
  const access = getAccessLabel(node)

  return (
    <div className='tw-relative'>
      {/* This node's row */}
      <div className='tw-flex tw-items-center tw-justify-between tw-gap-2 tw-py-2 tw-min-h-[36px]'>
        <span
          className={`tw-text-[13px] tw-truncate ${
            node.selected ? 'tw-text-[#1a1a1a]' : 'tw-text-slate-300'
          }`}
        >
          {node.name}
        </span>

        {!hasChildren && access && (
          <span
            className={`tw-text-[11px] tw-font-semibold tw-px-2 tw-py-0.5 tw-rounded-full tw-flex-shrink-0 tw-whitespace-nowrap ${
              access.type === 'count'
                ? 'tw-bg-blue-50 tw-text-[#0140c1] tw-border tw-border-blue-100'
                : access.type === 'full'
                ? 'tw-bg-blue-100 tw-text-[#0140c1] tw-border tw-border-blue-200'
                : 'tw-bg-gray-50 tw-text-gray-500 tw-border tw-border-gray-200'
            }`}
          >
            {access.label}
          </span>
        )}
      </div>

      {/* Children with tree lines */}
      {hasChildren && (
        <div className='tw-relative '>
          {/* Vertical line for this level */}
          <div
            className='tw-absolute tw-left-0 tw-top-0 tw-w-[.5px] tw-bg-[#d0d5dd]'
            style={{ height: 'calc(100% - 20px)' }}
          />

          {node.children.map((child, idx) => {
            const isChildLast = idx === node.children.length - 1
            return (
              <div key={child.id} className='tw-relative'>
                {/* Horizontal connector */}
                <div
                  className='tw-absolute tw-left-0 tw-top-[18px] tw-h-[1px] tw-w-4 tw-bg-[#d0d5dd]'
                />
                {/* Recurse */}
                <div className='tw-pl-5'>
                  <TreeNode
                    node={child}
                    getAccessLabel={getAccessLabel}
                    isLast={isChildLast}
                  />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

const FeatureCard = ({ title, isChecked = false, rawChildren = [] }) => {
  const effectiveChecked =
    isChecked || (rawChildren.length > 0 && rawChildren.every(c => c.selected))

const getAccessLabel = node => {
  if (!node.selected) return null

  const count = Number(node.item_count)

  if (node.item_count != null && count > 0) {
    const raw = node.display_text_2 ?? ''
    const unit = raw.replace(/Enter\s+/i, '').replace(/\s+Count$/i, '').trim() || 'Item'

    // Don't add 's' if unit already ends in 's', 'es', or contains '(s)'
    const alreadyPlural =
      unit.includes('(s)') ||
      unit.toLowerCase().endsWith('s')

    const unitLabel = count === 1 || alreadyPlural ? unit : `${unit}s`

    return { label: `${count} ${unitLabel}`, type: 'count' }
  }
  if (node.display_text_2) {
    return { label: 'Full Access', type: 'full' }
  }
  return { label: 'Included', type: 'included' }
}

  return (
    <div
      className={`tw-border ${
        effectiveChecked ? 'tw-border-blue-100' : 'tw-border-gray-200'
      } tw-rounded-lg tw-overflow-hidden tw-bg-white`}
    >
      {/* Card Header */}
      <div
        className={`${
          effectiveChecked
            ? 'tw-bg-blue-50 tw-border-blue-100'
            : 'tw-bg-gray-50 tw-border-gray-200'
        } tw-px-4 tw-h-[60px] tw-flex tw-items-center tw-gap-4 tw-border-b`}
      >
        <div className='tw-bg-blue-100 tw-px-3 tw-py-3 tw-rounded-[10px] tw-flex tw-items-center tw-justify-center'>
          <i
            className={`${
              FEATURE_ICONS[title] ?? 'icon-Settings'
            } tw-text-blue-700 tw-text-[26px]`}
          />
        </div>
        <span
          className={`tw-text-[14px] tw-font-bold ${
            effectiveChecked ? 'tw-text-[#0a0a0a]' : 'tw-text-slate-400'
          }`}
        >
          {title}
        </span>
      </div>

      {/* Tree Body */}
      <div className='tw-px-4 tw-pt-3 tw-pb-3'>
        {rawChildren.map((child, idx) => (
          <TreeNode
            key={child.id}
            node={child}
            getAccessLabel={getAccessLabel}
            isLast={idx === rawChildren.length - 1}
          />
        ))}
      </div>
    </div>
  )
}

export default PackageManagement
