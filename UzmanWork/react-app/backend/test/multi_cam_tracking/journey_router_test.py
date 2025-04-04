from datetime import timedelta

from httpx import AsyncClient
from pytest_mock import MockerFixture

from backend.database import database, orm
from backend.database.models import (
    VALID_EMBEDDING_DIMS,
    Camera,
    DetectionObjectType,
    MctImageCreate,
    PerceptionObjectCreate,
    RegisterMctImagesRequest,
)
from backend.database.organization_models import Organization
from backend.multi_cam_tracking.models import TracksThumbnailRequest
from backend.perception.models import PerceptionEvent
from backend.test.client_request import send_post_request
from backend.test.database.mct_image_test import generate_mct_image_batch
from backend.utils import AwareDatetime


def _generate_mct_image_with_detections_batch(
    camera: Camera, start_time: AwareDatetime | None = None
) -> list[tuple[MctImageCreate, PerceptionEvent]]:
    start_time = start_time or AwareDatetime.utcnow() - timedelta(days=1)
    data = []
    for i in range(100):
        time = start_time + timedelta(seconds=i)
        mct_image = MctImageCreate(
            timestamp=time,
            camera_mac_address=camera.mac_address,
            s3_path="s3://test/test.jpg",
            track_id=i,
            perception_stack_start_id="test",
        )
        perception_event = PerceptionEvent(
            time=time,
            mac_address=camera.mac_address,
            perception_stack_start_id="test",
            objects=[
                PerceptionObjectCreate(
                    x_min=0,
                    x_max=1,
                    y_min=0,
                    y_max=1,
                    confidence=1.0,
                    is_moving=True,
                    track_age_s=1,
                    track_id=i,
                    idx_in_frame=None,
                    object_idx=0,
                    object_type=DetectionObjectType.PERSON,
                )
            ],
        )

        data.append((mct_image, perception_event))
    return data


async def test_register_embedding_response(
    db_instance: database.Database,
    journey_client: AsyncClient,
    camera: Camera,
    organization: Organization,
) -> None:
    async with db_instance.tenant_session(tenant=organization.tenant) as session:
        await orm.JourneyRequest.add_request(
            session,
            mac_address=camera.mac_address,
            track_id=1,
            perception_stack_start_id="test_perception_stack_start_id",
            search_start_time=AwareDatetime.utcnow(),
            search_end_time=AwareDatetime.utcnow(),
            object_time=AwareDatetime.utcnow(),
        )

    await send_post_request(
        journey_client,
        "/register_embedding_response",
        {"request_id": 1, "embedding": list(range(VALID_EMBEDDING_DIMS[0]))},
    )


async def test_register_journey_response(
    db_instance: database.Database,
    journey_client: AsyncClient,
    camera: Camera,
    organization: Organization,
) -> None:
    async with db_instance.tenant_session(tenant=organization.tenant) as session:
        await orm.JourneyRequest.add_request(
            session,
            mac_address=camera.mac_address,
            track_id=1,
            perception_stack_start_id="test_perception_stack_start_id",
            search_start_time=AwareDatetime.utcnow(),
            search_end_time=AwareDatetime.utcnow(),
            object_time=AwareDatetime.utcnow(),
        )

    await send_post_request(
        journey_client,
        "/register_journey_response",
        {
            "request_id": 1,
            "nvr_uuid": "dummy_uuid",
            "camera_results": [
                {
                    "mac_address": camera.mac_address,
                    "timestamp": AwareDatetime.utcnow(),
                    "object_index": 0,
                    "score": 1.0,
                }
            ],
        },
    )


async def test_register_mct_images(journey_client: AsyncClient, camera: Camera) -> None:
    mct_images = generate_mct_image_batch(camera)

    await send_post_request(
        journey_client,
        "/register_mct_images",
        RegisterMctImagesRequest(mct_images=mct_images),
    )


async def test_register_mct_images_duplicated(
    journey_client: AsyncClient, camera: Camera
) -> None:
    mct_images = generate_mct_image_batch(camera)
    for _ in range(2):
        await send_post_request(
            journey_client,
            "/register_mct_images",
            RegisterMctImagesRequest(mct_images=mct_images),
        )


async def test_retrieve_tracks_thumbnail(
    db_instance: database.Database,
    journey_client: AsyncClient,
    camera: Camera,
    mocker: MockerFixture,
    organization: Organization,
) -> None:
    mocker.patch("backend.multi_cam_tracking.router.get_signed_url", return_value="")

    data = _generate_mct_image_with_detections_batch(camera)
    async with db_instance.tenant_session(tenant=organization.tenant) as session:
        await orm.MctImage.add_mct_image_batch(
            session, [mct_image for mct_image, _ in data]
        )
        await orm.PerceptionObjectEvent.add_event_batch(
            session, [perception_object for _, perception_object in data]
        )

    resp = await send_post_request(
        journey_client,
        "/retrieve_tracks_thumbnail",
        TracksThumbnailRequest(
            mac_address=camera.mac_address,
            start_time=data[0][0].timestamp - timedelta(seconds=1),
            end_time=data[-1][0].timestamp + timedelta(seconds=1),
        ),
    )
    data_resp = resp.json()
    assert len(data) == len(data_resp)
