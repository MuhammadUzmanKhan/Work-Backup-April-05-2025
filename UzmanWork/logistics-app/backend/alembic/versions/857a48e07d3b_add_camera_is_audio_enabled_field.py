"""Add Camera.is_audio_enabled field

Revision ID: 857a48e07d3b
Revises: 3357def83ce8
Create Date: 2023-08-15 18:24:11.529015

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "857a48e07d3b"
down_revision = "3357def83ce8"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.add_column(
        "cameras",
        sa.Column(
            "is_audio_enabled",
            sa.Boolean(),
            nullable=False,
            default=False,
            server_default="false",
        ),
    )
    # ### end Alembic commands ###


def downgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_column("cameras", "is_audio_enabled")
    # ### end Alembic commands ###
