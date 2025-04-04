import datetime

import pytest

from backend.database import database, orm
from backend.database.models import (
    NVR,
    Camera,
    CameraGroup,
    DetectionObjectTypeCategory,
    ThumbnailCreate,
    ThumbnailType,
)
from backend.database.organization_models import Organization
from backend.database.orm.orm_thumbnail import (
    EmptyThumbnailRequestError,
    MultipleMacAddressThumbnailRequestError,
)
from backend.perception.models import AggregationInterval
from backend.test.factory_types import CameraFactory
from backend.thumbnail.models import ThumbnailResult, ThumbnailTimestampRequest
from backend.utils import AwareDatetime

DEFAULT_START_TIME = AwareDatetime.utcnow() - datetime.timedelta(days=1)
DEFAULT_END_TIME = AwareDatetime.utcnow()
DEFAULT_MIDDLE_TIME = DEFAULT_START_TIME + (DEFAULT_END_TIME - DEFAULT_START_TIME) / 2


def generate_timestamps(
    start_time: AwareDatetime,
    end_time: AwareDatetime,
    gap: datetime.timedelta = datetime.timedelta(hours=1),
) -> list[AwareDatetime]:
    """Generate a list of timestamps between start_time and end_time with a gap of
    gap between each timestamp.
    """
    timestamps = []
    current_time = start_time
    while current_time < end_time:
        timestamps.append(current_time)
        current_time += gap

    return timestamps


def generate_thumbnail_requests(
    mac_address: str,
    start_time: AwareDatetime,
    end_time: AwareDatetime,
    gap: datetime.timedelta = datetime.timedelta(hours=1),
    duration: datetime.timedelta = datetime.timedelta(seconds=10),
) -> list[ThumbnailTimestampRequest]:
    """Generate a list of timestamps between start_time and end_time with a gap of
    gap between each timestamp.
    """
    requests = []
    current_time = start_time
    while current_time < end_time:
        requests.append(
            ThumbnailTimestampRequest(
                mac_address=mac_address,
                timestamp=current_time,
                tolerance_s=duration.total_seconds(),
            )
        )
        current_time += gap
    return requests


def generate_thumbnails(
    mac_address: str, timestamps: list[AwareDatetime]
) -> list[ThumbnailCreate]:
    """Util function to generate a list of thumbnails."""
    return [
        ThumbnailCreate(
            camera_mac_address=mac_address,
            timestamp=timestamp,
            s3_path="s3://test_bucket/test_",
            thumbnail_type=ThumbnailType.THUMBNAIL,
        )
        for timestamp in timestamps
    ]


def check_aggregation(
    aggregation: AggregationInterval,
    expected_start: AwareDatetime,
    expected_end: AwareDatetime,
    expected_type: DetectionObjectTypeCategory,
) -> None:
    """Check an aggregation object for correctness.

    :param aggregation: the aggregation object
    :param expected_start: the expected start time
    :param expected_end: the expected end time
    :param expected_type: the expected detection type
    """
    assert aggregation.object_category == expected_type
    assert (aggregation.start_time - expected_start) < datetime.timedelta(seconds=1)
    assert (aggregation.end_time - expected_end) < datetime.timedelta(seconds=1)


def _validate_thumbmails_timestamps(
    thumbnails: list[ThumbnailResult],
    start_time: AwareDatetime,
    end_time: AwareDatetime,
) -> None:
    time = start_time
    for thumbnail in thumbnails:
        assert thumbnail.timestamp == time
        time += datetime.timedelta(seconds=1)

    assert abs(time - end_time) <= datetime.timedelta(seconds=1)


async def test_get_all_thumbnails_in_time_range(
    db_instance: database.Database, camera: Camera, organization: Organization
) -> None:
    start_time = AwareDatetime.utcnow() - datetime.timedelta(minutes=3)
    end_time = AwareDatetime.utcnow()
    timestamps = generate_timestamps(
        start_time, end_time, datetime.timedelta(seconds=1)
    )
    thumbnails = generate_thumbnails(camera.mac_address, timestamps)

    async with db_instance.tenant_session(tenant=organization.tenant) as session:
        await orm.Thumbnail.add_thumbnail_batch(session, thumbnails)

        result_thumbnails = await orm.Thumbnail.get_all_thumbnails_in_time_range(
            session, camera.mac_address, start_time, end_time
        )

        assert len(result_thumbnails) == len(thumbnails)
        _validate_thumbmails_timestamps(result_thumbnails, start_time, end_time)

        result_thumbnails = await orm.Thumbnail.get_all_thumbnails_in_time_range(
            session,
            camera.mac_address,
            start_time + datetime.timedelta(seconds=1),
            end_time - datetime.timedelta(seconds=1),
        )

        assert len(result_thumbnails) == len(thumbnails) - 2
        _validate_thumbmails_timestamps(
            result_thumbnails,
            start_time + datetime.timedelta(seconds=1),
            end_time - datetime.timedelta(seconds=1),
        )

        result_thumbnails = await orm.Thumbnail.get_all_thumbnails_in_time_range(
            session, camera.mac_address, start_time, start_time
        )

        assert len(result_thumbnails) == 1
        _validate_thumbmails_timestamps(result_thumbnails, start_time, start_time)


async def test_get_thumbnails_empty(
    db_instance: database.Database, camera: Camera, organization: Organization
) -> None:
    """Test that if there no thumbnails we return an empty dict."""
    requests = generate_thumbnail_requests(
        camera.mac_address, DEFAULT_START_TIME, DEFAULT_END_TIME
    )
    async with db_instance.tenant_session(tenant=organization.tenant) as session:
        thumbnails = await orm.Thumbnail.get_thumbnails_at_timestamp(session, requests)
    assert len(thumbnails) == len(requests)
    assert all([thumb is None for thumb in thumbnails])


async def test_get_thumbnails_no_match(
    db_instance: database.Database, camera: Camera, organization: Organization
) -> None:
    """Test that if there are no thumbnails that match the timestamps we return empty"""
    requests = generate_thumbnail_requests(
        camera.mac_address, DEFAULT_START_TIME, DEFAULT_END_TIME
    )

    # offset the timestamps by more than the tolerance
    timestamps_thumbnails = [
        request.timestamp + datetime.timedelta(seconds=request.tolerance_s * 2)
        for request in requests
    ]

    async with db_instance.tenant_session(tenant=organization.tenant) as session:
        await orm.Thumbnail.add_thumbnail_batch(
            session, generate_thumbnails(camera.mac_address, timestamps_thumbnails)
        )
        thumbnails = await orm.Thumbnail.get_thumbnails_at_timestamp(session, requests)
    assert len(thumbnails) == len(requests)
    assert all([thumb is None for thumb in thumbnails])


async def test_get_thumbnails_partial_match(
    db_instance: database.Database, camera: Camera, organization: Organization
) -> None:
    """Test that we can match only part of the requested timestamps."""
    requests = generate_thumbnail_requests(
        camera.mac_address, DEFAULT_START_TIME, DEFAULT_END_TIME
    )

    half_length = len(requests) // 2

    # offset half by less and half by more than the lookup tolerance
    timestamps_query = [
        request.timestamp + datetime.timedelta(seconds=request.tolerance_s / 2)
        for request in requests[:half_length]
    ] + [
        request.timestamp + datetime.timedelta(seconds=request.tolerance_s * 2)
        for request in requests[half_length:]
    ]

    async with db_instance.tenant_session(tenant=organization.tenant) as session:
        await orm.Thumbnail.add_thumbnail_batch(
            session, generate_thumbnails(camera.mac_address, timestamps_query)
        )
        thumbnails = await orm.Thumbnail.get_thumbnails_at_timestamp(session, requests)
    assert len(thumbnails) == len(timestamps_query)
    thumbnails_first_half = thumbnails[:half_length]
    thumbnails_second_half = thumbnails[half_length:]
    assert None not in thumbnails_first_half
    assert all([thumb is None for thumb in thumbnails_second_half])


async def test_get_thumbnails_unsorted_match(
    db_instance: database.Database, camera: Camera, organization: Organization
) -> None:
    """Test that if the timestamps are unsorted we return the correct thumbnails."""
    requests = generate_thumbnail_requests(
        camera.mac_address, DEFAULT_START_TIME, DEFAULT_END_TIME
    )

    # offset the timestamps by less than the lookup tolerance
    timestamps_thumbnails = [
        request.timestamp + datetime.timedelta(seconds=request.tolerance_s / 2)
        for request in requests
    ]

    # flip the order of the query
    requests = requests[::-1]

    async with db_instance.tenant_session(tenant=organization.tenant) as session:
        await orm.Thumbnail.add_thumbnail_batch(
            session, generate_thumbnails(camera.mac_address, timestamps_thumbnails)
        )
        thumbnails = await orm.Thumbnail.get_thumbnails_at_timestamp(session, requests)

    assert len(thumbnails) == len(requests)
    for thumbnail, request in zip(thumbnails, requests):
        assert thumbnail is not None
        assert (thumbnail.timestamp - request.timestamp) < datetime.timedelta(
            seconds=request.tolerance_s
        )


async def test_get_thumbnails_different_intervals(
    db_instance: database.Database, camera: Camera, organization: Organization
) -> None:
    """Test that everything works if requests have different duration."""

    requests = generate_thumbnail_requests(
        camera.mac_address, DEFAULT_START_TIME, DEFAULT_MIDDLE_TIME
    ) + generate_thumbnail_requests(
        camera.mac_address,
        DEFAULT_MIDDLE_TIME,
        DEFAULT_END_TIME,
        duration=datetime.timedelta(seconds=60),
    )

    # offset the timestamps by less than the lookup tolerance
    timestamps_thumbnails = [
        request.timestamp + datetime.timedelta(seconds=request.tolerance_s / 2)
        for request in requests
    ]

    async with db_instance.tenant_session(tenant=organization.tenant) as session:
        await orm.Thumbnail.add_thumbnail_batch(
            session, generate_thumbnails(camera.mac_address, timestamps_thumbnails)
        )
        thumbnails = await orm.Thumbnail.get_thumbnails_at_timestamp(session, requests)

    assert len(thumbnails) == len(requests)
    assert None not in thumbnails


async def test_get_thumbnails_empty_request(
    db_instance: database.Database, camera: Camera, organization: Organization
) -> None:
    """Test that everything works if requests have different duration."""
    timestamps = generate_timestamps(DEFAULT_START_TIME, DEFAULT_END_TIME)

    async with db_instance.tenant_session(tenant=organization.tenant) as session:
        await orm.Thumbnail.add_thumbnail_batch(
            session, generate_thumbnails(camera.mac_address, timestamps)
        )
        with pytest.raises(EmptyThumbnailRequestError):
            await orm.Thumbnail.get_thumbnails_at_timestamp(session, [])


async def test_get_thumbnails_multiple_mac_addresses(
    db_instance: database.Database,
    camera: Camera,
    camera_group: CameraGroup,
    nvr: NVR,
    create_camera: CameraFactory,
    organization: Organization,
) -> None:
    """Test that everything works if requests have different duration."""
    another_camera = await create_camera(
        camera_group_id=camera_group.id, nvr_uuid=nvr.uuid
    )

    requests = generate_thumbnail_requests(
        camera.mac_address, DEFAULT_START_TIME, DEFAULT_MIDDLE_TIME
    ) + generate_thumbnail_requests(
        another_camera.mac_address, DEFAULT_MIDDLE_TIME, DEFAULT_END_TIME
    )

    async with db_instance.tenant_session(tenant=organization.tenant) as session:
        await orm.Thumbnail.add_thumbnail_batch(
            session,
            generate_thumbnails(
                camera.mac_address, [request.timestamp for request in requests]
            ),
        )
        with pytest.raises(MultipleMacAddressThumbnailRequestError):
            await orm.Thumbnail.get_thumbnails_at_timestamp(session, requests)
