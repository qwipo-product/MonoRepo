/* Rewrite any YYYY-MM-DD in a string to DD-MM-YYYY for display. */
export function formatDate(s: string): string {
  return s.replace(/(\d{4})-(\d{2})-(\d{2})/g, '$3-$2-$1');
}
