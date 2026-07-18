import React, { useState, useEffect } from 'react'
import {
  ShieldCheck,
  Edit2,
  Trash2
} from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  GetOneOrganization,
  GetPackageList,
  GetOnePackage
} from '../../../services/techus-services'
import Loader from '../../Common/ApiCallLoader'

import { DeleteOrganizationData } from '../../../services/techus-services'
import { showToast } from '../../../genriccomponents/techus-ToastNotification'
import { formatDateTime, formatDollarCompact } from '../../../utils/commonUtils'
import FullPageLoader from '../../../genriccomponents/loaders/FullPageLoader'
import DeleteModal from '../../../genriccomponents/DeleteModal'
import PackageDetailsModal from '../Packages/PackageDetailsModal'
import { useSelector } from 'react-redux'

const OrganizationDashboard = () => {
  const [organizationData, setOrganizationData] = useState(null)
  const navigate = useNavigate()
  const [loading, setLoading] = React.useState(true);
  const [updateModalOpen, setUpdateModalOpen] = useState(false);
const permissionsList = useSelector((s) => s?.auth?.user?.[0]?.permission_info) || {};
const permissions = permissionsList?.organization_management || {};
    

  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [showPackagePopup, setShowPackagePopup] = useState(false)
  const [packageDetails, setPackageDetails] = useState(null)
  const [packageLoading, setPackageLoading] = useState(false)
  const { id } = useParams()
  // const organization_uuid = queryParams.get('id')
  const organization_uuid = id
  const goBack = () => {
    navigate('/admin/organizations')
  }
  const formatUSPhone = phone => {
    if (!phone) return '-'

    const digits = phone.replace(/\D/g, '')

    if (digits.length === 10) {
      return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`
    }

    if (digits.length === 11 && digits.startsWith('1')) {
      return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(
        7
      )}`
    }

    return phone
  }
  const fetchOrganization = async () => {
    try {
      setLoading(true)

      const payload = {
        organization_uuid: organization_uuid
      }

      const response = await GetOneOrganization(payload)

      if (response?.valid) {
        setOrganizationData(response.data)
      }
    } catch (error) {
      console.error('Failed to fetch organization', error)
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => {
    if (organization_uuid) {
      fetchOrganization()
    }
  }, [organization_uuid])
const handleUpdateConfirm = () => {
  if (!permissions?.edit) return;  
  // setUpdateModalOpen(false);
  navigate(`/admin/organizations/update/${organization_uuid}`);
};

const handleUpdateCancel = () => {
  setUpdateModalOpen(false);
};

  const handleViewPackageDetails = async () => {
  if (!organizationData?.package_id) return

  //  Open modal immediately — shimmer shows while loading
  setShowPackagePopup(true)
  setPackageLoading(true)

  try {
    const listResponse = await GetPackageList()
    const parsed =
      typeof listResponse === 'string' ? JSON.parse(listResponse) : listResponse

    const matchedPackage = parsed?.data?.find(
      pkg => pkg.package_id === organizationData.package_id
    )

    if (!matchedPackage?.package_uuid) {
      showToast('error', 'Package not found')
      setShowPackagePopup(false) // close if error
      return
    }

    const detailResponse = await GetOnePackage({
      package_uuid: matchedPackage.package_uuid
    })

    const detailParsed =
      typeof detailResponse === 'string'
        ? JSON.parse(detailResponse)
        : detailResponse

    if (detailParsed?.valid) {
      setPackageDetails(detailParsed.data)
    } else {
      showToast('error', 'Package details not found')
      setShowPackagePopup(false)
    }
  } catch (error) {
    console.error(error)
    showToast('error', 'Failed to fetch package details')
    setShowPackagePopup(false)
  } finally {
    setPackageLoading(false)
  }
}

  const handleDeleteOrganization = async () => {
    try {
       if (!permissions?.delete) return;
      setDeleteModalOpen(false)
      setDeleteLoading(true)

      const response = await DeleteOrganizationData(organization_uuid)

      if (response?.valid) {
        showToast('success', 'Organization deleted successfully')
        navigate('/admin/organizations')
      } else {
        showToast('error', response?.message || 'Delete failed')
      }
    } catch (error) {
      console.error(error)
      showToast('error', 'Something went wrong')
    } finally {
      setDeleteLoading(false)
    }
  }



 if (loading) {
    return <Loader />;
  }

  const amount = organizationData?.subscription_actual_amount || 0
  const billingLabel = organizationData?.subscription_applies_to || ''

  const totalPricing = `${formatDollarCompact(amount)} ${billingLabel}`
  const discountedPrice = `${
    organizationData?.subscription_discounted_amount
      ? formatDollarCompact(organizationData?.subscription_discounted_amount)
      : formatDollarCompact(organizationData?.subscription_actual_amount)
  } ${billingLabel}`

  return (
    <div className='tw-min-h-screen  tw-text-slate-900'>
      {loading && <FullPageLoader />}
      <div className='tw-flex tw-items-center tw-gap-4 tw-mb-6'>
        <button
          onClick={goBack}
          className='tw-flex tw-items-center tw-justify-center tw-w-10 tw-h-10 tw-bg-[#cbd5e1] tw-rounded-lg hover:tw-bg-[#0140c1] tw-transition-colors tw-duration-200'
        >
          <i className='icon-Previous tw-text-white tw-text-lg'></i>
        </button>

        <div className='tw-flex tw-flex-col tw-justify-center'>
          <div className='tw-text-[#535353] tw-text-[14px] tw-font-normal'>
            Organizations /
          </div>
          <h1 className='tw-text-gray-900 tw-text-[20px] tw-font-bold tw-leading-tight'>
            View Organization
          </h1>
        </div>
      </div>

      <div className='tw-grid tw-grid-cols-12 tw-gap-6'>
        {/* Left Column - Main Details */}
        <div className='tw-col-span-8 tw-space-y-6'>
          {/* Basic Details Card */}
          <div className='tw-bg-white tw-rounded-xl tw-border tw-border-gray-100 tw-p-6 tw-shadow-sm'>
            <div className='tw-flex tw-items-center tw-gap-2 tw-mb-6'>
              <ShieldCheck className='tw-w-5 tw-h-5 tw-text-blue-500' />
              <h2 className='tw-font-bold tw-text-slate-800'>Basic Details</h2>
            </div>

            <div className='tw-grid tw-grid-cols-2 tw-gap-y-6'>
              <DetailItem
                label='Organization Name'
                value={organizationData?.organization_name || '-'}
              />
              <DetailItem
                label='Organization ID'
                value={organizationData?.display_organization_id || '-'}
              />

              <DetailItem
                label='Industry'
                value={organizationData?.industry_name || '-'}
              />
              <DetailItem
                label='Company Size'
                value={organizationData?.company_size_name || '-'}
              />

              <div className='tw-flex tw-flex-col tw-gap-1'>
                <label className='tw-text-xs tw-text-slate-500'>Status</label>
                <span
                  className={`tw-w-[86px] tw-h-[28px] tw-inline-flex tw-items-center tw-gap-2 tw-rounded-full tw-px-2 tw-py-1 tw-text-[12px] tw-font-[600] tw-border ${
                    organizationData?.status === 1
                      ? ' tw-text-[#17803d] tw-border-[#c1f9d5] tw-bg-[#f1fdf4]'
                      : 'tw-text-[#b91c1b] tw-border-[#fecaca] tw-bg-[#fef3f2]'
                  }`}
                >
                  <i
                    className={`${
                      organizationData?.status === 1
                        ? 'icon-Project-Details'
                        : 'icon-Failed'
                    } tw-font-bold  tw-text-[14px] ${
                      organizationData?.status === 1
                        ? 'tw-text-[#17803d]'
                        : 'tw-text-[#c11717]'
                    }`}
                  />
                  { organizationData?.status === 1?'Active':'Inactive'}
                </span>
              </div>
              <DetailItem
                label='Created Date'
                value={
                  organizationData?.organization_created_date
                    ? formatDateTime(
                        organizationData?.organization_created_date
                      )
                    : '-'
                }
              />
              <DetailItem
                label='Location'
                value={organizationData?.address || '-'}
              />

              <DetailItem
                label='Website'
                value={
                  <a
                    className='tw-text-blue-600 hover:tw-underline'
                    href={organizationData?.website_url}
                    target='_blank'
                    rel='noopener'
                  >
                    {' '}
                    {organizationData?.website_url || '-'}
                  </a>
                }
              />
            </div>
          </div>

          {/* Contact Details Card */}
          <div className='tw-bg-white tw-rounded-xl tw-border tw-border-gray-100 tw-p-6 tw-shadow-sm'>
            <h2 className='tw-font-bold tw-text-slate-800 tw-mb-6'>
              Admin Details
            </h2>
            <div className='tw-grid tw-grid-cols-2 tw-gap-y-6'>
              <DetailItem
                label='First Name'
                value={organizationData?.first_name || '-'}
              />
              <DetailItem
                label='Last Name'
                value={organizationData?.last_name || '-'}
              />

              {/* <DetailItem
                label='Primary Contact'
                value={organizationData?.first_name}
              /> */}
              <DetailItem
                label='Email Address'
                value={organizationData?.email_id || '-'}
              />
              <DetailItem
                label='Phone Number'
                value={` ${
                  organizationData?.mobile_number
                    ? '+1' +
                      ' ' +
                      formatUSPhone(organizationData?.mobile_number)
                    : '-'
                }`}
              />
            </div>
          </div>

          {/* Subscription & Billing Card */}
          <div className='tw-bg-white tw-rounded-xl tw-border tw-border-gray-100 tw-p-6 tw-shadow-sm'>
            <div className='tw-flex tw-items-center tw-gap-2 tw-mb-6'>
              {/* <div className='tw-w-5 tw-h-5 tw-rounded-full tw-border-2 tw-border-blue-500 tw-flex tw-items-center tw-justify-center'> */}
                <span className='icon-What-happen tw-text-blue-500 tw-text-[20px] tw-font-bold'>
                  
                </span>
              {/* </div> */}
              <h2 className='tw-font-bold tw-text-slate-800'>
                Subscription & Billing
              </h2>
            </div>

            <div className='tw-grid tw-grid-cols-2 tw-gap-y-6'>
              <div className='tw-flex tw-flex-col tw-gap-1'>
                <span className='tw-text-xs tw-text-slate-500'>
                  {' '}
                  {organizationData?.package_name || '-'}
                </span>
                <span
                  onClick={handleViewPackageDetails}
                  className='tw-text-blue-500 tw-text-xs tw-underline tw-cursor-pointer tw-ml-1'
                >
                  View Package Detail
                </span>
              </div>
              <DetailItem
                label='Subscription Status'
                value={
                  organizationData?.subscription_status === 1
                    ? 'Active'
                    : 'Inactive'
                }
              />
              <DetailItem label='Package Price' value={totalPricing} />
              {/* <DetailItem label="Organization Discount" value="15% (Enterprise)" /> */}
              <DetailItem
                label='Total Pricing'
                value={discountedPrice}
                isBold
              />
              <DetailItem
                label='Billing Cycle'
                value={organizationData?.subscription_applies_to || '-'}
              />
              <DetailItem
                label='Start Date'
                value={
                  organizationData?.subscription_start_date
                    ? formatDateTime(organizationData?.subscription_start_date)
                    : '-'
                }
              />

              <DetailItem
                label='Expiry Date'
                value={
                  organizationData?.subscription_end_date
                    ? formatDateTime(organizationData?.subscription_end_date)
                    : '-'
                }
              />
            </div>
          </div>
        </div>

        {/* Right Column - Actions & Status */}
        <div className='tw-col-span-4 tw-space-y-6'>
          {/* Actions Card */}
          {(permissions?.edit || permissions?.delete)?<div className='tw-bg-white tw-rounded-xl tw-border tw-border-gray-100 tw-p-6 tw-shadow-sm'>
            <h2 className='tw-font-bold tw-text-slate-800 tw-mb-4'>Actions</h2>
            <div className='tw-space-y-3'>
              {permissions?.edit?<ActionButton
                className='tw-w-full tw-flex tw-items-center tw-justify-center tw-gap-2 tw-py-2.5 tw-px-4 tw-rounded-lg tw-bg-red-50 tw-font-medium tw-text-sm tw-transition-colors'
                icon={<Edit2 className='tw-w-4 tw-h-4' />}
                label='Edit Organization'
                onClick={handleUpdateConfirm}
              />:null}
              {/* <ActionButton icon={<Power className="tw-w-4 tw-h-4" />} label="Activate/Deactivate" /> */}
              {permissions?.delete?<button
                onClick={() => setDeleteModalOpen(true)}
                className='tw-w-full tw-flex tw-items-center tw-justify-center tw-gap-2 tw-py-2.5 tw-px-4 tw-rounded-lg tw-bg-red-50 tw-text-red-600 tw-font-medium tw-text-sm tw-transition-colors hover:tw-bg-red-100'
              >
                <Trash2 className='tw-w-4 tw-h-4' />
                Delete Organization
              </button>:null}
            </div>
          </div>:null}

          {/* Audit Trail Card */}
          <div className='tw-bg-white tw-rounded-xl tw-border tw-border-gray-100 tw-p-6 tw-shadow-sm'>
            <h2 className='tw-font-bold tw-text-slate-800 tw-mb-4'>
              Audit Trail
            </h2>
            <div className='tw-space-y-4'>
              <DetailItem
                label='Last Changed By'
                value={
                  organizationData?.updated_by_name
                    ? organizationData?.updated_by_name
                    : '-'
                }
              />
              <p className='tw-text-xs tw-text-slate-400'>
                {organizationData?.organization_updated_date
                  ? formatDateTime(organizationData?.organization_updated_date)
                  : '-'}
              </p>
            </div>
          </div>
        </div>
      </div>
      {deleteModalOpen && (
        <DeleteModal
          action='delete'
          entity='organization'
          icon='icon-Organization'
          status={organizationData?.status === 1 ? 'Active' : 'Inactive'}
          subscriptionCount={organizationData?.project_count ?? 0}
          onClose={() => setDeleteModalOpen(false)}
          onConfirm={handleDeleteOrganization}
        />
      )}
{updateModalOpen && (
  <DeleteModal
    action="update"
    entity="organization"
    icon="icon-Organization"
    onClose={handleUpdateCancel}
    onConfirm={handleUpdateConfirm}
  />
)}
{showPackagePopup && (
  <PackageDetailsModal
    packageData={packageDetails}
    isLoading={packageLoading}
    onClose={() => setShowPackagePopup(false)}
  />
)}
    </div>
  )
}

/* Reusable Components for consistency */
const DetailItem = ({ label, value, isLink = false, isBold = false }) => (
  <div className='tw-flex tw-flex-col tw-gap-1'>
    <span className='tw-text-xs tw-text-slate-500'>{label}</span>
    <span
      className={`tw-text-sm ${isBold ? 'tw-font-bold' : 'tw-font-normal'} ${
        isLink
          ? 'tw-text-blue-600 tw-underline tw-cursor-pointer'
          : 'tw-text-slate-800'
      }`}
    >
      {value}
    </span>
  </div>
)

const ActionButton = ({ icon, label, onClick }) => (
  <button
    onClick={onClick}
    className='tw-w-full tw-flex tw-items-center tw-justify-center tw-gap-2 tw-py-2.5 tw-px-4 tw-rounded-lg tw-border tw-border-gray-200 tw-text-slate-700 tw-font-medium tw-text-sm tw-transition-all hover:tw-bg-gray-50'
  >
    {icon}
    {label}
  </button>
)

export default OrganizationDashboard
