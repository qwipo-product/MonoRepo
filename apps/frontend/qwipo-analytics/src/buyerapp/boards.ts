import type { EventSpec, FunnelStepSpec, KpiSpec } from './engine';

export interface BoardSection {
  title: string;
  /** one line saying what the table answers */
  sub?: string;
  rows: EventSpec[];
}

export interface BoardSpec {
  path: string;
  title: string;
  question: string;
  /** the one-line story at the top: how many came, how many left without doing anything */
  entry: { place: string; users: number; left: number };
  kpis: KpiSpec[];
  funnel?: { title: string; steps: FunnelStepSpec[] };
  sections: BoardSection[];
  /** page name used by Session recordings, when recordings cover this screen */
  recordings?: string;
}

/**
 * Every tracked action from the buyer-app analytics spec, one board per area.
 * Numbers are 7-day, all-filters base values; the engine scales them by filter.
 *
 * Each row reads as a plain sentence: `say` is what the buyer did, `next` is
 * what `cont` (share, 0–1) of them did straight after, and `rest` describes
 * everyone else (default "left").
 */
export const BOARDS: BoardSpec[] = [
  {
    path: '/home',
    title: 'Home Page',
    question: 'What do buyers do on the Home page and bottom menu?',
    entry: { place: 'the Home page', users: 17850, left: 2980 },
    recordings: 'Home',
    kpis: [
      { label: 'Home visitors', kind: 'users', base: 17850, good: 'up', hint: 'Buyers who opened Home' },
      { label: 'Time on Home', kind: 'time', base: 74, good: 'up', hint: 'Typical visit length' },
      { label: 'Reached bottom', kind: 'pct', base: 22.5, good: 'up', hint: 'Scrolled to the end of Home' },
      { label: 'Tab switches per visit', kind: 'ratio', base: 1.7, good: 'down', hint: 'Wholesaler ↔ Distributor' },
    ],
    sections: [
      {
        title: 'Top bar',
        rows: [
          { name: 'Address icon (view or change address)', say: 'Tapped the address icon', users: 2140, per: 1.3, next: 'changed their address', cont: 0.22, rest: 'closed it' },
          { name: 'Add New Address', say: 'Tapped Add New Address', users: 420, per: 1.1, next: 'saved a new address', cont: 0.78, rest: 'left without saving' },
          { name: 'Notification bell', say: 'Tapped the notification bell', users: 3310, per: 1.6, next: 'opened a notification', cont: 0.46, rest: 'closed it' },
          { name: 'Profile icon', say: 'Opened Profile', users: 2870, per: 1.2, next: 'opened a menu item', cont: 0.71, rest: 'went back' },
          { name: 'Search', say: 'Tapped Search', users: 8340, per: 2.8, next: 'searched for something', cont: 0.88 },
        ],
      },
      {
        title: 'Home sections',
        rows: [
          { name: 'Promotions / banners', say: 'Tapped a banner', users: 4120, per: 1.5, next: 'opened a product', cont: 0.52 },
          { name: 'KPI cards', say: 'Tapped a KPI card', users: 1980, per: 1.4, next: 'opened the details', cont: 0.18, rest: 'found nothing opened' },
          { name: 'Distributor section: See All', say: 'Tapped See All distributors', users: 2650, per: 1.2, next: 'opened a distributor', cont: 0.64 },
          { name: 'Selected a distributor', say: 'Picked a distributor', users: 3980, per: 1.6, next: 'added a product to cart', cont: 0.41 },
          { name: 'Selected a category', say: 'Picked a category', users: 6120, per: 2.1, next: 'added a product to cart', cont: 0.38 },
          { name: 'Category: See All', say: 'Tapped See All categories', users: 3420, per: 1.3, next: 'picked a category', cont: 0.72 },
          { name: 'By Brand / CL Brand', say: 'Picked a brand', users: 2210, per: 1.4, next: 'added a product to cart', cont: 0.35 },
        ],
      },
      {
        title: 'Wholesaler tab',
        rows: [
          { name: 'Switched Wholesaler ↔ Distributor', say: 'Switched between Wholesaler and Distributor', users: 5210, per: 1.7, next: 'opened a product', cont: 0.58 },
          { name: 'FMCG section', say: 'Opened the FMCG section', users: 3120, per: 1.5, next: 'added a product to cart', cont: 0.36 },
          { name: 'Grocery section', say: 'Opened the Grocery section', users: 4460, per: 1.8, next: 'added a product to cart', cont: 0.42 },
          { name: 'Browsed categories', say: 'Scrolled through categories', users: 3980, per: 2.2, next: 'picked a category', cont: 0.67 },
          { name: 'Browsed brands', say: 'Scrolled through brands', users: 2340, per: 1.6, next: 'picked a brand', cont: 0.61 },
        ],
      },
      {
        title: 'Bottom menu',
        rows: [
          { name: 'Reorder', say: 'Tapped Reorder', users: 4620, per: 1.4, next: 'added a past product to cart', cont: 0.72 },
          { name: 'Cart', say: 'Tapped Cart', users: 9120, per: 2.3, next: 'tapped Checkout', cont: 0.83 },
          { name: 'Contacts', say: 'Tapped Contacts', users: 1210, per: 1.1, next: 'called the agent', cont: 0.86 },
          { name: 'Contacts → Call the Agent', say: 'Called the agent', users: 1044, per: 1.2, next: 'placed an order the same day', cont: 0.34, rest: 'didn’t order that day' },
        ],
      },
    ],
  },
  {
    path: '/search',
    title: 'Search & Discovery',
    question: 'What do buyers search for, and do they find it?',
    entry: { place: 'the Search page', users: 8960, left: 1720 },
    recordings: 'Search',
    kpis: [
      { label: 'Searches', kind: 'count', base: 41280, good: 'up', hint: 'Queries typed or tapped' },
      { label: 'Searches with results', kind: 'pct', base: 91.1, good: 'up', hint: 'Returned at least one product' },
      { label: 'Search to cart', kind: 'pct', base: 27.6, good: 'up', hint: 'Searches ending in Add to cart' },
      { label: 'Reached bottom of results', kind: 'pct', base: 31.4, good: 'up', hint: 'Scroll depth 100%' },
    ],
    sections: [
      {
        title: 'Search page',
        rows: [
          { name: 'Suggested searches', say: 'Tapped a suggested search', users: 3120, per: 1.8, next: 'opened a product', cont: 0.8 },
          { name: 'Trending searches', say: 'Tapped a trending search', users: 2460, per: 1.5, next: 'opened a product', cont: 0.75 },
          { name: 'Trending categories', say: 'Tapped a trending category', users: 1830, per: 1.3, next: 'opened the category', cont: 0.75 },
          { name: 'Typed a search', say: 'Typed a search', users: 8340, per: 4.9, next: 'opened a product', cont: 0.745 },
          { name: 'Opened a result (image or card)', say: 'Opened a product from the results', users: 6210, per: 3.2, next: 'added it to cart', cont: 0.71 },
          { name: 'Added to cart from results', say: 'Added to cart from the results', users: 4410, per: 2.4, next: 'went to the cart', cont: 0.75 },
          { name: 'Left results without opening anything', say: 'Saw results but opened nothing', users: 1720, per: 1.2, good: 'down', next: 'searched again', cont: 0.38 },
        ],
      },
      {
        title: 'Most searched',
        sub: 'What buyers type most',
        rows: [
          { name: 'sunflower oil', say: 'Searched “sunflower oil”', users: 1290, per: 1.7, next: 'opened a product', cont: 0.78 },
          { name: 'atta 10 kg', say: 'Searched “atta 10 kg”', users: 1110, per: 1.6, next: 'opened a product', cont: 0.81 },
          { name: 'toor dal', say: 'Searched “toor dal”', users: 980, per: 1.6, next: 'opened a product', cont: 0.76 },
          { name: 'sugar 50 kg', say: 'Searched “sugar 50 kg”', users: 870, per: 1.6, next: 'opened a product', cont: 0.72 },
          { name: 'sona masoori rice', say: 'Searched “sona masoori rice”', users: 790, per: 1.6, next: 'opened a product', cont: 0.79 },
        ],
      },
      {
        title: 'Searched, but no results',
        sub: 'Products buyers want that we don’t show',
        rows: [
          { name: 'jaggery powder', say: 'Searched “jaggery powder”, found nothing', users: 240, per: 1.3, good: 'down', next: 'searched something else', cont: 0.42 },
          { name: 'ghee 15 ltr', say: 'Searched “ghee 15 ltr”, found nothing', users: 205, per: 1.3, good: 'down', next: 'searched something else', cont: 0.46 },
          { name: 'cashew 1 kg', say: 'Searched “cashew 1 kg”, found nothing', users: 160, per: 1.2, good: 'down', next: 'searched something else', cont: 0.38 },
          { name: 'basmati 25 kg', say: 'Searched “basmati 25 kg”, found nothing', users: 140, per: 1.3, good: 'down', next: 'searched something else', cont: 0.44 },
        ],
      },
      {
        title: 'Ads & banners on Search',
        rows: [
          { name: 'Ad / banner seen', say: 'Saw an ad or banner', users: 8100, per: 1.6, next: 'tapped it', cont: 0.06, rest: 'ignored it' },
          { name: 'Ad / banner tapped', say: 'Tapped an ad or banner', users: 480, per: 1.2, next: 'opened the product', cont: 0.66 },
        ],
      },
    ],
  },
  {
    path: '/browse',
    title: 'Categories, Brands & Distributors',
    question: 'How do buyers browse categories, brands and distributors?',
    entry: { place: 'the Category, Brand or Distributor pages', users: 9800, left: 1640 },
    kpis: [
      { label: 'Category list visitors', kind: 'users', base: 5210, good: 'up', hint: 'Opened the Category list' },
      { label: 'Brand list visitors', kind: 'users', base: 3460, good: 'up', hint: 'Opened the Brand list' },
      { label: 'Time on Distributor list', kind: 'time', base: 58, good: 'up', hint: 'Typical visit length' },
      { label: 'Tab switches', kind: 'ratio', base: 2.3, good: 'down', hint: 'Per visit, Authorized Distributor' },
    ],
    sections: [
      {
        title: 'Category & Brand lists',
        rows: [
          { name: 'Visited Category list', say: 'Opened the Category list', users: 5210, per: 1.4, next: 'picked a category', cont: 0.79 },
          { name: 'Used category search', say: 'Searched within categories', users: 1340, per: 1.9, next: 'picked a category', cont: 0.64 },
          { name: 'Visited Brand list', say: 'Opened the Brand list', users: 3460, per: 1.3, next: 'picked a brand', cont: 0.74 },
          { name: 'Used brand search', say: 'Searched within brands', users: 980, per: 1.7, next: 'picked a brand', cont: 0.6 },
        ],
      },
      {
        title: 'Picked after searching',
        sub: 'Categories and brands chosen from search results',
        rows: [
          { name: 'Category: Edible Oils', say: 'Picked the Edible Oils category', users: 610, per: 1.2, next: 'added a product to cart', cont: 0.48 },
          { name: 'Category: Atta & Flours', say: 'Picked the Atta & Flours category', users: 420, per: 1.2, next: 'added a product to cart', cont: 0.44 },
          { name: 'Category: Rice & Grains', say: 'Picked the Rice & Grains category', users: 380, per: 1.1, next: 'added a product to cart', cont: 0.41 },
          { name: 'Brand: Fortune', say: 'Picked the Fortune brand', users: 290, per: 1.2, next: 'added a product to cart', cont: 0.52 },
          { name: 'Brand: Aashirvaad', say: 'Picked the Aashirvaad brand', users: 260, per: 1.1, next: 'added a product to cart', cont: 0.5 },
          { name: 'Brand: Tata Sampann', say: 'Picked the Tata Sampann brand', users: 190, per: 1.1, next: 'added a product to cart', cont: 0.43 },
        ],
      },
      {
        title: 'Authorized Distributor page',
        rows: [
          { name: 'Brands tab', say: 'Opened the Brands tab', users: 2140, per: 1.5, next: 'opened a product', cont: 0.55 },
          { name: 'Categories tab', say: 'Opened the Categories tab', users: 2860, per: 1.7, next: 'opened a product', cont: 0.6 },
          { name: 'Distributor list tab', say: 'Opened the Distributor list tab', users: 3310, per: 1.8, next: 'opened a distributor', cont: 0.68 },
          { name: 'Moved between tabs', say: 'Switched between tabs', users: 2420, per: 2.3, next: 'opened a product', cont: 0.44 },
        ],
      },
      {
        title: 'Distributors',
        rows: [
          { name: 'Opened Distributor list', say: 'Opened the Distributor list', users: 7420, per: 1.5, next: 'opened a distributor', cont: 0.67 },
          { name: 'Browsed distributor categories', say: 'Browsed a distributor’s categories', users: 3870, per: 2.0, next: 'added a product to cart', cont: 0.43 },
          { name: 'Opened a distributor', say: 'Opened a distributor', users: 4960, per: 1.8, next: 'added a product to cart', cont: 0.47 },
          { name: 'Discount on a product card', say: 'Tapped a discount on a product card', users: 1520, per: 1.4, next: 'added the product to cart', cont: 0.52 },
          { name: 'Go to Code button', say: 'Tapped Go to Code', users: 640, per: 1.1, next: 'used the code', cont: 0.48 },
        ],
      },
    ],
  },
  {
    path: '/products',
    title: 'Product List',
    question: 'How do buyers use the product list, and does Add work?',
    entry: { place: 'a product list', users: 14210, left: 3100 },
    recordings: 'Product List',
    kpis: [
      { label: 'Product list visitors', kind: 'users', base: 14210, good: 'up', hint: 'Opened a product list' },
      { label: 'Time on product list', kind: 'time', base: 96, good: 'up', hint: 'Typical visit length' },
      { label: 'Add taps', kind: 'count', base: 31540, good: 'up', hint: 'Taps on the Add button' },
      { label: 'Add didn’t work', kind: 'pct', base: 2.1, good: 'down', hint: 'Add tapped, item not added' },
    ],
    sections: [
      {
        title: 'Browsing',
        rows: [
          { name: 'Category filters', say: 'Used the category filters', users: 5320, per: 2.4, next: 'added a product to cart', cont: 0.55 },
          { name: 'Went to Sage', say: 'Went to Sage', users: 860, per: 1.2, next: 'came back and added to cart', cont: 0.3 },
          { name: 'Product card / image', say: 'Opened a product card or photo', users: 9870, per: 3.6, next: 'tapped Add', cont: 0.7 },
          { name: 'Viewed discounts / offers', say: 'Looked at discounts or offers', users: 3240, per: 1.7, next: 'tapped Add', cont: 0.62 },
          { name: 'Switched product variant', say: 'Switched to another size or variant', users: 2780, per: 1.9, next: 'tapped Add', cont: 0.68 },
          { name: 'Switched seller (same product)', say: 'Switched seller for the same product', users: 1650, per: 2.1, next: 'tapped Add', cont: 0.64 },
        ],
      },
      {
        title: 'Adding to cart',
        rows: [
          { name: 'Tapped Add', say: 'Tapped Add', users: 9960, per: 3.2, next: 'had the item added', cont: 0.979, rest: 'saw it fail' },
          { name: 'Item added', say: 'Item added to cart', users: 9750, per: 3.1, next: 'went to the cart', cont: 0.91 },
          { name: 'Tapped Add, item not added', say: 'Tapped Add, but the item wasn’t added', users: 410, per: 1.4, good: 'down', next: 'tried again', cont: 0.52, rest: 'gave up' },
        ],
      },
      {
        title: 'Why Add didn’t work',
        rows: [
          { name: 'Out of stock at seller', say: 'Couldn’t add: out of stock at the seller', users: 170, per: 1.3, good: 'down', next: 'picked another seller', cont: 0.4, rest: 'gave up' },
          { name: 'Minimum quantity not met', say: 'Couldn’t add: below minimum quantity', users: 110, per: 1.2, good: 'down', next: 'raised the quantity', cont: 0.62, rest: 'gave up' },
          { name: 'Network error', say: 'Couldn’t add: network error', users: 80, per: 1.5, good: 'down', next: 'tried again', cont: 0.7, rest: 'gave up' },
          { name: 'Seller unavailable', say: 'Couldn’t add: seller unavailable', users: 50, per: 1.1, good: 'down', next: 'picked another seller', cont: 0.45, rest: 'gave up' },
        ],
      },
    ],
  },
  {
    path: '/cart',
    title: 'Cart',
    question: 'What happens in the cart before checkout?',
    entry: { place: 'the cart', users: 9120, left: 1580 },
    recordings: 'Cart',
    kpis: [
      { label: 'Cart visitors', kind: 'users', base: 9120, good: 'up', hint: 'Opened the cart' },
      { label: 'Tapped Checkout', kind: 'users', base: 7540, good: 'up', hint: 'Buyers who started checkout' },
      { label: 'Saw Proceed Anyway alert', kind: 'pct', base: 31.7, good: 'down', hint: 'Of checkouts' },
      { label: 'Left cart before checkout', kind: 'pct', base: 17.3, good: 'down', hint: 'Cart abandonment' },
    ],
    funnel: {
      title: 'Cart to checkout',
      steps: [
        { label: 'Opened cart', users: 9120, secs: 0 },
        { label: 'Tapped Checkout', users: 7540, secs: 95 },
        { label: 'Reached Order Summary', users: 7210, secs: 40 },
      ],
    },
    sections: [
      {
        title: 'In the cart',
        rows: [
          { name: 'Add More Items', say: 'Tapped Add More Items', users: 2310, per: 1.4, next: 'came back with more items', cont: 0.63 },
          { name: 'View Items', say: 'Tapped View Items', users: 3860, per: 1.6, next: 'tapped Checkout', cont: 0.78 },
          { name: 'Removed an item', say: 'Removed an item', users: 1940, per: 1.8, next: 'tapped Checkout', cont: 0.74 },
          { name: 'Checkout', say: 'Tapped Checkout', users: 7540, per: 1.2, next: 'reached Order Summary', cont: 0.956 },
        ],
      },
      {
        title: 'Delivery option',
        rows: [
          { name: 'Beat Day → Tomorrow', say: 'Changed delivery from Beat Day to Tomorrow', users: 842, per: 1.1, next: 'tapped Checkout', cont: 0.82 },
          { name: 'Tomorrow → Beat Day', say: 'Changed delivery from Tomorrow to Beat Day', users: 296, per: 1.1, next: 'tapped Checkout', cont: 0.8 },
          { name: 'Added items after changing date', say: 'Added items after changing the date', users: 330, per: 1.6, next: 'tapped Checkout', cont: 0.85 },
        ],
      },
      {
        title: 'Proceed Anyway alert',
        sub: 'Shown when MOV isn’t met, stock changed or items are unavailable',
        rows: [
          { name: 'Alert shown', say: 'Saw the Proceed Anyway alert', users: 2390, per: 1.3, good: 'down', next: 'carried on to checkout', cont: 0.86, rest: 'closed it' },
          { name: 'Proceed', say: 'Tapped Proceed', users: 1390, per: 1.1, next: 'reached Order Summary', cont: 0.92 },
          { name: 'Cancel / close', say: 'Closed the alert', users: 335, per: 1.2, good: 'down', next: 'came back to checkout later', cont: 0.3 },
          { name: 'Add more items', say: 'Tapped Add more items on the alert', users: 545, per: 1.1, next: 'checked out again', cont: 0.7 },
          { name: 'Remove unavailable items', say: 'Removed unavailable items', users: 120, per: 1.1, next: 'checked out again', cont: 0.88 },
        ],
      },
    ],
  },
  {
    path: '/order-summary',
    title: 'Order Summary & Placement',
    question: 'Do buyers who reach Order Summary place the order?',
    entry: { place: 'Order Summary', users: 7210, left: 892 },
    recordings: 'Order Summary',
    kpis: [
      { label: 'Time on Order Summary', kind: 'time', base: 48, good: 'down', hint: 'Typical visit length' },
      { label: 'Summary to Place Order', kind: 'time', base: 112, good: 'down', hint: 'Typical time taken' },
      { label: 'Orders placed', kind: 'users', base: 6318, good: 'up', hint: 'Successful orders' },
      { label: 'Left without ordering', kind: 'users', base: 892, good: 'down', hint: 'Reached Summary, no order' },
    ],
    sections: [
      {
        title: 'Coupons',
        rows: [
          { name: 'Opened coupon section', say: 'Opened the coupon section', users: 2810, per: 1.3, next: 'applied a coupon', cont: 0.47 },
          { name: 'Searched / browsed coupons', say: 'Looked through coupons', users: 1640, per: 1.9, next: 'applied a coupon', cont: 0.62 },
          { name: 'Applied a coupon', say: 'Applied a coupon', users: 1320, per: 1.4, next: 'had it work', cont: 0.72, rest: 'saw it fail' },
          { name: 'Coupon worked', say: 'Coupon applied successfully', users: 950, per: 1.1, next: 'placed the order', cont: 0.93 },
          { name: 'Coupon failed', say: 'Coupon didn’t apply', users: 432, per: 1.6, good: 'down', next: 'placed the order anyway', cont: 0.64 },
        ],
      },
      {
        title: 'Why coupons failed',
        rows: [
          { name: 'MOV not met for coupon', say: 'Coupon failed: order below minimum value', users: 184, per: 1.4, good: 'down', next: 'added items to reach it', cont: 0.48, rest: 'gave up on the coupon' },
          { name: 'Coupon expired', say: 'Coupon failed: expired', users: 97, per: 1.2, good: 'down', next: 'placed the order anyway', cont: 0.6 },
          { name: 'Not valid for this seller', say: 'Coupon failed: not valid for this seller', users: 76, per: 1.3, good: 'down', next: 'placed the order anyway', cont: 0.57 },
          { name: 'Usage limit reached', say: 'Coupon failed: already used up', users: 41, per: 1.1, good: 'down', next: 'placed the order anyway', cont: 0.66 },
        ],
      },
      {
        title: 'Placing the order',
        rows: [
          { name: 'View Items', say: 'Checked the items again', users: 2240, per: 1.2, next: 'tapped Place Order', cont: 0.86 },
          { name: 'Tapped Place Order', say: 'Tapped Place Order', users: 6530, per: 1.1, next: 'saw the order go through', cont: 0.968, rest: 'saw it fail' },
          { name: 'Order placed', say: 'Order went through', users: 6318, per: 1.0, next: 'opened the order details', cont: 0.38, rest: 'closed the app' },
          { name: 'Order failed', say: 'Order failed', users: 212, per: 1.2, good: 'down', next: 'tried again and succeeded', cont: 0.55, rest: 'gave up' },
        ],
      },
      {
        title: 'Why orders failed',
        rows: [
          { name: 'Stock changed at seller', say: 'Order failed: stock changed at the seller', users: 71, per: 1.1, good: 'down', next: 'tried again and succeeded', cont: 0.48, rest: 'gave up' },
          { name: 'Price changed', say: 'Order failed: price changed', users: 48, per: 1.1, good: 'down', next: 'tried again and succeeded', cont: 0.62, rest: 'gave up' },
          { name: 'Network timeout', say: 'Order failed: network timeout', users: 39, per: 1.3, good: 'down', next: 'tried again and succeeded', cont: 0.74, rest: 'gave up' },
          { name: 'Server error', say: 'Order failed: server error', users: 27, per: 1.2, good: 'down', next: 'tried again and succeeded', cont: 0.6, rest: 'gave up' },
          { name: 'Delivery slot full', say: 'Order failed: delivery slot full', users: 17, per: 1.0, good: 'down', next: 'picked another slot', cont: 0.7, rest: 'gave up' },
        ],
      },
    ],
  },
  {
    path: '/orders',
    title: 'Orders & Tracking',
    question: 'How do buyers follow up on their orders?',
    entry: { place: 'My Orders', users: 4120, left: 340 },
    kpis: [
      { label: 'My Orders visitors', kind: 'users', base: 4120, good: 'up', hint: 'Profile → My Orders' },
      { label: 'Order details load time', kind: 'secs', base: 1.8, good: 'down', hint: 'Typical wait' },
      { label: 'Tracked an order', kind: 'users', base: 3210, good: 'up', hint: 'Tapped Track Order' },
      { label: 'Orders cancelled', kind: 'pct', base: 4.6, good: 'down', hint: 'Of orders placed' },
    ],
    sections: [
      {
        title: 'Finding an order',
        rows: [
          { name: 'Profile → My Orders', say: 'Opened My Orders', users: 4120, per: 1.5, next: 'opened an order', cont: 0.92 },
          { name: 'Opened order details', say: 'Opened an order’s details', users: 3780, per: 1.9, next: 'tapped Track Order', cont: 0.85 },
          { name: 'Tapped Track Order', say: 'Tapped Track Order', users: 3210, per: 1.7, next: 'saw the tracking page', cont: 0.98, rest: 'saw it fail to load' },
          { name: 'Viewed tracking page', say: 'Saw the tracking page', users: 3150, per: 1.8, next: 'went back to the order details', cont: 0.4, rest: 'closed it' },
          { name: 'Tracking → Order details', say: 'Went from tracking back to the order', users: 1260, per: 1.2, next: 'reordered or called support', cont: 0.2, rest: 'closed it' },
        ],
      },
      {
        title: 'Cancelling',
        rows: [
          { name: 'Tapped Cancel Order', say: 'Tapped Cancel Order', users: 640, per: 1.1, good: 'down', next: 'finished cancelling', cont: 0.7, rest: 'kept the order' },
          { name: 'Cancellation completed', say: 'Cancelled an order', users: 448, per: 1.0, good: 'down', next: 'placed a new order', cont: 0.35, rest: 'didn’t reorder' },
          { name: 'Started cancelling, then stopped', say: 'Started cancelling, then stopped', users: 192, per: 1.1, next: 'kept the order', cont: 0.95, rest: 'cancelled later' },
        ],
      },
      {
        title: 'Why buyers cancelled',
        rows: [
          { name: 'Ordered by mistake', say: 'Cancelled: ordered by mistake', users: 118, per: 1, good: 'down', next: 'placed a corrected order', cont: 0.46, rest: 'didn’t reorder' },
          { name: 'Delivery date too late', say: 'Cancelled: delivery date too late', users: 96, per: 1, good: 'down', next: 'placed a new order', cont: 0.2, rest: 'didn’t reorder' },
          { name: 'Found a better price', say: 'Cancelled: found a better price', users: 71, per: 1, good: 'down', next: 'placed a new order', cont: 0.1, rest: 'didn’t reorder' },
          { name: 'Wrong quantity', say: 'Cancelled: wrong quantity', users: 64, per: 1, good: 'down', next: 'placed a corrected order', cont: 0.7, rest: 'didn’t reorder' },
          { name: 'Other', say: 'Cancelled: other reason', users: 99, per: 1, good: 'down', next: 'placed a new order', cont: 0.25, rest: 'didn’t reorder' },
        ],
      },
    ],
  },
  {
    path: '/profile',
    title: 'Profile & Notifications',
    question: 'What do buyers use in Profile, and do notifications work?',
    entry: { place: 'Profile', users: 2870, left: 410 },
    kpis: [
      { label: 'Profile opens', kind: 'users', base: 2870, good: 'up', hint: 'Buyers who opened Profile' },
      { label: 'Notifications read', kind: 'pct', base: 18.3, good: 'up', hint: 'Of notifications seen' },
      { label: 'Theme switches', kind: 'users', base: 310, good: 'up', hint: 'Changed dark / light' },
      { label: 'Logged out', kind: 'users', base: 140, good: 'down', hint: 'Successful logouts' },
    ],
    sections: [
      {
        title: 'Profile menu',
        rows: [
          { name: 'My Orders', say: 'Opened My Orders', users: 4120, per: 1.5, next: 'opened an order', cont: 0.92 },
          { name: 'Address list', say: 'Opened the address list', users: 980, per: 1.2, next: 'added or changed an address', cont: 0.41, rest: 'just looked' },
          { name: 'Notifications', say: 'Opened Notifications', users: 2210, per: 1.6, next: 'opened a notification', cont: 0.55 },
          { name: 'Contact Us', say: 'Opened Contact Us', users: 760, per: 1.1, next: 'called or messaged support', cont: 0.62 },
          { name: 'Switched to Dark theme', say: 'Switched to the dark theme', users: 210, per: 1.1, next: 'kept it', cont: 0.85, rest: 'switched back' },
          { name: 'Switched to Light theme', say: 'Switched to the light theme', users: 100, per: 1.1, next: 'kept it', cont: 0.9, rest: 'switched back' },
          { name: 'Tapped Logout', say: 'Tapped Logout', users: 165, per: 1.0, next: 'logged out', cont: 0.85, rest: 'changed their mind' },
          { name: 'Logged out', say: 'Logged out', users: 140, per: 1.0, next: 'logged back in within a day', cont: 0.55, rest: 'stayed logged out' },
        ],
      },
      {
        title: 'Notifications',
        rows: [
          { name: 'Notification seen', say: 'Saw a notification', users: 12400, per: 3.4, next: 'opened it', cont: 0.18, rest: 'ignored it' },
          { name: 'Notification opened', say: 'Opened a notification', users: 2270, per: 1.4, next: 'went on to an offer, order or the cart', cont: 0.93 },
          { name: 'Then opened an offer', say: 'Opened an offer from a notification', users: 930, per: 1.2, next: 'added a product to cart', cont: 0.4 },
          { name: 'Then opened an order', say: 'Opened an order from a notification', users: 780, per: 1.1, next: 'tracked it', cont: 0.7 },
          { name: 'Then went to cart', say: 'Went to the cart from a notification', users: 410, per: 1.1, next: 'placed the order', cont: 0.55 },
        ],
      },
    ],
  },
  {
    path: '/onboarding',
    title: 'Onboarding, KYC & Address',
    question: 'Do new buyers finish sign-up, KYC and address?',
    entry: { place: 'onboarding', users: 1240, left: 474 },
    recordings: 'Onboarding',
    kpis: [
      { label: 'Started onboarding', kind: 'users', base: 1240, good: 'up', hint: 'New buyers' },
      { label: 'Completed onboarding', kind: 'pct', base: 61.8, good: 'up', hint: 'Of those who started' },
      { label: 'Time to complete', kind: 'time', base: 440, good: 'down', hint: 'Typical time taken' },
      { label: 'KYC approved', kind: 'pct', base: 72.5, good: 'up', hint: 'Of KYC submissions' },
    ],
    funnel: {
      title: 'Onboarding steps',
      steps: [
        { label: 'Started', users: 1240, secs: 0 },
        { label: 'OTP verified', users: 1152, secs: 45 },
        { label: 'Business details', users: 1006, secs: 130 },
        { label: 'KYC submitted', users: 842, secs: 160 },
        { label: 'Address added', users: 790, secs: 70 },
        { label: 'Completed', users: 766, secs: 35 },
      ],
    },
    sections: [
      {
        title: 'Onboarding behaviour',
        rows: [
          { name: 'Went back a step', say: 'Went back a step', users: 310, per: 1.8, good: 'down', next: 'carried on', cont: 0.7 },
          { name: 'Skipped a step', say: 'Skipped a step', users: 140, per: 1.2, next: 'came back to finish it', cont: 0.45, rest: 'never finished it' },
          { name: 'Saw a validation error', say: 'Saw an error on a form', users: 520, per: 2.1, good: 'down', next: 'fixed it and carried on', cont: 0.66 },
          { name: 'Abandoned onboarding', say: 'Left onboarding half-way', users: 474, per: 1.0, good: 'down', next: 'came back later', cont: 0.2, rest: 'never came back' },
        ],
      },
      {
        title: 'Onboarding errors',
        rows: [
          { name: 'Invalid GSTIN', say: 'Error: GSTIN not valid', users: 214, per: 1.6, good: 'down', next: 'fixed it and carried on', cont: 0.55 },
          { name: 'OTP expired', say: 'Error: OTP expired', users: 168, per: 1.4, good: 'down', next: 'asked for a new OTP', cont: 0.8 },
          { name: 'Pincode not serviceable', say: 'Error: we don’t deliver to that pincode', users: 121, per: 1.2, good: 'down', next: 'tried another pincode', cont: 0.25 },
          { name: 'Business name mismatch', say: 'Error: business name doesn’t match', users: 96, per: 1.3, good: 'down', next: 'fixed it and carried on', cont: 0.6 },
        ],
      },
      {
        title: 'KYC',
        rows: [
          { name: 'Visited KYC details page', say: 'Opened the KYC page', users: 1020, per: 1.4, next: 'started KYC', cont: 0.96 },
          { name: 'Started KYC', say: 'Started KYC', users: 980, per: 1.0, next: 'uploaded documents', cont: 0.93 },
          { name: 'Uploaded documents', say: 'Uploaded documents', users: 910, per: 1.6, next: 'got KYC approved', cont: 0.725, rest: 'were rejected or left' },
          { name: 'KYC completed', say: 'KYC approved', users: 660, per: 1.0, next: 'placed a first order', cont: 0.48, rest: 'haven’t ordered yet' },
          { name: 'KYC failed', say: 'KYC rejected', users: 250, per: 1.2, good: 'down', next: 'sent documents again', cont: 0.52, rest: 'gave up' },
          { name: 'KYC abandoned', say: 'Left KYC half-way', users: 70, per: 1.0, good: 'down', next: 'came back later', cont: 0.25, rest: 'never came back' },
        ],
      },
      {
        title: 'Why KYC failed',
        rows: [
          { name: 'Blurry document photo', say: 'KYC rejected: blurry document photo', users: 88, per: 1.3, good: 'down', next: 'sent a clearer photo', cont: 0.64, rest: 'gave up' },
          { name: 'GSTIN inactive', say: 'KYC rejected: GSTIN inactive', users: 61, per: 1.1, good: 'down', next: 'sent documents again', cont: 0.3, rest: 'gave up' },
          { name: 'Name mismatch with PAN', say: 'KYC rejected: name doesn’t match PAN', users: 47, per: 1.1, good: 'down', next: 'sent documents again', cont: 0.5, rest: 'gave up' },
          { name: 'Missing shop photo', say: 'KYC rejected: no shop photo', users: 33, per: 1.2, good: 'down', next: 'added the shop photo', cont: 0.72, rest: 'gave up' },
        ],
      },
      {
        title: 'Address',
        rows: [
          { name: 'Visited Add Address', say: 'Opened Add Address', users: 1380, per: 1.2, next: 'tried to save', cont: 0.93 },
          { name: 'Tried to save an address', say: 'Tried to save an address', users: 1290, per: 1.4, next: 'saved it', cont: 0.88, rest: 'hit an error' },
          { name: 'Address saved', say: 'Saved an address', users: 1140, per: 1.0, next: 'went on to shop', cont: 0.8 },
          { name: 'Address error', say: 'Saw an address error', users: 229, per: 1.5, good: 'down', next: 'fixed it and saved', cont: 0.6, rest: 'gave up' },
          { name: 'Left without saving', say: 'Left Add Address without saving', users: 150, per: 1.0, good: 'down', next: 'came back later', cont: 0.3, rest: 'never came back' },
        ],
      },
    ],
  },
  {
    path: '/reorder',
    title: 'Reorder',
    question: 'Do buyers use Reorder, and does it lead to orders?',
    entry: { place: 'the Reorder page', users: 4620, left: 240 },
    kpis: [
      { label: 'Reorder visitors', kind: 'users', base: 4620, good: 'up', hint: 'Opened the Reorder page' },
      { label: 'Products viewed per visit', kind: 'ratio', base: 6.4, good: 'up', hint: 'On the Reorder page' },
      { label: 'Reorder to order', kind: 'pct', base: 46.2, good: 'up', hint: 'Visits ending in an order' },
      { label: 'Orders from Reorder', kind: 'pct', base: 21.8, good: 'up', hint: 'Share of all orders' },
    ],
    funnel: {
      title: 'Reorder to order',
      steps: [
        { label: 'Opened Reorder', users: 4620, secs: 0 },
        { label: 'Added to cart', users: 3340, secs: 50 },
        { label: 'Opened cart', users: 3120, secs: 30 },
        { label: 'Checkout', users: 2380, secs: 60 },
        { label: 'Order placed', users: 2134, secs: 95 },
      ],
    },
    sections: [
      {
        title: 'On the Reorder page',
        rows: [
          { name: 'Viewed products', say: 'Looked at their past products', users: 4380, per: 6.4, next: 'added one to cart', cont: 0.76 },
          { name: 'Added to cart', say: 'Added a past product to cart', users: 3340, per: 4.1, next: 'went to the cart', cont: 0.93 },
          { name: 'Changed quantity', say: 'Changed a quantity', users: 2110, per: 2.7, next: 'went to the cart', cont: 0.9 },
          { name: 'Went to cart', say: 'Went to the cart', users: 3120, per: 1.2, next: 'placed the order', cont: 0.68 },
        ],
      },
    ],
  },
];
