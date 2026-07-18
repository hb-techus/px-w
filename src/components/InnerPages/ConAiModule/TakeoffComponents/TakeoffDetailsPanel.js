import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { getDeviceInfo } from "../../../../utils/getDeviceInfo";
import PanelHeader from "./PanelHeader";
import PanelFooter from "./PanelFooter";
import GeneralAdvancedOptions from "./GeneralAdvancedOptions";
import GeneralFields from "./GeneralFields";
import { updateAiItem, addLineItem, getConfigV2, getTypesV2, getAssemblyTargets, getGeneralTargets } from "../../../../services/techus-services";
import { showToast } from "../../../../genriccomponents/techus-ToastNotification";
import { Info } from "lucide-react";
import { CustomSelect, FieldLabel, normalizeLabel, markSingleDefault } from "./TakeoffSharedUI";
import { normalizeItemName } from "../../../../utils/textUtils";
import { STEEL_AREA_TYPES, STEEL_WALL_TYPES, STEEL_SYMBOL_TYPES, STEEL_ALL_TYPE_OPTS, STEEL_GEO_FIELDS, STEEL_SIMPLE_REBAR_ELEMENTS, REBAR_TYPES_BY_ELEMENT, REBAR_ENTRY_FIELDS, REBAR_ENTRY_FIELDS_OVERRIDE, STEEL_GEO_CARRYOVER } from "./SteelPanel";
import { CONCRETE_SCHEMA, resolveConcreteTypeKey, CONCRETE_AREA_TYPES, CONCRETE_WALL_TYPES, CONCRETE_SYMBOL_TYPES } from "./ConcretePanel";
import AssemblyTab from "./AssemblyTab";
import {
  PANEL_TYPE_MAP, INTERNAL_FIELDS, EXCLUDED_FIELDS, CATEGORY_NUMERIC_FIELDS, ALL_NUMERIC_KEYS,
  getCategoryMeta, getTypeLabel, parseConfig, pickDefault, applyConfigToAttrs,
  TRADE_FROM_TYPE, CONCRETE_ELEMENT_PRODUCT_KEY, validateTakeoffForm, buildInitialAttrs,
} from "./takeoffDetailsHelpers";


// ─── Main Panel ───────────────────────────────────────────────────────────────
const TakeoffDetailsPanel = React.memo(({
  item, onUpdate, onClose, type, documentId,
  mode = "edit", isMarkAsCompleted = false,
  pageNumber = 1,
  onAdd, productList = [],
}) => {
  const resolvedType = PANEL_TYPE_MAP[type] || type;
  const isAddMode = mode === "add";

  const initAttrs = useCallback(() => buildInitialAttrs(item, resolvedType, mode, productList), [item, resolvedType, mode]);

  // Resolve API product object { id, code, name } → the pk_id key used by getCatProducts options
  const resolveProductKey = (prod) => {
    if (!prod) return "";
    const p = productList.find((pl) => pl.product_code === prod.code);
    return p ? String(p.pk_id ?? p.product_id ?? "") : "";
  };

  const [attributes, setAttributes] = useState(initAttrs);
  const [types, setTypes] = useState([]);
  const [selectedTypeKey, setSelectedTypeKey] = useState(
    item.type_key || (["steel", "concrete"].includes(resolvedType) ? (item.element_type || "") : "") || ""
  );
  const [configData, setConfigData] = useState(null);
  const [isLoadingTypes] = useState(false);
  const [isLoadingConfig, setIsLoadingConfig] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const isSavingRef = useRef(false);
  useEffect(() => { isSavingRef.current = isSaving; }, [isSaving]);

  const [fieldErrors, setFieldErrors] = useState({});
  const safeClose = useCallback(() => { if (isSavingRef.current) return; onClose?.(); }, [onClose]);
  const [openSelect, setOpenSelect] = useState(null);

  const resolvedName = normalizeItemName(item.name || item.id || "");
  const [itemName, setItemName] = useState(resolvedName);
  const [nameDraft, setNameDraft] = useState(resolvedName);
  // const nameInputRef = useRef(null);
  const [isInitialising, setIsInitialising] = useState(false);

  // ── Steel V2 state ────────────────────────────────────────────────────────
  const [steelCats, setSteelCats] = useState({});
  const [steelCatData, setSteelCatData] = useState({});
  const [steelRebarEntries, setSteelRebarEntries] = useState({});
  const [steelConfigData, setSteelConfigData] = useState(null);
  // Refs updated synchronously during render (not in useEffect) so Promise .then()
  // callbacks always read the value from the latest completed render cycle.
  const steelCatsRef = useRef({});
  steelCatsRef.current = steelCats;
  const steelConfigDataRef = useRef(null);
  steelConfigDataRef.current = steelConfigData;
  const attributesRef = useRef(attributes);
  attributesRef.current = attributes;
  // Tracks the last fetched (takeoff_id::typeKey) to prevent duplicate fetches in StrictMode / double-fire
  const steelConfigFetchKeyRef = useRef("");
  const concreteConfigFetchKeyRef = useRef("");

  // ── Assembly tab state ─────────────────────────────────────────────────────
  const generalScrollRef = useRef(null);
  const asmLidRef = useRef(0)
  const asmScrollRef = useRef(null)
  const [activeTab, setActiveTab] = useState('general')
  const [assemblyRows, setAssemblyRows] = useState([])
  const [advancedOpen, setAdvancedOpen] = useState(false)
  const [applyMode, setApplyMode] = useState('this')
  const [selectedItems, setSelectedItems] = useState(new Set())
  const [itemsDropOpen, setItemsDropOpen] = useState(false)
  const [itemSearch, setItemSearch] = useState('')
  const itemsBtnRef = useRef(null)
  const itemsListRef = useRef(null)
  const [itemsDropStyle, setItemsDropStyle] = useState({})
  // const isFirstLoad = useRef(true);
  const [assemblyTargets, setAssemblyTargets] = useState([])
  const [isLoadingTargets, setIsLoadingTargets] = useState(false)

  // ── General tab advanced options state ────────────────────────────────────
  const [generalAdvancedOpen, setGeneralAdvancedOpen] = useState(false)
  const [generalApplyMode, setGeneralApplyMode] = useState('this')
  const [generalSelectedItems, setGeneralSelectedItems] = useState(new Set())
  const [generalItemsDropOpen, setGeneralItemsDropOpen] = useState(false)
  const [generalItemSearch, setGeneralItemSearch] = useState('')
  const generalItemsBtnRef = useRef(null)
  const generalItemsListRef = useRef(null)
  const [generalTargets, setGeneralTargets] = useState([])
  const [isLoadingGeneralTargets, setIsLoadingGeneralTargets] = useState(false)
  const [productChangedNote, setProductChangedNote] = useState(false)
  const assemblyRowsLenRef = useRef(0);
  assemblyRowsLenRef.current = assemblyRows.length;

  useEffect(() => {
    if (asmScrollRef.current) {
      asmScrollRef.current.scrollTo({ top: asmScrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [assemblyRows.length]);

  useEffect(() => {
    if (assemblyRows.length > 0) setProductChangedNote(false);
  }, [assemblyRows.length]);

  useEffect(() => {
    const n = normalizeItemName(item.name || item.id || "");
    setItemName(n); setNameDraft(n);
  }, [item.pk_id, item.item_id, item.id, item.name]);

  const itemRef = useRef(item);
  useEffect(() => { itemRef.current = item; }, [item]);

  useEffect(() => {
    setAttributes(initAttrs());
    setSelectedTypeKey(item?.type_key || (["steel", "concrete"].includes(resolvedType) ? (item?.element_type || "") : "") || "");
    setFieldErrors({});
  }, [initAttrs, item?.type_key, item?.element_type]);

  // ── Steel V2 init: populate category checkboxes and field values from item ──
  useEffect(() => {
    if (resolvedType !== "steel") return;
    const cats = {};
    const catData = {};
    const rebarEnt = {};

    // Flat format from get_line_item: steel_category (singular string) + top-level fields
    const sc = item.steel_categories;
    if (!sc || typeof sc !== "object") {
      const catKey = item.steel_category;
      if (!catKey) return;
      cats[catKey] = true;
      if (catKey === "rebar") {
        const isSimpleElem = STEEL_SIMPLE_REBAR_ELEMENTS.has(item.element_type);
        if (isSimpleElem) {
          catData.rebar = {
            spacing: String(item.spacing ?? ""),
            direction: item.direction || "",
            bar_length: String(item.bar_length ?? ""),
            productId: resolveProductKey(item.product),
          };
        } else {
          // Complex rebar — pre-check all types for this element
          const rebarTypes = REBAR_TYPES_BY_ELEMENT[item.element_type] || [];
          rebarTypes.forEach(rt => {
            rebarEnt[rt] = { checked: true, productId: "", bar_count: "", bars_per_column: "", lap_length: "", spacing: "", bar_length: "" };
          });
          catData.rebar = {};
        }
      } else {
        catData[catKey] = {
          productId: resolveProductKey(item.product),
          quantity: String(item.quantity ?? ""),
          length: String(item.length ?? ""),
          section_type: item.section_type || "",
          length_per_member: String(item.length_per_member ?? ""),
          spacing: String(item.spacing ?? ""),
        };
      }
      setSteelCats(cats);
      setSteelCatData(catData);
      setSteelRebarEntries(rebarEnt);
      return;
    }

    // Nested format (steel_categories object)
    Object.entries(sc).forEach(([catKey, catVal]) => {
      if (!catVal) return;
      cats[catKey] = true;
      if (catKey === "rebar") {
        const knownTypes = new Set(['vertical', 'horizontal', 'joint_reinforcement', 'longitudinal', 'transverse', 'tie', 'main_longitudinal', 'main', 'stirrup']);
        const isSimpleElem = STEEL_SIMPLE_REBAR_ELEMENTS.has(item.element_type);
        const mapRebarEntry = (e) => ({
          checked: true,
          productId: resolveProductKey(e.product),
          bar_count: String(e.bar_count ?? ""),
          bars_per_column: String(e.bars_per_column ?? ""),
          lap_length: String(e.lap_length ?? ""),
          spacing: String(e.spacing ?? ""),
          bar_length: String(e.bar_length ?? ""),
        });
        if (!isSimpleElem && Array.isArray(catVal.rebar_entries) && catVal.rebar_entries.some((e) => e.rebar_type)) {
          // Complex rebar: rebar_entries array with typed entries
          catVal.rebar_entries.forEach((e) => { if (e.rebar_type) rebarEnt[e.rebar_type] = mapRebarEntry(e); });
          catData.rebar = {};
        } else if (!isSimpleElem && Object.keys(catVal).some((k) => knownTypes.has(k))) {
          // Complex rebar: flat object keyed by rebar_type name
          Object.entries(catVal).forEach(([rt, rtData]) => {
            if (knownTypes.has(rt) && rtData && typeof rtData === "object") rebarEnt[rt] = mapRebarEntry({ ...rtData, rebar_type: rt });
          });
          catData.rebar = {};
        } else if (!isSimpleElem) {
          // Complex rebar element but catVal is empty — pre-check all rebar types for this element
          const rebarTypes = REBAR_TYPES_BY_ELEMENT[item.element_type] || [];
          rebarTypes.forEach(rt => {
            rebarEnt[rt] = { checked: true, productId: "", bar_count: "", bars_per_column: "", lap_length: "", spacing: "", bar_length: "" };
          });
          catData.rebar = {};
        } else {
          // Simple rebar: flat fields directly on catVal
          catData.rebar = {
            spacing: String(catVal.spacing ?? ""),
            direction: catVal.direction || "",
            bar_length: String(catVal.bar_length ?? ""),
            productId: resolveProductKey(catVal.product),
          };
        }
      } else {
        catData[catKey] = {
          productId: resolveProductKey(catVal.product),
          quantity: String(catVal.quantity ?? catVal.quantity_per_column ?? ""),
          length: String(catVal.length ?? ""),
          section_type: catVal.section_type || "",
          length_per_member: String(catVal.length_per_member ?? ""),
          spacing: String(catVal.spacing ?? ""),
        };
      }
    });
    setSteelCats(cats);
    setSteelCatData(catData);
    setSteelRebarEntries(rebarEnt);
  }, [item.item_id, item.pk_id, item.id, resolvedType]); 

  // ── Steel config — single effect, fires whenever selectedTypeKey changes ──
  // This is the ONLY place that calls getTypesV2 / getConfigV2 for steel.
  // handleTypeChange just calls setSelectedTypeKey; this effect reacts to it.
  useEffect(() => {
    if (resolvedType !== "steel" || !item.takeoff_id || !selectedTypeKey) return;
    const fetchKey = `${item.takeoff_id}::${selectedTypeKey}`;
    if (steelConfigFetchKeyRef.current === fetchKey) return;
    steelConfigFetchKeyRef.current = fetchKey;
    let cancelled = false;
    setIsLoadingConfig(true);
    const org = localStorage.getItem("organization_uuid") ?? "";
    const prj = localStorage.getItem("project_uuid") ?? "";

    const doConfigFetch = (typesList) => {
      const sel = typesList.find((t) => t.type_key === selectedTypeKey);
      if (!sel?.id) { if (!cancelled) setIsLoadingConfig(false); return; }
      getConfigV2({ organization_uuid: org, project_uuid: prj, takeoff_id: item.takeoff_id, type_id: sel.id, device_info: getDeviceInfo() })
        .then((cfg) => {
          if (!cancelled && cfg?.data) {
            setSteelConfigData(cfg.data);
            // Apply unconditioned field defaults (only to empty/unset fields)
            const geoDefaults = {};
            (cfg.data.input_fields || []).forEach((f) => {
              if (!f.condition_key && f.default_value != null)
                geoDefaults[f.request_key || f.field_key] = String(f.default_value);
            });
            if (Object.keys(geoDefaults).length > 0)
              setAttributes((prev) => {
                const updates = {};
                Object.entries(geoDefaults).forEach(([k, v]) => {
                  if (prev[k] === undefined || prev[k] === "" || prev[k] === "0") updates[k] = v;
                });
                return Object.keys(updates).length > 0 ? { ...prev, ...updates } : prev;
              });
            // Retro-apply defaults for cats already checked before config loaded (race condition fix)
            const catGrpVals = cfg.data.option_groups?.find((g) => g.group_key === "steel_category")?.values || [];
            const checkedNow = Object.keys(steelCatsRef.current).filter((k) => steelCatsRef.current[k]);
            if (checkedNow.length > 0) {
              const isSimpleRebarElem = STEEL_SIMPLE_REBAR_ELEMENTS.has(selectedTypeKey);
              const complexRebarTypesForElem = !isSimpleRebarElem ? (REBAR_TYPES_BY_ELEMENT[selectedTypeKey] || null) : null;
              checkedNow.forEach((catKey) => {
                const catCfgId = catGrpVals.find((v) => v.option_key === catKey)?.id;
                const newData = {};
                (cfg.data.input_fields || []).forEach((f) => {
                  if (f.condition_key === "steel_category" && f.condition_value === catKey)
                    newData[f.request_key || f.field_key] = String(f.default_value ?? "");
                });
                if (catKey === "structural_steel" && !newData.section_type) {
                  const stGrp = cfg.data.option_groups?.find((g) => g.group_key === "section_type");
                  const defaultST = stGrp?.values?.find((v) => v.is_default)?.option_key
                    || stGrp?.values?.[0]?.option_key
                    || "w_beam";
                  newData.section_type = defaultST;
                }
                if (catKey === "rebar") {
                  const dirGrp = cfg.data.option_groups?.find((g) => g.group_key === "direction");
                  const defaultDir = dirGrp?.values?.find((v) => v.is_default)?.option_key || "";
                  if (defaultDir) newData.direction = defaultDir;
                  if (complexRebarTypesForElem) {
                    const rebarDefaults = {};
                    complexRebarTypesForElem.forEach((rt) => {
                      const rtData = {};
                      (cfg.data.input_fields || []).forEach((f) => {
                        if (f.condition_key === "rebar_type" && f.condition_value === rt)
                          rtData[f.request_key || f.field_key] = String(f.default_value ?? "");
                      });
                      {
                        const selTypeId2 = types.find((t) => t.type_key === selectedTypeKey)?.id || null;
                        const rebarCatId = catGrpVals.find((v) => v.option_key === "rebar")?.id;
                        const rebarFilter = (p) => {
                          if (p.product_type !== "Primary" || p.trade?.toLowerCase() !== "steel") return false;
                          if (selTypeId2 && p.element_type_ids?.length > 0 && !p.element_type_ids.includes(selTypeId2)) return false;
                          if (rebarCatId && p.steel_category_id && p.steel_category_id !== rebarCatId) return false;
                          return true;
                        };
                        const pd = cfg.data.product_defaults?.find((d) => d.steel_category_id === catCfgId && d.condition_key === "rebar_type" && d.condition_value === rt);
                        if (pd?.product_id && productList.some((p) => rebarFilter(p) && String(p.pk_id ?? p.product_id ?? "") === String(pd.product_id)))
                          rtData.productId = String(pd.product_id);
                        if (!rtData.productId) {
                          const pdGlobal = cfg.data.product_defaults?.find((d) => !d.steel_category_id && !d.condition_key);
                          if (pdGlobal?.product_id && productList.some((p) => rebarFilter(p) && String(p.pk_id ?? p.product_id ?? "") === String(pdGlobal.product_id)))
                            rtData.productId = String(pdGlobal.product_id);
                        }
                        if (!rtData.productId) {
                          const fp = productList.find(rebarFilter);
                          if (fp) rtData.productId = String(fp.pk_id ?? fp.product_id ?? "");
                        }
                      }
                      if (Object.keys(rtData).length > 0) rebarDefaults[rt] = rtData;
                    });
                    if (Object.keys(rebarDefaults).length > 0)
                      setSteelRebarEntries((prev) => {
                        const next = { ...prev };
                        Object.entries(rebarDefaults).forEach(([rt, defaults]) => {
                          const existing = next[rt] || {};
                          const merged = { ...existing };
                          // Only fill fields that were not already set from get_line_item
                          Object.entries(defaults).forEach(([k, v]) => {
                            if (existing[k] === undefined || existing[k] === "") merged[k] = v;
                          });
                          next[rt] = merged;
                        });
                        return next;
                      });
                  }
                }
                {
                  const selTypeId = types.find((t) => t.type_key === selectedTypeKey)?.id || null;
                  // Two-tier filter: category-specific first, then fallback to any steel product for this element type
                  const catFilterStrict = (p) => {
                    if (p.product_type !== 'Primary' || p.trade?.toLowerCase() !== 'steel') return false;
                    if (selTypeId && p.element_type_ids?.length > 0 && !p.element_type_ids.includes(selTypeId)) return false;
                    if (catCfgId && p.steel_category_id && p.steel_category_id !== catCfgId) return false;
                    return true;
                  };
                  const catFilterLoose = (p) => {
                    if (p.product_type !== 'Primary' || p.trade?.toLowerCase() !== 'steel') return false;
                    if (selTypeId && p.element_type_ids?.length > 0 && !p.element_type_ids.includes(selTypeId)) return false;
                    return true;
                  };
                  const activeFilterBase = productList.some(catFilterStrict) ? catFilterStrict : catFilterLoose;
                  // For structural_steel, use section_type-conditioned product_default + name filter
                  let sectionTypeName = '';
                  if (catKey === 'structural_steel') {
                    const stGrp = cfg.data.option_groups?.find((g) => g.group_key === 'section_type');
                    const stKey = newData.section_type;
                    const stObj = stGrp?.values?.find((v) => v.option_key === stKey);
                    sectionTypeName = stObj?.option_name || '';
                    const stPd = cfg.data.product_defaults?.find((d) =>
                      d.steel_category_id === catCfgId &&
                      d.condition_key === 'section_type' &&
                      d.condition_value === stKey
                    );
                    if (stPd?.product_id) {
                      const pidStr = String(stPd.product_id);
                      if (productList.some((p) => activeFilterBase(p) && String(p.pk_id ?? p.product_id ?? '') === pidStr))
                        newData.productId = pidStr;
                    }
                  }
                  const activeFilter = sectionTypeName
                    ? (p) => activeFilterBase(p) && p.product_name?.toLowerCase().startsWith(sectionTypeName.toLowerCase())
                    : activeFilterBase;
                  if (!newData.productId && catCfgId) {
                    const pd = cfg.data.product_defaults?.find((d) => d.steel_category_id === catCfgId && !d.condition_key);
                    if (pd?.product_id && productList.some((p) => activeFilter(p) && String(p.pk_id ?? p.product_id ?? '') === String(pd.product_id)))
                      newData.productId = String(pd.product_id);
                  }
                  if (!newData.productId) {
                    const pdGlobal = cfg.data.product_defaults?.find((d) => !d.steel_category_id && !d.condition_key);
                    if (pdGlobal?.product_id && productList.some((p) => activeFilter(p) && String(p.pk_id ?? p.product_id ?? '') === String(pdGlobal.product_id)))
                      newData.productId = String(pdGlobal.product_id);
                  }
                  if (!newData.productId) {
                    const fp = productList.find(activeFilter);
                    if (fp) newData.productId = String(fp.pk_id ?? fp.product_id ?? '');
                  }
                }
                if (Object.keys(newData).length > 0)
                  setSteelCatData((prev) => {
                    const existing = prev[catKey] || {};
                    const merged = { ...existing };
                    // Only fill fields not already set from get_line_item
                    Object.entries(newData).forEach(([k, v]) => {
                      if (existing[k] === undefined || existing[k] === "") merged[k] = v;
                    });
                    return { ...prev, [catKey]: merged };
                  });
              });
            }
          }
        })
        .catch(() => {})
        .finally(() => { if (!cancelled) setIsLoadingConfig(false); });
    };

    if (types.length > 0) {
      doConfigFetch(types);
    } else {
      getTypesV2({ organization_uuid: org, takeoff_id: item.takeoff_id, device_info: getDeviceInfo() })
        .then((res) => {
          if (cancelled) return;
          const list = Array.isArray(res?.data) ? res.data : (Array.isArray(res?.data?.types) ? res.data.types : []);
          if (list.length > 0) { setTypes(list); doConfigFetch(list); }
          else setIsLoadingConfig(false);
        })
        .catch(() => { if (!cancelled) setIsLoadingConfig(false); });
    }

    return () => { cancelled = true; };
  }, [selectedTypeKey, resolvedType, item.takeoff_id]);

  // ── Concrete config — auto-load in edit mode ──────────────────────────────
  // handleTypeChange marks concreteConfigFetchKeyRef so this effect skips on manual type changes.
  useEffect(() => {
    if (resolvedType !== "concrete" || !item.takeoff_id || !selectedTypeKey || mode !== "edit") return;
    const fetchKey = `${item.takeoff_id}::${selectedTypeKey}`;
    if (concreteConfigFetchKeyRef.current === fetchKey) return;
    concreteConfigFetchKeyRef.current = fetchKey;
    let cancelled = false;
    setIsLoadingConfig(true);
    const org = localStorage.getItem("organization_uuid") ?? "";
    const prj = localStorage.getItem("project_uuid") ?? "";

    const doFetch = (typesList) => {
      const sel = typesList.find((t) => t.type_key === selectedTypeKey);
      if (!sel?.id) { if (!cancelled) setIsLoadingConfig(false); return; }
      getConfigV2({ organization_uuid: org, project_uuid: prj, takeoff_id: item.takeoff_id, type_id: sel.id, device_info: getDeviceInfo() })
        .then((cfg) => {
          if (cancelled || !cfg?.data) return;
          const parsed = parseConfig(cfg.data, sel);
          setConfigData(parsed);
          setAttributes((prev) => applyConfigToAttrs(prev, parsed, resolvedType, mode, itemRef, selectedTypeKey));
          const defaultProductId = cfg.data.product_defaults?.[0]?.product_id;
          if (defaultProductId)
            setAttributes((prev) => (prev.product_id !== undefined && prev.product_id !== "" ? prev : { ...prev, product_id: String(defaultProductId) }));
        })
        .catch(() => {})
        .finally(() => { if (!cancelled) setIsLoadingConfig(false); });
    };

    if (types.length > 0) {
      doFetch(types);
    } else {
      getTypesV2({ organization_uuid: org, takeoff_id: item.takeoff_id, device_info: getDeviceInfo() })
        .then((res) => {
          if (cancelled) return;
          const list = Array.isArray(res?.data) ? res.data : (Array.isArray(res?.data?.types) ? res.data.types : []);
          if (list.length > 0) { setTypes(list); doFetch(list); }
          else setIsLoadingConfig(false);
        })
        .catch(() => { if (!cancelled) setIsLoadingConfig(false); });
    }
    return () => { cancelled = true; };
  }, [selectedTypeKey, resolvedType, item.takeoff_id]);

  // ── Steel product seeding (mirrors concrete product seeding) ───────────────
  // Ensures each checked steel category never shows "Select Product".
  // Runs when cats change (check/uncheck) or when config loads (steelConfigData).
  useEffect(() => {
    if (resolvedType !== 'steel') return;
    const checkedCats = Object.keys(steelCats).filter(k => steelCats[k]);
    if (checkedCats.length === 0) return;

    const selTypeId = types.find((t) => t.type_key === selectedTypeKey)?.id || null;
    const catGrpVals = steelConfigData?.option_groups?.find((g) => g.group_key === 'steel_category')?.values || [];
    const isSimpleRebarElem = STEEL_SIMPLE_REBAR_ELEMENTS.has(selectedTypeKey);
    const complexRebarTypes = !isSimpleRebarElem ? (REBAR_TYPES_BY_ELEMENT[selectedTypeKey] || null) : null;

    const resolveFirstProduct = (catCfgId) => {
      // Build two-tier filter: category-specific first, fallback to all steel for element type
      const strictFilter = (p) => {
        if (p.product_type !== 'Primary' || p.trade?.toLowerCase() !== 'steel') return false;
        if (selTypeId && p.element_type_ids?.length > 0 && !p.element_type_ids.includes(selTypeId)) return false;
        if (catCfgId && p.steel_category_id && p.steel_category_id !== catCfgId) return false;
        return true;
      };
      const looseFilter = (p) => {
        if (p.product_type !== 'Primary' || p.trade?.toLowerCase() !== 'steel') return false;
        if (selTypeId && p.element_type_ids?.length > 0 && !p.element_type_ids.includes(selTypeId)) return false;
        return true;
      };
      const activeFilter = productList.some(strictFilter) ? strictFilter : looseFilter;
      // Validate config default against active filter before using it
      if (catCfgId && steelConfigData) {
        const pd = steelConfigData.product_defaults?.find((d) => d.steel_category_id === catCfgId && !d.condition_key);
        if (pd?.product_id && productList.some((p) => activeFilter(p) && String(p.pk_id ?? p.product_id ?? '') === String(pd.product_id)))
          return String(pd.product_id);
      }
      if (steelConfigData) {
        const pdGlobal = steelConfigData.product_defaults?.find((d) => !d.steel_category_id && !d.condition_key);
        if (pdGlobal?.product_id && productList.some((p) => activeFilter(p) && String(p.pk_id ?? p.product_id ?? '') === String(pdGlobal.product_id)))
          return String(pdGlobal.product_id);
      }
      const fp = productList.find(activeFilter);
      return fp ? String(fp.pk_id ?? fp.product_id ?? '') : '';
    };

    const catDataUpdates = {};
    const rebarEntryUpdates = {};

    checkedCats.forEach((catKey) => {
      const catCfgId = catGrpVals.find((v) => v.option_key === catKey)?.id;
      if (catKey === 'structural_steel') {
        // Structural steel: seed section_type then resolve product by section_type condition
        const stCatData = steelCatData['structural_steel'] || {};
        const stGrp = steelConfigData?.option_groups?.find((g) => g.group_key === 'section_type');
        const effectiveST = stCatData.section_type
          || stGrp?.values?.find((v) => v.is_default)?.option_key
          || stGrp?.values?.[0]?.option_key
          || 'w_beam';
        if (!stCatData.section_type && effectiveST) catDataUpdates.__st_section_type__ = effectiveST;
        const stPd = steelConfigData?.product_defaults?.find((d) =>
          d.steel_category_id === catCfgId &&
          d.condition_key === 'section_type' &&
          d.condition_value === effectiveST
        );
        let stPid = '';
        if (stPd?.product_id) {
          const pidStr = String(stPd.product_id);
          const stFilter = (p) => {
            if (p.product_type !== 'Primary' || p.trade?.toLowerCase() !== 'steel') return false;
            if (selTypeId && p.element_type_ids?.length > 0 && !p.element_type_ids.includes(selTypeId)) return false;
            if (catCfgId && p.steel_category_id && p.steel_category_id !== catCfgId) return false;
            return true;
          };
          if (productList.some((p) => stFilter(p) && String(p.pk_id ?? p.product_id ?? '') === pidStr)) stPid = pidStr;
        }
        if (!stPid) stPid = resolveFirstProduct(catCfgId);
        if (stPid) catDataUpdates.structural_steel = stPid;
        return;
      }
      if (catKey === 'rebar') {
        const rebarCatId = catGrpVals.find((v) => v.option_key === 'rebar')?.id;
        if (!complexRebarTypes) {
          const pid = resolveFirstProduct(rebarCatId);
          if (pid) catDataUpdates.rebar = pid;
        } else {
          complexRebarTypes.forEach((rt) => {
            let pid = '';
            const pdRt = steelConfigData?.product_defaults?.find((d) => d.steel_category_id === rebarCatId && d.condition_key === 'rebar_type' && d.condition_value === rt);
            if (pdRt?.product_id) {
              const pidStr = String(pdRt.product_id);
              // Validate via resolveFirstProduct filter — only use if product appears in available list
              const rebarFilter = (p) => {
                if (p.product_type !== 'Primary' || p.trade?.toLowerCase() !== 'steel') return false;
                if (selTypeId && p.element_type_ids?.length > 0 && !p.element_type_ids.includes(selTypeId)) return false;
                if (rebarCatId && p.steel_category_id && p.steel_category_id !== rebarCatId) return false;
                return true;
              };
              if (productList.some((p) => rebarFilter(p) && String(p.pk_id ?? p.product_id ?? '') === pidStr))
                pid = pidStr;
            }
            if (!pid) pid = resolveFirstProduct(rebarCatId);
            if (pid) rebarEntryUpdates[rt] = pid;
          });
        }
      } else {
        const pid = resolveFirstProduct(catCfgId);
        if (pid) catDataUpdates[catKey] = pid;
      }
    });

    if (Object.keys(catDataUpdates).length > 0) {
      const pendingST = catDataUpdates.__st_section_type__;
      setSteelCatData((prev) => {
        let changed = false;
        const next = { ...prev };
        Object.entries(catDataUpdates).forEach(([catKey, pid]) => {
          if (catKey === '__st_section_type__') return;
          const existing = prev[catKey] || {};
          const updates = {};
          if (!existing.productId && pid) { updates.productId = pid; changed = true; }
          // Seed section_type for structural_steel if not already set
          if (catKey === 'structural_steel' && !existing.section_type && pendingST) { updates.section_type = pendingST; changed = true; }
          if (Object.keys(updates).length > 0) next[catKey] = { ...existing, ...updates };
        });
        return changed ? next : prev;
      });
    }
    if (Object.keys(rebarEntryUpdates).length > 0) {
      setSteelRebarEntries((prev) => {
        let changed = false;
        const next = { ...prev };
        Object.entries(rebarEntryUpdates).forEach(([rt, pid]) => {
          const existing = prev[rt] || {};
          if (existing.checked && !existing.productId) { next[rt] = { ...existing, productId: pid }; changed = true; }
        });
        return changed ? next : prev;
      });
    }
  }, [resolvedType, selectedTypeKey, steelCats, steelConfigData, productList]);

  useEffect(() => {
    if (!itemsDropOpen || !itemsBtnRef.current) return
    const rect = itemsBtnRef.current.getBoundingClientRect()
    setItemsDropStyle({
      position: 'fixed',
      bottom: window.innerHeight - rect.top + 4,
      left: rect.left,
      width: rect.width,
      zIndex: 10002,
      maxHeight: 220,
      overflowY: 'auto',
      background: '#fff',
      border: '1px solid #E5E7EB',
      borderRadius: 8,
      boxShadow: '0 -4px 20px rgba(0,0,0,0.12)',
    })
  }, [itemsDropOpen])

  useEffect(() => {
    if (!itemsDropOpen) return
    const h = e => {
      if (itemsBtnRef.current?.contains(e.target)) return
      if (itemsListRef.current?.contains(e.target)) return
      setItemsDropOpen(false)
    }
    document.addEventListener('mousedown', h, true)
    return () => document.removeEventListener('mousedown', h, true)
  }, [itemsDropOpen])

  useEffect(() => {
    if (!generalItemsDropOpen) return
    const h = e => {
      if (generalItemsBtnRef.current?.contains(e.target)) return
      if (generalItemsListRef.current?.contains(e.target)) return
      setGeneralItemsDropOpen(false)
    }
    document.addEventListener('mousedown', h, true)
    return () => document.removeEventListener('mousedown', h, true)
  }, [generalItemsDropOpen])

  // ── Assembly init from item data (edit mode) ───────────────────────────────
  useEffect(() => {
    setApplyMode(item.apply_scope || 'this');
    setSelectedItems(Array.isArray(item.selected_item_ids) ? new Set(item.selected_item_ids) : new Set());
    setGeneralApplyMode(item.general_apply_scope || 'this');
    setGeneralSelectedItems(Array.isArray(item.general_selected_item_ids) ? new Set(item.general_selected_item_ids) : new Set());

    const buildAsmRow = (ap) => {
      let label = '';
      if (ap.code && ap.name) {
        label = `${ap.code} ${ap.name}`.trim();
      } else {
        const pid = String(ap.product_id || ap.id || ap.product?.id || '');
        const prod = productList.find(p => String(p.pk_id ?? p.product_id ?? '') === pid);
        label = prod ? `${prod.product_code} ${prod.product_name}`.trim() : '';
      }
      const rawQty = parseFloat(ap.quantity) || 1;
      const qty = rawQty % 1 === 0 ? rawQty : parseFloat(rawQty.toFixed(2));
      return { _lid: ++asmLidRef.current, productId: label, quantity: qty };
    };

    if (resolvedType === 'steel') {
      const sc = item.steel_categories;
      if (sc && typeof sc === 'object') {
        // Nested format: assembly_products inside each category object
        const rows = [];
        Object.values(sc).forEach(catVal => {
          if (!catVal || typeof catVal !== 'object') return;
          const asmProds = catVal.assembly_products;
          if (!Array.isArray(asmProds)) return;
          asmProds.forEach(ap => rows.push(buildAsmRow(ap)));
        });
        setAssemblyRows(rows);
      } else {
        // Flat format: assembly_products directly on item
        const asmProds = item.assembly_products;
        if (!Array.isArray(asmProds) || asmProds.length === 0) { setAssemblyRows([]); }
        else { asmLidRef.current = 0; setAssemblyRows(asmProds.map(buildAsmRow)); }
      }
    } else {
      const asmProds = item.assembly_products;
      if (!Array.isArray(asmProds) || asmProds.length === 0) { setAssemblyRows([]); return; }
      asmLidRef.current = 0;
      setAssemblyRows(asmProds.map(buildAsmRow));
    }
  }, [item.pk_id, item.item_id, item.id]); 

  // ── Fetch assembly targets when Assembly tab is activated ──────────────────
  useEffect(() => {
    if (activeTab !== 'assembly') return;
    if (!item.takeoff_id || !documentId) return;

    const org = localStorage.getItem("organization_uuid") ?? "";
    const prj = localStorage.getItem("project_uuid") ?? "";
    const payload = {
      organization_uuid: org,
      project_uuid: prj,
      document_id: documentId,
      takeoff_id: item.takeoff_id,
      device_info: getDeviceInfo(),
    };

    if (resolvedType === 'steel') {
      if (selectedTypeKey) payload.element_type = selectedTypeKey;
      const checkedCats = Object.keys(steelCats).filter(k => steelCats[k]);
      if (checkedCats.length > 0) payload.category_keys = checkedCats;
    } else if (resolvedType === 'concrete') {
      if (selectedTypeKey) payload.element_type = selectedTypeKey;
    } else {
      const productId = String(attributes.product_id ?? '').trim();
      if (productId) payload.primary_product_id = productId;
    }

    setIsLoadingTargets(true);
    setAssemblyTargets([]);
    getAssemblyTargets(payload)
      .then(res => {
        if (res?.valid && res?.data?.targets) {
          let targets = res.data.targets;
          // In edit mode, exclude the item currently being edited from the selection list
          if (mode === 'edit') {
            const currentId = String(item.pk_id ?? item.item_id ?? '');
            if (currentId) targets = targets.filter(t => String(t.item_id ?? '') !== currentId);
          }
          setAssemblyTargets(targets);
        }
      })
      .catch(() => {})
      .finally(() => setIsLoadingTargets(false));
  }, [activeTab, item.takeoff_id, documentId]);

  // ── Fetch general targets when General tab is active ──────────────────────
  useEffect(() => {
    if (activeTab !== 'general') return;
    if (!item.takeoff_id || !documentId) return;

    const org = localStorage.getItem("organization_uuid") ?? "";
    const prj = localStorage.getItem("project_uuid") ?? "";
    const payload = {
      organization_uuid: org,
      project_uuid: prj,
      document_id: documentId,
      takeoff_id: item.takeoff_id,
      device_info: getDeviceInfo(),
    };

    if ((resolvedType === 'steel' || resolvedType === 'concrete') && selectedTypeKey) {
      payload.element_type = selectedTypeKey;
    }

    if (mode === 'edit') {
      const currentId = String(item.pk_id ?? item.item_id ?? '');
      if (currentId) payload.item_id = currentId;
    }

    setIsLoadingGeneralTargets(true);
    setGeneralTargets([]);
    getGeneralTargets(payload)
      .then(res => {
        if (res?.valid && res?.data?.targets) {
          setGeneralTargets(res.data.targets);
        }
      })
      .catch(() => {})
      .finally(() => setIsLoadingGeneralTargets(false));
  }, [activeTab, item.takeoff_id, documentId, selectedTypeKey]);

  const { label: categoryLabel } = getCategoryMeta(resolvedType);
  const accentColor = "#3b82f6";
  const itemPkId = item.pk_id ?? item.item_id;

  const configKeySet = useMemo(() => {
    const s = new Set();
    if (!configData) return s;
    configData.option_groups?.forEach((g) => s.add(g.group_key));
    configData.spec_groups?.forEach((g) => s.add(g.group_key));
    configData.geometry_groups?.forEach((g) => s.add(`concrete_geo_${g.geometry_key}`));
    return s;
  }, [configData]);

  // ── Main init effect ──────────────────────────────────────────────────────
  useEffect(() => {
    const preTypes = item.__preloadedTypes;
    const preCfg = item.__preloadedConfig;
    const preTypeKey = item.__resolvedTypeKey;

    if (preTypes !== undefined) {
      // Add mode: types/config were pre-fetched by AddItemModal
      setTypes(preTypes || []);
      if (preTypeKey) setSelectedTypeKey(preTypeKey);

      if (preCfg) {
        const allTypesForPreCfg = preTypes || [];
        const preTypeKeyForMerge = preTypeKey || item.type_key;
        const preTypeDef = preTypeKeyForMerge
          ? allTypesForPreCfg.find((t) => t.type_key === preTypeKeyForMerge)
          : (allTypesForPreCfg.find((t) => t.is_default) ?? allTypesForPreCfg[0]);
        const parsedFallback = parseConfig(preCfg, preTypeDef);
        setConfigData(parsedFallback);
        setAttributes((prev) => applyConfigToAttrs(prev, parsedFallback, resolvedType, mode, itemRef, preTypeKey || item.type_key || ""));
        setIsInitialising(false);
        return;
      }

      const allTypes = preTypes || [];
      const currentTypeKey = item.type_key;
      let targetType = currentTypeKey ? allTypes.find((t) => t.type_key === currentTypeKey) : null;
      if (!targetType && allTypes.length > 0) targetType = allTypes.find((t) => t.is_default) ?? allTypes[0];

      const preTypeHasFullInputFields = !targetType?.input_fields?.length ||
        (targetType.input_fields[0] && !!targetType.input_fields[0].field_key);
      if (targetType && Array.isArray(targetType.option_groups) && targetType.option_groups.length > 0 && preTypeHasFullInputFields) {
        const parsedFromType = parseConfig(targetType, targetType);
        setConfigData(parsedFromType);
        setAttributes((prev) => applyConfigToAttrs(prev, parsedFromType, resolvedType, mode, itemRef, targetType.type_key));
      }
      setIsInitialising(false);
      return;
    }

    // Edit mode: no preloaded data — use item attributes directly, no API calls needed
    setIsInitialising(false);
  }, [item.pk_id, item.item_id, item.id]);

  // ── handleTypeChange ──────────────────────────────────────────────────────
  const handleTypeChange = useCallback((typeKey) => {
    setSelectedTypeKey(typeKey);
    setConfigData(null);
    setAttributes((prev) => {
      const next = {};
      const declaredFields = CATEGORY_NUMERIC_FIELDS[resolvedType] || [];
      declaredFields.forEach(({ key }) => {
        next[key] = prev[key] !== undefined ? prev[key] : (mode === "add" ? "0" : "");
      });
      ALL_NUMERIC_KEYS.forEach((key) => {
        if (prev[key] !== undefined && prev[key] !== "") next[key] = prev[key];
      });
      // Concrete: also carry over geometry dropdown values so pre-fed model values survive type switches
      if (resolvedType === "concrete") {
        ["concrete_geo_thickness", "concrete_geo_width", "concrete_geo_depth"].forEach((key) => {
          if (prev[key] !== undefined && prev[key] !== "") next[key] = prev[key];
        });
        // Cross-map area values: slab/ramp use slab_area; stairs_landings uses stair_area
        const prevCKey = resolveConcreteTypeKey(selectedTypeKey);
        const nextCKey = resolveConcreteTypeKey(typeKey);
        if ((prevCKey === 'slab' || prevCKey === 'ramp') && nextCKey === 'stairs_landings') {
          if (next.slab_area && !next.stair_area) next.stair_area = next.slab_area;
        } else if (prevCKey === 'stairs_landings' && (nextCKey === 'slab' || nextCKey === 'ramp')) {
          if (next.stair_area && !next.slab_area) next.slab_area = next.stair_area;
        }
        // Cross-map length values within the wall-type group
        const wallLenMap = { wall: 'wall_length', footing: 'footing_length', beam: 'beam_length' };
        const srcLenF = wallLenMap[prevCKey];
        const dstLenF = wallLenMap[nextCKey];
        if (srcLenF && dstLenF && srcLenF !== dstLenF && next[srcLenF] && !next[dstLenF]) {
          next[dstLenF] = next[srcLenF];
        }
      }
      if (mode === "add" && resolvedType === "concrete") {
        const resolvedConcreteKey = resolveConcreteTypeKey(typeKey);
        (CONCRETE_SCHEMA[resolvedConcreteKey] || []).forEach(({ kind, key }) => {
          if (kind === "input" && key && (next[key] === undefined || next[key] === "")) next[key] = "0";
        });
      }
      if (resolvedType !== "steel" && prev.length !== undefined) next.length = prev.length;
      if (prev.duct_length !== undefined) next.duct_length = prev.duct_length;
      if (prev.pipe_length !== undefined) next.pipe_length = prev.pipe_length;
      if (resolvedType === "steel") next.element_type = typeKey;
      if (resolvedType === "electrical" && configData?.option_groups?.length) {
        configData.option_groups.forEach((g) => { delete next[g.group_key]; });
      }
      return next;
    });

    if (resolvedType === "steel") {
      setAssemblyRows([]);
      // Carry over geo values within the same geometry group (use selectedTypeKey as prev type)
      const prevType = selectedTypeKey;
      const prevGeo = STEEL_GEO_CARRYOVER[prevType] || {};
      const nextGeo = STEEL_GEO_CARRYOVER[typeKey] || {};

      // If returning to original element type, restore from item.steel_categories
      const isOriginalType = typeKey === item.element_type && item.steel_categories;
      if (isOriginalType) {
        const sc = item.steel_categories;
        const cats = {}, catData = {}, rebarEnt = {};
        Object.entries(sc).forEach(([ck, cv]) => {
          if (!cv) return;
          cats[ck] = true;
          if (ck === "rebar") {
            if (Array.isArray(cv.rebar_entries)) {
              cv.rebar_entries.forEach((e) => {
                if (!e.rebar_type) return;
                rebarEnt[e.rebar_type] = {
                  checked: true,
                  productId: resolveProductKey(e.product),
                  bar_count: String(e.bar_count ?? ""),
                  bars_per_column: String(e.bars_per_column ?? ""),
                  lap_length: String(e.lap_length ?? ""),
                  spacing: String(e.spacing ?? ""),
                  bar_length: String(e.bar_length ?? ""),
                };
              });
              catData.rebar = {};
            } else {
              catData.rebar = { spacing: String(cv.spacing ?? ""), direction: cv.direction || "", bar_length: String(cv.bar_length ?? ""), productId: resolveProductKey(cv.product) };
            }
          } else {
            catData[ck] = { productId: resolveProductKey(cv.product), quantity: String(cv.quantity ?? cv.quantity_per_column ?? ""), length: String(cv.length ?? ""), section_type: cv.section_type || "", length_per_member: String(cv.length_per_member ?? ""), spacing: String(cv.spacing ?? "") };
          }
        });
        setSteelCats(cats);
        setSteelCatData(catData);
        setSteelRebarEntries(rebarEnt);
      } else {
        setSteelCats({});
        setSteelCatData({});
        setSteelRebarEntries({});
      }
      setSteelConfigData(null);
      steelConfigFetchKeyRef.current = ""; // reset so the config effect re-fetches for the new type

      // Carry over geo values from previous type to new type (applied to attributes)
      if (Object.keys(prevGeo).length > 0 && !isOriginalType) {
        setAttributes((prev) => {
          const carried = {};
          Object.entries(prevGeo).forEach(([role, prevField]) => {
            if (nextGeo[role]) {
              const val = prev[prevField];
              if (val !== undefined && val !== "") carried[nextGeo[role]] = val;
            }
          });
          return Object.keys(carried).length > 0 ? { ...prev, ...carried } : prev;
        });
      }
    }

    if (resolvedType === "concrete") {
      // Mark fetch key so the auto-load effect skips (handleTypeChange loads config itself)
      concreteConfigFetchKeyRef.current = `${item.takeoff_id}::${typeKey}`;
      setAssemblyRows([]);
      const selectedType = types.find((t) => t.type_key === typeKey);
      if (selectedType?.id && item.takeoff_id) {
        setIsLoadingConfig(true);
        const org = localStorage.getItem("organization_uuid") ?? "";
        const prj = localStorage.getItem("project_uuid") ?? "";
        getConfigV2({ organization_uuid: org, project_uuid: prj, takeoff_id: item.takeoff_id, type_id: selectedType.id, device_info: getDeviceInfo() })
          .then((cfg) => {
            if (cfg?.data) {
              const parsed = parseConfig(cfg.data, selectedType);
              setConfigData(parsed);
              setAttributes((prev) => applyConfigToAttrs(prev, parsed, resolvedType, mode, itemRef, typeKey));
              const defaultProductId = cfg.data.product_defaults?.[0]?.product_id;
              if (defaultProductId) setAttributes((prev) => ({ ...prev, product_id: String(defaultProductId) }));
            }
          })
          .catch(() => {})
          .finally(() => setIsLoadingConfig(false));
      }
    }
  }, [resolvedType, mode, configData, types, item.takeoff_id]); 

  // ── Steel category/rebar product change → clear assembly ─────────────────
  const setSteelCatDataAndClear = useCallback((updater) => {
    setSteelCatData((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      const changed = Object.keys(next).some((k) => next[k]?.productId !== prev[k]?.productId);
      if (changed) {
        const hadRows = assemblyRowsLenRef.current > 0;
        if (hadRows) {
          setAssemblyRows([]);
          setProductChangedNote(true);
          generalScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }
      return next;
    });
  }, []);

  const setSteelRebarEntriesAndClear = useCallback((updater) => {
    setSteelRebarEntries((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      const changed = Object.keys(next).some((k) => next[k]?.productId !== prev[k]?.productId);
      if (changed) {
        const hadRows = assemblyRowsLenRef.current > 0;
        if (hadRows) {
          setAssemblyRows([]);
          setProductChangedNote(true);
          generalScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }
      return next;
    });
  }, []);

  // ── handleAttrChange ──────────────────────────────────────────────────────
  const handleAttrChange = useCallback((k, v) => {
    if (k === "product_id") setAssemblyRows([]);
    setAttributes((prev) => {
      const next = { ...prev, [k]: v };
      if (k === "section_type" && configData) {
        const sectionSizeSpec = configData.spec_groups?.find((g) => g.group_key === "section_size");
        if (sectionSizeSpec?.values?.length > 0) {
          const filtered = sectionSizeSpec.values.filter((sv) => sv.parent_option_key === v);
          const candidates = filtered.length > 0 ? filtered : sectionSizeSpec.values;
          next.section_size = pickDefault(candidates, (sv) => sv.value_key) || candidates[0].value_key;
        }
      }
      return next;
    });
  }, [configData]);

  // ── Validation ────────────────────────────────────────────────────────────
  const validateForm = useCallback(
    () => validateTakeoffForm({ resolvedType, selectedTypeKey, attributes, configKeySet, productList, types, mode, steelCats, steelCatData, steelRebarEntries }),
    [resolvedType, selectedTypeKey, attributes, configKeySet, productList, types, mode, steelCats, steelCatData, steelRebarEntries]
  );

  useEffect(() => {
    const { errors } = validateForm();
    setFieldErrors(errors);
  }, [validateForm]);

  const isFormValid = Object.keys(fieldErrors).length === 0;
  const isReadOnly = isSaving || isMarkAsCompleted;
  // ── handleSave ────────────────────────────────────────────────────────────
  const handleSave = useCallback(async () => {
    const attributes = attributesRef.current; // always fresh — refs bypass stale closures
    if (!documentId) { showToast("error", "Missing document ID."); return; }
    const { isValid } = validateForm();
    if (!isValid) return;
    setIsSaving(true);
    try {
      const cleanAttrs = {};
      Object.entries(attributes).forEach(([k, v]) => {
        if (EXCLUDED_FIELDS.has(k) || k.startsWith("__") || INTERNAL_FIELDS.has(k)) return;
        if (k === "gauge") return;
        if (v !== null && typeof v === 'object') return;
        const s = String(v ?? "").trim();
        if (s === "") return;
        if (s === "none") { cleanAttrs[k] = "none"; return; }
        const num = parseFloat(s);
        if (!isNaN(num) && num < 0) return;
        cleanAttrs[k] = (!configKeySet.has(k) && !isNaN(s)) ? Number(s) : String(v);
      });

      if (resolvedType === "electrical") {
        Object.keys(cleanAttrs).forEach((k) => delete cleanAttrs[k]);
        const elecSpecDefault = configData?.spec_groups?.[0]?.values?.[0]?.value_key || configData?.option_groups?.[0]?.values?.[0]?.option_key || "";
        const elecValidKeys = new Set([...(configData?.spec_groups?.flatMap((g) => g.values.map((v) => v.value_key)) || []), ...(configData?.option_groups?.flatMap((g) => g.values.map((v) => v.option_key)) || [])]);
        const elecCurrent = String(attributes.component_specification ?? "").trim();
        const spec = (elecCurrent && elecValidKeys.has(elecCurrent)) ? elecCurrent : elecSpecDefault;
        if (spec) cleanAttrs.component_specification = spec;
        const qty = String(attributes.quantity ?? item?.attributes?.quantity ?? item?.quantity ?? "").trim();
        if (qty !== "" && !isNaN(qty) && parseFloat(qty) >= 0) cleanAttrs.quantity = Number(qty);
        {
          const selProd = productList.find((p) => String(p.pk_id ?? p.product_id ?? "") === String(attributes.product_id ?? "").trim());
          if (selProd?.unit_name?.toLowerCase() === "lf") {
            const wl = String(attributes.wire_length ?? item?.attributes?.wire_length ?? item?.wire_length ?? "").trim();
            if (wl !== "" && !isNaN(wl) && parseFloat(wl) >= 0) cleanAttrs.wire_length = Number(wl);
          } else {
            delete cleanAttrs.wire_length;
          }
        }
      } else if (resolvedType === "hvac") {
        Object.keys(cleanAttrs).forEach((k) => delete cleanAttrs[k]);
        const hvacSpecDefault = configData?.spec_groups?.[0]?.values?.[0]?.value_key || configData?.option_groups?.find((g) => g.group_key !== "duct_shape")?.values?.[0]?.option_key || "";
        const hvacValidKeys = new Set([...(configData?.spec_groups?.flatMap((g) => g.values.map((v) => v.value_key)) || []), ...(configData?.option_groups?.filter((g) => g.group_key !== "duct_shape").flatMap((g) => g.values.map((v) => v.option_key)) || [])]);
        const hvacCurrent = String(attributes.component_specification ?? "").trim();
        const spec = (hvacCurrent && hvacValidKeys.has(hvacCurrent)) ? hvacCurrent : hvacSpecDefault;
        if (spec) cleanAttrs.component_specification = spec;
        const ductShape = String(attributes.duct_shape ?? item?.attributes?.duct_shape ?? "").trim();
        if (ductShape) cleanAttrs.duct_shape = ductShape;
        const qty = String(attributes.quantity ?? item?.attributes?.quantity ?? item?.quantity ?? "").trim();
        if (qty !== "" && !isNaN(qty) && parseFloat(qty) >= 0) cleanAttrs.quantity = Number(qty);
        {
          const selProd = productList.find((p) => String(p.pk_id ?? p.product_id ?? "") === String(attributes.product_id ?? "").trim());
          if (selProd?.unit_name?.toLowerCase() === "lf") {
            const dl = String(attributes.duct_length ?? item?.attributes?.duct_length ?? item?.duct_length ?? "").trim();
            if (dl !== "" && !isNaN(dl) && parseFloat(dl) >= 0) cleanAttrs.duct_length = Number(dl);
          }
        }
      } else if (resolvedType === "mechanical") {
        Object.keys(cleanAttrs).forEach((k) => delete cleanAttrs[k]);
        const mechSpecDefault = configData?.spec_groups?.[0]?.values?.[0]?.value_key || configData?.option_groups?.[0]?.values?.[0]?.option_key || "";
        const mechValidKeys = new Set([...(configData?.spec_groups?.flatMap((g) => g.values.map((v) => v.value_key)) || []), ...(configData?.option_groups?.flatMap((g) => g.values.map((v) => v.option_key)) || [])]);
        const mechCurrent = String(attributes.component_specification ?? "").trim();
        const spec = (mechCurrent && mechValidKeys.has(mechCurrent)) ? mechCurrent : mechSpecDefault;
        if (spec) cleanAttrs.component_specification = spec;
        const qty = String(attributes.quantity ?? item?.attributes?.quantity ?? item?.quantity ?? "").trim();
        if (qty !== "" && !isNaN(qty) && parseFloat(qty) >= 0) cleanAttrs.quantity = Number(qty);
      } else if (resolvedType === "plumbing") {
        delete cleanAttrs.diameter;
        {
          const selProd = productList.find((p) => String(p.pk_id ?? p.product_id ?? "") === String(attributes.product_id ?? "").trim());
          if (selProd?.unit_name?.toLowerCase() === "lf") {
            const pl = String(attributes.pipe_length ?? item?.attributes?.pipe_length ?? item?.pipe_length ?? "").trim();
            if (pl !== "" && !isNaN(pl) && parseFloat(pl) >= 0) cleanAttrs.pipe_length = Number(pl);
          } else {
            delete cleanAttrs.pipe_length;
          }
        }
      } else if (resolvedType === "masonry") {
        delete cleanAttrs.unit_width;
        if (selectedTypeKey && !cleanAttrs.masonry_type) cleanAttrs.masonry_type = selectedTypeKey;
      } else {
        delete cleanAttrs.component_specification;
      }

      if (resolvedType === "concrete" && selectedTypeKey) {
        Object.keys(cleanAttrs).forEach((k) => delete cleanAttrs[k]);
        const geoVal = (geoKey) => { const raw = attributes[`concrete_geo_${geoKey}`]; return raw !== undefined && raw !== "" ? String(raw) : undefined; };
        const numVal = (key) => { const v = attributes[key]; const n = parseFloat(v); return !isNaN(n) && n >= 0 ? n : undefined; };
        switch (resolveConcreteTypeKey(selectedTypeKey)) {
          case "slab": { const t = geoVal("thickness"); if (t) cleanAttrs.slab_thickness = t; const a = numVal("slab_area"); if (a !== undefined) cleanAttrs.slab_area = a; break; }
          case "beam": { const d = geoVal("depth"); const w = geoVal("width"); if (d) cleanAttrs.beam_depth = d; if (w) cleanAttrs.beam_width = w; const l = numVal("beam_length"); if (l !== undefined) cleanAttrs.beam_length = l; break; }
          case "column_pillar": { const d = geoVal("depth"); const w = geoVal("width"); if (d) cleanAttrs.column_depth = d; if (w) cleanAttrs.column_width = w; const h = numVal("column_height"); if (h !== undefined) cleanAttrs.column_height = h; const c = numVal("number_of_columns"); if (c !== undefined) cleanAttrs.number_of_columns = c; break; }
          case "wall": { const t = geoVal("thickness"); if (t) cleanAttrs.wall_thickness = t; const l = numVal("wall_length"); if (l !== undefined) cleanAttrs.wall_length = l; const h = numVal("wall_height"); if (h !== undefined) cleanAttrs.wall_height = h; break; }
          case "footing": { const d = geoVal("depth"); if (d) cleanAttrs.footing_depth = d; const fl = numVal("footing_length"); if (fl !== undefined) cleanAttrs.footing_length = fl; const fw = numVal("footing_width"); if (fw !== undefined) cleanAttrs.footing_width = fw; const ft = String(attributes.footing_type ?? "").trim(); if (ft) cleanAttrs.footing_type = ft; break; }
          case "stairs_landings": { const st = String(attributes.stair_type ?? "").trim(); if (st) cleanAttrs.stair_type = st; const sa = numVal("stair_area"); if (sa !== undefined) cleanAttrs.stair_area = sa;["flight_length", "flight_width", "riser_height", "number_of_steps", "landing_length", "landing_width"].forEach((k) => { const v = numVal(k); if (v !== undefined) cleanAttrs[k] = v; }); break; }
         case "ramp": { const thick = geoVal("thickness") || String(attributes.ramp_thickness ?? "").trim(); if (thick) cleanAttrs.ramp_thickness = thick; const rawSlope = String(attributes.ramp_slope ?? "").trim(); if (rawSlope) cleanAttrs.ramp_slope = rawSlope.replace(":", "_"); const a = numVal("slab_area"); if (a !== undefined) cleanAttrs.ramp_area = a; break; }
          default: break;
        }
      }

      // Always preserve product_id selection regardless of type-specific cleanup
      const productId = String(attributes.product_id ?? "").trim();
      if (productId) cleanAttrs.product_id = productId;

      // Shared steel payload builder — used by both add and edit
      const buildSteelCatsParts = () => {
        const et = selectedTypeKey || '';
        const geoAttrs = {};
        (STEEL_GEO_FIELDS[et] || []).forEach(f => {
          const v = parseFloat(attributes[f.key]);
          if (!isNaN(v) && v > 0) geoAttrs[f.key] = v;
        });
        const isSimple = STEEL_SIMPLE_REBAR_ELEMENTS.has(et);
        const complexTypes = !isSimple ? (REBAR_TYPES_BY_ELEMENT[et] || null) : null;
        const cats = [];
        Object.keys(steelCats).filter(k => steelCats[k]).forEach(catKey => {
          const cd = steelCatData[catKey] || {};
          if (catKey === 'rebar') {
            if (complexTypes) {
              cats.push({
                category_key: 'rebar',
                rebar_entries: complexTypes.filter(rt => steelRebarEntries[rt]?.checked).map(rt => {
                  const entry = steelRebarEntries[rt] || {};
                  const ef = REBAR_ENTRY_FIELDS_OVERRIDE[et]?.[rt] || REBAR_ENTRY_FIELDS[rt] || [];
                  const ed = { rebar_type: rt };
                  if (entry.productId) ed.product_id = entry.productId;
                  const ea = {};
                  ef.forEach(f => { const v = entry[f.key]; if (v !== undefined && v !== '') ea[f.key] = f.inputType === 'integer' ? parseInt(v, 10) : Number(v); });
                  if (Object.keys(ea).length > 0) ed.attributes = ea;
                  return ed;
                }),
              });
            } else {
              const re = { category_key: 'rebar' };
              if (cd.productId) re.product_id = cd.productId;
              const ra = {};
              if (cd.spacing) ra.spacing = Number(cd.spacing);
              if (cd.direction) ra.direction = cd.direction;
              if (cd.bar_length) ra.bar_length = Number(cd.bar_length);
              if (Object.keys(ra).length > 0) re.attributes = ra;
              cats.push(re);
            }
          } else {
            const ce = { category_key: catKey };
            if (cd.productId) ce.product_id = cd.productId;
            const ca = {};
            if (cd.quantity) ca.quantity = Number(cd.quantity);
            if (cd.length) ca.length = Number(cd.length);
            if (cd.section_type) ca.section_type = cd.section_type;
            if (cd.length_per_member) ca.length_per_member = Number(cd.length_per_member);
            if (cd.spacing) ca.spacing = Number(cd.spacing);
            if (catKey === 'structural_steel') { const sz = String(attributes.section_size ?? '').trim(); if (sz) ca.section_size = sz; }
            if (catKey === 'purlin_joist') { const ps = String(attributes.purlin_size ?? '').trim(); if (ps) ca.purlin_size = ps; }
            if (Object.keys(ca).length > 0) ce.attributes = ca;
            cats.push(ce);
          }
        });
        return { elemType: et, geoAttrs, cats };
      };

      if (mode === "add") {
        // Build accessories from assembly rows
        const accessories = assemblyRows
          .filter(r => r.productId)
          .map(r => {
            const prod = productList.find(p => p.product_type === 'Accessory' && `${p.product_code} ${p.product_name}` === r.productId);
            const pid = prod ? String(prod.pk_id ?? prod.product_id ?? '') : '';
            const qty = Number(r.quantity);
            return pid ? { product_id: pid, quantity: isNaN(qty) || qty < 1 ? 1 : qty } : null;
          })
          .filter(Boolean);

        const payload = {
          organization_uuid: localStorage.getItem("organization_uuid") || "",
          project_uuid: localStorage.getItem("project_uuid") || "",
          document_id: documentId,
          page_number: pageNumber,
          takeoff_id: item.takeoff_id ?? null,
          takeoff_name: type,
          attributes: cleanAttrs,
          device_info: getDeviceInfo(),
        };

        if (resolvedType === 'steel') {
          const { elemType, geoAttrs, cats } = buildSteelCatsParts();
          Object.keys(cleanAttrs).forEach(k => delete cleanAttrs[k]);
          Object.assign(cleanAttrs, geoAttrs);
          payload.element_type = elemType;
          if (cats.length > 0) payload.steel_categories = cats;
        } else if (resolvedType === 'concrete') {
          delete cleanAttrs.product_id;
          if (selectedTypeKey) payload.element_type = selectedTypeKey;
          const productId = String(attributes.product_id ?? '').trim();
          if (productId) payload.primary_product_id = productId;
        } else {
          const productId = String(attributes.product_id ?? '').trim();
          delete cleanAttrs.product_id;
          if (productId) payload.primary_product_id = productId;
        }

        if (accessories.length > 0) payload.accessories = accessories;
        if (applyMode !== 'this') {
          payload.apply_scope = applyMode;
          if (applyMode === 'selected') payload.selected_item_ids = [...selectedItems];
        }

        if (generalApplyMode !== 'this') {
          payload.general_apply_scope = generalApplyMode;
          if (generalApplyMode === 'selected') payload.general_selected_item_ids = [...generalSelectedItems];
        }

        // console.log('[ADD payload]', JSON.stringify(payload, null, 2));
        const res = await addLineItem(payload);
        if (res?.valid) {
          if (res.message) showToast("success", res.message);
          const returnedData = res.data ?? res;
          if (returnedData?.name) {
            const KEY_TO_LABEL = { door_window: "Door & Windows", flooring: "Flooring", roofing: "Roofing" };
            returnedData.name = returnedData.name.replace(/^([a-z][a-z0-9]*(?:_[a-z0-9]+)*)/i, (match) => KEY_TO_LABEL[match.toLowerCase()] ?? match.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()));
          }
          onAdd?.(returnedData);
        } else { if (res?.message) showToast("error", res.message); }
      } else {
        const editItemId = item.item_id ?? itemPkId;
        if (!editItemId) { showToast("error", "Missing item ID."); setIsSaving(false); return; }

        const editAccessories = assemblyRows
          .filter(r => r.productId)
          .map(r => {
            const prod = productList.find(p => p.product_type === 'Accessory' && `${p.product_code} ${p.product_name}` === r.productId);
            const pid = prod ? String(prod.pk_id ?? prod.product_id ?? '') : '';
            const qty = Number(r.quantity);
            return pid ? { product_id: pid, quantity: isNaN(qty) || qty < 1 ? 1 : qty } : null;
          })
          .filter(Boolean);

        const payload = {
          organization_uuid: localStorage.getItem("organization_uuid") || "",
          project_uuid: localStorage.getItem("project_uuid") || "",
          document_id: documentId,
          item_id: editItemId,
          takeoff_name: item.takeoff_name,
          attributes: cleanAttrs,
          name: itemName,
          device_info: getDeviceInfo(),
        };

        if (resolvedType === 'steel') {
          const { elemType, geoAttrs, cats } = buildSteelCatsParts();
          Object.keys(cleanAttrs).forEach(k => delete cleanAttrs[k]);
          Object.assign(cleanAttrs, geoAttrs);
          payload.element_type = elemType;
          if (cats.length > 0) payload.steel_categories = cats;
        } else if (resolvedType === 'concrete') {
          delete cleanAttrs.product_id;
          if (selectedTypeKey) payload.element_type = selectedTypeKey;
          const concrProdId = String(attributes.product_id ?? '').trim();
          if (concrProdId) payload.primary_product_id = concrProdId;
        } else {
          const editProdId = String(attributes.product_id ?? '').trim();
          delete cleanAttrs.product_id;
          if (editProdId) payload.primary_product_id = editProdId;
        }

        if (editAccessories.length > 0) payload.accessories = editAccessories;

        if (applyMode !== 'this') {
          payload.apply_scope = applyMode;
          if (applyMode === 'selected') payload.selected_item_ids = [...selectedItems];
        }

        if (generalApplyMode !== 'this') {
          payload.general_apply_scope = generalApplyMode;
          if (generalApplyMode === 'selected') payload.general_selected_item_ids = [...generalSelectedItems];
        }

        // console.log('[EDIT payload]', JSON.stringify(payload, null, 2));
        const res = await updateAiItem(payload);
        if (res?.valid) {
          if (res.message) showToast("success", res.message);
          onUpdate?.({ id: item.id, pk_id: item.pk_id ?? item.item_id, takeoff_id: item.takeoff_id, takeoff_name: item.takeoff_name, page_number: item.page_number, color: item.color, line_order: item.line_order, takeoff_order: item.takeoff_order, ...cleanAttrs, type_key: selectedTypeKey, name: itemName, display_name: undefined, __groupKey: resolvedType });
        } else { if (res?.message) showToast("error", res.message); }
      }
    } catch (e) {
      console.error("SAVE ERROR", e);
      showToast("error", e.message || "Request failed");
    } finally { setIsSaving(false); }
  }, [documentId, itemPkId, item, selectedTypeKey, attributes, configKeySet, configData, onUpdate, onAdd, onClose, itemName, mode, type, resolvedType, pageNumber, validateForm, applyMode, selectedItems, generalApplyMode, generalSelectedItems, assemblyRows, steelCats, steelCatData, steelRebarEntries, productList]);


  // Edit mode: filter steel types to the geometry group of the current element type.
  const steelInitElemType = resolvedType === 'steel' && mode !== 'add' ? (item.element_type || selectedTypeKey || '') : '';
  const steelGeoFilter = steelInitElemType
    ? STEEL_AREA_TYPES.includes(steelInitElemType) ? STEEL_AREA_TYPES
      : STEEL_WALL_TYPES.includes(steelInitElemType) ? STEEL_WALL_TYPES
      : STEEL_SYMBOL_TYPES.includes(steelInitElemType) ? STEEL_SYMBOL_TYPES
      : null
    : null;
  // Edit mode: filter concrete types to the group of the current element type.
  const concreteInitElemType = resolvedType === 'concrete' && mode !== 'add' ? (item.element_type || selectedTypeKey || '') : '';
  const concreteGeoFilter = concreteInitElemType
    ? CONCRETE_AREA_TYPES.includes(concreteInitElemType) ? CONCRETE_AREA_TYPES
      : CONCRETE_WALL_TYPES.includes(concreteInitElemType) ? CONCRETE_WALL_TYPES
      : CONCRETE_SYMBOL_TYPES.includes(concreteInitElemType) ? CONCRETE_SYMBOL_TYPES
      : null
    : null;
  // In edit mode types array may be empty for steel — fall back to STEEL_ALL_TYPE_OPTS
  const rawTypesList = (resolvedType === 'steel' && types.length === 0)
    ? STEEL_ALL_TYPE_OPTS.map((o) => ({ type_key: o.key, type_name: o.label }))
    : types;
  const typeOpts = markSingleDefault(rawTypesList
    .filter((t) => {
      if (resolvedType === 'steel' && steelGeoFilter) return steelGeoFilter.includes(t.type_key);
      if (resolvedType === 'concrete' && concreteGeoFilter) return concreteGeoFilter.includes(t.type_key);
      return true;
    })
    .map((t) => ({
      key: t.type_key,
      label: (t.type_name || normalizeLabel(t.type_key)).replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      is_default: !!t.is_default,
    })));
  const typeLabel = getTypeLabel(resolvedType);
  void isInitialising;

  // ── Product lists filtered by trade and product_type ─────────────────────
  const tradeName = TRADE_FROM_TYPE[resolvedType] || "";
  const isConcreteOrSteelType = resolvedType === "concrete" || resolvedType === "steel";
  // Normalise the selected type key to the product element value (API type_keys
  // like "column_pillar" / "stairs_landings" differ from product element values).
  const productElementKey = (resolvedType === "concrete" && CONCRETE_ELEMENT_PRODUCT_KEY[selectedTypeKey])
    ? CONCRETE_ELEMENT_PRODUCT_KEY[selectedTypeKey]
    : selectedTypeKey;
  // ID of the currently selected element type — used to match element_type_ids
  // on accessory products (assembly tab filtering).
  const selectedTypeObj = types.find((t) => t.type_key === selectedTypeKey);
  const selectedTypeId = selectedTypeObj?.id || null;
  const primaryProducts = productList.filter((p) => {
    if (p.product_type !== "Primary") return false;
    if (p.trade?.toLowerCase() !== tradeName.toLowerCase()) return false;
    if (isConcreteOrSteelType && productElementKey) {
      return !p.element || p.element?.toLowerCase() === productElementKey.toLowerCase();
    }
    return true;
  });
  const accessoryProducts = productList.filter((p) => {
    if (p.product_type !== "Accessory") return false;
    if (p.trade?.toLowerCase() !== tradeName.toLowerCase()) return false;
    if (resolvedType === "concrete" && selectedTypeId) {
      const ids = p.element_type_ids;
      if (Array.isArray(ids) && ids.length > 0) return ids.includes(selectedTypeId);
      return true; // products with no element_type_ids are generic — show for all
    }
    if (resolvedType === "steel") {
      // Accessory products for steel: filter by element type + checked steel categories
      const catGrpVals = steelConfigData?.option_groups?.find((g) => g.group_key === 'steel_category')?.values || [];
      const elemType = selectedTypeKey || '';
      if (elemType && p.element && p.element.toLowerCase() !== elemType.toLowerCase()) return false;
      const prodCatKey = catGrpVals.find((v) => v.id === p.steel_category_id)?.option_key;
      if (prodCatKey && !steelCats[prodCatKey]) return false;
      return true;
    }
    return true;
  });
  const asmProductOptions = [...accessoryProducts]
    .sort((a, b) => (a.product_code || '').localeCompare(b.product_code || '', undefined, { numeric: true, sensitivity: 'base' }))
    .map((p) => `${p.product_code} ${p.product_name}`);
  const getAsmProductUnit = (label) =>
    accessoryProducts.find((p) => `${p.product_code} ${p.product_name}` === label)?.unit_name || "ea";

  // Seed product_id from first primaryProduct when current selection is absent or invalid.
  // Runs in both add and edit modes so type changes never leave the dropdown on "Select Product".
  useEffect(() => {
    if (primaryProducts.length > 0) {
      const currentId = String(attributes.product_id ?? "").trim();
      const validIds = new Set(primaryProducts.map((p) => String(p.pk_id ?? p.product_id ?? "")));
      if (!currentId || !validIds.has(currentId)) {
        const firstKey = String(primaryProducts[0].pk_id ?? primaryProducts[0].product_id ?? "");
        if (firstKey) setAttributes((prev) => ({ ...prev, product_id: firstKey }));
      }
    }
  }, [selectedTypeKey, primaryProducts.length]);

  return (
    <div className="tw-bg-white tw-text-foreground tw-flex tw-flex-col" style={{ minHeight: 0, borderTopLeftRadius: 16, borderTopRightRadius: 16 }}>
      {/* ── Header ── */}
      <PanelHeader
        nameDraft={nameDraft}
        itemName={itemName}
        categoryLabel={categoryLabel}
        isSaving={isSaving}
        safeClose={safeClose}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        resolvedType={resolvedType}
        steelCats={steelCats}
        isAddMode={isAddMode}
        setNameDraft={setNameDraft}
        setItemName={setItemName}
        itemColor={item?.color?.stroke || (typeof item?.color === 'string' ? item.color : null)}
      />

      {/* ── General tab ── */}
      {activeTab === 'general' && (
        <div ref={generalScrollRef} className="tw-flex-1 tw-overflow-y-auto tw-px-6 tw-py-5 custom-scroll" style={{ minHeight: 0 }}>
          <div className="tw-space-y-4">
            {(types.length > 0 || resolvedType === 'steel') && (
              <div className="tw-space-y-1.5">
                <FieldLabel>{typeLabel}</FieldLabel>
                {isLoadingTypes ? (
                  <div className="tw-h-10 tw-w-full tw-rounded-md tw-bg-gray-100 tw-animate-pulse" />
                ) : (
                  <CustomSelect
                    id="__type_select__"
                    options={typeOpts}
                    placeholder={`Select ${typeLabel}`}
                    value={selectedTypeKey}
                    onChange={handleTypeChange}
                    openSelect={openSelect}
                    setOpenSelect={setOpenSelect}
                    accentColor={accentColor}
                    disabled={isReadOnly}
                    isAddMode={isAddMode}
                    searchThreshold={(resolvedType === 'concrete' || resolvedType === 'steel') ? 9999 : 6}
                  />
                )}
              </div>
            )}
            <GeneralFields
              resolvedType={resolvedType}
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
              configKeySet={configKeySet}
              productList={productList}
              types={types}
              steelCats={steelCats}
              setSteelCats={setSteelCats}
              steelCatData={steelCatData}
              setSteelCatData={setSteelCatDataAndClear}
              steelRebarEntries={steelRebarEntries}
              setSteelRebarEntries={setSteelRebarEntriesAndClear}
              steelConfigData={steelConfigData}
              steelConfigDataRef={steelConfigDataRef}
              generalScrollRef={generalScrollRef}
              showProductNote={productChangedNote}
            />
            {resolvedType !== 'steel' && (primaryProducts.length > 0 || (!isAddMode && item.__extractedProduct)) && (
              <div className="tw-space-y-1.5">
                <FieldLabel>Product</FieldLabel>
                <CustomSelect
                  id="__product_select__"
                  options={(() => {
                    const opts = primaryProducts.map((p) => ({
                      key: String(p.pk_id ?? p.product_id ?? `${p.product_code}_${p.product_name}`),
                      label: [p.product_code, p.product_name].filter(Boolean).join(" "),
                    }));
                    if (!isAddMode && item.__extractedProduct) {
                      const extId = String(item.__extractedProduct.id ?? "");
                      if (extId && !opts.some((o) => o.key === extId)) {
                        opts.unshift({ key: extId, label: [item.__extractedProduct.code, item.__extractedProduct.name].filter(Boolean).join(" ") });
                      }
                    }
                    return opts;
                  })()}
                  placeholder="Select Product"
                  value={String(attributes.product_id ?? "")}
                  onChange={(v) => {
                    if (assemblyRows.length > 0) setProductChangedNote(true);
                    handleAttrChange("product_id", v);
                  }}
                  openSelect={openSelect}
                  setOpenSelect={setOpenSelect}
                  accentColor={accentColor}
                  disabled={isReadOnly}
                  isAddMode={isAddMode}
                />
                {productChangedNote && (
                  <div className="tw-flex tw-items-start tw-gap-2.5 tw-bg-amber-50 tw-border tw-border-amber-200 tw-rounded-lg tw-px-3 tw-py-2.5">
                    <Info size={14} className="tw-text-amber-500 tw-flex-shrink-0 tw-mt-0.5" />
                    <p className="tw-m-0 tw-text-[12.5px] tw-leading-[1.55] tw-text-amber-800">
                      <span className="tw-font-semibold">Note:&nbsp;</span>
                      Changing the product will remove the accessory items already selected for this line item.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── General Advanced Options ── */}
          <GeneralAdvancedOptions
            resolvedType={resolvedType}
            nameDraft={nameDraft}
            itemName={itemName}
            generalAdvancedOpen={generalAdvancedOpen}
            setGeneralAdvancedOpen={setGeneralAdvancedOpen}
            generalApplyMode={generalApplyMode}
            setGeneralApplyMode={setGeneralApplyMode}
            generalItemsDropOpen={generalItemsDropOpen}
            setGeneralItemsDropOpen={setGeneralItemsDropOpen}
            generalItemSearch={generalItemSearch}
            setGeneralItemSearch={setGeneralItemSearch}
            generalItemsBtnRef={generalItemsBtnRef}
            generalItemsListRef={generalItemsListRef}
            generalSelectedItems={generalSelectedItems}
            setGeneralSelectedItems={setGeneralSelectedItems}
            generalTargets={generalTargets}
            isLoadingGeneralTargets={isLoadingGeneralTargets}
          />
        </div>
      )}

      {/* ── Assembly tab ── */}
      {activeTab === 'assembly' && (
        <div className="tw-flex-1 tw-overflow-y-auto tw-px-6 tw-py-5 custom-scroll" style={{ minHeight: 0 }}>
          <AssemblyTab
            assemblyRows={assemblyRows}
            setAssemblyRows={setAssemblyRows}
            asmLidRef={asmLidRef}
            asmScrollRef={asmScrollRef}
            asmProductOptions={asmProductOptions}
            getAsmProductUnit={getAsmProductUnit}
            nameDraft={nameDraft}
            itemName={itemName}
            advancedOpen={advancedOpen}
            setAdvancedOpen={setAdvancedOpen}
            applyMode={applyMode}
            setApplyMode={setApplyMode}
            selectedItems={selectedItems}
            setSelectedItems={setSelectedItems}
            itemsDropOpen={itemsDropOpen}
            setItemsDropOpen={setItemsDropOpen}
            itemSearch={itemSearch}
            setItemSearch={setItemSearch}
            itemsBtnRef={itemsBtnRef}
            itemsListRef={itemsListRef}
            itemsDropStyle={itemsDropStyle}
            isLoadingTargets={isLoadingTargets}
            assemblyTargets={assemblyTargets}
            isAddMode={isAddMode}
          />
        </div>
      )}

      <PanelFooter
        activeTab={activeTab}
        isSaving={isSaving}
        isLoadingTypes={isLoadingTypes}
        isLoadingConfig={isLoadingConfig}
        isFormValid={isFormValid}
        isMarkAsCompleted={isMarkAsCompleted}
        accentColor={accentColor}
        mode={mode}
        safeClose={safeClose}
        handleSave={handleSave}
      />
    </div>
  );
});

TakeoffDetailsPanel.displayName = "TakeoffDetailsPanel";
export default TakeoffDetailsPanel;