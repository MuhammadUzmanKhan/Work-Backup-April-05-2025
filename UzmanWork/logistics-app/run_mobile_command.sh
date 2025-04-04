#!/bin/bash

# This script is used to run expo commands for the mobile app
# The reason we need this is to load the correct .env file before running the command

set -o errexit

open_native() {
    # the arg should either be "ios" or "android"
    if [ "$1" != "ios" ] && [ "$1" != "android" ]; then
        echo "Invalid argument for open: $1, it must be either 'ios' or 'android'"
        exit 1
    fi

    cd ./frontend/mobile
    if [ "$1" == "ios" ]; then
        xed ./ios
    else
        studio ./android
    fi
}

# Read the param, it can only have values "staging", "release", "production" or "dev".
ENVIRONMENT="${1}"
# Check if the environment is valid
if [ "$ENVIRONMENT" != "env" ] && [ "$ENVIRONMENT" != "staging" ] && [ "$ENVIRONMENT" != "release" ] && [ "$ENVIRONMENT" != "prod" ]; then
    echo "Invalid environment: $ENVIRONMENT"
    exit 1
fi
# Use the value of ENVIRONMENT to store the name of the .env file
ENV_FILE=".${ENVIRONMENT}.env"

# load the .env file
source $ENV_FILE
# expo env variables must be prepended with EXPO_PUBLIC_ , re-export some of the variables
export EXPO_PUBLIC_DOMAIN=$DOMAIN
export EXPO_PUBLIC_BACKEND_EXPOSED_PORT=$BACKEND_EXPOSED_PORT
export EXPO_PUBLIC_AUTH0_CLIENT_ID_NATIVE=$AUTH0_CLIENT_ID_NATIVE
export EXPO_PUBLIC_AUTH0_DOMAIN=$AUTH0_DOMAIN
# this one is not in the .env file
# the frontend adds it in the build compose file
# the backend reads it from the shareed env variables
# we should refactor this
export EXPO_PUBLIC_AUTH0_AUTH_WEB_AUDIENCE="coram.ai"

# process the command
CMD=$2
if [ "$CMD" != "open" ] && [ "$CMD" != "expo" ]; then
    echo "Invalid command: $CMD, it must be either 'open' or 'expo'"
    exit 1
fi

if [ "$CMD" == "open" ]; then
    open_native $3
fi

if [ "$CMD" == "expo" ]; then
    # get every other argument passed to this script and pass it to expo
    EXPO_CMD="${@:3}"
    cd ./frontend
    yarn workspace mobile expo $EXPO_CMD
fi

exit 0
