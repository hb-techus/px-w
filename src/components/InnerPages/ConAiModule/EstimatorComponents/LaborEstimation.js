import React, { useState, useMemo, useEffect } from 'react';
import {
  ChevronLeft, ChevronRight, Search, Download, Filter,
  Package,
  Users, DollarSign,
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { fetchEstimationLabour, fetchEstimationOverview, deleteLabourCrew, updateLabourHours, fetchEstimationMaterial } from '../../../../services/techus-services';
import { exportEstimateToExcel } from './ExportEstimateToExcel';
import { showToast } from '../../../../genriccomponents/techus-ToastNotification';
import { getDeviceInfo } from '../../../../utils/getDeviceInfo';
import { normalizeItemName, normalizeLabel } from '../../../../utils/textUtils';
import DeleteModal from '../../../../genriccomponents/DeleteModal';
import FilterDropdown from '../../../../genriccomponents/FilterDropdown';
import FullPageLoader from '../../../../genriccomponents/loaders/FullPageLoader';
import CrewBreakdownModal from './CrewBreakdownModal';
import EstimationCard from './EstimationCard';

/* ─── Helpers ─── */
const fmtFull = (v) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v ?? 0);
const fmtNum = (n) => Number(n ?? 0).toLocaleString('en-US');
const fmtHrs1 = (v) =>
  new Intl.NumberFormat('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(v ?? 0);
const fmtHrs2 = (v) =>
  new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v ?? 0);

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
export default function LaborEstimation() {
  const navigate = useNavigate();
  const { uuid } = useParams();

  const [rawData, setRawData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearch] = useState('');
  const [groupBy, setGroupBy] = useState('trade');
  const [tradeFilter, setTradeFilter] = useState('All Trades');
  const [selectedCrews, setSelected] = useState(new Set());
  const [collapsedGroups, setCollapsed] = useState(new Set());
  const [pageState, setPageState] = useState({});
  const [showDelete, setShowDelete] = useState(false);
  const [crewModal, setCrewModal] = useState(null);
  const [editingCell, setEditingCell] = useState(null);
  const [editingValue, setEditVal] = useState('');

  const [overviewData, setOverviewData] = useState(() => {
    try { const c = localStorage.getItem('est_overview_data'); return c ? JSON.parse(c) : null; }
    catch { return null; }
  });
  const [updatingRowId, setUpdatingRowId] = useState(null);
  const [matCount, setMatCount] = useState(null);
  const [matRawData, setMatRawData] = useState([]);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [cachedMatCount, setCachedMatCount] = useState(() => {
    return Number(localStorage.getItem('est_mat_count') || 0);
  });
  const [cachedLabCount, setCachedLabCount] = useState(() => {
    return Number(localStorage.getItem('est_lab_count') || 0);
  });
  const [cachedTotalHours, setCachedTotalHours] = useState(() => parseFloat(localStorage.getItem('est_lab_hours') || '0'));

  /* ── Fetch material count for inactive tab ── */
  useEffect(() => {
    const organization_uuid = localStorage.getItem('organization_uuid');
    const project_uuid = localStorage.getItem('project_uuid');
    fetchEstimationMaterial({ organization_uuid, project_uuid, device_info: getDeviceInfo() })
      .then((res) => {
        const count = res?.data?.total_items ?? res?.data?.item_count
          ?? (Array.isArray(res?.data?.groups)
            ? res.data.groups.reduce((s, g) => s + (g.items || []).length, 0)
            : null);
        if (count !== null) {
          setMatCount(String(count));
          localStorage.setItem('est_mat_count', String(count));
          setCachedMatCount(count);
        }
        const groups = res?.data?.groups;
        if (Array.isArray(groups)) {
          const tagged = [];
          groups.forEach((g) => {
            (g.items || []).forEach((item, i) => {
              tagged.push({ ...item, _id: `mat-${g.group_key}-${i}`, takeoff_name: g.label, section_id: g.group_key, subsection_code: item.csi_code, is_others_item: g.group_key === '__others__' });
            });
          });
          setMatRawData(tagged);
        }
      })
      .catch(() => {});
  }, []);

  /* ── Fetch labor table data ── */
  useEffect(() => {
    const organization_uuid = localStorage.getItem('organization_uuid');
    const project_uuid = localStorage.getItem('project_uuid');
    setLoading(true);
    fetchEstimationLabour({ organization_uuid, project_uuid, device_info: getDeviceInfo() })
      .then((res) => {
        const groups = res?.data?.groups;
        if (!Array.isArray(groups)) { setRawData([]); return; }
        const tagged = [];
        groups.forEach((g) => {
          (g.rows || []).forEach((row, i) => {
            tagged.push({ ...row, _id: `lab-${g.group_key}-${i}`, takeoff_name: g.label, section_id: g.group_key, subsection_code: row.csi_code });
          });
        });
        setRawData(tagged);
        const hrs = tagged.reduce((s, r) => s + (r.hours || 0), 0);
        localStorage.setItem('est_lab_hours', String(hrs));
        setCachedTotalHours(hrs);
        const crewCount = res?.data?.crew_count ?? tagged.length;
        localStorage.setItem('est_lab_count', String(crewCount));
        setCachedLabCount(crewCount);
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
      .catch(() => {});
  }, []);

  /* ── Trade filter list (normalized for display) ── */
  const tradeList = useMemo(() => {
    const set = new Set();
    rawData.forEach((item) => { if (item.takeoff_name) set.add(item.takeoff_name); });
    return ['All Trades', ...[...set].map((t) => normalizeLabel(t))];
  }, [rawData]);

  /* ── Build display groups ── */
  const displayGroups = useMemo(() => {
    let items = [...rawData].sort((a, b) =>
      (a.area_name || '').localeCompare(b.area_name || '', undefined, { numeric: true, sensitivity: 'base' })
    );
    if (tradeFilter !== 'All Trades') items = items.filter((i) => normalizeLabel(i.takeoff_name) === tradeFilter);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      items = items.filter((i) =>
        (i.crew_name || '').toLowerCase().includes(q) ||
        (i.item_name || '').toLowerCase().includes(q) ||
        (i.takeoff_name || '').toLowerCase().includes(q)
      );
    }
    const totalCost = items.reduce((s, i) => s + (i.total_cost || 0), 0);

    if (groupBy === 'none') {
      const subtotal = totalCost;
      const totalHrs = items.reduce((s, i) => s + (i.hours || 0), 0);
      return [{ id: 'all', name: 'All Items', isAllItems: true, pct: 100, subtotal, totalHours: totalHrs, crews: items }];
    }

    if (groupBy === 'csi') {
      const map = {};
      items.forEach((item) => {
        const k = item.subsection_code || 'Unknown';
        const lbl = k !== 'Unknown' ? `CSI ${k}` : 'Unknown';
        if (!map[k]) map[k] = { id: `csi-${k}`, name: lbl, isCsi: true, subsectionCode: k, crews: [], subtotal: 0, totalHours: 0 };
        map[k].crews.push(item);
        map[k].subtotal += (item.total_cost || 0);
        map[k].totalHours += (item.hours || 0);
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
      if (!map[k]) { map[k] = { id: `grp-${order.length}`, name: k, subsectionCode: item.subsection_code, crews: [], subtotal: 0, totalHours: 0 }; order.push(k); }
      map[k].crews.push(item);
      map[k].subtotal += (item.total_cost || 0);
      map[k].totalHours += (item.hours || 0);
    });
    return order.map((k) => ({ ...map[k], pct: totalCost > 0 ? (map[k].subtotal / totalCost) * 100 : 0 }));
  }, [rawData, searchQuery, groupBy, tradeFilter]);

  const totalCrewCount = useMemo(() => displayGroups.reduce((s, g) => s + g.crews.length, 0), [displayGroups]);
  const totalHoursAll = useMemo(() => rawData.reduce((s, i) => s + (i.hours || 0), 0), [rawData]);
  const displayHours = hasLoaded ? totalHoursAll : cachedTotalHours;

  const ovGrand = overviewData?.direct_cost_with_wastage ?? 0;
  const ovMat = overviewData?.material_cost_with_wastage ?? 0;
  const ovLab = overviewData?.labour_cost ?? 0;
  const ovMatPct = overviewData?.material_percentage_with_wastage ?? 0;
  const ovLabPct = overviewData?.labour_percentage_with_wastage ?? 0;

  const labActiveCount = hasLoaded ? totalCrewCount : cachedLabCount;
  const matInactiveCount = matCount !== null ? String(matCount) : String(cachedMatCount || '–');

  /* ── Pagination ── */
  const getPage = (id) => pageState[id]?.page ?? 1;
  const getPerPage = (id) => pageState[id]?.perPage ?? 5;
  const setPage = (id, p) => setPageState((prev) => ({ ...prev, [id]: { ...prev[id], page: p, perPage: getPerPage(id) } }));
  const setPerPage = (id, pp) => setPageState((prev) => ({ ...prev, [id]: { page: 1, perPage: pp } }));

  /* ── Selection ── */
  const toggleCrew = (_id) =>
    setSelected((prev) => { const n = new Set(prev); n.has(_id) ? n.delete(_id) : n.add(_id); return n; });

  const toggle = (id) =>
    setCollapsed((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const refreshLabour = async () => {
    const organization_uuid = localStorage.getItem('organization_uuid');
    const project_uuid = localStorage.getItem('project_uuid');
    const res = await fetchEstimationLabour({ organization_uuid, project_uuid, device_info: getDeviceInfo() });
    const groups = res?.data?.groups;
    if (Array.isArray(groups)) {
      const freshTagged = [];
      groups.forEach((g) => {
        (g.rows || []).forEach((row, i) => {
          freshTagged.push({ ...row, _id: `lab-${g.group_key}-${i}`, takeoff_name: g.label, section_id: g.group_key, subsection_code: row.csi_code });
        });
      });
      setRawData(prev => {
        if (!prev.length || prev.length !== freshTagged.length) return freshTagged;
        const lookup = new Map();
        freshTagged.forEach(item => lookup.set(`${item.crew_id}:${item.item_id}`, item));
        return prev.map(old => {
          const fresh = lookup.get(`${old.crew_id}:${old.item_id}`);
          return fresh ? { ...fresh, _id: old._id } : old;
        });
      });
      const crewCount = res?.data?.crew_count ?? freshTagged.length;
      localStorage.setItem('est_lab_count', String(crewCount));
      setCachedLabCount(crewCount);
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

  /* ── Editable hours ── */
  const commitEditHours = () => {
    if (!editingCell) return;
    const num = parseFloat(editingValue);
    const cell = editingCell;
    const item = rawData.find((i) => i._id === cell);
    setEditingCell(null); setEditVal('');
    if (!isNaN(num) && num >= 0 && item && num !== parseFloat(item.hours)) {
      setRawData((prev) => prev.map((i) => i._id === cell ? { ...i, hours: num } : i));
      if (item) {
        setUpdatingRowId(cell);
        const project_uuid = localStorage.getItem('project_uuid');
        const organization_uuid = localStorage.getItem('organization_uuid');
        updateLabourHours({ project_uuid, organization_uuid, crew_id: item.crew_id, item_id: item.item_id, total_hours: num, device_info: getDeviceInfo() })
          .then(() => refreshLabour())
          .catch(() => showToast('error', 'Failed to update hours.'))
          .finally(() => setUpdatingRowId(null));
      }
    }
  };

  const goToMaterial = () => navigate(`/project/view/${uuid}/estimate-builder/material-estimation`);

  const openCrewBreakdown = (crew) => {
    setCrewModal({
      title: crew.crew_name,
      members: (crew.members || []).map((d) => ({
        role: d.worker_name,
        wage: d.wage ?? 0,
        hours: d.hours ?? 0,
        total: d.total_cost ?? 0,
      })),
      totalHours: crew.hours || 0,
      crewTotal: crew.total_cost || 0,
    });
  };

  const handleDelete = async () => {
    const project_uuid = localStorage.getItem('project_uuid');
    const organization_uuid = localStorage.getItem('organization_uuid');
    const toDelete = rawData.filter((item) => selectedCrews.has(item._id));
    setShowDelete(false);
    setLoading(true);
    try {
      await Promise.all(toDelete.map((item) =>
        deleteLabourCrew({ project_uuid, organization_uuid, crew_id: item.crew_id, item_id: item.item_id, device_info: getDeviceInfo() })
      ));
      setSelected(new Set());
      showToast('success', 'Items deleted successfully.');
      await refreshLabour();
    } catch (err) {
      showToast('error', err?.message || 'Failed to delete items.');
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
            Detailed labor costs by takeoff category
          </p>
        </div>
        <button
          onClick={() => exportEstimateToExcel({
            materialRawData: matRawData,
            laborRawData: rawData,
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
          icon={Package} iconColor="#3c82f5" iconBg="#d6e6ff" />
        <EstimationCard label="Labor" value={ovLab === 0 ? '-' : fmtFull(ovLab)} subText={ovLabPct === 0 && displayHours <= 0 ? null : `${ovLabPct}%${displayHours > 0 ? ` · ${fmtNum(Math.round(displayHours))} hrs` : ''}`}
          icon={Users} iconColor="#5856d6" iconBg="#e6e6ff" loading={!!updatingRowId} />
      </div>

      {/* ── Tabs ── */}
      <div className="tw-flex tw-items-center tw-gap-4 tw-bg-white tw-p-1.5 tw-rounded-lg tw-w-fit tw-mb-4 tw-border tw-border-[#ededed]">
        <button onClick={goToMaterial} className="tw-flex tw-items-center tw-gap-2 tw-px-6 tw-py-1.5 tw-text-[14px] tw-font-medium tw-rounded-md tw-transition-all tw-duration-150 tw-border-none tw-bg-transparent tw-text-[#000] hover:tw-text-[#000] tw-cursor-pointer" style={{ minWidth: '110px' }}>
          Materials
          <span className="tw-bg-[#f4f4f6] tw-text-[#64748B] tw-text-[12px] tw-rounded-[5px] tw-px-2 tw-py-1 tw-leading-tight tw-min-w-[22px] tw-text-center">
            {Number(matInactiveCount) === 0 ? '-' : matInactiveCount}
          </span>
        </button>
        <button className="tw-flex tw-items-center tw-gap-4 tw-pl-6 tw-pr-2 tw-py-1.5 tw-text-[14px] tw-rounded-md tw-transition-all tw-duration-150 tw-border-none tw-bg-[#0140c1] tw-text-white tw-shadow-sm tw-cursor-pointer" style={{ minWidth: '110px' }}>
          Labor
          <span className="tw-text-white tw-text-[12px] tw-px-2 tw-py-1 tw-leading-tight tw-min-w-[22px] tw-text-center" style={{ backgroundColor: '#306dd9', borderRadius: '5px' }}>
            {labActiveCount === 0 ? '-' : labActiveCount}
          </span>
        </button>
      </div>

      {/* ── Filter Bar ── */}
      <div className="tw-bg-white tw-border tw-border-slate-200 tw-rounded-xl tw-px-4 tw-py-3 tw-mb-4 tw-flex tw-gap-3 tw-items-center tw-flex-wrap">
        <div className="tw-relative">
          <Search size={14} className="tw-absolute tw-left-3 tw-top-1/2 -tw-translate-y-1/2 tw-text-[#94A3B8] tw-pointer-events-none" />
          <input
            placeholder="Search Labor..."
            value={searchQuery}
            onChange={(e) => setSearch(e.target.value)}
            className="tw-w-[400px] tw-pl-9 tw-pr-3 tw-py-2 tw-border tw-border-[#e0e0e0] tw-rounded-lg tw-text-[14px] tw-text-[#aaaaaa] tw-outline-none"
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

        {selectedCrews.size > 0 && (
          <button
            onClick={() => setShowDelete(true)}
            className="tw-flex tw-items-center tw-gap-2 tw-px-3 tw-py-2 tw-border tw-border-[#b91c1b] tw-rounded-[3px] tw-text-[13px] tw-text-[#b91c1b] tw-bg-[#ffe2e3] tw-transition-colors tw-font-medium"
          >
            <i className="icon-Delete tw-text-[14px]" />
            Delete {selectedCrews.size}
          </button>
        )}
      </div>

      {/* ── Section Groups ── */}
      <div className="tw-flex tw-flex-col tw-gap-2.5">
        {displayGroups.map((group, groupIdx) => {
          const isExpanded = !collapsedGroups.has(group.id);
          const page = getPage(group.id);
          const perPage = getPerPage(group.id);
          const totalPages = Math.ceil(group.crews.length / perPage);
          const paginated = group.crews.slice((page - 1) * perPage, page * perPage);
          const showPagination = group.crews.length > 5;
          const tradeIconClass = (!group.isCsi && !group.isAllItems) ? getTradeIconClass(group.name) : null;
          const palette = SECTION_PALETTE[groupIdx % SECTION_PALETTE.length];
          const displayName = group.isAllItems || group.isCsi ? group.name : normalizeLabel(group.name);
          const isGroupUpdating = !!updatingRowId && group.crews.some((c) => c._id === updatingRowId);

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
                  <span className="tw-text-[11px] tw-font-semibold tw-bg-[#f4f4f6]  tw-rounded-[5px] tw-px-2.5 tw-py-1.5">
                    {group.crews.length} crew{group.crews.length !== 1 ? 's' : ''}
                  </span>
                  <span className="tw-text-[11px] tw-font-semibold tw-bg-[#f4f4f6]  tw-rounded-[5px] tw-px-2.5 tw-py-1.5">
                    {fmtHrs1(group.totalHours)} hrs
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
                  <div className="tw-border tw-border-[#4488ff] tw-rounded-[3px] tw-px-4 tw-py-1.5 tw-text-[13px] tw-font-bold tw-text-[#0F172A] tw-bg-[#EAF2FF] tw-min-w-[110px] tw-text-center">
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
                    <col style={{ width: '26%' }} />
                    <col style={{ width: '27%' }} />
                    <col style={{ width: '15%' }} />
                    <col style={{ width: '14%' }} />
                    <col style={{ width: '15%' }} />
                  </colgroup>
                  <thead>
                    <tr className="tw-bg-[#fafafa]">
                      <th className="tw-px-4 tw-py-3.5" />
                      <th className="tw-px-4 tw-py-3.5 tw-text-[13px] tw-font-medium tw-text-[#6e7178] tw-text-left tw-border-b tw-border-slate-100">NAME</th>
                      <th className="tw-px-4 tw-py-3.5 tw-text-[13px] tw-font-medium tw-text-[#6e7178] tw-text-left tw-border-b tw-border-slate-100">CREW NAME</th>
                      <th className="tw-px-4 tw-py-3.5 tw-text-[13px] tw-font-medium tw-text-[#6e7178] tw-text-center tw-border-b tw-border-slate-100">MEMBERS COUNT</th>
                      <th className="tw-px-4 tw-py-3.5 tw-text-[13px] tw-font-medium tw-text-[#6e7178] tw-text-right tw-border-b tw-border-slate-100">HOURS</th>
                      <th className="tw-px-4 tw-py-3.5 tw-text-[13px] tw-font-medium tw-text-[#6e7178] tw-text-right tw-border-b tw-border-slate-100">TOTAL COST</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginated.map((crew) => (
                      <tr key={crew._id} className={`tw-border-b tw-border-slate-200 last:tw-border-b-0 tw-transition-colors ${selectedCrews.has(crew._id) ? 'tw-bg-[#EAF2FF]' : 'hover:tw-bg-slate-50'}`}>
                        <td className="tw-px-4 tw-py-4">
                          <input type="checkbox" checked={selectedCrews.has(crew._id)} onChange={() => toggleCrew(crew._id)} onClick={(e) => e.stopPropagation()} className="tw-w-4 tw-h-4 tw-cursor-pointer tw-accent-[#0140c1]" />
                        </td>
                        <td className="tw-px-4 tw-py-4">
                          <p className="tw-text-[13px] tw-font-semibold tw-text-[#0F172A] tw-truncate tw-mb-0.5 tw-m-0">{crew.area_name ? normalizeItemName(crew.area_name) : '—'}</p>
                          {(crew.csi_code || crew.measure_label) && (
                            <p className="tw-text-[11px] tw-text-[#94A3B8] tw-m-0">
                              {crew.csi_code ? `CSI ${crew.csi_code}` : ''}{crew.csi_code && crew.measure_label ? ' · ' : ''}{crew.measure_label?.toLowerCase() || ''}
                            </p>
                          )}
                        </td>
                        <td className="tw-px-4 tw-py-4">
                          <p className="tw-text-[13px] tw-truncate tw-mb-0.5 tw-m-0">{crew.crew_name}</p>
                        </td>
                        <td className="tw-px-4 tw-py-4 tw-text-center">
                          <button
                            onClick={(e) => { e.stopPropagation(); openCrewBreakdown(crew); }}
                            className="tw-inline-flex tw-items-center tw-justify-center tw-min-w-[32px] tw-h-8 tw-px-2.5 tw-rounded-[5px] tw-bg-[#f4f4f6] tw-text-[#334155] tw-text-[13px] tw-font-bold hover:tw-bg-[#EAF2FF] hover:tw-border-[#c8ddff] hover:tw-text-[#1476FF] tw-transition-colors tw-cursor-pointer"
                          >
                            {crew.members_count}
                          </button>
                        </td>
                        <td
                          className="tw-px-4 tw-py-4 tw-text-right"
                          onClick={() => { setEditingCell(crew._id); setEditVal(String(crew.hours ?? 0)); }}
                        >
                          {editingCell === crew._id ? (
                            <input
                              autoFocus type="number" min="0" step="0.01" value={editingValue}
                              onChange={(e) => setEditVal(e.target.value)}
                              onBlur={commitEditHours}
                              onKeyDown={(e) => { if (e.key === 'Enter') commitEditHours(); if (e.key === 'Escape') { setEditingCell(null); setEditVal(''); } }}
                              onClick={(e) => e.stopPropagation()}
                              className="tw-w-[80px] tw-border tw-border-[#0140c1] tw-rounded tw-px-2 tw-py-1 tw-text-[13px] tw-outline-none tw-text-right tw-min-w-[70px]"
                            />
                          ) : (
                            <span className="tw-text-[13px] tw-cursor-text tw-inline-block tw-px-2 tw-py-0.5 tw-rounded tw-border tw-border-transparent hover:tw-border-[#c8ddff] hover:tw-bg-[#EAF2FF] tw-transition-colors">
                              {fmtHrs2(crew.hours)}
                            </span>
                          )}
                        </td>
                        <td className="tw-px-4 tw-py-4 tw-text-[13px] tw-text-right">
                          {updatingRowId === crew._id
                            ? <div className="tw-h-4 tw-w-20 tw-bg-slate-200 tw-rounded tw-animate-pulse tw-ml-auto" />
                            : fmtFull(crew.total_cost)}
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

        {displayGroups.length === 0 && !loading && (
          <div className="tw-bg-white tw-border tw-border-slate-200 tw-rounded-xl tw-p-12 tw-text-center">
            <p className="tw-text-[13px] tw-text-[#94A3B8] tw-m-0">
              {searchQuery ? `No results for "${searchQuery}"` : 'No labor data available'}
            </p>
          </div>
        )}
      </div>

      {showDelete && (
        <DeleteModal entity="estimation" action="delete" subscriptionCount={selectedCrews.size} icon="icon-Alert---fill" onConfirm={handleDelete} onClose={() => setShowDelete(false)} />
      )}
      {crewModal && (
        <CrewBreakdownModal crew={crewModal} onClose={() => setCrewModal(null)} />
      )}
    </div>
  );
}
