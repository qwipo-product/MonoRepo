import { PRODUCTS, type Source } from './products';
import { WHOLESALER_PRODUCTS, cheapestVendorId } from './wholesaler';
import { REORDER_ITEMS, WHOLESALE_REORDER_ITEMS } from './reorder';
import { BRANDS, DIST_CATEGORIES, WHOLESALER_CATEGORIES } from './home';

/* Global search.

   One index over both catalogues, because a retailer searching "toor dal"
   means the dal, not the channel it happens to be bought through. Each entry
   is a CARD — one thing you can buy from one kind of seller — and two cards
   that are the same SKU carry the same `sku` key so the results list can show
   them as a pair, distributor first. */

export interface SearchCard {
  /** Product id — `p…` distributor, `wp…` wholesale. Opens its own sheet. */
  id: string;
  /** Shared key: the same SKU bought two ways has one of these. */
  sku: string;
  name: string;
  brand: string;
  category: string;
  source: Source;
  image: string;
  price: number;
  mrp?: number;
  seller: string;
  previouslyOrdered: boolean;
}

/* ── words ──────────────────────────────────────────────────────────────── */

/** Lowercase, punctuation to spaces, collapsed — "1 L Pouch" → "1 l pouch". */
export const normalise = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim().replace(/\s+/g, ' ');

const words = (s: string) => (normalise(s) ? normalise(s).split(' ') : []);

/* A query word matches a catalogue word by PREFIX, never mid-word: "dal"
   finds Dal and Dals and leaves Mysore Sandal alone, which matching anywhere
   in the string does not. Two-letter words have to match exactly, so "ol"
   doesn't drag in Olive, and single letters match nothing at all. */
const wordMatches = (q: string, w: string) =>
  q.length <= 1 ? false : q.length === 2 ? w === q : w.startsWith(q);

/* Hinglish and vernacular are out of scope for this phase. They're listed
   rather than inferred, because some of them are one edit from a real word —
   "mung" from "moong" — and the spell-corrector would otherwise quietly turn
   an unsupported query into a supported one. */
const NOT_SUPPORTED = new Set([
  'tel', 'chawal', 'namak', 'chai', 'sabun', 'mirchi', 'achar', 'mung', 'baal',
  'atta', 'cheeni', 'haldi', 'dhaniya', 'jeera', 'sarson', 'til', 'gud', 'doodh',
  'nariyal', 'kapda', 'sabji', 'masala', 'pani', 'anda', 'makhan', 'paneer',
]);

/* ── the index ──────────────────────────────────────────────────────────── */

const BRAND_NAMES = Array.from(
  new Set([
    ...BRANDS.map((b) => b.name),
    'Fortune', 'Gold Winner', 'Sunpure', 'Dhara', 'Saffola', 'Gemini',
    'Value Choice', 'Rajdhani', 'Natureland', 'Clinic Plus', 'Head & Shoulders',
    'Chik', 'Tata Sampann', 'Sri Lalitha', 'Sunfeast', 'Surf Excel', 'Colgate',
    'Close Up', 'Dabur', 'Everest', 'Lifebuoy', 'Vim', 'Maggi', 'Soulfull',
    'Parle-G', 'Priya Gold', 'Double Horse', 'Cow',
  ])
  // Longest first, so "Tata Sampann" wins over "Tata".
).sort((a, b) => b.length - a.length);

/** The brand a product name starts with, or its first word as a fallback. */
export const brandOf = (name: string) =>
  BRAND_NAMES.find((b) => normalise(name).startsWith(normalise(b) + ' ')) ??
  name.split(' ')[0];

/** Everything before the pack suffix — "Freedom Groundnut Oil - 1 L …". */
const skuKey = (name: string) => normalise(name.split(' - ')[0]);

const ORDERED_IDS = new Set([
  ...REORDER_ITEMS.map((r) => r.product.id),
  ...WHOLESALE_REORDER_ITEMS.map((r) => r.product.id),
]);

const distributorCards: SearchCard[] = PRODUCTS.map((p) => ({
  id: p.id,
  sku: skuKey(p.name),
  name: p.name,
  brand: brandOf(p.name),
  category: p.category,
  source: p.source,
  image: p.image,
  price: p.price,
  mrp: p.mrp,
  seller: p.seller,
  previouslyOrdered: ORDERED_IDS.has(p.id),
}));

const wholesaleCards: SearchCard[] = WHOLESALER_PRODUCTS.map((p) => {
  const v = p.vendors.find((x) => x.id === cheapestVendorId(p)) ?? p.vendors[0];
  /* The wholesale catalogue lists a SKU without its brand where the
     distributor one leads with it — "Refined Sunflower Oil" against "Freedom
     Refined Sunflower Oil". Put the brand back before keying, or the same oil
     reads as two different things and never pairs up. */
  const full = normalise(p.name).startsWith(normalise(p.brand || ''))
    ? p.name
    : `${p.brand} ${p.name}`;
  return {
    id: p.id,
    sku: skuKey(full),
    name: p.name,
    // The wholesale catalogue states its brand; only guess when it doesn't.
    brand: p.brand || brandOf(p.name),
    category: p.category,
    source: 'wholesaler' as const,
    image: p.image,
    price: v.price,
    mrp: v.mrp,
    seller: v.name,
    previouslyOrdered: ORDERED_IDS.has(p.id),
  };
});

export const SEARCH_CARDS: SearchCard[] = [...distributorCards, ...wholesaleCards];

/** Words a card can be found by: its name, its brand and its category. */
const cardWords = new Map<SearchCard, string[]>(
  SEARCH_CARDS.map((c) => [c, words(`${c.name} ${c.brand} ${c.category}`)])
);

export const CATEGORY_NAMES = Array.from(
  new Set([...DIST_CATEGORIES, ...WHOLESALER_CATEGORIES].map((c) => c.name))
);

/* ── spelling ───────────────────────────────────────────────────────────── */

/** Every word the catalogue knows, with how often it appears. */
const VOCAB = (() => {
  const counts = new Map<string, number>();
  const add = (s: string) => words(s).forEach((w) => {
    if (w.length > 2 && !/^\d+$/.test(w)) counts.set(w, (counts.get(w) ?? 0) + 1);
  });
  SEARCH_CARDS.forEach((c) => add(`${c.name} ${c.brand} ${c.category}`));
  CATEGORY_NAMES.forEach(add);
  return counts;
})();

/** Edit distance with transposition, so "frotune" is one step from "fortune". */
function editDistance(a: string, b: string, cap: number): number {
  if (Math.abs(a.length - b.length) > cap) return cap + 1;
  const d: number[][] = Array.from({ length: a.length + 1 }, (_, i) =>
    Array.from({ length: b.length + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
      }
    }
  }
  return d[a.length][b.length];
}

/* How wrong a word is allowed to be. Short words get one edit and long words
   two: at two edits a five-letter word can become almost anything, which is
   how unsupported words quietly turn into supported ones. */
const budgetFor = (w: string) => (w.length < 7 ? 1 : 2);

/** The catalogue word this is probably meant to be, if any. */
function correctWord(w: string): string | undefined {
  /* Nothing under four letters gets corrected. "ol" is one edit from oil, two
     from old and oats — at that length a correction is a guess, and the buyer
     gets a whole catalogue back for a typo they can see. */
  if (w.length < 4 || VOCAB.has(w) || NOT_SUPPORTED.has(w)) return undefined;
  const cap = budgetFor(w);
  let best: string | undefined;
  let bestScore = Infinity;
  for (const [cand, freq] of VOCAB) {
    const d = editDistance(w, cand, cap);
    if (d > cap) continue;
    /* Nearer wins; between equals the shorter word, then the one the
       catalogue uses more often — "oill" is meant to be oil, not oils. */
    const score = d * 100000 + cand.length * 1000 - Math.min(freq, 999);
    if (score < bestScore) {
      bestScore = score;
      best = cand;
    }
  }
  return best;
}

/* A word that isn't in the catalogue but starts one — "shampo" for shampoo.
   The search finds it either way, since words match by prefix; this is only so
   the results can say which word they actually ran on. */
function completeWord(w: string): string | undefined {
  if (VOCAB.has(w) || w.length < 3) return undefined;
  let best: string | undefined;
  let bestScore = Infinity;
  for (const [cand, freq] of VOCAB) {
    if (!cand.startsWith(w) || cand === w) continue;
    const score = cand.length * 1000 - Math.min(freq, 999);
    if (score < bestScore) {
      bestScore = score;
      best = cand;
    }
  }
  return best;
}

/** Two catalogue words run together — "redlabel" → "red label". */
function splitWord(w: string): string | undefined {
  if (w.length < 6) return undefined;
  for (let i = 3; i <= w.length - 3; i++) {
    const a = w.slice(0, i);
    const b = w.slice(i);
    if (VOCAB.has(a) && VOCAB.has(b)) return `${a} ${b}`;
  }
  return undefined;
}

/* ── searching ──────────────────────────────────────────────────────────── */

const matches = (card: SearchCard, qs: string[]) => {
  const ws = cardWords.get(card) ?? [];
  return qs.every((q) => ws.some((w) => wordMatches(q, w)));
};

function score(card: SearchCard, qs: string[]) {
  const name = normalise(card.name);
  const phrase = qs.join(' ');
  let s = 0;
  if (name.startsWith(phrase)) s += 100;
  if (normalise(card.brand) === phrase) s += 60;
  if (name.includes(phrase)) s += 30;
  // A word in the product's own name beats one that only matches its category.
  const nameWords = words(card.name);
  s += qs.filter((q) => nameWords.some((w) => wordMatches(q, w))).length * 10;
  if (card.previouslyOrdered) s += 5;
  return s;
}

export interface SearchResult {
  /** What was actually searched for, after any correction. */
  query: string;
  /** Set when the query was corrected — the words the buyer typed. */
  correctedFrom?: string;
  /** Offered, never applied: "did you mean …". */
  suggestion?: string;
  cards: SearchCard[];
  brands: string[];
  previouslyOrdered: SearchCard[];
  more: SearchCard[];
  /** Distinct SKUs behind the cards — a pair counts once. */
  skuCount: number;
}

const EMPTY = (query: string, suggestion?: string): SearchResult => ({
  query,
  suggestion,
  cards: [],
  brands: [],
  previouslyOrdered: [],
  more: [],
  skuCount: 0,
});

function run(qs: string[], scope?: string) {
  const pool = scope ? SEARCH_CARDS.filter((c) => c.category === scope) : SEARCH_CARDS;
  return pool
    .filter((c) => matches(c, qs))
    .sort((a, b) => score(b, qs) - score(a, qs) || a.name.localeCompare(b.name));
}

/* Pair the two channels up: a distributor card, then the wholesale card for
   the same SKU directly beneath it, so the buyer sees one thing and two ways
   to buy it rather than the same name twice, pages apart. */
function pairUp(cards: SearchCard[]) {
  const seen = new Set<string>();
  const out: SearchCard[] = [];
  for (const c of cards) {
    if (seen.has(c.sku)) continue;
    seen.add(c.sku);
    const pair = cards.filter((x) => x.sku === c.sku);
    const dist = pair.filter((x) => x.source === 'distributor');
    const whole = pair.filter((x) => x.source === 'wholesaler');
    out.push(...dist, ...whole);
  }
  return out;
}

export function search(raw: string, scope?: string, correct = true): SearchResult {
  const typed = normalise(raw);
  const qs = words(typed).filter((w) => w.length > 1);
  if (qs.length === 0) return EMPTY(raw);
  if (qs.some((w) => NOT_SUPPORTED.has(w))) return EMPTY(raw);

  let used = qs;
  let correctedFrom: string | undefined;

  if (correct && run(qs, scope).length === 0) {
    const fixed = qs.map((w) => correctWord(w) ?? w);
    if (fixed.join(' ') !== qs.join(' ') && run(fixed, scope).length > 0) {
      used = fixed;
      correctedFrom = raw.trim();
    }
  }

  if (!correctedFrom && correct) {
    const completed = used.map((w) => completeWord(w) ?? w);
    if (completed.join(' ') !== used.join(' ') && run(completed, scope).length > 0) {
      used = completed;
      correctedFrom = raw.trim();
    }
  }

  const hits = run(used, scope);
  if (hits.length === 0) {
    // Nothing to show — but "redlabel" is one space away from something.
    const split = qs.map(splitWord).find(Boolean);
    return EMPTY(raw, split && run(words(split), scope).length > 0 ? split : undefined);
  }

  const ordered = pairUp(hits);
  return { query: used.join(' '), correctedFrom, ...split(ordered) };
}

/* Previously Ordered is decided per SKU, not per card: if the buyer has had
   this oil before, both ways of buying it belong in that section, so the
   distributor card and its wholesale card stay together. */
function split(ordered: SearchCard[]) {
  const boughtSkus = new Set(ordered.filter((c) => c.previouslyOrdered).map((c) => c.sku));
  return {
    cards: ordered,
    brands: Array.from(new Set(ordered.map((c) => c.brand))),
    previouslyOrdered: ordered.filter((c) => boughtSkus.has(c.sku)),
    more: ordered.filter((c) => !boughtSkus.has(c.sku)),
    skuCount: new Set(ordered.map((c) => c.sku)).size,
  };
}

/** Everything in one category — what a category suggestion opens onto. */
export function browse(scope: string): SearchResult {
  const cards = pairUp(
    SEARCH_CARDS.filter((c) => c.category === scope).sort((a, b) => a.name.localeCompare(b.name))
  );
  return { query: '', ...split(cards) };
}

/* ── suggestions ────────────────────────────────────────────────────────── */

/* Wayfinding only. Products aren't suggested any more — the matching SKUs are
   listed underneath as the cards themselves, so a buyer adds from the
   suggestions view rather than searching first and adding after. */
export type SuggestionKind = 'recent' | 'term' | 'category' | 'brand';

export interface Suggestion {
  kind: SuggestionKind;
  label: string;
}

/** Up to nine, across the five kinds, for a query of two characters or more. */
export function suggest(raw: string, recent: string[], terms: string[]): Suggestion[] {
  const q = normalise(raw);
  if (q.length < 2) return [];
  const hit = (s: string) => words(s).some((w) => w.startsWith(q)) || normalise(s).startsWith(q);

  const take = (kind: SuggestionKind, items: string[], n: number): Suggestion[] =>
    Array.from(new Set(items.filter(hit))).slice(0, n).map((label) => ({ kind, label }));

  const out = [
    ...take('recent', recent, 2),
    ...take('term', terms, 2),
    ...take('category', CATEGORY_NAMES, 3),
    ...take('brand', BRAND_NAMES, 3),
  ];
  // De-dupe across kinds, then cap.
  const seen = new Set<string>();
  return out.filter((s) => !seen.has(s.label) && seen.add(s.label)).slice(0, 9);
}
