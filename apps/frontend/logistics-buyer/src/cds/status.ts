// Status labels, badge tones and allowed status changes. The CDS engine refuses any change not listed here.
import type { OrderStatus, OtpStatus, StopAction, TripStatus, TripType } from './types.ts';

export type Tone = 'grey' | 'blue' | 'amber' | 'green' | 'red' | 'purple' | 'teal';
export interface Meta { label: string; tone: Tone }

export const ORDER_STATUS: Record<OrderStatus, Meta> = {
  CONFIRMED: { label: 'Confirmed', tone: 'grey' },
  PICKUP_PLANNED: { label: 'Pickup Planned', tone: 'blue' },
  PICKED_UP: { label: 'Picked Up', tone: 'purple' },
  IN_TRANSIT_TO_CDS: { label: 'In Transit to CDS', tone: 'purple' },
  READY_FOR_DELIVERY: { label: 'Ready for Delivery', tone: 'teal' },
  DELIVERY_PLANNED: { label: 'Delivery Planned', tone: 'blue' },
  OUT_FOR_DELIVERY: { label: 'Out for Delivery', tone: 'purple' },
  DELIVERED: { label: 'Delivered', tone: 'green' },
  PARTIALLY_DELIVERED: { label: 'Partially Delivered', tone: 'amber' },
  CANCELLED: { label: 'Cancelled', tone: 'grey' },
};
/**
 * The OTP-verified handover at the CDS store makes an order Ready for Delivery (no GRN step). An order with nothing
 * handed over goes back to Picked Up, so the Service Centre can send it to the CDS again.
 */
export const ORDER_FLOW: Record<OrderStatus, OrderStatus[]> = {
  CONFIRMED: ['PICKUP_PLANNED', 'CANCELLED'],
  PICKUP_PLANNED: ['PICKED_UP', 'CONFIRMED'],
  PICKED_UP: ['IN_TRANSIT_TO_CDS', 'READY_FOR_DELIVERY'],
  IN_TRANSIT_TO_CDS: ['READY_FOR_DELIVERY', 'PICKED_UP'],
  READY_FOR_DELIVERY: ['DELIVERY_PLANNED', 'CANCELLED'],
  DELIVERY_PLANNED: ['OUT_FOR_DELIVERY', 'READY_FOR_DELIVERY'],
  OUT_FOR_DELIVERY: ['DELIVERED', 'PARTIALLY_DELIVERED', 'READY_FOR_DELIVERY'],
  DELIVERED: [],
  PARTIALLY_DELIVERED: [],
  CANCELLED: [],
};

export const TRIP_STATUS: Record<TripStatus, Meta> = {
  PLANNED: { label: 'Planned', tone: 'grey' },
  ASSIGNED: { label: 'Assigned', tone: 'blue' },
  STARTED: { label: 'Started', tone: 'purple' },
  IN_PROGRESS: { label: 'In Progress', tone: 'purple' },
  COMPLETED: { label: 'Completed', tone: 'green' },
  PARTIALLY_COMPLETED: { label: 'Partially Completed', tone: 'amber' },
  CANCELLED: { label: 'Cancelled', tone: 'grey' },
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
  DISTRIBUTOR_PICKUP: { label: 'Distributor Pickup Trip', prefix: 'DPT', direction: 'CDS to Distributor', icon: 'fa-truck-ramp-box' },
  CDS_DELIVERY: { label: 'CDS Delivery Trip', prefix: 'CDT', direction: 'Distributor to CDS', icon: 'fa-warehouse' },
  RETAILER_DELIVERY: { label: 'Retailer Delivery Trip', prefix: 'RDT', direction: 'CDS to Retailer', icon: 'fa-truck-fast' },
};

/** Each stop action = one OTP checkpoint. `otpTo` receives the OTP; the delivery person enters it. */
export const STOP_ACTION: Record<StopAction, { label: string; verb: string; otpBetween: string; canFail: boolean }> = {
  DISTRIBUTOR_PICKUP: { label: 'Distributor pickup', verb: 'Collect orders', otpBetween: 'Seller/Distributor & Delivery Person', canFail: true },
  CDS_HANDOVER: { label: 'Handover to CDS', verb: 'Hand over orders', otpBetween: 'Delivery Person & CDS User', canFail: false },
  CDS_ORDER_PICKUP: { label: 'Order pickup at CDS', verb: 'Load orders', otpBetween: 'CDS User & Delivery Person', canFail: false },
  RETAILER_DELIVERY: { label: 'Retailer delivery', verb: 'Deliver orders', otpBetween: 'Delivery Person & Retailer', canFail: true },
};

export const OTP_STATUS: Record<OtpStatus, Meta> = {
  ACTIVE: { label: 'Sent', tone: 'blue' },
  VERIFIED: { label: 'Verified', tone: 'green' },
  EXPIRED: { label: 'Expired', tone: 'grey' },
  SUPERSEDED: { label: 'Replaced', tone: 'grey' },
  LOCKED: { label: 'Locked', tone: 'red' },
};
