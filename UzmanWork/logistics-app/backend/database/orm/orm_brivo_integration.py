import sqlalchemy as sa
from sqlalchemy.exc import NoResultFound

from backend.database import brivo_integration_models as models
from backend.database.orm.orm_utils import TenantProtectedTable
from backend.database.session import TenantAwareAsyncSession


class BrivoIntegration(TenantProtectedTable):
    __tablename__ = "brivo_integrations"

    refresh_token = sa.Column(sa.String, nullable=False)
    api_key = sa.Column(sa.String)

    __table_args__ = (
        (sa.ForeignKeyConstraint(["tenant"], ["organizations.tenant"])),
        sa.PrimaryKeyConstraint("tenant"),
    )

    @staticmethod
    async def has_brivo_integration(session: TenantAwareAsyncSession) -> bool:
        query = sa.select(sa.exists().select_from(BrivoIntegration))
        result = await session.execute(query)
        return bool(result.scalar_one())

    @staticmethod
    async def upsert_refresh_token(
        session: TenantAwareAsyncSession, refresh_token: str
    ) -> None:
        row_count = (
            await session.execute(
                sa.dialects.postgresql.insert(BrivoIntegration)
                .values(tenant=session.tenant, refresh_token=refresh_token)
                .on_conflict_do_update(
                    index_elements=["tenant"], set_=dict(refresh_token=refresh_token)
                )
            )
        ).rowcount  # type: ignore

        if row_count != 1:
            raise models.BrivoIntegrationNotFoundError("Brivo Integration not found")

    @staticmethod
    async def get_api_key(session: TenantAwareAsyncSession) -> str:
        query = sa.select(BrivoIntegration.api_key)
        result = await session.execute(query)
        try:
            return str(result.scalar_one())
        except NoResultFound:
            raise models.BrivoIntegrationNotFoundError("Brivo Integration not found")

    @staticmethod
    async def set_api_key(session: TenantAwareAsyncSession, api_key: str) -> None:
        row_count = (
            await session.execute(sa.update(BrivoIntegration).values(api_key=api_key))
        ).rowcount  # type: ignore

        if row_count != 1:
            raise models.BrivoIntegrationNotFoundError("Brivo Integration not found")

    @staticmethod
    async def get_brivo_integration(
        session: TenantAwareAsyncSession,
    ) -> models.BrivoIntegration | None:
        result = (
            await session.execute(sa.select(BrivoIntegration))
        ).scalar_one_or_none()

        return models.BrivoIntegration.from_orm(result) if result else None

    @staticmethod
    async def delete_brivo_integration(session: TenantAwareAsyncSession) -> None:
        await session.execute(sa.delete(BrivoIntegration))
