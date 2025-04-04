from pydantic import BaseModel

from backend.database.models import ThumbnailCreate, ThumbnailType
from backend.thumbnail.models import ThumbnailResult
from backend.value_store.value_store import ValueStore


class ThumbnailKey(BaseModel):
    camera_mac_address: str
    thumbnail_type: ThumbnailType

    def to_string_key(self) -> str:
        mac_address = self.camera_mac_address.replace(":", "_")
        return f"most_recent_thumbnail:{mac_address}:{self.thumbnail_type.value}"


async def update_most_recent_thumbnails(
    value_store: ValueStore, thumbnails: list[ThumbnailCreate]
) -> None:
    """Keep the most recent thumbnails in the value store up to date.
    Only updates thumbnails that are more recent
    than the ones stored in the value store.
    """
    most_recent_thumbnails = await get_most_recent_thumbnails(
        value_store,
        [
            ThumbnailKey(
                camera_mac_address=thumbnail.camera_mac_address,
                thumbnail_type=thumbnail.thumbnail_type,
            )
            for thumbnail in thumbnails
        ],
    )

    thumbnails_to_update: list[ThumbnailCreate] = []
    for thumbnail in thumbnails:
        most_recent_thumbnail = most_recent_thumbnails.get(thumbnail.camera_mac_address)
        if (
            most_recent_thumbnail is None
            or thumbnail.timestamp > most_recent_thumbnail.timestamp
        ):
            thumbnails_to_update.append(thumbnail)
            # NOTE(@lberg): ensure that if we have multiple thumbnails
            # for the same camera, we keep the most recent one updated
            most_recent_thumbnails[thumbnail.camera_mac_address] = ThumbnailResult(
                timestamp=thumbnail.timestamp, s3_path=thumbnail.s3_path
            )

    await value_store.set_multiple_models(
        {
            ThumbnailKey(
                camera_mac_address=thumbnail.camera_mac_address,
                thumbnail_type=thumbnail.thumbnail_type,
            ).to_string_key(): ThumbnailResult(
                timestamp=thumbnail.timestamp, s3_path=thumbnail.s3_path
            )
            for thumbnail in thumbnails_to_update
        }
    )


async def get_most_recent_thumbnails(
    value_store: ValueStore, thumbnails_key: list[ThumbnailKey]
) -> dict[str, ThumbnailResult]:

    thumbnails = await value_store.get_multiple_models(
        [thumb_key.to_string_key() for thumb_key in thumbnails_key], ThumbnailResult
    )

    ret = {}
    for thumb_key in thumbnails_key:
        thumb = thumbnails.get(thumb_key.to_string_key())
        if thumb is not None:
            ret[thumb_key.camera_mac_address] = thumb
    return ret
