import asyncio
import random
import string
from datetime import timedelta

import aio_pika

from backend import message_queue, ws_utils
from backend.boto_utils import BotoIotDataClient
from backend.cameras_registration.cameras_registration_models import (
    CameraAssignmentError,
    CameraAssignmentOK,
    CandidateCameraData,
)
from backend.database import database, orm
from backend.database.session import TenantAwareAsyncSession
from backend.iot_core.utils import (
    NETWORK_SCAN_IOT_QUEUE_FACTORY,
    send_msg_to_nvr_through_iot,
)
from backend.models import AccessRestrictions, NVRResponse
from backend.stream_discovery.models import DiscoveryCachedEntry
from backend.stream_discovery.protocol_models import DiscoveryRequestBody
from backend.utils import AwareDatetime
from backend.value_store import ValueStore
from backend.value_store.value_store import get_nvr_discovery_key

# timeout for the discovery to be considered useful for the client
FRESH_DISCOVERY_TIMEOUT = timedelta(seconds=15)
# timeout for the discovery request to be processed by the NVR
DISCOVERY_TIMEOUT = timedelta(seconds=30)
# how often to poll the cache for the discovery after sending the request
DISCOVERY_POLL_INTERVAL = timedelta(seconds=1)


async def _request_discovery(
    nvr_uuid: str,
    mq_connection: aio_pika.abc.AbstractRobustConnection,
    iot_data_client: BotoIotDataClient,
    use_iot_core: bool,
) -> None:
    """Send a discovery request to the NVR queue
    and return immediately."""
    message = DiscoveryRequestBody(request_time=AwareDatetime.utcnow())
    if use_iot_core:
        iot_queue_settings = NETWORK_SCAN_IOT_QUEUE_FACTORY(nvr_uuid)
        await send_msg_to_nvr_through_iot(
            iot_queue_settings, message.json(), iot_data_client
        )

    else:
        queue_settings = ws_utils.DISCOVERY_QUEUE_FACTORY(nvr_uuid)
        await message_queue.publish_message(
            mq_connection=mq_connection, queue_settings=queue_settings, message=message
        )


def _discovery_is_stale(discovery: DiscoveryCachedEntry | None) -> bool:
    return (
        discovery is None
        or AwareDatetime.utcnow() - discovery.last_discovery_time
        > FRESH_DISCOVERY_TIMEOUT
    )


async def retrieve_fresh_nvrs_discovery(
    nvrs_uuid: list[str],
    value_store: ValueStore,
    mq_connection: aio_pika.abc.AbstractRobustConnection,
    iot_data_client: BotoIotDataClient,
    use_iot_core: bool,
) -> dict[str, DiscoveryCachedEntry | None]:
    """Request a discovery for a list of NVRs if the latest
    discovery is stale or missing."""
    discoveries_keys = [get_nvr_discovery_key(uuid) for uuid in nvrs_uuid]
    # get latest discovery for each NVR from the cache
    discoveries = await value_store.get_multiple_models(
        discoveries_keys, DiscoveryCachedEntry
    )
    # a discovery can be none or stale, in which case we need to request a new one
    stale_discoveries_uuids = [
        uuid
        for uuid, discovery in discoveries.items()
        if _discovery_is_stale(discovery)
    ]
    if stale_discoveries_uuids:
        await asyncio.gather(
            *[
                _request_discovery(uuid, mq_connection, iot_data_client, use_iot_core)
                for uuid in stale_discoveries_uuids
            ]
        )
    # get again latest discovery for each NVR from the cache
    # NOTE(@lberg): we return stale discoveries too here
    # otherwise long discoveries would be always missed
    return {
        uuid: discovery
        for uuid, discovery in (
            await value_store.get_multiple_models(
                discoveries_keys, DiscoveryCachedEntry
            )
        ).items()
    }


def compute_cameras_to_nvrs_assignment(
    candidates: list[CandidateCameraData], nvrs_available_slots: dict[str, int]
) -> tuple[list[CameraAssignmentOK], list[CameraAssignmentError]]:
    """Perform a greedy assignment of cameras to NVRs by finding the NVR with the most
    available slots for each camera every time.
    """
    nvrs_available_slots = nvrs_available_slots.copy()
    successful_assignments = []
    failed_assignments = []

    for candidate in candidates:
        # get all nvrs we can assign this camera to
        possible_nvrs = {
            nvr_uuid: slots
            for nvr_uuid, slots in nvrs_available_slots.items()
            if nvr_uuid in candidate.nvr_uuids and slots > 0
        }
        if not possible_nvrs:
            failed_assignments.append(
                CameraAssignmentError(
                    camera_data=candidate, error="No available NVR for registration"
                )
            )
            continue
        # get the NVR with the most available slots
        nvr_uuid = max(possible_nvrs, key=lambda k: possible_nvrs[k])
        nvrs_available_slots[nvr_uuid] -= 1
        successful_assignments.append(
            CameraAssignmentOK(camera_data=candidate, nvr_uuid=nvr_uuid)
        )

    return successful_assignments, failed_assignments


async def generate_unique_stream_hash(db: database.Database, env_name: str) -> str:
    # this must be done in a system-wide transaction to ensure it's unique across
    # all tenants
    async with db.session() as session:
        stream_hash = _generate_stream_hash(env_name)
        while await orm.Camera.system_check_stream_hash_exists(session, stream_hash):
            stream_hash = _generate_stream_hash(env_name)

    return stream_hash


def _generate_stream_hash(env_name: str) -> str:
    return (
        "".join(
            random.choices(
                string.ascii_lowercase + string.digits + string.ascii_uppercase, k=25
            )
        )
        + f"-{env_name}"
    )


async def get_nvr_available_for_discovery(
    session: TenantAwareAsyncSession, access: AccessRestrictions, location_id: int
) -> list[NVRResponse]:
    nvrs = await orm.NVR.get_nvrs(session, access, location_id=location_id)
    # skip offline nvrs because they can't offer cameras
    return [nvr for nvr in nvrs if nvr.is_online]
