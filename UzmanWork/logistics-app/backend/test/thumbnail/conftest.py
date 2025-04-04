from typing import AsyncGenerator

import pytest
import pytest_asyncio
from fastapi import FastAPI
from httpx import AsyncClient

from backend.database.models import Camera, ThumbnailCreate, ThumbnailType
from backend.test.factory_types import RandomStringFactory
from backend.test.thumbnail.thumbnail_factory_types import ThumbnailCreateFactory
from backend.thumbnail.router import thumbnail_router
from backend.thumbnail.router_edge import thumbnail_router_edge
from backend.utils import AwareDatetime


@pytest_asyncio.fixture()
async def thumbnail_client(app: FastAPI) -> AsyncGenerator[AsyncClient, None]:
    app.include_router(thumbnail_router)
    app.include_router(thumbnail_router_edge)

    async with AsyncClient(app=app, base_url="http://localhost/thumbnail") as client:
        yield client


@pytest.fixture()
def create_thumbnail_create(
    create_s3_url: RandomStringFactory, camera: Camera
) -> ThumbnailCreateFactory:
    async def create_thumbnail_create_inner(
        mac_address: str | None = None,
    ) -> ThumbnailCreate:
        return ThumbnailCreate(
            timestamp=AwareDatetime.utcnow(),
            camera_mac_address=mac_address or camera.mac_address,
            s3_path=create_s3_url(),
            thumbnail_type=ThumbnailType.THUMBNAIL,
        )

    return create_thumbnail_create_inner
