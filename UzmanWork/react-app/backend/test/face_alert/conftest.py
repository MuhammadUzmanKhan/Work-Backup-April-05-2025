from typing import AsyncGenerator

import pytest_asyncio
from fastapi import FastAPI
from httpx import AsyncClient

from backend.face_alert.router import face_alert_router


@pytest_asyncio.fixture()
async def face_alert_client(app: FastAPI) -> AsyncGenerator[AsyncClient, None]:
    app.include_router(face_alert_router)
    async with AsyncClient(app=app, base_url="http://localhost/face_alert") as client:
        yield client
