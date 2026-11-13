// Service Centre trip display helpers shared by the Trips list and Trip details (LBNP layout).
import type { TripStatus, XdTripRow } from '../../types/crossDock';
import type { LbStop } from '../cross-dock/lbnp/LbTripList';
import { dateTime, kg, time } from './labels';

export const TRIP_BADGE: Record<TripStatus, { label: string; cls: string }> = {
  PLANNED: { label: 'Planned', cls: 'planned' },
  IN_PROGRESS: { label: 'In Progress', cls: 'in-progress' },
  COMPLETED: { label: 'Completed', cls: 'completed' },
  CANCELLED: { label: 'Cancelled', cls: 'cancelled' },
};

export const covered = (t: XdTripRow) => {
  if (!t.startedAt) return '-';
  const end = t.completedAt ? new Date(t.completedAt).getTime() : Date.now();
  const mins = Math.max(0, Math.round((end - new Date(t.startedAt).getTime()) / 60000));
  return `${String(Math.floor(mins / 60)).padStart(2, '0')}:${String(mins % 60).padStart(2, '0')}`;
};

/** Stops as the trip list / details show them (yard first). */
export function tripStops(t: XdTripRow): LbStop[] {
  return [
    { name: 'Service Centre yard', address: 'Yard 3, IDA Balanagar', time: t.startedAt ? `Left ${time(t.startedAt)}` : 'Not started', otp: '-' },
    ...t.stops.map((s) => {
      const storeDrop = t.kind === 'PICKUP' && s.action === 'DROP';
      const status =
        s.status === 'DONE'
          ? storeDrop
            ? 'Received (OTP verified)'
            : s.action === 'PICKUP'
              ? t.kind === 'RETURN' ? 'Collected' : 'Picked up'
              : 'Handed back'
          : storeDrop && s.grn
            ? 'GRN done, awaiting OTP'
            : storeDrop && t.stops.every((x) => x.action === 'DROP' || x.status === 'DONE') && t.status === 'IN_PROGRESS'
              ? 'At store, GRN pending'
              : 'Pending';
      return {
        name: `${s.action === 'PICKUP' ? (t.kind === 'RETURN' ? 'Collect at' : 'Pick up at') : t.kind === 'RETURN' ? 'Hand back to' : 'Drop at'} ${s.placeName}`,
        address: `${s.locality} · ${s.orderIds.length || s.returnIds.length} ${t.kind === 'RETURN' ? 'returns' : 'orders'} · ${kg(s.weightKg)}`,
        time: s.doneAt ? dateTime(s.doneAt) : 'Not yet',
        otp: storeDrop ? 'With store' : s.otp,
        status,
        statusClass: s.status === 'DONE' ? 'delivered' : 'pending',
      };
    }),
  ];
}
