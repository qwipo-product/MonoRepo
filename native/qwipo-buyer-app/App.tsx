import { useEffect, useMemo, useState } from 'react';
import { BackHandler, Text as RNText, TextInput as RNTextInput, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold,
} from '@expo-google-fonts/inter';

// Default every unweighted <Text>/<TextInput> to Inter (weighted text picks its
// face via the font-* classes mapped in tailwind.config.js). Matches web --font-sans.
const withInter = (C: any) => {
  C.defaultProps = C.defaultProps || {};
  C.defaultProps.style = [{ fontFamily: 'Inter_400Regular' }, C.defaultProps.style];
};
withInter(RNText);
withInter(RNTextInput);

import type { ScreenId } from './src/nav/screenIndex';
import { ROOT_SCREENS } from './src/nav/screenIndex';
import type { NavOpts } from './src/nav/nav';
import type { AppliedFilter } from './src/data/filters';
import type { Distributor } from './src/data/home';

import { BottomNav } from './src/components/BottomNav';
import { PlaceholderScreen } from './src/screens/PlaceholderScreen';
import { SplashScreen } from './src/screens/SplashScreen';
import { LoginScreen } from './src/screens/LoginScreen';
import { OtpScreen } from './src/screens/OtpScreen';
import { OnboardingScreen } from './src/screens/auth/OnboardingScreen';
import { CompleteKycScreen } from './src/screens/auth/CompleteKycScreen';
import { KycSuccessScreen } from './src/screens/auth/KycSuccessScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { WholesalerProductsScreen } from './src/screens/WholesalerProductsScreen';
import { CatalogScreen } from './src/screens/CatalogScreen';
import { StorefrontScreen } from './src/screens/StorefrontScreen';
import { GlobalSearchScreen } from './src/screens/GlobalSearchScreen';
import { CartScreen } from './src/screens/CartScreen';
import { ViewItemsScreen } from './src/screens/ViewItemsScreen';
import { OrderSummaryScreen } from './src/screens/OrderSummaryScreen';
import { CouponsScreen } from './src/screens/CouponsScreen';
import { OrderConfirmationScreen } from './src/screens/OrderConfirmationScreen';
import { MyOrdersScreen } from './src/screens/MyOrdersScreen';
import { OrderDetailsScreen } from './src/screens/OrderDetailsScreen';
import { ReorderScreen } from './src/screens/ReorderScreen';
import { ORDERS, type Order } from './src/data/orders';
import { MyAccountScreen } from './src/screens/MyAccountScreen';
import { SavedAddressesScreen } from './src/screens/SavedAddressesScreen';
import { BusinessDetailsScreen } from './src/screens/BusinessDetailsScreen';
import { PaymentsScreen } from './src/screens/PaymentsScreen';
import { PaymentOrdersScreen } from './src/screens/PaymentOrdersScreen';
import { PaymentGatewaysScreen } from './src/screens/PaymentGatewaysScreen';
import { CreditPartnersScreen } from './src/screens/CreditPartnersScreen';
import { LanguageScreen } from './src/screens/LanguageScreen';
import { ContactUsScreen } from './src/screens/ContactUsScreen';
import { TermsScreen } from './src/screens/TermsScreen';
import { NotificationsScreen } from './src/screens/NotificationsScreen';
import { SellerBrowseScreen, type BrowseTab } from './src/screens/SellerBrowseScreen';
import { AttendanceScreen } from './src/screens/salesperson/AttendanceScreen';
import { TaskListScreen } from './src/screens/salesperson/TaskListScreen';
import { TaskDetailsScreen } from './src/screens/salesperson/TaskDetailsScreen';
import { CreateInteractionScreen } from './src/screens/salesperson/CreateInteractionScreen';
import { PerformanceScreen } from './src/screens/salesperson/PerformanceScreen';
import { CustomerOrdersScreen } from './src/screens/salesperson/CustomerOrdersScreen';
import { SwitchCustomerScreen } from './src/screens/salesperson/SwitchCustomerScreen';
import { CustomerListScreen } from './src/screens/salesperson/CustomerListScreen';
import { CustomerDetailsScreen } from './src/screens/salesperson/CustomerDetailsScreen';
import { DIST_CATEGORIES, BRANDS, DISTRIBUTORS, WHOLESALER_CATEGORIES } from './src/data/home';
import { DEFAULT_ADDRESS_ID, addressById, availabilityFor } from './src/data/addresses';
import { AddToCartSheet } from './src/sheets/AddToCartSheet';
import { CartAlertsSheet } from './src/sheets/CartAlertsSheet';
import { OrderItemsSheet } from './src/sheets/OrderItemsSheet';
import { PRODUCTS } from './src/data/products';
import { buildCart } from './src/data/cart';

const SALESPERSON_PHONE = '9000000001';
type Role = 'customer' | 'salesperson';

export default function App() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
  });

  const [screen, setScreen] = useState<ScreenId>('splash');
  const [backTo, setBackTo] = useState<ScreenId>('home');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<Role>('customer');

  // Product-list context
  const [listApplied, setListApplied] = useState<AppliedFilter[]>([]);
  const [category, setCategory] = useState<string | undefined>();
  const [distributor, setDistributor] = useState<Distributor | undefined>();
  const [browseTab, setBrowseTab] = useState<BrowseTab>('categories');

  // Cart state (lifted; filled in as screens land)
  const [qty, setQty] = useState<Record<string, number>>({});
  const cartCount = Object.values(qty).reduce((n, x) => n + x, 0);
  const cartTotal = PRODUCTS.reduce((s, p) => s + p.price * (qty[p.id] ?? 0), 0);
  const setQtyFor = (id: string, n: number) => setQty((s) => ({ ...s, [id]: Math.max(0, n) }));
  const addPcs = (id: string, pcs: number) => setQty((s) => ({ ...s, [id]: (s[id] ?? 0) + pcs }));

  // Add-to-cart sheet (distributor selling units) — driven by product id.
  const [sheetId, setSheetId] = useState<string | null>(null);
  const sheetProduct = sheetId ? PRODUCTS.find((p) => p.id === sheetId) ?? null : null;

  // Checkout sheets + selected seller (for View Items / Order Items).
  const [alertsOpen, setAlertsOpen] = useState(false);
  const [orderItemsOpen, setOrderItemsOpen] = useState(false);
  const [selectedSellerId, setSelectedSellerId] = useState<string | null>(null);
  const cartSellers = useMemo(() => buildCart().sellers, []);
  const selectedSeller = cartSellers.find((s) => s.id === selectedSellerId) ?? null;

  // Shared Order Details (reached from My Orders; carries where to return).
  const [detailsOrder, setDetailsOrder] = useState<Order | null>(null);
  const [detailsBackTo, setDetailsBackTo] = useState<ScreenId>('my-orders');
  const openOrder = (order: Order, back: ScreenId) => {
    setDetailsOrder(order);
    setDetailsBackTo(back);
    go('order-details');
  };

  // Selected delivery address → drives Home label + channel availability.
  const [deliveryAddressId, setDeliveryAddressId] = useState<string>(DEFAULT_ADDRESS_ID);

  // Payments drill-down: selected vendor + amount to pay.
  const [paymentVendorId, setPaymentVendorId] = useState<string>('qwipo');
  const [payAmount, setPayAmount] = useState<number>(0);

  // Salesperson drill-downs: selected task + customer.
  const [spTaskId, setSpTaskId] = useState<string>('tk1');
  const [spCustomerId, setSpCustomerId] = useState<string>('c1');

  // Navigation history (back stack). go() pushes, back() pops, reset() clears.
  const [history, setHistory] = useState<ScreenId[]>([]);
  const closeSheets = () => {
    setSheetId(null);
    setAlertsOpen(false);
    setOrderItemsOpen(false);
  };

  const go: (id: ScreenId, opts?: NavOpts) => void = (id, opts) => {
    closeSheets();
    if (opts?.applied) setListApplied(opts.applied);
    if (opts?.distributor) setDistributor(opts.distributor);
    if (opts?.tab) setBrowseTab(opts.tab as BrowseTab);
    setHistory((h) => [...h, screen]);
    setScreen(id);
  };

  // Pop one screen. Returns false when the stack is empty (let the OS handle it).
  const back = (): boolean => {
    closeSheets();
    if (history.length === 0) {
      // Empty stack: fall back to Home so a screen is never a dead end (lets the
      // OS exit only when already on Home).
      if (screen !== 'home') {
        setScreen('home');
        return true;
      }
      return false;
    }
    setScreen(history[history.length - 1]);
    setHistory(history.slice(0, -1));
    return true;
  };

  // Jump to a root screen and clear the back stack (bottom nav, home, sign-out).
  const reset = (id: ScreenId) => {
    closeSheets();
    setHistory([]);
    setScreen(id);
  };

  // Android hardware back → pop the stack; exit only from a root.
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => back());
    return () => sub.remove();
  }, [history.length]);

  const body = (() => {
    switch (screen) {
      case 'splash':
        return <SplashScreen onContinue={() => go('login')} />;
      case 'login':
        return (
          <LoginScreen
            onNext={(p) => {
              setPhone(p);
              go('otp');
            }}
          />
        );
      case 'otp':
        return (
          <OtpScreen
            onBack={back}
            onVerify={() => {
              const sp = phone === SALESPERSON_PHONE;
              setRole(sp ? 'salesperson' : 'customer');
              if (sp) reset('home');
              else go('onboarding');
            }}
          />
        );
      case 'onboarding':
        return <OnboardingScreen onBack={back} onProceed={() => go('kyc-complete')} />;
      case 'kyc-complete':
        return <CompleteKycScreen onCancel={back} onRegister={() => go('kyc-success')} />;
      case 'kyc-success':
        return <KycSuccessScreen onPlaceOrder={() => reset('home')} />;
      case 'home':
        return (
          <HomeScreen
            onNavigate={go}
            salesperson={role === 'salesperson'}
            deliveryLabel={addressById(deliveryAddressId)?.title}
            availability={availabilityFor(deliveryAddressId)}
          />
        );
      case 'profile':
        return <MyAccountScreen onNavigate={go} onSignOut={() => reset('login')} salesperson={role === 'salesperson'} />;
      case 'sp:attendance':
        return <AttendanceScreen onBack={back} />;
      case 'sp:tasks':
        return <TaskListScreen onBack={back} onOpenTask={(id) => { setSpTaskId(id); go('sp:task-details'); }} />;
      case 'sp:task-details':
        return (
          <TaskDetailsScreen
            taskId={spTaskId}
            onBack={back}
            onCreateInteraction={() => go('sp:create-interaction')}
            onOpenOrder={(o) => openOrder(o, 'sp:task-details')}
          />
        );
      case 'sp:create-interaction':
        return <CreateInteractionScreen onBack={back} onDone={back} />;
      case 'sp:performance':
        return <PerformanceScreen onBack={back} />;
      case 'sp:orders':
        return <CustomerOrdersScreen onBack={back} onOpenOrder={(o) => openOrder(o, 'sp:orders')} />;
      case 'sp:switch-customer':
        return <SwitchCustomerScreen onBack={back} onSwitch={() => reset('home')} />;
      case 'sp:customers':
        return <CustomerListScreen onBack={back} onOpenCustomer={(id) => { setSpCustomerId(id); go('sp:customer-details'); }} />;
      case 'sp:customer-details':
        return <CustomerDetailsScreen customerId={spCustomerId} onBack={back} onOpenOrder={(o) => openOrder(o, 'sp:customer-details')} />;
      case 'notifications':
        return <NotificationsScreen onBack={back} />;
      case 'sub:business-details':
        return <BusinessDetailsScreen onBack={back} />;
      case 'sub:addresses':
        return <SavedAddressesScreen onBack={back} selectedId={deliveryAddressId} onSelect={setDeliveryAddressId} />;
      case 'sub:payment':
        return (
          <PaymentsScreen
            onBack={back}
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
            onBack={back}
            onPay={(amt) => {
              setPayAmount(amt);
              go('sub:payment-gateways');
            }}
          />
        );
      case 'sub:payment-gateways':
        return <PaymentGatewaysScreen vendorId={paymentVendorId} amount={payAmount} onBack={back} onDone={back} />;
      case 'sub:credit':
        return <CreditPartnersScreen onBack={back} />;
      case 'sub:language':
        return <LanguageScreen onBack={back} />;
      case 'sub:help':
        return <ContactUsScreen onBack={back} />;
      case 'sub:terms':
        return <TermsScreen onBack={back} />;
      case 'global-search':
        return <GlobalSearchScreen onBack={back} onOpenSheet={(id) => setSheetId(id)} />;
      case 'distributors-list':
        return (
          <SellerBrowseScreen
            title="Distributors"
            subtitle="Browse by category, brand or seller"
            tabs={['categories', 'brands', 'sellers']}
            categories={DIST_CATEGORIES}
            brands={BRANDS}
            sellers={DISTRIBUTORS}
            productListId="listing"
            selfId="distributors-list"
            initialTab={browseTab}
            onBack={back}
            onNavigate={go}
          />
        );
      case 'wholesaler-categories':
        return (
          <SellerBrowseScreen
            title="Wholesalers"
            subtitle="Browse by category or brand"
            tabs={['categories', 'brands']}
            categories={WHOLESALER_CATEGORIES}
            brands={BRANDS}
            productListId="wholesaler-products"
            selfId="wholesaler-categories"
            initialTab={browseTab}
            onBack={back}
            onNavigate={go}
          />
        );
      case 'storefront':
        return distributor ? (
          <StorefrontScreen distributor={distributor} onBack={back} onNavigate={go} />
        ) : (
          <PlaceholderScreen title="Storefront" onBack={back} />
        );
      case 'listing':
        return (
          <CatalogScreen
            applied={listApplied}
            onBack={back}
            onSearch={() => go('global-search', { backTo: 'listing' })}
            qty={qty}
            onOpenSheet={(id) => setSheetId(id)}
            onSetQty={setQtyFor}
            onGoToCart={() => go('cart')}
            cartCount={cartCount}
            cartTotal={cartTotal}
          />
        );
      case 'wholesaler-products':
        return (
          <WholesalerProductsScreen
            applied={listApplied}
            onBack={back}
            onSearch={() => go('global-search', { backTo: 'wholesaler-products' })}
            onGoToCart={() => go('cart')}
          />
        );
      case 'cart':
        return (
          <CartScreen
            onBack={back}
            onCheckout={() => setAlertsOpen(true)}
            onViewItems={(id) => {
              setSelectedSellerId(id);
              go('view-items', { backTo: 'cart' });
            }}
            onAddMore={() => go('home')}
          />
        );
      case 'view-items':
        return selectedSeller ? (
          <ViewItemsScreen
            seller={selectedSeller}
            onBack={back}
            onAddMore={() => go('home')}
            onItemTap={(pid) => setSheetId(pid)}
          />
        ) : (
          <PlaceholderScreen title="View items" onBack={back} />
        );
      case 'order-summary':
        return (
          <OrderSummaryScreen
            onBack={back}
            onPlaceOrder={() => go('order-confirmation')}
            onOpenCoupons={() => go('coupons', { backTo: 'order-summary' })}
            onViewItems={(id) => {
              setSelectedSellerId(id);
              setOrderItemsOpen(true);
            }}
          />
        );
      case 'coupons':
        return <CouponsScreen onBack={back} onApply={back} />;
      case 'order-confirmation':
        return <OrderConfirmationScreen onBackToHome={() => reset('home')} />;
      case 'reorder':
        return (
          <ReorderScreen
            qty={qty}
            onOpenSheet={(id) => setSheetId(id)}
            onSetQty={setQtyFor}
            onSearch={() => go('global-search', { backTo: 'reorder' })}
          />
        );
      case 'my-orders':
        return (
          <MyOrdersScreen
            onBack={back}
            onOpenDetails={(id) => {
              const o = ORDERS.find((x) => x.id === id);
              if (o) openOrder(o, 'my-orders');
            }}
          />
        );
      case 'order-details':
        return detailsOrder ? (
          <OrderDetailsScreen order={detailsOrder} onBack={back} />
        ) : (
          <PlaceholderScreen title="Order Details" onBack={back} />
        );
      default:
        return <PlaceholderScreen title={screen} onBack={back} />;
    }
  })();

  const isRoot = ROOT_SCREENS.includes(screen);

  if (!fontsLoaded) return null;

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <SafeAreaView style={{ flex: 1, backgroundColor: '#ffffff' }} edges={['top', 'bottom']}>
        <View style={{ flex: 1 }}>{body}</View>
        {isRoot && <BottomNav active={screen} cartCount={cartCount} onNavigate={(id) => (ROOT_SCREENS.includes(id) ? reset(id) : go(id))} />}
      </SafeAreaView>

      <AddToCartSheet
        product={sheetProduct}
        cartTotal={cartTotal}
        onAdd={(pcs) => sheetId && addPcs(sheetId, pcs)}
        onContinue={() => setSheetId(null)}
        onClose={() => setSheetId(null)}
      />

      <CartAlertsSheet
        open={alertsOpen && screen === 'cart'}
        onClose={() => setAlertsOpen(false)}
        onProceed={() => {
          setAlertsOpen(false);
          go('order-summary');
        }}
      />

      <OrderItemsSheet open={orderItemsOpen} seller={selectedSeller} onClose={() => setOrderItemsOpen(false)} />
    </SafeAreaProvider>
  );
}
