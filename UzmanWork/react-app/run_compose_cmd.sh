#!/bin/bash

set -o errexit

# exit with error if GIT_SHA is not set in env
if [ -z "${GIT_SHA}" ]; then
    echo "GIT_SHA is not set"
    exit 1
fi

ENV_FILE=${1}
DOCKER_COMPOSE_CMD="${@:2}"
export VERSION=${GIT_SHA}

docker compose -f docker-compose.backend.yaml -f docker-compose.frontend.yaml -f docker-compose.pull.yaml -f docker-compose.backend-env.yaml --env-file "${ENV_FILE}" ${DOCKER_COMPOSE_CMD}
