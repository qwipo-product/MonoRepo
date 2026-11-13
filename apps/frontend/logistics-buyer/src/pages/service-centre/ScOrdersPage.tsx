// Service Centre → Orders: today's cross-dock orders, waiting for pickup or on their way to a Cross Dock Store.
import { Fragment, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import DataLoading from '../../components/DataLoading';
import { crossDockService } from '../../api/services/crossDock.service';
import type { XdOrderRow, XdOrderStatus } from '../../types/crossDock';
import { day, hm, kg, ORDER_STATUS, plural, rupees, slotLabel, time } from './labels';
import OrderDrawer from './OrderDrawer';
import { EmptyState, LoadError, PageHeader, StatCard, StatusPill } from './ScUi';
import { useLoad } from './useLoad';

const AT_CDS: XdOrderStatus[] = ['DROPPED_AT_CDS', 'RECEIVED_AT_CDS', 'READY_TO_DISPATCH', 'OUT_FOR_DELIVERY', 'DELIVERED', 'RETURNED'];

type Tab = 'ALL' | 'WAITING' | 'ON_TRIP' | 'DROPPED' | 'DIRECT';
const TABS: { key: Tab; label: string; statuses: XdOrderStatus[] }[] = [
  { key: 'ALL', label: 'All', statuses: [] },
  { key: 'WAITING', label: 'Waiting for pickup', statuses: ['ACCEPTED'] },
  { key: 'ON_TRIP', label: 'On a pickup trip', statuses: ['PICKUP_PLANNED', 'PICKED_UP'] },
  { key: 'DROPPED', label: 'At CDS', statuses: AT_CDS },
  { key: 'DIRECT', label: 'Sent to direct', statuses: ['DIRECT_DELIVERY'] },
];
type GroupBy = 'distributor' | 'cds' | 'none';

const sumKg = (xs: XdOrderRow[]) => xs.reduce((s, o) => s + o.weightKg, 0);

export default function ScOrdersPage() {
  const navigate = useNavigate();
  const { data, loading, error, reload } = useLoad(() => Promise.all([crossDockService.overview(), crossDockService.orders()]));
  const [tab, setTab] = useState<Tab>('ALL');
  const [groupBy, setGroupBy] = useState<GroupBy>('distributor');
  const [search, setSearch] = useState('');
  const [cdsId, setCdsId] = useState('');
  const [distributorId, setDistributorId] = useState('');
  const [open, setOpen] = useState<XdOrderRow | null>(null);

  const [overview, orders] = data ?? [null, [] as XdOrderRow[]];

  const counts = useMemo(() => {
    const c = Object.fromEntries(TABS.map((t) => [t.key, 0])) as Record<Tab, number>;
    orders.forEach((o) => {
      c.ALL++;
      TABS.forEach((t) => t.statuses.includes(o.status) && c[t.key]++);
    });
    return c;
  }, [orders]);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    const statuses = TABS.find((t) => t.key === tab)!.statuses;
    return orders.filter(
      (o) =>
        (!statuses.length || statuses.includes(o.status)) &&
        (!cdsId || o.cdsId === cdsId) &&
        (!distributorId || o.distributorId === distributorId) &&
        (!q || [o.orderNo, o.invoiceNo, o.retailerName, o.distributorName, o.cdsName, o.tripNo].some((f) => (f ?? '').toLowerCase().includes(q))),
    );
  }, [orders, tab, cdsId, distributorId, search]);

  const groups = useMemo(() => {
    if (groupBy === 'none') return [{ key: 'all', title: '', sub: '', rows }];
    const m = new Map<string, XdOrderRow[]>();
    rows.forEach((o) => {
      const k = groupBy === 'distributor' ? o.distributorId : o.cdsId ?? 'direct';
      m.set(k, [...(m.get(k) ?? []), o]);
    });
    return [...m.entries()]
      .map(([key, rs]) => {
        const first = rs[0];
        if (groupBy === 'distributor') {
          const cdsSplit = [...new Set(rs.map((o) => o.cdsCode ?? 'Direct'))];
          return { key, title: first.distributorName, sub: `${first.distributorLocality} · drops at ${cdsSplit.join(', ')}`, rows: rs };
        }
        return {
          key,
          title: first.cdsName ?? 'Outside every live CDS area (direct delivery)',
          sub: plural(new Set(rs.map((o) => o.distributorId)).size, 'distributor'),
          rows: rs,
        };
      })
      .sort((a, b) => a.title.localeCompare(b.title));
  }, [rows, groupBy]);

  if (loading && !data) return <DataLoading message="Loading cross-dock orders..." />;
  if (error && !data) return <div className="sc-page"><LoadError message={error} onRetry={reload} /></div>;
  if (!overview) return null;

  const waiting = orders.filter((o) => o.status === 'ACCEPTED');
  const onTrip = orders.filter((o) => o.status === 'PICKUP_PLANNED' || o.status === 'PICKED_UP');
  const dropped = orders.filter((o) => AT_CDS.includes(o.status));
  const direct = orders.filter((o) => o.status === 'DIRECT_DELIVERY');
  const liveCds = overview.cdss.filter((c) => c.status === 'LIVE');
  const filtersOn = !!(search || cdsId || distributorId || tab !== 'ALL');

  return (
    <div className="sc-page">
      <PageHeader
        refreshError={error}
        icon="fa-box"
        title="Cross-dock Orders"
        subtitle="Orders distributors accepted for retailers inside a Cross Dock Store area."
        actions={
          <>
            <button type="button" className="btn btn-sm btn-outline-secondary" onClick={reload} disabled={loading} aria-label="Refresh">
              <i className={`fas fa-rotate${loading ? ' fa-spin' : ''}`} />
            </button>
            <button
              type="button"
              className="btn btn-sm btn-primary text-nowrap"
              onClick={() => navigate(`/service-centre/pickup-planning${distributorId ? `?distributor=${distributorId}` : ''}`)}
            >
              <i className="fas fa-route me-1" />
              Plan pickup
            </button>
          </>
        }
      >
        <div className="d-flex flex-wrap gap-2 mt-2">
          <span className="sc-chip"><i className="fas fa-clock" aria-hidden="true" /> Order slot closed {hm(overview.settings.orderCutoff)}</span>
          <span className="sc-chip"><i className="fas fa-calendar-day" aria-hidden="true" /> Delivery {day(overview.deliveryDate)}</span>
          <span className="sc-chip sc-chip--cds"><i className="fas fa-store" aria-hidden="true" /> {plural(liveCds.length, 'live Cross Dock Store')}</span>
        </div>
      </PageHeader>

      <div className="sc-stats">
        <StatCard label="Waiting for pickup" value={waiting.length} sub={`${kg(sumKg(waiting))} · ${plural(new Set(waiting.map((o) => o.distributorId)).size, 'distributor')}`} icon="fa-hourglass-half" tone="amber" onClick={() => setTab('WAITING')} active={tab === 'WAITING'} />
        <StatCard label="On a pickup trip" value={onTrip.length} sub={`${kg(sumKg(onTrip))} planned or picked up`} icon="fa-truck-moving" tone="indigo" onClick={() => setTab('ON_TRIP')} active={tab === 'ON_TRIP'} />
        <StatCard label="Handed to CDS" value={dropped.length} sub={`${kg(sumKg(dropped))} at ${plural(new Set(dropped.map((o) => o.cdsId)).size, 'store')}`} icon="fa-store" tone="green" onClick={() => setTab('DROPPED')} active={tab === 'DROPPED'} />
        <StatCard label="Sent to direct delivery" value={direct.length} sub="Retailer outside every live CDS area" icon="fa-arrow-turn-down" tone="grey" onClick={() => setTab('DIRECT')} active={tab === 'DIRECT'} />
      </div>

      <div className="sc-card">
        <div className="sc-card-head">
          <div className="sc-tabs" role="tablist" aria-label="Order status">
            {TABS.map((t) => (
              <button key={t.key} type="button" role="tab" aria-selected={tab === t.key} className={`sc-tab${tab === t.key ? ' sc-tab--active' : ''}`} onClick={() => setTab(t.key)}>
                {t.label}
                <span className="sc-count">{counts[t.key]}</span>
              </button>
            ))}
          </div>
          <div className="d-flex gap-2 flex-wrap align-items-center">
            <div className="sc-search">
              <i className="fas fa-search" aria-hidden="true" />
              <input className="form-control form-control-sm" placeholder="Search order, retailer, distributor, trip" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search orders" />
            </div>
            <select className="form-select form-select-sm w-auto" value={distributorId} onChange={(e) => setDistributorId(e.target.value)} aria-label="Distributor">
              <option value="">All distributors</option>
              {overview.distributors.filter((d) => d.deliveryModes.includes('CROSS_DOCK')).map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
            <select className="form-select form-select-sm w-auto" value={cdsId} onChange={(e) => setCdsId(e.target.value)} aria-label="Cross Dock Store">
              <option value="">All Cross Dock Stores</option>
              {liveCds.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <select className="form-select form-select-sm w-auto" value={groupBy} onChange={(e) => setGroupBy(e.target.value as GroupBy)} aria-label="Group by">
              <option value="distributor">Group by distributor</option>
              <option value="cds">Group by Cross Dock Store</option>
              <option value="none">No grouping</option>
            </select>
          </div>
        </div>

        {rows.length === 0 ? (
          <EmptyState
            icon="fa-box-open"
            title={filtersOn ? 'No orders match these filters' : 'No cross-dock orders today'}
            text={filtersOn ? 'Change the filters or search.' : 'Orders appear here when distributors accept them in the Seller Store.'}
          />
        ) : (
          <div className="table-responsive">
            <table className="sc-table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Retailer</th>
                  {groupBy !== 'distributor' && <th>Distributor</th>}
                  {groupBy !== 'cds' && <th>Drop at</th>}
                  <th>Accepted</th>
                  <th className="num">Weight</th>
                  <th className="num">Value</th>
                  <th>Pickup</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {groups.map((g) => (
                  <Fragment key={g.key}>
                    {groupBy !== 'none' && (
                      <tr className="sc-group-row">
                        <td colSpan={8}>
                          {g.title}
                          <span className="fw-normal text-muted ms-2 small">{g.sub}</span>
                        </td>
                        <td className="text-nowrap small">
                          {plural(g.rows.length, 'order')} · {kg(sumKg(g.rows))}
                        </td>
                      </tr>
                    )}
                    {g.rows.map((o) => (
                      <tr key={o.id}>
                        <td className="nowrap">
                          <button type="button" className="sc-link" onClick={() => setOpen(o)}>{o.orderNo}</button>
                          <div className="muted">{o.invoiceNo}</div>
                        </td>
                        <td>
                          {o.retailerName}
                          <div className="muted">{o.retailerLocality}</div>
                        </td>
                        {groupBy !== 'distributor' && (
                          <td>
                            {o.distributorName}
                            <div className="muted">{o.distributorLocality}</div>
                          </td>
                        )}
                        {groupBy !== 'cds' && <td>{o.cdsCode ? <span className="sc-chip sc-chip--cds">{o.cdsCode}</span> : <span className="muted">Direct</span>}</td>}
                        <td className="text-nowrap">{time(o.acceptedAt)}</td>
                        <td className="num">{kg(o.weightKg)}</td>
                        <td className="num">{rupees(o.value)}</td>
                        <td className="text-nowrap">
                          {o.tripNo && o.pickupTripId ? (
                            <>
                              <Link to={`/service-centre/trips/${o.pickupTripId}`}>{o.tripNo}</Link>
                              <div className="muted">{slotLabel(overview.settings, o.round, false)}</div>
                            </>
                          ) : (
                            <span className="muted">-</span>
                          )}
                        </td>
                        <td><StatusPill {...ORDER_STATUS[o.status]} /></td>
                      </tr>
                    ))}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <OrderDrawer order={open} settings={overview.settings} onClose={() => setOpen(null)} />
    </div>
  );
}
