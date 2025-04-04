import datetime
from unittest.mock import AsyncMock

from fastapi import FastAPI
from httpx import AsyncClient
from pydantic import EmailStr
from pytest_mock import MockerFixture

from backend.database.models import Camera
from backend.dependencies import get_email_client, get_sms_client
from backend.escapi.protocol_models import VideoResRequestType
from backend.kinesis_api.models import StaticResolutionConfig
from backend.shared_video.models import (
    SharedLiveStreamData,
    SharedLiveStreamKeepAliveRequest,
    SharedLiveStreamRequest,
    SharedLiveStreamResponse,
)
from backend.test.client_request import send_get_request, send_post_request
from backend.value_store.value_store import ValueStore, get_shared_live_stream_key


def _get_live_stream_request(
    mac_address: str, expiration_seconds: int
) -> SharedLiveStreamRequest:
    return SharedLiveStreamRequest(
        mac_address=mac_address,
        email_address=EmailStr("bla@gmail.com"),
        phone_number="+12012222222",
        message="Hello World!",
        user_name="Jane Doe",
        expiration_seconds=expiration_seconds,
    )


async def test_share_live_video(
    shared_video_client: AsyncClient,
    camera: Camera,
    shared_video_app: FastAPI,
    value_store: ValueStore,
) -> None:
    mock_sms_client = AsyncMock()
    mock_email_client = AsyncMock()
    shared_video_app.dependency_overrides[get_sms_client] = lambda: mock_sms_client
    shared_video_app.dependency_overrides[get_email_client] = lambda: mock_email_client

    request = _get_live_stream_request(
        camera.mac_address, int(datetime.timedelta(days=1).total_seconds())
    )

    response = await send_post_request(
        shared_video_client, "/shared_videos/live", request
    )

    stream_uuid = response.json()

    data = await value_store.get_model(
        get_shared_live_stream_key(stream_uuid), SharedLiveStreamData
    )
    assert data is not None
    assert data.mac_address == camera.mac_address
    assert mock_email_client.send_support_email.call_count == 1


async def test_retrieve_shared_live_stream_info(
    shared_video_client: AsyncClient, camera: Camera, shared_video_app: FastAPI
) -> None:
    shared_video_app.dependency_overrides[get_sms_client] = lambda: AsyncMock()
    shared_video_app.dependency_overrides[get_email_client] = lambda: AsyncMock()

    request = _get_live_stream_request(
        camera.mac_address, int(datetime.timedelta(days=1).total_seconds())
    )

    response = await send_post_request(
        shared_video_client, "/shared_videos/live", request
    )

    stream_uuid = response.json()

    response = await send_get_request(
        shared_video_client, f"/shared_videos_public/info/live/{stream_uuid}"
    )

    data = SharedLiveStreamResponse.parse_obj(response.json())
    assert data.live_stream_name == camera.stream_hash


async def test_retrieve_shared_live_stream_info_unexistent(
    shared_video_client: AsyncClient,
) -> None:
    response = await shared_video_client.get(
        "/shared_videos_public/info/live/not_there"
    )
    assert response.status_code == 400


async def test_exchange_for_url_live_stream(
    shared_video_client: AsyncClient, camera: Camera, shared_video_app: FastAPI
) -> None:
    shared_video_app.dependency_overrides[get_sms_client] = lambda: AsyncMock()
    shared_video_app.dependency_overrides[get_email_client] = lambda: AsyncMock()

    request = _get_live_stream_request(
        camera.mac_address, int(datetime.timedelta(days=1).total_seconds())
    )

    response = await send_post_request(
        shared_video_client, "/shared_videos/live", request
    )

    stream_uuid = response.json()

    response = await send_post_request(
        shared_video_client,
        f"/shared_videos_public/exchange/live/{stream_uuid}",
        {
            "resolution_config": StaticResolutionConfig(
                static_resolution=VideoResRequestType.High
            ),
            "prefer_webrtc": False,
        },
    )


async def test_keep_alive_live_stream(
    shared_video_client: AsyncClient,
    camera: Camera,
    shared_video_app: FastAPI,
    mocker: MockerFixture,
) -> None:
    shared_video_app.dependency_overrides[get_sms_client] = lambda: AsyncMock()
    shared_video_app.dependency_overrides[get_email_client] = lambda: AsyncMock()

    request = _get_live_stream_request(
        camera.mac_address, int(datetime.timedelta(days=1).total_seconds())
    )

    response = await send_post_request(
        shared_video_client, "/shared_videos/live", request
    )
    stream_uuid = response.json()

    patched_enqueue = mocker.patch(
        "backend.shared_video.router.put_msg_to_queue_for_live_request"
    )

    response = await send_post_request(
        shared_video_client,
        f"/shared_videos_public/live/keep_alive/{stream_uuid}",
        SharedLiveStreamKeepAliveRequest(
            resolution_config=StaticResolutionConfig(
                static_resolution=VideoResRequestType.High
            )
        ),
    )
    assert patched_enqueue.call_count == 1
