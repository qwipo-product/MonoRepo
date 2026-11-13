// Small building blocks shared by the Service Centre screens (styles in sc.css).
import type { ReactNode } from 'react';
import type { Tone } from './labels';
import './sc.css';

export function StatusPill({ label, tone }: { label: string; tone: Tone }) {
  return <span className={`sc-pill sc-pill--${tone}`}>{label}</span>;
}

export function PageHeader({ icon, title, subtitle, actions, children, refreshError }: { icon: string; title: string; subtitle: string; actions?: ReactNode; children?: ReactNode; refreshError?: string | null }) {
  return (
    <>
      <div className="d-flex align-items-start justify-content-between gap-3 mb-3 flex-wrap">
        <div>
          <div className="d-flex align-items-center">
            <i className={`fas ${icon} text-primary me-2 fs-5`} aria-hidden="true" />
            <h1 className="fs-3 mb-0 fw-bold">{title}</h1>
          </div>
          <p className="text-muted small mb-0">{subtitle}</p>
          {children}
        </div>
        {actions && <div className="d-flex align-items-center gap-2 flex-wrap">{actions}</div>}
      </div>
      <RefreshError error={refreshError} />
    </>
  );
}

/** A refresh failed while older data is still on screen. */
export function RefreshError({ error }: { error?: string | null }) {
  if (!error) return null;
  return (
    <div className="alert alert-warning py-2 small d-flex align-items-center gap-2" role="alert">
      <i className="fas fa-triangle-exclamation" aria-hidden="true" />
      Could not refresh: {error.replace(/\.$/, '')}. Showing the last loaded data.
    </div>
  );
}

export function StatCard({ label, value, sub, icon, tone, onClick, active }: { label: string; value: ReactNode; sub?: ReactNode; icon: string; tone: Tone; onClick?: () => void; active?: boolean }) {
  const body = (
    <>
      <div className="sc-stat-left">
        <div className="sc-stat-label">{label}</div>
        <div className="sc-stat-value">{value}</div>
        {sub && <div className="sc-stat-sub">{sub}</div>}
      </div>
      <div className={`sc-stat-icon sc-tone--${tone}`}>
        <i className={`fas ${icon}`} aria-hidden="true" />
      </div>
    </>
  );
  return onClick ? (
    <button type="button" className={`sc-stat sc-stat--clickable${active ? ' sc-stat--active' : ''}`} onClick={onClick} aria-pressed={active}>
      {body}
    </button>
  ) : (
    <div className="sc-stat">{body}</div>
  );
}

export function LoadError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="sc-card sc-empty" role="alert">
      <i className="fas fa-triangle-exclamation text-danger" aria-hidden="true" />
      <div className="fw-semibold">{message}</div>
      <button type="button" className="btn btn-sm btn-outline-primary mt-2" onClick={onRetry}>
        <i className="fas fa-rotate me-1" />
        Try again
      </button>
    </div>
  );
}

export function EmptyState({ icon, title, text }: { icon: string; title: string; text?: string }) {
  return (
    <div className="sc-empty">
      <i className={`fas ${icon}`} aria-hidden="true" />
      <div className="fw-semibold">{title}</div>
      {text && <div className="text-muted small">{text}</div>}
    </div>
  );
}

/** Thin bar: used / capacity. Turns red when over. */
export function LoadBar({ used, capacity }: { used: number; capacity: number }) {
  const pct = capacity > 0 ? Math.min(100, (used / capacity) * 100) : 0;
  const over = used > capacity;
  return (
    <div className="sc-loadbar" role="meter" aria-valuemin={0} aria-valuemax={capacity} aria-valuenow={Math.round(used)} aria-label="Vehicle load">
      <div className={`sc-loadbar-fill${over ? ' sc-loadbar-fill--over' : pct > 85 ? ' sc-loadbar-fill--high' : ''}`} style={{ width: `${pct}%` }} />
    </div>
  );
}
