import React, { useEffect, useState } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import DropDown from '../../../genriccomponents/FormDropDown'
import { showToast } from '../../../genriccomponents/techus-ToastNotification'
import {
  SaveProduct,
  GetProductList,
  // GetProductUnits,
  // GetOrgProductList,
  GetTakeoffCategories,
  // SaveOrgProduct,
  UpdateProduct,
  // UpdateOrgProduct
} from '../../../services/techus-services'
import FullPageLoader from '../../../genriccomponents/loaders/FullPageLoader'
import PageHeader from '../../Common/PageHeader'
import { capitalizeFirstLetter } from '../../../utils/commonUtils'
import { normalizeLabel } from '../../../utils/textUtils'
import DeleteModal from '../../../genriccomponents/DeleteModal'

const LABOR_ACTION = 'labor'
const EXCLUDED_TRADES = ['general contractor', 'labor', 'labour']
const getDefaultFormState = () => ({
  name: '',
  takeoff_id: '',
  length_ft: '',
  width_ft: '',
  thickness_mm: '',
  diameter_mm: '',
  unit_id: '',
  unit_cost: '',
  category: ''
})

const getComparableForm = values => ({
  name: String(values?.name ?? '').trim(),
  takeoff_id: String(values?.takeoff_id ?? '').trim(),
  length_ft: values?.length_ft ?? '',
  width_ft: values?.width_ft ?? '',
  thickness_mm: values?.thickness_mm ?? '',
  diameter_mm: values?.diameter_mm ?? '',
  unit_id: String(values?.unit_id ?? '').trim(),
  unit_cost: String(values?.unit_cost ?? '').trim(),
  category: String(values?.category ?? '').trim()
})

export default function CreateLaborCost() {
  const navigate = useNavigate()
  const { id: productIdFromUrl = null } = useParams()

  const location = useLocation()
  const isAdminPortal = location.pathname.startsWith('/admin')
  const isViewMode = new URLSearchParams(location.search).get('mode') === 'view'
  const isExistingLaborCost = Boolean(productIdFromUrl)
  const isTradeDisabled = isViewMode || isExistingLaborCost

  const [form, setForm] = useState(getDefaultFormState)
  const [initialForm, setInitialForm] = useState(null)
  const [unitResponseData, setUnitResponseData] = useState([])
  const [takeOffData, setTakeOffData] = useState({ takeoff_id: [] })
  const [takeOffResponseData, setTakeOffResponseData] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [isPageLoading, setIsPageLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const [isFormValid, setIsFormValid] = useState(false)
  const [showUpdateModal, setShowUpdateModal] = useState(false)
  const hasFormChanged =
    isExistingLaborCost &&
    initialForm !== null &&
    JSON.stringify(getComparableForm(form)) !==
      JSON.stringify(getComparableForm(initialForm))

  const updateField = (key, value) =>
    setForm(prev => ({ ...prev, [key]: value }))
const handleNameChange = value => {
  const trimmedStart = value.trimStart()
  updateField('name', trimmedStart)
}
  const handleCostChange = value => {
    if (value === '' || Number(value) >= 0) {
      updateField('unit_cost', value)
    }
  }
  const preventNegativeInput = event => {
    if (event.key === '-' || event.key === 'Subtract') {
      event.preventDefault()
    }
  }
  const normalizeOptionValue = value => String(value ?? '').trim().toLowerCase()
  const handleTakeoffChange = value => {
    setForm(prev => ({ ...prev, takeoff_id: value, category: value }))
    setErrors(prev => ({ ...prev, takeoff_id: '' }))
  }

  const validate = () => {
    const err = {}
    if (!form.name.trim()) err.name = 'Labor Cost Name is required'
    if (!form.takeoff_id.trim()) err.takeoff_id = 'Trade is required'
    if (!form.unit_cost.toString().trim()) err.unit_cost = 'Unit Cost is required'
    else if (Number(form.unit_cost) < 0) err.unit_cost = 'Unit Cost cannot be negative'
    setErrors(err)
    return Object.keys(err).length === 0
  }

  const getTakeoffId = value => {
    const normalizedValue = normalizeOptionValue(value)
    if (!normalizedValue) return ''

    const found = takeOffResponseData.find(item => {
      const takeoffId = normalizeOptionValue(item.takeoff_id)
      const takeoffName = normalizeOptionValue(
        normalizeLabel(item.takeoff_name)
      )

      return takeoffId === normalizedValue || takeoffName === normalizedValue
    })

    return found?.takeoff_id || ''
  }

  const getUnitId = value => {
    const normalizedValue = normalizeOptionValue(value)
    if (!normalizedValue) return ''

    const found = unitResponseData.find(item => {
      const unitId = normalizeOptionValue(item.unit_id)
      const unitName = normalizeOptionValue(item.unit_name)

      return unitId === normalizedValue || unitName === normalizedValue
    })

    return found?.unit_id || ''
  }

  const getDefaultUnitValue = () => {
    const preferredUnit =
      unitResponseData.find(item =>
        ['ea', 'each'].includes(normalizeOptionValue(item.unit_name))
      ) || unitResponseData[0]

    return preferredUnit?.unit_name || preferredUnit?.unit_id || ''
  }

  const HandleTakeOffCategories = async () => {
    try {
      const res = await GetTakeoffCategories()
      let d = res?.data || res
      if (typeof d === 'string') d = JSON.parse(d)

      if (d?.valid) {
        const filteredTakeoffData = (Array.isArray(d.data) ? d.data : []).filter(
          item =>
            !EXCLUDED_TRADES.includes(
              normalizeOptionValue(normalizeLabel(item.takeoff_name))
            )
        )

        setTakeOffResponseData(filteredTakeoffData)
        setTakeOffData({
          takeoff_id: filteredTakeoffData.length
            ? filteredTakeoffData.map(u => normalizeLabel(u.takeoff_name))
            : []
        })
      } else {
        showToast('error', d?.message)
      }
    } catch (err) {
      console.error('Error fetching takeoff categories:', err)
      showToast('error', 'Failed to fetch takeoff categories')
    }
  }

  useEffect(() => {
    loadDropdownData()
    HandleTakeOffCategories()
  }, [])

  useEffect(() => {
    if (productIdFromUrl) loadLaborCostForEdit(productIdFromUrl)
  }, [productIdFromUrl])

  useEffect(() => {
    if (form.unit_id.trim() || unitResponseData.length === 0) return

    const defaultUnitValue = getDefaultUnitValue()
    if (defaultUnitValue) {
      setForm(prev => ({ ...prev, unit_id: defaultUnitValue }))
    }
  }, [form.unit_id, unitResponseData])

  useEffect(() => {
    setIsFormValid(
      Boolean(
        form.name.trim() &&
        form.takeoff_id.trim() &&
        form.unit_cost.toString().trim() &&
        (form.unit_id.trim() || unitResponseData.length > 0)
      )
    )
  }, [form.name, form.takeoff_id, form.unit_cost, form.unit_id, unitResponseData])

  const loadDropdownData = async () => {
    try {
      const res = await GetProductUnits()
      let d = res?.data || res
      if (typeof d === 'string') d = JSON.parse(d)

      if (d?.valid) {
        setUnitResponseData(d.data)
      } else {
        showToast('error', d?.message || 'Failed to fetch units')
      }
    } catch (err) {
      console.error('Error fetching units:', err)
      showToast('error', 'Failed to fetch units')
    }
  }

  const loadLaborCostForEdit = async productId => {
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
        const product = list.find(
          p => String(p.product_uuid) === String(productId)
        )

        if (product) {
          const loadedForm = {
            name: product.product_name || '',
            takeoff_id: product.takeoff_name
              ? normalizeLabel(product.takeoff_name)
              : '',
            category: product.takeoff_name
              ? normalizeLabel(product.takeoff_name)
              : '',
            length_ft: product.length_ft === '' ? null : product.length_ft,
            width_ft: product.width_ft === '' ? null : product.width_ft,
            thickness_mm: product.thickness_mm === '' ? null : product.thickness_mm,
            diameter_mm: product.diameter_mm === '' ? null : product.diameter_mm,
            unit_id: product.unit_name || product.unit_id || '',
            unit_cost: product.unit_cost ?? ''
          }

          setForm(loadedForm)
          setInitialForm(loadedForm)
        } else {
          showToast('error', 'Labor cost not found')
          navigate(`${isAdminPortal ? '/admin/labor-cost' : '/labor-cost'}`)
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

  const saveLaborCost = async () => {
    if (!validate()) return
    try {
      const takeoffId = getTakeoffId(form.takeoff_id)
      const resolvedUnitValue = form.unit_id || getDefaultUnitValue()
      const unitId = getUnitId(resolvedUnitValue)
      const category = form.category || form.takeoff_id || ''

      if (!takeoffId) {
        showToast('error', 'Please select a valid TakeOff Category')
        return
      }

      if (!unitId) {
        showToast('error', 'Unable to determine a valid unit')
        return
      }

      setIsLoading(true)
      const productData = {
        action: LABOR_ACTION,
        product_id: productIdFromUrl || null,
        takeoff_id: takeoffId,
        product_name: form.name,
        category,
        unit_id: unitId,
        unit_cost: form.unit_cost,
        length_ft: form.length_ft || null,
        width_ft: form.width_ft || null,
        thickness_mm: form.thickness_mm || null,
        diameter_mm: form.diameter_mm || null
      }

      let res
      if (isAdminPortal) {
        if (!productIdFromUrl) {
          res = await SaveProduct(productData)
        } else {
          res = await UpdateProduct(productData)
        }
      } else {
        const org_id = localStorage.getItem('organization_id')
        productData.org_id = org_id
        if (!productIdFromUrl) {
          res = await SaveOrgProduct(productData)
        } else {
          res = await UpdateOrgProduct(productData)
        }
      }

      let d = res?.data || res
      if (typeof d === 'string') d = JSON.parse(d)

      if (d?.valid) {
        showToast('success', d.message || 'Labor cost saved successfully')
        navigate(`${isAdminPortal ? '/admin/labor-cost' : '/labor-cost'}`)
      } else {
        showToast('error', d?.message || 'Failed to save labor cost')
      }
    } catch (err) {
      if (err.response?.status === 500) {
        showToast(
          'error',
          'Labor cost with this name already exists. Please use a different name.'
        )
      } else {
        showToast(
          'error',
          err.response?.data?.message || err.message || 'Failed to save labor cost'
        )
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = () => {
    if (!validate()) return

    if (isExistingLaborCost) {
      if (hasFormChanged) {
        setShowUpdateModal(true)
        return
      }

      void saveLaborCost()
      return
    }

    void saveLaborCost()
  }

  const handleUpdateConfirm = () => {
    setShowUpdateModal(false)
    void saveLaborCost()
  }

  const handleUpdateCancel = () => {
    setShowUpdateModal(false)
  }

  void isViewMode

  return (
    <div className='tw-min-h-screen tw-flex tw-flex-col tw-pt-[10px]'>
      {isPageLoading && <FullPageLoader />}

      <PageHeader
        parentTitle='Labor Cost'
        title={`${productIdFromUrl ? 'Update' : 'Add'} Labor Cost`}
        onBack={() =>
          navigate(`${isAdminPortal ? '/admin/labor-cost' : '/labor-cost'}`)
        }
      />

      <div
        className='tw-mt-[10px] tw-p-[25px] tw-rounded-[15px] tw-shadow-[0px_4px_3px_0px_rgba(0,0,0,0.05)]
  tw-border tw-border-[#e0e0e0] tw-bg-[#fff]'
      >
        {/* BASIC INFORMATION */}
        <section>
          <h2 className='tw-text-[16px] tw-font-bold tw-text-[#101828] tw-mb-2'>
            Basic Information
          </h2>
          <div className='tw-flex tw-gap-[45px] tw-items-start'>
            <div>
              <label className='tw-block tw-text-[14px] tw-text-[#3b3b3b] tw-mb-2'>
                Labor Cost Name <span className="tw-text-red-500">*</span>
              </label>
      <input
  disabled={isExistingLaborCost}
  value={capitalizeFirstLetter(form.name)}
  onChange={e => handleNameChange(e.target.value)}
  onBlur={e => updateField('name', e.target.value.trim())}
  placeholder='Enter Labor Cost Name'
                maxLength={150}
                style={
                  isExistingLaborCost
                    ? { WebkitTextFillColor: '#000000' }
                    : undefined
                }
                className={`tw-w-[325px] tw-border tw-rounded-lg tw-px-3 tw-py-2.5 tw-text-sm tw-outline-none tw-transition-colors
                    ${isExistingLaborCost
                    ? 'tw-cursor-not-allowed !tw-bg-[#f0f0f0] !tw-text-black !tw-opacity-100'
                    : 'tw-bg-white'
                  }
                    ${errors.name
                    ? 'tw-border-red-400 focus:tw-ring-1 focus:tw-ring-red-300'
                    : 'tw-border-[#cacaca] focus:tw-border-[#0140c1] focus:tw-ring-1 focus:tw-ring-blue-200'
                  }
                  `}
              />
              <p className='tw-text-[12px] tw-text-[#6a7282] tw-mt-1'>
                {form.name.length}/150 characters (min. 3)
              </p>
              {errors.name && (
                <p className='tw-text-red-500 tw-text-xs'>{errors.name}</p>
              )}
            </div>

            <div className='tw-w-[325px]'>
              <label className='tw-block tw-text-[14px] tw-text-[#3b3b3b] tw-mb-2'>
                Trade <span className="tw-text-red-500">*</span>
              </label>
               <DropDown
                 options={takeOffData.takeoff_id}
                 value={form.takeoff_id}
                 placeholder='Select Trade'
                 onChange={handleTakeoffChange}
                 disabled={isTradeDisabled}
                 isViewMode={isViewMode}
               />
              {errors.takeoff_id && (
                <p className='tw-text-red-500 tw-text-xs tw-mt-1'>
                  {errors.takeoff_id}
                </p>
              )}
            </div>
          </div>
        </section>
        {/* PRICING */}
        <section>
          <h2 className='tw-text-sm tw-font-bold tw-text-gray-900 tw-mb-2 tw-mt-4'>
            Pricing
          </h2>
          <div className='tw-flex'>
            <div>
              <label className='tw-block tw-text-[14px] tw-text-[#3b3b3b] tw-mb-2'>
                Cost <span className="tw-text-red-500">*</span>
              </label>
              <div
                className={`tw-flex tw-w-[325px] tw-items-center tw-border tw-rounded-lg tw-overflow-hidden tw-bg-white
                  ${errors.unit_cost
                    ? 'tw-border-red-400'
                    : 'tw-border-gray-300 focus-within:tw-border-blue-500 focus-within:tw-ring-1 focus-within:tw-ring-blue-200'
                  }
                `}
              >
                <span className='tw-px-3 tw-text-gray-500 tw-text-sm tw-py-2.5'>
                  $
                </span>
                <input
                  type='number'
                  min='0'
                  value={form.unit_cost}
                  onChange={e => handleCostChange(e.target.value)}
                  onKeyDown={preventNegativeInput}
                  placeholder='Enter Cost'
                  className='tw-w-[325px] tw-flex-1 tw-px-3 tw-py-2.5 tw-text-sm tw-outline-none tw-bg-transparent tw-text-gray-800'
                />
              </div>
              {errors.unit_cost && (
                <p className='tw-text-red-500 tw-text-xs tw-mt-1'>
                  {errors.unit_cost}
                </p>
              )}
            </div>
          </div>
        </section>
      </div>

      {/* FOOTER BUTTONS */}
      <div className='tw-flex tw-justify-end tw-gap-2 tw-mt-[20px] tw-mb-4'>
        <div
          className='tw-text-[#1e293b] tw-bg-[#dedede] tw-cursor-pointer tw-items-center tw-justify-center tw-flex tw-w-[114px] tw-py-[10px]
          tw-rounded-[5px] tw-border tw-border-transparent hover:tw-border-[#5e6c80] tw-transition-all tw-duration-300 tw-text-[16px]'
          onClick={() =>
            navigate(`${isAdminPortal ? '/admin/labor-cost' : '/labor-cost'}`)
          }
        >
          <span className='px-3'>Cancel</span>
        </div>
        <button
          disabled={isLoading || !isFormValid}
          className={`tw-text-white tw-w-[216px] tw-relative py-[10px] tw-rounded-[5px]
${isLoading || !isFormValid
              ? 'tw-bg-[#f0f0f0] !tw-text-[#a0a0a0] tw-border tw-cursor-not-allowed'
              : 'tw-bg-[#0140c1] tw-isolation-auto tw-z-10 before:tw-absolute before:tw-w-full before:tw-transition-all before:tw-duration-700 before:hover:tw-w-full before:-tw-right-full before:hover:tw-right-0 before:tw-rounded-full before:tw-bg-[#506adf] before:-tw-z-10 before:tw-aspect-square before:hover:tw-scale-150 tw-overflow-hidden before:hover:tw-duration-700'
            }`}
          onClick={handleSave}
        >
          {isLoading
            ? 'Saving...'
            : productIdFromUrl
              ? 'Update Labor Cost'
              : 'Save Labor Cost'}
        </button>
      </div>

      {showUpdateModal && (
        <DeleteModal
          action='update'
          entity='labor cost'
          icon='icon-Products'
          onClose={handleUpdateCancel}
          onConfirm={handleUpdateConfirm}
        />
      )}
    </div>
  )
}
