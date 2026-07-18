import React, { useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { showToast } from '../../../genriccomponents/techus-ToastNotification'
import { LaborWorkerDetail, LaborWorkerDelete } from '../../../services/techus-services'
import FullPageLoader from '../../../genriccomponents/loaders/FullPageLoader'
import PageHeader from '../../Common/PageHeader'
import DeleteModal from '../../../genriccomponents/DeleteModal'
import { normalizeLabel } from '../../../utils/textUtils'

const displayValue = value => {
  if (value === null || value === undefined || value === '') return '—'
  return value
}

const formatWage = value => {
  if (value === null || value === undefined || value === '') return '—'
  const num = Number(value)
  if (Number.isNaN(num)) return value
  return num % 1 === 0 ? String(num) : String(parseFloat(num.toFixed(2)))
}

export default function ViewMember () {
  const navigate = useNavigate()
  const { id: memberId } = useParams()
  const location = useLocation()
  const permissionsList = useSelector(s => s?.auth?.user?.[0]?.permission_info) || {}
  const permissions = permissionsList?.labor_cost || {}

  const isAdminPortal = location.pathname.startsWith('/admin')
  const backPath = isAdminPortal ? '/admin/labor/member' : '/labor/member'
  const updatePath = isAdminPortal
    ? `/admin/labor/member/update/${memberId}`
    : `/labor/member/update/${memberId}`

  const [member, setMember] = useState(null)
  const [isPageLoading, setIsPageLoading] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  useEffect(() => {
    if (memberId) loadMember(memberId)
  }, [memberId])

  const loadMember = async id => {
    try {
      setIsPageLoading(true)
      const res = await LaborWorkerDetail({ worker_uuid: id, ...(organizationId && { organization_id: organizationId }) })
      let d = res?.data || res
      if (typeof d === 'string') d = JSON.parse(d)
      if (d?.valid) {
        setMember(d.data || d)
      } else {
        showToast('error', d?.message || 'Member not found')
        navigate(backPath)
      }
    } catch {
      showToast('error', 'Failed to load member')
      navigate(backPath)
    } finally {
      setIsPageLoading(false)
    }
  }

  const handleDeleteConfirm = async () => {
    try {
      const workerId = member?.worker_id ?? memberId
      const res = await LaborWorkerDelete({ worker_id: workerId, ...(organizationId && { organization_id: organizationId }) })
      let d = res?.data || res
      if (typeof d === 'string') d = JSON.parse(d)
      if (d?.valid) {
        showToast('success', d.message || 'Member deleted successfully')
        navigate(backPath)
      } else {
        showToast('error', d?.message || 'Failed to delete member')
        setShowDeleteModal(false)
      }
    } catch {
      showToast('error', 'Failed to delete member')
      setShowDeleteModal(false)
    }
  }

  const organizationId = !isAdminPortal ? localStorage.getItem('organization_id') : null

  const showEdit = !!permissions?.edit
  const showDelete = !!permissions?.delete

  return (
    <div className='tw-min-h-screen'>
      {isPageLoading && <FullPageLoader />}

      {/* Header row */}
      <div className='tw-px-1 tw-pt-5 tw-pb-4 tw-flex tw-items-center tw-justify-between'>
        <PageHeader
          parentTitle='Labor'
          title='View Member'
          onBack={() => navigate(backPath)}
        />

        {(showEdit || showDelete) && (
          <div className='tw-flex tw-gap-2'>
            {showEdit && (
              <button
                onClick={() => navigate(updatePath)}
                className='tw-px-5 tw-py-2 tw-bg-[#0140c1] tw-text-sm tw-text-white tw-font-semibold tw-rounded-[5px] tw-transition-colors hover:tw-bg-blue-700'
              >
                Edit Member
              </button>
            )}
            {showDelete && (
              <button
                onClick={() => setShowDeleteModal(true)}
                className='tw-px-5 tw-py-2 tw-bg-white tw-border tw-border-[#e0e0e0] tw-text-sm tw-font-medium tw-rounded-[5px] tw-transition-colors tw-text-gray-700 hover:tw-bg-gray-50'
              >
                Delete
              </button>
            )}
          </div>
        )}
      </div>

      {/* Detail card */}
      <div className='tw-px-1 tw-pb-6'>
        <div className='tw-bg-white tw-rounded-xl tw-border tw-border-gray-100 tw-shadow-md tw-p-6 tw-max-w-xl'>
          <div className='tw-grid tw-grid-cols-2 tw-gap-x-12 tw-gap-y-8 tw-pb-4'>

            <div>
              <p className='tw-text-[14px] tw-font-semibold tw-text-[#6a7282] tw-mb-2'>
                Member Name
              </p>
              <p className='tw-text-[16px] tw-text-[#101828]'>
                {displayValue(member?.worker_name)}
              </p>
            </div>

            <div>
              <p className='tw-text-[14px] tw-font-semibold tw-text-[#6a7282] tw-mb-2'>
                Code
              </p>
              <p className='tw-text-[16px] tw-text-[#101828]'>
                {displayValue(member?.code)}
              </p>
            </div>

            <div className='tw-col-span-2'>
              <p className='tw-text-[14px] tw-font-semibold tw-text-[#6a7282] tw-mb-2'>
                Trade
              </p>
              <p className='tw-text-[16px] tw-text-[#101828]'>
                {member?.trade_names
                  ? member.trade_names.split(',').map(t => normalizeLabel(t.trim())).filter(Boolean).join(', ')
                  : '—'
                }
              </p>
            </div>

            <div>
              <p className='tw-text-[14px] tw-font-semibold tw-text-[#6a7282] tw-mb-2'>
                Wage ($/hour)
              </p>
              <p className='tw-text-[16px] tw-text-[#101828]'>
                {formatWage(member?.cost_per_hour)}
              </p>
            </div>

          </div>
        </div>
      </div>

      {showDeleteModal && (
        <DeleteModal
          action='delete'
          entity='member'
          icon='icon-Delete-memeber'
          onClose={() => setShowDeleteModal(false)}
          onConfirm={handleDeleteConfirm}
        />
      )}
    </div>
  )
}
