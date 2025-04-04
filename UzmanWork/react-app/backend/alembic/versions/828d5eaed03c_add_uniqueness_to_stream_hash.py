"""add uniqueness to stream hash

Revision ID: 828d5eaed03c
Revises: 1dc386c5297d
Create Date: 2024-02-19 18:59:44.711982

"""

from alembic import op

# revision identifiers, used by Alembic.
revision = "828d5eaed03c"
down_revision = "1dc386c5297d"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_unique_constraint("uc_cameras_stream_hash", "cameras", ["stream_hash"])
    # ### end Alembic commands ###


def downgrade() -> None:
    op.drop_constraint("uc_cameras_stream_hash", "cameras", type_="unique")
    # ### end Alembic commands ###
