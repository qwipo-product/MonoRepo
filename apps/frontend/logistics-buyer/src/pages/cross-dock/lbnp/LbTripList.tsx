// LBNP Trips list (pages/trips/TripsPage.tsx) as a reusable shell for the cross-dock users: same header, stat cards,
// table with expandable rows (Route Overview with OTPs, summary, route with per-stop OTP) and the row action menu.
// Styles come from the original page's stylesheet, so both look identical.
import { Fragment, useEffect, useState, type ReactNode } from 'react';
import DataLoading from '../../../components/DataLoading';
import '../../trips/TripsPage.css';

export interface LbStop {
  name: string;
  address: string;
  time: string;
  otp: string;
  status?: string;
  /** status-pill class from the original: anything is green except "returned". */
  statusClass?: string;
}

export interface LbMenuItem {
  icon: string;
  color: string;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}

export interface LbTripListRow {
  id: string;
  /** Cells after the checkbox / expand columns, in `columns` order. */
  cells: ReactNode[];
  route: [string, string, string][];
  summaryTitle: string;
  summary: { cls: 'total' | 'delivered' | 'partial' | 'returned' | 'pending'; icon: string; label: string; value: number }[];
  collectionTitle: string;
  collection: { label: string; value: string; icon?: string }[];
  routeTitle: string;
  stops: LbStop[];
  menu: LbMenuItem[];
}

export interface LbStat {
  title: string;
  value: ReactNode;
  sub: string;
  line: string;
  icon: string;
  cls: 'trips' | 'delivery' | 'customers' | 'orders';
}

interface Props {
  icon: string;
  title: string;
  description: string;
  actions?: ReactNode;
  stats: LbStat[];
  columns: string[];
  rows: LbTripListRow[];
  loading: boolean;
  emptyText: string;
  /** Shown between the stat cards and the table (filters, notices). */
  children?: ReactNode;
}

export default function LbTripList({ icon, title, description, actions, stats, columns, rows, loading, emptyText, children }: Props) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showAll, setShowAll] = useState<Set<string>>(new Set());
  const [menu, setMenu] = useState<{ id: string; top: number; right: number } | null>(null);

  useEffect(() => {
    if (!menu) return;
    const close = () => setMenu(null);
    document.addEventListener('click', close);
    window.addEventListener('scroll', close, true);
    return () => {
      document.removeEventListener('click', close);
      window.removeEventListener('scroll', close, true);
    };
  }, [menu]);

  const menuRow = menu ? rows.find((r) => r.id === menu.id) : undefined;
  const colSpan = columns.length + 3;

  const details = (row: LbTripListRow) => {
    const all = showAll.has(row.id);
    const visible = all ? row.stops : row.stops.slice(0, 3);
    const total = row.summary.find((s) => s.cls === 'total')?.value ?? 0;
    const seg = (n: number) => `max(2px, ${total ? (n / total) * 100 : 0}%)`;
    return (
      <tr className="trip-details-row">
        <td colSpan={colSpan}>
          <div className="trip-details">
            <div className="details-container">
              <div className="detail-card route-overview">
                <h3>Route Overview</h3>
                <div className="info-card">
                  {row.route.map(([ic, label, value]) => (
                    <div className="info-row" key={label}>
                      <i className="material-icons">{ic}</i>
                      <span className="label">{label}</span>
                      <span className="value" title={value}>{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="detail-card trip-summary">
                <h3>{row.summaryTitle}</h3>
                <div className="order-summary-grid">
                  {row.summary.map((s) => (
                    <div className={`os-item ${s.cls}`} key={s.label}>
                      <div className="os-icon"><i className="material-icons">{s.icon}</i></div>
                      <div className="os-count">{s.value}</div>
                      <div className="os-label">{s.label}</div>
                    </div>
                  ))}
                </div>
                {total > 0 && (
                  <div className="os-progress">
                    {row.summary.filter((s) => s.cls !== 'total').map((s) => (
                      <div key={s.label} className={`seg ${s.cls}`} style={{ width: seg(s.value) }} title={`${s.label}: ${s.value}`} />
                    ))}
                  </div>
                )}
                <h3 className="collection-title">{row.collectionTitle}</h3>
                <div className="info-card collection-card">
                  {row.collection.map((c) => (
                    <div className={`info-row${c.icon ? '' : ' no-icon'}`} key={c.label}>
                      {c.icon && <i className="material-icons">{c.icon}</i>}
                      <span className="label">{c.label}</span>
                      <span className="value">{c.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="detail-card delivery-route">
                <h3>{row.routeTitle}</h3>
                <div className="delivery-stops">
                  {visible.map((loc, i) => (
                    <div className={`delivery-stop${i === 0 ? ' first-stop' : ''}${!all && i === visible.length - 1 ? ' last-visible-stop' : ''}`} key={`${loc.name}-${i}`}>
                      {i > 0 && <div className="connector" />}
                      {i === 0 ? <div className="stop-icon"><i className="material-icons">store</i></div> : <div className="stop-number">{i}</div>}
                      <div className="stop-details">
                        <div className="stop-info">
                          <div className="stop-name">{loc.name}</div>
                          <div className="stop-address">{loc.address}</div>
                          <div className="stop-time">{loc.time}</div>
                          <div className="stop-otp">
                            <span className="otp-label">OTP:</span>
                            <span className="otp-badge">{loc.otp || 'N/A'}</span>
                          </div>
                        </div>
                        {loc.status && (
                          <div className="stop-status">
                            <span className={`status-pill ${loc.statusClass ?? 'none'}`}>{loc.status}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {row.stops.length > 3 && (
                    <div className="show-more-container">
                      <button
                        className="show-more-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          const next = new Set(showAll);
                          if (all) next.delete(row.id);
                          else next.add(row.id);
                          setShowAll(next);
                        }}
                      >
                        <i className="material-icons">{all ? 'expand_less' : 'expand_more'}</i>
                        {all ? 'Show Less' : 'Show More Stops'}
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

  return (
    <div className="trips-container">
      <div className="page-header">
        <div className="header-content">
          <div className="header-icon"><i className="material-icons">{icon}</i></div>
          <div>
            <h1>{title}</h1>
            <p className="header-description">{description}</p>
          </div>
        </div>
        <div className="actions">{actions}</div>
      </div>

      <div className="stats-grid">
        {stats.map((s) => (
          <div className="stat-card" key={s.title}>
            <div className="stat-content">
              <div className="stat-title">{s.title}</div>
              <div className="stat-value">{s.value}</div>
              <div className="stat-subtitle">{s.sub}</div>
              <div className="stat-line">{s.line}</div>
            </div>
            <div className={`stat-icon ${s.cls}`}><i className={s.icon} /></div>
            <div className="trend-indicator" />
          </div>
        ))}
      </div>

      {children}

      <div className="trips-table-container">
        {loading && !rows.length && <DataLoading overlay={false} message={`Loading ${title.toLowerCase()}...`} showTip />}
        {rows.length > 0 && (
          <table className="trips-table">
            <thead>
              <tr>
                <th className="checkbox-cell" />
                <th className="expand-cell" />
                {columns.map((c) => (
                  <th key={c}>{c}</th>
                ))}
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const open = expanded === row.id;
                return (
                  <Fragment key={row.id}>
                    <tr className={`trip-row${open ? ' expanded' : ''}`}>
                      <td className="checkbox-cell" />
                      <td className="expand-cell" onClick={() => setExpanded(open ? null : row.id)} role="button" aria-label={open ? 'Collapse' : 'Expand'} aria-expanded={open} tabIndex={0} onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setExpanded(open ? null : row.id)}>
                        <i className={`material-icons expand-icon${open ? ' rotated' : ''}`}>chevron_right</i>
                      </td>
                      {row.cells.map((c, i) => (
                        <td key={i} className={i === 0 ? 'trip-number' : undefined}>{c}</td>
                      ))}
                      <td>
                        <button
                          className="kebab-btn"
                          title="Actions"
                          aria-label="Actions"
                          onClick={(e) => {
                            e.stopPropagation();
                            const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
                            setMenu(menu?.id === row.id ? null : { id: row.id, top: r.bottom + 4, right: window.innerWidth - r.right });
                          }}
                        >
                          <i className="material-icons">more_vert</i>
                        </button>
                      </td>
                    </tr>
                    {open && details(row)}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        )}
        {!loading && rows.length === 0 && (
          <div className="no-trips-message">
            <i className="fas fa-inbox" />
            <p>{emptyText}</p>
          </div>
        )}
      </div>

      {menuRow && menu && (
        <div className="kebab-dropdown" style={{ top: menu.top, right: menu.right }} onClick={(e) => e.stopPropagation()}>
          {menuRow.menu.map((m) => (
            <div
              key={m.label}
              className={`kebab-item${m.disabled ? ' disabled' : ''}`}
              role="menuitem"
              onClick={() => {
                if (m.disabled) return;
                setMenu(null);
                m.onClick();
              }}
            >
              <i className="material-icons" style={{ color: m.color }}>{m.icon}</i>
              <span>{m.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
