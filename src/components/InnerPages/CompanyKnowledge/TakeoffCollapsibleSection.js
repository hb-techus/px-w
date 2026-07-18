import React, { useState } from 'react'

// ══════════════════════════════════════════════════════════════════════════════
// TAKEOFF COLLAPSIBLE SECTION
// ══════════════════════════════════════════════════════════════════════════════

const TakeoffCollapsibleSection = ({
    title,
    subtitle,
    icon,
    // iconBg = 'tw-bg-[#EFF6FF]',
    defaultExpanded = true,
    badge,
    headerRight,
    children,
     onExpandedChange, 
}) => {
    const [isExpanded, setIsExpanded] = useState(defaultExpanded)

    const handleToggle = () => {
        const next = !isExpanded
        setIsExpanded(next)
        onExpandedChange?.(next)   // ← fire it
    }
    return (
        <div
            className='tw-rounded-[12px] tw-overflow-hidden tw-border tw-border-[#E4E7EC]'
            style={{ background: '#fff' }}
        >
            {/* ── Header ───────────────────────────────────────────────────── */}
            <div
                className='tw-cursor-pointer tw-select-none tw-transition-colors'
                style={{
                    background   : 'linear-gradient(135deg, #EFF6FF 0%, #F0F9FF 100%)',
                    borderBottom : `1px solid ${isExpanded ? '#DBEAFE' : 'transparent'}`,
                    padding      : '14px 20px',
                }}
                // onClick={() => setIsExpanded(prev => !prev)}
                 onClick={handleToggle}
            >
                <div className='tw-flex tw-items-center tw-justify-between tw-w-full'>

                    {/* Left: icon + title + subtitle */}
                    <div className='tw-flex tw-items-center tw-gap-3'>
                        {icon && (
                            <div className={`tw-flex tw-items-center tw-justify-center tw-w-10 tw-h-10 tw-rounded-[5px] tw-bg-[#dee9ff]`} >
                                {icon}
                            </div>
                        )}
                        <div className='tw-flex tw-flex-col'>
                            <div className='tw-flex tw-items-center tw-gap-2'>
                                <span
                                    className='tw-text-[15px] tw-font-bold'
                                    style={{ color: '#002149', letterSpacing: '-0.01em' }}
                                >
                                    {title}
                                </span>
                            </div>
                            {subtitle && (
                                <span className='tw-text-[12px] tw-text-[#6B7280] tw-font-normal tw-mt-0.5'>
                                    {subtitle}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Right: badge + save btn + chevron */}
                    <div className='tw-flex tw-items-center tw-gap-3'>
                        {badge && (
                            <span
                                className='tw-text-[14px] tw-font-semibold tw-flex tw-items-center tw-justify-center'
                                style={{
                                    background   : '#eaf2ff',
                                    color        : '#344054',
                                    border       : '1px solid #509eff',
                                    borderRadius : 5,
                                    whiteSpace   : 'nowrap',
                                    padding      : '9px 16px',
                                    lineHeight   : 1,
                                    height       : '38px',
                                    boxSizing    : 'border-box',
                                }}
                            >
                                {badge}
                            </span>
                        )}

                        {headerRight && (
                            <div onClick={e => e.stopPropagation()}>
                                {headerRight}
                            </div>
                        )}

                        <div
                            className='tw-flex tw-items-center tw-justify-center tw-w-[26px] tw-h-[26px] tw-rounded-[6px] tw-transition-colors'
                            style={{ border: '1px solid #93C5FD', background: '#fff', flexShrink: 0 }}
                        >
                            <i
                                className={`icon-Dropdown tw-inline-block tw-transition-transform tw-duration-300 ${isExpanded ? 'tw-rotate-180' : 'tw-rotate-0'}`}
                                style={{ fontSize: 16, color: '#1D4ED8' }}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Body ─────────────────────────────────────────────────────── */}
            <div
                // className={`tw-transition-[max-height,opacity] tw-duration-300 tw-ease-in-out tw-overflow-hidden ${isExpanded ? 'tw-max-h-[9999px] tw-opacity-100' : 'tw-max-h-0 tw-opacity-0'}`}
               className={`tw-transition-[max-height,opacity] tw-duration-300 tw-ease-in-out ${isExpanded ? 'tw-max-h-[9999px] tw-opacity-100 tw-overflow-visible' : 'tw-max-h-0 tw-opacity-0 tw-overflow-hidden'}`}

           >
                <div style={{ padding: '20px 20px 24px' }}>
                    {children}
                </div>
            </div>
        </div>
    )
}

export default TakeoffCollapsibleSection