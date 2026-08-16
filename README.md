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
| `bun dev --filter=@mockups/qwipo-buyer-paytm-app` | Runs just one |
| `bun run new <name>` | Scaffolds a brand-new mockup, wired up and ready |
| `bun run check` | Lint + typecheck + build — run before you push |
| `bun run build` | Production build of every app |

Dev servers listen on your LAN, so Vite prints a **Network:** URL alongside the
local one. Open that on your phone — for a mobile mockup, that's the only
review that counts.

---

## Layout

```
apps/
  frontend/
    qwipo-buyer-paytm-app/         Buyer + salesperson app (Qwipo & Paytm shells)  →  localhost:5173
  backend/
    mock-api/             Fake API over the fixtures  →  localhost:8787
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
| Tokens | `@mockups/design-tokens` + the app's `@theme` block | `@mockups/web-tokens` (complete `theme.css`, no `@theme` needed) |
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

### Design tokens live in the app, not the package

`packages/ui` components use classes like `bg-primary` and `text-foreground`.
What those *mean* is the `@theme` block in each app's `src/index.css`. Same
components, different brand per mockup. Change colours there.

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

The wiring matches `seller-platform`: thin pipeline YAMLs in the app folder
that `extends:` shared templates in the **`Qwipo B2B/k8s`** repo. The pipelines
live in Azure DevOps under the **`Mockups Lab`** folder, named for humans rather
than following the `docker-cd-*` / `argocd-*` convention the service repos use.

| App | Service name | Build | Deploy |
| --- | --- | --- | --- |
| `qwipo-buyer-paytm-app` | `mockups-qwipo-buyer-paytm-app` | `Mockups Lab / App V2 - Build` | `Mockups Lab / App V2 - Deploy` |
| `mock-api` | `mockups-api` | `Mockups Lab / Mock API - Build` | `Mockups Lab / Mock API - Deploy` |

Service names are prefixed `mockups-` so these images and ArgoCD apps can't be
confused with real services in the shared registry. The **build pipeline's
display name is load-bearing** — each release YAML binds to it via
`resources.pipelines.source`. Rename one, change the other in the same commit.

Build → push to DOCR → deploy rewrites the image digest at
`bms-chart/<env>/<service>.yaml` in the k8s repo → ArgoCD syncs. Both are
`trigger: none`; you run them by hand and pick the environment.

### To put a new mockup on this path

1. Copy these five files from `apps/frontend/qwipo-buyer-paytm-app/` into your app:
   `Dockerfile`, `nginx.conf`, `entrypoint.sh`, `docker-build.yml`,
   `azure-release.yaml`.
2. In them, change `qwipo-buyer-paytm-app` → your app folder and
   `mockups-qwipo-buyer-paytm-app` → `mockups-<your-app>`. That's every occurrence;
   nothing else varies.
3. Copy `public/configs/config.*.json` too, and set `mockApiBaseUrl` per env.
4. Add a deployment manifest at `bms-chart/<env>/mockups-<your-app>.yaml` in the
   **k8s** repo. Copy `bms-chart/dev/seller-portal.yaml` — it's the closest
   reference (nginx SPA on port 80). The `dev` ApplicationSet is a git-file
   generator over `bms-chart/dev/*.yaml`, so the file's *existence* is what
   creates the ArgoCD app `dev-mockups-<your-app>-argo-app`. Nobody has to
   register it. Keep the `version: "..."` line — the release pipeline `sed`s it.
5. Register both YAMLs in Azure DevOps under the `Mockups Lab` folder:

   ```bash
   az pipelines create --org https://dev.azure.com/xavica --project "Qwipo B2B" \
     --name "<App> - Build" --folder-path "Mockups Lab" \
     --repository mockups-lab --repository-type tfsgit --branch main \
     --yml-path apps/frontend/<your-app>/docker-build.yml --skip-first-run true
   ```

   Then the same for `- Deploy` with `azure-release.yaml`, and make sure that
   YAML's `source:` matches the build pipeline's name exactly.

### Runtime config

Images are environment-agnostic — the same one promotes from dev to production.
`entrypoint.sh` copies `configs/config.<NODE_ENV>.json` over
`configs/config.json` at container start (`dev`/`prod`/`main` are normalised to
`development`/`production`), and nginx serves that file uncached. Read it at
runtime:

```ts
const cfg = await fetch('/configs/config.json').then((r) => r.json());
```

An unknown `NODE_ENV` makes the container exit rather than serve a stale
config — you'll see it immediately instead of debugging a mockup pointed at the
wrong API.

---

## Working with Claude here

Most code in this repo gets written by Claude. `CLAUDE.md` tells it the things
it can't infer — which shared package to reach for, where tokens live, what
"done" means for a mockup. **Keep it current.** When you find yourself
correcting Claude on the same thing twice, that correction belongs in
`CLAUDE.md`, and the next person gets it for free.
