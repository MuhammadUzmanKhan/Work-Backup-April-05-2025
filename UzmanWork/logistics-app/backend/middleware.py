import logging
import time
from typing import Awaitable, Callable

from fastapi import FastAPI, Response
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request

from backend import dependencies
from backend.auth_context import reset_app_user, reset_edge_user
from backend.instrumentation.context import (
    reset_instrumentation_in_context,
    set_instrumentation_in_context,
)
from backend.instrumentation.influx_serializer import InfluxSerializer
from backend.instrumentation.utils import instrument, instrument_api_request
from backend.sync_utils import instrument_thread_pool

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

WWW_PREFIX = "www."

# TODO move to config
TELEGRAF_HOSTNAME = "telegraf"
TELEGRAF_PORT = 9000


def register_frontend_cors(
    app: FastAPI, domains: list[str], ports: list[int]
) -> list[str]:
    """Register multiple domains and port as allowed in browser CORS policy.
    Requests coming from these domains will be let through by the browser.
    Note that when CORS is blocking a request:
    - GET requests are not shown in the browser;
    - POST requests are blocked in preflight;

    :param app: App instance
    :param domains: list of domains
    :param ports: list of ports
    """
    origins = ["http://localhost", "http://localhost:8080", "http://localhost:5173"]
    for domain in domains:
        domain_origins = [domain] + [f"{domain}:{port}" for port in ports]
        if WWW_PREFIX in domain:
            alt_domain = domain.replace(WWW_PREFIX, "")
            domain_origins += [alt_domain] + [f"{alt_domain}:{port}" for port in ports]
        origins.extend(domain_origins)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    return origins


class InstrumentationMiddleware(BaseHTTPMiddleware):
    async def dispatch(
        self, request: Request, call_next: Callable[[Request], Awaitable[Response]]
    ) -> Response:
        backend_envs = dependencies.get_backend_envs()
        await instrument(instrument_thread_pool(backend_envs.api_target))

        start_time = time.time()
        response = None
        serializer = InfluxSerializer(
            measurement_name=f"api_requests_{backend_envs.api_target}"
        )
        try:
            await set_instrumentation_in_context(serializer)
            response = await call_next(request)
            return response
        except Exception as exc:
            raise exc
        finally:
            duration = time.time() - start_time
            await instrument_api_request(request, response, duration, serializer)
            await reset_instrumentation_in_context()


# At the moment, we use RoleGuards to set the app_user context. It's a good practice to
# reset the context after each request to ensure that it doesn't leak to other requests.
class ResetAppUserMiddleware(BaseHTTPMiddleware):
    async def dispatch(
        self, request: Request, call_next: Callable[[Request], Awaitable[Response]]
    ) -> Response:
        response = await call_next(request)
        await reset_app_user()
        return response


# At the moment, we use RoleGuards to set the edge_user context. It's a good practice to
# reset the context after each request to ensure that it doesn't leak to other requests.
class ResetEdgeUserMiddleware(BaseHTTPMiddleware):
    async def dispatch(
        self, request: Request, call_next: Callable[[Request], Awaitable[Response]]
    ) -> Response:
        response = await call_next(request)
        await reset_edge_user()
        return response
