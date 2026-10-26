# Seller Store

Seller Store is a browser prototype for distributors and Qwipo administrators.
It uses `@mockups/web-ui` and `@mockups/web-tokens`.
Its routes use the URL hash.

## Run the application

From the repository root, run:

```bash
bun dev --filter=@mockups/seller-store
```

The configured URL is `http://localhost:5174`.
Examine the actual URL in the server output.
The build preview uses port `6174`.

## Demonstration accounts

Select a persona on the login screen.
Use the demonstration OTP `1234` for each persona.
These accounts simulate authentication.

| Persona | Mobile number | Destination |
| --- | --- | --- |
| Seller | `9900000002` | Seller dashboard |
| Seller (Empty) | `8888888888` | Supported empty states |
| Super Admin | `9900000001` | `/#/admin` |
| Super Admin (Empty) | `9999999999` | Admin empty states |
| Design System | `7777777777` | `/#/design` |

The empty personas clear mock master data and activate supported empty states.
Some dashboard totals still use seeded seller data.
Do not use the empty dashboard as a complete empty-state reference.
After a data change, examine the two normal and empty modes.

## Flows

The seller flows include the dashboard, SKU management, customers, offers, orders, connectors, KYC, reports, settings, and support.
The administrator flows include requests, active sellers, users, companies, categories, and connectors.
The application also contains error and loading examples.

## Source layout

| Location | Purpose |
| --- | --- |
| `src/app/components/` | Application-specific components |
| `src/app/lib/` | Fixtures, stores, validation, and simulated authentication |
| `src/app/pages/` | Application screens |
| `src/app/routes.tsx` | Route definitions |
| `src/imports/` | Application assets |
| `src/index.css` | Styles and shared theme imports |

These paths are relative to this application folder.
Use the following files for changes to shared application behavior:

| File | Responsibility |
| --- | --- |
| `src/main.tsx` | `ThemeProvider`, `AuthProvider`, `RouterProvider`, `Toaster`, and `VersionBadge` |
| `src/app/components/root-layout.tsx` | Persona-specific navigation, header, drawer, and seller layout |
| `src/app/components/protected-route.tsx` | Route access for seller, administrator, and designer roles |
| `src/app/lib/admin-navigation.ts` | Administrator navigation entries and page titles |
| `src/app/lib/auth-credentials.ts` | Demonstration identities and OTP validation |
| `src/app/lib/auth-context.tsx` | Session state and application of the selected data mode |
| `src/app/lib/data-mode.ts` | `demo` and `empty` modes, including `isEmptyMode()` |
| `src/app/lib/mock-store.ts` | Persisted seller requests, users, permissions, KYC, and connector state |
| `src/app/lib/admin-catalog.ts` | Administrator company and category data |
| `src/app/lib/orders-data.ts`, `src/app/lib/sku-catalog.ts` | Order fixtures and SKU data |
| `src/app/pages/design-system.tsx` | Component handbook rendered at `/#/design` |
| `src/app/pages/demos/error-screens.tsx`, `src/app/pages/demos/loading-screens.tsx` | Review examples for error and loading states |

The current customer route is `/#/customers`, implemented by `src/app/pages/customers/list.tsx` and `detail.tsx`.
The comparison flow at `/#/customers-demo` uses `legacy-list.tsx` and `legacy-detail.tsx` in that directory.
Before changing a customer flow, confirm which route the request concerns.
Unless their removal is part of the task, keep legacy route aliases.

For a new route, update `src/app/routes.tsx` and the applicable navigation definition.
Keep the `ProtectedRoute` role and the parent layout correct.
Use `src/app/lib/*-data.ts` and existing store functions before creating another fixture source.

When directory depth changes, keep relative asset imports valid.
For example, assets under `src/imports/categories/` use relative imports such as `../../imports/categories/<file>.png`.
The application uses its own persona-based `root-layout.tsx`.
Do not replace that layout with the generic `AppShell` without preserving its behavior.

## Design and themes

Existing pages use raw Tailwind palette utilities.
The desktop theme contains compatibility rules for those utilities in dark mode.
Until no consumer uses those rules, keep them.
Use semantic classes for new screen code.

Keep these entries in `src/index.css`:

```css
@import "tailwindcss";
@source "../../../../packages/web-ui/src";
@import "../../../../packages/web-tokens/theme.css";
@import "leaflet/dist/leaflet.css";
```

Leaflet supplies styles for the orders map dialog.
The `next-themes` provider in `src/main.tsx` uses `attribute="class"` and the `qwipo.theme` storage key.
Keep the `.dark` class behavior consistent with `packages/web-tokens/theme.css` at the repository root.

The Design System persona opens the component handbook at `/#/design`.
Keep its examples consistent with the [design reference](../../../packages/web-ui/DESIGN-SYSTEM.md).
Examine shared component changes in light and dark themes.

## Change the application

1. Read the [repository instructions](../../../CLAUDE.md).
2. Use the applicable shared component.
3. Where possible, extend existing fixtures and stores.
4. Use `import type` for TypeScript types.
5. Examine changed routes, validation, and state transitions.
6. Use [verify](../../../.claude/skills/verify/SKILL.md).
