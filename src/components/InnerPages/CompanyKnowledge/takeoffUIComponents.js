import React, { useState, useEffect, useRef } from 'react';
import Tippy from '@tippyjs/react'
import 'tippy.js/dist/tippy.css'
import { createPortal } from 'react-dom'

// ─── TextWithTooltip ─────────────────────────────────────────────────────────────
export const TextWithTooltip = ({
    text,
    className = '',
    style = {},
}) => {
    const spanRef = useRef(null);

    const isTruncated = () => {
        const span = spanRef.current;
        if (!span) return false;

        // Create an invisible clone with NO overflow constraints
        // to measure the true natural text width
        const clone = document.createElement('span');
        clone.style.cssText = `
            position: fixed;
            visibility: hidden;
            white-space: nowrap;
            font: ${getComputedStyle(span).font};
            letter-spacing: ${getComputedStyle(span).letterSpacing};
            padding: 0;
            margin: 0;
            border: none;
            top: -9999px;
            left: -9999px;
            max-width: none;
            width: auto;
        `;
        clone.textContent = text;
        document.body.appendChild(clone);
        const naturalWidth = clone.getBoundingClientRect().width;
        document.body.removeChild(clone);

        // Compare natural text width vs available container width
        const containerWidth = span.parentElement?.clientWidth ?? span.clientWidth;
        return naturalWidth > containerWidth;
    };

    if (!text) return null;

    return (
        <div style={{ width: '100%', minWidth: 0, overflow: 'hidden' }}>
            <Tippy
                content={text}
                placement="top"
                theme="custom"
                appendTo={document.body}
                onShow={() => {
                    if (!isTruncated()) return false;
                }}
            >
                <span
                    ref={spanRef}
                    className={`tw-block tw-truncate ${className}`}
                    style={{
                        display: 'block',
                        width: '100%',
                        minWidth: 0,
                        overflow: 'hidden',
                        whiteSpace: 'nowrap',
                        textOverflow: 'ellipsis',
                        ...style,
                    }}
                >
                    {text}
                </span>
            </Tippy>
        </div>
    );
};

// ─── FieldsBadge ─────────────────────────────────────────────────────────────
export const FieldsBadge = ({ count, extra }) => (
    <div className='tw-flex tw-items-center tw-gap-2'>
        <span className='tw-text-[11px] tw-font-semibold tw-bg-[#F2F4F7] tw-text-[#667085] tw-px-2 tw-py-0.5 tw-rounded-[5px] tw-border tw-border-[#E4E7EC]'>
            {count} {count === 1 ? 'field' : 'fields'}
        </span>
        {extra && (
            <span className='tw-text-[11px] tw-font-semibold tw-bg-[#F2F4F7] tw-text-[#667085] tw-px-2 tw-py-0.5 tw-rounded-[5px] tw-border tw-border-[#E4E7EC]'>
                {extra}
            </span>
        )}
    </div>
)

// ─── SaveBtn ──────────────────────────────────────────────────────────────────
export const SaveBtn = ({ onClick, saving, disabled }) => (
    <button
        onClick={e => { e.stopPropagation(); onClick() }}
        disabled={saving || disabled}
        className='tw-flex tw-items-center tw-gap-2 tw-bg-[#0140C1] hover:tw-bg-blue-700 tw-text-white tw-text-[14px] tw-font-semibold tw-px-5 tw-py-[9px] tw-border-0 tw-transition-all tw-whitespace-nowrap'
        style={{
            borderRadius: 5,
            opacity: (saving || disabled) ? 0.5 : 1,
            cursor: (saving || disabled) ? 'not-allowed' : 'pointer',
        }}
    >
        Save Changes
    </button>
)

// ─── NumericInput ─────────────────────────────────────────────────────────────
export const NumericInput = ({ value, onChange, min, max, suffix, readOnly = false }) => {
    const fmt = v => {
        if (v === null || v === undefined || v === '') return ''
        const n = Number(v)
        return isNaN(n) ? '' : String(n)
    }

    const [display, setDisplay] = useState(fmt(value))
    useEffect(() => { setDisplay(fmt(value)) }, [value])

    const commit = raw => {
        const t = raw.trim()
        if (t === '' || t === '-') { setDisplay(''); onChange(''); return }
        let n = parseFloat(t)
        if (isNaN(n)) { setDisplay(''); onChange(''); return }
        if (max !== undefined && max !== null) n = Math.min(max, n)
        if (min !== undefined && min !== null) n = Math.max(min, n)
        n = Math.round(n * 10000) / 10000
        setDisplay(fmt(n))
        onChange(n)
    }

    const handleChange = e => {
        if (readOnly) return
        const raw = e.target.value
        if (raw === '') { setDisplay(''); onChange(''); return }
        if (!/^-?\d*\.?\d*$/.test(raw)) return
        const n = parseFloat(raw)
        if (!isNaN(n) && max !== undefined && max !== null && n > max) return
        setDisplay(raw)
        if (!isNaN(n)) onChange(n)
    }

    return (
        <div className='tw-relative'>
            <input
                type='text'
                inputMode='decimal'
                value={display}
                readOnly={readOnly}
                onChange={handleChange}
                onBlur={e => !readOnly && commit(e.target.value)}
                onKeyDown={e => { if (!readOnly && e.key === 'Enter') commit(e.target.value) }}
                className={`tw-w-full tw-h-10 tw-border tw-border-[#D0D5DD] tw-rounded-[8px] tw-text-[14px] tw-text-[#101828] focus:tw-outline-none focus:tw-border-blue-500 ${readOnly ? 'tw-bg-[#F9FAFB] tw-cursor-default' : 'tw-bg-white'}`}
                style={{ paddingLeft: 12, paddingRight: suffix ? 38 : 12, boxSizing: 'border-box' }}
            />
            {suffix && (
                <span className='tw-absolute tw-right-3 tw-top-1/2 -tw-translate-y-1/2 tw-text-[13px] tw-text-[#667085] tw-pointer-events-none tw-select-none'>
                    {suffix}
                </span>
            )}
        </div>
    )
}

// ─── GeneralNumericInput ──────────────────────────────────────────────────────
export const GeneralNumericInput = ({ value, onChange, suffix }) => {
    const fmt = v => (v === '' || v === null || v === undefined) ? '' : String(Number(v))

    const [display, setDisplay] = useState(fmt(value))
    useEffect(() => { setDisplay(fmt(value)) }, [value])

    const commit = raw => {
        const t = raw.trim()
        if (t === '') { setDisplay(''); onChange(''); return }
        let n = parseFloat(t)
        if (isNaN(n)) { setDisplay(''); onChange(''); return }
        n = Math.min(99, Math.max(0, n))
        setDisplay(String(n))
        onChange(n)
    }

    const handleChange = e => {
        const raw = e.target.value
        if (raw !== '' && !/^\d*\.?\d*$/.test(raw)) return
        const n = parseFloat(raw)
        if (!isNaN(n) && n > 99) return
        setDisplay(raw)
        if (raw === '') onChange('')
        else if (!isNaN(n)) onChange(n)
    }

    return (
        <div className='tw-relative'>
            <input
                type='text'
                inputMode='numeric'
                value={display}
                onChange={handleChange}
                onBlur={e => commit(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') commit(e.target.value) }}
                className='tw-w-full tw-h-10 tw-border tw-border-[#D0D5DD] tw-rounded-[8px] tw-text-[14px] tw-text-[#101828] tw-bg-white focus:tw-outline-none focus:tw-border-blue-500'
                style={{ paddingLeft: 12, paddingRight: suffix ? 38 : 12, boxSizing: 'border-box' }}
            />
            {suffix && (
                <span className='tw-absolute tw-right-3 tw-top-1/2 -tw-translate-y-1/2 tw-text-[13px] tw-text-[#667085] tw-pointer-events-none tw-select-none'>
                    {suffix}
                </span>
            )}
        </div>
    )
}

// ─── AccordionRow ─────────────────────────────────────────────────────────────
export const AccordionRow = ({ label, fieldCount, extraBadge, isOpen, onToggle, children }) => {
    const rowRef = useRef(null)

    const handleToggle = () => {
        onToggle()
        // If opening, scroll into view after animation
        if (!isOpen) {
            setTimeout(() => {
                rowRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
            }, 50)
        }
    }

    return (
        <div ref={rowRef} className='tw-border tw-border-[#E4E7EC] tw-rounded-[10px] tw-bg-white' style={{ overflow: 'visible' }}>
            <button
                onClick={handleToggle}
                className='tw-w-full tw-flex tw-items-center tw-justify-between tw-px-[18px] tw-py-[14px] tw-bg-transparent tw-border-0 tw-cursor-pointer tw-text-left hover:tw-bg-[#FAFAFA] tw-transition-colors'
                style={{ borderRadius: 10 }}
            >
                <div className='tw-flex tw-items-center tw-gap-2'>
                    <span className='tw-text-[14px] tw-font-semibold tw-text-[#101828]'>{label}</span>
                    <FieldsBadge count={fieldCount} extra={extraBadge} />
                </div>
                <div className='tw-flex tw-items-center tw-justify-center tw-w-[25px] tw-h-[25px] tw-border tw-border-[#75787c] tw-rounded-[5px]'>
                    <i
                        className={`icon-Dropdown tw-inline-block tw-transition-transform tw-duration-300 ${isOpen ? 'tw-rotate-180' : 'tw-rotate-0'}`}
                        style={{ fontSize: '16px', color: '#000' }}
                    />
                </div>
            </button>
            <div style={{ display: isOpen ? 'block' : 'none', overflow: 'visible' }}>
                <div className='tw-border-t tw-border-[#F2F4F7] tw-px-[18px] tw-pt-4 tw-pb-5'>
                    {children}
                </div>
            </div>
        </div>
    )
}

// ─── AccordionGroup ───────────────────────────────────────────────────────────
export const AccordionGroup = ({ items }) => {
    const [openIdx, setOpenIdx] = useState(null)

    return (
        <div className='tw-flex tw-flex-col tw-gap-2'>
            {items.map((item, idx) => (
                <AccordionRow
                    key={item.key ?? idx}
                    label={item.label}
                    fieldCount={item.fieldCount}
                    extraBadge={item.extraBadge}
                    isOpen={openIdx === idx}
                    onToggle={() => setOpenIdx(openIdx === idx ? null : idx)}
                >
                    {item.content}
                </AccordionRow>
            ))}
        </div>
    )
}

// ─── Grid3 ────────────────────────────────────────────────────────────────────
export const Grid3 = ({ children }) => (
    <div
        className='tw-grid tw-gap-x-5 tw-gap-y-5'
        style={{ gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', width: '100%' }}
    >
        {children}
    </div>
)

// ─── TradeGrid — product wider (1.5fr), config fields narrower (0.85fr each) ─
export const TradeGrid = ({ children }) => (
    <div
        className='tw-grid tw-gap-x-5 tw-gap-y-5'
        style={{ gridTemplateColumns: '1.5fr 0.85fr 0.85fr', width: '100%' }}
    >
        {children}
    </div>
)

// ─── Grid4 — NEW for painting / concrete / steel ──────────────────────────────
export const Grid4 = ({ children }) => (
    <div
        className='tw-grid tw-gap-x-5 tw-gap-y-5'
        style={{ gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', width: '100%' }}
    >
        {children}
    </div>
)

// ─── TakeoffSelectDropdown ────────────────────────────────────────────────────
export const TakeoffSelectDropdown = ({ label, options, value, onChange, placeholder = 'Select value' }) => {
    const [open, setOpen] = useState(false)
    const [dropdownPos, setDropdownPos] = useState({ top: 0, bottom: undefined, left: 0, width: 0 })
    const ref = useRef(null)
    const btnRef = useRef(null)
    const menuRef = useRef(null)
    const [highlightedIndex, setHighlightedIndex] = useState(-1)

    const updatePosition = () => {
        if (!btnRef.current) return
        const rect = btnRef.current.getBoundingClientRect()
        const spaceBelow = window.innerHeight - rect.bottom
        const goUp = spaceBelow < 240
        setDropdownPos({
            left: rect.left,
            width: rect.width,
            top: goUp ? undefined : rect.bottom + 4,
            bottom: goUp ? window.innerHeight - rect.top + 4 : undefined,
        })
    }

    useEffect(() => {
        const h = e => {
            // ignore clicks on the trigger and the menu (including scrollbar)
            if (ref.current && ref.current.contains(e.target)) return
            if (menuRef.current && menuRef.current.contains(e.target)) return
            setOpen(false)
        }
        document.addEventListener('mousedown', h)
        return () => document.removeEventListener('mousedown', h)
    }, [])

    useEffect(() => {
        if (!open) return
        updatePosition()
        window.addEventListener('scroll', updatePosition, true)
        window.addEventListener('resize', updatePosition)
        return () => {
            window.removeEventListener('scroll', updatePosition, true)
            window.removeEventListener('resize', updatePosition)
        }
    }, [open])

    useEffect(() => {
        if (!open || highlightedIndex < 0 || !menuRef.current) return
        const item = menuRef.current.children[highlightedIndex]
        item?.scrollIntoView({ block: 'nearest' })
    }, [highlightedIndex, open])

    const handleOpen = () => {
        updatePosition()
        setOpen(v => !v)
        setHighlightedIndex(-1)
    }

    const handleKeyDown = e => {
        if (!open) return
        if (e.key === 'ArrowDown') { e.preventDefault(); setHighlightedIndex(p => Math.min(p + 1, options.length - 1)) }
        if (e.key === 'ArrowUp') { e.preventDefault(); setHighlightedIndex(p => Math.max(p - 1, 0)) }
        if (e.key === 'Enter' && highlightedIndex >= 0) { onChange(options[highlightedIndex].id); setOpen(false) }
        if (e.key === 'Escape') setOpen(false)
    }

    const selected = options.find(o => o.id === value)

    return (
        <div
            ref={ref}
            className='tw-flex tw-flex-col tw-gap-[6px]'
            style={{ position: 'relative', width: '100%', minWidth: 0 }}
            onKeyDown={handleKeyDown}
        >
            <TextWithTooltip
                text={label}
                className='tw-text-[13px] tw-font-medium tw-text-[#344054]'
            />

            <button
                ref={btnRef}
                type='button'
                onClick={handleOpen}
                className='tw-w-full tw-h-10 tw-border tw-bg-white tw-text-left tw-text-[14px] tw-flex tw-items-center tw-justify-between tw-px-3'
                style={{
                    borderColor: open ? '#2563EB' : '#D0D5DD',
                    borderRadius: 8,
                    boxShadow: open ? '0 0 0 3px rgba(37,99,235,0.10)' : 'none',
                    cursor: 'pointer',
                    outline: 'none',
                    transition: 'border-color 0.15s, box-shadow 0.15s',
                }}
            >
                <span style={{ color: selected ? '#101828' : '#9CA3AF', fontSize: 14, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginRight: 8 }}>
                    {selected ? selected.label : placeholder}
                </span>
                <i className='icon-Dropdown' style={{ fontSize: 16, color: '#667085', transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'rotate(0deg)', flexShrink: 0 }} />
            </button>

            {open && options.length > 0 && createPortal(
                <div
                    ref={menuRef}
                    className='takeoff-dropdown-menu tw-bg-white tw-border tw-border-[#D0D5DD] tw-rounded-[8px]'
                    style={{
                        position: 'fixed',
                        left: dropdownPos.left,
                        width: dropdownPos.width,
                        top: dropdownPos.top,
                        bottom: dropdownPos.bottom,
                        zIndex: 99999,
                        boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
                        maxHeight: 220,
                        overflowY: options.length > 4 ? 'auto' : 'visible',
                        overflowX: 'hidden',
                        scrollbarWidth: 'thin',
                        scrollbarColor: '#dee9ff transparent',
                    }}
                >
                    {options.map((opt, idx) => {
                        const isSel = opt.id === value
                        const isHigh = idx === highlightedIndex
                        return (
                            <div
                                key={opt.id}
                                onClick={() => { onChange(opt.id); setOpen(false) }}
                                className='tw-flex tw-items-center tw-gap-2 tw-cursor-pointer tw-text-[14px]'
                                style={{
                                    padding: '10px 16px',
                                    background: isSel ? '#EFF6FF' : isHigh ? '#F9FAFB' : 'transparent',
                                    color: isSel ? '#1D4ED8' : '#101828',
                                    fontWeight: isSel ? 600 : 400,
                                    transition: 'background 0.1s',
                                    userSelect: 'none',
                                }}
                                onMouseEnter={e => { if (!isSel) e.currentTarget.style.background = '#F9FAFB' }}
                                onMouseLeave={e => { if (!isSel) e.currentTarget.style.background = 'transparent' }}
                            >
                                <span style={{ width: 16, flexShrink: 0, color: '#1D4ED8', fontSize: 12 }}>
                                    {isSel ? '✓' : ''}
                                </span>
                                {opt.label}
                            </div>
                        )
                    })}
                </div>,
                document.body
            )}
        </div>
    )
}

// ─── TakeoffNumberInput ───────────────────────────────────────────────────────
export const TakeoffNumberInput = ({ label, value, onChange, unit, min, max, isInteger = false }) => {
    const effectiveMax = (max !== null && max !== undefined) ? Number(max) : 99
    const effectiveMin = (min !== null && min !== undefined) ? Number(min) : 1

    const fmt = v => {
        if (v === null || v === undefined || v === '') return ''
        const n = Number(v)
        if (isNaN(n)) return ''
        return String(isInteger ? Math.round(n) : Math.round(n * 100) / 100)
    }

    const [display, setDisplay] = useState(fmt(value))
    useEffect(() => { setDisplay(fmt(value)) }, [value])

    const commit = raw => {
        const t = raw.trim()
        if (t === '') { setDisplay(''); onChange(''); return }
        let n = parseFloat(t)
        if (isNaN(n)) { setDisplay(fmt(value)); return }
        if (effectiveMax !== undefined) n = Math.min(effectiveMax, n)
        if (effectiveMin !== undefined) n = Math.max(effectiveMin, n)
        n = isInteger ? Math.round(n) : Math.round(n * 100) / 100
        setDisplay(String(n))
        onChange(n)
    }

    const handleChange = e => {
        const raw = e.target.value
        const regex = isInteger ? /^\d*$/ : /^\d*\.?\d{0,2}$/
        if (raw === '' || regex.test(raw)) {
            const n = parseFloat(raw)
            if (!isNaN(n) && effectiveMax !== undefined && n > effectiveMax) return
            setDisplay(raw)
            if (!isNaN(n)) onChange(n)
            else if (raw === '') onChange('')
        }
    }
    const fullLabel = unit ? `${label} (${unit})` : label

    return (
           <div className='tw-flex tw-flex-col tw-gap-[6px]'>
            <TextWithTooltip
                text={fullLabel}
                className='tw-text-[13px] tw-font-medium tw-text-[#344054]'
            />
            <div className='tw-relative'>
                <input
                    type='text'
                    inputMode='decimal'
                    value={display}
                    onChange={handleChange}
                    onBlur={e => commit(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') commit(e.target.value) }}
                    className='tw-w-full tw-h-10 tw-border tw-border-[#D0D5DD] tw-rounded-[8px] tw-bg-white tw-text-[14px] tw-text-[#101828] focus:tw-outline-none focus:tw-border-blue-500'
                    style={{ paddingLeft: 12, paddingRight: unit ? 42 : 12, boxSizing: 'border-box', MozAppearance: 'textfield', appearance: 'textfield', WebkitAppearance: 'none' }}
                />
                {unit && (
                    <span className='tw-absolute tw-right-3 tw-top-1/2 -tw-translate-y-1/2 tw-text-[13px] tw-text-[#667085] tw-pointer-events-none tw-select-none tw-bg-white tw-pl-1'>
                        {unit}
                    </span>
                )}
            </div>
        </div>
    )
}