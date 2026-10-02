# @mockups/seller-mobile

The **seller portal on a phone** — for a distributor's owner and ops staff,
seller logins only (no super admin). Built for a usability test with real
distributors, who are not tech-savvy: every action, one order or many, is a
visible labelled button a tap or two away.

```bash
bun dev --filter=@mockups/seller-mobile
```

http://localhost:5178 · open the **Network** URL on a phone · `?empty` = a
day-one seller with no orders (every empty state)

Brief: `docs/briefs/seller-mobile.md`.

## Same design system as the buyer app

`@mockups/design-tokens` + `@mockups/ui` + `@mockups/components`, exactly as
`qwipo-buyer-paytm-app` uses them. The order card, tab bar and status bar are
the buyer app's own, moved into the shared packages so both apps render the
same parts. No colours or styles live in this app.

## Words and steps come from the real portal

Order tabs, statuses, cancel reasons and actions mirror
`seller-platform/apps/frontend/seller-portal` (Orders page) and the platform's
order enums: **New** (CREATED) → **Confirmed** (ACCEPTED / PACKED / SHIPPED) →
**Delivered**, or **Cancelled** with a reason. Every order shows its **beat**
(or "Quick delivery" for a non-beat order) and **expected delivery date**;
New and Confirmed filter by delivery day, as in the portal.

## What's built

| Page | State |
| --- | --- |
| Orders — tabs, search, delivery-day filter, Confirm / Cancel on each card | ✅ |
| Bulk — Select → tick → Confirm (n) / Cancel (n) / Mark delivered (n) | ✅ |
| Order detail — beat, delivery, call / WhatsApp, change quantity or remove an item, Save & confirm | ✅ |
| Home, Products, Customers, More (offers, profile, settings, support), Login | next |

## Things that look wrong on purpose

- Confirming **one** order is one tap with no "are you sure" — it is the
  everyday action. Bulk confirm, cancel and deliver ask first.
- An order with an item the DMS reports as not available can't be confirmed
  until the item is removed; bulk confirm leaves it out and says so.
- Telugu covers this app's strings; product names and store names stay in
  English. Hindi and Tamil fall back to English.
