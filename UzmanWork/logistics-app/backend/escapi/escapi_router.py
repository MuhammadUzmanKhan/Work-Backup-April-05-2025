"""Router for ESCAPI.
https://docs.google.com/document/d/1w9Djj0LlHZPPh0s7aTvarCe-RxxaOOC4jOOfs6l06ic/edit#"""

import logging

import aio_pika
from fastapi import APIRouter, Depends, WebSocket

from backend import dependencies, envs, logging_config, ws_utils
from backend.auth_models import AwsCognitoClient
from backend.escapi import protocol_models

logger = logging.getLogger(logging_config.LOGGER_NAME)

escapi_router_edge = APIRouter(
    prefix="/escapi",
    tags=["escapi"],
    generate_unique_id_function=lambda route: route.name,
)


@escapi_router_edge.websocket("/")
async def websocket_endpoint(
    websocket: WebSocket,
    mq_connection: aio_pika.abc.AbstractRobustConnection = Depends(
        dependencies.get_mq_connection
    ),
    backend_envs: envs.BackendEnvs = Depends(dependencies.get_backend_envs),
    aws_cognito_client: AwsCognitoClient = Depends(dependencies.get_aws_cognito_client),
) -> None:
    """Endpoint for ESCAPI communication.
    Expects authentication and then a subscribe frame
    """
    await ws_utils.connect_to_nvr(
        "on_demand_streaming",
        websocket,
        aws_cognito_client,
        ws_utils.ON_DEMAND_STREAMING_QUEUE_FACTORY,
        backend_envs,
        mq_connection,
        protocol_models.ESCAPIMessageFrame,
        protocol_models.VideoRequestBody,
    )
