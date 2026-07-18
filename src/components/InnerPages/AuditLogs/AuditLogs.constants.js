import React from 'react'

export const DEFAULT_PER_PAGE = 10
export const DEBOUNCE_DELAY = 500

const RDT_INTERNAL_PROPS = ['center', 'button']
export const shouldForwardProp = prop => !RDT_INTERNAL_PROPS.includes(prop)

export const tableCustomStyles = {
  header: { style: { display: 'none' } },
  headRow: {
    style: {
      backgroundColor: '#fafafa',
      borderTop: '1px solid #e5e7eb',
      borderBottom: '1px solid #e5e7eb',
      minHeight: '48px',
    },
  },
  headCells: {
    style: {
      fontSize: '13px',
      fontWeight: '600',
      color: '#6e7178',
      textTransform: 'uppercase',
      letterSpacing: '0.04em',
      paddingLeft: '16px',
      paddingRight: '16px',
    },
  },
  rows: {
    style: {
      minHeight: '58px',
      borderBottom: '1px solid #EAECF0',
      transition: 'background-color 0.15s ease',
      '&:last-of-type': { borderBottom: 'none' },
      '&:hover': { backgroundColor: '#f8faff', cursor: 'default' },
    },
  },
  cells: {
    style: {
      fontSize: '14px',
      color: '#585858',
      paddingLeft: '16px',
      paddingRight: '16px',
    },
  },
}

export const sortIcon = (
  <span className='tw-flex tw-flex-col tw-items-center tw-leading-none tw-ml-1 tw-mt-[2px]'>
    <span className='tw-w-0 tw-h-0 tw-border-l-[4px] tw-border-l-transparent tw-border-r-[4px] tw-border-r-transparent tw-border-b-[5px] tw-border-b-gray-500' />
    <span className='tw-w-0 tw-h-0 tw-mt-[3px] tw-border-l-[4px] tw-border-l-transparent tw-border-r-[4px] tw-border-r-transparent tw-border-t-[5px] tw-border-t-gray-500' />
  </span>
)

// "RESET_PAGE" / "RESET PAGE" → "Reset Page" — handles underscores + all-caps
export const titleCase = str => {
  if (!str) return '-'
  return str
    .toLowerCase()
    .replace(/_/g, ' ')
    .split(' ')
    .map(w => (w ? w[0].toUpperCase() + w.slice(1) : ''))
    .join(' ')
}

// Pure helper — no closure over state
export const toDateStr = date =>
  date
    ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
    : null

export const DATE_PICKER_CSS = `
  .rdp-audit .react-datepicker__header{background-color:#0140c1!important;border-bottom:none!important;border-radius:10px 10px 0 0;padding:12px 10px 8px}
  .rdp-audit .react-datepicker{border:1px solid #e2e8f0!important;border-radius:12px!important;box-shadow:0 8px 24px rgba(1,64,193,.15)!important;overflow:hidden;font-family:inherit}
  .rdp-audit .react-datepicker__current-month{color:#fff!important;font-size:14px;font-weight:600;margin-bottom:8px}
  .rdp-audit .react-datepicker__day-name{color:rgba(255,255,255,.8)!important;font-size:11px;font-weight:500}
  .rdp-audit .react-datepicker__month-select,.rdp-audit .react-datepicker__year-select{background-color:rgba(255,255,255,.18)!important;color:#fff!important;border:1px solid rgba(255,255,255,.4)!important;border-radius:6px!important;padding:4px 10px!important;font-size:13px!important;font-weight:600!important;cursor:pointer;outline:none}
  .rdp-audit .react-datepicker__month-select option,.rdp-audit .react-datepicker__year-select option{background:#fff!important;color:#333!important}
  .rdp-audit .react-datepicker__navigation-icon::before{border-color:rgba(255,255,255,.9)!important}
  .rdp-audit .react-datepicker__day{border-radius:6px!important;font-size:13px;color:#1e293b;transition:background .1s,color .1s}
  .rdp-audit .react-datepicker__day:hover{background-color:#dbeafe!important;color:#0140c1!important}
  .rdp-audit .react-datepicker__day--selected,.rdp-audit .react-datepicker__day--keyboard-selected{background-color:#0140c1!important;color:#fff!important;font-weight:600}
  .rdp-audit .react-datepicker__day--today{font-weight:700;color:#0140c1}
  .rdp-audit .react-datepicker__day--today.react-datepicker__day--selected{color:#fff!important}
  .rdp-audit .react-datepicker__day--outside-month{color:#cbd5e1!important}
  .rdp-audit .react-datepicker__day--disabled{color:#cbd5e1!important;cursor:not-allowed}
  .rdp-audit-wrap{width:9rem!important;min-width:9rem;max-width:9rem;flex-shrink:0}
  .rdp-audit-wrap .react-datepicker-wrapper{display:block!important;width:100%!important}
  .rdp-audit-wrap .react-datepicker__input-container{display:block!important;width:100%!important}
  .rdp-audit-wrap .react-datepicker__close-icon{right:6px}
  .rdp-audit-wrap .react-datepicker__close-icon::after{background-color:#0140c1!important;width:14px!important;height:14px!important;font-size:9px!important}
`
