import logging
import random
import string
from datetime import timedelta

import aio_pika
import aiohttp
from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import AnyHttpUrl
from starlette.datastructures import URL

from backend import auth, auth_models, escapi, logging_config
from backend.access_logs.constants import UserActions
from backend.access_logs.utils import AccessLogger
from backend.aws_signer.aws_signer import SignV4RequestSigner
from backend.aws_signer.aws_signer_models import AWSCredentials, AwsSignRequest
from backend.aws_signer.aws_signer_utils import check_aws_sign_token
from backend.boto_utils import BotoIotDataClient, BotoSessionFn
from backend.constants import (
    ANONYMOUS_CLIP_RETENTION_DUR,
    DEFAULT_LIVE_STREAM_RETENTION_DUR,
)
from backend.database import database, orm
from backend.database.models import ClipData, ClipDataCreate, HlsSessionInfo
from backend.dependencies import (
    get_aws_region,
    get_backend_database,
    get_backend_secrets,
    get_boto_session_maker,
    get_iot_data_client,
    get_mq_connection,
    get_replaced_master_playlist_url,
    get_replaced_media_playlist_url,
    get_value_store,
)
from backend.envs import BackendSecrets
from backend.fastapi_utils import WithResponseExcludeNone
from backend.iot_core.db_utils import IOTCoreFeature, is_iot_core_feature_enabled
from backend.kinesis_api.constants import (
    HLS_MASTER_PLAYLIST_ROUTE,
    HLS_MEDIA_PLAYLIST_ROUTE,
    KINESIS_MAX_EXPIRE_TIME,
    ON_DEMAND_MODE,
)
from backend.kinesis_api.errors import KinesisError
from backend.kinesis_api.hls_utils import (
    adapt_playlist_for_live_replay,
    gen_on_demand_media_playlist_kinesis_url,
    replace_fragments_urls_in_media_playlist,
    replace_url_in_master_playlist,
)
from backend.kinesis_api.models import (
    ClipRequestIdentifier,
    HlsResponse,
    KinesisVideoClipConfig,
    KinesisVideoClipRequest,
    KinesisVideoKeepAliveRequest,
    KinesisVideoLiveConfig,
    KinesisVideoLiveRequest,
    StreamResponse,
)
from backend.kinesis_api.utils import (
    _kinesis_request,
    get_kinesis_clip_url_with_edge_upload,
    get_kinesis_live_url,
    put_msg_to_queue_for_clip_request,
    put_msg_to_queue_for_live_requests,
    retrieve_clip_signed_url,
)
from backend.models import AccessRestrictions
from backend.router_utils import (
    get_camera_from_mac_address_or_fail,
    get_cameras_from_mac_address_or_fail,
    get_org_stream_retention_or_fail,
)
from backend.utils import AwareDatetime
from backend.value_store import ValueStore

logger = logging.getLogger(logging_config.LOGGER_NAME)

MAX_RETRIES = 15

kinesis_api_router = WithResponseExcludeNone(
    APIRouter(
        prefix="/kinesis_api",
        tags=["kinesis_api"],
        generate_unique_id_function=lambda route: route.name,
    )
)

kinesis_api_router_public = WithResponseExcludeNone(
    APIRouter(
        prefix="/kinesis_api_public",
        tags=["kinesis_api_public"],
        generate_unique_id_function=lambda route: route.name,
    )
)


async def check_hls_session(
    value_store: ValueStore, session_token: str, stream_name: str
) -> None:
    hls_session = await value_store.get_model(
        key=f"{session_token}-{stream_name}", model_class=HlsSessionInfo
    )
    if hls_session is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Could not find HLS session for {session_token=} {stream_name=}",
        )


def _generate_clip_stream_unique_id() -> str:
    return "".join(random.choices(string.ascii_lowercase + string.digits, k=10))


@kinesis_api_router.post("/s3_upload_and_fetch", response_model=str)
async def s3_clip_upload_and_fetch(
    kinesis_request: KinesisVideoClipRequest,
    aws_region: str = Depends(get_aws_region),
    mq_connection: aio_pika.abc.AbstractRobustConnection = Depends(get_mq_connection),
    db: database.Database = Depends(get_backend_database),
    iot_data_client: BotoIotDataClient = Depends(get_iot_data_client),
    secrets: BackendSecrets = Depends(get_backend_secrets),
    app_user: auth_models.AppUser = Depends(auth.regular_user_role_guard),
    access: AccessRestrictions = Depends(auth.get_user_access_restrictions),
    _access_logger: None = Depends(
        AccessLogger(
            UserActions.DOWNLOADED_A_CLIP, ["mac_address", "start_time", "end_time"]
        )
    ),
) -> str:
    """Request upload and then return a URL we can serve."""
    async with db.tenant_session() as session:
        camera = await get_camera_from_mac_address_or_fail(
            session=session, access=access, mac_address=kinesis_request.mac_address
        )

    async with db.tenant_session() as session:
        # query if the video is already uploaded
        clip_data_row = await orm.ClipData.create_or_retrieve_clip_data(
            session,
            ClipDataCreate(
                mac_address=camera.mac_address,
                start_time=kinesis_request.start_time,
                end_time=kinesis_request.end_time,
                creation_time=AwareDatetime.utcnow(),
            ),
        )
    clip_data = ClipData.from_orm(clip_data_row)
    s3_clip_url = await retrieve_clip_signed_url(
        clip_data=clip_data,
        camera=camera,
        db=db,
        mq_connection=mq_connection,
        iot_data_client=iot_data_client,
        secrets=secrets,
        use_iot_core=await is_iot_core_feature_enabled(
            db, IOTCoreFeature.VIDEO, app_user.tenant
        ),
        region_name=aws_region,
    )

    return s3_clip_url


@kinesis_api_router.post("/live_data")
async def retrieve_kinesis_live_stream_data(
    request: Request,
    kinesis_request: KinesisVideoLiveRequest,
    boto_session_maker: BotoSessionFn = Depends(get_boto_session_maker),
    iot_data_client: BotoIotDataClient = Depends(get_iot_data_client),
    mq_connection: aio_pika.abc.AbstractRobustConnection = Depends(get_mq_connection),
    db: database.Database = Depends(get_backend_database),
    app_user: auth_models.AppUser = Depends(auth.live_only_user_role_guard),
    access: AccessRestrictions = Depends(auth.get_user_access_restrictions),
    value_store: ValueStore = Depends(get_value_store),
) -> StreamResponse:
    """Get data required to play a live kinesis stream."""

    if kinesis_request.log_live_activity:
        await AccessLogger.record_user_access(
            request, app_user, db, UserActions.VIEWED_A_LIVE_STREAM, ["mac_address"]
        )

    async with db.tenant_session() as session:
        camera = await get_camera_from_mac_address_or_fail(
            session=session, access=access, mac_address=kinesis_request.mac_address
        )
        retention_period = (
            await get_org_stream_retention_or_fail(session, app_user.tenant)
            if camera.is_always_streaming
            else DEFAULT_LIVE_STREAM_RETENTION_DUR
        )

    kinesis_config = KinesisVideoLiveConfig(
        stream_hash=camera.source,
        resolution_config=kinesis_request.resolution_config,
        use_webrtc=camera.is_webrtc_enabled and kinesis_request.prefer_webrtc,
        retention_period=retention_period,
    )

    try:
        return await get_kinesis_live_url(
            camera=camera,
            boto_session_maker=boto_session_maker,
            live_config=kinesis_config,
            mq_connection=mq_connection,
            iot_data_client=iot_data_client,
            value_store=value_store,
            use_iot_core=await is_iot_core_feature_enabled(
                db, IOTCoreFeature.VIDEO, app_user.tenant
            ),
        )

    except KinesisError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e


@kinesis_api_router.post("/request_live")
async def request_live(
    kinesis_requests_from_client: list[KinesisVideoKeepAliveRequest],
    mq_connection: aio_pika.abc.AbstractRobustConnection = Depends(get_mq_connection),
    iot_data_client: BotoIotDataClient = Depends(get_iot_data_client),
    db: database.Database = Depends(get_backend_database),
    app_user: auth_models.AppUser = Depends(auth.live_only_user_role_guard),
    access: AccessRestrictions = Depends(auth.get_user_access_restrictions),
) -> None:
    """Request live kinesis streams. This is used to keep the stream alive"""
    async with db.tenant_session() as session:
        cameras = await get_cameras_from_mac_address_or_fail(
            session=session,
            access=access,
            mac_addresses=[
                request.mac_address for request in kinesis_requests_from_client
            ],
        )
        retention_period = await get_org_stream_retention_or_fail(
            session, app_user.tenant
        )

    cameras_and_configs = []
    for camera, request in zip(cameras, kinesis_requests_from_client):
        cameras_and_configs.append(
            (
                camera,
                KinesisVideoLiveConfig(
                    stream_hash=camera.source,
                    resolution_config=request.resolution_config,
                    use_webrtc=False,
                    retention_period=(
                        retention_period
                        if camera.is_always_streaming
                        else DEFAULT_LIVE_STREAM_RETENTION_DUR
                    ),
                ),
            )
        )

    await put_msg_to_queue_for_live_requests(
        cameras_and_configs=cameras_and_configs,
        mq_connection=mq_connection,
        iot_data_client=iot_data_client,
        use_iot_core=await is_iot_core_feature_enabled(
            db, IOTCoreFeature.VIDEO, app_user.tenant
        ),
    )


@kinesis_api_router.post("/get_clip_upload_request")
async def get_kinesis_clip_upload_request(
    kinesis_request: KinesisVideoClipRequest,
    app_user: auth_models.AppUser = Depends(auth.limited_user_role_guard),
    db: database.Database = Depends(get_backend_database),
    access: AccessRestrictions = Depends(auth.get_user_access_restrictions),
    value_store: ValueStore = Depends(get_value_store),
    _access_logger: None = Depends(
        AccessLogger(
            UserActions.VIEWED_A_CLIP, ["mac_address", "start_time", "end_time"]
        )
    ),
) -> ClipRequestIdentifier:
    """Create a request object which can be used to either retrieve the url
    or cancel the in-progress request. Return a unique id for the clip
    """
    async with db.tenant_session() as session:
        camera = await get_camera_from_mac_address_or_fail(
            session=session, access=access, mac_address=kinesis_request.mac_address
        )

    clip_config = KinesisVideoClipConfig(
        stream_hash=camera.source,
        start_time=kinesis_request.start_time,
        end_time=kinesis_request.end_time,
        # Generate a 10 character random unique id to avoid uploading to the
        # same Kinesis stream twice.
        clip_stream_unique_id=_generate_clip_stream_unique_id(),
        resolution_config=kinesis_request.resolution_config,
        retention_period=ANONYMOUS_CLIP_RETENTION_DUR,
    )

    await value_store.set_model(
        key=clip_config.clip_stream_unique_id,
        model=clip_config,
        expiration=timedelta(hours=1),
    )
    return ClipRequestIdentifier(
        clip_id=clip_config.clip_stream_unique_id,
        mac_address=kinesis_request.mac_address,
    )


@kinesis_api_router.post("/clip")
async def kinesis_clip_url(
    clip_identifier: ClipRequestIdentifier,
    boto_session_maker: BotoSessionFn = Depends(get_boto_session_maker),
    iot_data_client: BotoIotDataClient = Depends(get_iot_data_client),
    mq_connection: aio_pika.abc.AbstractRobustConnection = Depends(get_mq_connection),
    db: database.Database = Depends(get_backend_database),
    app_user: auth_models.AppUser = Depends(auth.limited_user_role_guard),
    access: AccessRestrictions = Depends(auth.get_user_access_restrictions),
    value_store: ValueStore = Depends(get_value_store),
    playlist_replace_url: URL = Depends(get_replaced_master_playlist_url),
) -> AnyHttpUrl:
    """Get a kinesis url for a clip in the past."""
    async with db.tenant_session() as session:
        camera = await get_camera_from_mac_address_or_fail(
            session=session, access=access, mac_address=clip_identifier.mac_address
        )

    clip_config = await value_store.get_model(
        key=clip_identifier.clip_id, model_class=KinesisVideoClipConfig
    )
    if clip_config is None:
        raise HTTPException(status_code=400, detail="Clip request not found.")

    try:
        return await get_kinesis_clip_url_with_edge_upload(
            master_playlist_redirect_url=playlist_replace_url,
            camera=camera,
            clip_config=clip_config,
            boto_session_maker=boto_session_maker,
            iot_data_client=iot_data_client,
            mq_connection=mq_connection,
            value_store=value_store,
            use_iot_core=await is_iot_core_feature_enabled(
                db, IOTCoreFeature.VIDEO, app_user.tenant
            ),
        )
    except KinesisError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e


@kinesis_api_router.post("/abort_clip_upload")
async def abort_kinesis_clip_upload(
    clip_identifier: ClipRequestIdentifier,
    mq_connection: aio_pika.abc.AbstractRobustConnection = Depends(get_mq_connection),
    db: database.Database = Depends(get_backend_database),
    iot_data_client: BotoIotDataClient = Depends(get_iot_data_client),
    app_user: auth_models.AppUser = Depends(auth.limited_user_role_guard),
    access: AccessRestrictions = Depends(auth.get_user_access_restrictions),
    value_store: ValueStore = Depends(get_value_store),
) -> None:
    """Abort a kinesis upload if still in progress"""
    async with db.tenant_session() as session:
        camera = await get_camera_from_mac_address_or_fail(
            session=session, access=access, mac_address=clip_identifier.mac_address
        )

    clip_config = await value_store.get_model(
        key=clip_identifier.clip_id, model_class=KinesisVideoClipConfig
    )
    if clip_config is None:
        raise HTTPException(status_code=400, detail="Clip request not found.")

    await put_msg_to_queue_for_clip_request(
        camera=camera,
        request=clip_config,
        mq_connection=mq_connection,
        iot_data_client=iot_data_client,
        control_type=escapi.StreamControlType.Stop,
        use_iot_core=await is_iot_core_feature_enabled(
            db, IOTCoreFeature.VIDEO, app_user.tenant
        ),
    )


@kinesis_api_router_public.get(
    f"/{HLS_MASTER_PLAYLIST_ROUTE}", response_class=HlsResponse
)
async def retrieve_master_playlist(
    SessionToken: str,
    OriginalUrl: str,
    StreamName: str,
    StartTime: AwareDatetime,
    EndTime: AwareDatetime,
    value_store: ValueStore = Depends(get_value_store),
    media_playlist_replace_url: URL = Depends(get_replaced_media_playlist_url),
) -> HlsResponse:
    """
    Retrieve the master playlist from kinesis and replace the url of the media playlist
    with one pointing to the backend.
    """
    await check_hls_session(value_store, SessionToken, StreamName)

    master_playlist_url = URL(OriginalUrl).include_query_params(
        SessionToken=SessionToken
    )
    async with aiohttp.ClientSession() as session:
        async with session.get(str(master_playlist_url)) as response:
            if response.status != 200:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Could not retrieve master playlist, got {response.status}",
                )
            kinesis_master_playlist = await response.text()
    return HlsResponse(
        content=replace_url_in_master_playlist(
            kinesis_master_playlist,
            media_playlist_replace_url,
            StreamName,
            StartTime,
            EndTime,
        )
    )


@kinesis_api_router_public.get(
    f"/{HLS_MEDIA_PLAYLIST_ROUTE}", response_class=HlsResponse
)
async def retrieve_media_playlist(
    SessionToken: str,
    StreamName: str,
    StartTime: AwareDatetime,
    EndTime: AwareDatetime,
    TrackNumber: str,
    boto_session_maker: BotoSessionFn = Depends(get_boto_session_maker),
    value_store: ValueStore = Depends(get_value_store),
) -> HlsResponse:
    """
    Send an on-demand request to kinesis to get the media playlist for the clip.
    Retrieve the media playlist and replace the url of every fragment
    with the absolute path.
    Remove the #EXT-X-ENDLIST tag at the end of the playlist if we expect more fragments
    to be added later by the edge. This way, players will keep polling the playlist.
    """
    await check_hls_session(value_store, SessionToken, StreamName)
    on_demand_master_playlist_url = await _kinesis_request(
        boto_session_maker,
        StreamName,
        ON_DEMAND_MODE,
        # pad the end time by 2 seconds to make sure we get the last fragment
        {"StartTimestamp": StartTime, "EndTimestamp": EndTime + timedelta(seconds=2)},
        expires=KINESIS_MAX_EXPIRE_TIME,
    )
    on_demand_media_playlist_url = gen_on_demand_media_playlist_kinesis_url(
        URL(on_demand_master_playlist_url), TrackNumber
    )
    # fetch playlist content from kinesis
    async with aiohttp.ClientSession() as session:
        async with session.get(str(on_demand_media_playlist_url)) as response:
            if response.status != 200:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Could not retrieve media playlist",
                )
            content_text = await response.text()
    content_text = replace_fragments_urls_in_media_playlist(
        content_text, on_demand_media_playlist_url
    )
    content_text = adapt_playlist_for_live_replay(content_text, EndTime)
    return HlsResponse(content=content_text)


@kinesis_api_router_public.post("/sign_webrtc_request")
async def sign_webrtc_request(
    sign_request: AwsSignRequest,
    secrets: BackendSecrets = Depends(get_backend_secrets),
    value_store: ValueStore = Depends(get_value_store),
) -> str:
    """Sign an aws request for a WebRTC connection.
    This endpoint is public, but the request is checked.
    """
    await check_aws_sign_token(sign_request.sign_token, value_store)
    signer = SignV4RequestSigner(
        "us-west-2",
        AWSCredentials(
            secret_key=secrets.aws_server_secret_key,
            access_key=secrets.aws_server_public_key,
            token=secrets.aws_server_session_token,
        ),
    )
    signed = signer.getSignedURL(
        sign_request.wss_url, sign_request.headers, AwareDatetime.utcnow()
    )
    return signed
