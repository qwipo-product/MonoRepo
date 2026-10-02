import type { ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import { Badge } from '@mockups/ui';
import { useI18n } from '@mockups/i18n';
import type { SellerSku } from '@mockups/types';
import { formatDay } from '../format';
import { ProductThumb } from './ProductThumb';

interface Field {
  key: string; // seller.pdetail.<key> label
  value: ReactNode;
  required?: boolean;
  wide?: boolean; // long text takes the full row
}

/* Every field of the portal's product form, read-only, in the portal's own
   sections. Sections start closed so the page stays short; one with an
   empty required field opens by itself and marks it "Required" — the same
   fields that make a product "Details missing". */
export function ProductDetailsSections({ sku, onViewImage }: { sku: SellerSku; onViewImage: (index: number) => void }) {
  const { t } = useI18n();
  const d = sku.details;
  const yes = (b: boolean) => t(b ? 'seller.product.yes' : 'seller.product.no');
  const kg = d.weightMeasure === 'Kilogram' ? d.skuWeight : d.skuWeight / 1000;
  const [l, w, h] = d.dimensionsCm;

  const sections: { key: string; fields: Field[]; extra?: ReactNode }[] = [
    {
      key: 'descriptor',
      fields: [
        { key: 'sku_name', value: sku.name, required: true, wide: true },
        { key: 'group_name', value: d.groupName, required: true },
        { key: 'sku_code', value: sku.code, required: true },
        { key: 'short_name', value: sku.shortName ?? '' },
        { key: 'short_description', value: d.shortDescription, required: true, wide: true },
        { key: 'long_description', value: d.longDescription, required: true, wide: true },
      ],
    },
    {
      key: 'quantity',
      fields: [
        { key: 'measure_unit', value: d.measureUnit, required: true },
        { key: 'unit_value', value: d.unitValue, required: true },
        { key: 'weight_measure', value: d.weightMeasure },
        { key: 'sku_weight', value: d.skuWeight, required: true },
        { key: 'inner_pack', value: d.innerPack },
        { key: 'units_per_case', value: d.unitsPerCase },
        { key: 'selling_units', value: d.sellingUnits.join(', ') },
        { key: 'weight_kg', value: `${kg} kg` },
        { key: 'min_qty', value: sku.minQty, required: true },
        { key: 'max_qty', value: sku.maxQty, required: true },
      ],
    },
    {
      key: 'dimensions',
      fields: [
        { key: 'length', value: `${l} cm` },
        { key: 'width', value: `${w} cm` },
        { key: 'height', value: `${h} cm` },
        { key: 'volumetric', value: `${Math.round(((l * w * h) / 5000) * 100) / 100} kg` },
      ],
    },
    {
      key: 'category',
      fields: [
        { key: 'category_id', value: d.categoryId, required: true },
        { key: 'gst', value: `${sku.gstPct}%`, required: true },
        { key: 'gst_cess', value: d.gstCessPct === null ? '—' : `${d.gstCessPct}%` },
        { key: 'fulfillment_id', value: d.fulfillmentId, required: true },
        { key: 'location_id', value: d.locationId, wide: true },
      ],
    },
    {
      key: 'ondc',
      fields: [
        { key: 'returnable', value: yes(sku.returnable), required: true },
        { key: 'cancellable', value: yes(sku.cancellable), required: true },
        { key: 'cod', value: yes(sku.cod), required: true },
        { key: 'time_to_ship', value: d.timeToShip, required: true },
        { key: 'care_name', value: d.customerCare.name, required: true },
        { key: 'care_phone', value: d.customerCare.phone, required: true },
        { key: 'care_email', value: d.customerCare.email, required: true, wide: true },
      ],
    },
    {
      key: 'company',
      fields: [
        { key: 'maker_name', value: sku.company, required: true, wide: true },
        { key: 'brand', value: sku.brand, required: true },
        { key: 'maker_address', value: d.manufacturerAddress, required: true, wide: true },
      ],
    },
    { key: 'tags', fields: [{ key: 'origin', value: d.countryOfOrigin, required: true }] },
    {
      key: 'images',
      fields: [{ key: 'image_count', value: d.images.length ? `${d.images.length} / 5` : '', required: true }],
      extra: d.images.length > 0 && (
        <div className="flex gap-2 px-3 pb-3">
          {d.images.map((img, i) => (
            <button key={i} onClick={() => onViewImage(i)} aria-label={`${sku.name} ${i + 1}`}>
              <ProductThumb image={img} alt={sku.name} />
            </button>
          ))}
        </div>
      ),
    },
  ];

  const empty = (f: Field) => f.value === '' || f.value === null || f.value === undefined;

  return (
    <section className="rounded-lg border border-border bg-card shadow-sm">
      <div className="border-b border-border px-3 py-2.5">
        <div className="text-sm font-semibold">{t('seller.product.details')}</div>
        <div className="text-xs text-foreground-secondary">
          {t('seller.pdetail.updated').replace('{date}', formatDay(sku.updatedAt))} · {t('seller.pdetail.edit_on_web')}
        </div>
      </div>
      {sections.map((sec) => {
        const missing = sec.fields.filter((f) => f.required && empty(f)).length;
        return (
          <details key={sec.key} open={missing > 0} className="group border-b border-border last:border-b-0">
            <summary className="flex cursor-pointer list-none items-center gap-2 px-3 py-3 text-sm font-medium [&::-webkit-details-marker]:hidden">
              <span className="flex-1">{t(`seller.pdetail.section.${sec.key}`)}</span>
              {missing > 0 && <Badge variant="danger">{t('seller.pdetail.missing_n').replace('{n}', String(missing))}</Badge>}
              <ChevronDown size={16} className="text-foreground-secondary transition-transform group-open:rotate-180" />
            </summary>
            <dl className="grid grid-cols-2 gap-x-3 gap-y-3 px-3 pb-3 text-xs">
              {sec.fields.map((f) => (
                <div key={f.key} className={f.wide ? 'col-span-2 min-w-0' : 'min-w-0'}>
                  <dt className="text-foreground-secondary">{t(`seller.pdetail.${f.key}`)}</dt>
                  <dd className="mt-0.5 font-semibold text-foreground">
                    {empty(f) ? (
                      f.required ? <Badge variant="danger">{t('seller.pdetail.required')}</Badge> : '—'
                    ) : (
                      f.value
                    )}
                  </dd>
                </div>
              ))}
            </dl>
            {sec.extra}
          </details>
        );
      })}
    </section>
  );
}
