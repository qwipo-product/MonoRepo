---
name: mock-data
description: Scoped skill — extend the shared fixtures in @mockups/mock-data and @mockups/types when a screen needs data that doesn't exist yet. Invoked by build-screen and import-mockup; use directly for "add more products", "I need a distributor in Vijayawada", "fake orders for the demo".
---

# Mock data

One fake catalogue, shared by every mockup. A screen that invents its own
rows is a screen that disagrees with every other screen about what a product
looks like — and the demo is where that shows.

1. **Look first.** `packages/mock-data/src/mockData.ts` already exports
   products, sellers, distributors, wholesalers, brands, categories,
   banners, offers, a cart, reorder history, notifications, addresses,
   orders, payment methods, help topics and a user profile.
   `generatedProducts.ts` has bulk SKUs; `imageBank.ts` has images
   (`import { IMG } from '@mockups/mock-data/imageBank'`). Most demos need
   nothing new.
2. **Extend, don't fork.** Add rows to the existing export or a new export
   beside it. If the shape is new, add the interface to
   `packages/types/src/index.ts` first — the fixture must satisfy the type,
   because that type is what every screen reads.
3. **Make it look real.** Indian business names, ₹ prices in the right
   range, SKU names from brands already in the file, cities the sales team
   would recognise. A demo audience notices "Test Product 1" before
   anything else.
4. **Keep app-local state app-local.** Data that only one app mutates
   during a demo (seller-store's subscribe/notify stores, the buyer app's
   cart) lives in that app, seeded from the shared fixtures. Shared fixtures
   are read-only inputs.
5. **Both consumers move together.** `apps/backend/mock-api` serves the
   same package, so a new export is automatically available over HTTP — but
   nothing is deployed with it, so don't build a screen that only works
   against the API.

Done: `bunx turbo run typecheck --filter=@mockups/mock-data` — a fixture
missing a required field is the one kind of type error this repo takes
seriously.
