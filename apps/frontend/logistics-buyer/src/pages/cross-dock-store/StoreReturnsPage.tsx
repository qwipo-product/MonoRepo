// Cross Dock Store → Returns: what riders brought back, held for the Service Centre's returns trip.
import { useMemo, useState } from 'react';
import DataLoading from '../../components/DataLoading';
import type { XdReturnRow, XdReturnStatus } from '../../types/crossDock';
import { dateTime, day, hm, plural, RETURN_STATUS, rupees } from '../service-centre/labels';
import { EmptyState, LoadError, PageHeader, StatCard, StatusPill } from '../service-centre/ScUi';
import { useLoad } from '../service-centre/useLoad';
import { useStoreApi } from './useStoreApi';

type Tab = 'WAITING' | 'PLANNED' | 'GONE';
const TABS: { key: Tab; label: string; statuses: XdReturnStatus[] }[] = [
  { key: 'WAITING', label: 'Held at the store', statuses: ['AT_CDS'] },
  { key: 'PLANNED', label: 'Pickup planned', statuses: ['RETURN_PLANNED'] },
  { key: 'GONE', label: 'Handed over', statuses: ['COLLECTED', 'RETURNED_TO_DISTRIBUTOR'] },
];

export default function StoreReturnsPage() {
  const api = useStoreApi();
  const { data, loading, error, reload } = useLoad(() => Promise.all([api.overview(), api.returns()]), [api]);
  const [tab, setTab] = useState<Tab>('WAITING');
  const [overview, returns] = data ?? [null, [] as XdReturnRow[]];
  const rows = useMemo(() => returns.filter((x) => TABS.find((t) => t.key === tab)!.statuses.includes(x.status)), [returns, tab]);

  if (loading && !data) return <DataLoading message="Loading returns..." />;
  if (error && !data) return <div className="sc-page"><LoadError message={error} onRetry={reload} /></div>;
  if (!overview) return null;

  const by = (k: Tab) => returns.filter((x) => TABS.find((t) => t.key === k)!.statuses.includes(x.status));
  const win = overview.settings.windows.find((w) => w.key === 'RETURNS');
  const value = (xs: XdReturnRow[]) => xs.reduce((s, x) => s + x.value, 0);

  return (
    <div className="sc-page">
      <PageHeader
        refreshError={error}
        icon="fa-rotate-left"
        title="Returns"
        subtitle={`Items riders brought back. Keep them at the store until the Service Centre collects them${win ? ` (${hm(win.start)} – ${hm(win.end)})` : ''}.`}
        actions={
          <button type="button" className="btn btn-sm btn-outline-secondary" onClick={reload} disabled={loading} aria-label="Refresh">
            <i className={`fas fa-rotate${loading ? ' fa-spin' : ''}`} />
          </button>
        }
      />

      <div className="sc-stats">
        <StatCard label="Held at the store" value={by('WAITING').length} sub={`${rupees(value(by('WAITING')))} · waiting for the Service Centre`} icon="fa-box" tone="amber" onClick={() => setTab('WAITING')} active={tab === 'WAITING'} />
        <StatCard label="Pickup planned" value={by('PLANNED').length} sub={by('PLANNED').length ? `On ${[...new Set(by('PLANNED').map((x) => x.tripNo))].join(', ')}` : 'No returns trip planned yet'} icon="fa-calendar-check" tone="blue" onClick={() => setTab('PLANNED')} active={tab === 'PLANNED'} />
        <StatCard label="Handed over" value={by('GONE').length} sub="Collected by the Service Centre" icon="fa-truck-moving" tone="green" onClick={() => setTab('GONE')} active={tab === 'GONE'} />
        <StatCard label="All returns" value={returns.length} sub={`${rupees(value(returns))} of goods`} icon="fa-chart-simple" tone="grey" />
      </div>

      <div className="sc-card">
        <div className="sc-card-head">
          <div className="sc-tabs" role="tablist" aria-label="Return status">
            {TABS.map((t) => (
              <button key={t.key} type="button" role="tab" aria-selected={tab === t.key} className={`sc-tab${tab === t.key ? ' sc-tab--active' : ''}`} onClick={() => setTab(t.key)}>
                {t.label}
                <span className="sc-count">{by(t.key).length}</span>
              </button>
            ))}
          </div>
        </div>
        {rows.length === 0 ? (
          <EmptyState icon="fa-circle-check" title={tab === 'WAITING' ? 'Nothing held at the store' : 'Nothing here'} text={tab === 'WAITING' ? 'Returns appear here when a rider records a returned order.' : undefined} />
        ) : (
          <div className="table-responsive">
            <table className="sc-table">
              <thead>
                <tr>
                  <th>Return</th>
                  <th>Retailer</th>
                  <th>Back to</th>
                  <th>Reason</th>
                  <th className="num">Units</th>
                  <th className="num">Value</th>
                  <th>Held since</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((x) => (
                  <tr key={x.id}>
                    <td className="nowrap">
                      <span className="fw-semibold">{x.returnNo}</span>
                      <div className="muted">{x.orderNo}</div>
                    </td>
                    <td>{x.retailerName}</td>
                    <td>{x.distributorName}</td>
                    <td className="small">{x.reason}</td>
                    <td className="num">{x.items}</td>
                    <td className="num">{rupees(x.value)}</td>
                    <td className="nowrap">{dateTime(x.heldSince)}</td>
                    <td>
                      <StatusPill {...RETURN_STATUS[x.status]} />
                      {x.tripNo && <div className="muted">{x.tripNo}</div>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <p className="small text-muted mt-2">
        {plural(by('WAITING').length, 'return')} held now. The Service Centre plans the returns trip; the next window is {day(overview.operatingDate)} or the day after,{' '}
        {win ? `${hm(win.start)} – ${hm(win.end)}` : 'late morning'}.
      </p>
    </div>
  );
}
