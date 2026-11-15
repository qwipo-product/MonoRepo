// CDS User modules: GRN, Delivery Planning, Collections & Payments, Returns, Retailers. Every call is limited to the
// user's own CDS store (checked again by the API).
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import Swal from 'sweetalert2';
import { cdsApi, type CollectionRow, type MyOtp, type OrderRow, type ReturnRow } from '../../api/services/cds.service';
import { COLLECTION_STATUS, GRN_STATUS, ORDER_STATUS, RETURN_STATUS, TRIP_STATUS, TRIP_TYPE } from '../../cds/status';
import type { CollectionStatus, ReturnStatus, TripType } from '../../cds/types';
import { RecentPlans } from './ScPlanningPages';
import { AssignFields, askText, Badge, Card, confirm, DateSlot, Empty, ErrorBox, FilterBar, fmtDate, fmtDateTime, KpiStrip, kg, Loading, money, PageHead, Pager, RowActions, sumOf, Table, Tabs, useAction, useLoad, useMeta, type Assign } from './ui';

/** OTPs sent to this CDS — the CDS User reads them out to the delivery person at the handover. */
function MyOtps({ purposes, title }: { purposes: string[]; title: string }) {
  const { data, reload } = useLoad(() => cdsApi.myOtps(), []);
  useEffect(() => {
    const t = window.setInterval(reload, 15000);
    return () => window.clearInterval(t);
  }, [reload]);
  const list = (data ?? []).filter((o: MyOtp) => purposes.includes(o.purpose));
  if (!list.length) return null;
  return (
    <Card title={<><i className="fas fa-key text-warning me-2" />{title}</>} extra={<small>Share only with the delivery person at the handover</small>}>
      <Table head={['Trip', 'Checkpoint', 'Delivery person', 'Vehicle', 'OTP', 'Valid until']}>
        {list.map((o) => (
          <tr key={o.id} className="mat-mdc-row">
            <td className="fw-semibold">{o.tripNo}</td><td className="small">{o.label}</td><td className="small">{o.deliveryPersonName}</td><td className="small">{o.vehicleRegNo}</td>
            <td><span className="fs-5 fw-bold font-monospace text-primary">{o.code}</span></td><td className="small">{fmtDateTime(o.expiresAt)}</td>
          </tr>
        ))}
      </Table>
    </Card>
  );
}

/** Service Centre trips arriving at / collecting from this store. */
function Incoming({ type, title }: { type: TripType; title: string }) {
  const navigate = useNavigate();
  const { data } = useLoad(() => cdsApi.incoming(type), [type]);
  const active = (data ?? []).filter((x) => x.stopStatus === 'PENDING' && !['CANCELLED'].includes(x.status));
  return (
    <Card title={<><i className={`fas ${TRIP_TYPE[type].icon} text-primary me-2`} />{title} <small className="ms-2">{TRIP_TYPE[type].label} · {TRIP_TYPE[type].direction}</small></>}>
      <Table head={['Trip', 'Planned', 'Delivery person', 'Vehicle', type === 'CDS_DELIVERY' ? 'Orders' : 'Returns', 'Units', 'Trip status']} empty={!active.length && <Empty icon="fa-check" text="Nothing on the way right now" />}>
        {active.map((x) => (
          <tr key={x.tripId} className="mat-mdc-row" role="link" style={{ cursor: 'pointer' }} onClick={() => navigate(`/cds/trips/${x.tripId}`)}>
            <td className="fw-semibold text-primary">{x.tripNo}</td><td className="small">{fmtDate(x.plannedDate)}</td>
            <td className="small">{x.deliveryPersonName}<div className="text-muted text-xs">{x.deliveryPersonPhone}</div></td><td className="small">{x.vehicleRegNo}</td>
            <td>{type === 'CDS_DELIVERY' ? x.orders : x.returns}</td><td>{x.units}</td><td><Badge meta={TRIP_STATUS[x.status]} /></td>
          </tr>
        ))}
      </Table>
    </Card>
  );
}

// ---------------------------------------------------------------- GRN

export function GrnPage() {
  const navigate = useNavigate();
  const meta = useMeta();
  const [tab, setTab] = useState<'PENDING' | 'COMPLETED'>('PENDING');
  const [distributorId, setDist] = useState('');
  const [search, setSearch] = useState('');
  const [pageNumber, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const pending = useLoad(() => cdsApi.searchGrns({ status: 'PENDING', pageSize: 1 }), []);
  const { data, error, loading, reload } = useLoad(() => cdsApi.searchGrns({ status: tab, distributorId, search, pageNumber, pageSize }), [tab, distributorId, search, pageNumber, pageSize]);
  return (
    <div className="cds-page">
      <PageHead info="Check the goods received at your CDS store, one GRN per distributor." icon="fa-clipboard-check" title="GRN (Goods Received Note)" subtitle="Verify the orders handed over at your CDS, distributor-wise." />

      <KpiStrip />
      <MyOtps purposes={['CDS_HANDOVER']} title="Handover OTPs for your CDS" />
      <Incoming type="CDS_DELIVERY" title="Incoming CDS deliveries" />
      <Tabs value={tab} onChange={(v) => { setTab(v); setPage(1); }} tabs={[{ id: 'PENDING', label: 'Pending verification', icon: 'fa-hourglass-half', count: pending.data?.total }, { id: 'COMPLETED', label: 'GRN history', icon: 'fa-list' }]} />
      <FilterBar
        title="GRN Filters"
        search={search}
        onSearch={(v) => { setSearch(v); setPage(1); }}
        placeholder="Search GRN, distributor, trip, order…"
        fields={[{ key: 'distributorId', label: 'Distributor', type: 'select', allLabel: 'All', options: (meta.data?.distributors ?? []).map((d) => ({ value: d.id, label: d.name })) }]}
        values={{ distributorId }}
        onApply={(v) => { setDist(v.distributorId); setPage(1); }}
      />
      <Card>
        {error && <ErrorBox text={error} onRetry={reload} />}
        {loading && !data ? <Loading /> : (
          <>
            <Table head={['GRN', 'Distributor', 'CDS delivery trip', 'Pickup trip', 'Orders', 'Dispatched', 'Received', 'Status', tab === 'PENDING' ? 'Handed over' : 'Generated', 'Actions']}
              empty={!data?.rows.length && <Empty icon={tab === 'PENDING' ? 'fa-check-double' : 'fa-inbox'} text={tab === 'PENDING' ? 'Nothing waiting for verification' : 'No GRNs yet'} />}>
              {data?.rows.map((g) => (
                <tr key={g.id} className={`mat-mdc-row${g.issues ? ' warn' : ''}`}>
                  <td className="fw-semibold">{g.grnNo}</td><td className="small">{g.distributorName}</td>
                  <td className="small">{g.cdsTripNo}</td><td className="small">{g.pickupTripNos.join(', ')}</td><td>{g.orderIds.length}</td><td>{g.dispatched}</td>
                  <td className={g.received < g.dispatched ? 'text-danger fw-bold' : ''}>{g.received}</td>
                  <td><Badge meta={GRN_STATUS[g.status]} /></td>
                  <td className="small">{fmtDateTime(tab === 'PENDING' ? g.createdAt : g.completedAt)}</td>
                  <td>
                    <div className="d-inline-flex align-items-center gap-1">
                      <RowActions onView={() => navigate(`/cds/grn/${g.id}`)} />
                      {g.status === 'PENDING' && <button className="btn btn-sm btn-success text-nowrap" onClick={() => navigate(`/cds/grn/${g.id}`)}>Verify</button>}
                    </div>
                  </td>
                </tr>
              ))}
            </Table>
            {data && <Pager total={data.total} pageNumber={data.pageNumber} pageSize={pageSize} onPage={setPage} onPageSize={(n) => { setPageSize(n); setPage(1); }} />}
          </>
        )}
      </Card>
    </div>
  );
}

export function GrnDetailsPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const { busy, run } = useAction();
  const { data, error, loading, reload } = useLoad(() => cdsApi.grn(id), [id]);
  const [lines, setLines] = useState<{ accepted: number; damaged: number; remarks: string }[]>([]);
  const [remarks, setRemarks] = useState('');
  useEffect(() => {
    if (data) setLines(data.grn.lines.map((l) => ({ accepted: l.acceptedQty ?? l.receivedQty, damaged: l.damagedQty ?? 0, remarks: l.remarks })));
  }, [data]);
  if (error) return <div className="cds-page"><ErrorBox text={error} onRetry={reload} /></div>;
  if (loading && !data) return <div className="cds-page"><Loading /></div>;
  if (!data) return null;
  const g = data.grn;
  const editable = g.status === 'PENDING';
  const set = (i: number, p: Partial<(typeof lines)[number]>) => setLines((ls) => ls.map((x, j) => {
    if (j !== i) return x;
    const n = { ...x, ...p };
    if (p.damaged !== undefined) n.accepted = Math.max(0, g.lines[i].receivedQty - p.damaged);
    return n;
  }));
  const bad = lines.some((x, i) => x.accepted + x.damaged !== g.lines[i].receivedQty || x.accepted < 0 || x.damaged < 0);
  const generate = async () => {
    if (!(await confirm(`Generate ${g.grnNo}?`, 'Accepted quantities become deliverable; damaged items go back to the distributor through Return Planning.', 'Generate GRN'))) return;
    if (await run(() => cdsApi.completeGrn(g.id, { lines: lines.map((x, i) => ({ idx: i, acceptedQty: x.accepted, damagedQty: x.damaged, remarks: x.remarks })), remarks }), 'GRN generated — orders ready for delivery')) reload();
  };
  return (
    <div className="cds-page">
      <PageHead icon="fa-clipboard-check" title={g.grnNo} crumb={{ label: 'GRN', to: '/cds/grn' }} subtitle={<>{data.distributor.name} → {data.store.name} · <Badge meta={GRN_STATUS[g.status]} /></>}>
        {editable && <button className="btn btn-sm btn-primary" disabled={busy || bad} onClick={() => void generate()}><i className="fas fa-check me-1" />Generate GRN</button>}
      </PageHead>
      <div className="cds-note mb-3"><i className="fas fa-link mt-1" /><div>
        CDS delivery trip <a role="button" className="text-primary" onClick={() => navigate(`/cds/trips/${data.cdsTrip.id}`)}>{data.cdsTrip.tripNo}</a> ({data.cdsTrip.deliveryPersonName}, {data.cdsTrip.vehicleRegNo}) · from pickup trip(s) {data.pickupTrips.map((t) => t.tripNo).join(', ')} · {data.orders.length} order(s)
      </div></div>
      <Card title={<><i className="fas fa-boxes-stacked text-primary me-2" />Verify received goods</>} extra={<small>Shortages and excess are taken from the OTP-verified handover count</small>}>
        <Table head={['Order', 'Item', 'Dispatched', 'Received', 'Short', 'Excess', 'Accepted', 'Damaged', 'Remarks']}>
          {g.lines.map((l, i) => {
            const x = lines[i] ?? { accepted: 0, damaged: 0, remarks: '' };
            const needRemark = !!(l.shortQty || l.excessQty || x.damaged);
            return (
              <tr key={i} className={`mat-mdc-row${l.shortQty || l.excessQty ? ' warn' : ''}`}>
                <td className="small fw-semibold">{l.orderNo}</td><td className="small">{l.name}</td><td>{l.dispatchedQty}</td><td className="fw-semibold">{l.receivedQty}</td>
                <td className={l.shortQty ? 'text-danger fw-bold' : ''}>{l.shortQty}</td><td className={l.excessQty ? 'text-warning fw-bold' : ''}>{l.excessQty}</td>
                <td>{editable ? <input type="number" min={0} className={`form-control form-control-sm cds-qty${x.accepted + x.damaged !== l.receivedQty ? ' is-invalid' : ''}`} aria-label={`Accepted ${l.name}`} value={x.accepted} onChange={(e) => set(i, { accepted: Math.floor(Number(e.target.value)) })} /> : l.acceptedQty}</td>
                <td>{editable ? <input type="number" min={0} className="form-control form-control-sm cds-qty" aria-label={`Damaged ${l.name}`} value={x.damaged} onChange={(e) => set(i, { damaged: Math.floor(Number(e.target.value)) })} /> : l.damagedQty}</td>
                <td style={{ minWidth: 200 }}>{editable ? <input className={`form-control form-control-sm${needRemark && !x.remarks.trim() ? ' is-invalid' : ''}`} placeholder={needRemark ? 'Remark required' : 'Remarks'} aria-label={`Remarks ${l.name}`} value={x.remarks} onChange={(e) => set(i, { remarks: e.target.value })} /> : l.remarks || '—'}</td>
              </tr>
            );
          })}
        </Table>
        <div className="p-3">
          <label className="form-label small fw-medium mb-1">GRN remarks</label>
          <textarea className="form-control form-control-sm" rows={2} disabled={!editable} value={editable ? remarks : g.remarks} onChange={(e) => setRemarks(e.target.value)} />
          {bad && editable && <div className="text-danger small mt-1">Accepted + damaged must equal the received quantity on every line.</div>}
        </div>
      </Card>
      <Card title={<><i className="fas fa-box text-primary me-2" />Orders in this GRN</>}>
        <Table head={['Order', 'Retailer', 'Status']}>
          {data.orders.map((o) => <tr key={o.id} className="mat-mdc-row"><td><a role="button" className="text-primary fw-semibold" onClick={() => navigate(`/cds/orders/${o.id}`)}>{o.orderNo}</a></td><td className="small">{o.retailerName}</td><td><Badge meta={ORDER_STATUS[o.status]} /></td></tr>)}
        </Table>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------- Delivery Planning (next day)

export function DeliveryPlanningPage() {
  const navigate = useNavigate();
  const meta = useMeta();
  const { busy, run } = useAction();
  const [selO, setSelO] = useState<Set<string>>(new Set());
  const [selR, setSelR] = useState<Set<string>>(new Set());
  const [date, setDate] = useState('');
  const [slot, setSlot] = useState('09:00 – 13:00');
  const [a, setA] = useState<Assign>({ vehicleId: '', deliveryPersonId: '' });
  const day = date || meta.data?.tomorrow || '';
  const orders = useLoad(() => cdsApi.searchOrders({ statuses: ['READY_FOR_DELIVERY'], pageSize: 0 }), []);
  const rets = useLoad(() => cdsApi.searchReturns({ statuses: ['RETURN_INITIATED'], unplanned: true, pageSize: 0 }), []);
  const byRetailer = useMemo(() => {
    const m = new Map<string, { name: string; locality: string; orders: OrderRow[]; returns: ReturnRow[] }>();
    (orders.data?.rows ?? []).forEach((o) => { const g = m.get(o.retailerId) ?? { name: o.retailerName, locality: o.locality, orders: [], returns: [] }; g.orders.push(o); m.set(o.retailerId, g); });
    (rets.data?.rows ?? []).forEach((r) => { const g = m.get(r.retailerId!) ?? { name: r.retailerName, locality: '', orders: [], returns: [] }; g.returns.push(r); m.set(r.retailerId!, g); });
    return Array.from(m.entries());
  }, [orders.data, rets.data]);
  const chosenO = (orders.data?.rows ?? []).filter((o) => selO.has(o.id));
  const chosenR = (rets.data?.rows ?? []).filter((r) => selR.has(r.id));
  const loadKg = sumOf(chosenO, (o) => sumOf(o.lines, (l) => (l.acceptedQty - l.deliveredQty) * l.unitWeightKg));
  const stops = new Set([...chosenO.map((o) => o.retailerId), ...chosenR.map((r) => r.retailerId)]).size;
  const tog = (set: React.Dispatch<React.SetStateAction<Set<string>>>, id: string) => set((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  const submit = async () => {
    const r = await run(() => cdsApi.createDeliveryPlan({ orderIds: chosenO.map((o) => o.id), returnIds: chosenR.map((x) => x.id), plannedDate: day, slot, ...a }), 'Delivery plan created — retailer trip generated');
    if (r) navigate(`/cds/trips/${r.trip.id}`);
  };
  return (
    <div className="cds-page">
      <PageHead info="Plan next-day deliveries from your CDS store to retailers." icon="fa-truck" title="Delivery Planning" subtitle="Next-day retailer delivery plans. Group ready orders (and returns to collect) by retailer, assign a delivery person and vehicle — the trip appears in Trips." />

      <div className="cds-grid-2">
        <Card title={<><i className="fas fa-store text-primary me-2" />Ready for delivery · retailer-wise</>} extra={<small>{(orders.data?.rows ?? []).length} order(s) · {(rets.data?.rows ?? []).length} return(s) to collect</small>}>
          {(orders.error || rets.error) && <ErrorBox text={orders.error || rets.error} onRetry={() => { orders.reload(); rets.reload(); }} />}
          {orders.loading && !orders.data ? <Loading /> : (
            <Table head={['', 'Order / return', 'Items', 'Value', 'Weight', 'Status']} empty={!byRetailer.length && <Empty icon="fa-check" text="Nothing waiting — orders become ready after GRN" />}>
              {byRetailer.flatMap(([rid, g]) => [
                <tr key={`h${rid}`} className="mat-mdc-row cds-retailer-row">
                  <td><input type="checkbox" className="form-check-input" aria-label={`Select all for ${g.name}`} checked={g.orders.every((o) => selO.has(o.id)) && g.returns.every((r) => selR.has(r.id))} onChange={() => {
                    const on = g.orders.every((o) => selO.has(o.id)) && g.returns.every((r) => selR.has(r.id));
                    setSelO((s) => { const n = new Set(s); g.orders.forEach((o) => (on ? n.delete(o.id) : n.add(o.id))); return n; });
                    setSelR((s) => { const n = new Set(s); g.returns.forEach((r) => (on ? n.delete(r.id) : n.add(r.id))); return n; });
                  }} /></td>
                  <td colSpan={5}><i className="fas fa-store me-2" />{g.name}<span className="fw-normal text-muted ms-2">{g.locality} · {g.orders.length} order(s){g.returns.length ? ` · ${g.returns.length} return(s) to collect` : ''}</span></td>
                </tr>,
                ...g.orders.map((o) => (
                  <tr key={o.id} className={`mat-mdc-row${selO.has(o.id) ? ' selected' : ''}`}>
                    <td><input type="checkbox" className="form-check-input" aria-label={`Select ${o.orderNo}`} checked={selO.has(o.id)} onChange={() => tog(setSelO, o.id)} /></td>
                    <td className="fw-semibold">{o.orderNo}<div className="text-muted text-xs">{o.paymentMode}</div></td>
                    <td className="small">{o.lines.filter((l) => l.acceptedQty - l.deliveredQty > 0).map((l) => `${l.name} × ${l.acceptedQty - l.deliveredQty}`).join(', ')}</td>
                    <td className="small">{money(o.orderValue)}</td><td className="small">{kg(sumOf(o.lines, (l) => (l.acceptedQty - l.deliveredQty) * l.unitWeightKg))}</td>
                    <td><Badge meta={ORDER_STATUS[o.status]} />{o.note && <div className="text-danger text-xs">{o.note}</div>}</td>
                  </tr>
                )),
                ...g.returns.map((r) => (
                  <tr key={r.id} className={`mat-mdc-row${selR.has(r.id) ? ' selected' : ''}`}>
                    <td><input type="checkbox" className="form-check-input" aria-label={`Select ${r.returnNo}`} checked={selR.has(r.id)} onChange={() => tog(setSelR, r.id)} /></td>
                    <td className="fw-semibold">{r.returnNo}<div className="text-muted text-xs">collect · {r.orderNo}</div></td>
                    <td className="small">{r.lines.map((l) => `${l.name} × ${l.qty} (${l.reason})`).join(', ')}</td><td /><td />
                    <td><Badge meta={RETURN_STATUS[r.status]} /></td>
                  </tr>
                )),
              ])}
            </Table>
          )}
        </Card>
        <Card title={<><i className="fas fa-calendar-check text-primary me-2" />Delivery plan</>}>
          <div className="p-3 d-flex flex-column gap-3 small">
            <div className="fw-semibold">{chosenO.length} order(s) · {chosenR.length} return(s) · {stops} retailer stop(s) · {kg(loadKg)}</div>
            <DateSlot date={day} slot={slot} min={meta.data?.settings.nextDayPlanning ? meta.data.tomorrow : meta.data?.today ?? ''} onDate={setDate} onSlot={setSlot} hint="Retailer deliveries are planned for the next day." />
            <AssignFields date={day} loadKg={loadKg} value={a} onChange={setA} />
            <div className="cds-note"><i className="fas fa-key mt-1" />OTPs: order pickup at your CDS (you ↔ delivery person), each retailer delivery and return collection (retailer ↔ delivery person), and return handover back at your CDS.</div>
            <button className="btn btn-primary" disabled={busy || (!chosenO.length && !chosenR.length) || !a.vehicleId || !a.deliveryPersonId} onClick={() => void submit()}><i className="fas fa-paper-plane me-2" />Create Plan &amp; Generate Trip</button>
          </div>
        </Card>
      </div>
      <RecentPlans kind="RETAILER_DELIVERY" title="Recent delivery plans" />
    </div>
  );
}

// ---------------------------------------------------------------- Collections & Payments (manual)

const COL_TABS: CollectionStatus[] = ['WITH_DELIVERY_PERSON', 'RECEIVED_BY_CDS', 'HANDED_TO_QWIPO', 'SETTLED'];
export function CollectionsPage() {
  const navigate = useNavigate();
  const meta = useMeta();
  const { busy, run } = useAction();
  const [tab, setTab] = useState<CollectionStatus>('WITH_DELIVERY_PERSON');
  const [search, setSearch] = useState('');
  const [sel, setSel] = useState<Set<string>>(new Set());
  const { data, error, loading, reload } = useLoad(() => cdsApi.searchCollections({ status: tab, search, pageSize: 0 }), [tab, search]);
  const counts = useLoad(() => Promise.all(COL_TABS.map((s) => cdsApi.searchCollections({ status: s, pageSize: 0 }))), [data]);
  const rows = data?.rows ?? [];
  const chosen = rows.filter((c) => sel.has(c.id));
  const total = (cs: CollectionRow[], f: (c: CollectionRow) => number) => money(sumOf(cs, f));
  const after = () => { setSel(new Set()); reload(); };
  const receive = async () => {
    const res = await Swal.fire({
      title: 'Receive cash from delivery person', width: 600,
      html: `<div class="text-start small">${chosen.map((c) => `<div class="d-flex gap-2 align-items-center mb-2"><span style="min-width:150px">${c.collectionNo} · ${c.deliveryPersonName}</span><span class="text-muted" style="min-width:90px">collected ₹${c.amount}</span><input id="rc-${c.id}" type="number" min="0" class="form-control form-control-sm" style="width:120px" value="${c.amount}" aria-label="Amount received"></div>`).join('')}
        <textarea id="rc-note" class="form-control form-control-sm mt-2" placeholder="Note (required if an amount differs)"></textarea></div>`,
      showCancelButton: true, confirmButtonText: 'Record receipt', confirmButtonColor: '#1e3a8a', reverseButtons: true,
      preConfirm: () => ({ items: chosen.map((c) => ({ id: c.id, amount: Number((document.getElementById(`rc-${c.id}`) as HTMLInputElement).value) })), note: (document.getElementById('rc-note') as HTMLTextAreaElement).value }),
    });
    if (res.isConfirmed && (await run(() => cdsApi.receiveCollections(res.value.items, res.value.note || undefined), 'Collection received at the CDS'))) after();
  };
  const handover = async () => {
    const ref = await askText(`Hand over ${total(chosen, (c) => c.cdsReceivedAmount ?? c.amount)} to Qwipo (SNP)`, 'Deposit slip / UTR reference', 'Record handover');
    if (ref && (await run(() => cdsApi.handToQwipo(chosen.map((c) => c.id), ref), 'Handed over to Qwipo (SNP)'))) after();
  };
  const settle = async () => {
    const ref = await askText('Record Qwipo (SNP) settlement', 'Settlement reference from Qwipo', 'Mark settled');
    if (ref && (await run(() => cdsApi.recordSettlement(chosen.map((c) => c.id), ref), 'Settlement recorded'))) after();
  };
  return (
    <div className="cds-page">
      <PageHead info="Cash and UPI collected from retailers, from the delivery person to Qwipo." icon="fa-indian-rupee-sign" title="Collections & Payments" subtitle="Delivery person → your CDS → Qwipo (SNP) → settled.">
        {tab === 'WITH_DELIVERY_PERSON' && <button className="btn btn-sm btn-primary d-flex align-items-center text-nowrap" disabled={busy || !chosen.length} onClick={() => void receive()}><i className="fas fa-hand-holding-dollar me-1" />Receive from Delivery Person</button>}
        {tab === 'RECEIVED_BY_CDS' && <button className="btn btn-sm btn-primary d-flex align-items-center text-nowrap" disabled={busy || !chosen.length} onClick={() => void handover()}><i className="fas fa-building-columns me-1" />Hand Over to Qwipo (SNP)</button>}
        {tab === 'HANDED_TO_QWIPO' && <button className="btn btn-sm btn-primary d-flex align-items-center text-nowrap" disabled={busy || !chosen.length} onClick={() => void settle()}><i className="fas fa-check-double me-1" />Record Settlement</button>}
      </PageHead>

      <div className="cds-note mb-3"><i className="fas fa-circle-info mt-1" /><div>Qwipo (SNP) settles manually with {meta.data?.settlementParties.join(', ')}. No payment gateway is used — record references for each step.</div></div>
      <Tabs value={tab} onChange={(v) => { setTab(v); setSel(new Set()); }} tabs={COL_TABS.map((s, i) => ({ id: s, label: COLLECTION_STATUS[s].label, count: counts.data?.[i].total }))} />
      <FilterBar search={search} onSearch={setSearch} placeholder="Search collection, order, retailer, delivery person…">
        {tab !== 'SETTLED' && <span className="text-muted">Selected {chosen.length} · {total(chosen, (c) => c.cdsReceivedAmount ?? c.amount)}</span>}
      </FilterBar>
      <Card>
        {error && <ErrorBox text={error} onRetry={reload} />}
        {loading && !data ? <Loading /> : (
          <Table head={[tab === 'SETTLED' ? '' : <input key="a" type="checkbox" className="form-check-input" aria-label="Select all" checked={!!rows.length && chosen.length === rows.length} onChange={() => setSel(chosen.length === rows.length ? new Set() : new Set(rows.map((c) => c.id)))} />, 'Collection', 'Collected', 'Order / retailer', 'Delivery person', 'Trip', 'Mode', 'Due', 'Collected', 'Received by CDS', 'References', 'Status', 'Actions']}
            empty={!rows.length && <Empty text="Nothing here" />}>
            {rows.map((c) => (
              <tr key={c.id} className={`mat-mdc-row${sel.has(c.id) ? ' selected' : ''}${c.mismatchNote ? ' warn' : ''}`}>
                <td>{tab !== 'SETTLED' && <input type="checkbox" className="form-check-input" aria-label={`Select ${c.collectionNo}`} checked={sel.has(c.id)} onChange={() => setSel((s) => { const n = new Set(s); if (n.has(c.id)) n.delete(c.id); else n.add(c.id); return n; })} />}</td>
                <td className="fw-semibold">{c.collectionNo}</td><td className="small">{fmtDateTime(c.collectedAt)}</td>
                <td className="small">{c.orderNo}<div className="text-muted text-xs">{c.retailerName}</div></td>
                <td className="small">{c.deliveryPersonName}</td><td className="small">{c.tripNo}</td><td className="small">{c.mode}</td>
                <td className="small">{money(c.expectedAmount)}</td><td className={`small${c.amount < c.expectedAmount ? ' text-danger fw-bold' : ''}`}>{money(c.amount)}</td>
                <td className="small">{c.cdsReceivedAmount !== null ? money(c.cdsReceivedAmount) : '—'}{c.mismatchNote && <div className="text-danger text-xs">{c.mismatchNote}</div>}</td>
                <td className="small">{c.qwipoHandoverRef ?? '—'}{c.settlementRef && <div className="text-muted text-xs">{c.settlementRef}</div>}</td>
                <td><Badge meta={COLLECTION_STATUS[c.status]} /></td>
                <td><RowActions onView={() => navigate(`/cds/orders/${c.orderId}`)} items={[{ label: 'View order', icon: 'fa-box', onClick: () => navigate(`/cds/orders/${c.orderId}`) }, { label: 'View trip', icon: 'fa-route', onClick: () => navigate(`/cds/trips/${c.tripId}`) }]} /></td>
              </tr>
            ))}
          </Table>
        )}
        {rows.length > 0 && <div className="p-2 small text-end text-muted">Total due {total(rows, (c) => c.expectedAmount)} · collected {total(rows, (c) => c.amount)}</div>}
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------- Returns

const RET_FILTER: Record<string, ReturnStatus[]> = {
  open: ['RETURN_INITIATED', 'PICKED_UP_FROM_RETAILER'], cds: ['RECEIVED_AT_CDS', 'RETURN_PLANNED'], back: ['PICKED_UP_FROM_CDS', 'DELIVERED_TO_SELLER', 'COMPLETED'], all: [],
};
export function ReturnsPage() {
  const navigate = useNavigate();
  const { busy, run } = useAction();
  const [tab, setTab] = useState<'open' | 'cds' | 'back' | 'all'>('open');
  const [search, setSearch] = useState('');
  const [pageNumber, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const { data, error, loading, reload } = useLoad(() => cdsApi.searchReturns({ statuses: RET_FILTER[tab], search, pageNumber, pageSize }), [tab, search, pageNumber, pageSize]);
  const cancel = async (r: ReturnRow) => {
    const reason = await askText(`Cancel ${r.returnNo}?`, 'Reason', 'Cancel return', true);
    if (reason && (await run(() => cdsApi.cancelReturn(r.id, reason), 'Return cancelled'))) reload();
  };
  return (
    <div className="cds-page">
      <PageHead info="Goods that retailers give back, from your CDS store to the distributor." icon="fa-rotate-left" title="Returns" subtitle="Track retailer returns: retailer → your CDS → distributor.">
        <button className="btn btn-sm btn-primary" onClick={() => navigate('/cds/orders?initiate=1')}><i className="fas fa-plus me-1" />Initiate Return</button>
      </PageHead>

      <MyOtps purposes={['CDS_RETURN_PICKUP', 'RETURN_HANDOVER_CDS', 'CDS_ORDER_PICKUP']} title="Pickup / handover OTPs for your CDS" />
      <Incoming type="CDS_RETURN" title="Service Centre return pickups from your CDS" />
      <Tabs value={tab} onChange={(v) => { setTab(v); setPage(1); }} tabs={[{ id: 'open', label: 'With retailer / on the way' }, { id: 'cds', label: 'At your CDS' }, { id: 'back', label: 'Back to seller' }, { id: 'all', label: 'All' }]} />
      <FilterBar search={search} onSearch={(v) => { setSearch(v); setPage(1); }} placeholder="Search return, order, retailer…" />
      <Card>
        {error && <ErrorBox text={error} onRetry={reload} />}
        {loading && !data ? <Loading /> : (
          <>
            <Table head={['Return', 'Order', 'Retailer', 'Distributor', 'Products · reason', 'Return Value', 'Requested', 'Picked', 'Accepted', 'Rejected', 'Status', 'Actions']} empty={!data?.rows.length && <Empty text="No returns" />}>
              {data?.rows.map((r) => (
                <tr key={r.id} className="mat-mdc-row">
                  <td className="fw-semibold">{r.returnNo}<div className="text-muted text-xs">{fmtDate(r.createdAt)}</div></td>
                  <td><a role="button" className="text-primary" onClick={() => navigate(`/cds/orders/${r.orderId}`)}>{r.orderNo}</a></td>
                  <td className="small">{r.retailerName}</td><td className="small">{r.distributorName}</td>
                  <td className="small">{r.lines.map((l) => <div key={l.sku}>{l.name} × {l.qty} <span className="text-muted">· {l.reason}</span></div>)}</td>
                  <td className="small">{money(sumOf(r.lines, (l) => l.qty * l.unitPrice))}</td>
                  <td>{sumOf(r.lines, (l) => l.qty)}</td><td>{sumOf(r.lines, (l) => l.pickedQty ?? 0)}</td><td>{sumOf(r.lines, (l) => l.acceptedQty ?? 0)}</td><td>{sumOf(r.lines, (l) => l.rejectedQty ?? 0)}</td>
                  <td><Badge meta={RETURN_STATUS[r.status]} /></td>
                  <td>
                    <RowActions
                      onView={() => navigate(`/cds/orders/${r.orderId}`)}
                      items={[
                        { label: 'View order', icon: 'fa-box', onClick: () => navigate(`/cds/orders/${r.orderId}`) },
                        { label: 'Cancel return', icon: 'fa-circle-xmark', tone: 'danger', hidden: busy || r.status !== 'RETURN_INITIATED' || !!r.retailerTripId, onClick: () => void cancel(r) },
                      ]}
                    />
                  </td>
                </tr>
              ))}
            </Table>
            {data && <Pager total={data.total} pageNumber={data.pageNumber} pageSize={pageSize} onPage={setPage} onPageSize={(n) => { setPageSize(n); setPage(1); }} />}
          </>
        )}
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------- Retailers

export function RetailersPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const { data, error, loading, reload } = useLoad(() => cdsApi.retailers(), []);
  const rows = (data ?? []).filter((r) => !search || `${r.name} ${r.ownerName} ${r.phone} ${r.locality}`.toLowerCase().includes(search.toLowerCase()));
  return (
    <div className="cds-page">
      <PageHead info="Retailers in your CDS store area, with their orders, returns and payments." icon="fa-users" title="Retailers" subtitle="Retailers served by your CDS, with their orders, returns and collections." />

      <FilterBar search={search} onSearch={setSearch} placeholder="Search retailer, owner, phone, locality…"><span className="text-muted">{rows.length} retailer(s)</span></FilterBar>
      <Card>
        {error && <ErrorBox text={error} onRetry={reload} />}
        {loading && !data ? <Loading /> : (
          <Table head={['Retailer', 'Owner · phone', 'Address', 'Orders', 'Open', 'Delivered value', 'Returns', 'Collected', 'Last order', 'Actions']} empty={!rows.length && <Empty text="No retailers" />}>
            {rows.map((r) => (
              <tr key={r.id} className="mat-mdc-row" role="link" style={{ cursor: r.orders ? 'pointer' : 'default' }} onClick={() => r.orders && navigate(`/cds/orders?retailer=${r.id}`)}>
                <td className="fw-semibold">{r.name}<div className="text-muted text-xs">{r.code}</div></td>
                <td className="small">{r.ownerName}<div className="text-muted text-xs">{r.phone}</div></td>
                <td className="small">{r.address}<div className="text-muted text-xs">{r.locality}</div></td>
                <td>{r.orders}</td><td>{r.openOrders}</td><td className="small">{money(r.deliveredValue)}</td><td>{r.returns}</td><td className="small">{money(r.collected)}</td>
                <td className="small">{fmtDate(r.lastOrder)}</td>
                <td>{r.orders > 0 && <RowActions onView={() => navigate(`/cds/orders?retailer=${r.id}`)} items={[{ label: 'View orders', icon: 'fa-box', onClick: () => navigate(`/cds/orders?retailer=${r.id}`) }]} />}</td>
              </tr>
            ))}
          </Table>
        )}
      </Card>
    </div>
  );
}
