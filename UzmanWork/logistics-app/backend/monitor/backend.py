from datetime import timedelta

import aiohttp

from backend.constants import BACKEND_ONLINE_TIMEOUT
from backend.database.models import BackendState
from backend.utils import AwareDatetime
from backend.value_store.value_store import ValueStore

HEALTH_ENDPOINT = "monitor/backend_health"
BACKEND_REDIS_KEY = "backend"


async def check_backend_up(domain: str, backend_exposed_port: int) -> bool:
    async with aiohttp.ClientSession() as session:
        # TODO (oliverscheel): localhost does not work when developing
        # locally (you'd need the correct container name, which we don't
        # provide atm) -> just skip this check for now.
        if domain == "http://localhost":
            return True

        async with session.get(
            f"{domain}:{backend_exposed_port}/{HEALTH_ENDPOINT}"
        ) as response:
            return response.status == 200


async def update_backend_last_seen(
    value_store: ValueStore, last_seen_time: AwareDatetime
) -> None:
    await value_store.set_model(
        key=BACKEND_REDIS_KEY,
        model=BackendState(last_seen_time=last_seen_time),
        expiration=timedelta(hours=24),
    )


async def check_backend_online(value_store: ValueStore) -> bool:
    backend = await value_store.get_model(
        key=BACKEND_REDIS_KEY, model_class=BackendState
    )

    if not backend:
        return False

    backend_online: bool = (
        AwareDatetime.utcnow() - backend.last_seen_time < BACKEND_ONLINE_TIMEOUT
    )
    return backend_online
