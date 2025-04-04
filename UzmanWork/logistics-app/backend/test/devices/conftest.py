from typing import AsyncGenerator

import pytest_asyncio
from fastapi import FastAPI
from httpx import AsyncClient
from pytest_mock import MockerFixture

from backend.devices.devices_router import devices_router


@pytest_asyncio.fixture()
async def devices_client(
    app: FastAPI, mocker: MockerFixture
) -> AsyncGenerator[AsyncClient, None]:
    app.include_router(devices_router)

    # no point in testing Kinesis itself
    mocker.patch("backend.devices.devices_router.live_kinesis_retention_update_request")

    async with AsyncClient(app=app, base_url="http://localhost/devices") as client:
        yield client
