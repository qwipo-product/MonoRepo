// Tailwind classes per chart token, spelled out so the scanner sees them.
import type { DimensionKey, Severity } from '../data/overview';

export const dimBg: Record<DimensionKey, string> = {
  distributor: 'bg-chart-distributor', city: 'bg-chart-city', company: 'bg-chart-company',
  category: 'bg-chart-category', brand: 'bg-chart-brand', sku: 'bg-chart-sku',
};
export const dimBorder: Record<DimensionKey, string> = {
  distributor: 'border-chart-distributor', city: 'border-chart-city', company: 'border-chart-company',
  category: 'border-chart-category', brand: 'border-chart-brand', sku: 'border-chart-sku',
};
export const ageBg = ['bg-age-0', 'bg-age-1', 'bg-age-2', 'bg-age-3', 'bg-error'];
export const severityText: Record<Severity, string> = { error: 'text-error', warning: 'text-warning', info: 'text-info' };

