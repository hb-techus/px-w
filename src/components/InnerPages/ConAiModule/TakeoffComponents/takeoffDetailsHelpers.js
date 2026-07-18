import {
  Home, Layers, PaintBucket, DoorOpen, Square,
  Wind, Zap, Building2, Wrench, Pipette, Hammer, Grid3x3,
} from "lucide-react";
import { resolveConcreteTypeKey, CONCRETE_SCHEMA, SLOPE_GEO_KEYS } from "./ConcretePanel";
import { capitalizeFirst, normalizeLabel } from "./TakeoffSharedUI";
import { STEEL_GEO_FIELDS, STEEL_SIMPLE_REBAR_ELEMENTS, REBAR_TYPES_BY_ELEMENT } from "./SteelPanel";

export const PANEL_TYPE_MAP = {
  door_window: "doors",
  flooring: "floor",
  roofing: "roof",
};

export const INTERNAL_FIELDS = new Set([
  "pk_id", "item_id", "id", "takeoff_id", "page_number",
  "name", "display_name", "color", "accentColor",
  "takeoff_name", "type_key", "attributes",
  "line_order", "takeoff_order",
  "__preloadedTypes", "__preloadedConfig", "__resolvedTypeKey", "__extractedProduct",
  "steel_categories", "object_keys",
]);

export const CONFIG_DRIVEN_FIELDS = new Set([
  "material_thickness",
  "drywall_thickness", "drywall_sheet_size",
]);

export const EXCLUDED_FIELDS = new Set([
  "angle_type", "length", "duct_length", "pipe_length",
]);

export const CATEGORY_NUMERIC_FIELDS = {
  painting: [
    { key: "wall_length", label: "Wall Length", unit: "lf" },
    { key: "wall_height", label: "Wall Height", unit: "ft" },
    { key: "number_of_coats", label: "Number of Coats" },
  ],
  drywall: [
    { key: "wall_length", label: "Wall Length", unit: "lf" },
    { key: "wall_height", label: "Wall Height", unit: "ft" },
  ],
  siding: [
    { key: "wall_length", label: "Wall Length", unit: "lf" },
    { key: "wall_height", label: "Wall Height", unit: "ft" },
  ],
  masonry: [
    { key: "wall_length", label: "Wall Length", unit: "lf" },
    { key: "wall_height", label: "Wall Height", unit: "ft" },
    { key: "number_of_wythes", label: "Number of Wythes" },
  ],
  floor: [{ key: "floor_area", label: "Floor Area", unit: "sf" }],
  ceiling: [{ key: "ceiling_area", label: "Ceiling Area", unit: "sf" }],
  roof: [{ key: "roof_area", label: "Roof Area", unit: "sf" }],
  doors: [{ key: "quantity", label: "Quantity", unit: "ea" }],
  hvac: [{ key: "quantity", label: "Quantity", unit: "ea" }],
  electrical: [{ key: "quantity", label: "Quantity", unit: "ea" }],
  mechanical: [{ key: "quantity", label: "Quantity", unit: "ea" }],
  plumbing: [{ key: "quantity", label: "Quantity", unit: "ea" }],
};

export const ALL_NUMERIC_KEYS = new Set(
  Object.values(CATEGORY_NUMERIC_FIELDS).flat().map((f) => f.key).concat([
    "length", "duct_length", "pipe_length",
    "wall_length", "wall_height", "floor_area", "ceiling_area",
    "roof_area", "count", "quantity", "number_of_coats",
    "slab_area", "stair_area", "beam_length", "footing_length", "flight_length",
    "column_height", "number_of_columns", "wire_length",
    "element_area", "element_length", "element_height", "element_width",
    "element_count", "member_length", "member_count",
    "purlin_length", "purlin_count", "truss_member_length",
    "truss_member_count", "misc_count",
    "riser_height", "number_of_steps", "landing_length", "landing_width",
    "flight_width", "footing_width",
    "slab_length", "slab_width", "roof_deck_area",
    "pile_cap_area", "pile_cap_length", "pile_cap_width",
    "footing_depth", "grade_beam_length", "grade_beam_width",
    "beam_width", "beam_depth", "column_width", "column_depth",
    "bar_count", "bars_per_column", "railing_length",
    "bar_length", "spacing", "length_per_member", "quantity_per_column",
  ])
);

const CATEGORY_META = {
  drywall: { Icon: Square, label: "Drywall" },
  painting: { Icon: PaintBucket, label: "Painting" },
  doors: { Icon: DoorOpen, label: "Doors & Windows" },
  floor: { Icon: Home, label: "Flooring" },
  ceiling: { Icon: Layers, label: "Ceiling" },
  hvac: { Icon: Wind, label: "HVAC" },
  roof: { Icon: Home, label: "Roofing" },
  electrical: { Icon: Zap, label: "Electrical" },
  concrete: { Icon: Building2, label: "Concrete" },
  masonry: { Icon: Grid3x3, label: "Masonry" },
  mechanical: { Icon: Wrench, label: "Mechanical" },
  plumbing: { Icon: Pipette, label: "Plumbing" },
  siding: { Icon: Layers, label: "Siding" },
  steel: { Icon: Hammer, label: "Steel" },
};

export function getCategoryMeta(resolvedType) {
  return CATEGORY_META[resolvedType] || { Icon: Square, label: capitalizeFirst(resolvedType) };
}

export function getTypeLabel(type) {
  if (["electrical", "plumbing", "mechanical", "hvac"].includes(type)) return "Component";
  if (type === "steel" || type === "concrete") return "Element Type";
  return "Type";
}

export const TRADE_FROM_TYPE = {
  floor: "Flooring", ceiling: "Ceiling", doors: "Doors & Windows",
  drywall: "Drywall", painting: "Paint", hvac: "HVAC", roof: "Roofing",
  electrical: "Electrical", concrete: "Concrete", masonry: "Masonry",
  mechanical: "Mechanical", plumbing: "Plumbing", siding: "Siding", steel: "Steel",
};

export const CONCRETE_ELEMENT_PRODUCT_KEY = {
  column_pillar: "column",
  stairs_landings: "stair",
};

function normaliseSpecGroup(g) {
  return {
    group_key: g.group_key ?? g.spec_key,
    group_name: g.group_name ?? g.spec_name,
    values: (g.values || []).map((v) => ({
      value_key: v.value_key,
      option_key: v.value_key,
      option_name: v.value_display ?? v.option_name,
      value_display: v.value_display ?? v.option_name,
      parent_option_key: v.parent_option_key ?? null,
      is_default: !!v.is_default,
    })),
  };
}

export function parseConfig(d, typeDefinition) {
  const rawFields = d.input_fields || [];
  const typeFields = typeDefinition?.input_fields || [];
  let inputFields;
  if (rawFields.length > 0 && rawFields[0].field_key) {
    inputFields = rawFields;
  } else if (typeFields.length > 0 && typeFields[0].field_key) {
    const responseOverrides = Object.fromEntries(rawFields.map((f) => [f.id, f.default_value]));
    inputFields = typeFields.map((tf) => ({
      ...tf,
      default_value: responseOverrides[tf.id] !== undefined ? responseOverrides[tf.id] : tf.default_value,
    }));
  } else {
    inputFields = rawFields.length > 0 ? rawFields : typeFields;
  }
  return {
    option_groups: (d.option_groups || []).map((g) => ({
      ...g, values: (g.values || []).map((v) => ({ ...v, is_default: !!v.is_default })),
    })),
    spec_groups: (d.spec_groups || []).map(normaliseSpecGroup),
    geometry_groups: (d.geometry_groups || []).map((g) => ({
      ...g, values: (g.values || []).map((v) => ({ ...v, is_default: !!v.is_default })),
    })),
    input_fields: inputFields,
  };
}

export function pickDefault(arr, keyFn) {
  if (!arr || arr.length === 0) return undefined;
  const def = arr.find((x) => x.is_default);
  return keyFn(def ?? arr[0]);
}

export function applyConfigToAttrs(prev, parsed, resolvedType, mode, itemRef, selectedTypeKey) {
  const next = { ...prev };
  const CMU_REBAR_FIELDS = new Set(["cmu_vertical_rebar", "cmu_horizontal_rebar", "cmu_joint_reinforcement"]);

  parsed.option_groups?.forEach((g) => {
    if (!g.values?.length) return;
    if (SLOPE_GEO_KEYS.has(g.group_key) || String(g.group_name || "").toLowerCase().includes("slope")) {
      if (!prev.ramp_slope) next.ramp_slope = pickDefault(g.values, (v) => v.option_name || v.option_key) ?? "";
      return;
    }
    const keys = g.values.map((v) => v.option_key);
    const currentVal = String(prev[g.group_key] ?? "");
    const configDefault = pickDefault(g.values, (v) => v.option_key);
    const isPlaceholderNone = CMU_REBAR_FIELDS.has(g.group_key) && currentVal === "none" && configDefault !== "none";
    if (!keys.includes(currentVal) || isPlaceholderNone) next[g.group_key] = configDefault;
  });

  const DEFERRED_SPEC_KEYS = new Set(["purlin_size", "section_size"]);
  parsed.spec_groups?.forEach((g) => {
    if (DEFERRED_SPEC_KEYS.has(g.group_key)) return;
    if (g.values?.length > 0) {
      const keys = g.values.map((v) => v.value_key);
      if (!keys.includes(String(prev[g.group_key] ?? "")))
        next[g.group_key] = pickDefault(g.values, (v) => v.value_key);
    }
  });

  parsed.geometry_groups?.forEach((g) => {
    if (!g.values?.length) return;
    const isSlope = SLOPE_GEO_KEYS.has(g.geometry_key) || String(g.geometry_name || "").toLowerCase().includes("slope");
    if (isSlope) {
      if (!prev.ramp_slope) next.ramp_slope = pickDefault(g.values, (v) => v.value_display) ?? "";
      return;
    }
    const attrKey = `concrete_geo_${g.geometry_key}`;
    const keys = g.values.map((v) => v.value_key);
    if (!keys.includes(String(prev[attrKey] ?? "")))
      next[attrKey] = pickDefault(g.values, (v) => v.value_key);
  });

  if (["hvac", "electrical", "mechanical"].includes(resolvedType)) {
    const firstSpecGroup = parsed.spec_groups?.[0];
    const firstOptionGroup = parsed.option_groups?.find((g) => g.group_key !== "duct_shape");
    const newTypeKeys = new Set([
      ...(parsed.spec_groups?.flatMap((g) => g.values.map((v) => v.value_key)) || []),
      ...(parsed.option_groups?.filter((g) => g.group_key !== "duct_shape").flatMap((g) => g.values.map((v) => v.option_key)) || []),
    ]);
    const currentSpec = String(prev.component_specification ?? "").trim();
    if (currentSpec && newTypeKeys.has(currentSpec)) {
      next.component_specification = currentSpec;
    } else {
      next.component_specification =
        (firstSpecGroup ? pickDefault(firstSpecGroup.values, (v) => v.value_key) : null) ||
        (firstOptionGroup ? pickDefault(firstOptionGroup.values, (v) => v.option_key) : null) || "";
    }
    if (resolvedType === "electrical" && !next.component_specification)
      next.component_specification = itemRef?.current?.attributes?.component_specification || itemRef?.current?.component_specification || "";
  }

  {
    const purlinSizeGrp = parsed.spec_groups?.find((g) => g.group_key === "purlin_size");
    if (purlinSizeGrp?.values?.length > 0) {
      const activePurlin = next.purlin_type ?? prev.purlin_type ?? "";
      if (activePurlin && activePurlin !== "none") {
        const filtered = purlinSizeGrp.values.filter((v) => v.parent_option_key === activePurlin);
        const candidates = filtered.length > 0 ? filtered : purlinSizeGrp.values;
        const candidateKeys = candidates.map((v) => v.value_key);
        next.purlin_size = pickDefault(candidates, (v) => v.value_key) ?? next.purlin_size ?? "";
        const stored = String(prev.purlin_size ?? "");
        if (stored && candidateKeys.includes(stored)) next.purlin_size = stored;
      } else { next.purlin_size = ""; }
    }
    const sectionSizeGrp = parsed.spec_groups?.find((g) => g.group_key === "section_size");
    if (sectionSizeGrp?.values?.length > 0) {
      const activeSectionType = next.section_type ?? prev.section_type ?? "";
      if (activeSectionType) {
        const filtered = sectionSizeGrp.values.filter((v) => v.parent_option_key === activeSectionType);
        const candidates = filtered.length > 0 ? filtered : sectionSizeGrp.values;
        const candidateKeys = candidates.map((v) => v.value_key);
        next.section_size = pickDefault(candidates, (v) => v.value_key) ?? next.section_size ?? "";
        const stored = String(prev.section_size ?? "");
        if (stored && candidateKeys.includes(stored)) next.section_size = stored;
      } else {
        const allKeys = sectionSizeGrp.values.map((v) => v.value_key);
        if (!allKeys.includes(String(prev.section_size ?? "")))
          next.section_size = pickDefault(sectionSizeGrp.values, (v) => v.value_key) ?? "";
      }
    }
  }

  if (parsed.input_fields?.length > 0) {
    parsed.input_fields.forEach((f) => {
      const key = f.request_key || f.field_key;
      if (!key) return;
      if (resolvedType === "steel" && key === "length") return;
      if (f.condition_key && f.condition_value) {
        const attrVal = String(
          next[f.condition_key] ?? prev[f.condition_key] ??
          (f.condition_key === "element_type" && resolvedType === "steel" ? (selectedTypeKey ?? "") : "")
        );
        if (attrVal !== String(f.condition_value)) return;
      }
      const current = String(next[key] ?? "").trim();
      if ((current === "" || current === "0") && f.default_value !== null && f.default_value !== undefined)
        next[key] = String(f.default_value);
    });
  }

  return next;
}

export function buildInitialAttrs(item, resolvedType, mode, productList) {
  const attrs = item?.attributes && typeof item.attributes === "object" ? item.attributes : {};
  const a = {};
  const declaredFields = CATEGORY_NUMERIC_FIELDS[resolvedType] || [];
  const seedValue = mode === "add" ? "0" : "";
  declaredFields.forEach(({ key }) => { a[key] = seedValue; });

  if (mode === "add") {
    if (resolvedType === "electrical") a.wire_length = "0";
    if (resolvedType === "hvac") a.duct_length = "0";
    if (resolvedType === "plumbing") a.pipe_length = "0";
  }

  Object.entries(item || {}).forEach(([k, v]) => {
    if (!INTERNAL_FIELDS.has(k) && !EXCLUDED_FIELDS.has(k)) a[k] = v ?? "";
  });
  Object.entries(attrs).forEach(([k, v]) => {
    if (!EXCLUDED_FIELDS.has(k)) a[k] = v ?? "";
  });

  if (resolvedType === "plumbing")
    a.pipe_length = attrs.pipe_length ?? item.pipe_length ?? a.pipe_length ?? "";
  if (resolvedType === "electrical") {
    const wl = attrs.wire_length ?? item.wire_length;
    a.wire_length = (wl != null && wl !== "") ? String(wl) : (mode === "add" ? "0" : "");
  }
  if (resolvedType === "hvac")
    a.duct_length = attrs.duct_length ?? item.duct_length ?? a.duct_length ?? "";

  if (["hvac", "electrical", "mechanical"].includes(resolvedType))
    a.component_specification = "";

  if (!a.product_id) {
    const prodObj = item.product ?? (attrs.product && typeof attrs.product === 'object' ? attrs.product : null);
    if (prodObj) {
      const byCode = productList.find((pl) => pl.product_code === (prodObj.code ?? prodObj.product_code));
      const resolvedKey = byCode ? String(byCode.pk_id ?? byCode.product_id ?? "") : "";
      a.product_id = resolvedKey || String(prodObj.id ?? "");
    }
  }

  if (resolvedType === "concrete") {
    const GEO_MAPS = [
      ["column_width", "concrete_geo_width"], ["column_depth", "concrete_geo_depth"],
      ["beam_width", "concrete_geo_width"], ["beam_depth", "concrete_geo_depth"],
      ["wall_thickness", "concrete_geo_thickness"], ["slab_thickness", "concrete_geo_thickness"],
      ["ramp_thickness", "concrete_geo_thickness"], ["footing_depth", "concrete_geo_depth"],
    ];
    GEO_MAPS.forEach(([src, dst]) => {
      const srcVal = item[src] ?? attrs[src];
      if (srcVal !== undefined && srcVal !== "" && (a[dst] === undefined || a[dst] === ""))
        a[dst] = String(srcVal);
    });
    if (a.ramp_slope) a.ramp_slope = String(a.ramp_slope).replace("_", ":");
    const concreteTypeKey = resolveConcreteTypeKey(item.__resolvedTypeKey || item.type_key || item.element_type || "");
    if (concreteTypeKey === "ramp") {
      const ra = item.ramp_area ?? attrs.ramp_area;
      if (ra !== undefined && ra !== "" && (a.slab_area === undefined || a.slab_area === ""))
        a.slab_area = String(ra);
    }
    if (mode === "add") {
      (CONCRETE_SCHEMA[concreteTypeKey] || []).forEach(({ kind, key }) => {
        if (kind === "input" && key && (a[key] === undefined || a[key] === "")) a[key] = "0";
      });
    }
  }

  return a;
}

export function validateTakeoffForm({
  resolvedType, selectedTypeKey, attributes, configKeySet,
  productList, types, mode, steelCats, steelCatData, steelRebarEntries,
}) {
  const isAddMode = mode === "add";
  const errors = {};

  if (resolvedType !== "steel" && resolvedType !== "concrete" && !selectedTypeKey && types.length > 0)
    errors.__type__ = `${getTypeLabel(resolvedType)} is required`;

  if (resolvedType === "concrete" && selectedTypeKey) {
    const REQUIRED_BY_CONCRETE_TYPE = {
      slab: ["slab_area"], beam: ["beam_length"],
      column_pillar: ["column_height", "number_of_columns"],
      wall: ["wall_length", "wall_height"],
      footing: ["footing_length", "footing_width"],
      stairs_landings: ["flight_length", "flight_width", "riser_height", "number_of_steps"],
      ramp: ["slab_area"],
    };
    (REQUIRED_BY_CONCRETE_TYPE[resolveConcreteTypeKey(selectedTypeKey)] || []).forEach((k) => {
      const val = String(attributes[k] ?? "").trim();
      if (!val || val === "0") errors[k] = `${normalizeLabel(k)} is required`;
    });
  }

  if (resolvedType === "electrical") {
    if (isNaN(parseFloat(attributes.quantity)) || parseFloat(attributes.quantity) <= 0) errors.quantity = "Quantity is required";
    const selProd = productList.find((p) => String(p.pk_id ?? p.product_id ?? "") === String(attributes.product_id ?? "").trim());
    const showElecLen = selProd?.unit_name?.toLowerCase() === "lf" || (!isAddMode && String(attributes.wire_length ?? "").trim() !== "");
    if (showElecLen) {
      const ln = String(attributes.wire_length ?? "").trim();
      if (!ln || parseFloat(ln) <= 0) errors.wire_length = "Wire Length is required";
    }
  }

  if (resolvedType === "hvac") {
    if (isNaN(parseFloat(attributes.quantity)) || parseFloat(attributes.quantity) <= 0) errors.quantity = "Quantity is required";
    const selProd = productList.find((p) => String(p.pk_id ?? p.product_id ?? "") === String(attributes.product_id ?? "").trim());
    const showDuctLen = selProd?.unit_name?.toLowerCase() === "lf" || (!isAddMode && String(attributes.duct_length ?? "").trim() !== "");
    if (showDuctLen) {
      const dl = String(attributes.duct_length ?? "").trim();
      if (!dl || parseFloat(dl) <= 0) errors.duct_length = "Duct Length is required";
    }
  }

  if (resolvedType === "mechanical") {
    if (isNaN(parseFloat(attributes.quantity)) || parseFloat(attributes.quantity) <= 0) errors.quantity = "Quantity is required";
  }

  if (resolvedType === "plumbing") {
    if (isNaN(parseFloat(attributes.quantity)) || parseFloat(attributes.quantity) <= 0) errors.quantity = "Quantity is required";
    const selProd = productList.find((p) => String(p.pk_id ?? p.product_id ?? "") === String(attributes.product_id ?? "").trim());
    const showPipeLen = selProd?.unit_name?.toLowerCase() === "lf" || (!isAddMode && String(attributes.pipe_length ?? "").trim() !== "");
    if (showPipeLen) {
      const pl = String(attributes.pipe_length ?? "").trim();
      if (!pl || parseFloat(pl) <= 0) errors.pipe_length = "Pipe Length is required";
    }
  }

  if (!["steel", "concrete", "electrical", "hvac", "plumbing", "mechanical"].includes(resolvedType)) {
    (CATEGORY_NUMERIC_FIELDS[resolvedType] || []).forEach(({ key, label }) => {
      if (configKeySet.has(key) || CONFIG_DRIVEN_FIELDS.has(key)) return;
      const v = parseFloat(attributes[key]);
      if (isNaN(v) || v <= 0) errors[key] = `${label} is required`;
    });
  }

  if (resolvedType === "steel") {
    if (!selectedTypeKey) errors.__type__ = "Element Type is required";
    if (selectedTypeKey && mode === "add") {
      (STEEL_GEO_FIELDS[selectedTypeKey] || []).forEach(({ key, label }) => {
        const v = parseFloat(attributes[key] ?? "");
        if (isNaN(v) || v <= 0) errors[key] = `${label} is required`;
      });
    }
    if (selectedTypeKey && !Object.values(steelCats).some(Boolean))
      errors.__steel_cat__ = "Select at least one Steel Category";
    const _isSimpleRebar = STEEL_SIMPLE_REBAR_ELEMENTS.has(selectedTypeKey);
    const _complexRebarTypes = !_isSimpleRebar ? (REBAR_TYPES_BY_ELEMENT[selectedTypeKey] || null) : null;
    Object.keys(steelCats).filter(k => steelCats[k]).forEach((catKey) => {
      const cd = steelCatData[catKey] || {};
      if (catKey === 'rebar') {
        if (!_complexRebarTypes) {
          if (!cd.productId) errors.__steel_prod_rebar__ = "Product is required for Rebar";
          if (!cd.spacing || parseFloat(cd.spacing) <= 0) errors.__steel_field_rebar_spacing__ = "Spacing is required for Rebar";
          if (!cd.bar_length || parseFloat(cd.bar_length) <= 0) errors.__steel_field_rebar_bar_length__ = "Bar Length is required for Rebar";
        } else {
          const checkedRTs = _complexRebarTypes.filter(rt => steelRebarEntries[rt]?.checked);
          if (checkedRTs.length === 0) {
            errors.__steel_rebar_type__ = "Select at least one rebar type";
          } else {
            checkedRTs.forEach(rt => {
              if (!steelRebarEntries[rt]?.productId) errors[`__steel_prod_rebar_${rt}__`] = `Product required for ${rt}`;
            });
          }
        }
      } else {
        if (!cd.productId) errors[`__steel_prod_${catKey}__`] = `Product required for ${catKey.replace(/_/g, ' ')}`;
        if (catKey === 'misc_steel') {
          if (['footing', 'grade_beam'].includes(selectedTypeKey)) {
            if (!cd.spacing || parseFloat(cd.spacing) <= 0) errors.__steel_field_misc_spacing__ = "Spacing is required for Misc Steel";
          } else {
            if (!cd.quantity || parseInt(cd.quantity, 10) <= 0) errors.__steel_field_misc_qty__ = "Quantity is required for Misc Steel";
          }
        } else if (catKey === 'metal_stair') {
          if (!cd.quantity || parseInt(cd.quantity, 10) <= 0) errors.__steel_field_metal_stair_qty__ = "Quantity is required for Metal Stair";
        } else if (catKey === 'railing') {
          if (!cd.length || parseFloat(cd.length) <= 0) errors.__steel_field_railing_len__ = "Length is required for Railing";
        } else if (catKey === 'structural_steel') {
          if (!cd.section_type) errors.__steel_field_struct_st__ = "Section Type is required for Structural Steel";
          if (selectedTypeKey === 'roof_deck') {
            if (!cd.length_per_member || parseFloat(cd.length_per_member) <= 0) errors.__steel_field_struct_lpm__ = "Length per Member is required for Structural Steel";
            if (!cd.quantity || parseInt(cd.quantity, 10) <= 0) errors.__steel_field_struct_qty__ = "Quantity is required for Structural Steel";
          } else if (selectedTypeKey === 'beam') {
            if (!cd.quantity || parseInt(cd.quantity, 10) <= 0) errors.__steel_field_struct_qty__ = "Quantity is required for Structural Steel";
          }
        } else if (catKey === 'purlin_joist') {
          if (!cd.length_per_member || parseFloat(cd.length_per_member) <= 0) errors.__steel_field_purlin_lpm__ = "Length per Member is required for Purlin/Joist";
          if (!cd.quantity || parseInt(cd.quantity, 10) <= 0) errors.__steel_field_purlin_qty__ = "Quantity is required for Purlin/Joist";
        }
      }
    });
  }

  if (mode === "add" && !["steel", "concrete"].includes(resolvedType)) {
    const tradeName = TRADE_FROM_TYPE[resolvedType] || "";
    if (tradeName) {
      const hasPrimary = productList.some((p) => p.product_type === "Primary" && p.trade?.toLowerCase() === tradeName.toLowerCase());
      if (hasPrimary && !String(attributes.product_id ?? "").trim()) errors.product_id = "Product is required";
    }
  }

  return { errors, isValid: Object.keys(errors).length === 0 };
}
