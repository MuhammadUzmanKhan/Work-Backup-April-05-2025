import datetime
from dataclasses import dataclass
from typing import Any, List

import pytest
import pytest_asyncio
from pytest_alembic.config import Config
from sqlalchemy.ext.asyncio import AsyncEngine, create_async_engine

from backend.database import database, orm
from backend.database.models import Camera, DetectionObjectType, PerceptionObjectCreate
from backend.database.organization_models import Organization
from backend.perception.models import PerceptionEvent
from backend.utils import AwareDatetime

# A start time used for many events.
DEFAULT_START_TIME: AwareDatetime = AwareDatetime(
    2022, 11, 20, 12, 00, tzinfo=datetime.timezone.utc
)


@dataclass
class DetectionParams:
    object_type: DetectionObjectType
    x_min: float = 0
    y_min: float = 0
    x_max: float = 0
    y_max: float = 0
    confidence: float = 0
    is_moving: bool = False
    track_id: int = 0


@pytest.fixture
def alembic_config() -> Config:
    """Override this fixture to configure the exact alembic context setup required."""
    return Config(config_options=dict(config_file_name="backend/alembic.ini"))


@pytest.fixture
def alembic_engine(postgresql: Any) -> AsyncEngine:
    """Override this fixture to provide pytest-alembic powered tests with a
    database handle."""
    engine = create_async_engine(
        f"postgresql+asyncpg://{postgresql.info.user}:{postgresql.info.password}"
        f"@{postgresql.info.host}:{postgresql.info.port}/{postgresql.info.dbname}"
    )
    return engine


@pytest_asyncio.fixture
async def detection_events(
    db_instance: database.Database,
    time: AwareDatetime,
    camera: Camera,
    organization: Organization,
    detection_params: List[DetectionParams],
) -> None:
    async with db_instance.tenant_session(tenant=organization.tenant) as session:
        for detection_param in detection_params:
            perception_event = PerceptionEvent(
                mac_address=camera.mac_address,
                time=time,
                objects=[
                    PerceptionObjectCreate(
                        object_type=detection_param.object_type,
                        x_min=detection_param.x_min,
                        y_min=detection_param.y_min,
                        x_max=detection_param.x_max,
                        y_max=detection_param.y_max,
                        confidence=detection_param.confidence,
                        is_moving=detection_param.is_moving,
                        track_id=detection_param.track_id,
                        track_age_s=0,
                        object_idx=1,
                        idx_in_frame=None,
                    )
                ],
            )

            await orm.PerceptionObjectEvent.add_event_batch(session, [perception_event])
