---
name: add-dependency
description: Scoped skill — an app needs a package that isn't installed. Resolves through the root catalog only. Invoked by build-screen and import-mockup; use directly for "I need library X", "add recharts", an import that won't resolve.
---

# Adding a dependency

Every version in this repo is pinned once, in the `catalog` in the root
`package.json`. Apps write `"react": "catalog:"`. Upgrading React is a
one-line diff, not fifteen.

1. **Does the kit already cover it?** Charts (`recharts`, wrapped by
   `web-ui`'s `chart`), maps (`leaflet`), forms (`react-hook-form`),
   carousels (`embla`), date pickers (`react-day-picker`), OTP inputs,
   toasts (`sonner`), animation (`motion`) are all here. Name what covers
   it and stop.
2. **In the catalog?** Add `"<pkg>": "catalog:"` to the app's
   `package.json`, `bun install`, done.
3. **Not in the catalog:** add it to the root `catalog` with an **exact
   version** (no `^`, no `~`; current stable, not a beta), then reference
   `catalog:` from the app. Never write a bare version in an app manifest —
   `html-to-image` in the buyer app is the one that slipped through and the
   reason this check exists.
4. `bun install`. The lockfile updates and is committed with the change.
   Never delete or regenerate `bun.lock` to get past an install error — if
   it fails, a manifest is wrong; fix that.
5. If the package ships CSS (`leaflet/dist/leaflet.css`), import it in the
   app's `index.css` **after** the token import.

Bumping a version already in the catalog moves every app at once and is
platform work — say so and stop.
