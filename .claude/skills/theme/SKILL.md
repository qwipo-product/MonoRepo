---
name: theme
description: Scoped skill — change how a mockup looks at the token level: brand colours, status colours, fonts, radii, spacing, dark mode. Invoked by build-screen; use directly for "change the primary colour", "make it look like Paytm", "the cards feel too round", "dark mode is wrong".
---

# Theme and tokens

Components never carry a colour; tokens do. Where a token lives depends on
the kit, and putting it in the wrong place is the most common way to change
one app and accidentally change five.

| Want to change | Mobile app | Web app |
| --- | --- | --- |
| This one mockup's palette | not per app — every mobile app shares `design-tokens` | not per app — every web app shares `web-tokens` |
| A shell imitating another brand (the Paytm frame) | one named block in the app's `index.css`, used by name — `design-language` has the shape | same |
| Every mockup's brand colour | `packages/design-tokens/src/tokens.ts` + `theme.css` | the same file — `web-tokens` re-exports brand from `design-tokens` |
| Density: radius, control height | `design-tokens` | `web-tokens` — they differ on purpose (44px vs 36px, 12px vs 8px) |
| Status colours (success / warning / danger quads) | `design-tokens` | inherited |
| Font | `design-tokens` `--font-sans` | `web-tokens/theme.css` (Inter, loaded in `index.html`) |

Rules:

1. **Never a hex in a component or a screen.** The one exception is a
   brand-external colour the mockup imitates (Paytm's `#00BAF2`), kept as a
   literal with a comment naming the brand.
2. **One token layer per app.** `design-tokens` and `web-tokens` both
   define `--primary`, `--background`, `--radius`. Import both and the later
   import wins silently. Check the app's `index.css` has exactly one.
3. **Never move tokens into `packages/ui` or `packages/web-ui`.**
   Components reference `bg-primary`; what that resolves to is decided
   outside them.
4. **`tokens.ts` and `theme.css` are hand-maintained mirrors.** Change both
   in the same commit, or TypeScript consumers and the CSS theme disagree.
5. **Dark mode is a `.dark` class on `<html>`**, owned by the app's theme
   provider. Every token has a dark value beside its light one; add both or
   the dark screen shows the light colour.
6. A shared-package token change rebuilds and redeploys every mockup on the
   deploy path (`packages/**` is in every pipeline's path filter). That's
   correct — say it in the summary.

Drift — a colour that escaped into an app, a hex in a chart, a raw palette
class — is `design-language`'s job; invoke it after any token change.

Verify: toggle dark, check one screen in each affected app, and open the
Seller Store design handbook when desktop foundations change.
