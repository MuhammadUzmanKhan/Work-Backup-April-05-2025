"""add tenant to organization_features

Revision ID: b3070ad6eb01
Revises: 1d6128270b4e
Create Date: 2023-12-11 19:02:24.690972

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "b3070ad6eb01"
down_revision = "1d6128270b4e"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "organization_features",
        sa.Column("tenant", sa.String(), server_default="unassigned", nullable=False),
    )
    op.execute(
        """update organization_features set tenant = organizations.tenant
        from organizations where organizations.id = organization_features.org_id"""
    )
    op.create_foreign_key(
        "fk_organization_features_tenant",
        "organization_features",
        "organizations",
        ["tenant"],
        ["tenant"],
    )
    # ### end Alembic commands ###


def downgrade() -> None:
    op.drop_constraint(
        "fk_organization_features_tenant", "organization_features", type_="foreignkey"
    )
    op.drop_column("organization_features", "tenant")
    # ### end Alembic commands ###
