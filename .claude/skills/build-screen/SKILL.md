---
name: build-screen
description: Develop pathway — add or change a screen, flow, sheet, dialog or state inside an existing mockup. The default pathway when nothing else fits. Use for "add a screen", "change the cart", "fix the header", "show an empty state", "make the button do X".
---

# Building a screen

The deliverable is working pixels: a screen that looks right, clicks
through, and can be shown. Don't build abstractions for a second use that
may never come.

## First response

One sentence naming the change. If the ask is a flow or several screens,
invoke `brief` for one round of questions; if it's a tweak, just do it. If
you are on `dev`, `testing`, `staging` or `main`, invoke `start-work` before
the first edit.

## Before the first edit

1. **Read the app's README** (`apps/frontend/<app>/README.md`). It carries
   the demo logins, the personas, and the things that look wrong on purpose.
   `seller-store` has five personas (OTP `1234`) including two *Empty* ones
   that wipe the data so every screen's empty state is visible; the buyer
   app has `BUILD-NOTES.md` with its screenshot-matching rules and two
   shells (Buyer, Paytm).
2. **Know the kit.** Mobile apps import from `@mockups/ui` and declare
   tokens in their `index.css`; web apps import from `@mockups/web-ui` and
   get tokens from `web-tokens/theme.css`. Never mix. The two catalogs
   (`storybook` :6006, `storybook-web` :6007) show what each kit already
   has — look before building a control.
3. **Find where screens live in this app.** `src/screens/` in the mobile
   apps; `src/app/pages/` + `routes.tsx` in seller-store; `nav.ts` for the
   buyer app's navigator. Follow the app's shape, not a preferred one.

## Building

- **Compose from the kit.** Button, Card, Sheet, Tabs, Chip, QtyStepper,
  EmptyState (mobile); tables, dialogs, sheets, combobox, charts, AppShell,
  StatusBadge (web). A one-off variant of a primitive is a smell — extend
  the primitive in the package (`share-component`) rather than restyling it
  in the screen.
- **Tokens, never hex.** `bg-primary`, `text-foreground`, `bg-muted`,
  `border-border`, the status set. Chart and map colours in JS come from
  `colorLight` in the token package. A brand-external colour (Paytm) is
  named once in the app's `index.css`. A new colour is a `theme` job;
  `design-language` is the audit.
- **Data from `@mockups/mock-data`.** Products, sellers, orders, banners,
  addresses, notifications already exist. Missing something → `mock-data`,
  never an inline array of made-up rows that drifts from every other
  screen.
- **Strings through `useI18n()`** in the mobile apps that already use it
  (`t('cart.title')`); add the key to `packages/i18n` in all four
  languages, English as the fallback.
- **Every list screen gets an empty state**, and any screen that pretends
  to load gets a loading one. Check them under the Empty personas where the
  app has them.
- **Mobile: 44px targets, one thing per screen, bottom sheets** inside the
  phone frame. Web: 36px controls, dense tables, dialogs.
- **Dark mode is free if you used tokens.** Toggle it once before calling
  the screen done.
- **Copy is product copy.** No lorem ipsum, no "Do the thing"; Indian
  names, ₹, real-looking SKUs from the fixtures.

## Traps that pass every check and still break the page

- Tailwind never scans `node_modules`. A class from a shared package
  renders unstyled unless the app's `index.css` has `@source` pointing at
  that package's `src`. Nothing errors.
- A class built by interpolation (`` `shadow-${name}` ``) is never
  generated. Write the full class strings out.
- `verbatimModuleSyntax`: `import type { Foo }` for types, or the build
  fails with `TS1484`.
- The phone frame's `relative` is load-bearing — bottom sheets position
  against it. Remove it and every sheet covers the browser window.
- `strict` is off on purpose. A type error usually means the mock data is
  wrong, not the config. Don't tighten `tsconfig`.

## New dependency, shared code, data, colours

Route rather than improvise: `add-dependency`, `share-component`,
`mock-data`, `theme`.

## Definition of done

Invoke `verify`. Then say what changed in product terms, which states you
checked (empty, loading, dark, phone), and what you didn't. Offer
`land-work` to put it on `dev`.
