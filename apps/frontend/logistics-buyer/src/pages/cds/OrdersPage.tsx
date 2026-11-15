// Orders — Service Centre: all CDS Store Delivery orders across its stores. CDS User: its store's orders, retailer-wise.
import { useMemo, useState, type ReactNode } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router';
import Swal from 'sweetalert2';
import { cdsApi, type OrderRow } from '../../api/services/cds.service';
import { ORDER_STATUS, TRIP_STATUS, TRIP_TYPE } from '../../cds/status';
import type { OrderStatus } from '../../cds/types';
import { RouteMapDialog } from './RouteMap';
import { askText, Badge, ModuleIntro, Card, DetailHead, DetailTabs, Empty, ErrorBox, FiltersDialog, fmtDate, fmtDateTime, InfoGrid, InfoSection, kg, Loading, money, Pager, RowActions, sumOf, Table, useAction, useCdsSession, useLoad, useMeta, type FilterField } from './ui';
import '../orders/OrdersPage.css';

/** Orders — same layout as the LBNP Orders screen: header, search + Filters, applied filters, KPI cards, table. */
export default function OrdersPage() {
  const { sc } = useCdsSession();
  const navigate = useNavigate();
  const meta = useMeta();
  const [params] = useSearchParams();
  const initiate = params.get('initiate') === '1';
  const [f, setF] = useState({ search: '', status: (initiate ? 'DELIVERED' : '') as OrderStatus | '', distributorId: '', cdsStoreId: '', state: '', city: '', fromDate: '', toDate: '', retailerId: params.get('retailer') ?? '' });
  const [grouped, setGrouped] = useState(!sc);
  const [pageNumber, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [showFilters, setShowFilters] = useState(false);
  const [mapOpen, setMapOpen] = useState(false);
  const { busy, run } = useAction();
  const set = (p: Partial<typeof f>) => { setF((x) => ({ ...x, ...p })); setPage(1); };
  const { data, error, loading, reload } = useLoad(
    () => cdsApi.searchOrders({ ...f, statuses: f.status ? [f.status] : [], pageNumber, pageSize: grouped ? 0 : pageSize }),
    [f, pageNumber, pageSize, grouped],
  );
  // All orders once: the KPI cards (orders still to plan) and the State / City lists.
  const all = useLoad(() => cdsApi.searchOrders({ pageSize: 0 }), []);
  const rows = data?.rows ?? [];
  const groups = useMemo(() => {
    const m = new Map<string, OrderRow[]>();
    rows.forEach((o) => m.set(o.retailerId, [...(m.get(o.retailerId) ?? []), o]));
    return Array.from(m.values());
  }, [rows]);
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
  const head = ['Order', 'Confirmed', ...(grouped ? [] : ['Retailer']), 'Distributor', ...(sc ? ['CDS store'] : []), 'Items', 'Value', 'Status', 'Actions'];
  const row = (o: OrderRow) => (
    <tr key={o.id} className="mat-mdc-row small" role="link" style={{ cursor: 'pointer' }} onClick={() => navigate(`/cds/orders/${o.id}`)}>
      <td className="fw-semibold text-primary">{o.orderNo}<div className="text-muted text-xs fw-normal" title="Seller Store order"><i className="fas fa-store me-1" />{o.sellerOrderRef}</div></td>
      <td className="small">{fmtDateTime(o.confirmedAt)}</td>
      {!grouped && <td className="small">{o.retailerName}<div className="text-muted text-xs">{o.locality}, {o.city}</div></td>}
      <td className="small">{o.distributorName}</td>
      {sc && <td className="small">{o.storeName}</td>}
      <td className="small" title={o.lines.map((l) => `${l.name} × ${l.qty}`).join('\n')}>{o.lines.length} item{o.lines.length === 1 ? '' : 's'}<div className="text-muted text-xs">{o.units} units · {kg(o.weightKg)}</div></td>
      <td className="small">{money(o.orderValue)}<div className="text-muted text-xs">{o.paymentMode}</div></td>
      <td><Badge meta={ORDER_STATUS[o.status]} /></td>
      <td>
        <RowActions
          onView={() => navigate(`/cds/orders/${o.id}`)}
          items={[
            { label: 'View details', icon: 'fa-eye', onClick: () => navigate(`/cds/orders/${o.id}`) },
            { label: 'Initiate return', icon: 'fa-rotate-left', hidden: sc || !['DELIVERED', 'PARTIALLY_DELIVERED'].includes(o.status), onClick: () => navigate(`/cds/orders/${o.id}`) },
            { label: 'Cancel order', icon: 'fa-circle-xmark', tone: 'danger', hidden: !sc || o.status !== 'CONFIRMED' || busy, onClick: () => void cancel(o) },
          ]}
        />
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
              <h1 className="fs-3 mb-0 fw-bold">Orders</h1><ModuleIntro text={sc ? "Orders that sellers sent for CDS store delivery, and their status until the retailer gets them." : "Orders for your CDS store, and their status until the retailer gets them."} />
            </div>
            <p className="text-muted small mb-0">{sc ? 'CDS Store Delivery orders confirmed in the Seller Store, across your CDS stores.' : 'Seller Store orders for your CDS store, retailer-wise.'}</p>
          </div>
          <div className="d-flex align-items-center gap-2">
            {sc
              ? <button className="btn btn-sm btn-primary d-flex align-items-center text-nowrap" onClick={() => navigate('/cds/planning/pickup/create')}><i className="fas fa-truck-ramp-box me-1 fs-6" /><span className="fs-6">Create Pickup Plan</span></button>
              : <button className="btn btn-sm btn-primary d-flex align-items-center text-nowrap" onClick={() => navigate('/cds/delivery-planning')}><i className="fas fa-truck me-1 fs-6" /><span className="fs-6">Delivery Planning</span></button>}
          </div>
        </div>

        {/* B. Search row */}
        <div className="d-flex align-items-center gap-2">
          <div className="form-check form-switch small mb-0 me-auto"><input id="grp" className="form-check-input" type="checkbox" checked={grouped} onChange={(e) => { setGrouped(e.target.checked); setPage(1); }} /><label htmlFor="grp" className="form-check-label">Retailer-wise</label></div>
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
        {kpi(sc ? 'No. of Retailers' : 'No. of Customers', retailersToPlan.length, 'fa-users', 'customers', sc ? 'Retailers whose orders wait for pickup' : 'Retailers to deliver to')}
        {kpi('Total Orders', toPlan.length, 'fa-chart-line', 'orders', sc ? 'Confirmed orders waiting for pickup' : 'Ready orders waiting for delivery')}
        {kpi('Total Weight', `${(Math.round(sumOf(toPlan, (o) => o.weightKg) * 10) / 10).toLocaleString('en-IN')} Kgs`, 'fa-weight-hanging', 'weight', sc ? 'Total load to pick up from sellers' : 'Total load to deliver')}
        {kpi('No. of Distributors', new Set(toPlan.map((o) => o.distributorId)).size, 'fa-industry', 'distributors', sc ? 'Sellers to pick up from' : 'Distributors of the ready orders')}
        {sc && kpi('No. of CDS Stores', new Set(toPlan.map((o) => o.cdsStoreId)).size, 'fa-warehouse', 'stores', 'CDS stores to deliver these orders to')}
      </div>

      {/* E. Table card */}
      <div className="p-3">
        <div className="mat-card mat-elevation-z3">
          {error && <ErrorBox text={error} onRetry={reload} />}
          {loading && !data ? <Loading text="Loading orders..." /> : (
            <>
              <Table head={head} empty={!rows.length && <Empty text="No orders found" />}>
                {grouped ? groups.flatMap((g) => [
                  <tr key={`h${g[0].retailerId}`} className="mat-mdc-row cds-retailer-row">
                    <td colSpan={head.length}><i className="fas fa-store me-2" />{g[0].retailerName}<span className="fw-normal text-muted ms-2">{g[0].retailerPhone} · {g[0].retailerAddress} · {g.length} order(s)</span></td>
                  </tr>,
                  ...g.map(row),
                ]) : rows.map(row)}
              </Table>
              {!grouped && data && <div className="d-flex justify-content-end p-1 bg-white"><Pager total={data.total} pageNumber={data.pageNumber} pageSize={pageSize} onPage={setPage} onPageSize={(n) => { setPageSize(n); setPage(1); }} /></div>}
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
          stops={retailersToPlan.map((o, i) => ({ seq: i + 1, name: o.retailerName, detail: `${o.locality}, ${o.city} · ${toPlan.filter((x) => x.retailerId === o.retailerId).length} order(s)`, lat: o.retailerLat, lng: o.retailerLng }))}
          onClose={() => setMapOpen(false)}
        />
      )}
    </div>
  );
}

export function OrderDetailsPage() {
  const { id = '' } = useParams();
  const { sc } = useCdsSession();
  const navigate = useNavigate();
  const meta = useMeta();
  const { busy, run } = useAction();
  const [tab, setTab] = useState<'summary' | 'items' | 'trips' | 'history'>('summary');
  const { data, error, loading, reload } = useLoad(() => cdsApi.order(id), [id]);
  if (error) return <div className="cds-page"><ErrorBox text={error} onRetry={reload} /></div>;
  if (loading && !data) return <div className="cds-page"><Loading /></div>;
  if (!data) return null;
  const o = data.order;
  const returnable = data.returnable.filter((r) => r.max > 0);
  const anyDamaged = o.lines.some((l) => l.damagedQty > 0);
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
  const linked = (data.returns.length > 0 || data.collections.length > 0 || !!data.grn);
  return (
    <div className="cds-page">
      <DetailHead icon="fa-file-invoice" title="Order Details" back="/cds/orders" subtitle={<>Order #{o.orderNo} · {fmtDateTime(o.confirmedAt)} <Badge meta={ORDER_STATUS[o.status]} /></>}>
        {sc && o.status === 'CONFIRMED' && <button className="btn btn-outline-danger d-flex align-items-center text-nowrap" disabled={busy} onClick={() => void cancel()}><i className="fas fa-circle-xmark me-2" />Cancel Order</button>}
        {!sc && ['DELIVERED', 'PARTIALLY_DELIVERED'].includes(o.status) && returnable.length > 0 && <button className="btn btn-primary d-flex align-items-center text-nowrap" disabled={busy} onClick={() => void initiate()}><i className="fas fa-rotate-left me-2" />Initiate Return</button>}
      </DetailHead>
      {o.note && <div className="cds-note warn mb-3"><i className="fas fa-circle-exclamation mt-1" />{o.note}</div>}
      <DetailTabs value={tab} onChange={setTab} tabs={[
        { id: 'summary', label: 'Order Summary', icon: 'fa-info-circle' },
        { id: 'items', label: 'Items', icon: 'fa-boxes-stacked', count: o.lines.length },
        { id: 'trips', label: 'Trips', icon: 'fa-route', count: data.trips.length },
        { id: 'history', label: 'Status History', icon: 'fa-clock-rotate-left' },
      ]}>
        {tab === 'summary' && (
          <InfoGrid>
            <InfoSection icon="fa-file-invoice" title="Order Information" rows={[
              ['fa-hashtag', 'Order Number', o.orderNo],
              ['fa-store', 'Source', 'Seller Store'],
              ['fa-receipt', 'Seller Order', o.sellerOrderRef],
              ['fa-circle-info', 'Order Status', <Badge key="s" meta={ORDER_STATUS[o.status]} />],
              ['fa-indian-rupee-sign', 'Order Value', `${money(o.orderValue)} · ${o.paymentMode}`],
              ['fa-weight-hanging', 'Weight', kg(o.weightKg)],
              ['fa-calendar-check', 'Delivered', o.deliveredAt ? fmtDateTime(o.deliveredAt) : ''],
            ]} />
            <InfoSection icon="fa-store" title="Retailer Information" rows={[
              ['fa-building', 'Business Name', data.retailer?.name],
              ['fa-phone', 'Contact Number', data.retailer?.phone],
              ['fa-location-dot', 'Address', data.retailer?.address],
            ]} />
            <InfoSection icon="fa-warehouse" title="Pickup & CDS" rows={[
              ['fa-industry', 'Distributor', data.distributor.name],
              ['fa-location-dot', 'Pickup Address', data.distributor.address],
              ['fa-warehouse', 'CDS Store', <span key="c">{data.store.name} <span className="cds-auto-tag" title="The retailer is inside this CDS store's service area"><i className="fas fa-location-crosshairs me-1" />Auto · service area</span></span>],
            ]} />
            {linked && (
              <InfoSection icon="fa-link" title="Linked Records" rows={[
                ['fa-clipboard-check', 'GRN', data.grn ? `${data.grn.grnNo} · ${data.grn.status === 'PENDING' ? 'Pending' : 'Generated'}` : ''],
                ['fa-rotate-left', 'Returns', data.returns.map((r) => r.returnNo).join(', ')],
                ['fa-indian-rupee-sign', 'Collections', data.collections.map((c) => `${money(c.amount)} ${c.mode}`).join(', ')],
              ]} />
            )}
          </InfoGrid>
        )}
        {tab === 'items' && (
          <Table head={['Item', 'Ordered', 'Picked up', 'At CDS', ...(anyDamaged ? ['Damaged'] : []), 'Delivered', 'Returned', 'Value']}>
            {o.lines.map((l) => (
              <tr key={l.sku} className="mat-mdc-row">
                <td className="small">{l.name}</td>
                <td className="fw-semibold">{l.qty}</td><td>{l.pickedQty}</td><td>{l.acceptedQty || l.receivedQty}</td>
                {anyDamaged && <td className={l.damagedQty ? 'text-danger' : ''}>{l.damagedQty}</td>}
                <td>{l.deliveredQty}</td><td>{l.returnedQty}</td><td>{money(l.qty * l.unitPrice)}</td>
              </tr>
            ))}
          </Table>
        )}
        {tab === 'trips' && (
          <Table head={['Trip', 'Type', 'Date', 'Status', 'Actions']} empty={!data.trips.length && <Empty icon="fa-route" text="Not on a trip yet" />}>
            {data.trips.map((t) => (
              <tr key={t.id} className="mat-mdc-row">
                <td className="fw-semibold text-primary">{t.tripNo}</td>
                <td className="small">{TRIP_TYPE[t.type].label}<div className="text-muted text-xs">{TRIP_TYPE[t.type].direction}</div></td><td className="small">{fmtDate(t.plannedDate)}</td><td><Badge meta={TRIP_STATUS[t.status]} /></td>
                <td><RowActions onView={() => navigate(`/cds/trips/${t.id}`)} /></td>
              </tr>
            ))}
          </Table>
        )}
        {tab === 'history' && (
          <ul className="cds-timeline">
            {[...o.history].reverse().map((h, k) => <li key={k}><div className="fw-semibold">{ORDER_STATUS[h.to as OrderStatus]?.label ?? h.to}</div><div className="when">{fmtDateTime(h.at)} · {h.by}</div>{h.note && <div className="text-muted">{h.note}</div>}</li>)}
          </ul>
        )}
      </DetailTabs>
    </div>
  );
}
