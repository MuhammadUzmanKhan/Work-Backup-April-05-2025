from datetime import timedelta
from unittest.mock import AsyncMock, MagicMock

import pytest
from pytest_mock import MockerFixture

from backend.boto_utils import BotoSessionFn
from backend.cameras_registration.cameras_registration_utils import (
    compute_cameras_to_nvrs_assignment,
    retrieve_fresh_nvrs_discovery,
)
from backend.database.models import NVR, Location
from backend.test.cameras_registration.factory_types import (
    CachedDiscoveryFactory,
    CandidateCameraDataFactory,
)
from backend.test.factory_types import NVRFactory, RandomStringFactory
from backend.utils import AwareDatetime
from backend.value_store.value_store import ValueStore


@pytest.fixture()
def mq_connection() -> AsyncMock:
    return AsyncMock()


@pytest.fixture()
def boto_session_maker() -> BotoSessionFn:
    return lambda: MagicMock()


@pytest.fixture()
def patched_request_discovery(mocker: MockerFixture) -> AsyncMock:
    patch = mocker.patch(
        "backend.cameras_registration.cameras_registration_utils._request_discovery",
        new_callable=AsyncMock,
    )
    return patch


async def test_retrieve_fresh_nvrs_discovery_no_cached(
    patched_request_discovery: AsyncMock,
    value_store: ValueStore,
    mq_connection: AsyncMock,
    location: Location,
    create_nvr: NVRFactory,
) -> None:
    nvrs = [await create_nvr(location.id) for _ in range(2)]
    res = await retrieve_fresh_nvrs_discovery(
        [nvr.uuid for nvr in nvrs], value_store, mq_connection, MagicMock(), False
    )
    assert all([el is None for el in res.values()])
    assert patched_request_discovery.call_count == 2


async def test_retrieve_fresh_nvrs_discovery_all_cached(
    patched_request_discovery: AsyncMock,
    value_store: ValueStore,
    mq_connection: AsyncMock,
    add_discovery_to_value_store: CachedDiscoveryFactory,
    location: Location,
    create_nvr: NVRFactory,
    create_mac_address: RandomStringFactory,
) -> None:
    nvrs = [await create_nvr(location.id) for _ in range(2)]
    for nvr in nvrs:
        await add_discovery_to_value_store(
            nvr.uuid, [create_mac_address() for _ in range(2)]
        )

    res = await retrieve_fresh_nvrs_discovery(
        [nvr.uuid for nvr in nvrs], value_store, mq_connection, MagicMock(), False
    )
    assert all([el is not None for el in res.values()])
    assert patched_request_discovery.call_count == 0


async def test_retrieve_fresh_nvrs_discovery_stale(
    patched_request_discovery: AsyncMock,
    value_store: ValueStore,
    mq_connection: AsyncMock,
    add_discovery_to_value_store: CachedDiscoveryFactory,
    nvr: NVR,
    create_mac_address: RandomStringFactory,
) -> None:
    await add_discovery_to_value_store(
        nvr.uuid,
        [create_mac_address() for _ in range(2)],
        discovery_time=AwareDatetime.utcnow() - timedelta(minutes=10),
    )
    res = await retrieve_fresh_nvrs_discovery(
        [nvr.uuid], value_store, mq_connection, MagicMock(), False
    )
    # stale discoveries are still returned
    assert all([el is not None for el in res.values()])
    assert patched_request_discovery.call_count == 1


def test_compute_cameras_to_nvrs_assignment_no_nvr(
    create_candidate_camera_data: CandidateCameraDataFactory,
) -> None:
    candidates = [
        create_candidate_camera_data(set(["nvr1", "nvr2"])),
        create_candidate_camera_data(set(["nvr1"])),
    ]
    ok_assignments, err_assignments = compute_cameras_to_nvrs_assignment(candidates, {})
    assert len(ok_assignments) == 0
    assert len(err_assignments) == 2


def test_compute_cameras_to_nvrs_assignment_no_slots(
    create_candidate_camera_data: CandidateCameraDataFactory,
) -> None:
    candidates = [
        create_candidate_camera_data(set(["nvr1", "nvr2"])),
        create_candidate_camera_data(set(["nvr1"])),
    ]
    ok_assignments, err_assignments = compute_cameras_to_nvrs_assignment(
        candidates, {"nvr1": 0, "nvr2": 0}
    )
    assert len(ok_assignments) == 0
    assert len(err_assignments) == 2


def test_compute_cameras_to_nvrs_assignment_too_many(
    create_candidate_camera_data: CandidateCameraDataFactory,
) -> None:
    candidates = [
        create_candidate_camera_data(set(["nvr1"])),
        create_candidate_camera_data(set(["nvr1"])),
    ]
    ok_assignments, err_assignments = compute_cameras_to_nvrs_assignment(
        candidates, {"nvr1": 1}
    )
    assert len(ok_assignments) == 1
    assert ok_assignments[0].camera_data == candidates[0]
    assert len(err_assignments) == 1
    assert err_assignments[0].camera_data == candidates[1]


def test_compute_cameras_to_nvrs_assignment_second_nvr_pick(
    create_candidate_camera_data: CandidateCameraDataFactory,
) -> None:
    candidates = [
        create_candidate_camera_data(set(["nvr1"])),
        create_candidate_camera_data(set(["nvr1", "nvr2"])),
        create_candidate_camera_data(set(["nvr2", "nvr3"])),
        create_candidate_camera_data(set(["nvr3", "nvr4"])),
    ]
    ok_assignments, _ = compute_cameras_to_nvrs_assignment(
        candidates, {"nvr1": 1, "nvr2": 1, "nvr3": 1, "nvr4": 1}
    )
    assert len(ok_assignments) == 4
    assert ok_assignments[0].nvr_uuid == "nvr1"
    assert ok_assignments[1].nvr_uuid == "nvr2"
    assert ok_assignments[2].nvr_uuid == "nvr3"
    assert ok_assignments[3].nvr_uuid == "nvr4"
