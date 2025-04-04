"""Relax unique constraint

Revision ID: 34a2c72f511a
Revises: 89625cadcc58
Create Date: 2023-04-20 14:00:30.462448

"""

from alembic import op

# revision identifiers, used by Alembic.
revision = "34a2c72f511a"
down_revision = "89625cadcc58"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.drop_constraint("walls_owner_user_email_name_key", "walls", type_="unique")
    op.create_unique_constraint(
        "walls_owner_user_email_name_org_id_key",
        "walls",
        ["owner_user_email", "name", "organization_id"],
    )
    # ### end Alembic commands ###


def downgrade() -> None:
    op.drop_constraint(
        "walls_owner_user_email_name_org_id_key", "walls", type_="unique"
    )
    op.create_unique_constraint(
        "walls_owner_user_email_name_key", "walls", ["owner_user_email", "name"]
    )
    # ### end Alembic commands ###
