// Cross Dock Store → Cash & Deposits: what riders collected (cash and UPI) and what the store sent on to Qwipo.
import { useState } from 'react';
import Swal from 'sweetalert2';
import DataLoading from '../../components/DataLoading';
import { errorMessage } from '../../api/services/crossDock.service';
import type { DepositMode } from '../../types/crossDock';
import { day, DEPOSIT_MODE, rupees, time } from '../service-centre/labels';
import { EmptyState, LoadError, PageHeader, StatCard, StatusPill } from '../service-centre/ScUi';
import { useLoad } from '../service-centre/useLoad';
import { localDay, useStoreApi } from './useStoreApi';

export default function CashPage() {
  const api = useStoreApi();
  const [date, setDate] = useState('');
  const { data, loading, error, reload } = useLoad(() => api.cash(date || undefined), [api, date]);
  const [amount, setAmount] = useState('');
  const [mode, setMode] = useState<DepositMode>('BANK_TRANSFER');
  const [reference, setReference] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  if (loading && !data) return <DataLoading message="Loading collections..." />;
  if (error && !data) return <div className="sc-page"><LoadError message={error} onRetry={reload} /></div>;
  if (!data) return null;
  const { days, day: d } = data;
  const isToday = d.date === days[0];
  const short = d.expected - (d.cash + d.upi);

  const deposit = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      await api.deposit({ date: d.date, amount: Number(amount), mode, reference });
      setAmount('');
      setReference('');
      await reload();
      Swal.fire({ icon: 'success', title: 'Deposit recorded', text: 'Qwipo matches it against this day’s collections.', showConfirmButton: false, timer: 1600 });
    } catch (e) {
      setSaveError(errorMessage(e, 'Could not record the deposit.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="sc-page">
      <PageHeader
        refreshError={error}
        icon="fa-wallet"
        title="Cash & Deposits"
        subtitle="What riders collected on delivery, and what the store has sent on to Qwipo. Qwipo settles with every party from these figures."
        actions={
          <>
            <select className="form-select form-select-sm w-auto" value={d.date} onChange={(e) => { setDate(e.target.value); setSaveError(null); }} aria-label="Day">
              {days.map((x, i) => (
                <option key={x} value={x}>{i === 0 ? `Today, ${day(x)}` : day(x)}</option>
              ))}
            </select>
            <button type="button" className="btn btn-sm btn-outline-secondary" onClick={reload} disabled={loading} aria-label="Refresh">
              <i className={`fas fa-rotate${loading ? ' fa-spin' : ''}`} />
            </button>
          </>
        }
      />

      <div className="sc-stats">
        <StatCard label="Collected" value={rupees(d.cash + d.upi)} sub={`Cash ${rupees(d.cash)} · UPI ${rupees(d.upi)}`} icon="fa-hand-holding-dollar" tone="green" />
        <StatCard label="Due on delivered orders" value={rupees(d.expected)} sub={short > 0 ? `${rupees(short)} not collected` : `${d.delivered} orders delivered`} icon="fa-file-invoice" tone={short > 0 ? 'red' : 'blue'} />
        <StatCard label="Deposited to Qwipo" value={rupees(d.deposited)} sub={`${d.deposits.length} deposit${d.deposits.length === 1 ? '' : 's'}`} icon="fa-building-columns" tone="indigo" />
        <StatCard label="To deposit" value={rupees(d.balance)} sub={d.balance > 0 ? 'Send it before the day closes' : 'All sent'} icon="fa-scale-balanced" tone={d.balance > 0 ? 'amber' : 'grey'} />
      </div>

      <div className="row g-3">
        <div className="col-xl-7 d-flex flex-column gap-3">
          <div className="sc-card">
            <div className="sc-card-head">
              <h2 className="sc-card-title">By rider</h2>
              <span className="text-muted small">Riders hand over cash when they get back</span>
            </div>
            {!d.byRider.length ? (
              <EmptyState icon="fa-motorcycle" title="Per-rider detail is kept for today" text="Earlier days show the store’s totals only in this demo." />
            ) : (
              <div className="table-responsive">
                <table className="sc-table">
                  <thead>
                    <tr>
                      <th>Rider</th>
                      <th className="num">Runs</th>
                      <th className="num">Delivered</th>
                      <th className="num">Cash</th>
                      <th className="num">UPI</th>
                      <th className="num">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {d.byRider.map((r) => (
                      <tr key={r.riderId}>
                        <td>
                          {r.riderName}
                          {r.open > 0 && <div><StatusPill label="Out now" tone="indigo" /></div>}
                        </td>
                        <td className="num">{r.runs}</td>
                        <td className="num">{r.delivered}</td>
                        <td className="num">{rupees(r.cash)}</td>
                        <td className="num">{rupees(r.upi)}</td>
                        <td className="num fw-semibold">{rupees(r.cash + r.upi)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="sc-card">
            <div className="sc-card-head">
              <h2 className="sc-card-title">Deposits for {day(d.date)}</h2>
            </div>
            {d.deposits.length === 0 ? (
              <EmptyState icon="fa-building-columns" title="No deposits yet" text="Record each transfer to Qwipo with its UTR or slip number." />
            ) : (
              <div className="table-responsive">
                <table className="sc-table">
                  <thead>
                    <tr>
                      <th>When</th>
                      <th>How</th>
                      <th>Reference</th>
                      <th className="num">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {d.deposits.map((x) => (
                      <tr key={x.id}>
                        <td className="nowrap">{localDay(x.at) === d.date ? time(x.at) : `${day(localDay(x.at))}, ${time(x.at)}`}</td>
                        <td>{DEPOSIT_MODE[x.mode]}</td>
                        <td className="nowrap">{x.reference}</td>
                        <td className="num">{rupees(x.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div className="col-xl-5">
          <section className="sc-card" aria-labelledby="dep-title">
            <div className="sc-card-head">
              <h2 className="sc-card-title" id="dep-title">Record a deposit</h2>
            </div>
            <div className="sc-card-body">
              {d.balance <= 0 ? (
                <EmptyState icon="fa-circle-check" title="Nothing to deposit for this day" />
              ) : (
                <>
                  <p className="small text-muted">
                    Send the day’s collection to Qwipo’s account by UPI or bank transfer. Cash can go into the store’s own account first and then be transferred.
                  </p>
                  <div className="mb-2">
                    <label className="form-label small" htmlFor="dep-amount">Amount (₹)</label>
                    <div className="input-group input-group-sm">
                      <input id="dep-amount" type="number" min={1} max={d.balance} className="form-control" value={amount} placeholder={String(d.balance)} onChange={(e) => { setAmount(e.target.value); setSaveError(null); }} />
                      <button type="button" className="btn btn-outline-secondary" onClick={() => setAmount(String(d.balance))}>Full {rupees(d.balance)}</button>
                    </div>
                  </div>
                  <div className="mb-2">
                    <label className="form-label small" htmlFor="dep-mode">How</label>
                    <select id="dep-mode" className="form-select form-select-sm" value={mode} onChange={(e) => setMode(e.target.value as DepositMode)}>
                      {(Object.keys(DEPOSIT_MODE) as DepositMode[]).map((m) => (
                        <option key={m} value={m}>{DEPOSIT_MODE[m]}</option>
                      ))}
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="form-label small" htmlFor="dep-ref">{mode === 'CASH_DEPOSIT' ? 'Deposit slip number' : 'UTR / UPI reference'}</label>
                    <input id="dep-ref" className="form-control form-control-sm" value={reference} onChange={(e) => { setReference(e.target.value); setSaveError(null); }} />
                  </div>
                  {saveError && <div className="alert alert-danger py-2 small" role="alert">{saveError}</div>}
                  <button type="button" className="btn btn-primary w-100" disabled={saving || !amount} onClick={deposit}>
                    {saving ? <i className="fas fa-spinner fa-spin me-1" /> : <i className="fas fa-building-columns me-1" />}
                    Record deposit
                  </button>
                  {isToday && d.byRider.some((r) => r.open > 0) && <div className="small text-muted mt-2">A rider is still out; their collection is added when the drops are recorded.</div>}
                </>
              )}
            </div>
          </section>
          <div className="alert alert-light border small mt-3">
            <strong>Phase 1 settlement.</strong> Qwipo, as the seller network participant, receives every rupee and pays the distributors, the Service Centre,
            this store, ONDC and other buyer apps offline from these figures. No invoices or payment screens yet.
          </div>
        </div>
      </div>
    </div>
  );
}
