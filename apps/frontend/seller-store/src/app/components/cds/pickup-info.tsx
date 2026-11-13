// Pickup status before pickup (CDS connector sellers).
//
// For a confirmed order that waits for pickup, the seller sees only whether
// a pickup person is assigned and the pickup day. No name or phone: LBNP can
// change the person, and the handover is checked with the OTP anyway.
// The seller can print the CDS or 3PL pickup list (orders + products) to
// pack and check the handover. The print has a blank line for the pickup
// person's name, so it never shows a person who was changed.

import { Printer, Truck, Warehouse } from "lucide-react";
import { Button, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@mockups/web-ui";
import { fmtDate, fmtDayLabel, fmtINR, goodQty } from "../../lib/cds/calc";
import { getCds, useCds } from "../../lib/cds/store";
import type { CdsOrder, CdsOrderLine, CdsState, CdsTrip } from "../../lib/cds/types";

export interface PickupInfo {
  trip: CdsTrip;
  /** A pickup person is assigned to the trip. */
  assigned: boolean;
  /** Expected arrival at the seller (used only for the pickup day). */
  eta?: string;
  by: "CDS" | "3PL";
}

/** Pickup trip of an order that still waits for pickup, else undefined. */
export function pickupInfo(s: CdsState, o: CdsOrder | undefined): PickupInfo | undefined {
  if (!o || o.status !== "Pickup Requested" || !o.pickupTripId) return undefined;
  const trip = s.trips.find((t) => t.id === o.pickupTripId);
  if (!trip || trip.status === "Cancelled") return undefined;
  const stop = trip.stops.find((st) => st.type === "Pickup" && st.orderIds.includes(o.id));
  return { trip, assigned: !!trip.rider, eta: stop?.eta, by: o.route === "3pl" ? "3PL" : "CDS" };
}

/** "today" / "tomorrow" / "on 20 May 2026" — the pickup day in a sentence. */
function pickupDay(eta?: string): string {
  if (!eta) return "soon";
  const d = fmtDayLabel(eta);
  return /^(Today|Tomorrow|Yesterday)$/.test(d) ? d.toLowerCase() : `on ${d}`;
}

/** "Pickup person is assigned, will arrive today" / "Pickup person will be assigned soon" */
export const pickupText = (info: PickupInfo) =>
  info.assigned ? `Pickup person is assigned, will arrive ${pickupDay(info.eta)}` : "Pickup person will be assigned soon";

/** Short line under the status badge in the Orders table. */
export function PickupPersonLine({ info }: { info: PickupInfo }) {
  const Icon = info.by === "3PL" ? Truck : Warehouse;
  const tone = info.by === "3PL" ? "text-blue-700" : "text-teal-700";
  return (
    <span className={`inline-flex items-center gap-1 text-[11px] font-medium ${tone}`}>
      <Icon className="h-3 w-3" /> {info.by} · {pickupText(info)}
    </span>
  );
}

/** Card on the order page for an order waiting for pickup. */
export function PickupComingCard({ info }: { info: PickupInfo }) {
  const Icon = info.by === "3PL" ? Truck : Warehouse;
  const border = info.by === "3PL" ? "border-blue-200" : "border-teal-200";
  const tone = info.by === "3PL" ? "text-blue-700" : "text-teal-700";
  return (
    <div className={`rounded-xl border ${border} bg-white p-3 text-sm`}>
      <p className={`text-[11px] font-semibold uppercase tracking-wider flex items-center gap-1 ${tone}`}>
        <Icon className="h-3.5 w-3.5" /> Waiting for {info.by} pickup
      </p>
      <div className="mt-2 flex flex-wrap items-center gap-x-6 gap-y-1.5">
        <span className={info.assigned ? "font-semibold text-gray-900" : "text-gray-600"}>
          {pickupText(info)}
          {!info.assigned && ". Please keep the order packed."}
        </span>
        <Button variant="outline" size="sm" className="h-7 gap-1.5 ml-auto" onClick={() => printOrderPickupList(info)}>
          <Printer className="h-3.5 w-3.5" /> Print pickup list
        </Button>
      </div>
    </div>
  );
}

// ---- print ----

const packQty = (l: CdsOrderLine) => goodQty(l);

const esc = (v: string) => v.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

const units = (os: CdsOrder[]) => os.reduce((n, o) => n + o.lines.reduce((m, l) => m + packQty(l), 0), 0);
const plural = (n: number, w: string) => `${n} ${w}${n === 1 ? "" : "s"}`;

type Route = "CDS" | "3PL";

/** "Today, 13 Nov 2026" — the day name with the date. */
const dayWithDate = (iso: string) => {
  const d = fmtDayLabel(iso);
  const date = fmtDate(iso);
  return d === date ? date : `${d}, ${date}`;
};

/** Prints the pickup list — CDS, 3PL, or both (one section per route, each
 *  with its own handover lines, since a different person picks up each).
 *  Only orders and products to pack; no pickup person details. */
export function printPickupList(s: CdsState, groups: { by: Route; orders: CdsOrder[] }[]) {
  const retailer = new Map(s.retailers.map((r) => [r.id, r]));
  const dayOf = (os: CdsOrder[]) => [...new Set(os.map((o) => pickupInfo(s, o)?.eta).filter((x): x is string => !!x).map((x) => dayWithDate(x)))].join(", ");
  const routes = groups.filter((g) => g.orders.length > 0);
  const all = routes.flatMap((g) => g.orders);
  const both = routes.length > 1;
  let n = 0;
  const section = (by: Route, orders: CdsOrder[]) => {
  const rows = orders
    .map((o) => {
      n += 1;
      const i = n - 1;
      const lines = o.lines.filter((l) => packQty(l) > 0);
      const value = lines.reduce((v, l) => v + packQty(l) * l.price, 0);
      return `
      <div class="order">
        <div class="oh"><span><b>${i + 1}. ${esc(o.id)}</b> · ${esc(retailer.get(o.retailerId)?.name ?? o.retailerId)}</span><span>${esc(fmtINR(value))}</span></div>
        <table>
          <thead><tr><th class="ck">✓</th><th>Product</th><th>Pack</th><th class="n">Qty</th></tr></thead>
          <tbody>${lines
            .map((l) => `<tr><td class="ck"><span class="box"></span></td><td>${esc(l.name)} <span class="mut">${esc(l.brand)}</span></td><td class="mut">${esc(l.uom)}</td><td class="n"><b>${packQty(l)}</b></td></tr>`)
            .join("")}</tbody>
        </table>
      </div>`;
    })
    .join("");
  const name = by === "3PL" ? "3PL Logistics" : "Cross Dock Store (CDS)";
  const day = dayOf(orders);
  return `
  <div class="route">
    ${both ? `<h2>${by} pickup${day ? ` — ${esc(day)}` : ""}</h2>` : ""}
    <div class="head">
      <div>Pickup by: <b>${name}</b></div>
      <div>Total: <b>${plural(orders.length, "order")} · ${units(orders)} units</b></div>
    </div>
    ${rows}
  </div>`;
  };
  const title = both ? "Pickup list — CDS & 3PL" : `${routes[0]?.by ?? ""} pickup list`;
  const day = dayOf(all);
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>${title}</title>
<style>
  *{box-sizing:border-box} body{font-family:Arial,Helvetica,sans-serif;color:#111;margin:24px;font-size:12px}
  h1{font-size:18px;margin:0 0 4px} .mut{color:#666}
  .head{border:1px solid #ccc;border-radius:6px;padding:10px 12px;margin:12px 0;display:grid;grid-template-columns:1fr 1fr;gap:4px 24px;background:#fafafa}
  .order{border:1px solid #ddd;border-radius:6px;margin-bottom:12px;page-break-inside:avoid}
  .oh{display:flex;justify-content:space-between;background:#f5f5f5;padding:6px 10px;border-bottom:1px solid #ddd}
  table{width:100%;border-collapse:collapse} th,td{text-align:left;padding:5px 10px;border-bottom:1px solid #eee} th{font-size:11px;color:#555}
  .n{text-align:right} .ck{width:28px} .box{display:inline-block;width:12px;height:12px;border:1px solid #555}
  h2{font-size:15px;margin:0 0 4px} .route + .route{page-break-before:always;margin-top:24px}
</style></head><body>
  <h1>${title}${day ? ` — ${esc(day)}` : ""}</h1>
  <div class="mut">Pack these orders and check each product with the pickup person.${both ? ` Total: ${plural(all.length, "order")} · ${units(all)} units.` : ""}</div>
  ${routes.map((g) => section(g.by, g.orders)).join("") || '<p class="mut">No orders waiting for pickup.</p>'}
</body></html>`;

  const frame = document.createElement("iframe");
  frame.setAttribute("aria-hidden", "true");
  frame.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0;";
  document.body.appendChild(frame);
  const doc = frame.contentWindow?.document;
  if (!doc) return;
  doc.open();
  doc.write(html);
  doc.close();
  setTimeout(() => {
    frame.contentWindow?.focus();
    frame.contentWindow?.print();
    setTimeout(() => frame.remove(), 60000);
  }, 100);
}

/** Order page: print this route's list for the orders on the same pickup trip. */
function printOrderPickupList(info: PickupInfo) {
  const s = getCds();
  const ids = new Set(info.trip.stops.filter((st) => st.type === "Pickup").flatMap((st) => st.orderIds));
  printPickupList(s, [{ by: info.by, orders: s.orders.filter((o) => ids.has(o.id) && o.status === "Pickup Requested") }]);
}

/** "Print pickup list" button for the Confirmed tab — CDS, 3PL, or Both. */
export function PrintPickupListButton({ orders }: { orders: (CdsOrder | undefined)[] }) {
  const s = useCds();
  const waiting = orders.filter((o): o is CdsOrder => !!pickupInfo(s, o));
  const options = (["CDS", "3PL"] as const)
    .map((by) => ({ by, orders: waiting.filter((o) => (o.route === "3pl" ? "3PL" : "CDS") === by) }))
    .filter((x) => x.orders.length > 0);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-9 gap-1.5"
          disabled={options.length === 0}
          title={options.length ? undefined : "No orders waiting for pickup"}
        >
          <Printer className="h-4 w-4" /> Print pickup list
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {options.map(({ by, orders: os }) => (
          <DropdownMenuItem key={by} onSelect={() => printPickupList(s, [{ by, orders: os }])} className="justify-between">
            <span className="inline-flex items-center gap-2 font-medium text-gray-900">
              {by === "3PL" ? <Truck className="h-4 w-4 text-blue-600" /> : <Warehouse className="h-4 w-4 text-teal-600" />}
              {by} pickup list
            </span>
            <span className="text-xs text-gray-500">{plural(os.length, "order")}</span>
          </DropdownMenuItem>
        ))}
        {options.length > 1 && (
          <DropdownMenuItem onSelect={() => printPickupList(s, options)} className="justify-between border-t border-gray-100">
            <span className="inline-flex items-center gap-2 font-medium text-gray-900">
              <Printer className="h-4 w-4 text-gray-600" />
              Both (CDS &amp; 3PL)
            </span>
            <span className="text-xs text-gray-500">{plural(waiting.length, "order")}</span>
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
