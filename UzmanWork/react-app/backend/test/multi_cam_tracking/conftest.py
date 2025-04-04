from typing import AsyncGenerator

import pytest_asyncio
from fastapi import FastAPI
from httpx import AsyncClient

from backend.multi_cam_tracking.router import journey_router
from backend.multi_cam_tracking.router_edge import mct_images_router_edge


@pytest_asyncio.fixture()
async def journey_client(app: FastAPI) -> AsyncGenerator[AsyncClient, None]:
    app.include_router(journey_router)
    app.include_router(mct_images_router_edge)

    async with AsyncClient(app=app, base_url="http://localhost/journey") as client:
        yield client
