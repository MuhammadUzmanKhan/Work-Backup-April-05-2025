import logging

from backend import logging_config
from backend.database import access_points_models as ap_models
from backend.database import orm
from backend.database.database import Database
from backend.database.session import TenantAwareAsyncSession
from backend.utils import AwareDatetime

from ..models import (
    AccessControlIntegration,
    AccessPointEventResponse,
    AccessPointResponse,
    AuthorizeAltaRequest,
)
from .client import AltaClient
from .constants import (
    ALTA_INTEGRATION_USER_NAME,
    CLOUD_KEY_MODEL_NAME,
    SUPER_ADMIN_ROLE_NAME,
    generate_alta_integration_user_credential_cloud_key_name,
    get_alta_integration_user_email,
)
from .models import (
    AltaAuthorisationData,
    AltaCreateUserCredentialCloudKey,
    AltaCreateUserCredentialRequestBody,
    AltaCreateUserIdentity,
    AltaCreateUserRequestBody,
    AltaCredentialData,
    AltaError,
    AltaEvent,
    AltaSetUserZoneRequestBody,
    AltaUserData,
)

logger = logging.getLogger(logging_config.LOGGER_NAME)


async def get_alta_integration(
    session: TenantAwareAsyncSession,
) -> AccessControlIntegration | None:
    internal_alta_integration = await orm.AltaIntegration.get_alta_integration(session)
    return (
        AccessControlIntegration(
            vendor=ap_models.AccessPointVendor.ALTA,
            is_active=True,
            remote_unlock_enabled=(
                internal_alta_integration.external_user_id is not None
            ),
        )
        if internal_alta_integration
        else None
    )


async def create_alta_access_control_integration(
    request: AuthorizeAltaRequest, alta_client: AltaClient, tenant: str, db: Database
) -> AccessControlIntegration:
    auth_data = await alta_client.authorize(
        email=request.email, password=request.password, mfa_code=request.mfa_code
    )

    # https://openpath.readme.io/docs/create-an-openpath-bot
    if request.enable_remote_unlock:
        integration_user = await alta_client.get_user_by_email(
            auth_data=auth_data, email=get_alta_integration_user_email(tenant)
        )

        if integration_user is None:
            integration_user = (
                await _create_integration_user_and_assign_super_admin_role(
                    alta_client=alta_client, auth_data=auth_data, tenant=tenant
                )
            )

            cloud_key_credential = await _create_cloud_key_credential_for_user(
                alta_client=alta_client,
                auth_data=auth_data,
                integration_user=integration_user,
            )

            zones = await alta_client.list_zones(auth_data=auth_data)
            await alta_client.set_user_zones(
                auth_data=auth_data,
                user_id=integration_user.id,
                payload=[AltaSetUserZoneRequestBody(zoneId=zone.id) for zone in zones],
            )
        else:
            cloud_key_credential = await _find_integration_user_cloud_key_credential(
                alta_client=alta_client,
                auth_data=auth_data,
                integration_user=integration_user,
            )
    else:
        integration_user = None
        cloud_key_credential = None

    async with db.tenant_session() as session:
        await orm.AltaIntegration.update_integration_auth_data(
            session,
            public_key=auth_data.public_key,
            private_key=auth_data.private_key,
            cert_id=auth_data.cert_id,
            org_id=auth_data.org_id,
        )

        await orm.AltaIntegration.update_integration_user_and_cloud_key_credential(
            session,
            external_user_id=integration_user.id if integration_user else None,
            cloud_key_credential_id=(
                cloud_key_credential.id if cloud_key_credential else None
            ),
        )

    return AccessControlIntegration(
        vendor=ap_models.AccessPointVendor.ALTA,
        is_active=True,
        remote_unlock_enabled=integration_user is not None,
    )


async def remove_alta_integration(session: TenantAwareAsyncSession) -> None:
    # There is no way to delete the user from Alta, so we just remove the
    # stored data. Clients will have to remove the user from Alta manually.
    await orm.AccessPoint.delete_access_points_by_vendor(
        session, ap_models.AccessPointVendor.ALTA
    )
    await orm.AltaIntegration.delete_alta_integration(session)


async def list_alta_access_points(
    alta_client: AltaClient, db: Database
) -> list[AccessPointResponse]:
    async with db.tenant_session() as session:
        auth_data = await _get_alta_auth_data(session)

    return [
        AccessPointResponse(
            id=str(access_point.id),
            name=access_point.name,
            vendor=ap_models.AccessPointVendor.ALTA,
            remote_unlock_enabled=auth_data.remote_unlock_enabled,
            cameras=[],
        )
        for access_point in await alta_client.list_entries(auth_data=auth_data)
    ]


async def list_alta_events(
    start_time: AwareDatetime,
    end_time: AwareDatetime,
    alta_client: AltaClient,
    db: Database,
) -> list[AccessPointEventResponse]:
    async with db.tenant_session() as session:
        auth_data = await _get_alta_auth_data(session)

    events = await alta_client.list_events(
        auth_data=auth_data, start_time=start_time, end_time=end_time
    )
    return [
        AccessPointEventResponse(
            access_point_id=event.entryId,
            vendor=ap_models.AccessPointVendor.ALTA,
            description=_to_alta_event_description(event),
            result=event.result if event.result else "Unknown",
            time=event.timeIsoString,
            actor=event.userName,
        )
        for event in events
    ]


async def unlock_alta_access_point(
    access_point_id: str, alta_client: AltaClient, db: Database
) -> None:
    async with db.tenant_session() as session:
        auth_data = await _get_alta_auth_data(session)

        integration = await orm.AltaIntegration.get_alta_integration(session)
        if integration is None:
            raise AltaError("Alta integration not found")

    if (
        integration.external_user_id is None
        or integration.cloud_key_credential_id is None
    ):
        raise AltaError("Alta Integration User or Cloud Key Credential not found")

    await alta_client.unlock_access_point(
        auth_data=auth_data,
        user_id=integration.external_user_id,
        access_point_id=int(access_point_id),
        credential_id=integration.cloud_key_credential_id,
    )


async def _create_integration_user_and_assign_super_admin_role(
    alta_client: AltaClient, auth_data: AltaAuthorisationData, tenant: str
) -> AltaUserData:
    integration_user = await alta_client.create_user(
        auth_data=auth_data,
        user_data=AltaCreateUserRequestBody(
            identity=AltaCreateUserIdentity(
                email=get_alta_integration_user_email(tenant),
                firstName=ALTA_INTEGRATION_USER_NAME,
            ),
            hasRemoteUnlock=True,
        ),
    )
    logger.info(f"Created Alta Integration User: {integration_user.id} for {tenant=}")
    roles = await alta_client.list_roles(auth_data=auth_data)
    super_admin_role = next(
        (role for role in roles if role.name == SUPER_ADMIN_ROLE_NAME), None
    )
    if super_admin_role is None:
        raise AltaError("'Super Admin Role' not found")
    await alta_client.add_user_to_role(
        auth_data=auth_data, user_id=integration_user.id, role_id=super_admin_role.id
    )
    logger.info(f"Added 'Super Admin Role' to {integration_user.id=}")
    return integration_user


async def _create_cloud_key_credential_for_user(
    alta_client: AltaClient,
    auth_data: AltaAuthorisationData,
    integration_user: AltaUserData,
) -> AltaCredentialData:
    credential_types = await alta_client.list_credential_types(auth_data=auth_data)
    cloud_key_credential_type = next(
        (kt for kt in credential_types if kt.modelName == CLOUD_KEY_MODEL_NAME), None
    )
    if cloud_key_credential_type is None:
        raise AltaError("'Cloud Key' credential not found")
    cloud_key_credential = await alta_client.create_user_credential(
        auth_data=auth_data,
        user_id=integration_user.id,
        payload=AltaCreateUserCredentialRequestBody(
            credentialTypeId=cloud_key_credential_type.id,
            cloudKey=AltaCreateUserCredentialCloudKey(
                name=generate_alta_integration_user_credential_cloud_key_name()
            ),
        ),
    )
    logger.info(f"Created Cloud Key Credential: {cloud_key_credential.id=}")
    return cloud_key_credential


async def _find_integration_user_cloud_key_credential(
    alta_client: AltaClient,
    auth_data: AltaAuthorisationData,
    integration_user: AltaUserData,
) -> AltaCredentialData:
    cloud_key_credentials = await alta_client.list_user_credentials(
        auth_data=auth_data, user_id=integration_user.id
    )
    cloud_key_credential = next(
        (
            credential
            for credential in cloud_key_credentials
            if credential.credentialType.modelName == CLOUD_KEY_MODEL_NAME
        ),
        None,
    )
    if not cloud_key_credential:
        logger.error(f"Cloud Key Credential not found for {integration_user.id=}")
        raise AltaError(
            "Cloud Key Credential not found for the existing Alta Integration User."
        )
    return cloud_key_credential


async def _get_alta_auth_data(
    session: TenantAwareAsyncSession,
) -> AltaAuthorisationData:
    internal_alta_integration = await orm.AltaIntegration.get_alta_integration(session)
    if internal_alta_integration is None:
        raise AltaError("Alta integration not found")

    return AltaAuthorisationData(
        public_key=internal_alta_integration.public_key,
        private_key=internal_alta_integration.private_key,
        cert_id=internal_alta_integration.cert_id,
        org_id=internal_alta_integration.org_id,
        remote_unlock_enabled=internal_alta_integration.external_user_id is not None,
    )


def _to_alta_event_description(event: AltaEvent) -> str:
    if event.entryName is not None and event.acuName is not None:
        return f"{event.entryName}, {event.acuName}"
    elif event.entryName is not None:
        return event.entryName
    elif event.acuName is not None:
        return event.acuName
    else:
        return "Unknown Source"
