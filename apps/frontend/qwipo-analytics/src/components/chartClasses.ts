// Domain → design-system chart hue, spelled out so the Tailwind scanner sees
// every class. The palette itself lives in @mockups/design-tokens; only this
// mapping is the app's opinion.
import type { DimensionKey, Severity } from '../data/overview';

export const dimBg: Record<DimensionKey, string> = {
  distributor: 'bg-chart-blue', city: 'bg-chart-cyan', company: 'bg-chart-indigo',
  category: 'bg-chart-violet', brand: 'bg-chart-sky', sku: 'bg-chart-teal',
};
export const dimBorder: Record<DimensionKey, string> = {
  distributor: 'border-chart-blue', city: 'border-chart-cyan', company: 'border-chart-indigo',
  category: 'border-chart-violet', brand: 'border-chart-sky', sku: 'border-chart-teal',
};
export const ageBg = ['bg-chart-age-0', 'bg-chart-age-1', 'bg-chart-age-2', 'bg-chart-age-3', 'bg-error'];
export const severityText: Record<Severity, string> = { error: 'text-error', warning: 'text-warning', info: 'text-info' };

/** One colour per order stage; terminal stages use the semantic status tokens. */
export const stageBg: Record<string, string> = {
  created: 'bg-chart-gray', accepted: 'bg-chart-blue', packed: 'bg-chart-indigo',
  shipped: 'bg-chart-cyan', delivered: 'bg-success', cancelled: 'bg-error', returned: 'bg-warning',
};

/** Soft fill for open/pending bars. */
export const openBg = 'bg-chart-blue-soft';

/** Horizontal bar fills by tone (drilled-Sales distributor list, cancellation reasons). */
export const toneBg: Record<'error' | 'warning' | 'dim', string> = {
  error: 'bg-error', warning: 'bg-warning', dim: 'bg-border-strong',
};
