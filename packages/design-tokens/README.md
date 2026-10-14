# @mockups/design-tokens

The **single, platform-neutral source of truth** for the Qwipo design system.
The Buyer/Paytm app and desktop token layer read their colors, type, spacing,
radius, elevation and motion from here. No component defines a raw hex or an arbitrary size; it references a
token.

## What's here

```
src/tokens.ts   canonical values — primitives + semantic light/dark. Framework-neutral.
src/index.ts    public entry (re-exports token values).
theme.css       Web / Paytm-WebView binding — Tailwind v4 @theme, light + `.dark`.
```

## Consuming it

**Web / Paytm WebView** (`@mockups/ui`, `apps/frontend/qwipo-buyer-paytm-app`):

```css
/* app index.css */
@import "tailwindcss";
@import "@mockups/design-tokens/theme.css";
```

Then use token-bound utilities: `bg-card`, `text-foreground`,
`text-foreground-secondary`, `border-border`, `bg-primary`,
`text-primary-foreground`, `bg-success-subtle text-success-foreground
border-success-border`, `rounded-lg`, and the `.type-*` role classes
(`.type-h2`, `.type-price`, …).

## Dark mode — the contract (this is the fix)

Dark mode is a **`.dark` class** on `<html>`.
The old app set a `data-theme` *attribute* that the CSS never read, so its
toggle did nothing. The provider now owns the class:

```ts
document.documentElement.classList.toggle('dark', isDark);
```

Every semantic token has a validated dark value in the same file — light and
dark ship together, never one without the other.

## Changing a token

`tokens.ts` and `theme.css` are edited **together** (small set, low churn — the
repo has no build step by design, so both are hand-maintained mirrors). Change
the value in `tokens.ts`, mirror it in `theme.css`, done.
