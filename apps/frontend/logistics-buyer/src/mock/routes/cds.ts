// CDS (Cross Dock Store) API — service "cds-svc". Business rules live in src/cds/engine.ts; this file handles the
// CDS sign-in sessions, role-based access and CDS-store isolation (checked on every call), transactions, and the
// integration endpoints:
//
//   /cds/auth/*                    CDS sign-in (CDS Service Centre / CDS User; LBNP keeps its own login)
//   /cds/*                         CDS Service Centre + CDS User screens
//   /cds/inbound/seller-orders     Seller Store order confirmation → CDS (CDS Store Delivery) or LBNP (3PL)   — integration key
//   /cds/dp/*                      Delivery Partner App: assigned trips, start / OTP / complete / fail events  — integration key
//
// The CDS module never writes the existing Logistics Buyer data; 3PL seller orders are forwarded unchanged to
// LBNP's existing order intake (POST /orders).
import { route, MockError, handleMockRequest, type MockRequest } from '../server';
import { db, persist, persistNow } from '../db';
import { getControls } from '../controls';
import { CDS_STATE_VERSION, CdsEngine, CdsError, localDay, type StopInput } from '../../cds/engine';
import { buildReport, REPORTS, summary, type ReportFilters } from '../../cds/reports';
import { ACTIVE_TRIP, salesPersonOf, STOP_ACTION, TRIP_STATUS_GROUPS, tripPhase } from '../../cds/status';
import { buildCdsState } from '../../cds/seed';
import { pointInPolygon, serviceStoreFor } from '../../cds/planning';
import { DEFAULT_ROUTE_CONFIG, RETURN_REASONS, ROLE_PAGES, SETTLEMENT_PARTIES, type CdsPage, type CdsState, type CdsUser, type Trip, type TripStatus, type TripType } from '../../cds/types';
import { seedInputs } from '../extensions/cds';

const SVC = 'cds-svc';
export const CDS_INTEGRATION_KEY = 'cds-demo-integration-key';

/** CDS data lives in db.ext.cds. Missing or older-version CDS data is rebuilt on first use (LBNP data untouched). */
export function cdsState(): CdsState {
  const d = db();
  if (!d.ext.cds || d.ext.cds.version !== CDS_STATE_VERSION) {
    const { retailers, products } = seedInputs(d);
    d.ext.cds = buildCdsState(retailers, products);
    persist();
  }
  return d.ext.cds as CdsState;
}
const engine = () => {
  const e = new CdsEngine(cdsState());
  e.expireOtps();
  return e;
};
const fail = (e: unknown): never => {
  if (e instanceof CdsError) throw new MockError(e.status, e.message);
  throw e;
};
/** One transaction per write: any error restores the CDS state, so a multi-step action never half-applies. */
export function cdsTx<T>(fn: (e: CdsEngine) => T): T {
  const d = db();
  const snap = JSON.stringify(cdsState());
  try {
    const out = fn(engine());
    persist();
    return out;
  } catch (err) {
    d.ext.cds = JSON.parse(snap);
    return fail(err);
  }
}
const read = <T>(fn: (e: CdsEngine) => T): T => {
  try {
    return fn(engine());
  } catch (err) {
    return fail(err);
  }
};

// ---------------------------------------------------------------- session, roles, store isolation

function sessionUser(req: MockRequest): CdsUser {
  const token = req.headers['X-Cds-Token'] || '';
  const s = cdsState();
  const sess = token && s.sessions.find((x) => x.token === token);
  const user = sess && s.users.find((u) => u.id === sess.userId && u.active);
  if (!user) throw new MockError(401, 'Your CDS session has expired. Please sign in again.');
  return user;
}
function need(req: MockRequest, pages: CdsPage | CdsPage[]): CdsUser {
  const u = sessionUser(req);
  const list = Array.isArray(pages) ? pages : [pages];
  if (!list.some((p) => ROLE_PAGES[u.role].includes(p))) throw new MockError(403, 'Your role does not have access to this module');
  return u;
}
const isSC = (u: CdsUser) => u.role === 'SERVICE_CENTRE';
const myStore = (u: CdsUser) => u.cdsStoreIds[0];
/** Stores the user may see; a CDS User only their own. */
const scopeOf = (u: CdsUser, requested?: string) => {
  if (requested && !u.cdsStoreIds.includes(requested)) throw new MockError(403, 'You do not have access to this CDS store');
  return requested ? [requested] : u.cdsStoreIds;
};
const ownStore = (u: CdsUser, storeId: string) => {
  if (!u.cdsStoreIds.includes(storeId)) throw new MockError(403, 'This record belongs to another CDS store');
};
/** Trips: Service Centre runs SC trips; a CDS User runs its own store's retailer trips. */
function tripAccess(u: CdsUser, t: Trip, write: boolean) {
  if (t.owner === 'SC') {
    if (isSC(u)) return;
    // a CDS User may view (not run) Service Centre trips that hand over / pick up at their store
    if (!write && t.stops.some((x) => x.partyType === 'CDS' && x.partyId === myStore(u))) return;
    throw new MockError(403, 'Service Centre trips are run by the CDS Service Centre');
  }
  if (isSC(u)) {
    if (write) throw new MockError(403, 'Retailer trips are run by the CDS User of the store');
    return;
  }
  ownStore(u, t.owner);
}
function integration(req: MockRequest) {
  if (req.headers['X-Integration-Key'] !== CDS_INTEGRATION_KEY) throw new MockError(401, 'Invalid integration key');
}

const page = <T>(rows: T[], b: { pageNumber?: number; pageSize?: number }) => {
  if (b.pageSize === 0) return { rows, total: rows.length, pageNumber: 1, pageSize: rows.length };
  const size = Math.max(1, Number(b.pageSize) || 10);
  const pn = Math.max(1, Number(b.pageNumber) || 1);
  return { rows: rows.slice((pn - 1) * size, pn * size), total: rows.length, pageNumber: pn, pageSize: size };
};
const has = (q: string | undefined, ...xs: (string | null | undefined)[]) => !q || xs.some((x) => (x ?? '').toLowerCase().includes(q.trim().toLowerCase()));
const newest = <T extends { createdAt: string }>(a: T, b: T) => b.createdAt.localeCompare(a.createdAt);
const publicUser = (u: CdsUser) => ({ id: u.id, name: u.name, mobile: u.mobile, email: u.email, role: u.role, cdsStoreIds: u.cdsStoreIds, pages: ROLE_PAGES[u.role] });
const names = (s: CdsState) => ({
  d: (id: string) => s.distributors.find((x) => x.id === id)?.name ?? id,
  st: (id: string) => (id === 'SC' ? 'CDS Service Centre' : s.stores.find((x) => x.id === id)?.name ?? id),
  r: (id: string | null) => (id ? s.retailers.find((x) => x.id === id) ?? null : null),
});

// ---------------------------------------------------------------- auth

route('POST', SVC, '/cds/auth/otp/send', (req) => {
  const mobile = String(req.body?.mobile ?? '');
  if (!/^[6-9]\d{9}$/.test(mobile)) throw new MockError(400, 'Enter a valid 10-digit mobile number');
  if (!cdsState().users.some((x) => x.mobile === mobile && x.active)) throw new MockError(404, 'This mobile number is not registered for CDS access');
  return { sent: true };
});
route('POST', SVC, '/cds/auth/otp/verify', (req) => {
  const mobile = String(req.body?.mobile ?? '');
  if (String(req.body?.otp ?? '') !== getControls().otp) throw new MockError(400, 'Invalid OTP');
  return cdsTx((e) => {
    const u = e.s.users.find((x) => x.mobile === mobile && x.active);
    if (!u) throw new CdsError(404, 'This mobile number is not registered for CDS access');
    const token = `cds_${crypto.randomUUID?.() ?? Math.random().toString(36).slice(2)}`;
    const own = e.s.sessions.filter((x) => x.userId === u.id).slice(-4); // up to 5 devices per user
    e.s.sessions = e.s.sessions.filter((x) => x.userId !== u.id).concat(own, { token, userId: u.id, createdAt: e.now() });
    e.audit('SESSION', u.id, u.name, 'SIGNED_IN', u.role);
    return { token, user: publicUser(u) };
  });
});
route('POST', SVC, '/cds/auth/logout', (req) => {
  const s = cdsState();
  s.sessions = s.sessions.filter((x) => x.token !== req.headers['X-Cds-Token']);
  persist();
  return { ok: true };
});
route('GET', SVC, '/cds/me', (req) => publicUser(sessionUser(req)));

// ---------------------------------------------------------------- reference data, dashboards, reports

route('GET', SVC, '/cds/meta', (req) => {
  const u = sessionUser(req);
  const s = cdsState();
  const e = engine();
  return {
    stores: s.stores.filter((x) => u.cdsStoreIds.includes(x.id)),
    allStores: isSC(u) ? s.stores : s.stores.filter((x) => u.cdsStoreIds.includes(x.id)),
    distributors: s.distributors,
    settings: { ...s.settings, pickupRoute: { ...DEFAULT_ROUTE_CONFIG, ...s.settings.pickupRoute }, returnRoute: { ...DEFAULT_ROUTE_CONFIG, ...s.settings.returnRoute } },
    returnReasons: RETURN_REASONS,
    settlementParties: SETTLEMENT_PARTIES,
    reports: (isSC(u) ? REPORTS.SERVICE_CENTRE : REPORTS.CDS_USER),
    today: e.today(),
    tomorrow: e.tomorrow(),
  };
});
/** Demo only: rebuilds the CDS demo data (LBNP data is not touched). Signed-in CDS sessions are kept. */
route('POST', SVC, '/cds/demo/reset', (req) => {
  sessionUser(req);
  const d = db();
  const sessions = (d.ext.cds as CdsState).sessions;
  const { retailers, products } = seedInputs(d);
  d.ext.cds = buildCdsState(retailers, products);
  (d.ext.cds as CdsState).sessions = sessions;
  persistNow(); // the page reloads right after the reset — save before it does
  return { reset: true };
});

route('GET', SVC, '/cds/summary', (req) => {
  const u = sessionUser(req);
  return summary(cdsState(), u.role, u.cdsStoreIds);
});
route('GET', SVC, '/cds/reports/:id', (req) => {
  const u = need(req, ['sc-reports', 'cu-reports']);
  const def = REPORTS[u.role].find((x) => x.id === req.params.id);
  if (!def) throw new MockError(404, 'Report not found');
  const f: ReportFilters = { from: req.query.from || undefined, to: req.query.to || undefined, cdsStoreId: req.query.cdsStoreId || undefined, distributorId: req.query.distributorId || undefined, retailerId: req.query.retailerId || undefined, status: req.query.status || undefined };
  if (f.cdsStoreId) scopeOf(u, f.cdsStoreId);
  const out = buildReport(cdsState(), def.id, u.cdsStoreIds, f);
  // A "Run" (not a preview refresh) is kept in the report's History.
  if (req.query.run === '1') {
    const s = cdsState();
    const filters = Object.fromEntries(Object.entries(f).filter(([, v]) => !!v)) as Record<string, string>;
    s.reportRuns = [{ id: `run-${Date.now().toString(36)}`, reportId: def.id, userId: u.id, filters, rows: out.rows.length, at: new Date().toISOString(), by: u.name }, ...(s.reportRuns ?? [])].slice(0, 200);
    persist();
  }
  return out;
});
route('GET', SVC, '/cds/reports/:id/history', (req) => {
  const u = need(req, ['sc-reports', 'cu-reports']);
  return (cdsState().reportRuns ?? []).filter((r) => r.reportId === req.params.id && r.userId === u.id);
});
route('GET', SVC, '/cds/resources', (req) => {
  const u = sessionUser(req);
  const owner = isSC(u) ? 'SC' : myStore(u);
  return read((e) => e.resources(owner, req.query.date || e.today()));
});

// ---------------------------------------------------------------- orders

route('POST', SVC, '/cds/orders/search', (req) => {
  const u = need(req, ['sc-orders', 'sc-pickup', 'sc-deliver', 'cu-orders', 'cu-delivery', 'cu-grn', 'cu-returns']);
  const b = req.body ?? {};
  const stores = scopeOf(u, b.cdsStoreId || undefined);
  const s = cdsState();
  const n = names(s);
  const rows = s.orders
    .filter((o) => stores.includes(o.cdsStoreId))
    .filter((o) => !b.statuses?.length || b.statuses.includes(o.status))
    .filter((o) => !b.distributorId || o.distributorId === b.distributorId)
    .filter((o) => !b.retailerId || o.retailerId === b.retailerId)
    .filter((o) => !b.fromDate || o.confirmedAt.slice(0, 10) >= b.fromDate)
    .filter((o) => !b.toDate || o.confirmedAt.slice(0, 10) <= b.toDate)
    .filter((o) => !b.noActiveCdsTrip || !s.trips.some((t) => t.id === o.cdsTripId && ACTIVE_TRIP.includes(t.status)))
    .map((o) => {
      const r = n.r(o.retailerId);
      return { ...o, retailerName: r?.name ?? '', retailerPhone: r?.phone ?? '', retailerAddress: r?.address ?? '', locality: r?.locality ?? '', city: r?.city ?? '', state: r?.state ?? '', retailerLat: r?.lat ?? 0, retailerLng: r?.lng ?? 0, distributorName: n.d(o.distributorId), storeName: n.st(o.cdsStoreId), units: o.lines.reduce((a, l) => a + l.qty, 0), ...salesPersonOf(o.distributorId, o.retailerId) };
    })
    .filter((o) => !b.state || o.state === b.state)
    .filter((o) => !b.city || o.city === b.city)
    .filter((o) => has(b.search, o.orderNo, o.sellerOrderRef, o.retailerName, o.retailerPhone, o.distributorName))
    .sort((a, z) => z.confirmedAt.localeCompare(a.confirmedAt));
  return page(rows, b);
});

route('GET', SVC, '/cds/orders/:id', (req) => {
  const u = need(req, ['sc-orders', 'cu-orders']);
  const s = cdsState();
  const e = engine();
  const o = read((x) => x.order(req.params.id));
  ownStore(u, o.cdsStoreId);
  const n = names(s);
  const tripsOf = [o.pickupTripId, o.cdsTripId, o.deliveryTripId].concat(s.trips.filter((t) => t.orderIds.includes(o.id)).map((t) => t.id));
  return {
    order: o, salesPerson: salesPersonOf(o.distributorId, o.retailerId), retailer: n.r(o.retailerId), distributor: s.distributors.find((d) => d.id === o.distributorId), store: s.stores.find((x) => x.id === o.cdsStoreId),
    trips: s.trips.filter((t) => tripsOf.includes(t.id)).map((t) => ({ id: t.id, tripNo: t.tripNo, type: t.type, status: t.status, plannedDate: t.plannedDate })),
    grn: o.grnId ? s.grns.find((g) => g.id === o.grnId) ?? null : null,
    returns: s.returns.filter((r) => r.orderId === o.id),
    collections: s.collections.filter((c) => c.orderId === o.id),
    returnable: o.lines.map((l) => ({ sku: l.sku, max: e.returnableQty(o, l.sku) })),
  };
});
route('POST', SVC, '/cds/orders/:id/cancel', (req) => {
  const u = need(req, 'sc-orders');
  return cdsTx((e) => e.cancelOrder(req.params.id, req.body?.reason, u.name));
});

// ---------------------------------------------------------------- planning

route('POST', SVC, '/cds/pickup/plans', (req) => {
  const u = need(req, 'sc-pickup');
  (req.body?.orders ?? []).forEach((x: { cdsStoreId?: string }) => x.cdsStoreId && scopeOf(u, x.cdsStoreId));
  return cdsTx((e) => e.createPickupPlan(req.body, u.name));
});
route('POST', SVC, '/cds/deliver-to-cds/plans', (req) => {
  const u = need(req, 'sc-deliver');
  return cdsTx((e) => e.createCdsDeliveryPlan(req.body, u.name));
});
route('POST', SVC, '/cds/return-planning/plans', (req) => {
  const u = need(req, 'sc-returns');
  return cdsTx((e) => e.createReturnPlan(req.body, u.name));
});
route('POST', SVC, '/cds/delivery/plans', (req) => {
  const u = need(req, 'cu-delivery');
  return cdsTx((e) => e.createDeliveryPlan({ ...req.body, cdsStoreId: myStore(u) }, u.name));
});
route('GET', SVC, '/cds/plans', (req) => {
  const u = need(req, ['sc-pickup', 'sc-deliver', 'sc-returns', 'cu-delivery']);
  const s = cdsState();
  const owner = isSC(u) ? 'SC' : myStore(u);
  return s.plans.filter((p) => p.owner === owner && (!req.query.kind || p.kind === req.query.kind)).sort(newest).slice(0, Number(req.query.limit) || 50)
    .map((p) => ({ ...p, trips: s.trips.filter((t) => p.tripIds.includes(t.id)).map((t) => ({ id: t.id, tripNo: t.tripNo, type: t.type, status: t.status, deliveryPersonName: t.deliveryPersonName, vehicleRegNo: t.vehicleRegNo })) }));
});

/** Deliver to CDS: what is heading to each CDS store, dispatched vs received. */
route('GET', SVC, '/cds/deliver-to-cds/overview', (req) => {
  const u = need(req, 'sc-deliver');
  const s = cdsState();
  return s.stores.filter((x) => u.cdsStoreIds.includes(x.id)).map((st) => {
    const stops = s.trips.filter((t) => t.type === 'CDS_DELIVERY' && t.status !== 'CANCELLED').flatMap((t) => t.stops.filter((x) => x.partyId === st.id).map((x) => ({ t, x })));
    return {
      store: st,
      trips: stops.map(({ t, x }) => ({
        tripId: t.id, tripNo: t.tripNo, tripStatus: t.status, plannedDate: t.plannedDate, deliveryPersonName: t.deliveryPersonName, vehicleRegNo: t.vehicleRegNo,
        stopStatus: x.status, verifiedAt: x.verifiedAt, orders: Array.from(new Set(x.lines.map((l) => l.orderId))).length,
        dispatched: x.lines.reduce((a, l) => a + l.plannedQty, 0), received: x.lines.reduce((a, l) => a + (l.actualQty ?? 0), 0),
      })).sort((a, b) => b.plannedDate.localeCompare(a.plannedDate)),
      awaiting: s.orders.filter((o) => o.cdsStoreId === st.id && ['PICKUP_PLANNED', 'PICKED_UP', 'IN_TRANSIT_TO_CDS'].includes(o.status)).length,
    };
  });
});

// ---------------------------------------------------------------- trips

/** "CDS Service Centre - Hyderabad": the Service Centre and the state its CDS stores are in. CDS User trips: the store. */
function providerOf(s: CdsState, t: Trip) {
  if (t.owner !== 'SC') return s.stores.find((x) => x.id === t.owner)?.name ?? '';
  const st = s.stores.find((x) => t.stops.some((p) => p.partyType === 'CDS' && p.partyId === x.id)) ?? s.stores[0];
  return `CDS Service Centre - ${st?.city || st?.state || 'Hyderabad'}`;
}
/** The orders / returns at a stop (for the map hover card and the trip tabs). */
function stopRefs(s: CdsState, x: Trip['stops'][number]) {
  const n = names(s);
  const ids = Array.from(new Set(x.lines.map((l) => l.returnId ?? l.orderId).filter((v): v is string => !!v)));
  return ids.map((id) => {
    const o = s.orders.find((v) => v.id === id);
    const r = s.returns.find((v) => v.id === id);
    const ls = x.lines.filter((l) => (l.returnId ?? l.orderId) === id);
    const retailerId = o?.retailerId ?? r?.retailerId ?? null;
    return { id, no: o?.orderNo ?? r?.returnNo ?? id, retailer: retailerId ? n.r(retailerId)?.name ?? '' : '', units: ls.reduce((a, l) => a + (l.actualQty ?? l.plannedQty), 0), value: ls.reduce((a, l) => a + (l.actualQty ?? l.plannedQty) * l.unitPrice, 0) };
  });
}
function tripView(s: CdsState, t: Trip) {
  const n = names(s);
  const pickupOfPlan = t.type === 'CDS_DELIVERY' ? s.trips.find((x) => x.planId === t.planId && x.type === 'DISTRIBUTOR_PICKUP') : undefined;
  return {
    ...t, ownerName: n.st(t.owner), shown: tripPhase(t, pickupOfPlan),
    // The OTP code is shown on the trip, like the LBNP Trips screen (Pickup OTP / stop OTP).
    stops: t.stops.map((x) => ({ ...x, otp: x.otpId ? s.otps.find((o) => o.id === x.otpId) ?? null : null, refs: stopRefs(s, x) })),
    providerName: providerOf(s, t),
    collected: s.collections.filter((c) => c.tripId === t.id).reduce((a, c) => (c.mode === 'UPI' ? { ...a, digital: a.digital + c.amount } : { ...a, cod: a.cod + c.amount }), { cod: 0, digital: 0 }),
    units: t.stops.filter((x) => ['DISTRIBUTOR_PICKUP', 'CDS_ORDER_PICKUP', 'CDS_RETURN_PICKUP'].includes(x.action)).reduce((a, x) => a + x.lines.reduce((b, l) => b + l.plannedQty, 0), 0)
      || t.stops.reduce((a, x) => a + x.lines.reduce((b, l) => b + l.plannedQty, 0), 0),
  };
}
route('POST', SVC, '/cds/trips/search', (req) => {
  const u = sessionUser(req);
  const b = req.body ?? {};
  const types: TripType[] = b.types ?? [];
  if (isSC(u) && types.includes('RETAILER_DELIVERY')) throw new MockError(403, 'Retailer trips are managed by the CDS Users');
  if (!isSC(u) && types.some((x) => x !== 'RETAILER_DELIVERY')) throw new MockError(403, 'CDS Users see only retailer delivery trips');
  need(req, isSC(u) ? ['sc-trips', 'sc-pickup', 'sc-deliver', 'sc-returns'] : ['cu-trips', 'cu-delivery']);
  const s = cdsState();
  const rows = s.trips
    .filter((t) => (isSC(u) ? t.owner === 'SC' : t.owner === myStore(u)))
    .filter((t) => !types.length || types.includes(t.type))
    .filter((t) => !b.date || t.plannedDate === b.date)
    .filter((t) => has(b.search, t.tripNo, t.deliveryPersonName, t.vehicleRegNo, ...t.stops.map((x) => x.name)))
    .sort((a, z) => z.plannedDate.localeCompare(a.plannedDate) || z.createdAt.localeCompare(a.createdAt))
    .map((t) => tripView(s, t))
    // the status filter matches the shown status (a CDS Delivery Trip is In Progress once its pickup starts)
    .filter((t) => !b.statuses?.length || b.statuses.some((x: TripStatus) => TRIP_STATUS_GROUPS[t.shown.status].statuses.includes(x)));
  return page(rows, b);
});
route('GET', SVC, '/cds/trips/:id', (req) => {
  const u = sessionUser(req);
  const s = cdsState();
  const t = read((e) => e.trip(req.params.id));
  tripAccess(u, t, false);
  const n = names(s);
  return {
    trip: tripView(s, t),
    // The Service Centre plans and tracks; stops (OTP checks) are run by the CDS User, seller, retailer and delivery agent.
    canRun: !isSC(u) && t.owner === myStore(u),
    otps: s.otps.filter((o) => o.tripId === t.id).map(({ code: _code, ...rest }) => rest).reverse(),
    orders: s.orders.filter((o) => t.orderIds.includes(o.id)).map((o) => ({ id: o.id, orderNo: o.orderNo, status: o.status, paymentMode: o.paymentMode, retailerId: o.retailerId, retailerName: n.r(o.retailerId)?.name ?? '', retailerAddress: n.r(o.retailerId)?.address ?? '', distributorName: n.d(o.distributorId), storeName: n.st(o.cdsStoreId), deliveredAt: o.deliveredAt, lines: o.lines })),
    returns: s.returns.filter((r) => t.returnIds.includes(r.id)).map((r) => ({ id: r.id, returnNo: r.returnNo, status: r.status, orderNo: r.orderNo, orderId: r.orderId, retailerId: r.retailerId, retailerName: r.retailerId ? n.r(r.retailerId)?.name ?? '' : 'Damaged at GRN', retailerAddress: r.retailerId ? n.r(r.retailerId)?.address ?? '' : '', storeName: n.st(r.cdsStoreId), lines: r.lines.map((l) => ({ sku: l.sku, name: l.name, unitPrice: l.unitPrice, qty: l.acceptedQty ?? l.qty, orderedQty: s.orders.find((o) => o.id === r.orderId)?.lines.find((x) => x.sku === l.sku)?.qty ?? l.qty })), distributorName: n.d(r.distributorId), units: r.lines.reduce((a, l) => a + (l.acceptedQty ?? l.qty), 0), value: r.lines.reduce((a, l) => a + (l.acceptedQty ?? l.qty) * l.unitPrice, 0) })),
    collections: s.collections.filter((c) => c.tripId === t.id),
  };
});
/** Trip actions (start, OTP, complete, fail, returns) are not for the Service Centre: it plans, assigns and may cancel a planned trip;
 *  the delivery agent runs its trips in the Delivery Partner App (/cds/dp/*) with the CDS User, seller and retailer. */
const notForServiceCentre = (u: CdsUser) => {
  if (isSC(u)) throw new MockError(403, 'The delivery agent runs the trip in the Delivery Partner App with the CDS User, seller and retailer');
};
const tripWrite = (fn: (e: CdsEngine, t: Trip, body: any, by: string, req: MockRequest) => unknown, scAllowed = false) => (req: MockRequest) => {
  const u = sessionUser(req);
  const t = read((e) => e.trip(req.params.id));
  tripAccess(u, t, true);
  if (!scAllowed) notForServiceCentre(u);
  return cdsTx((e) => fn(e, e.trip(t.id), req.body ?? {}, `${u.name} (for ${t.deliveryPersonName})`, req));
};
route('POST', SVC, '/cds/trips/:id/start', tripWrite((e, t, _b, by) => e.startTrip(t.id, by)));
route('POST', SVC, '/cds/trips/:id/cancel', tripWrite((e, t, b, by, req) => {
  // the Service Centre cancels only planned trips (not started yet)
  if (isSC(sessionUser(req)) && !['PLANNED', 'ASSIGNED'].includes(t.status)) throw new CdsError(409, `${t.tripNo} has started; the delivery agent handles it now`);
  return e.cancelTrip(t.id, b.reason, by);
}, true));
route('POST', SVC, '/cds/trips/:id/resources', tripWrite((e, t, b, by) => e.updateTripResources(t.id, { vehicleId: b.vehicleId, deliveryPersonId: b.deliveryPersonId }, by), true));
route('POST', SVC, '/cds/trips/:id/helper', tripWrite((e, t, b, by) => e.updateTripHelper(t.id, b.helperId, by), true));
/** Sends the OTP to the counter-party. Demo: the SMS text is returned so the OTP can be read (`demoSms`). */
route('POST', SVC, '/cds/trips/:id/stops/:stopId/otp', tripWrite((e, t, _b, by, req) => {
  const o = e.sendOtp(t.id, req.params.stopId, by);
  return { otpId: o.id, sentToName: o.sentToName, sentToPhone: o.sentToPhone, expiresAt: o.expiresAt, demoSms: `Qwipo CDS: OTP ${o.code} for ${STOP_ACTION[o.purpose].label.toLowerCase()} on ${o.tripNo}. Share it with the delivery person only.` };
}));
route('POST', SVC, '/cds/trips/:id/stops/:stopId/complete', (req) => {
  const u = sessionUser(req);
  const t = read((e) => e.trip(req.params.id));
  tripAccess(u, t, true);
  notForServiceCentre(u);
  return completeStop(t.id, req.params.stopId, req.body ?? {}, `${u.name} (for ${t.deliveryPersonName})`);
});
route('POST', SVC, '/cds/trips/:id/stops/:stopId/fail', tripWrite((e, t, b, by, req) => e.failStop(t.id, req.params.stopId, b.reason, by)));
route('POST', SVC, '/cds/trips/:id/stops/:stopId/returns', tripWrite((e, t, b, by, req) => e.addReturnAtStop(t.id, req.params.stopId, b, by)));

/** OTP failures are saved (attempt count / lock) before the error is reported. */
function completeStop(tripId: string, stopId: string, body: StopInput, by: string) {
  const r = cdsTx((e) => e.completeStop(tripId, stopId, body, by));
  if (r.error) throw new MockError(r.error.status, r.error.message);
  return r.trip;
}

/** CDS User: OTPs sent to this CDS (handovers and pickups at the store) — to read out to the delivery person. */
route('GET', SVC, '/cds/otps/mine', (req) => {
  const u = need(req, ['cu-grn', 'cu-trips', 'cu-returns']);
  const s = engine().s;
  persist();
  return s.otps.filter((o) => o.sentToType === 'CDS' && o.sentToId === myStore(u) && o.status === 'ACTIVE').map((o) => {
    const t = s.trips.find((x) => x.id === o.tripId)!;
    return { ...o, deliveryPersonName: t.deliveryPersonName, vehicleRegNo: t.vehicleRegNo, label: STOP_ACTION[o.purpose].label };
  });
});

/** CDS User: Service Centre trips arriving at / collecting from this store. */
route('GET', SVC, '/cds/incoming', (req) => {
  const u = need(req, ['cu-grn', 'cu-returns']);
  const s = cdsState();
  const st = myStore(u);
  return s.trips.filter((t) => t.owner === 'SC' && t.status !== 'CANCELLED' && t.stops.some((x) => x.partyId === st && x.partyType === 'CDS'))
    .filter((t) => !req.query.type || t.type === req.query.type || (req.query.type === 'CDS_DELIVERY' && t.type === 'DISTRIBUTOR_PICKUP')) // pickup trips drop at the CDS
    .sort((a, b) => b.plannedDate.localeCompare(a.plannedDate)).slice(0, 30)
    .map((t) => {
      const x = t.stops.find((y) => y.partyId === st && y.partyType === 'CDS')!;
      return { tripId: t.id, tripNo: t.tripNo, type: t.type, status: t.status, plannedDate: t.plannedDate, deliveryPersonName: t.deliveryPersonName, deliveryPersonPhone: t.deliveryPersonPhone, vehicleRegNo: t.vehicleRegNo, stopStatus: x.status, verifiedAt: x.verifiedAt, units: x.lines.reduce((a, l) => a + l.plannedQty, 0), handled: x.lines.reduce((a, l) => a + (l.actualQty ?? 0), 0), orders: Array.from(new Set(x.lines.map((l) => l.orderId).filter(Boolean))).length, returns: Array.from(new Set(x.lines.map((l) => l.returnId).filter(Boolean))).length };
    });
});

// ---------------------------------------------------------------- GRN

route('POST', SVC, '/cds/grns/search', (req) => {
  const u = need(req, 'cu-grn');
  const b = req.body ?? {};
  const s = cdsState();
  const n = names(s);
  const rows = s.grns.filter((g) => g.cdsStoreId === myStore(u) && (!b.status || g.status === b.status) && (!b.distributorId || g.distributorId === b.distributorId))
    .map((g) => ({ ...g, distributorName: n.d(g.distributorId), cdsTripNo: s.trips.find((t) => t.id === g.cdsTripId)?.tripNo ?? '', pickupTripNos: g.pickupTripIds.map((id) => s.trips.find((t) => t.id === id)?.tripNo ?? ''), received: g.lines.reduce((a, l) => a + l.receivedQty, 0), dispatched: g.lines.reduce((a, l) => a + l.dispatchedQty, 0), issues: g.lines.some((l) => l.shortQty || l.excessQty || l.damagedQty) }))
    .filter((g) => has(b.search, g.grnNo, g.distributorName, g.cdsTripNo, ...g.lines.map((l) => l.orderNo)))
    .sort(newest);
  return page(rows, b);
});
route('GET', SVC, '/cds/grns/:id', (req) => {
  const u = need(req, 'cu-grn');
  const s = cdsState();
  const g = read((e) => e.grn(req.params.id));
  ownStore(u, g.cdsStoreId);
  const n = names(s);
  return { grn: g, distributor: s.distributors.find((d) => d.id === g.distributorId), store: s.stores.find((x) => x.id === g.cdsStoreId), cdsTrip: s.trips.find((t) => t.id === g.cdsTripId), pickupTrips: s.trips.filter((t) => g.pickupTripIds.includes(t.id)).map((t) => ({ id: t.id, tripNo: t.tripNo })), orders: s.orders.filter((o) => g.orderIds.includes(o.id)).map((o) => ({ id: o.id, orderNo: o.orderNo, status: o.status, retailerName: n.r(o.retailerId)?.name ?? '' })) };
});
route('POST', SVC, '/cds/grns/:id/complete', (req) => {
  const u = need(req, 'cu-grn');
  const g = read((e) => e.grn(req.params.id));
  ownStore(u, g.cdsStoreId);
  return cdsTx((e) => e.completeGrn(g.id, req.body ?? {}, u.name));
});

// ---------------------------------------------------------------- returns

route('POST', SVC, '/cds/returns/search', (req) => {
  const u = need(req, ['sc-returns', 'cu-returns', 'cu-delivery']);
  const b = req.body ?? {};
  const stores = scopeOf(u, b.cdsStoreId || undefined);
  const s = cdsState();
  const n = names(s);
  const rows = s.returns.filter((r) => stores.includes(r.cdsStoreId))
    .filter((r) => !b.statuses?.length || b.statuses.includes(r.status))
    .filter((r) => !b.distributorId || r.distributorId === b.distributorId)
    // not yet on a trip for its current leg: retailer pickup (initiated) or the return trip to the seller (at CDS)
    .filter((r) => !b.unplanned || (r.status === 'RETURN_INITIATED' ? !r.retailerTripId : !r.returnTripId))
    .map((r) => ({ ...r, retailerName: r.source === 'GRN' ? 'Damaged at GRN' : n.r(r.retailerId)?.name ?? '', distributorName: n.d(r.distributorId), storeName: n.st(r.cdsStoreId), units: r.lines.reduce((a, l) => a + l.qty, 0), accepted: r.lines.reduce((a, l) => a + (l.acceptedQty ?? 0), 0), weightKg: Math.round(r.lines.reduce((a, l) => a + (l.acceptedQty ?? l.qty) * l.unitWeightKg, 0) * 10) / 10 }))
    .filter((r) => has(b.search, r.returnNo, r.orderNo, r.retailerName, r.distributorName))
    .sort(newest);
  return page(rows, b);
});
route('POST', SVC, '/cds/returns', (req) => {
  const u = need(req, ['cu-returns', 'cu-orders']);
  const o = read((e) => e.order(req.body?.orderId));
  ownStore(u, o.cdsStoreId);
  return cdsTx((e) => e.initiateReturn(req.body, u.name));
});
route('POST', SVC, '/cds/returns/:id/cancel', (req) => {
  const u = need(req, 'cu-returns');
  const r = read((e) => e.ret(req.params.id));
  ownStore(u, r.cdsStoreId);
  return cdsTx((e) => e.cancelReturn(r.id, req.body?.reason, u.name));
});

// ---------------------------------------------------------------- collections & payments

route('POST', SVC, '/cds/collections/search', (req) => {
  const u = need(req, 'cu-collections');
  const b = req.body ?? {};
  const s = cdsState();
  const n = names(s);
  const rows = s.collections.filter((c) => c.cdsStoreId === myStore(u) && (!b.status || c.status === b.status))
    .map((c) => ({ ...c, retailerName: n.r(c.retailerId)?.name ?? '' }))
    .filter((c) => has(b.search, c.collectionNo, c.orderNo, c.retailerName, c.deliveryPersonName, c.tripNo))
    .sort((a, z) => z.collectedAt.localeCompare(a.collectedAt));
  return page(rows, b);
});
route('POST', SVC, '/cds/collections/receive', (req) => {
  const u = need(req, 'cu-collections');
  return cdsTx((e) => e.receiveCollections(myStore(u), req.body ?? {}, u.name));
});
route('POST', SVC, '/cds/collections/handover', (req) => {
  const u = need(req, 'cu-collections');
  return cdsTx((e) => e.handToQwipo(myStore(u), req.body?.ids, req.body?.ref, u.name));
});
route('POST', SVC, '/cds/collections/settle', (req) => {
  const u = need(req, 'cu-collections');
  return cdsTx((e) => e.recordSettlement(myStore(u), req.body?.ids, req.body?.ref, u.name));
});

// ---------------------------------------------------------------- retailers, stores, settings

route('GET', SVC, '/cds/retailers', (req) => {
  const u = need(req, 'cu-retailers');
  const s = cdsState();
  const st = s.stores.find((x) => x.id === myStore(u))!;
  return s.retailers.filter((r) => serviceStoreFor(s.stores, r)?.id === st.id).map((r) => {
    const os = s.orders.filter((o) => o.retailerId === r.id && o.cdsStoreId === st.id);
    return {
      ...r, orders: os.length, openOrders: os.filter((o) => !['DELIVERED', 'PARTIALLY_DELIVERED', 'RETURNED', 'CANCELLED'].includes(o.status)).length,
      deliveredValue: Math.round(os.reduce((a, o) => a + o.lines.reduce((b, l) => b + l.deliveredQty * l.unitPrice, 0), 0) * 100) / 100,
      returns: s.returns.filter((x) => x.retailerId === r.id && x.cdsStoreId === st.id).length,
      collected: Math.round(s.collections.filter((c) => c.retailerId === r.id && c.cdsStoreId === st.id).reduce((a, c) => a + c.amount, 0) * 100) / 100,
      lastOrder: os.map((o) => o.confirmedAt).sort().reverse()[0] ?? null,
    };
  }).sort((a, b) => b.orders - a.orders || a.name.localeCompare(b.name));
});

/** Service Centre: every retailer with the CDS store whose service area holds it (null → outside every area → 3PL). */
route('GET', SVC, '/cds/coverage', (req) => {
  need(req, 'sc-stores');
  const s = cdsState();
  return s.retailers.map((r) => {
    const os = s.orders.filter((o) => o.retailerId === r.id);
    return {
      id: r.id, code: r.code, name: r.name, ownerName: r.ownerName, phone: r.phone, locality: r.locality, address: r.address, lat: r.lat, lng: r.lng,
      storeId: serviceStoreFor(s.stores, r)?.id ?? null,
      orders: os.length, openOrders: os.filter((o) => !['DELIVERED', 'PARTIALLY_DELIVERED', 'RETURNED', 'CANCELLED'].includes(o.status)).length,
      lastOrder: os.map((o) => o.confirmedAt).sort().reverse()[0] ?? null,
    };
  });
});

route('GET', SVC, '/cds/stores', (req) => {
  const u = need(req, 'sc-stores');
  const s = cdsState();
  return s.stores.filter((x) => u.cdsStoreIds.includes(x.id)).map((st) => {
    const os = s.orders.filter((o) => o.cdsStoreId === st.id);
    const user = s.users.find((x) => x.role === 'CDS_USER' && x.cdsStoreIds.includes(st.id));
    return {
      ...st, user: user ? { name: user.name, mobile: user.mobile, active: user.active } : null,
      incoming: os.filter((o) => ['PICKUP_PLANNED', 'PICKED_UP', 'IN_TRANSIT_TO_CDS'].includes(o.status)).length,
      grnPending: s.grns.filter((g) => g.cdsStoreId === st.id && g.status === 'PENDING').length,
      ready: os.filter((o) => o.status === 'READY_FOR_DELIVERY').length,
      outForDelivery: os.filter((o) => o.status === 'OUT_FOR_DELIVERY').length,
      delivered: os.filter((o) => ['DELIVERED', 'PARTIALLY_DELIVERED'].includes(o.status)).length,
      returnsAtCds: s.returns.filter((r) => r.cdsStoreId === st.id && r.status === 'RECEIVED_AT_CDS').length,
      vehicles: s.vehicles.filter((v) => v.owner === st.id).length, deliveryPersons: s.deliveryPersons.filter((p) => p.owner === st.id).length,
    };
  });
});
/** Service Centre: a new CDS store with its service area (polygon). Areas Served come from the retailers inside it. */
route('POST', SVC, '/cds/stores', (req) => {
  const u = need(req, 'sc-stores');
  const b = req.body ?? {};
  const txt = (k: string) => String(b[k] ?? '').trim();
  return cdsTx((e) => {
    const code = txt('code').toUpperCase();
    if (!/^[A-Z0-9-]{3,12}$/.test(code)) throw new CdsError(400, 'Enter a store code of 3 to 12 letters, numbers or "-"');
    if (e.s.stores.some((x) => x.code === code)) throw new CdsError(409, `Store code ${code} already exists`);
    for (const [k, label] of [['name', 'store name'], ['address', 'address'], ['city', 'city'], ['state', 'state'], ['managerName', 'manager name']] as const) {
      if (!txt(k)) throw new CdsError(400, `Enter the ${label}`);
    }
    if (!/^[6-9]\d{9}$/.test(txt('managerPhone'))) throw new CdsError(400, 'Enter a valid 10-digit manager phone number');
    const lat = Number(b.lat);
    const lng = Number(b.lng);
    if (!(Math.abs(lat - 17.4) < 0.6 && Math.abs(lng - 78.5) < 0.6)) throw new CdsError(400, 'Enter a latitude and longitude inside the Hyderabad region (e.g. 17.43, 78.45)');
    const ring = b.polygon as unknown;
    const okRing = Array.isArray(ring) && ring.length >= 3 && ring.length <= 60 && ring.every((p) => Array.isArray(p) && p.length === 2 && Math.abs(Number(p[0]) - 17.4) < 1 && Math.abs(Number(p[1]) - 78.5) < 1);
    if (!okRing) throw new CdsError(400, 'Draw the service area with at least 3 points on the map');
    const polygon = (ring as [number, number][]).map(([la, ln]) => [Math.round(Number(la) * 1e6) / 1e6, Math.round(Number(ln) * 1e6) / 1e6] as [number, number]);
    // Areas Served: the localities of the retailers inside the service area (when none are sent).
    const sent = (Array.isArray(b.localities) ? b.localities : []).map((x: unknown) => String(x).trim()).filter(Boolean);
    const localities: string[] = sent.length ? sent : Array.from(new Set(e.s.retailers.filter((x) => pointInPolygon(x, polygon)).map((x) => x.locality).filter(Boolean))).sort();
    const st = {
      id: `cds-${code.toLowerCase().replace(/^cds-/, '')}-${Date.now().toString(36).slice(-4)}`, code, name: txt('name'), address: txt('address'), city: txt('city'), state: txt('state'),
      lat, lng, localities, polygon, managerName: txt('managerName'), managerPhone: txt('managerPhone'), active: true,
    };
    e.s.stores.push(st);
    e.s.users.filter((x) => x.role === 'SERVICE_CENTRE').forEach((x) => x.cdsStoreIds.push(st.id));
    e.audit('STORE', st.id, u.name, 'CREATED', `${st.code} ${st.name}`);
    return st;
  });
});
route('PUT', SVC, '/cds/stores/:id', (req) => {
  const u = need(req, 'sc-stores');
  scopeOf(u, req.params.id);
  return cdsTx((e) => {
    const st = e.store(req.params.id);
    const b = req.body ?? {};
    if (b.managerName !== undefined) {
      if (!String(b.managerName).trim()) throw new CdsError(400, 'Manager name is required');
      st.managerName = String(b.managerName).trim();
    }
    if (b.managerPhone !== undefined) {
      if (!/^[6-9]\d{9}$/.test(String(b.managerPhone))) throw new CdsError(400, 'Enter a valid 10-digit phone number');
      st.managerPhone = String(b.managerPhone);
    }
    if (b.polygon !== undefined) {
      const ring = b.polygon as unknown;
      const ok = Array.isArray(ring) && ring.length >= 3 && ring.length <= 60 && ring.every((p) => Array.isArray(p) && p.length === 2 && Math.abs(Number(p[0]) - 17.4) < 1 && Math.abs(Number(p[1]) - 78.5) < 1);
      if (!ok) throw new CdsError(400, 'Draw the service area with at least 3 points on the map');
      st.polygon = (ring as [number, number][]).map(([la, ln]) => [Math.round(Number(la) * 1e6) / 1e6, Math.round(Number(ln) * 1e6) / 1e6]);
    }
    if (b.active !== undefined) {
      if (!b.active && e.s.orders.some((o) => o.cdsStoreId === st.id && !['DELIVERED', 'PARTIALLY_DELIVERED', 'RETURNED', 'CANCELLED'].includes(o.status))) throw new CdsError(409, `${st.name} has open orders; it cannot be deactivated`);
      st.active = !!b.active;
    }
    e.audit('STORE', st.id, u.name, 'UPDATED', JSON.stringify(b));
    return st;
  });
});

route('GET', SVC, '/cds/fleet', (req) => {
  const u = need(req, ['sc-settings', 'cu-reports']);
  const s = cdsState();
  const owner = isSC(u) ? 'SC' : myStore(u);
  return { vehicles: s.vehicles.filter((v) => v.owner === owner), deliveryPersons: s.deliveryPersons.filter((p) => p.owner === owner), settings: s.settings };
});
route('POST', SVC, '/cds/fleet/:kind/:id/active', (req) => {
  const u = need(req, ['sc-settings', 'cu-reports']);
  const owner = isSC(u) ? 'SC' : myStore(u);
  return cdsTx((e) => {
    const list = req.params.kind === 'vehicles' ? e.s.vehicles : e.s.deliveryPersons;
    const x = list.find((v) => v.id === req.params.id && v.owner === owner);
    if (!x) throw new CdsError(404, 'Not found');
    const busy = e.s.trips.some((t) => ACTIVE_TRIP.includes(t.status) && (t.vehicleId === x.id || t.deliveryPersonId === x.id));
    if (!req.body?.active && busy) throw new CdsError(409, 'It is on an active trip');
    x.active = !!req.body?.active;
    e.audit('SETTINGS', x.id, u.name, x.active ? 'ACTIVATED' : 'DEACTIVATED');
    return x;
  });
});
route('POST', SVC, '/cds/fleet/:kind', (req) => {
  const u = need(req, ['sc-settings', 'cu-reports']);
  const owner = isSC(u) ? 'SC' : myStore(u);
  const b = req.body ?? {};
  return cdsTx((e) => {
    if (req.params.kind === 'vehicles') {
      if (!/^[A-Z]{2}\d{2}[A-Z]{1,3}\d{3,4}$/.test(String(b.regNo ?? '').toUpperCase().replace(/\s/g, ''))) throw new CdsError(400, 'Enter a valid registration number, e.g. TS08AB1234');
      if (!(Number(b.capacityKg) > 0)) throw new CdsError(400, 'Enter the capacity in kg');
      const regNo = String(b.regNo).toUpperCase().replace(/\s/g, '');
      if (e.s.vehicles.some((v) => v.regNo === regNo)) throw new CdsError(409, `${regNo} already exists`);
      const v = { id: `veh-${owner}-${Date.now().toString(36)}`, regNo, type: String(b.type || 'Pickup'), capacityKg: Number(b.capacityKg), owner, active: true };
      e.s.vehicles.push(v);
      return v;
    }
    if (!String(b.name ?? '').trim()) throw new CdsError(400, 'Enter the name');
    if (!/^[6-9]\d{9}$/.test(String(b.phone ?? ''))) throw new CdsError(400, 'Enter a valid 10-digit phone number');
    const p = { id: `dp-${owner}-${Date.now().toString(36)}`, name: String(b.name).trim(), phone: String(b.phone), owner, active: true };
    e.s.deliveryPersons.push(p);
    return p;
  });
});
route('PUT', SVC, '/cds/settings', (req) => {
  const u = need(req, 'sc-settings');
  const b = req.body ?? {};
  return cdsTx((e) => {
    const x = e.s.settings;
    if (b.otpExpiryMinutes !== undefined) {
      if (!(Number(b.otpExpiryMinutes) >= 2 && Number(b.otpExpiryMinutes) <= 60)) throw new CdsError(400, 'OTP validity must be 2–60 minutes');
      x.otpExpiryMinutes = Number(b.otpExpiryMinutes);
    }
    if (b.otpMaxAttempts !== undefined) {
      if (!(Number(b.otpMaxAttempts) >= 1 && Number(b.otpMaxAttempts) <= 10)) throw new CdsError(400, 'Attempts must be 1–10');
      x.otpMaxAttempts = Number(b.otpMaxAttempts);
    }
    if (b.nextDayPlanning !== undefined) x.nextDayPlanning = !!b.nextDayPlanning;
    for (const key of ['pickupRoute', 'returnRoute'] as const) {
      const r = b[key];
      if (r === undefined) continue;
      const n = (k: string) => Number(r?.[k]);
      if (!(n('serviceMinutes') >= 1 && n('serviceMinutes') <= 60)) throw new CdsError(400, 'Service time per stop must be 1–60 minutes');
      if (!(n('maxTravelHours') >= 0.5 && n('maxTravelHours') <= 24)) throw new CdsError(400, 'Max travel time must be 0.5–24 hours');
      if (!(Number.isInteger(n('maxCdsStops')) && n('maxCdsStops') >= 1 && n('maxCdsStops') <= 50)) throw new CdsError(400, 'Max CDS stops must be 1–50');
      if (!(Number.isInteger(n('maxDistributorStops')) && n('maxDistributorStops') >= 1 && n('maxDistributorStops') <= 50)) throw new CdsError(400, 'Max distributor stops must be 1–50');
      if (!['route_optimize', 'store_optimized', 'seller_optimized'].includes(String(r?.routeEngine))) throw new CdsError(400, 'Select a route engine');
      if (!(n('maxDistanceKm') >= 1 && n('maxDistanceKm') <= 500)) throw new CdsError(400, 'Max distance must be 1–500 km');
      if (!(n('maxWeightKg') >= 1 && n('maxWeightKg') <= 10000)) throw new CdsError(400, 'Max weight must be 1–10,000 kg');
      x[key] = { serviceMinutes: n('serviceMinutes'), maxTravelHours: n('maxTravelHours'), maxCdsStops: n('maxCdsStops'), maxDistributorStops: n('maxDistributorStops'), maxDistanceKm: n('maxDistanceKm'), maxWeightKg: n('maxWeightKg'), routeEngine: r.routeEngine, sellerOtp: r.sellerOtp !== false, cdsOtp: r.cdsOtp !== false };
    }
    e.audit('SETTINGS', 'settings', u.name, 'UPDATED', JSON.stringify(b));
    return x;
  });
});
route('GET', SVC, '/cds/audit', (req) => {
  sessionUser(req);
  return cdsState().audit.filter((a) => a.entityId === req.query.entityId).reverse();
});

// ---------------------------------------------------------------- integrations

/**
 * Seller Store order confirmation. deliveryType CDS → CDS Service Centre (this module); 3PL → forwarded unchanged
 * to the existing LBNP order intake (POST logistics-buyer-svc /orders), so the 3PL flow does not change.
 */
route('POST', SVC, '/cds/inbound/seller-orders', async (req) => {
  integration(req);
  const b = req.body ?? {};
  if (b.deliveryType === '3PL') {
    const token = (db().ext.auth as { token?: string } | undefined)?.token;
    if (!token) throw new MockError(503, 'LBNP is not reachable (no LBNP service session)');
    const res = await handleMockRequest('POST', 'mock://logistics-buyer-svc/api/v1/orders', b.lbnpOrder, { Authorization: `Bearer ${token}` });
    return { routedTo: 'LBNP', response: res };
  }
  if (b.deliveryType !== 'CDS') throw new MockError(400, 'deliveryType must be CDS or 3PL');
  return { routedTo: 'CDS', order: cdsTx((e) => e.allocateCdsOrder(b, 'Seller Store')) };
});

/** Delivery Partner App: trips assigned to a delivery person. */
route('GET', SVC, '/cds/dp/persons/:id/trips', (req) => {
  integration(req);
  const s = cdsState();
  return s.trips.filter((t) => t.deliveryPersonId === req.params.id && ACTIVE_TRIP.includes(t.status)).map((t) => tripView(s, t));
});
/** Delivery Partner App events (deduplicated by eventId): START · SEND_OTP · COMPLETE (with OTP) · FAIL. */
route('POST', SVC, '/cds/dp/trips/:id/events', (req) => {
  integration(req);
  const b = req.body ?? {};
  if (!b.eventId) throw new MockError(400, 'eventId is required');
  const s = cdsState();
  if (s.dpEventIds.includes(b.eventId)) return { duplicate: true };
  const t = read((e) => e.trip(req.params.id));
  if (t.deliveryPersonId !== b.deliveryPersonId) throw new MockError(403, 'This trip is assigned to another delivery person');
  const by = `${t.deliveryPersonName} (Delivery Partner App)`;
  const mark = () => { if (!cdsState().dpEventIds.includes(b.eventId)) cdsState().dpEventIds.push(b.eventId); persist(); };
  let out: unknown;
  switch (b.type) {
    case 'START': out = cdsTx((e) => e.startTrip(t.id, by)); break;
    case 'SEND_OTP': out = cdsTx((e) => { const o = e.sendOtp(t.id, b.stopId, by); return { otpId: o.id, sentToName: o.sentToName, sentToPhone: o.sentToPhone, expiresAt: o.expiresAt }; }); break;
    case 'COMPLETE': out = completeStop(t.id, b.stopId, b, by); break;
    case 'FAIL': out = cdsTx((e) => e.failStop(t.id, b.stopId, b.reason, by)); break;
    default: throw new MockError(400, 'type must be START, SEND_OTP, COMPLETE or FAIL');
  }
  mark();
  return { duplicate: false, result: out };
});

export const cdsToday = () => localDay(new Date());
