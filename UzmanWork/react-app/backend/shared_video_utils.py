from backend.database import database, models, orm
from backend.database.models import SharedVideoCreate
from backend.database.session import TenantAwareAsyncSession


class VideoClipRequestError(Exception):
    pass


async def create_or_retrieve_video_clip(
    clip_data_metadata: models.ClipDataCreate, db: database.Database, tenant: str
) -> models.ClipData:
    async with db.tenant_session(tenant=tenant) as session:
        cameras = await orm.Camera.get_cameras_from_mac_addresses(
            session, {clip_data_metadata.mac_address}
        )
        if len(cameras) == 0:
            raise VideoClipRequestError(
                f"Camera {clip_data_metadata.mac_address} not found."
            )

        clip_data_row = await orm.orm_clip_data.ClipData.create_or_retrieve_clip_data(
            session, clip_data_metadata
        )
        await session.flush()
        clip_data = models.ClipData.from_orm(clip_data_row)

    return clip_data


async def create_shared_video(
    session: TenantAwareAsyncSession, shared_video_data: SharedVideoCreate
) -> models.SharedVideo:
    """Share the alert video with the user."""
    shared_video_unique_hash = await orm.SharedVideo.create_shared_video(
        session, shared_video_data
    )
    shared_video = await orm.SharedVideo.system_get_shared_video(
        session, shared_video_unique_hash
    )
    return models.SharedVideo.from_orm(shared_video)
