import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { toPng } from 'html-to-image';
import { useTheme } from '@mockups/ui';
import FlowIndex from './review/FlowIndex';
import { ALL_SCREENS, resolveScreenId, type ScreenId, screenNumber } from './review/screenIndex';
import { type Shell } from './review/ShellSwitcher';
import { type Role } from './review/RoleSwitcher';
import { deviceById, frameSize, type Device, type Orientation } from './review/DeviceSwitcher';
import { DemoStateProvider } from './review/demoState';
import { ShellChrome } from './shells/ShellChrome';
import { PaytmWelcomeScreen } from './screens/PaytmWelcomeScreen';
import { PaytmLauncherScreen } from './screens/PaytmLauncherScreen';
import { PaytmSearchScreen } from './screens/PaytmSearchScreen';
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
import { PaymentOrdersScreen } from './screens/PaymentOrdersScreen';
import { PaymentGatewaysScreen } from './screens/PaymentGatewaysScreen';
import { CreditPartnersScreen } from './screens/CreditPartnersScreen';
import { AttendanceScreen } from './screens/salesperson/AttendanceScreen';
import { TaskListScreen } from './screens/salesperson/TaskListScreen';
import { TaskDetailsScreen } from './screens/salesperson/TaskDetailsScreen';
import { CreateInteractionScreen } from './screens/salesperson/CreateInteractionScreen';
import { PerformanceScreen } from './screens/salesperson/PerformanceScreen';
import { CustomerOrdersScreen } from './screens/salesperson/CustomerOrdersScreen';
import { SwitchCustomerScreen } from './screens/salesperson/SwitchCustomerScreen';
import { CustomerListScreen } from './screens/salesperson/CustomerListScreen';
import { CustomerDetailsScreen } from './screens/salesperson/CustomerDetailsScreen';
import { SALESPERSON_PHONE } from './data/salesperson';
import { LanguageScreen } from './screens/LanguageScreen';
import { ContactUsScreen } from './screens/ContactUsScreen';
import { TermsScreen } from './screens/TermsScreen';
import { AddToCartSheet } from './sheets/AddToCartSheet';
import { WholesalerUnitsSheet } from './sheets/WholesalerUnitsSheet';
import { ProductImagesSheet } from './sheets/ProductImagesSheet';
import { UpdateSheet } from './sheets/UpdateSheet';
import { PromoBannersSheet } from './sheets/PromoBannersSheet';
import { CartAlertsSheet } from './sheets/CartAlertsSheet';
import { OrderItemsSheet } from './sheets/OrderItemsSheet';
import { SplashScreen } from './screens/auth/SplashScreen';
import { LoginScreen } from './screens/auth/LoginScreen';
import { OtpScreen } from './screens/auth/OtpScreen';
import { SavedAddressesScreen } from './screens/SavedAddressesScreen';
import { GlobalSearchScreen } from './screens/GlobalSearchScreen';
import { SellerBrowseScreen, type BrowseTab } from './screens/SellerBrowseScreen';
import { LoadingScreen } from './screens/LoadingScreen';
import { StorefrontScreen } from './screens/StorefrontScreen';
import { WholesalerProductsScreen } from './screens/WholesalerProductsScreen';
import { ReorderScreen } from './screens/ReorderScreen';
import type { NavOpts } from './nav';
import type { AppliedFilter } from './data/filters';
import { PRODUCTS, productById } from './data/products';
import { WHOLESALER_PRODUCTS, cheapestVendorId } from './data/wholesaler';
import { DIST_CATEGORIES, WHOLESALER_CATEGORIES, wholesalerCategoriesIn, BRANDS, DISTRIBUTORS, type Distributor } from './data/home';
import { buildCart, INITIAL_QTY } from './data/cart';
import { ORDERS, type Order } from './data/orders';
import {
  ADDRESSES,
  availabilityFor,
  DEFAULT_ADDRESS_ID,
} from './data/addresses';

// Screens migrated to v2 so far. Everything else shows a placeholder + "soon".
const BUILT = new Set<ScreenId>([
  'paytm-launcher', 'paytm-search', 'paytm-welcome',
  'splash', 'login', 'otp',
  'home', 'listing', 'cart', 'distributor-units', 'sub:addresses', 'global-search',
  'distributors-list',
  'wholesaler-categories', 'wholesaler-groceries', 'wholesaler-fmcg',
  'storefront', 'wholesaler-products', 'wholesaler-units',
  'view-items', 'cart-units', 'cart-alerts', 'order-summary', 'order-items', 'coupons', 'order-confirmation', 'reorder',
  'my-orders', 'order-details', 'profile', 'notifications', 'sub:business-details',
  'app-update', 'app-update-required', 'promo-banners', 'loading',
  'login-error', 'otp-error', 'cart-price-changes',
  'empty:sub:payment', 'empty:sub:payment-orders', 'empty:sub:payment-gateways', 'empty:sub:credit',
  'sub:language', 'sub:help', 'sub:terms',
  'sp:attendance', 'sp:tasks', 'sp:task-details', 'sp:create-interaction',
  'sp:performance', 'sp:orders', 'sp:switch-customer', 'sp:customers', 'sp:customer-details',
]);

/* Empty-state screens. `empty:<id>` renders the real screen <id> with its data
   forced empty, so every zero-data design is its own entry in the sidebar and
   its own shareable ?screen= link — rather than a mode you have to remember to
   switch on. The sidebar highlight tracks the empty: id; everything that
   branches on "which screen is this" uses the resolved base id below. */
const EMPTY_PREFIX = 'empty:';
const isEmptyScreen = (id: ScreenId) => id.startsWith(EMPTY_PREFIX);
const baseScreenOf = (id: ScreenId): ScreenId => {
  if (!isEmptyScreen(id)) return id;
  const rest = id.slice(EMPTY_PREFIX.length);
  // Home's "no vendors" cases aren't an empty page — they block the tab that
  // has no sellers and show Coming Soon, exactly like an unserved address.
  if (rest === 'home-distributors' || rest === 'home-wholesalers') return 'home';
  return rest;
};

// Sidebar "soon" tags: an empty: entry is as built as the screen it renders.
for (const id of [...BUILT]) {
  if (!isEmptyScreen(id)) BUILT.add(EMPTY_PREFIX + id);
}

// Root screens get the bottom tab bar (buyer shell); pushed screens don't.
const ROOT_SCREENS = new Set<ScreenId>(['home', 'reorder', 'sub:help', 'profile', 'storefront']);

// Product-list screens that accept an incoming applied filter + Back target.
const PRODUCT_LISTS = new Set<ScreenId>(['listing', 'wholesaler-products', 'wholesaler-units']);

// Qwipo-app-only screens. The Paytm mini runs the same sign-in (phone → OTP)
// but never shows the app splash, because it launches from inside Paytm.
const QWIPO_ONLY_SCREENS = new Set<ScreenId>(['splash']);

/* One screen the buyer has been on, with the context that made it that screen.
   Restoring an entry has to put the filters, the tab and the seller back too,
   or Back lands on the right page showing the wrong thing. */
interface TrailEntry {
  screen: ScreenId;
  applied: AppliedFilter[];
  listTab?: BrowseTab;
  browseTab?: BrowseTab;
  distributor: Distributor;
  seller: string | null;
}

/** Long enough for any real path through the app, short enough to stay cheap. */
const TRAIL_MAX = 24;

/* Where Back goes when there is no trail — someone opened this screen directly
   from the review gallery's sidebar, so there is no history to pop. Then Back
   means "up one level", which is the best that can be said. */
function fallbackBack(id: ScreenId): ScreenId {
  if (id.startsWith('sub:') || id.startsWith('sp:')) return 'profile';
  if (id === 'checkout' || id === 'coupons' || id === 'view-items') return 'cart';
  if (id === 'otp') return 'login';
  if (id === 'order-details') return 'my-orders';
  if (id === 'storefront') return 'listing';
  return 'home';
}

function readInitialScreen(): ScreenId {
  const params = new URLSearchParams(window.location.search);
  const requested = params.get('screen');
  const s = requested ? resolveScreenId(requested) : null;
  // Paytm mini boots into the Paytm launcher
  // (→ search → welcome/consent → login → OTP → home).
  if (!s) return params.get('shell') === 'paytm' ? 'paytm-launcher' : 'listing';
  // Retired or unknown review links return to an available screen.
  if (!ALL_SCREENS.some((item) => item.id === s)) return 'home';
  if (s === 'distributor-units') return 'listing';
  if (s === 'cart-units') return 'view-items'; // = the sheet over View Items
  if (s === 'cart-price-changes') return 'view-items'; // = View Items, price-change lines
  if (s === 'cart-alerts') return 'cart'; // = the alerts sheet over Cart Summary
  if (s === 'app-update' || s === 'app-update-required') return 'home'; // = update sheet over Home
  if (s === 'promo-banners') return 'home'; // = the promo banner sheet over Home
  if (s === 'order-items') return 'order-summary'; // = the items sheet over Order Summary
  return s;
}

export default function App() {
  const { isDark, toggleTheme } = useTheme();
  const [screen, setScreen] = useState<ScreenId>(readInitialScreen);
  const [shell, setShell] = useState<Shell>(() =>
    new URLSearchParams(window.location.search).get('shell') === 'paytm' ? 'paytm' : 'buyer'
  );
  // Device frame: which device + orientation the mockup renders in (review-only).
  const [device, setDevice] = useState<Device>(() =>
    deviceById(new URLSearchParams(window.location.search).get('device'))
  );
  const [orientation, setOrientation] = useState<Orientation>(() =>
    new URLSearchParams(window.location.search).get('orient') === 'landscape' ? 'landscape' : 'portrait'
  );
  const [sheetId, setSheetId] = useState<string | null>(null);
  const [galleryId, setGalleryId] = useState<string | null>(null);
  const [alertsOpen, setAlertsOpen] = useState(false);
  // Review-only: force every list empty so the zero-data designs are reachable.
  const [emptyDemo, setEmptyDemo] = useState(false);
  const [updateOpen, setUpdateOpen] = useState(false);
  const [updateRequired, setUpdateRequired] = useState(false);
  const [promoOpen, setPromoOpen] = useState(false);
  const [orderItemsOpen, setOrderItemsOpen] = useState(false);
  // Live quantities from the Product List / Reorder screens — starts empty,
  // so the cart opens with nothing in it; the buyer adding a quantity there
  // is the only thing that ever puts something in the cart. Single source of
  // truth: Cart Summary reads this too, so whatever gets added there shows up.
  const [qty, setQty] = useState<Record<string, number>>(INITIAL_QTY);
  // Live quantities + chosen vendor from the Wholesaler List — a separate pool
  // (wp-ids, not p-ids), same pattern.
  const [wholesaleQty, setWholesaleQty] = useState<Record<string, number>>({});
  const [wholesaleVendor, setWholesaleVendor] = useState<Record<string, string>>({});
  // The live cart, rebuilt whenever any of the above changes — every screen
  // that shows cart contents reads from this one computed value.
  const CART = useMemo(() => buildCart(qty, wholesaleQty, wholesaleVendor), [qty, wholesaleQty, wholesaleVendor]);
  const [viewSellerId, setViewSellerId] = useState<string | null>(CART.sellers[0]?.id ?? null);
  const [detailsOrder, setDetailsOrder] = useState<Order | null>(null);
  const [deliveryAddressId, setDeliveryAddressId] = useState<string>(DEFAULT_ADDRESS_ID);
  // Salesperson flow: phone entered at login (9000000001 → salesperson) + task context.
  const [loginPhone, setLoginPhone] = useState<string>('');
  const [taskId, setTaskId] = useState<string>('tk1');
  const [spCustomerId, setSpCustomerId] = useState<string>('c1');
  // Persona: salesperson unlocks the beat-day features (Home task icon, My
  // Account section, sidebar group). Set by login 9000000001 or the switcher.
  const [role, setRole] = useState<Role>('customer');
  // Filter/back context carried into product lists, storefront, and browse tabs.
  const [listApplied, setListApplied] = useState<AppliedFilter[]>([]);
  /* Which browse tab the buyer left, so Back puts them back on it. Without
     this, opening a brand from a seller's card returns to Categories. */
  const [listBackTab, setListBackTab] = useState<BrowseTab | undefined>(undefined);
  const [selectedDistributor, setSelectedDistributor] = useState<Distributor>(DISTRIBUTORS[0]);
  /* Which side of Home the buyer is shopping. It lives here, not in
     HomeScreen, so it survives every trip out to a list or a category screen
     and back — leaving the wholesaler tab and pressing Back returns to the
     wholesaler tab. */
  const [homeTab, setHomeTab] = useState<'distributors' | 'wholesalers'>('distributors');
  const [browseTab, setBrowseTab] = useState<BrowseTab | undefined>(undefined);
  /* A wholesale card in Global Search opens the vendor sheet, which until now
     only existed inside the wholesale screens. */
  const [wholesaleSheetId, setWholesaleSheetId] = useState<string | null>(null);
  /* Where the buyer has been, oldest first. Back pops this, so it returns them
     to the screen they actually came from rather than to a target each screen
     guessed for itself: the cart opened from a product list goes back to that
     list, the cart opened from Home goes back to Home.

     An entry carries the context that made its screen what it was, because an
     id alone doesn't say which filters were applied, which tab was open or
     which seller was being viewed — that context is what was being lost. */
  const [trail, setTrail] = useState<TrailEntry[]>([]);

  // Deep-link parity: ?screen=distributor-units / cart-units open the sheet.
  useEffect(() => {
    const s = new URLSearchParams(window.location.search).get('screen');
    if (s === 'distributor-units') setSheetId(PRODUCTS[0].id);
    if (s === 'cart-units') setSheetId(CART.sellers[0]?.items[0]?.product.id ?? null);
    if (s === 'cart-alerts') setAlertsOpen(true);
    if (s === 'app-update' || s === 'app-update-required') {
      setUpdateRequired(s === 'app-update-required');
      setUpdateOpen(true);
    }
    if (s === 'promo-banners') setPromoOpen(true);
    if (s === 'order-items') setOrderItemsOpen(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep the URL in sync so any screen + surface + device is a shareable link.
  useEffect(() => {
    const url = new URL(window.location.href);
    url.searchParams.set('screen', screen);
    url.searchParams.set('shell', shell);
    url.searchParams.set('device', device.id);
    url.searchParams.set('orient', orientation);
    window.history.replaceState(null, '', url);
  }, [screen, shell, device, orientation]);

  // Scale the device frame down to fit the viewport (never up) — big tablets
  // would otherwise overflow the review page.
  const frame = frameSize(device, orientation);
  const stageRef = useRef<HTMLElement | null>(null);
  const [stageSize, setStageSize] = useState({ w: 0, h: 0 });
  useLayoutEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const r = entry.contentRect;
      setStageSize({ w: r.width, h: r.height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const frameScale =
    stageSize.w > 0 ? Math.min(1, stageSize.w / frame.w, stageSize.h / frame.h) : 1;

  // Paytm mini is pre-authenticated — never sit on an auth screen there.
  useEffect(() => {
    if (shell === 'paytm' && QWIPO_ONLY_SCREENS.has(baseScreenOf(screen))) setScreen('listing');
  }, [shell, screen]);

  // Screenshot the phone bezel → PNG in Downloads.
  const frameRef = useRef<HTMLDivElement>(null);
  const capture = async () => {
    if (!frameRef.current) return;
    const url = await toPng(frameRef.current, { pixelRatio: 3, cacheBust: true });
    const num = String(screenNumber(screen, shell, role)).padStart(2, '0');
    const a = document.createElement('a');
    a.href = url;
    a.download = `qwipo-${num}-${shell}-${screen.replace(/:/g, '-')}.png`;
    a.click();
  };

  const setLineQty = (id: string, n: number) => setQty((q) => ({ ...q, [id]: Math.max(0, n) }));
  const setWholesaleLineQty = (id: string, n: number) => setWholesaleQty((q) => ({ ...q, [id]: Math.max(0, n) }));
  const setWholesaleVendorFor = (id: string, vendorId: string) => setWholesaleVendor((v) => ({ ...v, [id]: vendorId }));
  const cartCount =
    Object.values(qty).reduce((n, q) => n + q, 0) + Object.values(wholesaleQty).reduce((n, q) => n + q, 0);
  // Same total the cart itself adds up to — one source of truth.
  const cartTotal = CART.grandTotal;
  const sheetProduct = sheetId ? productById(sheetId) ?? null : null;
  const wholesaleSheetProduct = wholesaleSheetId
    ? WHOLESALER_PRODUCTS.find((p) => p.id === wholesaleSheetId) ?? null
    : null;
  /* Either catalogue: a wholesale card's picture opens the same gallery a
     distributor card's does. */
  const galleryProduct = galleryId
    ? productById(galleryId) ?? WHOLESALER_PRODUCTS.find((p) => p.id === galleryId) ?? null
    : null;
  // Salesperson persona is Qwipo-app-only; the Paytm mini surface is customer-only.
  const isSalesperson = role === 'salesperson' && shell === 'buyer';

  // Navigate. `distributor-units` isn't a page — it's the sheet over the listing.
  const viewSeller = CART.sellers.find((s) => s.id === viewSellerId) ?? CART.sellers[0] ?? null;

  /** The screen being left, with everything needed to rebuild it later. */
  const snapshot = (): TrailEntry => ({
    screen,
    applied: listApplied,
    listTab: listBackTab,
    browseTab,
    distributor: selectedDistributor,
    seller: viewSellerId,
  });

  const go = (requested: ScreenId, opts?: NavOpts) => {
    const id = resolveScreenId(requested);
    /* Record the departure. Arriving somewhere already behind us unwinds to it
       rather than stacking a second copy, so Home → Cart → Home leaves one
       Home in the trail instead of a loop that Back walks forever. */
    if (baseScreenOf(id) !== baseScreenOf(screen)) {
      const leaving = snapshot();
      setTrail((t) => {
        const seen = t.findIndex((e) => baseScreenOf(e.screen) === baseScreenOf(id));
        return seen >= 0 ? t.slice(0, seen) : [...t, leaving].slice(-TRAIL_MAX);
      });
    }
    setSheetId(null);
    setAlertsOpen(false);
    setOrderItemsOpen(false);
    setUpdateOpen(false);
    setPromoOpen(false);
    if (id === 'promo-banners') {
      // Not a page — the full-screen promo sheet over Home.
      setScreen('home');
      setPromoOpen(true);
      return;
    }
    if (id === 'app-update' || id === 'app-update-required') {
      // Not pages — the What's New sheet over Home.
      setUpdateRequired(id === 'app-update-required');
      setScreen('home');
      setUpdateOpen(true);
      return;
    }
    if (id === 'cart-alerts') {
      // Not a page — the alerts sheet over Cart Summary.
      setScreen('cart');
      setAlertsOpen(true);
      return;
    }
    if (id === 'order-items') {
      // Not a page — the read-only items sheet over Order Summary.
      const seller = CART.sellers[0];
      setViewSellerId(seller?.id ?? null);
      setScreen('order-summary');
      setOrderItemsOpen(true);
      return;
    }
    if (id === 'distributor-units') {
      setListApplied([]);
      setListBackTab(undefined);
      setScreen('listing');
      setSheetId(PRODUCTS[0].id);
      return;
    }
    if (id === 'cart-price-changes') {
      // Not a page — View Items for the seller whose prices actually moved, so
      // the per-line deltas and the net total are visible together.
      const seller =
        CART.sellers.find((x) => x.items.some((i) => !!i.priceDelta)) ?? CART.sellers[0];
      setViewSellerId(seller?.id ?? null);
      setScreen('view-items');
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
    if (PRODUCT_LISTS.has(baseScreenOf(id))) {
      setListApplied(opts?.applied ?? []);
      setListBackTab(opts?.tab as BrowseTab | undefined);
    }
    if (id === 'storefront' && opts?.distributor) setSelectedDistributor(opts.distributor);
    if (id === 'distributors-list' || id === 'wholesaler-categories') {
      setBrowseTab(opts?.tab as BrowseTab | undefined);
    }
    setScreen(id);
  };

  /* Back: one behaviour for the whole app. Pop the last screen and put its
     context back with it. With nothing to pop — a direct jump from the review
     sidebar — fall back to the level above. */
  const goBack = () => {
    const prev = trail[trail.length - 1];
    if (!prev) {
      go(fallbackBack(baseScreenOf(screen)));
      return;
    }
    setTrail((t) => t.slice(0, -1));
    setSheetId(null);
    setAlertsOpen(false);
    setOrderItemsOpen(false);
    setUpdateOpen(false);
    setListApplied(prev.applied);
    setListBackTab(prev.listTab);
    setBrowseTab(prev.browseTab);
    setSelectedDistributor(prev.distributor);
    setViewSellerId(prev.seller);
    setScreen(prev.screen);
  };

  // Open the shared Order Details for any order. Back is the trail's job now.
  const openOrder = (order: Order) => {
    setDetailsOrder(order);
    go('order-details');
  };

  // The screen actually rendered — `empty:cart` renders Cart, with no data.
  const view = baseScreenOf(screen);
  const emptyView = isEmptyScreen(screen);

  const phoneScreen = (() => {
    switch (view) {
      case 'paytm-launcher':
        return <PaytmLauncherScreen onSearch={() => go('paytm-search')} onOpenQwipo={() => go('paytm-welcome')} />;
      case 'paytm-search':
        return <PaytmSearchScreen onBack={goBack} onOpenQwipo={() => go('paytm-welcome')} />;
      case 'paytm-welcome':
        return <PaytmWelcomeScreen onProceed={() => go('login')} />;
      case 'splash':
        return <SplashScreen onContinue={() => go('login')} />;
      case 'loading':
        return <LoadingScreen />;
      case 'login-error':
        return <LoginScreen demoError onNext={() => go('otp')} />;
      case 'otp-error':
        return <OtpScreen demoError onBack={goBack} onVerify={() => go('home')} />;
      case 'login':
        return (
          <LoginScreen
            onNext={(phone) => {
              setLoginPhone(phone);
              go('otp');
            }}
          />
        );
      case 'otp':
        return (
          <OtpScreen
            onBack={goBack}
            onVerify={() => {
              const isSp = loginPhone === SALESPERSON_PHONE;
              setRole(isSp ? 'salesperson' : 'customer');
              go('home');
            }}
          />
        );
      case 'home':
        return (
          <HomeScreen
            onNavigate={go}
            tab={homeTab}
            onTabChange={setHomeTab}
            availability={
              screen === 'empty:home-distributors'
                ? 'wholesalers'
                : screen === 'empty:home-wholesalers'
                  ? 'distributors'
                  : availabilityFor(deliveryAddressId)
            }
            deliveryLabel={ADDRESSES.find((a) => a.id === deliveryAddressId)?.title}
            onOpenSheet={setSheetId}
            onOpenWholesaleSheet={setWholesaleSheetId}
            sheetOpen={!!sheetProduct || !!wholesaleSheetProduct}
            salesperson={isSalesperson}
          />
        );
      case 'sub:addresses':
        return (
          <SavedAddressesScreen
            onBack={goBack}
            selectedId={deliveryAddressId}
            onSelect={setDeliveryAddressId}
            addresses={ADDRESSES}
          />
        );
      case 'global-search':
        return (
          <GlobalSearchScreen
            qty={qty}
            wholesaleQty={wholesaleQty}
            onSetWholesaleQty={setWholesaleLineQty}
            vendorSel={wholesaleVendor}
            onSetVendor={setWholesaleVendorFor}
            onBack={goBack}
            onOpenSheet={setSheetId}
            onOpenWholesaleSheet={setWholesaleSheetId}
            onOpenGallery={setGalleryId}
            onNavigate={go}
            onGoToCart={() => go('cart')}
            cartCount={cartCount}
            cartTotal={cartTotal}
            cartFreight={CART.freightTotal}
          />
        );
      case 'distributors-list':
        return (
          <SellerBrowseScreen
            title="Authorised Distributors"
            subtitle="Verified sellers near you"
            tabs={['categories', 'brands', 'sellers']}
            categories={DIST_CATEGORIES}
            brands={BRANDS}
            sellers={DISTRIBUTORS}
            initialTab={browseTab}
            onTabChange={setBrowseTab}
            onBack={goBack}
            onNavigate={go}
          />
        );
      // One screen per level-1 group, each listing only its own categories.
      case 'wholesaler-groceries':
      case 'wholesaler-fmcg': {
        const l1 = screen === 'wholesaler-fmcg' ? 'FMCG' : 'Groceries';
        const cats = wholesalerCategoriesIn(l1);
        return (
          <SellerBrowseScreen
            title={l1}
            subtitle={`${cats.length} categories`}
            tabs={['categories']}
            categories={cats}
            brands={BRANDS}
            productListId="wholesaler-products"
            onBack={goBack}
            onNavigate={go}
          />
        );
      }
      case 'wholesaler-categories':
        return (
          <SellerBrowseScreen
            title="Wholesalers"
            subtitle="Bulk sellers near you"
            tabs={['categories', 'brands']}
            categories={WHOLESALER_CATEGORIES}
            brands={BRANDS}
            productListId="wholesaler-products"
            initialTab={browseTab}
            onTabChange={setBrowseTab}
            onBack={goBack}
            onNavigate={go}
          />
        );
      case 'wholesaler-products':
        return (
          <WholesalerProductsScreen
            applied={listApplied}
            qty={wholesaleQty}
            onSetQty={setWholesaleLineQty}
            vendorSel={wholesaleVendor}
            onSetVendor={setWholesaleVendorFor}
            onBack={goBack}
            onSearch={() => go('global-search')}
            onGoToCart={() => go('cart')}
            cartCount={cartCount}
            cartTotal={cartTotal}
            cartFreight={CART.freightTotal}
          />
        );
      case 'wholesaler-units':
        return (
          <WholesalerProductsScreen
            initialSheet
            applied={listApplied}
            qty={wholesaleQty}
            onSetQty={setWholesaleLineQty}
            vendorSel={wholesaleVendor}
            onSetVendor={setWholesaleVendorFor}
            onBack={goBack}
            onSearch={() => go('global-search')}
            onGoToCart={() => go('cart')}
            cartCount={cartCount}
            cartTotal={cartTotal}
            cartFreight={CART.freightTotal}
          />
        );
      case 'storefront':
        return <StorefrontScreen distributor={selectedDistributor} onBack={goBack} onNavigate={go} />;
      case 'listing':
        return (
          <CatalogScreen
            applied={listApplied}
            onBack={goBack}
            onSearch={() => go('global-search')}
            qty={qty}
            onOpenSheet={setSheetId}
            onOpenGallery={setGalleryId}
            onGoToCart={() => go('cart')}
            cartCount={cartCount}
            cartTotal={cartTotal}
            cartFreight={CART.freightTotal}
          />
        );
      case 'cart':
        return (
          <CartScreen
            cart={CART}
            onBack={goBack}
            onCheckout={() => setAlertsOpen(true)}
            /* Through `go`, not setScreen: a navigation that sets the screen
               itself never reaches the trail, so Back had no record of the
               cart and skipped straight past it. */
            onViewItems={(sellerId) => {
              setViewSellerId(sellerId);
              go('view-items');
            }}
            onAddMore={() => go('listing')}
            onOpenCoupons={() => go('coupons')}
            /* Which sheet depends on the catalogue the line came from — a
               wholesale line is priced by vendor, so it opens the vendor
               sheet rather than the distributor one. */
            onItemTap={(id) =>
              id.startsWith('wp') ? setWholesaleSheetId(id) : setSheetId(id)
            }
          />
        );
      case 'view-items':
        return viewSeller ? (
          <ViewItemsScreen
            seller={viewSeller}
            onBack={goBack}
            onAddMore={() => go('listing')}
            onItemTap={(productId) => setSheetId(productId)}
          />
        ) : (
          <Placeholder id={screen} />
        );
      case 'order-summary':
        return (
          <OrderSummaryScreen
            cart={CART}
            onBack={goBack}
            onPlaceOrder={() => go('order-confirmation')}
            onViewItems={(sellerId) => {
              setViewSellerId(sellerId);
              setOrderItemsOpen(true);
            }}
          />
        );
      case 'coupons':
        return <CouponsScreen cart={CART} onBack={goBack} onApply={() => go('cart')} />;
      case 'order-confirmation':
        return <OrderConfirmationScreen onBackToHome={goBack} />;
      case 'reorder':
        return (
          <ReorderScreen
            qty={qty}
            wholesaleQty={wholesaleQty}
            onSetWholesaleQty={setWholesaleLineQty}
            vendorSel={wholesaleVendor}
            onSetVendor={setWholesaleVendorFor}
            onOpenSheet={setSheetId}
            onOpenGallery={setGalleryId}
            onSearch={() => go('global-search')}
            onBack={goBack}
            onGoToCart={() => go('cart')}
            cartCount={cartCount}
            cartTotal={cartTotal}
            cartFreight={CART.freightTotal}
          />
        );
      case 'profile':
        return <MyAccountScreen onNavigate={go} onSignOut={() => go(shell === 'paytm' ? 'home' : 'login')} salesperson={isSalesperson} />;
      case 'notifications':
        return <NotificationsScreen onBack={goBack} />;
      case 'sub:business-details':
        return <BusinessDetailsScreen onBack={goBack} />;
      case 'sub:payment':
        return <PaymentsScreen onBack={goBack} />;
      case 'sub:payment-orders':
        return <PaymentOrdersScreen onBack={goBack} />;
      case 'sub:payment-gateways':
        return <PaymentGatewaysScreen onBack={goBack} />;
      case 'sub:credit':
        return <CreditPartnersScreen onBack={goBack} />;
      case 'sub:language':
        return <LanguageScreen onBack={goBack} />;
      case 'sub:help':
        return <ContactUsScreen onBack={goBack} />;
      case 'sub:terms':
        return <TermsScreen onBack={goBack} />;

      // Salesperson features (login 9000000001) — surfaced in the customer app
      // via the Home task icon + My Account section.
      case 'sp:attendance':
        return <AttendanceScreen onBack={goBack} />;
      case 'sp:tasks':
        return (
          <TaskListScreen
            onBack={goBack}
            onOpenTask={(id) => {
              setTaskId(id);
              go('sp:task-details');
            }}
          />
        );
      case 'sp:task-details':
        return (
          <TaskDetailsScreen
            initialTab={emptyView ? 'interaction' : 'info'}
            taskId={taskId}
            onBack={goBack}
            onCreateInteraction={(id) => {
              setTaskId(id);
              go('sp:create-interaction');
            }}
            onOpenOrder={(o) => openOrder(o)}
          />
        );
      case 'sp:create-interaction':
        return (
          <CreateInteractionScreen onBack={goBack} onDone={() => go('sp:task-details')} />
        );
      case 'sp:performance':
        return <PerformanceScreen onBack={goBack} />;
      case 'sp:orders':
        return <CustomerOrdersScreen onBack={goBack} onOpenOrder={(o) => openOrder(o)} />;
      case 'sp:switch-customer':
        return <SwitchCustomerScreen onBack={goBack} onSwitch={() => go('home')} />;
      case 'sp:customers':
        return (
          <CustomerListScreen
            onBack={goBack}
            onOpenCustomer={(id) => {
              setSpCustomerId(id);
              go('sp:customer-details');
            }}
          />
        );
      case 'sp:customer-details':
        return (
          <CustomerDetailsScreen
            customerId={spCustomerId}
            onBack={goBack}
            onOpenOrder={(o) => openOrder(o)}
          />
        );

      case 'my-orders':
        return (
          <MyOrdersScreen
            onBack={goBack}
            onStartShopping={() => go('listing')}
            onOpenDetails={(id) => {
              const o = ORDERS.find((x) => x.id === id) ?? ORDERS[0];
              openOrder(o);
            }}
          />
        );
      case 'order-details': {
        const order = detailsOrder ?? ORDERS[0];
        return order ? (
          <OrderDetailsScreen order={order} onBack={goBack} />
        ) : (
          <Placeholder id={screen} />
        );
      }
      default:
        return <Placeholder id={screen} />;
    }
  })();

  return (
    <div className="flex h-dvh items-center gap-8 overflow-hidden bg-[linear-gradient(135deg,#eef2ff_0%,#fdf2f8_100%)] p-6 dark:bg-none dark:bg-background">
      <FlowIndex
        active={screen}
        built={BUILT}
        onPick={go}
        shell={shell}
        onShellChange={setShell}
        role={role}
        onRoleChange={(r) => {
          setRole(r);
          if (r === 'customer' && screen.startsWith('sp:')) go('home');
        }}
        device={device}
        onDeviceChange={setDevice}
        orientation={orientation}
        onOrientationChange={setOrientation}
        frameScale={frameScale}
        isDark={isDark}
        onToggleTheme={toggleTheme}
        onCapture={capture}
        emptyDemo={emptyDemo}
        onEmptyDemoChange={setEmptyDemo}
      />

      {/* The padding is the frame's drop shadow's room. The stage clips what
          it can't fit and the frame's own box stops at its edge, so without it
          the shadow was sliced flat along the bottom. The shadow is
          0 20px 32px -8px, which reaches 44px below the frame, 24px to each
          side and 4px above; the scale below measures the padded box, so the
          frame gives that room up rather than losing the shadow. */}
      <main
        ref={stageRef}
        className="grid h-full min-w-0 flex-1 place-items-center overflow-hidden px-6 pb-11 pt-1"
      >
        {/* Scaled stage: the frame renders at true device size, then scales
            down to fit — so media queries see the real device width. */}
        <div style={{ width: frame.w * frameScale, height: frame.h * frameScale }}>
        {/* phone frame — `relative` so the Sheet (absolute inset-0) fills it.
            `frameRef` is what the PNG capture snapshots. */}
        <div
          ref={frameRef}
          className="relative flex flex-col overflow-hidden border border-border bg-background text-foreground shadow-xl"
          style={{
            width: frame.w,
            height: frame.h,
            borderRadius: device.radius,
            transform: `scale(${frameScale})`,
            transformOrigin: 'top left',
          }}
        >
          <DemoStateProvider empty={emptyDemo || emptyView}>
          <ShellChrome
            shell={shell}
            screenKey={view}
            paytmHeader={view !== 'paytm-launcher' && view !== 'paytm-search'}
            bottomNav={
              ROOT_SCREENS.has(view) ? (
                <BottomNav
                  active={screen}
                  cartCount={cartCount}
                  onNavigate={go}
                />
              ) : undefined
            }
          >
            {phoneScreen}
          </ShellChrome>
          </DemoStateProvider>

          <UpdateSheet
            open={updateOpen}
            required={updateRequired}
            onClose={() => setUpdateOpen(false)}
            onUpdate={() => setUpdateOpen(false)}
          />

          <PromoBannersSheet open={promoOpen} onClose={() => setPromoOpen(false)} />

          <AddToCartSheet
            product={sheetProduct}
            qty={sheetId ? (qty[sheetId] ?? 0) : 0}
            onAdd={(pcs) => {
              if (sheetId) setLineQty(sheetId, (qty[sheetId] ?? 0) + pcs);
            }}
            onContinue={() => setSheetId(null)}
            onClose={() => setSheetId(null)}
          />

          <WholesalerUnitsSheet
            product={wholesaleSheetProduct}
            vendor={
              wholesaleSheetProduct
                ? wholesaleSheetProduct.vendors.find(
                    (v) => v.id === (wholesaleVendor[wholesaleSheetProduct.id] ?? cheapestVendorId(wholesaleSheetProduct))
                  ) ?? wholesaleSheetProduct.vendors[0]
                : null
            }
            qty={wholesaleSheetId ? (wholesaleQty[wholesaleSheetId] ?? 0) : 0}
            onAdd={(pcs) => {
              if (wholesaleSheetId) setWholesaleLineQty(wholesaleSheetId, (wholesaleQty[wholesaleSheetId] ?? 0) + pcs);
            }}
            onContinue={() => setWholesaleSheetId(null)}
            onClose={() => setWholesaleSheetId(null)}
          />

          <ProductImagesSheet product={galleryProduct} onClose={() => setGalleryId(null)} />

          <CartAlertsSheet
            open={alertsOpen}
            sellers={CART.sellers}
            onClose={() => setAlertsOpen(false)}
            onProceed={() => {
              setAlertsOpen(false);
              go('order-summary');
            }}
          />

          <OrderItemsSheet
            open={orderItemsOpen}
            seller={viewSeller}
            onClose={() => setOrderItemsOpen(false)}
          />
        </div>
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
