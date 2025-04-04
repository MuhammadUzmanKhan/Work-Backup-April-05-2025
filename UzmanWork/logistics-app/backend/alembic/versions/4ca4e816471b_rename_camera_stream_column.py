"""rename camera stream column

Revision ID: 4ca4e816471b
Revises: a8c7aa845c21
Create Date: 2023-08-25 15:34:54.321473

"""

from alembic import op

# revision identifiers, used by Alembic.
revision = "4ca4e816471b"
down_revision = "a8c7aa845c21"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.alter_column("cameras", "source", nullable=False, new_column_name="stream_hash")
    # ### end Alembic commands ###


def downgrade() -> None:
    op.alter_column("cameras", "stream_hash", nullable=False, new_column_name="source")
    # ### end Alembic commands ###
