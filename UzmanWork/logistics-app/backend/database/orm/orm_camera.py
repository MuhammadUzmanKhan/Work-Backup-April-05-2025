from __future__ import annotations

from collections import defaultdict
from datetime import datetime, timedelta
from ipaddress import IPv4Address
from typing import Sequence

import sqlalchemy as sa
from sqlalchemy import func, orm
from sqlalchemy.ext.asyncio import AsyncSession

from backend.constants import CAMERA_ONLINE_TIMEOUT, UNASSIGNED_TENANT
from backend.database import camera_models, models
from backend.database.orm import (
    orm_camera_group,
    orm_location,
    orm_nvr,
    orm_organization,
    orm_thumbnail,
)
from backend.database.orm.orm_utils import TenantProtectedTable
from backend.database.session import TenantAwareAsyncSession
from backend.models import AccessRestrictions, CameraResponse, CameraWithOnlineStatus
from backend.utils import AwareDatetime


class CameraError(Exception):
    pass


class CameraNotFoundError(CameraError):
    pass


def _camera_is_online(
    last_seen_time: AwareDatetime | None,
    is_enabled: bool,
    online_threshold: timedelta = CAMERA_ONLINE_TIMEOUT,
) -> bool:
    """Check if a camera is online.
    If the camera is enabled we check the last seen time
    and use that to determine if the camera is online.

    :param last_seen_time: the last time a CameraStatus message was received
    :param is_enabled: whether the camera is enabled
    :param online_threshold: threshold for determining if a camera is online
    :return: whether the camera is online
    """
    return (
        is_enabled
        and last_seen_time is not None
        and (AwareDatetime.utcnow() - last_seen_time < online_threshold)
    )


def generate_access_statement(
    access: AccessRestrictions | None,
) -> sa.sql.ClauseElement:
    if access is None or access.full_access:
        return sa.true()
    return sa.or_(
        *[
            sa.and_(
                Camera.camera_group_id == group_pair.camera_group_id,
                orm_location.Location.id == group_pair.location_id,
            )
            for group_pair in access.camera_groups
        ],
        orm_location.Location.id.in_(access.location_ids),
    )


def generate_perception_partition_table_name(mac_address: str) -> str:
    mac_address_safe = (
        mac_address.lower().replace(":", "_").replace("-", "_").replace(".", "_")
    )
    return f"public.perception_object_events_new_{mac_address_safe}"


class Camera(TenantProtectedTable):
    __tablename__ = "cameras"
    # TODO(@lberg): remove this as mac_address should be the primary key
    id: orm.Mapped[int] = sa.Column(sa.Integer, primary_key=True, autoincrement=True)
    # MAC address of the camera
    mac_address = sa.Column(sa.String, nullable=False, unique=True)
    # username for the camera, if any
    username = sa.Column(sa.String, nullable=True)
    # password for the camera, if any
    password = sa.Column(sa.String, nullable=True)
    # stream hash for kinesis
    stream_hash = sa.Column(sa.String, nullable=False, unique=True)
    # Camera group ID to which the camera belongs
    camera_group_id = sa.Column(
        sa.Integer, sa.ForeignKey("camera_groups.id"), nullable=False
    )
    # If this camera has been manually enabled by the user
    is_enabled = sa.Column(sa.Boolean, nullable=False)
    # NVR this camera is associated with
    nvr_uuid: orm.Mapped[str] = sa.Column(
        sa.String, sa.ForeignKey("nvrs.uuid"), nullable=False
    )
    # Camera vendor
    vendor = sa.Column(sa.String, nullable=False)
    # Camera IP
    ip = sa.Column(sa.String, nullable=False)
    # Camera name.
    name = sa.Column(sa.String, nullable=False)
    # Last time a status message was received
    last_seen_time = sa.Column(sa.TIMESTAMP(timezone=True), nullable=True)
    # The orientation type of the camera
    video_orientation_type = sa.Column(
        sa.Enum(models.VideoOrientationType),
        nullable=False,
        server_default=models.VideoOrientationType.OrientationIdentity,
    )
    # Whether this camera is permanently streaming live
    is_always_streaming = sa.Column(sa.Boolean, nullable=False, default=False)
    # Whether license plate detection is enabled for this camera
    is_license_plate_detection_enabled = sa.Column(
        sa.Boolean, nullable=False, default=False
    )
    # Whether audio is enabled for this camera
    is_audio_enabled = sa.Column(sa.Boolean, nullable=False, default=False)
    # Whether this camera is faulty, default is False
    is_faulty = sa.Column(sa.Boolean, nullable=False, default=False)
    # The RTSP port of the camera
    rtsp_port = sa.Column(sa.Integer, nullable=False, default=0)
    # Whether to use webRTC for this camera
    is_webrtc_enabled = sa.Column(sa.Boolean, nullable=False, default=False)
    # Whether to force the FPS for this camera
    is_force_fps_enabled = sa.Column(sa.Boolean, nullable=False, default=False)
    # The rtsp url for the camera (if enforced manually)
    enforced_rtsp_url = sa.Column(sa.String, nullable=True)
    width = sa.Column(sa.Integer, nullable=True)
    height = sa.Column(sa.Integer, nullable=True)
    fps = sa.Column(sa.Integer, nullable=True)
    bitrate_kbps = sa.Column(sa.Integer, nullable=True)
    codec = sa.Column(sa.String, nullable=True)

    __table_args__ = ((sa.ForeignKeyConstraint(["tenant"], ["organizations.tenant"])),)

    @staticmethod
    async def update_camera_group(
        session: TenantAwareAsyncSession, camera_id: int, group_id: int
    ) -> None:
        row_count = (
            await session.execute(
                sa.update(Camera)
                .where(Camera.id == camera_id)
                .values(camera_group_id=group_id)
            )
        ).rowcount  # type: ignore

        if row_count != 1:
            raise CameraNotFoundError(f"Camera with {camera_id=} not found")

    @staticmethod
    async def _lock_for_update(
        session: TenantAwareAsyncSession,
        *,
        mac_addresses: set[str] | None = None,
        cameras_ids: set[int] | None = None,
    ) -> None:
        """Lock a set of rows in a deterministic order.
        NOTE: This should be used when multiple processes are updating the same rows,
        possibly in a different order.
        """
        mac_addresses = mac_addresses or set()
        cameras_ids = cameras_ids or set()
        query = (
            sa.select(Camera)
            .where(
                sa.or_(
                    Camera.mac_address.in_(sorted(mac_addresses)),
                    Camera.id.in_(sorted(cameras_ids)),
                )
            )
            .order_by(Camera.mac_address)
            .with_for_update(key_share=True)
        )
        await session.execute(query)

    # NOTE(@slava): deprecated, left for backwards compatibility
    @staticmethod
    async def update_cameras_last_seen_time(
        session: TenantAwareAsyncSession,
        mac_addresses: set[str],
        last_seen_time: AwareDatetime,
    ) -> None:
        await Camera._lock_for_update(session, mac_addresses=mac_addresses)

        stmt = (
            sa.update(Camera)
            .where(Camera.mac_address.in_(sorted(mac_addresses)))
            .values({Camera.last_seen_time: last_seen_time})
        )
        await session.execute(stmt)

    @staticmethod
    async def update_cameras_stream_details(
        session: TenantAwareAsyncSession,
        updates: list[camera_models.UpdateCameraStreamDetails],
    ) -> None:
        mac_addresses = {update.mac_address for update in updates}
        camera_ids_select = await session.execute(
            sa.select([Camera.id, Camera.mac_address]).where(
                Camera.mac_address.in_(mac_addresses)
            )
        )
        mac_to_id = {row["mac_address"]: row["id"] for row in camera_ids_select}

        await Camera._lock_for_update(session, mac_addresses=mac_addresses)

        update_mappings = [
            {
                "id": mac_to_id[update.mac_address],
                "width": update.width,
                "height": update.height,
                "fps": update.fps,
                "bitrate_kbps": update.bitrate_kbps,
                "codec": update.codec,
                "last_seen_time": update.last_seen_time,
            }
            for update in updates
            if update.mac_address in mac_to_id
        ]

        await session.run_sync(
            lambda s: s.bulk_update_mappings(Camera, update_mappings)
        )

    @staticmethod
    async def _query_cameras(
        session: AsyncSession,
        where_clauses: list[sa.sql.ClauseElement],
        online_threshold: timedelta = CAMERA_ONLINE_TIMEOUT,
    ) -> list[CameraResponse]:
        """A helper function to query cameras.

        :param where_clauses: list of conditions to filter the query
        :param online_threshold: threshold for determining if a camera is online
        :return: list of returned cameras
        """
        selection_list = [
            Camera,
            orm_camera_group.CameraGroup.name.label("group"),
            orm_camera_group.CameraGroup.is_default.label("is_default_group"),
            orm_nvr.NVR.uuid.label("nvr_uuid"),
            orm_nvr.NVR.location_id,
            orm_nvr.NVR.timezone.label("nvr_timezone"),
            orm_location.Location.name.label("location_name"),
            orm_location.Location.enable_setting_timezone.label(
                "location_enable_setting_timezone"
            ),
            orm_location.Location.timezone.label("location_timezone"),
            orm_organization.Organization.name.label("organization_name"),
        ]

        query = (
            sa.select(*selection_list)
            .join(orm_nvr.NVR, Camera.nvr_uuid == orm_nvr.NVR.uuid)
            .join(
                orm_location.Location,
                orm_nvr.NVR.location_id == orm_location.Location.id,
                isouter=True,
            )
            .join(
                orm_organization.Organization,
                Camera.tenant == orm_organization.Organization.tenant,
            )
            .join(
                orm_camera_group.CameraGroup,
                Camera.camera_group_id == orm_camera_group.CameraGroup.id,
            )
            .where(*where_clauses)
            .order_by(orm_nvr.NVR.uuid, Camera.id.desc())
        )

        result = await session.execute(query)
        rows = result.all()
        response: list[CameraResponse] = []
        for row in rows:
            camera_online = _camera_is_online(
                row.Camera.last_seen_time, row.Camera.is_enabled, online_threshold
            )

            timezone = (
                row.location_timezone
                if row.location_enable_setting_timezone is True
                else row.nvr_timezone
            )

            response.append(
                CameraResponse(
                    camera=CameraWithOnlineStatus.parse_obj(
                        {
                            **models.Camera.from_orm(row.Camera).dict(),
                            "is_online": camera_online,
                        }
                    ),
                    group_name=row.group,
                    is_default_group=row.is_default_group,
                    location_id=row.location_id,
                    location=row.location_name,
                    nvr_timezone=timezone,
                    timezone=timezone,
                    org_name=row.organization_name,
                )
            )

        return response

    @staticmethod
    async def system_get_cameras(
        session: AsyncSession,
        query_config: models.CamerasQueryConfig,
        access_restrictions: AccessRestrictions | None = None,
    ) -> list[CameraResponse]:
        where_clauses = [generate_access_statement(access_restrictions)]
        if query_config.nvr_uuids is not None:
            where_clauses.append(orm_nvr.NVR.uuid.in_(query_config.nvr_uuids))
        if query_config.mac_addresses is not None:
            where_clauses.append(Camera.mac_address.in_(query_config.mac_addresses))
        if query_config.location_ids is not None:
            where_clauses.append(
                orm_location.Location.id.in_(query_config.location_ids)
            )
        if query_config.exclude_disabled:
            where_clauses.append(Camera.is_enabled.is_(True))

        return await Camera._query_cameras(
            session, where_clauses, query_config.online_threshold
        )

    @staticmethod
    async def get_cameras(
        session: TenantAwareAsyncSession,
        query_config: models.CamerasQueryConfig,
        access_restrictions: AccessRestrictions | None = None,
    ) -> list[CameraResponse]:
        return await Camera.system_get_cameras(
            session, query_config, access_restrictions
        )

    @staticmethod
    async def get_mac_addresses_with_license_plate_detection_enabled(
        session: TenantAwareAsyncSession,
        mac_addresses: set[str],
        location_ids: set[int],
    ) -> list[str]:
        """Get the list of camera mac addresses that has license plate detection
        enabled.
        """
        where_clauses = [
            Camera.is_license_plate_detection_enabled.is_(True),
            Camera.mac_address.in_(mac_addresses),
            orm_location.Location.id.in_(location_ids),
        ]

        stmt = (
            sa.select(Camera.mac_address)
            .join(orm_nvr.NVR, Camera.nvr_uuid == orm_nvr.NVR.uuid)
            .join(
                orm_location.Location,
                orm_nvr.NVR.location_id == orm_location.Location.id,
            )
            .where(*where_clauses)
        )
        result = await session.execute(stmt)
        return [row.mac_address for row in result.all()]

    @staticmethod
    async def system_get_nvrs_online_cameras_count(
        session: AsyncSession, nvr_uuids: set[str]
    ) -> dict[str, int]:
        where_clauses: list[sa.sql.ClauseElement] = [
            Camera.is_enabled.is_(True),
            Camera.nvr_uuid.in_(nvr_uuids),
        ]
        cameras = await Camera._query_cameras(session, where_clauses)

        nvr_uuid_to_online_camera_count: defaultdict[str, int] = defaultdict(int)
        for camera in cameras:
            if not camera.camera.is_online:
                continue

            nvr_uuid_to_online_camera_count[camera.camera.nvr_uuid] += 1

        return dict(nvr_uuid_to_online_camera_count)

    @staticmethod
    async def get_always_on_cameras(
        session: TenantAwareAsyncSession,
    ) -> list[CameraResponse]:
        return await Camera._query_cameras(
            session, [Camera.is_always_streaming.is_(True)], CAMERA_ONLINE_TIMEOUT
        )

    @staticmethod
    async def resolve_id_to_mac_address(
        session: TenantAwareAsyncSession, camera_id: int
    ) -> str:
        stmt = sa.select(Camera.mac_address).where(Camera.id == camera_id)
        result = await session.execute(stmt)
        mac_address = result.scalar_one_or_none()
        if mac_address is None:
            raise CameraNotFoundError(f"Camera {camera_id=} not found")
        return str(mac_address)

    @staticmethod
    async def system_get_cameras_from_mac_addresses(
        session: AsyncSession, mac_addresses: set[str]
    ) -> list[CameraResponse]:
        return await Camera._query_cameras(
            session, [Camera.mac_address.in_(mac_addresses)]
        )

    @staticmethod
    async def get_cameras_from_mac_addresses(
        session: TenantAwareAsyncSession, mac_addresses: set[str]
    ) -> list[CameraResponse]:
        return await Camera.system_get_cameras_from_mac_addresses(
            session, mac_addresses
        )

    @staticmethod
    async def disable_camera(session: TenantAwareAsyncSession, camera_id: int) -> None:
        await Camera._lock_for_update(session, cameras_ids={camera_id})
        row_count = (
            await session.execute(
                sa.update(Camera).where(Camera.id == camera_id).values(is_enabled=False)
            )
        ).rowcount  # type: ignore

        if row_count != 1:
            raise CameraNotFoundError(f"Camera with {camera_id=} not found")

    @staticmethod
    async def rename_camera(
        session: TenantAwareAsyncSession, camera_id: int, camera_name: str
    ) -> None:
        await Camera._lock_for_update(session, cameras_ids={camera_id})
        row_count = (
            await session.execute(
                sa.update(Camera).where(Camera.id == camera_id).values(name=camera_name)
            )
        ).rowcount  # type: ignore

        if row_count != 1:
            raise CameraNotFoundError(f"Camera with {camera_id=} not found")

    @staticmethod
    async def update_cameras_ip_address(
        session: TenantAwareAsyncSession, camera_to_ip: dict[str, IPv4Address]
    ) -> None:
        await Camera._lock_for_update(session, mac_addresses=set(camera_to_ip.keys()))
        stmt = (
            sa.update(Camera)
            .where(Camera.mac_address == sa.bindparam("b_mac_address"))
            .values(ip=sa.bindparam("b_ip_address"))
        )
        await session.execute(
            stmt,
            [
                {"b_mac_address": mac_address, "b_ip_address": str(ip_address)}
                for (mac_address, ip_address) in sorted(camera_to_ip.items())
            ],
        )

    @staticmethod
    async def update_cameras_rtsp_port(
        session: TenantAwareAsyncSession, camera_to_rtsp_port: dict[str, int]
    ) -> None:
        await Camera._lock_for_update(
            session, mac_addresses=set(camera_to_rtsp_port.keys())
        )
        stmt = (
            sa.update(Camera)
            .where(Camera.mac_address == sa.bindparam("b_mac_address"))
            .values(rtsp_port=sa.bindparam("b_rtsp_port"))
        )
        await session.execute(
            stmt,
            [
                {"b_mac_address": mac_address, "b_rtsp_port": rtsp_port}
                for (mac_address, rtsp_port) in sorted(camera_to_rtsp_port.items())
            ],
        )

    @staticmethod
    async def system_check_stream_hash_exists(
        session: AsyncSession, stream_hash: str
    ) -> bool:
        """Check if the stream hash already exists."""
        stmt = sa.select(Camera.id).where(Camera.stream_hash == stream_hash)
        result = await session.execute(stmt)
        return result.scalar_one_or_none() is not None

    @staticmethod
    async def system_new_camera(
        session: AsyncSession,
        camera_metadata: models.CameraCreate,
        stream_hash: str,
        tenant: str,
    ) -> Camera:
        default_group = (
            await orm_camera_group.CameraGroup.system_get_tenant_default_group(
                session, tenant
            )
        )
        # TODO(nedyalko): This solution has potential race conditions. We
        # should protect the camera names from duplicates due to race conditions.
        # "Camera <num_cameras + 1>".
        num_cameras = await Camera._num_cameras_per_tenant(session, tenant)
        name = f"Camera {num_cameras + 1}"

        camera = Camera(
            stream_hash=stream_hash,
            camera_group_id=default_group.id,
            is_enabled=camera_metadata.is_enabled,
            mac_address=camera_metadata.mac_address,
            nvr_uuid=camera_metadata.nvr_uuid,
            vendor=camera_metadata.vendor,
            ip=camera_metadata.ip,
            name=name,
            video_orientation_type=camera_metadata.video_orientation_type,
            is_always_streaming=camera_metadata.is_always_streaming,
            is_license_plate_detection_enabled=(
                camera_metadata.is_license_plate_detection_enabled
            ),
            is_audio_enabled=camera_metadata.is_audio_enabled,
            is_faulty=camera_metadata.is_faulty,
            is_force_fps_enabled=camera_metadata.is_force_fps_enabled,
            username=camera_metadata.username,
            password=camera_metadata.password,
            last_seen_time=camera_metadata.last_seen_time,
            rtsp_port=camera_metadata.rtsp_port,
            enforced_rtsp_url=camera_metadata.enforced_rtsp_url,
            tenant=tenant,
        )
        session.add(camera)
        return camera

    @staticmethod
    async def system_reassign_camera(
        session: AsyncSession,
        camera_metadata: models.CameraCreate,
        stream_hash: str,
        target_tenant: str,
    ) -> None:
        default_group = (
            await orm_camera_group.CameraGroup.system_get_tenant_default_group(
                session, target_tenant
            )
        )
        num_cameras = await Camera._num_cameras_per_tenant(session, target_tenant)
        name = f"Camera {num_cameras + 1}"
        row_count = (
            await session.execute(
                sa.update(Camera)
                .where(Camera.mac_address == camera_metadata.mac_address)
                .values(
                    stream_hash=stream_hash,
                    camera_group_id=default_group.id,
                    is_enabled=camera_metadata.is_enabled,
                    nvr_uuid=camera_metadata.nvr_uuid,
                    vendor=camera_metadata.vendor,
                    ip=camera_metadata.ip,
                    name=name,
                    video_orientation_type=camera_metadata.video_orientation_type,
                    is_always_streaming=camera_metadata.is_always_streaming,
                    is_license_plate_detection_enabled=(
                        camera_metadata.is_license_plate_detection_enabled
                    ),
                    is_audio_enabled=camera_metadata.is_audio_enabled,
                    is_faulty=camera_metadata.is_faulty,
                    username=camera_metadata.username,
                    password=camera_metadata.password,
                    last_seen_time=camera_metadata.last_seen_time,
                    rtsp_port=camera_metadata.rtsp_port,
                    enforced_rtsp_url=camera_metadata.enforced_rtsp_url,
                    tenant=target_tenant,
                )
            )
        ).rowcount  # type: ignore

        if row_count != 1:
            raise CameraNotFoundError(
                f"Camera with {camera_metadata.mac_address=} not found"
            )

    @staticmethod
    async def system_unassign_camera(session: AsyncSession, mac_address: str) -> None:
        default_group = (
            await orm_camera_group.CameraGroup.system_get_tenant_default_group(
                session, UNASSIGNED_TENANT
            )
        )
        row_count = (
            await session.execute(
                sa.update(Camera)
                .where(Camera.mac_address == mac_address)
                .values(tenant=UNASSIGNED_TENANT, camera_group_id=default_group.id)
            )
        ).rowcount  # type: ignore

        if row_count != 1:
            raise CameraNotFoundError(f"Camera with {mac_address=} not found")

    @staticmethod
    async def update_camera_credentials(
        session: TenantAwareAsyncSession,
        mac_address: str,
        username: str | None,
        should_update_username: bool,
        password: str | None,
        should_update_password: bool,
    ) -> None:
        """Update the credentials for a camera.
        Each update is optional and controlled by the corresponding flag.
        Note that None is a valid value for the username and password,
        and therefore can't be used to check if the update should be performed.

        :param session: The database session.
        :param mac_address: The MAC address of the camera.
        :param username: The username, if any.
        :param should_update_username: Whether to update the username.
        :param password: The password, if any.
        :param should_update_password: Whether to update the password.
        """
        if not should_update_username and not should_update_password:
            return
        stmt = sa.update(Camera)
        if should_update_username:
            stmt = stmt.values(username=username)
        if should_update_password:
            stmt = stmt.values(password=password)
        stmt = stmt.where(Camera.mac_address == mac_address)
        await session.execute(stmt)

    @staticmethod
    async def get_cameras_credentials(
        session: TenantAwareAsyncSession, mac_addresses: list[str]
    ) -> dict[str, models.CameraCredentials]:
        """Get the credentials for a list of cameras.

        :param session: The database session.
        :param mac_addresses: The MAC addresses of the cameras.
        :return: A dictionary with the credentials for the cameras.
        """
        stmt = sa.select(
            Camera.mac_address, Camera.username, Camera.password, Camera.vendor
        ).where(Camera.mac_address.in_(mac_addresses))
        result = await session.execute(stmt)
        cameras = result.all()
        return {
            camera.mac_address: models.CameraCredentials.from_orm(camera)
            for camera in cameras
        }

    @staticmethod
    async def update_camera_rtsp_url(
        session: TenantAwareAsyncSession, mac_address: str, rtsp_url: str | None
    ) -> None:
        stmt = (
            sa.update(Camera)
            .where(Camera.mac_address == mac_address)
            .values(enforced_rtsp_url=rtsp_url)
        )
        row_count = (await session.execute(stmt)).rowcount  # type: ignore
        if row_count != 1:
            raise CameraNotFoundError(f"Camera with {mac_address=} not found")

    @staticmethod
    async def get_allowed_cameras_by_mac_address(
        session: TenantAwareAsyncSession,
        mac_addresses: list[str],
        access: AccessRestrictions,
    ) -> list[CameraWithOnlineStatus]:
        stmt = (
            sa.select(Camera)
            .join(orm_nvr.NVR, Camera.nvr_uuid == orm_nvr.NVR.uuid)
            .join(
                orm_location.Location,
                orm_nvr.NVR.location_id == orm_location.Location.id,
            )
        ).where(
            Camera.mac_address.in_(mac_addresses), generate_access_statement(access)
        )
        result = await session.execute(stmt)
        cameras_dict = {
            camera.mac_address: CameraWithOnlineStatus.parse_obj(
                {
                    **models.Camera.from_orm(camera).dict(),
                    "is_online": _camera_is_online(
                        camera.last_seen_time, camera.is_enabled
                    ),
                }
            )
            for camera in result.scalars().all()
        }

        return [
            cameras_dict[mac_address]
            for mac_address in mac_addresses
            if mac_address in cameras_dict
        ]

    @staticmethod
    async def get_camera_response_from_camera(
        session: TenantAwareAsyncSession, camera: models.Camera
    ) -> CameraResponse | None:
        results = await Camera._query_cameras(
            session, [Camera.mac_address == camera.mac_address]
        )
        return results[0] if results else None

    @staticmethod
    async def user_has_access_to_mac_addresses(
        session: TenantAwareAsyncSession,
        mac_addresses: list[str],
        access: AccessRestrictions,
    ) -> bool:
        unique_mac_addresses = list(set(mac_addresses))
        cameras = await Camera.get_allowed_cameras_by_mac_address(
            session, unique_mac_addresses, access
        )
        return len(cameras) == len(unique_mac_addresses)

    @staticmethod
    async def nvr_has_mac_addresses(
        session: TenantAwareAsyncSession, nvr_uuid: str, mac_addresses: set[str]
    ) -> bool:
        stmt = sa.select(Camera.mac_address).where(
            Camera.nvr_uuid == nvr_uuid, Camera.mac_address.in_(mac_addresses)
        )
        result = await session.execute(stmt)
        return len(result.scalars().all()) == len(mac_addresses)

    @staticmethod
    async def update_camera_video_orientation_type(
        session: TenantAwareAsyncSession,
        mac_address: str,
        video_orientation_type: models.VideoOrientationType,
    ) -> None:
        stmt = sa.update(Camera)
        stmt = stmt.values(video_orientation_type=video_orientation_type)
        stmt = stmt.where(Camera.mac_address == mac_address)
        await session.execute(stmt)

    @staticmethod
    async def update_cameras_flag(
        session: TenantAwareAsyncSession,
        mac_addresses: Sequence[str],
        flag_enum: models.CameraFlag,
        flag_value: bool,
    ) -> None:
        stmt = sa.update(Camera)
        stmt = stmt.values(**{flag_enum.value: flag_value})
        stmt = stmt.where(Camera.mac_address.in_(mac_addresses))
        await session.execute(stmt)

    @staticmethod
    async def update_camera_flag(
        session: TenantAwareAsyncSession,
        mac_address: str,
        flag_enum: models.CameraFlag,
        flag_value: bool,
    ) -> None:
        await Camera.update_cameras_flag(
            session, [mac_address], flag_enum=flag_enum, flag_value=flag_value
        )

    @staticmethod
    async def system_get_cameras_with_no_recent_thumbnails(
        session: AsyncSession, time_threshold: timedelta
    ) -> list[CameraResponse]:
        statement = (
            sa.select(orm_thumbnail.Thumbnail.camera_mac_address)
            .distinct()
            .where(
                orm_thumbnail.Thumbnail.timestamp > datetime.utcnow() - time_threshold
            )
        )
        recently_active_camera_mac_addresses = (
            (await session.execute(statement)).scalars().all()
        )

        return await Camera._query_cameras(
            session, [Camera.mac_address.not_in(recently_active_camera_mac_addresses)]
        )

    @staticmethod
    async def _num_cameras_per_tenant(session: AsyncSession, tenant: str) -> int:
        count = await session.scalar(
            sa.select(func.count(Camera.id)).where(Camera.tenant == tenant)
        )
        return count or 0

    @staticmethod
    async def system_cameras_retention_info(
        session: AsyncSession,
    ) -> list[models.CameraRetentionInfo]:
        statement = (
            sa.select(Camera.mac_address, orm_nvr.NVR.retention_days, Camera.tenant)
            .join(orm_nvr.NVR, Camera.nvr_uuid == orm_nvr.NVR.uuid)
            .order_by(Camera.mac_address)
        )
        result = await session.execute(statement)
        return [
            models.CameraRetentionInfo(
                mac_address=row.mac_address,
                retention_days=row.retention_days,
                tenant=row.tenant,
            )
            for row in result
        ]

    @staticmethod
    async def system_camera_has_part_config(
        session: AsyncSession, camera_info: models.CameraRetentionInfo
    ) -> bool:
        """Check if a camera has an entry in part_config.
        NOTE: This is a raw query as partman config is not mapped to an ORM model.
        """
        parent_table_name = generate_perception_partition_table_name(
            camera_info.mac_address
        )
        result = await session.execute(
            sa.text(
                "select count(*) from partman.part_config"
                " WHERE partman.part_config.parent_table = :parent_table_name"
            ).bindparams(sa.bindparam("parent_table_name", parent_table_name))
        )
        count = result.scalar_one_or_none()
        return count is not None and count > 0

    @staticmethod
    async def system_update_camera_part_config_retention(
        session: AsyncSession, camera_info: models.CameraRetentionInfo
    ) -> int:
        """Update the retention for a camera in the partman config.
        NOTE: This is a raw query as partman config is not mapped to an ORM model.
        """
        parent_table_name = generate_perception_partition_table_name(
            camera_info.mac_address
        )
        result = await session.execute(
            sa.text(
                "UPDATE partman.part_config SET"
                " retention=:retention, retention_keep_table='f'"
                " WHERE partman.part_config.parent_table = :parent_table_name"
            ).bindparams(
                sa.bindparam("parent_table_name", parent_table_name),
                sa.bindparam("retention", camera_info.retention_days_string),
            )
        )
        return int(result.rowcount)  # type: ignore
