// Port of the original LogisticsOrdersService a.k.a. "TripService" (chunk-6X7BRT24): every logistics-orders
// HTTP call + the trip / products response mapping (spec 04 §6, §8 and spec 05 §4.1–4.4, §7).
//
// Error semantics are kept exactly as in the original:
//   - get_by_filters → mapped `{data, pagination, stats}` or `null` (any error / !success / mapping error)
//   - provider-names → `data` or `[]`
//   - cancel / track → raw response or `null`
//   - downloads → swallow every error (console only); content-type must match exactly
//   - available-* → `data` or `{xxx: [], totalCount: 0}`
//   - assign-* → re-throw
//   - bulk hop-path / route-details → never throw (defaults per id)
//
// ID swap (spec 05 §0.3): API `logisticsOrderId` (uuid) → row `id`; API `orderId` (trip number) → row `logisticsOrderId`.
import { getConfig } from '../config';
import { http, saveBlob } from '../http';
import { formatToIndianDateTime, groupBy, toCasesAndPieces } from '../../utils/helpers';

const base = () => getConfig().buyerUrl;

const PDF = 'application/pdf';
const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

// ---------------------------------------------------------------- types
export interface ApiFulfillment {
  id: string;
  fulfillmentId?: string;
  deliveryType: string;
  sequenceOrder: number;
  status: string;
  displayStatus: string | null;
  stateTimestamp: string | null;
  pickupOtp: string | null;
  deliveryOtp: string | null;
  rtoOtp: string | null;
  deliveryContact: { name?: string | null; phone?: string } | null;
  deliveryLocation: {
    gps?: string;
    address?: { name?: string; building?: string; locality?: string; city?: string; state?: string; country?: string; areaCode?: string; pincode?: string };
    contact?: { name?: string; phone?: string };
  } | null;
  pickupCompletionTime?: string | null;
}

export interface ApiTrip {
  logisticsOrderId: string;
  orderId: string;
  providerId: string;
  providerName: string;
  categoryId: string;
  transactionId: string;
  status: number | string | null;
  totalStopCount: string | number | null;
  maxStopCount: string | number | null;
  startTime: string | null;
  pickupSlotStart: string | null;
  pickupSlotEnd?: string;
  endTime: string | null;
  createdAt: string | null;
  deliveryPrice: string | null;
  rtoPrice?: string;
  deliveryTatDuration?: string;
  vehicleRegNumber: string | null;
  vehicleType?: string;
  vehicleInfo: any;
  agentId: string | null;
  agentName: string | null;
  agentMobileNumber: string | null;
  helperName: string | null;
  helperMobileNumber: string | null;
  estimatedTimeToDelivery: string | null;
  totalDistance: string | number | null;
  volumetricWeight: string | number | null;
  vehicleVolumetricCapacityKg: string | number | null;
  suggestedVehicleRegNumber: string | null;
  suggestedVehicleCapacityKg: string | number | null;
  totalOrderValue: number | string | null;
  totalSaleValue: number | string | null;
  totalDeliveryValue: number | string | null;
  totalPartialValue: number | string | null;
  totalReturnValue: number | string | null;
  orderSummary?: { delivered: number; partialDelivered: number; returned: number };
  fulfillments: ApiFulfillment[];
  /** CDS service center trips: "cds" = Consolidated Delivery, "cds-returns" = Consolidated Returns; null = 3PL. */
  channel?: TripChannel | null;
}

/** Trips page tabs: "cds" = Consolidated Delivery, "cds-returns" = Consolidated Returns (Direct Delivery = none). */
export type TripChannel = 'cds' | 'cds-returns';

export interface TripLocation {
  name: string;
  address: string;
  time: string;
  status: string;
  otp: string;
  fulfillmentId: string;
}

export interface TripRow {
  id: string;
  logisticsOrderId: string;
  providerId: string;
  providerName: string;
  categoryId: string;
  transactionId: string;
  logisticsOrderStatus: string;
  dropPoints: string;
  arrivalTime: string;
  startTime: string;
  endTime: string;
  createdDate: string;
  logisticsOrderCharges: string;
  tripCharges: number;
  vehicle: string;
  vehicleInfo: any;
  agentId: string;
  driver: string;
  helper: string;
  driverContactNumber: string;
  estimatedCompletion: string;
  returnCompleted: string;
  returnOTP: string;
  pickupOTP: string;
  deliveryProgress: { locations: TripLocation[] };
  showCancelBtn: boolean;
  summary: { netSaleCollection: number; netSale: number; totalValue: number; credit: number; returnSaleValue: number; digitalCollection: number; codCollection: number };
  showAllLocations: boolean;
  fulfillments: ApiFulfillment[];
  totalSaleValue: number;
  totalReturnValue: number;
  totalPartialValue: number;
  totalDeliveryValue: number;
  totalDistance: number;
  volumetricWeight: number;
  maxStopCount: number;
  vehicleVolumetricCapacityKg: number;
  suggestedVehicleRegNumber: string;
  suggestedVehicleCapacityKg: string | number;
  orderSummary?: { delivered: number; partialDelivered: number; returned: number };
  /** CDS service center trips: "cds" = Consolidated Delivery, "cds-returns" = Consolidated Returns; null = 3PL. */
  channel: TripChannel | null;
}

export interface TripStats {
  totalLogisticOrders: number;
  inTransit: number;
  delivered: number;
  planned: number;
}
export interface TripPagination {
  totalCount: number;
  pageSize: number;
  pageNumber: number;
  totalPages: number;
}

export interface TripListFilters {
  buyerId: string;
  logisticsOrderId: string;
  pickupDate: string;
  statuses?: number[];
  providerNames?: string[];
  pageSize: number;
  pageNumber: number;
}

export interface Hop {
  stopNumber: number | string;
  pointLat: number | string;
  pointLng: number | string;
  pointName: string;
  invoicevalue: number | string;
  weight?: number;
  isDigitalOnly: boolean;
  status: string;
  deliveredAt: string | null;
  liveStopNumber: number | string | null;
  liveLat: number | string | null;
  liveLng: number | string | null;
}
export interface TrackingInfo {
  planned: Hop[];
  delivered: Hop[];
}

export interface RouteBeat {
  name: string;
  inRoute: number;
  total: number;
  coherencePct: number;
}
export interface RouteDetails {
  customerCount: number | null;
  distanceKm: number | null;
  totalAmount: number | null;
  estimatedTimeFormatted: string | null;
  registrationNumber: string | null;
  totalWeightKg: number | null;
  totalVolWeightKg: number | null;
  vehicleCapacityKg: number | null;
  vehicleUtilized: number | null;
  routeDirection: string | null;
  routeExplanation: string | null;
  beatCoherenceScore: number | null;
  beatCoherenceReason: string | null;
  beats: RouteBeat[];
}

export interface CustomerOrderRow {
  stopNo: number;
  customerName: string;
  address: string;
  otp: string;
  status: string;
  rawStatus: string;
  deliveryTime: string;
  orderCount: number;
  amount: number;
  orderIds: string[];
  orderLogisticsMap: { orderId: string; logisticsOrders: { logisticsOrderId: string; createdAt: string }[] }[];
  buyerOrderStatus: string | number | null;
  rtoReasonId: number | null;
  returnReason: string | null;
  customerMobileNumber: string;
  /** CDS trips only: the CDS point where the service center drops this retailer's goods. */
  cdsPoint: CdsPointInfo | null;
}

export interface CdsPointInfo {
  id: string;
  name: string;
  address: string;
}

export interface ProductOrderRow {
  itemId: string;
  productName: string;
  uom: string;
  upc: string | number;
  cs: number;
  pieces: number;
  mrp: number;
  sellingPrice: number;
  gstPercentage: number | null;
  cessPercentage: number | null;
  delivered: number;
  pending: number;
  totalQty: number;
  amount: number;
  totalAmount: number;
}

export interface ReturnProductRow {
  returnedItemName: string;
  returnedWeightUnit: string;
  upc: string | number;
  cases: number;
  pieces: number;
  mrp: number | string;
  orderedQuantity: number | string;
  returnedQuantity: number | string;
  returnedTotalAmount: number | string;
}

export interface TripProductsResult {
  customerOrders: CustomerOrderRow[];
  productOrders: ProductOrderRow[];
  returnProducts: ReturnProductRow[];
  nonGroupedReturnProducts: any[];
  allOrderItems: any[];
}

export interface AvailablePerson {
  id: string;
  name: string;
  phone: string;
}
export interface AvailableVehicle {
  id: string;
  registrationNumber: string;
  name: string;
  volumetricCapacityKg: string;
  weightCapacityKg: string;
  [k: string]: any;
}

// ---------------------------------------------------------------- mapping helpers
/** Trip status number → label. Unknown / null → "Planned" (spec 04 §5). */
export function mapStatusString(status: unknown): string {
  switch (Number(status)) {
    case 1: return 'Planned';
    case 2: return 'In Progress';
    case 3: return 'Completed';
    case 4: return 'Cancelled';
    case 5: return 'Delayed';
    default: return 'Planned';
  }
}

const CANCELLABLE_BATCH = ['Pending', 'Searching-for-Agent', 'Agent-assigned', 'At-pickup'];

/** Cancel allowed only for Planned / In Progress trips whose pickup (Batch) has not been collected yet. */
export function isCancellable(trip: Pick<ApiTrip, 'status' | 'fulfillments'>): boolean {
  const s = Number(trip.status);
  if (s !== 1 && s !== 2) return false;
  const batch = (trip.fulfillments || []).find((f) => f.deliveryType === 'Batch');
  if (!batch) return true;
  return !batch.status || CANCELLABLE_BATCH.includes(batch.status);
}

export function formatFulfillmentAddress(a?: { building?: string; locality?: string; city?: string; state?: string; areaCode?: string } | null): string {
  if (!a) return 'N/A';
  return [a.building, a.locality, a.city, a.state, a.areaCode].filter(Boolean).join(', ') || 'N/A';
}

/** Port of TripService.mapApiResponse — note the deliberate id-name swap. */
export function mapApiResponse(t: ApiTrip): TripRow {
  // `fulfillments` is required: null makes `.find` throw and the whole list fails (as-built).
  const firstDelivery = t.fulfillments.find((f) => f.deliveryType === 'Delivery');
  const locations: TripLocation[] = t.fulfillments.map((f) => {
    const addr = f.deliveryLocation?.address;
    const otp = f.sequenceOrder == 0 ? f.pickupOtp || firstDelivery?.pickupOtp : f.deliveryType === 'Delivery' ? f.deliveryOtp : f.rtoOtp;
    return {
      name: addr?.name || f.deliveryContact?.name || 'N/A',
      address: formatFulfillmentAddress(addr),
      time: formatToIndianDateTime(f.stateTimestamp || ''),
      status: f.displayStatus || 'N/A',
      otp: otp || 'N/A',
      fulfillmentId: f.id,
    };
  });
  const totalOrderValue = Number(t.totalOrderValue) || 0;
  return {
    id: t.logisticsOrderId || 'N/A',
    logisticsOrderId: t.orderId || 'N/A',
    providerId: t.providerId || 'N/A',
    providerName: t.providerName || 'N/A',
    categoryId: t.categoryId || 'N/A',
    transactionId: t.transactionId || 'N/A',
    logisticsOrderStatus: mapStatusString(t.status),
    dropPoints: t.totalStopCount?.toString() || 'N/A',
    // The literal "N/A" fallback is truthy → "NaN-NaN-NaN 12:NaN AM" (as-built, spec 04 §9).
    arrivalTime: formatToIndianDateTime(t.startTime || t.pickupSlotStart || 'N/A'),
    startTime: formatToIndianDateTime(t.startTime || t.pickupSlotStart || 'N/A'),
    endTime: formatToIndianDateTime(t.endTime || 'N/A'),
    createdDate: formatToIndianDateTime(t.createdAt || 'N/A'),
    logisticsOrderCharges: t.deliveryPrice || 'N/A',
    tripCharges: parseFloat(String(t.deliveryPrice)) || 0,
    vehicle: t.vehicleRegNumber || 'N/A',
    vehicleInfo: t.vehicleInfo || '',
    agentId: t.agentId || '',
    driver: t.agentName || 'N/A',
    helper: t.helperName || 'N/A',
    driverContactNumber: t.agentMobileNumber || 'N/A',
    estimatedCompletion: t.estimatedTimeToDelivery ? `${t.estimatedTimeToDelivery}` : 'N/A',
    returnCompleted: 'N/A',
    returnOTP: firstDelivery?.rtoOtp || 'N/A',
    pickupOTP: firstDelivery?.pickupOtp || 'N/A',
    deliveryProgress: { locations },
    showCancelBtn: isCancellable(t),
    summary: { netSaleCollection: totalOrderValue, netSale: totalOrderValue, totalValue: totalOrderValue, credit: 0, returnSaleValue: 0, digitalCollection: 0, codCollection: 0 },
    showAllLocations: false,
    fulfillments: t.fulfillments,
    totalSaleValue: +(t.totalSaleValue as any) || 0,
    totalReturnValue: +(t.totalReturnValue as any) || 0,
    totalPartialValue: +(t.totalPartialValue as any) || 0,
    totalDeliveryValue: +(t.totalDeliveryValue as any) || 0,
    totalDistance: +(t.totalDistance as any) || 0,
    volumetricWeight: +(t.volumetricWeight as any) || 0,
    maxStopCount: +(t.maxStopCount as any) || 0,
    vehicleVolumetricCapacityKg: +((t.vehicleVolumetricCapacityKg ?? t.suggestedVehicleCapacityKg ?? 0) as any),
    suggestedVehicleRegNumber: t.suggestedVehicleRegNumber || '',
    suggestedVehicleCapacityKg: t.suggestedVehicleCapacityKg || 0,
    orderSummary: t.orderSummary,
    channel: t.channel ?? null,
  };
}

/** Filename from a Content-Disposition header (regex `filename*?=['"]?(UTF-x'')?<name>`), first match trimmed. */
export function fileNameFromDisposition(disposition: string | null | undefined): string | null {
  if (!disposition) return null;
  const m = disposition.match(/filename\*?=['"]?(?:UTF-\d['"]*)?([^;\r\n"']*)['"]?;?/i);
  return m && m[1] ? m[1].trim() : null;
}

const dispositionOf = (blob: any): string | null => (blob && typeof blob.contentDisposition === 'string' ? blob.contentDisposition : null);

/**
 * Shared download mechanics of the original service: blob response, exact content-type check, filename from
 * Content-Disposition else fallback, temporary <a download>. Errors are swallowed (console only).
 */
async function downloadBlob(request: () => Promise<Blob>, expectedType: string, fallbackName: string) {
  try {
    const blob = await request();
    if (!blob || blob.type !== expectedType) {
      console.error('Invalid response: expected', expectedType, 'got', blob?.type);
      return;
    }
    const name = fileNameFromDisposition(dispositionOf(blob)) || fallbackName;
    saveBlob(new Blob([blob], { type: expectedType }), name);
  } catch (e) {
    console.error('Error downloading file:', e);
  }
}

function emptyProducts(): TripProductsResult {
  return { customerOrders: [], productOrders: [], returnProducts: [], nonGroupedReturnProducts: [], allOrderItems: [] };
}

// ---------------------------------------------------------------- service
export const logisticsOrdersService = {
  mapApiResponse,

  /** POST /logistics-orders/get_by_filters → `{data, pagination, stats}` or `null`. */
  async getLogisticOrdersDetails(filters: TripListFilters | Record<string, any>): Promise<{ data: TripRow[]; pagination?: TripPagination; stats?: TripStats } | null> {
    try {
      const res = await http.post<any>(`${base()}/logistics-orders/get_by_filters`, filters);
      if (res?.success && res.data) {
        const data = (res.data.orders as ApiTrip[]).map((o) => mapApiResponse(o));
        return { data, pagination: res.data.pagination, stats: res.data.stats };
      }
      return null;
    } catch (e) {
      console.error('Error fetching logistics orders:', e);
      return null;
    }
  },

  /** GET /logistics-orders/provider-names/{buyerId} → `data` or `[]`. A `channel` lists the providers of that tab. */
  async getProviderNames(buyerId: string, channel?: TripChannel): Promise<string[]> {
    try {
      const res = await http.get<any>(`${base()}/logistics-orders/provider-names/${buyerId}`, channel ? { params: { channel } } : undefined);
      return res?.success && res.data ? res.data : [];
    } catch (e) {
      console.error('Error fetching provider names:', e);
      return [];
    }
  },

  /** POST /fulfillment/req_for_cancel → raw response; HTTP error → `null`. */
  async cancelTrip(body: { transactionId: string; orderId: string; reason: number }): Promise<any> {
    try {
      return await http.post<any>(`${base()}/fulfillment/req_for_cancel`, body);
    } catch (e) {
      console.error('Error cancelling trip:', e);
      return null;
    }
  },

  /** POST /fulfillment/req_for_track → raw response or `null` (unused by the UI). */
  async requestTrackingInfo(transactionId: string, orderId: string): Promise<any> {
    try {
      return await http.post<any>(`${base()}/fulfillment/req_for_track`, { transactionId, orderId });
    } catch (e) {
      console.error('Error requesting tracking info:', e);
      return null;
    }
  },

  /** GET {sse}?clientId=&entityType=&entityId= (plain GET, unused). Error → `null`. */
  async getSSEData(clientId: string, entityType: string, entityId: string): Promise<any> {
    try {
      return await http.get<any>(getConfig().sse, { params: { clientId, entityType, entityId } });
    } catch (e) {
      console.error('Error fetching SSE data:', e);
      return null;
    }
  },

  // ------------------------------------------------------------ downloads (errors swallowed)
  downloadPickupIndent(logisticsOrderId: string, isBeatwise = false) {
    return downloadBlob(
      () => http.post<Blob>(`${base()}/logistics-orders/download_indent_sheet`, { logisticsOrderId, isBeatwise }, { responseType: 'blob' }),
      PDF,
      isBeatwise ? `${logisticsOrderId}_Beatwise_Loading_Sheet.pdf` : `${logisticsOrderId}_Consolidated_Pickup_List.pdf`,
    );
  },
  /** Trip Details dormant variant: body without `isBeatwise`. */
  downloadPickupIndentLegacy(logisticsOrderId: string) {
    return downloadBlob(
      () => http.post<Blob>(`${base()}/logistics-orders/download_indent_sheet`, { logisticsOrderId }, { responseType: 'blob' }),
      PDF,
      `${logisticsOrderId}_Consolidated_Pickup_List.pdf`,
    );
  },
  downloadSplitPickupList(logisticsOrderId: string) {
    return downloadBlob(
      () => http.post<Blob>(`${base()}/logistics-orders/split_pickup_list`, { logisticsOrderId }, { responseType: 'blob' }),
      PDF,
      `${logisticsOrderId}_Pickup_List.pdf`,
    );
  },
  downloadConsolidatedLoadingSheet(logisticsOrderId: string) {
    return downloadBlob(
      () => http.post<Blob>(`${base()}/logistics-orders/consolidated_loading_sheet`, { logisticsOrderId }, { responseType: 'blob' }),
      PDF,
      `${logisticsOrderId}_Consolidated_Loading_Sheet.pdf`,
    );
  },
  /** Note: called with the UUID (row.id), not the trip number (as-built inconsistency). */
  downloadCustomerWisePickupIndent(logisticsOrderId: string) {
    return downloadBlob(
      () => http.post<Blob>(`${base()}/logistics-orders/customer_wise_indent_sheet`, { logisticsOrderId }, { responseType: 'blob' }),
      PDF,
      `${logisticsOrderId}_Customer_Wise_Pickup_List.pdf`,
    );
  },
  /** Trips → Consolidated Delivery. POST /logistics-orders/cds_wise_pickup_list (PDF): goods grouped by CDS. */
  downloadCdsWisePickupList(logisticsOrderId: string) {
    return downloadBlob(
      () => http.post<Blob>(`${base()}/logistics-orders/cds_wise_pickup_list`, { logisticsOrderId }, { responseType: 'blob' }),
      PDF,
      `${logisticsOrderId}_CDS_Wise_Pickup_List.pdf`,
    );
  },
  /** GET /logistics-orders/return_report/{uuid}; fallback `{tripNumber}_Return_Report.xlsx`. */
  downloadReturnReport(id: string, tripNumber?: string) {
    return downloadBlob(
      () => http.get<Blob>(`${base()}/logistics-orders/return_report/${id}`, { responseType: 'blob' }),
      XLSX_MIME,
      `${tripNumber}_Return_Report.xlsx`,
    );
  },
  /** Dark-store bulk download: only checks that a body exists (no content-type check), no feedback. */
  async downloadSellerPickupList(logisticsOrderIds: string[], format: 'excel' | 'pdf') {
    try {
      const blob = await http.post<Blob>(`${base()}/logistics-orders/seller_pickup_list`, { logisticsOrderIds, format }, { responseType: 'blob' });
      if (!blob) {
        console.error('Empty response for seller pickup list');
        return;
      }
      const type = format === 'excel' ? XLSX_MIME : PDF;
      const name = fileNameFromDisposition(dispositionOf(blob)) || (format === 'excel' ? 'Seller_Pickup_List.xlsx' : 'Seller_Pickup_List.pdf');
      saveBlob(new Blob([blob], { type }), name);
    } catch (e) {
      console.error('Error downloading seller pickup list:', e);
    }
  },
  async downloadSellerWiseOrders(logisticsOrderIds: string[]) {
    try {
      const blob = await http.post<Blob>(`${base()}/logistics-orders/seller_wise_orders`, { logisticsOrderIds }, { responseType: 'blob' });
      if (!blob) {
        console.error('Empty response for seller wise orders');
        return;
      }
      const name = fileNameFromDisposition(dispositionOf(blob)) || 'Seller_Wise_Orders.pdf';
      saveBlob(new Blob([blob], { type: PDF }), name);
    } catch (e) {
      console.error('Error downloading seller wise orders:', e);
    }
  },
  /** POST /logistics-orders/order_details_pdf: name from `filename=` split, ignored if it equals `order_details.pdf`. */
  async downloadOrderDetails(logisticsOrderId: string) {
    try {
      const blob = await http.post<Blob>(`${base()}/logistics-orders/order_details_pdf`, { logisticsOrderId }, { responseType: 'blob' });
      if (!blob || blob.type !== PDF) {
        console.error('Invalid response for order details pdf');
        return;
      }
      let name = `${logisticsOrderId}_order_details.pdf`;
      const disp = dispositionOf(blob);
      if (disp && disp.includes('filename=')) {
        const n = disp.split('filename=')[1].replace(/["']/g, '').trim();
        if (n && n !== 'order_details.pdf') name = n;
      }
      saveBlob(new Blob([blob], { type: PDF }), name);
    } catch (e) {
      console.error('Error downloading order details:', e);
    }
  },

  // ------------------------------------------------------------ maps
  /** POST /logistics-orders/hop-path-tracking/bulk → per trip number `{planned, delivered}`; never throws. */
  async getBulkPlannedTrackingInfo(logisticsOrderIds: string[]): Promise<Record<string, TrackingInfo>> {
    const out: Record<string, TrackingInfo> = {};
    logisticsOrderIds.forEach((id) => (out[id] = { planned: [], delivered: [] }));
    try {
      const res = await http.post<any>(`${base()}/logistics-orders/hop-path-tracking/bulk`, { logisticsOrderIds });
      const data = res?.success ? res.data || {} : {};
      logisticsOrderIds.forEach((id) => {
        const hops: Hop[] = data[id]?.hops || [];
        out[id] = { planned: hops, delivered: hops.filter((h) => h.status === 'Completed') };
      });
    } catch (e) {
      console.error('Error fetching bulk tracking info:', e);
    }
    return out;
  },

  /** POST /route_planning/trip-route-details/bulk → per trip number details or `null`; never throws. */
  async getBulkTripRouteDetails(logisticsOrderIds: string[]): Promise<Record<string, RouteDetails | null>> {
    const out: Record<string, RouteDetails | null> = {};
    logisticsOrderIds.forEach((id) => (out[id] = null));
    try {
      const res = await http.post<any>(`${base()}/route_planning/trip-route-details/bulk`, { logisticsOrderIds });
      if (res?.success && res.data) {
        logisticsOrderIds.forEach((id) => (out[id] = res.data[id] ?? null));
      }
    } catch (e) {
      console.error('Error fetching bulk trip route details:', e);
    }
    return out;
  },

  // ------------------------------------------------------------ trip details: products
  /** GET /logistics-orders/products/{uuid} → customer / product / return rows (spec 05 §4.2, §7). */
  async getLogisticOrdersProducts(id: string): Promise<TripProductsResult> {
    try {
      const res = await http.get<any>(`${base()}/logistics-orders/products/${id}`);
      if (!res || res.success === false) {
        console.error('Failed to fetch logistic order products:', res);
        return emptyProducts();
      }
      const summary = res.data?.logisticOrderSummary;
      if (!Array.isArray(summary) || summary.length === 0) {
        console.error('Invalid or empty logisticOrderSummary:', summary);
        return emptyProducts();
      }
      const customerOrders: CustomerOrderRow[] = [];
      const allOrderItems: any[] = [];
      summary.forEach((entry: any) => {
        const cd = entry?.customerDetails;
        if (!cd) {
          console.warn('Skipping logisticOrderSummary entry without customerDetails:', entry);
          return;
        }
        const orderIds: string[] = cd.totalOrderIds || [];
        const otp = cd.deliveryType === 'Delivery' ? cd.deliveryOtp : cd.rtoOtp;
        customerOrders.push({
          stopNo: cd.sequenceOrder || 0,
          customerName: cd.deliveryLocation?.address?.name || 'N/A',
          address: formatFulfillmentAddress(cd.deliveryLocation?.address),
          otp: otp || 'N/A',
          status: cd.displayStatus || 'N/A',
          rawStatus: cd.status,
          deliveryTime: cd.status === 'Order-delivered' || cd.status === 'RTO' ? formatToIndianDateTime(cd.stateTimestamp) : 'N/A',
          orderCount: orderIds.length || cd.totalOrderCount || 0,
          amount: cd.totalOrderAmount || 0,
          orderIds,
          orderLogisticsMap: cd.orderLogisticsMap || [],
          buyerOrderStatus: cd.buyerOrderStatus ?? null,
          rtoReasonId: cd.rtoReasonId ?? null,
          returnReason: cd.returnReason ?? null,
          customerMobileNumber: cd.customerMobileNumber || '',
          cdsPoint: cd.cdsPoint ?? null,
        });
        (entry.items || []).forEach((it: any) => allOrderItems.push({ ...it, stopStatus: cd.status }));
      });
      customerOrders.sort((a, b) => a.stopNo - b.stopNo);

      // Ordered products: group every stop's items by itemName (first item wins for uom/upc/mrp…).
      const productOrders: ProductOrderRow[] = groupBy(allOrderItems, 'itemName' as any).map((g: any[]) => {
        const first = g[0];
        const totalQty = g.reduce((s, it) => s + (Number(it.quantity) || 0), 0);
        const amount = g.reduce((s, it) => s + (Number(it.totalAmount) || 0), 0);
        const { pieces, cases } = toCasesAndPieces(first.upc, totalQty);
        const delivered = g.filter((it) => it.stopStatus === 'Order-delivered').reduce((s, it) => s + (Number(it.quantity) || 0), 0);
        const pending = g.filter((it) => it.stopStatus !== 'Order-delivered' && it.stopStatus !== 'Cancelled').reduce((s, it) => s + (Number(it.quantity) || 0), 0);
        return {
          itemId: first.itemId,
          productName: first.itemName || 'N/A',
          uom: first.weightUnit || 'N/A',
          upc: first.upc || 'N/A',
          cs: cases ?? 0,
          pieces,
          mrp: first.mrp || 0,
          sellingPrice: first.sellingPrice || 0,
          gstPercentage: first.gstPercentage ?? null,
          cessPercentage: first.cessPercentage ?? null,
          delivered,
          pending,
          totalQty,
          amount: amount || 0,
          totalAmount: amount || 0,
        };
      });

      // Return products grouped by returnedItemName; sums of 0 become "N/A" (as-built).
      const nonGrouped: any[] = Array.isArray(res.data.returnProducts) ? res.data.returnProducts : [];
      const returnProducts: ReturnProductRow[] = groupBy(nonGrouped, 'returnedItemName' as any).map((g: any[]) => {
        const first = g[0];
        const returnedQuantity = g.reduce((s, it) => s + (+it.returnedQuantity || 0), 0);
        const returnedTotalAmount = g.reduce((s, it) => s + (+it.returnedTotalAmount || 0), 0);
        const orderedQuantity = g.reduce((s, it) => s + (+it.orderedQuantity || 0), 0);
        const { pieces, cases } = toCasesAndPieces(first.upc, orderedQuantity);
        return {
          returnedItemName: first.returnedItemName,
          returnedWeightUnit: first.orderedWeightUnit,
          upc: first.upc,
          cases,
          pieces,
          mrp: first.mrp,
          orderedQuantity: orderedQuantity || 'N/A',
          returnedQuantity: returnedQuantity || 'N/A',
          returnedTotalAmount: returnedTotalAmount || 'N/A',
        };
      });
      return { customerOrders, productOrders, returnProducts, nonGroupedReturnProducts: nonGrouped, allOrderItems };
    } catch (e) {
      console.error('Error fetching logistic order products:', e);
      return emptyProducts();
    }
  },

  // ------------------------------------------------------------ resources
  async getAvailableDrivers(logisticsOrderId: string, pageSize = 1000): Promise<{ drivers: AvailablePerson[]; totalCount: number }> {
    try {
      const res = await http.get<any>(`${base()}/logistics-orders/available-drivers`, { params: { logisticsOrderId, pageSize: String(pageSize), pageNumber: '1' } });
      return res?.data || { drivers: [], totalCount: 0 };
    } catch (e) {
      console.error('Error fetching available drivers:', e);
      return { drivers: [], totalCount: 0 };
    }
  },
  async getAvailableHelpers(logisticsOrderId: string, pageSize = 1000): Promise<{ helpers: AvailablePerson[]; totalCount: number }> {
    try {
      const res = await http.get<any>(`${base()}/logistics-orders/available-helpers`, { params: { logisticsOrderId, pageSize: String(pageSize), pageNumber: '1' } });
      return res?.data || { helpers: [], totalCount: 0 };
    } catch (e) {
      console.error('Error fetching available helpers:', e);
      return { helpers: [], totalCount: 0 };
    }
  },
  async getAvailableVehicles(logisticsOrderId: string, pageSize = 1000): Promise<{ vehicles: AvailableVehicle[]; totalCount: number }> {
    try {
      const res = await http.get<any>(`${base()}/logistics-orders/available-vehicles`, { params: { logisticsOrderId, pageSize: String(pageSize), pageNumber: '1' } });
      return res?.data || { vehicles: [], totalCount: 0 };
    } catch (e) {
      console.error('Error fetching available vehicles:', e);
      return { vehicles: [], totalCount: 0 };
    }
  },
  /** PUT assign-* — errors are re-thrown to the caller (dialogs). */
  assignDriver(body: { logisticsOrderId: string; agentId: string; agentName: string; agentMobileNumber: string }) {
    return http.put<any>(`${base()}/logistics-orders/assign-driver`, body);
  },
  assignHelper(body: { logisticsOrderId: string; helperId: string; helperName: string; helperMobileNumber: string }) {
    return http.put<any>(`${base()}/logistics-orders/assign-helper`, body);
  },
  assignVehicle(body: { logisticsOrderId: string; vehicleId: string; vehicleRegNumber: string; vehicleVolumetricCapacityKg: string | number }) {
    return http.put<any>(`${base()}/logistics-orders/assign-vehicle`, body);
  },
  assignResource(body: {
    logisticsOrderId: string; vehicleId: string; agentId: string; vehicleRegNumber: string;
    vehicleVolumetricCapacityKg: string | number; agentName: string; agentMobileNumber: string;
  }) {
    return http.put<any>(`${base()}/logistics-orders/assign-resource`, body);
  },
};

export default logisticsOrdersService;
