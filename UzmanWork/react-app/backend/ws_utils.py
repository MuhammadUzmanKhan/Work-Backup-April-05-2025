import asyncio
import logging
from typing import Any, Awaitable, Callable, Type

import aio_pika
import fastapi
import pydantic
from fastapi import WebSocket, WebSocketDisconnect
from pamqp.common import FieldValue
from websockets.exceptions import ConnectionClosedError

from backend import auth, envs, logging_config
from backend.auth_models import AwsCognitoClient
from backend.instrumentation.utils import (
    instrument_websocket_failure,
    instrument_websocket_message,
)
from backend.ws_models import (
    APIConnectedFrame,
    APIConnectFrame,
    APIErrorFrame,
    APISubscribeFrame,
    BasicAPIFrame,
    ConnectBody,
    ProtocolError,
)

logger = logging.getLogger(logging_config.LOGGER_NAME)


class QueueSettings(pydantic.BaseModel):
    name: str
    max_messages: int | None = None

    @property
    def arguments(self) -> dict[str, FieldValue] | None:
        if self.max_messages is None:
            return None
        return {"x-max-length": self.max_messages}


QueueFactoryType = Callable[[str], QueueSettings]

ON_DEMAND_STREAMING_QUEUE_FACTORY: QueueFactoryType = lambda nvr_uuid: QueueSettings(
    name=f"{nvr_uuid}-on-demand-streaming", max_messages=500
)

TEXT_SEARCH_QUEUE_FACTORY: QueueFactoryType = lambda nvr_uuid: QueueSettings(
    name=f"{nvr_uuid}-text-search", max_messages=50
)

JOURNEY_EMBEDDING_QUEUE_FACTORY: QueueFactoryType = lambda nvr_uuid: QueueSettings(
    name=f"{nvr_uuid}-journey-embedding", max_messages=50
)

JOURNEY_SEARCH_QUEUE_FACTORY: QueueFactoryType = lambda nvr_uuid: QueueSettings(
    name=f"{nvr_uuid}-journey-search", max_messages=50
)

DISCOVERY_QUEUE_FACTORY: QueueFactoryType = lambda nvr_uuid: QueueSettings(
    name=f"{nvr_uuid}-discovery", max_messages=50
)


async def _receive_basic_frame(websocket: fastapi.WebSocket) -> BasicAPIFrame:
    """Waits for a basic frame to be received and parses it"""
    text = await websocket.receive_text()
    return pydantic.parse_raw_as(BasicAPIFrame, text)  # type: ignore[arg-type]


async def receive_subscribe_nvr_uuid(websocket: fastapi.WebSocket) -> str:
    """Waits for a frame and returns the nvr uuid in it"""
    frame = await _receive_basic_frame(websocket)
    if not isinstance(frame, APISubscribeFrame):
        raise ProtocolError(f"Received unexpected frame {frame}")

    return frame.body.nvr_uuid


async def receive_auth_body(websocket: fastapi.WebSocket) -> ConnectBody:
    """Waits for an APIConnectFrame and returns the auth token inside."""
    frame = await _receive_basic_frame(websocket)
    if not isinstance(frame, APIConnectFrame):
        raise ProtocolError(f"Received unexpected frame {frame}")

    return frame.body


async def establish_connection(
    websocket: fastapi.WebSocket, aws_cognito_client: AwsCognitoClient
) -> str | None:
    """Establishes a websocket connection with the client and returns the nvr uuid."""
    await websocket.accept()

    auth_body = await receive_auth_body(websocket)
    auth_token = auth_body.auth_token

    user = await auth.get_edge_user_from_aws_cognito_token(
        token=auth_token, aws_cognito_client=aws_cognito_client
    )

    if user is None:
        logger.info("User not authenticated")
        await websocket.send_text(APIErrorFrame(details="Not authenticated").json())
        return None

    await websocket.send_text(APIConnectedFrame().json())
    nvr_uuid = await receive_subscribe_nvr_uuid(websocket)
    if nvr_uuid != user.user_uuid:
        await websocket.send_text(
            APIErrorFrame(
                details=f"User {user.user_uuid} tried to subscribe as {nvr_uuid}"
            ).json()
        )
        return None
    return nvr_uuid


# TODO(@lberg): this is a temporary solution to track the ws status
# the edge is not expecting this message, so it currently logs error
class PingMessage(pydantic.BaseModel):
    value: str = "ping"


async def iterate_queue(
    channel: aio_pika.abc.AbstractChannel,
    queue_settings: QueueSettings,
    websocket: WebSocket,
    message_frame_class: Type[pydantic.BaseModel],
    # any because of https://github.com/pydantic/pydantic/issues/1847
    message_body_class: Any,
    on_message_sent: Callable[[str], Awaitable[None]],
) -> None:
    """Start a queue iterator and send the messages to the websocket."""
    queue = await channel.declare_queue(
        queue_settings.name, arguments=queue_settings.arguments
    )
    # use an async lock to avoid sending parallel messages
    lock = asyncio.Lock()

    # NOTE(@lberg): this is used to keep track of the ws status
    async def ping_loop() -> None:
        while True:
            async with lock:
                await websocket.send_text(PingMessage().json())
            await asyncio.sleep(15)

    async def message_loop() -> None:
        async with queue.iterator() as queue_iter:
            async for message in queue_iter:
                body_decoded = message.body.decode()
                try:
                    body = pydantic.parse_raw_as(message_body_class, body_decoded)
                    frame = message_frame_class(body=body)
                    async with lock:
                        await websocket.send_text(frame.json())
                    # NOTE(@lberg): for unions this will be the actual class name
                    await on_message_sent(type(body).__name__)
                except pydantic.ValidationError as ex:
                    logger.error(f"[WS-utils] Failed to parse {body_decoded=}: {ex}")
                    raise ex
                finally:
                    # ack the message even if we failed
                    await message.ack()

    tasks = [asyncio.create_task(ping_loop()), asyncio.create_task(message_loop())]
    try:
        await asyncio.gather(*tasks)
    except (WebSocketDisconnect, ConnectionClosedError) as ex:
        logger.info("Canceling tasks due to websocket disconnect")
        for task in tasks:
            task.cancel()
        logger.info("Tasks successfully canceled")
        raise ex


async def connect_to_nvr(
    feature_name: str,
    websocket: fastapi.WebSocket,
    aws_cognito_client: AwsCognitoClient,
    queue_settings_factory: QueueFactoryType,
    backend_envs: envs.BackendEnvs,
    mq_connection: aio_pika.abc.AbstractRobustConnection,
    message_frame_class: Type[pydantic.BaseModel],
    message_body_class: Any,
) -> None:
    """A helper function to connect to an NVR and start a queue iterator."""
    nvr_uuid: str | None = None
    try:
        nvr_uuid = await establish_connection(
            websocket, aws_cognito_client=aws_cognito_client
        )
        if nvr_uuid is None:
            return
        logger.info(f"Subscribing to nvr: {nvr_uuid} for {feature_name}!")
    except (WebSocketDisconnect, ConnectionClosedError) as ex:
        logger.info(f"Websocket failed to connect {feature_name}: {ex}")
        raise ex

    async def on_message_sent(msg_class_name: str) -> None:
        if not backend_envs.disable_instrumentation_middleware:
            await instrument_websocket_message(
                feature_name, msg_class_name, nvr_uuid, backend_envs.api_target
            )

    try:
        # Set up the queue to receive text search requests
        async with await mq_connection.channel() as channel:
            await iterate_queue(
                channel,
                queue_settings_factory(nvr_uuid),
                websocket,
                message_frame_class,
                message_body_class,
                on_message_sent,
            )

    except (WebSocketDisconnect, ConnectionClosedError) as ex:
        logger.info(f"Websocket disconnected {feature_name}: {ex}")
        if not backend_envs.disable_instrumentation_middleware:
            await instrument_websocket_failure(
                feature_name, nvr_uuid, backend_envs.api_target
            )
        raise ex
