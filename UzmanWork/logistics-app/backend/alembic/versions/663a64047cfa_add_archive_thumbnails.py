"""add archive thumbnails

Revision ID: 663a64047cfa
Revises: eea538bf4213
Create Date: 2024-01-09 19:39:27.452349

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "663a64047cfa"
down_revision = "eea538bf4213"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "archived_thumbnails",
        sa.Column("tenant", sa.String(), server_default="unassigned", nullable=False),
        sa.Column("id", sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column("timestamp", sa.TIMESTAMP(timezone=True), nullable=False),
        sa.Column("clip_id", sa.Integer(), nullable=False),
        sa.Column("s3_path", sa.String(), nullable=False),
        sa.ForeignKeyConstraint(["clip_id"], ["clips_data.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    # add index on archive_id and clip_id
    op.create_index(
        "ix_archived_thumbnails_clip_id",
        "archived_thumbnails",
        ["clip_id"],
        unique=False,
    )
    # ### end Alembic commands ###


def downgrade() -> None:
    op.drop_index("ix_archived_thumbnails_clip_id", table_name="archived_thumbnails")
    op.drop_table("archived_thumbnails")
    # ### end Alembic commands ###
