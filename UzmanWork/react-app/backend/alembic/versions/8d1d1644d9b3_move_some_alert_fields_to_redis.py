"""Move some alert fields to redis

Revision ID: 8d1d1644d9b3
Revises: 859164a00795
Create Date: 2023-06-29 15:27:24.238020

"""

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = "8d1d1644d9b3"
down_revision = "17888fb7987a"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.drop_column("cameras", "last_alert_time")
    op.drop_column("nvrs", "last_alert_time")


def downgrade() -> None:
    op.add_column(
        "nvrs",
        sa.Column(
            "last_alert_time",
            postgresql.TIMESTAMP(timezone=True),
            autoincrement=False,
            nullable=True,
        ),
    )
    op.add_column(
        "cameras",
        sa.Column(
            "last_alert_time",
            postgresql.TIMESTAMP(timezone=True),
            autoincrement=False,
            nullable=True,
        ),
    )
