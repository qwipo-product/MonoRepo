// Cross Dock Store → Orders: grouped by retailer (one drop per retailer, whatever the seller). Orders arrive here
// when a truck's GRN closes (ready for planning), then go to riders through Delivery Planning.
import { Fragment, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import DataLoading from '../../components/DataLoading';
import { amountDue, type XdOrderRow, type XdOrderStatus } from '../../types/crossDock';
import { day, DISCREPANCY, plural, rupees, STORE_STATUS } from '../service-centre/labels';
import OrderDrawer from '../service-centre/OrderDrawer';
import { EmptyState, LoadError, PageHeader, StatCard, StatusPill } from '../service-centre/ScUi';
import { useLoad } from '../service-centre/useLoad';
import { useStoreApi } from './useStoreApi';

type Filter = 'ALL' | 'READY' | 'OUT' | 'DONE';
const FILTERS: { key: Filter; label: string; statuses: XdOrderStatus[] }[] = [
  { key: 'ALL', label: 'All', statuses: [] },
  { key: 'READY', label: 'Ready for planning', statuses: ['READY_TO_DISPATCH'] },
  { key: 'OUT', label: 'Out for delivery', statuses: ['OUT_FOR_DELIVERY'] },
  { key: 'DONE', label: 'Delivered or returned', statuses: ['DELIVERED', 'RETURNED'] },
];

export default function StoreOrdersPage() {
  const api = useStoreApi();
  const navigate = useNavigate();
  const { data, loading, error, reload } = useLoad(() => Promise.all([api.overview(), api.orders()]), [api]);
  const [which, setWhich] = useState<'today' | 'tomorrow'>('today');
  const [filter, setFilter] = useState<Filter>('ALL');
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState<XdOrderRow | null>(null);
  const [overview, all] = data ?? [null, [] as XdOrderRow[]];

  const date = overview ? (which === 'today' ? overview.operatingDate : nextDay(overview.operatingDate)) : '';
  const dayOrders = useMemo(() => all.filter((o) => o.deliveryDate === date && o.status !== 'PICKUP_PLANNED' && o.status !== 'PICKED_UP' && o.status !== 'DROPPED_AT_CDS'), [all, date]);
  const pending = useMemo(() => all.filter((o) => o.deliveryDate === date && (o.status === 'PICKUP_PLANNED' || o.status === 'PICKED_UP' || o.status === 'DROPPED_AT_CDS')), [all, date]);

  const retailers = useMemo(() => {
    const q = search.trim().toLowerCase();
    const statuses = FILTERS.find((f) => f.key === filter)!.statuses;
    const m = new Map<string, XdOrderRow[]>();
    dayOrders.forEach((o) => m.set(o.retailerId, [...(m.get(o.retailerId) ?? []), o]));
    return [...m.entries()]
      .map(([id, rows]) => ({ id, rows, name: rows[0].retailerName, locality: rows[0].retailerLocality }))
      .filter((r) => !statuses.length || r.rows.some((o) => statuses.includes(o.status)))
      .filter((r) => !q || [r.name, r.locality, ...r.rows.map((o) => o.orderNo), ...r.rows.map((o) => o.distributorName)].some((f) => f.toLowerCase().includes(q)))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [dayOrders, filter, search]);

  if (loading && !data) return <DataLoading message="Loading orders..." />;
  if (error && !data) return <div className="sc-page"><LoadError message={error} onRetry={reload} /></div>;
  if (!overview) return null;

  const count = (sts: XdOrderStatus[]) => dayOrders.filter((o) => sts.includes(o.status)).length;
  const planned = dayOrders.filter((o) => o.status === 'READY_TO_DISPATCH' && (o.runId || o.planId)).length;
  const today = which === 'today';

  return (
    <div className="sc-page">
      <PageHeader
        refreshError={error}
        icon="fa-box"
        title="Orders"
        subtitle="Grouped by retailer: one drop per retailer, whichever distributors the orders came from."
        actions={
          <>
            <button type="button" className="btn btn-sm btn-outline-secondary" onClick={reload} disabled={loading} aria-label="Refresh">
              <i className={`fas fa-rotate${loading ? ' fa-spin' : ''}`} />
            </button>
            <button type="button" className="btn btn-sm btn-primary text-nowrap" onClick={() => navigate('/cross-dock/delivery-planning')}>
              <i className="fas fa-motorcycle me-1" />
              Delivery Planning
            </button>
          </>
        }
      />

      <div className="sc-tabs mb-3" role="tablist" aria-label="Delivery day">
        {(['today', 'tomorrow'] as const).map((w) => (
          <button key={w} type="button" role="tab" aria-selected={which === w} className={`sc-tab${which === w ? ' sc-tab--active' : ''}`} onClick={() => { setWhich(w); setFilter('ALL'); }}>
            Delivering {w}, {day(w === 'today' ? overview.operatingDate : nextDay(overview.operatingDate))}
          </button>
        ))}
      </div>

      <div className="sc-stats">
        <StatCard label="Ready for planning" value={count(['READY_TO_DISPATCH'])} sub={planned ? `${planned} already on a route or trip` : today ? 'Received, waiting for a rider' : 'Received for tomorrow'} icon="fa-boxes-stacked" tone="purple" onClick={() => setFilter('READY')} active={filter === 'READY'} />
        <StatCard label="Customers" value={new Set(dayOrders.map((o) => o.retailerId)).size} sub={`${dayOrders.length} orders, one drop each`} icon="fa-store" tone="blue" />
        <StatCard label="Out for delivery" value={count(['OUT_FOR_DELIVERY'])} sub="With a rider now" icon="fa-motorcycle" tone="indigo" onClick={() => setFilter('OUT')} active={filter === 'OUT'} />
        <StatCard label="Delivered" value={count(['DELIVERED'])} sub={`${count(['RETURNED'])} returned`} icon="fa-circle-check" tone="green" onClick={() => setFilter('DONE')} active={filter === 'DONE'} />
      </div>

      {pending.length > 0 && (
        <div className="alert alert-light border small py-2">
          <i className="fas fa-truck-moving me-2 text-primary" aria-hidden="true" />
          {plural(pending.length, 'more order')} for {which} {pending.length === 1 ? 'is' : 'are'} still on the way or waiting in Inward.
        </div>
      )}

      <div className="sc-card">
        <div className="sc-card-head">
          <div className="sc-tabs" role="tablist" aria-label="Status">
            {FILTERS.map((f) => (
              <button key={f.key} type="button" role="tab" aria-selected={filter === f.key} className={`sc-tab${filter === f.key ? ' sc-tab--active' : ''}`} onClick={() => setFilter(f.key)}>
                {f.label}
              </button>
            ))}
          </div>
          <div className="sc-search">
            <i className="fas fa-search" aria-hidden="true" />
            <input className="form-control form-control-sm" placeholder="Search retailer, order, distributor" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search orders" />
          </div>
        </div>
        {retailers.length === 0 ? (
          <EmptyState icon="fa-box-open" title="No orders here" text={dayOrders.length ? 'Change the filter or search.' : `Nothing received yet for ${which}.`} />
        ) : (
          <div className="table-responsive">
            <table className="sc-table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>From</th>
                  <th className="num">Units</th>
                  <th className="num">To collect</th>
                  <th>Note</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {retailers.map((r) => {
                  const due = r.rows.filter((o) => o.status !== 'RETURNED').reduce((s, o) => s + amountDue(o), 0);
                  return (
                    <Fragment key={r.id}>
                      <tr className="sc-group-row">
                        <td colSpan={3}>
                          {r.name}
                          <span className="fw-normal text-muted ms-2 small">
                            {r.locality} · {plural(r.rows.length, 'order')} from {plural(new Set(r.rows.map((o) => o.distributorId)).size, 'distributor')}
                          </span>
                        </td>
                        <td className="num">{rupees(due)}</td>
                        <td colSpan={2} className="text-end">

                        </td>
                      </tr>
                      {r.rows.map((o) => (
                        <tr key={o.id}>
                          <td className="nowrap">
                            <button type="button" className="sc-link" onClick={() => setOpen(o)}>{o.orderNo}</button>
                            <div className="muted">{o.invoiceNo}</div>
                          </td>
                          <td>{o.distributorName}</td>
                          <td className="num">{o.quantity}</td>
                          <td className="num">{o.status === 'RETURNED' ? <span className="muted">-</span> : rupees(amountDue(o))}</td>
                          <td className="small">
                            {o.discrepancy ? <span className="text-danger">{DISCREPANCY[o.discrepancy.type]} {o.discrepancy.items} units at receiving</span> : o.returnReason ? <span className="text-danger">{o.returnReason}</span> : o.payment ? <span className="muted">{o.payment.cash && o.payment.upi ? 'Cash + UPI' : o.payment.cash ? 'Paid cash' : 'Paid by UPI'}</span> : null}
                          </td>
                          <td><StatusPill {...STORE_STATUS[o.status]} /></td>
                        </tr>
                      ))}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <OrderDrawer order={open} settings={overview.settings} audience="store" onClose={() => setOpen(null)} />
    </div>
  );
}

function nextDay(ymd: string) {
  const d = new Date(`${ymd}T00:00:00`);
  d.setDate(d.getDate() + 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
