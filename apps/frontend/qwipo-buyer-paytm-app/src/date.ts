/* Display helper: rewrite any YYYY-MM-DD in a string to DD-MM-YYYY.
   Data stays ISO (canonical) so <input type="date"> and date-keyed lookups keep
   working; only the rendered text flips to DD-MM-YYYY. Also converts dates
   embedded in a longer label (e.g. "Last order 2026-07-28" → "Last order 28-07-2026"). */
export function formatDate(s: string): string {
  return s.replace(/(\d{4})-(\d{2})-(\d{2})/g, '$3-$2-$1');
}

/* Where an order *was placed* is written the way a person says it — "16 Jun
   2026". A number like 16-06-2026 is something you parse; a month you can
   read is something you recognise. The rest of the app keeps `formatDate`. */
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** "2026-06-16" → "16 Jun 2026". Anything else is handed back as it came. */
export function formatDay(s: string): string {
  if (!ISO_DATE.test(s)) return formatDate(s);
  const d = new Date(`${s}T00:00:00`);
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

/* An expected delivery is a date and nothing finer. Nobody commits to an
   hour and the app is never told one, so the card no longer says "Tomorrow
   11 AM" — a promise it can't keep — and no longer labels a date as the beat
   day, which was a wholesaler's word for its own routine rather than
   anything the buyer asked about.

   Every order says it the same way, DD-MM-YYYY, whether the delivery is
   expected, on its way or already done: one row the eye can compare straight
   down a list of orders. This is the one place that decides it. */
export function formatEta(s: string): string {
  return formatDate(s);
}
