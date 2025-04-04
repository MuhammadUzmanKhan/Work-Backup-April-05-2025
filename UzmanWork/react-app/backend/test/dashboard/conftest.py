from typing import AsyncGenerator

import pytest_asyncio
from fastapi import FastAPI
from httpx import AsyncClient
from pydantic import EmailStr

from backend import auth_models
from backend.dashboard.router import dashboard_router
from backend.database import dashboard_models as dashboard_models
from backend.database import database, orm
from backend.test.dashboard.factory_types import DashboardFactory
from backend.utils import AwareDatetime


@pytest_asyncio.fixture()
async def dashboard_client(app: FastAPI) -> AsyncGenerator[AsyncClient, None]:
    app.include_router(dashboard_router)

    async with AsyncClient(app=app, base_url="http://localhost/dashboard") as client:
        yield client


@pytest_asyncio.fixture
async def create_dashboard(db_instance: database.Database) -> DashboardFactory:
    async def create_dashboard_inner(
        dashboard_create: dashboard_models.DashboardCreate, tenant: str
    ) -> dashboard_models.Dashboard:
        async with db_instance.tenant_session(tenant=tenant) as session:
            dashboard_id = await orm.Dashboard.create_dashboard(
                session, dashboard_create
            )
            dashboard = await orm.Dashboard.get_dashboard_by_id(session, dashboard_id)
            return dashboard

    return create_dashboard_inner


@pytest_asyncio.fixture
async def dashboard(
    create_dashboard: DashboardFactory,
    organization: orm.Organization,
    app_user: auth_models.AppUser,
) -> dashboard_models.Dashboard:
    return await create_dashboard(
        dashboard_create=dashboard_models.DashboardCreate(
            title="Test Dashboard",
            description="This is a test dashboard",
            reports_order=[],
            owner_user_email=EmailStr(app_user.user_email),
            creation_time=AwareDatetime.utcnow(),
        ),
        tenant=str(organization.tenant),
    )
