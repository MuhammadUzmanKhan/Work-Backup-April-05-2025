import logging

from fastapi import APIRouter, Depends

from backend import auth, auth_models, logging_config
from backend.database import database, models, orm
from backend.dependencies import get_backend_database, get_value_store
from backend.models import EventsIngestionResponse
from backend.thumbnail.utils import filter_thumbnails_request_by_nvr
from backend.thumbnail.value_store_utils import update_most_recent_thumbnails
from backend.value_store.value_store import ValueStore

logger = logging.getLogger(logging_config.LOGGER_NAME)


thumbnail_router_edge = APIRouter(
    prefix="/thumbnail",
    tags=["thumbnail"],
    generate_unique_id_function=lambda route: route.name,
)


@thumbnail_router_edge.post("/register_thumbnails")
async def register_thumbnails(
    register_thumbnails_request: models.RegisterThumbnailsRequest,
    db: database.Database = Depends(get_backend_database),
    value_store: ValueStore = Depends(get_value_store),
    edge_user: auth_models.EdgeUser = Depends(auth.edge_user_role_guard),
) -> EventsIngestionResponse:
    """Register a batch of thumbnails. This endpoint will be called by the edge.

    :param register_thumbnails_request: The batch of thumbnail data to register. The
    thumbnails don't necessarily need to be for the same camera.

    :raises fastapi.HTTPException: HTTP 400 error is raised if a camera is not
    found.
    """
    nvr_uuid = edge_user.user_uuid
    async with db.tenant_session() as session:
        filtered_register_thumbnails_request = await filter_thumbnails_request_by_nvr(
            session, register_thumbnails_request, nvr_uuid
        )

        if len(filtered_register_thumbnails_request.thumbnails) != len(
            register_thumbnails_request.thumbnails
        ):
            logger.error(
                "Received thumbnails with mac addresses that don't belong to the NVR"
                f" {nvr_uuid}. Received: {register_thumbnails_request=}"
            )

        await orm.Thumbnail.add_thumbnail_batch(
            session, filtered_register_thumbnails_request.thumbnails
        )

        await update_most_recent_thumbnails(
            value_store, filtered_register_thumbnails_request.thumbnails
        )
        return EventsIngestionResponse(
            num_events_received=len(register_thumbnails_request.thumbnails),
            num_events_ingested=len(filtered_register_thumbnails_request.thumbnails),
        )
