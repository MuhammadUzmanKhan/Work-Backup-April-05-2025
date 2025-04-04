"""add org id fk

Revision ID: ea4a40a71921
Revises: 302a420bc3c2
Create Date: 2023-04-12 11:40:27.854353

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "ea4a40a71921"
down_revision = "d3ca77c2e47b"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("walls", sa.Column("organization_id", sa.Integer(), nullable=True))
    op.create_foreign_key(None, "walls", "organizations", ["organization_id"], ["id"])
    # ### end Alembic commands ###


def downgrade() -> None:
    op.drop_column("walls", "organization_id")
    # ### end Alembic commands ###
