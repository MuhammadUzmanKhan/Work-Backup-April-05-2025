from datetime import timedelta

import pytest

from backend.database import database
from backend.database.face_models import FaceOccurrenceCreate
from backend.database.models import NVR, Camera, CameraGroup, Location
from backend.database.organization_models import Organization
from backend.face.face_upload_utils import NoNVRsFoundError, pick_nvr_for_face_upload
from backend.face.models import RegisterFacesRequest, UniqueFaceEdgeData
from backend.face.utils import filter_faces_request_by_nvr
from backend.models import AccessRestrictions
from backend.s3_utils import S3Path
from backend.test.factory_types import CameraFactory, NVRFactory, OrganizationFactory
from backend.utils import AwareDatetime


def _generate_faces_for_camera(
    camera: Camera, num_unique_faces: int = 10, num_occurrences_for_face: int = 10
) -> tuple[list[UniqueFaceEdgeData], list[FaceOccurrenceCreate]]:
    unique_faces = [
        UniqueFaceEdgeData(
            unique_face_id=f"unique_face_{i}_{camera.mac_address}",
            s3_path=S3Path("s3://some/path"),
        )
        for i in range(num_unique_faces)
    ]

    face_occurrences = []
    for unique_face in unique_faces:
        face_occurrences += [
            FaceOccurrenceCreate(
                nvr_unique_face_id=unique_face.unique_face_id,
                camera_mac_address=camera.mac_address,
                occurrence_time=AwareDatetime.utcnow(),
            )
            for _ in range(num_occurrences_for_face)
        ]

    return unique_faces, face_occurrences


async def test_filter_faces_request_by_nvr_all_valid(
    db_instance: database.Database,
    camera_group: CameraGroup,
    nvr: NVR,
    create_camera: CameraFactory,
    organization: Organization,
) -> None:
    camera_1 = await create_camera(camera_group_id=camera_group.id, nvr_uuid=nvr.uuid)
    camera_2 = await create_camera(camera_group_id=camera_group.id, nvr_uuid=nvr.uuid)

    unique_faces_camera_1, face_occurrences_camera_1 = _generate_faces_for_camera(
        camera_1
    )
    unique_faces_camera_2, face_occurrences_camera_2 = _generate_faces_for_camera(
        camera_2
    )

    request = RegisterFacesRequest(
        new_unique_faces=unique_faces_camera_1 + unique_faces_camera_2,
        new_face_occurrences=face_occurrences_camera_1 + face_occurrences_camera_2,
    )

    async with db_instance.tenant_session(tenant=organization.tenant) as session:
        request_filtered = await filter_faces_request_by_nvr(session, request, nvr.uuid)
        assert request_filtered == request


async def test_filter_faces_request_by_nvr_partial_valid(
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
    unique_faces_camera_1, face_occurrences_camera_1 = _generate_faces_for_camera(
        camera_1
    )
    unique_faces_camera_2, face_occurrences_camera_2 = _generate_faces_for_camera(
        camera_2
    )

    request = RegisterFacesRequest(
        new_unique_faces=unique_faces_camera_1 + unique_faces_camera_2,
        new_face_occurrences=face_occurrences_camera_1 + face_occurrences_camera_2,
    )

    async with db_instance.tenant_session(tenant=organization.tenant) as session:
        request_filtered = await filter_faces_request_by_nvr(session, request, nvr.uuid)
        assert (
            request_filtered.new_unique_faces
            == unique_faces_camera_1 + unique_faces_camera_2
        )
        assert request_filtered.new_face_occurrences == face_occurrences_camera_1


async def test_filter_faces_request_by_nvr_all_invalid(
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

    unique_faces, face_occurrences = _generate_faces_for_camera(other_camera)

    request = RegisterFacesRequest(
        new_unique_faces=unique_faces, new_face_occurrences=face_occurrences
    )
    async with db_instance.tenant_session(tenant=organization.tenant) as session:
        request_filtered = await filter_faces_request_by_nvr(session, request, nvr.uuid)
        assert request_filtered.new_unique_faces == unique_faces
        assert request_filtered.new_face_occurrences == []


async def test_pick_nvr_for_face_upload_no_access(
    db_instance: database.Database, organization: Organization
) -> None:
    async with db_instance.tenant_session(organization.tenant) as session:
        with pytest.raises(NoNVRsFoundError):
            await pick_nvr_for_face_upload(
                session, AccessRestrictions(full_access=False)
            )

    async with db_instance.tenant_session(organization.tenant) as session:
        with pytest.raises(NoNVRsFoundError):
            await pick_nvr_for_face_upload(
                session, AccessRestrictions(full_access=False, location_ids=[-1])
            )


async def test_pick_nvr_for_face_upload_no_nvrs(
    db_instance: database.Database, create_organization: OrganizationFactory
) -> None:
    organization = await create_organization()
    async with db_instance.tenant_session(organization.tenant) as session:
        with pytest.raises(NoNVRsFoundError):
            await pick_nvr_for_face_upload(session, AccessRestrictions())


async def test_pick_nvr_for_face_upload_prefer_online(
    db_instance: database.Database, nvr: NVR, create_nvr: NVRFactory
) -> None:
    yesterday = AwareDatetime.utcnow() - timedelta(days=1)
    for _ in range(10):
        await create_nvr(location_id=nvr.location_id, last_seen_time=yesterday)

    async with db_instance.tenant_session(nvr.tenant) as session:
        picked_nvr = await pick_nvr_for_face_upload(session, AccessRestrictions())
        assert picked_nvr.uuid == nvr.uuid
