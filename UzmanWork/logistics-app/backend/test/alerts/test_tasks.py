from unittest.mock import AsyncMock, Mock

from pytest_mock import MockerFixture

from backend.alert.alert_models import FaceAlertsSendRequest
from backend.alert.errors import AlertNotificationError
from backend.alert.tasks import send_alerts_notifications
from backend.database import database
from backend.database.models import ClipData
from backend.email_sending import EmailClient
from backend.slack_client import SlackClient
from backend.sms_sending import SMSClient
from backend.value_store.value_store import ValueStore


async def test_send_alerts_notifications_some_errors(
    db_instance: database.Database,
    value_store: ValueStore,
    email_client_mock: EmailClient,
    sms_client_mock: SMSClient,
    slack_client_mock: SlackClient,
    mocker: MockerFixture,
    face_alerts_request: FaceAlertsSendRequest,
) -> None:
    # simulate one of the notifications failing
    mocker.patch(
        "backend.alert.tasks._send_alert_notifications",
        new_callable=AsyncMock,
        # make only one fails
        side_effect=[None] * (len(face_alerts_request.alert_occurrences) - 1)
        + [AlertNotificationError()],
    )
    errors = await send_alerts_notifications(
        face_alerts_request,
        db_instance,
        email_client_mock,
        sms_client_mock,
        slack_client_mock,
        value_store,
        "",
    )
    assert len(errors) == 1


async def test_send_alerts_notifications(
    db_instance: database.Database,
    value_store: ValueStore,
    email_client_mock: Mock,
    sms_client_mock: Mock,
    slack_client_mock: SlackClient,
    mocker: MockerFixture,
    face_alerts_request: FaceAlertsSendRequest,
    clip_data: ClipData,
) -> None:
    mocker.patch(
        "backend.alert.tasks.create_or_retrieve_video_clip",
        new_callable=AsyncMock,
        return_value=clip_data,
    )
    errors = await send_alerts_notifications(
        face_alerts_request,
        db_instance,
        email_client_mock,
        sms_client_mock,
        slack_client_mock,
        value_store,
        "",
    )
    assert len(errors) == 0
    assert email_client_mock.send_support_email.call_count > 0
    assert sms_client_mock.send_sms.call_count > 0
