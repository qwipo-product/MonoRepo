/* ONDC eB2B (DigiDukaan) schemes & offers — mock catalog mirroring the
   /on_search offer object (ONDC:RETeB2B 1.2.5):

     offers[].id             → Offer.id (echoed as @ondc/org/item_id in quote)
     descriptor.code         → Offer.type   discount | buyXgetY | freebie | slab | combo
     item_ids / category_ids → Offer.itemIds / Offer.category (applicability)
     time (label "valid")    → Offer.period
     tags.qualifier          → Offer.eligibility (min_value / item_count / bounds…)
     tags.benefit            → Offer.benefit + Offer.cap (+ slab tiers)
     tags.meta               → Offer.additive / Offer.auto
     tags.scheme_progress    → Offer.progress (P2P /on_search, retailer-specific)

   PRD Scheme Framework layer on top:
     level 'primary'   = QPS + value-based slab   → product list / discounts sheet / cart
     level 'secondary' = BOGO, case bonus, off-invoice, combo, loyalty, early-pay,
                         display allowance, launch incentive → checkout breakdown,
                         with a short mention on the product card where relevant. */

export type OfferType = 'discount' | 'buyXgetY' | 'freebie' | 'slab' | 'combo';
export type OfferLevel = 'primary' | 'secondary';

export interface SlabTier {
  /** Each slab is its own ONDC offer id (slab1, slab2, …). */
  offerId: string;
  /** Qualifier bounds, display-ready: "1 – 2 cases", "20+ units", "₹5K – ₹10K". */
  band: string;
  /** Benefit percent for the band. */
  percent: number;
  /** value_cap (₹) when published. */
  cap?: number;
}

export interface SchemeProgress {
  /** target_quantity / target_purchase_value */
  target: number;
  /** remaining_quantity / remaining_purchase_value */
  remaining: number;
  unit: 'units' | '₹';
  tier: 'silver' | 'gold';
  validTill: string;
}

export interface Offer {
  id: string;
  type: OfferType;
  /** ONDC spec ref for the descriptor code (0091–0094). */
  specRef: string;
  /** PRD Scheme Framework template name (QPS, BOGO, Case Bonus…). */
  framework: string;
  level: OfferLevel;
  title: string;
  /** Sidebar label for this offer's own review page. */
  menuLabel: string;
  /** Concrete worked example with real demo numbers. */
  example: string;
  /** Sample order-quote breakup line (how it lands on the bill). */
  quote?: { title: string; amount: number; freeQty?: number; freeValue?: number };
  /** Where the retailer meets this scheme in the app. */
  surfaces: string[];
  /** Applicability — seller publishing the offer. */
  seller: string;
  /** Applicability — item_ids (empty = seller/category-wide). */
  itemIds: string[];
  /** Applicability — category_ids, display label. */
  category?: string;
  /** Qualifier, display-ready. */
  eligibility: string;
  /** Benefit / savings example, display-ready. */
  benefit: string;
  /** time.range, display-ready. */
  period: string;
  /** meta.additive — combinable with other offers. */
  additive: boolean;
  /** meta.auto — auto-applied vs retailer opt-in at cart. */
  auto: boolean;
  /** slab offers grouped into one card (one ONDC offer per tier). */
  slabs?: SlabTier[];
  /** scheme_progress tag — retailer-specific (P2P /on_search). */
  progress?: SchemeProgress;
  /** PRD-listed scheme with no API payload yet (display allowance etc.). */
  infoOnly?: boolean;
}

export const OFFERS: Offer[] = [
  // ── PRIMARY — QPS + value slabs (descriptor.code = "slab", 0094) ──
  {
    id: 'qps-oil',
    type: 'slab',
    specRef: '0094',
    framework: 'Quantity Price Scheme (QPS)',
    level: 'primary',
    title: 'Buy more cases, earn more margin',
    menuLabel: 'QPS · Oil case slabs',
    example:
      'Order 5 cases (80 pc) of Freedom Oil and the price drops from ₹165.00 to ₹156.75/pc — ₹660 saved on the order.',
    quote: { title: '5% slab discount (5+ cases)', amount: -660 },
    surfaces: ['Product list — Discounts sheet (slab table)', 'Cart — slab line on the seller quote'],
    seller: 'Sri Sai Krishna Traders',
    itemIds: ['p1'],
    category: 'Cooking Oils & Ghee',
    eligibility: 'Volume slabs on Freedom Sunflower Oil (per case of 16)',
    benefit: 'Up to 5% extra off at the top slab',
    period: '1 Sep – 30 Sep 2026',
    additive: false,
    auto: true,
    slabs: [
      { offerId: 'slab1', band: '1 – 2 cases', percent: 0 },
      { offerId: 'slab2', band: '3 – 4 cases', percent: 3, cap: 500 },
      { offerId: 'slab3', band: '5+ cases', percent: 5, cap: 1000 },
    ],
  },
  {
    id: 'qps-soap',
    type: 'slab',
    specRef: '0094',
    framework: 'Quantity Price Scheme (QPS)',
    level: 'primary',
    title: 'Soap carton volume slabs',
    menuLabel: 'QPS · Soap unit slabs',
    example:
      'Order 200 soaps and the 5% slab applies: ₹42.00 → ₹39.90/pc — ₹420 saved. At 50–199 units the 2% slab applies instead.',
    quote: { title: '5% slab discount (200+ units)', amount: -420 },
    surfaces: ['Product list — Discounts sheet (slab table)', 'Cart — slab line on the seller quote'],
    seller: 'Karnataka Soaps & Detergents',
    itemIds: ['p5'],
    category: 'Personal Care',
    eligibility: 'Volume slabs on Mysore Sandal Soap (units)',
    benefit: 'Up to 5% extra off at 200+ units',
    period: '1 Sep – 30 Sep 2026',
    additive: false,
    auto: true,
    slabs: [
      { offerId: 'slab1', band: '1 – 49 units', percent: 0 },
      { offerId: 'slab2', band: '50 – 199 units', percent: 2, cap: 500 },
      { offerId: 'slab3', band: '200+ units', percent: 5, cap: 1000 },
    ],
  },
  {
    id: 'slab-value-srisai',
    type: 'slab',
    specRef: '0094',
    framework: 'Value-Based Slab',
    level: 'primary',
    title: 'Invoice value slab',
    menuLabel: 'Value slab · Invoice bands',
    example:
      'Today’s cart with this seller is ₹5,340 — that lands in the ₹5,000–₹10,000 band, so 1% (−₹53) comes off. Above ₹10,000 it becomes 2%.',
    quote: { title: '1% value slab (₹5K – ₹10K)', amount: -53 },
    surfaces: ['Discounts sheet — value bands', 'Cart & Checkout — slab line on the bill'],
    seller: 'Sri Sai Krishna Traders',
    itemIds: [],
    eligibility: 'On this seller’s invoice value, per order',
    benefit: 'Up to 2% off the invoice',
    period: '1 Sep – 30 Sep 2026',
    additive: false,
    auto: true,
    slabs: [
      { offerId: 'vslab1', band: '₹0 – ₹5,000', percent: 0 },
      { offerId: 'vslab2', band: '₹5,000 – ₹10,000', percent: 1, cap: 500 },
      { offerId: 'vslab3', band: '₹10,000+', percent: 2, cap: 1000 },
    ],
  },

  // ── SECONDARY — cart/checkout schemes ──
  {
    id: 'discp10',
    type: 'discount',
    specRef: '0091',
    framework: 'Scheme Discount',
    level: 'secondary',
    title: '10% off on Atta, Flours & Sooji',
    menuLabel: 'Discount · 10% on Atta',
    example:
      'The cart holds ₹3,360 of Aashirvaad Atta → 10% is ₹336, capped at ₹200 — so −₹200 lands on the bill.',
    quote: { title: '10% off on Atta (max ₹200)', amount: -200 },
    surfaces: ['Product card — offer strip', 'Cart — offer line', 'Checkout — scheme breakdown'],
    seller: 'Sri Sai Krishna Traders',
    itemIds: ['p2'],
    category: 'Atta, Flours & Sooji',
    eligibility: 'Minimum order value ₹500 with this seller',
    benefit: '10% off, capped at ₹200 per order',
    period: '1 Sep – 30 Sep 2026',
    additive: true,
    auto: true,
    progress: { target: 100, remaining: 35, unit: 'units', tier: 'silver', validTill: '31 Mar 2027' },
  },
  {
    id: 'flat150',
    type: 'discount',
    specRef: '0091',
    framework: 'Off-Invoice Discount',
    level: 'secondary',
    title: 'Flat ₹150 off the invoice',
    menuLabel: 'Off-invoice · Flat ₹150',
    example:
      'Omkar’s cart is ₹2,090 — above the ₹1,000 minimum — so a flat ₹150 comes off the invoice (value_type = amount, no cap needed).',
    quote: { title: 'Flat ₹150 off the invoice', amount: -150 },
    surfaces: ['Cart — offer line', 'Checkout — scheme breakdown'],
    seller: 'Omkar Enterprises',
    itemIds: [],
    eligibility: 'Minimum order value ₹1,000 with this seller',
    benefit: 'Flat ₹150 deducted from the invoice',
    period: '1 Sep – 30 Sep 2026',
    additive: true,
    auto: true,
  },
  {
    id: 'buy10get1',
    type: 'buyXgetY',
    specRef: '0092',
    framework: 'BOGO',
    level: 'secondary',
    title: 'Buy 10 cases, get 1 free',
    menuLabel: 'BOGO · Buy 10 Get 1',
    example:
      'The cart has 12 units of Freedom Oil — past the 10-unit qualifier — so 1 free unit (worth ₹165) is added at ₹0.00 with a FREE badge.',
    quote: { title: 'Buy 10, get 1 free', amount: 0, freeQty: 1, freeValue: 165 },
    surfaces: ['Product card — offer strip', 'Cart — FREE item + ₹0.00 line', 'Checkout — scheme breakdown'],
    seller: 'Sri Sai Krishna Traders',
    itemIds: ['p1'],
    category: 'Cooking Oils & Ghee',
    eligibility: 'Buy 10 units of Freedom Sunflower Oil',
    benefit: '1 unit free (₹165 value) at ₹0.00',
    period: '1 Sep – 30 Sep 2026',
    additive: false,
    auto: true,
  },
  {
    id: 'freebie50',
    type: 'freebie',
    specRef: '0093',
    framework: 'Case Bonus / Free Goods',
    level: 'secondary',
    title: 'Buy 50 soaps, get 5 free',
    menuLabel: 'Freebie · Buy 50 Get 5',
    example:
      'At 50 soaps the seller adds 5 free units worth ₹210. The cart has only 3 today, so the cart nudges: “Add 47 more to get 5 free.”',
    quote: { title: 'Buy 50 get 5 free', amount: 0, freeQty: 5, freeValue: 210 },
    surfaces: ['Product card — offer strip', 'Cart — unlock nudge / ₹0.00 line when met', 'Checkout — scheme breakdown'],
    seller: 'Karnataka Soaps & Detergents',
    itemIds: ['p5'],
    category: 'Personal Care',
    eligibility: 'Buy 50 units of Mysore Sandal Soap',
    benefit: '5 free units (₹210 value) at ₹0.00',
    period: '1 Sep – 30 Sep 2026',
    additive: false,
    auto: true,
    progress: { target: 200, remaining: 50, unit: 'units', tier: 'silver', validTill: '31 Mar 2027' },
  },
  {
    id: 'combo1',
    type: 'combo',
    specRef: '0094',
    framework: 'Combo / Bundle Discount',
    level: 'secondary',
    title: 'Oil + Atta combo',
    menuLabel: 'Combo · Oil + Atta',
    example:
      'Freedom Oil and Aashirvaad Atta are both in the cart, so the combo triggers: 50% off the cheaper leg, capped at ₹200 → −₹200.',
    quote: { title: 'Flat ₹200 off on Oil + Atta combo', amount: -200 },
    surfaces: ['Product card — offer strip', 'Cart — offer line', 'Checkout — scheme breakdown'],
    seller: 'Sri Sai Krishna Traders',
    itemIds: ['p1', 'p2'],
    eligibility: 'Buy Freedom Oil and Aashirvaad Atta together',
    benefit: '50% off the combo, capped at ₹200',
    period: '1 Sep – 30 Sep 2026',
    additive: false,
    auto: true,
  },
  {
    id: 'loyalty-gold',
    type: 'discount',
    specRef: '0091',
    framework: 'Loyalty / Annual Rebate',
    level: 'secondary',
    title: 'Gold tier annual rebate',
    menuLabel: 'Loyalty · Gold rebate',
    example:
      'You’ve purchased ₹38,000 of the ₹50,000 quarterly target — ₹12,000 to go. The rebate is credited at quarter end, not on today’s bill.',
    surfaces: ['Offers & Schemes — progress bar with tier', 'Order history — savings trend'],
    seller: 'Sri Sai Krishna Traders',
    itemIds: [],
    eligibility: 'Purchase ₹50,000 with this seller this quarter',
    benefit: 'Tiered rebate credited at quarter end',
    period: 'Quarter ends 31 Mar 2027',
    additive: true,
    auto: true,
    progress: { target: 50000, remaining: 12000, unit: '₹', tier: 'gold', validTill: '31 Mar 2027' },
  },
  {
    id: 'earlypay1',
    type: 'discount',
    specRef: '0091',
    framework: 'Early Payment / Cash Discount',
    level: 'secondary',
    title: 'Extra 1% off for early payment',
    menuLabel: 'Early pay · 1% cash discount',
    example:
      'Today’s ₹6,983 bill paid within 7 days of delivery earns ~₹70 back as a cash discount on the next invoice.',
    surfaces: ['Checkout — explained at the payment step'],
    seller: 'Sri Sai Krishna Traders',
    itemIds: [],
    eligibility: 'Pay within 7 days of delivery',
    benefit: 'Extra 1% off — shown at the payment step',
    period: '1 Sep – 30 Sep 2026',
    additive: true,
    auto: false,
  },
  {
    id: 'display-allow',
    type: 'discount',
    specRef: '—',
    framework: 'Display Allowance',
    level: 'secondary',
    title: 'Shelf display allowance',
    menuLabel: 'Display allowance',
    example:
      'Keep the Mysore Sandal range on a visible shelf and the seller’s rep grants extra goods — agreed offline, confirmed on the invoice.',
    surfaces: ['Offers & Schemes — informational card'],
    seller: 'Karnataka Soaps & Detergents',
    itemIds: [],
    eligibility: 'Maintain an in-store display of Mysore Sandal range',
    benefit: 'Extra goods for display & visibility',
    period: 'Seller-managed',
    additive: true,
    auto: false,
    infoOnly: true,
  },
  {
    id: 'launch-dhoop',
    type: 'freebie',
    specRef: '—',
    framework: 'Launch Incentive',
    level: 'secondary',
    title: 'New launch: Cup Dhoop push',
    menuLabel: 'Launch incentive · Cup Dhoop',
    example:
      'First orders of the new Cup Dhoop variant earn bonus goods this month — the seller’s push to get the new SKU on shelves.',
    surfaces: ['Offers & Schemes — informational card', 'Product card — new-launch mention'],
    seller: 'Karnataka Soaps & Detergents',
    itemIds: ['p6'],
    eligibility: 'Stock the new Cup Dhoop variant this month',
    benefit: 'Bonus goods on first orders of the new SKU',
    period: 'Launch month',
    additive: true,
    auto: false,
    infoOnly: true,
  },
];

export const PRIMARY_OFFERS = OFFERS.filter((o) => o.level === 'primary');
export const SECONDARY_OFFERS = OFFERS.filter((o) => o.level === 'secondary');

export const offerById = (id: string) => OFFERS.find((o) => o.id === id);

/** Neighbours in catalog order — drives prev/next on the per-offer pages. */
export function offerNeighbours(id: string): { prev?: Offer; next?: Offer } {
  const i = OFFERS.findIndex((o) => o.id === id);
  if (i < 0) return {};
  return { prev: OFFERS[i - 1], next: OFFERS[i + 1] };
}

/** Offers applicable to a product — by item id, else seller-wide (no item_ids). */
export function offersForProduct(p: { id: string; seller: string }): Offer[] {
  return OFFERS.filter(
    (o) => o.itemIds.includes(p.id) || (o.itemIds.length === 0 && o.seller === p.seller)
  );
}

/** Short chip text for a product card (secondary scheme mention on the PLP). */
export function offerChipLabel(o: Offer): string {
  switch (o.id) {
    case 'buy10get1': return 'Buy 10 Get 1 Free';
    case 'freebie50': return 'Buy 50 Get 5 Free';
    case 'discp10': return '10% off min ₹500';
    case 'flat150': return '₹150 off min ₹1,000';
    case 'combo1': return 'Oil + Atta combo ₹200 off';
    default: return o.title;
  }
}

/* ── Applied schemes for the seeded cart (mock of the /on_select quote
   breakup): negative-price offer lines + free-goods lines at ₹0.00, keyed by
   seller. Amounts follow the seeded cart quantities in cart.ts. ── */

export interface AppliedScheme {
  offerId: string;
  /** quote breakup line title */
  title: string;
  /** negative reduction in ₹ (0 for free-goods lines) */
  amount: number;
  /** @ondc/org/item_quantity.count for free goods */
  freeQty?: number;
  /** worth of the free goods, display only */
  freeValue?: number;
}

// Sri Sai: subtotal ₹5,340 → value slab 1% = −₹53; atta ₹3,360 → 10% capped −₹200;
// oil 12 ≥ 10 → 1 free (the FREE line in the cart); oil+atta in cart → combo −₹200.
export const APPLIED_SCHEMES: Record<string, AppliedScheme[]> = {
  'Sri Sai Krishna Traders': [
    { offerId: 'discp10', title: '10% off on Atta (max ₹200)', amount: -200 },
    { offerId: 'combo1', title: 'Flat ₹200 off on Oil + Atta combo', amount: -200 },
    { offerId: 'vslab2', title: '1% value slab (₹5K – ₹10K)', amount: -53 },
    { offerId: 'buy10get1', title: 'Buy 10, get 1 free', amount: 0, freeQty: 1, freeValue: 165 },
  ],
  'Omkar Enterprises': [
    { offerId: 'flat150', title: 'Flat ₹150 off the invoice', amount: -150 },
  ],
  'Karnataka Soaps & Detergents': [],
};

/** Nearest unmet scheme per seller — the nudge shown on the cart card. */
export const SCHEME_NUDGES: Record<string, string> = {
  'Karnataka Soaps & Detergents': 'Add 47 more Mysore Sandal Soap to get 5 free (Buy 50 Get 5)',
};

export const appliedFor = (sellerName: string): AppliedScheme[] =>
  APPLIED_SCHEMES[sellerName] ?? [];

export const schemeSavingsFor = (sellerName: string): number =>
  appliedFor(sellerName).reduce((s, a) => s + Math.abs(a.amount), 0);

/** All applied lines across sellers — checkout's consolidated breakdown by scheme ID. */
export const ALL_APPLIED: AppliedScheme[] = Object.values(APPLIED_SCHEMES).flat();

export const TOTAL_SCHEME_SAVINGS = ALL_APPLIED.reduce((s, a) => s + Math.abs(a.amount), 0);
