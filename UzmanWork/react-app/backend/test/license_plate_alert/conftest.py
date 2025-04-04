from typing import AsyncGenerator

import pytest_asyncio
from fastapi import FastAPI
from httpx import AsyncClient

from backend.license_plate_alert.router import license_plate_alert_router


@pytest_asyncio.fixture()
async def license_plate_alert_client(app: FastAPI) -> AsyncGenerator[AsyncClient, None]:
    app.include_router(license_plate_alert_router)
    async with AsyncClient(
        app=app, base_url="http://localhost/license_plate_alert"
    ) as client:
        yield client
