// Domain records stored in the mock database. They are kept close to the real API shapes
// (see docs/specs/live-api-shapes.md); mock route handlers map them to exact response bodies.

export interface DbBuyer {
  id: string;
  name: string;
  businessName: string;
  mobileNumber: string;
  email: string;
  gstNumber: string;
  panNumber: string;
  aadharNumber: string;
  status: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
  businessTypeId: string;
  /** "SELF_3PL" | "DARKSTORE" — DARKSTORE toggles dark-store behaviour on Trips. */
  buyerType: string;
}

export interface DbPermission {
  pageId: string;
  canView?: boolean;
  canCreate?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
  canImport?: boolean;
  canExport?: boolean;
}

export interface DbAddress {
  id: string;
  buyer_id: string;
  address_type: string;
  address_line1: string;
  address_line2: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
  latitude: string | null;
  longitude: string | null;
  is_default: boolean;
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by: string;
  city_code: string;
}

/** Customer master row (snake_case, as returned by /buyer-customer-master). */
export interface DbCustomer {
  id: string;
  customer_unique_id: string;
  buyer_id: string;
  mobile_number: string;
  business_name: string;
  customer_name: string;
  latitude: string;
  longitude: string;
  address: string;
  status: string;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  /** "connector" (system) or "manual". */
  updated_by: string;
  is_bulk_order: boolean;
  // extra domain fields (not part of the customer-master API response)
  locality: string;
  city: string;
  state: string;
  pincode: string;
  beatId: string;
}

export interface DbBeat {
  id: string;
  buyerId: string;
  name: string;
  area: string;
  clusterId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DbCluster {
  id: string;
  buyerId: string;
  name: string;
  beatIds: string[];
  vehicleIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface DbProduct {
  id: string;
  name: string;
  mrp: number;
  sellingPrice: number;
  /** Dead weight per unit in kg. */
  weightKg: number;
  /** Units per case ("UPC" in this app means units-per-case). */
  upc: number;
  gstPercentage: number;
  hsnCode: string;
  category: string;
  packageType: string;
  uom: string;
  imageUrl: string;
}

export interface DbVehicle {
  id: string;
  sellerId: string;
  vehicleTypeId: string;
  name: string;
  registrationNumber: string;
  make: string | null;
  model: string | null;
  manufacturingYear: number | null;
  weightCapacityKg: string;
  volumetricCapacityKg: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
  length: string;
  height: string;
  breadth: string;
  ownershipType: string;
  amount: string;
  isBulk: boolean;
  relationshipType: string;
  vehicleType: string;
}

export interface DbPerson {
  id: string;
  name: string;
  phone: string;
}

export interface DbProvider {
  id: string;
  name: string;
  /** Base charge per trip in ₹. */
  basePrice: number;
}

export interface DbOrderItem {
  itemId: string;
  productId: string;
  itemName: string;
  quantity: number;
  mrp: number;
  sellingPrice: number;
  totalAmount: number;
  weightKg: number;
  upc: number;
  gstPercentage: number;
  hsnCode: string;
  imageUrl: string;
  uom: string;
  packageType: string;
  /** Quantity actually delivered (set when the order is delivered / partially returned). */
  deliveredQuantity: number;
  /** Quantity returned (partial return / returned). */
  returnedQuantity: number;
}

export interface DbValidationError {
  group: 'customer_order' | 'product';
  fieldName: string;
  currentValue: string;
  isMandatory: boolean;
  errorMessage: string;
  itemId?: string;
  rowNumber?: number;
}

export interface DbOrder {
  orderId: string;
  refOrderId: string;
  buyerId: string;
  customerId: string;
  customerName: string;
  customerBusinessName: string;
  customerMobileNumber: string;
  address: { line: string; locality: string; city: string; state: string; country: string; pincode: string };
  lat: number;
  lng: number;
  amount: number;
  orderWeight: number;
  volumetricWeight: number;
  orderType: 'Digital' | 'Sales' | null;
  salesPersonName: string | null;
  salesBeatName: string | null;
  beatId: string | null;
  createdAt: string;
  /** "YYYY-MM-DD HH:mm:ss" (note: the API calls this `orderdate`). */
  orderDate: string;
  deliveryDate: string | null;
  orderStatusId: number;
  validationErrors: DbValidationError[];
  isDeliveryAddressUpdated: boolean;
  /** Current trip (logistics order uuid) or null. */
  tripId: string | null;
  /** All trips this order has been on, oldest first. */
  tripHistory: string[];
  items: DbOrderItem[];
  rtoReasonId: number | null;
  returnReason: string | null;
  /** Route-plan combo the order is planned in (status 2). */
  routePlanComboId: string | null;
  /** Previous status before "Mark as Offline" (used by Revert). */
  statusBeforeOffline: number | null;
  source: 'connector' | 'import' | 'quick';
}

export interface DbStop {
  id: string;
  fulfillmentId: string;
  deliveryType: 'Batch' | 'Delivery';
  sequenceOrder: number;
  customerId: string | null;
  orderIds: string[];
  status: string;
  displayStatus: string;
  stateTimestamp: string | null;
  pickupOtp: string | null;
  deliveryOtp: string | null;
  rtoOtp: string | null;
  gps: string;
  address: { name: string; building: string; locality: string; city: string; state: string; country: string; areaCode: string; pincode: string };
  contact: { name: string; phone: string; email?: string };
}

export interface DbTrip {
  logisticsOrderId: string;
  /** Trip number, e.g. "Q-20261031093015-KTRW" (the API calls this `orderId`). */
  orderId: string;
  buyerId: string;
  providerId: string;
  providerName: string;
  transactionId: string;
  categoryId: string;
  /** 1 Planned · 2 In Progress · 3 Completed · 4 Cancelled · 5 Delayed */
  status: number;
  createdAt: string;
  startTime: string | null;
  pickupSlotStart: string;
  pickupSlotEnd: string;
  deliveryTatDuration: string;
  endTime: string | null;
  deliveryPrice: string;
  rtoPrice: string;
  vehicleId: string | null;
  vehicleRegNumber: string | null;
  vehicleType: string;
  vehicleVolumetricCapacityKg: string;
  agentId: string | null;
  agentName: string | null;
  agentMobileNumber: string | null;
  helperId: string | null;
  helperName: string | null;
  helperMobileNumber: string | null;
  estimatedTimeToDelivery: string;
  totalDistance: string;
  maxStopCount: string;
  suggestedVehicleRegNumber: string;
  suggestedVehicleCapacityKg: string;
  stops: DbStop[];
  orderIds: string[];
  routePlanComboId: string | null;
  cancelReason: string | null;
  /** CDS flow trips, created by the CDS service center (Trips page tabs): "cds" = Consolidated Delivery (collects the
   *  distributor's goods for CDS orders), "cds-returns" = Consolidated Returns (brings retailers' returns back).
   *  Absent on 3PL trips (Direct Delivery tab). */
  channel?: 'cds' | 'cds-returns';
}

export interface DbSalesPerson {
  id: string;
  name: string;
}
