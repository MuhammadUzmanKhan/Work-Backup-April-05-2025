"""Add unique constraint on location name and tenant

Revision ID: 9ce22279da30
Revises: 0f36242e2d52
Create Date: 2024-04-08 11:26:30.890297

"""

from alembic import op

# revision identifiers, used by Alembic.
revision = "9ce22279da30"
down_revision = "0f36242e2d52"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    # Rename duplicated location names
    op.execute(
        """
        WITH loc_info AS (
            SELECT
                id,
                name,
                tenant,
                row_number() OVER (PARTITION BY name, tenant ORDER BY id) AS name_count
            FROM
                locations
        )
        UPDATE
            locations AS loc
        SET
            name = concat(loc.name, '_', loc_info.name_count)
        FROM
            loc_info
        WHERE
            loc.id = loc_info.id
            AND loc_info.name_count > 1;
    """
    )
    # Add unique constraint on location name and tenant
    op.create_unique_constraint(
        "uc_locations_name_tenant_key", "locations", ["name", "tenant"]
    )
    # ### end Alembic commands ###


def downgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_constraint("uc_locations_name_tenant_key", "locations", type_="unique")


# ### end Alembic commands ###
