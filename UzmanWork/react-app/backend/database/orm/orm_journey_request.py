from __future__ import annotations

import sqlalchemy as sa
from sqlalchemy import orm

from backend.database import models
from backend.database.orm.orm_utils import TenantProtectedTable
from backend.database.session import TenantAwareAsyncSession
from backend.utils import AwareDatetime


class JourneyRequest(TenantProtectedTable):
    __tablename__ = "journey_requests"
    # ID of the request
    id: orm.Mapped[int] = sa.Column(sa.Integer, primary_key=True, autoincrement=True)
    # Mac address for the requested camera
    mac_address = sa.Column(sa.String, nullable=False)
    # Info of the track to search
    track_id = sa.Column(sa.Integer, nullable=False)
    perception_stack_start_id = sa.Column(sa.String, nullable=False)
    # Start/end time of the search interval
    search_start_time = sa.Column(sa.TIMESTAMP(timezone=True), nullable=False)
    search_end_time = sa.Column(sa.TIMESTAMP(timezone=True), nullable=False)
    # The time to specify the object to search
    object_time = sa.Column(sa.TIMESTAMP(timezone=True), nullable=False)
    # The time when the request is received
    request_time = sa.Column(sa.TIMESTAMP(timezone=True), nullable=False)
    # Request status
    request_status = sa.Column(sa.Enum(models.JourneyRequestStatus), nullable=False)

    __table_args__ = ((sa.ForeignKeyConstraint(["tenant"], ["organizations.tenant"])),)

    @staticmethod
    async def add_request(
        session: TenantAwareAsyncSession,
        mac_address: str,
        track_id: int,
        perception_stack_start_id: str,
        search_start_time: AwareDatetime,
        search_end_time: AwareDatetime,
        object_time: AwareDatetime,
    ) -> JourneyRequest:
        """Add a journey request to the database and return the id of the request."""
        journey_request = JourneyRequest(
            mac_address=mac_address,
            track_id=track_id,
            perception_stack_start_id=perception_stack_start_id,
            search_start_time=search_start_time,
            search_end_time=search_end_time,
            object_time=object_time,
            request_time=AwareDatetime.utcnow(),
            request_status=models.JourneyRequestStatus.PENDING,
            tenant=session.tenant,
        )
        session.add(journey_request)
        await session.flush()
        return journey_request

    @staticmethod
    async def update_status(
        session: TenantAwareAsyncSession,
        request_id: int,
        request_status: models.JourneyRequestStatus,
    ) -> None:
        """Update the status of a journey request."""
        stmt = (
            sa.update(JourneyRequest)
            .where(JourneyRequest.id == request_id)
            .values(request_status=request_status)
        )
        await session.execute(stmt)
