from __future__ import annotations

import sqlalchemy as sa
from sqlalchemy.ext.asyncio import AsyncSession

from backend.database.models import TextSearchNVRsFeedback
from backend.database.orm.orm_utils import TenantProtectedTable
from backend.database.session import TenantAwareAsyncSession


class TextSearchResponseStatus(TenantProtectedTable):
    __tablename__ = "text_search_response_status"
    # ID for the text search request as a foreign key
    request_id = sa.Column(
        sa.Integer,
        sa.ForeignKey("text_search_requests.id"),
        primary_key=True,
        index=True,
        nullable=False,
    )
    # nvr uuid
    nvr_uuid = sa.Column(sa.String, primary_key=True, nullable=False)

    __table_args__ = ((sa.ForeignKeyConstraint(["tenant"], ["organizations.tenant"])),)

    @staticmethod
    async def register_response(
        session: TenantAwareAsyncSession, request_id: int, nvr_uuid: str
    ) -> None:
        response_status = TextSearchResponseStatus(
            request_id=request_id, nvr_uuid=nvr_uuid, tenant=session.tenant
        )
        session.add(response_status)

    @staticmethod
    async def have_responses_returned(
        session: AsyncSession, request_id: int, expected_nvrs: set[str]
    ) -> TextSearchNVRsFeedback:
        """Check if all responses have been returned for a given request."""

        responded_nvr_uuids = (
            (
                await session.execute(
                    sa.select(TextSearchResponseStatus.nvr_uuid).where(
                        TextSearchResponseStatus.request_id == request_id
                    )
                )
            )
            .scalars()
            .all()
        )
        return TextSearchNVRsFeedback(
            expected_nvr_uuids=expected_nvrs,
            responded_nvr_uuids=set(responded_nvr_uuids),
        )
