"""Add Brivo

Revision ID: 776fe391a857
Revises: 4fd42da9e92d
Create Date: 2023-10-25 16:59:43.354359

"""

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = "776fe391a857"
down_revision = "4fd42da9e92d"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    accesspointvendor_type = postgresql.ENUM(
        "BRIVO", name="accesspointvendor", create_type=True
    )

    op.create_table(
        "access_points",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("vendor", accesspointvendor_type, nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_table(
        "brivo_tokens",
        sa.Column("tenant", sa.String(), nullable=False),
        sa.Column("refresh_token", sa.String(), nullable=False),
        sa.ForeignKeyConstraint(["tenant"], ["organizations.tenant"]),
        sa.PrimaryKeyConstraint("tenant"),
    )
    op.create_table(
        "access_points_cameras",
        sa.Column("access_point_id", sa.String(), nullable=False),
        sa.Column("camera_mac_address", sa.String(), nullable=False),
        sa.ForeignKeyConstraint(
            ["access_point_id"], ["access_points.id"], ondelete="CASCADE"
        ),
        sa.ForeignKeyConstraint(
            ["camera_mac_address"], ["cameras.mac_address"], ondelete="CASCADE"
        ),
        sa.PrimaryKeyConstraint("access_point_id", "camera_mac_address"),
    )
    # ### end Alembic commands ###


def downgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_table("access_points_cameras")
    op.drop_table("brivo_tokens")
    op.drop_table("access_points")
    op.execute("DROP TYPE accesspointvendor")
    # ### end Alembic commands ###
