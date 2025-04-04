import dataclasses
import logging
import pathlib

import aiofiles
import aiofiles.os
import aiohttp

from backend import logging_config

logger = logging.getLogger(logging_config.LOGGER_NAME)


@dataclasses.dataclass(kw_only=True)
class Authenticator:
    auth_url: str
    client_id: str
    client_secret: str
    audience: str
    token_cache_path: pathlib.Path
    auth_token: str | None = None

    async def _get_cached_token(self) -> str | None:
        try:
            async with aiofiles.open(self.token_cache_path, "r") as opened_file:
                token = (await opened_file.read()).strip()
                self.auth_token = token
                return token
        except FileNotFoundError:
            return None

    async def _cache_token(self, token: str) -> None:
        async with aiofiles.open(self.token_cache_path, "w") as opened_file:
            await opened_file.write(token)

    async def get_token(self, session: aiohttp.ClientSession) -> str:
        if self.auth_token is not None:
            return self.auth_token
        cached_token = await self._get_cached_token()
        if cached_token is not None:
            return cached_token
        token = await self._authenticate(session)
        return token

    async def invalidate_token(self) -> None:
        self.auth_token = None
        try:
            await aiofiles.os.unlink(  # type: ignore[attr-defined]
                self.token_cache_path
            )
        except FileNotFoundError:
            pass

    # TODO: add retry logic here, once we know how it fails
    async def _authenticate(self, session: aiohttp.ClientSession) -> str:
        async with session.post(
            f"https://{self.auth_url}/oauth/token",
            json={
                "client_id": self.client_id,
                "client_secret": self.client_secret,
                "audience": f"https://{self.audience}/api/v2/",
                "grant_type": "client_credentials",
            },
        ) as resp:
            resp.raise_for_status()
            data = await resp.json()
            self.auth_token = str(data["access_token"])
            await self._cache_token(self.auth_token)
            return self.auth_token
