// Returns tab on the seller Orders page (CDS connector sellers).
//
// Simple cards, one per return, so the seller sees at a glance:
//   • Who is returning   — the retailer (name, phone) or the Cross Dock Store
//   • Why                — the reason + the kind of return in plain words
//   • Who brings it back — the delivery person (name, phone, vehicle)
//   • Where it is now    — Return raised · Coming back to you · Returned to you
//   • What comes back    — products and quantities (dropdown)
// Returns are raised and updated by the delivery app; the seller only views.

import { useMemo, useState, type ReactNode } from "react";
import { useNavigate } from "react-router";
import { ChevronDown, Package, Phone, User, Warehouse } from "lucide-react";
import { cn } from "@mockups/web-ui";
import { type DateRangeKey, fmtDate, fmtDayDateTime, fmtINR, goodQty, inRange, returnStage, type ReturnStageKey } from "../../lib/cds/calc";
import { OPERATOR_SELLER_ID } from "../../lib/cds/master-data";
import { cdsOrderDates } from "../../lib/cds/order-bridge";
import type { CdsOrder, CdsState, ReturnCase } from "../../lib/cds/types";
import { DateRangeSelect, Pager, SearchBox, useCdsScope, useTable } from "./cds-ui";
import { useCds } from "../../lib/cds/store";

const RETURN_TYPES: ReturnCase["type"][] = ["Retailer Return", "Delivery Failure (RTO)", "Receiving Discrepancy"];

/** The kind of return, in plain words. */
const KIND: Record<string, string> = {
  "Retailer Return": "Retailer returned after delivery",
  "Delivery Failure (RTO)": "Not delivered — retailer did not take the order",
  "Receiving Discrepancy": "Damaged or short at the Cross Dock Store",
};

type Filter = "all" | ReturnStageKey;
const FILTERS: { key: Filter; label: string; match: (r: ReturnCase) => boolean }[] = [
  { key: "all", label: "All", match: () => true },
  { key: "coming", label: "Coming back to you", match: (r) => returnStage(r).key === "coming" },
  { key: "back", label: "Returned to you", match: (r) => returnStage(r).key === "back" },
];

const STAGE_CLASS: Record<ReturnStageKey, string> = {
  raised: "border-amber-200 bg-amber-50 text-amber-800",
  coming: "border-blue-200 bg-blue-50 text-blue-800",
  back: "border-green-200 bg-green-50 text-green-800",
  settled: "border-green-200 bg-green-50 text-green-800",
};

const fmtPhone = (p: string) => (/^\d{10}$/.test(p) ? `+91 ${p.slice(0, 5)} ${p.slice(5)}` : p);

function sellerReturns(s: CdsState): ReturnCase[] {
  return s.returns.filter((r) => r.sellerId === OPERATOR_SELLER_ID && RETURN_TYPES.includes(r.type));
}

/** Number of returns for the tab label. */
export function useCdsReturnCount(): number {
  const s = useCds();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => sellerReturns(s).length, [s.rev]);
}

export function CdsReturnsTab({ keep }: { renderTable?: (orderIds: string[], statusNotes?: Map<string, ReactNode>) => ReactNode; keep?: (orderId: string) => boolean }) {
  const { s, retailerMap, cdsName } = useCdsScope();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<Filter>("all");
  const [range, setRange] = useState<DateRangeKey>("30d");
  const [q, setQ] = useState("");

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const all = useMemo(() => sellerReturns(s), [s.rev]);
  const needle = q.trim().toLowerCase();
  const base = all.filter(
    (r) =>
      (!keep || keep(r.orderId)) &&
      inRange(r.createdAt, range) &&
      (!needle ||
        [r.id, r.orderId, retailerMap.get(r.retailerId)?.name, r.reason, r.returnRider?.name, ...r.items.map((i) => i.name)].some((x) =>
          x?.toLowerCase().includes(needle),
        )),
  );
  const current = FILTERS.find((f) => f.key === filter)!;
  const rows = base.filter(current.match);
  const table = useTable(rows, { pageSize: 10, sort: { key: "at", dir: "desc" }, accessors: { at: (r) => r.createdAt } });

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-shrink-0 flex-wrap items-center gap-2 border-b px-6 py-3">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => {
              setFilter(f.key);
              table.setPage(1);
            }}
            className={cn(
              "rounded-full border px-3 py-1.5 text-sm transition-colors",
              filter === f.key ? "border-gray-900 bg-gray-900 text-white" : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50",
            )}
          >
            {f.label} ({base.filter(f.match).length})
          </button>
        ))}
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <SearchBox
            value={q}
            onChange={(v) => {
              setQ(v);
              table.setPage(1);
            }}
            placeholder="Retailer, order, product or reason"
          />
          <DateRangeSelect
            value={range}
            onChange={(v) => {
              setRange(v);
              table.setPage(1);
            }}
          />
        </div>
      </div>

      <div className="flex-1 space-y-4 overflow-auto bg-gray-50 px-6 py-4">
        {table.paged.length === 0 ? (
          <div className="rounded-lg border border-gray-200 bg-white p-8 text-center text-sm text-gray-600">No returns here.</div>
        ) : (
          table.paged.map((r) => (
            <ReturnCard
              key={r.id}
              r={r}
              order={s.orders.find((o) => o.id === r.orderId)}
              retailer={retailerMap.get(r.retailerId)}
              cdsName={cdsName(r.cdsId)}
              onOpenOrder={() => navigate(`/orders/${r.orderId}`)}
            />
          ))
        )}
      </div>
      <Pager table={table} label="return" />
    </div>
  );
}

/** One short fact: small label over its value. */
function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">{label}</p>
      <div className="mt-0.5 text-sm text-gray-900">{children}</div>
    </div>
  );
}

function ReturnCard({
  r,
  order,
  retailer,
  cdsName,
  onOpenOrder,
}: {
  r: ReturnCase;
  order?: CdsOrder;
  retailer?: { name: string; phone: string; area: string };
  cdsName: string;
  onOpenOrder: () => void;
}) {
  const stage = returnStage(r);
  const fromCds = r.type === "Receiving Discrepancy";
  const units = r.items.reduce((x, i) => x + i.qty, 0);
  const dates = order ? cdsOrderDates(order.id, order.placedAt) : undefined;
  const returned = new Map(r.items.map((i) => [i.sku, i]));
  // Every product of the order, with what was delivered and what came back.
  const lines = order
    ? order.lines
        .map((l) => ({ sku: l.sku, name: l.name, uom: l.uom, delivered: l.deliveredQty ?? goodQty(l), back: returned.get(l.sku) }))
        .filter((l) => l.delivered > 0 || l.back)
    : r.items.map((i) => ({ sku: i.sku, name: i.name, uom: "", delivered: undefined as number | undefined, back: i }));
  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
      {/* Header: status, who (with area and phone), when, value */}
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-b border-gray-100 bg-gray-50 px-4 py-2">
        <div className="flex min-w-0 flex-wrap items-center gap-x-2.5 gap-y-1">
          <span className={cn("rounded-full border px-2.5 py-0.5 text-xs font-semibold", STAGE_CLASS[stage.key])}>{stage.label}</span>
          {fromCds ? (
            <span className="inline-flex items-center gap-1.5 font-semibold text-gray-900">
              <Warehouse className="h-4 w-4 text-gray-500" /> {cdsName}
            </span>
          ) : (
            <>
              <span className="font-semibold text-gray-900">{retailer?.name ?? r.retailerId}</span>
              {retailer?.area && <span className="text-sm text-gray-500">{retailer.area}</span>}
              {retailer?.phone && (
                <a href={`tel:${retailer.phone}`} className="inline-flex items-center gap-1 text-sm text-teal-700 hover:underline">
                  <Phone className="h-3.5 w-3.5" /> {fmtPhone(retailer.phone)}
                </a>
              )}
            </>
          )}
        </div>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-gray-500">{fmtDayDateTime(r.createdAt)}</span>
          <span className="font-semibold text-red-700">−{fmtINR(r.value)}</span>
        </div>
      </div>

      {/* One row of facts */}
      <div className="grid grid-cols-2 gap-x-6 gap-y-2 px-4 py-2.5 lg:grid-cols-4">
        <Fact label="Order">
          <button type="button" onClick={onOpenOrder} className="inline-flex items-center gap-1 font-mono text-[13px] font-semibold text-teal-700 hover:underline">
            <Package className="h-3.5 w-3.5 text-gray-500" /> {r.orderId}
          </button>
        </Fact>
        <Fact label="Delivered on">{dates ? fmtDate(dates.deliveredOn ?? dates.deliveryDate) : "—"}</Fact>
        <Fact label="Reason">
          <span className="font-medium">{r.reason}</span>
          {r.type !== "Retailer Return" && <span className="block text-xs text-gray-500">{KIND[r.type] ?? r.type}</span>}
        </Fact>
        {stage.key === "back" ? (
          <Fact label="Returned to you">
            <span className="font-medium text-green-700">{fmtDayDateTime(r.updatedAt)}</span>
          </Fact>
        ) : (
          <Fact label="Bringing it back">
            {r.returnRider ? (
              <span className="inline-flex flex-wrap items-center gap-x-2">
                <span className="inline-flex items-center gap-1 font-medium">
                  <User className="h-3.5 w-3.5 text-gray-500" /> {r.returnRider.name}
                </span>
                <a href={`tel:${r.returnRider.phone}`} className="text-teal-700 hover:underline">{fmtPhone(r.returnRider.phone)}</a>
              </span>
            ) : (
              <span className="text-gray-600">To be assigned</span>
            )}
          </Fact>
        )}
      </div>

      {/* Products — closed by default */}
      <details className="group border-t border-gray-100">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-4 py-2 hover:bg-gray-50 [&::-webkit-details-marker]:hidden">
          <span className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
            <ChevronDown className="h-4 w-4 text-gray-500 group-open:rotate-180" />
            Products ({lines.length})
          </span>
          <span className="text-sm text-red-700">
            {r.items.length} returned · {units} unit{units === 1 ? "" : "s"}
          </span>
        </summary>
        <table className="w-full border-t border-gray-100 text-sm">
          <thead>
            <tr className="bg-gray-50 text-left text-xs text-gray-600">
              <th className="px-4 py-1.5 font-medium">Product</th>
              <th className="px-4 py-1.5 text-right font-medium">Delivered</th>
              <th className="px-4 py-1.5 text-right font-medium">Returned</th>
              <th className="px-4 py-1.5 text-right font-medium">Return value</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {lines.map((l) => (
              <tr key={l.sku} className={cn(l.back && "bg-red-50/60")}>
                <td className="px-4 py-2 text-gray-900">{l.name}</td>
                <td className="px-4 py-2 text-right text-gray-700">
                  {l.delivered ?? "—"} <span className="text-gray-500">{l.uom}</span>
                </td>
                <td className={cn("px-4 py-2 text-right", l.back ? "font-semibold text-red-700" : "text-gray-400")}>{l.back ? l.back.qty : "—"}</td>
                <td className="px-4 py-2 text-right text-gray-700">{l.back ? `−${fmtINR(l.back.value)}` : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </div>
  );
}
