from __future__ import annotations

import random
import string
from typing import Any, List

import sqlalchemy as sa
from sqlalchemy import exc, orm
from sqlalchemy.ext.asyncio import AsyncSession

from backend.database import models
from backend.database.orm.orm_camera import Camera
from backend.database.orm.orm_utils import Base, TenantProtectedTable
from backend.database.orm.orm_wall import Wall, WallTile
from backend.database.session import TenantAwareAsyncSession
from backend.kiosk.utils import KioskAction
from backend.utils import AwareDatetime


class KioskError(Exception):
    pass


class KioskDuplicatedNameError(KioskError):
    pass


class KioskWallNotFoundError(KioskError):
    pass


class KioskNotFoundError(KioskError):
    pass


class Kiosk(TenantProtectedTable):
    __tablename__ = "kiosks"
    id: orm.Mapped[int] = sa.Column(sa.Integer, primary_key=True, autoincrement=True)
    # Hash that uniquely identifies the kiosk and is used to access it
    hash = sa.Column(sa.String, unique=True, nullable=False)
    # This determines after how many seconds should the kiosk switch between
    # walls.
    rotate_frequency_s = sa.Column(sa.Float, nullable=False)
    # Whether the kiosk is enabled
    is_enabled = sa.Column(sa.Boolean, nullable=False)
    # Human readable name for the kiosk
    name = sa.Column(sa.String, nullable=False)
    # The email of the creator of the kiosk
    creator_user_email = sa.Column(sa.String, nullable=False)
    # The time the kiosk was created
    creation_time = sa.Column(sa.TIMESTAMP(timezone=True), nullable=False)

    # Walls associated with the kiosk
    kiosk_walls: orm.Mapped[List[KioskWall]] = orm.relationship(
        "KioskWall", uselist=True, cascade="all, delete-orphan"
    )
    # No one can create a kiosk with the same name in the same org.
    __table_args__ = (
        sa.UniqueConstraint(name, "tenant"),
        sa.ForeignKeyConstraint(["tenant"], ["organizations.tenant"]),
    )

    @staticmethod
    async def create_kiosk(
        session: TenantAwareAsyncSession,
        kiosk_create: models.KioskCreate,
        wall_ids: list[int],
    ) -> int:
        kiosk = Kiosk(
            hash=await Kiosk._generate_new_unique_hash(session),
            rotate_frequency_s=kiosk_create.rotate_frequency_s,
            is_enabled=kiosk_create.is_enabled,
            name=kiosk_create.name,
            creator_user_email=kiosk_create.creator_user_email,
            creation_time=AwareDatetime.utcnow(),
            tenant=session.tenant,
        )
        session.add(kiosk)

        # Add associated walls
        for wall_idx, wall_id in enumerate(wall_ids):
            kiosk.kiosk_walls.append(
                KioskWall(wall_id=wall_id, kiosk_id=kiosk.id, index=wall_idx)
            )

        try:
            await session.flush()
        except exc.IntegrityError as exception:
            if "duplicate key" in str(exception):
                name = kiosk_create.name
                raise KioskDuplicatedNameError(f"A kiosk with {name=} already exists")
            if "violates foreign key constraint" in str(
                exception
            ) and "kiosk_walls_wall_id_fkey" in str(exception):
                raise KioskWallNotFoundError(f"One or more {wall_ids=} don't exist")
            raise

        return kiosk.id

    @staticmethod
    async def delete_kiosk(session: TenantAwareAsyncSession, kiosk_id: int) -> None:
        # Note that this will delete all KioskWalls associated with the kiosk as
        # well because of cascade delete.
        row_count = (
            await session.execute(sa.delete(Kiosk).where(Kiosk.id == kiosk_id))
        ).rowcount  # type: ignore

        if row_count != 1:
            raise KioskNotFoundError("Kiosk not found")

    @staticmethod
    def _get_kiosk_select_clause() -> sa.sql.Select:
        query = (
            sa.select(Kiosk)
            .options(sa.orm.selectinload(Kiosk.kiosk_walls))
            .options(sa.orm.selectinload("kiosk_walls.wall"))
        )
        return query

    @staticmethod
    async def get_kiosk(
        session: TenantAwareAsyncSession, kiosk_id: int
    ) -> models.Kiosk | None:
        query = Kiosk._get_kiosk_select_clause().where(Kiosk.id == kiosk_id)
        kiosk = (await session.execute(query)).scalar_one_or_none()
        return models.Kiosk.from_orm(kiosk) if kiosk is not None else None

    @staticmethod
    async def system_get_kiosk_by_hash(
        session: AsyncSession, kiosk_hash: str
    ) -> models.Kiosk | None:
        """Get a kiosk by its unique hash."""
        query = Kiosk._get_kiosk_select_clause().where(Kiosk.hash == kiosk_hash)
        kiosk = (await session.execute(query)).scalar_one_or_none()
        return models.Kiosk.from_orm(kiosk) if kiosk is not None else None

    @staticmethod
    async def get_kiosks_for_org(
        session: TenantAwareAsyncSession, user_email: str, is_admin: bool
    ) -> list[models.Kiosk]:
        where_clause: sa.sql.ClauseElement = sa.true()
        if not is_admin:
            where_clause = Kiosk.creator_user_email == user_email

        query = Kiosk._get_kiosk_select_clause().where(where_clause).order_by(Kiosk.id)
        result = await session.execute(query)
        rows = result.all()
        return [models.Kiosk.from_orm(row.Kiosk) for row in rows]

    @staticmethod
    async def system_is_kiosk_available(session: AsyncSession, kiosk_hash: str) -> bool:
        """Check if a kiosk with the given hash exists in the DB and it is enabled."""
        query = sa.select(Kiosk.id).where(
            Kiosk.hash == kiosk_hash, Kiosk.is_enabled == True
        )
        return (await session.execute(query)).scalar_one_or_none() is not None

    @staticmethod
    async def update_kiosk_walls(
        session: TenantAwareAsyncSession, kiosk_id: int, new_wall_ids: list[int]
    ) -> None:
        query = Kiosk._get_kiosk_select_clause().where(Kiosk.id == kiosk_id)
        kiosk = (await session.execute(query)).scalar_one_or_none()

        if kiosk is None:
            raise KioskNotFoundError(f"{kiosk_id=} not found")

        # Remove old walls
        kiosk.kiosk_walls = []
        # Flush to make sure the old walls are deleted before we add the new ones.
        await session.flush()

        # Add associated walls
        for wall_idx, wall_id in enumerate(new_wall_ids):
            kiosk.kiosk_walls.append(
                KioskWall(wall_id=wall_id, kiosk_id=kiosk.id, index=wall_idx)
            )

        try:
            await session.flush()
        except exc.IntegrityError as exception:
            if "violates foreign key constraint" in str(
                exception
            ) and "kiosk_walls_wall_id_fkey" in str(exception):
                raise KioskWallNotFoundError(f"One or more {new_wall_ids=} don't exist")
            raise

    @staticmethod
    async def update_kiosk(
        session: TenantAwareAsyncSession, kiosk_id: int, update_kwargs: dict[str, Any]
    ) -> None:
        try:
            query = sa.update(Kiosk).where(Kiosk.id == kiosk_id).values(**update_kwargs)
            row_count = (await session.execute(query)).rowcount  # type: ignore
            if row_count != 1:
                raise KioskNotFoundError("Kiosk not found")
        except exc.IntegrityError as exception:
            if "duplicate key" in str(exception):
                name = update_kwargs.get("name")
                if name is not None:
                    raise KioskDuplicatedNameError(f"{name=} already used for org")
            raise

    @staticmethod
    async def regenerate_hash(session: TenantAwareAsyncSession, kiosk_id: int) -> None:
        """Regenerates the hash of an existing kiosk."""
        kiosk_hash = await Kiosk._generate_new_unique_hash(session)
        query = sa.update(Kiosk).where(Kiosk.id == kiosk_id).values(hash=kiosk_hash)
        row_count = (await session.execute(query)).rowcount  # type: ignore

        if row_count != 1:
            raise KioskNotFoundError(f"{kiosk_id=} not found")

    @staticmethod
    async def is_wall_used_in_kiosk(
        session: TenantAwareAsyncSession, wall_id: int
    ) -> bool:
        """Returns whether a wall is used in a kiosk."""
        query = sa.select(KioskWall.wall_id).where(KioskWall.wall_id == wall_id)
        result = await session.execute(query)
        return result.scalar_one_or_none() is not None

    @staticmethod
    async def check_user_is_allowed(
        session: TenantAwareAsyncSession,
        kiosk_id: int,
        user_email: str,
        is_user_admin: bool,
        action: KioskAction,
    ) -> bool:
        # If the tenant does not match the kiosk's organization, the user cannot
        # do anything.
        query_org = sa.select(Kiosk.id).where(Kiosk.id == kiosk_id)
        kiosk_exists = (
            await session.execute(query_org)
        ).scalar_one_or_none() is not None
        if not kiosk_exists:
            return False

        query_creator = sa.select(Kiosk.id).filter(
            Kiosk.id == kiosk_id, Kiosk.creator_user_email == user_email
        )
        is_creator = (
            await session.execute(query_creator)
        ).scalar_one_or_none() is not None

        # Check if a user is the creator of the wall.
        # If so, they can do anything.
        if is_creator:
            return True

        # Admins can read, update is_enabled status, refresh SHA, delete, rename
        # for their org
        if is_user_admin and action in [
            KioskAction.READ,
            KioskAction.UPDATE_IS_ENABLED,
            KioskAction.REGENERATE_HASH,
            KioskAction.DELETE,
            KioskAction.RENAME,
        ]:
            return True

        return False

    @staticmethod
    async def system_can_access_cameras_with_hash(
        session: AsyncSession, kiosk_hash: str, camera_mac_addresses: set[str]
    ) -> bool:
        """Returns whether a kiosk with the given hash can access the given
        cameras."""
        query = (
            sa.select(Camera.mac_address)
            .join(WallTile)
            .join(Wall)
            .join(KioskWall)
            .join(Kiosk)
            .where(
                Kiosk.hash == kiosk_hash,
                Kiosk.is_enabled == True,
                Camera.mac_address.in_(camera_mac_addresses),
            )
        )
        result = await session.execute(query)
        found_camera_mac_addresses = {row[0] for row in result.all()}
        return len(found_camera_mac_addresses) == len(camera_mac_addresses)

    @staticmethod
    async def _exists_by_hash(
        session: TenantAwareAsyncSession, kiosk_hash: str
    ) -> bool:
        """Check if a kiosk with the given unique hash exists in the DB."""
        query = sa.select(sa.exists().where(Kiosk.hash == kiosk_hash))
        result = await session.execute(query)
        return bool(result.scalar())

    @staticmethod
    async def _generate_new_unique_hash(session: TenantAwareAsyncSession) -> str:
        """Generates a new unique hash for a kiosk that doesn't exist in the
        DB."""

        def hash_fn() -> str:
            return "".join(random.choices(string.hexdigits, k=10))

        unique_hash = hash_fn()
        while await Kiosk._exists_by_hash(session, unique_hash):
            unique_hash = hash_fn()

        return unique_hash


# NOTE(@lberg): this is an association table between kiosks and walls.
# We can add tenant but it's not necessary because the kiosk already has a tenant.
class KioskWall(Base):
    __tablename__ = "kiosk_walls"
    # The id of the kiosk the associated wall is on
    kiosk_id = sa.Column(
        sa.Integer, sa.ForeignKey("kiosks.id", ondelete="CASCADE"), nullable=False
    )
    # The id of the wall that is associated to the kiosk
    wall_id = sa.Column(
        sa.Integer, sa.ForeignKey("walls.id", ondelete="CASCADE"), nullable=False
    )
    # The index of the wall in the kiosk
    index = sa.Column(sa.Integer, nullable=False)
    __table_args__ = (
        # A kiosk can't have the same index twice
        sa.UniqueConstraint(kiosk_id, index),
        sa.PrimaryKeyConstraint(kiosk_id, wall_id),
    )
    wall: orm.Mapped[Wall] = orm.relationship("Wall")
