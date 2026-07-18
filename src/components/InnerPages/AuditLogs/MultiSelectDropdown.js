import React, { useState, useRef, useEffect, useMemo } from 'react'
import ReactDOM from 'react-dom'
import { ChevronDown, Check } from 'lucide-react'

// Multi-select dropdown:
//   - "All X" clear option at top
//   - Opens downward via portal with correct fixed positioning (viewport-relative, no scrollY offset)
//   - Closes on scroll/resize to prevent positional drift
//   - displayTransform: optional fn to render option labels in different case
const MultiSelectDropdown = ({
  options = [],
  selected = [],
  onChange,
  placeholder = 'Select',
  width = 'tw-w-44',
  searchable = false,
  searchThreshold = 6,
  displayTransform = null,
}) => {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const btnRef = useRef(null)
  const menuRef = useRef(null)
  const [pos, setPos] = useState({ top: 0, left: 0, width: 0 })
  const selectedSet = useMemo(() => new Set(selected), [selected])

  const filtered = useMemo(() =>
    search ? options.filter(o => o.toLowerCase().includes(search.toLowerCase())) : options,
    [options, search]
  )

  const handleOpen = () => {
    if (!open && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect()
      setPos({
        top: rect.bottom + 4,
        left: rect.left,
        width: Math.max(rect.width, 200),
      })
    }
    setOpen(p => !p)
  }

  // Close on page scroll/resize — but NOT when scrolling inside the dropdown menu itself
  useEffect(() => {
    if (!open) return
    const close = e => {
      if (menuRef.current && menuRef.current.contains(e.target)) return
      setOpen(false)
      setSearch('')
    }
    window.addEventListener('scroll', close, true)
    window.addEventListener('resize', close)
    return () => {
      window.removeEventListener('scroll', close, true)
      window.removeEventListener('resize', close)
    }
  }, [open])

  // Close on click outside
  useEffect(() => {
    if (!open) { setSearch(''); return }
    const handler = e => {
      if (btnRef.current?.contains(e.target) || menuRef.current?.contains(e.target)) return
      setOpen(false)
      setSearch('')
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const toggle = val => {
    const next = selectedSet.has(val)
      ? selected.filter(s => s !== val)
      : [...selected, val]
    onChange(next)
  }

  const display = val => (displayTransform ? displayTransform(val) : val)

  const triggerLabel = useMemo(() => {
    if (selected.length === 0) return placeholder
    if (selected.length === 1) return display(selected[0])
    return `+${selected.length} selected`
  }, [selected, placeholder, displayTransform])

  const hasSelected = selected.length > 0
  const showSearch = searchable && options.length > searchThreshold

  return (
    <>
      <button
        ref={btnRef}
        type='button'
        onClick={handleOpen}
        className={`tw-flex tw-items-center tw-justify-between tw-gap-1 tw-h-10 tw-px-3 tw-border tw-rounded-md tw-transition-all tw-duration-200 tw-bg-white ${width} ${hasSelected ? 'tw-border-[#0140c1]' : 'tw-border-gray-300 hover:tw-border-gray-400'}`}
      >
        <span className={`tw-truncate tw-text-[13px] ${hasSelected ? 'tw-text-gray-900 tw-font-medium' : 'tw-text-gray-500'}`}>
          {triggerLabel}
        </span>
        <ChevronDown className={`tw-text-gray-400 tw-flex-shrink-0 tw-w-4 tw-h-4 tw-transition-transform tw-duration-150 ${open ? 'tw-rotate-180' : ''}`} />
      </button>

      {open && ReactDOM.createPortal(
        <div
          ref={menuRef}
          className='tw-fixed tw-bg-white tw-border tw-border-gray-200 tw-rounded-lg tw-shadow-xl tw-overflow-hidden'
          style={{ top: pos.top, left: pos.left, width: pos.width, maxHeight: 300, zIndex: 99999 }}
        >
          {showSearch && (
            <div className='tw-px-3 tw-py-2 tw-border-b tw-border-gray-100 tw-bg-white'>
              <input
                autoFocus
                type='text'
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder='Search...'
                className='tw-w-full tw-text-[13px] tw-outline-none tw-border tw-border-gray-200 tw-rounded tw-px-2.5 tw-py-1.5 focus:tw-border-[#0140c1] tw-transition-colors'
              />
            </div>
          )}
          <div className='tw-overflow-y-auto' style={{ maxHeight: showSearch ? 240 : 270, scrollbarWidth: 'thin', scrollbarColor: '#c7d2fe transparent' }}>
            {/* "All X" clear option — always at top, not filtered by search */}
            {!search && (
              <div
                onClick={() => { onChange([]); setOpen(false) }}
                className={`tw-flex tw-items-center tw-gap-2.5 tw-px-3 tw-py-2.5 tw-cursor-pointer tw-select-none tw-transition-colors ${selected.length === 0 ? 'tw-bg-blue-50' : 'hover:tw-bg-gray-50'}`}
              >
                <span className={`tw-w-[17px] tw-h-[17px] tw-rounded tw-flex-shrink-0 tw-flex tw-items-center tw-justify-center tw-border-[1.5px] tw-transition-colors ${selected.length === 0 ? 'tw-bg-[#0140c1] tw-border-[#0140c1]' : 'tw-border-gray-300 tw-bg-white'}`}>
                  {selected.length === 0 && <Check className='tw-w-[11px] tw-h-[11px] tw-text-white' strokeWidth={3} />}
                </span>
                <span className='tw-text-[13px] tw-font-medium tw-text-gray-800'>{placeholder}</span>
              </div>
            )}
            {!search && options.length > 0 && <div className='tw-border-t tw-border-gray-100 tw-mx-0' />}

            {filtered.length === 0 ? (
              <div className='tw-px-4 tw-py-3 tw-text-[13px] tw-text-gray-400 tw-text-center'>No options</div>
            ) : filtered.map(opt => {
              const checked = selectedSet.has(opt)
              return (
                <div
                  key={opt}
                  onClick={() => toggle(opt)}
                  className='tw-flex tw-items-center tw-gap-2.5 tw-px-3 tw-py-2.5 tw-cursor-pointer hover:tw-bg-blue-50 tw-transition-colors tw-select-none'
                >
                  <span className={`tw-w-[17px] tw-h-[17px] tw-rounded tw-flex-shrink-0 tw-flex tw-items-center tw-justify-center tw-border-[1.5px] tw-transition-colors ${checked ? 'tw-bg-[#0140c1] tw-border-[#0140c1]' : 'tw-border-gray-300 tw-bg-white'}`}>
                    {checked && <Check className='tw-w-[11px] tw-h-[11px] tw-text-white' strokeWidth={3} />}
                  </span>
                  <span className='tw-text-[13px] tw-text-gray-800 tw-truncate'>{display(opt)}</span>
                </div>
              )
            })}
          </div>
        </div>,
        document.body
      )}
    </>
  )
}

export default MultiSelectDropdown
