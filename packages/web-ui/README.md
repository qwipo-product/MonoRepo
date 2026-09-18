# @mockups/web-ui

The **desktop / admin** primitive set — shadcn components on Radix, plus the
app shell and the Qwipo brand assets. The dense counterpart to
`@mockups/ui`, which stays mobile-first and Radix-free.

Extracted from the Seller Store app so that the Seller Store, RIRN, and every
future web mockup share one kit instead of each forking it.

```
Tokens (@mockups/web-tokens) → primitives (here) → screens
```

No build step — raw TypeScript, compiled by the consuming app's Vite.

## What's here

- **55 primitives** in `src/components/` — Button, Input, Select, Combobox,
  Dialog, Sheet, Drawer, Popover, Table, DataTable, Chart (Recharts), Sidebar,
  Command, Calendar, and the rest of the shadcn set.
- **5 composites**, in the same folder — `AppShell`, `EmptyState`,
  `ErrorState`, `ThemeToggle`, `CopyOnHover` (plus `PageHeader` /
  `PageTitle` / `SectionTitle` among the primitives).
- **Assets** in `src/assets/logos/` — Qwipo wordmark and icon marks, light and
  dark variants. Brand only; product artwork (category images and the like)
  belongs to the app that uses it, not here.
- **`DESIGN-SYSTEM.md`** — the written spec: principles, density rules, the
  mobile overlay, chart guidance, accessibility checklist.

The browsable version is `apps/frontend/storybook-web` (`:6007`).

## Using it

```tsx
import { Button, Card, StatusBadge, AppShell } from '@mockups/web-ui';
```

Deep imports work too, when you want exactly one file:

```tsx
import { Button } from '@mockups/web-ui/button';
```

Brand assets:

```tsx
import logo from '@mockups/web-ui/assets/logos/Qwipo_Secondary_Logo_for_Light_BG@4x-8.png';
```

Your app **must** carry both lines in `src/index.css`, or the components render
unstyled with no error:

```css
@source "../../../../packages/web-ui/src";
@import "../../../../packages/web-tokens/theme.css";
```

## Two renamed exports

Two source files collided on a name when they merged into one barrel. Both
alternatives are still reachable by deep import:

| Source | Barrel export | Use when |
|---|---|---|
| `form.tsx` `FormField` | `FormField` | You're wiring react-hook-form |
| `form-field.tsx` `FormField` | **`LabeledField`** | You want label + control + inline error, no RHF |
| `data-table-shell.tsx` `DataTable` | `DataTable` | You're writing table markup (the canonical list page) |
| `data-table.tsx` `DataTable` | **`DataGrid`** | You'd rather declare columns than write markup |

## AppShell

The chrome for a new web mockup: collapsible sidebar, 56px top bar, animated
mobile drawer, route progress, theme-aware logo swap. Everything
product-specific arrives as props.

```tsx
<AppShell navigation={NAV} title={getPageTitle(pathname)} user={USER}>
  <Outlet />
</AppShell>
```

Nav items accept `subItems` for collapsible groups, `externalUrl` for new-tab
links, and `disabled` to grey out a screen that isn't built yet — useful for
showing the intended information architecture early.

It needs `react-router` (an optional peer) and a `next-themes` provider mounted
with `attribute="class"`, which is the contract the token layer keys its dark
variant off.

**The Seller Store deliberately does not use it** — its sidebar is
persona-driven (admin / seller / empty-mode), which `AppShell` doesn't model,
so it keeps its own `root-layout.tsx`.

## Tokens are not re-exported here

Components reference semantic utilities (`bg-primary`, `text-foreground`) and
the app's CSS resolves them from `@mockups/web-tokens/theme.css`. If you need
token *values* in TypeScript, import them from `@mockups/web-tokens` directly.
Never hard-code a hex in a component, and never move tokens into this package.

## Adding a component

Add the file to `src/components/`, export it from `src/index.ts`, add a story
in `apps/frontend/storybook-web`, and check it in **both** themes. If it isn't
in Storybook, nobody knows it exists.
