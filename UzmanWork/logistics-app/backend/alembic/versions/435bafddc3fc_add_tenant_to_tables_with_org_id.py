"""add tenant to tables with org_id

Revision ID: 435bafddc3fc
Revises: 9e4e578bbe2f
Create Date: 2023-12-05 17:30:09.534134

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "435bafddc3fc"
down_revision = "9e4e578bbe2f"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # add unassigned tenant in tenant table
    op.execute(
        sa.text(
            "INSERT INTO organizations (name, tenant) VALUES ('unassigned',"
            " 'unassigned')"
        )
    )
    op.add_column(
        "camera_groups",
        sa.Column("tenant", sa.String(), server_default="unassigned", nullable=False),
    )
    op.execute(
        """
        update camera_groups set tenant = organizations.tenant from organizations
        where organizations.id = camera_groups.owner_id
        """
    )
    op.create_foreign_key(
        "fk_camera_groups_tenant_organizations",
        "camera_groups",
        "organizations",
        ["tenant"],
        ["tenant"],
    )
    op.add_column(
        "locations",
        sa.Column("tenant", sa.String(), server_default="unassigned", nullable=False),
    )
    op.execute(
        """
        update locations set tenant = organizations.tenant from organizations
        where organizations.id = locations.owner_id
        """
    )
    op.create_foreign_key(
        "fk_locations_tenant_organizations",
        "locations",
        "organizations",
        ["tenant"],
        ["tenant"],
    )
    op.add_column(
        "text_search_requests",
        sa.Column("tenant", sa.String(), server_default="unassigned", nullable=False),
    )
    op.execute(
        """
        update text_search_requests set tenant = organizations.tenant from organizations
        where organizations.id = text_search_requests.organization_id
        """
    )
    op.create_foreign_key(
        "fk_text_search_requests_tenant_organizations",
        "text_search_requests",
        "organizations",
        ["tenant"],
        ["tenant"],
    )
    op.add_column(
        "walls",
        sa.Column("tenant", sa.String(), server_default="unassigned", nullable=False),
    )
    op.execute(
        """
        update walls set tenant = organizations.tenant from organizations
        where organizations.id = walls.organization_id
        """
    )
    op.create_foreign_key(
        "fk_walls_tenant_organizations",
        "walls",
        "organizations",
        ["tenant"],
        ["tenant"],
    )
    # ### end Alembic commands ###


def downgrade() -> None:
    op.drop_constraint("fk_walls_tenant_organizations", "walls", type_="foreignkey")
    op.drop_column("walls", "tenant")
    op.drop_constraint(
        "fk_text_search_requests_tenant_organizations",
        "text_search_requests",
        type_="foreignkey",
    )
    op.drop_column("text_search_requests", "tenant")
    op.drop_constraint(
        "fk_locations_tenant_organizations", "locations", type_="foreignkey"
    )
    op.drop_column("locations", "tenant")
    op.drop_constraint(
        "fk_camera_groups_tenant_organizations", "camera_groups", type_="foreignkey"
    )
    op.drop_column("camera_groups", "tenant")
    op.execute(sa.text("DELETE FROM organizations WHERE tenant = 'unassigned'"))
    # ### end Alembic commands ###
