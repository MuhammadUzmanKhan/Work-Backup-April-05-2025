from __future__ import annotations

import enum
import inspect
import json
from contextlib import asynccontextmanager
from dataclasses import dataclass
from typing import TYPE_CHECKING, Any, AsyncIterator, TypeAlias, cast

import pydantic
import sqlalchemy as sa
import stamina
from alembic import command, script
from alembic.config import Config
from alembic.runtime import migration
from sqlalchemy import orm
from sqlalchemy.ext.asyncio import (
    AsyncConnection,
    AsyncEngine,
    AsyncSession,
    create_async_engine,
)

from backend.auth_context import get_current_tenant
from backend.database.orm import Base
from backend.database.session import TenantAwareAsyncSession

TENANT_ROLE_NAME = "tenant_user"

if TYPE_CHECKING:
    TSession: TypeAlias = orm.sessionmaker[AsyncSession]
else:
    # anything that doesn't raise an exception
    TSession: TypeAlias = orm.sessionmaker


class SessionType(str, enum.Enum):
    DEFAULT = "default"
    DEBUG = "debug"
    SLOW_QUERY = "slow_query"
    MODERATELY_SLOW_QUERY = "moderately_slow_query"
    AUTO_COMMIT = "auto_commit"


# How many retries between declaring we can't connect to the DB
NUM_CREATE_ENGINE_RETRIES = 30
RETRY_SLEEP_TIME = 1


def db_version_is_current(connection: AsyncConnection, cfg: Config) -> bool:
    script_dir = script.ScriptDirectory.from_config(cfg)
    context = migration.MigrationContext.configure(connection)  # type: ignore[arg-type]
    return context.get_current_revision() == script_dir.get_current_head()


def run_db_upgrade(
    connection: AsyncConnection, cfg: Config, revision: str = "head"
) -> None:
    cfg.attributes["connection"] = connection
    command.upgrade(cfg, revision)


def run_db_downgrade(
    connection: AsyncConnection, cfg: Config, revision: str = "head"
) -> None:
    cfg.attributes["connection"] = connection
    command.downgrade(cfg, revision)


@dataclass
class DatabaseConnectionConfig:
    user: str
    password: str
    database: str
    host: str
    port: int

    def get_engine_url(self) -> str:
        return (
            f"postgresql+asyncpg://{self.user}:{self.password}@{self.host}:"
            f"{self.port}/{self.database}"
        )


@dataclass
class EngineConfig:
    echo: bool = False
    pool_size: int = 10
    max_overflow: int = 10
    pool_recycle: int = 3600
    lock_timeout: str = "1.2s"
    deadlock_timeout: str = "1s"
    idle_in_transaction_session_timeout: str = "3s"
    statement_timeout: str = "6s"
    isolation_level: str | None = None
    application_name: str = "application_name_not_set"

    def get_config_dict(self) -> dict[str, Any]:
        server_settings = {
            "lock_timeout": self.lock_timeout,
            "deadlock_timeout": self.deadlock_timeout,
            "idle_in_transaction_session_timeout": (
                self.idle_in_transaction_session_timeout
            ),
            "statement_timeout": self.statement_timeout,
            "plan_cache_mode": "force_custom_plan",
            "application_name": self.application_name,
        }

        config_dict = {
            "echo": self.echo,
            "pool_size": self.pool_size,
            "max_overflow": self.max_overflow,
            "pool_recycle": self.pool_recycle,
            "connect_args": {"server_settings": server_settings},
        }
        if self.isolation_level is not None:
            config_dict["isolation_level"] = self.isolation_level

        return config_dict


def _custom_json_serializer(*args: Any, **kwargs: Any) -> str:
    """Use pydantic custom JSON serializer for SQLAlchemy in order to serialize datetime
    objects correctly.
    """
    return json.dumps(*args, default=pydantic.json.pydantic_encoder, **kwargs)


class SessionMaker:
    _engine: AsyncEngine
    _maker: TSession

    def __init__(
        self, connection_config: DatabaseConnectionConfig, engine_config: EngineConfig
    ) -> None:
        self._engine = self.create_engine(connection_config, engine_config)
        self._maker = orm.sessionmaker(
            self._engine, expire_on_commit=False, class_=AsyncSession
        )
        self._tenant_maker = orm.sessionmaker(
            self._engine, expire_on_commit=False, class_=TenantAwareAsyncSession
        )

    @staticmethod
    @stamina.retry(on=ConnectionRefusedError, attempts=30, timeout=60)
    def create_engine(
        connection_config: DatabaseConnectionConfig, engine_config: EngineConfig
    ) -> AsyncEngine:
        return create_async_engine(
            connection_config.get_engine_url(),
            **engine_config.get_config_dict(),
            json_serializer=_custom_json_serializer,
        )

    @asynccontextmanager
    async def __call__(
        self, tenant: str | None = None
    ) -> AsyncIterator[AsyncSession | TenantAwareAsyncSession]:
        if tenant:
            async with self._tenant_maker(tenant=tenant) as session:
                yield session
        else:
            async with self._maker() as session:
                yield session

    @asynccontextmanager
    async def connection(self) -> AsyncIterator[AsyncConnection]:
        async with self._engine.begin() as conn:
            yield conn


class Database:
    def __init__(
        self,
        connection_config: DatabaseConnectionConfig,
        application_name: str,
        debug_sessions_enabled: bool = False,
        disable_timeout: bool = False,
    ) -> None:
        self.disable_timeout = disable_timeout
        self.default_session_maker = SessionMaker(
            connection_config,
            EngineConfig(pool_size=150, application_name=application_name),
        )

        self.debug_session_maker = None
        if debug_sessions_enabled:
            self.debug_session_maker = SessionMaker(
                connection_config,
                EngineConfig(echo=True, application_name=application_name),
            )

        self.slow_query_session_maker = SessionMaker(
            connection_config,
            EngineConfig(statement_timeout="30min", application_name=application_name),
        )
        # TODO(@lberg): remove this once we speed up the aggregate queries
        self.moderately_slow_query_session_maker = SessionMaker(
            connection_config,
            EngineConfig(
                pool_size=25, statement_timeout="15s", application_name=application_name
            ),
        )
        # NOTE(@lberg): this is used to run stored procedures
        # when they have commit statements in them
        self.auto_commit_session_maker = SessionMaker(
            connection_config,
            EngineConfig(
                pool_size=10,
                isolation_level="AUTOCOMMIT",
                statement_timeout="30min",
                application_name=application_name,
            ),
        )

    @asynccontextmanager
    async def _session_debug(self) -> AsyncIterator[AsyncSession]:
        if self.debug_session_maker is None:
            raise RuntimeError("Debug sessions are not enabled")
        async with self.debug_session_maker() as session:
            caller_name = inspect.stack()[4].function
            conn = await session.connection(
                execution_options={"logging_token": caller_name}
            )
            try:
                yield session
            except Exception:
                await session.close()
                await conn.close()
                raise
            else:
                await session.commit()
                await conn.commit()

    @asynccontextmanager
    async def session(
        self, session_type: SessionType = SessionType.DEFAULT
    ) -> AsyncIterator[AsyncSession]:
        session_maker = self._get_session_maker(session_type)
        async with session_maker() as session:
            async with session.begin():
                yield session

    @asynccontextmanager
    async def tenant_session(
        self, tenant: str | None = None, session_type: SessionType = SessionType.DEFAULT
    ) -> AsyncIterator[TenantAwareAsyncSession]:
        if tenant is None:
            tenant = await get_current_tenant()

        session_maker = self._get_session_maker(session_type)
        async with session_maker(tenant=tenant) as session:
            tenant_session = cast(TenantAwareAsyncSession, session)
            async with tenant_session.begin():
                await Database._set_rls_settings(tenant_session)
                yield tenant_session

    async def drop_tables(self) -> None:
        async with self.slow_query_session_maker.connection() as conn:
            # Put the tables in the correct order before you drop them
            await conn.run_sync(Base.metadata.reflect)
            await conn.run_sync(Base.metadata.drop_all)

        async with self.slow_query_session_maker() as session:
            # Drop useraction type as well, because that doesn't get cleaned up
            # by the Base.metadata.drop_all
            await session.execute(sa.text("DROP TYPE IF EXISTS useraction"))

    async def prepare_tables(self) -> None:
        alembic_cfg = Config("backend/alembic.ini")
        async with self.slow_query_session_maker.connection() as conn:
            await conn.run_sync(run_db_upgrade, alembic_cfg)

    async def is_at_head_migration(self) -> bool:
        alembic_cfg = Config("backend/alembic.ini")
        async with self.slow_query_session_maker.connection() as conn:
            return bool(await conn.run_sync(db_version_is_current, alembic_cfg))

    def _get_session_maker(self, session_type: SessionType) -> SessionMaker:
        if session_type == SessionType.DEBUG:
            if not self.debug_session_maker:
                raise RuntimeError("Debug sessions are not enabled")
            return self.debug_session_maker
        elif session_type == SessionType.SLOW_QUERY or self.disable_timeout:
            return self.slow_query_session_maker
        elif session_type == SessionType.MODERATELY_SLOW_QUERY:
            return self.moderately_slow_query_session_maker
        elif session_type == SessionType.AUTO_COMMIT:
            return self.auto_commit_session_maker
        elif session_type == SessionType.DEFAULT:
            return self.default_session_maker
        else:
            raise NotImplementedError(f"Unimplemented {session_type=}")

    @staticmethod
    async def _set_rls_settings(session: TenantAwareAsyncSession) -> None:
        """Set RLS settings for the given session."""

        await session.execute(sa.text(f"SET LOCAL app.tenant='{session.tenant}'"))
        await session.execute(sa.text(f"SET LOCAL ROLE {TENANT_ROLE_NAME}"))
