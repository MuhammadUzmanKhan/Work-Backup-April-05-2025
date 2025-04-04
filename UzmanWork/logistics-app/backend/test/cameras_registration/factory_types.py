from typing import Protocol

from backend.cameras_registration.cameras_registration_models import CandidateCameraData
from backend.stream_discovery.models import DiscoveryCachedEntry
from backend.utils import AwareDatetime


class CachedDiscoveryFactory(Protocol):
    async def __call__(
        self,
        nvr_uuid: str | None,
        mac_addresses: list[str],
        discovery_time: AwareDatetime | None = None,
    ) -> DiscoveryCachedEntry: ...


class CandidateCameraDataFactory(Protocol):
    def __call__(self, nvr_uuids: set[str]) -> CandidateCameraData: ...
