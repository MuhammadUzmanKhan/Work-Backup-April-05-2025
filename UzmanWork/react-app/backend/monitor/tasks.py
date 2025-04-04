import asyncio
import logging
from collections import defaultdict
from collections.abc import Coroutine
from dataclasses import dataclass
from datetime import timedelta
from typing import Any, Protocol

from backend import logging_config
from backend.constants import (
    CAMERA_ONLINE_TIMEOUT_FOR_ALERTS,
    DOWN_ALERT_BACKOFF,
    MIN_ENABLED_CAMERAS_DOWN_RATIO_TO_ALERT,
)
from backend.database import database, orm
from backend.database.models import CamerasQueryConfig, NvrsQueryConfig
from backend.email_sending import EmailClient
from backend.models import AccessRestrictions, CameraResponse
from backend.monitor.alert import AlertNVR, AlertSeverity
from backend.monitor.alert_types import AlertType
from backend.monitor.backend import check_backend_up, update_backend_last_seen
from backend.monitor.emails import devices_status_change_alert_email_contents
from backend.monitor.models import (
    CameraAlertOnlineStatus,
    CameraResponseWithAlertStates,
    CamerasToAlertResult,
    NvrAlertOnlineStatus,
    NVRResponseWithAlertStates,
    NvrsToAlertResult,
)
from backend.slack_client import SlackClient
from backend.utils import AwareDatetime
from backend.value_store.value_store import (
    ValueStore,
    get_camera_last_alerted_key,
    get_camera_last_alerted_status_key,
    get_nvr_last_alerted_key,
    get_nvr_last_alerted_status_key,
)

logger = logging.getLogger(logging_config.LOGGER_NAME)


class AlertMessage(Protocol):
    def send(self) -> Coroutine[Any, Any, None]: ...


@dataclass
class EmailAlertMessage:
    email_client: EmailClient
    recipients: list[str]
    subject: str
    content: str

    def send(self) -> Coroutine[Any, Any, None]:
        return self.email_client.send_html_email(
            recipients=self.recipients, subject=self.subject, content=self.content
        )


@dataclass
class SlackAlertMessage:
    slack_client: SlackClient
    alert: AlertNVR

    def send(self) -> Coroutine[Any, Any, None]:
        return self.slack_client.send_alert(self.alert)


def _create_alert_tasks(
    messages: list[AlertMessage],
) -> list[Coroutine[Any, Any, None]]:
    """
    Helper function to create all asyncio tasks for sending alerts (email, slack).
    """
    return [message.send() for message in messages]


def _create_nvr_alert_slack_messages(
    nvrs_to_alert: list[NVRResponseWithAlertStates], slack_client: SlackClient
) -> list[SlackAlertMessage]:
    # Create Slack message for each individual NVR with changed status.
    return [
        SlackAlertMessage(slack_client, AlertNVR.from_nvr(nvr)) for nvr in nvrs_to_alert
    ]


def _create_camera_alert_slack_messages(
    all_nvrs: list[NVRResponseWithAlertStates],
    nvrs_to_alert: list[NVRResponseWithAlertStates],
    cameras_to_alert: list[CameraResponseWithAlertStates],
    slack_client: SlackClient,
) -> list[SlackAlertMessage]:
    """Create Slack alerts for cameras with changed status.

    :param all_nvrs: list of all NVRs
    :param nvrs_to_alert: NVRs whose status recently changed and for which
        alerts are sent in the current cycle (-> e.g. NVRs who are offline for long
        would not show up here, but only in all_nvrs)
    :param cameras_to_alert: cameras whose status recently changed and for
        which we want to send alerts
    :param slack_client: Slack client to use
    :return: list of Slack messages
    """
    messages = []
    nvrs_dict = {nvr.uuid: nvr for nvr in all_nvrs}
    # Exclude faulty cameras from the list of cameras to send slack alert
    cameras_to_alert = [
        camera for camera in cameras_to_alert if not camera.camera.is_faulty
    ]
    # Group cameras with status changed by NVR and create Slack message for each NVR.
    cameras_to_alert_grouped_by_nvr = defaultdict(list)
    for camera in cameras_to_alert:
        cameras_to_alert_grouped_by_nvr[camera.camera.nvr_uuid].append(camera)

    alert_nvr_uuids = {nvr.uuid for nvr in nvrs_to_alert}
    for nvr_uuid, cameras_to_alert_one_nvr in cameras_to_alert_grouped_by_nvr.items():
        # If the NVR is offline, never send a CAMERA_DOWN alert
        # (as this is implied).
        if not nvrs_dict[nvr_uuid].is_online:
            continue

        # Similarly, if an NVR becomes online again, this implies
        # all cameras becoming online again, too -> we'd like to silence
        # these alerts. However, this would require more complex
        # logic, thus we check a weaker condition, which only holds
        # true for the current alert cycle: if the NVR just became
        # online, skip sending alerts for contained cameras.
        if nvr_uuid in alert_nvr_uuids:
            continue

        # Send camera down alert
        messages.append(
            SlackAlertMessage(
                slack_client, AlertNVR.from_cameras(cameras_to_alert_one_nvr, nvr_uuid)
            )
        )

    return messages


def _create_email_alert_message(
    all_nvrs: list[NVRResponseWithAlertStates],
    nvrs_to_alert: list[NVRResponseWithAlertStates],
    cameras_to_alert: list[CameraResponseWithAlertStates],
    email_client: EmailClient,
    subscribers: list[str],
) -> list[EmailAlertMessage]:
    nvrs_down = [nvr for nvr in nvrs_to_alert if not nvr.is_online]
    nvrs_up = [nvr for nvr in nvrs_to_alert if nvr.is_online]
    cameras_down = [
        camera for camera in cameras_to_alert if not camera.camera.is_online
    ]
    cameras_up = [camera for camera in cameras_to_alert if camera.camera.is_online]

    email_title = (
        "Alert: Coram AI System Health Changed"
        f" ({AwareDatetime.utcnow().strftime('%m/%d')})"
    )
    return [
        EmailAlertMessage(
            email_client,
            [recipient],
            email_title,
            devices_status_change_alert_email_contents(
                [nvr for nvr in all_nvrs if not nvr.is_online],
                nvrs_down,
                nvrs_up,
                cameras_down,
                cameras_up,
            ),
        )
        for recipient in subscribers
    ]


async def _alert_status_change(
    subscribers: list[str],
    nvrs: list[NVRResponseWithAlertStates],
    nvrs_to_alert: list[NVRResponseWithAlertStates],
    cameras_to_alert: list[CameraResponseWithAlertStates],
    email_client: EmailClient,
    slack_client: SlackClient,
) -> None:
    messages: list[AlertMessage] = []
    # Don't alert for devices with last alerted online status None -
    # which happens the first time a device is picked up here.
    nvrs_to_alert = [
        nvr for nvr in nvrs_to_alert if nvr.online_status_when_last_alerted is not None
    ]
    cameras_to_alert = [
        camera
        for camera in cameras_to_alert
        if camera.online_status_when_last_alerted is not None
    ]
    if not nvrs_to_alert and not cameras_to_alert:
        return

    nvr_str_list = [
        nvr.uuid + " (" + str(nvr.is_online) + ")" if nvr.uuid else "NONE"
        for nvr in nvrs_to_alert
    ]
    camera_str_list = [
        camera.camera.name + " (" + str(camera.camera.is_online) + ")"
        for camera in cameras_to_alert
    ]
    logging.info(
        "Creating system health status change alerts for NVRs: "
        f"{','.join(nvr_str_list)}, "
        f"cameras: {','.join(camera_str_list)}"
    )

    # Create Slack messages.
    messages.extend(_create_nvr_alert_slack_messages(nvrs_to_alert, slack_client))
    messages.extend(
        _create_camera_alert_slack_messages(
            all_nvrs=nvrs,
            nvrs_to_alert=nvrs_to_alert,
            cameras_to_alert=cameras_to_alert,
            slack_client=slack_client,
        )
    )

    messages.extend(
        _create_email_alert_message(
            all_nvrs=nvrs,
            nvrs_to_alert=nvrs_to_alert,
            cameras_to_alert=cameras_to_alert,
            email_client=email_client,
            subscribers=subscribers,
        )
    )

    tasks = _create_alert_tasks(messages)
    await asyncio.gather(*tasks)


async def _alert_overdue_devices(
    all_nvrs: list[NVRResponseWithAlertStates],
    nvrs_to_alert: list[NVRResponseWithAlertStates],
    cameras_to_alert: list[CameraResponseWithAlertStates],
    slack_client: SlackClient,
) -> None:
    # Don't alert for devices with last alerted time None -
    # which happens the first time a device is picked up here.
    nvrs_to_alert = [nvr for nvr in nvrs_to_alert if nvr.last_alert_time is not None]
    cameras_to_alert = [
        camera for camera in cameras_to_alert if camera.last_alert_time is not None
    ]

    nvr_str_list = [
        nvr.uuid + " (" + str(nvr.is_online) + ")" if nvr.uuid else "NONE"
        for nvr in nvrs_to_alert
    ]
    camera_str_list = [
        camera.camera.name + " (" + str(camera.camera.is_online) + ")"
        for camera in cameras_to_alert
    ]
    logging.info(
        "Creating system health overdue alerts for NVRs: "
        f"{','.join(nvr_str_list)}, "
        f"cameras: {','.join(camera_str_list)}"
    )

    messages: list[AlertMessage] = []
    if not nvrs_to_alert and not cameras_to_alert:
        return

    # Create Slack messages.
    messages.extend(_create_nvr_alert_slack_messages(nvrs_to_alert, slack_client))
    messages.extend(
        _create_camera_alert_slack_messages(
            all_nvrs=all_nvrs,
            nvrs_to_alert=nvrs_to_alert,
            cameras_to_alert=cameras_to_alert,
            slack_client=slack_client,
        )
    )

    tasks = _create_alert_tasks(messages)
    await asyncio.gather(*tasks)


async def _alert_and_update(
    subscribers_email: list[str],
    value_store: ValueStore,
    all_nvrs: list[NVRResponseWithAlertStates],
    nvrs_with_status_change: list[NVRResponseWithAlertStates],
    nvrs_with_overdue_alerts: list[NVRResponseWithAlertStates],
    cameras_with_status_change: list[CameraResponseWithAlertStates],
    cameras_with_overdue_alerts: list[CameraResponseWithAlertStates],
    email_client: EmailClient,
    slack_client: SlackClient,
) -> None:
    await _alert_status_change(
        subscribers_email,
        all_nvrs,
        nvrs_with_status_change,
        cameras_with_status_change,
        email_client,
        slack_client,
    )
    await value_store.set_multiple_models(
        {
            get_nvr_last_alerted_status_key(nvr.uuid): NvrAlertOnlineStatus(
                online_status_when_last_alerted=nvr.is_online,
                too_many_cameras_offline_when_last_alerted=(
                    nvr.too_many_cameras_offline
                ),
            )
            for nvr in nvrs_with_status_change
        }
    )
    await value_store.set_multiple_models(
        {
            get_camera_last_alerted_status_key(
                camera.camera.mac_address
            ): CameraAlertOnlineStatus(
                online_status_when_last_alerted=camera.camera.is_online
            )
            for camera in cameras_with_status_change
        }
    )

    # NOTE: it is now possible that some alerts are sent twice via slack,
    # due to both logics catching them - but since it's only slack we don't
    # care.
    time_now = AwareDatetime.utcnow()
    await _alert_overdue_devices(
        all_nvrs, nvrs_with_overdue_alerts, cameras_with_overdue_alerts, slack_client
    )
    await value_store.set_multiple_timestamps(
        {
            get_nvr_last_alerted_key(nvr.uuid): time_now
            for nvr in nvrs_with_overdue_alerts
        }
    )
    await value_store.set_multiple_timestamps(
        {
            get_camera_last_alerted_key(camera.camera.mac_address): time_now
            for camera in cameras_with_overdue_alerts
        }
    )


async def _collect_nvrs_with_alert_states(
    tenant: str, db: database.Database, value_store: ValueStore
) -> list[NVRResponseWithAlertStates]:
    async with db.tenant_session(tenant=tenant) as session:
        all_nvrs = await orm.NVR.get_nvrs(session, AccessRestrictions())
        nvr_uuid_to_online_camera_count = (
            await orm.Camera.system_get_nvrs_online_cameras_count(
                session, {nvr.uuid for nvr in all_nvrs}
            )
        )
    last_alert_times = await value_store.get_multiple_timestamps(
        [get_nvr_last_alerted_key(nvr.uuid) for nvr in all_nvrs]
    )
    online_status_when_last_alerted = await value_store.get_multiple_models(
        [get_nvr_last_alerted_status_key(nvr.uuid) for nvr in all_nvrs],
        NvrAlertOnlineStatus,
    )
    return [
        NVRResponseWithAlertStates.from_nvr_response(
            nvr,
            last_alert_time=last_alert_times.get(get_nvr_last_alerted_key(nvr.uuid)),
            online_status_when_last_alerted=(
                online_status.online_status_when_last_alerted
                if (
                    online_status := online_status_when_last_alerted.get(
                        get_nvr_last_alerted_status_key(nvr.uuid)
                    )
                )
                else None
            ),
            num_cameras_online=nvr_uuid_to_online_camera_count.get(nvr.uuid, 0),
            min_enabled_cameras_down_ratio_to_alert=(
                MIN_ENABLED_CAMERAS_DOWN_RATIO_TO_ALERT
            ),
            too_many_cameras_offline_when_last_alerted=(
                online_status.too_many_cameras_offline_when_last_alerted
                if (
                    online_status := online_status_when_last_alerted.get(
                        get_nvr_last_alerted_status_key(nvr.uuid)
                    )
                )
                else None
            ),
        )
        for nvr in all_nvrs
    ]


def _collect_nvrs_to_alert(
    all_nvrs_with_alert_states: list[NVRResponseWithAlertStates],
) -> NvrsToAlertResult:
    time_now = AwareDatetime.utcnow()
    # Get all NVRs whose status changed since the last alerting,
    # and which are offline and whose last alert was sent more than
    # DOWN_ALERT_BACKOFF ago.
    nvrs_with_status_change = []
    nvrs_with_overdue_alerts = []
    for nvr in all_nvrs_with_alert_states:
        if (
            nvr.online_status_when_last_alerted is None
            or nvr.is_online != nvr.online_status_when_last_alerted
            or nvr.too_many_cameras_offline_when_last_alerted is None
            or nvr.too_many_cameras_offline
            != nvr.too_many_cameras_offline_when_last_alerted
        ):
            nvrs_with_status_change.append(nvr)

        if nvr.last_alert_time is None or (
            (not nvr.is_online or nvr.too_many_cameras_offline)
            and time_now - nvr.last_alert_time > DOWN_ALERT_BACKOFF
        ):
            nvrs_with_overdue_alerts.append(nvr)

    return NvrsToAlertResult(
        all_nvrs=all_nvrs_with_alert_states,
        nvrs_with_status_change=nvrs_with_status_change,
        nvrs_with_overdue_alerts=nvrs_with_overdue_alerts,
    )


async def _collect_cameras_to_alert(
    tenant: str, db: database.Database, value_store: ValueStore
) -> CamerasToAlertResult:
    time_now = AwareDatetime.utcnow()
    async with db.tenant_session(tenant=tenant) as session:
        all_cameras = await orm.Camera.system_get_cameras(
            session,
            query_config=CamerasQueryConfig(
                exclude_disabled=True, online_threshold=CAMERA_ONLINE_TIMEOUT_FOR_ALERTS
            ),
        )
    last_alert_times = await value_store.get_multiple_timestamps(
        [
            get_camera_last_alerted_key(camera.camera.mac_address)
            for camera in all_cameras
        ]
    )
    online_status_when_last_alerted = await value_store.get_multiple_models(
        [
            get_camera_last_alerted_status_key(camera.camera.mac_address)
            for camera in all_cameras
        ],
        CameraAlertOnlineStatus,
    )
    all_cameras_with_alert_states = [
        CameraResponseWithAlertStates.from_camera_response(
            camera,
            last_alert_times.get(
                get_camera_last_alerted_key(camera.camera.mac_address)
            ),
            (
                online_status.online_status_when_last_alerted
                if (
                    online_status := online_status_when_last_alerted.get(
                        get_camera_last_alerted_status_key(camera.camera.mac_address)
                    )
                )
                else None
            ),
        )
        for camera in all_cameras
    ]

    # Get all cameras whose status changed since the last alerting,
    # and which are offline and whose last alert was sent more than
    # DOWN_ALERT_BACKOFF ago.
    cameras_with_status_change = []
    cameras_with_overdue_alerts = []
    for camera in all_cameras_with_alert_states:
        if (
            camera.online_status_when_last_alerted is None
            or camera.camera.is_online != camera.online_status_when_last_alerted
        ):
            cameras_with_status_change.append(camera)

        if camera.last_alert_time is None or (
            not camera.camera.is_online
            and time_now - camera.last_alert_time > DOWN_ALERT_BACKOFF
        ):
            cameras_with_overdue_alerts.append(camera)

    return CamerasToAlertResult(
        cameras_with_status_change=cameras_with_status_change,
        cameras_with_overdue_alerts=cameras_with_overdue_alerts,
    )


async def update_backend_status(
    value_store: ValueStore, domain: str, backend_exposed_port: int
) -> None:
    backend_online = await check_backend_up(domain, backend_exposed_port)

    if backend_online:
        await update_backend_last_seen(value_store, AwareDatetime.utcnow())


async def check_org_health(
    tenant: str,
    db: database.Database,
    value_store: ValueStore,
    email_client: EmailClient,
    slack_client: SlackClient,
) -> None:
    # Send alerts for all devices (NVRs + cameras) in an org if:
    # - last alerted status differs from the current status (via email + slack)
    # - last alert was sent more than DOWN_ALERT_BACKOFF ago (via slack)
    cameras_to_alert_result = await _collect_cameras_to_alert(tenant, db, value_store)
    nvrs_to_alert_result = _collect_nvrs_to_alert(
        await _collect_nvrs_with_alert_states(tenant, db, value_store)
    )

    async with db.tenant_session(tenant=tenant) as session:
        subscribers_email = (
            await orm.OrganizationAlertSubscriber.get_organization_email_subscribers(
                session
            )
        )

    await _alert_and_update(
        subscribers_email,
        value_store,
        nvrs_to_alert_result.all_nvrs,
        nvrs_to_alert_result.nvrs_with_status_change,
        nvrs_to_alert_result.nvrs_with_overdue_alerts,
        cameras_to_alert_result.cameras_with_status_change,
        cameras_to_alert_result.cameras_with_overdue_alerts,
        email_client,
        slack_client,
    )


async def check_thumbnail_stream_health(
    db: database.Database, slack_client: SlackClient
) -> None:
    """Check the health of all thumbnail streams periodically"""

    async with db.session() as session:
        cameras = await orm.Camera.system_get_cameras_with_no_recent_thumbnails(
            session, time_threshold=timedelta(minutes=5)
        )
        nvrs = await orm.NVR.system_get_nvrs(session, NvrsQueryConfig())

    # Alert only if this camera is supposed to be online right now
    offline_nvr_uuids = {nvr.uuid for nvr in nvrs if not nvr.is_online}
    cameras_to_alert = [
        cam
        for cam in cameras
        if (
            cam.camera.nvr_uuid not in offline_nvr_uuids
            and cam.camera.is_online
            and not cam.camera.is_faulty
        )
    ]
    logger.info(f"Found {len(cameras_to_alert)} cameras with no recent thumbnails")

    # Send thumbnail alerts to Slack concurrently
    await asyncio.gather(
        *[
            _send_thumbnail_stream_slack_alert(cam, slack_client)
            for cam in cameras_to_alert
        ]
    )


async def _send_thumbnail_stream_slack_alert(
    cam_response: CameraResponse, slack_client: SlackClient
) -> None:
    await SlackAlertMessage(
        slack_client,
        AlertNVR(
            alert_type=AlertType.BACKEND_THUMBNAILS_DOWN,
            alert_severity=AlertSeverity.INFO,
            nvr_uuid=cam_response.camera.nvr_uuid,
            org_name=cam_response.org_name,
            detailed_info={
                "mac_address": cam_response.camera.mac_address,
                "organization": cam_response.org_name,
                "nvr_uuid": cam_response.camera.nvr_uuid,
            },
        ),
    ).send()
