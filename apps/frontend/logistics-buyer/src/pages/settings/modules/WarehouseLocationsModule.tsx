// Shared module B — "Warehouse Locations" (spec 07 §4), used by Profile and /settings/addresses.
// Every failure is console-only; set-default is optimistic and never reverted; delete has no confirmation.
import { useEffect, useReducer, useState } from 'react';
import { getConfig } from '../../../api/config';
import { http } from '../../../api/http';
import { addressService } from '../../../api/services/address.service';

export interface UiAddress {
  id?: string;
  buyerId?: string;
  addressType?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  country?: string;
  pincode?: string;
  latitude?: string | null;
  longitude?: string | null;
  isDefault?: boolean;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  updatedBy?: string;
  cityCode?: string;
  [k: string]: unknown;
}

const mapRow = (r: any): UiAddress => ({
  id: r.id,
  buyerId: r.buyer_id,
  addressType: r.address_type,
  addressLine1: r.address_line1,
  addressLine2: r.address_line2,
  city: r.city,
  state: r.state,
  country: r.country,
  pincode: r.pincode,
  latitude: r.latitude,
  longitude: r.longitude,
  isDefault: r.is_default,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
  createdBy: r.created_by,
  updatedBy: r.updated_by,
  cityCode: r.city_code,
});

/**
 * The original AddressService.deleteAddress is `POST {buyerUrl}/addresses/delete/{id}` with body `{}` (spec 07 §10.2).
 * The shared replica addressService uses DELETE, so the original request is issued here. [deviation: local helper]
 */
const deleteAddressPost = (id: string) => http.post<any>(`${getConfig().buyerUrl}/addresses/delete/${id}`, {});

export class WarehouseLocationsController {
  update: () => void = () => {};
  buyerId = '';
  locations: UiAddress[] = [];
  showAddAddressModal = false;
  newLocation: UiAddress = this.createEmptyAddress();

  createEmptyAddress(): UiAddress {
    return {
      buyerId: this.buyerId,
      addressType: 'warehouse',
      addressLine1: '',
      addressLine2: '',
      city: '',
      state: '',
      country: '',
      pincode: '',
      isDefault: false,
      cityCode: '',
    };
  }

  async loadAddresses() {
    try {
      const res = await addressService.getAddresses(this.buyerId);
      const data = res?.data || [];
      this.locations = Array.isArray(data) && data.length > 0 ? data.map(mapRow) : [];
    } catch (e) {
      console.error('Error loading addresses:', e);
      this.locations = [];
    }
    this.update();
  }

  openAddAddressModal() {
    this.newLocation = this.createEmptyAddress();
    this.showAddAddressModal = true;
    this.update();
  }

  closeAddAddressModal() {
    this.showAddAddressModal = false;
    this.update();
  }

  /** No loading state / double-submit guard (as-built). */
  async addLocation(location: UiAddress) {
    try {
      const res = await addressService.createAddress(location);
      const data = res?.data;
      if (data) {
        this.locations.push(data); // pushed RAW (snake_case) → momentary card without a name until the refetch lands
        this.newLocation = this.createEmptyAddress();
        this.loadAddresses();
        this.showAddAddressModal = false;
      }
    } catch (e) {
      console.error('Error saving location:', e);
    }
    this.update();
  }

  async setDefaultLocation(index: number) {
    const loc = this.locations[index];
    if (!loc || loc.isDefault) return;
    this.locations.forEach((l, i) => (l.isDefault = i === index)); // optimistic, never reverted
    this.update();
    if (loc.id) {
      try {
        // setDefaultAddress(id, buyerId) → updateAddress({id, buyerId, isDefault:true}); undefined attributes are dropped by JSON.
        await addressService.updateAddress({
          id: loc.id,
          buyerId: this.buyerId,
          updateAttributes: {
            addressType: undefined,
            addressLine1: undefined,
            addressLine2: undefined,
            city: undefined,
            state: undefined,
            country: undefined,
            pincode: undefined,
            latitude: undefined,
            longitude: undefined,
            isDefault: true,
          },
        });
      } catch (e) {
        console.error('Error setting default location:', e);
      }
    }
  }

  async removeLocation(index: number) {
    const loc = this.locations[index];
    if (!loc) return;
    if (loc.id) {
      try {
        await deleteAddressPost(loc.id);
        this.locations.splice(index, 1);
      } catch (e) {
        console.error('Error deleting location:', e);
      }
    } else {
      this.locations.splice(index, 1);
    }
    this.update();
  }
}

export function useWarehouseLocations(buyerId: string) {
  const [, force] = useReducer((x: number) => x + 1, 0);
  const [c] = useState(() => {
    const controller = new WarehouseLocationsController();
    controller.buyerId = buyerId;
    controller.newLocation = controller.createEmptyAddress();
    return controller;
  });
  c.update = force;
  useEffect(() => {
    c.loadAddresses();
    return () => {
      c.update = () => {};
    };
  }, []);
  return c;
}

/** div.locations-list (§4.2). */
export function LocationsList({ c }: { c: WarehouseLocationsController }) {
  return (
    <div className="locations-list">
      {c.locations.map((l, i) => (
        <div className="location-card" key={i}>
          <div className="location-content">
            <div className="location-name">{l.addressLine1}</div>
            <div className="location-address">
              {` ${l.addressLine2 ?? ''}${l.city ? ', ' + l.city : ''}${l.pincode ? ' - ' + l.pincode : ''} `}
            </div>
            <div className="location-actions">
              {l.isDefault ? (
                <button className="default-address-badge">Default Address</button>
              ) : (
                <button className="set-default-btn" onClick={() => c.setDefaultLocation(i)}>
                  {' Set as Default '}
                </button>
              )}
            </div>
          </div>
          {!l.isDefault && (
            <button className="delete-btn" onClick={() => c.removeLocation(i)}>
              <i className="fas fa-trash-alt" />
            </button>
          )}
        </div>
      ))}
      {/* `.location-card .no-locations` never matches → unstyled plain div (as-built) */}
      {c.locations.length === 0 && <div className="no-locations">No warehouse locations added yet</div>}
    </div>
  );
}

// ------------------------------------------------------------------ Add Warehouse Location modal (§4.4)
type FieldKey = 'locationName' | 'address' | 'pincode' | 'latitude' | 'longitude';
const NAME_RE = /^[a-zA-Z0-9 ]+$/;
const PIN_RE = /^[0-9]{6}$/;
const COORD_RE = /^-?\d+(\.\d+)?$/;

/** Angular template-driven validity: `required` fails only on empty; `pattern` skips empty values. */
function fieldErrors(loc: UiAddress): Record<FieldKey, string | null> {
  const name = loc.addressLine1 ?? '';
  const addr = loc.addressLine2 ?? '';
  const pin = loc.pincode ?? '';
  const lat = loc.latitude == null ? '' : String(loc.latitude);
  const lng = loc.longitude == null ? '' : String(loc.longitude);
  return {
    locationName: !name ? 'Location name is required' : !NAME_RE.test(name) ? 'Only alphanumeric characters are allowed' : null,
    address: !addr ? 'Address is required' : null,
    pincode: !pin || pin.length > 6 || !PIN_RE.test(pin) ? '6 digits pincode required' : null,
    latitude: lat && !COORD_RE.test(lat) ? 'Please enter a valid latitude' : null,
    longitude: lng && !COORD_RE.test(lng) ? 'Please enter a valid longitude' : null,
  };
}

export function AddWarehouseLocationModal({ c }: { c: WarehouseLocationsController }) {
  // The original binds ngModel straight to c.newLocation; the object is mutated in place and posted as-is.
  const loc = c.newLocation;
  const [touched, setTouched] = useState<Partial<Record<FieldKey, boolean>>>({});
  const [dirty, setDirty] = useState<Partial<Record<FieldKey, boolean>>>({});
  const [, force] = useReducer((x: number) => x + 1, 0);
  const errors = fieldErrors(loc);
  const shown = (k: FieldKey) => !!errors[k] && (dirty[k] || touched[k]);
  const cls = (k: FieldKey) => [errors[k] ? 'ng-invalid' : 'ng-valid', touched[k] ? 'ng-touched' : 'ng-untouched', dirty[k] ? 'ng-dirty' : 'ng-pristine'].join(' ');

  const set = (key: keyof UiAddress, field: FieldKey | null, value: string) => {
    (loc as any)[key] = value;
    if (field) setDirty((d) => ({ ...d, [field]: true }));
    force();
  };
  const blur = (field: FieldKey) => setTouched((t) => ({ ...t, [field]: true }));

  const addDisabled =
    !loc.addressLine1 ||
    loc.addressLine1.trim() === '' ||
    !loc.addressLine2 ||
    loc.addressLine2.trim() === '' ||
    !loc.pincode ||
    loc.pincode.trim() === '' ||
    loc.pincode.length !== 6 ||
    (!!errors.locationName && (dirty.locationName || touched.locationName));

  return (
    <div className="modal-overlay" onClick={() => c.closeAddAddressModal()}>
      <div className="modal-content settings-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">
            <i className="fas fa-map-marker-alt" />
            <h3>Add Warehouse Location</h3>
          </div>
          <button className="close-btn" onClick={() => c.closeAddAddressModal()}>
            <i className="fas fa-times" />
          </button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label htmlFor="locationName">
              Location Name <span className="required">*</span>
            </label>
            <input
              type="text"
              id="locationName"
              name="locationName"
              className={cls('locationName')}
              placeholder="e.g. Main Warehouse"
              value={loc.addressLine1 ?? ''}
              onChange={(e) => set('addressLine1', 'locationName', e.target.value)}
              onBlur={() => blur('locationName')}
            />
            {shown('locationName') && <div className="error-message">{errors.locationName}</div>}
          </div>
          <div className="form-group">
            <label htmlFor="address">
              Address <span className="required">*</span>
            </label>
            <textarea
              id="address"
              name="address"
              rows={3}
              className={cls('address')}
              placeholder="Enter full address"
              value={loc.addressLine2 ?? ''}
              onChange={(e) => set('addressLine2', 'address', e.target.value)}
              onBlur={() => blur('address')}
            />
            {shown('address') && <div className="error-message">{errors.address}</div>}
          </div>
          <div className="form-row">
            <div className="form-group half-width">
              <label>City</label>
              <input type="text" name="city" placeholder="Enter city" value={loc.city ?? ''} onChange={(e) => set('city', null, e.target.value)} />
            </div>
            <div className="form-group half-width">
              <label>State</label>
              <input type="text" name="state" placeholder="Enter state" value={loc.state ?? ''} onChange={(e) => set('state', null, e.target.value)} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group half-width">
              <label>Country</label>
              <input type="text" name="country" placeholder="Enter country" value={loc.country ?? ''} onChange={(e) => set('country', null, e.target.value)} />
            </div>
            <div className="form-group half-width">
              <label htmlFor="pincode">
                Pincode <span className="required">*</span>
              </label>
              <input
                type="text"
                id="pincode"
                name="pincode"
                maxLength={6}
                className={cls('pincode')}
                placeholder="Enter pincode"
                value={loc.pincode ?? ''}
                // onPincodeInput: strip non-digits, max 6 — sanitised BEFORE storing (intended behaviour, spec §4.4)
                onChange={(e) => set('pincode', 'pincode', e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                onBlur={() => blur('pincode')}
              />
              {shown('pincode') && <div className="error-message">6 digits pincode required</div>}
            </div>
          </div>
          <div className="form-group">
            <label>City Code</label>
            <input type="text" name="cityCode" placeholder="Enter city code" value={loc.cityCode ?? ''} onChange={(e) => set('cityCode', null, e.target.value)} />
          </div>
          <div className="form-row">
            <div className="form-group half-width">
              <label htmlFor="latitude">Latitude</label>
              <input
                type="text"
                id="latitude"
                name="latitude"
                className={cls('latitude')}
                placeholder="e.g. 17.385044"
                value={loc.latitude ?? ''}
                onChange={(e) => set('latitude', 'latitude', e.target.value)}
                onBlur={() => blur('latitude')}
              />
              {shown('latitude') && <div className="error-message">Please enter a valid latitude</div>}
            </div>
            <div className="form-group half-width">
              <label htmlFor="longitude">Longitude</label>
              <input
                type="text"
                id="longitude"
                name="longitude"
                className={cls('longitude')}
                placeholder="e.g. 78.486671"
                value={loc.longitude ?? ''}
                onChange={(e) => set('longitude', 'longitude', e.target.value)}
                onBlur={() => blur('longitude')}
              />
              {shown('longitude') && <div className="error-message">Please enter a valid longitude</div>}
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn cancel-btn" onClick={() => c.closeAddAddressModal()}>
            Cancel
          </button>
          <button className="btn save-btn" disabled={addDisabled} onClick={() => c.addLocation(loc)}>
            {' Add Location '}
          </button>
        </div>
      </div>
    </div>
  );
}
