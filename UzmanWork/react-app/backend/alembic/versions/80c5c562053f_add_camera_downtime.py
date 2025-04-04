"""Add Camera Downtime

Revision ID: 80c5c562053f
Revises: 63630ec31ffc
Create Date: 2024-03-22 12:45:50.276103

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "80c5c562053f"
down_revision = "63630ec31ffc"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "camera_downtimes",
        sa.Column("tenant", sa.String(), server_default="unassigned", nullable=False),
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("camera_mac_address", sa.String(), nullable=False),
        sa.Column("downtime_start", sa.TIMESTAMP(timezone=True), nullable=False),
        sa.Column("downtime_end", sa.TIMESTAMP(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["camera_mac_address"], ["cameras.mac_address"]),
        sa.ForeignKeyConstraint(["tenant"], ["organizations.tenant"]),
        sa.PrimaryKeyConstraint("id"),
    )

    op.execute("ALTER TABLE camera_downtimes ENABLE ROW LEVEL SECURITY;")
    op.execute(
        """
            CREATE POLICY tenant_isolation on camera_downtimes
            USING (tenant = current_setting('app.tenant'));
            """
    )


def downgrade() -> None:
    op.drop_table("camera_downtimes")
