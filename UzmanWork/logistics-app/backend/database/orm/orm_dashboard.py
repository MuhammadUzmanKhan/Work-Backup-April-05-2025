from __future__ import annotations

from typing import List

import sqlalchemy as sa
from sqlalchemy import orm
from sqlalchemy.dialects.postgresql import ARRAY

from backend.database import dashboard_models as models
from backend.database.orm import orm_dashboard_report
from backend.database.orm.orm_utils import TenantProtectedTable
from backend.database.session import TenantAwareAsyncSession


class DashboardError(Exception):
    pass


class DashboardUpdateError(DashboardError):
    pass


class DashboardDeleteError(DashboardError):
    pass


class DashboardNotFoundError(DashboardError):
    pass


class Dashboard(TenantProtectedTable):
    __tablename__ = "dashboards"

    id: orm.Mapped[int] = sa.Column(sa.Integer, primary_key=True, autoincrement=True)
    title = sa.Column(sa.String, nullable=False)
    description = sa.Column(sa.String, nullable=True)
    owner_user_email = sa.Column(sa.String, nullable=False)
    creation_time = sa.Column(sa.TIMESTAMP(timezone=True), nullable=False)
    reports: orm.Mapped[List[orm_dashboard_report.DashboardReport]] = orm.relationship(
        "DashboardReport"
    )
    reports_order: list[int] = sa.Column(
        ARRAY(sa.Integer),
        nullable=False,
        default=[],
        server_default=sa.text("ARRAY[]::integer[]"),
    )

    __table_args__ = ((sa.ForeignKeyConstraint(["tenant"], ["organizations.tenant"])),)

    @staticmethod
    async def create_dashboard(
        session: TenantAwareAsyncSession, dashboard_create: models.DashboardCreate
    ) -> int:
        """Create a new dashboard."""

        dashboard_title = await Dashboard._generate_unique_dashboard_title(session)

        dashboard = Dashboard(
            owner_user_email=dashboard_create.owner_user_email,
            creation_time=dashboard_create.creation_time,
            title=dashboard_title,
            tenant=session.tenant,
        )
        session.add(dashboard)
        await session.flush()
        return dashboard.id

    @staticmethod
    async def get_dashboard_by_id(
        session: TenantAwareAsyncSession, dashboard_id: int
    ) -> models.Dashboard:
        """Get dashboard given dashboard id."""

        stmt = (
            sa.select(Dashboard)
            .options(orm.selectinload(Dashboard.reports))
            .where(Dashboard.id == dashboard_id)
        )
        try:
            result = (await session.execute(stmt)).one()
        except orm.exc.NoResultFound:
            raise DashboardNotFoundError(f"Dashboard with {dashboard_id=} not found")

        dashboard_entity = result.Dashboard
        dashboard_model = models.Dashboard.from_orm(dashboard_entity)

        dashboard_model.reorder_reports(dashboard_entity.reports_order)

        return dashboard_model

    @staticmethod
    async def get_dashboards(
        session: TenantAwareAsyncSession,
    ) -> list[models.DashboardSummaryModel]:
        """Get dashboards owned by tenant."""
        stmt = sa.select(Dashboard)

        results = await session.execute(stmt)
        return [models.DashboardSummaryModel.from_orm(row.Dashboard) for row in results]

    @staticmethod
    async def get_dashboard_ids(session: TenantAwareAsyncSession) -> list[int]:
        """Get dashboard ids owned by tenant."""
        stmt = sa.select(Dashboard.id)
        results = await session.execute(stmt)
        return [row.id for row in results]

    @staticmethod
    async def delete_dashboard(
        session: TenantAwareAsyncSession, dashboard_id: int
    ) -> None:
        """Delete a dashboard."""
        stmt = sa.delete(Dashboard).where(Dashboard.id == dashboard_id)
        row_count = (await session.execute(stmt)).rowcount  # type: ignore[attr-defined]

        if row_count != 1:
            raise DashboardDeleteError(
                f"Expected to delete 1 dashboard, but deleted {row_count} dashboards"
            )

    @staticmethod
    async def update_dashboard_details(
        session: TenantAwareAsyncSession,
        dashboard_id: int,
        title: str,
        description: str,
    ) -> None:
        stmt = (
            sa.update(Dashboard)
            .where(Dashboard.id == dashboard_id)
            .values(title=title)
            .values(description=description)
        )
        row_count = (await session.execute(stmt)).rowcount  # type: ignore[attr-defined]

        if row_count != 1:
            raise DashboardUpdateError(
                "Expected to update title for 1 dashboard, but updated"
                f" {row_count} dashboard"
            )

    @staticmethod
    async def update_reports_order(
        session: TenantAwareAsyncSession, dashboard_id: int, reports_order: list[int]
    ) -> None:
        stmt = (
            sa.update(Dashboard)
            .where(Dashboard.id == dashboard_id)
            .values(reports_order=reports_order)
        )

        row_count = (await session.execute(stmt)).rowcount  # type: ignore[attr-defined]
        if row_count != 1:
            raise DashboardUpdateError(
                "Expected to update reports order for 1 dashboard, "
                f"but updated {row_count} dashboards."
            )

    @staticmethod
    async def _generate_unique_dashboard_title(session: TenantAwareAsyncSession) -> str:
        """Generate a unique dashboard name."""

        async def _dashboard_title_exists(
            session: TenantAwareAsyncSession, title: str
        ) -> bool:
            """Check if a dashboard title exists."""
            stmt = sa.select(sa.func.count(Dashboard.id)).where(
                Dashboard.title == title
            )
            result = await session.execute(stmt)
            return int(result.scalar_one()) > 0

        async def _get_dashboard_count(session: TenantAwareAsyncSession) -> int:
            """Get the number of dashboards for a tenant."""
            stmt = sa.select(sa.func.count(Dashboard.id))
            result = await session.execute(stmt)
            return int(result.scalar_one())

        dashboard_count = await _get_dashboard_count(session=session)

        while True:
            dashboard_title = f"Dashboard {dashboard_count + 1}"

            if not await _dashboard_title_exists(
                session=session, title=dashboard_title
            ):
                return dashboard_title

            dashboard_count += 1

    @staticmethod
    async def dashboard_exists(
        session: TenantAwareAsyncSession, dashboard_id: int
    ) -> bool:
        """Check if a dashboard exists."""
        query = sa.select(Dashboard).where(Dashboard.id == dashboard_id)
        result = (await session.execute(query)).scalar_one_or_none()
        return result is not None
