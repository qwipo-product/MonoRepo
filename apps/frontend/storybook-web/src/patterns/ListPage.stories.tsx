import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Download, Filter, Plus, Search } from "lucide-react";
import {
  Button,
  DataTable,
  DataTableBody,
  DataTableCell,
  DataTableHead,
  DataTableHeader,
  DataTableRow,
  Input,
  ListPagination,
  StatusBadge,
  type StatusTone,
} from "@mockups/web-ui";

const meta: Meta = {
  title: "Patterns/List page",
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "The most-used page shape in the system. `flex-col h-full` wrapper → sticky toolbar (`flex-shrink-0`) → `flex-1 overflow-auto` table → pagination footer. Only the table region scrolls; the toolbar stays put as the user's anchor.",
      },
    },
  },
};
export default meta;

type Row = {
  nrid: string;
  business: string;
  city: string;
  relationships: number;
  trust: string;
  status: string;
  tone: StatusTone;
};

const ROWS: Row[] = [
  { nrid: "NRID-10001", business: "Sri Balaji Kirana Stores", city: "Hyderabad", relationships: 4, trust: "Level 4", status: "Verified", tone: "success" },
  { nrid: "NRID-10002", business: "New Ganesh Provisions", city: "Vijayawada", relationships: 3, trust: "Level 3", status: "Verified", tone: "success" },
  { nrid: "NRID-10003", business: "Sai Ram General Store", city: "Guntur", relationships: 1, trust: "Level 2", status: "Pending", tone: "warning" },
  { nrid: "NRID-10004", business: "Lakshmi Traders", city: "Warangal", relationships: 2, trust: "Level 3", status: "Verified", tone: "success" },
  { nrid: "NRID-10005", business: "Anjaneya Super Market", city: "Nellore", relationships: 0, trust: "Level 1", status: "Unverified", tone: "neutral" },
  { nrid: "NRID-10006", business: "Krishna Kirana Mart", city: "Kakinada", relationships: 2, trust: "Level 3", status: "Disputed", tone: "danger" },
  { nrid: "NRID-10007", business: "Venkateswara Stores", city: "Tirupati", relationships: 5, trust: "Level 5", status: "Verified", tone: "success" },
];

export const RetailerList: StoryObj = {
  name: "Retailer list",
  render: function Render() {
    const [page, setPage] = useState(1);
    const [query, setQuery] = useState("");

    const filtered = ROWS.filter((r) =>
      `${r.business} ${r.nrid} ${r.city}`
        .toLowerCase()
        .includes(query.toLowerCase()),
    );

    return (
      <div className="flex h-[600px] flex-col bg-gray-50">
        {/* Toolbar — search left, actions right, never scrolls */}
        <div className="flex flex-shrink-0 flex-wrap items-center justify-between gap-3 border-b border-gray-200 bg-white px-6 py-4">
          <div className="relative w-full max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, NRID or city"
              className="pl-9"
            />
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Filter /> Filters
            </Button>
            <Button variant="outline" size="sm">
              <Download /> Export
            </Button>
            <Button size="sm">
              <Plus /> Add retailer
            </Button>
          </div>
        </div>

        {/* Only this region scrolls */}
        <div className="flex-1 overflow-auto">
          <DataTable>
            <DataTableHead>
              <DataTableRow>
                <DataTableHeader>Network ID</DataTableHeader>
                <DataTableHeader>Business</DataTableHeader>
                <DataTableHeader>City</DataTableHeader>
                <DataTableHeader align="right">Relationships</DataTableHeader>
                <DataTableHeader>Trust</DataTableHeader>
                <DataTableHeader>Status</DataTableHeader>
              </DataTableRow>
            </DataTableHead>
            <DataTableBody>
              {filtered.map((row) => (
                <DataTableRow key={row.nrid}>
                  <DataTableCell>
                    <span className="font-mono text-xs">{row.nrid}</span>
                  </DataTableCell>
                  <DataTableCell>{row.business}</DataTableCell>
                  <DataTableCell>{row.city}</DataTableCell>
                  <DataTableCell align="right">{row.relationships}</DataTableCell>
                  <DataTableCell>
                    <span className="text-xs text-gray-500">{row.trust}</span>
                  </DataTableCell>
                  <DataTableCell>
                    <StatusBadge tone={row.tone} size="sm">
                      {row.status}
                    </StatusBadge>
                  </DataTableCell>
                </DataTableRow>
              ))}
            </DataTableBody>
          </DataTable>
        </div>

        <div className="flex-shrink-0 border-t border-gray-200 bg-white px-6 py-3">
          <ListPagination
            page={page}
            total={filtered.length}
            pageSize={25}
            onPageChange={setPage}
            itemLabel="retailer"
          />
        </div>
      </div>
    );
  },
};
