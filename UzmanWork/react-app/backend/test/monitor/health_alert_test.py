import datetime
from unittest.mock import Mock

from backend.database import database
from backend.database.models import CameraGroup
from backend.monitor.alert import AlertNVR, AlertSeverity
from backend.monitor.alert_types import AlertType
from backend.monitor.backend import update_backend_last_seen
from backend.monitor.models import NvrAlertOnlineStatus
from backend.monitor.tasks import check_org_health
from backend.test.factory_types import CameraFactory, LocationDefaultFactory, NVRFactory
from backend.test.monitor.common import AlertMatcher
from backend.utils import AwareDatetime
from backend.value_store.value_store import ValueStore, get_nvr_last_alerted_status_key


async def _set_nvr_last_alerted_status(
    value_store: ValueStore, nvr_uuid: str, status: bool
) -> None:
    await value_store.set_model(
        get_nvr_last_alerted_status_key(nvr_uuid),
        NvrAlertOnlineStatus.parse_obj(
            {
                "online_status_when_last_alerted": status,
                "too_many_cameras_offline_when_last_alerted": False,
            }
        ),
    )


async def test_system_health_alerts_nvr_status_true_to_false(
    db_instance: database.Database,
    value_store: ValueStore,
    slack_client_mock: Mock,
    email_client_mock: Mock,
    alert_subscribers: list[str],
    create_location_default: LocationDefaultFactory,
    create_nvr: NVRFactory,
) -> None:
    location = await create_location_default()
    nvr = await create_nvr(
        location.id, last_seen_time=AwareDatetime.utcnow() - datetime.timedelta(days=1)
    )

    await _set_nvr_last_alerted_status(value_store, nvr.uuid, status=True)
    await update_backend_last_seen(value_store, AwareDatetime.utcnow())

    await check_org_health(
        nvr.tenant, db_instance, value_store, email_client_mock, slack_client_mock
    )

    alert = AlertNVR(
        alert_type=AlertType.NVR_DOWN,
        alert_severity=AlertSeverity.INFO,
        nvr_uuid=nvr.uuid,
        org_name="OrgName",
    )
    slack_client_mock.send_alert.assert_called_once_with(AlertMatcher(alert))

    assert email_client_mock.send_html_email.call_count == len(alert_subscribers)
    called_emails = [
        call_arg.kwargs["recipients"][0]
        for call_arg in email_client_mock.send_html_email.call_args_list
    ]
    assert set(called_emails) == set(alert_subscribers)


async def test_system_health_alerts_nvr_status_false_to_true_cams(
    db_instance: database.Database,
    value_store: ValueStore,
    slack_client_mock: Mock,
    email_client_mock: Mock,
    alert_subscribers: list[str],
    create_location_default: LocationDefaultFactory,
    create_nvr: NVRFactory,
) -> None:
    location = await create_location_default()
    nvr = await create_nvr(
        location.id,
        last_seen_time=AwareDatetime.utcnow() - datetime.timedelta(minutes=1),
    )

    await _set_nvr_last_alerted_status(value_store, nvr.uuid, status=False)
    await update_backend_last_seen(value_store, AwareDatetime.utcnow())

    await check_org_health(
        nvr.tenant, db_instance, value_store, email_client_mock, slack_client_mock
    )

    alert = AlertNVR(
        alert_type=AlertType.NVR_UP,
        alert_severity=AlertSeverity.INFO,
        nvr_uuid=nvr.uuid,
        org_name="OrgName",
    )
    slack_client_mock.send_alert.assert_called_once_with(AlertMatcher(alert))

    assert email_client_mock.send_html_email.call_count == len(alert_subscribers)
    called_emails = [
        call_arg.kwargs["recipients"][0]
        for call_arg in email_client_mock.send_html_email.call_args_list
    ]
    assert set(called_emails) == set(alert_subscribers)


async def test_system_health_alerts_nvr_status_false_to_true_cams_off(
    db_instance: database.Database,
    value_store: ValueStore,
    slack_client_mock: Mock,
    email_client_mock: Mock,
    alert_subscribers: list[str],
    create_location_default: LocationDefaultFactory,
    create_nvr: NVRFactory,
    camera_group: CameraGroup,
    create_camera: CameraFactory,
) -> None:
    location = await create_location_default()
    nvr = await create_nvr(
        location.id,
        last_seen_time=AwareDatetime.utcnow() - datetime.timedelta(minutes=1),
    )
    # Make all cameras offline, so the most cameras down alert is triggered
    for _ in range(5):
        await create_camera(
            camera_group_id=camera_group.id, nvr_uuid=nvr.uuid, last_seen_time=None
        )

    await _set_nvr_last_alerted_status(value_store, nvr.uuid, status=False)
    await update_backend_last_seen(value_store, AwareDatetime.utcnow())

    await check_org_health(
        nvr.tenant, db_instance, value_store, email_client_mock, slack_client_mock
    )

    alert = AlertNVR(
        alert_type=AlertType.MOST_CAMERAS_DOWN,
        alert_severity=AlertSeverity.INFO,
        nvr_uuid=nvr.uuid,
        org_name="OrgName",
    )
    slack_client_mock.send_alert.assert_called_once_with(AlertMatcher(alert))

    assert email_client_mock.send_html_email.call_count == len(alert_subscribers)
    called_emails = [
        call_arg.kwargs["recipients"][0]
        for call_arg in email_client_mock.send_html_email.call_args_list
    ]
    assert set(called_emails) == set(alert_subscribers)


# TODO (oliverscheel): add tests for cameras
