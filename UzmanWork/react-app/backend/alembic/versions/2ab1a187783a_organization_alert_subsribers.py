"""organization alert subsribers

Revision ID: 2ab1a187783a
Revises: e512f75fc776
Create Date: 2023-03-10 13:13:46.970175

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "2ab1a187783a"
down_revision = "e512f75fc776"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "organization_alert_subscribers",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column(
            "alert_type",
            sa.Enum("EMAIL", "SMS", name="subscriberalerttype"),
            nullable=False,
        ),
        sa.Column("alert_target", sa.String(), nullable=False),
        sa.Column("organization_tenant", sa.String(), nullable=False),
        sa.ForeignKeyConstraint(
            ["organization_tenant"], ["organizations.tenant"], ondelete="cascade"
        ),
        sa.PrimaryKeyConstraint("id"),
    )


def downgrade() -> None:
    op.drop_table("organization_alert_subscribers")
    subscriber_alert_type = sa.Enum("EMAIL", "SMS", name="subscriberalerttype")
    subscriber_alert_type.drop(op.get_bind())
