// Ported 1:1 from the original shared helpers chunk (date formatting, status labels, toasts, Excel date parsing).
import Swal from 'sweetalert2';

/** dd-MM-yyyy using UTC parts. */
export function formatDateUTC(value: string | number | Date): string {
  const d = new Date(value);
  const dd = String(d.getUTCDate()).padStart(2, '0');
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  return `${dd}-${mm}-${d.getUTCFullYear()}`;
}

/** yyyy-MM-dd in local time (passes through strings already in that shape). */
export function toYMD(value: string | Date): string {
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value.trim())) return value.trim();
  const d = typeof value === 'string' ? new Date(value) : value;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** dd-MM-yyyy in local time. */
export function formatDateDMY(value: string | number | Date): string {
  const d = new Date(value);
  return `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`;
}

export function getOrderStatusLabel(status: number): string {
  switch (status) {
    case 0: return 'All';
    case 1: return 'Ready for Planning';
    case 2: return 'In Planning';
    case 3: return 'Trip Assigned';
    case 4: return 'In Transit';
    case 5: return 'Delivered';
    case 6: return 'Partial Return';
    case 8: return 'Returned';
    case 10: return 'Cancelled';
    case 11: return 'Discarded';
    case 9: return 'Pending';
    case 12: return 'Offline Delivery';
    default: return '';
  }
}

export function getTripStatusLabel(status: number): string {
  switch (status) {
    case 0: return 'All';
    case 1: return 'Planned';
    case 2: return 'In Progress';
    case 3: return 'Completed';
    case 4: return 'Cancelled';
    default: return '';
  }
}

export function getOrderStatusClass(status: number): string {
  switch (status) {
    case 0: return 'all';
    case 1: return 'ready-for-planning';
    case 2: return 'in-planning';
    case 3: return 'trip-assigned';
    case 4: return 'in-transit';
    case 5: return 'delivered';
    case 6: return 'partial-return';
    case 8: return 'returned';
    case 10: return 'cancelled';
    case 11: return 'discarded';
    case 9: return 'pending';
    case 12: return 'offline-delivery';
    default: return '';
  }
}

export function toastSuccess(title: string, text?: string) {
  Swal.fire({ icon: 'success', title, text, showConfirmButton: false, timer: 1500 });
}
export function toastWarning(title: string, text?: string) {
  Swal.fire({ icon: 'warning', title, text, showConfirmButton: false, timer: 1500 });
}
export function toastInfo(title: string, text?: string) {
  Swal.fire({ icon: 'info', title, text, showConfirmButton: false, timer: 1500 });
}
export function toastError(title: string, text?: string) {
  Swal.fire({ icon: 'error', title, text, showConfirmButton: false, timer: 1500 });
}

/** Groups an array by a key, preserving first-seen order. */
export function groupBy<T, K extends keyof T>(items: T[], key: K): T[][] {
  const m = new Map<T[K], T[]>();
  for (const it of items) {
    const k = it[key];
    if (!m.has(k)) m.set(k, []);
    m.get(k)!.push(it);
  }
  return Array.from(m.values());
}

/** Splits a piece quantity into cases + loose pieces given a case size (UPC). */
export function toCasesAndPieces(caseSize: unknown, quantity: number): { pieces: number; cases: number } {
  const n = caseSize != null ? Number(caseSize) : NaN;
  if (!n || n <= 0 || isNaN(n)) return { pieces: quantity, cases: 0 };
  const size = Math.round(n);
  if (size <= 0) return { pieces: quantity, cases: 0 };
  let pieces = Math.abs(quantity) % size;
  let cases = Math.floor(Math.abs(quantity) / size);
  if (quantity < 0) { pieces = -pieces; cases = -cases; }
  return { pieces, cases };
}

/** dd-MM-yyyy HH:mm:ss, or "N/A". */
export function formatDateTimeFull(value?: string | null): string {
  if (!value || value === 'null' || value === 'undefined') return 'N/A';
  try {
    const d = new Date(value);
    if (isNaN(d.getTime())) return 'N/A';
    const p = (x: number) => x.toString().padStart(2, '0');
    return `${p(d.getDate())}-${p(d.getMonth() + 1)}-${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
  } catch {
    return 'N/A';
  }
}

/** HH:mm or "". */
export function formatTimeHM(value?: string | null): string {
  if (!value) return '';
  try {
    const d = new Date(value);
    if (isNaN(d.getTime())) return '';
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  } catch (e) {
    console.error('Error formatting time:', e);
    return '';
  }
}

/** Shifts a UTC timestamp by +05:30 unless `alreadyLocal`. */
export function toIstDate(value?: string | null, alreadyLocal?: boolean): Date | null {
  if (!value) return null;
  const d = new Date(value);
  if (alreadyLocal) return d;
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), d.getUTCHours() + 5, d.getUTCMinutes() + 30, d.getUTCSeconds()));
}

export function formatIstLocale(value?: string | null, alreadyLocal?: boolean): string | null {
  if (!value) return null;
  const d = toIstDate(value, alreadyLocal);
  return d ? d.toLocaleString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h24' }) : null;
}

function buildDateTime(a: string, b: string, year: string, hour: string, minute: string, second = '00', ampm = ''): string {
  let day: number, month: number;
  if (parseInt(a) <= 12 && parseInt(b) > 12) { month = parseInt(a, 10); day = parseInt(b, 10); }
  else if (parseInt(b) <= 12 && parseInt(a) > 12) { day = parseInt(a, 10); month = parseInt(b, 10); }
  else { month = parseInt(a, 10); day = parseInt(b, 10); }
  const date = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
  let h = parseInt(hour, 10) || 0;
  if (ampm) {
    const u = ampm.toUpperCase();
    if (u === 'AM' && h === 12) h = 0;
    if (u === 'PM' && h !== 12) h += 12;
  }
  const m = parseInt(minute, 10) || 0;
  const s = parseInt(second, 10) || 0;
  return `${date} ${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function excelSerialToDate(serial: number): string {
  const base = new Date(1899, 11, 30);
  const d = new Date(base.getTime() + Math.floor(serial) * 86400000);
  return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')} 00:00:00`;
}

function isExcelSerial(v: string): boolean {
  const n = Number(v);
  return !isNaN(n) && n > 1 && n < 2958466 && v.toString().indexOf('/') === -1 && v.toString().indexOf('-') === -1;
}

/** Normalises the many date formats seen in uploaded Excel/CSV files to "yyyy-MM-dd HH:mm:ss". */
export function normalizeExcelDate(value: unknown): string {
  const t = String(value).trim();
  if (isExcelSerial(t)) return excelSerialToDate(Number(t));
  if (t.match(/^[A-Za-z]{3} [A-Za-z]{3} \d{2} \d{4}/)) {
    try {
      const d = new Date(t);
      if (!isNaN(d.getTime())) return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')} 00:00:00`;
    } catch { /* fall through */ }
  }
  const monthFirst: { regex: RegExp; handler: (m: RegExpMatchArray) => string }[] = [
    { regex: /^(0?[1-9]|1[0-2])[/.-](0?[1-9]|[12][0-9]|3[01])[/.-](\d{4}) (0?[1-9]|1[0-2]):([0-5][0-9]):([0-5][0-9]) (AM|PM)/i, handler: (m) => buildDateTime(m[2], m[1], m[3], m[4], m[5], m[6], m[7]) },
    { regex: /^(0?[1-9]|1[0-2])[/.-](0?[1-9]|[12][0-9]|3[01])[/.-](\d{4}) (0?[0-9]|1[0-9]|2[0-3]):([0-5][0-9])/, handler: (m) => buildDateTime(m[2], m[1], m[3], m[4], m[5], '00') },
    { regex: /^(0?[1-9]|1[0-2])[/.-](0?[1-9]|[12][0-9]|3[01])[/.-](\d{4})$/, handler: (m) => buildDateTime(m[2], m[1], m[3], '0', '0', '00') },
  ];
  const dayFirst: { regex: RegExp; handler: (m: RegExpMatchArray) => string }[] = [
    { regex: /^(1[3-9]|2[0-9]|3[01])[/.-](0?[1-9]|1[0-2])[/.-](\d{4}) (0?[1-9]|1[0-2]):([0-5][0-9]):([0-5][0-9]) (AM|PM)/i, handler: (m) => buildDateTime(m[1], m[2], m[3], m[4], m[5], m[6], m[7]) },
    { regex: /^(1[3-9]|2[0-9]|3[01])[/.-](0?[1-9]|1[0-2])[/.-](\d{4}) (0?[0-9]|1[0-9]|2[0-3]):([0-5][0-9])(?::([0-5][0-9]))?/, handler: (m) => buildDateTime(m[1], m[2], m[3], m[4], m[5], m[6] || '00') },
    { regex: /^(1[3-9]|2[0-9]|3[01])[/.-](0?[1-9]|1[0-2])[/.-](\d{4})$/, handler: (m) => buildDateTime(m[1], m[2], m[3], '0', '0', '00') },
  ];
  for (const r of dayFirst) { const m = t.match(r.regex); if (m) { try { return r.handler(m); } catch { continue; } } }
  for (const r of monthFirst) { const m = t.match(r.regex); if (m) { try { return r.handler(m); } catch { continue; } } }
  return t;
}

function randomLetters(): string {
  const a = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let s = '';
  for (let i = 0; i < 4; i++) s += a[Math.floor(Math.random() * a.length)];
  return s;
}

/** Quick/single order reference id: QS-yyyyMMddHHmmss-XXXX */
export function generateQuickOrderId(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `QS-${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}-${randomLetters()}`;
}

const MIN_LEN = 3;
const MAX_LEN = 50;
/** Returns an error message for an optional name-like field, or null. */
export function validateNameLength(value: string | null | undefined, label: string): string | null {
  const v = (value || '').trim();
  if (!v) return null;
  if (v.length < MIN_LEN) return `${label} must be at least ${MIN_LEN} characters.`;
  if (v.length > MAX_LEN) return `${label} cannot exceed ${MAX_LEN} characters.`;
  return null;
}

/** IST "yyyy-MM-dd hh:mm AM" (from the date-format service). */
export function formatToIndianDateTime(value?: string | null): string {
  if (!value) return 'N/A';
  try {
    const d = new Date(new Date(value).toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
    let h = d.getHours();
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(h).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')} ${ampm}`;
  } catch (e) {
    console.error('Error formatting date:', e);
    return value;
  }
}

/** IST "dd-MM-yyyy". */
export function convertUtcToIstDate(value?: string | null): string {
  if (!value) return 'N/A';
  try {
    const d = new Date(new Date(value).toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
    return `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`;
  } catch (e) {
    console.error('Error converting date:', e);
    return value;
  }
}
