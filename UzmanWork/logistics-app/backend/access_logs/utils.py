import json
import logging
from typing import Any

import fastapi

from backend import dependencies, logging_config
from backend.access_logs.constants import UserActions
from backend.auth import get_user_with_org
from backend.auth_models import AppUser
from backend.database import database, orm

logger = logging.getLogger(logging_config.LOGGER_NAME)


def find_key_in_nested_request(node: Any, key: str) -> Any:
    if isinstance(node, list):
        for i in node:
            if val := find_key_in_nested_request(i, key):
                return val
    elif isinstance(node, dict):
        if key in node:
            return node[key]
        for j in node.values():
            if val := find_key_in_nested_request(j, key):
                return val
    raise ValueError(f"Key {key} not found in request")


async def populate_details(
    request: fastapi.Request, args: list[str] = []
) -> dict[str, str]:
    try:
        request_json = await request.json()
    except json.decoder.JSONDecodeError:
        request_json = None
    details = {"url_path": request.url.path}

    for arg in args:
        if arg in request.path_params:
            details[arg] = str(request.path_params[arg])
            continue
        try:
            details[arg] = str(find_key_in_nested_request(request_json, arg))
        except (ValueError, TypeError):
            logger.exception("Error in extracting %s ", arg)

    return details


class AccessLogger:
    def __init__(self, user_action: UserActions, extra_args: list[str] | None = None):
        self.user_action = user_action
        self.extra_args = extra_args or []

    async def __call__(
        self,
        request: fastapi.Request,
        user: AppUser = fastapi.Depends(get_user_with_org),
        db: database.Database = fastapi.Depends(dependencies.get_backend_database),
    ) -> None:
        await self._record_user_access(request, user, db)

    @staticmethod
    async def record_user_access(
        request: fastapi.Request,
        user: AppUser,
        db: database.Database,
        user_action: UserActions,
        extra_args: list[str] = [],
    ) -> None:
        """
        This method should be used by endpoints that want to log user access based on a
        condition that can only be checked in the body of the function

        """
        await AccessLogger(user_action, extra_args)._record_user_access(
            request, user, db
        )

    async def _record_user_access(
        self, request: fastapi.Request, user: AppUser, db: database.Database
    ) -> None:
        details = await populate_details(request, self.extra_args)

        # We manually set the tenant, as otherwise, the guard dependency must always be
        # used before the access logger dependency. Setting tenant manually ensures that
        # in this specific situation, the dependency order does not matter.
        async with db.tenant_session(tenant=user.tenant) as session:
            await orm.AccessLog.new_log(
                session,
                action=self.user_action,
                user_email=user.user_email,
                ip_address=request.headers.get("x-real-ip", "unknown"),
                details=details,
            )
