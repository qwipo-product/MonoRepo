---
name: mock-data
description: Create or change local demonstration fixtures. Keep consistent entities and state across affected screens.
---

# Change demonstration data

Use the [repository instructions](../../../CLAUDE.md).

| Application | Data location |
| --- | --- |
| Buyer/Paytm | `apps/frontend/qwipo-buyer-paytm-app/src/data/` |
| Seller Store | `apps/frontend/seller-store/src/app/lib/` |

Use the existing module for the entity before creating another source:

| Application | Existing modules, relative to its data directory |
| --- | --- |
| Buyer | `products.ts`, `cart.ts`, `orders.ts`, `addresses.ts`, and `places.ts` |
| Buyer registration | `dmsPartners.ts`, `tcpl.ts`, and `home.ts` |
| Buyer salesperson | `salesperson.ts` |
| Seller business data | `orders-data.ts`, `sku-catalog.ts`, `offers-data.ts`, and `dashboard-data.ts` |
| Seller customer flows | `customers-data.ts` and `customers-demo-data.ts`; trace the route's imports before selection |
| Seller administrator state | `mock-store.ts` and `admin-catalog.ts` |
| Seller empty mode | `data-mode.ts`, applied through `auth-context.tsx` |

Buyer cart state and `buildCart` calls are connected in `apps/frontend/qwipo-buyer-paytm-app/src/App.tsx`.
Keep that state consistent across catalog, cart, and order-summary screens.
The current shared `OrderStatus` type is in `packages/types/src/index.ts`.
Do not treat unrelated application-specific statuses as that shared type.

1. Search the existing data modules and assets.
2. Use existing entity types and identifiers.
3. Add only the fixtures necessary for the requested flow.
4. Use fictional contact and identity data for new fixtures.
5. Keep prices, quantities, totals, and status transitions consistent.
6. Keep mutations in the application's existing store or state.
7. Examine normal and empty states.
8. Run the affected type checks and behavior checks.

Use the existing Indian currency and locale conventions.
Keep application-specific types with their application.
If the same contract applies to all consumers, put the type in a shared package.
Do not add a backend requirement solely to extend fixtures.

A fixture describes simulated behavior. It does not establish a production API contract.
Record assumptions that can affect an engineering handoff.
