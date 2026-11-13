// Orders — Service Centre: all CDS Store Delivery orders across its stores. CDS User: its store's orders, retailer-wise.
import { useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router';
import Swal from 'sweetalert2';
import { cdsApi, type OrderRow } from '../../api/services/cds.service';
import { ORDER_STATUS, TRIP_STATUS, TRIP_TYPE } from '../../cds/status';
import type { OrderStatus } from '../../cds/types';
import { askText, Badge, Card, DetailHead, DetailTabs, Empty, ErrorBox, FilterBar, fmtDate, fmtDateTime, InfoGrid, InfoSection, KpiStrip, kg, Loading, money, PageHead, Pager, RowActions, Table, useAction, useCdsSession, useLoad, useMeta, type FilterField } from './ui';

export default function OrdersPage() {
  const { sc } = useCdsSession();
  const navigate = useNavigate();
  const meta = useMeta();
  const [params] = useSearchParams();
  const initiate = params.get('initiate') === '1';
  const [f, setF] = useState({ search: '', status: (initiate ? 'DELIVERED' : '') as OrderStatus | '', distributorId: '', cdsStoreId: '', fromDate: '', toDate: '', retailerId: params.get('retailer') ?? '' });
  const [grouped, setGrouped] = useState(!sc);
  const [pageNumber, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const { busy, run } = useAction();
  const set = (p: Partial<typeof f>) => { setF((x) => ({ ...x, ...p })); setPage(1); };
  const { data, error, loading, reload } = useLoad(
    () => cdsApi.searchOrders({ ...f, statuses: f.status ? [f.status] : [], pageNumber, pageSize: grouped ? 0 : pageSize }),
    [f, pageNumber, pageSize, grouped],
  );
  const rows = data?.rows ?? [];
  const groups = useMemo(() => {
    const m = new Map<string, OrderRow[]>();
    rows.forEach((o) => m.set(o.retailerId, [...(m.get(o.retailerId) ?? []), o]));
    return Array.from(m.values());
  }, [rows]);
  const fields: FilterField[] = [
    { key: 'fromDate', label: 'Order Start Date', type: 'date' },
    { key: 'toDate', label: 'Order End Date', type: 'date' },
    { key: 'status', label: 'Status', type: 'select', allLabel: 'All', options: (Object.keys(ORDER_STATUS) as OrderStatus[]).map((s) => ({ value: s, label: ORDER_STATUS[s].label })) },
    { key: 'distributorId', label: 'Distributor', type: 'select', allLabel: 'All', options: (meta.data?.distributors ?? []).map((d) => ({ value: d.id, label: d.name })) },
    ...(sc ? [{ key: 'cdsStoreId', label: 'CDS Store', type: 'select' as const, allLabel: 'All', options: (meta.data?.stores ?? []).map((d) => ({ value: d.id, label: d.name })) }] : []),
  ];
  const cancel = async (o: OrderRow) => {
    const r = await askText(`Cancel ${o.orderNo}?`, 'Cancellation reason', 'Cancel order', true);
    if (r && (await run(() => cdsApi.cancelOrder(o.id, r), 'Order cancelled'))) reload();
  };
  const head = ['Order', 'Confirmed', ...(grouped ? [] : ['Retailer']), 'Distributor', ...(sc ? ['CDS store'] : []), 'Items', 'Value', 'Status', 'Actions'];
  const row = (o: OrderRow) => (
    <tr key={o.id} className="mat-mdc-row" role="link" style={{ cursor: 'pointer' }} onClick={() => navigate(`/cds/orders/${o.id}`)}>
      <td className="fw-semibold text-primary">{o.orderNo}<div className="text-muted text-xs fw-normal" title="Seller Store order"><i className="fas fa-store me-1" />{o.sellerOrderRef}</div></td>
      <td className="small">{fmtDateTime(o.confirmedAt)}</td>
      {!grouped && <td className="small">{o.retailerName}<div className="text-muted text-xs">{o.locality}</div></td>}
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
  return (
    <div className="cds-page">
      <PageHead icon="fa-box" title="Orders" subtitle={sc ? 'CDS Store Delivery orders confirmed in the Seller Store, across your CDS stores.' : 'Seller Store orders for your CDS store, retailer-wise.'} />
      <KpiStrip />
      {initiate && <div className="cds-note mb-3"><i className="fas fa-rotate-left mt-1" />Open a delivered order and use <b className="mx-1">Initiate Return</b> to raise a retailer return.</div>}
      {f.retailerId && <div className="cds-note mb-3"><i className="fas fa-store mt-1" />Showing one retailer's orders. <button className="btn btn-link btn-sm p-0 ms-2" onClick={() => set({ retailerId: '' })}>Show all</button></div>}
      <FilterBar
        title="Order Filters"
        search={f.search}
        onSearch={(v) => set({ search: v })}
        placeholder="Search order, seller ref, retailer…"
        fields={fields}
        values={f}
        onApply={(v) => set({ fromDate: v.fromDate, toDate: v.toDate, status: v.status as OrderStatus | '', distributorId: v.distributorId, cdsStoreId: v.cdsStoreId ?? '' })}
      >
        <div className="form-check form-switch small mb-0"><input id="grp" className="form-check-input" type="checkbox" checked={grouped} onChange={(e) => { setGrouped(e.target.checked); setPage(1); }} /><label htmlFor="grp" className="form-check-label">Retailer-wise</label></div>
      </FilterBar>
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
            {!grouped && data && <Pager total={data.total} pageNumber={data.pageNumber} pageSize={pageSize} onPage={setPage} onPageSize={(n) => { setPageSize(n); setPage(1); }} />}
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
        { id: 'history', label: 'History', icon: 'fa-clock-rotate-left' },
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
