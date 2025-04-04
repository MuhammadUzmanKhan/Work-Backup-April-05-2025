from datetime import timedelta
from typing import Any

import stamina
from celery.signals import worker_ready
from sqlalchemy.exc import DBAPIError, DisconnectionError

from backend.dependencies import (
    get_backend_database,
    get_backend_envs,
    initialize_dependencies,
    populate_database_tables,
)
from backend.task_worker import background_task, periodic_task  # noqa

# Register tasks from background and periodic task modules
from backend.task_worker.celery_instance import celery_app, logger, setup  # noqa
from backend.task_worker.utils import async_task


@stamina.retry(
    on=(DBAPIError, DisconnectionError),
    timeout=timedelta(seconds=60),
    wait_initial=timedelta(seconds=3),
    wait_max=timedelta(seconds=6),
)
async def initialize_database() -> None:
    database = get_backend_database()
    if not await database.is_at_head_migration():
        logger.info("Running migrations")
        await database.prepare_tables()
    await populate_database_tables(database, get_backend_envs().enable_all_features)


@worker_ready.connect()
@async_task()
async def initialize(**kwargs: Any) -> None:
    await initialize_dependencies()
    await initialize_database()
