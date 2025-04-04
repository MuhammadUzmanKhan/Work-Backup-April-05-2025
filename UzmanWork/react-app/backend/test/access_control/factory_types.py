from typing import Protocol

from backend.database.access_points_models import AccessPoint, AccessPointVendor


class AccessPointFactory(Protocol):
    async def __call__(
        self,
        access_control_id: str,
        vendor: AccessPointVendor,
        tenant: str,
        location_id: int,
    ) -> AccessPoint:
        pass
