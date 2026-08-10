import './global.css';
import { useState } from 'react';
import { View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { BottomNav, type TabId } from './src/components/BottomNav';
import { HomeScreen } from './src/screens/HomeScreen';
import { ReorderScreen } from './src/screens/ReorderScreen';
import { CartScreen } from './src/screens/CartScreen';
import { ProductListScreen } from './src/screens/ProductListScreen';
import { AddToCartSheet } from './src/screens/AddToCartSheet';
import { OrderSummaryScreen } from './src/screens/OrderSummaryScreen';
import { CouponsScreen, type Coupon } from './src/screens/CouponsScreen';
import { OrderConfirmationScreen } from './src/screens/OrderConfirmationScreen';
import { StorefrontScreen } from './src/screens/StorefrontScreen';
import { SellerBrowseScreen } from './src/screens/SellerBrowseScreen';
import { GlobalSearchScreen } from './src/screens/GlobalSearchScreen';
import { MyOrdersScreen } from './src/screens/MyOrdersScreen';
import { OrderDetailsScreen } from './src/screens/OrderDetailsScreen';
import { NotificationsScreen } from './src/screens/NotificationsScreen';
import { AccountScreen } from './src/screens/AccountScreen';
import { BusinessDetailsScreen } from './src/screens/BusinessDetailsScreen';
import { AddressesScreen } from './src/screens/AddressesScreen';
import { PaymentsScreen } from './src/screens/PaymentsScreen';
import { CreditScreen } from './src/screens/CreditScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { LanguageScreen } from './src/screens/LanguageScreen';
import { ContactScreen } from './src/screens/ContactScreen';
import { TermsScreen } from './src/screens/TermsScreen';
import { SplashScreen } from './src/screens/auth/SplashScreen';
import { LoginScreen } from './src/screens/auth/LoginScreen';
import { OtpScreen } from './src/screens/auth/OtpScreen';
import { OnboardingScreen } from './src/screens/auth/OnboardingScreen';
import { CompleteKycScreen } from './src/screens/auth/CompleteKycScreen';
import { KycSuccessScreen } from './src/screens/auth/KycSuccessScreen';
import { PRODUCTS, productById } from './src/data/products';
import { CATEGORIES, BRANDS, DISTRIBUTORS } from './src/data/home';
import { ORDERS, orderById } from './src/data/orders';
import type { Screen } from './src/nav';

const ROOT = new Set<Screen>(['home', 'reorder', 'cart']);

export default function App() {
  const [stack, setStack] = useState<Screen[]>(['home']);
  const [qty, setQty] = useState<Record<string, number>>({});
  const [sheetId, setSheetId] = useState<string | null>(null);
  const [coupon, setCoupon] = useState<Coupon | null>(null);
  const [detailsOrderId, setDetailsOrderId] = useState<string>(ORDERS[0].id);

  const screen = stack[stack.length - 1];
  const go = (s: Screen) => setStack((prev) => (ROOT.has(s) ? [s] : [...prev, s]));
  const back = () => setStack((prev) => (prev.length > 1 ? prev.slice(0, -1) : prev));
  const setLineQty = (id: string, n: number) => setQty((q) => ({ ...q, [id]: Math.max(0, n) }));

  const cartCount = Object.values(qty).reduce((a, b) => a + b, 0);
  const cartTotal = PRODUCTS.reduce((s, p) => s + p.price * (qty[p.id] ?? 0), 0);
  const sheetProduct = sheetId ? productById(sheetId) ?? null : null;

  const body = (() => {
    switch (screen) {
      case 'home':
        return <HomeScreen onNavigate={go} />;
      case 'reorder':
        return <ReorderScreen qty={qty} onQty={setLineQty} />;
      case 'cart':
        return <CartScreen qty={qty} onQty={setLineQty} onCheckout={() => go('order-summary')} onAddMore={() => go('listing')} />;
      case 'listing':
        return (
          <ProductListScreen
            qty={qty}
            onQty={setLineQty}
            onOpenSheet={setSheetId}
            onBack={back}
            onGoToCart={() => go('cart')}
            cartCount={cartCount}
            cartTotal={cartTotal}
          />
        );
      case 'storefront':
        return <StorefrontScreen onBack={back} onNavigate={go} />;
      case 'distributors':
        return (
          <SellerBrowseScreen
            title="Authorised Distributors"
            subtitle="Verified sellers near you"
            tabs={['categories', 'brands', 'sellers']}
            categories={CATEGORIES}
            brands={BRANDS}
            sellers={DISTRIBUTORS}
            onBack={back}
            onNavigate={go}
          />
        );
      case 'wholesalers':
        return (
          <SellerBrowseScreen
            title="Wholesalers"
            subtitle="Bulk sellers near you"
            tabs={['categories', 'brands']}
            categories={CATEGORIES}
            brands={BRANDS}
            onBack={back}
            onNavigate={go}
          />
        );
      case 'search':
        return <GlobalSearchScreen onBack={back} onNavigate={go} />;
      case 'order-summary':
        return (
          <OrderSummaryScreen
            qty={qty}
            coupon={coupon}
            onBack={back}
            onPlaceOrder={() => go('order-confirmation')}
            onOpenCoupons={() => go('coupons')}
          />
        );
      case 'coupons':
        return <CouponsScreen onBack={back} onApply={(c) => { setCoupon(c); back(); }} />;
      case 'order-confirmation':
        return <OrderConfirmationScreen onBackToHome={() => { setQty({}); setCoupon(null); go('home'); }} />;
      case 'my-orders':
        return <MyOrdersScreen onBack={back} onOpenDetails={(id) => { setDetailsOrderId(id); go('order-details'); }} />;
      case 'order-details':
        return <OrderDetailsScreen order={orderById(detailsOrderId) ?? ORDERS[0]} onBack={back} />;
      case 'notifications':
        return <NotificationsScreen onBack={back} />;
      case 'account':
        return <AccountScreen onNavigate={go} onSignOut={() => go('splash')} />;
      case 'business-details':
        return <BusinessDetailsScreen onBack={back} />;
      case 'addresses':
        return <AddressesScreen onBack={back} />;
      case 'payments':
        return <PaymentsScreen onBack={back} />;
      case 'credit':
        return <CreditScreen onBack={back} />;
      case 'settings':
        return <SettingsScreen onBack={back} onNavigate={go} />;
      case 'language':
        return <LanguageScreen onBack={back} />;
      case 'contact':
        return <ContactScreen onBack={back} />;
      case 'terms':
        return <TermsScreen onBack={back} />;
      case 'splash':
        return <SplashScreen onNext={() => go('login')} />;
      case 'login':
        return <LoginScreen onBack={back} onNext={() => go('otp')} />;
      case 'otp':
        return <OtpScreen onBack={back} onNext={() => go('onboarding')} />;
      case 'onboarding':
        return <OnboardingScreen onBack={back} onNext={() => go('kyc')} />;
      case 'kyc':
        return <CompleteKycScreen onBack={back} onNext={() => go('kyc-success')} />;
      case 'kyc-success':
        return <KycSuccessScreen onDone={() => go('home')} />;
      default:
        return <HomeScreen onNavigate={go} />;
    }
  })();

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <View className="flex-1 bg-background">
        <View className="flex-1">{body}</View>
        {ROOT.has(screen) ? <BottomNav active={screen as TabId} cartCount={cartCount} onChange={(t) => go(t)} /> : null}
      </View>

      {sheetProduct ? (
        <AddToCartSheet
          key={sheetProduct.id}
          product={sheetProduct}
          onClose={() => setSheetId(null)}
          onAdd={(pcs) => setLineQty(sheetProduct.id, (qty[sheetProduct.id] ?? 0) + pcs)}
          onContinue={() => { setSheetId(null); go('cart'); }}
        />
      ) : null}
    </SafeAreaProvider>
  );
}
