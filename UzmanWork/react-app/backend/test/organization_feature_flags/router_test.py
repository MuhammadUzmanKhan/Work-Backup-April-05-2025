from typing import Any, Iterable

from fastapi import FastAPI
from httpx import AsyncClient
from pytest_mock import MockerFixture

from backend.database import database, orm
from backend.dependencies import get_auth_api
from backend.organization_feature_flags.models import (
    ExposedOrgFlags,
    UpdateOrgFlagRequest,
)
from backend.test.client_request import send_get_request, send_post_request


async def test_update_get_org_flag(
    app: FastAPI,
    db_instance: database.Database,
    org_flags_client: AsyncClient,
    mocker: MockerFixture,
) -> None:
    async def patch_impl(*args: Iterable[Any], **kwargs: dict[Any, Any]) -> None:
        return None

    mocker.patch(
        "backend.organization_feature_flags.router.on_feature_enable", new=patch_impl
    )
    mocker.patch(
        "backend.organization_feature_flags.router.on_feature_disable", new=patch_impl
    )
    app.dependency_overrides[get_auth_api] = lambda: None

    # Populate the feature flags in the database
    async with db_instance.session() as session:
        await orm.Feature.system_populate_features(session, False)

    async def check_flags(expected_value: bool) -> None:
        for e in ExposedOrgFlags:
            response = await send_get_request(
                org_flags_client, "get_org_flag", params={"org_flag": e.value}
            )
            # The flag should be set to the expected value
            assert response.json() == expected_value

    async def set_flags(value: bool) -> None:
        for e in ExposedOrgFlags:
            response = await send_post_request(
                org_flags_client,
                "update_org_flag",
                request=UpdateOrgFlagRequest(flag_enum=e, flag_value=value),
            )
            # The flag should be set to the value we just set it to
            assert response.json() == value

    # Check that all flags are set to false
    await check_flags(False)

    # Set all flags to true
    await set_flags(True)

    # Check that all flags are set to true
    await check_flags(True)

    # Set all flags to true again (should be a no-op)
    await set_flags(True)

    # Check that all flags are set to true
    await check_flags(True)

    # Set all flags to false
    await set_flags(False)

    # Check that all flags are set to false
    await check_flags(False)

    # Set all flags to false again (should be a no-op)
    await set_flags(False)

    # Check that all flags are set to false
    await check_flags(False)
