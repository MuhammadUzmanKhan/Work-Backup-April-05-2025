from typing import Any

import phonenumbers

from backend.utils import AwareDatetime


def validate_end_time_after_start(
    end_time: AwareDatetime, values: dict[str, Any]
) -> AwareDatetime:
    if "start_time" not in values:
        raise ValueError(f"{values=} missing start_time")
    start_time: AwareDatetime = values["start_time"]
    if end_time < start_time:
        raise ValueError(f"{end_time=} can't be before {start_time=}")
    return end_time


def validate_phone_number(v: str) -> str:
    try:
        phone_number = phonenumbers.parse(v)
        if not phonenumbers.is_valid_number(phone_number):
            raise ValueError(f"Phone number {v} is not valid")
    except phonenumbers.phonenumberutil.NumberParseException as ex:
        raise ValueError(f"Phone number {v} failed to parse with error: {ex}")
    return v
