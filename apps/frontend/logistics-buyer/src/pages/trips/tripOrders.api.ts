// OrdersService.getCustomerOrdersByOrderIds (spec 02 §5.1 / spec 05 §4.6), kept local to the Trips feature because
// no shared service exposes it yet. The mock route (/orders/customer-order-details) is owned by Delivery routes.
import { getConfig } from '../../api/config';
import { http } from '../../api/http';

/** POST /orders/customer-order-details `{orderIds, logisticOrderId?}` → `data`, or `null` on error / no data. */
export async function getCustomerOrdersByOrderIds(orderIds: string[], logisticOrderId?: string): Promise<any | null> {
  try {
    const body: Record<string, unknown> = { orderIds };
    if (logisticOrderId) body.logisticOrderId = logisticOrderId;
    const res = await http.post<any>(`${getConfig().buyerUrl}/orders/customer-order-details`, body);
    return res?.data || null;
  } catch (e) {
    console.error('Error fetching customer orders:', e);
    return null;
  }
}
