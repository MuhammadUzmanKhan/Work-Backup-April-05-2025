import json
import os
import pathlib
import sys
from typing import Any

from fastapi.openapi.utils import get_openapi

sys.path.append(os.getcwd())

from backend import main  # noqa: E402


def custom_openapi() -> dict[str, Any]:
    if main.app.openapi_schema:
        return main.app.openapi_schema
    openapi_schema = get_openapi(
        title="Logistics App API",
        openapi_version="3.0.0",
        version="0.1.0",
        description="API for the Logistics App backend",
        routes=main.app.routes,
    )

    main.app.openapi_schema = openapi_schema
    return main.app.openapi_schema


def generate_openapi_spec() -> None:
    main.app.openapi = custom_openapi  # type: ignore
    openapi_content = main.app.openapi()

    openapi_file_path = pathlib.Path("openapi_spec.json")
    openapi_file_path.write_text(json.dumps(openapi_content), encoding="utf-8")


if __name__ == "__main__":
    generate_openapi_spec()
