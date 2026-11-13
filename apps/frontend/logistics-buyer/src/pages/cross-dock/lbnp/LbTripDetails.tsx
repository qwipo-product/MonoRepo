// LBNP Trip details (pages/trips/TripDetailsPage.tsx) as a reusable shell: header with back button, tabs, the Summary
// tab's information cards and delivery progress with per-stop OTP, and the original's mat tables.
import { useState, type ReactNode } from 'react';
import '../../trips/TripDetailsPage.css';
import './lbnp.css';

export interface LbDetailsTab {
  key: string;
  label: string;
  render: () => ReactNode;
}

interface Props {
  title: string;
  subtitle: string;
  onBack: () => void;
  /** Header actions (right side). */
  actions?: ReactNode;
  /** Shown under the header (alerts, OTP panel). */
  banner?: ReactNode;
  tabs: LbDetailsTab[];
  initialTab?: string;
}

export default function LbTripDetails({ title, subtitle, onBack, actions, banner, tabs, initialTab }: Props) {
  const [active, setActive] = useState(initialTab ?? tabs[0]?.key);
  const tab = tabs.find((t) => t.key === active) ?? tabs[0];
  return (
    <div className="trip-details-container">
      <div className="trip-details-header">
        <div className="header-left">
          <button className="back-btn" onClick={onBack} aria-label="Back"><i className="fas fa-arrow-left" /></button>
          <h1>{title}</h1>
          <div className="provider">{subtitle}</div>
        </div>
        <div className="header-right lb-header-actions">{actions}</div>
      </div>
      {banner}
      <div className="content-container">
        <div className="tabs-container">
          <div className="tabs" role="tablist">
            {tabs.map((t) => (
              <div
                key={t.key}
                role="tab"
                tabIndex={0}
                aria-selected={t.key === tab?.key}
                className={`tab${t.key === tab?.key ? ' active' : ''}`}
                onClick={() => setActive(t.key)}
                onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setActive(t.key)}
              >
                {t.label}
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="trip-details-content">{tab?.render()}</div>
    </div>
  );
}

/** The Summary tab's three-card row. */
export function LbSummaryRow({ children }: { children: ReactNode }) {
  return <div className="details-container">{children}</div>;
}

/** An information card: title + icon/label/value rows (Route Overview, Trip Summary). */
export function LbInfoCard({ cls, title, rows, children }: { cls: string; title: string; rows: [string, string, ReactNode][]; children?: ReactNode }) {
  return (
    <div className={`information-card ${cls}`}>
      <h3>{title}</h3>
      {children}
      {rows.map(([icon, label, value]) => (
        <div className="info-row" key={label}>
          <div className="info-item full-width">
            <i className="material-icons">{icon}</i>
            <div className="label">{label}</div>
            <div className="value">{value}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

export interface LbProgressStop {
  name: string;
  address: string;
  time: string;
  status: string;
  statusClass: string;
  otp: string;
  /** Action under the stop (e.g. Mark picked up, Enter OTP). */
  action?: ReactNode;
}

/** Delivery Progress card: first stop is the origin, then numbered stops with status and OTP. */
export function LbProgressCard({ title, stops }: { title: string; stops: LbProgressStop[] }) {
  const [all, setAll] = useState(false);
  const visible = all ? stops : stops.slice(0, 4);
  return (
    <div className="information-card delivery-progress">
      <h3>{title}</h3>
      <div className="info-card delivery-progress-container">
        <div className="delivery-route">
          <div className="delivery-stops">
            {visible.map((loc, i) => (
              <div key={`${loc.name}-${i}`} className={`delivery-stop${i === 0 ? ' first-stop' : ''}${i === visible.length - 1 && !all ? ' last-visible-stop' : ''}`}>
                {i > 0 && <div className="connector" />}
                {i === 0 ? <div className="stop-icon"><i className="material-icons">store</i></div> : <div className="stop-number">{i}</div>}
                <div className="stop-details">
                  <div className="stop-info">
                    <div className="stop-name">{loc.name}</div>
                    <div className="stop-address">{loc.address}</div>
                    <div className="stop-time">{loc.time}</div>
                  </div>
                  <div className="stop-status">
                    <span className={loc.statusClass}>{loc.status}</span>
                  </div>
                  <div className="stop-otp">
                    <span className="otp-label">OTP : </span>
                    <span className="otp-badge">{loc.otp || 'N/A'}</span>
                  </div>
                  {loc.action && <div className="lb-stop-action">{loc.action}</div>}
                </div>
              </div>
            ))}
            {stops.length > 4 && (
              <div className="show-more-container">
                <button className="show-more-btn" onClick={() => setAll(!all)}>
                  <i className="material-icons">{all ? 'expand_less' : 'expand_more'}</i>
                  {all ? ' Show Less ' : ' Show More Stops '}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export interface LbColumn {
  icon: string;
  label: string;
  align?: 'start' | 'center' | 'end';
}

/** The original's mat table: icon headers, small rows, optional footer and empty message. */
export function LbTable({ columns, rows, footer, empty }: { columns: LbColumn[]; rows: ReactNode[][]; footer?: ReactNode[]; empty: string }) {
  return (
    <div className="mat-card mat-elevation-z3">
      <div className="mat-card-content p-0">
        <div className="table-responsive">
          <table className="mat-mdc-table w-100">
            <thead>
              <tr className="mat-mdc-header-row small bg-light">
                {columns.map((c) => (
                  <th key={c.label} className={`text-uppercase py-2 px-3 small text-${c.align ?? 'center'}`}>
                    <i className={`fas ${c.icon} me-1 text-primary`} />
                    {c.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr className="mat-mdc-row small" key={i}>
                  {r.map((cell, j) => (
                    <td key={j} className={`text-${columns[j]?.align ?? 'center'}`}>{cell}</td>
                  ))}
                </tr>
              ))}
              {rows.length === 0 && (
                <tr className="mat-mdc-row">
                  <td colSpan={columns.length} className="text-center py-4"><i className="fas fa-inbox me-2 text-muted" /> {empty} </td>
                </tr>
              )}
            </tbody>
            {footer && rows.length > 0 && (
              <tfoot>
                <tr className="mat-mdc-footer-row small bg-light">
                  {footer.map((f, i) => (
                    <td key={i} className={`fw-bold text-${columns[i]?.align ?? 'center'}`}>{f}</td>
                  ))}
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
}
