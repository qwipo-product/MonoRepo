/* Display helper: rewrite any YYYY-MM-DD in a string to DD-MM-YYYY.
   Data stays ISO (canonical) so <input type="date"> and date-keyed lookups keep
   working; only the rendered text flips to DD-MM-YYYY. Also converts dates
   embedded in a longer label (e.g. "Last order 2026-07-28" → "Last order 28-07-2026"). */
export function formatDate(s: string): string {
  return s.replace(/(\d{4})-(\d{2})-(\d{2})/g, '$3-$2-$1');
}

/* The order screens write dates the way a person says them — "18 Jun 2026" —
   rather than as DD-MM-YYYY. A number like 18-06-2026 is something you parse;
   a month you can read is something you recognise, and these are the dates a
   retailer actually plans around. The rest of the app keeps `formatDate`. */
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** "2026-06-16" → "16 Jun 2026". Anything else is handed back as it came. */
export function formatDay(s: string): string {
  if (!ISO_DATE.test(s)) return formatDate(s);
  const d = new Date(`${s}T00:00:00`);
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

/** True when an eta is a plain date — an expectation, not a committed slot
 *  ("Tomorrow 11 AM") or something that already happened ("Delivered …"). */
export const isEtaWindow = (s: string): boolean => ISO_DATE.test(s);

/* An expected delivery is the beat day — the day the van is in the area —
   said plainly, with the window it implies as a remark underneath rather than
   folded into the date. A range read as though the goods might not turn up
   until the second day; they usually arrive on the first. */
export function formatEta(s: string): string {
  return isEtaWindow(s) ? `${formatDay(s)} (Beat Day)` : formatDate(s);
}
