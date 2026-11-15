// CDS (Cross Dock Store) Management & Logistics — domain types shared by the CDS backend (src/mock/routes/cds.ts)
// and the CDS screens (src/pages/cds). No runtime imports, so Node's test runner can load it.
//
// Flow: Seller confirms order (CDS Store Delivery) → Service Centre pickup planning → Distributor Pickup Trip
// → CDS Delivery Trip → handover at the CDS store (OTP; accepted units become Ready for Delivery) → CDS User
// Delivery Planning (routes by locality) → Retailer Delivery Trip (delivery with OTP, cash / UPI collected).
// There is no GRN step and no returns flow. Every pickup / handover point is confirmed with an OTP.

export type CdsRole = 'SERVICE_CENTRE' | 'CDS_USER';
export type CdsPage =
  | 'sc-orders' | 'sc-pickup' | 'sc-deliver' | 'sc-trips' | 'sc-reports' | 'sc-settings' | 'sc-stores'
  | 'cu-orders' | 'cu-delivery' | 'cu-trips' | 'cu-reports' | 'cu-customers' | 'cu-settings';

export const ROLE_PAGES: Record<CdsRole, CdsPage[]> = {
  SERVICE_CENTRE: ['sc-orders', 'sc-pickup', 'sc-deliver', 'sc-trips', 'sc-reports', 'sc-settings', 'sc-stores'],
  CDS_USER: ['cu-orders', 'cu-delivery', 'cu-trips', 'cu-reports', 'cu-customers', 'cu-settings'],
};

export interface GeoPoint {
  lat: number;
  lng: number;
}
export interface Stamp {
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
}
export interface StatusEvent {
  from: string | null;
  to: string;
  at: string;
  by: string;
  note?: string;
}

// ---------------------------------------------------------------- master data

export interface CdsStore {
  id: string;
  code: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  /** Area names shown for the store (labels; the service area polygon decides allocation). */
  localities: string[];
  /** Service area: retailers inside this polygon ([lat, lng] points) are served by this CDS store. */
  polygon: [number, number][];
  managerName: string;
  managerPhone: string;
  active: boolean;
}

export interface Distributor {
  id: string;
  code: string;
  name: string;
  contactName: string;
  phone: string;
  address: string;
  lat: number;
  lng: number;
}

export interface Retailer {
  id: string;
  code: string;
  name: string;
  ownerName: string;
  phone: string;
  address: string;
  locality: string;
  lat: number;
  lng: number;
}

export interface CdsUser {
  id: string;
  name: string;
  mobile: string;
  email: string;
  role: CdsRole;
  /** CDS_USER: exactly one store. SERVICE_CENTRE: the stores it is authorised for. */
  cdsStoreIds: string[];
  active: boolean;
}

export interface CdsSession {
  token: string;
  userId: string;
  createdAt: string;
}

/** Fleet owner: the Service Centre ('SC') or a CDS store id. */
export interface Vehicle {
  id: string;
  regNo: string;
  type: string;
  capacityKg: number;
  owner: string;
  active: boolean;
}
export interface DeliveryPerson {
  id: string;
  name: string;
  phone: string;
  owner: string;
  active: boolean;
}

export interface CdsSettings {
  otpExpiryMinutes: number;
  otpMaxAttempts: number;
  /** Retailer delivery routes must be for the next day or later. */
  nextDayPlanning: boolean;
}

// ---------------------------------------------------------------- orders

export type OrderStatus =
  | 'CONFIRMED'
  | 'PICKUP_PLANNED'
  | 'PICKED_UP'
  | 'IN_TRANSIT_TO_CDS'
  | 'READY_FOR_DELIVERY'
  | 'DELIVERY_PLANNED'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'PARTIALLY_DELIVERED'
  | 'CANCELLED';

export interface OrderLine {
  sku: string;
  name: string;
  qty: number;
  unitPrice: number;
  unitWeightKg: number;
  /** Collected at the distributor. */
  pickedQty: number;
  /** Accepted by the CDS store at the handover (OTP-verified count) — these units are deliverable. Picked − accepted = short at handover. */
  acceptedQty: number;
  deliveredQty: number;
}

export interface CdsOrder extends Stamp {
  id: string;
  orderNo: string;
  /** Seller Store order reference — idempotency key of the allocation. */
  sellerOrderRef: string;
  confirmedAt: string;
  distributorId: string;
  cdsStoreId: string;
  retailerId: string;
  lines: OrderLine[];
  orderValue: number;
  weightKg: number;
  paymentMode: 'COD' | 'PREPAID';
  status: OrderStatus;
  pickupTripId: string | null;
  cdsTripId: string | null;
  deliveryTripId: string | null;
  deliveredAt: string | null;
  note: string | null;
  history: StatusEvent[];
}

// ---------------------------------------------------------------- trips

/** Service Centre: DISTRIBUTOR_PICKUP, CDS_DELIVERY · CDS User: RETAILER_DELIVERY */
export type TripType = 'DISTRIBUTOR_PICKUP' | 'CDS_DELIVERY' | 'RETAILER_DELIVERY';
export type TripStatus = 'PLANNED' | 'ASSIGNED' | 'STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'PARTIALLY_COMPLETED' | 'CANCELLED';

/** What happens at a stop — one per OTP checkpoint. */
export type StopAction =
  | 'DISTRIBUTOR_PICKUP' // Seller/Distributor & Delivery Person
  | 'CDS_HANDOVER' // Delivery Person & CDS User
  | 'CDS_ORDER_PICKUP' // CDS User & Delivery Person
  | 'RETAILER_DELIVERY'; // Delivery Person & Retailer

export type StopStatus = 'PENDING' | 'DONE' | 'PARTIAL' | 'FAILED';
export type PartyType = 'DISTRIBUTOR' | 'CDS' | 'RETAILER';

export interface StopLine {
  orderId: string | null;
  sku: string;
  name: string;
  unitPrice: number;
  unitWeightKg: number;
  plannedQty: number;
  actualQty: number | null;
}

export interface TripStop {
  id: string;
  seq: number;
  action: StopAction;
  partyType: PartyType;
  partyId: string;
  name: string;
  address: string;
  phone: string;
  lat: number;
  lng: number;
  lines: StopLine[];
  status: StopStatus;
  otpId: string | null;
  verifiedAt: string | null;
  verifiedBy: string | null;
  completedAt: string | null;
  failReason: string | null;
  note: string | null;
  /** RETAILER_DELIVERY: cash / UPI collected. */
  collectionId: string | null;
}

export interface Trip extends Stamp {
  id: string;
  tripNo: string;
  type: TripType;
  /** 'SC' or the CDS store id that runs the trip. */
  owner: string;
  planId: string;
  plannedDate: string;
  slot: string;
  vehicleId: string;
  vehicleRegNo: string;
  vehicleType: string;
  capacityKg: number;
  deliveryPersonId: string;
  deliveryPersonName: string;
  deliveryPersonPhone: string;
  status: TripStatus;
  stops: TripStop[];
  orderIds: string[];
  loadKg: number;
  distanceKm: number;
  etaMinutes: number;
  startedAt: string | null;
  completedAt: string | null;
  cancelReason: string | null;
  history: StatusEvent[];
}

/**
 * CDS User delivery route (LBNP-style Delivery Planning): one vehicle, its retailer stops in visiting order. Confirmed
 * routes wait for "Generate Trip", where the delivery person is chosen.
 */
export interface DeliveryRoute {
  vehicleId: string;
  vehicleRegNo: string;
  vehicleType: string;
  capacityKg: number;
  /** Retailer localities on the route (routes are grouped by locality). */
  localities: string[];
  /** Retailers in visiting order from the CDS store. */
  retailerIds: string[];
  loadKg: number;
  orderValue: number;
  distanceKm: number;
  etaMinutes: number;
}

/** A planning action (Pickup Planning / Deliver to CDS / Delivery Planning route) and the trips it generated. */
export interface Plan extends Stamp {
  id: string;
  planNo: string;
  kind: 'PICKUP' | 'CDS_DELIVERY' | 'RETAILER_DELIVERY';
  owner: string;
  plannedDate: string;
  orderIds: string[];
  tripIds: string[];
  remarks: string;
  /** RETAILER_DELIVERY only. */
  route?: DeliveryRoute;
}

// ---------------------------------------------------------------- OTP

export type OtpStatus = 'ACTIVE' | 'VERIFIED' | 'EXPIRED' | 'SUPERSEDED' | 'LOCKED';
export interface OtpTxn {
  id: string;
  purpose: StopAction;
  tripId: string;
  tripNo: string;
  stopId: string;
  /** The party the OTP is sent to (never the delivery person, who enters it). */
  sentToType: PartyType;
  sentToId: string;
  sentToName: string;
  sentToPhone: string;
  code: string;
  createdAt: string;
  createdBy: string;
  expiresAt: string;
  attempts: number;
  status: OtpStatus;
  verifiedAt: string | null;
  verifiedBy: string | null;
}

// ---------------------------------------------------------------- collections (recorded at delivery)

/** Cash / UPI collected for a COD order at the retailer delivery stop; shown in the trip's collection summary. */
export interface Collection extends Stamp {
  id: string;
  collectionNo: string;
  cdsStoreId: string;
  tripId: string;
  tripNo: string;
  orderId: string;
  orderNo: string;
  retailerId: string;
  deliveryPersonId: string;
  deliveryPersonName: string;
  expectedAmount: number;
  amount: number;
  mode: 'CASH' | 'UPI';
  collectedAt: string;
}

export interface AuditEntry {
  id: string;
  at: string;
  by: string;
  entity: 'ORDER' | 'TRIP' | 'PLAN' | 'COLLECTION' | 'OTP' | 'STORE' | 'SETTINGS' | 'SESSION';
  entityId: string;
  action: string;
  detail: string;
}

export interface CdsState {
  version: number;
  seq: number;
  settings: CdsSettings;
  stores: CdsStore[];
  distributors: Distributor[];
  retailers: Retailer[];
  users: CdsUser[];
  sessions: CdsSession[];
  vehicles: Vehicle[];
  deliveryPersons: DeliveryPerson[];
  orders: CdsOrder[];
  plans: Plan[];
  trips: Trip[];
  otps: OtpTxn[];
  collections: Collection[];
  /** Delivery Partner App events already applied (idempotency). */
  dpEventIds: string[];
  audit: AuditEntry[];
}
