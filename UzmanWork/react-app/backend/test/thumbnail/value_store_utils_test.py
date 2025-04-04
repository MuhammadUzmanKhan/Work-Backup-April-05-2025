from datetime import timedelta

from backend.database.models import (
    NVR,
    Camera,
    CameraGroup,
    ThumbnailCreate,
    ThumbnailType,
)
from backend.test.factory_types import CameraFactory, RandomStringFactory
from backend.thumbnail.value_store_utils import (
    ThumbnailKey,
    get_most_recent_thumbnails,
    update_most_recent_thumbnails,
)
from backend.utils import AwareDatetime
from backend.value_store.value_store import ValueStore


async def test_update_most_recent_thumbnails_none(
    value_store: ValueStore, camera: Camera, create_s3_url: RandomStringFactory
) -> None:
    thumbnail = ThumbnailCreate(
        timestamp=AwareDatetime.utcnow(),
        camera_mac_address=camera.mac_address,
        s3_path=create_s3_url(),
        thumbnail_type=ThumbnailType.THUMBNAIL,
    )
    await update_most_recent_thumbnails(value_store, [thumbnail])

    entries = await get_most_recent_thumbnails(
        value_store,
        [
            ThumbnailKey(
                camera_mac_address=camera.mac_address,
                thumbnail_type=ThumbnailType.THUMBNAIL,
            )
        ],
    )
    assert entries[camera.mac_address].timestamp == thumbnail.timestamp


async def test_update_most_recent_thumbnails_old(
    value_store: ValueStore, camera: Camera, create_s3_url: RandomStringFactory
) -> None:
    thumbnail_new = ThumbnailCreate(
        timestamp=AwareDatetime.utcnow(),
        camera_mac_address=camera.mac_address,
        s3_path=create_s3_url(),
        thumbnail_type=ThumbnailType.THUMBNAIL,
    )
    await update_most_recent_thumbnails(value_store, [thumbnail_new])
    thumbnail_old = thumbnail_new.copy(
        update={"timestamp": AwareDatetime.utcnow() - timedelta(days=1)}
    )
    await update_most_recent_thumbnails(value_store, [thumbnail_old])

    entries = await get_most_recent_thumbnails(
        value_store,
        [
            ThumbnailKey(
                camera_mac_address=camera.mac_address,
                thumbnail_type=ThumbnailType.THUMBNAIL,
            )
        ],
    )
    assert entries[camera.mac_address].timestamp == thumbnail_new.timestamp


async def test_update_most_recent_thumbnails_newer(
    value_store: ValueStore, camera: Camera, create_s3_url: RandomStringFactory
) -> None:
    thumbnail_old = ThumbnailCreate(
        timestamp=AwareDatetime.utcnow() - timedelta(days=1),
        camera_mac_address=camera.mac_address,
        s3_path=create_s3_url(),
        thumbnail_type=ThumbnailType.THUMBNAIL,
    )
    await update_most_recent_thumbnails(value_store, [thumbnail_old])
    thumbnail_new = thumbnail_old.copy(update={"timestamp": AwareDatetime.utcnow()})
    await update_most_recent_thumbnails(value_store, [thumbnail_new])

    entries = await get_most_recent_thumbnails(
        value_store,
        [
            ThumbnailKey(
                camera_mac_address=camera.mac_address,
                thumbnail_type=ThumbnailType.THUMBNAIL,
            )
        ],
    )
    assert entries[camera.mac_address].timestamp == thumbnail_new.timestamp


async def test_update_most_recent_thumbnails_multiple(
    value_store: ValueStore,
    create_s3_url: RandomStringFactory,
    create_camera: CameraFactory,
    camera_group: CameraGroup,
    nvr: NVR,
) -> None:

    cameras_old = [
        await create_camera(camera_group_id=camera_group.id, nvr_uuid=nvr.uuid)
        for _ in range(5)
    ]

    thumbnails_old = [
        ThumbnailCreate(
            timestamp=AwareDatetime.utcnow() - timedelta(days=1),
            camera_mac_address=camera.mac_address,
            s3_path=create_s3_url(),
            thumbnail_type=ThumbnailType.THUMBNAIL,
        )
        for camera in cameras_old
    ]

    await update_most_recent_thumbnails(value_store, thumbnails_old)

    cameras_new = [
        await create_camera(camera_group_id=camera_group.id, nvr_uuid=nvr.uuid)
        for _ in range(5)
    ]

    all_cameras = cameras_old + cameras_new
    thumbnails_all = [
        ThumbnailCreate(
            timestamp=AwareDatetime.utcnow(),
            camera_mac_address=camera.mac_address,
            s3_path=create_s3_url(),
            thumbnail_type=ThumbnailType.THUMBNAIL,
        )
        for camera in all_cameras
    ]
    await update_most_recent_thumbnails(value_store, thumbnails_all)

    entries = await get_most_recent_thumbnails(
        value_store,
        [
            ThumbnailKey(
                camera_mac_address=camera.mac_address,
                thumbnail_type=ThumbnailType.THUMBNAIL,
            )
            for camera in all_cameras
        ],
    )

    for thumbnail in thumbnails_all:
        assert entries[thumbnail.camera_mac_address].timestamp == thumbnail.timestamp
        assert entries[thumbnail.camera_mac_address].s3_path == thumbnail.s3_path
