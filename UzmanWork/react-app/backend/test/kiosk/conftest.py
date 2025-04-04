from typing import Any, AsyncGenerator, Iterable
from unittest.mock import MagicMock, Mock

import pytest_asyncio
from fastapi import FastAPI
from httpx import AsyncClient
from pydantic import AnyHttpUrl, parse_obj_as
from pytest_mock import MockerFixture

from backend import auth_models
from backend.database import database, orm
from backend.database.models import KioskCreate, Wall, WallCreate, WallTileCreate
from backend.database.organization_models import Organization
from backend.dependencies import get_email_client, get_mq_connection
from backend.kinesis_api.models import HlsData, HlsStreamResponse, StreamResponse
from backend.kiosk.models import CreateKioskRequest
from backend.kiosk.public_router import kiosk_public_router
from backend.kiosk.router import kiosk_router
from backend.test.factory_types import CameraDefaultFactory, RandomStringFactory
from backend.test.kiosk.factory_types import (
    KioskFactory,
    KioskFromRequestFactory,
    WallFactory,
)
from backend.test.kiosk.test_utils import send_create_request


@pytest_asyncio.fixture()
def kiosk_app(app: FastAPI, mocker: MockerFixture, email_client_mock: Mock) -> FastAPI:
    app.dependency_overrides[get_email_client] = lambda: email_client_mock
    app.dependency_overrides[get_mq_connection] = lambda: MagicMock()
    app.include_router(kiosk_router)
    app.include_router(kiosk_public_router)

    # no point in testing the implementation
    async def patch_impl(
        *args: Iterable[Any], **kwargs: dict[Any, Any]
    ) -> StreamResponse:
        return HlsStreamResponse(
            data=HlsData(video_url=parse_obj_as(AnyHttpUrl, "http://test.com"))
        )

    mocker.patch("backend.kiosk.public_router.get_kinesis_live_url", new=patch_impl)
    return app


@pytest_asyncio.fixture()
async def kiosk_client(kiosk_app: FastAPI) -> AsyncGenerator[AsyncClient, None]:
    async with AsyncClient(app=kiosk_app, base_url="http://localhost/kiosk") as client:
        yield client


@pytest_asyncio.fixture()
async def kiosk_public_client(kiosk_app: FastAPI) -> AsyncGenerator[AsyncClient, None]:
    async with AsyncClient(
        app=kiosk_app, base_url="http://localhost/kiosk_public"
    ) as client:
        yield client


@pytest_asyncio.fixture
async def create_wall(
    db_instance: database.Database,
    create_name: RandomStringFactory,
    create_camera_default: CameraDefaultFactory,
    app_user: auth_models.AppUser,
    organization: Organization,
) -> WallFactory:
    async def create_wall_inner(camera_count: int = 2) -> Wall:
        async with db_instance.tenant_session(tenant=app_user.tenant) as session:
            new_wall = await orm.Wall.create_wall(
                session,
                WallCreate(owner_user_email=app_user.user_email, name=create_name()),
            )

        wall_tiles = []
        for camera_idx in range(camera_count):
            camera = await create_camera_default()
            wall_tiles.append(
                WallTileCreate(
                    wall_id=new_wall.id,
                    camera_mac_address=camera.mac_address,
                    x_start_tile=camera_idx,
                    y_start_tile=0,
                    width_tiles=1,
                    height_tiles=1,
                )
            )

        async with db_instance.tenant_session(tenant=app_user.tenant) as session:
            await orm.WallTile.create_tiles(
                session, new_wall.id, wall_tiles_create=wall_tiles
            )
        return new_wall

    return create_wall_inner


@pytest_asyncio.fixture
async def create_kiosk(
    db_instance: database.Database,
    create_email: RandomStringFactory,
    create_name: RandomStringFactory,
    organization: Organization,
) -> KioskFactory:
    async def create_kiosk_inner(
        creator_user_email: str | None = None,
        name: str | None = None,
        tenant: str | None = None,
    ) -> int:
        tenant = tenant if tenant else organization.tenant
        async with db_instance.tenant_session(tenant=tenant) as session:
            return await orm.Kiosk.create_kiosk(
                session,
                KioskCreate(
                    creator_user_email=(
                        creator_user_email if creator_user_email else create_email()
                    ),
                    name=name if name else create_name(),
                    rotate_frequency_s=2.0,
                    is_enabled=True,
                ),
                wall_ids=[],
            )

    return create_kiosk_inner


@pytest_asyncio.fixture
async def create_kiosk_from_request(
    kiosk_client: AsyncClient, create_wall: WallFactory
) -> KioskFromRequestFactory:
    """Return a factory that can create a kiosk with two walls and return its
    ID."""

    async def create_kiosk_inner(name: str, wall_count: int = 2) -> int:
        walls = [await create_wall() for _ in range(wall_count)]

        response = await send_create_request(
            kiosk_client,
            CreateKioskRequest(
                name=name, rotate_frequency_s=2.0, wall_ids=[wall.id for wall in walls]
            ),
        )

        assert response.status_code == 200
        # Return the id of the created kiosk.
        return int(response.text)

    return create_kiosk_inner
