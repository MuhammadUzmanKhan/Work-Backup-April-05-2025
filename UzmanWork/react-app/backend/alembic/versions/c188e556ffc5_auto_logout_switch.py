"""auto logout switch

Revision ID: c188e556ffc5
Revises: 43bee3de0688
Create Date: 2023-09-28 14:56:34.084098

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "c188e556ffc5"
down_revision = "43bee3de0688"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "organizations",
        sa.Column(
            "inactive_user_logout_enabled",
            sa.Boolean(),
            nullable=False,
            server_default=sa.sql.false(),
            default=False,
        ),
    )


def downgrade() -> None:
    op.drop_column("organizations", "inactive_user_logout_enabled")
