import React, { useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { showToast } from '../../../genriccomponents/techus-ToastNotification'
import {
  // GetOrgProductList,
  GetProductList
} from '../../../services/techus-services'
import FullPageLoader from '../../../genriccomponents/loaders/FullPageLoader'
import PageHeader from '../../Common/PageHeader'
import { normalizeLabel } from '../../../utils/textUtils'

const LABOR_ACTION = 'labor'

const displayValue = value => {
  if (value === null || value === undefined || value === '') return '-'
  return value
}

const formatCurrency = value => {
  if (value === null || value === undefined || value === '') return '-'

  const numericValue = Number(value)
  if (Number.isNaN(numericValue)) return value

  return `$${numericValue.toFixed(2)}`
}

export default function ViewLaborCost() {
  const navigate = useNavigate()
  const { id: productId } = useParams()
  const location = useLocation()
  const permissionsList =
    useSelector(s => s?.auth?.user?.[0]?.permission_info) || {}
  const permissions = permissionsList?.product_management || {}

  const [laborCost, setLaborCost] = useState(null)
  const [isPageLoading, setIsPageLoading] = useState(false)

  const isAdminPortal = location.pathname.startsWith('/admin')
  const backPath = isAdminPortal ? '/admin/labor-cost' : '/labor-cost'
  const updatePath = isAdminPortal
    ? `/admin/labor-cost/update/${productId}`
    : `/labor-cost/update/${productId}`

  useEffect(() => {
    if (productId) loadLaborCost(productId)
  }, [productId])

  const loadLaborCost = async id => {
    try {
      setIsPageLoading(true)

      let res
      if (isAdminPortal) {
        res = await GetProductList({
          action: LABOR_ACTION,
          search: '',
          sort_column: 'created_at',
          sort_order: 'asc',
          limit: 1000,
          offset: 0
        })
      } else {
        const org_id = localStorage.getItem('organization_id')
        res = await GetOrgProductList({
          action: LABOR_ACTION,
          search: '',
          sort_column: 'created_at',
          sort_order: 'asc',
          limit: 1000,
          offset: 0,
          organization_id: org_id
        })
      }

      let d = res?.data || res
      if (typeof d === 'string') d = JSON.parse(d)

      if (d?.valid) {
        const list = Array.isArray(d.data) ? d.data : []
        const found = list.find(item => String(item.product_uuid) === String(id))

        if (found) {
          setLaborCost(found)
        } else {
          showToast('error', 'Labor cost not found')
          navigate(backPath)
        }
      } else {
        showToast('error', d?.message || 'Failed to load labor cost')
      }
    } catch (err) {
      console.error('Error loading labor cost:', err)
      showToast('error', 'Failed to load labor cost')
    } finally {
      setIsPageLoading(false)
    }
  }

  return (
    <div className='tw-min-h-screen '>
      {isPageLoading && <FullPageLoader />}

      <div className='tw-px-1 tw-pt-5 tw-pb-4 tw-flex tw-items-center tw-justify-between'>
        <PageHeader
          parentTitle='Labor Cost'
          title='View Labor Cost'
          onBack={() => navigate(backPath)}
        />

        {(permissions?.edit || permissions?.delete) && (
          <div className='tw-flex tw-gap-2'>
            {permissions?.edit && (
              <button
                onClick={() => navigate(updatePath)}
                className='tw-px-5 tw-py-2 tw-bg-blue-700 tw-text-white tw-text-sm tw-font-semibold tw-rounded-lg tw-transition-colors disabled:tw-opacity-50 disabled:tw-cursor-not-allowed'
              >
                Edit Labor Cost
              </button>
            )}
            {permissions?.delete && (
              <button
                disabled
                className='tw-px-5 tw-py-2 tw-bg-white tw-border tw-border-gray-300 tw-text-sm tw-font-medium tw-text-gray-700 tw-rounded-lg tw-transition-colors disabled:tw-opacity-50 disabled:tw-cursor-not-allowed'
              >
                Delete
              </button>
            )}
          </div>
        )}
      </div>

      <div className='tw-px-1 tw-pb-6'>
        <div className='tw-bg-white tw-rounded-xl tw-border tw-border-gray-100 tw-shadow-md tw-p-6'>
          <div className='tw-flex tw-flex-col tw-gap-5'>
            <div>
              <p className='tw-text-[12px] tw-tracking-wider tw-font-semibold tw-text-[#89909c] tw-uppercase tw-mb-2'>
                Labor Cost Name
              </p>
              <p className='tw-text-sm tw-text-gray-800'>
                {displayValue(laborCost?.product_name)}
              </p>
            </div>

            <div>
              <p className='tw-text-[12px] tw-tracking-wider tw-font-semibold tw-text-[#89909c] tw-uppercase tw-mb-2'>
                Trade
              </p>
              <p className='tw-text-sm tw-text-gray-800'>
                {laborCost?.takeoff_name
                  ? normalizeLabel(laborCost.takeoff_name)
                  : '-'}
              </p>
            </div>

            <div>
              <p className='tw-text-[12px] tw-tracking-wider tw-font-semibold tw-text-[#89909c] tw-uppercase tw-mb-2'>
                Cost
              </p>
              <p className='tw-text-sm tw-text-gray-800'>
                {formatCurrency(laborCost?.unit_cost)}
              </p>
            </div>
          </div>
        </div>

      </div>

    </div>
  )
}
