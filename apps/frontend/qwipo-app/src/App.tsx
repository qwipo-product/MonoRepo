import { useState, useEffect } from 'react';
import BuyerShell from './shells/BuyerShell';
import PaytmShell from './shells/PaytmShell';
import ShellSwitcher, { type Shell } from './review/ShellSwitcher';
import FlowIndex from './review/FlowIndex';
import type { ScreenId } from './review/screenIndex';
import SplashScreen from './screens-buyer-only/SplashScreen';
import LoginScreen from './screens-buyer-only/LoginScreen';
import OTPScreen from './screens-buyer-only/OTPScreen';
import OnboardingScreen from './screens-buyer-only/OnboardingScreen';
import CompleteKycScreen from './screens-buyer-only/CompleteKycScreen';
import KycSuccessScreen from './screens-buyer-only/KycSuccessScreen';
import HomeScreen from './screens/HomeScreen';
import GlobalSearchScreen from './screens/GlobalSearchScreen';
import AllBrandsScreen from './screens/AllBrandsScreen';
import DistributorsListScreen from './screens/DistributorsListScreen';
import WholesalersCategoriesScreen from './screens/WholesalersCategoriesScreen';
import SellerStorefront from './screens/SellerStorefront';
import ProductListingV2 from './screens/ProductListingV2';
import WholesalerProductListScreen from './screens/WholesalerProductListScreen';
import ReorderScreen from './screens/ReorderScreen';
import MultiSellerCartV2 from './screens/MultiSellerCartV2';
import ViewItemsScreen from './screens/ViewItemsScreen';
import OrderSummaryScreen from './screens/OrderSummaryScreen';
import CouponsScreen from './screens/CouponsScreen';
import OrderConfirmationScreen from './screens/OrderConfirmationScreen';
import MyOrdersScreen from './screens/MyOrdersScreen';
import OrderDetailsScreen from './screens/OrderDetailsScreen';
import ProfileScreen from './screens/ProfileScreen';
import NotificationsScreen from './screens/NotificationsScreen';
import BusinessDetailsScreen from './screens/sub/BusinessDetailsScreen';
import CreditScreen from './screens/sub/CreditScreen';
import PaymentScreen from './screens/sub/PaymentScreen';
import HelpScreen from './screens/sub/HelpScreen';
import TermsConditionsScreen from './screens/sub/TermsConditionsScreen';
import AddressesScreen from './screens/sub/AddressesScreen';
import LanguageScreen from './screens/sub/LanguageScreen';
import SettingsScreen from './screens/sub/SettingsScreen';
import AddToCartSheet from './components/AddToCartSheet';
import FiltersSheet, { DEFAULT_FILTERS, type Filters } from './components/FiltersSheet';
import DiscountsSheet from './components/DiscountsSheet';
import ProductImageSheet from './components/ProductImageSheet';
import CartValidationSheet from './components/CartValidationSheet';
import { products, seller, orders } from './data';

type OnboardingData = { location: string; businessName: string; businessType: string };
type CartLine = { product: any; variant: any; qty: number; price: number };
type SheetState = { product: any; variant: any; sellerOptions: any; hidePrice?: boolean } | null;

const BUILT = new Set<ScreenId>([
  'splash', 'login', 'otp', 'onboarding', 'kyc-complete', 'kyc-success',
  'home', 'home-distributors-only', 'home-wholesalers-only',
  'global-search', 'distributors-list', 'wholesaler-categories', 'all-brands',
  'storefront', 'listing', 'reorder',
  'wholesaler-products', 'distributor-units', 'wholesaler-units',
  'cart', 'view-items', 'cart-units', 'order-summary', 'coupons', 'order-confirmation',
  'my-orders', 'order-details',
  'profile', 'notifications', 'settings',
  'sub:business-details', 'sub:credit', 'sub:payment', 'sub:help', 'sub:terms', 'sub:addresses', 'sub:language',
]);
const HOME_AVAILABILITY: Record<string, 'both' | 'distributors' | 'wholesalers'> = {
  home: 'both', 'home-distributors-only': 'distributors', 'home-wholesalers-only': 'wholesalers',
};
const AUTH = new Set<ScreenId>(['splash', 'login', 'otp', 'onboarding', 'kyc-complete', 'kyc-success']);

/* One codebase, two chrome shells. Home roots / storefront / reorder render in
   the selected shell (status bar + tab bar); auth + pushed detail screens render
   in the bare frame. State-based nav mirrors qwipo-buyer-app. */
export default function App() {
  const [screen, setScreen] = useState<ScreenId>(() => new URLSearchParams(window.location.search).get('screen') || 'splash');
  const [shell, setShell] = useState<Shell>(new URLSearchParams(window.location.search).get('shell') === 'paytm' ? 'paytm' : 'buyer');
  const [phone, setPhone] = useState('');
  const [onboarding, setOnboarding] = useState<OnboardingData>({ location: '', businessName: '', businessType: '' });
  const [kycPending, setKycPending] = useState(false);
  const [wholesalerVariant, setWholesalerVariant] = useState<'groceries' | 'fmcg' | 'all'>('all');
  const [distListTab, setDistListTab] = useState<'categories' | 'brands' | 'sellers'>('categories');
  const [listingCategory, setListingCategory] = useState<any>(null);
  const [listingBack, setListingBack] = useState<ScreenId>('home');
  const [storefrontDistributor, setStorefrontDistributor] = useState<any>(null);
  const [wholesalerProductCategory, setWholesalerProductCategory] = useState<any>(null);
  const [cart, setCart] = useState<Record<string, CartLine>>({});
  const [sheet, setSheet] = useState<SheetState>(null);
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [extra, setExtra] = useState<{ kind: string; product?: any; variant?: any } | null>(null);
  const [viewItemsSellerId, setViewItemsSellerId] = useState<string | null>(null);
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [couponSellerId, setCouponSellerId] = useState<string | null>(null);
  const [activeOrder, setActiveOrder] = useState<any>((orders as any[])[0] ?? null);
  const go = (id: ScreenId) => { setSheet(null); setExtra(null); setScreen(id); };

  // ── cart ──────────────────────────────────────────────────────────────────
  const key = (pid: string, vid: string) => `${pid}_${vid}`;
  const addToCart = (product: any, variant: any, price?: number) =>
    setCart((prev) => {
      const k = key(product.id, variant.id);
      const qty = (prev[k]?.qty || 0) + 1;
      return { ...prev, [k]: { product, variant, qty, price: price ?? prev[k]?.price ?? variant.sellingPrice } };
    });
  const updateQty = (product: any, variant: any, qty: number, price?: number) =>
    setCart((prev) => {
      const k = key(product.id, variant.id);
      if (qty <= 0) { const n = { ...prev }; delete n[k]; return n; }
      return { ...prev, [k]: { product, variant, qty, price: price ?? prev[k]?.price ?? variant.sellingPrice } };
    });
  const cartItems = Object.fromEntries(Object.entries(cart).map(([k, v]) => [k, v.qty]));
  const cartTotal = Object.values(cart).reduce((n, i) => n + i.price * i.qty, 0);
  const cartCount = Object.values(cart).reduce((n, i) => n + i.qty, 0);

  // Group the flat cart into the seller-keyed model the cart/checkout screens
  // expect. All lines pool under one distributor (matches the source).
  const cartModel = (() => {
    const lines = Object.entries(cart);
    if (!lines.length) return { sellers: [] as any[] };
    const items = lines.map(([k, l]) => ({
      key: k, productId: l.product.id, name: l.product.name, variant: l.variant.size,
      image: l.product.image, bgColor: l.product.bgColor, brand: l.product.brand,
      mrp: l.variant.mrp, price: l.price, quantity: l.qty, unit: 'Pcs', scheme: l.variant.scheme,
    }));
    return { sellers: [{ id: 'sskt', name: (seller as any).name || 'Sri Sai Krishna Traders', type: 'distributor', mov: (seller as any).mov ?? 5000, deliveryWindows: (seller as any).deliveryWindows, items }] };
  })();
  const viewItemsSeller = cartModel.sellers.find((s) => s.id === viewItemsSellerId) || cartModel.sellers[0] || null;
  const updateItem = (item: any, qty: number) => setCart((prev) => { const n = { ...prev }; if (qty <= 0) delete n[item.key]; else if (n[item.key]) n[item.key] = { ...n[item.key], qty }; return n; });
  const openSheetForItem = (item: any) => { const p = (products as any[]).find((x) => x.id === item.productId); if (p) setSheet({ product: p, variant: p.variants.find((v: any) => v.size === item.variant) || p.variants[0], sellerOptions: null }); };

  // ── add-to-cart sheet (selling units) ───────────────────────────────────────
  const openSheet = (product: any, variant: any, sellerOptions: any = null) => setSheet({ product, variant, sellerOptions });
  const confirmSheet = (product: any, variant: any, totalPcs: number) => { updateQty(product, variant, totalPcs); setSheet(null); };

  // ── navigation helpers ──────────────────────────────────────────────────────
  const openListing = (category: any, from: ScreenId = 'home') => { setListingCategory(category); setListingBack(from); setFilters(DEFAULT_FILTERS); go('listing'); };
  const openStorefront = (distributor: any) => { setStorefrontDistributor(distributor); go('storefront'); };
  const openWholesalerProducts = (category: any) => { setWholesalerProductCategory(category); go('wholesaler-products'); };

  // FlowIndex picker: the two "selling units" entries open the Add-to-Cart sheet
  // over a listing backdrop (distributor = no seller options, wholesaler = with).
  const handlePick = (id: ScreenId) => {
    if (id === 'distributor-units') { setScreen('listing'); setSheet({ product: products[0], variant: products[0].variants[0], sellerOptions: null }); return; }
    if (id === 'wholesaler-units') {
      const p = products[0];
      setScreen('wholesaler-products');
      setSheet({ product: p, variant: p.variants[0], sellerOptions: [{ id: 'wh1', name: 'Omkar Enterprises', price: p.variants[0].sellingPrice }, { id: 'wh2', name: 'Sri Sai Krishna Traders', price: p.variants[0].sellingPrice + 7 }] });
      return;
    }
    if (id === 'view-items') { setViewItemsSellerId(cartModel.sellers[0]?.id ?? null); go('view-items'); return; }
    if (id === 'cart-units') {
      const s = cartModel.sellers[0];
      setViewItemsSellerId(s?.id ?? null); setScreen('view-items');
      if (s?.items[0]) openSheetForItem(s.items[0]);
      return;
    }
    go(id);
  };

  // Deep-link parity: ?screen=…-units opens the sheet over its backdrop on load.
  useEffect(() => {
    const s = new URLSearchParams(window.location.search).get('screen');
    if (s === 'distributor-units' || s === 'wholesaler-units') handlePick(s);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const homeProps = {
    kycPending,
    onCompleteKyc: () => go('kyc-complete'),
    onOpenNotifications: () => go('notifications'),
    onOpenProfile: () => go('profile'),
    onOpenAddresses: () => go('sub:addresses'),
    onOpenSearch: () => go('global-search'),
    onSelectDistributor: openStorefront,
    onSelectBrand: (b: any) => openListing({ id: b.id, name: b.name, isBrand: true }),
    onSelectDistributorBrand: (b: any) => openListing({ id: b.id, name: b.name, isBrand: true }),
    onSelectCategory: (c: any) => openListing(c),
    onSeeAllDistributors: () => { setDistListTab('sellers'); go('distributors-list'); },
    onSeeAllBrands: () => go('all-brands'),
    onSeeAllCategories: () => { setWholesalerVariant('all'); go('wholesaler-categories'); },
    onOpenWholesalerCategory: (id: string) => { setWholesalerVariant(id === 'groceries' ? 'groceries' : 'fmcg'); go('wholesaler-categories'); },
    onOpenBannerListing: () => openListing(null),
  };

  const bareScreen = (() => {
    switch (screen) {
      case 'splash': return <SplashScreen onContinue={() => go('login')} />;
      case 'login': return <LoginScreen onSubmit={(p) => { setPhone(p); go('otp'); }} />;
      case 'otp': return <OTPScreen phone={phone} onBack={() => go('login')} onVerify={() => go('onboarding')} />;
      case 'onboarding': return <OnboardingScreen onBack={() => go('otp')} onProceed={(data) => { setOnboarding(data); setKycPending(true); go('home'); }} />;
      case 'kyc-complete': return <CompleteKycScreen initialBusinessType={onboarding.businessType} initialLocation={onboarding.location} onCancel={() => go('home')} onRegister={() => go('kyc-success')} />;
      case 'kyc-success': return <KycSuccessScreen onCallSupport={() => alert('Calling customer support…')} onPlaceOrder={() => { setKycPending(false); go('home'); }} />;
      case 'global-search': return <GlobalSearchScreen onBack={() => go('home')} onSelectProduct={(p: any) => openListing({ id: p.category, name: p.name }, 'global-search')} />;
      case 'all-brands': return <AllBrandsScreen onBack={() => go('home')} onSelectBrand={(b: any) => openListing({ id: b.id, name: b.name, isBrand: true }, 'all-brands')} onOpenSearch={() => go('global-search')} />;
      case 'distributors-list': return <DistributorsListScreen initialTab={distListTab} onBack={() => go('home')} onSelectDistributor={openStorefront} onSelectBrand={(b: any) => openListing({ id: b.id, name: b.short || b.name, isBrand: true }, 'distributors-list')} onSelectCategory={(c: any) => openListing(c, 'distributors-list')} />;
      case 'wholesaler-categories': return <WholesalersCategoriesScreen variant={wholesalerVariant} onBack={() => go('home')} onSelectCategory={openWholesalerProducts} onOpenSearch={() => go('global-search')} />;
      case 'listing': return <ProductListingV2 category={listingCategory} cartItems={cartItems} cartTotal={cartTotal} filters={filters} onBack={() => go(listingBack)} onOpenSheet={openSheet} onUpdateQty={updateQty} onGoToCart={() => go('cart')} onOpenSearch={() => go('global-search')} onOpenImageSheet={(p: any) => setExtra({ kind: 'image', product: p })} onOpenDiscounts={(p: any, v: any) => setExtra({ kind: 'discounts', variant: v })} onOpenFilters={() => setExtra({ kind: 'filters' })} />;
      case 'wholesaler-products': return <WholesalerProductListScreen category={wholesalerProductCategory} cartItems={cartItems} cartTotal={cartTotal} onBack={() => go('wholesaler-categories')} onOpenSheet={openSheet} onGoToCart={() => go('cart')} onOpenSearch={() => go('global-search')} onOpenImageSheet={(p: any) => setExtra({ kind: 'image', product: p })} onOpenDiscounts={(p: any, v: any) => setExtra({ kind: 'discounts', variant: v })} />;
      case 'cart': return <MultiSellerCartV2 cart={cartModel} onBack={() => go('home')} onCheckout={() => setExtra({ kind: 'validation' })} onAddMore={() => go('home')} onViewItems={(s: any) => { setViewItemsSellerId(s.id); go('view-items'); }} />;
      case 'view-items': return <ViewItemsScreen seller={viewItemsSeller} onBack={() => go('cart')} onAddMore={() => go('home')} onUpdateItem={updateItem} onItemTap={openSheetForItem} />;
      case 'order-summary': return <OrderSummaryScreen cart={cartModel} appliedCoupon={appliedCoupon} couponSellerId={couponSellerId} onBack={() => go('cart')} onPlaceOrder={() => go('order-confirmation')} onViewItems={(s: any) => { setViewItemsSellerId(s.id); go('view-items'); }} onOpenCoupons={(sid: string) => { setCouponSellerId(sid); go('coupons'); }} onRemoveCoupon={() => setAppliedCoupon(null)} />;
      case 'coupons': return <CouponsScreen cartTotal={cartTotal || 4250} appliedId={appliedCoupon?.id ?? null} onBack={() => go('order-summary')} onApply={(c: any) => { setAppliedCoupon(c); go('order-summary'); }} />;
      case 'order-confirmation': return <OrderConfirmationScreen onBackToHome={() => { setCart({}); setAppliedCoupon(null); go('home'); }} />;
      case 'my-orders': return <MyOrdersScreen onBack={() => go('profile')} onOpenDetails={(o: any) => { setActiveOrder(o); go('order-details'); }} />;
      case 'order-details': return <OrderDetailsScreen order={activeOrder} onBack={() => go('my-orders')} />;
      case 'profile': return <ProfileScreen onOpenSubPage={(id: ScreenId) => go(id)} onOpenNotifications={() => go('notifications')} onSignOut={() => { setCart({}); go('splash'); }} />;
      case 'notifications': return <NotificationsScreen onBack={() => go('profile')} />;
      case 'settings': return <SettingsScreen onBack={() => go('profile')} onOpenLanguage={() => go('sub:language')} />;
      case 'sub:business-details': return <BusinessDetailsScreen onBack={() => go('profile')} />;
      case 'sub:credit': return <CreditScreen onBack={() => go('profile')} />;
      case 'sub:payment': return <PaymentScreen onBack={() => go('profile')} />;
      case 'sub:help': return <HelpScreen onBack={() => go('profile')} />;
      case 'sub:terms': return <TermsConditionsScreen onBack={() => go('profile')} />;
      case 'sub:addresses': return <AddressesScreen onBack={() => go('home')} onSaved={() => go('home')} />;
      case 'sub:language': return <LanguageScreen onBack={() => go('settings')} />;
      default: return null;
    }
  })();

  const cartSheet = sheet && (
    <AddToCartSheet product={sheet.product} initialVariant={sheet.variant} sellerOptions={sheet.sellerOptions} hidePrice={sheet.hidePrice} onClose={() => setSheet(null)} onConfirm={confirmSheet} />
  );
  const extraSheet = extra && (
    extra.kind === 'filters' ? <FiltersSheet initialFilters={filters} onClose={() => setExtra(null)} onApply={setFilters} /> :
    extra.kind === 'discounts' ? <DiscountsSheet variant={extra.variant} onClose={() => setExtra(null)} /> :
    extra.kind === 'image' ? <ProductImageSheet product={extra.product} onClose={() => setExtra(null)} onAddClick={() => { const p = extra.product; setExtra(null); openSheet(p, p.variants[0]); }} /> :
    extra.kind === 'validation' ? <CartValidationSheet cart={cartModel} onClose={() => setExtra(null)} onProceed={() => { setExtra(null); go('order-summary'); }} onAddItems={() => go('home')} /> : null
  );
  const overlays = <>{cartSheet}{extraSheet}</>;

  const CurrentShell = shell === 'paytm' ? PaytmShell : BuyerShell;
  const shellContent = (() => {
    if (screen in HOME_AVAILABILITY) return <HomeScreen sellerAvailability={HOME_AVAILABILITY[screen]} {...homeProps} />;
    if (screen === 'storefront') return <SellerStorefront distributor={storefrontDistributor} onBack={() => go('home')} onSelectCategory={(c: any) => openListing({ ...c, fromStorefront: true }, 'storefront')} onOpenSearch={() => go('global-search')} />;
    if (screen === 'reorder') return <ReorderScreen cartItems={cartItems} cartTotal={cartTotal} onOpenSheet={openSheet} onUpdateQty={updateQty} onGoToCart={() => go('cart')} onOpenImageSheet={(p: any) => setExtra({ kind: 'image', product: p })} onOpenDiscounts={(p: any, v: any) => setExtra({ kind: 'discounts', variant: v })} />;
    return <Placeholder />;
  })();
  const activeTab = screen === 'reorder' ? 'reorder' : 'home';

  // Auth is pre-login — the Paytm surface has no auth (SSO via the container),
  // so the buyer/paytm toggle only makes sense once you're in the app.
  const showSwitcher = !AUTH.has(screen);

  // Bare screens (auth + pushed detail) render chromeless in the phone frame;
  // home/storefront/reorder render inside the selected shell (its chrome).
  const frame = bareScreen ? (
    <div className="relative h-[844px] w-[390px] overflow-hidden rounded-[2rem] bg-background text-foreground shadow-xl">
      {bareScreen}
      {overlays}
    </div>
  ) : (
    <CurrentShell active={activeTab} cartCount={cartCount} onNavigate={go} overlay={overlays}>
      {shellContent}
    </CurrentShell>
  );

  return (
    <div className="flex min-h-dvh bg-shell">
      <FlowIndex active={screen} built={BUILT} onPick={handlePick} />
      <main className="flex flex-1 flex-col items-center justify-center gap-4 p-6">
        {showSwitcher && <ShellSwitcher value={shell} onChange={setShell} />}
        {frame}
      </main>
    </div>
  );
}

function Placeholder() {
  return <div className="grid h-full place-items-center p-8 text-center text-sm text-muted-foreground">This screen lands in a later phase.</div>;
}
