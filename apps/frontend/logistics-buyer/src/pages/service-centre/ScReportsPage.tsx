// Service Centre → Reports: the last seven days of drops, load, on-time rate and returns, per Cross Dock Store.
import { useMemo, useState } from 'react';
import DataLoading from '../../components/DataLoading';
import { crossDockService } from '../../api/services/crossDock.service';
import type { XdCds, XdDayCdsSummary } from '../../types/crossDock';
import { day, kg } from './labels';
import { cdsColor } from './mapColors';
import { EmptyState, LoadError, PageHeader, StatCard } from './ScUi';
import { useLoad } from './useLoad';

const pct = (a: number, b: number) => (b ? `${Math.round((a / b) * 100)}%` : '-');
const sum = (xs: XdDayCdsSummary[], k: keyof Omit<XdDayCdsSummary, 'date' | 'cdsId'>) => xs.reduce((s, x) => s + x[k], 0);

/** Clean axis ticks: 0, step, 2·step … covering max. */
function ticks(max: number): number[] {
  const raw = Math.max(1, max) / 4;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 5, 10].map((m) => m * mag).find((s) => s >= raw)!;
  return Array.from({ length: Math.ceil(max / step) + 1 }, (_, i) => i * step);
}

export default function ScReportsPage() {
  const { data, loading, error, reload } = useLoad(() => Promise.all([crossDockService.overview(), crossDockService.reports()]));
  const [cdsFilter, setCdsFilter] = useState('');
  const [overview, report] = data ?? [null, { days: [] as XdDayCdsSummary[] }];

  const live = useMemo(() => overview?.cdss.filter((c) => c.status === 'LIVE') ?? [], [overview]);
  const shown = useMemo(() => live.filter((c) => !cdsFilter || c.id === cdsFilter), [live, cdsFilter]);
  const rows = useMemo(() => report.days.filter((d) => shown.some((c) => c.id === d.cdsId)), [report, shown]);
  const days = useMemo(() => [...new Set(report.days.map((d) => d.date))].sort(), [report]);

  if (loading && !data) return <DataLoading message="Loading reports..." />;
  if (error && !data) return <div className="sc-page"><LoadError message={error} onRetry={reload} /></div>;
  if (!overview) return null;

  const dropped = sum(rows, 'ordersDropped');
  const onTime = sum(rows, 'onTimeOrders');

  return (
    <div className="sc-page">
      <PageHeader
        refreshError={error}
        icon="fa-chart-bar"
        title="Reports"
        subtitle={`Last ${days.length} days, ${day(days[0])} to today. Today counts what has happened so far.`}
        actions={
          <>
            <select className="form-select form-select-sm w-auto" value={cdsFilter} onChange={(e) => setCdsFilter(e.target.value)} aria-label="Cross Dock Store">
              <option value="">All Cross Dock Stores</option>
              {live.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <button type="button" className="btn btn-sm btn-outline-secondary" onClick={reload} disabled={loading} aria-label="Refresh">
              <i className={`fas fa-rotate${loading ? ' fa-spin' : ''}`} />
            </button>
          </>
        }
      />

      <div className="sc-stats">
        <StatCard label="Orders dropped at stores" value={dropped.toLocaleString('en-IN')} sub={`${Math.round(dropped / Math.max(1, days.length))} a day on average`} icon="fa-store" tone="green" />
        <StatCard label="Weight moved" value={kg(sum(rows, 'weightKg'))} sub="Distributor to store" icon="fa-weight-hanging" tone="blue" />
        <StatCard label="Reached the store by noon" value={pct(onTime, dropped)} sub={`${onTime} of ${dropped} orders`} icon="fa-clock" tone="indigo" />
        <StatCard label="Returns collected" value={sum(rows, 'returnsCollected')} sub="Taken back to distributors" icon="fa-rotate-left" tone="amber" />
      </div>

      <div className="sc-card mb-3">
        <div className="sc-card-head">
          <h2 className="sc-card-title">Orders dropped per day, by Cross Dock Store</h2>
        </div>
        <div className="sc-card-body">
          {rows.length === 0 ? (
            <EmptyState icon="fa-chart-column" title="No drops in this period" />
          ) : (
            <StackedDrops days={days} cdss={shown} rows={rows} today={overview.operatingDate} colorOf={(id) => cdsColor(overview, id)} />
          )}
        </div>
      </div>

      <div className="sc-card">
        <div className="sc-card-head">
          <h2 className="sc-card-title">By Cross Dock Store</h2>
          <span className="text-muted small">Same period</span>
        </div>
        <div className="table-responsive">
          <table className="sc-table">
            <thead>
              <tr>
                <th>Store</th>
                <th className="num">Orders dropped</th>
                <th className="num">Weight</th>
                <th className="num">By noon</th>
                <th className="num">Returns collected</th>
                <th className="num">Pickup trips</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((c) => {
                const xs = rows.filter((r) => r.cdsId === c.id);
                return (
                  <tr key={c.id}>
                    <td>
                      <span className="d-inline-flex align-items-center gap-2">
                        <span className="sc-swatch" style={{ background: cdsColor(overview, c.id) }} aria-hidden="true" />
                        <span className="fw-semibold">{c.name}</span>
                      </span>
                    </td>
                    <td className="num">{sum(xs, 'ordersDropped')}</td>
                    <td className="num">{kg(sum(xs, 'weightKg'))}</td>
                    <td className="num">{pct(sum(xs, 'onTimeOrders'), sum(xs, 'ordersDropped'))}</td>
                    <td className="num">{sum(xs, 'returnsCollected')}</td>
                    <td className="num">{sum(xs, 'pickupTrips')}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/** Stacked columns: one per day, one segment per store. 2px surface gaps, 4px rounded top, hover tooltip, table view below. */
function StackedDrops({ days, cdss, rows, today, colorOf }: { days: string[]; cdss: XdCds[]; rows: XdDayCdsSummary[]; today: string; colorOf: (id: string) => string }) {
  const [hover, setHover] = useState<number | null>(null);
  const [showTable, setShowTable] = useState(false);
  const W = 720;
  const H = 250;
  const pad = { l: 36, r: 8, t: 20, b: 30 };
  const plotH = H - pad.t - pad.b;
  const band = (W - pad.l - pad.r) / days.length;
  const barW = Math.min(24, band * 0.45);

  const data = days.map((d) => {
    const parts = cdss.map((c) => ({ c, v: rows.find((r) => r.date === d && r.cdsId === c.id)?.ordersDropped ?? 0 }));
    return { d, parts, total: parts.reduce((s, p) => s + p.v, 0) };
  });
  const tk = ticks(Math.max(...data.map((x) => x.total), 1));
  const max = tk[tk.length - 1];
  const y = (v: number) => pad.t + plotH - (v / max) * plotH;
  const GAP = 2;

  return (
    <div>
      <div className="sc-legend mb-2" aria-label="Legend">
        {cdss.map((c) => (
          <span key={c.id}>
            <i className="sc-swatch" style={{ background: colorOf(c.id) }} />
            {c.name}
          </span>
        ))}
      </div>
      <div style={{ position: 'relative' }}>
        <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label="Orders dropped per day at each Cross Dock Store" style={{ display: 'block', maxHeight: 300 }}>
          {tk.map((t) => (
            <g key={t}>
              <line x1={pad.l} x2={W - pad.r} y1={y(t)} y2={y(t)} stroke="#eceef1" strokeWidth={1} />
              <text x={pad.l - 8} y={y(t)} textAnchor="end" dominantBaseline="middle" fontSize={11} fill="#6b7280">{t}</text>
            </g>
          ))}
          {data.map((col, i) => {
            const cx = pad.l + band * i + band / 2;
            let acc = 0;
            const segs = col.parts.filter((p) => p.v > 0);
            return (
              <g key={col.d}>
                {segs.map((p, si) => {
                  const y0 = y(acc);
                  acc += p.v;
                  const y1 = y(acc);
                  const top = si === segs.length - 1;
                  const h = Math.max(0, y0 - y1 - (top ? 0 : GAP));
                  const r = top ? Math.min(4, h) : 0;
                  const x = cx - barW / 2;
                  const yy = y0 - h;
                  // Rounded top only (square at the baseline and between segments).
                  const d = r
                    ? `M${x},${y0} V${yy + r} Q${x},${yy} ${x + r},${yy} H${x + barW - r} Q${x + barW},${yy} ${x + barW},${yy + r} V${y0} Z`
                    : `M${x},${y0} V${yy} H${x + barW} V${y0} Z`;
                  return <path key={p.c.id} d={d} fill={colorOf(p.c.id)} opacity={hover === null || hover === i ? 1 : 0.45} />;
                })}
                <text x={cx} y={y(col.total) - 6} textAnchor="middle" fontSize={11} fill="#374151" fontWeight={600}>{col.total}</text>
                <text x={cx} y={H - 10} textAnchor="middle" fontSize={11} fill={col.d === today ? '#111827' : '#6b7280'} fontWeight={col.d === today ? 600 : 400}>
                  {col.d === today ? 'Today' : day(col.d).split(',')[0]}
                </text>
                <rect
                  x={pad.l + band * i}
                  y={pad.t}
                  width={band}
                  height={plotH}
                  fill="transparent"
                  onMouseEnter={() => setHover(i)}
                  onMouseLeave={() => setHover(null)}
                  onFocus={() => setHover(i)}
                  onBlur={() => setHover(null)}
                  tabIndex={0}
                  aria-label={`${day(col.d)}: ${col.total} orders dropped`}
                />
              </g>
            );
          })}
        </svg>
        {hover !== null && (
          <div
            className="sc-tooltip"
            style={{ left: `clamp(80px, ${((pad.l + band * hover + band / 2) / W) * 100}%, calc(100% - 80px))`, top: 0 }}
            role="tooltip"
          >
            <div className="fw-semibold mb-1">{data[hover].d === today ? `Today, ${day(data[hover].d)}` : day(data[hover].d)}</div>
            {data[hover].parts.map((p) => (
              <div key={p.c.id} className="d-flex align-items-center gap-2">
                <i className="sc-swatch" style={{ background: colorOf(p.c.id) }} />
                <span className="flex-grow-1">{p.c.code}</span>
                <span className="fw-semibold">{p.v}</span>
              </div>
            ))}
            <div className="d-flex justify-content-between border-top mt-1 pt-1">
              <span>Total</span>
              <span className="fw-semibold">{data[hover].total}</span>
            </div>
          </div>
        )}
      </div>
      <button type="button" className="btn btn-sm btn-link p-0 mt-2" onClick={() => setShowTable(!showTable)} aria-expanded={showTable}>
        {showTable ? 'Hide' : 'Show'} the numbers as a table
      </button>
      {showTable && (
        <div className="table-responsive mt-2">
          <table className="sc-table">
            <thead>
              <tr>
                <th>Day</th>
                {cdss.map((c) => (
                  <th key={c.id} className="num">{c.code}</th>
                ))}
                <th className="num">Total</th>
              </tr>
            </thead>
            <tbody>
              {data.map((col) => (
                <tr key={col.d}>
                  <td>{col.d === today ? `Today, ${day(col.d)}` : day(col.d)}</td>
                  {col.parts.map((p) => (
                    <td key={p.c.id} className="num">{p.v}</td>
                  ))}
                  <td className="num fw-semibold">{col.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
