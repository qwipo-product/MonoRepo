// Client for the calls the Order details "Search Vehicles" quick-booking flow makes (spec 01 §2.4–2.6):
// the fulfillment / route-planning service (chunk 5G255SWT), the default-address lookup (QFRO6JWU) and the
// single logistics-orders lookup used for the trip status (6X7BRT24). Error semantics follow the original methods.
// (Named orderFulfillment.service.ts so it does not collide with the Delivery-routes / Trips service files.)
import { getConfig } from '../config';
import { http } from '../http';
import { addressService } from './address.service';

const base = () => getConfig().buyerUrl;

export interface AvailableProvider {
  ondcSearchId: string;
  providerName: string;
  isEnabled: boolean;
  categoryId?: string;
  deliveryPrice: string | number;
  deliveryDate?: string;
  deliveryTatDuration?: string;
  pickupTime?: string;
  resultTimestamp?: string;
  [k: string]: any;
}

/** Trip status number → label (spec 01 §0.3 / 05 §5): anything else → "Planned". */
export function tripStatusLabel(status: unknown): string {
  switch (Number(status)) {
    case 1: return 'Planned';
    case 2: return 'In Progress';
    case 3: return 'Completed';
    case 4: return 'Cancelled';
    case 5: return 'Delayed';
    default: return 'Planned';
  }
}

export const orderFulfillmentService = {
  /** AddressService.getBuyerDefaultAddress — returns `data`; logs and RETHROWS HTTP errors. */
  async getBuyerDefaultAddress(buyerId: string): Promise<any> {
    try {
      const response = await addressService.getDefaultAddress(buyerId);
      return response?.data;
    } catch (e) {
      console.error('Error fetching default address:', e);
      throw e;
    }
  },

  /** POST /route_planning/create — returns the envelope; null on HTTP error (silent). */
  async createRoutePlan(body: unknown): Promise<any | null> {
    try {
      return await http.post<any>(`${base()}/route_planning/create`, body);
    } catch (e) {
      console.error('Error creating route plan:', e);
      return null;
    }
  },

  /** POST /fulfillment/req_for_quotation — throws "Request for quotation failed" when !success; HTTP errors propagate. */
  async requestForQuotation(body: { routeId: string; isBatchRequest?: boolean; coreVersion?: string; deliveryCategory?: string }): Promise<any> {
    const response = await http.post<any>(`${base()}/fulfillment/req_for_quotation`, body);
    if (!response?.success) throw new Error('Request for quotation failed');
    return response;
  },

  /** POST /fulfillment/get-available-providers — `success ? data : null`; null on HTTP error. */
  async getAvailableProviders(combinationId: string): Promise<AvailableProvider[] | null> {
    try {
      const response = await http.post<any>(`${base()}/fulfillment/get-available-providers`, { combinationId });
      return response?.success ? response.data : null;
    } catch (e) {
      console.error('Error fetching available providers:', e);
      return null;
    }
  },

  /** POST /fulfillment/req_for_confirm — throws "RFQ confirmation failed" when !success; HTTP errors propagate. */
  async requestForConfirm(ondcSearchResultId: string): Promise<any> {
    const response = await http.post<any>(`${base()}/fulfillment/req_for_confirm`, { ondcSearchResultId });
    if (!response?.success) throw new Error('RFQ confirmation failed');
    return response;
  },

  /** POST /route_planning/expire_route — errors swallowed (logged). */
  async expireRoute(combinationId: string, type: string): Promise<any> {
    try {
      return await http.post<any>(`${base()}/route_planning/expire_route`, { combinationId, type });
    } catch (e) {
      console.error('Error expiring route:', e);
      return null;
    }
  },

  /**
   * POST /logistics-orders/get_by_filters (used by Order details only for `logisticsOrderStatus`).
   * Mirrors the logistics-orders mapper's naming: `id` ← logisticsOrderId, `logisticsOrderId` ← orderId (swapped, as built).
   * Returns `{ data: mapped[] }`, or null on error.
   */
  async getLogisticsOrdersByFilters(body: Record<string, any>): Promise<{ data: { id: string; logisticsOrderId: string; logisticsOrderStatus: string; [k: string]: any }[] } | null> {
    try {
      const response = await http.post<any>(`${base()}/logistics-orders/get_by_filters`, body);
      const orders: any[] = response?.data?.orders || [];
      return {
        data: orders.map((o) => ({
          ...o,
          id: o.logisticsOrderId,
          logisticsOrderId: o.orderId,
          logisticsOrderStatus: tripStatusLabel(o.status),
        })),
      };
    } catch (e) {
      console.error('Error fetching logistics orders:', e);
      return null;
    }
  },
};
