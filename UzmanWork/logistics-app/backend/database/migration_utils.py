from dataclasses import dataclass

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

_TEMP_ENUM_NAME = "_temp_enum_name"


@dataclass
class TableColumnPair:
    table_name: str
    column_name: str
    array_column: bool = False


def change_enum_values(
    *,
    table_column_pairs: list[TableColumnPair],
    enum_name: str,
    current_values: set[str],
    new_values: set[str],
) -> None:
    temp_enum = sa.Enum(*new_values, name=_TEMP_ENUM_NAME)
    temp_enum.create(op.get_bind(), checkfirst=False)
    for pair in table_column_pairs:
        if not pair.array_column:
            op.execute(
                f"ALTER TABLE {pair.table_name} ALTER COLUMN {pair.column_name} TYPE "
                f"{_TEMP_ENUM_NAME} USING {pair.column_name}::text::{_TEMP_ENUM_NAME}"
            )
        else:
            op.execute(
                f"ALTER TABLE {pair.table_name} ALTER COLUMN {pair.column_name} TYPE "
                f"{_TEMP_ENUM_NAME}[] USING "
                f"{pair.column_name}::text[]::{_TEMP_ENUM_NAME}[]"
            )
    old_enum = postgresql.ENUM(*current_values, name=enum_name)
    old_enum.drop(op.get_bind(), checkfirst=False)

    op.execute(f"ALTER TYPE {_TEMP_ENUM_NAME} RENAME TO {enum_name}")
