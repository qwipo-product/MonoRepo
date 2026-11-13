# Logistics Buyer (LBNP)

Logistics Buyer is a browser demo for orders, customers, delivery routes, trips, issues, reports and settings. It runs on an in-browser mock backend with synthetic Hyderabad distribution data. Map tiles, icons and fonts use the same external providers as the upstream app.

## Run locally

From the Mockup Labs repository root, run `bun install --frozen-lockfile`, then `bun dev --filter=@mockups/logistics-buyer`. Open [Logistics Buyer](http://localhost:5180/). For a production build, run `bun run build --filter=@mockups/logistics-buyer`. Run `bun run --cwd apps/frontend/logistics-buyer preview` to review it on port 6180.

Use demo mobile number `9876543210` and OTP `123456`. A successful sign-in opens Orders. Use `9000000000` to see an unknown user, `9111111111` to simulate the OTP service being unavailable, and `9222222222` to exercise a rejected OTP request.

## Demo users (cross-dock model)

Login shows three demo-user cards; clicking one signs in at once with the mock OTP. You can also type the number and OTP `123456`, or switch user from the 🧪 panel.

| User | Mobile | Who | Opens |
| --- | --- | --- | --- |
| Logistics Tech | `9876543210` (and any other valid number) | Distributor delivering direct through a 3PL. The original app, unchanged. | Orders |
| Service Centre | `9876543211` | CDS Service Centre: picks up from distributors, drops at Cross Dock Stores, brings returns back. | Service Centre → Orders |
| Cross Dock Store | `9876543212` | Cross Dock Store near the retailers: receives, sorts per retailer, delivers by bike, collects cash. | Cross Dock Store → Inward |

Each user sees only their own menu and pages; opening another user's URL takes you to your own home. Users, numbers, menus and home pages are defined in `src/profiles.ts`. The two cross-dock users are fixed fixtures: they carry no distributor permissions and nothing about them is persisted. `src/pages/cross-dock/phase1Pages.ts` still lists every cross-dock menu path (routes are generated from it); a page not in `BUILT` in `src/App.tsx` falls back to its phase 1 placeholder.

### Service Centre (phase 2)

| Page | What you can do |
| --- | --- |
| Orders | Today's cross-dock orders by distributor or by Cross Dock Store; filter by status, distributor, store; open an order for its history. Orders a store has received show as "At CDS" |
| Pickup Planning | Same layout as LBNP Delivery Planning. The list shows planned routes and routes already turned into trips. **Create Pickup Route**: pick a round (Round 1, Round 2, early-morning top-up), filter by distributor, tick orders, **Plan Routes** (the selection is split into routes, each given the smallest free vehicle). Open a route for its stops, customer-wise orders and products, then **Generate Trip** or **Cancel Route** |
| Return Planning | The same flow for returns waiting at the stores, for today's or tomorrow's returns window |
| Trips | Same layout as LBNP Trips: stat cards and expandable rows (route overview, order summary, stops with OTP). The trip details page has Summary, Customer Wise Orders, Ordered Products and Orders (or Return Products) tabs. Start a trip, mark each distributor pickup done (with the pickup OTP), and close each store drop with the OTP the store gives after its GRN. Cancel a trip before it starts |
| CDS Network | Map of store delivery areas, distributors and retailers (inside a live area → cross-dock, outside → direct); store and distributor tables |
| Reports | Last 7 days of drops per store (stacked chart with tooltip and a table view), weight, share reaching the store by noon, returns |
| Settings | Profile, order cut-off and time windows, vehicles and drivers (add, take off the road) |

### Cross Dock Store (phase 3)

The demo user runs **Cross Dock Store - KPHB**. It works the same data as the Service Centre: what the Service Centre drops shows up in Inward, and what riders bring back shows up in the Service Centre's Return Planning.

| Page | What you can do |
| --- | --- |
| Inward | One row per Service Centre truck coming to the store (LBNP Trips layout), with the distributors on board and status Scheduled, On the way, At store, GRN done or Received. Open a truck for its goods received note (GRN) |
| Inward → GRN | **Product View (GRN)**: one line per product across every distributor on the truck (for example 10 atta, 5 noodles). Enter the received and damaged count for each product. **Customer View**: the retailers the goods are for. **Confirm GRN** asks again if any count does not match. After the GRN, the store's OTP appears; the store tells it to the driver. When the driver enters it, the truck is closed and its orders go to Delivery Planning as "Ready for planning" |
| Orders | Orders grouped by retailer (one drop per retailer, any number of sellers) for today or tomorrow; filter All, Ready for planning, Out for delivery, Delivered or returned |
| Delivery Planning | Same layout as LBNP Delivery Planning. **Create Delivery Route**: pick today or tomorrow, tick orders that are ready for planning, **Plan Routes** (split into routes of up to 30 orders, each given a free rider). Open a route for its stops, customer-wise orders and products, then **Generate Trip** or **Cancel Route** |
| Trips | Riders' trips in the LBNP Trips layout, with each retailer's delivery OTP and the collection. On the trip details page, send the rider out, record each drop with the retailer's delivery OTP (delivered or returned per order, cash and UPI), or cancel a trip before the rider leaves |
| Returns | Orders riders brought back, held for the Service Centre's returns trip, and what has been handed over |
| Cash & Deposits | Collections per day and per rider (cash and UPI) against what was due; record deposits to Qwipo with a UTR or slip number |
| Reports | Last 7 days of deliveries (chart with tooltip and table), return rate, collected and deposited |
| Settings | Store profile, delivery area on a map (read-only), riders (add, mark off duty) |

Store rules (shown as on-screen messages): a GRN can be confirmed only after the truck has finished its pickups; damaged units cannot exceed the received count; the driver's OTP is accepted only after the GRN and must match; short and damaged units are taken off what the retailer pays; a delivery route holds orders for one date; a rider runs one trip at a time, up to 30 orders; a drop with delivered orders needs the retailer's delivery OTP; cash + UPI must equal what is due on the delivered orders; a deposit cannot exceed what is waiting to be deposited for that day.

Simulated behaviour: the cross-dock data (`src/mock/crossDock/state.ts`, routes in `src/mock/routes/crossDock.ts`) is a fixed Kukatpally-pilot scenario on today's date: 3 live stores (KPHB, Moosapet, Nizampet) and Alwal onboarding, 9 distributors (one HUL self-delivery, one direct-only), about 50 orders. Each order carries product lines from the product catalog, so a truck's GRN totals products across distributors. Round 1 has one trip completed, one on the road and one planned. The on-the-road truck (PK-…-02) has finished its pickups and stands at KPHB with orders from three distributors, waiting for the store's GRN. Its later drops at Nizampet and Moosapet wait for the same. One Round 2 route is planned and waits for Generate Trip, and late orders are still waiting to be planned. Orders for retailers outside every live area are already sent to direct delivery. One returns trip ran this morning and today's returns wait at the stores. Yesterday's batch (34 orders) was picked up yesterday, received at the stores last evening (one KPHB GRN recorded a shortage) and is being delivered today. At KPHB, one rider trip is done (one order returned), one rider is still out, and two retailers are ready for planning. Moosapet and Nizampet have finished their trips. In the real flow the driver types the store's OTP in the driver app, and the retailer gives the delivery OTP to the rider in the Field Agent App. In this demo both are entered on screen: the driver OTP on the store's GRN page or the Service Centre trip page, the retailer OTP in the store's Record delivery dialog. Each OTP is shown on screen so you can type it. Earlier days in Reports and Cash are sample totals. Clock times are fixed (Round 1 runs 2–4 PM), so before then some events look "in the future". The scenario re-seeds when the date changes, when its data version (`XD_VERSION`) changes, or on **Reset synthetic data**. Trips move only when you press the buttons; nothing advances on its own. Rule errors (vehicle busy, over capacity, stops out of order, wrong OTP) come back as HTTP 422 with the message shown on screen. The cross-dock Trips and Planning screens reuse the LBNP stylesheets (`src/pages/trips/*.css`, `src/pages/delivery-routes/*.css`) through shared components in `src/pages/cross-dock/lbnp/` and `src/pages/cross-dock/planning/`. Cross-dock maps use OpenStreetMap tiles because the upstream CARTO tiles now need an API key.

## Mock controls (🧪 button, bottom-right)

Not part of the original UI — a developer panel to exercise every state:
- **Demo user**: switch between Logistics Tech, Service Centre and Cross Dock Store
- **Latency** slider (loading spinners, double-click races)
- **Force API failure**: next request / all requests / only paths containing X, with status + message
- **Mock OTP** value
- **Expire token** (next call → 401 → silent refresh → retry) and **Revoke session** (refresh fails → logout)
- **Buyer type** SELF_3PL / DARKSTORE for the Logistics Tech user (DARKSTORE unlocks the Trips bulk seller-download bar)
- **Reset synthetic data** (data you create/edit is persisted in `localStorage` until reset)

## Things that happen on their own (simulated backend)

- **Trips in progress advance** one stop every ~45 s (Out for Delivery → At Delivery → Delivered → trip Completed)
  and push live updates to an open Trip Details page. Console: `__lbnpTrips.simulator.pause() / resume() / tick()`.
- **Delivery Planning**: seeded route plans count down in real time; one auto-confirms into a trip (~100 s after first
  visit), one fails (~50 s). "Generate Trip" creates a real trip ~12 s later via a live "tripCreated" event.
- **Issues**: after you act on an issue, the logistics provider "replies" 5–15 s later (or immediately via *Issue Status*).

Tips: Create Delivery Route only produces *Overflow* routes with the default 3PL mode. Switch Settings → Delivery →
Logistics Selection to *Self* or *Self + 3PL* (and Route Engine to *Cluster Beat Optimizer*) to see Planned routes and
the unassigned-beats dialog.

## Source

Imported from [qwipo-product/LBNP main at daa557d](https://github.com/qwipo-product/LBNP/tree/daa557de8e18f834c74798216ac7a612b401bc1b). The application code is in `src/`, the mock services are in `src/mock/`, and the browser configuration is in `public/assets/configs/config.json`. Refer to the [upstream technical guide and screen specifications](https://github.com/qwipo-product/LBNP/tree/daa557de8e18f834c74798216ac7a612b401bc1b/docs).

## Deployment

Register **Logistics Buyer - Build** with [docker-build.yml](docker-build.yml) and **Logistics Buyer - Deploy** with [azure-release.yaml](azure-release.yaml) in the Azure DevOps `Mockups Lab` folder. Both definitions initially use `dev` as their default branch. The build publishes the `mockups-logistics-buyer` image. The release updates its version in the existing `Qwipo B2B/k8s` manifest at `bms-chart/<environment>/mockups-logistics-buyer.yaml` and syncs ArgoCD.

| Branch | Target |
| --- | --- |
| `dev` | [Dev](https://mockups-logistics-buyer.dev.bms.qwipo.com/) |
| `testing` | [Testing](https://mockups-logistics-buyer.test.bms.qwipo.com/) |
| `staging` | [Staging](https://mockups-logistics-buyer.staging.bms.qwipo.com/) |
| `main` | [Production](https://mockups-logistics-buyer.bms.qwipo.com/) |

Dev images use `dev-<commit>`. Main releases use the Git tag prefix `logistics-buyer-v`. Feature branches publish static previews under the dev host’s `/builds/` path. Use the URL printed by the build. Previews navigate with hash routes. The main site uses normal browser paths such as `/orders` and `/trips`.
