import React, { useState, useEffect, useMemo } from 'react';
import { X } from 'lucide-react';
import {
  GetProductCategories,
  GetTakeoffCategories,
  GetProductUnitList,
  GetProductList,
} from '../../../../services/techus-services';
import FilterDropdown from '../../../../genriccomponents/FilterDropdown';
import { normalizeLabel } from '../../../../utils/textUtils';
import FullPageLoader from '../../../../genriccomponents/loaders/FullPageLoader';

const EXCLUDED_TRADES = ['general contractor', 'labor', 'labour'];

/* ── Per-division calculation type and unit options for other divisions ── */
const OTHER_DIV_CONFIG = {
  '00': { type: 'lump_sum',      units: ['ls'] },
  '01': { type: 'duration_rate', units: ['day', 'week', 'month'] },
  '02': { type: 'qty_unit_cost', units: ['sf', 'cy', 'ea'] },
  '10': { type: 'qty_unit_cost', units: ['ea'] },
  '11': { type: 'qty_unit_cost', units: ['ea'] },
  '12': { type: 'qty_unit_cost', units: ['ea'] },
  '13': { type: 'lump_sum',      units: ['ls'] },
  '14': { type: 'lump_sum',      units: ['ls'] },
  '21': { type: 'lump_sum',      units: ['ls'] },
  '31': { type: 'qty_unit_cost', units: ['cy', 'cf', 'ton', 'ea'] },
  '32': { type: 'qty_unit_cost', units: ['sf', 'lf', 'sy', 'ea'] },
  '33': { type: 'qty_unit_cost', units: ['lf', 'ea'] },
};

const getOtherDivConfig = name => {
  const match = (name || '').match(/(\d+)/);
  if (!match) return null;
  const code = match[1].padStart(2, '0');
  return OTHER_DIV_CONFIG[code] || null;
};

const inputBase =
  'tw-w-full tw-border tw-rounded-[5px] tw-px-3 tw-py-2.5 tw-text-[13px] tw-outline-none tw-transition-colors tw-bg-white tw-border-[#cacaca] focus:tw-border-[#0140c1] focus:tw-ring-1 focus:tw-ring-blue-200';
const inputDisabled =
  'tw-w-full tw-border tw-rounded-[5px] tw-px-3 tw-py-2.5 tw-text-[13px] tw-outline-none tw-bg-gray-50 tw-border-[#cacaca] tw-text-gray-400 tw-cursor-not-allowed';

const getDefaultForm = () => ({
  division_id: '', division_name: '',
  is_other_division: false,
  section_id: '', section_name: '',
  subsection_id: '', subsection_name: '',
  trade_id: '', trade_name: '',
  product_id: '', product_name: '',
  unit_id: '', unit_name: '',
  quantity: '',
  unit_price: '',
  wastage_percent: '',
});

export default function AddLineModal({ onAdd, onClose }) {
  const [allCategories, setAllCategories] = useState([]);
  const [allTrades, setAllTrades] = useState([]);
  const [, setAllUnits] = useState([]);
  const [otherDivisionUnits, setOtherDivisionUnits] = useState([]);
  const [productList, setProductList] = useState([]);

  const [isDropdownsLoading, setIsDropdownsLoading] = useState(true);
  const [isProductsLoading, setIsProductsLoading] = useState(false);

  const [form, setForm] = useState(getDefaultForm);
  const updateField = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  /* ── Load base dropdown data ── */
  useEffect(() => {
    const organizationId = localStorage.getItem('organization_id');
    const params = organizationId ? { organization_id: organizationId } : {};

    setIsDropdownsLoading(true);
    Promise.all([
      GetProductCategories({ ...params, is_main_divisions: 'all',show_only_product:1}),
      GetTakeoffCategories(params),
      GetProductUnitList(),
      GetProductUnitList({ have_other_division: 1 }),
    ])
      .then(([catRes, tradeRes, unitRes, otherUnitRes]) => {
        let cd = catRes?.data || catRes;
        if (typeof cd === 'string') cd = JSON.parse(cd);
        if (cd?.valid) setAllCategories(Array.isArray(cd.data) ? cd.data : []);

        let td = tradeRes?.data || tradeRes;
        if (typeof td === 'string') td = JSON.parse(td);
        if (td?.valid) {
          const filtered = (Array.isArray(td.data) ? td.data : []).filter(
            t => !EXCLUDED_TRADES.includes((normalizeLabel(t.takeoff_name) || '').toLowerCase())
          );
          setAllTrades(filtered);
        }

        let ud = unitRes?.data || unitRes;
        if (typeof ud === 'string') ud = JSON.parse(ud);
        if (ud?.valid) setAllUnits(Array.isArray(ud.data) ? ud.data : []);

        let oud = otherUnitRes?.data || otherUnitRes;
        if (typeof oud === 'string') oud = JSON.parse(oud);
        if (oud?.valid) setOtherDivisionUnits(Array.isArray(oud.data) ? oud.data : []);
      })
      .catch(() => { })
      .finally(() => setIsDropdownsLoading(false));
  }, []);

  /* ── Fetch products for main divisions only (subsection + trade required) ── */
  useEffect(() => {
    if (form.is_other_division) { setProductList([]); return; }
    if (!form.subsection_id || !form.trade_id) { setProductList([]); return; }

    const organizationId = localStorage.getItem('organization_id');
    const params = {
      subsection_id: form.subsection_id,
      ...(form.trade_id && { trade_id: form.trade_id }),
      ...(organizationId && { organization_id: organizationId }),
    };

    setIsProductsLoading(true);
    GetProductList(params)
      .then(res => {
        let d = res?.data || res;
        if (typeof d === 'string') d = JSON.parse(d);
        const list = Array.isArray(d?.data) ? d.data : Array.isArray(d) ? d : [];
        setProductList(list);
      })
      .catch(() => setProductList([]))
      .finally(() => setIsProductsLoading(false));
  }, [form.subsection_id, form.trade_id, form.is_other_division]);

  /* ── Hierarchy derivations ── */
  const divisions = useMemo(() => allCategories.filter(c => c.level === 1), [allCategories]);

  const divisionGroupedOptions = useMemo(() => {
    const main = divisions.filter(d => d.is_main_divisions !== 0).map(d => d.name).sort();
    const other = divisions.filter(d => d.is_main_divisions === 0).map(d => d.name).sort();
    const groups = [];
    if (main.length > 0) groups.push({ groupLabel: '', items: main });
    if (other.length > 0) groups.push({ groupLabel: 'OTHER DIVISIONS', items: other });
    return groups;
  }, [divisions]);

  const sections = useMemo(
    () => allCategories.filter(c => c.level === 2 && c.parent_id === form.division_id),
    [allCategories, form.division_id]
  );
  const subsections = useMemo(
    () => allCategories.filter(c => c.level === 3 && c.parent_id === form.section_id),
    [allCategories, form.section_id]
  );

  const selectedSubsection = useMemo(
    () => allCategories.find(c => c.category_id === form.subsection_id),
    [allCategories, form.subsection_id]
  );

  const eligibleTradeIds = useMemo(() =>
    selectedSubsection?.eligible_trades ? new Set(selectedSubsection.eligible_trades) : null,
    [selectedSubsection]
  );

  const tradeOptions = useMemo(() => {
    const base = eligibleTradeIds ? allTrades.filter(t => eligibleTradeIds.has(t.takeoff_id)) : allTrades;
    return base.map(t => normalizeLabel(t.takeoff_name));
  }, [allTrades, eligibleTradeIds]);

  const filteredProducts = useMemo(() => {
    if (!form.subsection_id) return [];
    return productList
      .filter(p => p.subsection_id === form.subsection_id)
      .sort((a, b) =>
        (a.product_code || '').localeCompare(b.product_code || '', undefined, { numeric: true, sensitivity: 'base' })
      );
  }, [productList, form.subsection_id]);

  const formatProductLabel = p =>
    p.product_code ? `${p.product_code} ${p.product_name}` : p.product_name || '';

  const productOptions = useMemo(
    () => filteredProducts.map(formatProductLabel).filter(Boolean),
    [filteredProducts]
  );

  const selectedProductLabel = useMemo(() => {
    if (!form.product_id) return '';
    const p = filteredProducts.find(x => x.product_id === form.product_id);
    return p ? formatProductLabel(p) : '';
  }, [form.product_id, filteredProducts]);

  /* ── Other division config ── */
  const otherDivConfig = useMemo(
    () => form.is_other_division ? getOtherDivConfig(form.division_name) : null,
    [form.is_other_division, form.division_name]
  );
  const otherDivUnits = otherDivConfig?.units || [];

  // Quantity must be integer for: lump_sum (always) or qty_unit_cost when unit is ea
  const qtyIsInteger = otherDivConfig
    ? (otherDivConfig.type === 'lump_sum' ||
       (otherDivConfig.type === 'qty_unit_cost' && form.unit_name === 'ea'))
    : false;

  /* ── Auto-select unit when division has exactly one option ── */
  useEffect(() => {
    if (!form.is_other_division || !otherDivConfig) return;
    if (otherDivConfig.units.length === 1 && !form.unit_name) {
      setForm(prev => ({ ...prev, unit_name: otherDivConfig.units[0], unit_id: '' }));
    }
  }, [form.is_other_division, form.unit_name, otherDivConfig]);

  /* ── Cascade handlers ── */
  const handleDivisionChange = val => {
    const found = divisions.find(d => d.name === val);
    const isOther = found?.is_main_divisions === 0;
    const config = isOther ? getOtherDivConfig(val) : null;
    const autoUnit = config?.units.length === 1 ? config.units[0] : '';
    setForm({
      ...getDefaultForm(),
      division_id: found?.category_id || '',
      division_name: val,
      is_other_division: isOther,
      unit_name: autoUnit,
    });
    setProductList([]);
  };

  const handleSectionChange = val => {
    const found = sections.find(s => s.name === val);
    setForm(prev => ({
      ...prev,
      section_id: found?.category_id || '', section_name: val,
      subsection_id: '', subsection_name: '',
      trade_id: '', trade_name: '',
      product_id: '', product_name: '',
      unit_id: '', unit_name: '', unit_price: '', wastage_percent: '',
    }));
    setProductList([]);
  };

  const handleSubsectionChange = val => {
    const found = subsections.find(s => s.name === val);
    setForm(prev => ({
      ...prev,
      subsection_id: found?.category_id || '', subsection_name: val,
      trade_id: '', trade_name: '',
      product_id: '', product_name: '',
      unit_id: '', unit_name: '', unit_price: '', wastage_percent: '',
    }));
    setProductList([]);
  };

  const handleTradeChange = val => {
    const found = allTrades.find(t => normalizeLabel(t.takeoff_name) === val);
    setForm(prev => ({
      ...prev,
      trade_id: found?.takeoff_id || '', trade_name: val,
      product_id: '', product_name: '',
      unit_id: '', unit_name: '', unit_price: '', wastage_percent: '',
    }));
  };

  const handleProductChange = val => {
    const found = filteredProducts.find(p => formatProductLabel(p) === val);
    if (found) {
      setForm(prev => ({
        ...prev,
        product_id: found.product_id || '',
        product_name: found.product_name || '',
        unit_id: found.unit_id || '',
        unit_name: found.unit_name || '',
        unit_price: found.unit_price ?? '',
        wastage_percent: found.wastage_percent ?? '',
      }));
    } else {
      setForm(prev => ({
        ...prev,
        product_id: '', product_name: val,
        unit_id: '', unit_name: '', unit_price: '', wastage_percent: '',
      }));
    }
  };

  const handleUnitChange = val => {
    const found = otherDivisionUnits.find(u => u.unit_name === val);
    const nextIsInt = otherDivConfig?.type === 'lump_sum' ||
      (otherDivConfig?.type === 'qty_unit_cost' && val === 'ea');
    setForm(prev => ({
      ...prev,
      unit_id: found?.unit_id || '',
      unit_name: val,
      // Snap to integer when switching to an integer-only unit
      quantity: prev.quantity && nextIsInt
        ? String(Math.max(0, Math.floor(Number(prev.quantity))))
        : prev.quantity,
    }));
  };

  /* ── Computed values ── */
  const DISCRETE_UNITS = new Set(['ea', 'roll', 'rolls', 'sheet', 'sheets', 'bag', 'bags']);
  const round2 = v => Math.round((Number(v) || 0) * 100) / 100;
  const round4 = v => Math.round((Number(v) || 0) * 10000) / 10000;

  const productSelected = Boolean(form.product_id);
  const qty = Number(form.quantity) || 0;
  const cost = Number(form.unit_price) || 0;
  const waste = Number(form.wastage_percent) || 0;
  const u = (form.unit_name || '').toLowerCase().trim();
  const rawWW = qty * (1 + waste / 100);
  const qtyWithWastage = qty > 0 ? (DISCRETE_UNITS.has(u) ? Math.ceil(rawWW) : round4(rawWW)) : 0;
  const lineTotal = round2(qtyWithWastage * cost).toFixed(2);

  const canAdd = form.subsection_id && form.quantity && Number(form.quantity) > 0
    && (form.is_other_division
      ? Boolean(form.unit_name)
      : Boolean(form.trade_id) && Boolean(form.product_id));

  /* ── Field labels ── */
  const LabelReq = ({ text }) => (
    <label className="tw-block tw-text-[13px] tw-font-semibold tw-text-[#334155] tw-mb-1.5">
      {text} <span className='tw-text-red-500'>*</span>
    </label>
  );
  const Label = ({ text }) => (
    <label className="tw-block tw-text-[12px] tw-font-semibold tw-text-[#334155] tw-mb-1.5">{text}</label>
  );

  return (
    <div className="tw-fixed tw-inset-0 tw-bg-black/40 tw-flex tw-items-center tw-justify-center tw-z-50 tw-px-4">
      {isDropdownsLoading && <FullPageLoader />}

      <div className="tw-bg-white tw-rounded-[5px] tw-shadow-2xl tw-w-full tw-max-w-[620px] tw-max-h-[90vh] tw-flex tw-flex-col">

        {/* Header */}
        <div className="tw-flex tw-items-center tw-justify-between tw-px-6 tw-py-4 tw-border-b tw-border-slate-100 tw-flex-shrink-0">
          <h3 className="tw-text-[16px] tw-font-bold tw-text-[#0F172A]">Add Line Item</h3>
          <button
            onClick={onClose}
            className="tw-w-7 tw-h-7 tw-flex tw-items-center tw-justify-center tw-rounded-[5px] tw-border tw-border-slate-200 hover:tw-bg-slate-50 tw-transition-colors"
          >
            <X size={13} className="tw-text-slate-500" />
          </button>
        </div>

        {/* Body */}
        <div className="tw-px-6 tw-py-5 tw-flex tw-flex-col tw-gap-4 tw-overflow-y-auto custom-visible-scroll">

          {/* Division / Section */}
          <div className="tw-grid tw-grid-cols-2 tw-gap-4">
            <div>
              <LabelReq text="Division" />
              <FilterDropdown
                groupedOptions={divisionGroupedOptions}
                value={form.division_name}
                placeholder="Select Division"
                width="tw-w-full tw-h-[38px]"
                onChange={handleDivisionChange}
              />
            </div>
            <div>
              <LabelReq text="Section" />
              <FilterDropdown
                options={sections.map(s => s.name).sort()}
                value={form.section_name}
                placeholder="Select Section"
                width="tw-w-full tw-h-[38px]"
                onChange={handleSectionChange}
                disabled={!form.division_id}
              />
            </div>
          </div>

          {/* Subsection / Trade (Trade hidden for other divisions) */}
          <div className={`tw-grid tw-gap-4 ${form.is_other_division ? 'tw-grid-cols-1' : 'tw-grid-cols-2'}`}>
            <div>
              <LabelReq text="Subsection" />
              <FilterDropdown
                options={subsections.map(s => s.name).sort()}
                value={form.subsection_name}
                placeholder="Select Subsection"
                width="tw-w-full tw-h-[38px]"
                onChange={handleSubsectionChange}
                disabled={!form.section_id}
              />
            </div>
            {!form.is_other_division && (
              <div>
                <LabelReq text="Trade" />
                <FilterDropdown
                  options={tradeOptions}
                  value={form.trade_name}
                  placeholder="Select Trade"
                  width="tw-w-full tw-h-[38px]"
                  onChange={handleTradeChange}
                  disabled={!form.subsection_id}
                />
              </div>
            )}
          </div>

          {/* Product (hidden for other divisions) */}
          {!form.is_other_division && (
            <div>
              <LabelReq text="Product" />
              <FilterDropdown
                options={productOptions}
                value={selectedProductLabel}
                placeholder={isProductsLoading ? 'Loading products…' : 'Select Product'}
                width="tw-w-full tw-h-[38px]"
                onChange={handleProductChange}
                disabled={!form.trade_id || isProductsLoading}
                searchable
                noResultsText="No products found"
              />
            </div>
          )}

          {/* ── OTHER DIVISION: Quantity | Unit | Unit Cost (no wastage) ── */}
          {form.is_other_division ? (
            <>
              <div className="tw-grid tw-grid-cols-3 tw-gap-3">
                <div>
                  <LabelReq text="Quantity" />
                  <input
                    type="number"
                    min="0"
                    step={qtyIsInteger ? '1' : 'any'}
                    value={form.quantity}
                    onChange={e => {
                      let val = e.target.value;
                      if (qtyIsInteger && val.includes('.'))
                        val = String(Math.floor(Number(val)));
                      updateField('quantity', val);
                    }}
                    onKeyDown={e => {
                      if (e.key === '-') e.preventDefault();
                      if (qtyIsInteger && (e.key === '.' || e.key === ',')) e.preventDefault();
                    }}
                    placeholder="0"
                    className={inputBase}
                  />
                </div>
                <div>
                  <LabelReq text="Unit" />
                  <FilterDropdown
                    options={otherDivUnits}
                    value={form.unit_name}
                    placeholder="Select Unit"
                    width="tw-w-full tw-h-[38px]"
                    onChange={handleUnitChange}
                  />
                </div>
                <div>
                  <LabelReq text="Unit Cost" />
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={form.unit_price}
                    onChange={e => updateField('unit_price', e.target.value)}
                    onKeyDown={e => e.key === '-' && e.preventDefault()}
                    placeholder="0.00"
                    className={inputBase}
                  />
                </div>
              </div>

              {/* Blue calc: qty × unit_cost = total */}
              {qty > 0 && form.unit_name && (
                <div className="tw-bg-[#EFF6FF] tw-rounded-[5px] tw-px-4 tw-py-3 tw-text-[13px] tw-text-[#334155]">
                  {qty} {form.unit_name} &times; ${cost.toFixed(2)} = ${lineTotal}
                </div>
              )}
            </>
          ) : (
            /* ── MAIN DIVISION: existing Qty / Unit / Unit Cost / Waste (unchanged) ── */
            <>
              <div className="tw-grid tw-grid-cols-4 tw-gap-3">
                <div>
                  <LabelReq text="Quantity" />
                  <input
                    type="number"
                    min="1"
                    value={form.quantity}
                    onChange={e => updateField('quantity', e.target.value)}
                    onKeyDown={e => e.key === '-' && e.preventDefault()}
                    placeholder="0"
                    readOnly={!productSelected}
                    className={productSelected ? inputBase : inputDisabled}
                  />
                </div>
                <div>
                  <Label text="Unit" />
                  <input
                    value={form.unit_name || '—'}
                    readOnly
                    className={inputDisabled}
                  />
                </div>
                <div>
                  <Label text="Unit Cost" />
                  <input
                    type="number"
                    value={form.unit_price}
                    placeholder="0.00"
                    readOnly
                    className={inputDisabled}
                  />
                </div>
                <div>
                  <Label text="Waste %" />
                  <input
                    type="number"
                    value={form.wastage_percent}
                    placeholder="0"
                    readOnly
                    className={inputDisabled}
                  />
                </div>
              </div>

              {productSelected && qty > 0 && cost > 0 && (
                <div className="tw-bg-[#EFF6FF] tw-rounded-[5px] tw-px-4 tw-py-3 tw-text-[13px] tw-text-[#334155]">
                  {qty} {form.unit_name}{waste > 0 ? `. With ${waste}% wastage` : ''} &times; ${cost.toFixed(2)} = ${lineTotal}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="tw-flex tw-items-center tw-justify-between tw-px-6 tw-py-4 tw-border-t tw-border-slate-100 tw-flex-shrink-0">
          <span className="tw-text-[13px] tw-font-semibold tw-text-[#0F172A]">
            LINE TOTAL&nbsp;
            <span className="tw-text-[17px] tw-font-bold">${lineTotal}</span>
          </span>
          <div className="tw-flex tw-gap-3">
            <button
              onClick={onClose}
              className="tw-px-6 tw-py-2.5 tw-border tw-border-slate-200 tw-rounded-[5px] tw-text-[13px] tw-text-[#334155] hover:tw-bg-slate-50 tw-transition-colors tw-bg-[#F1F5F9]"
            >
              Cancel
            </button>
            <button
              disabled={!canAdd}
              onClick={() => canAdd && onAdd && onAdd(form)}
              className={`tw-px-8 tw-py-2.5 tw-rounded-[5px] tw-text-[13px] tw-font-semibold tw-transition-colors tw-text-white
                ${canAdd ? 'tw-bg-[#0140c1] hover:tw-bg-blue-800' : 'tw-bg-gray-300 tw-cursor-not-allowed'}`}
            >
              Add
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
