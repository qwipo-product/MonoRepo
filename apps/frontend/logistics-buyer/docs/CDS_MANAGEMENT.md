# CDS (Cross Dock Store) Management & Logistics

A role-based CDS module inside the Logistics Buyer (LBNP) app.

**Flow:** Seller Store order (CDS Store Delivery) → Service Centre pickup planning → **Distributor Pickup Trip** → **CDS Delivery Trip** → CDS User **GRN** (distributor-wise) → next-day **Delivery Planning** → **Retailer Delivery Trip** (delivery, collections, returns) → return handover at the CDS → Service Centre **Return Planning** → **CDS Return Trip** → handover to the seller.

Every pickup and handover point is confirmed with an OTP. Collections and settlements are manual.

## Logins and roles

| Role | Login | Menu |
|---|---|---|
| LBNP (Logistics Buyer) | Existing `/auth/login` — unchanged | Existing menu — unchanged |
| CDS Service Centre | `/cds/login` · demo `9100000001` | Orders · Pickup Planning · Deliver to CDS · Return Planning · Trips · Reports · Settings · CDS Stores |
| CDS User (one per store) | `/cds/login` · demo `9100000002` Uppal · `9100000003` Kukatpally · `9100000004` Dilsukhnagar | GRN · Orders · Delivery Planning · Trips · Collections & Payments · Returns · Reports & Settings · Retailers |

- **OTP:** `123456` for every demo login, set in the 🧪 Mock panel.
- **Separate sessions:** the CDS login has its own session. It does not open LBNP screens, and the LBNP login does not open CDS screens.
- **Access checks:** each role sees only its own modules. Access is checked by the menu, by the route guard, and by the API on every call (HTTP 403 otherwise).
- **Store isolation:** a CDS User only ever sees and changes their own store's orders, GRNs, trips, returns and collections. This is also enforced by the API.
- **Why a separate login:** the existing app has a single buyer login with no multi-role support, so CDS gets its own sign-in with the same look and OTP flow. LBNP's login and roles are unchanged.

## End-to-end workflow

| Step | Where | What happens |
|---|---|---|
| 1. Order allocation | `POST /cds/inbound/seller-orders` (Seller Store) | `deliveryType: CDS` → the CDS order is **Confirmed** at the store serving the retailer's locality. Idempotent by seller order ref. `deliveryType: 3PL` → forwarded unchanged to LBNP's existing intake `POST /orders`. |
| 2. Pickup Planning | Service Centre | Select confirmed orders from one or more distributors, and set or override each order's destination CDS. Assign vehicle and delivery person. This generates the **Distributor Pickup Trip** (one stop per distributor, OTP to the seller). Optionally it also generates the **CDS Delivery Trip** (one stop per CDS, OTP to the CDS User), with the same or a different vehicle. |
| 3. Deliver to CDS | Service Centre | Store-wise view of CDS delivery trips: dispatched vs received, and whether the OTP was verified. Picked-up orders without a CDS trip can be sent on a new **CDS Delivery Trip**. |
| 4. GRN | CDS User | Each CDS handover raises **one GRN per distributor**, linked to the orders, CDS store, CDS trip and pickup trip. Received quantity comes from the OTP-verified handover; short and excess are recorded. The CDS User enters accepted and damaged quantities, with remarks required for any issue. Generating the GRN sets orders to **GRN Completed → Ready for Delivery**. Damaged items become returns to the distributor. |
| 5. Orders | Both roles | Service Centre sees all stores; the CDS User sees retailer-wise orders of their store. Detail shows quantities at each stage (ordered, picked, received, accepted, damaged, delivered, returned), trips, GRN, returns, collections and history. |
| 6. Delivery Planning | CDS User | Next-day plans only. Select ready orders, and returns to collect, retailer-wise. Assign one of the store's vehicles and delivery persons. This generates the **Retailer Delivery Trip**. |
| 7. Trips (CDS User) | CDS User | Retailer-wise trips only. Stops: CDS order pickup (OTP to the CDS User) → retailer deliveries (OTP to the retailer, COD collected) → return collection (OTP to the retailer) → return handover at the CDS (OTP to the CDS User; accepted / rejected recorded). |
| 8. Retailer returns | CDS User | Initiated from a delivered order (collected on the next trip), or collected during a visit ("Collect a return"). Reason and condition are recorded per item. |
| 9. Return handover at CDS | Trip stop | Accepted and rejected quantities are recorded; the return becomes **Received at CDS**. |
| 10. Return Planning | Service Centre | Next-day plans. Returns at the CDS stores are grouped distributor-wise. This generates the **CDS Return Trip**: CDS pickups (OTP to the CDS User), then seller handovers (OTP to the seller). Ends with **Delivered to Seller → Completed**. |
| Collections & Payments | CDS User | Manual. Delivery person collects (amount, mode) → **Received by CDS** (any difference needs a note) → **Handed to Qwipo (SNP)** with a deposit / UTR reference → **Settled** with Qwipo's settlement reference. Qwipo settles with Sellers, Logistics, Buyer (BNP), Qwipo (SNP) and ONDC outside the system. There is no payment gateway. |

## Trips

- **Service Centre Trips** has exactly three tabs: Distributor Pickup Trips (`DPT-`), CDS Delivery Trips (`CDT-`) and CDS Return Trips (`CRT-`).
- **CDS User Trips** shows only Retailer Delivery Trips (`RDT-`), and sits right after Delivery Planning in the menu.
- **What every trip records:** a unique trip ID, type, delivery person, vehicle, stops (pickup and delivery locations), orders or returns, OTP status per stop, trip status, and created / completed dates.
- **Running stops:** the Delivery Partner App isn't in this repo, so trip details let the operator run each stop on the delivery person's behalf. The operator sends the OTP, confirms quantities (plus money for COD, or accepted / rejected for returns), then verifies the OTP. A stop can be marked failed with a reason (shop closed, stock not ready…), which needs no OTP because nothing changes hands. The same actions are available to the app through `/cds/dp/*`.
- **Statuses:**

| Record | Statuses |
|---|---|
| Trips | Planned → Assigned → Started → In Progress → Completed / Partially Completed; Cancelled (only before any stop is done) |
| Orders | Confirmed → Pickup Planned → Picked Up → In Transit to CDS → Received at CDS → GRN Completed → Ready for Delivery → Delivery Planned → Out for Delivery → Delivered / Partially Delivered → Returned; Cancelled |
| Returns | Return Initiated → Picked Up from Retailer → Received at CDS → Return Planned → Picked Up from CDS → Delivered to Seller → Completed |

- **Partial and failed outcomes:**
  - **Short pickup:** the CDS leg carries only what was collected, and the GRN shows the shortage.
  - **Failed pickup:** the order goes back to Confirmed for re-planning.
  - **Failed delivery:** the order goes back to Ready for Delivery.
  - **Return not collected:** it stays initiated.
  - **Seller refuses the returned goods:** they go back to Received at CDS.

## OTP (all 8 checkpoints)

| Checkpoint | OTP sent to | Entered by |
|---|---|---|
| Distributor order pickup | Seller / distributor | Delivery person |
| Order handover to CDS | CDS User (shown on their GRN page) | Delivery person |
| Retailer order pickup at CDS | CDS User | Delivery person |
| Retailer delivery | Retailer | Delivery person |
| Return collection from retailer | Retailer | Delivery person |
| Return handover to CDS | CDS User | Delivery person |
| Return pickup from CDS | CDS User (shown on their Returns page) | Delivery person |
| Return handover to seller | Seller / distributor | Delivery person |

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
| `orders` | Line quantities through every stage |
| `plans` | Each planning action and the trips it generated |
| `trips` | Stops, lines, OTP link and history |
| `otps` | OTP transactions |
| `grns` | Distributor-wise, linked to the CDS trip, pickup trips and orders |
| `returns` | Retailer and GRN-damage returns, with line quantities at each step |
| `collections` | Each step of the manual handover |
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
- `POST /cds/pickup/plans` · `/cds/deliver-to-cds/plans` · `/cds/return-planning/plans` · `/cds/delivery/plans`
- `GET /cds/plans` · `/cds/deliver-to-cds/overview`

**Trips and OTP**
- `POST /cds/trips/search` · `GET /cds/trips/:id` · `POST /cds/trips/:id/start|cancel`
- `POST /cds/trips/:id/stops/:stopId/otp|complete|fail|returns`
- `GET /cds/otps/mine` · `/cds/incoming`

**GRN, returns and collections**
- `POST /cds/grns/search` · `GET /cds/grns/:id` · `POST /cds/grns/:id/complete`
- `POST /cds/returns/search` · `/cds/returns` · `/cds/returns/:id/cancel`
- `POST /cds/collections/search|receive|handover|settle`

**Stores, settings and audit**
- `GET /cds/retailers` · `/cds/stores` · `PUT /cds/stores/:id`
- `GET /cds/fleet` · `POST /cds/fleet/:kind` · `/cds/fleet/:kind/:id/active` · `PUT /cds/settings` · `GET /cds/audit`

**Integrations** (header `X-Integration-Key`)
- `POST /cds/inbound/seller-orders`: Seller Store allocation.
- `GET /cds/dp/persons/:id/trips`: Delivery Partner App assignments.
- `POST /cds/dp/trips/:id/events`: Delivery Partner App events — `START` / `SEND_OTP` / `COMPLETE` / `FAIL`. Deduplicated by `eventId`; only the assigned delivery person.

## Reports

Every report has filters (date range, CDS store, distributor, retailer, status as relevant) and CSV export. A live KPI strip sits at the top of Orders / GRN / Reports.

- **Service Centre:** distributor-wise pickups, CDS-wise incoming orders, pickup trips, CDS delivery trips, CDS return trips, pending operations, return quantities, trip completion.
- **CDS User:** GRN, distributor-wise received goods, retailer-wise orders, delivery planning, retailer trips, delivered and pending orders, retailer returns, collections and payments.

## Demo data

`src/cds/seed.ts` replays four days at three CDS stores through the real rules and OTPs, so every status has records:
- completed, short and partial pickups;
- GRNs pending and generated;
- deliveries full, partial and failed;
- returns at every step;
- a completed and a running CDS Return Trip;
- collections at every stage;
- today's running trips.

The data is versioned (`CDS_STATE_VERSION`). When it changes, CDS demo data rebuilds on next use; LBNP data isn't touched. To see what the seed produces, run `node tests/seed-report.mts`.

## Tests

- **Unit tests:** `bun run test` runs `tests/cds.test.ts`, 8 test groups on the rules:
  - allocation
  - multi-distributor / multi-CDS pickup with OTP attempts, lock and no reuse
  - partial pickup carried to the CDS leg
  - distributor-wise GRN with shortage / damage → return
  - next-day delivery, OTP at CDS pickup and retailer, partial / failed delivery, collections, ad-hoc return, accepted / rejected handover
  - CDS return trip to sellers
  - collections workflow
  - OTP expiry and cancel rules
- **In-app end-to-end:** `tests/e2e/cdsFlow.e2e.ts`, 62 checks through the API (how to run it is in the file). It covers:
  - roles, menus and store isolation (401 / 403)
  - Seller Store allocation, CDS and 3PL
  - the full flow with all 8 OTP checkpoints
  - GRN, deliveries, collections, returns and return trips
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
