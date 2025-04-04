import logging

import aio_pika
import fastapi
from fastapi import Depends

from backend import auth, auth_models, dependencies, logging_config
from backend.access_logs.constants import UserActions
from backend.access_logs.utils import AccessLogger
from backend.boto_utils import BotoIotDataClient
from backend.cameras_registration.cameras_registration_models import (
    CandidateCameraData,
    CandidateCamerasResponse,
    CandidateNvrData,
    RegisterCandidateCamerasRequest,
    RegisterCandidateCamerasResponse,
)
from backend.cameras_registration.cameras_registration_utils import (
    compute_cameras_to_nvrs_assignment,
    generate_unique_stream_hash,
    get_nvr_available_for_discovery,
    retrieve_fresh_nvrs_discovery,
)
from backend.database import database, orm
from backend.database.organization_models import (
    OrgCamerasAudioSettings,
    OrgCamerasWebRTCSettings,
)
from backend.dependencies import get_backend_envs
from backend.devices.utils import unassign_camera_from_tenant
from backend.envs import BackendEnvs
from backend.fastapi_utils import WithResponseExcludeNone
from backend.iot_core.db_utils import IOTCoreFeature, is_iot_core_feature_enabled
from backend.models import AccessRestrictions
from backend.organization_feature_flags.utils import get_org_or_fail
from backend.value_store import ValueStore

logger = logging.getLogger(logging_config.LOGGER_NAME)

router = WithResponseExcludeNone(
    fastapi.APIRouter(
        prefix="/cameras_registration",
        tags=["cameras_registration"],
        generate_unique_id_function=lambda route: route.name,
    )
)


@router.get("/candidate_cameras/{location_id}")
async def list_candidate_cameras(
    location_id: int,
    app_user: auth_models.AppUser = Depends(auth.admin_user_role_guard),
    access: AccessRestrictions = Depends(auth.get_user_access_restrictions),
    db: database.Database = Depends(dependencies.get_backend_database),
    iot_data_client: BotoIotDataClient = Depends(dependencies.get_iot_data_client),
    value_store: ValueStore = Depends(dependencies.get_value_store),
    mq_connection: aio_pika.abc.AbstractRobustConnection = Depends(
        dependencies.get_mq_connection
    ),
) -> CandidateCamerasResponse:
    async with db.tenant_session() as session:
        nvrs = await get_nvr_available_for_discovery(session, access, location_id)

    discoveries = await retrieve_fresh_nvrs_discovery(
        [nvr.uuid for nvr in nvrs],
        value_store,
        mq_connection,
        iot_data_client,
        await is_iot_core_feature_enabled(
            db, IOTCoreFeature.DISCOVERY, app_user.tenant
        ),
    )

    candidate_cameras: dict[str, CandidateCameraData] = {}
    unavailable_nvrs_uuids = set()
    for nvr_uuid, discovery in discoveries.items():
        if discovery is None:
            unavailable_nvrs_uuids.add(nvr_uuid)
            continue
        for camera in discovery.get_cameras():
            # a camera can be discovered by multiple NVRs
            if camera.mac_address in candidate_cameras:
                candidate_cameras[camera.mac_address].nvr_uuids.add(nvr_uuid)
                continue
            candidate_cameras[camera.mac_address] = CandidateCameraData(
                nvr_uuids={nvr_uuid},
                mac_address=camera.mac_address,
                ip=camera.ip,
                vendor=camera.vendor,
                username=None,
                password=None,
                rtsp_port=camera.rtsp_port,
            )

    # cross-check with existing DB cameras and remove them
    async with db.tenant_session() as session:
        db_cameras = await orm.Camera.get_allowed_cameras_by_mac_address(
            session, list(candidate_cameras.keys()), access
        )
        db_cameras_mac_addresses = {camera.mac_address for camera in db_cameras}

    return CandidateCamerasResponse(
        unavailable_nvr_uuids=unavailable_nvrs_uuids,
        candidate_cameras_data=[
            candidate
            for mac_address, candidate in candidate_cameras.items()
            if mac_address not in db_cameras_mac_addresses
        ],
        candidate_nvrs_data=[
            CandidateNvrData(
                uuid=nvr.uuid, num_available_slots=nvr.num_available_cameras_slots
            )
            for nvr in nvrs
            if nvr.uuid not in unavailable_nvrs_uuids
        ],
    )


@router.post("/register_candidates/{location_id}")
async def register_candidates(
    location_id: int,
    register_request: RegisterCandidateCamerasRequest,
    app_user: auth_models.AppUser = Depends(auth.admin_user_role_guard),
    access: AccessRestrictions = Depends(auth.get_user_access_restrictions),
    db: database.Database = Depends(dependencies.get_backend_database),
    envs: BackendEnvs = Depends(get_backend_envs),
    _access_logger: AccessLogger = Depends(
        AccessLogger(UserActions.REGISTERED_CAMERAS, ["location_id"])
    ),
) -> RegisterCandidateCamerasResponse:
    candidate_cameras = register_request.candidate_cameras_data
    request_nvrs_uuids = set(
        [
            nvr_uuid
            for candidate in candidate_cameras
            for nvr_uuid in candidate.nvr_uuids
        ]
    )
    async with db.tenant_session() as session:
        nvrs = await orm.NVR.get_nvrs(session, access, location_id=location_id)
        nvrs = [nvr for nvr in nvrs if nvr.uuid in request_nvrs_uuids]
        if len(nvrs) != len(request_nvrs_uuids):
            raise fastapi.HTTPException(
                status_code=fastapi.status.HTTP_400_BAD_REQUEST,
                detail="Invalid NVRs uuids",
            )
    nvrs_available_slots = {nvr.uuid: nvr.num_available_cameras_slots for nvr in nvrs}
    # log error if some NVRs are over capacity
    for nvr_uuid, available_slots in nvrs_available_slots.items():
        if available_slots < 0:
            logger.error(
                f"NVR {nvr_uuid} is over capacity by {abs(available_slots)} slots,"
            )

    # cross-check with existing DB cameras and remove them
    async with db.tenant_session() as session:
        db_cameras = await orm.Camera.get_allowed_cameras_by_mac_address(
            session, [candidate.mac_address for candidate in candidate_cameras], access
        )
    db_cameras_mac_addresses = {camera.mac_address for camera in db_cameras}
    candidate_cameras = [
        candidate
        for candidate in candidate_cameras
        if candidate.mac_address not in db_cameras_mac_addresses
    ]

    # compute the assignment
    successful_assignments, failed_assignments = compute_cameras_to_nvrs_assignment(
        candidate_cameras, nvrs_available_slots
    )

    if len(successful_assignments) == 0:
        msg = f"No camera could be assigned: {failed_assignments}"
        logger.error(msg)
        raise fastapi.HTTPException(
            status_code=fastapi.status.HTTP_400_BAD_REQUEST, detail=msg
        )

    async with db.session() as session:
        existing_cameras = await orm.Camera.system_get_cameras_from_mac_addresses(
            session, {candidate.mac_address for candidate in candidate_cameras}
        )
        existing_camera_mac_address_to_camera = {
            camera.camera.mac_address: camera for camera in existing_cameras
        }

    # get the organization so we can use org features for the new cameras
    async with db.tenant_session() as session:
        organization = await get_org_or_fail(session)

    # register the cameras
    async with db.session() as session:
        for assignment in successful_assignments:
            stream_hash = await generate_unique_stream_hash(db, envs.environment_name)
            camera_create = assignment.get_camera_create(
                is_audio_enabled=organization.cameras_audio_settings
                == OrgCamerasAudioSettings.ENABLED,
                is_webrtc_enabled=organization.cameras_webrtc_settings
                == OrgCamerasWebRTCSettings.ENABLED,
            )

            mac_address = assignment.camera_data.mac_address

            if mac_address in existing_camera_mac_address_to_camera:
                existing_camera = existing_camera_mac_address_to_camera[mac_address]
                current_camera_tenant = existing_camera.camera.tenant

                # This should never happen because we've already excluded existing
                # cameras from candidate_cameras
                if current_camera_tenant == app_user.tenant:
                    raise fastapi.HTTPException(
                        status_code=fastapi.status.HTTP_409_CONFLICT,
                        detail=(
                            f"Camera {mac_address} is already registered "
                            f"for tenant={app_user.tenant}"
                        ),
                    )

                await unassign_camera_from_tenant(mac_address, session)

                await orm.Camera.system_reassign_camera(
                    session,
                    camera_metadata=camera_create,
                    stream_hash=stream_hash,
                    target_tenant=app_user.tenant,
                )
                logger.info(
                    f"Reassigned an existing camera {mac_address} "
                    f"from tenant={current_camera_tenant} "
                    f"to tenant={app_user.tenant}"
                )
            else:
                await orm.Camera.system_new_camera(
                    session,
                    camera_metadata=camera_create,
                    stream_hash=stream_hash,
                    tenant=app_user.tenant,
                )
                logger.info(
                    f"Registered a new camera {mac_address} "
                    f"for tenant={app_user.tenant}"
                )

    return RegisterCandidateCamerasResponse(
        successful_assignments=successful_assignments,
        failed_assignments=failed_assignments,
    )
