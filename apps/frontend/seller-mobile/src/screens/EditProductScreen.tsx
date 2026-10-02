import { useState, type ReactNode } from 'react';
import { AlertTriangle, Plus, X } from 'lucide-react';
import { Badge, Button, Chip, FieldError, Input, SegmentedControl, Sheet, Switch, cn } from '@mockups/ui';
import { SelectField, controlClass } from '@mockups/components';
import { sellerSkus } from '@mockups/mock-data';
import { useI18n } from '@mockups/i18n';
import type { SellerSku, SellerSkuDetails } from '@mockups/types';
import { ScreenHeader } from '../components/ScreenHeader';
import { ProductImagesEditor } from '../components/ProductImagesEditor';

/* Edit product — the portal's My SKU form on a phone, section by section.
   Required fields carry a *, an empty one a red "Required", a changed one
   "Edited" — like the portal. Save checks the portal's rules first and lists
   anything to fix; Back with unsaved changes asks before leaving. */

const MEASURE_UNITS: SellerSkuDetails['measureUnit'][] = ['Unit', 'Gram', 'Kilogram', 'Liter', 'Milliliter'];
const WEIGHT_MEASURES: SellerSkuDetails['weightMeasure'][] = ['Gram', 'Kilogram'];
const GST = [0, 5, 12, 18, 28, 40];
const GST_CESS: (number | null)[] = [null, 0, 1, 3, 5, 12, 22];
const ORIGINS = ['India', 'Bangladesh', 'Sri Lanka', 'Nepal', 'Bhutan', 'China', 'Other'];
const CATEGORIES = [...new Set(sellerSkus.map((s) => s.details.categoryId).filter(Boolean))].sort();

interface Draft {
  active: boolean;
  name: string;
  groupName: string;
  shortName: string;
  shortDescription: string;
  longDescription: string;
  measureUnit: SellerSkuDetails['measureUnit'];
  unitValue: string;
  weightMeasure: SellerSkuDetails['weightMeasure'];
  skuWeight: string;
  innerPack: string;
  unitsPerCase: string;
  sellingUnits: number[];
  minQty: string;
  maxQty: string;
  length: string;
  width: string;
  height: string;
  categoryId: string;
  gstPct: number;
  gstCessPct: number | null;
  returnable: boolean;
  cancellable: boolean;
  cod: boolean;
  careName: string;
  carePhone: string;
  careEmail: string;
  brand: string;
  makerAddress: string;
  origin: string;
  images: string[];
}
type Key = keyof Draft;

const fromSku = (s: SellerSku): Draft => {
  const d = s.details;
  return {
    active: s.active,
    name: s.name,
    groupName: d.groupName,
    shortName: s.shortName ?? '',
    shortDescription: d.shortDescription,
    longDescription: d.longDescription,
    measureUnit: d.measureUnit,
    unitValue: String(d.unitValue),
    weightMeasure: d.weightMeasure,
    skuWeight: String(d.skuWeight),
    innerPack: String(d.innerPack),
    unitsPerCase: String(d.unitsPerCase),
    sellingUnits: d.sellingUnits,
    minQty: String(s.minQty),
    maxQty: String(s.maxQty),
    length: String(d.dimensionsCm[0]),
    width: String(d.dimensionsCm[1]),
    height: String(d.dimensionsCm[2]),
    categoryId: d.categoryId,
    gstPct: s.gstPct,
    gstCessPct: d.gstCessPct,
    returnable: s.returnable,
    cancellable: s.cancellable,
    cod: s.cod,
    careName: d.customerCare.name,
    carePhone: d.customerCare.phone,
    careEmail: d.customerCare.email,
    brand: s.brand,
    makerAddress: d.manufacturerAddress,
    origin: d.countryOfOrigin,
    images: d.images,
  };
};

// Which label each draft field carries (seller.pdetail.<label>), for the error list.
const LABEL: Partial<Record<Key, string>> = {
  name: 'sku_name',
  groupName: 'group_name',
  shortName: 'short_name',
  shortDescription: 'short_description',
  longDescription: 'long_description',
  unitValue: 'unit_value',
  skuWeight: 'sku_weight',
  minQty: 'min_qty',
  maxQty: 'max_qty',
  categoryId: 'category_id',
  careName: 'care_name',
  carePhone: 'care_phone',
  careEmail: 'care_email',
  brand: 'brand',
  makerAddress: 'maker_address',
  origin: 'origin',
  images: 'image_count',
};

const num = (v: string) => Number(v);
const positive = (v: string) => v.trim() !== '' && Number.isFinite(num(v)) && num(v) > 0;

export function EditProductScreen({ sku, onBack, onSave }: { sku: SellerSku; onBack: () => void; onSave: (next: SellerSku) => void }) {
  const { t } = useI18n();
  const original = fromSku(sku);
  const [f, setF] = useState<Draft>(original);
  const [tried, setTried] = useState(false);
  const [fixOpen, setFixOpen] = useState(false);
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [newUnit, setNewUnit] = useState('');

  const set = <K extends Key>(k: K, v: Draft[K]) => setF((prev) => ({ ...prev, [k]: v }));
  const edited = (k: Key) => JSON.stringify(f[k]) !== JSON.stringify(original[k]);
  const dirty = (Object.keys(f) as Key[]).some(edited);

  // ── The portal's rules ──
  const errors: Partial<Record<Key, string>> = {};
  const req = t('seller.edit.err.required');
  const len = (k: Key, v: string, min: number, max: number) => {
    if (!v.trim()) errors[k] = req;
    else if (v.trim().length < min || v.trim().length > max)
      errors[k] = t('seller.edit.err.length').replace('{min}', String(min)).replace('{max}', String(max));
  };
  len('name', f.name, 3, 100);
  if (!f.groupName.trim()) errors.groupName = req;
  if (f.shortName.length > 20) errors.shortName = t('seller.edit.err.max').replace('{max}', '20');
  len('shortDescription', f.shortDescription, 10, 150);
  len('longDescription', f.longDescription, 1, 200);
  if (!positive(f.unitValue)) errors.unitValue = t('seller.edit.err.positive');
  if (!positive(f.skuWeight)) errors.skuWeight = t('seller.edit.err.positive');
  if (!positive(f.minQty) || !Number.isInteger(num(f.minQty))) errors.minQty = t('seller.edit.err.whole');
  if (!positive(f.maxQty) || !Number.isInteger(num(f.maxQty))) errors.maxQty = t('seller.edit.err.whole');
  else if (!errors.minQty && num(f.maxQty) < num(f.minQty)) errors.maxQty = t('seller.edit.err.max_ge_min');
  if (!f.categoryId) errors.categoryId = req;
  if (!f.careName.trim()) errors.careName = req;
  if (!f.carePhone.trim()) errors.carePhone = req;
  else if (!/^[6-9]\d{9}$/.test(f.carePhone)) errors.carePhone = t('seller.edit.err.phone');
  if (!f.careEmail.trim()) errors.careEmail = req;
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.careEmail)) errors.careEmail = t('seller.edit.err.email');
  if (!f.brand.trim()) errors.brand = req;
  if (!f.makerAddress.trim()) errors.makerAddress = req;
  else if (f.makerAddress.trim().length < 10 || f.makerAddress.trim().length > 250)
    errors.makerAddress = t('seller.edit.err.length').replace('{min}', '10').replace('{max}', '250');
  else if (!/\b\d{6}\b/.test(f.makerAddress)) errors.makerAddress = t('seller.edit.err.pin');
  if (!f.origin) errors.origin = req;
  if (f.images.length === 0) errors.images = t('seller.edit.err.images');
  const errorKeys = Object.keys(errors) as Key[];

  const kg = positive(f.skuWeight) ? (f.weightMeasure === 'Kilogram' ? num(f.skuWeight) : num(f.skuWeight) / 1000) : 0;
  const volumetric = [f.length, f.width, f.height].every(positive) ? Math.round(((num(f.length) * num(f.width) * num(f.height)) / 5000) * 100) / 100 : 0;

  const save = () => {
    if (errorKeys.length) {
      setTried(true);
      setFixOpen(true);
      return;
    }
    onSave({
      ...sku,
      name: f.name.trim(),
      shortName: f.shortName.trim() || undefined,
      active: f.active,
      minQty: num(f.minQty),
      maxQty: num(f.maxQty),
      gstPct: f.gstPct,
      returnable: f.returnable,
      cancellable: f.cancellable,
      cod: f.cod,
      brand: f.brand.trim(),
      details: {
        ...sku.details,
        groupName: f.groupName.trim(),
        shortDescription: f.shortDescription.trim(),
        longDescription: f.longDescription.trim(),
        measureUnit: f.measureUnit,
        unitValue: num(f.unitValue),
        weightMeasure: f.weightMeasure,
        skuWeight: num(f.skuWeight),
        innerPack: num(f.innerPack) || 1,
        unitsPerCase: num(f.unitsPerCase) || 1,
        sellingUnits: f.sellingUnits,
        dimensionsCm: [num(f.length) || 0, num(f.width) || 0, num(f.height) || 0],
        categoryId: f.categoryId,
        gstCessPct: f.gstCessPct,
        customerCare: { name: f.careName.trim(), phone: f.carePhone.trim(), email: f.careEmail.trim() },
        manufacturerAddress: f.makerAddress.trim(),
        countryOfOrigin: f.origin,
        images: f.images,
      },
    });
  };

  const goToFirstError = () => {
    setFixOpen(false);
    document.getElementById(`edit-${errorKeys[0]}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  // ── Building blocks ──
  // A plain function, not a component: a component defined in here would
  // remount its input on every keystroke and drop the keyboard focus.
  const row = ({ k, label, required, wide = true }: { k: Key; label: string; required?: boolean; wide?: boolean }, children: ReactNode) => {
    const empty = Array.isArray(f[k]) ? (f[k] as unknown[]).length === 0 : String(f[k] ?? '').trim() === '';
    return (
      <div id={`edit-${k}`} className={cn('min-w-0 space-y-1.5', wide && 'col-span-2')}>
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-sm font-medium text-foreground">
            {t(`seller.pdetail.${label}`)}
            {required && <span className="text-error"> *</span>}
          </span>
          {required && empty && <Badge variant="danger">{t('seller.pdetail.required')}</Badge>}
          {edited(k) && <Badge variant="info">{t('seller.edit.edited')}</Badge>}
        </div>
        {children}
        {tried && errors[k] && !(required && empty && errors[k] === req) && <FieldError>{errors[k]}</FieldError>}
      </div>
    );
  };
  const text = (k: Key, opts: { numeric?: boolean; decimal?: boolean; placeholder?: string } = {}) => (
    <Input
      value={f[k] as string}
      inputMode={opts.decimal ? 'decimal' : opts.numeric ? 'numeric' : undefined}
      placeholder={opts.placeholder}
      aria-invalid={(tried && !!errors[k]) || undefined}
      onChange={(e) => set(k, (opts.numeric ? e.target.value.replace(/\D/g, '') : opts.decimal ? e.target.value.replace(/[^\d.]/g, '') : e.target.value) as Draft[typeof k])}
      className={cn(tried && errors[k] && 'border-error')}
    />
  );
  const area = (k: Key, max: number) => (
    <>
      <textarea
        value={f[k] as string}
        rows={3}
        maxLength={max}
        onChange={(e) => set(k, e.target.value as Draft[typeof k])}
        className={cn(controlClass, 'h-auto resize-none py-2 leading-snug outline-none focus:border-primary', tried && errors[k] && 'border-error')}
      />
      <div className="text-right text-[11px] text-foreground-secondary">
        {(f[k] as string).length}/{max}
      </div>
    </>
  );
  const readOnly = (value: ReactNode) => <div className={cn(controlClass, 'bg-input text-foreground-secondary')}>{value}</div>;
  const toggle = (k: 'returnable' | 'cancellable' | 'cod', label: string) => (
    <div id={`edit-${k}`} className="col-span-2 flex items-center justify-between gap-3">
      <span className="flex items-center gap-1.5 text-sm font-medium">
        {t(`seller.pdetail.${label}`)}
        <span className="text-error">*</span>
        {edited(k) && <Badge variant="info">{t('seller.edit.edited')}</Badge>}
      </span>
      <span className="flex items-center gap-2 text-sm">
        <span className="text-foreground-secondary">{t(f[k] ? 'seller.product.yes' : 'seller.product.no')}</span>
        <Switch checked={f[k]} onCheckedChange={(v) => set(k, v)} aria-label={t(`seller.pdetail.${label}`)} />
      </span>
    </div>
  );

  return (
    <div className="flex h-full flex-col">
      <ScreenHeader title={t('seller.edit.title')} onBack={() => (dirty ? setLeaveOpen(true) : onBack())} />

      <div className="no-scrollbar flex-1 space-y-3 overflow-y-auto bg-background-subtle p-3">
        <Card title={t('seller.edit.status')}>
          <div className="col-span-2">
            <SegmentedControl<'on' | 'off'>
              value={f.active ? 'on' : 'off'}
              onChange={(v) => set('active', v === 'on')}
              options={[
                { value: 'on', label: t('seller.edit.active') },
                { value: 'off', label: t('seller.edit.inactive') },
              ]}
            />
            <p className="mt-1.5 text-xs text-foreground-secondary">{t(f.active ? 'seller.edit.active_help' : 'seller.edit.inactive_help')}</p>
          </div>
        </Card>

        <Card title={t('seller.pdetail.section.descriptor')}>
          {row({ k: 'name', label: 'sku_name', required: true }, text('name'))}
          {row({ k: 'groupName', label: 'group_name', required: true }, text('groupName'))}
          <div className="col-span-2 space-y-1.5">
            <span className="text-sm font-medium">{t('seller.pdetail.sku_code')}</span>
            {readOnly(sku.code)}
          </div>
          {row({ k: 'shortName', label: 'short_name' }, text('shortName', { placeholder: t('seller.edit.short_name_hint') }))}
          {row({ k: 'shortDescription', label: 'short_description', required: true }, area('shortDescription', 150))}
          {row({ k: 'longDescription', label: 'long_description', required: true }, area('longDescription', 200))}
        </Card>

        <Card title={t('seller.pdetail.section.quantity')}>
          <div className="col-span-2">
            <SelectField
              label={`${t('seller.pdetail.measure_unit')}`}
              required
              placeholder={t('seller.edit.pick')}
              value={f.measureUnit}
              options={MEASURE_UNITS}
              onChange={(v) => set('measureUnit', v as Draft['measureUnit'])}
            />
          </div>
          {row({ k: 'unitValue', label: 'unit_value', required: true, wide: false }, text('unitValue', { decimal: true }))}
          <div className="min-w-0 space-y-1.5">
            <span className="text-sm font-medium">{t('seller.pdetail.weight_measure')}</span>
            <div className="flex gap-2">
              {WEIGHT_MEASURES.map((w) => (
                <Chip key={w} selected={f.weightMeasure === w} onClick={() => set('weightMeasure', w)}>
                  {w}
                </Chip>
              ))}
            </div>
          </div>
          {row({ k: 'skuWeight', label: 'sku_weight', required: true, wide: false }, text('skuWeight', { decimal: true }))}
          <div className="min-w-0 space-y-1.5">
            <span className="text-sm font-medium">{t('seller.pdetail.weight_kg')}</span>
            {readOnly(`${kg} kg`)}
          </div>
          {row({ k: 'innerPack', label: 'inner_pack', wide: false }, text('innerPack', { numeric: true }))}
          {row({ k: 'unitsPerCase', label: 'units_per_case', wide: false }, text('unitsPerCase', { numeric: true }))}
          {row({ k: 'sellingUnits', label: 'selling_units' }, <div className="flex flex-wrap items-center gap-2">
              {f.sellingUnits.map((u) => (
                <span key={u} className="inline-flex items-center gap-1 rounded-full border border-border bg-card py-1 pl-3 pr-1 text-xs font-medium">
                  {u}
                  <button
                    aria-label={t('seller.edit.remove_unit').replace('{n}', String(u))}
                    onClick={() => set('sellingUnits', f.sellingUnits.filter((x) => x !== u))}
                    className="grid h-6 w-6 place-items-center rounded-full text-foreground-secondary active:bg-muted"
                  >
                    <X size={12} />
                  </button>
                </span>
              ))}
              <span className="flex items-center gap-1">
                <Input
                  value={newUnit}
                  inputMode="numeric"
                  placeholder="12"
                  aria-label={t('seller.edit.add_unit')}
                  onChange={(e) => setNewUnit(e.target.value.replace(/\D/g, ''))}
                  className="h-9 w-16 px-2"
                />
                <Button
                  variant="outlinePrimary"
                  size="sm"
                  disabled={!Number(newUnit) || f.sellingUnits.includes(Number(newUnit))}
                  onClick={() => {
                    set('sellingUnits', [...f.sellingUnits, Number(newUnit)].sort((a, b) => a - b));
                    setNewUnit('');
                  }}
                >
                  <Plus size={14} />
                  {t('seller.edit.add_unit')}
                </Button>
              </span>
            </div>)}
          {row({ k: 'minQty', label: 'min_qty', required: true, wide: false }, text('minQty', { numeric: true }))}
          {row({ k: 'maxQty', label: 'max_qty', required: true, wide: false }, text('maxQty', { numeric: true }))}
        </Card>

        <Card title={t('seller.pdetail.section.dimensions')} help={t('seller.edit.cm')}>
          {row({ k: 'length', label: 'length', wide: false }, text('length', { decimal: true }))}
          {row({ k: 'width', label: 'width', wide: false }, text('width', { decimal: true }))}
          {row({ k: 'height', label: 'height', wide: false }, text('height', { decimal: true }))}
          <div className="min-w-0 space-y-1.5">
            <span className="text-sm font-medium">{t('seller.pdetail.volumetric')}</span>
            {readOnly(`${volumetric} kg`)}
          </div>
        </Card>

        <Card title={t('seller.pdetail.section.category')}>
          <div id="edit-categoryId" className="col-span-2">
            <SelectField
              label={t('seller.pdetail.category_id')}
              required
              placeholder={t('seller.edit.pick')}
              value={f.categoryId}
              options={CATEGORIES}
              onChange={(v) => set('categoryId', v)}
            />
            {tried && errors.categoryId && <FieldError>{errors.categoryId}</FieldError>}
          </div>
          {row({ k: 'gstPct', label: 'gst', required: true }, <div className="flex flex-wrap gap-2">
              {GST.map((g) => (
                <Chip key={g} selected={f.gstPct === g} onClick={() => set('gstPct', g)}>
                  {g}%
                </Chip>
              ))}
            </div>)}
          {row({ k: 'gstCessPct', label: 'gst_cess' }, <div className="flex flex-wrap gap-2">
              {GST_CESS.map((g) => (
                <Chip key={String(g)} selected={f.gstCessPct === g} onClick={() => set('gstCessPct', g)}>
                  {g === null ? '—' : `${g}%`}
                </Chip>
              ))}
            </div>)}
          <div className="min-w-0 space-y-1.5">
            <span className="text-sm font-medium">{t('seller.pdetail.fulfillment_id')}</span>
            {readOnly(sku.details.fulfillmentId)}
          </div>
          <div className="min-w-0 space-y-1.5">
            <span className="text-sm font-medium">{t('seller.pdetail.location_id')}</span>
            {readOnly(<span className="truncate">{sku.details.locationId}</span>)}
          </div>
        </Card>

        <Card title={t('seller.pdetail.section.ondc')}>
          {toggle('returnable', 'returnable')}
          {toggle('cancellable', 'cancellable')}
          {toggle('cod', 'cod')}
          <div className="col-span-2 space-y-1.5">
            <span className="text-sm font-medium">{t('seller.pdetail.time_to_ship')}</span>
            {readOnly(sku.details.timeToShip)}
            <p className="text-[11px] text-foreground-secondary">{t('seller.edit.from_settings')}</p>
          </div>
          {row({ k: 'careName', label: 'care_name', required: true }, text('careName'))}
          {row({ k: 'carePhone', label: 'care_phone', required: true }, text('carePhone', { numeric: true, placeholder: '9XXXXXXXXX' }))}
          {row({ k: 'careEmail', label: 'care_email', required: true }, text('careEmail'))}
        </Card>

        <Card title={t('seller.pdetail.section.company')}>
          <div className="col-span-2 space-y-1.5">
            <span className="text-sm font-medium">{t('seller.pdetail.maker_name')}</span>
            {readOnly(sku.company)}
          </div>
          {row({ k: 'brand', label: 'brand', required: true }, text('brand'))}
          {row({ k: 'makerAddress', label: 'maker_address', required: true }, area('makerAddress', 250))}
        </Card>

        <Card title={t('seller.pdetail.section.tags')}>
          {row({ k: 'origin', label: 'origin', required: true }, <div className="flex flex-wrap gap-2">
              {ORIGINS.map((o) => (
                <Chip key={o} selected={f.origin === o} onClick={() => set('origin', o)}>
                  {o}
                </Chip>
              ))}
            </div>)}
        </Card>

        <Card title={t('seller.pdetail.section.images')}>
          {row({ k: 'images', label: 'image_count', required: true }, <ProductImagesEditor images={f.images} onChange={(images) => set('images', images)} alt={f.name} />)}
        </Card>
      </div>

      <div className="flex gap-3 border-t border-border bg-card p-3 shadow-[var(--shadow-bar-top)]">
        <Button
          variant="secondary"
          className="flex-1"
          disabled={!dirty}
          onClick={() => {
            setF(original);
            setTried(false);
          }}
        >
          {t('seller.edit.reset')}
        </Button>
        <Button className="flex-[2]" disabled={!dirty} onClick={save}>
          {t('seller.edit.save')}
        </Button>
      </div>

      {/* Like the portal's "Some changes need fixing" dialog */}
      <Sheet
        open={fixOpen}
        onClose={() => setFixOpen(false)}
        icon={<AlertTriangle size={18} />}
        iconClassName="bg-error-subtle text-error-foreground"
        title={t('seller.edit.fix_title')}
        subtitle={t('seller.edit.fix_help').replace('{n}', String(errorKeys.length))}
        footer={
          <Button fullWidth onClick={goToFirstError}>
            {t('seller.edit.fix_ok')}
          </Button>
        }
      >
        <ul className="divide-y divide-border rounded-lg border border-border">
          {errorKeys.map((k) => (
            <li key={k} className="px-3 py-2.5 text-sm">
              <div className="font-medium">{LABEL[k] ? t(`seller.pdetail.${LABEL[k]}`) : k}</div>
              <div className="text-xs text-error-foreground">{errors[k]}</div>
            </li>
          ))}
        </ul>
      </Sheet>

      <Sheet
        open={leaveOpen}
        onClose={() => setLeaveOpen(false)}
        title={t('seller.edit.leave_title')}
        subtitle={t('seller.edit.leave_help')}
        footer={
          <div className="flex gap-3">
            <Button variant="secondary" fullWidth onClick={() => setLeaveOpen(false)}>
              {t('seller.edit.stay')}
            </Button>
            <Button variant="destructive" fullWidth onClick={onBack}>
              {t('seller.edit.leave')}
            </Button>
          </div>
        }
      />
    </div>
  );
}

function Card({ title, help, children }: { title: string; help?: string; children: ReactNode }) {
  return (
    <section className="rounded-lg border border-border bg-card shadow-sm">
      <div className="border-b border-border px-3 py-2.5">
        <div className="text-sm font-semibold">{title}</div>
        {help && <div className="text-xs text-foreground-secondary">{help}</div>}
      </div>
      <div className="grid grid-cols-2 gap-x-3 gap-y-4 p-3">{children}</div>
    </section>
  );
}
