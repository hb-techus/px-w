export const SUMMARY = {
  version: 'v.12',
  totalBid: 530908,
  prevVersion: 'v.11',
  changePct: 4.2,
  changeAmt: 21399,
  material: 195287,
  materialPct: 46.7,
  labor: 146812,
  laborPct: 35.1,
  laborHrs: 1862,
};

export const MAT_CAT_CONFIG = {
  Flooring:           { iconBg: '#EEF3FF', iconColor: '#4F6BED', border: '#1476FF' },
  Drywall:            { iconBg: '#FFF7ED', iconColor: '#F97415', border: '#F97415' },
  Ceiling:            { iconBg: '#ECFDF5', iconColor: '#10B981', border: '#10B981' },
  Paint:              { iconBg: '#FDF2F8', iconColor: '#EC4899', border: '#EC4899' },
  Masonry:            { iconBg: '#EFF6FF', iconColor: '#2563EB', border: '#2563EB' },
  'Concrete Slab':    { iconBg: '#FFF1F2', iconColor: '#F43F5E', border: '#F43F5E' },
  'Concrete Footings':{ iconBg: '#EFF6FF', iconColor: '#3B82F6', border: '#3B82F6' },
  'Steel Structure':  { iconBg: '#EDEFFF', iconColor: '#6366F1', border: '#6366F1' },
};
export const MAT_FALLBACK = { iconBg: '#F1F5F9', iconColor: '#64748B', border: '#94A3B8' };

export const MATERIAL_GROUPS = [
  {
    id: 'flooring', name: 'Flooring', csiCode: '09 60 00', trade: 'Flooring', pct: 46.9, subtotal: 91618.04,
    items: [
      { id: 'm1', product: 'Tile 1 Ft × 1 Ft Porcelain', csi: '09 30 13', waste: 12, quantity: 17396, quantityWastage: 19484, unit: 'EA', unitCost: 3.74, totalCost: 1548.00 },
      { id: 'm2', product: 'Vinyl Plank LVT 6"×48"', csi: '09 65 00', waste: 10, quantity: 4820, quantityWastage: 5320, unit: 'SF', unitCost: 2.85, totalCost: 10094.00 },
      { id: 'm3', product: 'Thinset Mortar Modified 50 Lb', csi: '09 30 13', waste: 8, quantity: 412, quantityWastage: 445, unit: 'BAG', unitCost: 24.50, totalCost: 1178.00 },
      { id: 'm4', product: 'Grout Sanded 25 Lb (Pearl Gray)', csi: '09 30 13', waste: 6, quantity: 86, quantityWastage: 91, unit: 'BAG', unitCost: 18.00, totalCost: 13737.00 },
      { id: 'm5', product: 'Vinyl Cove Base 4"', csi: '09 65 00', waste: 8, quantity: 1240, quantityWastage: 1339, unit: 'LF', unitCost: 0.95, totalCost: 65061.04 },
      { id: 'm6', product: 'Floor Leveling Compound 50 Lb', csi: '09 60 00', waste: 5, quantity: 240, quantityWastage: 252, unit: 'BAG', unitCost: 32.00, totalCost: 8064.00 },
      { id: 'm7', product: 'Ceramic Floor Tile 12"×12"', csi: '09 30 13', waste: 10, quantity: 3200, quantityWastage: 3520, unit: 'SF', unitCost: 4.20, totalCost: 14784.00 },
    ],
  },
  {
    id: 'drywall', name: 'Drywall', csiCode: '09 29 00', trade: 'Drywall', pct: 15.6, subtotal: 30474.70,
    items: [
      { id: 'm8',  product: 'Gypsum Board 5/8" Type X 4×8',       csi: '09 29 00', waste: 10, quantity: 3200, quantityWastage: 3520, unit: 'SF',  unitCost: 1.85, totalCost: 6512.00 },
      { id: 'm9',  product: 'Gypsum Board 1/2" Regular 4×8',       csi: '09 29 00', waste: 10, quantity: 4800, quantityWastage: 5280, unit: 'SF',  unitCost: 1.45, totalCost: 7656.00 },
      { id: 'm10', product: 'Joint Compound All Purpose 4.5 Gal',  csi: '09 29 00', waste:  8, quantity:   48, quantityWastage:   52, unit: 'PLT', unitCost: 24.50, totalCost: 1274.00 },
      { id: 'm11', product: 'Paper Tape 500 Ft Roll',               csi: '09 29 00', waste:  5, quantity:   86, quantityWastage:   91, unit: 'RL',  unitCost:  8.40, totalCost:  764.40 },
      { id: 'm12', product: 'Corner Bead Vinyl 8 Ft',               csi: '09 22 16', waste:  8, quantity:  240, quantityWastage:  260, unit: 'EA',  unitCost:  3.20, totalCost:  832.00 },
      { id: 'm13', product: 'Metal Track 25 Ga 3-5/8"',             csi: '09 22 16', waste:  5, quantity:  480, quantityWastage:  504, unit: 'LF',  unitCost:  1.95, totalCost:  982.80 },
      { id: 'm14', product: 'Metal Stud 25 Ga 3-5/8" 10 Ft',        csi: '09 22 16', waste:  5, quantity:  960, quantityWastage: 1008, unit: 'EA',  unitCost:  2.45, totalCost: 2469.60 },
      { id: 'm15', product: 'Drywall Screws 1-5/8" 1 Lb Box',       csi: '09 29 00', waste:  5, quantity:  120, quantityWastage:  126, unit: 'BX',  unitCost: 18.50, totalCost: 2331.00 },
    ],
  },
  {
    id: 'ceiling', name: 'Ceiling', csiCode: '05 41 00', trade: 'Ceiling', pct: 11.7, subtotal: 22810.60,
    items: [
      { id: 'm16', product: 'Acoustic Ceiling Tile 24"×24" Fissured', csi: '09 51 13', waste: 10, quantity: 2400, quantityWastage: 2640, unit: 'SF', unitCost:  2.85, totalCost:  7524.00 },
      { id: 'm17', product: 'T-Bar Grid Main Runner 12 Ft',            csi: '09 53 23', waste:  5, quantity:  360, quantityWastage:  378, unit: 'EA', unitCost: 12.40, totalCost:  4687.20 },
      { id: 'm18', product: 'T-Bar Cross Tee 4 Ft',                    csi: '09 53 23', waste:  5, quantity:  720, quantityWastage:  756, unit: 'EA', unitCost:  4.80, totalCost:  3628.80 },
      { id: 'm19', product: 'Ceiling Grid Hanger Wire 12 Ga',          csi: '05 41 00', waste:  8, quantity:  480, quantityWastage:  520, unit: 'LF', unitCost:  0.95, totalCost:   494.00 },
    ],
  },
  {
    id: 'paint', name: 'Paint', csiCode: '03 30 00', trade: 'Paint', pct: 11.3, subtotal: 22016.80,
    items: [
      { id: 'm20', product: 'Interior Paint Flat White 5 Gal', csi: '09 91 23', waste: 8, quantity: 240, quantityWastage: 260, unit: 'GL', unitCost: 42.50, totalCost: 11050.00 },
      { id: 'm21', product: 'Primer Sealer 5 Gal',             csi: '09 91 23', waste: 8, quantity: 120, quantityWastage: 130, unit: 'GL', unitCost: 38.00, totalCost:  4940.00 },
      { id: 'm22', product: 'Paint Roller 9" Nap Kit',         csi: '09 91 23', waste: 5, quantity:  48, quantityWastage:  51, unit: 'KT', unitCost: 12.80, totalCost:   652.80 },
      { id: 'm23', product: 'Masking Tape 2" 60 Yd',           csi: '09 91 23', waste: 5, quantity: 240, quantityWastage: 252, unit: 'RL', unitCost:  5.60, totalCost:  1411.20 },
    ],
  },
  {
    id: 'masonry', name: 'Masonry', csiCode: '23 00 00', trade: 'Masonry', pct: 4.2, subtotal: 8208.00,
    items: [
      { id: 'm24', product: 'Concrete Masonry Unit 8"×8"×16"', csi: '03 31 00', waste: 5, quantity: 1200, quantityWastage: 1260, unit: 'EA',  unitCost:  3.80, totalCost: 4788.00 },
      { id: 'm25', product: 'Mortar Mix Type S 80 Lb',          csi: '03 31 00', waste: 8, quantity:  360, quantityWastage:  390, unit: 'BAG', unitCost:  8.50, totalCost: 3315.00 },
    ],
  },
  {
    id: 'concrete_slab', name: 'Concrete Slab', csiCode: '09 90 00', trade: 'Concrete', pct: 3.9, subtotal: 7687.00,
    items: [
      { id: 'm26', product: 'Ready-Mix Concrete 3000 PSI',    csi: '03 31 00', waste: 5, quantity:  42, quantityWastage:  45, unit: 'CY',  unitCost: 145.00, totalCost: 6525.00 },
      { id: 'm27', product: 'Rebar #5 × 20 Ft Grade 60',      csi: '03 21 00', waste: 8, quantity: 120, quantityWastage: 130, unit: 'EA',  unitCost:   8.90, totalCost: 1157.00 },
      { id: 'm28', product: 'Vapor Barrier 10 Mil 20"×100"',  csi: '03 30 00', waste: 5, quantity:   6, quantityWastage:   7, unit: 'RL',  unitCost:  62.00, totalCost:  434.00 },
    ],
  },
  {
    id: 'concrete_footings', name: 'Concrete Footings', csiCode: '26 00 00', trade: 'Concrete', pct: 3.5, subtotal: 6836.00,
    items: [
      { id: 'm29', product: 'Ready-Mix Concrete 4000 PSI', csi: '03 31 00', waste:  5, quantity:  36, quantityWastage:  38, unit: 'CY',  unitCost: 158.00, totalCost: 6004.00 },
      { id: 'm30', product: 'Rebar #4 × 20 Ft Grade 60',   csi: '03 21 00', waste:  8, quantity:  80, quantityWastage:  87, unit: 'EA',  unitCost:   9.40, totalCost:  817.80 },
      { id: 'm31', product: 'Form Board 2"×6"×16 Ft',       csi: '03 11 00', waste: 10, quantity: 120, quantityWastage: 132, unit: 'EA',  unitCost:   8.60, totalCost: 1135.20 },
    ],
  },
  {
    id: 'steel_structure', name: 'Steel Structure', csiCode: '22 00 00', trade: 'Steel', pct: 2.9, subtotal: 5636.00,
    items: [
      { id: 'm32', product: 'Wide Flange Beam W10×26',           csi: '05 12 00', waste: 3, quantity:  24, quantityWastage:  25, unit: 'EA', unitCost: 148.00, totalCost: 3700.00 },
      { id: 'm33', product: 'Steel Column HSS 6"×6"×1/4"',       csi: '05 12 00', waste: 3, quantity:  12, quantityWastage:  13, unit: 'EA', unitCost: 185.00, totalCost: 2405.00 },
      { id: 'm34', product: 'Anchor Bolt 3/4"×12" Grade 36',     csi: '05 05 00', waste: 5, quantity:  96, quantityWastage: 101, unit: 'EA', unitCost:  12.80, totalCost: 1292.80 },
    ],
  },
];

export const TRADES = ['All Trades', 'Flooring', 'Drywall', 'Ceiling', 'Paint', 'Masonry', 'Concrete', 'Steel'];

export const GROUP_BY_OPTIONS = [
  { value: 'trade', label: 'Trade' },
  { value: 'csi',   label: 'CSI Division' },
  { value: 'none',  label: 'None' },
];

export const ADD_LINE_OPTIONS = {
  divisions: [
    'Division 03 - Concrete',
    'Division 04 - Masonry',
    'Division 05 - Metals',
    'Division 06 - Wood',
    'Division 09 - Finishes',
  ],
  sections: {
    'Division 03 - Concrete':  ['03 10 00 - Concrete Forming', '03 20 00 - Concrete Reinforcing', '03 30 00 - Cast-In-Place Concrete'],
    'Division 04 - Masonry':   ['04 20 00 - Unit Masonry', '04 22 00 - Concrete Unit Masonry'],
    'Division 05 - Metals':    ['05 12 00 - Structural Steel Framing', '05 21 00 - Steel Joist Framing'],
    'Division 06 - Wood':      ['06 11 00 - Wood Framing'],
    'Division 09 - Finishes':  ['09 22 00 - Supports for Plaster', '09 29 00 - Gypsum Board', '09 60 00 - Flooring'],
  },
  subsections: {
    '03 20 00 - Concrete Reinforcing':    ['03 21 00 - Reinforcing Steel', '03 22 00 - Welded Wire Fabric'],
    '03 30 00 - Cast-In-Place Concrete':  ['03 31 00 - Structural Concrete', '03 35 00 - Concrete Finishing'],
    '03 10 00 - Concrete Forming':        ['03 11 00 - Structural Cast-In-Place Formwork'],
    '04 20 00 - Unit Masonry':            ['04 21 00 - Clay Unit Masonry', '04 22 00 - Concrete Unit Masonry'],
    '05 12 00 - Structural Steel Framing':['05 12 13 - Columns', '05 12 23 - Beams'],
    '09 29 00 - Gypsum Board':            ['09 29 10 - Gypsum Board System', '09 29 20 - Acoustical Gypsum Board'],
    '09 60 00 - Flooring':                ['09 65 00 - Resilient Flooring', '09 63 00 - Masonry Flooring'],
  },
  trades: ['Concrete', 'Masonry', 'Steel', 'Flooring', 'Drywall', 'Ceiling', 'Paint'],
  products: {
    '03 21 00 - Reinforcing Steel':  ['03 21 00.001 Rebar #4 × 20 ft Grade 60', '03 21 00.002 Rebar #5 × 20 ft Grade 60', '03 21 00.003 Rebar #6 × 20 ft Grade 60'],
    '03 31 00 - Structural Concrete':['03 31 00.001 Ready-Mix Concrete 3000 PSI', '03 31 00.002 Ready-Mix Concrete 4000 PSI'],
    '09 65 00 - Resilient Flooring': ['09 65 00.001 Vinyl Plank LVT 6"×48"', '09 65 00.002 Vinyl Cove Base 4"'],
    '09 29 10 - Gypsum Board System':['09 29 10.001 Gypsum Board 5/8" Type X', '09 29 10.002 Gypsum Board 1/2" Regular'],
  },
};

export const LABOR_GROUPS = [
  {
    id: 'flooring', name: 'Flooring', csiCode: '09 60 00', trade: 'Flooring',
    crewCount: 5, totalHours: 469.2, pct: 23.8, subtotal: 34904.72,
    crews: [
      { id: 'l1', area: 'Area-3', csi: 'CSI 09 30 13', sf: '3,160 SF', crewName: 'Tile and Stone Setters', memberCount: 4, hours: 142.20, totalCost: 11091.60,
        breakdown: { title: 'Area-3 Tile and Stone Setters', members: [{ role: 'Journeyman', wage: 78.00, hours: 58.0, total: 4524.00 }, { role: 'Apprentice', wage: 56.16, hours: 31.5, total: 1769.04 }, { role: 'Forman', wage: 92.04, hours: 16.2, total: 1491.05 }], totalHours: 142.2, crewTotal: 11091.60 } },
      { id: 'l2', area: 'Area-1', csi: 'CSI 09 30 13', sf: '2,770 SF', crewName: 'Tile and Stone Setters', memberCount: 4, hours: 124.64, totalCost: 9721.92,
        breakdown: { title: 'Area-1 Tile and Stone Setters', members: [{ role: 'Journeyman', wage: 78.00, hours: 50.8, total: 3962.40 }, { role: 'Apprentice', wage: 56.16, hours: 27.6, total: 1550.02 }, { role: 'Forman', wage: 92.04, hours: 14.2, total: 1307.97 }], totalHours: 124.64, crewTotal: 9721.92 } },
      { id: 'l3', area: 'Area-2', csi: 'CSI 09 30 13', sf: '2,142 SF', crewName: 'Tile and Stone Setters', memberCount: 4, hours: 96.40, totalCost: 7519.20,
        breakdown: { title: 'Area-2 Tile and Stone Setters', members: [{ role: 'Journeyman', wage: 78.00, hours: 53.0, total: 4134.00 }, { role: 'Apprentice', wage: 56.16, hours: 28.9, total: 1623.02 }, { role: 'Forman', wage: 92.04, hours: 14.5, total: 1334.58 }], totalHours: 96.4, crewTotal: 7091.60 } },
      { id: 'l4', area: 'Area-5', csi: 'CSI 09 65 00', sf: '3,055 SF', crewName: 'Floor Layers', memberCount: 4, hours: 67.20, totalCost: 4166.40,
        breakdown: { title: 'Area-5 Floor Layers', members: [{ role: 'Lead Layer', wage: 72.50, hours: 32.0, total: 2320.00 }, { role: 'Layer', wage: 58.40, hours: 24.0, total: 1401.60 }, { role: 'Helper', wage: 38.20, hours: 11.2, total: 427.84 }], totalHours: 67.2, crewTotal: 4166.40 } },
      { id: 'l5', area: 'Area-4', csi: 'CSI 09 65 00', sf: '1,764 SF', crewName: 'Floor Layers', memberCount: 4, hours: 38.80, totalCost: 2405.60,
        breakdown: { title: 'Area-4 Floor Layers', members: [{ role: 'Lead Layer', wage: 72.50, hours: 18.0, total: 1305.00 }, { role: 'Layer', wage: 58.40, hours: 14.0, total: 817.60 }, { role: 'Helper', wage: 38.20, hours: 7.2, total: 275.04 }], totalHours: 38.8, crewTotal: 2405.60 } },
    ],
  },
  {
    id: 'drywall', name: 'Drywall', csiCode: '09 29 00', trade: 'Drywall',
    crewCount: 3, totalHours: 424.5, pct: 20.8, subtotal: 30474.70,
    crews: [
      { id: 'l6', area: 'Area-2', csi: 'CSI 09 29 00', sf: '4,200 SF', crewName: 'Drywall Installers', memberCount: 5, hours: 168.0, totalCost: 12096.00,
        breakdown: { title: 'Area-2 Drywall Installers', members: [{ role: 'Lead Installer', wage: 74.00, hours: 72.0, total: 5328.00 }, { role: 'Installer', wage: 62.00, hours: 60.0, total: 3720.00 }, { role: 'Taper', wage: 68.00, hours: 36.0, total: 2448.00 }], totalHours: 168.0, crewTotal: 12096.00 } },
      { id: 'l7', area: 'Area-1', csi: 'CSI 09 29 00', sf: '3,800 SF', crewName: 'Drywall Installers', memberCount: 5, hours: 152.0, totalCost: 10944.00,
        breakdown: { title: 'Area-1 Drywall Installers', members: [{ role: 'Lead Installer', wage: 74.00, hours: 65.0, total: 4810.00 }, { role: 'Installer', wage: 62.00, hours: 54.0, total: 3348.00 }, { role: 'Taper', wage: 68.00, hours: 33.0, total: 2244.00 }], totalHours: 152.0, crewTotal: 10944.00 } },
      { id: 'l8', area: 'Area-3', csi: 'CSI 09 29 00', sf: '1,960 SF', crewName: 'Finishing Crew', memberCount: 3, hours: 104.5, totalCost: 7434.70,
        breakdown: { title: 'Area-3 Finishing Crew', members: [{ role: 'Finisher', wage: 72.50, hours: 52.0, total: 3770.00 }, { role: 'Helper', wage: 45.00, hours: 52.5, total: 2362.50 }], totalHours: 104.5, crewTotal: 7434.70 } },
    ],
  },
  {
    id: 'ceiling', name: 'Ceiling', csiCode: '05 41 00', trade: 'Ceiling',
    crewCount: 2, totalHours: 310.0, pct: 19.4, subtotal: 28520.00,
    crews: [
      { id: 'l9', area: 'Area-1', csi: 'CSI 09 53 23', sf: '3,500 SF', crewName: 'Acoustical Crew', memberCount: 4, hours: 168.0, totalCost: 15456.00,
        breakdown: { title: 'Area-1 Acoustical Crew', members: [{ role: 'Lead Installer', wage: 82.00, hours: 72.0, total: 5904.00 }, { role: 'Installer', wage: 74.00, hours: 60.0, total: 4440.00 }, { role: 'Helper', wage: 52.00, hours: 36.0, total: 1872.00 }], totalHours: 168.0, crewTotal: 15456.00 } },
      { id: 'l10', area: 'Area-2', csi: 'CSI 09 53 23', sf: '2,800 SF', crewName: 'Acoustical Crew', memberCount: 4, hours: 142.0, totalCost: 13064.00,
        breakdown: { title: 'Area-2 Acoustical Crew', members: [{ role: 'Lead Installer', wage: 82.00, hours: 60.0, total: 4920.00 }, { role: 'Installer', wage: 74.00, hours: 50.0, total: 3700.00 }, { role: 'Helper', wage: 52.00, hours: 32.0, total: 1664.00 }], totalHours: 142.0, crewTotal: 13064.00 } },
    ],
  },
  {
    id: 'paint', name: 'Paint', csiCode: '03 30 00', trade: 'Paint',
    crewCount: 2, totalHours: 212.0, pct: 12.1, subtotal: 22016.80,
    crews: [
      { id: 'l11', area: 'Area-1', csi: 'CSI 09 91 23', sf: '5,200 SF', crewName: 'Painters', memberCount: 4, hours: 112.0, totalCost: 11648.00,
        breakdown: { title: 'Area-1 Painters', members: [{ role: 'Lead Painter', wage: 68.00, hours: 48.0, total: 3264.00 }, { role: 'Painter', wage: 58.00, hours: 48.0, total: 2784.00 }, { role: 'Helper', wage: 42.00, hours: 16.0, total: 672.00 }], totalHours: 112.0, crewTotal: 11648.00 } },
      { id: 'l12', area: 'Area-2', csi: 'CSI 09 91 23', sf: '4,800 SF', crewName: 'Painters', memberCount: 3, hours: 100.0, totalCost: 10368.80,
        breakdown: { title: 'Area-2 Painters', members: [{ role: 'Lead Painter', wage: 68.00, hours: 44.0, total: 2992.00 }, { role: 'Painter', wage: 58.00, hours: 56.0, total: 3248.00 }], totalHours: 100.0, crewTotal: 10368.80 } },
    ],
  },
  {
    id: 'masonry', name: 'Masonry', csiCode: '23 00 00', trade: 'Masonry',
    crewCount: 2, totalHours: 174.0, pct: 10.4, subtotal: 17808.00,
    crews: [
      { id: 'l13', area: 'Area-1', csi: 'CSI 04 22 00', sf: '2,400 SF', crewName: 'Masonry Crew', memberCount: 4, hours: 96.0, totalCost: 9984.00,
        breakdown: { title: 'Area-1 Masonry Crew', members: [{ role: 'Mason', wage: 86.00, hours: 48.0, total: 4128.00 }, { role: 'Mason Tender', wage: 52.00, hours: 48.0, total: 2496.00 }], totalHours: 96.0, crewTotal: 9984.00 } },
      { id: 'l14', area: 'Area-2', csi: 'CSI 04 22 00', sf: '1,800 SF', crewName: 'Masonry Crew', memberCount: 3, hours: 78.0, totalCost: 7824.00,
        breakdown: { title: 'Area-2 Masonry Crew', members: [{ role: 'Mason', wage: 86.00, hours: 38.0, total: 3268.00 }, { role: 'Mason Tender', wage: 52.00, hours: 40.0, total: 2080.00 }], totalHours: 78.0, crewTotal: 7824.00 } },
    ],
  },
  {
    id: 'concrete_slab', name: 'Concrete Slab', csiCode: '09 90 00', trade: 'Concrete',
    crewCount: 2, totalHours: 158.5, pct: 10.4, subtotal: 15312.00,
    crews: [
      { id: 'l15', area: 'Area-A', csi: 'CSI 03 31 00', sf: '3,600 SF', crewName: 'Concrete Finishers', memberCount: 5, hours: 88.0, totalCost: 8448.00,
        breakdown: { title: 'Area-A Concrete Finishers', members: [{ role: 'Finisher', wage: 78.00, hours: 40.0, total: 3120.00 }, { role: 'Laborer', wage: 52.00, hours: 48.0, total: 2496.00 }], totalHours: 88.0, crewTotal: 8448.00 } },
      { id: 'l16', area: 'Area-B', csi: 'CSI 03 31 00', sf: '2,400 SF', crewName: 'Concrete Finishers', memberCount: 4, hours: 70.5, totalCost: 6864.00,
        breakdown: { title: 'Area-B Concrete Finishers', members: [{ role: 'Finisher', wage: 78.00, hours: 32.0, total: 2496.00 }, { role: 'Laborer', wage: 52.00, hours: 38.5, total: 2002.00 }], totalHours: 70.5, crewTotal: 6864.00 } },
    ],
  },
  {
    id: 'concrete_footings', name: 'Concrete Footings', csiCode: '26 00 00', trade: 'Concrete',
    crewCount: 3, totalHours: 111.8, pct: 9.1, subtotal: 13314.00,
    crews: [
      { id: 'l17', area: 'Zone-1', csi: 'CSI 03 31 00', sf: '1,200 SF', crewName: 'Forming Crew', memberCount: 4, hours: 48.0, totalCost: 5760.00,
        breakdown: { title: 'Zone-1 Forming Crew', members: [{ role: 'Carpenter', wage: 82.00, hours: 24.0, total: 1968.00 }, { role: 'Laborer', wage: 52.00, hours: 24.0, total: 1248.00 }], totalHours: 48.0, crewTotal: 5760.00 } },
      { id: 'l18', area: 'Zone-2', csi: 'CSI 03 31 00', sf: '800 SF', crewName: 'Concrete Crew', memberCount: 3, hours: 36.8, totalCost: 4230.00,
        breakdown: { title: 'Zone-2 Concrete Crew', members: [{ role: 'Finisher', wage: 78.00, hours: 18.0, total: 1404.00 }, { role: 'Laborer', wage: 52.00, hours: 18.8, total: 977.60 }], totalHours: 36.8, crewTotal: 4230.00 } },
      { id: 'l19', area: 'Zone-3', csi: 'CSI 03 21 00', sf: '600 SF', crewName: 'Rebar Crew', memberCount: 2, hours: 27.0, totalCost: 3324.00,
        breakdown: { title: 'Zone-3 Rebar Crew', members: [{ role: 'Iron Worker', wage: 86.00, hours: 14.0, total: 1204.00 }, { role: 'Helper', wage: 56.00, hours: 13.0, total: 728.00 }], totalHours: 27.0, crewTotal: 3324.00 } },
    ],
  },
  {
    id: 'steel_structure', name: 'Steel Structure', csiCode: '22 00 00', trade: 'Steel',
    crewCount: 8, totalHours: 1.9, pct: 4.3, subtotal: 6260.80,
    crews: [
      { id: 'l20', area: 'Bay-1', csi: 'CSI 05 12 00', sf: '800 SF', crewName: 'Steel Erectors', memberCount: 4, hours: 0.25, totalCost: 782.60, breakdown: { title: 'Bay-1 Steel Erectors', members: [{ role: 'Iron Worker', wage: 92.00, hours: 0.12, total: 391.30 }, { role: 'Rigger', wage: 78.00, hours: 0.08, total: 195.30 }], totalHours: 0.25, crewTotal: 782.60 } },
      { id: 'l21', area: 'Bay-2', csi: 'CSI 05 12 00', sf: '800 SF', crewName: 'Steel Erectors', memberCount: 4, hours: 0.24, totalCost: 752.40, breakdown: { title: 'Bay-2 Steel Erectors', members: [{ role: 'Iron Worker', wage: 92.00, hours: 0.12, total: 376.20 }, { role: 'Rigger', wage: 78.00, hours: 0.12, total: 376.20 }], totalHours: 0.24, crewTotal: 752.40 } },
      { id: 'l22', area: 'Bay-3', csi: 'CSI 05 12 00', sf: '760 SF', crewName: 'Steel Erectors', memberCount: 3, hours: 0.23, totalCost: 720.80, breakdown: { title: 'Bay-3 Steel Erectors', members: [{ role: 'Iron Worker', wage: 92.00, hours: 0.11, total: 360.40 }, { role: 'Rigger', wage: 78.00, hours: 0.12, total: 360.40 }], totalHours: 0.23, crewTotal: 720.80 } },
      { id: 'l23', area: 'Bay-4', csi: 'CSI 05 12 00', sf: '720 SF', crewName: 'Steel Erectors', memberCount: 3, hours: 0.24, totalCost: 752.00, breakdown: { title: 'Bay-4 Steel Erectors', members: [{ role: 'Iron Worker', wage: 92.00, hours: 0.12, total: 376.00 }, { role: 'Rigger', wage: 78.00, hours: 0.12, total: 376.00 }], totalHours: 0.24, crewTotal: 752.00 } },
      { id: 'l24', area: 'Bay-5', csi: 'CSI 05 12 00', sf: '680 SF', crewName: 'Column Setters', memberCount: 2, hours: 0.24, totalCost: 752.00, breakdown: { title: 'Bay-5 Column Setters', members: [{ role: 'Iron Worker', wage: 92.00, hours: 0.12, total: 376.00 }, { role: 'Helper', wage: 62.00, hours: 0.12, total: 376.00 }], totalHours: 0.24, crewTotal: 752.00 } },
      { id: 'l25', area: 'Bay-6', csi: 'CSI 05 12 00', sf: '640 SF', crewName: 'Column Setters', memberCount: 2, hours: 0.23, totalCost: 723.00, breakdown: { title: 'Bay-6 Column Setters', members: [{ role: 'Iron Worker', wage: 92.00, hours: 0.12, total: 361.50 }, { role: 'Helper', wage: 62.00, hours: 0.11, total: 361.50 }], totalHours: 0.23, crewTotal: 723.00 } },
      { id: 'l26', area: 'Bay-7', csi: 'CSI 05 05 00', sf: '600 SF', crewName: 'Anchor Bolt Crew', memberCount: 2, hours: 0.24, totalCost: 756.00, breakdown: { title: 'Bay-7 Anchor Bolt Crew', members: [{ role: 'Iron Worker', wage: 92.00, hours: 0.12, total: 378.00 }, { role: 'Helper', wage: 62.00, hours: 0.12, total: 378.00 }], totalHours: 0.24, crewTotal: 756.00 } },
      { id: 'l27', area: 'Bay-8', csi: 'CSI 05 05 00', sf: '560 SF', crewName: 'Anchor Bolt Crew', memberCount: 2, hours: 0.23, totalCost: 722.00, breakdown: { title: 'Bay-8 Anchor Bolt Crew', members: [{ role: 'Iron Worker', wage: 92.00, hours: 0.12, total: 361.00 }, { role: 'Helper', wage: 62.00, hours: 0.11, total: 361.00 }], totalHours: 0.23, crewTotal: 722.00 } },
    ],
  },
];
