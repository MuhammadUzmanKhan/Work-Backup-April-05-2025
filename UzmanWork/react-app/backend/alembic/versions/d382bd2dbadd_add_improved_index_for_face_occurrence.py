"""add improved index for face occurrence

Revision ID: d382bd2dbadd
Revises: c188e556ffc5
Create Date: 2023-10-05 13:12:53.515619

"""

from alembic import op

# revision identifiers, used by Alembic.
revision = "d382bd2dbadd"
down_revision = "c188e556ffc5"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_index("face_occurrence_time_mac_address_idx", table_name="face_occurrences")
    op.create_index(
        "face_occurrence_time_mac_address_idx",
        "face_occurrences",
        ["mac_address", "occurrence_time"],
        unique=False,
    )
    # ### end Alembic commands ###


def downgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_index("face_occurrence_time_mac_address_idx", table_name="face_occurrences")
    op.create_index(
        "face_occurrence_time_mac_address_idx",
        "face_occurrences",
        ["occurrence_time", "mac_address"],
        unique=False,
    )
    # ### end Alembic commands ###
