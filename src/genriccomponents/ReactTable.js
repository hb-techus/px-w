import React, { useMemo, useState } from 'react'
import DataTable from 'react-data-table-component'
import { StyleSheetManager } from 'styled-components'
import NoDataFound from './NoDataFound'

const RDT_INTERNAL_PROPS = ['center', 'button']
const shouldForwardProp = (prop) => !RDT_INTERNAL_PROPS.includes(prop)

export const TruncatedCell = ({ value, className = '' }) => (
  <span
    title={value ?? ''}
    className={`tw-truncate tw-block tw-max-w-full tw-cursor-default ${className}`}
  >
    {value ?? '—'}
  </span>
)

const CustomDataTable = ({
  data = [],
  columns = [],
  noWrapper = false,
  expandableRowsComponent = null,
  enablePagination = true,
  defaultPerPage = 10,
  noDataComponent,
  customStyles,
  searchTerm = '',
  onSearchChange,
  searchPlaceholder = 'Search',
  noDataTitle = 'No Records Found',
  filterComponent = null
}) => {
  const [expandedRow, setExpandedRow] = useState(null)
  const [sortState, setSortState] = useState({ column: null, direction: null })
  const isUnsorted = !sortState.direction


  // ── External pagination state ──
  const [currentPage, setCurrentPage] = useState(1);
  const compareValues = (aVal, bVal, direction) => {
    const a = aVal === null || aVal === undefined ? '' : aVal
    const b = bVal === null || bVal === undefined ? '' : bVal
    const aNum = parseFloat(a)
    const bNum = parseFloat(b)
    const bothNumeric =
      !Number.isNaN(aNum) &&
      !Number.isNaN(bNum) &&
      String(a).trim() !== '' &&
      String(b).trim() !== ''
    if (bothNumeric) return direction === 'asc' ? aNum - bNum : bNum - aNum
    const aStr = String(a).toLowerCase()
    const bStr = String(b).toLowerCase()
    if (aStr < bStr) return direction === 'asc' ? -1 : 1
    if (aStr > bStr) return direction === 'asc' ? 1 : -1
    return 0
  }

  const getCellValue = (col, row) => {
    if (typeof col?.selector === 'function') {
      try {
        return col.selector(row)
      } catch {
        return undefined
      }
    }
    if (col?.sortField) return row[col.sortField]
    if (typeof col?.selector === 'string') return row[col.selector]
    if (col?.name && Object.prototype.hasOwnProperty.call(row, col.name))
      return row[col.name]
    return undefined
  }
  // const totalPages = Math.ceil(data.length / defaultPerPage)
  // const paginatedData = useMemo(() => {
  //   const start = (currentPage - 1) * defaultPerPage
  //   return data.slice(start, start + defaultPerPage)
  // }, [data, currentPage, defaultPerPage])

  const sortedData = useMemo(() => {
    if (!sortState.column || !sortState.direction) return data; // If no sorting state, return original data
    const col = sortState.column;
    return data
      .map((row, idx) => ({ row, idx }))  // Map rows to keep track of original index for stable sorting
      .sort((a, b) => {
        const cmp = compareValues(
          getCellValue(col, a.row),
          getCellValue(col, b.row),
          sortState.direction
        );
        return cmp !== 0 ? cmp : a.idx - b.idx; // Use index for tie-breaking to maintain original order
      })
      .map(x => x.row); // Return the sorted rows
  }, [data, sortState]);

  const totalPages = Math.ceil(sortedData.length / defaultPerPage); // Calculate total pages based on sorted data
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * defaultPerPage; // Calculate starting index for current page
    return sortedData.slice(start, start + defaultPerPage); // Return the rows for the current page
  }, [sortedData, currentPage, defaultPerPage]);

  // Reset to page 1 when data changes (e.g. search/filter)
  React.useEffect(() => {
    setCurrentPage(1)
  }, [data.length])

  // --------------- Sorting helper ----------------




  // --------------- Pinned + sorted rows ---------------
  const pinnedRow = paginatedData.find(r => r.role_name === 'Admin')
  const otherRows = paginatedData.filter(r => r.role_name !== 'Admin')

  const sortedOtherRows = useMemo(() => {
    const rowsCopy = [...otherRows]
    if (!sortState.column || !sortState.direction) return rowsCopy
    const col = sortState.column
    return rowsCopy
      .map((r, idx) => ({ r, idx }))
      .sort((aObj, bObj) => {
        const cmp = compareValues(
          getCellValue(col, aObj.r),
          getCellValue(col, bObj.r),
          sortState.direction
        )
        return cmp !== 0 ? cmp : aObj.idx - bObj.idx
      })
      .map(x => x.r)
  }, [otherRows, sortState])

  const finalData = pinnedRow
    ? [pinnedRow, ...sortedOtherRows]
    : sortedOtherRows

  // --------------- Sort icon ---------------
  const sortIcon = (
    <span className='tw-flex tw-flex-col tw-items-center tw-leading-none tw-ml-1 tw-mt-[2px]'>
      <span
        className={`tw-w-0 tw-h-0 tw-border-l-[4px] tw-border-l-transparent tw-border-r-[4px] tw-border-r-transparent tw-border-b-[5px] ${isUnsorted
          ? 'tw-border-b-black'
          : sortState.direction === 'asc'
            ? 'tw-border-b-black'
            : 'tw-border-b-gray-400'
          }`}
      />
      <span
        className={`tw-w-0 tw-h-0 tw-mt-[3px] tw-border-l-[4px] tw-border-l-transparent tw-border-r-[4px] tw-border-r-transparent tw-border-t-[5px] ${isUnsorted
          ? 'tw-border-t-black'
          : sortState.direction === 'desc'
            ? 'tw-border-t-black'
            : 'tw-border-t-gray-400'
          }`}
      />
    </span>
  )

  // --------------- External Pagination UI ---------------
  // const getVisiblePages = () => {
  //   const pages = []
  //   if (totalPages <= 5) {
  //     for (let i = 1; i <= totalPages; i++) pages.push(i)
  //   } else {
  //     let start = Math.max(1, currentPage - 2)
  //     let end = Math.min(totalPages, start + 4)
  //     if (end - start < 4) start = Math.max(1, end - 4)
  //     for (let i = start; i <= end; i++) pages.push(i)
  //   }
  //   return pages
  // }

  void finalData
  // --------------- Render ---------------
  return (
    <div className='tw-flex tw-flex-col tw-gap-0'>
      {/* White card: search + filter + table */}
      <div className={noWrapper
        ? 'tw-bg-white tw-overflow-hidden'   // ← no rounded, no border, no shadow
        : 'tw-bg-white tw-rounded-[15px] tw-border tw-border-gray-200 tw-shadow-sm tw-overflow-hidden'
      }>
        {/* Search & Filter Row — only rendered if onSearchChange or filterComponent is provided */}
        {(onSearchChange || filterComponent) && (
          <div className='tw-flex tw-flex-wrap md:tw-flex-nowrap tw-items-center tw-justify-between tw-gap-4 tw-p-4 tw-border-b tw-border-gray-100'>
            {/* Search Input */}
            {onSearchChange && (
              <div className='tw-relative tw-w-full md:tw-w-auto md:tw-flex-1 tw-max-w-md tw-border tw-border-[#e0e0e0] tw-rounded-[5px]'>
                <i className='icon-Search tw-text-[20px] tw-absolute tw-left-3 tw-top-1/2 -tw-translate-y-1/2 tw-text-gray-400'></i>
                <input
                  type='text'
                  placeholder={searchPlaceholder}
                  value={searchTerm}
                  onChange={e => onSearchChange(e.target.value)}
                  className='tw-w-full tw-h-10 tw-pl-10 tw-pr-8 tw-bg-[#f4f4f4] tw-border-none tw-rounded-[5px] tw-outline-none tw-text-sm tw-border-[#dcdbdb] focus:tw-border-[#0140c1] focus:tw-ring-2 tw-ring-[#0140c1] focus:tw-outline-none'
                />
                {/* ── X clear button — only visible when there is text ── */}
                {searchTerm && (
                  <button
                    onClick={() => onSearchChange('')}
                    className='tw-absolute tw-right-3 tw-top-1/2 -tw-translate-y-1/2 tw-text-gray-400 hover:tw-text-gray-600 tw-transition-colors tw-leading-none'
                    title='Clear search'
                  >
                    ✕
                  </button>
                )}
              </div>
            )}

            {/* Filter dropdowns from parent */}
            {filterComponent && (
              <div className='tw-flex tw-flex-wrap tw-items-center tw-gap-3 tw-shrink-0'>
                {filterComponent}
              </div>
            )}
          </div>
        )}

        {/* Table — NO internal pagination */}
        <div className='tw-overflow-x-auto'>
          {data.length === 0 ? (
            noDataComponent ? (
              <>{noDataComponent}</>
            ) : (
              <NoDataFound
                title={noDataTitle}
              />
            )
          ) : (
            <StyleSheetManager shouldForwardProp={shouldForwardProp}>
              <DataTable
                columns={columns}
                customStyles={customStyles}
                data={paginatedData}
                sortIcon={sortIcon}
                sortServer={false}
                onSort={(col, dir) =>
                  setSortState({ column: col, direction: dir })
                }
                onRowClicked={row =>
                  setExpandedRow(prev => (prev === row.id ? null : row.id))
                }
                expandableRows={!!expandableRowsComponent}
                expandableRowExpanded={row => row.id === expandedRow}
                expandableRowsComponent={expandableRowsComponent}
                pagination={false}
                noDataComponent={noDataComponent}
              />
            </StyleSheetManager>
          )}
        </div>
      </div>

      {/* ── Pagination OUTSIDE the white card ── */}
      {enablePagination && data.length > defaultPerPage && (
        <div className='tw-flex tw-justify-end tw-items-center tw-gap-2 tw-pt-4'>
          {/* Previous */}
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className={`tw-flex tw-items-center tw-w-[110px]  tw-gap-4 tw-px-2 tw-py-2 tw-rounded-md tw-border tw-transition-colors ${currentPage === 1
              ? 'tw-bg-gray-50 tw-text-gray-400 tw-border-gray-200 tw-cursor-not-allowed'
              : 'tw-bg-white tw-text-gray-700 tw-border-gray-300 hover:tw-bg-gray-50'
              }`}
          >
            <i className='icon-Previous tw-text-[16px]'></i>
            <span className='tw-text-[13px]'>Previous</span>
          </button>

          {/* Page numbers */}
          {/* <div className='tw-flex tw-gap-1'>
            {getVisiblePages().map(page => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`tw-w-9 tw-h-9 tw-rounded-md tw-text-sm tw-font-medium tw-border tw-transition-all ${
                  page === currentPage
                    ? 'tw-bg-[#0140c1] tw-text-white tw-border-[#0140c1]'
                    : 'tw-bg-white tw-text-gray-600 tw-border-gray-300 hover:tw-bg-gray-50'
                }`}
              >
                {page}
              </button>
            ))}
          </div> */}
          {[...Array(totalPages)].map((_, i) => {
            const page = i + 1;
            const isActive = currentPage === page;

            const shouldShow =
              page === 1 ||
              page === totalPages ||
              (page >= currentPage - 1 &&
                page <= currentPage + 1);

            const shouldShowLeftEllipsis =
              page === currentPage - 2 && currentPage > 3;

            const shouldShowRightEllipsis =
              page === currentPage + 2 &&
              currentPage < totalPages - 2;

            if (shouldShow) {
              return (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`tw-w-9 tw-h-9 tw-rounded-md tw-text-sm tw-font-medium tw-border tw-transition-all  ${isActive
                    ? 'tw-bg-[#48f] tw-text-white tw-rounded-[3px] tw-border-[#48f]'
                    : 'tw-bg-white tw-text-gray-600 tw-border-gray-300 hover:tw-bg-gray-50'
                    }`}
                >
                  {page}
                </button>
              );
            }

            if (
              shouldShowLeftEllipsis ||
              shouldShowRightEllipsis
            ) {
              return (
                <span
                  key={`ellipsis-${page}`}
                  className="tw-px-1 tw-text-gray-500"
                >
                  ...
                </span>
              );
            }

            return null;
          })}

          {/* Next */}
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className={`tw-flex tw-items-center tw-justify-center tw-gap-6 tw-text-center tw-px-4 tw-py-2 tw-rounded-md tw-border tw-w-[105px] tw-transition-colors ${currentPage === totalPages
              ? 'tw-bg-gray-50 tw-text-gray-400 tw-border-gray-200 tw-cursor-not-allowed'
              : 'tw-bg-white tw-text-gray-700 tw-border-gray-300 hover:tw-bg-gray-50'
              }`}
          >
            <span className='tw-text-[13px] tw-pl-6'>Next</span>
            <i className='icon-Next tw-text-[16px]'></i>
          </button>
        </div>
      )}
    </div>
  )
}

export default CustomDataTable
