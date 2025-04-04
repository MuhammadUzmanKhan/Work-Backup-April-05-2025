from fastapi import HTTPException, status

from backend.database import orm
from backend.database.session import TenantAwareAsyncSession


async def check_notification_group_access(
    session: TenantAwareAsyncSession, group_id: int
) -> None:
    if not await orm.NotificationGroup.user_has_access(session, group_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No permission to access the notification group",
        )
