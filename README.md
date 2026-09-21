# mockups-lab

Where we build and keep **frontend mockups** — mobile apps, web apps, websites.
Clickable, real-looking prototypes we can put in front of people before anyone
commits engineering time.

Nothing here ships to customers. Optimise for speed of iteration, not for
correctness.

---

## Start here (5 minutes, once)

You need [Nix](https://nixos.org/download) and [direnv](https://direnv.net).
If you have them already, skip to step 2.

```bash
# 1. one-time, per machine
curl --proto '=https' --tlsv1.2 -sSf -L https://install.determinate.systems/nix | sh -s -- install
brew install direnv && echo 'eval "$(direnv hook zsh)"' >> ~/.zshrc && exec zsh

# 2. one-time, per clone
cd mockups-lab
direnv allow        # pulls the exact Bun version this repo expects
bun install         # ~15s

# 3. every day
bun dev             # everything comes up
```

You never install Node, Bun or anything else by hand. `direnv allow` puts the
right toolchain on your `PATH` when you `cd` in and takes it away when you
leave — so this repo can't break your other repos, and they can't break this
one.

> No Nix? `bun install && bun dev` works too, as long as your Bun is ≥ 1.3.
> You just lose the guarantee that your version matches everyone else's.

---

## The commands you'll actually use

| Command | What it does |
| --- | --- |
| `bun run ls` | Lists every mockup, its URL, and what it is |
| `bun dev` | Runs everything at once |
| `bun dev --filter=@mockups/seller-store` | Runs just one |
| `bun run new <name>` | Scaffolds a brand-new mockup, wired up and ready |
| `bun run check` | Lint + typecheck + build — run before you push |
| `bun run deploy:add <app>` | Generates a mockup's Dockerfile + Azure pipelines |
| `bun run build` | Production build of every app |

> **Heads up:** `bun run check` currently fails on one pre-existing issue in
> `qwipo-buyer-paytm-app` — a stale `eslint-disable` for `jsx-a11y/no-autofocus`,
> a plugin this repo doesn't install. Unrelated to anything else; scope your run
> with `bunx turbo run lint typecheck build --filter=@mockups/<app>` until it's
> resolved.

Dev servers listen on your LAN, so Vite prints a **Network:** URL alongside the
local one. Open that on your phone — for a mobile mockup, that's the only
review that counts.

---

## Layout

```
apps/
  frontend/
    qwipo-buyer-paytm-app/  Buyer + salesperson app (Qwipo & Paytm shells)  →  :5175
    seller-store/           Distributor + super-admin console               →  :5174
    rirn/                   Retailer identity network — company console     →  :5173
    rirn-retailer/          Retailer-facing RIRN pages (phone/WebView)      →  :5176
    qwipo-analytics/        DigiDukaan analytics console + Reports (desktop) →  :5177
    storybook/              Catalog for the mobile kit                      →  :6006
    storybook-web/          Catalog for the web kit                         →  :6007
  backend/
    mock-api/               Fake API over the fixtures                      →  :8787
native/
  qwipo-buyer-app/          React Native / Expo — outside the Bun workspace,
                            has its own bun.lock and toolchain
packages/
  ui/                     Mobile-first primitives: buttons, cards, tabs, cn(), theme provider
  design-tokens/          Mobile token layer — platform-neutral + theme.css + React Native theme.ts
  web-ui/                 Desktop/admin primitives: shadcn + Radix, data tables, dialogs, AppShell
  web-tokens/             Desktop token layer — theme.css for dense admin surfaces
  components/             Cross-platform product components (ProductCard, StatusBadge…)
  i18n/                   useI18n() + en / hi / te / ta dictionaries
  types/                  Product, Order, Seller… the domain shapes
  mock-data/              The fake catalogue every mockup shares
  tsconfig/               TS presets — apps extend these
  eslint-config/          Lint presets — apps extend these
```

### Two design systems, on purpose

A phone mockup and a desktop admin console are not the same product wearing
different colours, so they don't share one kit:

| | Mobile | Web / admin |
| --- | --- | --- |
| Primitives | `@mockups/ui` | `@mockups/web-ui` |
| Tokens | `@mockups/design-tokens` (`theme.css`, imported whole) | `@mockups/web-tokens` (`theme.css`, imported whole) |
| Controls | 44px tap targets | 36px |
| Radii | 12px cards | 8px cards, 2px table pills |
| Catalog | `bun dev --filter=@mockups/storybook` → :6006 | `bun dev --filter=@mockups/storybook-web` → :6007 |

`bun run new <name> --web` wires the web set; without `--web` you get the
mobile set. **Never import both token layers into one app** — whichever CSS
import comes last wins every shared custom property.

Brand colour is not duplicated between them: `web-tokens` re-exports
`colorLight` / `colorDark` from `design-tokens`, so the blue and the status
quads have one definition, not two that happen to agree today.

Two levels under `apps/` (`frontend/`, `backend/`) is deliberate — it matches
`seller-platform`, so the CI pipelines and Dockerfiles translate across repos
without anyone re-learning the layout.

### The Seller Store

The biggest app here — 51 pages across 59 routes, ported in from the
standalone Seller Store repo and rebuilt on `@mockups/web-ui` +
`@mockups/web-tokens`.

```bash
bun dev --filter=@mockups/seller-store
```

It opens on a login with five demo personas. **OTP is `1234` for all of them.**

| Persona | Mobile | Lands on |
| --- | --- | --- |
| Seller | `9900000002` | Seller dashboard |
| Seller (Empty) | `8888888888` | Inception-day empty states |
| Super Admin | `9900000001` | `/admin` |
| Super Admin (Empty) | `9999999999` | Admin empty states |
| Design System | `7777777777` | `/design` |

The "Empty" personas wipe the mock master data on login so every screen shows
its empty state — that's how you demo day-one onboarding without deleting
anything.

Two things about its shape that look wrong until you know why: source sits
under `src/app/` with assets under `src/imports/`, mirroring the original
repo's depth so ~40 relative asset paths survived the port untouched; and it
keeps its own persona-driven `root-layout.tsx` rather than using `AppShell`,
which doesn't model admin/seller/empty-mode sidebars. New web mockups should
use `AppShell`.

Its pages use raw Tailwind utilities (`bg-white`, `text-gray-900`) rather than
semantic tokens, and go dark-aware anyway because `web-tokens/theme.css`
carries a `.dark` rebinding layer for exactly those classes. That layer is why
40k lines didn't need rewriting.

`/design` is a 4,600-line in-app handbook inherited from the original repo. It
duplicates `storybook-web` and will drift — prefer Storybook, and expect the
page to be retired.

### Adding a mockup

```bash
bun run new distributor-portal        # phone frame
bun run new ops-console --web         # full-width web frame
```

It picks a free port, links the shared packages, and prints the URL. There is
no central registry to update.

### Shared packages have no build step

They export raw TypeScript. Edit `packages/ui/src/button.tsx` and every running
app hot-reloads immediately — no rebuild, no watch process, no stale `dist/`.

One consequence worth knowing: **Tailwind doesn't scan `node_modules`**, so an
app that uses `@mockups/ui` needs this line in its `src/index.css` (the
generator adds it for you):

```css
@source "../../../../packages/ui/src";
```

Miss it and the shared components render unstyled.

### Design tokens never live in a `ui` package

Components in `packages/ui` and `packages/web-ui` use classes like
`bg-primary` and `text-foreground`. What those *mean* is decided in the token
package, not the component. Which package depends on the kit:

- **Mobile** — `@mockups/design-tokens/theme.css`, imported whole.
- **Web** — `@mockups/web-tokens/theme.css`, imported whole.

Either way the app has no `@theme` block of its own. One design language,
shared the way the fixtures and the primitives are: change a token in the
package and every mockup moves. Chart and map colours in JS read the same
values from the package's TS export (`colorLight.brand.primary`), not a hex.
A mockup imitating another brand's shell (the Paytm frame) names those
colours once in its own CSS and uses the name.

Never hard-code a hex in a component, and never move tokens into a `ui`
package. `/design-language` audits all of this.

---

## The mock backend

`apps/backend/mock-api` serves `@mockups/mock-data` over HTTP, so a screen can
`fetch()` instead of importing a fixture. Worth it as soon as you want to demo
a loading spinner, an empty state, or an error path.

```bash
bun dev --filter=@mockups/mock-api

curl localhost:8787                              # what's available
curl 'localhost:8787/api/products?q=maggi&limit=5'
curl 'localhost:8787/api/products?delay=1500'    # see your loading state
curl 'localhost:8787/api/products?fail=500'      # see your error state
```

Writes are accepted and echoed back — enough for optimistic UI — but nothing
persists. Every restart is the same known state, which is what you want for a
demo you're about to give twice.

---

## Conventions

- **Versions live in one place.** The `catalog` in the root `package.json`
  pins every dependency exactly. Packages say `"react": "catalog:"`. Upgrading
  React is a one-line diff, not fifteen.
- **Lockfiles are committed** — `bun.lock` and `flake.lock`. CI runs
  `bun install --frozen-lockfile`, which fails on drift rather than silently
  resolving something new.
- **Types are loose on purpose.** `strict` is off. A mockup shouldn't stall
  because a fixture is missing an optional field.
- **Lint is quiet on purpose.** It catches genuine breakage, not style. If it
  ever nags you about something that doesn't matter, turn the rule off in
  `packages/eslint-config` — that's the intended response.

---

## Deploying a mockup

Most mockups never need this — `bun dev` and the Network URL cover the usual
"show it to someone" case. Deploy when a mockup needs to live somewhere for a
while (a client demo, a round of user testing, a link in a doc).

The wiring follows `seller-platform`'s shape: thin pipeline YAMLs in the app
folder that `extends:` a template. The templates are this repo's own, in
`azure-cicd/templates/`, rather than the shared ones in the **`Qwipo B2B/k8s`**
repo — they are those plus the semver-tag versioning model `buyer-web-mini`
uses (see "Versions, tags and the badge" below). The pipelines live in Azure
DevOps under the **`Mockups Lab`** folder, named for humans rather than
following the `docker-cd-*` / `argocd-*` convention the service repos use.

| App folder | Service name | Demo host | Build pipeline | Deploy pipeline |
| --- | --- | --- | --- | --- |
| `seller-store` | `mockups-seller-store` | mockups-seller-store.dev.bms.qwipo.com | Seller Store - Build | Seller Store - Deploy |
| `rirn` | `mockups-rirn-company` | mockups-rirn-company.dev.bms.qwipo.com | RIRN Company - Build | RIRN Company - Deploy |
| `rirn-retailer` | `mockups-rirn-retailer` | mockups-rirn-retailer.dev.bms.qwipo.com | RIRN Retailer - Build | RIRN Retailer - Deploy |
| `storybook-web` | `mockups-storybook-web` | mockups-storybook-web.dev.bms.qwipo.com | Storybook Web - Build | Storybook Web - Deploy |
| `storybook` | `mockups-storybook` | mockups-storybook.dev.bms.qwipo.com | Storybook - Build | Storybook - Deploy |
| `qwipo-buyer-paytm-app` | `mockups-buyer-app` | mockups-buyer-app.dev.bms.qwipo.com | Buyer App - Build | Buyer App - Deploy |
| `qwipo-analytics` | `mockups-analytics` | mockups-analytics.dev.bms.qwipo.com | Analytics - Build | Analytics - Deploy |

`mock-api` is **not** on this path, deliberately. Nothing calls it — every
mockup bundles `@mockups/mock-data` at build time — so it was never built and
never deployed, and its pipelines and manifest have been removed. It still runs
locally with `bun dev --filter=@mockups/mock-api`. If a mockup ever genuinely
needs it, `bun run deploy:add` doesn't cover backends; copy the pattern by hand
and give it a real reason.

Service names are `mockups-<what-it-is>`. The prefix is there so these images
and ArgoCD apps can't be confused with real services in the shared registry, and
that is all it's for — no `qwipo-` on top of it (the registry is already the
Qwipo registry and the domain already says it) and no `-app` suffix, which
distinguishes nothing. The demo URL falls straight out of the name:
`https://<service>.dev.bms.qwipo.com`.

Two hosts are reserved for mockups that don't exist yet —
`mockups-rirn-distributor.dev.bms.qwipo.com` and
`mockups-rirn-admin.dev.bms.qwipo.com`. There is nothing to build for either;
they're DNS and manifest reservations in the k8s repo, held so the URL is ready
when someone starts the app.

The **build pipeline's display name is load-bearing** — each release YAML binds
to it via `resources.pipelines.source`. Rename one, change the other in the same
commit.

Build → push to DOCR → deploy rewrites the image digest at
`bms-chart/<env>/<service>.yaml` in the k8s repo → ArgoCD syncs.

### Push a branch, get a deploy

You should never have to open a pipeline to ship a mockup. Builds auto-trigger
on four branches, and the branch you pushed decides where it lands:

| Branch | Environment | URL |
| --- | --- | --- |
| `dev` | dev | `mockups-<app>.dev.bms.qwipo.com` |
| `testing` | testing | `mockups-<app>.test.bms.qwipo.com` |
| `staging` | staging | `mockups-<app>.staging.bms.qwipo.com` |
| `main` | production | `mockups-<app>.bms.qwipo.com` |

Anything else — a feature branch — doesn't trigger at all.

**Production waits for a human.** It carries an Azure DevOps approval check, so
a merge to `main` queues the deploy and holds until one of the approvers okays
it. dev, testing and staging go straight through.

The `environment` parameter on a manual run overrides the mapping; leaving it
on `auto` is what applies the branch rule. Use that to push a `dev` branch to
staging for a demo without merging anything.

Two consequences worth knowing. `packages/**` is in every path filter, so one
commit to a shared package rebuilds **every** mockup — correct, since a token
change really does change all of them. And because `main` now reaches
production, a new mockup needs its manifest in all four `bms-chart/<env>/`
folders before anyone merges; the release exits 1 on a missing one.

> **The buyer app was renamed** — `mockups-qwipo-buyer-paytm-app` is now
> `mockups-buyer-app`, which moves the image and the ArgoCD app and nothing
> else: the demo URL was already `mockups-buyer-app.dev.bms.qwipo.com` and the
> pipelines were already **Buyer App - Build** / **Buyer App - Deploy**, so the
> live link keeps working and neither pipeline is renamed. `SERVICE_NAME` still
> reaches the deploy through the build's artefact, not through the release
> YAML, so it needs a fresh **Buyer App - Build** run before any deploy can
> bind; deploying against the old artefact still carries the old name. The k8s
> manifest also has to be renamed to `bms-chart/<env>/mockups-buyer-app.yaml`
> and the old `mockups-qwipo-buyer-paytm-app.yaml` removed — leave both and
> ArgoCD keeps both apps alive.

### Versions, tags and the badge

Every mockup shows the build it is running as a small pill in the bottom-right
corner (bottom-left on the two Storybooks, where the addons toggle lives).
Hover it for the commit. What it says depends on where the build came from:

| Built from | Badge | Image tags | Git tag |
| --- | --- | --- | --- |
| `main` | `v1.2.3` | `1.2.3`, `<sha>` | `<app>-v1.2.3` |
| `dev` / `testing` / `staging` | `dev-8abf53d` | `<sha>`, `dev`, `dev-<sha>` | none |
| `bun dev`, a plain local build | `local` | — | — |

**`main` builds are releases.** The build pipeline reads the latest
`<app>-v*` tag (`seller-store-v*`, `rirn-company-v*`, …), bumps it — patch
by default; run the build by hand and pick `bump: minor` or `major` for a
bigger step — and pushes the new annotated tag *before* building the image, so
a version number is reserved atomically even when two main builds race. The
first release of an app is `1.0.0`. Branch builds push no tag.

**The version is baked into the bundle.** The pipeline passes the image's own
tag to `docker build` as `APP_VERSION`, the Dockerfile exports it as
`VITE_APP_VERSION`, Vite inlines it, and `@mockups/version-badge` renders it.
Nothing is injected at container start, so the badge can only ever name the
image serving the page. `docker inspect` shows the same value as an OCI label.

**To deploy or roll back a release**, run the app's Deploy pipeline by hand and
pick an `<app>-v*` tag in the run dialog's branch/tag selector. Nothing is
rebuilt — the pipeline checks the image exists in the registry and deploys it
as-is. A tag defaults to production; pick another `environment` to put a
release on staging.

Tag prefixes are literals in the generated YAMLs, derived once from the service
name. If a service is ever renamed, pass `--tag-prefix <old>` to
`bun run deploy:add` so the lineage doesn't fork.

**One-time permission.** Pushing the tag runs as the project Build Service
identity, which needs *Contribute* and *Create tag* on this repo (Project
settings → Repositories → mockups-lab → Security → "Qwipo B2B Build Service").
Until that is granted, every `main` build fails at "push semver git tag" with
a 403 — before anything reaches the registry. Branch builds are unaffected.

Most mockups aren't on `main` yet, so they get their first semver the day they
are merged there. Until then their demo URLs show `dev-<sha>`, which is the
honest answer.

### To put a new mockup on this path

```bash
bun run deploy:add seller-store
```

That writes all four files into `apps/frontend/<app>/` — `Dockerfile`,
`nginx.conf`, `docker-build.yml`, `azure-release.yaml` — and derives the two
things people kept getting wrong when they hand-copied them. The build output
directory comes from the app's own `build` script, and the Azure pipeline
display name comes from the service name, so the release YAML's `source:` can't
drift from the build pipeline it binds to.

Override either when the derived value isn't the one you want, and pass
`--force` to overwrite a fileset that already exists:

```bash
bun run deploy:add rirn --service mockups-rirn-company --label "RIRN Company"
bun run deploy:add storybook --force
```

Deriving the output directory matters because the two Storybook catalogs build
to `storybook-static/`, not `dist/`. `turbo.json`'s `build.outputs` lists both,
so a cache hit restores the right one, and the root `.dockerignore` strips both,
so a stale local build can't be copied into an image. Point a Dockerfile at the
wrong directory and nginx serves an empty root — a 404 page, with nothing
failing at build time to tell you why.

Three prerequisites it can't satisfy from inside this repo. It prints all three
when it finishes:

1. **The GitOps manifest**, at `bms-chart/<env>/<service>.yaml` in the **k8s**
   repo. Copy `bms-chart/dev/seller-portal.yaml` — it's the closest reference
   (nginx SPA on port 80) — and set the ingress host to
   `<service>.dev.bms.qwipo.com`, which is the rule that owns the demo URL. The
   `dev` ApplicationSet is a git-file generator over `bms-chart/dev/*.yaml`, so
   the file's *existence* is what creates the ArgoCD app
   `dev-<service>-argo-app`. Nobody has to register it. Keep the
   `version: "..."` line — the release pipeline `sed`s it.
2. **Registering both YAMLs** in Azure DevOps under the `Mockups Lab` folder:

   ```bash
   az pipelines create --org https://dev.azure.com/xavica --project "Qwipo B2B" \
     --name "<Label> - Build" --folder-path "Mockups Lab" \
     --repository mockups-lab --repository-type tfsgit --branch dev \
     --yml-path apps/frontend/<app>/docker-build.yml --skip-first-run true
   ```

   Then the same for `- Deploy` with `azure-release.yaml`. Use the `<Label>` the
   generator printed — that exact string is already sitting in the release
   YAML's `source:`.

   **The branch matters.** `az` resolves `--yml-path` against that branch in the
   remote, so pointing at one where the file doesn't exist registers a pipeline
   that looks fine and fails the first time anyone runs it. All fourteen mockup
   pipelines build from `dev`; `main` doesn't contain these apps at all. The
   generator prints whichever branch you're on, and `--branch` overrides it.

   This has already bitten once: the first two pipelines stayed bound to
   `feature/mobile-prototype` long after that branch was deleted, so both were
   silently broken — a pipeline pointed at a dead branch looks perfectly healthy
   in the UI until someone runs it.
3. **The tag-push permission**, once per repo rather than per app — see
   "Versions, tags and the badge" above. Already done if any mockup has cut a
   release.

### No runtime config

There is no `entrypoint.sh` and no `public/configs/config.*.json`, on purpose.
These are mockups: every one bundles `@mockups/mock-data` at build time and
talks to no backend, so there is no API base URL, no feature flag, nothing that
differs between dev and production. The image is a pure static artefact — nginx
plus a directory of files, correct in every environment. The deployed version
is no exception: it is inlined at build time, not injected at start.

That's a deliberate simplification of the pattern `seller-platform` uses. A
config-swapping entrypoint with nothing to swap isn't neutral: it `exit 1`s the
container on a `NODE_ENV` it doesn't recognise, a live failure mode bought for
zero benefit. If a mockup ever genuinely does need a backend, add the entrypoint
back to that one app and say why in its Dockerfile.

---

## Working with Claude here

Most code in this repo gets written by Claude. `CLAUDE.md` tells it the things
it can't infer — which shared package to reach for, where tokens live, what
"done" means for a mockup. **Keep it current.** When you find yourself
correcting Claude on the same thing twice, that correction belongs in
`CLAUDE.md`, and the next person gets it for free.

Every request goes through one of the skills in `.claude/skills/` — `CLAUDE.md`
routes it, and each skill says what it needs from you and what it hands back.
You can also call one directly: `/brief` before a new idea, `/new-mockup`,
`/import-mockup` for code from another repo, `/build-screen`, `/start-work` and
`/land-work` for branches and merges (`/review` tidies a branch before it
lands), `/git-doctor` when git surprises you,
`/share-mockup`, `/deploy-mockup`, `/verify`, `/handoff` when engineering takes
over. Nothing is done until `verify` has run.
