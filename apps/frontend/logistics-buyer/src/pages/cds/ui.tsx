// Shared pieces for the CDS screens: badges, headers, tables, loading/empty states, dialogs, KPI strip,
// vehicle + delivery person assignment, CSV export.
import { useCallback, useEffect, useState, useSyncExternalStore, type ReactNode } from 'react';
import { useNavigate } from 'react-router';
import Swal from 'sweetalert2';
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

export function Tabs<T extends string>({ value, onChange, tabs }: { value: T; onChange: (v: T) => void; tabs: { id: T; label: string; icon?: string; count?: number }[] }) {
  return (
    <div className="cds-tabs" role="tablist">
      {tabs.map((t) => (
        <button key={t.id} role="tab" aria-selected={value === t.id} className={`cds-tab${value === t.id ? ' active' : ''}`} onClick={() => onChange(t.id)}>
          {t.icon && <i className={`fas ${t.icon}`} />}{t.label}{t.count !== undefined && <span className="count">{t.count}</span>}
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

export function Table({ head, children, empty }: { head: ReactNode[]; children: ReactNode; empty?: ReactNode }) {
  return (
    <div className="table-responsive">
      <table className="mat-mdc-table w-100">
        <thead><tr className="mat-mdc-header-row">{head.map((h, i) => <th key={i} className="text-uppercase">{h}</th>)}</tr></thead>
        <tbody>{children}</tbody>
      </table>
      {empty}
    </div>
  );
}

export function Pager({ total, pageNumber, pageSize, onPage }: { total: number; pageNumber: number; pageSize: number; onPage: (p: number) => void }) {
  if (total <= pageSize) return null;
  const pages = Math.ceil(total / pageSize);
  return (
    <div className="d-flex justify-content-end align-items-center gap-2 p-2 small text-muted">
      {(pageNumber - 1) * pageSize + 1} – {Math.min(total, pageNumber * pageSize)} of {total}
      <button className="btn btn-sm btn-light" disabled={pageNumber <= 1} onClick={() => onPage(pageNumber - 1)} aria-label="Previous page"><i className="fas fa-chevron-left" /></button>
      <button className="btn btn-sm btn-light" disabled={pageNumber >= pages} onClick={() => onPage(pageNumber + 1)} aria-label="Next page"><i className="fas fa-chevron-right" /></button>
    </div>
  );
}

/** Role KPI strip (live figures). */
export function KpiStrip() {
  const navigate = useNavigate();
  const { data } = useLoad(() => cdsApi.summary(), []);
  if (!data) return null;
  return (
    <div className="cds-kpis">
      {data.map((k: Kpi) => (
        <div key={k.key} className={`cds-kpi ${k.tone} link`} role="link" onClick={() => navigate(k.to)}>
          <div className="label">{k.label}</div>
          <div className="value">{k.key === 'cash' ? money(k.value) : k.value}</div>
        </div>
      ))}
    </div>
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
