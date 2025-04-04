import logging

from fastapi import APIRouter, Depends

from backend import auth, auth_models, logging_config
from backend.database import database, orm
from backend.database.face_models import (
    NVRUniqueFaceCreate,
    NVRUniqueFaceFromUploadCreate,
    OrgUniqueFacesMerge,
)
from backend.dependencies import get_backend_database, get_value_store
from backend.face.models import (
    NVRFaceImageProcessedExistingFaceData,
    NVRFaceImageProcessedNewFaceData,
    NVRFaceImageProcessedNoFaceData,
    NVRFaceImageProcessedRequest,
    NVRUniqueFacesMergeRequest,
    RegisterFacesRequest,
    RegisterFacesResponse,
)
from backend.face.utils import (
    filter_faces_request_by_nvr,
    get_org_unique_face_ids_or_fail,
    merge_unique_faces,
    schedule_nvr_unique_face_notification_task,
    send_face_alerts_if_needed,
)
from backend.value_store.value_store import ValueStore

logger = logging.getLogger(logging_config.LOGGER_NAME)

# Router the edge uses
face_router_edge = APIRouter(
    prefix="/face_edge",
    dependencies=[],
    tags=["face"],
    generate_unique_id_function=lambda route: route.name,
)


@face_router_edge.post("/register_faces")
async def register_faces(
    register_faces_request: RegisterFacesRequest,
    db: database.Database = Depends(get_backend_database),
    edge_user: auth_models.EdgeUser = Depends(auth.edge_user_role_guard),
    value_store: ValueStore = Depends(get_value_store),
) -> RegisterFacesResponse:
    nvr_uuid = edge_user.user_uuid

    async with db.tenant_session() as session:
        register_faces_request_filtered = await filter_faces_request_by_nvr(
            session, register_faces_request, nvr_uuid
        )

        if register_faces_request_filtered != register_faces_request:
            logger.error(
                "Received face occurrences with mac addresses that don't belong to"
                f" the NVR {nvr_uuid}. Received: {register_faces_request=}"
            )

    async with db.tenant_session() as session:
        missing_ufi = await orm.NVRUniqueFace.get_missing_unique_face_ids(
            session, register_faces_request_filtered.to_check_ufi()
        )
        if missing_ufi:
            logger.error(
                "Received face occurrences with unique face IDs that don't exist in"
                f" the DB: {missing_ufi=}"
            )
            return RegisterFacesResponse(missing_unique_face_ids=missing_ufi)

        new_unique_faces = [
            NVRUniqueFaceCreate(
                nvr_unique_face_id=face.unique_face_id, s3_path=face.s3_path
            )
            for face in register_faces_request_filtered.new_unique_faces
        ]
        await orm.NVRUniqueFace.process_faces_batch(session, new_unique_faces, nvr_uuid)

        face_occurrences = await orm.FaceOccurrence.add_occurrences_batch(
            session, register_faces_request_filtered.new_face_occurrences, nvr_uuid
        )

    await send_face_alerts_if_needed(
        db=db, face_occurrences=face_occurrences, value_store=value_store
    )

    await schedule_nvr_unique_face_notification_task(
        nvr_uuid, register_faces_request.new_unique_faces, db
    )
    return RegisterFacesResponse(missing_unique_face_ids=set())


@face_router_edge.post("/merge_faces")
async def merge_faces(
    merge_faces_request: NVRUniqueFacesMergeRequest,
    db: database.Database = Depends(get_backend_database),
    edge_user: auth_models.EdgeUser = Depends(auth.edge_user_role_guard),
) -> None:
    async with db.tenant_session() as session:
        (org_unique_id_src, org_unique_id_dst) = await get_org_unique_face_ids_or_fail(
            session,
            [
                merge_faces_request.nvr_unique_face_id_merge_src,
                merge_faces_request.nvr_unique_face_id_merge_dst,
            ],
        )
        await merge_unique_faces(
            session,
            OrgUniqueFacesMerge(
                org_unique_face_id_src=org_unique_id_src,
                org_unique_face_id_dst=org_unique_id_dst,
            ),
        )


@face_router_edge.post("/register_uploaded_face_processed")
async def register_uploaded_face_processed(
    processed_request: NVRFaceImageProcessedRequest,
    db: database.Database = Depends(get_backend_database),
    edge_user: auth_models.EdgeUser = Depends(auth.edge_user_role_guard),
) -> None:
    nvr_uuid = edge_user.user_uuid

    match processed_request.data:
        case NVRFaceImageProcessedNewFaceData():
            if processed_request.data.infos:
                logger.warning(
                    "[register_uploaded_face_processed] "
                    "Received a new face event with infos: "
                    f"{processed_request.data.infos}"
                )

            uf = processed_request.data.unique_face
            async with db.tenant_session() as session:
                await orm.NVRUniqueFace.process_user_uploaded_face(
                    session,
                    NVRUniqueFaceFromUploadCreate(
                        nvr_unique_face_id=uf.unique_face_id,
                        s3_path=uf.s3_path,
                        org_unique_face_id=processed_request.org_unique_face_id,
                    ),
                    nvr_uuid=nvr_uuid,
                )

            await schedule_nvr_unique_face_notification_task(
                sender_nvr_uuid=nvr_uuid, unique_faces=[uf], db=db
            )
        case NVRFaceImageProcessedExistingFaceData():
            if processed_request.data.infos:
                logger.warning(
                    "[register_uploaded_face_processed] "
                    "Received an existing face event with infos: "
                    f"{processed_request.data.infos}"
                )
            async with db.tenant_session() as session:
                (org_unique_id_src,) = await get_org_unique_face_ids_or_fail(
                    session, [processed_request.data.nvr_unique_face_id_merge_src]
                )
                # NOTE(@lberg): we keep the uploaded face for two reasons:
                # 1. we don't want to lose the face uploaded by the user
                # 2. this will signal the task that the face has been processed
                # because now it has an org unique face id
                await merge_unique_faces(
                    session,
                    OrgUniqueFacesMerge(
                        org_unique_face_id_src=org_unique_id_src,
                        org_unique_face_id_dst=processed_request.org_unique_face_id,
                    ),
                )

        case NVRFaceImageProcessedNoFaceData():
            logger.error(
                "[register_uploaded_face_processed] "
                "Received a no face event with error: "
                f"{str(processed_request.data.error)}"
            )
            # TODO(@lberg): Should we stop trying to process this face for
            # certain errors? E.g. if we found no faces in the image.
