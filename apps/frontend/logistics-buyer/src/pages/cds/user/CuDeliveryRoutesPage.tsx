// CDS User — Delivery Planning list (/cds/delivery-planning). Replica of the LBNP Delivery Planning screen
// (src/pages/delivery-routes/DeliveryRoutesPage.tsx) on the CDS store's own confirmed routes: only the
// "Planned Deliveries" section (no Overflow Routes, 3PL quotations or Route Expiry). "Generate Trip" picks a free
// delivery person of the store and a time slot; the route's vehicle was reserved when the route was confirmed.
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router';
import DataLoading from '../../../components/DataLoading';
import { cdsApi, type RouteRow } from '../../../api/services/cds.service';
import { TRIP_STATUS } from '../../../cds/status';
import { addWeight } from '../../../utils/pipes';
import { fmtDate } from '../../delivery-routes/drFormat';
import { Badge, ErrorBox, SLOTS, toast, useAction, useLoad } from '../ui';
import '../../delivery-routes/DeliveryRoutesPage.css';
import './CuRoutePages.css';

/** "2026-11-16" → local midnight (avoids the UTC shift of new Date("2026-11-16")). */
const localDate = (ymd: string) => new Date(`${ymd}T00:00:00`);
const utilization = (loadKg: number, capacityKg: number) => (capacityKg > 0 ? Math.round((loadKg / capacityKg) * 100) : 0);

// ---------------------------------------------------------------- Generate Trip dialog (LBNP providers modal look)

/** Choose a free delivery person and a time slot; the route becomes a Retailer Delivery Trip. */
export function CuGenerateTripDialog({ route, onClose, onDone }: { route: RouteRow; onClose: () => void; onDone: () => void }) {
  const res = useLoad(() => cdsApi.resources(route.plannedDate), [route.plannedDate]);
  const persons = (res.data?.deliveryPersons ?? []).filter((p) => p.available);
  const [personId, setPersonId] = useState('');
  const [slot, setSlot] = useState(SLOTS[1]);
  const { busy, run } = useAction();
  const r = route.route;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const generate = async () => {
    if (!personId) return;
    const trip = await run(() => cdsApi.generateRouteTrip(route.id, { deliveryPersonId: personId, slot }));
    if (trip) {
      void toast(`Trip ${trip.tripNo} created`);
      onDone();
    }
  };

  return createPortal(
    <div className="delivery-routes-page">
      <div className="providers-overlay" onClick={onClose}>
        <div className="providers-modal" role="dialog" aria-modal="true" aria-label="Generate Trip" onClick={(e) => e.stopPropagation()}>
          <div className="providers-header">
            <div>
              <h2>Generate Trip</h2>
              <div className="route-id">Route: {route.planNo}</div>
            </div>
            <button className="close-btn" aria-label="Close" onClick={onClose}><i className="fas fa-times" /></button>
          </div>
          <div className="cu-trip-meta">
            <span><i className="fas fa-calendar-check me-1 text-primary" />Delivery Date <b>{fmtDate(localDate(route.plannedDate), 'dd MMM yyyy')}</b></span>
            <span><i className="fas fa-truck me-1 text-primary" />Vehicle <b>{r.vehicleRegNo}</b> ({r.vehicleType})</span>
            <span><i className="fas fa-map-marker-alt me-1 text-primary" /><b>{route.dropPoints}</b> drop points</span>
            <span><i className="fas fa-weight-hanging me-1 text-primary" /><b>{addWeight(r.loadKg)}</b> / {addWeight(r.capacityKg)}</span>
          </div>
          <div className="cu-trip-slot">
            <label htmlFor="cu-trip-slot">Time Slot</label>
            <select id="cu-trip-slot" className="form-select form-select-sm" value={slot} onChange={(e) => setSlot(e.target.value)}>
              {SLOTS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="providers-body">
            <div className="cu-trip-subhead">Available Delivery Persons</div>
            {res.error && <ErrorBox text={res.error} onRetry={res.reload} />}
            {res.loading && !res.data && (
              <div className="no-providers"><span className="spinner-border spinner-border-sm text-primary me-2" />Loading delivery persons...</div>
            )}
            {persons.map((p) => {
              const selected = p.id === personId;
              return (
                <div className="provider-item" key={p.id}>
                  <div className="provider-info">
                    <div className="provider-name">{p.name}</div>
                    <div className="detail-item"><i className="fas fa-phone" /> {p.phone}</div>
                  </div>
                  <div className="provider-actions">
                    {selected
                      ? <div className="selected-badge"><i className="fas fa-check-circle" /> Selected </div>
                      : <button className="select-provider-btn" onClick={() => setPersonId(p.id)}> Select </button>}
                  </div>
                </div>
              );
            })}
            {res.data && !persons.length && (
              <div className="no-providers">
                <i className="fas fa-exclamation-circle" />
                <p>No delivery person is free on {fmtDate(localDate(route.plannedDate), 'dd MMM yyyy')}.</p>
              </div>
            )}
          </div>
          <div className="providers-footer">
            <button className="btn-close-modal" onClick={onClose}>Close</button>
            <button className="btn-confirm" disabled={!personId || busy} onClick={() => void generate()}>
              {busy ? <><i className="fas fa-spinner fa-spin me-1" />Generating...</> : 'Generate Trip'}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

/** Trip status of a route: Generate Trip / Trip Created (trip no. + status) / Trip cancelled. */
export function CuRouteTripStatus({ row, onGenerate }: { row: RouteRow; onGenerate: () => void }) {
  const navigate = useNavigate();
  const t = row.trip;
  if (!t) {
    return (
      <button className="btn btn-sm btn-outline-success text-nowrap" onClick={onGenerate}>
        <i className="fas fa-play me-1" /> Generate Trip{' '}
      </button>
    );
  }
  if (t.status === 'CANCELLED') {
    return (
      <span className="cu-trip-cell">
        <span className="status-failed" title="The trip was cancelled; its orders are back in Ready for Delivery and can be planned again.">
          <i className="fas fa-times-circle me-1" />Trip cancelled
        </span>
        <a role="link" className="cu-trip-link" onClick={() => navigate(`/cds/trips/${t.id}`)}>{t.tripNo}</a>
      </span>
    );
  }
  return (
    <span className="cu-trip-cell">
      <span className="status-trip-created" role="link" title={`Delivery person: ${t.deliveryPersonName}`} onClick={() => navigate(`/cds/trips/${t.id}`)}>
        <i className="fas fa-check-circle me-1" />Trip Created · {t.tripNo}
      </span>
      <Badge meta={TRIP_STATUS[t.status]} />
    </span>
  );
}

// ---------------------------------------------------------------- page

const DISPLAYED_COLUMNS = 7;

function HeaderCell({ icon, label, align = 'left' }: { icon: string; label: string; align?: 'left' | 'center' | 'right' }) {
  return (
    <th className={`mat-mdc-header-cell text-uppercase py-2 small ${align === 'center' ? 'px-2 text-center' : 'px-3'} ${align === 'right' ? 'text-end' : ''}`}>
      <i className={`fas ${icon} me-1 text-primary`} /> {label}{' '}
    </th>
  );
}

function HeaderRow() {
  return (
    <tr className="mat-mdc-header-row">
      <HeaderCell icon="fa-calendar" label="Created Date" />
      <HeaderCell icon="fa-hashtag" label="Route ID" />
      <HeaderCell icon="fa-map-marker-alt" label="Drop Points" align="center" />
      <HeaderCell icon="fa-calendar-check" label="DELIVERY DATE" align="center" />
      <HeaderCell icon="fa-weight-hanging" label="Weight / Capacity" align="right" />
      <HeaderCell icon="fa-truck" label="Vehicle" />
      <HeaderCell icon="fa-info-circle" label="Status" align="center" />
    </tr>
  );
}

export function CuDeliveryRoutesPage() {
  const navigate = useNavigate();
  const { data, error, loading, reload } = useLoad(() => cdsApi.deliveryRoutes(), []);
  const [tripFor, setTripFor] = useState<RouteRow | null>(null);
  const rows = data ?? [];

  return (
    <div className="delivery-routes-page container-fluid p-3 bg-light h-100">
      <div className="row px-3">
        <div className="col-md-6">
          <div className="d-flex align-items-center">
            <i className="fas fa-shopping-bag text-primary me-2 fs-5" />
            <h1 className="fs-3 mb-0 fw-bold">Delivery Planning</h1>
          </div>
          <p className="text-muted small">Manage and track your delivery routes</p>
        </div>
        <div className="col-md-6 d-flex justify-content-md-end justify-content-start align-items-end gap-2 pt-3">
          <button className="btn btn-sm btn-primary d-flex align-items-center text-nowrap" onClick={() => navigate('/cds/delivery-planning/create')}>
            <i className="fas fa-upload me-1 fs-6" />
            <span className="fs-6">Create Delivery Route</span>
          </button>
        </div>
      </div>

      <div className="p-3">
        {error && <ErrorBox text={error} onRetry={reload} />}
        {loading && !data && <DataLoading message="Loading delivery routes..." showTip />}

        {data && rows.length === 0 && (
          <div className="mat-card mat-elevation-z3 mb-4">
            <div className="mat-card-content p-0">
              <table className="mat-mdc-table w-100">
                <thead><HeaderRow /></thead>
                <tbody>
                  <tr>
                    <td className="text-center py-4" colSpan={DISPLAYED_COLUMNS}>
                      <i className="fas fa-inbox mb-3 text-muted" style={{ fontSize: '2rem' }} />
                      <p className="mb-0">No delivery plannings found</p>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {rows.length > 0 && (
          <div className="mat-card mat-elevation-z3 mb-4 self-fleet-card">
            <div className="section-header self-fleet-header">
              <div className="section-left">
                <div className="section-icon"><i className="fas fa-truck" /></div>
                <div>
                  <h2>Planned Deliveries</h2>
                  <p>Trips for vehicles assigned during route planning</p>
                </div>
              </div>
              <div className="section-right">
                <span className="count-pill">{rows.length}</span>
                <span className="count-label">routes</span>
              </div>
            </div>
            <div className="mat-card-content p-0 table-responsive">
              <table className="mat-mdc-table w-100">
                <thead><HeaderRow /></thead>
                <tbody>
                  {rows.map((row) => {
                    const r = row.route;
                    return (
                      <tr key={row.id} className="mat-mdc-row">
                        <td className="mat-mdc-cell py-2 px-3 small">{fmtDate(row.createdAt, 'medium')}</td>
                        <td className="mat-mdc-cell py-2 px-3 small">{row.planNo}</td>
                        <td className="mat-mdc-cell py-2 px-2 small text-center">{row.dropPoints} points</td>
                        <td className="mat-mdc-cell py-2 px-2 small text-center">{fmtDate(localDate(row.plannedDate), 'dd MMM yyyy')}</td>
                        <td className="mat-mdc-cell py-2 px-3 small text-end">
                          {addWeight(r.loadKg)} / {addWeight(r.capacityKg)}
                          <div className="cu-sub">{utilization(r.loadKg, r.capacityKg)}% utilized</div>
                        </td>
                        <td className="mat-mdc-cell py-2 px-3 small">
                          {r.vehicleRegNo}
                          <div className="cu-sub">{r.vehicleType}</div>
                        </td>
                        <td className="mat-mdc-cell py-2 px-2 small text-center">
                          <div className="d-flex align-items-center justify-content-center gap-2">
                            <button className="btn btn-sm text-primary" title="View" aria-label={`View ${row.planNo}`} onClick={() => navigate(`/cds/delivery-planning/${row.id}`)}>
                              <i className="fas fa-eye" />
                            </button>
                            <CuRouteTripStatus row={row} onGenerate={() => setTripFor(row)} />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {tripFor && (
        <CuGenerateTripDialog
          route={tripFor}
          onClose={() => setTripFor(null)}
          onDone={() => {
            setTripFor(null);
            reload();
          }}
        />
      )}
    </div>
  );
}
