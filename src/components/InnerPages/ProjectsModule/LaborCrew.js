import React, { useEffect, useState, useMemo, useCallback } from 'react'
import { Eye } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import CustomDataTable from '../../../genriccomponents/ReactTable'
import { ShimmerTable } from 'react-shimmer-effects'
import NoDataFound from '../../../genriccomponents/NoDataFound'
import { showToast } from '../../../genriccomponents/techus-ToastNotification'
import { LaborCrewList, GetProductCategories } from '../../../services/techus-services'
import FilterDropdown from '../../../genriccomponents/FilterDropdown'

const ITEMS_PER_PAGE = 10

export default function LaborCrew () {
  const navigate = useNavigate()
  const location = useLocation()
  const permissionsList = useSelector(s => s?.auth?.user?.[0]?.permission_info) || {}
  const isAdminPortal = location.pathname.startsWith('/admin')
  const baseLabor = isAdminPortal ? '/admin/labor' : '/labor'
  const memberBase = `${baseLabor}/member`
  const crewBase = `${baseLabor}/crew`

  const permissions = permissionsList?.labor_cost || {}
  const canViewMember = isAdminPortal ? !!permissions?.view : !!permissions?.view

  const organizationId = !isAdminPortal ? localStorage.getItem('organization_id') : null

  const [crews, setCrews] = useState([])
  const [allCategories, setAllCategories] = useState([])
  const [isTableLoading, setIsTableLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterSubsection, setFilterSubsection] = useState('All Subsections')

  const getCrews = useCallback(async () => {
    try {
      setIsTableLoading(true)
      const res = await LaborCrewList({ limit: 1000, offset: 0, ...(organizationId && { organization_id: organizationId }) })
      let d = res?.data || res
      if (typeof d === 'string') d = JSON.parse(d)
      if (d?.valid) {
        setCrews(Array.isArray(d.data) ? d.data : [])
      } else {
        showToast('error', d?.message || 'Failed to fetch crews')
        setCrews([])
      }
    } catch {
      showToast('error', 'Failed to fetch crews')
      setCrews([])
    } finally {
      setIsTableLoading(false)
    }
  }, [])

  const loadCategories = useCallback(async () => {
    try {
      const res = await GetProductCategories(organizationId ? { organization_id: organizationId } : {})
      let d = res?.data || res
      if (typeof d === 'string') d = JSON.parse(d)
      if (d?.valid) setAllCategories(Array.isArray(d.data) ? d.data : [])
    } catch { /* silent */ }
  }, [organizationId])

  useEffect(() => { getCrews() }, [getCrews])
  useEffect(() => { loadCategories() }, [loadCategories])

  const subsectionOptions = useMemo(() =>
    ['All Subsections', ...allCategories.filter(c => c.level === 3).map(c => c.name).sort()],
    [allCategories]
  )

  const filteredCrews = useMemo(() => {
    let result = [...crews]
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(r => (r.crew_name || '').toLowerCase().includes(q))
    }
    if (filterSubsection && filterSubsection !== 'All Subsections') {
      result = result.filter(r => r.subsection_name === filterSubsection)
    }
    return result
  }, [crews, search, filterSubsection])

  const isInitialEmpty = crews.length === 0

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
        fontSize: '15px',
        color: '#585858',
        paddingLeft: '16px',
        paddingRight: '16px'
      }
    }
  }

  const columns = useMemo(() => [
    {
      name: 'Crew Name',
      selector: row => row.crew_name,
      sortable: true,
      grow: 1.1,
      cell: row => (
        <span className='tw-text-[14px] tw-text-[#1e293b]'>{row.crew_name || '—'}</span>
      )
    },
    {
      name: 'Member(s) Count',
      selector: row => row.member_count,
      sortable: true,
      center: true,
      minWidth: '150px',
      cell: row => (
        <span className='tw-text-[14px] tw-text-gray-700'>
          {row.member_count ?? (Array.isArray(row.members) ? row.members.length : '—')}
        </span>
      )
    },
    {
      name: 'Subsection',
      selector: row => row.subsection_name,
      sortable: true,
      grow: 2,
      wrap: true,
      cell: row => (
        row.subsection_name
          ? <span className='tw-text-[14px] tw-text-[#585858]'>{row.subsection_name}</span>
          : <span className='tw-text-[14px] tw-text-gray-400'>—</span>
      )
    },
    {
      name: 'Actions',
      center: true,
      ignoreRowClick: true,
      minWidth: '100px',
      cell: row => (
        <button
          onClick={() => navigate(`${crewBase}/view/${row.crew_uuid}`)}
          className='tw-inline-flex tw-items-center tw-gap-1.5 tw-text-sm tw-text-gray-600 hover:tw-text-blue-600 tw-bg-transparent tw-border-none tw-cursor-pointer tw-transition-colors tw-font-medium'
        >
          <Eye size={15} /> View
        </button>
      )
    }
  ], [navigate, crewBase])

  return (
    <div className='tw-max-w-8xl tw-mx-auto'>
      {/* Header */}
      <div className='tw-flex tw-justify-between tw-items-center tw-mb-4 '>
        <h1 className='tw-text-[20px] tw-font-semibold tw-text-[#111827]'>Labor</h1>
      </div>

      {/* Tabs */}
      <div className='tw-flex tw-items-center tw-gap-1 tw-bg-white tw-p-1 tw-rounded-lg tw-w-fit tw-mb-6'>
  <button
    type='button'
    onClick={() => navigate(crewBase)}
    className={`tw-px-8 tw-py-1.5 tw-text-[15px] tw-font-medium tw-rounded-md tw-transition-all tw-duration-150 tw-border-none
      ${location.pathname.includes('/crew')
        ? 'tw-bg-[#4488FF] tw-text-white tw-shadow-sm'
        : ' tw-text-[#000] hover:tw-text-[#000]'
      }`}
    style={{ minWidth: '120px' }}
  >
    Crew
  </button>
  {canViewMember && (
    <button
      type='button'
      onClick={() => navigate(memberBase)}
      className={`tw-px-8 tw-py-1.5 tw-text-[15px] tw-font-medium tw-rounded-md tw-transition-all tw-duration-150 tw-border-none
        ${location.pathname.includes('/member')
          ? 'tw-bg-[#4488FF] tw-text-white tw-shadow-sm'
          : ' tw-text-[#000] hover:tw-text-[#000]'
        }`}
      style={{ minWidth: '120px' }}
    >
      Member
    </button>
  )}
</div>
      {/* Table */}
      {isTableLoading ? (
        <div className='tw-bg-white tw-rounded-xl tw-border tw-border-gray-200 tw-shadow-sm tw-p-4'>
          <ShimmerTable row={6} col={4} />
        </div>
      ) : (
        <CustomDataTable
          columns={columns}
          data={filteredCrews}
          customStyles={tableCustomStyles}
          enablePagination={true}
          defaultPerPage={ITEMS_PER_PAGE}
          noDataComponent={
            <NoDataFound
              title='No Crews Found'
              description={
                filteredCrews.length === 0 && crews.length > 0
                  ? 'No crews match your search or filter criteria.'
                  : 'No crews available.'
              }
              buttonLabel={null}
            />
          }
          searchTerm={search}
          onSearchChange={isInitialEmpty ? null : setSearch}
          searchPlaceholder='Search Crew...'
          filterComponent={
            !isInitialEmpty ? (
              <FilterDropdown
                options={subsectionOptions}
                placeholder='All Subsections'
                value={filterSubsection}
                width='tw-w-[400px] tw-h-10'
                onChange={setFilterSubsection}
              />
            ) : null
          }
        />
      )}
    </div>
  )
}
