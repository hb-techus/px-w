import React, { useState, useEffect, useRef } from 'react'
import TakeoffCollapsibleSection from './TakeoffCollapsibleSection'
import { getDeviceInfo } from '../../../utils/getDeviceInfo'
import { showToast } from '../../../genriccomponents/techus-ToastNotification'
import { GetTakeoffConfigV2, UpdateTakeoffConfigV2, GetProductList } from '../../../services/techus-services'
import { AccordionGroup, SaveBtn } from './takeoffUIComponents.js'
import { hasTakeoffEmptyField, getTakeoffDisplayName, sortInputFields } from './takeoffConstants.js'
import { buildInitValues } from './buildInitValues.js'
import { getCategoryContent, getSteelFieldCount, STEEL_TYPE_PLANS } from './takeoffCategoryContent.js'

// ══════════════════════════════════════════════════════════════════════════════
// TAKEOFF SECTION
// ══════════════════════════════════════════════════════════════════════════════

const TakeoffSection = ({ organizationUuid, setPageLoading, canEdit }) => {
    const [sectionExpanded, setSectionExpanded] = useState(true)
    const [takeoffData, setTakeoffData] = useState([])
    const [fieldValues, setFieldValues] = useState({})
    const [primaryProductsMap, setPrimaryProductsMap] = useState({})
    const [saving, setSaving] = useState(false)
    const [loaded, setLoaded] = useState(false)
    const dirtyTakeoffsRef = useRef(new Set())

    useEffect(() => {
        const load = async () => {
            try {
                const orgId = localStorage.getItem('organization_id') || ''
                const [configRes, productsRaw] = await Promise.all([
                    GetTakeoffConfigV2({ organization_uuid: organizationUuid, device_info: getDeviceInfo() }),
                    GetProductList({ search: '', sort_column: 'product_name', sort_order: 'asc', limit: 1000, offset: 0, product_type: 'Primary', ...(orgId && { organization_id: orgId }) }).catch(() => null),
                ])

                // Build trade_id → primary products map
                let prodData = productsRaw?.data || productsRaw
                if (typeof prodData === 'string') prodData = JSON.parse(prodData)
                const allProducts = (prodData?.valid && Array.isArray(prodData.data) ? prodData.data : []).filter(p => p.product_type === 'Primary')
                const prodMap = {}
                allProducts.forEach(p => {
                    if (p.trade_id) {
                        if (!prodMap[p.trade_id]) prodMap[p.trade_id] = []
                        prodMap[p.trade_id].push(p)
                    }
                })  

                const parsed = typeof configRes === 'string' ? JSON.parse(configRes) : configRes
                if (parsed?.valid && Array.isArray(parsed?.data)) {
                    setTakeoffData(parsed.data)
                    setPrimaryProductsMap(prodMap)
                    const initValues = {}
                    parsed.data.forEach(t => {
                        initValues[t.id] = buildInitValues(t, prodMap[t.id] || [])
                    })
                    setFieldValues(initValues)
                    setLoaded(true)
                } else {
                    showToast('error', parsed?.message || 'Failed to load takeoff config')
                }
            } catch (err) {
                console.error(err)
                showToast('error', err?.message || 'Failed to load takeoff config')
            } finally {
                setPageLoading(false)
            }
        }
        load()
    }, [organizationUuid])

    const handleFieldChange = (takeoffId, fieldKey, val) => {
        dirtyTakeoffsRef.current.add(takeoffId)
        setFieldValues(prev => ({
            ...prev,
            [takeoffId]: { ...(prev[takeoffId] || {}), [fieldKey]: val },
        }))
    }

    const isSaveDisabled = !loaded || Object.values(fieldValues).some(v => hasTakeoffEmptyField(v))

    // ── Build unified v2 payload (all takeoffs) ────────────────────────────────
    const buildV2UpdatePayload = () => {
        const dirtyIds = dirtyTakeoffsRef.current

        const withDefault = (items, selectedId) =>
            items.map(item => ({ id: item.id, sort_order: item.sort_order, is_default: item.id === selectedId }))

        const takeoffs = takeoffData
            .filter(takeoff => dirtyIds.has(takeoff.id))
            .map(takeoff => {
                const vals = fieldValues[takeoff.id] || {}
                const key = takeoff.takeoff_name?.toLowerCase()

                // ── CONCRETE ────────────────────────────────────────────────────
                if (key === 'concrete') {
                    const types = (takeoff.types || []).map(type => {
                        const typeObj = {
                            id: type.id,
                            option_groups: (type.option_groups || []).map(og => ({
                                group_key: og.group_key,
                                values: withDefault(og.values || [], vals[`__opt__${og.group_key}`])
                            })),
                            input_fields: sortInputFields(type.input_fields || []).map(f => ({
                                id: f.id,
                                default_value: vals[`type__${type.id}__${f.field_key}__${f.id}`] ?? f.default_value
                            })),
                            products: vals[`__product__${type.type_key}`]
                                ? [{ product_id: vals[`__product__${type.type_key}`] }]
                                : []
                        }
                        if ((type.dimensions || []).length > 0)
                            typeObj.dimensions = withDefault(type.dimensions, vals[`${type.id}__dim`])
                        return typeObj
                    })
                    return { id: takeoff.id, option_groups: [], input_fields: [], products: [], types }
                }

                // ── STEEL ────────────────────────────────────────────────────────
                if (key === 'steel') {
                    const steelCatOg = (takeoff.option_groups || []).find(og => og.group_key === 'steel_category')
                    const catKeyToId = {}
                    ;(steelCatOg?.values || []).forEach(v => { catKeyToId[v.option_key] = v.id })

                    const types = (takeoff.types || []).map(type => {
                        const typeKey = type.type_key
                        const plan = STEEL_TYPE_PLANS[typeKey] || []
                        const sectionTypeOg = (type.option_groups || []).find(og => og.group_key === 'section_type')
                        const rebarTypeOg   = (type.option_groups || []).find(og => og.group_key === 'rebar_type')
                        const sectVals  = (sectionTypeOg?.values || []).filter(v => v.parent_option_key === 'structural_steel')
                        const rebarVals = (rebarTypeOg?.values  || []).filter(v => v.parent_option_key === 'rebar')

                                        const option_groups = (type.option_groups || [])
                            .filter(og => og.group_key !== 'misc_item_type')
                            .map(og => ({
                                group_key: og.group_key,
                                values: (og.values || []).map(v => ({
                                    id: v.id,
                                    sort_order: v.sort_order,
                                    is_default: v.id === (
                                        og.group_key === 'rebar_type'
                                            ? vals[`__opt__rebar_type__${typeKey}`]
                                            : og.group_key === 'direction'
                                                ? vals[`__opt__direction__${typeKey}`]
                                                : og.group_key === 'section_type'
                                                    ? vals[`__opt__section_type__${typeKey}`]
                                                    : vals[`__opt__${og.group_key}`]
                                    )
                                }))
                            }))

                        const input_fields = sortInputFields(type.input_fields || []).map(f => ({
                            id: f.id,
                            default_value: vals[`type_input__${typeKey}__${f.field_key}${f.condition_value ? '__' + f.condition_value : ''}`] ?? f.default_value
                        }))

                        const products = []
                        plan.forEach(step => {
                            if (step.startsWith('cat_product:')) {
                                const catKey = step.slice(12)
                                const catId = catKeyToId[catKey]
                                const productId = vals[`__product__${typeKey}__${catKey}`]
                                if (catId && productId)
                                    products.push({ steel_category_id: catId, product_id: productId })
                            } else if (step === 'struct_products') {
                                const catId = catKeyToId['structural_steel']
                                sectVals.forEach(sv => {
                                    const productId = vals[`__product__${typeKey}__structural_steel__${sv.option_key}`]
                                    if (catId && productId)
                                        products.push({ steel_category_id: catId, condition_key: 'section_type', condition_value: sv.option_key, product_id: productId })
                                })
                            } else if (step === 'rebar_subtypes') {
                                const catId = catKeyToId['rebar']
                                rebarVals.forEach(rv => {
                                    const productId = vals[`__product__${typeKey}__rebar__${rv.option_key}`]
                                    if (catId && productId)
                                        products.push({ steel_category_id: catId, condition_key: 'rebar_type', condition_value: rv.option_key, product_id: productId })
                                })
                            }
                        })

                        return { id: type.id, option_groups, input_fields, products }
                    })

                    return {
                        id: takeoff.id,
                        option_groups: (takeoff.option_groups || []).map(og => ({
                            group_key: og.group_key,
                            values: (og.values || []).map(v => ({
                                id: v.id, sort_order: v.sort_order, is_default: v.id === vals[`__opt__${og.group_key}`]
                            }))
                        })),
                        input_fields: sortInputFields(takeoff.input_fields || [])
                            .filter(f => f.field_key === 'wastage')
                            .map(f => ({ id: f.id, default_value: vals[f.field_key] ?? f.default_value })),
                        products: [],
                        types
                    }
                }

                // ── ALL OTHER TAKEOFFS ───────────────────────────────────────────
                const selectedTypeId = vals['__type'] || ''

                const input_fields = sortInputFields(takeoff.input_fields || []).map(f => ({
                    id: f.id,
                    default_value: vals[f.field_key] !== undefined ? vals[f.field_key] : f.default_value,
                }))

                const types = (takeoff.types || []).map((type, idx) => {
                    const typeObj = {
                        id: type.id,
                        sort_order: type.sort_order ?? idx + 1,
                        is_default: type.id === selectedTypeId,
                    }

                    if ((type.option_groups || []).length > 0) {
                        typeObj.option_groups = type.option_groups.map(og => {
                            let selectedValId = null
                            if (key === 'roofing') {
                                selectedValId = vals[`__roof_pitch`]
                                    ?? vals[`${type.id}__opt__${og.group_key}`]
                                    ?? vals[`__opt__${og.group_key}`]
                            } else if (key === 'door_window') {
                                if (og.group_key === 'material_type') selectedValId = vals[`__material`]
                                else if (og.group_key === 'glass_type') selectedValId = vals[`__glass_type`]
                                else selectedValId = vals[`${type.id}__opt__${og.group_key}`]
                            } else {
                                selectedValId = vals[`__${og.group_key}`]
                                    ?? vals[`${type.id}__opt__${og.group_key}`]
                                    ?? vals[`__opt__${og.group_key}`]
                            }
                            return { group_key: og.group_key, values: withDefault(og.values || [], selectedValId) }
                        })
                    }

                    if ((type.dimensions || []).length > 0)
                        typeObj.dimensions = withDefault(type.dimensions, vals[`${type.id}__dim`])

                    if ((type.thickness || []).length > 0)
                        typeObj.thickness = withDefault(type.thickness, vals[`${type.id}__thick`])

                    if ((type.input_fields || []).length > 0) {
                        typeObj.input_fields = sortInputFields(type.input_fields).map(f => {
                            const uk = `type__${type.id}__${f.field_key}__${f.id}`
                            return { id: f.id, default_value: vals[uk] !== undefined ? vals[uk] : f.default_value }
                        })
                    }

                    if ((type.spec_groups || []).length > 0) {
                        const ductShapeOg = (type.option_groups || []).find(og => og.group_key === 'duct_shape')
                        const ductShapes = ductShapeOg ? (ductShapeOg.values || []) : []
                        const isHvacDuctType = key === 'hvac' && ductShapes.length > 0
                        typeObj.spec_groups = type.spec_groups.map(sg => {
                            if (isHvacDuctType) {
                                const shapeCount = ductShapes.length
                                return {
                                    spec_key: sg.spec_key,
                                    values: (sg.values || []).map((v, i) => {
                                        const shapeKey = ductShapes[i % shapeCount]?.option_key || ductShapes[i % shapeCount]?.id
                                        const selectedId = (v.parent_option_key ? vals[`${type.id}__duct__${v.parent_option_key}`] : null)
                                            || vals[`${type.id}__duct__${shapeKey}`]
                                        return { id: v.id, sort_order: v.sort_order, is_default: v.id === selectedId }
                                    }),
                                }
                            }
                            let selectedSpecId = vals[`${type.id}__spec__${sg.spec_key}`]
                            if (!selectedSpecId) {
                                const pk = Object.keys(vals).find(k => k.startsWith(`${type.id}__spec__${sg.spec_key}__`))
                                if (pk) selectedSpecId = vals[pk]
                            }
                            if (!selectedSpecId) selectedSpecId = vals[`__spec__${sg.spec_key}`]
                            return { spec_key: sg.spec_key, values: withDefault(sg.values || [], selectedSpecId) }
                        })
                    }

                    if ((type.geometry_groups || []).length > 0) {
                        typeObj.geometry_groups = type.geometry_groups.map(gg => {
                            const selectedGeoId = vals[`${type.id}__geo__${gg.geometry_key}`]
                                ?? vals[`__geo__${gg.geometry_key}`]
                                ?? vals[`${type.id}__unit_width`]
                            return { geometry_key: gg.geometry_key, values: withDefault(gg.values || [], selectedGeoId) }
                        })
                    }

                    return typeObj
                })

                const products = vals['__product'] ? [{ product_id: vals['__product'] }] : []

                const topOptionGroups = (takeoff.option_groups || []).map(og => ({
                    group_key: og.group_key,
                    values: withDefault(og.values || [], vals[`__${og.group_key}`])
                }))

                return {
                    id: takeoff.id,
                    option_groups: topOptionGroups,
                    ...(input_fields.length > 0 ? { input_fields } : {}),
                    types,
                    ...(products.length > 0 ? { products } : {}),
                }
            })

        return { organization_uuid: organizationUuid, device_info: getDeviceInfo(), takeoffs }
    }

    const handleSave = async () => {
        if (isSaveDisabled) return
        setSaving(true)
        setPageLoading(true)
        try {
            if (!dirtyTakeoffsRef.current.size) { setSaving(false); setPageLoading(false); return }
            const result = await UpdateTakeoffConfigV2(buildV2UpdatePayload())
            const p = typeof result === 'string' ? JSON.parse(result) : result
            if (p?.valid) {
                dirtyTakeoffsRef.current.clear()
                showToast('success', 'Takeoff settings saved successfully')
            } else {
                showToast('error', p?.message || 'Failed to save takeoff settings')
            }
        } catch (err) {
            console.error(err)
            showToast('error', err?.message || 'Failed to save takeoff settings')
        } finally {
            setSaving(false)
            setPageLoading(false)
        }
    }

    const accordionItems = takeoffData.map(takeoff => ({
        key: takeoff.id,
        label: getTakeoffDisplayName(takeoff.takeoff_name || ''),
        fieldCount: takeoff.takeoff_name?.toLowerCase() === 'steel'
                ? getSteelFieldCount(takeoff, primaryProductsMap[takeoff.id] || [])
                : Object.keys(fieldValues[takeoff.id] || {}).length,
        content: getCategoryContent(
            takeoff,
            fieldValues[takeoff.id] || {},
            (fk, val) => handleFieldChange(takeoff.id, fk, val),
            primaryProductsMap[takeoff.id] || []
        ),
    }))

    return (
        <TakeoffCollapsibleSection
            onExpandedChange={setSectionExpanded}
            title='Takeoff'
            subtitle='Standard material dimensions and thicknesses by trade.'
            icon={<i className='icon-Takeoff' style={{ fontSize: 20, color: '#0140c1' }} />}
            iconBg='tw-bg-[#EFF6FF]'
            defaultExpanded={true}
            badge={loaded ? `${takeoffData.length} sections` : ''}
            headerRight={canEdit && <SaveBtn onClick={handleSave} saving={saving} disabled={isSaveDisabled} />}
        >
            {!loaded
                ? (
                    <div className='tw-flex tw-flex-col tw-gap-2'>
                        {[1, 2, 3].map(i => (
                            <div key={i} className='tw-h-12 tw-rounded-[8px] tw-bg-gray-100 tw-animate-pulse' />
                        ))}
                    </div>
                )
                : <AccordionGroup items={accordionItems} key={sectionExpanded ? 'open' : 'closed'}/>
            }
        </TakeoffCollapsibleSection>
    )
}

export default TakeoffSection