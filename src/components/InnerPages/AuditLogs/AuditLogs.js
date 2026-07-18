import React, { useState, useRef, useEffect, useCallback } from 'react'
import DataTable from 'react-data-table-component'
import { StyleSheetManager } from 'styled-components'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { useLocation } from 'react-router-dom'
import { useSelector } from 'react-redux'
import DOMPurify from 'dompurify'
import { ShimmerTable } from 'react-shimmer-effects'
import TextWithTooltip from '../../Common/ToolTip'
import { FetchAuditLogs, GetUserList, GetLogSections } from '../../../services/techus-services'
import { capitalizeFirstLetter, formatDateStringWithTime } from '../../../utils/commonUtils'
import no_data from '../../../assets/Images/no_data_images/No-data-found.webp'
import AccessDenied from '../../../genriccomponents/AccessDenied'
import MultiSelectDropdown from './MultiSelectDropdown'
import {
  DEFAULT_PER_PAGE,
  DEBOUNCE_DELAY,
  tableCustomStyles,
  sortIcon,
  shouldForwardProp,
  titleCase,
  toDateStr,
  DATE_PICKER_CSS,
} from './AuditLogs.constants'

const columns = [
  {
    name: 'Date & Time',
    sortField: 'created_date',
    selector: row => new Date(row.created_date).getTime(),
    cell: row => (
      <span className='tw-text-[14px]'>
        {row.created_date ? formatDateStringWithTime(row.created_date) : '-'}
      </span>
    ),
    sortable: true,
    width: '200px',
  },
  {
    name: 'Action',
    sortField: 'action',
    selector: row => row.action,
    sortable: true,
    width: '200px',
    cell: row => (
      <TextWithTooltip
        text={titleCase(row.action)}
        width='190px'
        className='tw-text-[14px]'
      />
    ),
  },
  {
    name: 'Log Details',
    selector: row => row.message,
    grow: 2,
    cell: row => (
      <div
        className='tw-text-[14px] tw-py-1'
        style={{ maxHeight: '58px', overflowY: 'auto', width: '100%' }}
        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(capitalizeFirstLetter(row.message)) }}
      />
    ),
  },
  {
    name: 'Section',
    sortField: 'section',
    selector: row => row.section,
    sortable: true,
    minWidth: '190px',
    cell: row => (
      <span className='tw-text-[14px] tw-whitespace-normal tw-break-words tw-leading-snug'>
        {titleCase(row.section)}
      </span>
    ),
  },
]

const EmptyDataView = () => (
  <div className='tw-flex tw-flex-col tw-items-center tw-justify-center tw-py-16 tw-text-center tw-w-full'>
    <img
      alt='No data found'
      src={no_data}
      style={{ width: '220px', height: 'auto' }}
      className='tw-mb-4'
    />
    <h3 className='tw-text-xl tw-font-semibold tw-text-gray-800'>No Logs Found</h3>
  </div>
)

const AuditLogs = () => {
  const location = useLocation()
  const isAdminPortal = location.pathname.startsWith('/admin')
  const orgId = useSelector(state => state?.tokens?.organization_id)
  const permissionsList = useSelector(s => s?.auth?.user?.[0]?.permission_info) || {}
  const canView = permissionsList?.audit_log === undefined || permissionsList?.audit_log?.view !== false
  const autoUserType = isAdminPortal ? 'ADMIN' : 'ORGANIZATION'

  const [isDropdownsLoading, setIsDropdownsLoading] = useState(true)
  const [searchInput, setSearchInput] = useState('')
  const [startDate, setStartDate] = useState(null)
  const [endDate, setEndDate] = useState(null)
  const [selectedUsers, setSelectedUsers] = useState([])
  const [selectedSections, setSelectedSections] = useState([])
  const searchTimeoutRef = useRef(null)

  const [usersMeta, setUsersMeta] = useState([])
  const [userNames, setUserNames] = useState([])
  const [sectionOptions, setSectionOptions] = useState([])

  const [data, setData] = useState([])
  const [totalRecords, setTotalRecords] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  const [currentPage, setCurrentPage] = useState(1)
  const [sortBy, setSortBy] = useState('')
  const [sortOrder, setSortOrder] = useState('desc')

  const isMountedRef = useRef(true)

  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current)
    }
  }, [])

  const getSelectedUserIds = useCallback((names) => {
    if (!names || names.length === 0) return []
    return names
      .map(n => usersMeta.find(m => m.name === n)?.encrypted_id)
      .filter(Boolean)
  }, [usersMeta])

  const fetchLogs = useCallback(async ({
    pageNum = 1,
    searchValue = null,
    sd = null,
    ed = null,
    userIds = [],
    sections = [],
    sortByVal = '',
    sortOrderVal = 'desc',
  } = {}) => {
    try {
      setIsLoading(true)

      const params = {
        user_type: autoUserType,
        page: pageNum - 1,
        limit: DEFAULT_PER_PAGE,
        sortOrder: sortOrderVal || 'desc',
      }

      if (!isAdminPortal && orgId) params.org_id = orgId
      if (sd) params.start_date = toDateStr(sd)
      if (ed) params.end_date = toDateStr(ed)
      params.search = searchValue || ''
      if (userIds.length) params.users_id = userIds
      if (sections.length) params.section = sections
      if (sortByVal) params.sortBy = sortByVal

      const response = await FetchAuditLogs(params)
      const rows = Array.isArray(response?.data) ? response.data : Array.isArray(response) ? response : []
      const total =
        response?.total ??
        response?.count ??
        response?.totalCount ??
        response?.total_count ??
        response?.total_records ??
        response?.pagination?.total ??
        response?.meta?.total ??
        rows.length

      if (isMountedRef.current) {
        setData(rows)
        setTotalRecords(Math.max(Number(total) || 0, rows.length))
      }
    } catch (e) {
      console.error('fetchLogs error:', e)
      if (isMountedRef.current) { setData([]); setTotalRecords(0) }
    } finally {
      if (isMountedRef.current) setIsLoading(false)
    }
  }, [autoUserType, orgId, isAdminPortal])

  useEffect(() => {
    fetchLogs({ sortOrderVal: 'desc' })

    ;(async () => {
      await Promise.allSettled([
        (async () => {
          try {
            const res = await GetUserList()
            const users = Array.isArray(res?.user) ? res.user : Array.isArray(res) ? res : []
            const filtered = isAdminPortal
              ? users.filter(u => u.user_type === 'ADMIN')
              : users.filter(u => u.user_type === 'ORGANIZATION')
            const seen = new Set()
            const meta = filtered.reduce((acc, u) => {
              if (u.email_id && !seen.has(u.email_id)) {
                seen.add(u.email_id)
                acc.push({
                  name: u.email_id,
                  encrypted_id: u.encrypted_id ?? u.enc_id ?? u.encryptedId ?? (u.id != null ? String(u.id) : null),
                  created_date: u.created_date || null,
                })
              }
              return acc
            }, [])
            meta.sort((a, b) => new Date(b.created_date || 0) - new Date(a.created_date || 0))
            if (isMountedRef.current) {
              setUsersMeta(meta)
              setUserNames(meta.map(m => m.name))
            }
          } catch (e) { console.error('GetUserList failed', e) }
        })(),
        (async () => {
          try {
            const sectionParams = { user_type: autoUserType }
            if (!isAdminPortal && orgId) sectionParams.org_id = orgId
            const res = await GetLogSections(sectionParams)
            const secs = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : []
            const names = secs
              .map(s => (typeof s === 'string' ? s : s.name || s.section_name || s.permission_name || ''))
              .filter(Boolean)
            if (isMountedRef.current) setSectionOptions(names)
          } catch (e) { console.error('GetLogSections failed', e) }
        })(),
      ])
      if (isMountedRef.current) setIsDropdownsLoading(false)
    })()
  }, [])

  const debouncedSearch = useCallback(val => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current)
    searchTimeoutRef.current = setTimeout(() => {
      if (isMountedRef.current) {
        setCurrentPage(1)
        fetchLogs({
          pageNum: 1,
          searchValue: val || null,
          sd: startDate,
          ed: endDate,
          userIds: getSelectedUserIds(selectedUsers),
          sections: selectedSections,
          sortByVal: sortBy,
          sortOrderVal: sortOrder,
        })
      }
    }, DEBOUNCE_DELAY)
  }, [fetchLogs, startDate, endDate, selectedUsers, selectedSections, sortBy, sortOrder, getSelectedUserIds])

  const handleSearchChange = useCallback(val => {
    setSearchInput(val)
    debouncedSearch(val)
  }, [debouncedSearch])

  const handleUsersChange = useCallback(vals => {
    setSelectedUsers(vals)
    setCurrentPage(1)
    fetchLogs({
      pageNum: 1,
      searchValue: searchInput || null,
      sd: startDate,
      ed: endDate,
      userIds: getSelectedUserIds(vals),
      sections: selectedSections,
      sortByVal: sortBy,
      sortOrderVal: sortOrder,
    })
  }, [fetchLogs, searchInput, startDate, endDate, selectedSections, sortBy, sortOrder, getSelectedUserIds])

  const handleSectionsChange = useCallback(vals => {
    setSelectedSections(vals)
    setCurrentPage(1)
    fetchLogs({
      pageNum: 1,
      searchValue: searchInput || null,
      sd: startDate,
      ed: endDate,
      userIds: getSelectedUserIds(selectedUsers),
      sections: vals,
      sortByVal: sortBy,
      sortOrderVal: sortOrder,
    })
  }, [fetchLogs, searchInput, startDate, endDate, selectedUsers, sortBy, sortOrder, getSelectedUserIds])

  const handleStartDateChange = useCallback(date => {
    const endIsInvalid = date && endDate && date > endDate
    const adjustedEnd = endIsInvalid ? null : endDate
    if (endIsInvalid) setEndDate(null)
    setStartDate(date)
    setCurrentPage(1)
    fetchLogs({
      pageNum: 1,
      searchValue: searchInput || null,
      sd: date,
      ed: adjustedEnd,
      userIds: getSelectedUserIds(selectedUsers),
      sections: selectedSections,
      sortByVal: sortBy,
      sortOrderVal: sortOrder,
    })
  }, [fetchLogs, searchInput, endDate, selectedUsers, selectedSections, sortBy, sortOrder, getSelectedUserIds])

  const handleEndDateChange = useCallback(date => {
    setEndDate(date)
    setCurrentPage(1)
    fetchLogs({
      pageNum: 1,
      searchValue: searchInput || null,
      sd: startDate,
      ed: date,
      userIds: getSelectedUserIds(selectedUsers),
      sections: selectedSections,
      sortByVal: sortBy,
      sortOrderVal: sortOrder,
    })
  }, [fetchLogs, searchInput, startDate, selectedUsers, selectedSections, sortBy, sortOrder, getSelectedUserIds])

  const handleSort = (column, direction) => {
    const field = column.sortField || ''
    setSortBy(field)
    setSortOrder(direction)
    setCurrentPage(1)
    fetchLogs({
      pageNum: 1,
      searchValue: searchInput || null,
      sd: startDate,
      ed: endDate,
      userIds: getSelectedUserIds(selectedUsers),
      sections: selectedSections,
      sortByVal: field,
      sortOrderVal: direction,
    })
  }

  const handlePageChange = page => {
    setCurrentPage(page)
    fetchLogs({
      pageNum: page,
      searchValue: searchInput || null,
      sd: startDate,
      ed: endDate,
      userIds: getSelectedUserIds(selectedUsers),
      sections: selectedSections,
      sortByVal: sortBy,
      sortOrderVal: sortOrder,
    })
  }

  const totalPages = totalRecords > 0 ? Math.ceil(totalRecords / DEFAULT_PER_PAGE) : 1

  if (!canView) return <AccessDenied />

  return (
    <div className='tw-w-full tw-pb-4'>
      <style>{DATE_PICKER_CSS}</style>

      {/* Page Header */}
      <div className='tw-flex tw-justify-between tw-items-center tw-mb-6'>
        <div>
          <h1 className='tw-text-[20px] tw-font-semibold tw-text-[#111827]'>Audit Logs</h1>
          <p className='tw-text-[14px] tw-text-[#1e293b] tw-tracking-[0.31px]'>
            Track user actions and system events across the platform.
          </p>
        </div>
      </div>

      <div className='tw-flex tw-flex-col tw-gap-0'>
        {/* Shimmer covers the whole card (toolbar + table) while either loading */}
        {isLoading || isDropdownsLoading ? (
          <div className='tw-bg-white tw-rounded-[15px] tw-border tw-border-gray-200 tw-shadow-sm tw-p-4'>
            <ShimmerTable row={8} col={4} />
          </div>
        ) : (
          <div className='tw-bg-white tw-rounded-[15px] tw-border tw-border-gray-200 tw-shadow-sm tw-overflow-hidden'>
            {/* Toolbar */}
            <div className='tw-flex tw-flex-wrap md:tw-flex-nowrap tw-items-center tw-justify-between tw-gap-3 tw-p-4 tw-border-b tw-border-gray-100'>
              {/* Search */}
              <div className='tw-relative tw-flex-shrink-0 tw-w-[220px] tw-border tw-border-[#e0e0e0] tw-rounded-[5px]'>
                <i className='icon-Search tw-text-[20px] tw-absolute tw-left-3 tw-top-1/2 -tw-translate-y-1/2 tw-text-gray-400' />
                <input
                  type='text'
                  placeholder='Search Logs...'
                  value={searchInput}
                  onChange={e => handleSearchChange(e.target.value)}
                  autoComplete='new-password'
                  spellCheck={false}
                  className='tw-w-full tw-h-10 tw-pl-10 tw-pr-8 tw-bg-[#f4f4f4] tw-border-none tw-rounded-[5px] tw-outline-none tw-text-sm focus:tw-border-[#0140c1] focus:tw-ring-2 tw-ring-[#0140c1] focus:tw-outline-none'
                />
                {searchInput && (
                  <button
                    onClick={() => handleSearchChange('')}
                    className='tw-absolute tw-right-3 tw-top-1/2 -tw-translate-y-1/2 tw-text-gray-400 hover:tw-text-gray-600 tw-transition-colors tw-leading-none'
                    title='Clear'
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Filters */}
              <div className='tw-flex tw-flex-wrap tw-items-center tw-gap-2 tw-shrink-0'>
                <MultiSelectDropdown
                  placeholder='All Users'
                  options={userNames}
                  selected={selectedUsers}
                  onChange={handleUsersChange}
                  width='tw-w-56'
                  searchable
                  searchThreshold={6}
                />

                <MultiSelectDropdown
                  placeholder='All Sections'
                  options={sectionOptions}
                  selected={selectedSections}
                  onChange={handleSectionsChange}
                  width='tw-w-44'
                  searchable
                  searchThreshold={6}
                  displayTransform={titleCase}
                />

                <DatePicker
                  selected={startDate}
                  onChange={handleStartDateChange}
                  selectsStart
                  startDate={startDate}
                  endDate={endDate}
                  dateFormat='dd/MM/yyyy'
                  placeholderText='Start Date'
                  isClearable={!!startDate}
                  showMonthDropdown
                  showYearDropdown
                  dropdownMode='select'
                  scrollableYearDropdown
                  yearDropdownItemNumber={15}
                  popperClassName='rdp-audit'
                  wrapperClassName='rdp-audit-wrap'
                  className='tw-w-full tw-h-10 tw-px-3 tw-border tw-border-gray-300 tw-rounded-md tw-text-[13px] tw-outline-none tw-bg-white hover:tw-border-gray-400 tw-cursor-pointer tw-transition-colors'
                />

                <DatePicker
                  selected={endDate}
                  onChange={handleEndDateChange}
                  selectsEnd
                  startDate={startDate}
                  endDate={endDate}
                  minDate={startDate}
                  dateFormat='dd/MM/yyyy'
                  placeholderText='End Date'
                  isClearable={!!endDate}
                  showMonthDropdown
                  showYearDropdown
                  dropdownMode='select'
                  scrollableYearDropdown
                  yearDropdownItemNumber={15}
                  popperClassName='rdp-audit'
                  wrapperClassName='rdp-audit-wrap'
                  className='tw-w-full tw-h-10 tw-px-3 tw-border tw-border-gray-300 tw-rounded-md tw-text-[13px] tw-outline-none tw-bg-white hover:tw-border-gray-400 tw-cursor-pointer tw-transition-colors'
                />
              </div>
            </div>

            {/* Table */}
            <div className='tw-overflow-x-auto'>
              {data.length === 0 ? (
                <EmptyDataView />
              ) : (
                <StyleSheetManager shouldForwardProp={shouldForwardProp}>
                  <DataTable
                    columns={columns}
                    data={data}
                    customStyles={tableCustomStyles}
                    sortIcon={sortIcon}
                    sortServer={true}
                    onSort={handleSort}
                    pagination={false}
                    noDataComponent={<EmptyDataView />}
                  />
                </StyleSheetManager>
              )}
            </div>
          </div>
        )}

        {/* Pagination — always show when data exists (server-side) */}
        {!isLoading && !isDropdownsLoading && data.length > 0 && (
          <div className='tw-flex tw-justify-end tw-items-center tw-gap-2 tw-pt-4'>
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className={`tw-flex tw-items-center tw-w-[110px] tw-gap-4 tw-px-2 tw-py-2 tw-rounded-md tw-border tw-transition-colors ${
                currentPage === 1
                  ? 'tw-bg-gray-50 tw-text-gray-400 tw-border-gray-200 tw-cursor-not-allowed'
                  : 'tw-bg-white tw-text-gray-700 tw-border-gray-300 hover:tw-bg-gray-50'
              }`}
            >
              <i className='icon-Previous tw-text-[16px]' />
              <span className='tw-text-[13px]'>Previous</span>
            </button>

            {[...Array(totalPages)].map((_, i) => {
              const page = i + 1
              const isActive = currentPage === page
              const shouldShow =
                page === 1 ||
                page === totalPages ||
                (page >= currentPage - 1 && page <= currentPage + 1)
              const showLeftEllipsis = page === currentPage - 2 && currentPage > 3
              const showRightEllipsis = page === currentPage + 2 && currentPage < totalPages - 2

              if (shouldShow) {
                return (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`tw-w-9 tw-h-9 tw-rounded-md tw-text-sm tw-font-medium tw-border tw-transition-all ${
                      isActive
                        ? 'tw-bg-[#48f] tw-text-white tw-border-[#48f]'
                        : 'tw-bg-white tw-text-gray-600 tw-border-gray-300 hover:tw-bg-gray-50'
                    }`}
                  >
                    {page}
                  </button>
                )
              }

              if (showLeftEllipsis || showRightEllipsis) {
                return <span key={`ellipsis-${page}`} className='tw-px-1 tw-text-gray-500'>...</span>
              }

              return null
            })}

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className={`tw-flex tw-items-center tw-justify-center tw-gap-6 tw-text-center tw-px-4 tw-py-2 tw-rounded-md tw-border tw-w-[105px] tw-transition-colors ${
                currentPage === totalPages
                  ? 'tw-bg-gray-50 tw-text-gray-400 tw-border-gray-200 tw-cursor-not-allowed'
                  : 'tw-bg-white tw-text-gray-700 tw-border-gray-300 hover:tw-bg-gray-50'
              }`}
            >
              <span className='tw-text-[13px] tw-pl-6'>Next</span>
              <i className='icon-Next tw-text-[16px]' />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default AuditLogs
