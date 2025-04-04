from typing import Optional

from pydantic import BaseModel


# https://openpath.readme.io/reference/createauthcert
class AltaCreateAuthCertificateData(BaseModel):
    id: int
    name: str | None = None
    roleId: int
    certificate: str


class AltaCreateAuthCertificateResponse(BaseModel):
    data: AltaCreateAuthCertificateData


class AuthorizeAltaMFA(BaseModel):
    totpCode: str


class AuthorizeAltaWithMFARequest(BaseModel):
    email: str
    password: str
    mfa: AuthorizeAltaMFA | None = None


class AltaError(Exception):
    pass


class AltaOrg(BaseModel):
    id: Optional[int]
    name: Optional[str]


class AltaTokenScope(BaseModel):
    org: AltaOrg


class AltaToken(BaseModel):
    token: str
    tokenScopeList: list[AltaTokenScope]


class AltaAcu(BaseModel):
    id: int
    name: str


class AltaEntry(BaseModel):
    id: int
    name: str
    acu: AltaAcu


class AltaEventEntry(BaseModel):
    id: int
    name: str


# I don't know all possible results Alta may emit. I want to keep this enum here,
# so latter when we have more data/clients we can properly handle it.
# class AltaEventResult(str, enum.Enum):
#     CLOSED = "Closed"
#     OPEN = "Open"
#     ENDED = "Ended"
#     GRANTED = "Granted"
#     DENIED = "Denied"
#     STARTED = "Started"


class AltaEvent(BaseModel):
    entryId: int | None = None
    acuId: int
    userId: int | None = None
    acuName: str | None = None
    entryName: str | None = None
    time: float
    timeIsoString: str
    result: str | None = None
    userName: str | None = None
    entries: list[AltaEventEntry] | None = None


class AltaGetActivityEventsData(BaseModel):
    uiData: AltaEvent


# https://openpath.readme.io/reference/getactivityevents-1 response:
class AltaGetActivityEventsResponse(BaseModel):
    data: list[AltaGetActivityEventsData]


# https://api.openpath.com/auth/login response:
class AltaLoginResponse(BaseModel):
    data: AltaToken


# https://api.openpath.com/orgs/{orgId}/entries response
class AltaEntries(BaseModel):
    data: list[AltaEntry]


class AltaAuthorisationData(BaseModel):
    public_key: str
    private_key: str
    cert_id: int
    org_id: int
    remote_unlock_enabled: bool


class AltaCreateUserIdentity(BaseModel):
    email: str
    firstName: str | None = None
    lastName: str | None = None


# https://openpath.readme.io/reference/createuser
class AltaCreateUserRequestBody(BaseModel):
    identity: AltaCreateUserIdentity
    hasRemoteUnlock: bool = False
    isOverrideAllowed: bool = False


class AltaUserData(AltaCreateUserRequestBody):
    id: int


class AltaCreateUserResponse(BaseModel):
    data: AltaUserData


# https://openpath.readme.io/reference/listusers
class AltaListUsersResponse(BaseModel):
    totalCount: int
    data: list[AltaUserData]


class AltaListRolesResponseData(BaseModel):
    id: int
    name: str
    description: str | None = None


# https://openpath.readme.io/reference/listroles
class AltaListRolesResponse(BaseModel):
    totalCount: int
    data: list[AltaListRolesResponseData]


class AltaCredentialTypesData(BaseModel):
    id: int
    name: str
    modelName: str


# https://openpath.readme.io/reference/setuserzoneusers
class AltaSetUserZoneRequestBody(BaseModel):
    zoneId: int
    scheduleId: int | None = None


class AltaZoneData(BaseModel):
    id: int
    name: str


# https://openpath.readme.io/reference/listzones
class AltaListZonesResponse(BaseModel):
    data: list[AltaZoneData]


class AltaCredentialData(BaseModel):
    id: int
    credentialType: AltaCredentialTypesData


# https://openpath.readme.io/reference/listcredentials
class AltaListUserCredentialsResponse(BaseModel):
    data: list[AltaCredentialData]


# https://openpath.readme.io/reference/createcredential
class AltaCreateCredentialResponse(BaseModel):
    data: AltaCredentialData


class AltaCreateUserCredentialCloudKey(BaseModel):
    name: str


# https://openpath.readme.io/reference/createcredential
class AltaCreateUserCredentialRequestBody(BaseModel):
    credentialTypeId: int
    cloudKey: AltaCreateUserCredentialCloudKey


# https://openpath.readme.io/reference/listcredentialtypes
class AltaListCredentialTypesResponse(BaseModel):
    totalCount: int
    data: list[AltaCredentialTypesData]
