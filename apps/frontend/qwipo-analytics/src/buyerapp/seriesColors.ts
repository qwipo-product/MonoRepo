/** Series roles are fixed across the app: blue primary, green good, amber warn, red bad.
 *  Hues come from the design-token CSS variables, never a hex. */
export const SERIES = {
  primary: 'var(--color-chart-blue)',
  good: 'var(--color-success)',
  warn: 'var(--color-warning)',
  bad: 'var(--color-error)',
  accent: 'var(--color-chart-indigo)',
  cyan: 'var(--color-chart-cyan)',
  fuchsia: 'var(--color-chart-violet)',
} as const;
