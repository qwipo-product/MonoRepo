import { useState } from 'react';
import { useI18n } from '@mockups/i18n';
import type { SellerScheme, SellerSchemeSlab } from '@mockups/types';
import { hasFlatSlab, TODAY } from './catalog';

/* The offer being typed — shared by Create offer and the quick offer sheet.
   Same rules as the portal's QPS form: starts today, slabs run on from each
   other with no gaps, a bigger quantity never gets a smaller discount.
   Editing keeps the offer's shape: the first slab can start above 1 and the
   last can have a top. Paused offers and ₹-off offers (made on the web) are
   locked — `locked` says why, and their slabs are left exactly as they are. */

export type Period = 'keep' | '2w' | '1m' | '3m' | 'date';

/** A slab as typed. "From" is derived from the row above, except on the first row. */
interface DraftSlab {
  from: string; // only read on the first row
  to: string; // empty on the last row = "and above"
  pct: string;
}

const addPeriod = (iso: string, p: '2w' | '1m' | '3m') => {
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
      ? existing.slabs.map((s) => ({ from: String(s.min), to: s.max === null ? '' : String(s.max), pct: String(s.discountPct) }))
      : [
          { from: '1', to: '9', pct: '0' },
          { from: '', to: '', pct: '3' },
        ]
  );
  const [period, setPeriod] = useState<Period>(existing ? 'keep' : '1m');
  const [pickedDate, setPickedDate] = useState('');
  const [startNow, setStartNow] = useState(existing ? existing.status === 'ACTIVE' : true);
  const [showErrors, setShowErrors] = useState(false);

  const locked: 'paused' | 'flat' | null = !existing ? null : existing.status === 'INACTIVE' ? 'paused' : hasFlatSlab(existing.slabs) ? 'flat' : null;

  const validTill =
    period === 'keep' && existing ? existing.validTill : period === 'date' ? pickedDate : addPeriod(TODAY, period === 'keep' ? '1m' : period);
  const dateError = period === 'date' && !(pickedDate > TODAY) ? t('seller.offers2.err.date') : '';

  const slabs: SellerSchemeSlab[] = [];
  const errors: { from?: string; to?: string; pct?: string }[] = [];
  rows.forEach((r, i) => {
    const last = i === rows.length - 1;
    const from = Number(r.from);
    const min = i === 0 ? (Number.isInteger(from) && from >= 1 ? from : 1) : (slabs[i - 1].max ?? 0) + 1;
    const to = Number(r.to);
    const pct = Number(r.pct);
    const err: { from?: string; to?: string; pct?: string } = {};
    if (i === 0 && !(Number.isInteger(from) && from >= 1)) err.from = t('seller.offers2.err.from');
    if (!last || r.to.trim() !== '') {
      if (r.to.trim() === '') err.to = t('seller.offers.err.to_missing');
      else if (!Number.isInteger(to) || to < min) err.to = t('seller.offers.err.to_low').replace('{n}', String(min));
    }
    if (r.pct.trim() === '' || !(pct >= 0 && pct <= 99.99)) err.pct = t('seller.offers.err.pct');
    else if (i > 0 && pct < slabs[i - 1].discountPct) err.pct = t('seller.offers.err.pct_lower').replace('{n}', String(slabs[i - 1].discountPct));
    errors.push(err);
    const max = last && r.to.trim() === '' ? null : Number.isFinite(to) && to >= min ? to : min;
    slabs.push({ min, max, discountPct: Number.isFinite(pct) ? pct : 0 });
  });

  return {
    existing,
    locked,
    rows,
    // A locked offer keeps its own slabs (₹-off ones included) untouched.
    slabs: locked && existing ? existing.slabs : slabs,
    errors,
    dateError,
    valid: !dateError && errors.every((e) => !e.from && !e.to && !e.pct),
    showErrors,
    setShowErrors,
    period,
    setPeriod,
    pickedDate,
    setPickedDate,
    validTill,
    startNow,
    setStartNow,
    setRow: (i: number, patch: Partial<DraftSlab>) => setRows((prev) => prev.map((r, j) => (j === i ? { ...r, ...patch } : r))),
    addSlab: () =>
      setRows((prev) => {
        const lastIdx = prev.length - 1;
        const min = slabs[lastIdx].min;
        return [...prev.map((r, j) => (j === lastIdx && r.to.trim() === '' ? { ...r, to: String(min + 9) } : r)), { from: '', to: '', pct: prev[lastIdx].pct }];
      }),
    removeSlab: (i: number) => setRows((prev) => prev.filter((_, j) => j !== i)),
  };
}

export type OfferDraft = ReturnType<typeof useOfferDraft>;

/** Next number after the highest existing code, like the portal's running series. */
export const nextOfferCode = (schemes: SellerScheme[]) =>
  `QPS-${Math.max(1000, ...schemes.map((s) => Number(s.code.replace(/\D/g, '')) || 0)) + 1}`;
