// Salesperson feature — self-contained mock, mirrors bms-customer-app.
//
// A salesperson logs in with 9000000001 and gets a beat-day workflow:
//   Home menu → Attendance (check-in/out, leave) · Tasks (assigned shops) →
//   Task Details (info / orders / recommendation / interaction) → Create
//   Interaction · Performance (targets) · Customer Orders (today's book) ·
//   Switch Customer (act on a retailer's behalf → customer Home).
//
// Source of truth = qwipo/bms-customer-app pages/sales-person/*. This file owns
// every field/state/label the screens render — nothing hardcoded in components.

/** Phone that flips login into salesperson mode. */
export const SALESPERSON_PHONE = '9000000001';

// ── Enums (values match the source) ──────────────────────────────────────────

export type TaskStatus = 'none' | 'checked_in' | 'interaction_added' | 'checked_out';
export const TASK_STATUS_LABEL: Record<TaskStatus, string> = {
  none: 'Pending',
  checked_in: 'Checked in',
  interaction_added: 'Interaction added',
  checked_out: 'Completed',
};

export type AttendanceStatus =
  | 'none'
  | 'checked_in'
  | 'checked_out'
  | 'early_logout_pending'
  | 'early_logout_accepted'
  | 'early_logout_rejected'
  | 'leave_accepted';

export type LeaveStatus = 'pending' | 'accepted' | 'rejected';
export const LEAVE_STATUS_LABEL: Record<LeaveStatus, string> = {
  pending: 'Pending',
  accepted: 'Accepted',
  rejected: 'Rejected',
};

/** Interaction outcome categories (CommentCategory enum in source). */
export const COMMENT_CATEGORIES = [
  'Order placed already',
  'Will order in a week',
  'Customer unavailable',
  'Shop closed, visit again',
  'Business is low',
  'Permanent shutdown',
  'Prices are high',
  'Location is incorrect',
  'Not interested to buy',
  'Other',
] as const;
export type CommentCategory = (typeof COMMENT_CATEGORIES)[number];

// ── Salesperson profile ──────────────────────────────────────────────────────

export interface Salesperson {
  name: string;
  mobile: string;
  code: string;
  area: string;
  salesLead: { name: string; mobile: string };
  salesManager: { name: string; mobile: string };
}

export const SALESPERSON: Salesperson = {
  name: 'Suresh Babu',
  mobile: '9000000001',
  code: 'SP-HYD-014',
  area: 'Hitech City · Beat 3',
  salesLead: { name: 'Ramesh Gupta', mobile: '9000000045' },
  salesManager: { name: 'Anil Verma', mobile: '9000000088' },
};

// ── Attendance ───────────────────────────────────────────────────────────────

export interface Attendance {
  status: AttendanceStatus;
  checkInTime: string | null;
  checkOutTime: string | null;
  month: string;
  workingDays: number;
  presentDays: number;
  absentDays: number;
  leaveDays: number;
}

export const ATTENDANCE: Attendance = {
  status: 'none',
  checkInTime: null,
  checkOutTime: null,
  month: 'August 2026',
  workingDays: 26,
  presentDays: 18,
  absentDays: 2,
  leaveDays: 1,
};

export interface Leave {
  id: string;
  appliedOn: string;
  reason: string;
  status: LeaveStatus;
}

export const LEAVES: Leave[] = [
  { id: 'lv1', appliedOn: '2026-08-04', reason: 'Personal work', status: 'accepted' },
  { id: 'lv2', appliedOn: '2026-08-14', reason: 'Family function', status: 'pending' },
  { id: 'lv3', appliedOn: '2026-07-22', reason: 'Medical', status: 'rejected' },
];

// ── Tasks (assigned shops for the day) ───────────────────────────────────────

export interface TaskCustomer {
  id: string;
  businessName: string;
  ownerName: string;
  mobile: string;
  address: string;
  lat: number;
  lng: number;
}

export interface Task {
  id: string;
  stop: number;
  status: TaskStatus;
  customer: TaskCustomer;
}

export const TASKS: Task[] = [
  {
    id: 'tk1',
    stop: 1,
    status: 'checked_out',
    customer: {
      id: 'c1',
      businessName: 'Sri Venkateswara Kirana Store',
      ownerName: 'Rajesh Kumar',
      mobile: '9876543210',
      address: 'Shop 12, Rai Durg Main Road, Hitech City',
      lat: 17.4401,
      lng: 78.3489,
    },
  },
  {
    id: 'tk2',
    stop: 2,
    status: 'interaction_added',
    customer: {
      id: 'c2',
      businessName: 'Lakshmi General Stores',
      ownerName: 'Padma Reddy',
      mobile: '9876500011',
      address: '4-7-22, Madhapur Cross Roads, Hyderabad',
      lat: 17.4478,
      lng: 78.3916,
    },
  },
  {
    id: 'tk3',
    stop: 3,
    status: 'checked_in',
    customer: {
      id: 'c3',
      businessName: 'Anjaneya Super Market',
      ownerName: 'Venkat Rao',
      mobile: '9848012345',
      address: 'Plot 9, Kondapur Main Road, Hyderabad',
      lat: 17.4649,
      lng: 78.3618,
    },
  },
  {
    id: 'tk4',
    stop: 4,
    status: 'none',
    customer: {
      id: 'c4',
      businessName: 'New Balaji Provisions',
      ownerName: 'Srinivas M',
      mobile: '9701122334',
      address: '2-14, Gachibowli Circle, Hyderabad',
      lat: 17.4401,
      lng: 78.3489,
    },
  },
  {
    id: 'tk5',
    stop: 5,
    status: 'none',
    customer: {
      id: 'c5',
      businessName: 'Sai Krishna Kirana',
      ownerName: 'Krishna Murthy',
      mobile: '9000112233',
      address: '6-3-45, Miyapur X Roads, Hyderabad',
      lat: 17.4969,
      lng: 78.3428,
    },
  },
];

// ── Customers (all retailers assigned to the salesperson) ────────────────────
// Broader than TASKS (which is only today's beat). Reuses the same customer ids
// so CUSTOMER_ORDERS / RECOMMENDATIONS resolve for the details screen.

export interface SalespersonCustomer {
  id: string;
  name: string;
  businessName: string;
  mobile: string;
  address: string;
  lat: number;
  lng: number;
  lastOrderDate: string;
}

export const CUSTOMERS: SalespersonCustomer[] = [
  { id: 'c1', name: 'Rajesh Kumar', businessName: 'Sri Venkateswara Kirana Store', mobile: '9876543210', address: 'Shop 12, Rai Durg Main Road, Hitech City', lat: 17.4401, lng: 78.3489, lastOrderDate: 'Last order 2026-07-28' },
  { id: 'c2', name: 'Padma Reddy', businessName: 'Lakshmi General Stores', mobile: '9876500011', address: '4-7-22, Madhapur Cross Roads, Hyderabad', lat: 17.4478, lng: 78.3916, lastOrderDate: 'Last order 2026-08-01' },
  { id: 'c3', name: 'Venkat Rao', businessName: 'Anjaneya Super Market', mobile: '9848012345', address: 'Plot 9, Kondapur Main Road, Hyderabad', lat: 17.4649, lng: 78.3618, lastOrderDate: 'No orders yet' },
  { id: 'c4', name: 'Srinivas M', businessName: 'New Balaji Provisions', mobile: '9701122334', address: '2-14, Gachibowli Circle, Hyderabad', lat: 17.4401, lng: 78.3489, lastOrderDate: 'No orders yet' },
  { id: 'c5', name: 'Krishna Murthy', businessName: 'Sai Krishna Kirana', mobile: '9000112233', address: '6-3-45, Miyapur X Roads, Hyderabad', lat: 17.4969, lng: 78.3428, lastOrderDate: 'No orders yet' },
  { id: 'c6', name: 'Mohan Das', businessName: 'Ganesh Traders', mobile: '9012345678', address: '1-8-9, Kukatpally Housing Board, Hyderabad', lat: 17.4948, lng: 78.3996, lastOrderDate: 'Last order 2026-08-06' },
  { id: 'c7', name: 'Farhan Ali', businessName: 'Al-Madina Super Bazar', mobile: '9032109876', address: '5-2-30, Tolichowki Main Road, Hyderabad', lat: 17.3948, lng: 78.4083, lastOrderDate: 'Last order 2026-07-19' },
];

// ── Interactions (per customer) ──────────────────────────────────────────────

export interface Interaction {
  id: string;
  date: string;
  category: CommentCategory;
  comments: string;
}

export const INTERACTIONS: Record<string, Interaction[]> = {
  c1: [
    { id: 'in1', date: '2026-08-10', category: 'Order placed already', comments: 'Placed a full case order for Aashirvaad and Maggi. Happy with delivery times.' },
    { id: 'in2', date: '2026-08-03', category: 'Prices are high', comments: 'Feels edible oil pricing is higher than the local wholesaler.' },
  ],
  c2: [
    { id: 'in3', date: '2026-08-10', category: 'Will order in a week', comments: 'Stock still available. Asked to revisit next week for a fresh order.' },
  ],
  c3: [],
  c4: [],
  c5: [],
};

// ── Recommendation (last order + reorder products, per customer) ─────────────

export interface RecoProduct {
  id: string;
  name: string;
  image: string;
  mrp: number;
  price: number;
  pack: string;
  qty: number;
}

export interface Recommendation {
  lastOrderNo: string;
  lastOrderDate: string;
  lastOrderValue: number;
  daysSince: number;
  products: RecoProduct[];
}

export const RECOMMENDATIONS: Record<string, Recommendation | null> = {
  c1: {
    lastOrderNo: 'QWIP2402204',
    lastOrderDate: '2026-07-28',
    lastOrderValue: 8450,
    daysSince: 13,
    products: [
      { id: 'p1', name: 'Aashirvaad Atta 10kg', image: '🌾', mrp: 465, price: 420, pack: '10 kg · 4/Case', qty: 4 },
      { id: 'p2', name: 'Maggi Family Pack', image: '🍜', mrp: 60, price: 52, pack: '280 g · 24/Case', qty: 24 },
      { id: 'p3', name: 'Freedom Sunflower Oil', image: '🛢️', mrp: 185, price: 165, pack: '1 L · 16/Case', qty: 16 },
    ],
  },
  c2: {
    lastOrderNo: 'QWIP2401880',
    lastOrderDate: '2026-08-01',
    lastOrderValue: 5120,
    daysSince: 9,
    products: [
      { id: 'p4', name: 'Red Label Tea', image: '🍵', mrp: 150, price: 135, pack: '250 g · 40/Case', qty: 20 },
      { id: 'p5', name: 'Close Up Toothpaste', image: '🪥', mrp: 55, price: 48, pack: '150 g · 36/Case', qty: 12 },
    ],
  },
  c3: null,
  c4: null,
  c5: null,
  c6: {
    lastOrderNo: 'QWIP2402150',
    lastOrderDate: '2026-08-06',
    lastOrderValue: 6100,
    daysSince: 4,
    products: [
      { id: 'p6', name: 'Mysore Sandal Soap', image: '🧼', mrp: 48, price: 42, pack: '150 g · 72/Case', qty: 12 },
      { id: 'p7', name: 'Fortune Besan', image: '🫘', mrp: 62, price: 55, pack: '500 g · 20/Case', qty: 20 },
    ],
  },
  c7: {
    lastOrderNo: 'QWIP2400990',
    lastOrderDate: '2026-07-19',
    lastOrderValue: 3980,
    daysSince: 22,
    products: [
      { id: 'p8', name: 'Nescafé Classic 200g', image: '☕', mrp: 210, price: 185, pack: '200 g · 24/Case', qty: 8 },
    ],
  },
};

// ── Customer's existing orders (Orders tab in Task Details) ──────────────────

export interface CustomerOrder {
  id: string;
  orderNo: string;
  date: string;
  status: string;
  amount: number;
}

export const CUSTOMER_ORDERS: Record<string, CustomerOrder[]> = {
  c1: [
    { id: 'o1', orderNo: 'QWIP2402204', date: '2026-07-28', status: 'Delivered', amount: 8450 },
    { id: 'o2', orderNo: 'QWIP2399120', date: '2026-07-14', status: 'Delivered', amount: 6200 },
  ],
  c2: [{ id: 'o3', orderNo: 'QWIP2401880', date: '2026-08-01', status: 'Delivered', amount: 5120 }],
  c3: [],
  c4: [],
  c5: [],
  c6: [
    { id: 'o4', orderNo: 'QWIP2402150', date: '2026-08-06', status: 'Delivered', amount: 6100 },
    { id: 'o5', orderNo: 'QWIP2398870', date: '2026-07-25', status: 'Delivered', amount: 4200 },
  ],
  c7: [{ id: 'o6', orderNo: 'QWIP2400990', date: '2026-07-19', status: 'Delivered', amount: 3980 }],
};

// ── Performance (per selected date) ──────────────────────────────────────────
// The screen picks a date and shows THAT day's numbers (no Today/Month tabs),
// plus a month-to-date allowance card below.

export interface DayPerformance {
  dayRevenueTarget: number;
  dayRevenueAchieved: number;
  taskRevenueTarget: number;
  taskRevenueAchieved: number;
  assignedTasks: number;
  visitedCount: number;
  buyingCountTarget: number;
  buyingCountAchieved: number;
  buyingRevenueAchieved: number;
  nonBuyingRevenueAchieved: number;
  nonBuyingTarget: number;
  nonBuyingAchieved: number;
  petrolAllowance: number;
  incentiveAllowance: number;
}

export interface MonthPerformance {
  month: string;
  year: number;
  mtdIncentiveAllowance: number;
  mtdPetrolAllowance: number;
}

/** The current beat day (matches the app's mock "today"). */
export const PERFORMANCE_TODAY = '2026-08-10';

const DAY_PERFORMANCE: Record<string, DayPerformance> = {
  '2026-08-10': {
    dayRevenueTarget: 40000,
    dayRevenueAchieved: 28600,
    taskRevenueTarget: 30000,
    taskRevenueAchieved: 21400,
    assignedTasks: 5,
    visitedCount: 3,
    buyingCountTarget: 4,
    buyingCountAchieved: 2,
    buyingRevenueAchieved: 21400,
    nonBuyingRevenueAchieved: 7200,
    nonBuyingTarget: 1,
    nonBuyingAchieved: 1,
    petrolAllowance: 150,
    incentiveAllowance: 320,
  },
  '2026-08-09': {
    dayRevenueTarget: 40000,
    dayRevenueAchieved: 44800,
    taskRevenueTarget: 30000,
    taskRevenueAchieved: 33500,
    assignedTasks: 6,
    visitedCount: 6,
    buyingCountTarget: 5,
    buyingCountAchieved: 5,
    buyingRevenueAchieved: 33500,
    nonBuyingRevenueAchieved: 11300,
    nonBuyingTarget: 1,
    nonBuyingAchieved: 1,
    petrolAllowance: 180,
    incentiveAllowance: 640,
  },
};

/** A quiet, mostly-zero day for any date without recorded activity. */
const EMPTY_DAY: DayPerformance = {
  dayRevenueTarget: 40000,
  dayRevenueAchieved: 0,
  taskRevenueTarget: 30000,
  taskRevenueAchieved: 0,
  assignedTasks: 0,
  visitedCount: 0,
  buyingCountTarget: 4,
  buyingCountAchieved: 0,
  buyingRevenueAchieved: 0,
  nonBuyingRevenueAchieved: 0,
  nonBuyingTarget: 1,
  nonBuyingAchieved: 0,
  petrolAllowance: 0,
  incentiveAllowance: 0,
};

export const dayPerformanceFor = (date: string): DayPerformance => DAY_PERFORMANCE[date] ?? EMPTY_DAY;

export const MONTH_PERFORMANCE: MonthPerformance = {
  month: 'August',
  year: 2026,
  mtdIncentiveAllowance: 8450,
  mtdPetrolAllowance: 3900,
};

// ── Customer Orders — salesperson's own order book for today ──────────────────

export interface SpOrder {
  id: string;
  orderNo: string;
  business: string;
  seller: string;
  date: string;
  status: string;
  cancelled?: boolean;
  itemTotal: number;
  deliveryFee: number;
  discount?: number;
  total: number;
}

export interface SpOrderSummary {
  revenue: number;
  customerCount: number;
  tasksRevenue: number;
  tasksCustomerCount: number;
  unassignedRevenue: number;
  unassignedCustomerCount: number;
}

export const SP_ORDERS: SpOrder[] = [
  { id: 'so1', orderNo: 'QWIP2402301', business: 'Sri Venkateswara Kirana Store', seller: 'Omkar Enterprise', date: '2026-08-10', status: 'Placed', itemTotal: 8250, deliveryFee: 200, total: 8450 },
  { id: 'so2', orderNo: 'QWIP2402298', business: 'Lakshmi General Stores', seller: 'Sri Sai Krishna Traders', date: '2026-08-10', status: 'Placed', itemTotal: 5000, deliveryFee: 120, discount: 300, total: 4820 },
  { id: 'so3', orderNo: 'QWIP2402290', business: 'Anjaneya Super Market', seller: 'Omkar Enterprise', date: '2026-08-10', status: 'Cancelled', cancelled: true, itemTotal: 3200, deliveryFee: 200, total: 3400 },
  { id: 'so4', orderNo: 'QWIP2402284', business: 'Ganesh Traders', seller: 'Karnataka Soaps', date: '2026-08-10', status: 'Placed', itemTotal: 6100, deliveryFee: 0, total: 6100 },
];

export const SP_ORDER_SUMMARY: SpOrderSummary = {
  revenue: 19370,
  customerCount: 3,
  tasksRevenue: 13270,
  tasksCustomerCount: 2,
  unassignedRevenue: 6100,
  unassignedCustomerCount: 1,
};

// ── Switch Customer (search / nearby retailers) ──────────────────────────────

export interface SwitchCustomer {
  id: string;
  businessName: string;
  ownerName: string;
  mobile: string;
  address: string;
  distanceM: number;
}

export const SWITCH_CUSTOMERS: SwitchCustomer[] = [
  { id: 'c1', businessName: 'Sri Venkateswara Kirana Store', ownerName: 'Rajesh Kumar', mobile: '9876543210', address: 'Shop 12, Rai Durg Main Road, Hitech City', distanceM: 40 },
  { id: 'c2', businessName: 'Lakshmi General Stores', ownerName: 'Padma Reddy', mobile: '9876500011', address: '4-7-22, Madhapur Cross Roads', distanceM: 120 },
  { id: 'c3', businessName: 'Anjaneya Super Market', ownerName: 'Venkat Rao', mobile: '9848012345', address: 'Plot 9, Kondapur Main Road', distanceM: 210 },
];

/** Radius (m) used by "Locate retailers nearby" (salesPersonConfig default). */
export const NEARBY_RADIUS_M = 250;
