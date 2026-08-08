import { useState, useEffect } from 'react';
import { Analytics } from '@vercel/analytics/react';
import { Icon, PhoneNotch } from './components/Icons';
import HomeScreen from './screens/HomeScreen';
import SellerStorefront from './screens/SellerStorefront';
import ProductListingV2 from './screens/ProductListingV2';
import MultiSellerCartV2 from './screens/MultiSellerCartV2';
import ReorderScreen from './screens/ReorderScreen';
import NotificationsScreen from './screens/NotificationsScreen';
import ProfileScreen from './screens/ProfileScreen';
import SplashScreen from './screens/SplashScreen';
import LoginScreen from './screens/LoginScreen';
import OTPScreen from './screens/OTPScreen';
import OnboardingScreen from './screens/OnboardingScreen';
import CompleteKycScreen from './screens/CompleteKycScreen';
import KycSuccessScreen from './screens/KycSuccessScreen';
import OrderSummaryScreen from './screens/OrderSummaryScreen';
import MyOrdersScreen from './screens/MyOrdersScreen';
import OrderDetailsScreen from './screens/OrderDetailsScreen';
import DistributorsListScreen from './screens/DistributorsListScreen';
import WholesalersCategoriesScreen from './screens/WholesalersCategoriesScreen';
import AllBrandsScreen from './screens/AllBrandsScreen';
import GlobalSearchScreen from './screens/GlobalSearchScreen';
import WholesalerProductListScreen from './screens/WholesalerProductListScreen';
import ViewItemsScreen from './screens/ViewItemsScreen';
import OrderConfirmationScreen from './screens/OrderConfirmationScreen';
import CouponsScreen from './screens/CouponsScreen';
import CouponAppliedDialog from './components/CouponAppliedDialog';
import CartValidationSheet from './components/CartValidationSheet';
import AddressesScreen from './screens/sub/AddressesScreen';
import PaymentScreen from './screens/sub/PaymentScreen';
import CreditScreen from './screens/sub/CreditScreen';
import HelpScreen from './screens/sub/HelpScreen';
import BusinessDetailsScreen from './screens/sub/BusinessDetailsScreen';
import TermsConditionsScreen from './screens/sub/TermsConditionsScreen';
import AddToCartSheet from './components/AddToCartSheet';
import ProductImageSheet from './components/ProductImageSheet';
import DiscountsSheet from './components/DiscountsSheet';
import FiltersSheet from './components/FiltersSheet';
import { filtersDefault } from './screens/ProductListing';
import { initialCart, categories, distributors, distributorsList, brands, products, DIST_CAT_TO_PRODUCT_CAT } from '@mockups/mock-data';

export default function App() {
  // Always boot into the Splash screen so the full Splash → Login → OTP →
  // Onboarding → Home flow plays on every fresh load / refresh.
  const [screen, setScreenRaw] = useState<string>('splash');
  // History stack — every screen change pushes the current screen so goBack
  // always returns to the previous screen rather than a hard-coded target.
  const [history, setHistory] = useState<string[]>([]);
  const setScreen = (next: string) => {
    // Capture current screen via the latest closure value — DO NOT trigger
    // a sibling setState from inside the functional updater, because Strict
    // Mode runs that updater twice and would double-push to history.
    if (next === screen) return;
    setHistory((h) => [...h, screen]);
    setScreenRaw(next);
  };
  // Used as the onBack handler everywhere. Pops the history; falls back to a
  // sensible default ('home') when the stack is empty (deep-link / fresh load).
  const goBack = (fallback: string = 'home') => {
    if (history.length === 0) {
      setScreenRaw(fallback);
      return;
    }
    const prev = history[history.length - 1];
    setHistory((h) => h.slice(0, -1));
    setScreenRaw(prev);
  };
  // Resets the stack — useful when entering a brand new flow (e.g. sign out
  // returns to splash; sign in back to home) so back doesn't leak.
  const resetTo = (next: string) => {
    setHistory([]);
    setScreenRaw(next);
  };
  // Back compat with the prevScreen reference inside the global-search route.
  const prevScreen = history[history.length - 1] || 'home';
  const [selectedCategory, setSelectedCategory] = useState<any>(categories[0]);
  const [selectedDistributor, setSelectedDistributor] = useState<any>(null);
  const [sheetProduct, setSheetProduct] = useState<any>(null);
  const [sheetVariant, setSheetVariant] = useState<any>(null);
  // View Items opens the same sheet with seller/price/fee hidden.
  const [sheetHidePrice, setSheetHidePrice] = useState(false);
  const [sheetSellerOptions, setSheetSellerOptions] = useState<any>(null);
  const [imageSheetProduct, setImageSheetProduct] = useState<any>(null);
  const [discountsSheet, setDiscountsSheet] = useState<any>(null); // {product, variant}
  const [filtersOpen, setFiltersOpen] = useState<boolean>(false);
  const [listingFilters, setListingFilters] = useState<any>(filtersDefault);
  const [authPhone, setAuthPhone] = useState<string>('');
  // New signups land on Home with KYC still incomplete — the banner stays
  // up until the user completes the Complete KYC form.
  const [kycPending, setKycPending] = useState<boolean>(false);
  // Business type / location captured during Onboarding, carried forward to
  // pre-fill the Complete KYC form.
  const [onboardingData, setOnboardingData] = useState<{ location: string; businessName: string; businessType: string }>({
    location: '',
    businessName: '',
    businessType: '',
  });
  const [wholesalerCategoryVariant, setWholesalerCategoryVariant] = useState<'groceries' | 'fmcg' | 'all'>('groceries');
  const [initialDistributorsTab, setInitialDistributorsTab] = useState<'categories' | 'brands' | 'sellers'>('categories');
  // Non-null while the Sellers tab should show only the distributor(s)
  // carrying a specific brand tapped from Home (cleared on any unfiltered
  // "See all" navigation so a stale filter never leaks back in).
  const [distributorFilterIds, setDistributorFilterIds] = useState<string[] | null>(null);
  const [activeOrder, setActiveOrder] = useState<any>(null);
  const [cartValidationOpen, setCartValidationOpen] = useState<boolean>(false);
  const [cart, setCart] = useState(initialCart);
  const [listingCart, setListingCart] = useState({});
  // Coupon applied to the current order + success popup toggle.
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [couponSuccess, setCouponSuccess] = useState<any>(null);
  // Id of the seller currently shown on the View Items screen — resolved
  // fresh from `cart` on every render so qty/delete changes stay live.
  const [viewItemsSellerId, setViewItemsSellerId] = useState<string | null>(null);
  // Per-seller delivery selection — shared between ProductListing and the
  // cart. Keyed by seller name; defaults to 'beat' (Friday) when missing.
  const [deliveryBySeller, setDeliveryBySeller] = useState<Record<string, 'tomorrow' | 'beat' | 'pickup'>>({});
  const updateDeliveryForSeller = (sellerName: string, kind: 'tomorrow' | 'beat' | 'pickup') =>
    setDeliveryBySeller((prev) => ({ ...prev, [sellerName]: kind }));
  const [toast, setToast] = useState('');

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(''), 1800);
      return () => clearTimeout(t);
    }
  }, [toast]);

  const cartTotal = cart.sellers.reduce(
    (sum, s) => sum + s.items.reduce((a, i) => a + i.price * i.quantity, 0),
    0
  );
  const cartCount = cart.sellers.reduce((n, s) => n + s.items.length, 0);

  const handleSelectCategory = (cat) => {
    setSelectedCategory(cat);
    setScreen('listing');
  };

  const handleSelectProduct = (product) => {
    setSelectedCategory(categories.find((c) => c.id === product.category) || categories[0]);
    setScreen('listing');
    setTimeout(() => {
      setSheetHidePrice(false);
      setSheetSellerOptions(null);
      setSheetProduct(product);
      setSheetVariant(product.variants[0]);
    }, 100);
  };

  const handleOpenSheet = (product, variant, sellerOptions = null) => {
    setSheetHidePrice(false);
    setSheetSellerOptions(sellerOptions);
    setSheetProduct(product);
    setSheetVariant(variant);
  };

  // Tap an item on View Items → same sheet as the listing, with the same
  // pricing (MRP / SP / Margin) shown so both flows stay consistent.
  const handleViewItemTap = (item) => {
    const product = products.find((p) => p.id === item.productId);
    if (!product) return;
    setSheetHidePrice(false);
    setSheetSellerOptions(null);
    setSheetProduct(product);
    setSheetVariant(product.variants[0]);
  };

  const handleCloseSheet = () => {
    setSheetProduct(null);
    setSheetVariant(null);
    setSheetHidePrice(false);
    setSheetSellerOptions(null);
  };

  const handleConfirmAdd = (product, variant, qty) => {
    setListingCart((prev) => ({
      ...prev,
      [`${product.id}_${variant.id}`]: (prev[`${product.id}_${variant.id}`] || 0) + qty,
    }));

    setCart((prev) => {
      const next = { ...prev, sellers: prev.sellers.map((s) => ({ ...s, items: [...s.items] })) };
      const sellerIdx = 0;
      const existingIdx = next.sellers[sellerIdx].items.findIndex(
        (i) => i.productId === product.id && i.variant === variant.size
      );
      if (existingIdx >= 0) {
        next.sellers[sellerIdx].items[existingIdx] = {
          ...next.sellers[sellerIdx].items[existingIdx],
          quantity: next.sellers[sellerIdx].items[existingIdx].quantity + qty,
        };
      } else {
        next.sellers[sellerIdx].items.push({
          productId: product.id,
          name: product.name,
          variant: variant.size,
          image: product.image,
          bgColor: product.bgColor,
          brand: product.brand,
          mrp: variant.mrp,
          price: variant.sellingPrice,
          quantity: qty,
          unit: 'Pcs',
          scheme: variant.scheme,
        });
      }
      return next;
    });

    setToast(`${qty} pc${qty > 1 ? 's' : ''} added to cart`);
    handleCloseSheet();
  };

  const handleUpdateListingQty = (product, variant, newQty) => {
    const key = `${product.id}_${variant.id}`;
    setListingCart((prev) => {
      const next = { ...prev };
      if (newQty <= 0) delete next[key];
      else next[key] = newQty;
      return next;
    });
    // also sync to cart
    setCart((prev) => {
      const next = { ...prev, sellers: prev.sellers.map((s) => ({ ...s, items: [...s.items] })) };
      const sellerIdx = 0;
      const itemIdx = next.sellers[sellerIdx].items.findIndex(
        (i) => i.productId === product.id && i.variant === variant.size
      );
      if (itemIdx >= 0) {
        if (newQty <= 0) {
          next.sellers[sellerIdx].items.splice(itemIdx, 1);
        } else {
          next.sellers[sellerIdx].items[itemIdx] = {
            ...next.sellers[sellerIdx].items[itemIdx],
            quantity: newQty,
          };
        }
      }
      return next;
    });
  };

  const handleUpdateItemQty = (sellerId, itemIdx, newQty) => {
    setCart((prev) => {
      const next = { ...prev, sellers: prev.sellers.map((s) => ({ ...s, items: [...s.items] })) };
      const seller = next.sellers.find((s) => s.id === sellerId);
      if (newQty <= 0) {
        seller.items.splice(itemIdx, 1);
      } else {
        seller.items[itemIdx] = { ...seller.items[itemIdx], quantity: newQty };
      }
      return next;
    });
  };

  // "Add More" from Cart Summary / View Items / the MOV alert — distributors
  // go back to that seller's own Authorised Distributors card; wholesalers
  // (pooled into the virtual "Qwipo Sellers" row) go to the wholesaler
  // categories grid instead, since there's no single-seller wholesaler page.
  const handleAddMoreFromCart = (seller: any) => {
    if (seller?.type === 'wholesaler') {
      setWholesalerCategoryVariant('groceries');
      setScreen('wholesaler-categories');
      return;
    }
    // Fuzzy name match — cart/distributorsList naming isn't always identical
    // character-for-character (e.g. "Sri" vs "Shri Sai Krishna Traders").
    const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
    const target = norm(seller?.name || '');
    const match = distributorsList.find((d: any) => {
      const dn = norm(d.name);
      return dn === target || dn.includes(target) || target.includes(dn);
    });
    setDistributorFilterIds(match ? [match.id] : null);
    setInitialDistributorsTab('sellers');
    setScreen('distributors-list');
  };

  const handleViewItems = (seller: any) => {
    setViewItemsSellerId(seller.id);
    setScreen('view-items');
  };

  const handleNavigate = (target) => {
    // From bottom nav, "listing" tab maps to Reorder screen
    if (target === 'listing') {
      setScreen('reorder');
      return;
    }
    if (target === 'search') {
      setScreen('global-search');
      return;
    }
    setScreen(target);
  };

  const handleSelectDistributor = (distributor) => {
    setSelectedDistributor(distributor);
    setScreen('storefront');
  };

  const handleSelectBrand = (brand) => {
    setSelectedCategory({ id: brand.id, name: brand.name, isBrand: true });
    setScreen('listing');
  };

  // Home banner → opens the product listing across every brand a seller
  // carries, with the seller's delivery windows shown once at the top.
  const handleOpenDistributorAllProducts = (_fullDistributor: any, distributorEntry: any) => {
    setSelectedCategory({
      id: distributorEntry.id,
      name: distributorEntry.name,
      brandNames: distributorEntry.brands.map((b: any) => b.short || b.name),
      fromStorefront: true,
      deliveryWindows: distributorEntry.deliveryWindows,
      breadcrumb: [
        { label: 'Distributors', goTo: 'distributors-list' },
        { label: distributorEntry.name },
      ],
    });
    setScreen('listing');
  };

  // Tapping a brand from Home's Authorised Distributors "All brands" grid
  // opens the seller list filtered to whichever distributor(s) actually
  // carry that brand (falls back to the full list when no match is found —
  // some brands in the generic Home rail aren't stocked by any of the
  // sample sellers yet).
  const handleSelectDistributorBrand = (brand) => {
    const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
    const target = norm(brand.name);
    const matches = distributorsList
      .filter((d: any) =>
        d.brands.some((b: any) => {
          const short = norm(b.short || '');
          return short && (target.includes(short) || short.includes(target));
        })
      )
      .map((d: any) => d.id);
    setDistributorFilterIds(matches.length ? matches : null);
    setInitialDistributorsTab('sellers');
    setScreen('distributors-list');
  };

  // Resolve the seller shown on View Items — mirrors MultiSellerCartV2's
  // wholesaler pooling so the virtual "Qwipo Sellers" row works too.
  const viewItemsSeller = (() => {
    if (!viewItemsSellerId) return null;
    if (viewItemsSellerId === 'qwipo-sellers') {
      const wholesalers = cart.sellers.filter((s: any) => s.type === 'wholesaler');
      if (!wholesalers.length) return null;
      return {
        id: 'qwipo-sellers',
        name: 'Qwipo Sellers',
        type: 'wholesaler',
        items: wholesalers.flatMap((w: any) => w.items),
      };
    }
    return cart.sellers.find((s: any) => s.id === viewItemsSellerId) || null;
  })();

  return (
    <div className="app-shell">
      <Analytics />
      <div className="showcase">
        <div className="showcase-info">
          <div className="brand-tag">
            <span className="dot"></span>
            Qwipo · B2B Commerce
          </div>
          <h2 className="showcase-title">Qwipo Buyer App</h2>
          <ScreenPills active={screen} onPick={setScreen} />
        </div>

        <div className="phone-frame">
          <PhoneNotch />
          <div className="phone-screen">
            {(screen === 'home' ||
              screen === 'home-distributors-only' ||
              screen === 'home-wholesalers-only') && (
              <HomeScreen
                key={screen}
                cartCount={cartCount}
                onNavigate={handleNavigate}
                onSelectDistributor={handleSelectDistributor}
                onSelectBrand={handleSelectBrand}
                onSelectDistributorBrand={handleSelectDistributorBrand}
                onSelectCategory={handleSelectCategory}
                onOpenNotifications={() => setScreen('notifications')}
                kycPending={screen === 'home' ? kycPending : false}
                onCompleteKyc={() => setScreen('kyc-complete')}
                sellerAvailability={
                  screen === 'home-distributors-only'
                    ? 'distributors'
                    : screen === 'home-wholesalers-only'
                    ? 'wholesalers'
                    : 'both'
                }
                onSeeAllDistributors={() => {
                  setDistributorFilterIds(null);
                  setInitialDistributorsTab('sellers');
                  setScreen('distributors-list');
                }}
                onOpenBannerListing={() => handleOpenDistributorAllProducts(null, distributorsList[0])}
                onSeeAllBrands={() => setScreen('all-brands')}
                onSeeAllCategories={() => {
                  setWholesalerCategoryVariant('all');
                  setScreen('wholesaler-categories');
                }}
                onOpenWholesalerCategory={(id: string) => {
                  setWholesalerCategoryVariant(id === 'groceries' ? 'groceries' : 'fmcg');
                  setScreen('wholesaler-categories');
                }}
                onOpenAddresses={() => setScreen('sub:addresses')}
                onOpenProfile={() => setScreen('profile')}
                onOpenSearch={() => setScreen('global-search')}
              />
            )}
            {screen === 'all-brands' && (
              <AllBrandsScreen
                onBack={() => goBack('home')}
                onSelectBrand={handleSelectBrand}
                brandsList={brands}
                onOpenSearch={() => setScreen('global-search')}
              />
            )}
            {screen === 'reorder' && (
              <ReorderScreen
                cartCount={cartCount}
                cartTotal={cartTotal}
                onNavigate={handleNavigate}
                onOpenSheet={handleOpenSheet}
                onOpenImageSheet={(product) => setImageSheetProduct(product)}
                onOpenDiscounts={(product: any, variant: any) =>
                  setDiscountsSheet({ product, variant })
                }
                onGoToCart={() => setScreen('cart')}
              />
            )}
            {screen === 'notifications' && (
              <NotificationsScreen onBack={() => goBack('home')} />
            )}

            {/* Auth flow */}
            {screen === 'splash' && (
              <SplashScreen onContinue={() => resetTo('login')} />
            )}
            {screen === 'login' && (
              <LoginScreen
                onSubmit={(phone: string) => {
                  setAuthPhone(phone);
                  setScreen('otp');
                }}
              />
            )}
            {screen === 'otp' && (
              <OTPScreen
                phone={authPhone}
                onBack={() => goBack('login')}
                onVerify={() => setScreen('onboarding')}
              />
            )}
            {screen === 'onboarding' && (
              <OnboardingScreen
                onBack={() => goBack('otp')}
                onProceed={(data: { location: string; businessName: string; businessType: string }) => {
                  setOnboardingData(data);
                  setKycPending(true);
                  resetTo('home');
                }}
              />
            )}
            {screen === 'kyc-complete' && (
              <CompleteKycScreen
                initialBusinessType={onboardingData.businessType}
                initialLocation={onboardingData.location}
                onCancel={() => goBack('home')}
                onRegister={() => setScreen('kyc-success')}
              />
            )}
            {screen === 'kyc-success' && (
              <KycSuccessScreen
                onCallSupport={() => setToast('Dialling Qwipo support…')}
                onPlaceOrder={() => {
                  setKycPending(false);
                  resetTo('home');
                }}
              />
            )}

            {/* Order completion */}
            {screen === 'order-summary' && (
              <OrderSummaryScreen
                cart={cart}
                onBack={() => goBack('cart')}
                onPlaceOrder={() => setScreen('order-confirmation')}
                onViewItems={handleViewItems}
                appliedCoupon={appliedCoupon}
                onOpenCoupons={() => setScreen('coupons')}
                onRemoveCoupon={() => setAppliedCoupon(null)}
              />
            )}
            {screen === 'coupons' && (
              <CouponsScreen
                cartTotal={cartTotal}
                appliedId={appliedCoupon?.id}
                onBack={() => goBack('order-summary')}
                onApply={(coupon: any) => {
                  setAppliedCoupon(coupon);
                  setCouponSuccess(coupon);
                  setScreen('order-summary');
                }}
              />
            )}
            {screen === 'order-confirmation' && (
              <OrderConfirmationScreen onBackToHome={() => resetTo('home')} />
            )}
            {screen === 'view-items' && (
              <ViewItemsScreen
                seller={viewItemsSeller}
                onBack={() => goBack('cart')}
                onAddMore={() => viewItemsSeller && handleAddMoreFromCart(viewItemsSeller)}
                onUpdateQty={handleUpdateItemQty}
                onItemTap={handleViewItemTap}
              />
            )}
            {screen === 'my-orders' && (
              <MyOrdersScreen
                onBack={() => goBack('profile')}
                cartCount={cartCount}
                onNavigate={handleNavigate}
                onOpenDetails={(o: any) => {
                  setActiveOrder(o);
                  setScreen('order-details');
                }}
              />
            )}
            {screen === 'order-details' && (
              <OrderDetailsScreen
                order={activeOrder}
                onBack={() => goBack('my-orders')}
                onTrack={() => setScreen('my-orders')}
                onCancel={() => setScreen('my-orders')}
              />
            )}

            {/* See-all listing screens */}
            {screen === 'distributors-list' && (
              <DistributorsListScreen
                initialTab={initialDistributorsTab}
                filterDistributorIds={distributorFilterIds}
                onBack={() => {
                  // Reset the tab seed + seller filter so the next entry
                  // defaults back to Categories with the full seller list.
                  setInitialDistributorsTab('categories');
                  setDistributorFilterIds(null);
                  goBack('home');
                }}
                onSelectCategory={(c: any) => {
                  // Distributors-list → Categories tab → listing. The tile
                  // ids come from distributorCategories ('atta-flours-sooji',
                  // ...) so translate to the buyer product category id
                  // ('flour', ...) before filtering.
                  const productCatId = DIST_CAT_TO_PRODUCT_CAT[c.id] || c.id;
                  setSelectedCategory({
                    ...c,
                    id: productCatId,
                    breadcrumb: [
                      { label: 'Distributors', goTo: 'home' },
                      { label: 'Categories', goTo: 'distributors-list' },
                      { label: c.name },
                    ],
                  });
                  setScreen('listing');
                }}
                onSelectDistributor={(distributor: any) => {
                  setSelectedDistributor(distributor);
                  setScreen('storefront');
                }}
                onSelectBrand={(brand: any, distributor: any) => {
                  // Both tabs go straight to the product listing — no
                  // Categories/Brands drill-in step. Sellers-tab tap keeps the
                  // distributor context (single-seller view); Brands-tab tap
                  // pools products across every seller.
                  const brandLabel = brand.short || brand.name;
                  setSelectedDistributor(distributor || null);
                  setSelectedCategory({
                    id: brand.id,
                    name: brandLabel,
                    isBrand: true,
                    color: brand.bg,
                    icon: brand.initials,
                    fromStorefront: !!distributor,
                    deliveryWindows: distributor?.deliveryWindows,
                    breadcrumb: [
                      { label: 'Distributors', goTo: 'home' },
                      {
                        label: distributor ? distributor.name : 'Brands',
                        goTo: 'distributors-list',
                      },
                      { label: brandLabel },
                    ],
                  });
                  setScreen('listing');
                }}
              />
            )}
            {screen === 'wholesaler-categories' && (
              <WholesalersCategoriesScreen
                variant={wholesalerCategoryVariant}
                onBack={() => goBack('home')}
                onSelectCategory={(cat: any) => {
                  setSelectedCategory({ id: cat.id, name: cat.name });
                  setScreen('wholesaler-products');
                }}
                onOpenSearch={() => setScreen('global-search')}
              />
            )}
            {screen === 'global-search' && (
              <GlobalSearchScreen
                onBack={() => setScreen(prevScreen || 'home')}
                onSelectProduct={(p: any) => {
                  setSelectedCategory({ id: p.category, name: 'Search' });
                  setScreen('listing');
                }}
              />
            )}
            {screen === 'wholesaler-products' && (
              <WholesalerProductListScreen
                category={selectedCategory}
                cartItems={listingCart}
                cartTotal={cartTotal}
                onBack={() => goBack('wholesaler-categories')}
                onOpenSheet={handleOpenSheet}
                onOpenImageSheet={(p: any) => setImageSheetProduct(p)}
                onOpenDiscounts={(product: any, variant: any) =>
                  setDiscountsSheet({ product, variant })
                }
                onGoToCart={() => setScreen('cart')}
                onOpenSearch={() => setScreen('global-search')}
              />
            )}

            {cartValidationOpen && (
              <CartValidationSheet
                cart={cart}
                onClose={() => setCartValidationOpen(false)}
                onProceed={() => {
                  setCartValidationOpen(false);
                  setScreen('order-summary');
                }}
                onAddItems={(seller: any) => {
                  setCartValidationOpen(false);
                  handleAddMoreFromCart(seller);
                }}
              />
            )}
            {screen === 'profile' && (
              <ProfileScreen
                cartCount={cartCount}
                onNavigate={handleNavigate}
                onOpenSubPage={(p: string) => {
                  // Orders sub-page is the same canonical My Orders + Tracking screen.
                  if (p === 'my-orders' || p === 'orders') setScreen('my-orders');
                  else setScreen(`sub:${p}`);
                }}
                onSignOut={() => resetTo('splash')}
              />
            )}
            {screen === 'sub:addresses' && <AddressesScreen onBack={() => goBack('profile')} onSaved={() => resetTo('home')} />}
            {screen === 'sub:payment' && <PaymentScreen onBack={() => goBack('profile')} />}
            {screen === 'sub:credit' && <CreditScreen onBack={() => goBack('profile')} />}
            {screen === 'sub:help' && <HelpScreen onBack={() => goBack('profile')} />}
            {screen === 'sub:business-details' && (
              <BusinessDetailsScreen onBack={() => goBack('profile')} />
            )}
            {screen === 'sub:terms' && (
              <TermsConditionsScreen onBack={() => goBack('profile')} />
            )}
            {screen === 'storefront' && (
              <SellerStorefront
                cartCount={cartCount}
                distributor={selectedDistributor}
                onBack={() => goBack('home')}
                onNavigate={handleNavigate}
                onSelectCategory={(cat: any) => {
                  // Direct to ProductListing — the brands+products drill-in
                  // (CategoriesBrandsScreen) is reserved for explicit "browse by brand" flows.
                  // Mark the category as coming from a specific seller's
                  // storefront so the listing knows it's a single-seller
                  // view and can hide the redundant per-card seller name.
                  setSelectedCategory({ ...cat, fromStorefront: true });
                  setScreen('listing');
                }}
                onSelectProduct={handleSelectProduct}
                onOpenSearch={() => setScreen('global-search')}
              />
            )}
            {screen === 'listing' && (
              <ProductListingV2
                category={selectedCategory}
                cartItems={listingCart}
                cartTotal={cartTotal}
                filters={listingFilters}
                onBack={() => goBack('home')}
                onOpenSheet={handleOpenSheet}
                onOpenImageSheet={(product: any) => setImageSheetProduct(product)}
                onOpenDiscounts={(product: any, variant: any) => setDiscountsSheet({ product, variant })}
                onOpenFilters={() => setFiltersOpen(true)}
                onGoToCart={() => setScreen('cart')}
                onUpdateQty={handleUpdateListingQty}
                onOpenSearch={() => setScreen('global-search')}
                onNavigateBreadcrumb={(target?: string) => {
                  if (target) setScreen(target);
                }}
              />
            )}
            {screen === 'cart' && (
              <MultiSellerCartV2
                cart={cart}
                onBack={() => goBack('listing')}
                onCheckout={() => setCartValidationOpen(true)}
                onAddMore={handleAddMoreFromCart}
                onViewItems={handleViewItems}
              />
            )}
            {sheetProduct && (
              <AddToCartSheet
                product={sheetProduct}
                initialVariant={sheetVariant}
                sellerOptions={sheetSellerOptions}
                hidePrice={sheetHidePrice}
                onClose={handleCloseSheet}
                onConfirm={handleConfirmAdd}
              />
            )}

            {imageSheetProduct && (
              <ProductImageSheet
                product={imageSheetProduct}
                onClose={() => setImageSheetProduct(null)}
                onAddClick={(product) => {
                  setImageSheetProduct(null);
                  handleOpenSheet(product, product.variants[0]);
                }}
              />
            )}

            {discountsSheet && (
              <DiscountsSheet
                product={discountsSheet.product}
                variant={discountsSheet.variant}
                onClose={() => setDiscountsSheet(null)}
              />
            )}

            {filtersOpen && (
              <FiltersSheet
                initialFilters={listingFilters}
                onClose={() => setFiltersOpen(false)}
                onApply={(f) => setListingFilters(f)}
              />
            )}

            {couponSuccess && (
              <CouponAppliedDialog
                coupon={couponSuccess}
                onClose={() => setCouponSuccess(null)}
              />
            )}

            {toast && (
              <div className="toast">
                <Icon.Check />
                {toast}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Showcase pill list — every route in the app, grouped for navigation
// from the desktop showcase chrome on the left of the phone frame.
const SCREEN_GROUPS: { title: string; items: { id: string; label: string }[] }[] = [
  {
    title: 'Auth',
    items: [
      { id: 'splash', label: 'Splash' },
      { id: 'login', label: 'Login' },
      { id: 'otp', label: 'OTP Verification' },
      { id: 'onboarding', label: 'Onboarding' },
      { id: 'kyc-complete', label: 'Complete KYC' },
      { id: 'kyc-success', label: 'KYC Success' },
    ],
  },
  {
    title: 'Browse',
    items: [
      { id: 'home', label: 'Home · Distributors & Wholesalers' },
      { id: 'home-distributors-only', label: 'Home · Distributors only' },
      { id: 'home-wholesalers-only', label: 'Home · Wholesalers only' },
      { id: 'distributors-list', label: 'All Authorised Distributors (tabbed)' },
      { id: 'wholesaler-categories', label: 'Wholesaler · Groceries / FMCG' },
      { id: 'all-brands', label: 'All Brands (Wholesalers)' },
      { id: 'global-search', label: 'Global Search' },
    ],
  },
  {
    title: 'Shop',
    items: [
      { id: 'storefront', label: 'Authorised Distributor Storefront' },
      { id: 'listing', label: 'Product List (Distributor)' },
      { id: 'wholesaler-products', label: 'Product List (Wholesaler)' },
      { id: 'reorder', label: 'Reorder' },
    ],
  },
  {
    title: 'Cart & Checkout',
    items: [
      { id: 'cart', label: 'Cart Summary' },
      { id: 'order-summary', label: 'Order Summary' },
      { id: 'coupons', label: 'Coupons / Offers' },
      { id: 'order-confirmation', label: 'Order Confirmation' },
    ],
  },
  {
    title: 'Orders',
    items: [
      { id: 'my-orders', label: 'My Orders + Tracking' },
    ],
  },
  {
    title: 'Account',
    items: [
      { id: 'profile', label: 'My Account' },
      { id: 'notifications', label: 'Notifications' },
      { id: 'sub:payment', label: 'Account · Payments' },
      { id: 'sub:credit', label: 'Account · Credit Partners' },
      { id: 'sub:help', label: 'Account · Contact Us' },
      { id: 'sub:business-details', label: 'Account · Business Details' },
      { id: 'sub:terms', label: 'Account · Terms & Conditions' },
    ],
  },
];

function ScreenPills({ active, onPick }: { active: string; onPick: (id: string) => void }) {
  let counter = 0;
  return (
    <div className="screen-pills">
      {SCREEN_GROUPS.map((group) => (
        <div key={group.title} className="screen-pills-group">
          <div className="screen-pills-heading">{group.title}</div>
          {group.items.map((item) => {
            counter += 1;
            const isActive = active === item.id;
            return (
              <button
                key={item.id}
                className={`screen-pill ${isActive ? 'active' : ''}`}
                onClick={() => onPick(item.id)}
              >
                <span className="screen-pill-num">{counter}</span>
                {item.label}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}
