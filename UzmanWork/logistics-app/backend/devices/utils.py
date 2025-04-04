from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from backend.database import orm
from backend.database.session import TenantAwareAsyncSession
from backend.models import AccessRestrictions


async def unassign_camera_from_tenant(mac_address: str, session: AsyncSession) -> None:
    await orm.WallTile.system_remove_camera_from_all_tiles(session, mac_address)
    await orm.AccessPoint.system_delete_all_relations_with_camera(session, mac_address)
    await orm.Camera.system_unassign_camera(session, mac_address)


async def user_has_access_to_location(
    session: TenantAwareAsyncSession, location_id: int
) -> bool:
    location = await orm.Location.get_location_owner(session, location_id)
    if location is None:
        return False
    return location.tenant == session.tenant


async def check_nvr_access(
    session: TenantAwareAsyncSession, access: AccessRestrictions, nvr_uuid: str
) -> None:
    if not await orm.NVR.get_nvr_by_uuid(session, nvr_uuid, access):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="NVR not found"
        )
