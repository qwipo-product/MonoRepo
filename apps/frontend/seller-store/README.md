# @mockups/seller-store

The Qwipo **Seller Store** — the distributor console plus the Qwipo super-admin
portal. 51 pages across 59 routes; the largest mockup in this repo.

Ported in from the standalone Seller Store repo and rebuilt on
`@mockups/web-ui` + `@mockups/web-tokens`, so it now shares one design system
with every other web mockup instead of carrying its own copy.

## Run it

```bash
bun dev --filter=@mockups/seller-store
```

http://localhost:5174

## Demo personas

It opens on a login. **OTP is `1234` for every persona** — the login card lists
them, and tapping one autofills the number.

| Persona | Mobile | Lands on |
| --- | --- | --- |
| Seller | `9900000002` | Seller dashboard |
| Seller (Empty) | `8888888888` | Inception-day empty states |
| Super Admin | `9900000001` | `/admin` |
| Super Admin (Empty) | `9999999999` | Admin empty states |
| Design System | `7777777777` | `/design` |

The **Empty** personas clear mock master data and activate supported empty
states, including the SKU list. Some dashboard totals still use seeded seller
data; this is an existing prototype limitation. Every new list screen should
support empty mode.

## What's in it

**Seller side** — Dashboard, My SKU (+ SKU detail, add-SKU wizard with manual /
brand-sync / central-catalog paths, price list), Customers, Offers & Schemes
(+ create scheme), Orders (+ order detail, map view), Connectors, KYC,
Reports (6), Settings (6), Support.

**Admin side** — Dashboard, New requests, Active sellers (+ seller detail),
Add user, Companies, Categories, Connectors.

Plus error-screen and loading-screen galleries, surfaced in the empty-mode
sidebars.

## Structure — two things that look odd

```
src/
  app/
    components/   app-specific only (root-layout, combobox wrappers, filter drawers)
    lib/          mock data stores, validation, auth
    pages/        51 screens
    routes.tsx    59 routes
  imports/        Qwipo logos + 37 category images
  main.tsx
  index.css
```

**Why `src/app/` and `src/imports/`.** That mirrors the original repo's
directory depth exactly, which is what let ~40 relative asset paths
(`../../imports/categories/*.png`) survive the port untouched. Flattening it
would mean rewriting all of them for no gain.

**Why it has its own `root-layout.tsx`** instead of `AppShell` from
`@mockups/web-ui`. Its sidebar is persona-driven — admin vs seller, with extra
demo entries in empty mode — which the generic shell doesn't model. New web
mockups should use `AppShell`; this one has earned its exception.

## Dark mode

These pages are written with raw Tailwind utilities (`bg-white`,
`text-gray-900`), not semantic tokens. They go dark-aware anyway because
`@mockups/web-tokens/theme.css` carries a `.dark` rebinding layer for exactly
those classes.

That layer is load-bearing here — it's the reason ~40,000 lines didn't need
rewriting. New screens should still prefer semantic classes (`bg-card`,
`text-foreground`).

## Design handbook

The Design System persona opens `/#/design`, the in-app desktop component
handbook. Keep its examples aligned with `packages/web-ui/DESIGN-SYSTEM.md`
and check shared component changes in both light and dark themes.

## Notes for whoever works here next

- The app's UI imports all come from `@mockups/web-ui`. Don't add a local copy
  of a component the package already has.
- `verbatimModuleSyntax` is on: types need `import type`.
- Mock data lives in `src/app/lib/*-data.ts` and is mutated through small
  subscribe/notify stores. Extend those rather than inventing new fixtures.
