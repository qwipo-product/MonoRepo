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

Use the `Mockups Lab` folder in Azure DevOps. Register **Field Delivery Agent - Build** with [docker-build.yml](docker-build.yml) and **Field Delivery Agent - Deploy** with [azure-release.yaml](azure-release.yaml). Set `dev` as the default branch for both definitions when registering them.

The build publishes the `mockups-field-delivery-agent` browser image. The release updates the image version in the existing `Qwipo B2B/k8s` manifest at `bms-chart/<environment>/mockups-field-delivery-agent.yaml` and syncs the service. The container listens on port 80.

| Branch | Environment | Configured URL |
| --- | --- | --- |
| `dev` | dev | [Dev](https://mockups-field-delivery-agent.dev.bms.qwipo.com/) |
| `testing` | testing | [Testing](https://mockups-field-delivery-agent.test.bms.qwipo.com/) |
| `staging` | staging | [Staging](https://mockups-field-delivery-agent.staging.bms.qwipo.com/) |
| `main` | production | [Production](https://mockups-field-delivery-agent.bms.qwipo.com/) |

The dev image tag is `dev-<commit>`. Main releases use Git tags of the form `field-delivery-agent-v<version>`. Feature builds upload `dist/` to the service’s preview storage. Use the preview URL printed by the build under the dev host’s `/builds/` path.
