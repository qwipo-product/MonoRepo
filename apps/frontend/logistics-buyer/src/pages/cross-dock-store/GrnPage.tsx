// Cross Dock Store → Inward → one truck: the goods received note, in the LBNP Trip details layout.
// Product view: every product on the truck across all its distributors, expected vs counted (with damaged).
// Customer view: the retailers the goods are for. Confirming the GRN shows the OTP the store gives the driver; the
// driver entering it closes the drop and moves the orders to Delivery Planning.
import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import Swal from 'sweetalert2';
import DataLoading from '../../components/DataLoading';
import { errorMessage } from '../../api/services/crossDock.service';
import type { XdGrnLine } from '../../types/crossDock';
import { addCurrency } from '../../utils/pipes';
import { dateTime, kg, plural, rupees, slotLabel, STORE_STATUS, time } from '../service-centre/labels';
import { LoadError, RefreshError, StatusPill } from '../service-centre/ScUi';
import { useLoad } from '../service-centre/useLoad';
import LbTripDetails, { LbInfoCard, LbProgressCard, LbSummaryRow, LbTable } from '../cross-dock/lbnp/LbTripDetails';
import { INBOUND_STATUS } from './inbound';
import { useStoreApi } from './useStoreApi';

type Counts = Record<string, { received: string; damaged: string }>;

export default function GrnPage() {
  const { tripId = '' } = useParams();
  const api = useStoreApi();
  const navigate = useNavigate();
  const { data, loading, error, reload } = useLoad(() => Promise.all([api.overview(), api.grn(tripId)]), [api, tripId]);
  const [counts, setCounts] = useState<Counts>({});
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const [driverOtp, setDriverOtp] = useState('');
  const [otpError, setOtpError] = useState<string | null>(null);

  const view = data?.[1];
  const editable = view?.truck.state === 'AT_STORE';
  const lines = useMemo<XdGrnLine[]>(() => {
    if (!view) return [];
    if (!editable) return view.lines;
    return view.lines.map((l) => {
      const c = counts[l.sku];
      return { ...l, received: c ? Number(c.received) || 0 : l.expected, damaged: c ? Number(c.damaged) || 0 : 0 };
    });
  }, [view, counts, editable]);

  if (loading && !data) return <DataLoading message="Loading the truck..." />;
  if (error && !data) return <div className="sc-page"><LoadError message={error} onRetry={reload} /></div>;
  if (!data || !view) return null;
  const [overview] = data;
  const { truck } = view;
  const st = INBOUND_STATUS[truck.state];

  const expected = lines.reduce((s, l) => s + l.expected, 0);
  const counted = lines.reduce((s, l) => s + l.received, 0);
  const short = lines.reduce((s, l) => s + Math.max(0, l.expected - l.received), 0);
  const extra = lines.reduce((s, l) => s + Math.max(0, l.received - l.expected), 0);
  const damaged = lines.reduce((s, l) => s + l.damaged, 0);
  const notMatching = lines.filter((l) => l.received !== l.expected || l.damaged > 0);
  const lossValue = lines.reduce((s, l) => s + (Math.max(0, l.expected - l.received) + l.damaged) * l.price, 0);

  const setCount = (sku: string, k: 'received' | 'damaged', v: string) => {
    const l = view.lines.find((x) => x.sku === sku)!;
    const cur = counts[sku] ?? { received: String(l.expected), damaged: '0' };
    setCounts({ ...counts, [sku]: { ...cur, [k]: v.replace(/\D/g, '') } });
  };

  const confirm = async () => {
    if (notMatching.length) {
      const r = await Swal.fire({
        icon: 'warning',
        title: `${plural(notMatching.length, 'product')} not matching`,
        html: `<div style="text-align:left;font-size:14px">${notMatching
          .map((l) => `<div>• ${l.name.split(',')[0]}: expected ${l.expected}, counted ${l.received}${l.damaged ? `, ${l.damaged} damaged` : ''}</div>`)
          .join('')}<p style="margin-top:10px">Short and damaged units (${addCurrency(lossValue)}) are not collected from the retailers. Confirm the GRN with these differences?</p></div>`,
        showCancelButton: true,
        confirmButtonText: 'Confirm GRN',
        cancelButtonText: 'Recount',
      });
      if (!r.isConfirmed) return;
    }
    setBusy('grn');
    try {
      await api.confirmGrn(tripId, { lines: lines.map((l) => ({ sku: l.sku, received: l.received, damaged: l.damaged })), note });
      setCounts({});
      await reload();
    } catch (e) {
      Swal.fire({ icon: 'error', title: 'Could not confirm the GRN', text: errorMessage(e), confirmButtonText: 'OK' });
    } finally {
      setBusy(null);
    }
  };

  const enterOtp = async () => {
    setBusy('otp');
    setOtpError(null);
    try {
      await api.driverOtp(tripId, driverOtp);
      setDriverOtp('');
      await reload();
      Swal.fire({ icon: 'success', title: 'Truck received', text: `${plural(truck.orderCount, 'order')} moved to Delivery Planning.`, showConfirmButton: false, timer: 1800 });
    } catch (e) {
      setOtpError(errorMessage(e, 'Could not verify the OTP.'));
    } finally {
      setBusy(null);
    }
  };

  const banner =
    truck.state === 'SCHEDULED' || truck.state === 'ON_THE_WAY' ? (
      <div className="lb-otp-panel">
        <i className="fas fa-truck-moving fs-3 text-primary" aria-hidden="true" />
        <div className="lb-otp-text">
          <strong>{truck.state === 'SCHEDULED' ? 'Not left the yard yet' : `Collecting from distributors (${truck.pickupsDone} of ${truck.pickups})`}</strong>
          The GRN opens when the truck reaches the store with every distributor’s goods.
        </div>
      </div>
    ) : truck.state === 'AT_STORE' ? (
      <div className="lb-otp-panel">
        <i className="fas fa-clipboard-list fs-3 text-primary" aria-hidden="true" />
        <div className="lb-otp-text">
          <strong>Count the goods on the truck</strong>
          Check every product in the Product view, note anything short or damaged, then confirm the GRN. The OTP for the driver appears only after that.
        </div>
      </div>
    ) : truck.state === 'GRN_DONE' ? (
      <div className="lb-otp-panel">
        <span className="lb-otp-code" aria-label="Handover OTP">{truck.otp}</span>
        <div className="lb-otp-text">
          <strong>Give this OTP to {truck.driverName} ({truck.vehicleRegNo})</strong>
          The GRN is confirmed{truck.grn ? ` (${time(truck.grn.confirmedAt)})` : ''}. When the driver enters it in the driver app, this truck closes and its orders move to Delivery Planning.
        </div>
        <div className="d-flex flex-column gap-1">
          <span className="small text-muted">Driver app (simulated)</span>
          <div className="d-flex gap-2">
            <input className="form-control form-control-sm" style={{ width: 110 }} inputMode="numeric" maxLength={4} placeholder="OTP" value={driverOtp} onChange={(e) => { setDriverOtp(e.target.value.replace(/\D/g, '')); setOtpError(null); }} aria-label="OTP entered by the driver" />
            <button className="btn btn-sm btn-primary text-nowrap" disabled={driverOtp.length !== 4 || busy === 'otp'} onClick={enterOtp}>
              {busy === 'otp' ? <i className="fas fa-spinner fa-spin me-1" /> : <i className="fas fa-key me-1" />}
              Driver enters OTP
            </button>
          </div>
          {otpError && <span className="small text-danger">{otpError}</span>}
        </div>
      </div>
    ) : (
      <div className="lb-otp-panel done">
        <i className="fas fa-circle-check fs-3 text-success" aria-hidden="true" />
        <div className="lb-otp-text">
          <strong>Received {truck.receivedAt ? dateTime(truck.receivedAt) : ''}</strong>
          OTP {truck.otp} verified. {plural(truck.orderCount, 'order')} for {plural(truck.retailerCount, 'customer')} are in Delivery Planning.
        </div>
        <button className="btn btn-sm btn-outline-primary text-nowrap" onClick={() => navigate('/cross-dock/delivery-planning')}>
          <i className="fas fa-motorcycle me-1" /> Delivery Planning
        </button>
      </div>
    );

  const diffCell = (l: XdGrnLine) => {
    const d = l.received - l.expected;
    if (d < 0) return <span className="lb-diff-short">{d}</span>;
    if (d > 0) return <span className="lb-diff-extra">+{d}</span>;
    return <span className="lb-diff-ok">0</span>;
  };

  return (
    <LbTripDetails
      title={truck.tripNo}
      subtitle={`Provider: Qwipo CDS Service Centre · ${slotLabel(overview.settings, truck.slot)}`}
      onBack={() => navigate('/cross-dock/inward')}
      actions={<StatusPill label={st.label} tone={truck.state === 'RECEIVED' ? 'green' : truck.state === 'SCHEDULED' ? 'blue' : 'amber'} />}
      banner={
        <>
          <RefreshError error={error} />
          {banner}
        </>
      }
      initialTab={editable ? 'product' : 'summary'}
      tabs={[
        {
          key: 'summary',
          label: 'Summary',
          render: () => (
            <LbSummaryRow>
              <LbInfoCard
                cls="route-overview"
                title="Route Overview"
                rows={[
                  ['directions_car', 'Vehicle', `${truck.vehicleRegNo} · ${truck.vehicleModel}`],
                  ['person', 'Driver Name', truck.driverName],
                  ['phone', 'Contact Number', truck.driverPhone],
                  ['schedule', 'Round', slotLabel(overview.settings, truck.slot)],
                  ['play_circle_outline', 'Start Time', truck.startedAt ? dateTime(truck.startedAt) : 'N/A'],
                  ['vpn_key', 'Handover OTP', truck.otp ?? 'Shown after the GRN'],
                ]}
              />
              <LbInfoCard
                cls="trip-summary"
                title="GRN Summary"
                rows={[
                  ['receipt_long', 'Orders / Customers', `${truck.orderCount} / ${truck.retailerCount}`],
                  ['factory', 'Distributors', String(truck.distributors.length)],
                  ['inventory_2', 'Expected Units', String(expected)],
                  ['fact_check', 'Counted Units', truck.grn || editable ? String(counted) : 'Not counted'],
                  ['remove_circle_outline', 'Short / Damaged', truck.grn || editable ? `${short} / ${damaged}` : '-'],
                  ['monetization_on', 'Goods Value', rupees(truck.value)],
                  ['scale', 'Weight', kg(truck.weightKg)],
                ]}
              />
              <LbProgressCard
                title="Truck Route"
                stops={[
                  { name: 'Service Centre yard', address: 'Yard 3, IDA Balanagar', time: truck.startedAt ? `Left ${time(truck.startedAt)}` : 'Not left yet', status: truck.startedAt ? 'Left' : 'Planned', statusClass: 'none', otp: '-' },
                  ...truck.pickupStops.map((p) => ({ name: p.name, address: p.address, time: p.doneAt ? `Picked up ${time(p.doneAt)}` : 'Pending', status: p.done ? 'Picked up' : 'Pending', statusClass: p.done ? 'orderpickedup' : 'pending', otp: '••••' })),
                  { name: overview.store.name, address: overview.store.address, time: truck.receivedAt ? `Received ${time(truck.receivedAt)}` : 'Arriving', status: st.label, statusClass: truck.state === 'RECEIVED' ? 'delivered' : 'pending', otp: truck.otp ?? 'After GRN' },
                ]}
              />
            </LbSummaryRow>
          ),
        },
        {
          key: 'product',
          label: 'Product View (GRN)',
          render: () => (
            <>
              <div className="lb-grn-bar">
                <div>
                  <strong>{counted}</strong> of {expected} units counted · {notMatching.length ? <span className="lb-diff-short">{plural(notMatching.length, 'product')} not matching</span> : <span className="lb-diff-ok">everything matches</span>}
                  {extra > 0 && <span className="lb-diff-extra"> · {extra} extra</span>}
                  {(short > 0 || damaged > 0) && <span className="text-muted"> · {addCurrency(lossValue)} not collected</span>}
                </div>
                {editable ? (
                  <div className="d-flex gap-2 align-items-center flex-wrap">
                    <input className="form-control form-control-sm" style={{ width: 260 }} placeholder="Note (optional), e.g. 1 carton wet" value={note} onChange={(e) => setNote(e.target.value)} aria-label="GRN note" />
                    <button className="btn btn-sm btn-outline-secondary" onClick={() => setCounts({})}>Reset counts</button>
                    <button className="btn btn-sm btn-primary text-nowrap" disabled={busy === 'grn'} onClick={confirm}>
                      {busy === 'grn' ? <i className="fas fa-spinner fa-spin me-1" /> : <i className="fas fa-clipboard-check me-1" />}
                      Confirm GRN
                    </button>
                  </div>
                ) : truck.grn ? (
                  <span className="text-muted">Confirmed {dateTime(truck.grn.confirmedAt)}{truck.grn.note ? ` · ${truck.grn.note}` : ''}</span>
                ) : (
                  <span className="text-muted">Opens when the truck reaches the store</span>
                )}
              </div>
              <LbTable
                columns={[
                  { icon: 'fa-box', label: 'Product Name', align: 'start' },
                  { icon: 'fa-ruler', label: 'UOM' },
                  { icon: 'fa-barcode', label: 'UPC' },
                  { icon: 'fa-tag', label: 'MRP' },
                  { icon: 'fa-layer-group', label: 'Expected (PCS)' },
                  { icon: 'fa-clipboard-check', label: 'Received' },
                  { icon: 'fa-heart-crack', label: 'Damaged' },
                  { icon: 'fa-not-equal', label: 'Difference' },
                  { icon: 'fa-rupee-sign', label: 'Amount' },
                ]}
                rows={lines.map((l) => [
                  l.name,
                  l.uom,
                  l.caseSize,
                  addCurrency(l.mrp),
                  l.expected,
                  editable ? (
                    <input className="form-control form-control-sm lb-qty-input mx-auto" inputMode="numeric" value={counts[l.sku]?.received ?? String(l.expected)} onChange={(e) => setCount(l.sku, 'received', e.target.value)} aria-label={`Received: ${l.name}`} />
                  ) : (
                    l.received
                  ),
                  editable ? (
                    <input className="form-control form-control-sm lb-qty-input mx-auto" inputMode="numeric" value={counts[l.sku]?.damaged ?? '0'} onChange={(e) => setCount(l.sku, 'damaged', e.target.value)} aria-label={`Damaged: ${l.name}`} />
                  ) : (
                    l.damaged || '-'
                  ),
                  editable || truck.grn ? diffCell(l) : '-',
                  addCurrency(l.expected * l.price),
                ])}
                footer={['', '', '', 'Total:', expected, counted, damaged || '-', short || extra ? <span className={short ? 'lb-diff-short' : 'lb-diff-extra'}>{counted - expected}</span> : '0', addCurrency(lines.reduce((s, l) => s + l.expected * l.price, 0))]}
                empty="No products on this truck"
              />
            </>
          ),
        },
        {
          key: 'customer',
          label: 'Customer View',
          render: () => (
            <LbTable
              columns={[
                { icon: 'fa-hashtag', label: 'No.' },
                { icon: 'fa-store', label: 'Customer Business Name', align: 'start' },
                { icon: 'fa-map-marker-alt', label: 'Area', align: 'start' },
                { icon: 'fa-industry', label: 'From Distributors', align: 'start' },
                { icon: 'fa-shopping-cart', label: 'Orders' },
                { icon: 'fa-weight', label: 'Weight' },
                { icon: 'fa-rupee-sign', label: 'Amount' },
              ]}
              rows={view.customers.map((c, i) => [i + 1, c.retailerName, c.locality, c.distributors.map((d) => <span key={d} className="lb-chip">{d}</span>), c.orders, kg(c.weightKg), addCurrency(c.amount)])}
              footer={['', 'Total:', '', '', view.customers.reduce((s, c) => s + c.orders, 0), kg(view.customers.reduce((s, c) => s + c.weightKg, 0)), addCurrency(view.customers.reduce((s, c) => s + c.amount, 0))]}
              empty="No customers on this truck"
            />
          ),
        },
        {
          key: 'orders',
          label: 'Orders',
          render: () => (
            <LbTable
              columns={[
                { icon: 'fa-hashtag', label: 'Order', align: 'start' },
                { icon: 'fa-store', label: 'Customer', align: 'start' },
                { icon: 'fa-industry', label: 'Distributor', align: 'start' },
                { icon: 'fa-cubes', label: 'Units' },
                { icon: 'fa-rupee-sign', label: 'Value' },
                { icon: 'fa-info-circle', label: 'Status' },
              ]}
              rows={view.orders.map((o) => [
                <>
                  {o.orderNo}
                  <div className="text-muted" style={{ fontSize: 11 }}>{o.invoiceNo}</div>
                </>,
                o.retailerName,
                o.distributorName,
                o.quantity,
                addCurrency(o.value),
                <>
                  <StatusPill {...STORE_STATUS[o.status]} />
                  {o.discrepancy && <div className="small text-danger mt-1">{o.discrepancy.note}</div>}
                </>,
              ])}
              empty="No orders on this truck"
            />
          ),
        },
      ]}
    />
  );
}
