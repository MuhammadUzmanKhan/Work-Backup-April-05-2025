"""Move last alerted status to redis

Revision ID: 813d76d71037
Revises: 857a48e07d3b
Create Date: 2023-08-21 13:50:44.038035

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "813d76d71037"
down_revision = "9db13e46db6b"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.drop_column("cameras", "last_alerted_online_status")
    op.drop_column("nvrs", "last_alerted_online_status")


def downgrade() -> None:
    op.add_column(
        "nvrs",
        sa.Column(
            "last_alerted_online_status",
            sa.BOOLEAN(),
            autoincrement=False,
            nullable=True,
        ),
    )
    op.add_column(
        "cameras",
        sa.Column(
            "last_alerted_online_status",
            sa.BOOLEAN(),
            autoincrement=False,
            nullable=True,
        ),
    )
