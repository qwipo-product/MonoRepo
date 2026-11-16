// Screen B — Create Delivery Route (/delivery-routes/create), spec 03 §4. Single page + modals (not a wizard).
// Ported as a controller class: order rows carry a mutable `selected` flag exactly like the Angular component.
import { useEffect, useReducer, useRef, useState } from 'react';
import { useNavigate, type NavigateFunction } from 'react-router';
import dayjs, { type Dayjs } from 'dayjs';
import Popover from '@mui/material/Popover';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import IconButton from '@mui/material/IconButton';
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar';
import { usePagePermissions } from '../../hooks/usePagePermissions';
import { buyerSettingsService } from '../../api/services/buyerSettings.service';
import { deliveryRoutesService, routeOrdersService, type PlannableOrder } from '../../api/services/routePlanning.service';
import { toastWarning } from '../../utils/helpers';
import { addCurrency, addWeight } from '../../utils/pipes';
import { fmtDate } from './drFormat';
import OptimizedRoutesModal from './OptimizedRoutesModal';
import './CreateDeliveryRoutePage.css';

type SortKey = 'orderDate' | 'customerBusinessName' | 'salesPerson' | 'beat' | 'refOrderNumber' | 'amount' | 'totalWeight' | 'volumetricWeight';
const NUMERIC: SortKey[] = ['amount', 'totalWeight', 'volumetricWeight'];
/** Filter above Available Orders: how each order is delivered (see PlannableOrder.deliveryType). */
type DeliveryTypeFilter = 'all' | PlannableOrder['deliveryType'];
const DELIVERY_TYPE_FILTERS: { value: DeliveryTypeFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'cds', label: 'Consolidated Delivery' },
  { value: '3pl', label: '3PL Delivery' },
  { value: 'self', label: 'Direct' },
];
const MONTHS_LONG = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function ordinal(d: number) {
  if (d === 11 || d === 12 || d === 13) return 'th';
  return d % 10 === 1 ? 'st' : d % 10 === 2 ? 'nd' : d % 10 === 3 ? 'rd' : 'th';
}
/** "November 5th, 2026" */
function formatDisplayDate(d: Date | null) {
  if (!d) return '';
  return `${MONTHS_LONG[d.getMonth()]} ${d.getDate()}${ordinal(d.getDate())}, ${d.getFullYear()}`;
}
const startOfDay = (d: Date) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};
const ymdLocal = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
function deriveSLAFromDate(d: Date) {
  const diff = Math.round((startOfDay(d).getTime() - startOfDay(new Date()).getTime()) / 86400000);
  return diff === 0 ? 'SAME_DAY' : diff === 1 ? 'NEXT_DAY' : 'DAY_AFTER_NEXT_DAY';
}
/** UTC calendar day of a date-ish value; "" when it cannot be parsed. */
function isoDay(v: unknown): string {
  const d = new Date(v as string);
  return isNaN(d.getTime()) ? '' : d.toISOString().slice(0, 10);
}

interface DropdownState {
  open: boolean;
  style: React.CSSProperties;
  search: string;
  checked: Set<string>;
}
const emptyDropdown = (): DropdownState => ({ open: false, style: {}, search: '', checked: new Set() });

interface UnassignedModal { count: number; total: number; shownBeats: string[]; moreCount: number }

class CreateRouteController {
  navigate: NavigateFunction = () => undefined;
  buyerId = '';
  render: () => void = () => undefined;

  isLoading = false; // [as-built] set but never rendered
  availableOrders: PlannableOrder[] = [];
  filteredOrders: PlannableOrder[] = [];
  tableData: PlannableOrder[] = [];
  availableDates: Date[] = [];
  allBeatNames: string[] = [];
  allSalesPersonNames: string[] = [];
  appliedBeatFilters: string[] = [];
  appliedSalesPersonFilters: string[] = [];
  /** Delivery type filter above Available Orders: all, Consolidated Delivery (cds), 3PL Delivery, Direct (self). */
  appliedDeliveryType: DeliveryTypeFilter = 'all';
  beatDd: DropdownState = emptyDropdown();
  salesDd: DropdownState = emptyDropdown();
  selectAll = false;
  sortColumn: SortKey = 'orderDate';
  sortDirection: 'asc' | 'desc' = 'desc';

  selectedDeliveryDateObj: Date = new Date();
  selectedDeliveryDate = '';
  selectedSLA = '';
  buyerLogisticsMode = 'self';
  selectedEngine = '';
  showModeSelector = false;
  selectedLogisticsMode = 'self';

  isPlanning = false;
  showOptimizedRoutesModal = false;
  deliveryRouteSeletedOrders: string[] = [];
  unassignedModal: UnassignedModal | null = null;
  private unassignedResolve: ((v: boolean) => void) | null = null;

  async ngOnInit() {
    const tomorrow = startOfDay(new Date());
    tomorrow.setDate(tomorrow.getDate() + 1);
    this.selectedDeliveryDateObj = tomorrow;
    this.selectedDeliveryDate = ymdLocal(tomorrow);
    this.selectedSLA = deriveSLAFromDate(tomorrow);
    this.render();
    await Promise.all([this.loadOrders(), this.loadLogisticsMode()]);
  }

  async loadOrders() {
    this.isLoading = true;
    try {
      const orders = await routeOrdersService.getDeliveryRootOrders({ buyerId: this.buyerId, orderStatus: [1] });
      this.availableOrders = [...orders].sort((a, b) => {
        const at = a.orderDate ? new Date(a.orderDate).getTime() : NaN;
        const bt = b.orderDate ? new Date(b.orderDate).getTime() : NaN;
        if (isNaN(at) && isNaN(bt)) return (+b.amount || 0) - (+a.amount || 0);
        if (isNaN(at)) return 1;
        if (isNaN(bt)) return -1;
        return bt - at || (+b.amount || 0) - (+a.amount || 0);
      });
      const raw = Array.from(new Set(this.availableOrders.map((o) => o.orderDate).filter((d) => d && !isNaN(new Date(d).getTime()))));
      this.availableDates = raw.map((d) => new Date(d)).sort((a, b) => a.getTime() - b.getTime());
      this.allBeatNames = Array.from(new Set(this.availableOrders.map((o) => o.beat).filter(Boolean))).sort();
      this.allSalesPersonNames = Array.from(new Set(this.availableOrders.map((o) => o.salesPerson).filter(Boolean))).sort();
      this.applyFilters();
    } finally {
      this.isLoading = false;
      this.render();
    }
  }

  async loadLogisticsMode() {
    try {
      const data = await buyerSettingsService.getBuyerSettings(this.buyerId);
      const cfg = data?.buyer_config?.routePlanningConfig;
      this.buyerLogisticsMode = cfg?.logisticsMode || 'self';
      this.selectedEngine = cfg?.routeEngine?.selectedEngine || '';
      this.showModeSelector = this.buyerLogisticsMode === 'self+3pl';
      this.selectedLogisticsMode = this.buyerLogisticsMode === '3pl' ? '3pl' : 'self';
    } catch (e) {
      console.error('Error loading buyer settings:', e);
    }
    this.render();
  }

  onDeliveryDateChange(d: Date | null) {
    if (!d) return;
    this.selectedDeliveryDateObj = d;
    this.selectedDeliveryDate = ymdLocal(d);
    this.selectedSLA = deriveSLAFromDate(d);
    this.render();
  }

  dateFilter = (d: Date | null) => {
    if (!d) return false;
    const t = startOfDay(d).getTime();
    const today = startOfDay(new Date()).getTime();
    return t >= today && t <= today + 2 * 86400000 + 3600000; // DST-safe upper bound for today+2
  };

  // ------------------------------------------------------------ filtering / sorting / selection
  applyFilters() {
    this.filteredOrders = this.availableOrders.filter(
      (o) =>
        (this.appliedDeliveryType === 'all' || o.deliveryType === this.appliedDeliveryType) &&
        (!this.appliedBeatFilters.length || this.appliedBeatFilters.includes(o.beat)) &&
        (!this.appliedSalesPersonFilters.length || this.appliedSalesPersonFilters.includes(o.salesPerson)),
    );
    this.applySorting();
    this.updateSelection();
  }
  setDeliveryType(type: DeliveryTypeFilter) {
    this.appliedDeliveryType = type;
    this.applyFilters();
    this.render();
  }
  deliveryTypeCount(type: DeliveryTypeFilter) {
    return type === 'all' ? this.availableOrders.length : this.availableOrders.filter((o) => o.deliveryType === type).length;
  }

  private compare(a: PlannableOrder, b: PlannableOrder, key: SortKey): number {
    const av = (a as any)[key];
    const bv = (b as any)[key];
    const an = av === null || av === undefined;
    const bn = bv === null || bv === undefined;
    if (an && bn) return 0;
    if (an) return 1;
    if (bn) return -1;
    let r: number;
    if (key === 'orderDate') r = new Date(av).getTime() - new Date(bv).getTime();
    else if (NUMERIC.includes(key)) r = parseFloat(av) - parseFloat(bv);
    else r = String(av).localeCompare(String(bv));
    return r * (this.sortDirection === 'asc' ? 1 : -1);
  }

  applySorting() {
    this.tableData = [...this.filteredOrders].sort((a, b) => this.compare(a, b, this.sortColumn));
  }

  onSort(key: SortKey) {
    if (this.sortColumn === key) this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    else {
      this.sortColumn = key;
      this.sortDirection = 'asc';
    }
    this.applySorting();
    this.render();
  }

  updateSelection() {
    this.selectAll = this.filteredOrders.length > 0 && this.filteredOrders.every((o) => o.selected);
    this.render();
  }

  toggleSelectAll(checked: boolean) {
    this.selectAll = checked;
    this.filteredOrders.forEach((o) => (o.selected = checked));
    this.render();
  }

  private selectedRows() {
    return this.filteredOrders.filter((o) => o.selected);
  }
  getSelectedOrderCount() {
    return this.selectedRows().length;
  }
  getTotalInvoiceValue() {
    return this.selectedRows().reduce((s, o) => s + (+o.amount || 0), 0);
  }
  getTotalVolumetricWeight() {
    return this.selectedRows().reduce((s, o) => s + (+o.volumetricWeight || 0), 0);
  }

  // ------------------------------------------------------------ date chips
  ordersForDate(d: Date) {
    const key = d.toISOString().slice(0, 10);
    return this.availableOrders.filter((o) => isoDay(o.orderDate) === key);
  }
  isDateSelected(d: Date) {
    const os = this.ordersForDate(d);
    return os.length > 0 && os.every((o) => o.selected);
  }
  toggleDate(d: Date) {
    const v = !this.isDateSelected(d);
    this.ordersForDate(d).forEach((o) => (o.selected = v));
    this.updateSelection();
  }
  removeDate(d: Date) {
    this.ordersForDate(d).forEach((o) => (o.selected = false));
    this.updateSelection();
  }
  clearAllDates() {
    this.availableOrders.forEach((o) => (o.selected = false));
    this.updateSelection();
  }
  get allDatesSelected() {
    return this.availableDates.length > 0 && this.availableDates.every((d) => this.isDateSelected(d));
  }
  getSelectedDateString() {
    const d = this.availableDates.find((x) => this.isDateSelected(x));
    return d ? fmtDate(d, 'd-M-yyyy') : '';
  }

  // ------------------------------------------------------------ beat / sales-person dropdowns
  private dd(kind: 'beat' | 'sales') {
    return kind === 'beat' ? this.beatDd : this.salesDd;
  }
  private allNames(kind: 'beat' | 'sales') {
    return kind === 'beat' ? this.allBeatNames : this.allSalesPersonNames;
  }
  private applied(kind: 'beat' | 'sales') {
    return kind === 'beat' ? this.appliedBeatFilters : this.appliedSalesPersonFilters;
  }

  toggleFilter(kind: 'beat' | 'sales', e: React.MouseEvent<HTMLButtonElement>) {
    e.stopPropagation();
    const dd = this.dd(kind);
    if (dd.open) {
      dd.open = false;
      this.render();
      return;
    }
    const other = this.dd(kind === 'beat' ? 'sales' : 'beat');
    other.open = false;
    const rect = e.currentTarget.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom - 16;
    const above = spaceBelow < 360 && rect.top > 360;
    dd.style = {
      position: 'fixed',
      left: rect.left,
      zIndex: 1001,
      maxHeight: Math.min(360, above ? rect.top - 16 : spaceBelow),
      overflow: 'auto',
      ...(above ? { bottom: window.innerHeight - rect.top + 4 } : { top: rect.bottom + 4 }),
    };
    dd.search = '';
    const applied = this.applied(kind);
    dd.checked = new Set(applied.length ? applied : this.allNames(kind));
    dd.open = true;
    this.render();
  }

  closeDropdowns() {
    this.beatDd.open = false;
    this.salesDd.open = false;
    this.render();
  }

  filteredNames(kind: 'beat' | 'sales') {
    const q = this.dd(kind).search.trim().toLowerCase();
    const names = this.allNames(kind);
    return q ? names.filter((n) => n.toLowerCase().includes(q)) : names;
  }
  isSelectAll(kind: 'beat' | 'sales') {
    const f = this.filteredNames(kind);
    const dd = this.dd(kind);
    return f.length > 0 && f.every((n) => dd.checked.has(n));
  }
  toggleSelectAllNames(kind: 'beat' | 'sales') {
    const v = !this.isSelectAll(kind);
    const dd = this.dd(kind);
    this.filteredNames(kind).forEach((n) => (v ? dd.checked.add(n) : dd.checked.delete(n)));
    this.render();
  }
  toggleName(kind: 'beat' | 'sales', n: string) {
    const dd = this.dd(kind);
    if (dd.checked.has(n)) dd.checked.delete(n);
    else dd.checked.add(n);
    this.render();
  }
  clearFilter(kind: 'beat' | 'sales') {
    this.dd(kind).checked = new Set();
    if (kind === 'beat') this.appliedBeatFilters = [];
    else this.appliedSalesPersonFilters = [];
    this.applyFilters(); // the dropdown stays open
  }
  applyFilter(kind: 'beat' | 'sales') {
    const dd = this.dd(kind);
    const all = this.allNames(kind);
    const checked = all.filter((n) => dd.checked.has(n));
    // [as-built] all checked → no filter; none checked → also no filter
    const applied = checked.length === all.length ? [] : checked;
    if (kind === 'beat') this.appliedBeatFilters = applied;
    else this.appliedSalesPersonFilters = applied;
    dd.open = false;
    this.applyFilters();
  }
  removeBeatFilterTag(b: string) {
    this.appliedBeatFilters = this.appliedBeatFilters.filter((x) => x !== b);
    this.applyFilters();
  }
  clearAllBeatFilters() {
    this.appliedBeatFilters = [];
    this.applyFilters();
  }
  removeSalesPersonFilterTag(s: string) {
    this.appliedSalesPersonFilters = this.appliedSalesPersonFilters.filter((x) => x !== s);
    this.applyFilters();
  }
  clearAllSalesPersonFilters() {
    this.appliedSalesPersonFilters = [];
    this.applyFilters();
  }

  // ------------------------------------------------------------ plan routes
  async confirm() {
    const ids = this.filteredOrders.filter((o) => o.selected).map((o) => o.orderNumber);
    if (!ids.length) {
      toastWarning('Warning', 'Please select at least one order');
      return;
    }
    this.isPlanning = true;
    this.render();
    try {
      if (this.selectedEngine === 'cluster_beat_optimized') {
        const ok = await this.warnUnassignedBeats(ids);
        if (!ok) return;
      }
      this.deliveryRouteSeletedOrders = ids;
      this.showOptimizedRoutesModal = true;
    } finally {
      this.isPlanning = false;
      this.render();
    }
  }

  async warnUnassignedBeats(ids: string[]): Promise<boolean> {
    const res = await deliveryRoutesService.getUnassignedBeats({ buyerId: this.buyerId, orderIds: ids });
    if (!res || res.unassignedOrderCount === 0) return true;
    const names = res.unassignedBeatNames || [];
    this.unassignedModal = { count: res.unassignedOrderCount, total: res.totalOrders, shownBeats: names.slice(0, 8), moreCount: Math.max(0, names.length - 8) };
    this.isPlanning = false;
    this.render();
    return new Promise<boolean>((resolve) => (this.unassignedResolve = resolve));
  }

  resolveUnassigned(v: boolean, goToSettings = false) {
    this.unassignedModal = null;
    const r = this.unassignedResolve;
    this.unassignedResolve = null;
    this.render();
    r?.(v);
    if (goToSettings) this.navigate('/settings/clusters');
  }
}

// ---------------------------------------------------------------- view
const FunnelIcon = ({ size = 14, stroke = 'currentColor' }: { size?: number; stroke?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
  </svg>
);
const SortArrow = ({ dir }: { dir: 'asc' | 'desc' }) => (
  <svg className="sort-arrow" width="8" height="14" viewBox="0 0 8 14" style={{ transform: dir === 'asc' ? 'rotate(180deg)' : undefined }}>
    <rect x="3" y="0" width="2" height="9" fill="#2563eb" />
    <polygon points="0,8 8,8 4,14" fill="#2563eb" />
  </svg>
);

export default function CreateDeliveryRoutePage() {
  const navigate = useNavigate();
  const perms = usePagePermissions('buyer_delivery_routes');
  const [, force] = useReducer((x: number) => x + 1, 0);
  const [c] = useState(() => new CreateRouteController());
  c.navigate = navigate;
  c.buyerId = perms.buyerId;
  c.render = force;
  const [pickerAnchor, setPickerAnchor] = useState<HTMLElement | null>(null);
  const fieldRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (perms.hasView) void c.ngOnInit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!perms.hasView) return null;

  const header = (key: SortKey, icon: string, label: string, centered = false, filter?: 'beat' | 'sales') => {
    const applied = filter === 'beat' ? c.appliedBeatFilters : filter === 'sales' ? c.appliedSalesPersonFilters : [];
    return (
      <th className="mat-mdc-header-cell">
        <div className={`th-wrap${centered ? ' centered' : ''}`}>
          <div className="th-content sortable" onClick={() => c.onSort(key)}>
            <i className={`fas ${icon}`} /> {label}
            {c.sortColumn === key && <SortArrow dir={c.sortDirection} />}
          </div>
          {filter && (
            <button className={`beat-filter-btn${applied.length ? ' active' : ''}`} onClick={(e) => c.toggleFilter(filter, e)}>
              <FunnelIcon />
              {applied.length > 0 && <span className="filter-badge">{applied.length}</span>}
            </button>
          )}
        </div>
      </th>
    );
  };

  const dropdown = (kind: 'beat' | 'sales') => {
    const dd = kind === 'beat' ? c.beatDd : c.salesDd;
    if (!dd.open) return null;
    const names = c.filteredNames(kind);
    return (
      <>
        <div className="filter-backdrop" onClick={() => c.closeDropdowns()} />
        <div className="filter-dropdown" style={dd.style} onClick={(e) => e.stopPropagation()}>
          <div className="filter-search">
            <i className="fas fa-search" />
            <input
              autoFocus
              placeholder={kind === 'beat' ? 'Search beat name...' : 'Search sales person...'}
              value={dd.search}
              onChange={(e) => {
                dd.search = e.target.value;
                force();
              }}
            />
          </div>
          <div className="filter-list">
            <label className="filter-item select-all-item">
              <input type="checkbox" checked={c.isSelectAll(kind)} onChange={() => c.toggleSelectAllNames(kind)} />
              <span>SELECT ALL</span>
            </label>
            {names.map((n) => (
              <label key={n} className="filter-item">
                <input type="checkbox" checked={dd.checked.has(n)} onChange={() => c.toggleName(kind, n)} />
                <span>{n}</span>
              </label>
            ))}
          </div>
          <div className="filter-footer">
            <span className="filter-count">{dd.checked.size} SELECTED</span>
            <div className="filter-actions">
              <button className="filter-clear" onClick={() => c.clearFilter(kind)}>Clear</button>
              <button className="filter-apply" onClick={() => c.applyFilter(kind)}>Apply</button>
            </div>
          </div>
        </div>
      </>
    );
  };

  const today = startOfDay(new Date());
  const minDate = dayjs(today);
  const maxDate = dayjs(today).add(2, 'day');

  return (
    <div className="create-delivery-route-page create-route-container">
      <header className="orders-header">
        <button className="back-btn" onClick={() => navigate('/delivery-routes')}><i className="fas fa-arrow-left" /></button>
        <h1><i className="fas fa-route" /> Create Delivery Route</h1>
      </header>

      <div className="route-card">
        <div className="card-content w-100 p-3">
          <div className="route-config-bar">
            <div className="config-item">
              <label className="config-label">Delivery Date</label>
              <div ref={fieldRef}>
                <TextField
                  size="small"
                  value={formatDisplayDate(c.selectedDeliveryDateObj)}
                  onClick={() => setPickerAnchor(fieldRef.current)}
                  sx={{ width: 200, cursor: 'pointer', '& input': { cursor: 'pointer' } }}
                  InputProps={{
                    readOnly: true,
                    startAdornment: (
                      <InputAdornment position="start">
                        <IconButton size="small" edge="start" aria-label="Open calendar" onClick={(e) => { e.stopPropagation(); setPickerAnchor(fieldRef.current); }}>
                          <span className="material-icons" style={{ fontSize: 20 }}>calendar_today</span>
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </div>
              <Popover open={!!pickerAnchor} anchorEl={pickerAnchor} onClose={() => setPickerAnchor(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}>
                <DateCalendar
                  value={dayjs(c.selectedDeliveryDateObj)}
                  minDate={minDate}
                  maxDate={maxDate}
                  shouldDisableDate={(d: Dayjs) => !c.dateFilter(d.toDate())}
                  onChange={(v: Dayjs | null) => {
                    c.onDeliveryDateChange(v ? startOfDay(v.toDate()) : null);
                    setPickerAnchor(null);
                  }}
                />
              </Popover>
            </div>
            {c.showModeSelector && (
              <div className="config-item">
                <label className="config-label">Delivery Type</label>
                <div className="mode-radios">
                  <label><input type="radio" name="deliveryLogisticsMode" value="self" checked={c.selectedLogisticsMode === 'self'} onChange={() => { c.selectedLogisticsMode = 'self'; force(); }} /> Self Fleet</label>
                  <label><input type="radio" name="deliveryLogisticsMode" value="3pl" checked={c.selectedLogisticsMode === '3pl'} onChange={() => { c.selectedLogisticsMode = '3pl'; force(); }} /> 3PL</label>
                </div>
              </div>
            )}
          </div>

          <div className="section">
            <h2>Order Dates</h2>
            <div className="date-options">
              {c.availableDates.map((d, i) => (
                <label key={`${d.getTime()}-${i}`} className={`date-checkbox${c.isDateSelected(d) ? ' checked' : ''}`}>
                  <input type="checkbox" checked={c.isDateSelected(d)} onChange={() => c.toggleDate(d)} />
                  <span>{fmtDate(d, 'd-M-yyyy')}</span>
                </label>
              ))}
            </div>
            {c.availableDates.some((d) => c.isDateSelected(d)) && (
              <div className="selected-dates">
                <span className="selected-dates-label">Selected Dates:</span>
                {c.allDatesSelected ? (
                  <span className="date-tag">All dates selected <button onClick={() => c.clearAllDates()}><i className="fas fa-times" /></button></span>
                ) : (
                  c.availableDates.filter((d) => c.isDateSelected(d)).map((d, i) => (
                    <span key={`${d.getTime()}-${i}`} className="date-tag">{fmtDate(d, 'd-M-yyyy')} <button onClick={() => c.removeDate(d)}><i className="fas fa-times" /></button></span>
                  ))
                )}
              </div>
            )}
          </div>

          {c.appliedBeatFilters.length > 0 && (
            <div className="applied-filters">
              <span className="applied-label"><FunnelIcon stroke="#4b5563" /> Beat Filters </span>
              {c.appliedBeatFilters.map((b) => (
                <span key={b} className="filter-chip">{b} <i className="fas fa-times" onClick={() => c.removeBeatFilterTag(b)} /></span>
              ))}
              <span className="clear-all-link" onClick={() => c.clearAllBeatFilters()}>Clear all</span>
            </div>
          )}
          {c.appliedSalesPersonFilters.length > 0 && (
            <div className="applied-filters">
              <span className="applied-label"><i className="fas fa-user" style={{ color: '#4b5563' }} /> Sales Person </span>
              {c.appliedSalesPersonFilters.map((s) => (
                <span key={s} className="filter-chip">{s} <i className="fas fa-times" onClick={() => c.removeSalesPersonFilterTag(s)} /></span>
              ))}
              <span className="clear-all-link" onClick={() => c.clearAllSalesPersonFilters()}>Clear all</span>
            </div>
          )}

          <div className="section">
            <div className="orders-title-row">
              <h2 className="mb-0">Available Orders</h2>
              <label className="select-all-checkbox">
                <input type="checkbox" checked={c.selectAll} onChange={(e) => c.toggleSelectAll(e.target.checked)} /> Select All
              </label>
            </div>
            {/* Delivery type of the orders: Consolidated Delivery (CDS), 3PL Delivery or Direct (own vehicles). */}
            <div className="delivery-type-filter" role="group" aria-label="Filter by delivery type">
              <span className="delivery-type-label">Delivery type:</span>
              {DELIVERY_TYPE_FILTERS.map((f) => (
                <button
                  key={f.value}
                  type="button"
                  className={`delivery-type-chip${c.appliedDeliveryType === f.value ? ' active' : ''}`}
                  aria-pressed={c.appliedDeliveryType === f.value}
                  onClick={() => c.setDeliveryType(f.value)}
                >
                  {f.label} <span className="delivery-type-count">{c.deliveryTypeCount(f.value)}</span>
                </button>
              ))}
            </div>
            <div className="orders-table-container">
              <table className="orders-table">
                <thead>
                  <tr>
                    <th className="mat-mdc-header-cell select-col" />
                    {header('orderDate', 'fa-calendar', 'Order Date')}
                    {header('customerBusinessName', 'fa-store', 'Retailer Name')}
                    {header('salesPerson', 'fa-user', 'Sales Person', false, 'sales')}
                    {header('beat', 'fa-route', 'Beat Name', false, 'beat')}
                    {header('refOrderNumber', 'fa-hashtag', 'Ref Order Number')}
                    {header('amount', 'fa-hashtag', 'Invoice Value', true)}
                    {header('totalWeight', 'fa-weight-hanging', 'Weight (kg)', true)}
                    {header('volumetricWeight', 'fa-cube', 'Vol. Weight (kg)', true)}
                  </tr>
                </thead>
                <tbody>
                  {c.tableData.map((o) => (
                    <tr key={o.orderNumber} className="order-row">
                      <td className="select-col">
                        <input type="checkbox" checked={!!o.selected} onChange={(e) => { o.selected = e.target.checked; c.updateSelection(); }} />
                      </td>
                      <td>{fmtDate(o.orderDate, 'dd-MM-yyyy')}</td>
                      <td>{o.customerBusinessName}</td>
                      <td>{o.salesPerson}</td>
                      <td>{o.beat}</td>
                      <td>{o.refOrderNumber}</td>
                      <td className="text-center">{addCurrency(o.amount)}</td>
                      <td className="text-center">{addWeight(o.totalWeight)}</td>
                      <td className="text-center">{addWeight(o.volumetricWeight)}</td>
                    </tr>
                  ))}
                  {c.tableData.length === 0 && (
                    <tr><td className="text-center py-4" colSpan={9}> No orders available </td></tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="summary-row">
              <div><span className="text-primary"><i className="fas fa-list-ol" /> Selected Orders:</span> <span className="fw-bold">{c.getSelectedOrderCount()}</span></div>
              <div><span className="text-primary"><i className="fas fa-weight-hanging" /> Total Invoice Value:</span> <span className="fw-bold">{addCurrency(c.getTotalInvoiceValue())}</span></div>
              <div><span className="text-primary"><i className="fas fa-cube" /> Total Vol. Weight:</span> <span className="fw-bold">{addWeight(c.getTotalVolumetricWeight())}</span></div>
            </div>
          </div>

          <div className="action-buttons">
            <button className="cancel-btn" onClick={() => navigate('/delivery-routes')}>Cancel</button>
            <button className="confirm-btn" disabled={c.isPlanning} onClick={() => void c.confirm()}>
              {c.isPlanning ? <><i className="fas fa-spinner fa-spin" /> Planning…</> : 'Plan Routes'}
            </button>
          </div>
        </div>
      </div>

      {dropdown('beat')}
      {dropdown('sales')}

      <OptimizedRoutesModal
        show={c.showOptimizedRoutesModal}
        selectedOrderNumbers={c.deliveryRouteSeletedOrders}
        selectedSLA={c.selectedSLA}
        selectedDeliveryDate={c.selectedDeliveryDate}
        selectedOrderDate={c.getSelectedDateString()}
        logisticsMode={c.selectedLogisticsMode}
        onClose={() => { c.showOptimizedRoutesModal = false; force(); }}
        onConfirm={() => { c.showOptimizedRoutesModal = false; force(); navigate('/delivery-routes'); }}
      />

      {c.unassignedModal && (
        <div className="ub-overlay" onClick={() => c.resolveUnassigned(false)}>
          <div className="ub-card" onClick={(e) => e.stopPropagation()}>
            <button className="ub-close" aria-label="Close" onClick={() => c.resolveUnassigned(false)}><i className="fas fa-times" /></button>
            <div className="ub-icon"><i className="fas fa-exclamation" /></div>
            <h3 className="ub-title">Some beats aren't in a cluster</h3>
            <p className="ub-lead">
              <span className="ub-count">{c.unassignedModal.count}</span> of {c.unassignedModal.total} selected orders belong to beats that aren't assigned to any cluster.{' '}
            </p>
            <div className="ub-chips">
              {c.unassignedModal.shownBeats.map((b) => <span key={b} className="ub-chip">{b}</span>)}
              {c.unassignedModal.moreCount > 0 && <span className="ub-chip ub-chip-more">+{c.unassignedModal.moreCount} more</span>}
            </div>
            <div className="ub-note">
              <i className="fas fa-info-circle" />
              <span>Assign these beats under <b>Settings → Clusters</b> to route them on the right vehicles. Otherwise they'll be planned as <b>unassigned routes</b>.</span>
            </div>
            <div className="ub-actions">
              <button className="ub-ghost" onClick={() => c.resolveUnassigned(false, true)}><i className="fas fa-cog" /> Go to Settings </button>
              <button className="ub-primary" onClick={() => c.resolveUnassigned(true)}>Plan anyway</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
