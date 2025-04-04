from datetime import timedelta

import aio_pika
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import AnyHttpUrl
from starlette.datastructures import URL

from backend import auth, auth_models, envs
from backend.access_logs.constants import UserActions
from backend.access_logs.utils import AccessLogger
from backend.alert.alert_sending import (
    format_shared_live_stream_message,
    format_shared_video_message,
    send_shared_live_stream_email,
    send_shared_video_email,
    send_sms,
)
from backend.alert.models import SharedLiveStreamFormat, SharedVideoFormat, ShareMethod
from backend.archive.utils import archive_request_kvs_if_not_exists
from backend.boto_utils import BotoIotDataClient, BotoSessionFn
from backend.constants import DEFAULT_LIVE_STREAM_RETENTION_DUR
from backend.database import database, orm
from backend.database.models import (
    CamerasQueryConfig,
    ClipData,
    ClipDataCreate,
    SharedVideoCreate,
)
from backend.dependencies import (
    get_aws_region,
    get_backend_database,
    get_backend_envs,
    get_backend_secrets,
    get_boto_session_maker,
    get_email_client,
    get_iot_data_client,
    get_mq_connection,
    get_replaced_master_playlist_url,
    get_sms_client,
    get_value_store,
)
from backend.email_sending import EmailClient
from backend.envs import BackendSecrets
from backend.escapi.protocol_models import VideoResRequestType
from backend.fastapi_utils import WithResponseExcludeNone
from backend.iot_core.db_utils import IOTCoreFeature, is_iot_core_feature_enabled
from backend.kinesis_api.constants import KINESIS_MAX_EXPIRE_TIME
from backend.kinesis_api.errors import KinesisError
from backend.kinesis_api.models import (
    KinesisSharedVideoClipConfig,
    KinesisStreamCreationRequest,
    KinesisVideoLiveConfig,
    StaticResolutionConfig,
    StreamResponse,
)
from backend.kinesis_api.utils import (
    get_kinesis_clip_url,
    get_kinesis_clip_url_with_edge_upload,
    get_kinesis_live_url,
    is_kinesis_hls_stream_ingested,
    put_msg_to_queue_for_live_request,
    retrieve_clip_signed_url,
)
from backend.models import AccessRestrictions
from backend.router_utils import (
    get_camera_response_from_mac_address_or_fail,
    get_org_stream_retention_or_fail,
)
from backend.shared_video.models import (
    ExchangeLiveRequest,
    SharedLiveStreamData,
    SharedLiveStreamKeepAliveRequest,
    SharedLiveStreamRequest,
    SharedLiveStreamResponse,
    SharedVideoRequest,
    SharedVideoResponse,
)
from backend.shared_video.utils import (
    get_camera_unrestricted_or_fail,
    get_shared_live_stream_or_fail,
    get_shared_remaining_time_or_fail,
    get_shared_video_or_fail,
)
from backend.sms_sending import SMSClient
from backend.utils import AwareDatetime
from backend.value_store import ValueStore
from backend.value_store.value_store import get_shared_live_stream_key

shared_video_router = WithResponseExcludeNone(
    APIRouter(
        prefix="/shared_videos",
        dependencies=[Depends(auth.regular_user_role_guard)],
        tags=["shared_videos"],
        generate_unique_id_function=lambda route: route.name,
    )
)

shared_video_router_public = WithResponseExcludeNone(
    APIRouter(
        prefix="/shared_videos_public",
        tags=["shared_videos"],
        generate_unique_id_function=lambda route: route.name,
    )
)


@shared_video_router.post("/")
async def add_shared_video(
    shared_video_request: SharedVideoRequest,
    db: database.Database = Depends(get_backend_database),
    email_client: EmailClient = Depends(get_email_client),
    sms_client: SMSClient = Depends(get_sms_client),
    backend_envs: envs.BackendEnvs = Depends(get_backend_envs),
    mq_connection: aio_pika.abc.AbstractRobustConnection = Depends(get_mq_connection),
    boto_session_maker: BotoSessionFn = Depends(get_boto_session_maker),
    iot_data_client: BotoIotDataClient = Depends(get_iot_data_client),
    app_user: auth_models.AppUser = Depends(auth.regular_user_role_guard),
    value_store: ValueStore = Depends(get_value_store),
    playlist_replace_url: URL = Depends(get_replaced_master_playlist_url),
    _access_logger: None = Depends(
        AccessLogger(
            UserActions.ADDED_A_NEW_SHARED_VIDEO,
            [
                "start_time",
                "end_time",
                "mac_address",
                "expiration_seconds",
                "email_address",
            ],
        )
    ),
) -> str:
    """Add a new shared video. Optionally send email and sms notifications.
    Return the unique hash of the new shared video.
    """
    time_now = AwareDatetime.utcnow()
    retention_dur = timedelta(seconds=shared_video_request.expiration_seconds)
    expiration_time = time_now + retention_dur
    async with db.tenant_session() as session:
        cameras = await orm.orm_camera.Camera.get_cameras(
            session,
            query_config=CamerasQueryConfig(
                mac_addresses={shared_video_request.mac_address}
            ),
        )
        if len(cameras) != 1:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, detail="No valid camera found!"
            )

        camera = cameras[0]
        camera_name = str(camera.camera.name)
        location_name = str(camera.location)
        nvr_timezone = str(camera.nvr_timezone)
        clip_data_row = await orm.orm_clip_data.ClipData.create_or_retrieve_clip_data(
            session,
            ClipDataCreate(
                mac_address=shared_video_request.mac_address,
                start_time=shared_video_request.start_time,
                end_time=shared_video_request.end_time,
                creation_time=time_now,
                kvs_stream_name=None,
                s3_path=None,
                expiration_time=None,
            ),
        )
        clip_data = ClipData.from_orm(clip_data_row)

    # Check if kvs stream exists or not, create if not exists.
    # After creation, bump up the retention hours to a year later
    # since it is is an archive video.
    try:
        await archive_request_kvs_if_not_exists(
            camera=camera.camera,
            clip_data=clip_data,
            kinesis_stream_request=KinesisStreamCreationRequest(
                retention_duration=retention_dur
            ),
            boto_session_maker=boto_session_maker,
            iot_data_client=iot_data_client,
            mq_connection=mq_connection,
            db=db,
            value_store=value_store,
            master_playlist_redirect_url=playlist_replace_url,
            tenant=app_user.tenant,
            use_iot_core=await is_iot_core_feature_enabled(
                db, IOTCoreFeature.VIDEO, app_user.tenant
            ),
        )
    except KinesisError as e:
        raise HTTPException(
            status_code=400, detail=f"Failed to create KVS stream for clip: {e}"
        )

    async with db.tenant_session() as session:
        shared_video_unique_hash = await orm.SharedVideo.create_shared_video(
            session,
            SharedVideoCreate(
                user_name=shared_video_request.user_name,
                email_address=shared_video_request.email_address,
                phone_number=shared_video_request.phone_number,
                clip_id=clip_data.id,
                expiration_time=expiration_time,
            ),
        )

    if shared_video_request.email_address:
        await send_shared_video_email(
            email_client=email_client,
            content=format_shared_video_message(
                web_app_url=backend_envs.web_app_url,
                user_name=shared_video_request.user_name,
                share_data=SharedVideoFormat(
                    unique_shared_video_hash=shared_video_unique_hash,
                    expiration_dur=retention_dur,
                    location_name=location_name,
                    camera_name=camera_name,
                    start_time=shared_video_request.start_time,
                    end_time=shared_video_request.end_time,
                    message=shared_video_request.message,
                    timezone_name=nvr_timezone,
                    share_method=ShareMethod.Email,
                ),
            ),
            email_address=shared_video_request.email_address,
            user_name=shared_video_request.user_name,
        )
    if shared_video_request.phone_number:
        await send_sms(
            sms_client=sms_client,
            content=format_shared_video_message(
                web_app_url=backend_envs.web_app_url,
                user_name=shared_video_request.user_name,
                share_data=SharedVideoFormat(
                    unique_shared_video_hash=shared_video_unique_hash,
                    expiration_dur=retention_dur,
                    location_name=location_name,
                    camera_name=camera_name,
                    start_time=shared_video_request.start_time,
                    end_time=shared_video_request.end_time,
                    message=shared_video_request.message,
                    timezone_name=nvr_timezone,
                    share_method=ShareMethod.SMS,
                ),
            ),
            phone_number=shared_video_request.phone_number,
        )
    return shared_video_unique_hash


@shared_video_router.post("/live")
async def share_live_video(
    shared_video_request: SharedLiveStreamRequest,
    db: database.Database = Depends(get_backend_database),
    email_client: EmailClient = Depends(get_email_client),
    sms_client: SMSClient = Depends(get_sms_client),
    backend_envs: envs.BackendEnvs = Depends(get_backend_envs),
    app_user: auth_models.AppUser = Depends(auth.regular_user_role_guard),
    access: AccessRestrictions = Depends(auth.get_user_access_restrictions),
    value_store: ValueStore = Depends(get_value_store),
    _access_logger: None = Depends(
        AccessLogger(
            UserActions.SHARED_A_LIVE_VIDEO_STREAM,
            ["mac_address", "expiration_seconds", "email_address"],
        )
    ),
) -> str:
    """Share a live video stream. Optionally send email and sms notifications.
    Return the unique uuid of the new shared video.
    """
    time_now = AwareDatetime.utcnow()
    retention_dur = timedelta(seconds=shared_video_request.expiration_seconds)
    expiration_time = time_now + retention_dur
    async with db.tenant_session() as session:
        camera = await get_camera_response_from_mac_address_or_fail(
            session, access, shared_video_request.mac_address
        )

    # create entry in redis with unique uuid
    live_stream_uuid = SharedLiveStreamData.generate_uuid()
    while (
        await value_store.get_model(
            get_shared_live_stream_key(live_stream_uuid), SharedLiveStreamData
        )
        is not None
    ):
        live_stream_uuid = SharedLiveStreamData.generate_uuid()

    shared_live_stream_data = SharedLiveStreamData(
        mac_address=camera.camera.mac_address,
        expiration_time=expiration_time,
        tenant=app_user.tenant,
    )

    await value_store.set_model(
        get_shared_live_stream_key(live_stream_uuid),
        shared_live_stream_data,
        expiration=retention_dur,
    )

    if shared_video_request.email_address:
        await send_shared_live_stream_email(
            email_client=email_client,
            content=format_shared_live_stream_message(
                web_app_url=backend_envs.web_app_url,
                user_name=shared_video_request.user_name,
                share_data=SharedLiveStreamFormat(
                    unique_shared_video_hash=live_stream_uuid,
                    expiration_dur=retention_dur,
                    location_name=camera.location or "",
                    camera_name=camera.camera.name,
                    message=shared_video_request.message,
                    share_method=ShareMethod.Email,
                ),
            ),
            email_address=shared_video_request.email_address,
            user_name=shared_video_request.user_name,
        )
    if shared_video_request.phone_number:
        await send_sms(
            sms_client=sms_client,
            content=format_shared_live_stream_message(
                web_app_url=backend_envs.web_app_url,
                user_name=shared_video_request.user_name,
                share_data=SharedLiveStreamFormat(
                    unique_shared_video_hash=live_stream_uuid,
                    expiration_dur=retention_dur,
                    location_name=camera.location or "",
                    camera_name=camera.camera.name,
                    message=shared_video_request.message,
                    share_method=ShareMethod.SMS,
                ),
            ),
            phone_number=shared_video_request.phone_number,
        )

    return live_stream_uuid


@shared_video_router_public.get("/info/{unique_hash}")
async def hash_info(
    unique_hash: str, db: database.Database = Depends(get_backend_database)
) -> SharedVideoResponse:
    """Return the SharedVideo associated with the hash

    :param unique_hash: the unique hash of the shared video
    :param db: DB instance, defaults to Depends(get_backend_database)
    :return: SharedVideo instance
    """
    async with db.session() as session:
        shared_video = await get_shared_video_or_fail(session, unique_hash)
        camera = await get_camera_unrestricted_or_fail(
            session, shared_video.clip.mac_address
        )

    return SharedVideoResponse(
        live_stream_name=camera.camera.source,
        start_time=shared_video.clip.start_time,
        end_time=shared_video.clip.end_time,
        camera_name=camera.camera.name,
        camera_group_name=camera.group_name,
        camera_location=camera.location,
        timezone=camera.timezone,
        mac_address=camera.camera.mac_address,
        is_audio_enabled=camera.camera.is_audio_enabled,
    )


@shared_video_router_public.get("/exchange/{unique_hash}")
async def exchange_for_url(
    unique_hash: str,
    boto_session_maker: BotoSessionFn = Depends(get_boto_session_maker),
    iot_data_client: BotoIotDataClient = Depends(get_iot_data_client),
    mq_connection: aio_pika.abc.AbstractRobustConnection = Depends(get_mq_connection),
    db: database.Database = Depends(get_backend_database),
    value_store: ValueStore = Depends(get_value_store),
    playlist_replace_url: URL = Depends(get_replaced_master_playlist_url),
) -> AnyHttpUrl:
    """Exchange an hash for a kinesis clip url. Validate the hash before."""
    async with db.session() as session:
        shared_video = await get_shared_video_or_fail(session, unique_hash)
        camera = await get_camera_unrestricted_or_fail(
            session, shared_video.clip.mac_address
        )

    kinesis_request = KinesisSharedVideoClipConfig(
        stream_hash=camera.camera.source,
        start_time=shared_video.clip.start_time,
        end_time=shared_video.clip.end_time,
        resolution_config=StaticResolutionConfig(
            static_resolution=VideoResRequestType.High
        ),
        retention_period=max(
            timedelta(hours=1), shared_video.expiration_time - AwareDatetime.utcnow()
        ),
    )
    try:
        is_stream_ingested = await is_kinesis_hls_stream_ingested(
            boto_session_maker, kinesis_request.upload_stream_name
        )
        if is_stream_ingested:
            return await get_kinesis_clip_url(
                master_playlist_redirect_url=playlist_replace_url,
                clip_params=kinesis_request,
                boto_session_maker=boto_session_maker,
                value_store=value_store,
            )
        else:
            return await get_kinesis_clip_url_with_edge_upload(
                master_playlist_redirect_url=playlist_replace_url,
                camera=camera.camera,
                clip_config=kinesis_request,
                boto_session_maker=boto_session_maker,
                iot_data_client=iot_data_client,
                mq_connection=mq_connection,
                value_store=value_store,
                use_iot_core=await is_iot_core_feature_enabled(
                    db, IOTCoreFeature.VIDEO, camera.camera.tenant
                ),
            )
    except KinesisError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e


@shared_video_router_public.get("/download/{unique_hash}")
async def download(
    unique_hash: str,
    aws_region: str = Depends(get_aws_region),
    mq_connection: aio_pika.abc.AbstractRobustConnection = Depends(get_mq_connection),
    iot_data_client: BotoIotDataClient = Depends(get_iot_data_client),
    db: database.Database = Depends(get_backend_database),
    secrets: BackendSecrets = Depends(get_backend_secrets),
) -> str:
    """Download the clip corresponding to the shared video from kinesis and
    return a relative URL we can serve.

    :param unique_hash: the unique hash of the shared video
    :param boto_session: Boto session, defaults to Depends(get_boto_session)
    :param mq_connection: MQ connection, defaults to Depends(get_mq_connection)
    :param db: DB instance, defaults to Depends(get_backend_database)
    :return: relative URL to the static video
    """
    async with db.session() as session:
        shared_video = await get_shared_video_or_fail(session, unique_hash)
        camera = await get_camera_unrestricted_or_fail(
            session, shared_video.clip.mac_address
        )

    clip_data = shared_video.clip
    return await retrieve_clip_signed_url(
        db=db,
        mq_connection=mq_connection,
        iot_data_client=iot_data_client,
        clip_data=clip_data,
        camera=camera.camera,
        region_name=aws_region,
        secrets=secrets,
        use_iot_core=await is_iot_core_feature_enabled(
            db, IOTCoreFeature.VIDEO, camera.camera.tenant
        ),
    )


@shared_video_router_public.get("/info/live/{unique_uuid}")
async def retrieve_shared_live_stream_info(
    unique_uuid: str,
    value_store: ValueStore = Depends(get_value_store),
    db: database.Database = Depends(get_backend_database),
) -> SharedLiveStreamResponse:
    """Return the SharedLiveStreamResponse associated with the uuid"""
    shared_live_stream_data = await get_shared_live_stream_or_fail(
        unique_uuid, value_store
    )
    async with db.session() as session:
        camera = await get_camera_unrestricted_or_fail(
            session, shared_live_stream_data.mac_address
        )

    return SharedLiveStreamResponse(
        live_stream_name=camera.camera.source,
        camera_name=camera.camera.name,
        camera_group_name=camera.group_name,
        camera_location=camera.location,
        timezone=camera.timezone,
        mac_address=camera.camera.mac_address,
        is_webrtc_enabled=camera.camera.is_webrtc_enabled,
        is_audio_enabled=camera.camera.is_audio_enabled,
    )


@shared_video_router_public.post("/exchange/live/{unique_uuid}")
async def exchange_for_url_live_stream_with_config(
    unique_uuid: str,
    exchange_live_request: ExchangeLiveRequest,
    boto_session_maker: BotoSessionFn = Depends(get_boto_session_maker),
    iot_data_client: BotoIotDataClient = Depends(get_iot_data_client),
    mq_connection: aio_pika.abc.AbstractRobustConnection = Depends(get_mq_connection),
    db: database.Database = Depends(get_backend_database),
    value_store: ValueStore = Depends(get_value_store),
) -> StreamResponse:
    """Exchange a uuid (if valid) for a kinesis stream url."""
    shared_live_stream_data = await get_shared_live_stream_or_fail(
        unique_uuid, value_store
    )
    remaining_time = get_shared_remaining_time_or_fail(shared_live_stream_data)
    async with db.session() as session:
        camera = await get_camera_unrestricted_or_fail(
            session, shared_live_stream_data.mac_address
        )

        retention_period = (
            await get_org_stream_retention_or_fail(
                session, shared_live_stream_data.tenant
            )
            if camera.camera.is_always_streaming
            else DEFAULT_LIVE_STREAM_RETENTION_DUR
        )

    kinesis_config = KinesisVideoLiveConfig(
        stream_hash=camera.camera.stream_hash,
        resolution_config=exchange_live_request.resolution_config,
        # cap the remaining time with the max kinesis supports
        expires=min(remaining_time, KINESIS_MAX_EXPIRE_TIME),
        use_webrtc=camera.camera.is_webrtc_enabled
        and exchange_live_request.prefer_webrtc,
        retention_period=retention_period,
    )

    try:
        return await get_kinesis_live_url(
            camera=camera.camera,
            live_config=kinesis_config,
            boto_session_maker=boto_session_maker,
            iot_data_client=iot_data_client,
            mq_connection=mq_connection,
            value_store=value_store,
            use_iot_core=await is_iot_core_feature_enabled(
                db, IOTCoreFeature.VIDEO, camera.camera.tenant
            ),
        )
    except KinesisError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e


@shared_video_router_public.post("/live/keep_alive/{unique_uuid}")
async def keep_alive_shared_stream(
    unique_uuid: str,
    keep_alive_request: SharedLiveStreamKeepAliveRequest,
    mq_connection: aio_pika.abc.AbstractRobustConnection = Depends(get_mq_connection),
    iot_data_client: BotoIotDataClient = Depends(get_iot_data_client),
    db: database.Database = Depends(get_backend_database),
    value_store: ValueStore = Depends(get_value_store),
) -> None:
    shared_live_stream_data = await get_shared_live_stream_or_fail(
        unique_uuid, value_store
    )
    get_shared_remaining_time_or_fail(shared_live_stream_data)
    async with db.session() as session:
        camera = await get_camera_unrestricted_or_fail(
            session, shared_live_stream_data.mac_address
        )
        retention_period = (
            await get_org_stream_retention_or_fail(
                session, shared_live_stream_data.tenant
            )
            if camera.camera.is_always_streaming
            else DEFAULT_LIVE_STREAM_RETENTION_DUR
        )

    await put_msg_to_queue_for_live_request(
        camera=camera.camera,
        config=KinesisVideoLiveConfig(
            stream_hash=camera.camera.stream_hash,
            resolution_config=keep_alive_request.resolution_config,
            use_webrtc=False,
            retention_period=retention_period,
        ),
        mq_connection=mq_connection,
        iot_data_client=iot_data_client,
        use_iot_core=await is_iot_core_feature_enabled(
            db, IOTCoreFeature.VIDEO, camera.camera.tenant
        ),
    )
