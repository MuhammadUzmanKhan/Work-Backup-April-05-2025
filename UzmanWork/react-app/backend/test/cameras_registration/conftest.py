from ipaddress import IPv4Address
from typing import AsyncGenerator
from unittest.mock import AsyncMock

import pytest
import pytest_asyncio
from fastapi import FastAPI
from httpx import AsyncClient
from pytest_mock import MockerFixture

from backend.cameras_registration.cameras_registration_models import CandidateCameraData
from backend.cameras_registration.cameras_registration_router import router
from backend.database.models import NVR
from backend.stream_discovery.models import (
    DiscoveredCamera,
    DiscoveryCachedEntry,
    DiscoveryRequest,
    NvrCapabilities,
)
from backend.test.cameras_registration.factory_types import (
    CachedDiscoveryFactory,
    CandidateCameraDataFactory,
)
from backend.test.factory_types import RandomStringFactory
from backend.utils import AwareDatetime
from backend.value_store.value_store import ValueStore, get_nvr_discovery_key


def _generate_discovered_cameras(mac_addresses: list[str]) -> list[DiscoveredCamera]:
    return [
        DiscoveredCamera(
            mac_address=mac_address,
            ip=IPv4Address(f"127.0.0.{idx_camera}"),
            vendor="CoramAI",
            streaming_codec="h264",
        )
        for idx_camera, mac_address in enumerate(mac_addresses)
    ]


@pytest_asyncio.fixture()
async def add_discovery_to_value_store(
    value_store: ValueStore, nvr: NVR
) -> CachedDiscoveryFactory:
    async def _inner(
        nvr_uuid: str | None,
        mac_addresses: list[str],
        discovery_time: AwareDatetime | None = None,
    ) -> DiscoveryCachedEntry:
        if nvr_uuid is None:
            nvr_uuid = nvr.uuid
        discovery = DiscoveryRequest(
            nvr_uuid=nvr_uuid,
            cameras=_generate_discovered_cameras(mac_addresses),
            nvr_capabilities=NvrCapabilities(),
            discovery_time=(
                discovery_time if discovery_time is not None else AwareDatetime.utcnow()
            ),
        )
        discovery_cache = DiscoveryCachedEntry.from_discovery(discovery)
        await value_store.set_model(get_nvr_discovery_key(nvr_uuid), discovery_cache)
        return discovery_cache

    return _inner


@pytest.fixture()
def create_candidate_camera_data(
    create_mac_address: RandomStringFactory,
) -> CandidateCameraDataFactory:
    def _inner(nvr_uuids: set[str]) -> CandidateCameraData:
        return CandidateCameraData(
            nvr_uuids=nvr_uuids,
            mac_address=create_mac_address(),
            ip=IPv4Address("127.0.0.1"),
            vendor="CoramAI",
            username="admin",
            password="admin",
        )

    return _inner


@pytest_asyncio.fixture()
async def cameras_registration_client(
    app: FastAPI, mocker: MockerFixture
) -> AsyncGenerator[AsyncClient, None]:
    app.include_router(router)

    mocker.patch(
        "backend.cameras_registration.cameras_registration_utils._request_discovery",
        new_callable=AsyncMock,
    )
    async with AsyncClient(
        app=app, base_url="http://localhost/cameras_registration"
    ) as client:
        yield client
