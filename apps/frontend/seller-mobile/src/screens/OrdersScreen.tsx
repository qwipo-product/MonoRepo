import { useState, type ReactNode } from 'react';
import { AlertTriangle, ClipboardList, MapPin, MoreHorizontal, PackageCheck, Search, SlidersHorizontal, Store, Truck, XCircle } from 'lucide-react';
import { Button, Chip, EmptyState, Input, Sheet, cn } from '@mockups/ui';
import { OrderListCard, formatInrExact } from '@mockups/components';
import { useI18n } from '@mockups/i18n';
import type { SellerAccount, SellerOrder } from '@mockups/types';
import { DeliveryPanel, LogisticsBlock } from '../components/DeliveryPanel';
import { ScreenHeader } from '../components/ScreenHeader';
import { OrdersFilterSheet } from '../sheets/OrdersFilterSheet';
import { RouteMapSheet } from '../sheets/RouteMapSheet';
import { formatDay, formatPlacedAt } from '../format';
import {
  NO_FILTERS,
  cancelReasonText,
  filterCount,
  liveLines,
  matchesFilters,
  orderTotal,
  tabOf,
  unavailableLines,
  type OrderFilters,
  type OrderTab,
} from '../orders';

export type OrderAction = 'confirm' | 'cancel' | 'deliver' | 'logistics' | 'darkstore';

/* Orders — the portal's tabs (All · New · Confirmed · Logistics · Delivered ·
   Cancelled) on a phone. Logistics shows only when the seller has a 3PL or
   dark-store connector. The next step sits on each card; "Select" turns on
   tick boxes and the bar at the bottom acts on all of them, like the
   portal's bulk actions. Every other filter lives in one Filter sheet. */
export function OrdersScreen({
  orders,
  account,
  tab,
  onTabChange,
  day,
  onDayChange,
  onOpen,
  onAction,
}: {
  orders: SellerOrder[];
  account: SellerAccount;
  tab: OrderTab;
  onTabChange: (tab: OrderTab) => void;
  /** Delivery-day filter — held by App so Home can open Orders on a day. */
  day: string | null;
  onDayChange: (day: string | null) => void;
  onOpen: (id: string) => void;
  onAction: (action: OrderAction, orders: SellerOrder[]) => void;
}) {
  const { t } = useI18n();
  const [query, setQuery] = useState('');
  const [selecting, setSelecting] = useState(false);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState<OrderFilters>(NO_FILTERS);
  const [filterOpen, setFilterOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [mapOrders, setMapOrders] = useState<SellerOrder[]>([]);

  const hasLogisticsTab = account.hasLogistics || account.hasDarkStore;
  const tabs: OrderTab[] = ['all', 'new', 'confirmed', ...(hasLogisticsTab ? (['logistics'] as const) : []), 'delivered', 'cancelled'];

  // Delivery-day chips on New, Confirmed and Logistics, like the portal: pick
  // a day, then confirm or deliver that day's orders together.
  const byDay = tab === 'new' || tab === 'confirmed' || tab === 'logistics';
  const inTab = orders.filter((o) => (tab === 'all' || tabOf(o) === tab) && matchesFilters(o, filters));
  const days = [...new Set(inTab.map((o) => o.deliveryDate))].sort();
  const q = query.trim().toLowerCase();
  const shown = inTab.filter(
    (o) =>
      (!byDay || !day || o.deliveryDate === day) &&
      (!q ||
        o.buyer.storeName.toLowerCase().includes(q) ||
        o.id.toLowerCase().includes(q) ||
        o.channelOrderId?.toLowerCase().includes(q) ||
        o.beatName?.toLowerCase().includes(q) ||
        o.buyer.mobile.includes(q))
  );
  const companies = [...new Set(orders.map((o) => o.company))].sort();
  const activeFilters = filterCount(filters);

  const canBulk = tab === 'new' || tab === 'confirmed';
  const pickedOrders = shown.filter((o) => picked.has(o.id));
  const n = pickedOrders.length;
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
  const bulk = (a: OrderAction) => {
    setMoreOpen(false);
    onAction(a, pickedOrders);
  };

  return (
    <div className="flex h-full flex-col">
      <ScreenHeader
        title={t('seller.orders.title')}
        right={
          <div className="flex items-center gap-1">
            <button
              onClick={() => setFilterOpen(true)}
              aria-label={t('seller.ofilter.title')}
              className="relative grid h-9 w-9 place-items-center rounded-md text-foreground hover:bg-muted"
            >
              <SlidersHorizontal size={18} />
              {activeFilters > 0 && (
                <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
                  {activeFilters}
                </span>
              )}
            </button>
            {canBulk && shown.length > 0 && (
              <Button variant="ghost" size="sm" onClick={selecting ? stopSelecting : () => setSelecting(true)}>
                {selecting ? t('seller.action.done') : t('seller.orders.select')}
              </Button>
            )}
          </div>
        }
      />

      <div className="space-y-2 border-b border-border bg-card px-3 pb-3 pt-2">
        {/* Same look as the segmented control, but scrolls when six tabs don't fit. */}
        <div role="tablist" className="no-scrollbar flex gap-1 overflow-x-auto rounded-lg bg-muted p-1">
          {tabs.map((k) => (
            <button
              key={k}
              role="tab"
              aria-selected={tab === k}
              onClick={() => {
                onTabChange(k);
                onDayChange(null);
                stopSelecting();
              }}
              className={cn(
                'h-9 shrink-0 grow rounded-md px-3 text-sm font-medium transition-colors',
                tab === k ? 'bg-card text-foreground shadow-sm' : 'text-foreground-secondary'
              )}
            >
              {t(`seller.orders.tab.${k}`)}
            </button>
          ))}
        </div>
        <label className="relative block">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-foreground-secondary" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t('seller.orders.search')} aria-label={t('seller.orders.search')} className="pl-9" />
        </label>
        {byDay && days.length > 1 && (
          <div className="no-scrollbar -mx-3 flex gap-2 overflow-x-auto px-3">
            <Chip selected={!day} onClick={() => onDayChange(null)}>
              {t('seller.orders.all_days')} ({inTab.length})
            </Chip>
            {days.map((d) => (
              <Chip key={d} selected={day === d} onClick={() => onDayChange(d)}>
                {formatDay(d)} ({inTab.filter((o) => o.deliveryDate === d).length})
              </Chip>
            ))}
          </div>
        )}
        {selecting && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-foreground-secondary">{t('seller.orders.selected').replace('{n}', String(n))}</span>
            <button className="font-semibold text-primary" onClick={() => setPicked(n === shown.length ? new Set() : new Set(shown.map((o) => o.id)))}>
              {n === shown.length ? t('seller.orders.clear_all') : t('seller.orders.select_all')}
            </button>
          </div>
        )}
      </div>

      <div className="no-scrollbar flex-1 space-y-3 overflow-y-auto bg-background-subtle p-3">
        {tab === 'logistics' && <p className="rounded-md bg-info-subtle px-3 py-2 text-xs text-info-foreground">{t('seller.logistics.tab_note')}</p>}
        {/* The portal's summary strip, as one line inside the list. */}
        {byDay && shown.length > 0 && (
          <p className="px-1 text-xs text-foreground-secondary">
            {t('seller.orders.summary')
              .replace('{orders}', String(shown.length))
              .replace('{stores}', String(new Set(shown.map((o) => o.buyer.mobile)).size))
              .replace('{value}', formatInrExact(shown.reduce((sum, o) => sum + orderTotal(o), 0)))}
          </p>
        )}
        {shown.length === 0 ? (
          <EmptyState
            icon={<ClipboardList strokeWidth={1.75} />}
            title={query || activeFilters ? t('seller.orders.no_match') : t(`seller.orders.empty.${tab}`)}
            description={query || activeFilters ? undefined : t(`seller.orders.empty.${tab}_help`)}
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

      {selecting && n > 0 && (
        <div className="flex gap-2 border-t border-border bg-card p-3 shadow-[var(--shadow-bar-top)]">
          {tab === 'new' ? (
            <>
              <Button variant="secondary" className="flex-1" onClick={() => onAction('cancel', pickedOrders)}>
                {t('seller.action.cancel_n').replace('{n}', String(n))}
              </Button>
              <Button className="flex-[1.4]" onClick={() => onAction('confirm', pickedOrders)}>
                {t('seller.action.confirm_n').replace('{n}', String(n))}
              </Button>
            </>
          ) : (
            <Button className="flex-1" onClick={() => onAction('deliver', pickedOrders)}>
              {t('seller.action.deliver_n').replace('{n}', String(n))}
            </Button>
          )}
          <Button variant="secondary" size="icon" aria-label={t('seller.bulk.more')} onClick={() => setMoreOpen(true)}>
            <MoreHorizontal size={18} />
          </Button>
        </div>
      )}

      {/* The rest of the portal's bulk "Actions" menu. */}
      <Sheet open={moreOpen} onClose={() => setMoreOpen(false)} title={t('seller.bulk.title').replace('{n}', String(n))}>
        <div className="space-y-2">
          {tab === 'confirmed' && (
            <>
              {account.hasLogistics && (
                <BulkRow icon={<Truck size={18} />} label={t('seller.bulk.logistics').replace('{n}', String(n))} onClick={() => bulk('logistics')} />
              )}
              {account.hasDarkStore && (
                <BulkRow icon={<Store size={18} />} label={t('seller.bulk.darkstore').replace('{n}', String(n))} onClick={() => bulk('darkstore')} />
              )}
              <BulkRow icon={<XCircle size={18} />} label={t('seller.action.cancel_n').replace('{n}', String(n))} onClick={() => bulk('cancel')} danger />
            </>
          )}
          <BulkRow
            icon={<MapPin size={18} />}
            label={t('seller.bulk.map').replace('{n}', String(n))}
            onClick={() => {
              setMoreOpen(false);
              setMapOrders(pickedOrders);
            }}
          />
        </div>
      </Sheet>

      <OrdersFilterSheet
        open={filterOpen}
        filters={filters}
        companies={companies}
        showCancelledBy={tab === 'cancelled' || tab === 'all'}
        onChange={setFilters}
        onClose={() => setFilterOpen(false)}
      />
      <RouteMapSheet orders={mapOrders} onClose={() => setMapOrders([])} />
    </div>
  );
}

function BulkRow({ icon, label, onClick, danger }: { icon: ReactNode; label: string; onClick: () => void; danger?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-3 rounded-lg border border-border p-3 text-left text-sm font-semibold active:bg-muted',
        danger ? 'text-error-foreground' : 'text-foreground'
      )}
    >
      <span className={danger ? 'text-error-foreground' : 'text-primary'}>{icon}</span>
      {label}
    </button>
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
      statusLabel={t(order.cancelledBy ? `seller.status.cancelled_by.${order.cancelledBy}` : `seller.status.${order.status}`)}
      meta={
        <>
          <span className="mb-2 block">
            <span className="font-semibold text-foreground">{order.company}</span> · {t('seller.orders.placed').replace('{when}', formatPlacedAt(order.placedAt))}
          </span>
          {tab === 'cancelled' ? (
            <span className="block">
              {order.buyer.area}, {order.buyer.city}
              <span className="mt-1 block font-medium text-error-foreground">{cancelReasonText(order, t)}</span>
            </span>
          ) : (
            <span className="block space-y-2">
              <DeliveryPanel order={order} compact />
              {order.logistics && <LogisticsBlock logistics={order.logistics} />}
            </span>
          )}
        </>
      }
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
            <Button size="sm" onClick={() => onAction('confirm')}>
              {t('seller.action.confirm')}
            </Button>
          </div>
        ) : tab === 'confirmed' ? (
          <Button size="sm" fullWidth onClick={() => onAction('deliver')}>
            <PackageCheck size={15} />
            {t('seller.action.deliver')}
          </Button>
        ) : undefined
      }
    />
  );
}
