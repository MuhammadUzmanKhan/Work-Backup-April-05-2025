import fastapi
import pytest_asyncio

from backend.main_edge import app as _edge_api


@pytest_asyncio.fixture()
async def edge_api() -> fastapi.FastAPI:
    return _edge_api
