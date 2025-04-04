from typing import Optional

from pydantic import BaseModel

from backend.utils import AwareDatetime


class BrivoError(Exception):
    pass


# Returned by https://auth.brivo.com/oauth/token
class BrivoAuthorisationResponse(BaseModel):
    access_token: str
    refresh_token: str
    expires_in: int


class BrivoAccessPoint(BaseModel):
    id: int
    name: str
    controlPanelId: int
    siteId: int
    siteName: str
    activationEnabled: bool
    type: str
    twoFactorEnabled: bool
    reportLiveStatus: bool


# Returned by https://api.brivo.com/v1/api/access-points
class BrivoAccessPoints(BaseModel):
    data: list[BrivoAccessPoint]
    offset: int
    pageSize: int
    count: int


class BrivoActor(BaseModel):
    id: str
    name: str


class BrivoEventObject(BaseModel):
    id: str
    name: str


class BrivoSecurityAction(BaseModel):
    action: str
    exception: bool


class BrivoEvent(BaseModel):
    eventObject: BrivoEventObject
    securityAction: BrivoSecurityAction
    actor: Optional[BrivoActor]
    occurred: AwareDatetime


# Returned by https://api.brivo.com/v1/api/events/access
class BrivoEvents(BaseModel):
    data: list[BrivoEvent]
    pageSize: int


class BrivoAuthorisationData(BaseModel):
    access_token: str
    api_key: str | None = None


class BrivoAuthorisationDataWithExpiration(BrivoAuthorisationData):
    expires_in: int | None = None
