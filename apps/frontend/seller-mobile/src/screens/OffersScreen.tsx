import { useState } from 'react';
import { BadgePercent, CalendarDays, Search } from 'lucide-react';
import { Badge, Button, Chip, EmptyState, Input, Sheet, type BadgeProps } from '@mockups/ui';
import { formatInrExact } from '@mockups/components';
import { useI18n } from '@mockups/i18n';
import type { SellerScheme, SellerSchemeSlab, SellerSchemeStatus, SellerSku } from '@mockups/types';
import { ScreenHeader } from '../components/ScreenHeader';
import { ProductThumb } from '../components/ProductThumb';
import { SlabTable } from '../components/SlabTable';

type Filter = 'all' | SellerSchemeStatus;
const FILTERS: Filter[] = ['all', 'ACTIVE', 'INACTIVE', 'EXPIRED'];

const STATUS_VARIANT: Record<SellerSchemeStatus, NonNullable<BadgeProps['variant']>> = {
  ACTIVE: 'success',
  INACTIVE: 'neutral',
  EXPIRED: 'danger',
};

/** "15 Sep" */
const shortDate = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

/* Offers & Schemes — the portal's QPS offers, called "Buy more, save more"
   here. One product per offer. Search by offer code, SKU code or product.
   Tap an offer to see its slabs, pause / start it, or edit a live one;
   expired offers are read-only. */
export function OffersScreen({
  schemes,
  skus,
  onBack,
  onCreate,
  onEdit,
  onSetStatus,
  onToast,
}: {
  schemes: SellerScheme[];
  skus: SellerSku[];
  onBack: () => void;
  onCreate: () => void;
  /** Open the offer form for this product (App shows the offer sheet). */
  onEdit: (skuCode: string) => void;
  onSetStatus: (code: string, status: 'ACTIVE' | 'INACTIVE') => void;
  onToast: (message: string) => void;
}) {
  const { t } = useI18n();
  const [filter, setFilter] = useState<Filter>('all');
  const [openCode, setOpenCode] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  const skuOf = (code: string) => skus.find((s) => s.code === code);
  // The portal's search: SKU code, product name, offer code.
  const q = query.trim().toLowerCase();
  const shown = schemes.filter(
    (s) =>
      (filter === 'all' || s.status === filter) &&
      (!q || s.code.toLowerCase().includes(q) || s.skuCode.toLowerCase().includes(q) || (skuOf(s.skuCode)?.name.toLowerCase().includes(q) ?? false))
  );
  const open = openCode ? schemes.find((s) => s.code === openCode) : undefined;
  const openSku = open ? skuOf(open.skuCode) : undefined;

  const toggle = (s: SellerScheme) => {
    const next = s.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    onSetStatus(s.code, next);
    onToast(t(next === 'ACTIVE' ? 'seller.offers.started_toast' : 'seller.offers.paused_toast'));
    setOpenCode(null);
  };

  return (
    <div className="flex h-full flex-col">
      <ScreenHeader title={t('seller.offers.title')} onBack={onBack} />

      {schemes.length > 0 && (
        <div className="space-y-2 border-b border-border bg-card px-3 py-2">
          <label className="relative block">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-foreground-secondary" />
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t('seller.offers2.search')} aria-label={t('seller.offers2.search')} className="pl-9" />
          </label>
          <div className="no-scrollbar -mx-3 flex gap-2 overflow-x-auto px-3">
            {FILTERS.map((f) => (
              <Chip key={f} selected={filter === f} onClick={() => setFilter(f)}>
                {t(`seller.offers.filter.${f}`)} ({schemes.filter((s) => f === 'all' || s.status === f).length})
              </Chip>
            ))}
          </div>
        </div>
      )}

      <div className="no-scrollbar flex-1 space-y-3 overflow-y-auto bg-background-subtle p-3">
        {shown.length === 0 ? (
          <EmptyState
            icon={<BadgePercent strokeWidth={1.75} />}
            title={schemes.length === 0 ? t('seller.offers.empty') : t('seller.offers.none_here')}
            description={schemes.length === 0 ? t('seller.offers.empty_help') : undefined}
          />
        ) : (
          shown.map((s) => {
            const sku = skuOf(s.skuCode);
            return (
              <button
                key={s.code}
                onClick={() => setOpenCode(s.code)}
                className="block w-full rounded-lg border border-border bg-card p-3 text-left shadow-sm active:scale-[0.99]"
              >
                <div className="flex gap-3">
                  <ProductThumb productId={sku?.productId} alt={sku?.name ?? ''} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-sm font-medium leading-snug">{sku?.name ?? t('seller.offers.unknown_product')}</span>
                      <Badge variant={STATUS_VARIANT[s.status]} className="shrink-0">
                        {t(`seller.offers.status.${s.status}`)}
                      </Badge>
                    </div>
                    <div className="mt-0.5 flex items-center gap-1.5 text-xs text-foreground-secondary">
                      <Badge variant="accent">{t('seller.offers.qps')}</Badge>
                      <span>
                        {s.code} · {s.skuCode}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="mt-2 rounded-md bg-primary-soft p-2.5">
                  <div className="text-xs text-foreground-secondary">{t('seller.offers.kind')}</div>
                  <div className="text-sm font-semibold">{slabSummary(s.slabs, t)}</div>
                </div>
                <div className="mt-2 flex items-center gap-1.5 text-xs text-foreground-secondary">
                  <CalendarDays size={13} />
                  {t('seller.offers.valid').replace('{from}', shortDate(s.validFrom)).replace('{till}', shortDate(s.validTill))}
                </div>
              </button>
            );
          })
        )}
      </div>

      <div className="border-t border-border bg-card p-3 shadow-[var(--shadow-bar-top)]">
        <Button fullWidth onClick={onCreate}>
          {t('seller.offers.create')}
        </Button>
      </div>

      <Sheet
        open={!!open}
        onClose={() => setOpenCode(null)}
        icon={<BadgePercent size={18} />}
        title={openSku?.name ?? open?.code}
        subtitle={open ? `${open.code} · ${t('seller.offers.valid').replace('{from}', shortDate(open.validFrom)).replace('{till}', shortDate(open.validTill))}` : undefined}
        footer={
          open &&
          (open.status === 'EXPIRED' ? (
            <p className="text-center text-sm text-foreground-secondary">{t('seller.offers.expired_note')}</p>
          ) : (
            <div className="flex gap-3">
              <Button className="flex-1" variant={open.status === 'ACTIVE' ? 'secondary' : 'primary'} onClick={() => toggle(open)}>
                {t(open.status === 'ACTIVE' ? 'seller.offers.pause' : 'seller.offers.start')}
              </Button>
              {/* A paused offer is locked on the portal, so editing needs it running. */}
              {open.status === 'ACTIVE' && (
                <Button
                  className="flex-1"
                  onClick={() => {
                    setOpenCode(null);
                    onEdit(open.skuCode);
                  }}
                >
                  {t('seller.offers2.edit')}
                </Button>
              )}
            </div>
          ))
        }
      >
        {open && openSku && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-foreground-secondary">{t('seller.offers.sku_code')}</span>
              <span className="font-semibold">{openSku.code}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-foreground-secondary">{t('seller.offers.validity')}</span>
              <span className="font-semibold">
                {shortDate(open.validFrom)} → {shortDate(open.validTill)}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-foreground-secondary">{t('seller.offers.selling_price')}</span>
              <span className="font-semibold tabular-nums">
                {formatInrExact(openSku.price)} <span className="text-xs font-normal text-foreground-secondary">· {t('seller.offers.mrp')} {formatInrExact(openSku.mrp)}</span>
              </span>
            </div>
            <SlabTable slabs={open.slabs} price={openSku.price} />
            <Badge variant={STATUS_VARIANT[open.status]}>{t(`seller.offers.status.${open.status}`)}</Badge>
          </div>
        )}
      </Sheet>
    </div>
  );
}

/** "24+ → 3% off · 50+ → ₹1 off" — slabs with no discount are left out. */
function slabSummary(slabs: SellerSchemeSlab[], t: (k: string) => string) {
  const paid = slabs.filter((s) => s.discountPct > 0 || !!s.flatOff);
  if (paid.length === 0) return t('seller.offers.no_discount');
  return paid
    .map(
      (s) =>
        `${t('seller.offers.and_above').replace('{n}', String(s.min))} → ${
          s.flatOff ? t('seller.offers2.flat_off').replace('{n}', String(s.flatOff)) : t('seller.offers.off').replace('{n}', String(s.discountPct))
        }`
    )
    .join(' · ');
}

