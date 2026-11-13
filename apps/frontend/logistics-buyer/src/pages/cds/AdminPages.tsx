// Reports (both roles), Settings (Service Centre: OTP rules + fleet), Reports & Settings (CDS User: reports + own fleet
// and store), CDS Stores (Service Centre).
import { useState } from 'react';
import Swal from 'sweetalert2';
import { cdsApi } from '../../api/services/cds.service';
import { COLLECTION_STATUS, GRN_STATUS, ORDER_STATUS, RETURN_STATUS, TRIP_STATUS } from '../../cds/status';
import { Card, confirm, downloadCsv, Empty, ErrorBox, KpiStrip, Loading, PageHead, refreshMeta, Table, Tabs, useAction, useCdsSession, useLoad, useMeta } from './ui';

const STATUS_OPTIONS: Record<string, Record<string, { label: string }>> = {
  'trips-': TRIP_STATUS, grn: GRN_STATUS, 'delivery-status': ORDER_STATUS, returns: RETURN_STATUS, collections: COLLECTION_STATUS,
};

function Reports() {
  const meta = useMeta();
  const { sc } = useCdsSession();
  const list = meta.data?.reports ?? [];
  const [id, setId] = useState('');
  const [f, setF] = useState<Record<string, string>>({});
  const current = list.find((r) => r.id === (id || list[0]?.id));
  const rid = current?.id ?? '';
  const { data, error, loading, reload } = useLoad(() => (rid ? cdsApi.report(rid, f) : Promise.resolve(null)), [rid, f]);
  const statuses = STATUS_OPTIONS[Object.keys(STATUS_OPTIONS).find((k) => rid.startsWith(k)) ?? ''] ?? {};
  const retailers = useLoad(() => (!sc ? cdsApi.retailers() : Promise.resolve([])), [sc]);
  const set = (p: Record<string, string>) => setF((x) => ({ ...x, ...p }));
  return (
    <>
      <KpiStrip />
      <div className="d-flex flex-wrap gap-2 mb-3">
        {list.map((r) => <button key={r.id} className={`btn btn-sm ${r.id === rid ? 'btn-primary' : 'btn-outline-secondary'}`} onClick={() => { setId(r.id); setF({}); }}>{r.title}</button>)}
      </div>
      {current && (
        <div className="cds-filters">
          {current.filters.includes('from') && <input type="date" aria-label="From date" className="form-control form-control-sm" value={f.from ?? ''} onChange={(e) => set({ from: e.target.value })} />}
          {current.filters.includes('to') && <input type="date" aria-label="To date" className="form-control form-control-sm" value={f.to ?? ''} onChange={(e) => set({ to: e.target.value })} />}
          {current.filters.includes('cdsStoreId') && sc && (
            <select aria-label="CDS store" className="form-select form-select-sm" value={f.cdsStoreId ?? ''} onChange={(e) => set({ cdsStoreId: e.target.value })}>
              <option value="">All CDS stores</option>{meta.data?.stores.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
            </select>
          )}
          {current.filters.includes('distributorId') && (
            <select aria-label="Distributor" className="form-select form-select-sm" value={f.distributorId ?? ''} onChange={(e) => set({ distributorId: e.target.value })}>
              <option value="">All distributors</option>{meta.data?.distributors.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
            </select>
          )}
          {current.filters.includes('retailerId') && !sc && (
            <select aria-label="Retailer" className="form-select form-select-sm" value={f.retailerId ?? ''} onChange={(e) => set({ retailerId: e.target.value })}>
              <option value="">All retailers</option>{retailers.data?.filter((r) => r.orders).map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
            </select>
          )}
          {current.filters.includes('status') && (
            <select aria-label="Status" className="form-select form-select-sm" value={f.status ?? ''} onChange={(e) => set({ status: e.target.value })}>
              <option value="">All statuses</option>{Object.entries(statuses).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          )}
          <button className="btn btn-sm btn-outline-secondary ms-auto" disabled={!data?.rows.length} onClick={() => data && downloadCsv(data.id, data.columns, data.rows)}><i className="fas fa-file-csv me-1" />Export CSV</button>
        </div>
      )}
      <Card title={data?.title} extra={data && <small>{data.rows.length} row(s)</small>}>
        {error && <ErrorBox text={error} onRetry={reload} />}
        {loading && !data ? <Loading /> : data && (
          <Table head={data.columns.map((c) => c.label)} empty={!data.rows.length && <Empty text="No data for these filters" />}>
            {data.rows.map((r, i) => <tr key={i} className="mat-mdc-row">{data.columns.map((c) => <td key={c.key} className={`small${c.align === 'end' ? ' text-end' : ''}`}>{r[c.key]}</td>)}</tr>)}
            {data.totals && <tr className="mat-mdc-row cds-retailer-row">{data.columns.map((c, i) => <td key={c.key} className={c.align === 'end' ? 'text-end' : ''}>{i === 0 ? 'Total' : data.totals?.[c.key] ?? ''}</td>)}</tr>}
          </Table>
        )}
      </Card>
    </>
  );
}

export function ReportsPage() {
  const { sc } = useCdsSession();
  const [tab, setTab] = useState<'reports' | 'settings'>('reports');
  if (sc) return <div className="cds-page"><PageHead icon="fa-chart-bar" title="Reports" subtitle="Operational reports across your CDS stores, from live records." /><Reports /></div>;
  return (
    <div className="cds-page">
      <PageHead icon="fa-chart-bar" title="Reports & Settings" subtitle="Your CDS store's operational reports, and its delivery persons and vehicles." />
      <Tabs value={tab} onChange={setTab} tabs={[{ id: 'reports', label: 'Reports', icon: 'fa-chart-bar' }, { id: 'settings', label: 'Settings', icon: 'fa-cog' }]} />
      {tab === 'reports' ? <Reports /> : <><StoreProfile /><Fleet /></>}
    </div>
  );
}

function StoreProfile() {
  const { user, store } = useCdsSession();
  const meta = useMeta();
  const st = meta.data?.stores.find((x) => x.id === store);
  return (
    <Card title={<><i className="fas fa-store text-primary me-2" />Store & profile</>}>
      <dl className="cds-dl">
        <dt>CDS store</dt><dd>{st?.name} ({st?.code})</dd>
        <dt>Address</dt><dd>{st?.address}</dd>
        <dt>Serves</dt><dd>{st?.localities.join(', ')}</dd>
        <dt>Signed in as</dt><dd>{user?.name} · +91 {user?.mobile}</dd>
        <dt>OTP rules</dt><dd>Valid {meta.data?.settings.otpExpiryMinutes} min · {meta.data?.settings.otpMaxAttempts} attempts (set by the Service Centre)</dd>
      </dl>
    </Card>
  );
}

function Fleet() {
  const { busy, run } = useAction();
  const { data, error, loading, reload } = useLoad(() => cdsApi.fleet(), []);
  const toggle = async (kind: 'vehicles' | 'persons', id: string, active: boolean) => { if (await run(() => cdsApi.setFleetActive(kind, id, active), active ? 'Activated' : 'Deactivated')) reload(); };
  const addVehicle = async () => {
    const r = await Swal.fire({
      title: 'Add vehicle', html: `<input id="v-reg" class="swal2-input" placeholder="Registration no. (TS08AB1234)"><select id="v-type" class="swal2-input"><option>Three Wheeler</option><option>Pickup</option><option>Mini Truck</option><option>Truck</option></select><input id="v-cap" type="number" class="swal2-input" placeholder="Capacity (kg)">`,
      showCancelButton: true, confirmButtonText: 'Add', confirmButtonColor: '#1e3a8a', reverseButtons: true,
      preConfirm: () => ({ regNo: (document.getElementById('v-reg') as HTMLInputElement).value, type: (document.getElementById('v-type') as HTMLSelectElement).value, capacityKg: Number((document.getElementById('v-cap') as HTMLInputElement).value) }),
    });
    if (r.isConfirmed && (await run(() => cdsApi.addVehicle(r.value), 'Vehicle added'))) reload();
  };
  const addPerson = async () => {
    const r = await Swal.fire({
      title: 'Add delivery person', html: '<input id="p-name" class="swal2-input" placeholder="Name"><input id="p-phone" class="swal2-input" placeholder="Mobile (10 digits)">',
      showCancelButton: true, confirmButtonText: 'Add', confirmButtonColor: '#1e3a8a', reverseButtons: true,
      preConfirm: () => ({ name: (document.getElementById('p-name') as HTMLInputElement).value, phone: (document.getElementById('p-phone') as HTMLInputElement).value }),
    });
    if (r.isConfirmed && (await run(() => cdsApi.addPerson(r.value), 'Delivery person added'))) reload();
  };
  if (error) return <ErrorBox text={error} onRetry={reload} />;
  if (loading && !data) return <Loading />;
  return (
    <div className="row g-3">
      <div className="col-lg-6">
        <Card title={<><i className="fas fa-truck text-primary me-2" />Vehicles</>} extra={<button className="btn btn-sm btn-outline-primary" onClick={() => void addVehicle()}><i className="fas fa-plus me-1" />Add</button>}>
          <Table head={['Registration', 'Type', 'Capacity', 'Active']}>
            {data?.vehicles.map((v) => <tr key={v.id} className="mat-mdc-row"><td className="fw-semibold">{v.regNo}</td><td className="small">{v.type}</td><td className="small">{v.capacityKg} kg</td>
              <td><div className="form-check form-switch m-0"><input className="form-check-input" type="checkbox" aria-label={`Active ${v.regNo}`} disabled={busy} checked={v.active} onChange={(e) => void toggle('vehicles', v.id, e.target.checked)} /></div></td></tr>)}
          </Table>
        </Card>
      </div>
      <div className="col-lg-6">
        <Card title={<><i className="fas fa-id-badge text-primary me-2" />Delivery persons</>} extra={<button className="btn btn-sm btn-outline-primary" onClick={() => void addPerson()}><i className="fas fa-plus me-1" />Add</button>}>
          <Table head={['Name', 'Mobile', 'Active']}>
            {data?.deliveryPersons.map((p) => <tr key={p.id} className="mat-mdc-row"><td className="fw-semibold">{p.name}</td><td className="small">{p.phone}</td>
              <td><div className="form-check form-switch m-0"><input className="form-check-input" type="checkbox" aria-label={`Active ${p.name}`} disabled={busy} checked={p.active} onChange={(e) => void toggle('persons', p.id, e.target.checked)} /></div></td></tr>)}
          </Table>
        </Card>
      </div>
    </div>
  );
}

export function SettingsPage() {
  const meta = useMeta();
  const { busy, run } = useAction();
  const s = meta.data?.settings;
  const [x, setX] = useState<{ otpExpiryMinutes?: number; otpMaxAttempts?: number; nextDayPlanning?: boolean }>({});
  const v = { ...s, ...x };
  const save = async () => {
    if (await run(() => cdsApi.updateSettings(x), 'Settings saved')) {
      refreshMeta();
      setX({});
      meta.reload();
    }
  };
  return (
    <div className="cds-page">
      <PageHead icon="fa-cog" title="Settings" subtitle="OTP rules for every pickup / handover, planning rules, and the Service Centre fleet." />
      <Card title={<><i className="fas fa-key text-primary me-2" />OTP & planning rules</>}>
        <div className="p-3 row g-3 small">
          <div className="col-md-3"><label className="form-label fw-medium">OTP valid for (minutes)</label><input type="number" min={2} max={60} className="form-control form-control-sm" value={v.otpExpiryMinutes ?? ''} onChange={(e) => setX((p) => ({ ...p, otpExpiryMinutes: Number(e.target.value) }))} /></div>
          <div className="col-md-3"><label className="form-label fw-medium">Wrong attempts before lock</label><input type="number" min={1} max={10} className="form-control form-control-sm" value={v.otpMaxAttempts ?? ''} onChange={(e) => setX((p) => ({ ...p, otpMaxAttempts: Number(e.target.value) }))} /></div>
          <div className="col-md-4 d-flex align-items-end"><div className="form-check form-switch"><input id="nd" className="form-check-input" type="checkbox" checked={!!v.nextDayPlanning} onChange={(e) => setX((p) => ({ ...p, nextDayPlanning: e.target.checked }))} /><label htmlFor="nd" className="form-check-label">Retailer delivery and return plans for the next day only</label></div></div>
          <div className="col-md-2 d-flex align-items-end"><button className="btn btn-sm btn-primary w-100" disabled={busy || !Object.keys(x).length} onClick={() => void save()}>Save</button></div>
          <div className="col-12 text-muted">OTP checkpoints: distributor pickup · handover to CDS · order pickup at CDS · retailer delivery · return collection · return handover to CDS · return pickup at CDS · return handover to seller. A used OTP cannot be reused.</div>
        </div>
      </Card>
      <Fleet />
    </div>
  );
}

export function StoresPage() {
  const { busy, run } = useAction();
  const { data, error, loading, reload } = useLoad(() => cdsApi.stores(), []);
  const edit = async (id: string, name: string, phone: string) => {
    const r = await Swal.fire({
      title: 'Store manager', html: `<input id="m-name" class="swal2-input" placeholder="Manager name" value="${name}"><input id="m-phone" class="swal2-input" placeholder="Phone" value="${phone}">`,
      showCancelButton: true, confirmButtonText: 'Save', confirmButtonColor: '#1e3a8a', reverseButtons: true,
      preConfirm: () => ({ managerName: (document.getElementById('m-name') as HTMLInputElement).value, managerPhone: (document.getElementById('m-phone') as HTMLInputElement).value }),
    });
    if (r.isConfirmed && (await run(() => cdsApi.updateStore(id, r.value), 'Store updated'))) { refreshMeta(); reload(); }
  };
  const toggle = async (id: string, name: string, active: boolean) => {
    if (!active && !(await confirm(`Deactivate ${name}?`, 'No new orders or plans can be sent to it.', 'Deactivate'))) return;
    if (await run(() => cdsApi.updateStore(id, { active }), active ? 'Store activated' : 'Store deactivated')) { refreshMeta(); reload(); }
  };
  return (
    <div className="cds-page">
      <PageHead icon="fa-store" title="CDS Stores" subtitle="CDS stores operated through the Service Centre — serviceability, CDS User, and live operations." />
      {error && <ErrorBox text={error} onRetry={reload} />}
      {loading && !data ? <Loading /> : (
        <div className="row g-3">
          {data?.map((st) => (
            <div key={st.id} className="col-xl-4 col-lg-6">
              <Card title={<><i className="fas fa-warehouse text-primary me-2" />{st.name} <small>{st.code}</small></>} extra={<span className={`cds-badge ${st.active ? 'green' : 'grey'}`}>{st.active ? 'Active' : 'Inactive'}</span>}>
                <dl className="cds-dl">
                  <dt>Address</dt><dd>{st.address}</dd>
                  <dt>Serves</dt><dd>{st.localities.join(', ')}</dd>
                  <dt>Manager</dt><dd>{st.managerName} · {st.managerPhone}</dd>
                  <dt>CDS User</dt><dd>{st.user ? `${st.user.name} · +91 ${st.user.mobile}` : '—'}</dd>
                  <dt>Fleet</dt><dd>{st.vehicles} vehicle(s) · {st.deliveryPersons} delivery person(s)</dd>
                </dl>
                <div className="d-flex flex-wrap gap-3 px-3 pb-3 small">
                  {[['Incoming', st.incoming], ['GRN pending', st.grnPending], ['Ready', st.ready], ['Out for delivery', st.outForDelivery], ['Delivered', st.delivered], ['Returns at CDS', st.returnsAtCds]].map(([l, n]) => (
                    <div key={l as string}><div className="text-muted text-xs">{l}</div><div className="fs-5 fw-bold">{n}</div></div>
                  ))}
                </div>
                <div className="d-flex gap-2 px-3 pb-3">
                  <button className="btn btn-sm btn-outline-primary" disabled={busy} onClick={() => void edit(st.id, st.managerName, st.managerPhone)}>Edit manager</button>
                  <button className={`btn btn-sm ${st.active ? 'btn-outline-danger' : 'btn-outline-success'}`} disabled={busy} onClick={() => void toggle(st.id, st.name, !st.active)}>{st.active ? 'Deactivate' : 'Activate'}</button>
                </div>
              </Card>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
