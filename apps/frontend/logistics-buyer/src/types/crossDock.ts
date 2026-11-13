// Cross-dock domain shared by the mock backend (src/mock/routes/crossDock.ts) and the app
// (src/api/services/crossDock.service.ts). Shapes are a prototype contract, not a production API.
//
// Flow (10 Nov 2026 cross-dock meetings): a distributor accepts an order in the Seller Store → if the retailer is inside
// a live Cross Dock Store (CDS) area the order comes to the Service Centre, otherwise it goes back to the distributor
// for direct delivery → the Service Centre picks it up and drops it at the CDS → the CDS receives, sorts per retailer
// and delivers by bike. Returns go the other way: CDS → Service Centre return trip → distributor.

/** Order statuses along the cross-dock route. Status names are indicative until the user stories fix them. */
export type XdOrderStatus =
  | 'ACCEPTED' // accepted by the distributor, waiting for a pickup trip
  | 'PICKUP_PLANNED'
  | 'PICKED_UP'
  | 'DROPPED_AT_CDS'
  // Cross Dock Store statuses (phase 3)
  | 'RECEIVED_AT_CDS'
  | 'READY_TO_DISPATCH'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'RETURNED'
  /** Retailer is outside every live CDS area: sent back to the distributor's own LBNP for direct delivery. */
  | 'DIRECT_DELIVERY';

export type PickupRound = 'R1' | 'R2' | 'EARLY_AM';
export type DeliveryMode = 'CROSS_DOCK' | 'DIRECT' | 'SELF';

export interface XdDistributor {
  id: string;
  code: string;
  name: string;
  contactName: string;
  phone: string;
  locality: string;
  address: string;
  lat: number;
  lng: number;
  /** How far the distributor sells (its commerce polygon, simplified to a radius). */
  coverageKm: number;
  /** Cross-dock and/or direct. SELF only for HUL and ITC distributors. */
  deliveryModes: DeliveryMode[];
  brand?: string;
}

export type CdsStatus = 'LIVE' | 'ONBOARDING';

export interface XdCds {
  id: string;
  code: string;
  name: string;
  operatorName: string;
  phone: string;
  locality: string;
  address: string;
  lat: number;
  lng: number;
  radiusKm: number;
  /** Delivery area. A retailer inside a LIVE CDS's polygon gets cross-dock delivery. */
  polygon: [number, number][];
  status: CdsStatus;
  riders: number;
}

export interface XdRetailer {
  id: string;
  name: string;
  ownerName: string;
  phone: string;
  locality: string;
  lat: number;
  lng: number;
  /** The live CDS whose area the retailer is in; null → direct delivery. */
  cdsId: string | null;
  /** Inside an area whose CDS is still onboarding (direct for now). */
  onboardingCdsId: string | null;
}

export interface XdStatusEvent {
  status: string;
  at: string;
  by: string;
}

/** One product line on an order (catalogue: src/mock/seed.ts PRODUCTS). Quantities are in pieces. */
export interface XdOrderItem {
  sku: string;
  name: string;
  category: string;
  uom: string;
  /** Pieces per case (UPC). */
  caseSize: number;
  mrp: number;
  price: number;
  qty: number;
  unitWeightKg: number;
}

export interface XdOrder {
  id: string;
  orderNo: string;
  invoiceNo: string;
  items: XdOrderItem[];
  /** Route plan the order is in (planned, trip not generated yet). */
  planId?: string | null;
  distributorId: string;
  retailerId: string;
  cdsId: string | null;
  placedAt: string;
  acceptedAt: string;
  /** YYYY-MM-DD: next day for cross-dock. */
  deliveryDate: string;
  lines: number;
  quantity: number;
  weightKg: number;
  value: number;
  status: XdOrderStatus;
  round: PickupRound | null;
  pickupTripId: string | null;
  history: XdStatusEvent[];
  // ---- Cross Dock Store (phase 3)
  receivedAt?: string | null;
  /** Recorded at receiving (GRN). Short and damaged items are not collected for. */
  discrepancy?: XdDiscrepancy | null;
  runId?: string | null;
  deliveredAt?: string | null;
  /** What the rider collected for this order. */
  payment?: { cash: number; upi: number } | null;
  returnReason?: string | null;
}

export type DiscrepancyType = 'SHORT' | 'DAMAGED' | 'EXCESS';

export interface XdDiscrepancy {
  type: DiscrepancyType;
  items: number;
  /** Value of those items (not collected from the retailer for SHORT / DAMAGED). */
  value: number;
  note: string;
}

/** What the retailer pays on delivery: invoice value less short or damaged items. */
export function amountDue(o: Pick<XdOrder, 'value' | 'discrepancy'>): number {
  const d = o.discrepancy;
  return d && d.type !== 'EXCESS' ? Math.max(0, o.value - d.value) : o.value;
}

export interface XdRider {
  id: string;
  cdsId: string;
  name: string;
  phone: string;
  vehicleRegNo: string;
  active: boolean;
}

export type RunStatus = 'PLANNED' | 'OUT' | 'COMPLETED' | 'CANCELLED';

/** One retailer on a rider's run: every order for that retailer, from every seller. */
export interface XdRunStop {
  seq: number;
  retailerId: string;
  orderIds: string[];
  status: 'PENDING' | 'DONE';
  doneAt: string | null;
  cash: number;
  upi: number;
  returnedOrderIds: string[];
  /** The retailer's delivery OTP, collected by the rider. */
  otp: string;
}

// ------------------------------------------------------------------ route plans (Delivery Planning pattern)

export type PlanKind = 'PICKUP' | 'RETURN' | 'DELIVERY';
export type PlanStatus = 'CREATED' | 'TRIP_CREATED' | 'CANCELLED';

/** A planned route waiting for "Generate Trip" (pickup / return: Service Centre vehicle; delivery: store rider). */
export interface XdRoutePlan {
  id: string;
  routeId: string;
  kind: PlanKind;
  /** Delivery plans belong to one store. */
  cdsId: string | null;
  slot: TripSlot | 'DELIVERY';
  date: string;
  vehicleId: string | null;
  riderId: string | null;
  orderIds: string[];
  returnIds: string[];
  weightKg: number;
  distanceKm: number;
  createdAt: string;
  status: PlanStatus;
  /** The trip or run generated from it. */
  tripId: string | null;
}

export interface XdPlanStopView {
  seq: number;
  action: 'PICKUP' | 'DROP';
  name: string;
  locality: string;
  orders: number;
  weightKg: number;
  value: number;
}

export interface XdProductLine {
  sku: string;
  name: string;
  uom: string;
  caseSize: number;
  mrp: number;
  qty: number;
  amount: number;
}

export interface XdCustomerLine {
  retailerId: string;
  retailerName: string;
  locality: string;
  orders: number;
  distributors: string[];
  amount: number;
  weightKg: number;
}

export interface XdRoutePlanRow extends XdRoutePlan {
  vehicleRegNo: string | null;
  capacityKg: number | null;
  driverName: string | null;
  riderName: string | null;
  pickupPoints: number;
  dropPoints: number;
  orderCount: number;
  returnCount: number;
  value: number;
  tripNo: string | null;
  stops: XdPlanStopView[];
  products: XdProductLine[];
  customers: XdCustomerLine[];
}

/** A Service Centre truck's drop at a Cross Dock Store, as the store sees it (Inward / GRN). */
export type InboundState = 'SCHEDULED' | 'ON_THE_WAY' | 'AT_STORE' | 'GRN_DONE' | 'RECEIVED';

export interface XdInboundTruck {
  tripId: string;
  tripNo: string;
  seq: number;
  state: InboundState;
  date: string;
  slot: TripSlot;
  vehicleRegNo: string;
  vehicleModel: string;
  driverName: string;
  driverPhone: string;
  distributors: string[];
  orderCount: number;
  retailerCount: number;
  units: number;
  weightKg: number;
  value: number;
  pickupsDone: number;
  pickups: number;
  /** The distributors the truck collects from before reaching the store. */
  pickupStops: { name: string; locality: string; address: string; done: boolean; doneAt: string | null }[];
  startedAt: string | null;
  /** Shown to the store once its GRN is confirmed; the store gives it to the driver. */
  otp: string | null;
  grn: XdGrn | null;
  receivedAt: string | null;
}

export interface XdGrnView {
  truck: XdInboundTruck;
  lines: XdGrnLine[];
  customers: XdCustomerLine[];
  orders: XdOrderRow[];
}

export interface XdRun {
  id: string;
  runNo: string;
  cdsId: string;
  riderId: string;
  date: string;
  status: RunStatus;
  stops: XdRunStop[];
  distanceKm: number;
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
}

export type DepositMode = 'UPI' | 'BANK_TRANSFER' | 'CASH_DEPOSIT';

export interface XdDeposit {
  id: string;
  cdsId: string;
  /** Business day the money was collected on. */
  date: string;
  amount: number;
  mode: DepositMode;
  reference: string;
  at: string;
}

/** One day at a Cross Dock Store (for its Reports and Cash pages). */
export interface XdStoreDay {
  date: string;
  cdsId: string;
  received: number;
  delivered: number;
  returned: number;
  cash: number;
  upi: number;
  deposited: number;
}

export type XdReturnStatus = 'AT_CDS' | 'RETURN_PLANNED' | 'COLLECTED' | 'RETURNED_TO_DISTRIBUTOR';

export interface XdReturn {
  id: string;
  returnNo: string;
  orderNo: string;
  /** The order it came from, when that order is in the demo data. */
  orderId?: string;
  distributorId: string;
  cdsId: string;
  retailerId: string;
  items: number;
  weightKg: number;
  value: number;
  reason: string;
  /** When the rider handed it in at the CDS. */
  heldSince: string;
  status: XdReturnStatus;
  returnTripId: string | null;
  planId?: string | null;
  history: XdStatusEvent[];
}

export type VehicleType = 'THREE_WHEELER' | 'FOUR_WHEELER';

export interface XdVehicle {
  id: string;
  regNo: string;
  type: VehicleType;
  model: string;
  capacityKg: number;
  driverId: string;
  active: boolean;
}

export interface XdDriver {
  id: string;
  name: string;
  phone: string;
}

export type StopAction = 'PICKUP' | 'DROP';
export type PlaceType = 'DISTRIBUTOR' | 'CDS';

export interface XdStop {
  seq: number;
  action: StopAction;
  placeType: PlaceType;
  placeId: string;
  orderIds: string[];
  returnIds: string[];
  weightKg: number;
  status: 'PENDING' | 'DONE';
  doneAt: string | null;
  /**
   * Handover OTP. Pickup: the distributor gives it to the driver. Drop at a Cross Dock Store: the store gives it to the
   * driver only after its GRN matches; the driver entering it closes the drop.
   */
  otp: string;
  /** Goods received note at a Cross Dock Store drop. */
  grn?: XdGrn | null;
}

/** One product on a truck's drop, consolidated across every distributor and retailer on it. */
export interface XdGrnLine {
  sku: string;
  name: string;
  uom: string;
  caseSize: number;
  mrp: number;
  price: number;
  expected: number;
  received: number;
  damaged: number;
}

export interface XdGrn {
  status: 'CONFIRMED';
  lines: XdGrnLine[];
  note: string;
  confirmedAt: string;
  confirmedBy: string;
}

export type TripKind = 'PICKUP' | 'RETURN';
export type TripStatus = 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
/** Pickup trips run in a round; return trips run in the returns window. */
export type TripSlot = PickupRound | 'RETURNS';

export interface XdTrip {
  id: string;
  tripNo: string;
  kind: TripKind;
  slot: TripSlot;
  /** YYYY-MM-DD the trip runs. */
  date: string;
  vehicleId: string;
  driverId: string;
  status: TripStatus;
  stops: XdStop[];
  weightKg: number;
  distanceKm: number;
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
}

export interface TimeWindow {
  key: TripSlot;
  label: string;
  /** HH:mm, 24-hour. */
  start: string;
  end: string;
}

export interface XdSettings {
  serviceCentre: { name: string; contactName: string; phone: string; email: string; city: string; address: string };
  /** Retailers order until this time on day 0 (HH:mm). */
  orderCutoff: string;
  windows: TimeWindow[];
}

/** One day of Service Centre work, per CDS (for Reports). */
export interface XdDayCdsSummary {
  date: string;
  cdsId: string;
  ordersDropped: number;
  weightKg: number;
  /** Orders that reached the CDS before noon on delivery day. */
  onTimeOrders: number;
  returnsCollected: number;
  pickupTrips: number;
}

// ------------------------------------------------------------------ API views (joined for the screens)

export interface XdOrderRow extends XdOrder {
  distributorName: string;
  distributorLocality: string;
  retailerName: string;
  retailerLocality: string;
  cdsCode: string | null;
  cdsName: string | null;
  tripNo: string | null;
}

export interface XdReturnRow extends XdReturn {
  distributorName: string;
  retailerName: string;
  cdsCode: string;
  cdsName: string;
  tripNo: string | null;
}

export interface XdStopView extends XdStop {
  placeName: string;
  placeCode: string;
  locality: string;
  lat: number;
  lng: number;
}

export interface XdTripRow extends Omit<XdTrip, 'stops'> {
  stops: XdStopView[];
  vehicleRegNo: string;
  vehicleType: VehicleType;
  vehicleModel: string;
  capacityKg: number;
  driverName: string;
  driverPhone: string;
  orderCount: number;
  returnCount: number;
  stopsDone: number;
}

export interface XdRunStopView extends XdRunStop {
  retailerName: string;
  ownerName: string;
  retailerPhone: string;
  locality: string;
  lat: number;
  lng: number;
  orders: XdOrderRow[];
  amountDue: number;
}

export interface XdRunRow extends Omit<XdRun, 'stops'> {
  stops: XdRunStopView[];
  riderName: string;
  riderPhone: string;
  vehicleRegNo: string;
  orderCount: number;
  stopsDone: number;
  amountDue: number;
  collected: number;
}

export interface XdStoreOverview {
  /** Today: the store delivers orders whose delivery date is today. */
  operatingDate: string;
  store: XdCds;
  riders: XdRider[];
  retailers: XdRetailer[];
  distributors: XdDistributor[];
  settings: XdSettings;
}

export interface XdCashDay {
  date: string;
  delivered: number;
  expected: number;
  cash: number;
  upi: number;
  deposited: number;
  /** Collected and not yet deposited. */
  balance: number;
  byRider: { riderId: string; riderName: string; runs: number; delivered: number; cash: number; upi: number; open: number }[];
  deposits: XdDeposit[];
}

export interface XdOverview {
  operatingDate: string;
  deliveryDate: string;
  /** Where the Service Centre's vehicles start and end their trips. */
  yard: [number, number];
  distributors: XdDistributor[];
  cdss: XdCds[];
  retailers: XdRetailer[];
  vehicles: XdVehicle[];
  drivers: XdDriver[];
  settings: XdSettings;
}
