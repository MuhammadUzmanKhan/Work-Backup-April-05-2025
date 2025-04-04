#!/bin/bash

set -o errexit

#####
# This is a convenience script to update all deps locally and run docker compose
#####

MODE_ALL="all"
MODE_FRONTEND="frontend-only"
MODE_NO_TASKS="no-tasks"

MODE="${1:-${MODE_ALL}}"

# update backend
poetry install

# generate openapi file for APIs
poetry run python scripts/generate_backend_openapi_spec.py

# generate client for frontend
(
  cd frontend
  yarn install
  yarn workspace coram-common-utils generate-client
)

export HOST_NAME=${HOSTNAME}
export VERSION=$(git rev-parse HEAD)

COMPOSE_FILES_ARGS="-f docker-compose.backend.yaml -f docker-compose.frontend.yaml -f docker-compose.backend-env.yaml -f docker-compose.build-backend.yaml -f docker-compose.build-frontend.yaml -f docker-compose.dev.yaml"

# run with compose
if [ "$MODE" = "${MODE_ALL}" ]; then
  docker compose --env-file .dev.env ${COMPOSE_FILES_ARGS} --profile tasks up --build --renew-anon-volumes
elif [ "$MODE" = "${MODE_FRONTEND}" ]; then
  docker compose --env-file .frontend-only.env ${COMPOSE_FILES_ARGS} up frontend --build --renew-anon-volumes
elif [ "$MODE" = "${MODE_NO_TASKS}" ]; then
  docker compose --env-file .dev.env ${COMPOSE_FILES_ARGS} up --build --renew-anon-volumes
else
  echo "Mode ${MODE} is invalid"
  exit 1
fi
