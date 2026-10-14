// Customers & Onboarding screen data.

/** The 148 gone-quiet outlets, by city. */
export const quietByCity = [
  { label: 'Hyderabad', n: 61, value: '₹2.7L', tone: 'error' as const },
  { label: 'Secunderabad', n: 28, value: '₹1.2L', tone: 'error' as const },
  { label: 'Warangal', n: 24, value: '₹0.9L', tone: 'warning' as const },
  { label: 'Nizamabad', n: 15, value: '₹0.6L', tone: 'warning' as const },
  { label: 'Karimnagar', n: 12, value: '₹0.5L', tone: 'dim' as const },
  { label: 'Sangareddy', n: 8, value: '₹0.3L', tone: 'dim' as const },
];

/** How long the 148 have been quiet. */
export const quietAges = [
  { label: '14–20 d', n: 92 },
  { label: '21–30 d', n: 38 },
  { label: '30+ d', n: 18 },
];

/** Order-frequency bands across the 480 active outlets. */
export const frequencyBands = [
  { label: '1 order', n: 184 },
  { label: '2–3 orders', n: 158 },
  { label: '4+ orders', n: 138 },
];

/** Weekly onboarding cohorts with how many ordered. */
export const cohorts = [
  { label: '1–7', n: 24, ordered: 15 },
  { label: '8–14', n: 19, ordered: 11 },
  { label: '15–21', n: 15, ordered: 6 },
  { label: '22', n: 4, ordered: 1 },
];
