import React, { useState, useEffect } from 'react'
import TakeoffCollapsibleSection from './TakeoffCollapsibleSection'
import { getDeviceInfo } from '../../../utils/getDeviceInfo'
import { showToast } from '../../../genriccomponents/techus-ToastNotification'
import { GetGeneralSettings, UpdateGeneralSettings } from '../../../services/techus-services'
import { GeneralNumericInput, SaveBtn } from './takeoffUIComponents.js'

// ══════════════════════════════════════════════════════════════════════════════
// GENERAL SECTION
// ══════════════════════════════════════════════════════════════════════════════

const GeneralSection = ({ organizationUuid, setPageLoading, canEdit }) => {
    const [contingency, setContingency] = useState('')
    const [overhead,    setOverhead]    = useState('')
    const [saving,      setSaving]      = useState(false)
    const [loaded,      setLoaded]      = useState(false)

    const saveDisabled = contingency === '' || overhead === ''

    useEffect(() => {
        const load = async () => {
            try {
                const res    = await GetGeneralSettings({ organization_uuid: organizationUuid, device_info: getDeviceInfo() })
                const parsed = typeof res === 'string' ? JSON.parse(res) : res
                if (parsed?.valid && parsed?.data) {
                    setContingency(parsed.data.contingency_percentage ?? 0)
                    setOverhead(parsed.data.overhead_percentage ?? 0)
                    setLoaded(true)
                } else {
                    showToast('error', parsed?.message || 'Failed to load general settings')
                }
            } catch (err) {
                console.error(err)
                showToast('error', err?.message || 'Failed to load general settings')
            }
        }
        load()
    }, [organizationUuid])

    const handleSave = async () => {
        setSaving(true)
        setPageLoading(true)
        try {
            const res    = await UpdateGeneralSettings({ organization_uuid: organizationUuid, contingency_percentage: Number(contingency), overhead_percentage: Number(overhead), device_info: getDeviceInfo() })
            const parsed = typeof res === 'string' ? JSON.parse(res) : res
            if (parsed?.valid) showToast('success', parsed?.message || 'General settings updated')
            else               showToast('error',   parsed?.message || 'Failed to update general settings')
        } catch (err) {
            console.error(err)
            showToast('error', err?.message || 'Failed to update')
        } finally {
            setSaving(false)
            setPageLoading(false)
        }
    }

    const fields = [
        { label: 'Contingency (%)', value: contingency, set: setContingency },
        { label: 'Overhead (%)',    value: overhead,    set: setOverhead    },
    ]

    return (
        <TakeoffCollapsibleSection
            title='General'
            subtitle='Default values applied across all takeoff and estimation calculations.'
            icon={<i className='icon-General' style={{ fontSize: 20, color: '#0140c1' }} />}
            iconBg='tw-bg-[#EFF6FF]'
            defaultExpanded={true}
            headerRight={canEdit && <SaveBtn onClick={handleSave} saving={saving} disabled={saveDisabled} />}
        >
            {!loaded
                ? (
                    <div className='tw-flex tw-gap-5'>
                        {[1, 2].map(i => (
                            <div key={i} className='tw-flex tw-flex-col tw-gap-[6px]' style={{ width: 220 }}>
                                <div className='tw-h-4 tw-w-28 tw-rounded tw-bg-gray-100 tw-animate-pulse' />
                                <div className='tw-h-10 tw-rounded-[8px] tw-bg-gray-100 tw-animate-pulse' />
                            </div>
                        ))}
                    </div>
                )
                : (
                    <div className='tw-flex tw-gap-5 tw-flex-wrap'>
                        {fields.map(({ label, value, set }) => (
                            <div
                                key={label}
                                className='tw-flex tw-flex-col tw-gap-[6px]'
                                style={{ width: 220 }}
                            >
                                <label className='tw-text-[13px] tw-font-medium tw-text-[#344054]'>{label}</label>
                                <GeneralNumericInput value={value} onChange={set} suffix='%' />
                            </div>
                        ))}
                    </div>
                )
            }
        </TakeoffCollapsibleSection>
    )
}

export default GeneralSection