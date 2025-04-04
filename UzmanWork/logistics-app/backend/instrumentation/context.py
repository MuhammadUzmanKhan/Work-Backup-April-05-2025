from contextvars import ContextVar

from backend.instrumentation.influx_serializer import InfluxSerializer

# This context can be used to make a serializer available to the current request.
instrumentation_context: ContextVar[InfluxSerializer | None] = ContextVar(
    "instrumentation", default=None
)


async def set_instrumentation_in_context(serializer: InfluxSerializer) -> None:
    instrumentation_context.set(serializer)


async def get_instrumentation_from_context() -> InfluxSerializer | None:
    return instrumentation_context.get()


async def reset_instrumentation_in_context() -> None:
    instrumentation_context.set(None)
