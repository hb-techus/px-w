import React from "react";
import { CustomSelect, InputField, FieldLabel, SkeletonField, normalizeUnitLabel, normalizeLabel } from "./TakeoffSharedUI";

export const SLOPE_GEO_KEYS = new Set(["ramp_slope", "slope_ratio"]);

export const CONCRETE_AREA_TYPES   = ['slab', 'ramp', 'stair', 'stairs_landings'];
export const CONCRETE_WALL_TYPES   = ['wall', 'footing', 'beam'];
export const CONCRETE_SYMBOL_TYPES = ['column', 'column_pillar'];

export const CONCRETE_SCHEMA = {
  slab: [
    { kind: "input", key: "slab_area", label: "Slab Area", unit: "sf" },
    { kind: "geoByKey", geoKey: "thickness", label: "Slab Thickness" },
  ],
  beam: [
    { kind: "input", key: "beam_length", label: "Beam Length", unit: "lf" },
    { kind: "geoByKey", geoKey: "width", label: "Beam Width" },
    { kind: "geoByKey", geoKey: "depth", label: "Beam Depth" },
  ],
  column_pillar: [
    { kind: "input", key: "column_height", label: "Column Height", unit: "ft" },
    { kind: "input", key: "number_of_columns", label: "Number of Columns", inputType: "integer", unit: "ea" },
    { kind: "geoByKey", geoKey: "width", label: "Column Width" },
    { kind: "geoByKey", geoKey: "depth", label: "Column Depth" },
  ],
  wall: [
    { kind: "input", key: "wall_length", label: "Wall Length", unit: "lf" },
    { kind: "input", key: "wall_height", label: "Wall Height", unit: "ft" },
    { kind: "geoByKey", geoKey: "thickness", label: "Wall Thickness" },
  ],
  footing: [
    { kind: "option", groupKey: "footing_type", label: "Footing Type" },
    { kind: "input", key: "footing_length", label: "Footing Length", unit: "lf" },
    { kind: "input", key: "footing_width", label: "Footing Width", unit: "ft" },
    { kind: "geoByKey", geoKey: "depth", label: "Footing Depth" },
  ],
  stairs_landings: [
    { kind: "input", key: "stair_area", label: "Stair Area", unit: "sf" },
    { kind: "option", groupKey: "stair_type", label: "Stair Type" },
    { kind: "input", key: "flight_length", label: "Flight Length", unit: "ft" },
    { kind: "input", key: "flight_width", label: "Flight Width", unit: "ft" },
    { kind: "input", key: "riser_height", label: "Riser Height", unit: "in" },
    { kind: "input", key: "number_of_steps", label: "Number of Steps", inputType: "integer" },
    { kind: "input", key: "landing_length", label: "Landing Length", unit: "ft" },
    { kind: "input", key: "landing_width", label: "Landing Width", unit: "ft" },
  ],
  ramp: [
    { kind: "input", key: "slab_area", label: "Ramp Area", unit: "sf" },
    { kind: "geoByKey", geoKey: "thickness", label: "Ramp Thickness" },
  ],
};

export function resolveConcreteTypeKey(typeKey) {
  const ALIAS = { column: "column_pillar", stair: "stairs_landings" };
  return ALIAS[typeKey] || typeKey;
}

const ConcretePanel = ({
  configData, selectedTypeKey, attributes, handleAttrChange,
  isLoadingConfig, isReadOnly, openSelect, setOpenSelect, accentColor, isAddMode,
}) => {
  const geoAttrKey = (geoKey) => `concrete_geo_${geoKey}`;

  const mkSelect = (id, label, opts, attrKey) => (
    <div key={id} className="tw-space-y-2">
      <FieldLabel>{label}</FieldLabel>
      <CustomSelect id={id} options={opts} placeholder={`Select ${label}`}
        value={String(attributes[attrKey] || "")} onChange={(v) => handleAttrChange(attrKey, v)}
        openSelect={openSelect} setOpenSelect={setOpenSelect} accentColor={accentColor}
        disabled={isReadOnly} isAddMode={isAddMode} />
    </div>
  );

  if (isLoadingConfig) return (<div className="tw-space-y-4"><SkeletonField /><div className="tw-grid tw-grid-cols-2 tw-gap-4"><SkeletonField /><SkeletonField /></div><SkeletonField /></div>);
  if (!selectedTypeKey) return (<p className="tw-text-sm tw-text-gray-400 tw-text-center tw-py-6">Select an element type above to configure geometry fields.</p>);
  if (!configData) return null;

  const schemaForType = CONCRETE_SCHEMA[resolveConcreteTypeKey(selectedTypeKey)] || [];
  const schemaInputKeySet = new Set(schemaForType.filter((e) => e.kind === "input").map((e) => e.key));

  const configFieldByKey = {};
  (configData.input_fields || []).forEach((f) => {
    const k = f.request_key || f.field_key;
    if (k) configFieldByKey[k] = f;
  });

  const schemaInputItems = schemaForType
    .filter((e) => e.kind === "input")
    .map((entry) => {
      const apiUnit = configFieldByKey[entry.key]?.unit;
      const unit = normalizeUnitLabel(apiUnit || entry.unit);
      return {
        isInput: true,
        key: `schema-inp-${entry.key}`,
        el: <InputField key={`schema-inp-${entry.key}`} label={entry.label} field={entry.key} inputType={entry.inputType} unit={unit} editedItem={attributes} onChange={handleAttrChange} disabled={isReadOnly} />,
      };
    });

  const configInputItems = (configData.input_fields || []).map((field, idx) => {
    const attrKey = field.request_key || field.field_key;
    if (!attrKey || schemaInputKeySet.has(attrKey)) return null;
    const label = field.field_name || normalizeLabel(attrKey);
    const isRO = !!field.is_read_only;
    return { isInput: true, key: `inp-${attrKey}-${idx}`, el: <InputField key={`inp-${attrKey}-${idx}`} label={label} field={attrKey} unit={normalizeUnitLabel(field.unit)} editedItem={attributes} onChange={handleAttrChange} disabled={isRO || isReadOnly} /> };
  }).filter(Boolean);

  const inputItems = [...schemaInputItems, ...configInputItems];

  const isSlopeGroup = (key, name) =>
    SLOPE_GEO_KEYS.has(key) || String(name || "").toLowerCase().includes("slope");

  const geoItems = (configData.geometry_groups || []).flatMap((grp, idx) => {
    if (!grp.values?.length) return [];
    if (isSlopeGroup(grp.geometry_key, grp.geometry_name)) return []; // rendered separately like roof_pitch
    const opts = grp.values.map((v) => ({ key: v.value_key, label: v.value_display, is_default: !!v.is_default }));
    return [{ isInput: false, key: `geo-${grp.geometry_key}-${idx}`, el: mkSelect(`geo-${grp.geometry_key}-${idx}`, grp.geometry_name, opts, geoAttrKey(grp.geometry_key)) }];
  });

  const optItems = (configData.option_groups || []).flatMap((grp, idx) => {
    if (!grp.values?.length) return [];
    if (isSlopeGroup(grp.group_key, grp.group_name)) return []; // rendered separately like roof_pitch
    const opts = grp.values.map((v) => ({ key: v.option_key, label: v.option_name, is_default: !!v.is_default }));
    return [{ isInput: false, key: `opt-${grp.group_key}-${idx}`, el: mkSelect(`opt-${grp.group_key}-${idx}`, grp.group_name, opts, grp.group_key) }];
  });

  const resolved = [...inputItems, ...geoItems, ...optItems];
  const rows = []; let i = 0;
  while (i < resolved.length) {
    const curr = resolved[i], nxt = resolved[i + 1];
    if (curr.isInput && nxt?.isInput) { rows.push(<div key={`pair-${i}`} className="tw-grid tw-grid-cols-2 tw-gap-4">{curr.el}{nxt.el}</div>); i += 2; }
    else { rows.push(curr.el); i++; }
  }

  // Ramp slope — hardcoded dropdown like roof_pitch, bound directly to ramp_slope
  if (resolveConcreteTypeKey(selectedTypeKey) === "ramp") {
    const slopeOpts = ["Flat","1:12","2:12","3:12","4:12","5:12","6:12","7:12","8:12","9:12","10:12","12:12"].map((p) => ({ key: p, label: p }));
    rows.push(
      <div key="ramp_slope" className="tw-space-y-2">
        <FieldLabel>Ramp Slope</FieldLabel>
        <CustomSelect id="ramp_slope" options={slopeOpts} placeholder="Select Ramp Slope"
          value={String(attributes.ramp_slope ?? "")}
          onChange={(v) => handleAttrChange("ramp_slope", v)}
          openSelect={openSelect} setOpenSelect={setOpenSelect}
          accentColor={accentColor} disabled={isReadOnly} isAddMode={isAddMode} />
      </div>
    );
  }

  return rows.length > 0 ? rows : <p className="tw-text-sm tw-text-gray-400 tw-text-center tw-py-6">No configuration available.</p>;
};

export default ConcretePanel;
