from typing import AsyncGenerator

import pytest
import pytest_asyncio
from fastapi import FastAPI
from httpx import AsyncClient
from pytest_mock import MockerFixture

from backend.database.models import NVR, Camera, CameraGroup
from backend.license_plate.models import (
    Box,
    PlateDetectionResult,
    PlateRecognizerResponse,
    RegisterLicensePlateRequest,
    Vehicle,
)
from backend.license_plate.router import license_plate_router
from backend.license_plate.router_edge import license_plate_router_edge
from backend.test.factory_types import CameraFactory, RandomStringFactory
from backend.test.license_plate.factory_types import (
    LicensePlateDetectionResultFactory,
    RegisterLicensePlateRequestFactory,
)
from backend.utils import AwareDatetime


@pytest_asyncio.fixture()
async def license_plate_client(
    app: FastAPI,
    mocker: MockerFixture,
    license_plate_detection_result: PlateDetectionResult,
) -> AsyncGenerator[AsyncClient, None]:
    app.include_router(license_plate_router)
    app.include_router(license_plate_router_edge)

    mocker.patch(
        "backend.license_plate.router.get_signed_url",
        return_value="https://examplebucket.s3.amazonaws.com/test.txt",
    )
    mocker.patch(
        "backend.license_plate.router_edge.recognise_license_plate",
        return_value=PlateRecognizerResponse(results=[license_plate_detection_result]),
    )

    async with AsyncClient(
        app=app, base_url="http://localhost/license_plate"
    ) as client:
        yield client


@pytest.fixture()
def create_license_plate_detection_result(
    create_license_plate_number: RandomStringFactory,
) -> LicensePlateDetectionResultFactory:
    def create_license_plate_detection_result_inner(
        license_plate: str | None = None,
        score: float = 0.9,
        dscore: float = 0.9,
        vscore: float = 0.9,
    ) -> PlateDetectionResult:
        return PlateDetectionResult(
            plate=license_plate if license_plate else create_license_plate_number(),
            score=score,
            dscore=dscore,
            box=Box(xmin=0, ymin=0, xmax=1, ymax=1),
            vehicle=Vehicle(
                type="car", score=vscore, box=Box(xmin=0, ymin=0, xmax=1, ymax=1)
            ),
        )

    return create_license_plate_detection_result_inner


@pytest.fixture()
def license_plate_detection_result(
    create_license_plate_detection_result: LicensePlateDetectionResultFactory,
) -> PlateDetectionResult:
    return create_license_plate_detection_result()


@pytest.fixture()
def create_register_license_plate_request(
    create_s3_url: RandomStringFactory,
) -> RegisterLicensePlateRequestFactory:
    def create_register_license_plate_request_inner(
        object_id: int,
        track_id: int,
        perception_stack_start_id: str,
        mac_address: str,
        time: AwareDatetime | None = None,
        image_s3_path: str | None = None,
    ) -> RegisterLicensePlateRequest:
        return RegisterLicensePlateRequest(
            object_id=object_id,
            track_id=track_id,
            perception_stack_start_id=perception_stack_start_id,
            mac_address=mac_address,
            timestamp=time if time else AwareDatetime.utcnow(),
            image_s3_path=image_s3_path if image_s3_path else create_s3_url(),
        )

    return create_register_license_plate_request_inner


@pytest_asyncio.fixture()
async def register_license_plate_request(
    nvr: NVR,
    camera_group: CameraGroup,
    create_camera: CameraFactory,
    create_register_license_plate_request: RegisterLicensePlateRequestFactory,
) -> RegisterLicensePlateRequest:
    # Enable license plate recognition for this camera.
    camera: Camera = await create_camera(
        camera_group_id=camera_group.id,
        nvr_uuid=nvr.uuid,
        is_license_plate_detection_enabled=True,
    )
    return create_register_license_plate_request(
        object_id=0,
        track_id=0,
        perception_stack_start_id="unknown",
        mac_address=camera.mac_address,
    )
