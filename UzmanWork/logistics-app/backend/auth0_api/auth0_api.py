import logging
import random
import string

import aiohttp
from pydantic import EmailStr

from backend import logging_config
from backend.auth0_api.auth0_client import Auth0Client
from backend.auth0_api.auth0_user import Auth0User, CoramUserOrgUpdateData, UserRole
from backend.auth0_api.authenticator import Authenticator
from backend.database.organization_models import Organization
from backend.models import AccessRestrictions

logger = logging.getLogger(logging_config.LOGGER_NAME)


class Auth0APIError(Exception):
    pass


class UserAlreadyExistsError(Auth0APIError):
    pass


class UserDoesNotExistError(Auth0APIError):
    pass


class Auth0API:
    def __init__(
        self,
        authenticator: Authenticator,
        organizations_key: str,
        role_key: str,
        access_restrictions_key: str,
    ):
        self.auth0_client = Auth0Client(authenticator)
        self.organizations_key = organizations_key
        self.role_key = role_key
        self.access_restrictions_key = access_restrictions_key

    async def get_org_users(self, org_id: str) -> list[Auth0User]:
        async with self.auth0_client.get(
            "users",
            params={
                "fields": "user_id,name,email,app_metadata",
                "include_fields": "true",
                "q": f"app_metadata.{self.organizations_key}:{org_id}",
                "search_engine": "v2",
            },
        ) as resp:
            data = await resp.json()
            users = [Auth0User.parse_obj(user) for user in data]
            return users

    async def create_user_in_org(
        self,
        *,
        tenant: str,
        email: str,
        role: UserRole,
        name: str | None,
        access_restrictions: AccessRestrictions = AccessRestrictions(),
    ) -> Auth0User:
        def generate_password() -> str:
            return (
                "".join(
                    random.choice(
                        string.ascii_letters + string.digits + string.punctuation
                    )
                    for _ in range(32)
                )
                + random.choice(string.ascii_letters)
                + random.choice(string.digits)
                + random.choice(string.punctuation)
            )

        user_blob = {
            "email": email,
            "password": generate_password(),
            "email_verified": True,
            "verify_email": False,
            "connection": "Username-Password-Authentication",
            "app_metadata": {
                self.organizations_key: [tenant],
                self.role_key: role,
                self.access_restrictions_key: access_restrictions,
            },
        }
        if name is not None:
            user_blob["name"] = name

        try:
            async with self.auth0_client.post("users", json=user_blob) as resp:
                return Auth0User.parse_obj(await resp.json())
        except aiohttp.ClientResponseError as exc:
            if exc.status == 409:
                raise UserAlreadyExistsError(f"{email} already exists: {exc}")
            raise Auth0APIError(f"Failed to create user: {exc}")

    async def get_user(self, user_id: str) -> Auth0User:
        async with self.auth0_client.get(
            f"users/{user_id}",
            params={
                "fields": "user_id,name,email,app_metadata",
                "include_fields": "true",
            },
        ) as resp:
            user = await resp.json()

        return Auth0User.parse_obj(user)

    async def get_user_by_email(self, email: str) -> Auth0User:
        async with self.auth0_client.get(
            "users-by-email",
            params={
                "fields": "user_id,name,email,app_metadata,identities",
                "include_fields": "true",
                "email": email,
            },
        ) as resp:
            user_data = []
            for user in await resp.json():
                identities = [identity["connection"] for identity in user["identities"]]
                if (
                    "Username-Password-Authentication" in identities
                    or "google-oauth2" in identities
                ):
                    user_data.append(user)

            if not user_data:
                raise UserDoesNotExistError
            auth0_user = Auth0User.parse_obj(user_data.pop())

            return auth0_user

    async def update_user_organizations(
        self, user_id: str, organizations: list[str]
    ) -> Auth0User:
        async with self.auth0_client.patch(
            f"users/{user_id}",
            {"app_metadata": {self.organizations_key: organizations}},
        ) as resp:
            return Auth0User.parse_obj(await resp.json())

    async def update_user_role_assignment(
        self, user_id: str, role_assignment: UserRole
    ) -> Auth0User:
        async with self.auth0_client.patch(
            f"users/{user_id}", {"app_metadata": {self.role_key: role_assignment}}
        ) as resp:
            return Auth0User.parse_obj(await resp.json())

    async def update_user_access_restrictions(
        self, user_id: str, access_restrictions: AccessRestrictions
    ) -> Auth0User:
        async with self.auth0_client.patch(
            f"users/{user_id}",
            {"app_metadata": {self.access_restrictions_key: access_restrictions}},
        ) as resp:
            return Auth0User.parse_obj(await resp.json())

    async def update_user_name(self, user_id: str, user_name: str) -> Auth0User:
        async with self.auth0_client.patch(
            f"users/{user_id}", {"name": user_name}
        ) as resp:
            return Auth0User.parse_obj(await resp.json())

    async def delete_user(self, user_id: str) -> None:
        async with self.auth0_client.delete(f"users/{user_id}"):
            return

    async def add_org_to_user_by_email(
        self, org: Organization, email: EmailStr
    ) -> None:
        user = await self.get_user_by_email(email)
        if org.tenant not in user.app_metadata.organization_ids:
            await self.update_user_organizations(
                user.user_id, user.app_metadata.organization_ids + [org.tenant]
            )

    async def add_tenant_to_coram_user_by_email(
        self, update_data: CoramUserOrgUpdateData
    ) -> None:
        """Add a tenant to a Coram user that already exists in the database.
        We also enforce the role of the user to be ADMIN.
        NOTE: in auth0 tenants are called organization_ids.
        """
        user = await self.get_user_by_email(update_data.email)
        if update_data.tenant not in user.app_metadata.organization_ids:
            await self.update_user_organizations(
                user.user_id, user.app_metadata.organization_ids + [update_data.tenant]
            )
            await self.update_user_role_assignment(user.user_id, UserRole.ADMIN)
