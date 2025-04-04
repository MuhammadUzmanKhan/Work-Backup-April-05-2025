import datetime
from copy import deepcopy

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from backend.alert.errors import TooSoonError
from backend.alert.tasks import (
    _get_extra_query_time,
    _get_user_alert_last_run_time,
    _set_user_alert_last_run_time,
)
from backend.constants import (
    ALERT_CHECK_INTERVAL_SECONDS,
    ALERT_CHECK_MAX_INTERVAL_SECONDS,
    IDLE_ALERT_CHECK_INTERVAL_SECONDS,
    MIN_CONFIDENCE_THRESHOLD,
)
from backend.database import database, orm
from backend.database.geometry_models import Point2D
from backend.database.models import (
    NVR,
    CameraGroup,
    DayOfWeek,
    DetectionObjectType,
    PerceptionObjectCreate,
    TriggerType,
    UserAlertSetting,
    UserAlertSettingCreate,
    UserAlertTriggerType,
)
from backend.database.organization_models import Organization
from backend.database.orm.orm_user_alert import DEFAULT_TRIGGER_TYPES
from backend.perception.models import PerceptionEvent
from backend.test.factory_types import CameraFactory
from backend.utils import AwareDatetime, AwareTime
from backend.value_store.value_store import ValueStore

DEFAULT_MIN_ACTIVE_DURATION_S = 10
DEFAULT_TEST_TRIGGER_TYPE = TriggerType.IDLING
DEFAULT_START_TIME = AwareDatetime.fromisoformat("2023-04-21 01:00:00.000+00:00")
DEFAULT_WEEKDAY = set([DayOfWeek.FRIDAY])
FULL_DETECTION_OBJECT_TYPES = set([DetectionObjectType.CAR, DetectionObjectType.PERSON])
DEFAULT_CAMERA_MAC_ADDRESS = "F0:00:00:00:00:00"
DEFAULT_CAMERA_VENDOR = "CoramAI"
DEFAULT_MAX_IDLE_DURATION_SECONDS = 60
DEFAULT_MIN_VALID_CONFIDECNE = 0.5
FULL_TOP_LEFT = [0.0, 0.0]
FULL_BOTTOM_RIGHT = [1.0, 1.0]
FULL_RECT_ROI = [FULL_TOP_LEFT, FULL_BOTTOM_RIGHT]
NOT_MATCHING_ROI = [[0.0, 0.0], [0.0, 0.2], [0.2, 0.2], [0.2, 0.0]]
ALERT_SETTING_ROI = [[0.2, 0.2], [0.2, 0.5], [0.5, 0.5], [0.5, 0.2]]


def generate_user_alert_setting(
    detection_object_types: set[DetectionObjectType] = FULL_DETECTION_OBJECT_TYPES,
    roi_polygon: list[list[float]] = FULL_RECT_ROI,
    days_of_week: set[DayOfWeek] = DEFAULT_WEEKDAY,
    start_time: AwareTime = AwareTime.fromisoformat("00:00:00+00:00"),
    end_time: AwareTime = AwareTime.fromisoformat("23:59:00+00:00"),
    enabeld: bool = True,
    trigger_type: TriggerType = DEFAULT_TEST_TRIGGER_TYPE,
) -> UserAlertSettingCreate:
    min_idle_duration_s = (
        DEFAULT_MAX_IDLE_DURATION_SECONDS
        if trigger_type == TriggerType.IDLING
        else None
    )  # noqa
    return UserAlertSettingCreate(
        camera_mac_address=DEFAULT_CAMERA_MAC_ADDRESS,
        detection_object_types=detection_object_types,
        roi_polygon=roi_polygon,
        days_of_week=days_of_week,
        start_time=start_time,
        end_time=end_time,
        trigger_type=trigger_type,
        enabled=enabeld,
        min_idle_duration_s=min_idle_duration_s,
        name="test",
        email="test",
        phone="test",
        creator_name="test",
        creation_time=AwareDatetime.utcnow(),
    )


async def check_query_trigger_types(
    session: AsyncSession,
    trigger_types: list[TriggerType],
    expected_triggers: list[UserAlertTriggerType] | list[None],
) -> None:
    """Query the trigger types and check if they are as expected."""
    assert len(trigger_types) == len(expected_triggers)
    queried_triggers = dict()
    for trigger_type in trigger_types:
        trigger = (
            await orm.orm_user_alert.UserAlertTriggerType.get_user_alert_trigger_type(
                session=session, trigger_type=trigger_type
            )
        )
        queried_triggers[trigger_type] = trigger

    assert len(queried_triggers) == len(expected_triggers)
    for trigger_type, expected_trigger in zip(trigger_types, expected_triggers):
        queried_trigger = queried_triggers[trigger_type]
        assert queried_trigger == expected_trigger


#  Generate detections with tracker_id
def generate_detections(
    mac_address: str,
    min_corner: Point2D,
    max_corner: Point2D,
    start_time_list: list[AwareDatetime],
    detection_type_list: list[DetectionObjectType],
    num_events_list: list[int],
    time_gap_list: list[datetime.timedelta],
    track_id_list: list[int],
    is_moving_list: list[bool],
    confidence: float = 0.9,
) -> list[PerceptionEvent]:
    """Util function to generate a list of perception events and a list of
    lists of perception objects for multiple detection types.

    :param mac_address: the mac address of the camera
    :param min_corner: the min corner of the detections
    :param max_corner: the max corner of the detections
    :param start_time_list: a list of start time of the detections
    :param detection_type_list: a list of detection types
    :param num_events_list: a list of number of events to generate
    :param time_gap_list: a list of time gap between events
    :param confidence: the confidence of the detections
    :return: a tuple of the perception event data and the detection objects
    """
    perception_events = []
    for start_time, detection_type, num_events, time_gap, track_id, is_moving in zip(
        start_time_list,
        detection_type_list,
        num_events_list,
        time_gap_list,
        track_id_list,
        is_moving_list,
    ):
        cur_time = start_time
        for i in range(num_events):
            perception_events.append(
                PerceptionEvent(
                    time=cur_time,
                    mac_address=mac_address,
                    objects=[
                        PerceptionObjectCreate(
                            object_type=detection_type,
                            x_min=min_corner.x,
                            y_min=min_corner.y,
                            x_max=max_corner.x,
                            y_max=max_corner.y,
                            confidence=confidence,
                            is_moving=is_moving,
                            track_id=track_id,
                            track_age_s=0,
                            object_idx=i + 1,
                            idx_in_frame=None,
                        )
                    ],
                )
            )

            cur_time += time_gap
    return perception_events


@pytest.mark.parametrize(
    "alert_setting,expect_number_alerts",
    [
        # Weekday not matching
        (
            generate_user_alert_setting(
                days_of_week=set([DayOfWeek.THURSDAY]), trigger_type=TriggerType.IDLING
            ),
            0,
        ),
        # Detection type not matching
        (
            generate_user_alert_setting(
                detection_object_types=set([DetectionObjectType.CAR]),
                trigger_type=TriggerType.IDLING,
            ),
            0,
        ),
        # ROI not matching
        (
            generate_user_alert_setting(
                detection_object_types=FULL_DETECTION_OBJECT_TYPES,
                roi_polygon=NOT_MATCHING_ROI,
                trigger_type=TriggerType.IDLING,
            ),
            0,
        ),
        # Time not matching
        (
            generate_user_alert_setting(
                start_time=AwareTime.fromisoformat("03:00:00+00:00"),
                end_time=AwareTime.fromisoformat("04:59:00+00:00"),
                detection_object_types=FULL_DETECTION_OBJECT_TYPES,
                trigger_type=TriggerType.IDLING,
            ),
            0,
        ),
        # Matching ROI for IDLING
        (
            generate_user_alert_setting(
                detection_object_types=FULL_DETECTION_OBJECT_TYPES,
                days_of_week=set([DayOfWeek.FRIDAY]),
                roi_polygon=ALERT_SETTING_ROI,
                trigger_type=TriggerType.IDLING,
            ),
            1,
        ),
    ],
)
async def test_single_idling_alert(
    alert_setting: UserAlertSettingCreate,
    expect_number_alerts: int,
    db_instance: database.Database,
    camera_group: CameraGroup,
    nvr: NVR,
    create_camera: CameraFactory,
    organization: Organization,
) -> None:
    """Test if potential idling alerts are detected correctly."""
    camera = await create_camera(camera_group.id, nvr.uuid, DEFAULT_CAMERA_MAC_ADDRESS)

    async with db_instance.tenant_session(tenant=organization.tenant) as session:
        await orm.orm_user_alert.UserAlertSetting.new_alert_setting(
            session, alert_setting
        )

    query_time = DEFAULT_START_TIME
    detection_start_time = DEFAULT_START_TIME - datetime.timedelta(minutes=2)

    perception_events = generate_detections(
        mac_address=camera.mac_address,
        min_corner=Point2D(x=0.3, y=0.3),
        max_corner=Point2D(x=0.4, y=0.4),
        start_time_list=[detection_start_time],
        detection_type_list=[DetectionObjectType.PERSON],
        num_events_list=[60 * 5],  # 5 minutes of events
        time_gap_list=[datetime.timedelta(seconds=1)],
        track_id_list=[1],
        is_moving_list=[True],
    )

    async with db_instance.tenant_session(tenant=organization.tenant) as session:
        await orm.PerceptionObjectEvent.add_event_batch(session, perception_events)

        # Filter out the alert settings that are not activated at the current time.
        (active_alert_setting_ids, active_camera_mac_addresses) = (
            await orm.UserAlertSetting.system_get_active_alert_settings(
                session, query_time=query_time, trigger_type=alert_setting.trigger_type
            )
        )

        if len(active_alert_setting_ids) == 0:
            assert len(active_camera_mac_addresses) == 0
            return

        potential_alerts = await orm.PerceptionObjectEvent.system_get_idling_alerts(
            session,
            MIN_CONFIDENCE_THRESHOLD,
            active_alert_setting_ids,
            active_camera_mac_addresses,
            query_time,
            extra_query_time=datetime.timedelta(
                seconds=ALERT_CHECK_INTERVAL_SECONDS * 2
            ),
        )

        assert len(potential_alerts) == expect_number_alerts

        for alert in potential_alerts:
            assert alert.alert_setting_id == 1
            assert alert.camera_mac_address == camera.mac_address
            assert alert.alert_trigger_type == alert_setting.trigger_type
            assert alert.start_time is not None
            assert alert.end_time is not None


@pytest.mark.parametrize(
    "min_num_detections,min_num_moving_detections,expect_number_alerts",
    [
        # no valid alert detection due to insufficient # of detections.
        (15, 0, 0),
        # no valid alert detection due to insufficient # of moving detections.
        (10, 6, 0),
        # valid alert detection.
        (10, 5, 1),
    ],
)
async def test_single_do_not_enter_alert(
    db_instance: database.Database,
    camera_group: CameraGroup,
    nvr: NVR,
    create_camera: CameraFactory,
    organization: Organization,
    min_num_detections: int,
    min_num_moving_detections: int,
    expect_number_alerts: int,
) -> None:
    """Test if potential do not enter alerts are detected correctly."""
    camera = await create_camera(camera_group.id, nvr.uuid, DEFAULT_CAMERA_MAC_ADDRESS)

    async with db_instance.tenant_session(tenant=organization.tenant) as session:
        await orm.orm_user_alert.UserAlertSetting.new_alert_setting(
            session,
            generate_user_alert_setting(
                detection_object_types=FULL_DETECTION_OBJECT_TYPES,
                roi_polygon=ALERT_SETTING_ROI,
                trigger_type=TriggerType.DO_NOT_ENTER,
            ),
        )
    query_time = DEFAULT_START_TIME + datetime.timedelta(
        seconds=ALERT_CHECK_INTERVAL_SECONDS
    )
    detection_start_time = DEFAULT_START_TIME
    perception_events = generate_detections(
        mac_address=camera.mac_address,
        min_corner=Point2D(x=0.3, y=0.3),
        max_corner=Point2D(x=0.4, y=0.4),
        start_time_list=[
            detection_start_time,
            detection_start_time + datetime.timedelta(seconds=5),
        ],
        detection_type_list=[DetectionObjectType.PERSON, DetectionObjectType.PERSON],
        num_events_list=[5, 5],
        time_gap_list=[datetime.timedelta(seconds=1), datetime.timedelta(seconds=1)],
        track_id_list=[1, 1],
        is_moving_list=[False, True],
    )

    async with db_instance.tenant_session(tenant=organization.tenant) as session:
        await orm.PerceptionObjectEvent.add_event_batch(session, perception_events)

        # Filter out the alert settings that are not activated at the current time.
        (active_alert_setting_ids, active_camera_mac_addresses) = (
            await orm.UserAlertSetting.system_get_active_alert_settings(
                session, query_time=query_time, trigger_type=TriggerType.DO_NOT_ENTER
            )
        )

        if len(active_alert_setting_ids) == 0:
            assert len(active_camera_mac_addresses) == 0
            return

        potential_alerts = (
            await orm.PerceptionObjectEvent.system_get_do_not_enter_alerts(
                session,
                MIN_CONFIDENCE_THRESHOLD,
                active_alert_setting_ids,
                active_camera_mac_addresses,
                query_time,
                min_num_detections=min_num_detections,
                min_num_moving_detections=min_num_moving_detections,
                extra_query_time=datetime.timedelta(
                    seconds=ALERT_CHECK_INTERVAL_SECONDS
                ),
            )
        )
    assert len(potential_alerts) == expect_number_alerts


@pytest.mark.parametrize(
    "alert_trigger_type,detection_start_time,expect_number_alerts",
    [
        (TriggerType.IDLING, DEFAULT_START_TIME - datetime.timedelta(minutes=2), 2),
        # DO NOT ENTER alert trigger type: with enough detectons.
        (
            TriggerType.DO_NOT_ENTER,
            DEFAULT_START_TIME - datetime.timedelta(seconds=10),
            2,
        ),
        # DO NOT ENTER alert trigger type:
        # no valid alert detection due to insufficient # of detections.
        (
            TriggerType.DO_NOT_ENTER,
            DEFAULT_START_TIME - datetime.timedelta(seconds=5),
            0,
        ),
    ],
)
async def test_multiple_alert_settings(
    db_instance: database.Database,
    alert_trigger_type: TriggerType,
    detection_start_time: AwareDatetime,
    expect_number_alerts: int,
    camera_group: CameraGroup,
    nvr: NVR,
    create_camera: CameraFactory,
    organization: Organization,
) -> None:
    camera = await create_camera(camera_group.id, nvr.uuid, DEFAULT_CAMERA_MAC_ADDRESS)
    detection_object_types = [DetectionObjectType.PERSON, DetectionObjectType.CAR]
    for detection_object_type in detection_object_types:
        alert_setting = generate_user_alert_setting(
            detection_object_types={detection_object_type},
            roi_polygon=ALERT_SETTING_ROI,
            trigger_type=alert_trigger_type,
        )
        async with db_instance.tenant_session(tenant=organization.tenant) as session:
            await orm.orm_user_alert.UserAlertSetting.new_alert_setting(
                session, alert_setting
            )

    query_time = DEFAULT_START_TIME
    perception_events = generate_detections(
        mac_address=camera.mac_address,
        min_corner=Point2D(x=0.3, y=0.3),
        max_corner=Point2D(x=0.4, y=0.4),
        start_time_list=[detection_start_time, detection_start_time],
        detection_type_list=[DetectionObjectType.PERSON, DetectionObjectType.CAR],
        num_events_list=[60 * 5, 60 * 5],  # 5 minutes of events
        time_gap_list=[datetime.timedelta(seconds=1), datetime.timedelta(seconds=1)],
        track_id_list=[1, 2],
        is_moving_list=[True, True],
    )

    async with db_instance.tenant_session(tenant=organization.tenant) as session:
        await orm.PerceptionObjectEvent.add_event_batch(session, perception_events)
        # Get the active alert settings of specified alert trigger type
        (active_alert_setting_ids, active_camera_mac_addresses) = (
            await orm.UserAlertSetting.system_get_active_alert_settings(
                session, query_time=query_time, trigger_type=alert_trigger_type
            )
        )

        if active_alert_setting_ids == set():
            return

        extra_query_time = (
            datetime.timedelta(seconds=ALERT_CHECK_INTERVAL_SECONDS * 2)
            if alert_trigger_type == TriggerType.IDLING
            else datetime.timedelta(seconds=ALERT_CHECK_INTERVAL_SECONDS)
        )

        if alert_trigger_type == TriggerType.IDLING:
            detected_alert_intervals = (
                await orm.PerceptionObjectEvent.system_get_idling_alerts(
                    session,
                    MIN_CONFIDENCE_THRESHOLD,
                    active_alert_setting_ids,
                    active_camera_mac_addresses,
                    query_time,
                    extra_query_time=extra_query_time,
                )
            )
        else:
            detected_alert_intervals = (
                await orm.PerceptionObjectEvent.system_get_do_not_enter_alerts(
                    session,
                    MIN_CONFIDENCE_THRESHOLD,
                    active_alert_setting_ids,
                    active_camera_mac_addresses,
                    query_time,
                    min_num_detections=10,
                    min_num_moving_detections=5,
                    extra_query_time=extra_query_time,
                )
            )
        assert len(detected_alert_intervals) == expect_number_alerts


@pytest.mark.parametrize(
    "alert_trigger_type", [(TriggerType.IDLING), (TriggerType.DO_NOT_ENTER)]
)
async def test_extra_query_time(
    db_instance: database.Database,
    camera_group: CameraGroup,
    nvr: NVR,
    create_camera: CameraFactory,
    alert_trigger_type: TriggerType,
    organization: Organization,
    value_store: ValueStore,
) -> None:
    """Test if last_run_time and extra query time was processed correctly."""

    # Create a camera record because user_alert_setting has a foreign key
    # associated with it.
    camera = await create_camera(camera_group.id, nvr.uuid, DEFAULT_CAMERA_MAC_ADDRESS)
    assert camera is not None

    alert_setting = generate_user_alert_setting(
        detection_object_types=FULL_DETECTION_OBJECT_TYPES,
        roi_polygon=ALERT_SETTING_ROI,
        trigger_type=alert_trigger_type,
    )
    async with db_instance.tenant_session(tenant=organization.tenant) as session:
        await orm.orm_user_alert.UserAlertSetting.new_alert_setting(
            session, alert_setting
        )
    now_time = DEFAULT_START_TIME

    async with db_instance.session() as session:
        last_run = await _get_user_alert_last_run_time(value_store, alert_trigger_type)
        assert last_run is None
        extra_query_time = _get_extra_query_time(
            last_run=last_run, now=now_time, alert_trigger_type=alert_trigger_type
        )

        if alert_trigger_type == TriggerType.IDLING:
            assert extra_query_time == datetime.timedelta(
                seconds=IDLE_ALERT_CHECK_INTERVAL_SECONDS * 2
            )
        else:
            assert extra_query_time == datetime.timedelta(
                seconds=ALERT_CHECK_MAX_INTERVAL_SECONDS
            )

        await _set_user_alert_last_run_time(value_store, alert_trigger_type, now_time)
        last_run = await _get_user_alert_last_run_time(value_store, alert_trigger_type)
        assert last_run is not None
        assert last_run == DEFAULT_START_TIME

        # query the last_run at 6 seconds later, expect TooSoonError
        query_time = now_time + datetime.timedelta(seconds=6)
        with pytest.raises(TooSoonError):
            extra_query_time = _get_extra_query_time(
                last_run=last_run, now=query_time, alert_trigger_type=alert_trigger_type
            )

        # query the last_run at 10 seconds later, expect normal behavior
        query_time = now_time + datetime.timedelta(seconds=10)
        extra_query_time = _get_extra_query_time(
            last_run=last_run, now=query_time, alert_trigger_type=alert_trigger_type
        )
        if alert_trigger_type == TriggerType.DO_NOT_ENTER:
            assert extra_query_time == query_time - last_run
        else:
            assert extra_query_time == datetime.timedelta(
                seconds=IDLE_ALERT_CHECK_INTERVAL_SECONDS * 2
            )


async def test_edit_alert(
    db_instance: database.Database,
    camera_group: CameraGroup,
    nvr: NVR,
    create_camera: CameraFactory,
    organization: Organization,
) -> None:
    await create_camera(camera_group.id, nvr.uuid, DEFAULT_CAMERA_MAC_ADDRESS)
    async with db_instance.tenant_session(tenant=organization.tenant) as session:
        alert_setting = UserAlertSetting.from_orm(
            await orm.orm_user_alert.UserAlertSetting.new_alert_setting(
                session, generate_user_alert_setting()
            )
        )

    new_alert_setting = deepcopy(alert_setting)
    # NOTE(@lberg): we change some fields here but this is not exhaustive
    new_alert_setting.start_time = AwareTime(
        hour=10, minute=0, second=0, tzinfo=datetime.timezone.utc
    )
    new_alert_setting.end_time = AwareTime(
        hour=11, minute=0, second=0, tzinfo=datetime.timezone.utc
    )
    new_alert_setting.phone = "1234567890"
    new_alert_setting.email = "another_email"
    new_alert_setting.name = "another_name"
    async with db_instance.tenant_session(tenant=organization.tenant) as session:
        updated_alert_setting = UserAlertSetting.from_orm(
            await orm.orm_user_alert.UserAlertSetting.update_alert_setting(
                session, new_alert_setting
            )
        )
    assert updated_alert_setting == new_alert_setting


async def test_db_has_expected_trigger_types_after_migration(
    db_instance: database.Database,
) -> None:
    trigger_types = [TriggerType.DO_NOT_ENTER, TriggerType.IDLING]

    async with db_instance.session() as session:
        await check_query_trigger_types(
            session=session,
            trigger_types=trigger_types,
            expected_triggers=DEFAULT_TRIGGER_TYPES,
        )
