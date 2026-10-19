// Offer fixtures used by product labels, scheme filters, and cart pricing.
// Reward metadata identifies schemes; the cart does not add free SKU lines.

/** One product requirement inside a scheme. */
export interface OfferNeed {
  productId: string;
  /** Units of that product the scheme needs. */
  qty: number;
}

export interface Offer {
  id: string;
  /** Scheme name used in product labels. */
  label?: string;
  /** The benefit itself — the emphasised part of the headline. */
  benefit: string;
  /** What the benefit applies to — trails the benefit in the same sentence. */
  scope: string;
  /** Whether the scheme applies automatically when its requirements are met. */
  automatic: boolean;
  /** Scheme requirement — every line must be met. */
  needs?: OfferNeed[];
  /** Free-goods metadata for a scheme. The cart does not add reward SKU lines. */
  reward?: OfferNeed;
  /** Percentage this scheme takes off once `needs` are met — the Combo/Slab
   * counterpart to `reward`: cart.ts applies it to the first `needs` line's
   * total, so "15% Off" is money actually off the order, not just a label.
   * Mutually exclusive with `reward` — a scheme pays out one or the other. */
  discountPct?: number;
  /** Published scheme code used to identify the fixture. */
  code: string;
  /** Last day recorded for the demonstration offer. */
  expires?: string;
}

/* Scheme requirements describe the demonstration products. Cart pricing
   applies qualifying percentage discounts to purchased lines. */
export const OFFERS: Offer[] = [
  {
    id: 'oil-case',
    code: 'OILBOGO10',
    expires: '31 Oct 2026',
    label: 'Bogo',
    benefit: 'Buy 10 Cases Get 1 Free',
    scope: 'on Freedom Refined Sunflower Oil',
    automatic: true,
    needs: [{ productId: 'p1', qty: 10 }],
    reward: { productId: 'p1', qty: 1 },
  },
  {
    id: 'atta-freebie',
    code: 'ATTA8FREE',
    expires: '30 Nov 2026',
    label: 'Freebie',
    benefit: 'Buy 8 units → Get 1 FREE',
    scope: 'on Aashirvaad Atta',
    automatic: true,
    needs: [{ productId: 'p2', qty: 8 }],
    reward: { productId: 'p2', qty: 1 },
  },
  {
    id: 'besan-bonus',
    code: 'BESAN50',
    expires: '15 Nov 2026',
    label: 'Case Bonus',
    benefit: 'Buy 50 units → Get 5 FREE',
    scope: 'on Fortune Besan',
    automatic: true,
    needs: [{ productId: 'p3', qty: 50 }],
    reward: { productId: 'p3', qty: 5 },
  },
  {
    id: 'besan-combo',
    code: 'BESANTEA15',
    expires: '31 Dec 2026',
    label: 'Combo',
    benefit: '15% Off',
    scope: 'on Fortune Besan when bought together with Red Label Tea',
    automatic: true,
    needs: [
      { productId: 'p3', qty: 1 },
      { productId: 'p10', qty: 1 },
    ],
    discountPct: 15,
  },

  /* ── Tata Consumer Products (TCPL) — real schemes from TCP's own Salesforce
     export (see data/tcpl.ts). Thresholds are expressed in the same
     productId+qty shape every other scheme here uses; a value-based slab
     (Soulfull) is approximated at the unit count its lowest ₹ tier needs. */
  {
    label: 'Slab',
    benefit: '4.5% Off',
    scope: 'on 5+ cases of Tata Salt Black Salt Sachet',
    automatic: true,
    needs: [{ productId: 'p22', qty: 900 }], // 5 cases × 180 pcs/case
    discountPct: 4.5,
    id: 'tcp-black-salt',
    code: 'BLACKSALT45',
    expires: '20 Oct 2026',
  },
  {
    label: 'Slab',
    benefit: 'Up to 15% Off',
    scope: 'on Soulfull Masala Oats+ (Masala), by order value',
    automatic: true,
    needs: [{ productId: 'p24', qty: 4 }], // ≈ ₹500 (the lowest tier) at ₹155/pc
    discountPct: 15, // flat rate for the demo — the real scheme is a multi-tier "up to"
    id: 'tcp-masala-oats',
    code: 'OATS15',
    expires: '30 Nov 2026',
  },
  {
    label: 'Wafer Bogo',
    benefit: 'Buy 1 Case Get 1 Free',
    scope: 'on Soulfull Ragi Bites Strawberry Wafer',
    automatic: true,
    needs: [{ productId: 'p28', qty: 24 }], // 1 case
    reward: { productId: 'p28', qty: 24 }, // 1 free case = 24 pcs
    id: 'tcp-wafer-bogo-strawberry',
    code: 'WAFERBOGO',
    expires: '15 Dec 2026',
  },

  /* ── Offer-pattern coverage — one SKU per scheme type below (see
     data/products.ts p31–p39), plus two SKUs stacking two patterns and one
     flagship SKU carrying all five at once. Written against the demo cart
     the same way the block above is: most qualify out of the box, one
     (Sunfeast Marie Gold's Slab) is left short so the "needs-items" state
     still has a live example. */
  {
    label: 'Bogo',
    benefit: 'Buy 1 Case Get 1 Free',
    scope: 'on Everest Garam Masala',
    automatic: true,
    needs: [{ productId: 'p31', qty: 24 }],
    reward: { productId: 'p31', qty: 24 },
    id: 'everest-garam-masala-bogo',
    code: 'GARAMBOGO',
    expires: '31 Oct 2026',
  },
  {
    label: 'Freebie',
    benefit: 'Buy 6 units → Get 1 FREE',
    scope: 'on Lifebuoy Handwash',
    automatic: true,
    needs: [{ productId: 'p32', qty: 6 }],
    reward: { productId: 'p32', qty: 1 },
    id: 'lifebuoy-handwash-freebie',
    code: 'LIFEBUOY6',
    expires: '30 Nov 2026',
  },
  {
    label: 'Case Bonus',
    benefit: 'Buy 20 units → Get 2 FREE',
    scope: 'on Tata Tea Gold',
    automatic: true,
    needs: [{ productId: 'p33', qty: 20 }],
    reward: { productId: 'p33', qty: 2 },
    id: 'tata-tea-gold-bonus',
    code: 'TEAGOLD20',
    expires: '10 Nov 2026',
  },
  {
    // A flat, single-tier % off — the plain "Discount" pattern, distinct from
    // Slab's quantity tiers and Combo's two-SKU requirement.
    label: 'Discount',
    benefit: '10% Off',
    scope: 'on 5+ units of Himalaya Neem Face Wash',
    automatic: true,
    needs: [{ productId: 'p20', qty: 5 }],
    discountPct: 10,
    id: 'himalaya-facewash-discount',
    code: 'NEEM10',
    expires: '31 Dec 2026',
  },
  {
    label: 'Combo',
    benefit: '10% Off',
    scope: 'on Vim Dishwash Bar when bought together with Surf Excel Easy Wash Detergent',
    automatic: true,
    needs: [
      { productId: 'p34', qty: 1 },
      { productId: 'p35', qty: 1 },
    ],
    discountPct: 10, // applied to Vim Dishwash Bar's line
    id: 'vim-surf-combo',
    code: 'VIMSURF10',
    expires: '25 Oct 2026',
  },
  {
    label: 'Slab',
    benefit: '6% Off',
    scope: 'on 5+ cases of Sunfeast Marie Gold Biscuits',
    automatic: true,
    needs: [{ productId: 'p36', qty: 60 }], // 5 cases × 12 pcs/case
    discountPct: 6,
    id: 'sunfeast-marie-gold-slab',
    code: 'MARIE6',
    expires: '30 Nov 2026',
  },
  {
    label: 'Bogo',
    benefit: 'Buy 1 Case Get 1 Free',
    scope: 'on Colgate Strong Teeth Toothpaste',
    automatic: true,
    needs: [{ productId: 'p37', qty: 12 }],
    reward: { productId: 'p37', qty: 12 },
    id: 'colgate-toothpaste-bogo',
    code: 'COLGATEBOGO',
    expires: '15 Dec 2026',
  },
  {
    label: 'Slab',
    benefit: '7% Off',
    scope: 'on 5+ cases of Colgate Strong Teeth Toothpaste',
    automatic: true,
    needs: [{ productId: 'p37', qty: 60 }], // 5 cases × 12 pcs/case
    discountPct: 7, // stacks with the Bogo above on the same SKU
    id: 'colgate-toothpaste-slab',
    code: 'COLGATE7',
    expires: '31 Oct 2026',
  },
  {
    label: 'Freebie',
    benefit: 'Buy 8 units → Get 1 FREE',
    scope: 'on Tata Sampann Toor Dal',
    automatic: true,
    needs: [{ productId: 'p38', qty: 8 }],
    reward: { productId: 'p38', qty: 1 },
    id: 'tata-sampann-toor-dal-freebie',
    code: 'TOORDAL8',
    expires: '20 Nov 2026',
  },
  {
    label: 'Case Bonus',
    benefit: 'Buy 40 units → Get 4 FREE',
    scope: 'on Tata Sampann Toor Dal',
    automatic: true,
    needs: [{ productId: 'p38', qty: 40 }],
    reward: { productId: 'p38', qty: 4 },
    // stacks with the Freebie above on the same SKU
    id: 'tata-sampann-toor-dal-bonus',
    code: 'TOORDAL40',
    expires: '31 Dec 2026',
  },
  {
    label: 'Bogo',
    benefit: 'Buy 1 Case Get 1 Free',
    scope: 'on Tata Salt Iodised',
    automatic: true,
    needs: [{ productId: 'p39', qty: 20 }],
    reward: { productId: 'p39', qty: 20 },
    id: 'tata-salt-iodised-bogo',
    code: 'SALTBOGO',
    expires: '15 Nov 2026',
  },
  {
    label: 'Freebie',
    benefit: 'Buy 6 units → Get 1 FREE',
    scope: 'on Tata Salt Iodised',
    automatic: true,
    needs: [{ productId: 'p39', qty: 6 }],
    reward: { productId: 'p39', qty: 1 },
    id: 'tata-salt-iodised-freebie',
    code: 'SALT6FREE',
    expires: '30 Nov 2026',
  },
  {
    label: 'Case Bonus',
    benefit: 'Buy 50 units → Get 5 FREE',
    scope: 'on Tata Salt Iodised',
    automatic: true,
    needs: [{ productId: 'p39', qty: 50 }],
    reward: { productId: 'p39', qty: 5 },
    id: 'tata-salt-iodised-bonus',
    code: 'SALT50',
    expires: '31 Dec 2026',
  },
  {
    // Parle-G has a scheme but no quantity price slab (see products.ts) — the
    // SKU that exercises the Discounts sheet with only one section in it.
    label: 'Freebie',
    benefit: 'Buy 24 units → Get 2 FREE',
    scope: 'on Parle-G Gold Biscuits',
    automatic: true,
    needs: [{ productId: 'p40', qty: 24 }],
    reward: { productId: 'p40', qty: 2 },
    id: 'parle-g-gold-freebie',
    code: 'PARLEG24',
    expires: '25 Nov 2026',
  },
  {
    label: 'Slab',
    benefit: '12% Off',
    scope: 'on 5+ cases of Tata Salt Iodised',
    automatic: true,
    needs: [{ productId: 'p39', qty: 100 }], // 5 cases × 20 pcs/case
    discountPct: 12,
    id: 'tata-salt-iodised-slab',
    code: 'SALT12OFF',
    expires: '31 Oct 2026',
  },
  {
    label: 'Combo',
    benefit: '10% Off',
    scope: 'on Tata Salt Iodised when bought together with Tata Salt Black Salt Sachet',
    automatic: true,
    needs: [
      { productId: 'p39', qty: 1 },
      { productId: 'p22', qty: 1 },
    ],
    discountPct: 10,
    id: 'tata-salt-iodised-combo',
    code: 'SALTCOMBO10',
    expires: '15 Dec 2026',
  },
  /* Wholesale SKUs run schemes too. Same shape as the distributor ones —
     the cart checks both catalogues, so these fire off wholesale quantities
     and pay out in real ₹0 lines like any other. */
  {
    label: 'Bogo',
    benefit: 'Buy 1 Case Get 1 Free',
    scope: 'on Refined Sunflower Oil',
    automatic: true,
    needs: [{ productId: 'wp1', qty: 16 }],
    reward: { productId: 'wp1', qty: 16 },
    id: 'ws-oil-bogo',
    code: 'WSOILBOGO',
    expires: '30 Nov 2026',
  },
  {
    label: 'Case Bonus',
    benefit: 'Buy 40 units → Get 4 FREE',
    scope: 'on Fortune Besan',
    automatic: true,
    needs: [{ productId: 'wp2', qty: 40 }],
    reward: { productId: 'wp2', qty: 4 },
    id: 'ws-besan-bonus',
    code: 'WSBESAN40',
    expires: '15 Dec 2026',
  },
  {
    label: 'Slab',
    benefit: '8% Off',
    scope: 'on 2+ cases of Red Label Tea',
    automatic: true,
    needs: [{ productId: 'wp3', qty: 80 }],
    discountPct: 8,
    id: 'ws-tea-slab',
    code: 'WSTEA8',
    expires: '31 Oct 2026',
  },
  {
    label: 'Freebie',
    benefit: 'Buy 24 units → Get 2 FREE',
    scope: 'on Maggi 2-Minute Noodles',
    automatic: true,
    needs: [{ productId: 'wp4', qty: 24 }],
    reward: { productId: 'wp4', qty: 2 },
    id: 'ws-maggi-freebie',
    code: 'WSMAGGI24',
    expires: '30 Nov 2026',
  },
];

/** Every scheme label live on this SKU (Bogo, Freebie, Case Bonus, Slab,
 * Combo — in the order data/coupons.ts defines them), deduped. Empty when
 * the SKU carries no offer. Product labels and scheme filters use the same
 * `OFFERS` fixtures as cart pricing. */
export function offerLabelsFor(productId: string): string[] {
  const labels = OFFERS.filter((o) => o.needs?.some((n) => n.productId === productId)).map(
    (o) => o.label ?? o.benefit
  );
  return Array.from(new Set(labels));
}

/** " — BOGO + SLAB" style suffix for a product's display name, so a SKU
 * carrying an offer is identifiable at a glance in any list — the Product
 * List, Reorder, search results — without opening it. Empty string when the
 * SKU has no offer (see offerLabelsFor). */
export function offerNameSuffix(productId: string): string {
  const labels = offerLabelsFor(productId);
  return labels.length ? ` — ${labels.map((l) => l.toUpperCase()).join(' + ')}` : '';
}
