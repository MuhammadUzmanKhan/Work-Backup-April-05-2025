import dataclasses
import pathlib
from typing import Any
from unittest.mock import AsyncMock

import aiohttp
import pytest
from pytest_mock import MockerFixture

from backend.auth0_api.authenticator import Authenticator


@dataclasses.dataclass
class MockResponseError(Exception):
    status: int


class MockResponse:
    def __init__(self, json: dict[Any, Any], status: int):
        self._json = json
        self.status = status

    async def json(self) -> dict[Any, Any]:
        return self._json

    async def __aexit__(self, exc_type: Any, exc: Any, tb: Any) -> None:
        pass

    async def __aenter__(self) -> "MockResponse":
        return self

    def raise_for_status(self) -> None:
        if self.status > 299:
            raise MockResponseError(status=self.status)


@pytest.fixture()
def tmp_token_file(tmp_path: pathlib.Path) -> pathlib.Path:
    return tmp_path / "token.txt"


@pytest.fixture
def authenticator(tmp_token_file: pathlib.Path) -> Authenticator:
    return Authenticator(
        auth_url="http://example.com",
        client_id="123",
        client_secret="123",
        audience="123",
        token_cache_path=tmp_token_file,
    )


async def test_authenticator_new_token(
    authenticator: Authenticator, mocker: MockerFixture, random_string: str
) -> None:
    mock_session = AsyncMock(aiohttp.ClientSession)
    mock_session.post.return_value = MockResponse({"access_token": random_string}, 200)
    token = await authenticator.get_token(mock_session)

    assert token == random_string


@pytest.fixture
def token_file(tmp_token_file: pathlib.Path, random_string: str) -> pathlib.Path:
    tmp_token_file.write_text(random_string)
    return tmp_token_file


async def test_authenticator_cached_token(
    authenticator: Authenticator, mocker: MockerFixture, token_file: pathlib.Path
) -> None:
    mock_session = AsyncMock(aiohttp.ClientSession)
    token = await authenticator.get_token(mock_session)

    assert token == token_file.read_text()
