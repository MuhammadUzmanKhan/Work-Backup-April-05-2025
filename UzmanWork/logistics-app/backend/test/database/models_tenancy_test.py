import inspect
from typing import Any, cast

import sqlalchemy as sa

import backend.database.orm
from backend.database import database
from backend.database.orm import Base
from backend.database.orm.orm_utils import TenantProtectedTable

TENANT_UNAWARE_MODELS = {
    "Base",
    "Organization",
    "ArchiveClipData",
    "Feature",
    "KioskWall",
    "LicensePlate",
    "ArchiveTag",
}


def _get_tenant_aware_model_classes() -> list[type]:
    model_classes = []
    for name, obj in inspect.getmembers(backend.database.orm):
        if (
            inspect.isclass(obj)
            and issubclass(obj, Base)
            and obj.__name__ not in TENANT_UNAWARE_MODELS
        ):
            model_classes.append(obj)
    return model_classes


def _is_subclass_of_tenant_protected_table(model_class: type) -> bool:
    return issubclass(model_class, TenantProtectedTable)


async def test_all_models_have_tenant_column() -> None:
    models_classes = _get_tenant_aware_model_classes()
    for model_class in models_classes:
        assert _is_subclass_of_tenant_protected_table(
            model_class
        ), f"Model {model_class.__name__} is not a subclass of TenantProtectedTable"


async def test_all_models_have_tenant_rule(db_instance: database.Database) -> None:
    models_classes = cast(list[Any], _get_tenant_aware_model_classes())
    db_tables_names = [model_class.__tablename__ for model_class in models_classes]

    async with db_instance.session() as session:
        policy_table_names: list[str] = (
            (
                await session.execute(
                    sa.text(
                        "select tablename from pg_policies where qual like '%tenant%'"
                    )
                )
            )
            .scalars()
            .all()
        )
    missing_tables = set(db_tables_names) - set(policy_table_names)
    assert not missing_tables, f"Tables {missing_tables} do not have tenant rule"
