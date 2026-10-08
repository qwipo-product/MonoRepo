#!/usr/bin/env bun
/**
 * Put a mockup on the deploy path.
 *
 *   bun run deploy:add seller-store
 *   bun run deploy:add rirn --service mockups-rirn-company --label "RIRN Company"
 *   bun run deploy:add storybook --force        # overwrite an existing fileset
 *
 * Writes the standard four-file deploy set into apps/frontend/<app>/ and
 * prints the things this repo cannot do for itself: the GitOps manifest
 * that has to exist in the `Qwipo B2B/k8s` repo, the `az pipelines create`
 * calls that register the YAMLs in Azure DevOps, and the one-time permission
 * the tag push needs.
 *
 * ── Versioning ──────────────────────────────────────────────────────────────
 *
 * The two YAMLs are thin: they `extends:` the repo-local templates in
 * azure-cicd/templates/, which carry the versioning model (same as
 * buyer-web-mini in buyer-apps-monorepo). A main build computes the next
 * semver from the `<tag_prefix>-v*` git tags, pushes the tag, and builds the
 * image as `<semver>`; any other branch builds `<branch>-<sha>` and pushes no
 * tag. The release pipeline deploys either the build that triggered it or —
 * run manually on a tag — an existing release image, which is also how a
 * mockup is rolled back.
 *
  * Pushes to dev/* and feature/* are PREVIEW builds: the same Dockerfile is
 * built to its builder stage, the output directory is uploaded to the
 * DigitalOcean Space qwipo-mockups, and the nginx.conf written here proxies
 * that bucket under /builds/ on the mockup.s host. No image, no deploy.
 *
 * The image's own tag is handed to `docker build` as APP_VERSION, the
 * Dockerfile exports it as VITE_APP_VERSION, and @mockups/version-badge
 * shows it in the corner of every page. No runtime config is involved.
 *
 * The tag prefix is written into the YAMLs as a literal, derived once from
 * the service name. It is deliberately NOT re-derived from anything at build
 * time: a rename must not fork the tag lineage. Pass --tag-prefix to keep an
 * existing lineage across a service rename.
 *
 * ── Why there is no runtime config here ─────────────────────────────────────
 *
 * These are mockups. Every one of them bundles @mockups/mock-data at build
 * time and talks to nothing — no API base URL, no feature flags, nothing that
 * differs between dev and production. So the image is a pure static artefact:
 * nginx and a directory of files, no entrypoint, no configs/config.*.json.
 *
 * That is a deliberate simplification of the pattern seller-platform uses.
 * A config-swapping entrypoint that has nothing to swap is not neutral — it
 * `exit 1`s the container on an NODE_ENV it doesn't recognise, which is a
 * live failure mode bought for zero benefit. If a mockup ever genuinely needs
 * a backend, add the entrypoint to that one app and say why in its Dockerfile.
 *
 * ── What is derived rather than left to whoever copies files ────────────────
 *
 *   - build output dir  — read out of the app's own `build` script, because
 *                         the Storybook catalogs emit storybook-static/ and
 *                         the Vite apps emit dist/. Copying the wrong one
 *                         yields an nginx serving an empty directory: no
 *                         error, just a 404 page.
 *   - service name      — `mockups-<what-it-is>`. No `qwipo-` prefix: the
 *                         registry is already the Qwipo registry and the
 *                         domain already says it.
 *   - pipeline label    — derived from the service name so the release YAML's
 *                         `resources.pipelines.source` cannot drift from the
 *                         build pipeline's display name. That binding is by
 *                         display name and nothing validates it.
 *   - tag prefix        — the service name minus `mockups-`, so tags read
 *                         `seller-store-v1.2.3`, and the same string is in
 *                         both YAMLs.
 */

import { $ } from 'bun';
import { existsSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const ROOT = join(import.meta.dir, '..');
const FRONTEND = join(ROOT, 'apps', 'frontend');

// ── args ─────────────────────────────────────────────────────────────────────

const argv = process.argv.slice(2);
const force = argv.includes('--force');

function flag(name: string): string | undefined {
  const i = argv.indexOf(`--${name}`);
  return i === -1 ? undefined : argv[i + 1];
}

const flagValues = new Set(
  [flag('service'), flag('label'), flag('short'), flag('branch'), flag('tag-prefix')].filter(Boolean) as string[]
);
const app = argv.find((a) => !a.startsWith('--') && !flagValues.has(a));

if (!app) {
  console.error(
    '✗ Usage: bun run deploy:add <app> [--service mockups-x] [--label "X"] [--tag-prefix x] [--force]'
  );
  process.exit(1);
}

const dir = join(FRONTEND, app);
if (!existsSync(join(dir, 'package.json'))) {
  console.error(`✗ apps/frontend/${app} is not an app (no package.json).`);
  process.exit(1);
}

// ── derive everything from the app itself ────────────────────────────────────

const pkg = await Bun.file(join(dir, 'package.json')).json();
const pkgName: string = pkg.name;

// Storybook writes `-o storybook-static`; Vite writes dist/. Read it rather
// than assume it — this is the single most common way to ship a broken image.
const buildScript: string = pkg.scripts?.build ?? '';
const outDir = buildScript.match(/-o\s+(\S+)/)?.[1] ?? 'dist';
const isCatalog = buildScript.includes('storybook build');

// Does this app route on real URLs? The SPA fallback goes into nginx.conf
// either way — it is the correct default — but whether it is load-bearing
// decides whether someone can safely delete it later. rirn-retailer, for one,
// switches screens on component state and has no router at all.
const routes = Boolean(pkg.dependencies?.['react-router'] ?? pkg.dependencies?.['react-router-dom']);

// `mockups-<what-it-is>` — drop the redundant qwipo- prefix and the -app
// suffix that says nothing.
const derivedService = `mockups-${app.replace(/^qwipo-/, '').replace(/-app$/, '')}`;
const service = flag('service') ?? derivedService;

if (!/^mockups-[a-z0-9-]+$/.test(service)) {
  console.error(`✗ "${service}" must look like mockups-<what-it-is> (lowercase, hyphens).`);
  process.exit(1);
}

// Pipeline display name. The release YAML binds to this string; deriving it
// means the two files cannot disagree.
const label =
  flag('label') ??
  service
    .replace(/^mockups-/, '')
    .split('-')
    .map((w) => (w === 'rirn' ? 'RIRN' : w[0].toUpperCase() + w.slice(1)))
    .join(' ');

// Git tag prefix: `seller-store-v1.2.3`. The `mockups-` is dropped because
// every tag in this repo is a mockup. Written into both YAMLs as a literal —
// see the header on why it must never be re-derived at build time.
const tagPrefix = flag('tag-prefix') ?? service.replace(/^mockups-/, '');

if (!/^[a-z0-9-]+$/.test(tagPrefix)) {
  console.error(`✗ "${tagPrefix}" must be lowercase letters, digits and hyphens (tags are <prefix>-v1.2.3).`);
  process.exit(1);
}

// The branch the pipeline should build from. Defaults to whatever branch you
// are on, because `az pipelines create` resolves --yml-path against that
// branch in the remote — point it at a branch where the file doesn't exist and
// the pipeline registers fine and fails the first time anyone runs it. The
// mockups have historically lived on a feature branch rather than main.
const branch = flag('branch') ?? (await $`git rev-parse --abbrev-ref HEAD`.cwd(ROOT).quiet().text()).trim();

const host = `${service}.dev.bms.qwipo.com`;
const appPath = `apps/frontend/${app}`;
const what = isCatalog ? 'static Storybook catalog' : 'Vite/React SPA';

// Short name for the k8s Deployment/Service objects. Everything in the dev
// namespace shares bms-resources, so this only has to be unique there — the
// chart appends `-svc` and `-port`, and a port name over 15 chars is rejected
// by Kubernetes, which is why this stays short. `mk` marks it as a mockup.
const short = flag('short') ?? `mk${service.replace(/^mockups-/, '').split('-').map((w) => w[0]).join('')}-web`;

// ── templates ────────────────────────────────────────────────────────────────

const dockerfile = `# syntax=docker/dockerfile:1.7
#
# ${app} — ${what}, served by nginx.
#
# Generated by \`bun run deploy:add ${app}\`. Regenerate rather than hand-edit.
#
# Build context: WORKSPACE ROOT. The build template runs
# \`docker buildx build --file $DOCKERFILE_PATH ... .\` from the repo root, so
# the builder sees bun.lock, every member package.json, and the packages/*
# sources this app links via \`workspace:*\`. Locally:
#
#   docker build -f ${appPath}/Dockerfile -t ${service}:local .
#
# Stamp a version the way the pipeline does (the badge then shows it):
#
#   docker build --build-arg APP_VERSION=1.2.3 \\
#                --build-arg APP_COMMIT=$(git rev-parse --short HEAD) \\
#                -f ${appPath}/Dockerfile -t ${service}:1.2.3 .
#
# Two stages:
#   1. builder — bun-alpine, frozen install, \`turbo run build --filter=<app>\`
#                with the version exported for Vite to inline.
#   2. final   — nginx-alpine serving ${outDir}/.
#
# No entrypoint and no configs/: this mockup bundles its data at build time and
# talks to no backend, so one image is correct in every environment. The
# version is part of the bundle for the same reason — nothing is injected at
# container start.

ARG BUN_VERSION=1.3.13
ARG NGINX_VERSION=1.29.0-alpine3.22
ARG APP_PATH=${appPath}
ARG APP_NAME=${pkgName}

# ─────────────────────────────────────────────────────────────────────────────
# Stage 1 — builder
# ─────────────────────────────────────────────────────────────────────────────
FROM oven/bun:\${BUN_VERSION}-alpine AS builder

WORKDIR /workspace

# The root .dockerignore strips node_modules / dist / storybook-static /
# .turbo / .env* / .direnv.
COPY . .

# Frozen: the build fails rather than silently resolving a different tree.
RUN bun install --frozen-lockfile

# Which build is this? The pipeline passes the image's own registry tag
# (\`1.2.3\` on a main release, \`dev-8abf53d\` on a branch build) and the
# commit. Vite inlines both as import.meta.env.VITE_*, and
# @mockups/version-badge shows them in the corner of the page. A plain local
# build reads \`local\`. turbo.json declares both under build.env, or Turbo's
# strict env mode would never hand them to \`vite build\`.
ARG APP_VERSION=local
ARG APP_COMMIT=
ENV VITE_APP_VERSION=\${APP_VERSION} VITE_APP_COMMIT=\${APP_COMMIT}

# Turbo builds this app's workspace dependencies first, then the app.
ARG APP_NAME
RUN bunx turbo run build --filter=\${APP_NAME}

# ─────────────────────────────────────────────────────────────────────────────
# Stage 2 — final
# ─────────────────────────────────────────────────────────────────────────────
FROM nginx:\${NGINX_VERSION} AS final

ARG APP_PATH
ARG APP_VERSION=local
ARG APP_COMMIT=

# So \`docker inspect\` answers "which build is this?" without starting it.
LABEL org.opencontainers.image.version="\${APP_VERSION}" \\
      org.opencontainers.image.revision="\${APP_COMMIT}"

# Drop nginx's stock site before adding ours, or both claim :80 and nginx
# refuses to boot with "duplicate default server for 0.0.0.0:80".
RUN rm -f /etc/nginx/conf.d/default.conf
COPY \${APP_PATH}/nginx.conf /etc/nginx/conf.d/mockup.conf

# This app builds to ${outDir}/ — read off its own \`build\` script, not assumed.
# Point this at the wrong directory and nginx serves an empty root: no error
# at build time, just a 404 page at runtime.
COPY --from=builder /workspace/\${APP_PATH}/${outDir}/ /usr/share/nginx/html/

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
`;

const nginxConf = `# nginx config for ${app} — ${what}.
#
# Generated by \`bun run deploy:add ${app}\`.
#
# - listen on 80 (the only port nginx-alpine exposes by default)
# - serve the build from /usr/share/nginx/html
# - fallback: any path that isn't a file on disk falls through to /index.html
# - long-cache the content-hashed bundles, never-cache index.html so a deploy
#   is live on the next request without operator action

server {
    listen       80;
    server_name  _;

    root   /usr/share/nginx/html;
    index  index.html;

    gzip              on;
    gzip_vary         on;
    gzip_min_length   1024;
    gzip_proxied      any;
    gzip_comp_level   5;
    gzip_types
        text/plain
        text/css
        text/javascript
        application/javascript
        application/json
        application/xml
        image/svg+xml
        font/ttf
        font/otf;

    # Content-hashed filenames — safe to cache forever. Un-hashed imagery under
    # public/ is fine here too; it is replaced by name when it changes.
    #
    # json is deliberately NOT in this list.${
      isCatalog
        ? " Storybook's index.json and\n    # project.json are un-hashed and re-read on every load, so they must fall\n    # through to the uncached default below."
        : ''
    }
    location ~* \\.(?:js|css|woff2?|ttf|otf|eot|png|jpg|jpeg|gif|webp|svg|ico)$ {
        expires 1y;
        access_log off;
        add_header Cache-Control "public, immutable";
        try_files $uri =404;
    }

    # index.html — never cache, so deploys take effect immediately.
    location = /index.html {
        add_header Cache-Control "no-store, no-cache, must-revalidate";
        expires    -1;
    }

    # Preview builds. Every push to dev/* or feature/* uploads the built site to
    # the DigitalOcean Space qwipo-mockups under <service>/<branch>/<sha>/ (see
    # azure-cicd/templates/mockup-docker-template.yaml) and this host serves
    # the bucket under /builds/. Nothing below is on disk in this image.
    #   /builds/                    every branch
    #   /builds/<branch>/           every commit of that branch, plus latest/
    #   /builds/<branch>/<sha>/     one build
    # The bucket has no index document and no fallback, so a directory URL is
    # turned into its index.html here and a missing object is a plain 404. The
    # apps route on the URL hash, so no other path ever reaches the bucket.
    location = /builds {
        return 301 /builds/;
    }
    location ^~ /builds/ {
        rewrite ^(/builds.*)/$ $1/index.html last;
        rewrite ^(/builds/[^/]+(/[^/.]+)?)$ $1/ permanent;
        proxy_pass https://qwipo-mockups.blr1.digitaloceanspaces.com/${service}/;
        proxy_set_header Host qwipo-mockups.blr1.digitaloceanspaces.com;
        proxy_ssl_server_name on;
        proxy_hide_header x-amz-request-id;
        proxy_hide_header x-amz-id-2;
        proxy_intercept_errors on;
        error_page 403 404 = @no_such_build;
    }
    location @no_such_build {
        types { }
        default_type text/plain;
        return 404 "No such build. The list is at /builds/\n";
    }

${
  isCatalog
    ? `    # Storybook serves each story through iframe.html, which is a real file on
    # disk, so try_files finds it before the fallback ever runs.`
    : routes
      ? `    # SPA fallback. This app routes on the URL hash (#/orders/123) — it must,
    # for preview builds — so nothing depends on this today. Kept because it is
    # the right default: a stray real path lands on the app instead of a 404.`
      : `    # SPA fallback. This app has no router — it switches screens on component
    # state — so nothing depends on this today. Kept because it is the right
    # default: the moment someone adds react-router, deep links just work.`
}
    location / {
        try_files $uri $uri/ /index.html;
    }

    error_page  500 502 503 504  /50x.html;
    location = /50x.html {
        root /usr/share/nginx/html;
    }
}
`;

const dockerBuild = `# Build pipeline — ${app} (${what} behind nginx).
#
# Registered in Azure DevOps as:  \\Mockups Lab\\${label} - Build
# "${label} - Deploy" binds to that exact display name via
# \`resources.pipelines.source\`, so renaming this pipeline breaks the release.
# Rename both or neither.
#
# Thin on purpose: the build logic — and the versioning model — lives in
# azure-cicd/templates/mockup-docker-template.yaml, shared by every mockup.
# Read that file's header for how versions and tags work.
#
# Auto-triggered. The product team pushes a branch and the mockup redeploys;
# nobody should have to know a pipeline exists. The branch decides the
# environment — see azure-release.yaml for the mapping.
#
# ── Versions ─────────────────────────────────────────────────────────────────
#
#     main       → next semver from the \`${tagPrefix}-v*\` git tags; the tag
#                  \`${tagPrefix}-v<semver>\` is pushed, the image is <semver>
#     other      → <branch>-<sha>, no git tag
#     dev/*, feature/* → PREVIEW: no image, the built site is uploaded to the
#                  qwipo-mockups Space and served at
#                  https://${host}/builds/<branch>/<sha>/
#
# \`bump\` only matters on main. An auto-triggered run always takes patch; run
# the pipeline by hand and pick minor/major for a bigger step.
#
# The tag prefix below is a literal, on purpose. Regenerating with a different
# --service changes it and forks the tag lineage — pass --tag-prefix to keep
# the old one across a rename.
#
# \`packages/**\` is in the path filter because a change to a shared package
# changes this app's output. That means one commit to packages/ rebuilds every
# mockup, which is correct and is why these builds are kept cheap.

trigger:
    branches:
        include:
            - main
            - dev
            - testing
            - staging
            - dev/*
            - feature/*
    paths:
        include:
            - '${appPath}/**'
            - 'packages/**'
            - 'turbo.json'
            - 'package.json'
            - 'bun.lock'

parameters:
    - name: bump
      displayName: Semver bump (main only; auto-triggered runs always patch)
      type: string
      default: patch
      values:
          - patch
          - minor
          - major

extends:
    template: /azure-cicd/templates/mockup-docker-template.yaml
    parameters:
        service_name: '${service}'
        tag_prefix: '${tagPrefix}'
        dockerfile: ${appPath}/Dockerfile
${outDir === "dist" ? "" : `        out_dir: ${outDir}\n`}        bump: \${{ parameters.bump }}
`;

const azureRelease = `# Release pipeline — ${app}.
#
# Registered in Azure DevOps as:  \\Mockups Lab\\${label} - Deploy
# Demo URL:  https://${host}
#
# Takes the image built by "${label} - Build", rewrites the digest in the
# GitOps repo (k8s) at bms-chart/<env>/${service}.yaml, then syncs the ArgoCD
# app \`<env>-${service}-argo-app\`. The deploy logic lives in
# azure-cicd/templates/mockup-release-template.yaml, shared by every mockup.
#
# \`source:\` below is the *display name* of the build pipeline, not the service
# name — Azure resolves it by name across folders. Rename that pipeline and you
# must change this string in the same commit or the release stops binding.
#
# SERVICE_NAME reaches the deploy through the build's artefact, so changing
# \`service_name\` needs a fresh BUILD run before any deploy can bind.
#
# The k8s ApplicationSet generates the ArgoCD app from the presence of the
# manifest file, so bms-chart/<env>/${service}.yaml must exist for EVERY env
# this can deploy to. The release template exits 1 if it is missing.
#
# ── Branch → environment ────────────────────────────────────────────────────
#
# This auto-triggers off the build, and the branch that built decides where it
# lands. Pushing is the whole interface: the product team should never open a
# pipeline to ship a mockup.
#
#     dev      → dev         testing  → testing
#     staging  → staging     main     → production
#     tag ${tagPrefix}-v*  → production
#
# \`environment: auto\` (the default) is what applies that mapping. Picking any
# other value on a manual run overrides it, which is the escape hatch for
# deploying a branch — or a tag — somewhere it wouldn't normally go.
#
# ── Deploying a tag (release or rollback) ───────────────────────────────────
#
# Run this pipeline by hand and pick a \`${tagPrefix}-v<semver>\` tag in the run
# dialog's branch/tag selector. No build is involved: the template checks the
# image \`${service}:<semver>\` exists in the registry and deploys it as-is.
# That is also how a mockup is rolled back — deploy the previous tag.
#
# Two things about this that are easy to get wrong:
#
#   - The \`branches:\` filter below is read from the copy of THIS FILE on the
#     release pipeline's default branch — not from the branch that just built.
#     Adding a branch here does nothing until that edit reaches the default
#     branch too.
#   - The mapping expression is compile-time (\`\${{ }}\`), evaluated against the
#     triggering build's branch. That works only because the build and release
#     YAMLs live in the same repo as the app.
#
# production carries an Azure DevOps approval check, so a merge to main queues
# a deploy and waits for a human. dev, testing and staging do not.

trigger: none

parameters:
    - name: environment
      displayName: Environment (auto = decided by branch or tag)
      type: string
      default: auto
      values:
          - auto
          - dev
          - testing
          - staging
          - production

resources:
    pipelines:
        - pipeline: buildPipeline
          source: '${label} - Build'
          trigger:
              branches:
                  include:
                      - main
                      - dev
                      - testing
                      - staging

extends:
    template: /azure-cicd/templates/mockup-release-template.yaml
    parameters:
        \${{ if ne(parameters.environment, 'auto') }}:
            environment: \${{ parameters.environment }}
        \${{ elseif or(eq(variables['Build.SourceBranch'], 'refs/heads/main'), startsWith(variables['Build.SourceBranch'], 'refs/tags/${tagPrefix}-v')) }}:
            environment: production
        \${{ elseif eq(variables['Build.SourceBranch'], 'refs/heads/testing') }}:
            environment: testing
        \${{ elseif eq(variables['Build.SourceBranch'], 'refs/heads/staging') }}:
            environment: staging
        \${{ else }}:
            environment: dev
        service_name: '${service}'
        tag_prefix: '${tagPrefix}'
`;

// The GitOps manifest. Not written here — it belongs to the k8s repo — but
// emitted ready to paste, because the alternative is reverse-engineering the
// chart's value schema from a neighbouring service every time.
//
// The two lines that actually matter:
//   - the ingress rule key IS the demo URL. templates/ingress.yaml renders
//     `<key>.<baseDomain>`, and dev/common.yaml sets baseDomain to
//     dev.bms.qwipo.com. TLS is a wildcard, so a new subdomain needs nothing.
//   - `version` is a placeholder until the first build; the release pipeline
//     seds that exact line. Keep it, and keep it quoted.
const manifest = `# ${label} — ${what} (mockup)
#
#   https://${host}
#
# Static mockup: nginx serving a built ${outDir}/ on :80. No backend and no
# env-specific config, so there is no \`env:\` block and none is needed — the
# same image is correct in every environment.
shared:
  deployments: true
  services: true
  ingress: true
deployments:
  ${short}:
    enabled: true
    autoscaling:
      enabled: true
      targetCPUUtilizationPercentage: 250
      targetMemoryUtilizationPercentage: 150
    imagePullPolicy: "IfNotPresent"
    type: "web"
    labels:
      name: "${short}"
    image: "${service}"
    version: "dev-0000000"
    port: 80
    # The CPU request is deliberately far below the house norm — most web
    # services here ask 50m. Requests are what count against the cluster's
    # schedulable capacity, and there will be a lot of mockups; an nginx
    # serving pre-built static files idles near zero, so asking 50m apiece
    # would reserve capacity nothing uses and eventually block new mockups
    # from scheduling at all. The limit is left at the house value: it caps a
    # burst, it doesn't reserve anything.
    resources:
      requests:
        cpu: "10m"
        memory: "20Mi"
      limits:
        cpu: "180m"
        memory: "120Mi"
services:
  ${short}:
    enabled: true
    selector:
      name: "${short}"
    port: 80
ingress:
  enabled: true
  rules:
    ${service}:
      enabled: true
      path: "/"
      pathType: "Prefix"
      serviceName: "${short}"
      servicePort: 80
argocd:
  syncWave: 20
`;

// ── write ────────────────────────────────────────────────────────────────────

const files: Record<string, string> = {
  Dockerfile: dockerfile,
  'nginx.conf': nginxConf,
  'docker-build.yml': dockerBuild,
  'azure-release.yaml': azureRelease,
};

const written: string[] = [];
const skipped: string[] = [];

for (const [rel, contents] of Object.entries(files)) {
  const path = join(dir, rel);
  if (existsSync(path) && !force) {
    skipped.push(rel);
    continue;
  }
  await mkdir(join(path, '..'), { recursive: true });
  await writeFile(path, contents);
  written.push(rel);
}

console.log(`\n✓ ${app} → ${service}   (${what}, builds to ${outDir}/, tags ${tagPrefix}-v*)\n`);
for (const f of written) console.log(`    + ${appPath}/${f}`);
for (const f of skipped) console.log(`    · ${appPath}/${f}  (exists — pass --force to overwrite)`);

console.log(`
  Three prerequisites this repo cannot satisfy for itself:

  1. GitOps manifest — save this as bms-chart/dev/${service}.yaml in the
     "Qwipo B2B/k8s" repo. Its existence is what creates the ArgoCD app
     dev-${service}-argo-app; nobody registers it by hand.

${manifest
  .split('\n')
  .map((l) => (l ? `       ${l}` : ''))
  .join('\n')}

     Verify it renders the way ArgoCD will render it:
       helm template bms-chart -f bms-chart/dev/common.yaml \\
         -f bms-chart/dev/${service}.yaml

  2. Register both YAMLs under the "Mockups Lab" folder:
       az pipelines create --org https://dev.azure.com/xavica --project "Qwipo B2B" \\
         --name "${label} - Build" --folder-path "Mockups Lab" \\
         --repository mockups-lab --repository-type tfsgit --branch ${branch} \\
         --yml-path ${appPath}/docker-build.yml --skip-first-run true

       az pipelines create --org https://dev.azure.com/xavica --project "Qwipo B2B" \\
         --name "${label} - Deploy" --folder-path "Mockups Lab" \\
         --repository mockups-lab --repository-type tfsgit --branch ${branch} \\
         --yml-path ${appPath}/azure-release.yaml --skip-first-run true

  3. Once per repo, not per app: main builds push a git tag, so the
     "Qwipo B2B Build Service" identity needs Contribute + Create tag on the
     mockups-lab repo (Project settings → Repositories → mockups-lab →
     Security). Already done if any mockup has cut a release; otherwise the
     first main build fails at "push semver git tag" with a 403.

  Verify the image locally before handing it over:
       docker build -f ${appPath}/Dockerfile -t ${service}:local .
       docker run --rm -p 8080:80 ${service}:local
`);
