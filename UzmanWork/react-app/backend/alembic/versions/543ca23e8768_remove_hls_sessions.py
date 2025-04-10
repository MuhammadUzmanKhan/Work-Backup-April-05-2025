"""remove hls sessions

Revision ID: 543ca23e8768
Revises: c87ced13f1c8
Create Date: 2023-06-13 18:09:07.635048

"""

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = "543ca23e8768"
down_revision = "c87ced13f1c8"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_table("hls_sessions")
    # ### end Alembic commands ###


def downgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.create_table(
        "hls_sessions",
        sa.Column("token", sa.VARCHAR(), autoincrement=False, nullable=False),
        sa.Column("stream_name", sa.VARCHAR(), autoincrement=False, nullable=False),
        sa.Column(
            "start_time",
            postgresql.TIMESTAMP(timezone=True),
            autoincrement=False,
            nullable=False,
        ),
        sa.Column(
            "end_time",
            postgresql.TIMESTAMP(timezone=True),
            autoincrement=False,
            nullable=False,
        ),
        sa.PrimaryKeyConstraint(
            "token", "stream_name", "start_time", "end_time", name="hls_sessions_pkey"
        ),
    )
    # ### end Alembic commands ###
