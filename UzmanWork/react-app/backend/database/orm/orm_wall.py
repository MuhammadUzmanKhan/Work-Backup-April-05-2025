from __future__ import annotations

import fastapi
import sqlalchemy as sa
from sqlalchemy import exc, func, orm
from sqlalchemy.ext.asyncio import AsyncSession

from backend.database import models
from backend.database.orm.orm_utils import TenantProtectedTable
from backend.database.session import TenantAwareAsyncSession


class Wall(TenantProtectedTable):
    __tablename__ = "walls"
    id: orm.Mapped[int] = sa.Column(sa.Integer, primary_key=True, autoincrement=True)
    # The email of the owner of the wall
    owner_user_email = sa.Column(sa.String, nullable=False)
    # Human readable name for the wall
    name = sa.Column(sa.String, nullable=False)
    # The user can't create a wall with the same name in the same org,
    # as another wall they own
    __table_args__ = (
        sa.UniqueConstraint(owner_user_email, name, "tenant"),
        (sa.ForeignKeyConstraint(["tenant"], ["organizations.tenant"])),
    )

    @staticmethod
    async def create_wall(
        session: TenantAwareAsyncSession, wall_create: models.WallCreate
    ) -> models.Wall:
        wall = Wall(
            owner_user_email=wall_create.owner_user_email,
            name=wall_create.name,
            tenant=session.tenant,
        )
        session.add(wall)
        # Populate the id field
        try:
            await session.flush()
        except exc.IntegrityError as exception:
            if "duplicate key" in str(exception):
                # TODO: We should not raise HTTP exceptions from the ORM layer.
                raise fastapi.HTTPException(
                    status_code=fastapi.status.HTTP_400_BAD_REQUEST,
                    detail="A wall with this name already exists",
                )
            raise
        return models.Wall.from_orm(wall)

    @staticmethod
    async def delete_wall(session: TenantAwareAsyncSession, wall_id: int) -> None:
        # TODO: Remove this after we add cascade delete.
        # First delete all shared walls pointing to this wall.
        await session.execute(
            sa.delete(SharedWall).where(SharedWall.wall_id == wall_id)
        )
        # Then delete all tiles in this wall.
        await session.execute(sa.delete(WallTile).where(WallTile.wall_id == wall_id))
        # Finally delete the wall itself.
        await session.execute(sa.delete(Wall).where(Wall.id == wall_id))

    @staticmethod
    async def get_walls_owned(
        session: TenantAwareAsyncSession, user_email: str
    ) -> list[models.Wall]:
        # TODO(@lberg): use tenant VAS-2770
        query = (
            sa.select(Wall)
            .filter(Wall.owner_user_email == user_email)
            .order_by(Wall.id)
        )
        result = await session.execute(query)
        rows = result.all()
        return [models.Wall.from_orm(wall.Wall) for wall in rows]

    @staticmethod
    async def rename_wall(
        session: TenantAwareAsyncSession, wall_id: int, new_wall_name: str
    ) -> None:
        try:
            query = sa.update(Wall).where(Wall.id == wall_id).values(name=new_wall_name)
            await session.execute(query)
        except exc.IntegrityError as exception:
            if "duplicate key" in str(exception):
                # TODO: We should not raise HTTP exceptions from the ORM layer.
                raise fastapi.HTTPException(
                    status_code=fastapi.status.HTTP_400_BAD_REQUEST,
                    detail="Wall name already used for user",
                )
            raise


class SharedWall(TenantProtectedTable):
    __tablename__ = "shared_walls"
    # The id of the wall this is a shared version of
    wall_id = sa.Column(
        sa.Integer, sa.ForeignKey("walls.id"), nullable=False, primary_key=True
    )
    # The email of the user the wall is shared with
    shared_with_user_email = sa.Column(sa.String, nullable=False, primary_key=True)
    __table_args__ = ((sa.ForeignKeyConstraint(["tenant"], ["organizations.tenant"])),)

    @staticmethod
    async def share_wall(
        session: TenantAwareAsyncSession, shared_wall_create: models.SharedWallCreate
    ) -> models.SharedWall:
        wall = SharedWall(
            wall_id=shared_wall_create.wall_id,
            shared_with_user_email=shared_wall_create.shared_with_user_email,
            tenant=session.tenant,
        )
        session.add(wall)
        await session.flush()
        return models.SharedWall.from_orm(wall)

    @staticmethod
    async def unshare_wall(
        session: TenantAwareAsyncSession, wall_id: int, shared_with_user_email: str
    ) -> None:
        delete_stmt = sa.delete(SharedWall).where(
            SharedWall.wall_id == wall_id,
            SharedWall.shared_with_user_email == shared_with_user_email,
        )
        await session.execute(delete_stmt)

    @staticmethod
    async def get_walls_user_is_sharing(
        session: TenantAwareAsyncSession, user_email: str
    ) -> list[models.SharedWall]:
        # TODO(@lberg): use tenant VAS-2770
        query = (
            sa.select(SharedWall)
            .join(Wall, Wall.id == SharedWall.wall_id)
            .filter(Wall.owner_user_email == user_email)
            .order_by(SharedWall.wall_id)
        )
        result = await session.execute(query)
        rows = result.all()
        # Return SharedWall, which is enough to know the user and the wall id
        return [models.SharedWall.from_orm(row.SharedWall) for row in rows]

    @staticmethod
    async def get_walls_shared_with_user(
        session: TenantAwareAsyncSession, user_email: str
    ) -> list[tuple[models.SharedWall, models.Wall]]:
        # TODO(@lberg): use tenant VAS-2770
        query = (
            sa.select(SharedWall, Wall)
            .join(Wall, Wall.id == SharedWall.wall_id)
            .filter(SharedWall.shared_with_user_email == user_email)
            .order_by(SharedWall.wall_id)
        )
        result = await session.execute(query)
        rows = result.all()

        return [
            (models.SharedWall.from_orm(row.SharedWall), models.Wall.from_orm(row.Wall))
            for row in rows
        ]

    @staticmethod
    async def check_user_is_allowed(
        session: TenantAwareAsyncSession, user_email: str, wall_id: int
    ) -> bool:
        # Check if a user is the owner of the wall.
        # If so, they can do anything.
        query_owner = sa.select(func.count(Wall.id)).filter(
            Wall.id == wall_id, Wall.owner_user_email == user_email
        )
        count_owner = (await session.execute(query_owner)).scalar()
        if count_owner is not None and count_owner > 0:
            return True

        # Check if wall is shared with the user.
        query_shared = sa.select(func.count(SharedWall.wall_id)).filter(
            SharedWall.wall_id == wall_id,
            SharedWall.shared_with_user_email == user_email,
        )
        count_shared = (await session.execute(query_shared)).scalar()
        if count_shared is not None and count_shared > 0:
            return True
        return False


class WallTile(TenantProtectedTable):
    __tablename__ = "wall_tiles"
    id: orm.Mapped[int] = sa.Column(sa.Integer, primary_key=True, autoincrement=True)
    # The id of the wall this tile is on
    wall_id = sa.Column(sa.Integer, sa.ForeignKey("walls.id"), nullable=False)
    # The mac address of the camera this tile is for
    # This is null if the tile is empty
    camera_mac_address = sa.Column(
        sa.String, sa.ForeignKey("cameras.mac_address"), nullable=True
    )
    # X start position in terms of number of tiles
    x_start_tile = sa.Column(sa.Integer, nullable=False)
    # Y start position in terms of number of tiles
    y_start_tile = sa.Column(sa.Integer, nullable=False)
    # Width in terms of number of tiles
    width_tiles = sa.Column(sa.Integer, nullable=False)
    # Height in terms of number of tiles
    height_tiles = sa.Column(sa.Integer, nullable=False)
    # The wall can't have two tiles with the same camera
    __table_args__ = (
        sa.UniqueConstraint(wall_id, camera_mac_address),
        (sa.ForeignKeyConstraint(["tenant"], ["organizations.tenant"])),
    )

    @staticmethod
    async def create_tiles(
        session: TenantAwareAsyncSession,
        wall_id: int,
        wall_tiles_create: list[models.WallTileCreate],
    ) -> list[models.WallTile]:
        # Remove any existing tiles for this wall
        delete_stmt = sa.delete(WallTile).where(WallTile.wall_id == wall_id)
        await session.execute(delete_stmt)
        # Create the new wall tiles
        wall_tiles = [
            WallTile(
                wall_id=wall_id,
                camera_mac_address=wall_tile_create.camera_mac_address,
                x_start_tile=wall_tile_create.x_start_tile,
                y_start_tile=wall_tile_create.y_start_tile,
                width_tiles=wall_tile_create.width_tiles,
                height_tiles=wall_tile_create.height_tiles,
                tenant=session.tenant,
            )
            for wall_tile_create in wall_tiles_create
        ]
        session.add_all(wall_tiles)
        await session.flush()
        return [models.WallTile.from_orm(wall_tile) for wall_tile in wall_tiles]

    @staticmethod
    async def system_get_wall_tiles(
        session: AsyncSession, wall_id: int
    ) -> list[models.WallTile]:
        query = (
            sa.select(WallTile)
            .filter(WallTile.wall_id == wall_id)
            .order_by(WallTile.camera_mac_address)
        )
        result = await session.execute(query)
        rows = result.all()
        return [models.WallTile.from_orm(wall_tile.WallTile) for wall_tile in rows]

    @staticmethod
    async def system_remove_camera_from_all_tiles(
        session: AsyncSession, camera_mac_address: str
    ) -> None:
        query = (
            sa.update(WallTile)
            .where(WallTile.camera_mac_address == camera_mac_address)
            .values(camera_mac_address=None)
        )
        await session.execute(query)

    @staticmethod
    async def count_walls_using_camera(
        session: TenantAwareAsyncSession, camera_mac_address: str
    ) -> int:
        query = sa.select(func.count(WallTile.wall_id.distinct())).where(
            WallTile.camera_mac_address == camera_mac_address
        )
        result = await session.execute(query)
        return int(result.scalar_one())
