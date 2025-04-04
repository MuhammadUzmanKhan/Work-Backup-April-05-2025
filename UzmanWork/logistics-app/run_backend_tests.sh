#!/bin/bash

set -o errexit

#####
# This is a convenience script to run docker compose for testing
#####
docker build -t app_test_image -f testing.Dockerfile .
docker run -v "$(pwd)/backend":/app/backend app_test_image "$@"
