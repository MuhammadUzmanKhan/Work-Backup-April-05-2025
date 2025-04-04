from datetime import timedelta

from backend.database import orm
from backend.database.models import RegisterMctImagesRequest
from backend.database.session import TenantAwareAsyncSession
from backend.multi_cam_tracking.models import JourneyIntervalBase, RankedJourneyInterval

MAX_JOURNEY_DURATION = timedelta(minutes=5)


def merge_journey_intervals(
    ranked_intervals: list[RankedJourneyInterval],
    tolerance: timedelta = timedelta(seconds=1),
    max_duration: timedelta = MAX_JOURNEY_DURATION,
) -> list[JourneyIntervalBase]:
    """Merge overlapping intervals.

    :param intervals: the list of ranked intervals to merge
    :param tolerance_s: tolerance for merging (merge intervals if temporal distance
        is less than tolerance_s)
    """
    if not ranked_intervals:
        return []

    sorted_intervals = sorted(
        ranked_intervals, key=lambda interval_el: interval_el.interval.start_time
    )
    merged_intervals = [sorted_intervals[0]]

    for interval in sorted_intervals[1:]:
        if (
            interval.interval.start_time
            <= merged_intervals[-1].interval.end_time + tolerance
            and merged_intervals[-1].interval.end_time
            - merged_intervals[-1].interval.start_time
            < max_duration
            and interval.interval.mac_address
            == merged_intervals[-1].interval.mac_address
        ):
            merged_intervals[-1] = merged_intervals[-1].merge_with(interval)
        else:
            merged_intervals.append(interval)

    # Sort the merged intervals by their rank to restore the correct ordering
    # based on score.
    sorted_intervals = sorted(merged_intervals, key=lambda interval: interval.rank)

    return [interval.interval for interval in sorted_intervals]


async def filter_mct_images_by_nvr(
    session: TenantAwareAsyncSession, request: RegisterMctImagesRequest, nvr_uuid: str
) -> RegisterMctImagesRequest:
    received_mac_addresses = [
        mct_image.camera_mac_address for mct_image in request.mct_images
    ]
    allowed_mac_addresses = await orm.NVR.get_allowed_mac_addresses(
        session, nvr_uuid, received_mac_addresses
    )
    return RegisterMctImagesRequest(
        mct_images=[
            mct_img
            for mct_img in request.mct_images
            if mct_img.camera_mac_address in allowed_mac_addresses
        ]
    )
