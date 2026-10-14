# Mobile design tokens

This package supplies mobile token values and the Buyer/Paytm CSS theme.
The desktop token module re-exports some of its TypeScript values.

| File | Purpose |
| --- | --- |
| `src/tokens.ts` | Typed token values |
| `src/index.ts` | Public exports |
| `theme.css` | Tailwind utilities and light/dark CSS values |

## Use the theme

Import the theme in the application's CSS:

```css
@import "tailwindcss";
@import "@mockups/design-tokens/theme.css";
```

Keep the applicable Tailwind source entries for shared component packages.
Use semantic utilities such as `bg-card`, `text-foreground`, and `border-border`.
Use the defined typography roles for screen text.

Buyer imports this theme from `apps/frontend/qwipo-buyer-paytm-app/src/index.css`, relative to the repository root.
That file also scans `packages/ui/src` and `packages/components/src` with explicit `@source` entries.
The mobile primitives in `@mockups/ui` consume these utilities.

| Use | Existing examples |
| --- | --- |
| Main and secondary text | `text-foreground`, `text-foreground-secondary` |
| Primary action | `bg-primary`, `text-primary-foreground` |
| Subtle action surface | `bg-primary-soft`, `text-primary-soft-foreground` |
| Success state | `bg-success-subtle`, `text-success-foreground`, `border-success-border` |
| Typography | `type-h1`, `type-h2`, `type-body`, `type-price`, `type-price-sm` |

For a chart or map in TypeScript, import values from the package:

```ts
import { colorLight, colorDark } from '@mockups/design-tokens';
```

Select the value for the active theme.
For example, the light theme's brand color is `colorLight.brand.primary`.
The mobile theme provider is `packages/ui/src/theme.tsx`, relative to the repository root.

The theme provider controls the `.dark` class on the document root.
After a token change, examine the two themes.
A defined dark value does not prove sufficient contrast.

## Change a token

1. Find its TypeScript and CSS consumers.
2. Update the corresponding values in `src/tokens.ts` and `theme.css`.
3. Examine the desktop CSS for separate values that must also change.
4. Keep deliberate differences between the design kits.
5. Examine contrast and focus visibility.
6. Use [theme](../../.claude/skills/theme/SKILL.md) for verification.

Synchronize the token representations manually.
A TypeScript export does not update CSS automatically.
