// Ports of the original Angular pipes `addCurrency` (₹ Indian grouping) and `addWeight` (Kgs).

function indianGroup(value: number): string {
  const fixed = value.toFixed(2);
  const [intPart, dec] = fixed.split('.');
  let last3 = intPart.substring(intPart.length - 3);
  const rest = intPart.substring(0, intPart.length - 3);
  if (rest !== '') last3 = ',' + last3;
  const grouped = rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + last3;
  return dec !== undefined ? `${grouped}.${dec}` : grouped;
}

/** "₹ 1,35,374.20"; null/"" → "₹ 0.00"; NaN (undefined, "abc") → "₹ 0". */
export function addCurrency(value: unknown): string {
  const n = Number(value);
  if (isNaN(n)) return '₹ 0';
  return '₹ ' + indianGroup(n);
}

/** "1,234.50 Kgs"; non-numeric → " 0 Kgs". */
export function addWeight(value: unknown): string {
  const n = Number(value);
  if (isNaN(n)) return ' 0 Kgs';
  return indianGroup(n) + ' Kgs';
}

/** Indian grouping without the currency symbol and without forced decimals (e.g. "₹0" style cards). */
export function inr(value: unknown, decimals = 0): string {
  const n = Number(value) || 0;
  return '₹' + n.toLocaleString('en-IN', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}
