import React from "react";
import ConcretePanel from "./ConcretePanel";
import SteelPanel from "./SteelPanel";
import { CustomSelect, InputField, FieldLabel, SkeletonField, normalizeUnitLabel } from "./TakeoffSharedUI";
import { CATEGORY_NUMERIC_FIELDS, CONFIG_DRIVEN_FIELDS } from "./takeoffDetailsHelpers";

const GeneralFields = ({
  resolvedType, configData, selectedTypeKey, attributes, handleAttrChange,
  isLoadingConfig, isReadOnly, openSelect, setOpenSelect, accentColor, isAddMode,
  configKeySet, productList, showProductNote,
  types, steelCats, setSteelCats, steelCatData, setSteelCatData,
  steelRebarEntries, setSteelRebarEntries, steelConfigData, steelConfigDataRef, generalScrollRef,
}) => {
  if (resolvedType === "concrete") return (
    <ConcretePanel
      configData={configData}
      selectedTypeKey={selectedTypeKey}
      attributes={attributes}
      handleAttrChange={handleAttrChange}
      isLoadingConfig={isLoadingConfig}
      isReadOnly={isReadOnly}
      openSelect={openSelect}
      setOpenSelect={setOpenSelect}
      accentColor={accentColor}
      isAddMode={isAddMode}
    />
  );

  if (resolvedType === "steel") return (
    <SteelPanel
      selectedTypeKey={selectedTypeKey}
      types={types}
      steelCats={steelCats}
      setSteelCats={setSteelCats}
      steelCatData={steelCatData}
      setSteelCatData={setSteelCatData}
      steelRebarEntries={steelRebarEntries}
      setSteelRebarEntries={setSteelRebarEntries}
      steelConfigData={steelConfigData}
      steelConfigDataRef={steelConfigDataRef}
      attributes={attributes}
      handleAttrChange={handleAttrChange}
      productList={productList}
      isReadOnly={isReadOnly}
      isLoadingConfig={isLoadingConfig}
      openSelect={openSelect}
      setOpenSelect={setOpenSelect}
      accentColor={accentColor}
      generalScrollRef={generalScrollRef}
      hasAssemblyItems={showProductNote}
    />
  );

  if (isLoadingConfig) return (
    <div className="tw-space-y-4">
      <SkeletonField />
      <div className="tw-grid tw-grid-cols-2 tw-gap-4"><SkeletonField /><SkeletonField /></div>
      <SkeletonField />
    </div>
  );

  const rows = [];
  const declaredFields = (CATEGORY_NUMERIC_FIELDS[resolvedType] || []).filter(({ key }) => !configKeySet.has(key) && !CONFIG_DRIVEN_FIELDS.has(key));
  let i = 0;
  while (i < declaredFields.length) {
    const f = declaredFields[i], nxt = declaredFields[i + 1];
    const u = normalizeUnitLabel(f.unit);
    if (nxt) {
      const u2 = normalizeUnitLabel(nxt.unit);
      rows.push(
        <div key={`geo-row-${i}`} className="tw-grid tw-grid-cols-2 tw-gap-4">
          <InputField label={f.label} field={f.key} unit={u} editedItem={attributes} onChange={handleAttrChange} disabled={isReadOnly} />
          <InputField label={nxt.label} field={nxt.key} unit={u2} editedItem={attributes} onChange={handleAttrChange} disabled={isReadOnly} />
        </div>
      );
      i += 2;
    } else {
      rows.push(<InputField key={f.key} label={f.label} field={f.key} unit={u} editedItem={attributes} onChange={handleAttrChange} disabled={isReadOnly} />);
      i++;
    }
  }

  if (resolvedType === "roof") {
    const pitchOpts = ["Flat","1:12","2:12","3:12","4:12","5:12","6:12","7:12","8:12","9:12","10:12","12:12"].map((p) => ({ key: p, label: p }));
    rows.push(
      <div key="roof_pitch" className="tw-space-y-1.5">
        <FieldLabel>Roof Pitch</FieldLabel>
        <CustomSelect id="roof_pitch" options={pitchOpts} placeholder="Select Pitch"
          value={String(attributes.roof_pitch ?? "")}
          onChange={(v) => handleAttrChange("roof_pitch", v)}
          openSelect={openSelect} setOpenSelect={setOpenSelect}
          accentColor={accentColor} disabled={isReadOnly} isAddMode={isAddMode} />
      </div>
    );
  }

  if (configData) {
    const mkOptSel = (g) => {
      const opts = g.values.map((v) => ({ key: v.option_key, label: v.option_name, is_default: !!v.is_default }));
      const isCompSpecType = ["electrical", "mechanical", "hvac"].includes(resolvedType);
      const isCompSpecGroup = isCompSpecType && g.group_key !== "duct_shape";
      const label = isCompSpecGroup ? "Component Specification" : g.group_name;
      const attrKey = isCompSpecGroup ? "component_specification" : g.group_key;
      return (
        <div key={g.group_key} className="tw-space-y-2">
          <FieldLabel>{label}</FieldLabel>
          <CustomSelect id={g.group_key} options={opts} placeholder="" value={String(attributes[attrKey] || opts[0]?.key || "")} onChange={(v) => handleAttrChange(attrKey, v)} openSelect={openSelect} setOpenSelect={setOpenSelect} accentColor={accentColor} disabled={isReadOnly} isAddMode={isAddMode} />
        </div>
      );
    };

    const renderedOptGroups = resolvedType === "roof"
      ? configData.option_groups.filter((g) => g.group_key !== "roof_pitch")
      : configData.option_groups;
    let j = 0;
    while (j < renderedOptGroups.length) {
      const g = renderedOptGroups[j], gN = renderedOptGroups[j + 1];
      if (gN) { rows.push(<div key={`opt-row-${j}`} className="tw-grid tw-grid-cols-2 tw-gap-4">{mkOptSel(g)}{mkOptSel(gN)}</div>); j += 2; }
      else { rows.push(mkOptSel(g)); j++; }
    }

    if (resolvedType !== "plumbing" && configData.spec_groups.length > 0) {
      const mkSpecSel = (g) => {
        let label = g.group_name, attrKey = g.group_key;
        if (["electrical", "mechanical", "hvac"].includes(resolvedType)) { label = "Component Specification"; attrKey = "component_specification"; }
        const opts = g.values.map((v) => ({ key: v.value_key ?? v.option_key, label: v.value_display ?? v.option_name, is_default: !!v.is_default }));
        return (
          <div key={g.group_key} className="tw-space-y-2">
            <FieldLabel>{label}</FieldLabel>
            <CustomSelect id={`spec_${g.group_key}`} options={opts} placeholder="" value={String(attributes[attrKey] || opts[0]?.key || "")} onChange={(v) => handleAttrChange(attrKey, v)} openSelect={openSelect} setOpenSelect={setOpenSelect} accentColor={accentColor} disabled={isReadOnly} isAddMode={isAddMode} />
          </div>
        );
      };
      let s = 0;
      while (s < configData.spec_groups.length) {
        const g = configData.spec_groups[s], gN = configData.spec_groups[s + 1];
        if (gN) { rows.push(<div key={`spec-row-${s}`} className="tw-grid tw-grid-cols-2 tw-gap-4">{mkSpecSel(g)}{mkSpecSel(gN)}</div>); s += 2; }
        else { rows.push(mkSpecSel(g)); s++; }
      }
    }
  }

  if (resolvedType === "electrical" || resolvedType === "hvac" || resolvedType === "plumbing") {
    const selProd = productList.find((p) => String(p.pk_id ?? p.product_id ?? "") === String(attributes.product_id ?? "").trim());
    const isLfProduct = selProd?.unit_name?.toLowerCase() === "lf";
    if (resolvedType === "electrical") {
      const showWireLen = isLfProduct && (isAddMode || String(attributes.wire_length ?? "").trim() !== "");
      if (showWireLen) rows.push(<InputField key="electrical_wire_length" label="Wire Length" field="wire_length" unit="lf" editedItem={attributes} onChange={handleAttrChange} disabled={isReadOnly} />);
    }
    if (resolvedType === "hvac") {
      const showDuctLen = isLfProduct && (isAddMode || String(attributes.duct_length ?? "").trim() !== "");
      if (showDuctLen) rows.push(<InputField key="hvac_duct_length" label="Duct Length" field="duct_length" unit="lf" editedItem={attributes} onChange={handleAttrChange} disabled={isReadOnly} />);
    }
    if (resolvedType === "plumbing") {
      const showPipeLen = isLfProduct && (isAddMode || String(attributes.pipe_length ?? "").trim() !== "");
      if (showPipeLen) rows.push(<InputField key="plumbing_pipe_length" label="Pipe Length" field="pipe_length" unit="lf" editedItem={attributes} onChange={handleAttrChange} disabled={isReadOnly} />);
    }
  }

  if (rows.length === 0) return <p className="tw-text-sm tw-text-gray-400 tw-text-center tw-py-6">No details available for this item.</p>;
  return rows;
};

export default GeneralFields;
