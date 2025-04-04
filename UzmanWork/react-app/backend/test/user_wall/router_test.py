import pytest
import pytest_asyncio
from fastapi import FastAPI
from fastapi.encoders import jsonable_encoder
from httpx import AsyncClient, Response
from pydantic import ValidationError
from sqlalchemy import exc

from backend.database.organization_models import Organization
from backend.test.factory_types import CameraDefaultFactory
from backend.user_wall.models import (
    CreateWallRequest,
    ShareWallRequest,
    UnshareWallRequest,
    WallTile,
)

USER_WALL_ENDPOINT = "http://localhost/user_wall"


async def send_create_request(app: FastAPI, request: CreateWallRequest) -> Response:
    async with AsyncClient(app=app, base_url=USER_WALL_ENDPOINT) as client:
        response = await client.post("/create_wall", json=jsonable_encoder(request))
    return response


async def send_list_request(app: FastAPI) -> Response:
    async with AsyncClient(app=app, base_url=USER_WALL_ENDPOINT) as client:
        response = await client.get("/")
    return response


async def send_delete_request(app: FastAPI, wall_id: int) -> Response:
    async with AsyncClient(app=app, base_url=USER_WALL_ENDPOINT) as client:
        response = await client.delete("/delete_wall/" + str(wall_id))
    return response


async def send_rename_request(
    app: FastAPI, wall_id: int, new_wall_name: str
) -> Response:
    async with AsyncClient(app=app, base_url=USER_WALL_ENDPOINT) as client:
        response = await client.post(
            "/rename_wall", json={"wall_id": wall_id, "new_wall_name": new_wall_name}
        )
    return response


async def send_share_request(
    app: FastAPI, request: ShareWallRequest | UnshareWallRequest
) -> Response:
    async with AsyncClient(app=app, base_url=USER_WALL_ENDPOINT) as client:
        response = await client.post(
            "/share_wall" if isinstance(request, ShareWallRequest) else "/unshare_wall",
            json=jsonable_encoder(request),
        )
    return response


async def send_is_used_in_kiosk_request(app: FastAPI, wall_id: int) -> Response:
    async with AsyncClient(app=app, base_url=USER_WALL_ENDPOINT) as client:
        response = await client.get("/is_used_in_kiosk", params={"wall_id": wall_id})
    return response


@pytest_asyncio.fixture
async def create_wall(
    user_wall_app: FastAPI,
    create_camera_default: CameraDefaultFactory,
    organization: Organization,
) -> None:
    camera = await create_camera_default()

    second_camera = await create_camera_default()

    response = await send_create_request(
        user_wall_app,
        CreateWallRequest(
            name="wall_name",
            wall_tiles=[
                WallTile(
                    camera_mac_address=camera.mac_address,
                    x_start_tile=0,
                    y_start_tile=0,
                    width_tiles=1,
                    height_tiles=1,
                ),
                WallTile(
                    camera_mac_address=second_camera.mac_address,
                    x_start_tile=1,
                    y_start_tile=0,
                    width_tiles=1,
                    height_tiles=1,
                ),
            ],
        ),
    )

    assert response.status_code == 200


async def test_create_wall_ok(
    user_wall_app: FastAPI, create_wall: None, organization: Organization
) -> None:
    response = await send_list_request(user_wall_app)
    response_json = response.json()
    assert len(response_json["walls"]) == 1
    assert response_json["walls"][0]["wall"]["id"] == 1


async def test_create_wall_wrong_camera(
    user_wall_app: FastAPI, organization: Organization
) -> None:
    # Try to create tile for non-existing camera
    with pytest.raises(exc.IntegrityError):
        await send_create_request(
            user_wall_app,
            CreateWallRequest(
                name="",
                wall_tiles=[
                    WallTile(
                        camera_mac_address="00:00:00:00:00:00",
                        x_start_tile=0,
                        y_start_tile=0,
                        width_tiles=1,
                        height_tiles=1,
                    )
                ],
            ),
        )


async def test_create_wall_overlapping_tiles(
    user_wall_app: FastAPI,
    create_camera_default: CameraDefaultFactory,
    organization: Organization,
) -> None:
    camera = await create_camera_default()

    second_camera = await create_camera_default()

    with pytest.raises(ValidationError):
        await send_create_request(
            user_wall_app,
            CreateWallRequest(
                name="",
                wall_tiles=[
                    WallTile(
                        camera_mac_address=camera.mac_address,
                        x_start_tile=0,
                        y_start_tile=0,
                        width_tiles=2,
                        height_tiles=1,
                    ),
                    WallTile(
                        camera_mac_address=second_camera.mac_address,
                        x_start_tile=1,
                        y_start_tile=0,
                        width_tiles=1,
                        height_tiles=1,
                    ),
                ],
            ),
        )


async def test_create_wall_no_rectangle(
    user_wall_app: FastAPI,
    create_camera_default: CameraDefaultFactory,
    organization: Organization,
) -> None:
    camera = await create_camera_default()
    second_camera = await create_camera_default()

    with pytest.raises(ValidationError):
        await send_create_request(
            user_wall_app,
            CreateWallRequest(
                name="",
                wall_tiles=[
                    WallTile(
                        camera_mac_address=camera.mac_address,
                        x_start_tile=0,
                        y_start_tile=0,
                        width_tiles=2,
                        height_tiles=1,
                    ),
                    WallTile(
                        camera_mac_address=second_camera.mac_address,
                        x_start_tile=1,
                        y_start_tile=1,
                        width_tiles=1,
                        height_tiles=1,
                    ),
                ],
            ),
        )


async def test_delete_wall(
    user_wall_app: FastAPI, create_wall: None, organization: Organization
) -> None:
    response_delete = await send_delete_request(user_wall_app, 1)
    assert response_delete.status_code == 200

    response = await send_list_request(user_wall_app)
    response_json = response.json()
    assert len(response_json["walls"]) == 0


async def test_rename_wall(
    user_wall_app: FastAPI, create_wall: None, organization: Organization
) -> None:
    response_fetch_1 = await send_list_request(user_wall_app)
    response_fetch_1_json = response_fetch_1.json()
    assert response_fetch_1_json["walls"][0]["wall"]["name"] == "wall_name"

    response_rename = await send_rename_request(user_wall_app, 1, "new_name")
    assert response_rename.status_code == 200

    response_fetch_2 = await send_list_request(user_wall_app)
    response_fetch_2_json = response_fetch_2.json()
    assert response_fetch_2_json["walls"][0]["wall"]["name"] == "new_name"


async def test_share_wall(
    user_wall_app: FastAPI, create_wall: None, organization: Organization
) -> None:
    response_share = await send_share_request(
        user_wall_app,
        ShareWallRequest(wall_id=1, shared_with_user_emails=["test@otherdomain.com"]),
    )
    assert response_share.status_code == 200

    response = await send_list_request(user_wall_app)
    response_json = response.json()

    # Check that wall is shared with test@otherdomain.com.
    assert len(response_json["walls"]) == 1
    assert len(response_json["walls"][0]["share_infos"]) == 1
    assert (
        response_json["walls"][0]["share_infos"][0]["shared_with_user_email"]
        == "test@otherdomain.com"
    )
    # User does not have any walls shared with them.
    # TODO (oliverscheel): add a test for this
    assert len(response_json["shared_walls"]) == 0

    response_unshare = await send_share_request(
        user_wall_app,
        UnshareWallRequest(wall_id=1, shared_with_user_email="test@otherdomain.com"),
    )
    assert response_unshare.status_code == 200

    response_after_unshare = await send_list_request(user_wall_app)
    response_after_unshare_json = response_after_unshare.json()
    assert len(response_after_unshare_json["walls"]) == 1
    assert len(response_after_unshare_json["walls"][0]["share_infos"]) == 0


async def test_is_used_in_kiosk(
    user_wall_app: FastAPI, create_wall: None, organization: Organization
) -> None:
    response = await send_list_request(user_wall_app)
    response_json = response.json()
    assert len(response_json["walls"]) == 1
    wall_id = response_json["walls"][0]["wall"]["id"]

    response_is_used = await send_is_used_in_kiosk_request(user_wall_app, wall_id)
    assert response_is_used.status_code == 200
    assert response_is_used.json() is False
