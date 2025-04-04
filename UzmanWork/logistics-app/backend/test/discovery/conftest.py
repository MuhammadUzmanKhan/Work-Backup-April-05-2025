from typing import AsyncGenerator

import pytest_asyncio
from fastapi import FastAPI
from httpx import AsyncClient

from backend.stream_discovery.router import stream_discovery_router_edge


@pytest_asyncio.fixture()
async def discovery_client(app: FastAPI) -> AsyncGenerator[AsyncClient, None]:
    app.include_router(stream_discovery_router_edge)
    async with AsyncClient(
        app=app, base_url="http://localhost/stream_discovery"
    ) as client:
        yield client
