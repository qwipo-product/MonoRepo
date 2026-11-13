// Cross Dock Store → Reports: the last seven days of deliveries, returns and money at this store.
import { useState } from 'react';
import DataLoading from '../../components/DataLoading';
import type { XdStoreDay } from '../../types/crossDock';
import { day, rupees } from '../service-centre/labels';
import { EmptyState, LoadError, PageHeader, StatCard } from '../service-centre/ScUi';
import { useLoad } from '../service-centre/useLoad';
import { useStoreApi } from './useStoreApi';

const sum = (xs: XdStoreDay[], k: keyof Omit<XdStoreDay, 'date' | 'cdsId'>) => xs.reduce((s, x) => s + x[k], 0);
const pct = (a: number, b: number) => (b ? `${Math.round((a / b) * 1000) / 10}%` : '-');

export default function StoreReportsPage() {
  const api = useStoreApi();
  const { data, loading, error, reload } = useLoad(() => Promise.all([api.overview(), api.reports()]), [api]);
  if (loading && !data) return <DataLoading message="Loading reports..." />;
  if (error && !data) return <div className="sc-page"><LoadError message={error} onRetry={reload} /></div>;
  if (!data) return null;
  const [overview, { days }] = data;

  const delivered = sum(days, 'delivered');
  const returned = sum(days, 'returned');
  const collected = sum(days, 'cash') + sum(days, 'upi');
  const deposited = sum(days, 'deposited');

  return (
    <div className="sc-page">
      <PageHeader
        refreshError={error}
        icon="fa-chart-bar"
        title="Reports"
        subtitle={`${overview.store.name}, last ${days.length} days to today. Today counts what has happened so far.`}
        actions={
          <button type="button" className="btn btn-sm btn-outline-secondary" onClick={reload} disabled={loading} aria-label="Refresh">
            <i className={`fas fa-rotate${loading ? ' fa-spin' : ''}`} />
          </button>
        }
      />

      <div className="sc-stats">
        <StatCard label="Orders delivered" value={delivered} sub={`${Math.round(delivered / Math.max(1, days.length))} a day on average`} icon="fa-circle-check" tone="green" />
        <StatCard label="Returned" value={pct(returned, delivered + returned)} sub={`${returned} of ${delivered + returned} orders`} icon="fa-rotate-left" tone="amber" />
        <StatCard label="Collected" value={rupees(collected)} sub={`${pct(sum(days, 'upi'), collected)} by UPI`} icon="fa-hand-holding-dollar" tone="blue" />
        <StatCard label="Deposited to Qwipo" value={rupees(deposited)} sub={collected - deposited > 0 ? `${rupees(collected - deposited)} still to send` : 'Everything sent'} icon="fa-building-columns" tone="indigo" />
      </div>

      <div className="sc-card mb-3">
        <div className="sc-card-head">
          <h2 className="sc-card-title">Orders delivered per day</h2>
        </div>
        <div className="sc-card-body">{days.length ? <DayColumns days={days} today={overview.operatingDate} /> : <EmptyState icon="fa-chart-column" title="No deliveries yet" />}</div>
      </div>

      <div className="sc-card">
        <div className="sc-card-head">
          <h2 className="sc-card-title">By day</h2>
        </div>
        <div className="table-responsive">
          <table className="sc-table">
            <thead>
              <tr>
                <th>Day</th>
                <th className="num">Received</th>
                <th className="num">Delivered</th>
                <th className="num">Returned</th>
                <th className="num">Cash</th>
                <th className="num">UPI</th>
                <th className="num">Deposited</th>
              </tr>
            </thead>
            <tbody>
              {[...days].reverse().map((x) => (
                <tr key={x.date}>
                  <td className="nowrap">{x.date === overview.operatingDate ? `Today, ${day(x.date)}` : day(x.date)}</td>
                  <td className="num">{x.received}</td>
                  <td className="num">{x.delivered}</td>
                  <td className="num">{x.returned}</td>
                  <td className="num">{rupees(x.cash)}</td>
                  <td className="num">{rupees(x.upi)}</td>
                  <td className="num">{rupees(x.deposited)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/** One series, one column per day: 4px rounded top, total on the cap, hover tooltip; the table below is the table view. */
function DayColumns({ days, today }: { days: XdStoreDay[]; today: string }) {
  const [hover, setHover] = useState<number | null>(null);
  const W = 720;
  const H = 230;
  const pad = { l: 36, r: 8, t: 20, b: 30 };
  const plotH = H - pad.t - pad.b;
  const band = (W - pad.l - pad.r) / days.length;
  const barW = Math.min(24, band * 0.45);
  const raw = Math.max(1, ...days.map((d) => d.delivered)) / 4;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 5, 10].map((m) => m * mag).find((s) => s >= raw)!;
  const ticks = Array.from({ length: Math.ceil(Math.max(1, ...days.map((d) => d.delivered)) / step) + 1 }, (_, i) => i * step);
  const max = ticks[ticks.length - 1];
  const y = (v: number) => pad.t + plotH - (v / max) * plotH;

  return (
    <div style={{ position: 'relative' }}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label="Orders delivered per day" style={{ display: 'block', maxHeight: 280 }}>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={pad.l} x2={W - pad.r} y1={y(t)} y2={y(t)} stroke="#eceef1" strokeWidth={1} />
            <text x={pad.l - 8} y={y(t)} textAnchor="end" dominantBaseline="middle" fontSize={11} fill="#6b7280">{t}</text>
          </g>
        ))}
        {days.map((d, i) => {
          const cx = pad.l + band * i + band / 2;
          const top = y(d.delivered);
          const h = y(0) - top;
          const r = Math.min(4, h);
          const x = cx - barW / 2;
          const path = h > 0 ? `M${x},${y(0)} V${top + r} Q${x},${top} ${x + r},${top} H${x + barW - r} Q${x + barW},${top} ${x + barW},${top + r} V${y(0)} Z` : '';
          return (
            <g key={d.date}>
              {path && <path d={path} fill="#2563eb" opacity={hover === null || hover === i ? 1 : 0.45} />}
              <text x={cx} y={top - 6} textAnchor="middle" fontSize={11} fill="#374151" fontWeight={600}>{d.delivered}</text>
              <text x={cx} y={H - 10} textAnchor="middle" fontSize={11} fill={d.date === today ? '#111827' : '#6b7280'} fontWeight={d.date === today ? 600 : 400}>
                {d.date === today ? 'Today' : day(d.date).split(',')[0]}
              </text>
              <rect x={pad.l + band * i} y={pad.t} width={band} height={plotH} fill="transparent" tabIndex={0} aria-label={`${day(d.date)}: ${d.delivered} delivered`} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} onFocus={() => setHover(i)} onBlur={() => setHover(null)} />
            </g>
          );
        })}
      </svg>
      {hover !== null && (
        <div className="sc-tooltip" role="tooltip" style={{ left: `clamp(80px, ${((pad.l + band * hover + band / 2) / W) * 100}%, calc(100% - 80px))`, top: 0 }}>
          <div className="fw-semibold mb-1">{days[hover].date === today ? `Today, ${day(days[hover].date)}` : day(days[hover].date)}</div>
          <div className="d-flex justify-content-between gap-3"><span>Delivered</span><span className="fw-semibold">{days[hover].delivered}</span></div>
          <div className="d-flex justify-content-between gap-3"><span>Returned</span><span className="fw-semibold">{days[hover].returned}</span></div>
          <div className="d-flex justify-content-between gap-3 border-top mt-1 pt-1"><span>Collected</span><span className="fw-semibold">{rupees(days[hover].cash + days[hover].upi)}</span></div>
        </div>
      )}
    </div>
  );
}
