// DigiDukaan · Buyer — Customers. The outlet database for the sales team:
// who each customer is, which beat and BA cover it, which distributors it can
// discover, KYC state, and whether it is ordering. Counts are as of the range
// end; orders and value are inside the range. Opens pre-filtered to a BA when
// arriving from BA performance (#buyer-customers/ba=<name>).
import { useMemo, useState } from 'react';
import { BellRing, Download, Phone } from 'lucide-react';
import { Badge, Button, Card, type BadgeProps } from '@mockups/ui';
import { HBars } from '@mockups/components';
import { makeTh, type Sort } from '../components/tableSort';
import { Panel } from '../components/dashboard';
import { BuyerScopeBar, ClearBtn, Drawer, DrawerSection, EmptyRow, FilterSelect, Pager, SearchBox, SectionHead, Stat, useFlash } from '../components/buyerKit';
import { ago, buyerChips, dmy, dmyTime, downloadCsv, fileTag, inr, lakh, num, pctOf, rangeText, sortBy } from '../components/buyerFormat';
import {
  bas, buyerDistributors, customerStatus, leads, ordersByCustomer, scopedCustomers, scopedOrders, stateCode,
  type BuyerCustomer, type BuyerScope, type CustomerStatus, type Kyc, type OrderStatus,
} from '../data/buyer';
import { addRun } from '../data/reports';
import { useBuyerScope } from '../scope';

const kycBadge: Record<Kyc, NonNullable<BadgeProps['variant']>> = { Verified: 'success', Pending: 'warning', Rejected: 'danger' };
const statusBadge: Record<CustomerStatus, NonNullable<BadgeProps['variant']>> = { Active: 'success', Dormant: 'warning', 'Never ordered': 'neutral' };
const orderBadge: Record<OrderStatus, NonNullable<BadgeProps['variant']>> = { Active: 'info', 'In Transit': 'warning', Delivered: 'success', Cancelled: 'danger' };

type Row = {
  c: BuyerCustomer; name: string; id: string; area: string; ba: string; beat: string; distributor: string;
  discoverable: number; kyc: Kyc; onboarded: Date; isNew: boolean; last?: Date; status: CustomerStatus;
  orders: number; value: number;
};
type Key = 'name' | 'area' | 'ba' | 'distributor' | 'discoverable' | 'kyc' | 'onboarded' | 'last' | 'status' | 'orders' | 'value';
type Tile = null | 'Active' | 'Dormant' | 'Never ordered' | 'new' | 'kyc';

export default function BuyerCustomers({ drill }: { drill?: string }) {
  const { s: scope } = useBuyerScope();
  const [toast, flash] = useFlash();
  const initialBa = drill?.startsWith('ba=') ? decodeURIComponent(drill.slice(3)) : 'All';
  const [q, setQ] = useState('');
  const [ba, setBa] = useState(initialBa);
  const [lead, setLead] = useState('All');
  const [beat, setBeat] = useState('All');
  const [kyc, setKyc] = useState('All');
  const [tile, setTile] = useState<Tile>(null);
  const [sort, setSort] = useState<Sort<Key>>({ k: 'value', dir: -1 });
  const [page, setPage] = useState(0);
  const [open, setOpen] = useState<Row | null>(null);
  const th = makeTh(sort, (fn) => { setSort(fn); setPage(0); }, (k) => (['name', 'area', 'ba', 'distributor', 'kyc', 'status'].includes(k) ? 1 : -1));

  const base = useMemo(() => {
    const orders = scopedOrders(scope);
    const start = new Date(scope.from.getFullYear(), scope.from.getMonth(), scope.from.getDate());
    const agg = new Map<string, { n: number; v: number }>();
    for (const o of orders) {
      const a = agg.get(o.customerId) ?? { n: 0, v: 0 };
      a.n++; a.v += o.value;
      agg.set(o.customerId, a);
    }
    return scopedCustomers(scope).map((c): Row => {
      const st = customerStatus(c, scope.to);
      const a = agg.get(c.id);
      return {
        c, name: c.name, id: c.id, area: `${c.locality}, ${c.city}`, ba: c.ba, beat: c.beat, distributor: c.distributor,
        discoverable: c.discoverable.length, kyc: c.kyc, onboarded: c.onboarded,
        isNew: c.onboarded >= start && c.onboarded <= scope.to,
        last: st.last, status: st.status, orders: a?.n ?? 0, value: a?.v ?? 0,
      };
    }).filter((r) => r.onboarded <= scope.to);
  }, [scope]);

  // Everything but the tile, so tile counts respond to BA / team / KYC filters.
  const pre = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return base.filter((r) =>
      (ba === 'All' || r.ba === ba) && (lead === 'All' || r.c.lead === lead) && (beat === 'All' || r.beat === beat)
      && (kyc === 'All' || r.kyc === kyc)
      && (!needle || `${r.name} ${r.id} ${r.c.mobile} ${r.c.owner} ${r.area} ${r.c.pincode} ${r.ba} ${r.distributor}`.toLowerCase().includes(needle)));
  }, [base, q, ba, lead, beat, kyc]);

  const k = useMemo(() => ({
    total: pre.length,
    active: pre.filter((r) => r.status === 'Active').length,
    dormant: pre.filter((r) => r.status === 'Dormant').length,
    never: pre.filter((r) => r.status === 'Never ordered').length,
    isNew: pre.filter((r) => r.isNew).length,
    kyc: pre.filter((r) => r.kyc === 'Pending').length,
    ordering: pre.filter((r) => r.orders > 0).length,
    value: pre.reduce((a, r) => a + r.value, 0),
  }), [pre]);

  const rows = useMemo(() => sortBy(pre.filter((r) =>
    tile === null || (tile === 'new' ? r.isNew : tile === 'kyc' ? r.kyc === 'Pending' : r.status === tile)), sort.k, sort.dir),
  [pre, tile, sort]);

  const toggle = (t: Tile) => { setTile(tile === t ? null : t); setPage(0); };
  const baOptions = bas.filter((b) => (lead === 'All' || b.lead === lead) && base.some((r) => r.ba === b.name)).map((b) => b.name);
  const beatOptions = ba === 'All' ? [] : bas.find((b) => b.name === ba)?.beats.map((b) => b.name) ?? [];
  const filtered = q || ba !== 'All' || lead !== 'All' || beat !== 'All' || kyc !== 'All' || tile !== null;

  const PER = 12;
  const shown = rows.slice(page * PER, page * PER + PER);

  const doExport = () => {
    downloadCsv(`customers_${fileTag(scope)}${ba !== 'All' ? `_${ba.replace(/ /g, '-')}` : ''}.csv`,
      ['Customer Name', 'Customer ID', 'Owner', 'Mobile', 'Locality', 'City', 'State', 'Pincode', 'Beat', 'Beat Days', 'BA', 'BA Mobile', 'Team Lead', 'Mapped Distributor', 'Discoverable Distributors', 'KYC', 'KYC Note', 'Onboarded', 'Last Order', 'Status', 'Orders (range)', 'Value (range)'],
      rows.map((r) => [r.name, r.id, r.c.owner, r.c.mobile, r.c.locality, r.c.city, r.c.state, r.c.pincode, r.beat, r.c.beatDays, r.ba, r.c.baMobile, r.c.lead, r.distributor, r.c.discoverable.join(' | '), r.kyc, r.c.kycNote ?? '', dmy(r.onboarded), r.last ? dmy(r.last) : '', r.status, r.orders, Math.round(r.value)]));
    addRun('buyer-customer-db', buyerChips(scope, [
      ...(ba !== 'All' ? [{ label: 'BA', value: ba }] : []), ...(kyc !== 'All' ? [{ label: 'KYC', value: kyc }] : []),
      ...(tile ? [{ label: 'Status', value: tile === 'new' ? 'New' : tile === 'kyc' ? 'KYC pending' : tile }] : []),
    ]));
    flash(`${rows.length} customers exported · also saved in Reports › DigiDukaan · Buyer`);
  };

  // Panels: where customers are, and what's blocking KYC.
  const byCity = useMemo(() => {
    const m = new Map<string, { n: number; active: number; state: string }>();
    for (const r of pre) {
      const e = m.get(r.c.city) ?? { n: 0, active: 0, state: r.c.state };
      e.n++; if (r.status === 'Active') e.active++;
      m.set(r.c.city, e);
    }
    return [...m.entries()].sort((a, b) => b[1].n - a[1].n).slice(0, 7);
  }, [pre]);
  const kycReasons = useMemo(() => {
    const m = new Map<string, number>();
    for (const r of pre) if (r.kyc === 'Pending') m.set(r.c.kycNote!, (m.get(r.c.kycNote!) ?? 0) + 1);
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  }, [pre]);

  return (
    <div className="flex flex-col gap-5">
      {toast}
      {open && <CustomerDrawer row={open} scope={scope} onClose={() => setOpen(null)} flash={flash} />}

      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="type-body text-foreground-secondary">Every outlet on the buyer app — who covers it, where it can order from, and whether it is ordering.</p>
          <p className="type-caption mt-0.5 text-foreground-tertiary">Status as of {dmy(scope.to)} · Active = ordered in the last 30 days · orders and value within the range</p>
        </div>
        <Button size="sm" onClick={doExport}><Download size={14} /> Export</Button>
      </div>

      <BuyerScopeBar />

      <div className="grid grid-cols-6 gap-3">
        <Stat label="Customers" value={num(k.total)} note={<>{lakh(k.value)} ordered in range</>} active={tile === null && !filtered} onClick={() => { setTile(null); setPage(0); }} />
        <Stat label="Active" value={num(k.active)} note={`${pctOf(k.active, k.total)} ordered in last 30 days`} tone="success" active={tile === 'Active'} onClick={() => toggle('Active')} />
        <Stat label="New onboarded" value={num(k.isNew)} note="joined within the range" active={tile === 'new'} onClick={() => toggle('new')} />
        <Stat label="KYC pending" value={num(k.kyc)} note="can order COD only" tone="warning" active={tile === 'kyc'} onClick={() => toggle('kyc')} />
        <Stat label="Dormant" value={num(k.dormant)} note="no order in 30+ days" tone="warning" active={tile === 'Dormant'} onClick={() => toggle('Dormant')} />
        <Stat label="Never ordered" value={num(k.never)} note="onboarded, no first order" tone="error" active={tile === 'Never ordered'} onClick={() => toggle('Never ordered')} />
      </div>

      <div className="grid grid-cols-12 gap-4">
        <Panel className="col-span-7" title="Where customers are" subtitle="Top cities · bar = customers · active share alongside">
          <HBars
            wideLabel
            rows={byCity.map(([city, e]) => ({
              label: `${city} · ${stateCode[e.state]}`, n: e.n, value: `${Math.round((e.active / e.n) * 100)}% active`,
              barClass: e.active / e.n >= 0.6 ? 'bg-chart-blue' : 'bg-warning',
            }))}
          />
        </Panel>
        <Panel className="col-span-5" title="What's blocking KYC" subtitle={`${k.kyc} pending · the BA completes these on the next visit`}>
          {kycReasons.length ? (
            <HBars rows={kycReasons.map(([reason, n]) => ({ label: reason, n, value: pctOf(n, k.kyc), barClass: 'bg-warning' }))} wideLabel
              onRow={() => toggle('kyc')} />
          ) : <p className="type-caption text-foreground-secondary">No KYC pending in this scope.</p>}
        </Panel>
      </div>

      <Card className="flex flex-col">
        <SectionHead title="Customer database" sub={`${num(rows.length)} customers · ${rangeText(scope)} · click a customer for details`} onExport={doExport} />
        <div className="flex flex-wrap items-center gap-2 border-b border-border-subtle px-5 py-3">
          <SearchBox value={q} onChange={(v) => { setQ(v); setPage(0); }} placeholder="Search name, ID, mobile, pincode" />
          <FilterSelect label="Team" value={lead} onChange={(v) => { setLead(v); setBa('All'); setBeat('All'); setPage(0); }} options={leads} />
          <FilterSelect label="BA" value={ba} onChange={(v) => { setBa(v); setBeat('All'); setPage(0); }} options={baOptions} />
          {ba !== 'All' && <FilterSelect label="Beat" value={beat} onChange={(v) => { setBeat(v); setPage(0); }} options={beatOptions} />}
          <FilterSelect label="KYC" value={kyc} onChange={(v) => { setKyc(v); setPage(0); }} options={['Verified', 'Pending', 'Rejected']} />
          <FilterSelect label="Status" value={tile === 'Active' || tile === 'Dormant' || tile === 'Never ordered' ? tile : 'All'}
            onChange={(v) => { setTile(v === 'All' ? null : (v as Tile)); setPage(0); }} options={['Active', 'Dormant', 'Never ordered']} />
          {filtered && <ClearBtn onClick={() => { setQ(''); setBa('All'); setLead('All'); setBeat('All'); setKyc('All'); setTile(null); setPage(0); }} />}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1400px] border-collapse">
            <thead>
              <tr className="type-micro text-left text-foreground-tertiary [&>th:first-child]:pl-5 [&>th]:whitespace-nowrap">
                {th('name', 'Customer')}
                <th className="py-2 pr-3 font-semibold">Customer ID</th>
                <th className="py-2 pr-3 font-semibold">Mobile</th>
                {th('area', 'Area [Geo]')}
                <th className="py-2 pr-3 font-semibold">Beat</th>
                {th('ba', 'BA')}
                {th('distributor', 'Mapped distributor')}
                {th('discoverable', 'Discoverable', true)}
                {th('kyc', 'KYC')}
                {th('onboarded', 'Onboarded')}
                {th('last', 'Last order')}
                {th('orders', 'Orders', true)}
                {th('value', 'Value', true)}
                {th('status', 'Status')}
              </tr>
            </thead>
            <tbody className="type-caption">
              {shown.map((r) => (
                <tr key={r.id} className="cursor-pointer border-t border-border-subtle hover:bg-muted" onClick={() => setOpen(r)}>
                  <td className="whitespace-nowrap py-2.5 pl-5 pr-3">
                    <span className="type-label block">{r.name}</span>
                    <span className="block text-foreground-tertiary">{r.c.owner}</span>
                  </td>
                  <td className="whitespace-nowrap py-2.5 pr-3 tabular-nums text-foreground-secondary">{r.id}</td>
                  <td className="whitespace-nowrap py-2.5 pr-3 tabular-nums text-foreground-secondary">{r.c.mobile}</td>
                  <td className="whitespace-nowrap py-2.5 pr-3 text-foreground-secondary">{r.area}, {stateCode[r.c.state]}<span className="block text-foreground-tertiary">{r.c.pincode}</span></td>
                  <td className="whitespace-nowrap py-2.5 pr-3">{r.beat}<span className="block text-foreground-tertiary">{r.c.beatDays}</span></td>
                  <td className="whitespace-nowrap py-2.5 pr-3">{r.ba}</td>
                  <td className="whitespace-nowrap py-2.5 pr-3">{r.distributor}</td>
                  <td className="py-2.5 pr-3 text-right" title={r.c.discoverable.join('\n')}>
                    <span className="rounded-md border border-info-border bg-info-subtle px-1.5 py-px font-medium tabular-nums text-info-foreground">{r.discoverable}</span>
                  </td>
                  <td className="py-2.5 pr-3"><Badge variant={kycBadge[r.kyc]}>{r.kyc}</Badge></td>
                  <td className="whitespace-nowrap py-2.5 pr-3 tabular-nums text-foreground-secondary">
                    {dmy(r.onboarded)}{r.isNew && <Badge variant="accent" className="ml-1.5">New</Badge>}
                  </td>
                  <td className="whitespace-nowrap py-2.5 pr-3 text-foreground-secondary">{r.last ? ago(r.last) : '—'}</td>
                  <td className="py-2.5 pr-3 text-right tabular-nums">{num(r.orders)}</td>
                  <td className="py-2.5 pr-3 text-right tabular-nums">{inr(r.value)}</td>
                  <td className="py-2.5 pr-5"><Badge variant={statusBadge[r.status]}>{r.status}</Badge></td>
                </tr>
              ))}
              {shown.length === 0 && <EmptyRow cols={14} text="No customers match these filters" />}
            </tbody>
          </table>
        </div>
        <Pager page={page} per={PER} total={rows.length} unit="customers" onPage={setPage} />
      </Card>
    </div>
  );
}

/* ------------------------------ customer drawer ----------------------------- */

function CustomerDrawer({ row, scope, onClose, flash }: { row: Row; scope: BuyerScope; onClose: () => void; flash: (m: string) => void }) {
  const c = row.c;
  const history = ordersByCustomer.get(c.id) ?? [];
  const inRange = scopedOrders(scope).filter((o) => o.customerId === c.id);
  const recent = [...history].reverse().slice(0, 8);
  const lifetime = history.reduce((a, o) => a + o.value, 0);
  const fact = (l: string, v: React.ReactNode) => (
    <div key={l} className="flex justify-between gap-3 py-1">
      <span className="type-caption text-foreground-secondary">{l}</span>
      <span className="type-caption text-right font-medium">{v}</span>
    </div>
  );

  return (
    <Drawer
      title={c.name}
      sub={<>{c.id} · {c.owner} · <span className="tabular-nums">{c.mobile}</span></>}
      onClose={onClose}
      footer={<>
        <Button fullWidth size="sm" variant="secondary" onClick={() => flash(`Reminder sent to ${c.ba} to visit ${c.name}`)}>
          <BellRing size={14} /> Nudge BA
        </Button>
        {c.kyc === 'Pending' && (
          <Button fullWidth size="sm" onClick={() => flash(`KYC reminder sent to ${c.owner} on WhatsApp`)}>Send KYC reminder</Button>
        )}
      </>}
    >
      <div className="flex flex-wrap gap-1.5 border-b border-border-subtle px-5 py-3">
        <Badge variant={statusBadge[row.status]}>{row.status}</Badge>
        <Badge variant={kycBadge[c.kyc]}>KYC {c.kyc}</Badge>
        {row.isNew && <Badge variant="accent">New</Badge>}
      </div>

      <div className="grid grid-cols-3 gap-px border-b border-border-subtle bg-border-subtle">
        {[
          ['In range', inr(row.value), `${row.orders} orders`],
          ['Lifetime', lakh(lifetime), `${history.length} orders since ${dmy(c.onboarded)}`],
          ['Last order', row.last ? ago(row.last) : '—', row.last ? dmy(row.last) : 'never ordered'],
        ].map(([l, v, n]) => (
          <div key={l} className="bg-card px-5 py-3">
            <div className="type-caption text-foreground-secondary">{l}</div>
            <div className="type-h2 tabular-nums">{v}</div>
            <div className="type-caption text-foreground-tertiary">{n}</div>
          </div>
        ))}
      </div>

      <DrawerSection title="Profile">
        {fact('Address', `${c.locality}, ${c.city}, ${c.state} · ${c.pincode}`)}
        {fact('Beat', `${c.beat} · ${c.beatDays}`)}
        {fact('Onboarded', dmy(c.onboarded))}
        {fact('KYC', c.kyc === 'Verified' ? 'Verified' : <span className={c.kyc === 'Pending' ? 'text-warning-foreground' : 'text-error-foreground'}>{c.kyc} — {c.kycNote}</span>)}
      </DrawerSection>

      <DrawerSection title="Salesperson">
        <div className="flex items-center gap-3">
          <span className="type-caption grid h-9 w-9 place-items-center rounded-full bg-primary-soft font-semibold text-primary-soft-foreground">
            {c.ba.split(' ').map((w) => w[0]).join('')}
          </span>
          <span className="flex-1 leading-tight">
            <span className="type-label block">{c.ba}</span>
            <span className="type-caption block text-foreground-secondary">Team {c.lead}</span>
          </span>
          <a href={`tel:${c.baMobile.replace(/ /g, '')}`} className="type-caption flex items-center gap-1 font-medium tabular-nums text-link"><Phone size={12} /> {c.baMobile}</a>
        </div>
      </DrawerSection>

      <DrawerSection title={`Discoverable distributors · ${c.discoverable.length}`} right={<span className="type-caption text-foreground-tertiary">orders in range</span>}>
        {c.discoverable.map((name) => {
          const d = buyerDistributors.find((x) => x.name === name)!;
          const n = inRange.filter((o) => o.distributor === name).length;
          return (
            <div key={name} className="flex items-center gap-2 border-t border-border-subtle py-2 first:border-t-0">
              <span className="min-w-0 flex-1 leading-tight">
                <span className="type-label block">{name}</span>
                <span className="type-caption block text-foreground-secondary">{d.locality}, {d.city}{d.lastActive && ' · stopped taking orders'}</span>
              </span>
              {name === c.distributor && <Badge variant="info">Mapped</Badge>}
              {d.lastActive && <Badge variant="neutral">Inactive</Badge>}
              <span className="type-caption w-10 text-right tabular-nums">{n}</span>
            </div>
          );
        })}
      </DrawerSection>

      <DrawerSection title="Recent orders">
        {recent.length ? recent.map((o) => (
          <div key={o.id} className="flex items-center gap-2 border-t border-border-subtle py-2 first:border-t-0">
            <span className="min-w-0 flex-1 leading-tight">
              <span className="type-label block tabular-nums">{o.id}</span>
              <span className="type-caption block text-foreground-secondary">{dmyTime(o.at)} · {o.distributor} · {o.beat ? 'Beat' : 'Non-Beat'}</span>
            </span>
            <Badge variant={orderBadge[o.status]}>{o.cancelledBy ? `Cancelled · ${o.cancelledBy}` : o.status}</Badge>
            <span className="type-caption w-16 text-right tabular-nums">{inr(o.value)}</span>
          </div>
        )) : <p className="type-caption text-foreground-secondary">No orders yet — onboarded {dmy(c.onboarded)}.</p>}
      </DrawerSection>
    </Drawer>
  );
}
