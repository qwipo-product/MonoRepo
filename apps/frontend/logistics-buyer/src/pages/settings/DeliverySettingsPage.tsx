// Delivery Settings (/settings/delivery, spec 08 §3).
// buyerConfig is loaded once and MUTATED IN PLACE by every section save (as-built), and the buyer-settings service
// swallows errors (returns null), so failed saves are silent and the "Failed to save …" alerts are unreachable.
// The logic is ported as a mutable controller so these cross-section side effects behave exactly like the original.
import { useState, useEffect, useReducer, type KeyboardEvent } from 'react';
import Swal from 'sweetalert2';
import { authService } from '../../api/services/auth.service';
import { buyerSettingsService } from '../../api/services/buyerSettings.service';
import { OndcCategory, RouteEngines } from '../../types/enums';
import CdsRoutingSection from './CdsRoutingSection';
import './DeliverySettingsPage.css';

type FieldName = 'UID' | 'DsType';
type ExStatus = 'Active' | 'Inactive';
interface Exclusion {
  fieldName: FieldName | string;
  value: string;
  status: ExStatus | string;
}

const DEFAULT_ROUTE_PLANNING = { serviceTimeMinutes: 12, maxTravelTimeMinutes: 510, maxStops: 35, maxDistanceKm: 40 };
const DEFAULT_ENGINES = ['route_optimize', 'beat_optimized', 'cluster_beat_optimized'];
const LOGISTICS_MODES = ['self', '3pl', 'self+3pl'];
const ONDC_CATEGORIES: string[] = Object.values(OndcCategory);
const FIELD_NAMES: FieldName[] = ['UID', 'DsType'];

/** Default skeleton used when nothing was loaded (spec 08 §2.3). */
const defaultSkeleton = (): any => ({
  storeConfig: { openingTime: '', closingTime: '', isTemporarilyClosed: false, weeklyHolidays: [], specificClosureDates: [] },
  deliveryConfig: {
    otpVerificationEnabled: true,
    deliveryOtpEnabled: true,
    pickupOtpEnabled: true,
    returnOtpEnabled: true,
    supportedVehicleTypes: [],
    geoFenceContactNumber: 0,
  },
});
const defaultAdmin = () => ({ warehouseLocation: [], isPermissionsEnabled: false });

const logisticsLabel = (m: string) => (m === 'self' ? 'Self' : m === '3pl' ? '3PL' : m === 'self+3pl' ? 'Self + 3PL' : m);

function showSaved(text: string) {
  Swal.fire({ icon: 'success', title: 'Saved', text, timer: 2000, showConfirmButton: false });
}
function showError(text: string) {
  Swal.fire({ icon: 'error', title: 'Error', text });
}

class DeliverySettingsController {
  update: () => void = () => {};
  buyerId = '';
  buyerConfig: any = null;
  adminConfig: any = null;

  routePlanningConfig: any = { ...DEFAULT_ROUTE_PLANNING };
  defaultRoutePlanningConfig = { ...DEFAULT_ROUTE_PLANNING };
  maxTravelTimeHours: number | null = 8.5;
  engineOptions = RouteEngines;
  availableEngines: string[] = [...DEFAULT_ENGINES];
  selectedEngine = 'route_optimize';
  routeEngineVisible = true;
  selectedLogisticsMode = 'self';
  sellerOtpEnabled = true;
  retailerOtpEnabled = true;
  selectedOndcPayloadCategory: string | null = null;
  excludedCustomers: Exclusion[] = [];

  isRoutePlanningDirty = false;
  isOtpDirty = false;
  isOndcCategoryDirty = false;
  isLogisticsModeDirty = false;
  isSavingRoutePlanning = false;
  isSavingOtp = false;
  isSavingOndcCategory = false;
  isSavingLogisticsMode = false;
  isSaving = false;
  isLoading = false; // never displayed

  currentPage = 1;
  pageSize = 25;

  showAddForm = false;
  fieldName: string = 'UID';
  fieldValue = '';
  status: string = 'Active';

  showEditForm = false;
  editIndex = -1;
  editFieldName: string = 'UID';
  editFieldValue = '';
  editStatus: string = 'Active';

  // ------------------------------------------------------------ load (§3.2)
  async loadSettings() {
    if (!this.buyerId) return;
    this.isLoading = true;
    try {
      const res = await buyerSettingsService.getBuyerSettings(this.buyerId);
      if (res?.buyer_config) {
        const bc = res.buyer_config;
        this.buyerConfig = bc;
        this.excludedCustomers = bc.customerExclusionConfig?.excludedCustomers || [];
        if (bc.routePlanningConfig) {
          this.routePlanningConfig = { ...bc.routePlanningConfig }; // shallow copy incl. routeEngine / logisticsMode
          this.maxTravelTimeHours = +(this.routePlanningConfig.maxTravelTimeMinutes / 60).toFixed(2);
          const re = bc.routePlanningConfig.routeEngine;
          if (re) {
            if (re.availableEngines?.length) this.availableEngines = re.availableEngines;
            this.selectedEngine = re.selectedEngine || 'route_optimize';
            this.routeEngineVisible = re.uxVisibility ?? false;
          }
          this.selectedLogisticsMode = this.routePlanningConfig.logisticsMode || 'self';
        }
        const d = bc.deliveryConfig;
        if (d) {
          if (d.ondcPayloadCategory) this.selectedOndcPayloadCategory = d.ondcPayloadCategory;
          this.sellerOtpEnabled = (d.pickupOtpEnabled ?? true) || (d.returnOtpEnabled ?? true);
          this.retailerOtpEnabled = d.deliveryOtpEnabled ?? true;
        }
      }
      if (res?.admin_config) this.adminConfig = res.admin_config;
    } catch (e) {
      console.error('Error loading settings:', e);
    } finally {
      this.isLoading = false;
      this.update();
    }
  }

  private post(r: any) {
    return buyerSettingsService.saveBuyerSettings({ buyerId: this.buyerId, adminConfig: this.adminConfig || defaultAdmin(), buyerConfig: r });
  }

  // ------------------------------------------------------------ A. route planning
  preventNegativeInput(e: KeyboardEvent<HTMLInputElement>) {
    if (['-', 'e', 'E', '+'].includes(e.key)) e.preventDefault();
  }

  onRoutePlanningChange() {
    for (const k of ['serviceTimeMinutes', 'maxStops', 'maxDistanceKm']) {
      if (this.routePlanningConfig[k] < 0) this.routePlanningConfig[k] = 0; // null < 0 is false → null saved as-is
    }
    this.isRoutePlanningDirty = true;
    this.update();
  }

  onMaxTravelTimeHoursChange() {
    if ((this.maxTravelTimeHours as number) < 0) this.maxTravelTimeHours = 0;
    this.routePlanningConfig.maxTravelTimeMinutes = Math.round((this.maxTravelTimeHours as number) * 60); // empty → 0
    this.isRoutePlanningDirty = true;
    this.update();
  }

  resetRoutePlanningConfig() {
    this.routePlanningConfig = { ...this.defaultRoutePlanningConfig }; // drops routeEngine + logisticsMode keys
    this.maxTravelTimeHours = 8.5;
    this.selectedEngine = this.engineOptions.find((o) => o.isDefault)?.value || 'route_optimize';
    this.isRoutePlanningDirty = true; // does not save
    this.update();
  }

  async saveRoutePlanningConfig() {
    if (!this.buyerId) return;
    this.isSavingRoutePlanning = true;
    this.update();
    try {
      const r = this.buyerConfig || defaultSkeleton();
      r.routePlanningConfig = {
        ...this.routePlanningConfig,
        routeEngine: { availableEngines: this.availableEngines, selectedEngine: this.selectedEngine, uxVisibility: this.routeEngineVisible },
      };
      const result = await this.post(r);
      if (result) {
        this.buyerConfig = r;
        this.isRoutePlanningDirty = false;
        showSaved('Route planning configuration saved successfully.');
      }
    } catch (e) {
      console.error('Error saving route planning config:', e);
      showError('Failed to save route planning configuration.'); // unreachable (service never throws)
    } finally {
      this.isSavingRoutePlanning = false;
      this.update();
    }
  }

  // ------------------------------------------------------------ B. OTP
  onOtpChange() {
    this.isOtpDirty = true;
    this.update();
  }

  async saveOtpConfig() {
    if (!this.buyerId) return;
    this.isSavingOtp = true;
    this.update();
    try {
      const r = this.buyerConfig || defaultSkeleton();
      r.deliveryConfig = {
        ...r.deliveryConfig,
        pickupOtpEnabled: this.sellerOtpEnabled,
        returnOtpEnabled: this.sellerOtpEnabled,
        deliveryOtpEnabled: this.retailerOtpEnabled,
        otpVerificationEnabled: this.sellerOtpEnabled || this.retailerOtpEnabled,
      };
      const result = await this.post(r);
      if (result) {
        this.buyerConfig = r;
        this.isOtpDirty = false;
        showSaved('Proof of Delivery(OTP) configuration Updated Successfully.');
      }
    } catch (e) {
      console.error('Error saving OTP config:', e);
      showError('Failed to save OTP configuration.'); // unreachable
      await this.loadSettings();
      this.isOtpDirty = false;
    } finally {
      this.isSavingOtp = false;
      this.update();
    }
  }

  // ------------------------------------------------------------ C. ONDC category
  onOndcCategoryChange() {
    this.isOndcCategoryDirty = true;
    this.update();
  }

  async saveOndcPayloadCategory() {
    if (!this.selectedOndcPayloadCategory) return;
    if (!this.buyerId) return;
    this.isSavingOndcCategory = true;
    this.update();
    try {
      const r = this.buyerConfig || defaultSkeleton();
      r.deliveryConfig = { ...r.deliveryConfig, ondcPayloadCategory: this.selectedOndcPayloadCategory };
      const result = await this.post(r);
      if (result) {
        this.buyerConfig = r;
        this.isOndcCategoryDirty = false;
        showSaved('ONDC category saved successfully.');
      }
    } catch (e) {
      console.error('Error saving ONDC payload category:', e);
      showError('Failed to save ONDC payload category.'); // unreachable
    } finally {
      this.isSavingOndcCategory = false;
      this.update();
    }
  }

  // ------------------------------------------------------------ D. logistics mode
  onLogisticsModeChange() {
    this.isLogisticsModeDirty = true;
    this.update();
  }

  async saveLogisticsMode() {
    if (!this.buyerId) return;
    this.isSavingLogisticsMode = true;
    this.update();
    try {
      const r = this.buyerConfig || defaultSkeleton();
      // also persists any unsaved Section A edits (isRoutePlanningDirty stays true) — as-built
      r.routePlanningConfig = {
        ...this.routePlanningConfig,
        routeEngine: { availableEngines: this.availableEngines, selectedEngine: this.selectedEngine, uxVisibility: this.routeEngineVisible },
        logisticsMode: this.selectedLogisticsMode,
      };
      const result = await this.post(r);
      if (result) {
        this.buyerConfig = r;
        this.isLogisticsModeDirty = false;
        showSaved('Logistics mode saved successfully.');
      }
    } catch (e) {
      console.error('Error saving logistics mode:', e);
      showError('Failed to save logistics mode.'); // unreachable
    } finally {
      this.isSavingLogisticsMode = false;
      this.update();
    }
  }

  // ------------------------------------------------------------ E. exclusions
  get totalPages() {
    return Math.ceil(this.excludedCustomers.length / this.pageSize) || 1;
  }
  get paginatedCustomers() {
    return this.excludedCustomers.slice((this.currentPage - 1) * this.pageSize, this.currentPage * this.pageSize);
  }
  goToPage(p: number) {
    if (p < 1 || p > this.totalPages) return;
    this.currentPage = p;
    this.update();
  }
  onPageSizeChange(size: number) {
    this.pageSize = size;
    this.currentPage = 1;
    this.update();
  }

  async saveExclusionConfig(list: Exclusion[]): Promise<boolean> {
    if (!this.buyerId) return false;
    this.isSaving = true;
    this.update();
    try {
      const r = this.buyerConfig || defaultSkeleton();
      r.customerExclusionConfig = { excludedCustomers: list };
      const result = await this.post(r);
      if (result) this.buyerConfig = r;
      return !!result;
    } catch (e) {
      console.error('Error saving exclusion config:', e);
      return false;
    } finally {
      this.isSaving = false;
      this.update();
    }
  }

  openAddForm() {
    this.fieldName = 'UID';
    this.fieldValue = '';
    this.status = 'Active';
    this.showAddForm = true;
    this.update();
  }
  cancelAdd() {
    this.showAddForm = false;
    this.fieldName = 'UID';
    this.fieldValue = '';
    this.status = 'Active';
    this.update();
  }

  async addCustomer() {
    if (!this.fieldName || !this.fieldValue.trim()) return;
    const entry: Exclusion = { fieldName: this.fieldName, value: this.fieldValue.trim(), status: this.status };
    if (this.excludedCustomers.some((c) => c.fieldName === entry.fieldName && c.value === entry.value)) {
      alert('This configuration already exists.');
      return;
    }
    const list = [...this.excludedCustomers, entry];
    const ok = await this.saveExclusionConfig(list);
    if (ok) {
      this.excludedCustomers = list; // no success toast
      this.cancelAdd();
    }
  }

  openEditForm(row: Exclusion) {
    this.editIndex = this.excludedCustomers.findIndex((c) => c.fieldName === row.fieldName && c.value === row.value);
    this.editFieldName = row.fieldName;
    this.editFieldValue = row.value;
    this.editStatus = row.status;
    this.showEditForm = true;
    this.update();
  }
  cancelEdit() {
    this.showEditForm = false;
    this.editIndex = -1;
    this.editFieldName = 'UID';
    this.editFieldValue = '';
    this.editStatus = 'Active';
    this.update();
  }

  async saveEdit() {
    if (!this.editFieldName || !this.editFieldValue.trim() || this.editIndex < 0) return;
    const value = this.editFieldValue.trim();
    if (this.excludedCustomers.some((c, i) => i !== this.editIndex && c.fieldName === this.editFieldName && c.value === value)) {
      alert('This configuration already exists.');
      return;
    }
    const list = [...this.excludedCustomers];
    list[this.editIndex] = { fieldName: this.editFieldName, value, status: this.editStatus };
    const ok = await this.saveExclusionConfig(list);
    if (ok) {
      this.excludedCustomers = list;
      this.cancelEdit();
    }
  }

  async removeCustomer(row: Exclusion) {
    const res = await Swal.fire({
      title: 'Are you sure you want to delete this Configuration?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Yes, delete',
      cancelButtonText: 'Cancel',
    });
    if (!res.isConfirmed) return;
    const list = this.excludedCustomers.filter((c) => !(c.fieldName === row.fieldName && c.value === row.value)); // removes ALL matches
    const ok = await this.saveExclusionConfig(list);
    if (ok) {
      this.excludedCustomers = list;
      if (this.paginatedCustomers.length === 0 && this.currentPage > 1) this.currentPage--;
      this.update();
    }
  }
}

/** Angular number accessor: "" → null, otherwise parseFloat. */
const numOrNull = (v: string): number | null => (v === '' ? null : parseFloat(v));

function SaveButton({ disabled, saving, onClick }: { disabled: boolean; saving: boolean; onClick: () => void }) {
  return (
    <button className="save-config-btn" disabled={disabled} onClick={onClick}>
      <i className={saving ? 'fas fa-spinner fa-spin' : 'fas fa-save'} /> {saving ? 'Saving...' : 'Save'}
    </button>
  );
}

function ExclusionModal({
  title,
  saveLabel,
  radioName,
  fieldName,
  value,
  status,
  onField,
  onValue,
  onStatus,
  onCancel,
  onSave,
  saveDisabled,
}: {
  title: string;
  saveLabel: string;
  radioName: string;
  fieldName: string;
  value: string;
  status: string;
  onField: (v: string) => void;
  onValue: (v: string) => void;
  onStatus: (v: string) => void;
  onCancel: () => void;
  onSave: () => void;
  saveDisabled: boolean;
}) {
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{title}</h3>
          <button className="close-btn" onClick={onCancel}>
            <i className="fas fa-times" />
          </button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label>
              Field Name <span className="required">*</span>
            </label>
            <select className="form-input form-select" value={fieldName} onChange={(e) => onField(e.target.value)}>
              {FIELD_NAMES.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>
              Value <span className="required">*</span>
            </label>
            <input type="text" className="form-input" placeholder="Enter value" value={value} onChange={(e) => onValue(e.target.value)} />
          </div>
          <div className="form-group">
            <label>
              Status <span className="required">*</span>
            </label>
            <div className="radio-group">
              {(['Active', 'Inactive'] as const).map((s) => (
                <label className="radio-label" key={s}>
                  <input type="radio" name={radioName} value={s} checked={status === s} onChange={() => onStatus(s)} /> {s}
                </label>
              ))}
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="cancel-btn" onClick={onCancel}>
            Cancel
          </button>
          {/* isSaving does NOT disable the button → a double click submits twice (as-built) */}
          <button className="save-btn" disabled={saveDisabled} onClick={onSave}>
            {saveLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function DeliverySettingsPage() {
  const [, force] = useReducer((x: number) => x + 1, 0);
  const [c] = useState(() => {
    const controller = new DeliverySettingsController();
    controller.buyerId = authService.getCurrentUser()?.id || '';
    return controller;
  });
  c.update = force;
  useEffect(() => {
    c.loadSettings();
    return () => {
      c.update = () => {};
    };
  }, [c]);

  const rp = c.routePlanningConfig;
  const total = c.excludedCustomers.length;
  const start = (c.currentPage - 1) * c.pageSize + 1;
  const end = Math.min(c.currentPage * c.pageSize, total);

  const configCards: { icon: string; label: string; hint: string; unit: string; min: number; max: number; step?: number; value: number | null; onChange: (v: string) => void }[] = [
    {
      icon: 'fas fa-clock', label: 'Service Time per Stop', hint: 'Time spent at each delivery point', unit: 'minutes', min: 1, max: 60,
      value: rp.serviceTimeMinutes, onChange: (v) => ((rp.serviceTimeMinutes = numOrNull(v)), c.onRoutePlanningChange()),
    },
    {
      icon: 'fas fa-road', label: 'Max Travel Time', hint: 'Maximum travel time per route', unit: 'hours', min: 0.5, max: 24, step: 0.5,
      value: c.maxTravelTimeHours, onChange: (v) => ((c.maxTravelTimeHours = numOrNull(v)), c.onMaxTravelTimeHoursChange()),
    },
    {
      icon: 'fas fa-map-marker-alt', label: 'Max Stops per Vehicle', hint: 'Maximum delivery stops per route', unit: 'stops', min: 1, max: 100,
      value: rp.maxStops, onChange: (v) => ((rp.maxStops = numOrNull(v)), c.onRoutePlanningChange()),
    },
    {
      icon: 'fas fa-route', label: 'Max Distance', hint: 'Maximum delivery distance per route', unit: 'km', min: 1, max: 500,
      value: rp.maxDistanceKm, onChange: (v) => ((rp.maxDistanceKm = numOrNull(v)), c.onRoutePlanningChange()),
    },
  ];

  return (
    <div className="delivery-settings-page">
      {/* ---------------------------------------------------------------- A. Route Planning */}
      <section className="settings-section route-planning-section">
        <div className="section-header">
          <h2>Route Planning Configuration</h2>
          <div className="header-actions">
            <button className="reset-btn" title="Reset to defaults" onClick={() => c.resetRoutePlanningConfig()}>
              <i className="fas fa-undo" />
              {' Reset Defaults '}
            </button>
            <SaveButton disabled={!c.isRoutePlanningDirty || c.isSavingRoutePlanning} saving={c.isSavingRoutePlanning} onClick={() => c.saveRoutePlanningConfig()} />
          </div>
        </div>
        <div className="config-grid">
          {configCards.map((card) => (
            <div className="config-card" key={card.label}>
              <div className="config-icon">
                <i className={card.icon} />
              </div>
              <div className="config-details">
                <label className="config-label">{card.label}</label>
                <span className="config-hint">{card.hint}</span>
              </div>
              <div className="config-input-wrap">
                <input
                  type="number"
                  className="config-input"
                  min={card.min}
                  max={card.max}
                  step={card.step}
                  value={card.value ?? ''}
                  onKeyDown={(e) => c.preventNegativeInput(e)}
                  onChange={(e) => card.onChange(e.target.value)}
                />
                <span className="config-unit">{card.unit}</span>
              </div>
            </div>
          ))}
          {c.routeEngineVisible && (
            <div className="config-card route-engine-card">
              <div className="config-icon">
                <i className="fas fa-cogs" />
              </div>
              <div className="config-details">
                <label className="config-label">Route Engine</label>
                <span className="config-hint">Algorithm used for route planning</span>
                <div className="route-engine-options">
                  {c.engineOptions.map((o) => (
                    <label key={o.value} className={`route-engine-option${c.selectedEngine === o.value ? ' selected' : ''}`}>
                      <input
                        type="radio"
                        name="routeEngine"
                        value={o.value}
                        checked={c.selectedEngine === o.value}
                        onChange={() => ((c.selectedEngine = o.value), c.onRoutePlanningChange())}
                      />
                      <div className="route-engine-option-body">
                        <div className="route-engine-option-title">
                          <span className="route-engine-option-name">{o.label}</span>
                          {o.isDefault && <span className="route-engine-default-badge">Default</span>}
                        </div>
                        <p className="route-engine-option-desc">{o.description}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ---------------------------------------------------------------- B. Proof of Delivery */}
      <section className="settings-section otp-config-section">
        <div className="section-header">
          <div className="section-title-group">
            <div className="config-icon">
              <i className="fas fa-check-circle" />
            </div>
            <h2>Proof of Delivery (OTP)</h2>
          </div>
          <SaveButton disabled={!c.isOtpDirty || c.isSavingOtp} saving={c.isSavingOtp} onClick={() => c.saveOtpConfig()} />
        </div>
        <div className="config-grid">
          {[
            { icon: 'fas fa-store', label: 'Seller OTP', hint: '(Pickup & Return)', on: c.sellerOtpEnabled, set: (v: boolean) => (c.sellerOtpEnabled = v) },
            { icon: 'fas fa-truck', label: 'Retailer OTP', hint: '(Delivery)', on: c.retailerOtpEnabled, set: (v: boolean) => (c.retailerOtpEnabled = v) },
          ].map((t) => (
            <div className="config-card otp-toggle-card" key={t.label}>
              <div className="config-icon">
                <i className={t.icon} />
              </div>
              <div className="config-details">
                <label className="config-label">{t.label}</label>
                <span className="config-hint">{t.hint}</span>
              </div>
              <div className="otp-toggle-wrap">
                <span className={`otp-status-label ${t.on ? 'enabled' : 'disabled'}`}>
                  {t.on && <span className="status-dot" />}
                  {t.on ? 'Enabled' : 'Disabled'}
                </span>
                <label className="toggle-switch">
                  <input type="checkbox" checked={t.on} onChange={(e) => (t.set(e.target.checked), c.onOtpChange())} />
                  <span className="toggle-slider" />
                </label>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ---------------------------------------------------------------- C. ONDC */}
      <section className="settings-section ondc-config-section">
        <div className="section-header">
          <div className="section-title-group">
            <div className="config-icon">
              <i className="fas fa-network-wired" />
            </div>
            <div>
              <h2>ONDC Search Configuration</h2>
              <p className="section-subtitle">
                Controls the product category sent during <strong>Search Vehicles</strong> requests to the ONDC network.
              </p>
            </div>
          </div>
          <div className="ondc-header-actions">
            <div className="ondc-select-wrap">
              <select
                className="ondc-category-select"
                value={c.selectedOndcPayloadCategory ?? ''}
                onChange={(e) => ((c.selectedOndcPayloadCategory = e.target.value), c.onOndcCategoryChange())}
              >
                <option value="" disabled>
                  -- Select Category --
                </option>
                {ONDC_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
              <i className="fas fa-chevron-down ondc-select-arrow" />
            </div>
            <SaveButton
              disabled={!c.isOndcCategoryDirty || c.isSavingOndcCategory || !c.selectedOndcPayloadCategory}
              saving={c.isSavingOndcCategory}
              onClick={() => c.saveOndcPayloadCategory()}
            />
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- D. Logistics Selection */}
      <section className="settings-section logistics-mode-section">
        <div className="section-header">
          <div className="section-title-group">
            <div className="config-icon">
              <i className="fas fa-shuffle" />
            </div>
            <div>
              <h2>Logistics Selection</h2>
              <p className="section-subtitle">Choose the default logistics mode used across the platform.</p>
            </div>
          </div>
          <SaveButton disabled={!c.isLogisticsModeDirty || c.isSavingLogisticsMode} saving={c.isSavingLogisticsMode} onClick={() => c.saveLogisticsMode()} />
        </div>
        <div className="logistics-mode-radios">
          {LOGISTICS_MODES.map((m) => (
            <label className="logistics-mode-option" key={m}>
              <input
                type="radio"
                name="logisticsMode"
                value={m}
                checked={c.selectedLogisticsMode === m}
                onChange={() => ((c.selectedLogisticsMode = m), c.onLogisticsModeChange())}
              />
              <span>{logisticsLabel(m)}</span>
            </label>
          ))}
        </div>
      </section>

      {/* ---------------------------------------------------------------- D2. CDS Order Routing (saves on its own) */}
      <CdsRoutingSection buyerId={c.buyerId} />

      {/* ---------------------------------------------------------------- E. Exclusions */}
      <section className="settings-section">
        <div className="section-header">
          <h2>Exclusions</h2>
          <button className="add-customer-btn" onClick={() => c.openAddForm()}>
            <i className="fas fa-plus" />
            {' Add Exclusion '}
          </button>
        </div>
        {total > 0 ? (
          <>
            <div className="table-container">
              <table className="customers-table">
                <thead>
                  <tr>
                    <th>S No</th>
                    <th>Field Name</th>
                    <th>Value</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {c.paginatedCustomers.map((row, i) => (
                    <tr key={`${row.fieldName}-${row.value}-${i}`}>
                      <td>{(c.currentPage - 1) * c.pageSize + i + 1}</td>
                      <td>{row.fieldName}</td>
                      <td>{row.value}</td>
                      <td>
                        <span className={`status-badge ${row.status === 'Active' ? 'active' : 'inactive'}`}>{row.status}</span>
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button className="edit-btn" onClick={() => c.openEditForm(row)}>
                            <i className="fas fa-pen" />
                          </button>
                          <button className="delete-btn" onClick={() => c.removeCustomer(row)}>
                            <i className="fas fa-trash" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="pagination-container">
              <div className="rows-per-page">
                <span>Rows per page:</span>
                <select value={c.pageSize} onChange={(e) => c.onPageSizeChange(Number(e.target.value))}>
                  {[25, 50, 100].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </div>
              <span className="page-info">{`${start}–${end} of ${total}`}</span>
              <div className="page-nav">
                <button className="page-btn" disabled={c.currentPage === 1} onClick={() => c.goToPage(c.currentPage - 1)}>
                  <i className="fas fa-chevron-left" />
                </button>
                <button className="page-btn" disabled={c.currentPage === c.totalPages} onClick={() => c.goToPage(c.currentPage + 1)}>
                  <i className="fas fa-chevron-right" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="empty-state">No excluded customers configured yet.</div>
        )}
      </section>

      {c.showAddForm && (
        <ExclusionModal
          title="Add Configuration"
          saveLabel=" Save "
          radioName="status"
          fieldName={c.fieldName}
          value={c.fieldValue}
          status={c.status}
          onField={(v) => ((c.fieldName = v), c.update())}
          onValue={(v) => ((c.fieldValue = v), c.update())}
          onStatus={(v) => ((c.status = v), c.update())}
          onCancel={() => c.cancelAdd()}
          onSave={() => c.addCustomer()}
          saveDisabled={!c.fieldName || !c.fieldValue.trim()}
        />
      )}
      {c.showEditForm && (
        <ExclusionModal
          title="Edit Exclusion"
          saveLabel=" Update "
          radioName="editStatus"
          fieldName={c.editFieldName}
          value={c.editFieldValue}
          status={c.editStatus}
          onField={(v) => ((c.editFieldName = v), c.update())}
          onValue={(v) => ((c.editFieldValue = v), c.update())}
          onStatus={(v) => ((c.editStatus = v), c.update())}
          onCancel={() => c.cancelEdit()}
          onSave={() => c.saveEdit()}
          saveDisabled={!c.editFieldName || !c.editFieldValue.trim()}
        />
      )}
    </div>
  );
}
