from typing import Protocol

from backend.database.models import Wall


class WallFactory(Protocol):
    async def __call__(self, camera_count: int = 2) -> Wall:
        pass


class KioskFromRequestFactory(Protocol):
    async def __call__(self, name: str, wall_count: int = 2) -> int:
        pass


class KioskFactory(Protocol):
    async def __call__(
        self,
        creator_user_email: str | None = None,
        name: str | None = None,
        tenant: str | None = None,
    ) -> int:
        pass
