from __future__ import annotations

import sqlalchemy as sa
from sqlalchemy import orm

from backend.database.orm.orm_utils import TenantProtectedTable
from backend.database.session import TenantAwareAsyncSession
from backend.utils import AwareDatetime


class TextSearchRequest(TenantProtectedTable):
    __tablename__ = "text_search_requests"
    # ID of the request
    id: orm.Mapped[int] = sa.Column(
        sa.Integer, primary_key=True, index=True, autoincrement=True
    )
    # MAC addresses of the cameras to be searched
    mac_addresses = sa.Column(sa.ARRAY(sa.String), nullable=False)
    # text query
    text_query = sa.Column(sa.String, nullable=False)
    # Start time of the search
    start_time = sa.Column(sa.TIMESTAMP(timezone=True), nullable=False)
    # End time of the search
    end_time = sa.Column(sa.TIMESTAMP(timezone=True), nullable=False)
    # Email of the user who requested the search
    email = sa.Column(sa.String, nullable=False)
    # Time the request was made
    query_time = sa.Column(sa.TIMESTAMP(timezone=True), nullable=False)

    __table_args__ = ((sa.ForeignKeyConstraint(["tenant"], ["organizations.tenant"])),)

    @staticmethod
    async def new_request(
        session: TenantAwareAsyncSession,
        mac_addresses: list[str],
        text_query: str,
        start_time: AwareDatetime,
        end_time: AwareDatetime,
        email: str,
        query_time: AwareDatetime,
    ) -> TextSearchRequest:
        text_search = TextSearchRequest(
            # mypy not happy here cause ORM mapped "ARRAY(STRING)" to List[_TE]
            mac_addresses=mac_addresses,  # type: ignore
            tenant=session.tenant,
            text_query=text_query,
            start_time=start_time,
            end_time=end_time,
            email=email,
            query_time=query_time,
        )
        session.add(text_search)
        await session.flush()
        return text_search
