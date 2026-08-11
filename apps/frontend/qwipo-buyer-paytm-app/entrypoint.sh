#!/bin/sh
#
# Container entrypoint — swaps the runtime config file based on NODE_ENV
# (defaulting to development), then hands off to the CMD (nginx in foreground).
#
# The same built image runs in dev / testing / staging / production; only the
# env var changes. Anything a mockup needs to know about its environment (the
# mock-api base URL, feature flags for a demo) goes in configs/config.*.json
# and is read at runtime with:
#
#   const cfg = await fetch('/configs/config.json').then(r => r.json());
#
# POSIX sh — this runs under busybox in the nginx:alpine stage.
set -eu

CONFIG_DIR="/usr/share/nginx/html/configs"

# Deliberate addition over the seller-portal entrypoint: the release pipeline's
# environment names (dev, testing, staging, production) do not all match the
# NODE_ENV values a chart conventionally sets (development, production). Rather
# than ship duplicate config files under both spellings, normalise here.
case "${NODE_ENV:-development}" in
  dev | development)              ENV_NAME=development ;;
  test | testing)                 ENV_NAME=testing ;;
  stage | staging)                ENV_NAME=staging ;;
  prod | production | main | master) ENV_NAME=production ;;
  *)                              ENV_NAME="${NODE_ENV}" ;;
esac

if [ ! -f "$CONFIG_DIR/config.${ENV_NAME}.json" ]; then
  echo "[qwipo-buyer-paytm-app] no config for env=${ENV_NAME}; expected ${CONFIG_DIR}/config.${ENV_NAME}.json" >&2
  exit 1
fi

cp -f "$CONFIG_DIR/config.${ENV_NAME}.json" "$CONFIG_DIR/config.json"
echo "[qwipo-buyer-paytm-app] config swapped for env=${ENV_NAME}"

exec "$@"
