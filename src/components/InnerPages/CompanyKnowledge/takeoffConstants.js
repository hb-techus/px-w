// ─── Constants ────────────────────────────────────────────────────────────────

export const HIDE_GROUP_LABEL_SECTIONS = new Set(['masonry', 'labour_productivity'])
export const SKIP_SECTIONS             = new Set(['labour_share'])
export const COMPONENT_TAKEOFFS        = new Set(['mechanical', 'electrical', 'plumbing', 'hvac'])

export const PAINTING_TAKEOFF    = 'painting'
export const DRYWALL_TAKEOFF     = 'drywall'
export const DOOR_WINDOW_TAKEOFF = 'door_window'
export const MASONRY_TAKEOFF     = 'masonry'
export const ROOFING_TAKEOFF     = 'roofing'

export const TAKEOFF_FIELD_LABEL_MAP = {
    ceiling    : 'Ceiling Type',
    flooring   : 'Flooring Type',
    painting   : 'Painting Scope',
    drywall    : 'Drywall Type',
    roofing    : 'Roofing Type',
    concrete   : 'Element Type',
    siding     : 'Siding Type',
    masonry    : 'Masonry Type',
    door_window: 'Type',
    mechanical : 'Component',
    electrical : 'Component',
    plumbing   : 'Component',
    hvac       : 'Component',
    steel      : 'Type',
}

export const DRYWALL_FRAMING_OPTIONS = [
    { id: 'metal_studs',  label: 'Metal Studs'  },
    { id: 'timber_studs', label: 'Timber Studs' },
]

export const DRYWALL_STUD_OPTIONS = [
    { id: '16in_oc', label: '16 in OC' },
    { id: '24in_oc', label: '24 in OC' },
    { id: '12in_oc', label: '12 in OC' },
]

export const DRYWALL_INSULATION_OPTIONS = [
    { id: 'none',                    label: 'None'                      },
    { id: 'fiberglass_batt',         label: 'Fiberglass Batt'           },
    { id: 'mineral_wool_batt',       label: 'Mineral Wool Batt'         },
    { id: 'spray_foam_open_cell',    label: 'Spray Foam (Open-Cell)'    },
    { id: 'spray_foam_closed_cell',  label: 'Spray Foam (Closed-Cell)'  },
    { id: 'blown_in_fiberglass',     label: 'Blown-In Fiberglass'       },
    { id: 'blown_in_cellulose',      label: 'Blown-In Cellulose'        },
    { id: 'rigid_foam_board',        label: 'Rigid Foam Board'          },
]

export const DW_MATERIAL_OPTIONS = [
    { id: 'wood',                        label: 'Wood'                          },
    { id: 'aluminum',                    label: 'Aluminum'                      },
    { id: 'upvc',                        label: 'UPVC'                          },
    { id: 'glass',                       label: 'Glass'                         },
    { id: 'composite_engineered_material', label: 'Composite / Engineered Material' },
]

export const DW_GLASS_OPTIONS = [
    { id: 'single',      label: 'Single'       },
    { id: 'double_glaze', label: 'Double Glaze' },
    { id: 'laminated',   label: 'Laminated'    },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

export const sortInputFields = fields => [
    ...fields.filter(f => f.field_key !== 'wastage'),
    ...fields.filter(f => f.field_key === 'wastage'),
]

export const hasTakeoffEmptyField = values =>
    Object.values(values).some(v => v === '' || v === null || v === undefined || (typeof v === 'number' && v <= 0))

export const getTakeoffDisplayName = rawName => {
    if (rawName === 'door_window') return 'Doors & Windows'
    if (rawName === 'hvac')        return 'HVAC'
    return rawName.charAt(0).toUpperCase() + rawName.slice(1).replace(/_/g, ' ')
}