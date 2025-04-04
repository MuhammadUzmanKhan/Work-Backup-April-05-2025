import random
import string
from datetime import datetime, time, timezone, tzinfo
from typing import Any, Callable, Generator, List, cast

import pytz
from dateutil import parser as date_parser


class AwareDatetime(datetime):
    """A datetime with a timezone."""

    @classmethod
    def __get_validators__(cls) -> Generator[Callable[..., Any], None, None]:
        yield cls.validate

    @classmethod
    def validate(cls, v: str | datetime) -> "AwareDatetime":
        if isinstance(v, cls):
            return v
        if isinstance(v, datetime):
            return AwareDatetime.from_datetime(v)

        return AwareDatetime.from_datetime_str(v)

    @classmethod
    def from_datetime(cls, dt: datetime) -> "AwareDatetime":
        if dt.tzinfo is None:
            raise ValueError(f"timestamp {dt} has no timezone")
        return AwareDatetime(
            dt.year,
            dt.month,
            dt.day,
            dt.hour,
            dt.minute,
            dt.second,
            dt.microsecond,
            dt.tzinfo,
        )

    @classmethod
    def from_datetime_str(cls, dt: str) -> "AwareDatetime":
        # Unfortunately the built-in datetime.fromisoformat does not fully
        # support the complete ISO 8061 date standard. This is a problem when we
        # want to generate such datetimes from C++, since the way puttime
        # generates the timezones is not compatible with datetime.fromisofromat.
        # See details here:
        # https://stackoverflow.com/questions/969285/how-do-i-translate-an-iso-8601-datetime-string-into-a-python-datetime-object
        return AwareDatetime.from_datetime(date_parser.parse(dt))

    @classmethod
    def now(cls, tz: tzinfo | None = None) -> "AwareDatetime":
        if tz is None:
            raise ValueError("now() must be called with a timezone")
        return super().now(tz)

    @classmethod
    def utcnow(cls) -> "AwareDatetime":
        return super().now(timezone.utc)


class AwareTime(time):
    """A time with a timezone."""

    @classmethod
    def __get_validators__(cls) -> Generator[Callable[..., Any], None, None]:
        yield cls.validate

    @classmethod
    def validate(cls, v: str | time) -> "AwareTime":
        if isinstance(v, time):
            if v.tzinfo is None:
                raise ValueError(f"timestamp {v} has no timezone")
            return AwareTime.fromisoformat(v.isoformat())
        # Unfortunately the built-in datetime.fromisoformat does not fully
        # support the complete ISO 8061 date standard. This is a problem when we
        # want to generate such datetimes from C++, since the way puttime
        # generates the timezones is not compatible with datetime.fromisofromat.
        # See details here:
        # https://stackoverflow.com/questions/969285/how-do-i-translate-an-iso-8601-datetime-string-into-a-python-datetime-object
        aware_time = cast(AwareTime, date_parser.parse(v))
        if aware_time.tzinfo is None:
            raise ValueError(f"timestamp {v} has no timezone")
        return aware_time


def validate_timezone(timezone_str: str) -> str:
    try:
        pytz.timezone(timezone_str)
        return timezone_str
    except pytz.exceptions.UnknownTimeZoneError:
        raise ValueError(f"Invalid timezone {timezone_str}")


# Generates a unique tenant name for an organization.
def generate_random_organization_tenant(
    existing_tenants: List[str], string_length: int = 8
) -> str:
    while True:
        tenant = "".join(
            random.choice(string.ascii_lowercase + string.digits)
            for _ in range(string_length)
        )
        if tenant not in existing_tenants:
            return tenant
