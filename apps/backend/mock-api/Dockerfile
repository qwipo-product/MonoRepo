# syntax=docker/dockerfile:1.7
#
# mock-api — Bun + Hono, single process.
#
# Build context: WORKSPACE ROOT (same as every Dockerfile here — the
# base-docker-template builds with `.` as the context from the repo root).
#
#   docker build -f apps/backend/mock-api/Dockerfile -t mockups-api:local .
#
# `bun build --target=bun` bundles hono and @mockups/mock-data into one file,
# so the final stage carries no node_modules at all — a few MB on top of the
# Bun base image instead of a full workspace install.

ARG BUN_VERSION=1.3.13
ARG APP_PATH=apps/backend/mock-api
ARG APP_NAME=@mockups/mock-api

# ─────────────────────────────────────────────────────────────────────────────
# Stage 1 — builder
# ─────────────────────────────────────────────────────────────────────────────
FROM oven/bun:${BUN_VERSION}-alpine AS builder

WORKDIR /workspace

COPY . .

RUN bun install --frozen-lockfile

ARG APP_NAME
RUN bunx turbo run build --filter=${APP_NAME}

# ─────────────────────────────────────────────────────────────────────────────
# Stage 2 — final
# ─────────────────────────────────────────────────────────────────────────────
FROM oven/bun:${BUN_VERSION}-alpine AS final

ARG APP_PATH

WORKDIR /app

COPY --from=builder /workspace/${APP_PATH}/dist/index.js ./index.js

ENV NODE_ENV=production
ENV PORT=8787

EXPOSE 8787

# The Bun base image ships a non-root `bun` user. Nothing here writes to disk.
USER bun

# /health returns {ok, uptime} — wire this to the chart's readiness probe too.
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD bun -e "fetch('http://127.0.0.1:'+(process.env.PORT||8787)+'/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["bun", "index.js"]
