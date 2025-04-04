from fastapi import FastAPI
from httpx import AsyncClient

from backend import auth
from backend.database.models import NVR, Camera, CameraGroup, RegisterThumbnailsRequest
from backend.models import AccessRestrictions, EventsIngestionResponse
from backend.test.client_request import send_post_request
from backend.test.factory_types import (
    CameraFactory,
    NVRDefaultFactory,
    ThumbnailFactory,
)
from backend.test.thumbnail.thumbnail_factory_types import ThumbnailCreateFactory
from backend.thumbnail.models import (
    OptionalThumbnailResponse,
    ThumbnailResponse,
    ThumbnailTimestampRequest,
)
from backend.utils import AwareDatetime


async def test_register_thumbnail(
    thumbnail_client: AsyncClient,
    create_thumbnail_create: ThumbnailCreateFactory,
    camera: Camera,
) -> None:
    await send_post_request(
        thumbnail_client,
        "/register_thumbnails",
        RegisterThumbnailsRequest(
            thumbnails=[await create_thumbnail_create(camera.mac_address)]
        ),
    )


async def test_register_thumbnail_wrong_mac_address(
    thumbnail_client: AsyncClient,
    create_thumbnail_create: ThumbnailCreateFactory,
    camera_group: CameraGroup,
    create_nvr_default: NVRDefaultFactory,
    create_camera: CameraFactory,
) -> None:
    nvr = await create_nvr_default()
    camera = await create_camera(camera_group.id, nvr.uuid)
    resp = await send_post_request(
        thumbnail_client,
        "/register_thumbnails",
        RegisterThumbnailsRequest(
            thumbnails=[await create_thumbnail_create(camera.mac_address)]
        ),
    )
    ingestion_result = EventsIngestionResponse.parse_obj(resp.json())
    assert ingestion_result.num_events_ingested == 0


async def test_retrieve_most_recent_thumbnails_not_found(
    thumbnail_client: AsyncClient,
    camera_group: CameraGroup,
    nvr: NVR,
    create_camera: CameraFactory,
) -> None:
    cameras = [await create_camera(camera_group.id, nvr.uuid) for _ in range(3)]
    resp = await send_post_request(
        thumbnail_client,
        "/most_recent_thumbnails",
        request=[camera.mac_address for camera in cameras],
    )
    assert len(resp.json()) == 0


async def test_retrieve_most_recent_thumbnails(
    thumbnail_client: AsyncClient,
    camera_group: CameraGroup,
    nvr: NVR,
    create_camera: CameraFactory,
    create_thumbnail_create: ThumbnailCreateFactory,
) -> None:
    cameras = []
    for _ in range(3):
        camera = await create_camera(camera_group.id, nvr.uuid)
        cameras.append(camera)
        await send_post_request(
            thumbnail_client,
            "/register_thumbnails",
            RegisterThumbnailsRequest(
                thumbnails=[await create_thumbnail_create(camera.mac_address)]
            ),
        )

    resp = await send_post_request(
        thumbnail_client,
        "/most_recent_thumbnails",
        [camera.mac_address for camera in cameras],
    )
    data = resp.json()
    for camera in cameras:
        assert camera.mac_address in data
        thumbnail_response = ThumbnailResponse.parse_obj(data[camera.mac_address])
        assert thumbnail_response.s3_path is not None


async def test_retrieve_most_recent_thumbnails_no_access(
    app: FastAPI,
    thumbnail_client: AsyncClient,
    camera_group: CameraGroup,
    nvr: NVR,
    create_camera: CameraFactory,
    create_thumbnail_create: ThumbnailCreateFactory,
) -> None:
    cameras = []
    for _ in range(3):
        camera = await create_camera(camera_group.id, nvr.uuid)
        cameras.append(camera)
        await send_post_request(
            thumbnail_client,
            "/register_thumbnails",
            RegisterThumbnailsRequest(
                thumbnails=[await create_thumbnail_create(camera.mac_address)]
            ),
        )

    # Set access restrictions to no access, so that the user can't access the thumbnails
    app.dependency_overrides[auth.get_user_access_restrictions] = (
        lambda: AccessRestrictions(full_access=False)
    )
    resp = await send_post_request(
        thumbnail_client,
        "/most_recent_thumbnails",
        [camera.mac_address for camera in cameras],
    )
    data = resp.json()
    assert len(data) == 0


async def test_query_thumbnails_timestamps(
    thumbnail_client: AsyncClient,
    camera_group: CameraGroup,
    nvr: NVR,
    create_camera: CameraFactory,
    create_thumbnail: ThumbnailFactory,
) -> None:
    num_cameras = 3
    cameras = []
    for _ in range(num_cameras):
        camera = await create_camera(camera_group.id, nvr.uuid)
        await create_thumbnail(camera.mac_address)
        cameras.append(camera)

    resp = await send_post_request(
        thumbnail_client,
        "/query_thumbnails_timestamps",
        [
            ThumbnailTimestampRequest(
                mac_address=camera.mac_address,
                timestamp=AwareDatetime.utcnow(),
                tolerance_s=30,
            )
            for camera in cameras
        ],
    )
    data = resp.json()
    for i in range(num_cameras):
        thumbnail_response = OptionalThumbnailResponse.parse_obj(data[i])
        assert thumbnail_response.response is not None


async def test_query_thumbnails_timestamps_not_found(
    thumbnail_client: AsyncClient,
    camera_group: CameraGroup,
    nvr: NVR,
    create_camera: CameraFactory,
) -> None:
    num_cameras = 3
    cameras = []
    for _ in range(num_cameras):
        camera = await create_camera(camera_group.id, nvr.uuid)
        cameras.append(camera)

    resp = await send_post_request(
        thumbnail_client,
        "/query_thumbnails_timestamps",
        [
            ThumbnailTimestampRequest(
                mac_address=camera.mac_address,
                timestamp=AwareDatetime.utcnow(),
                tolerance_s=30,
            )
            for camera in cameras
        ],
    )
    data = resp.json()
    for i in range(num_cameras):
        thumbnail_response = OptionalThumbnailResponse.parse_obj(data[i])
        assert thumbnail_response.response is None
