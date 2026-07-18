import React from 'react';
import {
    Grid4,
    TradeGrid,
    TakeoffSelectDropdown,
    TakeoffNumberInput,
} from './takeoffUIComponents.js'
import {
    sortInputFields,
    COMPONENT_TAKEOFFS,
} from './takeoffConstants.js'

// ─── toOpt helpers ────────────────────────────────────────────────────────────
const toDimOpt  = d => ({ id: d.id, label: d.dimension_name, is_default: !!d.is_default })
const toOptVal  = v => ({ id: v.id, label: v.option_name,    is_default: !!v.is_default })

const getUnitAndIntProps = f => {
    if (f.field_key === 'number_of_coats') {
        return { unit: null, isInteger: true, min: 1, max: 10 }
    }
    const isSpecialInt = f.field_key === 'number_of_wythes' || f.field_key === 'bars_per_column' || f.field_key === 'number_of_steps'
    if (isSpecialInt) {
        return { unit: null, isInteger: true, min: 1, max: 99 }
    }
    return {
        unit: f.unit === 'count' ? 'Count' : f.unit,
        isInteger: false
    }
}

// Convert raw primary products to dropdown options (label = product_code — product_name)
const toProductOpt = p => ({ id: p.product_id, label: `${p.product_code} — ${p.product_name}`, is_default: false })

// ── Shared Products dropdown ──────────────────────────────────────────────────
// Rendered as the first field for every trade that has matching primary products.
const ProductsDropdown = ({ productOptions, value, onChange }) => (
    <TakeoffSelectDropdown
        label='Product'
        options={productOptions}
        value={value}
        placeholder='Select product'
        onChange={onChange}
    />
)

// ══════════════════════════════════════════════════════════════════════════════
// 1. PAINTING — Product, Wall Height, Number of Coats
// ══════════════════════════════════════════════════════════════════════════════

export const PaintingCategoryContent = ({ takeoff, values, onChange, productOptions = [] }) => {
    const inputFields = sortInputFields(takeoff.input_fields || [])

    return (
        <div className='tw-flex tw-flex-col tw-gap-5'>
            <TradeGrid>
                {productOptions.length > 0 && (
                    <ProductsDropdown
                        productOptions={productOptions}
                        value={values['__product'] || ''}
                        onChange={val => onChange('__product', val)}
                    />
                )}
                {inputFields.map(f => (
                    <TakeoffNumberInput
                        key={f.id}
                        label={f.field_label}
                        value={values[f.field_key] ?? f.default_value ?? ''}
                        onChange={val => onChange(f.field_key, val)}
                        min={f.min_value}
                        max={f.max_value}
                        {...getUnitAndIntProps(f)}
                    />
                ))}
            </TradeGrid>
        </div>
    )
}

// ══════════════════════════════════════════════════════════════════════════════
// 2. DRYWALL — Product, Wall Height
// ══════════════════════════════════════════════════════════════════════════════

export const DrywallCategoryContent = ({ takeoff, values, onChange, productOptions = [] }) => {
    const inputFields = sortInputFields(takeoff.input_fields || [])

    return (
        <div className='tw-flex tw-flex-col tw-gap-5'>
            <TradeGrid>
                {productOptions.length > 0 && (
                    <ProductsDropdown
                        productOptions={productOptions}
                        value={values['__product'] || ''}
                        onChange={val => onChange('__product', val)}
                    />
                )}
                {inputFields.map(f => (
                    <TakeoffNumberInput
                        key={f.id}
                        label={f.field_label}
                        value={values[f.field_key] ?? f.default_value ?? ''}
                        onChange={val => onChange(f.field_key, val)}
                        min={f.min_value}
                        max={f.max_value}
                        {...getUnitAndIntProps(f)}
                    />
                ))}
            </TradeGrid>
        </div>
    )
}

// ══════════════════════════════════════════════════════════════════════════════
// 3. ROOFING — Product, Roof Pitch
// ══════════════════════════════════════════════════════════════════════════════

export const RoofingCategoryContent = ({ takeoff, values, onChange, productOptions = [] }) => {
    const inputFields = sortInputFields(takeoff.input_fields || [])

    // v2 API: roof_pitch is a top-level option_group; v1: inside types
    const roofPitchOptions = (() => {
        const topLevel = (takeoff.option_groups || []).find(o => o.group_key === 'roof_pitch')
        if (topLevel?.values?.length) return topLevel.values.map(toOptVal)
        for (const t of (takeoff.types || [])) {
            const og = (t.option_groups || []).find(o => o.group_key === 'roof_pitch')
            if (og?.values?.length) return og.values.map(toOptVal)
        }
        return []
    })()

    return (
        <div className='tw-flex tw-flex-col tw-gap-5'>
            <TradeGrid>
                {productOptions.length > 0 && (
                    <ProductsDropdown
                        productOptions={productOptions}
                        value={values['__product'] || ''}
                        onChange={val => onChange('__product', val)}
                    />
                )}
                {roofPitchOptions.length > 0 && (
                    <TakeoffSelectDropdown
                        label='Roof Pitch'
                        options={roofPitchOptions}
                        value={values['__roof_pitch'] || roofPitchOptions[0]?.id || ''}
                        onChange={val => onChange('__roof_pitch', val)}
                    />
                )}
                {inputFields.map(f => (
                    <TakeoffNumberInput
                        key={f.id}
                        label={f.field_label}
                        value={values[f.field_key] ?? f.default_value ?? ''}
                        onChange={val => onChange(f.field_key, val)}
                        min={f.min_value}
                        max={f.max_value}
                        {...getUnitAndIntProps(f)}
                    />
                ))}
            </TradeGrid>
        </div>
    )
}

// ══════════════════════════════════════════════════════════════════════════════
// 4. CONCRETE — per-type input fields + per-type option_groups + per-type product
// ══════════════════════════════════════════════════════════════════════════════

export const ConcreteCategoryContent = ({ takeoff, values, onChange, productOptions = [] }) => {
    const types = [...(takeoff.types || [])].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
    const inputFields = sortInputFields(takeoff.input_fields || [])

    return (
        <div className='tw-flex tw-flex-col tw-gap-5'>
            <Grid4>
                {types.map(type => (
                    <React.Fragment key={type.id}>
                        {sortInputFields(type.input_fields || []).map(f => {
                            const uk = `type__${type.id}__${f.field_key}__${f.id}`
                            return (
                                <TakeoffNumberInput
                                    key={uk}
                                    label={f.field_label}
                                    value={values[uk] ?? f.default_value ?? ''}
                                    onChange={val => onChange(uk, val)}
                                    min={f.min_value}
                                    max={f.max_value}
                                    {...getUnitAndIntProps(f)}
                                />
                            )
                        })}
                        {(type.dimensions || []).length > 0 && (
                            <TakeoffSelectDropdown
                                key={`${type.id}__dim`}
                                label={`${type.type_name} Thickness`}
                                options={type.dimensions.map(toDimOpt)}
                                value={values[`${type.id}__dim`] ?? type.dimensions.find(d => d.is_default)?.id ?? type.dimensions[0]?.id ?? ''}
                                onChange={val => onChange(`${type.id}__dim`, val)}
                            />
                        )}
                        {(type.option_groups || []).map(og => (
                            <TakeoffSelectDropdown
                                key={`${type.id}__opt__${og.group_key}`}
                                label={og.group_name}
                                options={(og.values || []).map(toOptVal)}
                                value={values[`__opt__${og.group_key}`] ?? og.values?.find(v => v.is_default)?.id ?? og.values?.[0]?.id ?? ''}
                                onChange={val => onChange(`__opt__${og.group_key}`, val)}
                            />
                        ))}
                        {productOptions.length > 0 && (
                            <TakeoffSelectDropdown
                                key={`__product__${type.type_key}`}
                                label={`${type.type_name} Product`}
                                options={productOptions}
                                value={values[`__product__${type.type_key}`] || ''}
                                placeholder='Select product'
                                onChange={val => onChange(`__product__${type.type_key}`, val)}
                            />
                        )}
                    </React.Fragment>
                ))}
                {inputFields.map(f => (
                    <TakeoffNumberInput
                        key={f.id}
                        label={f.field_label}
                        value={values[f.field_key] ?? f.default_value ?? ''}
                        onChange={val => onChange(f.field_key, val)}
                        min={f.min_value}
                        max={f.max_value}
                        {...getUnitAndIntProps(f)}
                    />
                ))}
            </Grid4>
        </div>
    )
}

// ══════════════════════════════════════════════════════════════════════════════
// 5. MASONRY — Product, Wall Height, Number of Wythes
// ══════════════════════════════════════════════════════════════════════════════

export const MasonryCategoryContent = ({ takeoff, values, onChange, productOptions = [] }) => {
    const inputFields = sortInputFields(takeoff.input_fields || [])

    return (
        <div className='tw-flex tw-flex-col tw-gap-5'>
            <TradeGrid>
                {productOptions.length > 0 && (
                    <ProductsDropdown
                        productOptions={productOptions}
                        value={values['__product'] || ''}
                        onChange={val => onChange('__product', val)}
                    />
                )}
                {inputFields.map(f => (
                    <TakeoffNumberInput
                        key={f.id}
                        label={f.field_label}
                        value={values[f.field_key] ?? f.default_value ?? ''}
                        onChange={val => onChange(f.field_key, val)}
                        min={f.min_value}
                        max={f.max_value}
                        {...getUnitAndIntProps(f)}
                    />
                ))}
            </TradeGrid>
        </div>
    )
}

// ══════════════════════════════════════════════════════════════════════════════
// 6. DOOR & WINDOW — Product only
// ══════════════════════════════════════════════════════════════════════════════

export const DoorWindowCategoryContent = ({ values, onChange, productOptions = [] }) => (
    <div className='tw-flex tw-flex-col tw-gap-5'>
        <TradeGrid>
            {productOptions.length > 0 && (
                <ProductsDropdown
                    productOptions={productOptions}
                    value={values['__product'] || ''}
                    onChange={val => onChange('__product', val)}
                />
            )}
        </TradeGrid>
    </div>
)

// ══════════════════════════════════════════════════════════════════════════════
// 7. COMPONENT (mechanical / electrical / plumbing / hvac)
//    Mechanical: Product only
//    Electrical / Plumbing / HVAC: Product + Wire Length (from input_fields)
// ══════════════════════════════════════════════════════════════════════════════

export const ComponentCategoryContent = ({ takeoff, values, onChange, productOptions = [] }) => {
    const inputFields = sortInputFields(takeoff.input_fields || [])

    return (
        <div className='tw-flex tw-flex-col tw-gap-5'>
            <TradeGrid>
                {productOptions.length > 0 && (
                    <ProductsDropdown
                        productOptions={productOptions}
                        value={values['__product'] || ''}
                        onChange={val => onChange('__product', val)}
                    />
                )}
                {inputFields.map(f => (
                    <TakeoffNumberInput
                        key={f.id}
                        label={f.field_label}
                        value={values[f.field_key] ?? f.default_value ?? ''}
                        onChange={val => onChange(f.field_key, val)}
                        min={f.min_value}
                        max={f.max_value}
                        {...getUnitAndIntProps(f)}
                    />
                ))}
            </TradeGrid>
        </div>
    )
}

// ══════════════════════════════════════════════════════════════════════════════
// 8. STEEL — fixed per-type render plan guaranteeing all 80 fields in order
// ══════════════════════════════════════════════════════════════════════════════

// Ordered render steps per type_key.
// Steps: 'element_inputs' | 'section_type_og' | 'struct_products' | 'rebar_subtypes'
//        | 'direction_og' | 'misc_items' | 'cat_inputs:<catKey>' | 'cat_product:<catKey>'
export const STEEL_TYPE_PLANS = {
    slab:       ['cat_product:mesh','cat_product:deck','cat_inputs:rebar','direction_og','cat_product:rebar','cat_product:misc_steel'],
    roof_deck:  ['cat_product:deck','cat_inputs:purlin_joist','cat_product:purlin_joist','section_type_og','struct_products','cat_inputs:structural_steel','cat_product:misc_steel'],
    pile_cap:   ['cat_product:mesh','cat_inputs:rebar','direction_og','cat_product:rebar','cat_product:misc_steel'],
    stair:      ['cat_product:metal_stair','cat_inputs:railing','cat_product:railing','cat_product:misc_steel'],
    beam:       ['element_inputs','section_type_og','struct_products','rebar_subtypes','cat_product:misc_steel'],
    wall:       ['element_inputs','rebar_subtypes','cat_product:mesh','cat_product:misc_steel'],
    footing:    ['element_inputs','rebar_subtypes','cat_product:mesh','cat_inputs:misc_steel','cat_product:misc_steel'],
    grade_beam: ['element_inputs','rebar_subtypes','cat_product:mesh','cat_inputs:misc_steel','cat_product:misc_steel'],
    column:     ['element_inputs','cat_inputs:structural_steel','section_type_og','struct_products','rebar_subtypes','cat_product:misc_steel'],
}

export const getSteelFieldCount = (takeoff, tradeProducts) => {
    const types = [...(takeoff.types || [])].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
    const hasProducts = tradeProducts.length > 0
    let count = (takeoff.input_fields || []).filter(f => f.field_key === 'wastage').length

    types.forEach(type => {
        const plan      = STEEL_TYPE_PLANS[type.type_key] || ['element_inputs']
        const sectVals  = ((type.option_groups || []).find(og => og.group_key === 'section_type')?.values || []).filter(v => v.parent_option_key === 'structural_steel')
        const rebarVals = ((type.option_groups || []).find(og => og.group_key === 'rebar_type')?.values  || []).filter(v => v.parent_option_key === 'rebar')
        const dirVals   = ((type.option_groups || []).find(og => og.group_key === 'direction')?.values   || []).filter(v => v.parent_option_key === 'rebar')
        const structSteelFKs = new Set((type.input_fields || []).filter(f => f.condition_key === 'steel_category' && f.condition_value === 'structural_steel').map(f => f.field_key))

        plan.forEach(step => {
            if (step === 'element_inputs') {
                count += (type.input_fields || []).filter(f => !f.condition_key).length
            } else if (step === 'struct_products') {
                if (hasProducts) count += sectVals.length
            } else if (step === 'rebar_subtypes') {
                rebarVals.forEach(rv => {
                    count += (type.input_fields || []).filter(f => f.condition_key === 'rebar_type' && f.condition_value === rv.option_key && !structSteelFKs.has(f.field_key)).length
                    if (hasProducts) count += 1
                })
            } else if (step === 'section_type_og') {
                if (sectVals.length > 0) count += 1
            } else if (step === 'direction_og') {
                if (dirVals.length > 0) count += 1
            } else if (step.startsWith('cat_inputs:')) {
                const catKey = step.slice(11)
                count += (type.input_fields || []).filter(f => (f.condition_key === 'steel_category' && f.condition_value === catKey) || (catKey === 'rebar' && f.condition_key === 'rebar_type')).length
            } else if (step.startsWith('cat_product:')) {
                if (hasProducts) count += 1
            }
        })
    })
    return count
}

export const SteelCategoryContent = ({ takeoff, values, onChange, productOptions = [], tradeProducts = [] }) => {
    const types = [...(takeoff.types || [])].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
    const steelCatOg     = (takeoff.option_groups || []).find(og => og.group_key === 'steel_category')
    const steelCatValues = steelCatOg?.values || []
    const wastageFields  = sortInputFields(takeoff.input_fields || []).filter(f => f.field_key === 'wastage')

    const catKeyToId = {}
    steelCatValues.forEach(v => { catKeyToId[v.option_key] = v.id })

    return (
        <div className='tw-flex tw-flex-col tw-gap-5'>
            <Grid4>
                {types.map(type => {
                    const typeKey  = type.type_key
                    const typeName = type.type_name
                    const plan     = STEEL_TYPE_PLANS[typeKey] || ['element_inputs']

                    const sectionTypeOg  = (type.option_groups || []).find(og => og.group_key === 'section_type')
                    const rebarTypeOg    = (type.option_groups || []).find(og => og.group_key === 'rebar_type')
                    const directionOg    = (type.option_groups || []).find(og => og.group_key === 'direction')
                    const miscItemTypeOg = (type.option_groups || []).find(og => og.group_key === 'misc_item_type')

                    const sectVals  = (sectionTypeOg?.values  || []).filter(v => v.parent_option_key === 'structural_steel')
                    const rebarVals = (rebarTypeOg?.values    || []).filter(v => v.parent_option_key === 'rebar')
                    const dirVals   = (directionOg?.values    || []).filter(v => v.parent_option_key === 'rebar')

                    const getCatName = catKey => steelCatValues.find(v => v.option_key === catKey)?.option_name || catKey

                    const rebarSubName = rv => {
                        const name = rv.option_name
                        if (name === 'Stirrup' || name === 'Joint Reinforcement') return name
                        return `${name.replace(/\s*\(.*?\)/, '').trim()} Rebar`
                    }

                    const mkInput = (f, keyPrefix, lbl = f.field_label) => {
                        const vk = `type_input__${typeKey}__${f.field_key}${f.condition_value ? '__' + f.condition_value : ''}`
                        return (
                            <TakeoffNumberInput
                                key={`${keyPrefix}__${f.id}`}
                                label={lbl}
                                value={values[vk] ?? f.default_value ?? ''}
                                onChange={val => onChange(vk, val)}
                                min={f.min_value}
                                max={f.max_value}
                                {...getUnitAndIntProps(f)}
                            />
                        )
                    }

                    const getFilteredOpts = (catKey, namePrefix = null) => {
                        if (tradeProducts.length === 0) return productOptions
                        const catId = catKeyToId[catKey]
                        if (!catId) return productOptions
                        return tradeProducts
                            .filter(p =>
                                p.steel_category_id === catId &&
                                (p.element_type_ids || []).includes(type.id) &&
                                (namePrefix === null || p.product_name?.toLowerCase().startsWith(namePrefix.toLowerCase()))
                            )
                            .map(toProductOpt)
                    }

                    const mkProduct = (pk, label, catKey, namePrefix = null) => {
                        const opts = getFilteredOpts(catKey, namePrefix)
                        if (opts.length === 0) return null
                        const currentVal = values[pk] || ''
                        const resolvedVal = opts.find(o => o.id === currentVal) ? currentVal : opts[0].id
                        return (
                            <TakeoffSelectDropdown
                                key={pk}
                                label={label}
                                options={opts}
                                value={resolvedVal}
                                onChange={val => onChange(pk, val)}
                            />
                        )
                    }

                    const structSteelFKs = new Set(
                        (type.input_fields || [])
                            .filter(f => f.condition_key === 'steel_category' && f.condition_value === 'structural_steel')
                            .map(f => f.field_key)
                    )

                    const items = []

                    plan.forEach(step => {
                        if (step === 'element_inputs') {
                            sortInputFields((type.input_fields || []).filter(f => !f.condition_key))
                                .forEach(f => items.push(mkInput(f, `${type.id}__el`)))

                        } else if (step === 'struct_products') {
                            sectVals.forEach(sv => {
                                const pk = `__product__${typeKey}__structural_steel__${sv.option_key}`
                                items.push(mkProduct(pk, `${typeName} ${sv.option_name} Product`, 'structural_steel', sv.option_name))
                            })

                        } else if (step === 'rebar_subtypes') {
                            rebarVals.forEach(rv => {
                                const rsn = rebarSubName(rv)
                                const rebarInputs = sortInputFields((type.input_fields || []).filter(f =>
                                    f.condition_key === 'rebar_type' && f.condition_value === rv.option_key && !structSteelFKs.has(f.field_key)
                                ))
                                rebarInputs.forEach(f => {
                                    const lbl = f.field_label.startsWith(typeName) ? f.field_label : `${typeName} ${rsn} ${f.field_label}`
                                    items.push(mkInput(f, `${type.id}__rv__${rv.option_key}`, lbl))
                                })
                                const pk = `__product__${typeKey}__rebar__${rv.option_key}`
                                items.push(mkProduct(pk, `${typeName} ${rsn} Product`, 'rebar'))
                            })

                        } else if (step === 'section_type_og') {
                            if (sectVals.length > 0) {
                                const sectKey   = `__opt__section_type__${typeKey}`
                                const sectValue = values[sectKey] || sectVals.find(v => v.is_default)?.id || sectVals[0]?.id || ''
                                items.push(
                                    <TakeoffSelectDropdown
                                        key={`${type.id}__sect`}
                                        label={`${typeName} Structural Steel Section Type`}
                                        options={sectVals.map(toOptVal)}
                                        value={sectValue}
                                        onChange={val => onChange(sectKey, val)}
                                    />
                                )
                            }

                        } else if (step === 'direction_og') {
                            if (dirVals.length > 0) {
                                const dirKey   = `__opt__direction__${typeKey}`
                                const dirValue = values[dirKey] || dirVals.find(v => v.is_default)?.id || dirVals[0]?.id || ''
                                items.push(
                                    <TakeoffSelectDropdown
                                        key={`${type.id}__dir`}
                                        label={`${typeName} Rebar Direction`}
                                        options={dirVals.map(toOptVal)}
                                        value={dirValue}
                                        onChange={val => onChange(dirKey, val)}
                                    />
                                )
                            }

                        } else if (step === 'misc_items') {
                            ;(miscItemTypeOg?.values || []).forEach(miscItem => {
                                sortInputFields((type.input_fields || []).filter(f =>
                                    f.condition_key === 'steel_category' && f.condition_value === miscItem.option_key
                                )).forEach(f => items.push(mkInput(f, `${type.id}__mi__${miscItem.option_key}`)))
                                const pk = `__product__${typeKey}__${miscItem.option_key}`
                                items.push(mkProduct(pk, `${miscItem.option_name} Product`, miscItem.option_key))
                            })

                        } else if (step.startsWith('cat_inputs:')) {
                            const catKey         = step.slice(11)
                            const catNameForLabel = getCatName(catKey)
                            sortInputFields((type.input_fields || []).filter(f =>
                                (f.condition_key === 'steel_category' && f.condition_value === catKey) ||
                                (catKey === 'rebar' && f.condition_key === 'rebar_type')
                            )).forEach(f => {
                                // If field_label already contains the type name as prefix, use it as-is
                                // to avoid doubling (e.g. API returns "Pile Cap Rebar Spacing" not "Spacing")
                                const lbl = f.field_label.startsWith(typeName)
                                    ? f.field_label
                                    : catKey === 'structural_steel'
                                        ? `${typeName} ${f.field_label}`
                                        : `${typeName} ${catNameForLabel} ${f.field_label}`
                                items.push(mkInput(f, `${type.id}__ci__${catKey}`, lbl))
                            })

                        } else if (step.startsWith('cat_product:')) {
                            const catKey  = step.slice(12)
                            const pk      = `__product__${typeKey}__${catKey}`
                            const catName = getCatName(catKey)
                            const label   = catKey === 'metal_stair'
                                ? `${catName} Product`
                                : (typeKey === 'roof_deck' && catKey === 'deck')
                                    ? `${typeName} Product`
                                    : `${typeName} ${catName} Product`
                            items.push(mkProduct(pk, label, catKey))
                        }
                    })

                    return <React.Fragment key={type.id}>{items}</React.Fragment>
                })}

                {wastageFields.map(f => (
                    <TakeoffNumberInput
                        key={f.id}
                        label='Wastage (%)'
                        value={values[f.field_key] ?? f.default_value ?? ''}
                        onChange={val => onChange(f.field_key, val)}
                        unit={null}
                        min={f.min_value}
                        max={f.max_value}
                    />
                ))}
            </Grid4>
        </div>
    )
}

// ══════════════════════════════════════════════════════════════════════════════
// 9. STANDARD (flooring, ceiling, siding, etc.) — Product only + input_fields
// ══════════════════════════════════════════════════════════════════════════════

export const StandardCategoryContent = ({ takeoff, values, onChange, productOptions = [] }) => {
    const inputFields = sortInputFields(takeoff.input_fields || [])

    return (
        <div className='tw-flex tw-flex-col tw-gap-5'>
            <TradeGrid>
                {productOptions.length > 0 && (
                    <ProductsDropdown
                        productOptions={productOptions}
                        value={values['__product'] || ''}
                        onChange={val => onChange('__product', val)}
                    />
                )}
                {inputFields.map(f => (
                    <TakeoffNumberInput
                        key={f.id}
                        label={f.field_label}
                        value={values[f.field_key] ?? f.default_value ?? ''}
                        onChange={val => onChange(f.field_key, val)}
                        min={f.min_value}
                        max={f.max_value}
                        {...getUnitAndIntProps(f)}
                    />
                ))}
            </TradeGrid>
        </div>
    )
}

// ─── getCategoryContent ───────────────────────────────────────────────────────

export const getCategoryContent = (takeoff, values, onChange, tradeProducts = []) => {
    const key            = takeoff.takeoff_name?.toLowerCase()
    const productOptions = tradeProducts.map(toProductOpt)

    if (key === 'painting')    return <PaintingCategoryContent   takeoff={takeoff} values={values} onChange={onChange} productOptions={productOptions} />
    if (key === 'drywall')     return <DrywallCategoryContent    takeoff={takeoff} values={values} onChange={onChange} productOptions={productOptions} />
    if (key === 'roofing')     return <RoofingCategoryContent    takeoff={takeoff} values={values} onChange={onChange} productOptions={productOptions} />
    if (key === 'masonry')     return <MasonryCategoryContent    takeoff={takeoff} values={values} onChange={onChange} productOptions={productOptions} />
    if (key === 'door_window') return <DoorWindowCategoryContent takeoff={takeoff} values={values} onChange={onChange} productOptions={productOptions} />
    if (key === 'concrete')    return <ConcreteCategoryContent   takeoff={takeoff} values={values} onChange={onChange} productOptions={productOptions} />
    if (key === 'steel')       return <SteelCategoryContent      takeoff={takeoff} values={values} onChange={onChange} productOptions={productOptions} tradeProducts={tradeProducts} />
    if (COMPONENT_TAKEOFFS.has(key)) return <ComponentCategoryContent takeoff={takeoff} values={values} onChange={onChange} productOptions={productOptions} />

    return <StandardCategoryContent takeoff={takeoff} values={values} onChange={onChange} productOptions={productOptions} />
}