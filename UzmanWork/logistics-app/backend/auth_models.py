import asyncio
import datetime
import logging
from collections import defaultdict
from typing import Callable

import boto3
import jwt
import pydantic
from botocore.exceptions import ClientError, ParamValidationError
from pydantic import BaseModel

from backend import logging_config
from backend.auth0_api import UserRole as UserRole
from backend.models import AccessRestrictions
from backend.sync_utils import run_async
from backend.value_store.value_store import ValueStore

logger = logging.getLogger(logging_config.LOGGER_NAME)


class NvrUserAuthInfo(BaseModel):
    nvr_uuid: str
    cognito_client_id: str


class AwsCognitoClient:
    def __init__(
        self,
        *,
        jwk_client: jwt.PyJWKClient,
        boto_session_fn: Callable[[], boto3.Session],
        value_store: ValueStore,
        aws_cognito_pool_id: str,
        scope: str,
    ):
        self.jwk_client = jwk_client
        self.boto_session_fn = boto_session_fn
        self.value_store = value_store
        self.aws_cognito_pool_id = aws_cognito_pool_id
        self.scope = scope
        self.client_pool_retrieve_lock: defaultdict[str, asyncio.Lock] = defaultdict(
            asyncio.Lock
        )

    def _fetch_aws_cognito_client_pool_name(
        self, aws_cognito_client_id: str
    ) -> str | None:
        """Get the pool name from the pool id by querying cognito."""
        try:
            client = self.boto_session_fn().client("cognito-idp")
            pool_data = client.describe_user_pool_client(
                UserPoolId=self.aws_cognito_pool_id, ClientId=aws_cognito_client_id
            )
        except (ClientError, ParamValidationError):
            logging.exception("Error fetching cognito pool name")
            return None

        if (
            pool_data is None
            or pool_data.get("UserPoolClient") is None
            or pool_data["UserPoolClient"].get("ClientName") is None
        ):
            logger.error(f"Pool data not found {pool_data}.")
            return None
        client_name: str = pool_data["UserPoolClient"].get("ClientName")
        return client_name

    async def _retrieve_nvr_uuid_from_cache(
        self, aws_cognito_client_id: str
    ) -> str | None:
        """Retrieve the nvr_uuid from the cache."""
        cached_entry = await self.value_store.get_model(
            key=aws_cognito_client_id, model_class=NvrUserAuthInfo
        )
        return cached_entry.nvr_uuid if cached_entry is not None else None

    async def _update_nvr_uuid_cache(
        self, aws_cognito_client_id: str, nvr_uuid: str
    ) -> None:
        """Update the nvr_uuid cache."""
        await self.value_store.set_model(
            key=aws_cognito_client_id,
            model=NvrUserAuthInfo(
                nvr_uuid=nvr_uuid, cognito_client_id=aws_cognito_client_id
            ),
            expiration=datetime.timedelta(hours=2),
        )

    async def retrieve_nvr_uuid(self, aws_cognito_client_id: str) -> str | None:
        """Retrieve the nvr_uuid from the cognito pool id."""
        # check cache first
        nvr_uuid = await self._retrieve_nvr_uuid_from_cache(aws_cognito_client_id)
        if nvr_uuid is not None:
            return nvr_uuid

        # NOTE(@lberg): Lock to prevent multiple requests to cognito
        # for the same client id at the same time.
        async with self.client_pool_retrieve_lock[aws_cognito_client_id]:
            # check cache again, another request might have already fetched it
            nvr_uuid = await self._retrieve_nvr_uuid_from_cache(aws_cognito_client_id)
            if nvr_uuid is not None:
                return nvr_uuid
            logger.info(f"Fetching cognito pool name {aws_cognito_client_id}")
            # send request to cognito
            user_uuid = await run_async(
                lambda: self._fetch_aws_cognito_client_pool_name(aws_cognito_client_id)
            )
            if user_uuid is None:
                logger.error(
                    "Cognito pool app name (nvr_uuid) not found for"
                    f" {aws_cognito_client_id=}"
                )
                return None
            await self._update_nvr_uuid_cache(aws_cognito_client_id, user_uuid)
            return user_uuid


class AppUserBase(pydantic.BaseModel):
    user_id: str
    user_email: str
    role: UserRole


class AppUserNoTenant(AppUserBase):
    """Used in endpoints which don't require a tenant."""

    all_tenants: list[str]


class AppUserFullInfo(AppUserNoTenant):
    """Used only internally, not to be exposed to endpoints.
    If the access_restrictions are needed in an endpoint then the
    get_user_access_restrictions dependency should be used."""

    access_restrictions: AccessRestrictions = AccessRestrictions()


class AppUser(AppUserBase):
    """Used in endpoints which require a tenant."""

    tenant: str


class EdgeUserNoTenant(pydantic.BaseModel):
    user_uuid: str


class EdgeUser(EdgeUserNoTenant):
    tenant: str
