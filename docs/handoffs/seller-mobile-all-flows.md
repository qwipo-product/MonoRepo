# Handoff: Seller Mobile — all flows
date: 2026-10-03
status: **Approval pending — reviewed with the product owner 2026-10-02/03; awaiting sign-off**
mockup: `apps/frontend/seller-mobile` (branch `seller-mobile/scaffold`) · `bun dev --filter=@mockups/seller-mobile` → http://localhost:5178 · demo login: number pre-filled (9900000002), OTP **123456** · `9000000000` = "No seller assigned"
approved by: — (pending)
build plan: seller-platform `docs/SELLER-MOBILE-APP-PLAN.md` (branch `feature/seller-mobile-app`)
test cases: `docs/handoffs/seller-mobile-e2e-cases.md`

The seller portal on a phone, for a distributor's owner and ops staff. **Seller logins only** — no super-admin pages. Users are **not tech-savvy**: every action is a visible, labelled button a tap or two away; plain words ("Products", not "SKU"); risky actions ask first, everyday actions don't. **English and Telugu** throughout (store, product and beat names stay as data).

All endpoints below are seller-core-service routes (verified in `seller-platform/apps/backend/seller-core-service/src/routes/*.ts`). Every call carries `Authorization: Bearer <token>` and `X-Seller-Id`; bodies are camelCase; errors are `{ error, code, details?, traceId }`.

---

## Flows in scope

- Sign in with mobile + OTP; with one seller the app goes straight to Home — screens: Login, OTP, (Choose seller only if 2+), No seller assigned, Session expired.
- See what needs doing now — screens: Home.
- Confirm, cancel, deliver and hand over orders, one or many — screens: Orders, Order page; sheets: Confirm, Cancel, Mark delivered, Move to logistics / dark store, Filter, Route on map.
- Keep products sellable — screens: Products, Product page, Edit product; sheets: Price, Offer, Section edit, Photo preview, Filter, Bulk update.
- Look after customers — screens: Customers, Customer page; sheets: Filter, Block / unblock.
- Run offers (Buy more, save more / QPS) — screens: Offers & Schemes, Create offer; sheets: Offer details, Offer edit.
- Settings and account — screens: More, Store settings, Order settings, WhatsApp & notifications, Profile, Support; sheets: Language, Sign out.

## Shared behaviour (every screen)

- **Delivery block** — the tinted block that leads every order and customer card: **Beat** (or "Quick delivery" for non-beat), **Expected delivery** date ("Delivered on" once delivered), **Area · pincode**, **Mobile** (tap to call). The order page and customer page show the **full address** instead of area · pincode. Business name leads every card.
- **States** — every list has an empty state (day-one seller); every page has loading (skeleton) and error ("Couldn't load this page — Check your internet and try again" + **Try again**). Session ended → Session expired screen. Success messages appear for 2.5 s at the bottom and don't cover action bars.
- **Filters** — one filter sheet per list (header icon with a dot when a filter is on, **Clear** inside). No counts under tabs. No summary line above lists.
- **Bulk** — header **Select** → tick boxes on cards → bottom bar with the main action (and **More** for the rest); **Select all / Clear all**; **Done** leaves selection. Ticks survive "Go back" on a sheet and clear once the action has changed the data.
- **Dates** follow the app language. Money shows with ₹ and two decimals.
- **testIDs** — kebab-case: `<screen>-body`, `<screen>-skeleton`, `<feature>-<element>` (examples per screen below).

---

## Screens

### Login
- shows: Qwipo / ONDC DigiDukaan lockup; "Welcome back — Sign in with your mobile number"; +91 field (10 digits, starts 6–9); **Send OTP**; language chips English / తెలుగు.
- states: invalid number → "Enter a valid 10-digit mobile number" under the field (on submit only); number not registered → "Mobile number not registered. Please use a registered number."
- writes: auth-service `POST {authApiUrl}/otp/send`.
- testIDs: `login-body`, `login-mobile-input`, `login-send-otp`, `login-language-te`.
- fake here: number pre-filled; any 10-digit number proceeds; `9000000000` routes to No seller assigned.

### OTP
- shows: "Enter OTP — We sent a 6-digit code to your mobile"; 6 boxes; **Verify & Sign In**; "Send OTP again in 23s" then **Send OTP again**; Back to change number.
- states: wrong code → "Wrong OTP. Check the code and try again."; expired (10 min) → verify disabled.
- writes: auth-service `POST {authApiUrl}/otp/verify` → access + refresh token; then `GET /api/me/sellers`.
- rules: one seller → straight to Home; 2+ → Choose seller; 0 → No seller assigned. The session survives app restarts (refresh token kept securely).
- testIDs: `otp-body`, `otp-digit-1…6`, `otp-verify`, `otp-resend`.
- fake here: code 123456 only.

### Choose seller (only with 2+ memberships)
- shows: business name, seller ID · role (Owner / Staff); "Wrong account? Sign out".
- reads: `GET /api/me/sellers`.
- fake here: the demo login has one seller, so this screen does not appear in the demo.

### No seller assigned / Session expired
- No seller: plain explanation + **Sign out**.
- Session expired: "Your session has ended — sign in again to continue" + **Sign in again**. Shown when a 401 survives one refresh-and-retry; a `seller_inactive` 403 signs out; tenant errors return to Choose seller.

### Home (tab)
- shows: "Namaste, {first name}", business name, status pill **Taking orders** / **Orders paused**; paused → warning with **Turn on** (→ Store settings).
  - **New orders** card: "{n} new orders to confirm", today's order count and value, **See new orders** (→ Orders, New).
  - **Coming deliveries**: next three delivery days; each row shows the beats (or Quick delivery) with order counts and the day's value; tap → Orders filtered to that day. Orders held by a logistics partner are excluded.
  - **Products that can't sell now**: "{n} out of stock", "{n} with details missing" → Products with that filter.
- reads: orders list + products list (no new endpoint).
- states: empty seller → "No new orders", "Nothing to deliver yet", attention card hidden.
- testIDs: `home-body`, `home-new-orders`, `home-delivery-day-<date>`, `home-attention-out-of-stock`.

### Orders (tab)
- shows: tabs **All · New · Confirmed · Logistics · Delivered · Cancelled** (Logistics only if the seller has a logistics or dark-store connector); search (store, beat, mobile, order no.); delivery-day chips on New / Confirmed ("All days", one per date); header **Filter** and **Select**.
- card: business name; company · "Placed 2 Oct, 9:12 am"; delivery block (beat, expected delivery, area · pincode, mobile); order no. (copy); **Order details**; order value · item count; payment ("Cash on delivery" / "Paid online"); status badge (New / Confirmed / Packed / Shipped / Delivered / Cancelled by you / Cancelled by store).
  - New: **Cancel** · **Confirm**. Confirmed (not with logistics): **Mark as delivered**. Logistics: partner, status, AWB, note "These orders are with the logistics partner — they update by themselves." Cancelled: area and the reason in red.
- filter sheet: Order type (All / Beat / Non-beat) · Cancelled by (All / Customer / Seller) · Company (multi).
- bulk: New → **Confirm (n)**, **Cancel (n)**, View on map. Confirmed → **Mark delivered (n)**, **Cancel (n)**, **Move to Logistics (n)** (if connector), **Move to Dark Store (n)** (if connector), View on map.
- rules: confirming **one** order is one tap with no dialog (everyday action); bulk confirm, any cancel and any deliver ask first. An order held by a logistics partner can't be cancelled or delivered from the phone.
- reads: `POST /api/me/orders` (tab statuses, delivery date, order type, cancelled-by, company, search, paging); `POST /api/me/orders/filter-summary` (delivery-day chips).
- writes: `PATCH /api/me/orders/bulk-actions` — `CONFIRM` / `CANCEL` (+ reason) / `MARK_DELIVERED` / `REQUEST_LOGISTICS` / `MOVE_TO_DARKSTORE`; one order = a one-item list.
- states: per-tab empty text ("No new orders — When a store orders from you, the order shows up here.", …); no-match search.
- testIDs: `orders-body`, `orders-tab-<tab>`, `orders-filter`, `orders-select`, `order-card-<orderId>`, `order-card-confirm`, `order-card-cancel`, `orders-bulk-primary`, `orders-bulk-more`.

### Confirm / Cancel / Mark delivered sheets
- Confirm (bulk): "Confirm {n} orders? — The store is told, and you can start packing." list of stores + values; **Yes, confirm {n}** / Go back.
- Cancel: "Cancel this order? — Pick a reason"; the portal's **11 reasons** in portal order: One or more items in the order not available · Store not responsive · Technical issue in merchant device · Order received during non-operational hours · Order received during store rush · Retail buyer not found or cannot be contacted · Retail buyer refuses to accept delivery · Delivery address incorrect or not found · Force majeure (accident / strike / law & order situation) · Order not serviceable · Order confirmation failure. "The store is told. You cannot undo this." **Cancel order** disabled until a reason is picked.
- Mark delivered: "Mark as delivered? — Do this only after the store has the goods. You cannot undo this." **Yes, delivered**.
- Move to logistics / dark store: "Send {n} orders to {partner}?" list → **Send** → result per order ("Sent" / reason when not sent) → **Done**.
- Route on map: ticked orders as stops (store, area, beat) + **Open route in Google Maps** (stops without a location are skipped and counted).

### Order page
- shows: order no. + status badge; cancelled banner (by you / by store, when, reason — store cancellations add "Auto-processed via the buyer app — no seller action required"); logistics block (partner, status, AWB) when held by a partner.
  - Customer card: business name; owner · mobile; delivery block with **full address**; **Call**, **WhatsApp**, **Map** (exact location; falls back to address with "Exact location not set"), **Share with delivery agent**.
  - Facts: company, marketplace (ONDC), marketplace order no. (copy), placed, payment, store GST number ("Not registered").
  - Items (read-only — the portal does not edit quantities): photo, name, pack, SKU code, qty × price, line total; "Not available" badge for items the distributor's system reported out of stock; offer lines show the struck base price and "Buy more, save more · 4% off · saved ₹127.20 · QPS-1051"; footer **Offer savings −₹…** and **Order value**.
  - Bottom bar: New → **Cancel** · **Confirm order**; Confirmed (not with logistics) → **Cancel** · **Mark as delivered**.
- reads: `GET /api/me/orders/{orderId}`.
- writes: bulk-actions with one id.
- testIDs: `order-body`, `order-confirm`, `order-cancel`, `order-deliver`, `order-share`, `order-map`.

### Share with delivery agent (order) / Share location (customer)
- opens WhatsApp (`wa.me/?text=`) with: store name (bold), owner · mobile, full address, beat, Google Maps link by exact location; the order version adds order no., delivery day, "Cash on delivery — collect ₹X · n items" or "Paid online". No location → address search link + "Exact location not set — check with the store". Labels follow the app language.

### Products (tab)
- shows: search (name, code, brand); status chips **All · Out of stock · Hidden · Details missing** (with counts); header **Filter** (Category multi, Brand multi) and **Select**.
- row: photo (fixed-size frame), name, brand · pack · code, selling price + struck MRP, badges Hidden / Details missing; bottom bar: **In stock** switch (one tap, message "Marked in stock / out of stock") · **₹ Price** · **Offer** button ("Offer 5%" tinted when live, "Offer paused", or "Add offer").
- bulk: **Update {n} products** → sheet: In stock · Out of stock · Show to buyers · Hide from buyers; **Change price by %** (−5 / −2 / +2 / +5 chips or typed, preview "Name: ₹165.00 → ₹173.25"; products that would pass MRP keep their price and are counted; products with live offers are listed and need a confirm).
- reads: `POST /api/me/catalog/skus`; filter options `POST /api/lookup/filters`.
- writes: stock `PATCH /api/me/catalog/skus/{skuId}/price-inventory`; status `PATCH /api/me/catalog/skus/{skuId}` (bulk: one call per product until 7.4 exists).
- states: empty "No products yet — Products you add on the seller portal show up here."; no-match.
- testIDs: `products-body`, `products-filter`, `product-row-<code>`, `product-row-stock`, `product-row-price`, `product-row-offer`, `products-bulk-update`.

### Price sheet
- fields: Selling price, MRP (number pad). Rules: both > 0, ≤ ₹1,00,000, "MRP can't be less than the selling price". If the product has live or paused offers and the price changes → second step "Active offers on this product": base price old → new and per offer Quantity / Discount / Now / New → **Confirm & Save**.
- reads: `GET /api/me/catalog/skus/{skuId}/price-inventory`. writes: `PATCH …/price-inventory`.

### Offer sheet (from a product row or the Offers page)
- live offer: slab rows (From · To · % off · "Buyer pays ₹x each"), **Add slab**, end date (Keep end date / 2 weeks / 1 month / 3 months / pick a date); **Pause offer** · **Save offer**. Editing keeps the offer's shape (first "From" editable; last "To" a number or "and above").
- paused offer: read-only, only **Start offer** ("Start the offer to change it").
- ₹-off offers made on the web: shown as "₹X off", read-only ("change it on the seller portal").
- no offer: same form with two slabs pre-filled (1–9 at 0%, 10+ at 3%), "Start right away" switch; **Create offer**. Hidden products or products without a price can't get an offer.
- rules (portal QPS): starts today; slabs run on without gaps; % 0–99.99; a bigger quantity never gets a smaller discount.
- reads / writes: `GET /api/me/schemes`, `POST /api/me/schemes`, `PATCH /api/me/schemes/:id` (status ACTIVE / INACTIVE, slabs, end date).

### Product page
- header: SKU code + **Edit** (full form).
- shows: photo (tap → full-screen preview with 1/3 count); name; brand · category · pack; Hidden banner with **Show again**; "Details missing" message listing the empty required fields.
  - **Price & stock**: selling price, MRP, **Edit price**, In stock switch.
  - **Buy more, save more**: slab table + code + validity + **See offers**, or "No offer on this product" + **Create offer**.
  - **Product details**: the portal's sections, collapsed — Descriptor · Quantity & Inventory · Dimensions · Category, Fulfillment & Location · ONDC Commerce Attributes · Company & Brand · Tags · Product Images. Each header has **Edit**, or a red **Fix** with "{n} missing" when a required field is empty (that section opens by itself and marks the field **Required**).
  - Quiet link at the end: **Hide this product from buyers** → confirm ("Hide this product? …") — showing it again needs no confirm.
- reads: `GET /api/me/catalog/skus/{skuId}`.

### Section edit sheet / Edit product (full form)
- Section sheet: only that section's fields; **Reset** / **Save**; checks only that section.
- Full form: Item status (Active / Inactive) + every section.
- fields and rules (portal): SKU name 3–100 · Group name (pick from existing or "Add “x”") · SKU code read-only · Short name ≤ 20 and unique in the catalogue · Short description 10–150 · Long description 1–200 · Measure unit (Unit, Gram, Kilogram, Liter, Milliliter) · Unit value > 0 · Weight measure · SKU weight > 0 · Inner pack · Units per case · Selling units (each a multiple of inner pack, not above units per case) · Weight in kg (auto) · Min / Max order qty (whole, max ≥ min) · Length / Width / Height cm · Volumetric weight (auto, L×W×H÷5000) · Category · GST % (0, 5, 12, 18, 28, 40) · GST cess · Fulfillment ID and Location ID read-only · Returnable / Cancellable / Available on COD · Time to ship read-only (from Order settings) · Customer care name / phone (10 digits, 6–9) / email · Manufacturer name read-only · Brand (from the company's brands only) · Manufacturer address 10–250 with a 6-digit PIN · Country of origin · Photos 1–5 (Take photo / Choose from gallery; first is primary; preview with Set as primary / Remove).
- marks: **Required** (red) for empty required fields, **Edited** (blue) for changed fields. Save with errors → "Some changes need fixing" list → **Got it, I'll fix them** (scrolls to the first). Back with changes → "Leave without saving?".
- reads: `GET /api/me/catalog/skus/{skuId}`, group names `GET /api/me/catalog/skus/group-names`, brands `GET /api/lookup/companies/{companyId}/brands`, categories `GET /api/lookup/categories`.
- writes: photos to file-service first, then `PATCH /api/me/catalog/skus/{skuId}` with fields + image URLs. "Details missing" is re-worked out from what is filled.
- testIDs: `edit-product-body`, `edit-section-<section>`, `edit-save`, `edit-reset`, `product-photo-add`.

### Customers (tab)
- shows: search (name, owner, mobile, company, area, pincode, beat); header **Filter** (Status All / Active / Blocked — Blocked includes partly blocked; Company multi).
- card: business name, owner, **Share**; delivery block (beat of the main address or Quick delivery, area · pincode, mobile, companies count); badge "Blocked" / "Blocked for {n} companies".
- reads: `POST /api/me/customers/list` — beat and area need backend 7.2.
- states: empty "No customers yet — Stores that order from you appear here."; no-match.

### Customer page
- shows: business name + overall badge (Active / Blocked / Partly blocked); owner, mobile, email; address chips (label + Primary) switching the address block (full address with state); **Call**, **WhatsApp**, **Maps** (exact location), **Share location**.
  - **Delivery at {address}**: per company → beat + day pills (Mon, Tue…); red **Blocked** tag; "Not served at this address: {companies}"; "No company delivers to this address yet."; no location → "Location not set — Ask the store to set its shop location in the buyer app — then beats and Maps work."
  - **Companies**: name, "Customer since {date}", status, **Block** / **Unblock** → confirm ("Block for {company}? … can't place new orders for {company} until you unblock; it never unblocks by itself").
  - **Business details**: customer ID, GST number ("Not registered").
  - **Recent orders**: this customer's orders (cards → Order page) — needs backend 7.3.
- reads: `GET /api/me/customers/by-mobile/{mobile}`; serviceability `POST /api/me/customers/address-serviceability`.
- writes: `PATCH /api/me/customers/{id}` (status ACTIVE / BLOCKED per company).

### Offers & Schemes (More → Offers)
- shows: search (SKU code, product name, offer code); chips All / Active / Paused / Expired; card: photo, product name, SKU code, offer code, QPS badge, status, slab summary ("24+ → 3% off · 48+ → 5% off"), validity; sticky **Create offer**.
- tap → details sheet: SKU code, MRP, selling price, validity, slab table (Quantity / Discount / Buyer pays), **Edit offer** (not for expired) and **Pause / Start offer**; expired: "Expired offers can't be changed".
- reads: `GET /api/me/schemes`. writes: `PATCH /api/me/schemes/:id`.

### Create offer
- 3 steps: **1 Product** (search eligible products — active, no live / paused offer) → **2 Discount** (offer form above) → **3 Check** (summary, slab table, validity, state) → **Create offer**.
- reads: eligible products `GET /api/lookup/scheme-eligible-skus`. writes: `POST /api/me/schemes`.

### More (tab)
- rows: Offers & Schemes · Store settings · Order settings · WhatsApp & notifications · Profile · Help & support · Language (sheet: English / తెలుగు) · Sign out (confirm). Top card: business name, seller ID · role.

### Store settings
- **Accept new orders** switch — off → "Pause new orders? … it never turns back on by itself" (**Yes, pause orders**); on → "Start taking orders again?". Working hours (opens / closes, "Closing time must be after opening time"). Weekly off chips (Sunday locked "Default weekly off"; beat days locked — "{days} are beat days and can't be a weekly off"). Holidays list + **Add holiday** (name, date; warning when the date is a beat day) + Remove.
- reads: `GET /api/me/store-settings`. writes: `PATCH /api/me/settings`, `POST /api/me/holidays`, `DELETE /api/me/holidays/{id}`.

### Order settings
- Order value: Minimum ₹, Maximum ₹, Non-beat minimum ₹ ("Enter 0 to turn off Tomorrow Delivery"). Processing time (6–72 h list), Cancellation window (1–24 h list). Returns: **Allow returns** (confirm both ways), Return window (24 / 48 h), Return type read-only "Full Order Return Only". **Save** (max > min, numbers ≥ 0).
- reads: `GET /api/me/order-settings`. writes: `PATCH /api/me/settings`.

### WhatsApp & notifications
- WhatsApp number (10 digits) → **Send code** → 6-digit code → **Verify** → Connected (number, **Disconnect** with confirm). Once connected: "New order received" switch.
- reads: `GET /api/me/whatsapp`. writes: `POST /api/me/whatsapp/send`, `POST /api/me/whatsapp/verify`, `PATCH /api/me/whatsapp/notifications`.

### Profile / Help & support
- Profile (read-only): company name, GST ID, address, contact name, phone, seller ID; "To change these details, call Qwipo support." reads `GET /api/me/profile`.
- Support (static): phone +91 91212 22836 (**Call**), email info@qwipo.com (**Email**), working hours Monday–Friday 9 AM–6 PM.

---

## Backend work the phone needs

| # | Need | Today |
|---|---|---|
| 7.1 | Product filter options (category / brand) | The portal calls `GET /api/me/catalog/skus/filters`, which doesn't exist; `POST /api/lookup/filters` ("cross-resource filter options") may already cover it — confirm |
| 7.2 | Customer list returns beat + area; search by beat | `POST /api/me/customers/list` returns neither |
| 7.3 | A customer's recent orders | No orders-by-customer query |
| 7.4 | Bulk product update (stock / show-hide / price by %) | Portal does bulk only by file upload; the phone loops single PATCHes until this exists |
| 7.5 | Push notification for new orders (device token registry + push channel) | WhatsApp is the only channel |
| 7.6 | Offer (QPS) slab rules in a shared package used by portal and app | Rules live only in the portal (`create-qps-modal/qps.lib.ts`) |

## Deliberate differences from the portal

- Confirming one order is one tap (portal asks every time); bulk / cancel / deliver ask.
- Bulk selection on Products (stock, show / hide, price by %) — the portal does bulk by file.
- Stock, price and offer reachable from each product row; offers editable from the product.
- Home is action-led (the portal's dashboard is "coming soon").
- Customer cards show beat and area; customer page shows recent orders (both need backend work).
- WhatsApp share and route on map for delivery agents.
- Hiding a product and signing out ask first (the portal doesn't).
- English + Telugu, and the session survives app restarts.

## Fake in the mockup (engineering must know)

- OTP is always 123456; the number is pre-filled; `9000000000` fakes "no seller".
- Data is local fixtures (`@mockups/mock-data` seller orders / catalog); actions change a local copy, nothing persists.
- Logistics / dark-store hand-over always succeeds; WhatsApp connect code is always 123456.
- Photo upload keeps the picked file in memory (no file-service).
- URL switches `?in`, `?empty`, `?slow`, `?fail`, `?expire`, `?lang=te` exist only for demos.
- Product photos: only products with a true catalogue photo show one; the rest show an emoji stand-in.

## Out of scope

- Super-admin pages, connectors, DMS, dark-store management, warehouses, serviceability polygons.
- Excel bulk import / export, pagination controls, copy buttons, raw latitude / longitude.
- Payment and shipping settings (portal "coming soon"); choosing between multiple sellers beyond the picker.

## Open questions for engineering

1. Does `POST /api/lookup/filters` return the product category / brand options the Products filter needs (7.1)?
2. Push notifications: Expo push vs FCM / APNs directly, and where device tokens live (7.5).
3. Bulk product update: a new endpoint, or accept one PATCH per product for the pilot (7.4)?
4. Should the app read beat / area for customers from `address-serviceability` per card, or wait for 7.2?

---

Handed off to: the seller-platform mobile workstream (lead per `docs/SELLER-MOBILE-APP-PLAN.md`). Next step owner: product owner sign-off on this spec, then Phase 1. The mockup stays on `seller-mobile/scaffold` until the app reaches the pilot.
