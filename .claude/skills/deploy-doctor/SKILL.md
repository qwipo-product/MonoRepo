---
name: deploy-doctor
description: Diagnose a mockup deploy that isn't working — demo URL 404s or shows a blank/unstyled page, deep links break, the Azure release pipeline exits 1, a deploy runs but nothing changes, or the container crash-loops. Use when a mockups-*.dev.bms.qwipo.com URL misbehaves or an Azure build/release pipeline for this repo fails.
---

# Diagnosing a mockup deploy

Almost every failure here is silent — the build goes green and the breakage
only shows up as a 404 in front of whoever the demo was for. Work the symptom
down this list rather than guessing.

**First, know which layer you're in.** There are four, and they fail
differently:

```
app build (bun/turbo)  →  image (Docker)  →  GitOps manifest (k8s repo)  →  ArgoCD → ingress
```

A green Azure build only proves the first two.

---

## "The URL 404s / shows a blank page"

**Most likely: the Dockerfile COPYs a directory that doesn't exist.** nginx
starts fine on an empty root, so nothing errors — you just get 404 on
everything.

```bash
grep 'COPY --from=builder' apps/frontend/<app>/Dockerfile
grep '"build"' apps/frontend/<app>/package.json
```

The Vite apps build to `dist/`. Both the Dockerfile copy and Turbo’s
`build.outputs` must match that directory. Regenerate deployment files with
`bun run deploy:add <app> --force` if they disagree.

**Next: the ingress host.** The demo URL is owned by the ingress rule in
`bms-chart/<env>/<service>.yaml` in the `Qwipo B2B/k8s` repo, not by anything
here. A typo there serves the wrong app or nothing.

**Then: is the page actually blank, or unstyled?** An unstyled page is a
different bug — Tailwind never scans `node_modules`, so an app using classes
from a shared package needs an `@source` line in its `src/index.css` pointing
at that package's `src` (`packages/ui/src` for mobile, `packages/web-ui/src`
for web). Nothing errors; the component just renders naked. Same for a class
built by interpolation — Tailwind only sees complete strings.

---

## "The home page works but deep links 404"

Seller Store uses hash routes (`/#/orders/123`); Buyer uses screen state and
query parameters. If real URL paths are introduced, nginx needs the SPA
fallback below. Preview builds also require relative asset URLs.

```bash
grep -A2 'location / {' apps/frontend/<app>/nginx.conf
```

It must contain `try_files $uri $uri/ /index.html;`.

---

## "The release pipeline exits 1"

The GitOps manifest doesn't exist: `bms-chart/<env>/<service>.yaml` in the
`Qwipo B2B/k8s` repo. The release template checks for it and hard-fails.

This is a DevOps prerequisite, **not something to fix from this repo**. Don't
edit the pipeline to skip the check. Say what's missing and where:
copy `bms-chart/dev/seller-portal.yaml`, set the ingress host to
`<service>.dev.bms.qwipo.com`, keep the `version: "..."` line (the release
pipeline `sed`s it). The file's existence is what creates the ArgoCD app
`<env>-<service>-argo-app` — one commit to the k8s repo, no ticket.

---

## "The badge in the corner says `local` on a deployed URL"

The version never reached `vite build`. It travels build arg → Dockerfile
`ENV VITE_APP_VERSION` → Turbo → Vite, and any link can drop it silently:

```bash
grep -A1 '"dependsOn": \["^build"\]' turbo.json          # must list VITE_APP_VERSION under env
grep -n 'APP_VERSION' apps/frontend/<app>/Dockerfile        # ARG + ENV VITE_APP_VERSION
grep -n 'build-arg' azure-cicd/templates/mockup-docker-template.yaml
```

Turbo runs tasks in strict env mode: an undeclared variable is not passed
through, and the badge falls back to `local` with nothing failing. Reproduce
locally with `VITE_APP_VERSION=9.9.9 bunx turbo run build --filter=@mockups/<app> --force`
and grep `dist/` for the string. A Dockerfile that predates versioning has no
`ARG APP_VERSION` — regenerate with `bun run deploy:add <app> --force`.

If the badge is missing entirely, the app never mounted `<VersionBadge />` in
`main.tsx`.

---

## "The main build fails at 'push semver git tag'"

Read the error line — the step tells the two causes apart:

- **"already exists — a concurrent main build claimed …"**: two `main` builds
  raced and this one lost. Nothing was pushed to the registry. Re-run; it
  computes the next number.
- **anything else (usually a 403)**: the project Build Service identity lacks
  *Contribute* + *Create tag* on `mockups-lab`. One-time grant in Azure DevOps
  → Project settings → Repositories → mockups-lab → Security. **Not fixable
  from this repo** — say so; don't strip the tag step to get green.

Branch builds never push a tag, so `dev`/`testing`/`staging` are unaffected.

---

## "A tag deploy fails with 'not found in the registry'"

The tag was pushed but the build behind it died afterwards (tag before image is
deliberate — it reserves the number). That version has no image and never
will; the next `main` build takes the next number. Deploy the previous tag
instead, or fix the build and let `main` cut a fresh one. Never retag.

---

## "The deploy ran green but the site didn't change"

Two causes, both about binding.

**1. The release is bound to the wrong build.**
`resources.pipelines.source` in `azure-release.yaml` is the build pipeline's
**display name in Azure DevOps**, not the service name. Nothing validates it —
if someone renamed the build pipeline, the release silently keeps resolving an
old one (or nothing).

```bash
grep -B2 -A2 'source:' apps/frontend/<app>/azure-release.yaml
```

Compare against the display name in the build YAML's header comment, and
against what's actually registered in the `Mockups Lab` folder in Azure.

**2. The service was renamed but not rebuilt.** SERVICE_NAME reaches the deploy
through the **build's artefact**. Change `service_name_override` and the next
deploy binds to nothing until a fresh *build* has run under the new name. A
rename also needs a new `bms-chart/<env>/<new-service>.yaml`; the old manifest
and its ArgoCD app linger until DevOps retires them.

Check both YAMLs carry the same value:

```bash
grep -E 'service_name|tag_prefix' apps/frontend/<app>/docker-build.yml apps/frontend/<app>/azure-release.yaml
```

---

## "The container crash-loops"

Look for a leftover `entrypoint.sh`. The standard for these mockups is **no
entrypoint and no `public/configs/`** — they bundle local demo fixtures at
build time and talk to no backend, so one image is correct in every
environment. The old config-swapping entrypoint `exit 1`s on an NODE_ENV it
doesn't recognise, which is exactly this symptom.

```bash
ls apps/frontend/<app>/entrypoint.sh apps/frontend/<app>/public/configs 2>/dev/null
```

If either exists, either the app was never migrated or someone reintroduced it.
Regenerate with `bun run deploy:add <app> --force` and delete both.

---

## "It builds locally but fails inside Docker"

The build context is the **workspace root**, and the root `.dockerignore`
strips things the local build still sees. Check what the failing step needs
against that file. Known traps:

- `**/*.md` is stripped (root README excepted). If a future app imports
  Markdown at build time, explicitly include those files.
- `.env*` is stripped deliberately — never bake environment files into an image.
- `bun install --frozen-lockfile` fails rather than resolving a different tree.
  If it fails, `bun.lock` genuinely disagrees with the `package.json` files.
  Two causes. A manifest edited without an install: install, commit the
  lockfile with it. Or the lockfile names a workspace the repo doesn't have
  — compare `grep -n '^    "apps/' bun.lock` with `ls -d apps/*/*` — because
  someone installed with an untracked folder under `apps/` and committed
  the lockfile; `bun install` on any checkout without that folder produces
  the corrected lockfile, and that is what to commit. **Fix the cause —
  never delete or regenerate `bun.lock` or `flake.lock` to dodge the
  error.**

---

## Reporting back

Name the layer that broke and what it means for the demo, in product terms:
"the seller store URL is 404ing because the image shipped an empty directory —
regenerated and rebuilt, needs one more build run before it's live." Don't
report a pipeline as fixed when the fix is a commit someone else has to make in
the k8s repo.
