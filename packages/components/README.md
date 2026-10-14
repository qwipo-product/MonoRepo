# Product and chart components

This package composes mobile primitives and shared order types for Buyer/Paytm and Analytics.
It exports `StatusBadge`, `PriceLabel`, `ProductImage`, `ProductCard`, and `QtyPill`.
Related types and formatting functions are available from the package entry point.

## Source map

These paths are relative to this package.

| File | Public exports and purpose |
| --- | --- |
| `src/index.ts` | Public package exports |
| `src/ProductCard.tsx` | `ProductCard` and `PackPill` for product and pack selection |
| `src/ProductImage.tsx` | `ProductImage` and `isProductPhoto` for fixture images |
| `src/PriceLabel.tsx` | `PriceLabel`, `formatInr`, and `formatInrExact` for currency display |
| `src/StatusBadge.tsx` | `StatusBadge` and `orderStatusMap` for shared order status |
| `src/QtyPill.tsx` | `QtyPill` for quantity display |
| `src/charts.tsx` | `RankedRow`, `Columns`, `StackBar`, `HBars`, and `Stat` for analytics displays |

Use `@mockups/ui` for underlying primitives and `@mockups/types` for shared `OrderStatus` values.
The consumers are `apps/frontend/qwipo-buyer-paytm-app`, `apps/frontend/qwipo-analytics`, and `apps/frontend/storybook`, relative to the repository root.
Keep this entry in each application's `src/index.css`, or in Storybook's `.storybook/tailwind.css`:

```css
@source "../../../../packages/components/src";
```

The applications compile the package's TypeScript source directly.
Keep the Tailwind source entry for this package in each consumer's CSS.
After a component change, examine affected screens in both themes.
Use [share-component](../../.claude/skills/share-component/SKILL.md) for interface changes.
