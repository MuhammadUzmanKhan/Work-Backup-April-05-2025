from typing import AsyncGenerator

import pytest_asyncio
from fastapi import FastAPI
from httpx import AsyncClient

from backend.organization_feature_flags.router import org_flags_router


@pytest_asyncio.fixture()
async def org_flags_client(app: FastAPI) -> AsyncGenerator[AsyncClient, None]:
    app.include_router(org_flags_router)
    async with AsyncClient(app=app, base_url="http://localhost/org_flags") as client:
        yield client
