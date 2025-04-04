"""Remove read-only from wall sharing

Revision ID: d3ca77c2e47b
Revises: 302a420bc3c2
Create Date: 2023-04-13 14:18:01.530167

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "d3ca77c2e47b"
down_revision = "302a420bc3c2"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.drop_column("shared_walls", "read_only")
    # ### end Alembic commands ###


def downgrade() -> None:
    op.add_column(
        "shared_walls",
        sa.Column(
            "read_only",
            sa.BOOLEAN(),
            autoincrement=False,
            nullable=False,
            server_default="0",
        ),
    )
    # ### end Alembic commands ###
