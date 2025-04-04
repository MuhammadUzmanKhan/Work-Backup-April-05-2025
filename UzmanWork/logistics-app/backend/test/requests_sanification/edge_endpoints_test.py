from typing import Type

import fastapi
from pydantic import BaseModel
from pydantic.fields import SHAPE_LIST, SHAPE_SEQUENCE, SHAPE_SET, SHAPE_TUPLE
from pydantic.utils import lenient_issubclass


def _check_all_sequences_bounded(model_class: Type[BaseModel]) -> None:
    for field in model_class.__fields__.values():
        if lenient_issubclass(field.outer_type_, BaseModel):
            _check_all_sequences_bounded(field.outer_type_)
        # Pydantic uses shape to distinguish between list, tuple, set, etc.
        if field.shape not in [SHAPE_LIST, SHAPE_TUPLE, SHAPE_SEQUENCE, SHAPE_SET]:
            continue
        # For those type, check we have a max_items
        assert (
            field.field_info.max_items is not None
        ), f"Field {field.name} of {model_class} is unbounded."


def test_all_lists_bounded(edge_api: fastapi.FastAPI) -> None:
    for route in edge_api.routes:
        if not isinstance(route, fastapi.routing.APIRoute):
            continue
        # TODO(@lberg): remove this once the endpoint is not using
        # Body anymore, currently it's not possible to fix it
        if route.path == "/perceptions/":
            continue
        if route.body_field is None:
            continue
        _check_all_sequences_bounded(route.body_field.type_)
