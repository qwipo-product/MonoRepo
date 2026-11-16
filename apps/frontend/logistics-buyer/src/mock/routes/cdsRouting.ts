// Mock endpoints for CDS Order Routing (Settings → Delivery → CDS Order Routing).
//
// When the seller confirms an order as CDS in Seller Store, the order lands in LBNP. While routing is on, LBNP sends
// it to the selected CDS service admin, and the Orders page does not show it; the service center plans it into a
// Consolidated Delivery trip. While routing is off, the order stays on the Orders page as Ready for Planning, with a
// "CDS" label. Switching routing on sends the CDS orders that are still waiting in LBNP. The rule itself lives in
// extensions/cds.ts (cdsRoutingConfig, isSentToCds, sendWaitingCdsOrders).
//
//   GET /cds-routing/:buyerId   the rule, the CDS service centers and the orders sent to the CDS service admin
//   PUT /cds-routing/:buyerId   { enabled, serviceCenterId } → saves the rule; on → sends the waiting CDS orders
import { db, persist } from '../db';
import {
  CDS_SERVICE_CENTERS, addSellerCdsOrder, cdsRoutingConfig, ensureCdsTrips, sendWaitingCdsOrders, setCdsRoutingConfig,
} from '../extensions/cds';
import { MockError, route } from '../server';

const BUYER = 'logistics-buyer-svc';

function routingView() {
  const d = db();
  const config = cdsRoutingConfig(d);
  const deliveryTrips = new Map(d.trips.filter((t) => t.channel === 'cds').map((t) => [t.logisticsOrderId, t]));
  const centerName = (id: string | null | undefined) => CDS_SERVICE_CENTERS.find((c) => c.id === id)?.name ?? '';
  const sentOrders = d.orders
    .filter((o) => o.deliveryMode === 'cds' && o.cdsSentAt)
    .sort((a, b) => String(b.cdsSentAt).localeCompare(String(a.cdsSentAt)))
    .map((o) => {
      const trip = o.tripId ? deliveryTrips.get(o.tripId) : undefined;
      return {
        orderId: o.orderId,
        refOrderId: o.refOrderId,
        retailer: o.customerBusinessName,
        amount: o.amount,
        sentAt: o.cdsSentAt,
        serviceCenter: centerName(o.cdsServiceCenterId),
        status: trip ? 'Trip created' : 'Sent',
        tripNumber: trip?.orderId ?? null,
      };
    });
  // CDS orders kept in LBNP (routing was off when they arrived) and not planned yet.
  const waitingInLbnp = d.orders.filter((o) => o.deliveryMode === 'cds' && !o.cdsSentAt && o.orderStatusId === 1 && !o.tripId).length;
  return { enabled: config.enabled, serviceCenterId: config.serviceCenterId, serviceCenters: CDS_SERVICE_CENTERS, sentOrders, waitingInLbnp };
}

route('GET', BUYER, '/cds-routing/:buyerId', () => {
  if (ensureCdsTrips(db())) persist();
  return routingView();
});

route('PUT', BUYER, '/cds-routing/:buyerId', (req) => {
  const b = req.body || {};
  if (typeof b.enabled !== 'boolean') throw new MockError(400, 'enabled must be true or false');
  if (!CDS_SERVICE_CENTERS.some((c) => c.id === b.serviceCenterId)) throw new MockError(400, 'Select a CDS service center');
  const d = db();
  ensureCdsTrips(d);
  setCdsRoutingConfig(d, { enabled: b.enabled, serviceCenterId: b.serviceCenterId });
  const sentNow = b.enabled ? sendWaitingCdsOrders(d) : 0;
  persist();
  return { ...routingView(), sentNow };
});

/** Mock controls panel: the seller confirms one more order as CDS in Seller Store. */
export function simulateSellerCdsOrder() {
  const d = db();
  ensureCdsTrips(d);
  const order = addSellerCdsOrder(d);
  persist();
  return { refOrderId: order.refOrderId, retailer: order.customerBusinessName, sent: !!order.cdsSentAt };
}
