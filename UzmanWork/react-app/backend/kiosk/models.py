from pydantic import BaseModel, EmailStr

from backend.database.models import Kiosk, Wall
from backend.kinesis_api.models import StaticResolutionConfig
from backend.models import PublicCameraData
from backend.user_wall.models import WallTile


class CreateKioskRequest(BaseModel):
    name: str
    rotate_frequency_s: float
    # Note that the order of the walls in the list is the order in which they
    # will be displayed on the kiosk.
    wall_ids: list[int]


class UpdateWallsForKioskRequest(BaseModel):
    kiosk_id: int
    # Note that the order of the walls in the list is the order in which they
    # will be displayed on the kiosk.
    wall_ids: list[int]
    rotate_frequency_s: float


class RenameKioskRequest(BaseModel):
    kiosk_id: int
    name: str


class UpdateKioskStatusRequest(BaseModel):
    kiosk_id: int
    is_enabled: bool


class ShareKioskRequest(BaseModel):
    kiosk_id: int
    recipient_email: EmailStr


class KioskResponse(BaseModel):
    kiosk: Kiosk


class KiosksResponse(BaseModel):
    kiosks: list[KioskResponse]


class KioskWallTile(BaseModel):
    wall_tile: WallTile
    # None if the wall tile is empty
    camera_data: PublicCameraData | None


class KioskWallResponse(BaseModel):
    wall: Wall
    wall_tiles: list[KioskWallTile]


class KioskNextWallRequest(BaseModel):
    current_wall_id: int | None = None
    resolution_config: StaticResolutionConfig
    prefer_webrtc: bool = True


class KioskKeepWallAliveRequest(BaseModel):
    wall_id: int
    mac_addresses: list[str]
    resolution_config: StaticResolutionConfig
