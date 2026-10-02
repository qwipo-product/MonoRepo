import { Lock, Plus, Trash2 } from 'lucide-react';
import { Button, Chip, FieldError, Input, Switch, cn } from '@mockups/ui';
import { formatInrExact } from '@mockups/components';
import { useI18n } from '@mockups/i18n';
import { TODAY, unitPrice } from '../catalog';
import { formatDay } from '../format';
import { SlabTable } from './SlabTable';
import type { OfferDraft, Period } from '../offerDraft';

/* The offer's fields — discount by quantity, end date, start now. Create
   offer (step 2) and the quick offer sheet on Products both render this, so
   an offer is set up the same way wherever it starts. A locked offer (paused,
   or ₹ off made on the web) shows its slabs read-only with the reason. */
export function OfferForm({ draft, price }: { draft: OfferDraft; price: number }) {
  const { t } = useI18n();
  const periods: Period[] = draft.existing ? ['keep', '2w', '1m', '3m', 'date'] : ['2w', '1m', '3m', 'date'];

  if (draft.locked && draft.existing) {
    return (
      <section className="space-y-3 rounded-lg border border-border bg-card p-3 shadow-sm">
        <div className="flex items-start gap-2 rounded-md bg-muted p-2.5 text-xs text-foreground-secondary">
          <Lock size={14} className="mt-0.5 shrink-0" />
          {t(draft.locked === 'paused' ? 'seller.offers2.locked_paused' : 'seller.offers2.locked_flat')}
        </div>
        <SlabTable slabs={draft.existing.slabs} price={price} />
        <div className="text-sm font-medium">{t('seller.offers.ends_on').replace('{date}', formatDay(draft.existing.validTill))}</div>
      </section>
    );
  }

  return (
    <div className="space-y-3">
      <section className="rounded-lg border border-border bg-card shadow-sm">
        <div className="border-b border-border px-3 py-2.5">
          <div className="text-sm font-semibold">{t('seller.offers.slabs_title')}</div>
          <div className="text-xs text-foreground-secondary">{t('seller.offers.slabs_help')}</div>
        </div>
        <ul className="divide-y divide-border">
          {draft.rows.map((r, i) => {
            const last = i === draft.rows.length - 1;
            const e = draft.showErrors ? draft.errors[i] : {};
            return (
              <li key={i} className="space-y-2 p-3">
                <div className="grid grid-cols-[1fr_1fr_1fr_auto] items-end gap-2">
                  {i === 0 ? (
                    <NumberBox label={t('seller.offers.from')} value={r.from} invalid={!!e.from} onChange={(v) => draft.setRow(i, { from: v.replace(/\D/g, '') })} />
                  ) : (
                    <NumberBox label={t('seller.offers.from')} value={String(draft.slabs[i].min)} readOnly />
                  )}
                  <NumberBox
                    label={t('seller.offers.to')}
                    value={r.to}
                    placeholder={last ? t('seller.offers.and_more') : undefined}
                    invalid={!!e.to}
                    onChange={(v) => draft.setRow(i, { to: v.replace(/\D/g, '') })}
                  />
                  <NumberBox label={t('seller.offers.pct')} value={r.pct} invalid={!!e.pct} decimal onChange={(v) => draft.setRow(i, { pct: v.replace(/[^\d.]/g, '') })} />
                  {i > 0 ? (
                    <button onClick={() => draft.removeSlab(i)} aria-label={t('seller.offers.remove_slab')} className="grid h-11 w-9 place-items-center text-error-foreground">
                      <Trash2 size={16} />
                    </button>
                  ) : (
                    <span className="w-9" />
                  )}
                </div>
                {(e.from || e.to || e.pct) && <FieldError>{e.from ?? e.to ?? e.pct}</FieldError>}
                <div className="text-xs text-foreground-secondary">
                  {t('seller.offers.buyer_pays').replace('{price}', formatInrExact(unitPrice(price, draft.slabs[i])))}
                  {last && r.to.trim() === '' && ` · ${t('seller.offers2.last_open')}`}
                </div>
              </li>
            );
          })}
        </ul>
        <div className="border-t border-border p-3">
          <Button variant="outlinePrimary" size="sm" onClick={draft.addSlab}>
            <Plus size={15} />
            {t('seller.offers.add_slab')}
          </Button>
        </div>
      </section>

      <section className="space-y-2 rounded-lg border border-border bg-card p-3 shadow-sm">
        <div className="flex items-baseline justify-between">
          <span className="text-sm font-semibold">{t('seller.offers.ends')}</span>
          {!draft.existing && <span className="text-xs text-foreground-secondary">{t('seller.offers.starts_today')}</span>}
        </div>
        <div className="flex flex-wrap gap-2">
          {periods.map((p) => (
            <Chip key={p} selected={draft.period === p} onClick={() => draft.setPeriod(p)}>
              {t(p === 'date' ? 'seller.offers2.pick_date' : `seller.offers.period.${p}`)}
            </Chip>
          ))}
        </div>
        {draft.period === 'date' && (
          <Input
            type="date"
            min={TODAY}
            value={draft.pickedDate}
            onChange={(e) => draft.setPickedDate(e.target.value)}
            aria-label={t('seller.offers2.pick_date')}
            aria-invalid={(draft.showErrors && !!draft.dateError) || undefined}
          />
        )}
        {draft.showErrors && draft.dateError ? (
          <FieldError>{draft.dateError}</FieldError>
        ) : (
          draft.validTill && <div className="text-sm font-medium">{t('seller.offers.ends_on').replace('{date}', formatDay(draft.validTill))}</div>
        )}
      </section>

      {!draft.existing && (
        <section className="flex items-start justify-between gap-3 rounded-lg border border-border bg-card p-3 shadow-sm">
          <div>
            <div className="text-sm font-semibold">{t('seller.offers.start_now')}</div>
            <div className="text-xs text-foreground-secondary">{t('seller.offers.start_now_help')}</div>
          </div>
          <Switch checked={draft.startNow} onCheckedChange={draft.setStartNow} aria-label={t('seller.offers.start_now')} />
        </section>
      )}
    </div>
  );
}

function NumberBox({
  label,
  value,
  onChange,
  readOnly,
  invalid,
  decimal,
  placeholder,
}: {
  label: string;
  value: string;
  placeholder?: string;
  onChange?: (v: string) => void;
  readOnly?: boolean;
  invalid?: boolean;
  decimal?: boolean;
}) {
  return (
    <label className="block min-w-0">
      <span className="mb-1 block text-[11px] text-foreground-secondary">{label}</span>
      <Input
        value={value}
        readOnly={readOnly}
        placeholder={placeholder}
        inputMode={decimal ? 'decimal' : 'numeric'}
        aria-invalid={invalid || undefined}
        onChange={(e) => onChange?.(e.target.value)}
        className={cn('px-2 tabular-nums', readOnly && 'bg-input text-foreground-secondary', invalid && 'border-error')}
      />
    </label>
  );
}
