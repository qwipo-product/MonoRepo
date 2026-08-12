/* Display helper: rewrite any YYYY-MM-DD in a string to DD-MM-YYYY.
   Data stays ISO (canonical) so <input type="date"> and date-keyed lookups keep
   working; only the rendered text flips to DD-MM-YYYY. Also converts dates
   embedded in a longer label (e.g. "Last order 2026-07-28" → "Last order 28-07-2026"). */
export function formatDate(s: string): string {
  return s.replace(/(\d{4})-(\d{2})-(\d{2})/g, '$3-$2-$1');
}
