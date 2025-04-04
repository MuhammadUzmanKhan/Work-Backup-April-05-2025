import logging

from fastapi import APIRouter, Depends, HTTPException, status

from backend import auth, auth_models, logging_config
from backend.database import database, orm
from backend.dependencies import get_backend_database
from backend.fastapi_utils import WithResponseExcludeNone
from backend.tag.models import CreateTagRequest, TagResponse

logger = logging.getLogger(logging_config.LOGGER_NAME)

tags_router = WithResponseExcludeNone(
    APIRouter(
        prefix="/tags",
        tags=["tags"],
        generate_unique_id_function=lambda route: route.name,
    )
)


@tags_router.post("/")
async def create_tag(
    create_tag_request: CreateTagRequest,
    db: database.Database = Depends(get_backend_database),
    _app_user: auth_models.AppUser = Depends(auth.limited_user_role_guard),
) -> TagResponse:
    async with db.tenant_session() as session:
        try:
            tag = await orm.Tag.create_tag(
                session=session, name=create_tag_request.name
            )
        except orm.orm_tag.TagError as e:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))

    return TagResponse(id=tag.id, name=tag.name)


@tags_router.get("/")
async def get_tags(
    db: database.Database = Depends(get_backend_database),
    _app_user: auth_models.AppUser = Depends(auth.limited_user_role_guard),
) -> list[TagResponse]:
    async with db.tenant_session() as session:
        tags = await orm.Tag.get_all_tags(session)

    return [TagResponse(id=tag.id, name=tag.name) for tag in tags]
