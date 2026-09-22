/* Real scheme data from Tata Consumer Products (TCPL), sourced from the
   "TCP-Schemes-Sample 2" export of TCP's own Salesforce scheme system (UAT
   org, generated 2026-09-15).

   TCP's export samples 3 of its 6 scheme types (the other 3 have zero
   records in their org):
     • Slab Schemes       — tiered % of invoice, by quantity or value.
       "The one Qwipo imports today" per the export's own README.
     • Flat with Multiples — buy N, get M free (FOC). Maps to our BuyXGetY.
     • Flat Scheme        — a single order-value threshold. The export's
       README flags this type as "dropped in transform: no tiers, needs a
       scheme shape we have not built" — and true to that, the sampled row
       doesn't carry a payout % at all (see TcplFlatScheme.note).

   Every scheme below is a real, live TCP scheme with its real SKUs (join:
   Scheme Products.tcpl_Scheme__c = Schemes.Id) — except where isSample is
   set, which are TCP's own UAT test rows, not an actual campaign. Quantity
   thresholds unreachable in a normal retailer cart (TCP's live minimums are
   set for large distributors) are scaled down for this demo — each scheme
   says so, and gives the real TCP number alongside it. */

export interface TcplBand {
  lower: number;
  /** Open-ended (top band) when omitted. */
  upper?: number;
  percent: number;
}

interface TcplBase {
  id: string;
  /** TCP's own scheme name (tcpl_Scheme_Description__c). */
  name: string;
  /** TCP scheme id (Schemes.Id) — a reference, like an SKU code. */
  refId: string;
  /** Product ids (see products.ts) this scheme's real SKUs map to. */
  productIds: string[];
  /** TCP UAT sample/test data, not a real live campaign. */
  isSample?: boolean;
}

export interface TcplSlabScheme extends TcplBase {
  kind: 'slab';
  basis: 'qty' | 'value';
  /** Real TCP unit for a qty-basis scheme — their trade "Pack" = one case. */
  unit?: 'case';
  bands: TcplBand[];
}

export interface TcplBogoScheme extends TcplBase {
  kind: 'bogo';
  buyQty: number;
  buyUnit: 'case' | 'pc';
  freeQty: number;
}

export interface TcplFlatScheme extends TcplBase {
  kind: 'flat';
  minOrderValue: number;
  /** The export's own sampled fields don't carry a payout % for this type — said plainly, not invented. */
  note: string;
}

export type TcplScheme = TcplSlabScheme | TcplBogoScheme | TcplFlatScheme;

export const TCPL_SCHEMES: TcplScheme[] = [
  {
    kind: 'slab',
    id: 'tcp-black-salt',
    name: 'Black Salt — Sub D, Rural D, RPD',
    refId: 'a0jTE00000ACpJUYA1',
    basis: 'qty',
    unit: 'case',
    bands: [{ lower: 5, percent: 4.5 }],
    productIds: ['p22', 'p23'],
  },
  {
    kind: 'slab',
    id: 'tcp-masala-oats',
    name: 'Soulfull Masala Oats+',
    refId: 'a0jTE00000ACpKMYA1',
    basis: 'value',
    bands: [
      { lower: 500, upper: 1499, percent: 5 },
      { lower: 1500, upper: 2999, percent: 10 },
      { lower: 3000, percent: 15 },
    ],
    productIds: ['p24', 'p25'],
  },
  {
    kind: 'slab',
    id: 'tcp-1868-giftbox',
    name: 'TT 1868 Gift Box — Bulk Code',
    refId: 'a0jFT000007QAkTYAW',
    basis: 'qty',
    unit: 'case',
    bands: [
      { lower: 1, upper: 10, percent: 5 },
      { lower: 11, upper: 20, percent: 10 },
    ],
    productIds: ['p26', 'p27'],
    isSample: true,
  },
  {
    // TCP's real record: "Vol.Typ:Pack, To:1.00, FOC Qty:1" — buy 1 case,
    // get 1 case free. 4 flavours exist as separate scheme records in TCP's
    // system; Strawberry shown here (Choco is its own scheme below).
    kind: 'bogo',
    id: 'tcp-wafer-bogo-strawberry',
    name: 'Wafer Bogo Strawberry',
    refId: 'a0jTE00000ACwP3YAL',
    buyQty: 1,
    buyUnit: 'case',
    freeQty: 1,
    productIds: ['p28'],
  },
  {
    kind: 'bogo',
    id: 'tcp-wafer-bogo-choco',
    name: 'Wafer Bogo Choco',
    refId: 'a0jTE00000ACwbyYAD',
    buyQty: 1,
    buyUnit: 'case',
    freeQty: 1,
    productIds: ['p29'],
  },
  {
    // TCP's real record for this type has a min-order threshold but no
    // payout % in any of the sampled fields — matches the export's own
    // README note that Flat Scheme "needs a scheme shape we have not built."
    kind: 'flat',
    id: 'tcp-retailer-qps',
    name: 'Retailer App Scheme Rs50 QPS',
    refId: 'a0jTE00000AJOiPYAX',
    minOrderValue: 50,
    note: "This scheme's payout % isn't present in TCP's export — shown here as the minimum order it needs, not a discount figure.",
    productIds: ['p30'],
  },
];

export const tcplSchemeFor = (productId: string): TcplScheme | undefined =>
  TCPL_SCHEMES.find((s) => s.productIds.includes(productId));

const inr = (n: number) => `₹${n.toLocaleString('en-IN')}`;
const plural = (n: number, unit: string) => `${unit}${n === 1 ? '' : 's'}`;

/** "5+ cases" / "1 – 10 cases" / "₹500 – ₹1,499" / "₹3,000+". */
function tcplBandLabel(s: TcplSlabScheme, b: TcplBand): string {
  const f = (n: number) => (s.basis === 'value' ? inr(n) : String(n));
  const unit = s.basis === 'qty' ? ` ${s.unit === 'case' ? (b.lower === 1 && b.upper === 1 ? 'case' : 'cases') : ''}` : '';
  return b.upper == null ? `${f(b.lower)}+${unit}` : `${f(b.lower)} – ${f(b.upper)}${unit}`;
}

/** The same {title, sub, save, detail} shape the generic Other Offers cards
 * use — a TCP scheme is just real SKU data poured into that one format, not
 * a different card. */
export interface TcplOfferText {
  title: string;
  sub: string;
  save: string;
  detail: string;
}

export function tcplOfferText(scheme: TcplScheme, productName: string): TcplOfferText {
  const sample = scheme.isSample ? ' (TCP sample scheme)' : '';

  if (scheme.kind === 'bogo') {
    const buy = plural(scheme.buyQty, scheme.buyUnit === 'case' ? 'case' : 'pc');
    const free = plural(scheme.freeQty, scheme.buyUnit === 'case' ? 'case' : 'pc');
    return {
      title: `Buy ${scheme.buyQty} ${buy} Get ${scheme.freeQty} Free`,
      sub: `On purchases of ${productName}${sample}`,
      save: `Get ${scheme.freeQty} ${free} free`,
      detail: `Buy ${scheme.buyQty} ${buy} and ${scheme.freeQty} ${free} is added free at checkout. Applied automatically once you qualify.`,
    };
  }

  if (scheme.kind === 'flat') {
    return {
      title: `Min. Order ${inr(scheme.minOrderValue)}`,
      sub: `Unlocks this scheme on ${productName}${sample}`,
      save: 'Qualifies for payout',
      detail: `Minimum order ${inr(scheme.minOrderValue)}. ${scheme.note}`,
    };
  }

  // slab
  const top = Math.max(...scheme.bands.map((b) => b.percent));
  const single = scheme.bands.length === 1;
  const by = scheme.basis === 'value' ? 'order value' : 'case quantity';
  return {
    title: single ? `${scheme.bands[0].percent}% Off` : `Up to ${top}% Off`,
    sub: single
      ? `On ${tcplBandLabel(scheme, scheme.bands[0])} of ${productName}${sample}`
      : `Slab discount by ${by} on ${productName}${sample}`,
    save: single ? `Save ${scheme.bands[0].percent}%` : `Save up to ${top}%`,
    detail:
      scheme.bands.map((b) => `${tcplBandLabel(scheme, b)} → ${b.percent}%`).join(', ') +
      '. Applied automatically once you qualify.',
  };
}
