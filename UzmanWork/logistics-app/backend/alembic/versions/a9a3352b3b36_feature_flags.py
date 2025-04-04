"""feature flags

Revision ID: a9a3352b3b36
Revises: 86c77313b668
Create Date: 2023-03-27 10:23:37.544931

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "a9a3352b3b36"
down_revision = "86c77313b668"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "features",
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("default_enabled", sa.Boolean(), nullable=False),
        sa.PrimaryKeyConstraint("name"),
    )
    op.create_table(
        "organization_features",
        sa.Column("org_id", sa.Integer(), nullable=False),
        sa.Column("feature", sa.String(), nullable=False),
        sa.ForeignKeyConstraint(["feature"], ["features.name"]),
        sa.ForeignKeyConstraint(["org_id"], ["organizations.id"]),
        sa.PrimaryKeyConstraint("org_id", "feature"),
    )
    op.drop_table("allowed_products")
    op.drop_table("products")


def downgrade() -> None:
    op.create_table(
        "products",
        sa.Column("id", sa.INTEGER(), autoincrement=True, nullable=False),
        sa.Column("name", sa.VARCHAR(), autoincrement=False, nullable=False),
        sa.PrimaryKeyConstraint("id", name="products_pkey"),
    )
    op.create_table(
        "allowed_products",
        sa.Column("id", sa.INTEGER(), autoincrement=True, nullable=False),
        sa.Column("org_id", sa.INTEGER(), autoincrement=False, nullable=False),
        sa.Column("product_id", sa.INTEGER(), autoincrement=False, nullable=False),
        sa.ForeignKeyConstraint(
            ["org_id"], ["organizations.id"], name="allowed_products_org_id_fkey"
        ),
        sa.ForeignKeyConstraint(
            ["product_id"], ["products.id"], name="allowed_products_product_id_fkey"
        ),
        sa.PrimaryKeyConstraint("id", name="allowed_products_pkey"),
    )

    op.drop_table("organization_features")
    op.drop_table("features")
