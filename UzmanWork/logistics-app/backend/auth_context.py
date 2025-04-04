from contextvars import ContextVar

from backend.auth_models import AppUser, EdgeUser

app_user: ContextVar[AppUser | None] = ContextVar("app_user", default=None)

edge_user: ContextVar[EdgeUser | None] = ContextVar("edge_user", default=None)


class TenantNotFoundError(Exception):
    """Exception raised when the tenant is not set."""

    pass


async def set_app_user(user: AppUser) -> None:
    app_user.set(user)


async def set_edge_user(user: EdgeUser) -> None:
    edge_user.set(user)


async def get_app_user() -> AppUser | None:
    return app_user.get()


async def get_edge_user() -> EdgeUser | None:
    return edge_user.get()


async def reset_app_user() -> None:
    app_user.set(None)


async def reset_edge_user() -> None:
    edge_user.set(None)


async def get_current_tenant() -> str:
    app_user_value = await get_app_user()
    edge_user_value = await get_edge_user()

    if app_user_value:
        return app_user_value.tenant
    elif edge_user_value:
        return edge_user_value.tenant
    else:
        raise TenantNotFoundError("Tenant is not set")
