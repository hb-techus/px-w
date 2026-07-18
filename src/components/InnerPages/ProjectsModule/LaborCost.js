import React, { useEffect, useState, useMemo, useCallback } from 'react'
import { Plus } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import CustomDataTable from '../../../genriccomponents/ReactTable'
import FullPageLoader from '../../../genriccomponents/loaders/FullPageLoader'
import { ShimmerTable } from 'react-shimmer-effects'
import { showToast } from '../../../genriccomponents/techus-ToastNotification'
import NoDataFound from '../../../genriccomponents/NoDataFound'
import {
  // GetOrgProductList,
  GetProductList,
  GetTakeoffCategories
} from '../../../services/techus-services'
import ActionMenu from '../../../genriccomponents/ActionMenu'
import TextWithTooltip from '../../Common/ToolTip'
import { useSelector } from 'react-redux'
import FilterDropdown from '../../../genriccomponents/FilterDropdown'
import { normalizeLabel } from '../../../utils/textUtils'

const ITEMS_PER_PAGE = 10
const LABOR_ACTION = 'labor'
const EXCLUDED_TRADES = ['general contractor', 'labor', 'labour']

const display = value => {
  if (value === null || value === undefined || value === '') return '—'
  const num = Number(value)
  if (!isNaN(num) && value !== '') {
    return num % 1 === 0 ? String(num) : String(parseFloat(num.toFixed(10)))
  }
  return value
}

export default function LaborCostTable() {
  const navigate = useNavigate();
  const location = useLocation();
  const permissionsList = useSelector((s) => s?.auth?.user?.[0]?.permission_info) || {};
const permissions = permissionsList?.labor_cost || {};
  const isAdminPortal = location.pathname.startsWith('/admin')
  const showAddLaborCostButton = isAdminPortal ? true : permissions?.create
  const isAddLaborCostDisabled = !isAdminPortal

  const [products, setProducts] = useState([])
  const [tradeCategoryOptions, setTradeCategoryOptions] = useState(['All'])

  const [search, setSearch] = useState('')
  const [selectedTradeCategory, setSelectedTradeCategory] = useState('All')

  const [isPageLoading, setIsPageLoading] = useState(false)
  const [isTableLoading, setIsTableLoading] = useState(true)

  // ── Fetch Labor Costs ───────────────────────────────────────────────────────
  const getLaborCosts = useCallback(async () => {
    try {
      setIsTableLoading(true)
      let res
      if (isAdminPortal) {
       res = await GetProductList({
  action: LABOR_ACTION,
  search: '',
  sort_column: 'product_name',
  sort_order: 'asc',
  limit: 1000,
  offset: 0
})
      } else {
        const org_id = localStorage.getItem('organization_id')
        console.log('org_id', org_id)

      res = await GetOrgProductList({
  action: LABOR_ACTION,
  search: '',
  sort_column: 'product_name',
  sort_order: 'asc',
  limit: 1000,
  offset: 0,
  organization_id: org_id
})

        console.log('GetOrgProductList', res)
      }

      let d = res?.data || res
      if (typeof d === 'string') d = JSON.parse(d)

      if (d?.valid) {
        setProducts(Array.isArray(d.data) ? d.data : [])
      } else {
        showToast('error', d?.message || 'Failed to fetch labor costs')
        setProducts([])
      }
    } catch (err) {
      console.error('Error fetching labor costs:', err)
      showToast('error', 'Failed to fetch labor costs')
      setProducts([])
    } finally {
      setIsTableLoading(false)
    }
  }, [isAdminPortal])

  const getTradeCategories = useCallback(async () => {
    try {
      const res = await GetTakeoffCategories()
      let d = res?.data || res
      if (typeof d === 'string') d = JSON.parse(d)

      if (d?.valid) {
        const options = Array.from(
          new Set(
            (Array.isArray(d.data) ? d.data : [])
              .map(item => normalizeLabel(item.takeoff_name))
              .filter(
                item =>
                  !EXCLUDED_TRADES.includes(String(item ?? '').trim().toLowerCase())
              )
              .filter(Boolean)
          )
        )

        setTradeCategoryOptions(['All', ...options])
      } else {
        showToast('error', d?.message || 'Failed to fetch trade categories')
      }
    } catch (err) {
      console.error('Error fetching trade categories:', err)
      showToast('error', 'Failed to fetch trade categories')
    }
  }, [])

  useEffect(() => {
    getLaborCosts()
    getTradeCategories()
  }, [getLaborCosts, getTradeCategories])

  // ── Filtered & Sorted Data ──────────────────────────────────────────────────
 const filteredData = useMemo(() => {
    let result = [...products]

    result.sort((a, b) => (a.product_name || '').localeCompare(b.product_name || ''))

    if (search.trim()) {
      const q = search.toLowerCase().trim()
      result = result.filter(
        row =>
          (row.product_name || '').toLowerCase().includes(q) ||
          (row.takeoff_name || '').toLowerCase().includes(q) ||
          String(row.unit_cost || '').toLowerCase().includes(q)
      )
    }

    if (selectedTradeCategory !== 'All') {
      result = result.filter(
        row => normalizeLabel(row.takeoff_name || '') === selectedTradeCategory
      )
    }

    return result
  }, [products, search, selectedTradeCategory])

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleView = useCallback(
    id => navigate(`${isAdminPortal ? `/admin/labor-cost/view/${id}` : `/labor-cost/view/${id}`}`),
    [isAdminPortal, navigate]
  )

  // ── Columns ─────────────────────────────────────────────────────────────────
  const columns = useMemo(
    () => [
      {
        name: (
          <div className=''>
            Name
          </div>
        ),
        selector: row => row.product_name,
        sortable: true,

        grow: 1.2,
        cell: row => (
          <span className='tw-cursor-pointer tw-truncate hover:tw-text-blue-600 '
            onClick={(e) => {
              e.stopPropagation();
              handleView(row.product_uuid);
            }}
          >
            <TextWithTooltip
              text={row.product_name ? row.product_name : '-'}
              className=''
            />

          </span>
        )
      },
      {
        name: (
          <div className=''>
            Trade
          </div>
        ),
        selector: row => normalizeLabel(row.takeoff_name || ''),
        sortable: true,
        minWidth: '180px',
        cell: row => (
          <TextWithTooltip
            text={row.takeoff_name ? normalizeLabel(row.takeoff_name) : '-'}
            className=''
          />
        )
      },
      {
        name: (
          <div className=''>
            Cost
          </div>
        ),
        selector: row => row.unit_cost,
        sortable: true,
        minWidth: '150px',
        cell: row => (
          <span>
            {row.unit_cost !== null &&
              row.unit_cost !== undefined &&
              row.unit_cost !== ''
              ? `$${parseFloat(row.unit_cost).toFixed(2)}`
              : '—'}
          </span>
        )
      },
      {
        name: (
          <div className=''>
            Actions
          </div>
        ),
        center: true,
        ignoreRowClick: true,
        minWidth: '110px',
        cell: row => (
          <ActionMenu
            onView={() => handleView(row.product_uuid)}
            onEdit={() =>
              navigate(
                isAdminPortal
                  ? `/admin/labor-cost/update/${row.product_uuid}`
                  : `/labor-cost/update/${row.product_uuid}`
              )
            }
            showView={permissions?.view}
            showEdit={permissions?.edit}
            showDelete={permissions?.delete}
            viewDisabled={false}
            editDisabled={false}
            deleteDisabled={true}
          />
        )
      }
    ],
    [handleView]
  )
  const isInitialEmpty = products.length === 0;
  // ── Custom Table Styles ─────────────────────────────────────────────────────
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
        fontSize: '15px',
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
    '&:hover': {
      backgroundColor: '#f8faff',
      cursor: 'pointer',
    },
  },
},
    cells: {
      style: {
        fontSize: '15px',
        color: '#585858',
        paddingLeft: '16px',
        paddingRight: '16px'
      }
    }
  }

  const isFilteredEmpty = filteredData.length === 0 && products.length > 0;

  const EmptyDataView = (
    <NoDataFound
      title="No Labor Costs Found"
      description={
        isFilteredEmpty
          ? "No labor costs match your search or filter criteria."
          : "No labor costs available."
      }
      buttonLabel={null}
    />
  )
  void display
  void setIsPageLoading
  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <>
      {isPageLoading && <FullPageLoader />}

      <div className='tw-max-w-8xl tw-mx-auto'>
        {/* Page Header */}
        <div className='tw-flex tw-justify-between tw-items-center tw-mb-6'>
          <div>
            <h1 className='tw-text-[20px] tw-font-semibold tw-text-[#111827]'>
              Labor Cost
            </h1>

            <p className='tw-text-[14px] tw-text-[#1e293b] tw-tracking-[0.31px]'>
              Maintain your labor cost catalog with name, trade, and pricing details for use in takeoffs and estimations.
            </p>
          </div>
          {showAddLaborCostButton && <button
            type='button'
            disabled={isAddLaborCostDisabled}
            onClick={() => {
              if (!isAddLaborCostDisabled) {
                navigate('/admin/labor-cost/add')
              }
            }}
            className={`tw-flex tw-items-center tw-gap-2 tw-px-5 tw-h-[40px] tw-text-white tw-rounded-md tw-text-sm tw-font-medium tw-transition-all tw-duration-200 ${
              isAddLaborCostDisabled
                ? 'tw-bg-[#b8c2d6] tw-cursor-not-allowed tw-opacity-70'
                : 'tw-bg-[#0140c1]'
            }`}
          >
            <Plus size={16} className='tw-shrink-0' />
            <span className='tw-text-[15px]'>Add Labor Cost</span>
          </button>}
        </div>

        {/* Table */}
        {isTableLoading ? (
          <div className='tw-bg-white tw-rounded-xl tw-border tw-border-gray-200 tw-shadow-sm tw-p-4'>
            <ShimmerTable row={8} col={4} />
          </div>
        ) : (
          <CustomDataTable
            columns={columns}
            data={filteredData}
            customStyles={tableCustomStyles}
            enablePagination={true}
            defaultPerPage={ITEMS_PER_PAGE}
            noDataComponent={EmptyDataView}
            searchTerm={search}
            onSearchChange={isInitialEmpty ? null : setSearch}
            searchPlaceholder='Search Labor Cost Name or Trade'
            filterComponent={
              isInitialEmpty
                ? null
                : <div className='tw-flex tw-items-center tw-gap-2 tw-flex-wrap'>
                  <FilterDropdown
                    options={tradeCategoryOptions}
                    placeholder='Trade Category'
                    value={selectedTradeCategory}
                    width='tw-w-40 tw-h-10'
                    onChange={setSelectedTradeCategory}
                  />
                </div>
            }

          />

        )}


      </div>
    </>
  )
}
