"""rename organization column OrganizationAlertSubscriber

Revision ID: 1d6128270b4e
Revises: 435bafddc3fc
Create Date: 2023-12-11 18:15:46.188990

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "1d6128270b4e"
down_revision = "435bafddc3fc"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.alter_column(
        "organization_alert_subscribers",
        "organization_tenant",
        new_column_name="tenant",
        existing_type=sa.VARCHAR(),
    )

    # ### end Alembic commands ###


def downgrade() -> None:
    op.alter_column(
        "organization_alert_subscribers",
        "tenant",
        new_column_name="organization_tenant",
        existing_type=sa.VARCHAR(),
    )
    # ### end Alembic commands ###
