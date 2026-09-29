import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { Building2, Upload } from 'lucide-react';

import { Button, Card, CardContent, CardHeader, CardTitle } from '@mockups/web-ui';

import { usePromotionStore } from '../../../store/usePromotionStore';
import { ALL_ID, brands, categories, companies, serviceableAreas, skus } from '../../../lib/mock-data';
import { SearchableMultiSelect, type SelectOption } from '../../../components/wizard/searchable-multiselect';
import { GeoSellerVendorFields } from '../../../components/wizard/geo-seller-vendor-fields';
import { WizardFooter } from '../../../components/wizard/wizard-footer';
import { promotionWizardSteps } from '../../../lib/promotion-copy';
import { WizardShell } from '../../../components/wizard/wizard-shell';
import { SkuUploadModal } from '../../../components/promotions/sku-upload-modal';

export default function BasicsStep() {
  const navigate = useNavigate();
  const geo = usePromotionStore((state) => state.draft.geo);
  const product = usePromotionStore((state) => state.draft.product);
  const updateGeo = usePromotionStore((state) => state.updateGeo);
  const updateProduct = usePromotionStore((state) => state.updateProduct);
  const nextStep = usePromotionStore((state) => state.nextStep);
  const saveDraftRecord = usePromotionStore((state) => state.saveDraftRecord);

  const [savedRecently, setSavedRecently] = useState(false);
  const [skuUploadOpen, setSkuUploadOpen] = useState(false);

  const areaIds = geo.serviceable_area_ids;

  const hasScopedVendors = geo.vendor_ids.length > 0 && !geo.vendor_ids.includes(ALL_ID);
  const vendorAreas = useMemo(() => serviceableAreas.filter((area) => geo.vendor_ids.includes(area.vendorId)), [geo.vendor_ids]);

  // Dynamic filter logic: no specific vendor(s) chosen -> full catalog; specific areas checked -> only brands mapped to those areas.
  const scopedBrandIds = useMemo(() => {
    if (!hasScopedVendors) return null;
    const relevantAreas = areaIds.length > 0 ? vendorAreas.filter((area) => areaIds.includes(area.id)) : vendorAreas;
    const ids = new Set<string>();
    relevantAreas.forEach((area) => area.brandIds.forEach((brandId) => ids.add(brandId)));
    return ids;
  }, [hasScopedVendors, areaIds, vendorAreas]);

  const availableBrands = useMemo(() => (scopedBrandIds ? brands.filter((brand) => scopedBrandIds.has(brand.id)) : brands), [scopedBrandIds]);

  const companyOptions: SelectOption[] = useMemo(() => {
    const ids = new Set(availableBrands.map((brand) => brand.companyId));
    return companies.filter((company) => ids.has(company.id)).map((company) => ({ id: company.id, label: company.name }));
  }, [availableBrands]);

  const categoryOptions: SelectOption[] = useMemo(() => {
    const relevant = product.company_ids.length > 0 ? availableBrands.filter((brand) => product.company_ids.includes(brand.companyId)) : availableBrands;
    const ids = new Set(relevant.map((brand) => brand.categoryId));
    return categories.filter((category) => ids.has(category.id)).map((category) => ({ id: category.id, label: category.name }));
  }, [availableBrands, product.company_ids]);

  const brandOptions: SelectOption[] = useMemo(() => {
    let relevant = availableBrands;
    if (product.company_ids.length > 0) relevant = relevant.filter((brand) => product.company_ids.includes(brand.companyId));
    if (product.category_ids.length > 0) relevant = relevant.filter((brand) => product.category_ids.includes(brand.categoryId));
    return relevant.map((brand) => ({ id: brand.id, label: brand.name }));
  }, [availableBrands, product.company_ids, product.category_ids]);

  const skuOptions: SelectOption[] = useMemo(() => {
    const brandIds = product.brand_ids.length > 0 ? product.brand_ids : brandOptions.map((option) => option.id);
    return skus
      .filter((sku) => brandIds.includes(sku.brandId))
      .map((sku) => ({ id: sku.id, label: sku.name, sublabel: brands.find((brand) => brand.id === sku.brandId)?.name }));
  }, [product.brand_ids, brandOptions]);

  const resetDownstreamProduct = () => updateProduct({ company_ids: [], category_ids: [], brand_ids: [], sku_ids: [] });

  const handleSaveDraft = () => {
    saveDraftRecord();
    setSavedRecently(true);
    setTimeout(() => setSavedRecently(false), 2500);
  };

  const handleContinue = () => {
    nextStep();
    navigate('/promotions/create/details');
  };

  const productHierarchySubtitle =
    areaIds.length > 0
      ? `Showing companies mapped to ${areaIds.length} selected serviceable area${areaIds.length > 1 ? 's' : ''}.`
      : hasScopedVendors
        ? 'Showing companies mapped to all serviceable areas for the selected vendor(s).'
        : 'Showing the full catalog — narrow it once a vendor and serviceable areas are selected.';

  return (
    <WizardShell
      title="Create promotion"
      steps={promotionWizardSteps}
      currentStep={1}
      footer={
        <WizardFooter
          onBack={() => navigate('/promotions')}
          backLabel="Cancel"
          onSaveDraft={handleSaveDraft}
          onContinue={handleContinue}
          savedRecently={savedRecently}
        />
      }
    >
      <GeoSellerVendorFields geo={geo} onChange={updateGeo} onDownstreamReset={resetDownstreamProduct} />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="size-4 text-gray-500" aria-hidden="true" />
            Mapped product hierarchy
          </CardTitle>
          <p className="text-xs text-gray-500">{productHierarchySubtitle}</p>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <SearchableMultiSelect
              label="Company"
              options={companyOptions}
              selectedIds={product.company_ids}
              onChange={(ids) => updateProduct({ company_ids: ids, category_ids: [], brand_ids: [], sku_ids: [] })}
              emptyMessage="No companies available for this scope."
            />
            <SearchableMultiSelect
              label="Category"
              options={categoryOptions}
              selectedIds={product.category_ids}
              onChange={(ids) => updateProduct({ category_ids: ids, brand_ids: [], sku_ids: [] })}
              emptyMessage="No categories available for this scope."
            />
            <SearchableMultiSelect
              label="Brand"
              options={brandOptions}
              selectedIds={product.brand_ids}
              onChange={(ids) => updateProduct({ brand_ids: ids, sku_ids: [] })}
              emptyMessage="No brands available for this scope."
            />
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-900">SKU</label>
              <div className="flex items-start gap-2">
                <div className="flex-1">
                  <SearchableMultiSelect
                    label="SKU"
                    hideLabel
                    hideChips
                    pluralLabel="SKUs"
                    showClearInTrigger
                    options={skuOptions}
                    selectedIds={product.sku_ids}
                    onChange={(ids) => updateProduct({ sku_ids: ids })}
                    emptyMessage="No SKUs available for this scope."
                  />
                </div>
                <Button type="button" variant="outline" size="sm" onClick={() => setSkuUploadOpen(true)} className="shrink-0 whitespace-nowrap">
                  <Upload className="h-3.5 w-3.5" aria-hidden="true" />
                  Upload SKU
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <SkuUploadModal open={skuUploadOpen} onOpenChange={setSkuUploadOpen} onConfirm={(skuIds) => updateProduct({ sku_ids: skuIds })} />
    </WizardShell>
  );
}
