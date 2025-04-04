import logging
from functools import lru_cache
from typing import Any

import fastapi
import sentry_sdk
from fastapi import FastAPI
from pydantic import ValidationError
from sentry_sdk.integrations.aiohttp import AioHttpIntegration
from sentry_sdk.integrations.asyncio import AsyncioIntegration
from sentry_sdk.integrations.asyncpg import AsyncPGIntegration
from sentry_sdk.integrations.boto3 import Boto3Integration
from sentry_sdk.integrations.celery import CeleryIntegration
from sentry_sdk.integrations.fastapi import FastApiIntegration
from sentry_sdk.integrations.redis import RedisIntegration
from sentry_sdk.integrations.sqlalchemy import SqlalchemyIntegration
from sentry_sdk.integrations.starlette import StarletteIntegration
from starlette.routing import Match

from backend import logging_config
from backend.dependencies import get_backend_envs
from backend.sentry_instrumentation.constants import (
    SENTRY_ALL_IGNORED,
    SENTRY_ALL_SAMPLED,
)
from backend.sentry_instrumentation.models import (
    ASGIScope,
    RouteMatchContext,
    SampleValue,
)

logger = logging.getLogger(logging_config.LOGGER_NAME)


@lru_cache(maxsize=1000)
def _match_path(context: RouteMatchContext) -> str | None:
    """Match the current asgi scope against
    the routes. Return the path only if the match is full.
    """
    matched_route = None
    for route in context.routes:
        match, _ = route.matches(context.asgi_scope.dict())
        if match == Match.FULL:
            matched_route = route
            break
    return matched_route.path if matched_route else None


def traces_sampler(
    transaction_context: dict[str, Any],
    routes: list[fastapi.routing.APIRoute | fastapi.routing.APIWebSocketRoute],
) -> float:
    try:
        asgi_scope = ASGIScope.parse_obj(transaction_context["asgi_scope"])
    except (KeyError, ValidationError):
        logger.error(
            f"[Sentry] missing asgi scope in {transaction_context=}, dropping."
        )
        return SampleValue.IGNORED

    matched_path = _match_path(RouteMatchContext(asgi_scope=asgi_scope, routes=routes))
    if matched_path is None:
        return SampleValue.IGNORED
    if matched_path in SENTRY_ALL_IGNORED:
        return SampleValue.IGNORED
    if matched_path in SENTRY_ALL_SAMPLED:
        return SampleValue.SAMPLED
    return SampleValue.TAKEN


def init_sentry(app: FastAPI) -> None:
    routes = [
        route
        for route in app.routes
        if isinstance(route, fastapi.routing.APIRoute)
        or isinstance(route, fastapi.routing.APIWebSocketRoute)
    ]
    envs = get_backend_envs()
    sentry_sdk.init(
        integrations=[
            AioHttpIntegration(),
            AsyncPGIntegration(),
            CeleryIntegration(monitor_beat_tasks=True),
            SqlalchemyIntegration(),
            AsyncioIntegration(),
            StarletteIntegration(),
            FastApiIntegration(),
            RedisIntegration(),
            Boto3Integration(),
        ],
        dsn=envs.sentry_api_dsn,
        environment=envs.environment_name,
        release=envs.version,
        traces_sampler=lambda context: traces_sampler(context, routes),
        profiles_sampler=None,
        before_send_transaction=None,
        send_default_pii=True,
    )
