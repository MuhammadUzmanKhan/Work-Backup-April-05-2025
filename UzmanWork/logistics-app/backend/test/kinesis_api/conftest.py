from typing import Any, AsyncGenerator, Iterable
from unittest.mock import MagicMock

import pytest_asyncio
from fastapi import FastAPI
from httpx import AsyncClient
from pytest_mock import MockerFixture

from backend.dependencies import get_mq_connection
from backend.kinesis_api.router import kinesis_api_router
from backend.kinesis_api.router_edge import kinesis_router_edge


@pytest_asyncio.fixture()
async def kinesis_client(
    app: FastAPI, mocker: MockerFixture
) -> AsyncGenerator[AsyncClient, None]:
    app.include_router(kinesis_api_router)
    app.include_router(kinesis_router_edge)
    app.dependency_overrides[get_mq_connection] = lambda: MagicMock()

    # no point in testing the implementation
    async def patch_impl(*args: Iterable[Any], **kwargs: dict[Any, Any]) -> str:
        return "https://example.com"

    mocker.patch(
        "backend.kinesis_api.router.get_kinesis_clip_url_with_edge_upload",
        new=patch_impl,
    )

    async with AsyncClient(app=app, base_url="http://localhost/kinesis_api") as client:
        yield client
