import logging
from datetime import timedelta

import aio_pika
from fastapi import APIRouter, Depends, WebSocket

from backend import auth, auth_models, dependencies, envs, logging_config, ws_utils
from backend.auth_models import AwsCognitoClient
from backend.database import database, models, orm
from backend.dependencies import get_backend_database, get_value_store
from backend.models import EventsIngestionResponse
from backend.multi_cam_tracking import protocol_models
from backend.multi_cam_tracking.utils import filter_mct_images_by_nvr
from backend.utils import AwareDatetime
from backend.value_store import ValueStore

logger = logging.getLogger(logging_config.LOGGER_NAME)

mct_images_router_edge = APIRouter(
    prefix="/journey",
    tags=["journey"],
    generate_unique_id_function=lambda route: route.name,
)


# The Key used to store the journey response status in the value store.
JOURNEY_RESPONSE_STATUS_KEY = "{request_id}-{nvr_uuid}"


@mct_images_router_edge.websocket("/embedding_websocket")
async def embedding_websocket_endpoint(
    websocket: WebSocket,
    mq_connection: aio_pika.abc.AbstractRobustConnection = Depends(
        dependencies.get_mq_connection
    ),
    backend_envs: envs.BackendEnvs = Depends(dependencies.get_backend_envs),
    aws_cognito_client: AwsCognitoClient = Depends(dependencies.get_aws_cognito_client),
) -> None:
    """Websocket endpoint for the embedding request."""
    await ws_utils.connect_to_nvr(
        "embedding_request",
        websocket,
        aws_cognito_client,
        ws_utils.JOURNEY_EMBEDDING_QUEUE_FACTORY,
        backend_envs,
        mq_connection,
        protocol_models.EmbeddingAPIMessageFrame,
        protocol_models.EmbeddingRequestBody,
    )


@mct_images_router_edge.websocket("/journey_websocket")
async def journey_websocket_endpoint(
    websocket: WebSocket,
    mq_connection: aio_pika.abc.AbstractRobustConnection = Depends(
        dependencies.get_mq_connection
    ),
    backend_envs: envs.BackendEnvs = Depends(dependencies.get_backend_envs),
    aws_cognito_client: AwsCognitoClient = Depends(dependencies.get_aws_cognito_client),
) -> None:
    """Websocket endpoint for the Journey search request."""
    await ws_utils.connect_to_nvr(
        "journey_request",
        websocket,
        aws_cognito_client,
        ws_utils.JOURNEY_SEARCH_QUEUE_FACTORY,
        backend_envs,
        mq_connection,
        protocol_models.JourneyAPIMessageFrame,
        protocol_models.JourneyRequestBody,
    )


@mct_images_router_edge.post("/register_mct_images")
async def register_mct_images(
    register_mct_images_request: models.RegisterMctImagesRequest,
    db: database.Database = Depends(get_backend_database),
    edge_user: auth_models.EdgeUser = Depends(auth.edge_user_role_guard),
) -> EventsIngestionResponse:
    """Register a batch of MCT images. This endpoint will be called by the edge."""
    nvr_uuid = edge_user.user_uuid
    async with db.tenant_session() as session:
        filtered_request = await filter_mct_images_by_nvr(
            session, register_mct_images_request, nvr_uuid
        )
        if filtered_request != register_mct_images_request:
            logger.error(
                "Received mct images with mac addresses that don't belong to the NVR"
                f" {nvr_uuid}. Received: {register_mct_images_request}"
            )

    async with db.tenant_session() as session:
        mct_images = filtered_request.mct_images
        # TODO(@lberg): remove once we drop the primary key
        keys_in_db = await orm.MctImage.get_keys_already_in_db(session, mct_images)
        if len(keys_in_db):
            logger.error(
                f"[MctImage] Found the following {len(keys_in_db)} keys already in the"
                f" DB: {keys_in_db} while inserting {len(mct_images)} images."
            )
            mct_images = [
                mct_image
                for mct_image in mct_images
                if models.MctImageKey(**mct_image.dict()) not in keys_in_db
            ]
        await orm.MctImage.add_mct_image_batch(session, mct_images)
    return EventsIngestionResponse(
        num_events_received=len(register_mct_images_request.mct_images),
        num_events_ingested=len(mct_images),
    )


@mct_images_router_edge.post("/register_embedding_response")
async def register_embedding_response(
    response_create: models.EmbeddingResponseCreate,
    db: database.Database = Depends(get_backend_database),
    _edge_user: auth_models.EdgeUser = Depends(auth.edge_user_role_guard),
) -> None:
    """Register the embedding response in the DB."""
    async with db.tenant_session() as session:
        await orm.EmbeddingResponse.add_response(session, response_create)


@mct_images_router_edge.post("/register_journey_response")
async def register_journey_response(
    response_create: models.JourneyResponseCreate,
    db: database.Database = Depends(get_backend_database),
    value_store: ValueStore = Depends(get_value_store),
    _edge_user: auth_models.EdgeUser = Depends(auth.edge_user_role_guard),
) -> None:
    async with db.tenant_session() as session:
        await orm.JourneyResponse.add_response_batch(session, response_create)
        await value_store.set_timestamp(
            key=JOURNEY_RESPONSE_STATUS_KEY.format(
                request_id=response_create.request_id, nvr_uuid=response_create.nvr_uuid
            ),
            time=AwareDatetime.utcnow(),
            expiration=timedelta(days=7),
        )
