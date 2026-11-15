// Pickup status before pickup (CDS connector sellers).
//
// For a confirmed order that waits for pickup, the seller sees only whether
// a pickup person is assigned and the pickup day. No name or phone: LBNP can
// change the person, and the handover is checked with the OTP anyway.
// The seller can open the Orders PDF (CDS, 3PL or both): retailer-wise, with case / piece quantities, unit
// prices and the retailer's phone number, to pack and check the handover.

import { FileText, Printer, Truck, Warehouse } from "lucide-react";
import { Button, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@mockups/web-ui";
import { fmtDate, fmtDayLabel, fmtINR, goodQty } from "../../lib/cds/calc";
import { getSkuPackConfig } from "../../lib/orders-data";
import { findSku } from "../../lib/sku-catalog";
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

/** Seller-facing name of the route — the delivery type names: "Self" (CDS) and "3PL Logistics". */
export const routeLabel = (by: "CDS" | "3PL") => (by === "3PL" ? "3PL Logistics" : "Self");

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

/** "Pickup person is assigned, will arrive today"; before a pickup person is assigned, no pickup-person text. */
export const pickupText = (info: PickupInfo) =>
  info.assigned ? `Pickup person is assigned, will arrive ${pickupDay(info.eta)}` : "";

/** Short line under the status badge in the Orders table. */
export function PickupPersonLine({ info }: { info: PickupInfo }) {
  const Icon = info.by === "3PL" ? Truck : Warehouse;
  const tone = info.by === "3PL" ? "text-blue-700" : "text-teal-700";
  return (
    <span className={`inline-flex items-center gap-1 text-[11px] font-medium ${tone}`}>
      <Icon className="h-3 w-3" /> {routeLabel(info.by)} · {pickupText(info)}
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
        <Icon className="h-3.5 w-3.5" /> Waiting for pickup · {routeLabel(info.by)}
      </p>
      <div className="mt-2 flex flex-wrap items-center gap-x-6 gap-y-1.5">
        <span className={info.assigned ? "font-semibold text-gray-900" : "text-gray-600"}>
          {info.assigned ? pickupText(info) : "Please keep the order packed."}
        </span>
        <Button variant="outline" size="sm" className="h-7 gap-1.5 ml-auto" onClick={() => printOrderPickupList(info)}>
          <FileText className="h-3.5 w-3.5" /> View Orders PDF
        </Button>
      </div>
    </div>
  );
}

// ---- Orders PDF ----

const packQty = (l: CdsOrderLine) => goodQty(l);

const esc = (v: string) => v.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

const units = (os: CdsOrder[]) => os.reduce((n, o) => n + o.lines.reduce((m, l) => m + packQty(l), 0), 0);
const plural = (n: number, w: string) => `${n} ${w}${n === 1 ? "" : "s"}`;
const fmtPhone = (p: string) => (/^\d{10}$/.test(p) ? `+91 ${p.slice(0, 5)} ${p.slice(5)}` : p);

/**
 * Case size of a line. A product named "… (Case of 24)" is ordered in cases (its price is per case). Otherwise the
 * quantity is in pieces, and the case size comes from the SKU pack setup ("Unit Per Case") or the unit of measure.
 */
function caseOf(l: CdsOrderLine): { perCase: number | null; inCases: boolean } {
  const named = /\((?:case|box|carton) of (\d+)\)/i.exec(l.name);
  if (named) return { perCase: Number(named[1]), inCases: true };
  const cfg = getSkuPackConfig(l.sku);
  if (cfg && cfg.upc > 1) return { perCase: cfg.upc, inCases: false };
  const cat = findSku(l.sku)?.caseSize;
  if (cat && cat > 1) return { perCase: cat, inCases: false };
  const uom = /(?:case|box|carton) of (\d+)/i.exec(l.uom ?? "");
  if (uom) return { perCase: Number(uom[1]), inCases: false };
  return { perCase: demoCaseSize(l.name), inCases: false };
}

/** Demo only — synthetic case sizes by pack size for products the SKU master does not cover yet. */
function demoCaseSize(name: string): number | null {
  const m = /(\d+(?:\.\d+)?)\s*(kg|g|l|ltr|ml)\b/i.exec(name);
  if (!m) return null;
  const v = Number(m[1]);
  const big = /kg|^l$|ltr/i.test(m[2]);
  const grams = big ? v * 1000 : v;
  if (grams >= 5000) return null; // 5 kg / 5 L and above: sold singly
  if (grams >= 1000) return 10;
  if (grams >= 400) return 24;
  if (grams >= 150) return 36;
  if (grams >= 50) return 48;
  return 96;
}

/** "2 Cases + 6 Pcs" · "8 Cases" · "12 Pcs" — the order quantity at case and piece level. */
export function caseQty(l: CdsOrderLine, qty = packQty(l)): string {
  const { perCase, inCases } = caseOf(l);
  const c = (n: number) => `${n} Case${n === 1 ? "" : "s"}`;
  const p = (n: number) => `${n} Pc${n === 1 ? "" : "s"}`;
  if (inCases) return c(qty);
  if (!perCase) return p(qty);
  const cases = Math.floor(qty / perCase);
  const pcs = qty % perCase;
  return cases && pcs ? `${c(cases)} + ${p(pcs)}` : cases ? c(cases) : p(pcs);
}
const unitLabel = (l: CdsOrderLine) => (caseOf(l).inCases ? "case" : "pc");

type Route = "CDS" | "3PL";

/** "Today, 13 Nov 2026" — the day name with the date. */
const dayWithDate = (iso: string) => {
  const d = fmtDayLabel(iso);
  const date = fmtDate(iso);
  return d === date ? date : `${d}, ${date}`;
};

/** Opens the Orders PDF (print dialog) — Self, 3PL Logistics, or both; retailer-wise, with case / piece quantities,
 *  unit prices and the retailer's phone number. Only orders and products; no pickup person details. */
export function printPickupList(s: CdsState, groups: { by: Route; orders: CdsOrder[] }[]) {
  const retailer = new Map(s.retailers.map((r) => [r.id, r]));
  const dayOf = (os: CdsOrder[]) => [...new Set(os.map((o) => pickupInfo(s, o)?.eta).filter((x): x is string => !!x).map((x) => dayWithDate(x)))].join(", ");
  const routes = groups.filter((g) => g.orders.length > 0);
  const all = routes.flatMap((g) => g.orders);
  const both = routes.length > 1;
  const linesOf = (o: CdsOrder) => o.lines.filter((l) => packQty(l) > 0);
  const amount = (os: CdsOrder[]) => os.reduce((v, o) => v + linesOf(o).reduce((m, l) => m + packQty(l) * l.price, 0), 0);
  const section = (by: Route, orders: CdsOrder[]) => {
    const byRetailer = new Map<string, CdsOrder[]>();
    orders.forEach((o) => byRetailer.set(o.retailerId, [...(byRetailer.get(o.retailerId) ?? []), o]));
    const blocks = [...byRetailer.entries()]
      .sort((a, b) => (retailer.get(a[0])?.name ?? a[0]).localeCompare(retailer.get(b[0])?.name ?? b[0]))
      .map(([rid, os], i) => {
        const rt = retailer.get(rid);
        const rows = os
          .flatMap((o) =>
            linesOf(o).map(
              (l, k) => `<tr>
                <td class="ck"><span class="box"></span></td>
                ${k === 0 ? `<td class="oid" rowspan="${linesOf(o).length}">${esc(o.id)}</td>` : ""}
                <td>${esc(l.name)}${l.brand ? ` <span class="mut">${esc(l.brand)}</span>` : ""}</td>
                <td class="n"><b>${esc(caseQty(l))}</b></td>
                <td class="n">${esc(fmtINR(l.price))}<span class="mut"> / ${unitLabel(l)}</span></td>
                <td class="n">${esc(fmtINR(packQty(l) * l.price))}</td>
              </tr>`,
            ),
          )
          .join("");
        return `
        <div class="retailer">
          <div class="rh">
            <div><b>${i + 1}. ${esc(rt?.name ?? rid)}</b>${rt?.area ? ` <span class="mut">· ${esc(rt.area)}</span>` : ""}</div>
            <div>${rt?.phone ? `☎ <b>${esc(fmtPhone(rt.phone))}</b>` : ""}</div>
          </div>
          <table>
            <thead><tr><th class="ck">✓</th><th>Order</th><th>Product</th><th class="n">Quantity</th><th class="n">Unit Price</th><th class="n">Amount</th></tr></thead>
            <tbody>${rows}</tbody>
            <tfoot><tr><td colspan="5" class="n">${plural(os.length, "order")} · Total</td><td class="n"><b>${esc(fmtINR(amount(os)))}</b></td></tr></tfoot>
          </table>
        </div>`;
      })
      .join("");
    const name = routeLabel(by);
    const day = dayOf(orders);
    return `
  <div class="route">
    ${both ? `<h2>${name} orders${day ? ` — ${esc(day)}` : ""}</h2>` : ""}
    <div class="head">
      <div>Pickup by: <b>${name}</b></div>
      <div>Total: <b>${plural(byRetailer.size, "retailer")} · ${plural(orders.length, "order")} · ${esc(fmtINR(amount(orders)))}</b></div>
    </div>
    ${blocks}
  </div>`;
  };
  const title = both ? "Orders — Self & 3PL Logistics" : `${routes[0] ? routeLabel(routes[0].by) : ""} Orders`;
  const day = dayOf(all);
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>${title}</title>
<style>
  *{box-sizing:border-box} body{font-family:Arial,Helvetica,sans-serif;color:#111;margin:24px;font-size:12px}
  h1{font-size:18px;margin:0 0 4px} .mut{color:#666}
  .head{border:1px solid #ccc;border-radius:6px;padding:10px 12px;margin:12px 0;display:grid;grid-template-columns:1fr 1fr;gap:4px 24px;background:#fafafa}
  .retailer{border:1px solid #ddd;border-radius:6px;margin-bottom:12px;page-break-inside:avoid}
  .rh{display:flex;justify-content:space-between;gap:12px;background:#f5f5f5;padding:7px 10px;border-bottom:1px solid #ddd;font-size:13px}
  table{width:100%;border-collapse:collapse} th,td{text-align:left;padding:5px 10px;border-bottom:1px solid #eee;vertical-align:top} th{font-size:11px;color:#555}
  tfoot td{border-bottom:none;background:#fafafa}
  .n{text-align:right;white-space:nowrap} .ck{width:28px} .oid{font-family:monospace;font-size:11px;white-space:nowrap} .box{display:inline-block;width:12px;height:12px;border:1px solid #555}
  h2{font-size:15px;margin:0 0 4px} .route + .route{page-break-before:always;margin-top:24px}
</style></head><body>
  <h1>${title}${day ? ` — ${esc(day)}` : ""}</h1>
  <div class="mut">Retailer-wise. Pack these orders and check each product with the pickup person.${both ? ` Total: ${plural(all.length, "order")} · ${units(all)} units · ${esc(fmtINR(amount(all)))}.` : ""}</div>
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

/** Order page: the Orders PDF for the orders on the same pickup trip. */
function printOrderPickupList(info: PickupInfo) {
  const s = getCds();
  const ids = new Set(info.trip.stops.filter((st) => st.type === "Pickup").flatMap((st) => st.orderIds));
  printPickupList(s, [{ by: info.by, orders: s.orders.filter((o) => ids.has(o.id) && o.status === "Pickup Requested") }]);
}

/** "View Orders PDF" button for the Confirmed tab — Self, 3PL Logistics, or Both. */
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
          title={options.length ? "Retailer-wise orders with case / piece quantities and prices" : "No orders waiting for pickup"}
        >
          <FileText className="h-4 w-4" /> View Orders PDF
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {options.map(({ by, orders: os }) => (
          <DropdownMenuItem key={by} onSelect={() => printPickupList(s, [{ by, orders: os }])} className="justify-between">
            <span className="inline-flex items-center gap-2 font-medium text-gray-900">
              {by === "3PL" ? <Truck className="h-4 w-4 text-blue-600" /> : <Warehouse className="h-4 w-4 text-teal-600" />}
              {routeLabel(by)} orders
            </span>
            <span className="text-xs text-gray-500">{plural(os.length, "order")}</span>
          </DropdownMenuItem>
        ))}
        {options.length > 1 && (
          <DropdownMenuItem onSelect={() => printPickupList(s, options)} className="justify-between border-t border-gray-100">
            <span className="inline-flex items-center gap-2 font-medium text-gray-900">
              <Printer className="h-4 w-4 text-gray-600" />
              Both (Self &amp; 3PL Logistics)
            </span>
            <span className="text-xs text-gray-500">{plural(waiting.length, "order")}</span>
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
