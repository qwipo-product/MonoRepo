// Status labels, badge tones and allowed status changes. The CDS engine refuses any change not listed here.
import type { CollectionStatus, OrderStatus, OtpStatus, ReturnStatus, StopAction, TripStatus, TripType } from './types.ts';

export type Tone = 'grey' | 'blue' | 'amber' | 'green' | 'red' | 'purple' | 'teal';
export interface Meta { label: string; tone: Tone }

export const ORDER_STATUS: Record<OrderStatus, Meta> = {
  CONFIRMED: { label: 'Confirmed', tone: 'grey' },
  PICKUP_PLANNED: { label: 'Pickup Planned', tone: 'blue' },
  PICKED_UP: { label: 'Picked Up', tone: 'purple' },
  IN_TRANSIT_TO_CDS: { label: 'In Transit to CDS', tone: 'purple' },
  RECEIVED_AT_CDS: { label: 'Received at CDS', tone: 'amber' },
  GRN_COMPLETED: { label: 'GRN Completed', tone: 'teal' },
  READY_FOR_DELIVERY: { label: 'Ready for Planning', tone: 'teal' },
  DELIVERY_PLANNED: { label: 'Delivery Planned', tone: 'blue' },
  OUT_FOR_DELIVERY: { label: 'Out for Delivery', tone: 'purple' },
  DELIVERED: { label: 'Delivered', tone: 'green' },
  PARTIALLY_DELIVERED: { label: 'Partially Delivered', tone: 'amber' },
  RETURNED: { label: 'Returned', tone: 'red' },
  CANCELLED: { label: 'Cancelled', tone: 'grey' },
};
export const ORDER_FLOW: Record<OrderStatus, OrderStatus[]> = {
  CONFIRMED: ['PICKUP_PLANNED', 'CANCELLED'],
  PICKUP_PLANNED: ['PICKED_UP', 'CONFIRMED'],
  PICKED_UP: ['IN_TRANSIT_TO_CDS', 'RECEIVED_AT_CDS'],
  IN_TRANSIT_TO_CDS: ['RECEIVED_AT_CDS', 'PICKED_UP'],
  RECEIVED_AT_CDS: ['GRN_COMPLETED'],
  GRN_COMPLETED: ['READY_FOR_DELIVERY'],
  READY_FOR_DELIVERY: ['DELIVERY_PLANNED', 'CANCELLED'],
  DELIVERY_PLANNED: ['OUT_FOR_DELIVERY', 'READY_FOR_DELIVERY'],
  OUT_FOR_DELIVERY: ['DELIVERED', 'PARTIALLY_DELIVERED', 'READY_FOR_DELIVERY'],
  DELIVERED: ['RETURNED'],
  PARTIALLY_DELIVERED: ['RETURNED'],
  RETURNED: [],
  CANCELLED: [],
};

/** Shown trip statuses: Planned, In Progress, Completed (and Cancelled), as in LBNP Trips. The detailed status stays in the data. */
export const TRIP_STATUS: Record<TripStatus, Meta> = {
  PLANNED: { label: 'Planned', tone: 'blue' },
  ASSIGNED: { label: 'Planned', tone: 'blue' },
  STARTED: { label: 'In Progress', tone: 'purple' },
  IN_PROGRESS: { label: 'In Progress', tone: 'purple' },
  COMPLETED: { label: 'Completed', tone: 'green' },
  PARTIALLY_COMPLETED: { label: 'Completed', tone: 'green' },
  CANCELLED: { label: 'Cancelled', tone: 'grey' },
};
export type TripShown = 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
export const TRIP_SHOWN: Record<TripShown, Meta> = {
  ASSIGNED: { label: 'Planned', tone: 'blue' },
  IN_PROGRESS: { label: 'In Progress', tone: 'purple' },
  COMPLETED: { label: 'Completed', tone: 'green' },
  CANCELLED: { label: 'Cancelled', tone: 'grey' },
};
const SHOWN: Record<TripStatus, TripShown> = { PLANNED: 'ASSIGNED', ASSIGNED: 'ASSIGNED', STARTED: 'IN_PROGRESS', IN_PROGRESS: 'IN_PROGRESS', COMPLETED: 'COMPLETED', PARTIALLY_COMPLETED: 'COMPLETED', CANCELLED: 'CANCELLED' };
type PhaseTrip = { type: TripType; status: TripStatus; stops: { action: StopAction; status: string }[] };

/**
 * The status shown for a trip and one line on what the vehicle is doing. A Pickup Trip collects at the sellers,
 * then delivers to the CDS stores. (CDS_DELIVERY: older two-trip pickup data.)
 */
export function tripPhase(t: PhaseTrip, pickupOfPlan?: PhaseTrip): { status: TripShown; note: string } {
  const own = SHOWN[t.status];
  const pending = (a: StopAction) => t.stops.some((s) => s.action === a && s.status === 'PENDING');
  if (own === 'CANCELLED' || own === 'COMPLETED') return { status: own, note: '' };
  if (t.type === 'CDS_DELIVERY') {
    if (own === 'IN_PROGRESS') return { status: own, note: 'Delivering back to CDS Stores' };
    const p = pickupOfPlan ? SHOWN[pickupOfPlan.status] : null;
    if (p === 'IN_PROGRESS') return { status: 'IN_PROGRESS', note: 'Going for pickup from Sellers' };
    if (p === 'COMPLETED') return { status: 'IN_PROGRESS', note: 'Picked up from Sellers · delivering back to CDS Stores' };
    return { status: own, note: '' };
  }
  if (own !== 'IN_PROGRESS') return { status: own, note: '' };
  if (t.type === 'DISTRIBUTOR_PICKUP') return { status: own, note: pending('DISTRIBUTOR_PICKUP') ? 'Picking up from Sellers' : 'Delivering to CDS Stores' };
  if (t.type === 'CDS_RETURN') return { status: own, note: pending('CDS_RETURN_PICKUP') ? 'Picking up returns from CDS Stores' : 'Delivering returns to Sellers' };
  return { status: own, note: pending('CDS_ORDER_PICKUP') ? 'Loading orders at the CDS Store' : 'Delivering to retailers' };
}

/** Status filter choices (one per shown status) and the statuses each one covers. */
export const TRIP_STATUS_GROUPS: Record<string, { label: string; statuses: TripStatus[] }> = {
  ASSIGNED: { label: 'Planned', statuses: ['PLANNED', 'ASSIGNED'] },
  IN_PROGRESS: { label: 'In Progress', statuses: ['STARTED', 'IN_PROGRESS'] },
  COMPLETED: { label: 'Completed', statuses: ['COMPLETED', 'PARTIALLY_COMPLETED'] },
  CANCELLED: { label: 'Cancelled', statuses: ['CANCELLED'] },
};
export const TRIP_FLOW: Record<TripStatus, TripStatus[]> = {
  PLANNED: ['ASSIGNED', 'CANCELLED'],
  ASSIGNED: ['STARTED', 'CANCELLED'],
  STARTED: ['IN_PROGRESS', 'COMPLETED', 'PARTIALLY_COMPLETED', 'CANCELLED'],
  IN_PROGRESS: ['COMPLETED', 'PARTIALLY_COMPLETED'],
  COMPLETED: [],
  PARTIALLY_COMPLETED: [],
  CANCELLED: [],
};
export const ACTIVE_TRIP: TripStatus[] = ['PLANNED', 'ASSIGNED', 'STARTED', 'IN_PROGRESS'];

/** `direction` is the trip's start → end, shown under the trip type everywhere (one wording per type). */
export const TRIP_TYPE: Record<TripType, { label: string; prefix: string; direction: string; icon: string }> = {
  DISTRIBUTOR_PICKUP: { label: 'Pickup Trip', prefix: 'DPT', direction: 'Sellers to CDS Stores', icon: 'fa-truck-ramp-box' },
  CDS_DELIVERY: { label: 'CDS Delivery Trip', prefix: 'CDT', direction: 'Sellers to CDS Stores', icon: 'fa-warehouse' },
  CDS_RETURN: { label: 'Return Trip', prefix: 'CRT', direction: 'CDS Stores to Sellers', icon: 'fa-rotate-left' },
  RETAILER_DELIVERY: { label: 'Retailer Delivery Trip', prefix: 'RDT', direction: 'CDS Store to Retailers', icon: 'fa-truck-fast' },
};

/** Each stop action = one OTP checkpoint. `otpTo` receives the OTP; the delivery person enters it. */
export const STOP_ACTION: Record<StopAction, { label: string; verb: string; otpBetween: string; canFail: boolean }> = {
  DISTRIBUTOR_PICKUP: { label: 'Distributor pickup', verb: 'Collect orders', otpBetween: 'Seller/Distributor & Delivery Person', canFail: true },
  CDS_HANDOVER: { label: 'Handover to CDS', verb: 'Hand over orders', otpBetween: 'Delivery Person & CDS User', canFail: false },
  CDS_ORDER_PICKUP: { label: 'Order pickup at CDS', verb: 'Load orders', otpBetween: 'CDS User & Delivery Person', canFail: false },
  RETAILER_DELIVERY: { label: 'Retailer delivery', verb: 'Deliver orders', otpBetween: 'Delivery Person & Retailer', canFail: true },
  RETAILER_RETURN: { label: 'Return collection', verb: 'Collect returns', otpBetween: 'Delivery Person & Retailer', canFail: true },
  RETURN_HANDOVER_CDS: { label: 'Return handover to CDS', verb: 'Hand over returns', otpBetween: 'Delivery Person & CDS User', canFail: false },
  CDS_RETURN_PICKUP: { label: 'Return pickup at CDS', verb: 'Load returns', otpBetween: 'CDS User & Delivery Person', canFail: false },
  SELLER_RETURN_HANDOVER: { label: 'Return handover to seller', verb: 'Hand over returns', otpBetween: 'Delivery Person & Seller', canFail: true },
};

export const RETURN_STATUS: Record<ReturnStatus, Meta> = {
  RETURN_INITIATED: { label: 'Return Initiated', tone: 'amber' },
  PICKED_UP_FROM_RETAILER: { label: 'Picked Up from Retailer', tone: 'purple' },
  RECEIVED_AT_CDS: { label: 'Received at CDS', tone: 'teal' },
  RETURN_PLANNED: { label: 'Return Planned', tone: 'blue' },
  PICKED_UP_FROM_CDS: { label: 'Picked Up from CDS', tone: 'purple' },
  DELIVERED_TO_SELLER: { label: 'Delivered to Seller', tone: 'green' },
  COMPLETED: { label: 'Completed', tone: 'green' },
  CANCELLED: { label: 'Cancelled', tone: 'grey' },
};
export const RETURN_FLOW: Record<ReturnStatus, ReturnStatus[]> = {
  RETURN_INITIATED: ['PICKED_UP_FROM_RETAILER', 'CANCELLED'],
  PICKED_UP_FROM_RETAILER: ['RECEIVED_AT_CDS'],
  RECEIVED_AT_CDS: ['RETURN_PLANNED', 'COMPLETED'],
  RETURN_PLANNED: ['PICKED_UP_FROM_CDS', 'RECEIVED_AT_CDS'],
  PICKED_UP_FROM_CDS: ['DELIVERED_TO_SELLER'],
  DELIVERED_TO_SELLER: ['COMPLETED'],
  COMPLETED: [],
  CANCELLED: [],
};

export const COLLECTION_STATUS: Record<CollectionStatus, Meta> = {
  WITH_DELIVERY_PERSON: { label: 'With Delivery Person', tone: 'amber' },
  RECEIVED_BY_CDS: { label: 'Received by CDS', tone: 'blue' },
  HANDED_TO_QWIPO: { label: 'Handed to Qwipo (SNP)', tone: 'purple' },
  SETTLED: { label: 'Settled', tone: 'green' },
};

export const OTP_STATUS: Record<OtpStatus, Meta> = {
  ACTIVE: { label: 'Sent', tone: 'blue' },
  VERIFIED: { label: 'Verified', tone: 'green' },
  EXPIRED: { label: 'Expired', tone: 'grey' },
  SUPERSEDED: { label: 'Replaced', tone: 'grey' },
  LOCKED: { label: 'Locked', tone: 'red' },
};

export const GRN_STATUS: Record<'PENDING' | 'COMPLETED', Meta> = {
  PENDING: { label: 'Pending Verification', tone: 'amber' },
  COMPLETED: { label: 'GRN Generated', tone: 'green' },
};

/** Synthetic sales people (demo data only). Each distributor has three; the retailer picks one. */
const SALES_PEOPLE = ['Ravi Teja', 'Suresh Babu', 'Anil Kumar', 'Praveen Reddy', 'Kiran Rao', 'Mahesh Goud', 'Srinivas Naik', 'Venkat Rao', 'Naresh Yadav', 'Rajesh Varma', 'Prakash Chary', 'Sandeep Kumar'];
const hashOf = (s: string) => Array.from(s).reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
export const salesPersonOf = (distributorId: string, retailerId: string) => {
  const i = (hashOf(distributorId) % 4) * 3 + (hashOf(retailerId) % 3);
  return { salesPersonName: SALES_PEOPLE[i], salesPersonPhone: `90000${21001 + i * 7}` };
};
