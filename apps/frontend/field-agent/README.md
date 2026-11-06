# Field Agent

Field Agent demonstrates delivery stops, returns and payments for delivery executives, drivers, operations executives and managers. The browser demo and Android application share the screen definitions and synthetic backend.

## Run from the repository root

Use Bun 1.3.13 and Node 22. The Field Agent workspace installs its own locked Angular 19 and NativeScript dependencies during setup.

| Command | Result |
| --- | --- |
| `bun dev --filter=@mockups/field-agent` | Start the browser demo at http://localhost:5179. |
| `bun run build --filter=@mockups/field-agent` | Build the browser site into `apps/frontend/field-agent/dist/`. |
| `bun run --cwd apps/frontend/field-agent preview` | Serve the last browser build at http://localhost:6179. |
| `bun run --cwd apps/frontend/field-agent android` | Start the native app on a configured Android emulator or device. Install the NativeScript CLI and Android SDK first. |

Use demo number `9876543210` and any six-digit OTP to open trip ALWAL-1. See [application details](app/README.md) for the other five personas, the mock backend, and the device features simulated in the browser.

## Source and deployment

The initial import is from [Field-Agent-App main at 140b53e](https://github.com/qwipo-product/Field-Agent-App/tree/140b53eec8aa904fc564aff45a20f0bc67674312). Edit shared screens, services and fixtures in `app/src/`. Edit browser adapters in `app/web/`. Android resources are in `app/App_Resources/`.

In Azure DevOps, **Field Agent - Build** uses [docker-build.yml](docker-build.yml). **Field Agent - Deploy** uses [azure-release.yaml](azure-release.yaml). Both use the shared Mockup Labs templates. The browser image serves HTTP on port 80. The dev ingress is [mockups-field-agent.dev.bms.qwipo.com](https://mockups-field-agent.dev.bms.qwipo.com/). Its values file belongs in the separate `Qwipo B2B/k8s` repository at `bms-chart/dev/mockups-field-agent.yaml`.

The dev branch builds an image tagged `dev-<commit>`. Feature previews use the same Docker builder stage and upload its `dist/` directory to the preview store. On the dev host, previews are served under `/builds/`. Additional environment deployments require a corresponding GitOps values file.
