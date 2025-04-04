import asyncio
import logging
from typing import Any, Awaitable

from fastapi import Request, Response

from backend.instrumentation.influx_serializer import InfluxSerializer

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

# TODO move to config
TELEGRAF_HOSTNAME = "telegraf"
TELEGRAF_PORT = 9000


def _get_unparametrized_path(request: Request) -> str:
    path = request.url.path
    for key, val in request.path_params.items():
        path = path.replace(val, f"{{{key}}}", 1)
    return path


async def _send_msg_to_telegraf(msg: str) -> None:
    """Send a message to telegraf via UDP."""
    loop = asyncio.get_running_loop()
    transport, _ = await loop.create_datagram_endpoint(
        lambda: asyncio.DatagramProtocol(),
        remote_addr=(TELEGRAF_HOSTNAME, TELEGRAF_PORT),
    )
    transport.sendto(msg.encode())
    transport.close()


async def _ensure_no_fail(callback: Awaitable[Any]) -> None:
    """Ensure that callback does not fail."""
    # NOTE(@lberg): this is not a good pattern, but we don't want to fail the request
    # if instrumentation fails. This should not be used for anything other than
    # instrumentation.
    try:
        await callback
    except Exception as exc:
        logger.error("Failed to record request instrumentation", exc_info=exc)


async def instrument_api_request(
    request: Request,
    response: Response | None,
    duration: float,
    serializer: InfluxSerializer,
) -> None:
    """Instrument an API request."""

    async def _instrument_api_request() -> None:
        serializer.add_tag("method", request.method)
        serializer.add_tag("url", _get_unparametrized_path(request))
        serializer.add_tag("raw_url", request.url.path)
        serializer.add_field("duration", duration)
        if request.client:
            serializer.add_tag("ip", str(request.client.host))

        if response:
            serializer.add_tag("status_code", str(response.status_code))
        else:
            serializer.add_tag("status_code", "500")

        message = serializer.get_as_string()
        await _send_msg_to_telegraf(message)

    await _ensure_no_fail(_instrument_api_request())


async def instrument_websocket_message(
    feature_name: str, msg_class_name: str, nvr_uuid: str, api_target: str
) -> None:
    serializer = InfluxSerializer(measurement_name=f"websocket_messages_{api_target}")

    async def _instrument_websocket_message() -> None:
        serializer.add_tag("feature", feature_name)
        serializer.add_tag("nvr_uuid", nvr_uuid)
        serializer.add_tag("msg_class", msg_class_name)
        # NOTE(@lberg): this is a dummy value as we need at least one field
        serializer.add_field("value", 1)
        message = serializer.get_as_string()
        await _send_msg_to_telegraf(message)

    await _ensure_no_fail(_instrument_websocket_message())


async def instrument_websocket_failure(
    feature_name: str, nvr_uuid: str, api_target: str
) -> None:
    serializer = InfluxSerializer(measurement_name=f"websocket_failure_{api_target}")

    async def _instrument_websocket_message() -> None:
        serializer.add_tag("feature", feature_name)
        serializer.add_tag("nvr_uuid", nvr_uuid)
        # NOTE(@lberg): this is a dummy value as we need at least one field
        serializer.add_field("value", 1)
        message = serializer.get_as_string()
        await _send_msg_to_telegraf(message)

    await _ensure_no_fail(_instrument_websocket_message())


async def instrument_celery_tasks(
    task_name: str, duration: float, success: bool
) -> None:
    """Instrument a celery task."""

    async def _instrument_celery_tasks() -> None:
        serializer = InfluxSerializer(measurement_name="celery_tasks")
        serializer.add_tag("task_name", task_name)
        serializer.add_tag("success", str(success))
        serializer.add_field("duration", duration)
        message = serializer.get_as_string()
        await _send_msg_to_telegraf(message)

    await _ensure_no_fail(_instrument_celery_tasks())


InstrumentFn = Awaitable[str]


async def instrument(fn: InstrumentFn) -> None:
    async def _fn() -> None:
        message = await fn
        await _send_msg_to_telegraf(message)

    await _ensure_no_fail(_fn())
