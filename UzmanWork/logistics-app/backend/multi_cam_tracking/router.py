import asyncio
import logging
from collections import defaultdict
from datetime import datetime, timedelta

import aio_pika
from fastapi import APIRouter, Depends, HTTPException, status

from backend import (
    auth,
    auth_models,
    dependencies,
    logging_config,
    message_queue,
    ws_utils,
)
from backend.boto_utils import BotoIotDataClient
from backend.database import database, models, orm
from backend.database.session import TenantAwareAsyncSession
from backend.dependencies import (
    get_aws_region,
    get_backend_database,
    get_backend_secrets,
    get_iot_data_client,
    get_mq_connection,
    get_value_store,
)
from backend.envs import BackendSecrets
from backend.fastapi_utils import WithResponseExcludeNone
from backend.iot_core.db_utils import IOTCoreFeature, is_iot_core_feature_enabled
from backend.iot_core.utils import (
    JOURNEY_EMBEDDING_IOT_QUEUE_FACTORY,
    JOURNEY_SEARCH_IOT_QUEUE_FACTORY,
    send_msg_to_nvr_through_iot,
)
from backend.kinesis_api.router import MAX_RETRIES
from backend.models import AccessRestrictions, JourneyResponseMessageBase
from backend.multi_cam_tracking import protocol_models
from backend.multi_cam_tracking.constants import (
    JOURNEY_REQUEST_TOP_K,
    JOURNEY_RESPONSE_STATUS_KEY,
    JOURNEY_RESPONSE_TOP_K,
    JOURNEY_SCORE_THRESHOLD,
    MIN_TRACK_LIFESPAN,
)
from backend.multi_cam_tracking.models import (
    JourneyFromTrackRequest,
    JourneyInterval,
    JourneyIntervalBase,
    RankedJourneyInterval,
    TracksThumbnailRequest,
    TrackThumbnailResponse,
)
from backend.multi_cam_tracking.router_utils import (
    get_nvr_to_mac_addresses_or_fail,
    query_track_by_object_info_and_check,
)
from backend.multi_cam_tracking.utils import merge_journey_intervals
from backend.router_utils import (
    check_camera_access,
    get_camera_from_mac_address_or_fail,
    get_camera_response_from_mac_address_or_fail,
    get_nvr_from_uuid_or_fail,
)
from backend.s3_utils import RequestTime, get_signed_url
from backend.scoped_timer import Timer
from backend.slack_client import SlackClient
from backend.utils import AwareDatetime
from backend.value_store import ValueStore

logger = logging.getLogger(logging_config.LOGGER_NAME)

journey_router = WithResponseExcludeNone(
    APIRouter(
        prefix="/journey",
        tags=["journey"],
        generate_unique_id_function=lambda route: route.name,
    )
)


# The maximum number of objects we can send to the NVR when we request for an
# embedding.
MAX_OBJECTS_FOR_EMBEDDING = 1000


async def _query_objects_by_track_and_rank_by_time(
    session: TenantAwareAsyncSession,
    mac_address: str,
    track_id: int,
    perception_stack_start_id: str,
    timestamp: AwareDatetime,
) -> list[models.PcpObjectIdentifier]:
    """Query the objects with the given track id and rank them by time difference to the
    requested time.

    The edge can only associate an object id and a timestamp with an embedding,
    so we need to send all detections from the track in a given time window.

    :param session: the database session
    :param mac_address: the mac address of the camera
    :param object_of_interest: the object of interest
    :param object_time: the time of the object of interest
    :return: the list of objects with the same track id, ranked by time difference to
    the object time
    """

    objects: list[models.PcpObjectIdentifier] = (
        await orm.PerceptionObjectEvent.query_by_track_id(
            session,
            mac_address,
            track_id,
            perception_stack_start_id,
            # TODO(@lberg): not sure about these deltas
            timestamp - timedelta(minutes=10),
            timestamp + timedelta(minutes=10),
        )
    )

    # Rank objects with the same track ID by time diff to the requested time
    def _get_time_diff(obj: models.PcpObjectIdentifier) -> timedelta:
        return abs(obj.timestamp - timestamp)

    sorted_objects: list[models.PcpObjectIdentifier] = sorted(
        objects, key=lambda obj: _get_time_diff(obj)
    )
    return sorted_objects


async def _query_embedding_from_nvr(
    db: database.Database,
    mq_connection: aio_pika.abc.AbstractRobustConnection,
    iot_data_client: BotoIotDataClient,
    request_id: int,
    mac_address: str,
    nvr_uuid: str,
    objects: list[models.PcpObjectIdentifier],
    use_iot_core: bool,
) -> models.EmbeddingResponse | None:
    """Query the embedding from the NVR.

    This function involves the following steps:
    1. send the embedding request to the NVR
    2. wait for the embedding response from the NVR
    3. query the embedding table once it's back and return the embedding
    Note that the embedding can itself be None even when returned from the NVR.
    """
    # Subsample the objects if there are too many
    # TODO (balazs): We could solve this in a more elegant way if we stored the
    # association between track and detections in an index on the NVR. Then we
    # could just send a track ID here and the NVR would look up the detections
    # to find the embeddings.
    if len(objects) > MAX_OBJECTS_FOR_EMBEDDING:
        logging.warning(
            "[Journey] Too many objects for embedding request for "
            f"camera {mac_address}, object count: {len(objects)}, "
            f"subsampling to {MAX_OBJECTS_FOR_EMBEDDING} objects."
        )
        objects = objects[:: len(objects) // MAX_OBJECTS_FOR_EMBEDDING]

    message = protocol_models.EmbeddingRequestBody(
        request_id=request_id, mac_address=mac_address, objects=objects
    )

    if use_iot_core:
        iot_queue_settings = JOURNEY_EMBEDDING_IOT_QUEUE_FACTORY(nvr_uuid)
        await send_msg_to_nvr_through_iot(
            iot_queue_settings, message.json(), iot_data_client
        )
    else:
        queue_settings = ws_utils.JOURNEY_EMBEDDING_QUEUE_FACTORY(nvr_uuid)
        await message_queue.publish_message(
            mq_connection=mq_connection, queue_settings=queue_settings, message=message
        )

    response = None
    for _ in range(MAX_RETRIES):
        async with db.tenant_session() as session:
            response = await orm.EmbeddingResponse.query_response(session, request_id)

        if response is not None:
            break

        await asyncio.sleep(1)

    if response is None or response.embedding is None:
        return None

    return response


async def _query_journey_from_nvrs(
    db: database.Database,
    value_store: ValueStore,
    mq_connection: aio_pika.abc.AbstractRobustConnection,
    iot_data_client: BotoIotDataClient,
    embedding_response: models.EmbeddingResponse,
    request_id: int,
    nvr_to_mac_addresses: dict[str, list[str]],
    search_start_time: AwareDatetime,
    search_end_time: AwareDatetime,
    use_iot_core: bool,
) -> dict[str, list[JourneyResponseMessageBase]]:
    """Query the journey of the object of interest from all nvrs.

    This function involves the following steps:
    1. send the journey request to all nvrs
    2. wait for the journey response from all nvrs
    3. query the journey table once it's back, rank the journey responses by their
        scores and return all of them.
    """

    # Send the text search request to all nvrs
    async def _send_journey_request(nvr_uuid: str, mac_addresses: list[str]) -> None:
        message = protocol_models.JourneyRequestBody(
            request_id=request_id,
            mac_addresses=mac_addresses,
            embedding=embedding_response.embedding,
            clip_version=embedding_response.clip_version,
            top_k=JOURNEY_REQUEST_TOP_K,
            search_start_time=search_start_time,
            search_end_time=search_end_time,
        )

        if use_iot_core:
            iot_queue_settings = JOURNEY_SEARCH_IOT_QUEUE_FACTORY(nvr_uuid)
            await send_msg_to_nvr_through_iot(
                iot_queue_settings, message.json(), iot_data_client
            )
        else:
            queue_settings = ws_utils.JOURNEY_SEARCH_QUEUE_FACTORY(nvr_uuid)
            await message_queue.publish_message(
                mq_connection=mq_connection,
                queue_settings=queue_settings,
                message=message,
            )

    async def _has_all_responses(request_id: int, expected_nvrs: set[str]) -> bool:
        for nvr_uuid in expected_nvrs:
            returned = await value_store.get_timestamp(
                key=JOURNEY_RESPONSE_STATUS_KEY.format(
                    request_id=request_id, nvr_uuid=nvr_uuid
                )
            )
            if not returned:
                return False
        return True

    await asyncio.gather(
        *[
            _send_journey_request(nvr_uuid, mac_addresses)
            for nvr_uuid, mac_addresses in nvr_to_mac_addresses.items()
        ]
    )

    expected_nvrs = set(nvr_to_mac_addresses.keys())
    responses_returned = False
    for i in range(MAX_RETRIES):
        if await _has_all_responses(request_id, expected_nvrs):
            responses_returned = True
            break

        await asyncio.sleep(1)

    if not responses_returned:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "No journey results found for this search. Try picking another "
                "object or image."
            ),
        )

    async with db.tenant_session() as session:
        results = await orm.JourneyResponse.query_response(
            session, request_id, JOURNEY_SCORE_THRESHOLD
        )

    # Group results by mac address and rank them by score
    mac_address_to_results: dict[str, list[JourneyResponseMessageBase]] = defaultdict(
        list
    )
    for result in results:
        mac_address_to_results[result.mac_address].append(result)

    for mac_address, results in mac_address_to_results.items():
        mac_address_to_results[mac_address] = sorted(
            results, key=lambda result: result.score, reverse=True
        )

    return mac_address_to_results


async def _query_track_lifespans(
    session: TenantAwareAsyncSession,
    journey_responses: list[JourneyResponseMessageBase],
    max_num_tracks: int,
    slack_client: SlackClient = Depends(dependencies.get_slack_client),
) -> list[JourneyIntervalBase]:
    """Query the track lifespans of the objects of interest.

    We first find the track ID of the object of interest from the journey response,
    and then query its corresponding lifespan.
    The lifespan is defined as the time interval between the first and last time
    the track is detected.
    This function returns the first `max_num_tracks` tracks and skips duplicate ones
    if any in the journey responses. While calculating the first `max_num_tracks`,
    overlapping intervals are merged.

    :param journey_responses: the journey responses
    :param max_num_tracks: the maximum number of tracks to return
    :return: the track lifespans
    """
    results = []
    unique_tracks = set()
    for journey_response in journey_responses:
        logger.info(
            "[Journey] query_track_by_object_info for"
            f" mac={journey_response.mac_address},"
            f" time={journey_response.timestamp.isoformat()},"
            f" object_idx={journey_response.object_idx}"
        )
        track = await query_track_by_object_info_and_check(
            session=session,
            slack_client=slack_client,
            mac_address=journey_response.mac_address,
            timestamp=journey_response.timestamp,
            object_idx=journey_response.object_idx,
        )
        if track in unique_tracks:
            continue
        unique_tracks.add(track)

        logger.info(
            f"[Journey] query_track_life_span for mac={journey_response.mac_address},"
            f" time={journey_response.timestamp.isoformat()},"
            f" track_id={track.track_id}"
            f" perception_stack_start_id={track.perception_stack_start_id}"
        )

        result = await orm.PerceptionObjectEvent.query_track_life_span(
            session,
            track,
            journey_response.timestamp - timedelta(hours=1),
            journey_response.timestamp + timedelta(hours=1),
        )

        if result is None:
            continue
        logger.info(
            f"[Journey] get_track_thumbnail for mac={journey_response.mac_address},"
            f" time={journey_response.timestamp.isoformat()},"
            f" track_id={track.track_id}"
            f" perception_stack_start_id={track.perception_stack_start_id}"
        )
        thumbnail = await orm.MctImage.get_track_thumbnail(
            session,
            models.TrackIdentifier(
                perception_stack_start_id=track.perception_stack_start_id,
                track_id=track.track_id,
                mac_address=journey_response.mac_address,
            ),
            journey_response.timestamp,
        )

        start_time, end_time = result
        if (end_time - start_time) < MIN_TRACK_LIFESPAN:
            start_time -= MIN_TRACK_LIFESPAN / 2
            end_time += MIN_TRACK_LIFESPAN / 2

        results.append(
            JourneyIntervalBase(
                mac_address=journey_response.mac_address,
                start_time=start_time,
                end_time=end_time,
                thumbnail_s3_path=thumbnail.s3_path if thumbnail else None,
            )
        )
        # Check if, after having added the new interval, any intervals
        # can be merged because they overlap.
        results = merge_journey_intervals(
            [
                RankedJourneyInterval(interval, rank)
                for rank, interval in enumerate(results)
            ]
        )

        if len(results) >= max_num_tracks:
            break

    logger.info("[Journey] Querying track lifespan done")
    return results


@journey_router.post("/journey_from_track")
async def journey_from_track(
    journey_request: JourneyFromTrackRequest,
    mq_connection: aio_pika.abc.AbstractRobustConnection = Depends(get_mq_connection),
    iot_data_client: BotoIotDataClient = Depends(get_iot_data_client),
    app_user: auth_models.AppUser = Depends(auth.limited_user_role_guard),
    db: database.Database = Depends(get_backend_database),
    access: AccessRestrictions = Depends(auth.get_user_access_restrictions),
    value_store: ValueStore = Depends(get_value_store),
    aws_region: str = Depends(get_aws_region),
    secrets: BackendSecrets = Depends(get_backend_secrets),
) -> list[JourneyInterval]:
    """Process a journey request.

    It involves the following steps:
        1. find all objects with the same track id in the DB
        2. query the embedding of the object from the NVR
        3. query the journey of the object from the NVR
        4. return the video clip intervals
    """
    with Timer() as timer:
        async with db.tenant_session() as session:
            requested_camera = await get_camera_from_mac_address_or_fail(
                session, access, journey_request.camera_mac_address
            )
            mac_address = requested_camera.mac_address

            # Register the new request in DB
            journey_request_id = (
                await orm.JourneyRequest.add_request(
                    session,
                    mac_address,
                    journey_request.track_id,
                    journey_request.perception_stack_start_id,
                    journey_request.search_start_time,
                    journey_request.search_end_time,
                    journey_request.timestamp,
                )
            ).id

        async with db.tenant_session() as session, Timer() as object_timer:
            # TODO(jack): ingest MCT info in PCP table so that we can send only
            # one instead of many timestamps to NVR for embedding query.
            objects = await _query_objects_by_track_and_rank_by_time(
                session,
                journey_request.camera_mac_address,
                journey_request.track_id,
                journey_request.perception_stack_start_id,
                journey_request.timestamp,
            )

        # Get the embedding from nvr
        with Timer() as embedding_timer:
            nvr_uuid = requested_camera.nvr_uuid
            embedding_response = await _query_embedding_from_nvr(
                db=db,
                mq_connection=mq_connection,
                iot_data_client=iot_data_client,
                request_id=journey_request_id,
                mac_address=mac_address,
                nvr_uuid=nvr_uuid,
                objects=objects,
                use_iot_core=await is_iot_core_feature_enabled(
                    db, IOTCoreFeature.JOURNEY, app_user.tenant
                ),
            )
            if embedding_response is None:
                async with db.tenant_session() as session:
                    await orm.JourneyRequest.update_status(
                        session,
                        journey_request_id,
                        models.JourneyRequestStatus.NO_EMBEDDING,
                    )

                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=(
                        "Data is still being ingested. Generally it takes up to 1h "
                        "for data to be processed and available for Journey. Try again "
                        "later."
                    ),
                )

        async with db.tenant_session() as session:
            nvr = await get_nvr_from_uuid_or_fail(session, access, nvr_uuid)
            if nvr.location_id is None:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"{nvr_uuid=} location is not set",
                )
            nvr_to_mac_addresses = await get_nvr_to_mac_addresses_or_fail(
                session, access, nvr.location_id
            )

        search_start_time = journey_request.search_start_time
        search_end_time = journey_request.search_end_time

        with Timer() as journey_timer:
            mac_address_to_results = await _query_journey_from_nvrs(
                db=db,
                value_store=value_store,
                mq_connection=mq_connection,
                iot_data_client=iot_data_client,
                embedding_response=embedding_response,
                request_id=journey_request_id,
                nvr_to_mac_addresses=nvr_to_mac_addresses,
                search_start_time=search_start_time,
                search_end_time=search_end_time,
                use_iot_core=await is_iot_core_feature_enabled(
                    db, IOTCoreFeature.JOURNEY, app_user.tenant
                ),
            )

        # Rank mac address by the score of the top result
        ranked_mac_addresses = sorted(
            mac_address_to_results.keys(),
            key=lambda mac_address: mac_address_to_results[mac_address][0].score,
            reverse=True,
        )

        journey_intervals = []
        async with db.tenant_session() as session, Timer() as track_timer:
            for mac_address in ranked_mac_addresses:
                results = mac_address_to_results[mac_address]
                base_journey_intervals = await _query_track_lifespans(
                    session, results, max_num_tracks=JOURNEY_RESPONSE_TOP_K
                )
                camera_response = await get_camera_response_from_mac_address_or_fail(
                    session, access, mac_address
                )

                request_time = RequestTime.from_datetime(datetime.utcnow())
                for interval in base_journey_intervals:
                    signed_url = (
                        get_signed_url(
                            s3_path=interval.thumbnail_s3_path,
                            request_time=request_time,
                            aws_credentials=secrets.aws_credentials(),
                            aws_region=aws_region,
                        )
                        if interval.thumbnail_s3_path
                        else None
                    )
                    journey_intervals.append(
                        JourneyInterval(
                            start_time=interval.start_time,
                            end_time=interval.end_time,
                            mac_address=mac_address,
                            camera=camera_response,
                            thumbnail_s3_path=signed_url,
                        )
                    )

        async with db.tenant_session() as session:
            await orm.JourneyRequest.update_status(
                session, journey_request_id, models.JourneyRequestStatus.SUCCESS
            )

    logger.info(
        f"Journey request finished in {timer.duration():.2f}s. "
        f"(object querying duration: {object_timer.duration():.2f}s "
        f"embedding querying duration: {embedding_timer.duration():.2f}s "
        f"journey querying duration: {journey_timer.duration():.2f}s "
        f"track querying duration: {track_timer.duration():.2f}s.)"
    )
    return journey_intervals


@journey_router.post("/retrieve_tracks_thumbnail")
async def retrieve_tracks_thumbnail(
    tracks_thumbnail_request: TracksThumbnailRequest,
    _app_user: auth_models.AppUser = Depends(auth.limited_user_role_guard),
    db: database.Database = Depends(get_backend_database),
    access: AccessRestrictions = Depends(auth.get_user_access_restrictions),
    aws_region: str = Depends(get_aws_region),
    secrets: BackendSecrets = Depends(get_backend_secrets),
) -> list[TrackThumbnailResponse]:
    """Get the thumbnails of the tracks in the given time range."""
    async with db.tenant_session() as session:
        await check_camera_access(
            session, access, [tracks_thumbnail_request.mac_address]
        )

        track_identifiers = await orm.PerceptionObjectEvent.get_track_ids_in_interval(
            session,
            tracks_thumbnail_request.mac_address,
            tracks_thumbnail_request.start_time,
            tracks_thumbnail_request.end_time,
        )
        thumbnails = await orm.MctImage.get_tracks_thumbnail(
            session, set(track_identifiers)
        )

    # sign thumbnails
    request_time = RequestTime.from_datetime(datetime.utcnow())
    track_thumbnails = [
        TrackThumbnailResponse(
            thumbnail_data=thumbnail,
            signed_url=(
                get_signed_url(
                    s3_path=thumbnail.s3_path,
                    request_time=request_time,
                    aws_credentials=secrets.aws_credentials(),
                    aws_region=aws_region,
                )
            ),
        )
        for thumbnail in thumbnails
    ]
    return track_thumbnails
