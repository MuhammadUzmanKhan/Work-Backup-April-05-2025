import contextlib
import dataclasses
import logging
from typing import Any, AsyncIterator

import aiohttp
import fastapi.encoders

from backend import logging_config
from backend.auth0_api.authenticator import Authenticator

logger = logging.getLogger(logging_config.LOGGER_NAME)

DEFAULT_TIMEOUT = aiohttp.ClientTimeout(total=30)


@dataclasses.dataclass
class Auth0Client:
    authenticator: Authenticator
    _session: aiohttp.ClientSession | None = None

    async def _get_session(self) -> aiohttp.ClientSession:
        if self._session is None:
            self._session = aiohttp.ClientSession(timeout=DEFAULT_TIMEOUT)
        return self._session

    async def close(self) -> None:
        if self._session is not None:
            await self._session.close()

    @staticmethod
    @contextlib.asynccontextmanager
    async def _request_internal(
        session: aiohttp.ClientSession,
        method: str,
        url: str,
        json: dict[str, str] | None = None,
        params: dict[str, str] | None = None,
        headers: dict[str, str] | None = None,
    ) -> AsyncIterator[aiohttp.ClientResponse]:
        async with session.request(
            method, url, params=params, headers=headers, json=json
        ) as resp:
            if not resp.ok:
                response_data = await resp.json()
                logger.warn("Request failed: %s", response_data)
                resp.raise_for_status()
            yield resp

    @contextlib.asynccontextmanager
    async def _request(
        self,
        *,
        method: str,
        endpoint: str,
        params: dict[str, str] | None = None,
        json: dict[str, str] | None = None,
    ) -> AsyncIterator[aiohttp.ClientResponse]:
        session = await self._get_session()
        try:
            async with self._request_internal(
                session,
                method,
                f"https://{self.authenticator.auth_url}/api/v2/{endpoint}",
                json=json,
                params=params,
                headers={
                    "Authorization": (
                        f"Bearer {await self.authenticator.get_token(session)}"
                    )
                },
            ) as resp:
                yield resp
        except aiohttp.ClientResponseError as exc:
            if exc.status == 401:
                await self.authenticator.invalidate_token()
                async with self._request_internal(
                    session,
                    method,
                    f"https://{self.authenticator.auth_url}/api/v2/{endpoint}",
                    json=json,
                    params=params,
                    headers={
                        "Authorization": (
                            f"Bearer {await self.authenticator.get_token(session)}"
                        )
                    },
                ) as resp:
                    yield resp
            else:
                raise

    @contextlib.asynccontextmanager
    async def get(
        self, endpoint: str, params: dict[str, str] | None = None
    ) -> AsyncIterator[aiohttp.ClientResponse]:
        async with self._request(
            method="GET", endpoint=endpoint, params=params
        ) as resp:
            yield resp

    @contextlib.asynccontextmanager
    async def post(
        self, endpoint: str, json: dict[str, Any]
    ) -> AsyncIterator[aiohttp.ClientResponse]:
        async with self._request(
            method="POST",
            endpoint=endpoint,
            json=fastapi.encoders.jsonable_encoder(json),
        ) as resp:
            yield resp

    @contextlib.asynccontextmanager
    async def patch(
        self, endpoint: str, json: dict[str, Any]
    ) -> AsyncIterator[aiohttp.ClientResponse]:
        async with self._request(
            method="PATCH",
            endpoint=endpoint,
            json=fastapi.encoders.jsonable_encoder(json),
        ) as resp:
            yield resp

    @contextlib.asynccontextmanager
    async def delete(self, endpoint: str) -> AsyncIterator[aiohttp.ClientResponse]:
        async with self._request(method="DELETE", endpoint=endpoint) as resp:
            yield resp
