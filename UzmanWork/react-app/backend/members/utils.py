from pydantic import EmailStr

from backend.auth0_api.auth0_api import Auth0API
from backend.auth0_api.auth0_user import Auth0User, UserRole
from backend.members.errors import MemberRolesConflictError
from backend.models import AccessRestrictions

# TODO: get rid of this once we ship roles.
CORAM_SUFFIX = "@coram.ai"
ORCA_SUFFIX = "@orcamobility.ai"


def is_coram_employee_email(email: EmailStr) -> bool:
    return email.endswith(CORAM_SUFFIX) or email.endswith(ORCA_SUFFIX)


async def handle_already_existing_user(
    user_email: EmailStr,
    role: UserRole,
    access_restrictions: AccessRestrictions,
    auth_api: Auth0API,
    tenant: str,
) -> Auth0User:
    user = await auth_api.get_user_by_email(user_email)
    if not user.app_metadata.organization_ids:
        await auth_api.update_user_role_assignment(user.user_id, role)
        await auth_api.update_user_organizations(user.user_id, [tenant])
        user = await auth_api.update_user_access_restrictions(
            user.user_id, access_restrictions
        )
    else:
        if user.app_metadata.role_assignment != role:
            raise MemberRolesConflictError(
                "User already in an organization with a different role"
            )
        tenants = list(set(user.app_metadata.organization_ids + [tenant]))
        await auth_api.update_user_organizations(user.user_id, tenants)
    return user
