from typing import AsyncGenerator

import pytest_asyncio
from fastapi import FastAPI
from httpx import AsyncClient
from pytest_mock import MockerFixture

from backend.organizations.organizations_router import organizations_router


@pytest_asyncio.fixture()
async def organizations_app(app: FastAPI, mocker: MockerFixture) -> FastAPI:
    app.include_router(organizations_router)

    return app


@pytest_asyncio.fixture()
async def organizations_router_client(
    organizations_app: FastAPI,
) -> AsyncGenerator[AsyncClient, None]:
    async with AsyncClient(
        app=organizations_app, base_url="http://localhost/organizations"
    ) as client:
        yield client
