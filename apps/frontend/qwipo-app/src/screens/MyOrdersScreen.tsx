import { useMemo, useState } from 'react';
import { Image, Check } from 'lucide-react';
import { orders as orderHistoryList } from '../data';
import StatusBar from '../components/StatusBar';
import ScreenHeader from '../components/ScreenHeader';
import CopyText from '../components/CopyText';
import ConfirmDialog from '../components/ConfirmDialog';
import BottomSheet from '../components/BottomSheet';

const TRACKING_STEPS = ['Placed', 'Confirmed', 'In Progress', 'Out for Delivery', 'Delivered'];
const statusToIdx = (s: string) => (s === 'delivered' ? 5 : s === 'in_transit' ? 4 : s === 'placed' ? 1 : 3);

const STATUS_TINT: Record<string, string> = {
  placed: 'bg-blue-50 text-blue-700',
  in_transit: 'bg-amber-50 text-amber-700',
  processing: 'bg-amber-50 text-amber-700',
  delivered: 'bg-emerald-50 text-emerald-700',
  cancelled: 'bg-red-50 text-red-700',
};

export default function MyOrdersScreen({ onBack, onOpenDetails }: any) {
  const [tracking, setTracking] = useState<any>(null);
  const [cancelTarget, setCancelTarget] = useState<any>(null);
  const [cancelledIds, setCancelledIds] = useState<Set<string>>(new Set());

  const visible = useMemo(
    () => (orderHistoryList as any[]).map((o) => (cancelledIds.has(o.id) ? { ...o, status: 'cancelled', statusLabel: 'Cancelled' } : o)),
    [cancelledIds]
  );

  return (
    <div className="relative flex h-full flex-col bg-gray-50 text-foreground">
      <div className="flex-shrink-0 border-b border-border bg-card shadow-sm">
        <StatusBar />
        <ScreenHeader title="My Orders" onBack={onBack} />
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {visible.map((o: any) => {
          const isCancelled = o.status === 'cancelled';
          const isDelivered = o.status === 'delivered';
          const isCancellable = ['placed', 'in_transit', 'processing'].includes(o.status);
          const orderId = `QWIP${o.id.replace('QW', '')}204`;
          return (
            <div key={o.id} className="rounded-xl border border-border bg-card p-3 shadow-sm">
              <button onClick={() => onOpenDetails?.(o)} className="flex w-full items-center justify-between gap-2 text-left" aria-label={`Open order ${orderId}`}>
                <span className="truncate text-sm font-semibold">{o.seller}</span>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${STATUS_TINT[o.status] || 'bg-muted text-muted-foreground'}`}>{o.statusLabel}</span>
              </button>
              <div className="mt-1 text-xs text-muted-foreground">{o.itemCount} {o.itemCount === 1 ? 'item' : 'items'} · Placed {o.placedAt}</div>
              <div className="mt-2"><CopyText value={orderId} className="rounded-md bg-muted px-2 py-1" /></div>

              <div className="mt-2 flex items-center justify-between rounded-lg bg-gray-50 p-2.5">
                <div>
                  <div className="text-[11px] text-muted-foreground">Grand Total</div>
                  <div className="text-sm font-semibold">₹{o.total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                </div>
                <div className="text-right">
                  <div className="text-[11px] text-muted-foreground">Expected Delivery</div>
                  <div className="text-sm font-medium">{o.eta}</div>
                </div>
              </div>

              <div className="mt-3 flex gap-2">
                {isDelivered ? (
                  <button className="flex items-center gap-1.5 rounded-md border border-border px-3 py-2 text-sm font-medium"><Image className="h-4 w-4" /> Invoice</button>
                ) : !isCancelled ? (
                  <>
                    <button onClick={() => setCancelTarget(o)} className="flex-1 rounded-md border border-border py-2 text-sm font-medium">Cancel</button>
                    <button onClick={() => setTracking(o)} className="flex-1 rounded-md bg-primary py-2 text-sm font-medium text-primary-foreground">Track Order</button>
                  </>
                ) : null}
              </div>
              {isCancellable && <div className="mt-2 text-[11px] text-muted-foreground">You can cancel this order before {o.eta}</div>}
            </div>
          );
        })}
      </div>

      {tracking && (
        <BottomSheet title="Tracking Details" onClose={() => setTracking(null)}>
          <ol className="relative ml-2">
            {TRACKING_STEPS.map((label, i) => {
              const done = i < statusToIdx(tracking.status);
              return (
                <li key={label} className="flex gap-3 pb-6 last:pb-0">
                  <div className="relative flex flex-col items-center">
                    <span className={`grid h-6 w-6 place-items-center rounded-full ${done ? 'bg-primary text-primary-foreground' : 'border border-border bg-card'}`}>{done && <Check className="h-3.5 w-3.5" />}</span>
                    {i < TRACKING_STEPS.length - 1 && <span className={`w-0.5 flex-1 ${done ? 'bg-primary' : 'bg-border'}`} />}
                  </div>
                  <span className={`pt-0.5 text-sm ${done ? 'font-medium' : 'text-muted-foreground'}`}>{label}</span>
                </li>
              );
            })}
          </ol>
        </BottomSheet>
      )}

      {cancelTarget && (
        <ConfirmDialog
          title="Do you want to cancel this order?"
          onClose={() => setCancelTarget(null)}
          onConfirm={() => { setCancelledIds((prev) => new Set(prev).add(cancelTarget.id)); setCancelTarget(null); }}
        />
      )}
    </div>
  );
}
