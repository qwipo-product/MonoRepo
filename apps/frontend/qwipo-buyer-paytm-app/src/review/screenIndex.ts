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
    // Shown on BOTH surfaces. Paytm runs the same phone + OTP sign-in as the
    // Qwipo app; only the app splash is Qwipo-only, since the mini launches
    // inside Paytm rather than cold-starting.
    title: 'Auth',
    items: [
      { id: 'splash', label: 'Splash' },
      { id: 'login', label: 'Login' },
      { id: 'otp', label: 'OTP Verification' },
    ],
  },
  {
    // Shown on BOTH surfaces. Paytm skips sign-in but still needs the buyer to
    // onboard and complete KYC before they can order.
    title: 'Onboarding & KYC',
    items: [
      { id: 'kyc-complete', label: 'Complete KYC · 1 Customer Info' },
      { id: 'kyc-business', label: 'Complete KYC · 2 Business Info' },
      { id: 'kyc-docs', label: 'Complete KYC · 3 ID Proofs' },
      // Reached from step 2's location field, so they sit after it.
      { id: 'location-picker', label: 'Select Location (map)' },
      { id: 'address-details', label: 'Address Details' },
      { id: 'kyc-docs-rejected', label: 'ID Proofs · Photo Rejected (1 of 5)' },
      { id: 'kyc-docs-attempt-2', label: 'ID Proofs · Photo Rejected (2 of 5)' },
      { id: 'kyc-docs-done', label: 'ID Proofs · All Accepted' },
      { id: 'kyc-manual-review', label: 'Manual Review (after 5)' },
      { id: 'kyc-success', label: 'KYC Active' },
      { id: 'kyc-pending', label: 'Home · KYC Pending' },
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
      { id: 'wholesaler-groceries', label: 'Wholesalers \u00b7 Groceries' },
      { id: 'wholesaler-fmcg', label: 'Wholesalers \u00b7 FMCG' },
      { id: 'global-search', label: 'Global Search' },
    ],
  },
  {
    title: 'Shop',
    items: [
      { id: 'storefront', label: 'Authorised Distributor Storefront' },
      { id: 'listing', label: 'Product List' },
      { id: 'offer-skus', label: 'Offers & Schemes (SKUs)' },
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
      { id: 'promo-banners', label: 'Promotional Banners' },
      { id: 'loading', label: 'Loading' },
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

/* Individual screens hidden on the Paytm mini even though their group is
   shown. The mini launches from inside Paytm, so it never shows an app splash. */
const PAYTM_HIDDEN = new Set<ScreenId>(['splash']);

/** Groups + items visible for a surface. FlowIndex renders from this, and
    screenNumber counts from it, so the sidebar and the numbering can't drift.
    (Paytm group only in paytm; Salesperson only for that role; Auth and
    Onboarding & KYC on both surfaces, minus the per-item PAYTM_HIDDEN list.) */
export function visibleGroups(shell: string, role: string) {
  const effectiveRole = shell === 'paytm' ? 'customer' : role;
  return SCREEN_GROUPS.filter((g) => effectiveRole === 'salesperson' || g.title !== 'Salesperson')
    .filter((g) => shell === 'paytm' || g.title !== 'Paytm')
    .map((g) => ({
      ...g,
      items: shell === 'paytm' ? g.items.filter((i) => !PAYTM_HIDDEN.has(i.id)) : g.items,
    }))
    .filter((g) => g.items.length > 0);
}

/** Flat list of the screens visible for a surface. */
export function visibleScreens(shell: string, role: string) {
  return visibleGroups(shell, role).flatMap((g) => g.items);
}

/** 1-based number as shown in the sidebar (0 if the screen isn't listed). */
export function screenNumber(id: ScreenId, shell: string, role: string): number {
  return visibleScreens(shell, role).findIndex((s) => s.id === id) + 1;
}
