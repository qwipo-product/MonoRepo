// Cross-dock demo data and rules, shared by the Service Centre and the Cross Dock Store.
// Pure module: no db/persist imports. src/mock/routes/crossDock.ts stores the state under db().ext.crossDock and
// turns XdRuleError into HTTP 422.
//
// Flow (mirrors the LBNP trip flow):
//   Orders → route plan (Pickup Planning) → Generate Trip → trip with stops and OTPs.
//   Pickup stop: the distributor gives the driver its pickup OTP.
//   Drop at a Cross Dock Store: the store counts the truck's goods (GRN, product and customer views); when they match it
//   gives the driver its OTP; the driver entering the OTP closes the drop and the orders become ready for the store's
//   delivery planning. Short or damaged units come off what the retailer pays.
//   Store: route plan (Delivery Planning) → Generate Trip → rider run; each retailer has a delivery OTP.
//
// Scenario (fixed clock times on today's date, so it reads the same whenever it is opened):
//   • Pilot around Kukatpally: 3 live Cross Dock Stores (KPHB, Moosapet, Nizampet) and Alwal still onboarding.
//   • 9 distributors: 7 use cross-dock + direct, 1 HUL distributor self-delivers, 1 opted for direct only.
//   • Today's orders (slot closed 2 PM, delivery tomorrow): Round 1 has one trip completed, one truck with three
//     distributors' goods at KPHB waiting for its GRN, and one trip planned; one Round 2 route is planned; the rest wait.
//   • Yesterday's orders are being delivered today by the stores' riders.
//   • Returns: one returns trip done this morning; today's returns wait at the stores.
import {
  amountDue,
  type DepositMode, type PickupRound, type TripSlot, type XdCashDay, type XdCds, type XdCustomerLine, type XdDayCdsSummary, type XdDeposit,
  type XdDistributor, type XdDriver, type XdGrnLine, type XdGrnView, type XdInboundTruck, type XdOrder, type XdOrderItem, type XdOrderRow,
  type XdOrderStatus, type XdPlanStopView, type XdProductLine, type XdRetailer, type XdReturn, type XdReturnRow, type XdRider, type XdRoutePlan,
  type XdRoutePlanRow, type XdRun, type XdRunRow, type XdRunStop, type XdSettings, type XdStop, type XdStopView, type XdStoreDay, type XdTrip,
  type XdTripRow, type XdVehicle,
} from '../../types/crossDock';
import { areaPolygon, distanceKm, inPolygon, nearestNeighbourOrder, offset, pathKm, type LatLng } from '../../utils/geo';
import { PRODUCTS } from '../seed';

export const XD_VERSION = 4;

export interface CrossDockState {
  version: number;
  operatingDate: string;
  deliveryDate: string;
  distributors: XdDistributor[];
  cdss: XdCds[];
  retailers: XdRetailer[];
  orders: XdOrder[];
  returns: XdReturn[];
  vehicles: XdVehicle[];
  drivers: XdDriver[];
  trips: XdTrip[];
  plans: XdRoutePlan[];
  settings: XdSettings;
  /** Service Centre days before yesterday (yesterday and today are computed from the data). */
  history: XdDayCdsSummary[];
  riders: XdRider[];
  runs: XdRun[];
  deposits: XdDeposit[];
  /** Store days before today. */
  storeHistory: XdStoreDay[];
}

/** A business rule was broken (shown to the user as-is). */
export class XdRuleError extends Error {}

/** Where the Service Centre's vehicles park (Balanagar yard). */
export const YARD: LatLng = [17.472, 78.444];

// ------------------------------------------------------------------ helpers

function rng(seed: number) {
  let a = seed >>> 0;
  const next = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    next,
    int: (min: number, max: number) => Math.floor(next() * (max - min + 1)) + min,
    pick: <T>(arr: T[]) => arr[Math.floor(next() * arr.length)],
    round1: (min: number, max: number) => Math.round((min + next() * (max - min)) * 10) / 10,
  };
}

const pad = (n: number, w = 2) => String(n).padStart(w, '0');
export const ymd = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const ddmmyy = (date: string) => `${date.slice(8, 10)}${date.slice(5, 7)}${date.slice(2, 4)}`;
export function addDays(date: string, n: number) {
  const d = new Date(`${date}T00:00:00`);
  d.setDate(d.getDate() + n);
  return ymd(d);
}
/** ISO timestamp for HH:mm local time on `date`. */
function at(date: string, hh: number, mm: number) {
  return new Date(`${date}T${pad(hh)}:${pad(mm)}:00`).toISOString();
}
const plusMin = (iso: string, min: number) => new Date(new Date(iso).getTime() + min * 60000).toISOString();
const otp4 = () => String(1000 + Math.floor(Math.random() * 9000));
const shortName = (name: string) => name.split(',')[0];
const sumKg = (xs: { weightKg: number }[]) => Math.round(xs.reduce((s, x) => s + x.weightKg, 0) * 10) / 10;
const ALNUM = 'ABCDEFGHJKLMNPQRSTUVWXYZ0123456789';

const CATALOG = PRODUCTS.map((p, i) => ({ ...p, sku: `SKU-${pad(i + 1, 3)}` }));

// ------------------------------------------------------------------ master data

const CDS_DEFS: { code: string; name: string; operatorName: string; phone: string; locality: string; address: string; c: LatLng; r: number; status: 'LIVE' | 'ONBOARDING'; riders: number; areas: string[] }[] = [
  { code: 'CDS-KPHB', name: 'Cross Dock Store - KPHB', operatorName: 'Mahesh Goud', phone: '9876543212', locality: 'KPHB Colony', address: 'Plot 41, Road No. 3, KPHB Colony, Kukatpally, Hyderabad 500072', c: [17.4875, 78.391], r: 2.3, status: 'LIVE', riders: 3, areas: ['KPHB Phase 1', 'KPHB Phase 3', 'KPHB Phase 6', 'Vivekananda Nagar', 'Allwyn Colony', 'Balaji Nagar'] },
  { code: 'CDS-MSP', name: 'Cross Dock Store - Moosapet', operatorName: 'Praveen Rao', phone: '9848012345', locality: 'Moosapet', address: '2-14/7, Bharat Nagar Road, Moosapet, Hyderabad 500018', c: [17.463, 78.431], r: 2.2, status: 'LIVE', riders: 2, areas: ['Moosapet', 'Bharat Nagar', 'Kabir Nagar', 'Erragadda', 'Prem Nagar', 'Fatehnagar'] },
  { code: 'CDS-NZP', name: 'Cross Dock Store - Nizampet', operatorName: 'Srinivas Chary', phone: '9848023456', locality: 'Nizampet', address: 'H.No 5-102, Nizampet Main Road, Hyderabad 500090', c: [17.53, 78.387], r: 2.2, status: 'LIVE', riders: 2, areas: ['Nizampet', 'Pragathi Nagar', 'Hydernagar', 'Rajiv Gandhi Nagar', 'Bachupally Road'] },
  { code: 'CDS-ALW', name: 'Cross Dock Store - Alwal', operatorName: 'Anil Kumar', phone: '9848034567', locality: 'Alwal', address: 'Opp. Alwal Bus Stop, Old Alwal, Secunderabad 500010', c: [17.504, 78.509], r: 2.4, status: 'ONBOARDING', riders: 0, areas: ['Old Alwal', 'Lothkunta', 'Macha Bolarum', 'Venkatapuram'] },
];

const DIST_DEFS: { code: string; name: string; contactName: string; phone: string; locality: string; address: string; c: LatLng; coverageKm: number; modes: XdDistributor['deliveryModes']; brand?: string; orders: number }[] = [
  { code: 'D-SVL', name: 'Sri Venkata Lakshmi Distributors', contactName: 'Ravi Kumar', phone: '9876543210', locality: 'Balanagar', address: 'Plot 12, IDA Balanagar, Hyderabad 500037', c: [17.479, 78.447], coverageKm: 6.5, modes: ['CROSS_DOCK', 'DIRECT'], orders: 10 },
  { code: 'D-SBA', name: 'Sai Balaji Agencies', contactName: 'Venu Gopal', phone: '9849011223', locality: 'Kukatpally Y Junction', address: '8-3-112, Y Junction, Kukatpally, Hyderabad 500072', c: [17.484, 78.412], coverageKm: 6, modes: ['CROSS_DOCK', 'DIRECT'], orders: 8 },
  { code: 'D-VDE', name: 'Vijaya Durga Enterprises', contactName: 'Durga Prasad', phone: '9849022334', locality: 'Jeedimetla', address: 'Shed 7, Phase 2, IDA Jeedimetla, Hyderabad 500055', c: [17.51, 78.45], coverageKm: 6.5, modes: ['CROSS_DOCK', 'DIRECT'], orders: 7 },
  { code: 'D-AFD', name: 'Annapurna Food Distributors', contactName: 'Ramana Murthy', phone: '9849033445', locality: 'Miyapur', address: '1-56, Allwyn X Roads, Miyapur, Hyderabad 500049', c: [17.497, 78.356], coverageKm: 6, modes: ['CROSS_DOCK', 'DIRECT'], orders: 8 },
  { code: 'D-KSC', name: 'Krishna Sales Corporation', contactName: 'Krishna Mohan', phone: '9849044556', locality: 'Moosapet', address: '3-9/2, Moosapet Main Road, Hyderabad 500018', c: [17.465, 78.421], coverageKm: 5.5, modes: ['CROSS_DOCK', 'DIRECT'], orders: 6 },
  { code: 'D-RKT', name: 'Ramakrishna Traders', contactName: 'Rama Krishna', phone: '9849055667', locality: 'Bowenpally', address: '12-4, Old Bowenpally, Secunderabad 500011', c: [17.474, 78.484], coverageKm: 7, modes: ['CROSS_DOCK', 'DIRECT'], orders: 6 },
  { code: 'D-LGD', name: 'Lakshmi Ganapathi Distributors', contactName: 'Ganapathi Rao', phone: '9849066778', locality: 'Pragathi Nagar', address: '4-77, Pragathi Nagar, Hyderabad 500090', c: [17.523, 78.396], coverageKm: 5.5, modes: ['CROSS_DOCK', 'DIRECT'], orders: 7 },
  { code: 'D-SGA', name: 'Sri Ganesh Agencies', contactName: 'Ganesh Babu', phone: '9849077889', locality: 'Sanathnagar', address: '6-2-30, Industrial Estate, Sanathnagar, Hyderabad 500018', c: [17.456, 78.443], coverageKm: 6, modes: ['SELF'], brand: 'HUL', orders: 0 },
  { code: 'D-MSD', name: 'Mahalakshmi Sales & Distribution', contactName: 'Mahesh Babu', phone: '9849088990', locality: 'Kompally', address: '2-41, Kompally Main Road, Hyderabad 500100', c: [17.539, 78.484], coverageKm: 5, modes: ['DIRECT'], orders: 0 },
];

/** Retailers outside every live CDS area (they get direct delivery). */
const OUTSIDE: { locality: string; c: LatLng }[] = [
  { locality: 'Miyapur', c: [17.497, 78.352] },
  { locality: 'Chandanagar', c: [17.495, 78.334] },
  { locality: 'Hafeezpet', c: [17.48, 78.354] },
  { locality: 'Bachupally', c: [17.547, 78.361] },
  { locality: 'Balanagar', c: [17.477, 78.453] },
  { locality: 'Jeedimetla', c: [17.512, 78.456] },
  { locality: 'Ameerpet', c: [17.4375, 78.4483] },
  { locality: 'Bowenpally', c: [17.474, 78.49] },
];

const STORE_NAMES = [
  'Sri Sai Kirana', 'Lakshmi General Stores', 'Balaji Provisions', 'Vinayaka Kirana', 'Annapurna Stores', 'Durga Supermarket',
  'Sri Ram Traders', 'Venkateswara Kirana', 'Hanuman General Store', 'Ganesh Provisions', 'Siddhi Vinayaka Mart', 'Om Sai Ram Stores',
  'Padmavathi Kirana', 'Renuka Provisions', 'Sai Krishna Mart', 'Bhavani General Stores', 'Manikanta Kirana', 'Navya Fresh Mart',
  'Laxmi Narasimha Stores', 'Karthikeya Provisions', 'Mahalakshmi Super Bazaar', 'Satya Sai Kirana', 'Anjaneya Traders',
  'Kanaka Durga Stores', 'Tirumala Provisions', 'Jai Bhavani Kirana', 'Rajeshwari General Stores', 'Srinivasa Mart', 'Gayatri Kirana',
  'Vasavi Provisions', 'Pragathi Super Market', 'Shiva Shakti Stores', 'Amma Kirana', 'Green Leaf Mart', 'Daily Needs Store',
  'Fresh Basket', 'City Mart Provisions', 'Sunrise General Store', 'Royal Kirana', 'Star Provisions', 'Krishna Kirana', 'Sri Lakshmi Stores',
  'Swathi Provisions', 'Nandini Kirana', 'Aditya Mart', 'Harsha General Stores', 'Sree Durga Bhavani Stores', 'Mythri Kirana',
];
const OWNERS = ['Ramesh', 'Suresh', 'Lakshmi', 'Srinivas', 'Venkatesh', 'Padma', 'Raju', 'Anitha', 'Mahender', 'Sridevi', 'Naresh', 'Kavitha', 'Prasad', 'Swapna', 'Sathish'];
const SURNAMES = ['Goud', 'Reddy', 'Rao', 'Yadav', 'Naidu', 'Chary', 'Gupta', 'Shetty'];

const VEHICLES: Omit<XdVehicle, 'id' | 'driverId'>[] = [
  { regNo: 'TS 09 UC 4521', type: 'THREE_WHEELER', model: 'Piaggio Ape Xtra LDX', capacityKg: 500, active: true },
  { regNo: 'TS 09 UD 7810', type: 'THREE_WHEELER', model: 'Bajaj Maxima Cargo', capacityKg: 500, active: true },
  { regNo: 'TS 08 UF 2234', type: 'FOUR_WHEELER', model: 'Tata Ace Gold', capacityKg: 750, active: true },
  { regNo: 'TS 10 UB 9087', type: 'FOUR_WHEELER', model: 'Mahindra Supro Maxitruck', capacityKg: 1000, active: true },
  { regNo: 'TS 07 UE 3345', type: 'THREE_WHEELER', model: 'Piaggio Ape Xtra LDX', capacityKg: 500, active: true },
];
const DRIVERS: Omit<XdDriver, 'id'>[] = [
  { name: 'Ramesh Naik', phone: '9701122334' },
  { name: 'Narsimha Rao', phone: '9701233445' },
  { name: 'Yadagiri', phone: '9701344556' },
  { name: 'Shankar Babu', phone: '9701455667' },
  { name: 'Venkatesh Kumar', phone: '9701566778' },
];

const RETURN_REASONS = ['Shop closed at delivery', 'Damaged packaging', 'Wrong item sent', 'Retailer refused - excess stock', 'Near expiry', 'Short delivery dispute'];

/** Two-wheeler riders per store (by CDS code). */
const RIDER_DEFS: Record<string, [string, string, string][]> = {
  'CDS-KPHB': [['Naveen Kumar', '9700011122', 'TS 08 EK 4410'], ['Ravi Teja', '9700022233', 'TS 08 EM 7721'], ['Prakash Yadav', '9700033344', 'TS 09 EJ 1290']],
  'CDS-MSP': [['Arjun Rao', '9700044455', 'TS 09 EL 3381'], ['Imran Shaik', '9700055566', 'TS 10 EB 6602']],
  'CDS-NZP': [['Vinod Kumar', '9700066677', 'TS 08 EN 2215'], ['Harish Goud', '9700077788', 'TS 07 EG 9034']],
};

export const DEFAULT_SETTINGS: XdSettings = {
  serviceCentre: {
    name: 'Qwipo CDS Service Centre - Hyderabad',
    contactName: 'Suresh Reddy',
    phone: '9876543211',
    email: 'servicecentre.hyd@example.com',
    city: 'Hyderabad',
    address: 'Yard 3, IDA Balanagar, Hyderabad 500037',
  },
  orderCutoff: '14:00',
  windows: [
    { key: 'R1', label: 'Round 1', start: '14:00', end: '17:00' },
    { key: 'R2', label: 'Round 2', start: '17:00', end: '20:00' },
    { key: 'EARLY_AM', label: 'Early-morning top-up', start: '06:00', end: '11:00' },
    { key: 'RETURNS', label: 'Returns', start: '11:00', end: '14:00' },
  ],
};

// ------------------------------------------------------------------ seed

export function seedCrossDock(today: Date = new Date()): CrossDockState {
  const r = rng(20261110);
  const opDate = ymd(today);
  const delDate = addDays(opDate, 1);
  const yesterday = addDays(opDate, -1);
  const randNo = () => Array.from({ length: 6 }, () => r.pick(ALNUM.split(''))).join('');

  const cdss: XdCds[] = CDS_DEFS.map((d, i) => ({
    id: `cds-${i + 1}`,
    code: d.code,
    name: d.name,
    operatorName: d.operatorName,
    phone: d.phone,
    locality: d.locality,
    address: d.address,
    lat: d.c[0],
    lng: d.c[1],
    radiusKm: d.r,
    polygon: areaPolygon(d.c, d.r, Array.from({ length: 7 }, () => r.round1(-0.06, 0.06))),
    status: d.status,
    riders: d.riders,
  }));
  const liveArea = (p: LatLng) => cdss.find((c) => c.status === 'LIVE' && inPolygon(p, c.polygon)) ?? null;
  const onboardingArea = (p: LatLng) => cdss.find((c) => c.status === 'ONBOARDING' && inPolygon(p, c.polygon)) ?? null;

  const names = [...STORE_NAMES];
  const takeName = () => names.splice(r.int(0, names.length - 1), 1)[0] ?? `Kirana ${r.int(100, 999)}`;
  const retailers: XdRetailer[] = [];
  const addRetailer = (p: LatLng, locality: string) => {
    const live = liveArea(p);
    retailers.push({
      id: `ret-${retailers.length + 1}`,
      name: takeName(),
      ownerName: `${r.pick(OWNERS)} ${r.pick(SURNAMES)}`,
      phone: `9${r.int(100000000, 999999999)}`,
      locality,
      lat: Math.round(p[0] * 1e5) / 1e5,
      lng: Math.round(p[1] * 1e5) / 1e5,
      cdsId: live?.id ?? null,
      onboardingCdsId: live ? null : onboardingArea(p)?.id ?? null,
    });
  };
  CDS_DEFS.forEach((d) => {
    const n = d.status === 'LIVE' ? 11 : 4;
    for (let i = 0; i < n; i++) addRetailer(offset(d.c, d.r * 0.85 * Math.sqrt(r.next()), r.int(0, 359)), r.pick(d.areas));
  });
  OUTSIDE.forEach((o) => addRetailer(offset(o.c, r.round1(0, 0.4), r.int(0, 359)), o.locality));

  const distributors: XdDistributor[] = DIST_DEFS.map((d, i) => ({
    id: `dist-${i + 1}`,
    code: d.code,
    name: d.name,
    contactName: d.contactName,
    phone: d.phone,
    locality: d.locality,
    address: d.address,
    lat: d.c[0],
    lng: d.c[1],
    coverageKm: d.coverageKm,
    deliveryModes: d.modes,
    ...(d.brand ? { brand: d.brand } : {}),
  }));
  const distBy = (code: string) => distributors.find((d) => d.code === code)!;

  const drivers: XdDriver[] = DRIVERS.map((d, i) => ({ id: `drv-${i + 1}`, ...d }));
  const vehicles: XdVehicle[] = VEHICLES.map((v, i) => ({ id: `veh-${i + 1}`, ...v, driverId: drivers[i].id }));

  /** A kirana order: 4–9 catalogue lines in sensible quantities. */
  const makeItems = (): XdOrderItem[] => {
    const pool = [...CATALOG];
    return Array.from({ length: r.int(4, 9) }, () => {
      const p = pool.splice(r.int(0, pool.length - 1), 1)[0];
      let qty = p.weightKg >= 10 ? 1 : Math.max(1, Math.round(r.round1(1.5, 6) / p.weightKg));
      if (qty > 12) qty = Math.max(12, Math.round(qty / 6) * 6);
      return { sku: p.sku, name: p.name, category: p.category, uom: p.packageType, caseSize: p.upc, mrp: p.mrp, price: p.sellingPrice, qty, unitWeightKg: p.weightKg };
    });
  };

  const orders: XdOrder[] = [];
  const makeOrder = (dist: XdDistributor, rt: XdRetailer, placedAt: string, deliveryDate: string, cdsId: string | null): XdOrder => {
    const items = makeItems();
    const acceptedAt = plusMin(placedAt, r.int(8, 55));
    const o: XdOrder = {
      id: `xo-${orders.length + 1}`,
      // Orders delivering today were placed yesterday.
      orderNo: `QWI-ONDC-${ddmmyy(deliveryDate === opDate ? yesterday : opDate)}-${randNo()}`,
      invoiceNo: `INV/26-27/0${r.int(10000, 19999)}`,
      items,
      planId: null,
      distributorId: dist.id,
      retailerId: rt.id,
      cdsId,
      placedAt,
      acceptedAt,
      deliveryDate,
      lines: items.length,
      quantity: items.reduce((s, i) => s + i.qty, 0),
      weightKg: Math.round(items.reduce((s, i) => s + i.qty * i.unitWeightKg, 0) * 10) / 10,
      value: Math.round(items.reduce((s, i) => s + i.qty * i.price, 0)),
      status: cdsId ? 'ACCEPTED' : 'DIRECT_DELIVERY',
      round: null,
      pickupTripId: null,
      history: [
        { status: 'Order placed', at: placedAt, by: 'Retailer (Buyer App)' },
        { status: 'Accepted', at: acceptedAt, by: `${dist.name} (Seller Store)` },
        cdsId
          ? { status: 'Routed to Service Centre (cross-dock)', at: plusMin(acceptedAt, 1), by: 'System' }
          : { status: 'Sent back for direct delivery (outside every live CDS area)', at: plusMin(acceptedAt, 1), by: 'System' },
      ],
    };
    orders.push(o);
    return o;
  };

  // Today's orders. Placed before the 2 PM slot closes; delivered tomorrow.
  distributors.forEach((dist, di) => {
    const want = DIST_DEFS[di].orders;
    if (!want || !dist.deliveryModes.includes('CROSS_DOCK')) return;
    const pool = retailers.filter((rt) => distanceKm([dist.lat, dist.lng], [rt.lat, rt.lng]) <= dist.coverageKm);
    for (let k = 0; k < want && pool.length; k++) {
      const rt = pool.splice(r.int(0, pool.length - 1), 1)[0];
      makeOrder(dist, rt, at(opDate, r.int(8, 12), r.int(0, 59)), delDate, rt.cdsId);
    }
  });
  // Two late acceptances for Sri Venkata Lakshmi: same distributor, next round.
  const svl = distBy('D-SVL').id;
  const lateSvl = orders.filter((o) => o.distributorId === svl && o.status === 'ACCEPTED').slice(-2);
  lateSvl.forEach((o) => {
    o.placedAt = at(opDate, 13, r.int(20, 45));
    o.acceptedAt = plusMin(o.placedAt, r.int(5, 12));
    o.history[0].at = o.placedAt;
    o.history[1].at = o.acceptedAt;
    o.history[2].at = plusMin(o.acceptedAt, 1);
  });

  const state: CrossDockState = {
    version: XD_VERSION,
    operatingDate: opDate,
    deliveryDate: delDate,
    distributors,
    cdss,
    retailers,
    orders,
    returns: [],
    vehicles,
    drivers,
    trips: [],
    plans: [],
    settings: structuredClone(DEFAULT_SETTINGS),
    history: [],
    riders: cdss.flatMap((c) =>
      (RIDER_DEFS[c.code] ?? []).map(([name, phone, vehicleRegNo], i) => ({ id: `rider-${c.code}-${i + 1}`, cdsId: c.id, name, phone, vehicleRegNo, active: true })),
    ),
    runs: [],
    deposits: [],
    storeHistory: [],
  };

  const liveCdss = cdss.filter((c) => c.status === 'LIVE');
  const xdDists = distributors.filter((d) => d.deliveryModes.includes('CROSS_DOCK'));
  const [kphb, msp, nzp] = liveCdss;

  /** Orders that fit the vehicle (the rest stay waiting for the next round). */
  const fit = (os: XdOrder[], vehicleId: string) => {
    const cap = vehicles.find((v) => v.id === vehicleId)!.capacityKg;
    let kg = 0;
    return os.filter((o) => (kg + o.weightKg <= cap ? ((kg += o.weightKg), true) : false)).map((o) => o.id);
  };
  const waiting = (code: string) => orders.filter((o) => o.distributorId === distBy(code).id && o.status === 'ACCEPTED' && !lateSvl.includes(o));
  /** Seed a pickup route plan and generate its trip (so Pickup Planning shows the plan as "Trip created"). */
  const seedPickup = (slot: PickupRound, vehicleId: string, orderIds: string[], plannedAt: string, date = slotDate(state, slot)) => {
    const plan = makePlan(state, { kind: 'PICKUP', slot, date, vehicleId, orderIds, now: plannedAt });
    return generateFromPlan(state, plan.id, plusMin(plannedAt, 3)) as XdTrip;
  };

  // ---- Yesterday's orders, delivered today by the stores. Some retailers order from two distributors (one drop).
  const PER_CDS: Record<string, number> = { 'CDS-KPHB': 16, 'CDS-MSP': 10, 'CDS-NZP': 8 };
  const yOrders: XdOrder[] = [];
  liveCdss.forEach((c) => {
    const rts = retailers.filter((rt) => rt.cdsId === c.id);
    for (let k = 0; k < (PER_CDS[c.code] ?? 0); k++) {
      const rt = rts[k % rts.length];
      const covering = xdDists.filter((d) => distanceKm([d.lat, d.lng], [rt.lat, rt.lng]) <= d.coverageKm);
      const taken = yOrders.filter((o) => o.retailerId === rt.id).map((o) => o.distributorId);
      const dist = covering.find((d) => !taken.includes(d.id) && r.next() < 0.5) ?? covering.find((d) => !taken.includes(d.id)) ?? covering[0] ?? xdDists[0];
      yOrders.push(makeOrder(dist, rt, at(yesterday, r.int(8, 12), r.int(0, 59)), opDate, c.id));
    }
  });
  // Yesterday's trips: distributor loads, smallest free vehicle, Round 1 then Round 2; every drop checked in by GRN.
  const byVehicleSize = [...vehicles].sort((a, b) => a.capacityKg - b.capacityKg);
  const loads: XdOrder[][] = [];
  [...new Set(yOrders.map((o) => o.distributorId))].forEach((id) => {
    let cur: XdOrder[] = [];
    yOrders.filter((o) => o.distributorId === id).forEach((o) => {
      if (sumKg([...cur, o]) > 480) {
        loads.push(cur);
        cur = [];
      }
      cur.push(o);
    });
    if (cur.length) loads.push(cur);
  });
  let shortSeeded = false;
  loads.forEach((load, i) => {
    const kg = sumKg(load);
    for (const slot of ['R1', 'R2'] as PickupRound[]) {
      const v = byVehicleSize.find((x) => x.capacityKg >= kg && !vehicleBusy(state, x.id, yesterday, slot));
      if (!v) continue;
      const t = seedPickup(slot, v.id, load.map((o) => o.id), at(yesterday, 13, 40 + i), yesterday);
      runTrip(state, t, slot === 'R1' ? at(yesterday, 14, 10 + 12 * (i % 4)) : at(yesterday, 17, 5 + 12 * (i % 4)), [25, 28, 24, 26], undefined, (stop) => {
        // One KPHB drop came 2 units short.
        if (shortSeeded || stop.placeId !== kphb.id) return undefined;
        shortSeeded = true;
        const line = expectedLines(state, stop.orderIds).find((l) => l.expected >= 2)!;
        return { lines: [{ sku: line.sku, received: line.expected - 2, damaged: 0 }], note: `2 × ${shortName(line.name)} missing from the carton` };
      });
      return;
    }
  });

  // ---- Today, Round 1: one trip completed; one truck with three distributors' goods now at KPHB waiting for its GRN;
  // one trip planned. Round 2: one route planned, not generated yet.
  const t1 = seedPickup('R1', 'veh-3', fit(waiting('D-SVL'), 'veh-3'), at(opDate, 14, 5));
  runTrip(state, t1, at(opDate, 14, 12), [25, 30, 25, 25]);
  // Three distributors that all sell into KPHB: the store sees one truck with all three's goods.
  const t2 = seedPickup('R1', 'veh-4', fit([...waiting('D-SBA'), ...waiting('D-AFD'), ...waiting('D-LGD')], 'veh-4'), at(opDate, 14, 8));
  runTrip(state, t2, at(opDate, 14, 20), [18, 22, 20], t2.stops.filter((s) => s.action === 'PICKUP').length);
  seedPickup('R1', 'veh-1', fit([...waiting('D-KSC'), ...waiting('D-RKT')], 'veh-1'), at(opDate, 14, 15));
  makePlan(state, { kind: 'PICKUP', slot: 'R2', date: opDate, vehicleId: 'veh-2', orderIds: fit(waiting('D-VDE'), 'veh-2'), now: at(opDate, 14, 40) });

  // ---- Stores' day: yesterday's orders are ready for planning; riders went out from noon.
  const ridersOf = (c: XdCds) => state.riders.filter((x) => x.cdsId === c.id);
  const bundles = (c: XdCds) => {
    const m = new Map<string, string[]>();
    yOrders.filter((o) => o.cdsId === c.id).forEach((o) => m.set(o.retailerId, [...(m.get(o.retailerId) ?? []), o.id]));
    return [...m.values()];
  };
  const pay = (due: number) => {
    const p = r.next();
    if (p < 0.55) return { cash: due, upi: 0 };
    if (p < 0.9) return { cash: 0, upi: due };
    const cash = Math.round((due * 0.5) / 10) * 10;
    return { cash, upi: due - cash };
  };
  const seedRun = (c: XdCds, riderIdx: number, orderIds: string[], plannedAt: string, startAt: string, stopsDone: number | 'all', ret?: { stop: number; reason: string }) => {
    const plan = makePlan(state, { kind: 'DELIVERY', slot: 'DELIVERY', date: opDate, cdsId: c.id, riderId: ridersOf(c)[riderIdx].id, orderIds, now: plannedAt });
    const run = generateFromPlan(state, plan.id, plusMin(plannedAt, 4)) as XdRun;
    startRun(state, run.id, startAt);
    let t = startAt;
    run.stops.slice(0, stopsDone === 'all' ? run.stops.length : stopsDone).forEach((s, i) => {
      t = plusMin(t, r.int(12, 22));
      const returned = ret?.stop === i ? [{ orderId: s.orderIds[0], reason: ret.reason }] : [];
      const due = s.orderIds.filter((id) => !returned.some((x) => x.orderId === id)).reduce((sum, id) => sum + amountDue(state.orders.find((o) => o.id === id)!), 0);
      completeRunStop(state, run.id, s.seq, { ...pay(due), returned, otp: s.otp }, t);
    });
    return run;
  };
  const kb = bundles(kphb);
  seedRun(kphb, 0, kb.slice(0, 5).flat(), at(opDate, 11, 45), at(opDate, 12, 5), 'all', { stop: 2, reason: 'Shop closed at delivery' });
  seedRun(kphb, 1, kb.slice(5, 9).flat(), at(opDate, 13, 35), at(opDate, 13, 50), 2);
  seedRun(msp, 0, bundles(msp).flat(), at(opDate, 11, 50), at(opDate, 12, 10), 'all', { stop: 1, reason: 'Retailer refused - excess stock' });
  seedRun(nzp, 0, bundles(nzp).flat(), at(opDate, 11, 55), at(opDate, 12, 20), 'all');

  // ---- Returns: four from the day before were taken back this morning; today's wait at the stores.
  const makeReturn = (day: string, heldSince: string, cds: XdCds) => {
    const rts = retailers.filter((rt) => rt.cdsId === cds.id);
    const rt = r.pick(rts);
    const dist = r.pick(xdDists.filter((d) => distanceKm([d.lat, d.lng], [rt.lat, rt.lng]) <= d.coverageKm)) ?? xdDists[0];
    const weightKg = r.round1(1.5, 14);
    const ret: XdReturn = {
      id: `xr-${state.returns.length + 1}`,
      returnNo: `RET-${ddmmyy(day)}-${pad(state.returns.length + 1, 3)}`,
      orderNo: `QWI-ONDC-${ddmmyy(addDays(day, -1))}-${randNo()}`,
      distributorId: dist.id,
      cdsId: cds.id,
      retailerId: rt.id,
      items: r.int(1, 6),
      weightKg,
      value: Math.round((weightKg * r.int(180, 320)) / 10) * 10,
      reason: r.pick(RETURN_REASONS),
      heldSince,
      status: 'AT_CDS',
      returnTripId: null,
      planId: null,
      history: [{ status: 'Handed in at CDS by rider', at: heldSince, by: cds.name }],
    };
    state.returns.push(ret);
    return ret;
  };
  const old = [0, 0, 1, 1].map((ci, i) => makeReturn(yesterday, at(yesterday, 15 + i, r.int(0, 50)), liveCdss[ci]));
  const rPlan = makePlan(state, { kind: 'RETURN', slot: 'RETURNS', date: opDate, vehicleId: 'veh-5', returnIds: old.map((x) => x.id), now: at(opDate, 10, 30) });
  const rt1 = generateFromPlan(state, rPlan.id, at(opDate, 10, 40)) as XdTrip;
  runTrip(state, rt1, at(opDate, 11, 5), [20, 30, 35, 30]);
  [0, 2].forEach((ci) => makeReturn(opDate, at(opDate, 13, r.int(10, 55)), liveCdss[ci]));

  // ---- Earlier days for Reports and Cash (yesterday and today are computed from the data above where possible).
  for (let back = 6; back >= 1; back--) {
    const date = addDays(opDate, -back);
    liveCdss.forEach((c) => {
      if (back >= 2) {
        const n = r.int(8, 17);
        state.history.push({
          date,
          cdsId: c.id,
          ordersDropped: n,
          weightKg: Math.round(n * r.round1(30, 45)),
          onTimeOrders: n - (r.next() < 0.35 ? r.int(1, 4) : 0),
          returnsCollected: r.int(0, 3),
          pickupTrips: r.int(1, 3),
        });
      }
      const received = back === 1 ? yOrders.filter((o) => o.cdsId === c.id).length : r.int(8, 17);
      const delivered = r.int(8, 16);
      const collected = delivered * r.int(7200, 10800);
      const cash = Math.round((collected * r.int(45, 65)) / 1000) * 10;
      const upi = Math.round(collected / 10) * 10 - cash;
      state.storeHistory.push({ date, cdsId: c.id, received, delivered, returned: r.int(0, 2), cash, upi, deposited: cash + upi });
      state.deposits.push({ id: `dep-${state.deposits.length + 1}`, cdsId: c.id, date, amount: cash + upi, mode: r.next() < 0.6 ? 'BANK_TRANSFER' : 'UPI', reference: `UTR${r.int(100000000, 999999999)}`, at: at(date, 20, r.int(5, 55)) });
    });
  }

  return state;
}

/**
 * Seed helper: start a trip and complete its first `doneStops` stops, `gaps` minutes apart. Drops at a store are
 * checked in with a GRN (full counts unless `grnFor` says otherwise) and closed with the store's OTP.
 */
function runTrip(
  state: CrossDockState,
  trip: XdTrip,
  startAt: string,
  gaps: number[],
  doneStops = trip.stops.length,
  grnFor?: (stop: XdStop) => { lines: { sku: string; received: number; damaged: number }[]; note: string } | undefined,
) {
  startTrip(state, trip.id, startAt);
  let t = startAt;
  trip.stops.slice(0, doneStops).forEach((s, i) => {
    t = plusMin(t, gaps[i] ?? 25);
    if (trip.kind === 'PICKUP' && s.action === 'DROP') {
      const g = grnFor?.(s);
      confirmGrn(state, trip.id, s.seq, { lines: g?.lines ?? [], note: g?.note ?? '' }, plusMin(t, -8));
    }
    completeStop(state, trip.id, s.seq, t, s.otp);
  });
}

// ------------------------------------------------------------------ trips (Service Centre)

const placeLatLng = (state: CrossDockState, type: 'DISTRIBUTOR' | 'CDS', id: string): LatLng => {
  const p = type === 'DISTRIBUTOR' ? state.distributors.find((d) => d.id === id) : state.cdss.find((c) => c.id === id);
  return p ? [p.lat, p.lng] : YARD;
};

function nextTripNo(state: CrossDockState, prefix: 'PK' | 'RT', date: string) {
  const n = state.trips.filter((t) => t.tripNo.startsWith(`${prefix}-${ddmmyy(date)}`)).length + 1;
  return `${prefix}-${ddmmyy(date)}-${pad(n)}`;
}

/** The date a slot runs on: the early-morning top-up runs on delivery day. */
export const slotDate = (state: CrossDockState, slot: TripSlot) => (slot === 'EARLY_AM' ? state.deliveryDate : state.operatingDate);

export function vehicleBusy(state: CrossDockState, vehicleId: string, date: string, slot: TripSlot): XdTrip | undefined {
  return state.trips.find((t) => t.vehicleId === vehicleId && t.date === date && t.slot === slot && t.status !== 'CANCELLED');
}
const vehicleReserved = (state: CrossDockState, vehicleId: string, date: string, slot: TripSlot, exceptPlan?: string) =>
  state.plans.find((p) => p.status === 'CREATED' && p.id !== exceptPlan && p.vehicleId === vehicleId && p.date === date && p.slot === slot);

function checkVehicle(state: CrossDockState, vehicleId: string, date: string, slot: TripSlot, weightKg: number) {
  const v = state.vehicles.find((x) => x.id === vehicleId);
  if (!v || !v.active) throw new XdRuleError('Choose an active vehicle.');
  const busy = vehicleBusy(state, vehicleId, date, slot);
  if (busy) throw new XdRuleError(`${v.regNo} is already on ${busy.tripNo} in this slot. Choose another vehicle.`);
  if (weightKg > v.capacityKg) throw new XdRuleError(`${v.regNo} carries ${v.capacityKg} kg; this trip is ${weightKg} kg. Choose a bigger vehicle or fewer orders.`);
  return v;
}

/** Pickup trip: pick up at each distributor (nearest first from the yard), then drop at each CDS (nearest first). */
export function planPickupTrip(state: CrossDockState, p: { slot: PickupRound; vehicleId: string; orderIds: string[]; now: string; date?: string }): XdTrip {
  const orders = p.orderIds.map((id) => state.orders.find((o) => o.id === id));
  if (!orders.length) throw new XdRuleError('Select at least one order.');
  if (orders.some((o) => !o || o.status !== 'ACCEPTED' || !o.cdsId)) throw new XdRuleError('Some orders are no longer waiting for pickup. Refresh and try again.');
  const list = orders as XdOrder[];
  const date = p.date ?? slotDate(state, p.slot);
  const weightKg = sumKg(list);
  const v = checkVehicle(state, p.vehicleId, date, p.slot, weightKg);

  const distIds = [...new Set(list.map((o) => o.distributorId))];
  const pickups = nearestNeighbourOrder(YARD, distIds, (id) => placeLatLng(state, 'DISTRIBUTOR', id));
  const lastPickup = placeLatLng(state, 'DISTRIBUTOR', pickups[pickups.length - 1]);
  const cdsIds = nearestNeighbourOrder(lastPickup, [...new Set(list.map((o) => o.cdsId!))], (id) => placeLatLng(state, 'CDS', id));

  const stops: XdStop[] = [
    ...pickups.map((id) => {
      const os = list.filter((o) => o.distributorId === id);
      return { seq: 0, action: 'PICKUP' as const, placeType: 'DISTRIBUTOR' as const, placeId: id, orderIds: os.map((o) => o.id), returnIds: [], weightKg: sumKg(os), status: 'PENDING' as const, doneAt: null, otp: otp4(), grn: null };
    }),
    ...cdsIds.map((id) => {
      const os = list.filter((o) => o.cdsId === id);
      return { seq: 0, action: 'DROP' as const, placeType: 'CDS' as const, placeId: id, orderIds: os.map((o) => o.id), returnIds: [], weightKg: sumKg(os), status: 'PENDING' as const, doneAt: null, otp: otp4(), grn: null };
    }),
  ].map((s, i) => ({ ...s, seq: i + 1 }));

  const trip: XdTrip = {
    id: `xt-${state.trips.length + 1}-${Date.now().toString(36)}`,
    tripNo: nextTripNo(state, 'PK', date),
    kind: 'PICKUP',
    slot: p.slot,
    date,
    vehicleId: v.id,
    driverId: v.driverId,
    status: 'PLANNED',
    stops,
    weightKg,
    distanceKm: pathKm([YARD, ...stops.map((s) => placeLatLng(state, s.placeType, s.placeId)), YARD]),
    createdAt: p.now,
    startedAt: null,
    completedAt: null,
  };
  state.trips.push(trip);
  list.forEach((o) => {
    o.status = 'PICKUP_PLANNED';
    o.round = p.slot;
    o.pickupTripId = trip.id;
    o.history.push({ status: `Pickup planned on ${trip.tripNo}`, at: p.now, by: 'Service Centre' });
  });
  return trip;
}

/** Returns trip: collect at each CDS, then drop back at each distributor. */
export function planReturnTrip(state: CrossDockState, p: { vehicleId: string; returnIds: string[]; date: string; now: string }): XdTrip {
  const rets = p.returnIds.map((id) => state.returns.find((x) => x.id === id));
  if (!rets.length) throw new XdRuleError('Select at least one return.');
  if (rets.some((x) => !x || x.status !== 'AT_CDS')) throw new XdRuleError('Some returns are no longer waiting at a CDS. Refresh and try again.');
  const list = rets as XdReturn[];
  const weightKg = sumKg(list);
  const v = checkVehicle(state, p.vehicleId, p.date, 'RETURNS', weightKg);

  const cdsIds = nearestNeighbourOrder(YARD, [...new Set(list.map((x) => x.cdsId))], (id) => placeLatLng(state, 'CDS', id));
  const lastCds = placeLatLng(state, 'CDS', cdsIds[cdsIds.length - 1]);
  const distIds = nearestNeighbourOrder(lastCds, [...new Set(list.map((x) => x.distributorId))], (id) => placeLatLng(state, 'DISTRIBUTOR', id));
  const stops: XdStop[] = [
    ...cdsIds.map((id) => {
      const xs = list.filter((x) => x.cdsId === id);
      return { seq: 0, action: 'PICKUP' as const, placeType: 'CDS' as const, placeId: id, orderIds: [], returnIds: xs.map((x) => x.id), weightKg: sumKg(xs), status: 'PENDING' as const, doneAt: null, otp: otp4(), grn: null };
    }),
    ...distIds.map((id) => {
      const xs = list.filter((x) => x.distributorId === id);
      return { seq: 0, action: 'DROP' as const, placeType: 'DISTRIBUTOR' as const, placeId: id, orderIds: [], returnIds: xs.map((x) => x.id), weightKg: sumKg(xs), status: 'PENDING' as const, doneAt: null, otp: otp4(), grn: null };
    }),
  ].map((s, i) => ({ ...s, seq: i + 1 }));

  const trip: XdTrip = {
    id: `xt-${state.trips.length + 1}-${Date.now().toString(36)}`,
    tripNo: nextTripNo(state, 'RT', p.date),
    kind: 'RETURN',
    slot: 'RETURNS',
    date: p.date,
    vehicleId: v.id,
    driverId: v.driverId,
    status: 'PLANNED',
    stops,
    weightKg,
    distanceKm: pathKm([YARD, ...stops.map((s) => placeLatLng(state, s.placeType, s.placeId)), YARD]),
    createdAt: p.now,
    startedAt: null,
    completedAt: null,
  };
  state.trips.push(trip);
  list.forEach((x) => {
    x.status = 'RETURN_PLANNED';
    x.returnTripId = trip.id;
    x.history.push({ status: `Return planned on ${trip.tripNo}`, at: p.now, by: 'Service Centre' });
  });
  return trip;
}

const findTrip = (state: CrossDockState, id: string) => {
  const t = state.trips.find((x) => x.id === id);
  if (!t) throw new XdRuleError('Trip not found.');
  return t;
};
const driverName = (state: CrossDockState, t: XdTrip) => state.drivers.find((d) => d.id === t.driverId)?.name ?? 'Driver';

export function startTrip(state: CrossDockState, tripId: string, now: string): XdTrip {
  const t = findTrip(state, tripId);
  if (t.status !== 'PLANNED') throw new XdRuleError('Only a planned trip can be started.');
  t.status = 'IN_PROGRESS';
  t.startedAt = now;
  return t;
}

/** Products on a drop, consolidated across every order (expected counts). */
export function expectedLines(state: CrossDockState, orderIds: string[]): XdGrnLine[] {
  const m = new Map<string, XdGrnLine>();
  orderIds.forEach((id) => {
    const o = state.orders.find((x) => x.id === id);
    o?.items.forEach((it) => {
      const cur = m.get(it.sku) ?? { sku: it.sku, name: it.name, uom: it.uom, caseSize: it.caseSize, mrp: it.mrp, price: it.price, expected: 0, received: 0, damaged: 0 };
      cur.expected += it.qty;
      m.set(it.sku, cur);
    });
  });
  return [...m.values()].sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * The store's goods received note for one truck drop. Counts default to what was expected. Once confirmed the store
 * sees the drop's OTP and gives it to the driver.
 */
export function confirmGrn(state: CrossDockState, tripId: string, seq: number, p: { lines: { sku: string; received: number; damaged: number }[]; note: string }, now: string) {
  const t = findTrip(state, tripId);
  if (t.kind !== 'PICKUP') throw new XdRuleError('Only Service Centre deliveries to a store have a GRN.');
  if (t.status !== 'IN_PROGRESS') throw new XdRuleError(t.status === 'PLANNED' ? 'This truck has not left the yard yet.' : 'This trip is closed.');
  const stop = t.stops.find((s) => s.seq === seq && s.action === 'DROP' && s.placeType === 'CDS');
  if (!stop) throw new XdRuleError('Drop not found.');
  if (stop.status === 'DONE') throw new XdRuleError('This drop is already received.');
  if (stop.grn) throw new XdRuleError('The GRN is already confirmed. Give the OTP to the driver.');
  if (t.stops.some((s) => s.action === 'PICKUP' && s.status !== 'DONE')) throw new XdRuleError('The truck is still collecting from distributors.');
  const store = state.cdss.find((c) => c.id === stop.placeId)!;
  const lines = expectedLines(state, stop.orderIds).map((l) => {
    const inp = p.lines.find((x) => x.sku === l.sku);
    const received = inp ? Math.round(Number(inp.received)) : l.expected;
    const damaged = inp ? Math.round(Number(inp.damaged) || 0) : 0;
    if (!(received >= 0) || !(damaged >= 0)) throw new XdRuleError(`${shortName(l.name)}: counts cannot be negative.`);
    if (damaged > received) throw new XdRuleError(`${shortName(l.name)}: damaged units cannot be more than received.`);
    return { ...l, received, damaged };
  });
  stop.grn = { status: 'CONFIRMED', lines, note: String(p.note ?? '').trim(), confirmedAt: now, confirmedBy: store.name };
  const issues = lines.filter((l) => l.received !== l.expected || l.damaged).length;
  stop.orderIds.forEach((id) => {
    const o = state.orders.find((x) => x.id === id)!;
    o.history.push({ status: `GRN confirmed at ${store.code}${issues ? ` (${issues} product${issues === 1 ? '' : 's'} not matching)` : ''}`, at: now, by: store.name });
  });
  return stop;
}

/** Short and damaged units from the GRN, charged against the orders that contain the product. */
function applyGrnToOrders(state: CrossDockState, stop: XdStop, now: string) {
  const store = state.cdss.find((c) => c.id === stop.placeId)!;
  const orders = stop.orderIds.map((id) => state.orders.find((o) => o.id === id)!);
  const acc = new Map<string, { items: number; value: number; notes: string[]; short: boolean }>();
  stop.grn?.lines.forEach((l) => {
    let missing = Math.max(0, l.expected - l.received);
    let damaged = l.damaged;
    for (const o of orders) {
      if (!missing && !damaged) break;
      const it = o.items.find((x) => x.sku === l.sku);
      if (!it) continue;
      const s = Math.min(missing, it.qty);
      missing -= s;
      const d = Math.min(damaged, it.qty - s);
      damaged -= d;
      if (!s && !d) continue;
      const a = acc.get(o.id) ?? { items: 0, value: 0, notes: [], short: false };
      a.items += s + d;
      a.value += Math.round((s + d) * it.price);
      a.notes.push(`${[s ? `${s} short` : '', d ? `${d} damaged` : ''].filter(Boolean).join(', ')}: ${shortName(it.name)}`);
      a.short ||= s > 0;
      acc.set(o.id, a);
    }
  });
  orders.forEach((o) => {
    const a = acc.get(o.id);
    o.discrepancy = a ? { type: a.short ? 'SHORT' : 'DAMAGED', items: a.items, value: a.value, note: a.notes.join('; ') } : null;
    o.status = 'READY_TO_DISPATCH';
    o.receivedAt = now;
    o.history.push({ status: `Received at ${store.code} (OTP verified)${a ? `: ${a.items} units short or damaged` : ' in full'}`, at: now, by: store.name });
  });
}

/**
 * Completes a stop. Pickups run in order and before any drop. A drop at a store needs the store's confirmed GRN and its
 * OTP (entered by the driver); it then hands the orders to the store, ready for delivery planning.
 */
export function completeStop(state: CrossDockState, tripId: string, seq: number, now: string, otp?: string): XdTrip {
  const t = findTrip(state, tripId);
  if (t.status !== 'IN_PROGRESS') throw new XdRuleError('Start the trip first.');
  const stop = t.stops.find((s) => s.seq === seq);
  if (!stop || stop.status === 'DONE') throw new XdRuleError('This stop is already done.');
  if (stop.action === 'PICKUP') {
    const next = t.stops.find((s) => s.action === 'PICKUP' && s.status === 'PENDING');
    if (next?.seq !== seq) throw new XdRuleError('Pickups are completed in order.');
  } else if (t.stops.some((s) => s.action === 'PICKUP' && s.status !== 'DONE')) {
    throw new XdRuleError('Finish every pickup before the drops.');
  }
  const storeDrop = t.kind === 'PICKUP' && stop.action === 'DROP';
  if (storeDrop) {
    if (!stop.grn) throw new XdRuleError('The store has not confirmed its GRN yet. The driver gets the OTP after the count matches.');
    if (String(otp ?? '').trim() !== stop.otp) throw new XdRuleError('That OTP does not match. Ask the store for the OTP shown after its GRN.');
  }
  stop.status = 'DONE';
  stop.doneAt = now;
  const by = driverName(state, t);
  const place = stop.placeType === 'CDS' ? state.cdss.find((c) => c.id === stop.placeId)?.name : state.distributors.find((d) => d.id === stop.placeId)?.name;
  if (storeDrop) applyGrnToOrders(state, stop, now);
  else {
    stop.orderIds.forEach((id) => {
      const o = state.orders.find((x) => x.id === id);
      if (!o) return;
      const status: XdOrderStatus = stop.action === 'PICKUP' ? 'PICKED_UP' : 'DROPPED_AT_CDS';
      o.status = status;
      o.history.push({ status: `Picked up from ${place} (pickup OTP)`, at: now, by: `${by} (${t.tripNo})` });
    });
  }
  stop.returnIds.forEach((id) => {
    const x = state.returns.find((y) => y.id === id);
    if (!x) return;
    x.status = stop.action === 'PICKUP' ? 'COLLECTED' : 'RETURNED_TO_DISTRIBUTOR';
    x.history.push({ status: stop.action === 'PICKUP' ? `Collected from ${place}` : `Handed back to ${place}`, at: now, by: `${by} (${t.tripNo})` });
  });
  if (t.stops.every((s) => s.status === 'DONE')) {
    t.status = 'COMPLETED';
    t.completedAt = now;
  }
  return t;
}

/** Cancels a planned trip; its orders go back to waiting for pickup and its returns back to waiting at the CDS. */
export function cancelTrip(state: CrossDockState, tripId: string, now: string): XdTrip {
  const t = findTrip(state, tripId);
  if (t.status !== 'PLANNED') throw new XdRuleError('Only a trip that has not started can be cancelled.');
  t.status = 'CANCELLED';
  t.stops.forEach((s) => {
    s.orderIds.forEach((id) => {
      const o = state.orders.find((x) => x.id === id);
      if (!o || o.pickupTripId !== t.id) return;
      o.status = 'ACCEPTED';
      o.round = null;
      o.pickupTripId = null;
      o.history.push({ status: `Pickup cancelled (${t.tripNo})`, at: now, by: 'Service Centre' });
    });
    s.returnIds.forEach((id) => {
      const x = state.returns.find((y) => y.id === id);
      if (!x || x.returnTripId !== t.id) return;
      x.status = 'AT_CDS';
      x.returnTripId = null;
      x.history.push({ status: `Return trip cancelled (${t.tripNo})`, at: now, by: 'Service Centre' });
    });
  });
  return t;
}

// ------------------------------------------------------------------ route plans (Delivery Planning pattern)

const PLAN_PREFIX = { PICKUP: 'PR', RETURN: 'RR', DELIVERY: 'DR' } as const;
const MAX_PICKUPS_PER_TRIP = 3;
export const MAX_RUN_ORDERS = 30;
const MAX_RUN_STOPS = 12;

function nextRouteId(state: CrossDockState, kind: XdRoutePlan['kind'], date: string, cdsCode?: string) {
  const prefix = `${PLAN_PREFIX[kind]}-${cdsCode ? `${cdsCode.replace('CDS-', '')}-` : ''}${ddmmyy(date)}`;
  return `${prefix}-${pad(state.plans.filter((p) => p.routeId.startsWith(prefix)).length + 1, 3)}`;
}

/** Stores a plan and marks its orders or returns as in planning. */
function makePlan(
  state: CrossDockState,
  p: { kind: XdRoutePlan['kind']; slot: XdRoutePlan['slot']; date: string; vehicleId?: string; riderId?: string; cdsId?: string; orderIds?: string[]; returnIds?: string[]; now: string },
): XdRoutePlan {
  const orderIds = p.orderIds ?? [];
  const returnIds = p.returnIds ?? [];
  const store = p.cdsId ? state.cdss.find((c) => c.id === p.cdsId) : undefined;
  const plan: XdRoutePlan = {
    id: `plan-${state.plans.length + 1}-${Date.now().toString(36)}`,
    routeId: nextRouteId(state, p.kind, p.date, store?.code),
    kind: p.kind,
    cdsId: p.cdsId ?? null,
    slot: p.slot,
    date: p.date,
    vehicleId: p.vehicleId ?? null,
    riderId: p.riderId ?? null,
    orderIds,
    returnIds,
    weightKg: sumKg([...orderIds.map((id) => state.orders.find((o) => o.id === id)!), ...returnIds.map((id) => state.returns.find((x) => x.id === id)!)]),
    distanceKm: 0,
    createdAt: p.now,
    status: 'CREATED',
    tripId: null,
  };
  plan.distanceKm = planPath(state, plan).distanceKm;
  state.plans.push(plan);
  orderIds.forEach((id) => {
    const o = state.orders.find((x) => x.id === id)!;
    o.planId = plan.id;
    o.history.push({ status: `Added to route ${plan.routeId}`, at: p.now, by: store ? store.name : 'Service Centre' });
  });
  returnIds.forEach((id) => {
    const x = state.returns.find((y) => y.id === id)!;
    x.planId = plan.id;
  });
  return plan;
}

/** Ordered stops of a plan, the same order its trip will use. */
function planPath(state: CrossDockState, plan: XdRoutePlan): { stops: { action: 'PICKUP' | 'DROP'; type: 'DISTRIBUTOR' | 'CDS' | 'RETAILER'; id: string; orderIds: string[]; returnIds: string[] }[]; distanceKm: number } {
  const orders = plan.orderIds.map((id) => state.orders.find((o) => o.id === id)!).filter(Boolean);
  const rets = plan.returnIds.map((id) => state.returns.find((x) => x.id === id)!).filter(Boolean);
  if (plan.kind === 'DELIVERY') {
    const store = state.cdss.find((c) => c.id === plan.cdsId)!;
    const home: LatLng = [store.lat, store.lng];
    const pos = (id: string): LatLng => {
      const rt = state.retailers.find((x) => x.id === id)!;
      return [rt.lat, rt.lng];
    };
    const ids = nearestNeighbourOrder(home, [...new Set(orders.map((o) => o.retailerId))], pos);
    return { stops: ids.map((id) => ({ action: 'DROP' as const, type: 'RETAILER' as const, id, orderIds: orders.filter((o) => o.retailerId === id).map((o) => o.id), returnIds: [] })), distanceKm: pathKm([home, ...ids.map(pos), home]) };
  }
  if (plan.kind === 'PICKUP') {
    const d = nearestNeighbourOrder(YARD, [...new Set(orders.map((o) => o.distributorId))], (id) => placeLatLng(state, 'DISTRIBUTOR', id));
    const c = d.length ? nearestNeighbourOrder(placeLatLng(state, 'DISTRIBUTOR', d[d.length - 1]), [...new Set(orders.map((o) => o.cdsId!))], (id) => placeLatLng(state, 'CDS', id)) : [];
    const stops = [
      ...d.map((id) => ({ action: 'PICKUP' as const, type: 'DISTRIBUTOR' as const, id, orderIds: orders.filter((o) => o.distributorId === id).map((o) => o.id), returnIds: [] })),
      ...c.map((id) => ({ action: 'DROP' as const, type: 'CDS' as const, id, orderIds: orders.filter((o) => o.cdsId === id).map((o) => o.id), returnIds: [] })),
    ];
    return { stops, distanceKm: pathKm([YARD, ...stops.map((s) => placeLatLng(state, s.type as 'DISTRIBUTOR' | 'CDS', s.id)), YARD]) };
  }
  const c = nearestNeighbourOrder(YARD, [...new Set(rets.map((x) => x.cdsId))], (id) => placeLatLng(state, 'CDS', id));
  const d = c.length ? nearestNeighbourOrder(placeLatLng(state, 'CDS', c[c.length - 1]), [...new Set(rets.map((x) => x.distributorId))], (id) => placeLatLng(state, 'DISTRIBUTOR', id)) : [];
  const stops = [
    ...c.map((id) => ({ action: 'PICKUP' as const, type: 'CDS' as const, id, orderIds: [], returnIds: rets.filter((x) => x.cdsId === id).map((x) => x.id) })),
    ...d.map((id) => ({ action: 'DROP' as const, type: 'DISTRIBUTOR' as const, id, orderIds: [], returnIds: rets.filter((x) => x.distributorId === id).map((x) => x.id) })),
  ];
  return { stops, distanceKm: pathKm([YARD, ...stops.map((s) => placeLatLng(state, s.type as 'DISTRIBUTOR' | 'CDS', s.id)), YARD]) };
}

/**
 * "Plan Routes" for pickups: groups the selected orders by distributor (up to 3 pickups per trip), packs them into the
 * free vehicles of the round, and gives each route the smallest vehicle that carries it.
 */
export function createPickupPlans(state: CrossDockState, p: { slot: PickupRound; orderIds: string[]; now: string }): XdRoutePlan[] {
  const date = slotDate(state, p.slot);
  const orders = p.orderIds.map((id) => state.orders.find((o) => o.id === id));
  if (!orders.length) throw new XdRuleError('Select at least one order.');
  if (orders.some((o) => !o || o.status !== 'ACCEPTED' || !o.cdsId || o.planId)) throw new XdRuleError('Some orders are already planned. Refresh and try again.');
  const free = state.vehicles.filter((v) => v.active && !vehicleBusy(state, v.id, date, p.slot) && !vehicleReserved(state, v.id, date, p.slot)).sort((a, b) => b.capacityKg - a.capacityKg);
  if (!free.length) throw new XdRuleError('Every vehicle is already planned in this round. Pick another round.');
  const maxCap = free[0].capacityKg;
  const groups = [...new Set((orders as XdOrder[]).map((o) => o.distributorId))]
    .map((id) => (orders as XdOrder[]).filter((o) => o.distributorId === id))
    .sort((a, b) => sumKg(b) - sumKg(a));
  const loads: XdOrder[][] = [];
  groups.forEach((g) => {
    if (sumKg(g) > maxCap) {
      let cur: XdOrder[] = [];
      g.forEach((o) => {
        if (sumKg([...cur, o]) > maxCap) {
          loads.push(cur);
          cur = [];
        }
        cur.push(o);
      });
      if (cur.length) loads.push(cur);
      return;
    }
    const into = loads.find((l) => sumKg([...l, ...g]) <= maxCap && new Set([...l, ...g].map((o) => o.distributorId)).size <= MAX_PICKUPS_PER_TRIP);
    if (into) into.push(...g);
    else loads.push([...g]);
  });
  const left = [...free];
  const assigned = loads
    .sort((a, b) => sumKg(b) - sumKg(a))
    .map((l) => {
      const fitting = left.filter((v) => v.capacityKg >= sumKg(l)).sort((a, b) => a.capacityKg - b.capacityKg)[0];
      if (!fitting) return null;
      left.splice(left.indexOf(fitting), 1);
      return { l, v: fitting };
    });
  if (assigned.some((x) => !x)) {
    throw new XdRuleError(`Not enough free vehicles in this round for ${sumKg(orders as XdOrder[])} kg (${free.length} free). Plan fewer orders, or use another round.`);
  }
  return assigned.map((x) => makePlan(state, { kind: 'PICKUP', slot: p.slot, date, vehicleId: x!.v.id, orderIds: x!.l.map((o) => o.id), now: p.now }));
}

/** "Plan Routes" for returns: one route with the smallest free vehicle that carries them. */
export function createReturnPlan(state: CrossDockState, p: { returnIds: string[]; date: string; now: string }): XdRoutePlan {
  const rets = p.returnIds.map((id) => state.returns.find((x) => x.id === id));
  if (!rets.length) throw new XdRuleError('Select at least one return.');
  if (rets.some((x) => !x || x.status !== 'AT_CDS' || x.planId)) throw new XdRuleError('Some returns are already planned. Refresh and try again.');
  const kg = sumKg(rets as XdReturn[]);
  const v = state.vehicles
    .filter((x) => x.active && x.capacityKg >= kg && !vehicleBusy(state, x.id, p.date, 'RETURNS') && !vehicleReserved(state, x.id, p.date, 'RETURNS'))
    .sort((a, b) => a.capacityKg - b.capacityKg)[0];
  if (!v) throw new XdRuleError('No free vehicle in that returns window. Pick the other day.');
  return makePlan(state, { kind: 'RETURN', slot: 'RETURNS', date: p.date, vehicleId: v.id, returnIds: p.returnIds, now: p.now });
}

const riderFree = (state: CrossDockState, riderId: string, date: string) =>
  !state.runs.some((x) => x.riderId === riderId && x.date === date && (x.status === 'PLANNED' || x.status === 'OUT')) &&
  !state.plans.some((p) => p.status === 'CREATED' && p.riderId === riderId && p.date === date);

/**
 * "Plan Routes" for a store's deliveries: one stop per retailer, retailers swept around the store and cut into runs of
 * up to 30 orders / 12 retailers, one free rider each.
 */
export function createDeliveryPlans(state: CrossDockState, cdsId: string, p: { date: string; orderIds: string[]; now: string }): XdRoutePlan[] {
  const store = findStore(state, cdsId);
  const orders = storeOrders(state, cdsId, p.orderIds);
  if (!orders.length) throw new XdRuleError('Select at least one order.');
  if (orders.some((o) => o.status !== 'READY_TO_DISPATCH' || o.runId || o.planId)) throw new XdRuleError('Some orders are already planned. Refresh and try again.');
  if (orders.some((o) => o.deliveryDate !== p.date)) throw new XdRuleError('Pick orders for one delivery date.');
  const byRetailer = [...new Set(orders.map((o) => o.retailerId))].map((id) => {
    const rt = state.retailers.find((x) => x.id === id)!;
    return { id, ang: Math.atan2(rt.lat - store.lat, rt.lng - store.lng), orders: orders.filter((o) => o.retailerId === id) };
  }).sort((a, b) => a.ang - b.ang);
  const chunks: XdOrder[][] = [];
  let cur: XdOrder[] = [];
  byRetailer.forEach((b) => {
    if (cur.length + b.orders.length > MAX_RUN_ORDERS || new Set(cur.map((o) => o.retailerId)).size >= MAX_RUN_STOPS) {
      chunks.push(cur);
      cur = [];
    }
    cur.push(...b.orders);
  });
  if (cur.length) chunks.push(cur);
  const riders = state.riders.filter((x) => x.cdsId === store.id && x.active && riderFree(state, x.id, p.date));
  if (riders.length < chunks.length) {
    throw new XdRuleError(riders.length ? `These orders need ${chunks.length} runs but only ${riders.length} rider${riders.length === 1 ? ' is' : 's are'} free. Plan fewer retailers, or wait for a rider to come back.` : 'Every rider is out or already planned. Wait for a rider to come back.');
  }
  return chunks.map((c, i) => makePlan(state, { kind: 'DELIVERY', slot: 'DELIVERY', date: p.date, cdsId: store.id, riderId: riders[i].id, orderIds: c.map((o) => o.id), now: p.now }));
}

const findPlan = (state: CrossDockState, id: string) => {
  const x = state.plans.find((y) => y.id === id);
  if (!x) throw new XdRuleError('Route not found.');
  return x;
};

/** "Generate Trip": turns a planned route into a trip (Service Centre) or a rider run (store). */
export function generateFromPlan(state: CrossDockState, planId: string, now: string): XdTrip | XdRun {
  const plan = findPlan(state, planId);
  if (plan.status !== 'CREATED') throw new XdRuleError('This route already has a trip.');
  plan.orderIds.forEach((id) => (state.orders.find((o) => o.id === id)!.planId = null));
  plan.returnIds.forEach((id) => (state.returns.find((x) => x.id === id)!.planId = null));
  let out: XdTrip | XdRun;
  try {
    if (plan.kind === 'PICKUP') out = planPickupTrip(state, { slot: plan.slot as PickupRound, vehicleId: plan.vehicleId!, orderIds: plan.orderIds, now, date: plan.date });
    else if (plan.kind === 'RETURN') out = planReturnTrip(state, { vehicleId: plan.vehicleId!, returnIds: plan.returnIds, date: plan.date, now });
    else out = planRun(state, { cdsId: plan.cdsId!, riderId: plan.riderId!, orderIds: plan.orderIds, now, date: plan.date });
  } catch (e) {
    plan.orderIds.forEach((id) => (state.orders.find((o) => o.id === id)!.planId = plan.id));
    plan.returnIds.forEach((id) => (state.returns.find((x) => x.id === id)!.planId = plan.id));
    throw e;
  }
  plan.status = 'TRIP_CREATED';
  plan.tripId = out.id;
  return out;
}

export function cancelPlan(state: CrossDockState, planId: string, now: string): XdRoutePlan {
  const plan = findPlan(state, planId);
  if (plan.status !== 'CREATED') throw new XdRuleError('Only a route without a trip can be cancelled.');
  plan.status = 'CANCELLED';
  plan.orderIds.forEach((id) => {
    const o = state.orders.find((x) => x.id === id)!;
    o.planId = null;
    o.history.push({ status: `Route ${plan.routeId} cancelled`, at: now, by: plan.cdsId ? 'Cross Dock Store' : 'Service Centre' });
  });
  plan.returnIds.forEach((id) => (state.returns.find((x) => x.id === id)!.planId = null));
  return plan;
}

// ------------------------------------------------------------------ Cross Dock Store

const findStore = (state: CrossDockState, cdsId: string) => {
  const c = state.cdss.find((x) => x.id === cdsId);
  if (!c) throw new XdRuleError('Store not found.');
  return c;
};
const storeOrders = (state: CrossDockState, cdsId: string, ids: string[]) =>
  ids.map((id) => {
    const o = state.orders.find((x) => x.id === id);
    if (!o || o.cdsId !== cdsId) throw new XdRuleError('Some orders do not belong to this store. Refresh and try again.');
    return o;
  });

function nextRunNo(state: CrossDockState, store: XdCds, date: string) {
  const n = state.runs.filter((x) => x.cdsId === store.id && x.date === date).length + 1;
  return `${store.code.replace('CDS-', '')}-${ddmmyy(date)}-${pad(n)}`;
}
export const riderBusy = (state: CrossDockState, riderId: string) => state.runs.find((x) => x.riderId === riderId && (x.status === 'PLANNED' || x.status === 'OUT'));

/** A rider's run: one stop per retailer (all its orders together), nearest first from the store, each with an OTP. */
export function planRun(state: CrossDockState, p: { cdsId: string; riderId: string; orderIds: string[]; now: string; date?: string }): XdRun {
  const store = findStore(state, p.cdsId);
  const rider = state.riders.find((x) => x.id === p.riderId && x.cdsId === store.id);
  if (!rider || !rider.active) throw new XdRuleError('Choose an active rider from this store.');
  const busy = riderBusy(state, rider.id);
  if (busy) throw new XdRuleError(`${rider.name} is already on run ${busy.runNo}. Finish it first.`);
  if (!p.orderIds.length) throw new XdRuleError('Select at least one retailer.');
  if (p.orderIds.length > MAX_RUN_ORDERS) throw new XdRuleError(`A rider carries up to ${MAX_RUN_ORDERS} orders per run; this run has ${p.orderIds.length}.`);
  const list = storeOrders(state, store.id, p.orderIds);
  if (list.some((o) => o.status !== 'READY_TO_DISPATCH' || o.runId)) throw new XdRuleError('Some orders are not ready to dispatch. Refresh and try again.');
  const date = p.date ?? state.operatingDate;
  const posOf = (id: string): LatLng => {
    const rt = state.retailers.find((x) => x.id === id)!;
    return [rt.lat, rt.lng];
  };
  const retailerIds = nearestNeighbourOrder([store.lat, store.lng], [...new Set(list.map((o) => o.retailerId))], posOf);
  const stops: XdRunStop[] = retailerIds.map((rid, i) => ({
    seq: i + 1,
    retailerId: rid,
    orderIds: list.filter((o) => o.retailerId === rid).map((o) => o.id),
    status: 'PENDING',
    doneAt: null,
    cash: 0,
    upi: 0,
    returnedOrderIds: [],
    otp: otp4(),
  }));
  const run: XdRun = {
    id: `run-${state.runs.length + 1}-${Date.now().toString(36)}`,
    runNo: nextRunNo(state, store, date),
    cdsId: store.id,
    riderId: rider.id,
    date,
    status: 'PLANNED',
    stops,
    distanceKm: pathKm([[store.lat, store.lng], ...retailerIds.map(posOf), [store.lat, store.lng]]),
    createdAt: p.now,
    startedAt: null,
    completedAt: null,
  };
  state.runs.push(run);
  list.forEach((o) => {
    o.runId = run.id;
    o.history.push({ status: `Assigned to ${rider.name} (run ${run.runNo})`, at: p.now, by: store.name });
  });
  return run;
}

const findRun = (state: CrossDockState, id: string) => {
  const x = state.runs.find((y) => y.id === id);
  if (!x) throw new XdRuleError('Run not found.');
  return x;
};
const riderName = (state: CrossDockState, run: XdRun) => state.riders.find((x) => x.id === run.riderId)?.name ?? 'Rider';

export function startRun(state: CrossDockState, runId: string, now: string): XdRun {
  const run = findRun(state, runId);
  if (run.status !== 'PLANNED') throw new XdRuleError('Only a planned run can be started.');
  if (run.date > state.operatingDate) throw new XdRuleError('This run is for a later day.');
  run.status = 'OUT';
  run.startedAt = now;
  const by = riderName(state, run);
  run.stops.flatMap((s) => s.orderIds).forEach((id) => {
    const o = state.orders.find((x) => x.id === id)!;
    o.status = 'OUT_FOR_DELIVERY';
    o.history.push({ status: `Out for delivery with ${by}`, at: now, by: 'Field Agent App' });
  });
  return run;
}

/**
 * The rider's update for one retailer (Field Agent App): orders delivered or returned, what was collected, and the
 * retailer's delivery OTP when anything was delivered. Cash + UPI must equal the amount due on the delivered orders.
 */
export function completeRunStop(state: CrossDockState, runId: string, seq: number, p: { cash: number; upi: number; returned: { orderId: string; reason: string }[]; otp?: string }, now: string): XdRun {
  const run = findRun(state, runId);
  if (run.status !== 'OUT') throw new XdRuleError('The rider has not left the store yet.');
  const stop = run.stops.find((s) => s.seq === seq);
  if (!stop) throw new XdRuleError('Stop not found.');
  if (stop.status === 'DONE') throw new XdRuleError('This stop is already done.');
  const returned = p.returned ?? [];
  if (returned.some((x) => !stop.orderIds.includes(x.orderId))) throw new XdRuleError('A returned order is not on this stop.');
  if (returned.some((x) => !String(x.reason || '').trim())) throw new XdRuleError('Give a reason for each returned order.');
  const cash = Math.round(Number(p.cash) || 0);
  const upi = Math.round(Number(p.upi) || 0);
  if (cash < 0 || upi < 0) throw new XdRuleError('Amounts cannot be negative.');
  const delivered = stop.orderIds.filter((id) => !returned.some((x) => x.orderId === id)).map((id) => state.orders.find((o) => o.id === id)!);
  if (delivered.length && String(p.otp ?? '').trim() !== stop.otp) throw new XdRuleError('The retailer’s delivery OTP does not match.');
  const due = delivered.reduce((s, o) => s + amountDue(o), 0);
  if (cash + upi !== due) {
    throw new XdRuleError(`Collected ₹${(cash + upi).toLocaleString('en-IN')} but ₹${due.toLocaleString('en-IN')} is due. Cash and UPI must add up to the amount due.`);
  }

  const store = findStore(state, run.cdsId);
  const by = `${riderName(state, run)} (Field Agent App)`;
  let cashLeft = cash;
  delivered.forEach((o, i) => {
    const owed = amountDue(o);
    const c = i === delivered.length - 1 ? Math.min(cashLeft, owed) : Math.min(cashLeft, owed, Math.round(cash * (due ? owed / due : 0)));
    cashLeft -= c;
    o.status = 'DELIVERED';
    o.deliveredAt = now;
    o.payment = { cash: c, upi: owed - c };
    o.history.push({ status: `Delivered (OTP verified) · collected ₹${owed.toLocaleString('en-IN')}${c && owed - c ? ' (cash + UPI)' : c ? ' in cash' : ' by UPI'}`, at: now, by });
  });
  returned.forEach(({ orderId, reason }) => {
    const o = state.orders.find((x) => x.id === orderId)!;
    o.status = 'RETURNED';
    o.returnReason = reason.trim();
    o.history.push({ status: `Returned by the retailer: ${o.returnReason}`, at: now, by });
    state.returns.push({
      id: `xr-${state.returns.length + 1}-${Date.now().toString(36)}`,
      returnNo: `RET-${ddmmyy(state.operatingDate)}-${pad(state.returns.length + 1, 3)}`,
      orderNo: o.orderNo,
      orderId: o.id,
      distributorId: o.distributorId,
      cdsId: store.id,
      retailerId: o.retailerId,
      items: o.quantity,
      weightKg: o.weightKg,
      value: amountDue(o),
      reason: o.returnReason,
      heldSince: now,
      status: 'AT_CDS',
      returnTripId: null,
      planId: null,
      history: [{ status: `Brought back to ${store.code} by the rider`, at: now, by }],
    });
  });
  stop.status = 'DONE';
  stop.doneAt = now;
  stop.cash = cash;
  stop.upi = upi;
  stop.returnedOrderIds = returned.map((x) => x.orderId);
  if (run.stops.every((s) => s.status === 'DONE')) {
    run.status = 'COMPLETED';
    run.completedAt = now;
  }
  return run;
}

/** Cancels a run that has not left; its orders go back to ready for planning. */
export function cancelRun(state: CrossDockState, runId: string, now: string): XdRun {
  const run = findRun(state, runId);
  if (run.status !== 'PLANNED') throw new XdRuleError('Only a run that has not left can be cancelled.');
  run.status = 'CANCELLED';
  const store = findStore(state, run.cdsId);
  run.stops.flatMap((s) => s.orderIds).forEach((id) => {
    const o = state.orders.find((x) => x.id === id)!;
    o.runId = null;
    o.history.push({ status: `Run ${run.runNo} cancelled`, at: now, by: store.name });
  });
  return run;
}

export function addDeposit(state: CrossDockState, cdsId: string, p: { date: string; amount: number; mode: DepositMode; reference: string }, now: string): XdDeposit {
  findStore(state, cdsId);
  const amount = Math.round(Number(p.amount));
  if (!(amount > 0)) throw new XdRuleError('Enter the amount deposited.');
  if (!['UPI', 'BANK_TRANSFER', 'CASH_DEPOSIT'].includes(p.mode)) throw new XdRuleError('Choose how the money was sent.');
  const reference = String(p.reference || '').trim();
  if (!reference) throw new XdRuleError(p.mode === 'CASH_DEPOSIT' ? 'Enter the deposit slip number.' : 'Enter the UTR or UPI reference.');
  const day = cashDay(state, cdsId, p.date);
  if (amount > day.balance) throw new XdRuleError(`Only ₹${day.balance.toLocaleString('en-IN')} is waiting to be deposited for this day.`);
  const dep: XdDeposit = { id: `dep-${state.deposits.length + 1}-${Date.now().toString(36)}`, cdsId, date: p.date, amount, mode: p.mode, reference, at: now };
  state.deposits.push(dep);
  return dep;
}

// ------------------------------------------------------------------ views

export function orderRow(state: CrossDockState, o: XdOrder): XdOrderRow {
  const d = state.distributors.find((x) => x.id === o.distributorId);
  const rt = state.retailers.find((x) => x.id === o.retailerId);
  const c = o.cdsId ? state.cdss.find((x) => x.id === o.cdsId) : undefined;
  return {
    ...o,
    distributorName: d?.name ?? '',
    distributorLocality: d?.locality ?? '',
    retailerName: rt?.name ?? '',
    retailerLocality: rt?.locality ?? '',
    cdsCode: c?.code ?? null,
    cdsName: c?.name ?? null,
    tripNo: o.pickupTripId ? state.trips.find((t) => t.id === o.pickupTripId)?.tripNo ?? null : null,
  };
}

export function returnRow(state: CrossDockState, x: XdReturn): XdReturnRow {
  const c = state.cdss.find((y) => y.id === x.cdsId);
  return {
    ...x,
    distributorName: state.distributors.find((d) => d.id === x.distributorId)?.name ?? '',
    retailerName: state.retailers.find((rt) => rt.id === x.retailerId)?.name ?? '',
    cdsCode: c?.code ?? '',
    cdsName: c?.name ?? '',
    tripNo: x.returnTripId ? state.trips.find((t) => t.id === x.returnTripId)?.tripNo ?? null : null,
  };
}

export function tripRow(state: CrossDockState, t: XdTrip): XdTripRow {
  const v = state.vehicles.find((x) => x.id === t.vehicleId);
  const d = state.drivers.find((x) => x.id === t.driverId);
  const stops: XdStopView[] = t.stops.map((s) => {
    const p = s.placeType === 'CDS' ? state.cdss.find((c) => c.id === s.placeId) : state.distributors.find((x) => x.id === s.placeId);
    return { ...s, placeName: p?.name ?? '', placeCode: p?.code ?? '', locality: p?.locality ?? '', lat: p?.lat ?? YARD[0], lng: p?.lng ?? YARD[1] };
  });
  return {
    ...t,
    stops,
    vehicleRegNo: v?.regNo ?? '',
    vehicleType: v?.type ?? 'THREE_WHEELER',
    vehicleModel: v?.model ?? '',
    capacityKg: v?.capacityKg ?? 0,
    driverName: d?.name ?? '',
    driverPhone: d?.phone ?? '',
    orderCount: new Set(t.stops.flatMap((s) => s.orderIds)).size,
    returnCount: new Set(t.stops.flatMap((s) => s.returnIds)).size,
    stopsDone: t.stops.filter((s) => s.status === 'DONE').length,
  };
}

/** Products across orders (Ordered Products / Product Wise Orders). */
export function productLines(state: CrossDockState, orderIds: string[]): XdProductLine[] {
  return expectedLines(state, orderIds).map((l) => ({ sku: l.sku, name: l.name, uom: l.uom, caseSize: l.caseSize, mrp: l.mrp, qty: l.expected, amount: Math.round(l.expected * l.price) }));
}

/** Retailers across orders (Customer Wise Orders). */
export function customerLines(state: CrossDockState, orderIds: string[]): XdCustomerLine[] {
  const orders = orderIds.map((id) => state.orders.find((o) => o.id === id)!).filter(Boolean);
  return [...new Set(orders.map((o) => o.retailerId))].map((rid) => {
    const os = orders.filter((o) => o.retailerId === rid);
    const rt = state.retailers.find((x) => x.id === rid);
    return {
      retailerId: rid,
      retailerName: rt?.name ?? '',
      locality: rt?.locality ?? '',
      orders: os.length,
      distributors: [...new Set(os.map((o) => state.distributors.find((d) => d.id === o.distributorId)?.name ?? ''))],
      amount: os.reduce((s, o) => s + amountDue(o), 0),
      weightKg: sumKg(os),
    };
  });
}

export function planRow(state: CrossDockState, plan: XdRoutePlan): XdRoutePlanRow {
  const v = plan.vehicleId ? state.vehicles.find((x) => x.id === plan.vehicleId) : undefined;
  const rider = plan.riderId ? state.riders.find((x) => x.id === plan.riderId) : undefined;
  const orders = plan.orderIds.map((id) => state.orders.find((o) => o.id === id)!).filter(Boolean);
  const rets = plan.returnIds.map((id) => state.returns.find((x) => x.id === id)!).filter(Boolean);
  const path = planPath(state, plan);
  const stops: XdPlanStopView[] = path.stops.map((s, i) => {
    const place = s.type === 'RETAILER' ? state.retailers.find((x) => x.id === s.id) : s.type === 'CDS' ? state.cdss.find((x) => x.id === s.id) : state.distributors.find((x) => x.id === s.id);
    const os = orders.filter((o) => s.orderIds.includes(o.id));
    const xs = rets.filter((x) => s.returnIds.includes(x.id));
    return { seq: i + 1, action: s.action, name: place?.name ?? '', locality: place?.locality ?? '', orders: os.length || xs.length, weightKg: sumKg([...os, ...xs]), value: os.reduce((a, o) => a + amountDue(o), 0) + xs.reduce((a, x) => a + x.value, 0) };
  });
  const trip = plan.tripId ? state.trips.find((t) => t.id === plan.tripId) ?? state.runs.find((x) => x.id === plan.tripId) : undefined;
  return {
    ...plan,
    vehicleRegNo: v?.regNo ?? null,
    capacityKg: v?.capacityKg ?? null,
    driverName: v ? state.drivers.find((d) => d.id === v.driverId)?.name ?? null : null,
    riderName: rider?.name ?? null,
    pickupPoints: stops.filter((s) => s.action === 'PICKUP').length,
    dropPoints: stops.filter((s) => s.action === 'DROP').length,
    orderCount: orders.length,
    returnCount: rets.length,
    value: orders.reduce((a, o) => a + amountDue(o), 0) + rets.reduce((a, x) => a + x.value, 0),
    tripNo: trip ? ('tripNo' in trip ? trip.tripNo : trip.runNo) : null,
    distanceKm: path.distanceKm,
    stops,
    products: productLines(state, plan.orderIds),
    customers: customerLines(state, plan.orderIds),
  };
}

/** Service Centre trucks dropping at a store, newest first. */
export function inboundTrucks(state: CrossDockState, cdsId: string): XdInboundTruck[] {
  return state.trips
    .filter((t) => t.kind === 'PICKUP' && t.status !== 'CANCELLED' && t.stops.some((s) => s.action === 'DROP' && s.placeId === cdsId))
    .map((t) => {
      const stop = t.stops.find((s) => s.action === 'DROP' && s.placeId === cdsId)!;
      const v = state.vehicles.find((x) => x.id === t.vehicleId);
      const d = state.drivers.find((x) => x.id === t.driverId);
      const orders = stop.orderIds.map((id) => state.orders.find((o) => o.id === id)!);
      const pickups = t.stops.filter((s) => s.action === 'PICKUP');
      const pickupsDone = pickups.filter((s) => s.status === 'DONE').length;
      const st: XdInboundTruck['state'] =
        stop.status === 'DONE' ? 'RECEIVED' : stop.grn ? 'GRN_DONE' : t.status === 'PLANNED' ? 'SCHEDULED' : pickupsDone < pickups.length ? 'ON_THE_WAY' : 'AT_STORE';
      return {
        tripId: t.id,
        tripNo: t.tripNo,
        seq: stop.seq,
        state: st,
        date: t.date,
        slot: t.slot,
        vehicleRegNo: v?.regNo ?? '',
        vehicleModel: v?.model ?? '',
        driverName: d?.name ?? '',
        driverPhone: d?.phone ?? '',
        distributors: [...new Set(orders.map((o) => state.distributors.find((x) => x.id === o.distributorId)?.name ?? ''))],
        orderCount: orders.length,
        retailerCount: new Set(orders.map((o) => o.retailerId)).size,
        units: orders.reduce((s, o) => s + o.quantity, 0),
        weightKg: stop.weightKg,
        value: orders.reduce((s, o) => s + o.value, 0),
        pickupsDone,
        pickups: pickups.length,
        pickupStops: pickups.map((s) => {
          const dd = state.distributors.find((x) => x.id === s.placeId);
          return { name: dd?.name ?? '', locality: dd?.locality ?? '', address: dd?.address ?? '', done: s.status === 'DONE', doneAt: s.doneAt };
        }),
        startedAt: t.startedAt,
        otp: stop.grn ? stop.otp : null,
        grn: stop.grn ?? null,
        receivedAt: stop.doneAt,
      };
    })
    .sort((a, b) => (b.date + b.tripNo).localeCompare(a.date + a.tripNo));
}

export function grnView(state: CrossDockState, cdsId: string, tripId: string): XdGrnView {
  const truck = inboundTrucks(state, cdsId).find((x) => x.tripId === tripId);
  if (!truck) throw new XdRuleError('Truck not found for this store.');
  const t = state.trips.find((x) => x.id === tripId)!;
  const stop = t.stops.find((s) => s.seq === truck.seq)!;
  return {
    truck,
    lines: stop.grn?.lines ?? expectedLines(state, stop.orderIds),
    customers: customerLines(state, stop.orderIds),
    orders: stop.orderIds.map((id) => orderRow(state, state.orders.find((o) => o.id === id)!)),
  };
}

/** One day of Service Centre work per live CDS, computed from the data (drops by when the drop stop was done). */
export function daySummary(state: CrossDockState, date: string): XdDayCdsSummary[] {
  const dayStart = at(date, 0, 0);
  const dayEnd = at(addDays(date, 1), 0, 0);
  const inDay = (iso: string | null | undefined) => !!iso && iso >= dayStart && iso < dayEnd;
  const dropTimes = new Map<string, string>();
  state.trips.forEach((t) => t.stops.forEach((s) => s.placeType === 'CDS' && s.action === 'DROP' && s.doneAt && s.orderIds.forEach((id) => dropTimes.set(id, s.doneAt!))));
  return state.cdss.filter((c) => c.status === 'LIVE').map((c) => {
    const dropped = state.orders.filter((o) => o.cdsId === c.id && inDay(dropTimes.get(o.id)));
    return {
      date,
      cdsId: c.id,
      ordersDropped: dropped.length,
      weightKg: Math.round(sumKg(dropped)),
      onTimeOrders: dropped.filter((o) => (dropTimes.get(o.id) ?? '') <= at(o.deliveryDate, 12, 0)).length,
      returnsCollected: state.returns.filter((x) => x.cdsId === c.id && x.history.some((h) => h.status.startsWith('Collected') && inDay(h.at))).length,
      pickupTrips: new Set(state.trips.filter((t) => t.kind === 'PICKUP' && t.date === date && t.status !== 'CANCELLED' && t.stops.some((s) => s.placeId === c.id)).map((t) => t.id)).size,
    };
  });
}

export function runRow(state: CrossDockState, run: XdRun): XdRunRow {
  const rider = state.riders.find((x) => x.id === run.riderId);
  const stops = run.stops.map((s) => {
    const rt = state.retailers.find((x) => x.id === s.retailerId);
    const orders = s.orderIds.map((id) => orderRow(state, state.orders.find((o) => o.id === id)!));
    return {
      ...s,
      retailerName: rt?.name ?? '',
      ownerName: rt?.ownerName ?? '',
      retailerPhone: rt?.phone ?? '',
      locality: rt?.locality ?? '',
      lat: rt?.lat ?? 0,
      lng: rt?.lng ?? 0,
      orders,
      amountDue: orders.filter((o) => !s.returnedOrderIds.includes(o.id)).reduce((sum, o) => sum + amountDue(o), 0),
    };
  });
  return {
    ...run,
    stops,
    riderName: rider?.name ?? '',
    riderPhone: rider?.phone ?? '',
    vehicleRegNo: rider?.vehicleRegNo ?? '',
    orderCount: run.stops.reduce((n, s) => n + s.orderIds.length, 0),
    stopsDone: run.stops.filter((s) => s.status === 'DONE').length,
    amountDue: stops.reduce((sum, s) => sum + s.amountDue, 0),
    collected: run.stops.reduce((sum, s) => sum + s.cash + s.upi, 0),
  };
}

/** Collections and deposits for one store and day. Today is computed from the runs; earlier days from history. */
export function cashDay(state: CrossDockState, cdsId: string, date: string): XdCashDay {
  const deposits = state.deposits.filter((d) => d.cdsId === cdsId && d.date === date).sort((a, b) => a.at.localeCompare(b.at));
  const deposited = deposits.reduce((s, d) => s + d.amount, 0);
  if (date !== state.operatingDate) {
    const h = state.storeHistory.find((x) => x.cdsId === cdsId && x.date === date);
    const cash = h?.cash ?? 0;
    const upi = h?.upi ?? 0;
    return { date, delivered: h?.delivered ?? 0, expected: cash + upi, cash, upi, deposited, balance: cash + upi - deposited, byRider: [], deposits };
  }
  const runs = state.runs.filter((x) => x.cdsId === cdsId && x.date === date && x.status !== 'CANCELLED');
  const delivered = state.orders.filter((o) => o.cdsId === cdsId && o.status === 'DELIVERED' && o.deliveryDate === date);
  const sumRun = (xs: XdRun[], k: 'cash' | 'upi') => xs.reduce((s, x) => s + x.stops.reduce((t, st) => t + st[k], 0), 0);
  const cash = sumRun(runs, 'cash');
  const upi = sumRun(runs, 'upi');
  const byRider = state.riders
    .filter((rd) => rd.cdsId === cdsId)
    .map((rd) => {
      const mine = runs.filter((x) => x.riderId === rd.id);
      return {
        riderId: rd.id,
        riderName: rd.name,
        runs: mine.length,
        delivered: delivered.filter((o) => mine.some((x) => x.id === o.runId)).length,
        cash: sumRun(mine, 'cash'),
        upi: sumRun(mine, 'upi'),
        open: mine.filter((x) => x.status === 'OUT').length,
      };
    });
  return { date, delivered: delivered.length, expected: delivered.reduce((s, o) => s + amountDue(o), 0), cash, upi, deposited, balance: cash + upi - deposited, byRider, deposits };
}

/** Today at one store, computed from the data. */
export function storeToday(state: CrossDockState, cdsId: string): XdStoreDay {
  const date = state.operatingDate;
  const dayStart = at(date, 0, 0);
  const dayEnd = at(addDays(date, 1), 0, 0);
  const inDay = (iso: string | null | undefined) => !!iso && iso >= dayStart && iso < dayEnd;
  const mine = state.orders.filter((o) => o.cdsId === cdsId);
  const c = cashDay(state, cdsId, date);
  return {
    date,
    cdsId,
    received: mine.filter((o) => inDay(o.receivedAt)).length,
    delivered: mine.filter((o) => o.status === 'DELIVERED' && inDay(o.deliveredAt)).length,
    returned: mine.filter((o) => o.status === 'RETURNED' && o.deliveryDate === date).length,
    cash: c.cash,
    upi: c.upi,
    deposited: c.deposited,
  };
}
