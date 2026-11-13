// LBNP Delivery Planning screens as reusable shells for the cross-dock users:
//   LbPlanningList   ← pages/delivery-routes/DeliveryRoutesPage.tsx (route plans per section, Generate Trip)
//   LbCreateRoute    ← pages/delivery-routes/CreateDeliveryRoutePage.tsx (config bar, available orders, Plan Routes)
//   LbRouteDetails   ← pages/delivery-routes/DeliveryRouteDetailsPage.tsx (summary cards, customer / product tabs)
// Styles come from the original pages' stylesheets.
import { useState, type ReactNode } from 'react';
import DataLoading from '../../../components/DataLoading';
import '../../delivery-routes/DeliveryRoutesPage.css';
import '../../delivery-routes/CreateDeliveryRoutePage.css';
import '../../delivery-routes/RouteDetailsPages.css';
import './lbnp.css';

export function HeaderCell({ icon, label, align = 'left' }: { icon: string; label: string; align?: 'left' | 'center' | 'right' }) {
  return (
    <th className={`mat-mdc-header-cell text-uppercase py-2 small ${align === 'center' ? 'px-2 text-center' : 'px-3'} ${align === 'right' ? 'text-end' : ''}`}>
      <i className={`fas ${icon} me-1 text-primary`} /> {label}
    </th>
  );
}

export interface LbPlanSection {
  kind: 'rfq' | 'self-fleet';
  icon: string;
  title: string;
  sub: string;
  headers: { icon: string; label: string; align?: 'left' | 'center' | 'right' }[];
  rows: { key: string; cells: ReactNode[]; muted?: boolean }[];
  empty: string;
}

export function LbPlanningList({ icon, title, subtitle, createLabel, onCreate, loading, sections, notice }: { icon: string; title: string; subtitle: string; createLabel: string; onCreate: () => void; loading: boolean; sections: LbPlanSection[]; notice?: ReactNode }) {
  return (
    <div className="delivery-routes-page container-fluid p-3 bg-light h-100">
      <div className="row px-3">
        <div className="col-md-6">
          <div className="d-flex align-items-center">
            <i className={`fas ${icon} text-primary me-2 fs-5`} />
            <h1 className="fs-3 mb-0 fw-bold">{title}</h1>
          </div>
          <p className="text-muted small">{subtitle}</p>
        </div>
        <div className="col-md-6 d-flex justify-content-md-end justify-content-start align-items-end gap-2 pt-3">
          <button className="btn btn-sm btn-primary d-flex align-items-center text-nowrap" onClick={onCreate}>
            <i className="fas fa-upload me-1 fs-6" />
            <span className="fs-6">{createLabel}</span>
          </button>
        </div>
      </div>
      <div className="p-3">
        {notice}
        {loading && sections.every((s) => !s.rows.length) && <DataLoading message="Loading routes..." showTip />}
        {sections.map((s) => (
          <div key={s.title} className={`mat-card mat-elevation-z3 mb-4 ${s.kind === 'rfq' ? 'rfq-card' : 'self-fleet-card'}`}>
            <div className={`section-header ${s.kind === 'rfq' ? 'rfq-header' : 'self-fleet-header'}`}>
              <div className="section-left">
                <div className="section-icon"><i className={`fas ${s.icon}`} /></div>
                <div>
                  <h2>{s.title}</h2>
                  <p>{s.sub}</p>
                </div>
              </div>
              <div className="section-right">
                <span className="count-pill">{s.rows.length}</span>
                <span className="count-label">routes</span>
              </div>
            </div>
            <div className="mat-card-content p-0">
              <div className="table-responsive">
                <table className="mat-mdc-table w-100">
                  <thead>
                    <tr className="mat-mdc-header-row">
                      {s.headers.map((h) => (
                        <HeaderCell key={h.label} {...h} />
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {s.rows.map((r) => (
                      <tr key={r.key} className={`mat-mdc-row${r.muted ? ' phantom-completed' : ''}`}>
                        {r.cells.map((c, i) => {
                          const align = s.headers[i]?.align ?? 'left';
                          return (
                            <td key={i} className={`mat-mdc-cell py-2 small ${align === 'center' ? 'px-2 text-center' : 'px-3'} ${align === 'right' ? 'text-end' : ''}`}>{c}</td>
                          );
                        })}
                      </tr>
                    ))}
                    {s.rows.length === 0 && (
                      <tr>
                        <td className="text-center py-4" colSpan={s.headers.length}>
                          <i className="fas fa-inbox mb-3 text-muted" style={{ fontSize: '2rem' }} />
                          <p className="mb-0">{s.empty}</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export interface LbCreateColumn {
  icon: string;
  label: string;
  center?: boolean;
}

export function LbCreateRoute({
  title,
  onBack,
  config,
  sectionTitle,
  columns,
  rows,
  selected,
  onToggle,
  onToggleAll,
  summary,
  onCancel,
  onConfirm,
  confirming,
  confirmLabel,
  error,
  empty,
  extra,
}: {
  title: string;
  onBack: () => void;
  config: ReactNode;
  sectionTitle: string;
  columns: LbCreateColumn[];
  rows: { key: string; cells: ReactNode[] }[];
  selected: Set<string>;
  onToggle: (key: string) => void;
  onToggleAll: (on: boolean) => void;
  summary: { icon: string; label: string; value: ReactNode }[];
  onCancel: () => void;
  onConfirm: () => void;
  confirming: boolean;
  confirmLabel: string;
  error?: string | null;
  empty: string;
  extra?: ReactNode;
}) {
  const all = rows.length > 0 && rows.every((r) => selected.has(r.key));
  return (
    <div className="create-delivery-route-page create-route-container">
      <header className="orders-header">
        <button className="back-btn" onClick={onBack} aria-label="Back"><i className="fas fa-arrow-left" /></button>
        <h1><i className="fas fa-route" /> {title}</h1>
      </header>

      <div className="route-card">
        <div className="card-content w-100 p-3">
          <div className="route-config-bar">{config}</div>
          {extra}
          <div className="section">
            <div className="orders-title-row">
              <h2 className="mb-0">{sectionTitle}</h2>
              <label className="select-all-checkbox">
                <input type="checkbox" checked={all} onChange={(e) => onToggleAll(e.target.checked)} /> Select All
              </label>
            </div>
            <div className="orders-table-container">
              <table className="orders-table">
                <thead>
                  <tr>
                    <th className="mat-mdc-header-cell select-col" />
                    {columns.map((c) => (
                      <th key={c.label} className={`mat-mdc-header-cell${c.center ? ' text-center' : ''}`}>
                        <i className={`fas ${c.icon} me-1`} /> {c.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.key} className="order-row">
                      <td className="select-col">
                        <input type="checkbox" checked={selected.has(r.key)} onChange={() => onToggle(r.key)} aria-label="Select" />
                      </td>
                      {r.cells.map((c, i) => (
                        <td key={i} className={columns[i]?.center ? 'text-center' : undefined}>{c}</td>
                      ))}
                    </tr>
                  ))}
                  {rows.length === 0 && (
                    <tr><td className="text-center py-4" colSpan={columns.length + 1}> {empty} </td></tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="summary-row">
              {summary.map((s) => (
                <div key={s.label}><span className="text-primary"><i className={`fas ${s.icon}`} /> {s.label}:</span> <span className="fw-bold">{s.value}</span></div>
              ))}
            </div>
          </div>
          {error && <div className="alert alert-danger py-2 small mt-3 mb-0" role="alert">{error}</div>}
          <div className="action-buttons">
            <button className="cancel-btn" onClick={onCancel}>Cancel</button>
            <button className="confirm-btn" disabled={confirming || selected.size === 0} onClick={onConfirm}>
              {confirming ? <><i className="fas fa-spinner fa-spin" /> Planning…</> : confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function LbRouteDetails({
  title,
  subtitle,
  onBack,
  loading,
  cards,
  tabs,
  actions,
  info,
}: {
  title: string;
  subtitle: string;
  onBack: () => void;
  loading: boolean;
  cards: { bg: string; icon: string; label: string; value: ReactNode; footIcon: string; foot: string }[];
  tabs: { key: string; icon: string; label: string; render: () => ReactNode }[];
  actions?: ReactNode;
  info?: ReactNode;
}) {
  const [active, setActive] = useState(tabs[0]?.key);
  const tab = tabs.find((t) => t.key === active) ?? tabs[0];
  return (
    <div className="route-details-pages create-route-container">
      {loading && (
        <div className="details-loading-overlay">
          <div className="details-loading-box">
            <div className="spinner-border text-primary" style={{ width: '3rem', height: '3rem' }} role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-2">Loading route details...</p>
          </div>
        </div>
      )}
      <header className="orders-header">
        <button className="back-btn" onClick={onBack} aria-label="Back"><i className="fas fa-arrow-left" /></button>
        <div className="flex-grow-1">
          <h1><i className="fas fa-route" /> {title}</h1>
          <p className="text-muted small mb-0">{subtitle}</p>
        </div>
        {actions && <div className="d-flex gap-2 flex-wrap">{actions}</div>}
      </header>
      {info}
      <div className="row mb-4 g-3">
        {cards.map((c) => (
          <div className="col-md-3" key={c.label}>
            <div className="card h-100 border-0 shadow-sm rounded-3 summary-card">
              <div className="card-body d-flex align-items-center p-3">
                <div className={`icon-container rounded-circle ${c.bg} me-3`}><i className={`fas ${c.icon}`} /></div>
                <div>
                  <h6 className="text-muted small mb-1">{c.label}</h6>
                  <h3 className="fw-bold mb-0">{c.value}</h3>
                </div>
              </div>
              <div className="card-footer bg-light border-0 py-2 px-3"><span className="small"><i className={`fas ${c.footIcon}`} />{c.foot}</span></div>
            </div>
          </div>
        ))}
      </div>
      <div className="d-flex border-bottom mb-4">
        {tabs.map((t) => (
          <button key={t.key} className={`btn btn-link px-4 py-2 text-decoration-none${t.key === tab?.key ? ' border-bottom border-primary fw-bold' : ''}`} onClick={() => setActive(t.key)}>
            <i className={`fas ${t.icon}`} /> {t.label}{' '}
          </button>
        ))}
      </div>
      {tab?.render()}
    </div>
  );
}

/** Route Details' mat table. */
export function LbRouteTable({ columns, rows, footer, empty }: { columns: { icon: string; label: string; start?: boolean }[]; rows: ReactNode[][]; footer?: ReactNode[]; empty: string }) {
  return (
    <div className="mat-card mat-elevation-z3">
      <table className="mat-mdc-table w-100">
        <thead>
          <tr className="mat-mdc-header-row small bg-light">
            {columns.map((c) => (
              <th key={c.label} className={`py-2 px-3${c.start ? ' text-start' : ''}`}><i className={`fas ${c.icon}`} /> {c.label} </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="mat-mdc-row">
              {r.map((c, j) => (
                <td key={j} className={`py-2 px-3 small${columns[j]?.start ? ' text-start' : ''}`}>{c}</td>
              ))}
            </tr>
          ))}
          {rows.length === 0 && (
            <tr><td colSpan={columns.length} className="text-center py-4"><i className="fas fa-info-circle me-2 text-muted" /> {empty} </td></tr>
          )}
        </tbody>
        {footer && rows.length > 0 && (
          <tfoot>
            <tr className="small bg-light footer-row">
              {footer.map((f, i) => (
                <td key={i} className="py-2 px-3 fw-bold">{f}</td>
              ))}
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  );
}
