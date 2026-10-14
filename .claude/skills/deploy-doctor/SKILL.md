---
name: deploy-doctor
description: Diagnose failed builds, previews, or deployments from logs and configuration. Keep deployment identities during repairs.
---

# Diagnose a deployment problem

Use the [repository instructions](../../../CLAUDE.md).
Use [deploy-mockup](../deploy-mockup/SKILL.md) for identities and approved deployment operations.
Do not run a pipeline or change a hosted resource solely to investigate a local instruction.

## Find the failure

1. Find the application, expected version, URL, and environment.
2. Read the failed step or observed browser error.
3. Compare the evidence with the current source and configuration.
4. Select the failing layer from the table below.

| Layer | Evidence |
| --- | --- |
| Application | Compiler output, browser console, asset requests, and routes |
| Container | Docker build output, image contents, and container logs |
| Pipeline | Run status, parameters, permissions, and artifact version |
| GitOps | Target manifest path and recorded image version |
| Service | ArgoCD status, ingress host, and served version |

A successful build does not prove that the service works.
An exit code alone does not show the cause.

## Examine the symptom

| Symptom | Checks |
| --- | --- |
| Build fails | Read the first related error. Examine dependency, toolchain, source, and registry evidence. |
| Page returns 404 | Examine the requested path, ingress host, served files, and nginx rules. |
| Page is blank | Examine browser errors and failed asset requests. |
| Page has no styles | Examine Tailwind source entries, token imports, and complete class names. |
| Preview fails | Examine the URL prefix, relative assets, navigation, proxy, and bucket access. |
| Deep link fails | Examine the actual routing mode and server fallback. |
| Badge shows `local` | Trace version build arguments, environment variables, Turbo inputs, and Vite output. |
| Release exits with an error | Read the failed step before a manifest or permission change. |
| Container restarts | Read its logs and entrypoint behavior before deletion of configuration files. |

A Docker `COPY` from a missing build directory normally fails the image build.
Do not use a missing build directory as the cause of a successful but empty image.
Buyer uses screen state and query parameters.
Seller Store uses hash routes.
Before a server fallback change, examine the routing mode.

### Read the local files for the failing layer

Use the [deployment file map](../deploy-mockup/SKILL.md#deployment-file-map).
Run these read-only commands from the repository root.
Set `app` to `seller-store` or `qwipo-buyer-paytm-app` before the other commands.

```bash
app=qwipo-buyer-paytm-app
rg -n '"build"' "apps/frontend/$app/package.json"
rg -n 'COPY --from=builder|APP_VERSION|APP_COMMIT|VITE_APP_' "apps/frontend/$app/Dockerfile"
rg -n 'try_files|location|proxy_pass' "apps/frontend/$app/nginx.conf"
rg -n '@source|@import' "apps/frontend/$app/src/index.css"
rg -n 'outputs|VITE_APP_' turbo.json
```

Both retained Vite applications build to `dist/`.
The nginx document root is `/usr/share/nginx/html`.
For path-based SPA navigation, examine `try_files $uri $uri/ /index.html;` in the applicable nginx configuration.
Seller's existing hash route, such as `/#/orders/<id>`, does not require the server to resolve the order path.
Use an actual fixture ID for a browser test.

For unstyled shared components, examine the exact `@source` entries in the application README.
Buyer scans `packages/ui/src` and `packages/components/src`.
Seller scans `packages/web-ui/src`.
For missing assets only under `/builds/`, examine Vite `base`, literal root-relative URLs, and the preview proxy.

## Examine version propagation

The image build arguments supply the application version and commit.
The Dockerfile exposes `VITE_APP_VERSION` and `VITE_APP_COMMIT` during the build.
Turbo must include both variables in its build environment.
Vite then places their values in the application bundle.

Examine each link in this sequence before a correction.
A local build without those values correctly displays `local`.

Read `packages/version-badge/src/version.ts` and the application's `src/main.tsx`.
The application entry must mount `VersionBadge`.
The version module reads the Vite environment values.
For a local diagnostic build, replace `<app>` with the selected application:

```bash
VITE_APP_VERSION=9.9.9 bunx turbo run build --filter=@mockups/<app> --force
rg -l '9\.9\.9' apps/frontend/<app>/dist
```

The test value is a diagnostic stamp, not a release version.
The `--force` flag reruns the build instead of using a cached result.
The affected source is `turbo.json` plus the application Dockerfile, not a runtime environment file in `public/`.

## Examine release failures

A missing GitOps manifest is one possible cause.
Missing variables, registry access, credentials, or service permissions can also cause failure.
Do not remove a prerequisite check to bypass an error.

For a tag conflict, compare the remote tag and concurrent build runs.
For a permission error, examine the build identity's tag-creation permission.
Do not replace a published tag or force-push as a routine repair.

| Failure evidence | Specific references |
| --- | --- |
| Missing target manifest | Release template `TARGET_PATH_PREFIX` and external `bms-chart/<env>/<service>.yaml` in `Qwipo B2B/k8s` |
| Wrong build selected | `resources.pipelines.source` in the application `azure-release.yaml` and the registered Azure display name |
| Service rename without updated deployment | Build parameters, `build_vars.env`, release parameters, and the new external manifest |
| Main tag permission error | Build identity permissions for `mockups-lab`: `Contribute` and `Create tag` |
| Version tag without an image | The corresponding build run, registry image, and tag-mode registry check |

For a main tag failure, read the `push semver git tag` step in the build template.
Distinguish a verified concurrent tag conflict from a permission or network failure.
Do not treat every failed tag push as a version race.

### Compare local and container inputs

Read the root `.dockerignore` and the application's Dockerfile.
The context excludes `node_modules`, build output, environment files, and most Markdown files.
Root `README.md` and `.env.example` files are explicit exceptions.
If an application imports Markdown during its build, examine whether the necessary files reach the context.
Do not include credential files to resolve a container build failure.

For a frozen-install failure, compare `bun.lock`, root workspace globs, and all affected `package.json` files.
Use the workspace inventory in [verify](../verify/SKILL.md#diagnose-an-installation-failure).
Read the actual error before attributing it to manifest drift.

For a restarting container, examine any `entrypoint.sh`, `public/configs/`, or `NODE_ENV` branching in the imported code.
Confirm that the failing process uses that code before changing or removing it.

## Repair the problem

For generated-file repairs, use the temporary-copy procedure in [deploy-mockup](../deploy-mockup/SKILL.md).
Keep the existing service name, pipeline label, and tag prefix.
Do not use a generic forced regeneration for Buyer App.
Examine local repairs before any approved remote action.

Record the observed cause, correction, verification, and unresolved external checks.
Before you record recovery, get evidence that the failed layer operates correctly.
