// Admin → Dark Stores → <Store>
// -----------------------------------------------------------------
// One dark store (CDS) on one plain page — label / value lists and
// small tables, no charts:
// 1. Store details   — who and where it is (from the connector form).
// 2. Service area    — its polygon and the totals.
// 3. Sellers on this dark store — every seller delivering inside the
//    polygon joins automatically. Delete takes one off; "Removed
//    sellers" lists them with Add back.
// 4. Active retailers — every active retailer inside, searchable, CSV.
// 5. Daily operations — today's orders, handover and delivery figures.
//
// Only ACTIVE sellers and ACTIVE retailers (Business Status Active-User,
// Status Active) are counted — the same rules as Generate Report.
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useNavigate, useParams } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@mockups/web-ui";
import { Button } from "@mockups/web-ui";
import { Badge } from "@mockups/web-ui";
import { Input } from "@mockups/web-ui";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@mockups/web-ui";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@mockups/web-ui";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@mockups/web-ui";
import { ListPagination } from "@mockups/web-ui";
import { EmptyState } from "@mockups/web-ui";
import { PolygonPreviewMap } from "../../components/serviceability-map-view";
import {
  ArrowLeft,
  Download,
  Loader2,
  Pencil,
  RotateCcw,
  Search,
  Store,
  Trash2,
  UserMinus,
} from "lucide-react";
import { toast } from "sonner";
import { getCustomers, subscribeToCustomers } from "../../lib/customer-database";
import { subscribeToServiceabilityBeats } from "../../lib/serviceability-data";
import {
  addSellersBackToDarkStore,
  buildCdsCoverage,
  buildDarkStoreAnalysis,
  customerTable,
  downloadTableCsv,
  handoverSlotFor,
  isLogisticsProvisioned,
  removeSellerFromDarkStore,
  sampleDailyOperations,
  storeZoneLabel,
  useDarkStores,
  type DarkStoreAnalysis,
  type SellerCoverage,
} from "../../lib/dark-store-data";

const fmt = (n: number) => n.toLocaleString("en-IN");
const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
const fmtMins = (m: number) => `${Math.floor(m / 60)} h ${String(m % 60).padStart(2, "0")} m`;
const warehouse = (s: SellerCoverage) => (s.warehouseKm != null ? `${s.warehouseKm} km` : "Not on file");

const PAGE_SIZE = 20;

export function AdminDarkStoreDashboard() {
  const navigate = useNavigate();
  const { storeId = "" } = useParams();
  const store = useDarkStores().find((s) => s.id === storeId);

  // Built after first paint — a point-in-polygon pass over the roster.
  // Keyed on what the analysis reads (polygon + location), not the whole
  // store, so removing or adding back a seller doesn't rebuild it.
  const [customers, setCustomers] = useState(getCustomers());
  const [beatsVersion, setBeatsVersion] = useState(0);
  useEffect(() => {
    const un1 = subscribeToCustomers(() => setCustomers([...getCustomers()]));
    const un2 = subscribeToServiceabilityBeats(() => setBeatsVersion((v) => v + 1));
    return () => {
      un1();
      un2();
    };
  }, []);
  const [analysis, setAnalysis] = useState<DarkStoreAnalysis | null>(null);
  const analysisKey = store ? `${store.id}|${store.centre.lat}|${store.centre.lng}` : "";
  useEffect(() => {
    if (!store) return;
    setAnalysis(null);
    const t = setTimeout(() => setAnalysis(buildDarkStoreAnalysis(store, customers, "zone")), 0);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [analysisKey, store?.zone, customers, beatsVersion]);

  const cds = useMemo(
    () => (analysis && store ? buildCdsCoverage(analysis, store) : null),
    [analysis, store],
  );

  // Delete / add back. The seller stays set while the confirmation fades
  // out, so its name doesn't blank mid-animation.
  const [deleting, setDeleting] = useState<SellerCoverage | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const askDelete = (s: SellerCoverage) => {
    setDeleting(s);
    setDeleteOpen(true);
  };
  const [removedOpen, setRemovedOpen] = useState(false);

  // Retailer table
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  useEffect(() => setPage(1), [search, storeId]);
  const retailerRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (analysis?.customers ?? [])
      .filter((z) => {
        if (!q) return true;
        const c = z.customer;
        return (
          c.name.toLowerCase().includes(q) ||
          c.mobile.includes(q) ||
          c.cluster.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => a.distanceKm - b.distanceKm);
  }, [analysis, search]);

  if (!store) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-0">
            <EmptyState
              icon={Store}
              title="Dark store not found"
              description="This dark store doesn't exist. Pick one from Dark Stores."
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  const downloadRetailers = () => {
    if (!analysis) return;
    const d = new Date();
    const p = (n: number) => String(n).padStart(2, "0");
    const stamp = `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
    const slug = store.areaName.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    downloadTableCsv(customerTable("zone"), retailerRows, `${slug}-dark-store_retailers_${stamp}.csv`);
    toast.success(`Downloaded ${fmt(retailerRows.length)} retailers as CSV`);
  };

  const provisioned = isLogisticsProvisioned(store);
  const location =
    store.latitude != null && store.longitude != null
      ? `${store.latitude.toFixed(5)}, ${store.longitude.toFixed(5)}`
      : "—";
  const removedAt = new Map(store.removedSellers.map((l) => [l.sellerId, l.removedAt]));
  const ops =
    analysis && cds ? sampleDailyOperations(store, analysis.customers.length, cds.sellers.length) : null;

  const addBack = (sellers: SellerCoverage[]) => {
    try {
      addSellersBackToDarkStore(
        store.id,
        sellers.map((s) => s.sellerId),
      );
      toast.success(
        sellers.length === 1
          ? `${sellers[0].businessName} added back to ${store.name}`
          : `${sellers.length} sellers added back to ${store.name}`,
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't add the seller back");
    }
  };

  const confirmDelete = () => {
    if (!deleting) return;
    const seller = deleting;
    try {
      removeSellerFromDarkStore(store.id, seller.sellerId);
      toast.success(`${seller.businessName} removed from ${store.name}`, {
        description: "Removed by mistake? Undo, or add them back from Removed sellers.",
        action: { label: "Undo", onClick: () => addBack([seller]) },
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't remove the seller");
    }
    setDeleteOpen(false);
  };

  return (
    <div className="p-6 space-y-5">
      <button
        type="button"
        onClick={() => navigate("/admin/dark-stores")}
        className="inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft className="h-4 w-4" />
        All dark stores
      </button>

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-semibold text-gray-900">{store.name}</h2>
            {store.isActive ? (
              <Badge className="bg-green-50 text-green-700 border-green-200 text-xs">Active</Badge>
            ) : (
              <Badge variant="outline" className="text-gray-600 text-xs">
                Inactive
              </Badge>
            )}
          </div>
          <p className="text-sm text-gray-500 mt-0.5">
            {[store.areaName, store.city].filter(Boolean).join(", ")}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            onClick={() => navigate(`/admin/connectors/darkstore?edit=${store.id}`)}
          >
            <Pencil className="h-4 w-4 mr-2" />
            Update store
          </Button>
          <Button onClick={downloadRetailers} disabled={!analysis}>
            <Download className="h-4 w-4 mr-2" />
            Download retailers
          </Button>
        </div>
      </div>

      {/* 1 — Store details */}
      <Section title="Store details">
        <Facts
          items={[
            ["Dark store name", store.name],
            ["Area", store.areaName],
            ["Status", store.isActive ? "Active" : "Inactive"],
            ["Address", store.address || "—"],
            ["City / PIN", [store.city, store.pincode].filter(Boolean).join(" – ") || "—"],
            ["State", store.state || "—"],
            ["Mobile", store.mobile || "—"],
            ["Email", store.email || "—"],
            ["GST number", store.gstNumber || "—"],
            ["Location (lat, long)", location],
            ["ONDC city code", store.ondcCityCode || "—"],
            [
              "Logistics account",
              provisioned ? (
                <Badge className="bg-green-50 text-green-700 border-green-200 text-xs">LBNP + LSP</Badge>
              ) : (
                <Badge variant="outline" className="text-amber-700 border-amber-200 bg-amber-50 text-xs">
                  Provisioning incomplete
                </Badge>
              ),
            ],
          ]}
        />
      </Section>

      {/* 2 — Service area */}
      <Section title="Service area">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Facts
            columns={1}
            items={[
              ["Polygon", `${storeZoneLabel(store)}${store.zoneFileName ? ` · ${store.zoneFileName}` : ""}`],
              ["Retailers inside (all)", analysis ? fmt(analysis.totalInZone) : <Pending />],
              ["Active retailers", analysis ? fmt(analysis.customers.length) : <Pending />],
              [
                "Sellers on this dark store",
                cds ? (
                  `${fmt(cds.sellers.length)} sellers${cds.removed.length ? ` · ${fmt(cds.removed.length)} removed` : ""}`
                ) : (
                  <Pending />
                ),
              ],
              [
                "Retailers served through the store",
                cds ? `${fmt(cds.served)} (${cds.servedPct}%)` : <Pending />,
              ],
              ["Retailers not served yet", cds ? fmt(cds.notServed) : <Pending />],
              [
                "Companies on this dark store",
                cds ? `${fmt(cds.companies.length)} companies` : <Pending />,
              ],
            ]}
          />
          <PolygonPreviewMap
            data={store.zone}
            caption="The dark store's polygon — every retailer inside it is routed to this store."
          />
        </div>
      </Section>

      {/* 3 — Sellers on this dark store */}
      <Section
        title={`Sellers on this dark store${cds ? ` (${cds.sellers.length})` : ""}`}
        action={
          cds && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setRemovedOpen(true)}
              disabled={cds.removed.length === 0}
            >
              <UserMinus className="h-4 w-4 mr-1.5" />
              Removed sellers ({cds.removed.length})
            </Button>
          )
        }
      >
        {!cds ? (
          <Pending block />
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-gray-500">
              Every seller delivering inside the {store.areaName} polygon is on this dark store
              automatically.
            </p>
            {cds.sellers.length === 0 ? (
              <p className="rounded-lg border border-dashed border-gray-300 px-4 py-6 text-center text-sm text-gray-500">
                No sellers on this dark store.
              </p>
            ) : (
              <SimpleTable
                headers={[
                  "Seller",
                  "Handover slot",
                  "Companies",
                  "Active retailers reached",
                  "Warehouse distance",
                  "",
                ]}
                rightFrom={2}
                rows={cds.sellers.map((s) => [
                  <SellerName key="n" s={s} onOpen={() => navigate(`/admin/users/${s.sellerId}`)} />,
                  handoverSlotFor(s.sellerId),
                  fmt(s.companyNames.length),
                  fmt(s.customersReached),
                  warehouse(s),
                  <button
                    key="x"
                    type="button"
                    aria-label={`Remove ${s.businessName}`}
                    title="Remove from this dark store"
                    className="p-1.5 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50"
                    onClick={() => askDelete(s)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>,
                ])}
              />
            )}
          </div>
        )}
      </Section>

      {/* 4 — Active retailers */}
      <Section
        title={`Active retailers${analysis ? ` (${fmt(analysis.customers.length)})` : ""}`}
        action={
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, mobile or cluster"
              className="pl-10 h-9"
            />
          </div>
        }
      >
        {!analysis || !cds ? (
          <Pending block />
        ) : (
          <>
            <SimpleTable
              headers={["Retailer", "Mobile", "Cluster", "Sellers on store", "Companies", "Distance"]}
              rightFrom={3}
              rows={retailerRows
                .slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
                .map((z) => {
                  const beats = z.beats.filter((b) => b.sellerId && cds.sellerIds.has(b.sellerId));
                  return [
                    <button
                      key="r"
                      type="button"
                      className="font-medium text-gray-900 hover:text-violet-700 hover:underline text-left"
                      onClick={() => navigate(`/admin/customers/${z.customer.id}`)}
                    >
                      {z.customer.name}
                    </button>,
                    z.customer.mobile || "—",
                    z.customer.cluster || store.areaName,
                    fmt(new Set(beats.map((b) => b.sellerId)).size),
                    fmt(new Set(beats.map((b) => b.companyName)).size),
                    `${z.distanceKm} km`,
                  ];
                })}
            />
            <ListPagination
              page={page}
              total={retailerRows.length}
              pageSize={PAGE_SIZE}
              onPageChange={setPage}
              itemLabel="retailer"
              hideOnSinglePage
            />
          </>
        )}
      </Section>

      {/* 5 — Daily operations */}
      <Section title="Daily operations">
        {!ops || !cds ? (
          <Pending block />
        ) : (
          <>
            <p className="text-xs text-gray-500 mb-3">
              Today so far ·{" "}
              {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "short" })}
            </p>
            <Facts
              items={[
                ["Orders today", fmt(ops.ordersToday)],
                ["Sellers handed over stock", `${fmt(ops.sellersHandedOver)} of ${fmt(cds.sellers.length)}`],
                ["Waiting for seller handover", fmt(ops.awaitingHandover)],
                ["Received at store", fmt(ops.receivedAtStore)],
                ["Out for delivery", fmt(ops.outForDelivery)],
                ["Delivered today", fmt(ops.delivered)],
                ["Average delivery time", fmtMins(ops.avgDeliveryMins)],
              ]}
            />
          </>
        )}
      </Section>

      {/* Removed sellers — add back */}
      {cds && (
        <Dialog open={removedOpen} onOpenChange={setRemovedOpen}>
          <DialogContent className="sm:max-w-xl">
            <DialogHeader>
              <DialogTitle>Removed sellers</DialogTitle>
              <DialogDescription>
                Sellers taken off {store.name}. Add one back and it's on the dark store again
                straight away.
              </DialogDescription>
            </DialogHeader>
            {cds.removed.length === 0 ? (
              <p className="py-6 text-center text-sm text-gray-500">No removed sellers.</p>
            ) : (
              <div className="max-h-80 overflow-y-auto rounded-lg border border-gray-200 divide-y divide-gray-100">
                {cds.removed.map((s) => (
                  <div key={s.sellerId} className="flex items-center gap-3 px-4 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 truncate">{s.businessName}</p>
                      <p className="text-xs text-gray-500 truncate">
                        {s.sellerName} · Removed on {fmtDate(removedAt.get(s.sellerId) ?? store.updatedAt)}
                      </p>
                    </div>
                    <p className="hidden sm:block text-xs text-gray-600 shrink-0 text-right">
                      {fmt(s.companyNames.length)} {s.companyNames.length === 1 ? "company" : "companies"}
                      <br />
                      {fmt(s.customersReached)} retailers
                    </p>
                    <Button size="sm" variant="outline" onClick={() => addBack([s])}>
                      <RotateCcw className="h-4 w-4 mr-1.5" />
                      Add back
                    </Button>
                  </div>
                ))}
              </div>
            )}
            <DialogFooter>
              {cds.removed.length > 1 && (
                <Button variant="outline" onClick={() => addBack(cds.removed)}>
                  Add all back
                </Button>
              )}
              <Button onClick={() => setRemovedOpen(false)}>Done</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete confirmation */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove {deleting?.businessName}?</AlertDialogTitle>
            <AlertDialogDescription>
              They'll stop handing stock over at {store.name}, and their orders from retailers in{" "}
              {store.areaName} go back to direct delivery. You can add them back any time from
              Removed sellers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={confirmDelete}>
              Remove seller
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ---- Building blocks ----

function SellerName({ s, onOpen }: { s: SellerCoverage; onOpen: () => void }) {
  return (
    <div>
      <button
        type="button"
        className="font-medium text-gray-900 hover:text-violet-700 hover:underline text-left"
        onClick={onOpen}
      >
        {s.businessName}
      </button>
      <p className="text-xs text-gray-500">{s.sellerName}</p>
    </div>
  );
}

function Section({
  title,
  action,
  children,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <Card className="gap-0">
      <CardHeader className="flex flex-row items-center justify-between gap-3 pb-3">
        <CardTitle className="text-base">{title}</CardTitle>
        {action}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

/** Label / value pairs in a grid. */
function Facts({ items, columns = 3 }: { items: [string, ReactNode][]; columns?: 1 | 3 }) {
  return (
    <dl
      className={`grid gap-x-6 gap-y-3 ${
        columns === 1 ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
      }`}
    >
      {items.map(([label, value]) => (
        <div key={label} className="min-w-0">
          <dt className="text-xs text-gray-500">{label}</dt>
          <dd className="text-sm text-gray-900 mt-0.5 break-words">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

/** A plain table; columns from `rightFrom` on are right-aligned numbers. */
function SimpleTable({
  headers,
  rows,
  rightFrom,
}: {
  headers: string[];
  rows: ReactNode[][];
  rightFrom: number;
}) {
  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50">
            {headers.map((h, i) => (
              <TableHead
                key={i}
                className={`text-xs uppercase text-gray-500 ${i >= rightFrom ? "text-right" : ""}`}
              >
                {h}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((r, ri) => (
            <TableRow key={ri}>
              {r.map((c, ci) => (
                <TableCell
                  key={ci}
                  className={`text-sm ${ci >= rightFrom ? "text-right tabular-nums text-gray-700" : ""}`}
                >
                  {c}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function Pending({ block }: { block?: boolean }) {
  return block ? (
    <div className="flex items-center gap-2 text-sm text-gray-500 py-4">
      <Loader2 className="h-4 w-4 animate-spin" />
      Working out the numbers…
    </div>
  ) : (
    <Loader2 className="h-3.5 w-3.5 animate-spin text-gray-400" />
  );
}
