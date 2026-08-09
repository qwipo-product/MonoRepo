import { useEffect, useState } from 'react';
import { useTheme } from '@mockups/ui';
import FlowIndex from './review/FlowIndex';
import { type ScreenId } from './review/screenIndex';
import { type Shell } from './review/ShellSwitcher';
import { ShellChrome } from './shells/ShellChrome';
import { BottomNav } from './components/BottomNav';
import { HomeScreen } from './screens/HomeScreen';
import { CatalogScreen } from './screens/CatalogScreen';
import { CartScreen } from './screens/CartScreen';
import { ViewItemsScreen } from './screens/ViewItemsScreen';
import { OrderSummaryScreen } from './screens/OrderSummaryScreen';
import { CouponsScreen } from './screens/CouponsScreen';
import { OrderConfirmationScreen } from './screens/OrderConfirmationScreen';
import { MyOrdersScreen } from './screens/MyOrdersScreen';
import { OrderDetailsScreen } from './screens/OrderDetailsScreen';
import { MyAccountScreen } from './screens/MyAccountScreen';
import { NotificationsScreen } from './screens/NotificationsScreen';
import { BusinessDetailsScreen } from './screens/BusinessDetailsScreen';
import { PaymentsScreen } from './screens/PaymentsScreen';
import { CreditPartnersScreen } from './screens/CreditPartnersScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { LanguageScreen } from './screens/LanguageScreen';
import { ContactUsScreen } from './screens/ContactUsScreen';
import { TermsScreen } from './screens/TermsScreen';
import { AddToCartSheet } from './sheets/AddToCartSheet';
import { SplashScreen } from './screens/auth/SplashScreen';
import { LoginScreen } from './screens/auth/LoginScreen';
import { OtpScreen } from './screens/auth/OtpScreen';
import { OnboardingScreen } from './screens/auth/OnboardingScreen';
import { CompleteKycScreen } from './screens/auth/CompleteKycScreen';
import { KycSuccessScreen } from './screens/auth/KycSuccessScreen';
import { SavedAddressesScreen } from './screens/SavedAddressesScreen';
import { GlobalSearchScreen } from './screens/GlobalSearchScreen';
import { SellerBrowseScreen, type BrowseTab } from './screens/SellerBrowseScreen';
import { StorefrontScreen } from './screens/StorefrontScreen';
import { WholesalerProductsScreen } from './screens/WholesalerProductsScreen';
import { ReorderScreen } from './screens/ReorderScreen';
import type { NavOpts } from './nav';
import type { AppliedFilter } from './data/filters';
import { PRODUCTS, productById } from './data/products';
import { DIST_CATEGORIES, WHOLESALER_CATEGORIES, BRANDS, DISTRIBUTORS } from './data/home';
import { buildCart } from './data/cart';
import { ORDERS } from './data/orders';
import { availabilityFor, addressById, DEFAULT_ADDRESS_ID } from './data/addresses';

// Screens migrated to v2 so far. Everything else shows a placeholder + "soon".
const BUILT = new Set<ScreenId>([
  'splash', 'login', 'otp', 'onboarding', 'kyc-complete', 'kyc-success',
  'home', 'listing', 'cart', 'distributor-units', 'sub:addresses', 'global-search',
  'distributors-list', 'wholesaler-categories', 'storefront', 'wholesaler-products', 'wholesaler-units',
  'view-items', 'cart-units', 'order-summary', 'coupons', 'order-confirmation', 'reorder',
  'my-orders', 'order-details', 'profile', 'notifications', 'sub:business-details',
  'sub:payment', 'sub:credit', 'settings', 'sub:language', 'sub:help', 'sub:terms',
]);

// Root screens get the bottom tab bar (buyer shell); pushed screens don't.
const ROOT_SCREENS = new Set<ScreenId>(['home', 'reorder', 'profile', 'storefront']);

// Product-list screens that accept an incoming applied filter + Back target.
const PRODUCT_LISTS = new Set<ScreenId>(['listing', 'wholesaler-products', 'wholesaler-units']);

function readInitialScreen(): ScreenId {
  const s = new URLSearchParams(window.location.search).get('screen');
  if (!s) return 'listing';
  if (s === 'distributor-units') return 'listing';
  if (s === 'cart-units') return 'view-items'; // = the sheet over View Items
  return s;
}

// Shared cart model (self-contained mock) — resolves the seller for View Items.
const CART = buildCart();

export default function App() {
  const { isDark, toggleTheme } = useTheme();
  const [screen, setScreen] = useState<ScreenId>(readInitialScreen);
  const [shell, setShell] = useState<Shell>(() =>
    new URLSearchParams(window.location.search).get('shell') === 'paytm' ? 'paytm' : 'buyer'
  );
  const [sheetId, setSheetId] = useState<string | null>(null);
  const [qty, setQty] = useState<Record<string, number>>({});
  const [viewSellerId, setViewSellerId] = useState<string | null>(CART.sellers[0]?.id ?? null);
  const [detailsOrderId, setDetailsOrderId] = useState<string | null>(ORDERS[0]?.id ?? null);
  const [deliveryAddressId, setDeliveryAddressId] = useState<string>(DEFAULT_ADDRESS_ID);
  // Filter/back context carried into product lists, storefront, and browse tabs.
  const [listApplied, setListApplied] = useState<AppliedFilter[]>([]);
  const [listBackTo, setListBackTo] = useState<ScreenId>('home');
  const [storefrontBackTo, setStorefrontBackTo] = useState<ScreenId>('home');
  const [browseTab, setBrowseTab] = useState<BrowseTab | undefined>(undefined);

  // Deep-link parity: ?screen=distributor-units / cart-units open the sheet.
  useEffect(() => {
    const s = new URLSearchParams(window.location.search).get('screen');
    if (s === 'distributor-units') setSheetId(PRODUCTS[0].id);
    if (s === 'cart-units') setSheetId(CART.sellers[0]?.items[0]?.product.id ?? null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep the URL in sync so any screen + surface is a shareable link.
  useEffect(() => {
    const url = new URL(window.location.href);
    url.searchParams.set('screen', screen);
    url.searchParams.set('shell', shell);
    window.history.replaceState(null, '', url);
  }, [screen, shell]);

  const setLineQty = (id: string, n: number) => setQty((q) => ({ ...q, [id]: Math.max(0, n) }));
  const cartCount = Object.values(qty).reduce((n, q) => n + q, 0);
  const cartTotal = PRODUCTS.reduce((s, p) => s + p.price * (qty[p.id] ?? 0), 0);
  const sheetProduct = sheetId ? productById(sheetId) ?? null : null;

  // Navigate. `distributor-units` isn't a page — it's the sheet over the listing.
  const viewSeller = CART.sellers.find((s) => s.id === viewSellerId) ?? CART.sellers[0] ?? null;

  const go = (id: ScreenId, opts?: NavOpts) => {
    setSheetId(null);
    if (id === 'distributor-units') {
      setListApplied([]);
      setListBackTo('home');
      setScreen('listing');
      setSheetId(PRODUCTS[0].id);
      return;
    }
    if (id === 'cart-units') {
      // Not a page — the selling-units sheet over View Items.
      const seller = CART.sellers[0];
      setViewSellerId(seller?.id ?? null);
      setScreen('view-items');
      if (seller) setSheetId(seller.items[0].product.id);
      return;
    }
    // Capture context for the destination (resets when navigated without opts).
    if (PRODUCT_LISTS.has(id)) {
      setListApplied(opts?.applied ?? []);
      setListBackTo(opts?.backTo ?? 'home');
    }
    // Only overwrite on a real entry (home rail / browse); a list→storefront
    // bounce carries no backTo and should keep the original target.
    if (id === 'storefront' && opts?.backTo) setStorefrontBackTo(opts.backTo);
    if (id === 'distributors-list' || id === 'wholesaler-categories') {
      setBrowseTab(opts?.tab as BrowseTab | undefined);
    }
    setScreen(id);
  };

  const phoneScreen = (() => {
    switch (screen) {
      case 'splash':
        return <SplashScreen onContinue={() => go('login')} />;
      case 'login':
        return <LoginScreen onNext={() => go('otp')} />;
      case 'otp':
        return <OtpScreen onBack={() => go('login')} onVerify={() => go('onboarding')} />;
      case 'onboarding':
        return <OnboardingScreen onBack={() => go('otp')} onProceed={() => go('kyc-complete')} />;
      case 'kyc-complete':
        return <CompleteKycScreen onCancel={() => go('listing')} onRegister={() => go('kyc-success')} />;
      case 'kyc-success':
        return <KycSuccessScreen onPlaceOrder={() => go('listing')} />;
      case 'home':
        return (
          <HomeScreen
            onNavigate={go}
            availability={availabilityFor(deliveryAddressId)}
            deliveryLabel={addressById(deliveryAddressId)?.title}
          />
        );
      case 'sub:addresses':
        return (
          <SavedAddressesScreen
            onBack={() => go('home')}
            selectedId={deliveryAddressId}
            onSelect={setDeliveryAddressId}
          />
        );
      case 'global-search':
        return <GlobalSearchScreen onBack={() => go('home')} onOpenSheet={setSheetId} />;
      case 'distributors-list':
        return (
          <SellerBrowseScreen
            title="Authorised Distributors"
            subtitle="Verified sellers near you"
            tabs={['categories', 'brands', 'sellers']}
            categories={DIST_CATEGORIES}
            brands={BRANDS}
            sellers={DISTRIBUTORS}
            selfId="distributors-list"
            initialTab={browseTab}
            onBack={() => go('home')}
            onNavigate={go}
          />
        );
      case 'wholesaler-categories':
        return (
          <SellerBrowseScreen
            title="Wholesalers"
            subtitle="Bulk sellers near you"
            tabs={['categories', 'brands']}
            categories={WHOLESALER_CATEGORIES}
            brands={BRANDS}
            productListId="wholesaler-products"
            selfId="wholesaler-categories"
            initialTab={browseTab}
            onBack={() => go('home')}
            onNavigate={go}
          />
        );
      case 'wholesaler-products':
        return <WholesalerProductsScreen applied={listApplied} onBack={() => go(listBackTo)} onGoToCart={() => go('cart')} />;
      case 'wholesaler-units':
        return <WholesalerProductsScreen initialSheet applied={listApplied} onBack={() => go(listBackTo)} onGoToCart={() => go('cart')} />;
      case 'storefront':
        return <StorefrontScreen onBack={() => go(storefrontBackTo)} onNavigate={go} />;
      case 'listing':
        return (
          <CatalogScreen
            applied={listApplied}
            onBack={() => go(listBackTo)}
            qty={qty}
            onOpenSheet={setSheetId}
            onSetQty={setLineQty}
            onGoToCart={() => go('cart')}
            cartCount={cartCount}
            cartTotal={cartTotal}
          />
        );
      case 'cart':
        return (
          <CartScreen
            onBack={() => go('home')}
            onCheckout={() => go('order-summary')}
            onViewItems={(sellerId) => {
              setSheetId(null);
              setViewSellerId(sellerId);
              setScreen('view-items');
            }}
            onAddMore={() => go('listing')}
          />
        );
      case 'view-items':
        return viewSeller ? (
          <ViewItemsScreen
            seller={viewSeller}
            onBack={() => go('cart')}
            onAddMore={() => go('listing')}
            onItemTap={(productId) => setSheetId(productId)}
          />
        ) : (
          <Placeholder id={screen} />
        );
      case 'order-summary':
        return (
          <OrderSummaryScreen
            onBack={() => go('cart')}
            onPlaceOrder={() => go('order-confirmation')}
            onOpenCoupons={() => go('coupons')}
            onViewItems={(sellerId) => {
              setSheetId(null);
              setViewSellerId(sellerId);
              setScreen('view-items');
            }}
          />
        );
      case 'coupons':
        return <CouponsScreen onBack={() => go('order-summary')} onApply={() => go('order-summary')} />;
      case 'order-confirmation':
        return <OrderConfirmationScreen onBackToHome={() => go('home')} />;
      case 'reorder':
        return <ReorderScreen qty={qty} onOpenSheet={setSheetId} onSetQty={setLineQty} />;
      case 'profile':
        return <MyAccountScreen onNavigate={go} onSignOut={() => go('login')} />;
      case 'notifications':
        return <NotificationsScreen onBack={() => go('profile')} />;
      case 'sub:business-details':
        return <BusinessDetailsScreen onBack={() => go('profile')} />;
      case 'sub:payment':
        return <PaymentsScreen onBack={() => go('profile')} />;
      case 'sub:credit':
        return <CreditPartnersScreen onBack={() => go('profile')} />;
      case 'settings':
        return <SettingsScreen onBack={() => go('profile')} onNavigate={go} />;
      case 'sub:language':
        return <LanguageScreen onBack={() => go('settings')} />;
      case 'sub:help':
        return <ContactUsScreen onBack={() => go('profile')} />;
      case 'sub:terms':
        return <TermsScreen onBack={() => go('profile')} />;
      case 'my-orders':
        return (
          <MyOrdersScreen
            onBack={() => go('home')}
            onOpenDetails={(id) => {
              setDetailsOrderId(id);
              go('order-details');
            }}
          />
        );
      case 'order-details': {
        const order = ORDERS.find((o) => o.id === detailsOrderId) ?? ORDERS[0];
        return order ? (
          <OrderDetailsScreen order={order} onBack={() => go('my-orders')} />
        ) : (
          <Placeholder id={screen} />
        );
      }
      default:
        return <Placeholder id={screen} />;
    }
  })();

  return (
    <div className="flex h-dvh items-center justify-center gap-8 overflow-hidden bg-[linear-gradient(135deg,#eef2ff_0%,#fdf2f8_100%)] p-6 dark:bg-none dark:bg-background">
      <FlowIndex
        active={screen}
        built={BUILT}
        onPick={go}
        shell={shell}
        onShellChange={setShell}
        isDark={isDark}
        onToggleTheme={toggleTheme}
      />

      <main className="shrink-0">
        {/* phone frame — `relative` so the Sheet (absolute inset-0) fills it */}
        <div className="relative flex h-[844px] w-[390px] flex-col overflow-hidden rounded-[38px] border border-border bg-background text-foreground shadow-xl">
          <ShellChrome
            shell={shell}
            bottomNav={
              ROOT_SCREENS.has(screen) ? (
                <BottomNav active={screen} cartCount={cartCount} onNavigate={go} />
              ) : undefined
            }
          >
            {phoneScreen}
          </ShellChrome>

          <AddToCartSheet
            product={sheetProduct}
            cartTotal={cartTotal}
            onAdd={(pcs) => {
              if (sheetId) setLineQty(sheetId, (qty[sheetId] ?? 0) + pcs);
            }}
            onContinue={() => {
              setSheetId(null);
              go('cart');
            }}
            onClose={() => setSheetId(null)}
          />
        </div>
      </main>
    </div>
  );
}

function Placeholder({ id }: { id: ScreenId }) {
  return (
    <div className="grid h-full place-items-center p-8 text-center">
      <div>
        <div className="mb-3 grid h-16 w-16 place-items-center justify-self-center rounded-2xl bg-muted text-3xl">
          🚧
        </div>
        <div className="text-base font-semibold text-foreground">{id}</div>
        <div className="mt-1 text-sm text-foreground-secondary">
          This screen is next — we're building each one to match its screenshot.
        </div>
      </div>
    </div>
  );
}
