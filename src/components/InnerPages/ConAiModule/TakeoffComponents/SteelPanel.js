import React, { useEffect } from "react";
import { Info } from "lucide-react";
import { CustomSelect, InputField, FieldLabel, SkeletonField, normalizeUnitLabel } from "./TakeoffSharedUI";

export const STEEL_AREA_TYPES   = ['slab', 'roof_deck', 'pile_cap', 'stair'];
export const STEEL_WALL_TYPES   = ['beam', 'wall', 'footing', 'grade_beam'];
export const STEEL_SYMBOL_TYPES = ['column'];

export const STEEL_ALL_TYPE_OPTS = [
  { key: 'slab',       label: 'Slab' },
  { key: 'roof_deck',  label: 'Roof Deck' },
  { key: 'pile_cap',   label: 'Pile Cap' },
  { key: 'stair',      label: 'Stair' },
  { key: 'beam',       label: 'Beam' },
  { key: 'wall',       label: 'Wall' },
  { key: 'footing',    label: 'Footing' },
  { key: 'grade_beam', label: 'Grade Beam' },
  { key: 'column',     label: 'Column' },
];

export const STEEL_GEO_FIELDS = {
  slab:       [{ key: 'slab_area',         label: 'Slab Area',           unit: 'sf' }, { key: 'slab_length',  label: 'Slab Length',  unit: 'ft' }, { key: 'slab_width',  label: 'Slab Width',  unit: 'ft' }],
  roof_deck:  [{ key: 'roof_deck_area',    label: 'Roof Deck Area',      unit: 'sf' }],
  pile_cap:   [{ key: 'pile_cap_area',     label: 'Pile Cap Area',       unit: 'sf' }, { key: 'pile_cap_length', label: 'Pile Cap Length', unit: 'ft' }, { key: 'pile_cap_width', label: 'Pile Cap Width', unit: 'ft' }],
  stair:      [{ key: 'stair_area',        label: 'Stair Area',          unit: 'sf' }],
  beam:       [{ key: 'beam_length',       label: 'Beam Length',         unit: 'lf' }, { key: 'beam_width',   label: 'Beam Width',   unit: 'in' }, { key: 'beam_depth',   label: 'Beam Depth',   unit: 'in' }],
  wall:       [{ key: 'wall_length',       label: 'Wall Length',         unit: 'lf' }, { key: 'wall_height',  label: 'Wall Height',  unit: 'ft' }],
  footing:    [{ key: 'footing_length',    label: 'Footing Length',      unit: 'lf' }, { key: 'footing_width', label: 'Footing Width', unit: 'in' }, { key: 'footing_depth', label: 'Footing Depth', unit: 'in' }],
  grade_beam: [{ key: 'grade_beam_length', label: 'Grade Beam Length',   unit: 'lf' }, { key: 'grade_beam_width', label: 'Grade Beam Width', unit: 'ft' }],
  column:     [{ key: 'number_of_columns', label: 'Number of Columns',   unit: 'ea', inputType: 'integer' }, { key: 'column_width', label: 'Column Width', unit: 'in' }, { key: 'column_depth', label: 'Column Depth', unit: 'in' }, { key: 'column_height', label: 'Column Height', unit: 'ft' }],
};

export const STEEL_CATS_BY_ELEMENT = {
  slab:       ['mesh', 'deck', 'rebar', 'misc_steel'],
  roof_deck:  ['deck', 'purlin_joist', 'structural_steel', 'misc_steel'],
  pile_cap:   ['mesh', 'rebar', 'misc_steel'],
  stair:      ['metal_stair', 'railing', 'misc_steel'],
  beam:       ['structural_steel', 'rebar', 'misc_steel'],
  wall:       ['rebar', 'mesh', 'misc_steel'],
  footing:    ['rebar', 'mesh', 'misc_steel'],
  grade_beam: ['rebar', 'mesh', 'misc_steel'],
  column:     ['structural_steel', 'rebar', 'misc_steel'],
};

export const STEEL_CAT_LABELS = {
  mesh: 'Mesh', deck: 'Deck', rebar: 'Rebar',
  misc_steel: 'Misc Steel', metal_stair: 'Metal Stair',
  railing: 'Railing', purlin_joist: 'Purlin / Joist',
  structural_steel: 'Structural Steel',
};

export const STEEL_SIMPLE_REBAR_ELEMENTS = new Set(['slab', 'pile_cap']);

export const REBAR_TYPES_BY_ELEMENT = {
  beam:       ['main', 'stirrup'],
  wall:       ['vertical', 'horizontal', 'joint_reinforcement'],
  footing:    ['longitudinal', 'transverse'],
  grade_beam: ['longitudinal', 'transverse'],
  column:     ['vertical', 'tie'],
};

export const REBAR_TYPE_LABELS = {
  main: 'Main (Longitudinal)', main_longitudinal: 'Main (Longitudinal)', stirrup: 'Stirrup',
  vertical: 'Vertical', horizontal: 'Horizontal',
  joint_reinforcement: 'Joint Reinforcement',
  longitudinal: 'Longitudinal', transverse: 'Transverse', tie: 'Tie',
};

export const REBAR_ENTRY_FIELDS = {
  main_longitudinal: [{ key: 'bar_count',  label: 'Bar Count',  inputType: 'integer' }, { key: 'lap_length', label: 'Lap Length', unit: 'in' }],
  main:              [{ key: 'bar_count',  label: 'Bar Count',  inputType: 'integer' }, { key: 'lap_length', label: 'Lap Length', unit: 'in' }],
  stirrup:           [{ key: 'spacing',    label: 'Spacing',    unit: 'in' }],
  vertical:          [{ key: 'spacing',    label: 'Spacing',    unit: 'in' }],
  horizontal:        [{ key: 'spacing',    label: 'Spacing',    unit: 'in' }],
  joint_reinforcement:[{ key: 'spacing',   label: 'Spacing',    unit: 'in' }],
  longitudinal:      [{ key: 'bar_count',  label: 'Bar Count',  inputType: 'integer' }, { key: 'lap_length', label: 'Lap Length', unit: 'in' }],
  transverse:        [{ key: 'spacing',    label: 'Spacing',    unit: 'in' }, { key: 'bar_length', label: 'Bar Length', unit: 'ft' }],
  tie:               [{ key: 'spacing',    label: 'Spacing',    unit: 'in' }],
};

export const REBAR_ENTRY_FIELDS_OVERRIDE = {
  column: {
    vertical: [{ key: 'bars_per_column', label: 'Bars per Column', inputType: 'integer' }, { key: 'lap_length', label: 'Lap Length', unit: 'in' }],
  },
};

export const STEEL_GEO_CARRYOVER = {
  slab:       { area: 'slab_area',        length: 'slab_length',       width: 'slab_width' },
  roof_deck:  { area: 'roof_deck_area' },
  pile_cap:   { area: 'pile_cap_area',    length: 'pile_cap_length',   width: 'pile_cap_width' },
  stair:      { area: 'stair_area' },
  beam:       { length: 'beam_length',    width: 'beam_width',         depth: 'beam_depth' },
  wall:       { length: 'wall_length',    height: 'wall_height' },
  footing:    { length: 'footing_length', width: 'footing_width',      depth: 'footing_depth' },
  grade_beam: { length: 'grade_beam_length', width: 'grade_beam_width' },
  column:     { count: 'number_of_columns', width: 'column_width',    depth: 'column_depth',  height: 'column_height' },
};

const SteelPanel = ({
  selectedTypeKey, types, steelCats, setSteelCats, steelCatData, setSteelCatData,
  steelRebarEntries, setSteelRebarEntries, steelConfigData, steelConfigDataRef,
  attributes, handleAttrChange, productList, isReadOnly, isLoadingConfig,
  openSelect, setOpenSelect, accentColor, generalScrollRef, hasAssemblyItems,
}) => {

  if (isLoadingConfig) return (<div className="tw-space-y-4"><SkeletonField /><div className="tw-grid tw-grid-cols-2 tw-gap-4"><SkeletonField /><SkeletonField /></div><SkeletonField /><SkeletonField /></div>);

  const elemType = selectedTypeKey || '';
  const geoFields = STEEL_GEO_FIELDS[elemType] || [];
  const availableCats = STEEL_CATS_BY_ELEMENT[elemType] || [];
  const isSimpleRebar = STEEL_SIMPLE_REBAR_ELEMENTS.has(elemType);
  const complexRebarTypes = !isSimpleRebar ? (REBAR_TYPES_BY_ELEMENT[elemType] || null) : null;

  const catGrpValues = steelConfigData?.option_groups?.find((g) => g.group_key === 'steel_category')?.values || [];
  const selectedTypeId = types.find((t) => t.type_key === elemType)?.id;

  const getCatProducts = (catKey) => {
    const catCfgId = catGrpValues.find((v) => v.option_key === catKey)?.id;
    const toOpt = (p) => ({ key: String(p.pk_id ?? p.product_id ?? ''), label: [p.product_code, p.product_name].filter(Boolean).join(' ') });
    const baseFilter = (p) => {
      if (p.product_type !== 'Primary') return false;
      if (p.trade?.toLowerCase() !== 'steel') return false;
      // Products with no element_type_ids are generic — show for all element types
      if (selectedTypeId && p.element_type_ids?.length > 0 && !p.element_type_ids.includes(selectedTypeId)) return false;
      return true;
    };
    // Tier 1: category-specific products
    const catSpecific = productList.filter((p) => {
      if (!baseFilter(p)) return false;
      if (catCfgId && p.steel_category_id && p.steel_category_id !== catCfgId) return false;
      return true;
    });
    if (catSpecific.length > 0) return catSpecific.map(toOpt);
    // Tier 2: fall back to all steel products for this element type (when no category-specific products exist)
    return productList.filter(baseFilter).map(toOpt);
  };

  const getRebarProducts = () => getCatProducts('rebar');

  const mkGeoInput = (f) => (
    <InputField key={f.key} label={f.label} field={f.key} unit={normalizeUnitLabel(f.unit)}
      inputType={f.inputType} editedItem={attributes} onChange={handleAttrChange} disabled={isReadOnly} placeholder="0" />
  );

  const ProductNote = () => (
    <div className="tw-flex tw-items-start tw-gap-2.5 tw-bg-amber-50 tw-border tw-border-amber-200 tw-rounded-lg tw-px-3 tw-py-2.5">
      <Info size={14} className="tw-text-amber-500 tw-flex-shrink-0 tw-mt-0.5" />
      <p className="tw-m-0 tw-text-[12.5px] tw-leading-[1.55] tw-text-amber-800">
        <span className="tw-font-semibold">Note:&nbsp;</span>
Changing the product will remove the accessory items already selected for this line item.      </p>
    </div>
  );

  const SteelProductSelect = ({ id, opts, productId, onChange }) => {
    const matched = opts.find(o => o.key === productId);
    const effectiveValue = matched ? productId : (opts[0]?.key || '');
    useEffect(() => {
      if (!matched && opts.length > 0 && effectiveValue) onChange(effectiveValue);
    }, [effectiveValue, opts.length]);
    return (
      <div className="tw-space-y-1.5">
        <FieldLabel>Product</FieldLabel>
        <CustomSelect id={id} options={opts}
          value={effectiveValue}
          onChange={(v) => onChange(v)}
          openSelect={openSelect} setOpenSelect={setOpenSelect}
          accentColor={accentColor} disabled={isReadOnly} />
      </div>
    );
  };

  const updateCat = (catKey, field, val) =>
    setSteelCatData((prev) => ({ ...prev, [catKey]: { ...(prev[catKey] || {}), [field]: val } }));

  const updateRebar = (rtKey, field, val) =>
    setSteelRebarEntries((prev) => ({ ...prev, [rtKey]: { ...(prev[rtKey] || {}), [field]: val } }));

  const handleCatCheck = (catKey, checked) => {
    setSteelCats((prev) => ({ ...prev, [catKey]: checked }));
    if (checked) {
      const cfg = steelConfigDataRef.current;
      if (cfg) {
        const catGrpValsNow = cfg.option_groups?.find((g) => g.group_key === 'steel_category')?.values || [];
        const catCfgId = catGrpValsNow.find((v) => v.option_key === catKey)?.id;
        const newData = {};
        (cfg.input_fields || []).forEach((f) => {
          if (f.condition_key === 'steel_category' && f.condition_value === catKey)
            newData[f.request_key || f.field_key] = String(f.default_value ?? '');
        });
        if (catKey === 'structural_steel' && !newData.section_type) {
          const stGrp = cfg.option_groups?.find((g) => g.group_key === 'section_type');
          const defaultST = stGrp?.values?.find((v) => v.is_default)?.option_key
            || stGrp?.values?.[0]?.option_key
            || 'w_beam';
          newData.section_type = defaultST;
        }
        if (catKey === 'rebar') {
          const dirGrp = cfg.option_groups?.find((g) => g.group_key === 'direction');
          const defaultDir = dirGrp?.values?.find((v) => v.is_default)?.option_key || '';
          if (defaultDir) newData.direction = defaultDir;
          if (complexRebarTypes) {
            const rebarDefaults = {};
            complexRebarTypes.forEach((rt) => {
              const rtData = {};
              (cfg.input_fields || []).forEach((f) => {
                if (f.condition_key === 'rebar_type' && f.condition_value === rt)
                  rtData[f.request_key || f.field_key] = String(f.default_value ?? '');
              });
              const rebarProds = getRebarProducts();
              const pd = cfg.product_defaults?.find((d) => d.steel_category_id === catCfgId && d.condition_key === 'rebar_type' && d.condition_value === rt);
              if (pd?.product_id) {
                const pidStr = String(pd.product_id);
                if (rebarProds.some((p) => p.key === pidStr)) rtData.productId = pidStr;
              }
              if (!rtData.productId) {
                const pdGlobal = cfg.product_defaults?.find((d) => !d.steel_category_id && !d.condition_key);
                if (pdGlobal?.product_id) {
                  const pidStr = String(pdGlobal.product_id);
                  if (rebarProds.some((p) => p.key === pidStr)) rtData.productId = pidStr;
                }
              }
              if (!rtData.productId) {
                const firstProd = rebarProds[0];
                if (firstProd) rtData.productId = firstProd.key;
              }
              if (Object.keys(rtData).length > 0) rebarDefaults[rt] = rtData;
            });
            if (Object.keys(rebarDefaults).length > 0)
              setSteelRebarEntries((prev) => {
                const next = { ...prev };
                Object.entries(rebarDefaults).forEach(([rt, defaults]) => { next[rt] = { ...(next[rt] || {}), ...defaults }; });
                return next;
              });
          }
        }
        {
          // Validate resolved product against actual available products for this category
          let catProds = getCatProducts(catKey);
          // For structural_steel, filter products by section_type name and use section_type-conditioned product_default
          if (catKey === 'structural_steel') {
            const stGrp = cfg.option_groups?.find((g) => g.group_key === 'section_type');
            const stKey = newData.section_type || steelCatData[catKey]?.section_type;
            const stObj = stGrp?.values?.find((v) => v.option_key === stKey);
            const stName = stObj?.option_name || '';
            if (stName) {
              const filtered = catProds.filter((o) => {
                const prod = productList.find((p) => String(p.pk_id ?? p.product_id ?? '') === o.key);
                return prod?.product_name?.toLowerCase().startsWith(stName.toLowerCase());
              });
              if (filtered.length > 0) catProds = filtered;
            }
            // Use section_type-conditioned product_default (takes priority)
            const stPd = cfg.product_defaults?.find((d) =>
              d.steel_category_id === catCfgId &&
              d.condition_key === 'section_type' &&
              d.condition_value === stKey
            );
            if (stPd?.product_id) {
              const pidStr = String(stPd.product_id);
              if (catProds.some((p) => p.key === pidStr)) newData.productId = pidStr;
            }
          }
          if (!newData.productId && catCfgId) {
            const pd = cfg.product_defaults?.find((d) => d.steel_category_id === catCfgId && !d.condition_key);
            if (pd?.product_id) {
              const pidStr = String(pd.product_id);
              if (catProds.some((p) => p.key === pidStr)) newData.productId = pidStr;
            }
          }
          if (!newData.productId) {
            const pdGlobal = cfg.product_defaults?.find((d) => !d.steel_category_id && !d.condition_key);
            if (pdGlobal?.product_id) {
              const pidStr = String(pdGlobal.product_id);
              if (catProds.some((p) => p.key === pidStr)) newData.productId = pidStr;
            }
          }
          if (!newData.productId && !(steelCatData[catKey]?.productId)) {
            const firstProd = catProds[0];
            if (firstProd) newData.productId = firstProd.key;
          }
        }
        if (Object.keys(newData).length > 0)
          setSteelCatData((prev) => ({ ...prev, [catKey]: { ...(prev[catKey] || {}), ...newData } }));
      } else {
        // Config not yet loaded — retro-apply will handle structural_steel (needs section_type from config)
        if (catKey !== 'structural_steel' && !steelCatData[catKey]?.productId) {
          const firstProd = getCatProducts(catKey)[0];
          if (firstProd) setSteelCatData((prev) => ({ ...prev, [catKey]: { ...(prev[catKey] || {}), productId: firstProd.key } }));
        }
      }
      setTimeout(() => generalScrollRef.current?.scrollTo({ top: generalScrollRef.current.scrollHeight, behavior: 'smooth' }), 60);
    }
  };

  const renderCatSection = (catKey) => {
    const catData = steelCatData[catKey] || {};
    const catId = `steel_cat_${catKey}`;
    const catProdOpts = getCatProducts(catKey);

    if (catKey === 'rebar' && complexRebarTypes) {
      return (
        <div key={catId} className="tw-space-y-2">
          <p className="tw-text-xs tw-font-semibold tw-text-gray-500 tw-uppercase tw-tracking-wide tw-mb-1">Rebar Type</p>
          {complexRebarTypes.map((rtKey) => {
            const entry = steelRebarEntries[rtKey] || {};
            const entryFields = REBAR_ENTRY_FIELDS_OVERRIDE[elemType]?.[rtKey] || REBAR_ENTRY_FIELDS[rtKey] || [];
            const rtProdOpts = getRebarProducts();
            return (
              <div key={rtKey}>
                <label className="tw-flex tw-items-center tw-gap-2 tw-cursor-pointer tw-select-none">
                  <input type="checkbox" checked={!!entry.checked}
                    onChange={(e) => {
                      const nowChecked = e.target.checked;
                      setSteelRebarEntries((prev) => {
                        const existing = prev[rtKey] || {};
                        const updated = { ...existing, checked: nowChecked };
                        if (nowChecked && !existing.productId) {
                          const firstProd = getRebarProducts()[0];
                          if (firstProd) updated.productId = firstProd.key;
                        }
                        return { ...prev, [rtKey]: updated };
                      });
                      if (nowChecked) setTimeout(() => generalScrollRef.current?.scrollTo({ top: generalScrollRef.current.scrollHeight, behavior: 'smooth' }), 60);
                    }}
                    className="tw-w-4 tw-h-4 tw-accent-[#0140c1]" disabled={isReadOnly} />
                  <span className="tw-text-sm tw-text-gray-700">{REBAR_TYPE_LABELS[rtKey] || rtKey}</span>
                </label>
                {entry.checked && (
                  <div className="tw-pl-6 tw-mt-2 tw-space-y-3">
                    {entryFields.length === 1 ? (
                      <div className="tw-grid tw-gap-3" style={{ gridTemplateColumns: '1fr 2fr' }}>
                        <InputField label={entryFields[0].label} field={`re_${rtKey}_${entryFields[0].key}`}
                          unit={normalizeUnitLabel(entryFields[0].unit)} inputType={entryFields[0].inputType}
                          editedItem={{ [`re_${rtKey}_${entryFields[0].key}`]: entry[entryFields[0].key] || '' }}
                          onChange={(_, val) => updateRebar(rtKey, entryFields[0].key, val)} disabled={isReadOnly} placeholder="0" />
                        <SteelProductSelect id={`rebar_${rtKey}_prod`} opts={rtProdOpts}
                          productId={entry.productId || ''} onChange={(v) => updateRebar(rtKey, 'productId', v)} />
                      </div>
                    ) : (
                      <>
                        <div className="tw-grid tw-gap-3" style={{ gridTemplateColumns: `repeat(${entryFields.length}, 1fr)` }}>
                          {entryFields.map((f) => (
                            <InputField key={f.key} label={f.label} field={`re_${rtKey}_${f.key}`}
                              unit={normalizeUnitLabel(f.unit)} inputType={f.inputType}
                              editedItem={{ [`re_${rtKey}_${f.key}`]: entry[f.key] || '' }}
                              onChange={(_, val) => updateRebar(rtKey, f.key, val)} disabled={isReadOnly} placeholder="0" />
                          ))}
                        </div>
                        <SteelProductSelect id={`rebar_${rtKey}_prod`} opts={rtProdOpts}
                          productId={entry.productId || ''} onChange={(v) => updateRebar(rtKey, 'productId', v)} />
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      );
    }

    if (catKey === 'rebar' && isSimpleRebar) {
      const dirOpts = (() => {
        const dirGrp = steelConfigData?.option_groups?.find((g) => g.group_key === 'direction');
        return dirGrp
          ? dirGrp.values.map((v) => ({ key: v.option_key, label: v.option_name }))
          : [{ key: 'both_ways', label: 'Both Ways' }, { key: 'one_way', label: 'One Way' }];
      })();
      return (
        <div key={catId} className="tw-space-y-3">
          <div className="tw-grid tw-grid-cols-2 tw-gap-3">
            <InputField label="Spacing" field={`${catId}_spacing`} unit="in"
              editedItem={{ [`${catId}_spacing`]: catData.spacing || '' }}
              onChange={(_, v) => updateCat(catKey, 'spacing', v)} disabled={isReadOnly} placeholder="0" />
            <InputField label="Bar Length" field={`${catId}_bar_length`} unit="ft"
              editedItem={{ [`${catId}_bar_length`]: catData.bar_length || '' }}
              onChange={(_, v) => updateCat(catKey, 'bar_length', v)} disabled={isReadOnly} placeholder="0" />
          </div>
          <div className="tw-space-y-1.5">
            <FieldLabel>Direction</FieldLabel>
            <CustomSelect id={`${catId}_dir`} options={dirOpts}
              placeholder="Select Direction" value={catData.direction || ''}
              onChange={(v) => updateCat(catKey, 'direction', v)}
              openSelect={openSelect} setOpenSelect={setOpenSelect}
              accentColor={accentColor} disabled={isReadOnly} />
          </div>
          <SteelProductSelect id={`${catId}_prod`} opts={catProdOpts}
            productId={catData.productId || ''} onChange={(v) => updateCat(catKey, 'productId', v)} />
        </div>
      );
    }

    if (catKey === 'structural_steel') {
      const sectionTypeGrp = steelConfigData?.option_groups?.find((g) => g.group_key === 'section_type');
      const sectionTypeOpts = sectionTypeGrp
        ? sectionTypeGrp.values.map((v) => ({ key: v.option_key, label: v.option_name }))
        : [
            { key: 'w_beam', label: 'W-Beam' }, { key: 'hss', label: 'HSS' },
            { key: 'angle', label: 'Angle' }, { key: 'channel', label: 'Channel' },
            { key: 'pipe', label: 'Pipe' }, { key: 'plate', label: 'Plate' },
          ];
      // Resolve section_type key: API may store the display name instead of option_key, so match both
      const resolveSectionTypeKey = (val) => {
        if (!val) return null;
        const v = val.toLowerCase();
        const exact = sectionTypeOpts.find((o) => o.key === val);
        if (exact) return exact.key;
        const ci = sectionTypeOpts.find(
          (o) => (o.key && o.key.toLowerCase() === v) || (o.label && o.label.toLowerCase() === v)
        );
        return ci?.key || null;
      };
      // Never show "Select Section Type" — resolve from response, then fallback to first option
      const effectiveSectionType = resolveSectionTypeKey(catData.section_type) || sectionTypeOpts.find((o) => o.key)?.key || '';
      const selectedSectionTypeObj = sectionTypeOpts.find((o) => o.key === effectiveSectionType);
      const sectionTypeName = selectedSectionTypeObj?.label || '';
      const structProdOpts = sectionTypeName
        ? catProdOpts.filter((o) => {
            const prod = productList.find((p) => String(p.pk_id ?? p.product_id ?? '') === o.key);
            return prod?.product_name?.toLowerCase().startsWith(sectionTypeName.toLowerCase());
          })
        : catProdOpts;
      const handleSectionTypeChange = (v) => {
        const newStObj = sectionTypeOpts.find((stv) => stv.key === v);
        const newStName = newStObj?.label || '';
        const filtered = newStName
          ? catProdOpts.filter((o) => {
              const prod = productList.find((p) => String(p.pk_id ?? p.product_id ?? '') === o.key);
              return prod?.product_name?.toLowerCase().startsWith(newStName.toLowerCase());
            })
          : catProdOpts;
        // Resolve product: use section_type-conditioned product_default, fallback to first filtered
        let newProductId = filtered[0]?.key || '';
        if (steelConfigData) {
          const catCfgIdNow = catGrpValues.find((cv) => cv.option_key === 'structural_steel')?.id;
          const stPd = steelConfigData.product_defaults?.find((d) =>
            d.steel_category_id === catCfgIdNow &&
            d.condition_key === 'section_type' &&
            d.condition_value === v
          );
          if (stPd?.product_id) {
            const pidStr = String(stPd.product_id);
            if (filtered.some((o) => o.key === pidStr)) newProductId = pidStr;
            else if (catProdOpts.some((o) => o.key === pidStr)) newProductId = pidStr;
          }
        }
        setSteelCatData((prev) => ({
          ...prev,
          structural_steel: { ...(prev.structural_steel || {}), section_type: v, productId: newProductId },
        }));
      };
      return (
        <div key={catId} className="tw-space-y-3">
          <div className="tw-space-y-1.5">
            <FieldLabel>Section Type</FieldLabel>
            <CustomSelect id={`${catId}_section_type`} options={sectionTypeOpts}
              placeholder="Select Section Type" value={effectiveSectionType}
              onChange={handleSectionTypeChange}
              openSelect={openSelect} setOpenSelect={setOpenSelect}
              accentColor={accentColor} disabled={isReadOnly} />
          </div>
          {elemType === 'roof_deck' && (
            <div className="tw-grid tw-grid-cols-2 tw-gap-3">
              <InputField label="Length per Member" field={`${catId}_len`} unit="ft"
                editedItem={{ [`${catId}_len`]: catData.length_per_member || '' }}
                onChange={(_, v) => updateCat(catKey, 'length_per_member', v)} disabled={isReadOnly} placeholder="0" />
              <InputField label="Quantity" field={`${catId}_qty`} inputType="integer"
                editedItem={{ [`${catId}_qty`]: catData.quantity || '' }}
                onChange={(_, v) => updateCat(catKey, 'quantity', v)} disabled={isReadOnly} placeholder="0" />
            </div>
          )}
          {elemType === 'beam' && (
            <InputField label="Quantity" field={`${catId}_qty`} inputType="integer"
              editedItem={{ [`${catId}_qty`]: catData.quantity || '' }}
              onChange={(_, v) => updateCat(catKey, 'quantity', v)} disabled={isReadOnly} placeholder="0" />
          )}
          <SteelProductSelect id={`${catId}_prod`} opts={structProdOpts}
            productId={catData.productId || ''} onChange={(v) => updateCat(catKey, 'productId', v)} />
        </div>
      );
    }

    if (catKey === 'purlin_joist') {
      return (
        <div key={catId} className="tw-space-y-3">
          <div className="tw-grid tw-grid-cols-2 tw-gap-3">
            <InputField label="Length per Member" field={`${catId}_len`} unit="ft"
              editedItem={{ [`${catId}_len`]: catData.length_per_member || '' }}
              onChange={(_, v) => updateCat(catKey, 'length_per_member', v)} disabled={isReadOnly} placeholder="0" />
            <InputField label="Quantity" field={`${catId}_qty`} inputType="integer"
              editedItem={{ [`${catId}_qty`]: catData.quantity || '' }}
              onChange={(_, v) => updateCat(catKey, 'quantity', v)} disabled={isReadOnly} placeholder="0" />
          </div>
          <SteelProductSelect id={`${catId}_prod`} opts={catProdOpts}
            productId={catData.productId || ''} onChange={(v) => updateCat(catKey, 'productId', v)} />
        </div>
      );
    }

    if (catKey === 'misc_steel') {
      if (['footing', 'grade_beam'].includes(elemType)) {
        return (
          <div key={catId} className="tw-space-y-3">
            <InputField label="Spacing" field={`${catId}_spacing`} unit="in"
              editedItem={{ [`${catId}_spacing`]: catData.spacing || '' }}
              onChange={(_, v) => updateCat(catKey, 'spacing', v)} disabled={isReadOnly} placeholder="0" />
            <SteelProductSelect id={`${catId}_prod`} opts={catProdOpts}
              productId={catData.productId || ''} onChange={(v) => updateCat(catKey, 'productId', v)} />
          </div>
        );
      }
      if (elemType === 'column') {
        return (
          <div key={catId} className="tw-space-y-3">
            <InputField label="Quantity per Column" field={`${catId}_qty`} inputType="integer"
              editedItem={{ [`${catId}_qty`]: catData.quantity || '' }}
              onChange={(_, v) => updateCat(catKey, 'quantity', v)} disabled={isReadOnly} placeholder="0" />
            <SteelProductSelect id={`${catId}_prod`} opts={catProdOpts}
              productId={catData.productId || ''} onChange={(v) => updateCat(catKey, 'productId', v)} />
          </div>
        );
      }
      return (
        <div key={catId} className="tw-space-y-3">
          <InputField label="Quantity" field={`${catId}_qty`} inputType="integer"
            editedItem={{ [`${catId}_qty`]: catData.quantity || '' }}
            onChange={(_, v) => updateCat(catKey, 'quantity', v)} disabled={isReadOnly} placeholder="0" />
          <SteelProductSelect id={`${catId}_prod`} opts={catProdOpts}
            productId={catData.productId || ''} onChange={(v) => updateCat(catKey, 'productId', v)} />
        </div>
      );
    }

    if (catKey === 'metal_stair') {
      return (
        <div key={catId} className="tw-space-y-3">
          <InputField label="Quantity" field={`${catId}_qty`} inputType="integer"
            editedItem={{ [`${catId}_qty`]: catData.quantity || '' }}
            onChange={(_, v) => updateCat(catKey, 'quantity', v)} disabled={isReadOnly} placeholder="0" />
          <SteelProductSelect id={`${catId}_prod`} opts={catProdOpts}
            productId={catData.productId || ''} onChange={(v) => updateCat(catKey, 'productId', v)} />
        </div>
      );
    }

    if (catKey === 'railing') {
      return (
        <div key={catId} className="tw-space-y-3">
          <InputField label="Length" field={`${catId}_len`} unit="lf"
            editedItem={{ [`${catId}_len`]: catData.length || '' }}
            onChange={(_, v) => updateCat(catKey, 'length', v)} disabled={isReadOnly} />
          <SteelProductSelect id={`${catId}_prod`} opts={catProdOpts}
            productId={catData.productId || ''} onChange={(v) => updateCat(catKey, 'productId', v)} />
        </div>
      );
    }

    // Default: mesh / deck — just product
    return (
      <div key={catId}>
        <SteelProductSelect id={`${catId}_prod`} opts={catProdOpts}
          productId={catData.productId || ''} onChange={(v) => updateCat(catKey, 'productId', v)} />
      </div>
    );
  };

  const renderGeoFields = () => {
    if (geoFields.length === 0) return null;
    if (geoFields.length <= 3) {
      const cols = geoFields.length === 1 ? null : `repeat(${geoFields.length}, 1fr)`;
      return cols
        ? <div className="tw-grid tw-gap-3" style={{ gridTemplateColumns: cols }}>{geoFields.map(mkGeoInput)}</div>
        : mkGeoInput(geoFields[0]);
    }
    // 4 fields → 2 rows of 2
    return (
      <div className="tw-space-y-3">
        <div className="tw-grid tw-grid-cols-2 tw-gap-3">{mkGeoInput(geoFields[0])}{mkGeoInput(geoFields[1])}</div>
        <div className="tw-grid tw-grid-cols-2 tw-gap-3">{mkGeoInput(geoFields[2])}{mkGeoInput(geoFields[3])}</div>
      </div>
    );
  };

  return (
    <>
      {renderGeoFields()}

      {/* Steel Category checkboxes — horizontal row */}
      {availableCats.length > 0 && (
        <div>
          <p className="tw-text-sm tw-font-medium tw-text-[#262626] tw-mb-2">Steel Category</p>
          <div className="tw-flex tw-flex-row tw-flex-wrap tw-gap-x-5 tw-gap-y-2">
            {availableCats.map((catKey) => (
              <label key={catKey} className="tw-flex tw-items-center tw-gap-2 tw-cursor-pointer tw-select-none">
                <input type="checkbox" checked={!!steelCats[catKey]}
                  onChange={(e) => handleCatCheck(catKey, e.target.checked)}
                  className="tw-w-4 tw-h-4 tw-accent-[#0140c1]" disabled={isReadOnly} />
                <span className="tw-text-sm tw-text-gray-700">{STEEL_CAT_LABELS[catKey] || catKey}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {hasAssemblyItems && <ProductNote />}

      {/* Per-category sections with divider headers */}
      {availableCats.filter((c) => steelCats[c]).map((catKey) => (
        <div key={`section_${catKey}`}>
          <div className="tw-flex tw-items-center tw-gap-2 tw-my-1">
            <div className="tw-flex-1 tw-border-t tw-border-gray-200" />
            <span className="tw-text-[11px] tw-font-semibold tw-text-gray-400 tw-uppercase tw-tracking-wider tw-px-1">
              {STEEL_CAT_LABELS[catKey] || catKey}
            </span>
            <div className="tw-flex-1 tw-border-t tw-border-gray-200" />
          </div>
          {renderCatSection(catKey)}
        </div>
      ))}
    </>
  );
};

export default SteelPanel;
