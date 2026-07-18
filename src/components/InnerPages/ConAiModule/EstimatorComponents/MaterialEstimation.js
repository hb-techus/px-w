import React, { useState, useMemo, useEffect } from 'react';
import {
  ChevronLeft, ChevronRight, Search, Download, Plus, Filter,
  Package,
  Users, DollarSign, FileText 
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { fetchEstimationMaterial, fetchEstimationOverview, deleteEstimationItem, updateMaterialQuantity, addEstimationLine, fetchEstimationLabour } from '../../../../services/techus-services';
import { exportEstimateToExcel } from './ExportEstimateToExcel';
import { showToast } from '../../../../genriccomponents/techus-ToastNotification';
import { getDeviceInfo } from '../../../../utils/getDeviceInfo';
import { normalizeLabel } from '../../../../utils/textUtils';
import DeleteModal from '../../../../genriccomponents/DeleteModal';
import FilterDropdown from '../../../../genriccomponents/FilterDropdown';
import FullPageLoader from '../../../../genriccomponents/loaders/FullPageLoader';
import AddLineModal from './AddLineModal';
import EstimationCard from './EstimationCard';
import TextWithTooltip from '../../../../components/Common/ToolTip';

/* ─── Helpers ─── */
const fmtFull = (v) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v ?? 0);
const fmtNum = (n) => Number(n ?? 0).toLocaleString('en-US');

/* ─── Section colour palette ─── */
const SECTION_PALETTE = [
  { border: '#3b82f6', iconBg: '#EEF3FF', iconColor: '#3b82f6' },
  { border: '#8b5cf6', iconBg: '#F5F3FF', iconColor: '#8b5cf6' },
  { border: '#10b981', iconBg: '#ECFDF5', iconColor: '#10b981' },
  { border: '#f59e0b', iconBg: '#FFFBEB', iconColor: '#f59e0b' },
  { border: '#ef4444', iconBg: '#FEF2F2', iconColor: '#ef4444' },
  { border: '#06b6d4', iconBg: '#ECFEFF', iconColor: '#06b6d4' },
  { border: '#f97316', iconBg: '#FFF7ED', iconColor: '#f97316' },
  { border: '#ec4899', iconBg: '#FDF2F8', iconColor: '#ec4899' },
  { border: '#6366f1', iconBg: '#EEF2FF', iconColor: '#6366f1' },
  { border: '#84cc16', iconBg: '#F7FEE7', iconColor: '#84cc16' },
];

/* ─── Trade icon map ─── */
const TRADE_ICON_CLASSES = {
  drywall: 'icon-Drywall0', painting: 'icon-Painting0', paint: 'icon-Painting0',
  door: 'icon-doors0', window: 'icon-doors0', floor: 'icon-flooring0',
  ceiling: 'icon-ceiling-new0', hvac: 'icon-HVAC0', roof: 'icon-roofing0',
  electric: 'icon-Electrical0', concrete: 'icon-Concrete0', masonry: 'icon-masonry0',
  mechanic: 'icon-Mechanic0', plumb: 'icon-Plumbing0', siding: 'icon-siding-new0', steel: 'icon-Steel0',
};
const getTradeIconClass = (name = '') => {
  const lc = name.toLowerCase();
  for (const [k, cls] of Object.entries(TRADE_ICON_CLASSES)) { if (lc.includes(k)) return cls; }
  return null;
};

/* ─── Group-by mapping ─── */
const GROUP_BY_LABELS = { trade: 'Trade', csi: 'CSI Division', none: 'None' };
const GROUP_BY_VALUES = { 'Trade': 'trade', 'CSI Division': 'csi', 'None': 'none' };

/* ═══════════════════════════════════════════════════════ */
export default function MaterialEstimation() {
  const navigate = useNavigate();
  const { uuid } = useParams();

  const [rawData, setRawData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearch] = useState('');
  const [groupBy, setGroupBy] = useState('trade');
  const [tradeFilter, setTradeFilter] = useState('All Trades');
  const [selectedItems, setSelected] = useState(new Set());
  const [collapsedGroups, setCollapsed] = useState(new Set());
  const [pageState, setPageState] = useState({});
  const [showDelete, setShowDelete] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [editingCell, setEditingCell] = useState(null);
  const [editingValue, setEditVal] = useState('');

  const [overviewData, setOverviewData] = useState(() => {
    try { const c = localStorage.getItem('est_overview_data'); return c ? JSON.parse(c) : null; }
    catch { return null; }
  });
  const [updatingRowId, setUpdatingRowId] = useState(null);
  const [labCount, setLabCount] = useState(null);
  const [labHours, setLabHours] = useState(() => parseFloat(localStorage.getItem('est_lab_hours') || '0'));
  const [labRawData, setLabRawData] = useState([]);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [cachedMatCount, setCachedMatCount] = useState(() => {
    return Number(localStorage.getItem('est_mat_count') || 0);
  });
  const [cachedLabCount, setCachedLabCount] = useState(() => {
    return Number(localStorage.getItem('est_lab_count') || 0);
  });

  /* ── Fetch labor count + hours for inactive tab ── */
  useEffect(() => {
    const organization_uuid = localStorage.getItem('organization_uuid');
    const project_uuid = localStorage.getItem('project_uuid');
    fetchEstimationLabour({ organization_uuid, project_uuid, device_info: getDeviceInfo() })
      .then((res) => {
        const count = res?.data?.crew_count ?? null;
        setLabCount(count);
        if (count !== null) {
          localStorage.setItem('est_lab_count', String(count));
          setCachedLabCount(count);
        }
        const groups = res?.data?.groups;
        if (Array.isArray(groups)) {
          const hrs = groups.reduce((s, g) => s + (g.rows || []).reduce((hs, r) => hs + (r.hours || 0), 0), 0);
          setLabHours(hrs);
          localStorage.setItem('est_lab_hours', String(hrs));
          const tagged = [];
          groups.forEach((g) => {
            (g.rows || []).forEach((row, i) => {
              tagged.push({ ...row, _id: `lab-${g.group_key}-${i}`, takeoff_name: g.label, section_id: g.group_key, subsection_code: row.csi_code });
            });
          });
          setLabRawData(tagged);
        }
      })
      .catch(() => {});
  }, []);

  /* ── Fetch material table data ── */
  useEffect(() => {
    const organization_uuid = localStorage.getItem('organization_uuid');
    const project_uuid = localStorage.getItem('project_uuid');
    setLoading(true);
    fetchEstimationMaterial({ organization_uuid, project_uuid, device_info: getDeviceInfo() })
      .then((res) => {
        const groups = res?.data?.groups;
        if (!Array.isArray(groups)) { setRawData([]); return; }
        const tagged = [];
        groups.forEach((g) => {
          (g.items || []).forEach((item, i) => {
            tagged.push({ ...item, _id: `mat-${g.group_key}-${i}`, takeoff_name: g.label, section_id: g.group_key, subsection_code: item.csi_code, is_others_item: g.group_key === '__others__' });
          });
        });
        setRawData(tagged);
        localStorage.setItem('est_mat_count', String(tagged.length));
        setCachedMatCount(tagged.length);
      })
      .catch(() => setRawData([]))
      .finally(() => {
        setLoading(false);
        setHasLoaded(true);
      });
  }, []);

  /* ── Fetch overview ── */
  useEffect(() => {
    const organization_uuid = localStorage.getItem('organization_uuid');
    const project_uuid = localStorage.getItem('project_uuid');
    fetchEstimationOverview({ organization_uuid, project_uuid, device_info: getDeviceInfo() })
      .then((res) => {
        if (res?.valid && res.data) {
          setOverviewData(res.data);
          localStorage.setItem('est_overview_data', JSON.stringify(res.data));
        }
      })
      .catch(() => { });
  }, []);

  /* ── Trade filter list built from takeoff_name (normalized for display) ── */
  const tradeList = useMemo(() => {
    const set = new Set();
    rawData.forEach((item) => { if (item.takeoff_name && !item.is_others_item) set.add(item.takeoff_name); });
    const trades = ['All Trades', ...[...set].map((t) => normalizeLabel(t))];
    if (rawData.some(i => i.is_others_item)) trades.push('Others');
    return trades;
  }, [rawData]);

  /* ── Build display groups ── */
  const displayGroups = useMemo(() => {
    let items = groupBy === 'csi' ? [...rawData] : rawData.filter(i => !i.is_others_item);
    if (tradeFilter !== 'All Trades') items = items.filter((i) => normalizeLabel(i.takeoff_name) === tradeFilter);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      items = items.filter((i) =>
        (i.product_name || '').toLowerCase().includes(q) ||
        (i.takeoff_name || '').toLowerCase().includes(q) ||
        (i.product_code || '').toLowerCase().includes(q)
      );
    }
    const totalCost = items.reduce((s, i) => s + (i.total_cost_with_wastage || i.total_cost || 0), 0);

    if (groupBy === 'none') {
      return [{ id: 'all', name: 'All Items', isAllItems: true, pct: 100, subtotal: totalCost, items }];
    }
    if (groupBy === 'csi') {
      const map = {};
      items.forEach((item) => {
        const k = item.subsection_code || 'Unknown';
        const lbl = k !== 'Unknown' ? `CSI ${k}` : 'Unknown';
        if (!map[k]) map[k] = { id: `csi-${k}`, name: lbl, isCsi: true, subsectionCode: k, items: [], subtotal: 0 };
        map[k].items.push(item);
        map[k].subtotal += (item.total_cost_with_wastage || item.total_cost || 0);
      });
      return Object.values(map)
        .sort((a, b) => {
          if (a.subsectionCode === 'Unknown') return 1;
          if (b.subsectionCode === 'Unknown') return -1;
          return (a.subsectionCode || '').localeCompare(b.subsectionCode || '', undefined, { numeric: true, sensitivity: 'base' });
        })
        .map((g) => ({ ...g, pct: totalCost > 0 ? (g.subtotal / totalCost) * 100 : 0 }));
    }
    const map = {}, order = [];
    items.forEach((item) => {
      const k = item.takeoff_name || 'Other';
      if (!map[k]) { map[k] = { id: `grp-${order.length}`, name: k, subsectionCode: item.subsection_code, items: [], subtotal: 0 }; order.push(k); }
      map[k].items.push(item);
      map[k].subtotal += (item.total_cost_with_wastage || item.total_cost || 0);
    });
    return order.map((k) => ({ ...map[k], pct: totalCost > 0 ? (map[k].subtotal / totalCost) * 100 : 0 }));
  }, [rawData, searchQuery, groupBy, tradeFilter]);

  /* ── Others group derivations ── */
  const othersItems = useMemo(() => rawData.filter(i => i.is_others_item), [rawData]);

  const othersSubtotal = useMemo(
    () => othersItems.reduce((s, i) => s + (i.total_cost || 0), 0),
    [othersItems]
  );

  const othersPct = useMemo(() => {
    const mainTotal = rawData.filter(i => !i.is_others_item)
      .reduce((s, i) => s + (i.total_cost_with_wastage || i.total_cost || 0), 0);
    const grand = mainTotal + othersSubtotal;
    return grand > 0 ? (othersSubtotal / grand) * 100 : 0;
  }, [rawData, othersSubtotal]);

  const displayedOthersItems = useMemo(() => {
    if (!searchQuery.trim()) return othersItems;
    const q = searchQuery.toLowerCase();
    return othersItems.filter(i => (i.product_name || '').toLowerCase().includes(q));
  }, [othersItems, searchQuery]);

  const totalItemCount = useMemo(
    () => displayGroups.reduce((s, g) => s + g.items.length, 0) + othersItems.length,
    [displayGroups, othersItems]
  );

  const ovGrand = overviewData?.direct_cost_with_wastage ?? 0;
  const ovMat = overviewData?.material_cost_with_wastage ?? 0;
  const ovLab = overviewData?.labour_cost ?? 0;
  const ovMatPct = overviewData?.material_percentage_with_wastage ?? 0;
  const ovLabPct = overviewData?.labour_percentage_with_wastage ?? 0;

  const matActiveCount = hasLoaded ? totalItemCount : cachedMatCount;
  const labInactiveCount = labCount !== null ? String(labCount) : String(cachedLabCount || '–');

  /* ── Editable quantity ── */
  const commitEdit = () => {
    if (!editingCell) return;
    const num = parseFloat(editingValue);
    const cell = editingCell;
    const item = rawData.find((i) => i._id === cell);
    setEditingCell(null); setEditVal('');
    if (!isNaN(num) && num >= 0 && item && num !== parseFloat(item.quantity)) {
      setRawData((prev) => prev.map((i) => i._id === cell ? { ...i, quantity: num } : i));
      if (item) {
        setUpdatingRowId(cell);
        const project_uuid = localStorage.getItem('project_uuid');
        const organization_uuid = localStorage.getItem('organization_uuid');
        const payload = item.is_manual
          ? { project_uuid, organization_uuid, line_id: item.line_id, quantity: num, device_info: getDeviceInfo() }
          : { project_uuid, organization_uuid, product_id: item.product_id, quantity: num, device_info: getDeviceInfo() };
        updateMaterialQuantity(payload)
          .then(() => refreshMaterial())
          .catch(() => showToast('error', 'Failed to update quantity.'))
          .finally(() => setUpdatingRowId(null));
      }
    }
  };

  /* ── Pagination ── */
  const getPage = (id) => pageState[id]?.page ?? 1;
  const getPerPage = (id) => pageState[id]?.perPage ?? 5;
  const setPage = (id, p) => setPageState((prev) => ({ ...prev, [id]: { ...prev[id], page: p, perPage: getPerPage(id) } }));
  const setPerPage = (id, pp) => setPageState((prev) => ({ ...prev, [id]: { page: 1, perPage: pp } }));

  /* ── Selection / collapse ── */
  const toggleItem = (_id) =>
    setSelected((prev) => { const n = new Set(prev); n.has(_id) ? n.delete(_id) : n.add(_id); return n; });

  const toggle = (id) =>
    setCollapsed((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const goToLabor = () => navigate(`/project/view/${uuid}/estimate-builder/labor-estimation`);
  const handleDelete = async () => {
    const project_uuid = localStorage.getItem('project_uuid');
    const organization_uuid = localStorage.getItem('organization_uuid');
    const toDelete = rawData.filter((item) => selectedItems.has(item._id));
    setShowDelete(false);
    setLoading(true);
    try {
      await Promise.all(toDelete.map((item) => {
        const payload = item.is_manual
          ? { project_uuid, organization_uuid, line_id: item.line_id, device_info: getDeviceInfo() }
          : { project_uuid, organization_uuid, product_id: item.product_id, device_info: getDeviceInfo() };
        return deleteEstimationItem(payload);
      }));
      setSelected(new Set());
      showToast('success', 'Items deleted successfully.');
      await refreshMaterial();
    } catch (err) {
      showToast('error', err?.message || 'Failed to delete items.');
    } finally {
      setLoading(false);
    }
  };

  const refreshMaterial = async () => {
    const organization_uuid = localStorage.getItem('organization_uuid');
    const project_uuid = localStorage.getItem('project_uuid');
    const res = await fetchEstimationMaterial({ organization_uuid, project_uuid, device_info: getDeviceInfo() });
    const groups = res?.data?.groups;
    if (Array.isArray(groups)) {
      const freshTagged = [];
      groups.forEach((g) => {
        (g.items || []).forEach((item, i) => {
          freshTagged.push({ ...item, _id: `mat-${g.group_key}-${i}`, takeoff_name: g.label, section_id: g.group_key, subsection_code: item.csi_code, is_others_item: g.group_key === '__others__' });
        });
      });
      setRawData(prev => {
        if (!prev.length || prev.length !== freshTagged.length) return freshTagged;
        // Build lookup by stable key to update values in-place without reordering
        const lookup = new Map();
        freshTagged.forEach(item => {
          const key = item.is_manual ? `manual:${item.line_id}` : `prod:${item.product_id}`;
          lookup.set(key, item);
        });
        return prev.map(old => {
          const key = old.is_manual ? `manual:${old.line_id}` : `prod:${old.product_id}`;
          const fresh = lookup.get(key);
          return fresh ? { ...fresh, _id: old._id } : old;
        });
      });
      localStorage.setItem('est_mat_count', String(freshTagged.length));
      setCachedMatCount(freshTagged.length);
    }
    try {
      const ovRes = await fetchEstimationOverview({ organization_uuid, project_uuid, device_info: getDeviceInfo() });
      if (ovRes?.valid && ovRes.data) {
        setOverviewData(ovRes.data);
        localStorage.setItem('est_overview_data', JSON.stringify(ovRes.data));
      }
    } catch {
      // ignore
    }
  };

  const handleAdd = async (form) => {
    const project_uuid = localStorage.getItem('project_uuid');
    const organization_uuid = localStorage.getItem('organization_uuid');
    setShowAdd(false);
    setLoading(true);
    try {
      const payload = form.is_other_division
        ? { project_uuid, organization_uuid, subsection_id: form.subsection_id, quantity: Number(form.quantity), unit: form.unit_name, unit_cost: Number(form.unit_price) || 0, device_info: getDeviceInfo() }
        : { project_uuid, organization_uuid, product_id: form.product_id, quantity: Number(form.quantity), device_info: getDeviceInfo() };
      await addEstimationLine(payload);
      showToast('success', 'Line item added successfully.');
      await refreshMaterial();
    } catch (err) {
      showToast('error', err?.message || 'Failed to add line item.');
    } finally {
      setLoading(false);
    }
  };
  const grpByLabel = GROUP_BY_LABELS[groupBy] || 'Trade';

  return (
    <div className="tw-mt-1 tw-min-h-screen">
      {loading && <FullPageLoader />}

      {/* ── Page Header ── */}
      <div className="tw-flex tw-items-start tw-justify-between tw-mb-5 tw-gap-4">
        <div>
          <div className="tw-flex tw-items-center tw-gap-2 tw-flex-wrap">
            <span className="tw-text-[18px] tw-text-gray-500 tw-font-medium">Estimate Builder</span>
            <i className="icon-Save-and-Continue tw-text-gray-400" />
            <span className="tw-text-[18px] tw-font-bold tw-text-gray-900">Estimate</span>
          </div>
          <p className="tw-text-[13px] tw-text-[#1e293b] tw-m-0 tw-mt-0.5">
            Detailed material costs by takeoff category
          </p>
        </div>
        <button
          onClick={() => exportEstimateToExcel({
            materialRawData: rawData,
            laborRawData: labRawData,
            overviewData,
            filename: 'Estimate Export.xlsx',
          })}
          className="tw-flex tw-items-center tw-gap-2 tw-px-4 tw-py-2 tw-border tw-border-[#e0e0e0] tw-rounded-[5px] tw-bg-white tw-text-[13px] tw-font-medium hover:tw-bg-slate-50 tw-transition-colors tw-flex-shrink-0"
        >
          <Download size={14} />
          Export
        </button>
      </div>

      {/* ── Summary Cards ── */}
      <div className="tw-grid tw-grid-cols-3 tw-gap-4 tw-mb-5">
        <EstimationCard label="Total bid" value={ovGrand === 0 ? '-' : fmtFull(ovGrand)} subText="Direct costs only" icon={DollarSign} iconColor="#34c759" iconBg="#defde6" loading={!!updatingRowId}/>
        <EstimationCard label="Material" value={ovMat === 0 ? '-' : fmtFull(ovMat)} subText={ovMatPct === 0 ? null : `${ovMatPct}%`}
        icon={Package} iconColor="#3c82f5" iconBg="#d6e6ff"
        loading={!!updatingRowId} />
        <EstimationCard label="Labor" value={ovLab === 0 ? '-' : fmtFull(ovLab)} subText={ovLabPct === 0 && labHours <= 0 ? null : `${ovLabPct}%${labHours > 0 ? ` · ${fmtNum(Math.round(labHours))} hrs` : ''}`}
          icon={Users} iconColor="#5856d6" iconBg="#e6e6ff"/>
      </div>

      {/* ── Tabs ── */}
      <div className="tw-flex tw-items-center tw-gap-4 tw-bg-white tw-p-1.5 tw-rounded-lg tw-w-fit tw-mb-4 tw-border tw-border-[#ededed]">
        <button className="tw-flex tw-items-center tw-gap-4 tw-pl-4 tw-pr-2 tw-py-1.5 tw-text-[14px] tw-rounded-md tw-transition-all tw-duration-150 tw-border-none tw-bg-[#0140c1] tw-text-white tw-shadow-sm tw-cursor-pointer" style={{ minWidth: '110px' }}>
          Materials
          <span className="tw-text-white tw-text-[12px] tw-px-2 tw-py-1 tw-leading-tight tw-min-w-[22px] tw-text-center" style={{ backgroundColor: '#306dd9', borderRadius: '5px' }}>
            {matActiveCount === 0 ? '-' : matActiveCount}
          </span>
        </button>
        <button onClick={goToLabor} className="tw-flex tw-items-center tw-gap-2 tw-px-6 tw-py-1.5 tw-text-[14px] tw-font-medium tw-rounded-md tw-transition-all tw-duration-150 tw-border-none tw-bg-transparent tw-text-[#000] hover:tw-text-[#000] tw-cursor-pointer" style={{ minWidth: '110px' }}>
          Labor
          <span className="tw-bg-[#f4f4f6] tw-text-[#64748B] tw-rounded-[5px] tw-text-[12px] tw-px-2 tw-py-1 tw-leading-tight tw-min-w-[22px] tw-text-center">
            {Number(labInactiveCount) === 0 ? '-' : labInactiveCount}
          </span>
        </button>
      </div>

      {/* ── Filter Bar ── */}
      <div className="tw-bg-white tw-border tw-border-slate-200 tw-rounded-xl tw-px-4 tw-py-3 tw-mb-4 tw-flex tw-gap-3 tw-items-center tw-flex-wrap">
        <div className="tw-relative">
          <Search size={16} className="tw-absolute tw-left-3 tw-top-1/2 -tw-translate-y-1/2 tw-text-[#94A3B8] tw-pointer-events-none" />
          <input
            placeholder="Search Materials..."
            value={searchQuery}
            onChange={(e) => setSearch(e.target.value)}
            className="tw-w-[400px] tw-pl-9 tw-pr-3 tw-py-2 tw-border tw-border-[#e0e0e0] tw-rounded-[5px] tw-text-[14px] tw-text-[#aaaaaa] tw-outline-none"
            style={{ background: '#f4f4f4', fontFamily: 'Poppins, sans-serif' }}
          />
        </div>

        <FilterDropdown
          options={['Trade', 'CSI Division', 'None']}
          value={grpByLabel}
          onChange={(v) => setGroupBy(GROUP_BY_VALUES[v] || 'trade')}
          placeholder="Trade"
          width="tw-w-44"
          label="Group by"
          prefixIcon={<i className="icon-Group-by" style={{ fontSize: 13 }} />}
        />

        <FilterDropdown
          options={tradeList}
          value={tradeFilter}
          onChange={(v) => setTradeFilter(v || 'All Trades')}
          placeholder="All Trades"
          width="tw-w-48"
          label="Trade"
          prefixIcon={<Filter size={13} />}
        />

        {selectedItems.size > 0 && (
          <button
            onClick={() => setShowDelete(true)}
            className="tw-flex tw-items-center tw-gap-2 tw-px-3 tw-py-2 tw-border tw-border-[#b91c1b] tw-rounded-[3px] tw-text-[13px] tw-text-[#b91c1b] tw-bg-[#ffe2e3] tw-transition-colors tw-font-medium"
          >
            <i className="icon-Delete tw-text-[14px]" />
            Delete {selectedItems.size}
          </button>
        )}

        <button
          onClick={() => setShowAdd(true)}
          className="tw-flex tw-items-center tw-gap-2 tw-px-4 tw-py-2 tw-border tw-border-[#0140c1] tw-rounded-md tw-text-[13px] tw-text-[#0140c1] tw-bg-white hover:tw-bg-[#EAF2FF] tw-transition-colors tw-font-medium tw-ml-auto"
        >
          <Plus size={14} />
          Add Line
        </button>
      </div>

      {/* ── Section Groups ── */}
      <div className="tw-flex tw-flex-col tw-gap-2.5">
        {displayGroups.map((group, groupIdx) => {
          const isExpanded = !collapsedGroups.has(group.id);
          const page = getPage(group.id);
          const perPage = getPerPage(group.id);
          const totalPages = Math.ceil(group.items.length / perPage);
          const paginated = group.items.slice((page - 1) * perPage, page * perPage);
          const showPagination = group.items.length > 5;
          const tradeIconClass = (!group.isCsi && !group.isAllItems) ? getTradeIconClass(group.name) : null;
          const palette = SECTION_PALETTE[groupIdx % SECTION_PALETTE.length];
          const displayName = group.isAllItems || group.isCsi ? group.name : normalizeLabel(group.name);
          const isGroupUpdating = !!updatingRowId && group.items.some((i) => i._id === updatingRowId);

          return (
            <div key={group.id} className="tw-bg-white tw-overflow-hidden tw-shadow-sm"
              style={{ border: '1px solid #e2e8f0', borderLeft: `4px solid ${palette.border}`, borderRadius: '5px' }}>
              <div
                className={`tw-flex tw-items-center tw-justify-between tw-px-5 tw-py-4 tw-cursor-pointer hover:tw-bg-slate-50 tw-transition-colors tw-select-none ${isExpanded ? 'tw-border-b tw-border-slate-100' : ''}`}
                onClick={() => toggle(group.id)}
              >
                <div className="tw-flex tw-items-center tw-gap-2">
                  <div className="tw-w-9 tw-h-9 tw-rounded-lg tw-flex tw-items-center tw-justify-center tw-flex-shrink-0" style={{ background: palette.iconBg }}>
                    {group.isCsi
                      ? <i className="icon-Budget-Estimate" style={{ color: palette.iconColor, fontSize: '17px' }} />
                      : group.isAllItems
                        ? <i className="icon-All-Items" style={{ color: palette.iconColor, fontSize: '17px' }} />
                        : <i className={tradeIconClass || ''} style={{ color: palette.iconColor, fontSize: '17px', lineHeight: 1 }} />
                    }
                  </div>
                  <span className="tw-text-[15px] tw-font-bold tw-text-[#0F172A]">{displayName}</span>
                  <span className="tw-text-[11px] tw-font-semibold tw-bg-[#f4f4f6] tw-rounded-[5px] tw-px-2.5 tw-py-1.5">
                    {group.items.length} item{group.items.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="tw-flex tw-items-center tw-gap-3">
                  <div className="tw-hidden sm:tw-flex tw-items-center tw-gap-3">
                    <div className="tw-w-[100px] tw-h-[7px] tw-bg-slate-200 tw-rounded-full tw-overflow-hidden">
                      <div className="tw-h-full tw-rounded-full" style={{ width: `${Math.min(group.pct, 100)}%`, maxWidth: 'calc(100% - 4px)', background: palette.border }} />
                    </div>
                    {isGroupUpdating
                      ? <div className="tw-h-4 tw-w-10 tw-bg-slate-200 tw-rounded tw-animate-pulse" />
                      : <span className="tw-text-[14px] tw-font-semibold tw-text-[#060606] tw-w-[58px] tw-text-right">{group.pct.toFixed(2)}%</span>}
                  </div>
                  <div className="tw-border tw-border-[#4488ff] tw-rounded-[3px] tw-px-4 tw-py-1.5 tw-text-[13px] tw-font-bold tw-text-[#0F172A] tw-bg-[#EAF2FF] tw-min-w-[110px] tw-text-center tw-whitespace-nowrap">
                    {isGroupUpdating
                      ? <div className="tw-h-4 tw-w-20 tw-bg-blue-200 tw-rounded tw-animate-pulse tw-mx-auto" />
                      : fmtFull(group.subtotal)}
                  </div>
                  <div className="tw-flex tw-items-center tw-justify-center tw-w-[25px] tw-h-[25px] tw-border tw-border-[#75787c] tw-rounded-[5px]">
                    <i className={`icon-Dropdown tw-inline-block tw-transition-transform tw-duration-300 ${isExpanded ? 'tw-rotate-180' : 'tw-rotate-0'}`} style={{ fontSize: '18px', color: '#000' }} />
                  </div>
                </div>
              </div>

              <div className={`tw-transition-all tw-duration-300 tw-ease-in-out tw-overflow-hidden ${isExpanded ? 'tw-max-h-[3000px] tw-opacity-100' : 'tw-max-h-0 tw-opacity-0'}`}>
                <table className="tw-w-full tw-border-collapse" style={{ tableLayout: 'fixed' }}>
                  <colgroup>
                    <col style={{ width: '3%' }} />
                    <col style={{ width: '30%' }} />
                    <col style={{ width: '11%' }} />
                    <col style={{ width: '13%' }} />
                    <col style={{ width: '9%' }} />
                    <col style={{ width: '14%' }} />
                    <col style={{ width: '20%' }} />
                  </colgroup>
                  <thead>
                    <tr className="tw-bg-[#fafafa]">
                      <th className="tw-px-4 tw-py-3.5" />
                      <th className="tw-px-4 tw-py-3.5 tw-text-[13px] tw-font-medium tw-text-[#6e7178] tw-text-left tw-border-b tw-border-slate-100">PRODUCT NAME</th>
                      <th className="tw-px-4 tw-py-3.5 tw-text-[13px] tw-font-medium tw-text-[#6e7178] tw-text-left tw-border-b tw-border-slate-100">QUANTITY</th>
                      <th className="tw-px-4 tw-py-3.5 tw-text-[13px] tw-font-medium tw-text-[#6e7178] tw-text-left tw-border-b tw-border-slate-100 tw-leading-tight">
                        QUANTITY<br /><span style={{ fontSize: '11px' }}>INCL. WASTAGE</span>
                      </th>
                      <th className="tw-px-4 tw-py-3.5 tw-text-[13px] tw-font-medium tw-text-[#6e7178] tw-text-center tw-border-b tw-border-slate-100">UNIT</th>
                      <th className="tw-px-4 tw-py-3.5 tw-text-[13px] tw-font-medium tw-text-[#6e7178] tw-text-right tw-border-b tw-border-slate-100">UNIT COST</th>
                      <th className="tw-px-4 tw-py-3.5 tw-text-[13px] tw-font-medium tw-text-[#6e7178] tw-text-right tw-border-b tw-border-slate-100">TOTAL COST</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginated.map((item) => (
                      <tr key={item._id} className={`tw-border-b tw-border-[#e0e0e0] last:tw-border-b-0 tw-transition-colors ${selectedItems.has(item._id) ? 'tw-bg-[#EAF2FF]' : 'hover:tw-bg-slate-50'}`}>
                        <td className="tw-px-4 tw-py-4">
                          <input type="checkbox" checked={selectedItems.has(item._id)} onChange={() => toggleItem(item._id)} onClick={(e) => e.stopPropagation()} className="tw-w-4 tw-h-4 tw-cursor-pointer tw-accent-[#0140c1]" />
                        </td>
                        <td className="tw-px-4 tw-py-4">
                          <TextWithTooltip
                            text={item.product_name}
                            className="tw-text-[13px] tw-font-semibold tw-text-[#0F172A] tw-mb-0.5"
                            style={{ maxWidth: '100%' }}
                            width="100%"
                          />
                          <p className="tw-text-[11px] tw-text-[#94A3B8] tw-m-0">
                            {item.is_others_item
                              ? (item.subsection_code ? `CSI ${item.subsection_code}` : '')
                              : `${item.subsection_code ? `CSI ${item.subsection_code} · ` : ''}Waste ${item.wastage_percentage}%`}
                          </p>
                        </td>
                        <td
                          className="tw-px-4 tw-py-4"
                          onClick={() => { setEditingCell(item._id); setEditVal(String(item.quantity ?? 0)); }}
                        >
                          {editingCell === item._id ? (
                            <input
                              autoFocus type="number" min="0" value={editingValue}
                              onChange={(e) => setEditVal(e.target.value)}
                              onBlur={commitEdit}
                              onKeyDown={(e) => { if (e.key === 'Enter') commitEdit(); if (e.key === 'Escape') { setEditingCell(null); setEditVal(''); } }}
                              onClick={(e) => e.stopPropagation()}
                              className="tw-w-[80px] tw-border tw-border-[#0140c1] tw-rounded tw-px-2 tw-py-1 tw-text-[13px] tw-outline-none tw-min-w-[70px]"
                            />
                          ) : (
                            <span className="tw-text-[13px] tw-cursor-text tw-inline-block tw-px-2 tw-py-0.5 tw-rounded tw-border tw-border-transparent hover:tw-border-[#c8ddff] hover:tw-bg-[#EAF2FF] tw-transition-colors">
                              {fmtNum(item.quantity)}
                            </span>
                          )}
                        </td>
                        <td className="tw-px-4 tw-py-4 tw-text-[13px]">
                          {updatingRowId === item._id
                            ? <div className="tw-h-4 tw-w-16 tw-bg-slate-200 tw-rounded tw-animate-pulse" />
                            : fmtNum(item.quantity_with_wastage)}
                        </td>
                        <td className="tw-px-4 tw-py-4 tw-text-[13px] tw-text-center">{item.unit}</td>
                        <td className="tw-px-4 tw-py-4 tw-text-[13px] tw-text-right">{fmtFull(item.unit_cost)}</td>
                        <td className="tw-px-4 tw-py-4 tw-text-[13px] tw-text-right">
                          {updatingRowId === item._id
                            ? <div className="tw-h-4 tw-w-20 tw-bg-slate-200 tw-rounded tw-animate-pulse tw-ml-auto" />
                            : fmtFull(item.total_cost_with_wastage)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {showPagination && (
                  <div className="tw-flex tw-items-center tw-justify-between tw-px-5 tw-py-3 tw-border-t tw-border-slate-100 tw-bg-[#F8FAFC]">
                    <div className="tw-flex tw-items-center tw-gap-2">
                      <span className="tw-text-[13px] tw-text-[#64748B]">Show</span>
                      <FilterDropdown
                        options={['5', '10', '20']}
                        value={String(perPage)}
                        onChange={(v) => setPerPage(group.id, +v)}
                        width="tw-w-20"
                        hideCheck
                      />
                    </div>
                    <div className="tw-flex tw-items-center tw-gap-2">
                      <button onClick={(e) => { e.stopPropagation(); setPage(group.id, page - 1); }} disabled={page === 1} className="tw-w-8 tw-h-8 tw-flex tw-items-center tw-justify-center tw-border tw-border-slate-200 tw-rounded-md tw-bg-white disabled:tw-opacity-40 disabled:tw-cursor-not-allowed hover:tw-bg-slate-50 tw-transition-colors">
                        <ChevronLeft size={13} className="tw-text-[#64748B]" />
                      </button>
                      <span className="tw-text-[13px] tw-text-[#64748B] tw-whitespace-nowrap">Page {page} of {Math.max(totalPages, 1)}</span>
                      <button onClick={(e) => { e.stopPropagation(); setPage(group.id, page + 1); }} disabled={page >= totalPages} className="tw-w-8 tw-h-8 tw-flex tw-items-center tw-justify-center tw-border tw-border-slate-200 tw-rounded-md tw-bg-white disabled:tw-opacity-40 disabled:tw-cursor-not-allowed hover:tw-bg-slate-50 tw-transition-colors">
                        <ChevronRight size={13} className="tw-text-[#64748B]" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {displayGroups.length === 0 && othersItems.length === 0 && !loading && (
          <div className="tw-bg-white tw-border tw-border-slate-200 tw-rounded-xl tw-p-12 tw-text-center">
            <p className="tw-text-[13px] tw-text-[#94A3B8] tw-m-0">
              {searchQuery ? `No results for "${searchQuery}"` : 'No material data available'}
            </p>
          </div>
        )}

        {/* ── Others Section (hidden when grouped by CSI — others are folded into CSI groups) ── */}
        {othersItems.length > 0 && groupBy !== 'csi' && (tradeFilter === 'All Trades' || tradeFilter === 'Others') && (() => {
          const OTHERS_ID = '__others__';
          const isExpanded = !collapsedGroups.has(OTHERS_ID);
          const page = getPage(OTHERS_ID);
          const perPage = getPerPage(OTHERS_ID);
          const totalPages = Math.ceil(displayedOthersItems.length / perPage);
          const paginated = displayedOthersItems.slice((page - 1) * perPage, page * perPage);
          const showPagination = displayedOthersItems.length > 5;
          const isGroupUpdating = !!updatingRowId && othersItems.some(i => i._id === updatingRowId);

          return (
            <div className="tw-bg-white tw-overflow-hidden tw-shadow-sm"
              style={{ border: '1px solid #e2e8f0', borderLeft: '4px solid #64748b', borderRadius: '5px' }}>
              <div
                className={`tw-flex tw-items-center tw-justify-between tw-px-5 tw-py-4 tw-cursor-pointer hover:tw-bg-slate-50 tw-transition-colors tw-select-none ${isExpanded ? 'tw-border-b tw-border-slate-100' : ''}`}
                onClick={() => toggle(OTHERS_ID)}
              >
                <div className="tw-flex tw-items-center tw-gap-2">
                  <div className="tw-w-9 tw-h-9 tw-rounded-lg tw-flex tw-items-center tw-justify-center tw-flex-shrink-0" style={{ background: '#F1F5F9' }}>
                    <FileText size={17} style={{ color: '#475569' }} />
                  </div>
                  <span className="tw-text-[15px] tw-font-bold tw-text-[#0F172A]">Others</span>
                  <span className="tw-text-[11px] tw-font-semibold tw-bg-[#f4f4f6] tw-rounded-[5px] tw-px-2.5 tw-py-1.5">
                    {displayedOthersItems.length} item{displayedOthersItems.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="tw-flex tw-items-center tw-gap-3">
                  <div className="tw-hidden sm:tw-flex tw-items-center tw-gap-3">
                    <div className="tw-w-[100px] tw-h-[7px] tw-bg-slate-200 tw-rounded-full tw-overflow-hidden">
                      <div className="tw-h-full tw-rounded-full" style={{ width: `${Math.min(othersPct, 100)}%`, maxWidth: 'calc(100% - 4px)', background: '#64748b' }} />
                    </div>
                    {isGroupUpdating
                      ? <div className="tw-h-4 tw-w-10 tw-bg-slate-200 tw-rounded tw-animate-pulse" />
                      : <span className="tw-text-[14px] tw-font-semibold tw-text-[#060606] tw-w-[58px] tw-text-right">{othersPct.toFixed(2)}%</span>}
                  </div>
                  <div className="tw-border tw-border-[#4488ff] tw-rounded-[3px] tw-px-4 tw-py-1.5 tw-text-[13px] tw-font-bold tw-text-[#0F172A] tw-bg-[#EAF2FF] tw-min-w-[110px] tw-text-center tw-whitespace-nowrap">
                    {isGroupUpdating
                      ? <div className="tw-h-4 tw-w-20 tw-bg-blue-200 tw-rounded tw-animate-pulse tw-mx-auto" />
                      : fmtFull(othersSubtotal)}
                  </div>
                  <div className="tw-flex tw-items-center tw-justify-center tw-w-[25px] tw-h-[25px] tw-border tw-border-[#75787c] tw-rounded-[5px]">
                    <i className={`icon-Dropdown tw-inline-block tw-transition-transform tw-duration-300 ${isExpanded ? 'tw-rotate-180' : 'tw-rotate-0'}`} style={{ fontSize: '18px', color: '#000' }} />
                  </div>
                </div>
              </div>

              <div className={`tw-transition-all tw-duration-300 tw-ease-in-out tw-overflow-hidden ${isExpanded ? 'tw-max-h-[3000px] tw-opacity-100' : 'tw-max-h-0 tw-opacity-0'}`}>
                <table className="tw-w-full tw-border-collapse" style={{ tableLayout: 'fixed' }}>
                  <colgroup>
                    <col style={{ width: '3%' }} />
                    <col style={{ width: '30%' }} />
                    <col style={{ width: '11%' }} />
                    {/* <col style={{ width: '13%' }} /> */}
                    <col style={{ width: '9%' }} />
                    <col style={{ width: '14%' }} />
                    <col style={{ width: '20%' }} />
                  </colgroup>
                  <thead>
                    <tr className="tw-bg-[#fafafa]">
                      <th className="tw-px-4 tw-py-3.5" />
                      <th className="tw-px-4 tw-py-3.5 tw-text-[13px] tw-font-medium tw-text-[#6e7178] tw-text-left tw-border-b tw-border-slate-100">PRODUCT NAME</th>
                      <th className="tw-px-4 tw-py-3.5 tw-text-[13px] tw-font-medium tw-text-[#6e7178] tw-text-left tw-border-b tw-border-slate-100">QUANTITY</th>
                      {/* <th className="tw-px-4 tw-py-3.5 tw-text-[13px] tw-font-medium tw-text-[#6e7178] tw-text-left tw-border-b tw-border-slate-100 tw-leading-tight">
                        QUANTITY<br /><span style={{ fontSize: '11px' }}>INCL. WASTAGE</span>
                      </th> */}
                      <th className="tw-px-4 tw-py-3.5 tw-text-[13px] tw-font-medium tw-text-[#6e7178] tw-text-center tw-border-b tw-border-slate-100">UNIT</th>
                      <th className="tw-px-4 tw-py-3.5 tw-text-[13px] tw-font-medium tw-text-[#6e7178] tw-text-right tw-border-b tw-border-slate-100">UNIT COST</th>
                      <th className="tw-px-4 tw-py-3.5 tw-text-[13px] tw-font-medium tw-text-[#6e7178] tw-text-right tw-border-b tw-border-slate-100">TOTAL COST</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginated.map(item => (
                      <tr key={item._id} className={`tw-border-b tw-border-[#e0e0e0] last:tw-border-b-0 tw-transition-colors ${selectedItems.has(item._id) ? 'tw-bg-[#EAF2FF]' : 'hover:tw-bg-slate-50'}`}>
                        <td className="tw-px-4 tw-py-4">
                          <input type="checkbox" checked={selectedItems.has(item._id)} onChange={() => toggleItem(item._id)} onClick={e => e.stopPropagation()} className="tw-w-4 tw-h-4 tw-cursor-pointer tw-accent-[#0140c1]" />
                        </td>
                        <td className="tw-px-4 tw-py-4">
                          <TextWithTooltip text={item.product_name} className="tw-text-[13px] tw-font-semibold tw-text-[#0F172A] tw-mb-0.5" style={{ maxWidth: '100%' }} width="100%" />
                          {item.subsection_code && (
                            <p className="tw-text-[11px] tw-text-[#94A3B8] tw-m-0">CSI {item.subsection_code}</p>
                          )}
                        </td>
                        <td className="tw-px-4 tw-py-4" onClick={() => { setEditingCell(item._id); setEditVal(String(item.quantity ?? 0)); }}>
                          {editingCell === item._id ? (
                            <input
                              autoFocus type="number" min="0" value={editingValue}
                              onChange={e => setEditVal(e.target.value)}
                              onBlur={commitEdit}
                              onKeyDown={e => { if (e.key === 'Enter') commitEdit(); if (e.key === 'Escape') { setEditingCell(null); setEditVal(''); } }}
                              onClick={e => e.stopPropagation()}
                              className="tw-w-[80px] tw-border tw-border-[#0140c1] tw-rounded tw-px-2 tw-py-1 tw-text-[13px] tw-outline-none tw-min-w-[70px]"
                            />
                          ) : (
                            <span className="tw-text-[13px] tw-cursor-text tw-inline-block tw-px-2 tw-py-0.5 tw-rounded tw-border tw-border-transparent hover:tw-border-[#c8ddff] hover:tw-bg-[#EAF2FF] tw-transition-colors">
                              {fmtNum(item.quantity)}
                            </span>
                          )}
                        </td>
                        {/* <td className="tw-px-4 tw-py-4 tw-text-[13px]">
                          {updatingRowId === item._id
                            ? <div className="tw-h-4 tw-w-16 tw-bg-slate-200 tw-rounded tw-animate-pulse" />
                            : fmtNum(item.quantity_with_wastage ?? item.quantity)}
                        </td> */}
                        <td className="tw-px-4 tw-py-4 tw-text-[13px] tw-text-center">{item.unit}</td>
                        <td className="tw-px-4 tw-py-4 tw-text-[13px] tw-text-right">{fmtFull(item.unit_cost)}</td>
                        <td className="tw-px-4 tw-py-4 tw-text-[13px] tw-text-right">
                          {updatingRowId === item._id
                            ? <div className="tw-h-4 tw-w-20 tw-bg-slate-200 tw-rounded tw-animate-pulse tw-ml-auto" />
                            : fmtFull(item.total_cost_with_wastage ?? item.total_cost)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {showPagination && (
                  <div className="tw-flex tw-items-center tw-justify-between tw-px-5 tw-py-3 tw-border-t tw-border-slate-100 tw-bg-[#F8FAFC]">
                    <div className="tw-flex tw-items-center tw-gap-2">
                      <span className="tw-text-[13px] tw-text-[#64748B]">Show</span>
                      <FilterDropdown options={['5', '10', '20']} value={String(perPage)} onChange={v => setPerPage(OTHERS_ID, +v)} width="tw-w-20" hideCheck />
                    </div>
                    <div className="tw-flex tw-items-center tw-gap-2">
                      <button onClick={e => { e.stopPropagation(); setPage(OTHERS_ID, page - 1); }} disabled={page === 1} className="tw-w-8 tw-h-8 tw-flex tw-items-center tw-justify-center tw-border tw-border-slate-200 tw-rounded-md tw-bg-white disabled:tw-opacity-40 disabled:tw-cursor-not-allowed hover:tw-bg-slate-50 tw-transition-colors">
                        <ChevronLeft size={13} className="tw-text-[#64748B]" />
                      </button>
                      <span className="tw-text-[13px] tw-text-[#64748B] tw-whitespace-nowrap">Page {page} of {Math.max(totalPages, 1)}</span>
                      <button onClick={e => { e.stopPropagation(); setPage(OTHERS_ID, page + 1); }} disabled={page >= totalPages} className="tw-w-8 tw-h-8 tw-flex tw-items-center tw-justify-center tw-border tw-border-slate-200 tw-rounded-md tw-bg-white disabled:tw-opacity-40 disabled:tw-cursor-not-allowed hover:tw-bg-slate-50 tw-transition-colors">
                        <ChevronRight size={13} className="tw-text-[#64748B]" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })()}
      </div>

      {showDelete && (
        <DeleteModal entity="estimation" action="delete" subscriptionCount={selectedItems.size} icon="icon-Alert---fill" onConfirm={handleDelete} onClose={() => setShowDelete(false)} />
      )}
      {showAdd && <AddLineModal onAdd={handleAdd} onClose={() => setShowAdd(false)} />}
    </div>
  );
}
