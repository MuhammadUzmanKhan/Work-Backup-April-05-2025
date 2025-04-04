from datetime import timedelta

from backend.database import database, orm
from backend.database.models import (
    NVR,
    Camera,
    CameraFlag,
    CameraGroup,
    CamerasQueryConfig,
    Location,
    VideoOrientationType,
)
from backend.database.organization_models import Organization
from backend.database.session import TenantAwareAsyncSession
from backend.models import AccessRestrictions, CameraGroupRestriction
from backend.test.factory_types import (
    CameraDefaultFactory,
    CameraFactory,
    CameraWithOnlineStatusDefaultFactory,
    CameraWithOnlineStatusFactory,
    LocationDefaultFactory,
    NVRDefaultFactory,
    NVRFactory,
    RandomStringFactory,
    ThumbnailFactory,
)
from backend.utils import AwareDatetime


async def test_get_cameras_filter_by_nvr(
    db_instance: database.Database,
    camera_group: CameraGroup,
    create_nvr_default: NVRDefaultFactory,
    create_camera_with_online_status: CameraWithOnlineStatusFactory,
) -> None:
    nvr = await create_nvr_default()
    camera = await create_camera_with_online_status(camera_group.id, nvr.uuid)
    second_nvr = await create_nvr_default()
    second_camera = await create_camera_with_online_status(
        camera_group.id, second_nvr.uuid
    )

    async with db_instance.session() as session:
        cameras = await orm.Camera.system_get_cameras(
            session, query_config=CamerasQueryConfig(nvr_uuids={nvr.uuid})
        )

        assert len(cameras) == 1
        assert cameras[0].camera == camera

        cameras = await orm.Camera.system_get_cameras(
            session, query_config=CamerasQueryConfig(nvr_uuids={second_nvr.uuid})
        )
        assert len(cameras) == 1
        assert cameras[0].camera == second_camera


async def test_get_cameras_filter_by_location(
    db_instance: database.Database,
    camera_group: CameraGroup,
    create_location_default: LocationDefaultFactory,
    create_nvr: NVRFactory,
    create_camera_with_online_status: CameraWithOnlineStatusFactory,
) -> None:
    location = await create_location_default()
    nvr = await create_nvr(location.id)
    camera = await create_camera_with_online_status(camera_group.id, nvr.uuid)
    second_location = await create_location_default()
    second_nvr = await create_nvr(second_location.id)
    second_camera = await create_camera_with_online_status(
        camera_group.id, second_nvr.uuid
    )

    async with db_instance.session() as session:
        cameras = await orm.Camera.system_get_cameras(
            session, query_config=CamerasQueryConfig(location_ids={location.id})
        )
        assert len(cameras) == 1
        assert cameras[0].camera == camera

        cameras = await orm.Camera.system_get_cameras(
            session, query_config=CamerasQueryConfig(location_ids={second_location.id})
        )
        assert len(cameras) == 1
        assert cameras[0].camera == second_camera


async def test_stream_hash_already_exists(
    db_instance: database.Database, create_camera_default: CameraDefaultFactory
) -> None:
    camera = await create_camera_default()

    async with db_instance.session() as session:
        assert await orm.Camera.system_check_stream_hash_exists(
            session, camera.stream_hash
        )


async def test_stream_hash_already_exists_invalid(
    db_instance: database.Database,
) -> None:
    async with db_instance.session() as session:
        assert not await orm.Camera.system_check_stream_hash_exists(session, "invalid")


async def test_get_cameras_from_mac_addresses(
    db_instance: database.Database,
    create_camera_with_online_status_default: CameraWithOnlineStatusDefaultFactory,
    organization: Organization,
) -> None:
    camera = await create_camera_with_online_status_default()
    second_camera = await create_camera_with_online_status_default()

    async with db_instance.tenant_session(tenant=organization.tenant) as session:
        cameras = await orm.Camera.get_cameras_from_mac_addresses(
            session, {camera.mac_address}
        )
        assert len(cameras) == 1
        assert cameras[0].camera == camera, f"Expect {camera} got {cameras[0].camera}"

        cameras = await orm.Camera.get_cameras_from_mac_addresses(
            session, {second_camera.mac_address}
        )
        assert len(cameras) == 1
        assert (
            cameras[0].camera == second_camera
        ), f"Expect {second_camera} got {cameras[0].camera}"


async def test_rename_camera(
    db_instance: database.Database,
    camera: Camera,
    create_name: RandomStringFactory,
    organization: Organization,
) -> None:
    async with db_instance.tenant_session(tenant=organization.tenant) as session:
        new_name = create_name()
        await orm.Camera.rename_camera(session, camera.id, new_name)

    async with db_instance.tenant_session(tenant=organization.tenant) as session:
        cameras = await orm.Camera.get_cameras_from_mac_addresses(
            session, {camera.mac_address}
        )
        assert len(cameras) == 1 and cameras[0].camera.name == new_name


async def test_get_cameras_credentials(
    db_instance: database.Database, camera: Camera, organization: Organization
) -> None:
    async with db_instance.tenant_session(tenant=organization.tenant) as session:
        credentials = await orm.Camera.get_cameras_credentials(
            session, [camera.mac_address, "invalid_mac"]
        )
        assert set(credentials.keys()) == {camera.mac_address}
        for credential in credentials.values():
            assert credential.username is None
            assert credential.password is None
            assert credential.vendor == camera.vendor


async def test_set_cameras_credentials(
    db_instance: database.Database, camera: Camera, organization: Organization
) -> None:
    test_vendor = "CoramAI"

    async def _check_credentials(
        session: TenantAwareAsyncSession,
        mac_address: str,
        username: str | None,
        password: str | None,
    ) -> None:
        credentials = await orm.Camera.get_cameras_credentials(session, [mac_address])
        assert mac_address in credentials
        assert credentials[mac_address].username == username
        assert credentials[mac_address].password == password
        assert credentials[mac_address].vendor == test_vendor

    mac_address = camera.mac_address
    async with db_instance.tenant_session(tenant=organization.tenant) as session:
        await _check_credentials(session, mac_address, None, None)

        await orm.Camera.update_camera_credentials(
            session, mac_address, "username", True, None, True
        )
        await _check_credentials(session, mac_address, "username", None)

        await orm.Camera.update_camera_credentials(
            session, mac_address, "username", True, "password", True
        )
        await _check_credentials(session, mac_address, "username", "password")

        await orm.Camera.update_camera_credentials(
            session, mac_address, None, True, "password", True
        )
        await _check_credentials(session, mac_address, None, "password")

        await orm.Camera.update_camera_credentials(
            session, mac_address, None, True, None, True
        )
        await _check_credentials(session, mac_address, None, None)

        await orm.Camera.update_camera_credentials(
            session, mac_address, "username", False, None, True
        )
        await _check_credentials(session, mac_address, None, None)

        await orm.Camera.update_camera_credentials(
            session, mac_address, None, True, "password", False
        )
        await _check_credentials(session, mac_address, None, None)


async def test_remove_camera_group(
    db_instance: database.Database,
    camera: Camera,
    camera_group: CameraGroup,
    organization: Organization,
) -> None:
    async with db_instance.tenant_session(tenant=organization.tenant) as session:
        await orm.Camera.update_camera_group(session, camera.id, camera_group.id)
    async with db_instance.tenant_session(tenant=organization.tenant) as session:
        cameras = await orm.Camera.get_cameras_from_mac_addresses(
            session, {camera.mac_address}
        )
        assert (
            len(cameras) == 1 and cameras[0].camera.camera_group_id == camera_group.id
        )

    async with db_instance.tenant_session(tenant=organization.tenant) as session:
        await orm.Camera.update_camera_group(session, camera.id, camera_group.id)
    async with db_instance.tenant_session(tenant=organization.tenant) as session:
        cameras = await orm.Camera.get_cameras_from_mac_addresses(
            session, {camera.mac_address}
        )
        assert (
            len(cameras) == 1 and cameras[0].camera.camera_group_id == camera_group.id
        )


async def test_get_cameras_access_restrictions_full_access(
    db_instance: database.Database, camera: Camera
) -> None:
    async with db_instance.session() as session:
        cameras = await orm.Camera.system_get_cameras(
            session,
            query_config=CamerasQueryConfig(),
            access_restrictions=AccessRestrictions(full_access=True),
        )
        assert len(cameras) == 1
        cameras = await orm.Camera.system_get_cameras(
            session,
            query_config=CamerasQueryConfig(),
            access_restrictions=AccessRestrictions(full_access=False),
        )
        assert len(cameras) == 0


async def test_get_cameras_access_restrictions_locations(
    db_instance: database.Database, camera: Camera, location: Location
) -> None:
    async with db_instance.session() as session:
        cameras = await orm.Camera.system_get_cameras(
            session,
            query_config=CamerasQueryConfig(),
            access_restrictions=AccessRestrictions(
                full_access=False, location_ids=[location.id]
            ),
        )
        assert len(cameras) == 1
        cameras = await orm.Camera.system_get_cameras(
            session,
            query_config=CamerasQueryConfig(),
            access_restrictions=AccessRestrictions(
                full_access=False, location_ids=[location.id + 1]
            ),
        )
        assert len(cameras) == 0


async def test_get_cameras_access_restrictions_groups(
    db_instance: database.Database,
    camera: Camera,
    location: Location,
    camera_group: CameraGroup,
) -> None:
    for location_id, camera_group_id, expected_length in [
        (location.id, camera_group.id, 1),
        (location.id + 1, camera_group.id, 0),
        (location.id, camera_group.id + 1, 0),
    ]:
        async with db_instance.session() as session:
            cameras = await orm.Camera.system_get_cameras(
                session,
                query_config=CamerasQueryConfig(),
                access_restrictions=AccessRestrictions(
                    full_access=False,
                    camera_groups=[
                        CameraGroupRestriction(
                            location_id=location_id, camera_group_id=camera_group_id
                        )
                    ],
                ),
            )
        assert len(cameras) == expected_length


async def test_mac_address_allowed_full_access(
    db_instance: database.Database, camera: Camera, organization: Organization
) -> None:
    async with db_instance.tenant_session(tenant=organization.tenant) as session:
        assert await orm.Camera.user_has_access_to_mac_addresses(
            session, [camera.mac_address], AccessRestrictions(full_access=True)
        )

        assert not await orm.Camera.user_has_access_to_mac_addresses(
            session, [camera.mac_address], AccessRestrictions(full_access=False)
        )


async def test_mac_address_allowed_location_access(
    db_instance: database.Database,
    camera: Camera,
    location: Location,
    organization: Organization,
) -> None:
    async with db_instance.tenant_session(tenant=organization.tenant) as session:
        assert await orm.Camera.user_has_access_to_mac_addresses(
            session,
            [camera.mac_address],
            AccessRestrictions(full_access=False, location_ids=[location.id]),
        )

        assert not await orm.Camera.user_has_access_to_mac_addresses(
            session,
            [camera.mac_address],
            AccessRestrictions(full_access=False, location_ids=[location.id + 1]),
        )


async def test_mac_address_allowed_group_access(
    db_instance: database.Database,
    camera: Camera,
    location: Location,
    camera_group: CameraGroup,
    organization: Organization,
) -> None:
    for location_id, camera_group_id, expected_result in [
        (location.id, camera_group.id, True),
        (location.id + 1, camera_group.id, False),
        (location.id, camera_group.id + 1, False),
    ]:
        async with db_instance.tenant_session(tenant=organization.tenant) as session:
            assert (
                await orm.Camera.user_has_access_to_mac_addresses(
                    session,
                    [camera.mac_address],
                    AccessRestrictions(
                        full_access=False,
                        camera_groups=[
                            CameraGroupRestriction(
                                location_id=location_id, camera_group_id=camera_group_id
                            )
                        ],
                    ),
                )
                == expected_result
            )


async def test_mac_addresses_allowed_with_duplicates(
    db_instance: database.Database, camera: Camera, organization: Organization
) -> None:
    async with db_instance.tenant_session(tenant=organization.tenant) as session:
        assert await orm.Camera.user_has_access_to_mac_addresses(
            session,
            [camera.mac_address, camera.mac_address],
            AccessRestrictions(full_access=True),
        )


async def test_check_nvr_mac_addresses_succeeds(
    db_instance: database.Database, camera: Camera, nvr: NVR, organization: Organization
) -> None:
    async with db_instance.tenant_session(tenant=organization.tenant) as session:
        assert await orm.Camera.nvr_has_mac_addresses(
            session, nvr.uuid, {camera.mac_address}
        )


async def test_check_nvr_mac_addresses_fails(
    db_instance: database.Database, camera: Camera, nvr: NVR, organization: Organization
) -> None:
    async with db_instance.tenant_session(tenant=organization.tenant) as session:
        assert not await orm.Camera.nvr_has_mac_addresses(
            session, nvr.uuid, {camera.mac_address + "1"}
        )


async def test_set_cameras_video_orientation_type(
    db_instance: database.Database, camera: Camera, organization: Organization
) -> None:
    mac_address = camera.mac_address
    async with db_instance.tenant_session(tenant=organization.tenant) as session:
        await orm.Camera.update_camera_video_orientation_type(
            session, mac_address, VideoOrientationType.Orientation180
        )
        cameras = await orm.Camera.get_cameras_from_mac_addresses(
            session, {camera.mac_address}
        )
        assert (
            len(cameras) == 1
            and cameras[0].camera.video_orientation_type
            == VideoOrientationType.Orientation180
        )
        await orm.Camera.update_camera_video_orientation_type(
            session, mac_address, VideoOrientationType.OrientationIdentity
        )
        cameras = await orm.Camera.get_cameras_from_mac_addresses(
            session, {camera.mac_address}
        )
        assert (
            len(cameras) == 1
            and cameras[0].camera.video_orientation_type
            == VideoOrientationType.OrientationIdentity
        )


async def test_set_cameras_rtsp_url(
    db_instance: database.Database, camera: Camera, organization: Organization
) -> None:
    mac_address = camera.mac_address
    values = ["url1", None, "url2", None]
    for value in values:
        async with db_instance.tenant_session(tenant=organization.tenant) as session:
            await orm.Camera.update_camera_rtsp_url(session, mac_address, value)
            cameras = await orm.Camera.get_cameras_from_mac_addresses(
                session, {camera.mac_address}
            )
            assert len(cameras) == 1
            assert cameras[0].camera.enforced_rtsp_url == value


async def test_update_camera_flag(
    db_instance: database.Database, camera: Camera, organization: Organization
) -> None:
    mac_address = camera.mac_address
    for flag_enum in CameraFlag:
        async with db_instance.tenant_session(tenant=organization.tenant) as session:
            camera_resp = (
                await orm.Camera.get_cameras_from_mac_addresses(
                    session, {camera.mac_address}
                )
            )[0]
            assert not getattr(camera_resp.camera, flag_enum.value)

            await orm.Camera.update_camera_flag(session, mac_address, flag_enum, True)
            camera_resp = (
                await orm.Camera.get_cameras_from_mac_addresses(
                    session, {camera.mac_address}
                )
            )[0]
            assert getattr(camera_resp.camera, flag_enum.value)

            await orm.Camera.update_camera_flag(session, mac_address, flag_enum, False)
            camera_resp = (
                await orm.Camera.get_cameras_from_mac_addresses(
                    session, {camera.mac_address}
                )
            )[0]
            assert not getattr(camera_resp.camera, flag_enum.value)


async def test_recently_inactive_cameras(
    db_instance: database.Database,
    create_camera_default: CameraDefaultFactory,
    create_thumbnail: ThumbnailFactory,
) -> None:
    active_camera = await create_camera_default()
    inactive_camera = await create_camera_default()

    await create_thumbnail(camera_mac_address=active_camera.mac_address)

    async with db_instance.session() as session:
        inactive_cameras = (
            await orm.Camera.system_get_cameras_with_no_recent_thumbnails(
                session, timedelta(minutes=5)
            )
        )

    assert len(inactive_cameras) == 1
    assert inactive_cameras[0].camera.mac_address == inactive_camera.mac_address


async def test_get_camera_response_from_camera(
    db_instance: database.Database, camera: Camera, organization: Organization
) -> None:
    async with db_instance.tenant_session(tenant=organization.tenant) as session:
        camera_response = await orm.Camera.get_camera_response_from_camera(
            session, camera
        )
        assert camera_response is not None
        assert camera_response.camera.id == camera.id


async def test_get_camera_response_from_camera_invalid(
    db_instance: database.Database, camera: Camera, organization: Organization
) -> None:
    async with db_instance.tenant_session(tenant=organization.tenant) as session:
        camera_response = await orm.Camera.get_camera_response_from_camera(
            session, Camera.parse_obj({**camera.dict(), "mac_address": "invalid"})
        )
        assert camera_response is None


async def test_retrieve_always_on_cameras(
    db_instance: database.Database,
    organization: Organization,
    camera_group: CameraGroup,
    nvr: NVR,
    create_camera: CameraFactory,
) -> None:
    num_cameras = 5
    # generate num_cameras cameras always on and num_cameras cameras not always on
    always_on_cameras = [
        await create_camera(
            camera_group_id=camera_group.id, nvr_uuid=nvr.uuid, is_always_streaming=True
        )
        for _ in range(num_cameras)
    ]
    [
        await create_camera(
            camera_group_id=camera_group.id,
            nvr_uuid=nvr.uuid,
            is_always_streaming=False,
        )
        for _ in range(num_cameras)
    ]

    async with db_instance.tenant_session(tenant=organization.tenant) as session:
        cameras = await orm.Camera.get_always_on_cameras(session)

    assert len(cameras) == num_cameras
    assert set([camera.camera.mac_address for camera in cameras]) == set(
        [camera.mac_address for camera in always_on_cameras]
    )


async def test_admin_only_get_online_cameras_for_nvrs(
    db_instance: database.Database,
    camera_group: CameraGroup,
    nvr: NVR,
    create_camera: CameraFactory,
) -> None:
    # Half online, half offline
    num_cameras = 10
    # generate num_cameras cameras always on and num_cameras cameras not always on
    for i in range(num_cameras):
        await create_camera(
            camera_group_id=camera_group.id,
            nvr_uuid=nvr.uuid,
            last_seen_time=None if i % 2 == 0 else AwareDatetime.utcnow(),
        )

    async with db_instance.session() as session:
        nvr_uuid_to_online_camera_count = (
            await orm.Camera.system_get_nvrs_online_cameras_count(session, {nvr.uuid})
        )

    assert len(nvr_uuid_to_online_camera_count.keys()) == 1
    assert nvr_uuid_to_online_camera_count[nvr.uuid] == num_cameras // 2


async def test_update_rtsp_port(
    db_instance: database.Database,
    camera_group: CameraGroup,
    nvr: NVR,
    create_camera: CameraFactory,
    organization: Organization,
) -> None:
    ports = [0, 554, 7070, 8080, 9090]
    # generate cameras with 0 rtsp port
    cameras = [
        await create_camera(
            camera_group_id=camera_group.id,
            nvr_uuid=nvr.uuid,
            is_always_streaming=True,
            rtsp_port=0,
        )
        for _ in range(len(ports))
    ]

    async with db_instance.tenant_session(tenant=organization.tenant) as session:
        await orm.Camera.update_cameras_rtsp_port(
            session, {camera.mac_address: port for camera, port in zip(cameras, ports)}
        )
        cameras_ret = await orm.Camera.system_get_cameras(
            session,
            query_config=CamerasQueryConfig(
                mac_addresses={camera.mac_address for camera in cameras}
            ),
        )

    assert len(cameras_ret) == len(ports)
    assert set([camera.camera.rtsp_port for camera in cameras_ret]) == set(ports)
