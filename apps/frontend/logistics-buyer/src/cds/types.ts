// CDS (Cross Dock Store) Management & Logistics — domain types shared by the CDS backend (src/mock/routes/cds.ts)
// and the CDS screens (src/pages/cds). No runtime imports, so Node's test runner can load it.
//
// Flow: Seller confirms order (CDS Store Delivery) → Service Centre pickup planning → Distributor Pickup Trip
// → CDS Delivery Trip → CDS User GRN (distributor-wise) → retailer-wise Delivery Planning → Retailer Delivery Trip
// (delivery, collections, returns) → return handover at CDS → Service Centre Return Planning → CDS Return Trip
// → handover to the seller. Every pickup / handover point is confirmed with an OTP.

export type CdsRole = 'SERVICE_CENTRE' | 'CDS_USER';
export type CdsPage =
  | 'sc-orders' | 'sc-pickup' | 'sc-deliver' | 'sc-returns' | 'sc-trips' | 'sc-reports' | 'sc-settings' | 'sc-stores'
  | 'cu-grn' | 'cu-orders' | 'cu-delivery' | 'cu-trips' | 'cu-collections' | 'cu-returns' | 'cu-reports' | 'cu-retailers';

export const ROLE_PAGES: Record<CdsRole, CdsPage[]> = {
  SERVICE_CENTRE: ['sc-orders', 'sc-pickup', 'sc-deliver', 'sc-returns', 'sc-trips', 'sc-reports', 'sc-settings', 'sc-stores'],
  CDS_USER: ['cu-grn', 'cu-orders', 'cu-delivery', 'cu-trips', 'cu-collections', 'cu-returns', 'cu-reports', 'cu-retailers'],
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
  /** Serviceability: retailer localities this CDS delivers to. */
  localities: string[];
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
  /** Retailer delivery plans and return plans must be for the next day or later. */
  nextDayPlanning: boolean;
}

// ---------------------------------------------------------------- orders

export type OrderStatus =
  | 'CONFIRMED'
  | 'PICKUP_PLANNED'
  | 'PICKED_UP'
  | 'IN_TRANSIT_TO_CDS'
  | 'RECEIVED_AT_CDS'
  | 'GRN_COMPLETED'
  | 'READY_FOR_DELIVERY'
  | 'DELIVERY_PLANNED'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'PARTIALLY_DELIVERED'
  | 'RETURNED'
  | 'CANCELLED';

export interface OrderLine {
  sku: string;
  name: string;
  qty: number;
  unitPrice: number;
  unitWeightKg: number;
  /** Collected at the distributor. */
  pickedQty: number;
  /** Handed over at the CDS (counted at handover). */
  receivedQty: number;
  /** GRN: accepted into the CDS (deliverable). */
  acceptedQty: number;
  damagedQty: number;
  deliveredQty: number;
  returnedQty: number;
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
  grnId: string | null;
  deliveryTripId: string | null;
  deliveredAt: string | null;
  note: string | null;
  history: StatusEvent[];
}

// ---------------------------------------------------------------- trips

/** Service Centre: DISTRIBUTOR_PICKUP, CDS_DELIVERY, CDS_RETURN · CDS User: RETAILER_DELIVERY */
export type TripType = 'DISTRIBUTOR_PICKUP' | 'CDS_DELIVERY' | 'CDS_RETURN' | 'RETAILER_DELIVERY';
export type TripStatus = 'PLANNED' | 'ASSIGNED' | 'STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'PARTIALLY_COMPLETED' | 'CANCELLED';

/** What happens at a stop — one per OTP checkpoint in the brief. */
export type StopAction =
  | 'DISTRIBUTOR_PICKUP' // Seller/Distributor & Delivery Person
  | 'CDS_HANDOVER' // Delivery Person & CDS User
  | 'CDS_ORDER_PICKUP' // CDS User & Delivery Person
  | 'RETAILER_DELIVERY' // Delivery Person & Retailer
  | 'RETAILER_RETURN' // Delivery Person & Retailer
  | 'RETURN_HANDOVER_CDS' // Delivery Person & CDS User
  | 'CDS_RETURN_PICKUP' // CDS User & Delivery Person
  | 'SELLER_RETURN_HANDOVER'; // Delivery Person & Seller

export type StopStatus = 'PENDING' | 'DONE' | 'PARTIAL' | 'FAILED';
export type PartyType = 'DISTRIBUTOR' | 'CDS' | 'RETAILER';

export interface StopLine {
  orderId: string | null;
  returnId: string | null;
  sku: string;
  name: string;
  unitPrice: number;
  unitWeightKg: number;
  plannedQty: number;
  actualQty: number | null;
  /** RETURN_HANDOVER_CDS: accepted / rejected by the CDS User. */
  acceptedQty?: number | null;
  rejectedQty?: number | null;
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
  returnIds: string[];
  loadKg: number;
  distanceKm: number;
  etaMinutes: number;
  startedAt: string | null;
  completedAt: string | null;
  cancelReason: string | null;
  history: StatusEvent[];
}

/** A planning action (Pickup Planning / Deliver to CDS / Delivery Planning / Return Planning) and the trips it generated. */
export interface Plan extends Stamp {
  id: string;
  planNo: string;
  kind: 'PICKUP' | 'CDS_DELIVERY' | 'RETAILER_DELIVERY' | 'RETURN';
  owner: string;
  plannedDate: string;
  orderIds: string[];
  returnIds: string[];
  tripIds: string[];
  remarks: string;
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

// ---------------------------------------------------------------- GRN

export interface GrnLine {
  orderId: string;
  orderNo: string;
  sku: string;
  name: string;
  dispatchedQty: number;
  receivedQty: number;
  acceptedQty: number | null;
  damagedQty: number | null;
  shortQty: number;
  excessQty: number;
  remarks: string;
}
export interface Grn extends Stamp {
  id: string;
  grnNo: string;
  cdsStoreId: string;
  distributorId: string;
  /** CDS Delivery Trip that handed the goods over, and the pickup trip(s) they came from. */
  cdsTripId: string;
  pickupTripIds: string[];
  orderIds: string[];
  status: 'PENDING' | 'COMPLETED';
  lines: GrnLine[];
  remarks: string;
  completedAt: string | null;
  history: StatusEvent[];
}

// ---------------------------------------------------------------- returns

export type ReturnStatus =
  | 'RETURN_INITIATED'
  | 'PICKED_UP_FROM_RETAILER'
  | 'RECEIVED_AT_CDS'
  | 'RETURN_PLANNED'
  | 'PICKED_UP_FROM_CDS'
  | 'DELIVERED_TO_SELLER'
  | 'COMPLETED'
  | 'CANCELLED';

export type ItemCondition = 'GOOD' | 'DAMAGED' | 'EXPIRED';
export interface ReturnLine {
  sku: string;
  name: string;
  unitPrice: number;
  unitWeightKg: number;
  qty: number;
  reason: string;
  condition: ItemCondition;
  pickedQty: number | null;
  acceptedQty: number | null;
  rejectedQty: number | null;
  handedToSellerQty: number | null;
}
export interface ReturnRecord extends Stamp {
  id: string;
  returnNo: string;
  /** RETAILER: retailer return · GRN: damaged at GRN (already at the CDS). */
  source: 'RETAILER' | 'GRN';
  orderId: string;
  orderNo: string;
  cdsStoreId: string;
  distributorId: string;
  retailerId: string | null;
  lines: ReturnLine[];
  status: ReturnStatus;
  retailerTripId: string | null;
  returnTripId: string | null;
  history: StatusEvent[];
}

// ---------------------------------------------------------------- collections (manual)

export type CollectionStatus = 'WITH_DELIVERY_PERSON' | 'RECEIVED_BY_CDS' | 'HANDED_TO_QWIPO' | 'SETTLED';
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
  status: CollectionStatus;
  cdsReceivedAmount: number | null;
  cdsReceivedAt: string | null;
  cdsReceivedBy: string | null;
  mismatchNote: string | null;
  qwipoHandoverRef: string | null;
  qwipoHandedAt: string | null;
  settlementRef: string | null;
  settledAt: string | null;
  history: StatusEvent[];
}

export interface AuditEntry {
  id: string;
  at: string;
  by: string;
  entity: 'ORDER' | 'TRIP' | 'PLAN' | 'GRN' | 'RETURN' | 'COLLECTION' | 'OTP' | 'STORE' | 'SETTINGS' | 'SESSION';
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
  grns: Grn[];
  returns: ReturnRecord[];
  collections: Collection[];
  /** Delivery Partner App events already applied (idempotency). */
  dpEventIds: string[];
  audit: AuditEntry[];
}

export const RETURN_REASONS = ['Damaged in transit', 'Expired / near expiry', 'Wrong item', 'Quality issue', 'Excess quantity', 'Retailer refused', 'Other'] as const;
export const SETTLEMENT_PARTIES = ['Sellers', 'Logistics', 'Buyer (BNP)', 'Qwipo (SNP)', 'ONDC'] as const;
