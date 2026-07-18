import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { showToast } from '../../../genriccomponents/techus-ToastNotification'
import {
  SaveProduct,
  UpdateProduct,
  GetProductDetail,
  GetProductUnitList,
  GetEligibleUnits,
  GetTakeoffCategories,
  GetProductCategories,
  GetSteelCategory,
  GetElementType,
  GetNextProductCode
} from '../../../services/techus-services'
import FullPageLoader from '../../../genriccomponents/loaders/FullPageLoader'
import PageHeader from '../../Common/PageHeader'
import DeleteModal from '../../../genriccomponents/DeleteModal'
import { normalizeLabel } from '../../../utils/textUtils'
import { capitalizeFirstLetter } from '../../../utils/commonUtils'
import FilterDropdown from '../../../genriccomponents/FilterDropdown'
import { TakeoffDropdown } from '../ConAiModule/TakeoffComponents/ToolbarShared'

const EXCLUDED_TRADES = ['general contractor', 'labor', 'labour']
const PRODUCT_TYPES = ['Primary', 'Accessory']

const getDefaultForm = () => ({
  product_code: '',
  product_name: '',
  division_id: '',
  division_name: '',
  section_id: '',
  section_name: '',
  subsection_id: '',
  subsection_name: '',
  product_type: '',
  trade_id: '',
  trade_name: '',
  unit_id: '',
  unit_name: '',
  unit_price: '',
  labour_hours_per_unit: '',
  wastage_percent: '',
  steel_category_id: '',
  steel_category_name: '',
  element_type_ids: [],          
  element_type_names: []         
})

const inputBase =
  'tw-w-full tw-border tw-rounded-lg tw-px-3 tw-py-2.5 tw-text-sm tw-outline-none tw-transition-colors tw-bg-white tw-border-[#cacaca] focus:tw-border-[#0140c1] focus:tw-ring-1 focus:tw-ring-blue-200'
const inputDisabled =
  'tw-w-full tw-border tw-rounded-lg tw-px-3 tw-py-2.5 tw-text-sm tw-outline-none tw-bg-gray-50 tw-border-[#cacaca] tw-text-gray-500 tw-cursor-not-allowed'
const inputError = 'tw-border-red-400 focus:tw-ring-1 focus:tw-ring-red-300'

export default function CreateProduct() {
  const navigate = useNavigate()
  const { id: productUuidFromUrl = null } = useParams()
  const location = useLocation()

  const isAdminPortal = location.pathname.startsWith('/admin')
  const isExisting = Boolean(productUuidFromUrl)
  const backPath = isAdminPortal ? '/admin/products' : '/products'
  const organizationId = !isAdminPortal ? localStorage.getItem('organization_id') : null

  const [form, setForm] = useState(getDefaultForm)
  const [productId, setProductId] = useState(null)
  const [originalValues, setOriginalValues] = useState(null)

  const [allCategories, setAllCategories] = useState([])
  const [units, setUnits] = useState([])
  const [allUnits, setAllUnits] = useState([])
  const [eligibleUnits, setEligibleUnits] = useState([])
  const [allTrades, setAllTrades] = useState([])
  const [steelCategories, setSteelCategories] = useState([])
  const [elementTypes, setElementTypes] = useState([])

  const elementTypeDropRef = useRef(null)
  const [elementTypeDropOpen, setElementTypeDropOpen] = useState(false)

  const [isLoading, setIsLoading] = useState(false)
  const [isPageLoading, setIsPageLoading] = useState(false)
  const [isDropdownsLoading, setIsDropdownsLoading] = useState(true)
  const [errors, setErrors] = useState({})
  const [showUpdateModal, setShowUpdateModal] = useState(false)

  const updateField = (key, value) => setForm(prev => ({ ...prev, [key]: value }))

  // Close element type dropdown on outside click
  useEffect(() => {
    const handler = e => {
      if (elementTypeDropRef.current && !elementTypeDropRef.current.contains(e.target)) {
        setElementTypeDropOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // ── Derived: hierarchy from flat categories list ─────────────────────────────
  const divisions = useMemo(() => allCategories.filter(c => c.level === 1), [allCategories])

  const sections = useMemo(() =>
    allCategories.filter(c => c.level === 2 && c.parent_id === form.division_id),
    [allCategories, form.division_id]
  )

  const subsections = useMemo(() =>
    allCategories.filter(c => c.level === 3 && c.parent_id === form.section_id),
    [allCategories, form.section_id]
  )

  // Selected subsection → eligible trade IDs
  const selectedSubsectionCat = useMemo(() =>
    allCategories.find(c => c.category_id === form.subsection_id),
    [allCategories, form.subsection_id]
  )

  const eligibleTradeIds = useMemo(() =>
    selectedSubsectionCat?.eligible_trades
      ? new Set(selectedSubsectionCat.eligible_trades)
      : null,  // null = no subsection selected → show all trades
    [selectedSubsectionCat]
  )

  // Trade options: all (no subsection) or filtered by eligible_trades — no "All" option in create form
  const tradeOptions = useMemo(() => {
    const base = eligibleTradeIds
      ? allTrades.filter(t => eligibleTradeIds.has(t.takeoff_id))
      : allTrades
    return base.map(t => normalizeLabel(t.takeoff_name))
  }, [allTrades, eligibleTradeIds])

  // Selected trade object
  const selectedTradeObj = useMemo(() =>
    allTrades.find(t => normalizeLabel(t.takeoff_name) === form.trade_name),
    [allTrades, form.trade_name]
  )

  // Show steel category field only when trade is "steel"
  const showSteelFields = useMemo(() => {
    if (!selectedTradeObj) return false
    return (normalizeLabel(selectedTradeObj.takeoff_name) || '').toLowerCase() === 'steel'
  }, [selectedTradeObj])

  // Show element type field when trade is "steel" or "concrete"
  const showElementTypeField = useMemo(() => {
    if (!selectedTradeObj) return false
    const name = (normalizeLabel(selectedTradeObj.takeoff_name) || '').toLowerCase()
    return name === 'steel' || name === 'concrete'
  }, [selectedTradeObj])

  // Clear steel/element when fields hide (create mode only)
  useEffect(() => {
    if (!isExisting) {
      if (!showSteelFields) {
        setForm(prev => ({ ...prev, steel_category_id: '', steel_category_name: '' }))
      }
      if (!showElementTypeField) {
        setForm(prev => ({ ...prev, element_type_ids: [], element_type_names: [] }))
        setElementTypes([])
      }
    }
  }, [showSteelFields, showElementTypeField, isExisting])


  // guard with isExisting so edit mode never re-fetches
  useEffect(() => {
    if (isExisting) return
    if (!showSteelFields) return
    GetSteelCategory()
      .then(res => {
        let d = res?.data || res
        if (typeof d === 'string') d = JSON.parse(d)
        if (d?.valid) setSteelCategories(Array.isArray(d.data) ? d.data : [])
      })
      .catch(() => { })
  }, [showSteelFields, isExisting])

  useEffect(() => {
    if (isExisting) return          // ← loadProduct already handled this
    if (!showElementTypeField || !selectedTradeObj) return
    GetElementType()
      .then(res => {
        let d = res?.data || res
        if (typeof d === 'string') d = JSON.parse(d)
        if (d?.valid) {
          const all = Array.isArray(d.data) ? d.data : []
          setElementTypes(all.filter(e => e.takeoff_id === selectedTradeObj.takeoff_id))
        }
      })
      .catch(() => { })
  }, [showElementTypeField, selectedTradeObj, isExisting])

  // ── Element type multiselect helpers ─────────────────────────────────────────
  const elementTypeDropOptions = useMemo(() =>
    elementTypes.map(e => ({ key: e.element_type_id, label: e.type_name || e.element_type_name || '' })),
    [elementTypes]
  )

  const selectedElementTypeIdsSet = useMemo(() => new Set(form.element_type_ids), [form.element_type_ids])

  const elementTypeTriggerLabel = useMemo(() => {
    if (selectedElementTypeIdsSet.size === 0) return 'Select Element Types'
    if (selectedElementTypeIdsSet.size === 1) {
      const opt = elementTypeDropOptions.find(o => o.key === [...selectedElementTypeIdsSet][0])
      return opt?.label || 'Element Type'
    }
    return `${selectedElementTypeIdsSet.size} Element Types Selected`
  }, [selectedElementTypeIdsSet, elementTypeDropOptions])

  const toggleElementTypeId = key => {
    setForm(prev => {
      const next = prev.element_type_ids.includes(key)
        ? prev.element_type_ids.filter(k => k !== key)
        : [...prev.element_type_ids, key]
      const nextNames = next.map(id => {
        const et = elementTypes.find(e => e.element_type_id === id)
        return et?.type_name || et?.element_type_name || ''
      })
      return { ...prev, element_type_ids: next, element_type_names: nextNames }
    })
  }

  // ── Load all base dropdown data ──────────────────────────────────────────────
  const loadDropdowns = useCallback(async () => {
    setIsDropdownsLoading(true)
    try {
      const promises = [
        GetProductCategories(organizationId ? { organization_id: organizationId } : {}),
        GetTakeoffCategories(organizationId ? { organization_id: organizationId } : {}),
        GetProductUnitList(),
        GetEligibleUnits()
      ]

      const [catRes, tradeRes, unitRes, eligibleRes] = await Promise.all(promises)

      let cd = catRes?.data || catRes
      if (typeof cd === 'string') cd = JSON.parse(cd)
      if (cd?.valid) setAllCategories(Array.isArray(cd.data) ? cd.data : [])

      let td = tradeRes?.data || tradeRes
      if (typeof td === 'string') td = JSON.parse(td)
      if (td?.valid) {
        const filtered = (Array.isArray(td.data) ? td.data : []).filter(
          t => !EXCLUDED_TRADES.includes((normalizeLabel(t.takeoff_name) || '').toLowerCase())
        )
        setAllTrades(filtered)
      }

      let ud = unitRes?.data || unitRes
      if (typeof ud === 'string') ud = JSON.parse(ud)
      if (ud?.valid) {
        const fetchedUnits = Array.isArray(ud.data) ? ud.data : []
        setAllUnits(fetchedUnits)
        if (isExisting) {
          setUnits(fetchedUnits)
        }
      }

      let ed = eligibleRes?.data || eligibleRes
      if (typeof ed === 'string') ed = JSON.parse(ed)
      if (ed?.valid) setEligibleUnits(Array.isArray(ed.data) ? ed.data : [])

    } catch {
      showToast('error', 'Failed to load dropdown data')
    } finally {
      setIsDropdownsLoading(false)
    }
  }, [organizationId, isExisting])

  // ── Load product for edit 
  const loadProduct = useCallback(async uuid => {
    try {
      setIsPageLoading(true)
      const res = await GetProductDetail({ product_uuid: uuid, ...(organizationId && { organization_id: organizationId }) })
      let d = res?.data || res
      if (typeof d === 'string') d = JSON.parse(d)
      if (d?.valid) {
        const p = d.data || d
        const tradeName = (p.trade || '').toLowerCase()
        const isSteel = tradeName === 'steel'
        const isConcrete = tradeName === 'concrete'

        const baseForm = {
          product_code: p.product_code || '',
          product_name: p.product_name || '',
          division_id: p.division_id || '',
          division_name: p.division_name || '',
          section_id: p.section_id || '',
          section_name: p.section_name || '',
          subsection_id: p.subsection_id || '',
          subsection_name: p.subsection_name || '',
          product_type: p.product_type || 'Primary',
          trade_id: p.trade_id || '',
          trade_name: p.trade || '',
          unit_id: p.unit_id || '',
          unit_name: p.unit_name || '',
          unit_price: p.unit_price ?? '',
          labour_hours_per_unit: p.labour_hours_per_unit ?? '',
          wastage_percent: p.wastage_percent ?? '',
          steel_category_id: p.steel_category_id || '',
          steel_category_name: p.steel_category_name || '', 
          element_type_ids: Array.isArray(p.element_type_ids) && p.element_type_ids.length
            ? p.element_type_ids
            : p.element_type_id
              ? [p.element_type_id]
              : [],
          element_type_names: []
        }

        setProductId(p.product_id)

        const sideLoads = []
        if (isSteel) sideLoads.push(GetSteelCategory())
        else sideLoads.push(Promise.resolve(null))
        if (isSteel || isConcrete) sideLoads.push(GetElementType())
        else sideLoads.push(Promise.resolve(null))

        const [steelRes, elemRes] = await Promise.allSettled(sideLoads)

        // steel_category_name from fetched list using steel_category_id
        if (isSteel && steelRes.status === 'fulfilled' && steelRes.value) {
          let sd = steelRes.value?.data || steelRes.value
          if (typeof sd === 'string') sd = JSON.parse(sd)
          if (sd?.valid) {
            const fetchedSteel = Array.isArray(sd.data) ? sd.data : []
            setSteelCategories(fetchedSteel)
            // Always resolve name from fetched list — don't rely solely on p.steel_category_name
            if (baseForm.steel_category_id) {
              const found = fetchedSteel.find(s => s.steel_category_id === baseForm.steel_category_id)
              if (found) baseForm.steel_category_name = found.steel_category_name
            }
          }
        }

        //  FIX 2: Resolve element_type_names from fetched list
        if ((isSteel || isConcrete) && elemRes.status === 'fulfilled' && elemRes.value) {
          let ed = elemRes.value?.data || elemRes.value
          if (typeof ed === 'string') ed = JSON.parse(ed)
          if (ed?.valid) {
            const all = Array.isArray(ed.data) ? ed.data : []
            const fetchedTypes = p.trade_id ? all.filter(e => e.takeoff_id === p.trade_id) : all
            setElementTypes(fetchedTypes)
            baseForm.element_type_names = baseForm.element_type_ids
              .map(id => {
                const found = fetchedTypes.find(e => e.element_type_id === id)
                return found?.type_name || found?.element_type_name || ''
              })
              .filter(Boolean)
          }
        }

        setForm(baseForm)
        setOriginalValues({
          unit_price: baseForm.unit_price,
          labour_hours_per_unit: baseForm.labour_hours_per_unit,
          wastage_percent: baseForm.wastage_percent
        })
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
  }, [backPath, navigate])

  useEffect(() => { loadDropdowns() }, [loadDropdowns])
  useEffect(() => { if (productUuidFromUrl) loadProduct(productUuidFromUrl) }, [productUuidFromUrl, loadProduct])

  // Handle unit filtering locally in frontend when trade_id or product_type changes (create mode only)
  useEffect(() => {
    if (isExisting) return

    // 1. If Product Type is not selected, do not display any units
    if (!form.product_type) {
      setUnits([])
      setForm(prev => ({ ...prev, unit_id: '', unit_name: '' }))
      return
    }

    // 2. If Product Type is Primary, display units only if a trade is selected
    if (form.product_type === 'Primary') {
      if (!form.trade_id) {
        setUnits([])
        setForm(prev => ({ ...prev, unit_id: '', unit_name: '' }))
        return
      }

      // Filter allUnits using eligibleUnits mapping
      const eligibleUnitIds = new Set(
        eligibleUnits
          .filter(mapping => mapping.trade_id === form.trade_id)
          .map(mapping => mapping.unit_id)
      )

      const filteredUnits = allUnits.filter(unit => eligibleUnitIds.has(unit.unit_id))
      setUnits(filteredUnits)

      // Clear selected unit if not in the new eligible list
      if (form.unit_id) {
        const exists = filteredUnits.some(u => u.unit_id === form.unit_id)
        if (!exists) {
          setForm(prev => ({ ...prev, unit_id: '', unit_name: '' }))
        }
      }
    } 
    // 3. Otherwise (Product Type is Accessory) -> Display all units
    else {
      setUnits(allUnits)

      // Clear selected unit if not in the list
      if (form.unit_id) {
        const exists = allUnits.some(u => u.unit_id === form.unit_id)
        if (!exists) {
          setForm(prev => ({ ...prev, unit_id: '', unit_name: '' }))
        }
      }
    }
  }, [form.product_type, form.trade_id, allUnits, eligibleUnits, isExisting])

  // ── Cascade handlers ─────────────────────────────────────────────────────────
  const handleDivisionChange = val => {
    const found = divisions.find(d => d.name === val)
    setForm(prev => ({
      ...prev,
      division_id: found?.category_id || '',
      division_name: val,
      section_id: '', section_name: '',
      subsection_id: '', subsection_name: '',
      product_code: '',
      product_type: '',
      trade_id: '', trade_name: '',
      steel_category_id: '', steel_category_name: '',
      element_type_ids: [], element_type_names: []
    }))
  }

  const handleSectionChange = val => {
    const found = sections.find(s => s.name === val)
    setForm(prev => ({
      ...prev,
      section_id: found?.category_id || '',
      section_name: val,
      subsection_id: '', subsection_name: '',
      product_code: '',
      product_type: '',
      trade_id: '', trade_name: '',
      steel_category_id: '', steel_category_name: '',
      element_type_ids: [], element_type_names: []
    }))
  }

  const handleSubsectionChange = async val => {
    const found = subsections.find(s => s.name === val)
    setForm(prev => ({
      ...prev,
      subsection_id: found?.category_id || '',
      subsection_name: val,
      product_code: '',
      product_type: '',
      trade_id: '', trade_name: '',
      steel_category_id: '', steel_category_name: '',
      element_type_ids: [], element_type_names: []
    }))

    if (found?.category_id) {
      try {
        const res = await GetNextProductCode({
          subsection_id: found.category_id,
          ...(organizationId && { organization_id: organizationId })
        })
        let d = res?.data || res
        if (typeof d === 'string') d = JSON.parse(d)
        if (d?.valid && d?.data?.product_code) {
          setForm(prev => ({ ...prev, product_code: d.data.product_code }))
        }
      } catch (err) {
        console.error('Failed to fetch next product code:', err)
      }
    }
  }

  const handleProductTypeChange = val => {
    setForm(prev => ({
      ...prev,
      product_type: val,
      trade_id: '', trade_name: '',
      steel_category_id: '', steel_category_name: '',
      element_type_ids: [], element_type_names: []
    }))
  }

  const handleTradeChange = val => {
    const found = allTrades.find(t => normalizeLabel(t.takeoff_name) === val)
    setForm(prev => ({
      ...prev,
      trade_id: found?.takeoff_id || '',
      trade_name: val,
      steel_category_id: '', steel_category_name: '',
      element_type_ids: [], element_type_names: []
    }))
  }

  // ── Validation ───────────────────────────────────────────────────────────────
  const validate = () => {
    const err = {}
    if (!String(form.product_name).trim()) err.product_name = 'Product Name is required'
    if (!isExisting) {
      if (!form.division_id) err.division_id = 'Division is required'
      if (!form.section_id) err.section_id = 'Section is required'
      if (!form.subsection_id) err.subsection_id = 'Subsection is required'
      if (!form.product_type) err.product_type = 'Product Type is required'
      if (!form.trade_id) err.trade_id = 'Trade is required'
      if (!form.unit_id) err.unit_id = 'Unit is required'
      if (showSteelFields && !form.steel_category_id) err.steel_category_id = 'Steel Category is required'
      if (showElementTypeField && !form.element_type_ids.length) err.element_type_ids = 'Element Type is required'
    }
    if (!form.wastage_percent.toString().trim()) err.wastage_percent = 'Wastage is required'
    if (!form.unit_price.toString().trim()) err.unit_price = 'Material Cost is required'
    if (!form.labour_hours_per_unit.toString().trim()) err.labour_hours_per_unit = 'Labor Hours/Unit is required'
    setErrors(err)
    return Object.keys(err).length === 0
  }

  const isFormValid = isExisting
    ? Boolean(form.unit_price.toString().trim() && form.labour_hours_per_unit.toString().trim() && form.wastage_percent.toString().trim())
    : Boolean(
        String(form.product_name).trim() &&
        form.division_id &&
        form.section_id &&
        form.subsection_id &&
        form.product_type &&
        form.trade_id &&
        form.unit_id &&
        form.unit_price.toString().trim() &&
        form.labour_hours_per_unit.toString().trim() &&
        form.wastage_percent.toString().trim() &&
        (!showSteelFields || form.steel_category_id) &&
        (!showElementTypeField || form.element_type_ids.length)
      )

  // ── Save ─────────────────────────────────────────────────────────────────────
  const saveProduct = async () => {
    if (!validate()) return
    try {
      setIsLoading(true)
      let res
      if (isExisting) {
        const updatePayload = {
          product_id: productId,
          unit_price: parseFloat(form.unit_price) || 0,
          labour_hours_per_unit: parseFloat(form.labour_hours_per_unit) || 0,
          wastage_percent: form.wastage_percent !== '' ? parseFloat(form.wastage_percent) : null,
          ...(organizationId && { organization_id: organizationId })
        }
        res = await UpdateProduct(updatePayload)
      } else {
        const payload = {
          product_name: form.product_name,
          subsection_id: form.subsection_id || null,
          unit_id: form.unit_id || null,
          product_type: form.product_type || 'Primary',
          unit_price: parseFloat(form.unit_price) || 0,
          labour_hours_per_unit: parseFloat(form.labour_hours_per_unit) || 0
        }
        if (form.wastage_percent !== '') payload.wastage_percent = parseFloat(form.wastage_percent)
        if (form.trade_id) payload.trade_id = form.trade_id
        if (form.steel_category_id) payload.steel_category_id = form.steel_category_id
        if (form.element_type_ids.length) payload.element_type_ids = form.element_type_ids
        if (organizationId) payload.organization_id = organizationId
        res = await SaveProduct(payload)
      }
      let d = res?.data || res
      if (typeof d === 'string') d = JSON.parse(d)
      if (d?.valid) {
        showToast('success', d.message || `Product ${isExisting ? 'updated' : 'saved'} successfully`)
        navigate(backPath)
      } else {
        showToast('error', d?.message || 'Failed to save product')
      }
    } catch (err) {
      showToast('error', err?.response?.data?.message || err?.message || 'Failed to save product')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = () => {
    if (!validate()) return
    if (isExisting) {
      const numOrEmpty = val => {
        if (val === null || val === undefined || val === '') return ''
        const parsed = parseFloat(val)
        return isNaN(parsed) ? '' : parsed
      }
      const hasChanged = originalValues && (
        numOrEmpty(form.unit_price) !== numOrEmpty(originalValues.unit_price) ||
        numOrEmpty(form.labour_hours_per_unit) !== numOrEmpty(originalValues.labour_hours_per_unit) ||
        numOrEmpty(form.wastage_percent) !== numOrEmpty(originalValues.wastage_percent)
      )
      if (hasChanged) {
        setShowUpdateModal(true)
        return
      } else {
        void saveProduct()
        return
      }
    }
    void saveProduct()
  }

  // ── Dropdown option arrays ───────────────────────────────────────────────────
  const divisionOptions = useMemo(() =>
    divisions.map(d => d.name).sort(),
    [divisions]
  )

  const sectionOptions = useMemo(() =>
    sections.map(s => s.name).sort(),
    [sections]
  )

  const subsectionOptions = useMemo(() =>
    subsections.map(s => s.name).sort(),
    [subsections]
  )

  const unitOptions = useMemo(() =>
    units.map(u => u.unit_name),
    [units]
  )

  const steelCategoryOptions = useMemo(() =>
    steelCategories.map(s => s.steel_category_name),
    [steelCategories]
  )

  // In edit mode, show steel section if product has steel_category_name saved
  // Drive edit-mode visibility from trade_name (always set from API response)
  // so steel/element fields display correctly even before names are resolved
  const editTradeName = isExisting ? (form.trade_name || '').toLowerCase() : ''
  const showSteelSectionInEdit = isExisting && editTradeName === 'steel'
  const showElementSectionInEdit = isExisting && (editTradeName === 'steel' || editTradeName === 'concrete')

  // Helper to render read-only value in edit mode (shows "No Value" for empty)
  const readOnlyValue = val => val || 'No Value'

  return (
    <div className='tw-min-h-screen tw-flex tw-flex-col tw-pt-[10px]'>
      {(isPageLoading || isDropdownsLoading) && <FullPageLoader />}

      <PageHeader
        parentTitle='Product Management'
        title={isExisting ? 'Update Product' : 'Add Product'}
        onBack={() => navigate(backPath)}
      />

      <div className='tw-mt-[10px] tw-p-[25px] tw-rounded-[15px] tw-border tw-border-[#e0e0e0] tw-bg-[#fff] tw-shadow-[0px_4px_3px_0px_rgba(0,0,0,0.05)]'>
        <div className='tw-flex tw-flex-col tw-gap-5'>

          {/* Product Name & ID */}
          <div className='tw-grid tw-grid-cols-3 tw-gap-5'>
            <div>
              <label className='tw-block tw-text-[14px] tw-text-[#3b3b3b] tw-mb-2'>Product Name <span className="tw-text-red-500">*</span></label>
              {isExisting ? (
                <input
                  readOnly
                  value={capitalizeFirstLetter(form.product_name)}
                  className={inputDisabled}
                />
              ) : (
                <input
                  value={capitalizeFirstLetter(form.product_name)}
                  onChange={e => updateField('product_name', e.target.value)}
                  placeholder='Enter Product Name'
                  maxLength={150}
                  className={`${inputBase} ${errors.product_name ? inputError : ''}`}
                />
              )}
              {!isExisting && errors.product_name && <p className='tw-text-red-500 tw-text-xs tw-mt-1'>{errors.product_name}</p>}
            </div>
            <div>
              <label className='tw-block tw-text-[14px] tw-text-[#3b3b3b] tw-mb-2'>Product ID</label>
              <input
                readOnly
                value={form.product_code || '—'}
                className={inputDisabled}
              />
            </div>
            <div />
          </div>

          {/* Division / Section / Subsection */}
          <div className='tw-grid tw-grid-cols-3 tw-gap-5'>
            <div>
              <label className='tw-block tw-text-[14px] tw-text-[#3b3b3b] tw-mb-2'>Division <span className="tw-text-red-500">*</span></label>
              {isExisting
                ? <input readOnly value={readOnlyValue(form.division_name)} className={inputDisabled} />
                : <FilterDropdown
                  options={divisionOptions}
                  value={form.division_name || ''}
                  placeholder='Select a Division'
                  width='tw-w-full tw-h-10'
                  onChange={handleDivisionChange}
                />
              }
              {errors.division_id && <p className='tw-text-red-500 tw-text-xs tw-mt-1'>{errors.division_id}</p>}
            </div>
            <div>
              <label className='tw-block tw-text-[14px] tw-text-[#3b3b3b] tw-mb-2'>Section <span className="tw-text-red-500">*</span></label>
              {isExisting
                ? <input readOnly value={readOnlyValue(form.section_name)} className={inputDisabled} />
                : <FilterDropdown
                  options={sectionOptions}
                  value={form.section_name || ''}
                  placeholder='Select a Section'
                  width='tw-w-full tw-h-10'
                  onChange={handleSectionChange}
                  disabled={!form.division_id}
                />
              }
              {errors.section_id && <p className='tw-text-red-500 tw-text-xs tw-mt-1'>{errors.section_id}</p>}
            </div>
            <div>
              <label className='tw-block tw-text-[14px] tw-text-[#3b3b3b] tw-mb-2'>Subsection <span className="tw-text-red-500">*</span></label>
              {isExisting
                ? <input readOnly value={readOnlyValue(form.subsection_name)} className={inputDisabled} />
                : <FilterDropdown
                  options={subsectionOptions}
                  value={form.subsection_name || ''}
                  placeholder='Select a Subsection'
                  width='tw-w-full tw-h-10'
                  onChange={handleSubsectionChange}
                  disabled={!form.section_id}
                />
              }
              {errors.subsection_id && <p className='tw-text-red-500 tw-text-xs tw-mt-1'>{errors.subsection_id}</p>}
            </div>
          </div>

          {/* Product Type / Trade / Unit — same row */}
          <div className='tw-grid tw-grid-cols-3 tw-gap-5'>
            <div>
              <label className='tw-block tw-text-[14px] tw-text-[#3b3b3b] tw-mb-2'>Product Type <span className="tw-text-red-500">*</span></label>
              {isExisting
                ? <input readOnly value={readOnlyValue(form.product_type)} className={inputDisabled} />
                : <FilterDropdown
                  options={PRODUCT_TYPES}
                  value={form.product_type || ''}
                  placeholder='Select a Product Type'
                  width='tw-w-full tw-h-10'
                  onChange={handleProductTypeChange}
                  disabled={!form.subsection_id}
                />
              }
              {errors.product_type && <p className='tw-text-red-500 tw-text-xs tw-mt-1'>{errors.product_type}</p>}
            </div>
            <div>
              <label className='tw-block tw-text-[14px] tw-text-[#3b3b3b] tw-mb-2'>Trade <span className="tw-text-red-500">*</span></label>
              {isExisting
                ? <input readOnly value={readOnlyValue(form.trade_name)} className={inputDisabled} />
                : <FilterDropdown
                  options={tradeOptions}
                  value={form.trade_name || ''}
                  placeholder='Select a Trade'
                  width='tw-w-full tw-h-10'
                  onChange={handleTradeChange}
                  disabled={!form.product_type}
                />
              }
              {errors.trade_id && <p className='tw-text-red-500 tw-text-xs tw-mt-1'>{errors.trade_id}</p>}
            </div>
            <div>
              <label className='tw-block tw-text-[14px] tw-text-[#3b3b3b] tw-mb-2'>Unit <span className="tw-text-red-500">*</span></label>
              {isExisting
                ? <input readOnly value={readOnlyValue(form.unit_name)} className={inputDisabled} />
                : <FilterDropdown
                  options={unitOptions}
                  value={form.unit_name || ''}
                  placeholder='Select a Unit'
                  width='tw-w-full tw-h-10'
                  onChange={val => {
                    const u = units.find(u => u.unit_name === val)
                    setForm(prev => ({ ...prev, unit_id: u?.unit_id || '', unit_name: val }))
                  }}
                />
              }
              {errors.unit_id && <p className='tw-text-red-500 tw-text-xs tw-mt-1'>{errors.unit_id}</p>}
            </div>
          </div>

          {/* Steel Category + Element Type — same row, conditional */}
          {(showSteelFields || showSteelSectionInEdit || showElementTypeField || showElementSectionInEdit) && (
            <div className='tw-grid tw-grid-cols-3 tw-gap-5'>

              {/* Steel Category — only for steel trade */}
              {(showSteelFields || showSteelSectionInEdit) && (
                <div>
                  <label className='tw-block tw-text-[14px] tw-text-[#3b3b3b] tw-mb-2'>Steel Category <span className="tw-text-red-500">*</span></label>
                  {isExisting
                    ? <input readOnly value={readOnlyValue(form.steel_category_name)} className={inputDisabled} />
                    : <FilterDropdown
                      options={steelCategoryOptions}
                      value={form.steel_category_name || ''}
                      placeholder='Select a Steel Category'
                      width='tw-w-full tw-h-10'
                      onChange={val => {
                        const s = steelCategories.find(s => s.steel_category_name === val)
                        setForm(prev => ({
                          ...prev,
                          steel_category_id: s?.steel_category_id || '',
                          steel_category_name: val
                        }))
                      }}
                    />
                  }
                  {errors.steel_category_id && <p className='tw-text-red-500 tw-text-xs tw-mt-1'>{errors.steel_category_id}</p>}
                </div>
              )}

              {/* Element Type — for steel or concrete trade */}
              {(showElementTypeField || showElementSectionInEdit) && (
                <div>
                  <label className='tw-block tw-text-[14px] tw-text-[#3b3b3b] tw-mb-2'>Element Type <span className="tw-text-red-500">*</span></label>
                  {isExisting
                    ? <input
                      readOnly
                      value={form.element_type_names.length ? form.element_type_names.join(', ') : 'No Value'}
                      className={inputDisabled}
                    />
                    : <TakeoffDropdown
                      dropRef={elementTypeDropRef}
                      dropOpen={elementTypeDropOpen}
                      onDropOpen={() => setElementTypeDropOpen(p => !p)}
                      dropOptions={elementTypeDropOptions}
                      selected={selectedElementTypeIdsSet}
                      toggleItem={toggleElementTypeId}
                      triggerLabel={elementTypeTriggerLabel}
                    />
                  }
                  {errors.element_type_ids && <p className='tw-text-red-500 tw-text-xs tw-mt-1'>{errors.element_type_ids}</p>}
                </div>
              )}

            </div>
          )}

          {/* Material Cost / Labor Hours / Wastage */}
          <div className='tw-grid tw-grid-cols-3 tw-gap-5'>
            <div>
              <label className='tw-block tw-text-[14px] tw-text-[#3b3b3b] tw-mb-2'>Material Cost ($) <span className="tw-text-red-500">*</span></label>
              <input
                type='number'
                min='0'
                step='any'
                value={form.unit_price}
                onChange={e => {
                  const val = e.target.value
                  if (val === '' || /^\d*\.?\d{0,2}$/.test(val)) {
                    updateField('unit_price', val)
                  }
                }}
                onKeyDown={e => e.key === '-' && e.preventDefault()}
                onPaste={e => { if (e.clipboardData.getData('text').includes('-')) e.preventDefault() }}
                placeholder='0.00'
                className={`${inputBase} ${errors.unit_price ? inputError : ''}`}
              />
              {errors.unit_price && <p className='tw-text-red-500 tw-text-xs tw-mt-1'>{errors.unit_price}</p>}
            </div>
            <div>
              <label className='tw-block tw-text-[14px] tw-text-[#3b3b3b] tw-mb-2'>Labor Hours/Unit <span className="tw-text-red-500">*</span></label>
              <input
                type='number'
                min='0'
                step='any'
                value={form.labour_hours_per_unit}
                onChange={e => {
                  const val = e.target.value
                  if (val === '' || /^\d*\.?\d{0,3}$/.test(val)) {
                    updateField('labour_hours_per_unit', val)
                  }
                }}
                onKeyDown={e => e.key === '-' && e.preventDefault()}
                onPaste={e => { if (e.clipboardData.getData('text').includes('-')) e.preventDefault() }}
                placeholder='0.000'
                className={`${inputBase} ${errors.labour_hours_per_unit ? inputError : ''}`}
              />
              {errors.labour_hours_per_unit && <p className='tw-text-red-500 tw-text-xs tw-mt-1'>{errors.labour_hours_per_unit}</p>}
            </div>
            <div>
              <label className='tw-block tw-text-[14px] tw-text-[#3b3b3b] tw-mb-2'>Wastage (%) <span className="tw-text-red-500">*</span></label>
              <input
                type='number'
                min='0'
                step='any'
                value={form.wastage_percent}
                onChange={e => {
                  const val = e.target.value
                  if (val === '' || /^\d*\.?\d{0,2}$/.test(val)) {
                    updateField('wastage_percent', val)
                  }
                }}
                onKeyDown={e => e.key === '-' && e.preventDefault()}
                onPaste={e => { if (e.clipboardData.getData('text').includes('-')) e.preventDefault() }}
                placeholder='0'
                className={`${inputBase} ${errors.wastage_percent ? inputError : ''}`}
              />
              {errors.wastage_percent && <p className='tw-text-red-500 tw-text-xs tw-mt-1'>{errors.wastage_percent}</p>}
            </div>
          </div>

        </div>
      </div>

      {/* Footer */}
      <div className='tw-flex tw-justify-end tw-gap-2 tw-mt-[20px] tw-mb-4'>
        <div
          className='tw-text-[#1e293b] tw-bg-[#dedede] tw-cursor-pointer tw-items-center tw-justify-center tw-flex tw-w-[114px] tw-py-[10px] tw-rounded-[5px] tw-border tw-border-transparent hover:tw-border-[#5e6c80] tw-transition-all tw-duration-300 tw-text-[16px]'
          onClick={() => navigate(backPath)}
        >
          <span className='px-3'>Cancel</span>
        </div>
        <button
          disabled={isLoading || !isFormValid}
          onClick={handleSave}
          className={`tw-text-white tw-w-[216px] tw-relative py-[10px] tw-rounded-[5px]
            ${isLoading || !isFormValid
              ? 'tw-bg-[#f0f0f0] !tw-text-[#a0a0a0] tw-border tw-cursor-not-allowed'
              : 'tw-bg-[#0140c1] tw-isolation-auto tw-z-10 before:tw-absolute before:tw-w-full before:tw-transition-all before:tw-duration-700 before:hover:tw-w-full before:-tw-right-full before:hover:tw-right-0 before:tw-rounded-full before:tw-bg-[#506adf] before:-tw-z-10 before:tw-aspect-square before:hover:tw-scale-150 tw-overflow-hidden before:hover:tw-duration-700'
            }`}
        >
          {isLoading ? 'Saving...' : isExisting ? 'Update Product' : 'Save Product'}
        </button>
      </div>

      {showUpdateModal && (
        <DeleteModal
          action='update'
          entity='product'
          icon='icon-Products'
          onClose={() => setShowUpdateModal(false)}
          onConfirm={() => { setShowUpdateModal(false); void saveProduct() }}
        />
      )}
    </div>
  )
}