"""Rename license plate detection table

Revision ID: 078b7823e313
Revises: 296ec62bd4dd
Create Date: 2023-11-17 18:29:42.806403

"""

from alembic import op

# revision identifiers, used by Alembic.
revision = "078b7823e313"
down_revision = "296ec62bd4dd"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.rename_table("license_plates", "license_plate_detections")


def downgrade() -> None:
    op.rename_table("license_plate_detections", "license_plates")
    # ### end Alembic commands ###
