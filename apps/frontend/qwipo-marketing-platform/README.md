# @mockups/qwipo-marketing-platform

The marketing team's console for creating promotions and notifications —
ported in from a standalone Next.js prototype and rebuilt on
`@mockups/web-ui` + `@mockups/web-tokens`, so it shares one design system
with the rest of the admin/web mockups (`seller-store`, `rirn`).

## Run it

```bash
bun dev --filter=@mockups/qwipo-marketing-platform
```

http://localhost:5178

## Sign in

Demo credentials are shown on the login screen: `demo@qwipo.com` /
`qwipo123`. Any well-formed email and a 6+ character password also works
— there's no real auth behind it.

## What's in it

**Promotions** — list of campaigns (draft / scheduled / live / expired /
archived), a 4-step create wizard (geo & product targeting → campaign
details → surface & banner upload with a live phone preview → review &
publish), drag-to-reorder ranking per surface (full-screen / home carousel
/ product list), and CSV SKU bulk upload.

**Notifications** — list of sent/scheduled/recurring/automated
notifications and a composer: category, audience targeting (same
geo/seller/vendor cascade as promotions), channel selection (in-app,
push, SMS, WhatsApp) with per-channel content editing, and trigger
configuration (one-time, recurring, event-based).

## The live bridge to the buyer app

Publishing a promotion with a surface assigned, or creating an in-app
notification, POSTs it to `mock-api`'s `/api/marketing/*` relay
(`apps/backend/mock-api/src/marketing.ts`). The buyer app
(`qwipo-buyer-paytm-app`) polls that same relay and shows what's
published — home-carousel and product-list banners, and the
notifications feed — live, without a page reload. Requires `mock-api`
running (`bun dev --filter=@mockups/mock-api`); if it isn't, publishing
here still works, the buyer app just won't pick it up.

Two different origins (5178 here, 5175 on the buyer app) can't share
`localStorage`, which is why this goes through `mock-api` rather than a
browser-storage event — see the comment atop `marketing.ts`.

## What looks odd and why

- WhatsApp and SMS channels are configured in the composer (templates,
  variables, DLT IDs) but nothing is actually sent — no real transport in
  a mockup. Only `in_app` notifications relay through to the buyer app.
- The full-screen promotion surface isn't rendered in the buyer app yet —
  only home-carousel and product-list banners are wired up.
- `mock-api`'s relay is in-memory only; a restart forgets every
  published promotion/notification, same as the rest of `mock-api`.
