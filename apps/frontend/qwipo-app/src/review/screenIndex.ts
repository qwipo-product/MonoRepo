/* Review index of every screen, grouped + ordered. Mirrors qwipo-buyer-app's
   SCREEN_GROUPS. `built` marks what's migrated so far; the rest render a
   "coming in a later phase" placeholder and show a "soon" tag in the index. */
export type ScreenId = string;

export const SCREEN_GROUPS: { title: string; items: { id: ScreenId; label: string }[] }[] = [
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
      { id: 'distributor-units', label: 'Distributor Selling Units' },
      { id: 'wholesaler-products', label: 'Product List (Wholesaler)' },
      { id: 'wholesaler-units', label: 'Wholesaler Selling Units' },
      { id: 'reorder', label: 'Reorder' },
    ],
  },
  {
    title: 'Cart & Checkout',
    items: [
      { id: 'cart', label: 'Cart Summary' },
      { id: 'view-items', label: 'Cart · View Items' },
      { id: 'cart-units', label: 'Cart · View Items · Selling Units' },
      { id: 'order-summary', label: 'Order Summary' },
      { id: 'coupons', label: 'Coupons / Offers' },
      { id: 'order-confirmation', label: 'Order Confirmation' },
    ],
  },
  {
    title: 'Orders',
    items: [
      { id: 'my-orders', label: 'My Orders + Tracking' },
      { id: 'order-details', label: 'Order Details' },
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
