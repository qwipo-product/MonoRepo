// Service Centre → Settings: profile, timings (order cut-off, pickup rounds, returns window) and the vehicle fleet.
import { useState } from 'react';
import Swal from 'sweetalert2';
import DataLoading from '../../components/DataLoading';
import { crossDockService, errorMessage, type NewVehicle, type XdVehicleRow } from '../../api/services/crossDock.service';
import type { XdSettings } from '../../types/crossDock';
import { hm, VEHICLE_TYPE } from './labels';
import { LoadError, PageHeader, StatusPill } from './ScUi';
import { useLoad } from './useLoad';

const EMPTY_VEHICLE: NewVehicle = { regNo: '', type: 'THREE_WHEELER', model: '', capacityKg: 500, driverName: '', driverPhone: '' };

export default function ScSettingsPage() {
  const { data, loading, error, reload } = useLoad(() => Promise.all([crossDockService.overview(), crossDockService.vehicles()]));
  /** Edits in progress; null = showing the saved settings. */
  const [draft, setForm] = useState<XdSettings | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [vehicle, setVehicle] = useState<NewVehicle>(EMPTY_VEHICLE);
  const [vehicleError, setVehicleError] = useState<string | null>(null);
  const [busyVehicle, setBusyVehicle] = useState<string | null>(null);

  const [overview, vehicles] = data ?? [null, [] as XdVehicleRow[]];

  if (loading && !data) return <DataLoading message="Loading settings..." />;
  if (error && !data) return <div className="sc-page"><LoadError message={error} onRetry={reload} /></div>;
  if (!overview) return null;

  const form = draft ?? overview.settings;
  const dirty = !!draft && JSON.stringify(draft) !== JSON.stringify(overview.settings);
  const setProfile = (k: keyof XdSettings['serviceCentre'], v: string) => setForm({ ...form, serviceCentre: { ...form.serviceCentre, [k]: v } });
  const setWindow = (i: number, k: 'start' | 'end', v: string) => setForm({ ...form, windows: form.windows.map((w, j) => (j === i ? { ...w, [k]: v } : w)) });

  const save = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      await crossDockService.saveSettings(form);
      await reload();
      setForm(null);
      Swal.fire({ icon: 'success', title: 'Settings saved', showConfirmButton: false, timer: 1400 });
    } catch (e) {
      setSaveError(errorMessage(e, 'Could not save the settings.'));
    } finally {
      setSaving(false);
    }
  };

  const addVehicle = async () => {
    setBusyVehicle('new');
    setVehicleError(null);
    try {
      await crossDockService.addVehicle(vehicle);
      setVehicle(EMPTY_VEHICLE);
      setAdding(false);
      await reload();
    } catch (e) {
      setVehicleError(errorMessage(e, 'Could not add the vehicle.'));
    } finally {
      setBusyVehicle(null);
    }
  };

  const toggleActive = async (v: XdVehicleRow) => {
    setBusyVehicle(v.id);
    try {
      await crossDockService.setVehicleActive(v.id, !v.active);
      await reload();
    } catch (e) {
      Swal.fire({ icon: 'error', title: 'Could not update the vehicle', text: errorMessage(e), confirmButtonText: 'OK' });
    } finally {
      setBusyVehicle(null);
    }
  };

  return (
    <div className="sc-page">
      <PageHeader refreshError={error} icon="fa-cog" title="Settings" subtitle="Service Centre profile, timings and vehicles." />

      <div className="row g-3">
        <div className="col-xl-6 d-flex flex-column gap-3">
          <section className="sc-card" aria-labelledby="sc-profile">
            <div className="sc-card-head">
              <h2 className="sc-card-title" id="sc-profile">Profile</h2>
            </div>
            <div className="sc-card-body row g-3">
              <div className="col-12">
                <label className="form-label small" htmlFor="sc-name">Service Centre name</label>
                <input id="sc-name" className="form-control form-control-sm" value={form.serviceCentre.name} onChange={(e) => setProfile('name', e.target.value)} />
              </div>
              <div className="col-sm-6">
                <label className="form-label small" htmlFor="sc-contact">Contact person</label>
                <input id="sc-contact" className="form-control form-control-sm" value={form.serviceCentre.contactName} onChange={(e) => setProfile('contactName', e.target.value)} />
              </div>
              <div className="col-sm-6">
                <label className="form-label small" htmlFor="sc-phone">Mobile number</label>
                <input id="sc-phone" className="form-control form-control-sm" inputMode="numeric" maxLength={10} value={form.serviceCentre.phone} onChange={(e) => setProfile('phone', e.target.value.replace(/\D/g, ''))} />
              </div>
              <div className="col-sm-6">
                <label className="form-label small" htmlFor="sc-email">Email</label>
                <input id="sc-email" type="email" className="form-control form-control-sm" value={form.serviceCentre.email} onChange={(e) => setProfile('email', e.target.value)} />
              </div>
              <div className="col-sm-6">
                <label className="form-label small" htmlFor="sc-city">City</label>
                <input id="sc-city" className="form-control form-control-sm" value={form.serviceCentre.city} onChange={(e) => setProfile('city', e.target.value)} />
              </div>
              <div className="col-12">
                <label className="form-label small" htmlFor="sc-address">Yard address</label>
                <input id="sc-address" className="form-control form-control-sm" value={form.serviceCentre.address} onChange={(e) => setProfile('address', e.target.value)} />
                <div className="form-text">Where vehicles start and end their trips. The Service Centre needs no warehouse.</div>
              </div>
            </div>
          </section>

          <section className="sc-card" aria-labelledby="sc-timings">
            <div className="sc-card-head">
              <h2 className="sc-card-title" id="sc-timings">Timings</h2>
            </div>
            <div className="sc-card-body">
              <div className="row g-2 align-items-center mb-3">
                <label className="col-sm-5 col-form-label col-form-label-sm" htmlFor="sc-cutoff">Retailers order until</label>
                <div className="col-sm-3">
                  <input id="sc-cutoff" type="time" className="form-control form-control-sm" value={form.orderCutoff} onChange={(e) => setForm({ ...form, orderCutoff: e.target.value })} />
                </div>
                <div className="col-sm-4 small text-muted">Delivery next day</div>
              </div>
              <table className="sc-table">
                <thead>
                  <tr>
                    <th>Window</th>
                    <th>From</th>
                    <th>To</th>
                  </tr>
                </thead>
                <tbody>
                  {form.windows.map((w, i) => (
                    <tr key={w.key}>
                      <td>
                        {w.label}
                        <div className="muted">{w.key === 'RETURNS' ? 'Collect returns from the stores' : w.key === 'EARLY_AM' ? 'Delivery day, lands by noon' : 'Pickups after the order cut-off'}</div>
                      </td>
                      <td><input type="time" className="form-control form-control-sm" value={w.start} onChange={(e) => setWindow(i, 'start', e.target.value)} aria-label={`${w.label} from`} /></td>
                      <td><input type="time" className="form-control form-control-sm" value={w.end} onChange={(e) => setWindow(i, 'end', e.target.value)} aria-label={`${w.label} to`} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {saveError && <div className="alert alert-danger py-2 small mb-0" role="alert">{saveError}</div>}
          <div className="d-flex gap-2 justify-content-end">
            <button type="button" className="btn btn-sm btn-outline-secondary" disabled={!dirty || saving} onClick={() => { setForm(null); setSaveError(null); }}>
              Discard changes
            </button>
            <button type="button" className="btn btn-sm btn-primary" disabled={!dirty || saving} onClick={save}>
              {saving ? <i className="fas fa-spinner fa-spin me-1" /> : <i className="fas fa-check me-1" />}
              Save settings
            </button>
          </div>
        </div>

        <div className="col-xl-6">
          <section className="sc-card" aria-labelledby="sc-fleet">
            <div className="sc-card-head">
              <h2 className="sc-card-title" id="sc-fleet">Vehicles and drivers</h2>
              {!adding && (
                <button type="button" className="btn btn-sm btn-outline-primary" onClick={() => setAdding(true)}>
                  <i className="fas fa-plus me-1" />
                  Add vehicle
                </button>
              )}
            </div>
            {adding && (
              <div className="sc-card-body border-bottom">
                <div className="row g-2">
                  <div className="col-sm-6">
                    <label className="form-label small" htmlFor="v-reg">Registration number</label>
                    <input id="v-reg" className="form-control form-control-sm" placeholder="TS 09 UC 4521" value={vehicle.regNo} onChange={(e) => setVehicle({ ...vehicle, regNo: e.target.value.toUpperCase() })} />
                  </div>
                  <div className="col-sm-6">
                    <label className="form-label small" htmlFor="v-type">Type</label>
                    <select id="v-type" className="form-select form-select-sm" value={vehicle.type} onChange={(e) => setVehicle({ ...vehicle, type: e.target.value as NewVehicle['type'], capacityKg: e.target.value === 'FOUR_WHEELER' ? 750 : 500 })}>
                      <option value="THREE_WHEELER">Three-wheeler cargo</option>
                      <option value="FOUR_WHEELER">Four-wheeler mini truck</option>
                    </select>
                  </div>
                  <div className="col-sm-6">
                    <label className="form-label small" htmlFor="v-model">Model</label>
                    <input id="v-model" className="form-control form-control-sm" placeholder="Piaggio Ape Xtra LDX" value={vehicle.model} onChange={(e) => setVehicle({ ...vehicle, model: e.target.value })} />
                  </div>
                  <div className="col-sm-6">
                    <label className="form-label small" htmlFor="v-cap">Capacity (kg)</label>
                    <input id="v-cap" type="number" min={1} max={5000} className="form-control form-control-sm" value={vehicle.capacityKg} onChange={(e) => setVehicle({ ...vehicle, capacityKg: Number(e.target.value) })} />
                  </div>
                  <div className="col-sm-6">
                    <label className="form-label small" htmlFor="v-driver">Driver name</label>
                    <input id="v-driver" className="form-control form-control-sm" value={vehicle.driverName} onChange={(e) => setVehicle({ ...vehicle, driverName: e.target.value })} />
                  </div>
                  <div className="col-sm-6">
                    <label className="form-label small" htmlFor="v-phone">Driver mobile</label>
                    <input id="v-phone" className="form-control form-control-sm" inputMode="numeric" maxLength={10} value={vehicle.driverPhone} onChange={(e) => setVehicle({ ...vehicle, driverPhone: e.target.value.replace(/\D/g, '') })} />
                  </div>
                </div>
                {vehicleError && <div className="alert alert-danger py-2 small mt-2 mb-0" role="alert">{vehicleError}</div>}
                <div className="d-flex gap-2 justify-content-end mt-2">
                  <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => { setAdding(false); setVehicle(EMPTY_VEHICLE); setVehicleError(null); }}>
                    Cancel
                  </button>
                  <button type="button" className="btn btn-sm btn-primary" disabled={busyVehicle === 'new'} onClick={addVehicle}>
                    {busyVehicle === 'new' ? <i className="fas fa-spinner fa-spin me-1" /> : <i className="fas fa-plus me-1" />}
                    Add vehicle
                  </button>
                </div>
              </div>
            )}
            <div className="table-responsive">
              <table className="sc-table">
                <thead>
                  <tr>
                    <th>Vehicle</th>
                    <th>Driver</th>
                    <th className="num">Capacity</th>
                    <th>Status</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {vehicles.map((v) => (
                    <tr key={v.id}>
                      <td className="nowrap">
                        <span className="fw-semibold">{v.regNo}</span>
                        <div className="muted">{VEHICLE_TYPE[v.type]} · {v.model}</div>
                      </td>
                      <td>
                        {v.driverName}
                        <div className="muted">{v.driverPhone}</div>
                      </td>
                      <td className="num">{v.capacityKg} kg</td>
                      <td>{v.active ? <StatusPill label="Active" tone="green" /> : <StatusPill label="Off the road" tone="grey" />}</td>
                      <td className="text-end">
                        <button type="button" className="btn btn-sm btn-link p-0 text-nowrap" disabled={busyVehicle === v.id} onClick={() => toggleActive(v)}>
                          {v.active ? 'Take off the road' : 'Put back on the road'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="sc-card-body small text-muted">
              Pickup rounds today: {form.windows.filter((w) => w.key === 'R1' || w.key === 'R2').map((w) => `${w.label} ${hm(w.start)}–${hm(w.end)}`).join(' · ')}. A vehicle can run one trip per round.
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
