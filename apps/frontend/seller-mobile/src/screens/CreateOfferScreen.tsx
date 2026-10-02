import { useState } from 'react';
import { ChevronRight, Search } from 'lucide-react';
import { Badge, Button, EmptyState, Input, cn } from '@mockups/ui';
import { formatInrExact } from '@mockups/components';
import { useI18n } from '@mockups/i18n';
import type { SellerScheme, SellerSku } from '@mockups/types';
import { ScreenHeader } from '../components/ScreenHeader';
import { ProductThumb } from '../components/ProductThumb';
import { TODAY } from '../catalog';
import { nextOfferCode, useOfferDraft } from '../offerDraft';
import { OfferForm } from '../components/OfferForm';
import { formatDay } from '../format';
import { SlabTable } from '../components/SlabTable';

type Step = 1 | 2 | 3;

/* Create offer — three short steps: pick the product, set the discount by
   quantity (the shared OfferForm), check and create. Two slabs come filled
   in so most offers are one edit. */
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
  const draft = useOfferDraft();

  // Inactive products, and products that already have a live or paused offer, can't get another.
  const taken = new Set(schemes.filter((s) => s.status !== 'EXPIRED').map((s) => s.skuCode));
  const eligible = skus.filter((s) => s.active && !taken.has(s.code));
  const sku = skus.find((s) => s.code === skuCode);
  const { slabs, validTill, startNow } = draft;

  const back = () => (step === 1 ? onBack() : step === 2 && !initialSkuCode ? setStep(1) : step === 3 ? setStep(2) : onBack());
  const next = () => {
    if (!draft.valid) {
      draft.setShowErrors(true);
      return;
    }
    setStep(3);
  };
  const create = () =>
    onCreate({
      code: nextOfferCode(schemes),
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
                      <ProductThumb productId={s.productId} alt={s.name} />
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
            <ProductThumb productId={sku.productId} alt={sku.name} />
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

        {step === 2 && sku && <OfferForm draft={draft} price={sku.price} />}

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

