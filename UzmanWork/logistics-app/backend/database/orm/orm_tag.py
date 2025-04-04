from __future__ import annotations

import sqlalchemy as sa
from sqlalchemy import exc, orm

from backend.database import tag_models
from backend.database.orm.orm_utils import TenantProtectedTable
from backend.database.session import TenantAwareAsyncSession


class TagError(Exception):
    pass


class Tag(TenantProtectedTable):
    __tablename__ = "tags"

    id: orm.Mapped[int] = sa.Column(sa.BigInteger, primary_key=True, autoincrement=True)
    name = sa.Column(sa.String, nullable=False)

    __table_args__ = ((sa.ForeignKeyConstraint(["tenant"], ["organizations.tenant"])),)

    @staticmethod
    async def get_all_tags(session: TenantAwareAsyncSession) -> list[tag_models.Tag]:
        result = await session.execute(sa.select(Tag))
        return [tag_models.Tag.from_orm(tag) for tag in result.scalars().all()]

    @staticmethod
    async def create_tag(session: TenantAwareAsyncSession, name: str) -> tag_models.Tag:
        try:
            tag = Tag(name=name, tenant=session.tenant)
            session.add(tag)
            await session.flush()
            return tag_models.Tag.from_orm(tag)
        except exc.IntegrityError:
            raise TagError(f"Archive with {name=} already exists")
