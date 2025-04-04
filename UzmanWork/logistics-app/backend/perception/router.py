import logging

import fastapi
from fastapi import APIRouter, Body, Depends, HTTPException

from backend import auth, auth_models, logging_config
from backend.constants import (
    ANALYTICS_EXCLUDED_TRACK_IDS,
    ANALYTICS_MIN_CONFIDENCE_THRESHOLD,
    MIN_AGGREGATED_EVENT_LENGTH,
)
from backend.database import database, orm
from backend.dependencies import get_backend_database
from backend.fastapi_utils import WithResponseExcludeNone
from backend.models import AccessRestrictions
from backend.perception.models import (
    AggregationInterval,
    AnalyticsResponse,
    DetectionAggregatedRequest,
    DetectionAnalyticsRequest,
)

perception_router = WithResponseExcludeNone(
    APIRouter(
        prefix="/perceptions",
        tags=["perceptions"],
        generate_unique_id_function=lambda route: route.name,
    )
)

logger = logging.getLogger(logging_config.LOGGER_NAME)


@perception_router.post("/aggregate")
async def category_aggregate_detections(
    aggregation_request: DetectionAggregatedRequest = Body(),
    mac_address: str = Body(),
    _app_user: auth_models.AppUser = Depends(auth.limited_user_role_guard),
    db: database.Database = Depends(get_backend_database),
    access: AccessRestrictions = Depends(auth.get_user_access_restrictions),
) -> list[AggregationInterval]:
    """Returns the list of aggregated detection intervals."""
    async with db.tenant_session(
        session_type=database.SessionType.MODERATELY_SLOW_QUERY
    ) as session:
        if not await orm.Camera.user_has_access_to_mac_addresses(
            session, [mac_address], access
        ):
            raise HTTPException(
                status_code=fastapi.status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions",
            )
        return await orm.PerceptionObjectEvent.aggregate_detections(
            session,
            mac_address,
            aggregation_request.start_time,
            aggregation_request.end_time,
            min_event_length=(
                aggregation_request.min_event_length
                if aggregation_request.min_event_length is not None
                else MIN_AGGREGATED_EVENT_LENGTH
            ),
            moving_detections_only=aggregation_request.moving_detections_only,
            search_polys=aggregation_request.search_polys,
        )


@perception_router.post("/analytics_query")
async def analytics_query(
    request: DetectionAnalyticsRequest = Body(),
    _app_user: auth_models.AppUser = Depends(auth.limited_user_role_guard),
    db: database.Database = Depends(get_backend_database),
    access: AccessRestrictions = Depends(auth.get_user_access_restrictions),
) -> AnalyticsResponse:
    """Returns the list of counted detection intervals."""
    async with db.tenant_session(
        session_type=database.SessionType.MODERATELY_SLOW_QUERY
    ) as session:
        if not await orm.Camera.user_has_access_to_mac_addresses(
            session, [request.mac_address], access
        ):
            raise HTTPException(
                status_code=fastapi.status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions",
            )

        # TODO: this is a temporary solution for easier parameter tuning in the
        # frontend, will be removed once a good default is found.
        confidence_threshold = (
            request.confidence_threshold
            if request.confidence_threshold is not None
            else ANALYTICS_MIN_CONFIDENCE_THRESHOLD
        )

        detection_analytics = await orm.PerceptionObjectEvent.get_detection_analytics(
            session,
            request.start_time,
            request.end_time,
            request.mac_address,
            moving_detections_only=request.moving_detections_only,
            search_polys=request.search_polys,
            confidence_threshold=confidence_threshold,
            excluded_track_ids=ANALYTICS_EXCLUDED_TRACK_IDS,
        )
        tracking_analytics = await orm.PerceptionObjectEvent.get_tracking_analytics(
            session,
            request.start_time,
            request.end_time,
            request.mac_address,
            moving_detections_only=request.moving_detections_only,
            search_polys=request.search_polys,
            confidence_threshold=confidence_threshold,
            excluded_track_ids=ANALYTICS_EXCLUDED_TRACK_IDS,
        )
        return AnalyticsResponse(
            detection_analytics=detection_analytics,
            tracking_analytics=tracking_analytics,
        )
