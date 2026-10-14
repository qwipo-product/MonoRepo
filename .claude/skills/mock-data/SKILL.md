---
name: mock-data
description: Scoped skill — extend the existing app fixtures when a screen needs more demo products, sellers, orders or other data. Invoked by build-screen and import-mockup.
---

# Mock data

1. **Look first.** Buyer fixtures live in
   `apps/frontend/qwipo-buyer-paytm-app/src/data/`; Seller Store data and stores
   live in `apps/frontend/seller-store/src/app/lib/`. Search for existing
   entities and assets before adding new ones.
2. **Extend, do not fork.** Add rows to the existing data module and reuse its
   types. Keep related screens consistent. Only shared contracts belong in
   `packages/types`; app-only data types stay with the app.
3. **Make it look real.** Use Indian business names, sensible ₹ prices,
   recognisable cities and product brands already represented in the fixtures.
4. **Preserve demo state.** Keep mutations in the app’s existing state or store
   and verify the empty persona or empty-state toggle alongside sample data.
5. **No backend dependency.** Both retained apps run from bundled local data.
   Do not add an API requirement just to extend fixtures.

Done: run the affected app’s typecheck and verify the screens consuming the
changed data, including empty states.
