import React, { useState, useEffect } from 'react'
import TakeoffCollapsibleSection from './TakeoffCollapsibleSection'
import { getDeviceInfo } from '../../../utils/getDeviceInfo'
import { showToast } from '../../../genriccomponents/techus-ToastNotification'
import { GetEstimationSettings, UpdateEstimationSettings } from '../../../services/techus-services'
import { AccordionGroup, NumericInput, SaveBtn } from './takeoffUIComponents.js'
import { HIDE_GROUP_LABEL_SECTIONS, SKIP_SECTIONS } from './takeoffConstants.js'

// ══════════════════════════════════════════════════════════════════════════════
// LABOUR SHARE TABLE
// ══════════════════════════════════════════════════════════════════════════════

const LabourShareTable = ({ fieldDefs, values, onChange }) => {
    const groupMap = {}
        ;[...fieldDefs]
            .sort((a, b) => a.sort_order - b.sort_order)
            .forEach(def => {
                if (!groupMap[def.group_label]) groupMap[def.group_label] = []
                groupMap[def.group_label].push(def)
            })
    const groups = Object.entries(groupMap)

    return (
        <div className='tw-w-full tw-border tw-border-[#E4E7EC] tw-rounded-[8px] tw-overflow-hidden'>
            {/* Header row */}
            <div
                className='tw-grid tw-px-5 tw-py-3 tw-bg-[#F9FAFB] tw-border-b tw-border-[#E4E7EC]'
                style={{ gridTemplateColumns: '1fr 2fr' }}
            >
                <span className='tw-text-[11px] tw-font-semibold tw-text-[#667085] tw-uppercase tw-tracking-wider'>Work Category</span>
                <span className='tw-text-[11px] tw-font-semibold tw-text-[#667085] tw-uppercase tw-tracking-wider'>Allocation Ratio</span>
            </div>

            {groups.map(([groupLabel, defs], rowIdx) => {
                const fd = defs[0]
                const sd = defs[1]
                const fv = values[fd?.setting_key] !== undefined ? Number(values[fd.setting_key]) : Number(fd?.setting_value ?? 0)
                const sv = sd ? Math.round((100 - fv) * 10000) / 10000 : null

                return (
                    <div
                        key={groupLabel}
                        className={`tw-grid tw-px-5 tw-py-4 tw-items-center tw-bg-white ${rowIdx < groups.length - 1 ? 'tw-border-b tw-border-[#E4E7EC]' : ''}`}
                        style={{ gridTemplateColumns: '1fr 2fr' }}
                    >
                        <span className='tw-text-[14px] tw-font-semibold tw-text-[#101828]'>{groupLabel}</span>

                        {/* Fixed equal-width columns: each pair takes exactly 50% of the allocation column */}
                        <div className='tw-grid tw-gap-4' style={{ gridTemplateColumns: '1fr 1fr' }}>
                            {fd && (
                                <div className='tw-flex tw-items-center'>
                                    <div className='tw-flex tw-items-center tw-h-10 tw-border tw-border-[#D0D5DD] tw-border-r-0 tw-bg-white tw-px-3 tw-rounded-l-[8px] tw-flex-1 tw-min-w-0'>
                                        <span className='tw-text-[13px] tw-text-[#344054] tw-font-medium tw-whitespace-nowrap tw-overflow-hidden tw-text-ellipsis'>{fd.display_name}</span>
                                    </div>
                                    <div style={{ width: 72, flexShrink: 0 }} className='tw-relative'>
                                        <input
                                            type='text'
                                            inputMode='decimal'
                                            value={String(fv)}
                                            onChange={e => {
                                                const raw = e.target.value
                                                if (!/^\d*\.?\d*$/.test(raw)) return
                                                const n = parseFloat(raw)
                                                if (!isNaN(n)) {
                                                    const c = Math.min(fd.max_value ?? 100, Math.max(fd.min_value ?? 0, n))
                                                    onChange(fd.setting_key, c)
                                                    if (sd) onChange(sd.setting_key, Math.round((100 - c) * 10000) / 10000)
                                                } else if (raw === '') {
                                                    onChange(fd.setting_key, 0)
                                                }
                                            }}
                                            className='tw-w-full tw-h-10 tw-border tw-border-[#D0D5DD] tw-rounded-r-[8px] tw-text-[14px] tw-text-[#101828] tw-bg-white focus:tw-outline-none focus:tw-border-blue-500'
                                            style={{ paddingLeft: 10, paddingRight: 24, boxSizing: 'border-box' }}
                                        />
                                        <span className='tw-absolute tw-right-2 tw-top-1/2 -tw-translate-y-1/2 tw-text-[12px] tw-text-[#667085] tw-pointer-events-none'>%</span>
                                    </div>
                                </div>
                            )}

                            {sd && sv !== null && (
                                <div className='tw-flex tw-items-center'>
                                    <div className='tw-flex tw-items-center tw-h-10 tw-border tw-border-[#D0D5DD] tw-border-r-0 tw-bg-white tw-px-3 tw-rounded-l-[8px] tw-flex-1 tw-min-w-0'>
                                        <span className='tw-text-[13px] tw-text-[#344054] tw-font-medium tw-whitespace-nowrap tw-overflow-hidden tw-text-ellipsis'>{sd.display_name}</span>
                                    </div>
                                    <div style={{ width: 72, flexShrink: 0 }} className='tw-relative'>
                                        <input
                                            type='text'
                                            readOnly
                                            value={String(sv)}
                                            className='tw-w-full tw-h-10 tw-border tw-border-[#D0D5DD] tw-rounded-r-[8px] tw-text-[14px] tw-text-[#667085] tw-bg-[#F2F4F7] tw-cursor-default focus:tw-outline-none'
                                            style={{ paddingLeft: 10, paddingRight: 24, boxSizing: 'border-box' }}
                                        />
                                        <span className='tw-absolute tw-right-2 tw-top-1/2 -tw-translate-y-1/2 tw-text-[12px] tw-text-[#667085] tw-pointer-events-none'>%</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )
            })}
        </div>
    )
}

// ══════════════════════════════════════════════════════════════════════════════
// DYNAMIC SECTION CONTENT
// ══════════════════════════════════════════════════════════════════════════════

const DynamicSectionContent = ({ sectionKey, fields, fieldDefs, onChange }) => {
    const hideGroupLabel = HIDE_GROUP_LABEL_SECTIONS.has(sectionKey)
    const groups = []
    const groupMap = {}

        ;[...fieldDefs]
            .sort((a, b) => a.sort_order - b.sort_order)
            .forEach(def => {
                if (!groupMap[def.group_label]) {
                    groupMap[def.group_label] = []
                    groups.push(def.group_label)
                }
                groupMap[def.group_label].push(def)
            })

    return (
        <div className='tw-flex tw-flex-col tw-gap-5'>
            {groups.map(groupLabel => {
                const gDefs = groupMap[groupLabel]
                const isSingle = gDefs.length === 1
                if (isSingle) {
                    const def = gDefs[0]
                    const cv = fields[def.setting_key] !== undefined ? fields[def.setting_key] : def.setting_value
                    return (
                        <div key={groupLabel} className='tw-flex tw-flex-col tw-gap-3'>
                            {!hideGroupLabel && (
                                <div className='tw-flex tw-gap-2 tw-flex-wrap'>
                                    <span className='tw-text-[12px] tw-font-medium tw-text-[#1D4ED8] tw-bg-[#EFF6FF] tw-border tw-border-[#BFDBFE] tw-rounded-full tw-px-3 tw-py-1'>
                                        {groupLabel}
                                    </span>
                                </div>
                            )}
                            {/* Label on top, input below — same pattern as multi-field grid */}
                            <div className='tw-flex tw-flex-col tw-gap-[6px]' style={{ maxWidth: 280 }}>
                                <label className='tw-text-[13px] tw-font-medium tw-text-[#344054]'>
                                    {def.display_name}
                                </label>
                                <NumericInput
                                    value={cv}
                                    onChange={v => onChange(def.setting_key, v)}
                                    min={def.min_value}
                                    max={def.max_value}
                                    suffix={def.unit || undefined}
                                />
                            </div>
                        </div>
                    )
                }

                // Multi-field group — existing grid layout
                const cols = Math.min(gDefs.length, 4)
                return (
                    <div key={groupLabel} className='tw-flex tw-flex-col tw-gap-3'>
                        {!hideGroupLabel && (
                            <div className='tw-flex tw-gap-2 tw-flex-wrap'>
                                <span className='tw-text-[12px] tw-font-medium tw-text-[#1D4ED8] tw-bg-[#EFF6FF] tw-border tw-border-[#BFDBFE] tw-rounded-full tw-px-3 tw-py-1'>
                                    {groupLabel}
                                </span>
                            </div>
                        )}
                        <div className='tw-grid tw-gap-4' style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
                            {gDefs.map(def => {
                                const cv = fields[def.setting_key] !== undefined ? fields[def.setting_key] : def.setting_value
                                return (
                                    <div key={def.setting_key} className='tw-flex tw-flex-col tw-gap-[6px]'>
                                        <label className='tw-text-[13px] tw-font-medium tw-text-[#344054]'>{def.display_name}</label>
                                        <NumericInput
                                            value={cv}
                                            onChange={v => onChange(def.setting_key, v)}
                                            min={def.min_value}
                                            max={def.max_value}
                                            suffix={def.unit || undefined}
                                        />
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                )
            })}
        </div>
    )
}

// ══════════════════════════════════════════════════════════════════════════════
// ESTIMATION SECTION
// ══════════════════════════════════════════════════════════════════════════════

const EstimationSection = ({ organizationUuid, setPageLoading, canEdit }) => {
    const [sectionExpanded, setSectionExpanded] = useState(true)
    const [sectionDefs, setSectionDefs] = useState({})
    const [sectionValues, setSectionValues] = useState({})
    const [labourShareDefs, setLabourShareDefs] = useState([])
    const [labourShareValues, setLabourShareValues] = useState({})
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        const load = async () => {
            setPageLoading(true)
            try {
                const res = await GetEstimationSettings({ organization_uuid: organizationUuid, device_info: getDeviceInfo() })
                const parsed = typeof res === 'string' ? JSON.parse(res) : res
                if (parsed?.valid && parsed?.data) {
                    const defs = {}
                    const vals = {}
                    Object.entries(parsed.data).forEach(([sk, fa]) => {
                        if (!Array.isArray(fa) || !fa.length) return
                        if (sk === 'labour_share') {
                            setLabourShareDefs(fa)
                            const lv = {}
                            fa.forEach(f => { lv[f.setting_key] = f.setting_value })
                            setLabourShareValues(lv)
                            return
                        }
                        if (SKIP_SECTIONS.has(sk)) return
                        defs[sk] = fa
                        vals[sk] = {}
                        fa.forEach(f => { vals[sk][f.setting_key] = f.setting_value })
                    })
                    setSectionDefs(defs)
                    setSectionValues(vals)
                } else {
                    showToast('error', parsed?.message || 'Failed to load estimation settings')
                }
            } catch (err) {
                console.error(err)
                showToast('error', err?.message || 'Failed to load estimation settings')
            } finally {
                setPageLoading(false)
            }
        }
        load()
    }, [organizationUuid])

    const handleFieldChange = (sk, settingKey, value) => setSectionValues(prev => ({ ...prev, [sk]: { ...(prev[sk] || {}), [settingKey]: value } }))
    const handleLabourShareChange = (sk, value) => setLabourShareValues(prev => ({ ...prev, [sk]: value }))

    const anyEmpty = (() => {
        for (const [, m] of Object.entries(sectionValues))
            for (const v of Object.values(m))
                if (v === '' || v === null || v === undefined) return true
        for (const v of Object.values(labourShareValues))
            if (v === '' || v === null || v === undefined) return true
        return false
    })()

    const sectionKeys = Object.keys(sectionDefs)
    const totalSections = sectionKeys.length + (labourShareDefs.length > 0 ? 1 : 0)
    const saveDisabled = totalSections === 0 || anyEmpty
    const sectionLabel = k => k.charAt(0).toUpperCase() + k.slice(1).replace(/_/g, ' ')

    const handleSave = async () => {
        setSaving(true)
        setPageLoading(true)
        try {
            const sections = {}
            Object.entries(sectionValues).forEach(([sk, m]) => {
                sections[sk] = Object.entries(m).map(([setting_key, setting_value]) => ({
                    setting_key,
                    setting_value: setting_value === '' ? 0 : Number(setting_value),
                }))
            })
            if (Object.keys(labourShareValues).length > 0) {
                sections.labour_share = Object.entries(labourShareValues).map(([sk, sv]) => ({
                    setting_key: sk,
                    setting_value: sv === '' ? 0 : Number(sv),
                }))
            }
            const res = await UpdateEstimationSettings({ organization_uuid: organizationUuid, sections, device_info: getDeviceInfo() })
            const parsed = typeof res === 'string' ? JSON.parse(res) : res
            if (parsed?.valid) showToast('success', parsed?.message || 'Estimation settings updated')
            else showToast('error', parsed?.message || 'Failed to update estimation settings')
        } catch (err) {
            showToast('error', err?.message || 'Failed to update estimation settings')
        } finally {
            setSaving(false)
            setPageLoading(false)
        }
    }

    const accordionItems = [
        ...sectionKeys.map(sk => ({
            key: sk,
            // label     : sectionLabel(sk),
            label: sectionLabel(sk) === 'Labour productivity'
                ? 'Labor Productivity'
                : sectionLabel(sk),
            fieldCount: sectionDefs[sk]?.length || 0,
            content: (
                <DynamicSectionContent
                    sectionKey={sk}
                    fields={sectionValues[sk] || {}}
                    fieldDefs={sectionDefs[sk] || []}
                    onChange={(settingKey, value) => handleFieldChange(sk, settingKey, value)}
                />
            ),
        })),
        ...(labourShareDefs.length > 0
            ? [{
                key: 'labour_share',
                label: 'Labor Share',
                fieldCount: new Set(labourShareDefs.map(d => d.group_label)).size,
                extraBadge: `${labourShareDefs.length} allocations`,
                content: (
                    <LabourShareTable
                        fieldDefs={labourShareDefs}
                        values={labourShareValues}
                        onChange={handleLabourShareChange}
                    />
                ),
            }]
            : []
        ),
    ]

    return (
        <TakeoffCollapsibleSection
          onExpandedChange={setSectionExpanded} 
            title='Estimation'
            subtitle='Cost and pricing details used for estimation'
            icon={<i className='icon-Takeoff--Estimation' style={{ fontSize: 20, color: '#0140c1' }} />}
            iconBg='tw-bg-[#EFF6FF]'
            defaultExpanded={true}
            badge={totalSections > 0 ? `${totalSections} sections` : ''}
            headerRight={canEdit && <SaveBtn onClick={handleSave} saving={saving} disabled={saveDisabled} />}
        >
            {totalSections === 0
                ? (
                    <div className='tw-flex tw-flex-col tw-gap-2'>
                        {[1, 2, 3].map(i => (
                            <div key={i} className='tw-h-12 tw-rounded-[8px] tw-bg-gray-100 tw-animate-pulse' />
                        ))}
                    </div>
                )
                : <AccordionGroup
                key={sectionExpanded ? 'open' : 'closed'} 
                items={accordionItems} />
            }
        </TakeoffCollapsibleSection>
    )
}

export default EstimationSection;