// Cross-dock mock endpoints (Service Centre and Cross Dock Store). Data lives in db().ext.crossDock and is re-seeded
// when the day changes, the version changes or the mock panel resets the data. Rule violations → HTTP 422.
import { db, nowIso, persist } from '../db';
import { MockError, route } from '../server';
import {
  addDays, addDeposit, cancelPlan, cancelRun, cancelTrip, cashDay, completeRunStop, completeStop, confirmGrn, createDeliveryPlans, createPickupPlans,
  createReturnPlan, customerLines, daySummary, generateFromPlan, grnView, inboundTrucks, orderRow, planRow, productLines, returnRow, riderBusy,
  runRow, seedCrossDock, slotDate, startRun, startTrip, storeToday, tripRow, vehicleBusy, XD_VERSION, XdRuleError, YARD, ymd, type CrossDockState,
} from '../crossDock/state';
import type { DepositMode, PickupRound, TripSlot, VehicleType, XdOverview, XdSettings, XdStoreOverview } from '../../types/crossDock';

const SVC = 'logistics-buyer-svc';

function xd(): CrossDockState {
  const d = db();
  const today = ymd(new Date());
  let s = d.ext.crossDock as CrossDockState | undefined;
  if (!s || s.version !== XD_VERSION || s.operatingDate !== today) {
    s = seedCrossDock(new Date());
    d.ext.crossDock = s;
    persist();
  }
  return s;
}

/** Runs a mutation; business-rule errors become 422 with the rule's message. */
function mutate<T>(fn: (s: CrossDockState) => T): T {
  try {
    const out = fn(xd());
    persist();
    return out;
  } catch (e) {
    if (e instanceof XdRuleError) throw new MockError(422, e.message);
    throw e;
  }
}
/** Reads that can hit a rule (e.g. unknown id) → 404 with the message. */
function read<T>(fn: (s: CrossDockState) => T): T {
  try {
    return fn(xd());
  } catch (e) {
    if (e instanceof XdRuleError) throw new MockError(404, e.message);
    throw e;
  }
}

const list = (v?: string) => (v ? v.split(',').map((x) => x.trim()).filter(Boolean) : []);
const matches = (q: string, ...fields: (string | null | undefined)[]) => !q || fields.some((f) => (f ?? '').toLowerCase().includes(q));

// ================================================================== Service Centre

route('GET', SVC, '/cross-dock/overview', (): XdOverview => {
  const s = xd();
  return {
    operatingDate: s.operatingDate,
    deliveryDate: s.deliveryDate,
    yard: YARD,
    distributors: s.distributors,
    cdss: s.cdss,
    retailers: s.retailers,
    vehicles: s.vehicles,
    drivers: s.drivers,
    settings: s.settings,
  };
});

route('GET', SVC, '/cross-dock/orders', (req) => {
  const s = xd();
  const statuses = list(req.query.status);
  const q = (req.query.search || '').trim().toLowerCase();
  return s.orders
    // The Service Centre works today's batch (delivery tomorrow) unless asked for everything.
    .filter((o) => req.query.scope === 'all' || o.deliveryDate === s.deliveryDate)
    .filter((o) => !statuses.length || statuses.includes(o.status))
    .filter((o) => !req.query.distributorId || o.distributorId === req.query.distributorId)
    .filter((o) => !req.query.cdsId || o.cdsId === req.query.cdsId)
    .map((o) => orderRow(s, o))
    .filter((o) => matches(q, o.orderNo, o.invoiceNo, o.retailerName, o.distributorName, o.cdsName, o.tripNo))
    .sort((a, b) => a.acceptedAt.localeCompare(b.acceptedAt));
});

route('GET', SVC, '/cross-dock/returns', (req) => {
  const s = xd();
  const statuses = list(req.query.status);
  return s.returns
    .filter((x) => !statuses.length || statuses.includes(x.status))
    .map((x) => returnRow(s, x))
    .sort((a, b) => a.heldSince.localeCompare(b.heldSince));
});

route('GET', SVC, '/cross-dock/trips', (req) => {
  const s = xd();
  const statuses = list(req.query.status);
  return s.trips
    .filter((t) => !req.query.kind || t.kind === req.query.kind)
    .filter((t) => !statuses.length || statuses.includes(t.status))
    .map((t) => tripRow(s, t))
    .sort((a, b) => (b.date + b.createdAt).localeCompare(a.date + a.createdAt));
});

route('GET', SVC, '/cross-dock/trips/:id', (req) =>
  read((s) => {
    const t = s.trips.find((x) => x.id === req.params.id);
    if (!t) throw new XdRuleError('Trip not found');
    const orderIds = [...new Set(t.stops.flatMap((st) => st.orderIds))];
    const returnIds = new Set(t.stops.flatMap((st) => st.returnIds));
    return {
      trip: tripRow(s, t),
      orders: orderIds.map((id) => orderRow(s, s.orders.find((o) => o.id === id)!)),
      returns: s.returns.filter((x) => returnIds.has(x.id)).map((x) => returnRow(s, x)),
      products: productLines(s, orderIds),
      customers: customerLines(s, orderIds),
    };
  }),
);

route('POST', SVC, '/cross-dock/trips/:id/start', (req) => mutate((s) => tripRow(s, startTrip(s, req.params.id, nowIso()))));
/** Body { otp } for a drop at a store: the driver enters the store's OTP (after its GRN). */
route('POST', SVC, '/cross-dock/trips/:id/stops/:seq/complete', (req) =>
  mutate((s) => tripRow(s, completeStop(s, req.params.id, Number(req.params.seq), nowIso(), req.body?.otp))),
);
route('POST', SVC, '/cross-dock/trips/:id/cancel', (req) => mutate((s) => tripRow(s, cancelTrip(s, req.params.id, nowIso()))));

// ---- route plans (pickup / return)

route('GET', SVC, '/cross-dock/plans', (req) => {
  const s = xd();
  return s.plans
    .filter((p) => !p.cdsId && (!req.query.kind || p.kind === req.query.kind))
    .map((p) => planRow(s, p))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
});
route('GET', SVC, '/cross-dock/plans/:id', (req) =>
  read((s) => {
    const p = s.plans.find((x) => x.id === req.params.id);
    if (!p) throw new XdRuleError('Route not found');
    return planRow(s, p);
  }),
);
route('POST', SVC, '/cross-dock/plans/pickup', (req) => {
  const { slot, orderIds } = req.body || {};
  if (!['R1', 'R2', 'EARLY_AM'].includes(slot)) throw new MockError(400, 'Choose a pickup round.');
  return mutate((s) => createPickupPlans(s, { slot: slot as PickupRound, orderIds: orderIds || [], now: nowIso() }).map((p) => planRow(s, p)));
});
route('POST', SVC, '/cross-dock/plans/return', (req) =>
  mutate((s) => {
    const { returnIds, date } = req.body || {};
    if (date !== s.operatingDate && date !== s.deliveryDate) throw new XdRuleError('Returns can be planned for today or tomorrow.');
    return [planRow(s, createReturnPlan(s, { returnIds: returnIds || [], date, now: nowIso() }))];
  }),
);
route('POST', SVC, '/cross-dock/plans/:id/generate', (req) =>
  mutate((s) => {
    const out = generateFromPlan(s, req.params.id, nowIso());
    return { plan: planRow(s, s.plans.find((p) => p.id === req.params.id)!), tripId: out.id };
  }),
);
route('POST', SVC, '/cross-dock/plans/:id/cancel', (req) => mutate((s) => planRow(s, cancelPlan(s, req.params.id, nowIso()))));

/** Vehicles with their driver and, for a date + slot, the trip that already uses them. */
route('GET', SVC, '/cross-dock/vehicles', (req) => {
  const s = xd();
  const slot = (req.query.slot || '') as TripSlot;
  const date = req.query.date || (slot ? slotDate(s, slot) : s.operatingDate);
  return s.vehicles.map((v) => {
    const busy = slot ? vehicleBusy(s, v.id, date, slot) : undefined;
    const drv = s.drivers.find((d) => d.id === v.driverId);
    return { ...v, driverName: drv?.name ?? '', driverPhone: drv?.phone ?? '', busyTripNo: busy?.tripNo ?? null };
  });
});

route('POST', SVC, '/cross-dock/vehicles', (req) => {
  const b = req.body || {};
  return mutate((s) => {
    const regNo = String(b.regNo || '').trim().toUpperCase();
    if (!/^[A-Z]{2} ?\d{2} ?[A-Z]{1,3} ?\d{3,4}$/.test(regNo)) throw new XdRuleError('Enter a registration number like TS 09 UC 4521.');
    if (s.vehicles.some((v) => v.regNo.replace(/ /g, '') === regNo.replace(/ /g, ''))) throw new XdRuleError(`${regNo} is already in the fleet.`);
    const capacityKg = Number(b.capacityKg);
    if (!(capacityKg > 0 && capacityKg <= 5000)) throw new XdRuleError('Capacity must be between 1 and 5,000 kg.');
    if (!String(b.driverName || '').trim()) throw new XdRuleError('Enter the driver’s name.');
    if (!/^[6-9]\d{9}$/.test(String(b.driverPhone || ''))) throw new XdRuleError('Enter the driver’s 10-digit mobile number.');
    const driver = { id: `drv-${s.drivers.length + 1}-${Date.now().toString(36)}`, name: String(b.driverName).trim(), phone: String(b.driverPhone) };
    s.drivers.push(driver);
    const v = {
      id: `veh-${s.vehicles.length + 1}-${Date.now().toString(36)}`,
      regNo,
      type: (b.type === 'FOUR_WHEELER' ? 'FOUR_WHEELER' : 'THREE_WHEELER') as VehicleType,
      model: String(b.model || '').trim() || (b.type === 'FOUR_WHEELER' ? 'Mini truck' : 'Three-wheeler cargo'),
      capacityKg,
      driverId: driver.id,
      active: true,
    };
    s.vehicles.push(v);
    return v;
  });
});

route('PATCH', SVC, '/cross-dock/vehicles/:id', (req) =>
  mutate((s) => {
    const v = s.vehicles.find((x) => x.id === req.params.id);
    if (!v) throw new XdRuleError('Vehicle not found.');
    if (typeof req.body?.active === 'boolean') {
      if (!req.body.active && s.trips.some((t) => t.vehicleId === v.id && (t.status === 'PLANNED' || t.status === 'IN_PROGRESS'))) {
        throw new XdRuleError(`${v.regNo} has a planned or running trip. Finish or cancel it first.`);
      }
      v.active = req.body.active;
    }
    return v;
  }),
);

route('GET', SVC, '/cross-dock/reports', () => {
  const s = xd();
  return { days: [...s.history, ...daySummary(s, addDays(s.operatingDate, -1)), ...daySummary(s, s.operatingDate)] };
});

route('PUT', SVC, '/cross-dock/settings', (req) =>
  mutate((s) => {
    const next = req.body as XdSettings;
    const hhmm = /^([01]\d|2[0-3]):[0-5]\d$/;
    if (!next?.serviceCentre?.name?.trim()) throw new XdRuleError('Enter the Service Centre name.');
    if (!/^[6-9]\d{9}$/.test(next.serviceCentre.phone || '')) throw new XdRuleError('Enter a 10-digit mobile number.');
    if (!hhmm.test(next.orderCutoff)) throw new XdRuleError('Enter the order cut-off as HH:mm.');
    for (const w of next.windows || []) {
      if (!hhmm.test(w.start) || !hhmm.test(w.end) || w.start >= w.end) throw new XdRuleError(`${w.label}: the start must be before the end.`);
    }
    s.settings = { ...s.settings, ...next, windows: next.windows ?? s.settings.windows };
    return s.settings;
  }),
);

// ================================================================== Cross Dock Store (by store code, e.g. CDS-KPHB)

function store(s: CrossDockState, code: string) {
  const c = s.cdss.find((x) => x.code === code);
  if (!c) throw new MockError(404, 'Store not found');
  return c;
}
const ST = '/cross-dock/store/:code';

route('GET', SVC, `${ST}/overview`, (req): XdStoreOverview => {
  const s = xd();
  const c = store(s, req.params.code);
  return {
    operatingDate: s.operatingDate,
    store: c,
    riders: s.riders.filter((x) => x.cdsId === c.id),
    retailers: s.retailers.filter((x) => x.cdsId === c.id),
    distributors: s.distributors,
    settings: s.settings,
  };
});

/** Every order for this store: on the way, at the store, out, delivered, returned. */
route('GET', SVC, `${ST}/orders`, (req) => {
  const s = xd();
  const c = store(s, req.params.code);
  const statuses = list(req.query.status);
  return s.orders
    .filter((o) => o.cdsId === c.id && o.status !== 'ACCEPTED' && o.status !== 'DIRECT_DELIVERY')
    .filter((o) => !statuses.length || statuses.includes(o.status))
    .map((o) => orderRow(s, o))
    .sort((a, b) => a.acceptedAt.localeCompare(b.acceptedAt));
});

// ---- inward: Service Centre trucks and their GRN

route('GET', SVC, `${ST}/inbound`, (req) => {
  const s = xd();
  return inboundTrucks(s, store(s, req.params.code).id);
});
route('GET', SVC, `${ST}/inbound/:tripId`, (req) => read((s) => grnView(s, store(s, req.params.code).id, req.params.tripId)));
/** Body { lines: [{ sku, received, damaged }], note }. Unlisted products count as received in full. */
route('POST', SVC, `${ST}/inbound/:tripId/grn`, (req) =>
  mutate((s) => {
    const c = store(s, req.params.code);
    const truck = inboundTrucks(s, c.id).find((x) => x.tripId === req.params.tripId);
    if (!truck) throw new XdRuleError('Truck not found for this store.');
    confirmGrn(s, truck.tripId, truck.seq, { lines: req.body?.lines ?? [], note: req.body?.note ?? '' }, nowIso());
    return grnView(s, c.id, truck.tripId);
  }),
);
/** The driver enters the store's OTP (Service Centre driver app, simulated here). */
route('POST', SVC, `${ST}/inbound/:tripId/otp`, (req) =>
  mutate((s) => {
    const c = store(s, req.params.code);
    const truck = inboundTrucks(s, c.id).find((x) => x.tripId === req.params.tripId);
    if (!truck) throw new XdRuleError('Truck not found for this store.');
    completeStop(s, truck.tripId, truck.seq, nowIso(), req.body?.otp);
    return grnView(s, c.id, truck.tripId);
  }),
);

// ---- delivery planning: route plans → Generate Trip → rider run

route('GET', SVC, `${ST}/plans`, (req) => {
  const s = xd();
  const c = store(s, req.params.code);
  return s.plans.filter((p) => p.cdsId === c.id).map((p) => planRow(s, p)).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
});
route('GET', SVC, `${ST}/plans/:id`, (req) =>
  read((s) => {
    const c = store(s, req.params.code);
    const p = s.plans.find((x) => x.id === req.params.id && x.cdsId === c.id);
    if (!p) throw new XdRuleError('Route not found');
    return planRow(s, p);
  }),
);
route('POST', SVC, `${ST}/plans`, (req) =>
  mutate((s) => createDeliveryPlans(s, store(s, req.params.code).id, { date: req.body?.date, orderIds: req.body?.orderIds ?? [], now: nowIso() }).map((p) => planRow(s, p))),
);
route('POST', SVC, `${ST}/plans/:id/generate`, (req) =>
  mutate((s) => {
    store(s, req.params.code);
    const out = generateFromPlan(s, req.params.id, nowIso());
    return { plan: planRow(s, s.plans.find((p) => p.id === req.params.id)!), tripId: out.id };
  }),
);
route('POST', SVC, `${ST}/plans/:id/cancel`, (req) => mutate((s) => planRow(s, cancelPlan(s, req.params.id, nowIso()))));

// ---- riders

route('GET', SVC, `${ST}/riders`, (req) => {
  const s = xd();
  const c = store(s, req.params.code);
  return s.riders.filter((x) => x.cdsId === c.id).map((x) => ({ ...x, busyRunNo: riderBusy(s, x.id)?.runNo ?? null }));
});

route('POST', SVC, `${ST}/riders`, (req) =>
  mutate((s) => {
    const c = store(s, req.params.code);
    const b = req.body || {};
    const name = String(b.name || '').trim();
    const reg = String(b.vehicleRegNo || '').trim().toUpperCase();
    if (!name) throw new XdRuleError('Enter the rider’s name.');
    if (!/^[6-9]\d{9}$/.test(String(b.phone || ''))) throw new XdRuleError('Enter the rider’s 10-digit mobile number.');
    if (!/^[A-Z]{2} ?\d{2} ?[A-Z]{1,3} ?\d{3,4}$/.test(reg)) throw new XdRuleError('Enter the two-wheeler number like TS 08 EK 4410.');
    if (s.riders.some((x) => x.phone === b.phone)) throw new XdRuleError('A rider with this mobile number already exists.');
    const rider = { id: `rider-${c.code}-${Date.now().toString(36)}`, cdsId: c.id, name, phone: String(b.phone), vehicleRegNo: reg, active: true };
    s.riders.push(rider);
    return rider;
  }),
);

route('PATCH', SVC, `${ST}/riders/:id`, (req) =>
  mutate((s) => {
    const c = store(s, req.params.code);
    const rider = s.riders.find((x) => x.id === req.params.id && x.cdsId === c.id);
    if (!rider) throw new XdRuleError('Rider not found.');
    if (typeof req.body?.active === 'boolean') {
      const busy = riderBusy(s, rider.id);
      if (!req.body.active && busy) throw new XdRuleError(`${rider.name} is on run ${busy.runNo}. Finish or cancel it first.`);
      rider.active = req.body.active;
    }
    return rider;
  }),
);

// ---- rider runs (the store's trips)

route('GET', SVC, `${ST}/runs`, (req) => {
  const s = xd();
  const c = store(s, req.params.code);
  return s.runs.filter((x) => x.cdsId === c.id).map((x) => runRow(s, x)).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
});

route('GET', SVC, `${ST}/runs/:id`, (req) =>
  read((s) => {
    const c = store(s, req.params.code);
    const run = s.runs.find((x) => x.id === req.params.id && x.cdsId === c.id);
    if (!run) throw new XdRuleError('Run not found');
    const orderIds = run.stops.flatMap((st) => st.orderIds);
    return { run: runRow(s, run), products: productLines(s, orderIds), customers: customerLines(s, orderIds) };
  }),
);

route('POST', SVC, `${ST}/runs/:id/start`, (req) => mutate((s) => runRow(s, startRun(s, req.params.id, nowIso()))));
route('POST', SVC, `${ST}/runs/:id/cancel`, (req) => mutate((s) => runRow(s, cancelRun(s, req.params.id, nowIso()))));
/** Body { cash, upi, returned: [{ orderId, reason }], otp }: the rider's update from the Field Agent App. */
route('POST', SVC, `${ST}/runs/:id/stops/:seq/complete`, (req) =>
  mutate((s) =>
    runRow(s, completeRunStop(s, req.params.id, Number(req.params.seq), { cash: req.body?.cash, upi: req.body?.upi, returned: req.body?.returned ?? [], otp: req.body?.otp }, nowIso())),
  ),
);

route('GET', SVC, `${ST}/returns`, (req) => {
  const s = xd();
  const c = store(s, req.params.code);
  return s.returns.filter((x) => x.cdsId === c.id).map((x) => returnRow(s, x)).sort((a, b) => b.heldSince.localeCompare(a.heldSince));
});

/** Cash for a day (default today) plus the list of days that have data. */
route('GET', SVC, `${ST}/cash`, (req) => {
  const s = xd();
  const c = store(s, req.params.code);
  const days = [...new Set([...s.storeHistory.filter((h) => h.cdsId === c.id).map((h) => h.date), s.operatingDate])].sort().reverse();
  return { days, day: cashDay(s, c.id, req.query.date || s.operatingDate) };
});

route('POST', SVC, `${ST}/deposits`, (req) =>
  mutate((s) => {
    const c = store(s, req.params.code);
    const b = req.body || {};
    addDeposit(s, c.id, { date: b.date || s.operatingDate, amount: b.amount, mode: b.mode as DepositMode, reference: b.reference }, nowIso());
    return cashDay(s, c.id, b.date || s.operatingDate);
  }),
);

route('GET', SVC, `${ST}/reports`, (req) => {
  const s = xd();
  const c = store(s, req.params.code);
  return { days: [...s.storeHistory.filter((h) => h.cdsId === c.id), storeToday(s, c.id)] };
});

route('PUT', SVC, `${ST}/profile`, (req) =>
  mutate((s) => {
    const c = store(s, req.params.code);
    const b = req.body || {};
    if (!String(b.operatorName || '').trim()) throw new XdRuleError('Enter the operator’s name.');
    if (!/^[6-9]\d{9}$/.test(String(b.phone || ''))) throw new XdRuleError('Enter a 10-digit mobile number.');
    if (!String(b.address || '').trim()) throw new XdRuleError('Enter the store address.');
    c.operatorName = String(b.operatorName).trim();
    c.phone = String(b.phone);
    c.address = String(b.address).trim();
    return c;
  }),
);
