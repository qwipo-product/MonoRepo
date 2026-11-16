// Port of DeliveryRoutesService (chunk 5G255SWT) + the two OrdersService methods used by Delivery Planning
// (getDeliveryRootOrders → /orders/get_by_filters, getCustomerOrdersByOrderIds → /orders/customer-order-details).
// Error semantics follow spec 03 §9 exactly ("returns null", "rethrows", "throws on !success").
// The Order Details "Search Vehicles" flow has its own client (orderFulfillment.service.ts) on the same endpoints.
import { getConfig } from '../config';
import { http } from '../http';

const base = () => getConfig().buyerUrl;

// ---------------------------------------------------------------- types
export interface DeliveryPlanningRow {
  createdDate: string;
  routeId: string;
  logisticsOrderRowId: string | number | null;
  routePlanComboId: string;
  dropsPoints: number;
  sla: string;
  weightValue: number;
  volumetricWeightValue: number;
  routePlanComboExpireTime: string;
  routePlanRequestExpireTime: string;
  routePlanRequestStatus: string;
  routePlanComboStatus: string;
  relationshipType: string | null;
  routePlanRequestId: string;
  /** Always null from the service; computed client-side (spec 03 §3.6.1). */
  deliveryDate: string | null;
  provider?: any;
}

export interface DeliveryPlanningSearchResult {
  rows: DeliveryPlanningRow[];
  count: number;
  /** Server clock (ms) used for every countdown. */
  currentTime: number;
}

export interface PlannableOrder {
  orderNumber: string;
  refOrderNumber: string;
  customerName: string;
  customerBusinessName: string;
  totalWeight: number | string;
  volumetricWeight: number | string;
  orderDate: string;
  amount: number;
  salesPerson: string;
  beat: string;
  /** "cds" = Consolidated Delivery (Create Delivery Route leaves these out), "3pl" = 3PL Delivery, "self" = Direct
   *  (the distributor's own vehicles). */
  deliveryType: 'cds' | '3pl' | 'self';
  selected: boolean;
}

export interface AvailableProviderRaw {
  routeId: string;
  routeName: string;
  providerName: string;
  deliveryPrice: string | number;
  pickupTime: string;
  isEnabled: boolean;
  ondcSearchId: string;
  [k: string]: any;
}

const CURRENT_ROUTE_KEY = 'currentRoute';
const isoOrEmpty = (v: unknown) => (v ? new Date(v as string).toISOString() : '');

// ---------------------------------------------------------------- DeliveryRoutesService
export const deliveryRoutesService = {
  /** POST /delivery_planning/search → mapped rows + server time; null on `success:false` or any error. */
  async getDeliveryPlannings(params: { buyerId: string; pageNumber: number; pageSize: number; startDate?: string; endDate?: string }): Promise<DeliveryPlanningSearchResult | null> {
    try {
      const res = await http.post<any>(`${base()}/delivery_planning/search`, params);
      if (!res?.success) return null;
      const data = res.data || {};
      const rows: DeliveryPlanningRow[] = (data.rows || []).map((r: any) => ({
        createdDate: isoOrEmpty(r.createdDate),
        routeId: r.routeId,
        logisticsOrderRowId: r.logisticsOrderRowId,
        routePlanComboId: r.routePlanComboId,
        dropsPoints: r.dropsPoints,
        sla: r.sla,
        weightValue: r.weightValue,
        volumetricWeightValue: r.volumetricWeightValue,
        routePlanComboExpireTime: isoOrEmpty(r.routePlanComboExpireTime),
        routePlanRequestExpireTime: isoOrEmpty(r.routePlanRequestExpireTime),
        routePlanRequestStatus: r.routePlanRequestStatus,
        routePlanComboStatus: r.routePlanComboStatus,
        relationshipType: r.relationshipType,
        routePlanRequestId: r.routePlanRequestId,
        deliveryDate: null,
      }));
      const t = new Date(data.currentTime).getTime();
      return { rows, count: data.count, currentTime: data.currentTime && !isNaN(t) ? t : Date.now() };
    } catch (e) {
      console.error('Error fetching delivery plannings:', e);
      return null;
    }
  },

  /** GET /delivery_planning/{routePlanComboId} (name as in the original) → envelope; null on error (logged). */
  async getDeliveryOrdersByLogisticsOrderId(routePlanComboId: string): Promise<any | null> {
    try {
      return await http.get<any>(`${base()}/delivery_planning/${routePlanComboId}`);
    } catch (e) {
      console.error('Error fetching delivery orders:', e);
      return null;
    }
  },

  /** POST /route_planning → envelope. RETHROWS. */
  async getOptimizedRoutes(body: { orderIds: string[]; buyerId: string; deliveryDate: string; logisticsMode?: string }): Promise<any> {
    try {
      return await http.post<any>(`${base()}/route_planning`, body);
    } catch (e) {
      console.error('Error fetching optimized routes:', e);
      throw e;
    }
  },

  /** POST /route_planning/unassigned-beats → `data ?? null`; null on error. */
  async getUnassignedBeats(body: { buyerId: string; orderIds: string[] }): Promise<{ unassignedOrderCount: number; totalOrders: number; unassignedBeatNames: string[] } | null> {
    try {
      const res = await http.post<any>(`${base()}/route_planning/unassigned-beats`, body);
      return res?.data ?? null;
    } catch (e) {
      console.error('Error fetching unassigned beats:', e);
      return null;
    }
  },

  /** POST /route_planning/create → envelope; null on HTTP error (silent). Also used with the single-order quick body. */
  async createRoutePlan(body: unknown): Promise<any | null> {
    try {
      return await http.post<any>(`${base()}/route_planning/create`, body);
    } catch (e) {
      console.error('Error creating route plan:', e);
      return null;
    }
  },

  /** POST /route_planning/resequence → `data`, or the raw body when there is no `data`. RETHROWS. */
  async resequenceRoutes(body: { routes: { routeId: string; customers: any[] }[]; depot: { lat: number; long: number }; buyerId: string }): Promise<any> {
    const res = await http.post<any>(`${base()}/route_planning/resequence`, body);
    return res?.data ?? res;
  },

  /** POST /route_planning/expire_route — logs errors only. */
  async expireRoute(body: { combinationId: string; type: string }): Promise<any | null> {
    try {
      return await http.post<any>(`${base()}/route_planning/expire_route`, body);
    } catch (e) {
      console.error('Error expiring route:', e);
      return null;
    }
  },

  /** POST /fulfillment/req_for_quotation — throws "Request for quotation failed" when !success; HTTP errors propagate. */
  async requestForQuotation(body: { routeId: string; isBatchRequest?: boolean; coreVersion?: string; deliveryCategory?: string }): Promise<any> {
    const res = await http.post<any>(`${base()}/fulfillment/req_for_quotation`, body);
    if (res?.success !== true) throw new Error('Request for quotation failed');
    return res;
  },

  /** POST /fulfillment/get-available-providers → `success ? data : null`; null on error. */
  async getAvailableProviders(body: { combinationId: string }): Promise<AvailableProviderRaw[] | null> {
    try {
      const res = await http.post<any>(`${base()}/fulfillment/get-available-providers`, body);
      return res?.success ? res.data : null;
    } catch (e) {
      console.error('Error fetching available providers:', e);
      return null;
    }
  },

  /** POST /fulfillment/req_for_confirm — throws "RFQ confirmation failed" when !success; HTTP errors propagate. */
  async requestForConfirm(body: { ondcSearchResultId: string }): Promise<any> {
    const res = await http.post<any>(`${base()}/fulfillment/req_for_confirm`, body);
    if (res?.success !== true) throw new Error('RFQ confirmation failed');
    return res;
  },

  /** Persists the route opened on /delivery-route-details (localStorage "currentRoute"). */
  setCurrentRoute(route: unknown) {
    localStorage.setItem(CURRENT_ROUTE_KEY, JSON.stringify(route));
  },
  getCurrentRoute<T = any>(): T | null {
    try {
      const v = localStorage.getItem(CURRENT_ROUTE_KEY);
      return v ? (JSON.parse(v) as T) : null;
    } catch {
      return null;
    }
  },
};

// ---------------------------------------------------------------- OrdersService methods used here
export const routeOrdersService = {
  /** POST /orders/get_by_filters → mapped plannable rows sorted by orderDate ascending; [] on error. */
  async getDeliveryRootOrders(filters: { buyerId: string; orderStatus: number[] }): Promise<PlannableOrder[]> {
    try {
      const res = await http.post<any>(`${base()}/orders/get_by_filters`, filters);
      const rows: PlannableOrder[] = (res?.data || []).map((o: any) => ({
        orderNumber: o.orderId,
        refOrderNumber: o.refOrderId,
        customerName: o.customerName,
        customerBusinessName: o.customerBusinessName,
        totalWeight: o.orderWeight,
        volumetricWeight: o.volumetricWeight,
        orderDate: o.orderDate,
        amount: +o.amount,
        salesPerson: o.salesPersonName || 'N/A',
        beat: o.salesBeatName || 'N/A',
        deliveryType: o.deliveryMode === 'cds' || o.deliveryMode === 'self' ? o.deliveryMode : '3pl',
        selected: false,
      }));
      return rows.sort((a, b) => new Date(a.orderDate).getTime() - new Date(b.orderDate).getTime());
    } catch (e) {
      console.error('Error fetching orders by filters:', e);
      return [];
    }
  },

  /** POST /orders/customer-order-details → `data`; null on error. `logisticOrderId` is sent only when truthy. */
  async getCustomerOrdersByOrderIds(orderIds: string[], logisticOrderId?: string): Promise<any | null> {
    try {
      const body: Record<string, unknown> = { orderIds };
      if (logisticOrderId) body.logisticOrderId = logisticOrderId;
      const res = await http.post<any>(`${base()}/orders/customer-order-details`, body);
      return res?.data ?? null;
    } catch (e) {
      console.error('Error fetching customer orders:', e);
      return null;
    }
  },
};

// Named function exports for other features (same endpoints / semantics).
export const getDeliveryPlannings = deliveryRoutesService.getDeliveryPlannings;
export const createRoutePlan = deliveryRoutesService.createRoutePlan;
export const requestForQuotation = deliveryRoutesService.requestForQuotation;
export const getAvailableProviders = deliveryRoutesService.getAvailableProviders;
export const requestForConfirm = deliveryRoutesService.requestForConfirm;
export const expireRoute = deliveryRoutesService.expireRoute;
export const getCustomerOrdersByOrderIds = routeOrdersService.getCustomerOrdersByOrderIds;
export const getDeliveryRootOrders = routeOrdersService.getDeliveryRootOrders;
