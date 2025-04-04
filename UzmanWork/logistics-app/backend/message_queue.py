from datetime import timedelta

import aio_pika
import pydantic

from backend.ws_utils import QueueSettings


async def publish_message(
    mq_connection: aio_pika.abc.AbstractRobustConnection,
    queue_settings: QueueSettings,
    message: pydantic.BaseModel,
    expiration: timedelta | None = timedelta(seconds=30),
) -> None:
    """Publish a given message to the given queue."""
    async with mq_connection.channel() as channel:
        await channel.declare_queue(
            queue_settings.name, arguments=queue_settings.arguments
        )
        await channel.default_exchange.publish(
            aio_pika.Message(body=message.json().encode(), expiration=expiration),
            routing_key=queue_settings.name,
        )
