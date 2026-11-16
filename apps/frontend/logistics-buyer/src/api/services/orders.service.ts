// Port of OrdersService (chunk WXLYQ5IA) — the calls used by /orders and /order-details.
// Error semantics are copied from the original (docs/specs/01-orders.md, 02 §5.1): most methods swallow
// HTTP errors and return null / [] / a {success:false} object; updateOfflineDelivery throws.
import { getConfig } from '../config';
import { http } from '../http';
import { convertUtcToIstDate, formatDateDMY, formatDateUTC, getOrderStatusLabel } from '../../utils/helpers';

const base = () => getConfig().buyerUrl;

// ---------------------------------------------------------------- types
export interface OrderRow {
  id: string;
  refOrderId: string;
  customerBusinessName: string;
  customerMobileNumber: string;
  amount: string;
  orderWeight: string;
  orderDate: string;
  createdDate: string;
  orderStatusId: string | number;
  orderStatus: number;
  volumetricWeight: string;
  logisticOrderId: string | null;
  logisticOrderRowId: string | null;
  logisticOrderStatus: string | null;
  deliveryDate: string;
  tripNumber: string | null;
  tripId: string | null;
  orderItems: any[];
  orderReturnItems: any[];
  orderType: string;
  salesPerson: string;
  beat: string;
  validationErrorCount: number | string;
  isDeliveryAddressUpdated: boolean;
  /** "cds" when the seller confirmed the order as CDS (listed only while CDS Order Routing is off); null for 3PL. */
  deliveryMode: 'cds' | null;
}

export interface ReadyForPlanningStats {
  customerCount: number;
  orderCount: number;
  totalVolumetricWeight: number;
}

export interface OrdersResult {
  orders: OrderRow[];
  totalCount: number;
  readyForPlanningStats: ReadyForPlanningStats;
}

export interface OrderDetails {
  id: string;
  customer: { businessName?: string; contactNumber?: string; address?: string; city?: string; state?: string; country?: string; pincode?: string };
  statusId: number;
  summary: { totalAmount?: number; totalItems?: number; weight?: number; volume?: number; collectionDetails?: string };
  products: { name: string; imageUrl?: string; mrp?: number; sellingPrice?: number; quantity?: number; total?: number }[];
  orderDate: string;
  orderStatus: string;
  deliverySchedule: {
    date?: string;
    pickupSlotStart?: string;
    estimatedTimeToDelivery?: string;
    deliveryExecutive?: string;
    tripNumber?: string;
    logisticsOrderId?: string | null;
    providerId?: string | null;
    transactionId?: string | null;
  };
}

export interface ValidationErrorItem {
  fieldName: string;
  currentValue: string;
  isMandatory: boolean;
  errorMessage: string;
  itemId?: string;
  rowNumber?: number;
}
export interface ValidationErrorsData {
  totalErrors: number;
  groups: {
    customer_order: { count: number; errors: ValidationErrorItem[] };
    product: { count: number; errors: ValidationErrorItem[] };
  };
}
export interface FixErrorsResult {
  allErrorsResolved: boolean;
  message: string;
  errorsFixed: number;
  remainingErrors: number;
}

export interface MapLocationOrder {
  orderId: string;
  refOrderId: string;
  statusId: number;
  orderType: string | null;
  salesPersonName: string | null;
  salesBeatName: string | null;
  amount: string;
}
export interface MapLocation {
  lat: string | number;
  long: string | number;
  status: 'online' | 'offline' | string;
  customerBusinessName: string;
  customerMobileNumber: string;
  customerAddress: string;
  orderCount: number;
  totalAmount: number;
  totalVolumetricWeight: number;
  orders: MapLocationOrder[];
}
export interface MapStats {
  totalLocations: number;
  totalOrders: number;
  totalAmount: number;
  onlineLocations: number;
  offlineLocations: number;
}

// ---------------------------------------------------------------- mappers
function mapOrder(o: any): OrderRow {
  return {
    id: o.orderId,
    refOrderId: o.refOrderId,
    customerBusinessName: o.customerBusinessName,
    customerMobileNumber: o.customerMobileNumber,
    amount: o.amount,
    orderWeight: o.orderWeight,
    orderDate: o.orderdate ? formatDateDMY(o.orderdate) : 'N/A',
    // as-built: a missing createdAt renders "NaN-NaN-NaN" (the N/A fallback is never reached)
    createdDate: formatDateUTC(o.createdAt),
    orderStatusId: o.orderStatusId,
    orderStatus: parseInt(o.orderStatusId),
    volumetricWeight: o.volumetricWeight,
    logisticOrderId: o.logisticOrderId,
    logisticOrderRowId: o.logisticOrderRowId,
    logisticOrderStatus: o.logisticOrderStatus,
    // as-built: a null deliveryDate becomes "01-01-1970"
    deliveryDate: formatDateUTC(o.deliveryDate),
    tripNumber: o.logisticOrderId,
    tripId: o.tripId,
    orderItems: o.orderItems,
    orderReturnItems: o.returnItems,
    orderType: o.orderType || 'Digital',
    salesPerson: o.salesPersonName || 'N/A',
    beat: o.salesBeatName || 'N/A',
    validationErrorCount: o.validationErrorCount || 0,
    isDeliveryAddressUpdated: o.isDeliveryAddressUpdated || false,
    deliveryMode: o.deliveryMode === 'cds' ? 'cds' : null,
  };
}

/** Copy-pasted import error mapping used by updateOrderStatus (02 §1.5). */
function mapImportError(err: any) {
  let message = err?.error?.error?.message || err?.error?.message || 'Order import failed! Please try again.';
  if (typeof message === 'string' && message.includes('Transaction query already complete')) {
    message = 'Duplicate orders detected. These orders have already been imported.';
  }
  return { success: false, error: { code: err?.error?.error?.code || err?.status || 500, message } };
}

// ---------------------------------------------------------------- service
export const ordersService = {
  /** POST /orders/search → mapped rows + count + KPI stats; null on error / empty body. */
  async getOrders(filters: Record<string, any>): Promise<OrdersResult | null> {
    try {
      const response = await http.post<any>(`${base()}/orders/search`, filters);
      if (!response || !response.data) return null;
      const data = response.data;
      return {
        orders: (data.orders || []).map(mapOrder),
        totalCount: data.count,
        readyForPlanningStats: data.readyForPlanningStats ?? { customerCount: 0, orderCount: 0, totalVolumetricWeight: 0 },
      };
    } catch (e) {
      console.error('Error fetching orders:', e);
      return null;
    }
  },

  /** GET /orders/order_details/{id} → mapped details if success && data, else null. */
  async getOrderDetails(orderId: string): Promise<OrderDetails | null> {
    try {
      const response = await http.get<any>(`${base()}/orders/order_details/${orderId}`);
      if (response?.success && response.data) {
        const d = response.data;
        return {
          id: d.id,
          customer: d.customer,
          statusId: d.statusId,
          summary: d.summary,
          products: d.products,
          orderDate: convertUtcToIstDate(d.orderDate),
          orderStatus: getOrderStatusLabel(d.statusId),
          deliverySchedule: { ...d.deliverySchedule, date: d.deliverySchedule?.date ? convertUtcToIstDate(d.deliverySchedule.date) : undefined },
        };
      }
      return null;
    } catch (e) {
      console.error('Error fetching order details:', e);
      return null;
    }
  },

  /** GET /orders/is_return_order/{id} → data.isReturnOrder; false on error. */
  async isReturnOrder(orderId: string): Promise<boolean> {
    try {
      const response = await http.get<any>(`${base()}/orders/is_return_order/${orderId}`);
      return response?.data?.isReturnOrder;
    } catch (e) {
      console.error('Error checking return order:', e);
      return false;
    }
  },

  /** PUT /orders/order_updates/bulk → {success:true, data} on any 2xx (body ignored), {success:false, error} on HTTP error. */
  async updateOrderStatus(payload: { updateAttributes: Record<string, any>; orderId: string }[]): Promise<{ success: boolean; data?: any; error?: { code: any; message: string } }> {
    try {
      const response = await http.put<any>(`${base()}/orders/order_updates/bulk`, payload);
      return { success: true, data: response };
    } catch (err) {
      console.error('Error updating order status:', err);
      return mapImportError(err);
    }
  },

  /** DELETE /orders/{id} → response.data (not the envelope); HTTP failure → {success:false, message:"Failed to delete order"}. */
  async deleteOrder(orderId: string): Promise<any> {
    try {
      const response = await http.delete<any>(`${base()}/orders/${orderId}`);
      return response.data;
    } catch (e) {
      console.error('Error deleting order:', e);
      return { success: false, message: 'Failed to delete order' };
    }
  },

  /** POST /orders/map-locations → data || null; errors logged → null. */
  async getOrderLocations(buyerId: string): Promise<{ locations?: MapLocation[]; stats?: MapStats } | null> {
    try {
      const response = await http.post<any>(`${base()}/orders/map-locations`, { buyerId });
      return response?.data || null;
    } catch (e) {
      console.error('Error fetching order locations:', e);
      return null;
    }
  },

  /** PUT /orders/offline-delivery → data if success; otherwise throws. HTTP errors propagate. */
  async updateOfflineDelivery(orderIds: string[], action: 'mark_offline' | 'mark_delivered' | 'revert', buyerId: string): Promise<any> {
    const response = await http.put<any>(`${base()}/orders/offline-delivery`, { orderIds, action, buyerId });
    if (response?.success) return response.data;
    throw new Error(response?.error?.message || 'Failed to update offline delivery');
  },

  /** POST /orders/search-by-invoice → data || []; errors → []. */
  async searchByInvoice(invoiceNumbers: string[], buyerId: string): Promise<any[]> {
    try {
      const response = await http.post<any>(`${base()}/orders/search-by-invoice`, { invoiceNumbers, buyerId });
      return response?.data || [];
    } catch (e) {
      console.error('Error searching orders by invoice:', e);
      return [];
    }
  },

  /** GET /buyer-customer-master/search?query=&buyerId= → data || []; errors → []. */
  async searchCustomers(query: string, buyerId: string): Promise<any[]> {
    try {
      const response = await http.get<any>(`${base()}/buyer-customer-master/search?query=${encodeURIComponent(query)}&buyerId=${buyerId}`);
      return response?.data || [];
    } catch (e) {
      console.error('Error searching customers:', e);
      return [];
    }
  },

  /** PUT /orders/update-delivery-address → raw body; HTTP error → {success:false, error:{code, message}} (never throws). */
  async updateDeliveryAddress(body: { orderIds: string[]; targetCustomerMasterId: string; buyerId: string }): Promise<any> {
    try {
      return await http.put<any>(`${base()}/orders/update-delivery-address`, body);
    } catch (err: any) {
      console.error('Error updating delivery address:', err);
      const e = err?.error?.error || err?.error || {};
      return {
        success: false,
        error: { code: e.code || err?.status || 500, message: e.message || 'Failed to update delivery address. Please try again.' },
      };
    }
  },

  /** GET /orders/{id}/errors → data if success && data, else null. */
  async getOrderValidationErrors(orderId: string): Promise<ValidationErrorsData | null> {
    try {
      const response = await http.get<any>(`${base()}/orders/${orderId}/errors`);
      return response?.success && response.data ? response.data : null;
    } catch (e) {
      console.error('Error fetching validation errors:', e);
      return null;
    }
  },

  /** PATCH /orders/{id}/fix-errors → data || null; HTTP errors → null. */
  async fixOrderErrors(orderId: string, updates: { fieldName: string; newValue: any; itemId?: string }[]): Promise<FixErrorsResult | null> {
    try {
      const response = await http.patch<any>(`${base()}/orders/${orderId}/fix-errors`, { updates });
      return response?.data || null;
    } catch (e) {
      console.error('Error fixing order errors:', e);
      return null;
    }
  },
};
