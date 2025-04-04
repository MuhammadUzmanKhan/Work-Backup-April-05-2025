import asyncio
import logging
from datetime import timedelta
from typing import Callable

from pydantic import EmailStr
from sqlalchemy.ext.asyncio import AsyncSession

from backend import envs, logging_config
from backend.alert.alert_models import (
    AlertOccurrenceBase,
    FaceAlertsSendRequest,
    LicensePlateAlertsSendRequest,
)
from backend.alert.alert_sending import (
    format_alert_video_message,
    send_analytics_alert_email,
    send_shared_video_email,
    send_sms,
)
from backend.alert.constants import ALERT_USER_NAME
from backend.alert.errors import AlertNotificationError, MemberNotifyError, TooSoonError
from backend.constants import (
    ALERT_CHECK_DELAY_TO_WAIT_FOR_PCP,
    ALERT_CHECK_MAX_INTERVAL_SECONDS,
    ALERT_CHECK_MIN_INTERVAL_SECONDS,
    ALERT_VIDEO_END_TIME_OFFSET,
    ALERT_VIDEO_EXPIRATION_DURATION,
    ALERT_VIDEO_START_TIME_OFFSET,
    DO_NOT_ENTER_ALERT_MAX_DURATION,
    DO_NOT_ENTER_ALERT_MIN_NUM_DETECTIONS,
    DO_NOT_ENTER_ALERT_MIN_NUM_MOVING_DETECTIONS,
    IDLE_ALERT_CHECK_INTERVAL_SECONDS,
    IDLE_ALERT_MAX_DURATION,
    MIN_CONFIDENCE_THRESHOLD,
    MIN_PROCESS_SECONDS_TO_ALERT,
)
from backend.database import database, models, orm
from backend.database.orm import orm_perception, orm_user_alert
from backend.db_utils import get_org_name_or_unknown
from backend.dependencies import (
    get_backend_database,
    get_backend_envs,
    get_email_client,
    get_sms_client,
    get_value_store,
)
from backend.email_sending import EmailClient, EmailException
from backend.models import UserAlertWithStreamName
from backend.monitor.alert import AlertSeverity
from backend.monitor.alert_types import AlertType
from backend.perception.models import AlertDetectionsInterval
from backend.scoped_timer import Timer
from backend.shared_video_utils import (
    VideoClipRequestError,
    create_or_retrieve_video_clip,
    create_shared_video,
)
from backend.slack_client import SlackClient, send_slack_alert_for_errors
from backend.sms_sending import SMSClient, SMSException
from backend.utils import AwareDatetime
from backend.value_store import ValueStore
from backend.value_store.value_store import get_user_alert_last_run_key

logger = logging.getLogger(logging_config.LOGGER_NAME)


async def _maybe_create_user_alert_from_detection_intervals(
    session: AsyncSession,
    now: AwareDatetime,
    alert_trigger_type: models.TriggerType,
    pcp_alert_results: list[AlertDetectionsInterval],
) -> None:
    """
    Handles alert creation, extension and closing logic given new
    detection intervals, and existing alert status.
    """
    cameras_to_active_alerts = (
        await orm_user_alert.UserAlert.system_get_settings_with_active_alerts(
            session, alert_trigger_type
        )
    )
    # For each camera find the alert_setting which has alerts detected
    # in the last period and not closed yet.
    setting_ids_with_active_alert = set()
    for active_alerts in cameras_to_active_alerts.values():
        setting_ids_with_active_alert.update(active_alerts.setting_ids)

    # Set the maximum duration of the active alert to avoid creating new alerts
    # too often.
    if alert_trigger_type == models.TriggerType.IDLING:
        setting_id_to_idle_alert_config = (
            await (
                orm_user_alert.UserAlertSetting.system_get_idling_alert_configurations(
                    session, setting_ids_with_active_alert
                )
            )
        )
        setting_id_to_alert_max_duration = {
            setting_id: IDLE_ALERT_MAX_DURATION + timedelta(seconds=min_idle_dur_s)
            for setting_id, min_idle_dur_s in setting_id_to_idle_alert_config.items()
        }
    else:
        setting_id_to_alert_max_duration = {
            setting_id: DO_NOT_ENTER_ALERT_MAX_DURATION
            for setting_id in setting_ids_with_active_alert
        }

    # Handle the detected alerts
    for alert_interval in pcp_alert_results:
        # TODO(@lberg): Fix this stuff by adding the tenant (likely from the camera)

        # New detection and the alert is considered active in the
        # last period.
        if alert_interval.alert_setting_id in setting_ids_with_active_alert:
            # An alert is already active. Try close and create a new alert if
            # current alert duration is too long, otherwise update end time
            # of the alert.
            logger.info(
                "Events detected on active alert at setting "
                f"{alert_interval.alert_setting_id}, from {alert_interval.start_time}"
                f" to {alert_interval.end_time}. "
            )
            alert_max_duration = setting_id_to_alert_max_duration[
                alert_interval.alert_setting_id
            ]
            await orm.UserAlert.system_try_close_and_maybe_new_active_alert(
                session,
                alert_interval.camera_mac_address,
                now,
                alert_interval.alert_setting_id,
                (alert_interval.start_time, alert_interval.end_time),
                alert_max_duration.seconds,
                alert_interval.tenant,
            )

        else:
            # Detected events but no active alert found, create a new one.
            new_alert = models.UserAlertCreate(
                setting_id=alert_interval.alert_setting_id,
                start_time=alert_interval.start_time,
                end_time=alert_interval.end_time,
                is_active=True,
            )
            await orm.UserAlert.system_new_alert(
                session, new_alert, alert_interval.tenant
            )
            logger.info(
                "Create new alert alert setting "
                f"{alert_interval.alert_setting_id} for "
                f"camera: {alert_interval.camera_mac_address}"
            )

    # Handle the alerts that are active but no detection found in this query interval.
    alert_setting_to_detection_interval = {}
    for alert_interval in pcp_alert_results:
        alert_setting_to_detection_interval[alert_interval.alert_setting_id] = (
            alert_interval
        )

    # TODO: can this be done in bulk?
    for mac_address, alert_settings in cameras_to_active_alerts.items():
        # The alert is considered active in the last period, and no
        # latest detection
        for alert_setting_id in alert_settings.setting_ids:
            if alert_setting_id not in alert_setting_to_detection_interval:
                alert_max_duration = setting_id_to_alert_max_duration[alert_setting_id]
                # Try close the active alert. Will close if idle for long enough.
                await orm.UserAlert.system_try_close_and_maybe_new_active_alert(
                    session,
                    mac_address,
                    now,
                    alert_setting_id,
                    None,
                    alert_max_duration.seconds,
                    alert_settings.tenant,
                )


def _get_idling_extra_query_time() -> timedelta:
    extra_query_time = timedelta(seconds=IDLE_ALERT_CHECK_INTERVAL_SECONDS * 2)
    return extra_query_time


def _get_do_not_enter_extra_query_time(
    last_run: AwareDatetime | None, now: AwareDatetime
) -> timedelta:
    if last_run is None or last_run < now - timedelta(
        seconds=ALERT_CHECK_MAX_INTERVAL_SECONDS
    ):
        interval_start = now - timedelta(seconds=ALERT_CHECK_MAX_INTERVAL_SECONDS)
        logger.warning(
            f"{models.TriggerType.DO_NOT_ENTER}: Last run {last_run} is too long "
            f"ago, now: {now}. Reset the last run to {interval_start}."
        )
    else:
        interval_start = last_run
    extra_query_time = now - interval_start
    return extra_query_time


def _get_extra_query_time(
    last_run: AwareDatetime | None,
    now: AwareDatetime,
    alert_trigger_type: models.TriggerType,
) -> timedelta:
    """Get the extra query time for the alert check.
    For the do not enter alert:
     Query the detection results between last_run and now
    For the idling alert:
     Query the detection results between [now-IDLE_ALERT_CHECK_INTERVAL_SECONDS*2, now]
    Raise too soon error if the last run is too recent.
    """
    if last_run is not None and last_run > now - timedelta(
        seconds=ALERT_CHECK_MIN_INTERVAL_SECONDS
    ):
        logger.info(
            "User alerts check triggered too soon for "
            f"{alert_trigger_type}. {now=}, {last_run=}."
        )
        raise TooSoonError

    extra_query_time = (
        _get_idling_extra_query_time()
        if alert_trigger_type == models.TriggerType.IDLING
        else _get_do_not_enter_extra_query_time(last_run, now)
    )
    return extra_query_time


async def _get_user_alert_last_run_time(
    value_store: ValueStore, alert_trigger_type: models.TriggerType
) -> AwareDatetime | None:
    last_run = await value_store.get_timestamp(
        get_user_alert_last_run_key(alert_trigger_type.value)
    )
    return last_run


async def _set_user_alert_last_run_time(
    value_store: ValueStore, alert_trigger_type: models.TriggerType, time: AwareDatetime
) -> None:
    await value_store.set_timestamp(
        key=get_user_alert_last_run_key(alert_trigger_type.value),
        time=time,
        expiration=None,
    )


async def _handle_pcp_alerts(
    session: AsyncSession,
    value_store: ValueStore,
    now: AwareDatetime,
    alert_trigger_type: models.TriggerType,
) -> None:
    """Match user alerts with the perception detection results in the last
    interval.
    """
    start_time = AwareDatetime.utcnow()
    last_run = await _get_user_alert_last_run_time(value_store, alert_trigger_type)
    extra_query_time = _get_extra_query_time(last_run, now, alert_trigger_type)

    # Get the enabled alert settings of specified trigger type, for all enabled cameras.
    # Filter out the alert settings that are not activated at the current time.
    (active_alert_setting_ids, active_camera_mac_addresses) = (
        await orm.UserAlertSetting.system_get_active_alert_settings(
            session, query_time=now, trigger_type=alert_trigger_type
        )
    )

    if len(active_alert_setting_ids) == 0:
        logger.info(
            f"No active camera found for {alert_trigger_type} alert check at {now}."
        )
        await _set_user_alert_last_run_time(value_store, alert_trigger_type, now)
        return

    logging.info(
        f"Found a set of alert settings  of type {alert_trigger_type} "
        f"and active at {now}: {active_alert_setting_ids}."
    )

    if alert_trigger_type == models.TriggerType.IDLING:
        pcp_alert_results = (
            await orm_perception.PerceptionObjectEvent.system_get_idling_alerts(
                session,
                MIN_CONFIDENCE_THRESHOLD,
                active_alert_setting_ids,
                active_camera_mac_addresses,
                now,
                extra_query_time=extra_query_time,
            )
        )
    else:
        pcp_alert_results = (
            await orm_perception.PerceptionObjectEvent.system_get_do_not_enter_alerts(
                session,
                MIN_CONFIDENCE_THRESHOLD,
                active_alert_setting_ids,
                active_camera_mac_addresses,
                now,
                min_num_detections=DO_NOT_ENTER_ALERT_MIN_NUM_DETECTIONS,
                min_num_moving_detections=DO_NOT_ENTER_ALERT_MIN_NUM_MOVING_DETECTIONS,
                extra_query_time=extra_query_time,
            )
        )

    # Check how long the query took.
    query_interval = AwareDatetime.utcnow() - start_time
    log_msg = (
        f"Query {alert_trigger_type} user alerts took "
        f"{query_interval.total_seconds()} seconds with "
        f"{extra_query_time.total_seconds()} extra query seconds. "
    )
    if query_interval > timedelta(seconds=MIN_PROCESS_SECONDS_TO_ALERT):
        log_msg += f" The query start time is {now}. "
        logger.warning(log_msg)
    else:
        logger.info(log_msg)

    logger.info(
        f"Found {len(pcp_alert_results)} alert intervals for {alert_trigger_type}"
    )

    await _maybe_create_user_alert_from_detection_intervals(
        session,
        now=now,
        alert_trigger_type=alert_trigger_type,
        pcp_alert_results=pcp_alert_results,
    )

    await _set_user_alert_last_run_time(value_store, alert_trigger_type, now)


async def match_user_alerts(alert_trigger_type: models.TriggerType) -> None:
    """Match user alerts with the perception detection results in the last
    interval."""
    db: database.Database = get_backend_database()
    email_client: EmailClient = get_email_client()
    sms_client: SMSClient = get_sms_client()
    now: AwareDatetime = AwareDatetime.utcnow()
    backend_env: envs.BackendEnvs = get_backend_envs()
    value_store: ValueStore = get_value_store()

    # Process alerts with a 5 seconds delay to make sure the detection results
    # are ready.
    delayed_now = now - timedelta(seconds=ALERT_CHECK_DELAY_TO_WAIT_FOR_PCP)

    async with db.session(session_type=database.SessionType.SLOW_QUERY) as session:
        await _handle_pcp_alerts(session, value_store, delayed_now, alert_trigger_type)
        setting_to_alerts = await orm.UserAlert.system_get_alert_list_to_send(
            session, alert_trigger_type
        )

    # returns a list of urls which 1-1 maps setting_to_alerts.keys()
    settings_id_with_urls = await _request_alert_video_clips(
        setting_to_alerts, backend_env.web_app_url, db, email_client, sms_client
    )

    async with db.session() as session:
        await orm.UserAlert.system_update_alert_send_time(
            session=session, settings_id=settings_id_with_urls, alert_sent_time=now
        )


async def _request_alert_video_clip(
    alert: UserAlertWithStreamName,
    web_app_url: str,
    db: database.Database,
    email_client: EmailClient,
    sms_client: SMSClient,
) -> None:
    if alert.mac_address is None:
        raise ValueError("Mac address is None.")

    clip_data = await create_or_retrieve_video_clip(
        clip_data_metadata=models.ClipDataCreate(
            mac_address=alert.mac_address,
            start_time=UserAlertWithStreamName.clip_start_time(alert.user_alert),
            end_time=UserAlertWithStreamName.clip_end_time(alert.user_alert),
            creation_time=AwareDatetime.utcnow(),
        ),
        db=db,
        tenant=alert.tenant,
    )

    async with db.tenant_session(tenant=alert.tenant) as session:
        shared_video = await create_shared_video(
            session=session,
            shared_video_data=models.SharedVideoCreate(
                email_address=(
                    EmailStr(alert.email) if alert.email is not None else None
                ),
                phone_number=alert.phone,
                user_name=ALERT_USER_NAME,
                clip_id=clip_data.id,
                expiration_time=AwareDatetime.utcnow()
                + ALERT_VIDEO_EXPIRATION_DURATION,
            ),
        )

    await _share_alert_video(
        alert, shared_video, ALERT_USER_NAME, web_app_url, email_client, sms_client
    )


async def _request_alert_video_clips(
    setting_to_alerts: dict[int, UserAlertWithStreamName],
    web_app_url: str,
    db: database.Database,
    email_client: EmailClient,
    sms_client: SMSClient,
) -> list[int]:
    """Request video clips for each alert."""
    settings_id = list(setting_to_alerts.keys())
    # Ask for return on exceptions s.t. we can gather results from all the other
    # successful tasks.
    clip_request_results = await asyncio.gather(
        *[
            _request_alert_video_clip(
                setting_to_alerts[setting_id], web_app_url, db, email_client, sms_client
            )
            for setting_id in settings_id
        ],
        return_exceptions=True,
    )

    for clip_result in clip_request_results:
        if isinstance(clip_result, Exception):
            logger.error(f"RequestAlertVideoClip caught exception: {clip_result}")

    # return the list of setting ids that have a clip url
    # for the tasks return None, alert are not be sent, upstream
    # can schedule to try it again.
    settings_id_with_urls = [
        settings_id[i]
        for i in range(len(clip_request_results))
        if not isinstance(clip_request_results[i], Exception)
    ]
    return settings_id_with_urls


async def _share_alert_video(
    user_alert_to_send: UserAlertWithStreamName,
    shared_video: models.SharedVideo,
    user_name: str,
    web_app_url: str,
    email_client: EmailClient,
    sms_client: SMSClient,
) -> None:
    """Share the alert video to the user.
    :param user_alert_to_send: The object contains detailed info
           on the alert to share.
    :param shared_video: The shared video object.
    :param user_name: The name of the user who shares the video.
    :param web_app_url: The url of the web app.
    :param email_client: The email client.
    :param sms_client: The sms client.
    """

    if user_alert_to_send.email:
        await send_shared_video_email(
            email_client,
            format_alert_video_message(
                user_alert=user_alert_to_send,
                web_app_url=web_app_url,
                unique_shared_video_hash=str(shared_video.unique_hash),
                expiration_dur=ALERT_VIDEO_EXPIRATION_DURATION,
                email=True,
            ),
            user_name=user_name,
            email_address=user_alert_to_send.email,
        )
    if user_alert_to_send.phone:
        await send_sms(
            sms_client,
            format_alert_video_message(
                user_alert=user_alert_to_send,
                web_app_url=web_app_url,
                unique_shared_video_hash=str(shared_video.unique_hash),
                expiration_dur=ALERT_VIDEO_EXPIRATION_DURATION,
                email=False,
            ),
            phone_number=user_alert_to_send.phone,
        )


async def send_alerts_notifications(
    alerts_request: FaceAlertsSendRequest | LicensePlateAlertsSendRequest,
    db: database.Database,
    email_client: EmailClient,
    sms_client: SMSClient,
    slack_client: SlackClient,
    value_store: ValueStore,
    web_app_url: str,
) -> list[AlertNotificationError]:
    results = await asyncio.gather(
        *[
            _send_alert_notifications(
                alert_occurrence=alert_occurrence,
                db=db,
                email_client=email_client,
                sms_client=sms_client,
                web_app_url=web_app_url,
                slack_client=slack_client,
                tenant=alerts_request.tenant,
            )
            for alert_occurrence in alerts_request.alert_occurrences
        ],
        return_exceptions=True,
    )

    errors = []
    for idx, result in enumerate(results):
        if isinstance(result, AlertNotificationError):
            errors.append(result)
            continue
        elif isinstance(result, Exception):
            raise result

        alert = alerts_request.alert_occurrences[idx]
        await value_store.set_timestamp(
            key=alert.value_store_key,
            time=AwareDatetime.utcnow(),
            expiration=alert.get_alert_cooldown_duration(),
        )
    return errors


async def _send_alert_notifications(
    alert_occurrence: AlertOccurrenceBase,
    db: database.Database,
    email_client: EmailClient,
    sms_client: SMSClient,
    slack_client: SlackClient,
    tenant: str,
    web_app_url: str,
) -> None:
    try:
        with Timer() as clip_creation_timer:
            clip_data = await create_or_retrieve_video_clip(
                clip_data_metadata=models.ClipDataCreate(
                    mac_address=alert_occurrence.mac_address,
                    start_time=alert_occurrence.occurrence_time
                    - ALERT_VIDEO_START_TIME_OFFSET,
                    end_time=alert_occurrence.occurrence_time
                    + ALERT_VIDEO_END_TIME_OFFSET,
                    creation_time=AwareDatetime.utcnow(),
                ),
                db=db,
                tenant=tenant,
            )
    except VideoClipRequestError as e:
        raise AlertNotificationError(
            f"Error creating video clip for {alert_occurrence=}: {e}"
        )

    with Timer() as shared_video_creation_timer:
        async with db.tenant_session(tenant=tenant) as session:
            video_clip = await create_shared_video(
                session=session,
                shared_video_data=models.SharedVideoCreate(
                    user_name=ALERT_USER_NAME,
                    clip_id=clip_data.id,
                    expiration_time=AwareDatetime.utcnow()
                    + ALERT_VIDEO_EXPIRATION_DURATION,
                ),
            )

    with Timer() as notification_timer:
        notification_errors = await _notify_members(
            notification_members=alert_occurrence.all_members_to_notify,
            format_alert_message=alert_occurrence.get_format_alert_message(
                web_app_url=web_app_url,
                unique_shared_video_hash=str(video_clip.unique_hash),
            ),
            email_subject=alert_occurrence.get_email_subject(),
            email_client=email_client,
            sms_client=sms_client,
        )
    # If we failed to send notifications, send a slack alert
    if notification_errors:
        await send_slack_alert_for_errors(
            errors=notification_errors,
            alert_type=AlertType.MEMBER_NOTIFY_FAILED,
            alert_severity=AlertSeverity.WARNING,
            slack_client=slack_client,
            resource_description=f"alert profile {alert_occurrence.profile_id}",
            org_name=await get_org_name_or_unknown(db, tenant),
        )

    logger.info(
        f"Video clip creation took {clip_creation_timer.duration():.2f} s, "
        f"shared video creation took {shared_video_creation_timer.duration():.2f} s,"
        f"sending notifications took {notification_timer.duration():.2f} s,"
    )


async def _notify_members(
    notification_members: list[models.NotificationGroupMember],
    format_alert_message: Callable[..., str],
    email_subject: str,
    email_client: EmailClient,
    sms_client: SMSClient,
) -> list[MemberNotifyError]:
    """Notify members of a notification group by email and/or sms."""
    tasks = []
    errors = []
    for notification_member in notification_members:
        if notification_member.email_address:
            tasks.append(
                asyncio.create_task(
                    send_analytics_alert_email(
                        email_client=email_client,
                        recipient=str(notification_member.email_address),
                        content=format_alert_message(email=True),
                        subject=email_subject,
                    )
                )
            )
        if notification_member.phone_number:
            tasks.append(
                asyncio.create_task(
                    send_sms(
                        sms_client=sms_client,
                        phone_number=notification_member.phone_number,
                        content=format_alert_message(email=False),
                    )
                )
            )

    results = await asyncio.gather(*tasks, return_exceptions=True)
    for notification_member, result in zip(notification_members, results):
        if isinstance(result, EmailException):
            errors.append(
                MemberNotifyError(
                    f"Failed to send email to {notification_member.email_address}:"
                    f" {result}"
                )
            )
        elif isinstance(result, SMSException):
            errors.append(
                MemberNotifyError(
                    f"Failed to send sms to {notification_member.phone_number}:"
                    f" {result}"
                )
            )
        elif isinstance(result, Exception):
            raise result
    return errors
