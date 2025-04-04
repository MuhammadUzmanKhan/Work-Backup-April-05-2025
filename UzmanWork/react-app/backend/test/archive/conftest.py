from typing import AsyncGenerator
from unittest.mock import Mock

import pytest
import pytest_asyncio
from fastapi import FastAPI
from httpx import AsyncClient
from pytest_mock import MockerFixture

from backend.archive.router import archive_router
from backend.dependencies import get_email_client, get_mq_connection
from backend.test.factory_types import RandomStringFactory
from backend.test.tag.conftest import create_tag, tag  # noqa: F401


@pytest.fixture()
def share_with_emails(create_email: RandomStringFactory) -> list[str]:
    return [create_email(), create_email()]


@pytest_asyncio.fixture()
async def archive_client(
    app: FastAPI, mocker: MockerFixture, email_client_mock: Mock
) -> AsyncGenerator[AsyncClient, None]:
    app.include_router(archive_router)
    app.dependency_overrides[get_mq_connection] = lambda: None
    app.dependency_overrides[get_email_client] = lambda: email_client_mock

    mocker.patch("backend.archive.router.archive_request_kvs_if_not_exists")
    mocker.patch("backend.archive.router.ensure_clip_is_archived_task")
    mocker.patch("backend.archive.router.archive_thumbnails_task")
    async with AsyncClient(app=app, base_url="http://localhost/archive") as client:
        yield client
