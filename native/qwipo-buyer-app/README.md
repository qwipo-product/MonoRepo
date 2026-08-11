# qwipo-buyer-app (React Native / Expo)

Native mockup of the Qwipo **buyer** app — the buyer flow only (no Paytm mini
shell). Mirrors `qwipo-app-v2` (web) using the same design tokens, ported into
NativeWind.

## This slice (phase 1)

`Splash → Login → OTP → Home → Product List (multi-vendor)`

- **Login roles:** `9876543210` logs in as **salesperson**; any other 10-digit
  number logs in as a **customer**. (OTP accepts any 6 digits.)
- **Product List** = the wholesaler multi-vendor list (Choose vendor · Best
  tag · margin · delivery · Discounts / + Add · cart bar).

Not yet ported (next slices): distributor storefronts, banners/brand rails on
Home, cart / checkout / orders, salesperson task screens, filter & selling-unit
sheets, dark theme, the real brand-SVG mark on Splash/Login (currently a
wordmark).

## Run

This app lives **outside** the bun workspace (its own isolated `node_modules`)
so its Expo/RN/NativeWind deps don't collide with the web apps' React 19.2 /
Tailwind v4 tree — a shared tree gives NativeWind a duplicate `react-native` and
styles silently stop applying.

```bash
cd native/qwipo-buyer-app
bun install          # first time — isolated install, own node_modules
bun run dev          # starts Metro; press i (iOS), a (Android), or w (web)
```

Scan the QR with **Expo Go**, or run a simulator.

## Notes

- **Deps live in this app's `package.json`, not the root `catalog`.** NativeWind
  needs Tailwind **v3**, while the web apps use Tailwind v4 — they can't share a
  catalog entry. RN-only deps (`expo`, `react-native`, `nativewind`) are
  app-local by design.
- **React version:** pinned to `19.0.0` (Expo SDK 53). The web catalog pins
  `19.2.7`. Bun may surface a peer-dep warning on install; Metro resolves the
  app's own copy first via `metro.config.js`. If install hoists a conflicting
  React, add an `overrides`/`resolutions` entry.
- Design tokens are mirrored (light theme) in `tailwind.config.js` from
  `packages/design-tokens/theme.css`. Keep them in sync when tokens change.
