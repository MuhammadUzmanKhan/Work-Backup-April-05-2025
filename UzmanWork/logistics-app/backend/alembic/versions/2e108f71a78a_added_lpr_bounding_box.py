"""added lpr bounding box

Revision ID: 2e108f71a78a
Revises: 04dcc11d6739
Create Date: 2023-07-31 11:53:14.893088

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "2e108f71a78a"
down_revision = "04dcc11d6739"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "license_plates",
        sa.Column("x_min", sa.Float(), nullable=False, server_default=sa.text("0")),
    )
    op.add_column(
        "license_plates",
        sa.Column("y_min", sa.Float(), nullable=False, server_default=sa.text("0")),
    )
    op.add_column(
        "license_plates",
        sa.Column("x_max", sa.Float(), nullable=False, server_default=sa.text("0")),
    )
    op.add_column(
        "license_plates",
        sa.Column("y_max", sa.Float(), nullable=False, server_default=sa.text("0")),
    )
    op.drop_column("license_plates", "thumbnail_s3_path")
    # ### end Alembic commands ###


def downgrade() -> None:
    op.add_column(
        "license_plates", sa.Column("thumbnail_s3_path", sa.String(), nullable=False)
    )
    op.drop_column("license_plates", "x_min")
    op.drop_column("license_plates", "y_min")
    op.drop_column("license_plates", "x_max")
    op.drop_column("license_plates", "y_max")
    # ### end Alembic commands ###
