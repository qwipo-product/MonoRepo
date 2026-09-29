// DigiDukaan · Buyer — Sales Dashboard, for the sales team.
// Scoped by the buyer scope bar (dd-mm-yyyy range + State / City /
// Distributor), shared with BA performance and Customers. Cards, Distributors
// and Orders all aggregate the same order ledger, so they stay consistent.
import { useMemo, useRef, useState } from 'react';
import { Download } from 'lucide-react';
import { Badge, Button, Card, cn, type BadgeProps } from '@mockups/ui';
import { makeTh, type Sort } from '../components/tableSort';
import { BuyerScopeBar, ClearBtn, EmptyRow, FilterSelect, Pager, SearchBox, SectionHead, useFlash } from '../components/buyerKit';
import { buyerChips, dmy, dmyTime, downloadCsv, fileTag, inr, lakh, num, pctOf, rangeText, sortBy } from '../components/buyerFormat';
import { distributorsIn, scopedOrders, stateCode, type BuyerOrder, type BuyerScope, type OrderStatus, type CancelSource } from '../data/buyer';
import { addRun } from '../data/reports';
import { useBuyerScope } from '../scope';

const statusBadge: Record<OrderStatus, NonNullable<BadgeProps['variant']>> = {
  Active: 'info', 'In Transit': 'warning', Delivered: 'success', Cancelled: 'danger',
};
const srcShort: Record<CancelSource, string> = { BA: 'BA', Distributor: 'Dist', Retailer: 'Ret' };

type BeatF = 'All' | 'Beat' | 'Non-Beat';
const byBeat = (o: BuyerOrder, b: BeatF) => b === 'All' || (b === 'Beat') === o.beat;
type StatusF = 'All' | OrderStatus | `Cancelled by ${CancelSource}`;
const byStatus = (o: BuyerOrder, st: StatusF) =>
  st === 'All' || (st.startsWith('Cancelled by ') ? o.cancelledBy === st.slice(13) : o.status === st);

export default function BuyerSales() {
  const { s: scope } = useBuyerScope();
  const [toast, flash] = useFlash();
  const ordersRef = useRef<HTMLDivElement>(null);
  const [orderStatus, setOrderStatus] = useState<StatusF>('All');

  const inRange = useMemo(() => scopedOrders(scope), [scope]);
  const dists = useMemo(
    () => distributorsIn(scope).filter((d) => scope.distributor === 'All' || d.name === scope.distributor),
    [scope],
  );

  const s = useMemo(() => {
    const count = (fn: (o: BuyerOrder) => boolean) => inRange.filter(fn).length;
    const activeDists = new Set(inRange.map((o) => o.distributor));
    const active = dists.filter((d) => activeDists.has(d.name)).length;
    return {
      total: inRange.length,
      value: inRange.reduce((a, o) => a + o.value, 0),
      beat: count((o) => o.beat),
      nonBeat: count((o) => !o.beat),
      delivered: count((o) => o.status === 'Delivered'),
      cancelled: count((o) => o.status === 'Cancelled'),
      transit: count((o) => o.status === 'In Transit'),
      active: count((o) => o.status === 'Active'),
      cBA: count((o) => o.cancelledBy === 'BA'),
      cDist: count((o) => o.cancelledBy === 'Distributor'),
      cRet: count((o) => o.cancelledBy === 'Retailer'),
      dists: dists.length,
      activeDists: active,
      inactiveDists: dists.length - active,
    };
  }, [inRange, dists]);

  const pct = (n: number) => pctOf(n, s.total);

  const showOrders = (st: StatusF) => {
    setOrderStatus(st);
    ordersRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const exportSummary = () => {
    downloadCsv(`sales_summary_${fileTag(scope)}.csv`, ['Metric', 'Value'], [
      ['Date range', rangeText(scope)], ['State', scope.state], ['City', scope.city], ['Distributor', scope.distributor],
      ['Total Orders', s.total], ['Total Value', Math.round(s.value)],
      ['Beat Orders', s.beat], ['Non-Beat Orders', s.nonBeat],
      ['Active', s.active], ['In Transit', s.transit], ['Delivered', s.delivered], ['Cancelled', s.cancelled],
      ['Cancelled by BA', s.cBA], ['Cancelled by Distributor', s.cDist], ['Cancelled by Retailer', s.cRet],
      ['Total Distributors', s.dists], ['Active Distributors', s.activeDists], ['Inactive Distributors', s.inactiveDists],
    ]);
    addRun('buyer-sales-summary', buyerChips(scope));
    flash('Summary exported · also saved in Reports › DigiDukaan · Buyer');
  };

  return (
    <div className="flex flex-col gap-5">
      {toast}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="type-body text-foreground-secondary">Orders, distributors and cancellations at a glance.</p>
          <p className="type-caption mt-0.5 text-foreground-tertiary">Source: DigiDukaan buyer app · customer-wise, salesperson (BA)-wise</p>
        </div>
        <Button size="sm" onClick={exportSummary}><Download size={14} /> Export Summary</Button>
      </div>

      <BuyerScopeBar />

      <div className="grid grid-cols-4 gap-3">
        <SummaryCard title="Orders" headline={num(s.total)} sub={`${lakh(s.value)} order value`}
          rows={[
            { label: 'Beat', value: num(s.beat), hint: pct(s.beat) },
            { label: 'Non-Beat', value: num(s.nonBeat), hint: pct(s.nonBeat) },
          ]}
          onRow={() => showOrders('All')}
        />
        <SummaryCard title="Order status" headline={num(s.delivered)} sub={`delivered · ${pct(s.delivered)}`}
          rows={[
            { label: 'Active', value: num(s.active), dot: 'bg-info', onClick: () => showOrders('Active') },
            { label: 'In Transit', value: num(s.transit), dot: 'bg-warning', onClick: () => showOrders('In Transit') },
            { label: 'Delivered', value: num(s.delivered), dot: 'bg-success', onClick: () => showOrders('Delivered') },
            { label: 'Cancelled', value: num(s.cancelled), dot: 'bg-error', onClick: () => showOrders('Cancelled') },
          ]}
        />
        <SummaryCard title="Cancellations" headline={num(s.cancelled)} sub={`cancelled · ${pct(s.cancelled)} of orders`} tone="error"
          rows={[
            { label: 'Cancelled by BA', value: num(s.cBA), onClick: () => showOrders('Cancelled by BA') },
            { label: 'Cancelled by Distributor', value: num(s.cDist), onClick: () => showOrders('Cancelled by Distributor') },
            { label: 'Cancelled by Retailer', value: num(s.cRet), onClick: () => showOrders('Cancelled by Retailer') },
          ]}
        />
        <SummaryCard title="Distributors" headline={num(s.dists)} sub="total onboarded in scope"
          rows={[
            { label: 'Active', value: num(s.activeDists), dot: 'bg-success' },
            { label: 'Inactive', value: num(s.inactiveDists), dot: 'bg-border-strong' },
          ]}
          foot="Active = at least one order in the selected range"
        />
      </div>

      <DistributorsSection orders={inRange} scope={scope} dists={dists} onExport={flash} />
      <div ref={ordersRef} className="scroll-mt-4">
        <OrdersSection orders={inRange} scope={scope} status={orderStatus} setStatus={setOrderStatus} onExport={flash} />
      </div>
    </div>
  );
}

/* ------------------------------- summary card ------------------------------ */

function SummaryCard({ title, headline, sub, rows, tone, foot, onRow }: {
  title: string; headline: string; sub: string; tone?: 'error'; foot?: string; onRow?: () => void;
  rows: { label: string; value: string; hint?: string; dot?: string; onClick?: () => void }[];
}) {
  return (
    <Card className={cn('flex flex-col px-4 py-3.5', tone === 'error' && 'border-l-[3px] border-l-error')}>
      <div className="type-caption text-foreground-secondary">{title}</div>
      <div className="type-display my-0.5 tabular-nums tracking-tight">{headline}</div>
      <div className="type-caption text-foreground-secondary">{sub}</div>
      <div className="mt-3 flex flex-col border-t border-border-subtle pt-2">
        {rows.map((r) => {
          const click = r.onClick ?? onRow;
          return (
            <button
              key={r.label}
              type="button"
              onClick={click}
              disabled={!click}
              className="type-caption -mx-1.5 flex items-center gap-2 rounded-md px-1.5 py-1 text-left enabled:hover:bg-muted disabled:cursor-default"
            >
              {r.dot && <i className={cn('h-2 w-2 shrink-0 rounded-full', r.dot)} />}
              <span className="flex-1 text-foreground-secondary">{r.label}</span>
              {r.hint && <span className="tabular-nums text-foreground-tertiary">{r.hint}</span>}
              <b className="font-semibold tabular-nums text-foreground">{r.value}</b>
            </button>
          );
        })}
      </div>
      {foot && <div className="type-caption mt-auto pt-2 text-foreground-tertiary">{foot}</div>}
    </Card>
  );
}

/* ------------------------------- distributors ------------------------------ */

type DistRow = {
  name: string; area: string; state: string; orders: number; value: number; beat: number; nonBeat: number;
  status: 'Active' | 'Inactive'; cancels: Record<CancelSource, number>; stamp?: Date;
};
type DistKey = 'name' | 'area' | 'state' | 'orders' | 'value' | 'beat' | 'nonBeat' | 'status' | 'stamp';

function DistributorsSection({ orders, scope, dists, onExport }: {
  orders: BuyerOrder[]; scope: BuyerScope; dists: ReturnType<typeof distributorsIn>; onExport: (m: string) => void;
}) {
  const [q, setQ] = useState('');
  const [dist, setDist] = useState('All');
  const [beat, setBeat] = useState<BeatF>('All');
  const [status, setStatus] = useState<'All' | 'Active' | 'Inactive'>('All');
  const [sort, setSort] = useState<Sort<DistKey>>({ k: 'value', dir: -1 });
  const [page, setPage] = useState(0);
  const th = makeTh(sort, (fn) => { setSort(fn); setPage(0); }, (k) => (k === 'name' || k === 'area' || k === 'state' ? 1 : -1));

  const rows = useMemo(() => {
    const all: DistRow[] = dists.map((d) => {
      const mine = orders.filter((o) => o.distributor === d.name);
      const shown = mine.filter((o) => byBeat(o, beat));
      const last = mine.reduce<Date | undefined>((a, o) => (!a || o.at > a ? o.at : a), undefined);
      return {
        name: d.name, area: `${d.locality}, ${d.city}`, state: d.state,
        orders: shown.length,
        value: shown.reduce((a, o) => a + o.value, 0),
        beat: mine.filter((o) => o.beat).length,
        nonBeat: mine.filter((o) => !o.beat).length,
        status: mine.length ? 'Active' : 'Inactive',
        cancels: {
          BA: shown.filter((o) => o.cancelledBy === 'BA').length,
          Distributor: shown.filter((o) => o.cancelledBy === 'Distributor').length,
          Retailer: shown.filter((o) => o.cancelledBy === 'Retailer').length,
        },
        stamp: last,
      };
    });
    const needle = q.trim().toLowerCase();
    return sortBy(
      all.filter((r) => (dist === 'All' || r.name === dist) && (status === 'All' || r.status === status))
        .filter((r) => !needle || `${r.name} ${r.area} ${r.state}`.toLowerCase().includes(needle)),
      sort.k, sort.dir,
    );
  }, [orders, dists, q, dist, beat, status, sort]);

  const PER = 8;
  const shown = rows.slice(page * PER, page * PER + PER);
  const filtered = q || dist !== 'All' || beat !== 'All' || status !== 'All';

  const doExport = () => {
    downloadCsv(`distributors_${fileTag(scope)}.csv`,
      ['Dist Name', 'Area', 'State', 'Total Orders', 'Total Value', 'Beat', 'Non Beat', 'Status', 'Cancelled by BA', 'Cancelled by Distributor', 'Cancelled by Retailer', 'Time Stamp'],
      rows.map((r) => [r.name, r.area, r.state, r.orders, Math.round(r.value), r.beat, r.nonBeat, r.status, r.cancels.BA, r.cancels.Distributor, r.cancels.Retailer, r.stamp ? dmyTime(r.stamp) : '']));
    addRun('buyer-distributors', buyerChips(scope, filtered ? [{ value: 'Filtered view' }] : []));
    onExport(`${rows.length} distributors exported · also saved in Reports › DigiDukaan · Buyer`);
  };

  return (
    <Card className="flex flex-col">
      <SectionHead title="Distributors" sub={`${rows.length} of ${dists.length} distributors · ${rangeText(scope)}`} onExport={doExport} />
      <div className="flex flex-wrap items-center gap-2 border-b border-border-subtle px-5 py-3">
        <SearchBox value={q} onChange={(v) => { setQ(v); setPage(0); }} placeholder="Search distributor or area" />
        <FilterSelect label="Distributor" value={dist} onChange={(v) => { setDist(v); setPage(0); }} options={dists.map((d) => d.name)} />
        <FilterSelect label="Beat" value={beat} onChange={(v) => { setBeat(v as BeatF); setPage(0); }} options={['Beat', 'Non-Beat']} />
        <FilterSelect label="Status" value={status} onChange={(v) => { setStatus(v as typeof status); setPage(0); }} options={['Active', 'Inactive']} />
        {filtered && <ClearBtn onClick={() => { setQ(''); setDist('All'); setBeat('All'); setStatus('All'); setPage(0); }} />}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1100px] border-collapse">
          <thead>
            <tr className="type-micro text-left text-foreground-tertiary [&>th:first-child]:pl-5 [&>th]:whitespace-nowrap">
              {th('name', 'Dist Name')}
              {th('area', 'Area')}
              {th('state', 'State')}
              {th('orders', 'Total Orders', true)}
              {th('value', 'Total Value', true)}
              {th('beat', 'Beat', true)}
              {th('nonBeat', 'Non Beat', true)}
              {th('status', 'Status')}
              <th className="py-2 pr-3 font-semibold">Cancelled By</th>
              {th('stamp', 'Time Stamp')}
            </tr>
          </thead>
          <tbody className="type-caption">
            {shown.map((r) => (
              <tr key={r.name} className="border-t border-border-subtle">
                <td className="whitespace-nowrap py-2.5 pl-5 pr-3 font-medium">{r.name}</td>
                <td className="whitespace-nowrap py-2.5 pr-3 text-foreground-secondary">{r.area}</td>
                <td className="py-2.5 pr-3 text-foreground-secondary">{r.state}</td>
                <td className="py-2.5 pr-3 text-right tabular-nums">{num(r.orders)}</td>
                <td className="py-2.5 pr-3 text-right tabular-nums">{inr(r.value)}</td>
                <td className={cn('py-2.5 pr-3 text-right tabular-nums', beat === 'Non-Beat' && 'text-foreground-tertiary')}>{num(r.beat)}</td>
                <td className={cn('py-2.5 pr-3 text-right tabular-nums', beat === 'Beat' && 'text-foreground-tertiary')}>{num(r.nonBeat)}</td>
                <td className="py-2.5 pr-3"><Badge variant={r.status === 'Active' ? 'success' : 'neutral'}>{r.status}</Badge></td>
                <td className="py-2.5 pr-3"><CancelChips c={r.cancels} /></td>
                <td className="whitespace-nowrap py-2.5 pr-5 tabular-nums text-foreground-secondary">{r.stamp ? dmyTime(r.stamp) : '—'}</td>
              </tr>
            ))}
            {shown.length === 0 && <EmptyRow cols={10} text="No distributors match these filters" />}
          </tbody>
        </table>
      </div>
      <Pager page={page} per={PER} total={rows.length} unit="distributors" onPage={setPage} />
    </Card>
  );
}

function CancelChips({ c }: { c: Record<CancelSource, number> }) {
  const parts = (Object.keys(c) as CancelSource[]).filter((k) => c[k] > 0);
  if (!parts.length) return <span className="text-foreground-tertiary">—</span>;
  return (
    <span className="flex flex-wrap gap-1">
      {parts.map((k) => (
        <span key={k} className="whitespace-nowrap rounded-md border border-error-border bg-error-subtle px-1.5 py-px font-medium tabular-nums text-error-foreground" title={`Cancelled by ${k}`}>
          {srcShort[k]} {c[k]}
        </span>
      ))}
    </span>
  );
}

/* ------------------------------ customer orders ---------------------------- */

type CustRow = {
  customerId: string; customer: string; mobile: string; distributor: string; ba: string; baMobile: string;
  area: string; orders: number; value: number; last: Date; beat: number; nonBeat: number;
};
type CustKey = 'customer' | 'distributor' | 'ba' | 'area' | 'orders' | 'value' | 'last' | 'beat' | 'nonBeat';

function OrdersSection({ orders, scope, status, setStatus, onExport }: {
  orders: BuyerOrder[]; scope: BuyerScope; status: StatusF; setStatus: (s: StatusF) => void; onExport: (m: string) => void;
}) {
  const [q, setQ] = useState('');
  const [cust, setCust] = useState('All');
  const [dist, setDist] = useState('All');
  const [ba, setBa] = useState('All');
  const [beat, setBeat] = useState<BeatF>('All');
  const [sort, setSort] = useState<Sort<CustKey>>({ k: 'value', dir: -1 });
  const [page, setPage] = useState(0);
  const th = makeTh(sort, (fn) => { setSort(fn); setPage(0); }, (k) => (k === 'customer' || k === 'distributor' || k === 'ba' || k === 'area' ? 1 : -1));
  const reset = <T,>(set: (v: T) => void) => (v: T) => { set(v); setPage(0); };

  const options = useMemo(() => {
    const uniq = (f: (o: BuyerOrder) => string) => [...new Set(orders.map(f))].sort();
    return { customers: uniq((o) => o.customer), distributors: uniq((o) => o.distributor), bas: uniq((o) => o.ba) };
  }, [orders]);

  const { rows, orderCount } = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const matched = orders.filter((o) =>
      (cust === 'All' || o.customer === cust) && (dist === 'All' || o.distributor === dist) && (ba === 'All' || o.ba === ba)
      && byBeat(o, beat) && byStatus(o, status)
      && (!needle || `${o.customer} ${o.customerId} ${o.mobile} ${o.distributor} ${o.ba} ${o.locality} ${o.city}`.toLowerCase().includes(needle)));
    const map = new Map<string, CustRow>();
    for (const o of matched) {
      const r = map.get(o.customerId) ?? {
        customerId: o.customerId, customer: o.customer, mobile: o.mobile, distributor: o.distributor,
        ba: o.ba, baMobile: o.baMobile, area: `${o.locality}, ${o.city}, ${stateCode[o.state]}`,
        orders: 0, value: 0, last: o.at, beat: 0, nonBeat: 0,
      };
      r.orders++; r.value += o.value;
      if (o.at > r.last) r.last = o.at;
      if (o.beat) r.beat++; else r.nonBeat++;
      map.set(o.customerId, r);
    }
    return { rows: sortBy([...map.values()], sort.k, sort.dir), orderCount: matched.length };
  }, [orders, q, cust, dist, ba, beat, status, sort]);

  const PER = 10;
  const shown = rows.slice(page * PER, page * PER + PER);
  const filtered = q || cust !== 'All' || dist !== 'All' || ba !== 'All' || beat !== 'All' || status !== 'All';

  const doExport = () => {
    downloadCsv(`customer_orders_${fileTag(scope)}.csv`,
      ['Customer Name', 'Customer ID', 'Mobile Number', 'Distributor Name', 'BA Name', 'BA Mobile Number', 'Area [Geo]', 'Total Orders', 'Total Value', 'Ordered Date', 'Beat', 'Non Beat'],
      rows.map((r) => [r.customer, r.customerId, r.mobile, r.distributor, r.ba, r.baMobile, r.area, r.orders, Math.round(r.value), dmy(r.last), r.beat, r.nonBeat]));
    addRun('buyer-customer-orders', buyerChips(scope, [...(status !== 'All' ? [{ label: 'Status', value: status }] : []), ...(ba !== 'All' ? [{ label: 'BA', value: ba }] : [])]));
    onExport(`${rows.length} customers exported · also saved in Reports › DigiDukaan · Buyer`);
  };

  return (
    <Card className="flex flex-col">
      <SectionHead
        title="Orders"
        sub={`${num(rows.length)} customers · ${num(orderCount)} orders · ${rangeText(scope)} · one row per customer`}
        onExport={doExport}
      />
      <div className="flex flex-wrap items-center gap-2 border-b border-border-subtle px-5 py-3">
        <SearchBox value={q} onChange={reset(setQ)} placeholder="Search customer, ID, mobile, BA" />
        <FilterSelect label="Customer" value={cust} onChange={reset(setCust)} options={options.customers} />
        <FilterSelect label="Distributor" value={dist} onChange={reset(setDist)} options={options.distributors} />
        <FilterSelect label="BA" value={ba} onChange={reset(setBa)} options={options.bas} />
        <FilterSelect label="Beat" value={beat} onChange={(v) => reset(setBeat)(v as BeatF)} options={['Beat', 'Non-Beat']} />
        <FilterSelect
          label="Status" value={status} onChange={(v) => reset(setStatus)(v as StatusF)}
          options={['Active', 'In Transit', 'Delivered', 'Cancelled', 'Cancelled by BA', 'Cancelled by Distributor', 'Cancelled by Retailer']}
        />
        {filtered && <ClearBtn onClick={() => { setQ(''); setCust('All'); setDist('All'); setBa('All'); setBeat('All'); setStatus('All'); setPage(0); }} />}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1360px] border-collapse">
          <thead>
            <tr className="type-micro text-left text-foreground-tertiary [&>th:first-child]:pl-5 [&>th]:whitespace-nowrap">
              {th('customer', 'Customer Name')}
              <th className="py-2 pr-3 font-semibold">Customer ID</th>
              <th className="py-2 pr-3 font-semibold">Mobile Number</th>
              {th('distributor', 'Distributor Name')}
              {th('ba', 'BA Name')}
              <th className="py-2 pr-3 font-semibold">BA Mobile</th>
              {th('area', 'Area [Geo]')}
              {th('orders', 'Total Orders', true)}
              {th('value', 'Total Value', true)}
              {th('last', 'Ordered Date')}
              {th('beat', 'Beat', true)}
              {th('nonBeat', 'Non Beat', true)}
            </tr>
          </thead>
          <tbody className="type-caption">
            {shown.map((r) => (
              <tr key={r.customerId} className="border-t border-border-subtle">
                <td className="whitespace-nowrap py-2.5 pl-5 pr-3 font-medium">{r.customer}</td>
                <td className="whitespace-nowrap py-2.5 pr-3 tabular-nums text-foreground-secondary">{r.customerId}</td>
                <td className="whitespace-nowrap py-2.5 pr-3 tabular-nums text-foreground-secondary">{r.mobile}</td>
                <td className="whitespace-nowrap py-2.5 pr-3">{r.distributor}</td>
                <td className="whitespace-nowrap py-2.5 pr-3">{r.ba}</td>
                <td className="whitespace-nowrap py-2.5 pr-3 tabular-nums text-foreground-secondary">{r.baMobile}</td>
                <td className="whitespace-nowrap py-2.5 pr-3 text-foreground-secondary">{r.area}</td>
                <td className="py-2.5 pr-3 text-right tabular-nums">{num(r.orders)}</td>
                <td className="py-2.5 pr-3 text-right tabular-nums">{inr(r.value)}</td>
                <td className="whitespace-nowrap py-2.5 pr-3 tabular-nums text-foreground-secondary" title="Latest order in range">{dmy(r.last)}</td>
                <td className="py-2.5 pr-3 text-right tabular-nums">{num(r.beat)}</td>
                <td className="py-2.5 pr-5 text-right tabular-nums">{num(r.nonBeat)}</td>
              </tr>
            ))}
            {shown.length === 0 && <EmptyRow cols={12} text="No orders match these filters" />}
          </tbody>
        </table>
      </div>
      <Pager page={page} per={PER} total={rows.length} unit="customers" onPage={setPage} />
      {status !== 'All' && (
        <div className="type-caption flex items-center gap-2 border-t border-border-subtle px-5 py-2 text-foreground-secondary">
          Counting only <Badge variant={statusBadge[status.startsWith('Cancelled') ? 'Cancelled' : (status as OrderStatus)]}>{status}</Badge> orders
        </div>
      )}
    </Card>
  );
}
