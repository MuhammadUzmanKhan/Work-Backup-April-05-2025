import asyncio
import logging
import math
from collections import defaultdict
from datetime import datetime, timedelta
from pathlib import Path
from typing import Sequence, cast

import aio_pika
import stamina
from botocore.exceptions import ClientError, ParamValidationError
from fastapi import Request
from pydantic import AnyHttpUrl, parse_obj_as
from starlette.datastructures import URL

from backend import escapi, logging_config, message_queue, ws_utils
from backend.aws_signer.aws_signer_utils import generate_aws_sign_token
from backend.boto_utils import BotoIotDataClient, BotoSessionFn
from backend.clip_data.utils import request_and_wait_s3_clip_upload
from backend.database import database
from backend.database.models import Camera, ClipData
from backend.envs import BackendSecrets
from backend.escapi import protocol_models
from backend.iot_core.utils import (
    CLIP_STREAMING_IOT_QUEUE_FACTORY,
    LIVE_STREAMING_IOT_QUEUE_FACTORY,
    send_msg_to_nvr_through_iot,
)
from backend.kinesis_api.constants import (
    KINESIS_MAX_EXPIRE_TIME,
    KINESIS_MAX_RETRIES,
    MAX_FRAGMENTS_GAP_S,
)
from backend.kinesis_api.errors import (
    KinesisClipRetentionUpdateError,
    KinesisEndpointError,
    KinesisError,
    KinesisFragmentsError,
    KinesisHlsUrlError,
    KinesisLiveRetentionUpdateError,
    KinesisPlayListUrlError,
    KinesisRetentionRequestError,
)
from backend.kinesis_api.hls_utils import redirect_master_playlist_to_backend
from backend.kinesis_api.models import (
    HlsData,
    HlsStreamResponse,
    KinesisClipParams,
    KinesisClipRetentionHoursUpdateRequest,
    KinesisFragmentInfo,
    KinesisLiveRetentionHoursUpdateRequest,
    KinesisVideoClipConfig,
    KinesisVideoLiveConfig,
    StreamResponse,
    WebRtcStreamResponse,
)
from backend.kinesis_api.webrtc_utils import (
    get_random_client_id,
    live_kinesis_webrtc_request,
)
from backend.s3_utils import RequestTime, get_signed_url
from backend.sync_utils import run_async
from backend.utils import AwareDatetime
from backend.value_store.value_store import ValueStore

logger = logging.getLogger(logging_config.LOGGER_NAME)

DEBUG_DATE_FORMAT = "%Y-%m-%d %H:%M:%S %Z"


async def _kinesis_request(
    boto_session_maker: BotoSessionFn,
    stream_name: str,
    playback_mode: str,
    timestamp_range: dict[str, datetime] | None,
    expires: timedelta,
) -> str:
    """Send a stream request using kinesis APIs.
    Return a url we can use to fetch the video from kinesis using HLS.

    :param boto_session: Boto session
    :param stream_name: Name of the stream in kinesis
    :param playback_mode: Playback mode as string
    :param timestamp_range: Optional timestamp range for the fragments.
    :param expires: Expiration time for the url
    :return: Url for the stream
    """

    def _inner() -> str:
        msg = f"{stream_name=} {timestamp_range=} at: {AwareDatetime.utcnow()}"
        try:
            boto_session = boto_session_maker()
            video_client = boto_session.client("kinesisvideo")
            data_endpoint: str = video_client.get_data_endpoint(
                StreamName=stream_name, APIName="GET_HLS_STREAMING_SESSION_URL"
            )["DataEndpoint"]
        except (ClientError, ParamValidationError) as ex:
            raise KinesisEndpointError(f"Error fetching endpoint {msg}: {repr(ex)}")

        try:
            archive_client = boto_session.client(
                "kinesis-video-archived-media", endpoint_url=data_endpoint
            )
            return cast(
                str,
                archive_client.get_hls_streaming_session_url(
                    StreamName=stream_name,
                    PlaybackMode=playback_mode,
                    HLSFragmentSelector={
                        "FragmentSelectorType": "PRODUCER_TIMESTAMP",
                        "TimestampRange": timestamp_range,
                    },
                    ContainerFormat="FRAGMENTED_MP4",
                    DiscontinuityMode="ALWAYS",
                    DisplayFragmentTimestamp="ALWAYS",
                    MaxMediaPlaylistFragmentResults=5000,
                    Expires=int(expires.total_seconds()),
                )["HLSStreamingSessionURL"],
            )
        except (ClientError, ParamValidationError) as ex:
            raise KinesisHlsUrlError(f"Error fetching hls url {msg}: {repr(ex)}")

    return await run_async(_inner)


def _get_kinesis_fragments(
    boto_session_maker: BotoSessionFn,
    stream_name: str,
    start_time: AwareDatetime,
    end_time: AwareDatetime,
) -> list[KinesisFragmentInfo]:
    """Get list of fragments given a stream and start/end time.
    NOTE: we sort the list based on the fragment ID.

    :param boto_session: boto session
    :param stream_name: name of the stream
    :param start_time: start time of the fragments
    :param end_time: end time of the fragments
    :return: list of fragments for the given request
    """
    try:
        boto_session = boto_session_maker()
        video_client = boto_session.client("kinesisvideo")
        data_endpoint: str = video_client.get_data_endpoint(
            StreamName=stream_name, APIName="LIST_FRAGMENTS"
        )["DataEndpoint"]
    except (ClientError, ParamValidationError) as ex:
        raise KinesisEndpointError(f"Error fetching endpoint: {repr(ex)}")

    try:
        archive_client = boto_session.client(
            "kinesis-video-archived-media", endpoint_url=data_endpoint
        )
        fragment_selector = {
            "FragmentSelectorType": "PRODUCER_TIMESTAMP",
            "TimestampRange": {"StartTimestamp": start_time, "EndTimestamp": end_time},
        }
        fragment_resp = archive_client.list_fragments(
            StreamName=stream_name, FragmentSelector=fragment_selector
        )
        raw_fragments = fragment_resp["Fragments"]
        next_token = fragment_resp.get("NextToken", "")

        # keep fetching fragments until we have all of them
        while next_token:
            # list again with the next token
            fragment_resp = archive_client.list_fragments(
                StreamName=stream_name,
                FragmentSelector=fragment_selector,
                NextToken=next_token,
            )
            raw_fragments += fragment_resp["Fragments"]
            next_token = fragment_resp.get("NextToken", "")

        fragments: list[KinesisFragmentInfo] = []
        for raw_fragment in raw_fragments:
            # TODO(@lberg): I'm not sure this is start_time actually
            # I was not able to find doc
            fragment_start_time = raw_fragment["ProducerTimestamp"]
            fragment_end_time = fragment_start_time + timedelta(
                milliseconds=raw_fragment["FragmentLengthInMilliseconds"]
            )
            fragments.append(
                KinesisFragmentInfo(
                    fragment_number=raw_fragment["FragmentNumber"],
                    start_time=fragment_start_time,
                    end_time=fragment_end_time,
                )
            )
        return sorted(fragments, key=lambda fragment: fragment.start_time)
    except ClientError as ex:
        raise KinesisFragmentsError(f"Error fetching fragments: {repr(ex)}") from ex


def _check_fragments(
    fragments: list[KinesisFragmentInfo],
    start_time: AwareDatetime,
    end_time: AwareDatetime,
) -> None:
    """Validate fragments ensuring that:
    - there are no gaps between fragments;
    - the first fragment is before the request start time (or close to it)
    - the last fragment is after the request end time (or close to it)

    :param fragments: list of fragments
    :param start_time: start time of the interval for requesting fragments
    :param end_time: end time of the interval for requesting fragments
    """
    if len(fragments) < 1:
        raise KinesisFragmentsError("No fragments found")

    # There should be no gaps between fragments
    for idx in range(1, len(fragments)):
        fragment_gap = fragments[idx].start_time - fragments[idx - 1].end_time
        if fragment_gap.total_seconds() > MAX_FRAGMENTS_GAP_S:
            raise KinesisFragmentsError(
                "Found missing fragment in list as diff is"
                f" {fragment_gap.total_seconds()} > {MAX_FRAGMENTS_GAP_S} seconds,"
                f"starting at {fragments[idx-1].end_time.strftime(DEBUG_DATE_FORMAT)}"
            )

    # Start time should be before or around the request start time
    start_request_time = start_time
    start_time = fragments[0].start_time
    if (
        start_time > start_request_time
        and (start_time - start_request_time).total_seconds() > MAX_FRAGMENTS_GAP_S
    ):
        raise KinesisFragmentsError(
            f"Fragment missing at start for more than {MAX_FRAGMENTS_GAP_S}, "
            f"start_time={start_time.strftime(DEBUG_DATE_FORMAT)} "
            f"start_request_time={start_request_time.strftime(DEBUG_DATE_FORMAT)}"
        )

    # End time should be after or around the request end time
    end_request_time = end_time
    end_time = fragments[-1].end_time
    if (
        end_time < end_request_time
        and (end_request_time - end_time).total_seconds() > MAX_FRAGMENTS_GAP_S
    ):
        raise KinesisFragmentsError(
            f"Fragment missing at end for more than {MAX_FRAGMENTS_GAP_S}, "
            f"end_time={end_time.strftime(DEBUG_DATE_FORMAT)} "
            f"end_request_time={end_request_time.strftime(DEBUG_DATE_FORMAT)}"
        )


async def is_kinesis_hls_stream_ingested(
    boto_session_maker: BotoSessionFn, stream_name: str
) -> bool:

    def _inner() -> bool:
        try:
            boto_session = boto_session_maker()
            video_client = boto_session.client("kinesisvideo")
        except ClientError as ex:
            raise KinesisEndpointError(f"Error fetching endpoint: {repr(ex)}")

        try:
            video_client.describe_stream(StreamName=stream_name)
            return True
        except ClientError as ex:
            error = ex.response.get("Error")
            if error is None:
                raise KinesisError(f"Error fetching stream: {repr(ex)}")
            code = error.get("Code")
            if code == "ResourceNotFoundException":
                return False
            raise KinesisError(f"Error fetching stream: {repr(ex)}")

    return await run_async(_inner)


async def _live_kinesis_hls_request(
    boto_session_maker: BotoSessionFn, params: KinesisVideoLiveConfig
) -> HlsData:
    """Request a live stream.
    NOTE: we are using LIVE_REPLAY here instead of live to also include some history.
    """
    live_stream_url = await _kinesis_request(
        boto_session_maker=boto_session_maker,
        stream_name=params.upload_stream_name,
        playback_mode="LIVE_REPLAY",
        timestamp_range={
            "StartTimestamp": AwareDatetime.utcnow() - timedelta(seconds=30)
        },
        expires=params.expires,
    )
    return HlsData(video_url=parse_obj_as(AnyHttpUrl, live_stream_url))


async def _clip_kinesis_request(
    boto_session_maker: BotoSessionFn, params: KinesisClipParams
) -> str:
    """Request a replayed stream."""

    return await _kinesis_request(
        boto_session_maker=boto_session_maker,
        stream_name=params.upload_stream_name,
        playback_mode=params.hls_playback_mode,
        timestamp_range={
            "StartTimestamp": params.start_time,
            "EndTimestamp": params.end_time,
        },
        expires=KINESIS_MAX_EXPIRE_TIME,
    )


def clip_kinesis_retention_update_request(
    boto_session_maker: BotoSessionFn, request: KinesisClipRetentionHoursUpdateRequest
) -> None:
    """Update the retention period of a kinesis stream.

    :param boto_session: Boto session
    :param request: The request to update the retention period
    """

    try:
        boto_session = boto_session_maker()
        kinesis_video_client = boto_session.client("kinesisvideo")
        stream_describe = kinesis_video_client.describe_stream(
            StreamName=request.kvs_stream_name
        )
        if (
            "StreamInfo" not in stream_describe
            or "Version" not in stream_describe["StreamInfo"]
            or "DataRetentionInHours" not in stream_describe["StreamInfo"]
            or "CreationTime" not in stream_describe["StreamInfo"]
        ):
            raise KinesisClipRetentionUpdateError(
                f"Stream {request.kvs_stream_name} does not exist "
                "or has no version or retention info"
            )
        data_retention_in_hours = int(
            stream_describe["StreamInfo"]["DataRetentionInHours"]
        )
        stream_creation_time = stream_describe["StreamInfo"]["CreationTime"]
        original_clip_expiration_time = stream_creation_time + timedelta(
            hours=data_retention_in_hours
        )
        extension_duration = request.expiration_time - original_clip_expiration_time
        inc_hours = (
            0
            if extension_duration < timedelta()
            else int(extension_duration.total_seconds() / 3600)
        )
        if inc_hours >= 1:
            # Min increase retention hours is 1 hour
            kinesis_video_client.update_data_retention(
                StreamName=request.kvs_stream_name,
                Operation="INCREASE_DATA_RETENTION",
                CurrentVersion=stream_describe["StreamInfo"]["Version"],
                DataRetentionChangeInHours=inc_hours,
            )
            logger.info(
                "Increased retention hours for stream "
                f"{request.kvs_stream_name} by {inc_hours} hours"
            )
    except (ClientError, ParamValidationError) as ex:
        raise KinesisClipRetentionUpdateError(
            f"Error updating retention hours: {repr(ex)}"
        )


def _live_kinesis_retention_update_request(
    boto_session_maker: BotoSessionFn, request: KinesisLiveRetentionHoursUpdateRequest
) -> None:
    """Update the retention period of a kinesis stream. This function is used
    for live streams."""
    try:
        boto_session = boto_session_maker()
        kinesis_video_client = boto_session.client("kinesisvideo")
        stream_describe = kinesis_video_client.describe_stream(
            StreamName=request.kvs_stream_name
        )
        if (
            "StreamInfo" not in stream_describe
            or "Version" not in stream_describe["StreamInfo"]
            or "DataRetentionInHours" not in stream_describe["StreamInfo"]
        ):
            raise KinesisLiveRetentionUpdateError(
                f"Stream {request.kvs_stream_name} does not exist "
                "or has no version or retention info"
            )
        data_retention_in_hours = int(
            stream_describe["StreamInfo"]["DataRetentionInHours"]
        )
        inc_hours = (
            int(request.retention_duration.total_seconds() / 3600)
            - data_retention_in_hours
        )
        if inc_hours >= 1:
            # Min increase in retention hours is 1 hour
            kinesis_video_client.update_data_retention(
                StreamName=request.kvs_stream_name,
                Operation="INCREASE_DATA_RETENTION",
                CurrentVersion=stream_describe["StreamInfo"]["Version"],
                DataRetentionChangeInHours=inc_hours,
            )
            logger.info(
                "Increased retention hours for stream "
                f"{request.kvs_stream_name} by {inc_hours} hours"
            )
        elif inc_hours <= -1:
            # Min decrease in retention hours is 1 hour
            kinesis_video_client.update_data_retention(
                StreamName=request.kvs_stream_name,
                Operation="DECREASE_DATA_RETENTION",
                CurrentVersion=stream_describe["StreamInfo"]["Version"],
                DataRetentionChangeInHours=-inc_hours,
            )
            logger.info(
                "Decreased retention hours for stream "
                f"{request.kvs_stream_name} by {-inc_hours} hours"
            )
    except (ClientError, ParamValidationError) as ex:
        raise KinesisLiveRetentionUpdateError(
            f"Error updating retention hours: {repr(ex)}"
        )


async def live_kinesis_retention_update_request(
    boto_session_maker: BotoSessionFn, request: KinesisLiveRetentionHoursUpdateRequest
) -> None:
    """Async version of live_kinesis_retention_update_request."""
    return await run_async(
        _live_kinesis_retention_update_request, boto_session_maker, request
    )


def gen_url_for_clip_path(request: Request, clip_path: Path) -> str:
    """Generate a URL for a clip path.
    NOTE: we return a relative URL so that we don't have to figure out http vs https
    We don't know if we have an https proxy running (at least not trivially)
    see last post in https://github.com/encode/starlette/issues/538

    :param request: The request object
    :param clip_path: path to local static file for the clip
    :return: URL to the clip
    """

    return str(request.app.url_path_for("static_clips", path=clip_path.name))


async def retrieve_clip_signed_url(
    clip_data: ClipData,
    camera: Camera,
    db: database.Database,
    mq_connection: aio_pika.abc.AbstractRobustConnection,
    iot_data_client: BotoIotDataClient,
    secrets: BackendSecrets,
    use_iot_core: bool,
    region_name: str,
) -> str:
    s3_upload_response = None
    if clip_data.s3_path is not None:
        # The clip is already uploaded to s3
        s3_upload_response = protocol_models.UserClipUploadResponse(
            clip_id=clip_data.id, s3_path=clip_data.s3_path
        )
    else:
        # The clip is not uploaded to s3 yet, request upload
        s3_upload_response = await request_and_wait_s3_clip_upload(
            db=db,
            iot_data_client=iot_data_client,
            mq_connection=mq_connection,
            upload_request=protocol_models.RequestUploadBody(
                mac_address=clip_data.mac_address,
                start_time=clip_data.start_time,
                end_time=clip_data.end_time,
                clip_data_id=str(clip_data.id),
                video_overlay_type=protocol_models.VideoOverlayType.LocalDateTime,
                nvr_uuid=camera.nvr_uuid,
                video_orientation_type=camera.video_orientation_type,
            ),
            use_iot_core=use_iot_core,
        )

    request_time = RequestTime.from_datetime(AwareDatetime.utcnow())
    s3_signed_url_for_clip = get_signed_url(
        s3_path=s3_upload_response.s3_path,
        request_time=request_time,
        aws_credentials=secrets.aws_credentials(),
        aws_region=region_name,
    )
    return s3_signed_url_for_clip


async def put_msg_to_queue_for_live_request(
    camera: Camera,
    config: KinesisVideoLiveConfig,
    mq_connection: aio_pika.abc.AbstractRobustConnection,
    iot_data_client: BotoIotDataClient,
    use_iot_core: bool,
) -> None:
    message = escapi.RequestLiveBody(
        live_stream_name=config.upload_stream_name,
        mac_address=camera.mac_address,
        nvr_uuid=camera.nvr_uuid,
        video_res_request=config.resolution_config.resolution,
        supports_dynamic_resolution=(
            config.resolution_config.supports_dynamic_resolution
        ),
        use_webrtc=config.use_webrtc,
        retention_period_hours=int(config.retention_period.total_seconds() / 3600),
    )
    if use_iot_core:
        iot_queue_settings = LIVE_STREAMING_IOT_QUEUE_FACTORY(camera.nvr_uuid)
        await send_msg_to_nvr_through_iot(
            iot_queue_settings, message.json(), iot_data_client
        )
    else:
        queue_settings = ws_utils.ON_DEMAND_STREAMING_QUEUE_FACTORY(camera.nvr_uuid)
        await message_queue.publish_message(
            mq_connection=mq_connection, queue_settings=queue_settings, message=message
        )


def _batch_camera_messages_by_nvr(
    cameras_and_configs: Sequence[tuple[Camera, KinesisVideoLiveConfig]],
) -> dict[str, escapi.BatchedRequestsBody]:
    messages: defaultdict[str, escapi.BatchedRequestsBody] = defaultdict(
        lambda: escapi.BatchedRequestsBody(requests=[])
    )
    for camera, config in cameras_and_configs:
        message = escapi.RequestLiveBody(
            live_stream_name=config.upload_stream_name,
            mac_address=camera.mac_address,
            nvr_uuid=camera.nvr_uuid,
            video_res_request=config.resolution_config.resolution,
            supports_dynamic_resolution=(
                config.resolution_config.supports_dynamic_resolution
            ),
            use_webrtc=config.use_webrtc,
            retention_period_hours=int(config.retention_period.total_seconds() / 3600),
        )
        messages[camera.nvr_uuid].requests.append(message)
    return messages


async def put_msg_to_queue_for_live_requests(
    cameras_and_configs: Sequence[tuple[Camera, KinesisVideoLiveConfig]],
    mq_connection: aio_pika.abc.AbstractRobustConnection,
    iot_data_client: BotoIotDataClient,
    use_iot_core: bool,
) -> None:
    if use_iot_core:
        batched_messages = _batch_camera_messages_by_nvr(cameras_and_configs)
        await asyncio.gather(
            *[
                send_msg_to_nvr_through_iot(
                    LIVE_STREAMING_IOT_QUEUE_FACTORY(nvr_uuid),
                    messages.json(),
                    iot_data_client,
                )
                for nvr_uuid, messages in batched_messages.items()
            ]
        )
    else:
        await asyncio.gather(
            *[
                put_msg_to_queue_for_live_request(
                    camera=camera,
                    config=config,
                    mq_connection=mq_connection,
                    iot_data_client=iot_data_client,
                    use_iot_core=False,
                )
                for camera, config in cameras_and_configs
            ]
        )


async def put_msg_to_queue_for_clip_request(
    camera: Camera,
    request: KinesisVideoClipConfig,
    mq_connection: aio_pika.abc.AbstractRobustConnection,
    iot_data_client: BotoIotDataClient,
    control_type: escapi.StreamControlType,
    use_iot_core: bool,
) -> None:
    message = escapi.RequestClipBody(
        live_stream_name=request.stream_hash,
        mac_address=camera.mac_address,
        nvr_uuid=camera.nvr_uuid,
        upload_stream_name=request.upload_stream_name,
        start_time=request.start_time,
        end_time=request.end_time,
        retention_period_hours=(
            math.ceil(request.retention_period.total_seconds() / 3600)
            if request.retention_period is not None
            else None
        ),
        video_orientation_type=camera.video_orientation_type,
        control_type=control_type,
        video_res_request=request.resolution_config.resolution,
        supports_dynamic_resolution=(
            request.resolution_config.supports_dynamic_resolution
        ),
    )

    if use_iot_core:
        iot_queue_settings = CLIP_STREAMING_IOT_QUEUE_FACTORY(camera.nvr_uuid)
        await send_msg_to_nvr_through_iot(
            iot_queue_settings, message.json(), iot_data_client
        )

    else:
        queue_settings = ws_utils.ON_DEMAND_STREAMING_QUEUE_FACTORY(camera.nvr_uuid)
        await message_queue.publish_message(
            mq_connection=mq_connection, queue_settings=queue_settings, message=message
        )


async def get_kinesis_live_url(
    camera: Camera,
    boto_session_maker: BotoSessionFn,
    iot_data_client: BotoIotDataClient,
    live_config: KinesisVideoLiveConfig,
    mq_connection: aio_pika.abc.AbstractRobustConnection,
    value_store: ValueStore,
    use_iot_core: bool,
) -> StreamResponse:
    """Retrieve live kinesis data we can use to play the video.
    This can either be a HLS url or WebRTC data."""
    async for attempt in stamina.retry_context(
        on=KinesisError,
        attempts=KINESIS_MAX_RETRIES,
        wait_initial=1,
        wait_exp_base=1,
        wait_jitter=0,
    ):
        with attempt:
            await put_msg_to_queue_for_live_request(
                camera=camera,
                config=live_config,
                mq_connection=mq_connection,
                iot_data_client=iot_data_client,
                use_iot_core=use_iot_core,
            )
            if not live_config.use_webrtc:
                return HlsStreamResponse(
                    data=await _live_kinesis_hls_request(
                        boto_session_maker, live_config
                    )
                )
            else:
                webrtc_client_id = get_random_client_id()
                stream_data = await live_kinesis_webrtc_request(
                    boto_session_maker, live_config, webrtc_client_id
                )
                return WebRtcStreamResponse(
                    data=stream_data,
                    sign_token=await generate_aws_sign_token(value_store),
                )

    raise KinesisPlayListUrlError(
        f"Could not get live url from Kinesis for {live_config=} "
    )


async def get_kinesis_clip_url(
    master_playlist_redirect_url: URL,
    clip_params: KinesisClipParams,
    boto_session_maker: BotoSessionFn,
    value_store: ValueStore,
) -> AnyHttpUrl:
    """Get a kinesis url for a clip in the past."""
    kinesis_master_playlist_url = await _clip_kinesis_request(
        boto_session_maker, clip_params
    )
    if kinesis_master_playlist_url == "":
        raise KinesisPlayListUrlError("Could not get clip url from Kinesis")

    return await redirect_master_playlist_to_backend(
        kinesis_master_playlist_url,
        master_playlist_redirect_url,
        clip_params,
        value_store,
    )


async def get_kinesis_clip_url_with_edge_upload(
    master_playlist_redirect_url: URL,
    camera: Camera,
    clip_config: KinesisVideoClipConfig,
    boto_session_maker: BotoSessionFn,
    iot_data_client: BotoIotDataClient,
    mq_connection: aio_pika.abc.AbstractRobustConnection,
    value_store: ValueStore,
    use_iot_core: bool,
) -> AnyHttpUrl:
    """Request to upload a clip and get the url."""
    if (
        clip_config.retention_period is None
        or clip_config.retention_period.total_seconds() < 3600
    ):
        raise KinesisRetentionRequestError(
            "Must specify a valid retention_period (>=1H) if requesting edge upload."
        )

    kinesis_master_playlist_url = ""
    async for attempt in stamina.retry_context(
        on=KinesisError,
        attempts=KINESIS_MAX_RETRIES,
        wait_initial=1,
        wait_exp_base=1,
        wait_jitter=0,
    ):
        with attempt:
            await put_msg_to_queue_for_clip_request(
                camera=camera,
                request=clip_config,
                mq_connection=mq_connection,
                iot_data_client=iot_data_client,
                control_type=escapi.StreamControlType.Start,
                use_iot_core=use_iot_core,
            )
            kinesis_master_playlist_url = await _clip_kinesis_request(
                boto_session_maker, clip_config
            )

    if kinesis_master_playlist_url == "":
        raise KinesisPlayListUrlError("Could not get clip url from Kinesis")

    return await redirect_master_playlist_to_backend(
        kinesis_master_playlist_url,
        master_playlist_redirect_url,
        clip_config,
        value_store,
    )
