"""update access points

Revision ID: 0e50ff0af31b
Revises: 7cbfdcc2aa72
Create Date: 2023-11-08 17:12:08.147441

"""

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = "0e50ff0af31b"
down_revision = "7cbfdcc2aa72"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.drop_table("access_points_cameras")
    op.drop_table("access_points")

    accesspointvendor_type = postgresql.ENUM(
        "BRIVO", name="accesspointvendor", create_type=False
    )

    op.create_table(
        "access_points",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("vendor", accesspointvendor_type, nullable=False),
        sa.Column("tenant", sa.String(), nullable=False),
        sa.ForeignKeyConstraint(["tenant"], ["organizations.tenant"]),
        sa.PrimaryKeyConstraint("id", "vendor", "tenant"),
    )
    op.create_table(
        "access_points_cameras",
        sa.Column("access_point_id", sa.String(), nullable=False),
        sa.Column("access_point_vendor", accesspointvendor_type, nullable=False),
        sa.Column("tenant", sa.String(), nullable=False),
        sa.Column("camera_mac_address", sa.String(), nullable=False),
        sa.ForeignKeyConstraint(
            ["access_point_id", "access_point_vendor", "tenant"],
            ["access_points.id", "access_points.vendor", "access_points.tenant"],
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["camera_mac_address"], ["cameras.mac_address"], ondelete="CASCADE"
        ),
        sa.PrimaryKeyConstraint(
            "access_point_id", "access_point_vendor", "tenant", "camera_mac_address"
        ),
    )


def downgrade() -> None:
    op.drop_table("access_points_cameras")
    op.drop_table("access_points")

    accesspointvendor_type = postgresql.ENUM(
        "BRIVO", name="accesspointvendor", create_type=False
    )

    op.create_table(
        "access_points",
        sa.Column("id", sa.VARCHAR(), autoincrement=False, nullable=False),
        sa.Column("vendor", accesspointvendor_type, nullable=False),
        sa.PrimaryKeyConstraint("id", name="access_points_pkey"),
    )
    op.create_table(
        "access_points_cameras",
        sa.Column("access_point_id", sa.VARCHAR(), autoincrement=False, nullable=False),
        sa.Column(
            "camera_mac_address", sa.VARCHAR(), autoincrement=False, nullable=False
        ),
        sa.ForeignKeyConstraint(
            ["access_point_id"],
            ["access_points.id"],
            name="access_points_cameras_access_point_id_fkey",
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["camera_mac_address"],
            ["cameras.mac_address"],
            name="access_points_cameras_camera_mac_address_fkey",
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint(
            "access_point_id", "camera_mac_address", name="access_points_cameras_pkey"
        ),
    )
