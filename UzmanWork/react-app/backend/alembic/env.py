import asyncio
import os
import sys
from logging.config import fileConfig
from pathlib import Path

from alembic import context
from sqlalchemy import engine_from_config, pool
from sqlalchemy.engine import Connection
from sqlalchemy.ext.asyncio import AsyncEngine

base_path = Path(os.getcwd())
sys.path.append(str(base_path))
from backend.database.database import DatabaseConnectionConfig  # noqa: E402
from backend.database.orm import Base  # noqa: E402
from backend.envs import BackendSecrets  # noqa: E402

# this is the Alembic Config object, which provides
# access to the values within the .ini file in use.
config = context.config

# Interpret the config file for Python logging.
# This line sets up loggers basically.
if config.config_file_name is not None:
    fileConfig(config.config_file_name, disable_existing_loggers=False)

# DB models metadata from SQL Alchemy
target_metadata = Base.metadata


# other values from the config, defined by the needs of env.py,
# can be acquired:
# my_important_option = config.get_main_option("my_important_option")
# ... etc.


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode.

    Offline mode only generate the SQL commands to be executed for a given
    revision. It is useful for debugging.

    This configures the context with just a URL
    and not an Engine, though an Engine is acceptable
    here as well.  By skipping the Engine creation
    we don't even need a DBAPI to be available.

    Calls to context.execute() here emit the given string to the
    script output.

    """
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection: Connection) -> None:
    context.configure(connection=connection, target_metadata=target_metadata)

    with context.begin_transaction():
        context.run_migrations()


async def run_async_migrations(connectable: AsyncEngine) -> None:
    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)

    await connectable.dispose()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode.

    Either uses a created connection or creates a new DB session and execute the
    migrations.

    In this scenario we need to create an Engine
    and associate a connection with the context.

    """
    connectable = config.attributes.get("connection", None)

    if connectable is None:
        asyncio.run(run_async_migrations(get_async_engine()))

    elif isinstance(connectable, AsyncEngine):
        asyncio.run(run_async_migrations(connectable))
    else:
        do_run_migrations(connectable)
        context.configure(connection=connectable, target_metadata=target_metadata)


def get_async_engine() -> AsyncEngine:
    secrets = BackendSecrets()

    config.set_main_option(
        "sqlalchemy.url",
        DatabaseConnectionConfig(
            user=secrets.postgres_user,
            password=secrets.postgres_pwd,
            database=secrets.postgres_db,
            host=secrets.postgres_host,
            port=secrets.postgres_port,
        ).get_engine_url(),
    )

    return AsyncEngine(
        engine_from_config(  # type:ignore[arg-type]
            config.get_section(config.config_ini_section),
            prefix="sqlalchemy.",
            poolclass=pool.NullPool,
            future=True,
        )
    )


# NOTE(nedyalko): This needs to be top-level and not in a main function. This is
# due to how the alembic runner runs this file.
if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
