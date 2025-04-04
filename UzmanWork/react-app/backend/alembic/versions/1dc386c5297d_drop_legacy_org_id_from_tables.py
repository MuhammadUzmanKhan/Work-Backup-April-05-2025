"""drop legacy org_id from tables

Revision ID: 1dc386c5297d
Revises: 7320833d01d1
Create Date: 2024-02-09 15:03:47.705530

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "1dc386c5297d"
down_revision = "7320833d01d1"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.drop_constraint(
        "camera_groups_owner_id_fkey", "camera_groups", type_="foreignkey"
    )
    op.drop_column("camera_groups", "owner_id")
    op.drop_constraint("locations_owner_id_fkey", "locations", type_="foreignkey")
    op.drop_column("locations", "owner_id")
    op.drop_constraint(
        "organization_features_org_id_fkey", "organization_features", type_="foreignkey"
    )
    op.drop_column("organization_features", "org_id")
    op.drop_constraint(
        "text_search_requests_organization_id_fkey",
        "text_search_requests",
        type_="foreignkey",
    )
    op.drop_column("text_search_requests", "organization_id")
    op.drop_constraint(
        "walls_owner_user_email_name_org_id_key", "walls", type_="unique"
    )
    op.create_unique_constraint(
        "walls_organization_tenant_fkey",
        "walls",
        ["owner_user_email", "name", "tenant"],
    )
    op.drop_constraint("walls_organization_id_fkey", "walls", type_="foreignkey")
    op.drop_column("walls", "organization_id")
    # ### end Alembic commands ###


def downgrade() -> None:
    op.add_column(
        "walls",
        sa.Column("organization_id", sa.INTEGER(), autoincrement=False, nullable=True),
    )
    # backfill using the tenant from the organization and remove nullable
    op.execute(
        """
        UPDATE walls SET organization_id = organizations.id FROM organizations
        WHERE walls.tenant = organizations.tenant
        """
    )
    op.alter_column(
        "walls", "organization_id", existing_type=sa.INTEGER(), nullable=False
    )
    op.create_foreign_key(
        "walls_organization_id_fkey",
        "walls",
        "organizations",
        ["organization_id"],
        ["id"],
    )
    op.drop_constraint("walls_organization_tenant_fkey", "walls", type_="unique")
    op.create_unique_constraint(
        "walls_owner_user_email_name_org_id_key",
        "walls",
        ["owner_user_email", "name", "organization_id"],
    )
    op.add_column(
        "text_search_requests",
        sa.Column("organization_id", sa.INTEGER(), autoincrement=False, nullable=True),
    )
    # backfill using the tenant from the organization and remove nullable
    op.execute(
        """
        UPDATE text_search_requests
        SET organization_id = organizations.id FROM organizations
        WHERE text_search_requests.tenant = organizations.tenant
        """
    )
    op.alter_column(
        "text_search_requests",
        "organization_id",
        existing_type=sa.INTEGER(),
        nullable=False,
    )
    op.create_foreign_key(
        "text_search_requests_organization_id_fkey",
        "text_search_requests",
        "organizations",
        ["organization_id"],
        ["id"],
    )
    op.add_column(
        "organization_features",
        sa.Column("org_id", sa.INTEGER(), autoincrement=False, nullable=True),
    )
    # backfill using the tenant from the organization and remove nullable
    op.execute(
        """
        UPDATE organization_features SET org_id = organizations.id FROM organizations
        WHERE organization_features.tenant = organizations.tenant
        """
    )
    op.alter_column(
        "organization_features", "org_id", existing_type=sa.INTEGER(), nullable=False
    )
    op.create_foreign_key(
        "organization_features_org_id_fkey",
        "organization_features",
        "organizations",
        ["org_id"],
        ["id"],
    )
    op.add_column(
        "locations",
        sa.Column("owner_id", sa.INTEGER(), autoincrement=False, nullable=True),
    )
    # backfill using the tenant from the organization and remove nullable
    op.execute(
        """
        UPDATE locations SET owner_id = organizations.id FROM organizations
        WHERE locations.tenant = organizations.tenant
        """
    )
    op.alter_column("locations", "owner_id", existing_type=sa.INTEGER(), nullable=False)

    op.create_foreign_key(
        "locations_owner_id_fkey", "locations", "organizations", ["owner_id"], ["id"]
    )
    op.add_column(
        "camera_groups",
        sa.Column("owner_id", sa.INTEGER(), autoincrement=False, nullable=True),
    )
    # backfill using the tenant from the organization and remove nullable
    op.execute(
        """
        UPDATE camera_groups SET owner_id = organizations.id FROM organizations
        WHERE camera_groups.tenant = organizations.tenant
        """
    )
    op.alter_column(
        "camera_groups", "owner_id", existing_type=sa.INTEGER(), nullable=False
    )
    op.create_foreign_key(
        "camera_groups_owner_id_fkey",
        "camera_groups",
        "organizations",
        ["owner_id"],
        ["id"],
    )
    # ### end Alembic commands ###
