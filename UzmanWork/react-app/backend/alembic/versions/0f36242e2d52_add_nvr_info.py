"""Add NVR info

Revision ID: 0f36242e2d52
Revises: 80f94c145690
Create Date: 2024-04-04 11:55:41.135774

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "0f36242e2d52"
down_revision = "80f94c145690"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("nvrs", sa.Column("nvr_info", sa.JSON(), nullable=True))


def downgrade() -> None:
    op.drop_column("nvrs", "nvr_info")
