import os
from datetime import timedelta, timezone
from typing import Any

import aiofiles.os
from celery import Celery
from celery.schedules import crontab, schedule

from backend.alert.errors import TooSoonError
from backend.alert.tasks import match_user_alerts
from backend.constants import (
    ALERT_CHECK_INTERVAL_SECONDS,
    IDLE_ALERT_CHECK_INTERVAL_SECONDS,
    STATIC_CLIPS_PATH,
    STORED_CLIPS_REMOVAL_DELTA,
)
from backend.database import models, orm
from backend.database_management.partitions_tasks import (
    move_data_from_default_partitions,
    run_partitions_maintenance,
)
from backend.dependencies import (
    get_backend_database,
    get_backend_envs,
    get_boto_session_maker,
    get_email_client,
    get_slack_client,
    get_value_store,
)
from backend.monitor.alert import Alert, AlertSeverity
from backend.monitor.alert_types import AlertType
from backend.monitor.backend import check_backend_online
from backend.monitor.tasks import (
    check_org_health,
    check_thumbnail_stream_health,
    update_backend_status,
)
from backend.organizations.tasks import send_slack_alert_for_over_licensed_orgs
from backend.retention_management.face_occurrences import (
    enforce_face_occurrences_retention,
)
from backend.retention_management.license_plate_detections import (
    enforce_license_plate_detections_retention,
)
from backend.retention_management.mct_images import enforce_mct_images_retention
from backend.retention_management.perception_events import (
    enforce_perception_cameras_partition_retention,
)
from backend.retention_management.thumbnails import enforce_thumbnails_retention
from backend.slack_client import send_slack_alert_for_errors
from backend.task_worker.celery_instance import celery_app, logger
from backend.task_worker.utils import (
    async_task,
    skip_task_if_env_match,
    skip_task_if_feature_flag_disabled,
)
from backend.utils import AwareDatetime


@celery_app.on_after_configure.connect()
def setup_periodic_tasks(sender: Celery, **kwargs: Any) -> None:
    logger.info("Setting up periodic tasks")
    sender.add_periodic_task(
        schedule(timedelta(minutes=5)), periodic_check_system_health.s()
    )
    sender.add_periodic_task(
        schedule(timedelta(seconds=30)), periodic_update_backend_status.s()
    )
    sender.add_periodic_task(
        schedule(timedelta(minutes=5)), periodic_check_thumbnail_stream_health.s()
    )
    sender.add_periodic_task(schedule(timedelta(minutes=15)), remove_unused_groups.s())
    sender.add_periodic_task(schedule(timedelta(hours=1)), remove_old_clips.s())
    sender.add_periodic_task(
        schedule(timedelta(seconds=IDLE_ALERT_CHECK_INTERVAL_SECONDS)),
        periodic_match_idling_alerts.s(),
    )
    sender.add_periodic_task(
        schedule(timedelta(seconds=ALERT_CHECK_INTERVAL_SECONDS)),
        periodic_match_do_not_enter_alerts.s(),
    )
    sender.add_periodic_task(
        crontab(hour=4, minute=15), periodic_enforce_perception_events_retention.s()
    )
    sender.add_periodic_task(
        crontab(hour=4, minute=30), periodic_move_data_from_default_partitions.s()
    )
    sender.add_periodic_task(
        crontab(hour=4, minute=45), periodic_run_partitions_maintenance.s()
    )
    sender.add_periodic_task(
        crontab(hour=[0, 10], minute=0), periodic_enforce_thumbnails_retention.s()
    )
    sender.add_periodic_task(
        crontab(hour=5, minute=15), periodic_enforce_face_occurrences_retention.s()
    )
    sender.add_periodic_task(
        crontab(hour=5, minute=30), periodic_enforce_mct_images_retention.s()
    )
    sender.add_periodic_task(
        crontab(hour=5, minute=45),
        periodic_enforce_license_plate_detections_retention.s(),
    )
    sender.add_periodic_task(
        crontab(hour=[12, 18], minute=0),
        periodic_send_slack_alert_for_over_licensed_orgs.s(),
    )


@celery_app.task()
@async_task()
async def periodic_check_system_health() -> None:
    db = get_backend_database()
    value_store = get_value_store()
    slack_client = get_slack_client()

    if not (await check_backend_online(value_store)):
        await slack_client.send_alert(
            Alert(
                alert_type=AlertType.BACKEND_DOWN,
                alert_severity=AlertSeverity.ERROR,
                detailed_info={"source": periodic_check_system_health.__name__},
            )
        )
        return

    async with db.session() as session:
        tenants = await orm.Organization.system_get_tenants(session)
    # submit a task for each tenant
    for tenant in tenants:
        check_org_health_task.delay(tenant)


@celery_app.task()
@async_task()
async def check_org_health_task(tenant: str) -> None:
    db = get_backend_database()
    value_store = get_value_store()
    email_client = get_email_client()
    slack_client = get_slack_client()
    await check_org_health(tenant, db, value_store, email_client, slack_client)


@celery_app.task()
@async_task()
async def periodic_check_thumbnail_stream_health() -> None:
    db = get_backend_database()
    slack_client = get_slack_client()
    await check_thumbnail_stream_health(db, slack_client)


@celery_app.task()
@async_task()
async def periodic_update_backend_status() -> None:
    value_store = get_value_store()
    envs = get_backend_envs()
    await update_backend_status(value_store, envs.domain, envs.backend_exposed_port)


@celery_app.task()
@async_task()
async def remove_unused_groups() -> None:
    db = get_backend_database()
    async with db.session() as session:
        tenants = await orm.Organization.system_get_tenants(session)

    for tenant in tenants:
        logger.info(f"Started removing unused groups for {tenant=}")
        async with db.tenant_session(tenant=tenant) as session:
            removed_count = await orm.CameraGroup.remove_unused_groups(session)
            if removed_count > 0:
                logger.info(f"Removed {removed_count} unused groups for {tenant=}")


@celery_app.task()
@async_task()
async def remove_old_clips() -> None:
    video_paths = STATIC_CLIPS_PATH.glob("*.mp4")
    time_now = AwareDatetime.utcnow()
    removed_clips = 0
    for video_path in video_paths:
        mtime = AwareDatetime.fromtimestamp(
            os.path.getmtime(video_path), tz=timezone.utc
        )
        if (time_now - mtime) > STORED_CLIPS_REMOVAL_DELTA:
            logger.info(f"Removing {video_path} lastly modified at {mtime}")
            removed_clips += 1
            await aiofiles.os.remove(video_path)


@celery_app.task()
@async_task()
async def periodic_match_idling_alerts() -> None:
    try:
        await match_user_alerts(models.TriggerType.IDLING)
    except TooSoonError:
        pass


@celery_app.task()
@async_task()
async def periodic_match_do_not_enter_alerts() -> None:
    try:
        await match_user_alerts(models.TriggerType.DO_NOT_ENTER)
    except TooSoonError:
        pass


@celery_app.task()
@skip_task_if_env_match(["dev"])
@skip_task_if_feature_flag_disabled(
    models.FeatureFlags.ENFORCE_PERCEPTION_RETENTION_ENABLED
)
@async_task()
async def periodic_enforce_perception_events_retention() -> None:
    db = get_backend_database()
    slack_client = get_slack_client()

    errors = await enforce_perception_cameras_partition_retention(db)
    if errors:
        await send_slack_alert_for_errors(
            errors=errors,
            alert_type=AlertType.RETENTION_ENFORCEMENT_RESOURCE_FAILED,
            alert_severity=AlertSeverity.WARNING,
            slack_client=slack_client,
            resource_description="perception_events",
            org_name=None,
        )


@celery_app.task()
@skip_task_if_env_match(["dev"])
@skip_task_if_feature_flag_disabled(
    models.FeatureFlags.ENFORCE_THUMBNAILS_RETENTION_ENABLED
)
@async_task(
    alert_type_on_fail=AlertType.RETENTION_ENFORCEMENT_TASK_FAILED,
    alert_severity_on_fail=AlertSeverity.WARNING,
)
async def periodic_enforce_thumbnails_retention() -> None:
    db, boto_session_maker = get_backend_database(), get_boto_session_maker()
    slack_client = get_slack_client()

    errors = await enforce_thumbnails_retention(
        db, boto_session_maker, AwareDatetime.utcnow()
    )
    if errors:
        await send_slack_alert_for_errors(
            errors=errors,
            alert_type=AlertType.RETENTION_ENFORCEMENT_RESOURCE_FAILED,
            alert_severity=AlertSeverity.WARNING,
            slack_client=slack_client,
            resource_description="thumbnails",
            org_name=None,
        )


@celery_app.task()
@skip_task_if_env_match(["dev"])
@skip_task_if_feature_flag_disabled(
    models.FeatureFlags.ENFORCE_FACE_OCCURRENCES_RETENTION_ENABLED
)
@async_task(
    alert_type_on_fail=AlertType.RETENTION_ENFORCEMENT_TASK_FAILED,
    alert_severity_on_fail=AlertSeverity.WARNING,
)
async def periodic_enforce_face_occurrences_retention() -> None:
    db, boto_session_maker = get_backend_database(), get_boto_session_maker()
    slack_client = get_slack_client()

    errors = await enforce_face_occurrences_retention(
        db, boto_session_maker, AwareDatetime.utcnow()
    )
    if errors:
        await send_slack_alert_for_errors(
            errors=errors,
            alert_type=AlertType.RETENTION_ENFORCEMENT_RESOURCE_FAILED,
            alert_severity=AlertSeverity.WARNING,
            slack_client=slack_client,
            resource_description="face_occurrences",
            org_name=None,
        )


@celery_app.task()
@skip_task_if_env_match(["dev"])
@skip_task_if_feature_flag_disabled(
    models.FeatureFlags.ENFORCE_MCT_IMAGES_RETENTION_ENABLED
)
@async_task(
    alert_type_on_fail=AlertType.RETENTION_ENFORCEMENT_TASK_FAILED,
    alert_severity_on_fail=AlertSeverity.WARNING,
)
async def periodic_enforce_mct_images_retention() -> None:
    db, boto_session_maker = get_backend_database(), get_boto_session_maker()
    slack_client = get_slack_client()

    errors = await enforce_mct_images_retention(
        db, boto_session_maker, AwareDatetime.utcnow()
    )
    if errors:
        await send_slack_alert_for_errors(
            errors=errors,
            alert_type=AlertType.RETENTION_ENFORCEMENT_RESOURCE_FAILED,
            alert_severity=AlertSeverity.WARNING,
            slack_client=slack_client,
            resource_description="mct_images",
            org_name=None,
        )


@celery_app.task()
@skip_task_if_env_match(["dev"])
@skip_task_if_feature_flag_disabled(
    models.FeatureFlags.ENFORCE_LICENSE_PLATE_DETECTIONS_RETENTION_ENABLED
)
@async_task(
    alert_type_on_fail=AlertType.RETENTION_ENFORCEMENT_TASK_FAILED,
    alert_severity_on_fail=AlertSeverity.WARNING,
)
async def periodic_enforce_license_plate_detections_retention() -> None:
    db, boto_session_maker = get_backend_database(), get_boto_session_maker()
    slack_client = get_slack_client()

    errors = await enforce_license_plate_detections_retention(
        db, boto_session_maker, AwareDatetime.utcnow()
    )
    if errors:
        await send_slack_alert_for_errors(
            errors=errors,
            alert_type=AlertType.RETENTION_ENFORCEMENT_RESOURCE_FAILED,
            alert_severity=AlertSeverity.WARNING,
            slack_client=slack_client,
            resource_description="license_plate",
            org_name=None,
        )


@celery_app.task()
@skip_task_if_env_match(["dev"])
@async_task(
    alert_type_on_fail=AlertType.PARTITION_TASK_FAILED,
    alert_severity_on_fail=AlertSeverity.WARNING,
)
async def periodic_move_data_from_default_partitions() -> None:
    db = get_backend_database()
    await move_data_from_default_partitions(db)


@celery_app.task()
@skip_task_if_env_match(["dev"])
@async_task(
    alert_type_on_fail=AlertType.PARTITION_TASK_FAILED,
    alert_severity_on_fail=AlertSeverity.WARNING,
)
async def periodic_run_partitions_maintenance() -> None:
    db = get_backend_database()
    await run_partitions_maintenance(db)


@celery_app.task()
@async_task()
async def periodic_send_slack_alert_for_over_licensed_orgs() -> None:
    db = get_backend_database()
    slack_client = get_slack_client()
    await send_slack_alert_for_over_licensed_orgs(db, slack_client)
