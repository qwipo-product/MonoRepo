import { useState } from 'react';
import { IndianRupee } from 'lucide-react';
import { Badge, Button, FieldError, Input, Sheet } from '@mockups/ui';
import { formatInrExact } from '@mockups/components';
import { useI18n } from '@mockups/i18n';
import type { SellerScheme, SellerSku } from '@mockups/types';
import { PRICE_MAX } from '../catalog';
import { SlabTable } from '../components/SlabTable';

/* Edit price — selling price and MRP, with the portal's checks. When the
   selling price changes and the product has live or paused offers, Save
   goes to a second step first — the portal's "Active offers mapped to this
   SKU": old → new base price, and every offer's slab prices before and
   after, then Confirm & Save. */
export function PriceEditSheet({
  sku,
  schemes,
  onClose,
  onSave,
}: {
  sku: SellerSku | null;
  /** The product's non-expired offers. */
  schemes: SellerScheme[];
  onClose: () => void;
  onSave: (mrp: number, price: number) => void;
}) {
  const { t } = useI18n();
  const [forCode, setForCode] = useState<string | null>(null);
  const [price, setPrice] = useState('');
  const [mrp, setMrp] = useState('');
  const [tried, setTried] = useState(false);
  const [confirming, setConfirming] = useState(false);

  // Reset the fields whenever a different product opens the sheet.
  if (sku && sku.code !== forCode) {
    setForCode(sku.code);
    setPrice(String(sku.price));
    setMrp(String(sku.mrp));
    setTried(false);
    setConfirming(false);
  }

  const p = Number(price);
  const m = Number(mrp);
  const tooHigh = t('seller.offers2.price_max').replace('{max}', formatInrExact(PRICE_MAX));
  const priceError = !(p > 0) ? t('seller.product.must_be_positive') : p > PRICE_MAX ? tooHigh : '';
  const mrpError = !(m > 0) ? t('seller.product.must_be_positive') : m > PRICE_MAX ? tooHigh : m < p ? t('seller.product.mrp_too_low') : '';
  const valid = !priceError && !mrpError;
  const priceChanged = !!sku && p > 0 && p !== sku.price;

  const close = () => {
    setForCode(null);
    onClose();
  };
  const commit = () => {
    onSave(m, p);
    setForCode(null);
  };
  const save = () => {
    setTried(true);
    if (!valid) return;
    if (priceChanged && schemes.length > 0) setConfirming(true);
    else commit();
  };

  return (
    <Sheet
      open={!!sku}
      onClose={close}
      icon={<IndianRupee size={18} />}
      title={confirming ? t('seller.offers2.impact_title') : t('seller.product.price_title')}
      subtitle={sku ? `${sku.name} · ${sku.pack}` : undefined}
      size={confirming ? 'tall' : 'auto'}
      footer={
        confirming ? (
          <div className="flex gap-3">
            <Button variant="secondary" fullWidth onClick={() => setConfirming(false)}>
              {t('seller.action.go_back')}
            </Button>
            <Button fullWidth onClick={commit}>
              {t('seller.offers2.confirm_save')}
            </Button>
          </div>
        ) : (
          <div className="flex gap-3">
            <Button variant="secondary" fullWidth onClick={close}>
              {t('seller.action.go_back')}
            </Button>
            <Button fullWidth onClick={save}>
              {t('seller.product.save_price')}
            </Button>
          </div>
        )
      }
    >
      {sku && confirming ? (
        <div className="space-y-4">
          <p className="text-sm text-foreground-secondary">{t('seller.offers2.impact_help')}</p>
          <div className="flex items-center justify-between rounded-md bg-primary-soft p-3 text-sm">
            <span className="text-foreground-secondary">{t('seller.offers2.base_price')}</span>
            <span className="font-semibold tabular-nums">
              {formatInrExact(sku.price)} → {formatInrExact(p)}
            </span>
          </div>
          {schemes.map((sc) => (
            <div key={sc.code} className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-semibold">
                {sc.code}
                <Badge variant={sc.status === 'ACTIVE' ? 'success' : 'neutral'}>{t(`seller.offers.status.${sc.status}`)}</Badge>
              </div>
              <SlabTable slabs={sc.slabs} price={sku.price} newPrice={p} />
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          <PriceField label={t('seller.product.selling_price')} value={price} onChange={setPrice} error={tried ? priceError : ''} />
          <PriceField label={t('seller.product.mrp')} value={mrp} onChange={setMrp} error={tried ? mrpError : ''} />
          <p className="text-xs text-foreground-secondary">{t('seller.product.price_help')}</p>
          {priceChanged && schemes.length > 0 && (
            <p className="text-xs font-medium text-warning-foreground">
              {t(schemes.length === 1 ? 'seller.offers2.has_offers_one' : 'seller.offers2.has_offers_many').replace('{n}', String(schemes.length))}
            </p>
          )}
        </div>
      )}
    </Sheet>
  );
}

function PriceField({ label, value, onChange, error }: { label: string; value: string; onChange: (v: string) => void; error: string }) {
  return (
    <label className="block space-y-1.5">
      <span className="block text-sm font-medium">{label}</span>
      <span className="relative block">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-foreground-secondary">₹</span>
        <Input
          inputMode="decimal"
          value={value}
          aria-label={label}
          aria-invalid={!!error || undefined}
          onChange={(e) => onChange(e.target.value.replace(/[^\d.]/g, ''))}
          className="pl-7 text-base font-semibold tabular-nums"
        />
      </span>
      <FieldError>{error}</FieldError>
    </label>
  );
}
