// Deterministic synthetic dataset for the mock backend (Hyderabad FMCG distribution).
// Core entities live here; feature modules add their own data through seed extensions
// (src/mock/extensions/*.ts, auto-loaded) and store it under `db.ext`.
import type {
  DbAddress, DbBeat, DbBuyer, DbCluster, DbCustomer, DbOrder, DbOrderItem, DbPermission, DbPerson,
  DbProduct, DbProvider, DbSalesPerson, DbStop, DbTrip, DbValidationError, DbVehicle,
} from './types';

export interface BuyerSettingsRecord {
  id: string;
  buyer_id: string;
  admin_config: { isPermissionsEnabled: boolean; warehouseLocation: unknown[] };
  buyer_config: Record<string, any>;
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by: string;
}

export interface MockDatabase {
  __version: number;
  seededAt: string;
  buyer: DbBuyer;
  permissions: (DbPermission | string)[];
  addresses: DbAddress[];
  buyerSettings: BuyerSettingsRecord;
  customers: DbCustomer[];
  beats: DbBeat[];
  clusters: DbCluster[];
  salesPersons: DbSalesPerson[];
  products: DbProduct[];
  vehicles: DbVehicle[];
  drivers: DbPerson[];
  helpers: DbPerson[];
  providers: DbProvider[];
  orders: DbOrder[];
  trips: DbTrip[];
  /** Feature-specific collections created by seed extensions (route plans, issues, …). */
  ext: Record<string, any>;
}

export type SeedExtension = (db: MockDatabase, rng: Rng) => void;

// ---------------------------------------------------------------- RNG
export interface Rng {
  next(): number;
  int(min: number, max: number): number;
  pick<T>(arr: T[]): T;
  bool(p?: number): boolean;
  uuid(): string;
  digits(n: number): string;
  letters(n: number): string;
}

export function createRng(seed: number): Rng {
  let s = seed >>> 0;
  const next = () => {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const int = (min: number, max: number) => Math.floor(next() * (max - min + 1)) + min;
  const hex = (n: number) => Array.from({ length: n }, () => '0123456789abcdef'[int(0, 15)]).join('');
  return {
    next,
    int,
    pick: (arr) => arr[Math.floor(next() * arr.length)],
    bool: (p = 0.5) => next() < p,
    uuid: () => `${hex(8)}-${hex(4)}-4${hex(3)}-${'89ab'[int(0, 3)]}${hex(3)}-${hex(12)}`,
    digits: (n) => Array.from({ length: n }, () => String(int(0, 9))).join(''),
    letters: (n) => Array.from({ length: n }, () => 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[int(0, 25)]).join(''),
  };
}

// ---------------------------------------------------------------- reference data
const LOCALITIES: { name: string; lat: number; lng: number; pincode: string }[] = [
  { name: 'Dilsukhnagar', lat: 17.3688, lng: 78.5247, pincode: '500060' },
  { name: 'Kothapet', lat: 17.368, lng: 78.543, pincode: '500035' },
  { name: 'Vanasthalipuram', lat: 17.3258, lng: 78.56, pincode: '500070' },
  { name: 'Hayathnagar', lat: 17.327, lng: 78.604, pincode: '501505' },
  { name: 'LB Nagar', lat: 17.3457, lng: 78.5522, pincode: '500074' },
  { name: 'Saroornagar', lat: 17.353, lng: 78.537, pincode: '500035' },
  { name: 'Uppal', lat: 17.4058, lng: 78.5591, pincode: '500039' },
  { name: 'Boduppal', lat: 17.4139, lng: 78.5783, pincode: '500092' },
  { name: 'Kukatpally', lat: 17.4948, lng: 78.3996, pincode: '500072' },
  { name: 'Moosapet', lat: 17.47, lng: 78.425, pincode: '500018' },
  { name: 'Ameerpet', lat: 17.4375, lng: 78.4483, pincode: '500016' },
  { name: 'Begumpet', lat: 17.4447, lng: 78.4664, pincode: '500016' },
  { name: 'Secunderabad', lat: 17.4399, lng: 78.4983, pincode: '500003' },
  { name: 'Tarnaka', lat: 17.427, lng: 78.53, pincode: '500017' },
  { name: 'Mehdipatnam', lat: 17.395, lng: 78.44, pincode: '500028' },
  { name: 'Tolichowki', lat: 17.398, lng: 78.415, pincode: '500008' },
];

const BEAT_DEFS: { name: string; area: string; localities: string[] }[] = [
  { name: 'Mon Thursday - Dilsuknagar Zone', area: 'Dilsukhnagar', localities: ['Dilsukhnagar', 'Kothapet'] },
  { name: 'Weds Saturday - Vanastalipuram Zone', area: 'Vanasthalipuram', localities: ['Vanasthalipuram', 'Hayathnagar'] },
  { name: 'Tue Friday - LB Nagar Zone', area: 'LB Nagar', localities: ['LB Nagar', 'Saroornagar'] },
  { name: 'Mon Thursday - Uppal Zone', area: 'Uppal', localities: ['Uppal', 'Boduppal'] },
  { name: 'Tue Friday - Kukatpally Zone', area: 'Kukatpally', localities: ['Kukatpally', 'Moosapet'] },
  { name: 'Weds Saturday - Ameerpet Zone', area: 'Ameerpet', localities: ['Ameerpet', 'Begumpet'] },
  { name: 'Mon Thursday - Secunderabad Zone', area: 'Secunderabad', localities: ['Secunderabad', 'Tarnaka'] },
  { name: 'Tue Friday - Mehdipatnam Zone', area: 'Mehdipatnam', localities: ['Mehdipatnam', 'Tolichowki'] },
];

const RETAILERS = [
  'SRI LAKSHMI KIRANA & GENERAL STORE', 'Balaji Super Market', 'SAI RAM PROVISION STORE', 'Venkateswara Traders',
  'GANESH KIRANA STORES', 'Durga Bhavani General Store', 'ANNAPURNA KIRANA', 'Mahalakshmi Mini Mart',
  'SRI SAI KRISHNA KIRANA', 'New Krishna Provision Store', 'HANUMAN KIRANA & FANCY', 'Raghavendra Stores',
  'SRINIVASA SUPER BAZAAR', 'Padmavathi Kirana', 'RAVI TRADERS', 'Siddhi Vinayaka Stores', 'OM SAI GENERAL STORE',
  'Vijaya Durga Kirana', 'SRI RAMA PROVISIONS', 'Anjaneya Kirana', 'LAKSHMI GANAPATHI STORES', 'Kanaka Durga Mart',
  'SAI TEJA KIRANA', 'Manikanta General Store', 'BHAVANI SHANKAR TRADERS', 'Satyanarayana Kirana',
  'GAYATRI SUPER MARKET', 'Shiva Shakti Stores', 'JAI HANUMAN KIRANA', 'Sri Venkata Sai Mart', 'NAVYA FRESH MART',
  'Family Needs Store', 'DAILY BASKET', 'Green Leaf Kirana', 'CITY MART PROVISIONS', 'Apna Bazaar Kirana',
  'ROYAL KIRANA', 'Star Provision Store', 'SUNRISE GENERAL STORE', 'Pragathi Kirana',
];
const OWNER_NAMES = ['Ramesh', 'Suresh', 'Venkat', 'Srinivas', 'Lakshmi', 'Anil', 'Prasad', 'Kiran', 'Madhavi', 'Raju', 'Naresh', 'Swathi', 'Mahesh', 'Bhaskar', 'Padma', 'Ravi'];
const STREETS = ['Main Road', 'Gandhi Nagar Road', 'Bus Stop Road', 'Temple Street', 'Market Road', 'Colony Road', 'Cross Road', 'Ring Road'];

export const PRODUCTS: Omit<DbProduct, 'id' | 'imageUrl'>[] = [
  { name: 'Sunvita Refined Sunflower Oil, 1 Ltr Pouch', mrp: 215, sellingPrice: 167.5, weightKg: 0.91, upc: 10, gstPercentage: 5, hsnCode: '15121110', category: 'Edible Oil', packageType: 'Pouch', uom: 'kg' },
  { name: 'Sunvita Refined Sunflower Oil, 500 Ml Pouch', mrp: 126, sellingPrice: 84, weightKg: 0.46, upc: 20, gstPercentage: 5, hsnCode: '15121110', category: 'Edible Oil', packageType: 'Pouch', uom: 'kg' },
  { name: 'Goldleaf Groundnut Oil, 1 Ltr Pouch', mrp: 220, sellingPrice: 168, weightKg: 0.91, upc: 10, gstPercentage: 5, hsnCode: '15081000', category: 'Edible Oil', packageType: 'Pouch', uom: 'kg' },
  { name: 'Deepam Pooja Oil, 450 Ml Bottle', mrp: 108, sellingPrice: 69, weightKg: 0.42, upc: 24, gstPercentage: 5, hsnCode: '15159099', category: 'Pooja', packageType: 'Bottle', uom: 'kg' },
  { name: 'Deepam Pooja Oil, 900 Ml Bottle', mrp: 216, sellingPrice: 134, weightKg: 0.84, upc: 12, gstPercentage: 5, hsnCode: '15159099', category: 'Pooja', packageType: 'Bottle', uom: 'kg' },
  { name: 'Ruchika Palmolein Oil, 1 Ltr Pouch', mrp: 210, sellingPrice: 141.5, weightKg: 0.9, upc: 10, gstPercentage: 5, hsnCode: '15119010', category: 'Edible Oil', packageType: 'Pouch', uom: 'kg' },
  { name: 'Annapoorna Sona Masoori Rice, 25 Kg Bag', mrp: 1650, sellingPrice: 1420, weightKg: 25, upc: 1, gstPercentage: 5, hsnCode: '10063020', category: 'Rice', packageType: 'Bag', uom: 'kg' },
  { name: 'Annapoorna Sona Masoori Rice, 10 Kg Bag', mrp: 700, sellingPrice: 612, weightKg: 10, upc: 1, gstPercentage: 5, hsnCode: '10063020', category: 'Rice', packageType: 'Bag', uom: 'kg' },
  { name: 'Shakti Chakki Atta, 5 Kg Pack', mrp: 285, sellingPrice: 239, weightKg: 5, upc: 4, gstPercentage: 5, hsnCode: '11010000', category: 'Atta', packageType: 'Pack', uom: 'kg' },
  { name: 'Kisan Toor Dal, 1 Kg Pack', mrp: 185, sellingPrice: 158, weightKg: 1, upc: 20, gstPercentage: 5, hsnCode: '07136000', category: 'Pulses', packageType: 'Pack', uom: 'kg' },
  { name: 'Kisan Moong Dal, 500 G Pack', mrp: 82, sellingPrice: 71, weightKg: 0.5, upc: 30, gstPercentage: 5, hsnCode: '07133100', category: 'Pulses', packageType: 'Pack', uom: 'kg' },
  { name: 'Madhura Sugar, 1 Kg Pack', mrp: 54, sellingPrice: 46, weightKg: 1, upc: 25, gstPercentage: 5, hsnCode: '17019990', category: 'Sugar', packageType: 'Pack', uom: 'kg' },
  { name: 'Sagar Iodised Salt, 1 Kg Pack', mrp: 28, sellingPrice: 22, weightKg: 1, upc: 25, gstPercentage: 0, hsnCode: '25010020', category: 'Salt', packageType: 'Pack', uom: 'kg' },
  { name: 'Chaiwala Premium Tea, 250 G Pack', mrp: 145, sellingPrice: 118, weightKg: 0.25, upc: 48, gstPercentage: 5, hsnCode: '09024020', category: 'Beverages', packageType: 'Pack', uom: 'kg' },
  { name: 'Brewmax Instant Coffee, 50 G Jar', mrp: 185, sellingPrice: 152, weightKg: 0.1, upc: 24, gstPercentage: 18, hsnCode: '21011110', category: 'Beverages', packageType: 'Jar', uom: 'kg' },
  { name: 'Crispo Glucose Biscuits, 100 G', mrp: 10, sellingPrice: 8.4, weightKg: 0.1, upc: 120, gstPercentage: 18, hsnCode: '19053100', category: 'Biscuits', packageType: 'Packet', uom: 'kg' },
  { name: 'Crispo Cream Biscuits, 75 G', mrp: 20, sellingPrice: 16.5, weightKg: 0.075, upc: 96, gstPercentage: 18, hsnCode: '19053100', category: 'Biscuits', packageType: 'Packet', uom: 'kg' },
  { name: 'Snowfresh Detergent Powder, 1 Kg', mrp: 120, sellingPrice: 99, weightKg: 1, upc: 20, gstPercentage: 18, hsnCode: '34022010', category: 'Home Care', packageType: 'Pack', uom: 'kg' },
  { name: 'Snowfresh Detergent Bar, 250 G', mrp: 32, sellingPrice: 26, weightKg: 0.25, upc: 60, gstPercentage: 18, hsnCode: '34011190', category: 'Home Care', packageType: 'Bar', uom: 'kg' },
  { name: 'Neem Glow Bathing Soap, 100 G', mrp: 38, sellingPrice: 31, weightKg: 0.1, upc: 72, gstPercentage: 18, hsnCode: '34011110', category: 'Personal Care', packageType: 'Bar', uom: 'kg' },
  { name: 'Herbal Shine Shampoo, 180 Ml', mrp: 165, sellingPrice: 132, weightKg: 0.2, upc: 36, gstPercentage: 18, hsnCode: '33051090', category: 'Personal Care', packageType: 'Bottle', uom: 'kg' },
  { name: 'Spice Route Chilli Powder, 200 G', mrp: 78, sellingPrice: 62, weightKg: 0.2, upc: 50, gstPercentage: 5, hsnCode: '09042211', category: 'Spices', packageType: 'Pack', uom: 'kg' },
  { name: 'Spice Route Turmeric Powder, 100 G', mrp: 38, sellingPrice: 30, weightKg: 0.1, upc: 100, gstPercentage: 5, hsnCode: '09103030', category: 'Spices', packageType: 'Pack', uom: 'kg' },
  { name: 'Morning Fresh Rava, 1 Kg', mrp: 62, sellingPrice: 52, weightKg: 1, upc: 20, gstPercentage: 0, hsnCode: '11031100', category: 'Atta', packageType: 'Pack', uom: 'kg' },
];

const CANCEL_REASONS = ['Customer cancelled order', 'Duplicate order', 'Shop closed permanently'];
const RETURN_REASONS: { id: number; text: string }[] = [
  { id: 103, text: 'Customer refused – shop closed' },
  { id: 130, text: 'Customer not available at location' },
  { id: 151, text: 'Payment not ready with customer' },
];

const pad = (n: number) => String(n).padStart(2, '0');
const isoAt = (base: Date, dayOffset: number, hour: number, minute = 0) => {
  const d = new Date(base);
  d.setDate(d.getDate() + dayOffset);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
};
const localYmdHms = (iso: string) => {
  const d = new Date(iso);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
};
const round2 = (n: number) => Math.round(n * 100) / 100;

function tripNumber(iso: string, rng: Rng) {
  const d = new Date(iso);
  return `Q-${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}-${rng.letters(4)}`;
}

// ---------------------------------------------------------------- builder
export function buildSeed(): MockDatabase {
  const rng = createRng(20261104);
  const now = new Date();
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const created = isoAt(today, -60, 11, 37);
  const BUYER_ID = '7d2f4c1a-5b8e-4e3a-9c61-2f0b9a7d1e44';
  const SELLER_ID = '8b1d2c3e-1111-4a2b-9c3d-123456789abc';

  const buyer: DbBuyer = {
    id: BUYER_ID, name: 'RAVI KUMAR', businessName: 'SRI VENKATA LAKSHMI DISTRIBUTORS', mobileNumber: '9876543210', email: '',
    gstNumber: '36ABCDE1234F1Z5', panNumber: '', aadharNumber: '', status: true, createdAt: created, updatedAt: created,
    createdBy: 'system', updatedBy: 'system', businessTypeId: '3', buyerType: 'SELF_3PL',
  };

  const permissions: (DbPermission | string)[] = [
    { pageId: 'buyer_orders', canView: true, canCreate: true, canEdit: true, canDelete: true, canImport: true, canExport: true },
    { pageId: 'buyer_delivery_routes', canView: true, canCreate: true, canEdit: true, canDelete: true, canImport: false, canExport: true },
    { pageId: 'buyer_trips', canView: true, canCreate: true, canEdit: true, canDelete: false, canImport: false, canExport: true },
    { pageId: 'buyer_settings', canView: true, canCreate: true, canEdit: true, canDelete: true, canImport: true, canExport: false },
    'buyer_reports',
    'buyer_issues',
  ];

  const mkAddr = (id: string, line1: string, line2: string, city: string, pincode: string, lat: string | null, lng: string | null, isDefault: boolean): DbAddress => ({
    id, buyer_id: BUYER_ID, address_type: 'warehouse', address_line1: line1, address_line2: line2, city, state: 'Telangana', country: 'India',
    pincode, latitude: lat, longitude: lng, is_default: isDefault, created_at: created, updated_at: created, created_by: 'system', updated_by: 'system', city_code: 'std:040',
  });
  const addresses: DbAddress[] = [
    mkAddr('5c2e8a17-3f4b-4d9e-a1c6-0b7d2e9f4a31', 'Shop no 14, Lakshmi Complex, Malakpet, Hyderabad, Telangana, 500036', '', 'Hyderabad South East', '500036', '17.3741026', '78.5012347', true),
    mkAddr('a3d9c0e1-21b4-4f6e-9a3c-5d1e2f3a4b5c', 'Uppal Godown', 'Plot 12, IDA Uppal, Hyderabad', 'Hyderabad', '500039', '17.401234', '78.559876', false),
    mkAddr('c7e2a8f4-6b3d-4e1a-8c9f-0a1b2c3d4e5f', 'Kukatpally Depot', 'H.No 5-36/2, Prashanth Nagar, Kukatpally', 'Hyderabad', '500072', '17.4948', '78.3996', false),
  ];
  const warehouse = addresses[0];

  const buyerSettings: BuyerSettingsRecord = {
    id: '9e3b7c52-41a8-4f0d-b6e2-7c1d5a8f3e90', buyer_id: BUYER_ID,
    admin_config: { isPermissionsEnabled: false, warehouseLocation: [] },
    buyer_config: {
      deliveryConfig: { deliveryOtpEnabled: true, geoFenceContactNumber: 0, otpVerificationEnabled: true, pickupOtpEnabled: true, returnOtpEnabled: true, supportedVehicleTypes: [] },
      routePlanningConfig: {
        logisticsMode: '3pl', maxDistanceKm: 40, maxStops: 35, maxTravelTimeMinutes: 510, serviceTimeMinutes: 12,
        routeEngine: { availableEngines: ['route_optimize', 'beat_optimized', 'cluster_beat_optimized'], selectedEngine: 'route_optimize', uxVisibility: true },
      },
      storeConfig: { closingTime: '23:59', isTemporarilyClosed: false, openingTime: '00:00', specificClosureDates: [], weeklyHolidays: [] },
      webhookConfig: { callbackUrl: 'https://connector.example.test/api/internal/webhook', enabled: true },
    },
    created_at: created, updated_at: created, created_by: 'system', updated_by: 'system',
  };

  // beats
  const beats: DbBeat[] = BEAT_DEFS.map((b, i) => ({ id: `beat-${i + 1}-${rng.uuid().slice(0, 8)}`, buyerId: BUYER_ID, name: b.name, area: b.area, clusterId: null, createdAt: created, updatedAt: created }));

  // customers (5 per beat)
  const customers: DbCustomer[] = [];
  RETAILERS.forEach((business, i) => {
    const beatIdx = i % BEAT_DEFS.length;
    const locName = BEAT_DEFS[beatIdx].localities[i % 2];
    const loc = LOCALITIES.find((l) => l.name === locName)!;
    const mobile = `${rng.pick(['9', '8', '7', '6'])}${rng.digits(9)}`;
    const lat = (loc.lat + (rng.next() - 0.5) * 0.02).toFixed(7);
    const lng = (loc.lng + (rng.next() - 0.5) * 0.02).toFixed(7);
    const street = `${rng.int(1, 16)}-${rng.int(1, 9)}-${rng.int(10, 199)}, ${rng.pick(STREETS)}`;
    const ts = isoAt(today, -rng.int(5, 40), 12, rng.int(0, 59));
    customers.push({
      id: rng.uuid(), customer_unique_id: mobile, buyer_id: BUYER_ID, mobile_number: mobile, business_name: business,
      customer_name: i % 3 === 0 ? `${rng.pick(OWNER_NAMES)} ${rng.pick(['Reddy', 'Goud', 'Rao', 'Yadav', 'Gupta', 'Naidu'])}` : business,
      latitude: lat, longitude: lng, address: `${business}, ${street}, ${loc.name}`, status: 'Active', created_at: ts, updated_at: ts,
      created_by: null, updated_by: i % 9 === 4 ? 'manual' : 'connector', is_bulk_order: i % 13 === 7,
      locality: loc.name, city: 'Hyderabad', state: 'Telangana', pincode: loc.pincode, beatId: beats[beatIdx].id,
    });
  });

  const salesPersons: DbSalesPerson[] = ['Anil Reddy', 'Ramesh K', 'Sravan Kumar', 'Pavan Teja', 'Lokesh M'].map((name, i) => ({ id: `sp-${i + 1}`, name }));

  const products: DbProduct[] = PRODUCTS.map((p, i) => ({
    ...p,
    id: `prd-${String(i + 1).padStart(3, '0')}`,
    imageUrl: `https://placehold.co/96x96/e8f0fe/1e3a8a?text=${encodeURIComponent(p.category.split(' ')[0])}`,
  }));

  const mkVehicle = (reg: string, type: string, cap: number, dims: [number, number, number], status: 'active' | 'inactive' = 'active', ownership = 'Own'): DbVehicle => ({
    id: rng.uuid(), sellerId: SELLER_ID, vehicleTypeId: '1', name: reg, registrationNumber: reg, make: null, model: null, manufacturingYear: null,
    weightCapacityKg: cap.toFixed(2), volumetricCapacityKg: cap.toFixed(2), status, createdAt: created, updatedAt: created,
    length: dims[0].toFixed(2), height: dims[1].toFixed(2), breadth: dims[2].toFixed(2), ownershipType: ownership, amount: '1.00', isBulk: false,
    relationshipType: 'preferred', vehicleType: type,
  });
  const vehicles: DbVehicle[] = [
    mkVehicle('TS11UA4821', 'truck', 3485.16, [461, 210, 180]),
    mkVehicle('TS09EA4521', 'truck', 3815.34, [490, 215, 185]),
    mkVehicle('TS07UB1180', 'mini truck', 1500, [300, 160, 150]),
    mkVehicle('TS10FA7731', 'pickup', 750, [220, 140, 140], 'active', 'Leased'),
    mkVehicle('TS08HC2290', 'truck', 2500, [400, 190, 170], 'inactive'),
  ];
  const drivers: DbPerson[] = ['Ramesh Kumar', 'Suresh Yadav', 'Mahesh Goud', 'Naresh Reddy', 'Srinu Naik'].map((name) => ({ id: rng.uuid(), name, phone: `9${rng.digits(9)}` }));
  const helpers: DbPerson[] = ['Raju', 'Venkatesh', 'Prasad', 'Anil'].map((name) => ({ id: rng.uuid(), name, phone: `8${rng.digits(9)}` }));
  const providers: DbProvider[] = [
    { id: SELLER_ID, name: 'VEGA TRANSPORTS', basePrice: 2300 },
    { id: rng.uuid(), name: 'Deccan Freight Co.', basePrice: 1850 },
    { id: rng.uuid(), name: 'SwiftShip Logistics', basePrice: 1450 },
    { id: rng.uuid(), name: 'Rapid Rides Logistics', basePrice: 1199 },
  ];

  // ---------------------------------------------------------------- orders
  const orders: DbOrder[] = [];
  const makeItems = (orderId: string, count: number): DbOrderItem[] => {
    const chosen = new Set<number>();
    while (chosen.size < count) chosen.add(rng.int(0, products.length - 1));
    return Array.from(chosen).map((pi) => {
      const p = products[pi];
      const qty = p.weightKg >= 10 ? rng.int(1, 4) : rng.int(4, 40);
      return {
        itemId: rng.uuid(), productId: p.id, itemName: p.name, quantity: qty, mrp: p.mrp, sellingPrice: p.sellingPrice,
        totalAmount: round2(qty * p.sellingPrice), weightKg: p.weightKg, upc: p.upc, gstPercentage: p.gstPercentage, hsnCode: p.hsnCode,
        imageUrl: p.imageUrl, uom: p.uom, packageType: p.packageType, deliveredQuantity: 0, returnedQuantity: 0,
      };
    });
  };

  const makeOrder = (status: number, customer: DbCustomer, dayOffset: number): DbOrder => {
    const orderId = rng.uuid();
    const items = makeItems(orderId, rng.int(1, 4));
    const amount = round2(items.reduce((s, it) => s + it.totalAmount, 0));
    const weight = round2(items.reduce((s, it) => s + it.weightKg * it.quantity, 0));
    const createdAt = isoAt(today, dayOffset, rng.int(6, 13), rng.int(0, 59));
    const orderDateIso = isoAt(today, dayOffset - rng.int(1, 3), 5, 30);
    const isSales = rng.bool(0.3);
    const beat = beats.find((b) => b.id === customer.beatId)!;
    const loc = LOCALITIES.find((l) => l.name === customer.locality)!;
    const d = new Date(orderDateIso);
    const ref = isSales
      ? `INV/26-27/${String(rng.int(1000, 9999)).padStart(6, '0')}`
      : `QWI-ONDC-${pad(d.getDate())}${pad(d.getMonth() + 1)}${String(d.getFullYear()).slice(2)}-${rng.letters(1)}${rng.digits(1)}${rng.letters(3)}${rng.digits(1)}`;
    return {
      orderId, refOrderId: ref, buyerId: BUYER_ID, customerId: customer.id, customerName: customer.customer_name, customerBusinessName: customer.business_name,
      customerMobileNumber: customer.mobile_number,
      address: { line: customer.address.split(', ').slice(1, -1).join(', ') || customer.address, locality: customer.locality, city: 'Hyderabad', state: 'Telangana', country: 'INDIA', pincode: loc.pincode },
      lat: Number(customer.latitude), lng: Number(customer.longitude), amount, orderWeight: weight, volumetricWeight: round2(weight * (1 + rng.next() * 0.15)),
      orderType: isSales ? 'Sales' : rng.bool(0.15) ? null : 'Digital', salesPersonName: isSales || rng.bool(0.4) ? rng.pick(salesPersons).name : null,
      salesBeatName: beat.name, beatId: beat.id, createdAt, orderDate: localYmdHms(orderDateIso), deliveryDate: isoAt(today, dayOffset + 1, 0, 0),
      orderStatusId: status, validationErrors: [], isDeliveryAddressUpdated: false, tripId: null, tripHistory: [], items,
      rtoReasonId: null, returnReason: null, routePlanComboId: null, statusBeforeOffline: null, source: 'connector',
    };
  };

  let custCursor = 0;
  const nextCustomer = (beatIdx?: number) => {
    if (beatIdx !== undefined) {
      const pool = customers.filter((c) => c.beatId === beats[beatIdx].id);
      return pool[custCursor++ % pool.length];
    }
    return customers[custCursor++ % customers.length];
  };

  // Ready for planning (spread over the last few days so the order-date chips vary)
  for (let i = 0; i < 24; i++) orders.push(makeOrder(1, nextCustomer(i % 8), -rng.int(0, 3)));
  // In planning (route plans are built from these by the delivery-routes seed extension)
  for (let i = 0; i < 8; i++) orders.push(makeOrder(2, nextCustomer(i % 2 === 0 ? 3 : 6), -1));
  // Pending with validation errors
  const pendingErrorSets: DbValidationError[][] = [
    [
      { group: 'customer_order', fieldName: 'customer_mobile_number', currentValue: '12345', isMandatory: true, errorMessage: 'Store Mobile must be a valid 10-digit number' },
      { group: 'customer_order', fieldName: 'beat', currentValue: 'Beat#1', isMandatory: false, errorMessage: 'Beat must be alphabetic' },
      { group: 'product', fieldName: 'qty', currentValue: '0', isMandatory: true, errorMessage: 'Quantity must be ≥ 1', itemId: 'FJ2112QSF', rowNumber: 3 },
      { group: 'product', fieldName: 'unit_weight', currentValue: '', isMandatory: true, errorMessage: 'Weight is required', itemId: 'FJ2112QSF', rowNumber: 3 },
    ],
    [{ group: 'customer_order', fieldName: 'customer_lat', currentValue: 'abc', isMandatory: true, errorMessage: 'Delivery Latitude must be a valid number' }],
    [
      { group: 'customer_order', fieldName: 'customer_pincode', currentValue: '5000', isMandatory: true, errorMessage: 'Pincode must be 6 digits' },
      { group: 'customer_order', fieldName: 'customer_long', currentValue: '', isMandatory: true, errorMessage: 'Delivery Longitude is required' },
    ],
    Array.from({ length: 12 }, (_, k) => ({ group: 'product' as const, fieldName: k % 2 ? 'mrp' : 'qty', currentValue: '', isMandatory: true, errorMessage: k % 2 ? 'MRP is required' : 'Quantity is required', itemId: `SKU${1000 + k}`, rowNumber: k + 2 })),
    [{ group: 'customer_order', fieldName: 'customer_name', currentValue: '', isMandatory: true, errorMessage: 'Customer name is required' }],
  ];
  pendingErrorSets.forEach((errs) => {
    const o = makeOrder(9, nextCustomer(), 0);
    o.validationErrors = errs.map((e) => ({ ...e }));
    o.source = 'import';
    orders.push(o);
  });
  // Cancelled without trip, discarded, offline delivery
  for (let i = 0; i < 3; i++) {
    const o = makeOrder(10, nextCustomer(), -rng.int(2, 8));
    orders.push(o);
  }
  orders.push(makeOrder(11, nextCustomer(), -9));
  for (let i = 0; i < 2; i++) {
    const o = makeOrder(12, nextCustomer(), -1);
    o.statusBeforeOffline = 1;
    orders.push(o);
  }

  // ---------------------------------------------------------------- trips
  const trips: DbTrip[] = [];
  const stopStatus = (raw: string, display: string) => ({ status: raw, displayStatus: display });

  const buildTrip = (tripStatus: number, beatIdxs: number[], orderStatus: number, dayOffset: number, opts: { returned?: number; partial?: number; delivered?: number; inProgressDelivered?: number } = {}) => {
    const providerIdx = rng.int(0, providers.length - 1);
    const provider = providers[providerIdx];
    const vehicle = vehicles[rng.int(0, 3)];
    const driver = tripStatus >= 2 || rng.bool(0.5) ? rng.pick(drivers) : null;
    const helper = driver && rng.bool(0.6) ? rng.pick(helpers) : null;
    const createdAt = isoAt(today, dayOffset - 1, rng.int(10, 14), rng.int(0, 59));
    const pickupSlotStart = isoAt(today, dayOffset, 6, 0);
    const logisticsOrderId = rng.uuid();
    const tripOrders: DbOrder[] = [];
    const nCustomers = rng.int(4, 7);
    for (let i = 0; i < nCustomers; i++) {
      const c = nextCustomer(beatIdxs[i % beatIdxs.length]);
      const nOrders = rng.bool(0.25) ? 2 : 1;
      for (let k = 0; k < nOrders; k++) tripOrders.push(makeOrder(orderStatus, c, dayOffset - 1));
    }
    // group orders by customer → stops
    const byCustomer = new Map<string, DbOrder[]>();
    tripOrders.forEach((o) => {
      if (!byCustomer.has(o.customerId)) byCustomer.set(o.customerId, []);
      byCustomer.get(o.customerId)!.push(o);
    });
    const pickupOtp = rng.digits(4);
    const rtoOtp = rng.digits(4);
    const stops: DbStop[] = [];
    const startTime = tripStatus >= 2 ? isoAt(today, dayOffset, 6, rng.int(5, 40)) : null;
    const batchStatus =
      tripStatus === 1 ? stopStatus('Pending', 'Pending')
      : tripStatus === 4 ? stopStatus('Cancelled', 'Cancelled')
      : stopStatus('Order-picked-up', 'Order Picked Up');
    stops.push({
      id: rng.uuid(), fulfillmentId: rng.uuid(), deliveryType: 'Batch', sequenceOrder: 0, customerId: null, orderIds: [],
      ...batchStatus, stateTimestamp: tripStatus === 1 ? pickupSlotStart : startTime || pickupSlotStart, pickupOtp, deliveryOtp: null, rtoOtp: null,
      gps: `${warehouse.latitude},${warehouse.longitude}`,
      address: { name: buyer.businessName, building: 'warehouse', locality: warehouse.address_line1, city: warehouse.city, state: 'Telangana', country: 'India', areaCode: warehouse.address_line1, pincode: warehouse.pincode },
      contact: { name: buyer.businessName, phone: buyer.mobileNumber },
    });
    let seq = 1;
    const entries = Array.from(byCustomer.entries());
    entries.forEach(([customerId, os], idx) => {
      const c = customers.find((x) => x.id === customerId)!;
      let st = stopStatus('Pending', 'Pending');
      let finalOrderStatus = orderStatus;
      if (tripStatus === 1) st = driver ? stopStatus('Agent-assigned', 'Agent Assigned') : stopStatus('Pending', 'Pending');
      if (tripStatus === 2) st = idx < (opts.inProgressDelivered ?? 2) ? stopStatus('Order-delivered', 'Order Delivered') : idx === (opts.inProgressDelivered ?? 2) ? stopStatus('At-delivery', 'At Delivery') : stopStatus('Out-for-delivery', 'Out For Delivery');
      if (tripStatus === 3) {
        const nReturned = opts.returned ?? 0;
        const nPartial = opts.partial ?? 0;
        if (idx < nReturned) { st = stopStatus('RTO', 'Returned'); finalOrderStatus = 8; }
        else if (idx < nReturned + nPartial) { st = stopStatus('Order-delivered', 'Partial Delivered'); finalOrderStatus = 6; }
        else { st = stopStatus('Order-delivered', 'Order Delivered'); finalOrderStatus = 5; }
      }
      if (tripStatus === 4) st = stopStatus('Cancelled', 'Cancelled');
      const ts = tripStatus === 1 ? pickupSlotStart
        : st.status === 'Order-delivered' || st.status === 'RTO' ? isoAt(today, dayOffset, 7 + idx, rng.int(0, 59))
        : startTime || pickupSlotStart;
      os.forEach((o) => {
        o.tripId = logisticsOrderId;
        o.tripHistory = [logisticsOrderId];
        if (tripStatus === 2 && st.status === 'Order-delivered') finalOrderStatus = 5;
        o.orderStatusId = finalOrderStatus;
        o.items.forEach((it) => {
          if (finalOrderStatus === 5) it.deliveredQuantity = it.quantity;
          if (finalOrderStatus === 8) it.returnedQuantity = it.quantity;
          if (finalOrderStatus === 6) {
            it.returnedQuantity = Math.max(1, Math.floor(it.quantity / 4));
            it.deliveredQuantity = it.quantity - it.returnedQuantity;
          }
        });
        if (finalOrderStatus === 8) {
          const r = RETURN_REASONS[(idx + trips.length) % RETURN_REASONS.length];
          o.rtoReasonId = r.id;
          o.returnReason = r.text;
        }
      });
      stops.push({
        id: rng.uuid(), fulfillmentId: rng.uuid(), deliveryType: 'Delivery', sequenceOrder: seq++, customerId, orderIds: os.map((o) => o.orderId),
        ...st, stateTimestamp: ts, pickupOtp, deliveryOtp: rng.digits(4), rtoOtp, gps: `${c.latitude},${c.longitude}`,
        address: { name: c.business_name, building: c.business_name, locality: c.address.split(', ').slice(1).join(', '), city: 'Hyderabad', state: 'Telangana', country: 'INDIA', areaCode: c.pincode, pincode: c.pincode },
        contact: { name: '', phone: c.mobile_number, email: 'info@example.com' },
      });
    });
    orders.push(...tripOrders);
    const volWeight = round2(tripOrders.reduce((s, o) => s + o.volumetricWeight, 0));
    const distance = round2(12 + entries.length * rng.int(2, 6) + rng.next() * 5);
    const trip: DbTrip = {
      logisticsOrderId, orderId: tripNumber(createdAt, rng), buyerId: BUYER_ID, providerId: provider.id, providerName: provider.name,
      transactionId: `txn_${rng.uuid()}`, categoryId: 'Next Day Delivery', status: tripStatus, createdAt, startTime,
      pickupSlotStart, pickupSlotEnd: 'PT2H', deliveryTatDuration: 'P1D',
      endTime: tripStatus === 3 ? isoAt(today, dayOffset, 13 + rng.int(0, 4), rng.int(0, 59)) : null,
      deliveryPrice: provider.basePrice.toFixed(2), rtoPrice: '0.00',
      vehicleId: vehicle.id, vehicleRegNumber: vehicle.registrationNumber, vehicleType: vehicle.vehicleType, vehicleVolumetricCapacityKg: vehicle.volumetricCapacityKg,
      agentId: driver?.id ?? null, agentName: driver?.name ?? null, agentMobileNumber: driver?.phone ?? null,
      helperId: helper?.id ?? null, helperName: helper?.name ?? null, helperMobileNumber: helper?.phone ?? null,
      estimatedTimeToDelivery: String(Math.round(distance * 3 + entries.length * 12)), totalDistance: distance.toFixed(2), maxStopCount: '35',
      suggestedVehicleRegNumber: vehicle.registrationNumber, suggestedVehicleCapacityKg: vehicle.volumetricCapacityKg,
      stops, orderIds: tripOrders.map((o) => o.orderId), routePlanComboId: null, cancelReason: tripStatus === 4 ? rng.pick(CANCEL_REASONS) : null,
    };
    if (volWeight > Number(vehicle.volumetricCapacityKg)) trip.vehicleVolumetricCapacityKg = vehicles[1].volumetricCapacityKg;
    trips.push(trip);
    return trip;
  };

  // Planned (tomorrow), In progress (today), Completed (past days), Cancelled
  buildTrip(1, [0, 1], 3, 1);
  buildTrip(1, [4], 3, 1);
  buildTrip(1, [5, 6], 3, 1);
  buildTrip(2, [2], 4, 0, { inProgressDelivered: 2 });
  buildTrip(2, [7, 3], 4, 0, { inProgressDelivered: 1 });
  buildTrip(3, [0], 5, -1, { returned: 1, partial: 1 });
  buildTrip(3, [1, 2], 5, -2, { returned: 2 });
  buildTrip(3, [3], 5, -3, { partial: 1 });
  buildTrip(3, [4, 5], 5, -4);
  buildTrip(3, [6], 5, -5, { returned: 1 });
  buildTrip(3, [7], 5, -6);
  buildTrip(4, [0, 2], 10, -3);
  buildTrip(4, [5], 10, -7);

  // A re-delivery case: a returned order moved back to RFP (status 1) whose latest trip is Completed.
  const reDelivery = orders.filter((o) => o.orderStatusId === 8)[1];
  if (reDelivery) reDelivery.orderStatusId = 1;
  // Mark a few orders as address-updated (≈10%)
  orders.filter((_, i) => i % 11 === 3).forEach((o) => (o.isDeliveryAddressUpdated = true));

  // Newest first by createdAt, like the API
  orders.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  trips.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const clusters: DbCluster[] = [];

  const db: MockDatabase = {
    __version: buildSeed.VERSION,
    seededAt: now.toISOString(),
    buyer, permissions, addresses, buyerSettings, customers, beats, clusters, salesPersons, products,
    vehicles, drivers, helpers, providers, orders, trips, ext: {},
  };

  // Feature seed extensions (route plans, issues, clusters, …) — files in ./extensions/*.ts export `seed`.
  const modules = import.meta.glob('./extensions/*.ts', { eager: true }) as Record<string, { seed?: SeedExtension }>;
  Object.keys(modules).sort().forEach((k) => {
    try {
      modules[k].seed?.(db, createRng(k.length * 7919));
    } catch (e) {
      console.error('Seed extension failed:', k, e);
    }
  });
  return db;
}
buildSeed.VERSION = 3;
