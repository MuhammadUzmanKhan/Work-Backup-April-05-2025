from fastapi.encoders import jsonable_encoder
from httpx import AsyncClient, Response

from backend.kinesis_api.models import KinesisVideoLiveRequest
from backend.kiosk.models import (
    CreateKioskRequest,
    KioskKeepWallAliveRequest,
    KioskNextWallRequest,
    RenameKioskRequest,
    ShareKioskRequest,
    UpdateKioskStatusRequest,
    UpdateWallsForKioskRequest,
)


async def send_create_request(
    client: AsyncClient, request: CreateKioskRequest
) -> Response:
    return await client.post("/create", json=jsonable_encoder(request))


async def send_delete_request(client: AsyncClient, kiosk_id: int) -> Response:
    return await client.delete(f"/delete/{kiosk_id}")


async def send_update_walls_request(
    client: AsyncClient, request: UpdateWallsForKioskRequest
) -> Response:
    return await client.post("/update_walls", json=jsonable_encoder(request))


async def send_list_request(client: AsyncClient) -> Response:
    return await client.get("/")


async def send_rename_request(
    client: AsyncClient, request: RenameKioskRequest
) -> Response:
    return await client.post("/rename", json=jsonable_encoder(request))


async def send_update_status_request(
    client: AsyncClient, request: UpdateKioskStatusRequest
) -> Response:
    return await client.post("/update_status", json=jsonable_encoder(request))


async def send_regenerate_request(client: AsyncClient, kiosk_id: int) -> Response:
    return await client.post(f"/regenerate/{kiosk_id}")


async def send_share_request(
    client: AsyncClient, request: ShareKioskRequest
) -> Response:
    return await client.post("/share", json=jsonable_encoder(request))


async def send_public_retrieve_request(
    client: AsyncClient, kiosk_hash: str
) -> Response:
    return await client.get(f"/{kiosk_hash}")


async def send_public_kiosk_next_wall(
    client: AsyncClient, kiosk_hash: str, request: KioskNextWallRequest
) -> Response:
    return await client.post(f"/{kiosk_hash}/next_wall", json=jsonable_encoder(request))


async def send_kinesis_live_data_kiosk(
    client: AsyncClient, kiosk_hash: str, kinesis_request: KinesisVideoLiveRequest
) -> Response:
    return await client.post(
        f"/{kiosk_hash}/live_data_kiosk", json=jsonable_encoder(kinesis_request)
    )


async def send_keep_alive(
    client: AsyncClient, kiosk_hash: str, request: KioskKeepWallAliveRequest
) -> Response:
    return await client.post(
        f"/{kiosk_hash}/keep_wall_alive", json=jsonable_encoder(request)
    )
