from typing import AsyncGenerator

import pytest_asyncio
from fastapi import FastAPI
from httpx import AsyncClient

from backend import auth_models
from backend.database import database, orm
from backend.database import tag_models as tag_models
from backend.tag.router import tags_router
from backend.test.tag.factory_types import TagFactory


@pytest_asyncio.fixture()
async def tag_client(app: FastAPI) -> AsyncGenerator[AsyncClient, None]:
    app.include_router(tags_router)

    async with AsyncClient(app=app, base_url="http://localhost/tags") as client:
        yield client


@pytest_asyncio.fixture
async def create_tag(db_instance: database.Database) -> TagFactory:
    async def create_tag_inner(name: str, tenant: str) -> tag_models.Tag:
        async with db_instance.tenant_session(tenant=tenant) as session:
            return await orm.Tag.create_tag(session, name)

    return create_tag_inner


@pytest_asyncio.fixture
async def tag(
    create_tag: TagFactory,
    organization: orm.Organization,
    app_user: auth_models.AppUser,
) -> tag_models.Tag:
    return await create_tag(name="Test Tag", tenant=str(organization.tenant))
