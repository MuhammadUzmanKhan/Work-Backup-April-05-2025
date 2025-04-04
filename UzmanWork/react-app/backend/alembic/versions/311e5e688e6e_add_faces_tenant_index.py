"""add faces tenant index

Revision ID: 311e5e688e6e
Revises: 0a5ac5f6677f
Create Date: 2024-04-23 14:29:27.069698

"""

from alembic import op

# revision identifiers, used by Alembic.
revision = "311e5e688e6e"
down_revision = "0a5ac5f6677f"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute(
        "CREATE INDEX IF NOT EXISTS idx_face_occurrence_with_tenant_queries ON"
        " face_occurrences (tenant, nvr_unique_face_id, mac_address, occurrence_time);"
    )
    # ### end Alembic commands ###


def downgrade() -> None:
    # NOTE(@lberg): we don't drop the index here because we might have not been the
    # ones who created it.
    pass
