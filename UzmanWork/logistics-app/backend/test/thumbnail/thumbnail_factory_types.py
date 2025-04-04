from typing import Protocol

from backend.database.models import ThumbnailCreate


class ThumbnailCreateFactory(Protocol):
    async def __call__(self, mac_address: str) -> ThumbnailCreate: ...
