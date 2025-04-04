from typing import Protocol

from backend.database import dashboard_models as dashboard_models


class DashboardFactory(Protocol):
    async def __call__(
        self, dashboard_create: dashboard_models.DashboardCreate, tenant: str
    ) -> dashboard_models.Dashboard:
        pass
