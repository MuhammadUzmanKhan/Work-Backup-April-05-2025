from typing import AsyncGenerator

import pytest_asyncio
from fastapi import FastAPI
from httpx import AsyncClient

from backend.database.models import DetectionObjectType, PerceptionObjectCreate
from backend.perception.router import perception_router
from backend.perception.router_edge import perception_router_edge


@pytest_asyncio.fixture()
async def perception_client(app: FastAPI) -> AsyncGenerator[AsyncClient, None]:
    app.include_router(perception_router)
    app.include_router(perception_router_edge)
    async with AsyncClient(app=app, base_url="http://localhost/perceptions") as client:
        yield client


@pytest_asyncio.fixture()
async def perception_object_create() -> PerceptionObjectCreate:
    return PerceptionObjectCreate(
        object_type=DetectionObjectType.PERSON,
        x_min=0,
        x_max=0,
        y_min=0,
        y_max=0,
        confidence=0,
        is_moving=False,
        track_id=0,
        track_age_s=0,
        object_idx=0,
        idx_in_frame=None,
    )
