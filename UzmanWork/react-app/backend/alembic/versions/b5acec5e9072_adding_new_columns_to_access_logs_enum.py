"""Adding new columns to access logs enum

Revision ID: b5acec5e9072
Revises: 2e6502a1282d
Create Date: 2023-10-17 19:33:10.678147

"""

from backend.access_logs.constants import UserActions
from backend.database.migration_utils import TableColumnPair, change_enum_values

# revision identifiers, used by Alembic.
revision = "b5acec5e9072"
down_revision = "2e6502a1282d"
branch_labels = None
depends_on = None


OLD_ACTION_NAME_VALUES = [
    x.name
    for x in UserActions
    if x.name not in ("UPDATED_LOCATION_NAME", "VIEWED_LIVE_STREAM")
]

NEW_ACTION_NAME_VALUES = [x.name for x in UserActions]


TABLE_COLUMN_PAIRS = [TableColumnPair("access_logs", "action")]

ENUM_NAME = "useraction"


def upgrade() -> None:
    change_enum_values(
        table_column_pairs=TABLE_COLUMN_PAIRS,
        enum_name=ENUM_NAME,
        current_values=set(OLD_ACTION_NAME_VALUES),
        new_values=set(NEW_ACTION_NAME_VALUES),
    )


def downgrade() -> None:
    change_enum_values(
        table_column_pairs=TABLE_COLUMN_PAIRS,
        enum_name=ENUM_NAME,
        current_values=set(NEW_ACTION_NAME_VALUES),
        new_values=set(OLD_ACTION_NAME_VALUES),
    )
