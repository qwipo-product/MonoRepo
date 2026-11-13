// CDS Service Centre planning: Pickup Planning (distributors → CDS stores), Deliver to CDS, Return Planning
// (CDS stores → distributors). Each plan generates its trips (see Trips).
import { useMemo, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router';
import { cdsApi, type OrderRow, type PlanRow, type ReturnRow } from '../../api/services/cds.service';
import { RETURN_STATUS, TRIP_STATUS, TRIP_TYPE } from '../../cds/status';
import type { Plan } from '../../cds/types';
import { AssignFields, Badge, Card, DateSlot, Empty, ErrorBox, fmtDate, fmtDateTime, kg, Loading, PageHead, sumOf, Table, useAction, useLoad, useMeta, type Assign } from './ui';

/** Recently created plans with the trips they generated. */
export function RecentPlans({ kind, title }: { kind: Plan['kind']; title: string }) {
  const navigate = useNavigate();
  const { data, error, loading, reload } = useLoad(() => cdsApi.plans(kind), [kind]);
  return (
    <Card title={<><i className="fas fa-clipboard-list text-primary me-2" />{title}</>}>
      {error && <ErrorBox text={error} onRetry={reload} />}
      {loading && !data ? <Loading /> : (
        <Table head={['Plan', 'Planned date', 'Created', 'Orders / returns', 'Generated trips']} empty={!data?.length && <Empty text="No plans yet" />}>
          {data?.slice(0, 12).map((p: PlanRow) => (
            <tr key={p.id} className="mat-mdc-row">
              <td className="fw-semibold">{p.planNo}</td>
              <td className="small">{fmtDate(p.plannedDate)}</td>
              <td className="small">{fmtDateTime(p.createdAt)}<div className="text-muted text-xs">{p.createdBy}</div></td>
              <td className="small">{p.orderIds.length ? `${p.orderIds.length} order(s)` : ''}{p.returnIds.length ? ` ${p.returnIds.length} return(s)` : ''}</td>
              <td className="small">{p.trips.map((t) => (
                <div key={t.id}><a role="button" className="text-primary fw-semibold" onClick={() => navigate(`/cds/trips/${t.id}`)}>{t.tripNo}</a> · {TRIP_TYPE[t.type].label} · {t.deliveryPersonName} <Badge meta={TRIP_STATUS[t.status]} /></div>
              ))}</td>
            </tr>
          ))}
        </Table>
      )}
    </Card>
  );
}

function PlanPanel({ title, children, summary, submit, disabled, busy, onSubmit }: { title: string; children: ReactNode; summary: ReactNode; submit: string; disabled: boolean; busy: boolean; onSubmit: () => void }) {
  return (
    <Card title={<><i className="fas fa-calendar-check text-primary me-2" />{title}</>}>
      <div className="p-3 d-flex flex-column gap-3 small">
        {summary}
        {children}
        <div className="cds-note"><i className="fas fa-mobile-screen mt-1" />Trips are sent to the delivery person's Delivery Partner App. Every pickup and handover is confirmed with an OTP.</div>
        <button className="btn btn-primary" disabled={disabled || busy} onClick={onSubmit}>{busy ? <span className="spinner-border spinner-border-sm me-2" /> : <i className="fas fa-paper-plane me-2" />}{submit}</button>
      </div>
    </Card>
  );
}

// ---------------------------------------------------------------- Pickup Planning

export function PickupPlanningPage() {
  const navigate = useNavigate();
  const meta = useMeta();
  const { busy, run } = useAction();
  const [distributorId, setDist] = useState('');
  const [sel, setSel] = useState<Record<string, string>>({}); // orderId → destination CDS
  const [date, setDate] = useState('');
  const [slot, setSlot] = useState('08:00 – 12:00');
  const [pickup, setPickup] = useState<Assign>({ vehicleId: '', deliveryPersonId: '' });
  const [withCds, setWithCds] = useState(true);
  const [same, setSame] = useState(true);
  const [leg, setLeg] = useState<Assign>({ vehicleId: '', deliveryPersonId: '' });
  const day = date || meta.data?.today || '';
  const { data, error, loading, reload } = useLoad(() => cdsApi.searchOrders({ statuses: ['CONFIRMED'], distributorId, pageSize: 0 }), [distributorId]);
  const rows = data?.rows ?? [];
  const groups = useMemo(() => {
    const m = new Map<string, OrderRow[]>();
    rows.forEach((o) => m.set(o.distributorId, [...(m.get(o.distributorId) ?? []), o]));
    return Array.from(m.values());
  }, [rows]);
  const chosen = rows.filter((o) => sel[o.id] !== undefined);
  const loadKg = sumOf(chosen, (o) => o.weightKg);
  const toggle = (o: OrderRow) => setSel((s) => { const n = { ...s }; if (n[o.id] !== undefined) delete n[o.id]; else n[o.id] = o.cdsStoreId; return n; });
  const submit = async () => {
    const r = await run(() => cdsApi.createPickupPlan({
      orders: chosen.map((o) => ({ orderId: o.id, cdsStoreId: sel[o.id] })), plannedDate: day, slot, pickup,
      cdsDelivery: withCds ? (same ? pickup : leg) : null,
    }), 'Pickup plan created — trips sent to the Delivery Partner App');
    if (r) {
      setSel({});
      reload();
      navigate(`/cds/trips/${r.pickupTrip.id}`);
    }
  };
  return (
    <div className="cds-page">
      <PageHead icon="fa-truck-ramp-box" title="Pickup Planning" subtitle="Plan pickups from one or more distributors. Each order goes to its destination CDS store; the plan generates a Distributor Pickup Trip and a CDS Delivery Trip." />
      <div className="cds-grid-2">
        <Card title={<><i className="fas fa-box text-primary me-2" />Confirmed orders · distributor-wise</>} extra={
          <div className="cds-filters mb-0">
            <select aria-label="Distributor" className="form-select form-select-sm" value={distributorId} onChange={(e) => setDist(e.target.value)}>
              <option value="">All distributors</option>{meta.data?.distributors.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
            <button className="btn btn-sm btn-link" onClick={() => setSel(chosen.length === rows.length ? {} : Object.fromEntries(rows.map((o) => [o.id, sel[o.id] ?? o.cdsStoreId])))}>{chosen.length === rows.length && rows.length ? 'Clear all' : 'Select all'}</button>
          </div>
        }>
          {error && <ErrorBox text={error} onRetry={reload} />}
          {loading && !data ? <Loading /> : (
            <Table head={['', 'Order', 'Retailer', 'Items', 'Weight', 'Destination CDS']} empty={!rows.length && <Empty icon="fa-check" text="No confirmed orders waiting for pickup planning" />}>
              {groups.flatMap((g) => [
                <tr key={`h${g[0].distributorId}`} className="mat-mdc-row cds-retailer-row">
                  <td><input type="checkbox" className="form-check-input" aria-label={`Select all orders of ${g[0].distributorName}`} checked={g.every((o) => sel[o.id] !== undefined)} onChange={() => setSel((s) => { const n = { ...s }; const on = g.every((o) => n[o.id] !== undefined); g.forEach((o) => (on ? delete n[o.id] : (n[o.id] = n[o.id] ?? o.cdsStoreId))); return n; })} /></td>
                  <td colSpan={5}><i className="fas fa-industry me-2" />{g[0].distributorName}<span className="fw-normal text-muted ms-2">{g.length} order(s) · {kg(sumOf(g, (o) => o.weightKg))}</span></td>
                </tr>,
                ...g.map((o) => (
                  <tr key={o.id} className={`mat-mdc-row${sel[o.id] !== undefined ? ' selected' : ''}`}>
                    <td><input type="checkbox" className="form-check-input" aria-label={`Select ${o.orderNo}`} checked={sel[o.id] !== undefined} onChange={() => toggle(o)} /></td>
                    <td className="fw-semibold">{o.orderNo}<div className="text-muted text-xs">{fmtDateTime(o.confirmedAt)}</div></td>
                    <td className="small">{o.retailerName}<div className="text-muted text-xs">{o.locality}</div></td>
                    <td className="small">{o.lines.map((l) => `${l.name} × ${l.qty}`).join(', ')}</td>
                    <td className="small">{kg(o.weightKg)}</td>
                    <td>
                      <select aria-label={`Destination CDS for ${o.orderNo}`} className="form-select form-select-sm" style={{ minWidth: 150 }} value={sel[o.id] ?? o.cdsStoreId} disabled={sel[o.id] === undefined} onChange={(e) => setSel((s) => ({ ...s, [o.id]: e.target.value }))}>
                        {meta.data?.stores.filter((x) => x.active).map((x) => <option key={x.id} value={x.id}>{x.name}{x.id === o.cdsStoreId ? ' (serves retailer)' : ''}</option>)}
                      </select>
                    </td>
                  </tr>
                )),
              ])}
            </Table>
          )}
        </Card>
        <PlanPanel
          title="Pickup plan" submit="Create Plan & Generate Trips" busy={busy} disabled={!chosen.length || !pickup.vehicleId || !pickup.deliveryPersonId || (withCds && !same && (!leg.vehicleId || !leg.deliveryPersonId))} onSubmit={() => void submit()}
          summary={<div><div className="fw-semibold">{chosen.length} order(s) · {new Set(chosen.map((o) => o.distributorId)).size} distributor pickup(s) · {new Set(chosen.map((o) => sel[o.id])).size} CDS store(s) · {kg(loadKg)}</div></div>}
        >
          <DateSlot date={day} slot={slot} min={meta.data?.today ?? ''} onDate={setDate} onSlot={setSlot} />
          <AssignFields label="Distributor Pickup Trip" date={day} loadKg={loadKg} value={pickup} onChange={setPickup} />
          <div className="form-check"><input id="withcds" className="form-check-input" type="checkbox" checked={withCds} onChange={(e) => setWithCds(e.target.checked)} /><label htmlFor="withcds" className="form-check-label fw-semibold">Also generate the CDS Delivery Trip</label></div>
          {withCds && (
            <>
              <div className="form-check"><input id="same" className="form-check-input" type="checkbox" checked={same} onChange={(e) => setSame(e.target.checked)} /><label htmlFor="same" className="form-check-label">Same vehicle and delivery person (collect, then deliver to the CDS stores)</label></div>
              {!same && <AssignFields label="CDS Delivery Trip" date={day} loadKg={loadKg} value={leg} onChange={setLeg} allowBusy={pickup} />}
            </>
          )}
          {!withCds && <div className="text-muted">Collected orders will wait in Deliver to CDS.</div>}
        </PlanPanel>
      </div>
      <RecentPlans kind="PICKUP" title="Recent pickup plans" />
    </div>
  );
}

// ---------------------------------------------------------------- Deliver to CDS

export function DeliverToCdsPage() {
  const navigate = useNavigate();
  const meta = useMeta();
  const { busy, run } = useAction();
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [date, setDate] = useState('');
  const [slot, setSlot] = useState('12:00 – 17:00');
  const [a, setA] = useState<Assign>({ vehicleId: '', deliveryPersonId: '' });
  const day = date || meta.data?.today || '';
  const overview = useLoad(() => cdsApi.deliverOverview(), []);
  const picked = useLoad(() => cdsApi.searchOrders({ statuses: ['PICKED_UP'], noActiveCdsTrip: true, pageSize: 0 }), []);
  const rows = picked.data?.rows ?? [];
  const chosen = rows.filter((o) => sel.has(o.id));
  const loadKg = sumOf(chosen, (o) => sumOf(o.lines, (l) => l.pickedQty * l.unitWeightKg));
  const submit = async () => {
    const r = await run(() => cdsApi.createCdsDeliveryPlan({ orderIds: chosen.map((o) => o.id), plannedDate: day, slot, ...a }), 'CDS Delivery Trip generated');
    if (r) navigate(`/cds/trips/${r.trip.id}`);
  };
  return (
    <div className="cds-page">
      <PageHead icon="fa-warehouse" title="Deliver to CDS" subtitle="Collected orders on their way to each CDS store — dispatched vs received, confirmed by OTP at every CDS handover." />
      {overview.error && <ErrorBox text={overview.error} onRetry={overview.reload} />}
      <div className="row g-3 mb-1">
        {overview.data?.map(({ store, trips, awaiting }) => (
          <div key={store.id} className="col-lg-4">
            <Card title={<><i className="fas fa-warehouse text-primary me-2" />{store.name}</>} extra={<small>{awaiting} order(s) on the way</small>}>
              {!trips.length ? <div className="cds-empty py-3">No CDS delivery trips yet</div> : (
                <Table head={['Trip', 'Date', 'Orders', 'Dispatched', 'Received', 'Handover']}>
                  {trips.slice(0, 5).map((t) => (
                    <tr key={t.tripId} className="mat-mdc-row">
                      <td><a role="button" className="text-primary fw-semibold" onClick={() => navigate(`/cds/trips/${t.tripId}`)}>{t.tripNo}</a></td>
                      <td className="small">{fmtDate(t.plannedDate)}</td><td>{t.orders}</td><td>{t.dispatched}</td>
                      <td className={t.stopStatus !== 'PENDING' && t.received < t.dispatched ? 'text-danger fw-bold' : ''}>{t.stopStatus === 'PENDING' ? '—' : t.received}</td>
                      <td>{t.verifiedAt ? <span className="cds-badge green"><i className="fas fa-shield-halved me-1" />OTP verified</span> : <Badge meta={TRIP_STATUS[t.tripStatus]} />}</td>
                    </tr>
                  ))}
                </Table>
              )}
            </Card>
          </div>
        ))}
      </div>
      <div className="cds-grid-2">
        <Card title={<><i className="fas fa-dolly text-primary me-2" />Picked up · not on a CDS Delivery Trip</>}>
          {picked.loading && !picked.data ? <Loading /> : (
            <Table head={['', 'Order', 'Distributor', 'Destination CDS', 'Picked items', 'Weight']} empty={!rows.length && <Empty icon="fa-check" text="Every collected order is on a CDS Delivery Trip" />}>
              {rows.map((o) => (
                <tr key={o.id} className={`mat-mdc-row${sel.has(o.id) ? ' selected' : ''}`}>
                  <td><input type="checkbox" className="form-check-input" aria-label={`Select ${o.orderNo}`} checked={sel.has(o.id)} onChange={() => setSel((s) => { const n = new Set(s); if (n.has(o.id)) n.delete(o.id); else n.add(o.id); return n; })} /></td>
                  <td className="fw-semibold">{o.orderNo}</td><td className="small">{o.distributorName}</td><td className="small">{o.storeName}</td>
                  <td className="small">{o.lines.map((l) => `${l.name} × ${l.pickedQty}`).join(', ')}</td>
                  <td className="small">{kg(sumOf(o.lines, (l) => l.pickedQty * l.unitWeightKg))}</td>
                </tr>
              ))}
            </Table>
          )}
        </Card>
        <PlanPanel title="CDS Delivery Trip" submit="Generate CDS Delivery Trip" busy={busy} disabled={!chosen.length || !a.vehicleId || !a.deliveryPersonId} onSubmit={() => void submit()}
          summary={<div className="fw-semibold">{chosen.length} order(s) · {new Set(chosen.map((o) => o.cdsStoreId)).size} CDS store(s) · {kg(loadKg)}</div>}>
          <DateSlot date={day} slot={slot} min={meta.data?.today ?? ''} onDate={setDate} onSlot={setSlot} />
          <AssignFields date={day} loadKg={loadKg} value={a} onChange={setA} />
        </PlanPanel>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- Return Planning

export function ReturnPlanningPage() {
  const navigate = useNavigate();
  const meta = useMeta();
  const { busy, run } = useAction();
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [date, setDate] = useState('');
  const [slot, setSlot] = useState('09:00 – 13:00');
  const [a, setA] = useState<Assign>({ vehicleId: '', deliveryPersonId: '' });
  const [storeFilter, setStoreFilter] = useState('');
  const day = date || meta.data?.tomorrow || '';
  const { data, error, loading, reload } = useLoad(() => cdsApi.searchReturns({ statuses: ['RECEIVED_AT_CDS'], unplanned: true, cdsStoreId: storeFilter || undefined, pageSize: 0 }), [storeFilter]);
  const all = useLoad(() => cdsApi.searchReturns({ statuses: ['RETURN_PLANNED', 'PICKED_UP_FROM_CDS', 'DELIVERED_TO_SELLER'], pageSize: 0 }), []);
  const rows = (data?.rows ?? []).filter((r) => r.accepted > 0);
  const groups = useMemo(() => {
    const m = new Map<string, ReturnRow[]>();
    rows.forEach((r) => m.set(r.distributorId, [...(m.get(r.distributorId) ?? []), r]));
    return Array.from(m.values());
  }, [rows]);
  const chosen = rows.filter((r) => sel.has(r.id));
  const loadKg = sumOf(chosen, (r) => r.weightKg);
  const submit = async () => {
    const r = await run(() => cdsApi.createReturnPlan({ returnIds: chosen.map((x) => x.id), plannedDate: day, slot, ...a }), 'Return plan created — CDS Return Trip generated');
    if (r) navigate(`/cds/trips/${r.trip.id}`);
  };
  return (
    <div className="cds-page">
      <PageHead icon="fa-rotate-left" title="Return Planning" subtitle="Next-day return plans: collect accepted returns from the CDS stores and hand them back to their distributors / sellers." />
      <div className="cds-grid-2">
        <Card title={<><i className="fas fa-box-open text-primary me-2" />Returns received at CDS · distributor-wise</>} extra={
          <select aria-label="CDS store" className="form-select form-select-sm" style={{ maxWidth: 200 }} value={storeFilter} onChange={(e) => setStoreFilter(e.target.value)}>
            <option value="">All CDS stores</option>{meta.data?.stores.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
          </select>
        }>
          {error && <ErrorBox text={error} onRetry={reload} />}
          {loading && !data ? <Loading /> : (
            <Table head={['', 'Return', 'CDS store', 'Retailer / source', 'Items (accepted)', 'Reason', 'Weight']} empty={!rows.length && <Empty icon="fa-check" text="No returns waiting at the CDS stores" />}>
              {groups.flatMap((g) => [
                <tr key={`h${g[0].distributorId}`} className="mat-mdc-row cds-retailer-row">
                  <td><input type="checkbox" className="form-check-input" aria-label={`Select all returns for ${g[0].distributorName}`} checked={g.every((r) => sel.has(r.id))} onChange={() => setSel((s) => { const n = new Set(s); const on = g.every((r) => n.has(r.id)); g.forEach((r) => (on ? n.delete(r.id) : n.add(r.id))); return n; })} /></td>
                  <td colSpan={6}><i className="fas fa-industry me-2" />{g[0].distributorName}<span className="fw-normal text-muted ms-2">{g.length} return(s) · {new Set(g.map((r) => r.cdsStoreId)).size} CDS store(s)</span></td>
                </tr>,
                ...g.map((r) => (
                  <tr key={r.id} className={`mat-mdc-row${sel.has(r.id) ? ' selected' : ''}`}>
                    <td><input type="checkbox" className="form-check-input" aria-label={`Select ${r.returnNo}`} checked={sel.has(r.id)} onChange={() => setSel((s) => { const n = new Set(s); if (n.has(r.id)) n.delete(r.id); else n.add(r.id); return n; })} /></td>
                    <td className="fw-semibold">{r.returnNo}<div className="text-muted text-xs">{r.orderNo}</div></td>
                    <td className="small">{r.storeName}</td><td className="small">{r.retailerName}</td>
                    <td className="small">{r.lines.filter((l) => (l.acceptedQty ?? 0) > 0).map((l) => `${l.name} × ${l.acceptedQty}`).join(', ')}</td>
                    <td className="small">{r.lines.map((l) => l.reason).join(', ')}</td>
                    <td className="small">{kg(r.weightKg)}</td>
                  </tr>
                )),
              ])}
            </Table>
          )}
        </Card>
        <PlanPanel title="Return plan" submit="Create Plan & Generate Return Trip" busy={busy} disabled={!chosen.length || !a.vehicleId || !a.deliveryPersonId} onSubmit={() => void submit()}
          summary={<div className="fw-semibold">{chosen.length} return(s) · {new Set(chosen.map((r) => r.cdsStoreId)).size} CDS pickup(s) · {new Set(chosen.map((r) => r.distributorId)).size} distributor handover(s) · {kg(loadKg)}</div>}>
          <DateSlot date={day} slot={slot} min={meta.data?.settings.nextDayPlanning ? meta.data.tomorrow : meta.data?.today ?? ''} onDate={setDate} onSlot={setSlot} hint="Return plans are for the next day." />
          <AssignFields date={day} loadKg={loadKg} value={a} onChange={setA} />
        </PlanPanel>
      </div>
      <Card title={<><i className="fas fa-truck-moving text-primary me-2" />Returns on the way back</>}>
        <Table head={['Return', 'From CDS', 'To distributor', 'Items', 'Status']} empty={!all.data?.rows.length && <Empty text="Nothing on the way" />}>
          {all.data?.rows.map((r) => (
            <tr key={r.id} className="mat-mdc-row">
              <td className="fw-semibold">{r.returnNo}</td><td className="small">{r.storeName}</td><td className="small">{r.distributorName}</td>
              <td className="small">{r.lines.map((l) => `${l.name} × ${l.acceptedQty ?? 0}`).join(', ')}</td><td><Badge meta={RETURN_STATUS[r.status]} /></td>
            </tr>
          ))}
        </Table>
      </Card>
      <RecentPlans kind="RETURN" title="Recent return plans" />
    </div>
  );
}
