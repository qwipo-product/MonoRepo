# CLAUDE.md

Guidance for Claude Code working in this repo.

## What this repo is

A lab for **frontend mockups** — mobile apps, web apps, websites — built to be
shown to people, not shipped. The product and design team drive it; they
direct you rather than write code. Two things follow:

1. **Bias to working pixels.** A screen that looks right and clicks through is
   the deliverable. Don't build abstractions for a second use case that may
   never exist.
2. **Explain in product terms.** Name screens and behaviour ("the cart now
   shows the MOV warning when the subtotal is under ₹5,000"), not modules and
   hooks. Assume the reader will not open the diff.

## Routing

Every request enters exactly one pathway. Classify it, invoke the skill,
follow the skill. When nothing fits, it is `build-screen` work on the app
being discussed.

Skills compose: a pathway invokes the scoped skills it needs by name —
`brief`, `verify`, `review`, `design-language`, `mock-data`, `theme`,
`add-dependency`, `share-component` — instead of restating them. An invoked skill is additive and never
contradicts its invoker; depth stays at two: router → pathway → scoped.

| Request looks like | Skill |
| --- | --- |
| "I have an idea", "I want to mock up X", anything vague or expensive | `brief` |
| "start a new mockup", "new app for X" | `new-mockup` |
| "bring in the app from <other repo>", "port X into here", "migrate" | `import-mockup` |
| add / change / fix a screen, flow, sheet, dialog or state in an existing mockup | `build-screen` |
| "I need more products / sellers / orders", "fake data for X" | `mock-data` |
| "change the colours", "make it look like Paytm", fonts, radii, dark mode | `theme` |
| "use this in the other app too", "make it shared", "add it to Storybook" | `share-component` |
| "I need library X", an import that won't resolve | `add-dependency` |
| "check my work", "does it build", "is it done" | `verify` |
| "review this", "tidy before merging", "is this branch clean" | `review` |
| "check the tokens", duplicated colours, hex in a screen, "why does this look different from that" | `design-language` |
| "I'm starting on X", "make me a branch", "save my work", "pull the latest" | `start-work` |
| "merge", "put it on dev", "promote to testing / staging / prod", conflicts | `land-work` |
| "git is broken", detached HEAD, "my changes vanished", "I committed on dev" | `git-doctor` |
| "show it to my boss", "open it on my phone", "send a link" | `share-mockup` |
| "deploy", "I need a URL that lasts", "set up CI/CD" | `deploy-mockup` |
| a demo URL 404s / is blank / didn't change, a pipeline fails | `deploy-doctor` |
| "delete this mockup", "we're done with X", stale folders | `retire-mockup` |
| "it's approved, hand it to engineering", "write the spec" | `handoff` |
| toolchain versions, `flake.nix`, `turbo.json`, `bunfig.toml`, catalog *upgrades*, `packages/tsconfig`, `packages/eslint-config`, `azure-cicd/templates/`, `scripts/`, `.dockerignore` | platform-only: say so, describe what you would change, and stop — the development team owns the foundation. (Turning off a lint rule that nags is not platform work; the README invites it.) |

## First response contract

- One sentence naming what you will do, then either the questions the
  pathway calls for — batched, one round — or the first concrete action.
  Never recite rules, never list the pathways, never summarise this file.
- Rules surface when a check fails, attached to the specific failure — not
  preemptively.
- Work happens on a branch. On `dev`, `testing`, `staging` or `main` and
  about to edit? Invoke `start-work` first.
- Nothing is done until `verify` has run. Say what was verified and what
  wasn't; a skipped check is reported as skipped, not passed.
- Nothing lands on `dev`, `testing`, `staging` or `main` without `review`
  — a shallow tidy, not a critique.
- Every app has a `README.md`; read it before touching the app.

## Facts every pathway leans on

### Toolchain

Bun + Turborepo + Vite + React 19 + Tailwind v4. Nix flake pins the toolchain;
direnv activates it. Never suggest `npm` or `yarn` — `bun` only.

```bash
bun run ls                        # every app, its port, what it is
bun dev --filter=@mockups/<app>   # run one app
bun run new <name> [--web]        # scaffold a mockup (new-mockup)
bun run deploy:add <app>          # generate the deploy fileset (deploy-mockup)
bunx turbo run lint typecheck build --filter=@mockups/<app>   # the gate (verify)
```

### Layout

```
apps/frontend/<mockup>/     one app per mockup
apps/backend/<service>/     Bun services (currently just mock-api; not deployed)
packages/<shared>/          shared code, raw TypeScript, no build step
native/qwipo-buyer-app/     React Native / Expo — NOT in the Bun workspace
docs/briefs/                one brief per new or imported mockup (brief)
docs/handoffs/              specs handed to engineering (handoff)
```

| App | Port | Kit | What it is |
| --- | --- | --- | --- |
| `qwipo-buyer-paytm-app` | 5175 | mobile | Buyer app in Qwipo and Paytm shells; being rebuilt screen by screen (`BUILD-NOTES.md`) |
| `seller-store` | 5174 | web | Distributor + super-admin console, 51 pages; five personas, OTP `1234` (its README) |
| `rirn` | 5173 | web | Retailer identity network — company discovery console |
| `rirn-retailer` | 5176 | **mobile** | Retailer-facing RIRN pages for a buyer-app WebView |
| `storybook` | 6006 | mobile | Catalog for `@mockups/ui` |
| `storybook-web` | 6007 | web | Catalog for `@mockups/web-ui` |

`apps/frontend/qwipo-app`, `qwipo-app-v2` and `qwipo-buyer-app` are stale
leftovers with no `package.json`. Turbo and Bun ignore them. Not apps;
`retire-mockup` once someone confirms nothing is being salvaged.

### Two design systems

Mobile and desktop-admin are different design languages, not two skins, so
they have separate kits. **Check which kit the app uses before importing
anything.** Never mix them in one app.

| | Mobile | Web / admin |
| --- | --- | --- |
| Primitives | `@mockups/ui` | `@mockups/web-ui` (shadcn + Radix) |
| Tokens | `@mockups/design-tokens` — `theme.css`, imported whole | `@mockups/web-tokens` — `theme.css`, imported whole |
| Controls / radii | 44px targets, 12px cards | 36px controls, 8px cards, 2px table pills |
| Scaffold | `bun run new <name>` | `bun run new <name> --web` |

Brand colour has one definition: `web-tokens` re-exports it from
`design-tokens`. Density values (radius, control height) differ on purpose.
`web-tokens/theme.css` also carries `tw-animate-css` (Radix overlays need
it) and a `.dark` rebinding layer for raw utilities like `bg-white`, which
is why seller-store's 40k ported lines go dark without a rewrite.

### Reach for these before writing your own

| Need | Import from |
| --- | --- |
| Button, Card, Badge, Chip, Sheet, Tabs, QtyStepper, EmptyState, `cn()`, `ThemeProvider` (mobile) | `@mockups/ui` |
| ProductCard, PriceLabel, StatusBadge (mobile, product-level) | `@mockups/components` |
| Tables, dialogs, sheets, combobox, charts, AppShell, StatusBadge, EmptyState, `cn()` (web) | `@mockups/web-ui` |
| Token values in TS | `@mockups/design-tokens` (mobile), `@mockups/web-tokens` (web) |
| Translated strings — `useI18n()` → `t('cart.title')`, en / hi / te / ta | `@mockups/i18n` |
| Product, Order, Seller, Cart types | `@mockups/types` |
| Products, sellers, orders, banners — extend, never invent | `@mockups/mock-data` |
| Deployed-version pill — mounted once in `main.tsx` | `@mockups/version-badge` |
| TS / ESLint presets — apps just `extends` | `@mockups/tsconfig`, `@mockups/eslint-config` |

Deep imports work where declared: `import { IMG } from '@mockups/mock-data/imageBank'`.

### Rules that bite if skipped

- **Tailwind never scans `node_modules`.** An app using classes from a
  shared package needs an `@source` line in `src/index.css` pointing at that
  package's `src`. Without it the component renders unstyled and nothing
  errors. Same for interpolated class names — write full strings.
- **Tokens live in the token packages, never in an app or a `ui` package.**
  One design language, shared like the fixtures and the primitives. No
  per-app `@theme` block; chart and map colours in JS come from the
  package's TS export (`colorLight.brand.primary`), not a hex; a
  brand-external colour (the Paytm shell) is named once in the app and used
  by name. `design-language` audits this.
- **One token layer per app.** Import both and the later import silently
  wins every shared custom property.
- **Versions go in the root `catalog`.** Packages write `"react": "catalog:"`.
- **Dev ports must be unique.** `bun run new` handles it.
- **`verbatimModuleSyntax` is on.** `import type { Foo }`, or `TS1484`.
- **Don't copy a component into an app when the package has it.**
- **Both lockfiles are committed.** Never delete or regenerate `bun.lock` or
  `flake.lock` to get past an install problem — fix the cause.
- **Shared packages have no build step.** Adding one breaks hot reload for
  everyone. Promote code only when a second app needs it (`share-component`).
- **Known pre-existing failure:** `@mockups/qwipo-buyer-paytm-app#lint`
  fails on a stale `eslint-disable` for `jsx-a11y/no-autofocus`. Not yours;
  don't chase it; verify with `--filter` or `--continue`.

### Deliberately loose

`strict` is off and the lint rules are minimal. This is a decision. Don't
tighten `tsconfig` or add rules. A blocking type error usually means the mock
data is wrong, not the config. `any` and `console.log` are fine.

### Deployment, in one paragraph

Azure DevOps, auto-triggered: a push to `dev` / `testing` / `staging` /
`main` rebuilds every touched mockup and deploys it to that environment
(`main` cuts a semver tag and waits for an approval). The fileset is
generated by `bun run deploy:add`, never hand-written; two prerequisites
live in the `Qwipo B2B/k8s` repo and Azure and are handed off, not worked
around. Everything else — naming, verification, silent-failure traps,
rollback — is in `deploy-mockup` and `deploy-doctor`.
