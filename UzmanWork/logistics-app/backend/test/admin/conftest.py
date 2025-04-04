from typing import AsyncGenerator

import pytest_asyncio
from fastapi import FastAPI
from httpx import AsyncClient

from backend.admin.router import admin_router
from backend.auth import admin_user_role_guard
from backend.auth0_api import UserRole
from backend.auth_models import AppUser
from backend.envs import BackendEnvs
from backend.test.conftest import mock_app_user_guard


@pytest_asyncio.fixture()
async def admin_client(app: FastAPI) -> AsyncGenerator[AsyncClient, None]:
    app.include_router(admin_router)

    async with AsyncClient(app=app, base_url="http://localhost/admin") as client:
        yield client


@pytest_asyncio.fixture()
async def device_manager_app_user(
    app: FastAPI, app_user: AppUser, backend_envs_mock: BackendEnvs
) -> AppUser:
    backend_envs_mock.devices_managers_emails = [app_user.user_email]

    admin_user = app_user.copy()
    admin_user.role = UserRole.ADMIN
    app.dependency_overrides[admin_user_role_guard] = await mock_app_user_guard(
        admin_user
    )

    return admin_user
