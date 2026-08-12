// Indian-grouped rupee formatter — no Intl dependency (Hermes-safe).
// 172 -> "₹172.00", 172000 -> "₹1,72,000.00"
export function formatInr(n: number): string {
  const [intPart, dec] = Math.abs(n).toFixed(2).split('.');
  const last3 = intPart.slice(-3);
  let rest = intPart.slice(0, -3);
  if (rest) rest = rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',');
  const grouped = rest ? `${rest},${last3}` : last3;
  return `${n < 0 ? '-' : ''}₹${grouped}.${dec}`;
}

export const formatInrExact = formatInr;

export const cn = (...parts: (string | false | null | undefined)[]) =>
  parts.filter(Boolean).join(' ');
