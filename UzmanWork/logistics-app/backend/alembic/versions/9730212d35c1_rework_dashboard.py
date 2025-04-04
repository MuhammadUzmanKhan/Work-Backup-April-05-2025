"""Rework dashboard

Revision ID: 9730212d35c1
Revises: 7d384d81429b
Create Date: 2024-02-21 14:04:00.258595

"""

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "9730212d35c1"
down_revision = "7d384d81429b"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("TRUNCATE TABLE dashboards RESTART IDENTITY CASCADE;")

    op.drop_column("dashboards", "time_range")

    op.drop_table("data_sources_to_widgets")
    op.drop_table("dashboard_data_sources")
    op.drop_table("dashboard_widgets")
    op.drop_table("dashboard_metrics")

    op.create_table(
        "dashboard_reports",
        sa.Column("tenant", sa.String(), server_default="unassigned", nullable=False),
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("name", sa.String(), nullable=False, server_default="", default=""),
        sa.Column("dashboard_id", sa.Integer(), nullable=False),
        sa.Column("report_metadata", sa.JSON(), nullable=False),
        sa.ForeignKeyConstraint(["tenant"], ["organizations.tenant"]),
        sa.ForeignKeyConstraint(
            ["dashboard_id"], ["dashboards.id"], ondelete="CASCADE"
        ),
        sa.PrimaryKeyConstraint("id"),
    )

    op.execute("ALTER TABLE dashboards ENABLE ROW LEVEL SECURITY;")
    op.execute(
        """
          CREATE POLICY tenant_isolation on dashboards
          USING (tenant = current_setting('app.tenant'));
          """
    )

    op.execute("ALTER TABLE dashboard_reports ENABLE ROW LEVEL SECURITY;")
    op.execute(
        """
          CREATE POLICY tenant_isolation on dashboard_reports
          USING (tenant = current_setting('app.tenant'));
          """
    )


def downgrade() -> None:
    op.create_table(
        "dashboard_metrics",
        sa.Column("tenant", sa.String(), server_default="unassigned", nullable=False),
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("dashboard_id", sa.Integer(), nullable=False),
        sa.Column("metric_name", sa.String(), nullable=False),
        sa.Column("metric_metadata", sa.JSON(), nullable=False),
        sa.ForeignKeyConstraint(
            ["dashboard_id"], ["dashboards.id"], ondelete="CASCADE"
        ),
        sa.ForeignKeyConstraint(["tenant"], ["organizations.tenant"]),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_table(
        "dashboard_widgets",
        sa.Column("tenant", sa.String(), server_default="unassigned", nullable=False),
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("dashboard_id", sa.Integer(), nullable=False),
        sa.Column("widget_name", sa.String(), nullable=False),
        sa.Column("metric_id", sa.Integer(), nullable=True),
        sa.Column("widget_metadata", sa.JSON(), nullable=False),
        sa.ForeignKeyConstraint(
            ["dashboard_id"], ["dashboards.id"], ondelete="CASCADE"
        ),
        sa.ForeignKeyConstraint(["metric_id"], ["dashboard_metrics.id"]),
        sa.ForeignKeyConstraint(["tenant"], ["organizations.tenant"]),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_table(
        "dashboard_data_sources",
        sa.Column("tenant", sa.String(), server_default="unassigned", nullable=False),
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("dashboard_id", sa.Integer(), nullable=False),
        sa.Column("mac_address", sa.String(), nullable=False),
        sa.Column(
            "roi_polygon", postgresql.ARRAY(sa.Float(), dimensions=2), nullable=False
        ),
        sa.ForeignKeyConstraint(
            ["dashboard_id"], ["dashboards.id"], ondelete="CASCADE"
        ),
        sa.ForeignKeyConstraint(
            ["mac_address"], ["cameras.mac_address"], ondelete="CASCADE"
        ),
        sa.ForeignKeyConstraint(["tenant"], ["organizations.tenant"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("dashboard_id", "mac_address"),
    )

    op.create_table(
        "data_sources_to_widgets",
        sa.Column("tenant", sa.String(), server_default="unassigned", nullable=False),
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("widget_id", sa.Integer(), nullable=False),
        sa.Column("data_source_id", sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(
            ["data_source_id"], ["dashboard_data_sources.id"], ondelete="CASCADE"
        ),
        sa.ForeignKeyConstraint(["tenant"], ["organizations.tenant"]),
        sa.ForeignKeyConstraint(
            ["widget_id"], ["dashboard_widgets.id"], ondelete="CASCADE"
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("widget_id", "data_source_id"),
    )

    op.drop_table("dashboard_reports")

    op.add_column("dashboards", sa.Column("time_range", sa.JSON(), nullable=False))

    op.execute("ALTER TABLE dashboards DISABLE ROW LEVEL SECURITY;")
    op.execute("DROP POLICY tenant_isolation on dashboards;")
