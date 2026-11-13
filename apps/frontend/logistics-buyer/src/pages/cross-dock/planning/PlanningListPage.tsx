// Route plans list in the LBNP Delivery Planning layout, for pickups / returns (Service Centre) and deliveries (store).
import { useState } from 'react';
import { useNavigate } from 'react-router';
import Swal from 'sweetalert2';
import { errorMessage } from '../../../api/services/crossDock.service';
import type { XdRoutePlanRow } from '../../../types/crossDock';
import { addWeight } from '../../../utils/pipes';
import { dateTime, day, plural } from '../../service-centre/labels';
import { LoadError, RefreshError } from '../../service-centre/ScUi';
import { useLoad } from '../../service-centre/useLoad';
import { useStoreApi } from '../../cross-dock-store/useStoreApi';
import { LbPlanningList, type LbPlanSection } from '../lbnp/LbPlanning';
import { MODE, planApi, resourceLabel, type PlanMode } from './planMode';

const SLOT: Record<string, string> = { R1: 'Round 1', R2: 'Round 2', EARLY_AM: 'Early AM', RETURNS: 'Returns', DELIVERY: 'Delivery' };

export default function PlanningListPage({ mode }: { mode: PlanMode }) {
  const m = MODE[mode];
  const navigate = useNavigate();
  const store = useStoreApi();
  const api = planApi(mode, store);
  const { data, loading, error, reload } = useLoad(() => api.list(), [mode, store]);
  const [busy, setBusy] = useState<string | null>(null);
  const plans = data ?? [];

  const generate = async (p: XdRoutePlanRow) => {
    setBusy(p.id);
    try {
      const res = await api.generate(p.id);
      await reload();
      const r = await Swal.fire({
        icon: 'success',
        title: 'Trip Created',
        text: `${p.routeId} → ${res.plan.tripNo} with ${resourceLabel(p)}.`,
        showCancelButton: true,
        confirmButtonText: 'View Trip',
        cancelButtonText: 'Stay here',
      });
      if (r.isConfirmed) navigate(`${m.tripsBase}/${res.tripId}`);
    } catch (e) {
      Swal.fire({ icon: 'error', title: 'Could not generate the trip', text: errorMessage(e), confirmButtonText: 'OK' });
    } finally {
      setBusy(null);
    }
  };

  const cancel = async (p: XdRoutePlanRow) => {
    const r = await Swal.fire({ icon: 'warning', title: `Cancel ${p.routeId}?`, text: `Its ${plural(p.orderCount || p.returnCount, m.unit)} go back to planning.`, showCancelButton: true, confirmButtonText: 'Cancel route', cancelButtonText: 'Keep', confirmButtonColor: '#dc2626' });
    if (!r.isConfirmed) return;
    setBusy(p.id);
    try {
      await api.cancel(p.id);
      await reload();
    } catch (e) {
      Swal.fire({ icon: 'error', title: 'Could not cancel', text: errorMessage(e), confirmButtonText: 'OK' });
    } finally {
      setBusy(null);
    }
  };

  if (error && !data) return <div className="sc-page"><LoadError message={error} onRetry={reload} /></div>;

  const headers: LbPlanSection['headers'] =
    mode === 'delivery'
      ? [
          { icon: 'fa-calendar', label: 'Created Date' },
          { icon: 'fa-hashtag', label: 'Route ID' },
          { icon: 'fa-map-marker-alt', label: 'Drop Points', align: 'center' },
          { icon: 'fa-calendar-check', label: 'Delivery Date', align: 'center' },
          { icon: 'fa-motorcycle', label: 'Rider' },
          { icon: 'fa-weight-hanging', label: 'Orders / Weight', align: 'right' },
          { icon: 'fa-cogs', label: 'Actions', align: 'center' },
        ]
      : [
          { icon: 'fa-calendar', label: 'Created Date' },
          { icon: 'fa-hashtag', label: 'Route ID' },
          { icon: 'fa-industry', label: mode === 'pickup' ? 'Pickup Points' : 'Collect From', align: 'center' },
          { icon: 'fa-map-marker-alt', label: mode === 'pickup' ? 'Drop Points' : 'Hand Back To', align: 'center' },
          { icon: 'fa-calendar-check', label: mode === 'pickup' ? 'Round' : 'Day', align: 'center' },
          { icon: 'fa-truck', label: 'Vehicle' },
          { icon: 'fa-weight-hanging', label: 'Weight / Capacity', align: 'right' },
          { icon: 'fa-cogs', label: 'Actions', align: 'center' },
        ];

  const row = (p: XdRoutePlanRow) => {
    const view = (
      <button className="btn btn-sm text-primary" title="View route" onClick={() => navigate(`${m.base}/${p.id}`)}>
        <i className="fas fa-eye" />
      </button>
    );
    const actions =
      p.status === 'CREATED' ? (
        <div className="d-flex align-items-center justify-content-center gap-2">
          {view}
          <button className="btn btn-sm btn-outline-success text-nowrap" disabled={busy === p.id} onClick={() => generate(p)}>
            {busy === p.id ? <i className="fas fa-spinner fa-spin me-1" /> : <i className="fas fa-play me-1" />} Generate Trip
          </button>
          <button className="btn btn-sm text-danger" title="Cancel route" disabled={busy === p.id} onClick={() => cancel(p)}>
            <i className="fas fa-times" />
          </button>
        </div>
      ) : p.status === 'TRIP_CREATED' ? (
        <div className="d-flex align-items-center justify-content-center gap-2">
          {view}
          <span className="status-trip-created" role="link" tabIndex={0} style={{ cursor: 'pointer' }} onClick={() => navigate(`${m.tripsBase}/${p.tripId}`)}>
            <i className="fas fa-check-circle me-1" />
            {p.tripNo ?? 'Trip Created'}
          </span>
        </div>
      ) : (
        <span className="text-muted">Cancelled</span>
      );
    const cells =
      mode === 'delivery'
        ? [dateTime(p.createdAt), p.routeId, `${p.dropPoints} points`, day(p.date), resourceLabel(p), `${p.orderCount} / ${addWeight(p.weightKg)}`, actions]
        : [
            dateTime(p.createdAt),
            p.routeId,
            p.pickupPoints,
            p.dropPoints,
            mode === 'pickup' ? SLOT[p.slot] : day(p.date),
            resourceLabel(p),
            `${addWeight(p.weightKg)} / ${p.capacityKg ?? '-'} kg`,
            actions,
          ];
    return { key: p.id, cells, muted: p.status !== 'CREATED' };
  };

  const planned = plans.filter((p) => p.status === 'CREATED');
  const done = plans.filter((p) => p.status !== 'CREATED');

  return (
    <LbPlanningList
      icon={mode === 'delivery' ? 'fa-motorcycle' : mode === 'pickup' ? 'fa-route' : 'fa-rotate-left'}
      title={m.title}
      subtitle={m.subtitle}
      createLabel={m.createTitle}
      onCreate={() => navigate(`${m.base}/create`)}
      loading={loading}
      notice={<RefreshError error={data ? error : null} />}
      sections={[
        { kind: 'self-fleet', icon: mode === 'delivery' ? 'fa-motorcycle' : 'fa-truck', title: m.planned.title, sub: m.planned.sub, headers, rows: planned.map(row), empty: `No routes waiting. Use “${m.createTitle}”.` },
        { kind: 'rfq', icon: 'fa-check-double', title: m.done.title, sub: m.done.sub, headers, rows: done.map(row), empty: 'No trips created yet' },
      ]}
    />
  );
}
