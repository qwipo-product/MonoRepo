// Rider trip display helpers shared by the store's Trips list and Trip details (LBNP layout).
import type { RunStatus, XdCds, XdRunRow } from '../../types/crossDock';
import type { LbStop } from '../cross-dock/lbnp/LbTripList';
import { rupees, time } from '../service-centre/labels';

export const RUN_BADGE: Record<RunStatus, { label: string; cls: string }> = {
  PLANNED: { label: 'Planned', cls: 'planned' },
  OUT: { label: 'In Progress', cls: 'in-progress' },
  COMPLETED: { label: 'Completed', cls: 'completed' },
  CANCELLED: { label: 'Cancelled', cls: 'cancelled' },
};

/** "hh:mm" since the rider left (until back at the store). */
export function runCovered(x: XdRunRow): string {
  if (!x.startedAt) return '-';
  const mins = Math.max(0, Math.round(((x.completedAt ? new Date(x.completedAt).getTime() : Date.now()) - new Date(x.startedAt).getTime()) / 60000));
  return `${String(Math.floor(mins / 60)).padStart(2, '0')}:${String(mins % 60).padStart(2, '0')}`;
}

export function runStops(store: XdCds, x: XdRunRow): LbStop[] {
  return [
    { name: store.name, address: store.address, time: x.startedAt ? `Left ${time(x.startedAt)}` : 'Not left yet', otp: '-' },
    ...x.stops.map((s) => {
      const returnedAll = s.status === 'DONE' && s.returnedOrderIds.length === s.orderIds.length;
      const partial = s.status === 'DONE' && s.returnedOrderIds.length > 0 && !returnedAll;
      return {
        name: s.retailerName,
        address: `${s.locality} · ${s.orders.length} order${s.orders.length === 1 ? '' : 's'} · ${rupees(s.amountDue)}`,
        time: s.doneAt ? `${time(s.doneAt)} · ${s.cash && s.upi ? 'cash + UPI' : s.cash ? 'cash' : s.upi ? 'UPI' : 'nothing due'}` : 'Time not available',
        otp: s.otp,
        status: s.status === 'DONE' ? (returnedAll ? 'Returned' : partial ? 'Partial Delivered' : 'Delivered') : x.status === 'OUT' ? 'Out For Delivery' : 'Pending',
        statusClass: returnedAll ? 'returned' : partial ? 'partialdelivered' : s.status === 'DONE' ? 'delivered' : 'pending',
      };
    }),
  ];
}
