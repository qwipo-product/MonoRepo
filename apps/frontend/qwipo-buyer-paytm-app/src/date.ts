/* Dates, written one way everywhere: DD-MM-YYYY.

   The stored data stays ISO (canonical) so <input type="date"> and date-keyed
   lookups keep working; only the rendered text flips. A date sitting inside a
   longer label converts too — "Last order 2026-07-28" → "Last order
   28-07-2026".

   The order screens used to be the exception. They wrote the month out, "16
   Jun 2026", and folded an hour or a label into the delivery line: "Tomorrow
   11 AM", "18 Jun 2026 (Beat Day)", "Delivered 30-05-2026". Four shapes in
   one list, two of them promising a time no distributor commits to and the
   app is never told. One format now, placed and expected alike, so a buyer
   can run an eye straight down a column of orders and compare them. */
export function formatDate(s: string): string {
  return s.replace(/(\d{4})-(\d{2})-(\d{2})/g, '$3-$2-$1');
}
