---
name: deploy-mockup
description: Prepare deployment files. Examine deployment prerequisites. Change hosted resources only within explicit authorization.
---

# Prepare a deployment

Use the [repository instructions](../../../CLAUDE.md).
Preparation does not authorize a commit, push, pipeline run, or hosted-resource change.
A command to push can cause automatic deployment. Tell the user that effect before the approved push.

## Keep the application identity

| Application | Service | Pipeline label | Tag prefix |
| --- | --- | --- | --- |
| `qwipo-buyer-paytm-app` | `mockups-buyer-app` | `Buyer App` | `buyer-app` |
| `seller-store` | `mockups-seller-store` | `Seller Store` | `seller-store` |
| `rirn` | `mockups-rirn-company` | `RIRN Company` | `rirn-company` |
| `rirn-retailer` | `mockups-rirn-retailer` | `RIRN Retailer` | `rirn-retailer` |
| `qwipo-analytics` | `mockups-analytics` | `Analytics` | `analytics` |
| `storybook` | `mockups-storybook` | `Storybook` | `storybook` |
| `storybook-web` | `mockups-storybook-web` | `Storybook Web` | `storybook-web` |

Read the existing Dockerfile, nginx configuration, and pipeline files before regeneration.
The release pipeline refers to the build pipeline by its exact display name.
Do not change service names, pipeline labels, or tag prefixes as an incidental repair.

## Deployment file map

Replace `<app>` with the selected application folder name.
Unless the table names an external repository, these paths are relative to the repository root.

| File or setting | Responsibility |
| --- | --- |
| `scripts/add-deploy.ts` | Generator, identity options, proposed GitOps manifest, and proposed registration commands |
| `apps/frontend/<app>/package.json` | Application build command |
| `apps/frontend/<app>/vite.config.ts` | Relative asset base and development configuration |
| `apps/frontend/<app>/Dockerfile` | Workspace build context, version arguments, and copied `dist/` or `storybook-static/` output |
| `apps/frontend/<app>/nginx.conf` | Static hosting, SPA fallback, and `/builds/` proxy |
| `apps/frontend/<app>/docker-build.yml` | Build triggers, path filters, service name, tag prefix, and template parameters |
| `apps/frontend/<app>/azure-release.yaml` | Build-pipeline reference, environment mapping, and release parameters |
| `azure-cicd/templates/mockup-docker-template.yaml` | Version reservation, Docker build, preview upload, retention, and build artifact |
| `azure-cicd/templates/mockup-release-template.yaml` | Artifact/tag selection, registry check, manifest update, and ArgoCD synchronization |
| `turbo.json` | `tasks.build.env` and `tasks.build.outputs` |
| `.dockerignore` | Exclusions from the workspace-root Docker context |
| External `Qwipo B2B/k8s`: `bms-chart/<env>/<service>.yaml` | Target service manifest and image `version` |

Use the workspace root as the Docker build context.
The build needs root `bun.lock`, workspace manifests, and shared `packages/` source.
Keep the Docker output directory, template `out_dir`, and Turbo `dist/**` or `storybook-static/**` cache outputs consistent.

The build YAML extends `/azure-cicd/templates/mockup-docker-template.yaml`.
The release YAML extends `/azure-cicd/templates/mockup-release-template.yaml`.
Keep `resources.pipelines.source` equal to the registered build pipeline's display name.
Use the pipeline label in the identity table followed by ` - Build`.
For example, RIRN Console uses `RIRN Company - Build`.

## Generate files safely

The generator creates `Dockerfile`, `nginx.conf`, `docker-build.yml`, and `azure-release.yaml` in the application folder.
It prints a proposed GitOps manifest and registration commands.
It does not apply those remote changes.

For a new application, replace `<app>` with its folder name:

```bash
bun run deploy:add <app>
```

For existing files, first run regeneration in a separate temporary copy.
The `--force` option overwrites existing files without preserving their custom values.
If existing identity values differ from the generator defaults, supply those values.
For Buyer App, use:

```bash
bun run deploy:add qwipo-buyer-paytm-app --service mockups-buyer-app --label "Buyer App" --tag-prefix buyer-app --force
```

For Seller Store, use:

```bash
bun run deploy:add seller-store --service mockups-seller-store --label "Seller Store" --force
```

This command keeps the default `seller-store` tag prefix.
Do not add `--tag-prefix seller-store` to this command.
The current argument parser cannot distinguish that flag value from the application name.

Compare all generated files with the originals.
Apply only the necessary corrections to the working repository.
Keep custom configuration that the application still uses.

The printed manifest contains Kubernetes short names.
The four local deployment files do not record those names.
For an existing deployment, get the current short names from its GitOps manifest or another authoritative record.
If a verified short name differs from the default, supply it with `--short`.

Without that record, keep the printed manifest as a proposal. Do not apply it to the existing deployment.
Local file comparisons can continue without a change to the external manifest.

## Examine local behavior

1. Use [verify](../verify/SKILL.md).
2. If Docker is available, examine the Docker build from the repository root.
3. Make sure that nginx serves the application's build output directory.
4. Examine the version display and applicable deep links.
5. Examine preview assets below the actual URL prefix.

The Docker builder uses a frozen dependency installation and an application build.
It currently omits lint and type checks.
Before you record server-side quality enforcement, make sure that the applicable validation job exists and operates correctly.

The frontend applications use static bundles with local fixtures.
Storybook builds to `storybook-static/`. Vite builds to `dist/`.
Mock API is a Bun service. Use its Dockerfile instead of the frontend deployment generator.
Do not add runtime configuration without a defined requirement.
Before you remove an entrypoint or configuration file, examine its consumers.
For imported applications, examine any `entrypoint.sh` or `public/configs/` references before adopting runtime configuration.
The static frontend applications do not need configuration swapping for their bundled fixtures.

## Examine branch behavior

| Source | Current pipeline behavior |
| --- | --- |
| `feature/*` | Build and upload static previews when the path filters match. |
| `dev` | Build an image for the dev deployment. |
| `testing` | Build an image for the testing deployment. |
| `staging` | Build an image for the staging deployment. |
| `main` | Reserve a release tag and build a versioned image. |
| Other names, including `dev-cleanup` | No automatic trigger in the current branch filters. |

The files also contain `dev/*`, but that prefix conflicts with the existing `dev` branch.
If the user does not supply a branch name, use `feature/*` for a new preview branch.
Do not change an existing branch name without authorization.
Before you predict a pipeline run, examine its branch and path filters.

A manual release can select an environment that differs from the branch mapping.
Examine the requested environment and exact artifact before an approved release.

## Examine previews

Keep Vite `base: './'` for prefix-hosted previews.
Use Seller Store's hash routes or Buyer's existing query navigation.
Use imported assets or relative public-asset URLs.
A literal `/images/item.png` starts at the host root and can fail under a preview prefix.

The template uploads previews to the `qwipo-mockups` Space.
The application nginx configuration serves them below `/builds/`.
The current retention setting keeps five builds per branch, plus `latest/`.
An older commit URL can disappear after later uploads.

The build template uses `IS_PREVIEW`, `out_dir`, and `PREVIEW_KEEP` for preview behavior.
Uploads use `<service>/<branch-slug>/<sha>/` and `<service>/<branch-slug>/latest/` in the `qwipo-mockups` Space.
The nginx `location ^~ /builds/` block maps the hosted preview URL to that storage prefix.
Use the URL printed by the actual build rather than deriving a slug from an unverified branch name.

For a working preview, the deployed dev host must have the proxy configuration.
The preview also uses the `mockups-spaces` variable group and valid bucket permissions.
Before you give a preview URL as a working link, examine those resources.

## Examine external controls

Before an approved deployment, make sure that these conditions apply:

1. The selected remote branch contains the referenced pipeline files.
2. Azure registers the correct build and release pipelines.
3. The release pipeline refers to the correct build pipeline.
4. The target GitOps manifest exists in the separate `Qwipo B2B/k8s` repository.
5. The manifest uses the correct service, host, and image version.
6. The required variable groups and service permissions exist.
7. The production environment has the required approval check.
8. The source branch has the required review and validation policies.

These controls exist outside this repository.
Their descriptions do not prove their current configuration.
For production, an established approval control is necessary.
If that control is absent or unverified, stop.
Do not bypass a failed approval or manifest check.

For each target environment, confirm the exact external manifest path before an approved release.
Buyer uses the service name `mockups-buyer-app`, not its longer application folder name.
For example, its dev manifest is `bms-chart/dev/mockups-buyer-app.yaml`.
The release template updates the manifest's quoted `version: "..."` value.
It constructs the ArgoCD application name as `<env>-<service>-argo-app`.
Confirm the external chart and application configuration instead of assuming those resources exist.

The generator assumes that external `bms-chart/templates/ingress.yaml` combines a rule key with `baseDomain`.
Its dev example uses `bms-chart/dev/common.yaml` for shared values.
Before applying a generated manifest, examine those files in the actual `Qwipo B2B/k8s` checkout.
For a local render in that checkout, replace `<service>` with the verified service name:

```bash
helm template bms-chart -f bms-chart/dev/common.yaml -f bms-chart/dev/<service>.yaml
```

Examine the rendered host, service, port, certificate reference, and image version.
A local render does not confirm that a deployed ingress or certificate exists.

The generator prints Azure registration commands for the `Mockups Lab` folder in the `Qwipo B2B` project.
Before approved registration, confirm `--branch`, `--yml-path`, repository, and pipeline display name.
Use `--skip-first-run true` to avoid an unintended initial pipeline run during registration.
Registration does not authorize a later pipeline run or deployment.

## Versions and recovery

A main build reserves `<tag-prefix>-v<version>` before the image build.
If that build fails, the tag can exist without an image.
Tag-creation permission is necessary for the build identity.
Do not grant force-push permission to resolve a tag-creation failure.

Use the tag prefix in the identity table followed by `-v*`.
For example, Analytics uses `analytics-v*`.
Main image versions use the semantic version without the Git tag prefix.
Branch builds use a branch-and-commit identifier such as `dev-<sha>`.
The build publishes `build_vars.env` with `SERVICE_NAME` and `IMAGE_GIT_DIGEST` for the release pipeline.
After a service-name change, an approved deployment needs a fresh build artifact with the new identity.
Keep any former service's external retirement separate from the local rename.

Version display follows this sequence:

```text
APP_VERSION / APP_COMMIT build arguments
  -> Dockerfile VITE_APP_VERSION / VITE_APP_COMMIT
  -> turbo.json tasks.build.env
  -> Vite bundle
  -> packages/version-badge/src/version.ts
  -> VersionBadge in the application's src/main.tsx
     or the Storybook manager version badge
```


For an approved rollback, select an existing release tag with a verified image.
Use the release pipeline's tag mode for the requested environment.
Examine the resulting GitOps version, ArgoCD state, and served version.
Do not record deployment success from a build result alone.
