#!/bin/bash

set -o errexit

# This script copies the frontend dst folder from the container to the host.
# This way, we can deploy that to the native app using Capacitor.

DST_FOLDER="./frontend/web/dist"

# Check if the folder already exists
rm -rf $DST_FOLDER
mkdir -p $DST_FOLDER

# Read the param, it can only have values "staging", "release" or "production".
ENVIRONMENT="${1:-staging}"
# Check if the environment is valid
if [ "$ENVIRONMENT" != "staging" ] && [ "$ENVIRONMENT" != "release" ] && [ "$ENVIRONMENT" != "prod" ]; then
  echo "Invalid environment: $ENVIRONMENT"
  exit 1
fi
# Use the value of ENVIRONMENT to store the name of the .env file
ENV_FILE=".${ENVIRONMENT}.env"

# Start the container using Compose
export HOST_NAME=${HOSTNAME}
export VERSION=$(git rev-parse HEAD)

docker compose --env-file $ENV_FILE -f docker-compose.frontend.yaml -f docker-compose.build-frontend.yaml -f docker-compose.native.yaml up frontend --build --renew-anon-volumes

# Check if DST_FOLDER exists
if [ ! -d "$DST_FOLDER" ]; then
  echo "Error: $DST_FOLDER does not exist. This means the frontend build failed."
  exit 1
fi

# Run capacitor
cd ./frontend
NATIVE_APP_BUILD=1 yarn workspace web cap sync

# Tell the user all went well
echo "Done! You can now run capacitor CLI from the frontend folder to open the native app."
