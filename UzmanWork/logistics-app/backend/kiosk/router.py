import logging

from fastapi import APIRouter, Depends, HTTPException

from backend import auth, auth_models, envs, logging_config
from backend.access_logs.constants import UserActions
from backend.access_logs.utils import AccessLogger
from backend.alert.alert_sending import (
    format_shared_kiosk_message,
    send_shared_kiosk_email,
)
from backend.database import database, models, orm
from backend.database.orm.orm_kiosk import KioskError
from backend.dependencies import (
    get_backend_database,
    get_backend_envs,
    get_email_client,
)
from backend.email_sending import EmailClient
from backend.fastapi_utils import WithResponseExcludeNone
from backend.kiosk.auth_utils import check_user_is_allowed
from backend.kiosk.models import (
    CreateKioskRequest,
    KioskResponse,
    KiosksResponse,
    RenameKioskRequest,
    ShareKioskRequest,
    UpdateKioskStatusRequest,
    UpdateWallsForKioskRequest,
)
from backend.kiosk.utils import KioskAction

logger = logging.getLogger(logging_config.LOGGER_NAME)


kiosk_router = WithResponseExcludeNone(
    APIRouter(
        prefix="/kiosk",
        tags=["kiosk"],
        generate_unique_id_function=lambda route: route.name,
    )
)


@kiosk_router.post("/create")
async def create(
    request: CreateKioskRequest,
    db: database.Database = Depends(get_backend_database),
    app_user: auth_models.AppUser = Depends(auth.regular_user_role_guard),
    _access_logger: AccessLogger = Depends(
        AccessLogger(
            UserActions.CREATED_KIOSK, ["name", "wall_ids", "rotate_frequency_s"]
        )
    ),
) -> int:
    """Creates a new kiosk."""
    async with db.tenant_session() as session:
        try:
            new_kiosk_id = await orm.Kiosk.create_kiosk(
                session,
                models.KioskCreate(
                    creator_user_email=app_user.user_email,
                    name=request.name,
                    rotate_frequency_s=request.rotate_frequency_s,
                    is_enabled=True,
                ),
                wall_ids=request.wall_ids,
            )
        except KioskError as ex:
            raise HTTPException(status_code=400, detail=str(ex))

        return new_kiosk_id


@kiosk_router.delete("/delete/{kiosk_id}")
async def delete(
    kiosk_id: int,
    db: database.Database = Depends(get_backend_database),
    app_user: auth_models.AppUser = Depends(auth.regular_user_role_guard),
    _access_logger: AccessLogger = Depends(
        AccessLogger(UserActions.DELETED_KIOSK, ["kiosk_id"])
    ),
) -> None:
    """Deletes a wall."""
    async with db.tenant_session() as session:
        await check_user_is_allowed(
            session=session,
            kiosk_id=kiosk_id,
            app_user=app_user,
            action=KioskAction.DELETE,
        )
        await orm.Kiosk.delete_kiosk(session, kiosk_id)


@kiosk_router.post("/update_walls")
async def update_walls(
    request: UpdateWallsForKioskRequest,
    db: database.Database = Depends(get_backend_database),
    app_user: auth_models.AppUser = Depends(auth.regular_user_role_guard),
    _access_logger: AccessLogger = Depends(
        AccessLogger(
            UserActions.UPDATED_KIOSK_WALLS,
            ["kiosk_id", "wall_ids", "rotate_frequency_s"],
        )
    ),
) -> None:
    """Update the walls of an existing kiosk (= override existing kiosk - walls
    with given ones)."""
    async with db.tenant_session() as session:
        await check_user_is_allowed(
            session=session,
            kiosk_id=request.kiosk_id,
            app_user=app_user,
            action=KioskAction.UPDATE,
        )
        try:
            await orm.Kiosk.update_kiosk(
                session,
                request.kiosk_id,
                {"rotate_frequency_s": request.rotate_frequency_s},
            )

            await orm.Kiosk.update_kiosk_walls(
                session, request.kiosk_id, new_wall_ids=request.wall_ids
            )
        except KioskError as ex:
            raise HTTPException(status_code=400, detail=str(ex))


@kiosk_router.post("/rename")
async def rename(
    request: RenameKioskRequest,
    db: database.Database = Depends(get_backend_database),
    app_user: auth_models.AppUser = Depends(auth.regular_user_role_guard),
    _access_logger: AccessLogger = Depends(
        AccessLogger(UserActions.RENAMED_KIOSK, ["kiosk_id", "name"])
    ),
) -> None:
    """Rename an existing kiosk."""
    async with db.tenant_session() as session:
        await check_user_is_allowed(
            session=session,
            kiosk_id=request.kiosk_id,
            app_user=app_user,
            action=KioskAction.RENAME,
        )
        try:
            await orm.Kiosk.update_kiosk(
                session, request.kiosk_id, {"name": request.name}
            )
        except KioskError as ex:
            raise HTTPException(status_code=400, detail=str(ex))


@kiosk_router.post("/update_status")
async def update_status(
    request: UpdateKioskStatusRequest,
    db: database.Database = Depends(get_backend_database),
    app_user: auth_models.AppUser = Depends(auth.regular_user_role_guard),
    _access_logger: AccessLogger = Depends(
        AccessLogger(UserActions.UPDATED_KIOSK_STATUS, ["kiosk_id", "is_enabled"])
    ),
) -> None:
    """Enable/disable existing kiosk."""
    async with db.tenant_session() as session:
        await check_user_is_allowed(
            session=session,
            kiosk_id=request.kiosk_id,
            app_user=app_user,
            action=KioskAction.UPDATE_IS_ENABLED,
        )
        try:
            await orm.Kiosk.update_kiosk(
                session, request.kiosk_id, {"is_enabled": request.is_enabled}
            )
        except KioskError as ex:
            raise HTTPException(status_code=400, detail=str(ex))


@kiosk_router.post("/regenerate/{kiosk_id}")
async def regenerate(
    kiosk_id: int,
    db: database.Database = Depends(get_backend_database),
    app_user: auth_models.AppUser = Depends(auth.regular_user_role_guard),
    _access_logger: AccessLogger = Depends(
        AccessLogger(UserActions.REGENERATED_KIOSK_URL, ["kiosk_id"])
    ),
) -> None:
    """Regenerates the hash of an existing kiosk."""
    async with db.tenant_session() as session:
        await check_user_is_allowed(
            session=session,
            kiosk_id=kiosk_id,
            app_user=app_user,
            action=KioskAction.REGENERATE_HASH,
        )
        await orm.Kiosk.regenerate_hash(session, kiosk_id)


@kiosk_router.post("/share")
async def share(
    request: ShareKioskRequest,
    db: database.Database = Depends(get_backend_database),
    email_client: EmailClient = Depends(get_email_client),
    app_user: auth_models.AppUser = Depends(auth.regular_user_role_guard),
    backend_envs: envs.BackendEnvs = Depends(get_backend_envs),
    _access_logger: AccessLogger = Depends(
        AccessLogger(UserActions.SHARED_KIOSK, ["kiosk_id", "recipient_email"])
    ),
) -> None:
    """Shares a kiosk by sending an email to the specified email address."""
    async with db.tenant_session() as session:
        await check_user_is_allowed(
            session=session,
            kiosk_id=request.kiosk_id,
            app_user=app_user,
            action=KioskAction.READ,
        )
        kiosk = await orm.Kiosk.get_kiosk(session, request.kiosk_id)
        if not kiosk:
            raise HTTPException(status_code=400, detail="Kiosk not found")

    await send_shared_kiosk_email(
        email_client=email_client,
        recipient=request.recipient_email,
        content=format_shared_kiosk_message(
            web_app_url=backend_envs.web_app_url,
            sender=app_user.user_email,
            kiosk_name=kiosk.name,
            kiosk_hash=kiosk.hash,
        ),
    )


@kiosk_router.get("/")
async def retrieve_kiosks(
    db: database.Database = Depends(get_backend_database),
    app_user: auth_models.AppUser = Depends(auth.regular_user_role_guard),
) -> KiosksResponse:
    """Retrieve all relevant information about kiosks in the specified org.
    Regular users can only retrieve kiosks that they have created, while admins
    can retrieve all kiosks in the org."""
    async with db.tenant_session() as session:
        kiosks = await orm.Kiosk.get_kiosks_for_org(
            session=session,
            user_email=app_user.user_email,
            is_admin=(app_user.role == auth.UserRole.ADMIN),
        )

    return KiosksResponse(kiosks=[KioskResponse(kiosk=kiosk) for kiosk in kiosks])
