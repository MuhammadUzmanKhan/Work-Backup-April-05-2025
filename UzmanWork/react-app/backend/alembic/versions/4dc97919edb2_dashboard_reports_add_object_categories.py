"""Dashboard Reports: add object_categories

Revision ID: 4dc97919edb2
Revises: 051740001e29
Create Date: 2024-03-11 12:30:21.501066

"""

import sqlalchemy as sa
from alembic import op
from sqlalchemy.sql import column, table
from sqlalchemy.sql.expression import update

revision = "4dc97919edb2"
down_revision = "051740001e29"
branch_labels = None
depends_on = None


def upgrade() -> None:
    dashboard_reports = table(
        "dashboard_reports",
        column("id", sa.Integer),
        column("report_metadata", sa.JSON),
    )

    conn = op.get_bind()

    dashboard_reports_select = sa.select([dashboard_reports])
    results = conn.execute(dashboard_reports_select)

    for row in results:
        if row.report_metadata is not None and row.report_metadata != {}:
            updated_metadata = row.report_metadata
            report_configuration = updated_metadata.get("configuration", {})
            report_configuration["object_categories"] = ["motion"]

            conn.execute(
                update(dashboard_reports)
                .where(dashboard_reports.c.id == row.id)
                .values(report_metadata=updated_metadata)
            )


def downgrade() -> None:
    dashboard_reports = table(
        "dashboard_reports",
        column("id", sa.Integer),
        column("report_metadata", sa.JSON),
    )

    conn = op.get_bind()

    dashboard_reports_select = sa.select([dashboard_reports])
    results = conn.execute(dashboard_reports_select)

    for row in results:
        if row.report_metadata and "object_categories" in row.report_metadata:
            updated_metadata = row.report_metadata
            report_configuration = updated_metadata["configuration"]
            del report_configuration["object_categories"]

            conn.execute(
                update(dashboard_reports)
                .where(dashboard_reports.c.id == row.id)
                .values(report_metadata=updated_metadata)
            )
