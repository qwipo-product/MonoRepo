// Ported 1:1 from the original shared enums chunk.

export const PageIds = {
  buyer_dashboard: 'buyer_dashboard',
  buyer_orders: 'buyer_orders',
  buyer_trips: 'buyer_trips',
  buyer_delivery_routes: 'buyer_delivery_routes',
  buyer_settings: 'buyer_settings',
  buyer_profile: 'buyer_profile',
  buyer_payments: 'buyer_payments',
  buyer_reports: 'buyer_reports',
  buyer_notifications: 'buyer_notifications',
  buyer_issues: 'buyer_issues',
} as const;

/** Buyer order status (orders.orderStatusId). Note: 7 is intentionally unused. */
export enum OrderStatus {
  ALL = 0,
  READY_FOR_PLANNING = 1,
  IN_PLANNING = 2,
  TRIP_ASSIGNED = 3,
  IN_TRANSIT = 4,
  DELIVERED = 5,
  PARTIAL_RETURN = 6,
  RETURNED = 8,
  PENDING = 9,
  CANCELLED = 10,
  DISCARDED = 11,
  OFFLINE_DELIVERY = 12,
}

/** Fulfillment / stop level status strings (ONDC fulfillment state). */
export enum FulfillmentStatus {
  CREATED = 'Created',
  ACCEPTED = 'Accepted',
  IN_PROGRESS = 'In-progress',
  PENDING = 'Pending',
  COMPLETED = 'Completed',
  CANCELLED = 'Cancelled',
  RETURNED = 'Returned',
  NONE = 'None',
}

export const BusinessTypes: Record<number, string> = {
  1: 'Retailer',
  2: 'Wholesaler',
  3: 'Distributor',
  4: 'Manufacturer',
  5: 'Service Provider',
};

/** Logistics order (trip) status (logisticsOrders.status). */
export enum TripStatus {
  ALL = 0,
  PLANNED = 1,
  IN_PROGRESS = 2,
  COMPLETED = 3,
  CANCELLED = 4,
}

export enum IssueReason {
  ORDER_NOT_RECEIVED = 'Order not received',
  QUALITY_ISSUE = 'Quality issue',
  DELAYED_DELIVERY = 'Delayed delivery',
  INVOICE_MISSING = 'Invoice missing',
  STORE_NOT_RESPONSIVE = 'Store not responsive',
  MISSING_ITEMS = 'Missing items',
  QUANTITY_ISSUE = 'Quantity issue',
  ITEM_MISMATCH = 'Item mismatch',
  EXPIRED_ITEM = 'Expired item',
  INCORRECTLY_MARKED_AS_RETURNED = 'Incorrectly marked as returned',
}

export enum IssueStatus {
  OPEN = 'OPEN',
  PROCESSING = 'PROCESSING',
  INFO_REQUESTED = 'INFO_REQUESTED',
  INFO_PROVIDED = 'INFO_PROVIDED',
  INFO_NOT_AVAILABLE = 'INFO_NOT_AVAILABLE',
  RESOLUTION_PROPOSED = 'RESOLUTION_PROPOSED',
  RESOLUTION_ACCEPTED = 'RESOLUTION_ACCEPTED',
  RESOLUTION_REJECTED = 'RESOLUTION_REJECTED',
  RESOLVED = 'RESOLVED',
  ESCALATE = 'ESCALATE',
  CLOSED = 'CLOSED',
  CASCADED = 'CASCADED',
  ESCALATED = 'ESCALATED',
}

export const IssueStatusLabels: Record<string, string> = {
  OPEN: 'Open',
  PROCESSING: 'Processing',
  INFO_REQUESTED: 'Info Requested',
  INFO_PROVIDED: 'Info Provided',
  INFO_NOT_AVAILABLE: 'Info Not Available',
  RESOLUTION_PROPOSED: 'Resolution Proposed',
  RESOLUTION_ACCEPTED: 'Resolution Accepted',
  RESOLUTION_REJECTED: 'Resolution Rejected',
  RESOLVED: 'Resolved',
  ESCALATE: 'Escalate',
  CLOSED: 'Closed',
  CASCADED: 'Cascaded',
};

export enum IgmVersion {
  V1_0_0 = '1.0.0',
  V2_0_0 = '2.0.0',
}

export function getIssueStatusLabel(status: string): string {
  switch (status) {
    case 'OPEN': return 'Open';
    case 'PROCESSING': return 'Processing';
    case 'INFO_REQUESTED': return 'Info Requested';
    case 'INFO_PROVIDED': return 'Info Provided';
    case 'INFO_NOT_AVAILABLE': return 'Info Not Available';
    case 'RESOLUTION_PROPOSED': return 'Resolution Proposed';
    case 'RESOLUTION_ACCEPTED': return 'Resolution Accepted';
    case 'RESOLUTION_REJECTED': return 'Resolution Rejected';
    case 'RESOLVED': return 'Resolved';
    case 'ESCALATE': return 'Escalated';
    case 'CLOSED': return 'Closed';
    case 'CASCADED': return 'Cascaded';
    default: return status;
  }
}

export enum OndcCategory {
  GROCERY = 'Grocery',
  ELECTRONICS = 'Electronics',
  F_AND_B = 'F&B',
  FASHION = 'Fashion',
  BPC = 'BPC',
  APPLIANCES = 'Appliances',
  HOME_AND_KITCHEN = 'Home & Kitchen',
  HEALTH_AND_WELLNESS = 'Health & Wellness',
  PHARMA = 'Pharma',
}

export const DeliveryConstants = {
  CORE_VERSION: '1.2.0',
  EXPRESS_DELIVERY: 'Express Delivery',
  STANDARD_DELIVERY: 'Standard Delivery',
  IMMEDIATE_DELIVERY: 'Immediate Delivery',
  SAME_DAY_DELIVERY: 'Same Day Delivery',
  NEXT_DAY_DELIVERY: 'Next Day Delivery',
  INSTANT_DELIVERY: 'Instant Delivery',
  SINGLE_ORDER_EXPIRY_MS: 300 * 1000,
};

export interface RouteEngineOption { value: string; label: string; description: string; isDefault: boolean }
export const RouteEngines: RouteEngineOption[] = [
  { value: 'route_optimize', label: 'Route Optimizer', description: 'Distributes orders across trips to optimise for route efficiency and vehicle load balancing. Beats may be split across multiple trips.', isDefault: true },
  { value: 'beat_optimized', label: 'Beat Optimizer', description: 'Keeps all orders belonging to the same beat in a single trip. Beats are never split across multiple trips. Routing and load optimisation remain unchanged.', isDefault: false },
  { value: 'cluster_beat_optimized', label: 'Cluster Beat Optimizer', description: 'All orders belonging to a tagged beat must be generated into the same assigned vehicle and must never be split across multiple vehicles.', isDefault: false },
];

export enum LogisticsMode {
  SELF = 'self',
  THREE_PL = '3pl',
  SELF_AND_THREE_PL = 'self+3pl',
}

export interface IssueCategoryDef { category: string; subcategory: string; enumCode: string }
export const IssueCategories: IssueCategoryDef[] = [
  { category: 'ORDER', subcategory: 'Order not received', enumCode: 'ORD001' },
  { category: 'ORDER', subcategory: 'Quality issue', enumCode: 'ORD002' },
  { category: 'ORDER', subcategory: 'Delayed delivery', enumCode: 'ORD003' },
  { category: 'ORDER', subcategory: 'Invoice missing', enumCode: 'ORD004' },
  { category: 'ORDER', subcategory: 'Store not responsive', enumCode: 'ORD005' },
  { category: 'ITEM', subcategory: 'Missing items', enumCode: 'ITM001' },
  { category: 'ITEM', subcategory: 'Quantity issue', enumCode: 'ITM002' },
  { category: 'ITEM', subcategory: 'Item mismatch', enumCode: 'ITM003' },
  { category: 'ITEM', subcategory: 'Quality issue', enumCode: 'ITM004' },
  { category: 'ITEM', subcategory: 'Expired item', enumCode: 'ITM005' },
  { category: 'ITEM', subcategory: 'Incorrectly marked as returned', enumCode: 'ITM006' },
  { category: 'FULFILLMENT', subcategory: 'Wrong delivery address', enumCode: 'FLM001' },
  { category: 'FULFILLMENT', subcategory: 'Unable to reach location', enumCode: 'FLM002' },
  { category: 'FULFILLMENT', subcategory: 'Delay in delivery', enumCode: 'FLM004' },
  { category: 'FULFILLMENT', subcategory: 'Packaging', enumCode: 'FLM005' },
  { category: 'FULFILLMENT', subcategory: 'Incorrectly marked as delivered', enumCode: 'FLM011' },
  { category: 'FULFILLMENT', subcategory: 'Delay in pick up', enumCode: 'FLM014' },
  { category: 'FULFILLMENT', subcategory: 'Not picked up', enumCode: 'FLM015' },
  { category: 'AGENT', subcategory: 'Agent behavioral issue', enumCode: 'AGT001' },
  { category: 'PAYMENT', subcategory: 'Refund not received', enumCode: 'PMT001' },
  { category: 'PAYMENT', subcategory: 'Not paid', enumCode: 'PMT002' },
  { category: 'PAYMENT', subcategory: 'Delay in payment', enumCode: 'PMT003' },
  { category: 'PAYMENT', subcategory: 'Underpaid', enumCode: 'PMT004' },
  { category: 'PAYMENT', subcategory: 'Overpaid', enumCode: 'PMT005' },
  { category: 'TECHNICAL', subcategory: "BAP didn't receive BPP's synchronous response to BAP's API request", enumCode: 'TEC002' },
  { category: 'TECHNICAL', subcategory: "BAP didn't receive BPP's asynchronous API response to BAP's API request", enumCode: 'TEC003' },
  { category: 'TECHNICAL', subcategory: "BPP nack to BAP's API request", enumCode: 'TEC005' },
  { category: 'POLICY BREACH', subcategory: 'Discriminatory conduct', enumCode: 'POL003' },
  { category: 'BUSINESS', subcategory: 'Order ID is either invalid or incorrect', enumCode: 'BSN001' },
  { category: 'BUSINESS', subcategory: 'Issue Category is either invalid or incorrect', enumCode: 'BSN002' },
  { category: 'BUSINESS', subcategory: 'Issue Subcategory is either invalid or incorrect', enumCode: 'BSN003' },
];
