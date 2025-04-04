import asyncio
import os
from concurrent.futures import ThreadPoolExecutor
from typing import Any, Callable, TypeVar

from backend.instrumentation.influx_serializer import InfluxSerializer

_R = TypeVar("_R")


# NOTE(@lberg): this is temporary until we switch to only
# using async functions (especially for boto3)
# The number is 12 more than what we have in production
POOL = ThreadPoolExecutor(max_workers=32)


async def run_async(func: Callable[..., _R], *args: Any) -> _R:
    """Helper function to run a function in an asyncio executor."""
    return await asyncio.get_event_loop().run_in_executor(POOL, func, *args)


async def instrument_thread_pool(api_target: str) -> str:
    host_name = os.environ.get("HOSTNAME", "unknown")
    serializer = InfluxSerializer(measurement_name="thread_pool_status")
    serializer.add_tag("docker_container_id", host_name)
    serializer.add_tag("api_target", api_target)
    # this will be >0 if the thread pool is not able to keep up
    # with the number of tasks being submitted
    serializer.add_field("queue_size", POOL._work_queue.qsize())
    return serializer.get_as_string()
