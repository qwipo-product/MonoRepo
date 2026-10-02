import type { ReactNode } from 'react';
import { AlertTriangle, ChevronRight, ClipboardList, PackageX, Route, Truck, Zap } from 'lucide-react';
import { Badge, Button, InlineMessage } from '@mockups/ui';
import { formatInrExact } from '@mockups/components';
import { useI18n } from '@mockups/i18n';
import type { SellerAccount, SellerOrder } from '@mockups/types';
import { isCompliant, TODAY, type Catalog } from '../catalog';
import { formatDay } from '../format';
import { orderTotal, tabOf, type OrderTab } from '../orders';
import type { ProductFilter } from './ProductsScreen';

/* Home — what needs doing now, not charts. The portal's dashboard is still
   "coming soon"; on a phone the useful home is: new orders to confirm, what
   goes out on which day and beat, and products that can't be sold. */
export function HomeScreen({
  account,
  orders,
  catalog,
  acceptingOrders,
  onOrders,
  onProducts,
  onStoreSettings,
}: {
  account: SellerAccount;
  orders: SellerOrder[];
  catalog: Catalog;
  acceptingOrders: boolean;
  onOrders: (tab: OrderTab, day?: string) => void;
  onProducts: (filter: ProductFilter) => void;
  onStoreSettings: () => void;
}) {
  const { t } = useI18n();
  const fresh = orders.filter((o) => tabOf(o) === 'new');
  const today = orders.filter((o) => o.placedAt.startsWith(TODAY) && o.status !== 'CANCELLED');
  const outOfStock = catalog.skus.filter((s) => s.active && !s.inStock).length;
  const missing = catalog.skus.filter((s) => !isCompliant(s)).length;

  // Upcoming deliveries: confirmed and new orders, by day, then by beat.
  const open = orders.filter((o) => tabOf(o) === 'confirmed' || tabOf(o) === 'new');
  const days = [...new Set(open.map((o) => o.deliveryDate))].sort().slice(0, 3);

  return (
    <div className="flex h-full flex-col">
      <header className="border-b border-border bg-card px-4 py-3 shadow-sm">
        <div className="text-xs text-foreground-secondary">{t('seller.home.hello').replace('{name}', account.contactName.split(' ')[0])}</div>
        <div className="flex items-center justify-between gap-2">
          <h1 className="truncate text-base font-semibold">{account.name}</h1>
          <Badge variant={acceptingOrders ? 'success' : 'warning'} className="shrink-0">
            {t(acceptingOrders ? 'seller.home.open' : 'seller.home.paused')}
          </Badge>
        </div>
      </header>

      <div className="no-scrollbar flex-1 space-y-3 overflow-y-auto bg-background-subtle p-3">
        {!acceptingOrders && (
          <InlineMessage
            variant="warning"
            title={t('seller.home.paused_title')}
            description={t('seller.home.paused_help')}
            action={
              <Button size="sm" variant="soft" onClick={onStoreSettings}>
                {t('seller.home.turn_on')}
              </Button>
            }
          />
        )}

        {/* New orders — the one thing that can't wait */}
        <section className="rounded-lg border border-border bg-card p-3 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-md bg-primary-soft text-primary">
              <ClipboardList size={20} />
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-base font-semibold">
                {fresh.length === 0 ? t('seller.home.no_new') : t(fresh.length === 1 ? 'seller.home.new_one' : 'seller.home.new_many').replace('{n}', String(fresh.length))}
              </div>
              <div className="text-xs text-foreground-secondary">
                {t('seller.home.today').replace('{n}', String(today.length)).replace('{value}', formatInrExact(today.reduce((s, o) => s + orderTotal(o), 0)))}
              </div>
            </div>
          </div>
          {fresh.length > 0 && (
            <Button fullWidth className="mt-3" onClick={() => onOrders('new')}>
              {t('seller.home.review_new')}
            </Button>
          )}
        </section>

        {/* Deliveries by day and beat */}
        <section className="rounded-lg border border-border bg-card shadow-sm">
          <div className="flex items-center gap-2 border-b border-border px-3 py-2.5 text-sm font-semibold">
            <Truck size={16} className="text-primary" />
            {t('seller.home.deliveries')}
          </div>
          {days.length === 0 ? (
            <p className="p-3 text-sm text-foreground-secondary">{t('seller.home.no_deliveries')}</p>
          ) : (
            <ul className="divide-y divide-border">
              {days.map((d) => {
                const onDay = open.filter((o) => o.deliveryDate === d);
                const beats = [...new Set(onDay.map((o) => o.beatName))];
                return (
                  <li key={d}>
                    <button onClick={() => onOrders(onDay.some((o) => tabOf(o) === 'new') ? 'new' : 'confirmed', d)} className="flex w-full items-start gap-3 p-3 text-left active:bg-muted">
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-semibold">{formatDay(d)}</div>
                        <ul className="mt-1 space-y-0.5">
                          {beats.map((b) => (
                            <li key={b ?? 'quick'} className="flex items-center gap-1.5 text-xs text-foreground-secondary">
                              {b ? <Route size={12} className="text-primary" /> : <Zap size={12} className="text-warning-foreground" />}
                              <span className="truncate">{b ?? t('seller.orders.quick_delivery')}</span>
                              <span className="shrink-0">· {onDay.filter((o) => o.beatName === b).length}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <span className="shrink-0 text-right">
                        <span className="block text-sm font-semibold">{t(onDay.length === 1 ? 'seller.home.orders_one' : 'seller.home.orders_many').replace('{n}', String(onDay.length))}</span>
                        <span className="block text-xs text-foreground-secondary tabular-nums">{formatInrExact(onDay.reduce((s, o) => s + orderTotal(o), 0))}</span>
                      </span>
                      <ChevronRight size={16} className="mt-0.5 shrink-0 text-foreground-secondary" />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* Products that can't be sold right now */}
        {(outOfStock > 0 || missing > 0) && (
          <section className="rounded-lg border border-border bg-card shadow-sm">
            <div className="flex items-center gap-2 border-b border-border px-3 py-2.5 text-sm font-semibold">
              <AlertTriangle size={16} className="text-warning-foreground" />
              {t('seller.home.attention')}
            </div>
            <ul className="divide-y divide-border">
              {outOfStock > 0 && (
                <AttentionRow icon={<PackageX size={16} />} label={t('seller.home.out_of_stock').replace('{n}', String(outOfStock))} onClick={() => onProducts('out')} />
              )}
              {missing > 0 && (
                <AttentionRow icon={<AlertTriangle size={16} />} label={t('seller.home.missing').replace('{n}', String(missing))} onClick={() => onProducts('missing')} />
              )}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}

function AttentionRow({ icon, label, onClick }: { icon: ReactNode; label: string; onClick: () => void }) {
  return (
    <li>
      <button onClick={onClick} className="flex w-full items-center gap-3 p-3 text-left text-sm active:bg-muted">
        <span className="text-warning-foreground">{icon}</span>
        <span className="flex-1 font-medium">{label}</span>
        <ChevronRight size={16} className="text-foreground-secondary" />
      </button>
    </li>
  );
}
