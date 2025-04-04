from typing import Protocol

from backend.s3_utils import S3Path
from backend.utils import AwareDatetime


class MctImageFactory(Protocol):
    async def __call__(
        self, mac_address: str, timestamp: AwareDatetime = AwareDatetime.utcnow()
    ) -> None: ...


class ArchivedThumbnailFactory(Protocol):
    async def __call__(
        self, s3_path: S3Path, clip_id: int, timestamp: AwareDatetime | None = None
    ) -> None: ...
