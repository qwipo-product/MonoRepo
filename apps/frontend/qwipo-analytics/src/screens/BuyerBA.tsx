// DigiDukaan · Buyer — BA performance. Built for the sales lead's day:
// who is on target pace, who is covering their customers, who is working the
// beat, what happened today, and which customers each BA must call next.
// Scoped by the shared buyer scope bar; a Team filter narrows to one lead.
import { useMemo, useState } from 'react';
import { Download, Phone, Users } from 'lucide-react';
import { Badge, Button, Card, cn } from '@mockups/ui';
import { makeTh, type Sort } from '../components/tableSort';
import { BuyerScopeBar, ClearBtn, Drawer, DrawerSection, EmptyRow, FilterSelect, Pager, SearchBox, SectionHead, Stat, useFlash } from '../components/buyerKit';
import { ago, buyerChips, dmy, dmyTime, downloadCsv, fileTag, inr, lakh, num, pctOf, rangeText, sortBy } from '../components/buyerFormat';
import {
  TODAY, bas, customerStatus, launch, leads, scopedCustomers, scopedOrders,
  type BA, type BuyerCustomer, type BuyerOrder, type BuyerScope,
} from '../data/buyer';
import { addRun } from '../data/reports';
import { useBuyerScope } from '../scope';
import type { Page } from '../nav';

const DAY = 86400000;
const PACE_OK = 90;
const PACE_LOW = 70;

type Row = {
  ba: BA; name: string; lead: string; city: string; state: string;
  customers: number; ordering: number; coverage: number;
  orders: number; value: number; target: number; achievement: number; aov: number;
  beatShare: number; today: number; todayValue: number; cancelledByBA: number;
  newCustomers: number; kycPending: number; dormant: number; never: number; last?: Date;
};
type Key = 'name' | 'lead' | 'city' | 'customers' | 'coverage' | 'orders' | 'value' | 'achievement' | 'beatShare' | 'today' | 'cancelledByBA' | 'newCustomers' | 'kycPending' | 'dormant' | 'last';
type Focus = null | 'behind' | 'dormant' | 'kyc' | 'cancel' | 'silent';

/** Target for the selected range, prorated from the monthly target (from the state's launch at the earliest). */
const rangeTarget = (ba: BA, s: BuyerScope) => {
  const from = Math.max(s.from.getTime(), launch[ba.state].getTime());
  const days = Math.max(0, Math.round((s.to.getTime() - from) / DAY) + 1);
  return (ba.target * days) / 30;
};

function buildBaRows(scope: BuyerScope): Row[] {
  const orders = scopedOrders(scope);
  const customers = scopedCustomers(scope);
  const inScopeBAs = new Set(customers.map((c) => c.ba));
  const start = new Date(scope.from.getFullYear(), scope.from.getMonth(), scope.from.getDate());
  return bas.filter((b) => inScopeBAs.has(b.name)).map((ba) => {
    const mine = orders.filter((o) => o.ba === ba.name);
    const custs = customers.filter((c) => c.ba === ba.name);
    const ordering = new Set(mine.map((o) => o.customerId)).size;
    const value = mine.reduce((a, o) => a + o.value, 0);
    const target = rangeTarget(ba, scope);
    const todays = mine.filter((o) => o.at.toDateString() === TODAY.toDateString());
    const statuses = custs.map((c) => customerStatus(c, scope.to).status);
    return {
      ba, name: ba.name, lead: ba.lead, city: ba.city, state: ba.state,
      customers: custs.length, ordering, coverage: custs.length ? (ordering / custs.length) * 100 : 0,
      orders: mine.length, value, target, achievement: target ? (value / target) * 100 : 0,
      aov: mine.length ? value / mine.length : 0,
      beatShare: mine.length ? (mine.filter((o) => o.beat).length / mine.length) * 100 : 0,
      today: todays.length, todayValue: todays.reduce((a, o) => a + o.value, 0),
      cancelledByBA: mine.filter((o) => o.cancelledBy === 'BA').length,
      newCustomers: custs.filter((c) => c.onboarded >= start && c.onboarded <= scope.to).length,
      kycPending: custs.filter((c) => c.kyc === 'Pending').length,
      dormant: statuses.filter((x) => x === 'Dormant').length,
      never: statuses.filter((x) => x === 'Never ordered').length,
      last: mine.length ? mine.reduce((a, o) => (o.at > a ? o.at : a), mine[0].at) : undefined,
    };
  });
}

export default function BuyerBA({ go }: { go: (p: Page | string) => void }) {
  const { s: scope } = useBuyerScope();
  const [toast, flash] = useFlash();
  const [team, setTeam] = useState('All');
  const [focus, setFocus] = useState<Focus>(null);
  const [q, setQ] = useState('');
  const [city, setCity] = useState('All');
  const [sort, setSort] = useState<Sort<Key>>({ k: 'achievement', dir: -1 });
  const [page, setPage] = useState(0);
  const [open, setOpen] = useState<Row | null>(null);
  const th = makeTh(sort, (fn) => { setSort(fn); setPage(0); }, (k) => (k === 'name' || k === 'lead' || k === 'city' ? 1 : -1));

  const all = useMemo(() => buildBaRows(scope), [scope]);
  const teamRows = useMemo(() => all.filter((r) => team === 'All' || r.lead === team), [all, team]);

  const k = useMemo(() => {
    const sum = (f: (r: Row) => number) => teamRows.reduce((a, r) => a + f(r), 0);
    const value = sum((r) => r.value), target = sum((r) => r.target), orders = sum((r) => r.orders);
    const customers = sum((r) => r.customers), ordering = sum((r) => r.ordering);
    return {
      bas: teamRows.length, activeBAs: teamRows.filter((r) => r.orders > 0).length,
      value, target, orders, customers, ordering,
      beat: orders ? teamRows.reduce((a, r) => a + (r.beatShare / 100) * r.orders, 0) / orders * 100 : 0,
      today: sum((r) => r.today), todayValue: sum((r) => r.todayValue), todayBAs: teamRows.filter((r) => r.today > 0).length,
      behind: teamRows.filter((r) => r.achievement < PACE_LOW).length,
      dormant: sum((r) => r.dormant), kyc: sum((r) => r.kycPending), cancel: sum((r) => r.cancelledByBA),
      silent: teamRows.filter((r) => r.today === 0).length,
    };
  }, [teamRows]);

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const f = teamRows.filter((r) =>
      (city === 'All' || r.city === city)
      && (!needle || `${r.name} ${r.ba.mobile} ${r.city} ${r.lead}`.toLowerCase().includes(needle))
      && (focus === null
        || (focus === 'behind' && r.achievement < PACE_LOW)
        || (focus === 'dormant' && r.dormant > 0)
        || (focus === 'kyc' && r.kycPending > 0)
        || (focus === 'cancel' && r.cancelledByBA > 0)
        || (focus === 'silent' && r.today === 0)));
    return sortBy(f, sort.k, sort.dir);
  }, [teamRows, q, city, focus, sort]);

  const setFocusSorted = (f: Focus, key: Key, dir: 1 | -1) => {
    if (focus === f) { setFocus(null); return; }
    setFocus(f); setSort({ k: key, dir }); setPage(0);
  };

  const PER = 10;
  const shown = rows.slice(page * PER, page * PER + PER);
  const filtered = q || city !== 'All' || focus !== null;

  const doExport = () => {
    downloadCsv(`ba_performance_${fileTag(scope)}${team !== 'All' ? `_${team.replace(/ /g, '-')}` : ''}.csv`,
      ['BA Name', 'BA Mobile', 'Team Lead', 'City', 'State', 'Customers', 'Ordering Customers', 'Coverage %', 'Orders', 'Order Value', 'Target (range)', 'Achievement %', 'Avg Order Value', 'Beat Share %', 'Orders Today', 'Cancelled by BA', 'New Customers', 'KYC Pending', 'Dormant Customers', 'Never Ordered', 'Last Order'],
      rows.map((r) => [r.name, r.ba.mobile, r.lead, r.city, r.state, r.customers, r.ordering, r.coverage.toFixed(1), r.orders, Math.round(r.value), Math.round(r.target), r.achievement.toFixed(1), Math.round(r.aov), r.beatShare.toFixed(1), r.today, r.cancelledByBA, r.newCustomers, r.kycPending, r.dormant, r.never, r.last ? dmyTime(r.last) : '']));
    addRun('buyer-ba-performance', buyerChips(scope, team !== 'All' ? [{ label: 'Team', value: team }] : []));
    flash(`${rows.length} BAs exported · also saved in Reports › DigiDukaan · Buyer`);
  };

  const cities = [...new Set(teamRows.map((r) => r.city))];

  return (
    <div className="flex flex-col gap-5">
      {toast}
      {open && <BaDrawer row={open} scope={scope} onClose={() => setOpen(null)} go={go} flash={flash} />}

      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="type-body text-foreground-secondary">How every salesperson is tracking — target, coverage, beat discipline and today's orders.</p>
          <p className="type-caption mt-0.5 text-foreground-tertiary">Target is the BA's monthly target prorated to the selected range</p>
        </div>
        <Button size="sm" onClick={doExport}><Download size={14} /> Export</Button>
      </div>

      <BuyerScopeBar />

      {/* Team (sales lead) switch */}
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="type-caption mr-1 flex items-center gap-1.5 text-foreground-secondary"><Users size={14} /> Team</span>
        {['All', ...leads].map((l) => {
          const n = all.filter((r) => l === 'All' || r.lead === l).length;
          if (l !== 'All' && n === 0) return null;
          return (
            <button
              key={l}
              type="button"
              onClick={() => { setTeam(l); setPage(0); setCity('All'); }}
              className={cn(
                'type-caption h-8 rounded-full border px-3 font-medium',
                team === l ? 'border-primary bg-primary-soft text-primary-soft-foreground' : 'border-border text-foreground-secondary hover:bg-muted',
              )}
            >
              {l === 'All' ? 'All teams' : l} <span className="tabular-nums text-foreground-tertiary">{n}</span>
            </button>
          );
        })}
      </div>

      {/* Headline */}
      <div className="grid grid-cols-6 gap-3">
        <Stat label="Order value" value={lakh(k.value)} note={<>{pctOf(k.value, k.target)} of {lakh(k.target)} target</>}
          tone={k.value / (k.target || 1) * 100 >= PACE_OK ? 'success' : k.value / (k.target || 1) * 100 < PACE_LOW ? 'error' : 'warning'} />
        <Stat label="Orders" value={num(k.orders)} note={<>avg {inr(k.orders ? k.value / k.orders : 0)} per order</>} />
        <Stat label="BAs selling" value={`${k.activeBAs} / ${k.bas}`} note="placed ≥1 order in range" />
        <Stat label="Customer coverage" value={pctOf(k.ordering, k.customers)} note={<>{num(k.ordering)} of {num(k.customers)} customers ordered</>} />
        <Stat label="Beat orders" value={`${k.beat.toFixed(1)}%`} note="taken on a planned beat visit" />
        <Stat label={`Today · ${dmy(TODAY)}`} value={num(k.today)} note={<>{lakh(k.todayValue)} · {k.todayBAs} of {k.bas} BAs</>} />
      </div>

      {/* Attention — each one filters the table */}
      <div className="grid grid-cols-5 gap-3">
        <Stat label="Behind target pace" value={num(k.behind)} note={`BAs under ${PACE_LOW}% of target`} tone="error"
          active={focus === 'behind'} onClick={() => setFocusSorted('behind', 'achievement', 1)} />
        <Stat label="No order today" value={num(k.silent)} note="BAs yet to book today" tone="warning"
          active={focus === 'silent'} onClick={() => setFocusSorted('silent', 'achievement', 1)} />
        <Stat label="Customers to revive" value={num(k.dormant)} note="no order in 30+ days" tone="warning"
          active={focus === 'dormant'} onClick={() => setFocusSorted('dormant', 'dormant', -1)} />
        <Stat label="KYC pending" value={num(k.kyc)} note="customers the BA must complete" tone="warning"
          active={focus === 'kyc'} onClick={() => setFocusSorted('kyc', 'kycPending', -1)} />
        <Stat label="Cancelled by BA" value={num(k.cancel)} note="orders the BA cancelled" tone="error"
          active={focus === 'cancel'} onClick={() => setFocusSorted('cancel', 'cancelledByBA', -1)} />
      </div>

      <Card className="flex flex-col">
        <SectionHead
          title="Salesperson leaderboard"
          sub={`${rows.length} BAs · ${rangeText(scope)}${team !== 'All' ? ` · ${team}'s team` : ''} · click a BA for the call list`}
          onExport={doExport}
        />
        <div className="flex flex-wrap items-center gap-2 border-b border-border-subtle px-5 py-3">
          <SearchBox value={q} onChange={(v) => { setQ(v); setPage(0); }} placeholder="Search BA, mobile, city" />
          <FilterSelect label="City" value={city} onChange={(v) => { setCity(v); setPage(0); }} options={cities} />
          {focus && (
            <Badge variant="info" className="normal-case tracking-normal">
              {focus === 'behind' ? 'Behind target pace' : focus === 'silent' ? 'No order today' : focus === 'dormant' ? 'Has customers to revive' : focus === 'kyc' ? 'Has KYC pending' : 'Cancelled by BA'}
            </Badge>
          )}
          {filtered && <ClearBtn onClick={() => { setQ(''); setCity('All'); setFocus(null); setPage(0); }} />}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1320px] border-collapse">
            <thead>
              <tr className="type-micro text-left text-foreground-tertiary [&>th:first-child]:pl-5 [&>th]:whitespace-nowrap">
                {th('name', 'BA')}
                {th('lead', 'Team lead')}
                {th('city', 'City')}
                {th('customers', 'Customers', true)}
                {th('coverage', 'Coverage', true)}
                {th('orders', 'Orders', true)}
                {th('value', 'Value', true)}
                {th('achievement', 'Target achievement')}
                {th('beatShare', 'Beat %', true)}
                {th('today', 'Today', true)}
                {th('cancelledByBA', 'Canc. by BA', true)}
                {th('newCustomers', 'New', true)}
                {th('kycPending', 'KYC pend.', true)}
                {th('dormant', 'To revive', true)}
                {th('last', 'Last order')}
              </tr>
            </thead>
            <tbody className="type-caption">
              {shown.map((r) => (
                <tr key={r.name} className="cursor-pointer border-t border-border-subtle hover:bg-muted" onClick={() => setOpen(r)}>
                  <td className="whitespace-nowrap py-2.5 pl-5 pr-3">
                    <span className="type-label block">{r.name}</span>
                    <span className="block tabular-nums text-foreground-tertiary">{r.ba.mobile}</span>
                  </td>
                  <td className="whitespace-nowrap py-2.5 pr-3 text-foreground-secondary">{r.lead}</td>
                  <td className="whitespace-nowrap py-2.5 pr-3 text-foreground-secondary">{r.city}</td>
                  <td className="py-2.5 pr-3 text-right tabular-nums">{r.customers}</td>
                  <td className="py-2.5 pr-3 text-right tabular-nums">
                    {r.coverage.toFixed(0)}%
                    <span className="block text-foreground-tertiary">{r.ordering}/{r.customers}</span>
                  </td>
                  <td className="py-2.5 pr-3 text-right tabular-nums">{num(r.orders)}</td>
                  <td className="py-2.5 pr-3 text-right tabular-nums">{lakh(r.value)}</td>
                  <td className="py-2.5 pr-3"><Achievement pct={r.achievement} target={r.target} /></td>
                  <td className="py-2.5 pr-3 text-right tabular-nums">{r.beatShare.toFixed(0)}%</td>
                  <td className={cn('py-2.5 pr-3 text-right tabular-nums', r.today === 0 && 'text-warning-foreground')}>{r.today}</td>
                  <td className={cn('py-2.5 pr-3 text-right tabular-nums', r.cancelledByBA > 0 && 'text-error-foreground')}>{r.cancelledByBA}</td>
                  <td className="py-2.5 pr-3 text-right tabular-nums">{r.newCustomers}</td>
                  <td className={cn('py-2.5 pr-3 text-right tabular-nums', r.kycPending > 0 && 'text-warning-foreground')}>{r.kycPending}</td>
                  <td className={cn('py-2.5 pr-3 text-right tabular-nums', r.dormant > 0 && 'text-warning-foreground')}>{r.dormant}</td>
                  <td className="whitespace-nowrap py-2.5 pr-5 text-foreground-secondary">{ago(r.last)}</td>
                </tr>
              ))}
              {shown.length === 0 && <EmptyRow cols={15} text="No BAs match these filters" />}
            </tbody>
          </table>
        </div>
        <Pager page={page} per={PER} total={rows.length} unit="BAs" onPage={setPage} />
      </Card>
    </div>
  );
}

function Achievement({ pct, target }: { pct: number; target: number }) {
  const tone = pct >= PACE_OK ? 'bg-success' : pct >= PACE_LOW ? 'bg-warning' : 'bg-error';
  return (
    <span className="flex min-w-[150px] items-center gap-2">
      <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-background-sunken">
        <i className={cn('block h-full', tone)} style={{ width: `${Math.min(100, pct)}%` }} />
      </span>
      <span className="w-11 text-right font-semibold tabular-nums">{pct.toFixed(0)}%</span>
      <span className="sr-only">of {inr(target)}</span>
    </span>
  );
}

/* --------------------------------- BA drawer -------------------------------- */

function BaDrawer({ row, scope, onClose, go, flash }: {
  row: Row; scope: BuyerScope; onClose: () => void; go: (p: Page | string) => void; flash: (m: string) => void;
}) {
  const ba = row.ba;
  const orders = useMemo(() => scopedOrders(scope).filter((o) => o.ba === ba.name), [scope, ba.name]);
  const customers = useMemo(() => scopedCustomers(scope).filter((c) => c.ba === ba.name), [scope, ba.name]);
  const withStatus = customers.map((c) => ({ c, ...customerStatus(c, scope.to), value: valueOf(c, orders) }));
  const revive = withStatus.filter((x) => x.status === 'Dormant').sort((a, b) => (a.last!.getTime() - b.last!.getTime()));
  const never = withStatus.filter((x) => x.status === 'Never ordered');
  const kyc = customers.filter((c) => c.kyc === 'Pending');

  // Last 14 days ending at the range end.
  const days = Array.from({ length: 14 }, (_, i) => new Date(scope.to.getFullYear(), scope.to.getMonth(), scope.to.getDate() - 13 + i));
  const all = scopedOrders({ ...scope, from: days[0] }).filter((o) => o.ba === ba.name);
  const perDay = days.map((d) => all.filter((o) => o.at.toDateString() === d.toDateString()).reduce((a, o) => a + o.value, 0));
  const maxDay = Math.max(1, ...perDay);

  return (
    <Drawer
      width="w-[620px]"
      title={<>{ba.name} <span className="type-caption font-normal text-foreground-secondary">· BA</span></>}
      sub={<>{ba.city}, {ba.state} · Team {ba.lead} · <span className="tabular-nums">{ba.mobile}</span> · {rangeText(scope)}</>}
      onClose={onClose}
      footer={<>
        <Button fullWidth size="sm" onClick={() => go(`buyer-customers/ba=${encodeURIComponent(ba.name)}`)}>View {ba.name.split(' ')[0]}'s customers</Button>
        <Button variant="secondary" size="sm" onClick={() => {
          downloadCsv(`call_list_${ba.name.replace(/ /g, '-')}_${dmy(scope.to)}.csv`,
            ['Customer', 'Customer ID', 'Mobile', 'Beat', 'Reason', 'Last Order'],
            [...revive.map((x) => [x.c.name, x.c.id, x.c.mobile, x.c.beat, 'No order in 30+ days', x.last ? dmy(x.last) : '']),
              ...never.map((x) => [x.c.name, x.c.id, x.c.mobile, x.c.beat, 'Never ordered', '']),
              ...kyc.map((c) => [c.name, c.id, c.mobile, c.beat, `KYC pending — ${c.kycNote}`, ''])]);
          flash(`Call list for ${ba.name} downloaded`);
        }}><Download size={14} /> Call list</Button>
      </>}
    >
      <div className="grid grid-cols-3 gap-px border-b border-border-subtle bg-border-subtle">
        {[
          ['Order value', lakh(row.value), `${row.achievement.toFixed(0)}% of ${lakh(row.target)}`],
          ['Orders', num(row.orders), `avg ${inr(row.aov)}`],
          ['Coverage', `${row.coverage.toFixed(0)}%`, `${row.ordering} of ${row.customers} customers`],
          ['Beat orders', `${row.beatShare.toFixed(0)}%`, 'on planned visits'],
          ['Today', num(row.today), lakh(row.todayValue)],
          ['Cancelled by BA', num(row.cancelledByBA), `${pctOf(row.cancelledByBA, row.orders)} of orders`],
        ].map(([l, v, n]) => (
          <div key={l} className="bg-card px-5 py-3">
            <div className="type-caption text-foreground-secondary">{l}</div>
            <div className="type-h2 tabular-nums">{v}</div>
            <div className="type-caption text-foreground-tertiary">{n}</div>
          </div>
        ))}
      </div>

      <DrawerSection title="Daily order value · last 14 days" right={<span className="type-caption text-foreground-tertiary">to {dmy(scope.to)}</span>}>
        <div className="flex h-20 items-end gap-1">
          {perDay.map((v, i) => (
            <div key={i} className="flex flex-1 flex-col items-center gap-1" title={`${dmy(days[i])} · ${inr(v)}`}>
              <i className={cn('block w-full rounded-sm', v ? 'bg-chart-blue' : 'bg-background-sunken')} style={{ height: `${Math.max(4, (v / maxDay) * 64)}px` }} />
              <span className="type-micro normal-case tracking-normal text-foreground-tertiary">{days[i].getDate()}</span>
            </div>
          ))}
        </div>
      </DrawerSection>

      <DrawerSection title="Beats">
        <table className="w-full">
          <thead>
            <tr className="type-micro text-left text-foreground-tertiary">
              <th className="py-1 font-semibold">Beat</th><th className="py-1 font-semibold">Days</th>
              <th className="py-1 text-right font-semibold">Customers</th><th className="py-1 text-right font-semibold">Ordered</th>
              <th className="py-1 text-right font-semibold">Orders</th><th className="py-1 text-right font-semibold">Value</th>
            </tr>
          </thead>
          <tbody className="type-caption">
            {ba.beats.map((b) => {
              const cs = customers.filter((c) => c.beat === b.name);
              const os = orders.filter((o) => o.beatName === b.name);
              return (
                <tr key={b.name} className="border-t border-border-subtle">
                  <td className="py-1.5 font-medium">{b.name}</td>
                  <td className="py-1.5 text-foreground-secondary">{b.days}</td>
                  <td className="py-1.5 text-right tabular-nums">{cs.length}</td>
                  <td className="py-1.5 text-right tabular-nums">{new Set(os.map((o) => o.customerId)).size}</td>
                  <td className="py-1.5 text-right tabular-nums">{os.length}</td>
                  <td className="py-1.5 text-right tabular-nums">{lakh(os.reduce((a, o) => a + o.value, 0))}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </DrawerSection>

      <DrawerSection title={`Customers to revive · ${revive.length}`} right={<span className="type-caption text-foreground-tertiary">no order in 30+ days · oldest first</span>}>
        <CallList items={revive.map((x) => ({ c: x.c, note: `last order ${dmy(x.last!)} · ${ago(x.last)}` }))} empty="Every customer ordered in the last 30 days." />
      </DrawerSection>

      <DrawerSection title={`KYC pending · ${kyc.length}`}>
        <CallList items={kyc.map((c) => ({ c, note: c.kycNote!, tone: 'warning' as const }))} empty="No KYC pending." />
      </DrawerSection>

      <DrawerSection title={`Never ordered · ${never.length}`}>
        <CallList items={never.map((x) => ({ c: x.c, note: `onboarded ${dmy(x.c.onboarded)}` }))} empty="Every customer has ordered at least once." />
      </DrawerSection>
    </Drawer>
  );
}

const valueOf = (c: BuyerCustomer, orders: BuyerOrder[]) => orders.filter((o) => o.customerId === c.id).reduce((a, o) => a + o.value, 0);

function CallList({ items, empty }: { items: { c: BuyerCustomer; note: string; tone?: 'warning' }[]; empty: string }) {
  if (!items.length) return <p className="type-caption text-foreground-secondary">{empty}</p>;
  return (
    <div className="flex flex-col">
      {items.slice(0, 8).map(({ c, note, tone }) => (
        <div key={c.id} className="flex items-center gap-3 border-t border-border-subtle py-2 first:border-t-0">
          <span className="min-w-0 flex-1 leading-tight">
            <span className="type-label block truncate">{c.name}</span>
            <span className={cn('type-caption block', tone === 'warning' ? 'text-warning-foreground' : 'text-foreground-secondary')}>{c.beat} · {note}</span>
          </span>
          <a href={`tel:${c.mobile.replace(/ /g, '')}`} className="type-caption flex items-center gap-1 whitespace-nowrap font-medium tabular-nums text-link">
            <Phone size={12} /> {c.mobile}
          </a>
        </div>
      ))}
      {items.length > 8 && <p className="type-caption pt-1 text-foreground-tertiary">+ {items.length - 8} more in the call list download</p>}
    </div>
  );
}
