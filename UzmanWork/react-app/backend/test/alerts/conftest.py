from unittest.mock import AsyncMock

import pytest
from pydantic import EmailStr

from backend.alert.alert_models import FaceAlertOccurrence, FaceAlertsSendRequest
from backend.database.models import NVR, Camera
from backend.database.organization_models import Organization
from backend.test.factory_types import (
    FaceAlertProfileFactory,
    FaceOccurrenceFactory,
    NVRUniqueFaceFactory,
    RandomStringFactory,
)


@pytest.fixture()
def mq_connection() -> AsyncMock:
    return AsyncMock()


@pytest.fixture()
async def face_alerts_request(
    organization: Organization,
    nvr: NVR,
    camera: Camera,
    create_nvr_unique_face: NVRUniqueFaceFactory,
    create_face_alert_profile: FaceAlertProfileFactory,
    create_email: RandomStringFactory,
    create_face_occurrence: FaceOccurrenceFactory,
) -> FaceAlertsSendRequest:
    request = FaceAlertsSendRequest(alert_occurrences=[], tenant=organization.tenant)
    for _ in range(3):
        unique_face = await create_nvr_unique_face(nvr.uuid)
        face_occurrence = await create_face_occurrence(
            nvr_uuid=nvr.uuid,
            mac_address=camera.mac_address,
            unique_face_id=unique_face.nvr_unique_face_id,
        )
        alert_profile = await create_face_alert_profile(
            organization.tenant,
            EmailStr(create_email()),
            org_unique_face_id=unique_face.org_unique_face_id,
        )
        request.alert_occurrences.append(
            FaceAlertOccurrence(
                alert_profile=alert_profile,
                detection=face_occurrence,
                location_name=None,
                group_name="group",
                camera_name=camera.name,
            )
        )
    return request
