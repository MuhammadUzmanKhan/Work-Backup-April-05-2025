from __future__ import annotations

from typing import Any, Type

import sqlalchemy as sa
from sqlalchemy import orm
from sqlalchemy.dialects import postgresql
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.util.langhelpers import symbol

from backend.constants import UNASSIGNED_TENANT

NO_VALUE = symbol("NO_VALUE")
NOT_LOADED_REPR = "<not loaded>"


db_metadata = sa.MetaData()


class ReprBase:
    """From https://github.com/kvesteri/sqlalchemy-utils"""

    def __repr__(self) -> str:
        state = sa.inspect(self)
        field_reprs = []
        fields = state.mapper.columns.keys()
        for key in fields:
            value = state.attrs[key].loaded_value
            if value == NO_VALUE:
                value = NOT_LOADED_REPR
            else:
                value = repr(value)
            field_reprs.append("=".join((key, value)))

        return f"{self.__class__.__name__}({', '.join(field_reprs)})"


Base = orm.declarative_base(metadata=db_metadata, cls=ReprBase)


class TenantProtectedTable(Base):
    """Base class for tables with a tenant column.
    All tables which perform RBAC based on the tenant should inherit from this"""

    __abstract__ = True

    tenant = sa.Column(
        sa.String,
        nullable=False,
        default=UNASSIGNED_TENANT,
        server_default=UNASSIGNED_TENANT,
    )


# Define type hint that inherits from Base


async def bulk_insert(
    session: AsyncSession, table: Type[Base], items: list[dict[str, Any]]
) -> None:
    """Helper to bulk insert into DB."""
    # Use bulk_insert_mappings here since it's much faster than alternatives
    # as suggested here
    # https://docs.sqlalchemy.org/en/13/faq/performance.html#i-m-inserting-400-000-rows-with-the-orm-and-it-s-really-slow
    # Note we have to do it this way, because mypy is not happy if we use a
    # lambda...

    def bulk_insert_for_session(session: orm.Session) -> None:
        session.bulk_insert_mappings(table, items)

    await session.run_sync(bulk_insert_for_session)


async def bulk_insert_with_ids(
    session: AsyncSession,
    table: Type[Base],
    items: list[dict[str, Any]],
    id_column: Any,
) -> list[Any]:
    """Helper to bulk insert into DB. Return the primary keys of the inserted rows."""
    # NOTE(@lberg): I have no idea why this is necessary, but without it
    # we try to insert some empty rows into the table
    if not items:
        return []
    insert_stmt = postgresql.insert(table).values(items).returning(id_column)
    ids = (await session.execute(insert_stmt)).scalars().all()
    return ids


ARRAY_2D_TO_POLYGON_FUNCTION = """
CREATE OR REPLACE FUNCTION array_2d_to_polygon_string(double precision[])
RETURNS TEXT AS $$
DECLARE
output TEXT := '((';
i INTEGER;
n INTEGER;
BEGIN
IF $1 IS NULL OR array_length($1, 1) = 0 THEN
    RETURN 'POLYGON(())';
END IF;

n := array_length($1, 1);
-- If input has only 2 elements, create a polygon derived from the bounding box
IF n = 2 THEN
    output := output || $1[1][1]::TEXT || ', ' || $1[1][2]::TEXT || '), (' ||
            $1[1][1]::TEXT || ', ' || $1[2][2]::TEXT || '), (' ||
            $1[2][1]::TEXT || ', ' || $1[2][2]::TEXT || '), (' ||
            $1[2][1]::TEXT || ', ' || $1[1][2]::TEXT || '), (' ||
            $1[1][1]::TEXT || ', ' || $1[1][2]::TEXT || '))';
    RETURN output;
END IF;

FOR i IN 1..n LOOP
    output := output || $1[i][1]::TEXT || ', ' || $1[i][2]::TEXT;
    IF i < n THEN
    output := output || '), (';
    END IF;
END LOOP;

-- Add the first point as the last point to create a loop
output := output || '), (' || $1[1][1]::TEXT || ', ' || $1[1][2]::TEXT || '))';

--
--  output := output || '))';
RETURN output;
END;
$$ LANGUAGE plpgsql;
"""


SQL_ARRAY_2D_POLYGON_BOX_INTERSECTS_QUERY = """
    POLYGON(
        BOX(
            POINT(
                perception_object_events.x_min,
                perception_object_events.y_min
            ),
            POINT(
                perception_object_events.x_max,
                perception_object_events.y_max
            )
        )
    ) && POLYGON(array_2d_to_polygon_string({roi_polygon}))
    """


SQL_POLYGON_BOX_INTRESECTS_QUERY = """
    POLYGON(
        BOX(
            POINT(
                perception_object_events.x_min,
                perception_object_events.y_min
            ),
            POINT(
                perception_object_events.x_max,
                perception_object_events.y_max
            )
        )
    ) && POLYGON(:polygon)
    """

SQL_BOX_INTERSECTS_QUERY = """
    BOX(
        POINT(
            perception_object_events.x_min,
            perception_object_events.y_min
        ),
        POINT(
            perception_object_events.x_max,
            perception_object_events.y_max
        )
    ) && BOX(
        POINT(:box_x_min, :box_y_min),
        POINT(:box_x_max, :box_y_max)
    )
    """

SQL_BOX_INTERSECTION_ABOVE_THRESHOLD_QUERY = """
    AREA(
        BOX(
            POINT(
                perception_object_events.x_min,
                perception_object_events.y_min
            ),
            POINT(
                perception_object_events.x_max,
                perception_object_events.y_max
            )
        ) # BOX(
            POINT(:box_x_min, :box_y_min),
            POINT(:box_x_max, :box_y_max)
        )
    ) > :intersection_ratio_threshold
    """


SQL_LINE_LINE_INTERSECT_STATEMENT = """
    check_line_intersection_with_direction(
        :line_start_x,
        :line_start_y,
        :line_end_x,
        :line_end_y,
        ({detection}.prev_x_min + {detection}.prev_x_max) / 2,
        {detection}.prev_y_max,
        ({detection}.x_min + {detection}.x_max) / 2,
        {detection}.y_max,
        :given_direction
    )
"""
