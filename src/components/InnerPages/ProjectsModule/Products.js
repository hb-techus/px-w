import React, { useEffect, useState, useMemo, useCallback } from 'react'
import { Plus } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import CustomDataTable from '../../../genriccomponents/ReactTable'
import FullPageLoader from '../../../genriccomponents/loaders/FullPageLoader'
import { ShimmerTable } from 'react-shimmer-effects'
import { showToast } from '../../../genriccomponents/techus-ToastNotification'
import NoDataFound from '../../../genriccomponents/NoDataFound'
import {
  GetProductList,
  DeleteProduct,
  GetProductCategories,
  GetProductUnitList
} from '../../../services/techus-services'
import ActionMenu from '../../../genriccomponents/ActionMenu'
import TextWithTooltip from '../../Common/ToolTip'
import { useSelector } from 'react-redux'
import FilterDropdown from '../../../genriccomponents/FilterDropdown'
import DeleteModal from '../../../genriccomponents/DeleteModal'

const ITEMS_PER_PAGE = 10

const fmtCost = val => {
  if (val === null || val === undefined || val === '') return '—'
  const n = parseFloat(val)
  if (isNaN(n)) return '—'
  return `$${Number.isInteger(n) ? n : parseFloat(n.toFixed(2))}`
}

const fmtNum = val => {
  if (val === null || val === undefined || val === '') return '—'
  const n = parseFloat(val)
  if (isNaN(n)) return '—'
  return Number.isInteger(n) ? String(n) : String(parseFloat(n.toFixed(3)))
}

export default function ProductsTable() {
  const navigate = useNavigate()
  const location = useLocation()
  const permissionsList = useSelector(s => s?.auth?.user?.[0]?.permission_info) || {}
  const permissions = permissionsList?.products || {}
  const isAdminPortal = location.pathname.startsWith('/admin')
  const showAddProductButton = isAdminPortal ? true : permissions?.create
  const isAddProductDisabled = false;//!isAdminPortal

  const organizationId = !isAdminPortal ? localStorage.getItem('organization_id') : null

  const [products, setProducts] = useState([])
  const [allCategories, setAllCategories] = useState([])
  const [search, setSearch] = useState('')
  const [selectedDivision, setSelectedDivision] = useState('All Divisions')
  const [selectedSection, setSelectedSection] = useState('All Sections')
  const [selectedSubsection, setSelectedSubsection] = useState('All Subsections')
  const [selectedTrade, setSelectedTrade] = useState('All Trades')
  const [unitMap, setUnitMap] = useState({})
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [isPageLoading, setIsPageLoading] = useState(false)
  const [isTableLoading, setIsTableLoading] = useState(true)

  const getProducts = useCallback(async () => {
    try {
      setIsTableLoading(true)
      const res = await GetProductList({ search: '', sort_column: 'created_at', sort_order: 'asc', limit: 2000, offset: 0, ...(organizationId && { organization_id: organizationId }) })
      let d = res?.data || res
      if (typeof d === 'string') d = JSON.parse(d)
      if (d?.valid) {
        setProducts(Array.isArray(d.data) ? d.data : [])
      } else {
        showToast('error', d?.message || 'Failed to fetch products')
        setProducts([])
      }
    } catch {
      showToast('error', 'Failed to fetch products')
      setProducts([])
    } finally {
      setIsTableLoading(false)
    }
  }, [])
  useEffect(() => {
    getProducts()
    GetProductCategories(organizationId ? { organization_id: organizationId } : {})
      .then(res => {
        let d = res?.data || res
        if (typeof d === 'string') d = JSON.parse(d)
        if (d?.valid) setAllCategories(Array.isArray(d.data) ? d.data : [])
      })
      .catch(() => {})
    GetProductUnitList()
      .then(res => {
        let d = res?.data || res
        if (typeof d === 'string') d = JSON.parse(d)
        if (d?.valid) {
          const map = {}
          ;(Array.isArray(d.data) ? d.data : []).forEach(u => { map[u.unit_id] = u.unit_name })
          setUnitMap(map)
        }
      })
      .catch(() => {})
  }, [getProducts])

  // ── Filter option lists from categories API ──────────────────────────────────
  const divisionCategories = useMemo(() => allCategories.filter(c => c.level === 1), [allCategories])

  const selectedDivisionCat = useMemo(() =>
    divisionCategories.find(d => d.name === selectedDivision),
    [divisionCategories, selectedDivision]
  )

  const sectionCategories = useMemo(() => {
    if (!selectedDivisionCat) return allCategories.filter(c => c.level === 2)
    return allCategories.filter(c => c.level === 2 && c.parent_id === selectedDivisionCat.category_id)
  }, [allCategories, selectedDivisionCat])

  const selectedSectionCat = useMemo(() =>
    sectionCategories.find(s => s.name === selectedSection),
    [sectionCategories, selectedSection]
  )

  const subsectionCategories = useMemo(() => {
    if (!selectedSectionCat) {
      if (!selectedDivisionCat) return allCategories.filter(c => c.level === 3)
      const sectionIds = new Set(sectionCategories.map(s => s.category_id))
      return allCategories.filter(c => c.level === 3 && sectionIds.has(c.parent_id))
    }
    return allCategories.filter(c => c.level === 3 && c.parent_id === selectedSectionCat.category_id)
  }, [allCategories, selectedDivisionCat, selectedSectionCat, sectionCategories])

  const divisionOptions = useMemo(() =>
    ['All Divisions', ...divisionCategories.map(d => d.name).sort()],
    [divisionCategories]
  )

  const sectionOptions = useMemo(() => {
    const source = selectedDivision === 'All Divisions'
      ? allCategories.filter(c => c.level === 2)
      : sectionCategories
    return ['All Sections', ...source.map(s => s.name).sort()]
  }, [allCategories, sectionCategories, selectedDivision])

  const subsectionOptions = useMemo(() => {
    const source = (selectedDivision === 'All Divisions' && selectedSection === 'All Sections')
      ? allCategories.filter(c => c.level === 3)
      : subsectionCategories
    return ['All Subsections', ...source.map(s => s.name).sort()]
  }, [allCategories, subsectionCategories, selectedDivision, selectedSection])

  const tradeOptions = useMemo(() => {
    const unique = [...new Set(products.map(p => p.trade).filter(Boolean))]
    return ['All Trades', ...unique.sort()]
  }, [products])

  const handleDivisionChange = val => {
    setSelectedDivision(val)
    setSelectedSection('All Sections')
    setSelectedSubsection('All Subsections')
  }
  const handleSectionChange = val => {
    setSelectedSection(val)
    setSelectedSubsection('All Subsections')
  }

  // ── Filtered data ────────────────────────────────────────────────────────────
  const filteredData = useMemo(() => {
    let result = [...products]
    if (search.trim()) {
      const q = search.toLowerCase().trim()
      result = result.filter(r =>
        (r.product_name || '').toLowerCase().includes(q) ||
        (r.product_code || '').toLowerCase().includes(q) ||
        (r.trade || '').toLowerCase().includes(q) ||
        (r.unit_name || '').toLowerCase().includes(q)
      )
    }
    if (selectedDivision !== 'All Divisions') result = result.filter(r => r.division_name === selectedDivision)
    if (selectedSection !== 'All Sections') result = result.filter(r => r.section_name === selectedSection)
    if (selectedSubsection !== 'All Subsections') result = result.filter(r => r.subsection_name === selectedSubsection)
    if (selectedTrade !== 'All Trades') result = result.filter(r => r.trade === selectedTrade)
    return result
  }, [products, search, selectedDivision, selectedSection, selectedSubsection, selectedTrade])

  // ── Delete ───────────────────────────────────────────────────────────────────
  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return
    try {
      setIsPageLoading(true)
      const res = await DeleteProduct(deleteTarget.product_id, organizationId ? { organization_id: organizationId } : {})
      let d = res?.data || res
      if (typeof d === 'string') d = JSON.parse(d)
      if (d?.valid) {
        showToast('success', d.message || 'Product deleted successfully')
        setDeleteTarget(null)
        getProducts()
      } else {
        showToast('error', d?.message || 'Failed to delete product')
      }
    } catch {
      showToast('error', 'Failed to delete product')
    } finally {
      setIsPageLoading(false)
    }
  }

  // ── Columns ──────────────────────────────────────────────────────────────────
  const columns = useMemo(() => [
    {
      name: 'PRODUCT ID',
      selector: row => row.product_code,
      sortable: true,
      minWidth: '142px',
      cell: row => <span className='tw-text-[#585858] tw-text-[14px]'>{row.product_code || '—'}</span>
    },
    {
      name: 'PRODUCT NAME',
      selector: row => row.product_name,
      sortable: true,
      grow: 2,                    
      wrap: true,                 
      cell: row => (
        <span
          className='tw-cursor-pointer hover:tw-text-blue-600 tw-w-full'
          onClick={e => { e.stopPropagation(); navigate(isAdminPortal ? `/admin/products/view/${row.product_uuid}` : `/products/view/${row.product_uuid}`) }}
        >
          <TextWithTooltip text={row.product_name || '—'} width="100%" />
        </span>
      )
    },
    {
      name: <TextWithTooltip text='MATERIAL COST' width='100%' />,
      selector: row => row.unit_price,
      sortable: true,
      minWidth: '180px',
      cell: row => <span>{fmtCost(row.unit_price)}</span>
    },
    {
      name: 'UNIT',
      selector: row => row.unit_name,
      sortable: true,
      minWidth: '110px',
      cell: row => <span>{unitMap[row.unit_id] || row.unit_name || '—'}</span>
    },
    {
      name: 'LH/UNIT',
      selector: row => row.labour_hours_per_unit,
      sortable: true,
      minWidth: '110px',
      cell: row => <span>{fmtNum(row.labour_hours_per_unit)}</span>
    },
    {
      name: 'TRADE',
      selector: row => row.trade,
      sortable: true,
      minWidth: '120px',
      cell: row => row.trade
        ? <span className='tw-inline-flex tw-px-3 tw-py-1 tw-rounded-full tw-border tw-border-[#d1ddd5] tw-text-[12px] tw-text-[#626463] tw-font-semibold tw-bg-[#f4f4f4] tw-whitespace-nowrap'>{row.trade}</span>
        : <span>—</span>
    },
    {
      name: 'ACTIONS',
      center: true,
      ignoreRowClick: true,
      minWidth: '110px',
      cell: row => (
        <ActionMenu
          onView={() => navigate(isAdminPortal ? `/admin/products/view/${row.product_uuid}` : `/products/view/${row.product_uuid}`)}
          onEdit={() => navigate(isAdminPortal ? `/admin/products/update/${row.product_uuid}` : `/products/update/${row.product_uuid}`)}
          onDelete={() => setDeleteTarget(row)}
          showView={isAdminPortal ? true : permissions?.view}
          showEdit={isAdminPortal ? true : permissions?.edit}
          showDelete={isAdminPortal ? row.created_by != null : (!!permissions?.delete && row.created_by != null)}
          viewDisabled={false}
          editDisabled={false}
          deleteDisabled={false}
        />
      )
    }
  ], [navigate, isAdminPortal, permissions, unitMap])

  const tableCustomStyles = {
    header: { style: { display: 'none' } },
    headRow: {
      style: {
        backgroundColor: '#fafafa',
        borderTop: '1px solid #e5e7eb',
        borderBottom: '1px solid #e5e7eb',
        minHeight: '48px'
      }
    },
    headCells: {
      style: {
        fontSize: '13px',
        fontWeight: '600',
        color: '#6e7178',
        textTransform: 'uppercase',
        letterSpacing: '0.04em',
        paddingLeft: '16px',
        paddingRight: '16px'
      }
    },
    rows: {
      style: {
        minHeight: '58px',
        borderBottom: '1px solid #EAECF0',
        transition: 'background-color 0.15s ease',
        '&:last-of-type': { borderBottom: 'none' },
        '&:hover': { backgroundColor: '#f8faff', cursor: 'pointer' }
      }
    },
    cells: {
      style: {
        fontSize: '14px',
        color: '#585858',
        paddingLeft: '16px',
        paddingRight: '16px'
      }
    }
  }

  const isInitialEmpty = products.length === 0

  return (
    <>
      {isPageLoading && <FullPageLoader />}
      <div className='tw-max-w-8xl tw-mx-auto'>
        <div className='tw-flex tw-justify-between tw-items-center tw-mb-6'>
          <h1 className='tw-text-[20px] tw-font-semibold tw-text-[#111827]'>Product Management</h1>
          {showAddProductButton && (
            <button
              type='button'
              disabled={isAddProductDisabled}
              onClick={() => { if (!isAddProductDisabled) navigate(`${isAdminPortal ? '/admin' : ''}/products/add`) }}
              className={`tw-flex tw-items-center tw-gap-2 tw-px-5 tw-h-[40px] tw-text-white tw-rounded-md tw-text-sm tw-font-medium tw-transition-all tw-duration-200 ${isAddProductDisabled ? 'tw-bg-[#b8c2d6] tw-cursor-not-allowed tw-opacity-70' : 'tw-bg-[#0140c1]'}`}
            >
              <Plus size={16} className='tw-shrink-0' />
              <span className='tw-text-[15px]'>Add Product</span>
            </button>
          )}
        </div>

        {isTableLoading ? (
          <div className='tw-bg-white tw-rounded-xl tw-border tw-border-gray-200 tw-shadow-sm tw-p-4'>
            <ShimmerTable row={8} col={7} />
          </div>
        ) : (
          <CustomDataTable
            columns={columns}
            data={filteredData}
            customStyles={tableCustomStyles}
            enablePagination={true}
            defaultPerPage={ITEMS_PER_PAGE}
            noDataComponent={
              <NoDataFound
                title='No Products Found'
                description='No products match your search or filter criteria.'
                buttonLabel={null}
              />
            }
            searchTerm={search}
            onSearchChange={isInitialEmpty ? null : setSearch}
            searchPlaceholder='Search Product...'
            filterComponent={
              isInitialEmpty ? null : (
                <div className='tw-flex tw-items-center tw-gap-2 tw-flex-wrap'>
                  <FilterDropdown
                    options={divisionOptions}
                    placeholder='All Divisions'
                    value={selectedDivision}
                    width='tw-w-40 tw-h-10'
                    onChange={handleDivisionChange}
                  />
                  <FilterDropdown
                    options={sectionOptions}
                    placeholder='All Sections'
                    value={selectedSection}
                    width='tw-w-40 tw-h-10'
                    onChange={handleSectionChange}
                  />
                  <FilterDropdown
                    options={subsectionOptions}
                    placeholder='All Subsections'
                    value={selectedSubsection}
                    width='tw-w-40 tw-h-10'
                    onChange={setSelectedSubsection}
                  />
                  <FilterDropdown
                    options={tradeOptions}
                    placeholder='All Trades'
                    value={selectedTrade}
                    width='tw-w-36 tw-h-10'
                    onChange={setSelectedTrade}
                  />
                </div>
              )
            }
          />
        )}
      </div>

      {deleteTarget && (
        <DeleteModal
          action='delete'
          entity='product'
          icon='icon-Products'
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleDeleteConfirm}
        />
      )}
    </>
  )
}
