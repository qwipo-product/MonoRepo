// CDS User Settings (/cds/settings): replica of the LBNP Settings shell (src/pages/settings/SettingsPage.tsx) with three
// tabs — Profile (read-only, ProfilePage look), Vehicles and Delivery Persons (Beats tab look: table + Add modal).
// The active tab is the `?tab=` query parameter (profile | vehicles | delivery-persons; anything else → Profile).
// Removed by decision: Delivery, Beats, Clusters, Category Sequence, Payment, Users & Permissions.
import { useState, type ReactNode } from 'react';
import { useSearchParams } from 'react-router';
import DataLoading from '../../../components/DataLoading';
import { cdsApi } from '../../../api/services/cds.service';
import type { DeliveryPerson, Vehicle } from '../../../cds/types';
import { refreshMeta, useAction, useCdsSession, useLoad, useMeta } from '../ui';
import '../../settings/SettingsPage.css';
import '../../settings/modules/settings-modules.css';
import '../../settings/ProfilePage.css';
import '../../settings/BeatsPage.css';

type TabKey = 'profile' | 'vehicles' | 'delivery-persons';
const TABS: { key: TabKey; icon: string; label: string }[] = [
  { key: 'profile', icon: 'fas fa-user-circle', label: 'Profile' },
  { key: 'vehicles', icon: 'fas fa-truck', label: 'Vehicles' },
  { key: 'delivery-persons', icon: 'fas fa-id-badge', label: 'Delivery Persons' },
];

export function CuSettingsPage() {
  const [params, setParams] = useSearchParams();
  const raw = params.get('tab');
  const activeTab: TabKey = TABS.find((t) => t.key === raw)?.key ?? 'profile';

  return (
    <div className="settings-container">
      <header className="settings-header">
        <div className="header-left">
          <h1>
            <i className="fas fa-cog" /> Settings
          </h1>
          <p className="subtitle">View your profile and manage your CDS store&apos;s vehicles and delivery persons.</p>
        </div>
      </header>
      <div className="content-container">
        <div className="tabs-container">
          <div className="tabs" role="tablist">
            {TABS.map((t) => (
              <button
                key={t.key}
                role="tab"
                aria-selected={activeTab === t.key}
                className={`tab-btn${activeTab === t.key ? ' active' : ''}`}
                onClick={() => setParams({ tab: t.key })}
              >
                <i className={t.icon} />
                {t.label}
              </button>
            ))}
          </div>
        </div>
        <div className="settings-content">
          {activeTab === 'profile' && <ProfileTab />}
          {activeTab === 'vehicles' && <VehiclesTab />}
          {activeTab === 'delivery-persons' && <DeliveryPersonsTab />}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- Profile (read-only)

function ProfileField({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="profile-field">
      <label>{label}</label>
      <div className="profile-value">
        <span className="profile-data">{value || 'Not provided'}</span>
      </div>
    </div>
  );
}

function ProfileTab() {
  const meta = useMeta();
  const { user, store } = useCdsSession();
  const st = meta.data?.stores.find((s) => s.id === store) ?? meta.data?.stores[0];

  if (meta.loading && !meta.data) return <DataLoading message="Loading profile..." />;

  return (
    <div className="profile-page st-scope">
      {meta.error && (
        <div className="text-danger small mb-3">
          <i className="fas fa-triangle-exclamation me-1" />
          {meta.error}{' '}
          <button type="button" className="btn btn-link btn-sm p-0 align-baseline" onClick={() => { refreshMeta(); meta.reload(); }}>
            Retry
          </button>
        </div>
      )}
      <section className="profile-grid">
        <section className="settings-section profile-settings-section">
          <div className="section-header">
            <h2>Store Details</h2>
            <p>Your CDS store&apos;s details</p>
          </div>
          <div className="profile-content">
            <ProfileField label="Store Name" value={st?.name} />
            <ProfileField label="Store Code" value={st?.code} />
            <ProfileField label="Address" value={st?.address} />
            <ProfileField label="Manager Name" value={st?.managerName} />
            <ProfileField label="Manager Phone Number" value={st?.managerPhone} />
            <ProfileField label="Localities" value={st?.localities.join(', ')} />
          </div>
        </section>

        <section className="settings-section profile-settings-section">
          <div className="section-header">
            <h2>User Details</h2>
            <p>The details of the signed-in user</p>
          </div>
          <div className="profile-content">
            <ProfileField label="Name" value={user?.name} />
            <ProfileField label="Mobile Number" value={user?.mobile} />
            <ProfileField label="Email Address" value={user?.email} />
          </div>
        </section>
      </section>
    </div>
  );
}

// ---------------------------------------------------------------- Vehicles / Delivery Persons (Beats tab look)

const VEHICLE_TYPES = ['Three Wheeler', 'Pickup', 'Mini Truck', 'Truck'];
/** Same rules as the CDS API. */
const REG_NO_RE = /^[A-Z]{2}\d{2}[A-Z]{1,3}\d{3,4}$/;
const PHONE_RE = /^[6-9]\d{9}$/;

function ActiveSwitch({ label, checked, disabled, onChange }: { label: string; checked: boolean; disabled: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="form-check form-switch m-0 ps-0 d-inline-flex align-items-center gap-2">
      <input className="form-check-input m-0" type="checkbox" role="switch" aria-label={label} checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} />
      <span className={checked ? 'text-success' : 'text-muted'}>{checked ? 'Active' : 'Inactive'}</span>
    </div>
  );
}

/** Settings section with header + Add button, a table and the loading / error / empty states. */
function FleetSection({ title, desc, addLabel, onAdd, head, loading, error, onRetry, empty, children }: {
  title: string; desc: string; addLabel: string; onAdd: () => void; head: string[]; loading: boolean; error: string; onRetry: () => void; empty: string | null; children: ReactNode;
}) {
  return (
    <section className="settings-section">
      <div className="section-header">
        <div>
          <h2>{title}</h2>
          <p className="section-desc">{desc}</p>
        </div>
        <div className="header-actions">
          <button className="btn-primary" onClick={onAdd}>
            <i className="fas fa-plus" /> {addLabel}
          </button>
        </div>
      </div>

      <div className="table-container">
        <table className="customers-table">
          <thead>
            <tr>{head.map((h) => <th key={h}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {loading &&
              Array.from({ length: 4 }, (_, i) => (
                <tr key={`sk-${i}`} className="skeleton-row">
                  {head.map((h) => (
                    <td key={h}>
                      <div className="skeleton-bar" style={{ width: '60%' }} />
                    </td>
                  ))}
                </tr>
              ))}
            {!loading && !error && children}
          </tbody>
        </table>
      </div>

      {!loading && error && (
        <div className="load-error">
          <i className="fas fa-triangle-exclamation" />
          <p>Something went wrong while loading {title.toLowerCase()}. Please try again after some time.</p>
          <button className="retry-btn" onClick={onRetry}>
            Retry
          </button>
        </div>
      )}
      {!loading && !error && empty && <div className="empty-state">{empty}</div>}
    </section>
  );
}

/** Add modal frame (Beats Add Beat modal look). */
function FleetModal({ icon, title, subtitle, saveLabel, canSave, onSave, onClose, children }: {
  icon: string; title: string; subtitle: string; saveLabel: string; canSave: boolean; onSave: () => void; onClose: () => void; children: ReactNode;
}) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h3>
              <i className={`fas ${icon} title-icon`} /> {title}
            </h3>
            <p className="modal-subtitle">{subtitle}</p>
          </div>
          <button className="close-btn" aria-label="Close" onClick={onClose}>
            <i className="fas fa-times" />
          </button>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (canSave) onSave();
          }}
        >
          <div className="modal-body">{children}</div>
          <div className="modal-footer">
            <button type="button" className="cancel-btn" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="save-btn" disabled={!canSave}>
              {saveLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function VehiclesTab() {
  const { data, error, loading, reload } = useLoad(() => cdsApi.fleet(), []);
  const { busy, run } = useAction();
  const [adding, setAdding] = useState(false);
  const vehicles = data?.vehicles ?? [];

  const toggle = async (v: Vehicle, active: boolean) => {
    if (await run(() => cdsApi.setFleetActive('vehicles', v.id, active), `Vehicle ${v.regNo} ${active ? 'activated' : 'deactivated'}`)) reload();
  };
  const add = async (b: { regNo: string; type: string; capacityKg: number }) => {
    if (await run(() => cdsApi.addVehicle(b), `Vehicle ${b.regNo} added`)) {
      setAdding(false);
      reload();
    }
  };

  return (
    <div className="beats-page">
      <FleetSection
        title="Vehicles"
        desc="The vehicles of your CDS store. Only active vehicles can be assigned to delivery trips."
        addLabel="Add Vehicle"
        onAdd={() => setAdding(true)}
        head={['Reg. No.', 'Type', 'Capacity (kg)', 'Active']}
        loading={loading && !data}
        error={data ? '' : error}
        onRetry={reload}
        empty={vehicles.length ? null : 'No vehicles yet. Add a vehicle to get started.'}
      >
        {vehicles.map((v) => (
          <tr key={v.id}>
            <td className="beat-name-cell">{v.regNo}</td>
            <td>{v.type || '—'}</td>
            <td>{v.capacityKg}</td>
            <td>
              <ActiveSwitch label={`Active ${v.regNo}`} checked={v.active} disabled={busy} onChange={(x) => void toggle(v, x)} />
            </td>
          </tr>
        ))}
      </FleetSection>
      {adding && <AddVehicleModal existing={vehicles} busy={busy} onSave={(b) => void add(b)} onClose={() => setAdding(false)} />}
    </div>
  );
}

function AddVehicleModal({ existing, busy, onSave, onClose }: { existing: Vehicle[]; busy: boolean; onSave: (b: { regNo: string; type: string; capacityKg: number }) => void; onClose: () => void }) {
  const [regNo, setRegNo] = useState('');
  const [type, setType] = useState('');
  const [capacity, setCapacity] = useState('');
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const touch = (k: string) => setTouched((t) => ({ ...t, [k]: true }));

  const duplicate = existing.some((v) => v.regNo === regNo);
  const regError = !REG_NO_RE.test(regNo) ? 'Enter a valid registration number, e.g. TS08AB1234' : duplicate ? `${regNo} already exists` : '';
  const typeError = type ? '' : 'Select the vehicle type';
  const capacityError = Number(capacity) > 0 ? '' : 'Enter the capacity in kg';
  // Errors show once the field is left (a duplicate registration number shows at once).
  const show = (k: string, err: string) => !!err && (!!touched[k] || (k === 'regNo' && duplicate));

  return (
    <FleetModal
      icon="fa-truck"
      title="Add Vehicle"
      subtitle="Add a vehicle to your CDS store."
      saveLabel="Add Vehicle"
      canSave={!busy && !regError && !typeError && !capacityError}
      onSave={() => onSave({ regNo, type, capacityKg: Number(capacity) })}
      onClose={onClose}
    >
      <div className="form-group">
        <label htmlFor="cu-veh-reg">
          Registration No. <span className="required">*</span>
        </label>
        <input
          id="cu-veh-reg"
          type="text"
          className={`form-input${show('regNo', regError) ? ' invalid' : ''}`}
          placeholder="e.g. TS08AB1234"
          maxLength={11}
          autoComplete="off"
          autoFocus
          value={regNo}
          onChange={(e) => setRegNo(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
          onBlur={() => touch('regNo')}
        />
        {show('regNo', regError) && <div className="field-error">{regError}</div>}
      </div>
      <div className="form-group">
        <label htmlFor="cu-veh-type">
          Type <span className="required">*</span>
        </label>
        <select id="cu-veh-type" className={`form-input${show('type', typeError) ? ' invalid' : ''}`} value={type} onChange={(e) => setType(e.target.value)} onBlur={() => touch('type')}>
          <option value="">Select vehicle type</option>
          {VEHICLE_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        {show('type', typeError) && <div className="field-error">{typeError}</div>}
      </div>
      <div className="form-group">
        <label htmlFor="cu-veh-cap">
          Capacity (kg) <span className="required">*</span>
        </label>
        <input
          id="cu-veh-cap"
          type="number"
          min={1}
          step="any"
          className={`form-input${show('capacity', capacityError) ? ' invalid' : ''}`}
          placeholder="e.g. 750"
          value={capacity}
          onChange={(e) => setCapacity(e.target.value)}
          onBlur={() => touch('capacity')}
        />
        {show('capacity', capacityError) && <div className="field-error">{capacityError}</div>}
      </div>
    </FleetModal>
  );
}

function DeliveryPersonsTab() {
  const { data, error, loading, reload } = useLoad(() => cdsApi.fleet(), []);
  const { busy, run } = useAction();
  const [adding, setAdding] = useState(false);
  const persons = data?.deliveryPersons ?? [];

  const toggle = async (p: DeliveryPerson, active: boolean) => {
    if (await run(() => cdsApi.setFleetActive('persons', p.id, active), `${p.name} ${active ? 'activated' : 'deactivated'}`)) reload();
  };
  const add = async (b: { name: string; phone: string }) => {
    if (await run(() => cdsApi.addPerson(b), `Delivery person ${b.name} added`)) {
      setAdding(false);
      reload();
    }
  };

  return (
    <div className="beats-page">
      <FleetSection
        title="Delivery Persons"
        desc="The delivery persons of your CDS store. Only active delivery persons can be assigned to delivery trips."
        addLabel="Add Delivery Person"
        onAdd={() => setAdding(true)}
        head={['Name', 'Phone', 'Active']}
        loading={loading && !data}
        error={data ? '' : error}
        onRetry={reload}
        empty={persons.length ? null : 'No delivery persons yet. Add a delivery person to get started.'}
      >
        {persons.map((p) => (
          <tr key={p.id}>
            <td className="beat-name-cell">{p.name}</td>
            <td>{p.phone || '—'}</td>
            <td>
              <ActiveSwitch label={`Active ${p.name}`} checked={p.active} disabled={busy} onChange={(x) => void toggle(p, x)} />
            </td>
          </tr>
        ))}
      </FleetSection>
      {adding && <AddPersonModal busy={busy} onSave={(b) => void add(b)} onClose={() => setAdding(false)} />}
    </div>
  );
}

function AddPersonModal({ busy, onSave, onClose }: { busy: boolean; onSave: (b: { name: string; phone: string }) => void; onClose: () => void }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const touch = (k: string) => setTouched((t) => ({ ...t, [k]: true }));

  const nameError = name.trim() ? '' : 'Enter the name';
  const phoneError = PHONE_RE.test(phone) ? '' : 'Enter a valid 10-digit phone number';
  const showName = !!nameError && !!touched.name;
  const showPhone = !!phoneError && (touched.phone || phone.length === 10);

  return (
    <FleetModal
      icon="fa-id-badge"
      title="Add Delivery Person"
      subtitle="Add a delivery person to your CDS store."
      saveLabel="Add Delivery Person"
      canSave={!busy && !nameError && !phoneError}
      onSave={() => onSave({ name: name.trim(), phone })}
      onClose={onClose}
    >
      <div className="form-group">
        <label htmlFor="cu-dp-name">
          Name <span className="required">*</span>
        </label>
        <input
          id="cu-dp-name"
          type="text"
          className={`form-input${showName ? ' invalid' : ''}`}
          placeholder="e.g. Ravi Kumar"
          maxLength={60}
          autoComplete="off"
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={() => touch('name')}
        />
        {showName && <div className="field-error">{nameError}</div>}
      </div>
      <div className="form-group">
        <label htmlFor="cu-dp-phone">
          Phone <span className="required">*</span>
        </label>
        <input
          id="cu-dp-phone"
          type="tel"
          inputMode="numeric"
          className={`form-input${showPhone ? ' invalid' : ''}`}
          placeholder="10-digit phone number"
          maxLength={10}
          autoComplete="off"
          value={phone}
          onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
          onBlur={() => touch('phone')}
        />
        {showPhone && <div className="field-error">{phoneError}</div>}
      </div>
    </FleetModal>
  );
}
