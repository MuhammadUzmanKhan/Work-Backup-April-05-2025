from datetime import timedelta

from backend.access_control.brivo import models
from backend.access_control.models import (
    AccessControlIntegration,
    AccessPointEventResponse,
    AccessPointResponse,
)
from backend.database import access_points_models as ap_models
from backend.database import orm
from backend.database.database import Database
from backend.database.session import TenantAwareAsyncSession
from backend.utils import AwareDatetime
from backend.value_store import ValueStore

from .client import BrivoClient


async def has_brivo_integration(session: TenantAwareAsyncSession) -> bool:
    return await orm.BrivoIntegration.has_brivo_integration(session)


async def get_brivo_integration(
    session: TenantAwareAsyncSession,
) -> AccessControlIntegration | None:
    brivo_integration = await orm.BrivoIntegration.get_brivo_integration(session)
    return (
        AccessControlIntegration(
            vendor=ap_models.AccessPointVendor.BRIVO,
            is_active=bool(brivo_integration.api_key),
            remote_unlock_enabled=bool(brivo_integration.api_key),
        )
        if brivo_integration
        else None
    )


async def create_brivo_access_control_integration(
    authorization_code: str,
    brivo_client: BrivoClient,
    tenant: str,
    db: Database,
    value_store: ValueStore,
) -> None:
    authorisation_response = await brivo_client.authorise(authorization_code)
    expires = timedelta(seconds=authorisation_response.expires_in)

    await value_store.set_model(
        key=tenant,
        model=models.BrivoAuthorisationData(
            access_token=authorisation_response.access_token, expires=expires
        ),
        expiration=expires,
    )

    async with db.tenant_session(tenant=tenant) as session:
        await orm.BrivoIntegration.upsert_refresh_token(
            session, authorisation_response.refresh_token
        )


async def remove_brivo_integration(session: TenantAwareAsyncSession) -> None:
    await orm.AccessPoint.delete_access_points_by_vendor(
        session, ap_models.AccessPointVendor.BRIVO
    )
    await orm.BrivoIntegration.delete_brivo_integration(session)


async def list_brivo_access_points(
    brivo_client: BrivoClient, tenant: str, db: Database, value_store: ValueStore
) -> list[AccessPointResponse]:
    auth_data = await _get_brivo_auth_data(
        brivo_client=brivo_client, tenant=tenant, db=db, value_store=value_store
    )

    access_points = await brivo_client.list_access_points(auth_data=auth_data)

    return [
        AccessPointResponse(
            id=str(access_point.id),
            name=access_point.name,
            vendor=ap_models.AccessPointVendor.BRIVO,
            remote_unlock_enabled=bool(auth_data.api_key),
            cameras=[],
        )
        for access_point in access_points
    ]


async def list_brivo_events(
    start_time: AwareDatetime,
    end_time: AwareDatetime,
    brivo_client: BrivoClient,
    tenant: str,
    db: Database,
    value_store: ValueStore,
) -> list[AccessPointEventResponse]:
    auth_data = await _get_brivo_auth_data(
        brivo_client=brivo_client, tenant=tenant, db=db, value_store=value_store
    )
    events = await brivo_client.list_events(
        start_time=start_time, end_time=end_time, auth_data=auth_data
    )

    return [
        AccessPointEventResponse(
            access_point_id=event.eventObject.id,
            vendor=ap_models.AccessPointVendor.BRIVO,
            description=event.eventObject.name,
            result=event.securityAction.action,
            time=event.occurred,
            actor=(event.actor.name if event.actor else None),
        )
        for event in events
    ]


async def set_api_key(
    api_key: str,
    brivo_client: BrivoClient,
    tenant: str,
    db: Database,
    value_store: ValueStore,
) -> None:
    """
    Sets the Brivo API key for a specified tenant.
    We first get the current auth info and set the api key.
    If the api key is valid, we save the new auth info.
    """

    auth_data, expires_in = await value_store.get_model_with_expiration(
        key=tenant, model_class=models.BrivoAuthorisationData
    )
    if auth_data is None or expires_in is None:
        raise models.BrivoError("Brivo Auth Data not found or has no expiration set")

    auth_data.api_key = api_key

    # Check if the api key is valid by making a request to the Brivo API
    # BrivoException will be raised if the api key is invalid
    await brivo_client.list_access_points(auth_data=auth_data)

    async with db.tenant_session() as session:
        await orm.BrivoIntegration.set_api_key(session, api_key=api_key)

    await value_store.set_model(
        key=tenant, model=auth_data, expiration=timedelta(seconds=expires_in)
    )


async def unlock_brivo_access_point(
    access_point_id: str,
    brivo_client: BrivoClient,
    tenant: str,
    db: Database,
    value_store: ValueStore,
) -> None:
    async with db.tenant_session() as session:
        has_brivo = await has_brivo_integration(session)

    if not has_brivo:
        raise models.BrivoError("Brivo Integration not found")

    auth_data = await _get_brivo_auth_data(
        brivo_client=brivo_client, tenant=tenant, db=db, value_store=value_store
    )
    if auth_data.api_key is None:
        raise models.BrivoError("Brivo API key not found")

    await brivo_client.unlock_access_point(
        auth_data=auth_data, access_point_id=int(access_point_id)
    )


async def _get_brivo_auth_data(
    brivo_client: BrivoClient, db: Database, value_store: ValueStore, tenant: str
) -> models.BrivoAuthorisationDataWithExpiration:
    auth_data, expires_in = await value_store.get_model_with_expiration(
        key=tenant, model_class=models.BrivoAuthorisationData
    )

    if auth_data is None:
        async with db.tenant_session() as session:
            brivo_integration = await orm.BrivoIntegration.get_brivo_integration(
                session
            )
            if brivo_integration is None:
                raise models.BrivoError("Brivo Integration not found")

        tokens = await brivo_client.refresh_access_token(
            brivo_integration.refresh_token
        )

        auth_data = models.BrivoAuthorisationData(
            access_token=tokens.access_token, api_key=brivo_integration.api_key
        )

        expires_in = tokens.expires_in

        await value_store.set_model(
            key=tenant, model=auth_data, expiration=timedelta(seconds=expires_in)
        )

    return models.BrivoAuthorisationDataWithExpiration(
        access_token=auth_data.access_token,
        api_key=auth_data.api_key,
        expires_in=expires_in,
    )
