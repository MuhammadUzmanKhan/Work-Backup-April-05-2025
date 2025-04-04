import pytest_asyncio
from fastapi import FastAPI

from backend.user_wall.router import user_wall_router


@pytest_asyncio.fixture()
def user_wall_app(app: FastAPI) -> FastAPI:
    app.include_router(user_wall_router)
    return app
