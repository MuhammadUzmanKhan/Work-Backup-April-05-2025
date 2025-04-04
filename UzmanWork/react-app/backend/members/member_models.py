from __future__ import annotations

import pydantic

from backend import auth0_api
from backend.models import AccessRestrictions
from backend.utils import AwareDatetime


class MemberModel(pydantic.BaseModel):
    user_id: str
    email: str
    name: str
    role: auth0_api.UserRole
    access_restrictions: AccessRestrictions = AccessRestrictions()
    last_login: AwareDatetime | None = None

    @classmethod
    def from_auth0_user(cls, auth0_user: auth0_api.Auth0User) -> MemberModel:
        return MemberModel(
            user_id=auth0_user.user_id,
            email=auth0_user.email,
            name=auth0_user.name,
            role=auth0_user.app_metadata.role_assignment,
            access_restrictions=auth0_user.app_metadata.access_restrictions,
            last_login=auth0_user.last_login,
        )


class CreateMemberBody(pydantic.BaseModel):
    email: pydantic.EmailStr
    user_name: str | None = None
    role: auth0_api.UserRole
    access_restrictions: AccessRestrictions = AccessRestrictions()


class UpdateUserNameBody(pydantic.BaseModel):
    user_id: str
    user_name: str


class UpdateUserRoleBody(pydantic.BaseModel):
    user_id: str
    role: auth0_api.UserRole


class UpdateUserAccessRestrictionsBody(pydantic.BaseModel):
    user_id: str
    access_restrictions: AccessRestrictions


class DeleteMemberBody(pydantic.BaseModel):
    user_id: str
