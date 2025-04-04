from datetime import timedelta

from backend.database import database, orm
from backend.database.models import NVR, Camera
from backend.database.organization_models import Organization
from backend.monitor import utils
from backend.monitor.constants import CAMERA_DOWNTIME_WINDOW_RESET_INTERVAL
from backend.monitor.models import CameraHeartbeat, CameraHeartbeatBatchRequest
from backend.utils import AwareDatetime


async def test_update_cameras_downtime_create_new(
    db_instance: database.Database, nvr: NVR, camera: Camera, organization: Organization
) -> None:
    async with db_instance.tenant_session(tenant=organization.tenant) as session:
        end_time = AwareDatetime.utcnow()
        start_time = end_time - timedelta(days=2)
        await utils.update_cameras_downtime(
            session=session,
            nvr_uuid=nvr.uuid,
            online_camera_mac_addresses=set([]),
            current_time=end_time,
        )

        downtimes = await orm.CameraDowntime.get_downtimes_for_camera(
            session=session,
            camera_mac_address=camera.mac_address,
            time_start=start_time - timedelta(days=1),
            time_end=end_time + timedelta(days=1),
        )

        assert len(downtimes) == 1
        assert downtimes[0].downtime_start == end_time
        assert downtimes[0].downtime_end == end_time


async def test_create_new_downtime_after_inactivity_period(
    db_instance: database.Database, nvr: NVR, camera: Camera, organization: Organization
) -> None:
    async with db_instance.tenant_session(tenant=organization.tenant) as session:
        end_time = AwareDatetime.utcnow()
        start_time = end_time - timedelta(days=2)

        # Received a heartbeat, no op
        await utils.update_cameras_downtime(
            session=session,
            nvr_uuid=nvr.uuid,
            online_camera_mac_addresses=set([camera.mac_address]),
            current_time=start_time,
        )

        # No camera heartbeats => create an entry
        await utils.update_cameras_downtime(
            session=session,
            nvr_uuid=nvr.uuid,
            online_camera_mac_addresses=set([]),
            current_time=start_time + CAMERA_DOWNTIME_WINDOW_RESET_INTERVAL,
        )
        await utils.update_cameras_downtime(
            session=session,
            nvr_uuid=nvr.uuid,
            online_camera_mac_addresses=set([]),
            current_time=start_time + CAMERA_DOWNTIME_WINDOW_RESET_INTERVAL * 1.5,
        )

        await utils.update_cameras_downtime(
            session=session,
            nvr_uuid=nvr.uuid,
            online_camera_mac_addresses=set([camera.mac_address]),
            current_time=start_time + 3 * CAMERA_DOWNTIME_WINDOW_RESET_INTERVAL,
        )

        downtimes = await orm.CameraDowntime.get_downtimes_for_camera(
            session=session,
            camera_mac_address=camera.mac_address,
            time_start=start_time,
            time_end=end_time,
        )
        assert len(downtimes) == 1

        assert (
            downtimes[0].downtime_start
            == start_time + CAMERA_DOWNTIME_WINDOW_RESET_INTERVAL
        )
        assert (
            downtimes[0].downtime_end
            == start_time + 1.5 * CAMERA_DOWNTIME_WINDOW_RESET_INTERVAL
        )


async def test_update_existing_downtime_within_inactivity_period(
    db_instance: database.Database, nvr: NVR, camera: Camera, organization: Organization
) -> None:
    async with db_instance.tenant_session(tenant=organization.tenant) as session:
        end_time = AwareDatetime.utcnow()
        start_time = end_time - timedelta(days=2)

        first_inactive_hearbeat_t = end_time - timedelta(seconds=30)
        await utils.update_cameras_downtime(
            session=session,
            nvr_uuid=nvr.uuid,
            online_camera_mac_addresses=set([]),
            current_time=first_inactive_hearbeat_t,
        )

        # 10 seconds later, the camera is back online
        first_active_hearbeat_t = end_time - timedelta(seconds=20)
        await utils.update_cameras_downtime(
            session=session,
            nvr_uuid=nvr.uuid,
            online_camera_mac_addresses=set([camera.mac_address]),
            current_time=first_active_hearbeat_t,
        )

        # 10 seconds later, the camera is offline again
        second_inactive_hearbeat_t = end_time - timedelta(seconds=10)
        await utils.update_cameras_downtime(
            session=session,
            nvr_uuid=nvr.uuid,
            online_camera_mac_addresses=set([]),
            current_time=second_inactive_hearbeat_t,
        )

        downtimes = await orm.CameraDowntime.get_downtimes_for_camera(
            session=session,
            camera_mac_address=camera.mac_address,
            time_start=start_time,
            time_end=end_time,
        )
        assert len(downtimes) == 1
        assert downtimes[0].downtime_start == first_inactive_hearbeat_t
        assert downtimes[0].downtime_end == second_inactive_hearbeat_t


async def test_batch_update_two_far_offline_heartbeats(
    db_instance: database.Database, nvr: NVR, camera: Camera, organization: Organization
) -> None:
    async with db_instance.tenant_session(tenant=organization.tenant) as session:
        end_time = AwareDatetime.utcnow()
        start_time = end_time - timedelta(days=2)

        # Two heartbeats update without any online camera and the two heartbeats
        # are far enough apart to create two separate downtimes.
        await utils.batch_update_cameras_downtime(
            session=session,
            nvr_uuid=nvr.uuid,
            batch_update_request=(
                CameraHeartbeatBatchRequest(
                    batch_heartbeats=[
                        CameraHeartbeat(camera_mac_addresses=[], timestamp=start_time),
                        CameraHeartbeat(
                            camera_mac_addresses=[],
                            timestamp=start_time
                            + CAMERA_DOWNTIME_WINDOW_RESET_INTERVAL,
                        ),
                    ]
                )
            ),
        )

        downtimes = await orm.CameraDowntime.get_downtimes_for_camera(
            session=session,
            camera_mac_address=camera.mac_address,
            time_start=start_time - timedelta(days=1),
            time_end=end_time + timedelta(days=1),
        )

        sorted_downtimes = sorted(downtimes, key=lambda x: x.downtime_start)

        assert len(sorted_downtimes) == 2
        assert downtimes[0].downtime_start == start_time
        assert downtimes[0].downtime_end == start_time
        assert downtimes[1].downtime_start == (
            start_time + CAMERA_DOWNTIME_WINDOW_RESET_INTERVAL
        )
        assert downtimes[1].downtime_end == (
            start_time + CAMERA_DOWNTIME_WINDOW_RESET_INTERVAL
        )


async def test_batch_update_two_close_offline_heartbeats(
    db_instance: database.Database, nvr: NVR, camera: Camera, organization: Organization
) -> None:
    async with db_instance.tenant_session(tenant=organization.tenant) as session:
        end_time = AwareDatetime.utcnow()
        start_time = end_time - timedelta(days=2)

        # Two heartbeats update without any online camera and the two heartbeats
        # are close enough to be merged as a single downtime
        await utils.batch_update_cameras_downtime(
            session=session,
            nvr_uuid=nvr.uuid,
            batch_update_request=(
                CameraHeartbeatBatchRequest(
                    batch_heartbeats=[
                        CameraHeartbeat(camera_mac_addresses=[], timestamp=start_time),
                        CameraHeartbeat(
                            camera_mac_addresses=[],
                            timestamp=start_time
                            + CAMERA_DOWNTIME_WINDOW_RESET_INTERVAL / 2,
                        ),
                    ]
                )
            ),
        )

        downtimes = await orm.CameraDowntime.get_downtimes_for_camera(
            session=session,
            camera_mac_address=camera.mac_address,
            time_start=start_time - timedelta(days=1),
            time_end=end_time + timedelta(days=1),
        )

        sorted_downtimes = sorted(downtimes, key=lambda x: x.downtime_start)

        assert len(sorted_downtimes) == 1
        assert downtimes[0].downtime_start == start_time
        assert downtimes[0].downtime_end == (
            start_time + CAMERA_DOWNTIME_WINDOW_RESET_INTERVAL / 2
        )


async def test_batch_update_two_online_heartbeats(
    db_instance: database.Database, nvr: NVR, camera: Camera, organization: Organization
) -> None:
    async with db_instance.tenant_session(tenant=organization.tenant) as session:
        end_time = AwareDatetime.utcnow()
        start_time = end_time - timedelta(days=2)

        # Two heartbeats update with online camera, no creation or update
        await utils.batch_update_cameras_downtime(
            session=session,
            nvr_uuid=nvr.uuid,
            batch_update_request=(
                CameraHeartbeatBatchRequest(
                    batch_heartbeats=[
                        CameraHeartbeat(
                            camera_mac_addresses=[camera.mac_address],
                            timestamp=start_time,
                        ),
                        CameraHeartbeat(
                            camera_mac_addresses=[camera.mac_address],
                            timestamp=start_time
                            + CAMERA_DOWNTIME_WINDOW_RESET_INTERVAL,
                        ),
                    ]
                )
            ),
        )

        downtimes = await orm.CameraDowntime.get_downtimes_for_camera(
            session=session,
            camera_mac_address=camera.mac_address,
            time_start=start_time - timedelta(days=1),
            time_end=end_time + timedelta(days=1),
        )
        assert len(downtimes) == 0


async def test_batch_update_mixed_heartbeats(
    db_instance: database.Database, nvr: NVR, camera: Camera, organization: Organization
) -> None:
    async with db_instance.tenant_session(tenant=organization.tenant) as session:
        end_time = AwareDatetime.utcnow()
        start_time = end_time - timedelta(days=2)

        await utils.update_cameras_downtime(
            session=session,
            nvr_uuid=nvr.uuid,
            online_camera_mac_addresses=set([]),
            current_time=start_time,
        )
        downtimes = await orm.CameraDowntime.get_downtimes_for_camera(
            session=session,
            camera_mac_address=camera.mac_address,
            time_start=start_time - timedelta(days=1),
            time_end=end_time + timedelta(days=1),
        )
        assert len(downtimes) == 1

        # The following batch update will:
        # 1. update
        # 2. no op
        # 3. create

        await utils.batch_update_cameras_downtime(
            session=session,
            nvr_uuid=nvr.uuid,
            batch_update_request=(
                CameraHeartbeatBatchRequest(
                    batch_heartbeats=[
                        CameraHeartbeat(
                            camera_mac_addresses=[],
                            timestamp=start_time + timedelta(seconds=10),
                        ),
                        CameraHeartbeat(
                            camera_mac_addresses=[camera.mac_address],
                            timestamp=start_time + timedelta(seconds=20),
                        ),
                        CameraHeartbeat(
                            camera_mac_addresses=[],
                            timestamp=start_time + timedelta(seconds=50),
                        ),
                    ]
                )
            ),
        )

        downtimes = await orm.CameraDowntime.get_downtimes_for_camera(
            session=session,
            camera_mac_address=camera.mac_address,
            time_start=start_time - timedelta(days=1),
            time_end=end_time + timedelta(days=1),
        )
        assert len(downtimes) == 2
        sorted_downtimes = sorted(downtimes, key=lambda x: x.downtime_start)
        assert sorted_downtimes[0].downtime_start == start_time
        assert sorted_downtimes[0].downtime_end == start_time + timedelta(seconds=10)
        assert sorted_downtimes[1].downtime_start == start_time + timedelta(seconds=50)
        assert sorted_downtimes[1].downtime_end == start_time + timedelta(seconds=50)
