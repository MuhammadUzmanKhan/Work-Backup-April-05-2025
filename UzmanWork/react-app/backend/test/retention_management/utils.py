from datetime import timedelta
from typing import Any, Awaitable, Callable

from pydantic import BaseModel

from backend.utils import AwareDatetime


class CreateConfig(BaseModel):
    num_in: int = 50
    num_out: int = 100


class ExpectedResources(BaseModel):
    num_in: int
    num_out: int = 0

    @staticmethod
    def from_create_config(config: CreateConfig) -> "ExpectedResources":
        return ExpectedResources(num_in=config.num_in, num_out=config.num_out)


TIME_NOW_RETENTION_TESTS = AwareDatetime.from_datetime_str("2024-01-01T00:00:00+00:00")
TIME_SPAN_EVENTS = timedelta(days=10)


async def create_retention_resources(
    create_func: Callable[[AwareDatetime], Awaitable[None]],
    retention_limit_time: AwareDatetime,
    config: CreateConfig,
) -> None:
    for idx in range(config.num_out):
        await create_func(
            retention_limit_time - TIME_SPAN_EVENTS + timedelta(seconds=idx + 1)
        )
    for idx in range(config.num_in):
        await create_func(
            retention_limit_time + TIME_SPAN_EVENTS - timedelta(seconds=idx + 1)
        )


async def verify_deleted_resources(
    verify_func: Callable[[AwareDatetime], Awaitable[list[Any]]],
    retention_limit_time: AwareDatetime,
    expected: ExpectedResources,
) -> None:
    assert len(await verify_func(retention_limit_time)) == expected.num_out
    assert (
        len(await verify_func(retention_limit_time + TIME_SPAN_EVENTS))
        == expected.num_in + expected.num_out
    )
