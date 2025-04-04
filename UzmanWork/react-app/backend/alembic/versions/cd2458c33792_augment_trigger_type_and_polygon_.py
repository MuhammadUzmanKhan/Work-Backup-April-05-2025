"""augment trigger type and polygon construction

Revision ID: cd2458c33792
Revises: 34a2c72f511a
Create Date: 2023-04-24 19:22:20.815389

"""

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

from backend.database.orm.orm_utils import ARRAY_2D_TO_POLYGON_FUNCTION

# flake8: noqa

# revision identifiers, used by Alembic.
revision = "cd2458c33792"
down_revision = "34a2c72f511a"
branch_labels = None
depends_on = None


old_trigger_type_enum_values = ("DO_NOT_ENTER", "SHORT_STICK_AROUND")
new_trigger_type_enum_values = old_trigger_type_enum_values + ("IDLING",)

# Use the temporary ENUM name for the upgrade and downgrade process
temp_enum_name = "temp_trigger_type"


def upgrade() -> None:
    # Drop the foreign key constraint
    op.drop_constraint(
        "user_alert_settings_trigger_type_fkey",
        "user_alert_settings",
        type_="foreignkey",
    )

    # Create a temporary ENUM type with the new values
    temp_trigger_type_enum = sa.Enum(*new_trigger_type_enum_values, name=temp_enum_name)
    temp_trigger_type_enum.create(op.get_bind(), checkfirst=False)

    # Alter the column to use the temporary ENUM type
    op.execute(
        "ALTER TABLE user_alert_trigger_types ALTER COLUMN trigger_type TYPE {} USING"
        " trigger_type::text::{}".format(temp_enum_name, temp_enum_name)
    )
    op.execute(
        "ALTER TABLE user_alert_settings ALTER COLUMN trigger_type TYPE {} USING"
        " trigger_type::text::{}".format(temp_enum_name, temp_enum_name)
    )

    # Drop the old ENUM type
    old_trigger_type_enum = postgresql.ENUM(
        *old_trigger_type_enum_values, name="triggertype"
    )
    old_trigger_type_enum.drop(op.get_bind(), checkfirst=False)

    # Rename the temporary ENUM type to the original ENUM type
    op.execute("ALTER TYPE {} RENAME TO triggertype".format(temp_enum_name))

    # Recreate the foreign key constraint
    op.create_foreign_key(
        "user_alert_settings_trigger_type_fkey",
        "user_alert_settings",
        "user_alert_trigger_types",
        ["trigger_type"],
        ["trigger_type"],
    )

    # Add an SQL function to convert a 2D array to a polygon string
    # Used after query run per row polygon / detection intersection.
    op.execute(ARRAY_2D_TO_POLYGON_FUNCTION)


def downgrade() -> None:
    # Drop the foreign key constraint
    op.drop_constraint(
        "user_alert_settings_trigger_type_fkey",
        "user_alert_settings",
        type_="foreignkey",
    )
    # Create a temporary ENUM type with the old values
    temp_trigger_type_enum = sa.Enum(*old_trigger_type_enum_values, name=temp_enum_name)
    temp_trigger_type_enum.create(op.get_bind(), checkfirst=False)

    # Alter the column to use the temporary ENUM type,
    # effectively removing the new value
    op.execute(
        "ALTER TABLE user_alert_trigger_types ALTER COLUMN trigger_type TYPE {} USING"
        " trigger_type::text::{}".format(temp_enum_name, temp_enum_name)
    )
    op.execute(
        "ALTER TABLE user_alert_settings ALTER COLUMN trigger_type TYPE {} USING"
        " trigger_type::text::{}".format(temp_enum_name, temp_enum_name)
    )

    # Drop the ENUM type with the new values
    new_trigger_type_enum = postgresql.ENUM(
        *new_trigger_type_enum_values, name="triggertype"
    )
    new_trigger_type_enum.drop(op.get_bind(), checkfirst=False)
    # Rename the temporary ENUM type back to the original ENUM type
    op.execute("ALTER TYPE {} RENAME TO triggertype".format(temp_enum_name))
    # Recreate the foreign key constraint
    op.create_foreign_key(
        "user_alert_settings_trigger_type_fkey",
        "user_alert_settings",
        "user_alert_trigger_types",
        ["trigger_type"],
        ["trigger_type"],
    )

    # Drop the SQL function to convert a 2D array to a polygon string
    op.execute("DROP FUNCTION array_2d_to_polygon_string(double precision[]);")
