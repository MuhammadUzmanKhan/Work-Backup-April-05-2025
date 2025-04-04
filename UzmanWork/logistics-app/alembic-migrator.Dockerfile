FROM python:3.10.13-bookworm AS poetry-setup
WORKDIR /app
RUN pip install poetry
COPY ./pyproject.toml ./poetry.lock ./
RUN poetry export -f requirements.txt --output requirements.txt --without-hashes

FROM python:3.10.13-bookworm AS build
WORKDIR /app
COPY --from=poetry-setup /app/requirements.txt requirements.txt
RUN pip install --no-cache-dir --upgrade -r requirements.txt

COPY ./backend /app/backend

ENV PYTHONPATH /app

ENTRYPOINT ["python", "/app/backend/alembic_migrator/alembic_migrator.py"]
