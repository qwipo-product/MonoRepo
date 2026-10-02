/* Display helpers. Data stays ISO; only the rendered text changes. */

/** "2 Oct, 9:12 am" */
export const formatPlacedAt = (iso: string) =>
  new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });

/** "Fri, 3 Oct" */
export const formatDay = (isoDate: string) =>
  new Date(`${isoDate}T00:00:00`).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
