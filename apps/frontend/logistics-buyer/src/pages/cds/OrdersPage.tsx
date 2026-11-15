// Orders — Service Centre: all CDS Store Delivery orders across its stores. CDS User: its store's orders, retailer-wise.
import { useEffect, useState, type ReactNode } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router';
import Swal from 'sweetalert2';
import { cdsApi, type OrderRow } from '../../api/services/cds.service';
import { ORDER_STATUS } from '../../cds/status';
import type { OrderStatus, TripType } from '../../cds/types';
import { RouteMapDialog } from './RouteMap';
import { askText, Badge, Empty, ErrorBox, FiltersDialog, fmtDate, fmtDateTime, Loading, money, Pager, sumOf, Table, useAction, useCdsSession, useLoad, useMeta, type FilterField } from './ui';
import DataLoading from '../../components/DataLoading';
import '../orders/OrderDetailsPage.css';
import '../orders/OrdersPage.css';

/** Orders — same layout as the LBNP Orders screen: header, search + Filters, applied filters, KPI cards, table. */
export default function OrdersPage() {
  const { sc } = useCdsSession();
  const navigate = useNavigate();
  const meta = useMeta();
  const [params] = useSearchParams();
  const initiate = params.get('initiate') === '1';
  const [f, setF] = useState({ search: '', status: (initiate ? 'DELIVERED' : '') as OrderStatus | '', distributorId: '', cdsStoreId: '', state: '', city: '', fromDate: '', toDate: '', retailerId: params.get('retailer') ?? '' });
  const [pageNumber, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [showFilters, setShowFilters] = useState(false);
  const [mapOpen, setMapOpen] = useState(false);
  const { busy, run } = useAction();
  const set = (p: Partial<typeof f>) => { setF((x) => ({ ...x, ...p })); setPage(1); };
  const { data, error, loading, reload } = useLoad(
    () => cdsApi.searchOrders({ ...f, statuses: f.status ? [f.status] : [], pageNumber, pageSize }),
    [f, pageNumber, pageSize],
  );
  // All orders once: the KPI cards (orders still to plan) and the State / City lists.
  const all = useLoad(() => cdsApi.searchOrders({ pageSize: 0 }), []);
  const rows = data?.rows ?? [];
  const allRows = all.data?.rows ?? [];
  const states = Array.from(new Set(allRows.map((o) => o.state).filter(Boolean))).sort();
  const cities = Array.from(new Map(allRows.filter((o) => o.city).map((o) => [o.city, o.state])).entries()).sort((a, b) => a[0].localeCompare(b[0]));
  const fields: FilterField[] = [
    { key: 'fromDate', label: 'Order Start Date', type: 'date' },
    { key: 'toDate', label: 'Order End Date', type: 'date' },
    { key: 'status', label: 'Status', type: 'select', allLabel: 'All', options: (Object.keys(ORDER_STATUS) as OrderStatus[]).map((s) => ({ value: s, label: ORDER_STATUS[s].label })) },
    { key: 'distributorId', label: 'Distributor', type: 'select', allLabel: 'All', options: (meta.data?.distributors ?? []).map((d) => ({ value: d.id, label: d.name })) },
    { key: 'state', label: 'State', type: 'select', allLabel: 'All', options: states.map((s) => ({ value: s, label: s })) },
    { key: 'city', label: 'City', type: 'select', allLabel: 'All', dependsOn: 'state', options: cities.map(([c, st]) => ({ value: c, label: c, parent: st })) },
    ...(sc ? [{ key: 'cdsStoreId', label: 'CDS Store', type: 'select' as const, allLabel: 'All', options: (meta.data?.stores ?? []).map((d) => ({ value: d.id, label: d.name })) }] : []),
  ];
  // KPI cards: what is still to plan — Service Centre: confirmed orders to pick up; CDS User: orders ready to deliver.
  const toPlan = allRows.filter((o) => o.status === (sc ? 'CONFIRMED' : 'READY_FOR_DELIVERY'));
  const toPlanSub = sc ? 'To be picked up' : 'To be delivered';
  const retailersToPlan = Array.from(new Map(toPlan.map((o) => [o.retailerId, o])).values());
  type Chip = { key: keyof typeof f; text: string };
  const chips = ([
    f.status ? { key: 'status', text: `Status: ${ORDER_STATUS[f.status].label}` } : null,
    f.fromDate || f.toDate ? { key: 'fromDate', text: `Order Date: ${f.fromDate ? fmtDate(f.fromDate) : '…'} – ${f.toDate ? fmtDate(f.toDate) : '…'}` } : null,
    f.distributorId ? { key: 'distributorId', text: `Distributor: ${meta.data?.distributors.find((d) => d.id === f.distributorId)?.name ?? ''}` } : null,
    f.state ? { key: 'state', text: `State: ${f.state}` } : null,
    f.city ? { key: 'city', text: `City: ${f.city}` } : null,
    f.cdsStoreId ? { key: 'cdsStoreId', text: `CDS Store: ${meta.data?.stores.find((d) => d.id === f.cdsStoreId)?.name ?? ''}` } : null,
    f.retailerId ? { key: 'retailerId', text: `Retailer: ${rows[0]?.retailerName ?? 'selected'}` } : null,
  ] as (Chip | null)[]).filter((x): x is Chip => !!x);
  const removeChip = (k: keyof typeof f) => set(k === 'fromDate' ? { fromDate: '', toDate: '' } : k === 'state' ? { state: '', city: '' } : { [k]: '' });
  const cancel = async (o: OrderRow) => {
    const r = await askText(`Cancel ${o.orderNo}?`, 'Cancellation reason', 'Cancel order', true);
    if (r && (await run(() => cdsApi.cancelOrder(o.id, r), 'Order cancelled'))) { reload(); all.reload(); }
  };
  const head = ['Created Date', 'Order Date', 'Retailer Name', 'Distributor', ...(sc ? ['CDS Store'] : []), 'Sales Person', 'Mobile Number', 'Status', 'Actions'];
  const row = (o: OrderRow) => (
    <tr key={o.id} className="mat-mdc-row small">
      <td className="small text-center">{fmtDateTime(o.createdAt)}</td>
      <td className="small text-center">{fmtDate(o.confirmedAt)}</td>
      <td className="small">{o.retailerName}</td>
      <td className="small">{o.distributorName}</td>
      {sc && <td className="small">{o.storeName}</td>}
      <td className="small">{o.salesPersonName}</td>
      <td className="small">{o.salesPersonPhone}</td>
      <td className="text-center"><Badge meta={ORDER_STATUS[o.status]} /></td>
      <td className="text-center">
        <div className="d-flex align-items-center justify-content-center gap-2 flex-nowrap">
          <button className="btn btn-sm text-primary cds-icon-btn" title="View Order" aria-label={`View order ${o.orderNo}`} onClick={() => navigate(`/cds/orders/${o.id}`)}><i className="fas fa-eye" /></button>
          {sc && o.status === 'CONFIRMED' && (
            <button className="btn btn-sm text-danger cds-icon-btn cds-icon-btn--danger" title="Cancel Order" aria-label={`Cancel order ${o.orderNo}`} disabled={busy} onClick={() => void cancel(o)}><i className="fas fa-times" /></button>
          )}
        </div>
      </td>
    </tr>
  );
  const kpi = (label: string, value: ReactNode, icon: string, tone: string, sub: string) => (
    <div className="stat-card stat-card--clickable" role="button" onClick={() => setMapOpen(true)}>
      <div className="stat-left">
        <div className="stat-label">{label}</div>
        <div className="stat-value">{value}</div>
        <div className="stat-subtitle">{sub}</div>
      </div>
      <div className="stat-right">
        <div className={`stat-icon stat-icon--${tone}`}><i className={`fas ${icon}`} /></div>
        <span className="stat-map-link"><i className="fas fa-map me-1" /> View map</span>
      </div>
    </div>
  );
  return (
    <div className="cds-page orders-page cds-orders-lbnp container-fluid p-3 bg-light h-100">
      {/* A. Header */}
      <div className="px-3">
        <div className="d-flex align-items-center justify-content-between mb-2">
          <div>
            <div className="d-flex align-items-center">
              <i className="fas fa-shopping-bag text-primary me-2 fs-5" />
              <h1 className="fs-3 mb-0 fw-bold">Orders</h1>
            </div>
            <p className="text-muted small mb-0">{sc ? 'CDS Store Delivery orders confirmed in the Seller Store, across your CDS stores.' : 'Seller Store orders for your CDS store, retailer-wise.'}</p>
          </div>
        </div>

        {/* B. Search row */}
        <div className="d-flex align-items-center gap-2">
          <div className="position-relative flex-grow-1">
            <input type="text" className="form-control form-control-sm pe-4 retailer-search" autoComplete="off" placeholder="Search by order number, seller reference, retailer name or mobile number" aria-label="Search" value={f.search} onChange={(e) => set({ search: e.target.value })} />
            {f.search && (
              <button type="button" title="Clear search" className="btn btn-sm position-absolute top-50 end-0 translate-middle-y me-2 p-0 border-0 bg-transparent text-muted" onClick={() => set({ search: '' })}><i className="fas fa-times" /></button>
            )}
          </div>
          <button className="btn btn-sm btn-outline-primary d-flex align-items-center text-nowrap" onClick={() => setShowFilters(true)}><i className="fas fa-filter me-1 fs-6" />Filters</button>
        </div>
      </div>

      {/* C. Applied filters */}
      {chips.length > 0 && (
        <div className="px-3 mt-2 filterArea">
          <div className="d-flex align-items-center gap-2 flex-wrap">
            <span className="text-muted small">Applied filters:</span>
            {chips.map((c) => (
              <div className="filter-badge" key={c.key}>
                <span>{c.text}</span>
                <button className="badge-close-btn" aria-label={`Remove ${c.text}`} onClick={() => removeChip(c.key)}><i className="fas fa-times" /></button>
              </div>
            ))}
            <button className="btn btn-sm text-primary border-0 ms-auto" onClick={() => set({ status: '', fromDate: '', toDate: '', distributorId: '', state: '', city: '', cdsStoreId: '', retailerId: '' })}>Clear all</button>
          </div>
        </div>
      )}
      {initiate && <div className="cds-note mx-3 mt-2"><i className="fas fa-rotate-left mt-1" />Open a delivered order and use <b className="mx-1">Initiate Return</b> to raise a retailer return.</div>}

      {/* D. KPI cards (same as LBNP Orders) */}
      <div className="stats-grid px-3 mt-3">
        {kpi(sc ? 'No. of Retailers' : 'No. of Customers', retailersToPlan.length, 'fa-users', 'customers', sc ? 'Waiting for pickup' : 'To deliver to')}
        {kpi('Total Orders', toPlan.length, 'fa-chart-line', 'orders', sc ? 'Waiting for pickup' : 'Waiting for delivery')}
        {kpi('Total Weight', `${(Math.round(sumOf(toPlan, (o) => o.weightKg) * 10) / 10).toLocaleString('en-IN')} Kgs`, 'fa-weight-hanging', 'weight', sc ? 'Load to pick up' : 'Load to deliver')}
        {sc && kpi('No. of Distributors', new Set(toPlan.map((o) => o.distributorId)).size, 'fa-industry', 'distributors', 'Sellers to pick up from')}
        {sc && kpi('No. of CDS Stores', new Set(toPlan.map((o) => o.cdsStoreId)).size, 'fa-warehouse', 'stores', 'CDS stores to drop at')}
      </div>

      {/* E. Table card */}
      <div className="p-3">
        <div className="mat-card mat-elevation-z3">
          {error && <ErrorBox text={error} onRetry={reload} />}
          {loading && !data ? <Loading text="Loading orders..." /> : (
            <>
              <Table head={head} empty={!rows.length && <Empty text="No orders found" />}>
                {rows.map(row)}
              </Table>
              {data && <div className="d-flex justify-content-end p-1 bg-white"><Pager total={data.total} pageNumber={data.pageNumber} pageSize={pageSize} onPage={setPage} onPageSize={(n) => { setPageSize(n); setPage(1); }} /></div>}
            </>
          )}
        </div>
      </div>

      {showFilters && (
        <FiltersDialog
          title="Order Filters"
          fields={fields}
          values={f}
          onClose={() => setShowFilters(false)}
          onApply={(v) => { set({ fromDate: v.fromDate, toDate: v.toDate, status: v.status as OrderStatus | '', distributorId: v.distributorId, state: v.state, city: v.city, cdsStoreId: v.cdsStoreId ?? '' }); setShowFilters(false); }}
        />
      )}
      {mapOpen && (
        <RouteMapDialog
          title={sc ? 'Orders to pick up · Map View' : 'Orders to deliver · Map View'}
          subtitle={`${retailersToPlan.length} retailers · ${toPlan.length} orders · ${toPlanSub.toLowerCase()}`}
          line={false}
          stops={retailersToPlan.map((o, i) => ({ seq: i + 1, name: o.retailerName, detail: `${o.locality}, ${o.city}`, lat: o.retailerLat, lng: o.retailerLng, orders: toPlan.filter((x) => x.retailerId === o.retailerId).map((x) => `${x.orderNo} · ${x.distributorName} · ₹${Math.round(x.orderValue).toLocaleString('en-IN')}`) }))}
          onClose={() => setMapOpen(false)}
        />
      )}
    </div>
  );
}

/** Synthetic 3PL providers for Search Vehicles (demo data only). */
type Provider = { id: string; name: string; category: string; price: number; etaHours: number; expiresAt: number };
const PROVIDERS = [
  { name: 'Swift Logistics', category: 'Standard Delivery', rate: 9, base: 120, etaHours: 4 },
  { name: 'CityLink Movers', category: 'Express Delivery', rate: 12, base: 160, etaHours: 2 },
  { name: 'QuickHaul Freight', category: 'Standard Delivery', rate: 8, base: 140, etaHours: 6 },
];
const SEARCH_STEPS = ['Creating route plan...', 'Searching for available vehicles...', 'Waiting for provider responses...', 'Loading available providers...'];
const SEARCH_EXPIRY_MS = 5 * 60 * 1000;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const left = (ms: number) => { const s = Math.max(0, Math.floor(ms / 1000)); return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`; };

/** Order view — same layout as the LBNP Order Details screen: header with back button, tabs, info sections, and
 *  (Ready for Planning orders) Search Vehicles with the vehicle search sidebar. */
export function OrderDetailsPage() {
  const { id = '' } = useParams();
  const { sc } = useCdsSession();
  const navigate = useNavigate();
  const meta = useMeta();
  const { busy, run } = useAction();
  const [tab, setTab] = useState<'summary' | 'products'>('summary');
  const { data, error, loading, reload } = useLoad(() => cdsApi.order(id), [id]);
  const [searching, setSearching] = useState(false);
  const [progress, setProgress] = useState('');
  const [searchError, setSearchError] = useState('');
  const [providers, setProviders] = useState<Provider[]>([]);
  const [selected, setSelected] = useState<Provider | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!providers.length) return;
    const tm = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(tm);
  }, [providers.length]);
  if (error) return <div className="cds-page"><ErrorBox text={error} onRetry={reload} /></div>;
  if (!data) return <div className="order-details-page order-details-container"><DataLoading message="Loading order details..." showTip overlay={false} /></div>;
  const o = data.order;
  const returnable = data.returnable.filter((r) => r.max > 0);
  const cancel = async () => {
    const r = await askText(`Cancel ${o.orderNo}?`, 'Cancellation reason', 'Cancel order', true);
    if (r && (await run(() => cdsApi.cancelOrder(o.id, r), 'Order cancelled'))) reload();
  };
  const initiate = async () => {
    const reasons = meta.data?.returnReasons ?? [];
    const res = await Swal.fire({
      title: `Initiate return · ${o.orderNo}`, width: 640,
      html: `<div class="text-start small">${returnable.map((r) => {
        const l = o.lines.find((x) => x.sku === r.sku)!;
        return `<div class="border rounded p-2 mb-2"><div class="fw-semibold mb-1">${l.name} <span class="text-muted">(up to ${r.max})</span></div>
          <div class="d-flex gap-2"><input id="q-${r.sku}" type="number" min="0" max="${r.max}" value="0" class="form-control form-control-sm" style="width:80px" aria-label="Quantity">
          <select id="r-${r.sku}" class="form-select form-select-sm">${reasons.map((x) => `<option>${x}</option>`).join('')}</select>
          <select id="c-${r.sku}" class="form-select form-select-sm" style="width:120px"><option value="GOOD">Good</option><option value="DAMAGED">Damaged</option><option value="EXPIRED">Expired</option></select></div></div>`;
      }).join('')}<div class="text-muted">The return is collected on the next delivery trip to this retailer.</div></div>`,
      showCancelButton: true, confirmButtonText: 'Initiate return', confirmButtonColor: '#1e3a8a', reverseButtons: true,
      preConfirm: () => {
        const v = (k: string) => (document.getElementById(k) as HTMLInputElement).value;
        const lines = returnable.map((r) => ({ sku: r.sku, qty: Math.floor(Number(v(`q-${r.sku}`))), reason: v(`r-${r.sku}`), condition: v(`c-${r.sku}`) as 'GOOD' })).filter((x) => x.qty > 0);
        if (!lines.length) return Swal.showValidationMessage('Enter a quantity for at least one item');
        return lines;
      },
    });
    if (res.isConfirmed && (await run(() => cdsApi.initiateReturn({ orderId: o.id, lines: res.value }), 'Return initiated'))) reload();
  };
  const loadKg = sumOf(o.lines, (l) => Math.max(0, l.acceptedQty - l.deliveredQty) * l.unitWeightKg);
  const searchVehicles = async () => {
    setSearchError('');
    setSelected(null);
    setSearching(true);
    for (const step of SEARCH_STEPS) {
      setProgress(step);
      await sleep(700);
    }
    const expiresAt = Date.now() + SEARCH_EXPIRY_MS;
    setProviders(PROVIDERS.map((p, i) => ({ id: `prv-${i + 1}`, name: p.name, category: p.category, price: Math.round(p.base + p.rate * Math.max(1, loadKg)), etaHours: p.etaHours, expiresAt })));
    setSearching(false);
    setProgress('');
  };
  const cancelSearch = () => { setProviders([]); setSelected(null); setSearchError(''); };
  const confirmBooking = async () => {
    if (!selected) return;
    setConfirming(true);
    try {
      await cdsApi.bookOrder(o.id, { provider: selected.name, price: selected.price });
      await Swal.fire({ icon: 'success', title: 'Booking Confirmed', text: `Delivery booked with ${selected.name}`, showConfirmButton: false, timer: 1500 });
      navigate('/cds/trips?tab=RETAILER_DELIVERY');
    } catch (e) {
      void Swal.fire({ icon: 'error', title: 'Booking Failed', text: e instanceof Error ? e.message : 'Failed to confirm booking. Please try again.', confirmButtonColor: '#1e3a8a' });
    } finally {
      setConfirming(false);
    }
  };
  const live = providers.filter((p) => p.expiresAt > now);
  const showSidebar = searching || !!searchError || providers.length > 0;
  const tripLink = (type: TripType) => {
    const t = data.trips.find((x) => x.type === type);
    return t ? <a href={`#/cds/trips/${t.id}`} onClick={(e) => { e.preventDefault(); navigate(`/cds/trips/${t.id}`); }}>{t.tripNo}</a> : 'N/A';
  };
  // LBNP Delivery Information: the retailer delivery trip (before it, the pickup trip).
  const trip = data.trips.find((x) => x.type === 'RETAILER_DELIVERY' && x.status !== 'CANCELLED') ?? data.trips.find((x) => x.type === 'DISTRIBUTOR_PICKUP' && x.status !== 'CANCELLED');
  const total = sumOf(o.lines, (l) => l.qty * l.unitPrice);
  const section = (icon: string, title: string, rows: [string, string, ReactNode][]) => (
    <div className="details-section">
      <h3><i className={`fas ${icon}`} /> {title}</h3>
      <table className="info-table">
        <tbody>
          {rows.map(([ic, label, value]) => <tr key={label}><td><i className={`fas ${ic}`} /> {label}</td><td>{value || value === 0 ? value : 'N/A'}</td></tr>)}
        </tbody>
      </table>
    </div>
  );
  return (
    <div className="order-details-page order-details-container">
      <header className="orders-header">
        <div className="header-left">
          <button className="back-btn" onClick={() => navigate('/cds/orders')} aria-label="Back"><i className="fas fa-arrow-left" /></button>
          <div className="title-section">
            <h1><i className="fas fa-file-invoice" /> Order Details</h1>
            <p className="subtitle">Order #{o.orderNo} - Order Date {fmtDate(o.confirmedAt)}</p>
          </div>
        </div>
        <div className="header-actions">
          {!sc && o.status === 'READY_FOR_DELIVERY' && providers.length === 0 && !searching && (
            <button className="btn btn-primary d-flex align-items-center text-nowrap gap-2" onClick={() => void searchVehicles()}>
              <i className="fas fa-search" /><span className="fs-6">Search Vehicles</span>
            </button>
          )}
          {sc && o.status === 'CONFIRMED' && <button className="btn btn-outline-danger d-flex align-items-center text-nowrap gap-2" disabled={busy} onClick={() => void cancel()}><i className="fas fa-times" /><span className="fs-6">Cancel Order</span></button>}
          {!sc && ['DELIVERED', 'PARTIALLY_DELIVERED'].includes(o.status) && returnable.length > 0 && <button className="btn btn-primary d-flex align-items-center text-nowrap gap-2" disabled={busy} onClick={() => void initiate()}><i className="fas fa-rotate-left" /><span className="fs-6">Initiate Return</span></button>}
        </div>
      </header>

      {o.note && <div className="cds-note warn"><i className="fas fa-circle-exclamation mt-1" />{o.note}</div>}

      <div className={`main-layout${showSidebar ? ' with-sidebar' : ''}`}>
        <div className="content-container">
          <div className="tabs-container">
            <div className={`tab${tab === 'summary' ? ' active' : ''}`} onClick={() => setTab('summary')}><i className="fas fa-info-circle" /> Order Summary</div>
            <div className={`tab${tab === 'products' ? ' active' : ''}`} onClick={() => setTab('products')}><i className="fas fa-box" /> Product Details</div>
          </div>

          {tab === 'summary' && (
            <div className="order-details-content">
              <div className="details-grid">
                {section('fa-user', 'Customer Information', [
                  ['fa-building', 'Business Name', data.retailer?.name],
                  ['fa-phone', 'Contact Number', data.retailer?.phone],
                  ['fa-map-marker-alt', 'Address', data.retailer?.address],
                ])}
                {section('fa-calendar-day', 'Delivery Information', [
                  ['fa-calendar-day', 'Delivery Date', o.deliveredAt ? fmtDate(o.deliveredAt) : trip ? fmtDate(trip.plannedDate) : ''],
                  ['fa-user-tie', 'Delivery Executive', trip?.deliveryPersonName],
                  ['fa-clock', 'Delivery Schedule', trip ? `${trip.etaMinutes} mins` : ''],
                  ['fa-clock', 'Trip Number', trip ? tripLink(trip.type) : ''],
                ])}
                {section('fa-clipboard-list', 'Order Information', [
                  ['fa-hashtag', 'Order Number', o.orderNo],
                  ['fa-info-circle', 'Order Status', <Badge key="s" meta={ORDER_STATUS[o.status]} />],
                  ['fa-money-bill-wave', 'Total Amount', money(o.orderValue)],
                ])}
                {section('fa-industry', 'Seller Information', [
                  ['fa-industry', 'Distributor', data.distributor.name],
                  ['fa-map-marker-alt', 'Pickup Address', data.distributor.address],
                  ['fa-user-tie', 'Sales Person', data.salesPerson.salesPersonName],
                  ['fa-phone', 'Mobile Number', data.salesPerson.salesPersonPhone],
                  ['fa-warehouse', 'CDS Store', data.store.name],
                ])}
              </div>
            </div>
          )}

          {tab === 'products' && (
            <div className="p-3">
              <div className="mat-card mat-elevation-z3">
                <div className="mat-card-content p-0">
                  <div className="table-responsive">
                    <table className="mat-mdc-table w-100">
                      <thead>
                        <tr className="mat-mdc-header-row small">
                          <th className="text-uppercase small text-start py-2 px-3"><i className="fas fa-box me-1 text-primary" />Product Name</th>
                          <th className="text-uppercase small text-center"><i className="fas fa-layer-group me-1 text-primary" />Quantity</th>
                          <th className="text-uppercase small text-center"><i className="fas fa-truck me-1 text-primary" />Delivered</th>
                          <th className="text-uppercase small text-center"><i className="fas fa-tag me-1 text-primary" />MRP</th>
                          <th className="text-uppercase small text-center"><i className="fas fa-calculator me-1 text-primary" />Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {o.lines.map((l) => (
                          <tr className="mat-mdc-row" key={l.sku}>
                            <td className="text-start py-2 px-3 small">{l.name}</td>
                            <td className="text-center small">{l.qty}</td>
                            <td className="text-center small">{l.deliveredQty}</td>
                            <td className="text-center small">{money(l.unitPrice)}</td>
                            <td className="text-center small">{money(l.qty * l.unitPrice)}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="mat-mdc-footer-row small bg-light">
                          <td className="fw-bold text-start py-2 px-3">Total:</td>
                          <td /><td /><td />
                          <td className="fw-bold text-center">{money(total)}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

        {showSidebar && (
          <div className="vehicle-search-sidebar">
            {searching && (
              <div className="vehicle-search-section">
                <h3><i className="fas fa-truck" /> Searching Vehicles</h3>
                <div className="searching-state">
                  <div className="spinner-border text-primary" role="status" />
                  <p className="progress-text">{progress}</p>
                </div>
              </div>
            )}
            {!searching && searchError && (
              <div className="vehicle-search-section">
                <h3><i className="fas fa-truck" /> Vehicle Search</h3>
                <div className="error-state"><i className="fas fa-exclamation-circle" /><p>{searchError}</p></div>
              </div>
            )}
            {!searching && providers.length > 0 && (
              <div className="vehicle-search-section">
                <h3><i className="fas fa-truck" /> Available Vehicles</h3>
                <div className="providers-list">
                  {live.map((p) => (
                    <div key={p.id} className={`provider-card${selected?.id === p.id ? ' selected' : ''}`} role="button" onClick={() => setSelected(p)}>
                      <div className="provider-header">
                        <span className="provider-name">{p.name}</span>
                        <span className="provider-expire-time"><i className="fas fa-clock" /> {left(p.expiresAt - now)}</span>
                      </div>
                      <div className="provider-details">
                        <div className="detail-row"><span className="detail-label">Category</span><span className="detail-value">{p.category}</span></div>
                        <div className="detail-row"><span className="detail-label">Price</span><span className="detail-value price">{money(p.price)}</span></div>
                        <div className="detail-row"><span className="detail-label">Est. Delivery</span><span className="detail-value eta">{p.etaHours} hrs</span></div>
                      </div>
                      {selected?.id === p.id && <div className="select-indicator"><i className="fas fa-check-circle" /> Selected </div>}
                    </div>
                  ))}
                  {live.length === 0 && <div className="error-state"><i className="fas fa-exclamation-circle" /><p>The quotes have expired. Please search again.</p></div>}
                </div>
              </div>
            )}
            {!searching && (
              <div className="confirm-actions">
                {selected ? (
                  <button className="btn btn-success d-flex align-items-center gap-2 w-100 justify-content-center" disabled={confirming} onClick={() => void confirmBooking()}>
                    {confirming ? <span className="spinner-border spinner-border-sm" /> : <i className="fas fa-check" />}
                    {confirming ? 'Confirming...' : 'Confirm Booking'}
                  </button>
                ) : (
                  <button className="btn btn-outline-secondary d-flex align-items-center gap-2 w-100 justify-content-center" disabled={confirming} onClick={cancelSearch}> Cancel Search </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
