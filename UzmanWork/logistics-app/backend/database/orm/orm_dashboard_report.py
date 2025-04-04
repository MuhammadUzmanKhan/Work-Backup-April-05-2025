from __future__ import annotations

import sqlalchemy as sa
from sqlalchemy import orm

from backend.database import dashboard_models as models
from backend.database.orm import orm_dashboard
from backend.database.orm.orm_utils import TenantProtectedTable
from backend.database.session import TenantAwareAsyncSession


class DashboardReportError(Exception):
    pass


class DashboardReportUpdateError(DashboardReportError):
    pass


class DashboardReportNotFoundError(DashboardReportError):
    pass


class DashboardReport(TenantProtectedTable):
    __tablename__ = "dashboard_reports"

    id: orm.Mapped[int] = sa.Column(sa.Integer, primary_key=True, autoincrement=True)
    dashboard_id = sa.Column(
        sa.Integer, sa.ForeignKey("dashboards.id", ondelete="CASCADE"), nullable=False
    )
    name = sa.Column(sa.String, nullable=False)
    description = sa.Column(sa.String, nullable=True)
    report_metadata = sa.Column(sa.JSON, nullable=False)

    __table_args__ = ((sa.ForeignKeyConstraint(["tenant"], ["organizations.tenant"])),)

    @staticmethod
    async def add_report(
        session: TenantAwareAsyncSession, report_create: models.DashboardReportCreate
    ) -> models.DashboardReport:
        dashboard = await session.get(
            orm_dashboard.Dashboard, report_create.dashboard_id
        )
        if dashboard is None:
            raise orm_dashboard.DashboardNotFoundError(
                f"Dashboard does not exist {report_create.dashboard_id=}"
            )

        report = DashboardReport(
            dashboard_id=report_create.dashboard_id,
            name=report_create.name,
            description=report_create.description,
            report_metadata=report_create.report_metadata.dict(),
            tenant=session.tenant,
        )
        session.add(report)
        await session.flush()

        dashboard.reports_order.append(report.id)
        orm.attributes.flag_modified(dashboard, "reports_order")

        return models.DashboardReport.from_orm(report)

    @staticmethod
    async def update_report(
        session: TenantAwareAsyncSession, report: models.DashboardReport
    ) -> None:
        stmt = (
            sa.update(DashboardReport)
            .where(DashboardReport.id == report.id)
            .where(DashboardReport.dashboard_id == report.dashboard_id)
            .values(name=report.name)
            .values(description=report.description)
            .values(report_metadata=report.report_metadata.dict())
        )
        row_count = (await session.execute(stmt)).rowcount  # type: ignore[attr-defined]

        if row_count != 1:
            raise DashboardReportUpdateError(
                f"Expected to update 1 report, but updated {row_count} metrics"
            )

    @staticmethod
    async def get_report(
        session: TenantAwareAsyncSession, report_id: int
    ) -> models.DashboardReport:
        stmt = sa.select(DashboardReport).where(DashboardReport.id == report_id)
        result = (await session.execute(stmt)).scalar_one_or_none()
        if result is None:
            raise DashboardReportNotFoundError(f"Report with {report_id=} not found")
        return models.DashboardReport.from_orm(result)

    @staticmethod
    async def delete_report(session: TenantAwareAsyncSession, report_id: int) -> None:
        report = await session.get(DashboardReport, report_id)
        if report is None:
            raise DashboardReportNotFoundError(f"Report with {report_id=} not found")

        dashboard_id = report.dashboard_id
        dashboard = await session.get(orm_dashboard.Dashboard, dashboard_id)
        if dashboard is None:
            raise orm_dashboard.DashboardNotFoundError(
                f"Dashboard does not exist {dashboard_id=}"
            )

        await session.delete(report)

        dashboard.reports_order.remove(report_id)
        orm.attributes.flag_modified(dashboard, "reports_order")
