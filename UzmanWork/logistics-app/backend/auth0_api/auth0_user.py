from __future__ import annotations

import enum
import functools

import pydantic

from backend.models import AccessRestrictions
from backend.utils import AwareDatetime


@functools.total_ordering
@enum.unique
class UserRole(enum.Enum):
    NONE = "none"
    LIVE_ONLY = "live_only"
    LIMITED = "limited"
    REGULAR = "regular"
    ADMIN = "admin"
    SUPPORT = "support"

    def __lt__(self, other: UserRole) -> bool:
        """This gives a total ordering on the roles based on the order defined above"""
        if self == other:
            return False
        for elem in UserRole:
            if self == elem:
                return True
            elif other == elem:
                return False
        raise RuntimeError("Bug: we should never arrive here")


class AppMetadata(pydantic.BaseModel):
    organization_ids: list[str] = pydantic.Field(alias="coram_organization_ids")
    role_assignment: UserRole = UserRole.NONE
    access_restrictions: AccessRestrictions = AccessRestrictions()


class Auth0User(pydantic.BaseModel):
    user_id: str
    email: str
    name: str
    app_metadata: AppMetadata = pydantic.Field(
        default_factory=lambda: AppMetadata(
            coram_organization_ids=[],
            role_assignment=UserRole.NONE,
            access_restrictions=AccessRestrictions(),
        )
    )
    last_login: AwareDatetime | None = None


class CoramUserOrgUpdateData(pydantic.BaseModel):
    tenant: str
    email: pydantic.EmailStr
    role: UserRole = UserRole.ADMIN
