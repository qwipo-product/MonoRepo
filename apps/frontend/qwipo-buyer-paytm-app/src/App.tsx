import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { toPng } from 'html-to-image';
import { useTheme } from '@mockups/ui';
import FlowIndex from './review/FlowIndex';
import { type ScreenId, screenNumber } from './review/screenIndex';
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
import { ProductImagesSheet } from './sheets/ProductImagesSheet';
import { UpdateSheet } from './sheets/UpdateSheet';
import { CartAlertsSheet } from './sheets/CartAlertsSheet';
import { OrderItemsSheet } from './sheets/OrderItemsSheet';
import { SplashScreen } from './screens/auth/SplashScreen';
import { LoginScreen } from './screens/auth/LoginScreen';
import { OtpScreen } from './screens/auth/OtpScreen';
import { OnboardingScreen } from './screens/auth/OnboardingScreen';
import { CompleteKycScreen } from './screens/auth/CompleteKycScreen';
import { KycSuccessScreen } from './screens/auth/KycSuccessScreen';
import { SavedAddressesScreen } from './screens/SavedAddressesScreen';
import { LocationPickerScreen } from './screens/LocationPickerScreen';
import { AddressDetailsScreen } from './screens/AddressDetailsScreen';
import { GlobalSearchScreen } from './screens/GlobalSearchScreen';
import { SellerBrowseScreen, type BrowseTab } from './screens/SellerBrowseScreen';
import { StorefrontScreen } from './screens/StorefrontScreen';
import { WholesalerProductsScreen } from './screens/WholesalerProductsScreen';
import { ReorderScreen } from './screens/ReorderScreen';
import type { NavOpts } from './nav';
import type { AppliedFilter } from './data/filters';
import { PRODUCTS, productById } from './data/products';
import { DIST_CATEGORIES, WHOLESALER_CATEGORIES, BRANDS, DISTRIBUTORS, type Distributor } from './data/home';
import { buildCart } from './data/cart';
import { ORDERS, type Order } from './data/orders';
import {
  ADDRESSES,
  availabilityFor,
  isDeliverable,
  DEFAULT_ADDRESS_ID,
  type Address,
} from './data/addresses';
import { CURRENT_PLACE_ID, formatPlace, placeById, type Place } from './data/places';

// Screens migrated to v2 so far. Everything else shows a placeholder + "soon".
const BUILT = new Set<ScreenId>([
  'paytm-launcher', 'paytm-search', 'paytm-welcome',
  'splash', 'login', 'otp', 'onboarding', 'kyc-complete', 'kyc-success',
  'home', 'listing', 'cart', 'distributor-units', 'sub:addresses', 'global-search',
  'distributors-list', 'wholesaler-categories', 'storefront', 'wholesaler-products', 'wholesaler-units',
  'view-items', 'cart-units', 'cart-alerts', 'order-summary', 'order-items', 'coupons', 'order-confirmation', 'reorder',
  'my-orders', 'order-details', 'profile', 'notifications', 'sub:business-details',
  'app-update', 'app-update-required', 'location-picker', 'address-details',
  'login-error', 'otp-error', 'cart-price-changes',
  'sub:payment', 'sub:payment-orders', 'sub:payment-gateways', 'sub:credit',
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
for (const id of [...BUILT]) BUILT.add(EMPTY_PREFIX + id);

// Root screens get the bottom tab bar (buyer shell); pushed screens don't.
const ROOT_SCREENS = new Set<ScreenId>(['home', 'reorder', 'profile', 'storefront']);

// Product-list screens that accept an incoming applied filter + Back target.
const PRODUCT_LISTS = new Set<ScreenId>(['listing', 'wholesaler-products', 'wholesaler-units']);

// Qwipo-app-only screens. The Paytm mini runs the same sign-in (phone → OTP)
// and the same onboarding + KYC; the only thing it never shows is the app
// splash, because it launches from inside Paytm rather than cold-starting.
const QWIPO_ONLY_SCREENS = new Set<ScreenId>(['splash']);

function readInitialScreen(): ScreenId {
  const params = new URLSearchParams(window.location.search);
  const s = params.get('screen');
  // Paytm mini boots into the Paytm launcher
  // (→ search → welcome/consent → login → OTP → onboarding → home).
  if (!s) return params.get('shell') === 'paytm' ? 'paytm-launcher' : 'listing';
  if (s === 'distributor-units') return 'listing';
  if (s === 'cart-units') return 'view-items'; // = the sheet over View Items
  if (s === 'cart-price-changes') return 'view-items'; // = View Items, price-change lines
  if (s === 'cart-alerts') return 'cart'; // = the alerts sheet over Cart Summary
  if (s === 'app-update' || s === 'app-update-required') return 'home'; // = update sheet over Home
  if (s === 'order-items') return 'order-summary'; // = the items sheet over Order Summary
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
  const [orderItemsOpen, setOrderItemsOpen] = useState(false);
  const [qty, setQty] = useState<Record<string, number>>({});
  const [viewSellerId, setViewSellerId] = useState<string | null>(CART.sellers[0]?.id ?? null);
  // Any order list → the one shared Order Details, with a per-source back target.
  const [detailsOrder, setDetailsOrder] = useState<Order | null>(null);
  const [detailsBackTo, setDetailsBackTo] = useState<ScreenId>('my-orders');
  const [deliveryAddressId, setDeliveryAddressId] = useState<string>(DEFAULT_ADDRESS_ID);
  // Saved addresses live here: adding one leaves Saved Addresses for the map.
  const [addresses, setAddresses] = useState<Address[]>(ADDRESSES);
  // Location flow: map → address details → back to whoever started it.
  const [pickedPlace, setPickedPlace] = useState<Place>(() => placeById(CURRENT_PLACE_ID));
  const [pickerStartId, setPickerStartId] = useState<string | undefined>(undefined);
  const [addressFlowFrom, setAddressFlowFrom] = useState<ScreenId>('sub:addresses');
  // Onboarding form — held here so picking a location doesn't wipe the rest.
  const [obLocation, setObLocation] = useState('');
  const [obBusinessName, setObBusinessName] = useState('');
  const [obBusinessType, setObBusinessType] = useState('');
  /* KYC gate. The demo persona is already verified, so the existing flows work
     as before; walking a fresh signup (onboarding) clears it, and KYC Success
     sets it again. Ordering — not browsing — is what it blocks. */
  const [kycComplete, setKycComplete] = useState(true);
  // Payments flow context: selected vendor + amount carried into the pay screen.
  const [paymentVendorId, setPaymentVendorId] = useState<string>('qwipo');
  const [payAmount, setPayAmount] = useState<number>(0);
  // Salesperson flow: phone entered at login (9000000001 → salesperson) + task context.
  const [loginPhone, setLoginPhone] = useState<string>('');
  const [taskId, setTaskId] = useState<string>('tk1');
  const [spCustomerId, setSpCustomerId] = useState<string>('c1');
  // Persona: salesperson unlocks the beat-day features (Home task icon, My
  // Account section, sidebar group). Set by login 9000000001 or the switcher.
  const [role, setRole] = useState<Role>('customer');
  // Filter/back context carried into product lists, storefront, and browse tabs.
  const [listApplied, setListApplied] = useState<AppliedFilter[]>([]);
  const [listBackTo, setListBackTo] = useState<ScreenId>('home');
  const [storefrontBackTo, setStorefrontBackTo] = useState<ScreenId>('home');
  const [selectedDistributor, setSelectedDistributor] = useState<Distributor>(DISTRIBUTORS[0]);
  const [browseTab, setBrowseTab] = useState<BrowseTab | undefined>(undefined);

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
  const cartCount = Object.values(qty).reduce((n, q) => n + q, 0);
  const cartTotal = PRODUCTS.reduce((s, p) => s + p.price * (qty[p.id] ?? 0), 0);
  const sheetProduct = sheetId ? productById(sheetId) ?? null : null;
  const galleryProduct = galleryId ? productById(galleryId) ?? null : null;
  // Salesperson persona is Qwipo-app-only; the Paytm mini surface is customer-only.
  const isSalesperson = role === 'salesperson' && shell === 'buyer';

  // Navigate. `distributor-units` isn't a page — it's the sheet over the listing.
  const viewSeller = CART.sellers.find((s) => s.id === viewSellerId) ?? CART.sellers[0] ?? null;

  const go = (id: ScreenId, opts?: NavOpts) => {
    setSheetId(null);
    setAlertsOpen(false);
    setOrderItemsOpen(false);
    setUpdateOpen(false);
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
      setListBackTo('home');
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
      setListBackTo(opts?.backTo ?? 'home');
    }
    // Only overwrite on a real entry (home rail / browse); a list→storefront
    // bounce carries no backTo and should keep the original target.
    if (id === 'storefront' && opts?.backTo) setStorefrontBackTo(opts.backTo);
    if (id === 'storefront' && opts?.distributor) setSelectedDistributor(opts.distributor);
    if (id === 'distributors-list' || id === 'wholesaler-categories') {
      setBrowseTab(opts?.tab as BrowseTab | undefined);
    }
    setScreen(id);
  };

  /* Start the map → address-details flow. `from` is where Save returns to and
     where Back unwinds to, so the same two screens serve onboarding and
     Saved Addresses without either knowing about the other. */
  const startLocationFlow = (from: ScreenId, useCurrent: boolean) => {
    setAddressFlowFrom(from);
    setPickerStartId(useCurrent ? CURRENT_PLACE_ID : undefined);
    go('location-picker');
  };

  // Open the shared Order Details for any order, remembering where to return.
  const openOrder = (order: Order, backTo: ScreenId) => {
    setDetailsOrder(order);
    setDetailsBackTo(backTo);
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
        return <PaytmSearchScreen onBack={() => go('paytm-launcher')} onOpenQwipo={() => go('paytm-welcome')} />;
      case 'paytm-welcome':
        return <PaytmWelcomeScreen onProceed={() => go('login')} />;
      case 'splash':
        return <SplashScreen onContinue={() => go('login')} />;
      case 'login-error':
        return <LoginScreen demoError onNext={() => go('otp')} />;
      case 'otp-error':
        return <OtpScreen demoError onBack={() => go('login')} onVerify={() => go('onboarding')} />;
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
            onBack={() => go('login')}
            onVerify={() => {
              const isSp = loginPhone === SALESPERSON_PHONE;
              setRole(isSp ? 'salesperson' : 'customer');
              go(isSp ? 'home' : 'onboarding');
            }}
          />
        );
      case 'onboarding':
        return (
          <OnboardingScreen
            onBack={() => go('otp')}
            // Paytm lands on Home once onboarded; the Qwipo app goes on to KYC.
            onProceed={() => {
              setKycComplete(false);
              go(shell === 'paytm' ? 'home' : 'kyc-complete');
            }}
            location={obLocation}
            onPickLocation={(useCurrent) => startLocationFlow('onboarding', useCurrent)}
            businessName={obBusinessName}
            onBusinessName={setObBusinessName}
            businessType={obBusinessType}
            onBusinessType={setObBusinessType}
          />
        );
      case 'kyc-complete':
        return (
          <CompleteKycScreen
            onCancel={() => go(shell === 'paytm' ? 'home' : 'listing')}
            onRegister={() => go('kyc-success')}
          />
        );
      case 'kyc-success':
        return (
          <KycSuccessScreen
            onPlaceOrder={() => {
              setKycComplete(true);
              go(shell === 'paytm' ? 'home' : 'listing');
            }}
          />
        );
      case 'home':
        return (
          <HomeScreen
            onNavigate={go}
            availability={
              screen === 'empty:home-distributors'
                ? 'wholesalers'
                : screen === 'empty:home-wholesalers'
                  ? 'distributors'
                  : availabilityFor(deliveryAddressId)
            }
            deliveryLabel={addresses.find((a) => a.id === deliveryAddressId)?.title}
            salesperson={isSalesperson}
          />
        );
      case 'sub:addresses':
        return (
          <SavedAddressesScreen
            onBack={() => go('home')}
            selectedId={deliveryAddressId}
            onSelect={setDeliveryAddressId}
            addresses={addresses}
            onAddNew={() => startLocationFlow('sub:addresses', false)}
          />
        );
      case 'global-search':
        return <GlobalSearchScreen onBack={() => go('home')} onOpenSheet={setSheetId} onNavigate={go} />;
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
        return <WholesalerProductsScreen applied={listApplied} onBack={() => go(listBackTo)} onSearch={() => go('global-search')} onGoToCart={() => go('cart')} />;
      case 'wholesaler-units':
        return <WholesalerProductsScreen initialSheet applied={listApplied} onBack={() => go(listBackTo)} onSearch={() => go('global-search')} onGoToCart={() => go('cart')} />;
      case 'storefront':
        return <StorefrontScreen distributor={selectedDistributor} onBack={() => go(storefrontBackTo)} onNavigate={go} />;
      case 'listing':
        return (
          <CatalogScreen
            applied={listApplied}
            onBack={() => go(listBackTo)}
            onSearch={() => go('global-search')}
            qty={qty}
            onOpenSheet={setSheetId}
            onOpenGallery={setGalleryId}
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
            onCheckout={() => setAlertsOpen(true)}
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
            addressPending={!isDeliverable(addresses.find((a) => a.id === deliveryAddressId) ?? addresses[0])}
            kycPending={!kycComplete}
            onCompleteKyc={() => go('kyc-complete')}
            onOpenCoupons={() => go('coupons')}
            onViewItems={(sellerId) => {
              setViewSellerId(sellerId);
              setOrderItemsOpen(true);
            }}
          />
        );
      case 'coupons':
        return <CouponsScreen onBack={() => go('order-summary')} onApply={() => go('order-summary')} />;
      case 'order-confirmation':
        return <OrderConfirmationScreen onBackToHome={() => go('home')} />;
      case 'reorder':
        return <ReorderScreen qty={qty} onOpenSheet={setSheetId} onSetQty={setLineQty} onSearch={() => go('global-search')} onBack={() => go('home')} />;
      case 'profile':
        return <MyAccountScreen onNavigate={go} onSignOut={() => go(shell === 'paytm' ? 'home' : 'login')} salesperson={isSalesperson} />;
      case 'notifications':
        return <NotificationsScreen onBack={() => go('profile')} />;
      case 'sub:business-details':
        return <BusinessDetailsScreen onBack={() => go('profile')} />;
      case 'sub:payment':
        return (
          <PaymentsScreen
            onBack={() => go('profile')}
            onOpenVendor={(id) => {
              setPaymentVendorId(id);
              go('sub:payment-orders');
            }}
          />
        );
      case 'sub:payment-orders':
        return (
          <PaymentOrdersScreen
            vendorId={paymentVendorId}
            onBack={() => go('sub:payment')}
            onPay={(amount) => {
              setPayAmount(amount);
              go('sub:payment-gateways');
            }}
          />
        );
      case 'sub:payment-gateways':
        return (
          <PaymentGatewaysScreen
            vendorId={paymentVendorId}
            amount={payAmount}
            onBack={() => go('sub:payment-orders')}
            onDone={() => go('sub:payment')}
          />
        );
      case 'sub:credit':
        return <CreditPartnersScreen onBack={() => go('profile')} />;
      case 'sub:language':
        return <LanguageScreen onBack={() => go('profile')} />;
      case 'sub:help':
        return <ContactUsScreen onBack={() => go('profile')} />;
      case 'sub:terms':
        return <TermsScreen onBack={() => go('profile')} />;

      // Salesperson features (login 9000000001) — surfaced in the customer app
      // via the Home task icon + My Account section.
      case 'sp:attendance':
        return <AttendanceScreen onBack={() => go('profile')} />;
      case 'sp:tasks':
        return (
          <TaskListScreen
            onBack={() => go('profile')}
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
            onBack={() => go('sp:tasks')}
            onCreateInteraction={(id) => {
              setTaskId(id);
              go('sp:create-interaction');
            }}
            onOpenOrder={(o) => openOrder(o, 'sp:task-details')}
          />
        );
      case 'sp:create-interaction':
        return (
          <CreateInteractionScreen onBack={() => go('sp:task-details')} onDone={() => go('sp:task-details')} />
        );
      case 'sp:performance':
        return <PerformanceScreen onBack={() => go('profile')} />;
      case 'sp:orders':
        return <CustomerOrdersScreen onBack={() => go('profile')} onOpenOrder={(o) => openOrder(o, 'sp:orders')} />;
      case 'sp:switch-customer':
        return <SwitchCustomerScreen onBack={() => go('profile')} onSwitch={() => go('home')} />;
      case 'sp:customers':
        return (
          <CustomerListScreen
            onBack={() => go('profile')}
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
            onBack={() => go('sp:customers')}
            onOpenOrder={(o) => openOrder(o, 'sp:customer-details')}
          />
        );

      case 'location-picker':
        return (
          <LocationPickerScreen
            initialPlaceId={pickerStartId}
            onBack={() => go(addressFlowFrom)}
            onConfirm={(place) => {
              setPickedPlace(place);
              go('address-details');
            }}
          />
        );
      case 'address-details':
        return (
          <AddressDetailsScreen
            place={pickedPlace}
            onBack={() => go('location-picker')}
            onChangeLocation={() => go('location-picker')}
            saveLabel={addressFlowFrom === 'onboarding' ? 'Confirm location' : 'Save address'}
            onSave={(address) => {
              if (addressFlowFrom === 'onboarding') {
                // Onboarding shows the picked address in its Delivery Location field.
                setObLocation(`${address.title}, ${formatPlace(pickedPlace)}`);
              } else {
                // Appended, not prepended: pending addresses belong at the
                // bottom, and they don't take over delivery on their own.
                setAddresses((list) => [...list, address]);
              }
              go(addressFlowFrom);
            }}
          />
        );
      case 'my-orders':
        return (
          <MyOrdersScreen
            onBack={() => go('home')}
            onStartShopping={() => go('listing')}
            onOpenDetails={(id) => {
              const o = ORDERS.find((x) => x.id === id) ?? ORDERS[0];
              openOrder(o, 'my-orders');
            }}
          />
        );
      case 'order-details': {
        const order = detailsOrder ?? ORDERS[0];
        return order ? (
          <OrderDetailsScreen order={order} onBack={() => go(detailsBackTo)} />
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

      <main ref={stageRef} className="grid h-full min-w-0 flex-1 place-items-center overflow-hidden">
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
            paytmHeader={view !== 'paytm-launcher' && view !== 'paytm-search'}
            bottomNav={
              ROOT_SCREENS.has(view) ? (
                <BottomNav active={screen} cartCount={cartCount} onNavigate={go} />
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

          <AddToCartSheet
            product={sheetProduct}
            cartTotal={cartTotal}
            onAdd={(pcs) => {
              if (sheetId) setLineQty(sheetId, (qty[sheetId] ?? 0) + pcs);
            }}
            onContinue={() => setSheetId(null)}
            onClose={() => setSheetId(null)}
          />

          <ProductImagesSheet product={galleryProduct} onClose={() => setGalleryId(null)} />

          <CartAlertsSheet
            open={alertsOpen}
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
