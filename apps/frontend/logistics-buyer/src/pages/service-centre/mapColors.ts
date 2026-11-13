// Colours for Cross Dock Stores on maps and charts (fixed order, by the store's position in the list).
import type { XdOverview } from '../../types/crossDock';

const CDS_COLORS = ['#2563eb', '#059669', '#d97706', '#7c3aed', '#db2777'];
export const DIRECT_COLOR = '#9ca3af';

export function cdsColor(overview: XdOverview | null | undefined, cdsId: string | null | undefined): string {
  if (!overview || !cdsId) return DIRECT_COLOR;
  const i = overview.cdss.findIndex((c) => c.id === cdsId);
  return i < 0 ? DIRECT_COLOR : CDS_COLORS[i % CDS_COLORS.length];
}
