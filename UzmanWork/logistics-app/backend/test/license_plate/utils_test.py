from backend.database import database
from backend.database.models import NVR, Camera, CameraGroup, Location
from backend.database.organization_models import Organization
from backend.license_plate.models import RegisterLicensePlateRequest
from backend.license_plate.utils import is_license_plate_request_from_nvr
from backend.test.factory_types import CameraFactory, NVRFactory
from backend.utils import AwareDatetime


def _generate_license_plate_for_camera(camera: Camera) -> RegisterLicensePlateRequest:
    return RegisterLicensePlateRequest(
        mac_address=camera.mac_address,
        timestamp=AwareDatetime.utcnow(),
        image_s3_path="s3://some/path",
        object_id=1,
        track_id=1,
        perception_stack_start_id="--",
    )


async def test_filter_license_plates_request_by_nvr_all_valid(
    db_instance: database.Database,
    camera_group: CameraGroup,
    nvr: NVR,
    create_camera: CameraFactory,
    organization: Organization,
) -> None:
    camera_1 = await create_camera(camera_group_id=camera_group.id, nvr_uuid=nvr.uuid)
    camera_2 = await create_camera(camera_group_id=camera_group.id, nvr_uuid=nvr.uuid)

    async with db_instance.tenant_session(tenant=organization.tenant) as session:
        assert await is_license_plate_request_from_nvr(
            session, _generate_license_plate_for_camera(camera_1), nvr.uuid
        )
        assert await is_license_plate_request_from_nvr(
            session, _generate_license_plate_for_camera(camera_2), nvr.uuid
        )


async def test_filter_license_plates_request_by_nvr_partial_valid(
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

    async with db_instance.tenant_session(tenant=organization.tenant) as session:
        assert await is_license_plate_request_from_nvr(
            session, _generate_license_plate_for_camera(camera_1), nvr.uuid
        )
        assert not await is_license_plate_request_from_nvr(
            session, _generate_license_plate_for_camera(camera_2), nvr.uuid
        )


async def test_filter_license_plates_request_by_nvr_all_invalid(
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

    async with db_instance.tenant_session(tenant=organization.tenant) as session:
        assert not await is_license_plate_request_from_nvr(
            session, _generate_license_plate_for_camera(other_camera), nvr.uuid
        )
