import { useState } from 'react';
import { ChevronRight, Plus, Search, Trash2 } from 'lucide-react';
import { Badge, Button, Chip, EmptyState, FieldError, Input, Switch, cn } from '@mockups/ui';
import { ProductImage, formatInrExact } from '@mockups/components';
import { useI18n } from '@mockups/i18n';
import type { SellerScheme, SellerSchemeSlab, SellerSku } from '@mockups/types';
import { ScreenHeader } from '../components/ScreenHeader';
import { imageOf, slabPrice, TODAY } from '../catalog';
import { formatDay } from '../format';
import { SlabTable } from '../components/SlabTable';

type Step = 1 | 2 | 3;
type Period = '2w' | '1m' | '3m';
/** A slab as typed — "From" is derived from the row above, so it isn't stored. */
interface DraftSlab {
  to: string;
  pct: string;
}

const addPeriod = (iso: string, p: Period) => {
  const d = new Date(`${iso}T00:00:00`);
  if (p === '2w') d.setDate(d.getDate() + 14);
  else d.setMonth(d.getMonth() + (p === '1m' ? 1 : 3));
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

/* Create offer — three short steps: pick the product, set the discount by
   quantity, check and create. Same rules as the portal's QPS form: starts
   today, slabs run on from each other, and a bigger quantity never gets a
   smaller discount. Two slabs come filled in so most offers are one edit. */
export function CreateOfferScreen({
  skus,
  schemes,
  initialSkuCode,
  onBack,
  onCreate,
}: {
  skus: SellerSku[];
  schemes: SellerScheme[];
  initialSkuCode?: string;
  onBack: () => void;
  onCreate: (scheme: SellerScheme) => void;
}) {
  const { t } = useI18n();
  const [step, setStep] = useState<Step>(initialSkuCode ? 2 : 1);
  const [skuCode, setSkuCode] = useState<string | undefined>(initialSkuCode);
  const [query, setQuery] = useState('');
  const [rows, setRows] = useState<DraftSlab[]>([
    { to: '9', pct: '0' },
    { to: '', pct: '3' },
  ]);
  const [period, setPeriod] = useState<Period>('1m');
  const [startNow, setStartNow] = useState(true);
  const [showErrors, setShowErrors] = useState(false);

  // Inactive products, and products that already have a live or paused offer, can't get another.
  const taken = new Set(schemes.filter((s) => s.status !== 'EXPIRED').map((s) => s.skuCode));
  const eligible = skus.filter((s) => s.active && !taken.has(s.code));
  const sku = skus.find((s) => s.code === skuCode);
  const validTill = addPeriod(TODAY, period);

  // Derived slabs + per-row errors.
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
  const valid = errors.every((e) => !e.to && !e.pct);

  const setRow = (i: number, patch: Partial<DraftSlab>) => setRows((prev) => prev.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  const addSlab = () =>
    setRows((prev) => {
      const lastIdx = prev.length - 1;
      const min = slabs[lastIdx].min;
      return [
        ...prev.map((r, j) => (j === lastIdx && r.to.trim() === '' ? { ...r, to: String(min + 9) } : r)),
        { to: '', pct: prev[lastIdx].pct },
      ];
    });
  const removeSlab = (i: number) =>
    setRows((prev) => {
      const next = prev.filter((_, j) => j !== i);
      return next.map((r, j) => (j === next.length - 1 ? { ...r, to: '' } : r));
    });

  const back = () => (step === 1 ? onBack() : step === 2 && !initialSkuCode ? setStep(1) : step === 3 ? setStep(2) : onBack());
  const next = () => {
    if (!valid) {
      setShowErrors(true);
      return;
    }
    setStep(3);
  };
  const create = () =>
    onCreate({
      // Next number after the highest existing code, like the portal's running series.
      code: `QPS-${Math.max(1000, ...schemes.map((s) => Number(s.code.replace(/\D/g, '')) || 0)) + 1}`,
      skuCode: skuCode!,
      validFrom: TODAY,
      validTill,
      status: startNow ? 'ACTIVE' : 'INACTIVE',
      slabs,
    });

  const q = query.trim().toLowerCase();
  const found = eligible.filter((s) => !q || s.name.toLowerCase().includes(q) || s.code.toLowerCase().includes(q) || s.brand.toLowerCase().includes(q));

  return (
    <div className="flex h-full flex-col">
      <ScreenHeader title={t('seller.offers.create')} onBack={back} />
      <Steps step={step} />

      <div className="no-scrollbar flex-1 space-y-3 overflow-y-auto bg-background-subtle p-3">
        {step === 1 && (
          <>
            <div>
              <h2 className="text-base font-semibold">{t('seller.offers.pick_title')}</h2>
              <p className="text-xs text-foreground-secondary">{t('seller.offers.pick_help')}</p>
            </div>
            <label className="relative block">
              <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-foreground-secondary" />
              <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t('seller.offers.search')} aria-label={t('seller.offers.search')} className="pl-9" />
            </label>
            {found.length === 0 ? (
              <EmptyState title={t('seller.offers.no_products')} />
            ) : (
              <ul className="divide-y divide-border rounded-lg border border-border bg-card shadow-sm">
                {found.map((s) => (
                  <li key={s.code}>
                    <button
                      onClick={() => {
                        setSkuCode(s.code);
                        setStep(2);
                      }}
                      className="flex w-full items-center gap-3 p-3 text-left active:bg-muted"
                    >
                      <ProductImage image={imageOf(s.productId)} alt={s.name} className="h-11 w-11 shrink-0 rounded-md" />
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-medium leading-snug">{s.name}</span>
                        <span className="block text-xs text-foreground-secondary">
                          {s.pack} · {formatInrExact(s.price)}
                        </span>
                      </span>
                      <ChevronRight size={16} className="shrink-0 text-foreground-secondary" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}

        {step >= 2 && sku && (
          <section className="flex items-center gap-3 rounded-lg border border-border bg-card p-3 shadow-sm">
            <ProductImage image={imageOf(sku.productId)} alt={sku.name} className="h-12 w-12 shrink-0 rounded-md" />
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium leading-snug">{sku.name}</div>
              <div className="text-xs text-foreground-secondary">
                {t('seller.offers.selling_price')} <span className="font-semibold text-foreground">{formatInrExact(sku.price)}</span> · {t('seller.offers.mrp')}{' '}
                {formatInrExact(sku.mrp)}
              </div>
            </div>
            {step === 2 && !initialSkuCode && (
              <Button variant="ghost" size="sm" className="text-primary" onClick={() => setStep(1)}>
                {t('seller.offers.change_product')}
              </Button>
            )}
          </section>
        )}

        {step === 2 && sku && (
          <>
            <section className="rounded-lg border border-border bg-card shadow-sm">
              <div className="border-b border-border px-3 py-2.5">
                <div className="text-sm font-semibold">{t('seller.offers.slabs_title')}</div>
                <div className="text-xs text-foreground-secondary">{t('seller.offers.slabs_help')}</div>
              </div>
              <ul className="divide-y divide-border">
                {rows.map((r, i) => {
                  const last = i === rows.length - 1;
                  const e = showErrors ? errors[i] : {};
                  return (
                    <li key={i} className="space-y-2 p-3">
                      <div className="grid grid-cols-[1fr_1fr_1fr_auto] items-end gap-2">
                        <NumberBox label={t('seller.offers.from')} value={String(slabs[i].min)} readOnly />
                        {last ? (
                          <NumberBox label={t('seller.offers.to')} value={t('seller.offers.and_more')} readOnly />
                        ) : (
                          <NumberBox label={t('seller.offers.to')} value={r.to} invalid={!!e.to} onChange={(v) => setRow(i, { to: v.replace(/\D/g, '') })} />
                        )}
                        <NumberBox label={t('seller.offers.pct')} value={r.pct} invalid={!!e.pct} decimal onChange={(v) => setRow(i, { pct: v.replace(/[^\d.]/g, '') })} />
                        {i > 0 ? (
                          <button onClick={() => removeSlab(i)} aria-label={t('seller.offers.remove_slab')} className="grid h-11 w-9 place-items-center text-error-foreground">
                            <Trash2 size={16} />
                          </button>
                        ) : (
                          <span className="w-9" />
                        )}
                      </div>
                      {(e.to || e.pct) && <FieldError>{e.to ?? e.pct}</FieldError>}
                      <div className="text-xs text-foreground-secondary">
                        {t('seller.offers.buyer_pays').replace('{price}', formatInrExact(slabPrice(sku.price, slabs[i].discountPct)))}
                      </div>
                    </li>
                  );
                })}
              </ul>
              <div className="border-t border-border p-3">
                <Button variant="outlinePrimary" size="sm" onClick={addSlab}>
                  <Plus size={15} />
                  {t('seller.offers.add_slab')}
                </Button>
              </div>
            </section>

            <section className="space-y-2 rounded-lg border border-border bg-card p-3 shadow-sm">
              <div className="flex items-baseline justify-between">
                <span className="text-sm font-semibold">{t('seller.offers.ends')}</span>
                <span className="text-xs text-foreground-secondary">{t('seller.offers.starts_today')}</span>
              </div>
              <div className="flex gap-2">
                {(['2w', '1m', '3m'] as Period[]).map((p) => (
                  <Chip key={p} selected={period === p} onClick={() => setPeriod(p)}>
                    {t(`seller.offers.period.${p}`)}
                  </Chip>
                ))}
              </div>
              <div className="text-sm font-medium">{t('seller.offers.ends_on').replace('{date}', formatDay(validTill))}</div>
            </section>

            <section className="flex items-start justify-between gap-3 rounded-lg border border-border bg-card p-3 shadow-sm">
              <div>
                <div className="text-sm font-semibold">{t('seller.offers.start_now')}</div>
                <div className="text-xs text-foreground-secondary">{t('seller.offers.start_now_help')}</div>
              </div>
              <Switch checked={startNow} onCheckedChange={setStartNow} aria-label={t('seller.offers.start_now')} />
            </section>
          </>
        )}

        {step === 3 && sku && (
          <section className="space-y-3 rounded-lg border border-border bg-card p-3 shadow-sm">
            <div>
              <div className="text-base font-semibold">{t('seller.offers.check_title')}</div>
              <div className="text-xs text-foreground-secondary">{t('seller.offers.check_help')}</div>
            </div>
            <div className="flex items-center gap-1.5">
              <Badge variant="accent">{t('seller.offers.qps')}</Badge>
              <span className="text-sm font-semibold">{t('seller.offers.kind')}</span>
            </div>
            <SlabTable slabs={slabs} price={sku.price} />
            <dl className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <dt className="text-foreground-secondary">{t('seller.offers.validity')}</dt>
                <dd className="mt-0.5 font-semibold text-foreground">
                  {formatDay(TODAY)} – {formatDay(validTill)}
                </dd>
              </div>
              <div>
                <dt className="text-foreground-secondary">{t('seller.offers.state')}</dt>
                <dd className="mt-0.5">
                  <Badge variant={startNow ? 'success' : 'neutral'}>{t(startNow ? 'seller.offers.status.ACTIVE' : 'seller.offers.status.INACTIVE')}</Badge>
                </dd>
              </div>
            </dl>
          </section>
        )}
      </div>

      {step >= 2 && sku && (
        <div className="flex gap-3 border-t border-border bg-card p-3 shadow-[var(--shadow-bar-top)]">
          <Button variant="secondary" className="flex-1" onClick={back}>
            {t('seller.offers.back')}
          </Button>
          {step === 2 ? (
            <Button className="flex-[2]" onClick={next}>
              {t('seller.offers.next')}
            </Button>
          ) : (
            <Button className="flex-[2]" onClick={create}>
              {t('seller.offers.create')}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

/** 1 Product · 2 Discount · 3 Check */
function Steps({ step }: { step: Step }) {
  const { t } = useI18n();
  const names = ['product', 'discount', 'check'] as const;
  return (
    <ol className="flex items-center gap-2 border-b border-border bg-card px-4 py-2.5 text-xs">
      {names.map((n, i) => {
        const at = (i + 1) as Step;
        return (
          <li key={n} className="flex items-center gap-2">
            <span
              className={cn(
                'grid h-5 w-5 place-items-center rounded-full text-[11px] font-semibold',
                at <= step ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground-secondary'
              )}
            >
              {at}
            </span>
            <span className={at === step ? 'font-semibold text-foreground' : 'text-foreground-secondary'}>{t(`seller.offers.step.${n}`)}</span>
            {i < names.length - 1 && <span className="text-foreground-secondary">·</span>}
          </li>
        );
      })}
    </ol>
  );
}

function NumberBox({
  label,
  value,
  onChange,
  readOnly,
  invalid,
  decimal,
}: {
  label: string;
  value: string;
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
        inputMode={decimal ? 'decimal' : 'numeric'}
        aria-invalid={invalid || undefined}
        onChange={(e) => onChange?.(e.target.value)}
        className={cn('px-2 tabular-nums', readOnly && 'bg-input text-foreground-secondary', invalid && 'border-error')}
      />
    </label>
  );
}
