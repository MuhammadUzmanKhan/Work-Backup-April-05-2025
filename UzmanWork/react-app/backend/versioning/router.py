import logging

from fastapi import APIRouter, Depends

from backend import logging_config
from backend.dependencies import get_backend_envs
from backend.envs import BackendEnvs
from backend.fastapi_utils import WithResponseExcludeNone
from backend.versioning.models import VersionCheckResponse

logger = logging.getLogger(logging_config.LOGGER_NAME)

versioning_router = WithResponseExcludeNone(
    APIRouter(
        prefix="/versioning",
        tags=["versioning"],
        generate_unique_id_function=lambda route: route.name,
    )
)


@versioning_router.get("/check_frontend_requires_update")
async def check_frontend_requires_update(
    frontend_version: str, envs: BackendEnvs = Depends(get_backend_envs)
) -> VersionCheckResponse:
    return VersionCheckResponse(
        requires_update=frontend_version != envs.version,
        submitted_version=frontend_version,
        current_version=envs.version,
    )
