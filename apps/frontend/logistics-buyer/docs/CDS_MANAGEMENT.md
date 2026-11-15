# CDS (Cross Dock Store) Management & Logistics

A role-based CDS module inside the Logistics Buyer (LBNP) app.

**Flow:** Seller Store order (CDS Store Delivery) → Service Centre pickup planning → **Distributor Pickup Trip** → **CDS Delivery Trip** → **handover at the CDS store** (OTP; the accepted units are Ready for Delivery) → next-day **Delivery Planning** (LBNP-style routes) → **Retailer Delivery Trip** (delivery with OTP, cash / UPI collected).

Every pickup and handover point is confirmed with an OTP. There is **no GRN step** and **no returns flow**.

## Logins and roles

| Role | Login | Menu |
|---|---|---|
| LBNP (Logistics Buyer) | Existing `/auth/login` — unchanged | Existing menu — unchanged |
| CDS Service Centre | `/cds/login` · demo `9100000001` | Orders · Pickup Planning · Deliver to CDS · Trips · Reports · Settings · CDS Stores |
| CDS User (one per store) | `/cds/login` · demo `9100000002` Uppal · `9100000003` Kukatpally · `9100000004` Dilsukhnagar | Orders · Delivery Planning · Trips · Reports · Customers · Settings (the LBNP menu) |

- **OTP:** `123456` for every demo login, set in the 🧪 Mock panel.
- **Separate sessions:** the CDS login has its own session. It does not open LBNP screens, and the LBNP login does not open CDS screens.
- **Access checks:** each role sees only its own modules. Access is checked by the menu, by the route guard, and by the API on every call (HTTP 403 otherwise).
- **Store isolation:** a CDS User only ever sees and changes their own store's orders, routes, trips, customers, vehicles and delivery persons. This is also enforced by the API.
- **Why a separate login:** the existing app has a single buyer login with no multi-role support, so CDS gets its own sign-in with the same look and OTP flow. LBNP's login and roles are unchanged.
- **CDS User screens are an LBNP replica:** the six CDS User screens (`src/pages/cds/user/`) copy the LBNP Orders, Delivery Planning, Trips, Reports, Customers and Settings screens — same layout, CSS and wording — but show the store's own CDS data. LBNP features with no CDS data are left out (see below). Sign-in opens **Orders**.

## End-to-end workflow

| Step | Where | What happens |
|---|---|---|
| 1. Order allocation | `POST /cds/inbound/seller-orders` (Seller Store) | `deliveryType: CDS` → the CDS order is **Confirmed** at the store serving the retailer's locality. Idempotent by seller order ref. `deliveryType: 3PL` → forwarded unchanged to LBNP's existing intake `POST /orders`. |
| 2. Pickup Planning | Service Centre | Select confirmed orders from one or more distributors, and set or override each order's destination CDS. Assign vehicle and delivery person. This generates the **Distributor Pickup Trip** (one stop per distributor, OTP to the seller). Optionally it also generates the **CDS Delivery Trip** (one stop per CDS, OTP to the CDS User), with the same or a different vehicle. |
| 3. Deliver to CDS | Service Centre | Store-wise view of CDS delivery trips: dispatched vs accepted, and whether the OTP was verified. Picked-up orders without a CDS trip can be sent on a new **CDS Delivery Trip**. |
| 4. Handover at the CDS | CDS Delivery Trip stop | The delivery person enters the units the store accepts (at most what was dispatched) and the OTP the CDS User receives by SMS and reads out (the app does not show it on the CDS User screens). After the correct OTP the accepted units are deliverable at once: the order is **Ready for Delivery**. Picked − accepted shows on the order as **Short at handover**. Nothing handed over → the order goes back to **Picked Up** so the Service Centre can send it again. |
| 5. Orders | Both roles | Service Centre sees all stores. The CDS User sees its store's orders on the LBNP Orders screen (search, filters, cards, Order Summary / Product Details); an order coming to the store shows as In Transit to CDS until the handover. |
| 6. Delivery Planning | CDS User | LBNP steps, for tomorrow or later: delivery date → order dates → select Ready orders (filter by locality) → **Plan Routes** (the app groups orders by retailer locality and packs them on the store's own free vehicles; no 3PL) → review routes on the map, move a retailer between routes, download CSV → **Confirm Routes** (orders **Delivery Planned**; the route reserves its vehicle) → **Generate Trip** per route with the delivery person → **Retailer Delivery Trip**. |
| 7. Trips (CDS User) | CDS User | LBNP Trips screen, retailer trips only. Stops: order pickup at the CDS (OTP to the CDS User) → retailer deliveries (OTP to the retailer, cash / UPI collected for COD). The collection summary shows on the trip. |
| 8. Reports | CDS User | One **Performance Report** (From / To date, Excel): per day, orders received at the store, delivered, not delivered, delivery success rate, trips and total km. |

## Trips

- **Service Centre Trips** has two tabs: Distributor Pickup Trips (`DPT-`) and CDS Delivery Trips (`CDT-`).
- **CDS User Trips** shows only Retailer Delivery Trips (`RDT-`). Delivery routes are numbered `RT-`.
- **What every trip records:** a unique trip ID, type, delivery person, vehicle, stops (pickup and delivery locations), orders, OTP status per stop, trip status, and created / completed dates.
- **Running stops:** the Delivery Partner App isn't in this repo, so trip details let the operator run each stop on the delivery person's behalf. The operator sends the OTP, confirms quantities (plus money for COD), then verifies the OTP. A retailer or distributor stop can be marked failed with a reason (shop closed, stock not ready…), which needs no OTP because nothing changes hands. The same actions are available to the app through `/cds/dp/*`.
- **Statuses:**

| Record | Statuses |
|---|---|
| Trips | Planned → Assigned → Started → In Progress → Completed / Partially Completed; Cancelled (only before any stop is done) |
| Orders | Confirmed → Pickup Planned → Picked Up → In Transit to CDS → Ready for Delivery → Delivery Planned → Out for Delivery → Delivered / Partially Delivered; Cancelled |

- **Partial and failed outcomes:**
  - **Short pickup:** the CDS leg carries only what was collected.
  - **Short at handover:** only the accepted units are deliverable; the rest shows on the order.
  - **Failed pickup:** the order goes back to Confirmed for re-planning.
  - **Failed delivery:** the order goes back to Ready for Delivery.
  - **Cancelled retailer trip:** its orders go back to Ready for Delivery.

## OTP (4 checkpoints)

| Checkpoint | OTP sent to | Entered by |
|---|---|---|
| Distributor order pickup | Seller / distributor | Delivery person |
| Order handover to CDS | CDS User (by SMS) | Delivery person |
| Retailer order pickup at CDS | CDS User | Delivery person |
| Retailer delivery | Retailer | Delivery person |

- **Code and expiry:** a 6-digit code per stop, valid for 15 minutes (configurable in Settings).
- **Wrong codes:** locked after 3 wrong attempts (configurable); a new OTP replaces the old one.
- **No reuse:** a verified OTP can't be used again, and a completed stop can't be redone.
- **History:** every send, failure and verification is logged with time and user, and shown on the trip.
- **Code visibility:** trip views never contain the code. In this demo the SMS text is shown on screen (`demoSms`), because no SMS gateway is connected.

## Data (`src/cds/types.ts`, stored in `db.ext.cds`)

**Master data**

| Record | Contents |
|---|---|
| `stores` | CDS stores, with serviceable localities and manager |
| `distributors` | Sellers / distributors |
| `retailers` | From the existing customer master; never written back |
| `users` | CDS logins, with role and stores |
| `sessions` | CDS login sessions |
| `vehicles`, `deliveryPersons` | Owner is the Service Centre or a CDS store; kept apart from LBNP's vehicle and driver masters |
| `settings` | OTP and planning rules |

**Records**

| Record | Contents |
|---|---|
| `orders` | Line quantities: ordered, picked, accepted at the CDS, delivered |
| `plans` | Each planning action and the trips it generated; CDS User delivery routes carry the vehicle and the retailer sequence |
| `trips` | Stops, lines, OTP link and history |
| `otps` | OTP transactions |
| `collections` | Cash / UPI collected at retailer delivery |
| `dpEventIds` | Delivery Partner App events already applied, for deduplication |
| `audit` | Audit log |

- **Business rules:** `src/cds/engine.ts`. It is pure, so the same code runs in the API, the demo seed and the Node tests.
- **Status changes:** only the flows in `src/cds/status.ts` are allowed.
- **Transactions:** every write is a transaction; on error, all changes are rolled back. OTP attempt counts are still saved.

## API (`src/mock/routes/cds.ts`, service `cds-svc`)

**Sign-in and reference data**
- `POST /cds/auth/otp/send` · `/cds/auth/otp/verify` · `/cds/auth/logout` · `GET /cds/me`
- `GET /cds/meta` · `/cds/summary` · `/cds/reports/:id` · `/cds/resources`

**Orders and planning**
- `POST /cds/orders/search` · `GET /cds/orders/:id` · `POST /cds/orders/:id/cancel`
- `POST /cds/pickup/plans` · `/cds/deliver-to-cds/plans`
- `GET /cds/plans` · `/cds/deliver-to-cds/overview`
- CDS User routes: `POST /cds/delivery-routes/plan` (Plan Routes, nothing saved) · `POST /cds/delivery-routes` (Confirm Routes) · `GET /cds/delivery-routes` · `GET /cds/delivery-routes/:id` · `POST /cds/delivery-routes/:id/trip` (Generate Trip)

**Trips and OTP**
- `POST /cds/trips/search` · `GET /cds/trips/:id` · `POST /cds/trips/:id/start|cancel`
- `POST /cds/trips/:id/stops/:stopId/otp|complete|fail`
- `GET /cds/otps/mine`

**Customers, stores, settings and audit**
- `GET /cds/customers` (CDS User, view only) · `/cds/coverage` · `/cds/stores` · `PUT /cds/stores/:id`
- `GET /cds/fleet` · `POST /cds/fleet/:kind` · `/cds/fleet/:kind/:id/active` · `PUT /cds/settings` · `GET /cds/audit`

**Integrations** (header `X-Integration-Key`)
- `POST /cds/inbound/seller-orders`: Seller Store allocation.
- `GET /cds/dp/persons/:id/trips`: Delivery Partner App assignments.
- `POST /cds/dp/trips/:id/events`: Delivery Partner App events — `START` / `SEND_OTP` / `COMPLETE` / `FAIL`. Deduplicated by `eventId`; only the assigned delivery person.

## Reports

- **Service Centre:** distributor-wise pickups, CDS-wise incoming orders, pickup trips, CDS delivery trips, pending operations, trip completion — each with filters, a preview and CSV export.
- **CDS User:** the LBNP **Performance Report** only — From / To date and an Excel download with one row per day and a total row.

## LBNP features left out of the CDS User screens

They have no CDS data or need a new CDS rule:
- **Orders:** Create Order, Quick Order, Modify Delivery Address; Order Type, Sales Person and Beat columns; cancel / delete from the list; marking delivered from the map.
- **Delivery Planning:** 3PL / ONDC quotations and Overflow Routes; beats and clusters (localities are used instead).
- **Trips:** Provider, Trip Charges and Helper; Return Report and beat-wise loading sheet; Return Products tab; changing a trip's vehicle or delivery person after the trip is generated.
- **Customers:** edit and delete (the location decides which store serves the shop); Bulk, Source and Last Updated.
- **Settings:** Delivery, Beats, Clusters, Category Sequence, Payment and Users & Permissions tabs. The CDS User has Profile, Vehicles and Delivery Persons.

## Demo data

`src/cds/seed.ts` replays four days at three CDS stores through the real rules and OTPs, so every status has records:
- completed, short and partial pickups;
- CDS handovers, one short at handover;
- deliveries full, partial and failed, with cash and UPI collections;
- a confirmed delivery route at CDS Uppal waiting for its trip;
- today's running trips and CDS deliveries on the way to the stores.

The data is versioned (`CDS_STATE_VERSION`). When it changes, CDS demo data rebuilds on next use; LBNP data isn't touched. To see what the seed produces, run `node tests/seed-report.mts`.

## Tests

- **Unit tests:** `bun run test` runs `tests/cds.test.ts`, 9 test groups on the rules:
  - the seed and allocation (store by service area)
  - multi-distributor / multi-CDS pickup with OTP attempts, lock and no reuse; partial pickup carried to the CDS leg
  - the handover at the CDS: accepted units Ready for Delivery, short at handover, nothing handed over
  - LBNP-style delivery planning: Plan Routes by locality, Confirm Routes (vehicle reserved), Generate Trip
  - retailer delivery: OTP at CDS pickup and retailer, partial / failed delivery, cash / UPI collections
  - the Performance Report
  - OTP expiry and cancel rules
- **In-app end-to-end:** `tests/e2e/cdsFlow.e2e.ts`, checks through the API (how to run it is in the file; it adds records to the demo data). It covers:
  - roles, menus and store isolation (401 / 403)
  - Seller Store allocation, CDS and 3PL
  - the full flow with all 4 OTP checkpoints
  - delivery routes, retailer delivery and collections
  - Delivery Partner App events with duplicate handling
  - reports and dashboards
  - LBNP trips / vehicles / drivers / permissions unchanged

## Existing application

Only three existing files change:
- **`src/App.tsx`:** the `/cds/*` routes.
- **`src/mock/server.ts`:** `/cds/*` uses its own CDS session instead of the LBNP token.
- **`package.json`:** the `bun run test` script.

LBNP orders, Delivery Planning, Trips, vehicles, drivers and permissions are not changed by the CDS module. The only exception is that 3PL seller orders are forwarded into LBNP's existing intake, exactly as a Seller Store would send them.

## Not covered / dependencies

- **No real backend:** the repo runs on an in-browser mock backend (localStorage), like every existing feature. A production rollout needs:
  - real services and a database with migrations for the records above;
  - an SMS gateway for OTPs;
  - service credentials for Seller Store → CDS and CDS → LBNP;
  - the Delivery Partner App calling `/cds/dp/*`.
- **3PL forwarding:** it uses LBNP's current session in this demo; production needs a service account.
- **Trip start date:** trips can be started before their planned date (with a confirmation) so the demo can be exercised today.
