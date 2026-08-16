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
```

## Layout

```
apps/frontend/<mockup>/     one app per mockup
apps/backend/<service>/     Bun services (currently just mock-api)
packages/<shared>/          shared code — see below
```

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

State plainly what you verified and what you didn't.

## Deployment

Azure DevOps, via templates in the shared `Qwipo B2B/k8s` repo — same pattern
as `seller-platform`. Each deployable app carries five files: `Dockerfile`,
`nginx.conf` + `entrypoint.sh` (frontends only), `docker-build.yml`,
`azure-release.yaml`.

Things to get right if you touch them:

- **Build context is the workspace root**, never the app folder. Dockerfiles
  `COPY . .` and rely on the root `.dockerignore`. Paths inside are
  repo-relative (`apps/frontend/<app>/dist/`).
- **Service names are prefixed `mockups-`** so mockup images can't be confused
  with real services in the shared registry.
- **The release pipeline binds to its build by name**, via
  `resources.pipelines.source: 'docker-cd-<service>'`. Renaming one without the
  other silently breaks the release.
- **The release template exits 1** if the GitOps manifest
  `<TARGET_PATH_PREFIX>/<env>/<service>.yaml` doesn't exist. That's a DevOps
  prerequisite, not something you can fix from this repo — say so rather than
  editing pipelines to work around it.
- **Path filters are commented out on purpose** (`trigger: none`). Don't enable
  automatic builds without asking — these are demo environments, not services.

Full checklist for putting a new mockup on this path is in the README under
"Deploying a mockup".
