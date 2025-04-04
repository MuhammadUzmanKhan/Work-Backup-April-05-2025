from datetime import timedelta

import fastapi
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from backend.database import models, orm
from backend.database.session import TenantAwareAsyncSession
from backend.models import (
    AccessRestrictions,
    CameraResponse,
    CameraWithOnlineStatus,
    NVRResponse,
)


async def resolve_id_to_mac_address_or_fail(
    session: TenantAwareAsyncSession, camera_id: int
) -> str:
    try:
        return await orm.Camera.resolve_id_to_mac_address(session, camera_id)
    except orm.orm_camera.CameraNotFoundError:
        raise fastapi.HTTPException(
            status_code=fastapi.status.HTTP_400_BAD_REQUEST, detail="Camera not found"
        )


async def check_camera_access(
    session: TenantAwareAsyncSession,
    access: AccessRestrictions,
    mac_addresses: list[str],
) -> None:
    if not await orm.Camera.user_has_access_to_mac_addresses(
        session, mac_addresses, access
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No permission to access the camera",
        )


async def check_location_access(
    access: AccessRestrictions, requested_location_ids: set[int]
) -> None:
    if not (access.full_access or requested_location_ids.issubset(access.location_ids)):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="The user doesn't have access to the requested locations.",
        )


async def get_nvr_from_uuid_or_fail(
    session: TenantAwareAsyncSession, access: AccessRestrictions, nvr_uuid: str
) -> models.NVR:
    nvr = await orm.NVR.get_nvr_by_uuid(session, nvr_uuid, access)
    if nvr is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="NVR not found"
        )
    return nvr


async def get_nvr_response_from_uuid_or_fail(
    session: TenantAwareAsyncSession, access: AccessRestrictions, nvr_uuid: str
) -> NVRResponse:
    nvr = await orm.NVR.get_nvr_response_by_uuid(session, nvr_uuid, access)
    if nvr is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail=f"{nvr_uuid=} not found"
        )
    return nvr


async def get_nvr_responses_from_uuid_or_fail(
    session: TenantAwareAsyncSession, access: AccessRestrictions, nvr_uuids: list[str]
) -> list[NVRResponse]:
    nvrs = await orm.NVR.get_nvrs_response_by_uuid(session, nvr_uuids, access)
    if len(nvrs) != len(nvr_uuids):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="NVR not found"
        )
    return nvrs


async def get_cameras_from_mac_address_or_fail(
    session: TenantAwareAsyncSession,
    access: AccessRestrictions,
    mac_addresses: list[str],
) -> list[CameraWithOnlineStatus]:
    cameras = await orm.Camera.get_allowed_cameras_by_mac_address(
        session, access=access, mac_addresses=mac_addresses
    )
    if len(cameras) != len(mac_addresses):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Camera not found or the user doesn't have access to it.",
        )
    return cameras


async def get_camera_from_mac_address_or_fail(
    session: TenantAwareAsyncSession, access: AccessRestrictions, mac_address: str
) -> CameraWithOnlineStatus:
    cameras = await orm.Camera.get_allowed_cameras_by_mac_address(
        session, access=access, mac_addresses=[mac_address]
    )
    if len(cameras) != 1:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Camera not found or the user doesn't have access to it.",
        )
    return cameras[0]


async def get_camera_response_from_mac_address_or_fail(
    session: TenantAwareAsyncSession, access: AccessRestrictions, mac_address: str
) -> CameraResponse:
    camera_responses = await orm.Camera.get_cameras(
        session, models.CamerasQueryConfig(mac_addresses={mac_address}), access
    )
    if len(camera_responses) != 1:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Expected one camera, got {len(camera_responses)}",
        )
    return camera_responses[0]


async def get_org_stream_retention_or_fail(
    session: AsyncSession, tenant: str
) -> timedelta:
    retention = await orm.Organization.system_get_org_streams_retention(session, tenant)
    if retention is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"org for {tenant=} not found",
        )
    return timedelta(hours=retention)
