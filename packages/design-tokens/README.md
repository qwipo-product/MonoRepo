# @mockups/design-tokens

The **single, platform-neutral source of truth** for the Qwipo design system.
Every mockup — the Paytm-mini web app, the React Native app, and both
Storybooks — reads its colors, type, spacing, radius, elevation, and motion
from here. No component defines a raw hex or an arbitrary size; it references a
token.

Derived from the running Qwipo app's actual UI, with the drift corrected
(one brand blue, status colors as `{solid, fg, bg, border}` quads, one radius
scale, etc.). See `docs/DESIGN-SYSTEM-ANALYSIS.md` for the reasoning.

## What's here

```
src/tokens.ts   canonical values — primitives + semantic light/dark. Framework-neutral.
src/theme.ts    React Native binding — resolved lightTheme / darkTheme objects.
src/index.ts    public entry (re-exports the above).
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

**React Native** (`@mockups/ui-native`, `apps/native/qwipo-native`):

```tsx
import { themes, type Theme } from '@mockups/design-tokens';

const t: Theme = themes[isDark ? 'dark' : 'light'];
<View style={{ backgroundColor: t.color.surface.card, padding: t.space[4],
               borderRadius: t.radius.lg }}>
  <Text style={t.typography.h2}>…</Text>
</View>
```

## Dark mode — the contract (this is the fix)

Dark mode is a **`.dark` class** on `<html>` (web) / a theme name (native).
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
the value in `tokens.ts`, mirror it in `theme.css`, done. `theme.ts` derives
from `tokens.ts` automatically.
