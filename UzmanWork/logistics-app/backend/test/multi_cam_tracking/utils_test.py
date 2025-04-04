from datetime import timedelta

from backend.database import database
from backend.database.models import (
    NVR,
    Camera,
    CameraGroup,
    Location,
    MctImageCreate,
    RegisterMctImagesRequest,
)
from backend.database.organization_models import Organization
from backend.multi_cam_tracking.models import JourneyIntervalBase, RankedJourneyInterval
from backend.multi_cam_tracking.utils import (
    filter_mct_images_by_nvr,
    merge_journey_intervals,
)
from backend.test.factory_types import CameraFactory, NVRFactory
from backend.utils import AwareDatetime


def _get_ranked_journal_intervals(
    intervals: list[JourneyIntervalBase],
) -> list[RankedJourneyInterval]:
    return [
        RankedJourneyInterval(interval=interval, rank=rank)
        for rank, interval in enumerate(intervals)
    ]


def test_merge_journey_interval_empty() -> None:
    assert merge_journey_intervals([]) == []


def test_merge_journey_interval_different_macs() -> None:
    intervals = [
        JourneyIntervalBase(
            start_time=AwareDatetime.fromisoformat("2021-01-01T00:00:00+00:00"),
            end_time=AwareDatetime.fromisoformat("2021-01-01T00:00:10+00:00"),
            mac_address="mac1",
            thumbnail_s3_path=None,
        ),
        JourneyIntervalBase(
            start_time=AwareDatetime.fromisoformat("2021-01-01T00:00:05+00:00"),
            end_time=AwareDatetime.fromisoformat("2021-01-01T00:00:10+00:00"),
            mac_address="mac2",
            thumbnail_s3_path=None,
        ),
    ]
    assert (
        merge_journey_intervals(_get_ranked_journal_intervals(intervals)) == intervals
    )


def test_merge_journey_interval_over_merge_tolerance() -> None:
    intervals = [
        JourneyIntervalBase(
            start_time=AwareDatetime.fromisoformat("2021-01-01T00:00:00+00:00"),
            end_time=AwareDatetime.fromisoformat("2021-01-01T00:00:10+00:00"),
            mac_address="mac1",
            thumbnail_s3_path=None,
        ),
        JourneyIntervalBase(
            start_time=AwareDatetime.fromisoformat("2021-01-01T00:00:15+00:00"),
            end_time=AwareDatetime.fromisoformat("2021-01-01T00:00:20+00:00"),
            mac_address="mac1",
            thumbnail_s3_path=None,
        ),
    ]
    assert (
        merge_journey_intervals(
            _get_ranked_journal_intervals(intervals), tolerance=timedelta(seconds=4)
        )
        == intervals
    )


def test_merge_journey_interval_over_max_duration() -> None:
    intervals = [
        JourneyIntervalBase(
            start_time=AwareDatetime.fromisoformat("2021-01-01T00:00:00+00:00"),
            end_time=AwareDatetime.fromisoformat("2021-01-01T00:00:10+00:00"),
            mac_address="mac1",
            thumbnail_s3_path=None,
        ),
        JourneyIntervalBase(
            start_time=AwareDatetime.fromisoformat("2021-01-01T00:00:09+00:00"),
            end_time=AwareDatetime.fromisoformat("2021-01-01T00:00:15+00:00"),
            mac_address="mac1",
            thumbnail_s3_path=None,
        ),
    ]
    assert (
        merge_journey_intervals(
            _get_ranked_journal_intervals(intervals),
            tolerance=timedelta(seconds=4),
            max_duration=timedelta(seconds=10),
        )
        == intervals
    )


def test_merge_journey_interval_simple_merge() -> None:
    intervals = [
        JourneyIntervalBase(
            start_time=AwareDatetime.fromisoformat("2021-01-01T00:00:00+00:00"),
            end_time=AwareDatetime.fromisoformat("2021-01-01T00:00:10+00:00"),
            mac_address="mac1",
            thumbnail_s3_path=None,
        ),
        JourneyIntervalBase(
            start_time=AwareDatetime.fromisoformat("2021-01-01T00:00:02+00:00"),
            end_time=AwareDatetime.fromisoformat("2021-01-01T00:00:12+00:00"),
            mac_address="mac1",
            thumbnail_s3_path=None,
        ),
    ]
    merged_intervals = merge_journey_intervals(
        _get_ranked_journal_intervals(intervals),
        tolerance=timedelta(seconds=4),
        max_duration=timedelta(seconds=20),
    )
    assert len(merged_intervals) == 1
    assert merged_intervals[0].start_time == intervals[0].start_time
    assert merged_intervals[0].end_time == intervals[1].end_time


def test_merge_journey_interval_thumbnail_overwrite() -> None:
    intervals = [
        JourneyIntervalBase(
            start_time=AwareDatetime.fromisoformat("2021-01-01T00:00:00+00:00"),
            end_time=AwareDatetime.fromisoformat("2021-01-01T00:00:10+00:00"),
            mac_address="mac1",
            thumbnail_s3_path=None,
        ),
        JourneyIntervalBase(
            start_time=AwareDatetime.fromisoformat("2021-01-01T00:00:02+00:00"),
            end_time=AwareDatetime.fromisoformat("2021-01-01T00:00:12+00:00"),
            mac_address="mac1",
            thumbnail_s3_path="s3://bucket/thumbnail1",
        ),
    ]
    merged_intervals = merge_journey_intervals(
        _get_ranked_journal_intervals(intervals),
        tolerance=timedelta(seconds=4),
        max_duration=timedelta(seconds=20),
    )
    assert len(merged_intervals) == 1
    assert merged_intervals[0].start_time == intervals[0].start_time
    assert merged_intervals[0].end_time == intervals[1].end_time
    assert merged_intervals[0].thumbnail_s3_path == intervals[1].thumbnail_s3_path


def _generate_mct_images_for_camera(
    camera: Camera, num_images: int = 100
) -> list[MctImageCreate]:
    return [
        MctImageCreate(
            camera_mac_address=camera.mac_address,
            timestamp=AwareDatetime.utcnow(),
            s3_path="s3://some/path",
            track_id=1,
            perception_stack_start_id="--",
        )
        for _ in range(num_images)
    ]


async def test_filter_mct_images_request_by_nvr_all_valid(
    db_instance: database.Database,
    camera_group: CameraGroup,
    nvr: NVR,
    create_camera: CameraFactory,
    organization: Organization,
) -> None:
    camera_1 = await create_camera(camera_group_id=camera_group.id, nvr_uuid=nvr.uuid)
    camera_2 = await create_camera(camera_group_id=camera_group.id, nvr_uuid=nvr.uuid)

    request = RegisterMctImagesRequest(
        mct_images=_generate_mct_images_for_camera(camera_1)
        + _generate_mct_images_for_camera(camera_2)
    )
    async with db_instance.tenant_session(tenant=organization.tenant) as session:
        request_filtered = await filter_mct_images_by_nvr(session, request, nvr.uuid)

    assert request_filtered == request


async def test_filter_mct_images_request_by_nvr_partial_valid(
    db_instance: database.Database,
    camera_group: CameraGroup,
    nvr: NVR,
    create_camera: CameraFactory,
    location: Location,
    create_nvr: NVRFactory,
    organization: Organization,
) -> None:
    other_nvr = await create_nvr(location_id=location.id)
    camera_1 = await create_camera(camera_group_id=camera_group.id, nvr_uuid=nvr.uuid)
    camera_2 = await create_camera(
        camera_group_id=camera_group.id, nvr_uuid=other_nvr.uuid
    )

    mct_images_camera_1 = _generate_mct_images_for_camera(camera_1)
    mct_images_camera_2 = _generate_mct_images_for_camera(camera_2)

    request = RegisterMctImagesRequest(
        mct_images=mct_images_camera_1 + mct_images_camera_2
    )
    async with db_instance.tenant_session(tenant=organization.tenant) as session:
        request_filtered = await filter_mct_images_by_nvr(session, request, nvr.uuid)

    assert request_filtered.mct_images == mct_images_camera_1


async def test_filter_mct_images_request_by_nvr_all_invalid(
    db_instance: database.Database,
    camera_group: CameraGroup,
    nvr: NVR,
    create_camera: CameraFactory,
    location: Location,
    create_nvr: NVRFactory,
    organization: Organization,
) -> None:
    other_nvr = await create_nvr(location_id=location.id)
    other_camera = await create_camera(
        camera_group_id=camera_group.id, nvr_uuid=other_nvr.uuid
    )

    mct_images = _generate_mct_images_for_camera(other_camera)
    request = RegisterMctImagesRequest(mct_images=mct_images)

    async with db_instance.tenant_session(tenant=organization.tenant) as session:
        request_filtered = await filter_mct_images_by_nvr(session, request, nvr.uuid)

    assert request_filtered.mct_images == []
