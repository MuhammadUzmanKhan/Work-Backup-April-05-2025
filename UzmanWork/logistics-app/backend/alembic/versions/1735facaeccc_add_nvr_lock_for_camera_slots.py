"""Add nvr lock for camera slots

Revision ID: 1735facaeccc
Revises: 4ac039f9d250
Create Date: 2024-03-19 17:19:41.359332

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "1735facaeccc"
down_revision = "4ac039f9d250"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.add_column(
        "nvrs",
        sa.Column(
            "max_cameras_slots_locked",
            sa.Boolean(),
            nullable=False,
            default=False,
            server_default="false",
        ),
    )
    # ### end Alembic commands ###


def downgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_column("nvrs", "max_cameras_slots_locked")
    # ### end Alembic commands ###
