from datetime import timedelta
from unittest.mock import MagicMock

from fastapi import status
from httpx import AsyncClient
from pydantic import EmailStr

from backend import auth_models
from backend.database import database, orm
from backend.database.face_models import FaceOccurrenceCreate, NVRUniqueFace
from backend.database.models import NVR, Camera, CameraGroup, FaceAlertProfile, Location
from backend.face.models import (
    FaceOccurrenceResponse,
    FaceOccurrencesRequest,
    NVRUniqueFaceNotificationData,
    NVRUniqueFacesMergeRequest,
    RegisterFacesRequest,
    RegisterFacesResponse,
    UniqueFacesRequest,
)
from backend.test.client_request import send_post_request
from backend.test.face.face_factory_types import RegisterFacesRequestFactory
from backend.test.factory_types import (
    CameraFactory,
    FaceAlertProfileFactory,
    NVRFactory,
    NVRUniqueFaceFactory,
    RandomStringFactory,
)
from backend.utils import AwareDatetime

DEFAULT_S3_URL = "s3://test-bucket/test-key"
DEFAULT_OCCURRENCE_TIME = AwareDatetime.utcnow()


async def test_register_faces_empty(
    face_edge_client: AsyncClient, patched_face_alert_sender: MagicMock
) -> None:
    empty_register_request = RegisterFacesRequest(
        new_unique_faces=[], new_face_occurrences=[]
    )
    resp = await send_post_request(
        face_edge_client, "/register_faces", empty_register_request
    )

    response = RegisterFacesResponse.parse_obj(resp.json())
    assert len(response.missing_unique_face_ids) == 0
    # Expect no face alerts to be sent.
    patched_face_alert_sender.delay.assert_not_called()


async def test_register_faces_simple(
    face_edge_client: AsyncClient,
    register_face_request: RegisterFacesRequest,
    patched_face_alert_sender: MagicMock,
) -> None:
    await send_post_request(face_edge_client, "/register_faces", register_face_request)
    # Expect no face alerts to be sent.
    patched_face_alert_sender.delay.assert_not_called()


async def test_register_faces_invalid_mac_address(
    face_edge_client: AsyncClient,
    create_register_face_request: RegisterFacesRequestFactory,
    patched_face_alert_sender: MagicMock,
) -> None:
    register_face_request = create_register_face_request(
        mac_address="invalid_mac_address"
    )

    resp = await send_post_request(
        face_edge_client, "/register_faces", register_face_request
    )
    # Expect no face alerts to be sent.
    patched_face_alert_sender.delay.assert_not_called()

    response = RegisterFacesResponse.parse_obj(resp.json())
    assert len(response.missing_unique_face_ids) == 0


async def test_register_faces_with_missing_face(
    face_edge_client: AsyncClient,
    camera: Camera,
    register_face_request: RegisterFacesRequest,
    patched_face_alert_sender: MagicMock,
) -> None:
    # Add a face occurrence with a non-existent unique face ID, this should be
    # missing.
    MISSING_UNIQUE_FACE_ID = "missing_unique_face_id"
    register_face_request.new_face_occurrences.append(
        FaceOccurrenceCreate(
            nvr_unique_face_id=MISSING_UNIQUE_FACE_ID,
            camera_mac_address=camera.mac_address,
            occurrence_time=AwareDatetime.utcnow(),
        )
    )

    resp = await send_post_request(
        face_edge_client, "/register_faces", register_face_request
    )
    # Expect no face alerts to be sent.
    patched_face_alert_sender.delay.assert_not_called()

    response = RegisterFacesResponse.parse_obj(resp.json())
    assert response.missing_unique_face_ids == {MISSING_UNIQUE_FACE_ID}


async def test_register_faces_nvr_notify(
    face_edge_client: AsyncClient,
    create_register_face_request: RegisterFacesRequestFactory,
    patched_face_alert_sender: MagicMock,
    patched_unique_face_notification_task: MagicMock,
    camera: Camera,
    create_nvr: NVRFactory,
    location: Location,
) -> None:
    register_face_request = create_register_face_request(
        mac_address=camera.mac_address, with_track_embedding_data=True
    )
    nvrs = [await create_nvr(location_id=location.id) for _ in range(10)]

    await send_post_request(face_edge_client, "/register_faces", register_face_request)
    args = patched_unique_face_notification_task.call_args[0]
    assert len(args) == 1
    data = NVRUniqueFaceNotificationData.parse_raw(args[0])
    assert data.recipient_nvr_uuids == [nvr.uuid for nvr in nvrs]


async def test_get_unique_faces_from_multiple_cameras(
    face_client: AsyncClient,
    face_edge_client: AsyncClient,
    camera_group: CameraGroup,
    nvr: NVR,
    create_camera: CameraFactory,
    create_register_face_request: RegisterFacesRequestFactory,
    patched_face_alert_sender: MagicMock,
) -> None:
    # Create a camera that is associated with the NVR.
    unique_face_ids = ["unique_face_id_a", "unique_face_id_b"]
    occurrence_times = [
        DEFAULT_OCCURRENCE_TIME,
        DEFAULT_OCCURRENCE_TIME + timedelta(minutes=1),
    ]
    camera_a = await create_camera(camera_group.id, nvr.uuid)
    camera_b = await create_camera(camera_group.id, nvr.uuid)
    cameras = [camera_a, camera_b]
    # Register faces
    for unique_face_id, occurrence_time, camera in zip(
        unique_face_ids, occurrence_times, cameras
    ):
        # Create a register request with the unique face ID and occurrence time.
        register_request = create_register_face_request(
            unique_face_id=unique_face_id,
            mac_address=camera.mac_address,
            occurrence_time=occurrence_time,
        )
        await send_post_request(face_edge_client, "/register_faces", register_request)

    # Expect no face alerts to be sent.
    patched_face_alert_sender.delay.assert_not_called()

    for occurrence_time, camera in zip(occurrence_times, cameras):
        # Query for unique faces
        query_request = UniqueFacesRequest(
            start_time=min(occurrence_times),
            end_time=max(occurrence_times),
            location_ids={nvr.location_id},
            mac_addresses={camera.mac_address},
        )
        resp = await send_post_request(face_client, "/unique_faces", query_request)

        assert len(resp.json()) == 1
        for query_result in resp.json():
            assert query_result["s3_signed_url"] is not None and query_result[
                "s3_signed_url"
            ].startswith("https://")


# TODO: Add test for querying for unique faces with multiple locations.
async def test_get_unique_faces_invalid_location(
    face_client: AsyncClient,
    face_edge_client: AsyncClient,
    camera_group: CameraGroup,
    nvr: NVR,
    create_camera: CameraFactory,
    create_register_face_request: RegisterFacesRequestFactory,
    patched_face_alert_sender: MagicMock,
) -> None:
    # Create a camera that is associated with the NVR.
    camera = await create_camera(camera_group.id, nvr.uuid)

    # Register a face with a camera that is associated with the NVR.
    register_request = create_register_face_request(
        mac_address=camera.mac_address, occurrence_time=DEFAULT_OCCURRENCE_TIME
    )
    await send_post_request(face_edge_client, "/register_faces", register_request)
    # Expect no face alerts to be sent.
    patched_face_alert_sender.delay.assert_not_called()

    # Try to query for the face with an invalid location ID.
    invalid_location_id = nvr.location_id - 1 if nvr.location_id is not None else -1
    query_request = UniqueFacesRequest(
        start_time=DEFAULT_OCCURRENCE_TIME,
        end_time=DEFAULT_OCCURRENCE_TIME,
        location_ids={invalid_location_id},
        mac_addresses={camera.mac_address},
    )
    resp = await send_post_request(face_client, "/unique_faces", query_request)

    # Expect no unique faces found.
    assert len(resp.json()) == 0


async def test_get_unique_faces_invalid_mac_address_fails(
    face_client: AsyncClient,
    face_edge_client: AsyncClient,
    camera_group: CameraGroup,
    nvr: NVR,
    create_camera: CameraFactory,
    create_register_face_request: RegisterFacesRequestFactory,
    patched_face_alert_sender: MagicMock,
) -> None:
    # Create a camera that is associated with the NVR.
    camera = await create_camera(camera_group.id, nvr.uuid)

    # Register a face with a camera that is associated with the NVR.
    register_request = create_register_face_request(
        mac_address=camera.mac_address, occurrence_time=DEFAULT_OCCURRENCE_TIME
    )
    await send_post_request(face_edge_client, "/register_faces", register_request)

    # Expect no face alerts to be sent.
    patched_face_alert_sender.delay.assert_not_called()

    # Try to query for the unique face with an invalid camera mac address.
    query_request = UniqueFacesRequest(
        start_time=DEFAULT_OCCURRENCE_TIME,
        end_time=DEFAULT_OCCURRENCE_TIME,
        location_ids={nvr.location_id},
        mac_addresses={"invalid_mac_address"},
    )
    resp = await send_post_request(
        face_client,
        "/unique_faces",
        query_request,
        expected_status_code=status.HTTP_400_BAD_REQUEST,
    )

    assert "No permission to access the camera" in resp.json()["detail"]


async def test_get_unique_faces_invalid_time_range(
    face_client: AsyncClient,
    face_edge_client: AsyncClient,
    camera_group: CameraGroup,
    nvr: NVR,
    create_camera: CameraFactory,
    create_register_face_request: RegisterFacesRequestFactory,
    patched_face_alert_sender: MagicMock,
) -> None:
    # Create a camera that is associated with the NVR.
    camera = await create_camera(camera_group.id, nvr.uuid)

    # Register a face with a camera that is associated with the NVR.
    register_request = create_register_face_request(
        mac_address=camera.mac_address, occurrence_time=DEFAULT_OCCURRENCE_TIME
    )
    await send_post_request(face_edge_client, "/register_faces", register_request)

    # Expect no face alerts to be sent.
    patched_face_alert_sender.delay.assert_not_called()

    # Attempt to search for a face within a specified time period when no face has
    # been previously registered.
    query_request = UniqueFacesRequest(
        start_time=DEFAULT_OCCURRENCE_TIME - timedelta(hours=2),
        end_time=DEFAULT_OCCURRENCE_TIME - timedelta(hours=1),
        location_ids={nvr.location_id},
    )

    resp = await send_post_request(face_client, "/unique_faces", query_request)

    assert (
        len(resp.json()) == 0
    ), f"Expect no unique faces found, got {len(resp.json())}"


async def test_get_face_occurrences_simple(
    face_client: AsyncClient,
    face_edge_client: AsyncClient,
    camera_group: CameraGroup,
    create_nvr_unique_face: NVRUniqueFaceFactory,
    nvr: NVR,
    create_camera: CameraFactory,
    create_register_face_request: RegisterFacesRequestFactory,
    patched_face_alert_sender: MagicMock,
) -> None:
    # Create a camera that is associated with the NVR.
    camera = await create_camera(camera_group.id, nvr.uuid)
    unique_faces = [await create_nvr_unique_face(nvr.uuid) for _ in range(2)]
    occurrence_times = [
        DEFAULT_OCCURRENCE_TIME,
        DEFAULT_OCCURRENCE_TIME + timedelta(minutes=1),
    ]
    # Register faces
    for unique_face, occurrence_time in zip(unique_faces, occurrence_times):
        # Create a register request with the unique face ID and occurrence time.
        register_request = create_register_face_request(
            unique_face_id=unique_face.nvr_unique_face_id,
            mac_address=camera.mac_address,
            occurrence_time=occurrence_time,
        )
        await send_post_request(face_edge_client, "/register_faces", register_request)
    # Expect no face alerts to be sent.
    patched_face_alert_sender.delay.assert_not_called()

    for unique_face, occurrence_time in zip(unique_faces, occurrence_times):
        # Query for unique faces
        query_request = FaceOccurrencesRequest(
            start_time=occurrence_time,
            end_time=occurrence_time,
            org_unique_face_id=unique_face.org_unique_face_id,
            mac_addresses={camera.mac_address},
            location_ids={nvr.location_id},
        )
        resp = await send_post_request(face_client, "/face_occurrences", query_request)

        assert len(resp.json()) == 1
        for query_result in resp.json():
            occ = FaceOccurrenceResponse.parse_obj(query_result)
            assert occ.camera_mac_address == camera.mac_address
            assert occ.org_unique_face_id == unique_face.org_unique_face_id


async def test_get_face_occurrences_with_face_alert(
    face_client: AsyncClient,
    face_edge_client: AsyncClient,
    face_alert_client: AsyncClient,
    app_user: auth_models.AppUser,
    nvr_unique_face: NVRUniqueFace,
    face_alert_profile: FaceAlertProfile,
    camera: Camera,
    create_register_face_request: RegisterFacesRequestFactory,
    patched_face_alert_sender: MagicMock,
) -> None:
    # Create a face occurrence with a random unique face ID
    register_face_request = create_register_face_request(camera.mac_address)
    # Register face occurrence with alert disabled
    await send_post_request(face_edge_client, "/register_faces", register_face_request)
    patched_face_alert_sender.delay.assert_not_called()

    # Create a face occurrence with the face alert profile's unique face ID
    register_face_request = create_register_face_request(
        camera.mac_address, nvr_unique_face.nvr_unique_face_id
    )
    # Register face occurrence with alert enabled
    await send_post_request(face_edge_client, "/register_faces", register_face_request)
    patched_face_alert_sender.delay.assert_called_once()


async def test_get_face_occurrences_invalid_location(
    face_client: AsyncClient,
    face_edge_client: AsyncClient,
    camera_group: CameraGroup,
    nvr: NVR,
    nvr_unique_face: NVRUniqueFace,
    create_camera: CameraFactory,
    create_register_face_request: RegisterFacesRequestFactory,
    patched_face_alert_sender: MagicMock,
) -> None:
    # Create a camera that is associated with the NVR.
    camera = await create_camera(camera_group.id, nvr.uuid)

    # Create a register request with the unique face ID and occurrence time.
    register_request = create_register_face_request(
        unique_face_id=nvr_unique_face.nvr_unique_face_id,
        mac_address=camera.mac_address,
        occurrence_time=DEFAULT_OCCURRENCE_TIME,
    )
    await send_post_request(face_edge_client, "/register_faces", register_request)

    # Expect no face alerts to be sent.
    patched_face_alert_sender.delay.assert_not_called()

    # Query for unique faces with invalid location ID
    invalid_location_id = nvr.location_id - 1 if nvr.location_id is not None else -1
    query_request = FaceOccurrencesRequest(
        start_time=DEFAULT_OCCURRENCE_TIME,
        end_time=DEFAULT_OCCURRENCE_TIME,
        org_unique_face_id=nvr_unique_face.org_unique_face_id,
        mac_addresses={camera.mac_address},
        location_ids={invalid_location_id},
    )
    resp = await send_post_request(face_client, "/face_occurrences", query_request)

    # Expect no face occurrences found.
    assert len(resp.json()) == 0


async def test_get_face_occurrences_invalid_mac_address_fails(
    face_client: AsyncClient,
    face_edge_client: AsyncClient,
    camera_group: CameraGroup,
    nvr: NVR,
    nvr_unique_face: NVRUniqueFace,
    create_camera: CameraFactory,
    create_register_face_request: RegisterFacesRequestFactory,
    patched_face_alert_sender: MagicMock,
) -> None:
    # Create a camera that is associated with the NVR.
    camera = await create_camera(camera_group.id, nvr.uuid)

    # Create a register request with the unique face ID and occurrence time.
    register_request = create_register_face_request(
        unique_face_id=nvr_unique_face.nvr_unique_face_id,
        mac_address=camera.mac_address,
        occurrence_time=DEFAULT_OCCURRENCE_TIME,
    )
    await send_post_request(face_edge_client, "/register_faces", register_request)

    # Expect no face alerts to be sent.
    patched_face_alert_sender.delay.assert_not_called()

    # Query for face occurrences with invalid mac address
    query_request = FaceOccurrencesRequest(
        start_time=DEFAULT_OCCURRENCE_TIME,
        end_time=DEFAULT_OCCURRENCE_TIME,
        org_unique_face_id=nvr_unique_face.org_unique_face_id,
        mac_addresses={"invalid_mac_address"},
        location_ids={nvr.location_id},
    )
    resp = await send_post_request(
        face_client,
        "/face_occurrences",
        query_request,
        expected_status_code=status.HTTP_400_BAD_REQUEST,
    )

    assert "No permission to access the camera" in resp.json()["detail"]


async def test_get_face_occurrences_invalid_time_range(
    face_client: AsyncClient,
    face_edge_client: AsyncClient,
    camera_group: CameraGroup,
    nvr: NVR,
    nvr_unique_face: NVRUniqueFace,
    create_camera: CameraFactory,
    create_register_face_request: RegisterFacesRequestFactory,
    patched_face_alert_sender: MagicMock,
) -> None:
    # Create a camera that is associated with the NVR.
    camera = await create_camera(camera_group.id, nvr.uuid)

    # Create a register request with the unique face ID and occurrence time.
    register_request = create_register_face_request(
        unique_face_id=nvr_unique_face.nvr_unique_face_id,
        mac_address=camera.mac_address,
        occurrence_time=DEFAULT_OCCURRENCE_TIME,
    )
    await send_post_request(face_edge_client, "/register_faces", register_request)

    # Expect no face alerts to be sent.
    patched_face_alert_sender.delay.assert_not_called()

    # Query for face occurrences with invalid mac address
    query_request = FaceOccurrencesRequest(
        start_time=DEFAULT_OCCURRENCE_TIME - timedelta(minutes=10),
        end_time=DEFAULT_OCCURRENCE_TIME - timedelta(minutes=5),
        org_unique_face_id=nvr_unique_face.org_unique_face_id,
        mac_addresses={camera.mac_address},
        location_ids={nvr.location_id},
    )
    resp = await send_post_request(face_client, "/face_occurrences", query_request)

    assert (
        len(resp.json()) == 0
    ), f"Expect no face occurrences found, got {len(resp.json())}"


async def test_merge_faces(
    db_instance: database.Database,
    face_edge_client: AsyncClient,
    nvr: NVR,
    create_nvr_unique_face: NVRUniqueFaceFactory,
) -> None:
    src_face = await create_nvr_unique_face(nvr.uuid)
    dest_face = await create_nvr_unique_face(nvr.uuid)

    await send_post_request(
        face_edge_client,
        "/merge_faces",
        NVRUniqueFacesMergeRequest(
            nvr_unique_face_id_merge_src=src_face.nvr_unique_face_id,
            nvr_unique_face_id_merge_dst=dest_face.nvr_unique_face_id,
        ),
    )

    async with db_instance.tenant_session() as session:
        face_ids = await orm.NVRUniqueFace.get_org_unique_face_ids(
            session, [src_face.nvr_unique_face_id, dest_face.nvr_unique_face_id]
        )
        # check that the org face id for both src and dest
        # is the dest face's org face ID.
        assert face_ids == [dest_face.org_unique_face_id, dest_face.org_unique_face_id]
        # check that the old src org face is deleted
        old_src_org_unique_face = (
            await orm.OrganizationUniqueFace.get_unique_face_by_id(
                session, src_face.org_unique_face_id
            )
        )
        assert old_src_org_unique_face is None


async def test_merge_faces_multiple(
    db_instance: database.Database,
    face_edge_client: AsyncClient,
    nvr: NVR,
    create_nvr_unique_face: NVRUniqueFaceFactory,
) -> None:
    faces: list[NVRUniqueFace] = []
    for _ in range(10):
        faces.append(await create_nvr_unique_face(nvr.uuid))

    # merge each time with the next face
    for idx in range(0, len(faces) - 1):
        src_face = faces[idx]
        dest_face = faces[idx + 1]

        await send_post_request(
            face_edge_client,
            "/merge_faces",
            NVRUniqueFacesMergeRequest(
                nvr_unique_face_id_merge_src=src_face.nvr_unique_face_id,
                nvr_unique_face_id_merge_dst=dest_face.nvr_unique_face_id,
            ),
        )

    async with db_instance.tenant_session() as session:
        # we expect all faces to be merged into the last face
        face_ids = await orm.NVRUniqueFace.get_org_unique_face_ids(
            session, [face.nvr_unique_face_id for face in faces]
        )
        assert all([faces[-1].org_unique_face_id == face_id for face_id in face_ids])

        # we expect all the other org faces to be deleted
        for face in faces[:-1]:
            old_src_org_unique_face = (
                await orm.OrganizationUniqueFace.get_unique_face_by_id(
                    session, face.org_unique_face_id
                )
            )
            assert old_src_org_unique_face is None


async def test_merge_faces_with_alert(
    db_instance: database.Database,
    face_edge_client: AsyncClient,
    nvr: NVR,
    create_nvr_unique_face: NVRUniqueFaceFactory,
    create_face_alert_profile: FaceAlertProfileFactory,
    create_email: RandomStringFactory,
) -> None:
    src_face = await create_nvr_unique_face(nvr.uuid)
    dest_face = await create_nvr_unique_face(nvr.uuid)
    # create a face alert profile for the src face
    alert_profile = await create_face_alert_profile(
        nvr.tenant, EmailStr(create_email()), src_face.org_unique_face_id
    )
    assert alert_profile.org_unique_face.id == src_face.org_unique_face_id

    await send_post_request(
        face_edge_client,
        "/merge_faces",
        NVRUniqueFacesMergeRequest(
            nvr_unique_face_id_merge_src=src_face.nvr_unique_face_id,
            nvr_unique_face_id_merge_dst=dest_face.nvr_unique_face_id,
        ),
    )

    async with db_instance.tenant_session() as session:
        # we expect the alert to point to the dest face
        new_alert = await orm.FaceAlertProfile.get_profile_by_id(
            session, alert_profile.id
        )
        assert new_alert.org_unique_face.id == dest_face.org_unique_face_id


async def test_merge_same_face(
    db_instance: database.Database,
    face_edge_client: AsyncClient,
    nvr: NVR,
    create_nvr_unique_face: NVRUniqueFaceFactory,
) -> None:
    src_face = await create_nvr_unique_face(nvr.uuid)

    await send_post_request(
        face_edge_client,
        "/merge_faces",
        NVRUniqueFacesMergeRequest(
            nvr_unique_face_id_merge_src=src_face.nvr_unique_face_id,
            nvr_unique_face_id_merge_dst=src_face.nvr_unique_face_id,
        ),
    )
    # the expectation is that this is a no-op
    async with db_instance.tenant_session() as session:
        face_ids = await orm.NVRUniqueFace.get_org_unique_face_ids(
            session, [src_face.nvr_unique_face_id]
        )
        assert face_ids == [src_face.org_unique_face_id]
