"""make org id mandatory

Revision ID: 89625cadcc58
Revises: cbba0ec98c56
Create Date: 2023-04-17 16:29:21.068600

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "89625cadcc58"
down_revision = "d1c69e4fc395"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.alter_column(
        "walls", "organization_id", existing_type=sa.INTEGER(), nullable=False
    )
    # ### end Alembic commands ###


def downgrade() -> None:
    op.alter_column(
        "walls", "organization_id", existing_type=sa.INTEGER(), nullable=True
    )
    # ### end Alembic commands ###
