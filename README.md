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
| `bun dev --filter=@mockups/qwipo-buyer-app` | Runs just one |
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
    qwipo-buyer-app/      Retailer ordering app  →  localhost:5173
  backend/
    mock-api/             Fake API over the fixtures  →  localhost:8787
packages/
  ui/                     Buttons, cards, tabs, cn(), theme provider
  i18n/                   useI18n() + en / hi / te / ta dictionaries
  types/                  Product, Order, Seller… the domain shapes
  mock-data/              The fake catalogue every mockup shares
  tsconfig/               TS presets — apps extend these
  eslint-config/          Lint presets — apps extend these
```

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

## Working with Claude here

Most code in this repo gets written by Claude. `CLAUDE.md` tells it the things
it can't infer — which shared package to reach for, where tokens live, what
"done" means for a mockup. **Keep it current.** When you find yourself
correcting Claude on the same thing twice, that correction belongs in
`CLAUDE.md`, and the next person gets it for free.
