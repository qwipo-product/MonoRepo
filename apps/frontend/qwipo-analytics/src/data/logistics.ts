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

/** Per-company operations totals — same shape as the network object, every field. */
export interface CompanyOps {
  name: string; orders: number; fulfilled: number; pending: number; returned: number; cancelled: number;
  invoiceL: number; dispatchL: number; returnL: number; netSalesL: number; returnRate: number;
  returnedCancelled: number; returnedDeliveryRetry: number;
  uniqueCustomers: number; volumetricWeightKg: number;
  vehicleUtil: number; weightUtil: number; timeUtil: number; dpUtil: number;
  vehiclesInUse: string; avgRunTime: string; plannedKm: number; liveKm: number;
}
export const companyOps: CompanyOps[] = [
  { name: 'ITC', orders: 2714, fulfilled: 2498, pending: 186, returned: 157, cancelled: 59, invoiceL: 48.2, dispatchL: 52.4, returnL: 4.2, netSalesL: 48.2, returnRate: 5.8, returnedCancelled: 102, returnedDeliveryRetry: 55, uniqueCustomers: 1842, volumetricWeightKg: 18420, vehicleUtil: 84, weightUtil: 79, timeUtil: 76, dpUtil: 91, vehiclesInUse: '87 / 96', avgRunTime: '5h 47m', plannedKm: 14820, liveKm: 15340 },
  { name: 'HUL', orders: 3284, fulfilled: 3098, pending: 142, returned: 138, cancelled: 44, invoiceL: 62.7, dispatchL: 66.8, returnL: 4.1, netSalesL: 62.7, returnRate: 4.2, returnedCancelled: 90, returnedDeliveryRetry: 48, uniqueCustomers: 2214, volumetricWeightKg: 22180, vehicleUtil: 88, weightUtil: 85, timeUtil: 82, dpUtil: 93, vehiclesInUse: '104 / 116', avgRunTime: '5h 22m', plannedKm: 17640, liveKm: 18110 },
  { name: 'Nestlé', orders: 1847, fulfilled: 1686, pending: 98, returned: 113, cancelled: 50, invoiceL: 37.9, dispatchL: 40.8, returnL: 2.9, netSalesL: 37.9, returnRate: 6.1, returnedCancelled: 73, returnedDeliveryRetry: 40, uniqueCustomers: 1320, volumetricWeightKg: 12640, vehicleUtil: 79, weightUtil: 72, timeUtil: 71, dpUtil: 87, vehiclesInUse: '61 / 80', avgRunTime: '6h 05m', plannedKm: 11240, liveKm: 11890 },
  { name: 'Britannia', orders: 2108, fulfilled: 1952, pending: 124, returned: 112, cancelled: 44, invoiceL: 41.3, dispatchL: 44.6, returnL: 3.3, netSalesL: 41.3, returnRate: 5.3, returnedCancelled: 73, returnedDeliveryRetry: 39, uniqueCustomers: 1560, volumetricWeightKg: 15380, vehicleUtil: 81, weightUtil: 76, timeUtil: 74, dpUtil: 89, vehiclesInUse: '74 / 88', avgRunTime: '5h 58m', plannedKm: 12980, liveKm: 13450 },
  { name: 'Dabur', orders: 1423, fulfilled: 1271, pending: 108, returned: 102, cancelled: 51, invoiceL: 28.6, dispatchL: 31.2, returnL: 2.6, netSalesL: 28.6, returnRate: 7.2, returnedCancelled: 66, returnedDeliveryRetry: 36, uniqueCustomers: 980, volumetricWeightKg: 9840, vehicleUtil: 73, weightUtil: 67, timeUtil: 68, dpUtil: 82, vehiclesInUse: '52 / 72', avgRunTime: '6h 18m', plannedKm: 9120, liveKm: 9680 },
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
/** The reference's bucket definitions. */
export const agingBucketLabels = ['D0 · Same day', 'D1 · Next day', 'D2 · 2 days', 'D3 · 3 days', 'D4+ · Overdue'] as const;
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

/** Drivers — the reference's full driver performance list, with their vehicles. */
export interface Driver {
  name: string; vehicle: string; vehicles?: string[]; distributor: string; state: string; city: string;
  attempts: number; returns: number; netSale: string; contribution: number;
  returnPct: number; successRate: number; runtime: string; trips: number; distanceKm: number;
}
export const drivers: Driver[] = [
  { name: 'Ramesh Kumar', vehicle: 'TS-09-EA-7823', vehicles: ['TS-09-EA-7823', 'TS-09-EA-7991'], distributor: 'DIS-HYD-004', state: 'Telangana', city: 'Hyderabad', attempts: 38, returns: 2, netSale: '₹8.4L', contribution: 12.3, returnPct: 5.3, successRate: 94.7, runtime: '5h 12m', trips: 22, distanceKm: 412 },
  { name: 'Suresh Patil', vehicle: 'TS-09-EA-4421', distributor: 'DIS-HYD-004', state: 'Telangana', city: 'Hyderabad', attempts: 36, returns: 3, netSale: '₹7.9L', contribution: 11.6, returnPct: 8.3, successRate: 91.7, runtime: '5h 48m', trips: 20, distanceKm: 384 },
  { name: 'Mahesh Sharma', vehicle: 'TS-09-AB-1234', distributor: 'DIS-HYD-004', state: 'Telangana', city: 'Hyderabad', attempts: 34, returns: 1, netSale: '₹7.6L', contribution: 11.1, returnPct: 2.9, successRate: 97.1, runtime: '6h 02m', trips: 19, distanceKm: 376 },
  { name: 'Rajesh Verma', vehicle: 'TS-09-EA-9910', distributor: 'DIS-KRN-001', state: 'Telangana', city: 'Karimnagar', attempts: 33, returns: 4, netSale: '₹7.1L', contribution: 10.4, returnPct: 12.1, successRate: 87.9, runtime: '5h 20m', trips: 18, distanceKm: 354 },
  { name: 'Anand Singh', vehicle: 'TS-09-AB-5678', distributor: 'DIS-KRN-001', state: 'Telangana', city: 'Karimnagar', attempts: 31, returns: 2, netSale: '₹6.8L', contribution: 9.9, returnPct: 6.5, successRate: 93.5, runtime: '7h 14m', trips: 17, distanceKm: 338 },
  { name: 'Vikram Nair', vehicle: 'MH-12-MG-3312', distributor: 'DIS-MUM-012', state: 'Maharashtra', city: 'Mumbai', attempts: 30, returns: 5, netSale: '₹6.4L', contribution: 9.4, returnPct: 16.7, successRate: 83.3, runtime: '4h 55m', trips: 16, distanceKm: 298 },
  { name: 'Prakash Rao', vehicle: 'MH-12-MG-9012', distributor: 'DIS-MUM-012', state: 'Maharashtra', city: 'Mumbai', attempts: 28, returns: 1, netSale: '₹6.1L', contribution: 8.9, returnPct: 3.6, successRate: 96.4, runtime: '4h 38m', trips: 15, distanceKm: 282 },
  { name: 'Arun Krishnan', vehicle: 'KA-03-MG-4521', vehicles: ['KA-03-MG-4521', 'KA-03-MG-7702'], distributor: 'DIS-BAN-007', state: 'Karnataka', city: 'Bengaluru', attempts: 42, returns: 3, netSale: '₹9.1L', contribution: 13.2, returnPct: 7.1, successRate: 92.9, runtime: '5h 35m', trips: 24, distanceKm: 448 },
  { name: 'Deepak Gupta', vehicle: 'KA-03-MG-7834', distributor: 'DIS-BAN-007', state: 'Karnataka', city: 'Bengaluru', attempts: 39, returns: 6, netSale: '₹8.2L', contribution: 11.9, returnPct: 15.4, successRate: 84.6, runtime: '5h 10m', trips: 21, distanceKm: 418 },
  { name: 'Sanjay Mehra', vehicle: 'TN-22-CN-1122', distributor: 'DIS-CHN-003', state: 'Tamil Nadu', city: 'Chennai', attempts: 35, returns: 2, netSale: '₹7.4L', contribution: 10.8, returnPct: 5.7, successRate: 94.3, runtime: '5h 50m', trips: 19, distanceKm: 362 },
  { name: 'Ravi Shankar', vehicle: 'TN-22-CN-5566', distributor: 'DIS-CHN-003', state: 'Tamil Nadu', city: 'Chennai', attempts: 29, returns: 4, netSale: '₹6.0L', contribution: 8.7, returnPct: 13.8, successRate: 86.2, runtime: '6h 22m', trips: 16, distanceKm: 310 },
  { name: 'Manish Tiwari', vehicle: 'DL-01-AB-7890', vehicles: ['DL-01-AB-7890', 'DL-01-AB-2255'], distributor: 'DIS-DEL-009', state: 'Delhi NCR', city: 'New Delhi', attempts: 44, returns: 2, netSale: '₹9.6L', contribution: 14, returnPct: 4.5, successRate: 95.5, runtime: '5h 00m', trips: 25, distanceKm: 464 },
  { name: 'Ajay Kapoor', vehicle: 'DL-01-AB-3344', distributor: 'DIS-DEL-009', state: 'Delhi NCR', city: 'New Delhi', attempts: 37, returns: 3, netSale: '₹8.0L', contribution: 11.6, returnPct: 8.1, successRate: 91.9, runtime: '5h 42m', trips: 21, distanceKm: 398 },
  { name: 'Pradeep Joshi', vehicle: 'MH-12-PQ-2233', distributor: 'DIS-PUN-015', state: 'Maharashtra', city: 'Pune', attempts: 26, returns: 3, netSale: '₹5.5L', contribution: 8, returnPct: 11.5, successRate: 88.5, runtime: '6h 10m', trips: 15, distanceKm: 284 },
  { name: 'Nilesh Patil', vehicle: 'GJ-01-RR-4455', distributor: 'DIS-AHM-006', state: 'Gujarat', city: 'Ahmedabad', attempts: 22, returns: 2, netSale: '₹4.8L', contribution: 7, returnPct: 9.1, successRate: 90.9, runtime: '5h 30m', trips: 13, distanceKm: 246 },
  { name: 'Kiran Shah', vehicle: 'GJ-01-RR-6677', distributor: 'DIS-AHM-006', state: 'Gujarat', city: 'Ahmedabad', attempts: 18, returns: 2, netSale: '₹3.9L', contribution: 5.7, returnPct: 11.1, successRate: 88.9, runtime: '5h 45m', trips: 11, distanceKm: 214 },
];

/** Vehicle master — the reference's Vehicle Raw sheet, IDs included. */
export const vehicles = [
  { id: '6b2f0ebe-c3de-4faa-8d96-69434f9ed87c', name: 'Madappa-TS07UL8066', registration: 'TS07UL8066', ownership: 'Lease', volumetricCapacity: 1215.2, status: 'Active' },
  { id: '9e8332fe-c325-4807-9999-5fb3cd1fc074', name: 'Saleem-AP29V5514', registration: 'AP29V5514', ownership: 'Lease', volumetricCapacity: 999.6, status: 'Active' },
  { id: '14a1b4db-296b-4fc6-9390-dad8a10befa9', name: 'TATA 407', registration: 'AP23Y5098', ownership: 'Own', volumetricCapacity: 2892.55, status: 'Active' },
];

/** Value taxonomies observed in the reference's export rows. */
export const taxonomies = {
  hopTypes: ['Trip Start', 'Pickup', 'Delivery'],
  hopDeliveryStatuses: ['Started', 'Completed'],
  invoiceStatuses: ['Delivered', 'Returned'],
  orderTypes: ['Sales', 'Digital'],
  /** the Delivery Aging sheet buckets — the UI uses D0 → D4+, the export uses these */
  exportAgingBuckets: ['T + 0', 'T + 1', 'T + 2 & More'],
  returnRemarks: [
    'Store is closed or merchant not available',
    'Order delivery not possible (due to vehicle issues, etc)',
  ],
  /** the Orders volume-trend status filter */
  trendStatuses: ['Planned', 'In Progress', 'Completed', 'Cancelled'],
};

/** State → cities geography the reference filters on. */
export const geography: Record<string, string[]> = {
  Telangana: ['Hyderabad', 'Secunderabad', 'Warangal', 'Karimnagar'],
  Maharashtra: ['Mumbai', 'Pune', 'Nagpur', 'Nashik'],
  Karnataka: ['Bengaluru', 'Mysuru', 'Hubli', 'Mangaluru'],
  'Tamil Nadu': ['Chennai', 'Coimbatore', 'Madurai', 'Salem'],
  'Delhi NCR': ['New Delhi', 'Gurugram', 'Noida', 'Faridabad'],
  Gujarat: ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot'],
  'West Bengal': ['Kolkata', 'Howrah', 'Durgapur', 'Asansol'],
};

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

/** Trip status cards — the reference Trips page's top row. */
export const tripStatusCards = [
  { label: 'Planned', value: 18, bg: 'bg-chart-blue' },
  { label: 'In Progress', value: 14, bg: 'bg-warning' },
  { label: 'Completed', value: 92, bg: 'bg-success' },
  { label: 'Cancelled', value: 4, bg: 'bg-border-strong' },
];

/** Trip volume profiles — the reference's weekday and weekly series, with avg vehicles. */
export const tripsByWeekday = [
  { day: 'Mon', trips: 48, avgVehicles: 82 },
  { day: 'Tue', trips: 52, avgVehicles: 88 },
  { day: 'Wed', trips: 51, avgVehicles: 85 },
  { day: 'Thu', trips: 61, avgVehicles: 94 },
  { day: 'Fri', trips: 59, avgVehicles: 96 },
  { day: 'Sat', trips: 38, avgVehicles: 74 },
  { day: 'Sun', trips: 22, avgVehicles: 42 },
];
export const tripsWeekly = [
  { week: 'W1 Apr', trips: 220, avgVehicles: 84 },
  { week: 'W2 Apr', trips: 248, avgVehicles: 89 },
  { week: 'W3 Apr', trips: 261, avgVehicles: 91 },
  { week: 'W4 Apr', trips: 204, avgVehicles: 79 },
  { week: 'W1 May', trips: 242, avgVehicles: 88 },
  { week: 'W2 May', trips: 271, avgVehicles: 93 },
  { week: 'W3 May', trips: 239, avgVehicles: 87 },
];

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

/** Distributor registry — all 109 registered distributors: [code, name, state, city, zone].
 *  13 of these carry performance metrics this period (opsDistributors). */
export type RegistryRow = [code: string, name: string, state: string, city: string, zone: string];
export const registry: RegistryRow[] = [
  ["DIS-HYD-001","Ameerpet Central","Telangana","Hyderabad","Ameerpet"],
  ["DIS-HYD-002","Kukatpally North","Telangana","Hyderabad","Kukatpally"],
  ["DIS-HYD-003","Kukatpally South","Telangana","Hyderabad","Kukatpally"],
  ["DIS-HYD-004","Hyderabad Central","Telangana","Hyderabad","Secunderabad"],
  ["SECD123DIS","Secd123 Dist.","Telangana","Hyderabad","Secunderabad"],
  ["SECD456DIS","Secd456 Dist.","Telangana","Hyderabad","Secunderabad"],
  ["DIS-HYD-007","LB Nagar West","Telangana","Hyderabad","LB Nagar"],
  ["DIS-HYD-008","LB Nagar East","Telangana","Hyderabad","LB Nagar"],
  ["DIS-HYD-009","Dilsukhnagar Dist.","Telangana","Hyderabad","Dilsukhnagar"],
  ["DIS-HYD-010","Mehdipatnam Dist.","Telangana","Hyderabad","Mehdipatnam"],
  ["DIS-HYD-011","Gachibowli North","Telangana","Hyderabad","Gachibowli"],
  ["DIS-HYD-012","Gachibowli South","Telangana","Hyderabad","Gachibowli"],
  ["DIS-HYD-013","Banjara Hills Dist.","Telangana","Hyderabad","Banjara Hills"],
  ["DIS-HYD-014","Jubilee Hills Dist.","Telangana","Hyderabad","Jubilee Hills"],
  ["DIS-HYD-015","Kondapur West","Telangana","Hyderabad","Kondapur"],
  ["DIS-HYD-016","Kondapur East","Telangana","Hyderabad","Kondapur"],
  ["DIS-HYD-017","Madhapur Dist.","Telangana","Hyderabad","Madhapur"],
  ["DIS-HYD-018","Kompally North","Telangana","Hyderabad","Kompally"],
  ["DIS-HYD-019","Kompally South","Telangana","Hyderabad","Kompally"],
  ["DIS-HYD-020","Uppal East Dist.","Telangana","Hyderabad","Uppal"],
  ["DIS-HYD-021","Uppal West Dist.","Telangana","Hyderabad","Uppal"],
  ["DIS-HYD-022","Nacharam Dist.","Telangana","Hyderabad","Nacharam"],
  ["DIS-HYD-023","Tarnaka Dist.","Telangana","Hyderabad","Tarnaka"],
  ["DIS-HYD-024","Malkajgiri Dist.","Telangana","Hyderabad","Malkajgiri"],
  ["DIS-KRN-001","Karimnagar Central","Telangana","Karimnagar","Central"],
  ["DIS-KRN-002","Karimnagar North","Telangana","Karimnagar","North"],
  ["DIS-KRN-003","Karimnagar South","Telangana","Karimnagar","South"],
  ["DIS-MUM-001","Andheri East Dist.","Maharashtra","Mumbai","Andheri"],
  ["DIS-MUM-002","Andheri West Dist.","Maharashtra","Mumbai","Andheri"],
  ["DIS-MUM-003","Malad North","Maharashtra","Mumbai","Malad"],
  ["DIS-MUM-004","Malad South","Maharashtra","Mumbai","Malad"],
  ["DIS-MUM-005","Goregaon East","Maharashtra","Mumbai","Goregaon"],
  ["DIS-MUM-006","Goregaon West","Maharashtra","Mumbai","Goregaon"],
  ["DIS-MUM-007","Bhandup Dist.","Maharashtra","Mumbai","Bhandup"],
  ["DIS-MUM-008","Thane West Dist.","Maharashtra","Mumbai","Thane"],
  ["DIS-MUM-009","Thane East Dist.","Maharashtra","Mumbai","Thane"],
  ["DIS-MUM-010","Borivali North","Maharashtra","Mumbai","Borivali"],
  ["DIS-MUM-011","Borivali South","Maharashtra","Mumbai","Borivali"],
  ["DIS-MUM-012","Mumbai Metro Dist.","Maharashtra","Mumbai","Central"],
  ["DIS-MUM-013","Kandivali East","Maharashtra","Mumbai","Kandivali"],
  ["DIS-MUM-014","Kandivali West","Maharashtra","Mumbai","Kandivali"],
  ["DIS-MUM-015","Dahisar Dist.","Maharashtra","Mumbai","Dahisar"],
  ["DIS-MUM-016","Powai Dist.","Maharashtra","Mumbai","Powai"],
  ["DIS-MUM-017","Vikhroli Dist.","Maharashtra","Mumbai","Vikhroli"],
  ["DIS-MUM-018","Kurla North","Maharashtra","Mumbai","Kurla"],
  ["DIS-MUM-019","Kurla South","Maharashtra","Mumbai","Kurla"],
  ["DIS-MUM-020","Ghatkopar East","Maharashtra","Mumbai","Ghatkopar"],
  ["DIS-MUM-021","Ghatkopar West","Maharashtra","Mumbai","Ghatkopar"],
  ["DIS-MUM-022","Mulund West","Maharashtra","Mumbai","Mulund"],
  ["DIS-MUM-023","Mulund East","Maharashtra","Mumbai","Mulund"],
  ["DIS-BAN-001","Whitefield North","Karnataka","Bengaluru","Whitefield"],
  ["DIS-BAN-002","Whitefield South","Karnataka","Bengaluru","Whitefield"],
  ["DIS-BAN-003","Electronic City","Karnataka","Bengaluru","Electronic City"],
  ["DIS-BAN-004","Koramangala North","Karnataka","Bengaluru","Koramangala"],
  ["DIS-BAN-005","Koramangala South","Karnataka","Bengaluru","Koramangala"],
  ["DIS-BAN-006","HSR Layout Dist.","Karnataka","Bengaluru","HSR Layout"],
  ["DIS-BAN-007","Bengaluru North","Karnataka","Bengaluru","North Zone"],
  ["DIS-BAN-008","Indiranagar Dist.","Karnataka","Bengaluru","Indiranagar"],
  ["DIS-BAN-009","Marathahalli Dist.","Karnataka","Bengaluru","Marathahalli"],
  ["DIS-BAN-010","Jayanagar Dist.","Karnataka","Bengaluru","Jayanagar"],
  ["DIS-BAN-011","BTM Layout Dist.","Karnataka","Bengaluru","BTM Layout"],
  ["DIS-BAN-012","Hebbal Dist.","Karnataka","Bengaluru","Hebbal"],
  ["DIS-BAN-013","Yelahanka Dist.","Karnataka","Bengaluru","Yelahanka"],
  ["DIS-BAN-014","Rajajinagar Dist.","Karnataka","Bengaluru","Rajajinagar"],
  ["DIS-BAN-015","Malleswaram Dist.","Karnataka","Bengaluru","Malleswaram"],
  ["DIS-CHN-001","Velachery Dist.","Tamil Nadu","Chennai","South Chennai"],
  ["DIS-CHN-002","Tambaram Dist.","Tamil Nadu","Chennai","South Chennai"],
  ["DIS-CHN-003","Chennai East Dist.","Tamil Nadu","Chennai","East Chennai"],
  ["DIS-CHN-004","Perambur Dist.","Tamil Nadu","Chennai","North Chennai"],
  ["DIS-CHN-005","Anna Nagar Dist.","Tamil Nadu","Chennai","Central"],
  ["DIS-CHN-006","T Nagar Dist.","Tamil Nadu","Chennai","Central"],
  ["DIS-CHN-007","Porur Dist.","Tamil Nadu","Chennai","West Chennai"],
  ["DIS-CHN-008","Ambattur Dist.","Tamil Nadu","Chennai","North Chennai"],
  ["DIS-DEL-001","Connaught Place","Delhi NCR","New Delhi","Central Delhi"],
  ["DIS-DEL-002","Dwarka North","Delhi NCR","New Delhi","West Delhi"],
  ["DIS-DEL-003","Dwarka South","Delhi NCR","New Delhi","West Delhi"],
  ["DIS-DEL-004","Rohini Sector A","Delhi NCR","New Delhi","North Delhi"],
  ["DIS-DEL-005","Rohini Sector B","Delhi NCR","New Delhi","North Delhi"],
  ["DIS-DEL-006","Laxmi Nagar Dist.","Delhi NCR","New Delhi","East Delhi"],
  ["DIS-DEL-007","Preet Vihar Dist.","Delhi NCR","New Delhi","East Delhi"],
  ["DIS-DEL-008","Saket Dist.","Delhi NCR","New Delhi","South Delhi"],
  ["DIS-DEL-009","Delhi NCR Dist.","Delhi NCR","New Delhi","Central Delhi"],
  ["DIS-DEL-010","Vasant Kunj Dist.","Delhi NCR","New Delhi","South Delhi"],
  ["DIS-DEL-011","Janakpuri Dist.","Delhi NCR","New Delhi","West Delhi"],
  ["DIS-DEL-012","Gurugram Central","Delhi NCR","Gurugram","Gurugram"],
  ["DIS-PUN-001","Hinjewadi Dist.","Maharashtra","Pune","West Pune"],
  ["DIS-PUN-002","Kothrud Dist.","Maharashtra","Pune","West Pune"],
  ["DIS-PUN-003","Wakad Dist.","Maharashtra","Pune","West Pune"],
  ["DIS-PUN-004","Viman Nagar Dist.","Maharashtra","Pune","East Pune"],
  ["DIS-PUN-005","Hadapsar Dist.","Maharashtra","Pune","East Pune"],
  ["DIS-PUN-006","Kondhwa Dist.","Maharashtra","Pune","South Pune"],
  ["DIS-PUN-007","Katraj Dist.","Maharashtra","Pune","South Pune"],
  ["DIS-PUN-008","Pimpri North","Maharashtra","Pune","Pimpri-Chinchwad"],
  ["DIS-PUN-009","Chinchwad South","Maharashtra","Pune","Pimpri-Chinchwad"],
  ["DIS-PUN-010","Aundh Dist.","Maharashtra","Pune","North Pune"],
  ["DIS-PUN-011","Baner Dist.","Maharashtra","Pune","North Pune"],
  ["DIS-PUN-012","Deccan Dist.","Maharashtra","Pune","Central Pune"],
  ["DIS-PUN-013","Shivajinagar Dist.","Maharashtra","Pune","Central Pune"],
  ["DIS-PUN-014","Bibwewadi Dist.","Maharashtra","Pune","South Pune"],
  ["DIS-PUN-015","Pune Central Dist.","Maharashtra","Pune","Central Pune"],
  ["DIS-AHM-001","Navrangpura Dist.","Gujarat","Ahmedabad","Central"],
  ["DIS-AHM-002","Satellite Dist.","Gujarat","Ahmedabad","West"],
  ["DIS-AHM-003","Bopal Dist.","Gujarat","Ahmedabad","West"],
  ["DIS-AHM-004","Maninagar Dist.","Gujarat","Ahmedabad","East"],
  ["DIS-AHM-005","Odhav Dist.","Gujarat","Ahmedabad","East"],
  ["DIS-AHM-006","Ahmedabad Central","Gujarat","Ahmedabad","Central"],
  ["DIS-AHM-007","Vastral Dist.","Gujarat","Ahmedabad","East"],
  ["DIS-AHM-008","Chandkheda Dist.","Gujarat","Ahmedabad","North"],
  ["DIS-AHM-009","Gota Dist.","Gujarat","Ahmedabad","North"],];
