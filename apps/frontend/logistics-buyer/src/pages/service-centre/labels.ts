// Labels, colours and formatters for the Service Centre screens. Status names are indicative (see phase1Pages.ts).
import type { DeliveryMode, DepositMode, DiscrepancyType, RunStatus, TripSlot, TripStatus, VehicleType, XdOrderStatus, XdReturnStatus, XdSettings } from '../../types/crossDock';

export type Tone = 'amber' | 'blue' | 'indigo' | 'green' | 'grey' | 'red' | 'purple';

export const ORDER_STATUS: Record<XdOrderStatus, { label: string; tone: Tone }> = {
  ACCEPTED: { label: 'Waiting for pickup', tone: 'amber' },
  PICKUP_PLANNED: { label: 'Pickup planned', tone: 'blue' },
  PICKED_UP: { label: 'Picked up', tone: 'indigo' },
  DROPPED_AT_CDS: { label: 'Dropped at CDS', tone: 'green' },
  RECEIVED_AT_CDS: { label: 'Received at CDS', tone: 'green' },
  READY_TO_DISPATCH: { label: 'At CDS', tone: 'green' },
  OUT_FOR_DELIVERY: { label: 'Out for delivery', tone: 'green' },
  DELIVERED: { label: 'Delivered', tone: 'green' },
  RETURNED: { label: 'Returned', tone: 'red' },
  DIRECT_DELIVERY: { label: 'Sent to direct delivery', tone: 'grey' },
};

export const RETURN_STATUS: Record<XdReturnStatus, { label: string; tone: Tone }> = {
  AT_CDS: { label: 'Waiting at CDS', tone: 'amber' },
  RETURN_PLANNED: { label: 'Return planned', tone: 'blue' },
  COLLECTED: { label: 'Collected', tone: 'indigo' },
  RETURNED_TO_DISTRIBUTOR: { label: 'Back with distributor', tone: 'green' },
};

export const TRIP_STATUS: Record<TripStatus, { label: string; tone: Tone }> = {
  PLANNED: { label: 'Planned', tone: 'blue' },
  IN_PROGRESS: { label: 'On the road', tone: 'indigo' },
  COMPLETED: { label: 'Completed', tone: 'green' },
  CANCELLED: { label: 'Cancelled', tone: 'grey' },
};

/** The same statuses as the Cross Dock Store sees them. */
export const STORE_STATUS: Record<XdOrderStatus, { label: string; tone: Tone }> = {
  ACCEPTED: { label: 'At distributor', tone: 'grey' },
  PICKUP_PLANNED: { label: 'Pickup planned', tone: 'blue' },
  PICKED_UP: { label: 'On the way', tone: 'indigo' },
  DROPPED_AT_CDS: { label: 'To receive', tone: 'amber' },
  RECEIVED_AT_CDS: { label: 'Received', tone: 'blue' },
  READY_TO_DISPATCH: { label: 'Ready for planning', tone: 'purple' },
  OUT_FOR_DELIVERY: { label: 'Out for delivery', tone: 'indigo' },
  DELIVERED: { label: 'Delivered', tone: 'green' },
  RETURNED: { label: 'Returned', tone: 'red' },
  DIRECT_DELIVERY: { label: 'Direct delivery', tone: 'grey' },
};

export const RUN_STATUS: Record<RunStatus, { label: string; tone: Tone }> = {
  PLANNED: { label: 'Planned', tone: 'blue' },
  OUT: { label: 'Out', tone: 'indigo' },
  COMPLETED: { label: 'Completed', tone: 'green' },
  CANCELLED: { label: 'Cancelled', tone: 'grey' },
};

export const DISCREPANCY: Record<DiscrepancyType, string> = { SHORT: 'Short', DAMAGED: 'Damaged', EXCESS: 'Extra' };
export const DEPOSIT_MODE: Record<DepositMode, string> = { UPI: 'UPI transfer', BANK_TRANSFER: 'Bank transfer (NEFT/IMPS)', CASH_DEPOSIT: 'Cash deposit at bank' };
export const RIDER_RETURN_REASONS = ['Shop closed at delivery', 'Retailer refused - excess stock', 'Damaged in transit', 'Wrong item sent', 'Retailer not reachable', 'Payment not ready'];

export const VEHICLE_TYPE: Record<VehicleType, string> = {
  THREE_WHEELER: 'Three-wheeler',
  FOUR_WHEELER: 'Four-wheeler',
};

export const DELIVERY_MODE: Record<DeliveryMode, string> = {
  CROSS_DOCK: 'Cross-dock',
  DIRECT: 'Direct',
  SELF: 'Self-delivery',
};

/** "Round 1 · 2:00 PM – 5:00 PM" from the Service Centre's settings. */
export function slotLabel(settings: XdSettings | undefined, slot: TripSlot | null | undefined, withTime = true): string {
  if (!slot) return '-';
  const w = settings?.windows.find((x) => x.key === slot);
  const name = w?.label ?? { R1: 'Round 1', R2: 'Round 2', EARLY_AM: 'Early-morning top-up', RETURNS: 'Returns' }[slot];
  return withTime && w ? `${name} · ${hm(w.start)} – ${hm(w.end)}` : name;
}

/** "14:00" → "2:00 PM". */
export function hm(hhmm: string): string {
  const [h, m] = hhmm.split(':').map(Number);
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`;
}

/** ISO → "2:35 PM". */
export function time(iso: string | null | undefined): string {
  if (!iso) return '-';
  return new Date(iso).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true }).toUpperCase();
}

/** ISO → "12 Nov, 2:35 PM". */
export function dateTime(iso: string | null | undefined): string {
  if (!iso) return '-';
  const d = new Date(iso);
  return `${d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}, ${time(iso)}`;
}

/** "2026-11-13" → "Fri, 13 Nov". */
export function day(ymd: string | null | undefined): string {
  if (!ymd) return '-';
  return new Date(`${ymd}T00:00:00`).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
}

export function kg(v: number): string {
  return `${(Math.round(v * 10) / 10).toLocaleString('en-IN', { maximumFractionDigits: 1 })} kg`;
}

export function rupees(v: number): string {
  return `₹${Math.round(v).toLocaleString('en-IN')}`;
}

export const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;
