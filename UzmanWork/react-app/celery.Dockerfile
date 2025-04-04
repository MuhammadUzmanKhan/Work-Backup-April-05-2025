FROM python:3.10.13-bookworm AS poetry-setup
WORKDIR /app
ARG RUN_AS
ENV RUN_AS=${RUN_AS}
RUN pip install poetry
COPY ./pyproject.toml ./poetry.lock ./

FROM poetry-setup as requirements-stage
RUN poetry export -f requirements.txt --output requirements.txt --without-hashes --with dev

FROM python:3.10.13-bookworm AS build
RUN apt update && apt install -y ffmpeg
WORKDIR /app
COPY --from=requirements-stage /app/requirements.txt requirements.txt
RUN pip install --no-cache-dir --upgrade -r requirements.txt

COPY ./backend /app/backend

CMD ["celery", "-A", "backend.task_worker.worker.celery_app", "--config=backend.task_worker.celeryconfig", "worker", "--pool=gevent", "--loglevel=info"]
