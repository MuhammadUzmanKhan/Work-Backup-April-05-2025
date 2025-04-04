import logging

import fastapi
from fastapi import APIRouter, Body, Depends, HTTPException
from sqlalchemy import exc

from backend import auth, auth_models, logging_config
from backend.access_logs.constants import UserActions
from backend.access_logs.utils import AccessLogger
from backend.alert.alert_sending import (
    format_shared_wall_message,
    send_shared_wall_email,
)
from backend.database import database, models, orm
from backend.dependencies import get_backend_database, get_email_client
from backend.email_sending import EmailClient
from backend.fastapi_utils import WithResponseExcludeNone
from backend.user_wall.models import (
    MAX_WALL_NAME_LENGTH,
    CopyWallRequest,
    CreateWallRequest,
    ShareWallRequest,
    UnshareWallRequest,
    UserWallsResponse,
    WallsCountResponse,
    WallTile,
)
from backend.user_wall.utils import (
    get_walls_shared_with_user,
    get_walls_user_is_sharing,
)

logger = logging.getLogger(logging_config.LOGGER_NAME)

user_wall_router = WithResponseExcludeNone(
    APIRouter(
        prefix="/user_wall",
        tags=["user_wall"],
        generate_unique_id_function=lambda route: route.name,
    )
)


@user_wall_router.post("/create_wall")
async def create_wall(
    create_wall_request: CreateWallRequest,
    db: database.Database = Depends(get_backend_database),
    app_user: auth_models.AppUser = Depends(auth.live_only_user_role_guard),
    _access_logger: None = Depends(
        AccessLogger(user_action=UserActions.CREATED_A_WALL, extra_args=["name"])
    ),
) -> int:
    """Creates a new wall."""
    async with db.tenant_session() as session:
        new_wall = await orm.Wall.create_wall(
            session,
            models.WallCreate(
                owner_user_email=app_user.user_email, name=create_wall_request.name
            ),
        )
        await orm.WallTile.create_tiles(
            session,
            new_wall.id,
            wall_tiles_create=[
                models.WallTileCreate(
                    wall_id=new_wall.id,
                    camera_mac_address=tile.camera_mac_address,
                    x_start_tile=tile.x_start_tile,
                    y_start_tile=tile.y_start_tile,
                    width_tiles=tile.width_tiles,
                    height_tiles=tile.height_tiles,
                )
                for tile in create_wall_request.wall_tiles
            ],
        )
        return new_wall.id


@user_wall_router.post("/edit_tiles/{wall_id}")
async def edit_tiles(
    wall_id: int,
    wall_tiles: list[WallTile],
    db: database.Database = Depends(get_backend_database),
    app_user: auth_models.AppUser = Depends(auth.live_only_user_role_guard),
    _access_logger: None = Depends(
        AccessLogger(user_action=UserActions.EDITED_THE_TILES_OF_AN_EXISTING_WALL)
    ),
) -> None:
    """Edit the tiles of an existing wall (= override existing tiles
    with given ones)."""
    async with db.tenant_session() as session:
        if not await orm.SharedWall.check_user_is_allowed(
            session, app_user.user_email, wall_id
        ):
            raise HTTPException(
                status_code=400, detail="user can't perform this action"
            )

        wall_tiles_create = [
            models.WallTileCreate(
                wall_id=wall_id,
                camera_mac_address=tile.camera_mac_address,
                x_start_tile=tile.x_start_tile,
                y_start_tile=tile.y_start_tile,
                width_tiles=tile.width_tiles,
                height_tiles=tile.height_tiles,
            )
            for tile in wall_tiles
        ]
        await orm.WallTile.create_tiles(session, wall_id, wall_tiles_create)


@user_wall_router.delete("/delete_wall/{wall_id}")
async def delete_wall(
    wall_id: int,
    db: database.Database = Depends(get_backend_database),
    app_user: auth_models.AppUser = Depends(auth.live_only_user_role_guard),
    _access_logger: None = Depends(
        AccessLogger(user_action=UserActions.DELETED_A_WALL)
    ),
) -> None:
    """Deletes a wall."""
    async with db.tenant_session() as session:
        if not await orm.SharedWall.check_user_is_allowed(
            session, app_user.user_email, wall_id
        ):
            raise HTTPException(
                status_code=400, detail="user can't perform this action"
            )
        await orm.Wall.delete_wall(session, wall_id)


@user_wall_router.get("/count")
async def get_walls_count_by_camera(
    camera_mac_address: str,
    db: database.Database = Depends(get_backend_database),
    _app_user: auth_models.AppUser = Depends(auth.admin_user_role_guard),
) -> WallsCountResponse:
    async with db.tenant_session() as session:
        walls_count = await orm.WallTile.count_walls_using_camera(
            session, camera_mac_address
        )
    return WallsCountResponse(walls_count=walls_count)


@user_wall_router.get("/")
async def retrieve_user_walls(
    db: database.Database = Depends(get_backend_database),
    app_user: auth_models.AppUser = Depends(auth.live_only_user_role_guard),
) -> UserWallsResponse:
    """Retrieve all walls for the user."""
    response = UserWallsResponse(walls=[], shared_walls=[])
    async with db.tenant_session() as session:
        response.walls = await get_walls_user_is_sharing(session, app_user.user_email)
        response.shared_walls = await get_walls_shared_with_user(
            session, app_user.user_email
        )
    return response


@user_wall_router.get("/tiles/{wall_id}")
async def retrieve_wall_details(
    wall_id: int,
    db: database.Database = Depends(get_backend_database),
    app_user: auth_models.AppUser = Depends(auth.live_only_user_role_guard),
) -> list[WallTile]:
    """Retrieve wall details."""
    async with db.tenant_session() as session:
        if not await orm.SharedWall.check_user_is_allowed(
            session, app_user.user_email, wall_id
        ):
            raise HTTPException(
                status_code=400, detail="user can't perform this action"
            )
        tiles = await orm.WallTile.system_get_wall_tiles(session, wall_id)
    return [WallTile(**tile.dict()) for tile in tiles]


@user_wall_router.get("/is_used_in_kiosk")
async def is_wall_used_in_kiosk(
    wall_id: int,
    db: database.Database = Depends(get_backend_database),
    app_user: auth_models.AppUser = Depends(auth.live_only_user_role_guard),
) -> bool:
    """Return whether a wall is used in a kiosk."""
    async with db.tenant_session() as session:
        if not await orm.SharedWall.check_user_is_allowed(
            session, app_user.user_email, wall_id
        ):
            raise HTTPException(
                status_code=400, detail="user can't perform this action"
            )
        return await orm.Kiosk.is_wall_used_in_kiosk(session, wall_id)


# NOTE(@lberg): This is not used in the frontend
@user_wall_router.post("/share_wall")
async def share_wall(
    share_wall_request: ShareWallRequest,
    db: database.Database = Depends(get_backend_database),
    app_user: auth_models.AppUser = Depends(auth.limited_user_role_guard),
    _access_logger: None = Depends(
        AccessLogger(UserActions.SHARED_A_WALL, ["shared_with_user_emails"])
    ),
) -> None:
    """Share a wall with a user."""
    try:
        async with db.tenant_session() as session:
            if not await orm.SharedWall.check_user_is_allowed(
                session, app_user.user_email, share_wall_request.wall_id
            ):
                raise HTTPException(
                    status_code=400, detail="user can't perform this action"
                )
            for email in share_wall_request.shared_with_user_emails:
                await orm.SharedWall.share_wall(
                    session,
                    models.SharedWallCreate(
                        wall_id=share_wall_request.wall_id, shared_with_user_email=email
                    ),
                )
    # TODO (oliverscheel): better error message, maybe not fail completely?
    # (same for archive, wall copy)
    except exc.IntegrityError as exception:
        if "duplicate key" in str(exception):
            raise fastapi.HTTPException(
                status_code=fastapi.status.HTTP_400_BAD_REQUEST,
                detail="Wall is already shared with this user",
            )


@user_wall_router.post("/copy_wall")
async def copy_wall(
    copy_wall_request: CopyWallRequest,
    db: database.Database = Depends(get_backend_database),
    email_client: EmailClient = Depends(get_email_client),
    app_user: auth_models.AppUser = Depends(auth.live_only_user_role_guard),
    _access_logger: None = Depends(
        AccessLogger(user_action=UserActions.SHARED_A_COPY_OF_A_WALL)
    ),
) -> None:
    """Share a wall with a user by making a deep copy."""
    async with db.tenant_session() as session:
        if not await orm.SharedWall.check_user_is_allowed(
            session, app_user.user_email, copy_wall_request.original_wall_id
        ):
            raise HTTPException(
                status_code=400, detail="user can't perform this action"
            )
        tiles = await orm.WallTile.system_get_wall_tiles(
            session, copy_wall_request.original_wall_id
        )
        for email in copy_wall_request.shared_with_user_emails:
            # Error handling for duplicate wall names is done here
            wall = await orm.Wall.create_wall(
                session,
                models.WallCreate(
                    name=copy_wall_request.wall_name, owner_user_email=email
                ),
            )
            await orm.WallTile.create_tiles(
                session,
                wall.id,
                wall_tiles_create=[
                    models.WallTileCreate.from_wall_tile(tile) for tile in tiles
                ],
            )
            # TODO (oliverscheel): should prob. pull this out the session
            await send_shared_wall_email(
                email_client=email_client,
                recipient=email,
                content=format_shared_wall_message(
                    sender=copy_wall_request.sender_email,
                    wall_name=copy_wall_request.wall_name,
                ),
            )


# NOTE(@lberg): This is not used in the frontend
@user_wall_router.post("/unshare_wall")
async def unshare_wall(
    share_wall_request: UnshareWallRequest,
    db: database.Database = Depends(get_backend_database),
    app_user: auth_models.AppUser = Depends(auth.limited_user_role_guard),
    _access_logger: None = Depends(
        AccessLogger(user_action=UserActions.UNSHARED_A_WALL)
    ),
) -> None:
    """Undo sharing a wall with a user."""
    async with db.tenant_session() as session:
        if not await orm.SharedWall.check_user_is_allowed(
            session, app_user.user_email, share_wall_request.wall_id
        ):
            raise HTTPException(
                status_code=400, detail="user can't perform this action"
            )
        await orm.SharedWall.unshare_wall(
            session,
            share_wall_request.wall_id,
            share_wall_request.shared_with_user_email,
        )


@user_wall_router.post("/rename_wall")
async def rename_wall(
    wall_id: int = Body(),
    new_wall_name: str = Body(max_length=MAX_WALL_NAME_LENGTH),
    db: database.Database = Depends(get_backend_database),
    app_user: auth_models.AppUser = Depends(auth.live_only_user_role_guard),
    _access_logger: None = Depends(
        AccessLogger(
            user_action=UserActions.RENAMED_A_WALL, extra_args=["new_wall_name"]
        )
    ),
) -> None:
    """Rename a wall."""
    async with db.tenant_session() as session:
        if not await orm.SharedWall.check_user_is_allowed(
            session, app_user.user_email, wall_id
        ):
            raise HTTPException(
                status_code=400, detail="user can't perform this action"
            )
        await orm.Wall.rename_wall(
            session, wall_id=wall_id, new_wall_name=new_wall_name
        )
