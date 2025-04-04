import logging
from collections import defaultdict

import fastapi
import filetype.utils
from fastapi import HTTPException, UploadFile
from fastapi.encoders import jsonable_encoder
from filetype.types.image import Jpeg, Png

from backend import logging_config
from backend.alert.alert_models import FaceAlertOccurrence, FaceAlertsSendRequest
from backend.database import database, face_models, models, orm
from backend.database.orm.orm_face import OrmFaceError
from backend.database.session import TenantAwareAsyncSession
from backend.face.models import (
    NVRUniqueFaceNotificationData,
    RegisterFacesRequest,
    UniqueFaceEdgeData,
)
from backend.models import AccessRestrictions
from backend.router_utils import get_camera_response_from_mac_address_or_fail
from backend.task_worker.background_task import (
    on_nvrs_unique_face_notification_task,
    send_face_alerts,
)
from backend.value_store import ValueStore
from backend.value_store.value_store import get_person_of_interest_alert_key

logger = logging.getLogger(logging_config.LOGGER_NAME)


async def filter_faces_request_by_nvr(
    session: TenantAwareAsyncSession,
    register_faces_request: RegisterFacesRequest,
    nvr_uuid: str,
) -> RegisterFacesRequest:
    allowed_mac_addresses = await orm.NVR.get_allowed_mac_addresses(
        session,
        nvr_uuid,
        [req.camera_mac_address for req in register_faces_request.new_face_occurrences],
    )

    filtered_face_occurrences = [
        face_occurrence
        for face_occurrence in register_faces_request.new_face_occurrences
        if face_occurrence.camera_mac_address in allowed_mac_addresses
    ]

    return RegisterFacesRequest(
        new_face_occurrences=filtered_face_occurrences,
        new_unique_faces=register_faces_request.new_unique_faces,
    )


async def send_face_alerts_if_needed(
    db: database.Database,
    face_occurrences: list[face_models.FaceOccurrence],
    value_store: ValueStore,
) -> None:
    face_occurrences_by_org_unique_face_id: dict[
        int, list[face_models.FaceOccurrence]
    ] = defaultdict(list)
    for fo in face_occurrences:
        face_occurrences_by_org_unique_face_id[fo.org_unique_face_id].append(fo)

    async with db.tenant_session() as session:
        alert_profiles: list[models.FaceAlertProfile] = (
            await orm.FaceAlertProfile.get_active_alert_profiles(
                session, set(face_occurrences_by_org_unique_face_id.keys())
            )
        )

        face_alerts_to_send = FaceAlertsSendRequest(
            alert_occurrences=[], tenant=session.tenant
        )
        for alert_profile in alert_profiles:
            # Skip sending alert if the alert profile has been alerted recently
            if await value_store.get_timestamp(
                key=get_person_of_interest_alert_key(alert_profile_id=alert_profile.id)
            ):
                continue

            # Get face occurrences associated with the given alert profile face id
            face_occurrences_with_active_alert = face_occurrences_by_org_unique_face_id[
                alert_profile.org_unique_face.id
            ]
            # Select the earliest face occurrence as the alert occurrence
            selected_face_occurrence = min(
                face_occurrences_with_active_alert, key=lambda x: x.occurrence_time
            )

            camera = await get_camera_response_from_mac_address_or_fail(
                session,
                AccessRestrictions(),
                selected_face_occurrence.camera_mac_address,
            )

            face_alerts_to_send.alert_occurrences.append(
                FaceAlertOccurrence(
                    alert_profile=alert_profile,
                    detection=selected_face_occurrence,
                    location_name=camera.location,
                    group_name=camera.group_name,
                    camera_name=camera.camera.name,
                )
            )

    # Skip sending alert if there are no alerts to send
    if len(face_alerts_to_send.alert_occurrences) == 0:
        return

    logger.info(
        f"Received {len(face_alerts_to_send.alert_occurrences)} faces to be alerted"
    )

    # Send the alert through celery to avoid blocking the request
    send_face_alerts.delay(jsonable_encoder(face_alerts_to_send))


async def get_org_unique_face_ids_or_fail(
    session: TenantAwareAsyncSession, nvr_unique_face_ids: list[str]
) -> list[int]:
    try:
        org_unique_face_ids = await orm.NVRUniqueFace.get_org_unique_face_ids(
            session, nvr_unique_face_ids
        )
    except OrmFaceError as ex:
        raise HTTPException(
            status_code=fastapi.status.HTTP_400_BAD_REQUEST,
            detail=(
                "Error getting unique face IDs from the database for"
                f" {nvr_unique_face_ids=}: {ex}"
            ),
        )
    return org_unique_face_ids


async def merge_unique_faces(
    session: TenantAwareAsyncSession, faces_merge: face_models.OrgUniqueFacesMerge
) -> None:
    # TODO(@lberg): Remove, not a good pattern to have a check here
    if faces_merge.is_same_face:
        logger.error(
            f"Attempted to merge the same face {faces_merge=}."
            "Preventing deletion of the face."
        )
        return

    await orm.OrganizationUniqueFace.merge_faces(session, faces_merge)
    await orm.FaceAlertProfile.update_unique_face_id(
        session,
        org_unique_face_id_src=faces_merge.org_unique_face_id_src,
        org_unique_face_id_dst=faces_merge.org_unique_face_id_dst,
    )
    await orm.OrganizationUniqueFace.delete_unique_face(
        session, faces_merge.org_unique_face_id_src
    )


async def schedule_nvr_unique_face_notification_task(
    sender_nvr_uuid: str, unique_faces: list[UniqueFaceEdgeData], db: database.Database
) -> None:
    async with db.tenant_session() as session:
        nvrs_to_notify = await orm.NVR.get_nvrs(session, access=AccessRestrictions())

    notification_data = NVRUniqueFaceNotificationData(
        sender_nvr_uuid=sender_nvr_uuid,
        recipient_nvr_uuids=[
            nvr.uuid for nvr in nvrs_to_notify if nvr.uuid != sender_nvr_uuid
        ],
        unique_faces=unique_faces,
    )
    if notification_data.recipient_nvr_uuids and notification_data.unique_faces:
        on_nvrs_unique_face_notification_task.delay(notification_data.json())


async def check_face_image(file: UploadFile) -> None:
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(
            status_code=fastapi.status.HTTP_400_BAD_REQUEST,
            detail="File must be an image",
        )

    # Read the first few bytes of the file to determine the file
    # type, and reset the file pointer to the beginning
    header = await file.read(filetype.utils._NUM_SIGNATURE_BYTES)
    await file.seek(0)

    if not Png().match(header) and not Jpeg().match(header):
        raise HTTPException(
            status_code=fastapi.status.HTTP_400_BAD_REQUEST,
            detail="File must be a PNG or JPEG image",
        )
