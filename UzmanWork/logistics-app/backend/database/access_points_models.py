import enum

from pydantic import BaseModel


class AccessPointError(Exception):
    pass


class AccessPointNotFoundError(AccessPointError):
    pass


class AccessPointCameraNotFoundError(AccessPointError):
    pass


class AccessPointVendor(str, enum.Enum):
    BRIVO = "brivo"
    ALTA = "alta"


class AccessPointIdentifier(BaseModel):
    id: str
    vendor: AccessPointVendor

    def __hash__(self) -> int:
        return hash((type(self),) + tuple(self.__dict__.values()))


class AccessPointCamera(BaseModel):
    camera_mac_address: str
    is_favorite: bool

    class Config:
        orm_mode = True


class AccessPoint(BaseModel):
    id: str
    vendor: AccessPointVendor
    tenant: str
    location_id: int | None = None
    cameras: list[AccessPointCamera]

    class Config:
        orm_mode = True
