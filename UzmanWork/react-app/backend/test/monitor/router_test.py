from datetime import timedelta
from unittest.mock import MagicMock

import pytest
from fastapi.encoders import jsonable_encoder
from httpx import AsyncClient

from backend.constants import CAMERA_PIPELINE_ALERT_VALIDATION_TIMEOUT
from backend.database import database, models
from backend.database.models import NVR, Camera, Location
from backend.database.nvr_models import NvrNetworkInfo, NvrNetworkInterface
from backend.database.organization_models import Organization
from backend.escapi.protocol_models import VideoResRequestType
from backend.kinesis_api.models import (
    KinesisVideoClipRequest,
    KinesisVideoLiveRequest,
    StaticResolutionConfig,
)
from backend.monitor.alert import (
    AlertNVR,
    AlertSeverity,
    CameraAlertData,
    EdgeAlertData,
    EdgeAlertSeverity,
    EdgeCameraAlertRequest,
)
from backend.monitor.alert_types import (
    AlertType,
    CameraPipelineAlertType,
    EdgeStatusUpdateType,
)
from backend.monitor.models import (
    CameraPipelineAlertCreate,
    CameraPipelineAlertRequest,
    EdgeStatusUpdateCreate,
    EdgeStatusUpdateRequest,
    HeartbeatRequest,
    NvrInfoUpdate,
    TimezoneUpdate,
    VideoAlertClip,
    VideoAlertLive,
    VideoType,
)
from backend.test.client_request import send_get_request, send_post_request
from backend.test.monitor.common import EncodedAlertMatcher
from backend.utils import AwareDatetime
from backend.value_store.value_store import (
    ValueStore,
    get_camera_pipeline_alert_key,
    get_edge_status_update_key,
)


async def _check_stored_camera_pipeline_alert(
    camera: Camera, value_store: ValueStore, alert_request: CameraPipelineAlertRequest
) -> None:
    camera_alert_stored = await value_store.get_model(
        key=get_camera_pipeline_alert_key(camera.mac_address),
        model_class=CameraPipelineAlertCreate,
    )
    assert camera_alert_stored is not None
    assert camera_alert_stored.alert_type == alert_request.alert_type
    assert camera_alert_stored.time_generated == alert_request.time_generated
    assert camera_alert_stored.camera_mac_address == alert_request.camera_mac_address
    assert camera_alert_stored.nvr_uuid == camera.nvr_uuid


async def test_live_video_stream_alert(
    monitor_client: AsyncClient,
    db_instance: database.Database,
    camera: Camera,
    organization: Organization,
    patched_slack_alert_sender: MagicMock,
) -> None:
    request = VideoAlertLive(
        video_type=VideoType.LIVE,
        live_request=KinesisVideoLiveRequest(
            mac_address=camera.mac_address,
            resolution_config=StaticResolutionConfig(
                static_resolution=VideoResRequestType.High
            ),
            log_live_activity=False,
            prefer_webrtc=False,
        ),
        mac_address=camera.mac_address,
    )
    await send_post_request(monitor_client, "video_stream_alert", request)

    # Check the alert with the correct type was sent to slack
    alert = AlertNVR(
        alert_type=AlertType.FRONTEND_LIVE_STREAM_DOWN,
        alert_severity=AlertSeverity.INFO,
        nvr_uuid=camera.nvr_uuid,
        org_name=organization.name,
        detailed_info=request.to_alert_detailed_info()
        | {"organization": organization.name, "nvr_uuid": camera.nvr_uuid},
    )
    patched_slack_alert_sender.delay.assert_called_once_with(
        EncodedAlertMatcher(jsonable_encoder(alert))
    )


async def test_video_clip_alert(
    monitor_client: AsyncClient,
    db_instance: database.Database,
    camera: Camera,
    organization: Organization,
    patched_slack_alert_sender: MagicMock,
) -> None:
    request = VideoAlertClip(
        video_type=VideoType.CLIP,
        clip_request=KinesisVideoClipRequest(
            mac_address=camera.mac_address,
            start_time=AwareDatetime.utcnow(),
            end_time=AwareDatetime.utcnow() + timedelta(minutes=1),
            resolution_config=StaticResolutionConfig(
                static_resolution=VideoResRequestType.High
            ),
        ),
        mac_address=camera.mac_address,
    )
    await send_post_request(monitor_client, "video_stream_alert", request)

    # Check the alert with the correct type was sent to slack
    alert = AlertNVR(
        alert_type=AlertType.FRONTEND_CLIP_DOWN,
        alert_severity=AlertSeverity.INFO,
        nvr_uuid=camera.nvr_uuid,
        org_name=organization.name,
        detailed_info=request.to_alert_detailed_info()
        | {"organization": organization.name, "nvr_uuid": camera.nvr_uuid},
    )
    patched_slack_alert_sender.delay.assert_called_once_with(
        EncodedAlertMatcher(jsonable_encoder(alert))
    )


async def test_edge_camera_alert(
    monitor_client: AsyncClient,
    db_instance: database.Database,
    camera: Camera,
    organization: Organization,
    patched_slack_alert_sender_edge: MagicMock,
) -> None:
    alert_data = CameraAlertData(
        data=EdgeAlertData(
            time_generated=AwareDatetime.utcnow(),
            alert_info={},
            alert_source="test",
            alert_severity=AlertSeverity.INFO,
        ),
        camera_mac_address=camera.mac_address,
    )
    request = EdgeCameraAlertRequest(alert_data=alert_data)
    await send_post_request(monitor_client, "edge_camera_alert", request)

    # Check the alert with the correct type was sent to slack
    alert = AlertNVR(
        alert_type=AlertType.EDGE_CAMERA_ALERT,
        alert_severity=AlertSeverity.INFO,
        nvr_uuid=camera.nvr_uuid,
        org_name=organization.name,
        detailed_info=alert_data.data.alert_info
        | {
            "alert_source": alert_data.data.alert_source,
            "organization": organization.name,
            "nvr_uuid": camera.nvr_uuid,
            "mac_address": alert_data.camera_mac_address,
            "time_generated": alert_data.data.time_generated.isoformat(),
        },
    )
    patched_slack_alert_sender_edge.delay.assert_called_once_with(
        EncodedAlertMatcher(jsonable_encoder(alert))
    )


async def test_camera_pipeline_alert(
    monitor_client: AsyncClient,
    db_instance: database.Database,
    # Make sure the camera is online, because we don't send CameraPipeline slack
    # alerts for offline cameras. To do this, we create a camera with a
    # last_seen_time that is now.
    online_camera: Camera,
    value_store: ValueStore,
) -> None:
    request = CameraPipelineAlertRequest(
        alert_type=CameraPipelineAlertType.PRODUCER_INVALID_CREDENTIALS,
        time_generated=AwareDatetime.utcnow(),
        camera_mac_address=online_camera.mac_address,
        alert_source="test",
        alert_details="test",
    )
    await send_post_request(monitor_client, "camera_pipeline_alert", request)

    redis_alert = await value_store.get_model(
        key=get_camera_pipeline_alert_key(online_camera.mac_address),
        model_class=CameraPipelineAlertCreate,
    )
    assert redis_alert is not None
    assert (
        redis_alert.alert_type == CameraPipelineAlertType.PRODUCER_INVALID_CREDENTIALS
    )
    assert redis_alert.camera_mac_address == online_camera.mac_address
    assert redis_alert.nvr_uuid == online_camera.nvr_uuid


async def test_camera_pipeline_alert_with_duplicated_multiple_requests(
    monitor_client: AsyncClient,
    db_instance: database.Database,
    # Make sure the camera is online, because we don't send CameraPipeline slack
    # alerts for offline cameras. To do this, we create a camera with a
    # last_seen_time that is now.
    online_camera: Camera,
    value_store: ValueStore,
) -> None:
    first_alert_request = CameraPipelineAlertRequest(
        alert_type=CameraPipelineAlertType.PRODUCER_INVALID_CREDENTIALS,
        time_generated=AwareDatetime.utcnow(),
        camera_mac_address=online_camera.mac_address,
        alert_source="test",
        alert_details="test",
    )
    await send_post_request(
        monitor_client, "camera_pipeline_alert", first_alert_request
    )
    second_alert_request = CameraPipelineAlertRequest(
        alert_type=CameraPipelineAlertType.PRODUCER_INVALID_CREDENTIALS,
        time_generated=AwareDatetime.utcnow(),
        camera_mac_address=online_camera.mac_address,
        alert_source="test",
        alert_details="test",
    )
    await send_post_request(
        monitor_client, "camera_pipeline_alert", second_alert_request
    )

    await _check_stored_camera_pipeline_alert(
        online_camera, value_store, second_alert_request
    )


async def test_edge_status_update(
    monitor_client: AsyncClient,
    db_instance: database.Database,
    # Make sure the nvr is online, because we don't send alerts for offline NVRs.
    # To do this, we create a nvr with a last_seen_time that is now.
    nvr: NVR,
    value_store: ValueStore,
) -> None:
    request = EdgeStatusUpdateRequest(
        type=EdgeStatusUpdateType.NVR_KVS_CONNECTION_FAILURE,
        time_generated=AwareDatetime.utcnow(),
        source="test",
        details="test",
    )
    await send_post_request(monitor_client, "edge_status_update", request)

    redis_update = await value_store.get_model(
        key=get_edge_status_update_key(nvr.uuid), model_class=EdgeStatusUpdateCreate
    )
    assert redis_update is not None
    assert redis_update.type == EdgeStatusUpdateType.NVR_KVS_CONNECTION_FAILURE
    assert redis_update.nvr_uuid == nvr.uuid


async def test_video_stream_alert_with_faulty_camera(
    monitor_client: AsyncClient,
    db_instance: database.Database,
    faulty_camera: Camera,
    patched_slack_alert_sender: MagicMock,
) -> None:
    request = VideoAlertLive(
        video_type=VideoType.LIVE,
        live_request=KinesisVideoLiveRequest(
            mac_address=faulty_camera.mac_address,
            resolution_config=StaticResolutionConfig(
                static_resolution=VideoResRequestType.High
            ),
            log_live_activity=False,
            prefer_webrtc=False,
        ),
        mac_address=faulty_camera.mac_address,
    )
    await send_post_request(monitor_client, "video_stream_alert", request)

    # Expect no alert was sent to slack since the camera is faulty
    patched_slack_alert_sender.delay.assert_not_called()


async def test_edge_camera_alert_with_faulty_camera(
    monitor_client: AsyncClient,
    db_instance: database.Database,
    faulty_camera: Camera,
    patched_slack_alert_sender: MagicMock,
) -> None:
    request = EdgeCameraAlertRequest(
        alert_data=CameraAlertData(
            data=EdgeAlertData(
                time_generated=AwareDatetime.utcnow(),
                alert_info={},
                alert_source="test",
                alert_severity=EdgeAlertSeverity.INFO,
            ),
            camera_mac_address=faulty_camera.mac_address,
        )
    )
    await send_post_request(monitor_client, "edge_camera_alert", request)

    # Expect no alert was sent to slack since the camera is faulty
    patched_slack_alert_sender.delay.assert_not_called()


async def test_camera_pipeline_alert_with_faulty_camera(
    monitor_client: AsyncClient,
    db_instance: database.Database,
    faulty_camera: Camera,
    patched_slack_alert_sender: MagicMock,
    value_store: ValueStore,
) -> None:
    request = CameraPipelineAlertRequest(
        alert_type=CameraPipelineAlertType.PRODUCER_INVALID_CREDENTIALS,
        time_generated=AwareDatetime.utcnow(),
        camera_mac_address=faulty_camera.mac_address,
        alert_source="test",
        alert_details="test",
    )
    await send_post_request(monitor_client, "camera_pipeline_alert", request)

    # Expect no slack alert was sent to slack since the camera is faulty
    patched_slack_alert_sender.delay.assert_not_called()

    alert = await value_store.get_model(
        key=get_camera_pipeline_alert_key(faulty_camera.mac_address),
        model_class=CameraPipelineAlertCreate,
    )
    # Expect alert was stored in redis when the camera is faulty
    assert alert is not None
    assert alert.alert_type == CameraPipelineAlertType.PRODUCER_INVALID_CREDENTIALS
    assert alert.camera_mac_address == faulty_camera.mac_address
    assert alert.nvr_uuid == faulty_camera.nvr_uuid


@pytest.mark.parametrize(
    "time_generated_offset, expect_redis_alert_resolved",
    [(timedelta(seconds=0), False), (CAMERA_PIPELINE_ALERT_VALIDATION_TIMEOUT, True)],
)
async def test_camera_pipeline_alert_resolved_with_heartbeat_msg(
    monitor_client: AsyncClient,
    db_instance: database.Database,
    camera: Camera,
    patched_slack_alert_sender: MagicMock,
    value_store: ValueStore,
    time_generated_offset: timedelta,
    expect_redis_alert_resolved: bool,
) -> None:
    alert_request = CameraPipelineAlertRequest(
        alert_type=CameraPipelineAlertType.PRODUCER_INVALID_CREDENTIALS,
        time_generated=AwareDatetime.utcnow() - time_generated_offset,
        camera_mac_address=camera.mac_address,
        alert_source="test",
        alert_details="test",
    )
    await send_post_request(monitor_client, "camera_pipeline_alert", alert_request)

    # Check the alert with the correct type was sent to slack
    alert = AlertNVR(
        alert_type=CameraPipelineAlertType.PRODUCER_INVALID_CREDENTIALS,
        alert_severity=AlertSeverity.INFO,
        nvr_uuid=camera.nvr_uuid,
        org_name="OrgName",
    )
    assert patched_slack_alert_sender.delay.called_once_with(jsonable_encoder(alert))

    redis_alert = await value_store.get_model(
        key=get_camera_pipeline_alert_key(camera.mac_address),
        model_class=CameraPipelineAlertCreate,
    )
    # Check the alert with the correct type was stored in redis
    assert redis_alert is not None
    assert (
        redis_alert.alert_type == CameraPipelineAlertType.PRODUCER_INVALID_CREDENTIALS
    )
    assert redis_alert.camera_mac_address == camera.mac_address
    assert redis_alert.nvr_uuid == camera.nvr_uuid

    heartbeat_request = HeartbeatRequest(
        camera_mac_addresses={camera.mac_address},
        message_source="PRODUCER",
        nvr_uuid=camera.nvr_uuid,
        nvr_info=NvrInfoUpdate(
            nvr_uuid=camera.nvr_uuid,
            network_info=NvrNetworkInfo(
                last_scan_time=AwareDatetime.utcnow(),
                network_interfaces=[
                    NvrNetworkInterface(
                        name="eth0",
                        ip_address="127.0.0.1",
                        mac_address="00:00:00:00:00:00",
                    ),
                    NvrNetworkInterface(name="eth1", ip_address=None, mac_address=None),
                ],
            ),
        ),
    )
    await send_post_request(monitor_client, "nvr_heartbeat", heartbeat_request)

    # Check whether the alert was resolved in redis after receiving heartbeat and
    # we expect the alert to be resolved if the heartbeat is received after the alert
    # validation timeout threshold.
    redis_alert = await value_store.get_model(
        key=get_camera_pipeline_alert_key(camera.mac_address),
        model_class=CameraPipelineAlertCreate,
    )
    assert (redis_alert is None) == expect_redis_alert_resolved


async def test_update_nvr_timezone(
    monitor_client: AsyncClient, root_client: AsyncClient, location: Location, nvr: NVR
) -> None:
    request = TimezoneUpdate(nvr_uuid=nvr.uuid, timezone="Europe/London")
    update_timezone_response = await send_post_request(
        monitor_client, "update_timezone", request
    )
    assert update_timezone_response.status_code == 200

    get_locations_response = await send_get_request(root_client, "locations")
    assert get_locations_response.status_code == 200

    locations = get_locations_response.json()
    assert len(locations) == 1
    assert models.Location.parse_obj(locations[0]).timezone == "Europe/London"
