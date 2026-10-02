import { useEffect, useState } from 'react';
import { ClipboardList, Home, Menu, Package, Users } from 'lucide-react';
import { EmptyState, StatusBar, TabBar, Toast } from '@mockups/ui';
import { useI18n } from '@mockups/i18n';
import type { SellerOrder } from '@mockups/types';
import { tabOf, useOrders, type OrderTab } from './orders';
import { OrdersScreen, type OrderAction } from './screens/OrdersScreen';
import { OrderDetailScreen } from './screens/OrderDetailScreen';
import { CancelSheet, ConfirmSheet, DeliverSheet } from './sheets/OrderActionSheets';

type Tab = 'home' | 'orders' | 'products' | 'customers' | 'more';

// `?empty` opens a day-one seller with no orders, so every empty state can be
// shown. `?lang=te` (or hi / ta / en) switches language until Login has a picker.
const PARAMS = new URLSearchParams(window.location.search);
const EMPTY = PARAMS.has('empty');
const LANG = PARAMS.get('lang');

export default function App() {
  const { t, setLang } = useI18n();
  useEffect(() => {
    if (LANG === 'en' || LANG === 'te' || LANG === 'hi' || LANG === 'ta') setLang(LANG);
  }, [setLang]);
  const store = useOrders(EMPTY);
  const [tab, setTab] = useState<Tab>('orders');
  const [orderTab, setOrderTab] = useState<OrderTab>('new');
  const [openId, setOpenId] = useState<string | null>(null);
  const [sheet, setSheet] = useState<{ action: OrderAction; orders: SellerOrder[] } | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const open = openId ? store.orders.find((o) => o.id === openId) : undefined;
  const newCount = store.orders.filter((o) => tabOf(o) === 'new').length;
  const closeSheet = () => setSheet(null);
  const done = (key: string, n: number) => {
    setSheet(null);
    setToast(t(n === 1 ? `${key}_one` : `${key}_many`).replace('{n}', String(n)));
  };

  // Confirming one order is one tap — it is the everyday action and can be
  // cancelled later. Bulk confirm, cancel and deliver ask first.
  const onAction = (action: OrderAction, orders: SellerOrder[]) => {
    if (action === 'confirm' && orders.length === 1) {
      store.confirm([orders[0].id]);
      done('seller.toast.confirmed', 1);
    } else setSheet({ action, orders });
  };

  return (
    <div className="grid min-h-dvh place-items-center bg-shell p-4">
      {/* 390×844 ≈ iPhone 15. `relative` is load-bearing: Sheet and Toast
          position against it, not the browser window. */}
      <div className="relative flex h-[844px] w-[390px] flex-col overflow-hidden rounded-[2rem] bg-background text-foreground shadow-xl">
        <StatusBar />
        <div className="min-h-0 flex-1">
          {open ? (
            <OrderDetailScreen
              key={open.id}
              order={open}
              onBack={() => setOpenId(null)}
              onAction={(a, o) => onAction(a, [o])}
              onSaveAndConfirm={(lines) => {
                store.saveLines(open.id, lines);
                store.confirm([open.id]);
                done('seller.toast.confirmed', 1);
              }}
            />
          ) : tab === 'orders' ? (
            <OrdersScreen orders={store.orders} tab={orderTab} onTabChange={setOrderTab} onOpen={setOpenId} onAction={onAction} />
          ) : (
            <div className="grid h-full place-items-center p-6">
              <EmptyState title={t(`seller.nav.${tab}`)} description="This page is next in the build." />
            </div>
          )}
        </div>
        {!open && (
          <TabBar<Tab>
            tabs={[
              { id: 'home', label: t('seller.nav.home'), icon: Home },
              { id: 'orders', label: t('seller.nav.orders'), icon: ClipboardList, badge: newCount },
              { id: 'products', label: t('seller.nav.products'), icon: Package },
              { id: 'customers', label: t('seller.nav.customers'), icon: Users },
              { id: 'more', label: t('seller.nav.more'), icon: Menu },
            ]}
            active={tab}
            onSelect={setTab}
          />
        )}

        <ConfirmSheet
          orders={sheet?.action === 'confirm' ? sheet.orders : []}
          onClose={closeSheet}
          onConfirm={(ids) => {
            store.confirm(ids);
            done('seller.toast.confirmed', ids.length);
          }}
        />
        <CancelSheet
          orders={sheet?.action === 'cancel' ? sheet.orders : []}
          onClose={closeSheet}
          onCancel={(ids, reason) => {
            store.cancel(ids, reason);
            done('seller.toast.cancelled', ids.length);
          }}
        />
        <DeliverSheet
          orders={sheet?.action === 'deliver' ? sheet.orders : []}
          onClose={closeSheet}
          onDeliver={(ids) => {
            store.deliver(ids);
            done('seller.toast.delivered', ids.length);
          }}
        />
        <Toast open={!!toast} variant="success" message={toast} onClose={() => setToast(null)} />
      </div>
    </div>
  );
}
