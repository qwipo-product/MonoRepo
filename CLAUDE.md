# CLAUDE.md

Guidance for Claude Code working in this repo.

## What this repo is

A lab for **frontend mockups** — mobile apps, web apps, websites — built to be
shown to people, not shipped. It is used mostly by the product team, who direct
you rather than write the code themselves.

Two things follow from that:

1. **Bias to working pixels.** A screen that looks right and clicks through is
   the deliverable. Don't build abstractions for a second use case that may
   never exist.
2. **Explain in product terms.** When you summarise what you did, name screens
   and behaviour ("the cart now shows the MOV warning when the subtotal is
   under ₹5,000"), not modules and hooks. Assume the reader will not open the
   diff.

## Toolchain

Bun + Turborepo + Vite + React 19 + Tailwind v4. Nix flake pins the toolchain;
direnv activates it. Never suggest `npm` or `yarn` — `bun` only.

```bash
bun dev --filter=@mockups/<app>   # run one app
bun run check                     # lint + typecheck + build, run before finishing
bun run new <name>                # scaffold a new mockup
bun run deploy:add <app>          # generate an app deploy fileset + pipelines
```

## Layout

```
apps/frontend/<mockup>/     one app per mockup
apps/backend/<service>/     Bun services (currently just mock-api)
packages/<shared>/          shared code — see below
native/qwipo-buyer-app/     React Native / Expo — NOT in the Bun workspace
                            (own bun.lock + toolchain); `bun run check` skips it
```

What exists today:

| App | Port | Kit | What it is |
| --- | --- | --- | --- |
| `qwipo-buyer-paytm-app` | 5175 | mobile | Buyer app in a Paytm WebView frame |
| `seller-store` | 5174 | web | Distributor + super-admin console (see below) |
| `rirn` | 5173 | web | Retailer identity network — company discovery console |
| `rirn-retailer` | 5176 | **mobile** | Retailer-facing RIRN pages for a buyer-app WebView |
| `storybook` | 6006 | mobile | Catalog for `@mockups/ui` |
| `storybook-web` | 6007 | web | Catalog for `@mockups/web-ui` |

`apps/frontend/` also contains `qwipo-app`, `qwipo-app-v2` and
`qwipo-buyer-app` — these are **stale leftovers** with no `package.json`, just
an orphaned `node_modules`. Turbo and Bun ignore them. Don't treat them as
apps; they're safe to delete once someone confirms nothing is being salvaged.

## Reach for these before writing your own

**Check which kit the app you're in uses before you import anything** — see
"Two design systems" below.

| Need | Import from | Notes |
| --- | --- | --- |
| Button, Card, Badge, Input, Tabs (mobile) | `@mockups/ui` | Also `cn()`, `ThemeProvider`, `useTheme()` |
| Tables, dialogs, sheets, combobox, charts, AppShell (web) | `@mockups/web-ui` | shadcn + Radix. Also `cn()`, `StatusBadge`, `EmptyState` |
| Token values in TS (chart colours, sizes) | `@mockups/design-tokens` (mobile), `@mockups/web-tokens` (web) | Values only — components use semantic classes |
| Translated strings | `@mockups/i18n` | `useI18n()` → `t('cart.title')`. en / hi / te / ta |
| Product, Order, Seller, Cart types | `@mockups/types` | Framework-agnostic |
| Products, sellers, orders, banners | `@mockups/mock-data` | Don't invent new fixtures — extend these |
| TS / ESLint presets | `@mockups/tsconfig`, `@mockups/eslint-config` | Apps just `extends` them |

### Two design systems

Mobile and desktop-admin are different design languages, not two skins, so
they have separate kits. Don't mix them in one app.

| | Mobile | Web / admin |
| --- | --- | --- |
| Primitives | `@mockups/ui` | `@mockups/web-ui` |
| Tokens | `@mockups/design-tokens` + app `@theme` block | `@mockups/web-tokens` — ships a complete `theme.css`, so a web app needs **no** `@theme` block |
| Controls / radii | 44px targets, 12px cards | 36px controls, 8px cards, 2px table pills |
| Storybook | `@mockups/storybook` :6006 | `@mockups/storybook-web` :6007 |
| Scaffold | `bun run new <name>` | `bun run new <name> --web` |

Brand colour has one definition: `web-tokens` re-exports `colorLight` /
`colorDark` from `design-tokens`. Change a brand value in `design-tokens` and
both layers move. Change a *density* value (radius, control height) in
whichever layer it belongs to — those differ on purpose.

`web-tokens/theme.css` also carries `tw-animate-css`, which the Radix
overlays need. Importing it is what makes dialogs and sheets animate.

Deep imports work where the package declares them:
`import { IMG } from '@mockups/mock-data/imageBank'`.

### The Seller Store app

`apps/frontend/seller-store` is a port of the standalone Seller Store repo —
51 pages, 59 routes, the biggest thing here. Two conventions that look odd
until you know why:

- **Source lives under `src/app/`, assets under `src/imports/`.** That mirrors
  the original repo's depth exactly, which is what let ~40 relative asset
  paths (`../../imports/categories/*.png`) survive the port untouched. Don't
  flatten it.
- **It has its own `root-layout.tsx`**, not `AppShell` from `@mockups/web-ui`.
  The sidebar is persona-driven (admin vs seller vs empty-mode), which the
  generic shell doesn't model. `AppShell` is for new web mockups.

It ships five demo personas behind a login. OTP is `1234` for all of them:

| Persona | Mobile | Lands on |
| --- | --- | --- |
| Seller | `9900000002` | Seller dashboard |
| Seller (Empty) | `8888888888` | Inception-day empty states |
| Super Admin | `9900000001` | `/admin` |
| Super Admin (Empty) | `9999999999` | Admin empty states |
| Design System | `7777777777` | `/design` |

The empty-mode personas exist so reviewers can see every screen's empty state
without deleting data. If you add a list screen, give it an empty state and
check it under those logins.

Its pages are written with **raw Tailwind utilities** (`bg-white`,
`text-gray-900`), not semantic tokens. They still go dark-aware because
`web-tokens/theme.css` carries a `.dark` rebinding layer for those utilities.
That layer is the only reason 40k lines didn't need rewriting — don't delete
it, and don't "fix" the pages to use semantic classes unless you're doing it
wholesale.

`/design` is a 4,600-line in-app design system handbook inherited from the
original repo. It duplicates `storybook-web` and will drift. Prefer
`storybook-web`; propose retiring the page rather than updating both.

### When to promote code into a package

Only when a **second app** actually needs it. Until then it lives in the app.
A screen used by one mockup is not shared code.

If you do promote something, it goes in as raw TypeScript — these packages have
no build step, and adding one would break hot reload for everyone.

## Rules that will bite you if you skip them

- **Tailwind + shared packages.** Tailwind never scans `node_modules`. An app
  using classes from a shared package needs an `@source` line in its
  `src/index.css` pointing at that package's `src` — `packages/ui/src` for
  mobile, `packages/web-ui/src` for web. Without it the component renders
  unstyled and nothing errors — you'll waste an hour. The same applies to a
  class you build by interpolation (`` `shadow-${name}` ``): Tailwind only
  sees complete strings in the source, so write them out.
- **Design tokens belong to the app or the token package, never to `ui`.**
  `packages/ui` and `packages/web-ui` components reference `bg-primary` /
  `text-foreground`. On mobile, each app's `@theme` block defines them; on
  web, `@mockups/web-tokens/theme.css` does. Never hard-code a hex value in a
  component, and never move tokens into either `ui` package.
- **One token layer per app.** `design-tokens` and `web-tokens` both define
  `--primary`, `--background`, `--radius`… Import both and whichever CSS
  import lands last silently wins. Pick the one that matches the app.
- **Dependency versions go in the root `catalog`.** Packages write
  `"react": "catalog:"`. Adding a dep means: add it to the catalog with an
  exact version, then reference `catalog:` from the package that needs it.
- **New app dev ports must be unique** so `bun dev` can run several at once.
  `bun run new` handles this; if you hand-roll an app, check the others first.
- **`verbatimModuleSyntax` is on.** A type imported as a value is a hard error
  (`TS1484`). Write `import type { Foo }`, or `import { bar, type Foo }` when
  mixing. This bites hardest when porting code in from another repo — expect a
  batch of them and fix them from the compiler's own output rather than by
  hand.
- **Don't copy a component into an app when the package already has it.** The
  Seller Store port arrived with its own `EmptyState`, `ErrorState`,
  `ThemeToggle` and `CopyOnHover`; all four already existed in
  `@mockups/web-ui`. Duplicates are exactly what the shared package prevents —
  delete them and repoint the imports.
- **Both lockfiles are committed.** Never delete or regenerate `bun.lock` or
  `flake.lock` to work around an install problem — fix the actual cause.

## Deliberately loose

`strict` is off in TypeScript and the lint rules are minimal. This is a
decision, not an oversight. Do not "fix" it by tightening `tsconfig` or adding
rules. If a type error is genuinely blocking, the mock data is usually what's
wrong — not the config.

Same for `any` and `console.log`: both fine here.

## Before you say you're done

Run `bun run check`. If you changed a screen, also confirm the dev server
compiles it — a Tailwind `@source` miss or a bad import passes typecheck and
still renders a broken page.

**Known pre-existing failure:** `@mockups/qwipo-buyer-paytm-app#lint` fails on
`src/components/SearchField.tsx` — a stale `eslint-disable` comment for
`jsx-a11y/no-autofocus`, a plugin this repo doesn't install. ESLint 10 errors
on unknown rules in disable comments. It is unrelated to whatever you're
doing; don't chase it, and don't assume you broke it. Fix is either installing
the plugin or dropping the comment — ask first, it's someone else's app.

Until that's resolved, verify your own work with a filtered run:

```bash
bunx turbo run lint typecheck build --filter=@mockups/<your-app>
```

State plainly what you verified and what you didn't.

## Deployment

Azure DevOps, via templates in the shared `Qwipo B2B/k8s` repo — same pattern
as `seller-platform`. Each deployable app carries four files: `Dockerfile`,
`nginx.conf` (frontends only), `docker-build.yml`, `azure-release.yaml`.

Don't hand-write or hand-copy that set — generate it:

```bash
bun run deploy:add seller-store
bun run deploy:add rirn --service mockups-rirn-company --label "RIRN Company"
bun run deploy:add storybook --force   # overwrite an existing fileset
```

`scripts/add-deploy.ts` reads the build output directory out of the app's own
`build` script and derives the Azure pipeline display name from the service
name, which are the two things copying files by hand kept getting wrong. It
prints the two prerequisites it can't satisfy from here: the k8s GitOps
manifest and the `az pipelines create` registration.

Things to get right if you touch them:

- **No runtime config, on purpose.** There is no `entrypoint.sh` and no
  `public/configs/config.*.json`. Every mockup bundles `@mockups/mock-data` at
  build time and talks to no backend, so nothing differs between dev and
  production — the image is a pure static artefact, nginx plus a directory of
  files. A config-swapping entrypoint with nothing to swap isn't neutral: it
  `exit 1`s the container on a `NODE_ENV` it doesn't recognise, a live failure
  mode bought for zero benefit. If one mockup ever genuinely needs a backend,
  add the entrypoint back to that app alone and say why in its Dockerfile.
- **Build context is the workspace root**, never the app folder. Dockerfiles
  `COPY . .` and rely on the root `.dockerignore`. Paths inside are
  repo-relative (`apps/frontend/<app>/dist/`).
- **The two Storybook catalogs build to `storybook-static/`, not `dist/`.**
  `turbo.json`'s `build.outputs` lists both and the root `.dockerignore` strips
  both. Point a Dockerfile at the wrong one and nginx serves an empty root — a
  404 page, with nothing failing at build time.
- **Service names are `mockups-<what-it-is>`** — the prefix so mockup images
  can't be confused with real services in the shared registry, and nothing
  more. No `qwipo-` (the registry is already the Qwipo registry and the domain
  already says so) and no `-app` suffix. The demo URL follows from it:
  `https://<service>.dev.bms.qwipo.com`.
- **The release pipeline binds to its build by display name**, via
  `resources.pipelines.source: '<Label> - Build'`. Renaming one without the
  other silently breaks the release. `SERVICE_NAME` also reaches the deploy
  through the build's artefact, so renaming a service needs a fresh **build**
  run before any deploy can bind — `mockups-qwipo-buyer-paytm-app` →
  `mockups-buyer-app` is the live example, and it needs a matching
  `bms-chart/<env>/mockups-buyer-app.yaml` manifest too.
- **The release template exits 1** if the GitOps manifest
  `<TARGET_PATH_PREFIX>/<env>/<service>.yaml` doesn't exist. That's a DevOps
  prerequisite, not something you can fix from this repo — say so rather than
  editing pipelines to work around it.
- **Builds auto-trigger, and the branch picks the environment**: `dev` → dev,
  `testing` → testing, `staging` → staging, `main` → production. The product
  team drives this repo and shouldn't need to open a pipeline to ship a
  mockup, so don't reintroduce `trigger: none`. A manual run can override the
  target with the `environment` parameter; leaving it on `auto` uses the
  branch. Because `main` reaches production, a new mockup needs its manifest
  in **all four** `bms-chart/<env>/` folders before anyone merges — the
  release template exits 1 on a missing one.

Full checklist for putting a new mockup on this path is in the README under
"Deploying a mockup".
