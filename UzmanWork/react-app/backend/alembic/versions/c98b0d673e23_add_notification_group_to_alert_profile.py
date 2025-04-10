"""Add notification group to alert profile

Revision ID: c98b0d673e23
Revises: 025c4846e84c
Create Date: 2023-10-20 14:41:46.859868

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "c98b0d673e23"
down_revision = "025c4846e84c"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.create_table(
        "notification_groups_to_alert_profiles",
        sa.Column("profile_id", sa.Integer(), nullable=False),
        sa.Column("notification_group_id", sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(
            ["notification_group_id"], ["notification_groups.id"], ondelete="CASCADE"
        ),
        sa.ForeignKeyConstraint(
            ["profile_id"], ["face_alert_profiles.id"], ondelete="CASCADE"
        ),
        sa.PrimaryKeyConstraint("profile_id", "notification_group_id"),
    )
    op.alter_column(
        "face_alert_profiles",
        "unique_face_id",
        existing_type=sa.VARCHAR(),
        nullable=False,
    )
    # ### end Alembic commands ###


def downgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.alter_column(
        "face_alert_profiles",
        "unique_face_id",
        existing_type=sa.VARCHAR(),
        nullable=True,
    )
    op.drop_table("notification_groups_to_alert_profiles")
    # ### end Alembic commands ###
