// Mock endpoints for Create Order (bulk import), Quick Order and the geocode autocomplete.
// Spec: docs/specs/02-create-order-customer-master.md §1.5, §2.3, §2.5, §6.
//
//   POST /orders                 quick order → { orderIds:[id] } (status 1 READY_FOR_PLANNING)
//   POST /orders/import-orders   { buyerId, fileUrl } → parses the uploaded xlsx and creates orders; rows with
//                                problems become Pending (9) orders with validationErrors (DbValidationError shape)
//   GET  /geocode/autocomplete   ?text=&provider=google|geoapify → Hyderabad suggestions
//
// Demo triggers (so every client branch can be seen):
//   - import the same invoice twice            → 409 "Transaction query already complete" (UI: duplicate message)
//   - quick order with mobile not /^[6-9]\d{9}$/ → 400 "Invalid customer mobile number…" (client has no digit check)
//   - quick order with pincode not 6 digits     → 200 { success:false, error } (client: "2xx with success:false")
//   - quick order with mobile 9000000001        → 200 success without an id (client: "Order creation returned no ID")
//   - geocode text containing "error"           → HTTP 500 (client shows nothing)
//   - geocode text matching nothing (e.g. "zzz") → []
import * as XLSX from 'xlsx';
import { db, nowIso, persist, uuid } from '../db';
import { MockError, RawResponse, route } from '../server';
import type { DbCustomer, DbOrder, DbOrderItem, DbValidationError } from '../types';

const BUYER = 'logistics-buyer-svc';

// ---------------------------------------------------------------- upload side-channel
// The shared core route `PUT files /documents/:type` keeps only metadata, not the bytes. The client
// service hands the uploaded base64 to this cache (keyed by the returned URL) so import-orders can "download" it.
const uploadedFiles = new Map<string, string>();
export function rememberUploadedFile(url: string, base64: string) {
  uploadedFiles.set(url, base64);
  if (uploadedFiles.size > 20) uploadedFiles.delete(uploadedFiles.keys().next().value as string);
}

// ---------------------------------------------------------------- Hyderabad reference places
interface Place { area: string; pincode: string; lat: number; lon: number; streets: string[]; city?: string }
export const HYD_PLACES: Place[] = [
  // the 16 localities used by the core seed (same names / coordinates)
  { area: 'Dilsukhnagar', pincode: '500060', lat: 17.3688, lon: 78.5247, streets: ['Main Road', 'Kamala Nagar', 'Chaitanyapuri Colony', 'Bus Depot Road'] },
  { area: 'Kothapet', pincode: '500035', lat: 17.368, lon: 78.543, streets: ['Fruit Market Road', 'Mohan Nagar', 'Green Hills Colony'] },
  { area: 'Vanasthalipuram', pincode: '500070', lat: 17.3258, lon: 78.56, streets: ['Gandhi Nagar Road', 'Sahebnagar', 'NGO Colony', 'Panama Godowns Road'] },
  { area: 'Hayathnagar', pincode: '501505', lat: 17.327, lon: 78.604, streets: ['Vijayawada Highway', 'Bhagyalatha Colony', 'Kuntloor Road'], city: 'Hayathnagar' },
  { area: 'LB Nagar', pincode: '500074', lat: 17.3457, lon: 78.5522, streets: ['Ring Road', 'Sirisha Nagar', 'Metro Station Road'] },
  { area: 'Saroornagar', pincode: '500035', lat: 17.353, lon: 78.537, streets: ['Lake Road', 'Victoria Memorial Road', 'Kharmanghat Road'] },
  { area: 'Uppal', pincode: '500039', lat: 17.4058, lon: 78.5591, streets: ['Main Road', 'Ramanthapur Road', 'Survey of India Colony', 'Depot Road'] },
  { area: 'Boduppal', pincode: '500092', lat: 17.4139, lon: 78.5783, streets: ['Laxmi Nagar Colony', 'Peerzadiguda Road', 'Chengicherla X Roads'] },
  { area: 'Kukatpally', pincode: '500072', lat: 17.4948, lon: 78.3996, streets: ['KPHB Colony Road No 1', 'Vivekananda Nagar', 'JNTU Road', 'Balaji Nagar'] },
  { area: 'Moosapet', pincode: '500018', lat: 17.47, lon: 78.425, streets: ['Bharat Nagar', 'Y Junction Road', 'Kalyan Nagar'] },
  { area: 'Ameerpet', pincode: '500016', lat: 17.4375, lon: 78.4483, streets: ['Satyam Theatre Road', 'Srinivasa Nagar', 'Leelanagar'] },
  { area: 'Begumpet', pincode: '500016', lat: 17.4447, lon: 78.4664, streets: ['Prakash Nagar', 'Brahmanwadi', 'Old Airport Road'] },
  { area: 'Secunderabad', pincode: '500003', lat: 17.4399, lon: 78.4983, streets: ['Rashtrapati Road', 'Regimental Bazaar', 'SD Road', 'Paradise Circle'], city: 'Secunderabad' },
  { area: 'Tarnaka', pincode: '500017', lat: 17.427, lon: 78.53, streets: ['Street No 1', 'Lalapet Road', 'Vijayapuri Colony'], city: 'Secunderabad' },
  { area: 'Mehdipatnam', pincode: '500028', lat: 17.395, lon: 78.44, streets: ['Rethibowli', 'Humayun Nagar', 'Gudimalkapur Road'] },
  { area: 'Tolichowki', pincode: '500008', lat: 17.398, lon: 78.415, streets: ['Seven Tombs Road', 'Nanal Nagar', 'Shaikpet Road'] },
  // extra areas for the autocomplete
  { area: 'Banjara Hills', pincode: '500034', lat: 17.4126, lon: 78.4482, streets: ['Road No 1', 'Road No 2', 'Road No 3', 'Road No 10', 'Road No 12'] },
  { area: 'Jubilee Hills', pincode: '500033', lat: 17.431, lon: 78.407, streets: ['Road No 36', 'Road No 45', 'Film Nagar', 'Check Post Road'] },
  { area: 'Madhapur', pincode: '500081', lat: 17.4483, lon: 78.3915, streets: ['Ayyappa Society', 'Kavuri Hills', 'HITEC City Main Road'] },
  { area: 'Gachibowli', pincode: '500032', lat: 17.4401, lon: 78.3489, streets: ['DLF Road', 'Indira Nagar', 'Telecom Nagar'] },
  { area: 'Kondapur', pincode: '500084', lat: 17.4615, lon: 78.3657, streets: ['Botanical Garden Road', 'Raghavendra Colony', 'Kothaguda X Roads'] },
  { area: 'Miyapur', pincode: '500049', lat: 17.4968, lon: 78.3614, streets: ['Allwyn Colony', 'Mathrusri Nagar', 'Hafeezpet Road'] },
  { area: 'Malakpet', pincode: '500036', lat: 17.3757, lon: 78.5028, streets: ['Azampura', 'Moosarambagh', 'Old Malakpet Road'] },
  { area: 'Charminar', pincode: '500002', lat: 17.3616, lon: 78.4747, streets: ['Laad Bazaar', 'Pathergatti', 'Gulzar Houz'] },
  { area: 'Himayatnagar', pincode: '500029', lat: 17.402, lon: 78.484, streets: ['Street No 5', 'Liberty Road', 'Narayanguda Road'] },
  { area: 'Abids', pincode: '500001', lat: 17.392, lon: 78.476, streets: ['Bank Street', 'Chirag Ali Lane', 'Troop Bazaar'] },
  { area: 'Nampally', pincode: '500001', lat: 17.388, lon: 78.468, streets: ['Station Road', 'Public Garden Road', 'Mallepally'] },
  { area: 'Somajiguda', pincode: '500082', lat: 17.4239, lon: 78.4583, streets: ['Raj Bhavan Road', 'Yashoda Nagar', 'Panjagutta Road'] },
  { area: 'Attapur', pincode: '500048', lat: 17.37, lon: 78.43, streets: ['Pillar No 140', 'Hyderguda Road', 'Rajendra Nagar Road'] },
  { area: 'Kompally', pincode: '500014', lat: 17.536, lon: 78.486, streets: ['NH 44 Service Road', 'Petbasheerabad', 'Dulapally Road'] },
  { area: 'Alwal', pincode: '500010', lat: 17.502, lon: 78.505, streets: ['Lothkunta', 'Macha Bolarum Road', 'Venkatapuram'], city: 'Secunderabad' },
  { area: 'ECIL', pincode: '500062', lat: 17.47, lon: 78.57, streets: ['Kamala Nagar', 'AS Rao Nagar', 'Kushaiguda Road'] },
  { area: 'Nagole', pincode: '500068', lat: 17.373, lon: 78.56, streets: ['Bandlaguda Road', 'Mamatha Nagar', 'Metro Depot Road'] },
  { area: 'Shamshabad', pincode: '501218', lat: 17.26, lon: 78.39, streets: ['Airport Road', 'RGIA Colony', 'Bengaluru Highway'], city: 'Shamshabad' },
];

const inHyderabad = (lat: number, lon: number) => lat > 17.1 && lat < 17.7 && lon > 78.15 && lon < 78.8;

export function nearestPlace(lat: number, lon: number, among: Place[] = HYD_PLACES): Place {
  let best = among[0];
  let bestD = Infinity;
  among.forEach((p) => {
    const d = (p.lat - lat) ** 2 + (p.lon - lon) ** 2;
    if (d < bestD) { bestD = d; best = p; }
  });
  return best;
}

/** Nearest beat (by its area's coordinates) — keeps newly created customers attached to a real beat. */
function nearestBeatId(lat: number, lon: number): string {
  const beats = db().beats;
  if (!beats.length) return '';
  const withPlace = beats.map((b) => ({ b, p: HYD_PLACES.find((p) => p.area.toLowerCase() === (b.area || '').toLowerCase()) })).filter((x) => x.p);
  if (!withPlace.length || !inHyderabad(lat, lon)) return beats[0].id;
  let best = withPlace[0];
  let bestD = Infinity;
  withPlace.forEach((x) => {
    const d = (x.p!.lat - lat) ** 2 + (x.p!.lon - lon) ** 2;
    if (d < bestD) { bestD = d; best = x; }
  });
  return best.b.id;
}

const hash = (s: string) => {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
};
const jitter = (s: string, span = 0.006) => ((hash(s) % 1000) / 1000 - 0.5) * span;
const round6 = (n: number) => Math.round(n * 1e6) / 1e6;
const round2 = (n: number) => Math.round(n * 100) / 100;
const pad = (n: number) => String(n).padStart(2, '0');
const localYmdHms = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
const tomorrowIso = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
};

// ---------------------------------------------------------------- GET /geocode/autocomplete
interface Suggestion { formatted: string; city: string; state: string; pincode: string; lat: number; lon: number }

function formatSuggestion(provider: string, prefix: string, street: string, p: Place): Suggestion {
  const city = p.city || 'Hyderabad';
  const parts = [prefix, street, p.area].filter(Boolean);
  // Geoapify omits the postcode for some street-level hits — a realistic case where the user must type the pincode.
  const noPostcode = provider === 'geoapify' && hash(street + p.area) % 5 === 0;
  const pincode = noPostcode ? '' : p.pincode;
  const formatted = provider === 'geoapify'
    ? `${parts.join(', ')}, ${city}${pincode ? ` - ${pincode}` : ''}, Telangana, India`
    : `${parts.join(', ')}, ${city}, Telangana ${p.pincode}, India`;
  const key = `${provider}|${prefix}|${street}|${p.area}`;
  return {
    formatted,
    city: provider === 'geoapify' && city === 'Hyderabad' && p.lat < 17.3 ? 'Ranga Reddy' : city,
    state: 'Telangana',
    pincode,
    lat: round6(p.lat + jitter(key + 'lat')),
    lon: round6(p.lon + jitter(key + 'lon')),
  };
}

route('GET', BUYER, '/geocode/autocomplete', (req) => {
  const raw = String(req.query.text || '').trim();
  const provider = req.query.provider === 'geoapify' ? 'geoapify' : 'google';
  if (raw.length < 3) return [];
  const q = raw.toLowerCase();
  if (q.includes('error')) throw new MockError(500, 'Geocoding provider unavailable');

  const words = q.split(/[\s,]+/).filter((w) => w.length >= 3 && !/^(road|no|street|colony|nagar|main|hyderabad|telangana|india)$/.test(w));
  const pin = q.match(/\b(5\d{5})\b/)?.[1];
  type Hit = { p: Place; street: string; prefix: string; score: number };
  const hits: Hit[] = [];

  HYD_PLACES.forEach((p) => {
    const areaL = p.area.toLowerCase();
    // where in the query does the area name start? text before it is kept as an address prefix (house no., road…)
    let idx = -1;
    let areaMatch = false;
    for (const w of words) {
      if (areaL.split(' ').some((aw) => aw.startsWith(w) || w.startsWith(aw)) || areaL.replace(/\s/g, '').startsWith(w)) {
        areaMatch = true;
        const at = q.indexOf(w);
        idx = idx < 0 ? at : Math.min(idx, at);
      }
    }
    const pinMatch = !!pin && p.pincode === pin;
    const streetMatches = p.streets.filter((s) => words.some((w) => s.toLowerCase().includes(w)));
    if (!areaMatch && !pinMatch && !streetMatches.length) return;
    const prefix = areaMatch && idx > 0 ? raw.slice(0, idx).replace(/[\s,]+$/, '').trim() : '';
    const score = (areaMatch ? 10 : 0) + (pinMatch ? 5 : 0) + streetMatches.length * 3;
    if (streetMatches.length) streetMatches.forEach((s) => hits.push({ p, street: s, prefix, score: score + 1 }));
    hits.push({ p, street: '', prefix, score });
    if (areaMatch) p.streets.slice(0, 2).forEach((s) => !streetMatches.includes(s) && hits.push({ p, street: s, prefix: '', score: score - 1 }));
  });

  if (!hits.length && /hyderabad|telangana|secunderabad/.test(q)) {
    ['Banjara Hills', 'Ameerpet', 'Dilsukhnagar', 'Kukatpally', 'Secunderabad'].forEach((a) => hits.push({ p: HYD_PLACES.find((p) => p.area === a)!, street: '', prefix: '', score: 1 }));
  }

  hits.sort((a, b) => b.score - a.score);
  const seen = new Set<string>();
  const out: Suggestion[] = [];
  for (const h of hits) {
    const s = formatSuggestion(provider, h.prefix, h.street, h.p);
    if (seen.has(s.formatted)) continue;
    seen.add(s.formatted);
    out.push(s);
    if (out.length >= 5) break;
  }
  return out;
});

// ---------------------------------------------------------------- shared helpers (customer master link)
function findCustomerBy(pred: (c: DbCustomer) => boolean): DbCustomer | undefined {
  return db().customers.find(pred);
}
const isDeleted = (c: DbCustomer) => c.status === 'Deleted' || !!(c as any).deleted_at;
function revive(c: DbCustomer) {
  if (isDeleted(c)) {
    c.status = 'Active';
    delete (c as any).deleted_at;
    c.updated_at = nowIso();
  }
}

function createCustomer(fields: Partial<DbCustomer> & { customer_unique_id: string }, updatedBy: string): DbCustomer {
  const d = db();
  const lat = Number(fields.latitude);
  const lon = Number(fields.longitude);
  const hasLoc = !isNaN(lat) && !isNaN(lon) && !!fields.latitude && !!fields.longitude;
  const place = hasLoc && inHyderabad(lat, lon) ? nearestPlace(lat, lon, HYD_PLACES.slice(0, 16)) : null;
  const now = nowIso();
  const c: DbCustomer = {
    id: uuid(),
    customer_unique_id: fields.customer_unique_id,
    buyer_id: d.buyer.id,
    mobile_number: fields.mobile_number ?? '',
    business_name: fields.business_name ?? '',
    customer_name: fields.customer_name ?? fields.business_name ?? '',
    latitude: fields.latitude ?? '',
    longitude: fields.longitude ?? '',
    address: fields.address ?? '',
    status: 'Active',
    created_at: now,
    updated_at: now,
    created_by: null,
    updated_by: updatedBy,
    is_bulk_order: false,
    locality: place?.area ?? '',
    city: fields.city ?? place?.city ?? 'Hyderabad',
    state: fields.state ?? 'Telangana',
    pincode: fields.pincode ?? place?.pincode ?? '',
    beatId: fields.beatId || nearestBeatId(hasLoc ? lat : 17.385, hasLoc ? lon : 78.4867),
  };
  d.customers.push(c);
  return c;
}

// ---------------------------------------------------------------- POST /orders (quick order)
function quickRef(): string {
  const d = new Date();
  const letters = Array.from({ length: 4 }, () => 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)]).join('');
  return `QS-${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}-${letters}`;
}

route('POST', BUYER, '/orders', (req) => {
  const d = db();
  const b = req.body || {};
  if (!b.buyerId) throw new MockError(400, 'buyerId is required');
  const name = String(b.customerName ?? '').trim();
  if (!name) throw new MockError(400, 'Customer name is required');
  const mobile = String(b.customerMobileNumber ?? '').trim();
  if (!/^[6-9]\d{9}$/.test(mobile)) throw new MockError(400, 'Invalid customer mobile number. It must be a 10-digit number starting with 6-9.');
  const addressLine = String(b.customerAddress ?? '').trim();
  if (!addressLine) throw new MockError(400, 'Customer address is required');
  const amount = Number(b.amount);
  if (!(amount > 0)) throw new MockError(400, 'Order amount must be greater than 0');
  const pincode = String(b.customerPincode ?? '').trim();
  if (!/^\d{6}$/.test(pincode)) {
    return new RawResponse({ success: false, error: { code: 'INVALID_PINCODE', message: 'Invalid pincode. Pincode must be exactly 6 digits.' } });
  }
  if (!d.addresses.some((a) => a.is_default)) throw new MockError(400, 'No default warehouse address found. Please set a default pickup address.');

  // location: explicit lat/long → existing customer master → pincode centroid → city centre
  const existing = findCustomerBy((c) => c.mobile_number === mobile && !isDeleted(c)) || findCustomerBy((c) => c.mobile_number === mobile);
  let lat = Number(b.customerLat);
  let lng = Number(b.customerLong);
  if (!b.customerLat || isNaN(lat) || !b.customerLong || isNaN(lng)) {
    const mLat = Number(existing?.latitude);
    const mLng = Number(existing?.longitude);
    const byPin = HYD_PLACES.find((p) => p.pincode === pincode);
    if (existing?.latitude && existing?.longitude && !isNaN(mLat) && !isNaN(mLng)) { lat = mLat; lng = mLng; }
    else if (byPin) { lat = round6(byPin.lat + jitter(addressLine + 'a')); lng = round6(byPin.lon + jitter(addressLine + 'b')); }
    else { lat = 17.385044; lng = 78.486671; }
  }

  const customer = existing
    ? (revive(existing), existing)
    : createCustomer({
        customer_unique_id: mobile, mobile_number: mobile, business_name: String(b.customerBusinessName || name), customer_name: name,
        latitude: String(lat), longitude: String(lng), address: addressLine, city: String(b.customerCity ?? ''), state: String(b.customerState ?? ''), pincode,
      }, 'manual');
  const beat = d.beats.find((x) => x.id === customer.beatId) || null;
  const place = inHyderabad(lat, lng) ? nearestPlace(lat, lng, HYD_PLACES.slice(0, 16)) : null;

  const orderId = uuid();
  const items: DbOrderItem[] = (Array.isArray(b.items) ? b.items : []).map((it: any, i: number) => {
    const qty = Number(it.qty) || 1;
    const price = Number(it.sellingPrice) || 0;
    const product = d.products.find((p) => p.name.toLowerCase() === String(it.itemName || '').trim().toLowerCase());
    return {
      itemId: String(it.itemId || `item-${i + 1}`), productId: product?.id ?? `quick-${it.itemId || i + 1}`, itemName: String(it.itemName ?? ''),
      quantity: qty, mrp: product?.mrp ?? price, sellingPrice: price, totalAmount: round2(Number(it.totalAmount ?? price * qty)),
      weightKg: Number(it.unitWeight) || 0, upc: product?.upc ?? 1, gstPercentage: product?.gstPercentage ?? 0, hsnCode: product?.hsnCode ?? '',
      imageUrl: product?.imageUrl ?? 'https://placehold.co/96x96/e8f0fe/1e3a8a?text=Item', uom: 'kg', packageType: product?.packageType ?? 'Unit',
      deliveredQuantity: 0, returnedQuantity: 0,
    };
  });
  const orderWeight = Number(b.orderWeight) || 1;
  const orderDate = b.orderDate && !isNaN(new Date(b.orderDate).getTime()) ? new Date(b.orderDate) : new Date();
  const order: DbOrder = {
    orderId, refOrderId: quickRef(), buyerId: String(b.buyerId), customerId: customer.id, customerName: name,
    customerBusinessName: String(b.customerBusinessName || name), customerMobileNumber: mobile,
    address: { line: addressLine, locality: place?.area ?? '', city: String(b.customerCity ?? ''), state: String(b.customerState ?? ''), country: String(b.customerCountry || 'India'), pincode },
    lat, lng, amount: round2(amount), orderWeight, volumetricWeight: Number(b.volumetricWeight) || orderWeight,
    orderType: null, salesPersonName: null, salesBeatName: beat?.name ?? null, beatId: beat?.id ?? null,
    createdAt: nowIso(), orderDate: localYmdHms(orderDate), deliveryDate: tomorrowIso(), orderStatusId: Number(b.statusId) || 1,
    validationErrors: [], isDeliveryAddressUpdated: false, tripId: null, tripHistory: [], items, rtoReasonId: null, returnReason: null,
    routePlanComboId: null, statusBeforeOffline: null, source: 'quick',
  };
  Object.assign(order, { dimensions: String(b.dimensions || '10x10x10') });
  d.orders.unshift(order);
  persist();
  if (mobile === '9000000001') return { message: 'Order accepted for processing' }; // demo: success without an id
  return { orderIds: [orderId], refOrderId: order.refOrderId };
});

// ---------------------------------------------------------------- POST /orders/import-orders
const str = (v: unknown) => (v === undefined || v === null ? '' : String(v).trim());
const isBlank = (v: unknown) => str(v) === '';
const num = (v: unknown) => (isBlank(v) ? NaN : Number(v));

function toCm(value: number, unit: string): number {
  const u = unit.toLowerCase();
  if (u.startsWith('m') && !u.startsWith('mm') && !u.startsWith('mill')) return value * 100; // Meter / Metre / m
  if (u.startsWith('mm') || u.startsWith('mill')) return value / 10;
  if (u.startsWith('in')) return value * 2.54;
  if (u.startsWith('f')) return value * 30.48;
  return value; // cm / Centimeter / blank
}

function validBillingDate(v: string): { ok: boolean; msg?: string } {
  if (!v) return { ok: false, msg: 'Billing Date is required' };
  const m = v.match(/^(\d{4})-(\d{2})-(\d{2})(?: (\d{2}):(\d{2}):(\d{2}))?$/);
  if (!m) return { ok: false, msg: 'Billing Date format is invalid. Expected YYYY-MM-DD' };
  const dt = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  if (dt.getMonth() !== Number(m[2]) - 1 || dt.getDate() !== Number(m[3])) return { ok: false, msg: 'Billing Date is not a valid calendar date' };
  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);
  if (dt.getTime() > endOfToday.getTime()) return { ok: false, msg: 'Billing Date cannot be a future date' };
  return { ok: true };
}

route('POST', BUYER, '/orders/import-orders', (req) => {
  const d = db();
  const { buyerId, fileUrl } = req.body || {};
  if (!buyerId) throw new MockError(400, 'buyerId is required');
  if (!fileUrl) throw new MockError(400, 'fileUrl is required');
  const b64 = uploadedFiles.get(String(fileUrl));
  if (!b64) throw new MockError(400, 'Unable to download the uploaded file. Please upload it again.');

  let rows: Record<string, unknown>[];
  try {
    const wb = XLSX.read(b64, { type: 'base64' });
    const sheet = wb.Sheets[wb.SheetNames[0]];
    rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });
  } catch {
    throw new MockError(422, 'Unable to parse the uploaded file. Please upload a valid .xlsx file.');
  }
  if (!rows.length) throw new MockError(400, 'No orders found in the uploaded file.');

  // duplicates → the backend's transaction error (client maps it to "Duplicate orders detected…")
  const invoices = new Set(rows.map((r) => str(r['Invoice ID'])).filter(Boolean));
  if (d.orders.some((o) => o.buyerId === buyerId && invoices.has(o.refOrderId))) {
    throw new MockError(409, 'Transaction query already complete', { success: false, error: { code: 409, message: 'Transaction query already complete' } });
  }

  // group rows (one row = one order line) by Order ID + Invoice ID + Customer ID
  const groups = new Map<string, { rowNumber: number; row: Record<string, unknown> }[]>();
  rows.forEach((row, i) => {
    const key = `${str(row['Order ID'])}|${str(row['Invoice ID'])}|${str(row['Customer ID'])}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push({ rowNumber: i + 2, row });
  });

  const created: DbOrder[] = [];
  groups.forEach((lines) => {
    const r0 = lines[0].row;
    const errors: DbValidationError[] = [];
    const co = (fieldName: string, currentValue: unknown, errorMessage: string, isMandatory = true) =>
      errors.push({ group: 'customer_order', fieldName, currentValue: str(currentValue), isMandatory, errorMessage });

    const uid = str(r0['UID']);
    const extCustomerId = str(r0['Customer ID']);
    const invoice = str(r0['Invoice ID']);
    const storeName = str(r0['Store Name']);
    const storeAddress = str(r0['Store Address']);
    const mobile = str(r0['Store Mobile Number']);
    const billing = str(r0['Billing Date']);
    const beatName = str(r0['BeatName']);
    const dsName = str(r0['DsName']);
    const orderTypeRaw = str(r0['OrderType']);

    if (!uid) co('customer_uniq_identifier', uid, 'UID is required');
    if (!extCustomerId) co('customer_id', extCustomerId, 'Customer ID is required');
    if (!invoice) co('ref_order_id', invoice, 'Invoice ID is required');
    const bd = validBillingDate(billing);
    if (!bd.ok) co('order_date', r0['Billing Date'], bd.msg!);
    if (!storeName) co('customer_name', storeName, 'Store Name is required');
    if (!storeAddress) co('customer_address', storeAddress, 'Store Address is required');

    // customer master link (UID ↔ customer_unique_id)
    const masterKey = uid || mobile || extCustomerId;
    const master = masterKey ? findCustomerBy((c) => c.customer_unique_id === masterKey) : undefined;
    const mLat = Number(master?.latitude);
    const mLng = Number(master?.longitude);
    const masterHasLoc = !!master?.latitude && !!master?.longitude && !isNaN(mLat) && !isNaN(mLng);

    const coord = (raw: unknown, label: string, field: string, limit: number) => {
      const n = num(raw);
      if (isBlank(raw)) return { n: NaN, err: `${label} is required` };
      if (isNaN(n) || n < -limit || n > limit) return { n: NaN, err: `${label} must be a valid number between -${limit} and ${limit}` };
      if (n === 0) return { n: NaN, err: `${label} cannot be 0` };
      return { n, err: '', field };
    };
    const latR = coord(r0['Delivery Lat'], 'Delivery Latitude', 'customer_lat', 90);
    const lngR = coord(r0['Delivery Long'], 'Delivery Longitude', 'customer_long', 180);
    let lat = latR.n;
    let lng = lngR.n;
    if ((latR.err || lngR.err) && masterHasLoc) {
      lat = mLat; // the customer master already knows this store's location
      lng = mLng;
    } else {
      if (latR.err) co('customer_lat', r0['Delivery Lat'], latR.err);
      if (lngR.err) co('customer_long', r0['Delivery Long'], lngR.err);
    }
    if (!/^[6-9]\d{9}$/.test(mobile)) co('customer_mobile_number', mobile, 'Store Mobile must be a valid 10-digit number');

    // pincode is not a template column: taken from the address, else from the nearest known locality
    const located = !isNaN(lat) && !isNaN(lng) && inHyderabad(lat, lng);
    const place = located ? nearestPlace(lat, lng) : null;
    const pincode = storeAddress.match(/\b(\d{6})\b/)?.[1] || (place && (place.lat - lat) ** 2 + (place.lon - lng) ** 2 < 0.02 ? place.pincode : '') || (master?.pincode ?? '');
    if (!pincode) co('customer_pincode', '', 'Pincode could not be determined from Store Address');

    const nivBad = lines.some(({ row }) => !isBlank(row['Net Invoice Value']) && (isNaN(num(row['Net Invoice Value'])) || num(row['Net Invoice Value']) < 0));
    const amount = round2(lines.reduce((s, { row }) => s + (Number(row['Net Invoice Value']) || 0), 0));
    if (nivBad) co('total_amount', lines.map(({ row }) => str(row['Net Invoice Value'])).find((v) => v && (isNaN(Number(v)) || Number(v) < 0)), 'Net Invoice Value must be a valid non-negative number', false);

    let orderType: DbOrder['orderType'] = null;
    if (orderTypeRaw === 'Unnati' || orderTypeRaw === 'Digital') orderType = 'Digital';
    else if (orderTypeRaw === 'Others' || orderTypeRaw === 'Sales') orderType = 'Sales';
    else co('order_type', orderTypeRaw, 'Order Type must be either Digital or Sales');

    if (beatName && !/^[a-zA-Z\s]+$/.test(beatName)) co('beat', beatName, 'Beat should contain alphabetic characters only', false);

    // items (one per row)
    const usedIds = new Set<string>();
    let volumetric = 0;
    const items: DbOrderItem[] = lines.map(({ row, rowNumber }) => {
      let itemId = str(row['Item Code']) || `ROW${rowNumber}`;
      if (usedIds.has(itemId)) itemId = `${itemId}-${rowNumber}`;
      usedIds.add(itemId);
      const pe = (fieldName: string, errorMessage: string, raw: unknown) =>
        errors.push({ group: 'product', fieldName, currentValue: str(raw), isMandatory: true, errorMessage, itemId, rowNumber });
      const positive = (raw: unknown, field: string, label: string, min = 0) => {
        if (isBlank(raw)) pe(field, `${label} is required`, raw);
        else if (isNaN(num(raw)) || num(raw) <= min) pe(field, min === 0 ? `${label} must be greater than 0` : `${label} must be at least ${min + 1}`, raw);
      };
      if (isBlank(row['Item Description'])) pe('item_name', 'Item Description is required', row['Item Description']);
      if (isBlank(row['Qty'])) pe('qty', 'Quantity is required', row['Qty']);
      else if (isNaN(num(row['Qty'])) || num(row['Qty']) < 1) pe('qty', 'Quantity must be at least 1', row['Qty']);
      positive(row['Weight'], 'unit_weight', 'Weight');
      positive(row['MRP'], 'mrp', 'MRP');
      positive(row['Length'], 'length', 'Length');
      positive(row['Width'], 'width', 'Width');
      positive(row['Height'], 'height', 'Height');

      const qty = Number(row['Qty']) || 0;
      const niv = Number(row['Net Invoice Value']) || 0;
      const unit = str(row['CFC Dimensions unit']);
      const [lc, wc, hc] = ['Length', 'Width', 'Height'].map((k) => round2(toCm(Number(row[k]) || 0, unit)));
      volumetric += ((lc * wc * hc) / 5000) * (Number(row['Total CFC']) || 1);
      const cfc = Number(row['CFC Conversion']) || 0;
      const pac = Number(row['PAC Conversion']) || 0;
      const item: DbOrderItem = {
        itemId, productId: `imp-${str(row['MSKU Code']) || itemId}`, itemName: str(row['Item Description']), quantity: qty,
        mrp: Number(row['MRP']) || 0, sellingPrice: qty ? round2(niv / qty) : niv, totalAmount: round2(niv),
        weightKg: Number(row['Gross Weight Per Piece']) || (qty ? round2((Number(row['Weight']) || 0) / qty) : 0),
        upc: cfc && pac ? Math.max(1, Math.round(cfc / pac)) : 1, gstPercentage: 0, hsnCode: '',
        imageUrl: `https://placehold.co/96x96/e8f0fe/1e3a8a?text=${encodeURIComponent(str(row['Category Code']) || 'Item')}`,
        uom: str(row['UOM']) || 'kg', packageType: str(row['Entered UOM']) || 'Unit', deliveredQuantity: 0, returnedQuantity: 0,
      };
      Object.assign(item, {
        itemCode: str(row['Item Code']), mskuCode: str(row['MSKU Code']), category: str(row['Category']), batch: str(row['BATCH']),
        lengthCm: lc, widthCm: wc, heightCm: hc, rowNumber,
      });
      return item;
    });
    const orderWeight = round2(lines.reduce((s, { row }) => s + (Number(row['Weight']) || 0), 0));

    // address parts (Hyderabad stores resolve to the seed localities; others are split from the address text)
    const parts = storeAddress.split(',').map((p) => p.trim()).filter(Boolean);
    const country = parts.length && /india/i.test(parts[parts.length - 1]) ? parts[parts.length - 1] : 'INDIA';
    const state = located ? 'Telangana' : parts.length >= 3 ? parts[parts.length - 2] : '';
    const city = located ? (place?.city || 'Hyderabad') : parts.length >= 3 ? parts[parts.length - 3] : '';
    const locality = located ? nearestPlace(lat, lng, HYD_PLACES.slice(0, 16)).area : '';

    const customer = master
      ? (revive(master), master)
      : createCustomer({
          customer_unique_id: masterKey || `IMP-${uuid().slice(0, 8).toUpperCase()}`, mobile_number: mobile, business_name: storeName, customer_name: storeName,
          latitude: isNaN(lat) ? '' : String(lat), longitude: isNaN(lng) ? '' : String(lng), address: storeAddress, city, state, pincode,
          beatId: d.beats.find((x) => x.name.toLowerCase() === beatName.toLowerCase())?.id,
        }, 'system');
    const beat = d.beats.find((x) => x.name.toLowerCase() === beatName.toLowerCase()) || null;

    const order: DbOrder = {
      orderId: uuid(), refOrderId: invoice, buyerId: String(buyerId), customerId: customer.id, customerName: storeName, customerBusinessName: storeName,
      customerMobileNumber: mobile, address: { line: storeAddress, locality, city, state, country, pincode },
      lat: isNaN(lat) ? 0 : lat, lng: isNaN(lng) ? 0 : lng, amount, orderWeight, volumetricWeight: round2(Math.max(orderWeight, volumetric)),
      orderType, salesPersonName: dsName || null, salesBeatName: beatName || null, beatId: beat?.id ?? null,
      createdAt: nowIso(), orderDate: bd.ok ? (billing.length === 10 ? `${billing} 00:00:00` : billing) : '', deliveryDate: tomorrowIso(),
      orderStatusId: errors.length ? 9 : 1, validationErrors: errors, isDeliveryAddressUpdated: false, tripId: null, tripHistory: [], items,
      rtoReasonId: null, returnReason: null, routePlanComboId: null, statusBeforeOffline: null, source: 'import',
    };
    // import-only metadata (lets Fix Errors write back UID / Customer ID / the external Order ID)
    Object.assign(order, {
      externalOrderId: str(r0['Order ID']), externalCustomerId: extCustomerId, customerUid: uid, wdDestCode: str(r0['WD Dest Code']),
      wdName: str(r0['WD Name']), dsType: str(r0['DsType']), importedFrom: String(fileUrl),
    });
    created.push(order);
  });

  d.orders.unshift(...created);
  persist();
  const pending = created.filter((o) => o.orderStatusId === 9);
  return {
    imported: created.length,
    pending: pending.length,
    readyForPlanning: created.length - pending.length,
    totalRows: rows.length,
    orderIds: created.map((o) => o.orderId),
  };
});
