// Pure helpers ported from TripsComponent / TripDetailsComponent / TripRouteInfoPanelComponent
// (spec 04 §2.9, §4.13, §7.4, §9 and spec 05 §7).
import type { TripRow } from '../../api/services/logisticsOrders.service';

const p2 = (n: number) => String(n).padStart(2, '0');

/** Strict `YYYY-MM-DD H:MM AM|PM` → local Date (12 AM → 0, 12 PM → 12); anything else → null. */
export function parseAmPmTimestamp(s: string | null | undefined): Date | null {
  if (!s) return null;
  const m = String(s).match(/^(\d{4})-(\d{2})-(\d{2})\s+(\d{1,2}):(\d{2})\s+(AM|PM)$/i);
  if (!m) return null;
  let h = parseInt(m[4], 10);
  const ap = m[6].toUpperCase();
  if (ap === 'AM' && h === 12) h = 0;
  else if (ap === 'PM' && h !== 12) h += 12;
  return new Date(+m[1], +m[2] - 1, +m[3], h, +m[5], 0, 0);
}

/** Local Date → `YYYY-MM-DD hh:mm AM/PM` (zero-padded 12-hour clock). */
export function formatAmPm(d: Date): string {
  let h = d.getHours();
  const ap = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())} ${p2(h)}:${p2(d.getMinutes())} ${ap}`;
}

/** TIME COVERED: "HH:MM" when both times parse and end > start (hours may exceed 24), else "-". */
export function calculateTimeCovered(row: Pick<TripRow, 'startTime' | 'endTime'>): string {
  const start = parseAmPmTimestamp(row.startTime);
  const end = parseAmPmTimestamp(row.endTime);
  if (!start || !end || end.getTime() <= start.getTime()) return '-';
  const mins = Math.floor((end.getTime() - start.getTime()) / 60000);
  return `${p2(Math.floor(mins / 60))}:${p2(mins % 60)}`;
}

/** First "Order Picked Up" location with a time + estimatedCompletion minutes; any gap → "-". */
export function calculateEstimatedCompletion(row: { deliveryProgress?: { locations: { status: string; time: string }[] }; estimatedCompletion?: string }): string {
  try {
    const loc = row.deliveryProgress?.locations.find((l) => l.status === 'Order Picked Up' && l.time);
    if (!loc) return '-';
    const d = parseAmPmTimestamp(loc.time);
    const m = +(row.estimatedCompletion as string);
    if (!d || isNaN(m)) return '-';
    return formatAmPm(new Date(d.getTime() + m * 60000));
  } catch {
    return '-';
  }
}

const DONE = ['Order-delivered', 'RTO', 'RTO-Initiated', 'RTO-Disposed', 'RTO-Delivered'];

/** Order Summary card counts (spec 04 §2.9 B). */
export function getOrderSummary(row: TripRow) {
  const deliveries = (row.fulfillments || []).filter((f) => f.deliveryType === 'Delivery' && f.status !== 'Cancelled');
  const total = deliveries.length;
  const done = deliveries.filter((f) => DONE.includes(f.status)).length;
  return {
    total,
    pending: total - done,
    delivered: row.orderSummary?.delivered ?? done,
    partialDelivered: row.orderSummary?.partialDelivered ?? 0,
    returned: row.orderSummary?.returned ?? 0,
  };
}

/** Return Report menu item visibility. */
export function hasReturnProducts(row: TripRow): boolean {
  return (row.deliveryProgress?.locations || []).some((l) => l.status === 'RTO' || l.status === 'Returned' || l.status === 'Partial Delivered');
}

/** Stop pill / badge class: status without whitespace, lower-cased ("Order Delivered" → "orderdelivered"). */
export const statusClass = (status: string | null | undefined) => String(status ?? '').replace(/\s+/g, '').toLowerCase();

/** Intended trip badge class map (called with `+label` = NaN in the original → always "planned"). */
export function getTripStatusClass(n: number): string {
  switch (n) {
    case 1: return 'planned';
    case 2: return 'in-progress';
    case 3: return 'completed';
    case 4: return 'cancelled';
    default: return 'planned';
  }
}

/**
 * Angular DecimalPipe (en-US). `digits` = "minInt.minFrac-maxFrac". null / undefined / "" → null.
 * Non-numeric strings THROW, exactly like the original pipe.
 */
export function ngNumber(value: unknown, digits = '1.0-3'): string | null {
  if (value === null || value === undefined || value === '') return null;
  const n = typeof value === 'number' ? value : Number(value);
  if (typeof value === 'string' && (isNaN(n) || value.trim() === '')) throw new Error(`InvalidPipeArgument: '${value}' for pipe 'DecimalPipe'`);
  if (isNaN(n)) throw new Error(`InvalidPipeArgument: '${String(value)}' for pipe 'DecimalPipe'`);
  const m = digits.match(/^(\d+)\.(\d+)-(\d+)$/);
  const minFrac = m ? +m[2] : 0;
  const maxFrac = m ? +m[3] : 3;
  return n.toLocaleString('en-US', { minimumFractionDigits: minFrac, maximumFractionDigits: maxFrac });
}

/** Angular `currency:'INR':'symbol':'1.0-0'` in en-US → "₹48,211". */
export function inrSymbol0(value: unknown): string {
  const n = Number(value) || 0;
  return '₹' + n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

/** "Pickup: 4 Nov 2026" (new Date("YYYY-MM-DD") is UTC midnight → local day). */
export function pickupChipLabel(ymd: string): string {
  const d = new Date(ymd);
  return `Pickup: ${d.getDate()} ${d.toLocaleString('en-US', { month: 'short' })} ${d.getFullYear()}`;
}

const FOOTER_KEYS = ['Beats are split when', 'beats are split when', 'due to weight capacity', 'vehicle cannot serve'];

/** TripRouteInfoPanel.parseCoherenceReason (spec 04 §7.4). */
export function parseCoherenceReason(text: string): { summary: string; details: string[]; footer: string | null } {
  const sentences = String(text || '').split(/(?<=\.)\s+/).filter((s) => s.length > 0);
  if (sentences.length <= 1) return { summary: text, details: [], footer: null };
  const summary = sentences[0];
  const fi = sentences.findIndex((s) => FOOTER_KEYS.some((k) => s.includes(k)));
  const footer = fi >= 0 ? sentences[fi] : null;
  const details = fi >= 0 ? sentences.slice(1, fi) : sentences.slice(1);
  return { summary, details, footer };
}
