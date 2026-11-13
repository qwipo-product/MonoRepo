// "Create … Route" in the LBNP Create Delivery Route layout: pick the round / day, tick orders (or returns), Plan Routes.
// Plan Routes splits the selection into routes and assigns the smallest free vehicle (Service Centre) or a free rider
// (store) to each; the routes then wait on the planning list for Generate Trip.
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import Swal from 'sweetalert2';
import { crossDockService, errorMessage } from '../../../api/services/crossDock.service';
import { amountDue, type PickupRound, type XdOrderRow, type XdReturnRow, type XdRoutePlanRow } from '../../../types/crossDock';
import { addCurrency, addWeight } from '../../../utils/pipes';
import { dateTime, day, hm, plural } from '../../service-centre/labels';
import { LoadError } from '../../service-centre/ScUi';
import { useLoad } from '../../service-centre/useLoad';
import { useStoreApi } from '../../cross-dock-store/useStoreApi';
import { LbCreateRoute } from '../lbnp/LbPlanning';
import { MODE, resourceLabel, type PlanMode } from './planMode';

const nextDay = (ymd: string) => {
  const d = new Date(`${ymd}T00:00:00`);
  d.setDate(d.getDate() + 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export default function CreateRoutePage({ mode }: { mode: PlanMode }) {
  const m = MODE[mode];
  const navigate = useNavigate();
  const store = useStoreApi();
  const { data, loading, error, reload } = useLoad(async () => {
    if (mode === 'delivery') {
      const [ov, orders] = await Promise.all([store.overview(), store.orders(['READY_TO_DISPATCH'])]);
      return { today: ov.operatingDate, windows: ov.settings.windows, orders: orders.filter((o) => !o.runId && !o.planId), returns: [] as XdReturnRow[], distributors: ov.distributors };
    }
    const ov = await crossDockService.overview();
    if (mode === 'pickup') {
      const orders = await crossDockService.orders({ status: ['ACCEPTED'] });
      return { today: ov.operatingDate, windows: ov.settings.windows, orders: orders.filter((o) => !o.planId), returns: [] as XdReturnRow[], distributors: ov.distributors };
    }
    const returns = await crossDockService.returns(['AT_CDS']);
    return { today: ov.operatingDate, windows: ov.settings.windows, orders: [] as XdOrderRow[], returns: returns.filter((x) => !x.planId), distributors: ov.distributors };
  }, [mode, store]);

  const [slot, setSlot] = useState<PickupRound>('R2');
  const [dayPick, setDayPick] = useState<'today' | 'tomorrow' | ''>('');
  const [distributor, setDistributor] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [planning, setPlanning] = useState(false);
  const [planError, setPlanError] = useState<string | null>(null);

  const today = data?.today ?? '';
  // Returns: today's window if it is still open, else tomorrow's. Deliveries: orders delivering today first.
  const defaultDay = useMemo<'today' | 'tomorrow'>(() => {
    if (!data) return 'today';
    if (mode === 'return') {
      const w = data.windows.find((x) => x.key === 'RETURNS');
      const now = new Date();
      const hhmm = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      return w && hhmm < w.end ? 'today' : 'tomorrow';
    }
    return data.orders.some((o) => o.deliveryDate === data.today) ? 'today' : 'tomorrow';
  }, [data, mode]);
  const which = dayPick || defaultDay;
  const date = which === 'today' ? today : today ? nextDay(today) : '';

  const orderRows = useMemo(
    () => (data?.orders ?? []).filter((o) => (mode !== 'delivery' || o.deliveryDate === date) && (!distributor || o.distributorId === distributor)),
    [data, mode, date, distributor],
  );
  const returnRows = data?.returns ?? [];
  const keys = mode === 'return' ? returnRows.map((x) => x.id) : orderRows.map((o) => o.id);
  const chosen = keys.filter((k) => selected.has(k));

  const chosenOrders = orderRows.filter((o) => selected.has(o.id));
  const chosenReturns = returnRows.filter((x) => selected.has(x.id));
  const value = mode === 'return' ? chosenReturns.reduce((s, x) => s + x.value, 0) : chosenOrders.reduce((s, o) => s + amountDue(o), 0);
  const weight = mode === 'return' ? chosenReturns.reduce((s, x) => s + x.weightKg, 0) : chosenOrders.reduce((s, o) => s + o.weightKg, 0);

  const toggle = (k: string) => {
    const next = new Set(selected);
    if (next.has(k)) next.delete(k);
    else next.add(k);
    setSelected(next);
    setPlanError(null);
  };

  const plan = async () => {
    setPlanning(true);
    setPlanError(null);
    try {
      let routes: XdRoutePlanRow[];
      if (mode === 'pickup') routes = await crossDockService.createPickupPlans({ slot, orderIds: chosen });
      else if (mode === 'return') routes = await crossDockService.createReturnPlan({ returnIds: chosen, date });
      else routes = await store.createPlans({ date, orderIds: chosen });
      await Swal.fire({
        icon: 'success',
        title: `${plural(routes.length, 'route')} planned`,
        html: `<div style="text-align:left;font-size:14px">${routes
          .map((r) => `<div style="padding:4px 0;border-bottom:1px solid #eee"><b>${r.routeId}</b> · ${resourceLabel(r)}<br/><span style="color:#6b7280">${r.kind === 'DELIVERY' ? `${r.dropPoints} retailers · ${r.orderCount} orders` : `${r.pickupPoints} → ${r.dropPoints} stops · ${r.orderCount || r.returnCount} ${m.unit}s`} · ${addWeight(r.weightKg)} · ${r.distanceKm} km</span></div>`)
          .join('')}<p style="margin-top:10px">Open each route to check it, then Generate Trip.</p></div>`,
        confirmButtonText: `Go to ${m.title}`,
      });
      navigate(m.base);
    } catch (e) {
      setPlanError(errorMessage(e, 'Could not plan the routes.'));
      void reload();
    } finally {
      setPlanning(false);
    }
  };

  if (error && !data) return <div className="sc-page"><LoadError message={error} onRetry={reload} /></div>;

  const win = (key: string) => data?.windows.find((w) => w.key === key);
  const config =
    mode === 'pickup' ? (
      <>
        <div className="config-item">
          <label className="config-label">Pickup Round</label>
          <div className="mode-radios">
            {(['R1', 'R2', 'EARLY_AM'] as PickupRound[]).map((k) => (
              <label key={k}>
                <input type="radio" name="round" checked={slot === k} onChange={() => { setSlot(k); setPlanError(null); }} /> {win(k)?.label ?? k}
                {win(k) ? ` (${hm(win(k)!.start)} – ${hm(win(k)!.end)})` : ''}
              </label>
            ))}
          </div>
        </div>
        <div className="config-item">
          <label className="config-label">Fleet</label>
          <div className="mode-radios">
            <label><input type="radio" name="fleet" checked readOnly /> Self Fleet</label>
            <label title="3PL quotations for Service Centre pickups come later" style={{ opacity: 0.5 }}><input type="radio" name="fleet" disabled /> 3PL</label>
          </div>
        </div>
        <div className="config-item">
          <label className="config-label" htmlFor="cr-dist">Distributor</label>
          <select id="cr-dist" className="form-select form-select-sm" style={{ width: 260 }} value={distributor} onChange={(e) => setDistributor(e.target.value)}>
            <option value="">All distributors</option>
            {data?.distributors.filter((d) => d.deliveryModes.includes('CROSS_DOCK')).map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </div>
      </>
    ) : (
      <div className="config-item">
        <label className="config-label">{mode === 'return' ? 'Returns Day' : 'Delivery Date'}</label>
        <div className="mode-radios">
          {(['today', 'tomorrow'] as const).map((w) => (
            <label key={w}>
              <input type="radio" name="day" checked={which === w} onChange={() => { setDayPick(w); setSelected(new Set()); setPlanError(null); }} /> {w === 'today' ? 'Today' : 'Tomorrow'}, {day(w === 'today' ? today : today ? nextDay(today) : '')}
              {mode === 'return' && win('RETURNS') ? ` (${hm(win('RETURNS')!.start)} – ${hm(win('RETURNS')!.end)})` : ''}
            </label>
          ))}
        </div>
      </div>
    );

  return (
    <LbCreateRoute
      title={m.createTitle}
      onBack={() => navigate(m.base)}
      config={config}
      sectionTitle={mode === 'return' ? 'Returns at Cross Dock Stores' : mode === 'pickup' ? 'Orders waiting for pickup' : 'Orders ready for planning'}
      columns={
        mode === 'return'
          ? [
              { icon: 'fa-calendar', label: 'Held Since' },
              { icon: 'fa-hashtag', label: 'Return No.' },
              { icon: 'fa-store', label: 'Collect From' },
              { icon: 'fa-industry', label: 'Hand Back To' },
              { icon: 'fa-comment', label: 'Reason' },
              { icon: 'fa-hashtag', label: 'Value', center: true },
              { icon: 'fa-weight-hanging', label: 'Weight (kg)', center: true },
            ]
          : mode === 'pickup'
            ? [
                { icon: 'fa-calendar', label: 'Accepted' },
                { icon: 'fa-store', label: 'Retailer Name' },
                { icon: 'fa-industry', label: 'Distributor' },
                { icon: 'fa-warehouse', label: 'Drop At' },
                { icon: 'fa-hashtag', label: 'Ref Order Number' },
                { icon: 'fa-hashtag', label: 'Invoice Value', center: true },
                { icon: 'fa-weight-hanging', label: 'Weight (kg)', center: true },
              ]
            : [
                { icon: 'fa-calendar', label: 'Received' },
                { icon: 'fa-store', label: 'Retailer Name' },
                { icon: 'fa-map-marker-alt', label: 'Area' },
                { icon: 'fa-industry', label: 'Distributor' },
                { icon: 'fa-hashtag', label: 'Ref Order Number' },
                { icon: 'fa-hashtag', label: 'To Collect', center: true },
                { icon: 'fa-weight-hanging', label: 'Weight (kg)', center: true },
              ]
      }
      rows={
        mode === 'return'
          ? returnRows.map((x) => ({ key: x.id, cells: [dateTime(x.heldSince), x.returnNo, x.cdsCode, x.distributorName, x.reason, addCurrency(x.value), addWeight(x.weightKg)] }))
          : orderRows.map((o) => ({
              key: o.id,
              cells:
                mode === 'pickup'
                  ? [dateTime(o.acceptedAt), o.retailerName, o.distributorName, o.cdsCode, o.orderNo, addCurrency(o.value), addWeight(o.weightKg)]
                  : [dateTime(o.receivedAt ?? o.acceptedAt), o.retailerName, o.retailerLocality, o.distributorName, o.orderNo, addCurrency(amountDue(o)), addWeight(o.weightKg)],
            }))
      }
      selected={selected}
      onToggle={toggle}
      onToggleAll={(on) => { setSelected(on ? new Set(keys) : new Set()); setPlanError(null); }}
      summary={[
        { icon: 'fa-list-ol', label: mode === 'return' ? 'Selected Returns' : 'Selected Orders', value: chosen.length },
        { icon: 'fa-weight-hanging', label: mode === 'delivery' ? 'Total To Collect' : 'Total Invoice Value', value: addCurrency(value) },
        { icon: 'fa-cube', label: 'Total Weight', value: addWeight(Math.round(weight * 10) / 10) },
      ]}
      onCancel={() => navigate(m.base)}
      onConfirm={plan}
      confirming={planning}
      confirmLabel="Plan Routes"
      error={planError}
      empty={loading ? 'Loading...' : mode === 'return' ? 'No returns waiting at the stores' : mode === 'pickup' ? 'Every order is already planned' : `No orders ready for ${which === 'today' ? 'today' : 'tomorrow'}. Receive trucks in Inward first.`}
    />
  );
}
