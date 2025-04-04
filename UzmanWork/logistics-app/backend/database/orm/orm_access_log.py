from __future__ import annotations

import sqlalchemy as sa

from backend.access_logs.constants import UserActions
from backend.database import models
from backend.database.orm.orm_utils import TenantProtectedTable
from backend.database.session import TenantAwareAsyncSession
from backend.utils import AwareDatetime


class AccessLog(TenantProtectedTable):
    __tablename__ = "access_logs"
    timestamp = sa.Column(sa.TIMESTAMP(timezone=True), nullable=False)
    action = sa.Column(sa.Enum(UserActions), nullable=False)
    user_email = sa.Column(sa.String, nullable=False)
    ip_address = sa.Column(sa.String, nullable=False)
    details = sa.Column(sa.JSON)
    __table_args__ = ((sa.ForeignKeyConstraint(["tenant"], ["organizations.tenant"])),)
    __mapper_args__ = {"primary_key": [timestamp, action, user_email, ip_address]}

    @staticmethod
    async def new_log(
        session: TenantAwareAsyncSession,
        *,
        action: UserActions,
        user_email: str,
        ip_address: str,
        details: dict[str, str] | None = None,
    ) -> None:
        stmt = sa.insert(AccessLog).values(
            timestamp=sa.func.now(),
            tenant=session.tenant,
            action=action.value,
            user_email=user_email,
            ip_address=ip_address,
            details=details,
        )
        await session.execute(stmt)

    @staticmethod
    async def get_access_logs(
        session: TenantAwareAsyncSession,
        start_time: AwareDatetime,
        end_time: AwareDatetime,
    ) -> list[models.AccessLog]:
        stmt = sa.select(AccessLog).where(
            AccessLog.timestamp >= start_time, AccessLog.timestamp <= end_time
        )
        result = await session.execute(stmt)
        return [models.AccessLog.from_orm(log) for log in result.scalars().all()]
