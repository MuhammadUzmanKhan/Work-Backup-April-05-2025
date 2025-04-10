"""add alta credentials

Revision ID: 428f5af167fe
Revises: afc11aee09a2
Create Date: 2023-11-21 17:08:55.223881

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "428f5af167fe"
down_revision = "afc11aee09a2"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.create_table(
        "alta_credentials",
        sa.Column("tenant", sa.String(), nullable=False),
        sa.Column("email", sa.String(), nullable=False),
        sa.Column("password", sa.String(), nullable=False),
        sa.Column("org_id", sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(["tenant"], ["organizations.tenant"]),
        sa.PrimaryKeyConstraint("tenant"),
    )
    # ### end Alembic commands ###
    op.execute("ALTER TYPE accesspointvendor ADD VALUE 'ALTA'")


def downgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_table("alta_credentials")
    # ### end Alembic commands ###
    # Update access_points table
    # Drop foreign key constraint
    op.drop_constraint(
        "access_points_cameras_access_point_id_access_point_vendor__fkey",
        "access_points_cameras",
        type_="foreignkey",
    )
    # Create new type
    op.execute("CREATE TYPE accesspointvendor_tmp AS ENUM ('BRIVO')")
    # drop all alta access points
    op.execute("DELETE FROM access_points_cameras WHERE access_point_vendor = 'ALTA'")
    op.execute("DELETE FROM access_points WHERE vendor = 'ALTA'")
    # Convert type
    op.execute(
        "ALTER TABLE access_points_cameras ALTER COLUMN access_point_vendor TYPE"
        " accesspointvendor_tmp USING access_point_vendor::text::accesspointvendor_tmp"
    )
    op.execute(
        "ALTER TABLE access_points ALTER COLUMN vendor TYPE accesspointvendor_tmp USING"
        " vendor::text::accesspointvendor_tmp"
    )
    # Drop old type
    op.execute("DROP TYPE accesspointvendor")
    # Rename new type
    op.execute("ALTER TYPE accesspointvendor_tmp RENAME TO accesspointvendor")
    # Recreate foreign key constaint
    op.create_foreign_key(
        "access_points_cameras_access_point_id_access_point_vendor__fkey",
        "access_points_cameras",
        "access_points",
        ["access_point_id", "access_point_vendor", "tenant"],
        ["id", "vendor", "tenant"],
        ondelete="CASCADE",
    )
