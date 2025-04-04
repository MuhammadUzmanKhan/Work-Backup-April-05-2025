from httpx import AsyncClient, Response

from backend.escapi.protocol_models import VideoResRequestType
from backend.kinesis_api.models import KinesisVideoLiveRequest, StaticResolutionConfig
from backend.kiosk.models import KioskKeepWallAliveRequest, KioskNextWallRequest
from backend.test.kiosk.factory_types import KioskFromRequestFactory
from backend.test.kiosk.test_utils import (
    send_keep_alive,
    send_kinesis_live_data_kiosk,
    send_list_request,
    send_public_kiosk_next_wall,
    send_public_retrieve_request,
)

RESOLUTION_CONFIG = StaticResolutionConfig(static_resolution=VideoResRequestType.Low)


async def create_kiosk_and_get_hash(
    kiosk_client: AsyncClient,
    create_kiosk_from_request: KioskFromRequestFactory,
    wall_count: int = 2,
) -> tuple[int, str]:
    kiosk_id = await create_kiosk_from_request("kiosk_name", wall_count=wall_count)

    # Get the kiosk hash.
    response = await send_list_request(kiosk_client)
    assert response.status_code == 200
    response_json = response.json()
    assert len(response_json["kiosks"]) == 1
    assert response_json["kiosks"][0]["kiosk"]["id"] == kiosk_id
    kiosk_hash = response_json["kiosks"][0]["kiosk"]["hash"]

    return kiosk_id, kiosk_hash


async def test_public_kiosk_retrieve(
    kiosk_client: AsyncClient,
    kiosk_public_client: AsyncClient,
    create_kiosk_from_request: KioskFromRequestFactory,
) -> None:
    kiosk_id, kiosk_hash = await create_kiosk_and_get_hash(
        kiosk_client, create_kiosk_from_request
    )

    # Request to retrieve the kiosk.
    response = await send_public_retrieve_request(
        kiosk_public_client, kiosk_hash=kiosk_hash
    )
    assert response.status_code == 200

    # Make sure we got the right kiosk
    response_json = response.json()
    assert response_json["kiosk"]["id"] == kiosk_id
    assert response_json["kiosk"]["hash"] == kiosk_hash


async def test_public_kiosk_next_wall_invalid_id(
    kiosk_client: AsyncClient,
    kiosk_public_client: AsyncClient,
    create_kiosk_from_request: KioskFromRequestFactory,
) -> None:
    _, kiosk_hash = await create_kiosk_and_get_hash(
        kiosk_client, create_kiosk_from_request
    )

    # Request to retrieve the next wall with an ID that doesn't exist.
    response = await send_public_kiosk_next_wall(
        kiosk_public_client,
        kiosk_hash=kiosk_hash,
        request=KioskNextWallRequest(
            current_wall_id=1234, resolution_config=RESOLUTION_CONFIG
        ),
    )
    # This should return the first wall since it's possible that someone has
    # removed the wall from the kiosk.
    assert response.status_code == 200


async def test_public_kiosk_next_wall(
    kiosk_client: AsyncClient,
    kiosk_public_client: AsyncClient,
    create_kiosk_from_request: KioskFromRequestFactory,
) -> None:
    _, kiosk_hash = await create_kiosk_and_get_hash(
        kiosk_client, create_kiosk_from_request
    )

    # Request to retrieve the first wall
    response = await send_public_kiosk_next_wall(
        kiosk_public_client,
        kiosk_hash=kiosk_hash,
        request=KioskNextWallRequest(resolution_config=RESOLUTION_CONFIG),
    )

    def _check_and_get_wall_id(response: Response) -> int:
        assert response.status_code == 200
        response_json = response.json()
        return int(response_json["wall"]["id"])

    first_wall_id = _check_and_get_wall_id(response)
    assert first_wall_id == 1

    # Request to retrieve the second wall
    response = await send_public_kiosk_next_wall(
        kiosk_public_client,
        kiosk_hash=kiosk_hash,
        request=KioskNextWallRequest(
            current_wall_id=first_wall_id, resolution_config=RESOLUTION_CONFIG
        ),
    )

    second_wall_id = _check_and_get_wall_id(response)
    assert second_wall_id == 2

    # Now it should wrap around to the first wall again
    response = await send_public_kiosk_next_wall(
        kiosk_public_client,
        kiosk_hash=kiosk_hash,
        request=KioskNextWallRequest(
            current_wall_id=second_wall_id, resolution_config=RESOLUTION_CONFIG
        ),
    )

    third_wall_id = _check_and_get_wall_id(response)
    assert third_wall_id == first_wall_id


async def test_public_kiosk_next_wall_empty(
    kiosk_client: AsyncClient,
    kiosk_public_client: AsyncClient,
    create_kiosk_from_request: KioskFromRequestFactory,
) -> None:
    _, kiosk_hash = await create_kiosk_and_get_hash(
        kiosk_client, create_kiosk_from_request, wall_count=0
    )

    # Request to retrieve the next wall with an invalid ID.
    response = await send_public_kiosk_next_wall(
        kiosk_public_client,
        kiosk_hash=kiosk_hash,
        request=KioskNextWallRequest(resolution_config=RESOLUTION_CONFIG),
    )
    assert response.status_code == 400


async def test_kinesis_live_url_kiosk(
    kiosk_client: AsyncClient,
    kiosk_public_client: AsyncClient,
    create_kiosk_from_request: KioskFromRequestFactory,
) -> None:
    _, kiosk_hash = await create_kiosk_and_get_hash(
        kiosk_client, create_kiosk_from_request
    )

    # Get the first wall tiles
    response = await send_public_kiosk_next_wall(
        kiosk_public_client,
        kiosk_hash=kiosk_hash,
        request=KioskNextWallRequest(resolution_config=RESOLUTION_CONFIG),
    )
    assert response.status_code == 200
    response_json = response.json()

    wall_tiles = response_json["wall_tiles"]
    camera_macs = [
        tile["wall_tile"]["camera_mac_address"]
        for tile in wall_tiles
        if tile["wall_tile"]["camera_mac_address"]
    ]
    assert len(camera_macs) > 0

    # Get the live URL for the first camera of the first wall.
    response = await send_kinesis_live_data_kiosk(
        kiosk_public_client,
        kiosk_hash=kiosk_hash,
        kinesis_request=KinesisVideoLiveRequest(
            mac_address=camera_macs[0],
            resolution_config=RESOLUTION_CONFIG,
            log_live_activity=False,
            prefer_webrtc=False,
        ),
    )

    assert response.status_code == 200


async def test_kinesis_live_url_kiosk_invalid_kiosk_hash(
    kiosk_public_client: AsyncClient,
) -> None:
    # Use invalid kiosk_hash
    response = await send_kinesis_live_data_kiosk(
        kiosk_public_client,
        kiosk_hash="invalid_hash",
        kinesis_request=KinesisVideoLiveRequest(
            mac_address="invalid_mac",
            resolution_config=RESOLUTION_CONFIG,
            log_live_activity=False,
            prefer_webrtc=False,
        ),
    )

    assert response.status_code == 400


async def test_kinesis_live_url_kiosk_invalid_camera(
    kiosk_client: AsyncClient,
    kiosk_public_client: AsyncClient,
    create_kiosk_from_request: KioskFromRequestFactory,
) -> None:
    _, kiosk_hash = await create_kiosk_and_get_hash(
        kiosk_client, create_kiosk_from_request
    )

    # Use invalid camera mac address
    response = await send_kinesis_live_data_kiosk(
        kiosk_public_client,
        kiosk_hash=kiosk_hash,
        kinesis_request=KinesisVideoLiveRequest(
            mac_address="invalid_mac",
            resolution_config=RESOLUTION_CONFIG,
            log_live_activity=False,
            prefer_webrtc=False,
        ),
    )

    assert response.status_code == 400


async def test_keep_alive(
    kiosk_client: AsyncClient,
    kiosk_public_client: AsyncClient,
    create_kiosk_from_request: KioskFromRequestFactory,
) -> None:
    kiosk_id, kiosk_hash = await create_kiosk_and_get_hash(
        kiosk_client, create_kiosk_from_request
    )

    # Request to retrieve the kiosk.
    response = await send_public_retrieve_request(
        kiosk_public_client, kiosk_hash=kiosk_hash
    )
    assert response.status_code == 200

    # Make sure we got the right kiosk
    response_json = response.json()
    assert response_json["kiosk"]["id"] == kiosk_id
    assert response_json["kiosk"]["hash"] == kiosk_hash

    # Request keep alive for all walls in the kiosk
    for wall in response_json["kiosk"]["walls"]:
        wall_id = int(wall["id"])
        response = await send_keep_alive(
            kiosk_public_client,
            kiosk_hash=kiosk_hash,
            request=KioskKeepWallAliveRequest(
                wall_id=wall_id, resolution_config=RESOLUTION_CONFIG, mac_addresses=[]
            ),
        )
        assert response.status_code == 200


async def test_keep_alive_invalid_kiosk_hash(kiosk_public_client: AsyncClient) -> None:
    # Use invalid wall id
    response = await send_keep_alive(
        kiosk_public_client,
        kiosk_hash="invalid_hash",
        request=KioskKeepWallAliveRequest(
            wall_id=1234, resolution_config=RESOLUTION_CONFIG, mac_addresses=[]
        ),
    )
    assert response.status_code == 400


async def test_keep_alive_invalid_wall(
    kiosk_client: AsyncClient,
    kiosk_public_client: AsyncClient,
    create_kiosk_from_request: KioskFromRequestFactory,
) -> None:
    _, kiosk_hash = await create_kiosk_and_get_hash(
        kiosk_client, create_kiosk_from_request
    )

    # Use invalid wall id
    response = await send_keep_alive(
        kiosk_public_client,
        kiosk_hash=kiosk_hash,
        request=KioskKeepWallAliveRequest(
            wall_id=1234, resolution_config=RESOLUTION_CONFIG, mac_addresses=[]
        ),
    )
    # In this case we don't fail, it is just a noop, since there will be no
    # cameras for this wall.
    assert response.status_code == 200
