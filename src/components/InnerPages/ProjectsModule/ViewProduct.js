import React, { useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { showToast } from '../../../genriccomponents/techus-ToastNotification'
import { GetProductDetail, DeleteProduct, GetSteelCategory, GetElementType } from '../../../services/techus-services'
import FullPageLoader from '../../../genriccomponents/loaders/FullPageLoader'
import PageHeader from '../../Common/PageHeader'
import DeleteModal from '../../../genriccomponents/DeleteModal'

const display = val => {
  if (val === null || val === undefined || val === '') return '—'
  const n = Number(val)
  if (!isNaN(n) && val !== '') return n % 1 === 0 ? String(n) : String(parseFloat(n.toFixed(10)))
  return val
}

const Field = ({ label, value }) => (
  <div>
    <p className='tw-text-[14px] tw-font-medium tw-text-[#6a7282] tw-mb-1'>{label}</p>
    <p className='tw-text-[14px] tw-text-[#101828]'>{display(value)}</p>
  </div>
)

export default function ViewProduct() {
  const navigate = useNavigate()
  const { id: productUuid } = useParams()
  const location = useLocation()
  const permissionsList = useSelector(s => s?.auth?.user?.[0]?.permission_info) || {}
  const permissions = permissionsList?.products || {}

  const isAdminPortal = location.pathname.startsWith('/admin')
  const backPath = isAdminPortal ? '/admin/products' : '/products'
  const updatePath = isAdminPortal ? `/admin/products/update/${productUuid}` : `/products/update/${productUuid}`
  const organizationId = !isAdminPortal ? localStorage.getItem('organization_id') : null

  const [product, setProduct] = useState(null)
  const [resolvedSteelCategoryName, setResolvedSteelCategoryName] = useState('')
  const [resolvedElementTypeNames, setResolvedElementTypeNames] = useState('')
  const [isPageLoading, setIsPageLoading] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  useEffect(() => {
    if (productUuid) loadProduct(productUuid)
  }, [productUuid])

  const loadProduct = async uuid => {
    try {
      setIsPageLoading(true)
      const res = await GetProductDetail({ product_uuid: uuid, ...(organizationId && { organization_id: organizationId }) })
      let d = res?.data || res
      if (typeof d === 'string') d = JSON.parse(d)
      if (d?.valid) {
        const p = d.data || d
        setProduct(p)

        const tradeName = (p.trade || '').trim().toLowerCase()
        const isSteel = tradeName === 'steel'
        const isConcrete = tradeName === 'concrete'

        // ── Side-load steel category + element types exactly like CreateProduct does ──
        const sideLoads = []
        if (isSteel) sideLoads.push(GetSteelCategory())
        else sideLoads.push(Promise.resolve(null))

        if ((isSteel || isConcrete) && p.trade_id) sideLoads.push(GetElementType({ takeoff_id: p.trade_id }))
        else sideLoads.push(Promise.resolve(null))

        const [steelRes, elemRes] = await Promise.allSettled(sideLoads)

        // Resolve steel_category_name from fetched list using steel_category_id
        if (isSteel && steelRes.status === 'fulfilled' && steelRes.value) {
          let sd = steelRes.value?.data || steelRes.value
          if (typeof sd === 'string') sd = JSON.parse(sd)
          if (sd?.valid) {
            const fetchedSteel = Array.isArray(sd.data) ? sd.data : []
            const found = fetchedSteel.find(s => s.steel_category_id === p.steel_category_id)
            setResolvedSteelCategoryName(found?.steel_category_name || p.steel_category_name || '')
          }
        }

        // Resolve element_type_names from fetched list using element_type_ids
        if ((isSteel || isConcrete) && elemRes.status === 'fulfilled' && elemRes.value) {
          let ed = elemRes.value?.data || elemRes.value
          if (typeof ed === 'string') ed = JSON.parse(ed)
          if (ed?.valid) {
            const fetchedTypes = Array.isArray(ed.data) ? ed.data : []
            const ids = Array.isArray(p.element_type_ids) && p.element_type_ids.length
              ? p.element_type_ids
              : p.element_type_id
                ? [p.element_type_id]
                : []
            const names = ids
              .map(id => {
                const found = fetchedTypes.find(e => e.element_type_id === id)
                return found?.type_name || found?.element_type_name || ''
              })
              .filter(Boolean)
              .join(', ')
            setResolvedElementTypeNames(names)
          }
        }

      } else {
        showToast('error', d?.message || 'Product not found')
        navigate(backPath)
      }
    } catch {
      showToast('error', 'Failed to load product')
      navigate(backPath)
    } finally {
      setIsPageLoading(false)
    }
  }

  const handleDeleteConfirm = async () => {
    try {
      setIsPageLoading(true)
      const res = await DeleteProduct(product?.product_id, organizationId ? { organization_id: organizationId } : {})
      let d = res?.data || res
      if (typeof d === 'string') d = JSON.parse(d)
      if (d?.valid) {
        showToast('success', d.message || 'Product deleted successfully')
        navigate(backPath)
      } else {
        showToast('error', d?.message || 'Failed to delete product')
        setShowDeleteModal(false)
      }
    } catch {
      showToast('error', 'Failed to delete product')
      setShowDeleteModal(false)
    } finally {
      setIsPageLoading(false)
    }
  }

  const showEdit = isAdminPortal ? true : permissions?.edit
  const showDelete = product?.created_by != null

  const tradeName = (product?.trade || '').trim().toLowerCase()
  const isSteel = tradeName === 'steel'
  const isConcrete = tradeName === 'concrete'
  const showSteelCategory = isSteel
  const showElementType = isSteel || isConcrete

  return (
    <div className='tw-min-h-screen'>
      {isPageLoading && <FullPageLoader />}

      <div className='tw-px-1 tw-pt-5 tw-pb-4 tw-flex tw-items-center tw-justify-between'>
        <PageHeader
          parentTitle='Product Management'
          title='View Product'
          onBack={() => navigate(backPath)}
        />
        {(showEdit || showDelete) && (
          <div className='tw-flex tw-gap-2'>
            {showEdit && (
              <button
                onClick={() => navigate(updatePath)}
                className='tw-px-5 tw-py-2 tw-bg-[#0140c1] tw-text-sm tw-text-white tw-font-[500] tw-rounded-[5px] tw-transition-colors hover:tw-bg-blue-700'
              >
                Edit Product
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

      <div className='tw-px-1 tw-pb-6'>
        <div className='tw-bg-white tw-rounded-xl tw-border tw-border-gray-100 tw-shadow-md tw-p-6'>

          {/* Product Name & ID */}
          <div className='tw-grid tw-grid-cols-3 tw-gap-6 tw-mb-6'>
            <Field label='Product Name' value={product?.product_name} />
            <Field label='Product ID' value={product?.product_code} />
            <div />
          </div>

          {/* Division / Section / Subsection */}
          <div className='tw-grid tw-grid-cols-3 tw-gap-6 tw-mb-6'>
            <Field label='Division' value={product?.division_name} />
            <Field label='Section' value={product?.section_name} />
            <Field label='Subsection' value={product?.subsection_name} />
          </div>


          {/* Product Type / Trade / Unit */}
          <div className='tw-grid tw-grid-cols-3 tw-gap-6 tw-mb-6'>
            <Field label='Product Type' value={product?.product_type} />
            <Field label='Trade' value={product?.trade} />
            <Field label='Unit' value={product?.unit_name} />
          </div>

          {/* Steel Category + Element Type — conditional on trade */}
          {(showSteelCategory || showElementType) && (
            <>
              <div className='tw-grid tw-grid-cols-3 tw-gap-6 tw-mb-6'>
                {showSteelCategory && (
                  <Field label='Steel Category' value={resolvedSteelCategoryName} />
                )}
                {showElementType && (
                  <Field label='Element Type' value={resolvedElementTypeNames} />
                )}
              </div>
            </>
          )}


          {/* Material Cost / Labor Hours / Wastage */}
          <div className='tw-grid tw-grid-cols-3 tw-gap-6'>
            <Field label='Material Cost' value={product?.unit_price != null ? `$${display(product.unit_price)}` : '—'} />
            <Field label='Labor Hour/Unit' value={product?.labour_hours_per_unit} />
            <Field label='Wastage (%)' value={product?.wastage_percent} />
          </div>

        </div>
      </div>

      {showDeleteModal && (
        <DeleteModal
          action='delete'
          entity='product'
          icon='icon-Products'
          onClose={() => setShowDeleteModal(false)}
          onConfirm={handleDeleteConfirm}
        />
      )}
    </div>
  )
}