import logging

import aio_pika
from fastapi import APIRouter, Depends, WebSocket

from backend import auth, auth_models, dependencies, envs, logging_config, ws_utils
from backend.auth_models import AwsCognitoClient
from backend.database import database, models, orm
from backend.text_search import protocol_models

logger = logging.getLogger(logging_config.LOGGER_NAME)

text_search_router_edge = APIRouter(
    prefix="/text_search",
    tags=["text_search"],
    generate_unique_id_function=lambda route: route.name,
)


@text_search_router_edge.websocket("/")
async def websocket_endpoint(
    websocket: WebSocket,
    mq_connection: aio_pika.abc.AbstractRobustConnection = Depends(
        dependencies.get_mq_connection
    ),
    backend_envs: envs.BackendEnvs = Depends(dependencies.get_backend_envs),
    aws_cognito_client: AwsCognitoClient = Depends(dependencies.get_aws_cognito_client),
) -> None:
    """Websocket endpoint for text search"""
    await ws_utils.connect_to_nvr(
        "text-search",
        websocket,
        aws_cognito_client,
        ws_utils.TEXT_SEARCH_QUEUE_FACTORY,
        backend_envs,
        mq_connection,
        protocol_models.SearchAPIMessageFrame,
        protocol_models.SearchRequestBody,
    )


@text_search_router_edge.post("/register_response")
async def register_response_endpoint(
    response_create: models.TextSearchResponseCreate,
    db: database.Database = Depends(dependencies.get_backend_database),
    _edge_user: auth_models.EdgeUser = Depends(auth.edge_user_role_guard),
) -> None:
    async with db.tenant_session() as session:
        await orm.TextSearchResponse.add_response_batch(session, response_create)
        await orm.TextSearchResponseStatus.register_response(
            session, response_create.request_id, response_create.nvr_uuid
        )
