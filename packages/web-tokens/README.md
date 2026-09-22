# @mockups/web-tokens

The token layer for **desktop / admin** surfaces — dense list pages, data
tables, dialogs, sidebars. The web counterpart to `@mockups/design-tokens`,
which stays mobile-first.

## Why there are two token layers

Because a phone screen and an admin console aren't the same product wearing
different colours. The differences are real and deliberate:

| | `design-tokens` (mobile) | `web-tokens` (web) |
|---|---|---|
| Controls | 44px tap targets | 36px (`h-9`) |
| Cards | 12px radius | 8px radius |
| Table pills | — | 2px radius |
| Body text | 16px | 14px |
| Charts | none | 8-colour `chartPalette` |

**Pick one per app.** Both define `--primary`, `--background`, `--radius` and
friends, so importing both leaves whichever CSS import lands last winning
every shared property — silently.

## Brand colour is not duplicated

`src/tokens.ts` re-exports `colorLight`, `colorDark`, `space` and `zIndex`
straight from `@mockups/design-tokens`. There is one definition of the Qwipo
blue and of the status quads, not two that happen to agree today. Change a
brand value in `design-tokens` and both layers move.

Only the things that genuinely differ are declared here: radius, density,
control sizing, the admin type scale, and the chart palette.

## What's here

```
src/tokens.ts   web/admin values + re-exports of the shared colour scheme
src/index.ts    public entry
theme.css       Tailwind v4 binding — @theme, light + `.dark`, animations
```

## Consuming it

```css
/* app src/index.css */
@import "tailwindcss";
@source "../../../../packages/web-ui/src";
@import "../../../../packages/web-tokens/theme.css";
```

That single import also pulls in `tw-animate-css`, which the Radix overlays in
`@mockups/web-ui` need — without it, dialogs and sheets appear with no
animation and nothing errors.

For token *values* in TypeScript (Recharts series colours, canvas drawing):

```ts
import { chartPalette, component, radius } from '@mockups/web-tokens';
```

## The dark-mode rebinding layer

`theme.css` ends with a long block that re-binds raw Tailwind utilities under
`.dark`:

```css
.dark .bg-white   { background-color: oklch(0.205 0 0); }
.dark .text-gray-900 { color: oklch(0.97 0 0); }
.dark .bg-blue-50 { background-color: oklch(0.4 0.14 264 / 0.18); }
```

This exists because the ported Seller Store pages — ~40,000 lines — are
written with `bg-white` / `text-gray-900`, not semantic tokens. The rebinding
is what makes them dark-aware without a rewrite. It is load-bearing: don't
delete it, and keep it in mind when a page looks right in light and wrong in
dark.

New screens should still prefer semantic classes (`bg-card`, `text-foreground`).

## Changing a token

`src/tokens.ts` and `theme.css` are hand-maintained mirrors — this repo has no
build step by design. **Edit both in the same commit**, then update the
matching section of `packages/web-ui/DESIGN-SYSTEM.md` and the Storybook
story in `apps/frontend/storybook-web`.
