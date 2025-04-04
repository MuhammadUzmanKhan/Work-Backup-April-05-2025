from unittest.mock import Mock

from httpx import AsyncClient

from backend.kiosk.models import (
    CreateKioskRequest,
    RenameKioskRequest,
    ShareKioskRequest,
    UpdateKioskStatusRequest,
    UpdateWallsForKioskRequest,
)
from backend.test.factory_types import RandomStringFactory
from backend.test.kiosk.factory_types import KioskFromRequestFactory, WallFactory
from backend.test.kiosk.test_utils import (
    send_create_request,
    send_delete_request,
    send_list_request,
    send_regenerate_request,
    send_rename_request,
    send_share_request,
    send_update_status_request,
    send_update_walls_request,
)


async def test_create(create_kiosk_from_request: KioskFromRequestFactory) -> None:
    kiosk_id = await create_kiosk_from_request("kiosk_name")
    assert kiosk_id == 1


async def test_create_with_invalid_wall(
    kiosk_client: AsyncClient, create_wall: WallFactory
) -> None:
    wall_ids = [
        # One valid wall
        (await create_wall()).id,
        # One invalid wall
        20012312,
    ]

    response = await send_create_request(
        kiosk_client,
        CreateKioskRequest(
            name="kiosk_name", rotate_frequency_s=2.0, wall_ids=wall_ids
        ),
    )

    assert response.status_code == 400


async def test_list(
    kiosk_client: AsyncClient, create_kiosk_from_request: KioskFromRequestFactory
) -> None:
    kiosk_id = await create_kiosk_from_request("kiosk_name")
    kiosk_id2 = await create_kiosk_from_request("kiosk_name2")

    response = await send_list_request(kiosk_client)
    assert response.status_code == 200
    response_json = response.json()
    assert len(response_json["kiosks"]) == 2
    assert response_json["kiosks"][0]["kiosk"]["id"] == kiosk_id
    assert response_json["kiosks"][0]["kiosk"]["name"] == "kiosk_name"
    assert response_json["kiosks"][1]["kiosk"]["id"] == kiosk_id2
    assert response_json["kiosks"][1]["kiosk"]["name"] == "kiosk_name2"


async def test_delete(
    kiosk_client: AsyncClient, create_kiosk_from_request: KioskFromRequestFactory
) -> None:
    kiosk_id = await create_kiosk_from_request("kiosk_name")
    # There has to be one kiosk
    response = await send_list_request(kiosk_client)
    assert response.status_code == 200
    response_json = response.json()
    assert len(response_json["kiosks"]) == 1

    response = await send_delete_request(kiosk_client, kiosk_id=kiosk_id)
    assert response.status_code == 200

    # There has to be no kiosks left
    response = await send_list_request(kiosk_client)
    assert response.status_code == 200
    response_json = response.json()
    assert len(response_json["kiosks"]) == 0


async def test_delete_invalid_kiosk(kiosk_client: AsyncClient) -> None:
    response = await send_delete_request(kiosk_client, kiosk_id=1234)
    assert response.status_code == 400


async def _update_and_check_walls(
    kiosk_client: AsyncClient, kiosk_id: int, new_wall_ids: list[int]
) -> None:
    # Request to update the walls.
    response = await send_update_walls_request(
        kiosk_client,
        request=UpdateWallsForKioskRequest(
            kiosk_id=kiosk_id, wall_ids=new_wall_ids, rotate_frequency_s=2.0
        ),
    )
    assert response.status_code == 200

    # Check that the kiosk has the new walls now.
    response = await send_list_request(kiosk_client)
    assert response.status_code == 200
    response_json = response.json()
    got_wall_ids = [wall["id"] for wall in response_json["kiosks"][0]["kiosk"]["walls"]]

    # Note that the order has to be the same as well
    assert got_wall_ids == new_wall_ids


async def test_update_walls_add_wall(
    kiosk_client: AsyncClient,
    create_kiosk_from_request: KioskFromRequestFactory,
    create_wall: WallFactory,
) -> None:
    kiosk_id = await create_kiosk_from_request("kiosk_name", wall_count=2)

    # Check that the kiosk has the correct walls.
    response = await send_list_request(kiosk_client)
    response_json = response.json()
    assert len(response_json["kiosks"][0]["kiosk"]["walls"]) == 2

    orig_wall_ids = [
        wall["id"] for wall in response_json["kiosks"][0]["kiosk"]["walls"]
    ]

    # Create a new wall.
    wall = await create_wall()
    new_wall_ids = orig_wall_ids + [wall.id]

    await _update_and_check_walls(kiosk_client, kiosk_id, new_wall_ids=new_wall_ids)


async def test_update_walls_reset_to_new_wall(
    kiosk_client: AsyncClient,
    create_kiosk_from_request: KioskFromRequestFactory,
    create_wall: WallFactory,
) -> None:
    kiosk_id = await create_kiosk_from_request("kiosk_name", wall_count=2)

    # Check that the kiosk has the correct walls.
    response = await send_list_request(kiosk_client)
    response_json = response.json()
    assert len(response_json["kiosks"][0]["kiosk"]["walls"]) == 2

    # Create a new wall.
    wall = await create_wall()
    new_wall_ids = [wall.id]

    await _update_and_check_walls(kiosk_client, kiosk_id, new_wall_ids=new_wall_ids)


async def test_update_walls_reset_to_no_wall(
    kiosk_client: AsyncClient, create_kiosk_from_request: KioskFromRequestFactory
) -> None:
    kiosk_id = await create_kiosk_from_request("kiosk_name", wall_count=2)
    await _update_and_check_walls(kiosk_client, kiosk_id, new_wall_ids=[])


async def test_update_walls_reset_to_invalid_wall(
    kiosk_client: AsyncClient, create_kiosk_from_request: KioskFromRequestFactory
) -> None:
    kiosk_id = await create_kiosk_from_request("kiosk_name", wall_count=2)

    # Request to update the walls with an invalid wall id.
    response = await send_update_walls_request(
        kiosk_client,
        request=UpdateWallsForKioskRequest(
            kiosk_id=kiosk_id, wall_ids=[20012312], rotate_frequency_s=2.0
        ),
    )
    assert response.status_code == 400


async def test_rename(
    kiosk_client: AsyncClient, create_kiosk_from_request: KioskFromRequestFactory
) -> None:
    kiosk_id = await create_kiosk_from_request("kiosk_name")

    # Check that the kiosk has the correct name.
    response = await send_list_request(kiosk_client)
    response_json = response.json()
    assert response_json["kiosks"][0]["kiosk"]["name"] == "kiosk_name"

    # Request to rename the kiosk.
    response = await send_rename_request(
        kiosk_client, request=RenameKioskRequest(kiosk_id=kiosk_id, name="new_name")
    )
    assert response.status_code == 200

    # Check that the kiosk has the new name now.
    response = await send_list_request(kiosk_client)
    response_json = response.json()
    assert response_json["kiosks"][0]["kiosk"]["name"] == "new_name"


async def test_rename_invalid_kiosk(kiosk_client: AsyncClient) -> None:
    response = await send_rename_request(
        kiosk_client, request=RenameKioskRequest(kiosk_id=1234, name="new_name")
    )
    assert response.status_code == 400


async def test_update_status(
    kiosk_client: AsyncClient, create_kiosk_from_request: KioskFromRequestFactory
) -> None:
    kiosk_id = await create_kiosk_from_request("kiosk_name")

    # Check that the kiosk is enabled.
    response = await send_list_request(kiosk_client)
    response_json = response.json()
    assert response_json["kiosks"][0]["kiosk"]["is_enabled"] is True

    # Request to disable the kiosk.
    response = await send_update_status_request(
        kiosk_client,
        request=UpdateKioskStatusRequest(kiosk_id=kiosk_id, is_enabled=False),
    )
    assert response.status_code == 200

    # Check that the kiosk is disabled now.
    response = await send_list_request(kiosk_client)
    response_json = response.json()
    assert response_json["kiosks"][0]["kiosk"]["is_enabled"] is False

    # Request to enable the kiosk.
    response = await send_update_status_request(
        kiosk_client,
        request=UpdateKioskStatusRequest(kiosk_id=kiosk_id, is_enabled=True),
    )
    assert response.status_code == 200

    # Check that the kiosk is enabled now.
    response = await send_list_request(kiosk_client)
    response_json = response.json()
    assert response_json["kiosks"][0]["kiosk"]["is_enabled"] is True


async def test_update_status_invalid_kiosk(kiosk_client: AsyncClient) -> None:
    response = await send_update_status_request(
        kiosk_client, request=UpdateKioskStatusRequest(kiosk_id=1234, is_enabled=True)
    )
    assert response.status_code == 400

    response = await send_update_status_request(
        kiosk_client, request=UpdateKioskStatusRequest(kiosk_id=1234, is_enabled=False)
    )
    assert response.status_code == 400


async def test_regenerate(
    kiosk_client: AsyncClient, create_kiosk_from_request: KioskFromRequestFactory
) -> None:
    kiosk_id = await create_kiosk_from_request("kiosk_name")

    # Check that the kiosk has a hash.
    response = await send_list_request(kiosk_client)
    response_json = response.json()
    assert response_json["kiosks"][0]["kiosk"]["hash"] is not None
    old_hash = response_json["kiosks"][0]["kiosk"]["hash"]

    # Request to regenerate the hash.
    response = await send_regenerate_request(kiosk_client, kiosk_id=kiosk_id)
    assert response.status_code == 200

    # Check that the kiosk has a new hash now.
    response = await send_list_request(kiosk_client)
    response_json = response.json()
    assert response_json["kiosks"][0]["kiosk"]["hash"] is not None
    assert response_json["kiosks"][0]["kiosk"]["hash"] != old_hash


async def test_regenerate_invalid_kiosk(kiosk_client: AsyncClient) -> None:
    response = await send_regenerate_request(kiosk_client, kiosk_id=1234)
    assert response.status_code == 400


async def test_share(
    kiosk_client: AsyncClient,
    create_kiosk_from_request: KioskFromRequestFactory,
    email_client_mock: Mock,
    create_email: RandomStringFactory,
) -> None:
    recipient_email = create_email()
    kiosk_id = await create_kiosk_from_request("kiosk_name")

    # Request to share the kiosk.
    response = await send_share_request(
        kiosk_client,
        request=ShareKioskRequest(kiosk_id=kiosk_id, recipient_email=recipient_email),
    )
    assert response.status_code == 200

    # Check that the recipient got an email
    assert email_client_mock.send_support_email.call_count == 1
    assert (
        email_client_mock.send_support_email.call_args.kwargs["recipient"]
        == recipient_email
    )


async def test_share_invalid_kiosk(
    kiosk_client: AsyncClient, create_email: RandomStringFactory
) -> None:
    response = await send_share_request(
        kiosk_client,
        request=ShareKioskRequest(kiosk_id=1234, recipient_email=create_email()),
    )
    assert response.status_code == 400
