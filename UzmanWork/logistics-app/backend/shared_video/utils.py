from datetime import timedelta

from fastapi import HTTPException, status
from sqlalchemy import exc
from sqlalchemy.ext.asyncio import AsyncSession

from backend.database import orm
from backend.database.models import CamerasQueryConfig, SharedVideo
from backend.models import CameraResponse
from backend.shared_video.models import SharedLiveStreamData
from backend.utils import AwareDatetime
from backend.value_store.value_store import ValueStore, get_shared_live_stream_key


async def get_camera_unrestricted_or_fail(
    session: AsyncSession, mac_address: str
) -> CameraResponse:
    cameras = await orm.Camera.system_get_cameras(
        session, query_config=CamerasQueryConfig(mac_addresses={mac_address})
    )
    if len(cameras) < 1:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Camera not found for {mac_address=}",
        )

    camera = cameras[0]
    return camera


async def get_shared_video_or_fail(
    session: AsyncSession, unique_hash: str
) -> SharedVideo:
    try:
        return await orm.SharedVideo.system_get_shared_video(session, unique_hash)
    except (exc.NoResultFound, orm.SharedVideoExpiredError):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Shared video not found for {unique_hash=}",
        )


async def get_shared_live_stream_or_fail(
    unique_uuid: str, value_store: ValueStore
) -> SharedLiveStreamData:
    shared_live_stream_data = await value_store.get_model(
        get_shared_live_stream_key(unique_uuid), SharedLiveStreamData
    )
    if shared_live_stream_data is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Shared live stream not found for {unique_uuid=}",
        )
    return shared_live_stream_data


def get_shared_remaining_time_or_fail(
    shared_live_stream_data: SharedLiveStreamData,
) -> timedelta:
    remaining_time = shared_live_stream_data.expiration_time - AwareDatetime.utcnow()
    if remaining_time < timedelta(seconds=0):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Shared live stream expired for {shared_live_stream_data=}",
        )
    return remaining_time
