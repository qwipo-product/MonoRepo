# Desktop design tokens

This package supplies the desktop theme for Seller Store.
It defines desktop density, typography, component values, and chart colors.

| File | Purpose |
| --- | --- |
| `src/tokens.ts` | Desktop values and shared TypeScript exports |
| `src/index.ts` | Public exports |
| `theme.css` | Tailwind bindings, dark theme, and compatibility styles |

## Use the theme

```css
@import "tailwindcss";
@source "../../../../packages/web-ui/src";
@import "../../../../packages/web-tokens/theme.css";
```

This example applies to an application under `apps/frontend/`.
The theme imports `tw-animate-css` for overlay animations.
Do not import the mobile CSS token layer into the same application.
Both layers define some of the same custom properties.

For TypeScript values, import the required exports:

```ts
import { chartPalette, component, radius } from '@mockups/web-tokens';
```

The main consumer stylesheet is `apps/frontend/seller-store/src/index.css`, relative to the repository root.
Shared desktop components live in `packages/web-ui/src/components/`.
Their classes resolve through this package's `theme.css`.

| Need | Definition to examine |
| --- | --- |
| `bg-primary`, `bg-card`, and `text-foreground` | `theme.css`: CSS variables and `@theme inline` mappings |
| Desktop control sizing and component values | `src/tokens.ts`: `component` |
| Typography, radius, motion, and chart colors | `src/tokens.ts`: `typography`, `radius`, `motion`, and `chartPalette` |
| Dark-mode colors and imported legacy utility support | `theme.css`: `.dark` rules and compatibility selectors |

Desktop buttons commonly use `h-9`.
Read the component source and CSS mapping before translating a TypeScript dimension into a class.
Use the [desktop design reference](../web-ui/DESIGN-SYSTEM.md) for component and page examples.

## Shared values and separate CSS

The TypeScript module re-exports `colorLight`, `colorDark`, `space`, and `zIndex` from `@mockups/design-tokens`.
The desktop CSS contains separate literal values.
These values do not update automatically when the TypeScript source changes.
Some desktop and mobile surface values differ intentionally.

If a rendered dimension or color differs from a TypeScript value, read the actual CSS binding.
Resolve unintended differences in the approved task.
Record any differences between token representations.

## Existing Seller styles

The dark theme contains compatibility rules for raw palette utilities such as `bg-white` and `text-gray-900`.
Existing Seller Store pages depend on these rules.
Until the affected consumers use another verified style, keep these rules.
Use semantic classes for new screen code.

## Change a token

1. Find the affected TypeScript and CSS representations.
2. Update corresponding values in the same change.
3. Keep intentional differences between the kits.
4. If the design guidance changes, update the [design reference](../web-ui/DESIGN-SYSTEM.md).
5. Update the applicable Seller handbook example.
6. Examine light and dark themes.
7. Use [verify](../../.claude/skills/verify/SKILL.md).
