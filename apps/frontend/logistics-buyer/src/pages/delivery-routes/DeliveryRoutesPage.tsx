// Screen A — Delivery Planning list (/delivery-routes), spec 03 §3.
// Ported as a controller class (mirrors the Angular component's mutable fields, intervals and SSE subscriptions);
// React only re-renders when the controller calls `render()`.
import { useEffect, useReducer, useState } from 'react';
import { useNavigate, type NavigateFunction } from 'react-router';
import CircularProgress from '@mui/material/CircularProgress';
import DataLoading from '../../components/DataLoading';
import { usePagePermissions } from '../../hooks/usePagePermissions';
import { sseService } from '../../api/services/sse.service';
import { deliveryRoutesService, type DeliveryPlanningRow } from '../../api/services/routePlanning.service';
import { toastError } from '../../utils/helpers';
import { addWeight } from '../../utils/pipes';
import { fmtDate } from './drFormat';
import './DeliveryRoutesPage.css';

interface Provider {
  routeId: string;
  routeName: string;
  providerName: string;
  deliveryPrice: number;
  pickupTime: string;
  isEnabled: boolean;
  ondcSearchResultId: string;
  expireTime: string;
}

type Row = DeliveryPlanningRow;

const PROCESSING = ['AUTO_CONFIRMING', 'QUOTATION_REQUESTED', 'CONFIRMATION_IN_PROGRESS'];

function calculateDeliveryDate(createdDate: string, sla: string): string | null {
  if (!sla || !createdDate) return null;
  const d = new Date(createdDate);
  d.setHours(0, 0, 0, 0);
  const add = sla === 'SAME_DAY' ? 0 : sla === 'NEXT_DAY' ? 1 : sla === 'DAY_AFTER_NEXT_DAY' ? 2 : 0;
  d.setDate(d.getDate() + add);
  return d.toISOString();
}

class DeliveryRoutesController {
  // injected each render
  navigate: NavigateFunction = () => undefined;
  buyerId = '';
  hasView = false;
  render: () => void = () => undefined;

  alive = false;
  isLoading = false;
  deliveryPlannings: Row[] = [];
  dataSource: Row[] = [];
  overflowRoutes: Row[] = [];
  plannedRoutes: Row[] = [];
  totalCount = 0;
  currentTime = Date.now();
  timeLeftMap: Record<string, number> = {};
  timerInterval: number | null = null;

  showQuotationLoader = false;
  showProvidersModal = false;
  showSuccessModal = false;
  showBatchDialog = false;
  successMessage = '';
  selectedRoute: Row | null = null;
  selectedProvider: Provider | null = null;
  providers: Provider[] = [];
  confirmingComboId: string | null = null;
  confirmationTimer: number | null = null;

  completedSelfFleetIds = new Set<string>();
  phantomRoutes = new Set<string>();
  sseSuccessIds = new Set<string>();
  autoConfirmingIds = new Set<string>();
  pollInterval: number | null = null;
  isReloading = false;
  sessionCompletedCount = 0;
  batchDialogTimeout: number | null = null;
  ssePlanIds = new Set<string>();
  sseUnsubs = new Map<string, () => void>();
  private providerExpiryPending = false;

  // ------------------------------------------------------------ lifecycle
  ngOnInit() {
    this.alive = true;
    void this.loadRoutes();
  }

  ngOnDestroy() {
    this.alive = false;
    if (this.timerInterval) window.clearInterval(this.timerInterval);
    this.timerInterval = null;
    if (this.pollInterval) window.clearInterval(this.pollInterval);
    this.pollInterval = null;
    this.disconnectAllSse();
    // [as-built] the 15 s batch-dialog timeout is not cleared
  }

  private mapRows(rows: Row[]) {
    return rows.map((r) => ({ ...r, deliveryDate: calculateDeliveryDate(r.createdDate, r.sla) }));
  }

  private applyRows(res: { rows: Row[]; count: number; currentTime: number } | null) {
    const rows = this.mapRows(res?.rows || []);
    this.currentTime = res?.currentTime ?? Date.now();
    this.deliveryPlannings = rows;
    this.dataSource = rows;
    this.totalCount = res?.count || 0;
    this.plannedRoutes = rows.filter((r) => !!r.relationshipType);
    this.overflowRoutes = rows.filter((r) => !r.relationshipType);
    return rows;
  }

  async loadRoutes() {
    this.isLoading = true;
    this.render();
    try {
      const res = await deliveryRoutesService.getDeliveryPlannings({ buyerId: this.buyerId, pageNumber: 1, pageSize: 100, startDate: undefined, endDate: undefined });
      const rows = this.applyRows(res);
      if (rows.length > 0) {
        this.initializeTimers();
        this.initializeProviderTimers();
      }
      this.checkAutoConfirmingRoutes();
      this.setupSSEForSelfFleet();
    } catch (e) {
      console.error('Error loading delivery routes:', e);
      this.deliveryPlannings = [];
      this.dataSource = [];
      this.overflowRoutes = [];
      this.plannedRoutes = [];
      this.totalCount = 0;
    } finally {
      window.setTimeout(() => {
        this.isLoading = false;
        this.render();
      }, 300);
    }
  }

  async silentReloadRoutes(): Promise<boolean> {
    if (this.isReloading) return false;
    this.isReloading = true;
    try {
      const res = await deliveryRoutesService.getDeliveryPlannings({ buyerId: this.buyerId, pageNumber: 1, pageSize: 100, startDate: undefined, endDate: undefined });
      if (!res) return false;
      const rows = this.applyRows(res);
      rows.forEach((r) => {
        const e = r.routePlanComboExpireTime;
        if (e && !(e in this.timeLeftMap)) this.timeLeftMap[e] = Math.max(0, Math.floor((new Date(e).getTime() - this.currentTime) / 1000));
      });
      this.setupSSEForSelfFleet();
      this.render();
      return true;
    } catch (e) {
      console.error('Silent reload failed:', e);
      return false;
    } finally {
      this.isReloading = false;
    }
  }

  // ------------------------------------------------------------ timers
  initializeTimers() {
    if (this.timerInterval) window.clearInterval(this.timerInterval);
    this.timeLeftMap = {};
    this.deliveryPlannings.forEach((r) => {
      const e = r.routePlanComboExpireTime;
      if (e) this.timeLeftMap[e] = Math.max(0, Math.floor((new Date(e).getTime() - this.currentTime) / 1000));
    });
    if (!this.alive) return; // [deviation] no interval after the page was left (Angular would leak it)
    this.timerInterval = window.setInterval(() => {
      Object.keys(this.timeLeftMap).forEach((k) => (this.timeLeftMap[k] = Math.max(0, this.timeLeftMap[k] - 1)));
      this.render();
    }, 1000);
  }

  /** Same for providers[].expireTime — the provider list is empty when this runs, so effectively a no-op. */
  initializeProviderTimers() {
    this.providers.forEach((p) => {
      if (p.expireTime && !(p.expireTime in this.timeLeftMap)) {
        this.timeLeftMap[p.expireTime] = Math.max(0, Math.floor((new Date(p.expireTime).getTime() - this.currentTime) / 1000));
      }
    });
  }

  private format(secs: number) {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return m > 0 ? `${m}m ${s}s left` : `${s}s left`;
  }

  getTimeLeft(expiry: string): string {
    if (!expiry) return '';
    const secs = this.timeLeftMap[expiry] || 0;
    if (secs <= 0) {
      window.setTimeout(() => {
        const keep = (r: Row) => r.routePlanComboExpireTime !== expiry;
        const before = this.overflowRoutes.length + this.deliveryPlannings.length;
        this.deliveryPlannings = this.deliveryPlannings.filter(keep);
        this.dataSource = this.dataSource.filter(keep);
        this.overflowRoutes = this.overflowRoutes.filter(keep);
        // [as-built] plannedRoutes is not filtered
        if (before !== this.overflowRoutes.length + this.deliveryPlannings.length) this.render();
      }, 0);
      return 'Expired';
    }
    return this.format(secs);
  }

  getProviderTimeLeft(expireTime: string): string {
    const secs = this.timeLeftMap[expireTime] || 0;
    if (secs <= 0) {
      if (!this.providerExpiryPending) {
        this.providerExpiryPending = true;
        window.setTimeout(() => {
          this.providerExpiryPending = false;
          this.providers = [];
          this.closeProvidersModal();
          this.ngOnInit();
          toastError('Providers Expired!', 'Please try again.');
        }, 0);
      }
      return 'Expired';
    }
    return this.format(secs);
  }

  isProcessing(r: Row) {
    return PROCESSING.includes(r.routePlanComboStatus);
  }
  isTimedOut(r: Row) {
    const e = r.routePlanComboExpireTime;
    return !!e && (this.timeLeftMap[e] || 0) <= 0;
  }
  isCompleted(r: Row) {
    return this.completedSelfFleetIds.has(r.routePlanComboId);
  }

  // ------------------------------------------------------------ quotation flow
  async requestQuotation(row: Row) {
    this.showQuotationLoader = true;
    this.selectedRoute = row;
    this.render();
    try {
      await deliveryRoutesService.requestForQuotation({ routeId: row.routePlanComboId });
      window.setTimeout(() => {
        this.showQuotationLoader = false;
        this.showProvidersModal = true;
        this.render();
        void this.viewQuotation(row);
      }, 5000);
      await this.loadRoutes();
    } catch (e) {
      console.error('Error requesting quotation:', e);
      // [as-built] the quotation loader is NOT hidden; the overlay stays until the page is left/reloaded
      // (browser Back / Reload recover).
      toastError('Failed to request quotation!', 'Please try again.');
    }
  }

  async getRouteExpireTime(routeId: string): Promise<string> {
    let r = this.deliveryPlannings.find((x) => x.routeId === routeId);
    if (!r) {
      await this.loadRoutes();
      r = this.deliveryPlannings.find((x) => x.routeId === routeId);
    }
    return r?.routePlanComboExpireTime || '';
  }

  async viewQuotation(row: Row) {
    this.selectedRoute = row;
    this.render();
    try {
      const expireTime = await this.getRouteExpireTime(row.routeId);
      const data = (await deliveryRoutesService.getAvailableProviders({ combinationId: row.routePlanComboId })) || [];
      this.providers = data.map((d) => ({
        routeId: d.routeId,
        routeName: d.routeName,
        providerName: d.providerName,
        deliveryPrice: Number(d.deliveryPrice),
        pickupTime: d.pickupTime,
        isEnabled: d.isEnabled,
        ondcSearchResultId: d.ondcSearchId,
        expireTime,
      }));
      this.selectedProvider = null;
      this.showProvidersModal = true;
    } catch (e) {
      console.error('Error fetching providers:', e);
      toastError('Failed to get providers!', 'Please try again.');
    }
    this.render();
  }

  closeProvidersModal() {
    if (this.confirmationTimer) window.clearInterval(this.confirmationTimer);
    this.confirmationTimer = null;
    this.showProvidersModal = false;
    this.showQuotationLoader = false;
    this.selectedRoute = null;
    this.selectedProvider = null;
    this.render();
  }

  selectProvider(p: Provider) {
    this.selectedProvider = p;
    this.render();
  }

  async confirmProvider() {
    if (!this.selectedRoute || !this.selectedProvider || this.confirmingComboId) return;
    const route = this.selectedRoute;
    const provider = this.selectedProvider;
    this.confirmingComboId = route.routePlanComboId;
    route.provider = provider;
    this.showProvidersModal = false;
    this.render();
    try {
      await deliveryRoutesService.requestForConfirm({ ondcSearchResultId: provider.ondcSearchResultId });
      this.completeConfirmation(route, provider);
    } catch (e) {
      console.error('Error confirming provider:', e);
      toastError('Failed to confirm provider!', 'Please try again.');
    } finally {
      this.confirmingComboId = null;
      this.render();
    }
  }

  completeConfirmation(route: Row, provider: Provider) {
    // [as-built] uses routeName, not providerName
    this.successMessage = `Confirmed provider ${provider.routeName} for route ${route.routeId}`;
    this.showSuccessModal = true;
    this.render();
    window.setTimeout(() => {
      this.showSuccessModal = false;
      this.render();
      this.navigate('/trips');
    }, 1000);
  }

  // ------------------------------------------------------------ self-fleet tracking (SSE + polling)
  private activePlanned() {
    return this.plannedRoutes.filter((r) => this.isProcessing(r) && !this.isTimedOut(r) && !this.isCompleted(r));
  }

  setupSSEForSelfFleet() {
    if (!this.alive) return; // [deviation] do not open connections after the page was left
    const ids = new Set(this.plannedRoutes.filter((r) => this.isProcessing(r) && !this.isTimedOut(r)).map((r) => r.routePlanRequestId).filter(Boolean));
    ids.forEach((id) => {
      if (this.ssePlanIds.has(id)) return;
      this.ssePlanIds.add(id);
      sseService.connect('delivery-plan', id);
      const unsub = sseService.getMessagesFromEntity('delivery-plan', id, (event) => {
        if (event.data === 'tripCreated') void this.handleSelfFleetTripCreated(id);
      });
      this.sseUnsubs.set(id, unsub);
    });
  }

  disconnectAllSse() {
    this.sseUnsubs.forEach((u) => u());
    this.sseUnsubs.clear();
    this.ssePlanIds.forEach((id) => sseService.disconnect('delivery-plan', id));
    this.ssePlanIds.clear();
  }

  async handleSelfFleetTripCreated(planId: string) {
    this.plannedRoutes.filter((r) => r.routePlanRequestId === planId && this.isProcessing(r)).forEach((r) => this.sseSuccessIds.add(r.routePlanComboId));
    const snapshot = new Map<string, Row>();
    this.plannedRoutes.forEach((r) => snapshot.set(r.routePlanComboId, { ...r }));
    const ok = await this.silentReloadRoutes();
    if (!ok) return;
    const present = new Set(this.plannedRoutes.map((r) => r.routePlanComboId));
    let appended = 0;
    snapshot.forEach((old, comboId) => {
      if (!present.has(comboId) && this.sseSuccessIds.has(comboId) && !this.completedSelfFleetIds.has(comboId)) {
        this.completedSelfFleetIds.add(comboId);
        this.phantomRoutes.add(comboId);
        this.sessionCompletedCount += 1;
        this.plannedRoutes = [...this.plannedRoutes, old];
        appended += 1;
      }
    });
    if (appended > 0) this.checkBatchCompletion();
    if (this.activePlanned().length === 0) this.disconnectAllSse();
    this.render();
  }

  checkBatchCompletion() {
    if (this.activePlanned().length === 0 && this.sessionCompletedCount > 0) {
      this.showBatchDialog = true;
      if (this.batchDialogTimeout) window.clearTimeout(this.batchDialogTimeout);
      this.batchDialogTimeout = window.setTimeout(() => this.clearCompletedSelfFleet(), 15000);
      this.render();
    }
  }

  checkAutoConfirmingRoutes() {
    this.plannedRoutes.filter((r) => this.isProcessing(r) && !this.isTimedOut(r)).forEach((r) => this.autoConfirmingIds.add(r.routePlanComboId));
    if (this.autoConfirmingIds.size > 0 && !this.pollInterval && this.alive) {
      this.pollInterval = window.setInterval(() => void this.pollForAutoConfirmCompletion(), 30000);
    }
  }

  stopPolling() {
    if (this.pollInterval) window.clearInterval(this.pollInterval);
    this.pollInterval = null;
  }

  async pollForAutoConfirmCompletion() {
    this.autoConfirmingIds.forEach((id) => {
      const r = this.plannedRoutes.find((x) => x.routePlanComboId === id);
      if (r && this.isTimedOut(r)) this.autoConfirmingIds.delete(id);
    });
    if (this.autoConfirmingIds.size === 0) {
      this.stopPolling();
      return;
    }
    const ok = await this.silentReloadRoutes();
    if (!ok) return;
    const present = new Set(this.plannedRoutes.map((r) => r.routePlanComboId));
    Array.from(this.autoConfirmingIds).forEach((id) => {
      if (!present.has(id)) {
        if (!this.sseSuccessIds.has(id)) toastError('Trip Generation Failed', 'Route expired. Please create a new route.');
        this.autoConfirmingIds.delete(id);
      }
    });
    if (this.autoConfirmingIds.size === 0) this.stopPolling();
    this.render();
  }

  clearCompletedSelfFleet() {
    this.showBatchDialog = false;
    if (this.batchDialogTimeout) window.clearTimeout(this.batchDialogTimeout);
    this.batchDialogTimeout = null;
    this.plannedRoutes = this.plannedRoutes.filter((r) => !this.completedSelfFleetIds.has(r.routePlanComboId));
    this.completedSelfFleetIds.clear();
    this.phantomRoutes.clear();
    // [as-built] sessionCompletedCount is never reset
    this.render();
  }

  dismissBatchDialog() {
    this.clearCompletedSelfFleet();
  }

  viewRoute(row: Row) {
    this.navigate('/delivery-route-details', { state: { routeData: row } });
  }
}

// ---------------------------------------------------------------- view
const DISPLAYED_COLUMNS = 7;

function HeaderCell({ icon, label, align = 'left', sort }: { icon: string; label: string; align?: 'left' | 'center' | 'right'; sort?: { active: boolean; dir: 'asc' | 'desc'; onClick: () => void } }) {
  return (
    <th className={`mat-mdc-header-cell text-uppercase py-2 small ${align === 'center' ? 'px-2 text-center' : 'px-3'} ${align === 'right' ? 'text-end' : ''} ${sort ? 'dr-sortable' : ''}`} onClick={sort?.onClick}>
      <i className={`fas ${icon} me-1 text-primary`} /> {label}{' '}
      {sort && <span className={`dr-sort-arrow ${sort.active ? 'active' : ''}`}>{sort.active && sort.dir === 'desc' ? '↓' : '↑'}</span>}
    </th>
  );
}

export default function DeliveryRoutesPage() {
  const navigate = useNavigate();
  const perms = usePagePermissions('buyer_delivery_routes');
  const [, force] = useReducer((x: number) => x + 1, 0);
  const [c] = useState(() => new DeliveryRoutesController());
  c.navigate = navigate;
  c.buyerId = perms.buyerId;
  c.hasView = perms.hasView;
  c.render = force;
  // inert mat-sort headers on the Overflow table (arrow only, rows are not reordered) [as-built]
  const [sort, setSort] = useState<{ key: string; dir: 'asc' | 'desc' } | null>(null);

  useEffect(() => {
    c.ngOnInit();
    return () => c.ngOnDestroy();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!perms.hasView) return null;

  const sortProps = (key: string) => ({
    active: sort?.key === key,
    dir: sort?.key === key ? sort.dir : 'asc',
    onClick: () => setSort((s) => (s?.key === key ? (s.dir === 'asc' ? { key, dir: 'desc' } : null) : { key, dir: 'asc' })),
  } as const);

  const commonCells = (row: Row) => (
    <>
      <td className="mat-mdc-cell py-2 px-3 small">{fmtDate(row.createdDate, 'medium')}</td>
      <td className="mat-mdc-cell py-2 px-3 small">{row.routeId}</td>
      <td className="mat-mdc-cell py-2 px-2 small text-center">{row.dropsPoints} points</td>
      <td className="mat-mdc-cell py-2 px-2 small text-center">{row.deliveryDate ? fmtDate(row.deliveryDate, 'dd MMM yyyy') : '-'}</td>
      <td className="mat-mdc-cell py-2 px-3 small text-end">{addWeight(row.weightValue)} / {addWeight(row.volumetricWeightValue)}</td>
    </>
  );

  const headerRow = (last: 'overflow' | 'planned', sortable: boolean) => (
    <tr className="mat-mdc-header-row">
      <HeaderCell icon="fa-calendar" label="Created Date" sort={sortable ? sortProps('createdDate') : undefined} />
      <HeaderCell icon="fa-hashtag" label="Route ID" sort={sortable ? sortProps('routeId') : undefined} />
      <HeaderCell icon="fa-map-marker-alt" label="Drop Points" align="center" sort={sortable ? sortProps('dropsPoints') : undefined} />
      <HeaderCell icon="fa-calendar-check" label="DELIVERY DATE" align="center" sort={sortable ? sortProps('sla') : undefined} />
      <HeaderCell icon="fa-weight-hanging" label="Weight / Vol" align="right" sort={sortable ? sortProps('weight') : undefined} />
      <HeaderCell icon="fa-hourglass-end" label="Route Expiry" align="center" sort={sortable ? sortProps('expiry') : undefined} />
      {last === 'overflow' ? <HeaderCell icon="fa-cogs" label="Actions" align="center" /> : <HeaderCell icon="fa-info-circle" label="Status" align="center" />}
    </tr>
  );

  const sectionHeader = (kind: 'rfq' | 'self-fleet', icon: string, title: string, sub: string, count: number) => (
    <div className={`section-header ${kind === 'rfq' ? 'rfq-header' : 'self-fleet-header'}`}>
      <div className="section-left">
        <div className="section-icon"><i className={`fas ${icon}`} /></div>
        <div>
          <h2>{title}</h2>
          <p>{sub}</p>
        </div>
      </div>
      <div className="section-right">
        <span className="count-pill">{count}</span>
        <span className="count-label">routes</span>
      </div>
    </div>
  );

  return (
    <div className="delivery-routes-page container-fluid p-3 bg-light h-100">
      <div className="row px-3">
        <div className="col-md-6">
          <div className="d-flex align-items-center">
            <i className="fas fa-shopping-bag text-primary me-2 fs-5" />
            <h1 className="fs-3 mb-0 fw-bold">Delivery Planning</h1>
          </div>
          <p className="text-muted small">Manage and track your delivery routes</p>
        </div>
        <div className="col-md-6 d-flex justify-content-md-end justify-content-start align-items-end gap-2 pt-3">
          <button className="btn btn-sm btn-primary d-flex align-items-center text-nowrap" onClick={() => navigate('/delivery-routes/create')}>
            <i className="fas fa-upload me-1 fs-6" />
            <span className="fs-6">Create Delivery Route</span>
          </button>
        </div>
      </div>

      <div className="p-3">
        {c.isLoading && <DataLoading message="Loading delivery routes..." showTip />}

        {!c.isLoading && c.overflowRoutes.length === 0 && c.plannedRoutes.length === 0 && (
          <div className="mat-card mat-elevation-z3 mb-4">
            <div className="mat-card-content p-0">
              <table className="mat-mdc-table w-100">
                <thead>{headerRow('overflow', false)}</thead>
                <tbody>
                  <tr>
                    <td className="text-center py-4" colSpan={DISPLAYED_COLUMNS}>
                      <i className="fas fa-inbox mb-3 text-muted" style={{ fontSize: '2rem' }} />
                      <p className="mb-0">No delivery plannings found</p>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {!c.isLoading && c.overflowRoutes.length > 0 && (
          <div className="mat-card mat-elevation-z3 mb-4 rfq-card">
            {sectionHeader('rfq', 'fa-handshake', 'Overflow Routes', 'Excess orders that need additional vehicle assignment', c.overflowRoutes.length)}
            <div className="mat-card-content p-0">
              <table className="mat-mdc-table w-100">
                <thead>{headerRow('overflow', true)}</thead>
                <tbody>
                  {c.overflowRoutes.map((row) => (
                    <tr key={row.routePlanComboId} className="mat-mdc-row">
                      {commonCells(row)}
                      <td className="mat-mdc-cell py-2 px-2 small text-center">
                        <span className="text-danger fw-medium">{c.getTimeLeft(row.routePlanComboExpireTime)}</span>
                      </td>
                      <td className="mat-mdc-cell py-2 px-2 small text-center">
                        {c.hasView && (
                          <button className="btn btn-sm text-primary" onClick={() => c.viewRoute(row)}><i className="fas fa-eye" /></button>
                        )}
                        {row.routePlanComboStatus === 'QUOTATION_REQUESTED' && (
                          <button className="btn btn-sm btn-primary dr-ml7" disabled={c.confirmingComboId === row.routePlanComboId} onClick={() => void c.viewQuotation(row)}>
                            {c.confirmingComboId === row.routePlanComboId ? (
                              <span className="d-inline-flex align-items-center gap-1"><CircularProgress size={14} color="inherit" /> Confirming...</span>
                            ) : 'View Quotation'}
                          </button>
                        )}
                        {row.routePlanComboStatus === 'CREATED' && (
                          <button className="btn btn-sm btn-success dr-ml7" onClick={() => void c.requestQuotation(row)}>Request Quotation</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {!c.isLoading && c.plannedRoutes.length > 0 && (
          <div className="mat-card mat-elevation-z3 mb-4 self-fleet-card">
            {sectionHeader('self-fleet', 'fa-truck', 'Planned Deliveries', 'Trips for vehicles assigned during route planning', c.plannedRoutes.length)}
            <div className="mat-card-content p-0">
              <table className="mat-mdc-table w-100">
                <thead>{headerRow('planned', false)}</thead>
                <tbody>
                  {c.plannedRoutes.map((row, i) => {
                    const completed = c.isCompleted(row);
                    const processing = c.isProcessing(row);
                    const timedOut = c.isTimedOut(row);
                    return (
                      <tr key={`${row.routePlanComboId}-${i}`} className={`mat-mdc-row ${c.phantomRoutes.has(row.routePlanComboId) ? 'phantom-completed' : ''}`}>
                        {commonCells(row)}
                        <td className="mat-mdc-cell py-2 px-2 small text-center">
                          {!timedOut && !completed && <span className="text-danger fw-medium">{c.getTimeLeft(row.routePlanComboExpireTime)}</span>}
                          {timedOut && !completed && <span className="text-muted">Expired</span>}
                        </td>
                        <td className="mat-mdc-cell py-2 px-2 small text-center">
                          <div className="d-flex align-items-center justify-content-center gap-2">
                            {c.hasView && !completed && (
                              <button className="btn btn-sm text-primary" onClick={() => c.viewRoute(row)}><i className="fas fa-eye" /></button>
                            )}
                            {processing && !timedOut && !completed && (
                              <span className="status-generating"><CircularProgress size={14} /> Generating Trip...</span>
                            )}
                            {processing && timedOut && !completed && (
                              <span className="status-failed"><i className="fas fa-exclamation-circle me-1" />Failed</span>
                            )}
                            {row.routePlanComboStatus === 'CREATED' && (
                              <button className="btn btn-sm btn-outline-success" onClick={() => void c.requestQuotation(row)}>
                                <i className="fas fa-play me-1" /> Generate Trip{' '}
                              </button>
                            )}
                            {completed && (
                              <span className="status-trip-created" onClick={() => navigate('/trips')}><i className="fas fa-check-circle me-1" />Trip Created</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Quotation loader — swallows clicks, cannot be dismissed */}
      {c.showQuotationLoader && (
        <div className="quotation-loader-overlay" onClick={(e) => e.stopPropagation()}>
          <div className="quotation-loader-card">
            <div className="quotation-loader-icon">
              <div className="quotation-loader-ring" />
              <i className="fas fa-truck" />
            </div>
            <h2>Requesting Quotations</h2>
            <p>Please wait while we fetch available providers...</p>
          </div>
        </div>
      )}

      {c.showProvidersModal && (
        <div className="providers-overlay" onClick={() => c.closeProvidersModal()}>
          <div className="providers-modal" onClick={(e) => e.stopPropagation()}>
            <div className="providers-header">
              <div>
                <h2>Available Providers</h2>
                <div className="route-id">Route: {c.selectedRoute?.routeId}</div>
              </div>
              <button className="close-btn" onClick={() => c.closeProvidersModal()}><i className="fas fa-times" /></button>
            </div>
            <div className="providers-body">
              {c.providers.map((p) => {
                const selected = c.selectedProvider?.ondcSearchResultId === p.ondcSearchResultId;
                return (
                  <div className="provider-item" key={p.ondcSearchResultId}>
                    <div className="provider-info">
                      <div className="provider-name">{p.providerName}</div>
                      <div className="provider-expire-time">{c.getProviderTimeLeft(p.expireTime)}</div>
                      <div className="detail-item"><i className="far fa-clock" /> Pick up at {fmtDate(p.pickupTime, 'dd-MM-yyyy HH:mm:ss')}</div>
                    </div>
                    <div className="provider-price">{p.deliveryPrice}</div>
                    <div className="provider-actions">
                      {p.isEnabled && !selected && (
                        <button className="select-provider-btn" onClick={() => c.selectProvider(p)}> Select Provider </button>
                      )}
                      {selected && <div className="selected-badge"><i className="fas fa-check-circle" /> Selected </div>}
                      {!p.isEnabled && !selected && <div className="not-available"> Not Available </div>}
                    </div>
                  </div>
                );
              })}
              {c.providers.length === 0 && (
                <div className="no-providers">
                  <i className="fas fa-exclamation-circle" />
                  <p>No providers available for this route at the moment.</p>
                </div>
              )}
            </div>
            <div className="providers-footer">
              <button className="btn-close-modal" onClick={() => c.closeProvidersModal()}>Close</button>
              <button className="btn-confirm" disabled={!c.selectedProvider} onClick={() => void c.confirmProvider()}>Confirm</button>
            </div>
          </div>
        </div>
      )}

      {c.showSuccessModal && (
        <div className="dr-success-overlay" onClick={() => { c.showSuccessModal = false; c.render(); }}>
          <div className="dr-success-card" onClick={(e) => e.stopPropagation()}>
            <div className="dr-success-icon"><i className="fas fa-check" /></div>
            <h2>Success!</h2>
            <p>{c.successMessage}</p>
          </div>
        </div>
      )}

      {c.showBatchDialog && (
        <div className="dr-success-overlay" onClick={() => c.dismissBatchDialog()}>
          <div className="dr-batch-card" onClick={(e) => e.stopPropagation()}>
            <button className="dr-batch-close" onClick={() => c.dismissBatchDialog()}><i className="fas fa-times" /></button>
            <div className="dr-batch-body">
              <div className="dr-success-icon"><i className="fas fa-check" /></div>
              <h2>All Planned Trips Completed</h2>
              <p>{c.sessionCompletedCount} trip(s) created successfully</p>
            </div>
            <div className="dr-batch-footer">
              <button className="btn btn-sm btn-primary" onClick={() => navigate('/trips')}>
                <i className="fas fa-external-link-alt me-1" /> View Trips{' '}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
