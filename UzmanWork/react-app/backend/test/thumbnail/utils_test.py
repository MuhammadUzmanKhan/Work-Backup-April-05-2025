from backend.database import database
from backend.database.models import (
    NVR,
    Camera,
    CameraGroup,
    Location,
    RegisterThumbnailsRequest,
    ThumbnailCreate,
    ThumbnailType,
)
from backend.database.organization_models import Organization
from backend.test.factory_types import CameraFactory, NVRFactory
from backend.thumbnail.utils import filter_thumbnails_request_by_nvr
from backend.utils import AwareDatetime


def _generate_thumbnails_for_camera(
    camera: Camera, num_thumbs: int = 100
) -> list[ThumbnailCreate]:
    return [
        ThumbnailCreate(
            camera_mac_address=camera.mac_address,
            timestamp=AwareDatetime.utcnow(),
            s3_path="s3://some/path",
            thumbnail_type=ThumbnailType.THUMBNAIL,
        )
        for _ in range(num_thumbs)
    ]


async def test_filter_thumbnails_request_by_nvr_all_valid(
    db_instance: database.Database,
    camera_group: CameraGroup,
    nvr: NVR,
    create_camera: CameraFactory,
    organization: Organization,
) -> None:
    camera_1 = await create_camera(camera_group_id=camera_group.id, nvr_uuid=nvr.uuid)
    camera_2 = await create_camera(camera_group_id=camera_group.id, nvr_uuid=nvr.uuid)

    request = RegisterThumbnailsRequest(
        thumbnails=_generate_thumbnails_for_camera(camera_1, num_thumbs=100)
        + _generate_thumbnails_for_camera(camera_2, num_thumbs=100)
    )
    async with db_instance.tenant_session(tenant=organization.tenant) as session:
        request_filtered = await filter_thumbnails_request_by_nvr(
            session, request, nvr.uuid
        )
        assert request_filtered == request


async def test_filter_thumbnails_request_by_nvr_partial_valid(
    db_instance: database.Database,
    camera_group: CameraGroup,
    nvr: NVR,
    create_camera: CameraFactory,
    location: Location,
    create_nvr: NVRFactory,
    organization: Organization,
) -> None:
    other_nvr = await create_nvr(location_id=location.id)
    camera_1 = await create_camera(camera_group_id=camera_group.id, nvr_uuid=nvr.uuid)
    camera_2 = await create_camera(
        camera_group_id=camera_group.id, nvr_uuid=other_nvr.uuid
    )

    thumbnails_camera_1 = _generate_thumbnails_for_camera(camera_1, num_thumbs=100)
    thumbnails_camera_2 = _generate_thumbnails_for_camera(camera_2, num_thumbs=100)

    request = RegisterThumbnailsRequest(
        thumbnails=thumbnails_camera_1 + thumbnails_camera_2
    )
    async with db_instance.tenant_session(tenant=organization.tenant) as session:
        request_filtered = await filter_thumbnails_request_by_nvr(
            session, request, nvr.uuid
        )
        assert request_filtered.thumbnails == thumbnails_camera_1


async def test_filter_thumbnails_request_by_nvr_all_invalid(
    db_instance: database.Database,
    camera_group: CameraGroup,
    nvr: NVR,
    create_camera: CameraFactory,
    location: Location,
    create_nvr: NVRFactory,
    organization: Organization,
) -> None:
    other_nvr = await create_nvr(location_id=location.id)
    other_camera = await create_camera(
        camera_group_id=camera_group.id, nvr_uuid=other_nvr.uuid
    )

    thumbnails = _generate_thumbnails_for_camera(other_camera, num_thumbs=100)

    request = RegisterThumbnailsRequest(thumbnails=thumbnails)
    async with db_instance.tenant_session(tenant=organization.tenant) as session:
        request_filtered = await filter_thumbnails_request_by_nvr(
            session, request, nvr.uuid
        )
        assert request_filtered.thumbnails == []
