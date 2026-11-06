// Admin → Dark Stores
// -----------------------------------------------------------------
// Every dark store (CDS) side by side in one plain table — the few
// numbers that tell you how a store is set up and how well its area is
// served. Click a row for that store's page, where sellers are added.
// Stores themselves are added and edited in Connectors → Digidukaan
// Darkstore Connector.
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Card } from "@mockups/web-ui";
import { Badge } from "@mockups/web-ui";
import { Button } from "@mockups/web-ui";
import { Input } from "@mockups/web-ui";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@mockups/web-ui";
import { EmptyState } from "@mockups/web-ui";
import { ChevronRight, Plug, Search, Warehouse } from "lucide-react";
import { getCustomers, subscribeToCustomers } from "../../lib/customer-database";
import { subscribeToServiceabilityBeats } from "../../lib/serviceability-data";
import {
  buildCdsCoverage,
  buildDarkStoreAnalysis,
  sampleDailyOperations,
  storeZoneLabel,
  useDarkStores,
  type CdsCoverage,
  type DarkStoreAnalysis,
} from "../../lib/dark-store-data";

const fmt = (n: number) => n.toLocaleString("en-IN");

interface StoreStats {
  analysis: DarkStoreAnalysis;
  cds: CdsCoverage;
  ordersToday: number;
}

export function AdminDarkStores() {
  const navigate = useNavigate();
  const stores = useDarkStores();
  const [search, setSearch] = useState("");

  // Per-store numbers, built after first paint — each is a
  // point-in-polygon pass over the retailer roster.
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
  const [stats, setStats] = useState<Map<string, StoreStats>>(new Map());
  useEffect(() => {
    const t = setTimeout(() => {
      setStats(
        new Map(
          stores.map((s) => {
            const analysis = buildDarkStoreAnalysis(s, customers, "zone");
            const cds = buildCdsCoverage(analysis, s);
            const ops = sampleDailyOperations(s, analysis.customers.length, cds.sellers.length);
            return [s.id, { analysis, cds, ordersToday: ops.ordersToday }];
          }),
        ),
      );
    }, 0);
    return () => clearTimeout(t);
  }, [stores, customers, beatsVersion]);

  const q = search.trim().toLowerCase();
  const rows = stores.filter(
    (s) => !q || s.name.toLowerCase().includes(q) || s.areaName.toLowerCase().includes(q),
  );
  const cell = (id: string, pick: (a: StoreStats) => string) => {
    const a = stats.get(id);
    return a ? pick(a) : "…";
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex-shrink-0">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Warehouse className="h-5 w-5 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">
              {rows.length} dark store{rows.length === 1 ? "" : "s"}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative w-64 md:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name or area"
                className="pl-10"
              />
            </div>
            <Button variant="outline" className="gap-2" onClick={() => navigate("/admin/connectors/darkstore")}>
              <Plug className="h-4 w-4" />
              Add / edit stores
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <Card className="overflow-hidden gap-0">
          {rows.length === 0 ? (
            <EmptyState
              icon={Warehouse}
              title={stores.length === 0 ? "No dark stores yet" : "No dark stores found"}
              description={
                stores.length === 0
                  ? "Add one in Connectors → Digidukaan Darkstore Connector."
                  : "Try a different name or area."
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="text-xs uppercase text-gray-500">Dark store</TableHead>
                    <TableHead className="text-xs uppercase text-gray-500">Area</TableHead>
                    <TableHead className="text-xs uppercase text-gray-500">Status</TableHead>
                    <TableHead className="text-xs uppercase text-gray-500">Polygon</TableHead>
                    <TableHead className="text-xs uppercase text-gray-500 text-right">Active retailers</TableHead>
                    <TableHead className="text-xs uppercase text-gray-500 text-right">Sellers on store</TableHead>
                    <TableHead className="text-xs uppercase text-gray-500 text-right">Retailers served</TableHead>
                    <TableHead className="text-xs uppercase text-gray-500 text-right">Companies</TableHead>
                    <TableHead className="text-xs uppercase text-gray-500 text-right">Orders today</TableHead>
                    <TableHead className="w-8" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((s) => (
                    <TableRow
                      key={s.id}
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => navigate(`/admin/dark-stores/${s.id}`)}
                    >
                      <TableCell className="font-medium text-gray-900">{s.name}</TableCell>
                      <TableCell className="text-sm text-gray-700">{s.areaName}</TableCell>
                      <TableCell>
                        {s.isActive ? (
                          <Badge className="bg-green-50 text-green-700 border-green-200 text-xs">Active</Badge>
                        ) : (
                          <Badge variant="outline" className="text-gray-600 text-xs">
                            Inactive
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-gray-700">{storeZoneLabel(s)}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {cell(s.id, (a) => fmt(a.analysis.customers.length))}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {cell(s.id, (a) => fmt(a.cds.sellers.length))}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {cell(s.id, (a) => `${fmt(a.cds.served)} (${a.cds.servedPct}%)`)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {cell(s.id, (a) => fmt(a.cds.companies.length))}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {cell(s.id, (a) => fmt(a.ordersToday))}
                      </TableCell>
                      <TableCell>
                        <ChevronRight className="h-4 w-4 text-gray-400" />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </Card>
        <p className="text-xs text-gray-500 mt-3">
          Active retailers — inside the store's polygon. Sellers on store — every seller delivering
          inside the polygon joins automatically, less any the super admin removed. Retailers served —
          active retailers at least one seller on the store delivers to.
        </p>
      </div>
    </div>
  );
}
