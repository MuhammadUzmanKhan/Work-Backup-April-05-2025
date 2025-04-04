from typing import AsyncGenerator
from unittest.mock import MagicMock, Mock

import pytest
import pytest_asyncio
from fastapi import FastAPI
from httpx import AsyncClient
from pytest_mock import MockerFixture

from backend.database import database, orm
from backend.database.models import Camera, CameraFlag, SubscriberAlertType
from backend.database.organization_models import Organization
from backend.dependencies import get_slack_client
from backend.monitor.router import monitor_router
from backend.monitor.router_edge import monitor_router_edge
from backend.test.factory_types import RandomStringFactory


@pytest.fixture()
def patched_slack_alert_sender(mocker: MockerFixture) -> MagicMock:
    return mocker.patch("backend.monitor.router.send_slack_alert")


@pytest.fixture()
def patched_slack_alert_sender_edge(mocker: MockerFixture) -> MagicMock:
    return mocker.patch("backend.monitor.router_edge.send_slack_alert")


@pytest_asyncio.fixture()
async def alert_subscribers(
    db_instance: database.Database,
    create_email: RandomStringFactory,
    organization: Organization,
) -> list[str]:
    targets = [create_email() for _ in range(3)]
    async with db_instance.tenant_session(tenant=organization.tenant) as session:
        for target in targets:
            await orm.OrganizationAlertSubscriber.add_organization_alert_subscriber(
                session, SubscriberAlertType.EMAIL, alert_target=target
            )
    return targets


@pytest_asyncio.fixture()
async def monitor_client(
    app: FastAPI, slack_client_mock: Mock
) -> AsyncGenerator[AsyncClient, None]:
    app.include_router(monitor_router)
    app.include_router(monitor_router_edge)
    app.dependency_overrides[get_slack_client] = lambda: slack_client_mock

    async with AsyncClient(app=app, base_url="http://localhost/monitor") as client:
        yield client


@pytest_asyncio.fixture()
async def faulty_camera(
    db_instance: database.Database, camera: Camera, organization: Organization
) -> Camera:
    async with db_instance.tenant_session(tenant=organization.tenant) as session:
        await orm.Camera.update_camera_flag(
            session=session,
            mac_address=camera.mac_address,
            flag_enum=CameraFlag.IS_FAULTY,
            flag_value=True,
        )
    return camera
