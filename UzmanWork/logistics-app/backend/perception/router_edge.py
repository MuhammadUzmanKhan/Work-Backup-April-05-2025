import logging

import fastapi
from fastapi import APIRouter, Body, Depends

from backend import auth, auth_models, dependencies, logging_config
from backend.database import database, models, orm
from backend.dependencies import get_backend_database
from backend.models import EventsIngestionResponse
from backend.perception.models import PerceptionEvent, PerceptionEventsRequest
from backend.perception.utils import (
    filter_out_fake_detections,
    filter_perception_events_by_nvr,
)
from backend.slack_client import SlackClient

perception_router_edge = APIRouter(
    prefix="/perceptions",
    tags=["perceptions"],
    generate_unique_id_function=lambda route: route.name,
)

logger = logging.getLogger(logging_config.LOGGER_NAME)


@perception_router_edge.post("/")
async def add_perception_event(
    # TODO(@lberg): remove None after VAS-2119 is resolved
    perception_events_request: PerceptionEventsRequest | None = Body(None),
    # TODO(@lberg): remove after VAS-2119 is resolved
    perception_event_data_batch: list[PerceptionEvent] | None = Body(None),
    # TODO(@lberg): remove after VAS-2119 is resolved
    detection_objects_batch: list[list[models.PerceptionObjectCreate]] | None = Body(
        None
    ),
    db: database.Database = Depends(get_backend_database),
    edge_user: auth_models.EdgeUser = Depends(auth.edge_user_role_guard),
    slack_client: SlackClient = Depends(dependencies.get_slack_client),
) -> EventsIngestionResponse:
    # TODO(@lberg): remove after VAS-2119 is resolved
    if perception_events_request is None:
        if perception_event_data_batch is None or detection_objects_batch is None:
            raise fastapi.HTTPException(
                status_code=fastapi.status.HTTP_400_BAD_REQUEST,
                detail=(
                    "Either perception_events_request or perception_event_data_batch"
                    " and detection_objects_batch must be provided."
                ),
            )
        if len(perception_event_data_batch) != len(detection_objects_batch):
            raise fastapi.HTTPException(
                status_code=fastapi.status.HTTP_400_BAD_REQUEST,
                detail=(
                    "perception_event_data_batch and detection_objects_batch must have"
                    " the same length."
                ),
            )
        perception_events_request = PerceptionEventsRequest(
            events=[
                PerceptionEvent(
                    time=perception_event_data.time,
                    mac_address=perception_event_data.mac_address,
                    perception_stack_start_id=(
                        perception_event_data.perception_stack_start_id
                    ),
                    objects=detection_objects_batch[idx],
                )
                for idx, perception_event_data in enumerate(perception_event_data_batch)
            ]
        )
    nvr_uuid = edge_user.user_uuid

    # TODO(@lberg): remove once edge stops sending fake objects
    filter_out_fake_detections(perception_events_request)

    async with db.tenant_session() as session:
        filtered_perception_events = await filter_perception_events_by_nvr(
            session, perception_events_request, nvr_uuid
        )
        if filtered_perception_events.rejected_events:
            logger.error(
                "Received detections from mac addresses"
                f" that don't belong to {nvr_uuid=}: "
                f" {filtered_perception_events.rejected_mac_addresses=}"
                f" {filtered_perception_events.rejected_events=}."
            )

        await orm.PerceptionObjectEvent.add_event_batch(
            session, filtered_perception_events.accepted_events
        )
    return EventsIngestionResponse(
        num_events_received=len(perception_events_request.events),
        num_events_ingested=len(filtered_perception_events.accepted_events),
    )
