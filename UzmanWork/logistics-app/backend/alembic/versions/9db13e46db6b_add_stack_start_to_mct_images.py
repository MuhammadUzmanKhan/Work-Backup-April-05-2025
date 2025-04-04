"""add stack start to mct images

Revision ID: 9db13e46db6b
Revises: 857a48e07d3b
Create Date: 2023-08-22 10:38:35.747791

"""

from alembic import op

# revision identifiers, used by Alembic.
revision = "9db13e46db6b"
down_revision = "857a48e07d3b"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.drop_constraint(
        "mct_images_pkey", "mct_images", type_="primary", schema="public"
    )
    op.create_primary_key(
        "mct_images_pkey",
        "mct_images",
        ["camera_mac_address", "track_id", "perception_stack_start_id", "timestamp"],
    )
    # ### end Alembic commands ###


def downgrade() -> None:
    op.drop_constraint(
        "mct_images_pkey", "mct_images", type_="primary", schema="public"
    )
    op.create_primary_key(
        "mct_images_pkey", "mct_images", ["timestamp", "camera_mac_address", "track_id"]
    )
    # ### end Alembic commands ###
