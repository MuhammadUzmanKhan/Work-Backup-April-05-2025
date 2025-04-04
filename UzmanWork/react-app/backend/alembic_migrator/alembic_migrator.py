import argparse
import asyncio
import enum

import sqlalchemy as sa
from alembic.config import Config
from alembic.script import ScriptDirectory

from backend.database.database import Database, run_db_downgrade, run_db_upgrade
from backend.dependencies import init_backend_database
from backend.envs import BackendSecrets


def _parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Run Alembic migrations")
    subparsers = parser.add_subparsers(dest="action", required=True)

    # find_head_revision subcommand
    find_head_parser = subparsers.add_parser(
        "find_head_revision", help="Find the head revision"
    )
    find_head_parser.add_argument(
        "--migrations_path",
        type=str,
        default="backend/alembic",
        help="Path of the migrations folder",
    )

    # migrate subcommand
    migrate_parser = subparsers.add_parser("migrate", help="Perform a migration")
    migrate_parser.add_argument(
        "--migrations_path",
        type=str,
        default="backend/alembic",
        help="Path of the migrations folder",
    )
    migrate_parser.add_argument(
        "--revision", type=str, default="head", help="Migration revision to apply"
    )
    return parser.parse_args()


def _get_alembic_config(migrations_path: str) -> Config:
    alembic_cfg = Config("/app/backend/alembic.ini")
    alembic_cfg.set_main_option("script_location", migrations_path)
    return alembic_cfg


class MigrationDirection(str, enum.Enum):
    Skip = "Skip"
    Unknown = "Unknown"
    Upgrade = "Upgrade"
    Downgrade = "Downgrade"


async def _determine_migration_direction(
    alembic_cfg: Config, from_revision: str, to_revision: str
) -> MigrationDirection:
    script_dir = ScriptDirectory.from_config(alembic_cfg)

    # The first element in rev_history is "head", so it's a reversed order
    rev_history = [rev.revision for rev in script_dir.walk_revisions()]
    if from_revision == to_revision:
        return MigrationDirection.Skip

    try:
        from_rev_index = rev_history.index(from_revision)
        to_rev_index = rev_history.index(to_revision)
    except ValueError:
        return MigrationDirection.Unknown

    if to_rev_index < from_rev_index:
        return MigrationDirection.Upgrade
    else:
        return MigrationDirection.Downgrade


class CurrentAlembicVersionNotFoundException(Exception):
    pass


async def _get_current_head(database: Database) -> str:
    async with database.session() as session:
        result = await session.execute(
            sa.select(sa.text("version_num")).select_from(sa.text("alembic_version"))
        )
        version = result.scalar()
        if not version:
            raise CurrentAlembicVersionNotFoundException(
                "Could not find current head revision"
            )
        return str(version)


async def find_head_revision(args: argparse.Namespace) -> str | None:
    alembic_cfg = _get_alembic_config(args.migrations_path)
    script_dir = ScriptDirectory.from_config(alembic_cfg)
    return script_dir.get_current_head()


async def run_migrations(args: argparse.Namespace) -> None:
    secrets = BackendSecrets()
    database = init_backend_database(secrets, application_name="alembic_migrator")
    alembic_cfg = _get_alembic_config(args.migrations_path)

    current_revision = await _get_current_head(database)
    target_revision = args.revision if args.revision else "head"

    migration_direction = await _determine_migration_direction(
        alembic_cfg, from_revision=current_revision, to_revision=target_revision
    )

    if migration_direction not in [
        MigrationDirection.Upgrade,
        MigrationDirection.Downgrade,
    ]:
        print(f"{MigrationDirection=}. No migrations to run.")
        return

    operation = (
        run_db_upgrade
        if migration_direction == MigrationDirection.Upgrade
        else run_db_downgrade
    )
    async with database.slow_query_session_maker.connection() as conn:
        await conn.run_sync(operation, alembic_cfg, target_revision)


async def main() -> None:
    args = _parse_args()
    if args.action == "find_head_revision":
        head_revision = await find_head_revision(args)
        print(head_revision)
    elif args.action == "migrate":
        await run_migrations(args)


if __name__ == "__main__":
    asyncio.run(main())
