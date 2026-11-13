// Seed extension for Settings (spec 07 / 08): beat clusters, extra beats & vehicles, category sequences,
// customer exclusions and store holidays — enough data that every Settings state can be seen.
//
// Clusters seeded (DbBeat.clusterId kept consistent):
//   • "East Hyderabad Cluster"  — 3 beats, TS11UA4821 + the INACTIVE TS08HC2290 (editor quirk: checked but cannot be unselected)
//   • "West Hyderabad Cluster"  — 3 beats, TS09EA4521 + TS13UC4407 (served with name:null / volumetric:null → " · 900 kg")
//   • a >50-character cluster name (card title truncated with "…", full name in the tooltip)
// Unclustered beats remain (Uppal, Secunderabad + extras) for the delivery-routes "unassigned beats" flow.
// Extra beats/vehicles make it possible to create ≥10 clusters (cluster-list pagination appears above 9).
import type { MockDatabase, Rng } from '../seed';
import type { DbBeat, DbCluster, DbVehicle } from '../types';

const DAY = 86400000;

/** YYYY-MM-DD in IST for a day offset from today. */
function istYmd(offsetDays: number): string {
  const d = new Date(Date.now() + offsetDays * DAY + 330 * 60000);
  return d.toISOString().slice(0, 10);
}
function isoDaysAgo(days: number, hour = 6, minute = 40): string {
  const d = new Date(Date.now() - days * DAY);
  d.setUTCHours(hour, minute, 0, 0);
  return d.toISOString();
}

export const seed = (db: MockDatabase, rng: Rng) => {
  const buyerId = db.buyer.id;
  const sellerId = db.vehicles[0]?.sellerId ?? rng.uuid();

  // ---------------------------------------------------------------- extra beats (no customers / orders on them)
  const extraBeats: { name: string; area: string; daysAgo: number }[] = [
    { name: 'Mon Thu - Kukatpally Zone', area: 'Kukatpally', daysAgo: 20 }, // makes the spec's sample upload row 3 a duplicate
    { name: 'Beat 10', area: '', daysAgo: 18 }, // area "—"
    { name: 'Chandanagar Beat 3', area: 'Chandanagar', daysAgo: 15 },
    { name: 'Miyapur Beat 1', area: 'Miyapur', daysAgo: 12 },
    { name: 'Sat - Gachibowli Zone', area: 'Gachibowli', daysAgo: 9 },
    { name: 'Wed - Malakpet Zone', area: 'Malakpet', daysAgo: 5 },
    { name: 'Fri - Nampally Zone', area: 'Nampally, Abids and Koti market lanes', daysAgo: 2 },
  ];
  extraBeats.forEach((b, i) => {
    const at = isoDaysAgo(b.daysAgo, 5, 10 + i);
    const beat: DbBeat = { id: `beat-x${i + 1}-${rng.uuid().slice(0, 8)}`, buyerId, name: b.name, area: b.area, clusterId: null, createdAt: at, updatedAt: at };
    db.beats.push(beat);
  });

  // ---------------------------------------------------------------- extra vehicles (appended, core indices unchanged)
  const created = db.vehicles[0]?.createdAt ?? isoDaysAgo(60);
  const mkVehicle = (reg: string, type: string, cap: number, dims: [number, number, number], ownership = 'Attached'): DbVehicle => ({
    id: rng.uuid(), sellerId, vehicleTypeId: '1', name: reg, registrationNumber: reg, make: null, model: null, manufacturingYear: null,
    weightCapacityKg: cap.toFixed(2), volumetricCapacityKg: cap.toFixed(2), status: 'active', createdAt: created, updatedAt: created,
    length: dims[0].toFixed(2), height: dims[1].toFixed(2), breadth: dims[2].toFixed(2), ownershipType: ownership, amount: '1.00', isBulk: false,
    relationshipType: 'preferred', vehicleType: type,
  });
  const extraVehicles = [
    mkVehicle('TS12EB6614', 'mini truck', 1200, [280, 150, 150], 'Leased'),
    mkVehicle('TG09T8802', 'truck', 3000, [430, 200, 175]),
    mkVehicle('TS13UC4407', 'pickup', 900, [230, 140, 140]),
    mkVehicle('TG07P1190', 'tempo', 1800, [330, 170, 160]),
    mkVehicle('AP29TB5531', 'truck', 3200, [450, 205, 180]),
    mkVehicle('TS15UD3345', 'pickup', 850, [220, 140, 135], 'Leased'),
    mkVehicle('TG10T2268', 'truck', 2800, [420, 195, 175]),
  ];
  db.vehicles.push(...extraVehicles);

  const byReg = (reg: string) => db.vehicles.find((v) => v.registrationNumber === reg);
  const beatByName = (name: string) => db.beats.find((b) => b.name === name);

  // ---------------------------------------------------------------- clusters
  const defs: { name: string; beats: string[]; vehicles: string[]; daysAgo: number }[] = [
    {
      name: 'East Hyderabad Cluster',
      beats: ['Mon Thursday - Dilsuknagar Zone', 'Weds Saturday - Vanastalipuram Zone', 'Tue Friday - LB Nagar Zone'],
      vehicles: ['TS11UA4821', 'TS08HC2290'],
      daysAgo: 14,
    },
    {
      name: 'West Hyderabad Cluster',
      beats: ['Tue Friday - Kukatpally Zone', 'Weds Saturday - Ameerpet Zone', 'Tue Friday - Mehdipatnam Zone'],
      vehicles: ['TS09EA4521', 'TS13UC4407'],
      daysAgo: 6,
    },
    {
      name: 'Gachibowli Nanakramguda Financial District Cluster - Phase II',
      beats: ['Sat - Gachibowli Zone'],
      vehicles: ['TG09T8802'],
      daysAgo: 2,
    },
  ];
  defs.forEach((def, i) => {
    const at = isoDaysAgo(def.daysAgo, 6, 40 + i);
    const beats = def.beats.map(beatByName).filter((b): b is DbBeat => !!b);
    const vehicles = def.vehicles.map(byReg).filter((v): v is DbVehicle => !!v);
    const cluster: DbCluster = {
      id: `c-${rng.uuid()}`,
      buyerId,
      name: def.name,
      beatIds: beats.map((b) => b.id),
      vehicleIds: vehicles.map((v) => v.id),
      createdAt: at,
      updatedAt: at,
    };
    beats.forEach((b) => (b.clusterId = cluster.id));
    db.clusters.push(cluster);
  });

  // available-vehicles response overrides (keeps DbVehicle intact for other features)
  const noName = byReg('TS13UC4407');
  db.ext.settings = {
    vehicleOverrides: noName ? { [noName.id]: { name: null, volumetricCapacityKg: null } } : {},
  };

  // ---------------------------------------------------------------- buyer settings
  const cfg = db.buyerSettings.buyer_config;
  cfg.storeConfig = {
    ...(cfg.storeConfig || {}),
    // production default kept: 00:00 – 23:59 (23:59 is not a selectable minute → closing-minute select renders blank)
    openingTime: cfg.storeConfig?.openingTime ?? '00:00',
    closingTime: cfg.storeConfig?.closingTime ?? '23:59',
    isTemporarilyClosed: false,
    weeklyHolidays: ['sunday'],
    // one past date (hidden on load, pruned on next add/remove) + two upcoming dates
    specificClosureDates: [istYmd(-20), istYmd(10), istYmd(45)],
  };
  cfg.deliveryConfig = {
    ...(cfg.deliveryConfig || {}),
    // Seller OTP shows Enabled because EITHER pickup or return is on (spec 08 §3.2)
    pickupOtpEnabled: true,
    returnOtpEnabled: false,
  };
  const uid = db.customers[2]?.customer_unique_id ?? 'DLR00393';
  cfg.customerExclusionConfig = {
    excludedCustomers: [
      { fieldName: 'UID', value: uid, status: 'Active' },
      { fieldName: 'UID', value: 'DLR00393', status: 'Active' },
      { fieldName: 'DsType', value: 'Indirect', status: 'Inactive' },
    ],
  };
  cfg.categorySequenceConfig = {
    categories: [
      { categoryId: 'CAT-101', categoryName: 'Atta & Flours', sequence: 1 },
      { categoryId: 'CAT-205', categoryName: 'Edible Oils', sequence: 2 },
      { categoryId: 'CAT-310', categoryName: 'Biscuits & Snacks', sequence: 3 },
      { categoryId: 'CAT-120', categoryName: 'Rice & Grains', sequence: 4 },
      { categoryId: 'CAT-130', categoryName: 'Pulses & Dals', sequence: 5 },
      { categoryId: 'CAT-410', categoryName: 'Beverages', sequence: 6 },
      { categoryId: 'CAT-505', categoryName: 'Home Care', sequence: 7 },
      // same code with a different name is allowed; duplicate sequence numbers are allowed
      { categoryId: 'CAT-205', categoryName: 'Ghee & Vanaspati', sequence: 8 },
      { categoryId: 'CAT-610', categoryName: 'Pooja Needs', sequence: 8 },
      { categoryId: 'CAT-140', categoryName: 'Sugar & Salt', sequence: 9 },
    ],
  };
};
