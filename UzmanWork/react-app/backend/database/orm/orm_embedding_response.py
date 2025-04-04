from __future__ import annotations

import sqlalchemy as sa
from sqlalchemy import orm

from backend.database import models
from backend.database.orm.orm_utils import TenantProtectedTable
from backend.database.session import TenantAwareAsyncSession


class EmbeddingResponse(TenantProtectedTable):
    __tablename__ = "embedding_responses"
    # ID of the response
    id: orm.Mapped[int] = sa.Column(sa.Integer, primary_key=True, autoincrement=True)
    # ID for the embedding request as a foreign key
    request_id = sa.Column(
        sa.Integer, sa.ForeignKey("journey_requests.id"), index=True, nullable=False
    )
    # The embedding
    embedding = sa.Column(sa.ARRAY(sa.Float), nullable=True)
    # The version of the clip model used to generate the embedding
    clip_version = sa.Column(sa.String, nullable=True)

    __table_args__ = ((sa.ForeignKeyConstraint(["tenant"], ["organizations.tenant"])),)

    @staticmethod
    async def add_response(
        session: TenantAwareAsyncSession,
        response_create: models.EmbeddingResponseCreate,
    ) -> EmbeddingResponse:
        response = EmbeddingResponse(
            request_id=response_create.request_id,
            embedding=response_create.embedding,  # type: ignore
            clip_version=response_create.clip_version,
            tenant=session.tenant,
        )
        session.add(response)
        await session.flush()
        return response

    @staticmethod
    async def query_response(
        session: TenantAwareAsyncSession, request_id: int
    ) -> models.EmbeddingResponse | None:
        result = (
            await session.execute(
                sa.select(EmbeddingResponse).where(
                    EmbeddingResponse.request_id == request_id
                )
            )
        ).scalar_one_or_none()
        if result is None:
            return None
        return models.EmbeddingResponse.from_orm(result)
