import aio_pika
from fastapi import APIRouter, Depends, HTTPException

from backend.boto_utils import BotoIotDataClient, BotoSessionFn
from backend.constants import DEFAULT_LIVE_STREAM_RETENTION_DUR
from backend.database import database, orm
from backend.dependencies import (
    get_backend_database,
    get_boto_session_maker,
    get_iot_data_client,
    get_mq_connection,
    get_value_store,
)
from backend.fastapi_utils import WithResponseExcludeNone
from backend.iot_core.db_utils import IOTCoreFeature, is_iot_core_feature_enabled
from backend.kinesis_api.errors import KinesisError
from backend.kinesis_api.models import (
    KinesisVideoLiveConfig,
    KinesisVideoLiveRequest,
    StreamResponse,
)
from backend.kinesis_api.utils import (
    get_kinesis_live_url,
    put_msg_to_queue_for_live_requests,
)
from backend.kiosk.models import (
    KioskKeepWallAliveRequest,
    KioskNextWallRequest,
    KioskResponse,
    KioskWallResponse,
    KioskWallTile,
)
from backend.kiosk.public_router_utils import (
    get_camera_from_mac_addresses_and_kiosk_hash_or_fail,
    get_cameras_from_mac_addresses_and_kiosk_hash_or_fail,
    get_kiosk_by_hash_or_fail,
)
from backend.models import PublicCameraData
from backend.router_utils import get_org_stream_retention_or_fail
from backend.user_wall.models import WallTile
from backend.value_store.value_store import ValueStore

kiosk_public_router = WithResponseExcludeNone(
    APIRouter(
        prefix="/kiosk_public",
        tags=["kiosk_public"],
        generate_unique_id_function=lambda route: route.name,
    )
)


@kiosk_public_router.get("/{kiosk_hash}")
async def public_kiosk_retrieve(
    kiosk_hash: str, db: database.Database = Depends(get_backend_database)
) -> KioskResponse:
    """Retrieve all relevant information about a public kiosk."""
    async with db.session() as session:
        kiosk = await get_kiosk_by_hash_or_fail(session, kiosk_hash)
        return KioskResponse(kiosk=kiosk)


@kiosk_public_router.post("/{kiosk_hash}/next_wall")
async def public_kiosk_next_wall(
    kiosk_hash: str,
    request: KioskNextWallRequest,
    db: database.Database = Depends(get_backend_database),
    iot_data_client: BotoIotDataClient = Depends(get_iot_data_client),
    mq_connection: aio_pika.abc.AbstractRobustConnection = Depends(get_mq_connection),
) -> KioskWallResponse:
    """Retrieve the next wall to display for a public kiosk."""
    async with db.session() as session:
        kiosk = await get_kiosk_by_hash_or_fail(session, kiosk_hash)

        wall_ids = [wall.id for wall in kiosk.walls]
        if not wall_ids:
            raise HTTPException(status_code=400, detail="No walls found")

        if request.current_wall_id is None:
            next_wall_idx = 0
        elif request.current_wall_id not in wall_ids:
            # It's possible that the current wall was deleted if someone edited
            # the kiosk, so we just return the first wall in that case.
            next_wall_idx = 0
        else:
            current_wall_idx = wall_ids.index(request.current_wall_id)
            next_wall_idx = (current_wall_idx + 1) % len(wall_ids)

        tiles = await orm.WallTile.system_get_wall_tiles(
            session, wall_ids[next_wall_idx]
        )
        tiles_mac_addresses = [
            tile.camera_mac_address
            for tile in tiles
            if tile.camera_mac_address is not None
        ]

    async with db.session() as session:
        # First, get the cameras associated to the wall tiles, ignoring
        # permission restrictions.
        cameras = await orm.Camera.system_get_cameras_from_mac_addresses(
            session, mac_addresses=set(tiles_mac_addresses)
        )
        if len(cameras) != len(tiles_mac_addresses):
            raise HTTPException(status_code=400, detail="Some cameras were not found")

        # Build a map from mac address to camera response.
        mac_to_camera_response = {
            camera.camera.mac_address: camera for camera in cameras
        }
        retention_period = await get_org_stream_retention_or_fail(session, kiosk.tenant)

        response = KioskWallResponse(
            wall=kiosk.walls[next_wall_idx],
            wall_tiles=[
                KioskWallTile(
                    wall_tile=WallTile(**tile.dict()),
                    camera_data=(
                        PublicCameraData.from_camera_response(
                            mac_to_camera_response[tile.camera_mac_address]
                        )
                        if tile.camera_mac_address is not None
                        else None
                    ),
                )
                for tile in tiles
            ],
        )

    cameras_and_configs = []
    for camera in cameras:
        cameras_and_configs.append(
            (
                camera.camera,
                KinesisVideoLiveConfig(
                    stream_hash=camera.camera.source,
                    resolution_config=request.resolution_config,
                    use_webrtc=camera.camera.is_webrtc_enabled
                    and request.prefer_webrtc,
                    retention_period=(
                        retention_period
                        if camera.camera.is_always_streaming
                        else DEFAULT_LIVE_STREAM_RETENTION_DUR
                    ),
                ),
            )
        )

    # Request live streaming for the cameras.
    await put_msg_to_queue_for_live_requests(
        cameras_and_configs=cameras_and_configs,
        mq_connection=mq_connection,
        iot_data_client=iot_data_client,
        use_iot_core=await is_iot_core_feature_enabled(
            db, IOTCoreFeature.VIDEO, kiosk.tenant
        ),
    )

    return response


@kiosk_public_router.post("/{kiosk_hash}/live_data_kiosk")
async def retrieve_kinesis_live_data_kiosk(
    kiosk_hash: str,
    kinesis_request: KinesisVideoLiveRequest,
    boto_session_maker: BotoSessionFn = Depends(get_boto_session_maker),
    iot_data_client: BotoIotDataClient = Depends(get_iot_data_client),
    mq_connection: aio_pika.abc.AbstractRobustConnection = Depends(get_mq_connection),
    db: database.Database = Depends(get_backend_database),
    value_store: ValueStore = Depends(get_value_store),
) -> StreamResponse:
    """Get a live kinesis url for a kiosk video."""
    async with db.session() as session:
        kiosk = await get_kiosk_by_hash_or_fail(session, kiosk_hash)
        camera = await get_camera_from_mac_addresses_and_kiosk_hash_or_fail(
            session=session,
            kiosk_hash=kiosk_hash,
            mac_address=kinesis_request.mac_address,
        )

        retention_period = (
            await get_org_stream_retention_or_fail(session, kiosk.tenant)
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
                db, IOTCoreFeature.VIDEO, kiosk.tenant
            ),
        )

    except KinesisError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e


@kiosk_public_router.post("/{kiosk_hash}/keep_wall_alive")
async def keep_wall_alive(
    kiosk_hash: str,
    keep_alive_request: KioskKeepWallAliveRequest,
    iot_data_client: BotoIotDataClient = Depends(get_iot_data_client),
    mq_connection: aio_pika.abc.AbstractRobustConnection = Depends(get_mq_connection),
    db: database.Database = Depends(get_backend_database),
) -> None:
    """Keep the received stream alive by sending
    a keep alive request for HLS streams to the edge.
    """
    async with db.session() as session:
        kiosk = await get_kiosk_by_hash_or_fail(session, kiosk_hash)
        cameras = await get_cameras_from_mac_addresses_and_kiosk_hash_or_fail(
            session=session,
            kiosk_hash=kiosk_hash,
            mac_addresses=set(keep_alive_request.mac_addresses),
        )
        retention_period = await get_org_stream_retention_or_fail(session, kiosk.tenant)

    cameras_and_configs = []
    for camera in cameras:
        cameras_and_configs.append(
            (
                camera,
                KinesisVideoLiveConfig(
                    stream_hash=camera.source,
                    resolution_config=keep_alive_request.resolution_config,
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
            db, IOTCoreFeature.VIDEO, kiosk.tenant
        ),
    )
