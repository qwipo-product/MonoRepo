# mockups-lab

Mockups Lab is a shared workspace for Qwipo product prototypes and interface reviews.
Use the applications to review user flows and designs before production implementation.
Buyer/Paytm covers mobile buyer and salesperson flows.
Seller Store covers distributor and administrator flows.
RIRN Console and RIRN Retailer cover company and retailer identity flows.
Qwipo Analytics provides dashboard and report prototypes.
Mobile and desktop Storybook catalogs document the shared interface components.
The applications use demonstration data. An optional Mock API serves shared fixtures over HTTP.

Keep the demonstrated behavior correct.
Record simulated results and incomplete integrations.

## Start

1. Open a terminal in the repository root.
2. Read `packageManager` in `package.json`.
3. Examine the installed Bun version with `bun --version`.
4. Use the specified version, currently `1.3.13`.
5. Install the locked dependencies.

```bash
bun install --frozen-lockfile
```

Nix and direnv are optional tools for the development environment.
If you use them, examine `.envrc` and `flake.nix` before `direnv allow`.
After activation, examine the actual Bun version.
After a Nix update, compare the installed Bun version with `package.json`.

Use one of these commands:

| Command | Result |
| --- | --- |
| `bun run ls` | List application names, descriptions, and configured ports. |
| `bun dev` | Start all application development servers. |
| `bun dev --filter=@mockups/qwipo-buyer-paytm-app` | Start Buyer/Paytm. |
| `bun dev --filter=@mockups/seller-store` | Start Seller Store. |
| `bun dev --filter=@mockups/field-agent` | Start Field Agent. |
| `bun dev --filter=@mockups/logistics-buyer` | Start Logistics Buyer. |
| `bun dev --filter=@mockups/sales-admin` | Start Sales Admin. |
| `bun run check --continue --ui=stream` | Run lint, type checks, and builds. |
| `bun run build` | Build all applications and component catalogs. |

Examine the actual URL in the server output.
Vite can select another port when the configured port is occupied.
The development configuration also exposes a Network URL.
Use that URL only on a permitted network.

## Applications

| Application | Development URL | Preview port | Documentation |
| --- | --- | --- | --- |
| Buyer/Paytm | `http://localhost:5175` | 6175 | [Buyer README](apps/frontend/qwipo-buyer-paytm-app/README.md) |
| Seller Store | `http://localhost:5174` | 6174 | [Seller README](apps/frontend/seller-store/README.md) |
| Field Agent | `http://localhost:5179` | 6179 | [Field Agent README](apps/frontend/field-agent/README.md) |
| Logistics Buyer (LBNP) | `http://localhost:5180` | 6180 | [Logistics Buyer README](apps/frontend/logistics-buyer/README.md) |
| Sales Admin | `http://localhost:5181` | 6181 | [Sales Admin README](apps/frontend/sales-admin/README.md) |
| RIRN Console | `http://localhost:5173` | 6173 | [RIRN README](apps/frontend/rirn/README.md) |
| RIRN Retailer | `http://localhost:5176` | 6176 | [Retailer README](apps/frontend/rirn-retailer/README.md) |
| Qwipo Analytics | `http://localhost:5177` | 6177 | [Analytics README](apps/frontend/qwipo-analytics/README.md) |
| Mobile Storybook | `http://localhost:6006` | — | [Mobile catalog README](apps/frontend/storybook/README.md) |
| Desktop Storybook | `http://localhost:6007` | — | [Desktop catalog README](apps/frontend/storybook-web/README.md) |
| Mock API | `http://localhost:8787` | — | [API README](apps/backend/mock-api/README.md) |

Before a preview command, build the application.
The Vite applications have preview commands.
The Storybook catalogs build to `storybook-static/`.
Mock API runs as a Bun service. It has no Vite preview command.
A preview server is a local review tool, not the hosted production server.

Start one workspace with `bun dev --filter=@mockups/<name>`.
Buyer and Seller Store do not require Mock API.

## Repository layout

| Location | Purpose |
| --- | --- |
| `apps/frontend/` | Application workspaces |
| `apps/backend/` | Mock API workspace |
| `packages/design-tokens/` | Mobile token values and CSS theme |
| `packages/ui/` | Mobile UI primitives |
| `packages/components/` | Buyer product and analytics chart components |
| `packages/web-tokens/` | Desktop token values and CSS theme |
| `packages/web-ui/` | Desktop components and design reference |
| `packages/types/` | Shared domain types |
| `packages/mock-data/` | Shared demonstration fixtures |
| `packages/i18n/` | Translation provider and dictionaries |
| `packages/version-badge/` | Build version display |
| `packages/tsconfig/` | TypeScript configuration |
| `packages/eslint-config/` | Lint configuration |
| `scripts/` | Application and deployment generators |
| `azure-cicd/templates/` | Shared pipeline templates |
| `.claude/skills/` | Task procedures |

Use these references before implementation:

| Task | Detailed reference |
| --- | --- |
| Find shared configuration and public package exports | [Repository source map](CLAUDE.md#applications-and-packages) |
| Register or change a Buyer screen | [Buyer source map](apps/frontend/qwipo-buyer-paytm-app/README.md#source-map) |
| Match a Buyer visual reference | [Buyer build notes](apps/frontend/qwipo-buyer-paytm-app/BUILD-NOTES.md) |
| Change Seller routes, personas, or data | [Seller source map](apps/frontend/seller-store/README.md#source-layout) |
| Select a desktop component or page pattern | [Desktop design reference](packages/web-ui/DESIGN-SYSTEM.md) |
| Find mobile product components | [Buyer component source map](packages/components/README.md) |
| Find pipeline files and diagnose deployment behavior | [Deployment procedure](.claude/skills/deploy-mockup/SKILL.md#deployment-file-map) |

## Work rules

Read [CLAUDE.md](CLAUDE.md) for the complete repository instructions.
Agents also use [AGENTS.md](AGENTS.md) as an entry point.

Without the user's explicit commit command, do not commit changes.
Without the user's explicit push command, do not push changes.
Permission to edit files does not give permission to commit or push them.
Do not merge, deploy, or delete remote branches without authorization.

Use an applicable existing task branch.
For a new branch, use the name from the user or `feature/<app>-<change>`.
The `dev` branch conflicts with branch names that start with `dev/`.
Use [start-work](.claude/skills/start-work/SKILL.md) for the branch procedure.

## Design kits

| Purpose | Mobile | Desktop |
| --- | --- | --- |
| Application | Buyer/Paytm, RIRN Retailer | Seller Store, RIRN Console |
| Primitives | `@mockups/ui` | `@mockups/web-ui` |
| CSS tokens | `@mockups/design-tokens/theme.css` | `@mockups/web-tokens/theme.css` |
| Review location | Mobile Storybook and Buyer sidebar | Desktop Storybook and Seller Design System persona |

Qwipo Analytics uses the mobile kit in a desktop layout.
Keep that existing exception unless the user requests a design-kit migration.

Import one CSS token layer in each application.
Keep the Tailwind `@source` entries for shared component code.
Use semantic classes for new screen code.
Keep external brand colors in a named application block.

The desktop TypeScript module re-exports some mobile token values.
The desktop CSS still contains separate literal values.
When a shared color changes, update all applicable representations.
Examine intentional differences before synchronization.

Shared component packages export TypeScript source directly.
The consuming application compiles that source.
If an existing primitive supports the requested behavior, use or extend that primitive.
A second application is not necessary for an extension to an existing primitive.

## Dependencies and checks

Use the root catalog for new dependency versions.
Declare a direct dependency in each workspace that imports it.
Use [add-dependency](.claude/skills/add-dependency/SKILL.md) for changes.

Keep `bun.lock` and `flake.lock` under version control.
Do not delete a lockfile merely to suppress an installation error.
A lockfile-only update can be valid. Examine its cause and resolved versions.

The current TypeScript configuration is permissive.
Do not disable shared checks merely because they record an error.
If an exception is necessary, record its reason and limits.
Add applicable regression checks for important changed behavior.

Use [verify](.claude/skills/verify/SKILL.md) before completion.
A successful build does not prove type safety or correct behavior.
The current Docker build omits lint and type checks.
For automatic enforcement in Azure, add those checks to a validation job within an authorized task.

## Deployment

Use [deploy-mockup](.claude/skills/deploy-mockup/SKILL.md) for preparation, identities, prerequisites, versions, and recovery.
Use [deploy-doctor](.claude/skills/deploy-doctor/SKILL.md) for diagnosis.

| Application | Service | Build pipeline | Release pipeline |
| --- | --- | --- | --- |
| Buyer/Paytm | `mockups-buyer-app` | Buyer App - Build | Buyer App - Deploy |
| Seller Store | `mockups-seller-store` | Seller Store - Build | Seller Store - Deploy |
| Field Agent | `mockups-field-delivery-agent` | Field Delivery Agent - Build | Field Delivery Agent - Deploy |
| Logistics Buyer (LBNP) | `mockups-logistics-buyer` | Logistics Buyer - Build | Logistics Buyer - Deploy |
| Sales Admin | `mockups-sales-admin` | Sales Admin - Build | Sales Admin - Deploy |
| RIRN Console | `mockups-rirn-company` | RIRN Company - Build | RIRN Company - Deploy |
| RIRN Retailer | `mockups-rirn-retailer` | RIRN Retailer - Build | RIRN Retailer - Deploy |
| Qwipo Analytics | `mockups-analytics` | Analytics - Build | Analytics - Deploy |
| Mobile Storybook | `mockups-storybook` | Storybook - Build | Storybook - Deploy |
| Desktop Storybook | `mockups-storybook-web` | Storybook Web - Build | Storybook Web - Deploy |

The dev host has the form `https://<service>.dev.bms.qwipo.com`.
These names show the repository configuration. They do not prove live service availability.

| Branch | Current automatic behavior |
| --- | --- |
| `feature/*` | Upload a static preview when the path filters match. |
| `dev` | Build an image and trigger the dev release pipeline. |
| `testing` | Build an image and trigger the testing release pipeline. |
| `staging` | Build an image and trigger the staging release pipeline. |
| `main` | Create a release version and trigger the production release pipeline. |
| Other names, including `dev-cleanup` | No automatic trigger in the current filters. |

The files also contain the unusable `dev/*` pattern while `dev` exists.
Examine live Azure policies and environment approvals before an approved release.
The repository cannot prove that a production approval control exists.
Do not do a production release without that verified control.

Preview URLs use a branch slug and commit identifier below `/builds/`.
The current retention policy keeps five builds per branch, plus `latest/`.
Use [share-mockup](.claude/skills/share-mockup/SKILL.md) for link preparation and verification.

## Create or import an application

Without a user instruction to create another application, do not create one.
Use [new-mockup](.claude/skills/new-mockup/SKILL.md) or [import-mockup](.claude/skills/import-mockup/SKILL.md).
Keep local work separate from publication actions.

## Engineering handoff

Use [handoff](.claude/skills/handoff/SKILL.md) for an approved product flow.
Separate confirmed requirements from fixtures, proposed APIs, and unresolved decisions.
Do not use a prototype's simulated response as an established production contract.
