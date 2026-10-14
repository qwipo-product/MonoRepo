---
name: design-language
description: Scoped skill — audit and fix drift from the shared design language: token values duplicated in an app, hex or raw palette classes in screens, chart and map colours hard-coded in JS, a per-app @theme block, a component copied out of a package, arbitrary pixel values. Invoked by review, theme and import-mockup; use directly for "check the tokens", "is this on the design system", "why does this screen look different from that one".
---

# Design language

There is one design language, and it lives in `packages/design-tokens`
(brand, colour, type, radius, elevation), with `packages/web-tokens`
layering desktop density on top. Every mockup reads from there, the same way
each app reuses its existing product fixtures and buttons from
`@mockups/ui`. An app that carries a colour of its own has forked the design
language, and the fork shows the day two mockups are put side by side.

## What "duplicated" means here

| Drift | Looks like | Fix |
| --- | --- | --- |
| A per-app token block | `@theme { --color-primary: #2563eb; … }` in an app's `index.css` | delete it; the app imports `design-tokens/theme.css` (mobile) or `web-tokens/theme.css` (web) and nothing else. No app has one today and the scaffold no longer emits one |
| A token value copied into JS | `const PALETTE = { blue: "#2563EB", … }` for a chart; `'#2563eb'` for a map marker | import the value: `import { colorLight } from '@mockups/design-tokens'` (or `web-tokens`) → `colorLight.brand.primary`, `colorLight.status.warning.solid` |
| Hex in a className | `text-[#002970]`, `bg-[#eef1f6]` | the semantic utility (`text-foreground`, `bg-background-subtle`). Brand-external colours: below |
| Raw palette classes | `bg-gray-50`, `text-blue-600`, `border-slate-200` | `bg-background-subtle`, `text-primary`, `border-border`. Seller-store's ported pages are the one wholesale exception — leave them unless the job is the wholesale rewrite |
| Arbitrary values | `h-[52px]`, `rounded-[24px]`, `text-[9px]` | the scale: `h-11` / `h-9`, `rounded-lg` / `rounded-xl`, `text-xs`; the smallest label is 10px |
| A token used but never defined | `bg-shell` with no `--color-shell` in any shared `theme.css` | add it to the package's `@theme inline` block. Until then it renders as nothing, with no error |
| A component copied out of a package | an app's `components/empty-state.tsx` beside `@mockups/ui`'s | delete the copy and import the package's — `share-component` |
| Both token layers in one app | `design-tokens/theme.css` and `web-tokens/theme.css` in one `index.css` | keep the one that matches the kit |
| `tokens.ts` and `theme.css` disagree | a value changed in one file only | they are hand-maintained mirrors; change both, light and dark |

## Brand-external colours

A mockup imitating another product's shell (the Paytm WebView frame) needs
that product's colours, and they are not our tokens. They are still defined
**once**: a named block in the app's `index.css` —

```css
:root { --paytm-blue: #002970; --paytm-cyan: #00baf2; --paytm-surface: #eef1f6; }
@theme inline { --color-paytm-blue: var(--paytm-blue); --color-paytm-cyan: var(--paytm-cyan); --color-paytm-surface: var(--paytm-surface); }
```

— and screens write `text-paytm-blue`. That block *adds* names; it never
redefines a shared token. Twenty-five `text-[#002970]`s across screens is
drift even when every one of them is the right colour.

## The audit

From the repo root, scoped to the app (or the branch's diff):

```bash
APP=apps/frontend/<app>/src
grep -n "^@theme" $APP/index.css                                                     # app-owned token block (a brand-external `@theme inline` is fine)
grep -c "tokens/theme.css" $APP/index.css                                            # must print 1
grep -rnE "#[0-9a-fA-F]{6}\b" $APP --include='*.tsx' --include='*.ts'                # hex in code
grep -rnE "\b(bg|text|border)-(gray|blue|red|green|slate|zinc|amber|emerald|rose|orange|purple)-[0-9]{2,3}\b" $APP --include='*.tsx'   # raw palette
grep -rnE "\b(h|w|p|px|py|m|text|rounded|gap)-\[[0-9]+px\]" $APP --include='*.tsx'   # arbitrary px
grep -- "--color-<name>:" packages/design-tokens/theme.css packages/web-tokens/theme.css   # for any semantic class you're unsure exists
```

Read the hits, don't count them. A hex inside the brand-external block is
fine; a hex in a chart palette is not.

## Fixing

- **Mechanical hits** — a palette class with an obvious semantic twin, a JS
  hex equal to a token value — fix in place, on the same branch.
- **A missing token** the screen genuinely needs (a surface no token names, a
  new status) — add it to `design-tokens` (`tokens.ts` and `theme.css`, light
  and dark), expose it under `@theme inline`, then use it. That is a `theme`
  change and moves every app; say so.
- **Seller-store's raw utilities** — out of scope unless the request is the
  wholesale rewrite. Note the count and move on.
- **Token or one-off?** It's a token if a second screen could plausibly want
  it. If it's a brand decision, ask.

## Report

Say what was drifting and where it now lives: "the dashboard's chart palette
was eight hex values copied from the tokens; it now reads `colorLight` from
`@mockups/web-tokens`, so a brand change moves the charts too." Name what
was left alone and why.
