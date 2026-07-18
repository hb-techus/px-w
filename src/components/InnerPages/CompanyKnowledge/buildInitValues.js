import {
    sortInputFields,
    COMPONENT_TAKEOFFS,
} from './takeoffConstants.js'

// ─── helpers ──────────────────────────────────────────────────────────────────
const pickDefault = (arr = []) => arr.find(item => item.is_default) ?? arr[0]

// tradeProducts: primary products for this takeoff's trade (from GetProductList)
export const buildInitValues = (takeoff, tradeProducts = []) => {
    const key   = takeoff.takeoff_name?.toLowerCase()
    const types = takeoff.types || []

    // Only seed __type when the takeoff actually has types; an empty string would
    // cause hasTakeoffEmptyField to block saving for v2 trades that have no types.
    // Concrete shows all types at once (no Element Type selector), so skip __type there.
    const defType = types.length > 0 ? pickDefault(types) : null
    const init = {}
    if (defType && key !== 'concrete') init.__type = defType.id || ''

    sortInputFields(takeoff.input_fields || []).forEach(f => {
        init[f.field_key] = f.default_value ?? ''
    })

    // Seed the Products dropdown for non-concrete/non-steel trades.
    // Prefer the API-returned selected product (takeoff.products[0]), falling
    // back to the first available trade product so the field is never empty.
    if (tradeProducts.length > 0 && key !== 'concrete' && key !== 'steel') {
        const savedProductId = (takeoff.product_defaults || [])[0]?.product_id
        init.__product = savedProductId || tradeProducts[0].product_id || ''
    }

    // ── PAINTING ──────────────────────────────────────────────────────────────
    if (key === 'painting') return init

    // ── DRYWALL ───────────────────────────────────────────────────────────────
    if (key === 'drywall') {
        types.forEach(type => {
            if ((type.dimensions || []).length > 0)
                init[`${type.id}__dim`] = pickDefault(type.dimensions)?.id || ''
            if ((type.thickness || []).length > 0)
                init[`${type.id}__thick`] = pickDefault(type.thickness)?.id || ''
            ;(type.option_groups || []).forEach(og => {
                const k = `__${og.group_key}`
                if (!(k in init) && (og.values || []).length > 0)
                    init[k] = pickDefault(og.values)?.id || ''
            })
        })
        return init
    }

    // ── ROOFING ───────────────────────────────────────────────────────────────
    if (key === 'roofing') {
        types.forEach(type => {
            if ((type.dimensions || []).length > 0)
                init[`${type.id}__dim`] = pickDefault(type.dimensions)?.id || ''
        })
        // v2 API: roof_pitch is a top-level option_group; v1: inside types
        let pitchOg = (takeoff.option_groups || []).find(o => o.group_key === 'roof_pitch')
        if (!pitchOg) {
            for (const t of types) {
                pitchOg = (t.option_groups || []).find(o => o.group_key === 'roof_pitch')
                if (pitchOg) break
            }
        }
        if (pitchOg?.values?.length) {
            init['__roof_pitch'] = pickDefault(pitchOg.values)?.id || ''
        }
        return init
    }

    // ── MASONRY ───────────────────────────────────────────────────────────────
    if (key === 'masonry') {
        types.forEach(type => {
            if ((type.thickness || []).length > 0)
                init[`${type.id}__thick`] = pickDefault(type.thickness)?.id || ''
            const gg = (type.geometry_groups || []).find(g => g.geometry_key === 'unit_width')
            if (gg?.values?.length)
                init[`${type.id}__unit_width`] = pickDefault(gg.values)?.id || ''
        })
        return init
    }

    // ── DOOR & WINDOW ─────────────────────────────────────────────────────────
    if (key === 'door_window') {
        types.forEach(type => {
            if ((type.dimensions || []).length > 0)
                init[`${type.id}__dim`] = pickDefault(type.dimensions)?.id || ''
            ;(type.option_groups || []).forEach(og => {
                const flatKey = og.group_key === 'material_type' ? '__material'
                    : og.group_key === 'glass_type' ? '__glass_type'
                        : `__${og.group_key}`
                if (!(flatKey in init) && (og.values || []).length > 0)
                    init[flatKey] = pickDefault(og.values)?.id || ''
            })
        })
        return init
    }

    // ── CONCRETE ──────────────────────────────────────────────────────────────
    if (key === 'concrete') {
        const seenO = new Set()
        types.forEach(type => {
            ;(type.option_groups || []).forEach(og => {
                if (!seenO.has(og.group_key)) {
                    seenO.add(og.group_key)
                    init[`__opt__${og.group_key}`] = pickDefault(og.values)?.id || ''
                }
            })
            ;(type.geometry_groups || []).forEach(gg => {
                init[`${type.id}__geo__${gg.geometry_key}`] = pickDefault(gg.values)?.id || ''
            })
            if ((type.dimensions || []).length > 0)
                init[`${type.id}__dim`] = pickDefault(type.dimensions)?.id || ''
            sortInputFields(type.input_fields || []).forEach(f => {
                init[`type__${type.id}__${f.field_key}__${f.id}`] = f.default_value ?? ''
            })
            // Per-type product — prefer the saved product from the API response
            if (tradeProducts.length > 0 && type.type_key) {
                const savedProductId = (type.product_defaults || [])[0]?.product_id
                init[`__product__${type.type_key}`] = savedProductId || tradeProducts[0].product_id || ''
            }
        })
        return init
    }

    // ── STEEL ─────────────────────────────────────────────────────────────────
    if (key === 'steel') {
        // ── Type-level input_fields — keyed per type + field + condition so fields
        // like bar_length have independent values across slab/footing/pile_cap/grade_beam
        types.forEach(type => {
            sortInputFields(type.input_fields || []).forEach(f => {
                const k = `type_input__${type.type_key}__${f.field_key}${f.condition_value ? '__' + f.condition_value : ''}`
                if (!(k in init)) init[k] = f.default_value ?? ''
            })
        })

        // ── Option groups
        const STEEL_RENDERED_OPT_KEYS = new Set([
            'steel_category',
            'section_type',
            'mesh_type',
            'cmu_vertical_rebar',
            'cmu_horizontal_rebar',
            'cmu_joint_reinforcement',
            'cmu_joint_reinforcement_spacing',
            'purlin_type',
            'truss_member_type',
            'deck_profile',
            'deck_gauge',
        ])

        const seenOg = new Set()
        types.forEach(type => {
            ;(type.option_groups || []).forEach(og => {
                if (og.group_key === 'misc_item_type') return

                if (og.group_key === 'rebar_type') {
                    const rtKey = `__opt__rebar_type__${type.type_key}`
                    if (!seenOg.has(rtKey)) {
                        seenOg.add(rtKey)
                        init[rtKey] = pickDefault(og.values)?.id || ''
                    }
                    return
                }

                if (og.group_key === 'direction') {
                    const dirKey = `__opt__direction__${type.type_key}`
                    if (!seenOg.has(dirKey)) {
                        seenOg.add(dirKey)
                        const dirVals = (og.values || []).filter(v => v.parent_option_key === 'rebar')
                        init[dirKey] = pickDefault(dirVals)?.id || ''
                    }
                    return
                }

                if (og.group_key === 'section_type') {
                    const stKey = `__opt__section_type__${type.type_key}`
                    if (!seenOg.has(stKey)) {
                        seenOg.add(stKey)
                        const structVals = (og.values || []).filter(v => v.parent_option_key === 'structural_steel')
                        init[stKey] = pickDefault(structVals.length ? structVals : og.values)?.id || ''
                    }
                    return
                }

                if (!STEEL_RENDERED_OPT_KEYS.has(og.group_key)) return

                if (!seenOg.has(og.group_key)) {
                    seenOg.add(og.group_key)
                    init[`__opt__${og.group_key}`] = pickDefault(og.values)?.id || ''
                }
            })
        })

        // ── Spec groups
        const STEEL_FLAT_SPEC_KEYS = new Set([
            'bar_diameter__main',
            'bar_diameter__distribution',
            'bar_diameter__stirrup',
            'bar_diameter__tie',
            'bar_spacing',
            'lap_length',
            'truss_section_size',
        ])

        const seenSg = new Set()
        types.forEach(type => {
            ;(type.spec_groups || []).forEach(sg => {
                if (seenSg.has(sg.spec_key)) return
                seenSg.add(sg.spec_key)

                if (STEEL_FLAT_SPEC_KEYS.has(sg.spec_key)) {
                    init[`__spec__${sg.spec_key}`] = pickDefault(sg.values)?.id || ''
                    return
                }

                const globalVals   = (sg.values || []).filter(v => !v.parent_option_key)
                const parentedVals = (sg.values || []).filter(v =>  v.parent_option_key)

                if (parentedVals.length > 0) {
                    const byParent = {}
                    parentedVals.forEach(v => {
                        ;(byParent[v.parent_option_key] = byParent[v.parent_option_key] || []).push(v)
                    })
                    Object.entries(byParent).forEach(([pk, pv]) => {
                        init[`__spec__${sg.spec_key}__${pk}`] = pickDefault(pv)?.id || ''
                    })
                }
                if (globalVals.length > 0) {
                    init[`__spec__${sg.spec_key}`] = pickDefault(globalVals)?.id || ''
                } else if (parentedVals.length === 0) {
                    init[`__spec__${sg.spec_key}`] = pickDefault(sg.values)?.id || ''
                }
            })
        })

        // Also seed top-level option_groups for steel (e.g. steel_category in v2)
        ;(takeoff.option_groups || []).forEach(og => {
            if (og.group_key === 'misc_item_type') return
            if (!STEEL_RENDERED_OPT_KEYS.has(og.group_key)) return
            if (!(`__opt__${og.group_key}` in init)) {
                init[`__opt__${og.group_key}`] = pickDefault(og.values)?.id || ''
            }
        })

        // Per-type × per-steel-category product keys — mirrors STEEL_TYPE_PLANS in takeoffCategoryContent.js
        if (tradeProducts.length > 0) {
            const firstProd = tradeProducts[0].product_id || ''
            const STEEL_SEED_PLANS = {
                slab:        ['mesh','deck','rebar_flat','misc_steel'],
                roof_deck:   ['deck','purlin_joist','struct_per_section','misc_steel'],
                pile_cap:    ['mesh','rebar_flat','misc_steel'],
                stair:       ['metal_stair','railing','misc_steel'],
                beam:        ['struct_per_section','rebar_per_subtype','misc_steel'],
                wall:        ['rebar_per_subtype','mesh','misc_steel'],
                footing:     ['rebar_per_subtype','mesh','misc_steel'],
                grade_beam:  ['rebar_per_subtype','mesh','misc_steel'],
                column:      ['struct_per_section','rebar_per_subtype','misc_steel'],
            }
            const SIMPLE_CAT_ITEMS = new Set(['mesh','deck','misc_steel','purlin_joist','metal_stair','railing'])

            // catKeyToId: option_key → id from the top-level steel_category option_group
            const steelCatOg = (takeoff.option_groups || []).find(og => og.group_key === 'steel_category')
            const catKeyToId = {}
            ;(steelCatOg?.values || []).forEach(v => { catKeyToId[v.option_key] = v.id })

            types.forEach(type => {
                const typeKey = type.type_key
                const plan = STEEL_SEED_PLANS[typeKey]
                if (!plan) return

                const sectionTypeOg = (type.option_groups || []).find(og => og.group_key === 'section_type')
                const rebarTypeOg   = (type.option_groups || []).find(og => og.group_key === 'rebar_type')
                const savedProds = type.product_defaults || []

                // Find saved product for a given category + optional condition
                const findSaved = (catId, condKey, condVal) =>
                    savedProds.find(p =>
                        p.steel_category_id === catId &&
                        (condKey ? p.condition_key === condKey && p.condition_value === condVal : !p.condition_key)
                    )?.product_id

                plan.forEach(item => {
                    if (SIMPLE_CAT_ITEMS.has(item)) {
                        const pk = `__product__${typeKey}__${item}`
                        if (!(pk in init)) init[pk] = findSaved(catKeyToId[item]) || firstProd
                    } else if (item === 'rebar_flat') {
                        const pk = `__product__${typeKey}__rebar`
                        if (!(pk in init)) init[pk] = findSaved(catKeyToId['rebar']) || firstProd
                    } else if (item === 'struct_per_section') {
                        ;(sectionTypeOg?.values || [])
                            .filter(v => v.parent_option_key === 'structural_steel')
                            .forEach(sv => {
                                const pk = `__product__${typeKey}__structural_steel__${sv.option_key}`
                                if (!(pk in init)) init[pk] = findSaved(catKeyToId['structural_steel'], 'section_type', sv.option_key) || firstProd
                            })
                    } else if (item === 'rebar_per_subtype') {
                        ;(rebarTypeOg?.values || [])
                            .filter(v => v.parent_option_key === 'rebar')
                            .forEach(rv => {
                                const pk = `__product__${typeKey}__rebar__${rv.option_key}`
                                if (!(pk in init)) init[pk] = findSaved(catKeyToId['rebar'], 'rebar_type', rv.option_key) || firstProd
                            })
                    }
                })
            })
        }

        // Takeoff-level input_fields (wastage only)
        sortInputFields(takeoff.input_fields || []).filter(f => f.field_key === 'wastage').forEach(f => {
            init[f.field_key] = f.default_value ?? ''
        })

        return init
    }

    // ── COMPONENT TAKEOFFS (mechanical / electrical / plumbing / hvac) ────────
    if (COMPONENT_TAKEOFFS.has(key)) {
        types.forEach(type => {
            const specGroups = type.spec_groups  || []
            const dims       = type.dimensions   || []
            const optGroups  = type.option_groups || []

            if (key === 'hvac') {
                optGroups.forEach(og => {
                    if (og.group_key === 'duct_shape') {
                        init[`${type.id}__opt__duct_shape`] = pickDefault(og.values)?.id || ''
                        ;(og.values || []).forEach(sv => {
                            const ss = specGroups.flatMap(sg =>
                                (sg.values || []).filter(v => v.parent_option_key === sv.option_key)
                            )
                            if (ss.length > 0)
                                init[`${type.id}__duct__${sv.option_key}`] = pickDefault(ss)?.id || ''
                        })
                    } else {
                        init[`${type.id}__opt__${og.group_key}`] = pickDefault(og.values)?.id || ''
                    }
                })
                specGroups.forEach(sg => {
                    const gs = (sg.values || []).filter(v => !v.parent_option_key)
                    if (gs.length > 0)
                        init[`${type.id}__spec__${sg.spec_key}`] = pickDefault(gs)?.id || ''
                })
            } else if (key === 'plumbing') {
                optGroups.forEach(og => {
                    if ((og.values || []).length > 0)
                        init[`${type.id}__opt__${og.group_key}`] = pickDefault(og.values)?.id || ''
                })
                specGroups.forEach(sg => {
                    init[`${type.id}__spec__${sg.spec_key}`] = pickDefault(sg.values)?.id || ''
                })
            } else {
                // mechanical, electrical
                optGroups.forEach(og => {
                    if ((og.values || []).length > 0)
                        init[`${type.id}__opt__${og.group_key}`] = pickDefault(og.values)?.id || ''
                })
                specGroups.forEach(sg => {
                    if ((sg.values || []).length > 0)
                        init[`${type.id}__spec__${sg.spec_key}`] = pickDefault(sg.values)?.id || ''
                })
            }

            if (dims.length > 0)
                init[`${type.id}__dim`] = pickDefault(dims)?.id || ''

            sortInputFields(type.input_fields || []).forEach(f => {
                init[`type__${type.id}__${f.field_key}__${f.id}`] = f.default_value ?? ''
            })
        })
        return init
    }

    // ── STANDARD (flooring / ceiling / siding / etc.) ─────────────────────────
    types.forEach(type => {
        if ((type.dimensions || []).length > 0)
            init[`${type.id}__dim`] = pickDefault(type.dimensions)?.id || ''
        if ((type.thickness || []).length > 0)
            init[`${type.id}__thick`] = pickDefault(type.thickness)?.id || ''
    })
    return init
}
