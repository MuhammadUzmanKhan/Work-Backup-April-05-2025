"""Alta JWT-based auth

Revision ID: 2025f8f6f133
Revises: 1e40556373eb
Create Date: 2023-12-07 14:17:35.496454

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "2025f8f6f133"
down_revision = "1e40556373eb"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###

    # Clear the alta_credentials table
    op.execute("TRUNCATE TABLE alta_credentials RESTART IDENTITY CASCADE;")

    op.drop_constraint(
        "fk_access_points_location_id", "access_points", type_="foreignkey"
    )
    op.create_foreign_key(
        "fk_access_points_location_id",
        "access_points",
        "locations",
        ["location_id"],
        ["id"],
        ondelete="CASCADE",
    )
    op.add_column(
        "alta_credentials", sa.Column("public_key", sa.String(), nullable=False)
    )
    op.add_column(
        "alta_credentials", sa.Column("private_key", sa.String(), nullable=False)
    )
    op.add_column(
        "alta_credentials", sa.Column("cert_id", sa.Integer(), nullable=False)
    )
    op.drop_column("alta_credentials", "email")
    op.drop_column("alta_credentials", "password")
    # ### end Alembic commands ###


def downgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    # Clear the alta_credentials table
    op.execute("TRUNCATE TABLE alta_credentials RESTART IDENTITY CASCADE;")

    op.add_column(
        "alta_credentials",
        sa.Column("password", sa.VARCHAR(), autoincrement=False, nullable=False),
    )
    op.add_column(
        "alta_credentials",
        sa.Column("email", sa.VARCHAR(), autoincrement=False, nullable=False),
    )
    op.drop_column("alta_credentials", "cert_id")
    op.drop_column("alta_credentials", "private_key")
    op.drop_column("alta_credentials", "public_key")
    op.drop_constraint(
        "fk_access_points_location_id", "access_points", type_="foreignkey"
    )
    op.create_foreign_key(
        "fk_access_points_location_id",
        "access_points",
        "locations",
        ["location_id"],
        ["id"],
    )
    # ### end Alembic commands ###
