from fastapi import HTTPException, status
from sqlalchemy import exc

from backend.database import database, orm
from backend.database.models import CameraFlag, CamerasQueryConfig


class AudioToggleUpdateError(Exception):
    pass


async def toggle_audio_org_cameras_or_fail(db: database.Database, enable: bool) -> None:
    async with db.tenant_session() as session:
        try:
            cameras = await orm.Camera.get_cameras(session, CamerasQueryConfig())
            await orm.Camera.update_cameras_flag(
                session,
                [camera.camera.mac_address for camera in cameras],
                CameraFlag.IS_AUDIO_ENABLED,
                enable,
            )
        except exc.SQLAlchemyError as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Failed to update cameras audio setting with {e}",
            )


async def toggle_webrtc_org_cameras_or_fail(
    db: database.Database, enable: bool
) -> None:
    async with db.tenant_session() as session:
        try:
            cameras = await orm.Camera.get_cameras(session, CamerasQueryConfig())
            await orm.Camera.update_cameras_flag(
                session,
                [camera.camera.mac_address for camera in cameras],
                CameraFlag.WEBRTC_ENABLED,
                enable,
            )
        except exc.SQLAlchemyError as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Failed to update cameras audio setting with {e}",
            )
