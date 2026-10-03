/* Display helpers. Data stays ISO; only the rendered text changes. Dates
   follow the app's language — App sets it each render, before any screen
   formats a date, so a language switch re-renders them in that language. */

let locale = 'en-IN';
const LOCALES: Record<string, string> = { en: 'en-IN', te: 'te-IN', hi: 'hi-IN', ta: 'ta-IN' };
export const setDateLanguage = (lang: string) => {
  locale = LOCALES[lang] ?? 'en-IN';
};

/** "2 Oct, 9:12 am" */
export const formatPlacedAt = (iso: string) =>
  new Date(iso).toLocaleString(locale, { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });

/** "Fri, 3 Oct" */
export const formatDay = (isoDate: string) =>
  new Date(`${isoDate}T00:00:00`).toLocaleDateString(locale, { weekday: 'short', day: 'numeric', month: 'short' });

/** "15 Sep" */
export const formatShortDate = (isoDate: string) =>
  new Date(`${isoDate}T00:00:00`).toLocaleDateString(locale, { day: 'numeric', month: 'short' });

/** "14 Mar 2026" */
export const formatDate = (isoDate: string) =>
  new Date(`${isoDate}T00:00:00`).toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' });
