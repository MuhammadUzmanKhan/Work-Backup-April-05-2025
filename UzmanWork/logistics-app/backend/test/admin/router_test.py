from unittest.mock import AsyncMock, patch

from fastapi import FastAPI
from httpx import AsyncClient
from starlette import status

from backend.auth_models import AppUser
from backend.database import database, orm
from backend.database.models import (
    NVR,
    FeatureFlags,
    NVRSlotsLock,
    NVRSlotsUnlock,
    UpdateOrgStreamRetentionRequest,
)
from backend.database.organization_models import Organization
from backend.database.orm import CameraGroup
from backend.models import AccessRestrictions
from backend.test.client_request import send_get_request, send_post_request
from backend.test.factory_types import (
    CameraFactory,
    EnableFeatureForOrganisationFactory,
)


async def test_admin_get_organisations(
    admin_client: AsyncClient,
    organization: Organization,
    enable_feature_for_organisation: EnableFeatureForOrganisationFactory,
) -> None:
    await enable_feature_for_organisation(
        tenant=organization.tenant, feature=FeatureFlags.GLOBAL_ADMINISTRATION_ENABLED
    )

    response = await send_get_request(admin_client, endpoint="/organisations")
    assert len(response.json()) == 1


async def test_not_admin_get_organisations(
    admin_client: AsyncClient, organization: Organization
) -> None:
    await send_get_request(
        admin_client,
        endpoint="/organisations",
        expected_status_code=status.HTTP_403_FORBIDDEN,
    )


@patch(
    "backend.admin.router.live_kinesis_retention_update_request", new_callable=AsyncMock
)
async def test_admin_update_always_on_retention(
    patched_live_kinesis_retention_update_request: AsyncMock,
    admin_client: AsyncClient,
    organization: Organization,
    camera_group: CameraGroup,
    nvr: NVR,
    create_camera: CameraFactory,
    enable_feature_for_organisation: EnableFeatureForOrganisationFactory,
    device_manager_app_user: AppUser,
) -> None:
    await enable_feature_for_organisation(
        tenant=organization.tenant, feature=FeatureFlags.GLOBAL_ADMINISTRATION_ENABLED
    )

    # generate some always-on cameras
    [
        await create_camera(
            camera_group_id=camera_group.id, nvr_uuid=nvr.uuid, is_always_streaming=True
        )
        for _ in range(10)
    ]
    await send_post_request(
        admin_client,
        endpoint="/organisations/update_always_on_retention",
        request=UpdateOrgStreamRetentionRequest(
            tenant=organization.tenant, retention_hours=24
        ),
    )

    assert patched_live_kinesis_retention_update_request.call_count == 10


async def test_admin_get_nvrs(
    admin_client: AsyncClient,
    organization: Organization,
    nvr: NVR,
    enable_feature_for_organisation: EnableFeatureForOrganisationFactory,
) -> None:
    await enable_feature_for_organisation(
        tenant=organization.tenant, feature=FeatureFlags.GLOBAL_ADMINISTRATION_ENABLED
    )

    response = await send_get_request(admin_client, endpoint="/nvrs")
    assert len(response.json()) == 1


async def test_not_admin_get_nvrs(
    admin_client: AsyncClient, organization: Organization, nvr: NVR
) -> None:
    await send_get_request(
        admin_client, endpoint="/nvrs", expected_status_code=status.HTTP_403_FORBIDDEN
    )


async def test_admin_unassign_nvr(
    app: FastAPI,
    admin_client: AsyncClient,
    nvr: NVR,
    organization: Organization,
    device_manager_app_user: AppUser,
    enable_feature_for_organisation: EnableFeatureForOrganisationFactory,
) -> None:
    await enable_feature_for_organisation(
        tenant=organization.tenant, feature=FeatureFlags.GLOBAL_ADMINISTRATION_ENABLED
    )

    await send_post_request(
        admin_client, endpoint=f"/nvrs/{nvr.uuid}/unassign", request=None
    )


async def test_not_admin_unassign_nvr(admin_client: AsyncClient, nvr: NVR) -> None:
    await send_post_request(
        admin_client,
        f"/nvrs/{nvr.uuid}/unassign",
        request=None,
        expected_status_code=status.HTTP_403_FORBIDDEN,
    )


async def test_admin_lock_unlock_nvr_slots(
    admin_client: AsyncClient,
    organization: Organization,
    nvr: NVR,
    db_instance: database.Database,
    device_manager_app_user: AppUser,
    enable_feature_for_organisation: EnableFeatureForOrganisationFactory,
) -> None:
    await enable_feature_for_organisation(
        tenant=organization.tenant, feature=FeatureFlags.GLOBAL_ADMINISTRATION_ENABLED
    )

    resp = await send_get_request(admin_client, f"/nvrs/{nvr.uuid}/is_nvr_slots_locked")
    assert resp.json() is False

    await send_post_request(
        admin_client,
        endpoint="/nvrs/lock_nvr_slots",
        request=NVRSlotsLock(nvr_uuid=nvr.uuid, num_slots=1),
    )
    resp = await send_get_request(admin_client, f"/nvrs/{nvr.uuid}/is_nvr_slots_locked")
    assert resp.json() is True

    # try to update the max camera slots for the nvr after locking
    # it should fail
    async with db_instance.tenant_session(tenant=nvr.tenant) as session:
        await orm.NVR.update_nvr_max_cameras_slots(
            session, nvr.uuid, nvr.max_cameras_slots + 1
        )

    async with db_instance.tenant_session(tenant=nvr.tenant) as session:
        nvr_ret = await orm.NVR.get_nvr_by_uuid(session, nvr.uuid, AccessRestrictions())
    assert nvr_ret is not None
    assert nvr_ret.max_cameras_slots == 1

    await send_post_request(
        admin_client,
        endpoint="/nvrs/unlock_nvr_slots",
        request=NVRSlotsUnlock(nvr_uuid=nvr.uuid),
    )

    resp = await send_get_request(admin_client, f"/nvrs/{nvr.uuid}/is_nvr_slots_locked")
    assert resp.json() is False

    # try to update the max camera slots for the nvr after unlocking
    # this should work
    async with db_instance.tenant_session(tenant=nvr.tenant) as session:
        await orm.NVR.update_nvr_max_cameras_slots(
            session, nvr.uuid, nvr.max_cameras_slots + 1
        )

    async with db_instance.tenant_session(tenant=nvr.tenant) as session:
        nvr_ret = await orm.NVR.get_nvr_by_uuid(session, nvr.uuid, AccessRestrictions())
    assert nvr_ret is not None
    assert nvr_ret.max_cameras_slots == nvr.max_cameras_slots + 1
