// ─── UnknownSymbolPanel ───────────────────────────────────────────────────────
// V2 rebuild: trade → element type (auto-selected, non-editable for concrete/steel)
// → V2 config fields. Payload matches TakeoffDetailsPanel edit structure.
import React, { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { X, Loader2 } from "lucide-react";
import {
  getTypesV2,
  getConfigV2,
  updateAiItem,
} from "../../../../services/techus-services";
import { showToast } from "../../../../genriccomponents/techus-ToastNotification";
import { getDeviceInfo } from "../../../../utils/getDeviceInfo";
import {
  CustomSelect, InputField, FieldLabel, SkeletonField,
} from "./TakeoffSharedUI";
import ConcretePanel, { resolveConcreteTypeKey, SLOPE_GEO_KEYS, CONCRETE_SCHEMA } from "./ConcretePanel";
import SteelPanel, {
  STEEL_GEO_FIELDS, STEEL_SIMPLE_REBAR_ELEMENTS, REBAR_TYPES_BY_ELEMENT,
  REBAR_ENTRY_FIELDS, REBAR_ENTRY_FIELDS_OVERRIDE,
} from "./SteelPanel";

// ─── Constants ────────────────────────────────────────────────────────────────
const UNKNOWN_ALLOWED_TRADES = [
  "concrete", "door_window", "electrical", "hvac", "mechanical", "plumbing", "steel",
];
const UNKNOWN_TRADE_LABELS = {
  concrete: "Concrete",
  door_window: "Doors & Windows",
  electrical: "Electrical",
  hvac: "HVAC",
  mechanical: "Mechanical",
  plumbing: "Plumbing",
  steel: "Steel",
};
const SIMPLE_TRADES = new Set(["door_window", "electrical", "hvac", "mechanical", "plumbing"]);
const TRADE_LENGTH_FIELD = {
  electrical: { key: "wire_length", label: "Wire Length (ft)" },
  hvac:       { key: "duct_length", label: "Duct Length (ft)" },
  plumbing:   { key: "pipe_length", label: "Pipe Length (ft)" },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
function pickDefault(arr, keyFn) {
  if (!arr?.length) return undefined;
  const def = arr.find(x => x.is_default);
  return keyFn(def ?? arr[0]);
}


// ─── UnknownSymbolPanel ───────────────────────────────────────────────────────
export const UnknownSymbolPanel = React.memo(({
  item,
  documentId,
  onClose,
  onSaved,
  isMarkAsCompleted = false,
  productList = [],
}) => {
  const accentColor = "#3b82f6";
  const resolvedName = item?.name || item?.id || "Unknown Symbol";
  const [nameDraft, setNameDraft] = useState(resolvedName);
  const itemEaValue = String(Math.max(1, parseInt(item?.count ?? item?.quantity ?? item?.attributes?.quantity ?? 1, 10) || 1));

  // ── Trade ──────────────────────────────────────────────────────────────────
  const [categories, setCategories] = useState([]);
  const [catsLoading, setCatsLoading] = useState(false);
  const [selectedTrade, setSelectedTrade] = useState(null);

  // ── Type (concrete / steel only) ──────────────────────────────────────────
  const [types, setTypes] = useState([]);
  const [typesLoading, setTypesLoading] = useState(false);
  const [selectedTypeKey, setSelectedTypeKey] = useState("");

  // ── Config ─────────────────────────────────────────────────────────────────
  const [configData, setConfigData] = useState(null);       // concrete: parsed
  const [steelConfigData, setSteelConfigData] = useState(null); // steel: raw
  const [configLoading, setConfigLoading] = useState(false);

  // ── Steel state (mirrors TakeoffDetailsPanel) ──────────────────────────────
  const [steelCats, setSteelCats] = useState({});
  const [steelCatData, setSteelCatData] = useState({});
  const [steelRebarEntries, setSteelRebarEntries] = useState({});
  const steelConfigDataRef = useRef(null);
  steelConfigDataRef.current = steelConfigData;
  const generalScrollRef = useRef(null);

  // ── Attributes (concrete + steel geo) ─────────────────────────────────────
  const [attributes, setAttributes] = useState({});

  // ── Product (simple trades + concrete) ───────────────────────────────────
  const [productId, setProductId] = useState("");

  // ── Saving ────────────────────────────────────────────────────────────────
  const [isSaving, setIsSaving] = useState(false);
  const isSavingRef = useRef(false);
  useEffect(() => { isSavingRef.current = isSaving; }, [isSaving]);

  const isReadOnly = isSaving || isMarkAsCompleted;
  const [openSelect, setOpenSelect] = useState(null);
  const tn = selectedTrade?.takeoff_name ?? "";

  // ── Load trade categories ─────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    setCatsLoading(true);
    const fallback = UNKNOWN_ALLOWED_TRADES.map(k => ({
      takeoff_id: null, takeoff_name: k, name: UNKNOWN_TRADE_LABELS[k],
    }));
    import("../../../../services/techus-services")
      .then(({ GetTakeoffCategories }) => GetTakeoffCategories())
      .then(res => {
        if (cancelled) return;
        let d = res?.data || res;
        if (typeof d === "string") { try { d = JSON.parse(d); } catch {/**/ } }
        const list = d?.valid
          ? (Array.isArray(d.data) ? d.data : Array.isArray(d.categories) ? d.categories : null)
          : null;
        if (list?.length > 0) {
          const filtered = list
            .filter(c => {
              const k = (c.takeoff_name || c.category_name || c.name || "").toLowerCase().replace(/\s+/g, "_");
              return UNKNOWN_ALLOWED_TRADES.includes(k);
            })
            .map(c => {
              const k = (c.takeoff_name || c.category_name || c.name || "").toLowerCase().replace(/\s+/g, "_");
              return { takeoff_id: c.takeoff_id || c.id, takeoff_name: k, name: UNKNOWN_TRADE_LABELS[k] || c.name };
            });
          setCategories(filtered.length > 0 ? filtered : fallback);
        } else setCategories(fallback);
      })
      .catch(() => { if (!cancelled) setCategories(fallback); })
      .finally(() => { if (!cancelled) setCatsLoading(false); });
    return () => { cancelled = true; };
  }, []);

  // ── Load config for a type (concrete / steel) ─────────────────────────────
  const loadConfig = useCallback(async (cat, typeKey, typeObj) => {
    if (!cat?.takeoff_id || !typeObj?.id) return;
    setConfigLoading(true);
    setConfigData(null);
    setSteelConfigData(null);
    setSteelCats({});
    setSteelCatData({});
    setSteelRebarEntries({});
    setAttributes({});
    setProductId("");
    try {
      const res = await getConfigV2({
        organization_uuid: localStorage.getItem("organization_uuid") ?? "",
        project_uuid: localStorage.getItem("project_uuid") ?? "",
        takeoff_id: cat.takeoff_id,
        type_id: typeObj.id,
        device_info: getDeviceInfo(),
      });
      if (!res?.valid || !res.data) return;
      const d = res.data;

      if (cat.takeoff_name === "steel") {
        setSteelConfigData(d);
        const attrInit = {};
        // Seed geo fields to "0" as baseline
        (STEEL_GEO_FIELDS[typeKey] || []).forEach(f => { attrInit[f.key] = "0"; });
        // Override with config input_field defaults (e.g. column_width: 12, column_height: 11)
        (d.input_fields || []).forEach(f => {
          const k = f.request_key || f.field_key;
          if (k && f.default_value != null) attrInit[k] = String(f.default_value);
        });
        // Seed option_group defaults (rebar_type: "vertical", section_type: "w_beam", etc.)
        (d.option_groups || []).forEach(g => {
          if (g.group_key === "steel_category") return; // managed via steelCats, not attributes
          if (g.values?.length > 0) {
            const def = g.values.find(v => v.is_default) ?? g.values[0];
            attrInit[g.group_key] = def.option_key;
          }
        });
        attrInit["number_of_columns"] = itemEaValue;
        setAttributes(attrInit);
        // Start with no categories checked — user selects
        setSteelCats({});
        setSteelCatData({});
        setSteelRebarEntries({});
      } else if (cat.takeoff_name === "concrete") {
        const parsed = {
          input_fields: d.input_fields || [],
          option_groups: d.option_groups || [],
          spec_groups: d.spec_groups || [],
          geometry_groups: d.geometry_groups || [],
        };
        setConfigData(parsed);
        // Seed geo + option defaults
        const attrInit = {};
        parsed.geometry_groups.forEach(g => {
          if (g.values?.length > 0) {
            const isSlopeGrp = SLOPE_GEO_KEYS.has(g.geometry_key) || String(g.geometry_name || "").toLowerCase().includes("slope");
            if (isSlopeGrp) {
              attrInit["ramp_slope"] = pickDefault(g.values, v => v.value_display) ?? "";
            } else {
              attrInit[`concrete_geo_${g.geometry_key}`] = pickDefault(g.values, v => v.value_key) ?? "";
            }
          }
        });
        parsed.option_groups.forEach(g => {
          if (g.values?.length > 0) {
            const isSlopeGrp = String(g.group_name || "").toLowerCase().includes("slope");
            if (isSlopeGrp) {
              attrInit["ramp_slope"] = pickDefault(g.values, v => v.option_name || v.option_key) ?? "";
            } else {
              attrInit[g.group_key] = pickDefault(g.values, v => v.option_key) ?? "";
            }
          }
        });
        parsed.input_fields.forEach(f => {
          const k = f.request_key || f.field_key;
          if (k && f.default_value != null && attrInit[k] === undefined) attrInit[k] = String(f.default_value);
        });
        // Seed schema input fields to "0" so fields show a default (like TakeoffDetailsPanel add mode)
        (CONCRETE_SCHEMA[resolveConcreteTypeKey(typeKey)] || []).forEach(({ kind, key }) => {
          if (kind === "input" && key && attrInit[key] === undefined) attrInit[key] = "0";
        });
        attrInit["number_of_columns"] = itemEaValue;
        setAttributes(attrInit);
        const defProd = d.product_defaults?.[0]?.product_id;
        if (defProd) setProductId(String(defProd));
      }
    } catch {/**/ }
    finally { setConfigLoading(false); }
  }, [itemEaValue]);

  // ── Trade change ──────────────────────────────────────────────────────────
  const handleTradeChange = useCallback(async (tradeKey) => {
    const cat = categories.find(c => c.takeoff_name === tradeKey);
    if (!cat) return;
    setSelectedTrade(cat);
    setSelectedTypeKey("");
    setTypes([]);
    setConfigData(null);
    setSteelConfigData(null);
    setSteelCats({});
    setSteelCatData({});
    setSteelRebarEntries({});
    setAttributes({});
    setProductId("");

    if (SIMPLE_TRADES.has(tradeKey)) {
      setAttributes({ quantity: itemEaValue });
      return;
    }

    if (!cat.takeoff_id) return;
    setTypesLoading(true);
    try {
      const res = await getTypesV2({
        organization_uuid: localStorage.getItem("organization_uuid") ?? "",
        project_uuid: localStorage.getItem("project_uuid") ?? "",
        takeoff_id: cat.takeoff_id,
        device_info: getDeviceInfo(),
      });
      const list = Array.isArray(res?.data) ? res.data : [];
      setTypes(list);
      if (list.length > 0) {
        // Prefer "column" as default for Unknown symbols; fall back to API default then first
        const defType = list.find(t => t.type_key === "column")
          ?? list.find(t => t.is_default)
          ?? list[0];
        setSelectedTypeKey(defType.type_key);
        await loadConfig(cat, defType.type_key, defType);
      }
    } catch {/**/ }
    finally { setTypesLoading(false); }
  }, [categories, loadConfig]);

  // ── Attribute change ──────────────────────────────────────────────────────
  const handleAttrChange = useCallback((k, v) => {
    setAttributes(prev => ({ ...prev, [k]: v }));
  }, []);

  // ── Products for simple trades ────────────────────────────────────────────
  const tradeProducts = useMemo(() => {
    if (!tn || !SIMPLE_TRADES.has(tn)) return [];
    // Match by word stems so "Doors & Windows" matches "door_window", etc.
    const tradeWords = tn.toLowerCase().split("_").filter(Boolean);
    return productList.filter(p => {
      if (p.product_type !== "Primary") return false;
      const pt = (p.trade || "").toLowerCase();
      return tradeWords.some(w => pt.includes(w));
    });
  }, [productList, tn]);

  // ── Products for concrete ─────────────────────────────────────────────────
  const concreteProducts = useMemo(() => {
    if (tn !== "concrete") return [];
    return productList.filter(p => {
      if (p.product_type !== "Primary") return false;
      const pt = (p.trade || "").toLowerCase().replace(/[\s_-]/g, "");
      return pt === "concrete" || pt.includes("concrete");
    });
  }, [productList, tn]);

  const selProduct = useMemo(
    () => tradeProducts.find(p => String(p.pk_id ?? p.product_id ?? "") === productId),
    [tradeProducts, productId],
  );

  // Auto-select first product for simple trades when no product chosen yet
  useEffect(() => {
    if (SIMPLE_TRADES.has(tn) && tradeProducts.length > 0 && !productId) {
      const def = tradeProducts.find(p => p.is_default) ?? tradeProducts[0];
      if (def) setProductId(String(def.pk_id ?? def.product_id ?? ""));
    }
  }, [tn, tradeProducts]);

  // Auto-select first product for concrete when API default missing
  useEffect(() => {
    if (tn === "concrete" && concreteProducts.length > 0 && !productId) {
      const def = concreteProducts.find(p => p.is_default) ?? concreteProducts[0];
      if (def) setProductId(String(def.pk_id ?? def.product_id ?? ""));
    }
  }, [tn, concreteProducts]);

  const lenField = TRADE_LENGTH_FIELD[tn];
  const showLengthField = !!lenField && (
    selProduct?.unit_name?.toLowerCase() === "lf" ||
    String(attributes[lenField?.key] ?? "").trim() !== ""
  );

  // Seed length field to "0" the moment it becomes visible
  useEffect(() => {
    if (showLengthField && lenField && !attributes[lenField.key]) {
      setAttributes(prev => ({ ...prev, [lenField.key]: "0" }));
    }
  }, [showLengthField, lenField]);

  // ── Build concrete attrs payload ──────────────────────────────────────────
  const buildConcreteAttrs = useCallback(() => {
    const cleanAttrs = {};
    const geoVal = geoKey => {
      const raw = attributes[`concrete_geo_${geoKey}`];
      return raw !== undefined && raw !== "" ? String(raw) : undefined;
    };
    const numVal = key => {
      const v = attributes[key];
      const n = parseFloat(v);
      return !isNaN(n) && n >= 0 ? n : undefined;
    };
    switch (resolveConcreteTypeKey(selectedTypeKey)) {
      case "slab": { const t = geoVal("thickness"); if (t) cleanAttrs.slab_thickness = t; const a = numVal("slab_area"); if (a !== undefined) cleanAttrs.slab_area = a; break; }
      case "beam": { const d = geoVal("depth"); const w = geoVal("width"); if (d) cleanAttrs.beam_depth = d; if (w) cleanAttrs.beam_width = w; const l = numVal("beam_length"); if (l !== undefined) cleanAttrs.beam_length = l; break; }
      case "column_pillar": { const d = geoVal("depth"); const w = geoVal("width"); if (d) cleanAttrs.column_depth = d; if (w) cleanAttrs.column_width = w; const h = numVal("column_height"); if (h !== undefined) cleanAttrs.column_height = h; const c = numVal("number_of_columns"); if (c !== undefined) cleanAttrs.number_of_columns = c; break; }
      case "wall": { const t = geoVal("thickness"); if (t) cleanAttrs.wall_thickness = t; const l = numVal("wall_length"); if (l !== undefined) cleanAttrs.wall_length = l; const h = numVal("wall_height"); if (h !== undefined) cleanAttrs.wall_height = h; break; }
      case "footing": { const d = geoVal("depth"); if (d) cleanAttrs.footing_depth = d; const fl = numVal("footing_length"); if (fl !== undefined) cleanAttrs.footing_length = fl; const fw = numVal("footing_width"); if (fw !== undefined) cleanAttrs.footing_width = fw; const ft = String(attributes.footing_type ?? "").trim(); if (ft) cleanAttrs.footing_type = ft; break; }
      case "stairs_landings": { const st = String(attributes.stair_type ?? "").trim(); if (st) cleanAttrs.stair_type = st; ["flight_length","flight_width","riser_height","number_of_steps","landing_length","landing_width"].forEach(k => { const v = numVal(k); if (v !== undefined) cleanAttrs[k] = v; }); break; }
      case "ramp": { const thick = geoVal("thickness"); if (thick) cleanAttrs.ramp_thickness = thick; const rawSlope = String(attributes.ramp_slope ?? "").trim(); if (rawSlope) cleanAttrs.ramp_slope = rawSlope.replace(":", "_"); const a = numVal("slab_area"); if (a !== undefined) cleanAttrs.ramp_area = a; break; }
      default: break;
    }
    return cleanAttrs;
  }, [attributes, selectedTypeKey]);

  // ── Build steel payload — mirrors TakeoffDetailsPanel buildSteelCatsParts ─
  const buildSteelPayload = useCallback(() => {
    // Geo attributes from STEEL_GEO_FIELDS (same as TakeoffDetailsPanel)
    const geoAttrs = {};
    (STEEL_GEO_FIELDS[selectedTypeKey] || []).forEach(f => {
      const v = f.inputType === "integer" ? parseInt(attributes[f.key], 10) : Number(attributes[f.key]);
      if (!isNaN(v) && v > 0) geoAttrs[f.key] = v;
    });

    const isSimpleRebarElem = STEEL_SIMPLE_REBAR_ELEMENTS.has(selectedTypeKey);
    const complexRebarTypesForElem = !isSimpleRebarElem ? (REBAR_TYPES_BY_ELEMENT[selectedTypeKey] || null) : null;

    const cats = [];
    Object.entries(steelCats).forEach(([catKey, checked]) => {
      if (!checked) return;
      const ce = { category_key: catKey };
      const catData = steelCatData[catKey] || {};
      if (catData.productId) ce.product_id = catData.productId;

      if (catKey === "rebar") {
        if (complexRebarTypesForElem) {
          // Complex rebar: entries with nested attributes
          const rebarEntries = complexRebarTypesForElem
            .map(rt => {
              const entry = steelRebarEntries[rt];
              if (!entry?.checked) return null;
              const efFields = REBAR_ENTRY_FIELDS_OVERRIDE[selectedTypeKey]?.[rt] || REBAR_ENTRY_FIELDS[rt] || [];
              const ed = { rebar_type: rt };
              if (entry.productId) ed.product_id = entry.productId;
              const ea = {};
              efFields.forEach(f => {
                const v = entry[f.key];
                if (v !== undefined && v !== "") ea[f.key] = f.inputType === "integer" ? parseInt(v, 10) : Number(v);
              });
              if (Object.keys(ea).length > 0) ed.attributes = ea;
              return ed;
            })
            .filter(Boolean);
          if (rebarEntries.length > 0) ce.rebar_entries = rebarEntries;
        } else {
          // Simple rebar
          const ca = {};
          if (catData.spacing) ca.spacing = Number(catData.spacing);
          if (catData.direction) ca.direction = catData.direction;
          if (catData.bar_length) ca.bar_length = Number(catData.bar_length);
          if (Object.keys(ca).length > 0) ce.attributes = ca;
        }
      } else if (catKey === "structural_steel") {
        const ca = {};
        if (catData.section_type) ca.section_type = catData.section_type;
        if (catData.quantity) ca.quantity = Number(catData.quantity);
        if (catData.length) ca.length = Number(catData.length);
        if (catData.length_per_member) ca.length_per_member = Number(catData.length_per_member);
        if (Object.keys(ca).length > 0) ce.attributes = ca;
      } else {
        const ca = {};
        if (catData.quantity) ca.quantity = Number(catData.quantity);
        if (catData.length) ca.length = Number(catData.length);
        if (catData.spacing) ca.spacing = Number(catData.spacing);
        if (Object.keys(ca).length > 0) ce.attributes = ca;
      }
      cats.push(ce);
    });

    return { geoAttrs, cats };
  }, [selectedTypeKey, attributes, steelCats, steelCatData, steelRebarEntries]);

  // ── Save ──────────────────────────────────────────────────────────────────
  const handleSave = useCallback(async () => {
    const pkId = item?.pk_id ?? item?.item_id;
    if (!pkId || !documentId || !selectedTrade) return;

    const payload = {
      organization_uuid: localStorage.getItem("organization_uuid") ?? "",
      project_uuid: localStorage.getItem("project_uuid") ?? "",
      document_id: documentId,
      item_id: pkId,
      name: nameDraft.trim() || resolvedName,
      takeoff_name: tn,
      device_info: getDeviceInfo(),
    };

    if (tn === "concrete") {
      payload.element_type = selectedTypeKey;
      const concreteAttrs = buildConcreteAttrs();
      const numCols = parseInt(attributes.number_of_columns, 10);
      if (!isNaN(numCols) && numCols > 0) concreteAttrs.number_of_columns = numCols;
      payload.attributes = concreteAttrs;
      if (productId) payload.primary_product_id = productId;
    } else if (tn === "steel") {
      const { geoAttrs, cats } = buildSteelPayload();
      const numCols = parseInt(attributes.number_of_columns, 10);
      if (!isNaN(numCols) && numCols > 0) geoAttrs.number_of_columns = numCols;
      payload.element_type = selectedTypeKey;
      payload.attributes = geoAttrs;
      if (cats.length > 0) payload.steel_categories = cats;
    } else {
      const attrs = {};
      const qty = parseFloat(attributes.quantity);
      if (!isNaN(qty) && qty >= 0) attrs.quantity = qty;
      if (lenField && showLengthField) {
        const ln = parseFloat(attributes[lenField.key]);
        if (!isNaN(ln) && ln > 0) attrs[lenField.key] = ln;
      }
      payload.attributes = attrs;
      if (productId) payload.primary_product_id = productId;
    }

    setIsSaving(true);
    try {
      const res = await updateAiItem(payload);
      if (res?.valid) {
        if (res.message) showToast("success", res.message);
        onSaved?.(pkId);
      } else {
        if (res?.message) showToast("error", res.message);
      }
    } catch (e) {
      showToast("error", e.message || "Request failed");
    } finally {
      setIsSaving(false);
    }
  }, [
    selectedTrade, selectedTypeKey, attributes, productId, item, documentId,
    nameDraft, resolvedName, tn, buildConcreteAttrs, buildSteelPayload,
    lenField, showLengthField, onSaved,
  ]);

  const safeClose = useCallback(() => { if (isSavingRef.current) return; onClose?.(); }, [onClose]);

  // ── Form validity ─────────────────────────────────────────────────────────
  const isFormValid = !!selectedTrade && !configLoading && !typesLoading && (() => {
    if (tn === "concrete") {
      if (!selectedTypeKey || !configData) return false;
      if (concreteProducts.length > 0 && !productId) return false;
      const numCols = parseInt(attributes.number_of_columns ?? "", 10);
      if (isNaN(numCols) || numCols <= 0) return false;
      const schemaInputs = (CONCRETE_SCHEMA[resolveConcreteTypeKey(selectedTypeKey)] || []).filter(e => e.kind === "input");
      const allFilled = schemaInputs.every(f => {
        const v = f.inputType === "integer"
          ? parseInt(attributes[f.key] ?? "", 10)
          : parseFloat(attributes[f.key] ?? "");
        return !isNaN(v) && v > 0;
      });
      if (!allFilled) return false;
      return true;
    }
    if (tn === "steel") {
      if (!selectedTypeKey || !steelConfigData) return false;
      if (!Object.values(steelCats).some(Boolean)) return false;
      const numCols = parseInt(attributes.number_of_columns ?? "", 10);
      if (isNaN(numCols) || numCols <= 0) return false;
      const geoFields = STEEL_GEO_FIELDS[selectedTypeKey] || [];
      const allGeoFilled = geoFields.every(f => {
        const v = f.inputType === "integer"
          ? parseInt(attributes[f.key] ?? "", 10)
          : parseFloat(attributes[f.key] ?? "");
        return !isNaN(v) && v > 0;
      });
      if (!allGeoFilled) return false;
      return true;
    }
    if (SIMPLE_TRADES.has(tn)) {
      const qty = parseFloat(attributes.quantity ?? "");
      if (isNaN(qty) || qty <= 0) return false;
      if (showLengthField && lenField) {
        const ln = parseFloat(attributes[lenField.key] ?? "");
        if (isNaN(ln) || ln <= 0) return false;
      }
      if (tradeProducts.length > 0 && !productId) return false;
      return true;
    }
    return false;
  })();

  const tradeOptions = categories.map(c => ({ key: c.takeoff_name, label: c.name }));

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="tw-bg-white tw-text-foreground tw-flex tw-flex-col" style={{ minHeight: 0 }}>

      {/* Header */}
      <div className="tw-px-6 tw-pt-4 tw-pb-4 tw-flex-shrink-0">
        <div className="tw-flex tw-items-center tw-justify-between tw-mb-3">
          <div className="tw-flex tw-items-center tw-gap-2">
            <div className="tw-h-3 tw-w-3 tw-rounded-full"
              style={{ backgroundColor: item?.color?.stroke || "#f59e0b" }} />
            <span className="tw-text-[11px] tw-font-bold tw-uppercase tw-tracking-widest tw-text-gray-400">
              Unknown Symbols — Edit Item
            </span>
          </div>
          <button onClick={safeClose} disabled={isSaving}
            className="tw-rounded-md tw-p-1 tw-transition-all tw-duration-150 hover:tw-bg-gray-100 disabled:tw-opacity-40 disabled:tw-cursor-not-allowed"
            style={{ color: "#4b5563" }}
            onMouseEnter={e => { if (!isSaving) e.currentTarget.style.color = "#374151"; }}
            onMouseLeave={e => { e.currentTarget.style.color = "#4b5563"; }}>
            <X className="tw-h-4 tw-w-4" />
          </button>
        </div>
        <input
          value={nameDraft}
          onChange={e => setNameDraft(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") e.target.blur(); }}
          disabled={isReadOnly}
          placeholder="Item name"
          className="tw-text-base tw-font-semibold tw-text-gray-900 tw-bg-transparent tw-border-b tw-outline-none tw-w-full placeholder:tw-text-gray-300 disabled:tw-opacity-50"
          style={{ borderColor: "#4488ff" }}
        />
      </div>

      {/* Body */}
      <div
        ref={generalScrollRef}
        className="tw-flex-1 tw-overflow-y-auto tw-px-6 tw-py-5 custom-scroll"
        style={{ minHeight: 0 }}
      >
        <div className="tw-space-y-4">

          {/* Trade selector */}
          <div className="tw-space-y-1.5">
            <FieldLabel>Trade</FieldLabel>
            {catsLoading ? (
              <div className="tw-h-10 tw-w-full tw-rounded-md tw-bg-gray-100 tw-animate-pulse" />
            ) : (
              <CustomSelect
                id="unk_trade" options={tradeOptions} placeholder="Select Trade"
                value={selectedTrade?.takeoff_name || ""}
                onChange={handleTradeChange}
                openSelect={openSelect} setOpenSelect={setOpenSelect}
                accentColor={accentColor} disabled={catsLoading || isReadOnly}
                searchThreshold={99}
              />
            )}
          </div>

          {/* Element type display — concrete / steel: auto-selected, read-only */}
          {selectedTrade && (tn === "concrete" || tn === "steel") && (
            <div className="tw-space-y-1.5">
              <FieldLabel>Element Type</FieldLabel>
              {typesLoading ? (
                <div className="tw-h-10 tw-w-full tw-rounded-md tw-bg-gray-100 tw-animate-pulse" />
              ) : (
                <div
                  className="tw-flex tw-h-10 tw-w-full tw-items-center tw-rounded-lg tw-border tw-bg-gray-50 tw-px-3 tw-text-sm tw-text-gray-700"
                  style={{ borderColor: "#e5e7eb" }}
                >
                  {selectedTypeKey
                    ? selectedTypeKey.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())
                    : <span className="tw-text-gray-400">Loading…</span>}
                </div>
              )}
            </div>
          )}

          {/* Config / trade fields */}
          {selectedTrade && (
            <div className="tw-space-y-4">

              {/* ── Concrete ── */}
              {tn === "concrete" && (
                (configLoading || typesLoading) ? (
                  <div className="tw-space-y-4"><SkeletonField /><SkeletonField /></div>
                ) : (
                  <>
                    <ConcretePanel
                      configData={configData}
                      selectedTypeKey={selectedTypeKey}
                      attributes={attributes}
                      handleAttrChange={handleAttrChange}
                      isLoadingConfig={configLoading}
                      isReadOnly={isReadOnly}
                      openSelect={openSelect}
                      setOpenSelect={setOpenSelect}
                      accentColor={accentColor}
                      isAddMode={false}
                    />
                    {/* Number of Columns — skip for column_pillar since ConcretePanel already shows it */}
                    {resolveConcreteTypeKey(selectedTypeKey) !== "column_pillar" && (
                      <InputField
                        label="Number of Columns"
                        field="number_of_columns"
                        inputType="integer"
                        unit="ea"
                        editedItem={attributes}
                        onChange={handleAttrChange}
                        disabled={isReadOnly}
                      />
                    )}
                    {/* Concrete product selector */}
                    {concreteProducts.length > 0 && (
                      <div className="tw-space-y-1.5">
                        <FieldLabel>Product</FieldLabel>
                        <CustomSelect
                          id="concrete_product"
                          options={concreteProducts.map(p => ({
                            key: String(p.pk_id ?? p.product_id ?? ""),
                            label: [p.product_code, p.product_name].filter(Boolean).join(" "),
                          }))}
                          placeholder="Select Product"
                          value={productId}
                          onChange={v => setProductId(v)}
                          openSelect={openSelect} setOpenSelect={setOpenSelect}
                          accentColor={accentColor} disabled={isReadOnly}
                        />
                      </div>
                    )}
                  </>
                )
              )}

              {/* ── Steel — uses SteelPanel (same as TakeoffDetailsPanel) ── */}
              {tn === "steel" && (
                <>
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
                    isLoadingConfig={configLoading}
                    openSelect={openSelect}
                    setOpenSelect={setOpenSelect}
                    accentColor={accentColor}
                    generalScrollRef={generalScrollRef}
                  />
                  {!configLoading && steelConfigData && !(STEEL_GEO_FIELDS[selectedTypeKey] || []).some(f => f.key === "number_of_columns") && (
                    <InputField
                      label="Number of Columns"
                      field="number_of_columns"
                      inputType="integer"
                      unit="ea"
                      editedItem={attributes}
                      onChange={handleAttrChange}
                      disabled={isReadOnly}
                    />
                  )}
                </>
              )}

              {/* ── Simple trades: Product + Quantity + optional length ── */}
              {SIMPLE_TRADES.has(tn) && (
                <div className="tw-space-y-4">
                  {tradeProducts.length > 0 && (
                    <div className="tw-space-y-1.5">
                      <FieldLabel>Product</FieldLabel>
                      <CustomSelect
                        id="unk_product"
                        options={tradeProducts.map(p => ({
                          key: String(p.pk_id ?? p.product_id ?? ""),
                          label: [p.product_code, p.product_name].filter(Boolean).join(" "),
                        }))}
                        placeholder="Select Product"
                        value={productId}
                        onChange={v => setProductId(v)}
                        openSelect={openSelect} setOpenSelect={setOpenSelect}
                        accentColor={accentColor} disabled={isReadOnly}
                      />
                    </div>
                  )}
                  <InputField
                    label="Quantity"
                    field="quantity"
                    unit="ea"
                    editedItem={attributes}
                    onChange={handleAttrChange}
                    disabled={isReadOnly}
                  />
                  {showLengthField && lenField && (
                    <InputField
                      label={lenField.label} field={lenField.key}
                      editedItem={attributes} onChange={handleAttrChange}
                      disabled={isReadOnly}
                    />
                  )}
                </div>
              )}

            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="tw-flex-shrink-0 tw-flex tw-justify-end tw-gap-2 tw-px-6 tw-py-4 tw-border-t tw-border-gray-100">
        <button onClick={safeClose} disabled={isSaving}
          className="tw-inline-flex tw-items-center tw-justify-center tw-rounded-[5px] tw-text-sm tw-font-medium tw-border tw-border-[#dedede] tw-bg-[#dedede] tw-h-9 tw-px-4 tw-transition-all tw-duration-150 disabled:tw-opacity-40 disabled:tw-cursor-not-allowed"
          style={{ color: "#374151" }}
          onMouseEnter={e => { if (!isSaving) { e.currentTarget.style.backgroundColor = `${accentColor}0d`; e.currentTarget.style.borderColor = accentColor; e.currentTarget.style.color = accentColor; } }}
          onMouseLeave={e => { e.currentTarget.style.backgroundColor = "#dedede"; e.currentTarget.style.borderColor = "#e5e7eb"; e.currentTarget.style.color = "#374151"; }}>
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={!isFormValid || isSaving || isMarkAsCompleted}
          className="tw-inline-flex tw-items-center tw-justify-center tw-gap-2 tw-rounded-[5px] tw-text-sm tw-font-semibold tw-h-9 tw-px-5 tw-text-white tw-transition-all tw-duration-150 disabled:tw-opacity-50 disabled:tw-cursor-not-allowed hover:tw-opacity-90"
          style={{ backgroundColor: "#0140c1", boxShadow: "0 1px 4px #0140c150" }}>
          {isSaving && <Loader2 className="tw-h-3.5 tw-w-3.5 tw-animate-spin" />}
          {isSaving ? "Saving…" : "Save Details"}
        </button>
      </div>
    </div>
  );
});

UnknownSymbolPanel.displayName = "UnknownSymbolPanel";
export default UnknownSymbolPanel;
