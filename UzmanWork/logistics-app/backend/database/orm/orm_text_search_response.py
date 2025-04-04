from __future__ import annotations

import sqlalchemy as sa
from sqlalchemy import orm

from backend.database import models
from backend.database.orm.orm_utils import TenantProtectedTable, bulk_insert
from backend.database.session import TenantAwareAsyncSession
from backend.models import TextSearchResponseMessageBase


class TextSearchResponse(TenantProtectedTable):
    __tablename__ = "text_search_response"
    # ID of the response
    id: orm.Mapped[int] = sa.Column(sa.Integer, primary_key=True, autoincrement=True)
    # ID for the text search request as a foreign key
    request_id = sa.Column(
        sa.Integer, sa.ForeignKey("text_search_requests.id"), index=True, nullable=False
    )
    # nvr uuid
    nvr_uuid = sa.Column(sa.String, nullable=False)
    # search response
    ranked_timestamp = sa.Column(sa.TIMESTAMP(timezone=True), nullable=False)
    # scores
    score = sa.Column(sa.Float, nullable=False)
    # mac addresses
    mac_address = sa.Column(sa.String, nullable=False)
    # object id in each frame
    ranked_object_id = sa.Column(sa.Integer, nullable=False)

    __table_args__ = ((sa.ForeignKeyConstraint(["tenant"], ["organizations.tenant"])),)

    @staticmethod
    async def add_response_batch(
        session: TenantAwareAsyncSession,
        response_create: models.TextSearchResponseCreate,
    ) -> None:
        await bulk_insert(
            session,
            TextSearchResponse,
            [
                dict(
                    request_id=response_create.request_id,
                    nvr_uuid=response_create.nvr_uuid,
                    ranked_timestamp=response_create.ranked_timestamps[i],
                    score=response_create.scores[i],
                    mac_address=response_create.mac_addresses[i],
                    ranked_object_id=response_create.ranked_object_ids[i],
                    tenant=session.tenant,
                )
                for i in range(len(response_create.ranked_timestamps))
            ],
        )

    @staticmethod
    async def get_text_search_response(
        session: TenantAwareAsyncSession, request_id: int
    ) -> list[TextSearchResponseMessageBase]:
        query = sa.select(TextSearchResponse).where(
            TextSearchResponse.request_id == request_id
        )
        results_across_nvrs = await session.execute(query)

        responses = []
        for result in results_across_nvrs.scalars().all():
            responses.append(
                TextSearchResponseMessageBase(
                    timestamp=result.ranked_timestamp,
                    score=result.score,
                    mac_address=result.mac_address,
                    object_id=result.ranked_object_id,
                )
            )

        # Sort the responses across all nvrs by score
        responses.sort(key=lambda x: x.score, reverse=True)

        return responses
