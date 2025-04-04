from fastapi import status
from httpx import AsyncClient

from backend.dashboard import models
from backend.database import dashboard_models
from backend.test.client_request import (
    HTTPMethods,
    send_delete_request,
    send_get_request,
    send_http_request,
    send_post_request,
)


async def test_get_dashboard(
    dashboard_client: AsyncClient, dashboard: dashboard_models.Dashboard
) -> None:
    response = await send_get_request(dashboard_client, endpoint=f"/{dashboard.id}")
    retrieved_dashboard = models.DashboardResponse.parse_obj(response.json())

    assert retrieved_dashboard.id == dashboard.id
    assert retrieved_dashboard.title == dashboard.title
    assert retrieved_dashboard.description == dashboard.description


async def test_create_dashboard(dashboard_client: AsyncClient) -> None:
    create_response = await send_post_request(dashboard_client, "/", request=None)
    await send_get_request(dashboard_client, endpoint=f"/{create_response.json()}")


async def test_delete_dashboard(
    dashboard_client: AsyncClient, dashboard: dashboard_models.Dashboard
) -> None:
    await send_get_request(dashboard_client, endpoint=f"/{dashboard.id}")
    await send_delete_request(dashboard_client, endpoint=f"/{dashboard.id}")
    await send_get_request(
        dashboard_client,
        endpoint=f"/{dashboard.id}",
        expected_status_code=status.HTTP_400_BAD_REQUEST,
    )


async def test_delete_dashboard_with_invalid_id(dashboard_client: AsyncClient) -> None:
    await send_delete_request(
        dashboard_client, "/0", expected_status_code=status.HTTP_400_BAD_REQUEST
    )


async def test_update_dashboard_details(
    dashboard_client: AsyncClient, dashboard: dashboard_models.Dashboard
) -> None:
    response = await send_get_request(dashboard_client, endpoint=f"/{dashboard.id}")
    retrieved_dashboard = models.DashboardResponse.parse_obj(response.json())
    assert retrieved_dashboard.id == dashboard.id
    assert retrieved_dashboard.title == dashboard.title
    assert retrieved_dashboard.description == dashboard.description

    await send_http_request(
        client=dashboard_client,
        method=HTTPMethods.HTTP_PATCH,
        endpoint="/",
        request=models.DashboardDetailsUpdateRequest(
            id=dashboard.id, title="Updated Title", description="Updated Description"
        ),
    )

    response = await send_get_request(dashboard_client, endpoint=f"/{dashboard.id}")
    retrieved_dashboard = models.DashboardResponse.parse_obj(response.json())
    assert retrieved_dashboard.id == dashboard.id
    assert retrieved_dashboard.title == "Updated Title"
    assert retrieved_dashboard.description == "Updated Description"
