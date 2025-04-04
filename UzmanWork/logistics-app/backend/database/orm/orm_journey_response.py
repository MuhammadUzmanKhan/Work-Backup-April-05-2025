from __future__ import annotations

import sqlalchemy as sa
from sqlalchemy import orm

from backend.database import models
from backend.database.orm.orm_utils import TenantProtectedTable, bulk_insert
from backend.database.session import TenantAwareAsyncSession
from backend.models import JourneyResponseMessageBase


class JourneyResponse(TenantProtectedTable):
    __tablename__ = "journey_responses"
    # ID of the response
    id: orm.Mapped[int] = sa.Column(sa.Integer, primary_key=True, autoincrement=True)
    # ID for the Journey search request as a foreign key
    request_id = sa.Column(
        sa.Integer, sa.ForeignKey("journey_requests.id"), index=True, nullable=False
    )
    # nvr uuid
    nvr_uuid = sa.Column(sa.String, nullable=False)
    # mac address
    mac_address = sa.Column(sa.String, nullable=False)
    # timestamp of the object
    timestamp = sa.Column(sa.TIMESTAMP(timezone=True), nullable=False)
    # object_id of the object
    object_idx = sa.Column(sa.Integer, nullable=False)
    # matching score
    score = sa.Column(sa.Float, nullable=False)

    __table_args__ = ((sa.ForeignKeyConstraint(["tenant"], ["organizations.tenant"])),)

    @staticmethod
    async def add_response_batch(
        session: TenantAwareAsyncSession, response_create: models.JourneyResponseCreate
    ) -> None:
        """Add a batch of responses to the database."""
        await bulk_insert(
            session,
            JourneyResponse,
            [
                dict(
                    request_id=response_create.request_id,
                    nvr_uuid=response_create.nvr_uuid,
                    mac_address=response_create.camera_results[i].mac_address,
                    timestamp=response_create.camera_results[i].timestamp,
                    object_idx=response_create.camera_results[i].object_index,
                    score=response_create.camera_results[i].score,
                    tenant=session.tenant,
                )
                for i in range(len(response_create.camera_results))
            ],
        )

    @staticmethod
    async def query_response(
        session: TenantAwareAsyncSession, request_id: int, min_score: float
    ) -> list[JourneyResponseMessageBase]:
        """Get the journey response for a request

        :param session: database session
        :param request_id: ID of the request
        :param min_score: minimum score to filter the results
        :return: list of journey response
        """
        query = sa.select(JourneyResponse).where(
            JourneyResponse.request_id == request_id, JourneyResponse.score >= min_score
        )

        responses = await session.execute(query)

        results = []
        for response in responses.scalars().all():
            results.append(
                JourneyResponseMessageBase(
                    timestamp=response.timestamp,
                    mac_address=response.mac_address,
                    object_idx=response.object_idx,
                    score=response.score,
                )
            )
        return results
