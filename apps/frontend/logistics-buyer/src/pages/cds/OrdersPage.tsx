// Orders — Service Centre: all CDS Store Delivery orders across its stores. The CDS User has its own LBNP-style
// Orders screens (src/pages/cds/user).
import { useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router';
import { cdsApi, type OrderRow } from '../../api/services/cds.service';
import { ORDER_STATUS, TRIP_STATUS, TRIP_TYPE } from '../../cds/status';
import type { OrderStatus } from '../../cds/types';
import { askText, Badge, Card, DetailHead, DetailTabs, Empty, ErrorBox, FilterBar, fmtDate, fmtDateTime, InfoGrid, InfoSection, KpiStrip, kg, Loading, money, PageHead, Pager, RowActions, Table, useAction, useCdsSession, useLoad, useMeta, type FilterField } from './ui';

export default function OrdersPage() {
  const { sc } = useCdsSession();
  const navigate = useNavigate();
  const meta = useMeta();
  const [params] = useSearchParams();
  const [f, setF] = useState({ search: '', status: '' as OrderStatus | '', distributorId: '', cdsStoreId: '', fromDate: '', toDate: '', retailerId: params.get('retailer') ?? '' });
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
  const { busy, run } = useAction();
  const [tab, setTab] = useState<'summary' | 'items' | 'trips' | 'history'>('summary');
  const { data, error, loading, reload } = useLoad(() => cdsApi.order(id), [id]);
  if (error) return <div className="cds-page"><ErrorBox text={error} onRetry={reload} /></div>;
  if (loading && !data) return <div className="cds-page"><Loading /></div>;
  if (!data) return null;
  const o = data.order;
  /** Units picked at the distributor but not accepted at the CDS handover (no GRN — the handover count is final). */
  const pastHandover = !['CONFIRMED', 'PICKUP_PLANNED', 'PICKED_UP', 'IN_TRANSIT_TO_CDS', 'CANCELLED'].includes(o.status);
  const anyShort = pastHandover && o.lines.some((l) => l.pickedQty > l.acceptedQty);
  const cancel = async () => {
    const r = await askText(`Cancel ${o.orderNo}?`, 'Cancellation reason', 'Cancel order', true);
    if (r && (await run(() => cdsApi.cancelOrder(o.id, r), 'Order cancelled'))) reload();
  };
  const linked = data.collections.length > 0;
  return (
    <div className="cds-page">
      <DetailHead icon="fa-file-invoice" title="Order Details" back="/cds/orders" subtitle={<>Order #{o.orderNo} · {fmtDateTime(o.confirmedAt)} <Badge meta={ORDER_STATUS[o.status]} /></>}>
        {sc && o.status === 'CONFIRMED' && <button className="btn btn-outline-danger d-flex align-items-center text-nowrap" disabled={busy} onClick={() => void cancel()}><i className="fas fa-circle-xmark me-2" />Cancel Order</button>}
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
                ['fa-indian-rupee-sign', 'Collections', data.collections.map((c) => `${money(c.amount)} ${c.mode}`).join(', ')],
              ]} />
            )}
          </InfoGrid>
        )}
        {tab === 'items' && (
          <Table head={['Item', 'Ordered', 'Picked up', 'Accepted at CDS', ...(anyShort ? ['Short at handover'] : []), 'Delivered', 'Value']}>
            {o.lines.map((l) => (
              <tr key={l.sku} className="mat-mdc-row">
                <td className="small">{l.name}</td>
                <td className="fw-semibold">{l.qty}</td><td>{l.pickedQty}</td><td>{pastHandover ? l.acceptedQty : '—'}</td>
                {anyShort && <td className={l.pickedQty > l.acceptedQty ? 'text-danger fw-semibold' : ''}>{Math.max(0, l.pickedQty - l.acceptedQty)}</td>}
                <td>{l.deliveredQty}</td><td>{money(l.qty * l.unitPrice)}</td>
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
