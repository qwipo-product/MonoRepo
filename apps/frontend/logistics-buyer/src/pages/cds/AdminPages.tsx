// Reports (both roles), Settings (Service Centre: Profile, Pick up, Return), Reports & Settings (CDS User: reports +
// own fleet and store), CDS Stores (Service Centre). Same layout as the app's Reports and Settings screens.
import { useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useSearchParams } from 'react-router';
import Swal from 'sweetalert2';
import { cdsApi, type Report, type ReportRunRow } from '../../api/services/cds.service';
import { SC_HUB } from '../../cds/engine';
import { COLLECTION_STATUS, GRN_STATUS, ORDER_STATUS, RETURN_STATUS, TRIP_STATUS_GROUPS } from '../../cds/status';
import { DEFAULT_ROUTE_CONFIG, type CdsRouteEngine, type RouteConfig } from '../../cds/types';
import PaymentSettingsPage from '../settings/PaymentSettingsPage';
import UsersPermissionsPage from '../settings/UsersPermissionsPage';
import { CuDeliverySettings, CuProfile } from './CuSettingsPages';
import '../settings/SettingsPage.css';
import '../settings/modules/settings-modules.css';
import '../settings/ProfilePage.css';
import '../settings/DeliverySettingsPage.css';
import { pointInPolygon, ringAreaKm2 } from '../../cds/planning';
import { CoverageMap, OUTSIDE_COLOR, PolygonEditorDialog, STORE_COLORS, type AreaRetailer, type AreaStore } from './RouteMap';
import { confirm, downloadCsv, Empty, ErrorBox, FilterBar, fmtDate, fmtDateTime, InfoSection, Loading, PageHead, refreshMeta, RowActions, SectionCard, Table, Tabs, useAction, useCdsSession, useLoad, useMeta } from './ui';
import '../reports/ReportsPage.css';

const STATUS_OPTIONS: Record<string, Record<string, { label: string }>> = {
  'trips-': TRIP_STATUS_GROUPS, grn: GRN_STATUS, 'delivery-status': ORDER_STATUS, returns: RETURN_STATUS, collections: COLLECTION_STATUS,
};

const FILTER_LABEL: Record<string, string> = { from: 'From Date', to: 'To Date', cdsStoreId: 'CDS Store', distributorId: 'Distributor', retailerId: 'Retailer', status: 'Status' };
const statusesOf = (reportId: string) => STATUS_OPTIONS[Object.keys(STATUS_OPTIONS).find((k) => reportId.startsWith(k)) ?? ''] ?? {};

/** Reports — one card per report (LBNP Reports card) with Run · Download · History. Run opens the report's filters;
 *  Run Report shows the rows and keeps the run in History; Download saves the last run (or runs it first). */
function Reports() {
  const meta = useMeta();
  const { sc } = useCdsSession();
  const list = meta.data?.reports ?? [];
  const retailers = useLoad(() => (!sc ? cdsApi.retailers() : Promise.resolve([])), [sc]);
  const [open, setOpen] = useState<{ id: string; panel: 'run' | 'history' } | null>(null);
  const [filters, setFilters] = useState<Record<string, Record<string, string>>>({});
  const [results, setResults] = useState<Record<string, Report>>({});
  const [history, setHistory] = useState<Record<string, ReportRunRow[]>>({});
  const { busy, run } = useAction();
  const nameOf = (key: string, value: string) => {
    if (key === 'cdsStoreId') return meta.data?.stores.find((x) => x.id === value)?.name ?? value;
    if (key === 'distributorId') return meta.data?.distributors.find((x) => x.id === value)?.name ?? value;
    if (key === 'retailerId') return (retailers.data ?? []).find((x) => x.id === value)?.name ?? value;
    if (key === 'from' || key === 'to') return fmtDate(value);
    return value;
  };
  const describe = (reportId: string, f: Record<string, string>) => {
    const st = statusesOf(reportId);
    const parts = Object.entries(f).filter(([, x]) => x).map(([k, x]) => `${FILTER_LABEL[k] ?? k}: ${k === 'status' ? st[x]?.label ?? x : nameOf(k, x)}`);
    return parts.length ? parts.join(' · ') : 'No filters (all data)';
  };
  const loadHistory = async (id: string) => {
    const h = await run(() => cdsApi.reportHistory(id));
    if (h) setHistory((x) => ({ ...x, [id]: h }));
  };
  const toggle = (id: string, panel: 'run' | 'history') => {
    const same = open?.id === id && open.panel === panel;
    setOpen(same ? null : { id, panel });
    if (!same && panel === 'history') void loadHistory(id);
  };
  const runReport = async (id: string, f = filters[id] ?? {}) => {
    if (f.from && f.to && f.to < f.from) { void Swal.fire({ icon: 'warning', title: 'Warning', text: 'End date cannot be before start date', showConfirmButton: false, timer: 1500 }); return null; }
    const r = await run(() => cdsApi.report(id, f, true));
    if (r) {
      setResults((x) => ({ ...x, [id]: r }));
      if (history[id]) void loadHistory(id);
    }
    return r;
  };
  const download = async (id: string, f?: Record<string, string>) => {
    const r = f ? await runReport(id, f) : results[id] ?? (await runReport(id));
    if (!r) return;
    if (!r.rows.length) { void Swal.fire({ icon: 'warning', title: 'Warning!', text: 'No records found for the selected filters.', showConfirmButton: false, timer: 1500 }); return; }
    downloadCsv(r.id, r.columns, r.rows);
    void Swal.fire({ icon: 'success', title: 'Success', text: `${r.title} downloaded successfully`, showConfirmButton: false, timer: 1500 });
  };
  const setF = (id: string, p: Record<string, string>) => setFilters((x) => ({ ...x, [id]: { ...x[id], ...p } }));
  const select = (id: string, key: string, all: string, options: { id: string; name: string }[]) => (
    <div className="col-md-6 mb-3" key={key}>
      <label className="form-label small text-muted" htmlFor={`rf-${id}-${key}`}>{FILTER_LABEL[key]}</label>
      <select id={`rf-${id}-${key}`} className="form-select" value={filters[id]?.[key] ?? ''} onChange={(e) => setF(id, { [key]: e.target.value })}>
        <option value="">{all}</option>{options.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
      </select>
    </div>
  );
  const today = meta.data?.today;
  return (
    <div className="row">
      {list.map((rep) => {
        const f = filters[rep.id] ?? {};
        const has = (k: string) => rep.filters.includes(k);
        const result = results[rep.id];
        const isOpen = (p: 'run' | 'history') => open?.id === rep.id && open.panel === p;
        return (
          <div className="col-lg-12 mb-4" key={rep.id}>
            <div className="card shadow-sm h-100 cds-report-card">
              <div className="card-body">
                <div className="d-flex align-items-start justify-content-between flex-wrap gap-2">
                  <div>
                    <h5 className="card-title fw-bold mb-1">{rep.title}</h5>
                    <p className="text-muted small mb-0">Filters: {rep.filters.map((k) => FILTER_LABEL[k] ?? k).filter((k) => !(sc && k === 'Retailer') && !(!sc && k === 'CDS Store')).join(', ') || 'None'}{result && <> · Last run: <b>{result.rows.length}</b> row(s)</>}</p>
                  </div>
                  <div className="d-flex gap-2">
                    <button className={`btn btn-sm ${isOpen('run') ? 'btn-primary' : 'btn-outline-primary'}`} aria-expanded={isOpen('run')} onClick={() => toggle(rep.id, 'run')}><i className="fas fa-play me-1" />Run</button>
                    <button className="btn btn-sm btn-outline-success" disabled={busy} onClick={() => void download(rep.id)}><i className="fas fa-download me-1" />Download</button>
                    <button className={`btn btn-sm ${isOpen('history') ? 'btn-secondary' : 'btn-outline-secondary'}`} aria-expanded={isOpen('history')} onClick={() => toggle(rep.id, 'history')}><i className="fas fa-clock-rotate-left me-1" />History</button>
                  </div>
                </div>

                {isOpen('run') && (
                  <div className="cds-report-panel">
                    <div className="row">
                      {has('from') && <div className="col-md-6 mb-3"><label className="form-label small text-muted" htmlFor={`rf-${rep.id}-from`}>From Date</label><input id={`rf-${rep.id}-from`} type="date" className="form-control" max={today} value={f.from ?? ''} onChange={(e) => setF(rep.id, { from: e.target.value })} /></div>}
                      {has('to') && <div className="col-md-6 mb-3"><label className="form-label small text-muted" htmlFor={`rf-${rep.id}-to`}>To Date</label><input id={`rf-${rep.id}-to`} type="date" className="form-control" max={today} value={f.to ?? ''} onChange={(e) => setF(rep.id, { to: e.target.value })} /></div>}
                      {has('cdsStoreId') && sc && select(rep.id, 'cdsStoreId', 'All CDS stores', meta.data?.stores ?? [])}
                      {has('distributorId') && select(rep.id, 'distributorId', 'All distributors', meta.data?.distributors ?? [])}
                      {has('retailerId') && !sc && select(rep.id, 'retailerId', 'All retailers', (retailers.data ?? []).filter((r) => r.orders))}
                      {has('status') && select(rep.id, 'status', 'All statuses', Object.entries(statusesOf(rep.id)).map(([k, x]) => ({ id: k, name: x.label })))}
                    </div>
                    <div className="d-flex justify-content-center mt-2">
                      <button className="btn btn-outline-secondary me-2" disabled={!Object.values(f).some(Boolean)} onClick={() => setFilters((x) => ({ ...x, [rep.id]: {} }))}>Clear Filters</button>
                      <button className="btn btn-primary" disabled={busy} onClick={() => void runReport(rep.id)}>{busy ? <span className="spinner-border spinner-border-sm me-2" /> : <i className="fas fa-play me-2" />}Run Report</button>
                    </div>
                    {result && (
                      <div className="mt-4 cds-report-result">
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <div className="small text-muted">{result.rows.length} row(s) · {describe(rep.id, f)}</div>
                          <button className="btn btn-sm btn-primary" disabled={!result.rows.length} onClick={() => downloadCsv(result.id, result.columns, result.rows)}><i className="fas fa-download me-1" />Download</button>
                        </div>
                        <Table head={result.columns.map((c) => c.label)} empty={!result.rows.length && <Empty text="No records found for the selected filters" />}>
                          {result.rows.map((r, i) => <tr key={i} className="mat-mdc-row">{result.columns.map((c) => <td key={c.key} className="small">{r[c.key]}</td>)}</tr>)}
                          {result.totals && <tr className="mat-mdc-row cds-retailer-row">{result.columns.map((c, i) => <td key={c.key}>{i === 0 ? 'Total' : result.totals?.[c.key] ?? ''}</td>)}</tr>}
                        </Table>
                      </div>
                    )}
                  </div>
                )}

                {isOpen('history') && (
                  <div className="cds-report-panel">
                    {!history[rep.id] ? <Loading text="Loading history…" /> : (
                      <Table head={['Run On', 'Run By', 'Filters', 'Rows', 'Actions']} empty={!history[rep.id].length && <Empty icon="fa-clock-rotate-left" text="No runs yet. Use Run to run this report." />}>
                        {history[rep.id].map((h) => (
                          <tr key={h.id} className="mat-mdc-row">
                            <td className="small">{fmtDateTime(h.at)}</td>
                            <td className="small">{h.by}</td>
                            <td className="small text-start">{describe(rep.id, h.filters)}</td>
                            <td className="small">{h.rows}</td>
                            <td>
                              <div className="d-flex gap-2 justify-content-center">
                                <button className="btn btn-sm btn-outline-success" disabled={busy} title="Download this run again" onClick={() => void download(rep.id, h.filters)}><i className="fas fa-download" /></button>
                                <button className="btn btn-sm btn-outline-primary" title="Open these filters in Run" onClick={() => { setFilters((x) => ({ ...x, [rep.id]: h.filters })); setOpen({ id: rep.id, panel: 'run' }); void runReport(rep.id, h.filters); }}><i className="fas fa-rotate-right" /></button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </Table>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function ReportsPage() {
  const { sc } = useCdsSession();
  return (
    <div className="cds-page reports-page container-fluid py-4 p-3 bg-light h-100">
      <div className="row px-3">
        <div className="col-md-8">
          <div className="d-flex align-items-center">
            <i className="fas fa-chart-bar text-primary me-2 fs-5" />
            <h1 className="fs-3 mb-0 fw-bold">Reports</h1>
          </div>
          <p className="text-muted small">{sc ? 'Run, download and see the history of reports across your CDS stores.' : 'Run, download and see the history of reports for your CDS store.'}</p>
        </div>
      </div>
      <div className="mt-2 px-1"><Reports /></div>
    </div>
  );
}

type SettingsTab = 'profile' | 'pickup' | 'return' | 'delivery' | 'payment' | 'users';
const SETTINGS_TABS: { key: SettingsTab; icon: string; label: string }[] = [
  { key: 'profile', icon: 'fas fa-user-circle', label: ' Profile ' },
  { key: 'pickup', icon: 'fas fa-truck-ramp-box', label: ' Pick up ' },
  { key: 'return', icon: 'fas fa-rotate-left', label: ' Return ' },
];
/** CDS User Settings: the LBNP Settings tabs that apply to a CDS store. */
const CU_SETTINGS_TABS: { key: SettingsTab; icon: string; label: string }[] = [
  { key: 'profile', icon: 'fas fa-user-circle', label: ' Profile ' },
  { key: 'delivery', icon: 'fas fa-truck', label: ' Delivery ' },
  { key: 'payment', icon: 'fas fa-credit-card', label: ' Payment ' },
  { key: 'users', icon: 'fas fa-users', label: ' Users & Permissions ' },
];

/** Settings — same layout as LBNP Settings: header and underline tabs. Profile (business details, location, vehicles
 *  and delivery persons), Pick up and Return (route planning limits, like LBNP Settings › Delivery). */
export function SettingsPage() {
  const { sc } = useCdsSession();
  const [params, setParams] = useSearchParams();
  const tabs = sc ? SETTINGS_TABS : CU_SETTINGS_TABS;
  const tab = (tabs.find((t) => t.key === params.get('tab'))?.key ?? 'profile') as SettingsTab;
  return (
    <div className="cds-page settings-container cds-settings-lbnp">
      <header className="settings-header">
        <div className="header-left">
          <div className="cds-title-row"><h1><i className="fas fa-cog" /> Settings</h1></div>
          <p className="subtitle">{sc ? 'Manage the Service Centre profile, and the pickup and return route planning.' : 'Customize your preferences, manage account details, and configure app options.'}</p>
        </div>
      </header>
      <div className="content-container">
        <div className="tabs-container">
          <div className="tabs" role="tablist">
            {tabs.map((t) => (
              <button key={t.key} role="tab" aria-selected={tab === t.key} className={`tab-btn${tab === t.key ? ' active' : ''}`} onClick={() => setParams({ tab: t.key })}>
                <i className={t.icon} />{t.label}
              </button>
            ))}
          </div>
        </div>
        <div className="settings-content">
          {tab === 'profile' && (sc ? <ServiceCentreProfile /> : <CuProfile />)}
          {tab === 'delivery' && <CuDeliverySettings />}
          {tab === 'payment' && <PaymentSettingsPage />}
          {tab === 'users' && <UsersPermissionsPage />}
          {tab === 'pickup' && <RoutePlanningSettings kind="pickup" />}
          {tab === 'return' && <RoutePlanningSettings kind="return" />}
        </div>
      </div>
    </div>
  );
}

/** Profile — LBNP Profile layout: Business Details and Service Centre Location. */
function ServiceCentreProfile() {
  const { user } = useCdsSession();
  const meta = useMeta();
  const field = (label: string, value?: ReactNode) => (
    <div className="profile-field" key={label}>
      <label>{label}</label>
      <div className="profile-value"><span className="profile-data">{value || 'Not provided'}</span></div>
    </div>
  );
  return (
    <div className="profile-page st-scope">
      <section className="profile-grid">
        <section className="settings-section profile-settings-section">
          <div className="section-header"><h2>Business Details</h2><p>The CDS Service Centre account</p></div>
          <div className="profile-content">
            {field('Name', user?.name)}
            {field('Email Address', user?.email)}
            {field('Business Name', 'CDS Service Centre')}
            {field('Phone Number', user?.mobile ? `+91 ${user.mobile}` : '')}
          </div>
        </section>
        <section className="settings-section">
          <div className="section-header"><h2>Service Centre Location</h2><p>Pickup trips start here; return trips start here</p></div>
          <div className="profile-content">
            {field('Location', SC_HUB.name)}
            {field('Address', SC_HUB.address)}
            {field('CDS Stores', meta.data ? `${meta.data.stores.length} stores · ${meta.data.stores.map((s) => s.name).join(', ')}` : '')}
            {field('Sellers (Distributors)', meta.data ? `${meta.data.distributors.length} sellers` : '')}
          </div>
        </section>
      </section>
    </div>
  );
}

type NumKey = 'serviceMinutes' | 'maxTravelHours' | 'maxDistributorStops' | 'maxCdsStops' | 'maxDistanceKm' | 'maxWeightKg';
const ROUTE_CARDS: { key: NumKey; icon: string; label: string; hint: (kind: 'pickup' | 'return') => string; unit: string; min: number; max: number; step?: number }[] = [
  { key: 'serviceMinutes', icon: 'fas fa-clock', label: 'Service Time per Stop', hint: (k) => (k === 'pickup' ? 'Time spent at each seller and CDS store' : 'Time spent at each CDS store and seller'), unit: 'minutes', min: 1, max: 60 },
  { key: 'maxTravelHours', icon: 'fas fa-road', label: 'Max Travel Time', hint: () => 'Maximum travel time per route', unit: 'hours', min: 0.5, max: 24, step: 0.5 },
  { key: 'maxDistributorStops', icon: 'fas fa-industry', label: 'Max Distributor Stops', hint: (k) => (k === 'pickup' ? 'Maximum seller pickups per route' : 'Maximum seller handovers per route'), unit: 'stops', min: 1, max: 50 },
  { key: 'maxCdsStops', icon: 'fas fa-warehouse', label: 'Max CDS Stops', hint: (k) => (k === 'pickup' ? 'Maximum CDS store drops per route' : 'Maximum CDS store pickups per route'), unit: 'stops', min: 1, max: 50 },
  { key: 'maxDistanceKm', icon: 'fas fa-route', label: 'Max Distance', hint: () => 'Maximum distance per route', unit: 'km', min: 1, max: 500 },
  { key: 'maxWeightKg', icon: 'fas fa-weight-hanging', label: 'Max Weight per Vehicle', hint: (k) => (k === 'pickup' ? 'Maximum load picked up from sellers per route' : 'Maximum return load per route'), unit: 'kg', min: 1, max: 10000 },
];
const CDS_ROUTE_ENGINES: { value: CdsRouteEngine; label: string; description: string; isDefault: boolean }[] = [
  { value: 'route_optimize', label: 'Route Optimizer', description: 'Plans the shortest route across sellers and CDS stores, and balances the vehicle load. Orders of one CDS store may go on more than one trip.', isDefault: true },
  { value: 'store_optimized', label: 'CDS Store Optimizer', description: 'Keeps all orders for the same CDS store in a single trip. A CDS store is never split across trips.', isDefault: false },
  { value: 'seller_optimized', label: 'Seller Optimizer', description: 'Keeps all orders from the same seller in a single trip. A seller is never split across trips.', isDefault: false },
];
const POD_TOGGLES: { key: 'sellerOtp' | 'cdsOtp'; icon: string; label: string; hint: (kind: 'pickup' | 'return') => string }[] = [
  { key: 'sellerOtp', icon: 'fas fa-store', label: 'Seller OTP', hint: (k) => (k === 'pickup' ? '(Pickup from seller)' : '(Return handover to seller)') },
  { key: 'cdsOtp', icon: 'fas fa-warehouse', label: 'CDS Store OTP', hint: (k) => (k === 'pickup' ? '(Drop at CDS store)' : '(Return pickup at CDS store)') },
];

/** Pick up / Return — same screen as LBNP Settings › Delivery: Route Planning Configuration (limits and Route Engine,
 *  Reset Defaults, Save) and Proof of Delivery (OTP). */
function RoutePlanningSettings({ kind }: { kind: 'pickup' | 'return' }) {
  const meta = useMeta();
  const { busy, run } = useAction();
  const key = kind === 'pickup' ? 'pickupRoute' : 'returnRoute';
  const saved: RouteConfig = { ...DEFAULT_ROUTE_CONFIG, ...meta.data?.settings[key] };
  const [edit, setEdit] = useState<Partial<Record<NumKey, string>>>({});
  const [engine, setEngine] = useState<CdsRouteEngine | null>(null);
  const [pod, setPod] = useState<Partial<Record<'sellerOtp' | 'cdsOtp', boolean>>>({});
  const value = (k: NumKey) => edit[k] ?? String(saved[k]);
  const engineNow = engine ?? saved.routeEngine;
  const podNow = (k: 'sellerOtp' | 'cdsOtp') => pod[k] ?? saved[k];
  const dirty = ROUTE_CARDS.some((c) => edit[c.key] !== undefined && Number(edit[c.key]) !== saved[c.key]) || engineNow !== saved.routeEngine;
  const podDirty = POD_TOGGLES.some((p) => podNow(p.key) !== saved[p.key]);
  const reload = () => { refreshMeta(); meta.reload(); };
  const label = kind === 'pickup' ? 'Pickup' : 'Return';
  const save = async () => {
    const cfg: RouteConfig = { ...saved, ...(Object.fromEntries(ROUTE_CARDS.map((c) => [c.key, Number(value(c.key))])) as Record<NumKey, number>), routeEngine: engineNow };
    if (await run(() => cdsApi.updateSettings({ [key]: cfg }), `${label} route planning saved`)) { setEdit({}); setEngine(null); reload(); }
  };
  const savePod = async () => {
    const cfg: RouteConfig = { ...saved, sellerOtp: podNow('sellerOtp'), cdsOtp: podNow('cdsOtp') };
    if (await run(() => cdsApi.updateSettings({ [key]: cfg }), `${label} proof of delivery saved`)) { setPod({}); reload(); }
  };
  const reset = () => { setEdit(Object.fromEntries(ROUTE_CARDS.map((c) => [c.key, String(DEFAULT_ROUTE_CONFIG[c.key])]))); setEngine(DEFAULT_ROUTE_CONFIG.routeEngine); };
  if (meta.loading && !meta.data) return <Loading />;
  const saveBtn = (disabled: boolean, onClick: () => void) => (
    <button className="save-config-btn" disabled={disabled || busy} onClick={onClick}><i className={busy ? 'fas fa-spinner fa-spin' : 'fas fa-save'} /> {busy ? 'Saving...' : 'Save'}</button>
  );
  return (
    <div className="delivery-settings-page">
      <section className="settings-section route-planning-section">
        <div className="section-header">
          <h2>Route Planning Configuration</h2>
          <div className="header-actions">
            <button className="reset-btn" title="Reset to defaults" onClick={reset}><i className="fas fa-undo" />{' Reset Defaults '}</button>
            {saveBtn(!dirty, () => void save())}
          </div>
        </div>
        <div className="config-grid">
          {ROUTE_CARDS.map((c) => (
            <div className="config-card" key={c.key}>
              <div className="config-icon"><i className={c.icon} /></div>
              <div className="config-details">
                <label className="config-label" htmlFor={`rc-${kind}-${c.key}`}>{c.label}</label>
                <span className="config-hint">{c.hint(kind)}</span>
              </div>
              <div className="config-input-wrap">
                <input id={`rc-${kind}-${c.key}`} type="number" className="config-input" min={c.min} max={c.max} step={c.step} value={value(c.key)}
                  onKeyDown={(e) => { if (e.key === '-' || e.key === 'e') e.preventDefault(); }}
                  onChange={(e) => setEdit((p) => ({ ...p, [c.key]: e.target.value }))} />
                <span className="config-unit">{c.unit}</span>
              </div>
            </div>
          ))}
          <div className="config-card route-engine-card">
            <div className="config-icon"><i className="fas fa-cogs" /></div>
            <div className="config-details">
              <label className="config-label">Route Engine</label>
              <span className="config-hint">Algorithm used for route planning</span>
              <div className="route-engine-options">
                {CDS_ROUTE_ENGINES.map((o) => (
                  <label key={o.value} className={`route-engine-option${engineNow === o.value ? ' selected' : ''}`}>
                    <input type="radio" name={`routeEngine-${kind}`} value={o.value} checked={engineNow === o.value} onChange={() => setEngine(o.value)} />
                    <div className="route-engine-option-body">
                      <div className="route-engine-option-title">
                        <span className="route-engine-option-name">{o.label}</span>
                        {o.isDefault && <span className="route-engine-default-badge">Default</span>}
                      </div>
                      <p className="route-engine-option-desc">{o.description}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="settings-section otp-config-section">
        <div className="section-header">
          <div className="section-title-group">
            <div className="config-icon"><i className="fas fa-check-circle" /></div>
            <h2>Proof of Delivery (OTP)</h2>
          </div>
          {saveBtn(!podDirty, () => void savePod())}
        </div>
        <div className="config-grid">
          {POD_TOGGLES.map((p) => {
            const isOn = podNow(p.key);
            return (
              <div className="config-card otp-toggle-card" key={p.key}>
                <div className="config-icon"><i className={p.icon} /></div>
                <div className="config-details">
                  <label className="config-label">{p.label}</label>
                  <span className="config-hint">{p.hint(kind)}</span>
                </div>
                <div className="otp-toggle-wrap">
                  <span className={`otp-status-label ${isOn ? 'enabled' : 'disabled'}`}>{isOn && <span className="status-dot" />}{isOn ? 'Enabled' : 'Disabled'}</span>
                  <label className="toggle-switch">
                    <input type="checkbox" aria-label={`${p.label} ${p.hint(kind)}`} checked={isOn} onChange={(e) => setPod((x) => ({ ...x, [p.key]: e.target.checked }))} />
                    <span className="toggle-slider" />
                  </label>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

export function StoresPage() {
  const { busy, run } = useAction();
  const { data, error, loading, reload } = useLoad(() => cdsApi.stores(), []);
  const coverage = useLoad(() => cdsApi.coverage(), []);
  const [editing, setEditing] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [q, setQ] = useState('');
  const [focus, setFocus] = useState<string | null>(null);
  const [listStore, setListStore] = useState<string>('');
  const [listQ, setListQ] = useState('');
  const mapRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const stores = data ?? [];
  const retailers = coverage.data ?? [];
  const countOf = (id: string | null) => retailers.filter((r) => r.storeId === id).length;
  const color = (id: string) => STORE_COLORS[Math.max(0, stores.findIndex((s) => s.id === id)) % STORE_COLORS.length];
  const matches = q.trim().length < 2 ? [] : retailers.filter((r) => `${r.name} ${r.phone} ${r.code} ${r.locality}`.toLowerCase().includes(q.trim().toLowerCase())).slice(0, 8);
  const edit = async (id: string, name: string, phone: string) => {
    const r = await Swal.fire({
      title: 'Store manager', html: `<input id="m-name" class="swal2-input" placeholder="Manager name" value="${name}"><input id="m-phone" class="swal2-input" placeholder="Phone" value="${phone}">`,
      showCancelButton: true, confirmButtonText: 'Save', confirmButtonColor: '#1e3a8a', reverseButtons: true,
      preConfirm: () => ({ managerName: (document.getElementById('m-name') as HTMLInputElement).value, managerPhone: (document.getElementById('m-phone') as HTMLInputElement).value }),
    });
    if (r.isConfirmed && (await run(() => cdsApi.updateStore(id, r.value), 'Store updated'))) { refreshMeta(); reload(); }
  };
  const toggle = async (id: string, name: string, active: boolean) => {
    if (!active && !(await confirm(`Deactivate ${name}?`, 'No new orders or plans can be sent to it.', 'Deactivate'))) return;
    if (await run(() => cdsApi.updateStore(id, { active }), active ? 'Store activated' : 'Store deactivated')) { refreshMeta(); reload(); coverage.reload(); }
  };
  const saveArea = async (id: string, polygon: [number, number][]) => {
    if (await run(() => cdsApi.updateStore(id, { polygon }), 'Service area saved')) { setEditing(null); refreshMeta(); reload(); coverage.reload(); }
  };
  const editingStore = stores.find((s) => s.id === editing);
  const tabStore = listStore || stores[0]?.id || '';
  // A retailer is listed under its CDS store once it has placed an order there.
  const ordered = (id: string) => retailers.filter((r) => r.storeId === id && r.orders > 0).length;
  const listed = retailers
    .filter((r) => r.storeId === tabStore && r.orders > 0)
    .filter((r) => !listQ.trim() || `${r.name} ${r.ownerName} ${r.phone} ${r.locality} ${r.code}`.toLowerCase().includes(listQ.trim().toLowerCase()))
    .sort((a, b) => b.orders - a.orders || a.name.localeCompare(b.name));
  const showRetailers = (id: string) => { setListStore(id); setListQ(''); setTimeout(() => listRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50); };
  const locate = (id: string) => { setFocus(id); mapRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }); };
  return (
    <div className="cds-page">
      <PageHead icon="fa-store" title="CDS Stores" subtitle="CDS stores and their service areas. A retailer inside a service area is served by that CDS store.">
        <button className="btn btn-sm btn-primary d-flex align-items-center text-nowrap" onClick={() => setCreating(true)}><i className="fas fa-plus me-1" />Create New CDS Store</button>
      </PageHead>
      {creating && (
        <CreateStoreDialog
          stores={stores}
          retailers={retailers}
          onClose={() => setCreating(false)}
          onCreated={(id) => { setCreating(false); refreshMeta(); reload(); coverage.reload(); setListStore(id); }}
        />
      )}
      {(error || coverage.error) && <ErrorBox text={error || coverage.error} onRetry={() => { reload(); coverage.reload(); }} />}
      {loading && !data ? <Loading /> : (
        <>
          <div ref={mapRef} />
          <SectionCard icon="fa-draw-polygon" tone="teal" title="Service Areas" subtitle="Retailers inside a CDS area go to that CDS store. Outside every area → 3PL." count={retailers.length - countOf(null)} countLabel={`of ${retailers.length} retailers covered`}>
            <div className="cds-coverage">
              <div className="cds-area-side">
                <ul className="cds-legend">
                  {stores.map((s) => (
                    <li key={s.id} role="button" title="Show the retailers of this CDS store" onClick={() => showRetailers(s.id)}><span className="swatch" style={{ background: color(s.id) }} />{s.name}{!s.active && <span className="text-muted small">(inactive)</span>}<span className="num">{countOf(s.id)}</span></li>
                  ))}
                  <li><span className="swatch" style={{ background: OUTSIDE_COLOR }} />Outside every area (3PL)<span className="num">{countOf(null)}</span></li>
                </ul>
                <div>
                  <label className="form-label fw-semibold small mb-1" htmlFor="chk-ret">Check a retailer</label>
                  <div className="cds-search w-100"><i className="fas fa-search" /><input id="chk-ret" className="form-control form-control-sm" placeholder="Name, phone or locality" value={q} onChange={(e) => { setQ(e.target.value); setFocus(null); }} /></div>
                </div>
                {q.trim().length >= 2 && (
                  !matches.length ? <div className="text-muted small">No retailer found</div> : (
                    <ul className="cds-check-results">
                      {matches.map((r) => {
                        const st = stores.find((s) => s.id === r.storeId);
                        return (
                          <li key={r.id} className={focus === r.id ? 'on' : ''} onClick={() => setFocus(r.id)}>
                            <div className="fw-semibold">{r.name}</div>
                            <div className="text-muted text-xs">{r.locality} · {r.phone}</div>
                            <div className="verdict" style={{ color: st ? color(st.id) : '#dc2626' }}>
                              <i className={`fas ${st ? 'fa-circle-check' : 'fa-circle-xmark'} me-1`} />{st ? `Inside ${st.name}` : 'Outside every CDS area → 3PL'}
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )
                )}
              </div>
              {coverage.loading && !coverage.data ? <Loading /> : <CoverageMap stores={stores} retailers={retailers} focusId={focus} />}
            </div>
          </SectionCard>
          <div className="cds-info-grid">
            {stores.map((st) => (
              <InfoSection key={st.id} icon="fa-warehouse" title={st.name} rows={[
                ['fa-circle-info', 'Status', <span key="s" className={`cds-badge ${st.active ? 'green' : 'grey'}`}>{st.active ? 'Active' : 'Inactive'}</span>],
                ['fa-hashtag', 'Store Code', st.code],
                ['fa-draw-polygon', 'Service Area', <span key="a"><span className="cds-legend-dot" style={{ background: color(st.id) }} />{ringAreaKm2(st.polygon)} km² · {countOf(st.id)} retailers</span>],
                ['fa-user-tie', 'Manager', `${st.managerName} · ${st.managerPhone}`],
                ['fa-city', 'City', [st.city, st.state].filter(Boolean).join(', ')],
                ['fa-location-dot', 'Areas', st.localities.join(', ')],
              ]}>
                <div className="d-flex justify-content-between align-items-center mt-2">
                  <div className="d-flex gap-2 flex-wrap">
                    <button className="btn btn-sm btn-outline-primary" disabled={!coverage.data} onClick={() => showRetailers(st.id)}><i className="fas fa-users me-1" />Retailers ({ordered(st.id)})</button>
                    <button className="btn btn-sm btn-outline-primary" disabled={busy || !coverage.data} onClick={() => setEditing(st.id)}><i className="fas fa-draw-polygon me-1" />Edit service area</button>
                  </div>
                  <RowActions items={[
                    { label: 'Edit service area', icon: 'fa-draw-polygon', onClick: () => setEditing(st.id), hidden: busy || !coverage.data },
                    { label: 'Edit manager', icon: 'fa-pen', onClick: () => void edit(st.id, st.managerName, st.managerPhone), hidden: busy },
                    st.active
                      ? { label: 'Deactivate store', icon: 'fa-ban', tone: 'danger', onClick: () => void toggle(st.id, st.name, false), hidden: busy }
                      : { label: 'Activate store', icon: 'fa-circle-check', tone: 'success', onClick: () => void toggle(st.id, st.name, true), hidden: busy },
                  ]} />
                </div>
              </InfoSection>
            ))}
          </div>
          <div ref={listRef} className="mt-3" />
          <SectionCard icon="fa-users" title="Retailers by CDS Store" subtitle="Retailers who placed orders served by each CDS store" count={listed.length} countLabel="retailers">
            <div className="px-3 pt-3">
              <Tabs value={tabStore} onChange={(v) => { setListStore(v); setListQ(''); }} tabs={stores.map((s) => ({ id: s.id, label: s.name, icon: 'fa-warehouse', count: ordered(s.id) }))} />
              <FilterBar search={listQ} onSearch={setListQ} placeholder="Search retailer, owner, phone, locality…">
                <span className="text-muted"><span className="cds-legend-dot" style={{ background: color(tabStore) }} />Retailers in the {stores.find((s) => s.id === tabStore)?.name} service area who placed at least one order</span>
              </FilterBar>
            </div>
            <Table head={['Retailer', 'Owner · Phone', 'Locality', 'Address', 'Orders', 'Open', 'Last Order', 'Actions']} empty={!listed.length && <Empty icon="fa-users" text={listQ ? 'No retailer matches the search' : 'No retailer has placed an order for this CDS store yet'} />}>
              {listed.map((r) => (
                <tr key={r.id} className="mat-mdc-row">
                  <td className="fw-semibold">{r.name}<div className="text-muted text-xs fw-normal">{r.code}</div></td>
                  <td className="small">{r.ownerName}<div className="text-muted text-xs">{r.phone}</div></td>
                  <td className="small">{r.locality}</td>
                  <td className="small">{r.address}</td>
                  <td>{r.orders}</td><td>{r.openOrders}</td>
                  <td className="small">{r.lastOrder ? fmtDate(r.lastOrder) : '—'}</td>
                  <td><RowActions onView={() => locate(r.id)} items={[{ label: 'Show on map', icon: 'fa-map-location-dot', onClick: () => locate(r.id) }]} /></td>
                </tr>
              ))}
            </Table>
          </SectionCard>
        </>
      )}
      {editingStore && (
        <PolygonEditorDialog store={editingStore} others={stores.filter((s) => s.id !== editingStore.id)} retailers={retailers} busy={busy}
          onSave={(ring) => void saveArea(editingStore.id, ring)} onClose={() => setEditing(null)} />
      )}
    </div>
  );
}


type StoreForm = Record<'code' | 'name' | 'address' | 'city' | 'state' | 'lat' | 'lng' | 'managerName' | 'managerPhone', string>;
const STORE_FIELDS: { key: keyof StoreForm; label: string; placeholder: string; type?: string; optional?: boolean }[] = [
  { key: 'name', label: 'Store Name', placeholder: 'e.g. CDS Gachibowli' },
  { key: 'code', label: 'Store Code', placeholder: 'e.g. CDS-GCB' },
  { key: 'address', label: 'Address', placeholder: 'Plot / street, area, pincode' },
  { key: 'city', label: 'City', placeholder: 'e.g. Hyderabad' },
  { key: 'state', label: 'State', placeholder: 'e.g. Telangana' },
  { key: 'managerName', label: 'Store Manager Name', placeholder: 'Full name' },
  { key: 'managerPhone', label: 'Store Manager Phone', placeholder: '10-digit mobile number', type: 'tel' },
  { key: 'lat', label: 'Latitude', placeholder: 'Auto from the area centre', type: 'number', optional: true },
  { key: 'lng', label: 'Longitude', placeholder: 'Auto from the area centre', type: 'number', optional: true },
];
type Ring = [number, number][];
const centreOf = (ring: Ring) => ring.length ? [ring.reduce((a, p) => a + p[0], 0) / ring.length, ring.reduce((a, p) => a + p[1], 0) / ring.length].map((x) => Math.round(x * 1e4) / 1e4) as [number, number] : null;

/** Create New CDS Store: store details, then draw the service area. Areas Served fill in automatically from the
 *  localities of the retailers inside the area; the store location defaults to the centre of the area. */
function CreateStoreDialog({ stores, retailers, onClose, onCreated }: { stores: AreaStore[]; retailers: AreaRetailer[]; onClose: () => void; onCreated: (id: string) => void }) {
  const { busy, run } = useAction();
  const [v, setV] = useState<StoreForm>({ code: '', name: '', address: '', city: 'Hyderabad', state: 'Telangana', lat: '', lng: '', managerName: '', managerPhone: '' });
  const [ring, setRing] = useState<Ring>([]);
  const [drawing, setDrawing] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof StoreForm | 'area', string>>>({});
  const inside = ring.length >= 3 ? retailers.filter((r) => pointInPolygon(r, ring)) : [];
  const areas = Array.from(new Set(inside.map((r) => r.locality).filter(Boolean))).sort();
  const centre = centreOf(ring);
  const lat = v.lat.trim() ? Number(v.lat) : centre?.[0] ?? NaN;
  const lng = v.lng.trim() ? Number(v.lng) : centre?.[1] ?? NaN;
  const check = () => {
    const e: Partial<Record<keyof StoreForm | 'area', string>> = {};
    STORE_FIELDS.forEach((f) => { if (!f.optional && !v[f.key].trim()) e[f.key] = `${f.label} is required`; });
    if (v.code.trim() && !/^[A-Za-z0-9-]{3,12}$/.test(v.code.trim())) e.code = 'Use 3 to 12 letters, numbers or "-"';
    if (v.managerPhone.trim() && !/^[6-9]\d{9}$/.test(v.managerPhone.trim())) e.managerPhone = 'Enter a valid 10-digit mobile number';
    if (v.lat.trim() && !(Math.abs(Number(v.lat) - 17.4) < 0.6)) e.lat = 'Latitude must be in the Hyderabad region (about 16.8 to 18.0)';
    if (v.lng.trim() && !(Math.abs(Number(v.lng) - 78.5) < 0.6)) e.lng = 'Longitude must be in the Hyderabad region (about 77.9 to 79.1)';
    if (ring.length < 3) e.area = 'Draw the service area on the map (at least 3 points)';
    return e;
  };
  const set = (k: keyof StoreForm, x: string) => {
    setV((p) => ({ ...p, [k]: x }));
    if (errors[k]) setErrors((p) => ({ ...p, [k]: undefined }));
  };
  const save = async () => {
    const e = check();
    setErrors(e);
    if (Object.keys(e).length) return;
    const r = await run(() => cdsApi.createStore({
      code: v.code.trim().toUpperCase(), name: v.name.trim(), address: v.address.trim(), city: v.city.trim(), state: v.state.trim(),
      lat, lng, polygon: ring, localities: areas, managerName: v.managerName.trim(), managerPhone: v.managerPhone.trim(),
    }), 'CDS store created with its service area');
    if (r) onCreated(r.id);
  };
  const rows: (typeof STORE_FIELDS)[] = [];
  STORE_FIELDS.forEach((f, i) => (i % 2 ? rows[rows.length - 1].push(f) : rows.push([f])));
  const editorStore: AreaStore = { id: 'new', name: v.name.trim() || 'New CDS Store', lat: Number.isFinite(lat) ? lat : 17.41, lng: Number.isFinite(lng) ? lng : 78.49, polygon: ring, active: true };
  return createPortal(
    <div className="modal-overlay fm-overlay" onClick={onClose}>
      <div className="modal-content filters-modal cds-filters-modal cds-store-form" role="dialog" aria-modal="true" aria-label="Create New CDS Store" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Create New CDS Store</h2>
          <button className="close-btn" onClick={onClose} aria-label="Close"><i className="fas fa-times" /></button>
        </div>
        <div className="modal-body">
          <p className="text-muted small mb-3">Fields with <span className="text-danger">*</span> are required. Draw the service area: retailers inside it are served by this store, and Areas Served fill in from them.</p>
          <div className="filter-grid">
            {rows.map((r, i) => (
              <div className="filter-row" key={i}>
                {r.map((f) => (
                  <div className="filter-col" key={f.key}>
                    <label htmlFor={`cs-${f.key}`}>{f.label} {!f.optional && <span className="text-danger">*</span>}</label>
                    <input id={`cs-${f.key}`} type={f.type ?? 'text'} step={f.type === 'number' ? '0.0001' : undefined} className={`fm-input${errors[f.key] ? ' is-invalid' : ''}`}
                      placeholder={f.optional && centre ? `${f.key === 'lat' ? centre[0] : centre[1]} (area centre)` : f.placeholder}
                      value={v[f.key]} onChange={(e) => set(f.key, e.target.value)} aria-invalid={!!errors[f.key]} />
                    {errors[f.key] && <div className="cds-field-error">{errors[f.key]}</div>}
                  </div>
                ))}
                {r.length === 1 && <div className="filter-col" />}
              </div>
            ))}
          </div>

          <div className={`cds-store-area${errors.area ? ' is-invalid' : ''}`}>
            <div className="area-head">
              <div>
                <div className="area-title"><i className="fas fa-draw-polygon me-1" />Service Area <span className="text-danger">*</span></div>
                <div className="text-muted small">{ring.length >= 3 ? `${ring.length} points · ${ringAreaKm2(ring)} km² · ${inside.length} retailer${inside.length === 1 ? '' : 's'} inside` : 'Not drawn yet'}</div>
              </div>
              <button type="button" className="btn btn-sm btn-outline-primary" onClick={() => setDrawing(true)}><i className={`fas ${ring.length >= 3 ? 'fa-pen' : 'fa-draw-polygon'} me-1`} />{ring.length >= 3 ? 'Edit Service Area' : 'Draw Service Area'}</button>
            </div>
            {errors.area && <div className="cds-field-error">{errors.area}</div>}
            <div className="area-served">
              <div className="small fw-semibold mb-1">Areas Served</div>
              {ring.length < 3 ? <div className="text-muted small">Filled in from the retailers inside the service area.</div>
                : areas.length ? <div className="d-flex flex-wrap gap-1">{areas.map((a) => <span key={a} className="area-chip">{a}</span>)}</div>
                  : <div className="text-muted small">No retailers inside this area yet.</div>}
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="cancel-btn" onClick={onClose}>Cancel</button>
          <button className="save-btn" disabled={busy} onClick={() => void save()}>{busy ? 'Creating…' : 'Create Store'}</button>
        </div>
      </div>
      {drawing && (
        // the editor sits on top of this form; its clicks must not reach the form's backdrop
        <div onClick={(e) => e.stopPropagation()}>
          <PolygonEditorDialog store={editorStore} others={stores} retailers={retailers} busy={false}
            onSave={(r) => { setRing(r); setDrawing(false); setErrors((p) => ({ ...p, area: undefined })); }} onClose={() => setDrawing(false)} />
        </div>
      )}
    </div>,
    document.body,
  );
}
