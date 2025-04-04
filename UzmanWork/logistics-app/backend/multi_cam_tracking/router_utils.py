from collections import defaultdict

from fastapi import HTTPException, status

from backend.database import orm
from backend.database.models import CamerasQueryConfig, TrackIdentifier
from backend.database.session import TenantAwareAsyncSession
from backend.models import AccessRestrictions
from backend.monitor.alert import AlertOrgGrouped, AlertSeverity
from backend.monitor.alert_types import AlertType
from backend.slack_client import SlackClient
from backend.utils import AwareDatetime


async def query_track_by_object_info_and_check(
    session: TenantAwareAsyncSession,
    slack_client: SlackClient,
    mac_address: str,
    timestamp: AwareDatetime,
    object_idx: int,
) -> TrackIdentifier:
    tracks = await orm.PerceptionObjectEvent.query_track_by_object_info(
        session, mac_address, timestamp, object_idx
    )
    if len(tracks) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Track not found."
        )

    if len(tracks) > 1:
        # TODO(@lberg): remove once we understand why this happens
        org_name = await orm.Organization.get_org_name_or_unknown_from_session(session)
        await slack_client.send_alert(
            AlertOrgGrouped(
                alert_type=AlertType.JOURNEY_MULTIPLE_TRACKS_FOUND,
                alert_severity=AlertSeverity.WARNING,
                org_name=org_name,
                detailed_info={
                    "mac_address": mac_address,
                    "timestamp": str(timestamp),
                    "object_idx": str(object_idx),
                    "tracks": str([track.json() for track in tracks]),
                },
            )
        )

    return tracks[0]


async def get_nvr_to_mac_addresses_or_fail(
    session: TenantAwareAsyncSession, access: AccessRestrictions, location_id: int
) -> dict[str, list[str]]:
    """Query NVRs from the database and return a mapping from NVR UUID to a list of
    associated camera mac addresses.
    """
    nvr_to_mac_addresses: defaultdict[str, list[str]] = defaultdict(list)
    nvrs = await orm.NVR.get_nvrs(session, access=access, location_id=location_id)
    online_nvr_uuids = {nvr.uuid for nvr in nvrs if nvr.is_online}
    cameras_responses = await orm.Camera.get_cameras(
        session,
        query_config=CamerasQueryConfig(
            nvr_uuids=online_nvr_uuids, location_ids={location_id}
        ),
        access_restrictions=access,
    )
    for cameras_response in cameras_responses:
        nvr_to_mac_addresses[cameras_response.camera.nvr_uuid].append(
            cameras_response.camera.mac_address
        )

    if len(nvr_to_mac_addresses) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No valid NVRs found for the request!",
        )

    return nvr_to_mac_addresses
