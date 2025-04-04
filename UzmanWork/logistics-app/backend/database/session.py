from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession
from typing_extensions import deprecated


class TenantAwareAsyncSession(AsyncSession):
    def __init__(self, tenant: str, *args: Any, **kwargs: Any) -> None:
        super().__init__(*args, **kwargs)
        self.tenant = tenant

    @deprecated("To get the new model id, use flush() instead")
    async def commit(self) -> None:
        return await super().commit()
