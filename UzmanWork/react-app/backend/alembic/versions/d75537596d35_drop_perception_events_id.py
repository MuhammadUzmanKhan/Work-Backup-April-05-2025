"""Drop perception events id

Revision ID: d75537596d35
Revises: cbba0ec98c56
Create Date: 2023-04-18 01:46:10.864996

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "d75537596d35"
down_revision = "cbba0ec98c56"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.drop_column("perception_object_events", "id")
    # ### end Alembic commands ###


def downgrade() -> None:
    op.add_column(
        "perception_object_events",
        sa.Column("id", sa.INTEGER(), autoincrement=True, nullable=False),
    )
    # ### end Alembic commands ###
