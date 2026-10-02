import { useState } from 'react';
import { AlertTriangle, ClipboardList, Search } from 'lucide-react';
import { Button, Chip, EmptyState, Input, SegmentedControl } from '@mockups/ui';
import { OrderListCard } from '@mockups/components';
import { useI18n } from '@mockups/i18n';
import type { SellerOrder } from '@mockups/types';
import { DeliveryPanel } from '../components/DeliveryPanel';
import { ScreenHeader } from '../components/ScreenHeader';
import { formatDay } from '../format';
import { liveLines, orderTotal, tabOf, unavailableLines, type OrderTab } from '../orders';

export type OrderAction = 'confirm' | 'cancel' | 'deliver';

/* Orders — the portal's tabs (New · Confirmed · Delivered · Cancelled) on a
   phone. The next step sits on each card, so most orders never need opening.
   "Select" turns on tick boxes; the bar at the bottom then acts on all of
   them at once, like the portal's bulk confirm / cancel / deliver. */
export function OrdersScreen({
  orders,
  tab,
  onTabChange,
  onOpen,
  onAction,
}: {
  orders: SellerOrder[];
  tab: OrderTab;
  onTabChange: (tab: OrderTab) => void;
  onOpen: (id: string) => void;
  onAction: (action: OrderAction, orders: SellerOrder[]) => void;
}) {
  const { t } = useI18n();
  const [query, setQuery] = useState('');
  const [day, setDay] = useState<string | null>(null);
  const [selecting, setSelecting] = useState(false);
  const [picked, setPicked] = useState<Set<string>>(new Set());

  // Delivery-day chips on New and Confirmed, like the portal: pick a day,
  // then confirm or deliver that day's orders together.
  const byDay = tab === 'new' || tab === 'confirmed';
  const inTab = orders.filter((o) => tabOf(o) === tab);
  const days = [...new Set(inTab.map((o) => o.deliveryDate))].sort();
  const q = query.trim().toLowerCase();
  const shown = inTab.filter(
    (o) =>
      (!byDay || !day || o.deliveryDate === day) &&
      (!q || o.buyer.storeName.toLowerCase().includes(q) || o.id.toLowerCase().includes(q) || o.beatName?.toLowerCase().includes(q))
  );

  const canBulk = tab === 'new' || tab === 'confirmed';
  const pickedOrders = shown.filter((o) => picked.has(o.id));
  const stopSelecting = () => {
    setSelecting(false);
    setPicked(new Set());
  };
  const toggle = (id: string) =>
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  // Ticks survive "Go back" on a sheet; they clear once the action has
  // actually changed the orders.
  const [seenOrders, setSeenOrders] = useState(orders);
  if (seenOrders !== orders) {
    setSeenOrders(orders);
    stopSelecting();
  }

  return (
    <div className="flex h-full flex-col">
      <ScreenHeader
        title={t('seller.orders.title')}
        right={
          canBulk &&
          shown.length > 0 && (
            <Button variant="ghost" size="sm" onClick={selecting ? stopSelecting : () => setSelecting(true)}>
              {selecting ? t('seller.action.done') : t('seller.orders.select')}
            </Button>
          )
        }
      />

      <div className="space-y-2 border-b border-border bg-card px-3 pb-3 pt-2">
        <SegmentedControl<OrderTab>
          value={tab}
          onChange={(v) => {
            onTabChange(v);
            setDay(null);
            stopSelecting();
          }}
          options={(['new', 'confirmed', 'delivered', 'cancelled'] as const).map((k) => ({
            value: k,
            label: t(`seller.orders.tab.${k}`),
          }))}
        />
        <label className="relative block">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-foreground-secondary" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('seller.orders.search')}
            aria-label={t('seller.orders.search')}
            className="pl-9"
          />
        </label>
        {byDay && days.length > 1 && (
          <div className="no-scrollbar -mx-3 flex gap-2 overflow-x-auto px-3">
            <Chip selected={!day} onClick={() => setDay(null)}>
              {t('seller.orders.all_days')} ({inTab.length})
            </Chip>
            {days.map((d) => (
              <Chip key={d} selected={day === d} onClick={() => setDay(d)}>
                {formatDay(d)} ({inTab.filter((o) => o.deliveryDate === d).length})
              </Chip>
            ))}
          </div>
        )}
        {selecting && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-foreground-secondary">
              {t('seller.orders.selected').replace('{n}', String(pickedOrders.length))}
            </span>
            <button
              className="font-semibold text-primary"
              onClick={() => setPicked(pickedOrders.length === shown.length ? new Set() : new Set(shown.map((o) => o.id)))}
            >
              {pickedOrders.length === shown.length ? t('seller.orders.clear_all') : t('seller.orders.select_all')}
            </button>
          </div>
        )}
      </div>

      <div className="no-scrollbar flex-1 space-y-3 overflow-y-auto bg-background-subtle p-3">
        {shown.length === 0 ? (
          <EmptyState
            icon={<ClipboardList strokeWidth={1.75} />}
            title={query ? t('seller.orders.no_match') : t(`seller.orders.empty.${tab}`)}
            description={query ? undefined : t(`seller.orders.empty.${tab}_help`)}
          />
        ) : (
          shown.map((o) => (
            <OrderCard
              key={o.id}
              order={o}
              selecting={selecting}
              selected={picked.has(o.id)}
              onToggle={() => toggle(o.id)}
              onOpen={() => onOpen(o.id)}
              onAction={(a) => onAction(a, [o])}
            />
          ))
        )}
      </div>

      {selecting && pickedOrders.length > 0 && (
        <div className="flex gap-3 border-t border-border bg-card p-3 shadow-[var(--shadow-bar-top)]">
          {tab === 'new' ? (
            <>
              <Button variant="secondary" fullWidth onClick={() => onAction('cancel', pickedOrders)}>
                {t('seller.action.cancel_n').replace('{n}', String(pickedOrders.length))}
              </Button>
              <Button fullWidth onClick={() => onAction('confirm', pickedOrders)}>
                {t('seller.action.confirm_n').replace('{n}', String(pickedOrders.length))}
              </Button>
            </>
          ) : (
            <Button fullWidth onClick={() => onAction('deliver', pickedOrders)}>
              {t('seller.action.deliver_n').replace('{n}', String(pickedOrders.length))}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

function OrderCard({
  order,
  selecting,
  selected,
  onToggle,
  onOpen,
  onAction,
}: {
  order: SellerOrder;
  selecting: boolean;
  selected: boolean;
  onToggle: () => void;
  onOpen: () => void;
  onAction: (a: OrderAction) => void;
}) {
  const { t } = useI18n();
  const tab = tabOf(order);
  const missing = unavailableLines(order).length;
  const items = liveLines(order).length;

  return (
    <OrderListCard
      title={order.buyer.storeName}
      orderId={order.id}
      status={order.status}
      statusLabel={t(`seller.status.${order.status}`)}
      meta={tab === 'cancelled' ? `${order.buyer.area}, ${order.buyer.city}` : <DeliveryPanel order={order} />}
      total={orderTotal(order)}
      totalLabel={`${t('seller.orders.order_value')} · ${items} ${t(items === 1 ? 'seller.orders.item' : 'seller.orders.items')}`}
      rightLabel={t('seller.detail.payment')}
      rightValue={t(`seller.payment.${order.paymentMode}`)}
      onOpenDetails={onOpen}
      detailsLabel={t('seller.orders.details')}
      onToggleSelect={selecting ? onToggle : undefined}
      selected={selected}
      hint={
        missing > 0 && tab === 'new' ? (
          <span className="flex items-center gap-1 font-medium text-warning-foreground">
            <AlertTriangle size={13} />
            {t(missing === 1 ? 'seller.orders.unavailable_one' : 'seller.orders.unavailable_many').replace('{n}', String(missing))}
          </span>
        ) : undefined
      }
      actions={
        selecting ? undefined : tab === 'new' ? (
          <div className="grid grid-cols-2 gap-2">
            <Button variant="secondary" size="sm" onClick={() => onAction('cancel')}>
              {t('seller.action.cancel')}
            </Button>
            {missing > 0 ? (
              <Button size="sm" onClick={onOpen}>
                {t('seller.action.review')}
              </Button>
            ) : (
              <Button size="sm" onClick={() => onAction('confirm')}>
                {t('seller.action.confirm')}
              </Button>
            )}
          </div>
        ) : tab === 'confirmed' ? (
          <Button size="sm" fullWidth onClick={() => onAction('deliver')}>
            {t('seller.action.deliver')}
          </Button>
        ) : undefined
      }
    />
  );
}

