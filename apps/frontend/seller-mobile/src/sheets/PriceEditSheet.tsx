import { useState } from 'react';
import { IndianRupee } from 'lucide-react';
import { Button, FieldError, Input, Sheet } from '@mockups/ui';

import { useI18n } from '@mockups/i18n';
import type { SellerScheme, SellerSku } from '@mockups/types';
import { SlabTable } from '../components/SlabTable';

/* Edit price — selling price and MRP, with the portal's checks. When the
   product has an offer, the buyer's slab prices move with the selling price,
   so the sheet shows them before the seller saves (the portal's "Active
   offers mapped to this SKU" step, folded into one sheet). */
export function PriceEditSheet({
  sku,
  scheme,
  onClose,
  onSave,
}: {
  sku: SellerSku | null;
  scheme?: SellerScheme;
  onClose: () => void;
  onSave: (mrp: number, price: number) => void;
}) {
  const { t } = useI18n();
  const [forCode, setForCode] = useState<string | null>(null);
  const [price, setPrice] = useState('');
  const [mrp, setMrp] = useState('');
  const [tried, setTried] = useState(false);

  // Reset the fields whenever a different product opens the sheet.
  if (sku && sku.code !== forCode) {
    setForCode(sku.code);
    setPrice(String(sku.price));
    setMrp(String(sku.mrp));
    setTried(false);
  }

  const p = Number(price);
  const m = Number(mrp);
  const priceError = !(p > 0) ? t('seller.product.must_be_positive') : '';
  const mrpError = !(m > 0) ? t('seller.product.must_be_positive') : m < p ? t('seller.product.mrp_too_low') : '';
  const valid = !priceError && !mrpError;
  const priceChanged = !!sku && p > 0 && p !== sku.price;

  const close = () => {
    setForCode(null);
    onClose();
  };
  const save = () => {
    setTried(true);
    if (!valid) return;
    onSave(m, p);
    setForCode(null);
  };

  return (
    <Sheet
      open={!!sku}
      onClose={close}
      icon={<IndianRupee size={18} />}
      title={t('seller.product.price_title')}
      subtitle={sku ? `${sku.name} · ${sku.pack}` : undefined}
      footer={
        <div className="flex gap-3">
          <Button variant="secondary" fullWidth onClick={close}>
            {t('seller.action.go_back')}
          </Button>
          <Button fullWidth onClick={save}>
            {t('seller.product.save_price')}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <PriceField label={t('seller.product.selling_price')} value={price} onChange={setPrice} error={tried ? priceError : ''} />
        <PriceField label={t('seller.product.mrp')} value={mrp} onChange={setMrp} error={tried ? mrpError : ''} />
        <p className="text-xs text-foreground-secondary">{t('seller.product.price_help')}</p>

        {scheme && sku && priceChanged && (
          <div className="space-y-2">
            <div className="text-sm font-semibold">{t('seller.product.impact_title')}</div>
            <SlabTable slabs={scheme.slabs} price={sku.price} newPrice={p} />
          </div>
        )}
      </div>
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
