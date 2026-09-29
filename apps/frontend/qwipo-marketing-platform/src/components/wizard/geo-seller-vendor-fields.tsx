import { useMemo } from 'react';
import { Globe, MapPin, Store } from 'lucide-react';

import { ALL_ID, cities, country, sellerTypeOptions, serviceableAreas, states, vendors } from '../../lib/mock-data';
import type { SellerTypeChoice } from '../../lib/mock-data';
import { describeGeo } from '../../lib/promotion-copy';
import type { GeoScope } from '../../types/campaign';
import { SearchableMultiSelect } from './searchable-multiselect';
import type { SelectOption } from './searchable-multiselect';
import { SelectField } from './select-field';
import type { SelectFieldOption } from './select-field';
import { CheckboxList } from './checkbox-list';
import { Card, CardContent, CardHeader, CardTitle } from '@mockups/web-ui';

const stateOptions: SelectOption[] = states.map((state) => ({ id: state.id, label: state.name }));
const sellerTypeSelectOptions: SelectFieldOption[] = [
  { value: '', label: 'Select seller type...' },
  ...sellerTypeOptions.map((option) => ({ value: option.id, label: option.id === 'all' ? 'ALL' : option.label })),
];

interface GeoSellerVendorFieldsProps {
  geo: GeoScope;
  onChange: (patch: Partial<GeoScope>) => void;
  /** Fires alongside any geo mutation that should invalidate caller-specific downstream state
   * (e.g. the product hierarchy selections in the promotion wizard). Omit if there's none. */
  onDownstreamReset?: () => void;
}

/**
 * Country → State → City → Seller type → Vendor → Serviceable area, with the exact cascading
 * enable/disable rules and location-aware vendor filtering built for the promotion wizard's
 * Step 1. Shared verbatim by any flow that needs to target the same geo/vendor network —
 * currently the promotion wizard and the notification composer.
 */
export function GeoSellerVendorFields({ geo, onChange, onDownstreamReset }: GeoSellerVendorFieldsProps) {
  const stateIds = geo.state_ids;
  const cityIds = geo.city_ids;
  const vendorIds = geo.vendor_ids;
  const areaIds = geo.serviceable_area_ids;

  const isAllStatesSelected = stateIds.includes(ALL_ID);
  const isAllCitiesSelected = cityIds.includes(ALL_ID);
  const isAllVendorsSelected = vendorIds.includes(ALL_ID);

  const sellerTypeValue = geo.seller_type ?? '';
  const isVendorEnabled = Boolean(geo.seller_type) && geo.seller_type !== 'all' && !isAllCitiesSelected && !isAllStatesSelected;
  const showServiceableArea = vendorIds.length > 0 && !isAllVendorsSelected;

  const cityOptionsForSelectedStates = useMemo(
    () => (isAllStatesSelected ? cities : cities.filter((city) => stateIds.includes(city.stateId))),
    [stateIds, isAllStatesSelected],
  );
  const cityOptions: SelectOption[] = useMemo(
    () => cityOptionsForSelectedStates.map((city) => ({ id: city.id, label: city.name })),
    [cityOptionsForSelectedStates],
  );

  const vendorOptions: SelectOption[] = useMemo(() => {
    return vendors
      .filter((vendor) => {
        const matchesType = !geo.seller_type || geo.seller_type === 'all' || vendor.role === geo.seller_type;
        const matchesCity = isAllCitiesSelected || cityIds.length === 0 || cityIds.includes(vendor.cityId);
        const vendorCity = cities.find((city) => city.id === vendor.cityId);
        const matchesState = isAllStatesSelected || stateIds.length === 0 || (Boolean(vendorCity) && stateIds.includes(vendorCity!.stateId));
        return matchesType && matchesCity && matchesState;
      })
      .map((vendor) => ({
        id: vendor.id,
        label: `${vendor.name} — ${cities.find((city) => city.id === vendor.cityId)?.name ?? 'Unknown city'}`,
      }));
  }, [geo.seller_type, cityIds, stateIds, isAllCitiesSelected, isAllStatesSelected]);

  const vendorAreas = useMemo(() => serviceableAreas.filter((area) => vendorIds.includes(area.vendorId)), [vendorIds]);

  const handleStatesChange = (ids: string[]) => {
    onChange({ state_ids: ids, city_ids: [], seller_type: undefined, vendor_ids: [], serviceable_area_ids: [] });
    onDownstreamReset?.();
  };

  const handleToggleAllStates = () => {
    onChange(
      isAllStatesSelected
        ? { state_ids: [], city_ids: [], seller_type: undefined, vendor_ids: [], serviceable_area_ids: [] }
        : { state_ids: [ALL_ID], city_ids: [ALL_ID], seller_type: 'all', vendor_ids: [ALL_ID], serviceable_area_ids: [] },
    );
    onDownstreamReset?.();
  };

  const handleCitiesChange = (ids: string[]) => {
    onChange({ city_ids: ids, seller_type: undefined, vendor_ids: [], serviceable_area_ids: [] });
    onDownstreamReset?.();
  };

  const handleToggleAllCities = () => {
    onChange(
      isAllCitiesSelected
        ? { city_ids: [], seller_type: undefined, vendor_ids: [], serviceable_area_ids: [] }
        : { city_ids: [ALL_ID], seller_type: 'all', vendor_ids: [ALL_ID], serviceable_area_ids: [] },
    );
    onDownstreamReset?.();
  };

  const handleSellerTypeChange = (value: string) => {
    const sellerType = value === '' ? undefined : (value as SellerTypeChoice);
    onChange({ seller_type: sellerType, vendor_ids: sellerType === 'all' ? [ALL_ID] : [], serviceable_area_ids: [] });
    onDownstreamReset?.();
  };

  const handleVendorsChange = (ids: string[]) => {
    onChange({ vendor_ids: ids, serviceable_area_ids: [] });
    onDownstreamReset?.();
  };

  const handleToggleAllVendors = () => {
    onChange(isAllVendorsSelected ? { vendor_ids: [], serviceable_area_ids: [] } : { vendor_ids: [ALL_ID], serviceable_area_ids: [] });
    onDownstreamReset?.();
  };

  const handleAreasChange = (ids: string[]) => {
    onChange({ serviceable_area_ids: ids });
    onDownstreamReset?.();
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="size-4 text-gray-500" aria-hidden="true" />
            Geographic scope
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-900">Country</label>
              <div
                aria-disabled="true"
                className="flex h-9 w-full items-center gap-2 rounded-md border border-gray-200 bg-gray-50 px-3 text-sm text-gray-600"
              >
                <Globe className="size-4 text-muted-foreground" aria-hidden="true" />
                {country.name}
              </div>
            </div>

            <SearchableMultiSelect
              label="State"
              options={stateOptions}
              selectedIds={isAllStatesSelected ? [] : stateIds}
              onChange={handleStatesChange}
              allOption={{ label: 'ALL' }}
              isAllSelected={isAllStatesSelected}
              onToggleAll={handleToggleAllStates}
              helperText={isAllStatesSelected ? 'ALL targets Pan India.' : undefined}
              emptyMessage="No matching states."
            />
            <SearchableMultiSelect
              label="City"
              options={cityOptions}
              selectedIds={isAllCitiesSelected ? [] : cityIds}
              onChange={handleCitiesChange}
              allOption={{ label: 'ALL' }}
              isAllSelected={isAllCitiesSelected}
              onToggleAll={handleToggleAllCities}
              disabled={stateIds.length === 0 || isAllStatesSelected}
              helperText={
                isAllStatesSelected
                  ? 'All cities included — Pan India selected above.'
                  : stateIds.length === 0
                    ? 'Select a state to enable city selection.'
                    : isAllCitiesSelected
                      ? 'ALL targets Pan Selected State(s).'
                      : undefined
              }
              emptyMessage="No cities available for the selected states."
            />
          </div>

          <div className="flex items-center gap-2 border-t border-gray-200 pt-4">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
              <MapPin className="size-3.5" aria-hidden="true" />
              Scope: {describeGeo(geo)}
            </span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Store className="size-4 text-gray-500" aria-hidden="true" />
            Seller, vendor &amp; serviceable area
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <SelectField
              label="Seller type"
              options={sellerTypeSelectOptions}
              value={sellerTypeValue}
              onChange={handleSellerTypeChange}
              disabled={cityIds.length === 0 || isAllCitiesSelected}
              helperText={
                isAllCitiesSelected
                  ? 'Seller type is ALL — every partner is in scope above.'
                  : cityIds.length === 0
                    ? 'Select a city to choose seller type.'
                    : undefined
              }
            />

            <SearchableMultiSelect
              label="Vendor"
              options={vendorOptions}
              selectedIds={isAllVendorsSelected ? [] : vendorIds}
              onChange={handleVendorsChange}
              allOption={{ label: 'ALL' }}
              isAllSelected={isAllVendorsSelected}
              onToggleAll={handleToggleAllVendors}
              disabled={!isVendorEnabled}
              helperText={
                isVendorEnabled
                  ? 'Mapped to the seller type and geography selected above.'
                  : 'Select a specific state, city, and seller type (not ALL) to load vendors.'
              }
              emptyMessage="No vendors available for this scope."
            />
          </div>

          {showServiceableArea && (
            <div className="space-y-2 border-t border-gray-200 pt-4">
              <label className="block text-sm font-medium text-gray-900">Serviceable area</label>
              <CheckboxList
                options={vendorAreas.map((area) => ({ id: area.id, label: area.name }))}
                selectedIds={areaIds}
                onChange={handleAreasChange}
                columns={3}
              />
              <p className="text-xs text-gray-500">Active beats/routes covered by the selected vendor{vendorIds.length > 1 ? 's' : ''}.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
