"""Add an optional description to Dashboard Report

Revision ID: 30ac3a68984b
Revises: 083093c69ddf
Create Date: 2024-03-04 16:00:45.297457

"""

import sqlalchemy as sa
from alembic import op

revision = "30ac3a68984b"
down_revision = "083093c69ddf"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "dashboard_reports", sa.Column("description", sa.String(), nullable=True)
    )


def downgrade() -> None:
    op.drop_column("dashboard_reports", "description")
