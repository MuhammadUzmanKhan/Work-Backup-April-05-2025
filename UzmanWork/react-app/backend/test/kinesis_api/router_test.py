import datetime

from httpx import AsyncClient

from backend.database.models import Camera
from backend.escapi.protocol_models import VideoResRequestType
from backend.kinesis_api.models import (
    ClipRequestIdentifier,
    KinesisVideoClipRequest,
    StaticResolutionConfig,
)
from backend.test.client_request import send_post_request
from backend.utils import AwareDatetime

DEFAULT_START_TIME = AwareDatetime(2022, 11, 20, 12, 00, tzinfo=datetime.timezone.utc)
DEFAULT_END_TIME = DEFAULT_START_TIME + datetime.timedelta(minutes=1)


async def test_get_clip_upload_request(
    kinesis_client: AsyncClient, camera: Camera
) -> None:
    clip_request_ids: list[ClipRequestIdentifier] = []
    for _ in range(5):
        response = await send_post_request(
            kinesis_client,
            "get_clip_upload_request",
            KinesisVideoClipRequest(
                mac_address=camera.mac_address,
                start_time=DEFAULT_START_TIME,
                end_time=DEFAULT_END_TIME,
                resolution_config=StaticResolutionConfig(
                    static_resolution=VideoResRequestType.High
                ),
            ),
        )

        clip_request_ids.append(ClipRequestIdentifier.parse_obj(response.json()))

    # make sure all the requests are unique
    assert len(set([clip_id.clip_id for clip_id in clip_request_ids])) == len(
        clip_request_ids
    )


async def test_kinesis_clip_url(kinesis_client: AsyncClient, camera: Camera) -> None:
    response = await send_post_request(
        kinesis_client,
        "get_clip_upload_request",
        KinesisVideoClipRequest(
            mac_address=camera.mac_address,
            start_time=DEFAULT_START_TIME,
            end_time=DEFAULT_END_TIME,
            resolution_config=StaticResolutionConfig(
                static_resolution=VideoResRequestType.High
            ),
        ),
    )
    clip_request_id = ClipRequestIdentifier.parse_obj(response.json())
    await send_post_request(kinesis_client, "clip", clip_request_id)


async def test_abort_kinesis_clip_upload(
    kinesis_client: AsyncClient, camera: Camera
) -> None:
    response = await send_post_request(
        kinesis_client,
        "get_clip_upload_request",
        KinesisVideoClipRequest(
            mac_address=camera.mac_address,
            start_time=DEFAULT_START_TIME,
            end_time=DEFAULT_END_TIME,
            resolution_config=StaticResolutionConfig(
                static_resolution=VideoResRequestType.High
            ),
        ),
    )
    clip_request_id = ClipRequestIdentifier.parse_obj(response.json())

    await send_post_request(kinesis_client, "abort_clip_upload", clip_request_id)
