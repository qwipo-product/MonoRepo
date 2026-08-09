# @mockups/qwipo-app-v2

Qwipo buyer app, rebuilt on the standardized design system. Replaces
`qwipo-app` (which retires once this reaches screen parity).

```bash
bun dev --filter=@mockups/qwipo-app-v2     # http://localhost:5175
```

## What makes it "v2"

Every visual comes from the shared library — nothing is styled per-screen:

- **Tokens** — `@mockups/design-tokens/theme.css`, imported in `src/index.css`
  (light + `.dark`). Dark mode works: `ThemeProvider` toggles the `.dark` class.
- **Primitives** — `@mockups/ui` (`Button`, `Card`, `Badge`, `Chip`, `Sheet`,
  `SegmentedControl`, `QtyStepper`, `EmptyState`, `SelectableCard`, `Input`).
- **Components** — `@mockups/components` (`ProductCard`, `PriceLabel`,
  `StatusBadge`).

`src/App.tsx` is the Catalog screen assembled from those — a new screen is
composition, not new CSS.

## Tailwind + shared packages

`src/index.css` has `@source` lines pointing at `packages/ui/src` and
`packages/components/src`. Tailwind never scans `node_modules`, so without these
the components render unstyled. Add a new shared package that ships classes →
add an `@source` for it.

## Status

| Screen | Status |
|---|---|
| Catalog (Distributors / Wholesalers, add-to-cart, dark toggle) | ✅ first screen |
| Home, Cart, Orders, Profile, … | ⬜ to migrate |
