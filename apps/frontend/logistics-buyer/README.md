# Logistics Buyer (LBNP)

Logistics Buyer is a browser demo for orders, customers, delivery routes, trips, issues, reports and settings. It runs on an in-browser mock backend with synthetic Hyderabad distribution data. Map tiles, icons and fonts use the same external providers as the upstream app.

## Run locally

From the Mockup Labs repository root, run `bun install --frozen-lockfile`, then `bun dev --filter=@mockups/logistics-buyer`. Open [Logistics Buyer](http://localhost:5180/). For a production build, run `bun run build --filter=@mockups/logistics-buyer`. Run `bun run --cwd apps/frontend/logistics-buyer preview` to review it on port 6180.

Use demo mobile number `9876543210` and OTP `123456`. A successful sign-in opens Orders. Use `9000000000` to see an unknown user, `9111111111` to simulate the OTP service being unavailable, and `9222222222` to exercise a rejected OTP request.

## Mock controls (🧪 button, bottom-right)

Not part of the original UI — a developer panel to exercise every state:
- **Latency** slider (loading spinners, double-click races)
- **Force API failure**: next request / all requests / only paths containing X, with status + message
- **Mock OTP** value
- **Expire token** (next call → 401 → silent refresh → retry) and **Revoke session** (refresh fails → logout)
- **Buyer type** SELF_3PL / DARKSTORE (DARKSTORE unlocks the Trips bulk seller-download bar)
- **Reset synthetic data** (data you create/edit is persisted in `localStorage` until reset)

## Things that happen on their own (simulated backend)

- **Trips in progress advance** one stop every ~45 s (Out for Delivery → At Delivery → Delivered → trip Completed)
  and push live updates to an open Trip Details page. Console: `__lbnpTrips.simulator.pause() / resume() / tick()`.
- **Delivery Planning**: seeded route plans count down in real time; one auto-confirms into a trip (~100 s after first
  visit), one fails (~50 s). "Generate Trip" creates a real trip ~12 s later via a live "tripCreated" event.
- **Issues**: after you act on an issue, the logistics provider "replies" 5–15 s later (or immediately via *Issue Status*).

Tips: Create Delivery Route only produces *Overflow* routes with the default 3PL mode. Switch Settings → Delivery →
Logistics Selection to *Self* or *Self + 3PL* (and Route Engine to *Cluster Beat Optimizer*) to see Planned routes and
the unassigned-beats dialog.

## Source

Imported from [qwipo-product/LBNP main at daa557d](https://github.com/qwipo-product/LBNP/tree/daa557de8e18f834c74798216ac7a612b401bc1b). The application code is in `src/`, the mock services are in `src/mock/`, and the browser configuration is in `public/assets/configs/config.json`. Refer to the [upstream technical guide and screen specifications](https://github.com/qwipo-product/LBNP/tree/daa557de8e18f834c74798216ac7a612b401bc1b/docs).

## Deployment

Register **Logistics Buyer - Build** with [docker-build.yml](docker-build.yml) and **Logistics Buyer - Deploy** with [azure-release.yaml](azure-release.yaml) in the Azure DevOps `Mockups Lab` folder. Both definitions initially use `dev` as their default branch. The build publishes the `mockups-logistics-buyer` image. The release updates its version in the existing `Qwipo B2B/k8s` manifest at `bms-chart/<environment>/mockups-logistics-buyer.yaml` and syncs ArgoCD.

| Branch | Target |
| --- | --- |
| `dev` | [Dev](https://mockups-logistics-buyer.dev.bms.qwipo.com/) |
| `testing` | [Testing](https://mockups-logistics-buyer.test.bms.qwipo.com/) |
| `staging` | [Staging](https://mockups-logistics-buyer.staging.bms.qwipo.com/) |
| `main` | [Production](https://mockups-logistics-buyer.bms.qwipo.com/) |

Dev images use `dev-<commit>`. Main releases use the Git tag prefix `logistics-buyer-v`. Feature branches publish static previews under the dev host’s `/builds/` path. Use the URL printed by the build. Previews navigate with hash routes. The main site uses normal browser paths such as `/orders` and `/trips`.
