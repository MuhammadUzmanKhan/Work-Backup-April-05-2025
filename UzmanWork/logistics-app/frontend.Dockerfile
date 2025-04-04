ARG RUN_AS

# Get the python requirements from poetry
FROM python:3.10.13-bookworm AS python-requirements-stage
WORKDIR /app
RUN pip install poetry
COPY ./pyproject.toml ./poetry.lock /app/
RUN poetry export -f requirements.txt --output requirements.txt --without-hashes

# Install python requirements and generate openapi_spec.json
FROM python:3.10.13-bookworm AS python-dependencies
WORKDIR /app
COPY --from=python-requirements-stage /app/requirements.txt requirements.txt
RUN pip install --no-cache-dir --upgrade -r requirements.txt
COPY ./backend /app/backend
COPY ./scripts /app/scripts
RUN python scripts/generate_backend_openapi_spec.py

# React frontend
FROM node:18.19.0-bookworm-slim AS build

# Install common-utils and generate client APIs
WORKDIR /app/frontend
COPY ./frontend/yarn.lock /app/frontend/
COPY ./frontend/package.json /app/frontend/
COPY ./frontend/coram-common-utils/package.json /app/frontend/coram-common-utils/package.json
COPY ./frontend/web/package.json /app/frontend/web/package.json
RUN yarn install && yarn cache clean
COPY --from=python-dependencies /app/openapi_spec.json /app/openapi_spec.json
RUN yarn workspace coram-common-utils generate-client

# Copy base files
COPY ./frontend/tsconfig.json /app/frontend/

# Copy coram-common-utils files
COPY ./frontend/coram-common-utils/tsconfig.json /app/frontend/coram-common-utils/
COPY ./frontend/coram-common-utils/src /app/frontend/coram-common-utils/src

# Copy web files
COPY ./frontend/web/tsconfig.json /app/frontend/web/
COPY ./frontend/web/vite.config.js /app/frontend/web/
COPY ./frontend/web/index.html /app/frontend/web/
COPY ./frontend/web/src /app/frontend/web/src
COPY ./frontend/web/public /app/frontend/web/public


# Set the environment variables
ARG BACKEND_EXPOSED_PORT
ARG FRONTEND_PORT
ARG WEB_APP_URL
ARG DOMAIN
ARG AUTH0_DOMAIN
ARG AUTH0_CLIENT_ID
ARG AUTH0_CALLBACK_URL
ARG AUTH0_CLIENT_ID_NATIVE
ARG AUTH0_CALLBACK_URL_NATIVE
ARG AUTH0_AUDIENCE
ARG SENTRY_APP_DSN
ARG ENVIRONMENT_NAME
ARG VERSION
ARG BRIVO_HOST
ARG BRIVO_CLIENT_ID
ARG INTERCOM_APP_ID
ARG DEVICES_MANAGERS_EMAILS

ENV VITE_BACKEND_PORT=${BACKEND_EXPOSED_PORT}
ENV FRONTEND_PORT=${FRONTEND_PORT}
ENV VITE_WEB_APP_URL=${WEB_APP_URL}
ENV VITE_DOMAIN=${DOMAIN}
ENV VITE_AUTH0_DOMAIN=${AUTH0_DOMAIN}
ENV VITE_AUTH0_CLIENT_ID=${AUTH0_CLIENT_ID}
ENV VITE_AUTH0_CALLBACK_URL=${AUTH0_CALLBACK_URL}
ENV VITE_AUTH0_CLIENT_ID_NATIVE=${AUTH0_CLIENT_ID_NATIVE}
ENV VITE_AUTH0_CALLBACK_URL_NATIVE=${AUTH0_CALLBACK_URL_NATIVE}
ENV VITE_AUTH0_AUDIENCE=${AUTH0_AUDIENCE}
ENV VITE_SENTRY_APP_DSN=${SENTRY_APP_DSN}
ENV VITE_ENVIRONMENT_NAME=${ENVIRONMENT_NAME}
ENV VITE_VERSION=${VERSION}
ENV VITE_BRIVO_HOST=${BRIVO_HOST}
ENV VITE_BRIVO_CLIENT_ID=${BRIVO_CLIENT_ID}
ENV VITE_INTERCOM_APP_ID=${INTERCOM_APP_ID}
ENV VITE_DEVICES_MANAGERS_EMAILS=${DEVICES_MANAGERS_EMAILS}

FROM build AS build-production
RUN yarn workspace coram-common-utils build
RUN yarn workspace web build
RUN yarn global add serve
ENV PORT=${FRONTEND_PORT}
# https://github.com/moby/moby/issues/5509#issuecomment-890126570
CMD exec serve -s web/dist -l ${PORT}

FROM build AS build-development
ENV FRONTEND_PORT=${FRONTEND_PORT}
RUN yarn workspace web optimize
CMD exec yarn workspace web start --host --port ${FRONTEND_PORT}

FROM build-${RUN_AS}
EXPOSE ${FRONTEND_PORT}
