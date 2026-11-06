# Sales Admin

Sales Admin is a desktop demo for managing salespeople, attendance, area assignments, daily tasks, customer interactions and performance. It preserves the upstream Angular 16, Angular Material, Egret and Tailwind 3 UI. The service uses an in-browser database with synthetic records. Click **Sign in** on the demo sign-in page to open Home. No account or OTP is required.

## Run locally

From the Mockup Labs root, run `bun install --frozen-lockfile` and `bun dev --filter=@mockups/sales-admin`. Open [Sales Admin](http://localhost:5181/home). Turbo installs the app's isolated dependencies before it starts Angular. Use Bun 1.3.13 and Node 22 to match the container.

Run `bun run build --filter=@mockups/sales-admin` to build the service, then `bun run --cwd apps/frontend/sales-admin preview` to serve the build on port 6181. The Angular compiler, TypeScript 5.0 and Tailwind 3 use their own dependency lock in `app/`. This keeps the original UI compatible with the newer tools used by other Mockup Labs apps.

## Demo and tests

- Use **Sales Person** for the roster, area and salesperson mapping, task generation and task rescheduling. Open **Task Report**, **Attendance**, **Interactions** or **Performance** to review the sample records and exports.
- Edits persist in this browser. Call `salesAdminMock.reset()` in the browser console to restore the seed. The runtime configuration is `app/src/assets/configs/config.json` and its backend mode is `mock`. Fonts, icons and Bootstrap styles load from the upstream public CDNs.
- To run the upstream Chromium suite from this folder, run `bun run setup`, `(cd app && bun run playwright install chromium)`, then `bun run e2e`. Set `E2E_BASE_URL` to test a running local server. Run the full suite only against disposable demo data. The known-bug spec records an upstream alert accessibility issue.
- Find the Angular routes in `app/src/app/app.routing.ts`, the sample backend in `app/src/app/mock/`, and the browser tests in `app/e2e/`. The [functional fixes](app/docs/FIXES.md) and [rescheduling notes](app/docs/ENHANCEMENTS.md) describe behavior that differs from the original production UI. [Upstream source at d0e99b0](https://github.com/qwipo-product/Sales-Admin/tree/d0e99b067f0028b7f9422d81893bc62342b92cdd).

## Deployment

**Sales Admin - Build** uses [docker-build.yml](docker-build.yml). **Sales Admin - Deploy** uses [azure-release.yaml](azure-release.yaml). Both Azure definitions are in the `Mockups Lab` folder. The service name is `mockups-sales-admin` and the tag prefix is `sales-admin`. The release updates the image version in the existing environment manifest and syncs Argo CD.

| Branch | Target |
| --- | --- |
| `dev` | [Dev](https://mockups-sales-admin.dev.bms.qwipo.com/home) |
| `testing` | [Testing](https://mockups-sales-admin.test.bms.qwipo.com/home) |
| `staging` | [Staging](https://mockups-sales-admin.staging.bms.qwipo.com/home) |
| `main` | [Production](https://mockups-sales-admin.bms.qwipo.com/home) |

Feature builds publish a static preview under `/builds/<branch>/<sha>/` on the dev host. Use the link in the build output. The preview uses hash routes so a refresh keeps the browser on the same build. The deployed service accepts direct routes such as `/home` and `/reschedule-tasks`.
