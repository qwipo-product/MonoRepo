// CDS Order Routing (Settings → Delivery). An order the seller confirms as CDS in Seller Store lands in LBNP; while
// routing is on, LBNP sends it to the selected CDS service admin and the Orders page does not show it.
import { getConfig } from '../config';
import { http } from '../http';

export interface CdsServiceCenter {
  id: string;
  name: string;
}

export interface CdsSentOrder {
  orderId: string;
  refOrderId: string;
  retailer: string;
  amount: number;
  sentAt: string;
  serviceCenter: string;
  /** "Sent" until the CDS service center puts the order on a Consolidated Delivery trip, then "Trip created". */
  status: 'Sent' | 'Trip created';
  tripNumber: string | null;
}

export interface CdsRouting {
  enabled: boolean;
  serviceCenterId: string;
  serviceCenters: CdsServiceCenter[];
  sentOrders: CdsSentOrder[];
  /** CDS orders kept on the Orders page (routing was off when they arrived) and not planned yet. */
  waitingInLbnp: number;
  /** Save only: how many waiting CDS orders were sent when routing was switched on. */
  sentNow?: number;
}

const base = () => `${getConfig().buyerUrl}/cds-routing`;

export const cdsRoutingService = {
  async get(buyerId: string): Promise<CdsRouting> {
    const res = await http.get<any>(`${base()}/${buyerId}`);
    return res.data;
  },
  async save(buyerId: string, body: { enabled: boolean; serviceCenterId: string }): Promise<CdsRouting> {
    const res = await http.put<any>(`${base()}/${buyerId}`, body);
    return res.data;
  },
};
