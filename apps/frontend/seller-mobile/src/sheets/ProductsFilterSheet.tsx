import { Button, Chip, Sheet } from '@mockups/ui';
import { useI18n } from '@mockups/i18n';

export interface ProductPicks {
  categories: string[];
  brands: string[];
}

/* The one filter panel for Products — the portal's Category and Brand
   (both multi-pick). Status stays as the chips on the list. Changes apply
   as you tap; Clear empties both. */
export function ProductsFilterSheet({
  open,
  categories,
  brands,
  value,
  onChange,
  onClose,
}: {
  open: boolean;
  categories: string[];
  brands: string[];
  value: ProductPicks;
  onChange: (next: ProductPicks) => void;
  onClose: () => void;
}) {
  const { t } = useI18n();
  const flip = (list: string[], v: string) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);
  const count = value.categories.length + value.brands.length;
  return (
    <Sheet
      open={open}
      onClose={onClose}
      size="tall"
      title={t('seller.offers2.filter_title')}
      footer={
        <div className="flex gap-3">
          <Button variant="secondary" fullWidth disabled={count === 0} onClick={() => onChange({ categories: [], brands: [] })}>
            {t('seller.offers2.clear')}
          </Button>
          <Button fullWidth onClick={onClose}>
            {t('seller.offers2.show_results')}
          </Button>
        </div>
      }
    >
      <div className="space-y-5">
        <Group title={t('seller.offers2.category')} options={categories} picked={value.categories} onPick={(c) => onChange({ ...value, categories: flip(value.categories, c) })} />
        <Group title={t('seller.offers2.brand')} options={brands} picked={value.brands} onPick={(b) => onChange({ ...value, brands: flip(value.brands, b) })} />
      </div>
    </Sheet>
  );
}

function Group({ title, options, picked, onPick }: { title: string; options: string[]; picked: string[]; onPick: (v: string) => void }) {
  return (
    <section className="space-y-2">
      <h3 className="text-sm font-semibold">{title}</h3>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <Chip key={o} selected={picked.includes(o)} onClick={() => onPick(o)}>
            {o}
          </Chip>
        ))}
      </div>
    </section>
  );
}
