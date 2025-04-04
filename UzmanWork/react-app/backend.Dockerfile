ARG RUN_AS

FROM python:3.10.13-bookworm AS poetry-setup
WORKDIR /app
ARG RUN_AS
ENV RUN_AS=${RUN_AS}
RUN pip install poetry
COPY ./pyproject.toml ./poetry.lock ./

FROM poetry-setup as requirements-stage-development
RUN poetry export -f requirements.txt --output requirements.txt --without-hashes --with dev

FROM poetry-setup as requirements-stage-production
RUN poetry export -f requirements.txt --output requirements.txt --without-hashes

FROM requirements-stage-${RUN_AS} as requirements-stage
FROM python:3.10.13-bookworm AS build
RUN apt update && apt install -y ffmpeg
WORKDIR /app
COPY --from=requirements-stage /app/requirements.txt requirements.txt
RUN pip install --no-cache-dir --upgrade -r requirements.txt

COPY ./backend /app/backend

ARG BACKEND_PORT
ARG FRONTEND_EXPOSED_PORT

ENV BACKEND_PORT=${BACKEND_PORT}
ENV FRONTEND_EXPOSED_PORT=${FRONTEND_EXPOSED_PORT}
# NOTE: this is always set to true here. The reason is that backend always need this
# However, this protects some code which runs in the main file which should not run
# when we generate specs or in tests
ENV INITIALISE_MIDDLEWARE=true

FROM build AS build-production
CMD exec python -m uvicorn ${BACKEND_APP_NAME} --port ${BACKEND_PORT} --host 0.0.0.0 --forwarded-allow-ips='*' --proxy-headers

FROM build AS build-development
CMD exec python -m uvicorn ${BACKEND_APP_NAME} --reload --port ${BACKEND_PORT} --host 0.0.0.0 --forwarded-allow-ips='*' --proxy-headers

FROM build-${RUN_AS}

EXPOSE ${BACKEND_PORT}
