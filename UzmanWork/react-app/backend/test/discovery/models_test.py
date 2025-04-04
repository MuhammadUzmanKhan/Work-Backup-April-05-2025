from backend.database.models import NVR
from backend.stream_discovery.models import (
    DiscoveryCachedEntry,
    DiscoveryRequest,
    NvrCapabilities,
)
from backend.test.discovery.router_test import generate_discovered_cameras
from backend.test.factory_types import RandomStringFactory
from backend.utils import AwareDatetime


def _generate_discovery_request(
    mac_addresses: list[str], nvr: NVR, discovery_time: AwareDatetime
) -> DiscoveryRequest:
    return DiscoveryRequest(
        nvr_uuid=nvr.uuid,
        cameras=generate_discovered_cameras(mac_addresses),
        nvr_capabilities=NvrCapabilities(),
        discovery_time=discovery_time,
    )


def test_discovery_cache_single_discovery(
    create_mac_address: RandomStringFactory, nvr: NVR
) -> None:
    expected_mac_addresses = [create_mac_address(), create_mac_address()]
    discovery_cache = DiscoveryCachedEntry.from_discovery(
        _generate_discovery_request(expected_mac_addresses, nvr, AwareDatetime.utcnow())
    )
    assert discovery_cache.nvr_uuid == nvr.uuid
    assert discovery_cache.cached_cameras.keys() == set(expected_mac_addresses)


def test_discovery_cache_add_only(
    create_mac_address: RandomStringFactory, nvr: NVR
) -> None:
    initial_mac_addresses = [create_mac_address(), create_mac_address()]
    discovery_cache = DiscoveryCachedEntry.from_discovery(
        _generate_discovery_request(initial_mac_addresses, nvr, AwareDatetime.utcnow())
    )
    added_mac_addresses = [create_mac_address(), create_mac_address()]
    discovery_cache.update_from_discovery(
        _generate_discovery_request(added_mac_addresses, nvr, AwareDatetime.utcnow())
    )
    assert discovery_cache.nvr_uuid == nvr.uuid
    assert discovery_cache.cached_cameras.keys() == set(
        initial_mac_addresses + added_mac_addresses
    )


def test_discovery_cache_update_only(
    create_mac_address: RandomStringFactory, nvr: NVR
) -> None:
    initial_mac_addresses = [create_mac_address(), create_mac_address()]
    initial_time = AwareDatetime.fromisoformat("2021-01-01T00:00:00+00:00")
    discovery_cache = DiscoveryCachedEntry.from_discovery(
        _generate_discovery_request(initial_mac_addresses, nvr, initial_time)
    )
    assert discovery_cache.last_discovery_time == initial_time
    for camera in discovery_cache.cached_cameras.values():
        assert camera.cached_at == initial_time

    update_time = AwareDatetime.fromisoformat("2022-01-01T00:00:01+00:00")
    discovery_cache.update_from_discovery(
        _generate_discovery_request(initial_mac_addresses, nvr, update_time)
    )
    assert discovery_cache.last_discovery_time == update_time
    for camera in discovery_cache.cached_cameras.values():
        assert camera.cached_at == update_time


def test_discovery_cache_remove_stale(
    create_mac_address: RandomStringFactory, nvr: NVR
) -> None:
    initial_mac_addresses = [create_mac_address(), create_mac_address()]
    initial_time = AwareDatetime.fromisoformat("2021-01-01T00:00:00+00:00")
    discovery_cache = DiscoveryCachedEntry.from_discovery(
        _generate_discovery_request(initial_mac_addresses, nvr, initial_time)
    )
    assert discovery_cache.last_discovery_time == initial_time
    for camera in discovery_cache.cached_cameras.values():
        assert camera.cached_at == initial_time

    update_time = AwareDatetime.fromisoformat("2022-01-01T00:00:01+00:00")
    discovery_cache.update_from_discovery(
        _generate_discovery_request([], nvr, update_time)
    )
    assert discovery_cache.last_discovery_time == update_time
    assert len(discovery_cache.cached_cameras) == 0
