"""Add Camera Stream details

Revision ID: 5563572938a2
Revises: f1f1a89b8cb4
Create Date: 2024-03-21 12:16:20.904074

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "5563572938a2"
down_revision = "f1f1a89b8cb4"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("cameras", sa.Column("width", sa.Integer(), nullable=True))
    op.add_column("cameras", sa.Column("height", sa.Integer(), nullable=True))
    op.add_column("cameras", sa.Column("fps", sa.Integer(), nullable=True))
    op.add_column("cameras", sa.Column("bitrate_kbps", sa.Integer(), nullable=True))
    op.add_column("cameras", sa.Column("codec", sa.String(), nullable=True))


def downgrade() -> None:
    op.drop_column("cameras", "codec")
    op.drop_column("cameras", "bitrate_kbps")
    op.drop_column("cameras", "fps")
    op.drop_column("cameras", "height")
    op.drop_column("cameras", "width")
