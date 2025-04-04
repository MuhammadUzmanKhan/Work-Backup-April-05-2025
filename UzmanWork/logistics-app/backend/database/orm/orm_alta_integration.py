import sqlalchemy as sa

from backend.database import alta_integration_models as models
from backend.database.orm.orm_utils import TenantProtectedTable
from backend.database.session import TenantAwareAsyncSession


class AltaIntegration(TenantProtectedTable):
    __tablename__ = "alta_integrations"

    public_key = sa.Column(sa.String, nullable=False)
    private_key = sa.Column(sa.String, nullable=False)
    cert_id = sa.Column(sa.Integer, nullable=False)
    org_id = sa.Column(sa.Integer, nullable=False)
    external_user_id = sa.Column(sa.Integer, nullable=True)
    cloud_key_credential_id = sa.Column(sa.Integer, nullable=True)

    __table_args__ = (
        (sa.ForeignKeyConstraint(["tenant"], ["organizations.tenant"])),
        sa.PrimaryKeyConstraint("tenant"),
    )

    @staticmethod
    async def has_alta_integration(session: TenantAwareAsyncSession) -> bool:
        query = sa.select(sa.exists().select_from(AltaIntegration))
        result = await session.execute(query)
        return bool(result.scalar_one())

    @staticmethod
    async def update_integration_auth_data(
        session: TenantAwareAsyncSession,
        public_key: str,
        private_key: str,
        cert_id: int,
        org_id: int,
    ) -> None:
        command = (
            sa.dialects.postgresql.insert(AltaIntegration)
            .values(
                tenant=session.tenant,
                public_key=public_key,
                private_key=private_key,
                cert_id=cert_id,
                org_id=org_id,
            )
            .on_conflict_do_update(
                index_elements=["tenant"],
                set_=dict(
                    public_key=public_key,
                    private_key=private_key,
                    cert_id=cert_id,
                    org_id=org_id,
                ),
            )
        )
        await session.execute(command)

    @staticmethod
    async def update_integration_user_and_cloud_key_credential(
        session: TenantAwareAsyncSession,
        external_user_id: int | None = None,
        cloud_key_credential_id: int | None = None,
    ) -> None:
        row_count = (
            await session.execute(
                sa.update(AltaIntegration).values(
                    external_user_id=external_user_id,
                    cloud_key_credential_id=cloud_key_credential_id,
                )
            )
        ).rowcount  # type: ignore

        if row_count != 1:
            raise models.AltaIntegrationNotFoundError("Alta Integration not found")

    @staticmethod
    async def get_alta_integration(
        session: TenantAwareAsyncSession,
    ) -> models.AltaIntegration | None:
        command = sa.select(AltaIntegration)
        result = await session.execute(command)
        integration = result.scalar_one_or_none()
        return models.AltaIntegration.from_orm(integration) if integration else None

    @staticmethod
    async def delete_alta_integration(session: TenantAwareAsyncSession) -> None:
        await session.execute(sa.delete(AltaIntegration))
