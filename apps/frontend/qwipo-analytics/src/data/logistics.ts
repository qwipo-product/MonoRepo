// Ops (Logistics) — data-point parity with the team's reference build
// (logistics-tech-dashboard.vercel.app · "Logistics Analytics Platform v2.4.1").
// Every constant here is lifted from that app's deployed bundle (read 6 Oct 2026),
// not invented; derived series reuse the reference's own multipliers. The period
// the reference models is May 2026, pan-India (7 states).

/** Network totals — the reference's full-network object (all companies). */
export const network = {
  totalOrders: 11376,
  fulfilled: 10505,
  pending: 658,
  returned: 622,
  cancelled: 248,
  invoiceL: 218.7,
  dispatchL: 235.8,
  returnL: 17.1,
  netSalesL: 218.7,
  returnRate: 5.5,
  vehicleUtil: 81,
  weightUtil: 76,
  timeUtil: 74,
  dpUtil: 88,
  vehiclesInUse: '378 / 452',
  avgRunTime: '5h 54m',
  plannedKm: 65800,
  liveKm: 68470,
  uniqueCustomers: 7916,
  volumetricWeightKg: 78580,
  /** Returned splits into two causes; "Partial return" exists in their taxonomy but carries no separate count. */
  returnedCancelled: 404,
  returnedDeliveryRetry: 218,
};

/** Per-company operations totals — same shape as the network object. */
export interface CompanyOps {
  name: string; orders: number; fulfilled: number; pending: number; returned: number; cancelled: number;
  invoiceL: number; returnRate: number; vehicleUtil: number; weightUtil: number; timeUtil: number; dpUtil: number;
  vehiclesInUse: string; avgRunTime: string;
}
export const companyOps: CompanyOps[] = [
  { name: 'ITC', orders: 2714, fulfilled: 2498, pending: 186, returned: 157, cancelled: 59, invoiceL: 48.2, returnRate: 5.8, vehicleUtil: 84, weightUtil: 79, timeUtil: 76, dpUtil: 91, vehiclesInUse: '87 / 96', avgRunTime: '5h 47m' },
  { name: 'HUL', orders: 3284, fulfilled: 3098, pending: 142, returned: 138, cancelled: 44, invoiceL: 62.7, returnRate: 4.2, vehicleUtil: 88, weightUtil: 85, timeUtil: 82, dpUtil: 93, vehiclesInUse: '104 / 116', avgRunTime: '5h 22m' },
  { name: 'Nestlé', orders: 1847, fulfilled: 1686, pending: 98, returned: 113, cancelled: 50, invoiceL: 37.9, returnRate: 6.1, vehicleUtil: 79, weightUtil: 72, timeUtil: 71, dpUtil: 87, vehiclesInUse: '61 / 80', avgRunTime: '6h 05m' },
  { name: 'Britannia', orders: 2108, fulfilled: 1952, pending: 124, returned: 112, cancelled: 44, invoiceL: 41.3, returnRate: 5.3, vehicleUtil: 81, weightUtil: 76, timeUtil: 74, dpUtil: 89, vehiclesInUse: '74 / 88', avgRunTime: '5h 58m' },
  { name: 'Dabur', orders: 1423, fulfilled: 1271, pending: 108, returned: 102, cancelled: 51, invoiceL: 28.6, returnRate: 7.2, vehicleUtil: 73, weightUtil: 67, timeUtil: 68, dpUtil: 82, vehiclesInUse: '52 / 72', avgRunTime: '6h 18m' },
];

/** The reference Summary page's "this year" tiles and onboarded-company cards. */
export const yearTiles = [
  { label: 'Companies', value: '2', change: '→', note: 'This year' },
  { label: 'Distributors', value: '20', change: '→', note: 'This year' },
  { label: 'Deliveries', value: '22,682', change: '↑ 4.8%', note: 'This year' },
  { label: 'Invoice value', value: '₹9.97Cr', change: '↑ 12.3%', note: 'This year' },
] as const;
export const onboardedCompanies = [
  { name: 'ITC Limited', logo: 'ITC', onboarded: '15 Jan 2024', metrics: { Distributors: '17', Beats: '167', Vehicles: '327', Deliveries: '18,275', Revenue: '₹8.03Cr' } },
  { name: 'Hindustan Unilever', logo: 'HUL', onboarded: '3 Aug 2025', metrics: { Distributors: '3', Beats: '34', Vehicles: '76', Deliveries: '4,407', Revenue: '₹1.95Cr' } },
];

/** Category contribution (₹L revenue + % share) — network blend and per company. */
export type CategorySlice = { name: string; revenueL: number; share: number };
export const categoryMix: Record<string, CategorySlice[]> = {
  All: [
    { name: 'Snacks & Food', revenueL: 61.1, share: 27.9 }, { name: 'Personal Care', revenueL: 52.4, share: 24 },
    { name: 'Beverages', revenueL: 39.3, share: 18 }, { name: 'Home Care', revenueL: 35, share: 16 },
    { name: 'Healthcare', revenueL: 30.6, share: 14 },
  ],
  ITC: [
    { name: 'Snacks', revenueL: 15.4, share: 31.9 }, { name: 'Biscuits', revenueL: 13.2, share: 27.4 },
    { name: 'Noodles', revenueL: 9.1, share: 18.9 }, { name: 'Atta', revenueL: 6.8, share: 14.1 },
    { name: 'Beverages', revenueL: 3.7, share: 7.7 },
  ],
  HUL: [
    { name: 'Personal Care', revenueL: 23.8, share: 37.9 }, { name: 'Home Care', revenueL: 18.2, share: 29 },
    { name: 'Foods', revenueL: 13.2, share: 21.1 }, { name: 'Beverages', revenueL: 7.5, share: 11.9 },
  ],
  Nestlé: [
    { name: 'Dairy', revenueL: 12.9, share: 34 }, { name: 'Beverages', revenueL: 9.9, share: 26 },
    { name: 'Confectionery', revenueL: 8.3, share: 22 }, { name: 'Culinary', revenueL: 6.8, share: 18 },
  ],
  Britannia: [
    { name: 'Biscuits', revenueL: 19.8, share: 47.9 }, { name: 'Cakes', revenueL: 9.1, share: 22 },
    { name: 'Dairy', revenueL: 7.4, share: 17.9 }, { name: 'Breads', revenueL: 5, share: 12.1 },
  ],
  Dabur: [
    { name: 'Juices', revenueL: 10, share: 35 }, { name: 'Healthcare', revenueL: 8, share: 28 },
    { name: 'Personal Care', revenueL: 6.3, share: 22 }, { name: 'OTC Products', revenueL: 4.3, share: 15 },
  ],
};

/** Weekly performance trend — the reference's week labels × its multipliers on the network totals. */
export const weeklyTrend = [
  { week: 'W1 Apr', orders: 2503, invoiceL: 48.1 },
  { week: 'W2 Apr', orders: 2645, invoiceL: 50.8 },
  { week: 'W3 Apr', orders: 2759, invoiceL: 53.0 },
  { week: 'W4 Apr', orders: 2588, invoiceL: 49.8 },
  { week: 'W1 May', orders: 2901, invoiceL: 55.8 },
  { week: 'W2 May', orders: 2986, invoiceL: 57.4 },
  { week: 'W3 May', orders: 2844, invoiceL: 54.7 },
];

/** Distributor performance snapshot — the 13 distributors that carry metrics in the reference. */
export interface OpsDistributor {
  code: string; name: string; state: string; city: string; zone: string;
  orders: number; fulfilled: number; returned: number; cancelled: number;
  invoiceL: number; returnRate: number; vehicles: number;
  vehicleUtil: number; weightUtil: number; timeUtil: number; dpUtil: number;
  fillRate: number; tripEfficiency: number;
}
export const opsDistributors: OpsDistributor[] = [
  { code: 'DIS-HYD-004', name: 'Hyderabad Central', state: 'Telangana', city: 'Hyderabad', zone: 'Secunderabad', orders: 384, fulfilled: 358, returned: 22, cancelled: 4, invoiceL: 7.2, returnRate: 5.7, vehicles: 12, vehicleUtil: 87, weightUtil: 84, timeUtil: 79, dpUtil: 88, fillRate: 93.2, tripEfficiency: 91.4 },
  { code: 'SECD123DIS', name: 'Secd123 Dist.', state: 'Telangana', city: 'Hyderabad', zone: 'Secunderabad', orders: 312, fulfilled: 287, returned: 19, cancelled: 6, invoiceL: 5.9, returnRate: 6.1, vehicles: 10, vehicleUtil: 83, weightUtil: 80, timeUtil: 74, dpUtil: 84, fillRate: 90.1, tripEfficiency: 88.7 },
  { code: 'DIS-HYD-002', name: 'Kukatpally North', state: 'Telangana', city: 'Hyderabad', zone: 'Kukatpally', orders: 298, fulfilled: 274, returned: 17, cancelled: 7, invoiceL: 5.6, returnRate: 5.7, vehicles: 9, vehicleUtil: 81, weightUtil: 78, timeUtil: 72, dpUtil: 82, fillRate: 91.8, tripEfficiency: 89.2 },
  { code: 'DIS-KRN-001', name: 'Karimnagar Central', state: 'Telangana', city: 'Karimnagar', zone: 'Central', orders: 271, fulfilled: 248, returned: 18, cancelled: 5, invoiceL: 5.1, returnRate: 6.6, vehicles: 9, vehicleUtil: 79, weightUtil: 76, timeUtil: 70, dpUtil: 80, fillRate: 88.4, tripEfficiency: 85.6 },
  { code: 'DIS-MUM-012', name: 'Mumbai Metro', state: 'Maharashtra', city: 'Mumbai', zone: 'Central', orders: 512, fulfilled: 487, returned: 21, cancelled: 4, invoiceL: 9.4, returnRate: 4.1, vehicles: 16, vehicleUtil: 91, weightUtil: 89, timeUtil: 85, dpUtil: 92, fillRate: 95.1, tripEfficiency: 93.8 },
  { code: 'DIS-MUM-001', name: 'Andheri East Dist.', state: 'Maharashtra', city: 'Mumbai', zone: 'Andheri', orders: 426, fulfilled: 398, returned: 20, cancelled: 8, invoiceL: 7.9, returnRate: 4.7, vehicles: 13, vehicleUtil: 88, weightUtil: 86, timeUtil: 82, dpUtil: 89, fillRate: 93.4, tripEfficiency: 92.1 },
  { code: 'DIS-MUM-003', name: 'Malad North', state: 'Maharashtra', city: 'Mumbai', zone: 'Malad', orders: 378, fulfilled: 350, returned: 18, cancelled: 10, invoiceL: 7.1, returnRate: 4.8, vehicles: 12, vehicleUtil: 86, weightUtil: 83, timeUtil: 79, dpUtil: 87, fillRate: 92.6, tripEfficiency: 90.4 },
  { code: 'DIS-BAN-007', name: 'Bengaluru North', state: 'Karnataka', city: 'Bengaluru', zone: 'North Zone', orders: 447, fulfilled: 416, returned: 26, cancelled: 5, invoiceL: 8.2, returnRate: 5.8, vehicles: 14, vehicleUtil: 88, weightUtil: 85, timeUtil: 81, dpUtil: 89, fillRate: 93, tripEfficiency: 90.8 },
  { code: 'DIS-BAN-004', name: 'Koramangala North', state: 'Karnataka', city: 'Bengaluru', zone: 'Koramangala', orders: 362, fulfilled: 332, returned: 21, cancelled: 9, invoiceL: 6.7, returnRate: 5.8, vehicles: 11, vehicleUtil: 85, weightUtil: 82, timeUtil: 77, dpUtil: 86, fillRate: 91.7, tripEfficiency: 89.3 },
  { code: 'DIS-CHN-003', name: 'Chennai East Dist.', state: 'Tamil Nadu', city: 'Chennai', zone: 'East Chennai', orders: 318, fulfilled: 296, returned: 17, cancelled: 5, invoiceL: 5.9, returnRate: 5.3, vehicles: 10, vehicleUtil: 82, weightUtil: 79, timeUtil: 73, dpUtil: 83, fillRate: 90.6, tripEfficiency: 88.1 },
  { code: 'DIS-DEL-009', name: 'Delhi NCR Dist.', state: 'Delhi NCR', city: 'New Delhi', zone: 'Central Delhi', orders: 398, fulfilled: 371, returned: 20, cancelled: 7, invoiceL: 7.6, returnRate: 5, vehicles: 13, vehicleUtil: 86, weightUtil: 83, timeUtil: 79, dpUtil: 87, fillRate: 92.2, tripEfficiency: 90.5 },
  { code: 'DIS-PUN-015', name: 'Pune Central Dist.', state: 'Maharashtra', city: 'Pune', zone: 'Central Pune', orders: 224, fulfilled: 205, returned: 14, cancelled: 5, invoiceL: 4.1, returnRate: 6.3, vehicles: 7, vehicleUtil: 76, weightUtil: 73, timeUtil: 68, dpUtil: 77, fillRate: 88.9, tripEfficiency: 86.2 },
  { code: 'DIS-AHM-006', name: 'Ahmedabad Central', state: 'Gujarat', city: 'Ahmedabad', zone: 'Central', orders: 160, fulfilled: 147, returned: 10, cancelled: 3, invoiceL: 2.9, returnRate: 6.3, vehicles: 6, vehicleUtil: 72, weightUtil: 69, timeUtil: 64, dpUtil: 73, fillRate: 87.5, tripEfficiency: 84.8 },
];

/** Delivery ageing per distributor — the network's 658 pending orders spread over the
 *  distributors in proportion to order volume, split with the reference's bucket shape
 *  (≈50 / 27 / 14 / 6 / 3%). Buckets: D0 same day → D4+ overdue. */
export const agingBuckets = ['D0', 'D1', 'D2', 'D3', 'D4+'] as const;
export const agingRows: { code: string; d: [number, number, number, number, number] }[] = [
  { code: 'DIS-HYD-004', d: [28, 15, 8, 3, 2] },
  { code: 'SECD123DIS', d: [23, 12, 6, 3, 2] },
  { code: 'DIS-HYD-002', d: [22, 12, 6, 3, 1] },
  { code: 'DIS-KRN-001', d: [20, 11, 6, 2, 1] },
  { code: 'DIS-MUM-012', d: [38, 20, 10, 5, 2] },
  { code: 'DIS-MUM-001', d: [31, 17, 8, 4, 2] },
  { code: 'DIS-MUM-003', d: [28, 15, 8, 3, 1] },
  { code: 'DIS-BAN-007', d: [33, 18, 9, 4, 2] },
  { code: 'DIS-BAN-004', d: [27, 14, 7, 3, 2] },
  { code: 'DIS-CHN-003', d: [24, 13, 6, 3, 1] },
  { code: 'DIS-DEL-009', d: [29, 16, 8, 3, 2] },
  { code: 'DIS-PUN-015', d: [17, 9, 4, 2, 1] },
  { code: 'DIS-AHM-006', d: [12, 6, 3, 1, 1] },
];

/** Order volume trend — 30 May days from the reference's daily multipliers on the
 *  network totals. Four measures, matching its toggle. */
const dayMult = [0.91, 0.87, 1.05, 1.08, 0.97, 1.03, 0.95, 0.88, 1.02, 1.07, 0.94, 0.99, 1.04, 0.9, 0.86, 1.06, 1.09, 0.98, 1.01, 0.93, 0.89, 1.03, 1.07, 0.96, 1, 0.92, 0.85, 1.04, 1.08, 0.97];
export const dailyVolume = dayMult.map((m, i) => ({
  day: i + 1,
  orders: Math.round(379 * m),
  amountL: +(7.29 * m).toFixed(2),
  weightKg: Math.round(2619 * m),
  buyers: Math.round(264 * m),
}));
export type VolumeMeasure = 'orders' | 'amountL' | 'weightKg' | 'buyers';
export const volumeMeasures: { key: VolumeMeasure; label: string }[] = [
  { key: 'orders', label: 'Order count' },
  { key: 'amountL', label: 'Order amount' },
  { key: 'weightKg', label: 'Order weight' },
  { key: 'buyers', label: 'Unique buyers' },
];

/** Drivers — the reference's full driver performance list. */
export interface Driver {
  name: string; distributor: string; city: string;
  attempts: number; returns: number; netSale: string; contribution: number;
  returnPct: number; successRate: number; runtime: string; trips: number; distanceKm: number;
}
export const drivers: Driver[] = [
  { name: 'Ramesh Kumar', distributor: 'DIS-HYD-004', city: 'Hyderabad', attempts: 38, returns: 2, netSale: '₹8.4L', contribution: 12.3, returnPct: 5.3, successRate: 94.7, runtime: '5h 12m', trips: 22, distanceKm: 412 },
  { name: 'Suresh Patil', distributor: 'DIS-HYD-004', city: 'Hyderabad', attempts: 36, returns: 3, netSale: '₹7.9L', contribution: 11.6, returnPct: 8.3, successRate: 91.7, runtime: '5h 48m', trips: 20, distanceKm: 384 },
  { name: 'Mahesh Sharma', distributor: 'DIS-HYD-004', city: 'Hyderabad', attempts: 34, returns: 1, netSale: '₹7.6L', contribution: 11.1, returnPct: 2.9, successRate: 97.1, runtime: '6h 02m', trips: 19, distanceKm: 376 },
  { name: 'Rajesh Verma', distributor: 'DIS-KRN-001', city: 'Karimnagar', attempts: 33, returns: 4, netSale: '₹7.1L', contribution: 10.4, returnPct: 12.1, successRate: 87.9, runtime: '5h 20m', trips: 18, distanceKm: 354 },
  { name: 'Anand Singh', distributor: 'DIS-KRN-001', city: 'Karimnagar', attempts: 31, returns: 2, netSale: '₹6.8L', contribution: 9.9, returnPct: 6.5, successRate: 93.5, runtime: '7h 14m', trips: 17, distanceKm: 338 },
  { name: 'Vikram Nair', distributor: 'DIS-MUM-012', city: 'Mumbai', attempts: 30, returns: 5, netSale: '₹6.4L', contribution: 9.4, returnPct: 16.7, successRate: 83.3, runtime: '4h 55m', trips: 16, distanceKm: 298 },
  { name: 'Prakash Rao', distributor: 'DIS-MUM-012', city: 'Mumbai', attempts: 28, returns: 1, netSale: '₹6.1L', contribution: 8.9, returnPct: 3.6, successRate: 96.4, runtime: '4h 38m', trips: 15, distanceKm: 282 },
  { name: 'Arun Krishnan', distributor: 'DIS-BAN-007', city: 'Bengaluru', attempts: 42, returns: 3, netSale: '₹9.1L', contribution: 13.2, returnPct: 7.1, successRate: 92.9, runtime: '5h 35m', trips: 24, distanceKm: 448 },
  { name: 'Deepak Gupta', distributor: 'DIS-BAN-007', city: 'Bengaluru', attempts: 39, returns: 6, netSale: '₹8.2L', contribution: 11.9, returnPct: 15.4, successRate: 84.6, runtime: '5h 10m', trips: 21, distanceKm: 418 },
  { name: 'Sanjay Mehra', distributor: 'DIS-CHN-003', city: 'Chennai', attempts: 35, returns: 2, netSale: '₹7.4L', contribution: 10.8, returnPct: 5.7, successRate: 94.3, runtime: '5h 50m', trips: 19, distanceKm: 362 },
  { name: 'Ravi Shankar', distributor: 'DIS-CHN-003', city: 'Chennai', attempts: 29, returns: 4, netSale: '₹6.0L', contribution: 8.7, returnPct: 13.8, successRate: 86.2, runtime: '6h 22m', trips: 16, distanceKm: 310 },
  { name: 'Manish Tiwari', distributor: 'DIS-DEL-009', city: 'New Delhi', attempts: 44, returns: 2, netSale: '₹9.6L', contribution: 14, returnPct: 4.5, successRate: 95.5, runtime: '5h 00m', trips: 25, distanceKm: 464 },
  { name: 'Ajay Kapoor', distributor: 'DIS-DEL-009', city: 'New Delhi', attempts: 37, returns: 3, netSale: '₹8.0L', contribution: 11.6, returnPct: 8.1, successRate: 91.9, runtime: '5h 42m', trips: 21, distanceKm: 398 },
  { name: 'Pradeep Joshi', distributor: 'DIS-PUN-015', city: 'Pune', attempts: 26, returns: 3, netSale: '₹5.5L', contribution: 8, returnPct: 11.5, successRate: 88.5, runtime: '6h 10m', trips: 15, distanceKm: 284 },
  { name: 'Nilesh Patil', distributor: 'DIS-AHM-006', city: 'Ahmedabad', attempts: 22, returns: 2, netSale: '₹4.8L', contribution: 7, returnPct: 9.1, successRate: 90.9, runtime: '5h 30m', trips: 13, distanceKm: 246 },
  { name: 'Kiran Shah', distributor: 'DIS-AHM-006', city: 'Ahmedabad', attempts: 18, returns: 2, netSale: '₹3.9L', contribution: 5.7, returnPct: 11.1, successRate: 88.9, runtime: '5h 45m', trips: 11, distanceKm: 214 },
];

/** Vehicle master — the reference's Vehicle Raw sheet. */
export const vehicles = [
  { name: 'Madappa-TS07UL8066', registration: 'TS07UL8066', ownership: 'Lease', volumetricCapacity: 1215.2, status: 'Active' },
  { name: 'Saleem-AP29V5514', registration: 'AP29V5514', ownership: 'Lease', volumetricCapacity: 999.6, status: 'Active' },
  { name: 'TATA 407', registration: 'AP23Y5098', ownership: 'Own', volumetricCapacity: 2892.55, status: 'Active' },
];

/** Run-time slabs by city — drivers grouped into the reference's slabs (≤2h · 2–4h · 4–6h · >6h). */
export const runtimeSlabs = ['≤ 2h', '2 – 4h', '4 – 6h', '> 6h'] as const;
export const runtimeByCity = [
  { city: 'Hyderabad', slab: '4 – 6h', avg: '5h 40m', trips: 61 },
  { city: 'New Delhi', slab: '4 – 6h', avg: '5h 21m', trips: 46 },
  { city: 'Bengaluru', slab: '4 – 6h', avg: '5h 22m', trips: 45 },
  { city: 'Karimnagar', slab: '> 6h', avg: '6h 17m', trips: 35 },
  { city: 'Chennai', slab: '> 6h', avg: '6h 06m', trips: 35 },
  { city: 'Mumbai', slab: '4 – 6h', avg: '4h 46m', trips: 31 },
  { city: 'Ahmedabad', slab: '4 – 6h', avg: '5h 37m', trips: 24 },
  { city: 'Pune', slab: '> 6h', avg: '6h 10m', trips: 15 },
];

/** Trips per day — 20 working days from the reference's trip-volume multipliers. */
const tripMult = [1, 0.88, 1.06, 1.12, 0.95, 1.08, 0.72, 1, 0.91, 1.05, 1.09, 0.97, 1.03, 0.84, 0.9, 1.07, 1.11, 0.94, 1.02, 0.88];
export const tripsDaily = tripMult.map((m, i) => ({ day: i + 1, trips: Math.round(14.6 * m) }));

/** Fleet rollups computed from the driver list (so every number agrees). */
export const fleet = {
  trips: drivers.reduce((s, d) => s + d.trips, 0), // 292
  drivers: drivers.length, // 16
  distanceKm: drivers.reduce((s, d) => s + d.distanceKm, 0), // 5,588
  returnTrips: drivers.reduce((s, d) => s + d.returns, 0), // 45
  attempts: drivers.reduce((s, d) => s + d.attempts, 0), // 522
  /** avg of the four utilizations — the reference's "Fleet efficiency" */
  efficiency: Math.round((network.vehicleUtil + network.weightUtil + network.timeUtil + network.dpUtil) / 4 * 10) / 10,
};
