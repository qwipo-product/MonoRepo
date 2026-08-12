# syntax=docker/dockerfile:1.7
#
# qwipo-buyer-paytm-app — Vite/React SPA, served by nginx.
#
# Build context: WORKSPACE ROOT. The base-docker-template runs
# `docker buildx build --file $DOCKERFILE_PATH ... .` from the repo root, so
# the builder sees bun.lock, every member package.json, and the packages/*
# sources this app links via `workspace:*`. Locally:
#
#   docker build -f apps/frontend/qwipo-buyer-paytm-app/Dockerfile \
#     -t mockups-qwipo-buyer-paytm-app:local .
#
# Two stages:
#   1. builder — bun-alpine, frozen install, `turbo run build --filter=<app>`.
#   2. final   — nginx-alpine serving dist/, with entrypoint.sh swapping the
#                runtime config file based on NODE_ENV. One image, every env.

ARG BUN_VERSION=1.3.13
ARG NGINX_VERSION=1.29.0-alpine3.22
ARG APP_PATH=apps/frontend/qwipo-buyer-paytm-app
ARG APP_NAME=@mockups/qwipo-buyer-paytm-app

# ─────────────────────────────────────────────────────────────────────────────
# Stage 1 — builder
# ─────────────────────────────────────────────────────────────────────────────
FROM oven/bun:${BUN_VERSION}-alpine AS builder

WORKDIR /workspace

# The root .dockerignore strips node_modules / dist / .turbo / .env* / .direnv.
COPY . .

# Frozen: the build fails rather than silently resolving a different tree.
RUN bun install --frozen-lockfile

# Turbo builds this app's workspace dependencies first, then the app.
ARG APP_NAME
RUN bunx turbo run build --filter=${APP_NAME}

# ─────────────────────────────────────────────────────────────────────────────
# Stage 2 — final
# ─────────────────────────────────────────────────────────────────────────────
FROM nginx:${NGINX_VERSION} AS final

ARG APP_PATH

# Drop nginx's stock site before adding ours, or both claim :80 and nginx
# refuses to boot with "duplicate default server for 0.0.0.0:80".
RUN rm -f /etc/nginx/conf.d/default.conf
COPY ${APP_PATH}/nginx.conf /etc/nginx/conf.d/mockup.conf

# The built SPA: index.html + hashed assets + everything from public/
# (brand logos, category images, banners, configs/).
COPY --from=builder /workspace/${APP_PATH}/dist/ /usr/share/nginx/html/

COPY ${APP_PATH}/entrypoint.sh /usr/local/bin/mockup-entrypoint.sh
RUN chmod +x /usr/local/bin/mockup-entrypoint.sh

EXPOSE 80

# Environment is never baked in — entrypoint.sh copies the right
# configs/config.<NODE_ENV>.json over configs/config.json at boot, then execs
# the CMD. Same image promotes from dev to production unchanged.
ENTRYPOINT ["/usr/local/bin/mockup-entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]
