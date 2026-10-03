# Seller Mobile — end-to-end test cases (Maestro)
date: 2026-10-03
status: **Approval pending** — derived from `seller-mobile-all-flows.md`; written ahead of the screens (Lane C)
runs against: mock packs (`concern:variant`, selected before `launchApp`); both Android and iOS
flow files: `apps/mobile/seller-app-e2e/.maestro/<feature>/<id>.yaml`, tag `feature:<feature>`; known bugs tagged `blocked`

IDs are stable — carry them as tags on the flow. "Mock" = the pack loaded before launch.

## Auth

| ID | Title | Mock | Steps | Expected |
|---|---|---|---|---|
| AUTH-01 | Sign in, one seller | `auth:one-seller` | Enter 9900000002 → Send OTP → enter 123456 → Verify & Sign In | Home shows the business name; no Choose seller screen |
| AUTH-02 | Invalid number | `auth:one-seller` | Enter 98765 → Send OTP | "Enter a valid 10-digit mobile number" under the field; stays on Login |
| AUTH-03 | Wrong OTP | `auth:one-seller` | Send OTP → enter 111111 → Verify | "Wrong OTP…" shown; stays on OTP |
| AUTH-04 | Resend timer | `auth:one-seller` | Send OTP → wait | "Send OTP again in …s" counts down, then **Send OTP again** is tappable |
| AUTH-05 | No seller assigned | `auth:no-seller` | Sign in | "No seller assigned" with Sign out |
| AUTH-06 | Two sellers | `auth:two-sellers` | Sign in → pick the second seller | Home shows that seller's name |
| AUTH-07 | Session expired | `auth:expire-after-login` | Sign in → open Orders | Session expired screen → Sign in again → Login |
| AUTH-08 | Stays signed in | `auth:one-seller` | Sign in → kill app → relaunch | Home, no OTP |
| AUTH-09 | Telugu | `auth:one-seller` | On Login tap తెలుగు | Login texts in Telugu; after sign-in tabs in Telugu |

## Home

| ID | Title | Mock | Steps | Expected |
|---|---|---|---|---|
| HOME-01 | New orders card | `orders:default` | Open Home | "5 new orders to confirm"; **See new orders** → Orders, New tab |
| HOME-02 | Deliveries by day | `orders:default` | Tap the "Mon, 5 Oct" row | Orders opens with the Mon, 5 Oct chip selected |
| HOME-03 | Attention rows | `catalog:default` | Tap "2 out of stock" | Products with Out of stock chip selected |
| HOME-04 | Paused store | `settings:paused` | Open Home → Turn on | Store settings opens |
| HOME-05 | Day-one seller | `all:empty` | Open Home | "No new orders", "Nothing to deliver yet", no attention card |

## Orders

| ID | Title | Mock | Steps | Expected |
|---|---|---|---|---|
| ORD-01 | Confirm one order | `orders:default` | New tab → Confirm on the first card | "Order confirmed"; card leaves New, appears in Confirmed; no dialog |
| ORD-02 | Bulk confirm | `orders:default` | Select → tick 2 → Confirm (2) → Yes, confirm 2 | "2 orders confirmed"; selection cleared |
| ORD-03 | Ticks survive Go back | `orders:default` | Select → tick 2 → Confirm (2) → Go back | Still 2 ticked; bar shows Confirm (2) |
| ORD-04 | Cancel needs a reason | `orders:default` | Cancel on a card | Cancel order disabled until a reason is picked; 11 reasons in portal order |
| ORD-05 | Cancel with reason | `orders:default` | Cancel → "Store not responsive" → Cancel order | "Order cancelled"; Cancelled tab shows "Cancelled by you" + reason |
| ORD-06 | Mark delivered | `orders:default` | Confirmed tab → Mark as delivered → Yes, delivered | Order in Delivered with "Delivered on" date |
| ORD-07 | Move to logistics | `orders:logistics` | Confirmed → Select → tick 1 → More → Move to Logistics → Send | Result "Sent"; Done → order in Logistics tab with partner + status |
| ORD-08 | Logistics order locked | `orders:logistics` | Logistics tab → open an order | No Cancel / Mark delivered; partner, status, AWB shown |
| ORD-09 | Filter by delivery day | `orders:default` | New tab → tap "Mon, 5 Oct" | Only orders for that day |
| ORD-10 | Filter sheet | `orders:default` | Filter → Order type: Non-beat → Show orders | Only Quick delivery orders; dot on Filter; Clear resets |
| ORD-11 | Search by mobile | `orders:default` | Search 9849023456 | Only Balaji General Stores orders |
| ORD-12 | Order page facts | `orders:default` | Open QW-240871 | Company, ONDC, marketplace order no., GST, items read-only, offer line "saved ₹127.20", Offer savings row |
| ORD-13 | Unavailable item | `orders:default` | Open QW-240859 | Ghee shows "Not available"; Confirm order still available |
| ORD-14 | Share with delivery agent | `orders:default` | Order page → Share with delivery agent | WhatsApp opens with store, address, beat, delivery day, amount to collect, Maps link |
| ORD-15 | Empty tab | `all:empty` | Open Orders | "No new orders" empty state; Select hidden |
| ORD-16 | Load error + retry | `orders:error` | Open Orders → Try again (pack switched to default) | Error state, then the list |

## Products

| ID | Title | Mock | Steps | Expected |
|---|---|---|---|---|
| PRD-01 | Stock switch | `catalog:default` | Toggle In stock off on the first row | "Marked out of stock"; row shows Out of stock |
| PRD-02 | Quick price | `catalog:default` | ₹ Price → selling price 150 → Save price | "Price saved"; row shows ₹150.00 |
| PRD-03 | Price above MRP | `catalog:default` | ₹ Price → selling 999 → Save | "MRP can't be less than the selling price"; not saved |
| PRD-04 | Price with offer impact | `catalog:default` | Freedom Sunflower → ₹ Price → 170 → Save price | "Active offers on this product" table (old → new) → Confirm & Save |
| PRD-05 | Quick offer create | `catalog:default` | Add offer on a product without one → Create offer | "Offer created"; row button shows "Offer 3%" |
| PRD-06 | Paused offer locked | `catalog:paused-offer` | Offer paused → sheet | Slabs read-only; only Start offer |
| PRD-07 | Bulk stock | `catalog:default` | Select → tick 3 → Update 3 products → Out of stock | "3 products out of stock" |
| PRD-08 | Bulk price by % | `catalog:default` | Select → tick 3 → Update → +5% → Apply → confirm offers | Prices +5%; products above MRP counted and unchanged |
| PRD-09 | Filter category / brand | `catalog:default` | Filter → Brand: Aashirvaad → Show | Only Aashirvaad products; dot on Filter |
| PRD-10 | Fix missing details by section | `catalog:default` | Britannia Good Day → ONDC Commerce Attributes **Fix** → care phone 9900000002 → Save | "Product saved"; that section shows Edit, not Fix |
| PRD-11 | Full edit validation | `catalog:default` | Edit → clear Short description → Save | "Some changes need fixing" lists Short description |
| PRD-12 | Leave without saving | `catalog:default` | Edit → change name → Back | "Leave without saving?" → Stay keeps the change |
| PRD-13 | Add photo | `catalog:default` | Edit → Product Images → Add photo → Choose from gallery → pick | Photo appears as Primary; "1 / 5" |
| PRD-14 | Photo preview | `catalog:default` | Product page → tap photo → next | Full-screen preview, "2 / 3" |
| PRD-15 | Hide and show | `catalog:default` | Hide this product → Yes, hide → Show again | Hidden banner, then gone |
| PRD-16 | Brand from company list | `catalog:default` | Edit → Brand | Only the product company's brands offered |

## Customers

| ID | Title | Mock | Steps | Expected |
|---|---|---|---|---|
| CUS-01 | Search by beat | `customers:default` | Search "KPHB" | Lakshmi, Hanuman (and other KPHB beat stores) |
| CUS-02 | Filter blocked | `customers:default` | Filter → Blocked → Show | Hanuman (partly) and Mahalakshmi |
| CUS-03 | Second address | `customers:default` | Venkateswara → Branch chip | Address block and Delivery-at section switch to Kothapet |
| CUS-04 | Not served / blocked beat | `customers:default` | Hanuman → Delivery at Shop | Adani beat shows red Blocked |
| CUS-05 | Location not set | `customers:default` | Mahalakshmi | "Location not set" message; Maps uses the address |
| CUS-06 | Block for a company | `customers:default` | Lakshmi → ITC Limited Block → Yes, block | Status Blocked; overall badge Partly blocked |
| CUS-07 | Share location | `customers:default` | List card Share | WhatsApp opens with store, address, beat, Maps link |
| CUS-08 | Recent orders | `customers:default` | Lakshmi → Recent orders → tap a card | Order page opens |

## Offers

| ID | Title | Mock | Steps | Expected |
|---|---|---|---|---|
| OFF-01 | Create in 3 steps | `offers:default` | Create offer → pick Tata Tea Gold → Next → Create offer | "Offer created"; listed as Active |
| OFF-02 | Slab rules | `offers:default` | Create → set slab 2 % lower than slab 1 → Next | "can't be lower than …" error; stays on step 2 |
| OFF-03 | Pause and start | `offers:default` | Open an Active offer → Pause offer | Status Paused; Start offer restores |
| OFF-04 | Expired is read-only | `offers:default` | Open Surf Excel (Expired) | "Expired offers can't be changed"; no Edit |
| OFF-05 | ₹-off offer read-only | `offers:default` | Open Tata Salt QPS-1066 → Edit | Slabs shown as "₹X off", read-only |
| OFF-06 | Search | `offers:default` | Search "QPS-1051" | Only that offer |

## More / Settings

| ID | Title | Mock | Steps | Expected |
|---|---|---|---|---|
| SET-01 | Pause orders | `settings:default` | Store settings → Accept new orders off → Yes, pause orders | Home shows Orders paused |
| SET-02 | Working hours check | `settings:default` | Closes before opens → Save | "Closing time must be after opening time" |
| SET-03 | Beat day locked | `settings:default` | Weekly off → tap a beat day | Not selectable; beat-day note |
| SET-04 | Add holiday | `settings:default` | Add holiday → name + date → Add | Listed; beat-day date shows a warning first |
| SET-05 | Non-beat minimum 0 | `settings:default` | Order settings → Non-beat minimum 0 → Save | Note "Tomorrow Delivery is off" |
| SET-06 | Allow returns | `settings:default` | Allow returns off → confirm | Saved; return window hidden |
| SET-07 | WhatsApp connect | `settings:default` | Number → Send code → 123456 → Verify | Connected; New order received switch visible |
| SET-08 | Language | `settings:default` | More → Language → తెలుగు | App in Telugu, dates in Telugu |
| SET-09 | Sign out | `settings:default` | More → Sign out → confirm | Login screen |
| SET-10 | Profile read-only | `settings:default` | More → Profile | Business details, contact, seller ID; no edit controls |
