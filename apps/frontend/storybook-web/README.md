# @mockups/storybook-web

Storybook for the **web / desktop-admin** design system — the living catalog of
`@mockups/web-tokens` and `@mockups/web-ui`.

Sibling to `@mockups/storybook`, which covers the mobile-first kit
(`@mockups/design-tokens` + `@mockups/ui`). Two catalogs rather than one
because the two layers are genuinely different design languages: a 44px tap
target and a 36px toolbar control shouldn't sit in the same gallery pretending
to be alternatives.

## Run it

From the repo root:

```bash
bun install
bun dev --filter=@mockups/storybook-web
```

Serves on http://localhost:6007 (the mobile catalog is on :6006 — both can run
at once).

Build a static, shareable site:

```bash
bun run build --filter=@mockups/storybook-web
# output: apps/frontend/storybook-web/storybook-static
```

## What's inside

- **Foundations** — Colors (brand, the status quads, the chart palette),
  Typography (the admin type scale, voice & tone), Space & shape (spacing,
  density recipes, radii, elevation, motion, z-index, breakpoints, control
  sizing).
- **Primitives** — Button, Card, Status badge, Forms, Feedback & overlays.
- **Patterns** — List page: the canonical `flex-col h-full` → sticky toolbar →
  scrolling table → pagination footer shape.
- **Layout** — App shell, at desktop and mobile widths.

Every Foundations story reads its values **live** from `@mockups/web-tokens`,
so the docs can't drift from the tokens.

## Themes

Use the **Light / Dark** toggle in the toolbar. It flips a `.dark` class on
`<html>` via `@storybook/addon-themes`, which is the same contract the apps
use — so what you see here is what the app renders.

`next-themes` is mounted alongside in `forcedTheme` mode purely so components
that *read* the theme keep working (`ThemeToggle`, and `AppShell`'s logo swap).
It's told what the addon already decided, so the two can't disagree.

## Adding a story

Put it under `src/<group>/Name.stories.tsx` and follow the existing taxonomy —
`Foundations` / `Primitives` / `Patterns` / `Layout`. Set
`parameters: { layout: 'fullscreen' }` for anything shell- or page-shaped; the
preview decorator gives those the full frame height instead of boxing them in.

Check every new story in **both** themes before calling it done.
