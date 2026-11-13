// Cross Dock Store → Settings: store profile, delivery area (read-only), and the store's riders.
import { useState } from 'react';
import Swal from 'sweetalert2';
import DataLoading from '../../components/DataLoading';
import { errorMessage, type XdRiderRow } from '../../api/services/crossDock.service';
import { polygonAreaKm2 } from '../../utils/geo';
import { LoadError, PageHeader, StatusPill } from '../service-centre/ScUi';
import { useLoad } from '../service-centre/useLoad';
import StoreMap from './StoreMap';
import { useStoreApi } from './useStoreApi';

const EMPTY_RIDER = { name: '', phone: '', vehicleRegNo: '' };

export default function StoreSettingsPage() {
  const api = useStoreApi();
  const { data, loading, error, reload } = useLoad(() => Promise.all([api.overview(), api.riders()]), [api]);
  const [draft, setDraft] = useState<{ operatorName: string; phone: string; address: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [rider, setRider] = useState(EMPTY_RIDER);
  const [riderError, setRiderError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  if (loading && !data) return <DataLoading message="Loading settings..." />;
  if (error && !data) return <div className="sc-page"><LoadError message={error} onRetry={reload} /></div>;
  if (!data) return null;
  const [overview, riders] = data;
  const store = overview.store;
  const form = draft ?? { operatorName: store.operatorName, phone: store.phone, address: store.address };
  const dirty = !!draft && (draft.operatorName !== store.operatorName || draft.phone !== store.phone || draft.address !== store.address);

  const save = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      await api.saveProfile(form);
      await reload();
      setDraft(null);
      Swal.fire({ icon: 'success', title: 'Profile saved', showConfirmButton: false, timer: 1400 });
    } catch (e) {
      setSaveError(errorMessage(e, 'Could not save the profile.'));
    } finally {
      setSaving(false);
    }
  };
  const addRider = async () => {
    setBusy('new');
    setRiderError(null);
    try {
      await api.addRider(rider);
      setRider(EMPTY_RIDER);
      setAdding(false);
      await reload();
    } catch (e) {
      setRiderError(errorMessage(e, 'Could not add the rider.'));
    } finally {
      setBusy(null);
    }
  };
  const toggle = async (x: XdRiderRow) => {
    setBusy(x.id);
    try {
      await api.setRiderActive(x.id, !x.active);
      await reload();
    } catch (e) {
      Swal.fire({ icon: 'error', title: 'Could not update the rider', text: errorMessage(e), confirmButtonText: 'OK' });
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="sc-page">
      <PageHeader refreshError={error} icon="fa-cog" title="Settings" subtitle="Store profile, delivery area and riders." />

      <div className="row g-3">
        <div className="col-xl-6 d-flex flex-column gap-3">
          <section className="sc-card" aria-labelledby="st-profile">
            <div className="sc-card-head">
              <h2 className="sc-card-title" id="st-profile">Store profile</h2>
              <StatusPill label={store.status === 'LIVE' ? 'Live' : 'Onboarding'} tone={store.status === 'LIVE' ? 'green' : 'amber'} />
            </div>
            <div className="sc-card-body row g-3">
              <div className="col-sm-8">
                <label className="form-label small" htmlFor="st-name">Store</label>
                <input id="st-name" className="form-control form-control-sm" value={store.name} readOnly disabled />
              </div>
              <div className="col-sm-4">
                <label className="form-label small" htmlFor="st-code">Code</label>
                <input id="st-code" className="form-control form-control-sm" value={store.code} readOnly disabled />
              </div>
              <div className="col-sm-6">
                <label className="form-label small" htmlFor="st-op">Operator</label>
                <input id="st-op" className="form-control form-control-sm" value={form.operatorName} onChange={(e) => setDraft({ ...form, operatorName: e.target.value })} />
              </div>
              <div className="col-sm-6">
                <label className="form-label small" htmlFor="st-phone">Mobile number</label>
                <input id="st-phone" className="form-control form-control-sm" inputMode="numeric" maxLength={10} value={form.phone} onChange={(e) => setDraft({ ...form, phone: e.target.value.replace(/\D/g, '') })} />
              </div>
              <div className="col-12">
                <label className="form-label small" htmlFor="st-addr">Address</label>
                <input id="st-addr" className="form-control form-control-sm" value={form.address} onChange={(e) => setDraft({ ...form, address: e.target.value })} />
                <div className="form-text">The store holds no stock: goods come in, are sorted per retailer and go out the same day.</div>
              </div>
              {saveError && <div className="col-12"><div className="alert alert-danger py-2 small mb-0" role="alert">{saveError}</div></div>}
              <div className="col-12 d-flex justify-content-end gap-2">
                <button type="button" className="btn btn-sm btn-outline-secondary" disabled={!dirty || saving} onClick={() => { setDraft(null); setSaveError(null); }}>Discard changes</button>
                <button type="button" className="btn btn-sm btn-primary" disabled={!dirty || saving} onClick={save}>
                  {saving ? <i className="fas fa-spinner fa-spin me-1" /> : <i className="fas fa-check me-1" />}
                  Save profile
                </button>
              </div>
            </div>
          </section>

          <section className="sc-card" aria-labelledby="st-riders">
            <div className="sc-card-head">
              <h2 className="sc-card-title" id="st-riders">Riders</h2>
              {!adding && (
                <button type="button" className="btn btn-sm btn-outline-primary" onClick={() => setAdding(true)}>
                  <i className="fas fa-plus me-1" />
                  Add rider
                </button>
              )}
            </div>
            {adding && (
              <div className="sc-card-body border-bottom">
                <div className="row g-2">
                  <div className="col-sm-4">
                    <label className="form-label small" htmlFor="r-name">Name</label>
                    <input id="r-name" className="form-control form-control-sm" value={rider.name} onChange={(e) => setRider({ ...rider, name: e.target.value })} />
                  </div>
                  <div className="col-sm-4">
                    <label className="form-label small" htmlFor="r-phone">Mobile</label>
                    <input id="r-phone" className="form-control form-control-sm" inputMode="numeric" maxLength={10} value={rider.phone} onChange={(e) => setRider({ ...rider, phone: e.target.value.replace(/\D/g, '') })} />
                  </div>
                  <div className="col-sm-4">
                    <label className="form-label small" htmlFor="r-reg">Two-wheeler number</label>
                    <input id="r-reg" className="form-control form-control-sm" placeholder="TS 08 EK 4410" value={rider.vehicleRegNo} onChange={(e) => setRider({ ...rider, vehicleRegNo: e.target.value.toUpperCase() })} />
                  </div>
                </div>
                {riderError && <div className="alert alert-danger py-2 small mt-2 mb-0" role="alert">{riderError}</div>}
                <div className="d-flex gap-2 justify-content-end mt-2">
                  <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => { setAdding(false); setRider(EMPTY_RIDER); setRiderError(null); }}>Cancel</button>
                  <button type="button" className="btn btn-sm btn-primary" disabled={busy === 'new'} onClick={addRider}>
                    {busy === 'new' ? <i className="fas fa-spinner fa-spin me-1" /> : <i className="fas fa-plus me-1" />}
                    Add rider
                  </button>
                </div>
              </div>
            )}
            <div className="table-responsive">
              <table className="sc-table">
                <thead>
                  <tr>
                    <th>Rider</th>
                    <th>Two-wheeler</th>
                    <th>Status</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {riders.map((x) => (
                    <tr key={x.id}>
                      <td>
                        <span className="fw-semibold">{x.name}</span>
                        <div className="muted">{x.phone}</div>
                      </td>
                      <td className="nowrap">{x.vehicleRegNo}</td>
                      <td>
                        {!x.active ? <StatusPill label="Off duty" tone="grey" /> : x.busyRunNo ? <StatusPill label={`On run ${x.busyRunNo}`} tone="indigo" /> : <StatusPill label="Available" tone="green" />}
                      </td>
                      <td className="text-end">
                        <button type="button" className="btn btn-sm btn-link p-0 text-nowrap" disabled={busy === x.id} onClick={() => toggle(x)}>
                          {x.active ? 'Mark off duty' : 'Back on duty'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        <div className="col-xl-6">
          <section className="sc-card" aria-labelledby="st-area">
            <div className="sc-card-head">
              <h2 className="sc-card-title" id="st-area">Delivery area</h2>
              <span className="text-muted small">
                {polygonAreaKm2(store.polygon).toFixed(1)} km² · about {store.radiusKm} km around the store · {overview.retailers.length} retailers
              </span>
            </div>
            <div className="sc-card-body">
              <StoreMap store={store} retailers={overview.retailers} height={420} />
              <p className="small text-muted mt-2 mb-0">
                Retailers inside this area get cross-dock delivery through this store. Qwipo sets the area; ask the Service Centre or your Qwipo contact to change it.
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
