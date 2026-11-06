// Angular `date` / `number` pipe equivalents used by the Delivery Planning screens (en-US locale, browser timezone).

const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const pad = (n: number) => String(n).padStart(2, '0');

export type DatePattern = 'medium' | 'dd MMM yyyy' | 'dd-MM-yyyy HH:mm:ss' | 'dd-MM-yyyy' | 'd-M-yyyy';

/** Angular DatePipe subset. Empty / invalid input → "" (the pipe returns null). */
export function fmtDate(value: string | number | Date | null | undefined, pattern: DatePattern): string {
  if (value === null || value === undefined || value === '') return '';
  const d = value instanceof Date ? value : new Date(value);
  if (isNaN(d.getTime())) return '';
  switch (pattern) {
    case 'medium': {
      const h = d.getHours() % 12 || 12;
      return `${MON[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}, ${h}:${pad(d.getMinutes())}:${pad(d.getSeconds())} ${d.getHours() >= 12 ? 'PM' : 'AM'}`;
    }
    case 'dd MMM yyyy':
      return `${pad(d.getDate())} ${MON[d.getMonth()]} ${d.getFullYear()}`;
    case 'dd-MM-yyyy HH:mm:ss':
      return `${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
    case 'dd-MM-yyyy':
      return `${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()}`;
    case 'd-M-yyyy':
      return `${d.getDate()}-${d.getMonth() + 1}-${d.getFullYear()}`;
  }
}

/** Angular DecimalPipe `number:'1.min-max'` (en-US grouping). null/undefined/"" → "". */
export function fmtNumber(value: unknown, minFrac: number, maxFrac: number): string {
  if (value === null || value === undefined || value === '') return '';
  const n = Number(value);
  if (isNaN(n)) return '';
  return n.toLocaleString('en-US', { minimumFractionDigits: minFrac, maximumFractionDigits: maxFrac });
}

export const MONTH_SHORT = MON;
