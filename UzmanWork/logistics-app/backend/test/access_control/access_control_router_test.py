from fastapi import status
from httpx import AsyncClient

from backend.access_control.models import (
    AccessPointResponse,
    AssignAccessPointCameraRequest,
    SetAccessPointLocationRequest,
    SetFavoriteCameraRequest,
    UnassignAccessPointCameraRequest,
)
from backend.database import access_points_models as ap_models
from backend.database.models import Camera, Location
from backend.database.organization_models import Organization
from backend.test.client_request import send_get_request, send_post_request


async def test_set_location_to_access_point(
    access_control_client: AsyncClient,
    access_point: ap_models.AccessPoint,
    location: Location,
    organization: Organization,
) -> None:
    await send_post_request(
        access_control_client,
        "/set_location",
        SetAccessPointLocationRequest(
            access_point_id=access_point.id,
            vendor=access_point.vendor,
            location_id=location.id,
        ),
    )

    list_access_points_response = await send_get_request(
        access_control_client, "/list_access_points"
    )
    access_point_on_server = next(
        (
            AccessPointResponse.parse_obj(item)
            for item in list_access_points_response.json()
            if item["id"] == str(access_point.id)
        ),
        None,
    )
    assert (
        access_point_on_server is not None
        and access_point_on_server.location_id == location.id
    )


async def test_assign_unassign_camera_to_access_point(
    access_control_client: AsyncClient,
    access_point: ap_models.AccessPoint,
    organization: Organization,
    camera: Camera,
) -> None:
    # Assign 1 camera to access point
    await send_post_request(
        access_control_client,
        "/assign_camera",
        AssignAccessPointCameraRequest(
            access_point_id=access_point.id,
            vendor=access_point.vendor,
            camera_mac_address=camera.mac_address,
        ),
    )

    list_access_points_response_with_camera = await send_get_request(
        access_control_client, "/list_access_points"
    )
    access_points = [
        AccessPointResponse.parse_obj(item)
        for item in list_access_points_response_with_camera.json()
    ]
    assert len(access_points[0].cameras) == 1

    # Assign empty cameras to access point
    await send_post_request(
        access_control_client,
        "/unassign_camera",
        UnassignAccessPointCameraRequest(
            access_point_id=access_point.id,
            vendor=access_point.vendor,
            camera_mac_address=camera.mac_address,
        ),
    )

    list_access_points_response_without_camera = await send_get_request(
        access_control_client, "/list_access_points"
    )
    access_points = [
        AccessPointResponse.parse_obj(item)
        for item in list_access_points_response_without_camera.json()
    ]
    assert len(access_points[0].cameras) == 0


async def test_assign_access_point_camera_when_location_is_not_set(
    access_control_client: AsyncClient,
    access_point: ap_models.AccessPoint,
    organization: Organization,
    camera: Camera,
) -> None:
    await send_post_request(
        access_control_client,
        "/set_location",
        SetAccessPointLocationRequest(
            access_point_id=access_point.id,
            vendor=access_point.vendor,
            location_id=None,
        ),
    )

    await send_post_request(
        access_control_client,
        "/assign_camera",
        AssignAccessPointCameraRequest(
            access_point_id=access_point.id,
            vendor=access_point.vendor,
            camera_mac_address=camera.mac_address,
        ),
        expected_status_code=status.HTTP_400_BAD_REQUEST,
    )

    list_access_points_response = await send_get_request(
        access_control_client, "/list_access_points"
    )
    access_points = [
        AccessPointResponse.parse_obj(item)
        for item in list_access_points_response.json()
    ]
    assert len(access_points[0].cameras) == 0


async def test_assign_favorite_camera_to_access_point(
    access_control_client: AsyncClient,
    access_point: ap_models.AccessPoint,
    organization: Organization,
    camera: Camera,
) -> None:
    await send_post_request(
        access_control_client,
        "/assign_camera",
        AssignAccessPointCameraRequest(
            access_point_id=access_point.id,
            vendor=access_point.vendor,
            camera_mac_address=camera.mac_address,
        ),
    )

    list_access_points_response_with_camera = await send_get_request(
        access_control_client, "/list_access_points"
    )
    access_points = [
        AccessPointResponse.parse_obj(item)
        for item in list_access_points_response_with_camera.json()
    ]
    assert len(access_points[0].cameras) == 1

    await send_post_request(
        access_control_client,
        "/set_favorite_camera",
        SetFavoriteCameraRequest(
            access_point_id=access_point.id,
            vendor=access_point.vendor,
            camera_mac_address=camera.mac_address,
        ),
    )

    list_access_points_response_without_camera = await send_get_request(
        access_control_client, "/list_access_points"
    )
    access_points = [
        AccessPointResponse.parse_obj(item)
        for item in list_access_points_response_without_camera.json()
    ]
    assert len(access_points[0].cameras) == 1
    assert access_points[0].cameras[0].is_favorite is True
