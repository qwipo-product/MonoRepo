---
name: deploy-mockup
description: Put a mockup in this repo onto a real demo URL — generate its Dockerfile/nginx/Azure pipeline set, name the service correctly, verify the image will actually serve, and hand off the two out-of-repo prerequisites. Use when asked to deploy, ship, host, "put it on a URL", set up CI/CD, or add pipelines for an app in apps/frontend.
---

# Deploying a mockup

Getting a mockup onto `https://mockups-<what-it-is>.dev.bms.qwipo.com`.

The whole fileset is **generated, not hand-written**. Every time someone has
copied these files by hand they have shipped at least one of the silent
failures listed at the bottom — the kind that pass every check and produce a
404 page in front of a client.

Preconditions: the app builds (invoke `verify` first), and the generated
files land like any other change — `start-work` for the branch, `land-work`
to reach `dev`, which is the first branch a build fires from.

## Step 0 — is it actually deployable?

An app qualifies if `apps/frontend/<app>/package.json` exists and `build`
works. Folders without a `package.json` (`qwipo-app`, `qwipo-app-v2`,
`qwipo-buyer-app`) are stale leftovers — Turbo and Bun ignore them and so
should you. Say so rather than scaffolding them a pipeline.

## Step 1 — name the service

The convention is **`mockups-<what-it-is>`**.

- `mockups-` prefix always, so a mockup image can never be mistaken for a real
  service in the shared registry.
- **No `qwipo-` prefix.** The registry is already the Qwipo registry and the
  domain already says it.
- **No `-app` suffix.** It says nothing.
- The host is always `https://<service>.dev.bms.qwipo.com`. The service name
  *is* the subdomain — pick it as the URL you want to send someone.

Current allocations, and two hostnames reserved for apps that don't exist yet:

| App folder | Service | Reserved? |
| --- | --- | --- |
| `seller-store` | `mockups-seller-store` | live |
| `rirn` | `mockups-rirn-company` | live |
| `rirn-retailer` | `mockups-rirn-retailer` | live |
| `storybook-web` | `mockups-storybook-web` | live |
| `storybook` | `mockups-storybook` | live |
| `qwipo-buyer-paytm-app` | `mockups-buyer-app` | live |
| `qwipo-analytics` | `mockups-analytics` | live |
| — | `mockups-rirn-distributor` | **reserved, no app yet** |
| — | `mockups-rirn-admin` | **reserved, no app yet** |

The generator derives the service from the folder name, which is right most of
the time and wrong when the folder is vaguer than the product. `rirn` is the
company console but `rirn-distributor` and `rirn-admin` are coming, so it is
`mockups-rirn-company`, passed explicitly. **If the folder name doesn't say
what the thing is, pass `--service` and `--label` rather than accepting the
derived name.**

## Step 2 — generate

```bash
bun run deploy:add <app>
bun run deploy:add rirn --service mockups-rirn-company --label "RIRN Company"
bun run deploy:add <app> --force        # overwrite an existing fileset
```

That writes exactly four files into the app folder:

| File | What it is |
| --- | --- |
| `Dockerfile` | two-stage: bun-alpine builds, nginx-alpine serves |
| `nginx.conf` | port 80, SPA fallback, cache headers |
| `docker-build.yml` | thin: `extends:` `/azure-cicd/templates/mockup-docker-template.yaml` — version, build, tag, push |
| `azure-release.yaml` | thin: `extends:` `/azure-cicd/templates/mockup-release-template.yaml` — rewrite the GitOps digest, sync |

The two YAMLs carry only what differs per app — service name, tag prefix,
Dockerfile path, the branch → environment mapping. Everything else, including
the semver-tag versioning model, lives in the two repo-local templates. Change
behaviour there, not in six copies.

**Four files, not five.** There is no `entrypoint.sh` and no
`public/configs/config.*.json`. These are mockups: every one bundles
`@mockups/mock-data` at build time and talks to no backend, so nothing differs
between dev and production and one image is correct everywhere. A
config-swapping entrypoint with nothing to swap is not neutral — it `exit 1`s
the container on an NODE_ENV it doesn't recognise, a live failure mode bought
for zero benefit.

If a mockup genuinely grows a backend, add the entrypoint back **to that one
app** and write in its Dockerfile why it has one. Don't reintroduce it as the
default.

**Don't hand-edit the generated files.** Change `scripts/add-deploy.ts` and
regenerate with `--force`, so app number seven gets the fix too.

## Step 3 — verify before you claim it works

`bun run check` does not catch a broken image. Run these:

```bash
# 1. the app builds
bunx turbo run build --filter=@mockups/<app>

# 2. the Dockerfile COPYs the directory the build actually produced
grep 'COPY --from=builder' apps/frontend/<app>/Dockerfile
ls apps/frontend/<app>/dist/index.html            # …or storybook-static/

# 3. the two YAMLs agree with each other
grep -E 'service_name|tag_prefix' apps/frontend/<app>/docker-build.yml apps/frontend/<app>/azure-release.yaml
grep -A1 'pipeline: buildPipeline' apps/frontend/<app>/azure-release.yaml

# 4. the version badge is mounted, and the stamp reaches the bundle
grep VersionBadge apps/frontend/<app>/src/main.tsx      # or managerHead in .storybook/main.ts
VITE_APP_VERSION=9.9.9 VITE_APP_COMMIT=abc1234 bunx turbo run build --filter=@mockups/<app> --force
grep -l '9.9.9' apps/frontend/<app>/dist/assets/*.js    # or storybook-static/index.html
```

Check 4 is what the Docker build does with real values (`--build-arg
APP_VERSION`). If the string is missing, `turbo.json` has lost the
`build.env` declaration or the app skipped the badge — either way the deployed
page would say `local` with nothing failing.

Check 2 is the one that matters. **The Vite apps build to `dist/`; the two
Storybook catalogs build to `storybook-static/`.** The generator reads this out
of the app's own `build` script rather than assuming — but if you ever write a
Dockerfile by hand and point it at the wrong directory, the image builds
cleanly, nginx starts happily, and every request 404s.

If Docker is available, the real check is:

```bash
docker build -f apps/frontend/<app>/Dockerfile -t <service>:local .
docker run --rm -p 8080:80 <service>:local
```

Build context is the **workspace root**, never the app folder — the Dockerfile
`COPY . .`s and needs `bun.lock` plus the `packages/*` sources the app links
via `workspace:*`.

## Step 4 — hand off what this repo can't do

Two prerequisites live outside this repo. **Say so plainly instead of editing
pipelines to work around them.**

**1. The GitOps manifest**, in the `Qwipo B2B/k8s` repo:
`bms-chart/dev/<service>.yaml`. **`bun run deploy:add` prints this file ready
to paste** — don't reverse-engineer the chart's value schema from a
neighbouring service.

Three things about it are worth knowing rather than copying blindly:

- **The ingress rule key is the demo URL.** `templates/ingress.yaml` renders
  `<key>.<baseDomain>`, and `dev/common.yaml` sets `baseDomain` to
  `dev.bms.qwipo.com`. TLS is a wildcard (`*.dev.bms.qwipo.com`,
  `wildcard-cert`), so a new subdomain needs no certificate work.
- **Keep the `version: "..."` line, quoted.** The release template `sed`s that
  exact line to stamp the image tag.
- **The deployment short name must be unique in `bms-resources`** — every dev
  manifest shares that namespace. The chart appends `-svc` and `-port`, and
  Kubernetes rejects a port name over 15 characters, which is why these stay
  short. Two manifests declaring the same name gives you two ArgoCD apps
  fighting over one set of objects.

The `dev` ApplicationSet is a git-file generator over `bms-chart/dev/*.yaml`,
so the file's *existence* creates the ArgoCD app `dev-<service>-argo-app`.
Nobody registers it, and there's no DevOps ticket — one commit to the k8s repo.
**The release template exits 1 if this file is missing.**

Check it renders the way ArgoCD will render it before handing it over:

```bash
helm template bms-chart -f bms-chart/dev/common.yaml \
  -f bms-chart/dev/<service>.yaml
```

Expect the pods to `ImagePullBackOff` until the first build+release runs — the
placeholder tag doesn't exist in the registry yet. That's normal, not a fault.

**2. Azure pipeline registration** — `bun run deploy:add` prints both
`az pipelines create` commands with the right flags. They go in the
`Mockups Lab` folder.

**3. The tag-push permission** — once per repo, not per app. `main` builds
push a `<prefix>-v<semver>` git tag as the project Build Service identity,
which needs *Contribute* and *Create tag* on `mockups-lab` (Project settings →
Repositories → Security). Already done if any mockup has cut a release. Until
then the first `main` build fails at "push semver git tag" with a 403, before
anything touches the registry; `dev`/`testing`/`staging` builds don't care.

## Rules that cause silent failures

- **The build pipeline's display name is load-bearing.** The release YAML binds
  to it by name via `resources.pipelines.source`, and nothing validates the
  string. Rename one, change the other in the same commit. The generator
  derives both from the service name so they can't drift.
- **Renaming a service needs a fresh build run.** SERVICE_NAME reaches the
  deploy through the build's artefact, so a deploy run after a rename binds to
  nothing until the build has run again under the new name. It also needs a new
  `bms-chart/<env>/<new-service>.yaml`, and the old manifest and ArgoCD app
  should be retired.
- **`turbo.json` `build.outputs` must list both `dist/**` and
  `storybook-static/**`.** Miss the second and a Turbo cache hit restores
  nothing for the catalogs.
- **`.dockerignore` strips `**/*.md`** (except the root README). Fine today —
  nothing imports a `.md` into a story — but if someone adds Markdown docs to a
  Storybook catalog, the in-Docker build breaks while the local one passes.
- **Builds are auto-triggered, and the branch decides the environment.** Push
  to `dev`, `testing`, `staging` or `main` and that mockup rebuilds and
  redeploys to dev / testing / staging / production respectively. The product
  team drives this repo and should never have to open a pipeline to ship a
  mockup, so don't reintroduce `trigger: none`.
- **A manifest must exist in every env a branch can reach.** The release
  template exits 1 on a missing `bms-chart/<env>/<service>.yaml`. Since `main`
  now deploys to production, a new mockup needs its manifest in all four env
  folders, not just `dev`, before anyone merges.
- **`packages/**` is in every path filter**, so one commit to a shared package
  rebuilds every mockup. That's correct — a token change does change all of
  them — and it's part of why these builds are kept cheap.
- **Versions are cut on `main` only.** `main` → next semver from the
  `<prefix>-v*` tags, tag pushed before the image is built, image tagged
  `<semver>`; other branches → `<branch>-<sha>`, no tag. The badge in the
  page shows whichever it was, because the value is baked in at build time —
  never injected at start. To deploy or roll back a release, run the Deploy
  pipeline on the tag; it checks the image exists and deploys without
  rebuilding.
- **The tag prefix is a literal, derived once from the service name.** A
  rename with a bare regenerate forks the lineage; pass `--tag-prefix <old>`.

## Reporting back

Product people read these summaries, not the diff. Say which mockup is going
where — "the seller store will be at mockups-seller-store.dev.bms.qwipo.com" —
and state clearly that it isn't live until someone adds the k8s manifest and
runs the build. Don't imply a URL works when only the files exist.
