import enum


class KioskAction(enum.Enum):
    # Read anything about the kiosk
    # NOTE(@bkovacs) that even though someone can read all Kiosk data, that
    # doesn't mean they can access the WallTiles associated to the walls of the
    # kiosk. That is controlled by the WallTile permissions.
    READ = enum.auto()
    # Update only enabled status
    UPDATE_IS_ENABLED = enum.auto()
    # Update anything
    UPDATE = enum.auto()
    # Delete the kiosk
    DELETE = enum.auto()
    REGENERATE_HASH = enum.auto()
    RENAME = enum.auto()
