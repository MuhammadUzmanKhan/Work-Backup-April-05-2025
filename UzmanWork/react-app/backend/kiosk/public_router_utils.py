from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from backend.database import orm
from backend.database.models import Kiosk
from backend.models import CameraWithOnlineStatus


async def get_cameras_from_mac_addresses_and_kiosk_hash_or_fail(
    session: AsyncSession, kiosk_hash: str, mac_addresses: set[str]
) -> list[CameraWithOnlineStatus]:
    """Note that this is a non-restricted endpoint, so it doesn't check for tenant or
    access restrictions, but it does check for the kiosk hash to authenticate the user.
    """
    can_access = await orm.Kiosk.system_can_access_cameras_with_hash(
        session, kiosk_hash, mac_addresses
    )
    if not can_access:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                f"Cannot access cameras {mac_addresses} with kiosk hash {kiosk_hash}"
            ),
        )

    cameras = await orm.Camera.system_get_cameras_from_mac_addresses(
        session, mac_addresses=mac_addresses
    )
    return [camera.camera for camera in cameras]


async def get_camera_from_mac_addresses_and_kiosk_hash_or_fail(
    session: AsyncSession, kiosk_hash: str, mac_address: str
) -> CameraWithOnlineStatus:
    """Note that this is a non-restricted endpoint, so it doesn't check for tenant or
    access restrictions, but it does check for the kiosk hash to authenticate the user.
    """
    cameras = await get_cameras_from_mac_addresses_and_kiosk_hash_or_fail(
        session, kiosk_hash, {mac_address}
    )
    if len(cameras) != 1:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Camera {mac_address} not found",
        )
    return cameras[0]


async def get_kiosk_by_hash_or_fail(session: AsyncSession, kiosk_hash: str) -> Kiosk:
    """Retrieve all relevant information about a public kiosk.
    Perform a first quick check to see if the kiosk exists.
    """
    if not await orm.Kiosk.system_is_kiosk_available(session, kiosk_hash):
        raise HTTPException(status_code=400, detail="Kiosk not found")
    kiosk = await orm.Kiosk.system_get_kiosk_by_hash(session, kiosk_hash)
    if not kiosk or not kiosk.is_enabled:
        raise HTTPException(status_code=400, detail="Kiosk not found")
    return kiosk
