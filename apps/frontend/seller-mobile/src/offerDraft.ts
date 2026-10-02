import { useState } from 'react';
import { useI18n } from '@mockups/i18n';
import type { SellerScheme, SellerSchemeSlab } from '@mockups/types';
import { TODAY } from './catalog';

/* The offer being typed — shared by Create offer and the quick offer sheet.
   Same rules as the portal's QPS form: starts today, slabs run on from each
   other, a bigger quantity never gets a smaller discount. */

export type Period = 'keep' | '2w' | '1m' | '3m';

/** A slab as typed — "From" is derived from the row above, so it isn't stored. */
interface DraftSlab {
  to: string;
  pct: string;
}

const addPeriod = (iso: string, p: Exclude<Period, 'keep'>) => {
  const d = new Date(`${iso}T00:00:00`);
  if (p === '2w') d.setDate(d.getDate() + 14);
  else d.setMonth(d.getMonth() + (p === '1m' ? 1 : 3));
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

/** Start from an existing offer (edit) or two filled-in slabs (new). */
export function useOfferDraft(existing?: SellerScheme) {
  const { t } = useI18n();
  const [rows, setRows] = useState<DraftSlab[]>(
    existing
      ? existing.slabs.map((s) => ({ to: s.max === null ? '' : String(s.max), pct: String(s.discountPct) }))
      : [
          { to: '9', pct: '0' },
          { to: '', pct: '3' },
        ]
  );
  const [period, setPeriod] = useState<Period>(existing ? 'keep' : '1m');
  const [startNow, setStartNow] = useState(existing ? existing.status === 'ACTIVE' : true);
  const [showErrors, setShowErrors] = useState(false);

  const validTill = period === 'keep' && existing ? existing.validTill : addPeriod(TODAY, period === 'keep' ? '1m' : period);

  const slabs: SellerSchemeSlab[] = [];
  const errors: { to?: string; pct?: string }[] = [];
  rows.forEach((r, i) => {
    const min = i === 0 ? 1 : (slabs[i - 1].max ?? 0) + 1;
    const last = i === rows.length - 1;
    const to = Number(r.to);
    const pct = Number(r.pct);
    const err: { to?: string; pct?: string } = {};
    if (!last) {
      if (r.to.trim() === '') err.to = t('seller.offers.err.to_missing');
      else if (!Number.isInteger(to) || to < min) err.to = t('seller.offers.err.to_low').replace('{n}', String(min));
    }
    if (r.pct.trim() === '' || !(pct >= 0 && pct <= 99.99)) err.pct = t('seller.offers.err.pct');
    else if (i > 0 && pct < slabs[i - 1].discountPct) err.pct = t('seller.offers.err.pct_lower').replace('{n}', String(slabs[i - 1].discountPct));
    errors.push(err);
    slabs.push({ min, max: last ? null : Number.isFinite(to) && to >= min ? to : min, discountPct: Number.isFinite(pct) ? pct : 0 });
  });

  return {
    existing,
    rows,
    slabs,
    errors,
    valid: errors.every((e) => !e.to && !e.pct),
    showErrors,
    setShowErrors,
    period,
    setPeriod,
    validTill,
    startNow,
    setStartNow,
    setRow: (i: number, patch: Partial<DraftSlab>) => setRows((prev) => prev.map((r, j) => (j === i ? { ...r, ...patch } : r))),
    addSlab: () =>
      setRows((prev) => {
        const lastIdx = prev.length - 1;
        const min = slabs[lastIdx].min;
        return [...prev.map((r, j) => (j === lastIdx && r.to.trim() === '' ? { ...r, to: String(min + 9) } : r)), { to: '', pct: prev[lastIdx].pct }];
      }),
    removeSlab: (i: number) =>
      setRows((prev) => {
        const next = prev.filter((_, j) => j !== i);
        return next.map((r, j) => (j === next.length - 1 ? { ...r, to: '' } : r));
      }),
  };
}

export type OfferDraft = ReturnType<typeof useOfferDraft>;

/** Next number after the highest existing code, like the portal's running series. */
export const nextOfferCode = (schemes: SellerScheme[]) =>
  `QPS-${Math.max(1000, ...schemes.map((s) => Number(s.code.replace(/\D/g, '')) || 0)) + 1}`;
