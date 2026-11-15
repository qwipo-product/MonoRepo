// CDS User Settings — the LBNP Settings screens for a CDS store: Profile (Business Details, Store Timings, Warehouse
// Locations) and Delivery (Route Planning Configuration with Route Engine, Proof of Delivery (OTP), ONDC Search
// Configuration, Logistics Selection, Exclusions). Saved per CDS store.
import { useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import { cdsApi } from '../../api/services/cds.service';
import { DEFAULT_STORE_CONFIG, type StoreConfig } from '../../cds/types';
import { OndcCategory, RouteEngines } from '../../types/enums';
import { Loading, useAction, useCdsSession, useLoad, useMeta } from './ui';
import '../settings/ProfilePage.css';
import '../settings/modules/settings-modules.css';
import '../settings/DeliverySettingsPage.css';

const WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const LOGISTICS_MODES: StoreConfig['logisticsMode'][] = ['self', '3pl', 'self+3pl'];
const logisticsLabel = (m: string) => (m === 'self' ? 'Self' : m === '3pl' ? '3PL' : m === 'self+3pl' ? 'Self + 3PL' : m);
const ONDC_CATEGORIES: string[] = Object.values(OndcCategory);
const FIELD_NAMES = ['UID', 'DsType'];

function SaveButton({ disabled, saving, onClick }: { disabled: boolean; saving: boolean; onClick: () => void }) {
  return (
    <button className="save-config-btn" disabled={disabled} onClick={onClick}>
      <i className={saving ? 'fas fa-spinner fa-spin' : 'fas fa-save'} /> {saving ? 'Saving...' : 'Save'}
    </button>
  );
}

/** Settings › Profile — same layout as LBNP Profile: Business Details, Store Timings, Warehouse Locations. */
export function CuProfile() {
  const { user, store } = useCdsSession();
  const meta = useMeta();
  const st = meta.data?.stores.find((x) => x.id === store);
  const cfg = useLoad(() => cdsApi.storeSettings(), []);
  const { run } = useAction();
  const field = (label: string, value?: string | null) => (
    <div className="profile-field" key={label}>
      <label>{label}</label>
      <div className="profile-value"><span className="profile-data">{value || 'Not provided'}</span></div>
    </div>
  );
  const editHours = async () => {
    const c = cfg.data ?? DEFAULT_STORE_CONFIG;
    const r = await Swal.fire({
      title: 'Business Hours',
      html: `<div class="text-start small"><label class="form-label mb-1">Shop Opening Time *</label><input id="bh-open" type="time" class="form-control mb-3" value="${c.openingTime}"><label class="form-label mb-1">Shop Closing Time *</label><input id="bh-close" type="time" class="form-control" value="${c.closingTime}"></div>`,
      showCancelButton: true, confirmButtonText: 'Save', confirmButtonColor: '#1e3a8a', reverseButtons: true,
      preConfirm: () => {
        const open = (document.getElementById('bh-open') as HTMLInputElement).value;
        const close = (document.getElementById('bh-close') as HTMLInputElement).value;
        if (!open || !close) return Swal.showValidationMessage('Select the opening and closing time');
        if (close <= open) return Swal.showValidationMessage('Closing time must be after opening time');
        return { openingTime: open, closingTime: close };
      },
    });
    if (r.isConfirmed && (await run(() => cdsApi.updateStoreSettings(r.value), 'Business hours updated successfully'))) cfg.reload();
  };
  const editHolidays = async () => {
    const c = cfg.data ?? DEFAULT_STORE_CONFIG;
    const r = await Swal.fire({
      title: 'Non-Operating Days',
      html: `<div class="text-start small">${WEEK.map((d) => `<label class="d-flex align-items-center gap-2 mb-1"><input type="checkbox" class="form-check-input m-0" value="${d}" ${c.weeklyHolidays.includes(d) ? 'checked' : ''}> ${d}</label>`).join('')}</div>`,
      showCancelButton: true, confirmButtonText: 'Save', confirmButtonColor: '#1e3a8a', reverseButtons: true,
      preConfirm: () => ({ weeklyHolidays: Array.from(document.querySelectorAll<HTMLInputElement>('.swal2-html-container input[type=checkbox]:checked')).map((x) => x.value) }),
    });
    if (r.isConfirmed && (await run(() => cdsApi.updateStoreSettings(r.value), 'Non-operating days updated successfully'))) cfg.reload();
  };
  return (
    <div className="profile-page st-scope">
      <section className="profile-grid">
        <section className="settings-section profile-settings-section">
          <div className="section-header"><h2>Business Details</h2><p>Manage your personal and business information</p></div>
          <div className="profile-content">
            {field('Name', user?.name)}
            {field('Email Address', user?.email)}
            {field('Business Name', st?.name)}
            {field('Phone Number', user?.mobile)}
          </div>
        </section>

        <section className="settings-section store-timings">
          <div className="section-header"><h2>Store Timings</h2><p>Configure your business operating hours and non-operating days</p></div>
          <div className="settings-cards">
            <div className="settings-card">
              <div className="card-icon"><i className="far fa-clock" /></div>
              <div className="card-content">
                <h3>Business Hours</h3>
                <p>{cfg.data ? `${cfg.data.openingTime} – ${cfg.data.closingTime}` : 'Configure your business operating hours and open days'}</p>
              </div>
              <button className="edit-btn" onClick={() => void editHours()}><i className="fas fa-edit" /> Edit</button>
            </div>
            <div className="settings-card">
              <div className="card-icon"><i className="fas fa-calendar-times" /></div>
              <div className="card-content">
                <h3>Non-Operating Days</h3>
                <p>{cfg.data?.weeklyHolidays.length ? cfg.data.weeklyHolidays.join(', ') : 'Manage holidays and other non-operating days'}</p>
              </div>
              <button className="edit-btn" onClick={() => void editHolidays()}><i className="fas fa-edit" /> Edit</button>
            </div>
          </div>
        </section>

        <section className="settings-section warehouse-locations">
          <div className="section-header-with-action">
            <div className="section-header"><h2>Warehouse Locations</h2><p>Your CDS store address (set by the CDS Service Centre)</p></div>
          </div>
          <div className="locations-list">
            {st ? (
              <div className="location-card">
                <div className="location-content">
                  <div className="location-name">{st.name}</div>
                  <div className="location-address">{` ${st.address}${st.city ? ', ' + st.city : ''} `}</div>
                  <div className="location-actions"><button className="default-address-badge">Default Address</button></div>
                </div>
              </div>
            ) : <div className="no-locations">No warehouse locations added yet</div>}
          </div>
        </section>
      </section>
    </div>
  );
}

type Exclusion = StoreConfig['exclusions'][number];

/** Settings › Delivery — same screen as LBNP Settings › Delivery, saved for this CDS store. */
export function CuDeliverySettings() {
  const cfg = useLoad(() => cdsApi.storeSettings(), []);
  const { run } = useAction();
  const [c, setC] = useState<StoreConfig | null>(null);
  const [saving, setSaving] = useState<string | null>(null);
  const [form, setForm] = useState<{ mode: 'add' | 'edit'; index: number; row: Exclusion } | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  useEffect(() => { if (cfg.data) setC(cfg.data); }, [cfg.data]);
  if (!c || !cfg.data) return <Loading />;
  const saved = cfg.data;
  const set = (p: Partial<StoreConfig>) => setC((x) => (x ? { ...x, ...p } : x));
  const dirty = (keys: (keyof StoreConfig)[]) => keys.some((k) => JSON.stringify(c[k]) !== JSON.stringify(saved[k]));
  const save = async (section: string, keys: (keyof StoreConfig)[], msg: string) => {
    setSaving(section);
    const body = Object.fromEntries(keys.map((k) => [k, c[k]])) as Partial<StoreConfig>;
    if (await run(() => cdsApi.updateStoreSettings(body), msg)) cfg.reload();
    setSaving(null);
  };
  const saveExclusions = async (exclusions: Exclusion[], msg: string) => {
    if (await run(() => cdsApi.updateStoreSettings({ exclusions }), msg)) cfg.reload();
  };
  const route: (keyof StoreConfig)[] = ['serviceTimeMinutes', 'maxTravelHours', 'maxStops', 'maxDistanceKm', 'routeEngine'];
  const cards: { key: 'serviceTimeMinutes' | 'maxTravelHours' | 'maxStops' | 'maxDistanceKm'; icon: string; label: string; hint: string; unit: string; min: number; max: number; step?: number }[] = [
    { key: 'serviceTimeMinutes', icon: 'fas fa-clock', label: 'Service Time per Stop', hint: 'Time spent at each delivery point', unit: 'minutes', min: 1, max: 60 },
    { key: 'maxTravelHours', icon: 'fas fa-road', label: 'Max Travel Time', hint: 'Maximum travel time per route', unit: 'hours', min: 0.5, max: 24, step: 0.5 },
    { key: 'maxStops', icon: 'fas fa-map-marker-alt', label: 'Max Stops per Vehicle', hint: 'Maximum delivery stops per route', unit: 'stops', min: 1, max: 100 },
    { key: 'maxDistanceKm', icon: 'fas fa-route', label: 'Max Distance', hint: 'Maximum delivery distance per route', unit: 'km', min: 1, max: 500 },
  ];
  const total = c.exclusions.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const rows = c.exclusions.slice((page - 1) * pageSize, page * pageSize);
  const removeExclusion = async (i: number) => {
    const ok = await Swal.fire({ title: 'Delete Exclusion?', text: 'Are you sure you want to delete this exclusion?', icon: 'warning', showCancelButton: true, confirmButtonColor: '#d33', cancelButtonColor: '#3085d6', confirmButtonText: 'Yes, Delete' });
    if (ok.isConfirmed) void saveExclusions(c.exclusions.filter((_, j) => j !== i), 'Exclusion deleted');
  };
  return (
    <div className="delivery-settings-page">
      <section className="settings-section route-planning-section">
        <div className="section-header">
          <h2>Route Planning Configuration</h2>
          <div className="header-actions">
            <button className="reset-btn" title="Reset to defaults" onClick={() => set(Object.fromEntries(route.map((k) => [k, DEFAULT_STORE_CONFIG[k]])) as Partial<StoreConfig>)}><i className="fas fa-undo" />{' Reset Defaults '}</button>
            <SaveButton disabled={!dirty(route) || saving === 'route'} saving={saving === 'route'} onClick={() => void save('route', route, 'Route planning configuration saved')} />
          </div>
        </div>
        <div className="config-grid">
          {cards.map((card) => (
            <div className="config-card" key={card.key}>
              <div className="config-icon"><i className={card.icon} /></div>
              <div className="config-details">
                <label className="config-label" htmlFor={`cu-${card.key}`}>{card.label}</label>
                <span className="config-hint">{card.hint}</span>
              </div>
              <div className="config-input-wrap">
                <input id={`cu-${card.key}`} type="number" className="config-input" min={card.min} max={card.max} step={card.step} value={c[card.key]}
                  onKeyDown={(e) => { if (e.key === '-' || e.key === 'e') e.preventDefault(); }}
                  onChange={(e) => set({ [card.key]: e.target.value === '' ? 0 : parseFloat(e.target.value) } as Partial<StoreConfig>)} />
                <span className="config-unit">{card.unit}</span>
              </div>
            </div>
          ))}
          <div className="config-card route-engine-card">
            <div className="config-icon"><i className="fas fa-cogs" /></div>
            <div className="config-details">
              <label className="config-label">Route Engine</label>
              <span className="config-hint">Algorithm used for route planning</span>
              <div className="route-engine-options">
                {RouteEngines.map((o) => (
                  <label key={o.value} className={`route-engine-option${c.routeEngine === o.value ? ' selected' : ''}`}>
                    <input type="radio" name="cuRouteEngine" value={o.value} checked={c.routeEngine === o.value} onChange={() => set({ routeEngine: o.value })} />
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
        </div>
      </section>

      <section className="settings-section otp-config-section">
        <div className="section-header">
          <div className="section-title-group">
            <div className="config-icon"><i className="fas fa-check-circle" /></div>
            <h2>Proof of Delivery (OTP)</h2>
          </div>
          <SaveButton disabled={!dirty(['sellerOtp', 'retailerOtp']) || saving === 'otp'} saving={saving === 'otp'} onClick={() => void save('otp', ['sellerOtp', 'retailerOtp'], 'OTP configuration saved')} />
        </div>
        <div className="config-grid">
          {([
            { key: 'sellerOtp', icon: 'fas fa-store', label: 'Seller OTP', hint: '(Pickup & Return)' },
            { key: 'retailerOtp', icon: 'fas fa-truck', label: 'Retailer OTP', hint: '(Delivery)' },
          ] as const).map((x) => (
            <div className="config-card otp-toggle-card" key={x.key}>
              <div className="config-icon"><i className={x.icon} /></div>
              <div className="config-details"><label className="config-label">{x.label}</label><span className="config-hint">{x.hint}</span></div>
              <div className="otp-toggle-wrap">
                <span className={`otp-status-label ${c[x.key] ? 'enabled' : 'disabled'}`}>{c[x.key] && <span className="status-dot" />}{c[x.key] ? 'Enabled' : 'Disabled'}</span>
                <label className="toggle-switch">
                  <input type="checkbox" aria-label={x.label} checked={c[x.key]} onChange={(e) => set({ [x.key]: e.target.checked } as Partial<StoreConfig>)} />
                  <span className="toggle-slider" />
                </label>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="settings-section ondc-config-section">
        <div className="section-header">
          <div className="section-title-group">
            <div className="config-icon"><i className="fas fa-network-wired" /></div>
            <div>
              <h2>ONDC Search Configuration</h2>
              <p className="section-subtitle">Controls the product category sent during <strong>Search Vehicles</strong> requests to the ONDC network.</p>
            </div>
          </div>
          <div className="ondc-header-actions">
            <div className="ondc-select-wrap">
              <select className="ondc-category-select" aria-label="ONDC category" value={c.ondcCategory} onChange={(e) => set({ ondcCategory: e.target.value })}>
                <option value="" disabled>-- Select Category --</option>
                {ONDC_CATEGORIES.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
              </select>
              <i className="fas fa-chevron-down ondc-select-arrow" />
            </div>
            <SaveButton disabled={!dirty(['ondcCategory']) || saving === 'ondc' || !c.ondcCategory} saving={saving === 'ondc'} onClick={() => void save('ondc', ['ondcCategory'], 'ONDC search category saved')} />
          </div>
        </div>
      </section>

      <section className="settings-section logistics-mode-section">
        <div className="section-header">
          <div className="section-title-group">
            <div className="config-icon"><i className="fas fa-shuffle" /></div>
            <div><h2>Logistics Selection</h2><p className="section-subtitle">Choose the default logistics mode used across the platform.</p></div>
          </div>
          <SaveButton disabled={!dirty(['logisticsMode']) || saving === 'mode'} saving={saving === 'mode'} onClick={() => void save('mode', ['logisticsMode'], 'Logistics mode saved')} />
        </div>
        <div className="logistics-mode-radios">
          {LOGISTICS_MODES.map((m) => (
            <label className="logistics-mode-option" key={m}>
              <input type="radio" name="cuLogisticsMode" value={m} checked={c.logisticsMode === m} onChange={() => set({ logisticsMode: m })} />
              <span>{logisticsLabel(m)}</span>
            </label>
          ))}
        </div>
      </section>

      <section className="settings-section">
        <div className="section-header">
          <h2>Exclusions</h2>
          <button className="add-customer-btn" onClick={() => setForm({ mode: 'add', index: -1, row: { fieldName: 'UID', value: '', status: 'Active' } })}><i className="fas fa-plus" />{' Add Exclusion '}</button>
        </div>
        {total > 0 ? (
          <>
            <div className="table-container">
              <table className="customers-table">
                <thead><tr><th>S No</th><th>Field Name</th><th>Value</th><th>Status</th><th>Actions</th></tr></thead>
                <tbody>
                  {rows.map((row, i) => {
                    const idx = (page - 1) * pageSize + i;
                    return (
                      <tr key={`${row.fieldName}-${row.value}-${idx}`}>
                        <td>{idx + 1}</td><td>{row.fieldName}</td><td>{row.value}</td>
                        <td><span className={`status-badge ${row.status === 'Active' ? 'active' : 'inactive'}`}>{row.status}</span></td>
                        <td>
                          <div className="action-buttons">
                            <button className="edit-btn" aria-label="Edit exclusion" onClick={() => setForm({ mode: 'edit', index: idx, row: { ...row } })}><i className="fas fa-pen" /></button>
                            <button className="delete-btn" aria-label="Delete exclusion" onClick={() => void removeExclusion(idx)}><i className="fas fa-trash" /></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="pagination-container">
              <div className="rows-per-page">
                <span>Rows per page:</span>
                <select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}>{[25, 50, 100].map((n) => <option key={n} value={n}>{n}</option>)}</select>
              </div>
              <span className="page-info">{`${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, total)} of ${total}`}</span>
              <div className="page-nav">
                <button className="page-btn" aria-label="Previous page" disabled={page === 1} onClick={() => setPage(page - 1)}><i className="fas fa-chevron-left" /></button>
                <button className="page-btn" aria-label="Next page" disabled={page === totalPages} onClick={() => setPage(page + 1)}><i className="fas fa-chevron-right" /></button>
              </div>
            </div>
          </>
        ) : <div className="empty-state">No excluded customers configured yet.</div>}
      </section>

      {form && (
        <div className="modal-overlay" onClick={() => setForm(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{form.mode === 'add' ? 'Add Configuration' : 'Edit Exclusion'}</h3>
              <button className="close-btn" aria-label="Close" onClick={() => setForm(null)}><i className="fas fa-times" /></button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Field Name <span className="required">*</span></label>
                <select className="form-input form-select" value={form.row.fieldName} onChange={(e) => setForm({ ...form, row: { ...form.row, fieldName: e.target.value } })}>{FIELD_NAMES.map((n) => <option key={n} value={n}>{n}</option>)}</select>
              </div>
              <div className="form-group">
                <label>Value <span className="required">*</span></label>
                <input type="text" className="form-input" placeholder="Enter value" value={form.row.value} onChange={(e) => setForm({ ...form, row: { ...form.row, value: e.target.value } })} />
              </div>
              <div className="form-group">
                <label>Status <span className="required">*</span></label>
                <div className="radio-group">
                  {['Active', 'Inactive'].map((s) => (
                    <label className="radio-label" key={s}><input type="radio" name="cuExStatus" value={s} checked={form.row.status === s} onChange={() => setForm({ ...form, row: { ...form.row, status: s } })} /> {s}</label>
                  ))}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="cancel-btn" onClick={() => setForm(null)}>Cancel</button>
              <button className="save-btn" disabled={!form.row.fieldName || !form.row.value.trim()} onClick={() => {
                const row = { ...form.row, value: form.row.value.trim() };
                const next = form.mode === 'add' ? [...c.exclusions, row] : c.exclusions.map((x, j) => (j === form.index ? row : x));
                setForm(null);
                void saveExclusions(next, form.mode === 'add' ? 'Exclusion added' : 'Exclusion updated');
              }}>{form.mode === 'add' ? ' Save ' : ' Update '}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
