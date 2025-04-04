import logging

from backend.database import camera_downtime_models, orm
from backend.database.models import CamerasQueryConfig
from backend.database.session import TenantAwareAsyncSession
from backend.instrumentation.influx_serializer import InfluxSerializer
from backend.models import NvrKvsConnectionStatus
from backend.monitor.constants import CAMERA_DOWNTIME_WINDOW_RESET_INTERVAL
from backend.monitor.models import (
    CameraHeartbeatBatchRequest,
    InternetStatusRequest,
    NvrKvsConnectionStatusUpdate,
)
from backend.utils import AwareDatetime
from backend.value_store import ValueStore
from backend.value_store.value_store import get_nvr_kvs_connection_status_key


class MergeCameraHeartbeatsInputError(Exception):
    pass


async def instrument_nvr_internet_status(internet_status: InternetStatusRequest) -> str:
    serializer = InfluxSerializer(measurement_name="nvr_internet_status")
    serializer.add_tag("nvr_uuid", internet_status.nvr_uuid)
    serializer.add_field("avg_ping_latency_ms", internet_status.avg_ping_latency_ms)
    serializer.add_field("packet_loss", internet_status.packet_loss)
    if internet_status.internet_speed:
        serializer.add_field(
            "download_speed_bps", internet_status.internet_speed.download_speed_bps
        )
        serializer.add_field(
            "upload_speed_bps", internet_status.internet_speed.upload_speed_bps
        )

    return serializer.get_as_string()


async def _merge_camera_heartbeats(
    offline_camera_mac_address: str,
    sorted_offline_timestamp_history: list[AwareDatetime],
    db_most_recent_downtime: AwareDatetime | None,
) -> tuple[
    list[camera_downtime_models.AddCameraDowntime],
    camera_downtime_models.UpdateCameraDowntimeWithMac | None,
]:
    """
    :param offline_camera_mac_address:
        The mac address of the camera that is offline when receiving a heartbeat.
    :param offline_timestamp_history:
        The list of timestamps when the camera was considered online
    :param most_recent_downtime:
        The most recent downtime of the camera from the db

    Merge the offline camera heartbeats with the most recent downtime.
    For each camera, will return at most 1 update and N (>=0) add operations.
    """
    if sorted_offline_timestamp_history != sorted(sorted_offline_timestamp_history):
        raise MergeCameraHeartbeatsInputError(
            "The offline_timestamp_history must be sorted"
        )

    update_operation: camera_downtime_models.UpdateCameraDowntimeWithMac | None = None
    add_operations = []
    most_recent_downtime = db_most_recent_downtime
    for heartbeat_timestamp in sorted_offline_timestamp_history:
        if most_recent_downtime is None:
            # no downtime history yet, create a new downtime entry
            add_operations.append(
                camera_downtime_models.AddCameraDowntime(
                    camera_mac_address=offline_camera_mac_address,
                    downtime_start=heartbeat_timestamp,
                    downtime_end=heartbeat_timestamp,
                )
            )
        elif (
            heartbeat_timestamp - most_recent_downtime
            < CAMERA_DOWNTIME_WINDOW_RESET_INTERVAL
        ):
            #
            # the timestamp is within the downtime window, extend the downtime
            # of the update_operation if it exists, otherwise extend the downtime
            # of the last add operation. This works because the timestamps are sorted.
            #
            # no add operations were created, extend the downtime
            if len(add_operations) == 0:
                update_operation = camera_downtime_models.UpdateCameraDowntimeWithMac(
                    camera_mac_address=offline_camera_mac_address,
                    downtime_end=heartbeat_timestamp,
                )
            else:
                # there are create operations, extend the last one
                add_operations[-1].downtime_end = heartbeat_timestamp
        else:
            # the timestamp is outside the downtime window,
            # create a new downtime entry
            add_operations.append(
                camera_downtime_models.AddCameraDowntime(
                    camera_mac_address=offline_camera_mac_address,
                    downtime_start=heartbeat_timestamp,
                    downtime_end=heartbeat_timestamp,
                )
            )
        most_recent_downtime = heartbeat_timestamp

    return (add_operations, update_operation)


async def update_cameras_downtime(
    session: TenantAwareAsyncSession,
    nvr_uuid: str,
    online_camera_mac_addresses: set[str],
    current_time: AwareDatetime,
) -> None:
    nvr_cameras = await orm.Camera.get_cameras(
        session, query_config=CamerasQueryConfig(nvr_uuids={nvr_uuid})
    )
    all_cameras_mac_addresses = {camera.camera.mac_address for camera in nvr_cameras}
    offline_mac_addresses = all_cameras_mac_addresses - online_camera_mac_addresses

    recent_downtimes = await orm.CameraDowntime.get_most_recent_downtimes_by_mac(
        session, offline_mac_addresses
    )

    active_downtimes = {
        mac: downtime
        for mac, downtime in recent_downtimes.items()
        if (
            current_time - downtime.downtime_end < CAMERA_DOWNTIME_WINDOW_RESET_INTERVAL
        )
    }

    await orm.CameraDowntime.update_camera_downtimes(
        session,
        updates=[
            camera_downtime_models.UpdateCameraDowntimeWithId(
                downtime_id=downtime.id, downtime_end=current_time
            )
            for downtime in active_downtimes.values()
        ],
    )
    macs_without_active_downtime = offline_mac_addresses - active_downtimes.keys()
    await orm.CameraDowntime.add_camera_downtimes(
        session,
        inserts=[
            camera_downtime_models.AddCameraDowntime(
                camera_mac_address=mac_address,
                downtime_start=current_time,
                downtime_end=current_time,
            )
            for mac_address in macs_without_active_downtime
        ],
    )


async def update_nvr_kvs_connection_status(
    nvr_uuid: str,
    nvr_kvs_connection_status: NvrKvsConnectionStatusUpdate | None,
    value_store: ValueStore,
) -> None:
    if not nvr_kvs_connection_status or not nvr_kvs_connection_status.check_result:
        return

    await value_store.set_model(
        key=get_nvr_kvs_connection_status_key(nvr_uuid),
        model=NvrKvsConnectionStatus(
            exception_msg=nvr_kvs_connection_status.exception_msg,
            check_result=nvr_kvs_connection_status.check_result,
        ),
    )


async def batch_update_cameras_downtime(
    session: TenantAwareAsyncSession,
    nvr_uuid: str,
    batch_update_request: CameraHeartbeatBatchRequest,
) -> None:
    nvr_cameras = await orm.Camera.get_cameras(
        session, query_config=CamerasQueryConfig(nvr_uuids={nvr_uuid})
    )
    all_cameras_mac_addresses = {camera.camera.mac_address for camera in nvr_cameras}

    offline_camera_to_heartbeats: dict[str, list[AwareDatetime]] = {
        mac: [] for mac in all_cameras_mac_addresses
    }

    for batch_heartbeat in batch_update_request.batch_heartbeats:
        offline_mac_addresses = all_cameras_mac_addresses - set(
            batch_heartbeat.camera_mac_addresses
        )
        for mac in offline_mac_addresses:
            offline_camera_to_heartbeats[mac].append(batch_heartbeat.timestamp)

    # Remove empty items in offline_camera_to_heartbeats
    offline_camera_to_heartbeats = {
        mac: timestamps
        for mac, timestamps in offline_camera_to_heartbeats.items()
        if timestamps
    }

    offline_camera_recent_downtimes = (
        await orm.CameraDowntime.get_most_recent_downtimes_by_mac(
            session, set(offline_camera_to_heartbeats.keys())
        )
    )

    updates = []
    inserts = []
    for camera_mac_address, timestamp_history in offline_camera_to_heartbeats.items():
        db_most_recent_downtime = (
            None
            if camera_mac_address not in offline_camera_recent_downtimes
            else offline_camera_recent_downtimes[camera_mac_address].downtime_end
        )

        insert_operations, update_operation = await _merge_camera_heartbeats(
            camera_mac_address, timestamp_history, db_most_recent_downtime
        )

        if update_operation is not None:
            recent_downtime = offline_camera_recent_downtimes[camera_mac_address]
            updates.append(
                camera_downtime_models.UpdateCameraDowntimeWithId(
                    downtime_id=recent_downtime.id,
                    downtime_end=update_operation.downtime_end,
                )
            )
        if insert_operations:
            inserts.extend(insert_operations)

    if updates:
        logging.info(
            f"Batch: Updating {len(updates)} camera downtimes for NVR {nvr_uuid}"
        )
        await orm.CameraDowntime.update_camera_downtimes(session, updates=updates)

    if inserts:
        logging.info(
            f"Batch: Adding {len(inserts)} new camera downtimes for NVR {nvr_uuid}"
        )
        await orm.CameraDowntime.add_camera_downtimes(session, inserts=inserts)
