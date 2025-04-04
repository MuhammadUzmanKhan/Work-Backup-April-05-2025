import faulthandler
import logging.config
import os
import signal

from fastapi import APIRouter, FastAPI

from backend import logging_config
from backend.dependencies import (
    get_auth_api,
    get_backend_database,
    get_backend_envs,
    get_mq_connection,
    init_app,
    initialize_dependencies,
    wait_for_migrations,
)
from backend.escapi.escapi_router import escapi_router_edge
from backend.face.router_edge import face_router_edge
from backend.kinesis_api.router_edge import kinesis_router_edge
from backend.license_plate.router_edge import license_plate_router_edge
from backend.middleware import InstrumentationMiddleware, ResetEdgeUserMiddleware
from backend.monitor.router_edge import monitor_router_edge
from backend.multi_cam_tracking.router_edge import mct_images_router_edge
from backend.perception.router_edge import perception_router_edge
from backend.sentry_instrumentation.utils import init_sentry
from backend.stream_discovery.router import stream_discovery_router_edge
from backend.text_search.router_edge import text_search_router_edge
from backend.thumbnail.router_edge import thumbnail_router_edge

logger = logging.getLogger(logging_config.LOGGER_NAME)
faulthandler.register(signal.SIGUSR2, all_threads=True)

app = FastAPI()


client_router = APIRouter(generate_unique_id_function=lambda route: route.name)


class StartupException(Exception):
    pass


@app.on_event("startup")
async def startup_event() -> None:
    await initialize_dependencies()
    init_app(app)
    database = get_backend_database()
    await wait_for_migrations(database)


@app.on_event("shutdown")
async def shutdown_event() -> None:
    await get_mq_connection().close()
    await get_auth_api().auth0_client.close()


app.include_router(face_router_edge)
app.include_router(kinesis_router_edge)
app.include_router(license_plate_router_edge)
app.include_router(monitor_router_edge)
app.include_router(mct_images_router_edge)
app.include_router(perception_router_edge)
app.include_router(text_search_router_edge)
app.include_router(thumbnail_router_edge)
app.include_router(stream_discovery_router_edge)
app.include_router(escapi_router_edge)


if os.environ.get("INITIALISE_MIDDLEWARE"):
    init_sentry(app)
    app.add_middleware(ResetEdgeUserMiddleware)
    logger.info("Enabling Reset Edge User Middleware")

    envs = get_backend_envs()
    if not envs.disable_instrumentation_middleware:
        app.add_middleware(InstrumentationMiddleware)
        logger.info("Registered Instrumentation Middleware")
