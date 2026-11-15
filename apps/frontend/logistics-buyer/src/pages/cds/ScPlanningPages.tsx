// CDS Service Centre planning: Pickup Planning (distributors → CDS stores) and Deliver to CDS. There is no return
// planning (the CDS flow has no returns). Each plan generates its trips (see Trips). Screens follow Delivery Planning:
// section cards with a count, short item lists, and a plan panel on the right.
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { cdsApi, type OrderRow, type PlanRow, type TripView } from '../../api/services/cds.service';
import { TRIP_STATUS, TRIP_TYPE } from '../../cds/status';
import { SC_HUB } from '../../cds/engine';
import { routeMetrics, sequenceStops } from '../../cds/planning';
import type { Plan, TripStatus } from '../../cds/types';
import { RouteMapDialog, mapStops } from './RouteMap';
import { AssignFields, Badge, Card, DetailHead, Empty, ErrorBox, fmtDate, fmtDateTime, kg, Loading, money, PageHead, RowActions, SectionCard, SLOTS, sumOf, Table, useAction, useLoad, useMeta, type Assign } from './ui';

/** "Sunflower Oil 1 L × 4, +2 more" — the first product and how many more. */
const products = <L extends { name: string }>(lines: L[], qty: (l: L) => number) => {
  const shown = lines.filter((l) => qty(l) > 0);
  if (!shown.length) return '—';
  return `${shown[0].name} × ${qty(shown[0])}${shown.length > 1 ? `, +${shown.length - 1} more` : ''}`;
};

/** Recently created plans with the trips they generated. */
export function RecentPlans({ kind, title }: { kind: Plan['kind']; title: string }) {
  const navigate = useNavigate();
  const { data, error, loading, reload } = useLoad(() => cdsApi.plans(kind), [kind]);
  return (
    <SectionCard icon="fa-clipboard-list" tone="green" title={title} subtitle="Plans and the trips they generated" count={data?.length} countLabel="plans">
      {error && <ErrorBox text={error} onRetry={reload} />}
      {loading && !data ? <Loading /> : (
        <Table head={['Plan', 'Planned date', 'Orders', 'Trips', 'Created']} empty={!data?.length && <Empty text="No plans yet" />}>
          {data?.slice(0, 12).map((p: PlanRow) => (
            <tr key={p.id} className="mat-mdc-row">
              <td className="fw-semibold">{p.planNo}</td>
              <td className="small">{fmtDate(p.plannedDate)}</td>
              <td className="small">{`${p.orderIds.length} order(s)`}</td>
              <td className="small">{p.trips.map((t) => (
                <div key={t.id} className="d-flex align-items-center justify-content-center gap-2 py-1">
                  <a role="button" className="text-primary fw-semibold" onClick={() => navigate(`/cds/trips/${t.id}`)}>{t.tripNo}</a><Badge meta={TRIP_STATUS[t.status]} />
                </div>
              ))}</td>
              <td className="small">{fmtDateTime(p.createdAt)}</td>
            </tr>
          ))}
        </Table>
      )}
    </SectionCard>
  );
}

const check = (label: string, on: boolean, toggle: () => void) => <input type="checkbox" className="form-check-input" aria-label={label} checked={on} onChange={toggle} />;

// ---------------------------------------------------------------- Pickup Planning (like Delivery Planning)

const dayKey = (iso: string) => new Date(iso).toLocaleDateString('en-CA');

type Place = { id: string; name: string; address: string; lat: number; lng: number };
/** The pickup route the plan creates (same rules as the engine): distributors of the orders from the Service Centre
 *  hub in the shortest order, then the CDS stores of the orders (fixed by each retailer's location). */
function autoRoute(orders: OrderRow[], distributors: Place[], stores: Place[]) {
  const leg = (start: Place | typeof SC_HUB, places: Place[], key: (o: OrderRow) => string) =>
    sequenceStops(start, places).map((i, k) => {
      const p = places[i];
      const os = orders.filter((o) => key(o) === p.id);
      return { ...p, seq: k + 1, orders: os.length, kg: sumOf(os, (o) => o.weightKg) };
    });
  const dists = distributors.filter((d) => orders.some((o) => o.distributorId === d.id));
  const sts = stores.filter((s) => orders.some((o) => o.cdsStoreId === s.id));
  const pickups = leg(SC_HUB, dists, (o) => o.distributorId);
  const first = distributors.find((d) => d.id === orders[0]?.distributorId) ?? SC_HUB;
  const drops = leg(first, sts, (o) => o.cdsStoreId);
  const m = routeMetrics([SC_HUB, ...pickups, ...drops], pickups.length + drops.length);
  return { pickups, drops, km: m.distanceKm, minutes: m.etaMinutes };
}
const DONE_TRIP: TripStatus[] = ['COMPLETED', 'PARTIALLY_COMPLETED', 'CANCELLED'];

/** Pickup plans: planned and completed pickups, each with its pickup trip; "Create Pickup Plan" opens the planner. */
export function PickupPlanningPage() {
  const navigate = useNavigate();
  const plans = useLoad(() => cdsApi.plans('PICKUP'), []);
  const trips = useLoad(() => cdsApi.searchTrips({ types: ['DISTRIBUTOR_PICKUP'], pageSize: 0 }), []);
  const waiting = useLoad(() => cdsApi.searchOrders({ statuses: ['CONFIRMED'], pageSize: 1 }), []);
  const [map, setMap] = useState<TripView | null>(null);
  const byId = useMemo(() => new Map((trips.data?.rows ?? []).map((t) => [t.id, t])), [trips.data]);
  const rows = (plans.data ?? []).map((p) => {
    const pt = p.trips.find((t) => t.type === 'DISTRIBUTOR_PICKUP');
    const cdt = p.trips.find((t) => t.type === 'CDS_DELIVERY');
    return { p, trip: pt ? byId.get(pt.id) : undefined, cdt };
  });
  const active = rows.filter((r) => !r.trip || !DONE_TRIP.includes(r.trip.status));
  const done = rows.filter((r) => r.trip && DONE_TRIP.includes(r.trip.status));
  const head = ['Created Date', 'Plan ID', 'Pickup Points', 'Pickup Date', 'Weight', 'Orders', 'Delivery Person', 'Status', 'Actions'];
  const table = (list: typeof rows, empty: string) => (
    <Table head={head} empty={!list.length && <Empty icon="fa-inbox" text={empty} />}>
      {list.map(({ p, trip, cdt }) => (
        <tr key={p.id} className="mat-mdc-row">
          <td className="small">{fmtDateTime(p.createdAt)}</td>
          <td className="fw-semibold">{p.planNo}</td>
          <td>{trip ? `${trip.stops.length} point${trip.stops.length === 1 ? '' : 's'}` : '—'}</td>
          <td className="small">{fmtDate(p.plannedDate)}<div className="text-muted text-xs">{trip?.slot}</div></td>
          <td className="small">{trip ? kg(trip.loadKg) : '—'}</td>
          <td>{p.orderIds.length}</td>
          <td className="small">{trip?.deliveryPersonName ?? '—'}<div className="text-muted text-xs">{trip?.vehicleRegNo}</div></td>
          <td>{trip ? <Badge meta={TRIP_STATUS[trip.status]} /> : '—'}</td>
          <td>
            {trip && (
              <RowActions
                onView={() => navigate(`/cds/trips/${trip.id}`)}
                items={[
                  { label: `View ${TRIP_TYPE.DISTRIBUTOR_PICKUP.label}`, icon: 'fa-eye', onClick: () => navigate(`/cds/trips/${trip.id}`) },
                  { label: 'Map view', icon: 'fa-map-location-dot', onClick: () => setMap(trip) },
                  { label: `View ${TRIP_TYPE.CDS_DELIVERY.label}`, icon: 'fa-warehouse', hidden: !cdt, onClick: () => cdt && navigate(`/cds/trips/${cdt.id}`) },
                ]}
              />
            )}
          </td>
        </tr>
      ))}
    </Table>
  );
  return (
    <div className="cds-page">
      <PageHead icon="fa-truck-ramp-box" title="Pickup Planning" subtitle="Plan and track distributor pickups.">
        <button className="btn btn-sm btn-primary d-flex align-items-center text-nowrap" onClick={() => navigate('/cds/pickup-planning/create')}><i className="fas fa-plus me-1" />Create Pickup Plan</button>
      </PageHead>
      {!!waiting.data?.total && (
        <div className="cds-note mb-3 align-items-center">
          <i className="fas fa-box" />
          <div className="flex-grow-1"><b>{waiting.data.total}</b> confirmed order{waiting.data.total === 1 ? '' : 's'} from the Seller Store waiting for a pickup plan.</div>
          <button className="btn btn-sm btn-outline-primary" onClick={() => navigate('/cds/pickup-planning/create')}>Plan now</button>
        </div>
      )}
      {(plans.error || trips.error) && <ErrorBox text={plans.error || trips.error} onRetry={() => { plans.reload(); trips.reload(); }} />}
      {(plans.loading && !plans.data) || (trips.loading && !trips.data) ? <Loading /> : (
        <>
          <SectionCard icon="fa-truck" title="Planned Pickups" subtitle={`${TRIP_TYPE.DISTRIBUTOR_PICKUP.label}s (${TRIP_TYPE.DISTRIBUTOR_PICKUP.direction}) that are planned or on the road`} count={active.length} countLabel="plans">{table(active, 'No planned pickups')}</SectionCard>
          <SectionCard icon="fa-circle-check" tone="green" title="Completed Pickups" subtitle={`${TRIP_TYPE.DISTRIBUTOR_PICKUP.label}s (${TRIP_TYPE.DISTRIBUTOR_PICKUP.direction}) that are closed`} count={done.length} countLabel="plans">{table(done.slice(0, 15), 'No completed pickups yet')}</SectionCard>
        </>
      )}
      {map && <RouteMapDialog title={`${map.tripNo} · Map View`} subtitle={`${fmtDate(map.plannedDate)} · ${map.deliveryPersonName}`} stops={mapStops(map.stops)} onClose={() => setMap(null)} />}
    </div>
  );
}

/** Create Pickup Plan — same layout as Create Delivery Route: date, order dates, available orders, then vehicle. */
export function CreatePickupPlanPage() {
  const navigate = useNavigate();
  const meta = useMeta();
  const { busy, run } = useAction();
  const [distributorId, setDist] = useState('');
  const [days, setDays] = useState<Set<string>>(new Set());
  const [sel, setSel] = useState<Record<string, string>>({}); // orderId → destination CDS
  const [date, setDate] = useState('');
  const [slot, setSlot] = useState(SLOTS[0]);
  const [pickup, setPickup] = useState<Assign>({ vehicleId: '', deliveryPersonId: '' });
  const [same, setSame] = useState(true);
  const [leg, setLeg] = useState<Assign>({ vehicleId: '', deliveryPersonId: '' });
  const [showMap, setShowMap] = useState(false);
  const day = date || meta.data?.today || '';
  const { data, error, loading, reload } = useLoad(() => cdsApi.searchOrders({ statuses: ['CONFIRMED'], pageSize: 0 }), []);
  const all = data?.rows ?? [];
  const orderDays = useMemo(() => Array.from(new Set(all.map((o) => dayKey(o.confirmedAt)))).sort().reverse(), [all]);
  const rows = all.filter((o) => (!distributorId || o.distributorId === distributorId) && (!days.size || days.has(dayKey(o.confirmedAt))));
  const chosen = all.filter((o) => sel[o.id] !== undefined);
  const loadKg = sumOf(chosen, (o) => o.weightKg);
  const allOn = !!rows.length && rows.every((o) => sel[o.id] !== undefined);
  const toggle = (o: OrderRow) => setSel((s) => { const n = { ...s }; if (n[o.id] !== undefined) delete n[o.id]; else n[o.id] = o.cdsStoreId; return n; });
  const ready = chosen.length > 0 && !!pickup.vehicleId && !!pickup.deliveryPersonId && (same || (!!leg.vehicleId && !!leg.deliveryPersonId));
  const route = useMemo(() => autoRoute(chosen, meta.data?.distributors ?? [], meta.data?.allStores ?? meta.data?.stores ?? []), [chosen, meta.data]);
  const submit = async () => {
    // The CDS store of each order is fixed by the retailer's location; the CDS delivery trip is always created with the pickup.
    const r = await run(() => cdsApi.createPickupPlan({
      orders: chosen.map((o) => ({ orderId: o.id })), plannedDate: day, slot, pickup,
      cdsDelivery: same ? pickup : leg,
    }), 'Pickup plan created with its CDS delivery trip');
    if (r) navigate('/cds/pickup-planning');
  };
  return (
    <div className="cds-page">
      <DetailHead icon="fa-route" title="Create Pickup Plan" back="/cds/pickup-planning" subtitle="Select confirmed Seller Store orders. Pickup points and CDS stores are set automatically." />
      <Card>
        <div className="cds-config-bar">
          <div className="config-item"><label className="config-label" htmlFor="pp-date">Pickup Date</label><input id="pp-date" type="date" className="form-control form-control-sm" min={meta.data?.today} value={day} onChange={(e) => setDate(e.target.value)} /></div>
          <div className="config-item"><label className="config-label" htmlFor="pp-slot">Slot</label><select id="pp-slot" className="form-select form-select-sm" value={slot} onChange={(e) => setSlot(e.target.value)}>{SLOTS.map((s) => <option key={s}>{s}</option>)}</select></div>
          <div className="config-item"><label className="config-label" htmlFor="pp-dist">Distributor</label><select id="pp-dist" className="form-select form-select-sm" value={distributorId} onChange={(e) => setDist(e.target.value)}><option value="">All distributors</option>{meta.data?.distributors.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}</select></div>
          <div className="config-item">
            <span className="config-label">Order Dates</span>
            <div className="cds-date-chips">
              {orderDays.map((d) => (
                <label key={d} className={`cds-date-chip${days.has(d) ? ' on' : ''}`}>
                  <input type="checkbox" checked={days.has(d)} onChange={() => setDays((s) => { const n = new Set(s); if (n.has(d)) n.delete(d); else n.add(d); return n; })} />{fmtDate(d)}
                </label>
              ))}
              {!orderDays.length && <span className="text-muted small">—</span>}
            </div>
          </div>
        </div>
      </Card>
      <SectionCard icon="fa-box" title="Available Orders" subtitle="Confirmed orders from the Seller Store" count={rows.length} countLabel="orders" extra={
        <button className="btn btn-sm btn-outline-primary" disabled={!rows.length} onClick={() => setSel((s) => { const n = { ...s }; rows.forEach((o) => (allOn ? delete n[o.id] : (n[o.id] = n[o.id] ?? o.cdsStoreId))); return n; })}>{allOn ? 'Clear All' : 'Select All'}</button>
      }>
        {error && <ErrorBox text={error} onRetry={reload} />}
        {loading && !data ? <Loading /> : (
          <Table head={['', 'Order Date', 'Order', 'Retailer', 'Pickup From', 'Products', 'Order Value', 'Weight', 'CDS Store']} empty={!rows.length && <Empty icon="fa-check" text="No confirmed orders for these filters" />}>
            {rows.map((o) => (
              <tr key={o.id} className={`mat-mdc-row${sel[o.id] !== undefined ? ' selected' : ''}`}>
                <td>{check(`Select ${o.orderNo}`, sel[o.id] !== undefined, () => toggle(o))}</td>
                <td className="small">{fmtDate(o.confirmedAt)}</td>
                <td className="fw-semibold">{o.orderNo}<div className="text-muted text-xs fw-normal">{o.sellerOrderRef}</div></td>
                <td className="small">{o.retailerName}<div className="text-muted text-xs">{o.locality}</div></td>
                <td className="small">{o.distributorName}</td>
                <td className="small" title={o.lines.map((l) => `${l.name} × ${l.qty}`).join('\n')}>{products(o.lines, (l) => l.qty)}</td>
                <td className="small">{money(o.orderValue)}</td>
                <td className="small">{kg(o.weightKg)}</td>
                <td className="small">{o.storeName}<div><span className="cds-auto-tag" title="The retailer is inside this CDS store's service area (polygon)"><i className="fas fa-location-crosshairs me-1" />Auto</span></div></td>
              </tr>
            ))}
          </Table>
        )}
      </SectionCard>
      <SectionCard icon="fa-route" tone="purple" title="Pickup Route (auto)" subtitle={`Built from the selected orders: ${TRIP_TYPE.DISTRIBUTOR_PICKUP.label} (${TRIP_TYPE.DISTRIBUTOR_PICKUP.direction}), then ${TRIP_TYPE.CDS_DELIVERY.label} (${TRIP_TYPE.CDS_DELIVERY.direction})`} extra={
        <button className="btn btn-sm btn-outline-primary" disabled={!chosen.length} onClick={() => setShowMap(true)}><i className="fas fa-map-location-dot me-1" />Map View</button>
      }>
        {!chosen.length ? <div className="cds-empty py-4"><i className="fas fa-route" />Select orders to see the pickup route</div> : (
          <div className="cds-route-preview">
            <div>
              <div className="leg-title"><span className="leg-no">1</span>{TRIP_TYPE.DISTRIBUTOR_PICKUP.label}<small>{TRIP_TYPE.DISTRIBUTOR_PICKUP.direction}</small></div>
              <ol>{route.pickups.map((p) => <li key={p.id}><b>{p.seq}. {p.name}</b><span>{p.address}</span><em>{p.orders} order{p.orders === 1 ? '' : 's'} · {kg(p.kg)}</em></li>)}</ol>
            </div>
            <div>
              <div className="leg-title"><span className="leg-no">2</span>{TRIP_TYPE.CDS_DELIVERY.label}<small>{TRIP_TYPE.CDS_DELIVERY.direction}</small></div>
              <ol>{route.drops.map((d) => <li key={d.id}><b>{d.seq}. {d.name}</b><span>{d.address}</span><em>{d.orders} order{d.orders === 1 ? '' : 's'} · {kg(d.kg)}</em></li>)}</ol>
            </div>
            <div className="route-metrics"><span><i className="fas fa-road me-1" />~{route.km} km</span><span><i className="fas fa-clock me-1" />~{route.minutes} min</span><span><i className="fas fa-location-dot me-1" />{route.pickups.length + route.drops.length} stops</span></div>
          </div>
        )}
      </SectionCard>
      <Card title={<><i className="fas fa-truck text-primary me-2" />Vehicle &amp; Delivery Person</>}>
        <div className="cds-assign-grid">
          <div><AssignFields label={`${TRIP_TYPE.DISTRIBUTOR_PICKUP.label} (${TRIP_TYPE.DISTRIBUTOR_PICKUP.direction})`} date={day} loadKg={loadKg} value={pickup} onChange={setPickup} /></div>
          <div className="d-flex flex-column gap-2">
            <div className="form-check"><input id="same" className="form-check-input" type="checkbox" checked={same} onChange={(e) => setSame(e.target.checked)} /><label htmlFor="same" className="form-check-label">Same vehicle and delivery person for the {TRIP_TYPE.CDS_DELIVERY.label} ({TRIP_TYPE.CDS_DELIVERY.direction})</label></div>
            {!same && <AssignFields label={`${TRIP_TYPE.CDS_DELIVERY.label} (${TRIP_TYPE.CDS_DELIVERY.direction})`} date={day} loadKg={loadKg} value={leg} onChange={setLeg} allowBusy={pickup} />}
          </div>
        </div>
      </Card>
      {showMap && <RouteMapDialog title="Pickup Route · Map View" subtitle={`${route.pickups.length} pickups · ${route.drops.length} CDS stores · ~${route.km} km`} stops={[...route.pickups, ...route.drops.map((d) => ({ ...d, seq: d.seq + route.pickups.length }))].map((x) => ({ seq: x.seq, name: x.name, detail: x.address, lat: x.lat, lng: x.lng }))} onClose={() => setShowMap(false)} />}
      <div className="cds-create-footer">
        <div className="sum">
          <span><b>{chosen.length}</b>orders</span>
          <span><b>{new Set(chosen.map((o) => o.distributorId)).size}</b>pickup points</span>
          <span><b>{new Set(chosen.map((o) => sel[o.id])).size}</b>CDS stores</span>
          <span><b>{kg(loadKg)}</b>load</span>
          <span><b>{money(sumOf(chosen, (o) => o.orderValue))}</b>value</span>
        </div>
        <button className="btn btn-outline-secondary" onClick={() => navigate('/cds/pickup-planning')}>Cancel</button>
        <button className="btn btn-primary" disabled={!ready || busy} onClick={() => void submit()}>{busy ? <span className="spinner-border spinner-border-sm me-2" /> : <i className="fas fa-paper-plane me-2" />}Create Pickup Plan</button>
      </div>
    </div>
  );
}
