import logging
from enum import Enum
from typing import Sequence

import numpy as np

from backend import logging_config
from backend.database import models, orm
from backend.database.session import TenantAwareAsyncSession
from backend.perception.models import (
    FilteredPerceptionsEvents,
    PerceptionEventsRequest,
    TimedIntersectionRatio,
)
from backend.sync_utils import run_async

logger = logging.getLogger(logging_config.LOGGER_NAME)


class IntersectionType(Enum):
    # Intersection over search area
    IOS = "ios"
    # Intersection over union
    IOU = "iou"


async def detections_intersection_ratio(
    detections: Sequence[models.PerceptionObject],
    search_rectangle: models.SearchAreaRectangle | None,
    intersection_type: IntersectionType = IntersectionType.IOS,
) -> list[float]:
    ratios = await run_async(
        _detections_intersection_ratio_sync,
        detections,
        search_rectangle,
        intersection_type,
    )
    return ratios


def _detections_intersection_ratio_sync(
    detections: Sequence[models.PerceptionObject],
    search_rectangle: models.SearchAreaRectangle | None,
    intersection_type: IntersectionType = IntersectionType.IOS,
) -> list[float]:
    """Compute intersection ratio between N detections and the search rectangle.
    Intersection ratio is bound in [0,1]

    :param detections: detections objects
    :param search_rectangle: the search rectangle
    :param intersection_type: the type of intersection to compute
    :return: N floats with intersection ratios
    """
    if not len(detections):
        return []

    if search_rectangle is None:
        return [1.0] * len(detections)

    # N x 4
    xxyy_detections = np.asarray(
        [(det.x_min, det.y_min, det.x_max, det.y_max) for det in detections],
        dtype=np.float32,
    )
    # 1 x 4
    xxyy_search = np.asarray(
        [
            (
                search_rectangle.coord_min.x,
                search_rectangle.coord_min.y,
                search_rectangle.coord_max.x,
                search_rectangle.coord_max.y,
            )
        ],
        dtype=np.float32,
    )
    # N x 2
    xy_min_detections = xxyy_detections[:, :2]
    xy_max_detections = xxyy_detections[:, 2:]
    # 1 x 2
    xy_min_search = xxyy_search[:, :2]
    xy_max_search = xxyy_search[:, 2:]

    # Find biggest among mins
    # N x 2
    mins = np.maximum(xy_min_detections, xy_min_search)
    # Find smallest among maxs
    # N x 2
    maxs = np.minimum(xy_max_detections, xy_max_search)
    # Compute intersection and clip to 0
    # N
    intersection = np.prod((maxs - mins).clip(0), -1)
    # Compute intersection ratio
    # N
    area_detections = (xy_max_detections - xy_min_detections).prod(-1)

    intersection_ratios: list[float] = []
    if intersection_type == IntersectionType.IOU:
        area_search = (xy_max_search - xy_min_search).prod(-1)
        union = area_detections + area_search - intersection
        intersection_ratios = (intersection / union).tolist()
    elif intersection_type == IntersectionType.IOS:
        intersection_ratios = (intersection / area_detections).tolist()
    else:
        raise ValueError(f"Unknown intersection type {intersection_type}")
    return intersection_ratios


async def detections_polygon_intersection_ratio(
    detections: Sequence[models.PerceptionObject],
    search_region: models.SearchAreaConvexPoly,
) -> list[TimedIntersectionRatio]:
    ratios = await run_async(
        _detections_polygon_intersection_ratio_sync, detections, search_region
    )
    return ratios


def _detections_polygon_intersection_ratio_sync(
    detections: Sequence[models.PerceptionObject],
    search_region: models.SearchAreaConvexPoly,
) -> list[TimedIntersectionRatio]:
    """Compute intersection ratio between N detections and the search polygon.
    Intersection ratio is bound in [0,1]
    :param detections: detections objects
    :param search_region: the search polygon
    :return: N intersection ratios with detection time.
    """
    detection_polygons = [detection.to_shapely_polygon() for detection in detections]
    search_polygon = search_region.to_shapely_polygon()
    if not search_polygon.is_valid:
        logger.warning("Search polygon is not valid, return 0 intersection ratio.")
        return [
            TimedIntersectionRatio(time=detections[idx].time, ratio=0)
            for idx in range(len(detection_polygons))
        ]

    return [
        TimedIntersectionRatio(
            time=detections[idx].time,
            ratio=search_polygon.intersection(detection_polygons[idx]).area
            / detection_polygons[idx].area,
        )
        for idx in range(len(detection_polygons))
    ]


# TODO(@lberg): fake objects should not be sent from the edge
# they create alerts for deleted cameras VAS-3128
def filter_out_fake_detections(
    perception_events_request: PerceptionEventsRequest,
) -> None:
    for perception_event in perception_events_request.events:
        if perception_event.objects is None:
            continue
        perception_event.objects = [
            obj
            for obj in perception_event.objects
            if obj.object_type != models.DetectionObjectType.FAKE_OBJ
        ]


async def filter_perception_events_by_nvr(
    session: TenantAwareAsyncSession,
    perception_events_request: PerceptionEventsRequest,
    nvr_uuid: str,
) -> FilteredPerceptionsEvents:
    received_mac_addresses = [
        event.mac_address for event in perception_events_request.events
    ]
    allowed_mac_addresses = await orm.NVR.get_allowed_mac_addresses(
        session, nvr_uuid, received_mac_addresses
    )
    rejected_mac_addresses = set(received_mac_addresses) - set(allowed_mac_addresses)

    return FilteredPerceptionsEvents(
        accepted_events=[
            event
            for event in perception_events_request.events
            if event.mac_address in allowed_mac_addresses
        ],
        rejected_events=[
            event
            for event in perception_events_request.events
            if event.mac_address in rejected_mac_addresses
        ],
        accepted_mac_addresses=allowed_mac_addresses,
        rejected_mac_addresses=rejected_mac_addresses,
    )
