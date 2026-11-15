// Reports (both roles), Settings (Service Centre: OTP rules + fleet), Reports & Settings (CDS User: reports + own fleet
// and store), CDS Stores (Service Centre). Same layout as the app's Reports and Settings screens.
import { useRef, useState, type ReactNode } from 'react';
import Swal from 'sweetalert2';
import { cdsApi } from '../../api/services/cds.service';
import { TRIP_STATUS } from '../../cds/status';
import { ringAreaKm2 } from '../../cds/planning';
import { CoverageMap, OUTSIDE_COLOR, PolygonEditorDialog, STORE_COLORS } from './RouteMap';
import { Card, confirm, downloadCsv, Empty, ErrorBox, FilterBar, fmtDate, InfoSection, Loading, PageHead, refreshMeta, RowActions, SectionCard, Table, Tabs, useAction, useCdsSession, useLoad, useMeta } from './ui';

const STATUS_OPTIONS: Record<string, Record<string, { label: string }>> = {
  'trips-': TRIP_STATUS,
};

/** Report form (report, dates, filters, Clear Filters / Download) and a preview of the rows. */
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
  const set = (p: Record<string, string>) => setF((x) => ({ ...x, ...p }));
  const has = (k: string) => !!current?.filters.includes(k);
  const select = (key: string, label: string, all: string, options: { id: string; name: string }[]) => (
    <div>
      <label htmlFor={`rf-${key}`}>{label}</label>
      <select id={`rf-${key}`} className="form-select form-select-sm" value={f[key] ?? ''} onChange={(e) => set({ [key]: e.target.value })}>
        <option value="">{all}</option>{options.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
      </select>
    </div>
  );
  return (
    <>
      <Card title={<><i className="fas fa-file-lines text-primary me-2" />Report</>}>
        <div className="cds-report-form">
          <div>
            <label htmlFor="rf-report">Report</label>
            <select id="rf-report" className="form-select form-select-sm" value={rid} onChange={(e) => { setId(e.target.value); setF({}); }}>
              {list.map((r) => <option key={r.id} value={r.id}>{r.title}</option>)}
            </select>
          </div>
          {has('from') && <div><label htmlFor="rf-from">From Date</label><input id="rf-from" type="date" className="form-control form-control-sm" value={f.from ?? ''} onChange={(e) => set({ from: e.target.value })} /></div>}
          {has('to') && <div><label htmlFor="rf-to">To Date</label><input id="rf-to" type="date" className="form-control form-control-sm" value={f.to ?? ''} onChange={(e) => set({ to: e.target.value })} /></div>}
          {has('cdsStoreId') && sc && select('cdsStoreId', 'CDS Store', 'All CDS stores', meta.data?.stores ?? [])}
          {has('distributorId') && select('distributorId', 'Distributor', 'All distributors', meta.data?.distributors ?? [])}
          {has('status') && select('status', 'Status', 'All statuses', Object.entries(statuses).map(([k, v]) => ({ id: k, name: v.label })))}
        </div>
        <div className="cds-report-actions">
          <button className="btn btn-sm btn-outline-secondary" disabled={!Object.values(f).some(Boolean)} onClick={() => setF({})}>Clear Filters</button>
          <button className="btn btn-sm btn-primary" disabled={!data?.rows.length} onClick={() => data && downloadCsv(data.id, data.columns, data.rows)}><i className="fas fa-download me-1" />Download</button>
        </div>
      </Card>
      <Card title={data?.title ?? 'Preview'} extra={data && <small>{data.rows.length} row(s)</small>}>
        {error && <ErrorBox text={error} onRetry={reload} />}
        {loading && !data ? <Loading /> : data && (
          <Table head={data.columns.map((c) => c.label)} empty={!data.rows.length && <Empty text="No data for these filters" />}>
            {data.rows.map((r, i) => <tr key={i} className="mat-mdc-row">{data.columns.map((c) => <td key={c.key} className="small">{r[c.key]}</td>)}</tr>)}
            {data.totals && <tr className="mat-mdc-row cds-retailer-row">{data.columns.map((c, i) => <td key={c.key}>{i === 0 ? 'Total' : data.totals?.[c.key] ?? ''}</td>)}</tr>}
          </Table>
        )}
      </Card>
    </>
  );
}

/** Service Centre reports. The CDS User has its own LBNP-style Performance Report (src/pages/cds/user). */
export function ReportsPage() {
  return <div className="cds-page"><PageHead icon="fa-chart-bar" title="Reports" subtitle="Download reports across your CDS stores." /><Reports /></div>;
}

/** Vehicles or delivery persons, with Add and an Active switch. */
function Fleet({ show }: { show: 'vehicles' | 'persons' }) {
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
  const sw = (label: string, on: boolean, change: (v: boolean) => void) => (
    <div className="form-check form-switch m-0 d-inline-block"><input className="form-check-input" type="checkbox" aria-label={label} disabled={busy} checked={on} onChange={(e) => change(e.target.checked)} /></div>
  );
  return show === 'vehicles' ? (
    <Card title={<><i className="fas fa-truck text-primary me-2" />Vehicles <small>({data?.vehicles.length})</small></>} extra={<button className="btn btn-sm btn-primary" onClick={() => void addVehicle()}><i className="fas fa-plus me-1" />Add Vehicle</button>}>
      <Table head={['Registration', 'Type', 'Capacity', 'Active']}>
        {data?.vehicles.map((v) => <tr key={v.id} className="mat-mdc-row"><td className="fw-semibold">{v.regNo}</td><td className="small">{v.type}</td><td className="small">{v.capacityKg} kg</td><td>{sw(`Active ${v.regNo}`, v.active, (x) => void toggle('vehicles', v.id, x))}</td></tr>)}
      </Table>
    </Card>
  ) : (
    <Card title={<><i className="fas fa-id-badge text-primary me-2" />Delivery Persons <small>({data?.deliveryPersons.length})</small></>} extra={<button className="btn btn-sm btn-primary" onClick={() => void addPerson()}><i className="fas fa-plus me-1" />Add Delivery Person</button>}>
      <Table head={['Name', 'Mobile', 'Active']}>
        {data?.deliveryPersons.map((p) => <tr key={p.id} className="mat-mdc-row"><td className="fw-semibold">{p.name}</td><td className="small">{p.phone}</td><td>{sw(`Active ${p.name}`, p.active, (x) => void toggle('persons', p.id, x))}</td></tr>)}
      </Table>
    </Card>
  );
}

export function SettingsPage() {
  const meta = useMeta();
  const { busy, run } = useAction();
  const [tab, setTab] = useState<'otp' | 'vehicles' | 'persons'>('otp');
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
  const tile = (icon: string, title: string, desc: string, control: ReactNode) => (
    <div className="cds-tile">
      <div className="tile-icon"><i className={`fas ${icon}`} /></div>
      <div className="tile-text"><div className="tile-title">{title}</div><div className="tile-desc">{desc}</div></div>
      {control}
    </div>
  );
  return (
    <div className="cds-page">
      <PageHead icon="fa-cog" title="Settings" subtitle="OTP rules and the Service Centre fleet." />
      <Tabs value={tab} onChange={setTab} tabs={[{ id: 'otp', label: 'OTP Rules', icon: 'fa-key' }, { id: 'vehicles', label: 'Vehicles', icon: 'fa-truck' }, { id: 'persons', label: 'Delivery Persons', icon: 'fa-id-badge' }]} />
      {tab === 'vehicles' && <Fleet show="vehicles" />}
      {tab === 'persons' && <Fleet show="persons" />}
      {tab === 'otp' && (
        <Card>
          <div className="p-4">
            <div className="cds-settings-head">
              <h2>OTP & Planning Rules</h2>
              <div className="d-flex gap-2">
                <button className="btn btn-sm btn-outline-secondary" disabled={busy || !Object.keys(x).length} onClick={() => setX({})}><i className="fas fa-rotate-left me-1" />Undo Changes</button>
                <button className="btn btn-sm btn-primary" disabled={busy || !Object.keys(x).length} onClick={() => void save()}><i className="fas fa-floppy-disk me-1" />Save</button>
              </div>
            </div>
            <div className="cds-tiles">
              {tile('fa-clock', 'OTP Validity', 'Time an OTP stays valid', <><input type="number" min={2} max={60} aria-label="OTP validity in minutes" className="form-control form-control-sm" value={v.otpExpiryMinutes ?? ''} onChange={(e) => setX((p) => ({ ...p, otpExpiryMinutes: Number(e.target.value) }))} /><span className="unit">minutes</span></>)}
              {tile('fa-lock', 'Wrong Attempts', 'Wrong OTPs before the OTP locks', <><input type="number" min={1} max={10} aria-label="Wrong attempts before lock" className="form-control form-control-sm" value={v.otpMaxAttempts ?? ''} onChange={(e) => setX((p) => ({ ...p, otpMaxAttempts: Number(e.target.value) }))} /><span className="unit">attempts</span></>)}
              {tile('fa-calendar-day', 'Next-day Planning', 'Retailer delivery routes for the next day or later only', <div className="form-check form-switch m-0"><input className="form-check-input" type="checkbox" aria-label="Next-day planning" checked={!!v.nextDayPlanning} onChange={(e) => setX((p) => ({ ...p, nextDayPlanning: e.target.checked }))} /></div>)}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

export function StoresPage() {
  const { busy, run } = useAction();
  const { data, error, loading, reload } = useLoad(() => cdsApi.stores(), []);
  const coverage = useLoad(() => cdsApi.coverage(), []);
  const [editing, setEditing] = useState<string | null>(null);
  const [q, setQ] = useState('');
  const [focus, setFocus] = useState<string | null>(null);
  const [listStore, setListStore] = useState<string>('');
  const [listQ, setListQ] = useState('');
  const mapRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const stores = data ?? [];
  const retailers = coverage.data ?? [];
  const countOf = (id: string | null) => retailers.filter((r) => r.storeId === id).length;
  const color = (id: string) => STORE_COLORS[Math.max(0, stores.findIndex((s) => s.id === id)) % STORE_COLORS.length];
  const matches = q.trim().length < 2 ? [] : retailers.filter((r) => `${r.name} ${r.phone} ${r.code} ${r.locality}`.toLowerCase().includes(q.trim().toLowerCase())).slice(0, 8);
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
    if (await run(() => cdsApi.updateStore(id, { active }), active ? 'Store activated' : 'Store deactivated')) { refreshMeta(); reload(); coverage.reload(); }
  };
  const saveArea = async (id: string, polygon: [number, number][]) => {
    if (await run(() => cdsApi.updateStore(id, { polygon }), 'Service area saved')) { setEditing(null); refreshMeta(); reload(); coverage.reload(); }
  };
  const editingStore = stores.find((s) => s.id === editing);
  const tabStore = listStore || stores[0]?.id || '';
  const listed = retailers
    .filter((r) => (tabStore === 'outside' ? !r.storeId : r.storeId === tabStore))
    .filter((r) => !listQ.trim() || `${r.name} ${r.ownerName} ${r.phone} ${r.locality} ${r.code}`.toLowerCase().includes(listQ.trim().toLowerCase()))
    .sort((a, b) => b.orders - a.orders || a.name.localeCompare(b.name));
  const showRetailers = (id: string) => { setListStore(id); setListQ(''); setTimeout(() => listRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50); };
  const locate = (id: string) => { setFocus(id); mapRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }); };
  return (
    <div className="cds-page">
      <PageHead icon="fa-store" title="CDS Stores" subtitle="CDS stores and their service areas. A retailer inside a service area is served by that CDS store." />
      {(error || coverage.error) && <ErrorBox text={error || coverage.error} onRetry={() => { reload(); coverage.reload(); }} />}
      {loading && !data ? <Loading /> : (
        <>
          <div ref={mapRef} />
          <SectionCard icon="fa-draw-polygon" tone="teal" title="Service Areas" subtitle="Retailers inside a CDS area go to that CDS store. Outside every area → 3PL." count={retailers.length - countOf(null)} countLabel={`of ${retailers.length} retailers covered`}>
            <div className="cds-coverage">
              <div className="cds-area-side">
                <ul className="cds-legend">
                  {stores.map((s) => (
                    <li key={s.id} role="button" title="Show the retailers of this CDS store" onClick={() => showRetailers(s.id)}><span className="swatch" style={{ background: color(s.id) }} />{s.name}{!s.active && <span className="text-muted small">(inactive)</span>}<span className="num">{countOf(s.id)}</span></li>
                  ))}
                  <li role="button" title="Show the retailers outside every CDS area" onClick={() => showRetailers('outside')}><span className="swatch" style={{ background: OUTSIDE_COLOR }} />Outside every area (3PL)<span className="num">{countOf(null)}</span></li>
                </ul>
                <div>
                  <label className="form-label fw-semibold small mb-1" htmlFor="chk-ret">Check a retailer</label>
                  <div className="cds-search w-100"><i className="fas fa-search" /><input id="chk-ret" className="form-control form-control-sm" placeholder="Name, phone or locality" value={q} onChange={(e) => { setQ(e.target.value); setFocus(null); }} /></div>
                </div>
                {q.trim().length >= 2 && (
                  !matches.length ? <div className="text-muted small">No retailer found</div> : (
                    <ul className="cds-check-results">
                      {matches.map((r) => {
                        const st = stores.find((s) => s.id === r.storeId);
                        return (
                          <li key={r.id} className={focus === r.id ? 'on' : ''} onClick={() => setFocus(r.id)}>
                            <div className="fw-semibold">{r.name}</div>
                            <div className="text-muted text-xs">{r.locality} · {r.phone}</div>
                            <div className="verdict" style={{ color: st ? color(st.id) : '#dc2626' }}>
                              <i className={`fas ${st ? 'fa-circle-check' : 'fa-circle-xmark'} me-1`} />{st ? `Inside ${st.name}` : 'Outside every CDS area → 3PL'}
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )
                )}
              </div>
              {coverage.loading && !coverage.data ? <Loading /> : <CoverageMap stores={stores} retailers={retailers} focusId={focus} />}
            </div>
          </SectionCard>
          <div className="cds-info-grid">
            {stores.map((st) => (
              <InfoSection key={st.id} icon="fa-warehouse" title={st.name} rows={[
                ['fa-circle-info', 'Status', <span key="s" className={`cds-badge ${st.active ? 'green' : 'grey'}`}>{st.active ? 'Active' : 'Inactive'}</span>],
                ['fa-draw-polygon', 'Service Area', <span key="a"><span className="cds-legend-dot" style={{ background: color(st.id) }} />{ringAreaKm2(st.polygon)} km² · {countOf(st.id)} retailers</span>],
                ['fa-user-tie', 'Manager', `${st.managerName} · ${st.managerPhone}`],
                ['fa-location-dot', 'Areas', st.localities.join(', ')],
                ['fa-truck', 'Fleet', `${st.vehicles} vehicles · ${st.deliveryPersons} persons`],
              ]}>
                <div className="cds-store-stats">
                  {([['Incoming', st.incoming], ['Ready', st.ready], ['Out for delivery', st.outForDelivery], ['Delivered', st.delivered]] as [string, number][]).map(([l, n]) => <div key={l}><b>{n}</b><span>{l}</span></div>)}
                </div>
                <div className="d-flex justify-content-between align-items-center mt-2">
                  <div className="d-flex gap-2 flex-wrap">
                    <button className="btn btn-sm btn-outline-primary" disabled={!coverage.data} onClick={() => showRetailers(st.id)}><i className="fas fa-users me-1" />Retailers ({countOf(st.id)})</button>
                    <button className="btn btn-sm btn-outline-primary" disabled={busy || !coverage.data} onClick={() => setEditing(st.id)}><i className="fas fa-draw-polygon me-1" />Edit service area</button>
                  </div>
                  <RowActions items={[
                    { label: 'Edit service area', icon: 'fa-draw-polygon', onClick: () => setEditing(st.id), hidden: busy || !coverage.data },
                    { label: 'Edit manager', icon: 'fa-pen', onClick: () => void edit(st.id, st.managerName, st.managerPhone), hidden: busy },
                    st.active
                      ? { label: 'Deactivate store', icon: 'fa-ban', tone: 'danger', onClick: () => void toggle(st.id, st.name, false), hidden: busy }
                      : { label: 'Activate store', icon: 'fa-circle-check', tone: 'success', onClick: () => void toggle(st.id, st.name, true), hidden: busy },
                  ]} />
                </div>
              </InfoSection>
            ))}
          </div>
          <div ref={listRef} className="mt-3" />
          <SectionCard icon="fa-users" title="Retailers by CDS Store" subtitle="Retailers inside each CDS store's service area" count={listed.length} countLabel="retailers">
            <div className="px-3 pt-3">
              <Tabs value={tabStore} onChange={(v) => { setListStore(v); setListQ(''); }} tabs={[
                ...stores.map((s) => ({ id: s.id, label: s.name, icon: 'fa-warehouse', count: countOf(s.id) })),
                { id: 'outside', label: 'Outside (3PL)', icon: 'fa-circle-xmark', count: countOf(null) },
              ]} />
              <FilterBar search={listQ} onSearch={setListQ} placeholder="Search retailer, owner, phone, locality…">
                {tabStore === 'outside'
                  ? <span className="text-muted"><i className="fas fa-circle-info me-1" />Outside every CDS service area. Orders go by 3PL.</span>
                  : <span className="text-muted"><span className="cds-legend-dot" style={{ background: color(tabStore) }} />Inside the {stores.find((s) => s.id === tabStore)?.name} service area</span>}
              </FilterBar>
            </div>
            <Table head={['Retailer', 'Owner · Phone', 'Locality', 'Address', 'Orders', 'Open', 'Last Order', 'Actions']} empty={!listed.length && <Empty icon="fa-users" text={listQ ? 'No retailer matches the search' : 'No retailers here'} />}>
              {listed.map((r) => (
                <tr key={r.id} className="mat-mdc-row">
                  <td className="fw-semibold">{r.name}<div className="text-muted text-xs fw-normal">{r.code}</div></td>
                  <td className="small">{r.ownerName}<div className="text-muted text-xs">{r.phone}</div></td>
                  <td className="small">{r.locality}</td>
                  <td className="small">{r.address}</td>
                  <td>{r.orders}</td><td>{r.openOrders}</td>
                  <td className="small">{r.lastOrder ? fmtDate(r.lastOrder) : '—'}</td>
                  <td><RowActions onView={() => locate(r.id)} items={[{ label: 'Show on map', icon: 'fa-map-location-dot', onClick: () => locate(r.id) }]} /></td>
                </tr>
              ))}
            </Table>
          </SectionCard>
        </>
      )}
      {editingStore && (
        <PolygonEditorDialog store={editingStore} others={stores.filter((s) => s.id !== editingStore.id)} retailers={retailers} busy={busy}
          onSave={(ring) => void saveArea(editingStore.id, ring)} onClose={() => setEditing(null)} />
      )}
    </div>
  );
}
