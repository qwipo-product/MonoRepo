import { Tag } from 'lucide-react';
import { Badge, Button, Sheet } from '@mockups/ui';
import { formatInrExact } from '@mockups/components';
import { useI18n } from '@mockups/i18n';
import type { SellerScheme, SellerSku } from '@mockups/types';
import { TODAY } from '../catalog';
import { nextOfferCode, useOfferDraft } from '../offerDraft';
import { OfferForm } from '../components/OfferForm';
import { ProductThumb } from '../components/ProductThumb';

/* Quick offer — opened from a product row or the Offers page. With a live
   offer: change its slabs or end date, or pause it. A paused offer is locked
   (as on the portal) — Start offer is the only change. ₹-off offers made on
   the web show read-only. Without an offer: two slabs filled in, Create. */
export function OfferSheet({
  sku,
  scheme,
  schemes,
  onClose,
  onCreate,
  onUpdate,
}: {
  sku: SellerSku | null; // null = closed
  scheme?: SellerScheme; // the live or paused offer on this product
  schemes: SellerScheme[];
  onClose: () => void;
  onCreate: (scheme: SellerScheme) => void;
  onUpdate: (code: string, patch: Partial<SellerScheme>) => void;
}) {
  return (
    <Sheet open={!!sku} onClose={onClose} size="tall" icon={<Tag size={18} />} title={sku?.name} subtitle={sku && `${sku.pack} · ${formatInrExact(sku.price)}`}>
      {/* Keyed so the form starts fresh for each product. */}
      {sku && <OfferBody key={`${sku.code}-${scheme?.code ?? 'new'}`} sku={sku} scheme={scheme} schemes={schemes} onCreate={onCreate} onUpdate={onUpdate} />}
    </Sheet>
  );
}

function OfferBody({
  sku,
  scheme,
  schemes,
  onCreate,
  onUpdate,
}: {
  sku: SellerSku;
  scheme?: SellerScheme;
  schemes: SellerScheme[];
  onCreate: (scheme: SellerScheme) => void;
  onUpdate: (code: string, patch: Partial<SellerScheme>) => void;
}) {
  const { t } = useI18n();
  const draft = useOfferDraft(scheme);
  const check = (then: () => void) => {
    if (!draft.valid) draft.setShowErrors(true);
    else then();
  };

  return (
    <div className="space-y-3 pb-2">
      <div className="flex items-center gap-3">
        <ProductThumb productId={sku.productId} alt={sku.name} />
        <div className="min-w-0 flex-1 text-xs text-foreground-secondary">
          {scheme ? (
            <span className="flex items-center gap-1.5">
              <Badge variant={scheme.status === 'ACTIVE' ? 'success' : 'neutral'}>{t(`seller.offers.status.${scheme.status}`)}</Badge>
              {scheme.code}
            </span>
          ) : (
            t('seller.quick.no_offer_yet')
          )}
        </div>
      </div>

      {!sku.active ? (
        <p className="rounded-md bg-muted p-3 text-sm text-foreground-secondary">{t('seller.product.offer_needs_active')}</p>
      ) : !(sku.price > 0 && sku.mrp > 0) ? (
        // The portal won't save an offer on a product without a price.
        <p className="rounded-md bg-muted p-3 text-sm text-foreground-secondary">{t('seller.offers2.needs_price')}</p>
      ) : (
        <>
          <OfferForm draft={draft} price={sku.price} />
          {scheme ? (
            scheme.status === 'INACTIVE' ? (
              // Paused offers are locked on the portal — starting it is the only change.
              <Button fullWidth onClick={() => onUpdate(scheme.code, { status: 'ACTIVE' })}>
                {t('seller.quick.start')}
              </Button>
            ) : (
              <div className="flex gap-3">
                <Button variant="secondary" className="flex-1" onClick={() => onUpdate(scheme.code, { status: 'INACTIVE' })}>
                  {t('seller.quick.pause')}
                </Button>
                {!draft.locked && (
                  <Button className="flex-[2]" onClick={() => check(() => onUpdate(scheme.code, { slabs: draft.slabs, validTill: draft.validTill }))}>
                    {t('seller.quick.save_offer')}
                  </Button>
                )}
              </div>
            )
          ) : (
            <Button
              fullWidth
              onClick={() =>
                check(() =>
                  onCreate({
                    code: nextOfferCode(schemes),
                    skuCode: sku.code,
                    validFrom: TODAY,
                    validTill: draft.validTill,
                    status: draft.startNow ? 'ACTIVE' : 'INACTIVE',
                    slabs: draft.slabs,
                  })
                )
              }
            >
              {t('seller.offers.create')}
            </Button>
          )}
        </>
      )}
    </div>
  );
}
