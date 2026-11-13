// Orders — Service Centre: all CDS Store Delivery orders across its stores. CDS User: its store's orders, retailer-wise.
import { useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router';
import Swal from 'sweetalert2';
import { cdsApi, type OrderRow } from '../../api/services/cds.service';
import { COLLECTION_STATUS, ORDER_STATUS, RETURN_STATUS, TRIP_STATUS, TRIP_TYPE } from '../../cds/status';
import type { OrderStatus } from '../../cds/types';
import { askText, Badge, Card, Empty, ErrorBox, fmtDate, fmtDateTime, KpiStrip, kg, Loading, money, PageHead, Pager, Table, useAction, useCdsSession, useLoad, useMeta } from './ui';

export default function OrdersPage() {
  const { sc } = useCdsSession();
  const navigate = useNavigate();
  const meta = useMeta();
  const [params] = useSearchParams();
  const initiate = params.get('initiate') === '1';
  const [f, setF] = useState({ search: '', status: (initiate ? 'DELIVERED' : '') as OrderStatus | '', distributorId: '', cdsStoreId: '', fromDate: '', toDate: '', retailerId: params.get('retailer') ?? '' });
  const [grouped, setGrouped] = useState(!sc);
  const [pageNumber, setPage] = useState(1);
  const set = (p: Partial<typeof f>) => { setF((x) => ({ ...x, ...p })); setPage(1); };
  const { data, error, loading, reload } = useLoad(
    () => cdsApi.searchOrders({ ...f, statuses: f.status ? [f.status] : [], pageNumber, pageSize: grouped ? 0 : 15 }),
    [f, pageNumber, grouped],
  );
  const rows = data?.rows ?? [];
  const groups = useMemo(() => {
    const m = new Map<string, OrderRow[]>();
    rows.forEach((o) => m.set(o.retailerId, [...(m.get(o.retailerId) ?? []), o]));
    return Array.from(m.values());
  }, [rows]);
  const head = ['Order', 'Confirmed', ...(grouped ? [] : ['Retailer']), 'Distributor', ...(sc ? ['CDS store'] : []), 'Items', 'Value', 'Status'];
  const row = (o: OrderRow) => (
    <tr key={o.id} className="mat-mdc-row" role="link" style={{ cursor: 'pointer' }} onClick={() => navigate(`/cds/orders/${o.id}`)}>
      <td className="fw-semibold text-primary">{o.orderNo}<div className="text-muted text-xs">{o.sellerOrderRef}</div></td>
      <td className="small">{fmtDateTime(o.confirmedAt)}</td>
      {!grouped && <td className="small">{o.retailerName}<div className="text-muted text-xs">{o.locality}</div></td>}
      <td className="small">{o.distributorName}</td>
      {sc && <td className="small">{o.storeName}</td>}
      <td className="small">{o.lines.map((l) => `${l.name} × ${l.qty}`).join(', ')}<div className="text-muted text-xs">{o.units} units · {kg(o.weightKg)}</div></td>
      <td className="small">{money(o.orderValue)}<div className="text-muted text-xs">{o.paymentMode}</div></td>
      <td><Badge meta={ORDER_STATUS[o.status]} /></td>
    </tr>
  );
  return (
    <div className="cds-page">
      <PageHead icon="fa-box" title="Orders" subtitle={sc ? 'CDS Store Delivery orders allocated from the Seller Store, across your CDS stores.' : 'Retailer-wise orders of your CDS store — from confirmation to delivery.'} />
      <KpiStrip />
      {initiate && <div className="cds-note mb-3"><i className="fas fa-rotate-left mt-1" />Open a delivered order and use <b className="mx-1">Initiate Return</b> to raise a retailer return.</div>}
      {f.retailerId && <div className="cds-note mb-3"><i className="fas fa-store mt-1" />Showing one retailer's orders. <button className="btn btn-link btn-sm p-0 ms-2" onClick={() => set({ retailerId: '' })}>Show all</button></div>}
      <div className="cds-filters">
        <input className="form-control form-control-sm search" placeholder="Search order, seller ref, retailer…" value={f.search} onChange={(e) => set({ search: e.target.value })} />
        <select aria-label="Status" className="form-select form-select-sm" value={f.status} onChange={(e) => set({ status: e.target.value as OrderStatus })}>
          <option value="">All statuses</option>{(Object.keys(ORDER_STATUS) as OrderStatus[]).map((s) => <option key={s} value={s}>{ORDER_STATUS[s].label}</option>)}
        </select>
        <select aria-label="Distributor" className="form-select form-select-sm" value={f.distributorId} onChange={(e) => set({ distributorId: e.target.value })}>
          <option value="">All distributors</option>{meta.data?.distributors.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
        {sc && (
          <select aria-label="CDS store" className="form-select form-select-sm" value={f.cdsStoreId} onChange={(e) => set({ cdsStoreId: e.target.value })}>
            <option value="">All CDS stores</option>{meta.data?.stores.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        )}
        <input type="date" aria-label="From date" className="form-control form-control-sm" value={f.fromDate} onChange={(e) => set({ fromDate: e.target.value })} />
        <input type="date" aria-label="To date" className="form-control form-control-sm" value={f.toDate} onChange={(e) => set({ toDate: e.target.value })} />
        <div className="form-check form-switch ms-auto small"><input id="grp" className="form-check-input" type="checkbox" checked={grouped} onChange={(e) => { setGrouped(e.target.checked); setPage(1); }} /><label htmlFor="grp" className="form-check-label">Retailer-wise</label></div>
      </div>
      <Card>
        {error && <ErrorBox text={error} onRetry={reload} />}
        {loading && !data ? <Loading /> : (
          <>
            <Table head={head} empty={!rows.length && <Empty text="No orders match the filters" />}>
              {grouped ? groups.flatMap((g) => [
                <tr key={`h${g[0].retailerId}`} className="mat-mdc-row cds-retailer-row">
                  <td colSpan={head.length}><i className="fas fa-store me-2" />{g[0].retailerName}<span className="fw-normal text-muted ms-2">{g[0].retailerPhone} · {g[0].retailerAddress} · {g.length} order(s)</span></td>
                </tr>,
                ...g.map(row),
              ]) : rows.map(row)}
            </Table>
            {!grouped && data && <Pager total={data.total} pageNumber={data.pageNumber} pageSize={data.pageSize} onPage={setPage} />}
          </>
        )}
      </Card>
    </div>
  );
}

export function OrderDetailsPage() {
  const { id = '' } = useParams();
  const { sc } = useCdsSession();
  const navigate = useNavigate();
  const meta = useMeta();
  const { busy, run } = useAction();
  const { data, error, loading, reload } = useLoad(() => cdsApi.order(id), [id]);
  if (error) return <div className="cds-page"><ErrorBox text={error} onRetry={reload} /></div>;
  if (loading && !data) return <div className="cds-page"><Loading /></div>;
  if (!data) return null;
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
  return (
    <div className="cds-page">
      <PageHead icon="fa-box" title={o.orderNo} crumb={{ label: 'Orders', to: '/cds/orders' }} subtitle={<>{data.retailer?.name} · <Badge meta={ORDER_STATUS[o.status]} /></>}>
        {sc && o.status === 'CONFIRMED' && <button className="btn btn-sm btn-outline-danger" disabled={busy} onClick={() => void cancel()}>Cancel Order</button>}
        {!sc && ['DELIVERED', 'PARTIALLY_DELIVERED'].includes(o.status) && returnable.length > 0 && <button className="btn btn-sm btn-outline-primary" disabled={busy} onClick={() => void initiate()}><i className="fas fa-rotate-left me-1" />Initiate Return</button>}
      </PageHead>
      {o.note && <div className="cds-note warn mb-3"><i className="fas fa-circle-exclamation mt-1" />{o.note}</div>}
      <div className="cds-grid-2">
        <div>
          <Card title={<><i className="fas fa-boxes-stacked text-primary me-2" />Items through the flow</>}>
            <Table head={['Item', 'Ordered', 'Picked up', 'Received at CDS', 'Accepted (GRN)', 'Damaged', 'Delivered', 'Returned', 'Value']}>
              {o.lines.map((l) => (
                <tr key={l.sku} className="mat-mdc-row">
                  <td className="small">{l.name}<div className="text-muted text-xs">{l.sku}</div></td>
                  <td className="fw-semibold">{l.qty}</td><td>{l.pickedQty}</td><td>{l.receivedQty}</td><td>{l.acceptedQty}</td>
                  <td className={l.damagedQty ? 'text-danger' : ''}>{l.damagedQty}</td><td>{l.deliveredQty}</td><td>{l.returnedQty}</td><td>{money(l.qty * l.unitPrice)}</td>
                </tr>
              ))}
            </Table>
          </Card>
          <Card title={<><i className="fas fa-route text-primary me-2" />Trips</>}>
            {!data.trips.length ? <div className="cds-empty py-3">Not on a trip yet</div> : (
              <Table head={['Trip', 'Type', 'Date', 'Status']}>
                {data.trips.map((t) => (
                  <tr key={t.id} className="mat-mdc-row">
                    <td><a role="button" className="text-primary fw-semibold" onClick={() => navigate(`/cds/trips/${t.id}`)}>{t.tripNo}</a></td>
                    <td className="small">{TRIP_TYPE[t.type].label}</td><td className="small">{fmtDate(t.plannedDate)}</td><td><Badge meta={TRIP_STATUS[t.status]} /></td>
                  </tr>
                ))}
              </Table>
            )}
          </Card>
          {(data.returns.length > 0 || data.collections.length > 0 || data.grn) && (
            <Card title={<><i className="fas fa-link text-primary me-2" />GRN, returns & collections</>}>
              <div className="p-3 small d-flex flex-column gap-2">
                {data.grn && <div>GRN {!sc ? <a role="button" className="text-primary" onClick={() => navigate(`/cds/grn/${data.grn!.id}`)}>{data.grn.grnNo}</a> : data.grn.grnNo} · {data.grn.status === 'PENDING' ? 'Pending verification' : `generated ${fmtDateTime(data.grn.completedAt)}`}</div>}
                {data.returns.map((r) => <div key={r.id}>{r.returnNo} · {r.lines.map((l) => `${l.name} × ${l.qty} (${l.reason})`).join(', ')} <Badge meta={RETURN_STATUS[r.status]} /></div>)}
                {data.collections.map((c) => <div key={c.id}>{c.collectionNo} · {money(c.amount)} {c.mode} by {c.deliveryPersonName} <Badge meta={COLLECTION_STATUS[c.status]} /></div>)}
              </div>
            </Card>
          )}
        </div>
        <div>
          <Card title={<><i className="fas fa-circle-info text-primary me-2" />Order</>}>
            <dl className="cds-dl">
              <dt>Seller order</dt><dd>{o.sellerOrderRef}</dd>
              <dt>Confirmed</dt><dd>{fmtDateTime(o.confirmedAt)}</dd>
              <dt>Distributor</dt><dd>{data.distributor.name}<div className="text-muted small">{data.distributor.address}</div></dd>
              <dt>CDS store</dt><dd>{data.store.name}</dd>
              <dt>Retailer</dt><dd>{data.retailer?.name}<div className="text-muted small">{data.retailer?.ownerName} · {data.retailer?.phone}</div></dd>
              <dt>Delivery address</dt><dd>{data.retailer?.address}</dd>
              <dt>Payment</dt><dd>{o.paymentMode} · {money(o.orderValue)}</dd>
              <dt>Weight</dt><dd>{kg(o.weightKg)}</dd>
              {o.deliveredAt && <><dt>Delivered</dt><dd>{fmtDateTime(o.deliveredAt)}</dd></>}
            </dl>
          </Card>
          <Card title={<><i className="fas fa-clock-rotate-left text-primary me-2" />Status history</>}>
            <ul className="cds-timeline">
              {[...o.history].reverse().map((h, k) => <li key={k}><div className="fw-semibold">{ORDER_STATUS[h.to as OrderStatus]?.label ?? h.to}</div><div className="when">{fmtDateTime(h.at)} · {h.by}</div>{h.note && <div className="text-muted">{h.note}</div>}</li>)}
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
