# @mockups/storybook

Storybook for the Qwipo design system — the living catalog of the `@mockups/design-tokens`,
`@mockups/ui` and `@mockups/components` packages, and the reference to port the React Native app from.

## Run it

From the repo root (dependencies install for the whole workspace):

```bash
bun install
bun run --filter @mockups/storybook storybook
```

Storybook serves on http://localhost:6006.

Build a static site (deployable / shareable):

```bash
bun run --filter @mockups/storybook build-storybook
# output: apps/frontend/storybook/storybook-static
```

## What's inside

- **Introduction** — the layered design system at a glance.
- **Foundations** — Colors (semantic tokens) and Typography (the type scale).
- **Primitives** — Button, Badge, Card, Chip, Input, Switch, SegmentedControl, Tabs,
  QtyStepper, SelectableCard, EmptyState, Sheet.
- **Components** — ProductCard, PriceLabel, StatusBadge.

Use the **Light / Dark** toolbar toggle to verify both themes, and the **Accessibility**
panel to check contrast and roles.

## How it works

Same rendering stack as the apps: Vite + React + Tailwind v4. Tailwind does not scan
`node_modules`, so `.storybook/tailwind.css` points `@source` at the package sources and
imports `@mockups/design-tokens/theme.css` — exactly like each app's `index.css`. Nothing
here hardcodes a colour; every value resolves from a token.

## Adding a story

Co-locate a `*.stories.tsx` next to the pattern it documents, import the component from its
package (`@mockups/ui` / `@mockups/components`), and it appears automatically. Prefer a
`Playground` (live controls) plus small galleries of variants and states.
