from typing import Protocol

from backend.database import tag_models as tag_models


class TagFactory(Protocol):
    async def __call__(self, name: str, tenant: str) -> tag_models.Tag:
        pass
