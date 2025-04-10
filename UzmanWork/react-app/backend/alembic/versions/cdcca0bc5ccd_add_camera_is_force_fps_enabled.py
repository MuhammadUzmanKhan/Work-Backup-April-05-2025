"""Add Camera.is_force_fps_enabled

Revision ID: cdcca0bc5ccd
Revises: d6028c9c04b2
Create Date: 2024-01-15 20:45:14.895244

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "cdcca0bc5ccd"
down_revision = "d6028c9c04b2"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.add_column(
        "cameras",
        sa.Column(
            "is_force_fps_enabled",
            sa.Boolean(),
            nullable=False,
            default=False,
            server_default="false",
        ),
    )
    # ### end Alembic commands ###


def downgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_column("cameras", "is_force_fps_enabled")
    # ### end Alembic commands ###
