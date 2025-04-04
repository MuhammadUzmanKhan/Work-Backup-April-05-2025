from fastapi import HTTPException

from backend import auth, auth_models
from backend.database import orm
from backend.database.session import TenantAwareAsyncSession
from backend.kiosk.utils import KioskAction


async def check_user_is_allowed(
    session: TenantAwareAsyncSession,
    kiosk_id: int,
    app_user: auth_models.AppUser,
    action: KioskAction,
) -> None:
    if not await orm.Kiosk.check_user_is_allowed(
        session=session,
        kiosk_id=kiosk_id,
        user_email=app_user.user_email,
        is_user_admin=(app_user.role == auth.UserRole.ADMIN),
        action=action,
    ):
        raise HTTPException(status_code=400, detail="User can't perform this action")
