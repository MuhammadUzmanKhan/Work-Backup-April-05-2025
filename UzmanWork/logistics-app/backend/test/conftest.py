import asyncio
import functools
import random
import string
import time
from typing import Any, AsyncGenerator, Callable, Coroutine, Sequence
from unittest.mock import AsyncMock, MagicMock, Mock

import fastapi
import pytest
import pytest_asyncio
from fastapi import FastAPI
from fastapi.datastructures import URL
from httpx import AsyncClient
from pydantic import EmailStr
from pytest_mock import MockerFixture
from pytest_postgresql import factories

from backend import auth, auth_models
from backend.auth_context import set_app_user, set_edge_user
from backend.aws_signer.aws_signer_models import AWSCredentials
from backend.cameras_registration.cameras_registration_utils import (
    generate_unique_stream_hash,
)
from backend.database import database, orm
from backend.database.face_models import (
    FaceOccurrence,
    FaceOccurrenceCreate,
    NVRUniqueFace,
    NVRUniqueFaceCreate,
)
from backend.database.geometry_models import Point2D
from backend.database.models import (
    NVR,
    Camera,
    CameraCreate,
    CameraGroup,
    CameraGroupCreate,
    ClipData,
    ClipDataCreate,
    FaceAlertProfile,
    FaceAlertProfileCreate,
    FeatureFlags,
    LicensePlate,
    LicensePlateAlertProfile,
    LicensePlateAlertProfileCreate,
    LicensePlateDetectionCreate,
    Location,
    LocationCreate,
    NotificationGroup,
    NotificationGroupMemberCreate,
    NVRCreate,
    SearchAreaRectangle,
    ThumbnailCreate,
    ThumbnailType,
    VideoOrientationType,
)
from backend.database.organization_models import Organization, OrganizationCreate
from backend.dependencies import (
    get_backend_database,
    get_backend_envs,
    get_backend_secrets,
    get_boto_aio_session,
    get_boto_session_maker,
    get_iot_data_client,
    get_mq_connection,
    get_replaced_master_playlist_url,
    get_replaced_media_playlist_url,
    get_slack_client,
    get_value_store,
    populate_database_tables,
)
from backend.envs import BackendEnvs
from backend.main import app as _app_api
from backend.main import client_router
from backend.main_edge import app as _edge_api
from backend.main_edge import client_router as client_router_edge
from backend.models import AccessRestrictions, CameraWithOnlineStatus
from backend.s3_utils import S3Path
from backend.test.factory_types import (
    AppUserFactory,
    CameraDefaultFactory,
    CameraFactory,
    CameraGroupDefaultFactory,
    CameraGroupFactory,
    CameraWithOnlineStatusFactory,
    ClipDataFactory,
    EnableFeatureForOrganisationFactory,
    FaceAlertProfileFactory,
    FaceOccurrenceFactory,
    LicensePlateAlertProfileFactory,
    LicensePlateDetectionFactory,
    LicensePlateFactory,
    LocationDefaultFactory,
    LocationFactory,
    NotificationGroupFactory,
    NotificationGroupMemberFactory,
    NVRDefaultFactory,
    NVRFactory,
    NVRUniqueFaceFactory,
    OrganizationFactory,
    RandomStringFactory,
    ThumbnailFactory,
)
from backend.utils import AwareDatetime
from backend.value_store import ValueStore
from backend.value_store.value_store import Redis


def load_database(**kwargs: Any) -> None:
    connection_config = database.DatabaseConnectionConfig(
        user=kwargs["user"],
        password=kwargs["password"],
        database=kwargs["dbname"],
        host=kwargs["host"],
        port=kwargs["port"],
    )
    db_instance = database.Database(
        connection_config, application_name="tests", disable_timeout=True
    )

    async def prepare() -> None:
        await db_instance.prepare_tables()
        await populate_database_tables(db_instance, False)

    loop = asyncio.get_event_loop()
    loop.run_until_complete(prepare())


# standard postgresql fixtures (empty database)
postgresql_proc = factories.postgresql_proc()
postgresql = factories.postgresql("postgresql_proc")

# postgresql fixtures with migrations and initial data
postgresql_proc_load_db = factories.postgresql_proc(load=[load_database])
postgresql_load_db = factories.postgresql("postgresql_proc_load_db")


@pytest_asyncio.fixture()
async def db_instance(postgresql_load_db: Any) -> database.Database:
    connection_config = database.DatabaseConnectionConfig(
        user=postgresql_load_db.info.user,
        password=postgresql_load_db.info.password,
        database=postgresql_load_db.info.dbname,
        host=postgresql_load_db.info.host,
        port=postgresql_load_db.info.port,
    )
    db_instance = database.Database(
        connection_config, application_name="tests", disable_timeout=True
    )
    return db_instance


@pytest_asyncio.fixture
async def value_store(mocker: MockerFixture) -> ValueStore:
    data = {}
    value_store = ValueStore("host", 0)
    mock = AsyncMock(Redis)

    async def mock_set(name: str, value: Any, ex: Any) -> None:
        data.update({name: value})

    mock.set = mock_set

    async def mock_get(name: str) -> Any:
        return data.get(name)

    mock.get = mock_get

    async def mock_delete(name: str) -> Any:
        return data.pop(name)

    mock.delete = mock_delete

    async def mock_mset(keys_values: dict[str, Any]) -> None:
        data.update(keys_values)

    mock.mset = mock_mset

    async def mock_mget(keys: list[str]) -> list[Any]:
        return [data.get(key) for key in keys]

    mock.mget = mock_mget

    async def mock_ttil(name: str) -> int:
        return 1

    mock.ttl = mock_ttil

    async def mock_hset(key: str, mapping_key: str, value: dict[str, Any]) -> None:
        data.update({f"{key}_{mapping_key}": value})

    mock.hset = mock_hset

    async def mock_hget(key: str, mapping_key: str) -> dict[str, Any] | None:
        return data.get(f"{key}_{mapping_key}")

    mock.hget = mock_hget

    async def mock_hgetall(key: str) -> dict[bytes, dict[str, Any]]:
        return {
            k.encode("utf-8"): value
            for k, value in data.items()
            if k.startswith(f"{key}_")
        }

    mock.hgetall = mock_hgetall

    async def mock_hdel(key: str, *mapping_keys: str) -> None:
        for mapping_key in mapping_keys:
            data.pop(f"{key}_{mapping_key}")

    mock.hdel = mock_hdel

    value_store.redis_client = mock
    return value_store


@pytest.fixture
def create_name() -> RandomStringFactory:
    def create_name_inner() -> str:
        return "".join(random.choices(string.ascii_letters, k=16))

    return create_name_inner


@pytest.fixture
def create_mac_address() -> RandomStringFactory:
    def create_mac_address_inner() -> str:
        mac_address = ""
        for _ in range(6):
            mac_address += random.choice(string.digits)
            mac_address += random.choice(string.digits)
            mac_address += ":"
        return mac_address[:-1]

    return create_mac_address_inner


@pytest.fixture
def create_email() -> RandomStringFactory:
    def create_email_inner() -> str:
        name = "".join(random.choices(string.ascii_lowercase, k=10))
        domain = "".join(random.choices(string.ascii_lowercase, k=10))
        email = f"{name}@{domain}.com"
        return email

    return create_email_inner


@pytest.fixture
def create_phone_number() -> RandomStringFactory:
    def create_phone_number_inner() -> str:
        # Use US country code +1
        country_code = "+1"
        # Generate a random area codes, add more as needed
        area_code = random.choice(["201", "202", "203", "204", "205"])
        # Generate a random central office code
        central_office_code = random.randint(200, 999)
        # Generate a random line number
        line_number = random.randint(1000, 9999)

        return f"{country_code}{area_code}{central_office_code}{line_number}"

    return create_phone_number_inner


@pytest.fixture
def create_s3_url() -> RandomStringFactory:
    def create_s3_url_inner() -> str:
        base = "".join(random.choices(string.ascii_lowercase, k=10))
        path = "".join(random.choices(string.ascii_lowercase, k=5))
        url = f"s3://{base}/{path}"
        return url

    return create_s3_url_inner


@pytest.fixture
def create_perception_stack_start_id() -> RandomStringFactory:
    def create_create_perception_stack_start_id_inner() -> str:
        return "".join(random.choices(string.ascii_lowercase, k=20))

    return create_create_perception_stack_start_id_inner


@pytest.fixture
def random_string() -> str:
    return "".join(random.choices(string.ascii_letters + string.digits, k=16))


@pytest.fixture
def create_license_plate_number() -> RandomStringFactory:
    def create_license_plate_number_inner() -> str:
        return "".join(random.choices(string.ascii_uppercase + string.digits, k=6))

    return create_license_plate_number_inner


@pytest_asyncio.fixture
async def create_organization(
    db_instance: database.Database, create_name: RandomStringFactory
) -> OrganizationFactory:
    async def create_organization_inner(
        tenant: str | None = None, number_licensed_cameras: int | None = None
    ) -> Organization:
        async with db_instance.session() as session:
            tenant = tenant if tenant else create_name()
            organization_data = OrganizationCreate(name=tenant, tenant=tenant)
            organization = await orm.Organization.system_new_organization(
                session, organization_data
            )
        if number_licensed_cameras is not None:
            async with db_instance.tenant_session(tenant=tenant) as session:
                await orm.Organization.update_number_licensed_cameras(
                    session, number_licensed_cameras
                )
        return Organization.from_orm(organization)

    return create_organization_inner


@pytest_asyncio.fixture
async def create_location(
    db_instance: database.Database, create_name: RandomStringFactory
) -> LocationFactory:
    async def create_location_inner(tenant: str, name: str | None = None) -> Location:
        async with db_instance.tenant_session(tenant=tenant) as session:
            name = name if name else create_name()
            address = create_name()
            location_data = LocationCreate(
                name=name, address=address, address_lat=None, address_lon=None
            )
            location = await orm.Location.new_location(session, location_data)
        return Location.from_orm(location)

    return create_location_inner


@pytest_asyncio.fixture
async def create_camera_group(
    db_instance: database.Database, create_name: RandomStringFactory
) -> CameraGroupFactory:
    async def create_camera_group_inner(
        tenant: str, name: str | None = None, is_default: bool = False
    ) -> CameraGroup:
        async with db_instance.tenant_session(tenant=tenant) as session:
            name = name if name else create_name()
            camera_group_data = CameraGroupCreate(name=name, is_default=is_default)
            camera_group = await orm.CameraGroup.new_group(session, camera_group_data)
        return CameraGroup.from_orm(camera_group)

    return create_camera_group_inner


@pytest_asyncio.fixture
async def create_nvr(
    db_instance: database.Database,
    create_name: RandomStringFactory,
    organization: Organization,
) -> NVRFactory:
    async def create_nvr_inner(
        location_id: int | None,
        uuid: str | None = None,
        last_seen_time: AwareDatetime | None = None,
        tenant: str | None = None,
    ) -> NVR:
        if not tenant:
            tenant = organization.tenant

        last_seen_time = last_seen_time or AwareDatetime.utcnow()
        async with db_instance.session() as session:
            uuid = uuid if uuid else create_name()
            nvr = await orm.NVR.system_new_nvr(
                session,
                NVRCreate(
                    uuid=uuid,
                    location_id=location_id,
                    last_seen_time=last_seen_time,
                    timezone=None,
                ),
            )
            # We need to associate it with some tenant, otherwise it won't be returned
            # in tenant-scoped sessions
            nvr.tenant = tenant
        return NVR.from_orm(nvr)

    return create_nvr_inner


@pytest_asyncio.fixture
async def create_camera(
    db_instance: database.Database,
    create_mac_address: RandomStringFactory,
    organization: Organization,
) -> CameraFactory:
    async def create_camera_inner(
        camera_group_id: int,
        nvr_uuid: str,
        mac_address: str | None = None,
        tenant: str | None = None,
        is_enabled: bool = True,
        is_always_streaming: bool = False,
        is_license_plate_detection_enabled: bool = False,
        is_audio_enabled: bool = False,
        is_faulty: bool = False,
        is_webrtc_enabled: bool = False,
        is_force_fps_enabled: bool = False,
        username: str | None = None,
        password: str | None = None,
        last_seen_time: AwareDatetime | None = None,
        rtsp_port: int = 554,
        enforced_rtsp_url: str | None = None,
    ) -> Camera:
        stream_hash = await generate_unique_stream_hash(db_instance, "test")
        tenant = tenant if tenant else organization.tenant

        async with db_instance.session() as session:
            mac_address = mac_address if mac_address else create_mac_address()
            camera = await orm.Camera.system_new_camera(
                session,
                CameraCreate(
                    mac_address=mac_address,
                    nvr_uuid=nvr_uuid,
                    is_enabled=is_enabled,
                    vendor="CoramAI",
                    ip="127.0.0.1",
                    video_orientation_type=VideoOrientationType.OrientationIdentity,
                    is_always_streaming=is_always_streaming,
                    is_license_plate_detection_enabled=(
                        is_license_plate_detection_enabled
                    ),
                    is_audio_enabled=is_audio_enabled,
                    is_faulty=is_faulty,
                    is_webrtc_enabled=is_webrtc_enabled,
                    is_force_fps_enabled=is_force_fps_enabled,
                    username=username,
                    password=password,
                    last_seen_time=last_seen_time,
                    rtsp_port=rtsp_port,
                    enforced_rtsp_url=enforced_rtsp_url,
                ),
                stream_hash=stream_hash,
                tenant=tenant,
            )
        async with db_instance.tenant_session(tenant=tenant) as session:
            await orm.Camera.update_camera_group(session, camera.id, camera_group_id)
        camera_obj = Camera.from_orm(camera)
        camera_obj.camera_group_id = camera_group_id
        return camera_obj

    return create_camera_inner


@pytest_asyncio.fixture
async def create_camera_with_online_status(
    db_instance: database.Database,
    create_mac_address: RandomStringFactory,
    create_camera: CameraFactory,
) -> CameraWithOnlineStatusFactory:
    async def create_camera_with_online_status_inner(
        camera_group_id: int,
        nvr_uuid: str,
        mac_address: str | None = None,
        is_enabled: bool = True,
        is_always_streaming: bool = False,
        is_license_plate_detection_enabled: bool = False,
        is_audio_enabled: bool = False,
        is_faulty: bool = False,
        is_online: bool = False,
    ) -> CameraWithOnlineStatus:
        mac_address = mac_address if mac_address else create_mac_address()
        camera = await create_camera(
            camera_group_id,
            nvr_uuid,
            mac_address,
            is_enabled=is_enabled,
            is_always_streaming=is_always_streaming,
            is_license_plate_detection_enabled=is_license_plate_detection_enabled,
            is_audio_enabled=is_audio_enabled,
            is_faulty=is_faulty,
        )
        return CameraWithOnlineStatus.parse_obj(
            {**camera.dict(), "is_online": is_online}
        )

    return create_camera_with_online_status_inner


@pytest_asyncio.fixture
async def create_thumbnail(
    db_instance: database.Database,
    create_s3_url: RandomStringFactory,
    organization: Organization,
) -> ThumbnailFactory:
    async def create_thumbnail_inner(
        camera_mac_address: str, timestamp: AwareDatetime | None = None
    ) -> None:
        async with db_instance.tenant_session(tenant=organization.tenant) as session:
            await orm.Thumbnail.add_thumbnail_batch(
                session,
                [
                    ThumbnailCreate(
                        camera_mac_address=camera_mac_address,
                        s3_path=create_s3_url(),
                        timestamp=timestamp or AwareDatetime.utcnow(),
                        thumbnail_type=ThumbnailType.THUMBNAIL,
                    )
                ],
            )

    return create_thumbnail_inner


@pytest.fixture
def create_unique_face_id(
    create_mac_address: RandomStringFactory,
) -> RandomStringFactory:
    def create_unique_face_id_inner() -> str:
        mac_address = create_mac_address()
        current_time_ms = int(time.time() * 1000)
        return (
            mac_address
            + "_"
            + str(current_time_ms)
            + "_"
            + random.choice(string.digits)
        )

    return create_unique_face_id_inner


@pytest_asyncio.fixture
async def create_nvr_unique_face(
    db_instance: database.Database,
    create_s3_url: RandomStringFactory,
    create_unique_face_id: RandomStringFactory,
    organization: Organization,
) -> NVRUniqueFaceFactory:
    async def create_unique_face_inner(
        nvr_uuid: str, unique_face_id: str | None = None, s3_path: str | None = None
    ) -> NVRUniqueFace:
        async with db_instance.tenant_session(tenant=organization.tenant) as session:
            unique_face_id = (
                create_unique_face_id() if unique_face_id is None else unique_face_id
            )
            face = await orm.NVRUniqueFace._add_new_face(
                session,
                NVRUniqueFaceCreate(
                    nvr_unique_face_id=unique_face_id,
                    s3_path=s3_path or create_s3_url(),
                ),
                nvr_uuid,
            )
        return NVRUniqueFace.from_orm(face)

    return create_unique_face_inner


@pytest_asyncio.fixture
async def nvr_unique_face(
    create_nvr_unique_face: NVRUniqueFaceFactory, nvr: NVR
) -> NVRUniqueFace:
    return await create_nvr_unique_face(nvr.uuid)


@pytest_asyncio.fixture
async def create_face_occurrence(
    db_instance: database.Database,
    create_nvr_unique_face: NVRUniqueFaceFactory,
    create_s3_url: RandomStringFactory,
    organization: Organization,
    location: Location,
) -> FaceOccurrenceFactory:
    async def create_face_occurrence_inner(
        nvr_uuid: str,
        mac_address: str,
        unique_face_id: str | None = None,
        s3_path: str | None = None,
        occurrence_time: AwareDatetime = AwareDatetime.utcnow(),
        face_sharpness: float = 0.9,
    ) -> FaceOccurrence:
        async with db_instance.tenant_session(tenant=organization.tenant) as session:
            if unique_face_id is None:
                unique_face = await create_nvr_unique_face(nvr_uuid)
                unique_face_id = unique_face.nvr_unique_face_id

            face_s3_path = s3_path or create_s3_url()
            person_s3_path = create_s3_url()
            face_occurrence = FaceOccurrenceCreate(
                nvr_unique_face_id=unique_face_id,
                camera_mac_address=mac_address,
                occurrence_time=occurrence_time,
                face_s3_path=face_s3_path,
                person_s3_path=person_s3_path,
                face_sharpness=face_sharpness,
            )
            occurrences = await orm.FaceOccurrence.add_occurrences_batch(
                session=session, occurrences=[face_occurrence], nvr_uuid=nvr_uuid
            )
        assert len(occurrences) == 1, "Expected exactly one face occurrence"
        return occurrences[0]

    return create_face_occurrence_inner


@pytest_asyncio.fixture()
async def create_notification_groups(
    db_instance: database.Database, nvr: NVR, create_name: RandomStringFactory
) -> NotificationGroupFactory:
    async def create_notification_groups_inner(
        tenant: str, num_groups: int
    ) -> list[NotificationGroup]:
        group_ids = set()
        for _ in range(num_groups):
            async with db_instance.tenant_session(tenant=tenant) as session:
                notification_group = await orm.NotificationGroup.new_group(session)
            group_ids.add(notification_group.id)
        async with db_instance.tenant_session(tenant=tenant) as session:
            notification_groups = await orm.NotificationGroup.get_groups(
                session=session, group_ids=group_ids
            )
        return [NotificationGroup.from_orm(group) for group in notification_groups]

    return create_notification_groups_inner


@pytest_asyncio.fixture()
async def notification_group(
    create_notification_groups: NotificationGroupFactory, app_user: auth_models.AppUser
) -> NotificationGroup:
    notification_groups = await create_notification_groups(
        tenant=app_user.tenant, num_groups=1
    )
    return notification_groups[0]


@pytest_asyncio.fixture()
async def create_notification_group_with_members(
    db_instance: database.Database,
    notification_group: NotificationGroup,
    create_name: RandomStringFactory,
    create_email: RandomStringFactory,
    create_phone_number: RandomStringFactory,
) -> NotificationGroupMemberFactory:
    async def create_notification_group_with_members_inner(
        tenant: str,
        group_members_metadata: Sequence[NotificationGroupMemberCreate | None],
    ) -> list[NotificationGroup]:
        group_ids = set()
        async with db_instance.tenant_session(tenant=tenant) as session:
            for member_metadata in group_members_metadata:
                if isinstance(member_metadata, NotificationGroupMemberCreate):
                    new_member_metadata = member_metadata
                else:
                    new_member_metadata = NotificationGroupMemberCreate(
                        group_id=notification_group.id,
                        user_name=create_name(),
                        email_address=create_email(),
                        phone_number=create_phone_number(),
                    )

                await orm.NotificationGroupMember.new_group_member(
                    session=session, member_metadata=new_member_metadata
                )
                group_ids.add(notification_group.id)

        async with db_instance.tenant_session(tenant=tenant) as session:
            notification_groups = await orm.NotificationGroup.get_groups(
                session=session, group_ids=group_ids
            )
        return [NotificationGroup.from_orm(group) for group in notification_groups]

    return create_notification_group_with_members_inner


@pytest_asyncio.fixture()
async def notification_group_with_member(
    app_user: auth_models.AppUser,
    create_notification_group_with_members: NotificationGroupMemberFactory,
) -> NotificationGroup:
    notification_groups = await create_notification_group_with_members(
        tenant=app_user.tenant, group_members_metadata=[None]
    )
    return notification_groups[0]


@pytest_asyncio.fixture()
async def create_face_alert_profile(
    db_instance: database.Database,
    nvr: NVR,
    notification_group_with_member: NotificationGroup,
    create_nvr_unique_face: NVRUniqueFaceFactory,
) -> FaceAlertProfileFactory:
    async def create_face_alert_profile_inner(
        tenant: str,
        owner_user_email: EmailStr,
        org_unique_face_id: int | None = None,
        is_person_of_interest: bool = False,
        creation_time: AwareDatetime | None = None,
        description: str | None = None,
    ) -> FaceAlertProfile:
        async with db_instance.tenant_session(tenant=tenant) as session:
            if org_unique_face_id is None:
                unique_face = await create_nvr_unique_face(nvr.uuid)
                org_unique_face_id = unique_face.org_unique_face_id

            alert_profile_id = await orm.FaceAlertProfile.new_profile(
                session=session,
                face_alert_profile=FaceAlertProfileCreate(
                    description=description,
                    is_person_of_interest=is_person_of_interest,
                    org_unique_face_id=org_unique_face_id,
                    owner_user_email=owner_user_email,
                    creation_time=(
                        creation_time if creation_time else AwareDatetime.utcnow()
                    ),
                ),
            )
        async with db_instance.tenant_session(tenant=tenant) as session:
            await orm.FaceAlertProfile.update_notification_groups(
                session, alert_profile_id, {notification_group_with_member.id}
            )
            alert_profile = await orm.FaceAlertProfile.get_profile_by_id(
                session=session, alert_profile_id=alert_profile_id
            )
        return FaceAlertProfile.from_orm(alert_profile)

    return create_face_alert_profile_inner


@pytest_asyncio.fixture()
async def face_alert_profile(
    nvr_unique_face: NVRUniqueFace,
    create_face_alert_profile: FaceAlertProfileFactory,
    app_user: auth_models.AppUser,
) -> FaceAlertProfile:
    return await create_face_alert_profile(
        app_user.tenant,
        EmailStr(app_user.user_email),
        org_unique_face_id=nvr_unique_face.org_unique_face_id,
    )


@pytest_asyncio.fixture()
async def create_license_plate(
    db_instance: database.Database, create_license_plate_number: RandomStringFactory
) -> LicensePlateFactory:
    async def create_license_plate_inner(
        license_plate_number: str | None = None,
    ) -> LicensePlate:
        async with db_instance.session() as session:
            license_plate = await orm.LicensePlate.system_get_or_create(
                session=session,
                license_plate_metadata=LicensePlate(
                    license_plate_number=license_plate_number
                    or create_license_plate_number()
                ),
            )
            return LicensePlate.from_orm(license_plate)

    return create_license_plate_inner


@pytest_asyncio.fixture()
async def license_plate(create_license_plate: LicensePlateFactory) -> LicensePlate:
    return await create_license_plate()


@pytest_asyncio.fixture()
async def create_license_plate_alert_profile(
    db_instance: database.Database,
    notification_group: NotificationGroup,
    create_license_plate: LicensePlateFactory,
    create_s3_url: RandomStringFactory,
) -> LicensePlateAlertProfileFactory:
    async def create_license_plate_alert_profile_inner(
        tenant: str,
        owner_user_email: EmailStr,
        license_plate_number: str | None = None,
        creation_time: AwareDatetime | None = None,
    ) -> LicensePlateAlertProfile:
        async with db_instance.tenant_session(tenant=tenant) as session:
            if license_plate_number is None:
                license_plate = await create_license_plate()
                license_plate_number = license_plate.license_plate_number

            alert_profile_id = await orm.LicensePlateAlertProfile.add_profile(
                session=session,
                alert_profile_create=LicensePlateAlertProfileCreate(
                    owner_user_email=owner_user_email,
                    license_plate_number=license_plate_number,
                    creation_time=creation_time or AwareDatetime.utcnow(),
                    image_s3_path=S3Path(create_s3_url()),
                    x_min=0,
                    y_min=0,
                    x_max=1,
                    y_max=1,
                ),
            )
        async with db_instance.tenant_session(tenant=tenant) as session:
            await orm.LicensePlateAlertProfile.update_notification_groups(
                session, alert_profile_id, {notification_group.id}
            )
            alert_profiles = await orm.LicensePlateAlertProfile.get_profiles(
                session=session, profile_ids={alert_profile_id}
            )
            assert len(alert_profiles) == 1, "Expected exactly one alert profile"
            updated_alert_profile = alert_profiles[0]
        return LicensePlateAlertProfile.from_orm(updated_alert_profile)

    return create_license_plate_alert_profile_inner


@pytest_asyncio.fixture()
async def license_plate_alert_profile(
    create_license_plate_alert_profile: LicensePlateAlertProfileFactory,
    app_user: auth_models.AppUser,
) -> LicensePlateAlertProfile:
    return await create_license_plate_alert_profile(
        app_user.tenant, EmailStr(app_user.user_email)
    )


@pytest_asyncio.fixture()
async def create_license_plate_detection(
    db_instance: database.Database,
    organization: Organization,
    create_perception_stack_start_id: RandomStringFactory,
    create_s3_url: RandomStringFactory,
) -> LicensePlateDetectionFactory:
    async def create_license_plate_detection_inner(
        mac_address: str,
        license_plate_number: str,
        timestamp: AwareDatetime = AwareDatetime.utcnow(),
    ) -> None:
        async with db_instance.tenant_session(tenant=organization.tenant) as session:
            await orm.LicensePlateDetection.add_detection(
                session,
                LicensePlateDetectionCreate(
                    license_plate_number=license_plate_number,
                    mac_address=mac_address,
                    time=timestamp,
                    score=0.9,
                    dscore=0.9,
                    vscore=0.8,
                    x_min=0.0,
                    y_min=0.0,
                    x_max=1.0,
                    y_max=1.0,
                    track_id=0,
                    object_id=0,
                    perception_stack_start_id=create_perception_stack_start_id(),
                    image_s3_path=S3Path(create_s3_url()),
                ),
            )

    return create_license_plate_detection_inner


@pytest_asyncio.fixture()
async def create_clip_data(db_instance: database.Database) -> ClipDataFactory:
    async def create_clip_data_inner(
        tenant: str,
        mac_address: str,
        s3_path: S3Path,
        start_time: AwareDatetime | None = None,
        end_time: AwareDatetime | None = None,
    ) -> ClipData:
        clip_data_create = ClipDataCreate(
            mac_address=mac_address,
            start_time=start_time or AwareDatetime.utcnow(),
            end_time=end_time or AwareDatetime.utcnow(),
            creation_time=AwareDatetime.utcnow(),
            s3_path=s3_path,
        )
        async with db_instance.tenant_session(tenant=tenant) as session:
            return ClipData.from_orm(
                await orm.ClipData.create_or_retrieve_clip_data(
                    session, clip_data_create
                )
            )

    return create_clip_data_inner


@pytest_asyncio.fixture()
async def clip_data(
    create_clip_data: ClipDataFactory,
    camera: Camera,
    create_s3_url: RandomStringFactory,
) -> ClipData:
    return await create_clip_data(
        camera.tenant, camera.mac_address, S3Path(create_s3_url())
    )


@pytest_asyncio.fixture
async def organization(create_organization: OrganizationFactory) -> Organization:
    return await create_organization()


@pytest_asyncio.fixture
async def location(
    create_location: LocationFactory, organization: Organization
) -> Location:
    return await create_location(organization.tenant)


@pytest_asyncio.fixture
async def camera_group(
    create_camera_group: CameraGroupFactory, organization: Organization
) -> CameraGroup:
    return await create_camera_group(organization.tenant)


@pytest_asyncio.fixture
async def nvr(create_nvr: NVRFactory, location: Location) -> NVR:
    return await create_nvr(location.id)


@pytest_asyncio.fixture
async def camera(
    create_camera: CameraFactory, camera_group: CameraGroup, nvr: NVR
) -> Camera:
    return await create_camera(camera_group.id, nvr.uuid)


@pytest_asyncio.fixture
async def online_camera(create_camera_default: CameraDefaultFactory) -> Camera:
    return await create_camera_default(last_seen_time=AwareDatetime.utcnow())


@pytest_asyncio.fixture
async def create_location_default(
    create_location: LocationFactory, organization: Organization
) -> LocationDefaultFactory:
    return functools.partial(create_location, organization.tenant)


@pytest_asyncio.fixture
async def create_camera_group_default(
    create_camera_group: CameraGroupFactory, organization: Organization
) -> CameraGroupDefaultFactory:
    return functools.partial(create_camera_group, organization.tenant)


@pytest_asyncio.fixture
async def create_nvr_default(
    create_nvr: NVRFactory, location: Location
) -> NVRDefaultFactory:
    return functools.partial(create_nvr, location.id)


@pytest_asyncio.fixture
async def create_camera_default(
    create_camera: CameraFactory, camera_group: CameraGroup, nvr: NVR
) -> CameraDefaultFactory:
    return functools.partial(create_camera, camera_group.id, nvr.uuid)


@pytest_asyncio.fixture
async def create_camera_with_online_status_default(
    create_camera_with_online_status: CameraWithOnlineStatusFactory,
    camera_group: CameraGroup,
    nvr: NVR,
) -> CameraDefaultFactory:
    return functools.partial(
        create_camera_with_online_status, camera_group.id, nvr.uuid
    )


@pytest_asyncio.fixture
async def create_app_user(
    create_name: RandomStringFactory,
    organization: Organization,
    create_email: RandomStringFactory,
) -> AppUserFactory:
    async def create_app_user_inner(
        tenant: str | None = None, role: auth.UserRole = auth.UserRole.ADMIN
    ) -> auth_models.AppUser:
        return auth_models.AppUser(
            user_id=create_name(),
            tenant=tenant or organization.tenant,
            role=role,
            user_email=create_email(),
        )

    return create_app_user_inner


@pytest_asyncio.fixture()
async def edge_user(nvr: NVR, organization: Organization) -> auth_models.EdgeUser:
    return auth_models.EdgeUser(user_uuid=nvr.uuid, tenant=organization.tenant)


@pytest_asyncio.fixture()
async def edge_user_no_tenant(nvr: NVR) -> auth_models.EdgeUserNoTenant:
    return auth_models.EdgeUserNoTenant(user_uuid=nvr.uuid)


@pytest_asyncio.fixture()
async def app_user(create_app_user: AppUserFactory) -> auth_models.AppUser:
    return await create_app_user(role=auth.UserRole.ADMIN)


@pytest_asyncio.fixture()
async def rectangle() -> SearchAreaRectangle:
    return SearchAreaRectangle(
        coord_min=Point2D(x=0.0, y=0.0), coord_max=Point2D(x=1.0, y=1.0)
    )


async def mock_app_user_guard(
    app_user: auth_models.AppUser, should_set_app_user: bool = True
) -> Callable[[], Coroutine[Any, Any, auth_models.AppUser]]:
    async def app_user_guard() -> auth_models.AppUser:
        if should_set_app_user:
            await set_app_user(app_user)
        return app_user

    return app_user_guard


async def mock_edge_user_guard(
    edge_user: auth_models.EdgeUser,
) -> Callable[[], Coroutine[Any, Any, auth_models.EdgeUser]]:
    async def edge_user_guard() -> auth_models.EdgeUser:
        await set_edge_user(edge_user)
        return edge_user

    return edge_user_guard


async def mock_edge_user_no_tenant_guard(
    edge_user_no_tenant: auth_models.EdgeUserNoTenant,
) -> Callable[[], Coroutine[Any, Any, auth_models.EdgeUserNoTenant]]:
    async def edge_user_no_tenant_guard() -> auth_models.EdgeUserNoTenant:
        return edge_user_no_tenant

    return edge_user_no_tenant_guard


@pytest_asyncio.fixture()
async def backend_envs_mock() -> MagicMock:
    return MagicMock()


@pytest.fixture()
def slack_client_mock() -> Mock:
    slack_client_mock = Mock()
    slack_client_send_alert_mocked = AsyncMock()
    slack_client_mock.send_alert = slack_client_send_alert_mocked
    return slack_client_mock


@pytest_asyncio.fixture()
async def app(
    db_instance: database.Database,
    edge_user: auth_models.EdgeUser,
    edge_user_no_tenant: auth_models.EdgeUserNoTenant,
    app_user: auth_models.AppUser,
    backend_envs_mock: BackendEnvs,
    value_store: ValueStore,
    slack_client_mock: Mock,
) -> FastAPI:
    app = FastAPI()
    app.dependency_overrides[get_backend_database] = lambda: db_instance
    app.dependency_overrides[get_value_store] = lambda: value_store
    app.dependency_overrides[get_backend_envs] = lambda: backend_envs_mock
    app.dependency_overrides[get_slack_client] = lambda: slack_client_mock
    app.dependency_overrides[get_mq_connection] = lambda: MagicMock()
    app.dependency_overrides[get_boto_session_maker] = lambda: lambda: MagicMock()
    app.dependency_overrides[get_iot_data_client] = lambda: MagicMock()
    app.dependency_overrides[get_boto_aio_session] = lambda: AsyncMock()

    mocked_secrets = MagicMock(
        aws_credentials=MagicMock(
            return_value=AWSCredentials(access_key="", secret_key="", token=None)
        )
    )
    app.dependency_overrides[get_backend_secrets] = lambda: mocked_secrets

    app.dependency_overrides[auth.edge_user_role_guard] = await mock_edge_user_guard(
        edge_user
    )

    app.dependency_overrides[auth.edge_user_no_tenant_role_guard] = (
        await mock_edge_user_no_tenant_guard(edge_user_no_tenant)
    )

    live_only_user = app_user.copy()
    live_only_user.role = auth.UserRole.LIVE_ONLY
    app.dependency_overrides[auth.live_only_user_role_guard] = (
        await mock_app_user_guard(live_only_user)
    )

    limited_user = app_user.copy()
    limited_user.role = auth.UserRole.LIMITED
    app.dependency_overrides[auth.limited_user_role_guard] = await mock_app_user_guard(
        limited_user
    )

    regular_user = app_user.copy()
    regular_user.role = auth.UserRole.REGULAR
    app.dependency_overrides[auth.regular_user_role_guard] = await mock_app_user_guard(
        regular_user
    )

    admin_user = app_user.copy()
    admin_user.role = auth.UserRole.ADMIN
    app.dependency_overrides[auth.admin_user_role_guard] = await mock_app_user_guard(
        admin_user
    )
    # NOTE(@lberg): we don't set the app user here because the real code does not
    app.dependency_overrides[auth.get_user_with_org] = await mock_app_user_guard(
        admin_user, should_set_app_user=False
    )
    app.dependency_overrides[auth.get_user_access_restrictions] = (
        lambda: AccessRestrictions()
    )

    app.dependency_overrides[get_replaced_master_playlist_url] = lambda: URL()
    app.dependency_overrides[get_replaced_media_playlist_url] = lambda: URL()

    return app


@pytest.fixture()
def email_client_mock() -> Mock:
    email_client_mock = Mock()
    email_client_mock.send_email = AsyncMock()
    email_client_mock.send_html_email = AsyncMock()
    email_client_mock.send_support_email = AsyncMock()
    return email_client_mock


@pytest.fixture()
def sms_client_mock() -> Mock:
    sms_client_mock = Mock()
    sms_client_mock.send_sms = AsyncMock()
    return sms_client_mock


@pytest_asyncio.fixture()
async def root_client(app: FastAPI) -> AsyncGenerator[AsyncClient, None]:
    app.include_router(client_router)
    app.include_router(client_router_edge)

    async with AsyncClient(app=app, base_url="http://localhost/") as client:
        yield client


@pytest_asyncio.fixture()
async def app_api() -> fastapi.FastAPI:
    return _app_api


@pytest_asyncio.fixture()
async def edge_api() -> fastapi.FastAPI:
    return _edge_api


@pytest_asyncio.fixture()
async def enable_feature_for_organisation(
    db_instance: database.Database,
) -> EnableFeatureForOrganisationFactory:
    async def enable_feature_for_organisation_inner(
        tenant: str, feature: FeatureFlags
    ) -> None:
        async with db_instance.tenant_session(tenant=tenant) as session:
            await orm.OrganizationFeature.new_organization_feature(session, feature)

    return enable_feature_for_organisation_inner
