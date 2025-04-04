#!/bin/bash

set -o errexit

#####
# This is a convenience script to run docker compose with the right env file and
# env vars
# Example usage: "./run_compose_cmd_dev.sh ps"
#####

# E.g. "up", "down", "ps", "logs -f backend" etc.
# Get all of the args
DOCKER_COMPOSE_CMD="$@"

export HOST_NAME=${HOSTNAME}
export VERSION=$(git rev-parse HEAD)
docker compose --env-file .dev.env -f docker-compose.backend.yaml -f docker-compose.frontend.yaml -f docker-compose.backend-env.yaml -f docker-compose.build-backend.yaml -f docker-compose.build-frontend.yaml -f docker-compose.dev.yaml --profile tasks ${DOCKER_COMPOSE_CMD}
