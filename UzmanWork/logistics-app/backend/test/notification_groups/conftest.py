from typing import AsyncGenerator

import pytest_asyncio
from fastapi import FastAPI
from httpx import AsyncClient

from backend.notification_groups.router import notification_group_router


@pytest_asyncio.fixture()
async def notification_group_client(app: FastAPI) -> AsyncGenerator[AsyncClient, None]:
    app.include_router(notification_group_router)
    async with AsyncClient(
        app=app, base_url="http://localhost/notification_group"
    ) as client:
        yield client
