from __future__ import annotations

import datetime
import logging

import sqlalchemy as sa
from sqlalchemy import func, orm
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.sql import or_

from backend import logging_config
from backend.constants import (
    DO_NOT_ENTER_ALERT_MAX_DURATION,
    IDLE_ALERT_MAX_DURATION,
    MIN_ACTIVE_DURATION,
)
from backend.database import models
from backend.database.orm import (
    orm_camera_group,
    orm_location,
    orm_nvr,
    orm_organization,
)
from backend.database.orm.orm_camera import Camera
from backend.database.orm.orm_utils import Base, TenantProtectedTable
from backend.database.session import TenantAwareAsyncSession
from backend.models import UserAlertSettingResponse, UserAlertWithStreamName
from backend.utils import AwareDatetime

logger = logging.getLogger(logging_config.LOGGER_NAME)


class UserAlertException(Exception):
    pass


class UserAlertNotFoundException(UserAlertException):
    pass


DEFAULT_TRIGGER_TYPES = [
    models.UserAlertTriggerType(
        trigger_type=models.TriggerType.DO_NOT_ENTER,
        min_active_duration_s=int(MIN_ACTIVE_DURATION.total_seconds()),
        max_idle_duration_s=int(DO_NOT_ENTER_ALERT_MAX_DURATION.total_seconds()),
    ),
    models.UserAlertTriggerType(
        trigger_type=models.TriggerType.IDLING,
        min_active_duration_s=int(MIN_ACTIVE_DURATION.total_seconds()),
        max_idle_duration_s=int(IDLE_ALERT_MAX_DURATION.total_seconds()),
    ),
]


# TODO(@lberg): Is this used at all?
class UserAlertTriggerType(Base):
    # A setting defines the parameters to trigger an alert from pcp detections.
    __tablename__ = "user_alert_trigger_types"
    # Trigger type of the alert which 1-1 maps a setting for
    # {min_active_duration_s, max_idle_duration_s}
    trigger_type = sa.Column(sa.Enum(models.TriggerType), primary_key=True)
    # Minimum duration of an active event in seconds
    # If an event is shorter than min_active_duration_s and it is the only event
    # detected across max_idle_duration_s, it would be considered as false
    # positive alert, the corresponding Alert will be deleted.
    min_active_duration_s = sa.Column(sa.Integer, nullable=False)
    # Maximum idle duration of the Alert in seconds
    # For all the events detected within in max_idle_duration_s,
    # they should be considered as the same UserAlert.
    max_idle_duration_s = sa.Column(sa.Integer, nullable=False)

    @staticmethod
    async def new_user_alert_trigger_type(
        session: AsyncSession,
        trigger_type: models.TriggerType,
        min_active_duration_s: int,
        max_idle_duration_s: int,
    ) -> UserAlertTriggerType:
        """Add new user alert setting to the database."""
        trigger = UserAlertTriggerType(
            trigger_type=trigger_type,
            min_active_duration_s=min_active_duration_s,
            max_idle_duration_s=max_idle_duration_s,
        )
        session.add(trigger)
        return trigger

    @staticmethod
    async def get_user_alert_trigger_type(
        session: AsyncSession, trigger_type: models.TriggerType
    ) -> models.UserAlertTriggerType | None:
        result = (
            await session.execute(
                sa.select(UserAlertTriggerType).filter(
                    UserAlertTriggerType.trigger_type == trigger_type
                )
            )
        ).scalar_one_or_none()
        alert_trigger = (
            models.UserAlertTriggerType.from_orm(result) if result is not None else None
        )
        return alert_trigger


# A camera_mac_address can have multiple UserAlertSetting defined for it.
# For each UserAlertSetting, at any given time, there should be at most
# one UserAlert in active status.
#
# General life cycle of an UserAlert:
# creation: create an alert once seeing an pre-defined detection and no active
#           alert for the same setting, set the alert to be active.
# extension: set the alert to be active and extend the end time of the alert if
#            keep seeing new detections fired at the same alert_setting.
# closing:   close the alert if no detection and idled for more than max_idle_duration_s
#            seconds.
# deletion:  delete the alert if the detection range is too short and idled for more
#            than max_idle_duration_s seconds.
class UserAlertSetting(TenantProtectedTable):
    # A setting defines how perception detection events can trigger an alert.
    __tablename__ = "user_alert_settings"
    id: orm.Mapped[int] = sa.Column(sa.Integer, primary_key=True, autoincrement=True)
    # Optional user given name of the alert
    name = sa.Column(sa.String, nullable=True)
    # Mac address of the camera for which the alert is defined for
    camera_mac_address = sa.Column(
        sa.String, sa.ForeignKey("cameras.mac_address"), nullable=False
    )

    # Type of objects this alert is interested in
    detection_object_types = sa.Column(
        ARRAY(sa.Enum(models.DetectionObjectType), dimensions=1), nullable=False
    )
    # Region of interest as a polygon. Ignored if empty array. For unspecified
    # roi_polygon, the business logic should handle it accordingly.
    roi_polygon = sa.Column(ARRAY(sa.Float, dimensions=2), nullable=False)
    # Days of the week for which the alert is enabled
    days_of_week = sa.Column(
        ARRAY(sa.Enum(models.DayOfWeek), dimensions=1), nullable=False
    )
    # [start, end]_time defines the daily time range that the alert feature is on.
    start_time = sa.Column(sa.TIME(timezone=True), nullable=True)
    # [start, end]_time defines the daily time range that the alert feature is on.
    end_time = sa.Column(sa.TIME(timezone=True), nullable=True)
    # Email address to send the alert to
    email = sa.Column(sa.String, nullable=True)
    # Phone number to send the alert to
    phone = sa.Column(sa.String, nullable=True)
    # Whether the alert is enabled
    enabled = sa.Column(sa.Boolean, nullable=False)
    # User name of the creator of the alert setting
    # TODO(nedyalko): Make non-nullable after migration
    creator_name = sa.Column(sa.String, nullable=True)
    # The creation time of this alert setting
    # TODO(nedyalko): Make non-nullable after migration
    creation_time = sa.Column(sa.TIMESTAMP(timezone=True), nullable=True)
    # Alert setting for which the alert was triggered
    trigger_type = sa.Column(
        sa.Enum(models.TriggerType),
        sa.ForeignKey("user_alert_trigger_types.trigger_type"),
        nullable=True,
    )
    # The time in seconds that the camera has to be idling before an alert is triggered
    min_idle_duration_s = sa.Column(sa.Integer, nullable=True)
    __table_args__ = ((sa.ForeignKeyConstraint(["tenant"], ["organizations.tenant"])),)

    @staticmethod
    async def new_alert_setting(
        session: TenantAwareAsyncSession, alert_metadata: models.UserAlertSettingCreate
    ) -> UserAlertSetting:
        """Add new user alert setting to the database."""
        alert = UserAlertSetting(
            name=alert_metadata.name,
            camera_mac_address=alert_metadata.camera_mac_address,
            detection_object_types=list(alert_metadata.detection_object_types),
            roi_polygon=alert_metadata.roi_polygon,
            days_of_week=list(alert_metadata.days_of_week),
            start_time=alert_metadata.start_time,
            end_time=alert_metadata.end_time,
            email=alert_metadata.email,
            phone=alert_metadata.phone,
            enabled=alert_metadata.enabled,
            creator_name=alert_metadata.creator_name,
            creation_time=alert_metadata.creation_time,
            trigger_type=alert_metadata.trigger_type,
            min_idle_duration_s=alert_metadata.min_idle_duration_s,
            tenant=session.tenant,
        )
        session.add(alert)

        try:
            await session.flush()
        except sa.exc.IntegrityError as ex:
            raise UserAlertException(f"Failed to create alert setting: {ex}")

        return alert

    @staticmethod
    async def update_alert_setting(
        session: TenantAwareAsyncSession, alert_metadata: models.UserAlertSetting
    ) -> UserAlertSetting:
        """Add new user alert setting to the database.

        :param alert_metadata: Alert metadata.
        :return: The newly created alert setting.
        """
        alert_id = alert_metadata.id
        alert = await session.get(UserAlertSetting, alert_id)
        if alert is None:
            raise UserAlertNotFoundException(f"{alert_id=} not found")
        alert.name = alert_metadata.name
        alert.camera_mac_address = alert_metadata.camera_mac_address
        alert.detection_object_types = list(alert_metadata.detection_object_types)
        alert.roi_polygon = alert_metadata.roi_polygon
        alert.days_of_week = list(alert_metadata.days_of_week)
        alert.start_time = alert_metadata.start_time
        alert.end_time = alert_metadata.end_time
        alert.email = alert_metadata.email
        alert.phone = alert_metadata.phone
        alert.enabled = alert_metadata.enabled
        alert.creator_name = alert_metadata.creator_name
        alert.creation_time = alert_metadata.creation_time
        alert.trigger_type = alert_metadata.trigger_type
        alert.min_idle_duration_s = alert_metadata.min_idle_duration_s

        try:
            await session.flush()
        except sa.exc.IntegrityError as ex:
            raise UserAlertException(f"Failed to update alert setting: {ex}")

        return alert

    @staticmethod
    async def update_alert_setting_name(
        session: TenantAwareAsyncSession, setting_id: int, new_name: str
    ) -> None:
        """Update alert setting name.

        :param setting_id: ID of the setting to update.
        :param new_name: New name of the setting.
        """
        row_count = (
            await session.execute(
                sa.update(UserAlertSetting)
                .where(UserAlertSetting.id == setting_id)
                .values({UserAlertSetting.name: new_name})
            )
        ).rowcount  # type: ignore

        if row_count != 1:
            raise UserAlertNotFoundException(
                f"User Alert Settings with {setting_id=} not found"
            )

    @staticmethod
    async def delete_alert_settings(
        session: TenantAwareAsyncSession, settings_ids: list[int]
    ) -> None:
        """Delete alert settings.

        :param settings_ids: List of IDs to delete.
        """
        if len(settings_ids) == 0:
            return
        # Delete the alert settings
        delete_stmt = sa.delete(UserAlertSetting).where(
            UserAlertSetting.id.in_(settings_ids)
        )
        await session.execute(delete_stmt)

    @staticmethod
    async def _system_query_alert_settings(
        session: AsyncSession,
        camera_mac_addresses: set[str] | None = None,
        only_enabled: bool = True,
        trigger_type: models.TriggerType | None = None,
        include_trigger_thresholds: bool = False,
    ) -> list[UserAlertSettingResponse]:
        """Query for alert settings."""
        where_clauses = [Camera.is_enabled.is_(True)]

        if camera_mac_addresses is not None:
            where_clauses.append(
                UserAlertSetting.camera_mac_address.in_(list(camera_mac_addresses))
            )
        if only_enabled:
            where_clauses.append(UserAlertSetting.enabled.is_(True))

        # TODO: if trigger_type is None
        if trigger_type is not None:
            where_clauses.append(UserAlertSetting.trigger_type.in_(set([trigger_type])))

        query = (
            sa.select(UserAlertSetting, UserAlertTriggerType)
            .join(Camera, UserAlertSetting.camera_mac_address == Camera.mac_address)
            .join(
                UserAlertTriggerType,
                UserAlertSetting.trigger_type == UserAlertTriggerType.trigger_type,
            )
            .join(orm_nvr.NVR, Camera.nvr_uuid == orm_nvr.NVR.uuid)
            .join(
                orm_location.Location,
                orm_nvr.NVR.location_id == orm_location.Location.id,
            )
            .join(
                orm_organization.Organization,
                orm_organization.Organization.tenant == orm_location.Location.tenant,
            )
            .where(*where_clauses)
        )
        result = await session.execute(query)
        rows = result.all()

        queried_alert_settings = [
            UserAlertSettingResponse(
                setting=models.UserAlertSetting.from_orm(row.UserAlertSetting),
                trigger_type=(
                    models.UserAlertTriggerType.from_orm(row.UserAlertTriggerType)
                    if include_trigger_thresholds
                    else None
                ),
            )
            for row in rows
        ]
        # Remove Motion category from detection_object_types of each record of
        # queried_alert_settings, if any.
        for alert_setting in queried_alert_settings:
            if (
                models.DetectionObjectType.MOTION
                in alert_setting.setting.detection_object_types
            ):
                alert_setting.setting.detection_object_types.remove(
                    models.DetectionObjectType.MOTION
                )
        return queried_alert_settings

    @staticmethod
    async def system_alert_settings_per_camera(
        session: AsyncSession,
        camera_mac_addresses: set[str] | None = None,
        only_enabled: bool = True,
        trigger_type: models.TriggerType | None = None,
    ) -> dict[str, list[UserAlertSettingResponse]]:
        """Get all the user alert settings indexed by camera mac address.

        :param camera_mac_addresses: a list of mac_addresseses to filter by (optional).
        :param only_enabled: Whether to return only enabled alerts.
        :return: Dictionary with all the alerts indexed by camera id.
        """
        cam_to_alert_settings: dict[str, list[UserAlertSettingResponse]] = {}
        all_alert_settings = await UserAlertSetting._system_query_alert_settings(
            session,
            camera_mac_addresses=camera_mac_addresses,
            only_enabled=only_enabled,
            trigger_type=trigger_type,
            include_trigger_thresholds=True,
        )

        for setting in all_alert_settings:
            cam_to_alert_settings.setdefault(
                setting.setting.camera_mac_address, []
            ).append(setting)

        return cam_to_alert_settings

    @staticmethod
    async def system_get_active_alert_settings(
        session: AsyncSession,
        query_time: AwareDatetime,
        camera_mac_addresses: set[str] | None = None,
        only_enabled: bool = True,
        trigger_type: models.TriggerType | None = None,
    ) -> tuple[set[int], set[str]]:
        """Get all the user alert settings which are active at the given time.
        Return a set of time activated alert setting IDs.
        """
        cam_to_alert_settings = await UserAlertSetting.system_alert_settings_per_camera(
            session, camera_mac_addresses, only_enabled, trigger_type=trigger_type
        )

        # Filter out the alert settings that are not activated at the current time.
        active_alert_setting_ids = set()
        active_cameras = set()
        for mac_address, alert_settings in cam_to_alert_settings.items():
            for setting in alert_settings:
                if setting.setting.is_activated(query_time):
                    active_alert_setting_ids.add(setting.setting.id)
                    active_cameras.add(mac_address)

        return (active_alert_setting_ids, active_cameras)

    @staticmethod
    async def get_alert_settings(
        session: TenantAwareAsyncSession,
        camera_mac_addresses: set[str] | None = None,
        only_enabled: bool = True,
    ) -> list[UserAlertSettingResponse]:
        """Get all the user alert settings.

        :param camera_mac_addresses: Set of camera mac addresses to query for.
        :param only_enabled: Whether to return only enabled alerts.
        :return: List of alert settings.
        """
        return await UserAlertSetting._system_query_alert_settings(
            session,
            only_enabled=only_enabled,
            camera_mac_addresses=camera_mac_addresses,
            include_trigger_thresholds=True,
        )

    @staticmethod
    async def system_get_idling_alert_configurations(
        session: AsyncSession, setting_ids: set[int]
    ) -> dict[int, int]:
        """Get the idling alert configurations for the given alert settings.
        :param session: Database session.
        :param setting_ids: IDs of the alert settings.
        :return: List of idling alert configurations.
        """
        query = sa.select(
            UserAlertSetting.min_idle_duration_s, UserAlertSetting.id
        ).where(
            UserAlertSetting.trigger_type == models.TriggerType.IDLING,
            UserAlertSetting.id.in_(setting_ids),
        )
        result = await session.execute(query)
        results = result.all()
        setting_id_to_idling_config = {}
        for row in results:
            setting_id_to_idling_config[int(row.id)] = row.min_idle_duration_s
        return setting_id_to_idling_config

    @staticmethod
    async def system_get_maximum_idle_duration_s(session: AsyncSession) -> int | None:
        """Get maximum idle duration in seconds across the table.
        :return: Maximum idle duration in seconds.
        """
        stmt = sa.select(func.max(UserAlertSetting.min_idle_duration_s))
        result = await session.execute(stmt)
        max_idle_duration_s = result.scalar()

        return max_idle_duration_s


class UserAlert(TenantProtectedTable):
    __tablename__ = "user_alerts"
    id: orm.Mapped[int] = sa.Column(sa.Integer, primary_key=True, autoincrement=True)
    # Alert setting for which the alert was triggered
    setting_id = sa.Column(
        sa.Integer, sa.ForeignKey("user_alert_settings.id"), nullable=False
    )
    # Start time of the alert
    start_time = sa.Column(sa.TIMESTAMP(timezone=True), nullable=False)
    # End time of the alert
    end_time = sa.Column(sa.TIMESTAMP(timezone=True), nullable=False)
    # Whether the alert is currently active. For each alert setting, there should be
    # at maximum one active alert at any given time.
    is_active = sa.Column(sa.Boolean, nullable=False)
    # alert send time of the alert
    alert_sent_time = sa.Column(sa.TIMESTAMP(timezone=True), nullable=True)
    __table_args__ = ((sa.ForeignKeyConstraint(["tenant"], ["organizations.tenant"])),)

    @staticmethod
    async def system_new_alert(
        session: AsyncSession, alert_data: models.UserAlertCreate, tenant: str
    ) -> UserAlert:
        """Add a new alert to the DB"""
        alert = UserAlert(
            setting_id=alert_data.setting_id,
            start_time=alert_data.start_time,
            end_time=alert_data.end_time,
            is_active=alert_data.is_active,
            tenant=tenant,
        )
        session.add(alert)
        return alert

    @staticmethod
    async def system_get_settings_with_active_alerts(
        session: AsyncSession, trigger_type: models.TriggerType | None = None
    ) -> dict[str, models.UserAlertSettingsInfoFromActiveAlert]:
        """Get all active alerts indexed by camera mac address.
        :param trigger_type: Only return trigger_type active alert settings.
        :return: dict 1-1 maps mac_address and active alert settings.
        """

        where_clauses = [UserAlert.is_active.is_(True)]
        if trigger_type is not None:
            where_clauses.append(UserAlertSetting.trigger_type == trigger_type)

        query = (
            sa.select(
                UserAlert, UserAlertSetting.camera_mac_address, UserAlertSetting.tenant
            )
            .join(UserAlertSetting)
            .where(*where_clauses)
        )
        result = await session.execute(query)
        rows = result.all()
        active_alerts: dict[str, models.UserAlertSettingsInfoFromActiveAlert] = {}
        for row in rows:
            if row.camera_mac_address not in active_alerts:
                active_alerts[row.camera_mac_address] = (
                    models.UserAlertSettingsInfoFromActiveAlert(
                        tenant=row.tenant, setting_ids=set()
                    )
                )
            active_alerts[row.camera_mac_address].setting_ids.add(
                row.UserAlert.setting_id
            )

        return active_alerts

    @staticmethod
    async def system_get_alert_list_to_send(
        session: AsyncSession, alert_trigger_type: models.TriggerType | None = None
    ) -> dict[int, UserAlertWithStreamName]:
        """Get all email addresses with alerts to send.

        :return: Dictionary which 1-1 maps email addresse and alert settings.
        """

        where_clauses = [
            UserAlert.is_active.is_(True),
            UserAlert.alert_sent_time.is_(None),
            or_(
                UserAlertSetting.email.is_not(None), UserAlertSetting.phone.is_not(None)
            ),
        ]

        if alert_trigger_type is not None:
            where_clauses.append(UserAlertSetting.trigger_type == alert_trigger_type)

        # query all the alerts which are active and have not been sent yet
        query = (
            sa.select(
                UserAlert,
                UserAlertSetting.camera_mac_address,
                UserAlertSetting.email,
                UserAlertSetting.phone,
                UserAlertSetting.tenant,
                UserAlertTriggerType.min_active_duration_s,
                Camera,
                orm_camera_group.CameraGroup.name.label("group"),
                orm_nvr.NVR.location_id,
                orm_location.Location.name.label("location_name"),
            )
            .join(UserAlertSetting, UserAlert.setting_id == UserAlertSetting.id)
            .join(
                UserAlertTriggerType,
                UserAlertSetting.trigger_type == UserAlertTriggerType.trigger_type,
            )
            .join(Camera, UserAlertSetting.camera_mac_address == Camera.mac_address)
            .join(orm_nvr.NVR, Camera.nvr_uuid == orm_nvr.NVR.uuid)
            .join(
                orm_location.Location,
                orm_nvr.NVR.location_id == orm_location.Location.id,
            )
            .join(
                orm_camera_group.CameraGroup,
                Camera.camera_group_id == orm_camera_group.CameraGroup.id,
                isouter=True,
            )
            .where(*where_clauses)
        )
        result = await session.execute(query)
        rows = result.all()
        setting_to_alerts: dict[int, UserAlertWithStreamName] = {}
        for row in rows:
            alert = models.UserAlert.from_orm(row.UserAlert)
            if (alert.end_time - alert.start_time) > datetime.timedelta(
                seconds=row.min_active_duration_s
            ):
                stream_name = row.Camera.stream_hash
                mac_address = row.camera_mac_address
                setting_to_alerts[alert.setting_id] = UserAlertWithStreamName(
                    user_alert=row.UserAlert,
                    mac_address=mac_address,
                    stream_name=stream_name,
                    camera_name=row.Camera.name,
                    location_name=row.location_name,
                    group_name=row.group,
                    email=row.email,
                    phone=row.phone,
                    tenant=row.tenant,
                )

        return setting_to_alerts

    @staticmethod
    async def system_update_alert_send_time(
        session: AsyncSession, settings_id: list[int], alert_sent_time: AwareDatetime
    ) -> None:
        """Update the alert send time of active alerts of the given setting ids.

        :param settings_id: The setting id of the alert to update.
        :param alert_sent_time: The send time of the alert.
        """
        if len(settings_id) == 0:
            return
        stmt = (
            sa.update(UserAlert)
            .where(UserAlert.setting_id.in_(settings_id), UserAlert.is_active.is_(True))
            .values({UserAlert.alert_sent_time: alert_sent_time})
        )
        await session.execute(stmt)

    @staticmethod
    async def system_update_active_alert_end_time(
        session: AsyncSession, setting_id: int, new_end_time: AwareDatetime
    ) -> None:
        """Update the end time of an active alert.

        :param setting_id: The setting id of the alert to update.
        :param new_end_time: The new end time of the alert.
        """
        stmt = (
            sa.update(UserAlert)
            .where(UserAlert.setting_id == setting_id, UserAlert.is_active.is_(True))
            .values({UserAlert.end_time: new_end_time})
        )
        await session.execute(stmt)

    @staticmethod
    async def system_close_active_alert(session: AsyncSession, setting_id: int) -> None:
        """Close alert by setting is_active to False.
        :param setting_id: The setting id of the alert to update.
        """
        update_stmt = (
            sa.update(UserAlert)
            .where(UserAlert.setting_id == setting_id, UserAlert.is_active.is_(True))
            .values({UserAlert.is_active: False})
        )
        await session.execute(update_stmt)

    @staticmethod
    async def system_try_close_and_maybe_new_active_alert(
        session: AsyncSession,
        camera_mac_address: str,
        now: AwareDatetime,
        setting_id: int,
        new_detection_interval: tuple[AwareDatetime, AwareDatetime] | None,
        max_active_duration_s: int,
        tenant: str,
    ) -> None:
        """If the alert last for more than max_active_duration_s, close it.
        If there's new detection interval which is valid, create a new alert.
        """
        query = sa.select(UserAlert).where(
            UserAlert.setting_id == setting_id, UserAlert.is_active.is_(True)
        )
        result = await session.execute(query)
        row = result.first()
        alert = models.UserAlert.from_orm(row.UserAlert) if row is not None else None
        if alert is None:
            logger.error(
                "Trying to finalize an alert which is not "
                f"active [setting_id={setting_id}]"
            )
            return

        alert_duration = now - alert.start_time
        if alert_duration < datetime.timedelta(seconds=max_active_duration_s):
            # Alert active but active for less than max_active_duration_s,
            # update alert end time.
            if new_detection_interval is not None:
                await UserAlert.system_update_active_alert_end_time(
                    session, setting_id, new_detection_interval[1]
                )
            return

        await UserAlert.system_close_active_alert(session, setting_id)

        if new_detection_interval is not None:
            if len(new_detection_interval) != 2:
                raise ValueError(
                    "new_detection_interval should be a tuple of length 2, "
                    f"got {len(new_detection_interval)}"
                )

            new_alert = models.UserAlertCreate(
                setting_id=setting_id,
                start_time=new_detection_interval[0],
                end_time=new_detection_interval[1],
                is_active=True,
            )
            await UserAlert.system_new_alert(session, new_alert, tenant)
            logger.info(
                f"New user alert created at {new_detection_interval[0]} for "
                f"alert setting {setting_id} and camera: {camera_mac_address}"
            )
        else:
            logger.info(
                f"User alert closed at {now} for alert setting {setting_id} "
                f"and camera: {camera_mac_address}"
            )

    @staticmethod
    async def get_all_alerts(
        session: TenantAwareAsyncSession, alert_setting_ids: list[int]
    ) -> list[models.UserAlert]:
        """Get all alerts for a particular alert setting

        :param alert_setting_id: the alert setting to search for
        :return: all associated alerts
        """
        stmt = sa.select(UserAlert).where(UserAlert.setting_id.in_(alert_setting_ids))
        result = await session.execute(stmt)

        alerts = result.scalars().all()
        return [models.UserAlert.from_orm(alert) for alert in alerts]

    @staticmethod
    async def delete_alerts_for_setting_ids(
        session: TenantAwareAsyncSession, alert_setting_ids: list[int]
    ) -> None:
        """Delete all alerts for a particular alert setting.

        :param session: The database session.
        :param alert_setting_ids: The alert setting ids to delete.
        """
        delete_stmt = sa.delete(UserAlert).where(
            UserAlert.setting_id.in_(alert_setting_ids)
        )
        await session.execute(delete_stmt)
