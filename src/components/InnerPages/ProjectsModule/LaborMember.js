import React, { useEffect, useState, useMemo, useCallback } from 'react'
import { Plus } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import CustomDataTable from '../../../genriccomponents/ReactTable'
import { ShimmerTable } from 'react-shimmer-effects'
import NoDataFound from '../../../genriccomponents/NoDataFound'
import { showToast } from '../../../genriccomponents/techus-ToastNotification'
import {
  GetTakeoffCategories,
  LaborWorkerList,
  LaborWorkerDelete
} from '../../../services/techus-services'
import ActionMenu from '../../../genriccomponents/ActionMenu'
import TextWithTooltip from '../../Common/ToolTip'
import FilterDropdown from '../../../genriccomponents/FilterDropdown'
import { normalizeLabel } from '../../../utils/textUtils'
import DeleteModal from '../../../genriccomponents/DeleteModal'

const ITEMS_PER_PAGE = 10
const EXCLUDED_TRADES = ['general contractor', 'labor', 'labour']
const MAX_VISIBLE_TRADES = 2

function TradeBadge ({ raw }) {
  if (!raw) return <span className='tw-text-gray-400'>—</span>
  const trades = raw.split(',').map(t => normalizeLabel(t.trim())).filter(Boolean)
  if (trades.length === 0) return <span className='tw-text-gray-400'>—</span>
  const visible = trades.slice(0, MAX_VISIBLE_TRADES)
  const overflow = trades.slice(MAX_VISIBLE_TRADES)
  return (
    <span className='tw-text-[14px] tw-text-[#585858]'>
      {visible.join(', ')}{overflow.length > 0 && <span className='tw-text-blue-600 tw-font-medium'> ... +{overflow.length}</span>}
    </span>
  )
}

function CrewWarningModal ({ member, onClose }) {
  const crewNames = member?.crew_names || []
  return (
    <div style={{
      position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.45)',
      zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
    }}>
      <div style={{
        background: '#fff', borderRadius: 12, width: 480, maxWidth: '100%',
        boxShadow: '0 20px 60px rgba(0,0,0,0.18)', display: 'flex', flexDirection: 'column',
      }}>
        <div style={{ padding: '28px 28px 0' }}>
          <p style={{ fontSize: 17, fontWeight: 700, color: '#111827', margin: '0 0 10px' }}>
            Update Required Before Deleting
          </p>
          <p style={{ fontSize: 14, color: '#6B7280', lineHeight: 1.6, margin: '0 0 14px' }}>
            This member is currently assigned to the following crews. Please remove from each crew before proceeding.
          </p>
        </div>

        <div style={{
          margin: '0 28px 20px',
          maxHeight: 200,
          overflowY: 'auto',
          background: '#F9FAFB',
          border: '1px solid #E5E7EB',
          borderRadius: 8,
          padding: '8px 16px',
          scrollbarWidth: 'thin',
          scrollbarColor: '#DEE9FF transparent',
        }}>
          <ul style={{ margin: 0, padding: '0 0 0 18px', listStyleType: 'disc' }}>
            {crewNames.map((name, i) => (
              <li key={i} style={{ fontSize: 14, color: '#374151', padding: '5px 0' }}>{name}</li>
            ))}
          </ul>
        </div>

        <div style={{
          display: 'flex', justifyContent: 'flex-end', gap: 10,
          padding: '14px 28px 24px', borderTop: '1px solid #F3F4F6',
        }}>
          {/* <button
            onClick={onClose}
            style={{
              padding: '10px 28px', border: '1px solid #E5E7EB', borderRadius: 5,
              background: '#F3F4F6', color: '#374151', cursor: 'pointer', fontSize: 14,
              fontWeight: 500, fontFamily: 'inherit',
            }}
          >
            Cancel
          </button> */}
          <button
            onClick={onClose}
            style={{
              padding: '10px 28px', border: 'none', borderRadius: 5,
              background: '#1D4ED8', color: '#fff', cursor: 'pointer', fontSize: 14,
              fontWeight: 600, fontFamily: 'inherit',
            }}
          >
            Okay
          </button>
        </div>
      </div>
    </div>
  )
}

export default function LaborMember () {
  const navigate = useNavigate()
  const location = useLocation()
  const permissionsList = useSelector(s => s?.auth?.user?.[0]?.permission_info) || {}
  const permissions = permissionsList?.labor_cost || {}
  const isAdminPortal = location.pathname.startsWith('/admin')
  const baseLabor = isAdminPortal ? '/admin/labor' : '/labor'
  const memberBase = `${baseLabor}/member`
  const crewBase = `${baseLabor}/crew`

  const showAddButton = isAdminPortal ? true : permissions?.create
  const isAddMemberDisabled = false;//!isAdminPortal

  const [members, setMembers] = useState([])
  const organizationId = !isAdminPortal ? localStorage.getItem('organization_id') : null

  const [tradeCategoryOptions, setTradeCategoryOptions] = useState(['All Trades'])
  const [search, setSearch] = useState('')
  const [selectedTrade, setSelectedTrade] = useState('All Trades')
  const [isTableLoading, setIsTableLoading] = useState(true)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [crewWarningTarget, setCrewWarningTarget] = useState(null)

  const getMembers = useCallback(async () => {
    try {
      setIsTableLoading(true)
      const res = await LaborWorkerList({
        search: '',
        sort_column: 'worker_name',
        limit: 1000,
        offset: 0,
        ...(organizationId && { organization_id: organizationId })
      })
      let d = res?.data || res
      if (typeof d === 'string') d = JSON.parse(d)
      if (d?.valid) {
        setMembers(Array.isArray(d.data) ? d.data : [])
      } else {
        showToast('error', d?.message || 'Failed to fetch members')
        setMembers([])
      }
    } catch {
      showToast('error', 'Failed to fetch members')
      setMembers([])
    } finally {
      setIsTableLoading(false)
    }
  }, [])

  const getTradeCategories = useCallback(async () => {
    try {
      const res = await GetTakeoffCategories(organizationId ? { organization_id: organizationId } : {})
      let d = res?.data || res
      if (typeof d === 'string') d = JSON.parse(d)
      if (d?.valid) {
        const options = [
          ...new Set(
            (Array.isArray(d.data) ? d.data : [])
              .map(item => normalizeLabel(item.takeoff_name))
              .filter(item => !EXCLUDED_TRADES.includes(String(item ?? '').trim().toLowerCase()))
              .filter(Boolean)
          )
        ]
        setTradeCategoryOptions(['All Trades', ...options])
      }
    } catch {
      // fall through — filter defaults to "All"
    }
  }, [])

  useEffect(() => {
    getMembers()
    getTradeCategories()
  }, [getMembers, getTradeCategories])

  const filteredMembers = useMemo(() => {
    let result = [...members]
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(r =>
        (r.worker_name || '').toLowerCase().includes(q) ||
        (r.code || '').toLowerCase().includes(q) ||
        (r.trade_names || '').toLowerCase().includes(q)
      )
    }
    if (selectedTrade !== 'All Trades') {
      result = result.filter(r =>
        (r.trade_names || '').split(',').map(t => normalizeLabel(t.trim())).includes(selectedTrade)
      )
    }
    return result
  }, [members, search, selectedTrade])

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return
    try {
      const workerId = deleteTarget.worker_id ?? deleteTarget.worker_uuid
      const res = await LaborWorkerDelete({ worker_id: workerId, ...(organizationId && { organization_id: organizationId }) })
      let d = res?.data || res
      if (typeof d === 'string') d = JSON.parse(d)
      if (d?.valid) {
        showToast('success', d.message || 'Member deleted successfully')
        setDeleteTarget(null)
        getMembers()
      } else {
        showToast('error', d?.message || 'Failed to delete member')
      }
    } catch {
      showToast('error', 'Failed to delete member')
    }
  }

  const isInitialEmpty = members.length === 0

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
      name: 'Code',
      selector: row => row.code,
      sortable: true,
      minWidth: '180px',
      cell: row => (
        <span className='tw-text-[#585858] tw-text-[15px]'>{row.code || '—'}</span>
      )
    },
    {
  name: 'Member Name',
  selector: row => row.worker_name,
  sortable: true,
  grow: 1.5,
  cell: row => (
    <span
      className='tw-cursor-pointer tw-text-[#1e293b] hover:tw-text-blue-600'
      onClick={e => { e.stopPropagation(); navigate(`${memberBase}/view/${row.worker_uuid ?? row.worker_id}`) }}
    >
      <TextWithTooltip text={row.worker_name || '-'} width="280px" />  {/* ← add width */}
    </span>
  )
},
    {
      name: 'Trade',
      selector: row => row.trade_names,
      sortable: true,
      minWidth: '320px',
      cell: row => <TradeBadge raw={row.trade_names} />
    },
    {
      name: '$/Hour',
      selector: row => row.cost_per_hour,
      sortable: true,
      minWidth: '0px',
      cell: row => {
        if (row.cost_per_hour == null || row.cost_per_hour === '') return <span>—</span>
        const n = parseFloat(row.cost_per_hour)
        const display = Number.isInteger(n) ? String(n) : String(parseFloat(n.toFixed(2)))
        return <span>${display}</span>
      }
    },
    {
      name: 'Actions',
      center: true,
      ignoreRowClick: true,
      minWidth: '110px',
      cell: row => (
        <ActionMenu
          onView={() => navigate(`${memberBase}/view/${row.worker_uuid ?? row.worker_id}`)}
          onEdit={() => navigate(`${memberBase}/update/${row.worker_uuid ?? row.worker_id}`)}
          onDelete={() => {
            if ((row.crew_count || 0) > 0) setCrewWarningTarget(row)
            else setDeleteTarget(row)
          }}
          showView={isAdminPortal ? true : permissions?.view}
          showEdit={isAdminPortal ? true : permissions?.edit}
          showDelete={isAdminPortal ? row.is_master !== 1 : (!!permissions?.delete && row.is_master !== 1)}
          viewDisabled={false}
          editDisabled={false}
        />
      )
    }
  ], [navigate, memberBase, isAdminPortal, permissions])

  return (
    <div className='tw-max-w-8xl tw-mx-auto'>
{/* Header */}
<div className='tw-flex tw-justify-between tw-items-center tw-mb-4'>
  <h1 className='tw-text-[20px] tw-font-semibold tw-text-[#111827]'>Labor</h1>
</div>

{/* Tabs + Add Button in same row */}
<div className='tw-flex tw-items-center tw-justify-between tw-mb-4'>
    <div className='tw-flex tw-items-center tw-gap-1 tw-bg-white tw-p-1 tw-rounded-lg tw-w-fit tw-mb-1'>
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
  {!!permissions?.view && (
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
  {showAddButton && (
    <button
      type='button'
      disabled={isAddMemberDisabled}
      onClick={() => { if (!isAddMemberDisabled) navigate(`${memberBase}/add`) }}
      className={`tw-flex tw-items-center tw-gap-2 tw-px-5 tw-h-[40px] tw-text-white tw-rounded-md tw-text-sm tw-font-medium tw-transition-all tw-duration-200 tw-mb-3
        ${isAddMemberDisabled ? 'tw-bg-[#b8c2d6] tw-cursor-not-allowed tw-opacity-70' : 'tw-bg-[#0140c1]'}`}
    >
      <Plus size={16} className='tw-shrink-0' />
      <span className='tw-text-[15px]'>Add Member</span>
    </button>
  )}
</div>
      {/* Table */}
      {isTableLoading ? (
        <div className='tw-bg-white tw-rounded-xl tw-border tw-border-gray-200 tw-shadow-sm tw-p-4'>
          <ShimmerTable row={8} col={5} />
        </div>
      ) : (
        <CustomDataTable
          columns={columns}
          data={filteredMembers}
          customStyles={tableCustomStyles}
          enablePagination={true}
          defaultPerPage={ITEMS_PER_PAGE}
          noDataComponent={
            <NoDataFound
              title='No Members Found'
              description='No members match your search or filter criteria.'
              buttonLabel={null}
            />
          }
          searchTerm={search}
          onSearchChange={isInitialEmpty ? null : setSearch}
          searchPlaceholder='Search Member...'
          filterComponent={
            !isInitialEmpty ? (
              <FilterDropdown
                options={tradeCategoryOptions}
                placeholder='All Trades'
                value={selectedTrade}
                width='tw-w-44 tw-h-10'
                onChange={setSelectedTrade}
              />
            ) : null
          }
        />
      )}

      {deleteTarget && (
        <DeleteModal
          action='delete'
          entity='member'
          icon='icon-Delete-memeber'
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleDeleteConfirm}
        />
      )}

      {crewWarningTarget && (
        <CrewWarningModal
          member={crewWarningTarget}
          onClose={() => setCrewWarningTarget(null)}
        />
      )}
    </div>
  )
}
