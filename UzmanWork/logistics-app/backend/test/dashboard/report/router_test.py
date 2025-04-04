import copy

from httpx import AsyncClient
from starlette import status

from backend.dashboard import models
from backend.dashboard.report import models as report_models
from backend.database import dashboard_models
from backend.test.client_request import (
    HTTPMethods,
    send_delete_request,
    send_get_request,
    send_http_request,
    send_post_request,
)
from backend.test.dashboard.report.factory_types import (
    DashboardReportCreateRequestFactory,
)


async def test_add_report(
    dashboard_client: AsyncClient,
    dashboard: dashboard_models.Dashboard,
    create_dashboard_report_create_request: DashboardReportCreateRequestFactory,
) -> None:
    dashboard_response = await send_get_request(
        dashboard_client, endpoint=f"/{dashboard.id}"
    )
    retrieved_dashboard = models.DashboardResponse.parse_obj(dashboard_response.json())
    assert len(retrieved_dashboard.reports) == 0

    request_payload = create_dashboard_report_create_request(dashboard.id)
    report_response = await send_post_request(
        dashboard_client, endpoint="/reports/", request=request_payload
    )
    report = dashboard_models.DashboardReport.parse_obj(report_response.json())

    dashboard_response = await send_get_request(
        dashboard_client, endpoint=f"/{dashboard.id}"
    )
    retrieved_dashboard = models.DashboardResponse.parse_obj(dashboard_response.json())

    assert len(retrieved_dashboard.reports) == 1
    assert retrieved_dashboard.reports[0].id == report.id
    assert retrieved_dashboard.reports[0].name == request_payload.name


async def test_add_report_for_non_existing_dashboard(
    dashboard_client: AsyncClient,
    create_dashboard_report_create_request: DashboardReportCreateRequestFactory,
) -> None:
    request_payload = create_dashboard_report_create_request(0)
    await send_post_request(
        dashboard_client,
        endpoint="/reports/",
        request=request_payload,
        expected_status_code=status.HTTP_404_NOT_FOUND,
    )


async def test_update_report(
    dashboard_client: AsyncClient,
    dashboard: dashboard_models.Dashboard,
    report: dashboard_models.DashboardReport,
) -> None:
    dashboard_response = await send_get_request(
        dashboard_client, endpoint=f"/{dashboard.id}"
    )
    retrieved_dashboard = models.DashboardResponse.parse_obj(dashboard_response.json())

    assert len(retrieved_dashboard.reports) == 1
    assert retrieved_dashboard.reports[0].id == report.id
    assert retrieved_dashboard.reports[0].name == report.name
    assert retrieved_dashboard.reports[0].description == report.description

    update_payload = copy.deepcopy(report)
    update_payload.name = "Updated Name"
    update_payload.description = "Updated Description"
    await send_http_request(
        client=dashboard_client,
        method=HTTPMethods.HTTP_PUT,
        endpoint=f"/reports/{report.id}",
        request=update_payload,
    )

    dashboard_response = await send_get_request(
        dashboard_client, endpoint=f"/{dashboard.id}"
    )
    retrieved_dashboard = models.DashboardResponse.parse_obj(dashboard_response.json())
    assert len(retrieved_dashboard.reports) == 1
    assert retrieved_dashboard.reports[0].id == update_payload.id
    assert retrieved_dashboard.reports[0].name == update_payload.name
    assert retrieved_dashboard.reports[0].description == update_payload.description


async def test_update_non_existing_report(
    dashboard_client: AsyncClient,
    dashboard: dashboard_models.Dashboard,
    report: dashboard_models.DashboardReport,
) -> None:
    dashboard_response = await send_get_request(
        dashboard_client, endpoint=f"/{dashboard.id}"
    )
    retrieved_dashboard = models.DashboardResponse.parse_obj(dashboard_response.json())

    assert len(retrieved_dashboard.reports) == 1
    assert retrieved_dashboard.reports[0].id == report.id

    update_payload = copy.deepcopy(report)
    update_payload.id = 0

    await send_http_request(
        client=dashboard_client,
        method=HTTPMethods.HTTP_PUT,
        endpoint=f"/reports/{report.id}",
        request=update_payload,
        expected_status_code=status.HTTP_400_BAD_REQUEST,
    )


async def test_delete_report(
    dashboard_client: AsyncClient,
    dashboard: dashboard_models.Dashboard,
    report: dashboard_models.DashboardReport,
) -> None:
    dashboard_response = await send_get_request(
        dashboard_client, endpoint=f"/{dashboard.id}"
    )
    retrieved_dashboard = models.DashboardResponse.parse_obj(dashboard_response.json())
    assert len(retrieved_dashboard.reports) == 1

    await send_delete_request(dashboard_client, endpoint=f"/reports/{report.id}")
    dashboard_response = await send_get_request(
        dashboard_client, endpoint=f"/{dashboard.id}"
    )
    retrieved_dashboard = models.DashboardResponse.parse_obj(dashboard_response.json())
    assert len(retrieved_dashboard.reports) == 0


async def test_delete_non_existing_report(dashboard_client: AsyncClient) -> None:
    await send_delete_request(
        dashboard_client,
        endpoint="/reports/0",
        expected_status_code=status.HTTP_400_BAD_REQUEST,
    )


async def test_clone_report(
    dashboard_client: AsyncClient,
    dashboard: dashboard_models.Dashboard,
    report: dashboard_models.DashboardReport,
) -> None:
    dashboard_response = await send_get_request(
        dashboard_client, endpoint=f"/{dashboard.id}"
    )
    retrieved_dashboard = models.DashboardResponse.parse_obj(dashboard_response.json())
    assert len(retrieved_dashboard.reports) == 1
    assert retrieved_dashboard.reports[0].id == report.id

    clone_response = await send_post_request(
        dashboard_client, request=None, endpoint=f"/reports/{report.id}/actions/clone"
    )
    cloned_report = report_models.DashboardReportResponse.parse_obj(
        clone_response.json()
    )

    dashboard_response = await send_get_request(
        dashboard_client, endpoint=f"/{dashboard.id}"
    )
    retrieved_dashboard = models.DashboardResponse.parse_obj(dashboard_response.json())
    assert len(retrieved_dashboard.reports) == 2
    assert retrieved_dashboard.reports[0].id == report.id
    assert retrieved_dashboard.reports[1].id == cloned_report.id


async def test_clone_non_existing_report(dashboard_client: AsyncClient) -> None:
    await send_post_request(
        dashboard_client,
        request=None,
        endpoint="/reports/0/actions/clone",
        expected_status_code=status.HTTP_400_BAD_REQUEST,
    )
