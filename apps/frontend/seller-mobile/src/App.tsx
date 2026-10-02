import { useEffect, useState } from 'react';
import { ClipboardList, Home, Menu, Package, Users } from 'lucide-react';
import { StatusBar, TabBar, Toast } from '@mockups/ui';
import { sellerAccounts } from '@mockups/mock-data';
import { useI18n } from '@mockups/i18n';
import type { SellerAccount, SellerOrder } from '@mockups/types';
import { tabOf, useOrders, type OrderTab } from './orders';
import { useCatalog } from './catalog';
import { useStoreSettings } from './store';
import { NO_SELLER_PHONE, NoSellerScreen, SelectSeller, SellerLogin, SellerOtp } from './screens/AuthScreens';
import { SessionExpiredScreen } from './screens/SessionExpiredScreen';
import { OrderSettingsScreen } from './screens/OrderSettingsScreen';
import { CommunicationScreen } from './screens/CommunicationScreen';
import { LoadGate } from './components/LoadGate';
import { LogisticsSheet } from './sheets/LogisticsSheet';
import { HomeScreen } from './screens/HomeScreen';
import { OrdersScreen, type OrderAction } from './screens/OrdersScreen';
import { OrderDetailScreen } from './screens/OrderDetailScreen';
import { ProductsScreen, type ProductFilter } from './screens/ProductsScreen';
import { ProductDetailScreen } from './screens/ProductDetailScreen';
import { EditProductScreen, type EditSection } from './screens/EditProductScreen';
import { CustomersScreen } from './screens/CustomersScreen';
import { CustomerDetailScreen } from './screens/CustomerDetailScreen';
import { MoreScreen } from './screens/MoreScreen';
import { OffersScreen } from './screens/OffersScreen';
import { CreateOfferScreen } from './screens/CreateOfferScreen';
import { ProfileScreen } from './screens/ProfileScreen';
import { StoreSettingsScreen } from './screens/StoreSettingsScreen';
import { SupportScreen } from './screens/SupportScreen';
import { CancelSheet, ConfirmSheet, DeliverSheet } from './sheets/OrderActionSheets';
import { PriceEditSheet } from './sheets/PriceEditSheet';
import { OfferSheet } from './sheets/OfferSheet';

type Tab = 'home' | 'orders' | 'products' | 'customers' | 'more';
type Page =
  | { kind: 'order'; id: string }
  | { kind: 'product'; code: string }
  | { kind: 'edit-product'; code: string }
  | { kind: 'customer'; id: string }
  | { kind: 'offers' }
  | { kind: 'create-offer'; skuCode?: string }
  | { kind: 'profile' }
  | { kind: 'order-settings' }
  | { kind: 'communication' }
  | { kind: 'store' }
  | { kind: 'support' };
type Auth = 'login' | 'otp' | 'pick' | 'no-seller' | 'expired' | 'in';

// `?empty` = a day-one seller with no data, so every empty state shows.
// `?lang=te` (or en / hi / ta) opens in that language. `?in` skips sign-in.
// `?slow` / `?fail` show every page's loading / error state (LoadGate).
const PARAMS = new URLSearchParams(window.location.search);
const EMPTY = PARAMS.has('empty');
const LANG = PARAMS.get('lang');
const SKIP_LOGIN = PARAMS.has('in');
// `?expire` ends the session 20 s after sign-in, to show the session-expired screen.
const EXPIRE = PARAMS.has('expire');

export default function App() {
  const { t, setLang } = useI18n();
  useEffect(() => {
    if (LANG === 'en' || LANG === 'te' || LANG === 'hi' || LANG === 'ta') setLang(LANG);
  }, [setLang]);

  const orders = useOrders(EMPTY);
  const catalog = useCatalog(EMPTY);
  const { store, setStore } = useStoreSettings();

  const [auth, setAuth] = useState<Auth>(SKIP_LOGIN ? 'in' : 'login');
  const [account, setAccount] = useState<SellerAccount>(sellerAccounts[0]);
  const [tab, setTab] = useState<Tab>('home');
  const [stack, setStack] = useState<Page[]>([]);
  const [orderTab, setOrderTab] = useState<OrderTab>('new');
  const [orderDay, setOrderDay] = useState<string | null>(null);
  const [productFilter, setProductFilter] = useState<ProductFilter>('all');
  const [sheet, setSheet] = useState<{ action: OrderAction; orders: SellerOrder[] } | null>(null);
  const [priceCode, setPriceCode] = useState<string | null>(null);
  const [offerCode, setOfferCode] = useState<string | null>(null);
  const [sectionEdit, setSectionEdit] = useState<{ code: string; section: EditSection } | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!EXPIRE || auth !== 'in') return;
    const timer = window.setTimeout(() => setAuth('expired'), 20000);
    return () => window.clearTimeout(timer);
  }, [auth]);

  const page = stack[stack.length - 1];
  const push = (p: Page) => setStack((s) => [...s, p]);
  const back = () => setStack((s) => s.slice(0, -1));
  const goTab = (next: Tab) => {
    setTab(next);
    setStack([]);
  };
  const newCount = orders.orders.filter((o) => tabOf(o) === 'new').length;
  const schemeFor = (code: string) => catalog.schemes.find((s) => s.skuCode === code && s.status !== 'EXPIRED');

  const done = (key: string, n: number) => {
    setSheet(null);
    setToast(t(n === 1 ? `${key}_one` : `${key}_many`).replace('{n}', String(n)));
  };
  // Confirming one order is one tap — the everyday action, and it can be
  // cancelled later. Bulk confirm, cancel and deliver ask first.
  const onOrderAction = (action: OrderAction, list: SellerOrder[]) => {
    if (action === 'confirm' && list.length === 1) {
      orders.confirm([list[0].id]);
      done('seller.toast.confirmed', 1);
    } else setSheet({ action, orders: list });
  };
  const signOut = () => {
    setAuth('login');
    setStack([]);
    setTab('home');
  };

  const screen = () => {
    if (auth === 'login') return <SellerLogin onNext={(phone) => setAuth(phone === NO_SELLER_PHONE ? 'no-seller' : 'otp')} />;
    if (auth === 'no-seller') return <NoSellerScreen onSignOut={signOut} />;
    if (auth === 'expired') return <SessionExpiredScreen onSignIn={signOut} />;
    if (auth === 'otp') return <SellerOtp onBack={() => setAuth('login')} onVerify={() => setAuth(sellerAccounts.length > 1 ? 'pick' : 'in')} />;
    if (auth === 'pick')
      return (
        <SelectSeller
          accounts={sellerAccounts}
          onPick={(a) => {
            setAccount(a);
            setAuth('in');
            setToast(t('seller.toast.welcome').replace('{name}', a.name));
          }}
          onSignOut={signOut}
        />
      );

    if (page) {
      switch (page.kind) {
        case 'order': {
          const o = orders.orders.find((x) => x.id === page.id);
          return (
            o && (
              <OrderDetailScreen
                key={o.id}
                order={o}
                onBack={back}
                account={account}
                onAction={(a, x) => onOrderAction(a, [x])}
              />
            )
          );
        }
        case 'product': {
          const s = catalog.skus.find((x) => x.code === page.code);
          return (
            s && (
              <ProductDetailScreen
                sku={s}
                scheme={schemeFor(s.code)}
                onBack={back}
                onEditPrice={() => setPriceCode(s.code)}
                onSetStock={(v) => {
                  catalog.setStock([s.code], v);
                  setToast(t(v ? 'seller.products.now_in' : 'seller.products.now_out'));
                }}
                onSetActive={(v) => {
                  catalog.setActive([s.code], v);
                  setToast(t(v ? 'seller.products.now_active' : 'seller.products.now_inactive'));
                }}
                onCreateOffer={() => push({ kind: 'create-offer', skuCode: s.code })}
                onOpenOffers={() => push({ kind: 'offers' })}
                onEdit={() => push({ kind: 'edit-product', code: s.code })}
                onEditSection={(section) => setSectionEdit({ code: s.code, section })}
              />
            )
          );
        }
        case 'edit-product': {
          const s = catalog.skus.find((x) => x.code === page.code);
          return (
            s && (
              <EditProductScreen
                key={s.code}
                sku={s}
                skus={catalog.skus}
                onBack={back}
                onSave={(next) => {
                  catalog.updateSku(next);
                  back();
                  setToast(t('seller.toast.product_saved'));
                }}
              />
            )
          );
        }
        case 'customer': {
          const c = catalog.customers.find((x) => x.customerId === page.id);
          return (
            c && (
              <CustomerDetailScreen
                customer={c}
                orders={orders.orders}
                onBack={back}
                onOpenOrder={(id) => push({ kind: 'order', id })}
                onSetCompanyStatus={(company, status) => catalog.setCompanyStatus(c.customerId, company, status)}
                onToast={setToast}
              />
            )
          );
        }
        case 'offers':
          return (
            <OffersScreen
              schemes={catalog.schemes}
              skus={catalog.skus}
              onBack={back}
              onCreate={() => push({ kind: 'create-offer' })}
              onEdit={setOfferCode}
              onSetStatus={catalog.setSchemeStatus}
              onToast={setToast}
            />
          );
        case 'create-offer':
          return (
            <CreateOfferScreen
              skus={catalog.skus}
              schemes={catalog.schemes}
              initialSkuCode={page.skuCode}
              onBack={back}
              onCreate={(scheme) => {
                catalog.addScheme(scheme);
                back();
                setToast(t('seller.toast.offer_created'));
              }}
            />
          );
        case 'profile':
          return <ProfileScreen account={account} onBack={back} />;
        case 'store':
          return <StoreSettingsScreen store={store} onChange={setStore} onBack={back} onToast={setToast} />;
        case 'support':
          return <SupportScreen onBack={back} />;
        case 'order-settings':
          return <OrderSettingsScreen store={store} onChange={setStore} onBack={back} onToast={setToast} />;
        case 'communication':
          return <CommunicationScreen store={store} onChange={setStore} onBack={back} onToast={setToast} />;
      }
    }

    switch (tab) {
      case 'home':
        return (
          <HomeScreen
            account={account}
            orders={orders.orders}
            catalog={catalog}
            acceptingOrders={store.acceptingOrders}
            onOrders={(ot, day) => {
              setOrderTab(ot);
              setOrderDay(day ?? null);
              goTab('orders');
            }}
            onProducts={(f) => {
              setProductFilter(f);
              goTab('products');
            }}
            onStoreSettings={() => push({ kind: 'store' })}
          />
        );
      case 'orders':
        return (
          <OrdersScreen
            orders={orders.orders}
            account={account}
            tab={orderTab}
            onTabChange={setOrderTab}
            day={orderDay}
            onDayChange={setOrderDay}
            onOpen={(id) => push({ kind: 'order', id })}
            onAction={onOrderAction}
          />
        );
      case 'products':
        return (
          <ProductsScreen
            catalog={catalog}
            filter={productFilter}
            onFilterChange={setProductFilter}
            onOpen={(code) => push({ kind: 'product', code })}
            onEditPrice={setPriceCode}
            onOffer={setOfferCode}
            onToast={setToast}
          />
        );
      case 'customers':
        return <CustomersScreen customers={catalog.customers} onOpen={(id) => push({ kind: 'customer', id })} />;
      case 'more':
        return (
          <MoreScreen
            account={account}
            canSwitchSeller={sellerAccounts.length > 1}
            onOpen={(p) => push({ kind: p })}
            onSwitchSeller={() => setAuth('pick')}
            onSignOut={signOut}
          />
        );
    }
  };

  const priceSku = priceCode ? catalog.skus.find((s) => s.code === priceCode) ?? null : null;
  const offerSku = offerCode ? catalog.skus.find((s) => s.code === offerCode) ?? null : null;
  const sectionSku = sectionEdit ? catalog.skus.find((s) => s.code === sectionEdit.code) : undefined;

  return (
    <div className="grid min-h-dvh place-items-center bg-shell p-4">
      {/* 390×844 ≈ iPhone 15. `relative` is load-bearing: Sheet and Toast
          position against it, not the browser window. */}
      <div className="relative flex h-[844px] w-[390px] flex-col overflow-hidden rounded-[2rem] bg-background text-foreground shadow-xl">
        <StatusBar />
        <div className="min-h-0 flex-1">
          {auth === 'in' ? (
            <LoadGate key={page ? `${page.kind}-${stack.length}` : tab}>{screen()}</LoadGate>
          ) : (
            screen()
          )}
        </div>
        {auth === 'in' && !page && (
          <TabBar<Tab>
            tabs={[
              { id: 'home', label: t('seller.nav.home'), icon: Home },
              { id: 'orders', label: t('seller.nav.orders'), icon: ClipboardList, badge: newCount },
              { id: 'products', label: t('seller.nav.products'), icon: Package },
              { id: 'customers', label: t('seller.nav.customers'), icon: Users },
              { id: 'more', label: t('seller.nav.more'), icon: Menu },
            ]}
            active={tab}
            onSelect={goTab}
          />
        )}

        <ConfirmSheet
          orders={sheet?.action === 'confirm' ? sheet.orders : []}
          onClose={() => setSheet(null)}
          onConfirm={(ids) => {
            orders.confirm(ids);
            done('seller.toast.confirmed', ids.length);
          }}
        />
        <CancelSheet
          orders={sheet?.action === 'cancel' ? sheet.orders : []}
          onClose={() => setSheet(null)}
          onCancel={(ids, reason) => {
            orders.cancel(ids, reason);
            done('seller.toast.cancelled', ids.length);
          }}
        />
        <DeliverSheet
          orders={sheet?.action === 'deliver' ? sheet.orders : []}
          onClose={() => setSheet(null)}
          onDeliver={(ids) => {
            orders.deliver(ids);
            done('seller.toast.delivered', ids.length);
          }}
        />
        {sectionEdit && sectionSku && (
          <EditProductScreen
            key={`${sectionEdit.code}-${sectionEdit.section}`}
            sku={sectionSku}
            skus={catalog.skus}
            section={sectionEdit.section}
            onBack={() => setSectionEdit(null)}
            onSave={(next) => {
              catalog.updateSku(next);
              setSectionEdit(null);
              setToast(t('seller.toast.product_saved'));
            }}
          />
        )}
        <LogisticsSheet
          via={sheet?.action === 'darkstore' ? 'DARK_STORE' : 'LOGISTICS'}
          orders={sheet?.action === 'logistics' || sheet?.action === 'darkstore' ? sheet.orders : []}
          onClose={() => setSheet(null)}
          onConfirm={(ids) => orders.sendToLogistics(ids, sheet?.action === 'darkstore' ? 'DARK_STORE' : 'LOGISTICS')}
        />
        <PriceEditSheet
          sku={priceSku}
          schemes={priceSku ? catalog.schemes.filter((x) => x.skuCode === priceSku.code && x.status !== 'EXPIRED') : []}
          onClose={() => setPriceCode(null)}
          onSave={(mrp, price) => {
            if (priceSku) catalog.setPrice(priceSku.code, mrp, price);
            setPriceCode(null);
            setToast(t('seller.toast.price_saved'));
          }}
        />
        <OfferSheet
          sku={offerSku}
          scheme={offerSku ? schemeFor(offerSku.code) : undefined}
          schemes={catalog.schemes}
          onClose={() => setOfferCode(null)}
          onCreate={(scheme) => {
            catalog.addScheme(scheme);
            setOfferCode(null);
            setToast(t('seller.toast.offer_created'));
          }}
          onUpdate={(code, patch) => {
            catalog.updateScheme(code, patch);
            setOfferCode(null);
            setToast(t(patch.status === 'INACTIVE' ? 'seller.quick.offer_paused_toast' : patch.status === 'ACTIVE' ? 'seller.quick.offer_started_toast' : 'seller.quick.offer_saved_toast'));
          }}
        />
        <Toast open={!!toast} variant="success" message={toast} onClose={() => setToast(null)} />
      </div>
    </div>
  );
}
