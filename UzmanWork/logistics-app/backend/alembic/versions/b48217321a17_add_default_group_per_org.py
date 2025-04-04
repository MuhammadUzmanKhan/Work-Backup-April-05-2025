"""Add default group per org

Revision ID: b48217321a17
Revises: 4dc97919edb2
Create Date: 2024-03-14 13:04:58.878510

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "b48217321a17"
down_revision = "4dc97919edb2"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "camera_groups",
        sa.Column(
            "is_default", sa.Boolean(), nullable=False, server_default=sa.text("false")
        ),
    )
    op.create_index(
        "ix_camera_groups_only_one_default",
        "camera_groups",
        ["is_default", "tenant"],
        unique=True,
        postgresql_where=sa.text("is_default"),
    )
    # Add a single default group for each tenant
    op.execute(
        "INSERT INTO camera_groups (name, tenant, is_default) SELECT 'Default Group',"
        " tenant, true FROM organizations;"
    )
    # assign all unassigned cameras to the default group of their tenant
    op.execute(
        "UPDATE cameras SET camera_group_id = camera_groups.id FROM camera_groups"
        " WHERE camera_groups.is_default = true AND cameras.camera_group_id IS NULL"
        " AND cameras.tenant = camera_groups.tenant;"
    )
    # remove optionality of camera_group_id in cameras
    op.alter_column(
        "cameras", "camera_group_id", existing_type=sa.INTEGER(), nullable=False
    )
    # ### end Alembic commands ###


def downgrade() -> None:
    # add back optionality of camera_group_id in cameras
    op.alter_column(
        "cameras", "camera_group_id", existing_type=sa.INTEGER(), nullable=True
    )
    # remove groups from cameras if they are assigned to the default group
    op.execute(
        "UPDATE cameras SET camera_group_id = NULL FROM camera_groups WHERE"
        " camera_groups.is_default = true AND cameras.camera_group_id ="
        " camera_groups.id;"
    )
    op.drop_index(
        "ix_camera_groups_only_one_default",
        table_name="camera_groups",
        postgresql_where=sa.text("is_default"),
    )
    # remove all default groups
    op.execute("DELETE FROM camera_groups WHERE is_default = true;")
    op.drop_column("camera_groups", "is_default")
    # ### end Alembic commands ###
