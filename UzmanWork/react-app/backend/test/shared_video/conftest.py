from typing import Any, AsyncGenerator, Iterable
from unittest.mock import MagicMock

import pytest_asyncio
from fastapi import FastAPI
from httpx import AsyncClient
from pydantic import AnyHttpUrl, parse_obj_as
from pytest_mock import MockerFixture

from backend.dependencies import get_mq_connection
from backend.kinesis_api.models import HlsData, HlsStreamResponse, StreamResponse
from backend.shared_video.router import shared_video_router, shared_video_router_public


@pytest_asyncio.fixture()
async def shared_video_app(app: FastAPI, mocker: MockerFixture) -> FastAPI:
    app.include_router(shared_video_router)
    app.include_router(shared_video_router_public)
    app.dependency_overrides[get_mq_connection] = lambda: MagicMock()

    # mock kinesis implementation
    async def patch_clip(*args: Iterable[Any], **kwargs: dict[Any, Any]) -> str:
        return "https://example.com"

    async def patch_live(
        *args: Iterable[Any], **kwargs: dict[Any, Any]
    ) -> StreamResponse:
        return HlsStreamResponse(
            data=HlsData(video_url=parse_obj_as(AnyHttpUrl, "http://test.com"))
        )

    mocker.patch("backend.shared_video.router.get_kinesis_clip_url", new=patch_clip)
    mocker.patch("backend.shared_video.router.get_kinesis_live_url", new=patch_live)
    return app


@pytest_asyncio.fixture()
async def shared_video_client(
    shared_video_app: FastAPI, mocker: MockerFixture
) -> AsyncGenerator[AsyncClient, None]:
    async with AsyncClient(
        app=shared_video_app, base_url="http://localhost/"
    ) as client:
        yield client
