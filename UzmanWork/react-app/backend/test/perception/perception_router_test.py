from fastapi import status
from httpx import AsyncClient

from backend.database.models import Camera, CameraGroup, PerceptionObjectCreate
from backend.models import EventsIngestionResponse
from backend.perception.models import PerceptionEvent, PerceptionEventsRequest
from backend.test.client_request import send_post_request
from backend.test.factory_types import CameraFactory, NVRDefaultFactory
from backend.utils import AwareDatetime


# TODO(@lberg): remove after VAS-2119 is resolved
async def test_add_perception_legacy(
    perception_client: AsyncClient,
    perception_object_create: PerceptionObjectCreate,
    camera: Camera,
) -> None:
    resp = await send_post_request(
        perception_client,
        "/",
        {
            "perception_event_data_batch": [
                PerceptionEvent(
                    time=AwareDatetime.utcnow(), mac_address=camera.mac_address
                )
            ],
            "detection_objects_batch": [[perception_object_create]],
        },
    )

    ingestion_result = EventsIngestionResponse.parse_obj(resp.json())
    assert ingestion_result.num_events_ingested == 1


# TODO(@lberg): remove after VAS-2119 is resolved
async def test_add_perception_legacy_different_len(
    perception_client: AsyncClient,
    perception_object_create: PerceptionObjectCreate,
    camera: Camera,
) -> None:
    await send_post_request(
        perception_client,
        "/",
        {
            "perception_event_data_batch": [
                PerceptionEvent(
                    time=AwareDatetime.utcnow(), mac_address=camera.mac_address
                ),
                PerceptionEvent(
                    time=AwareDatetime.utcnow(), mac_address=camera.mac_address
                ),
            ],
            "detection_objects_batch": [[perception_object_create]],
        },
        expected_status_code=status.HTTP_400_BAD_REQUEST,
    )


async def test_add_perception(
    perception_client: AsyncClient,
    perception_object_create: PerceptionObjectCreate,
    camera: Camera,
) -> None:
    resp = await send_post_request(
        perception_client,
        "/",
        {
            "perception_events_request": PerceptionEventsRequest(
                events=[
                    PerceptionEvent(
                        time=AwareDatetime.utcnow(),
                        mac_address=camera.mac_address,
                        objects=[perception_object_create],
                    )
                ]
            )
        },
    )

    ingestion_result = EventsIngestionResponse.parse_obj(resp.json())
    assert ingestion_result.num_events_ingested == 1


async def test_add_perception_wrong_mac_address(
    perception_client: AsyncClient,
    perception_object_create: PerceptionObjectCreate,
    camera_group: CameraGroup,
    create_nvr_default: NVRDefaultFactory,
    create_camera: CameraFactory,
) -> None:
    nvr = await create_nvr_default()
    camera = await create_camera(camera_group.id, nvr.uuid)
    resp = await send_post_request(
        perception_client,
        "/",
        {
            "perception_events_request": PerceptionEventsRequest(
                events=[
                    PerceptionEvent(
                        time=AwareDatetime.utcnow(),
                        mac_address=camera.mac_address,
                        objects=[perception_object_create],
                    )
                ]
            )
        },
    )

    ingestion_result = EventsIngestionResponse.parse_obj(resp.json())
    assert ingestion_result.num_events_ingested == 0
