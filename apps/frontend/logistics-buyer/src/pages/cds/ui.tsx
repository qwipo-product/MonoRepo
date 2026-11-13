// Shared pieces for the CDS screens: badges, headers, tables, loading/empty states, dialogs, KPI strip,
// vehicle + delivery person assignment, CSV export.
import { useCallback, useEffect, useState, useSyncExternalStore, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router';
import Swal from 'sweetalert2';
import Paginator from '../../components/Paginator';
import '../../components/FiltersModal.css';
import { cdsApi, cdsAuth, cdsErrorText, type Kpi, type Meta, type Resources } from '../../api/services/cds.service';
import type { Meta as StatusMeta } from '../../cds/status';

export function useCdsSession() {
  useSyncExternalStore((fn) => { const off = cdsAuth.subscribe(fn); return () => { off(); }; }, () => `${cdsAuth.token}`);
  return { user: cdsAuth.user, sc: cdsAuth.isSC(), store: cdsAuth.user?.cdsStoreIds[0] ?? '' };
}

/** Loads data and reloads when deps change; `reload` re-runs it. */
export function useLoad<T>(fn: () => Promise<T>, deps: unknown[]) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [n, setN] = useState(0);
  useEffect(() => {
    let live = true;
    setLoading(true);
    fn().then((d) => { if (live) { setData(d); setError(''); } }, (e) => { if (live) setError(cdsErrorText(e)); }).finally(() => live && setLoading(false));
    return () => { live = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, n]);
  const reload = useCallback(() => setN((x) => x + 1), []);
  return { data, error, loading, reload };
}

let metaCache: Promise<Meta> | null = null;
let metaToken: string | null = null;
function cachedMeta(): Promise<Meta> {
  if (!metaCache || metaToken !== cdsAuth.token) {
    metaToken = cdsAuth.token;
    metaCache = cdsApi.meta();
  }
  return metaCache;
}
/** Reference data (stores, distributors, settings, reports) — cached per session. */
export function useMeta() {
  const p = cachedMeta();
  return useLoad(() => p, [p]);
}
export const refreshMeta = () => { metaCache = null; };

export const Badge = ({ meta }: { meta: StatusMeta }) => <span className={`cds-badge ${meta.tone}`}>{meta.label}</span>;

export function PageHead({ icon, title, subtitle, crumb, children }: { icon: string; title: ReactNode; subtitle?: ReactNode; crumb?: { label: string; to: string }; children?: ReactNode }) {
  const navigate = useNavigate();
  return (
    <div className="cds-head">
      <div>
        {crumb && <div className="crumb"><a onClick={() => navigate(crumb.to)}><i className="fas fa-arrow-left me-1" />{crumb.label}</a></div>}
        <h1><i className={`fas ${icon}`} />{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {children && <div className="d-flex gap-2 flex-wrap align-items-center">{children}</div>}
    </div>
  );
}

export function Tabs<T extends string>({ value, onChange, tabs }: { value: T; onChange: (v: T) => void; tabs: { id: T; label: string; sub?: string; icon?: string; count?: number }[] }) {
  return (
    <div className="cds-tabs" role="tablist">
      {tabs.map((t) => (
        <button key={t.id} role="tab" aria-selected={value === t.id} className={`cds-tab${value === t.id ? ' active' : ''}`} onClick={() => onChange(t.id)}>
          {t.icon && <i className={`fas ${t.icon}`} />}
          {t.sub ? <span className="tab-text"><span>{t.label}</span><small>{t.sub}</small></span> : t.label}
          {t.count !== undefined && <span className="count">{t.count}</span>}
        </button>
      ))}
    </div>
  );
}

export const Loading = ({ text = 'Loading…' }: { text?: string }) => <div className="cds-empty"><span className="spinner-border spinner-border-sm text-primary me-2" />{text}</div>;
export const Empty = ({ icon = 'fa-inbox', text, children }: { icon?: string; text: string; children?: ReactNode }) => (
  <div className="cds-empty"><i className={`fas ${icon}`} />{text}{children && <div className="mt-2">{children}</div>}</div>
);
export const ErrorBox = ({ text, onRetry }: { text: string; onRetry?: () => void }) => (
  <div className="cds-note warn m-3"><i className="fas fa-triangle-exclamation mt-1" /><div>{text}{onRetry && <button className="btn btn-link btn-sm p-0 ms-2" onClick={onRetry}>Retry</button>}</div></div>
);

export function Card({ title, extra, children, className = '' }: { title?: ReactNode; extra?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <div className={`mat-card mat-elevation-z3 mb-3 ${className}`}>
      {title && <div className="cds-section-title"><span>{title}</span>{extra}</div>}
      {children}
    </div>
  );
}

// ---------------------------------------------------------------- tables (same look as the Orders / Trips tables)

/** Header icon by column name — the existing tables show a small icon before every header. */
const HEAD_ICONS: [RegExp, string][] = [
  [/^actions?$/, 'fa-gear'],
  [/qty/, 'fa-cubes'],
  [/status/, 'fa-circle-info'],
  [/otp/, 'fa-key'],
  [/trip/, 'fa-route'],
  [/retailer|owner/, 'fa-store'],
  [/distributor|seller/, 'fa-industry'],
  [/cds store|destination|^cds$/, 'fa-warehouse'],
  [/delivery person|driver|^name$|by$/, 'fa-user'],
  [/vehicle|^type$/, 'fa-truck'],
  [/phone|mobile/, 'fa-phone'],
  [/stop|address|locality|area|serves/, 'fa-location-dot'],
  [/item|product|sku/, 'fa-boxes-stacked'],
  [/weight|load|capacity/, 'fa-weight-hanging'],
  [/value|amount|due|cash|collected$|₹/, 'fa-indian-rupee-sign'],
  [/mode|payment/, 'fa-wallet'],
  [/reason|condition|note/, 'fa-comment'],
  [/reference/, 'fa-receipt'],
  [/date|planned$|^planned|confirmed|created|completed|handed|raised|last order|received by|time|when/, 'fa-calendar'],
  [/order|return|grn|collection|registration|^id$/, 'fa-hashtag'],
  [/units|qty|quantity|ordered|picked|received|accepted|rejected|damaged|delivered|returned|dispatched|requested|short|open|failed/, 'fa-cubes'],
  [/active/, 'fa-toggle-on'],
];
const headIcon = (h: ReactNode) => {
  if (typeof h !== 'string' || !h.trim()) return null;
  const k = h.toLowerCase();
  return HEAD_ICONS.find(([re]) => re.test(k))?.[1] ?? null;
};

export function Table({ head, children, empty }: { head: ReactNode[]; children: ReactNode; empty?: ReactNode }) {
  return (
    <div className="table-responsive">
      <table className={`mat-mdc-table w-100 cds-table${head[head.length - 1] === 'Actions' ? ' has-actions' : ''}`}>
        <thead>
          <tr className="mat-mdc-header-row">
            {head.map((h, i) => {
              const icon = headIcon(h);
              return <th key={i} className="text-uppercase fw-bold small bg-white py-2 px-2 text-center">{icon && <i className={`fas ${icon} me-1`} />}{h}</th>;
            })}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
      {empty}
    </div>
  );
}

export const PAGE_SIZES = [10, 15, 25, 50];

/** The app's paginator: "Items per page: [15 ▾]   1 – 15 of 40   ‹ ›". */
export function Pager({ total, pageNumber, pageSize, onPage, onPageSize }: { total: number; pageNumber: number; pageSize: number; onPage: (p: number) => void; onPageSize?: (n: number) => void }) {
  if (!total) return null;
  return (
    <Paginator
      length={total}
      pageIndex={pageNumber - 1}
      pageSize={pageSize}
      pageSizeOptions={onPageSize ? PAGE_SIZES : [pageSize]}
      onPage={({ pageIndex, pageSize: size }) => {
        if (size !== pageSize && onPageSize) onPageSize(size);
        else onPage(pageIndex + 1);
      }}
    />
  );
}

/** Row actions — a view (eye) button and a ⋮ menu, like the Orders / Trips tables. Clicks do not open the row. */
export interface RowAction { label: string; icon: string; onClick: () => void; tone?: 'danger' | 'primary' | 'success'; hidden?: boolean }
export function RowActions({ onView, items = [] }: { onView?: () => void; items?: RowAction[] }) {
  const [pos, setPos] = useState<{ top: number; right: number } | null>(null);
  const shown = items.filter((i) => !i.hidden);
  useEffect(() => {
    if (!pos) return;
    const close = () => setPos(null);
    document.addEventListener('click', close);
    window.addEventListener('scroll', close, true);
    window.addEventListener('resize', close);
    return () => {
      document.removeEventListener('click', close);
      window.removeEventListener('scroll', close, true);
      window.removeEventListener('resize', close);
    };
  }, [pos]);
  return (
    <div className="cds-actions" onClick={(e) => e.stopPropagation()}>
      {onView && <button className="btn btn-sm text-primary" title="View" aria-label="View" onClick={onView}><i className="fas fa-eye" /></button>}
      {shown.length > 0 && (
        <button
          className="cds-kebab"
          title="Actions"
          aria-label="More actions"
          aria-expanded={!!pos}
          onClick={(e) => {
            const r = e.currentTarget.getBoundingClientRect();
            setPos((p) => (p ? null : { top: Math.max(8, Math.min(r.bottom + 4, window.innerHeight - 48 * shown.length - 24)), right: window.innerWidth - r.right }));
          }}
        >
          <i className="fas fa-ellipsis-vertical" />
        </button>
      )}
      {pos && createPortal(
        <div className="cds-kebab-menu" role="menu" style={{ top: pos.top, right: pos.right }} onClick={(e) => e.stopPropagation()}>
          {shown.map((i) => (
            <button key={i.label} role="menuitem" className={`cds-kebab-item ${i.tone ?? ''}`} onClick={() => { setPos(null); i.onClick(); }}>
              <i className={`fas ${i.icon}`} />{i.label}
            </button>
          ))}
        </div>,
        document.body,
      )}
    </div>
  );
}

// ---------------------------------------------------------------- filters (search box + Filters dialog, like Orders)

export type FilterField =
  | { key: string; label: string; type: 'select'; options: { value: string; label: string }[]; allLabel?: string }
  | { key: string; label: string; type: 'date' };
export type FilterValues = Record<string, string>;

/** Search box and a "Filters" button that opens the filters dialog (Clear All / Apply Filters).
 *  `defaults` are the values Clear All goes back to; the button counts the filters that differ from them. */
export function FilterBar({ search, onSearch, placeholder = 'Search…', fields = [], values = {}, defaults = {}, onApply, title = 'Filters', children }: {
  search?: string; onSearch?: (v: string) => void; placeholder?: string;
  fields?: FilterField[]; values?: FilterValues; defaults?: FilterValues; onApply?: (v: FilterValues) => void; title?: string; children?: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const active = fields.filter((f) => (values[f.key] ?? '') !== (defaults[f.key] ?? '')).length;
  return (
    <div className="cds-toolbar">
      <div className="cds-toolbar-left">{children}</div>
      {onSearch && (
        <div className="cds-search">
          <i className="fas fa-search" />
          <input className="form-control form-control-sm" placeholder={placeholder} aria-label="Search" value={search ?? ''} onChange={(e) => onSearch(e.target.value)} />
        </div>
      )}
      {fields.length > 0 && onApply && (
        <button className={`btn btn-sm ${active ? 'btn-primary' : 'btn-outline-primary'} d-flex align-items-center text-nowrap`} onClick={() => setOpen(true)}>
          <i className="fas fa-filter me-1" />Filters{active > 0 && <span className="cds-filter-count">{active}</span>}
        </button>
      )}
      {open && onApply && <FiltersDialog title={title} fields={fields} values={values} defaults={defaults} onClose={() => setOpen(false)} onApply={(v) => { onApply(v); setOpen(false); }} />}
    </div>
  );
}

function FiltersDialog({ title, fields, values, defaults, onClose, onApply }: { title: string; fields: FilterField[]; values: FilterValues; defaults: FilterValues; onClose: () => void; onApply: (v: FilterValues) => void }) {
  const [v, setV] = useState<FilterValues>(() => Object.fromEntries(fields.map((f) => [f.key, values[f.key] ?? defaults[f.key] ?? ''])));
  const set = (k: string, x: string) => setV((p) => ({ ...p, [k]: x }));
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);
  const apply = () => {
    if (v.fromDate && v.toDate && v.toDate < v.fromDate) {
      void Swal.fire({ icon: 'warning', text: 'End date cannot be less than start date', confirmButtonText: 'OK' });
      return;
    }
    onApply(v);
  };
  const rows: FilterField[][] = [];
  fields.forEach((f, i) => (i % 2 ? rows[rows.length - 1].push(f) : rows.push([f])));
  return createPortal(
    <div className="modal-overlay fm-overlay" onClick={onClose}>
      <div className="modal-content filters-modal cds-filters-modal" role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{title}</h2>
          <button className="close-btn" onClick={onClose} aria-label="Close"><i className="fas fa-times" /></button>
        </div>
        <div className="modal-body">
          <div className="filter-grid">
            {rows.map((r, i) => (
              <div className="filter-row" key={i}>
                {r.map((f) => (
                  <div className="filter-col" key={f.key}>
                    <label htmlFor={`cf-${f.key}`}>{f.label}</label>
                    {f.type === 'date' ? (
                      <input id={`cf-${f.key}`} type="date" className="fm-input" value={v[f.key]} onChange={(e) => set(f.key, e.target.value)} />
                    ) : (
                      <select id={`cf-${f.key}`} className="fm-input" value={v[f.key]} onChange={(e) => set(f.key, e.target.value)}>
                        {f.allLabel !== undefined && <option value="">{f.allLabel}</option>}
                        {f.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                    )}
                  </div>
                ))}
                {r.length === 1 && <div className="filter-col" />}
              </div>
            ))}
          </div>
        </div>
        <div className="modal-footer">
          <button className="cancel-btn" onClick={() => onApply({ ...Object.fromEntries(fields.map((f) => [f.key, ''])), ...defaults })}>Clear All</button>
          <button className="save-btn" onClick={apply}>Apply Filters</button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

// ---------------------------------------------------------------- detail pages (same as Order Details / Trip Details)

/** Header card: back button, icon + title, one sub line, actions on the right. */
export function DetailHead({ icon, title, subtitle, back, children }: { icon: string; title: ReactNode; subtitle?: ReactNode; back: string; children?: ReactNode }) {
  const navigate = useNavigate();
  const goBack = () => (((window.history.state as { idx?: number } | null)?.idx ?? 0) > 0 ? navigate(-1) : navigate(back));
  return (
    <div className="cds-detail-head">
      <div className="head-left">
        <button className="back-btn" onClick={goBack} aria-label="Back"><i className="fas fa-arrow-left" /></button>
        <div>
          <h1><i className={`fas ${icon}`} />{title}</h1>
          {subtitle && <p className="subtitle">{subtitle}</p>}
        </div>
      </div>
      {children && <div className="head-actions">{children}</div>}
    </div>
  );
}

/** White box with underlined tabs on top (Order Summary / Product Details style). */
export function DetailTabs<T extends string>({ value, onChange, tabs, children }: { value: T; onChange: (v: T) => void; tabs: { id: T; label: string; icon: string; count?: number; hidden?: boolean }[]; children: ReactNode }) {
  return (
    <div className="cds-detail-box">
      <div className="cds-detail-tabs" role="tablist">
        {tabs.filter((t) => !t.hidden).map((t) => (
          <button key={t.id} role="tab" aria-selected={value === t.id} className={`tab${value === t.id ? ' active' : ''}`} onClick={() => onChange(t.id)}>
            <i className={`fas ${t.icon}`} />{t.label}{t.count !== undefined && <span className="count">{t.count}</span>}
          </button>
        ))}
      </div>
      <div className="cds-detail-content">{children}</div>
    </div>
  );
}

/** Info card with icon · label · value rows (Customer Information style). Empty values are left out. */
export function InfoSection({ icon, title, rows, children }: { icon: string; title: string; rows: [string, string, ReactNode][]; children?: ReactNode }) {
  const shown = rows.filter(([, , v]) => v !== undefined && v !== null && v !== '' && v !== false);
  return (
    <div className="cds-info">
      <h3><i className={`fas ${icon}`} />{title}</h3>
      <table className="info-table">
        <tbody>
          {shown.map(([i, l, v]) => <tr key={l}><td><i className={`fas ${i}`} />{l}</td><td>{v}</td></tr>)}
        </tbody>
      </table>
      {children}
    </div>
  );
}
export const InfoGrid = ({ children }: { children: ReactNode }) => <div className="cds-info-grid">{children}</div>;

/** Section card with a coloured icon tile, title, one sub line and a count pill (Delivery Planning style). */
export function SectionCard({ icon, tone = 'blue', title, subtitle, count, countLabel, extra, children, className = '' }: {
  icon: string; tone?: 'blue' | 'purple' | 'green' | 'amber' | 'teal'; title: string; subtitle?: string; count?: number; countLabel?: string; extra?: ReactNode; children: ReactNode; className?: string;
}) {
  return (
    <div className={`mat-card mat-elevation-z3 mb-3 cds-section ${tone} ${className}`}>
      <div className="cds-section-head">
        <div className="section-left">
          <div className="section-icon"><i className={`fas ${icon}`} /></div>
          <div><h2>{title}</h2>{subtitle && <p>{subtitle}</p>}</div>
        </div>
        <div className="section-right">
          {extra}
          {count !== undefined && <><span className="count-pill">{count}</span>{countLabel && <span className="count-label">{countLabel}</span>}</>}
        </div>
      </div>
      {children}
    </div>
  );
}

// ---------------------------------------------------------------- summary cards (same as the Orders / Trips cards)

const KPI_LOOK: Record<string, { icon: string; title?: string; sub: string }> = {
  confirmed: { icon: 'fa-clipboard-list', title: 'Orders to Plan', sub: 'Waiting for a pickup plan' },
  picked: { icon: 'fa-box-open', title: 'Picked Up', sub: 'Waiting for a CDS delivery trip' },
  transit: { icon: 'fa-truck-fast', title: 'In Transit to CDS', sub: 'On the way to the CDS' },
  pickupTrips: { icon: 'fa-truck-ramp-box', title: 'Distributor Pickup Trips', sub: 'Active · CDS to Distributor' },
  cdsTrips: { icon: 'fa-warehouse', title: 'CDS Delivery Trips', sub: 'Active · Distributor to CDS' },
  returnTrips: { icon: 'fa-rotate-left', title: 'CDS Return Trips', sub: 'Active · CDS to Seller' },
  returns: { icon: 'fa-arrow-rotate-left', sub: 'Waiting for action' },
  grn: { icon: 'fa-clipboard-check', title: 'GRNs to Verify', sub: 'Handed over at your CDS' },
  ready: { icon: 'fa-box', title: 'Ready for Delivery', sub: 'Waiting for a delivery plan' },
  planned: { icon: 'fa-calendar-check', title: 'Delivery Planned', sub: 'On a delivery trip' },
  out: { icon: 'fa-truck', title: 'Out for Delivery', sub: 'On the road' },
  delivered: { icon: 'fa-circle-check', title: 'Delivered', sub: 'Delivered to retailers' },
  cash: { icon: 'fa-indian-rupee-sign', title: 'Cash with Delivery Persons', sub: 'To receive at your CDS' },
};

export interface StatCard { key: string; title: string; value: ReactNode; sub?: string; icon: string; tone: string; onClick?: () => void }
export function StatCards({ cards }: { cards: StatCard[] }) {
  return (
    <div className="cds-stats">
      {cards.map((c) => (
        <div key={c.key} className={`cds-stat${c.onClick ? ' clickable' : ''}`} role={c.onClick ? 'link' : undefined} onClick={c.onClick}>
          <div>
            <div className="stat-label">{c.title}</div>
            <div className="stat-value">{c.value}</div>
            {c.sub && <div className="stat-subtitle">{c.sub}</div>}
          </div>
          <div className={`stat-icon ${c.tone}`}><i className={`fas ${c.icon}`} /></div>
        </div>
      ))}
    </div>
  );
}

const SMALL_WORDS = /^(to|of|at|on|for|and|the|a|in|with)$/;
const titleCase = (s: string) => s.replace(/\b[a-z]\w*/g, (w) => (SMALL_WORDS.test(w) ? w : w[0].toUpperCase() + w.slice(1)));

/** Role summary cards (live figures); each opens its screen. */
export function KpiStrip() {
  const navigate = useNavigate();
  const { data } = useLoad(() => cdsApi.summary(), []);
  if (!data) return null;
  // Service Centre: the three active-trip figures make one card, and "in transit" is shown on Deliver to CDS.
  const trips = data.filter((k) => ['pickupTrips', 'cdsTrips', 'returnTrips'].includes(k.key));
  const list: Kpi[] = trips.length
    ? [...data.filter((k) => !['pickupTrips', 'cdsTrips', 'returnTrips', 'picked'].includes(k.key))]
    : data;
  if (trips.length) list.splice(2, 0, { key: 'activeTrips', label: 'Active Trips', value: trips.reduce((a, k) => a + k.value, 0), tone: 'blue', to: '/cds/trips' });
  const tripSub = trips.map((k) => `${k.value} ${k.key === 'pickupTrips' ? 'pickup' : k.key === 'cdsTrips' ? 'CDS delivery' : 'return'}`).join(' · ');
  return (
    <StatCards
      cards={list.map((k: Kpi) => {
        if (k.key === 'activeTrips') return { key: k.key, title: 'Active Trips', value: k.value, sub: tripSub, icon: 'fa-route', tone: 'blue', onClick: () => navigate(k.to) };
        const look = KPI_LOOK[k.key];
        return { key: k.key, title: look?.title ?? titleCase(k.label), value: k.key === 'cash' ? money(k.value) : k.value, sub: look?.sub, icon: look?.icon ?? 'fa-chart-simple', tone: k.tone, onClick: () => navigate(k.to) };
      })}
    />
  );
}

// ---------------------------------------------------------------- formatting

export const fmtDate = (iso?: string | null) => (iso ? new Date(iso.length === 10 ? `${iso}T00:00:00` : iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—');
export const fmtDateTime = (iso?: string | null) => (iso ? new Date(iso).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—');
export const money = (n: number) => `₹${(n ?? 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
export const kg = (n: number) => `${Math.round(n * 10) / 10} kg`;
export const sumOf = <T,>(xs: T[], f: (x: T) => number) => xs.reduce((a, x) => a + f(x), 0);

// ---------------------------------------------------------------- dialogs

export async function confirm(title: string, text: string, confirmText = 'Confirm') {
  const r = await Swal.fire({ icon: 'question', title, text, showCancelButton: true, confirmButtonText: confirmText, confirmButtonColor: '#1e3a8a', reverseButtons: true });
  return r.isConfirmed;
}
export async function askText(title: string, label: string, confirmText = 'Submit', danger = false) {
  const r = await Swal.fire({
    title, input: 'text', inputLabel: label, inputPlaceholder: 'Required', showCancelButton: true, confirmButtonText: confirmText,
    confirmButtonColor: danger ? '#dc3545' : '#1e3a8a', reverseButtons: true, inputValidator: (v) => (!v?.trim() ? 'This is required' : undefined),
  });
  return r.isConfirmed ? String(r.value).trim() : null;
}
export const toast = (text: string) => Swal.fire({ icon: 'success', title: text, toast: true, position: 'top-end', timer: 2400, showConfirmButton: false });
export const alertError = (e: unknown) => Swal.fire({ icon: 'error', title: 'Could not complete', text: cdsErrorText(e), confirmButtonColor: '#1e3a8a' });

/** Runs an action with a busy flag and error alert; returns the result or null. */
export function useAction() {
  const [busy, setBusy] = useState(false);
  const run = useCallback(async <T,>(fn: () => Promise<T>, success?: string): Promise<T | null> => {
    setBusy(true);
    try {
      const r = await fn();
      if (success) void toast(success);
      return r;
    } catch (e) {
      void alertError(e);
      return null;
    } finally {
      setBusy(false);
    }
  }, []);
  return { busy, run };
}

// ---------------------------------------------------------------- vehicle + delivery person assignment

export const SLOTS = ['08:00 – 12:00', '09:00 – 13:00', '12:00 – 17:00', '14:00 – 18:00', '17:00 – 20:00'];
export interface Assign { vehicleId: string; deliveryPersonId: string }

/** Vehicle + delivery person pickers for a date (the user's own fleet), with capacity check. */
export function AssignFields({ date, loadKg, value, onChange, label, allowBusy }: { date: string; loadKg: number; value: Assign; onChange: (a: Assign) => void; label?: string; allowBusy?: Assign }) {
  const { data } = useLoad<Resources>(() => cdsApi.resources(date), [date]);
  const vs = data?.vehicles ?? [];
  const ps = data?.deliveryPersons ?? [];
  useEffect(() => {
    if (!data) return;
    const okV = vs.find((x) => x.id === value.vehicleId && (x.available || x.id === allowBusy?.vehicleId) && x.capacityKg >= loadKg);
    const okP = ps.find((x) => x.id === value.deliveryPersonId && (x.available || x.id === allowBusy?.deliveryPersonId));
    if (okV && okP) return;
    const v = okV ?? vs.filter((x) => x.available && x.capacityKg >= loadKg).sort((a, b) => a.capacityKg - b.capacityKg)[0];
    const p = okP ?? ps.find((x) => x.available);
    onChange({ vehicleId: v?.id ?? '', deliveryPersonId: p?.id ?? '' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, loadKg]);
  const v = vs.find((x) => x.id === value.vehicleId);
  const pct = v ? Math.round((loadKg / v.capacityKg) * 100) : 0;
  return (
    <div className="d-flex flex-column gap-2">
      {label && <div className="fw-semibold">{label}</div>}
      <div>
        <label className="form-label mb-1 small fw-medium">Vehicle</label>
        <select aria-label={`${label ?? ''} vehicle`} className="form-select form-select-sm" value={value.vehicleId} onChange={(e) => onChange({ ...value, vehicleId: e.target.value })}>
          <option value="">Select vehicle</option>
          {vs.map((x) => {
            const busyOk = x.id === allowBusy?.vehicleId;
            return <option key={x.id} value={x.id} disabled={!x.active || (!x.available && !busyOk) || x.capacityKg < loadKg}>{x.regNo} · {x.type} · {x.capacityKg} kg{!x.active ? ' — inactive' : !x.available && !busyOk ? ` — on ${x.busyTripNo}` : x.capacityKg < loadKg ? ' — too small' : ''}</option>;
          })}
        </select>
        {v && <div className="mt-1"><div className={`cds-load${pct > 100 ? ' over' : ''}`}><div style={{ width: `${Math.min(100, pct)}%` }} /></div><div className="text-muted text-xs">{kg(loadKg)} of {v.capacityKg} kg ({pct}%)</div></div>}
      </div>
      <div>
        <label className="form-label mb-1 small fw-medium">Delivery person</label>
        <select aria-label={`${label ?? ''} delivery person`} className="form-select form-select-sm" value={value.deliveryPersonId} onChange={(e) => onChange({ ...value, deliveryPersonId: e.target.value })}>
          <option value="">Select delivery person</option>
          {ps.map((x) => {
            const busyOk = x.id === allowBusy?.deliveryPersonId;
            return <option key={x.id} value={x.id} disabled={!x.active || (!x.available && !busyOk)}>{x.name} · {x.phone}{!x.active ? ' — inactive' : !x.available && !busyOk ? ` — on ${x.busyTripNo}` : ''}</option>;
          })}
        </select>
      </div>
    </div>
  );
}

export function DateSlot({ date, slot, min, onDate, onSlot, hint }: { date: string; slot: string; min: string; onDate: (d: string) => void; onSlot: (s: string) => void; hint?: string }) {
  return (
    <div className="row g-2">
      <div className="col-7">
        <label className="form-label mb-1 small fw-medium">Planned date</label>
        <input type="date" aria-label="Planned date" className="form-control form-control-sm" min={min} value={date} onChange={(e) => onDate(e.target.value)} />
        {hint && <div className="text-muted text-xs mt-1">{hint}</div>}
      </div>
      <div className="col-5">
        <label className="form-label mb-1 small fw-medium">Slot</label>
        <select aria-label="Slot" className="form-select form-select-sm" value={slot} onChange={(e) => onSlot(e.target.value)}>{SLOTS.map((s) => <option key={s}>{s}</option>)}</select>
      </div>
    </div>
  );
}

/** Downloads table rows as CSV. */
export function downloadCsv(name: string, columns: { key: string; label: string }[], rows: Record<string, unknown>[]) {
  const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const csv = [columns.map((c) => esc(c.label)).join(','), ...rows.map((r) => columns.map((c) => esc(r[c.key])).join(','))].join('\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = `${name}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
