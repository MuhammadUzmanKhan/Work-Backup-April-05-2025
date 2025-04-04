from typing import Sized

from fastapi import Request

from backend.database import orm
from backend.database.models import RegisterThumbnailsRequest
from backend.database.session import TenantAwareAsyncSession
from backend.instrumentation.influx_serializer import InfluxSerializer
from backend.instrumentation.utils import _get_unparametrized_path
from backend.models import AccessRestrictions


async def filter_thumbnails_request_by_nvr(
    session: TenantAwareAsyncSession,
    register_thumbnails_request: RegisterThumbnailsRequest,
    nvr_uuid: str,
) -> RegisterThumbnailsRequest:
    allowed_mac_addresses = await orm.NVR.get_allowed_mac_addresses(
        session,
        nvr_uuid,
        [
            mct_image.camera_mac_address
            for mct_image in register_thumbnails_request.thumbnails
        ],
    )
    return RegisterThumbnailsRequest(
        thumbnails=[
            thumb
            for thumb in register_thumbnails_request.thumbnails
            if thumb.camera_mac_address in allowed_mac_addresses
        ]
    )


async def filter_cameras_by_access(
    session: TenantAwareAsyncSession,
    access: AccessRestrictions,
    mac_addresses: list[str],
) -> list[str]:
    cameras = await orm.Camera.get_allowed_cameras_by_mac_address(
        session, mac_addresses, access
    )
    return [camera.mac_address for camera in cameras]


# TODO(@lberg): consider removing if not used
# 31/01/2024, we are investigating thumbnails usage
async def instrument_thumbnails_endpoint(
    request: Request, thumbnails: Sized, tenant: str
) -> str:
    serializer = InfluxSerializer(measurement_name="thumbnails_endpoint")
    serializer.add_tag("url", _get_unparametrized_path(request))
    serializer.add_tag("tenant", tenant)
    serializer.add_field("num_thumbnails", len(thumbnails))
    if request.client:
        serializer.add_tag("ip", str(request.client.host))

    return serializer.get_as_string()
