import { useState } from 'react';
import { EyeOff, Pencil, Tag } from 'lucide-react';
import { Badge, Button, InlineMessage, Sheet, Switch } from '@mockups/ui';
import { formatInrExact } from '@mockups/components';
import { useI18n } from '@mockups/i18n';
import type { SellerScheme, SellerSku } from '@mockups/types';
import { ScreenHeader } from '../components/ScreenHeader';
import { ProductThumb } from '../components/ProductThumb';
import { isCompliant } from '../catalog';
import { formatDay } from '../format';
import { SlabTable } from '../components/SlabTable';
import { ProductDetailsSections } from '../components/ProductDetailsSections';
import { ImageViewer } from '../components/ImageViewer';

const OFFER_BADGE = { ACTIVE: 'success', INACTIVE: 'neutral', EXPIRED: 'danger' } as const;

/* One product. Two main actions — Edit price and the In stock switch — in
   one card; "Edit product" at the bottom opens the full form, pictures included. Hiding a product is rare and risky, so it is a quiet link at the
   bottom that asks first; a hidden product says so at the top with one
   "Show again" button. The full ONDC details form stays on the web portal. */
export function ProductDetailScreen({
  sku,
  scheme,
  onBack,
  onEditPrice,
  onSetStock,
  onSetActive,
  onCreateOffer,
  onOpenOffers,
  onEdit,
}: {
  sku: SellerSku;
  scheme?: SellerScheme;
  onBack: () => void;
  onEditPrice: () => void;
  onSetStock: (inStock: boolean) => void;
  onSetActive: (active: boolean) => void;
  onCreateOffer: () => void;
  onOpenOffers: () => void;
  onEdit: () => void;
}) {
  const { t } = useI18n();
  const [confirmHide, setConfirmHide] = useState(false);
  const [viewing, setViewing] = useState<number | null>(null);
  const pictures = sku.details.images;

  return (
    <div className="flex h-full flex-col">
      <ScreenHeader title={sku.code} onBack={onBack} />

      <div className="no-scrollbar flex-1 space-y-3 overflow-y-auto bg-background-subtle p-3">
        {/* The product */}
        <section className="flex gap-3 rounded-lg border border-border bg-card p-3 shadow-sm">
          {/* Tap the picture to see all of them full size. */}
          <button onClick={() => pictures.length && setViewing(0)} className="relative shrink-0" aria-label={t('seller.product.view_photos')}>
            <ProductThumb productId={sku.productId} image={pictures[0]} alt={sku.name} size="lg" />
            {pictures.length > 1 && (
              <span className="absolute bottom-1 right-1 rounded bg-card px-1 text-[10px] font-semibold text-foreground shadow-sm">1/{pictures.length}</span>
            )}
          </button>
          <div className="min-w-0">
            <div className="text-base font-semibold leading-snug">{sku.name}</div>
            <div className="mt-0.5 text-xs text-foreground-secondary">
              {sku.brand} · {sku.category} · {sku.pack}
            </div>
            {!sku.active && (
              <Badge variant="neutral" className="mt-1.5">
                {t('seller.products.badge.inactive')}
              </Badge>
            )}
          </div>
        </section>

        {!sku.active && (
          <InlineMessage
            variant="warning"
            title={t('seller.product.hidden_title')}
            description={t('seller.product.hidden')}
            action={
              <Button size="sm" variant="soft" onClick={() => onSetActive(true)}>
                {t('seller.product.show_again')}
              </Button>
            }
          />
        )}

        {!isCompliant(sku) && (
          <InlineMessage
            variant="error"
            title={t('seller.product.missing_title')}
            description={
              <>
                <ul className="mt-1 list-disc space-y-0.5 pl-4">
                  {sku.missingFields.map((f) => (
                    <li key={f}>{f}</li>
                  ))}
                </ul>
                <span className="mt-1.5 block">{t('seller.product.missing_help')}</span>
              </>
            }
          />
        )}

        {/* Price & stock — the everyday changes */}
        <section className="rounded-lg border border-border bg-card shadow-sm">
          <div className="border-b border-border px-3 py-2.5 text-sm font-semibold">{t('seller.product.price_stock')}</div>
          <div className="flex items-end justify-between gap-3 p-3">
            <div>
              <div className="text-xs text-foreground-secondary">{t('seller.product.selling_price')}</div>
              <div className="text-xl font-bold tabular-nums">{formatInrExact(sku.price)}</div>
              <div className="text-xs text-foreground-secondary">
                {t('seller.product.mrp')} <span className="tabular-nums">{formatInrExact(sku.mrp)}</span>
              </div>
            </div>
            <Button variant="outlinePrimary" size="sm" onClick={onEditPrice}>
              {t('seller.product.edit_price')}
            </Button>
          </div>
          <SwitchRow
            label={t(sku.inStock ? 'seller.product.in_stock' : 'seller.product.out_of_stock')}
            help={t('seller.product.stock_help')}
            checked={sku.inStock}
            tone={sku.inStock ? 'text-success-foreground' : 'text-warning-foreground'}
            onChange={onSetStock}
          />
        </section>

        {/* Offer */}
        <section className="rounded-lg border border-border bg-card shadow-sm">
          <div className="flex items-center justify-between gap-2 border-b border-border px-3 py-2.5">
            <span className="flex items-center gap-2 text-sm font-semibold">
              <Tag size={16} className="text-primary" />
              {t('seller.product.offer_title')}
            </span>
            {scheme && <Badge variant={OFFER_BADGE[scheme.status]}>{t(`seller.product.offer_status.${scheme.status}`)}</Badge>}
          </div>
          {scheme ? (
            <div className="space-y-3 p-3">
              <SlabTable slabs={scheme.slabs} price={sku.price} />
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-foreground-secondary">
                  {scheme.code} · {formatDay(scheme.validFrom)} – {formatDay(scheme.validTill)}
                </span>
                <Button variant="ghost" size="sm" className="text-primary" onClick={onOpenOffers}>
                  {t('seller.product.see_offers')}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3 p-3">
              <div>
                <div className="text-sm font-medium">{t('seller.product.no_offer')}</div>
                <div className="text-xs text-foreground-secondary">
                  {sku.active ? t('seller.product.no_offer_help') : t('seller.product.offer_needs_active')}
                </div>
              </div>
              <Button fullWidth variant="outlinePrimary" disabled={!sku.active} onClick={onCreateOffer}>
                {t('seller.product.create_offer')}
              </Button>
            </div>
          )}
        </section>

        {/* The rest of the portal's product form — read-only, in its sections */}
        <ProductDetailsSections sku={sku} onViewImage={setViewing} />

        {sku.active && (
          <button onClick={() => setConfirmHide(true)} className="mx-auto flex items-center gap-1.5 py-2 text-sm font-semibold text-error-foreground">
            <EyeOff size={15} />
            {t('seller.product.hide_link')}
          </button>
        )}
      </div>

      {/* The update option for everything that isn't price, stock or offer. */}
      <div className="border-t border-border bg-card p-3 shadow-[var(--shadow-bar-top)]">
        <Button fullWidth onClick={onEdit}>
          <Pencil size={16} />
          {t('seller.product.edit_product')}
        </Button>
      </div>

      <ImageViewer images={pictures} start={viewing} onClose={() => setViewing(null)} />

      <Sheet
        open={confirmHide}
        onClose={() => setConfirmHide(false)}
        icon={<EyeOff size={18} />}
        iconClassName="bg-error-subtle text-error-foreground"
        title={t('seller.product.hide_title')}
        subtitle={sku.name}
        footer={
          <div className="flex gap-3">
            <Button variant="secondary" fullWidth onClick={() => setConfirmHide(false)}>
              {t('seller.action.go_back')}
            </Button>
            <Button
              variant="destructive"
              fullWidth
              onClick={() => {
                setConfirmHide(false);
                onSetActive(false);
              }}
            >
              {t('seller.product.hide_cta')}
            </Button>
          </div>
        }
      >
        <p className="text-sm text-foreground-secondary">{t('seller.product.hide_help')}</p>
      </Sheet>
    </div>
  );
}

function SwitchRow({
  label,
  help,
  checked,
  tone,
  onChange,
}: {
  label: string;
  help: string;
  checked: boolean;
  tone?: string;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center gap-3 border-t border-border p-3">
      <div className="min-w-0 flex-1">
        <div className={tone ? `text-sm font-semibold ${tone}` : 'text-sm font-semibold'}>{label}</div>
        <div className="text-xs text-foreground-secondary">{help}</div>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} aria-label={label} />
    </div>
  );
}
