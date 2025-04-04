import fastapi
import fastapi.dependencies.models
import fastapi.params

from backend.sentry_instrumentation.constants import (
    SENTRY_ALL_ENDPOINTS_APP,
    SENTRY_ALL_ENDPOINTS_EDGE,
)


def _test_all_routes_listed(app: fastapi.FastAPI, all_endpoints: list[str]) -> None:
    paths_in_app = [
        route.path
        for route in app.routes
        if isinstance(route, fastapi.routing.APIRoute)
        or isinstance(route, fastapi.routing.APIWebSocketRoute)
    ]
    paths_not_in_sentry = [path for path in paths_in_app if path not in all_endpoints]
    if paths_not_in_sentry:
        msg = "\n".join(paths_not_in_sentry)
        raise AssertionError(
            f"Paths: {msg} are not in any sentry transaction list."
            " Please add them to one"
        )


def _test_all_sentry_routes_included(
    app: fastapi.FastAPI, all_endpoints: list[str]
) -> None:
    paths_in_app = [
        route.path
        for route in app.routes
        if isinstance(route, fastapi.routing.APIRoute)
        or isinstance(route, fastapi.routing.APIWebSocketRoute)
    ]
    paths_not_in_app = [path for path in all_endpoints if path not in paths_in_app]

    if paths_not_in_app:
        msg = "\n".join(paths_not_in_app)
        raise AssertionError(
            f"Paths: {msg} are only in sentry transaction list. Please remove them"
        )


def test_sentry_lists_no_duplicated() -> None:
    assert len(SENTRY_ALL_ENDPOINTS_APP) == len(set(SENTRY_ALL_ENDPOINTS_APP))
    assert len(SENTRY_ALL_ENDPOINTS_EDGE) == len(set(SENTRY_ALL_ENDPOINTS_EDGE))


def test_sentry_all_app_api_routes_listed(app_api: fastapi.FastAPI) -> None:
    _test_all_routes_listed(app_api, SENTRY_ALL_ENDPOINTS_APP)


def test_sentry_no_dangling_paths_app(app_api: fastapi.FastAPI) -> None:
    _test_all_sentry_routes_included(app_api, SENTRY_ALL_ENDPOINTS_APP)


def test_sentry_all_edge_api_routes_listed(edge_api: fastapi.FastAPI) -> None:
    _test_all_routes_listed(edge_api, SENTRY_ALL_ENDPOINTS_EDGE)


def test_sentry_no_dangling_paths_edge(edge_api: fastapi.FastAPI) -> None:
    _test_all_sentry_routes_included(edge_api, SENTRY_ALL_ENDPOINTS_EDGE)
