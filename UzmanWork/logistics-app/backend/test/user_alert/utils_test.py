from datetime import timedelta, timezone

from backend.database import models
from backend.database.models import DayOfWeek
from backend.utils import AwareDatetime, AwareTime


def construct_alert_setting(
    days_of_week: set[DayOfWeek],
    start_time: AwareTime | None,
    end_time: AwareTime | None,
) -> models.UserAlertSetting:
    setting = models.UserAlertSetting(
        id=1,
        camera_mac_address="00:00:00:00:00:00",
        detection_object_types=set(),
        roi_polygon=[],
        days_of_week=days_of_week,
        start_time=start_time,
        end_time=end_time,
        enabled=True,
        name=None,
        phone=None,
        email=None,
        creation_time=None,
        creator_name=None,
        trigger_type=None,
        min_idle_duration_s=None,
    )
    return setting


def test_is_activated_time_range() -> None:
    week_set = set([DayOfWeek.FRIDAY])
    setting = construct_alert_setting(
        week_set,
        AwareTime(10, 0, 0, 0, timezone.utc),
        AwareTime(17, 0, 0, 0, timezone.utc),
    )
    # Too early
    assert not setting.is_activated(AwareDatetime(2021, 1, 1, 8, 0, 0, 0, timezone.utc))
    assert setting.is_activated(AwareDatetime(2021, 1, 1, 12, 0, 0, 0, timezone.utc))
    # Too late
    assert not setting.is_activated(
        AwareDatetime(2021, 1, 1, 23, 0, 0, 0, timezone.utc)
    )


def test_is_activated_time_range_different_tz() -> None:
    week_set = set([DayOfWeek.FRIDAY])
    setting = construct_alert_setting(
        week_set,
        AwareTime(10, 0, 0, 0, timezone.utc),
        AwareTime(17, 0, 0, 0, timezone.utc),
    )
    # Too early
    assert not setting.is_activated(
        AwareDatetime(2021, 1, 1, 1, 0, 0, 0, timezone(timedelta(hours=-8)))
    )
    assert setting.is_activated(
        AwareDatetime(2021, 1, 1, 3, 0, 0, 0, timezone(timedelta(hours=-8)))
    )
    # Too late
    assert not setting.is_activated(
        AwareDatetime(2021, 1, 1, 10, 0, 0, 0, timezone(timedelta(hours=-8)))
    )


def test_is_activated_time_range_complementary() -> None:
    week_set = set([DayOfWeek.FRIDAY])
    setting = construct_alert_setting(
        week_set,
        AwareTime(17, 0, 0, 0, timezone.utc),
        AwareTime(10, 0, 0, 0, timezone.utc),
    )
    assert setting.is_activated(AwareDatetime(2021, 1, 1, 8, 0, 0, 0, timezone.utc))
    assert setting.is_activated(AwareDatetime(2021, 1, 1, 23, 0, 0, 0, timezone.utc))
    # Too early (and too late)
    assert not setting.is_activated(
        AwareDatetime(2021, 1, 1, 12, 0, 0, 0, timezone.utc)
    )


def test_is_activated_weekday_range() -> None:
    week_set = set(
        [
            DayOfWeek.MONDAY,
            DayOfWeek.TUESDAY,
            DayOfWeek.WEDNESDAY,
            DayOfWeek.THURSDAY,
            DayOfWeek.SATURDAY,
            DayOfWeek.SUNDAY,
        ]
    )
    setting = construct_alert_setting(
        week_set,
        AwareTime(10, 0, 0, 0, timezone.utc),
        AwareTime(17, 0, 0, 0, timezone.utc),
    )
    assert not setting.is_activated(AwareDatetime(2021, 1, 1, 0, 0, 0, 0, timezone.utc))
