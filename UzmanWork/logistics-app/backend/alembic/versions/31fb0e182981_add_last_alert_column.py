"""add last alert column

Revision ID: 31fb0e182981
Revises: 89625cadcc58
Create Date: 2023-04-19 15:50:23.592205

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "31fb0e182981"
down_revision = "cd2458c33792"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "cameras", sa.Column("last_alerted_online_status", sa.BOOLEAN(), nullable=True)
    )
    op.add_column(
        "nvrs", sa.Column("last_alerted_online_status", sa.BOOLEAN(), nullable=True)
    )
    # ### end Alembic commands ###


def downgrade() -> None:
    op.drop_column("nvrs", "last_alerted_online_status")
    op.drop_column("cameras", "last_alerted_online_status")
    # ### end Alembic commands ###
