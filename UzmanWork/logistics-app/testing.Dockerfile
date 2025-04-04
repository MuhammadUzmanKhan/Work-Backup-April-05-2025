FROM python:3.10.13-bookworm AS build

WORKDIR /app

# install postgres-13
RUN apt update && \
    apt install -y lsb-release && \
    sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list' && \
    curl -fsSL https://www.postgresql.org/media/keys/ACCC4CF8.asc | gpg --dearmor -o /etc/apt/trusted.gpg.d/postgresql.gpg && \
    apt update && \
    apt install -y postgresql-13 && \
    apt clean && \
    rm -rf /var/lib/apt/lists/*

# Setup user (we can't use root for postgres)
RUN useradd -m ubuntu -p ubuntu
USER ubuntu

# install python dependencies with poetry
RUN curl -sSL https://install.python-poetry.org | python3 -
COPY ./pyproject.toml ./poetry.lock ./
ENV PATH="/home/ubuntu/.local/bin:${PATH}"
RUN poetry install

# Run tests and exit
ENTRYPOINT ["poetry", "run", "python", "-m", "pytest", "-n=4"]
