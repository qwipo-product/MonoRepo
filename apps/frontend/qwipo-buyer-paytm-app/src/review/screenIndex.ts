/* Review index of every screen, grouped + ordered — mirrors the screenshots'
   numbered sidebar. `built` (in App) marks what's migrated to v2 so far; the
   rest render a placeholder and show a "soon" tag here. IDs match qwipo-app so
   navigation links (?screen=<id>) stay stable across both apps. */
export type ScreenId = string;

export const SCREEN_GROUPS: { title: string; items: { id: ScreenId; label: string }[] }[] = [
  {
    title: 'Paytm',
    items: [
      { id: 'paytm-launcher', label: 'Paytm Launcher' },
      { id: 'paytm-search', label: 'Paytm Search' },
      { id: 'paytm-welcome', label: 'Qwipo Welcome' },
    ],
  },
  {
    title: 'Auth',
    items: [
      { id: 'splash', label: 'Splash' },
      { id: 'login', label: 'Login' },
      { id: 'otp', label: 'OTP Verification' },
      { id: 'onboarding', label: 'Onboarding' },
      { id: 'kyc-complete', label: 'Complete KYC' },
      { id: 'kyc-success', label: 'KYC Submitted' },
    ],
  },
  {
    title: 'Browse',
    items: [
      { id: 'home', label: 'Home Page' },
      { id: 'distributors-list', label: 'Distributors' },
      { id: 'dms-partners', label: 'Distributors · Register to Order' },
      { id: 'dms-register', label: 'Distributors · DMS Registration' },
      { id: 'wholesaler-categories', label: 'Wholesalers' },
      { id: 'global-search', label: 'Global Search' },
    ],
  },
  {
    title: 'Shop',
    items: [
      { id: 'storefront', label: 'Authorised Distributor Storefront' },
      { id: 'listing', label: 'Product List' },
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
      { id: 'cart-alerts', label: 'Cart · Alerts' },
      { id: 'order-summary', label: 'Order Summary' },
      { id: 'order-items', label: 'Order Summary · View Items' },
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
      { id: 'sub:business-details', label: 'Account · Business Details' },
      { id: 'sub:addresses', label: 'Account · Saved Addresses' },
      { id: 'sub:payment', label: 'Account · Payments' },
      { id: 'sub:payment-orders', label: 'Account · Payments · Orders' },
      { id: 'sub:payment-gateways', label: 'Account · Payments · Pay' },
      { id: 'sub:credit', label: 'Account · Credit Partners' },
      { id: 'sub:language', label: 'Account · Language' },
      { id: 'sub:help', label: 'Account · Contact Us' },
      { id: 'sub:terms', label: 'Account · Terms & Conditions' },
    ],
  },
  {
    title: 'Empty States',
    items: [
      { id: 'empty:home-distributors', label: 'Home \u00b7 No Distributors' },
      { id: 'empty:home-wholesalers', label: 'Home \u00b7 No Wholesalers' },
      { id: 'empty:distributors-list', label: 'Distributors \u00b7 None' },
      { id: 'empty:listing', label: 'Product List \u00b7 No Products' },
      { id: 'empty:wholesaler-products', label: 'Wholesaler List \u00b7 No Products' },
      { id: 'empty:global-search', label: 'Search \u00b7 No Results' },
      { id: 'empty:cart', label: 'Cart \u00b7 Empty' },
      { id: 'empty:view-items', label: 'Cart Items \u00b7 Empty' },
      { id: 'empty:reorder', label: 'Reorder \u00b7 Empty' },
      { id: 'empty:my-orders', label: 'My Orders \u00b7 Empty' },
      { id: 'empty:notifications', label: 'Notifications \u00b7 Empty' },
      { id: 'empty:sub:payment', label: 'Payments \u00b7 None' },
      { id: 'empty:sub:payment-orders', label: 'Payment Orders \u00b7 None' },
      { id: 'empty:sub:payment-gateways', label: 'Payment Options \u00b7 None' },
      { id: 'empty:sub:credit', label: 'Credit Partners \u00b7 None' },
    ],
  },
  {
    title: 'States & Messages',
    items: [
      { id: 'app-update', label: 'What\u2019s New / Update' },
      { id: 'app-update-required', label: 'Update Required (force)' },
      { id: 'message-styles', label: 'Message Styles (reference)' },
      { id: 'login-error', label: 'Login \u00b7 Errors' },
      { id: 'otp-error', label: 'OTP \u00b7 Errors' },
      { id: 'cart-price-changes', label: 'Cart \u00b7 Price Changes' },
    ],
  },
  {
    title: 'Salesperson',
    items: [
      { id: 'sp:attendance', label: 'Salesperson · Attendance' },
      { id: 'sp:tasks', label: 'Salesperson · Tasks' },
      { id: 'sp:task-details', label: 'Salesperson · Task Details' },
      { id: 'sp:create-interaction', label: 'Salesperson · Create Interaction' },
      { id: 'sp:performance', label: 'Salesperson · Performance' },
      { id: 'sp:orders', label: 'Salesperson · Customer Orders' },
      { id: 'sp:switch-customer', label: 'Salesperson · Switch Customer' },
      { id: 'sp:customers', label: 'Salesperson · Customers' },
      { id: 'sp:customer-details', label: 'Salesperson · Customer Details' },
      { id: 'empty:sp:tasks', label: 'Salesperson \u00b7 Tasks \u00b7 None' },
      { id: 'empty:sp:customers', label: 'Salesperson \u00b7 Customers \u00b7 None' },
      { id: 'empty:sp:orders', label: 'Salesperson \u00b7 Orders \u00b7 None' },
      { id: 'empty:sp:task-details', label: 'Salesperson \u00b7 Interactions \u00b7 None' },
    ],
  },
];

/** Flat list in display order — handy for prev/next and index lookups. */
export const ALL_SCREENS = SCREEN_GROUPS.flatMap((g) => g.items);

/** Screens visible for a surface — same group filter FlowIndex renders with
    (Paytm group only in paytm; Auth hidden in paytm; Salesperson only for that role). */
export function visibleScreens(shell: string, role: string) {
  const effectiveRole = shell === 'paytm' ? 'customer' : role;
  return SCREEN_GROUPS.filter((g) => effectiveRole === 'salesperson' || g.title !== 'Salesperson')
    .filter((g) => shell !== 'paytm' || g.title !== 'Auth')
    .filter((g) => shell === 'paytm' || g.title !== 'Paytm')
    .flatMap((g) => g.items);
}

/** 1-based number as shown in the sidebar (0 if the screen isn't listed). */
export function screenNumber(id: ScreenId, shell: string, role: string): number {
  return visibleScreens(shell, role).findIndex((s) => s.id === id) + 1;
}
