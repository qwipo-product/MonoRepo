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

### Ops (Logistics)

Data-point parity with the team's reference build
(logistics-tech-dashboard.vercel.app, "Logistics Analytics Platform v2.4.1").
Every figure in `src/data/logistics.ts` is lifted from that app's deployed
bundle — network and per-company totals, the 13-distributor performance
snapshot, 16 drivers, category mixes, the vehicle master — including panels
the reference's own UI currently hides. Period modelled: May 2026, pan-India.
Page names mirror the reference (Summary · Orders · Trips); renaming and the
drill grammar are a UX-round decision.

- **Summary** — this-year tiles and onboarded-company cards; network KPIs,
  weekly trend, status distribution, returns split (cancelled vs delivery
  retry), category contribution, company operations table, distributor
  comparison.
- **Orders** — order KPIs (dispatch vs net sales), D0 → D4+ delivery ageing
  per distributor with overdue share, daily volume trend with a
  count / amount / weight / unique-buyers toggle.
- **Trips** — fleet KPIs, the utilization quad, trips per day, run-time
  slabs by city, distributor trip-efficiency table (click → that
  distributor's drivers), driver performance analytics, vehicle master.
- **Reports → Ops** — the reference's two report shapes (Company Report,
  Distributor Report) with their exact sheet and column contracts
  ("Sheet columns" toggle in the catalogue). The three earlier placeholder
  ops reports are kept pending a UX-round decision.

### DigiDukaan · Buyer (sales team)

Data from the buyer-app database — Telangana, Maharashtra, Rajasthan.
One generated world in `src/data/buyer.ts` and one set of KPI maths in
`src/data/buyerMetrics.ts`, so every number agrees across pages and drawers.

**Dashboards, not reports** (Siva's rule, Oct 2026): a dashboard is for
making a decision at a glance — KPI cards first, then comparisons as charts.
Table data is a report: it lives under Reports → DigiDukaan · Buyer and
downloads as Excel. No tables on these three pages; each ends with a hand-off
card to its report.

**Written for the sales team** (Oct 2026): business people chasing a
monthly number, not analysts. Their words (sales, orders, shops, new shops,
target, to go, per day), their periods (today, this week, this month) and
charts anyone reads — target bars, plain bars, ranked bars, pies. No
scatters or quadrants. The pages open on **Month to date** because targets
are monthly.

- **Scope bar** — same chip grammar as the seller ScopeBar: Date, State,
  City, **Seller type** (Distributors / Wholesalers — Qwipo is a marketplace
  and lists both), Seller, Team, a Filters panel, and one **universal
  search** (seller, salesperson or shop) that opens that entity's drill-down
  dashboard. Shared by all three pages and kept while navigating. KPIs
  compare with the equal-length period just before the range.
- **Sales dashboard** — this month's target (achieved, where we should be
  today, still to go, needed per day vs doing per day); Today / This week /
  This month cards; five KPIs (sales, orders, shops ordered, new shops, avg
  order value); sales per day against the daily target; Attention;
  salesperson leaderboard; top sellers tagged D / W; pies for distributors
  vs wholesalers, beat visit vs shop self-order, order status; sales by
  city. With a seller filter on, the target card says why it can't compare.
- **BA performance** — team KPIs; one salesperson scoreboard that switches
  between sales vs target, orders, orders today, new shops and shops
  ordered; Attention; teams compared (click = Team filter); star performers
  (top 3 per number); new shops per week.
- **Customers** — base KPIs, the customer journey funnel (onboarded → first
  order → repeat → regular → active), Attention, where customers go quiet by
  city, new outlets per week, top customers, KYC blockers.
- **Drill-down dashboards** (`src/components/buyerDrill.tsx`) — one entity,
  cards first: seller, salesperson (today / this week / this month, month
  target with to-go and needed per day, orders, shops, new shops, order
  status, beats, call list) and shop. They stack with
  Back; the bottom of every drill is a short record list with a link to the
  full report. Any card, bar, dot, stage or search result opens one.

Reports is split the same way: DigiDukaan · Seller, Ops (Logistics),
DigiDukaan · Buyer (`#reports/<seller|ops|buyer>`).

### Buyer app analytics

PostHog-style product-analytics boards for the buyer app (sample data), moved
in from the retired `buyer-analytics` app and rebuilt on this app's kit.
Its own sidebar group (between DigiDukaan · Buyer and Reports) holding
Overview, App screens (ten boards), Funnels and Session recordings
(`#buyer-analytics[/<board>]`; old `#reports/analytics:<board>` links redirect).
Screen: `src/screens/BuyerAppAnalytics.tsx`; engine, board definitions and
charts in `src/buyerapp/`.

- **Overview** — north-star metric, orders per day, four KPIs, key funnels, "what changed".
- **App screens** — ten boards (Home, Search, Categories/Brands/Distributors,
  Product List, Cart, Order Summary, Orders, Profile, Onboarding/KYC, Reorder),
  each opening with one line (“came → did something → left without doing
  anything”), then 4 headline numbers, then every tracked action as a plain
  sentence: how many buyers did it, what they did next, how many didn’t carry on.
- **Funnels** — Purchase, Search, Distributor, Reorder, Onboarding, plus common paths.
- **Session recordings** — problem counts by page and a list of recordings by buyer ID.

One filter bar shared by every board and kept while navigating: date range
(7 / 30 / 90 days), State → City picker, Platform, Buyers (new / returning),
Version. Adding a tracked action means adding a row in `src/buyerapp/boards.ts`.

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
