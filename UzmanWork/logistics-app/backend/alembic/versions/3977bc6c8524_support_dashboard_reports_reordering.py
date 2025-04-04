"""Support Dashboard reports reordering

Revision ID: 3977bc6c8524
Revises: aee47da9cde4
Create Date: 2024-02-29 12:15:56.108396

"""

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "3977bc6c8524"
down_revision = "aee47da9cde4"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "dashboards",
        sa.Column(
            "reports_order",
            postgresql.ARRAY(sa.Integer()),
            server_default=sa.text("ARRAY[]::integer[]"),
            nullable=True,
        ),
    )

    op.execute("UPDATE dashboards SET reports_order = ARRAY[]::integer[]")

    op.alter_column(
        "dashboards",
        "reports_order",
        nullable=False,
        existing_type=postgresql.ARRAY(sa.Integer()),
        server_default=sa.text("ARRAY[]::integer[]"),
    )


def downgrade() -> None:
    op.drop_column("dashboards", "reports_order")
