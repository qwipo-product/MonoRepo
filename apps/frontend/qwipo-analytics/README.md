# @mockups/qwipo-analytics

**Qwipo Analytics** — the DigiDukaan (ONDC eB2B) analytics console plus the
Reports framework. Desktop web.

```bash
bun dev --filter=@mockups/qwipo-analytics
```

http://localhost:5177

## What's in it

- **Overview** — KPIs that drill into the orders behind them, Attention
  items, the trend chart, open-orders ageing, contribution leader cards.
  Nothing navigates away; everything opens a drawer.
- **Sales** — month-wise sales with the returned slice, days to deliver,
  order size and returns panels, hover tooltips, month drill.
- **Distributors** — leaderboard (top 8, show all), distributor detail drawer.
- **Customers & Onboarding** — outlet funnel with stage chips and drill-downs.
- **Reports** — one table; Run, History and Schedule drawers that reuse the
  dashboard's filter controls.

### DigiDukaan · Buyer (sales team)

Data from the buyer-app database — Telangana, Maharashtra, Rajasthan.
Its own scope bar (dd-mm-yyyy range + State / City / Distributor) shared by
the three pages; one generated world in `src/data/buyer.ts`, so every number
agrees across pages.

- **Sales dashboard** — summary cards, Distributors and customer-wise Orders
  tables, each with its own Export (CSV).
- **BA performance** — target vs achievement, coverage, beat share, today's
  orders, attention tiles; BA drawer with beats and a call list.
- **Customers** — the outlet database: beat, BA, mapped + discoverable
  distributors, KYC, Active / Dormant / Never ordered; customer drawer.

Reports is split the same way: DigiDukaan · Seller, Ops (Logistics),
DigiDukaan · Buyer (`#reports/<seller|ops|buyer>`).

One app-wide scope bar (Date range, Company, City, Distributor) that
survives navigation; entity filters live in a right-side panel, the date
range in its own popover.

## Built on the mobile kit — a known exception

This is a desktop console on `@mockups/ui` + `@mockups/design-tokens`,
because it was started before `@mockups/web-ui` existed. Its `Shell`
(collapsible sidebar), drawers, calendar, date fields and filter panel are
app-local counterparts of things the web kit now has. Moving it onto the
web kit is its own piece of work — `brief` it first. Until then, don't mix
`@mockups/web-ui` or `web-tokens` into this app.

## Chart palette and primitives

The categorical hues and the ageing ramp are tokens in
`@mockups/design-tokens` (`--chart-*`, light and dark). This app's
domain → hue mapping is `src/components/chartClasses.ts`; that mapping is
the only opinion the app holds. The generic chart pieces (`RankedRow`,
`Columns`, `StackBar`, `HBars`, `Stat`) live in `@mockups/components`, with
stories in the mobile Storybook.

Data is app-local under `src/data/` — aggregated series and entity rows
the shared fixtures don't model.
