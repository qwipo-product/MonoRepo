// CDS User › Trips (/cds/trips): a replica of the LBNP Trips list (src/pages/trips/TripsPage.tsx) for the store's own
// Retailer Delivery Trips — KPI cards, Map View for selected trips, Filter (planned date, status) with applied-filter
// chips, search, expandable rows, kebab menu with a Download submenu, cancel dialog and paginator.
// Removed by decision: Provider, Trip Charges and Helper columns; Return Report; Beat-wise Loading Sheet; DARKSTORE
// seller-wise actions.
import { Fragment, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import Swal from 'sweetalert2';
import Tooltip from '@mui/material/Tooltip';
import DataLoading from '../../../components/DataLoading';
import Paginator from '../../../components/Paginator';
import { cdsApi, type StopView, type TripView } from '../../../api/services/cds.service';
import { ACTIVE_TRIP, OTP_STATUS, TRIP_STATUS } from '../../../cds/status';
import type { TripStatus } from '../../../cds/types';
import { addCurrency } from '../../../utils/pipes';
import { RouteMapDialog, mapStops, type MapStop } from '../RouteMap';
import { alertError, downloadCsv, fmtDate, fmtDateTime, sumOf, useLoad } from '../ui';
import '../../../components/FiltersModal.css';
import '../../trips/TripsPage.css';
import './CuTrips.css';

type TripDetails = Awaited<ReturnType<typeof cdsApi.trip>>;
type StatusGroup = 'planned' | 'in-progress' | 'completed' | 'cancelled';
interface Filters { date: string; groups: StatusGroup[] }

/** The LBNP trip filter / KPI groups, mapped to the CDS trip statuses. */
const STATUS_GROUPS: { key: StatusGroup; label: string; statuses: TripStatus[] }[] = [
  { key: 'planned', label: 'Planned', statuses: ['PLANNED', 'ASSIGNED'] },
  { key: 'in-progress', label: 'In Progress', statuses: ['STARTED', 'IN_PROGRESS'] },
  { key: 'completed', label: 'Completed', statuses: ['COMPLETED', 'PARTIALLY_COMPLETED'] },
  { key: 'cancelled', label: 'Cancelled', statuses: ['CANCELLED'] },
];
const groupOf = (s: TripStatus): StatusGroup => STATUS_GROUPS.find((g) => g.statuses.includes(s))?.key ?? 'planned';
const groupLabel = (g: StatusGroup) => STATUS_GROUPS.find((x) => x.key === g)?.label ?? g;

const FILTERS_KEY = 'cdsTripFilters';
const NO_FILTERS: Filters = { date: '', groups: [] };
function readFilters(): Filters {
  try {
    const v = JSON.parse(localStorage.getItem(FILTERS_KEY) || 'null') as Partial<Filters> | null;
    return { date: typeof v?.date === 'string' ? v.date : '', groups: Array.isArray(v?.groups) ? v.groups.filter((g) => STATUS_GROUPS.some((x) => x.key === g)) : [] };
  } catch {
    return NO_FILTERS;
  }
}
function saveFilters(f: Filters) {
  try {
    if (!f.date && !f.groups.length) localStorage.removeItem(FILTERS_KEY);
    else localStorage.setItem(FILTERS_KEY, JSON.stringify(f));
  } catch {}
}

const KEBAB_MENU_HEIGHT = 220;
const SUBMENU_HEIGHT = 240;
const KEBAB_WIDTH = 230;
const p2 = (n: number) => String(n).padStart(2, '0');
const round2 = (n: number) => Math.round(n * 100) / 100;

/** TIME COVERED: "HH:MM" from start to completion, else "-". */
function timeCovered(t: Pick<TripView, 'startedAt' | 'completedAt'>): string {
  if (!t.startedAt || !t.completedAt) return '-';
  const mins = Math.floor((new Date(t.completedAt).getTime() - new Date(t.startedAt).getTime()) / 60000);
  return mins >= 0 ? `${p2(Math.floor(mins / 60))}:${p2(mins % 60)}` : '-';
}
const estimatedCompletion = (t: TripView) => (t.startedAt ? fmtDateTime(new Date(new Date(t.startedAt).getTime() + t.etaMinutes * 60000).toISOString()) : '-');
const drops = (t: Pick<TripView, 'stops'>) => t.stops.filter((s) => s.action === 'RETAILER_DELIVERY');

/** Stop label and pill tone: loading at the CDS reads Loaded, a retailer stop Delivered. */
function stopLabel(s: StopView): string {
  const pickup = s.action === 'CDS_ORDER_PICKUP';
  if (s.status === 'DONE') return pickup ? 'Loaded' : 'Delivered';
  if (s.status === 'PARTIAL') return pickup ? 'Partially Loaded' : 'Partially Delivered';
  if (s.status === 'FAILED') return 'Failed';
  return 'Pending';
}
const stopTone = (s: StopView) => `cu-stop-${s.status.toLowerCase()}`;

/** Order Summary + Collection Summary figures of a trip (from its stops, orders and collections). */
function tripFigures(d: TripDetails) {
  const t = d.trip;
  const pickup = t.stops.find((s) => s.action === 'CDS_ORDER_PICKUP');
  const loaded = !!pickup && pickup.status !== 'PENDING';
  const ds = drops(t);
  const counts = { total: d.orders.length, delivered: 0, partial: 0, failed: 0, pending: 0 };
  d.orders.forEach((o) => {
    const st = ds.find((s) => s.lines.some((l) => l.orderId === o.id));
    if (!st) counts[loaded ? 'failed' : 'pending'] += 1; // not loaded at the CDS
    else if (st.status === 'PENDING') counts.pending += 1;
    else if (st.status === 'FAILED') counts.failed += 1;
    else {
      const got = sumOf(st.lines.filter((l) => l.orderId === o.id), (l) => l.actualQty ?? 0);
      const want = sumOf(o.lines, (l) => l.qty);
      counts[got <= 0 ? 'failed' : got >= want ? 'delivered' : 'partial'] += 1;
    }
  });
  const cash = sumOf(d.collections.filter((c) => c.mode === 'CASH'), (c) => c.amount);
  const upi = sumOf(d.collections.filter((c) => c.mode === 'UPI'), (c) => c.amount);
  return {
    ...counts,
    saleValue: sumOf(d.orders.flatMap((o) => o.lines), (l) => l.qty * l.unitPrice),
    deliveredValue: sumOf(ds.flatMap((s) => s.lines), (l) => (l.actualQty ?? 0) * l.unitPrice),
    dropPoints: ds.length,
    cash,
    upi,
    collected: cash + upi,
  };
}

// ---------------------------------------------------------------- downloads (CSV)

type DownloadKey = 'consolidated' | 'pickup' | 'loading' | 'customer';
const DOWNLOADS: { key: DownloadKey; label: string; file: string; done: string }[] = [
  { key: 'consolidated', label: 'Consolidated Pickup List', file: 'consolidated-pickup-list', done: 'Consolidated pickup list downloaded successfully' },
  { key: 'pickup', label: 'Pickup List', file: 'pickup-list', done: 'Pickup list downloaded successfully' },
  { key: 'loading', label: 'Consolidated Loading Sheet', file: 'consolidated-loading-sheet', done: 'Consolidated loading sheet downloaded successfully' },
  { key: 'customer', label: 'Customer Wise Pickup List', file: 'customer-wise-pickup-list', done: 'Customer wise pickup list downloaded successfully' },
];
const col = (key: string, label: string) => ({ key, label });

function buildSheet(kind: DownloadKey, d: TripDetails): { columns: { key: string; label: string }[]; rows: Record<string, unknown>[] } {
  const t = d.trip;
  const orderOf = (id: string | null) => d.orders.find((o) => o.id === id);
  const pickup = t.stops.find((s) => s.action === 'CDS_ORDER_PICKUP');
  const ds = drops(t);
  // what is loaded at the CDS: the pickup stop's lines (all retailer lines when there is no pickup stop)
  const lines = pickup ? pickup.lines : ds.flatMap((s) => s.lines);
  const payment = (id: string | null) => (orderOf(id)?.paymentMode === 'COD' ? 'COD' : 'Prepaid');
  if (kind === 'consolidated') {
    const bySku = new Map<string, { sku: string; name: string; qty: number; loaded: number | null; weight: number; amount: number }>();
    lines.forEach((l) => {
      const x = bySku.get(l.sku) ?? { sku: l.sku, name: l.name, qty: 0, loaded: null, weight: 0, amount: 0 };
      x.qty += l.plannedQty;
      if (l.actualQty !== null) x.loaded = (x.loaded ?? 0) + l.actualQty;
      x.weight += l.plannedQty * l.unitWeightKg;
      x.amount += l.plannedQty * l.unitPrice;
      bySku.set(l.sku, x);
    });
    return {
      columns: [col('sno', 'S.No'), col('sku', 'SKU'), col('name', 'Product Name'), col('qty', 'Total Qty'), col('loaded', 'Loaded Qty'), col('weight', 'Total Weight (kg)'), col('amount', 'Amount (₹)')],
      rows: Array.from(bySku.values()).sort((a, b) => a.name.localeCompare(b.name)).map((x, i) => ({ sno: i + 1, ...x, loaded: x.loaded ?? '', weight: round2(x.weight), amount: round2(x.amount) })),
    };
  }
  if (kind === 'pickup') {
    return {
      columns: [col('sno', 'S.No'), col('orderNo', 'Order No'), col('retailer', 'Retailer'), col('sku', 'SKU'), col('name', 'Product Name'), col('qty', 'Qty'), col('weight', 'Weight (kg)'), col('amount', 'Amount (₹)')],
      rows: [...lines]
        .sort((a, b) => (orderOf(a.orderId)?.orderNo ?? '').localeCompare(orderOf(b.orderId)?.orderNo ?? ''))
        .map((l, i) => ({ sno: i + 1, orderNo: orderOf(l.orderId)?.orderNo ?? '', retailer: orderOf(l.orderId)?.retailerName ?? '', sku: l.sku, name: l.name, qty: l.plannedQty, weight: round2(l.plannedQty * l.unitWeightKg), amount: round2(l.plannedQty * l.unitPrice) })),
    };
  }
  if (kind === 'loading') {
    // last drop is loaded first
    return {
      columns: [col('load', 'Load Seq'), col('stop', 'Stop No'), col('retailer', 'Retailer'), col('address', 'Address'), col('phone', 'Phone'), col('orders', 'Orders'), col('qty', 'Total Qty'), col('weight', 'Weight (kg)'), col('amount', 'Amount (₹)'), col('payment', 'Payment')],
      rows: [...ds].reverse().map((s, i) => {
        const ids = Array.from(new Set(s.lines.map((l) => l.orderId)));
        return {
          load: i + 1, stop: s.seq, retailer: s.name, address: s.address, phone: s.phone, orders: ids.map((x) => orderOf(x)?.orderNo ?? '').join(' | '),
          qty: sumOf(s.lines, (l) => l.plannedQty), weight: round2(sumOf(s.lines, (l) => l.plannedQty * l.unitWeightKg)), amount: round2(sumOf(s.lines, (l) => l.plannedQty * l.unitPrice)),
          payment: Array.from(new Set(ids.map(payment))).join(' / '),
        };
      }),
    };
  }
  return {
    columns: [col('stop', 'Stop No'), col('retailer', 'Retailer'), col('address', 'Address'), col('orderNo', 'Order No'), col('sku', 'SKU'), col('name', 'Product Name'), col('qty', 'Qty'), col('amount', 'Amount (₹)'), col('payment', 'Payment')],
    rows: ds.flatMap((s) => s.lines.map((l) => ({ stop: s.seq, retailer: s.name, address: s.address, orderNo: orderOf(l.orderId)?.orderNo ?? '', sku: l.sku, name: l.name, qty: l.plannedQty, amount: round2(l.plannedQty * l.unitPrice), payment: payment(l.orderId) }))),
  };
}

/** Selected trips on one map: the stops of each trip in visit order, numbered across the trips. */
function tripsMapStops(trips: TripView[]): MapStop[] {
  if (trips.length === 1) return mapStops(trips[0].stops);
  return trips.flatMap((t) => t.stops.map((s) => ({ name: `${t.tripNo} · ${s.name}`, detail: s.address, lat: s.lat, lng: s.lng, status: s.status }))).map((s, i) => ({ ...s, seq: i + 1 }));
}

// ---------------------------------------------------------------- shared pieces (also used by Trip details)

/** Trip status badge with the LBNP trip badge colours. */
export function CuTripStatusBadge({ status }: { status: TripStatus }) {
  const cls = status === 'PARTIALLY_COMPLETED' ? 'partial' : groupOf(status);
  return <span className={`status-badge cu-trip-status ${cls}`}>{TRIP_STATUS[status].label}</span>;
}

/** The LBNP "Cancel Trip" dialog, with the cancellation reason the CDS API needs. The server refuses a trip that has progressed. */
export function CuCancelTripDialog({ trip, onClose, onCancelled }: { trip: { id: string; tripNo: string }; onClose: () => void; onCancelled: () => void }) {
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const confirmCancel = async () => {
    setBusy(true);
    try {
      await cdsApi.cancelTrip(trip.id, reason.trim());
      onClose();
      await Swal.fire({ title: 'Trip has been cancelled successfully', icon: 'success', allowOutsideClick: false });
      onCancelled();
    } catch (e) {
      onClose();
      void alertError(e);
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="trips-modal-overlay cu-cancel-trip" onClick={onClose}>
      <div className="cancel-trip-modal" role="dialog" aria-modal="true" aria-label="Cancel Trip" onClick={(e) => e.stopPropagation()}>
        <div className="ctm-header">
          <div className="ctm-title">
            <i className="fas fa-exclamation-triangle" />
            <h3>Cancel Trip</h3>
          </div>
          <button className="ctm-close" onClick={onClose} aria-label="Close"><i className="fas fa-times" /></button>
        </div>
        <div className="ctm-body">
          <p>Are you sure you want to cancel trip {trip.tripNo}? This action cannot be undone.</p>
          <label className="ctm-label" htmlFor="cu-cancel-reason">Cancellation reason</label>
          <textarea id="cu-cancel-reason" className="form-control" rows={3} placeholder="Enter the reason" value={reason} onChange={(e) => setReason(e.target.value)} autoFocus />
        </div>
        <div className="ctm-footer">
          <button className="btn cancel-btn" onClick={onClose}>Cancel</button>
          <button className="btn btn-danger" disabled={busy || !reason.trim()} onClick={() => void confirmCancel()}>Confirm Cancellation</button>
        </div>
      </div>
    </div>
  );
}

/** The LBNP trip filters dialog (Planned Date + Status multi-select). */
function TripFiltersModal({ value, onClose, onApply, onClear }: { value: Filters; onClose: () => void; onApply: (f: Filters) => void; onClear: () => void }) {
  const [f, setF] = useState<Filters>(value);
  const [open, setOpen] = useState(false);
  const toggle = (g: StatusGroup) => setF((p) => ({ ...p, groups: p.groups.includes(g) ? p.groups.filter((x) => x !== g) : [...p.groups, g] }));
  return (
    <div className="modal-overlay fm-overlay" onClick={onClose}>
      <div className="modal-content filters-modal" role="dialog" aria-modal="true" aria-label="Trip Filters" onClick={(e) => { e.stopPropagation(); setOpen(false); }}>
        <div className="modal-header">
          <h2>Trip Filters</h2>
          <button className="close-btn" onClick={onClose} aria-label="Close"><i className="fas fa-times" /></button>
        </div>
        <div className="modal-body">
          <div className="filter-grid">
            <div className="filter-row">
              <div className="filter-col">
                <label htmlFor="cu-trip-date">Planned Date</label>
                <input id="cu-trip-date" type="date" className="fm-input" value={f.date} onChange={(e) => setF((p) => ({ ...p, date: e.target.value }))} />
              </div>
              <div className="filter-col">
                <label>Status</label>
                <div className="multi-select-dropdown status-dropdown">
                  <div className="multi-select-trigger" role="button" aria-label="Status" onClick={(e) => { e.stopPropagation(); setOpen((o) => !o); }}>
                    {f.groups.length === 0 ? (
                      <span className="placeholder-text">All Status</span>
                    ) : (
                      <span className="chips">
                        {f.groups.slice(0, 2).map((g) => (
                          <span className="chip" key={g}>
                            {groupLabel(g)}
                            <i className="fas fa-times chip-close" onClick={(e) => { e.stopPropagation(); toggle(g); }} />
                          </span>
                        ))}
                        {f.groups.length > 2 && <span className="more-badge">+{f.groups.length - 2}</span>}
                      </span>
                    )}
                    <i className="fas fa-chevron-down arrow" />
                  </div>
                  {open && (
                    <div className="multi-select-options" onClick={(e) => e.stopPropagation()}>
                      {STATUS_GROUPS.map((g) => (
                        <label className="option" key={g.key}>
                          <input type="checkbox" checked={f.groups.includes(g.key)} onChange={() => toggle(g.key)} />
                          <span>{g.label}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="cancel-btn" onClick={onClear}>Clear All</button>
          <button className="save-btn" onClick={() => onApply(f)}>Apply Filters</button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- page

export function CuTripsPage() {
  const navigate = useNavigate();
  const [filters, _setFilters] = useState<Filters>(readFilters);
  const [searchText, setSearchText] = useState('');
  const [search, setSearch] = useState('');
  const [pageNumber, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [showFilters, setShowFilters] = useState(false);

  const [selection, setSelection] = useState<Map<string, TripView>>(new Map());
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [details, setDetails] = useState<Record<string, TripDetails | 'error'>>({});
  const [showAllStops, setShowAllStops] = useState<Set<string>>(new Set());
  const [kebabId, setKebabId] = useState<string | null>(null);
  const [kebabPos, setKebabPos] = useState({ top: 0, right: 0 });
  const [showDownloadSubmenu, setShowDownloadSubmenu] = useState(false);
  const [submenuPos, setSubmenuPos] = useState({ top: 0, right: 0 });
  const [cancelFor, setCancelFor] = useState<TripView | null>(null);
  const [mapTrips, setMapTrips] = useState<TripView[] | null>(null);

  const statuses = filters.groups.flatMap((g) => STATUS_GROUPS.find((x) => x.key === g)?.statuses ?? []);
  const list = useLoad(
    () => cdsApi.searchTrips({ types: ['RETAILER_DELIVERY'], statuses, date: filters.date || undefined, search: search || undefined, pageNumber, pageSize }),
    [statuses.join(','), filters.date, search, pageNumber, pageSize],
  );
  // KPI cards: all of the store's retailer delivery trips
  const all = useLoad(() => cdsApi.searchTrips({ types: ['RETAILER_DELIVERY'], pageSize: 0 }), []);
  const stats = useMemo(() => {
    const rows = all.data?.rows ?? [];
    const n = (g: StatusGroup) => rows.filter((t) => groupOf(t.status) === g).length;
    return { total: rows.length, inProgress: n('in-progress'), completed: n('completed'), planned: n('planned') };
  }, [all.data]);
  const trips = list.data?.rows ?? [];

  const setFilters = (f: Filters) => {
    _setFilters(f);
    saveFilters(f);
    setPage(1);
    setSelection(new Map());
  };

  // search as you type (debounced)
  useEffect(() => {
    const q = searchText.trim();
    if (q === search) return;
    const h = window.setTimeout(() => {
      setSearch(q);
      setPage(1);
    }, 300);
    return () => window.clearTimeout(h);
  }, [searchText, search]);

  // host `document:click` → close the menus
  const closeAllMenus = () => {
    setKebabId(null);
    setShowDownloadSubmenu(false);
  };
  useEffect(() => {
    const onDoc = () => {
      setKebabId(null);
      setShowDownloadSubmenu(false);
    };
    document.addEventListener('click', onDoc);
    return () => document.removeEventListener('click', onDoc);
  }, []);

  const loadDetails = (id: string) =>
    cdsApi.trip(id).then(
      (d) => setDetails((p) => ({ ...p, [id]: d })),
      () => setDetails((p) => ({ ...p, [id]: 'error' })),
    );
  /** After a cancellation: reload the list, the KPI cards and the open row. */
  const reloadAll = () => {
    // the cancelled trip leaves a status-filtered list: step back when it was the only row of the last page
    const leavesList = filters.groups.length > 0 && !filters.groups.includes('cancelled');
    if (leavesList && trips.length === 1 && pageNumber > 1) setPage(pageNumber - 1);
    setDetails({});
    if (expandedId) void loadDetails(expandedId);
    list.reload();
    all.reload();
  };
  const toggleTripDetails = (t: TripView) => {
    if (expandedId === t.id) return setExpandedId(null);
    setExpandedId(t.id);
    void loadDetails(t.id);
  };
  const toggleShowAllStops = (id: string) =>
    setShowAllStops((p) => {
      const n = new Set(p);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  // ------------------------------------------------------------ selection
  const toggleTripSelection = (t: TripView) =>
    setSelection((p) => {
      const m = new Map(p);
      if (m.has(t.id)) m.delete(t.id);
      else m.set(t.id, t);
      return m;
    });
  const isAllSelected = trips.length > 0 && trips.every((t) => selection.has(t.id));
  const toggleSelectAll = () =>
    setSelection((p) => {
      const m = new Map(p);
      const allOn = trips.length > 0 && trips.every((t) => m.has(t.id));
      trips.forEach((t) => (allOn ? m.delete(t.id) : m.set(t.id, t)));
      return m;
    });
  const selectedCount = selection.size;

  // ------------------------------------------------------------ menus
  const toggleKebabMenu = (id: string, e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (kebabId === id) return closeAllMenus();
    const rect = e.currentTarget.getBoundingClientRect();
    const top = window.innerHeight - rect.bottom < KEBAB_MENU_HEIGHT ? Math.max(0, rect.top - KEBAB_MENU_HEIGHT - 4) : rect.bottom + 4;
    setKebabPos({ top, right: window.innerWidth - rect.right });
    setKebabId(id);
    setShowDownloadSubmenu(false);
  };
  const toggleDownloadSubmenu = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (showDownloadSubmenu) return setShowDownloadSubmenu(false);
    const rect = e.currentTarget.getBoundingClientRect();
    const top = rect.top + SUBMENU_HEIGHT <= window.innerHeight ? rect.top : Math.max(0, rect.bottom - SUBMENU_HEIGHT);
    setSubmenuPos({ top, right: kebabPos.right + KEBAB_WIDTH + 8 });
    setShowDownloadSubmenu(true);
  };

  const download = async (t: TripView, kind: DownloadKey) => {
    const meta = DOWNLOADS.find((x) => x.key === kind)!;
    try {
      const d = await cdsApi.trip(t.id);
      const { columns, rows } = buildSheet(kind, d);
      downloadCsv(`${t.tripNo}-${meta.file}`, columns, rows);
      void Swal.fire({ title: meta.done, icon: 'success' });
    } catch (e) {
      void alertError(e);
    }
  };

  const kebabRow = kebabId ? trips.find((t) => t.id === kebabId) : undefined;

  // ------------------------------------------------------------ render helpers
  const renderDetails = (t: TripView) => {
    const d = details[t.id];
    const ready = d && d !== 'error' ? d : null;
    const f = ready ? tripFigures(ready) : null;
    const showAll = showAllStops.has(t.id);
    const visible = showAll ? t.stops : t.stops.slice(0, 3);
    const pickup = t.stops.find((s) => s.action === 'CDS_ORDER_PICKUP');
    const routeRows: [string, string, string][] = [
      ['directions_car', 'Vehicle', `${t.vehicleRegNo || 'Not Assigned'}${t.vehicleType ? ` · ${t.vehicleType}` : ''}`],
      ['person', 'Delivery Person', t.deliveryPersonName || 'Not Assigned'],
      ['phone', 'Contact Number', t.deliveryPersonPhone || 'Not Available'],
      ['event', 'Planned Date', `${fmtDate(t.plannedDate)} · ${t.slot}`],
      ['play_circle_outline', 'Start Time', t.startedAt ? fmtDateTime(t.startedAt) : 'Not Started'],
      ['access_time', 'Estimated Completion', estimatedCompletion(t)],
      ['flag', 'Completed Time', t.completedAt ? fmtDateTime(t.completedAt) : '-'],
      ['vpn_key', 'Pickup OTP', pickup?.otp ? OTP_STATUS[pickup.otp.status].label : 'Not Sent'],
    ];
    const seg = (n: number) => `max(2px, ${f && f.total ? (n / f.total) * 100 : 0}%)`;
    return (
      <tr className="trip-details-row">
        <td colSpan={12}>
          <div className="trip-details">
            <div className="details-container">
              <div className="detail-card route-overview">
                <h3>Route Overview</h3>
                <div className="info-card">
                  {routeRows.map(([icon, label, value]) => (
                    <div className="info-row" key={label}>
                      <i className="material-icons">{icon}</i>
                      <span className="label">{label}</span>
                      <span className="value" title={value}>{value}</span>
                    </div>
                  ))}
                </div>
                {t.status === 'CANCELLED' && t.cancelReason && <div className="cu-cancel-note"><i className="fas fa-ban me-1" />Cancelled: {t.cancelReason}</div>}
              </div>

              <div className="detail-card trip-summary">
                <h3>Order Summary</h3>
                {!d && <div className="cu-detail-loading"><span className="spinner-border spinner-border-sm text-primary me-2" />Loading trip details...</div>}
                {d === 'error' && <div className="cu-detail-loading text-danger">Could not load the trip details. <button className="btn btn-link btn-sm p-0" onClick={() => void loadDetails(t.id)}>Retry</button></div>}
                {f && (
                  <>
                    <div className="order-summary-grid">
                      {([
                        ['total', 'receipt_long', 'Total', f.total],
                        ['delivered', 'check_circle', 'Delivered', f.delivered],
                        ['partial', 'rule', 'Partial', f.partial],
                        ['returned', 'cancel', 'Failed', f.failed],
                        ['pending', 'schedule', 'Pending', f.pending],
                      ] as [string, string, string, number][]).map(([cls, icon, label, value]) => (
                        <div className={`os-item ${cls}`} key={cls}>
                          <div className="os-icon"><i className="material-icons">{icon}</i></div>
                          <div className="os-count">{value}</div>
                          <div className="os-label">{label}</div>
                        </div>
                      ))}
                    </div>
                    {f.total > 0 && (
                      <div className="os-progress">
                        <div className="seg delivered" style={{ width: seg(f.delivered) }} title={`Delivered: ${f.delivered}`} />
                        <div className="seg partial" style={{ width: seg(f.partial) }} title={`Partial: ${f.partial}`} />
                        <div className="seg returned" style={{ width: seg(f.failed) }} title={`Failed: ${f.failed}`} />
                        <div className="seg pending" style={{ width: seg(f.pending) }} title={`Pending: ${f.pending}`} />
                      </div>
                    )}

                    <h3 className="collection-title">Collection Summary</h3>
                    <div className="info-card collection-card">
                      <div className="info-row no-icon"><span className="label">Total Sale Value</span><span className="value">{addCurrency(f.saleValue)}</span></div>
                      <div className="info-row no-icon dashed"><span className="label">Total Delivered Value</span><span className="value">{addCurrency(f.deliveredValue)}</span></div>
                      <div className="info-row"><i className="material-icons">location_on</i><span className="label">Total Delivery Points</span><span className="value">{f.dropPoints}</span></div>
                      <div className="info-row"><i className="material-icons">payments</i><span className="label">Cash Collection</span><span className="value">{addCurrency(f.cash)}</span></div>
                      <div className="info-row"><i className="material-icons">smartphone</i><span className="label">UPI Collection</span><span className="value">{addCurrency(f.upi)}</span></div>
                      <div className="info-row"><i className="material-icons">account_balance_wallet</i><span className="label">Total Collection</span><span className="value">{addCurrency(f.collected)}</span></div>
                    </div>
                  </>
                )}
              </div>

              <div className="detail-card delivery-route">
                <h3>Delivery Route</h3>
                <div className="delivery-stops">
                  {visible.map((s, i) => {
                    const isLastCollapsed = !showAll && i === visible.length - 1;
                    const pick = s.action === 'CDS_ORDER_PICKUP';
                    return (
                      <div className={`delivery-stop${i === 0 ? ' first-stop' : ''}${isLastCollapsed ? ' last-visible-stop' : ''}`} key={s.id}>
                        {i > 0 && <div className="connector" />}
                        {pick ? <div className="stop-icon"><i className="material-icons">store</i></div> : <div className="stop-number">{s.seq}</div>}
                        <div className="stop-details">
                          <div className="stop-info">
                            <div className="stop-name">{s.name || 'Unnamed Location'}</div>
                            <div className="stop-address">{pick ? 'Order pickup at CDS' : s.address || 'Address not available'}</div>
                            <div className="stop-time">{s.completedAt ? fmtDateTime(s.completedAt) : 'Time not available'}</div>
                            <div className="stop-otp">
                              <span className="otp-label">OTP:</span>
                              <span className="otp-badge">{s.otp ? OTP_STATUS[s.otp.status].label : 'N/A'}</span>
                            </div>
                            {s.failReason && <div className="cu-stop-reason">{s.failReason}</div>}
                          </div>
                          <div className="stop-status">
                            <span className={`status-pill ${stopTone(s)}`}>{stopLabel(s)}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {t.stops.length > 3 && (
                    <div className="show-more-container">
                      <button
                        className="show-more-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleShowAllStops(t.id);
                        }}
                      >
                        <i className="material-icons">{showAll ? 'expand_less' : 'expand_more'}</i>
                        {showAll ? 'Show Less' : 'Show More Stops'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </td>
      </tr>
    );
  };

  const hasActiveFilters = filters.groups.length > 0 || !!filters.date;

  return (
    <div className="trips-container cu-trips">
      {showFilters && (
        <TripFiltersModal
          value={filters}
          onClose={() => setShowFilters(false)}
          onApply={(f) => { setFilters(f); setShowFilters(false); }}
          onClear={() => { setFilters(NO_FILTERS); setShowFilters(false); }}
        />
      )}

      <div className="page-header">
        <div className="header-content">
          <div className="header-icon"><i className="material-icons">local_shipping</i></div>
          <div>
            <h1>Trips</h1>
            <p className="header-description">Track and manage delivery trips, routes, and delivery persons.</p>
          </div>
        </div>
        <div className="actions">
          <div className="cu-trips-search">
            <i className="fas fa-search" />
            <input type="search" placeholder="Search trip, delivery person, vehicle, retailer" aria-label="Search trips" value={searchText} onChange={(e) => setSearchText(e.target.value)} />
          </div>
          <Tooltip
            title={selectedCount === 0 ? 'Select one or more trips to view on map' : ''}
            placement="bottom"
            componentsProps={{ tooltip: { className: 'map-view-tooltip' } }}
          >
            <span>
              <button className="filter-btn map-view-btn" disabled={selectedCount === 0} onClick={() => setMapTrips(Array.from(selection.values()))}>
                <i className="material-icons">map</i> Map View{selectedCount > 0 ? ` (${selectedCount})` : ''}
              </button>
            </span>
          </Tooltip>
          <button className="filter-btn" onClick={() => setShowFilters(true)}>
            <i className="material-icons">filter_list</i> Filter
          </button>
        </div>
      </div>

      <div className="stats-grid">
        {([
          ['Total Trips', stats.total, 'All Time', 'Retailer Delivery Trips', 'fas fa-truck-loading', 'trips'],
          ['In Progress', stats.inProgress, 'Active Trips', 'On the road', 'fas fa-route', 'delivery'],
          ['Completed', stats.completed, 'Completed Trips', 'Successfully delivered', 'fas fa-check-circle', 'customers'],
          ['Planned', stats.planned, 'Upcoming Trips', 'Scheduled for delivery', 'fas fa-calendar-alt', 'orders'],
        ] as [string, number, string, string, string, string][]).map(([title, value, sub, line, icon, cls]) => (
          <div className="stat-card" key={title}>
            <div className="stat-content">
              <div className="stat-title">{title}</div>
              <div className="stat-value">{value}</div>
              <div className="stat-subtitle">{sub}</div>
              <div className="stat-line">{line}</div>
            </div>
            <div className={`stat-icon ${cls}`}><i className={icon} /></div>
            <div className="trend-indicator" />
          </div>
        ))}
      </div>

      {hasActiveFilters && (
        <div className="applied-filters-bar">
          <span className="applied-label">Applied filters:</span>
          {filters.groups.length > 0 && (
            <span className="filter-chip">
              <strong>Status:</strong>
              {filters.groups.map((g, i) => (
                <span className="chip-tag" key={g}>
                  {groupLabel(g)}
                  <i className="fas fa-times tag-remove" role="button" aria-label={`Remove ${groupLabel(g)}`} onClick={() => setFilters({ ...filters, groups: filters.groups.filter((x) => x !== g) })} />
                  {i < filters.groups.length - 1 && <span className="tag-sep">,</span>}
                </span>
              ))}
            </span>
          )}
          {filters.date && (
            <span className="filter-chip">
              {`Planned: ${fmtDate(filters.date)}`}
              <button className="chip-remove" aria-label="Remove planned date" onClick={() => setFilters({ ...filters, date: '' })}><i className="fas fa-times" /></button>
            </span>
          )}
          <button className="clear-all-btn" onClick={() => setFilters(NO_FILTERS)}>Clear all</button>
        </div>
      )}

      <div className="trips-table-container">
        {list.loading && !list.data && <DataLoading overlay={false} message="Loading trips..." showTip />}
        {list.error && !list.loading && (
          <div className="no-trips-message">
            <i className="fas fa-triangle-exclamation" />
            <p>{list.error}</p>
            <button className="btn btn-link" onClick={list.reload}>Retry</button>
          </div>
        )}
        {list.data && trips.length > 0 && (
          <table className="trips-table">
            <thead>
              <tr>
                <th className="checkbox-cell" onClick={(e) => e.stopPropagation()}>
                  <input type="checkbox" aria-label="Select all trips" checked={isAllSelected} onChange={toggleSelectAll} />
                </th>
                <th className="expand-cell" />
                <th>Trip Number</th>
                <th>Status</th>
                <th>Drop Points</th>
                <th>Load (kg)</th>
                <th>Delivery Person</th>
                <th>Vehicle</th>
                <th>Planned Kms</th>
                <th>Created Date</th>
                <th>Time Covered</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {trips.map((t) => {
                const expanded = expandedId === t.id;
                return (
                  <Fragment key={t.id}>
                    <tr className={`trip-row${expanded ? ' expanded' : ''}`}>
                      <td className="checkbox-cell" onClick={(e) => e.stopPropagation()}>
                        <input type="checkbox" aria-label={`Select ${t.tripNo}`} checked={selection.has(t.id)} onChange={() => toggleTripSelection(t)} />
                      </td>
                      <td className="expand-cell" role="button" aria-label={expanded ? 'Collapse' : 'Expand'} onClick={() => toggleTripDetails(t)}>
                        <i className={`material-icons expand-icon${expanded ? ' rotated' : ''}`}>chevron_right</i>
                      </td>
                      <td className="trip-number">
                        {t.tripNo}
                        <span className="cu-sub">{fmtDate(t.plannedDate)} · {t.slot}</span>
                      </td>
                      <td><CuTripStatusBadge status={t.status} /></td>
                      <td>{drops(t).length || 'N/A'}</td>
                      <td>{`${Math.round(t.loadKg * 10) / 10} / ${t.capacityKg || 'N/A'}`}</td>
                      <td>
                        {t.deliveryPersonName || 'N/A'}
                        {t.deliveryPersonPhone && <span className="cu-sub">{t.deliveryPersonPhone}</span>}
                      </td>
                      <td>
                        {t.vehicleRegNo || 'N/A'}
                        {t.vehicleType && <span className="cu-sub">{t.vehicleType}</span>}
                      </td>
                      <td>{t.distanceKm || 'N/A'}</td>
                      <td>{fmtDateTime(t.createdAt)}</td>
                      <td>{timeCovered(t)}</td>
                      <td>
                        <button className="kebab-btn" title="Actions" aria-label={`Actions for ${t.tripNo}`} onClick={(e) => toggleKebabMenu(t.id, e)}>
                          <i className="material-icons">more_vert</i>
                        </button>
                      </td>
                    </tr>
                    {expanded && renderDetails(t)}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        )}
        {list.data && !list.error && trips.length === 0 && (
          <div className="no-trips-message">
            <i className="fas fa-inbox" />
            <p>No trips found</p>
          </div>
        )}
        {list.data && trips.length > 0 && (
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-center p-1 bg-white mt-2 trips-paginator">
            <div className="text-muted small" />
            <div className="bg-transparent shadow-none paginator-wrap" aria-label="Select page of trips">
              <Paginator
                length={list.data.total}
                pageIndex={pageNumber - 1}
                pageSize={pageSize}
                pageSizeOptions={[5, 10, 25, 50]}
                onPage={(e) => { setPageSize(e.pageSize); setPage(e.pageIndex + 1); }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Kebab dropdown (position: fixed, as in LBNP) */}
      {kebabRow && (
        <div className="kebab-dropdown" role="menu" style={{ top: kebabPos.top, right: kebabPos.right }} onClick={(e) => e.stopPropagation()}>
          {ACTIVE_TRIP.includes(kebabRow.status) && (
            <div className="kebab-item" role="menuitem" onClick={() => { setCancelFor(kebabRow); closeAllMenus(); }}>
              <i className="material-icons" style={{ color: '#ef4444' }}>cancel</i>
              <span>Cancel</span>
            </div>
          )}
          <div
            className={`kebab-item${kebabRow.status === 'CANCELLED' ? ' disabled' : ''}`}
            role="menuitem"
            onClick={() => {
              if (kebabRow.status !== 'CANCELLED') setMapTrips([kebabRow]);
              closeAllMenus();
            }}
          >
            <i className="material-icons" style={{ color: '#3b82f6' }}>place</i>
            <span>Map view</span>
          </div>
          <div className="kebab-item" role="menuitem" onClick={() => { closeAllMenus(); navigate(`/cds/trips/${kebabRow.id}`); }}>
            <i className="material-icons" style={{ color: '#3b82f6' }}>visibility</i>
            <span>View details</span>
          </div>
          <div className="kebab-item" role="menuitem" onClick={toggleDownloadSubmenu}>
            <i className="material-icons" style={{ color: '#22c55e' }}>download</i>
            <span>Download</span>
            <i className={`material-icons submenu-chevron${showDownloadSubmenu ? ' open' : ''}`}>expand_more</i>
          </div>
        </div>
      )}
      {kebabRow && showDownloadSubmenu && (
        <div className="download-submenu" role="menu" style={{ top: submenuPos.top, right: submenuPos.right }} onClick={(e) => e.stopPropagation()}>
          {DOWNLOADS.map((x) => (
            <div className="submenu-item" role="menuitem" key={x.key} onClick={() => { void download(kebabRow, x.key); closeAllMenus(); }}>
              <i className="fas fa-file-alt" /><span>{x.label}</span>
            </div>
          ))}
        </div>
      )}

      {cancelFor && <CuCancelTripDialog trip={cancelFor} onClose={() => setCancelFor(null)} onCancelled={reloadAll} />}

      {mapTrips && (
        <RouteMapDialog
          title={mapTrips.length === 1 ? `${mapTrips[0].tripNo} · Map View` : `Map View · ${mapTrips.length} trips`}
          subtitle={
            mapTrips.length === 1
              ? `${fmtDate(mapTrips[0].plannedDate)} · ${mapTrips[0].deliveryPersonName} · ${mapTrips[0].distanceKm} km · ${mapTrips[0].stops.filter((s) => s.status !== 'PENDING').length}/${mapTrips[0].stops.length} stops done`
              : mapTrips.map((t) => t.tripNo).join(', ')
          }
          stops={tripsMapStops(mapTrips)}
          onClose={() => setMapTrips(null)}
        />
      )}
    </div>
  );
}
