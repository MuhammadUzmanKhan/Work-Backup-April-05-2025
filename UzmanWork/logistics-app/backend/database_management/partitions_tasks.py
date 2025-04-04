import logging

import stamina
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError

from backend import logging_config
from backend.database import database
from backend.database_management.errors import (
    DefaultPartitionMoveError,
    PartitionMaintenanceError,
)
from backend.database_management.models import PartmanDefaultTableInfo

logger = logging.getLogger(logging_config.LOGGER_NAME)


# NOTE(@lberg): partition_data_proc is known to fail if data is being inserted
# into the table while the procedure is running. However, the procedure uses
# commits internally, so we can't set a lock in the session.
@stamina.retry(
    on=SQLAlchemyError, attempts=5, wait_jitter=0, wait_exp_base=1, wait_initial=0.5
)
async def _move_data_from_default_partition(
    db: database.Database, partition_name: str
) -> None:
    async with db.session(session_type=database.SessionType.AUTO_COMMIT) as session:
        await session.execute(
            text(
                f"CALL partman.partition_data_proc('{partition_name}', p_batch := 200)"
            )
        )


async def move_data_from_default_partitions(db: database.Database) -> None:
    async with db.session(session_type=database.SessionType.SLOW_QUERY) as session:
        rows = (
            await session.execute(
                text(
                    "select default_table, count as num_rows from"
                    " partman.check_default()"
                )
            )
        ).all()

    partman_infos = [
        PartmanDefaultTableInfo(
            table_name=row.default_table, rows_count=int(row.num_rows)
        )
        for row in rows
    ]
    if not len(partman_infos):
        return

    logger.warning(f"partman data in default partitions: {partman_infos}")
    # for each table, move data from default partition using partman
    for partman_info in partman_infos:
        partition_base_name = partman_info.table_name.removesuffix("_default")
        try:
            await _move_data_from_default_partition(db, partition_base_name)
        except SQLAlchemyError as e:
            # NOTE(@lberg): a single failure here means that we can't run
            # maintenance later, so we can't move data for other tables
            raise DefaultPartitionMoveError(
                f"Failed to move data out for {partman_info=}: {e}"
            )
        logger.info(f"Moved data from default partition for {partman_info.table_name}")


async def run_partitions_maintenance(db: database.Database) -> None:
    try:
        async with db.session(session_type=database.SessionType.AUTO_COMMIT) as session:
            await session.execute(text("CALL create_partitions_new_cameras();"))
            await session.execute(text("CALL partman.run_maintenance_proc();"))
    except SQLAlchemyError as e:
        raise PartitionMaintenanceError(f"Failed to run partitions maintenance: {e}")
