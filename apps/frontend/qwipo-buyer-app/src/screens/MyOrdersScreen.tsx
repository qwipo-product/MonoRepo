import { useMemo, useState } from 'react';
import { Icon, StatusBar } from '../components/Icons';
import BottomNav from '../components/BottomNav';
import { SheetHeader, useSheetSwipe } from '../components/SheetBase';
import { orderHistoryList } from '@mockups/mock-data';
import { useI18n } from '@mockups/i18n';
import CopyText from '../components/CopyText';
import CancelOrderDialog from '../components/CancelOrderDialog';

const TRACKING_STEPS: { id: string; label: string }[] = [
  { id: 'placed', label: 'Placed' },
  { id: 'confirmed', label: 'Confirmed' },
  { id: 'progress', label: 'In Progress' },
  { id: 'out', label: 'Out for Delivery' },
  { id: 'delivered', label: 'Delivered' },
];

function statusToIdx(status: string): number {
  if (status === 'delivered') return 5;
  if (status === 'in_transit') return 4;
  if (status === 'placed') return 1;
  return 3; // processing
}

export default function MyOrdersScreen({ onBack, onOpenDetails, cartCount, onNavigate }: any) {
  const { t } = useI18n();
  const [tracking, setTracking] = useState<any>(null);
  const [cancelTarget, setCancelTarget] = useState<any>(null);
  const [cancelledIds, setCancelledIds] = useState<Set<string>>(new Set());

  // All distributor + wholesaler orders in one list — no tabs.
  const visible = useMemo(
    () =>
      orderHistoryList.map((o: any) =>
        cancelledIds.has(o.id) ? { ...o, status: 'cancelled', statusLabel: 'Cancelled' } : o
      ),
    [cancelledIds]
  );

  return (
    <>
      <StatusBar />
      <div className="screen-body">
        {/* Sticky cluster: header + pill tabs stay pinned while orders scroll. */}
        <div className="dl-sticky-top">
          <div className="top-bar">
            <button className="icon-btn" onClick={onBack}>
              <Icon.Back />
            </button>
            <div className="top-title">
              <h1>{t('orders.my_orders')}</h1>
            </div>
          </div>
        </div>

        <div className="orders-list">
          {visible.length === 0 && (
            <div className="reorder-empty">
              <div className="reorder-empty-emoji">📭</div>
              <div className="reorder-empty-title">No orders yet</div>
              <div className="reorder-empty-sub">
                Your orders will appear here.
              </div>
            </div>
          )}

          {visible.map((o: any) => {
            const isPlaced = o.status === 'placed';
            const isCancelled = o.status === 'cancelled';
            const isDelivered = o.status === 'delivered';
            const isCancellable = isPlaced || o.status === 'in_transit' || o.status === 'processing';
            const orderId = `QWIP${o.id.replace('QW', '')}204`;

            return (
              <div key={o.id} className="mo-card">
                <button
                  className="mo-card-top"
                  onClick={() => onOpenDetails?.(o)}
                  aria-label={`Open order ${orderId}`}
                >
                  <span className="mo-seller-name">{o.seller}</span>
                  <span className={`mo-status-pill status-${o.status}`}>{o.statusLabel}</span>
                </button>

                <div className="mo-meta">
                  {o.itemCount} {o.itemCount === 1 ? 'item' : 'items'} · Placed {o.placedAt}
                </div>

                <div className="mo-id-row" onClick={(e) => e.stopPropagation()}>
                  <CopyText value={orderId} className="mo-id-pill" />
                </div>

                <div className="mo-info-box">
                  <div className="mo-info-col">
                    <div className="mo-info-label">Grand Total</div>
                    <div className="mo-info-value">
                      ₹{o.total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                  <div className="mo-info-col right">
                    <div className="mo-info-label">Expected Delivery</div>
                    <div className="mo-info-value">{o.eta}</div>
                  </div>
                </div>

                <div className="mo-actions">
                  {isDelivered ? (
                    <button className="mo-invoice-btn">
                      <Icon.Image /> Invoice
                    </button>
                  ) : !isCancelled ? (
                    <>
                      <button className="mo-cancel-btn" onClick={() => setCancelTarget(o)}>
                        {t('orders.cancel')}
                      </button>
                      <button className="mo-track-btn" onClick={() => setTracking(o)}>
                        {t('orders.track_order')}
                      </button>
                    </>
                  ) : null}
                </div>

                {isCancellable && (
                  <div className="mo-cancel-note">You can cancel this order before {o.eta}</div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {tracking && (
        <TrackingSheet order={tracking} onClose={() => setTracking(null)} />
      )}

      {cancelTarget && (
        <CancelOrderDialog
          orderId={cancelTarget.id}
          onClose={() => setCancelTarget(null)}
          onConfirm={({ orderId }: { orderId: string }) => {
            setCancelledIds((prev) => new Set(prev).add(orderId));
            setCancelTarget(null);
          }}
        />
      )}

      <BottomNav active="profile" cartCount={cartCount} onNavigate={onNavigate} />
    </>
  );
}

function TrackingSheet({ order, onClose }: any) {
  const { dragHandlers, sheetStyle } = useSheetSwipe(onClose);
  const activeIdx = statusToIdx(order.status);

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" style={sheetStyle} onClick={(e) => e.stopPropagation()}>
        <SheetHeader
          title="Tracking Details"
          onClose={onClose}
          dragHandlers={dragHandlers}
        />

        <div className="sheet-body" style={{ padding: '20px' }}>
          <div className="tracking-timeline">
            {TRACKING_STEPS.map((step, i) => {
              const done = i < activeIdx;
              return (
                <div key={step.id} className="tracking-step">
                  <div className="tracking-marker">
                    <div className={`tracking-dot ${done ? 'done' : ''}`}>
                      {done && <Icon.Check />}
                    </div>
                    {i < TRACKING_STEPS.length - 1 && (
                      <div className={`tracking-line ${done ? 'done' : ''}`} />
                    )}
                  </div>
                  <div className={`tracking-label ${done ? 'done' : ''}`}>
                    {step.label}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
