"""add user_walls tables

Revision ID: 0e4f2d2de4b5
Revises: df08d0c72086
Create Date: 2023-03-17 11:40:09.222387

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "0e4f2d2de4b5"
down_revision = "df08d0c72086"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.create_table(
        "walls",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("owner_user_email", sa.String(), nullable=False),
        sa.Column("name", sa.String(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("owner_user_email", "name"),
    )
    op.create_table(
        "shared_walls",
        sa.Column("wall_id", sa.Integer(), nullable=False),
        sa.Column("shared_with_user_email", sa.String(), nullable=False),
        sa.Column("read_only", sa.Boolean(), nullable=False),
        sa.ForeignKeyConstraint(["wall_id"], ["walls.id"]),
        sa.PrimaryKeyConstraint("wall_id", "shared_with_user_email"),
    )
    op.create_table(
        "wall_tiles",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("wall_id", sa.Integer(), nullable=False),
        sa.Column("camera_mac_address", sa.String(), nullable=True),
        sa.Column("x_start_tile", sa.Integer(), nullable=False),
        sa.Column("y_start_tile", sa.Integer(), nullable=False),
        sa.Column("width_tiles", sa.Integer(), nullable=False),
        sa.Column("height_tiles", sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(["camera_mac_address"], ["cameras.mac_address"]),
        sa.ForeignKeyConstraint(["wall_id"], ["walls.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("wall_id", "camera_mac_address"),
    )
    # ### end Alembic commands ###


def downgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_table("wall_tiles")
    op.drop_table("shared_walls")
    op.drop_table("walls")
    # ### end Alembic commands ###
