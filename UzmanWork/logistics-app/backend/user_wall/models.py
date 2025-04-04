from pydantic import BaseModel, EmailStr, Field, validator

from backend.constants import REGEX_MAC_ADDRESS
from backend.database.models import Wall

# Note: this duplicates MAX_WALL_NAME_LENGTH from constants.tsx
MAX_WALL_NAME_LENGTH = 20


class WallTile(BaseModel):
    # Camera mac address or None if the tile is empty
    camera_mac_address: str | None = Field(regex=REGEX_MAC_ADDRESS)
    # X start position in terms of number of tiles
    x_start_tile: int = Field(ge=0)
    # Y start position in terms of number of tiles
    y_start_tile: int = Field(ge=0)
    # Width in terms of number of tiles
    width_tiles: int = Field(ge=1)
    # Height in terms of number of tiles
    height_tiles: int = Field(ge=1)


class CreateWallRequest(BaseModel):
    name: str = Field(max_length=MAX_WALL_NAME_LENGTH)
    wall_tiles: list[WallTile] = Field(min_items=1)

    @validator("wall_tiles")
    def validate_wall_tiles(cls, wall_tiles: list[WallTile]) -> list[WallTile]:
        camera_macs = [
            tile.camera_mac_address
            for tile in wall_tiles
            if tile.camera_mac_address is not None
        ]

        if len(camera_macs) != len(set(camera_macs)):
            raise ValueError("No two tiles can show the same camera")

        wall_width = max([tile.x_start_tile + tile.width_tiles for tile in wall_tiles])
        wall_height = max(
            [tile.y_start_tile + tile.height_tiles for tile in wall_tiles]
        )
        occupied_fields = [
            (row_idx + tile.x_start_tile, col_idx + tile.y_start_tile)
            for tile in wall_tiles
            for row_idx in range(tile.width_tiles)
            for col_idx in range(tile.height_tiles)
        ]

        # Check the given tiles fill the wall rectangle exactly
        if len(occupied_fields) != wall_width * wall_height or len(
            occupied_fields
        ) != len(set(occupied_fields)):
            raise ValueError(
                "Wall must be a rectangle, covering all fields of the grid without"
                "overlapping"
            )

        return wall_tiles


class CopyWallRequest(BaseModel):
    wall_name: str = Field(max_length=MAX_WALL_NAME_LENGTH)
    original_wall_id: int
    shared_with_user_emails: list[EmailStr]
    sender_email: EmailStr | None


class UnshareWallRequest(BaseModel):
    wall_id: int
    shared_with_user_email: EmailStr


class ShareWallRequest(BaseModel):
    wall_id: int
    shared_with_user_emails: list[EmailStr]


class ShareInfo(BaseModel):
    shared_with_user_email: str


class WallResponse(BaseModel):
    wall: Wall
    # All users that have access to this wall
    share_infos: list[ShareInfo]


class SharedWallResponse(BaseModel):
    # Original wall
    wall: Wall
    share_info: ShareInfo


class UserWallsResponse(BaseModel):
    walls: list[WallResponse]
    shared_walls: list[SharedWallResponse]


class WallsCountResponse(BaseModel):
    walls_count: int
