import fastapi
from fastapi import APIRouter, Body, Depends, HTTPException

from backend import auth, auth_models
from backend.access_logs.constants import UserActions
from backend.access_logs.utils import AccessLogger
from backend.database import database, models
from backend.database.orm.orm_notification_group import (
    NotificationGroup,
    NotificationGroupError,
    NotificationGroupMember,
)
from backend.dependencies import get_backend_database
from backend.fastapi_utils import WithResponseExcludeNone
from backend.models import AccessRestrictions
from backend.notification_groups.models import (
    AddNotificationGroupMemberRequest,
    NotificationGroupsResponse,
    UpdateNotificationGroupMemberRequest,
)
from backend.notification_groups.router_utils import check_notification_group_access

notification_group_router = WithResponseExcludeNone(
    APIRouter(
        prefix="/notification_group",
        tags=["notification_groups"],
        generate_unique_id_function=lambda route: route.name,
    )
)


@notification_group_router.get("/new_group")
async def add_notification_group(
    _app_user: auth_models.AppUser = Depends(auth.admin_user_role_guard),
    access: AccessRestrictions = Depends(auth.get_user_access_restrictions),
    db: database.Database = Depends(get_backend_database),
) -> int:
    async with db.tenant_session() as session:
        try:
            notification_group = await NotificationGroup.new_group(session)
        except NotificationGroupError as ex:
            raise HTTPException(
                status_code=fastapi.status.HTTP_400_BAD_REQUEST, detail=str(ex)
            )
    return notification_group.id


@notification_group_router.get("/")
async def notification_groups(
    _app_user: auth_models.AppUser = Depends(auth.admin_user_role_guard),
    db: database.Database = Depends(get_backend_database),
    access: AccessRestrictions = Depends(auth.get_user_access_restrictions),
) -> NotificationGroupsResponse:
    async with db.tenant_session() as session:
        notification_groups = await NotificationGroup.get_groups(session)
    return NotificationGroupsResponse(
        notification_groups=[
            models.NotificationGroup.from_orm(group) for group in notification_groups
        ]
    )


@notification_group_router.post("/rename_group/{group_id}")
async def rename_notification_group(
    group_id: int,
    new_group_name: str = Body(embed=True),
    _app_user: auth_models.AppUser = Depends(auth.admin_user_role_guard),
    db: database.Database = Depends(get_backend_database),
    access: AccessRestrictions = Depends(auth.get_user_access_restrictions),
    _access_logger: AccessLogger = Depends(
        AccessLogger(
            UserActions.RENAMED_NOTIFICATION_GROUP, ["group_id", "new_group_name"]
        )
    ),
) -> None:
    async with db.tenant_session() as session:
        try:
            await NotificationGroup.rename_group_or_raise(
                session=session, group_id=group_id, new_group_name=new_group_name
            )
        except NotificationGroupError as ex:
            raise HTTPException(
                status_code=fastapi.status.HTTP_400_BAD_REQUEST, detail=str(ex)
            )


@notification_group_router.delete("/delete_group/{group_id}")
async def delete_notification_group(
    group_id: int,
    _app_user: auth_models.AppUser = Depends(auth.admin_user_role_guard),
    db: database.Database = Depends(get_backend_database),
    access: AccessRestrictions = Depends(auth.get_user_access_restrictions),
    _access_logger: AccessLogger = Depends(
        AccessLogger(UserActions.DELETED_NOTIFICATION_GROUP, ["group_id"])
    ),
) -> None:
    async with db.tenant_session() as session:
        try:
            await NotificationGroup.delete_group_or_raise(session, group_id)
        except NotificationGroupError as ex:
            raise HTTPException(
                status_code=fastapi.status.HTTP_400_BAD_REQUEST, detail=str(ex)
            )


@notification_group_router.post("/new_group_member")
async def add_notification_group_member(
    add_request: AddNotificationGroupMemberRequest,
    _app_user: auth_models.AppUser = Depends(auth.admin_user_role_guard),
    access: AccessRestrictions = Depends(auth.get_user_access_restrictions),
    db: database.Database = Depends(get_backend_database),
    _access_logger: AccessLogger = Depends(
        AccessLogger(
            UserActions.ADDED_NOTIFICATION_GROUP_MEMBER,
            ["user_name", "email", "group_id"],
        )
    ),
) -> int:
    async with db.tenant_session() as session:
        await check_notification_group_access(
            session, add_request.notification_group_member.group_id
        )
        notification_group_member = await NotificationGroupMember.new_group_member(
            session,
            models.NotificationGroupMemberCreate(
                **add_request.notification_group_member.dict()
            ),
        )
    return notification_group_member.id


@notification_group_router.post("/update_group_member/{group_member_id}")
async def update_notification_group_member(
    group_member_id: int,
    update_request: UpdateNotificationGroupMemberRequest,
    _app_user: auth_models.AppUser = Depends(auth.admin_user_role_guard),
    db: database.Database = Depends(get_backend_database),
    access: AccessRestrictions = Depends(auth.get_user_access_restrictions),
    _access_logger: AccessLogger = Depends(
        AccessLogger(
            UserActions.UPDATED_NOTIFICATION_GROUP_MEMBER,
            ["group_member_id", "email", "user_name"],
        )
    ),
) -> None:
    async with db.tenant_session() as session:
        try:
            await NotificationGroupMember.update_group_member_or_raise(
                session,
                group_member_id,
                models.NotificationGroupMemberUpdate(
                    **update_request.notification_group_member.dict()
                ),
            )
        except NotificationGroupError as ex:
            raise HTTPException(
                status_code=fastapi.status.HTTP_400_BAD_REQUEST, detail=str(ex)
            )


@notification_group_router.delete("/delete_group_member/{group_member_id}")
async def delete_notification_group_member(
    group_member_id: int,
    _app_user: auth_models.AppUser = Depends(auth.admin_user_role_guard),
    db: database.Database = Depends(get_backend_database),
    access: AccessRestrictions = Depends(auth.get_user_access_restrictions),
    _access_logger: AccessLogger = Depends(
        AccessLogger(UserActions.DELETED_NOTIFICATION_GROUP_MEMBER, ["group_member_id"])
    ),
) -> None:
    async with db.tenant_session() as session:
        try:
            await NotificationGroupMember.delete_group_member_or_raise(
                session, group_member_id
            )
        except NotificationGroupError as ex:
            raise HTTPException(
                status_code=fastapi.status.HTTP_400_BAD_REQUEST, detail=str(ex)
            )
