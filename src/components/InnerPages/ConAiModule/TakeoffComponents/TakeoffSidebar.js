import React, { useState, useMemo, useRef, useEffect, useCallback, memo } from "react";
import {
  Search, ChevronDown, Eye, EyeOff,
  Folder, Check, X, PanelLeft, Plus, Wand2,
  Loader2, GripVertical, TriangleAlert,
  HardHat,
} from "lucide-react";
import {
  UpdateTakeoffOrder,
  UpdateLineitemOrder,
  getConfigV2,
  getTypesV2,
} from "../../../../services/techus-services";
import { getDeviceInfo } from "../../../../utils/getDeviceInfo";
import { normalizeItemName } from "../../../../utils/textUtils";
import FullPageLoader from "../../../../genriccomponents/loaders/FullPageLoader";
import TakeoffDetailsPanel from "./TakeoffDetailsPanel";
import { useTakeoffPermissions } from "./Usetakeoffpermissions";

const SCROLLBAR_STYLE = `
  .custom-scroll::-webkit-scrollbar { width: 6px; height: 6px; }
  .custom-scroll::-webkit-scrollbar-track { background: transparent; }
  .custom-scroll::-webkit-scrollbar-thumb { background-color: #dee9ff; border-radius: 99px; }
  .custom-scroll { scrollbar-color: #dee9ff transparent; scrollbar-width: thin; }
`;
const _mousePos = { x: 0, y: 0 };
if (typeof window !== "undefined") {
  window.addEventListener("mousemove", (e) => {
    _mousePos.x = e.clientX;
    _mousePos.y = e.clientY;
  }, { passive: true });
}
// ─── Sidebar Tooltip ──────────────────────────────────────────────────────────
const SbTooltip = ({ label, position = "left" }) => {
  const base = {
    position: "absolute", zIndex: 9999, pointerEvents: "none",
    whiteSpace: "nowrap", background: "#fff", color: "#1e1d1d",
    fontSize: 13, fontWeight: 400, padding: "5px 12px", borderRadius: 5,
    border: "1px solid #E5E7EB",
    boxShadow: "0 10px 18px rgba(17,24,39,0.12), 0 2px 6px rgba(17,24,39,0.08)",
  };
  if (position === "right")
    return <div style={{ ...base, left: "calc(100% + 8px)", top: "50%", transform: "translateY(-50%)" }}>{label}</div>;
  if (position === "top")
    return <div style={{ ...base, bottom: "calc(100% + 8px)", left: "50%", transform: "translateX(-50%)" }}>{label}</div>;
  return <div style={{ ...base, right: "calc(100% + 8px)", top: "50%", transform: "translateY(-50%)" }}>{label}</div>;
};

const TipBtn = ({ title, onClick, className, style, children, disabled, btnRef, tooltipPosition = "left" }) => {
  const [hov, setHov] = useState(false);
  return (
    <div style={{ position: "relative", display: "inline-flex" }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}>
      <button ref={btnRef} onClick={onClick} disabled={disabled} className={className} style={style}>
        {children}
      </button>
      {hov && title && <SbTooltip label={title} position={tooltipPosition} />}
    </div>
  );
};

// ─── Constants ────────────────────────────────────────────────────────────────
const makeIcon = (cls) => {
  const Ic = ({ className = '', style = {} }) => (
    <i className={`${cls} ${className}`} style={{ lineHeight: 1, ...style }} />
  );
  return Ic;
};

const CATEGORY_CONFIG = {
  drywall: { Icon: makeIcon('icon-Drywall0'), label: "Drywall", color: "#3b82f6" },
  painting: { Icon: makeIcon('icon-Painting0'), label: "Painting", color: "#3b82f6" },
  doors: { Icon: makeIcon('icon-doors0'), label: "Doors & Windows", color: "#3b82f6" },
  door_window: { Icon: makeIcon('icon-doors0'), label: "Doors & Windows", color: "#3b82f6" },
  floor: { Icon: makeIcon('icon-flooring0'), label: "Flooring", color: "#3b82f6" },
  flooring: { Icon: makeIcon('icon-flooring0'), label: "Flooring", color: "#3b82f6" },
  ceiling: { Icon: makeIcon('icon-ceiling-new0'), label: "Ceiling", color: "#3b82f6" },
  hvac: { Icon: makeIcon('icon-HVAC0'), label: "HVAC", color: "#3b82f6" },
  roof: { Icon: makeIcon('icon-roofing0'), label: "Roofing", color: "#3b82f6" },
  roofing: { Icon: makeIcon('icon-roofing0'), label: "Roofing", color: "#3b82f6" },
  electrical: { Icon: makeIcon('icon-Electrical0'), label: "Electrical", color: "#3b82f6" },
  concrete: { Icon: makeIcon('icon-Concrete0'), label: "Concrete", color: "#3b82f6" },
  masonry: { Icon: makeIcon('icon-masonry0'), label: "Masonry", color: "#3b82f6" },
  mechanical: { Icon: makeIcon('icon-Mechanic0'), label: "Mechanical", color: "#3b82f6" },
  plumbing: { Icon: makeIcon('icon-Plumbing0'), label: "Plumbing", color: "#3b82f6" },
  siding: { Icon: makeIcon('icon-siding-new0'), label: "Siding", color: "#3b82f6" },
  steel: { Icon: makeIcon('icon-Steel0'), label: "Steel", color: "#3b82f6" },
  labour: { Icon: HardHat, label: "Labour", color: "#3b82f6" },
  unknown: { Icon: TriangleAlert, label: "Unknown Symbols", color: "#ff9500" },
};

const STATIC_CATEGORIES = [
  { id: "ceiling", name: "Ceiling", Icon: makeIcon('icon-ceiling-new0') },
  { id: "concrete", name: "Concrete", Icon: makeIcon('icon-Concrete0') },
  { id: "door_window", name: "Doors & Windows", Icon: makeIcon('icon-doors0') },
  { id: "drywall", name: "Drywall", Icon: makeIcon('icon-Drywall0') },
  { id: "electrical", name: "Electrical", Icon: makeIcon('icon-Electrical0') },
  { id: "flooring", name: "Flooring", Icon: makeIcon('icon-flooring0') },
  { id: "hvac", name: "HVAC", Icon: makeIcon('icon-HVAC0') },
  { id: "masonry", name: "Masonry", Icon: makeIcon('icon-masonry0') },
  { id: "mechanical", name: "Mechanical", Icon: makeIcon('icon-Mechanic0') },
  { id: "painting", name: "Painting", Icon: makeIcon('icon-Painting0') },
  { id: "plumbing", name: "Plumbing", Icon: makeIcon('icon-Plumbing0') },
  { id: "roofing", name: "Roofing", Icon: makeIcon('icon-roofing0') },
  { id: "siding", name: "Siding", Icon: makeIcon('icon-siding-new0') },
  { id: "steel", name: "Steel", Icon: makeIcon('icon-Steel0') },
];

const GROUPS = [
  ["drywall", "drywall_data"],
  ["painting", "paint_data"],
  ["doors", "doors_data"],
  ["floor", "floor_data"],
  ["ceiling", "ceiling_data"],
  ["hvac", "hvac_data"],
  ["roof", "roofing_data"],
  ["electrical", "electrical_data"],
  ["concrete", "concrete_data"],
  ["masonry", "masonry_data"],
  ["mechanical", "mechanical_data"],
  ["plumbing", "plumbing_data"],
  ["siding", "siding_data"],
  ["steel", "steel_data"],
  ["unknown", "unknown_data"],
];

const getGroupMeta = (dataVal) => {
  if (!dataVal) return { takeoff_id: null, takeoff_order: null, items: [] };
  if (Array.isArray(dataVal)) return { takeoff_id: null, takeoff_order: null, items: dataVal };
  return { takeoff_id: dataVal.takeoff_id ?? null, takeoff_order: dataVal.takeoff_order ?? null, items: dataVal.items ?? [] };
};

const getItemKey = (item) => String(item.item_id ?? item.pk_id ?? item.id ?? "");
const normalizeLabel = (text = "") =>
  text.replace(/[_.]/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());

const normaliseItemForPanel = (item, groupKey, colorMap, fallbackColor = "#3b82f6") => {
  const attrs = item?.attributes && typeof item.attributes === "object" ? item.attributes : {};
  return {
    ...item, ...attrs,
    attributes: {
      ...attrs,
      pipe_length: attrs.pipe_length ?? item.pipe_length ?? "",
      length: attrs.length ?? item.length ?? "",
      duct_length: attrs.duct_length ?? item.duct_length ?? "",
      quantity: attrs.quantity ?? item.quantity ?? "",
    },
    color: (() => {
      const scopedId = item?.page_number != null ? `${item.id}_p${item.page_number}` : item.id;
      const pkKey = item.pk_id != null ? `pk_${item.pk_id}` : null;
      const iidKey = item.item_id != null ? `iid_${item.item_id}` : null;
      return (
        (pkKey && colorMap?.get(pkKey)) || (iidKey && colorMap?.get(iidKey)) ||
        colorMap?.get(scopedId) || colorMap?.get(item.id) ||
        colorMap?.get(String(item.pk_id ?? "")) || colorMap?.get(String(item.item_id ?? "")) ||
        { stroke: fallbackColor }
      );
    })(),
  };
};

const fmt = (n) => {
  const num = Number(n);
  if (isNaN(num)) return "—";
  return num % 1 === 0 ? String(Math.round(num)) : num.toFixed(2);
};

const getItemMetric = (groupKey, item) => {
  switch (groupKey) {
    case "floor": return (item.floor_area ?? item.attributes?.floor_area) != null ? `${fmt(item.floor_area ?? item.attributes?.floor_area)} sf` : "—";
    case "ceiling": return (item.ceiling_area ?? item.attributes?.ceiling_area) != null ? `${fmt(item.ceiling_area ?? item.attributes?.ceiling_area)} sf` : "—";
    case "roof": return (item.roof_area ?? item.attributes?.roof_area) != null ? `${fmt(item.roof_area ?? item.attributes?.roof_area)} sf` : "—";
    case "doors": return (item.quantity ?? item.count) != null ? `${fmt(item.quantity ?? item.count)} ea` : "—";
    case "hvac":
    case "mechanical": { const qty = item.quantity ?? item.count; return qty != null ? `${fmt(qty)} ea` : "—"; }
    case "electrical": {
      const qty = item.quantity ?? item.attributes?.quantity ?? item.count;
      return qty != null ? `${fmt(qty)} ea` : "—";
    }
    case "plumbing": {
      const qty = item.quantity ?? item.attributes?.quantity ?? item.count;
      return qty != null ? `${fmt(qty)} ea` : "—";
    }
    case "concrete": {
      const slab_area = item.slab_area ?? item.attributes?.slab_area;
      const ramp_area = item.ramp_area ?? item.attributes?.ramp_area;
      const stair_area = item.stair_area ?? item.attributes?.stair_area;
      const number_of_columns = item.number_of_columns ?? item.attributes?.number_of_columns;
      const wall_length = item.wall_length ?? item.attributes?.wall_length;
      const wall_height = item.wall_height ?? item.attributes?.wall_height;
      const beam_length = item.beam_length ?? item.attributes?.beam_length;
      const beam_width = item.beam_width ?? item.attributes?.beam_width;
      const footing_length = item.footing_length ?? item.attributes?.footing_length;
      const footing_width = item.footing_width ?? item.attributes?.footing_width;
      if (slab_area != null) return `${fmt(slab_area)} sf`;
      if (ramp_area != null) return `${fmt(ramp_area)} sf`;
      if (stair_area != null) return `${fmt(stair_area)} sf`;
      if (number_of_columns != null) return `${fmt(number_of_columns)} ea`;
      if (wall_length != null) return `${fmt(wall_length)} lf × ${fmt(wall_height ?? 0)} ft`;
      if (beam_length != null) return beam_width != null ? `${fmt(beam_length)} lf × ${fmt(beam_width)} in` : `${fmt(beam_length)} lf`;
      if (footing_length != null) return footing_width != null ? `${fmt(footing_length)} lf × ${fmt(footing_width)} in` : `${fmt(footing_length)} lf`;
      return "—";
    }
    case "siding": {
      const wl = item.wall_length ?? item.attributes?.wall_length;
      const wh = item.wall_height ?? item.attributes?.wall_height;
      return wl != null ? `${fmt(wl)} lf × ${fmt(wh ?? 0)} ft` : "—";
    }
    case "steel": {
      const et = item.element_type;
      const g = (k) => item[k] ?? item.attributes?.[k];
      if (et === 'slab')       { const v = g('slab_area');       return v != null ? `${fmt(v)} sf` : '—'; }
      if (et === 'roof_deck')  { const v = g('roof_deck_area');  return v != null ? `${fmt(v)} sf` : '—'; }
      if (et === 'pile_cap')   { const v = g('pile_cap_area');   return v != null ? `${fmt(v)} sf` : '—'; }
      if (et === 'stair')      { const v = g('stair_area');      return v != null ? `${fmt(v)} sf` : '—'; }
      if (et === 'beam')       { const l = g('beam_length'), w = g('beam_width'); return l != null ? (w != null ? `${fmt(l)} lf × ${fmt(w)} in` : `${fmt(l)} lf`) : '—'; }
      if (et === 'wall')       { const l = g('wall_length'), h = g('wall_height'); return l != null ? (h != null ? `${fmt(l)} lf × ${fmt(h)} ft` : `${fmt(l)} lf`) : '—'; }
      if (et === 'footing')    { const l = g('footing_length'), w = g('footing_width'); return l != null ? (w != null ? `${fmt(l)} lf × ${fmt(w)} in` : `${fmt(l)} lf`) : '—'; }
      if (et === 'grade_beam') { const l = g('grade_beam_length'), w = g('grade_beam_width'); return l != null ? (w != null ? `${fmt(l)} lf × ${fmt(w)} ft` : `${fmt(l)} lf`) : '—'; }
      if (et === 'column')     { const v = g('number_of_columns'); return v != null ? `${fmt(v)} ea` : '—'; }
      return '—';
    }
    case "unknown": { const qty = item.count ?? item.quantity ?? item.attributes?.quantity ?? 1; return `${fmt(qty)} ea`; }
    default: {
      const l = item.wall_length ?? item.attributes?.wall_length;
      const h = item.wall_height ?? item.attributes?.wall_height;
      if (l != null) return `${fmt(l)} lf × ${fmt(h ?? 0)} ft`;
      return "—";
    }
  }
};

// ─── Shimmer ──────────────────────────────────────────────────────────────────
const SHIMMER_STYLE = {
  background: "linear-gradient(90deg,#e5e7eb 25%,#f3f4f6 50%,#e5e7eb 75%)",
  backgroundSize: "200% 100%", animation: "twShimmer 1.4s infinite",
};
const ShimmerCSS = () => <style>{`@keyframes twShimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>;
const ThumbnailSkeleton = () => (
  <div style={{ borderRadius: 8, overflow: "hidden", background: "#f0f2f5" }}>
    <div style={{ ...SHIMMER_STYLE, aspectRatio: "4/3", width: "100%" }} />
    <div style={{ display: "flex", justifyContent: "center", padding: "5px 0" }}>
      <div style={{ ...SHIMMER_STYLE, height: 9, width: 24, borderRadius: 4 }} />
    </div>
  </div>
);

// ─── ThumbItem ────────────────────────────────────────────────────────────────
const ThumbItem = memo(({ index, pageNum, currentPage, onPageChange, detectedPages, getThumbnailUrl }) => {
  const [src, setSrc] = useState(null);
  const [loading, setLoading] = useState(true);
  const isActive = currentPage === index;
  const selfRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true); setSrc(null);
    Promise.resolve(getThumbnailUrl(index))
      .then((url) => { if (!cancelled && url) { setSrc(url); setLoading(false); } })
      .catch(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [index, getThumbnailUrl]);

  useEffect(() => {
    if (isActive && selfRef.current) selfRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [isActive]);

  if (loading) return <ThumbnailSkeleton />;

  return (
    <div ref={selfRef} onClick={() => onPageChange(index)}
      style={{ cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}>
      <div style={{
        width: "100%", borderRadius: 8, overflow: "hidden", background: "#fff",
        border: isActive ? "2px solid #2563EB" : "2px solid #e5e7eb",
        boxShadow: isActive ? "0 0 0 3px rgba(37,99,235,0.12),0 2px 6px rgba(0,0,0,0.08)" : "0 1px 3px rgba(0,0,0,0.06)",
        transition: "border-color 0.15s,box-shadow 0.15s", aspectRatio: "4/3",
        padding: 6, display: "flex", alignItems: "center", justifyContent: "center",
        position: "relative", boxSizing: "border-box",
      }}>
        {src
          ? <img src={src} alt={`Page ${pageNum}`} style={{ width: "100%", height: "100%", objectFit: "contain", display: "block", borderRadius: 4 }} />
          : <div style={{ width: "100%", height: "100%", background: "#f8faff", borderRadius: 4 }} />
        }
        {detectedPages.has(index) && (
          <div style={{ position: "absolute", top: 8, right: 8, background: "#1476FF", borderRadius: 5, padding: "2px 5px", display: "flex", alignItems: "center", gap: 2, boxShadow: "0 1px 4px rgba(0,0,0,0.18)" }}>
            <Wand2 style={{ width: 8, height: 8, color: "#fff" }} />
            <span style={{ fontSize: 8, color: "#fff", fontWeight: 700, letterSpacing: 0.3 }}>AI</span>
          </div>
        )}
      </div>
      <span style={{ fontSize: 11, fontWeight: isActive ? 700 : 500, color: isActive ? "#2563EB" : "#9ca3af", lineHeight: 1 }}>
        {pageNum}
      </span>
    </div>
  );
});
ThumbItem.displayName = "ThumbItem";

// ─── ThumbnailPanel ───────────────────────────────────────────────────────────
const ThumbnailPanel = memo(({ availableImages, currentPage, onPageChange, onClose, detectedPages, getThumbnailUrl }) => (
  <div className="tw-shrink-0 tw-flex tw-flex-col tw-border-r tw-border-gray-200" style={{ width: 200, background: "#fff" }}>
    <ShimmerCSS />
    <style>{SCROLLBAR_STYLE}</style>
    <div className="tw-flex tw-items-center tw-justify-between tw-px-3 tw-border-b tw-border-gray-200 tw-shrink-0" style={{ height: 44 }}>
      <span className="tw-text-sm tw-font-semibold tw-text-gray-800">Thumbnails</span>
      <TipBtn title="Close thumbnails" tooltipPosition="left" onClick={onClose}
        className="tw-h-6 tw-w-6 tw-flex tw-items-center tw-justify-center tw-rounded-md tw-text-gray-400 hover:tw-bg-gray-100 hover:tw-text-gray-700 tw-transition-colors">
        <X className="tw-h-3.5 tw-w-3.5" />
      </TipBtn>
    </div>
    <div className="custom-scroll" style={{ flex: 1, overflowY: "auto", overflowX: "hidden", padding: "10px", display: "flex", flexDirection: "column", gap: 10, background: "#fff" }}>
      {availableImages.map((img, i) => (
        <ThumbItem key={i} index={i} pageNum={img.page} currentPage={currentPage}
          onPageChange={onPageChange} detectedPages={detectedPages} getThumbnailUrl={getThumbnailUrl} />
      ))}
    </div>
  </div>
));
ThumbnailPanel.displayName = "ThumbnailPanel";

// ─── AddTakeoffDropdown ───────────────────────────────────────────────────────
const AddTakeoffDropdown = ({ anchorRef, onClose, onSelect, takeoffCategoriesRes }) => {
  const [categories, setCategories] = useState(null);
  const dropdownRef = useRef(null);
  const [pos, setPos] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (!anchorRef?.current) return;
    const r = anchorRef.current.getBoundingClientRect();
    setPos({ top: r.bottom + 6, left: r.left });
  }, [anchorRef]);

  useEffect(() => {
    const h = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target) &&
        anchorRef?.current && !anchorRef.current.contains(e.target)) onClose();
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [onClose, anchorRef]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = takeoffCategoriesRes;
        if (!res) { setCategories(STATIC_CATEGORIES); return; }
        let d = res?.data || res;
        if (typeof d === "string") d = JSON.parse(d);
        if (cancelled) return;
        const list = d?.valid ? (Array.isArray(d.data) ? d.data : Array.isArray(d.categories) ? d.categories : null) : null;
        if (list?.length > 0) {
          const mapped = list
            .filter((cat) => {
              const k = (cat.takeoff_name || cat.category_name || cat.name || "").toLowerCase().replace(/\s+/g, "_");
              return k !== "general_contractor" && k !== "labour";
            })
            .map((cat) => {
              const k = (cat.takeoff_name || cat.category_name || cat.name || "").toLowerCase().replace(/\s+/g, "_");
              const cfg = CATEGORY_CONFIG[k] || { Icon: Folder, label: normalizeLabel(k) };
              return { id: cat.takeoff_id || cat.id || k, name: cfg.label, Icon: cfg.Icon, _raw: cat };
            });
          setCategories(mapped);
        } else { setCategories(STATIC_CATEGORIES); }
      } catch (err) {
        console.error("Error loading takeoff categories:", err);
        if (!cancelled) setCategories(STATIC_CATEGORIES);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [takeoffCategoriesRes]);

  const isLoading = categories === null;

  return (
    <>
      <div style={{ position: "fixed", inset: 0, zIndex: 9998 }} onClick={onClose} />
      <div ref={dropdownRef} style={{
        position: "fixed", top: pos.top, left: pos.left, zIndex: 9999,
        width: 190, maxHeight: 500, background: "#fff",
        border: "1px solid #e5e7eb", borderRadius: 10,
        boxShadow: "0 12px 40px rgba(0,0,0,0.16)",
        display: "flex", flexDirection: "column", overflow: "hidden",
        animation: "dropdownSlideIn 0.14s cubic-bezier(0.16,1,0.3,1)",
      }}>
        <style>{`@keyframes dropdownSlideIn{from{opacity:0;transform:translateY(-6px) scale(0.97)}to{opacity:1;transform:translateY(0) scale(1)}}`}</style>
        <div style={{ padding: "10px 14px 7px", fontSize: 14, fontWeight: 700, textTransform: "uppercase", color: "#59596c", borderBottom: "1px solid #e0e0e0", flexShrink: 0 }}>
          <span>Add Takeoff</span>
        </div>
        {isLoading ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "28px 0", gap: 10 }}>
            <style>{`@keyframes sbSpin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
            <Loader2 style={{ width: 22, height: 22, color: "#1476FF", animation: "sbSpin 0.8s linear infinite" }} />
            <span style={{ fontSize: 12, color: "#9ca3af" }}>Loading categories…</span>
          </div>
        ) : (
          <div style={{ overflowY: "auto", flex: 1 }}>
            {(categories || []).map(({ Icon, name, id, _raw }) => (
              <button key={id} onClick={() => { onSelect(_raw || { id, name }); onClose(); }}
                className="tw-w-full tw-flex tw-items-center tw-gap-2.5 tw-px-3 tw-py-2 tw-text-left tw-rounded-md tw-transition-colors tw-text-gray-600 hover:tw-text-[#1476FF] hover:tw-bg-[#EFF6FF]">
                <Icon className="tw-w-4 tw-h-4 tw-flex-shrink-0" />
                <span className="tw-text-[13px] tw-font-normal">{name}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

const stripSuffix = (name = "") => normalizeItemName(name);

const TAKEOFF_NAME_TO_PANEL_TYPE = { door_window: "door_window", flooring: "flooring", roofing: "roofing" };

// ─── AddItemModal ─────────────────────────────────────────────────────────────
const AddItemModal = ({ categoryKey, categoryRaw, documentId, currentPage, onAdd, onClose, productList = [] }) => {
  const [prefetched, setPrefetched] = useState(null);
  const rawTakeoffName = (categoryRaw?.takeoff_name || categoryRaw?.category_name || categoryRaw?.name || categoryKey || "").toLowerCase().replace(/\s+/g, "_");
  const takeoffName = TAKEOFF_NAME_TO_PANEL_TYPE[rawTakeoffName] || rawTakeoffName;
  const takeoffId = categoryRaw?.takeoff_id ?? null;
  const isConcreteOrSteel = takeoffName === "concrete" || takeoffName === "steel";

  useEffect(() => {
    let cancelled = false;
    const prefetch = async () => {
      let preloadedTypes = [];
      let preloadedConfig = null;
      let resolvedTypeKey = "";
      let defaultProductId = "";
      if (takeoffId) {
        const org = localStorage.getItem("organization_uuid") || "";
        const prj = localStorage.getItem("project_uuid") || "";
        const dev = getDeviceInfo();
        try {
          if (isConcreteOrSteel) {
            const typesRes = await getTypesV2({ organization_uuid: org, takeoff_id: takeoffId, device_info: dev });
            const typesArr = Array.isArray(typesRes?.data) ? typesRes.data : (Array.isArray(typesRes?.data?.types) ? typesRes.data.types : []);
            if (!cancelled) preloadedTypes = typesArr;

            const defaultType = typesArr.find((t) => t.is_default) || typesArr[0];
            if (defaultType) {
              resolvedTypeKey = defaultType.type_key;
              const cfg = await getConfigV2({ organization_uuid: org, project_uuid: prj, takeoff_id: takeoffId, type_id: defaultType.id, device_info: dev });
              if (!cancelled && cfg?.data) {
                preloadedConfig = cfg.data;
                defaultProductId = cfg.data.product_defaults?.[0]?.product_id || "";
              }
            }
          } else {
            const cfg = await getConfigV2({ organization_uuid: org, project_uuid: prj, takeoff_id: takeoffId, device_info: dev });
            if (!cancelled && cfg?.valid && cfg.data) {
              const d = cfg.data;
              preloadedConfig = { dimensions: [], thickness: [], option_groups: d.option_groups || [], spec_groups: [], geometry_groups: [], input_fields: d.input_fields || [] };
              defaultProductId = d.product_defaults?.[0]?.product_id || "";
            }
          }
        } catch (err) { console.error("[AddItemModal] prefetch error:", err); }
      }
      if (!cancelled) setPrefetched({ preloadedTypes, preloadedConfig, resolvedTypeKey, defaultProductId });
    };
    prefetch();
    return () => { cancelled = true; };
  }, [takeoffId, isConcreteOrSteel]);

  // Memoize so the reference stays stable across re-renders. A fresh object on
  // every render would change TakeoffDetailsPanel's `item` prop identity, which
  // re-runs its init effect and wipes the user's in-progress add selections
  // (Type resets to "Select type", material dimensions fall back to defaults).
  const stubItem = useMemo(() => {
    if (!prefetched) return null;
    return {
      takeoff_id: takeoffId,
      takeoff_name: rawTakeoffName,
      name: "",
      type_key: prefetched.resolvedTypeKey || "",
      __preloadedTypes: prefetched.preloadedTypes,
      __preloadedConfig: prefetched.preloadedConfig,
      __resolvedTypeKey: prefetched.resolvedTypeKey || "",
      product_id: prefetched.defaultProductId || "",
    };
  }, [prefetched, takeoffId, rawTakeoffName]);

  if (!prefetched) return <FullPageLoader />;

  return (
    <>
      <div style={{ position: "fixed", inset: 0, zIndex: 10000, background: "#2a28288c" }} onClick={onClose} />
      <div style={{ position: "fixed", zIndex: 10001, top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 570, maxWidth: "calc(100vw - 32px)", height: "auto", maxHeight: "calc(100vh - 48px)", background: "#fff", borderRadius: 8, boxShadow: "0 24px 80px rgba(0,0,0,0.22)", display: "flex", flexDirection: "column", overflow: "hidden", animation: "addModalIn 0.18s cubic-bezier(0.16,1,0.3,1)" }}>
        <style>{`@keyframes addModalIn{from{opacity:0;transform:translate(-50%,-48%) scale(0.96)}to{opacity:1;transform:translate(-50%,-50%) scale(1)}}`}</style>
        <TakeoffDetailsPanel item={stubItem} type={takeoffName} mode="add" documentId={documentId} pageNumber={currentPage + 1} onAdd={onAdd} onClose={onClose} onUpdate={() => { }} productList={productList} />
      </div>
    </>
  );
};

// ─── TakeoffItem ──────────────────────────────────────────────────────────────
const TakeoffItem = memo(({
  groupKey, item, colorMap, cfg,
  selectedTakeoffId, hiddenIds,
  deletingItemId, isDeletingPkId, isDeletingDetectionPkIds,
  onToggleVisibility, onOpenEditDialog,
  onSetDeletingItemId, onDeleteItem,
  selectedItemRef,
  onDragStart, onDragOver, onDrop, onDragEnd, isDragOver, isMarkAsCompleted = false,
  onLineItemClick,
}) => {
  const itemKey = getItemKey(item);
  const itemPkId = item.item_id ?? item.pk_id;
  const pageNum = item.page_number ?? null;
  const scopedId = pageNum != null ? `${item.id}_p${pageNum}` : item.id;

  // JS row hover — replaces CSS group-hover which requires Tailwind v3.1+ named groups
  const [rowHovered, setRowHovered] = useState(false);


  const dotColor = (
    colorMap?.get(scopedId)?.stroke || colorMap?.get(item.id)?.stroke ||
    colorMap?.get(String(item.pk_id ?? ""))?.stroke || colorMap?.get(String(item.item_id ?? ""))?.stroke || cfg.color
  );

  const _selBareId = selectedTakeoffId ? selectedTakeoffId.replace(/_p\d+$/, "") : null;
  const isSelected = selectedTakeoffId === scopedId || (pageNum == null && _selBareId != null && _selBareId === item.id);

  const hiddenKey = scopedId;
  const itemObjectKeys = Array.isArray(item.object_keys) ? item.object_keys : [];
  const isHidden = hiddenIds.has(hiddenKey) || (pageNum == null && hiddenIds.has(item.id)) ||
    itemObjectKeys.some((ok) => {
      const scopedOk = item.page_number != null ? `${ok}_p${item.page_number}` : ok;
      return hiddenIds.has(scopedOk) || (item.page_number == null && hiddenIds.has(ok));
    });

  const isDel = deletingItemId?.pkId != null
    ? deletingItemId.pkId === itemPkId
    : deletingItemId?.groupId === groupKey && deletingItemId?.itemId === item.id;
  const isDeleting = isDeletingPkId != null && isDeletingPkId === itemPkId;
  const isDeletingDetection = isDeletingDetectionPkIds?.has(itemPkId);

  // useEffect(() => {
  //   if (!isDeletingPkId && !isDeleting) {
  //     setRowHovered(false);
  //   }
  // }, [isDeletingPkId, isDeleting]);

  const rowRef = useRef(null);

const setRowRef = useCallback((el) => {
  rowRef.current = el;
  // Also assign selectedItemRef if this item is selected
  if (isSelected && selectedItemRef) selectedItemRef.current = el;
  if (!el) return;
  // Immediately check if cursor is already over this element (handles post-delete slide-up)
  requestAnimationFrame(() => {
    if (!el || (!_mousePos.x && !_mousePos.y)) return;
    const hit = document.elementFromPoint(_mousePos.x, _mousePos.y);
    if (hit && el.contains(hit)) setRowHovered(true);
  });
}, [isSelected, selectedItemRef]);

  const actionBtnClass =
    "tw-p-0.5 tw-shrink-0 tw-text-gray-400 hover:tw-text-gray-700 tw-cursor-pointer tw-transition-colors";
  const actionBtnStyle = {
    opacity: rowHovered ? 1 : 0,
    transition: "opacity 0.15s",
    pointerEvents: rowHovered ? "auto" : "none",
  };

  const deleteBtnClass = isMarkAsCompleted
    ? "tw-p-0.5 tw-shrink-0 tw-cursor-not-allowed tw-text-gray-400"
    : "tw-p-0.5 tw-shrink-0 tw-text-gray-400 hover:tw-text-red-500 tw-cursor-pointer tw-transition-colors";
  const deleteBtnStyle = {
    opacity: rowHovered ? 1 : 0,
    transition: "opacity 0.15s",
    pointerEvents: rowHovered ? "auto" : "none",
  };

  const dragHandleStyle = {
    opacity: rowHovered ? 1 : 0,
    transition: "opacity 0.15s",
    pointerEvents: rowHovered ? "auto" : "none",
  };
  return (
    <div
      ref={setRowRef}
      draggable
      onDragStart={(e) => { e.stopPropagation(); onDragStart(e, groupKey, itemKey); }}
      onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); onDragOver(e, groupKey, itemKey); }}
      onDrop={(e) => { e.preventDefault(); e.stopPropagation(); onDrop(e, groupKey, itemKey); }}
      onDragEnd={(e) => { e.stopPropagation(); onDragEnd(e); }}
      onMouseEnter={() => setRowHovered(true)}
      onMouseLeave={() => setRowHovered(false)}
      onMouseMove={() => { if (!rowHovered) setRowHovered(true); }}
      style={isDragOver ? { borderTop: "2px solid #6366f1", borderRadius: 2 } : { borderTop: "2px solid transparent" }}
      // ref={isSelected ? selectedItemRef : null}
    >
      <div className={[
        "tw-flex tw-items-center tw-gap-1.5 tw-px-2 tw-py-1 tw-rounded-lg tw-cursor-default tw-transition-all",
        isSelected ? "tw-bg-indigo-50 tw-ring-1 tw-ring-indigo-200" : "hover:tw-bg-[#EFF6FF]",
        isHidden ? "tw-opacity-50" : "",
        isDel ? "tw-bg-red-50 tw-ring-1 tw-ring-red-200" : "",
      ].join(" ")}>

        {/* Drag handle */}
        <TipBtn title="Drag to reorder" tooltipPosition="top"
          className="tw-p-0.5 tw-cursor-grab tw-shrink-0 tw-text-gray-300 hover:tw-text-gray-500 tw-transition-colors"
          style={{ ...dragHandleStyle, touchAction: "none" }}>
          <GripVertical className="tw-h-3.5 tw-w-3.5" />
        </TipBtn>

        {/* Visibility toggle — always visible */}
        <TipBtn title={isHidden ? "Show on canvas" : "Hide on canvas"} tooltipPosition="right"
          onClick={(e) => { e.stopPropagation(); onToggleVisibility(groupKey, hiddenKey); }}
          className={`tw-p-0.5 tw-shrink-0 tw-transition-colors ${isHidden ? "tw-text-gray-400" : "tw-text-gray-300 hover:tw-text-gray-500"}`}>
          {isHidden ? <EyeOff className="tw-h-3.5 tw-w-3.5 tw-text-gray-400" /> : <Eye className="tw-h-3.5 tw-w-3.5" />}
        </TipBtn>

        <div className="tw-h-2.5 tw-w-2.5 tw-rounded-full tw-shrink-0" style={{ backgroundColor: dotColor }} />

        <span
          className={`tw-flex-1 tw-min-w-0 tw-text-sm tw-truncate ${isHidden ? "tw-text-gray-400" : "tw-text-gray-700"}`}
          style={{ cursor: "pointer" }}
          onClick={(e) => { e.stopPropagation(); onLineItemClick?.(item, groupKey); }}
        >
          {stripSuffix(item.name || item.id)}
        </span>

        <span className="tw-text-xs tw-text-gray-400 tw-whitespace-nowrap tw-shrink-0">
          {getItemMetric(groupKey, item)}
        </span>

        {/* Edit button
            - NOT completed: hidden until hover, opens modal (modal fields are editable)
            - IS completed: always visible, disabled style, opens modal (modal fields disabled via isMarkAsCompleted prop)
        */}
        <TipBtn
          title={"Edit in Dialog"}
          tooltipPosition="left"
          disabled={false}
          onClick={(e) => {
            e.stopPropagation();
            onOpenEditDialog(groupKey, normaliseItemForPanel(item, groupKey, colorMap, cfg.color));
          }}
          className={actionBtnClass}
          style={actionBtnStyle}
        >
          <i className="icon-Edit-dialog tw-h-3.5 tw-w-3.5" />
        </TipBtn>

        {/* Delete button
            - NOT completed: hidden until hover, triggers confirm flow
            - IS completed: always visible, disabled (no action)
        */}
        {isDeletingDetection ? (
          <Loader2 className="tw-h-3.5 tw-w-3.5 tw-shrink-0 tw-animate-spin tw-text-blue-500" />
        ) : isDeleting ? (
          <Loader2 className="tw-h-3.5 tw-w-3.5 tw-shrink-0 tw-animate-spin tw-text-red-400" />
        ) : isDel && !isMarkAsCompleted ? (
          <div className="tw-flex tw-items-center tw-gap-0.5 tw-shrink-0">
            <TipBtn title="Confirm Delete" tooltipPosition="left"
              onClick={(e) => { e.stopPropagation(); onDeleteItem(groupKey, itemPkId); }}
              className="tw-p-0.5 tw-text-red-500 hover:tw-text-red-600">
              <Check className="tw-h-3.5 tw-w-3.5" />
            </TipBtn>
            <TipBtn title="Cancel" tooltipPosition="left"
              onClick={(e) => { e.stopPropagation(); onSetDeletingItemId(null); }}
              className="tw-p-0.5 tw-text-gray-400 hover:tw-text-gray-600">
              <X className="tw-h-3.5 tw-w-3.5" />
            </TipBtn>
          </div>
        ) : (
          <TipBtn
            title={"Delete item"}
            tooltipPosition="left"
            disabled={isMarkAsCompleted}
            onClick={isMarkAsCompleted ? undefined : (e) => {
              e.stopPropagation();
              onSetDeletingItemId({ groupId: groupKey, itemId: item.id, pkId: itemPkId, pageNumber: pageNum });
            }}
            className={deleteBtnClass}
            style={deleteBtnStyle}
          >
            <i className="icon-Delete tw-h-3.5 tw-w-3.5" />
          </TipBtn>
        )}
      </div>
    </div>
  );
});
TakeoffItem.displayName = "TakeoffItem";

// ─── TakeoffGroup ─────────────────────────────────────────────────────────────
// Delete category icon:
const TakeoffGroup = memo(({
  groupKey, dataArray, searchQuery, expandedGroups,
  colorMap, selectedTakeoffId, hiddenIds,
  deletingGroupId, deletingItemId, isDeletingPkId, isDeletingDetectionPkIds, isDeletingGroup,
  onToggleGroup, onToggleVisibility, onOpenEditDialog,
  onSetDeletingGroupId, onSetDeletingItemId,
  onDeleteGroup, onDeleteItem, selectedItemRef,
  onGroupDragStart, onGroupDragOver, onGroupDrop, onGroupDragEnd, isGroupDragOver,
  onItemDragStart, onItemDragOver, onItemDrop, onItemDragEnd, dragOverItemKey,
  onGuard, isMarkAsCompleted = false,
  onLineItemClick,
}) => {
  const cfg = CATEGORY_CONFIG[groupKey] || { Icon: Folder, label: groupKey, color: "#3b82f6" };
  const isExpanded = expandedGroups.has(groupKey);
  const isDeletingThisGroup = isDeletingGroup === groupKey;
  const isUnknownCategory = groupKey === "unknown";

  // JS hover state — replaces CSS group-hover
  const [grpHovered, setGrpHovered] = useState(false);

  // useEffect(() => {
  //   if (!isDeletingGroup) {
  //     setGrpHovered(false);
  //   }
  // }, [isDeletingGroup]);
  const grpRowRef = useRef(null);
useEffect(() => {
  if (!isDeletingGroup) {
    setGrpHovered(false);
    requestAnimationFrame(() => {
      const el = grpRowRef.current;
      if (!el) return;
      const hit = document.elementFromPoint(_mousePos.x, _mousePos.y);
      if (hit && el.contains(hit)) setGrpHovered(true);
    });
  }
}, [isDeletingGroup]);

  const filtered = useMemo(() => {
    if (!searchQuery) return dataArray;
    const q = searchQuery.toLowerCase().trim();
    if (cfg.label.toLowerCase().includes(q)) return dataArray;
    return dataArray.filter((it) => (it.display_name || it.name || "").toLowerCase().includes(q));
  }, [dataArray, searchQuery, cfg.label]);

  if (!filtered.length) return null;

  // Delete category button styles
  const delCatClass = isMarkAsCompleted
    ? "tw-p-1 tw-cursor-not-allowed tw-text-gray-400"
    : "tw-p-1 tw-text-gray-400 hover:tw-text-red-500 tw-cursor-pointer tw-transition-colors";
  const delCatStyle = {
    opacity: grpHovered ? 1 : 0,
    transition: "opacity 0.15s",
    pointerEvents: grpHovered ? "auto" : "none",
  };
  const dragHandleStyle = {
    opacity: grpHovered ? 1 : 0,
    transition: "opacity 0.15s",
    pointerEvents: grpHovered ? "auto" : "none",
  };
  return (
    <div
      draggable
      onDragStart={(e) => onGroupDragStart(e, groupKey)}
      onDragOver={(e) => { e.preventDefault(); onGroupDragOver(e, groupKey); }}
      onDrop={(e) => onGroupDrop(e, groupKey)}
      onDragEnd={onGroupDragEnd}
      style={isGroupDragOver ? { outline: "2px solid #6366f1", outlineOffset: 2, borderRadius: 8 } : {}}
      className="tw-mb-1"
    >
      <div
        ref={grpRowRef}
        className="tw-flex tw-items-center tw-gap-1"
        onMouseEnter={() => setGrpHovered(true)}
        onMouseLeave={() => setGrpHovered(false)}
        onMouseMove={() => { if (!grpHovered) setGrpHovered(true); }}
      >
        {/* Drag handle */}
        {!isUnknownCategory ? (
          <div className="tw-p-1 tw-shrink-0 tw-cursor-grab tw-text-gray-300 hover:tw-text-gray-500 tw-transition-colors"
            style={{ ...dragHandleStyle, touchAction: "none" }}>
            <GripVertical className="tw-h-3.5 tw-w-3.5" />
          </div>
        ) : (
          <div className="tw-p-1 tw-shrink-0 tw-invisible" style={{ touchAction: "none" }}>
            <GripVertical className="tw-h-3.5 tw-w-3.5" />
          </div>
        )}

        <button onClick={() => onToggleGroup(groupKey)}
          className="tw-flex tw-items-center tw-gap-2 tw-flex-1 tw-px-2 tw-py-1.5 tw-rounded-lg tw-bg-gray-50 hover:tw-bg-gray-100 tw-text-left tw-transition-colors">
          <ChevronDown className={`tw-h-3.5 tw-w-3.5 tw-text-gray-400 tw-transition-transform tw-duration-200 ${isExpanded ? "" : "-tw-rotate-90"}`} />
          <cfg.Icon className="tw-h-4 tw-w-4 tw-shrink-0" style={{ color: cfg.color }} />
          <span className="tw-text-sm tw-font-semibold tw-text-gray-700 tw-flex-1 tw-truncate">{cfg.label}</span>
          <span className="tw-text-[11px] tw-px-1.5 tw-py-0.5 tw-rounded-full tw-font-bold tw-shrink-0"
            style={{ background: `${cfg.color}18`, color: cfg.color }}>
            {filtered.length}
          </span>
        </button>

        {/* Delete category button
            - NOT completed: hidden until group hover, triggers confirm flow
            - IS completed: always visible, disabled (no action) with tooltip
        */}
        {isDeletingThisGroup ? (
          <Loader2 className="tw-h-3.5 tw-w-3.5 tw-mx-1 tw-shrink-0 tw-animate-spin tw-text-red-400" />
        ) : deletingGroupId === groupKey && !isMarkAsCompleted ? (
          <div className="tw-flex tw-items-center tw-gap-0.5">
            <TipBtn title="Confirm Delete" tooltipPosition="left"
              onClick={() => onDeleteGroup(groupKey)}
              className="tw-p-1 tw-text-red-500 hover:tw-text-red-600">
              <Check className="tw-h-3.5 tw-w-3.5" />
            </TipBtn>
            <TipBtn title="Cancel" tooltipPosition="left"
              onClick={() => onSetDeletingGroupId(null)}
              className="tw-p-1 tw-text-gray-400 hover:tw-text-gray-600">
              <X className="tw-h-3.5 tw-w-3.5" />
            </TipBtn>
          </div>
        ) : (
          <TipBtn
            title={"Delete category"}
            tooltipPosition="left"
            disabled={isMarkAsCompleted}
            onClick={isMarkAsCompleted ? undefined : () => onSetDeletingGroupId(groupKey)}
            className={delCatClass}
            style={delCatStyle}
          >
            <i className="icon-Delete tw-h-3.5 tw-w-3.5" />
          </TipBtn>
        )}
      </div>

      {isExpanded && (
        <div className="tw-ml-4 tw-pl-2 tw-border-l tw-border-gray-200 tw-space-y-0.5 tw-py-1">
          {filtered.map((item) => {
            const key = getItemKey(item);
            return (
              <TakeoffItem key={`${groupKey}-${key}-p${item.page_number ?? 'x'}`}
                groupKey={groupKey} item={item} colorMap={colorMap} cfg={cfg}
                selectedTakeoffId={selectedTakeoffId} hiddenIds={hiddenIds}
                deletingItemId={deletingItemId} isDeletingPkId={isDeletingPkId}
                isDeletingDetectionPkIds={isDeletingDetectionPkIds}
                onToggleVisibility={onToggleVisibility} onOpenEditDialog={onOpenEditDialog}
                onSetDeletingItemId={onSetDeletingItemId} onDeleteItem={onDeleteItem}
                selectedItemRef={selectedItemRef}
                onDragStart={onItemDragStart} onDragOver={onItemDragOver}
                onDrop={onItemDrop} onDragEnd={onItemDragEnd}
                isDragOver={dragOverItemKey === key}
                onGuard={onGuard}
                onLineItemClick={onLineItemClick} isMarkAsCompleted={isMarkAsCompleted}
              />
            );
          })}
        </div>
      )}
    </div>
  );
});
TakeoffGroup.displayName = "TakeoffGroup";

// ─── TakeoffSidebar ───────────────────────────────────────────────────────────
const TakeoffSidebar = React.memo(({
  takeoffData, colorMap, expandedGroups,
  showThumbnails, availableImages, currentPage,
  deletingGroupId, deletingItemId, isDeletingPkId, isDeletingDetectionPkIds, isDeletingGroup,
  onToggleGroup, onToggleVisibility, onDeleteGroup, onDeleteItem,
  onSetDeletingGroupId, onSetDeletingItemId,
  onPageChange, getTotalTakeoffs,
  sidebarCollapsed, onToggleSidebar, onToggleThumbnails,
  onOpenEditDialog, detectedPages = new Set(),
  selectedTakeoffId, hiddenIds = new Set(),
  getThumbnailUrl, isMarkAsCompleted = false,
  organizationUuid, projectUuid, documentId, deviceInfo,
  onCategorySelect, onItemAdded, takeoffCategoriesRes,
  onLineItemClick, productList = [],
}) => {
  const totalTakeoffs = useMemo(() => getTotalTakeoffs(), [getTotalTakeoffs]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [addModal, setAddModal] = useState(null);
  const plusBtnRef = useRef(null);
  const selectedItemRef = useRef(null);

  const { planStudio: psAccess } = useTakeoffPermissions();
  const canAddTrade = psAccess.tradeAccess !== false;

  const _sidebarClickRef = useRef(false);
  const _tdRef = useRef(takeoffData);
  const _egRef = useRef(expandedGroups);
  useEffect(() => { _tdRef.current = takeoffData; }, [takeoffData]);
  useEffect(() => { _egRef.current = expandedGroups; }, [expandedGroups]);

  useEffect(() => {
    if (!selectedTakeoffId) return;
    if (_sidebarClickRef.current) { _sidebarClickRef.current = false; return; }
    const _pm = selectedTakeoffId.match(/_p(\d+)$/);
    const _pNum = _pm ? Number(_pm[1]) : null;
    const _bare = _pm ? selectedTakeoffId.slice(0, -_pm[0].length) : selectedTakeoffId;
    let owningGroup = null;
    if (_pNum != null) {
      owningGroup = GROUPS.find(([, dk]) => {
        const raw = _tdRef.current?.[dk];
        const items = Array.isArray(raw) ? raw : (raw?.items ?? []);
        return items.some((i) => i.id === _bare && Number(i.page_number) === _pNum);
      })?.[0] ?? null;
    }
    if (!owningGroup) {
      owningGroup = GROUPS.find(([, dk]) => {
        const raw = _tdRef.current?.[dk];
        const items = Array.isArray(raw) ? raw : (raw?.items ?? []);
        return items.some((i) => i.id === _bare && i.page_number == null);
      })?.[0] ?? null;
    }
    if (!owningGroup) return;
    if (!_egRef.current.has(owningGroup)) onToggleGroup(owningGroup);
    const t = setTimeout(() => { selectedItemRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }); }, 120);
    return () => clearTimeout(t);
  }, [selectedTakeoffId, onToggleGroup]);

  const groupMetas = useMemo(() => {
    const map = {};
    GROUPS.forEach(([gk, dk]) => { map[gk] = getGroupMeta(takeoffData?.[dk]); });
    return map;
  }, [takeoffData]);

  const hasAnyTakeoffs = useMemo(() => GROUPS.some(([gk]) => groupMetas[gk]?.items?.length > 0), [groupMetas]);

  const [groupOrder, setGroupOrder] = useState(() =>
    [...GROUPS].sort(([akA], [akB]) => {
      const a = groupMetas[akA]?.takeoff_order ?? 999;
      const b = groupMetas[akB]?.takeoff_order ?? 999;
      return a - b;
    }).map(([gk]) => gk)
  );

  const groupOrderSeeded = useRef(null);
  useEffect(() => {
    if (!hasAnyTakeoffs) return;
    const anyHasOrder = GROUPS.some(([gk]) => groupMetas[gk]?.takeoff_order != null);
    if (!anyHasOrder) return;
    const orderSignature = GROUPS.map(([gk]) => `${gk}:${groupMetas[gk]?.takeoff_order ?? 999}`).join(',');
    if (groupOrderSeeded.current === orderSignature) return;
    groupOrderSeeded.current = orderSignature;
    setGroupOrder([...GROUPS].sort(([akA], [akB]) => {
      const a = groupMetas[akA]?.takeoff_order ?? 999;
      const b = groupMetas[akB]?.takeoff_order ?? 999;
      return a - b;
    }).map(([gk]) => gk));
  }, [groupMetas, hasAnyTakeoffs]);

  const [draggedGroup, setDraggedGroup] = useState(null);
  const [dragOverGroup, setDragOverGroup] = useState(null);
  const [draggedItem, setDraggedItem] = useState(null);
  const [dragOverItem, setDragOverItem] = useState(null);
  const [localItemOrders, setLocalItemOrders] = useState({});

  useEffect(() => {
    setLocalItemOrders(prev => {
      const next = { ...prev };
      GROUPS.forEach(([gk, dk]) => {
        const serverItems = takeoffData?.[dk];
        const items = Array.isArray(serverItems) ? serverItems : (serverItems?.items ?? []);
        if (!items.length) { delete next[gk]; return; }
        const localOrder = prev[gk];
        if (!localOrder) return;
        const serverKeys = new Set(items.map(getItemKey));
        if (localOrder.some(k => !serverKeys.has(k))) delete next[gk];
      });
      return next;
    });
  }, [takeoffData]);

  const handleGroupDragStart = useCallback((e, gk) => {
    if (draggedItem) { e.preventDefault(); return; }
    setDraggedGroup(gk); e.dataTransfer.effectAllowed = "move"; e.dataTransfer.setData("text/plain", `group:${gk}`);
  }, [draggedItem]);
  const handleGroupDragOver = useCallback((e, gk) => { if (!draggedGroup || draggedGroup === gk) return; setDragOverGroup(gk); }, [draggedGroup]);
  const handleGroupDrop = useCallback((e, tgk) => {
    e.preventDefault();
    if (!draggedGroup || draggedGroup === tgk) return;
    let newOrder;
    setGroupOrder((prev) => {
      const next = [...prev]; const fi = next.indexOf(draggedGroup), ti = next.indexOf(tgk);
      if (fi < 0 || ti < 0) return prev;
      next.splice(fi, 1); next.splice(ti, 0, draggedGroup); newOrder = next; return next;
    });
    setDraggedGroup(null); setDragOverGroup(null);
    setTimeout(() => {
      if (!newOrder) return;
      const takeoffs = newOrder.map((gk, idx) => { const tid = groupMetas[gk]?.takeoff_id; return tid ? { takeoff_id: tid, order: idx + 1 } : null; }).filter(Boolean);
      if (!takeoffs.length) return;
      UpdateTakeoffOrder({ organization_uuid: organizationUuid, project_uuid: projectUuid, document_id: documentId, takeoffs, device_info: deviceInfo ?? {} })
        .catch((err) => console.error("[TakeoffSidebar] update_takeoff_order failed:", err));
    }, 0);
  }, [draggedGroup, groupMetas, organizationUuid, projectUuid, documentId, deviceInfo]);
  const handleGroupDragEnd = useCallback(() => { setDraggedGroup(null); setDragOverGroup(null); }, []);

  const handleItemDragStart = useCallback((e, gk, ik) => {
    e.stopPropagation(); setDraggedItem({ groupKey: gk, itemKey: ik }); setDraggedGroup(null);
    e.dataTransfer.effectAllowed = "move"; e.dataTransfer.setData("text/plain", `item:${gk}:${ik}`);
  }, []);
  const handleItemDragOver = useCallback((e, gk, ik) => {
    if (!draggedItem || draggedItem.groupKey !== gk || draggedItem.itemKey === ik) return;
    setDragOverItem({ groupKey: gk, itemKey: ik });
  }, [draggedItem]);
  const handleItemDrop = useCallback((e, tgk, tik) => {
    if (!draggedItem || draggedItem.groupKey !== tgk || draggedItem.itemKey === tik) return;
    const rawItems = groupMetas[tgk]?.items ?? [];
    if (!rawItems.length) return;
    let newItemOrder;
    setLocalItemOrders((prev) => {
      const base = prev[tgk] ?? rawItems.map(getItemKey);
      const fi = base.indexOf(draggedItem.itemKey), ti = base.indexOf(tik);
      if (fi < 0 || ti < 0) return prev;
      const next = [...base]; const [removed] = next.splice(fi, 1); next.splice(ti, 0, removed);
      newItemOrder = next; return { ...prev, [tgk]: next };
    });
    setDraggedItem(null); setDragOverItem(null);
    setTimeout(() => {
      if (!newItemOrder) return;
      const { takeoff_id } = groupMetas[tgk] ?? {};
      if (!takeoff_id) return;
      const keyToItem = new Map(rawItems.map((i) => [getItemKey(i), i]));
      const items = newItemOrder.map((key, idx) => { const item = keyToItem.get(key); const item_id = item?.item_id ?? item?.pk_id; return item_id != null ? { item_id, order: idx + 1 } : null; }).filter(Boolean);
      if (!items.length) return;
      UpdateLineitemOrder({ organization_uuid: organizationUuid, project_uuid: projectUuid, document_id: documentId, takeoff_id, items, device_info: deviceInfo ?? {} })
        .catch((err) => console.error("[TakeoffSidebar] update_lineitem_order failed:", err));
    }, 0);
  }, [draggedItem, groupMetas, organizationUuid, projectUuid, documentId, deviceInfo]);
  const handleItemDragEnd = useCallback(() => { setDraggedItem(null); setDragOverItem(null); }, []);

  const orderedGroups = useMemo(() => groupOrder.map((gk) => GROUPS.find(([k]) => k === gk)).filter(Boolean), [groupOrder]);
  const getOrderedItems = useCallback((gk) => {
    const items = groupMetas[gk]?.items ?? [];
    const order = localItemOrders[gk];
    if (!order) {
      return [...items].sort((a, b) => {
        const lo = (a.line_order ?? 9999) - (b.line_order ?? 9999);
        if (lo !== 0) return lo;
        return (a.name || a.id || "").localeCompare(b.name || b.id || "");
      });
    }
    const keyToItem = new Map(items.map((i) => [getItemKey(i), i]));
    const ordered = order.map((k) => keyToItem.get(k)).filter(Boolean);
    const inOrder = new Set(order);
    items.forEach((i) => { if (!inOrder.has(getItemKey(i))) ordered.push(i); });
    return ordered;
  }, [groupMetas, localItemOrders]);

  const handleCategorySelect = useCallback((categoryRaw) => {
    setShowCategoryDropdown(false);
    const categoryKey = (categoryRaw?.takeoff_name || categoryRaw?.category_name || categoryRaw?.name || categoryRaw?.id || "").toLowerCase().replace(/\s+/g, "_");
    setAddModal({ categoryKey, categoryRaw });
    onCategorySelect?.(categoryRaw);
  }, [onCategorySelect]);

  const handleAddModalClose = useCallback(() => setAddModal(null), []);
  const handleItemAdded = useCallback((newItem) => { setAddModal(null); onItemAdded?.(newItem); }, [onItemAdded]);
  const handleLineItemClick = useCallback((item, groupKey) => {
    if (_egRef.current.has(groupKey)) _sidebarClickRef.current = true;
    onLineItemClick?.(item, groupKey);
  }, [onLineItemClick]);

  if (sidebarCollapsed) {
    return (
      <>
        {showThumbnails && (
          <ThumbnailPanel availableImages={availableImages} currentPage={currentPage}
            onPageChange={onPageChange} onClose={onToggleThumbnails}
            detectedPages={detectedPages} getThumbnailUrl={getThumbnailUrl} />
        )}
        <div style={{ width: 48, minWidth: 48, flexShrink: 0, background: "#fff", borderRight: "1px solid #e5e7eb", display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 10 }}>
          <TipBtn title="Show Takeoffs" tooltipPosition="right" onClick={onToggleSidebar}
            style={{ width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 8, border: "none", background: "transparent", cursor: "pointer" }}>
            <PanelLeft style={{ width: 16, height: 16 }} />
          </TipBtn>
        </div>
      </>
    );
  }

  return (
    <>
      {showThumbnails && (
        <ThumbnailPanel availableImages={availableImages} currentPage={currentPage}
          onPageChange={onPageChange} onClose={onToggleThumbnails}
          detectedPages={detectedPages} getThumbnailUrl={getThumbnailUrl} />
      )}

      <div className="tw-shrink-0 tw-flex tw-flex-col tw-border-r tw-border-gray-200 tw-bg-white tw-overflow-hidden" style={{ width: 340 }}>

        {/* Header */}
        <div className="tw-flex tw-items-center tw-justify-between tw-px-3 tw-border-b tw-border-gray-200 tw-shrink-0" style={{ height: 54 }}>
          <div className="tw-flex tw-items-center tw-gap-2">
            <span className="tw-text-sm tw-font-bold tw-text-gray-800">Takeoffs</span>
            <span className="tw-text-xs tw-px-2 tw-py-0.5 tw-rounded-full tw-bg-gray-100 tw-text-gray-500 tw-font-semibold">{totalTakeoffs}</span>
          </div>

          {/* Add takeoff button — always renders when canAddTrade.
              IS completed: grayed out, not-allowed, tooltip explains why, no action.
              NOT completed: normal. */}
          {canAddTrade && (
            <TipBtn
              title={"Add takeoff"}
              tooltipPosition="left"
              btnRef={plusBtnRef}
              onClick={isMarkAsCompleted ? undefined : () => setShowCategoryDropdown((v) => !v)}
              className="tw-h-7 tw-w-7 tw-flex tw-items-center tw-justify-center tw-rounded-md tw-transition-colors"
              style={{
                color: isMarkAsCompleted ? "#d1d5db" : undefined,
                cursor: isMarkAsCompleted ? "not-allowed" : "pointer",
                opacity: isMarkAsCompleted ? 0.9 : 1,
              }}
            >
              <Plus className="tw-h-4 tw-w-4" />
            </TipBtn>
          )}
        </div>

        {/* Search */}
        <div className="tw-px-3 tw-py-2 tw-border-b tw-border-gray-200 tw-shrink-0">
          <div className="tw-relative">
            <Search className="tw-absolute tw-left-2.5 tw-top-1/2 -tw-translate-y-1/2 tw-h-3.5 tw-w-3.5 tw-text-gray-300 tw-pointer-events-none" />
            <input type="text" placeholder="Search trades..." value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="tw-w-full tw-h-8 tw-pl-8 tw-pr-3 tw-text-sm tw-border tw-border-gray-200 tw-rounded-lg tw-bg-white tw-text-gray-800 placeholder:tw-text-gray-300 focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-primary/20 focus:tw-border-primary" />
          </div>
        </div>

        {/* List */}
        <div className="tw-flex-1 tw-overflow-y-auto custom-scroll">
          <style>{SCROLLBAR_STYLE}</style>
          {!hasAnyTakeoffs ? (
            <div className="tw-flex tw-flex-col tw-items-center tw-justify-center tw-h-full tw-p-8 tw-text-center">
              <Folder className="tw-h-10 tw-w-10 tw-text-gray-200 tw-mb-3" />
              <p className="tw-text-sm tw-font-semibold tw-text-gray-400 tw-mb-1">No Takeoffs Yet</p>
              <p className="tw-text-xs tw-text-gray-300 tw-leading-relaxed">
                Click <strong className="tw-text-gray-500">AI Detection</strong> then{" "}
                <strong className="tw-text-gray-500">AI Extraction</strong>.
              </p>
            </div>
          ) : (() => {
            const q = searchQuery.toLowerCase().trim();
            const hasMatch = !q || orderedGroups.some(([gk]) => {
              const cfg = CATEGORY_CONFIG[gk] || { label: gk };
              const items = getOrderedItems(gk);
              if (!items.length) return false;
              if (cfg.label.toLowerCase().includes(q)) return true;
              return items.some((it) => (it.display_name || it.name || "").toLowerCase().includes(q));
            });
            if (!hasMatch) {
              return (
                <div className="tw-flex tw-flex-col tw-items-center tw-justify-center tw-h-full tw-p-8 tw-text-center">
                  <Search className="tw-h-8 tw-w-8 tw-text-gray-200 tw-mb-3" />
                  <p className="tw-text-sm tw-font-semibold tw-text-gray-400 tw-mb-1">No takeoffs found</p>
                </div>
              );
            }
            return (
              <div className="tw-p-2 tw-space-y-1">
                {orderedGroups.map(([gk]) => {
                  const items = getOrderedItems(gk);
                  if (!items.length) return null;
                  return (
                    <TakeoffGroup key={gk} groupKey={gk} dataArray={items} searchQuery={searchQuery}
                      expandedGroups={expandedGroups} colorMap={colorMap}
                      selectedTakeoffId={selectedTakeoffId} hiddenIds={hiddenIds}
                      deletingGroupId={deletingGroupId} deletingItemId={deletingItemId}
                      isDeletingPkId={isDeletingPkId} isDeletingDetectionPkIds={isDeletingDetectionPkIds}
                      isDeletingGroup={isDeletingGroup}
                      onToggleGroup={onToggleGroup} onToggleVisibility={onToggleVisibility}
                      onOpenEditDialog={onOpenEditDialog}
                      onSetDeletingGroupId={onSetDeletingGroupId} onSetDeletingItemId={onSetDeletingItemId}
                      onDeleteGroup={onDeleteGroup} onDeleteItem={onDeleteItem}
                      selectedItemRef={selectedItemRef}
                      onGroupDragStart={handleGroupDragStart} onGroupDragOver={handleGroupDragOver}
                      onGroupDrop={handleGroupDrop} onGroupDragEnd={handleGroupDragEnd}
                      isGroupDragOver={dragOverGroup === gk}
                      onItemDragStart={handleItemDragStart} onItemDragOver={handleItemDragOver}
                      onItemDrop={handleItemDrop} onItemDragEnd={handleItemDragEnd}
                      dragOverItemKey={dragOverItem?.groupKey === gk ? dragOverItem.itemKey : null}
                      onGuard={null}
                      onLineItemClick={handleLineItemClick} isMarkAsCompleted={isMarkAsCompleted}
                    />
                  );
                })}
              </div>
            );
          })()}
        </div>
      </div>

      {showCategoryDropdown && !isMarkAsCompleted && (
        <AddTakeoffDropdown anchorRef={plusBtnRef} onClose={() => setShowCategoryDropdown(false)}
          onSelect={handleCategorySelect} takeoffCategoriesRes={takeoffCategoriesRes} />
      )}
      {addModal && (
        <AddItemModal categoryKey={addModal.categoryKey} categoryRaw={addModal.categoryRaw}
          documentId={documentId} currentPage={currentPage}
          onAdd={handleItemAdded} onClose={handleAddModalClose}
          takeoffCategoriesRes={takeoffCategoriesRes} productList={productList} />
      )}
    </>
  );
});

TakeoffSidebar.displayName = "TakeoffSidebar";
export default TakeoffSidebar;