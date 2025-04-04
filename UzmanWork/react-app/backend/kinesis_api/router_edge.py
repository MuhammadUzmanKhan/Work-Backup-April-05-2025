import logging

from fastapi import APIRouter, Depends, HTTPException, status

from backend import auth, auth_models, dependencies, logging_config
from backend.database import database, orm
from backend.escapi import protocol_models

logger = logging.getLogger(logging_config.LOGGER_NAME)

kinesis_router_edge = APIRouter(
    prefix="/kinesis_api",
    tags=["kinesis_api"],
    generate_unique_id_function=lambda route: route.name,
)


# End point for the edge to register the s3 path for the clip back to the backend.
@kinesis_router_edge.post("/register_clip_uploads")
async def register_clip_s3_upload_path_endpoint(
    responses: protocol_models.UserClipsUploadResponse,
    db: database.Database = Depends(dependencies.get_backend_database),
    edge_user: auth_models.EdgeUser = Depends(auth.edge_user_role_guard),
) -> None:
    """Endpoint to register a response from the nvr."""
    if responses.nvr_uuid is not None and responses.nvr_uuid != edge_user.user_uuid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="NVR UUID does not match."
        )
    async with db.tenant_session() as session:
        responses_create = [
            dict(id=int(response.clip_id), s3_path=response.s3_path)
            for response in responses.responses
        ]

        await orm.ClipData.update_clip_data_s3_path_in_batch(session, responses_create)
