from typing import AsyncGenerator
from unittest.mock import MagicMock

import pytest
import pytest_asyncio
from fastapi import FastAPI
from httpx import AsyncClient
from pytest_mock import MockerFixture

from backend.database.face_models import FaceOccurrenceCreate
from backend.database.models import Camera
from backend.face.models import (
    FaceEmbeddingData,
    RegisterFacesRequest,
    TrackEmbeddingData,
    UniqueFaceEdgeData,
)
from backend.face.router import face_router
from backend.face.router_edge import face_router_edge
from backend.face_alert.router import face_alert_router
from backend.s3_utils import S3Path
from backend.test.face.face_factory_types import RegisterFacesRequestFactory
from backend.test.factory_types import RandomStringFactory
from backend.utils import AwareDatetime


# NOTE(@lberg): this is a mock of a task we send to celery
# it would be better to have a pytest extension here
@pytest.fixture()
def patched_unique_face_notification_task(mocker: MockerFixture) -> MagicMock:
    call_mock = MagicMock()
    base_mock = MagicMock()
    base_mock.delay = call_mock
    mocker.patch("backend.face.utils.on_nvrs_unique_face_notification_task", base_mock)
    return call_mock


@pytest_asyncio.fixture()
async def face_edge_client(
    app: FastAPI, patched_unique_face_notification_task: MagicMock
) -> AsyncGenerator[AsyncClient, None]:
    app.include_router(face_router_edge)
    async with AsyncClient(app=app, base_url="http://localhost/face_edge") as client:
        yield client


@pytest_asyncio.fixture()
async def face_client(app: FastAPI) -> AsyncGenerator[AsyncClient, None]:
    app.include_router(face_router)
    async with AsyncClient(app=app, base_url="http://localhost/face") as client:
        yield client


@pytest_asyncio.fixture()
async def face_alert_client(app: FastAPI) -> AsyncGenerator[AsyncClient, None]:
    app.include_router(face_alert_router)
    async with AsyncClient(app=app, base_url="http://localhost/face_alert") as client:
        yield client


@pytest.fixture()
def create_register_face_request(
    create_unique_face_id: RandomStringFactory, create_s3_url: RandomStringFactory
) -> RegisterFacesRequestFactory:
    def create_register_face_request_inner(
        mac_address: str,
        unique_face_id: str | None = None,
        s3_url: str | None = None,
        occurrence_time: AwareDatetime | None = None,
        with_track_embedding_data: bool = False,
    ) -> RegisterFacesRequest:
        unique_face_id = unique_face_id if unique_face_id else create_unique_face_id()
        s3_url = s3_url if s3_url else create_s3_url()
        occurrence_time = occurrence_time if occurrence_time else AwareDatetime.utcnow()
        return RegisterFacesRequest(
            new_unique_faces=[
                UniqueFaceEdgeData(
                    unique_face_id=unique_face_id,
                    s3_path=S3Path(s3_url),
                    track_embedding_data=(
                        None
                        if not with_track_embedding_data
                        else TrackEmbeddingData(
                            track_embeddings=[
                                FaceEmbeddingData(
                                    embedding=[0.0],
                                    face_quality_score=0.5,
                                    face_quality_score_version=0,
                                    occurrence_time=occurrence_time,
                                )
                            ]
                        )
                    ),
                )
            ],
            new_face_occurrences=[
                FaceOccurrenceCreate(
                    nvr_unique_face_id=unique_face_id,
                    camera_mac_address=mac_address,
                    occurrence_time=occurrence_time,
                )
            ],
        )

    return create_register_face_request_inner


@pytest.fixture
def register_face_request(
    create_register_face_request: RegisterFacesRequestFactory, camera: Camera
) -> RegisterFacesRequest:
    return create_register_face_request(camera.mac_address)


@pytest.fixture()
def patched_face_alert_sender(mocker: MockerFixture) -> MagicMock:
    return mocker.patch("backend.face.utils.send_face_alerts")
