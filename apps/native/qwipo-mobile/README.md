# @mockups/qwipo-mobile

Qwipo buyer app as an **Expo + NativeWind** mockup — a clickable prototype, token-driven from
`@mockups/design-tokens`. This is a mockup to demonstrate the app on a device; the production
React Native app is a separate codebase.

## Run it

```bash
cd ~/Qwipo/mockups-lab
bun install
# Align native module versions to the Expo SDK (recommended after install):
cd apps/native/qwipo-mobile && npx expo install --fix
# Start Metro:
bun run --filter @mockups/qwipo-mobile start
```

Then press **i** (iOS simulator), **a** (Android emulator), or scan the QR with **Expo Go**.

> First run in a monorepo: if Metro can't resolve a module, run `npx expo start -c` once to clear
> its cache.

## How it's wired

- **NativeWind v4** — Tailwind classes in React Native. `babel.config.js` adds the NativeWind
  preset, `metro.config.js` pipes `global.css`, and `tailwind.config.js` defines the semantic
  colour tokens.
- **Design tokens** — the colours in `tailwind.config.js` mirror
  `@mockups/design-tokens/src/tokens.ts` (`colorLight`), so classes read the same as the web app
  (`bg-primary`, `text-foreground-secondary`, `bg-success-subtle`, …). Runtime values (e.g. icon
  colours in the bottom nav) import `lightTheme` from the package directly.
- **Navigation** — a lightweight state router in `App.tsx` with a token-styled bottom tab bar,
  mirroring the web app. Swap for `expo-router` / React Navigation in the production app.

### Keeping tokens in sync

`tailwind.config.js` duplicates the token hex values because the config runs as plain JS at build
time and the tokens ship as raw TS (no build step). The clean fix — so there's genuinely one
source — is to have `@mockups/design-tokens` emit a JSON/JS artifact that both the web `theme.css`
and this config consume. Until then, keep the two in sync.

## What's in this first slice

- Foundation: Expo + NativeWind + token bridge + monorepo Metro config.
- Primitives (`src/ui`): Button, Card, Badge, Chip — token-driven, mirroring `@mockups/ui` APIs.
- Screens: **Home** (header, deliver-to, search, tabs, distributors rail, categories, brands),
  plus **Reorder** and **Cart** stubs, wired to the bottom tabs.

Next slices: Product List + selling-units sheet, Cart → Order Summary → Confirmation, Storefront,
and a dark-mode token swap.
