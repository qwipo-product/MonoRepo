// Mock endpoints for Settings & Reports (spec 08): /beats*, /beat_clusters*, /performance-report/download.
// Error bodies follow the backend shape `{ success:false, message, error:{ message } }` so the pages'
// `err.error.error.message` reads work. Server-side validation rules are not in the bundle (spec 08 §11);
// the ones below are plausible guards so every client error branch can be exercised.
import { db, nowIso, persist, uuid } from '../db';
import { ensureCdsTrips } from '../extensions/cds';
import { makeXlsx } from '../fileFactory';
import { MockError, route } from '../server';
import type { DbBeat, DbCluster, DbOrder, DbTrip, DbVehicle } from '../types';
import { getOrderStatusLabel, getTripStatusLabel } from '../../utils/helpers';

const BUYER = 'logistics-buyer-svc';

// ---------------------------------------------------------------- helpers
/** Same normalisation as the client duplicate check: case-insensitive, trailing dots/whitespace ignored. */
const normName = (s: string) => (s || '').trim().toLowerCase().replace(/[.\s]+$/, '');

function clusterOf(id: string | null | undefined): DbCluster | undefined {
  return id ? db().clusters.find((c) => c.id === id) : undefined;
}

function beatRow(b: DbBeat) {
  const c = clusterOf(b.clusterId);
  return {
    id: b.id,
    buyerId: b.buyerId,
    beatName: b.name,
    area: b.area ?? '',
    clusterId: c ? c.id : null,
    clusterName: c ? c.name : null,
    createdAt: b.createdAt,
    updatedAt: b.updatedAt,
  };
}

function clusterRow(c: DbCluster) {
  const beats = db().beats;
  return {
    id: c.id,
    buyerId: c.buyerId,
    name: c.name,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
    beats: c.beatIds
      .map((id) => beats.find((b) => b.id === id))
      .filter((b): b is DbBeat => !!b)
      .map((b) => ({ id: b.id, beatName: b.name })),
    vehicleIds: [...c.vehicleIds],
  };
}

/** Live `available-vehicles` shape (docs/specs/live-api-shapes.md) + assignment state. */
function vehicleRow(v: DbVehicle) {
  const assigned = db().clusters.find((c) => c.vehicleIds.includes(v.id));
  const overrides = (db().ext.settings?.vehicleOverrides || {})[v.id] || {};
  const state: 'available' | 'assigned' | 'inactive' = v.status === 'inactive' ? 'inactive' : assigned ? 'assigned' : 'available';
  return {
    id: v.id,
    sellerId: v.sellerId,
    vehicleTypeId: v.vehicleTypeId,
    name: v.name,
    registrationNumber: v.registrationNumber,
    make: v.make,
    model: v.model,
    manufacturingYear: v.manufacturingYear,
    weightCapacityKg: v.weightCapacityKg,
    volumetricCapacityKg: v.volumetricCapacityKg,
    insuranceNumber: null,
    insuranceExpiryDate: null,
    insuranceDocumentUrl: null,
    rcDocumentUrl: null,
    status: v.status,
    createdAt: v.createdAt,
    updatedAt: v.updatedAt,
    createdBy: 'system',
    updatedBy: 'system',
    length: v.length,
    height: v.height,
    breadth: v.breadth,
    ownershipType: v.ownershipType,
    amount: v.amount,
    isBulk: v.isBulk,
    relationshipType: v.relationshipType,
    ...overrides,
    assignedClusterId: assigned ? assigned.id : null,
    assignedClusterName: assigned ? assigned.name : null,
    state,
  };
}

function validateBeatInput(beatName: unknown, area: unknown) {
  const name = String(beatName ?? '').trim();
  if (!name) throw new MockError(400, 'Beat name is required');
  if (name.length < 3 || name.length > 50) throw new MockError(400, 'Beat name must be between 3 and 50 characters');
  const a = String(area ?? '').trim();
  if (a.length > 255) throw new MockError(400, 'Area cannot exceed 255 characters');
  return { name, area: a };
}

const sortBeats = (list: DbBeat[]) =>
  [...list].sort((a, b) => b.createdAt.localeCompare(a.createdAt) || a.name.localeCompare(b.name));

// ---------------------------------------------------------------- beats
route('GET', BUYER, '/beats', (req) => {
  const q = (req.query.search || '').trim().toLowerCase();
  let list = sortBeats(db().beats);
  if (q) list = list.filter((b) => b.name.toLowerCase().includes(q) || (b.area || '').toLowerCase().includes(q));
  const page = Math.max(1, parseInt(req.query.pageNumber || '1', 10) || 1);
  const size = Math.max(1, parseInt(req.query.pageSize || '25', 10) || 25);
  return { beats: list.slice((page - 1) * size, page * size).map(beatRow), totalCount: list.length };
});

route('POST', BUYER, '/beats/bulk', (req) => {
  const d = db();
  const items: any[] = Array.isArray(req.body?.beats) ? req.body.beats : [];
  if (!items.length) throw new MockError(400, 'No beats to import');
  const existing = new Set(d.beats.map((b) => normName(b.name)));
  const created: DbBeat[] = [];
  const skipped: { beatName: string; reason: string }[] = [];
  items.forEach((it) => {
    const name = String(it?.beatName ?? '').trim();
    const area = String(it?.area ?? '').trim();
    if (!name || name.length < 3 || name.length > 50 || area.length > 255) {
      skipped.push({ beatName: name, reason: 'invalid' });
      return;
    }
    if (existing.has(normName(name))) {
      skipped.push({ beatName: name, reason: 'duplicate' });
      return;
    }
    existing.add(normName(name));
    const at = nowIso();
    const beat: DbBeat = { id: uuid(), buyerId: d.buyer.id, name, area, clusterId: null, createdAt: at, updatedAt: at };
    created.push(beat);
  });
  d.beats.push(...created);
  persist();
  return { createdCount: created.length, skippedCount: skipped.length, skipped, beats: created.map(beatRow) };
});

route('POST', BUYER, '/beats', (req) => {
  const d = db();
  const { name, area } = validateBeatInput(req.body?.beatName, req.body?.area);
  if (d.beats.some((b) => normName(b.name) === normName(name))) throw new MockError(409, `Beat "${name}" already exists`);
  const at = nowIso();
  const beat: DbBeat = { id: uuid(), buyerId: d.buyer.id, name, area, clusterId: null, createdAt: at, updatedAt: at };
  d.beats.push(beat);
  persist();
  return beatRow(beat);
});

route('PUT', BUYER, '/beats/:id', (req) => {
  const d = db();
  const beat = d.beats.find((b) => b.id === req.params.id);
  if (!beat) throw new MockError(404, 'Beat not found');
  const { name, area } = validateBeatInput(req.body?.beatName, req.body?.area);
  if (d.beats.some((b) => b.id !== beat.id && normName(b.name) === normName(name))) throw new MockError(409, `Beat "${name}" already exists`);
  beat.name = name;
  beat.area = area;
  beat.updatedAt = nowIso();
  persist();
  return beatRow(beat);
});

route('DELETE', BUYER, '/beats/:id', (req) => {
  const d = db();
  const idx = d.beats.findIndex((b) => b.id === req.params.id);
  if (idx < 0) throw new MockError(404, 'Beat not found');
  const [beat] = d.beats.splice(idx, 1);
  // "It will be removed from the "<cluster>" cluster." — the server unlinks it from its cluster.
  d.clusters.forEach((c) => {
    if (c.beatIds.includes(beat.id)) {
      c.beatIds = c.beatIds.filter((id) => id !== beat.id);
      c.updatedAt = nowIso();
    }
  });
  persist();
  return { id: beat.id, deleted: true };
});

// ---------------------------------------------------------------- beat clusters
route('GET', BUYER, '/beat_clusters', (req) => {
  const q = (req.query.search || '').trim().toLowerCase();
  let list = [...db().clusters].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  if (q) list = list.filter((c) => c.name.toLowerCase().includes(q));
  return { clusters: list.map(clusterRow) };
});

// Registered before /beat_clusters/:id so "available-vehicles" is not taken as an id.
route('GET', BUYER, '/beat_clusters/available-vehicles', (req) => {
  const q = (req.query.search || '').trim().toLowerCase();
  let list = db().vehicles;
  if (q) list = list.filter((v) => v.registrationNumber.toLowerCase().includes(q));
  return { vehicles: list.map(vehicleRow) };
});

route('GET', BUYER, '/beat_clusters/:id', (req) => {
  const c = db().clusters.find((x) => x.id === req.params.id);
  if (!c) throw new MockError(404, 'Cluster not found');
  return clusterRow(c);
});

function validateClusterBody(body: any, editingId: string | null) {
  const d = db();
  const name = String(body?.name ?? '').trim();
  if (!name) throw new MockError(400, 'Cluster name is required');
  if (name.length < 3 || name.length > 50) throw new MockError(400, 'Cluster name must be between 3 and 50 characters');
  if (d.clusters.some((c) => c.id !== editingId && c.name.trim().toLowerCase() === name.toLowerCase())) {
    throw new MockError(409, `A cluster named "${name}" already exists`);
  }
  const beatIds: string[] = Array.isArray(body?.beatIds) ? body.beatIds.map(String) : [];
  const vehicleIds: string[] = Array.isArray(body?.vehicleIds) ? body.vehicleIds.map(String) : [];
  if (!beatIds.length) throw new MockError(400, 'Select at least one beat');
  if (!vehicleIds.length) throw new MockError(400, 'Select at least one vehicle');
  const current = editingId ? d.clusters.find((c) => c.id === editingId) : undefined;
  for (const id of beatIds) {
    const beat = d.beats.find((b) => b.id === id);
    if (!beat) throw new MockError(404, 'One or more selected beats were not found');
    const other = beat.clusterId && beat.clusterId !== editingId ? clusterOf(beat.clusterId) : undefined;
    if (other) throw new MockError(409, `Beat "${beat.name}" is already assigned to cluster "${other.name}"`);
  }
  for (const id of vehicleIds) {
    const v = d.vehicles.find((x) => x.id === id);
    if (!v) throw new MockError(404, 'One or more selected vehicles were not found');
    const other = d.clusters.find((c) => c.id !== editingId && c.vehicleIds.includes(id));
    if (other) throw new MockError(409, `Vehicle ${v.registrationNumber} is already assigned to cluster "${other.name}"`);
    if (v.status === 'inactive' && !current?.vehicleIds.includes(id)) throw new MockError(400, `Vehicle ${v.registrationNumber} is inactive`);
  }
  return { name, beatIds: Array.from(new Set(beatIds)), vehicleIds: Array.from(new Set(vehicleIds)) };
}

function linkBeats(cluster: DbCluster) {
  db().beats.forEach((b) => {
    if (cluster.beatIds.includes(b.id)) b.clusterId = cluster.id;
    else if (b.clusterId === cluster.id) b.clusterId = null;
  });
}

route('POST', BUYER, '/beat_clusters', (req) => {
  const d = db();
  const { name, beatIds, vehicleIds } = validateClusterBody(req.body, null);
  const at = nowIso();
  const cluster: DbCluster = { id: `c-${uuid()}`, buyerId: d.buyer.id, name, beatIds, vehicleIds, createdAt: at, updatedAt: at };
  d.clusters.push(cluster);
  linkBeats(cluster);
  persist();
  return clusterRow(cluster);
});

route('PUT', BUYER, '/beat_clusters/:id', (req) => {
  const d = db();
  const cluster = d.clusters.find((c) => c.id === req.params.id);
  if (!cluster) throw new MockError(404, 'Cluster not found');
  const { name, beatIds, vehicleIds } = validateClusterBody(req.body, cluster.id);
  Object.assign(cluster, { name, beatIds, vehicleIds, updatedAt: nowIso() });
  linkBeats(cluster);
  persist();
  return clusterRow(cluster);
});

route('DELETE', BUYER, '/beat_clusters/:id', (req) => {
  const d = db();
  const idx = d.clusters.findIndex((c) => c.id === req.params.id);
  if (idx < 0) throw new MockError(404, 'Cluster not found');
  const [cluster] = d.clusters.splice(idx, 1);
  d.beats.forEach((b) => b.clusterId === cluster.id && (b.clusterId = null)); // "Its beats will become available again."
  persist();
  return { id: cluster.id, deleted: true };
});

// ---------------------------------------------------------------- performance report
const IST_MS = 330 * 60000;
const istYmd = (iso: string) => new Date(new Date(iso).getTime() + IST_MS).toISOString().slice(0, 10);
const istDateTime = (iso: string | null) => (iso ? new Date(new Date(iso).getTime() + IST_MS).toISOString().slice(0, 16).replace('T', ' ') : '');
const r2 = (n: number) => Math.round(n * 100) / 100;
const isYmd = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s);

/** The Trips page tab a trip belongs to. The report has one sheet per tab, each with that tab's columns. */
const TRIP_TYPES = ['Direct Delivery', 'Consolidated Delivery', 'Consolidated Returns'] as const;
type TripType = (typeof TRIP_TYPES)[number];
const tripType = (t: DbTrip): TripType => (t.channel === 'cds' ? TRIP_TYPES[1] : t.channel === 'cds-returns' ? TRIP_TYPES[2] : TRIP_TYPES[0]);

/**
 * The goods a Consolidated Returns trip brings back: every item of a full return, the returned quantity of a
 * partial one. Weight in the orders' volumetric kg; value as on the trip (a full return at the item total, a
 * partial one at the selling price), so it matches the trip's Total Return Value.
 */
function returnedGoods(t: DbTrip, orderById: Map<string, DbOrder>) {
  let weight = 0;
  let value = 0;
  t.stops
    .filter((s) => s.deliveryType === 'Delivery' && (s.displayStatus === 'Returned' || s.displayStatus === 'Partial Return'))
    .forEach((s) => {
      const full = s.displayStatus === 'Returned';
      (s.orderIds || []).map((id) => orderById.get(id)).filter((o): o is DbOrder => !!o).forEach((o) => {
        const volPerKg = Number(o.orderWeight) ? (Number(o.volumetricWeight) || 0) / Number(o.orderWeight) : 1;
        o.items.forEach((it) => {
          const qty = full ? it.quantity : Math.min(it.quantity, Number(it.returnedQuantity) || 0);
          weight += qty * (Number(it.weightKg) || 0) * volPerKg;
          value += full ? it.totalAmount : qty * it.sellingPrice;
        });
      });
    });
  return { weight: r2(weight), value: r2(value) };
}

/**
 * Order counts of one trip row. Direct Delivery: from the orders' status (as-built). Consolidated trips: from the
 * trip's own stops, so each returned order counts once — on its Consolidated Returns trip. A Consolidated Delivery
 * trip counts the orders handed over to the CDS service center as delivered, and has no returns.
 */
function tripOrderCounts(t: DbTrip, tOrders: DbOrder[]) {
  if (!t.channel) {
    const delivered = tOrders.filter((o) => o.orderStatusId === 5).length;
    const partial = tOrders.filter((o) => o.orderStatusId === 6).length;
    const returned = tOrders.filter((o) => o.orderStatusId === 8).length;
    return { delivered, partial, returned, pending: Math.max(0, tOrders.length - delivered - partial - returned) };
  }
  const drops = t.stops.filter((s) => s.deliveryType === 'Delivery');
  const ordersWhere = (match: (s: (typeof drops)[number]) => boolean) => drops.filter(match).reduce((n, s) => n + (s.orderIds?.length || 0), 0);
  if (t.channel === 'cds') {
    const delivered = ordersWhere((s) => s.status === 'Order-delivered');
    return { delivered, partial: 0, returned: 0, pending: Math.max(0, tOrders.length - delivered) };
  }
  const returned = ordersWhere((s) => s.displayStatus === 'Returned');
  const partial = ordersWhere((s) => s.displayStatus === 'Partial Return');
  return { delivered: 0, partial, returned, pending: Math.max(0, tOrders.length - returned - partial) };
}

/**
 * GET /performance-report/download?startDate&endDate&buyerId → XLSX blob.
 *  • no trips and no orders in the range        → 404 (UI: "No records found for the selected period.")
 *  • missing/invalid params (e.g. empty buyerId) → 400 (same UI text)
 *  • range longer than 366 days                  → 200 with a JSON blob (UI downloads nothing but still shows success — as-built)
 */
route('GET', BUYER, '/performance-report/download', (req) => {
  const { startDate = '', endDate = '', buyerId = '' } = req.query;
  if (!buyerId) throw new MockError(400, 'buyerId is required');
  if (!isYmd(startDate) || !isYmd(endDate)) throw new MockError(400, 'startDate and endDate must be YYYY-MM-DD');
  if (endDate < startDate) throw new MockError(400, 'endDate cannot be before startDate');
  const days = (Date.parse(endDate) - Date.parse(startDate)) / 86400000 + 1;
  if (days > 366) {
    return new Blob([JSON.stringify({ success: true, data: null, message: 'Date range too large. Maximum range is 366 days.' })], { type: 'application/json' });
  }

  const d = db();
  // A browser that opens Reports before the Trips page still gets the consolidated trips (see extensions/cds.ts).
  if (ensureCdsTrips(d)) persist();
  const inRange = (iso: string) => {
    const day = istYmd(iso);
    return day >= startDate && day <= endDate;
  };
  const trips = d.trips.filter((t) => inRange(t.createdAt)).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const orders = d.orders.filter((o) => inRange(o.createdAt)).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  if (!trips.length && !orders.length) throw new MockError(404, 'No records found for the selected period');

  const orderById = new Map(d.orders.map((o) => [o.orderId, o]));
  const tripById = new Map(d.trips.map((t) => [t.logisticsOrderId, t]));

  const tripsOf = (type: TripType) => trips.filter((t) => tripType(t) === type);
  const ordersOf = (t: DbTrip) => t.orderIds.map((id) => orderById.get(id)).filter((o): o is DbOrder => !!o);
  const tripInfo = (t: DbTrip) => ({
    'Trip Number': t.orderId,
    'Trip Date': istDateTime(t.createdAt),
    Provider: t.providerName,
    'Vehicle Number': t.vehicleRegNumber || '',
    'Driver Name': t.agentName || '',
    'Trip Status': getTripStatusLabel(t.status) || String(t.status),
  });
  const tripTimes = (t: DbTrip) => ({ 'Start Time': istDateTime(t.startTime), 'End Time': istDateTime(t.endTime) });
  const orderWeight = (os: DbOrder[]) => r2(os.reduce((s, o) => s + (o.volumetricWeight || 0), 0));
  const orderValue = (os: DbOrder[]) => r2(os.reduce((s, o) => s + (o.amount || 0), 0));

  // Direct Delivery (3PL trips): the as-built columns.
  const directRows = tripsOf('Direct Delivery').map((t) => {
    const tOrders = ordersOf(t);
    const { delivered, partial, returned, pending } = tripOrderCounts(t, tOrders);
    const volWeight = orderWeight(tOrders);
    const capacity = Number(t.vehicleVolumetricCapacityKg) || 0;
    return {
      ...tripInfo(t),
      'Total Drop Points': t.stops.filter((s) => s.deliveryType === 'Delivery').length,
      'Total Orders': tOrders.length,
      Delivered: delivered,
      'Partial Return': partial,
      Returned: returned,
      Pending: pending,
      'Planned KMs': Number(t.totalDistance) || 0,
      'Vol. Weight (Kgs)': volWeight,
      'Vehicle Capacity (Kgs)': capacity,
      'Capacity Utilisation (%)': capacity ? r2((volWeight / capacity) * 100) : 0,
      'Total Sale Value (Rs)': orderValue(tOrders),
      'Trip Charges (Rs)': Number(t.deliveryPrice) || 0,
      ...tripTimes(t),
    };
  });
  // Consolidated Delivery (pickup from the distributor): as on its Trips tab, no route, capacity or charge columns.
  const deliveryRows = tripsOf('Consolidated Delivery').map((t) => {
    const tOrders = ordersOf(t);
    const { delivered, pending } = tripOrderCounts(t, tOrders);
    return {
      ...tripInfo(t),
      'Total Orders': tOrders.length,
      'Handed Over': delivered,
      Pending: pending,
      'Vol. Weight (Kgs)': orderWeight(tOrders),
      'Total Sale Value (Rs)': orderValue(tOrders),
      ...tripTimes(t),
    };
  });
  // Consolidated Returns: the returned goods only (weight and value), as on its Trips tab.
  const returnRows = tripsOf('Consolidated Returns').map((t) => {
    const tOrders = ordersOf(t);
    const { returned, partial } = tripOrderCounts(t, tOrders);
    const goods = returnedGoods(t, orderById);
    return {
      ...tripInfo(t),
      'Total Orders': tOrders.length,
      Returned: returned,
      'Partial Return': partial,
      'Returned Weight (Kgs)': goods.weight,
      'Total Return Value (Rs)': goods.value,
      ...tripTimes(t),
    };
  });

  const orderRows = orders.map((o) => ({
    'Order ID': o.refOrderId,
    'Order Date': istDateTime(o.createdAt),
    'Customer Name': o.customerBusinessName,
    'Mobile Number': o.customerMobileNumber,
    Beat: o.salesBeatName || 'N/A',
    'Order Status': getOrderStatusLabel(o.orderStatusId) || String(o.orderStatusId),
    'Order Value (Rs)': o.amount,
    'Vol. Weight (Kgs)': o.volumetricWeight,
    'Trip Number': o.tripId ? tripById.get(o.tripId)?.orderId || '' : '',
  }));

  const completed = trips.filter((t) => t.status === 3).length;
  const cancelled = trips.filter((t) => t.status === 4).length;
  const deliveredOrders = orders.filter((o) => o.orderStatusId === 5).length;
  const returnedOrders = orders.filter((o) => o.orderStatusId === 8 || o.orderStatusId === 6).length;
  const closedOrders = deliveredOrders + returnedOrders;
  const summary: unknown[][] = [
    ['Performance Report'],
    ['Business', d.buyer.businessName],
    ['Report Period', `${startDate} to ${endDate}`],
    ['Generated At', istDateTime(nowIso())],
    [],
    ['Metric', 'Value'],
    ['Total Trips', trips.length],
    ['Completed Trips', completed],
    ['Cancelled Trips', cancelled],
    ['Total Orders', orders.length],
    ['Delivered Orders', deliveredOrders],
    ['Returned / Partial Return Orders', returnedOrders],
    ['Delivery Success Rate (%)', closedOrders ? r2((deliveredOrders / closedOrders) * 100) : 0],
    ['Total Order Value (Rs)', r2(orders.reduce((s, o) => s + (o.amount || 0), 0))],
    // Planned KMs and trip charges belong to Direct Delivery trips only (the consolidated tabs do not show them).
    ['Total Planned KMs (Direct Delivery)', r2(tripsOf('Direct Delivery').reduce((s, t) => s + (Number(t.totalDistance) || 0), 0))],
    ['Total Trip Charges (Direct Delivery, Rs)', r2(tripsOf('Direct Delivery').reduce((s, t) => s + (Number(t.deliveryPrice) || 0), 0))],
    ['Total Return Value (Consolidated Returns, Rs)', r2(returnRows.reduce((s, r) => s + r['Total Return Value (Rs)'], 0))],
    [],
    ['Trip Type', 'Trips', 'Completed Trips'],
    ...TRIP_TYPES.map((type) => [type, tripsOf(type).length, tripsOf(type).filter((t) => t.status === 3).length]),
  ];

  const blob = makeXlsx([
    { name: 'Summary', rows: summary },
    { name: 'Direct Delivery', rows: directRows.length ? directRows : [['No direct delivery trips in the selected period']] },
    { name: 'Consolidated Delivery', rows: deliveryRows.length ? deliveryRows : [['No consolidated delivery trips in the selected period']] },
    { name: 'Consolidated Returns', rows: returnRows.length ? returnRows : [['No consolidated return trips in the selected period']] },
    { name: 'Orders', rows: orderRows.length ? orderRows : [['No orders in the selected period']] },
  ]);
  return Object.assign(blob, { contentDisposition: 'attachment; filename="Performance_Report.xlsx"' });
});
