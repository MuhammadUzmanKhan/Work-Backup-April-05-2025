"""add rtsp port to camera

Revision ID: be2ce67ccf41
Revises: c98b0d673e23
Create Date: 2023-10-24 12:11:43.968763

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "be2ce67ccf41"
down_revision = "c98b0d673e23"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "cameras",
        sa.Column("rtsp_port", sa.Integer(), nullable=False, server_default="0"),
    )
    # ### end Alembic commands ###


def downgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_column("cameras", "rtsp_port")
    # ### end Alembic commands ###
