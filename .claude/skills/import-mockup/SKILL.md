---
name: import-mockup
description: Migration pathway — bring an existing app's code in from another local repo (a standalone mockup, a Figma Make / Lovable / v0 export, an older Qwipo prototype) and rebuild it on this repo's shared kit. Use for "port X into here", "migrate the app from <path>", "bring in the seller store", "we have this in another repo".
---

# Importing a mockup from another repo

Two apps here arrived this way and left two lessons. `seller-store` came in
as 51 pages in one move, kept its directory depth so forty relative asset
paths survived, and had its own copies of shadcn components deleted in
favour of `@mockups/web-ui`. `qwipo-buyer-paytm-app` is being rebuilt screen
by screen against screenshots, with the old code as the functional reference
— its `BUILD-NOTES.md` is the procedure. Which of the two you are doing is
the first decision.

Precondition: a brief (`brief`), plus the source path on disk.

## 1. Survey the source before moving anything

Read, don't assume:

```bash
cat <src>/package.json                                     # stack, deps, scripts
find <src>/src -type f | sed 's|.*\.||' | sort | uniq -c   # what's in it
grep -rn "fetch(\|axios\|createClient" <src>/src | head    # backend calls
grep -rln "tailwind" <src>/*.config.* <src>/package.json   # Tailwind, and which major
ls <src>/src/components/ui 2>/dev/null                     # its own shadcn copy?
grep -rn "from '@/" <src>/src | wc -l                      # path-alias imports
grep -rn '\.\./.*\.\(png\|svg\|jpg\)' <src>/src | wc -l    # relative asset paths
```

Then answer, in one line each:

- **Kit.** Phone in a WebView → mobile (`@mockups/ui` + `design-tokens`).
  Laptop console → web (`@mockups/web-ui` + `web-tokens`). The source's own
  styling doesn't decide this; the user in the brief does.
- **Move or rebuild.** *Move* when the source is React + Tailwind and the
  screens are already right — you are re-homing code. *Rebuild* when the
  source is another stack (Angular, Next, React Native, plain HTML), a
  Tailwind v3 export that fights v4, or the screens must match new
  screenshots — the old code becomes the reference, not the input.
- **Backend.** Anything the source fetches becomes `@mockups/mock-data` or a
  local store. If it can't be faked, it isn't a mockup and doesn't belong
  here.
- **Slice.** All of it, or the flows in the brief? The brief's flows first;
  the rest can follow on later branches.

## 2. Scaffold the target; never copy the source's config

Invoke `start-work` (`<name>/import`). Then:

```bash
bun run new <name> [--web]
```

The generator's `package.json`, `tsconfig.json`, `vite.config.ts`,
`eslint.config.js`, `index.css` and `main.tsx` are the ones you keep. The
source's versions carry its toolchain — a different Tailwind major, its own
strictness, a `@/` alias this repo doesn't use — and importing them is how a
port spends a day on config instead of screens.

## 3. Move the source in

- **Keep directory depth if assets use relative paths.** That is why
  `seller-store` has `src/app/` and `src/imports/` — flattening would have
  meant rewriting forty `../../imports/…` paths. Mirror the source's depth
  under `src/` and leave the paths alone.
- **Static assets** the source served from `public/` go to this app's
  `public/`, referenced by `/path`.
- **Don't bring:** `.git`, lockfiles, `node_modules`, CI files, Dockerfile,
  `.env*`, test config, the source README. The deploy fileset is generated
  here (`deploy-mockup`); the README is rewritten from the brief.
- **Path alias.** No app here uses `@/`. Rewrite `@/x` imports to relative
  paths (`sed` over `src/`) rather than adding an alias to one app.

## 4. Reconcile dependencies through the catalog

For every dependency the source needs, in this order:

1. **Already in the kit?** `cn`, `Button`, `Dialog`, `EmptyState`,
   `ErrorState`, `ThemeToggle`, `CopyOnHover`, `StatusBadge`, toasts,
   tables — delete the source's copy and import from `@mockups/web-ui` or
   `@mockups/ui`. The seller-store port arrived with four duplicates of
   things the package already had; duplicates are what the shared package
   exists to prevent.
2. **In the root `catalog`?** Write `"<pkg>": "catalog:"` in the app's
   `package.json`.
3. **Neither** → `add-dependency`. `html-to-image` in the buyer app is the
   bare version that slipped through; don't add another.

Then `bun install`. Never delete or regenerate `bun.lock` to make an install
pass — if it fails, a `package.json` is wrong.

## 5. Styling: one token layer, the kit's

- The source's `tailwind.config.js` / `globals.css` are not imported. The
  generated `index.css` already has the `@source` line and the token import;
  add a second `@source` only for a second shared package the app uses
  (`packages/components/src`, say).
- Tailwind v3 → v4 differences that show up in exports: `@tailwind base;`
  becomes `@import "tailwindcss"`; `tailwind.config.js` theme extensions
  become the `@theme` block (mobile) or already exist in `web-tokens` (web);
  `tailwindcss-animate` is replaced by what `web-tokens/theme.css` bundles.
- Raw utility classes (`bg-white`, `text-gray-900`) may stay on a web import
  — `web-tokens/theme.css` carries a `.dark` rebinding layer for them, which
  is why 40k lines of seller-store didn't need rewriting. Don't "fix" them
  to semantic tokens unless you're doing it wholesale.
- A colour that is genuinely brand-external (Paytm's `#00BAF2`) is named
  once in the app's `index.css` and used by name. Everything else becomes a
  token via `theme`.
- Once the port compiles, invoke `design-language` on the app. An import is
  where copied palettes, chart hex and `bg-gray-50` arrive in bulk.

## 6. Fake the backend

Replace each `fetch`/client call with data from `@mockups/mock-data` or a
small local store (`seller-store` uses subscribe/notify stores in
`src/app/lib/*-data.ts`). Loading, empty and error stay demoable without a
server: a `setTimeout` for loading, an empty array for empty, a thrown error
for error. Fixtures missing an entity → `mock-data`.

## 7. Types: fix from the compiler, not by hand

`verbatimModuleSyntax` is on, so a type imported as a value is a hard error
(`TS1484`), and ports arrive with dozens. Run typecheck once, then fix every
line the compiler names to `import type { … }` or `import { x, type Foo }`.
`strict` is off, so almost everything else passes; a genuine error is
usually a fixture missing a field, and the fixture is what to fix.

## 8. Wire the app's identity

- `package.json` `description`; app `README.md` from the brief with the
  demo logins (personas, OTPs) and the "what looks odd and why" notes — the
  seller-store README is the model.
- `<VersionBadge />` mounted once in `main.tsx` (the generator did this;
  make sure your `main.tsx` rewrite kept it).
- A row in the `CLAUDE.md` apps table and the README layout block.

## 9. Parity, screen by screen

Invoke `verify`. Then walk every imported screen against the source (or the
screenshots) in the browser — light and dark, and on a phone via the Network
URL for a mobile app — and keep a status table in the app README like the
buyer app's ("Catalog ✅ · Home, Cart, Orders ⬜"). A port isn't done when it
compiles; it's done when someone can click the brief's flows.

Land with `land-work`. Deploying is separate (`deploy-mockup`).

## Report

Product terms: "The seller store is in as `seller-store` — 51 pages, five
personas, OTP 1234 — on the web kit. Orders and Reports match the original;
the map dialog is stubbed. Verified light and dark." Say what isn't at
parity yet.
