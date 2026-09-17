---
name: share-component
description: Scoped skill — promote a component, helper or pattern from one app into the shared packages, and give it a Storybook story. Invoked by build-screen; use directly for "use this in the other app too", "make it shared", "add it to the kit", "add a story".
---

# Sharing a component

Only when a **second app** actually needs it. Until then it lives in the
app it was built for — a screen used by one mockup is not shared code, and
an abstraction for a use that may never come is the one thing this repo
doesn't do.

1. **Confirm the second consumer exists** — name the app and the screen. If
   it doesn't, stop and leave the component where it is.
2. **Pick the package by kit.** Mobile primitives → `packages/ui`; mobile
   product components composed of them (ProductCard, PriceLabel) →
   `packages/components`; web primitives and patterns → `packages/web-ui`.
   A component can't be in both kits — if both need it, it's two
   components.
3. **Raw TypeScript, no build step.** Add the file under the package's
   `src/`, export it from `src/index.ts`. Every running app hot-reloads it.
   Adding a build step to a package breaks hot reload for everyone.
4. **No tokens in the package.** The component uses `bg-primary` /
   `text-foreground` and nothing else decides the colour.
5. **Repoint every consumer** to the package import and delete the
   app-local copy. Two copies is the bug this step exists to prevent.
6. **A story in the matching catalog** — `apps/frontend/storybook/src/…`
   for mobile, `storybook-web/src/…` for web — in the shape the
   neighbouring `*.stories.tsx` files use (`Meta` + `StoryObj`, a
   `docs.description` sentence saying when to use it). The catalog is the
   design team's inventory; a component without a story is invisible to
   them.
7. **Every consuming app needs the `@source` line** for that package in its
   `index.css`, or the component renders unstyled with no error.

Done: `verify` for every app touched, plus the catalog.
