# syntax=docker/dockerfile:1.7
FROM oven/bun:1.3.13 AS bun
FROM node:22-bookworm-slim AS builder
COPY --from=bun /usr/local/bin/bun /usr/local/bin/bun
WORKDIR /workspace/apps/frontend/sales-admin/app
COPY apps/frontend/sales-admin/app/package.json apps/frontend/sales-admin/app/bun.lock ./
RUN bun install --frozen-lockfile
COPY apps/frontend/sales-admin/app/ ./
COPY packages/version-badge/ /workspace/node_modules/@mockups/version-badge/
WORKDIR /workspace/apps/frontend/sales-admin
COPY apps/frontend/sales-admin/package.json apps/frontend/sales-admin/prepare-index.ts ./
ARG APP_VERSION=local
ARG APP_COMMIT=
ENV VITE_APP_VERSION=${APP_VERSION} VITE_APP_COMMIT=${APP_COMMIT}
RUN bun run build

FROM nginx:1.29.0-alpine3.22
ARG APP_VERSION=local
ARG APP_COMMIT=
LABEL org.opencontainers.image.version="${APP_VERSION}" org.opencontainers.image.revision="${APP_COMMIT}"
COPY apps/frontend/sales-admin/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /workspace/apps/frontend/sales-admin/dist/ /usr/share/nginx/html/
EXPOSE 80
