from typing import AsyncGenerator
from unittest.mock import AsyncMock

import pytest_asyncio
from fastapi import FastAPI
from httpx import AsyncClient

from backend.access_control.alta.models import AltaAcu, AltaAuthorisationData, AltaEntry
from backend.access_control.brivo.models import BrivoAccessPoint, BrivoAuthorisationData
from backend.access_control.router import access_control_router
from backend.database import access_points_models as ap_models
from backend.database import database, orm
from backend.database.alta_integration_models import AltaIntegration
from backend.database.brivo_integration_models import BrivoIntegration
from backend.database.models import Location
from backend.database.organization_models import Organization
from backend.database.orm import orm_access_point
from backend.dependencies import get_alta_client, get_brivo_client
from backend.test.access_control.factory_types import AccessPointFactory
from backend.value_store import ValueStore

DEFAULT_ACCESS_CONTROL_ID = 1
DEFAULT_ACCESS_CONTROL_VENDOR = "brivo"


@pytest_asyncio.fixture
async def create_access_point(db_instance: database.Database) -> AccessPointFactory:
    async def create_access_point_inner(
        access_control_id: str,
        vendor: ap_models.AccessPointVendor,
        tenant: str,
        location_id: int | None,
    ) -> ap_models.AccessPoint:
        async with db_instance.tenant_session(tenant=tenant) as session:
            access_point = orm_access_point.AccessPoint(
                id=access_control_id,
                vendor=vendor,
                tenant=tenant,
                cameras=[],
                location_id=location_id,
            )
            session.add(access_point)
        return ap_models.AccessPoint.from_orm(access_point)

    return create_access_point_inner


@pytest_asyncio.fixture
async def access_point(
    organization: Organization,
    location: Location,
    create_access_point: AccessPointFactory,
) -> ap_models.AccessPoint:
    return await create_access_point(
        access_control_id=str(DEFAULT_ACCESS_CONTROL_ID),
        vendor=ap_models.AccessPointVendor.BRIVO,
        tenant=str(organization.tenant),
        location_id=location.id,
    )


@pytest_asyncio.fixture
async def brivo_integration(
    organization: Organization, value_store: ValueStore, db_instance: database.Database
) -> BrivoIntegration:
    async with db_instance.tenant_session(tenant=organization.tenant) as session:
        await orm.BrivoIntegration.upsert_refresh_token(
            session=session, refresh_token="dummy_refresh_token"
        )
        await orm.BrivoIntegration.set_api_key(session=session, api_key="dummy_api_key")

        brivo_integration = await orm.BrivoIntegration.get_brivo_integration(session)
        if not brivo_integration:
            raise ValueError("Brivo integration not found")

    await value_store.set_model(
        key=organization.tenant,
        model=BrivoAuthorisationData(access_token="dummy_access_token", expires=1),
    )

    return brivo_integration


@pytest_asyncio.fixture
async def alta_integration(
    organization: Organization, db_instance: database.Database
) -> AltaIntegration:
    async with db_instance.tenant_session(tenant=organization.tenant) as session:
        await orm.AltaIntegration.update_integration_auth_data(
            session=session,
            public_key="dummy_public_key",
            private_key="dummy_private_key",
            cert_id=1,
            org_id=1,
        )
        await orm.AltaIntegration.update_integration_user_and_cloud_key_credential(
            session=session, external_user_id=1, cloud_key_credential_id=1
        )

        alta_integration = await orm.AltaIntegration.get_alta_integration(session)
        if not alta_integration:
            raise ValueError("Alta integration not found")

    return alta_integration


async def mock_brivo_list_access_points(
    auth_data: BrivoAuthorisationData,
) -> list[BrivoAccessPoint]:
    return [
        BrivoAccessPoint(
            id=DEFAULT_ACCESS_CONTROL_ID,
            name="Test Brivo Access Point",
            controlPanelId=123,
            siteId=456,
            siteName="Test Site",
            activationEnabled=True,
            type="SomeType",
            twoFactorEnabled=False,
            reportLiveStatus=True,
        )
    ]


async def mock_alta_list_entries(auth_data: AltaAuthorisationData) -> list[AltaEntry]:
    return [
        AltaEntry(
            id=DEFAULT_ACCESS_CONTROL_ID,
            name="Test Alta Entry",
            acu=AltaAcu(id=1, name="Alta ACU name"),
        )
    ]


def get_brivo_client_mock() -> AsyncMock:
    mock_brivo_client = AsyncMock()
    mock_brivo_client.list_access_points = mock_brivo_list_access_points
    return mock_brivo_client


def get_alta_client_mock() -> AsyncMock:
    mock_alta_client = AsyncMock()
    mock_alta_client.list_entries = mock_alta_list_entries
    return mock_alta_client


@pytest_asyncio.fixture()
async def access_control_client(
    app: FastAPI, brivo_integration: BrivoIntegration, alta_integration: AltaIntegration
) -> AsyncGenerator[AsyncClient, None]:
    app.include_router(access_control_router)

    app.dependency_overrides[get_brivo_client] = get_brivo_client_mock
    app.dependency_overrides[get_alta_client] = get_alta_client_mock

    async with AsyncClient(
        app=app, base_url="http://localhost/access_control"
    ) as client:
        yield client
