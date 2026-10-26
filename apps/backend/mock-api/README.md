# Mock API

This Bun and Hono service exposes the fixtures in `@mockups/mock-data` over HTTP.
It is an optional prototype service. Buyer and Seller Store do not require it.

## Start

From the repository root, install the locked dependencies and start the service:

```bash
bun install --frozen-lockfile
bun dev --filter=@mockups/mock-api
```

The development port is `8787`.
For a direct start with another port, use `PORT=8788 bun run --cwd apps/backend/mock-api start`.

## Routes

| Route | Result |
| --- | --- |
| `/health` | Service status and uptime |
| `/` | Available collection and singleton routes |
| `/api/products?limit=5&offset=0` | Product page with a total count |
| `/api/products?q=maggi` | Case-insensitive text search |
| `/api/products/<id>` | One product, or a 404 response |
| `/api/singletons/profile` | Demonstration profile |
| `/api/products?delay=800` | Response after a simulated delay |
| `/api/products?fail=503` | Simulated error response |

Delay is limited to 10 seconds.
POST, PUT, and PATCH requests to `/api/<collection>/<path>` echo the submitted JSON.
They do not change the fixtures or persist records.

## Source files

- `src/index.ts`: routes, middleware, and Bun server configuration.
- `src/collections.ts`: collection and singleton exports.
- `../../../packages/mock-data/src/index.ts`: shared fixture entry point.
- `Dockerfile`: service container build and health check.

Run `bun run check --filter=@mockups/mock-api... --ui=stream` for the service and its workspace dependencies.
